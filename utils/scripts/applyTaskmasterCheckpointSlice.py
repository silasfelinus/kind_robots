from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path} but found {count}: {old[:80]!r}")
    path.write_text(text.replace(old, new, 1))


store = Path("stores/taskmasterStore.ts")
page = Path("components/pages/taskmaster-page.vue")

replace_once(
    store,
    """export type TaskmasterRealHook = {
  kind: 'direct-task' | 'honeydo' | 'needs-human'
  title: string
  detail?: string | null
  todoId?: number
  conductorTaskId?: string
  projectSlug?: string
}
""",
    """export type TaskmasterRealHook = {
  kind: 'direct-task' | 'honeydo' | 'needs-human'
  title: string
  detail?: string | null
  todoId?: number
  conductorTaskId?: string
  projectSlug?: string
  checkpointId?: string
}

export type TaskmasterCheckpointOutcome =
  | 'completed'
  | 'blocked'
  | 'deferred'
  | 'needs-info'

export type TaskmasterCheckpointStatus =
  | 'pending'
  | 'active'
  | 'proposed-complete'
  | TaskmasterCheckpointOutcome

export type TaskmasterCheckpoint = {
  id: string
  title: string
  detail?: string | null
  sourceKind: TaskmasterRealHook['kind']
  projectSlug?: string
  todoId?: number
  conductorTaskId?: string
  status: TaskmasterCheckpointStatus
  proposedOutcome?: TaskmasterCheckpointOutcome
  proposedNote?: string
  updatedAt: string
}
""",
)

replace_once(
    store,
    """  todoId?: number
  options?: string[]
}
""",
    """  todoId?: number
  checkpointId?: string
  options?: string[]
}
""",
)

replace_once(
    store,
    """  location?: TaskmasterIngredient
  genre?: TaskmasterIngredient
  beats: TaskmasterBeat[]
  status: 'draft' | 'active' | 'paused' | 'complete'
""",
    """  location?: TaskmasterIngredient
  genre?: TaskmasterIngredient
  checkpoints: TaskmasterCheckpoint[]
  beats: TaskmasterBeat[]
  status: 'draft' | 'active' | 'paused' | 'complete'
""",
)

replace_once(
    store,
    """  const isComplete = computed(() => session.value?.status === 'complete')

  const usedHookKeys = computed(() => {
""",
    """  const isComplete = computed(() => session.value?.status === 'complete')

  const currentCheckpoint = computed(
    () =>
      session.value?.checkpoints.find((checkpoint) => checkpoint.status === 'active') ??
      null,
  )

  const remainingCheckpoints = computed(
    () =>
      session.value?.checkpoints.filter((checkpoint) =>
        ['pending', 'active', 'proposed-complete'].includes(checkpoint.status),
      ) ?? [],
  )

  const usedHookKeys = computed(() => {
""",
)

replace_once(
    store,
    """  function nextHook(): TaskmasterRealHook | null {
    return availableHooks.value[0] ?? null
  }

  function resolveQuestionContext(question: TaskmasterQuestion | undefined) {
""",
    """  function checkpointFromHook(hook: TaskmasterRealHook): TaskmasterCheckpoint {
    return {
      id: makeId(),
      title: hook.title,
      detail: hook.detail,
      sourceKind: hook.kind,
      projectSlug: hook.projectSlug,
      todoId: hook.todoId,
      conductorTaskId: hook.conductorTaskId,
      status: 'pending',
      updatedAt: nowIso(),
    }
  }

  function checkpointToHook(
    checkpoint: TaskmasterCheckpoint | null,
  ): TaskmasterRealHook | null {
    if (!checkpoint) return null
    return {
      kind: checkpoint.sourceKind,
      title: checkpoint.title,
      detail: checkpoint.detail,
      projectSlug: checkpoint.projectSlug,
      todoId: checkpoint.todoId,
      conductorTaskId: checkpoint.conductorTaskId,
      checkpointId: checkpoint.id,
    }
  }

  function buildCheckpointPlan(): TaskmasterCheckpoint[] {
    const hooks = availableHooks.value
    if (hooks.length) return hooks.map(checkpointFromHook)

    const active = session.value
    const slug = active?.projectSlug
    const project = slug ? projectStore.projectForSlug(slug) : null
    if (!active || !slug) return []

    return [
      checkpointFromHook({
        kind: 'direct-task',
        title: `Choose and complete the next concrete action for ${project?.title || slug}`,
        detail:
          'No open project hook was available, so the first checkpoint is to identify and carry out one useful next action.',
        projectSlug: slug,
      }),
    ]
  }

  function activateNextCheckpoint(): TaskmasterCheckpoint | null {
    const active = session.value
    if (!active) return null
    const alreadyActive = active.checkpoints.find(
      (checkpoint) => checkpoint.status === 'active',
    )
    if (alreadyActive) return alreadyActive
    const next = active.checkpoints.find(
      (checkpoint) => checkpoint.status === 'pending',
    )
    if (next) {
      next.status = 'active'
      next.updatedAt = nowIso()
    }
    return next ?? null
  }

  function nextHook(): TaskmasterRealHook | null {
    return checkpointToHook(activateNextCheckpoint())
  }

  function resolveQuestionContext(question: TaskmasterQuestion | undefined) {
""",
)

replace_once(
    store,
    """  function resolveQuestionContext(question: TaskmasterQuestion | undefined) {
    if (!question || question.realWorldKind === 'preference') return null

    if (question.realWorldKind === 'direct-task') {
""",
    """  function resolveQuestionContext(question: TaskmasterQuestion | undefined) {
    if (!question || question.realWorldKind === 'preference') return null

    const checkpoint = question.checkpointId
      ? session.value?.checkpoints.find((entry) => entry.id === question.checkpointId)
      : null
    if (checkpoint) {
      return {
        kind: checkpoint.sourceKind,
        title: checkpoint.title,
      }
    }

    if (question.realWorldKind === 'direct-task') {
""",
)

replace_once(
    store,
    """      status: TaskmasterAnswer['writeBackStatus']
    }[] = []
""",
    """      outcome?: TaskmasterCheckpointOutcome
      status: TaskmasterAnswer['writeBackStatus']
    }[] = []
""",
)

replace_once(
    store,
    """        proposedWrite:
          question.realWorldKind === 'honeydo'
            ? `Marks honey-do #${question.todoId} done and appends this answer to its description.`
            : `Creates an AGENT todo recording the answer for conductor task ${question.conductorTaskId}; the roadmap remains unchanged.`,
        status: beat.answer.writeBackStatus,
""",
    """        proposedWrite:
          question.realWorldKind === 'honeydo'
            ? `Marks honey-do #${question.todoId} done and appends this answer to its description.`
            : `Creates an AGENT todo recording the ${
                activeCheckpoint?.proposedOutcome ?? 'captured'
              } outcome for conductor task ${question.conductorTaskId}; the roadmap remains unchanged.`,
        outcome: activeCheckpoint?.proposedOutcome,
        status: beat.answer.writeBackStatus,
""".replace(
        "      const context = resolveQuestionContext(question)\n      items.push({",
        "      const context = resolveQuestionContext(question)\n      const activeCheckpoint = question.checkpointId\n        ? session.value?.checkpoints.find((entry) => entry.id === question.checkpointId)\n        : null\n      items.push({",
    ),
)

# The replacement above needs the checkpoint lookup inserted explicitly because the source
# block contains the context line immediately before items.push.
text = store.read_text()
needle = """      const context = resolveQuestionContext(question)
      items.push({
        beatId: beat.id,
"""
replacement = """      const context = resolveQuestionContext(question)
      const activeCheckpoint = question.checkpointId
        ? session.value?.checkpoints.find((entry) => entry.id === question.checkpointId)
        : null
      items.push({
        beatId: beat.id,
"""
if needle in text:
    store.write_text(text.replace(needle, replacement, 1))

replace_once(
    store,
    """      beat.answer.writeBackStatus = ok ? 'written' : 'pending-human-gate'
      if (!ok) {
""",
    """      beat.answer.writeBackStatus = ok ? 'written' : 'pending-human-gate'
      const checkpoint = question.checkpointId
        ? active.checkpoints.find((entry) => entry.id === question.checkpointId)
        : null
      if (ok && checkpoint?.status === 'proposed-complete') {
        checkpoint.status = 'completed'
        checkpoint.updatedAt = nowIso()
      }
      if (!ok) {
""",
)

replace_once(
    store,
    """  const canClose = computed(() => {
    const active = session.value
    return Boolean(
      active &&
        active.status === 'active' &&
        active.beats.length >= 2 &&
        !isWeaving.value,
    )
  })
""",
    """  const canClose = computed(() => {
    const active = session.value
    return Boolean(
      active &&
        active.status === 'active' &&
        active.beats.length >= 1 &&
        remainingCheckpoints.value.length === 0 &&
        !isWeaving.value,
    )
  })
""",
)

replace_once(
    store,
    """    try {
      session.value = JSON.parse(raw) as TaskmasterSession
    } catch {
""",
    """    try {
      const restored = JSON.parse(raw) as TaskmasterSession
      if (!Array.isArray(restored.checkpoints)) {
        restored.checkpoints = restored.seed.taskTitle
          ? [
              {
                id: makeId(),
                title: restored.seed.taskTitle,
                detail: 'Restored from an earlier Taskmaster session.',
                sourceKind: 'direct-task',
                projectSlug: restored.projectSlug,
                status:
                  restored.status === 'complete'
                    ? 'completed'
                    : restored.beats.length
                      ? 'active'
                      : 'pending',
                updatedAt: restored.updatedAt || nowIso(),
              },
            ]
          : []
      }
      session.value = restored
    } catch {
""",
)

replace_once(
    store,
    """    if (seed.surprise && !active.location && !active.genre) {
      parts.push(
        'The protagonist asked to be surprised. Choose an unexpected but coherent setting and genre.',
      )
    }

    return parts.join(' ')
""",
    """    if (seed.surprise && !active.location && !active.genre) {
      parts.push(
        'The protagonist asked to be surprised. Choose an unexpected but coherent setting and genre.',
      )
    }
    if (active.checkpoints.length) {
      parts.push(
        `The reviewed practical checkpoint plan is: ${active.checkpoints
          .map((checkpoint, index) => `${index + 1}. ${checkpoint.title}`)
          .join(' ')}`,
      )
    }

    return parts.join(' ')
""",
)

replace_once(
    store,
    """  function buildClosingPrompt(): string {
    return `${PERSONA}

${buildSeedDescription()}

The quest so far:
${buildRecap()}

The protagonist is ready to finish this session. Resolve the fictional threads, plainly summarize any real progress and remaining next action, and end warmly. This is the finale; do NOT end with a question.`
  }
""",
    """  function buildCheckpointSummary(): string {
    return (
      session.value?.checkpoints
        .map(
          (checkpoint) =>
            `- ${checkpoint.title}: ${checkpoint.status}${
              checkpoint.proposedNote ? ` — ${checkpoint.proposedNote}` : ''
            }`,
        )
        .join('\n') ?? ''
    )
  }

  function buildClosingPrompt(): string {
    return `${PERSONA}

${buildSeedDescription()}

The quest so far:
${buildRecap()}

Practical checkpoint ledger:
${buildCheckpointSummary()}

The protagonist is ready to finish this session. Resolve the fictional threads, plainly summarize completed work, blocked or deferred work, missing information, and the next practical action. End warmly. This is the finale; do NOT end with a question.`
  }
""",
)

replace_once(
    store,
    """          projectSlug: active.projectSlug,
          todoId: hook?.todoId,
          conductorTaskId: hook?.conductorTaskId,
        },
""",
    """          projectSlug: active.projectSlug,
          todoId: hook?.todoId,
          conductorTaskId: hook?.conductorTaskId,
          checkpointId: hook?.checkpointId,
        },
""",
)

replace_once(
    store,
    """  async function beginStory(input: {
    tone: TaskmasterTone
    taskTitle?: string
    vibeTags?: string[]
    projectSlug?: string
    surprise?: boolean
    location?: TaskmasterIngredient
    genre?: TaskmasterIngredient
  }): Promise<boolean> {
""",
    """  async function prepareQuest(input: {
    tone: TaskmasterTone
    taskTitle?: string
    vibeTags?: string[]
    projectSlug?: string
    surprise?: boolean
    location?: TaskmasterIngredient
    genre?: TaskmasterIngredient
  }): Promise<boolean> {
""",
)

replace_once(
    store,
    """      location: input.location,
      genre: input.genre,
      beats: [],
      status: 'active',
""",
    """      location: input.location,
      genre: input.genre,
      checkpoints: [],
      beats: [],
      status: 'draft',
""",
)

replace_once(
    store,
    """    saveToLocalStorage()

    const hook = nextHook()
    return await weaveBeat(buildOpeningPrompt(hook), false, hook)
  }

  async function answerCurrentBeat(text: string): Promise<boolean> {
""",
    """    session.value.checkpoints = buildCheckpointPlan()
    saveToLocalStorage()
    return session.value.checkpoints.length > 0
  }

  async function startQuest(): Promise<boolean> {
    const active = session.value
    if (!active || active.status !== 'draft' || !active.checkpoints.length) {
      return false
    }
    active.status = 'active'
    const hook = nextHook()
    active.updatedAt = nowIso()
    saveToLocalStorage()
    return await weaveBeat(buildOpeningPrompt(hook), false, hook)
  }

  async function beginStory(input: Parameters<typeof prepareQuest>[0]): Promise<boolean> {
    const prepared = await prepareQuest(input)
    return prepared ? await startQuest() : false
  }

  async function answerCurrentBeat(
    text: string,
    outcome: TaskmasterCheckpointOutcome = 'completed',
  ): Promise<boolean> {
""",
)

replace_once(
    store,
    """    beat.answer = {
      text: trimmed,
      capturedAt: nowIso(),
      writeBackStatus:
        beat.question.realWorldKind === 'honeydo' ||
        beat.question.realWorldKind === 'needs-human'
          ? 'pending-human-gate'
          : 'not-applicable',
    }
    active.updatedAt = nowIso()
    saveToLocalStorage()

    const hook = nextHook()
""",
    """    const checkpoint = beat.question.checkpointId
      ? active.checkpoints.find((entry) => entry.id === beat.question.checkpointId)
      : currentCheckpoint.value
    beat.answer = {
      text: trimmed,
      capturedAt: nowIso(),
      writeBackStatus:
        (beat.question.realWorldKind === 'honeydo' && outcome === 'completed') ||
        beat.question.realWorldKind === 'needs-human'
          ? 'pending-human-gate'
          : 'not-applicable',
    }
    if (checkpoint) {
      checkpoint.proposedOutcome = outcome
      checkpoint.proposedNote = trimmed
      checkpoint.status =
        outcome === 'completed' &&
        (checkpoint.sourceKind === 'honeydo' || checkpoint.sourceKind === 'needs-human')
          ? 'proposed-complete'
          : outcome
      checkpoint.updatedAt = nowIso()
    }
    active.updatedAt = nowIso()
    saveToLocalStorage()

    const hook = nextHook()
""",
)

replace_once(
    store,
    """    isComplete,
    canClose,
    availableHooks,
""",
    """    isComplete,
    canClose,
    currentCheckpoint,
    remainingCheckpoints,
    availableHooks,
""",
)

replace_once(
    store,
    """    resetSession,
    beginStory,
    answerCurrentBeat,
""",
    """    resetSession,
    prepareQuest,
    startQuest,
    beginStory,
    answerCurrentBeat,
""",
)

replace_once(
    page,
    """  type TaskmasterIngredient,
  type TaskmasterTone,
""",
    """  type TaskmasterCheckpointOutcome,
  type TaskmasterIngredient,
  type TaskmasterTone,
""",
)

replace_once(
    page,
    """const vibeInput = ref('')
const answerInput = ref('')
""",
    """const vibeInput = ref('')
const answerInput = ref('')
const selectedOutcome = ref<TaskmasterCheckpointOutcome>('completed')

const checkpointOutcomes: {
  value: TaskmasterCheckpointOutcome
  label: string
  helper: string
}[] = [
  { value: 'completed', label: 'Completed', helper: 'The action is genuinely done.' },
  { value: 'blocked', label: 'Blocked', helper: 'Something external prevents progress.' },
  { value: 'deferred', label: 'Deferred', helper: 'This is intentionally postponed.' },
  { value: 'needs-info', label: 'Needs info', helper: 'A question or missing fact comes next.' },
]
""",
)

replace_once(
    page,
    """  await store.beginStory({
""",
    """  await store.prepareQuest({
""",
)

replace_once(
    page,
    """  answerInput.value = ''
  await store.answerCurrentBeat(text)
""",
    """  answerInput.value = ''
  const outcome = selectedOutcome.value
  selectedOutcome.value = 'completed'
  await store.answerCurrentBeat(text, outcome)
""",
)

replace_once(
    page,
    """    <div v-else class="flex min-h-0 flex-1 flex-col gap-3">
      <div
        v-if="store.session.seed.taskTitle"
""",
    """    <div
      v-else-if="store.session.status === 'draft'"
      class="space-y-4 rounded-2xl border border-secondary/25 bg-secondary/5 p-4"
    >
      <div>
        <p class="text-xs font-bold uppercase tracking-wide text-secondary/70">
          Review the practical plan
        </p>
        <h3 class="mt-1 text-xl font-black">The quest starts with real checkpoints</h3>
        <p class="mt-1 text-sm leading-relaxed text-base-content/60">
          Taskmaster will weave these actions into the fiction in order. The plan is
          saved before narration begins, and no external task changes happen without
          an explicit Apply action.
        </p>
      </div>
      <article
        v-for="(checkpoint, index) in store.session.checkpoints"
        :key="checkpoint.id"
        class="rounded-2xl border border-base-300 bg-base-100 p-3"
      >
        <div class="flex items-start gap-3">
          <span class="badge badge-secondary badge-sm mt-0.5 rounded-xl">
            {{ index + 1 }}
          </span>
          <div class="min-w-0 flex-1">
            <p class="font-bold">{{ checkpoint.title }}</p>
            <p v-if="checkpoint.detail" class="mt-1 text-xs text-base-content/55">
              {{ checkpoint.detail }}
            </p>
            <p class="mt-1 text-[0.7rem] uppercase tracking-wide text-base-content/40">
              {{ checkpoint.sourceKind.replace('-', ' ') }}
            </p>
          </div>
        </div>
      </article>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="btn btn-secondary rounded-xl"
          :disabled="store.isWeaving || !store.session.checkpoints.length"
          @click="store.startQuest()"
        >
          <Icon name="kind-icon:story" class="size-4" /> Start the adventure
        </button>
        <button
          type="button"
          class="btn btn-ghost rounded-xl border border-base-300 bg-base-100"
          :disabled="store.isWeaving"
          @click="startOver"
        >
          Edit setup
        </button>
      </div>
    </div>

    <div v-else class="flex min-h-0 flex-1 flex-col gap-3">
      <div
        v-if="store.session.seed.taskTitle"
""",
)

replace_once(
    page,
    """      <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <NarrativeTranscript
""",
    """      <div class="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
        <section
          v-if="store.session.checkpoints.length"
          class="space-y-3 rounded-2xl border border-secondary/20 bg-secondary/5 p-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p class="text-[0.7rem] font-bold uppercase tracking-wide text-secondary/75">
                Practical checkpoint plan
              </p>
              <p v-if="store.currentCheckpoint" class="mt-1 text-sm font-semibold">
                Current action: {{ store.currentCheckpoint.title }}
              </p>
              <p v-else class="mt-1 text-xs text-base-content/55">
                All planned checkpoints have an outcome. The quest can now close.
              </p>
            </div>
            <span class="badge badge-secondary badge-sm rounded-xl">
              {{ store.remainingCheckpoints.length }} remaining
            </span>
          </div>
          <div class="grid gap-2 sm:grid-cols-2">
            <article
              v-for="checkpoint in store.session.checkpoints"
              :key="checkpoint.id"
              class="rounded-xl border border-base-300 bg-base-100 p-2.5 text-xs"
            >
              <div class="flex items-start justify-between gap-2">
                <p class="font-bold">{{ checkpoint.title }}</p>
                <span
                  class="badge badge-sm rounded-xl"
                  :class="
                    checkpoint.status === 'completed'
                      ? 'badge-success'
                      : checkpoint.status === 'active'
                        ? 'badge-secondary'
                        : checkpoint.status === 'blocked' ||
                            checkpoint.status === 'needs-info'
                          ? 'badge-warning'
                          : 'badge-ghost'
                  "
                >
                  {{ checkpoint.status.replace('-', ' ') }}
                </span>
              </div>
              <p v-if="checkpoint.proposedNote" class="mt-1 text-base-content/55">
                {{ checkpoint.proposedNote }}
              </p>
            </article>
          </div>
        </section>

        <NarrativeTranscript
""",
)

replace_once(
    page,
    """      <NarrativeResponseComposer
        v-if="!store.isComplete"
""",
    """      <section
        v-if="!store.isComplete && store.awaitingAnswer && store.currentCheckpoint"
        class="space-y-2 rounded-2xl border border-info/25 bg-info/5 p-3"
      >
        <div>
          <p class="text-[0.7rem] font-bold uppercase tracking-wide text-info/75">
            What happened in the real world?
          </p>
          <p class="mt-1 text-xs text-base-content/55">
            Choose the honest checkpoint outcome, then describe what happened below.
          </p>
        </div>
        <div class="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <button
            v-for="outcome in checkpointOutcomes"
            :key="outcome.value"
            type="button"
            class="rounded-xl border p-2 text-left text-xs transition"
            :class="
              selectedOutcome === outcome.value
                ? 'border-info bg-info text-info-content'
                : 'border-base-300 bg-base-100 hover:border-info/50'
            "
            :aria-pressed="selectedOutcome === outcome.value"
            @click="selectedOutcome = outcome.value"
          >
            <span class="font-bold">{{ outcome.label }}</span>
            <span class="mt-0.5 block opacity-70">{{ outcome.helper }}</span>
          </button>
        </div>
      </section>

      <NarrativeResponseComposer
        v-if="!store.isComplete"
""",
)

replace_once(
    page,
    """  if (realThreadCount) {
    items.push({
      label: 'Real threads',
      value: `${realThreadCount} answer${realThreadCount === 1 ? '' : 's'} captured`,
    })
  }
  return items
""",
    """  if (realThreadCount) {
    items.push({
      label: 'Real threads',
      value: `${realThreadCount} answer${realThreadCount === 1 ? '' : 's'} captured`,
    })
  }
  const completed = active.checkpoints.filter(
    (checkpoint) => checkpoint.status === 'completed',
  ).length
  const unresolved = active.checkpoints.length - completed
  items.push({
    label: 'Checkpoint result',
    value: `${completed} completed · ${unresolved} blocked, deferred, or awaiting follow-up`,
  })
  return items
""",
)

print("Applied Taskmaster checkpoint engine slice")
