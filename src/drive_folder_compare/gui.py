from __future__ import annotations

import threading
import tkinter as tk
from pathlib import Path
from tkinter import filedialog, messagebox, scrolledtext

from .compare import compare_inventories
from .drive import scan_drive_folder
from .formatting import windows_size
from .local import scan_local_folder
from .report import write_report


class CompareApp(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("Comparador Google Drive x Pasta Local")
        self.geometry("820x560")
        self._build_widgets()

    def _build_widgets(self) -> None:
        tk.Label(self, text="Link da pasta do Google Drive:").pack(anchor="w", padx=12, pady=(12, 2))
        self.drive_entry = tk.Entry(self)
        self.drive_entry.pack(fill="x", padx=12)

        tk.Label(self, text="Pasta local:").pack(anchor="w", padx=12, pady=(12, 2))
        local_row = tk.Frame(self)
        local_row.pack(fill="x", padx=12)
        self.local_entry = tk.Entry(local_row)
        self.local_entry.pack(side="left", fill="x", expand=True)
        tk.Button(local_row, text="Escolher...", command=self._choose_local).pack(side="left", padx=(8, 0))

        tk.Label(self, text="Pasta para salvar relatórios:").pack(anchor="w", padx=12, pady=(12, 2))
        output_row = tk.Frame(self)
        output_row.pack(fill="x", padx=12)
        self.output_entry = tk.Entry(output_row)
        self.output_entry.insert(0, str(Path.cwd() / "relatorio_comparacao_drive"))
        self.output_entry.pack(side="left", fill="x", expand=True)
        tk.Button(output_row, text="Escolher...", command=self._choose_output).pack(side="left", padx=(8, 0))

        self.ignore_case = tk.BooleanVar(value=False)
        tk.Checkbutton(self, text="Ignorar maiúsculas/minúsculas no caminho", variable=self.ignore_case).pack(anchor="w", padx=12, pady=8)
        tk.Button(self, text="Comparar", command=self._start).pack(anchor="w", padx=12)

        self.log = scrolledtext.ScrolledText(self, height=20)
        self.log.pack(fill="both", expand=True, padx=12, pady=12)

    def _choose_local(self) -> None:
        folder = filedialog.askdirectory(title="Escolha a pasta local")
        if folder:
            self.local_entry.delete(0, tk.END)
            self.local_entry.insert(0, folder)

    def _choose_output(self) -> None:
        folder = filedialog.askdirectory(title="Escolha onde salvar os relatórios")
        if folder:
            self.output_entry.delete(0, tk.END)
            self.output_entry.insert(0, folder)

    def _append(self, message: str) -> None:
        self.log.insert(tk.END, message + "\n")
        self.log.see(tk.END)

    def _threadsafe_log(self, message: str) -> None:
        self.after(0, self._append, message)

    def _start(self) -> None:
        thread = threading.Thread(target=self._run_compare, daemon=True)
        thread.start()

    def _run_compare(self) -> None:
        try:
            drive_link = self.drive_entry.get().strip()
            local_folder = self.local_entry.get().strip()
            output = self.output_entry.get().strip()
            if not drive_link or not local_folder or not output:
                raise ValueError("Preencha link do Drive, pasta local e pasta de relatórios.")
            self._threadsafe_log("Lendo pasta local...")
            local_files = scan_local_folder(local_folder)
            self._threadsafe_log(f"Arquivos locais: {len(local_files)} ({windows_size(sum(item.size for item in local_files))})")
            drive_files = scan_drive_folder(drive_link, progress=self._threadsafe_log)
            self._threadsafe_log(f"Arquivos no Drive: {len(drive_files)} ({windows_size(sum(item.size for item in drive_files))})")
            result = compare_inventories(local_files, drive_files, ignore_case=self.ignore_case.get())
            generated = write_report(output, result)
            self._threadsafe_log("\nResumo:")
            self._threadsafe_log(f"Faltam subir: {len(result.missing_on_drive)} arquivos / {windows_size(sum(item.size for item in result.missing_on_drive))}")
            self._threadsafe_log(f"Só no Drive: {len(result.extra_on_drive)} arquivos / {windows_size(sum(item.size for item in result.extra_on_drive))}")
            self._threadsafe_log(f"Tamanho diferente: {len(result.size_mismatches)} arquivos")
            self._threadsafe_log("Relatórios:")
            for path in generated:
                self._threadsafe_log(str(path))
            self.after(0, messagebox.showinfo, "Concluído", "Comparação finalizada. Veja os CSVs gerados.")
        except Exception as exc:
            self._threadsafe_log(f"ERRO: {exc}")
            self.after(0, messagebox.showerror, "Erro", str(exc))


def main() -> None:
    app = CompareApp()
    app.mainloop()


if __name__ == "__main__":
    main()
