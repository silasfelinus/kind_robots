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
| `--workers N` | 6 | Concurrent hash lookups. |
| `--overrides FILE` | — | CSV of manual corrections (keyed by `sha256`). |
| `--organize MODE` | `none` | `plan` (preview), `copy`, or `move`. |
| `--dest DIR` | scanned folder | Destination root for `--organize`. |
| `--cache FILE` | `<out>/.lora-cache.sqlite` | Cache DB location. |

Fully offline run (no network at all): `--no-civitai --no-archive`. Base model
is still detected from metadata/architecture; maturity stays `REVIEW`.

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
