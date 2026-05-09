from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class FileEntry:
    """A file found locally or in Google Drive."""

    path: str
    size: int
    source_id: str | None = None


@dataclass(frozen=True)
class Difference:
    """A comparison difference for a file path."""

    path: str
    local_size: int | None
    drive_size: int | None


@dataclass(frozen=True)
class ComparisonResult:
    """Result of comparing two inventories."""

    local_count: int
    drive_count: int
    local_bytes: int
    drive_bytes: int
    matching: tuple[FileEntry, ...]
    missing_on_drive: tuple[FileEntry, ...]
    extra_on_drive: tuple[FileEntry, ...]
    size_mismatches: tuple[Difference, ...]
