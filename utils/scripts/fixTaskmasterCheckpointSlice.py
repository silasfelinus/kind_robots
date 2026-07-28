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
    "if (hooks.length) return hooks.map(checkpointFromHook)",
    "if (hooks.length) return hooks.slice(0, 5).map(checkpointFromHook)",
)

replace_once(
    store,
    ".join('\n') ?? ''",
    ".join('\\n') ?? ''",
)

replace_once(
    store,
    """    const hook = nextHook()
    return await weaveBeat(buildNextBeatPrompt(trimmed, hook), false, hook)
""",
    """    const hook = nextHook()
    if (!hook) return true
    return await weaveBeat(buildNextBeatPrompt(trimmed, hook), false, hook)
""",
)

replace_once(
    page,
    """      <NarrativeResponseComposer
        v-if="!store.isComplete"
""",
    """      <section
        v-if="store.canClose"
        class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-success/30 bg-success/5 p-3"
      >
        <div>
          <p class="text-sm font-bold text-success">All checkpoints have an outcome</p>
          <p class="mt-0.5 text-xs text-base-content/55">
            Finish the quest for a practical recap of completed, blocked, deferred,
            and missing-information items.
          </p>
        </div>
        <button
          type="button"
          class="btn btn-success btn-sm rounded-xl"
          @click="store.closeStory()"
        >
          Finish the quest
        </button>
      </section>

      <NarrativeResponseComposer
        v-if="!store.isComplete && !store.canClose"
""",
)

print("Fixed Taskmaster checkpoint integration")
