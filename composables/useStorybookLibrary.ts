// /composables/useStorybookLibrary.ts
import { computed, proxyRefs, ref, watch } from 'vue'
import {
  useStorybookStore,
  type StorybookBible,
  type StorybookSession,
} from '@/stores/storybookStore'
import { useUserStore } from '@/stores/userStore'

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

function cloneSession(value: StorybookSession): StorybookSession {
  const copy = JSON.parse(JSON.stringify(value)) as StorybookSession
  return {
    ...copy,
    bible: {
      ...copy.bible,
      rewards: Array.isArray(copy.bible?.rewards) ? copy.bible.rewards : [],
    },
    beats: Array.isArray(copy.beats) ? copy.beats : [],
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
    notes: bible.notes,
  }
}

export function useStorybookLibrary() {
  const storyStore = useStorybookStore()
  const userStore = useUserStore()
  const library = ref<StorybookSession[]>([])
  const initialized = ref(false)

  const recentStories = computed(() => {
    const userId = userStore.authenticatedUserId
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
    if (storyStore.session) upsert(storyStore.session)
  }

  function findStory(sessionId: string): StorybookSession | null {
    return recentStories.value.find((entry) => entry.id === sessionId) ?? null
  }

  function openStory(sessionId: string): boolean {
    const found = findStory(sessionId)
    if (!found || storyStore.isWeaving) return false
    storyStore.$patch({ session: cloneSession(found), errorMessage: '' })
    storyStore.resumeNarrativeArtJobs()
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
      userId: userStore.authenticatedUserId,
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

  function duplicateStory(sessionId = storyStore.session?.id): string | null {
    if (!sessionId || storyStore.isWeaving) return null
    const source =
      storyStore.session?.id === sessionId
        ? storyStore.session
        : findStory(sessionId)
    if (!source) return null
    const duplicate = remapDuplicate(source)
    upsert(duplicate)
    storyStore.$patch({ session: duplicate, errorMessage: '' })
    return duplicate.id
  }

  async function restartStory(
    sessionId = storyStore.session?.id,
  ): Promise<string | null> {
    if (!sessionId || storyStore.isWeaving) return null
    const source =
      storyStore.session?.id === sessionId
        ? storyStore.session
        : findStory(sessionId)
    if (!source) return null
    upsert(source)
    const started = await storyStore.beginStory(restartInput(source.bible))
    if (!started || !storyStore.session) return null
    upsert(storyStore.session)
    return storyStore.session.id
  }

  function buildExport(
    sessionId = storyStore.session?.id,
    format: 'markdown' | 'json' = 'markdown',
  ): StorybookLibraryExport | null {
    if (!sessionId) return null
    const source =
      storyStore.session?.id === sessionId
        ? storyStore.session
        : findStory(sessionId)
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
    if (storyStore.session) upsert(storyStore.session)
  }

  watch(
    () => storyStore.session,
    (next, previous) => {
      if (!initialized.value) return
      if (next) upsert(next)
      else if (previous) upsert(previous)
    },
    { deep: true },
  )

  return proxyRefs({
    library,
    recentStories,
    initialize,
    archiveCurrent,
    openStory,
    duplicateStory,
    restartStory,
    buildExport,
  })
}
