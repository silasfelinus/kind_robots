from __future__ import annotations

from pathlib import Path

PATH = Path("utils/scripts/snapshotFallback.ts")

OLD = """      'folderName',
      'componentName',
      'isWorking',
      'underConstruction',
      'isBroken',
      'title',
      'notes',"""

NEW = """      'folderName',
      'componentName',
      'slug',
      'sourcePath',
      'sourceKey',
      'sourceHash',
      'status',
      'statusReason',
      'title',
      'description',
      'notes',
      'category',
      'tags',
      'previewMode',
      'previewConfig',
      'lastSeenAt',
      'isDiscovered',
      // Temporary compatibility fields; remove after the contract migration.
      'isWorking',
      'underConstruction',
      'isBroken',"""


def main() -> None:
    source = PATH.read_text(encoding="utf-8")
    count = source.count(OLD)
    if count != 1:
        raise RuntimeError(f"Expected one Component snapshot field block; found {count}.")
    PATH.write_text(source.replace(OLD, NEW, 1), encoding="utf-8")


if __name__ == "__main__":
    main()
