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
    assert not any(
        line.lstrip().startswith("docker image prune") for line in text.splitlines()
    )


def test_orphan_cleanup_never_precedes_successful_health_check() -> None:
    text = script_text()

    wait_index = text.index("if ! wait_for_health; then\n  recover_container_after_failed_health")
    post_health_cleanup_index = text.index(
        'cleanup_dangling_kindrobots_images "$final_id"', wait_index
    )

    assert post_health_cleanup_index > wait_index


def test_noop_deploy_recovers_stopped_container_before_cleanup() -> None:
    text = script_text()
    noop_block = text.split('if [[ "$needs_update" == false ]]; then', 1)[1].split(
        "\nfi\n\nlog", 1
    )[0]

    ensure_index = noop_block.index("ensure_container_running")
    health_index = noop_block.index("wait_for_health")
    cleanup_index = noop_block.index('cleanup_dangling_kindrobots_images "$running_id"')

    assert ensure_index < health_index < cleanup_index
    assert "exit 0" in noop_block


def test_failed_update_health_attempts_one_recovery() -> None:
    text = script_text()

    assert "recover_container_after_failed_health()" in text
    assert "container failed health after deploy; restarting it once" in text
    assert "if ! wait_for_health; then\n  recover_container_after_failed_health\nfi" in text


def test_interrupted_exact_image_migration_restores_container() -> None:
    text = script_text()

    assert "restart_after_interrupted_exact_image_migration()" in text
    assert "trap restart_after_interrupted_exact_image_migration EXIT" in text
    assert "stopped_for_exact_image_migration=true" in text
    assert "stopped_for_exact_image_migration=false" in text
