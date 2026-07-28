from pathlib import Path


def replace_once(path: Path, old: str, new: str) -> None:
    text = path.read_text()
    count = text.count(old)
    if count != 1:
        raise RuntimeError(f"Expected one match in {path}, found {count}: {old[:140]!r}")
    path.write_text(text.replace(old, new, 1))


store = Path("stores/storymakerStore.ts")
page = Path("components/conductor/storymaker-page.vue")

replace_once(
    store,
    """export type StorymakerStartInput = {
""",
    """export type StorymakerExport = {
  filename: string
  mimeType: 'text/markdown' | 'application/json'
  content: string
}

export type StorymakerStartInput = {
""",
)

replace_once(
    store,
    """const STORAGE_KEY = 'storymaker-session'
const DRAFT_STORAGE_KEY = 'storymaker-setup-draft'
""",
    """const STORAGE_KEY = 'storymaker-session'
const DRAFT_STORAGE_KEY = 'storymaker-setup-draft'
const LIBRARY_STORAGE_KEY = 'storymaker-session-library-v1'
const MAX_LIBRARY_SESSIONS = 20
""",
)

replace_once(
    store,
    """function normalizeRestoredSession(value: StorymakerSession): StorymakerSession {
""",
    """function cloneSession(value: StorymakerSession): StorymakerSession {
  return normalizeRestoredSession(
    JSON.parse(JSON.stringify(value)) as StorymakerSession,
  )
}

function exportFilename(title: string, extension: 'md' | 'json'): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
  return `${slug || 'storymaker-story'}.${extension}`
}

function normalizeRestoredSession(value: StorymakerSession): StorymakerSession {
""",
)

replace_once(
    store,
    """  const setupDraft = ref<StorymakerSetupDraft>(defaultDraft())
  const session = ref<StorymakerSession | null>(null)
""",
    """  const setupDraft = ref<StorymakerSetupDraft>(defaultDraft())
  const session = ref<StorymakerSession | null>(null)
  const library = ref<StorymakerSession[]>([])
""",
)

replace_once(
    store,
    """  const isComplete = computed(() => session.value?.status === 'complete')
""",
    """  const isComplete = computed(() => session.value?.status === 'complete')
  const recentStories = computed(() => {
    const userId = userStore.authenticatedUserId
    return library.value
      .filter((entry) => entry.userId === userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  })
""",
)

replace_once(
    store,
    """  function persist() {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(setupDraft.value))
      if (session.value) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session.value))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Private browsing and storage quotas should not break the studio.
    }
  }

  function restoreFromLocalStorage() {
    if (typeof localStorage === 'undefined') return
    try {
      const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY)
      const sessionRaw = localStorage.getItem(STORAGE_KEY)
      if (draftRaw) {
        setupDraft.value = {
          ...defaultDraft(),
          ...(JSON.parse(draftRaw) as Partial<StorymakerSetupDraft>),
        }
      }
      if (sessionRaw && !session.value) {
        session.value = normalizeRestoredSession(
          JSON.parse(sessionRaw) as StorymakerSession,
        )
        resumeNarrativeArtJobs()
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      localStorage.removeItem(STORAGE_KEY)
    }
  }
""",
    """  function upsertLibrarySession(value: StorymakerSession): void {
    const copy = cloneSession(value)
    library.value = [
      copy,
      ...library.value.filter((entry) => entry.id !== copy.id),
    ]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, MAX_LIBRARY_SESSIONS)
  }

  function persist() {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(setupDraft.value))
      if (session.value) {
        upsertLibrarySession(session.value)
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session.value))
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library.value))
    } catch {
      // Private browsing and storage quotas should not break the studio.
    }
  }

  function restoreFromLocalStorage() {
    if (typeof localStorage === 'undefined') return
    try {
      const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY)
      const sessionRaw = localStorage.getItem(STORAGE_KEY)
      const libraryRaw = localStorage.getItem(LIBRARY_STORAGE_KEY)
      if (draftRaw) {
        setupDraft.value = {
          ...defaultDraft(),
          ...(JSON.parse(draftRaw) as Partial<StorymakerSetupDraft>),
        }
      }
      if (libraryRaw) {
        const restoredLibrary = JSON.parse(libraryRaw) as StorymakerSession[]
        library.value = Array.isArray(restoredLibrary)
          ? restoredLibrary
              .map(normalizeRestoredSession)
              .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
              .slice(0, MAX_LIBRARY_SESSIONS)
          : []
      }
      if (sessionRaw && !session.value) {
        const restored = normalizeRestoredSession(
          JSON.parse(sessionRaw) as StorymakerSession,
        )
        if (restored.userId === userStore.authenticatedUserId) {
          session.value = restored
          upsertLibrarySession(restored)
          resumeNarrativeArtJobs()
        } else {
          localStorage.removeItem(STORAGE_KEY)
        }
      }
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library.value))
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(LIBRARY_STORAGE_KEY)
      library.value = []
    }
  }
""",
)

replace_once(
    store,
    """  function resetSetup() {
""",
    """  function findRecentStory(sessionId: string): StorymakerSession | null {
    return recentStories.value.find((entry) => entry.id === sessionId) ?? null
  }

  function openStory(sessionId: string): boolean {
    const found = findRecentStory(sessionId)
    if (!found || isWeaving.value) return false
    session.value = cloneSession(found)
    errorMessage.value = ''
    persist()
    resumeNarrativeArtJobs()
    return true
  }

  function remapDuplicatedSession(source: StorymakerSession): StorymakerSession {
    const duplicate = cloneSession(source)
    const createdAt = nowIso()
    const sessionId = makeId()
    const beatIds = new Map<string, string>()
    const beats = duplicate.beats.map((beat) => {
      const beatId = makeId()
      beatIds.set(beat.id, beatId)
      const art =
        beat.art?.status === 'done'
          ? {
              ...beat.art,
              sessionId,
              beatId,
              dedupeKey: [beat.art.product, sessionId, beatId, beat.art.moment].join(':'),
              jobId: undefined,
              updatedAt: createdAt,
            }
          : undefined
      return { ...beat, id: beatId, sessionId, art }
    })
    const mapBeatId = (beatId: string) => beatIds.get(beatId) ?? beatId

    return {
      ...duplicate,
      id: sessionId,
      bible: {
        ...duplicate.bible,
        title: `Copy of ${duplicate.bible.title}`,
        createdAt,
      },
      beats,
      branchHistory: duplicate.branchHistory.map((choice) => ({
        ...choice,
        id: makeId(),
        beatId: mapBeatId(choice.beatId),
      })),
      consequences: duplicate.consequences.map((item) => ({
        ...item,
        id: makeId(),
        beatId: mapBeatId(item.beatId),
      })),
      inventory: duplicate.inventory.map((item) => ({
        ...item,
        beatId: mapBeatId(item.beatId),
      })),
      createdAt,
      updatedAt: createdAt,
    }
  }

  function duplicateStory(sessionId = session.value?.id): string | null {
    if (!sessionId || isWeaving.value) return null
    const source =
      session.value?.id === sessionId ? session.value : findRecentStory(sessionId)
    if (!source) return null
    const duplicate = remapDuplicatedSession(source)
    session.value = duplicate
    persist()
    return duplicate.id
  }

  function openingPrompt(bible: StorymakerBible): string {
    return `${PERSONA}\n\nSTORY BIBLE\n${biblePrompt(bible)}\n\nWrite the opening scene. Establish an immediate image, introduce the most relevant cast member or force, and end with one consequential question.`
  }

  async function restartStory(sessionId = session.value?.id): Promise<boolean> {
    if (!sessionId || isWeaving.value) return false
    const source =
      session.value?.id === sessionId ? session.value : findRecentStory(sessionId)
    if (!source) return false
    const createdAt = nowIso()
    const bible = {
      ...source.bible,
      createdAt,
    }
    session.value = {
      id: makeId(),
      userId: userStore.authenticatedUserId,
      bible,
      beats: [],
      branchHistory: [],
      consequences: [],
      inventory: [],
      stateVersion: 1,
      status: 'active',
      createdAt,
      updatedAt: createdAt,
    }
    persist()
    return weaveBeat(openingPrompt(bible))
  }

  function buildStoryExport(
    sessionId = session.value?.id,
    format: 'markdown' | 'json' = 'markdown',
  ): StorymakerExport | null {
    if (!sessionId) return null
    const source =
      session.value?.id === sessionId ? session.value : findRecentStory(sessionId)
    if (!source) return null
    const copy = cloneSession(source)

    if (format === 'json') {
      return {
        filename: exportFilename(copy.bible.title, 'json'),
        mimeType: 'application/json',
        content: JSON.stringify(copy, null, 2),
      }
    }

    const bibleLines = [
      `# ${copy.bible.title}`,
      '',
      `> ${copy.bible.premise}`,
      '',
      '## Story Bible',
      '',
      `- Narrator: ${copy.bible.narratorStyle}`,
      `- Structure: ${copy.bible.structure}`,
      `- Cast: ${copy.bible.cast.map((item) => item.title).join(', ') || 'Invented as needed'}`,
      `- Setting: ${copy.bible.location?.title || 'Invented from the premise'}`,
      `- Facets: ${copy.bible.facets.map((item) => item.title).join(', ') || 'None selected'}`,
      `- Reward pool: ${copy.bible.rewards.map((item) => item.title).join(', ') || 'None selected'}`,
      '',
      '## Story',
      '',
    ]
    const storyLines = copy.beats.flatMap((beat, index) => {
      const lines = [`### Scene ${index + 1}`, '', beat.narrative, '']
      if (beat.art?.status === 'done' && beat.art.imagePath) {
        lines.push(`![Scene ${index + 1} illustration](${beat.art.imagePath})`, '')
      }
      if (beat.answer?.text) {
        lines.push(`**Reader choice:** ${beat.answer.text}`, '')
      }
      return lines
    })
    const stateLines = [
      '## Story State',
      '',
      `- Inventory: ${copy.inventory.map((item) => item.ingredient.title).join(', ') || 'Empty'}`,
      `- Branch choices: ${copy.branchHistory.length}`,
      `- Status: ${copy.status}`,
      '',
      ...copy.consequences.map((item) => `- ${item.text}`),
      '',
    ]

    return {
      filename: exportFilename(copy.bible.title, 'md'),
      mimeType: 'text/markdown',
      content: [...bibleLines, ...storyLines, ...stateLines].join('\n'),
    }
  }

  function resetSetup() {
""",
)

replace_once(
    store,
    """    return weaveBeat(`${PERSONA}\n\nSTORY BIBLE\n${biblePrompt(bible)}\n\nWrite the opening scene. Establish an immediate image, introduce the most relevant cast member or force, and end with one consequential question.`)
""",
    """    return weaveBeat(openingPrompt(bible))
""",
)

replace_once(
    store,
    """    setupDraft,
    session,
""",
    """    setupDraft,
    session,
    library,
    recentStories,
""",
)

replace_once(
    store,
    """    restoreFromLocalStorage,
    resetSetup,
    resetSession,
""",
    """    restoreFromLocalStorage,
    openStory,
    duplicateStory,
    restartStory,
    buildStoryExport,
    resetSetup,
    resetSession,
""",
)

# Page imports and state
replace_once(
    page,
    """import { computed, onMounted, ref } from 'vue'
""",
    """import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
""",
)

replace_once(
    page,
    """  type StorymakerIngredient,
""",
    """  type StorymakerExport,
  type StorymakerIngredient,
""",
)

replace_once(
    page,
    """const store = useStorymakerStore()
""",
    """const store = useStorymakerStore()
const route = useRoute()
const router = useRouter()
""",
)

replace_once(
    page,
    """const answerInput = ref('')
const newStoryArmed = ref(false)
""",
    """const answerInput = ref('')
const restartArmed = ref(false)
""",
)

# Header action replacement
replace_once(
    page,
    """        <!-- New story — arms on first click, fires on second, so an in-progress
             or finished tale can't be discarded by a single stray click. -->
        <button
          v-if="!newStoryArmed"
          type="button"
          class="btn btn-ghost btn-sm rounded-xl border border-base-300"
          :disabled="store.isWeaving"
          @click="newStoryArmed = true"
        >
          <Icon name="kind-icon:plus" class="size-4" /> New story
        </button>
        <button
          v-else
          type="button"
          class="btn btn-warning btn-sm rounded-xl"
          @click="startAnother"
          @blur="newStoryArmed = false"
        >
          <Icon name="kind-icon:alert" class="size-4" /> Discard this tale?
        </button>
""",
    """        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl border border-base-300"
          :disabled="store.isWeaving"
          @click="showLibrary"
        >
          <Icon name="kind-icon:book" class="size-4" /> Library
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl border border-base-300"
          :disabled="store.isWeaving"
          @click="duplicateCurrent"
        >
          <Icon name="kind-icon:copy" class="size-4" /> Duplicate
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl border border-base-300"
          @click="downloadStory()"
        >
          <Icon name="kind-icon:download" class="size-4" /> Export
        </button>
        <button
          v-if="!restartArmed"
          type="button"
          class="btn btn-ghost btn-sm rounded-xl border border-base-300"
          :disabled="store.isWeaving"
          @click="restartArmed = true"
        >
          <Icon name="kind-icon:refresh" class="size-4" /> Restart
        </button>
        <button
          v-else
          type="button"
          class="btn btn-warning btn-sm rounded-xl"
          @click="restartCurrent"
          @blur="restartArmed = false"
        >
          <Icon name="kind-icon:alert" class="size-4" /> Restart from the beginning?
        </button>
        <button
          type="button"
          class="btn btn-ghost btn-sm rounded-xl border border-base-300"
          :disabled="store.isWeaving"
          @click="startAnother"
        >
          <Icon name="kind-icon:plus" class="size-4" /> New story
        </button>
""",
)

# Recent library before setup nav
replace_once(
    page,
    """    <div v-if="!store.session" class="space-y-4">
      <nav
""",
    """    <div v-if="!store.session" class="space-y-4">
      <section
        v-if="store.recentStories.length"
        class="space-y-3 rounded-2xl border border-base-300 bg-base-200/35 p-4"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p class="text-xs font-bold uppercase tracking-wide text-primary/70">
              Recent stories
            </p>
            <h2 class="mt-1 text-lg font-black">Return to another branch</h2>
          </div>
          <span class="badge badge-ghost rounded-xl">
            {{ store.recentStories.length }} saved
          </span>
        </div>
        <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <article
            v-for="story in store.recentStories"
            :key="story.id"
            class="flex min-w-0 flex-col rounded-2xl border border-base-300 bg-base-100 p-3"
          >
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2">
                <h3 class="truncate font-black">{{ story.bible.title }}</h3>
                <span
                  class="badge badge-sm rounded-xl"
                  :class="story.status === 'complete' ? 'badge-success' : 'badge-primary'"
                >
                  {{ story.status }}
                </span>
              </div>
              <p class="mt-1 line-clamp-2 text-xs leading-relaxed text-base-content/55">
                {{ story.bible.premise }}
              </p>
              <p class="mt-2 text-[0.68rem] text-base-content/40">
                {{ story.beats.length }} scene{{ story.beats.length === 1 ? '' : 's' }} ·
                updated {{ formatStoryDate(story.updatedAt) }}
              </p>
            </div>
            <div class="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                class="btn btn-primary btn-xs rounded-xl"
                @click="openStory(story.id)"
              >
                {{ story.status === 'complete' ? 'Open' : 'Resume' }}
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-xl border border-base-300"
                @click="duplicateStory(story.id)"
              >
                Duplicate
              </button>
              <button
                type="button"
                class="btn btn-ghost btn-xs rounded-xl border border-base-300"
                @click="downloadStory(story.id)"
              >
                Export
              </button>
            </div>
          </article>
        </div>
      </section>

      <nav
""",
)

# Complete message copy
replace_once(
    page,
    """            The completed session remains saved in this browser until you begin another.
""",
    """            This completed session is saved in your recent-story library and can be reopened, duplicated, restarted, or exported.
""",
)

# Script functions replacement around startAnother/onMounted
replace_once(
    page,
    """function startAnother() {
  if (store.isWeaving) return
  newStoryArmed.value = false
  store.resetSession()
  setupStep.value = 0
  furthestStep.value = 0
}

onMounted(() => {
  store.restoreFromLocalStorage()
""",
    """function storyQueryId(): string | null {
  return typeof route.query.story === 'string' ? route.query.story : null
}

function updateStoryQuery(sessionId: string | null) {
  const query = { ...route.query }
  if (sessionId) query.story = sessionId
  else delete query.story
  void router.replace({ query })
}

function openStory(sessionId: string) {
  if (!store.openStory(sessionId)) return
  updateStoryQuery(sessionId)
}

function duplicateStory(sessionId: string) {
  const duplicateId = store.duplicateStory(sessionId)
  if (duplicateId) updateStoryQuery(duplicateId)
}

function duplicateCurrent() {
  const duplicateId = store.duplicateStory()
  if (duplicateId) updateStoryQuery(duplicateId)
}

async function restartCurrent() {
  if (store.isWeaving) return
  restartArmed.value = false
  const restarted = await store.restartStory()
  if (restarted && store.session) updateStoryQuery(store.session.id)
}

function triggerDownload(payload: StorymakerExport) {
  const blob = new Blob([payload.content], { type: `${payload.mimeType};charset=utf-8` })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = payload.filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  URL.revokeObjectURL(url)
}

function downloadStory(sessionId?: string) {
  const payload = store.buildStoryExport(sessionId, 'markdown')
  if (payload) triggerDownload(payload)
}

function showLibrary() {
  if (store.isWeaving) return
  store.resetSession()
  updateStoryQuery(null)
}

function startAnother() {
  if (store.isWeaving) return
  restartArmed.value = false
  store.resetSession()
  updateStoryQuery(null)
  setupStep.value = 0
  furthestStep.value = 0
}

onMounted(() => {
  store.restoreFromLocalStorage()
  const directStoryId = storyQueryId()
  if (directStoryId) store.openStory(directStoryId)
  else if (store.session) updateStoryQuery(store.session.id)
""",
)

print("Applied Storymaker session library")
