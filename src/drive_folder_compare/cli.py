from __future__ import annotations

import argparse
from pathlib import Path

from .compare import compare_inventories
from .drive import scan_drive_folder
from .formatting import windows_size
from .local import scan_local_folder
from .report import write_report


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Compare a public Google Drive folder with a local folder.",
    )
    parser.add_argument("--drive-link", required=True, help="Google Drive folder link or folder ID.")
    parser.add_argument("--local-folder", required=True, help="Local folder to compare.")
    parser.add_argument("--output", default="relatorio_comparacao_drive", help="Folder for CSV reports.")
    parser.add_argument("--workers", type=int, default=12, help="Parallel size checks for Drive files.")
    parser.add_argument("--ignore-case", action="store_true", help="Compare paths ignoring uppercase/lowercase.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)

    def progress(message: str) -> None:
        print(message, flush=True)

    local_files = scan_local_folder(args.local_folder)
    progress(f"Arquivos locais: {len(local_files)} ({windows_size(sum(item.size for item in local_files))})")
    drive_files = scan_drive_folder(args.drive_link, workers=args.workers, progress=progress)
    progress(f"Arquivos no Drive: {len(drive_files)} ({windows_size(sum(item.size for item in drive_files))})")

    result = compare_inventories(local_files, drive_files, ignore_case=args.ignore_case)
    generated = write_report(Path(args.output), result)

    print("\nResumo")
    print(f"- Locais: {result.local_count} arquivos / {windows_size(result.local_bytes)}")
    print(f"- Drive: {result.drive_count} arquivos / {windows_size(result.drive_bytes)}")
    print(f"- Faltam subir: {len(result.missing_on_drive)} arquivos / {windows_size(sum(item.size for item in result.missing_on_drive))}")
    print(f"- Só no Drive: {len(result.extra_on_drive)} arquivos / {windows_size(sum(item.size for item in result.extra_on_drive))}")
    print(f"- Tamanho diferente: {len(result.size_mismatches)} arquivos")
    print("\nRelatórios gerados:")
    for path in generated:
        print(f"- {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
