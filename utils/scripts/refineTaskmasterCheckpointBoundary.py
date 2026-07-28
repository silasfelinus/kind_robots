from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:100]!r}")
    path.write_text(text.replace(old, new, 1))


store = Path("stores/taskmasterStore.ts")
page = Path("components/pages/taskmaster-page.vue")

replace_once(
    store,
    """      session.value?.checkpoints.filter((checkpoint) =>
        ['pending', 'active', 'proposed-complete'].includes(checkpoint.status),
      ) ?? [],
""",
    """      session.value?.checkpoints.filter((checkpoint) =>
        ['pending', 'active'].includes(checkpoint.status),
      ) ?? [],
""",
)

replace_once(
    store,
    """  }): Promise<boolean> {
    const seed: TaskmasterStorySeed = {
""",
    """  }): Promise<boolean> {
    await loadRealSurfaces()
    const seed: TaskmasterStorySeed = {
""",
)

replace_once(
    page,
    """              <p v-else class="mt-1 text-xs text-base-content/55">
                All planned checkpoints have an outcome. The quest can now close.
              </p>
""",
    """              <p v-else class="mt-1 text-xs text-base-content/55">
                All planned checkpoints have an outcome. Review any optional Apply
                actions, then finish the quest.
              </p>
""",
)

print("Refined Taskmaster checkpoint boundary")
