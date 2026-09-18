#!/usr/bin/env python3
"""Backfill ResourcePreview from Civitai, one model version at a time.

`Resource.previewImageUrl` holds exactly one url, so a LoRA's gallery showed a
single picture however many the model shipped with -- Fantasy_art_XL_V1
(civitai 122806) has ten. This fetches the rest.

WHERE THE IDS COME FROM. `civitaiModelVersionId` is populated only for rows
scan_loras.py resolved by hash; most rows have it NULL but carry the ids in
`civitaiUrl` (https://civitai.com/models/122806?modelVersionId=133805). Both are
read, the column first.

MATURITY IS PER IMAGE. Civitai rates each one: 1 PG, 2 PG-13, 4 R, 8 X, 16 XXX,
32 blocked. `isMature` is set for R and above, so the site's own maturity rule
can act on a single preview instead of the whole Resource. Blocked images are
skipped outright -- Civitai will not serve them.

Re-runnable: rows are upserted on (resourceId, url), so a second pass refreshes
metadata and adds anything new without duplicating. Ordering follows upstream,
which is the author's own ordering.

  export KR_API_TOKEN=...
  python3 scripts/backfill_civitai_previews.py --limit 25 --dry-run
  python3 scripts/backfill_civitai_previews.py
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = os.environ.get("KR_API_BASE", "https://kindrobots.org")
CIVITAI = "https://civitai.com/api/v1"
TOKEN = os.environ.get("KR_API_TOKEN", "")

# Civitai's own scale. R and above is what this site calls mature.
MATURE_FROM = 4
BLOCKED = 32

VERSION_IN_URL = re.compile(r"[?&]modelVersionId=(\d+)")
MODEL_IN_URL = re.compile(r"/models/(\d+)")


def kr(path: str, method: str = "GET", body=None, timeout: int = 90):
    url = path if path.startswith("http") else BASE + path
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("Authorization", f"Bearer {TOKEN}")
    if data:
        req.add_header("Content-Type", "application/json")
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, json.loads(r.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            return e.code, json.loads(raw or "{}")
        except Exception:
            return e.code, {"raw": raw[:300]}


def civitai_version(version_id: int):
    """The model-version payload, or None when Civitai does not serve it."""
    try:
        req = urllib.request.Request(f"{CIVITAI}/model-versions/{version_id}")
        req.add_header("User-Agent", "kind-robots-preview-backfill/1.0")
        with urllib.request.urlopen(req, timeout=45) as r:
            return json.loads(r.read().decode())
    except urllib.error.HTTPError as e:
        return {"__error__": f"HTTP {e.code}"}
    except Exception as e:  # network, timeout, malformed json
        return {"__error__": str(e)[:120]}


def version_id_for(resource: dict) -> int | None:
    stored = resource.get("civitaiModelVersionId")
    if isinstance(stored, int) and stored > 0:
        return stored
    match = VERSION_IN_URL.search(str(resource.get("civitaiUrl") or ""))
    return int(match.group(1)) if match else None


def previews_from(payload: dict, resource_is_mature: bool = False) -> list[dict]:
    out = []
    for order, image in enumerate(payload.get("images") or []):
        url = str(image.get("url") or "").strip()
        if not url:
            continue
        level = image.get("nsfwLevel")
        level = level if isinstance(level, int) else None
        if level == BLOCKED:
            continue  # Civitai will not serve it; storing the url is pointless
        out.append(
            {
                "url": url[:764],
                "sortOrder": order,
                "nsfwLevel": level,
                "isMature": bool(
                    resource_is_mature
                    or (level is not None and level >= MATURE_FROM)
                ),
                "width": image.get("width"),
                "height": image.get("height"),
                "blurHash": (str(image.get("hash"))[:64] if image.get("hash") else None),
                "mediaType": (str(image.get("type"))[:16] if image.get("type") else None),
            }
        )
    return out


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--limit", type=int, default=0, help="stop after N resources")
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--sleep", type=float, default=0.4, help="seconds between Civitai calls")
    parser.add_argument("--only", type=int, default=0, help="a single resource id")
    args = parser.parse_args()

    if not TOKEN:
        print("KR_API_TOKEN is required", file=sys.stderr)
        return 2

    # NOT /api/resources: resourceListSelect drops civitaiUrl (the catalog
    # payload was trimmed because it broke on a tablet), so the list cannot say
    # which rows have an upstream model version. This endpoint returns just the
    # four fields this needs, for active rows that carry a Civitai reference.
    status, body = kr("/api/resources/civitai-candidates")
    if status != 200 or not body.get("success"):
        print(f"could not list Civitai candidates: {status} {str(body.get('message'))[:120]}", file=sys.stderr)
        return 1

    resources = body["data"]
    if args.only:
        resources = [r for r in resources if r["id"] == args.only]

    candidates = [(r, version_id_for(r)) for r in resources]
    candidates = [(r, v) for r, v in candidates if v]
    if args.limit:
        candidates = candidates[: args.limit]

    print(f"{len(resources)} active resources, {len(candidates)} with a Civitai version id")
    if args.dry_run:
        print("(dry run: nothing is written)")

    written = skipped = failed = images = 0

    for index, (resource, version_id) in enumerate(candidates, 1):
        payload = civitai_version(version_id)
        time.sleep(args.sleep)

        if "__error__" in payload:
            failed += 1
            print(f"  [{index}/{len(candidates)}] {resource['id']} v{version_id}: {payload['__error__']}")
            continue

        previews = previews_from(payload, bool(resource.get("isMature")))
        if not previews:
            skipped += 1
            continue

        images += len(previews)
        if args.dry_run:
            print(f"  [{index}/{len(candidates)}] {resource['id']} {str(resource['name'])[:34]:34} -> {len(previews)} image(s)")
            continue

        status, response = kr(
            f"/api/resources/{resource['id']}/previews",
            method="PUT",
            body={"previews": previews, "source": "civitai"},
        )
        if status == 200 and response.get("success"):
            written += 1
        else:
            failed += 1
            print(f"  [{index}/{len(candidates)}] {resource['id']}: write failed {status} {str(response.get('message'))[:90]}")

    print(
        f"\nresources written: {written}  no images: {skipped}  failed: {failed}  "
        f"preview rows seen: {images}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
