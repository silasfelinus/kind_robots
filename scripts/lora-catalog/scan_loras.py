#!/usr/bin/env python3
"""
scan_loras.py — Catalog AND sort a folder of LoRA files for kind_robots.

Per file (recursively) in a folder it:
  1. Computes the SHA256 (cached by path+size+mtime so re-runs are fast).
  2. Reads the embedded safetensors metadata header (base model, network
     module, training tags) — no external library, just struct + json.
  3. Identifies the model by hash through a fallback chain:
       Civitai by-hash API  ->  CivArchive by-hash API  ->  embedded
       metadata  ->  tensor-architecture fingerprint
     CivArchive (civitaiarchive.com) covers models Civitai has removed.
  4. Resolves each file to a kind_robots `Resource` record:
       resourceType    -> LORA / LYCORIS
       supportedServer -> SD15 / SDXL / FLUX / KONTEXT / COMFY / GENERIC / UNKNOWN
       generation      -> the exact base-model string (e.g. "Pony")
       isMature        -> from the source's nsfw flag; unknowns flagged
       customLabel     -> pretty model name
       civitaiUrl      -> canonical source link (customUrl -> CivArchive)
       triggerWords    -> ALL trigger words (comma-joined)
       defaultTrigger  -> the string to inject at gen time (seeded == triggerWords, editable)
  5. Optionally SORTS the files on disk into  <BaseModel>/<SFW|NSFW|REVIEW>/
     (e.g.  .../Lora/SDXL/SFW/ , .../Lora/Flux/NSFW/ ). See --organize.
  6. Writes:
       lora-catalog.json  — full data, each entry ready for /api/resources/batch
       lora-catalog.csv   — human review sheet (open in any spreadsheet)
       lora-move-plan.csv — the sort plan (when --organize is used)
       lora-move-log.csv  — from->to record of actual moves (for undo)

NOTHING is uploaded except SHA256 hashes to the two public by-hash APIs. The
files themselves never leave your machine. Use --no-civitai --no-archive for a
fully offline run (base model still detected from metadata/architecture).

REVIEW / OVERRIDES workflow:
  Run once. Open lora-catalog.csv, fix anything wrong (a bad isMature flag, a
  nicer label, a base model, a curated defaultTrigger). Save a copy as
  overrides.csv and re-run with:  --overrides overrides.csv
  Overrides match by sha256 (stable even if you rename/move files); any
  non-empty cell wins over auto-detection.

Requires: Python 3.8+. No pip installs.

Examples:
  export CIVITAI_TOKEN=xxxx: python3 scan_loras.py "Z:/ai/models/Lora"
  python3 scan_loras.py "Z:/ai/models/Lora" --out ./catalog --workers 6
  python3 scan_loras.py "Z:/ai/models/Lora" --organize plan          # preview the sort
  python3 scan_loras.py "Z:/ai/models/Lora" --organize move          # do the sort in place
  python3 scan_loras.py "Z:/ai/models/Lora" --organize copy --dest "Z:/ai/models/Lora-sorted"
  python3 scan_loras.py "Z:/ai/models/Lora" --overrides overrides.csv
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import re
import shutil
import sqlite3
import struct
import sys
import threading
import time
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass, field, asdict
from pathlib import Path
from typing import Any, Optional

# ----------------------------------------------------------------------------
# Config / constants
# ----------------------------------------------------------------------------

LORA_EXTENSIONS = {".safetensors", ".pt", ".ckpt", ".pth", ".bin"}
CIVITAI_BY_HASH = "https://civitai.com/api/v1/model-versions/by-hash/{hash}"
CIVARCHIVE_BY_HASH = "https://civitaiarchive.com/api/sha256/{hash}"
HASH_CHUNK = 1 << 20  # 1 MiB
MISS = {"__miss__": True}

# Map a `baseModel` string (from either source) to (supportedServer, generation).
# supportedServer must be a kind_robots SupportedServer enum member:
#   SD15, SDXL, COMFY, FLUX, KONTEXT, GENERIC, UNKNOWN, OPENAI
# Pony / Illustrious / NoobAI are SDXL-architecture, so supportedServer=SDXL but
# `generation` keeps the precise name (and they get their own sort folder).
BASEMODEL_MAP: dict[str, tuple[str, str]] = {
    "sd 1.4": ("SD15", "SD 1.4"),
    "sd 1.5": ("SD15", "SD 1.5"),
    "sd 1.5 lcm": ("SD15", "SD 1.5 LCM"),
    "sd 1.5 hyper": ("SD15", "SD 1.5 Hyper"),
    "sd 2.0": ("SD15", "SD 2.0"),
    "sd 2.1": ("SD15", "SD 2.1"),
    "sdxl 0.9": ("SDXL", "SDXL 0.9"),
    "sdxl 1.0": ("SDXL", "SDXL 1.0"),
    "sdxl 1.0 lcm": ("SDXL", "SDXL 1.0 LCM"),
    "sdxl distilled": ("SDXL", "SDXL Distilled"),
    "sdxl turbo": ("SDXL", "SDXL Turbo"),
    "sdxl lightning": ("SDXL", "SDXL Lightning"),
    "sdxl hyper": ("SDXL", "SDXL Hyper"),
    "pony": ("SDXL", "Pony"),
    "illustrious": ("SDXL", "Illustrious"),
    "noobai": ("SDXL", "NoobAI"),
    "flux.1 d": ("FLUX", "Flux.1 D"),
    "flux.1 s": ("FLUX", "Flux.1 S"),
    "flux.1 kontext": ("KONTEXT", "Flux.1 Kontext"),
    "flux": ("FLUX", "Flux.1"),
    "krea": ("COMFY", "Krea"),
    "krea 1": ("COMFY", "Krea 1"),
    "krea 2": ("COMFY", "Krea 2"),
    "sd 3": ("GENERIC", "SD 3"),
    "sd 3.5": ("GENERIC", "SD 3.5"),
    "sd 3.5 medium": ("GENERIC", "SD 3.5 Medium"),
    "sd 3.5 large": ("GENERIC", "SD 3.5 Large"),
    "hunyuan video": ("GENERIC", "Hunyuan Video"),
    "hunyuan 1": ("GENERIC", "Hunyuan"),
    "wan video": ("GENERIC", "Wan Video"),
    "wan video 14b i2v 480p": ("GENERIC", "Wan Video 14B i2v 480p"),
    "ltxv": ("GENERIC", "LTXV"),
    "kolors": ("GENERIC", "Kolors"),
    "pixart a": ("GENERIC", "PixArt A"),
    "pixart e": ("GENERIC", "PixArt E"),
    "aura flow": ("GENERIC", "AuraFlow"),
}


def folder_group(generation: str, supported_server: str) -> str:
    """Human-friendly top-level sort folder. Keeps Pony/Illustrious/etc. split
    out from generic SDXL because that distinction matters when picking LoRAs."""
    g = (generation or "").lower()
    if "pony" in g:
        return "Pony"
    if "illustrious" in g:
        return "Illustrious"
    if "noobai" in g:
        return "NoobAI"
    if "kontext" in g:
        return "Kontext"
    if "krea" in g:
        return "Krea"
    if "flux" in g:
        return "Flux"
    if "sd 3" in g or "sd3" in g:
        return "SD3"
    if "hunyuan" in g or "wan" in g or "ltx" in g:
        return "Video"
    if "xl" in g or supported_server == "SDXL":
        return "SDXL"
    if supported_server == "SD15" or re.search(r"\b(1\.4|1\.5|2\.\d)\b", g):
        return "SD15"
    if supported_server in ("FLUX", "KONTEXT"):
        return supported_server.title()
    return "Unknown"


# ----------------------------------------------------------------------------
# Data model
# ----------------------------------------------------------------------------

@dataclass
class LoraEntry:
    # identity
    filename: str = ""
    relpath: str = ""
    abspath: str = ""
    size_bytes: int = 0
    sha256: str = ""

    # resolved Resource fields (import-ready)
    name: str = ""              # unique key = filename stem
    customLabel: str = ""       # pretty name
    resourceType: str = "LORA"
    supportedServer: str = "UNKNOWN"
    generation: str = ""        # exact base-model string
    isMature: bool = False
    civitaiUrl: str = ""
    customUrl: str = ""         # CivArchive link when relevant
    huggingUrl: str = ""
    localPath: str = ""
    triggerWords: str = ""      # ALL trigger words, comma-joined
    defaultTrigger: str = ""    # the string to inject (seeded == triggerWords, editable)
    description: str = ""
    slug: str = ""

    # sort target
    group: str = ""             # base-model sort folder
    maturity_bucket: str = ""   # SFW | NSFW | REVIEW

    # detection metadata (not imported; for your review)
    baseModel_raw: str = ""
    base_source: str = ""       # civitai | civarchive | metadata | fingerprint | unknown
    maturity_source: str = ""   # civitai | civarchive | override | unknown
    confidence: str = "low"     # high | medium | low
    needs_review: bool = True
    civitai_matched: bool = False
    archive_matched: bool = False
    trigger_words: list[str] = field(default_factory=list)
    network_module: str = ""
    notes: list[str] = field(default_factory=list)


# ----------------------------------------------------------------------------
# Cache (sqlite): hashes keyed by path+size+mtime, lookups keyed by hash+source
# ----------------------------------------------------------------------------

class Cache:
    def __init__(self, path: Path):
        self._lock = threading.Lock()
        self.conn = sqlite3.connect(str(path), check_same_thread=False)
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS hashes (key TEXT PRIMARY KEY, sha256 TEXT)")
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS lookups "
            "(sha256 TEXT, source TEXT, json TEXT, fetched_at REAL, "
            "PRIMARY KEY (sha256, source))")
        self.conn.commit()

    def get_hash(self, key: str) -> Optional[str]:
        with self._lock:
            row = self.conn.execute(
                "SELECT sha256 FROM hashes WHERE key=?", (key,)).fetchone()
        return row[0] if row else None

    def put_hash(self, key: str, sha256: str) -> None:
        with self._lock:
            self.conn.execute(
                "INSERT OR REPLACE INTO hashes VALUES (?, ?)", (key, sha256))
            self.conn.commit()

    def get_lookup(self, sha256: str, source: str) -> Optional[Any]:
        with self._lock:
            row = self.conn.execute(
                "SELECT json FROM lookups WHERE sha256=? AND source=?",
                (sha256, source)).fetchone()
        return json.loads(row[0]) if row else None

    def put_lookup(self, sha256: str, source: str, obj: Any, when: float) -> None:
        with self._lock:
            self.conn.execute(
                "INSERT OR REPLACE INTO lookups VALUES (?, ?, ?, ?)",
                (sha256, source, json.dumps(obj), when))
            self.conn.commit()


# ----------------------------------------------------------------------------
# Hashing
# ----------------------------------------------------------------------------

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(HASH_CHUNK), b""):
            h.update(chunk)
    return h.hexdigest()


def cache_key(path: Path, st: os.stat_result) -> str:
    return f"{path}|{st.st_size}|{int(st.st_mtime)}"


# ----------------------------------------------------------------------------
# safetensors metadata header
# ----------------------------------------------------------------------------

def read_safetensors_header(path: Path) -> tuple[dict, list[str]]:
    """Return (metadata_dict, tensor_names). Reads only the header, never data.
    Layout: [8-byte LE uint64 header length][JSON header][tensor data]."""
    try:
        with open(path, "rb") as f:
            n_bytes = f.read(8)
            if len(n_bytes) < 8:
                return {}, []
            (header_len,) = struct.unpack("<Q", n_bytes)
            if header_len <= 0 or header_len > 100_000_000:
                return {}, []
            header = json.loads(f.read(header_len).decode("utf-8", "replace"))
    except (OSError, ValueError, json.JSONDecodeError):
        return {}, []
    if not isinstance(header, dict):
        return {}, []
    meta = header.get("__metadata__", {}) or {}
    names = [k for k in header.keys() if k != "__metadata__"]
    return meta, names


def base_from_metadata(meta: dict) -> tuple[str, str]:
    blob = " ".join(str(meta.get(k, "")) for k in (
        "ss_base_model_version", "modelspec.architecture", "ss_sd_model_name")).lower()
    if not blob.strip():
        return "", ""
    if "xl" in blob or "sdxl" in blob:
        return "SDXL", "SDXL (from metadata)"
    if "flux" in blob:
        return "FLUX", "Flux (from metadata)"
    if "sd3" in blob or "stable-diffusion-3" in blob or "sd_3" in blob:
        return "GENERIC", "SD 3 (from metadata)"
    if "v2" in blob or "sd-v2" in blob or "sd_2" in blob:
        return "SD15", "SD 2.x (from metadata)"
    if "v1" in blob or "sd-v1" in blob or "sd_1" in blob or "1.5" in blob:
        return "SD15", "SD 1.5 (from metadata)"
    return "", ""


def base_from_fingerprint(tensor_names: list[str]) -> tuple[str, str]:
    if not tensor_names:
        return "", ""
    joined = "\n".join(tensor_names)
    if "double_blocks" in joined or "single_blocks" in joined:
        return "FLUX", "Flux (from architecture)"
    if "joint_blocks" in joined or "context_embedder" in joined:
        return "GENERIC", "SD 3 (from architecture)"
    if ("lora_te2" in joined or "text_encoder_2" in joined
            or "conditioner.embedders.1" in joined):
        return "SDXL", "SDXL (from architecture)"
    if "lora_te" in joined or "text_model" in joined or "lora_unet" in joined:
        return "SD15", "SD 1.5 (from architecture)"
    return "", ""


# ----------------------------------------------------------------------------
# Hash lookups: Civitai then CivArchive
# ----------------------------------------------------------------------------

def _http_json(url: str, headers: dict, timeout: int, retries: int) -> Any:
    backoff = 2.0
    for attempt in range(retries):
        req = urllib.request.Request(url, headers=headers)
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            if e.code == 404:
                return MISS
            if e.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            raise
        except (urllib.error.URLError, TimeoutError, ConnectionError, ValueError):
            if attempt < retries - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            raise
    return MISS


def civitai_lookup(sha256: str, token: str = "", timeout: int = 20, retries: int = 4) -> Any:
    headers = {"User-Agent": "kind-robots-lora-catalog/1.0"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return _http_json(CIVITAI_BY_HASH.format(hash=sha256), headers, timeout, retries)


def civarchive_lookup(sha256: str, timeout: int = 20, retries: int = 4) -> Any:
    headers = {"User-Agent": "kind-robots-lora-catalog/1.0"}
    return _http_json(CIVARCHIVE_BY_HASH.format(hash=sha256), headers, timeout, retries)


def _matched(data: Any) -> bool:
    return bool(data) and data is not MISS and not data.get("__miss__")


def apply_civitai(entry: LoraEntry, data: Any) -> bool:
    """Fold a Civitai model-versions/by-hash response. Returns True if matched."""
    if not _matched(data):
        return False
    entry.civitai_matched = True
    model = data.get("model") or {}
    model_id, version_id = data.get("modelId"), data.get("id")
    if model_id:
        url = f"https://civitai.com/models/{model_id}"
        if version_id:
            url += f"?modelVersionId={version_id}"
        entry.civitaiUrl = url
    pretty = model.get("name") or data.get("name") or ""
    if pretty:
        entry.customLabel = pretty
    words = data.get("trainedWords") or []
    if isinstance(words, list):
        entry.trigger_words = [str(w) for w in words if w]
    base = (data.get("baseModel") or "").strip()
    if base:
        entry.baseModel_raw = base
        entry.supportedServer, entry.generation = BASEMODEL_MAP.get(
            base.lower(), ("GENERIC", base))
        entry.base_source = "civitai"
    mtype = (model.get("type") or "").lower()
    if mtype == "locon" or "lycoris" in mtype:
        entry.resourceType = "LYCORIS"
    nsfw = model.get("nsfw")
    if nsfw is not None:
        entry.isMature = bool(nsfw)
        entry.maturity_source = "civitai"
    return True


def apply_civarchive(entry: LoraEntry, data: Any) -> bool:
    """Fold a CivArchive /api/sha256 response. Returns True if matched."""
    if not _matched(data):
        return False
    model = data.get("model") or {}
    if not model:
        return False
    entry.archive_matched = True
    version = model.get("version") or {}
    model_id, version_id = model.get("id"), version.get("id")
    if model_id:
        url = f"https://civitaiarchive.com/models/{model_id}"
        if version_id:
            url += f"?modelVersionId={version_id}"
        entry.customUrl = url
        # Canonical civitai link too (may be dead if the model was removed).
        civ = f"https://civitai.com/models/{model_id}"
        if version_id:
            civ += f"?modelVersionId={version_id}"
        entry.civitaiUrl = entry.civitaiUrl or civ
    pretty = model.get("name") or ""
    if pretty and not entry.customLabel:
        entry.customLabel = pretty
    trig = version.get("trigger") or version.get("trainedWords") or []
    if isinstance(trig, list) and not entry.trigger_words:
        entry.trigger_words = [str(w) for w in trig if w]
    base = (version.get("baseModel") or "").strip()
    if base and not entry.base_source:
        entry.baseModel_raw = base
        entry.supportedServer, entry.generation = BASEMODEL_MAP.get(
            base.lower(), ("GENERIC", base))
        entry.base_source = "civarchive"
    mtype = (model.get("type") or "").lower()
    if mtype == "locon" or "lycoris" in mtype:
        entry.resourceType = "LYCORIS"
    if entry.maturity_source not in ("civitai", "override"):
        is_nsfw = bool(model.get("is_nsfw"))
        level = model.get("nsfw_level") or 0
        try:
            level = int(level)
        except (TypeError, ValueError):
            level = 0
        entry.isMature = is_nsfw or level >= 4  # Civitai levels: 4=R,8=X,16=XXX
        entry.maturity_source = "civarchive"
    entry.notes.append("matched via CivArchive (Civitai entry may be removed)")
    return True


# ----------------------------------------------------------------------------
# Overrides
# ----------------------------------------------------------------------------

OVERRIDE_FIELDS = {
    "customlabel": "customLabel",
    "resourcetype": "resourceType",
    "supportedserver": "supportedServer",
    "generation": "generation",
    "ismature": "isMature",
    "triggerwords": "triggerWords",
    "defaulttrigger": "defaultTrigger",
    "name": "name",
    "group": "group",
}


def load_overrides(path: Path) -> dict[str, dict[str, str]]:
    out: dict[str, dict[str, str]] = {}
    if not path.exists():
        print(f"  ! overrides file not found: {path}", file=sys.stderr)
        return out
    with open(path, newline="", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        norm = {(c or "").strip().lower(): c for c in (reader.fieldnames or [])}
        key_col = norm.get("sha256") or norm.get("filename")
        if not key_col:
            print("  ! overrides CSV needs a 'sha256' or 'filename' column", file=sys.stderr)
            return out
        for row in reader:
            key = (row.get(key_col) or "").strip()
            if not key:
                continue
            edits = {}
            for col_lower, col in norm.items():
                fld = OVERRIDE_FIELDS.get(col_lower)
                if fld and (row.get(col) or "").strip() != "":
                    edits[fld] = row[col].strip()
            if edits:
                out[key.lower()] = edits
    return out


def apply_overrides(entry: LoraEntry, overrides: dict[str, dict[str, str]]) -> None:
    edits = overrides.get(entry.sha256.lower()) or overrides.get(entry.filename.lower())
    if not edits:
        return
    for fld, val in edits.items():
        if fld == "isMature":
            entry.isMature = val.lower() in ("1", "true", "yes", "y", "mature", "nsfw")
            entry.maturity_source = "override"
        else:
            setattr(entry, fld, val)
    entry.needs_review = False
    entry.notes.append("manual override applied")


# ----------------------------------------------------------------------------
# Naming / finalize
# ----------------------------------------------------------------------------

def slugify(text: str) -> str:
    text = re.sub(r"[^\w\s-]", "", text.strip().lower())
    return re.sub(r"[\s_-]+", "-", text).strip("-")[:255]


def resolve_base_offline(e: LoraEntry, meta: dict, names: list[str]) -> None:
    if e.base_source:
        return
    server, gen = base_from_metadata(meta)
    if server:
        e.supportedServer, e.generation, e.base_source = server, gen, "metadata"
        e.baseModel_raw = e.baseModel_raw or gen
        return
    server, gen = base_from_fingerprint(names)
    if server:
        e.supportedServer, e.generation, e.base_source = server, gen, "fingerprint"
        e.baseModel_raw = e.baseModel_raw or gen


def finalize(entry: LoraEntry) -> None:
    # trigger fields (seed defaultTrigger == triggerWords; user curates later)
    if entry.trigger_words:
        joined = ", ".join(entry.trigger_words)
        entry.triggerWords = entry.triggerWords or joined
        entry.defaultTrigger = entry.defaultTrigger or joined

    # confidence + review
    if entry.base_source in ("civitai", "civarchive"):
        entry.confidence = "high"
    elif entry.base_source == "metadata":
        entry.confidence = "medium"
    else:
        entry.confidence = "low"
    if entry.maturity_source not in ("civitai", "civarchive", "override"):
        entry.maturity_source = "unknown"
    entry.needs_review = (
        entry.confidence != "high" or entry.maturity_source == "unknown"
    ) and "manual override applied" not in entry.notes

    # sort target
    if not entry.group:
        entry.group = folder_group(entry.generation, entry.supportedServer)
    if entry.maturity_source == "unknown":
        entry.maturity_bucket = "REVIEW"
    else:
        entry.maturity_bucket = "NSFW" if entry.isMature else "SFW"

    # description
    bits = []
    if entry.baseModel_raw:
        bits.append(f"base: {entry.baseModel_raw}")
    if entry.network_module:
        bits.append(f"module: {entry.network_module}")
    bits.append(f"detected via {entry.base_source or 'nothing'}")
    if entry.notes:
        bits.append("; ".join(entry.notes))
    entry.description = " | ".join(bits)

    if not entry.customLabel:
        entry.customLabel = entry.name
    entry.slug = slugify(entry.customLabel or entry.name)


def to_resource(entry: LoraEntry) -> dict:
    """Import-ready subset. triggerWords/defaultTrigger require the planned
    schema fields; artPrompt carries defaultTrigger for the current schema."""
    return {
        "name": entry.name,
        "customLabel": entry.customLabel,
        "resourceType": entry.resourceType,
        "supportedServer": entry.supportedServer,
        "generation": entry.generation,
        "isMature": entry.isMature,
        "civitaiUrl": entry.civitaiUrl or None,
        "customUrl": entry.customUrl or None,
        "huggingUrl": entry.huggingUrl or None,
        "localPath": entry.localPath or None,
        "triggerWords": entry.triggerWords or None,
        "defaultTrigger": entry.defaultTrigger or None,
        "artPrompt": entry.defaultTrigger or None,
        "description": entry.description or None,
        "slug": entry.slug,
        "isPublic": False,
    }


# ----------------------------------------------------------------------------
# Organize (sort files into <group>/<bucket>/)
# ----------------------------------------------------------------------------

def organize(entries: list[LoraEntry], mode: str, dest: Path, out_dir: Path) -> None:
    """mode: plan | copy | move. Writes a plan CSV always; copy/move also act
    and write an undo log. Never overwrites differing files; idempotent."""
    plan_rows = []
    log_rows = []
    acted = skipped = collided = 0
    for e in entries:
        target_dir = dest / e.group / e.maturity_bucket
        target = target_dir / e.filename
        src = Path(e.abspath)
        action = mode
        # collision handling
        if target.exists() and target.resolve() != src.resolve():
            # same content already there? treat as done.
            try:
                if target.stat().st_size == e.size_bytes and sha256_file(target) == e.sha256:
                    action = "skip (already sorted, identical)"
                else:
                    stem, ext = os.path.splitext(e.filename)
                    target = target_dir / f"{stem}__{e.sha256[:8]}{ext}"
                    collided += 1
            except OSError:
                pass
        elif target.resolve() == src.resolve():
            action = "skip (in place)"

        plan_rows.append({"action": action, "from": e.abspath, "to": str(target),
                          "group": e.group, "bucket": e.maturity_bucket})

        if mode in ("copy", "move") and action == mode:
            try:
                target_dir.mkdir(parents=True, exist_ok=True)
                if mode == "copy":
                    shutil.copy2(src, target)
                else:
                    shutil.move(str(src), str(target))
                    e.abspath = str(target)
                    try:
                        e.relpath = str(target.relative_to(dest))
                    except ValueError:
                        e.relpath = str(target)
                    e.localPath = e.relpath
                log_rows.append({"from": e.abspath if mode == "copy" else str(src),
                                 "to": str(target)})
                acted += 1
            except OSError as ex:
                print(f"  ! {mode} failed for {src}: {ex}", file=sys.stderr)
        elif action.startswith("skip"):
            skipped += 1

    with open(out_dir / "lora-move-plan.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["action", "from", "to", "group", "bucket"])
        w.writeheader()
        w.writerows(plan_rows)
    if log_rows:
        with open(out_dir / "lora-move-log.csv", "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=["from", "to"])
            w.writeheader()
            w.writerows(log_rows)

    verb = {"plan": "planned", "copy": "copied", "move": "moved"}[mode]
    print(f"\n=== Organize ({mode}) ===")
    print(f"  {verb}: {acted if mode != 'plan' else len(plan_rows)}"
          f"  skipped: {skipped}  renamed-on-collision: {collided}")
    print(f"  plan  : {out_dir / 'lora-move-plan.csv'}")
    if log_rows:
        print(f"  undo  : {out_dir / 'lora-move-log.csv'}  (from<-to to reverse)")


# ----------------------------------------------------------------------------
# Enumeration / entry build
# ----------------------------------------------------------------------------

def enumerate_files(root: Path) -> list[Path]:
    files = []
    for dirpath, _dirs, filenames in os.walk(root):
        for fn in filenames:
            if Path(fn).suffix.lower() in LORA_EXTENSIONS:
                files.append(Path(dirpath) / fn)
    files.sort()
    return files


def build_entry(path: Path, root: Path, cache: Cache) -> tuple[LoraEntry, dict, list]:
    st = path.stat()
    e = LoraEntry()
    e.abspath = str(path.resolve())
    e.relpath = str(path.relative_to(root))
    e.localPath = e.relpath
    e.filename = path.name
    e.name = path.stem
    e.size_bytes = st.st_size

    key = cache_key(path, st)
    cached = cache.get_hash(key)
    e.sha256 = cached or sha256_file(path)
    if not cached:
        cache.put_hash(key, e.sha256)

    meta, names = ({}, [])
    if path.suffix.lower() == ".safetensors":
        meta, names = read_safetensors_header(path)
        e.network_module = str(meta.get("ss_network_module", "") or "")
        if "lycoris" in e.network_module.lower():
            e.resourceType = "LYCORIS"
    else:
        e.notes.append(f"{path.suffix} file — metadata not read (not safetensors)")
    return e, meta, names


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

def main() -> int:
    ap = argparse.ArgumentParser(
        description="Catalog and sort a folder of LoRAs for kind_robots Resources.")
    ap.add_argument("folder", type=Path, help="Folder to scan (recursive)")
    ap.add_argument("--out", type=Path, default=Path("."),
                    help="Output directory for catalog files (default: current dir)")
    ap.add_argument("--no-civitai", action="store_true", help="Skip Civitai lookups")
    ap.add_argument("--no-archive", action="store_true", help="Skip CivArchive fallback")
    ap.add_argument("--civitai-token", default=os.environ.get("CIVITAI_TOKEN", ""),
                    help="Civitai API token (or set CIVITAI_TOKEN)")
    ap.add_argument("--workers", type=int, default=6, help="Concurrent lookups (default: 6)")
    ap.add_argument("--overrides", type=Path, default=None,
                    help="CSV of manual corrections to apply (keyed by sha256)")
    ap.add_argument("--organize", choices=["none", "plan", "copy", "move"], default="none",
                    help="Sort files into <BaseModel>/<SFW|NSFW|REVIEW>/. "
                         "'plan' previews only; 'copy'/'move' act.")
    ap.add_argument("--dest", type=Path, default=None,
                    help="Destination root for --organize (default: the scanned folder)")
    ap.add_argument("--cache", type=Path, default=None,
                    help="Cache DB path (default: <out>/.lora-cache.sqlite)")
    args = ap.parse_args()

    root = args.folder.expanduser().resolve()
    if not root.is_dir():
        print(f"error: not a directory: {root}", file=sys.stderr)
        return 2
    args.out.mkdir(parents=True, exist_ok=True)
    cache = Cache(args.cache or (args.out / ".lora-cache.sqlite"))
    overrides = load_overrides(args.overrides) if args.overrides else {}

    print(f"Scanning {root} ...")
    files = enumerate_files(root)
    print(f"Found {len(files)} candidate files.")
    if not files:
        return 0

    # Phase 1: hash + read metadata.
    entries: list[LoraEntry] = []
    meta_by_id: dict[int, tuple[dict, list]] = {}
    for i, path in enumerate(files, 1):
        try:
            e, meta, names = build_entry(path, root, cache)
            entries.append(e)
            meta_by_id[id(e)] = (meta, names)
        except OSError as ex:
            print(f"\n  ! skipping {path}: {ex}", file=sys.stderr)
        if i % 10 == 0 or i == len(files):
            print(f"\r  hashed/read {i}/{len(files)}", end="", flush=True)
    print()

    # Phase 2: hash lookups (threaded): Civitai -> CivArchive fallback.
    civ_hits = arc_hits = errors = 0
    if not (args.no_civitai and args.no_archive):
        print(f"Identifying by hash ({args.workers} workers): "
              f"Civitai{'' if not args.no_civitai else ' [off]'} -> "
              f"CivArchive{'' if not args.no_archive else ' [off]'} ...")

        def identify(e: LoraEntry) -> tuple[LoraEntry, str]:
            outcome = "miss"
            if not args.no_civitai:
                data = cache.get_lookup(e.sha256, "civitai")
                if data is None:
                    try:
                        data = civitai_lookup(e.sha256, token=args.civitai_token)
                        cache.put_lookup(e.sha256, "civitai", data, time.time())
                    except Exception as ex:
                        e.notes.append(f"Civitai error: {ex}")
                        data = None
                if data is not None and apply_civitai(e, data):
                    return e, "civitai"
                if data is None:
                    outcome = "error"
            if not args.no_archive:
                data = cache.get_lookup(e.sha256, "civarchive")
                if data is None:
                    try:
                        data = civarchive_lookup(e.sha256)
                        cache.put_lookup(e.sha256, "civarchive", data, time.time())
                    except Exception as ex:
                        e.notes.append(f"CivArchive error: {ex}")
                        data = None
                if data is not None and apply_civarchive(e, data):
                    return e, "civarchive"
                if data is None and outcome != "error":
                    outcome = "error"
            return e, outcome

        done, total = 0, len(entries)
        with ThreadPoolExecutor(max_workers=max(1, args.workers)) as ex:
            for fut in as_completed([ex.submit(identify, e) for e in entries]):
                _e, outcome = fut.result()
                civ_hits += outcome == "civitai"
                arc_hits += outcome == "civarchive"
                errors += outcome == "error"
                done += 1
                if done % 10 == 0 or done == total:
                    print(f"\r  identified {done}/{total} "
                          f"(civitai:{civ_hits} archive:{arc_hits} err:{errors})",
                          end="", flush=True)
        print()

    # Phase 3: offline base-model fill, overrides, finalize.
    for e in entries:
        meta, names = meta_by_id.get(id(e), ({}, []))
        resolve_base_offline(e, meta, names)
        apply_overrides(e, overrides)
        finalize(e)

    # Phase 4: organize (optional) — updates paths before catalog is written.
    if args.organize != "none":
        organize(entries, args.organize, (args.dest or root).resolve(), args.out)

    # Phase 5: write catalog.
    json_path, csv_path = args.out / "lora-catalog.json", args.out / "lora-catalog.csv"
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump({"generatedFrom": str(root), "count": len(entries),
                   "entries": [{"resource": to_resource(e), "meta": asdict(e)}
                               for e in entries]},
                  f, indent=2, ensure_ascii=False)

    csv_cols = ["filename", "customLabel", "name", "resourceType", "supportedServer",
                "generation", "group", "maturity_bucket", "baseModel_raw", "isMature",
                "maturity_source", "needs_review", "confidence", "triggerWords",
                "defaultTrigger", "civitaiUrl", "customUrl", "sha256", "relpath"]
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=csv_cols, extrasaction="ignore")
        w.writeheader()
        for e in entries:
            w.writerow({k: getattr(e, k, "") for k in csv_cols})

    # Summary.
    review = sum(e.needs_review for e in entries)
    mature = sum(e.isMature for e in entries)
    by_group: dict[str, int] = {}
    for e in entries:
        by_group[e.group] = by_group.get(e.group, 0) + 1
    print("\n=== Summary ===")
    print(f"  files cataloged : {len(entries)}")
    print(f"  Civitai matches : {civ_hits}")
    print(f"  CivArchive hits : {arc_hits}")
    print(f"  marked mature   : {mature}")
    print(f"  need review     : {review}")
    print("  by base model   : " + ", ".join(f"{k}={v}" for k, v in sorted(by_group.items())))
    print(f"\n  JSON : {json_path}\n  CSV  : {csv_path}")
    print("\nNext: open the CSV, fix anything wrong (isMature, labels, base model, "
          "defaultTrigger),\nsave a copy as overrides.csv, and re-run with "
          "--overrides overrides.csv.\nAdd --organize plan to preview the on-disk sort, "
          "then --organize move to do it.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
