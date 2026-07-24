#!/usr/bin/env python3
"""
scan_models.py — Catalog AND sort NON-LoRA models into ComfyUI's layout.

Companion to scan_loras.py (which handles LoRAs). This one handles everything
else — checkpoints, VAEs, text encoders, diffusion models (UNet), controlnets,
upscalers, etc. — and sorts them into the folders ComfyUI expects, so one clean
library serves both ComfyUI and A1111.

It reuses scan_loras.py's detection core (hashing, safetensors headers, Civitai
+ CivArchive by-hash lookups, base-model map), so keep both files together.

How it classifies each file (in priority order):
  1. **Current folder** — your tree already encodes type (unet/, vae/,
     text_encoders/, controlnet/ ...). This is the most reliable signal and
     works even for files no hash database knows (text encoders, VAEs).
  2. **Civitai / CivArchive by hash** — enriches checkpoints/loras with a
     canonical name, base model, NSFW flag, trigger words.
  3. **safetensors metadata / architecture** — fallback base-model guess.

What it produces:
  - A **move plan** into ComfyUI layout (dry-run by default — nothing moves
    until you pass --organize move):
        checkpoints/<BaseModel>/   (SDXL, Flux, Pony, SD15, ZImage, Video, ...)
        diffusion_models/          (merges the old unet/ folder in)
        text_encoders/  vae/  clip_vision/  controlnet/  hypernetworks/
        embeddings/  upscale_models/  (merges ESRGAN/RealESRGAN/SwinIR/LDSR)
        facerestore_models/  ipadapter/  animatediff_models/  sams/  ...
    Pure tool models (BLIP, RAFT, LLMs, TTS, captioners) are left in place.
  - A **catalog** (lora-... style) with import-ready Resource records for the
    kinds you chose to catalog (default: checkpoints + components).

Only SHA256 hashes are sent to the two public by-hash APIs; files never leave
the machine. --no-civitai --no-archive runs fully offline (classification still
works from folder + metadata).

Examples:
  export CIVITAI_TOKEN=xxxx
  python3 scan_models.py /mnt/user/pc/ai/models --out ./catalog            # dry-run plan + catalog
  python3 scan_models.py /mnt/user/pc/ai/models --out ./catalog --organize move
  python3 scan_models.py /mnt/user/pc/ai/models --overrides overrides.csv
"""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Optional

import scan_loras as core  # shared detection engine (same directory)

# ----------------------------------------------------------------------------
# Type taxonomy: current-folder name -> (kind, comfy_folder)
# ----------------------------------------------------------------------------
# `kind` drives the Resource type; `comfy_folder` is where ComfyUI wants it.
# Matching is done on any path segment (case-insensitive), most specific first.

# kinds we emit Resource records for. Video/audio checkpoints ARE in scope
# (kind_robots has video support: GIFs, effects, animation roadmap).
RESOURCE_KINDS = {"checkpoint", "video_checkpoint", "audio_checkpoint",
                  "diffusion_model", "text_encoder", "vae"}

# kind -> kind_robots ResourceType. Components need enum members that don't
# exist yet (VAE / TEXT_ENCODER / DIFFUSION_MODEL) — the phase-2 migration must
# add them; until then the importer can fall back to CHECKPOINT+generation.
KIND_RESOURCE_TYPE = {
    "checkpoint": "CHECKPOINT",
    "video_checkpoint": "CHECKPOINT",       # generation carries LTX/Wan/SVD
    "audio_checkpoint": "CHECKPOINT",
    "diffusion_model": "DIFFUSION_MODEL",   # NEW enum member (see migration)
    "text_encoder": "TEXT_ENCODER",         # NEW enum member
    "vae": "VAE",                           # NEW enum member
    "controlnet": "CONTROLNET",
    "hypernetwork": "HYPERNETWORK",
    "embedding": "EMBEDDING",
}

# Filename-based component refinement. Video model folders (LTX, SVD, Wan) are
# mixed bundles — the main model sits next to its VAE, text encoder, and
# upscaler. ComfyUI's video nodes expect each of those in its OWN folder, so we
# split them out by filename. Applied only to checkpoint/video/audio kinds, and
# `vae` is boundary-anchored so a checkpoint merely named "...vaemix" is safe.
COMPONENT_REFINE = [
    (re.compile(r"(text[_\-. ]?encoder|text[_\-. ]?projection|t5xxl|umt5|byt5|"
                r"(^|[_\-. ])clip[_\-. ]?[lg]([_\-. ]|$))", re.I),
     "text_encoder", "text_encoders"),
    (re.compile(r"((^|[_\-. ])vae([_\-. ]|$)|image[_\-. ]?decoder)", re.I),
     "vae", "vae"),
    (re.compile(r"(spatial[_\-. ]?upscaler|(^|[_\-. ])upscal|esrgan|swinir)", re.I),
     "upscaler", "upscale_models"),
]


def video_arch(generation: str, relpath: str) -> str:
    g, low = (generation or "").lower(), relpath.replace("\\", "/").lower()
    if "ltx" in g or "ltx" in low:
        return "LTX"
    if "wan" in g or re.search(r"wan2[._-]", low):
        return "Wan"
    if "svd" in g or "svd" in low:
        return "SVD"
    if "hunyuan" in g or "hunyuan" in low:
        return "Hunyuan"
    return "Other"

# Ordered (segment-substring, kind, comfy_folder). First match wins, so put the
# more specific / video-audio cases before the generic "stable-diffusion".
FOLDER_RULES: list[tuple[str, str, str]] = [
    # video / audio checkpoints misfiled under Stable-diffusion or loose
    ("stable-diffusion/svd", "video_checkpoint", "checkpoints"),
    ("stable-diffusion/ltx", "video_checkpoint", "checkpoints"),
    ("stable-diffusion/audio", "audio_checkpoint", "checkpoints"),
    ("/svd", "video_checkpoint", "checkpoints"),
    ("/ltx", "video_checkpoint", "checkpoints"),
    ("svd", "video_checkpoint", "checkpoints"),
    ("animatediff", "animatediff", "animatediff_models"),
    # components
    ("unet", "diffusion_model", "diffusion_models"),
    ("diffusion_models", "diffusion_model", "diffusion_models"),
    ("text_encoders", "text_encoder", "text_encoders"),
    ("text_encoder", "text_encoder", "text_encoders"),
    ("clip_vision", "clip_vision", "clip_vision"),
    ("clip", "text_encoder", "text_encoders"),
    ("vae-approx", "vae_approx", "vae_approx"),
    ("vae", "vae", "vae"),
    # conditioning / adapters
    ("controlnet", "controlnet", "controlnet"),
    ("t2i", "controlnet", "controlnet"),
    ("ipadapter", "ipadapter", "ipadapter"),
    ("gligen", "gligen", "gligen"),
    ("hypernetworks", "hypernetwork", "hypernetworks"),
    ("hypernetwork", "hypernetwork", "hypernetworks"),
    ("embeddings", "embedding", "embeddings"),
    ("embedding", "embedding", "embeddings"),
    ("style_models", "style_model", "style_models"),
    ("photomaker", "photomaker", "photomaker"),
    # upscalers -> unify
    ("esrgan", "upscaler", "upscale_models"),
    ("realesrgan", "upscaler", "upscale_models"),
    ("swinir", "upscaler", "upscale_models"),
    ("ldsr", "upscaler", "upscale_models"),
    ("latent_upscale_models", "upscaler", "upscale_models"),
    ("upscale_models", "upscaler", "upscale_models"),
    # face restore / detection / segmentation
    ("gfpgan", "facerestore", "facerestore_models"),
    ("codeformer", "facerestore", "facerestore_models"),
    ("facerestore", "facerestore", "facerestore_models"),
    ("ultralytics", "detection", "ultralytics"),
    ("sams", "segment", "sams"),
    ("/sam", "segment", "sams"),
    # checkpoints (generic; keep last so specific SD subfolders above win)
    ("stable-diffusion", "checkpoint", "checkpoints"),
    ("checkpoints", "checkpoint", "checkpoints"),
]

# Pure tool models — leave in place, don't sort, don't catalog.
TOOL_SEGMENTS = {
    "blip", "clip_interrogator", "codeformer", "raft", "flower", "llm",
    "prompt_generator", "torch_deepdanbooru", "tts", "liveportrait", "text",
    "deepbooru", "torch", "sam2",
}

# base-model hints matched against the whole relpath (folder + filename),
# for offline checkpoint sub-bucketing. ORDER MATTERS — specific / unambiguous
# architecture names come FIRST so a filename signal beats a misleading parent
# folder (e.g. a ZImage model mistakenly filed under Stable-diffusion/Flux/).
FOLDER_BASE_HINTS = [
    ("kontext", "KONTEXT", "Flux.1 Kontext"),
    ("illustrious", "SDXL", "Illustrious"),
    ("noobai", "SDXL", "NoobAI"),
    ("pony", "SDXL", "Pony"),
    ("z-image", "GENERIC", "ZImage"),
    ("zimage", "GENERIC", "ZImage"),
    ("qwen", "GENERIC", "Qwen"),
    ("wan2", "GENERIC", "Wan Video"),
    ("wan_", "GENERIC", "Wan Video"),
    ("wan-", "GENERIC", "Wan Video"),
    ("hunyuan", "GENERIC", "Hunyuan"),
    ("flux", "FLUX", "Flux.1"),
    ("sdxl", "SDXL", "SDXL 1.0"),
    ("xl", "SDXL", "SDXL 1.0"),
    ("sd15", "SD15", "SD 1.5"),
    ("1.5", "SD15", "SD 1.5"),
    ("svd", "GENERIC", "SVD Video"),
    ("ltx", "GENERIC", "LTX Video"),
    ("audio", "GENERIC", "Audio"),
    ("3d", "GENERIC", "3D"),
]


def checkpoint_group(generation: str, server: str, relpath: str) -> str:
    """Sort-folder for a checkpoint, aware of newer architectures that the
    generic base->group map (in scan_loras) doesn't cover yet."""
    g = (generation or "").lower()
    low = relpath.replace("\\", "/").lower()
    if "zimage" in g or "z-image" in g or "zimage" in low:
        return "ZImage"
    if "qwen" in g or "qwen" in low:
        return "Qwen"
    if "wan" in g or re.search(r"wan2[._-]", low):
        return "Wan"
    if "hunyuan" in g or "hunyuan" in low or g == "3d":
        return "3D"
    return core.folder_group(generation, server)


@dataclass
class ModelEntry:
    filename: str = ""
    relpath: str = ""
    abspath: str = ""
    size_bytes: int = 0
    sha256: str = ""

    kind: str = ""              # checkpoint | diffusion_model | vae | ...
    comfy_folder: str = ""      # target folder under the models root
    target_rel: str = ""        # full relative target path

    # Resource fields (populated for RESOURCE_KINDS)
    name: str = ""
    customLabel: str = ""
    resourceType: str = ""
    supportedServer: str = "UNKNOWN"
    generation: str = ""
    isMature: bool = False
    civitaiUrl: str = ""
    customUrl: str = ""
    triggerWords: str = ""
    defaultTrigger: str = ""
    description: str = ""
    slug: str = ""

    base_source: str = ""
    maturity_source: str = ""
    civitai_matched: bool = False
    archive_matched: bool = False
    needs_review: bool = True
    is_tool: bool = False       # left in place, not cataloged
    notes: list[str] = field(default_factory=list)


def classify(relpath: str) -> tuple[str, str, bool]:
    """Return (kind, comfy_folder, is_tool) from the file's current path."""
    p = "/" + relpath.replace("\\", "/").lower()
    segments = set(s for s in p.split("/") if s)
    # tool models first — leave them alone
    if segments & TOOL_SEGMENTS:
        top = relpath.replace("\\", "/").split("/")[0]
        return "tool", top, True
    kind, folder = "unknown", "checkpoints"  # default: treat as checkpoint, flag
    for needle, k, f in FOLDER_RULES:
        if needle in p:
            kind, folder = k, f
            break
    # split a component (VAE/text-encoder/upscaler) out of a bundle folder by name
    if kind in ("checkpoint", "video_checkpoint", "audio_checkpoint", "unknown"):
        fname = relpath.replace("\\", "/").split("/")[-1]
        for rx, ck, cf in COMPONENT_REFINE:
            if rx.search(fname):
                return ck, cf, False
    return kind, folder, False


def folder_base_hint(relpath: str) -> tuple[str, str]:
    low = relpath.replace("\\", "/").lower()
    for needle, server, gen in FOLDER_BASE_HINTS:
        if needle in low:
            return server, gen
    return "", ""


def civitai_type_to_kind(mtype: str) -> str:
    m = (mtype or "").lower()
    return {
        "checkpoint": "checkpoint", "textualinversion": "embedding",
        "hypernetwork": "hypernetwork", "controlnet": "controlnet",
        "vae": "vae", "lora": "lora", "locon": "lora", "upscaler": "upscaler",
    }.get(m, "")


def build_entry(path: Path, root: Path, cache: core.Cache,
                no_hash: bool = False) -> tuple[ModelEntry, dict]:
    st = path.stat()
    e = ModelEntry()
    e.abspath = str(path.resolve())
    e.relpath = str(path.relative_to(root))
    e.filename = path.name
    e.name = path.stem
    e.size_bytes = st.st_size
    if not no_hash:
        key = core.cache_key(path, st)
        cached = cache.get_hash(key)
        e.sha256 = cached or core.sha256_file(path)
        if not cached:
            cache.put_hash(key, e.sha256)
    e.kind, e.comfy_folder, e.is_tool = classify(e.relpath)
    meta = {}
    if path.suffix.lower() == ".safetensors":
        meta, _names = core.read_safetensors_header(path)
    return e, meta


def enrich_civitai(e: ModelEntry, data) -> bool:
    if not core._matched(data):
        return False
    model = data.get("model") or {}
    e.civitai_matched = True
    mid, vid = data.get("modelId"), data.get("id")
    if mid:
        e.civitaiUrl = f"https://civitai.com/models/{mid}" + (f"?modelVersionId={vid}" if vid else "")
    if model.get("name"):
        e.customLabel = model["name"]
    ck = civitai_type_to_kind(model.get("type", ""))
    if ck and e.kind in ("unknown", "checkpoint"):
        e.kind = ck  # trust Civitai over a guessed checkpoint
    words = data.get("trainedWords") or []
    if isinstance(words, list) and words:
        e.triggerWords = ", ".join(str(w) for w in words if w)
    base = (data.get("baseModel") or "").strip()
    if base:
        e.supportedServer, e.generation = core.map_base(base)
        e.base_source = "civitai"
    if model.get("nsfw") is not None:
        e.isMature = bool(model["nsfw"])
        e.maturity_source = "civitai"
    return True


def enrich_archive(e: ModelEntry, data) -> bool:
    if not core._matched(data):
        return False
    model = data.get("model") or {}
    if not model:
        return False
    e.archive_matched = True
    version = model.get("version") or {}
    mid, vid = model.get("id"), version.get("id")
    if mid:
        e.customUrl = f"https://civitaiarchive.com/models/{mid}" + (f"?modelVersionId={vid}" if vid else "")
        e.civitaiUrl = e.civitaiUrl or (f"https://civitai.com/models/{mid}" + (f"?modelVersionId={vid}" if vid else ""))
    if model.get("name") and not e.customLabel:
        e.customLabel = model["name"]
    ck = civitai_type_to_kind(model.get("type", ""))
    if ck and e.kind in ("unknown", "checkpoint"):
        e.kind = ck
    trig = version.get("trigger") or []
    if isinstance(trig, list) and trig and not e.triggerWords:
        e.triggerWords = ", ".join(str(w) for w in trig if w)
    base = (version.get("baseModel") or "").strip()
    if base and not e.base_source:
        e.supportedServer, e.generation = core.map_base(base)
        e.base_source = "civarchive"
    if e.maturity_source != "civitai":
        lvl = model.get("nsfw_level") or 0
        try:
            lvl = int(lvl)
        except (TypeError, ValueError):
            lvl = 0
        e.isMature = bool(model.get("is_nsfw")) or lvl >= 4
        e.maturity_source = "civarchive"
    return True


def finalize(e: ModelEntry, meta: dict) -> None:
    # base model for checkpoints: civitai -> folder hint -> metadata
    if e.kind in ("checkpoint", "video_checkpoint", "audio_checkpoint") and not e.base_source:
        server, gen = folder_base_hint(e.relpath)
        if server:
            e.supportedServer, e.generation, e.base_source = server, gen, "folder"
        else:
            server, gen = core.base_from_metadata(meta)
            if server:
                e.supportedServer, e.generation, e.base_source = server, gen, "metadata"

    # resource type
    e.resourceType = KIND_RESOURCE_TYPE.get(e.kind, "")
    if not e.customLabel:
        e.customLabel = e.name
    if e.triggerWords and not e.defaultTrigger:
        e.defaultTrigger = e.triggerWords
    e.slug = core.slugify(e.customLabel or e.name)

    # compute Comfy target (checkpoints get a base-model sub-bucket)
    if e.kind == "video_checkpoint":
        bucket = f"checkpoints/Video/{video_arch(e.generation, e.relpath)}"
    elif e.kind == "audio_checkpoint":
        bucket = "checkpoints/Audio"
    elif e.kind in ("checkpoint", "unknown"):
        grp = checkpoint_group(e.generation, e.supportedServer, e.relpath)
        bucket = "checkpoints/Video/Wan" if grp == "Wan" else f"checkpoints/{grp}"
    else:
        bucket = e.comfy_folder
    e.comfy_folder = bucket
    e.target_rel = f"{bucket}/{e.filename}"

    if e.maturity_source not in ("civitai", "civarchive", "override"):
        e.maturity_source = "unknown"
    e.needs_review = (e.kind in ("unknown",) or
                      (e.kind in RESOURCE_KINDS and e.base_source in ("", "folder")
                       and not e.civitai_matched))

    bits = [f"kind: {e.kind}"]
    if e.base_source:
        bits.append(f"base via {e.base_source}")
    if e.notes:
        bits.append("; ".join(e.notes))
    e.description = " | ".join(bits)


def to_resource(e: ModelEntry) -> Optional[dict]:
    if e.kind not in RESOURCE_KINDS or e.is_tool:
        return None
    return {
        "name": e.name,
        "customLabel": e.customLabel,
        "resourceType": e.resourceType,
        "supportedServer": e.supportedServer,
        "generation": e.generation,
        "isMature": e.isMature,
        "civitaiUrl": e.civitaiUrl or None,
        "customUrl": e.customUrl or None,
        "localPath": e.target_rel,
        "triggerWords": e.triggerWords or None,
        "defaultTrigger": e.defaultTrigger or None,
        "description": e.description or None,
        "slug": e.slug,
        "isPublic": False,
    }


def organize(entries: list[ModelEntry], mode: str, dest: Path, out_dir: Path) -> None:
    import shutil
    rows, log = [], []
    acted = skipped = collided = tools = 0
    for e in entries:
        if e.is_tool:
            rows.append({"action": "skip (tool model - left in place)", "from": e.abspath,
                         "to": e.abspath, "kind": e.kind})
            tools += 1
            continue
        target = dest / e.target_rel
        src = Path(e.abspath)
        action = mode
        if target.exists() and target.resolve() != src.resolve():
            try:
                if e.sha256 and target.stat().st_size == e.size_bytes and core.sha256_file(target) == e.sha256:
                    action = "skip (already there, identical)"
                else:
                    stem, ext = os.path.splitext(e.filename)
                    target = target.parent / f"{stem}__{e.sha256[:8]}{ext}"
                    collided += 1
            except OSError:
                pass
        elif target.resolve() == src.resolve():
            action = "skip (in place)"
        rows.append({"action": action, "from": e.abspath, "to": str(target), "kind": e.kind})
        if mode in ("copy", "move") and action == mode:
            try:
                target.parent.mkdir(parents=True, exist_ok=True)
                if mode == "copy":
                    shutil.copy2(src, target)
                else:
                    shutil.move(str(src), str(target))
                    e.abspath = str(target)
                log.append({"from": e.abspath if mode == "copy" else str(src), "to": str(target)})
                acted += 1
            except OSError as ex:
                print(f"  ! {mode} failed for {src}: {ex}", file=sys.stderr)
        elif action.startswith("skip"):
            skipped += 1
    with open(out_dir / "models-move-plan.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["action", "from", "to", "kind"])
        w.writeheader()
        w.writerows(rows)
    if log:
        with open(out_dir / "models-move-log.csv", "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["from", "to"])
            w.writeheader()
            w.writerows(log)
    verb = {"plan": "planned", "copy": "copied", "move": "moved"}[mode]
    print(f"\n=== Organize ({mode}) ===")
    print(f"  {verb}: {acted if mode != 'plan' else len(rows) - tools}  "
          f"skipped: {skipped}  renamed-on-collision: {collided}  tools-left: {tools}")
    print(f"  plan  : {out_dir / 'models-move-plan.csv'}")
    if log:
        print(f"  undo  : {out_dir / 'models-move-log.csv'}")


def main() -> int:
    ap = argparse.ArgumentParser(description="Catalog & sort non-LoRA models into ComfyUI layout.")
    ap.add_argument("folder", type=Path)
    ap.add_argument("--out", type=Path, default=Path("."))
    ap.add_argument("--no-civitai", action="store_true")
    ap.add_argument("--no-archive", action="store_true")
    ap.add_argument("--civitai-token", default=os.environ.get("CIVITAI_TOKEN", ""))
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--hash-workers", type=int, default=8)
    ap.add_argument("--skip-video", action="store_true",
                    help="Leave video/audio models (SVD, LTX, Wan, Stable-Audio) "
                         "in place instead of sorting them. Recommended if those "
                         "live in mixed bundle folders or drive video workflows.")
    ap.add_argument("--no-hash", action="store_true",
                    help="Fast preview: skip hashing + hash lookups entirely. "
                         "Classify by folder and produce the move plan in seconds "
                         "(no reading file contents). Use for the first look at a "
                         "large tree; drop it for the enriched catalog + dedupe.")
    ap.add_argument("--organize", choices=["none", "plan", "copy", "move"], default="plan")
    ap.add_argument("--dest", type=Path, default=None, help="Comfy models root (default: scanned folder)")
    ap.add_argument("--overrides", type=Path, default=None)
    ap.add_argument("--cache", type=Path, default=None)
    args = ap.parse_args()

    root = args.folder.expanduser().resolve()
    if not root.is_dir():
        print(f"error: not a directory: {root}", file=sys.stderr)
        return 2
    args.out.mkdir(parents=True, exist_ok=True)
    cache = core.Cache(args.cache or (args.out / ".models-cache.sqlite"))
    overrides = core.load_overrides(args.overrides) if args.overrides else {}

    # enumerate, EXCLUDING loras (handled by scan_loras.py)
    print(f"Scanning {root} (excluding LoRAs) ...")
    all_files = core.enumerate_files(root)
    files = [p for p in all_files
             if not re.search(r"(?i)(^|[\\/])loras?([\\/]|$)",
                              "/" + str(p.relative_to(root)).replace("\\", "/"))]
    print(f"{len(files)} non-LoRA model files (of {len(all_files)} total).")
    if not files:
        return 0

    entries: list[ModelEntry] = []
    meta_by_id: dict[int, dict] = {}
    done, total = 0, len(files)
    hw = max(1, args.hash_workers)
    print("Classifying by folder (no hashing) ..." if args.no_hash
          else f"Hashing + reading headers ({hw} workers) ...")
    with ThreadPoolExecutor(max_workers=1 if args.no_hash else hw) as ex:
        futures = [(ex.submit(build_entry, p, root, cache, args.no_hash), p) for p in files]
        for fut, path in futures:
            try:
                e, meta = fut.result()
                entries.append(e)
                meta_by_id[id(e)] = meta
            except OSError as exc:
                print(f"\n  ! skipping {path}: {exc}", file=sys.stderr)
            done += 1
            if done % 5 == 0 or done == total:
                print(f"\r  hashed/read {done}/{total}", end="", flush=True)
    print()

    # hash lookups only for kinds where they help (checkpoints/loras/components)
    lookup_kinds = RESOURCE_KINDS | {"lora", "controlnet", "hypernetwork",
                                     "embedding", "upscaler", "video_checkpoint",
                                     "audio_checkpoint", "unknown"}
    targets = [e for e in entries if e.kind in lookup_kinds and not e.is_tool]
    civ = arc = 0
    if targets and not args.no_hash and not (args.no_civitai and args.no_archive):
        print(f"Identifying {len(targets)} by hash ({args.workers} workers) ...")

        def identify(e: ModelEntry) -> str:
            if not args.no_civitai:
                data = cache.get_lookup(e.sha256, "civitai")
                if data is None:
                    try:
                        data = core.civitai_lookup(e.sha256, token=args.civitai_token)
                        cache.put_lookup(e.sha256, "civitai", data, time.time())
                    except Exception as ex:
                        e.notes.append(f"Civitai error: {ex}")
                        data = None
                if data is not None and enrich_civitai(e, data):
                    return "civitai"
            if not args.no_archive:
                data = cache.get_lookup(e.sha256, "civarchive")
                if data is None:
                    try:
                        data = core.civarchive_lookup(e.sha256)
                        cache.put_lookup(e.sha256, "civarchive", data, time.time())
                    except Exception as ex:
                        e.notes.append(f"CivArchive error: {ex}")
                        data = None
                if data is not None and enrich_archive(e, data):
                    return "civarchive"
            return "miss"

        d = 0
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
            for fut in as_completed([ex.submit(identify, e) for e in targets]):
                r = fut.result()
                civ += r == "civitai"
                arc += r == "civarchive"
                d += 1
                if d % 5 == 0 or d == len(targets):
                    print(f"\r  identified {d}/{len(targets)} (civitai:{civ} archive:{arc})",
                          end="", flush=True)
        print()

    for e in entries:
        if args.skip_video and e.kind in ("video_checkpoint", "audio_checkpoint"):
            e.is_tool = True
            e.notes.append("video/audio — left in place (--skip-video)")
        finalize(e, meta_by_id.get(id(e), {}))
        core.apply_overrides(e, overrides)  # sha256/filename-keyed; sets fields it recognizes

    if args.organize != "none":
        organize(entries, args.organize, (args.dest or root).resolve(), args.out)

    # catalog
    import json
    cat = {"generatedFrom": str(root), "count": len(entries),
           "entries": [{"resource": to_resource(e), "meta": asdict(e)} for e in entries]}
    with open(args.out / "models-catalog.json", "w", encoding="utf-8") as f:
        json.dump(cat, f, indent=2, ensure_ascii=False)
    cols = ["filename", "kind", "comfy_folder", "target_rel", "resourceType",
            "customLabel", "supportedServer", "generation", "isMature",
            "maturity_source", "needs_review", "base_source", "triggerWords",
            "civitaiUrl", "sha256", "relpath"]
    with open(args.out / "models-catalog.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=cols, extrasaction="ignore")
        w.writeheader()
        for e in entries:
            w.writerow({k: getattr(e, k, "") for k in cols})

    by_kind: dict[str, int] = {}
    for e in entries:
        by_kind[e.kind] = by_kind.get(e.kind, 0) + 1
    resourced = sum(1 for e in entries if to_resource(e))
    print("\n=== Summary ===")
    print(f"  files            : {len(entries)}")
    print(f"  will be Resources: {resourced}  (checkpoints + components)")
    print(f"  Civitai / Archive: {civ} / {arc}")
    print("  by kind          : " + ", ".join(f"{k}={v}" for k, v in sorted(by_kind.items())))
    print(f"\n  plan : {args.out / 'models-move-plan.csv'}   (review before --organize move)")
    print(f"  CSV  : {args.out / 'models-catalog.csv'}")
    print(f"  JSON : {args.out / 'models-catalog.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
