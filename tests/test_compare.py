from drive_folder_compare.compare import compare_inventories, normalize_path
from drive_folder_compare.formatting import windows_size
from drive_folder_compare.models import FileEntry


def test_normalize_path_uses_forward_slashes_and_case_option():
    assert normalize_path(r"A\\B/file.txt") == "A/B/file.txt"
    assert normalize_path(r"A\\B/file.txt", ignore_case=True) == "a/b/file.txt"


def test_compare_inventories_finds_missing_extra_and_mismatch():
    local = [
        FileEntry("ok.mp4", 10),
        FileEntry("missing.mp4", 20),
        FileEntry("different.mp4", 30),
    ]
    drive = [
        FileEntry("ok.mp4", 10),
        FileEntry("extra.mp4", 40),
        FileEntry("different.mp4", 31),
    ]

    result = compare_inventories(local, drive)

    assert [item.path for item in result.matching] == ["ok.mp4"]
    assert [item.path for item in result.missing_on_drive] == ["missing.mp4"]
    assert [item.path for item in result.extra_on_drive] == ["extra.mp4"]
    assert len(result.size_mismatches) == 1
    assert result.size_mismatches[0].path == "different.mp4"


def test_windows_size_formatting():
    assert windows_size(500) == "500 bytes"
    assert windows_size(1024) == "1.00 KB"
    assert windows_size(1024 * 1024) == "1.00 MB"
