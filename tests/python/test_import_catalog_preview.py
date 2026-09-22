"""Post-import preview queueing stays Resource-aware and idempotency-friendly."""

import importlib.util
import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_PATH = os.path.join(_ROOT, "scripts", "lora-catalog", "import_catalog.py")

_spec = importlib.util.spec_from_file_location("import_catalog", _PATH)
import_catalog = importlib.util.module_from_spec(_spec)
sys.modules["import_catalog"] = import_catalog
_spec.loader.exec_module(import_catalog)


def test_only_blind_renderable_model_resources_need_generated_preview():
    assert import_catalog.needs_generated_preview(
        {"id": 1, "resourceType": "LORA", "artImageId": None, "imagePath": None}
    )
    assert import_catalog.needs_generated_preview(
        {"id": 2, "resourceType": "CHECKPOINT", "artImageId": None, "imagePath": ""}
    )
    assert not import_catalog.needs_generated_preview(
        {"id": 3, "resourceType": "LORA", "artImageId": 91, "imagePath": None}
    )
    assert not import_catalog.needs_generated_preview(
        {"id": 4, "resourceType": "VAE", "artImageId": None, "imagePath": None}
    )


def test_preview_queue_uses_lora_planner_and_checkpoint_endpoint(monkeypatch):
    calls = []

    def fake_post(_url, _key, path, body, timeout=60):
        calls.append((path, body))
        if path == "/api/lora/probe-plan":
            assert body["resourceIds"] == [1]
            return 200, {
                "success": True,
                "data": {
                    "plans": [
                        {
                            "resourceId": 1,
                            "enqueue": {
                                "engine": "comfy",
                                "promptString": "trigger",
                                "entityArt": {
                                    "entityType": "resource",
                                    "entityId": 1,
                                    "field": "imagePath",
                                    "mode": "recreate",
                                },
                            },
                        }
                    ],
                    "skipped": [],
                },
            }
        if path == "/api/art/enqueue":
            assert body["projectSlug"] == "resource-previews"
            assert body["priority"] == 1
            return 201, {
                "success": True,
                "data": {"jobId": 101, "deduplicated": False},
            }
        if path == "/api/resources/2/generate-preview":
            return 200, {
                "success": True,
                "data": {"jobId": 202, "deduplicated": True},
            }
        raise AssertionError(path)

    monkeypatch.setattr(import_catalog, "post_json", fake_post)

    result = import_catalog.queue_preview_jobs(
        "https://example.invalid",
        "secret-never-logged",
        [
            {"id": 1, "resourceType": "LORA", "artImageId": None, "imagePath": None},
            {"id": 2, "resourceType": "CHECKPOINT", "artImageId": None, "imagePath": None},
            {"id": 3, "resourceType": "LORA", "artImageId": 303, "imagePath": None},
        ],
    )

    assert result["queued"] == 1
    assert result["deduplicated"] == 1
    assert result["failed"] == 0
    assert result["jobIds"] == [101, 202]
    assert result["resources"] == [1, 2]
    assert [path for path, _ in calls] == [
        "/api/lora/probe-plan",
        "/api/art/enqueue",
        "/api/resources/2/generate-preview",
    ]
