// /stores/helpers/storybookLibraryHelper.ts
import { computed, ref, watch } from 'vue'
import type {
  StorybookBible,
  StorybookSession,
  StorybookStartInput,
  StorybookStateDelta,
} from '@/stores/storybookStore'

export type StorybookLibraryExport = {
  filename: string
  mimeType: 'text/markdown' | 'application/json'
  content: string
}

const LIBRARY_STORAGE_KEY = 'storybook-session-library-v1'
const MAX_LIBRARY_SESSIONS = 20

function nowIso(): string {
  return new Date().toISOString()
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `storybook-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Mirrors storybookStore.ts's own emptyStateDelta() -- duplicated locally
// rather than imported, the same way nowIso()/makeId() above are, since this
// helper module is what storybookStore.ts imports and a reverse import would
// be circular.
function emptyStateDelta(): StorybookStateDelta {
  return {
    consequences: [],
    relationshipShifts: [],
    inventoryAdd: [],
    inventoryRemove: [],
  }
}

function cloneSession(value: StorybookSession): StorybookSession {
  const copy = JSON.parse(JSON.stringify(value)) as StorybookSession
  return {
    ...copy,
    bible: {
      ...copy.bible,
      rewards: Array.isArray(copy.bible?.rewards) ? copy.bible.rewards : [],
    },
    // Every library read/write funnels through this one function -- backfill
    // a beat missing `stateDelta` the same way storybookStore.ts's own
    // normalizeRestoredSession() already does on the localStorage-restore
    // path, so a session saved before this field existed (or by a future
    // schema change) can't reach a consumer as `undefined.consequences`.
    beats: Array.isArray(copy.beats)
      ? copy.beats.map((beat) => ({
          ...beat,
          stateDelta: beat.stateDelta ?? emptyStateDelta(),
        }))
      : [],
    branchHistory: Array.isArray(copy.branchHistory) ? copy.branchHistory : [],
    consequences: Array.isArray(copy.consequences) ? copy.consequences : [],
    inventory: Array.isArray(copy.inventory) ? copy.inventory : [],
    stateVersion: 1,
  }
}

function exportFilename(title: string, extension: 'md' | 'json'): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72)
  return `${slug || 'storybook-story'}.${extension}`
}

function restartInput(bible: StorybookBible) {
  return {
    title: bible.title,
    premise: bible.premise,
    narratorStyle: bible.narratorStyle,
    structure: bible.structure,
    cast: bible.cast,
    location: bible.location,
    facets: bible.facets,
    rewards: bible.rewards,
    // A Scenario-framed story ("the plot thread ... every other ingredient
    // bends it", storybookStore.ts) must restart with the same frame it
    // began with. `scenario` is optional on StorybookStartInput, so leaving
    // it off here type-checked fine while silently downgrading every
    // restarted Scenario story into a freeform one: `beginStory` builds a
    // fresh bible from exactly this object, and `undefined` there means the
    // new bible.scenario is unset and the reader's chosen frame is gone with
    // no error surfaced anywhere.
    scenario: bible.scenario,
    notes: bible.notes,
  }
}

type StorybookLibraryBridge = {
  getSession: () => StorybookSession | null
  setSession: (session: StorybookSession) => void
  isWeaving: () => boolean
  resumeNarrativeArtJobs: () => void
  beginStory: (input: StorybookStartInput) => Promise<boolean>
  authenticatedUserId: () => number | null
}

export function createStorybookLibraryController(bridge: StorybookLibraryBridge) {
  const library = ref<StorybookSession[]>([])
  const initialized = ref(false)

  const recentStories = computed(() => {
    const userId = bridge.authenticatedUserId()
    return library.value
      .filter((entry) => entry.userId === userId)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  })

  function persistLibrary(): void {
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(LIBRARY_STORAGE_KEY, JSON.stringify(library.value))
    } catch {
      // A storage quota should not break the active Storybook session.
    }
  }

  function upsert(value: StorybookSession): void {
    // A session with no beats yet is either an opening generation still in
    // flight or one storybookStore just rolled back to null after the
    // opening `weaveBeat` call failed (see the beginStory soft-lock fix).
    // The `watch(bridge.getSession(), ...)` below fires on both the
    // pre-generation reassignment (session.value = { beats: [], ... }) and
    // the post-failure rollback (session.value = null, previous = that same
    // blank session), so without this guard every failed or interrupted
    // opening generation permanently archives an empty, unopenable
    // "Untitled story" into the reader's recent-stories library. Skipping a
    // zero-beat session here is safe for every legitimate caller --
    // duplicateStory/restartStory/archiveCurrent only ever upsert a session
    // that has already woven at least its opening beat.
    if (!value.beats.length) return
    const copy = cloneSession(value)
    library.value = [
      copy,
      ...library.value.filter((entry) => entry.id !== copy.id),
    ]
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
      .slice(0, MAX_LIBRARY_SESSIONS)
    persistLibrary()
  }

  function initialize(): void {
    if (initialized.value || typeof localStorage === 'undefined') return
    try {
      const raw = localStorage.getItem(LIBRARY_STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as StorybookSession[]
        library.value = Array.isArray(parsed)
          ? parsed
              .map(cloneSession)
              .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
              .slice(0, MAX_LIBRARY_SESSIONS)
          : []
      }
    } catch {
      localStorage.removeItem(LIBRARY_STORAGE_KEY)
      library.value = []
    }
    initialized.value = true
    const current = bridge.getSession()
    if (current) upsert(current)
  }

  function findStory(sessionId: string): StorybookSession | null {
    return recentStories.value.find((entry) => entry.id === sessionId) ?? null
  }

  function openStory(sessionId: string): boolean {
    if (bridge.isWeaving()) return false
    // Prefer the live in-memory session over the archived library snapshot
    // when the requested id is already the active one -- the same sourcing
    // duplicateStory()/restartStory() below use. No reachable window was
    // found where the archive actually lags the live session (the library's
    // deep watcher archives every mutation via a microtask that always
    // flushes before the next click can be dispatched), but this keeps all
    // three sibling functions sourcing identically rather than leaving
    // openStory() as the one exception.
    const current = bridge.getSession()
    const found = current?.id === sessionId ? current : findStory(sessionId)
    if (!found) return false
    // Already the active session -- stop here rather than re-cloning and
    // calling resumeNarrativeArtJobs() again. storybook-library-page.vue's
    // onMounted() and its route.query.story watcher both already guard their
    // own calls into this function with an `=== storyStore.session?.id`
    // check for exactly this reason, but this function is the one place
    // every caller funnels through -- including the "Resume"/"Open" button
    // on the CURRENT story's own card in the Recent Stories panel, which is
    // visible and clickable while that story is actively playing (upsert()
    // archives the live session into the library on every mutation). That
    // click had no such guard and reached this same fall-through: a second
    // resumeNarrativeArtJobs() call for a beat whose art enqueue is still in
    // the narrow status:'queueing'/no-jobId window (the real gap between the
    // optimistic status write and the resolved POST) independently finds no
    // existing job and independently submits one, billing two illustrations
    // for a single beat. Guarding here protects every caller at once instead
    // of relying on each new one to remember to check first.
    if (current?.id === sessionId) return true
    bridge.setSession(cloneSession(found))
    bridge.resumeNarrativeArtJobs()
    return true
  }

  function remapDuplicate(source: StorybookSession): StorybookSession {
    const duplicate = cloneSession(source)
    const createdAt = nowIso()
    const sessionId = makeId()
    const beatIds = new Map<string, string>()
    const beats = duplicate.beats.map((beat) => {
      const beatId = makeId()
      beatIds.set(beat.id, beatId)
      // Only 'queueing' (enqueue()'s synchronous pre-submit state, no jobId
      // assigned yet) has to be dropped to `undefined` here -- every other
      // status is safe to carry forward rekeyed to the duplicate's own ids.
      // This used to drop every non-'done' status, which silently and
      // permanently lost a duplicate's illustration state for a beat whose
      // art was still 'queued'/'rendering' or had previously 'failed': the
      // Duplicate button is enabled the moment isWeaving() goes false, long
      // before that beat's background art job resolves, so this is routine
      // to hit, not an edge case. NarrativeArtStatus renders nothing at all
      // when `art` is unset (`v-if="art"`) and retryBeatArt() requires a
      // truthy `beat.art`, so the duplicate was left with no image, no busy
      // indicator, and no retry affordance for that beat, forever.
      // 'queued'/'rendering'/'failed'/'cancelled' all already carry a real
      // `jobId` (or are terminal with none pending), so rekeying their ids is
      // safe: resume() polls purely by jobId with no re-submission, and
      // retry() always submits a fresh job scoped to whatever ids are
      // present. 'queueing' is the one case with no jobId yet -- the real
      // gap between the optimistic status write and the resolved POST -- so
      // rekeying it would send the duplicate's later recovery GET query
      // looking for a job filed under the ORIGINAL's ids and find nothing,
      // falling through to `submit()` and billing a second illustration for
      // one beat. Dropping it here, as before, keeps that window safe.
      const art =
        beat.art && beat.art.status !== 'queueing'
          ? {
              ...beat.art,
              sessionId,
              beatId,
              dedupeKey: [beat.art.product, sessionId, beatId, beat.art.moment].join(':'),
              jobId: beat.art.status === 'done' ? undefined : beat.art.jobId,
              updatedAt: createdAt,
            }
          : undefined
      return { ...beat, id: beatId, sessionId, art }
    })
    const mapBeatId = (beatId: string) => beatIds.get(beatId) ?? beatId

    return {
      ...duplicate,
      id: sessionId,
      userId: bridge.authenticatedUserId(),
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

  function duplicateStory(sessionId = bridge.getSession()?.id): string | null {
    if (!sessionId || bridge.isWeaving()) return null
    const current = bridge.getSession()
    const source = current?.id === sessionId ? current : findStory(sessionId)
    if (!source) return null
    const duplicate = remapDuplicate(source)
    upsert(duplicate)
    bridge.setSession(duplicate)
    // remapDuplicate() deliberately carries a 'queued'/'rendering' beat's real
    // jobId forward onto the duplicate (rekeyed identity, same jobId -- see
    // its own comment: "resume() polls purely by jobId with no
    // re-submission"). But setSession() alone never starts that polling --
    // openStory() and restoreFromLocalStorage() both call
    // resumeNarrativeArtJobs() right after swapping the active session in for
    // exactly this reason, and duplicateStory() was the one caller of
    // setSession() that didn't. Without it, a beat duplicated while its
    // illustration was still in flight (routine: the Duplicate button enables
    // the moment isWeaving() goes false, long before that beat's background
    // art job resolves) never gets polled again on the new duplicate session
    // -- NarrativeArtStatus is left showing "queued"/"rendering" forever,
    // with no retry affordance (retry only appears once a job fails), even
    // though the real job keeps rendering server-side. Only an unrelated page
    // reload (which re-runs resumeNarrativeArtJobs() via
    // restoreFromLocalStorage()) would ever pick it back up.
    bridge.resumeNarrativeArtJobs()
    return duplicate.id
  }

  async function restartStory(
    sessionId = bridge.getSession()?.id,
  ): Promise<string | null> {
    if (!sessionId || bridge.isWeaving()) return null
    const current = bridge.getSession()
    const source = current?.id === sessionId ? current : findStory(sessionId)
    if (!source) return null
    upsert(source)
    const started = await bridge.beginStory(restartInput(source.bible))
    const restarted = bridge.getSession()
    if (!started || !restarted) return null
    upsert(restarted)
    return restarted.id
  }

  function buildExport(
    sessionId = bridge.getSession()?.id,
    format: 'markdown' | 'json' = 'markdown',
  ): StorybookLibraryExport | null {
    if (!sessionId) return null
    const current = bridge.getSession()
    const source = current?.id === sessionId ? current : findStory(sessionId)
    if (!source) return null
    const copy = cloneSession(source)

    if (format === 'json') {
      return {
        filename: exportFilename(copy.bible.title, 'json'),
        mimeType: 'application/json',
        content: JSON.stringify(copy, null, 2),
      }
    }

    const lines = [
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

    copy.beats.forEach((beat, index) => {
      lines.push(`### Scene ${index + 1}`, '', beat.narrative, '')
      if (beat.art?.status === 'done' && beat.art.imagePath) {
        lines.push(`![Scene ${index + 1} illustration](${beat.art.imagePath})`, '')
      }
      if (beat.answer?.text) {
        lines.push(`**Reader choice:** ${beat.answer.text}`, '')
      }
    })

    lines.push(
      '## Story State',
      '',
      `- Inventory: ${copy.inventory.map((item) => item.ingredient.title).join(', ') || 'Empty'}`,
      `- Branch choices: ${copy.branchHistory.length}`,
      `- Status: ${copy.status}`,
      '',
      ...copy.consequences.map((item) => `- ${item.text}`),
      '',
    )

    return {
      filename: exportFilename(copy.bible.title, 'md'),
      mimeType: 'text/markdown',
      content: lines.join('\n'),
    }
  }

  function archiveCurrent(): void {
    const current = bridge.getSession()
    if (current) upsert(current)
  }

  watch(
    () => bridge.getSession(),
    (next, previous) => {
      if (!initialized.value) return
      if (next) upsert(next)
      else if (previous) upsert(previous)
    },
    { deep: true },
  )

  return {
    library,
    recentStories,
    initialize,
    archiveCurrent,
    openStory,
    duplicateStory,
    restartStory,
    buildExport,
  }
}
