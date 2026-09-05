from pathlib import Path


DEPLOY_SCRIPT = Path(__file__).resolve().parents[2] / "scripts" / "deploy-unraid.sh"


def script_text() -> str:
    return DEPLOY_SCRIPT.read_text(encoding="utf-8")


def test_orphan_cleanup_is_scoped_to_kindrobots_images() -> None:
    text = script_text()

    assert 'IMAGE_SOURCE_LABEL="${KIND_ROBOTS_IMAGE_SOURCE_LABEL:-https://github.com/silasfelinus/kind_robots}"' in text
    assert '--filter dangling=true' in text
    assert '--filter "label=org.opencontainers.image.source=$IMAGE_SOURCE_LABEL"' in text
    assert 'docker image rm "$image_id"' in text
    assert "docker image prune" not in text


def test_orphan_cleanup_never_precedes_successful_health_check() -> None:
    text = script_text()

    wait_index = text.index("wait_for_health\n\nfinal_id=")
    post_health_cleanup_index = text.index(
        'cleanup_dangling_kindrobots_images "$final_id"', wait_index
    )

    assert post_health_cleanup_index > wait_index


def test_noop_deploy_also_cleans_existing_kindrobots_orphans() -> None:
    text = script_text()
    noop_block = text.split('if [[ "$needs_update" == false ]]; then', 1)[1].split("fi", 1)[0]

    assert 'cleanup_dangling_kindrobots_images "$running_id"' in noop_block
    assert "exit 0" in noop_block
