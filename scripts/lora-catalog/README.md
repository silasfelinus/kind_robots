# LoRA Catalog & Sorter

A single, dependency-free Python script that walks a folder of LoRA files,
figures out **which base model each one is for**, gives it a **proper name**,
marks it **SFW / NSFW**, pulls its **trigger words**, and (optionally) **sorts
the files on disk** into `<BaseModel>/<SFW|NSFW>/`. It also emits a catalog
that drops straight into the kind_robots `Resource` table.

Nothing is uploaded except SHA256 hashes to two public "identify by hash" APIs.
Your files never leave your machine. You can run it fully offline.

---

## What it does, per file

1. **Hashes** it (SHA256), cached by path+size+mtime so re-runs are fast.
2. **Reads the safetensors metadata header** (base model, network module,
   training tags) — no library, just the raw header.
3. **Identifies it by hash** through a fallback chain, stopping at the first hit:
   1. **Civitai** `by-hash` API (uses your token if provided)
   2. **CivArchive** (`civitaiarchive.com`) `by-hash` API — covers models
      Civitai has **removed/purged**
   3. **Embedded metadata** (base model from the safetensors header)
   4. **Architecture fingerprint** (tensor keys: SDXL vs SD1.5 vs Flux vs SD3)
4. **Resolves** it to kind_robots `Resource` fields:
   `resourceType`, `supportedServer`, `generation` (exact base model),
   `isMature`, `customLabel`, `civitaiUrl`, `customUrl` (CivArchive),
   `triggerWords`, `defaultTrigger`.
5. **Sorts** it (optional) into `<BaseModel>/<SFW|NSFW|REVIEW>/`.

Base-model sort folders: `SD15`, `SDXL`, `Pony`, `Illustrious`, `NoobAI`,
`Flux`, `Kontext`, `Krea`, `SD3`, `Video`, `Unknown`. (Pony/Illustrious/etc.
are SDXL-architecture, so their `supportedServer` is `SDXL`, but they get their
own sort folder because that distinction matters when you're picking a LoRA.)

Maturity buckets: `SFW`, `NSFW`, and `REVIEW` — anything we couldn't get a
positive maturity signal for lands in `REVIEW` instead of being guessed.

---

## Requirements

Python 3.8+. No `pip install` needed.

## Quick start

```bash
# 1. Point it at your LoRA folder. Provide your Civitai token for best results.
export CIVITAI_TOKEN=your_token_here
python3 scan_loras.py "Z:/ai/models/Lora" --out ./catalog

# 2. Look at ./catalog/lora-catalog.csv in a spreadsheet. Fix anything wrong.
#    Save your edits as ./catalog/overrides.csv (keep the sha256 column).

# 3. Re-run applying your corrections:
python3 scan_loras.py "Z:/ai/models/Lora" --out ./catalog --overrides ./catalog/overrides.csv

# 4. Preview the on-disk sort, then do it:
python3 scan_loras.py "Z:/ai/models/Lora" --out ./catalog --overrides ./catalog/overrides.csv --organize plan
python3 scan_loras.py "Z:/ai/models/Lora" --out ./catalog --overrides ./catalog/overrides.csv --organize move
```

`move` sorts in place, under your LoRA folder. To sort into a *separate* tree
(leaving originals untouched) use `--organize copy --dest "Z:/ai/models/Lora-sorted"`.

## Outputs (written to `--out`)

| File | What it is |
|------|------------|
| `lora-catalog.json` | Full data. Each entry has a `resource` object (import-ready for `/api/resources/batch`) plus a `meta` object (detection details, confidence, review flags). |
| `lora-catalog.csv` | The human review sheet. Open in any spreadsheet. |
| `lora-move-plan.csv` | The sort plan (written whenever `--organize` is used). Preview it before a real move. |
| `lora-move-log.csv` | `from,to` record of files actually moved — your undo trail. |
| `.lora-cache.sqlite` | Hash + API-result cache. Delete to force a full re-scan. |

## Options

| Flag | Default | Meaning |
|------|---------|---------|
| `folder` | — | Folder to scan (recursive). Required. |
| `--out DIR` | `.` | Where catalog files go. |
| `--civitai-token TOK` | `$CIVITAI_TOKEN` | Your Civitai API token. |
| `--no-civitai` | off | Skip Civitai lookups. |
| `--no-archive` | off | Skip the CivArchive fallback. |
| `--workers N` | 6 | Concurrent hash lookups (Civitai/CivArchive). |
| `--hash-workers N` | 8 | Concurrent file hashers. **Raise to 16–24 for a network share (SMB/NAS)** — reads are latency-bound, so concurrency is the main speedup. |
| `--overrides FILE` | — | CSV of manual corrections (keyed by `sha256`). |
| `--organize MODE` | `none` | `plan` (preview), `copy`, or `move`. |
| `--dest DIR` | scanned folder | Destination root for `--organize`. |
| `--cache FILE` | `<out>/.lora-cache.sqlite` | Cache DB location. |

Fully offline run (no network at all): `--no-civitai --no-archive`. Base model
is still detected from metadata/architecture; maturity stays `REVIEW`.

### Speed & resuming

- **The bottleneck is hashing** — matching a file requires a full-file SHA256,
  so every byte gets read. On a **network share (SMB/NAS)** that means reading
  everything over the network. Bump `--hash-workers` (16–24) so reads run
  concurrently instead of one-at-a-time; this is the biggest win.
- **Fastest of all:** run the script *on the machine that physically holds the
  drive*, so reads are local instead of over the network.
- **Interrupt-safe / resumable:** every hash and every API result is cached to
  `<out>/.lora-cache.sqlite` immediately. Press Ctrl+C anytime and re-run the
  same command — already-processed files are skipped, so it resumes where it
  left off. Nothing is lost.

## The overrides workflow

The CSV is round-trippable. To correct auto-detection:

1. Copy `lora-catalog.csv` to `overrides.csv`.
2. Edit any cell you want to override. Recognized columns:
   `customLabel`, `resourceType`, `supportedServer`, `generation`, `isMature`
   (`true`/`false`/`nsfw`/`sfw`), `triggerWords`, `defaultTrigger`, `name`,
   `group`. Leave a cell blank to keep the auto-detected value.
3. Re-run with `--overrides overrides.csv`. Matching is by `sha256`, so your
   corrections survive renames and moves. An overridden row is marked
   reviewed and won't be flagged again.

## Trigger words vs. default trigger

Two distinct fields, because they do different jobs:

- **`triggerWords`** — *every* word/phrase that can activate the LoRA (the full
  list from Civitai/CivArchive). Reference data.
- **`defaultTrigger`** — the specific string kind_robots injects at generation
  time. Seeded equal to `triggerWords`, but meant to be curated. Example: a
  Bugs Bunny LoRA might list `bugsbunny` as a trigger word, while your
  `defaultTrigger` is the richer `bugbunny long-eared cartoon rabbit`.

Both are auto-filled and both are editable via overrides.

## What the catalog maps to in kind_robots

Each `resource` object lines up with the `Resource` model / the
`POST /api/resources/batch` endpoint:

| Catalog field | Resource field | Notes |
|---------------|----------------|-------|
| `name` | `name` (unique) | filename stem |
| `customLabel` | `customLabel` | pretty model name |
| `resourceType` | `resourceType` | `LORA` / `LYCORIS` |
| `supportedServer` | `supportedServer` | `SD15`/`SDXL`/`FLUX`/`KONTEXT`/`COMFY`/`GENERIC`/`UNKNOWN` |
| `generation` | `generation` | exact base-model string, e.g. `Pony` |
| `isMature` | `isMature` | SFW/NSFW |
| `civitaiUrl` | `civitaiUrl` | source link |
| `customUrl` | `customUrl` | CivArchive link (for purged models) |
| `defaultTrigger` | `artPrompt` | injected until the dedicated field ships |

`triggerWords` and `defaultTrigger` are emitted now but need two new `Resource`
columns (`triggerWords`, `defaultTrigger`) added in the import phase of this
project — see the project plan. Until then, `defaultTrigger` is also carried in
the existing `artPrompt` field so nothing is lost.

---

# scan_models.py — the non-LoRA companion

`scan_models.py` handles **everything that isn't a LoRA** — checkpoints, VAEs,
text encoders, diffusion models (UNet), controlnets, upscalers, etc. — and
sorts them into the folders **ComfyUI expects**, so one clean library serves
both ComfyUI and A1111. It reuses `scan_loras.py`'s detection core, so **keep
both files together** (copy the whole `lora-catalog/` folder, not one file).

### How it classifies

1. **Current folder** — your tree already encodes type (`unet/`, `vae/`,
   `text_encoders/`, `controlnet/` …). Most reliable signal; works even for
   files no hash database knows (text encoders, VAEs).
2. **Civitai / CivArchive by hash** — enriches checkpoints with canonical name,
   base model, NSFW flag, trigger words.
3. **safetensors metadata / architecture** — fallback base-model guess.

### Target layout it sorts into

| Your current folder(s) | ComfyUI target |
|---|---|
| `Stable-diffusion/*`, `checkpoints` | `checkpoints/<BaseModel>/` (SDXL, Flux, Pony, Illustrious, SD15, ZImage, Qwen…) |
| video models (SVD, LTX, Wan) | `checkpoints/Video/<Arch>/` (LTX, SVD, Wan, Hunyuan) |
| audio models (Stable-Audio, ACE) | `checkpoints/Audio/` |
| a VAE / text-encoder / upscaler sitting **inside** a video bundle folder | split out to `vae/` · `text_encoders/` · `upscale_models/` (so Comfy's video nodes find them) |
| `unet` **and** `diffusion_models` | `diffusion_models/` (merged) |
| `text_encoders`, `clip` | `text_encoders/` |
| `ESRGAN`, `RealESRGAN`, `SwinIR`, `LDSR`, `latent_upscale_models` | `upscale_models/` (merged) |
| `GFPGAN`, `Codeformer` | `facerestore_models/` |
| `vae`, `clip_vision`, `controlnet`, `hypernetworks`, `embeddings`, `ipadapter`, `gligen`, `sams`, `ultralytics`, `animatediff_models` | same name (already correct) |

Pure tool models (BLIP, RAFT, LLMs, TTS, captioners, deepdanbooru,
liveportrait) are **left in place** — never sorted, never cataloged.

### Usage

```bash
export CIVITAI_TOKEN=xxxx
# Fast preview: classify by folder + write the move plan in SECONDS (no hashing,
# reads no file contents). Best first look at a large (multi-TB) tree.
python3 scan_models.py /mnt/user/pc/ai/models --out ./catalog --no-hash

# Full dry-run: hashes + Civitai enrichment for the catalog. MOVES NOTHING.
python3 scan_models.py /mnt/user/pc/ai/models --out ./catalog

# Review ./catalog/models-move-plan.csv, then execute the sort:
python3 scan_models.py /mnt/user/pc/ai/models --out ./catalog --organize move
```

`--organize` defaults to `plan` here (not `none`) — the whole point is to
preview the reorg. Outputs: `models-catalog.json` / `.csv`,
`models-move-plan.csv`, and (after a real move) `models-move-log.csv` for undo.
Same flags as `scan_loras.py` (`--no-civitai`, `--no-archive`, `--overrides`,
`--hash-workers`, `--dest`), plus:
- `--no-hash` — fast folder-only classification (see above).
- `--skip-video` — leave video/audio models (SVD, LTX, Wan, Stable-Audio) in
  place instead of sorting them. Use when they live in mixed bundle folders or
  drive video workflows you don't want disturbed.

**Big-file hashing:** these models are large (multi-GB). scan_models only
hashes kinds a by-hash lookup can identify (checkpoints, video, diffusion
models) — text encoders, VAEs, clip-vision, and upscalers skip hashing (no hash
DB indexes them anyway; they're cataloged from their folder). Keep
`--hash-workers` **low (2–3, the default is 3)** on a spinning array/NAS:
concurrent multi-GB reads seek-thrash the disks and throughput collapses. The
hash cache makes interrupted runs resumable, so a stalled run loses nothing.

Offline base-model detection knows the current architectures (SD15, SDXL, Pony,
Illustrious, NoobAI, Flux, Kontext, ZImage, Qwen, Wan, Hunyuan/3D). Anything it
can't place from folder/filename lands in `checkpoints/Unknown` and is resolved
by the hashed Civitai/CivArchive pass (drop `--no-hash`).

### Which files become Resources

**Checkpoints + components** (`diffusion_models`, `text_encoders`, `vae`) get
Resource records — including **video and audio** models (SVD/LTX/Wan/Stable-Audio),
which are in scope for kind_robots' video features (GIFs, effects, animation).
Infrastructure (upscalers, face restore, clip_vision, controlnet unless you
widen scope) is sorted into the right folder but not cataloged. `--skip-video`
leaves the whole video/audio set in place if you'd rather not touch it.

> **Schema note:** the component kinds map to `resourceType` values
> `DIFFUSION_MODEL`, `TEXT_ENCODER`, `VAE` that **do not exist in the
> `ResourceType` enum yet**. The phase-2 Prisma migration must add them (or the
> importer falls back to `CHECKPOINT` + `generation`). This is flagged in the
> catalog so nothing imports with an invalid enum by surprise.

---

# import_catalog.py — load a catalog into kind_robots Resources

Once a catalog looks right, push it into the `Resource` table via the batch
endpoint (`POST /api/resources/batch`). Duplicate names are skipped server-side,
so re-running is safe and incremental.

**Requires the phase-2 schema migration** (`prisma/migrations/*_lora_catalog_fields`),
which adds `triggerWords` + `defaultTrigger` columns to `Resource` and the
`VAE` / `TEXT_ENCODER` / `DIFFUSION_MODEL` (ResourceType) and `LTX` / `WAN`
(SupportedServer) enum values. Run `prisma migrate deploy` before importing.

Auth is a **kind_robots API key** (a user API key or admin token) sent as
`x-api-key` — NOT your Civitai token.

```bash
# Always dry-run first — writes the payload, sends nothing:
python3 import_catalog.py catalog/lora-catalog.json --url https://kindrobots.org --dry-run

# Real import (skip rows still flagged needs_review):
python3 import_catalog.py catalog/lora-catalog.json \
    --url https://kindrobots.org --api-key YOUR_KR_KEY --skip-review

# Both catalogs, and a test run capped at 20 first:
python3 import_catalog.py catalog/lora-catalog.json catalog/models-catalog.json \
    --url https://kindrobots.org --api-key YOUR_KR_KEY --limit 20
```

| Flag | Meaning |
|------|---------|
| `--url` | kind_robots base URL (required). |
| `--api-key` | kind_robots API key, or set `KR_API_KEY`. Sent as `x-api-key`. |
| `--dry-run` | Build + write the payload (`import-payload.json`), POST nothing. |
| `--skip-review` | Skip rows the catalog flagged `needs_review`. |
| `--mature only\|none\|all` | Import only mature, only SFW, or everything (default). |
| `--limit N` | Import at most N (handy for a first test). |
| `--batch-size N` | Records per POST (default 50). |

Infra rows (a model with no Resource record — tool models, uncataloged
video components) are skipped automatically. Names over the 191-char server
limit are truncated, with the full name preserved in `customLabel`.

---

### After the sort: point A1111 at the Comfy library

Once everything is under ComfyUI's `models/`, tell A1111 to read the same
folders instead of duplicating files. Launch A1111 with, e.g.:

```
--ckpt-dir     /mnt/user/pc/ai/models/checkpoints
--lora-dir     /mnt/user/pc/ai/models/loras
--vae-dir      /mnt/user/pc/ai/models/vae
--embeddings-dir /mnt/user/pc/ai/models/embeddings
```

(or set them in `webui-user.sh`). That way both engines share one canonical,
sorted library.
