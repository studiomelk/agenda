from __future__ import annotations

from pathlib import Path

from .models import FileEntry


def scan_local_folder(folder: str | Path) -> list[FileEntry]:
    """Recursively scan a local folder and return relative file paths and sizes."""

    root = Path(folder).expanduser().resolve()
    if not root.exists():
        raise FileNotFoundError(f"Local folder does not exist: {root}")
    if not root.is_dir():
        raise NotADirectoryError(f"Local path is not a folder: {root}")

    entries: list[FileEntry] = []
    for path in root.rglob("*"):
        if path.is_file():
            rel_path = path.relative_to(root).as_posix()
            entries.append(FileEntry(path=rel_path, size=path.stat().st_size))
    return sorted(entries, key=lambda item: item.path.casefold())
