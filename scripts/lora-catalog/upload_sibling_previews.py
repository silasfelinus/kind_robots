#!/usr/bin/env python3
"""
Detect preview images beside cataloged model files and upload them as hosted
ArtImages for Resources that do not already have a Civitai/CivArchive or hosted
preview.

Works with both lora-catalog.json and model-catalog.json because each scanner
stores the model's absolute path in entry.meta.abspath.

Examples:
  export KIND_ROBOTS_API_KEY=...
  python3 upload_sibling_previews.py ./catalog/lora-catalog.json \
    --api-base https://kindrobots.org
  python3 upload_sibling_previews.py ./catalog/model-catalog.json \
    --api-base http://localhost:3000 --dry-run
"""

from __future__ import annotations

import argparse
import base64
import json
import mimetypes
import os
import sys
import urllib.error
import urllib.request
from pathlib import Path
from typing import Any, Optional

IMAGE_EXTENSIONS = (".png", ".jpg", ".jpeg", ".webp", ".avif")


def sibling_candidates(model_path: Path) -> list[Path]:
    stem = model_path.stem
    names = []

    for extension in IMAGE_EXTENSIONS:
        names.extend(
            [
                f"{stem}.preview{extension}",
                f"{stem}{extension}",
                f"{model_path.name}.preview{extension}",
            ]
        )

    return [model_path.parent / name for name in names]


def find_sibling_preview(model_path: Path) -> Optional[Path]:
    for candidate in sibling_candidates(model_path):
        if candidate.is_file():
            return candidate
    return None


def api_request(
    url: str,
    api_key: str,
    method: str = "GET",
    body: Optional[dict[str, Any]] = None,
) -> dict[str, Any]:
    data = json.dumps(body).encode("utf-8") if body is not None else None
    headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "x-api-key": api_key,
        "Authorization": f"Bearer {api_key}",
        "User-Agent": "kind-robots-sibling-preview-uploader/1.0",
    }
    request = urllib.request.Request(
        url,
        data=data,
        headers=headers,
        method=method,
    )

    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            return json.loads(response.read().decode("utf-8", "replace"))
    except urllib.error.HTTPError as error:
        message = error.read().decode("utf-8", "replace")
        raise RuntimeError(f"HTTP {error.code}: {message}") from error


def load_catalog(path: Path) -> list[dict[str, Any]]:
    with path.open(encoding="utf-8") as handle:
        payload = json.load(handle)

    entries = payload.get("entries")
    if not isinstance(entries, list):
        raise ValueError("Catalog must contain an entries array.")
    return entries


def resource_key(resource: dict[str, Any]) -> tuple[str, str]:
    return (
        str(resource.get("hash") or "").strip().lower(),
        str(resource.get("name") or "").strip().lower(),
    )


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Upload sibling model images as hosted Resource previews."
    )
    parser.add_argument("catalog", type=Path)
    parser.add_argument(
        "--api-base",
        required=True,
        help="Kind Robots base URL, for example https://kindrobots.org",
    )
    parser.add_argument(
        "--api-key",
        default=os.environ.get("KIND_ROBOTS_API_KEY", ""),
        help="User/admin API key. Defaults to KIND_ROBOTS_API_KEY.",
    )
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    if not args.api_key and not args.dry_run:
        print("error: --api-key or KIND_ROBOTS_API_KEY is required", file=sys.stderr)
        return 2

    catalog_entries = load_catalog(args.catalog.expanduser().resolve())
    api_base = args.api_base.rstrip("/")
    resources_response = api_request(
        f"{api_base}/api/resources",
        args.api_key,
    )
    resources = resources_response.get("data") or []

    by_hash: dict[str, dict[str, Any]] = {}
    by_name: dict[str, dict[str, Any]] = {}
    for resource in resources:
        resource_hash, name = resource_key(resource)
        if resource_hash:
            by_hash[resource_hash] = resource
        if name:
            by_name[name] = resource

    detected = uploaded = skipped = missing_resource = failed = 0

    for entry in catalog_entries:
        catalog_resource = entry.get("resource") or {}
        meta = entry.get("meta") or {}
        model_path_raw = meta.get("abspath")
        if not model_path_raw:
            continue

        model_path = Path(str(model_path_raw))
        sibling = find_sibling_preview(model_path)
        if not sibling:
            continue

        detected += 1
        model_hash, model_name = resource_key(catalog_resource)
        resource = by_hash.get(model_hash) or by_name.get(model_name)

        if not resource:
            missing_resource += 1
            print(f"MISS  {model_path.name}: Resource not found in API")
            continue

        if resource.get("artImageId") or resource.get("previewImageUrl"):
            skipped += 1
            print(f"SKIP  {model_path.name}: Resource already has a preview")
            continue

        print(f"FOUND {model_path.name} -> {sibling.name}")
        if args.dry_run:
            continue

        try:
            mime_type = mimetypes.guess_type(sibling.name)[0] or "image/png"
            encoded = base64.b64encode(sibling.read_bytes()).decode("ascii")
            image_data = f"data:{mime_type};base64,{encoded}"
            response = api_request(
                f"{api_base}/api/resources/{resource['id']}/preview-image",
                args.api_key,
                method="POST",
                body={
                    "imageData": image_data,
                    "fileName": sibling.name,
                    "fileType": sibling.suffix.lstrip(".").lower(),
                },
            )

            if response.get("success"):
                uploaded += 1
                print(f"UPLOADED Resource #{resource['id']}")
            else:
                failed += 1
                print(
                    f"FAIL  Resource #{resource['id']}: "
                    f"{response.get('message') or 'unknown error'}"
                )
        except Exception as error:
            failed += 1
            print(f"FAIL  Resource #{resource['id']}: {error}")

    print("\n=== Sibling preview summary ===")
    print(f"  detected         : {detected}")
    print(f"  uploaded         : {uploaded}")
    print(f"  skipped existing : {skipped}")
    print(f"  missing Resource : {missing_resource}")
    print(f"  failed           : {failed}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
