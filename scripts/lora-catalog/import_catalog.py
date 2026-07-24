#!/usr/bin/env python3
"""
import_catalog.py — Push a scanned catalog into kind_robots Resources.

Reads one or more catalog JSON files produced by scan_loras.py / scan_models.py
and POSTs their import-ready `resource` records to the kind_robots batch
endpoint (POST /api/resources/batch), which upserts them into the Resource
table. Duplicate names are skipped server-side, so re-running is safe.

Auth: pass your kind_robots API key (a user API key or admin token). It is sent
in the `x-api-key` header. This is NOT your Civitai token.

Requires: Python 3.8+. No pip installs.

Examples:
  # Dry run first — writes the combined payload, sends nothing:
  python3 import_catalog.py catalog/lora-catalog.json --url https://kindrobots.org --dry-run

  # Real import (skip the still-unreviewed rows):
  python3 import_catalog.py catalog/lora-catalog.json \
      --url https://kindrobots.org --api-key YOUR_KR_KEY --skip-review

  # Both catalogs at once:
  python3 import_catalog.py catalog/lora-catalog.json catalog/models-catalog.json \
      --url http://localhost:3000 --api-key YOUR_KR_KEY
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

MAX_NAME = 191  # server requiredText() limit on Resource.name


def load_resources(paths: list[Path], skip_review: bool,
                   mature: str) -> tuple[list[dict], dict]:
    """Return (resources, stats). Pulls entry['resource'] from each catalog,
    dropping infra rows (resource == null) and, optionally, unreviewed rows."""
    resources: list[dict] = []
    stats = {"files": 0, "entries": 0, "infra_skipped": 0,
             "review_skipped": 0, "maturity_skipped": 0, "long_name": 0}
    for p in paths:
        data = json.loads(p.read_text(encoding="utf-8"))
        entries = data.get("entries", [])
        stats["files"] += 1
        stats["entries"] += len(entries)
        for e in entries:
            res = e.get("resource")
            if not res:                       # infra/tool row — no Resource
                stats["infra_skipped"] += 1
                continue
            meta = e.get("meta", {})
            if skip_review and meta.get("needs_review"):
                stats["review_skipped"] += 1
                continue
            if mature == "only" and not res.get("isMature"):
                stats["maturity_skipped"] += 1
                continue
            if mature == "none" and res.get("isMature"):
                stats["maturity_skipped"] += 1
                continue
            clean = {k: v for k, v in res.items() if v is not None}
            name = clean.get("name", "")
            if len(name) > MAX_NAME:
                stats["long_name"] += 1
                clean["name"] = name[:MAX_NAME]
                clean.setdefault("customLabel", name)  # keep full name visible
            resources.append(clean)
    return resources, stats


def post_batch(url: str, api_key: str, batch: list[dict],
               timeout: int = 60, retries: int = 3) -> dict:
    endpoint = url.rstrip("/") + "/api/resources/batch"
    payload = json.dumps(batch).encode("utf-8")
    headers = {"x-api-key": api_key, "content-type": "application/json",
               "user-agent": "kind-robots-catalog-importer/1.0"}
    backoff = 2.0
    for attempt in range(retries):
        req = urllib.request.Request(endpoint, data=payload, headers=headers,
                                     method="POST")
        try:
            with urllib.request.urlopen(req, timeout=timeout) as resp:
                return json.loads(resp.read().decode("utf-8", "replace"))
        except urllib.error.HTTPError as e:
            body = e.read().decode("utf-8", "replace")
            try:
                parsed = json.loads(body)
            except ValueError:
                parsed = {"message": body[:300]}
            # 207 (partial) and 400 (all-failed) still return a useful body
            if e.code in (200, 201, 207, 400):
                return parsed
            if e.code in (429, 500, 502, 503, 504) and attempt < retries - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            parsed.setdefault("message", f"HTTP {e.code}")
            parsed["_httpError"] = e.code
            return parsed
        except (urllib.error.URLError, TimeoutError, ConnectionError) as e:
            if attempt < retries - 1:
                time.sleep(backoff)
                backoff *= 2
                continue
            return {"success": False, "message": f"connection error: {e}"}
    return {"success": False, "message": "unreachable"}


def main() -> int:
    ap = argparse.ArgumentParser(description="Import a scanned catalog into kind_robots Resources.")
    ap.add_argument("catalogs", type=Path, nargs="+", help="catalog JSON file(s)")
    ap.add_argument("--url", required=True, help="kind_robots base URL (e.g. https://kindrobots.org)")
    ap.add_argument("--api-key", default=os.environ.get("KR_API_KEY", ""),
                    help="kind_robots API key (or set KR_API_KEY). Sent as x-api-key.")
    ap.add_argument("--batch-size", type=int, default=50)
    ap.add_argument("--skip-review", action="store_true",
                    help="Skip rows still flagged needs_review in the catalog.")
    ap.add_argument("--mature", choices=["all", "only", "none"], default="all",
                    help="Import all rows, only mature, or only SFW (default: all).")
    ap.add_argument("--limit", type=int, default=0, help="Import at most N (0 = no limit; handy for a test run).")
    ap.add_argument("--dry-run", action="store_true", help="Write the payload, POST nothing.")
    ap.add_argument("--out", type=Path, default=Path("import-payload.json"))
    args = ap.parse_args()

    for p in args.catalogs:
        if not p.is_file():
            print(f"error: catalog not found: {p}", file=sys.stderr)
            return 2

    resources, stats = load_resources(args.catalogs, args.skip_review, args.mature)
    if args.limit and len(resources) > args.limit:
        resources = resources[:args.limit]

    print("=== Prepared ===")
    print(f"  catalogs           : {stats['files']}  ({stats['entries']} entries)")
    print(f"  resources to import: {len(resources)}")
    print(f"  infra rows skipped : {stats['infra_skipped']}")
    if args.skip_review:
        print(f"  needs-review skip  : {stats['review_skipped']}")
    if args.mature != "all":
        print(f"  maturity filtered  : {stats['maturity_skipped']}")
    if stats["long_name"]:
        print(f"  names truncated>191: {stats['long_name']} (full name kept in customLabel)")

    if args.dry_run:
        args.out.write_text(json.dumps(resources, indent=2, ensure_ascii=False), encoding="utf-8")
        print(f"\n[dry-run] wrote {len(resources)} records to {args.out} — nothing sent.")
        if resources:
            print("  sample:", json.dumps(resources[0], ensure_ascii=False)[:300])
        return 0

    if not args.api_key:
        print("error: --api-key (or KR_API_KEY) required for a real import.", file=sys.stderr)
        return 2

    total = {"created": 0, "skipped": 0, "failed": 0}
    fail_samples: list[str] = []
    n = len(resources)
    for i in range(0, n, args.batch_size):
        batch = resources[i:i + args.batch_size]
        resp = post_batch(args.url, args.api_key, batch)
        data = resp.get("data") or {}
        c = len(data.get("created", []) or [])
        s = len(data.get("skipped", []) or [])
        f = len(data.get("failed", []) or [])
        # if the endpoint returned an auth/other hard error, surface and stop
        if not data and not resp.get("success", False):
            print(f"\n! batch {i//args.batch_size + 1} error: "
                  f"{resp.get('message', 'unknown')}", file=sys.stderr)
            if resp.get("_httpError") in (401, 403):
                print("  (check --api-key / --url)", file=sys.stderr)
                return 1
        total["created"] += c
        total["skipped"] += s
        total["failed"] += f
        for fail in (data.get("failed") or [])[:3]:
            if len(fail_samples) < 10:
                fail_samples.append(f"{fail.get('name','?')}: {fail.get('message','?')}")
        print(f"\r  imported {min(i+args.batch_size, n)}/{n}  "
              f"(created:{total['created']} skipped:{total['skipped']} "
              f"failed:{total['failed']})", end="", flush=True)
    print("\n\n=== Done ===")
    print(f"  created: {total['created']}  skipped(existing): {total['skipped']}  failed: {total['failed']}")
    if fail_samples:
        print("  first failures:")
        for s in fail_samples:
            print(f"    - {s}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
