from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Callable
from urllib.parse import urlencode

import requests
from bs4 import BeautifulSoup

from .models import FileEntry

FOLDER_MIME = "application/vnd.google-apps.folder"
ProgressCallback = Callable[[str], None]


@dataclass
class DriveNode:
    id: str
    name: str
    mime_type: str
    children: list["DriveNode"] = field(default_factory=list)

    @property
    def is_folder(self) -> bool:
        return self.mime_type == FOLDER_MIME


def extract_folder_id(link_or_id: str) -> str:
    """Extract a Google Drive folder ID from a full link or return the ID itself."""

    value = link_or_id.strip()
    patterns = (
        r"/drive/folders/([\w-]+)",
        r"[?&]id=([\w-]+)",
        r"^([\w-]{20,})$",
    )
    for pattern in patterns:
        match = re.search(pattern, value)
        if match:
            return match.group(1)
    raise ValueError("Could not find a Google Drive folder ID in the provided link.")


def _sanitize_name(name: str) -> str:
    return name.replace("/", "_").replace("\\", "_").strip()


def _parse_embedded_folder(session: requests.Session, folder_id: str) -> tuple[str, list[DriveNode]]:
    url = f"https://drive.google.com/embeddedfolderview?{urlencode({'id': folder_id})}"
    response = session.get(url, timeout=60)
    response.raise_for_status()
    soup = BeautifulSoup(response.text, "html.parser")
    if soup.title is None or soup.title.string is None:
        raise RuntimeError(f"Could not parse Google Drive folder listing: {folder_id}")

    children: list[DriveNode] = []
    for tag in soup.find_all("a"):
        href = tag.get("href", "")
        if not isinstance(href, str):
            continue
        name = _sanitize_name(tag.get_text(strip=True))
        file_match = re.match(r"https://drive\.google\.com/file/d/([-\w]{20,})/view", href)
        docs_match = re.match(r"https://docs\.google\.com/\w+/d/([-\w]{20,})/", href)
        folder_match = re.match(r"https://drive\.google\.com/drive/folders/([-\w]{20,})", href)
        if file_match:
            children.append(DriveNode(file_match.group(1), name, "application/octet-stream"))
        elif docs_match:
            children.append(DriveNode(docs_match.group(1), name, "application/octet-stream"))
        elif folder_match:
            children.append(DriveNode(folder_match.group(1), name, FOLDER_MIME))
    return _sanitize_name(soup.title.string), children


def fetch_drive_tree(
    folder_link_or_id: str,
    *,
    progress: ProgressCallback | None = None,
) -> DriveNode:
    """Fetch the public Google Drive folder tree using the embedded folder view."""

    session = requests.Session()
    folder_id = extract_folder_id(folder_link_or_id)

    def walk(current_id: str) -> DriveNode:
        name, children = _parse_embedded_folder(session, current_id)
        node = DriveNode(current_id, name, FOLDER_MIME)
        for child in children:
            if child.is_folder:
                if progress:
                    progress(f"Lendo pasta do Drive: {child.name}")
                node.children.append(walk(child.id))
                node.children[-1].name = child.name
            else:
                node.children.append(child)
        return node

    if progress:
        progress("Lendo estrutura do Google Drive...")
    return walk(folder_id)


def _iter_file_nodes(node: DriveNode, parent: str = "") -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    for child in node.children:
        path = f"{parent}/{child.name}".strip("/")
        if child.is_folder:
            rows.extend(_iter_file_nodes(child, path))
        else:
            rows.append((child.id, path))
    return rows


def _hidden_inputs(html: str) -> dict[str, str]:
    return dict(re.findall(r'name="([^"]+)" value="([^"]*)"', html))


def _size_from_headers(response: requests.Response) -> int | None:
    content_range = response.headers.get("content-range")
    if content_range and "/" in content_range:
        total = content_range.rsplit("/", 1)[1]
        if total.isdigit():
            return int(total)
    content_length = response.headers.get("content-length")
    if content_length and content_length.isdigit():
        return int(content_length)
    return None


def get_drive_file_size(file_id: str) -> int:
    """Get a Drive file size without downloading the full file when possible."""

    session = requests.Session()
    headers = {"Range": "bytes=0-0"}
    first = session.get(
        "https://drive.google.com/uc",
        params={"export": "download", "id": file_id},
        headers=headers,
        stream=True,
        timeout=60,
    )
    try:
        size = _size_from_headers(first)
        content_type = first.headers.get("content-type", "")
        if size is not None and not content_type.startswith("text/html"):
            return size
        if content_type.startswith("text/html"):
            params = _hidden_inputs(first.text)
            if params:
                second = session.get(
                    "https://drive.usercontent.google.com/download",
                    params=params,
                    headers=headers,
                    stream=True,
                    timeout=60,
                )
                try:
                    size = _size_from_headers(second)
                    if size is not None:
                        return size
                finally:
                    second.close()
        if size is not None:
            return size
    finally:
        first.close()
    raise RuntimeError(f"Could not determine file size for Drive file ID: {file_id}")


def scan_drive_folder(
    folder_link_or_id: str,
    *,
    workers: int = 12,
    progress: ProgressCallback | None = None,
) -> list[FileEntry]:
    """Recursively scan a public Google Drive folder and include file sizes."""

    tree = fetch_drive_tree(folder_link_or_id, progress=progress)
    rows = _iter_file_nodes(tree)
    if progress:
        progress(f"Calculando tamanhos de {len(rows)} arquivos do Drive...")

    def build_entry(row: tuple[str, str]) -> FileEntry:
        file_id, path = row
        return FileEntry(path=path, size=get_drive_file_size(file_id), source_id=file_id)

    entries: list[FileEntry] = []
    with ThreadPoolExecutor(max_workers=max(1, workers)) as executor:
        futures = [executor.submit(build_entry, row) for row in rows]
        for index, future in enumerate(as_completed(futures), start=1):
            entries.append(future.result())
            if progress and index % 25 == 0:
                progress(f"Tamanhos lidos: {index}/{len(rows)}")
    return sorted(entries, key=lambda item: item.path.casefold())
