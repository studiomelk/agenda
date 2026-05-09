from __future__ import annotations

import unicodedata
from collections.abc import Iterable

from .models import ComparisonResult, Difference, FileEntry


def normalize_path(path: str, *, ignore_case: bool = False) -> str:
    """Normalize inventory paths for comparison."""

    normalized = unicodedata.normalize("NFC", path.replace("\\", "/")).strip("/")
    while "//" in normalized:
        normalized = normalized.replace("//", "/")
    if ignore_case:
        normalized = normalized.casefold()
    return normalized


def compare_inventories(
    local_files: Iterable[FileEntry],
    drive_files: Iterable[FileEntry],
    *,
    ignore_case: bool = False,
) -> ComparisonResult:
    """Compare local and Drive file inventories by relative path and size."""

    local = {normalize_path(item.path, ignore_case=ignore_case): item for item in local_files}
    drive = {normalize_path(item.path, ignore_case=ignore_case): item for item in drive_files}

    missing_keys = sorted(set(local) - set(drive))
    extra_keys = sorted(set(drive) - set(local))
    common_keys = sorted(set(local) & set(drive))

    matching: list[FileEntry] = []
    mismatches: list[Difference] = []
    for key in common_keys:
        local_item = local[key]
        drive_item = drive[key]
        if local_item.size == drive_item.size:
            matching.append(local_item)
        else:
            mismatches.append(
                Difference(
                    path=local_item.path,
                    local_size=local_item.size,
                    drive_size=drive_item.size,
                )
            )

    local_values = tuple(local.values())
    drive_values = tuple(drive.values())
    return ComparisonResult(
        local_count=len(local_values),
        drive_count=len(drive_values),
        local_bytes=sum(item.size for item in local_values),
        drive_bytes=sum(item.size for item in drive_values),
        matching=tuple(matching),
        missing_on_drive=tuple(local[key] for key in missing_keys),
        extra_on_drive=tuple(drive[key] for key in extra_keys),
        size_mismatches=tuple(mismatches),
    )
