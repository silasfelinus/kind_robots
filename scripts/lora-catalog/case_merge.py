#!/usr/bin/env python3
"""
case_merge.py — consolidate case-duplicate folders into one canonical casing.

On a case-SENSITIVE filesystem (Linux/XFS, e.g. an unRAID array) `Flux` and
`FLUX` are two different folders. Accessed over SMB from a case-INSENSITIVE
client (Windows/macOS) this causes phantom/empty listings and other bugs. This
happens when a sorted library mixes an old manual casing with a new one.

Run this ON THE LINUX HOST (never from the case-insensitive client — that can
corrupt or lose data). It merges any case-variant of a known folder name into
the canonical casing used by scan_loras.py / scan_models.py.

Safety: it NEVER deletes a file. Non-conflicting files are moved into the
canonical-cased folder; same-name conflicts are left in place and reported;
only emptied folders are removed. Dry-run by default — pass --apply to execute.

Usage:
  python3 case_merge.py /mnt/user/pc/ai/models/Lora            # dry-run
  python3 case_merge.py /mnt/user/pc/ai/models/Lora --apply    # do it
  python3 case_merge.py /mnt/user/pc/ai/models/checkpoints --apply
"""

import collections
import os
import shutil
import sys

# canonical casing for the folder names scan_loras.py / scan_models.py produce
CANON = {
    "sd15": "SD15", "sdxl": "SDXL", "pony": "Pony", "illustrious": "Illustrious",
    "noobai": "NoobAI", "flux": "Flux", "kontext": "Kontext", "video": "Video",
    "krea": "Krea", "sd3": "SD3", "qwen": "Qwen", "zimage": "ZImage", "3d": "3D",
    "ltx": "LTX", "wan": "Wan", "svd": "SVD", "hunyuan": "Hunyuan",
    "audio": "Audio", "unknown": "Unknown", "other": "Other",
    "sfw": "SFW", "nsfw": "NSFW", "review": "REVIEW",
}


def canon_of(name: str) -> str:
    return CANON.get(name.lower(), name)


def consolidate(parent: str, apply: bool) -> list[str]:
    if not os.path.isdir(parent):
        return []
    groups: dict[str, list[str]] = collections.defaultdict(list)
    for e in os.listdir(parent):
        if os.path.isdir(os.path.join(parent, e)):
            groups[canon_of(e)].append(e)

    canon_paths = []
    for canon, variants in groups.items():
        target = os.path.join(parent, canon)
        canon_paths.append(target)
        for v in [x for x in variants if x != canon]:
            src = os.path.join(parent, v)
            n = sum(len(fs) for _, _, fs in os.walk(src))
            print(f"  {'MERGE' if apply else 'would merge'}: {v} ({n} files) -> {canon}   [{parent}]")
            if not apply:
                continue
            if not os.path.exists(target):
                os.rename(src, target)
                continue
            for dp, _, files in os.walk(src):
                rel = os.path.relpath(dp, src)
                td = target if rel == "." else os.path.join(target, rel)
                for f in files:
                    s, d = os.path.join(dp, f), os.path.join(td, f)
                    if os.path.exists(d):
                        print(f"      conflict kept (same name): {s}")
                    else:
                        os.makedirs(td, exist_ok=True)
                        shutil.move(s, d)
            for dp, _, _ in os.walk(src, topdown=False):
                try:
                    os.rmdir(dp)
                except OSError:
                    pass
    return canon_paths


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("-")]
    root = args[0] if args else "."
    apply = "--apply" in sys.argv
    if not os.path.isdir(root):
        print(f"error: not a directory: {root}", file=sys.stderr)
        return 2
    print(f"Root: {root} | {'APPLY' if apply else 'DRY-RUN — add --apply to execute'}")
    print("-- top-level folders --")
    children = consolidate(root, apply)
    print("-- one level down (e.g. SFW/NSFW buckets) --")
    for c in children:
        consolidate(c, apply)
    print("done")
    return 0


if __name__ == "__main__":
    sys.exit(main())
