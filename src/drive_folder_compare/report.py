from __future__ import annotations

import csv
from pathlib import Path

from .formatting import windows_size
from .models import ComparisonResult, Difference, FileEntry


def write_entries_csv(path: Path, entries: tuple[FileEntry, ...]) -> None:
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.writer(handle)
        writer.writerow(["Caminho", "TamanhoBytes", "TamanhoWindows"])
        for item in entries:
            writer.writerow([item.path, item.size, windows_size(item.size)])


def write_mismatches_csv(path: Path, entries: tuple[Difference, ...]) -> None:
    with path.open("w", newline="", encoding="utf-8-sig") as handle:
        writer = csv.writer(handle)
        writer.writerow(["Caminho", "TamanhoLocalBytes", "TamanhoDriveBytes", "TamanhoLocalWindows", "TamanhoDriveWindows"])
        for item in entries:
            local_size = item.local_size or 0
            drive_size = item.drive_size or 0
            writer.writerow([item.path, item.local_size, item.drive_size, windows_size(local_size), windows_size(drive_size)])


def write_report(output_dir: str | Path, result: ComparisonResult) -> list[Path]:
    """Write CSV reports and return generated paths."""

    root = Path(output_dir).expanduser().resolve()
    root.mkdir(parents=True, exist_ok=True)
    files = [
        root / "faltam_subir_para_drive.csv",
        root / "existem_so_no_drive.csv",
        root / "tamanho_diferente.csv",
        root / "arquivos_ok.csv",
    ]
    write_entries_csv(files[0], result.missing_on_drive)
    write_entries_csv(files[1], result.extra_on_drive)
    write_mismatches_csv(files[2], result.size_mismatches)
    write_entries_csv(files[3], result.matching)
    return files
