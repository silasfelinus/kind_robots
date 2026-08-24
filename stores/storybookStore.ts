// /stores/storybookStore.ts
// Storybook owns creative story sessions. It never imports Taskmaster state or
// task write-back behavior; the two products share presentation only.
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { createPersistedNarrativeArtJobsController } from '@/stores/helpers/persistedNarrativeArtJobsHelper'
import { createStorybookLibraryController } from '@/stores/helpers/storybookLibraryHelper'
import { useChatStore } from '@/stores/chatStore'
import { useUserStore } from '@/stores/userStore'
import { castLineWithRole } from '@/utils/narrativeRoles'
import type { NarrativeArtJobState } from '@/utils/narrativeArtJobs'
import type { NarrativeArtMoment } from '@/utils/narrativeArtProfiles'

export type StorybookStructure = 'short-story' | 'chaptered' | 'episodic'
export type StorybookNarratorStyle =
  'cinematic' | 'playful' | 'storybook' | 'mysterious' | 'intimate'

export type StorybookSetupDraft = {
  title: string
  premise: string
  narratorStyle: StorybookNarratorStyle
  structure: StorybookStructure
  castSlugs: string[]
  /**
   * slug -> narrative role key, for cast members who have been given one.
   *
   * A SIDECAR rather than a reshape of castSlugs, deliberately. The draft is
   * persisted to localStorage and restored by spreading over defaultDraft(),
   * so an additive field costs nothing and an existing draft keeps working
   * with every member simply unassigned. Turning castSlugs into objects would
   * have been a data migration for a feature that is meant to be optional.
   */
  castRoles: Record<string, string>
  locationSlug: string | null
  facetSlugs: string[]
  rewardSlugs: string[]
  /**
   * The Scenario this story is framed on, if any.
   *
   * Silas, 2026-08-06: "Scenario should be a special storybook story that is
   * framed on a specific plot thread ... with an option to remix the prompt so
   * it aligns with the rest of the choices (genre, location, etc)." So a
   * Scenario is an ingredient like the others rather than a parallel story
   * engine -- it supplies the thread, and the facets, cast and location bend
   * it.
   */
  scenarioSlug: string | null
  notes: string
}

export type StorybookIngredient = {
  id?: number | string
  slug: string
  title: string
  description?: string | null
  flavorText?: string | null
  imagePath?: string | null
  icon?: string | null
  rarity?: string | null
  effect?: string | null
  /** Set for cast members. See utils/narrativeRoles.ts. */
  roleKey?: string | null
}

export type StorybookBible = {
  title: string
  premise: string
  narratorStyle: StorybookNarratorStyle
  structure: StorybookStructure
  cast: StorybookIngredient[]
  location?: StorybookIngredient
  facets: StorybookIngredient[]
  rewards: StorybookIngredient[]
  /** The plot thread this story is framed on, when it came from a Scenario. */
  scenario?: StorybookIngredient
  notes?: string
  createdAt: string
}

export type StorybookAnswer = {
  text: string
  capturedAt: string
}

export type StorybookStateDelta = {
  consequences: string[]
  relationshipShifts: string[]
  inventoryAdd: string[]
  inventoryRemove: string[]
}

export type StorybookBeat = {
  id: string
  sessionId: string
  narrative: string
  question: string
  answer?: StorybookAnswer
  art?: NarrativeArtJobState
  stateDelta: StorybookStateDelta
  createdAt: string
}

export type StorybookBranchChoice = {
  id: string
  beatId: string
  question: string
  answer: string
  createdAt: string
}

export type StorybookConsequence = {
  id: string
  beatId: string
  kind: 'consequence' | 'relationship'
  text: string
  createdAt: string
}

export type StorybookInventoryItem = {
  ingredient: StorybookIngredient
  beatId: string
  acquiredAt: string
}

export type StorybookSession = {
  id: string
  userId: number | null
  bible: StorybookBible
  beats: StorybookBeat[]
  branchHistory: StorybookBranchChoice[]
  consequences: StorybookConsequence[]
  inventory: StorybookInventoryItem[]
  stateVersion: 1
  status: 'active' | 'complete'
  createdAt: string
  updatedAt: string
}

export type StorybookStartInput = {
  title?: string
  premise: string
  narratorStyle: StorybookNarratorStyle
  structure: StorybookStructure
  cast: StorybookIngredient[]
  location?: StorybookIngredient
  facets: StorybookIngredient[]
  rewards: StorybookIngredient[]
  scenario?: StorybookIngredient
  notes?: string
}

export type StorybookMode = 'classic' | 'storybook' | 'storybook-dark'

export const STORYBOOK_MODES: {
  key: StorybookMode
  label: string
  hint: string
}[] = [
  { key: 'classic', label: 'Classic', hint: 'Your own theme, standard layout' },
  { key: 'storybook', label: 'Storybook', hint: 'Warm paper, serif narration' },
  { key: 'storybook-dark', label: 'Storybook Dark', hint: 'A lit stage in a dark house' },
]

const STORYBOOK_MODE_STORAGE_KEY = 'storybookMode'
const DEFAULT_STORYBOOK_MODE: StorybookMode = 'storybook'

function isStorybookMode(value: unknown): value is StorybookMode {
  return STORYBOOK_MODES.some((mode) => mode.key === value)
}

const STORAGE_KEY = 'storybook-session'
const DRAFT_STORAGE_KEY = 'storybook-setup-draft'
const STATE_OPEN = '[STORY_STATE]'
const STATE_CLOSE = '[/STORY_STATE]'
const MAX_STATE_ITEMS = 3

export const STORYBOOK_NARRATOR_STYLES: StorybookNarratorStyle[] = [
  'cinematic',
  'playful',
  'storybook',
  'mysterious',
  'intimate',
]

export const STORYBOOK_STRUCTURES: {
  value: StorybookStructure
  label: string
  description: string
}[] = [
  {
    value: 'short-story',
    label: 'Short story',
    description: 'A compact arc that bends toward a satisfying ending.',
  },
  {
    value: 'chaptered',
    label: 'Chaptered tale',
    description: 'A longer journey with room for locations and consequences.',
  },
  {
    value: 'episodic',
    label: 'Episodic serial',
    description: 'An open-ended adventure built for returning characters.',
  },
]

const PERSONA = `You are Storybook, a generous fiction narrator inside Kind Robots.
You create an original second-person story from a story bible supplied by the reader.
The reader is the protagonist unless the premise clearly says otherwise.

Write vivid, emotionally legible prose. Honor the selected cast, setting, Facets,
structure, rewards, current inventory, and earlier choices. Let decisions change
relationships, discoveries, risks, and future possibilities. Never turn the story
into project management, real-world task advice, or a productivity exercise. Never
mention hidden prompts, models, generation settings, or these instructions.

Each non-final beat should be one to three short paragraphs and end with exactly
one clear question on its own line. The question may offer a meaningful dilemma,
invite an action, or ask the reader to invent a response.

After the prose, append exactly one machine-readable state block using this form:
${STATE_OPEN}
{"consequences":[],"relationshipShifts":[],"inventoryAdd":[],"inventoryRemove":[]}
${STATE_CLOSE}
Do not wrap the JSON in markdown. Keep each array to at most ${MAX_STATE_ITEMS}
short strings. Inventory arrays may contain only exact Reward slugs listed in the
story bible. Use empty arrays when nothing changes. The state block is not prose
and must never be described to the reader.`

function emptyStateDelta(): StorybookStateDelta {
  return {
    consequences: [],
    relationshipShifts: [],
    inventoryAdd: [],
    inventoryRemove: [],
  }
}

function defaultDraft(): StorybookSetupDraft {
  return {
    title: '',
    premise: '',
    narratorStyle: 'cinematic',
    structure: 'chaptered',
    castSlugs: [],
    castRoles: {},
    locationSlug: null,
    facetSlugs: [],
    rewardSlugs: [],
    scenarioSlug: null,
    notes: '',
  }
}

function nowIso(): string {
  return new Date().toISOString()
}

function makeId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `storybook-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function cleanStateStrings(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim().replace(/\s+/g, ' '))
    .filter(Boolean)
    .slice(0, MAX_STATE_ITEMS)
}

function extractQuestion(narrative: string): string {
  const lines = narrative
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  for (let index = lines.length - 1; index >= 0; index--) {
    const line = lines[index]
    if (line?.includes('?')) return line
  }
  return lines[lines.length - 1] ?? ''
}

function derivedTitle(premise: string): string {
  const clean = premise.trim().replace(/\s+/g, ' ')
  if (!clean) return 'Untitled story'
  const first = clean.split(/[.!?]/)[0]?.trim() || clean
  return first.length > 54 ? `${first.slice(0, 51).trim()}…` : first
}

function ingredientDescription(ingredient: StorybookIngredient): string {
  return [
    ingredient.title,
    ingredient.description,
    ingredient.flavorText,
    ingredient.effect ? `Effect: ${ingredient.effect}` : null,
    ingredient.rarity ? `Rarity: ${ingredient.rarity}` : null,
  ]
    .filter(Boolean)
    .join(' — ')
}

function normalizeRestoredSession(value: StorybookSession): StorybookSession {
  const bible = {
    ...value.bible,
    rewards: Array.isArray(value.bible?.rewards) ? value.bible.rewards : [],
  }
  return {
    ...value,
    bible,
    beats: Array.isArray(value.beats)
      ? value.beats.map((beat) => ({
          ...beat,
          stateDelta: beat.stateDelta ?? emptyStateDelta(),
        }))
      : [],
    branchHistory: Array.isArray(value.branchHistory)
      ? value.branchHistory
      : [],
    consequences: Array.isArray(value.consequences) ? value.consequences : [],
    inventory: Array.isArray(value.inventory) ? value.inventory : [],
    stateVersion: 1,
  }
}

export const useStorybookStore = defineStore('storybookStore', () => {
  const chatStore = useChatStore()
  const userStore = useUserStore()
  const narrativeArtJobs = createPersistedNarrativeArtJobsController()

  const setupDraft = ref<StorybookSetupDraft>(defaultDraft())
  const session = ref<StorybookSession | null>(null)
  const isWeaving = ref(false)
  /*
   * The chat row THIS session's in-flight `weaveBeat` is streaming into.
   * Taskmaster's own weaveBeat calls the same shared chatStore, and neither
   * call is cancelled on navigation, so a reader who leaves Storybook
   * mid-scene and answers a Taskmaster beat before Storybook's call
   * resolves could otherwise end up with `streamingText` showing
   * Taskmaster's prose (or going blank while Storybook is still
   * streaming). Tracking our own chat id and reading it via
   * chatStore.chatText() keeps this session's streaming text scoped to its
   * own call regardless of what else is concurrently generating.
   */
  const weavingChatId = ref<number | null>(null)
  const errorMessage = ref('')
  let restoredFromStorage = false

  const mode = ref<StorybookMode>(DEFAULT_STORYBOOK_MODE)
  let modeHydrated = false
  const dataTheme = computed<string | undefined>(() =>
    mode.value === 'classic' ? undefined : mode.value,
  )
  const isStoryStyled = computed(() => mode.value !== 'classic')
  const modes = STORYBOOK_MODES

  function hydrateStorybookMode(): void {
    if (modeHydrated || typeof localStorage === 'undefined') return
    try {
      const stored = localStorage.getItem(STORYBOOK_MODE_STORAGE_KEY)
      mode.value = isStorybookMode(stored) ? stored : DEFAULT_STORYBOOK_MODE
    } catch {
      mode.value = DEFAULT_STORYBOOK_MODE
    }
    modeHydrated = true
  }

  function setMode(next: StorybookMode): void {
    if (!isStorybookMode(next)) return
    mode.value = next
    if (typeof localStorage === 'undefined') return
    try {
      localStorage.setItem(STORYBOOK_MODE_STORAGE_KEY, next)
    } catch {}
  }

  const {
    library,
    recentStories,
    initialize: initializeLibrary,
    archiveCurrent,
    openStory,
    duplicateStory,
    restartStory,
    buildExport,
  } = createStorybookLibraryController({
    getSession: () => session.value,
    setSession: (next) => {
      session.value = next
      errorMessage.value = ''
      persist()
    },
    isWeaving: () => isWeaving.value,
    resumeNarrativeArtJobs,
    beginStory,
    authenticatedUserId: () => userStore.authenticatedUserId,
  })

  const streamingText = computed(() =>
    isWeaving.value ? chatStore.chatText(weavingChatId.value) : '',
  )
  const currentBeat = computed(
    () => session.value?.beats[session.value.beats.length - 1] ?? null,
  )
  const awaitingAnswer = computed(
    () =>
      Boolean(
        session.value?.status === 'active' &&
        currentBeat.value &&
        !currentBeat.value.answer,
      ) && !isWeaving.value,
  )
  const isComplete = computed(() => session.value?.status === 'complete')
  const canFinish = computed(
    () =>
      Boolean(
        session.value?.status === 'active' && session.value.beats.length >= 2,
      ) && !isWeaving.value,
  )

  function persist() {
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
    // Guarded the same way hydrateStorybookMode() guards itself with
    // modeHydrated, and for the same reason: content/storybook.md mounts
    // `:storybook-library-page`, which renders `<StorybookPage />` as a
    // child, so BOTH components' onMounted() call this in the same page
    // load -- the child's first, then the parent's, same synchronous tick
    // (see verifyStorybookSeedQueryRaceGuard's own header comment for the
    // mount-order proof). The child's onMounted also runs seedFromQuery()
    // right after this call, mutating setupDraft in place to seed an
    // ingredient from the URL (e.g. `?character=<slug>`). That mutation only
    // schedules persist() -- the deep watch on setupDraft -- as a microtask,
    // which does not flush until after both onMounted hooks return. So
    // without this guard, the parent's redundant second call re-reads the
    // *pre-seed* draft still sitting in localStorage and overwrites
    // setupDraft.value with it, silently discarding the just-seeded
    // ingredient on every visit where the reader has ever saved a setup
    // draft before (routine, since the draft persists continuously while
    // the setup form is open). Restoring once per app session is correct
    // regardless of mount order: nothing outside this tab can change
    // localStorage's Storybook keys while it is open.
    if (restoredFromStorage || typeof localStorage === 'undefined') return
    restoredFromStorage = true
    hydrateStorybookMode()
    try {
      const draftRaw = localStorage.getItem(DRAFT_STORAGE_KEY)
      const sessionRaw = localStorage.getItem(STORAGE_KEY)
      if (draftRaw) {
        setupDraft.value = {
          ...defaultDraft(),
          ...(JSON.parse(draftRaw) as Partial<StorybookSetupDraft>),
        }
      }
      if (sessionRaw && !session.value) {
        session.value = normalizeRestoredSession(
          JSON.parse(sessionRaw) as StorybookSession,
        )
        resumeNarrativeArtJobs()
      }
    } catch {
      localStorage.removeItem(DRAFT_STORAGE_KEY)
      localStorage.removeItem(STORAGE_KEY)
    }
  }

  function updateBeatArt(beatId: string, art: NarrativeArtJobState): void {
    const beat = session.value?.beats.find((entry) => entry.id === beatId)
    if (!beat) return
    beat.art = art
    if (session.value) session.value.updatedAt = nowIso()
    persist()
  }

  function narrativeArtContext(
    beat: StorybookBeat,
    moment: NarrativeArtMoment,
  ) {
    const active = session.value
    if (!active) return null
    return {
      product: 'storybook' as const,
      sessionId: active.id,
      beatId: beat.id,
      moment,
      narrative: beat.narrative,
      title: active.bible.title,
      location: active.bible.location
        ? ingredientDescription(active.bible.location)
        : null,
      cast: active.bible.cast.map(ingredientDescription),
      facets: active.bible.facets.map(ingredientDescription),
    }
  }

  function requestBeatArt(
    beat: StorybookBeat,
    moment: NarrativeArtMoment,
  ): void {
    if (beat.art) return
    const context = narrativeArtContext(beat, moment)
    if (!context) return
    void narrativeArtJobs.enqueue(context, (art) => updateBeatArt(beat.id, art))
  }

  function resumeNarrativeArtJobs(): void {
    // davinci/t-025: shared resume-all-cached-entries wiring (see
    // persistedNarrativeArtJobsHelper.ts) -- beats already ride inside this
    // store's own persisted session JSON, so this only needs the resume
    // loop, not the helper's cache read/write.
    narrativeArtJobs.resumeEntries(
      (session.value?.beats ?? []).map((beat) => [beat.id, beat.art] as const),
      (beatId, art) => updateBeatArt(beatId, art),
    )
  }

  function retryBeatArt(beatId: string): void {
    const beat = session.value?.beats.find((entry) => entry.id === beatId)
    if (!beat?.art) return
    narrativeArtJobs.retry(beat.art, (art) => updateBeatArt(beat.id, art))
  }

  function resetSetup() {
    setupDraft.value = defaultDraft()
    errorMessage.value = ''
    persist()
  }

  function resetSession() {
    session.value = null
    errorMessage.value = ''
    persist()
  }

  function buildBible(input: StorybookStartInput): StorybookBible {
    return {
      title: input.title?.trim() || derivedTitle(input.premise),
      premise: input.premise.trim(),
      narratorStyle: input.narratorStyle,
      structure: input.structure,
      cast: input.cast,
      location: input.location,
      facets: input.facets,
      rewards: input.rewards,
      scenario: input.scenario,
      notes: input.notes?.trim() || undefined,
      createdAt: nowIso(),
    }
  }

  function biblePrompt(bible: StorybookBible): string {
    const parts = [
      `Title: ${bible.title}`,
      `Premise: ${bible.premise}`,
      `Narrator style: ${bible.narratorStyle}`,
      `Structure: ${bible.structure}`,
    ]
    /*
     * THE SCENARIO IS THE FRAME, so it goes first -- before cast and facets,
     * which are what bend it. Stated as a thread to be told rather than a
     * summary to be reproduced, because the whole point of framing a Scenario
     * this way is that the other ingredients are allowed to change it: Cthulhu
     * for President stays the thread whether the facets say cosmic horror or
     * workplace romance.
     */
    if (bible.scenario) {
      parts.push(
        `Plot thread (the frame for this story; the cast, setting and Facets` +
          ` below reshape how it plays out rather than being decoration on it):` +
          `\n${ingredientDescription(bible.scenario)}`,
      )
    }
    if (bible.cast.length) {
      parts.push(
        `Cast:\n${bible.cast
          .map(
            (member) =>
              `- ${castLineWithRole(
                ingredientDescription(member),
                member.title,
                member.roleKey,
              )}`,
          )
          .join('\n')}`,
      )
    }
    if (bible.location) {
      parts.push(`Primary setting: ${ingredientDescription(bible.location)}`)
    }
    if (bible.facets.length) {
      parts.push(
        `Creative Facets:\n${bible.facets
          .map((facet) => `- ${ingredientDescription(facet)}`)
          .join('\n')}`,
      )
    }
    if (bible.rewards.length) {
      parts.push(
        `Available story Rewards (use exact slugs in state metadata):\n${bible.rewards
          .map(
            (reward) =>
              `- slug=${reward.slug}; ${ingredientDescription(reward)}`,
          )
          .join('\n')}`,
      )
    }
    if (bible.notes) parts.push(`Additional direction: ${bible.notes}`)
    return parts.join('\n\n')
  }

  function buildRecap(): string {
    return (session.value?.beats ?? [])
      .map((beat) => {
        const answer = beat.answer
          ? `\nThe reader chose: ${beat.answer.text}`
          : ''
        return `${beat.narrative}${answer}`
      })
      .join('\n\n')
  }

  function statePrompt(active: StorybookSession): string {
    const inventory = active.inventory.length
      ? active.inventory.map((item) => item.ingredient.slug).join(', ')
      : 'empty'
    const consequences = active.consequences.length
      ? active.consequences
          .slice(-8)
          .map((item) => `- ${item.text}`)
          .join('\n')
      : '- none yet'
    return `CURRENT FICTIONAL STATE\nInventory slugs: ${inventory}\nRecent consequences and relationship shifts:\n${consequences}`
  }

  function phaseGuidance(): string {
    const active = session.value
    const count = active?.beats.length ?? 0
    const structure = active?.bible.structure
    if (count <= 1)
      return 'Deepen the opening promise and introduce a consequence.'
    if (structure === 'short-story' && count >= 4) {
      return 'The short story is nearing its climax. Tighten earlier threads.'
    }
    if (count <= 4)
      return 'Develop relationships, discoveries, and meaningful risk.'
    return 'Recombine earlier choices and open a surprising but coherent path.'
  }

  function parseGeneratedBeat(
    rawText: string,
    bible: StorybookBible,
  ): { narrative: string; stateDelta: StorybookStateDelta } {
    const start = rawText.lastIndexOf(STATE_OPEN)
    const end = rawText.lastIndexOf(STATE_CLOSE)
    if (start < 0 || end <= start) {
      return { narrative: rawText.trim(), stateDelta: emptyStateDelta() }
    }

    const narrative = rawText.slice(0, start).trim()
    const jsonText = rawText.slice(start + STATE_OPEN.length, end).trim()
    let parsed: Record<string, unknown> = {}
    try {
      parsed = JSON.parse(jsonText) as Record<string, unknown>
    } catch {
      return { narrative, stateDelta: emptyStateDelta() }
    }

    const allowedRewards = new Set(bible.rewards.map((reward) => reward.slug))
    return {
      narrative,
      stateDelta: {
        consequences: cleanStateStrings(parsed.consequences),
        relationshipShifts: cleanStateStrings(parsed.relationshipShifts),
        inventoryAdd: cleanStateStrings(parsed.inventoryAdd).filter((slug) =>
          allowedRewards.has(slug),
        ),
        inventoryRemove: cleanStateStrings(parsed.inventoryRemove).filter(
          (slug) => allowedRewards.has(slug),
        ),
      },
    }
  }

  function applyStateDelta(
    active: StorybookSession,
    beatId: string,
    delta: StorybookStateDelta,
  ) {
    const createdAt = nowIso()
    const existingTexts = new Set(
      active.consequences.map((item) => item.text.toLowerCase()),
    )

    for (const text of delta.consequences) {
      if (existingTexts.has(text.toLowerCase())) continue
      active.consequences.push({
        id: makeId(),
        beatId,
        kind: 'consequence',
        text,
        createdAt,
      })
      existingTexts.add(text.toLowerCase())
    }
    for (const text of delta.relationshipShifts) {
      if (existingTexts.has(text.toLowerCase())) continue
      active.consequences.push({
        id: makeId(),
        beatId,
        kind: 'relationship',
        text,
        createdAt,
      })
      existingTexts.add(text.toLowerCase())
    }

    const removeSet = new Set(delta.inventoryRemove)
    active.inventory = active.inventory.filter(
      (item) => !removeSet.has(item.ingredient.slug),
    )

    const existingInventory = new Set(
      active.inventory.map((item) => item.ingredient.slug),
    )
    for (const slug of delta.inventoryAdd) {
      if (existingInventory.has(slug)) continue
      const ingredient = active.bible.rewards.find(
        (reward) => reward.slug === slug,
      )
      if (!ingredient) continue
      active.inventory.push({ ingredient, beatId, acquiredAt: createdAt })
      existingInventory.add(slug)
    }
  }

  async function weaveBeat(prompt: string, closing = false): Promise<boolean> {
    const active = session.value
    if (!active) return false

    isWeaving.value = true
    weavingChatId.value = null
    errorMessage.value = ''
    try {
      const result = await chatStore.generateText(
        { prompt, isPublic: false },
        {
          onChatId: (chatId) => {
            weavingChatId.value = chatId
          },
        },
      )
      if (!result.success || !result.data) {
        errorMessage.value = result.message || 'The story thread slipped away.'
        return false
      }

      const parsed = parseGeneratedBeat(
        (result.data.text ?? '').trim(),
        active.bible,
      )
      if (!parsed.narrative) {
        errorMessage.value = 'Storybook went quiet. Try the scene again.'
        return false
      }

      const beatId = makeId()
      const beat: StorybookBeat = {
        id: beatId,
        sessionId: active.id,
        narrative: parsed.narrative,
        question: closing ? '' : extractQuestion(parsed.narrative),
        stateDelta: parsed.stateDelta,
        createdAt: nowIso(),
      }
      active.beats.push(beat)
      applyStateDelta(active, beatId, parsed.stateDelta)
      if (closing) active.status = 'complete'
      active.updatedAt = nowIso()
      persist()

      const artMoment: NarrativeArtMoment | null = closing
        ? 'finale'
        : active.beats.length === 1
          ? 'opening'
          : null
      if (artMoment) requestBeatArt(beat, artMoment)
      return true
    } catch (error) {
      errorMessage.value =
        error instanceof Error
          ? error.message
          : 'The story thread slipped away.'
      return false
    } finally {
      isWeaving.value = false
      weavingChatId.value = null
    }
  }

  async function beginStory(input: StorybookStartInput): Promise<boolean> {
    if (!input.premise.trim() || isWeaving.value) return false
    const createdAt = nowIso()
    const bible = buildBible(input)
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

    const openingWove = await weaveBeat(
      `${PERSONA}\n\nSTORY BIBLE\n${biblePrompt(bible)}\n\nWrite the opening scene. Establish an immediate image, introduce the most relevant cast member or force, and end with one consequential question.`,
    )
    if (!openingWove) {
      // Keep the setup draft and generation error visible so the reader can
      // retry instead of being stranded inside an empty active session.
      session.value = null
      persist()
    }
    return openingWove
  }

  async function answerCurrentBeat(answerText: string): Promise<boolean> {
    const active = session.value
    const beat = currentBeat.value
    const clean = answerText.trim()
    // Audited (storybook/t-020, kaizen from t-010/#1846): every branch here is
    // structurally unreachable through the composer, so a silent `false` never
    // reaches a reader with no explanation.
    //   !active / !beat  -- narrative-response-composer only renders behind
    //     `v-if="store.session && !store.isComplete"`, and `session.value` and
    //     its first beat are both written inside the same synchronous span as
    //     `isWeaving.value = true` (beginStory -> weaveBeat), so there is no
    //     paint where the composer is visible, enabled, and beat-less.
    //   !clean -- the composer's own submit() already trims and rejects an
    //     empty/whitespace-only value before ever emitting `submit`.
    //   beat.answer / isWeaving.value -- both flip inside the same synchronous
    //     block that starts weaveBeat, before any `await`. The composer's
    //     `disabled`/`loading` props mirror those two flags, and the HTML spec
    //     drains Vue's reactive (microtask) render queue before the next click
    //     or keydown task can run submit() again, so a double-submit is
    //     rejected by the composer itself, not by this guard.
    // If a future change moves session/beat creation off this synchronous
    // path, or adds another caller that skips the composer, this guard can
    // become reachable again -- give it a user-facing message at that point.
    if (!active || !beat || beat.answer || !clean || isWeaving.value)
      return false

    const capturedAt = nowIso()
    const branchEntryId = makeId()
    beat.answer = { text: clean, capturedAt }
    active.branchHistory.push({
      id: branchEntryId,
      beatId: beat.id,
      question: beat.question,
      answer: clean,
      createdAt: capturedAt,
    })
    active.updatedAt = capturedAt
    persist()

    const wove = await weaveBeat(
      `${PERSONA}\n\nSTORY BIBLE\n${biblePrompt(active.bible)}\n\n${statePrompt(active)}\n\n${phaseGuidance()}\n\nSTORY SO FAR\n${buildRecap()}\n\nContinue the story from the reader's latest choice. Preserve continuity, apply a fresh consequence or discovery when earned, and end with one new question.`,
    )

    if (!wove) {
      // Roll back the recorded answer so the reader isn't soft-locked: without
      // this, `awaitingAnswer` stays false (the beat already has an answer)
      // while `canFinish` may still be false too (too few beats), leaving no
      // way forward except discarding the whole session.
      beat.answer = undefined
      const historyIndex = active.branchHistory.findIndex(
        (entry) => entry.id === branchEntryId,
      )
      if (historyIndex !== -1) active.branchHistory.splice(historyIndex, 1)
      active.updatedAt = nowIso()
      persist()
    }

    return wove
  }

  async function finishStory(): Promise<boolean> {
    const active = session.value
    if (!active || !canFinish.value) return false
    return weaveBeat(
      `${PERSONA}\n\nSTORY BIBLE\n${biblePrompt(active.bible)}\n\n${statePrompt(active)}\n\nSTORY SO FAR\n${buildRecap()}\n\nWrite a satisfying finale for this session. Resolve the strongest active thread while leaving only intentional wonder. Do not end with a question.`,
      true,
    )
  }

  watch(setupDraft, persist, { deep: true })
  watch(session, persist, { deep: true })

  return {
    mode,
    setMode,
    dataTheme,
    isStoryStyled,
    modes,
    library,
    recentStories,
    initializeLibrary,
    archiveCurrent,
    openStory,
    duplicateStory,
    restartStory,
    buildExport,
    setupDraft,
    session,
    isWeaving,
    errorMessage,
    streamingText,
    currentBeat,
    awaitingAnswer,
    isComplete,
    canFinish,
    restoreFromLocalStorage,
    resetSetup,
    resetSession,
    resumeNarrativeArtJobs,
    retryBeatArt,
    beginStory,
    answerCurrentBeat,
    finishStory,
  }
})
