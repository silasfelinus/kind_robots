"""Checkpoint/model scanner must retain Civitai identity on Resource payloads."""

import importlib.util
import os
import sys

_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
_CATALOG = os.path.join(_ROOT, "scripts", "lora-catalog")


def _load(name, filename):
    path = os.path.join(_CATALOG, filename)
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


scan_loras = _load("scan_loras", "scan_loras.py")
scan_models = _load("scan_models", "scan_models.py")


def test_civitai_model_and_version_ids_survive_checkpoint_cataloging():
    row = scan_models.ModelEntry(
        name="example",
        filename="example.safetensors",
        kind="checkpoint",
        target_rel="checkpoints/SDXL/example.safetensors",
    )
    payload = {
        "modelId": 1234,
        "id": 5678,
        "baseModel": "SDXL 1.0",
        "trainedWords": ["example"],
        "images": [],
        "model": {
            "name": "Example Checkpoint",
            "type": "Checkpoint",
            "nsfw": False,
        },
    }

    assert scan_models.enrich_civitai(row, payload)
    resource = scan_models.to_resource(row)

    assert row.civitaiModelId == 1234
    assert row.civitaiModelVersionId == 5678
    assert resource["civitaiModelId"] == 1234
    assert resource["civitaiModelVersionId"] == 5678


def test_archive_ids_fill_only_when_civitai_did_not_already_identify_row():
    row = scan_models.ModelEntry(
        name="archived",
        filename="archived.safetensors",
        kind="checkpoint",
        target_rel="checkpoints/SDXL/archived.safetensors",
        civitaiModelId=11,
        civitaiModelVersionId=22,
    )
    payload = {
        "model": {
            "id": 99,
            "name": "Archived Checkpoint",
            "type": "Checkpoint",
            "version": {
                "id": 100,
                "baseModel": "SDXL 1.0",
                "trigger": [],
                "images": [],
            },
        }
    }

    assert scan_models.enrich_archive(row, payload)
    assert row.civitaiModelId == 11
    assert row.civitaiModelVersionId == 22
