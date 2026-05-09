from __future__ import annotations


def windows_size(num_bytes: int) -> str:
    """Format bytes like Windows Explorer: base 1024, labels KB/MB/GB."""

    units = ("bytes", "KB", "MB", "GB", "TB", "PB")
    value = float(num_bytes)
    unit_index = 0
    while value >= 1024 and unit_index < len(units) - 1:
        value /= 1024
        unit_index += 1
    if unit_index == 0:
        return f"{num_bytes} bytes"
    return f"{value:,.2f} {units[unit_index]}"
