// @/stores/helpers/cthulhuquariumStory.ts
//
// Charlotte and Wilbur's scenes (the canon's story/scenes.yaml) and the tank
// backgrounds she hands over. Owned by cthulhuquariumTankStore; this is its
// story half, split out only because the tank store is already long.
//
// A scene plays once per player, ever: the server records it as seen
// (POST /api/aquarium/story/seen) when the last beat is dismissed. A beat with
// `await` advances when the player performs that action (notifyAction), so the
// intro teaches by having the player do the thing rather than read about it.

import { computed, ref } from 'vue'
import { performFetch } from '../utils'
import {
  CTHULHUQUARIUM_BARKS,
  CTHULHUQUARIUM_BACKGROUNDS,
  CTHULHUQUARIUM_SCENES,
  type CanonBackground,
  type CanonBeat,
  type CanonScene,
  type CanonSpeaker,
} from '~/utils/cthulhuquariumCanon.generated'
import { floorInfo, floorOpenedBy } from '~/utils/cthulhuquariumFloors'
import { setReducedMotionOverride } from '~/utils/cthulhuquariumSprites'
import { setCthulhuquariumArtStyle } from '~/utils/cthulhuquariumArtStyles'
import {
  CTHULHUQUARIUM_DEFAULT_SETTINGS,
  readCthulhuquariumSettings,
  type CthulhuquariumSettings,
} from '~/utils/cthulhuquariumSettings'
import {
  SCRIPT_START,
  scriptAwaitingChoice,
  scriptChoicesOf,
  scriptChoose,
  scriptCurrentBeat,
  scriptIsFinalBeat,
  scriptStep,
  type ScriptCursor,
} from '~/utils/cthulhuquariumScript'

export interface StoryState {
  seenScenes: string[]
  unlockedBackgrounds: string[]
  backgroundKey: string
  // cthulhuquarium/t-102: the deepest open floor, and every floor reached.
  floor?: number
  floorsReached?: number[]
  // cthulhuquarium/t-103: the reply picked in each floor scene, by scene id.
  choices?: Record<string, string>
  // cthulhuquarium/t-105: the floor keys held.
  floorKeys?: number[]
}

export type StoryAction = 'unlock' | 'feed' | 'clean' | 'shop' | 'bestiary'

export interface SpokenBark {
  context: string
  speaker: CanonSpeaker
  pose: string
  text: string
}

// A voice that speaks too often stops being a voice and becomes a tooltip
// (DESIGN-BRIEF.md decision 5). Event barks are rate-limited, and a scene
// always wins over a bark.
const BARK_COOLDOWN_MS = 45_000
const BARK_SHOW_MS = 7_000
const SOUND_KEY = 'cthulhuquarium:sound'
// cthulhuquarium/t-100: the settings panel, kept per browser.
const SETTINGS_KEY = 'cthulhuquarium:settings'
const TITLE_KEY = 'cthulhuquarium:title-seen'

const GUIDE_KEY = 'cthulhuquarium:guide-seen'

function hashString(text: string): number {
  let hash = 0
  for (const char of text) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return hash
}

export function useCthulhuquariumStory() {
  const state = ref<StoryState | null>(null)
  const queue = ref<string[]>([])
  // cthulhuquarium/t-103: where we are in the scene (utils/cthulhuquariumScript.ts):
  // a main beat, or a beat of the reply the player picked.
  const cursor = ref<ScriptCursor>({ ...SCRIPT_START })
  const beatIndex = computed(() => cursor.value.beat)
  // A replay from the Memory Book (or the intro from the guide): it never
  // records anything and leaves the moment the player is done.
  const replaying = ref(false)
  // Replies picked in scenes still playing, sent when each scene finishes.
  const pendingChoices = ref<Record<string, string>>({})
  const backgroundSaving = ref(false)
  const storyError = ref('')
  const spokenBark = ref<SpokenBark | null>(null)
  const soundOn = ref(false)
  const settings = ref<CthulhuquariumSettings>({
    ...CTHULHUQUARIUM_DEFAULT_SETTINGS,
  })
  const settingsOpen = ref(false)
  // The title card: once per browser session, not before the first intro.
  const titleOpen = ref(false)
  const guideOpen = ref(false)
  const guideSeen = ref(true)
  let lastBarkAt = 0
  let barkTimer: ReturnType<typeof setTimeout> | null = null

  const activeScene = computed<CanonScene | null>(() => {
    const id = queue.value[0]
    return id ? (CTHULHUQUARIUM_SCENES[id] ?? null) : null
  })
  const activeBeat = computed<CanonBeat | null>(() =>
    scriptCurrentBeat(activeScene.value, cursor.value),
  )
  const isLastBeat = computed(
    () =>
      !!activeScene.value && scriptIsFinalBeat(activeScene.value, cursor.value),
  )
  /** The replies on offer, while the scene waits for the player to pick one. */
  const activeChoices = computed(() =>
    scriptAwaitingChoice(activeScene.value, cursor.value)
      ? scriptChoicesOf(activeScene.value?.beats[cursor.value.beat])
      : [],
  )
  const isReplaying = computed(() => replaying.value)
  /**
   * Every beat shown so far in this scene, oldest first (main beats, plus the
   * picked reply's beats up to the current one). The stage uses it to keep the
   * speaker who is not talking in the last pose they spoke in.
   */
  const spokenBeats = computed<CanonBeat[]>(() => {
    const scene = activeScene.value
    if (!scene) return []
    const at = cursor.value
    const main = scene.beats.slice(0, at.beat + 1)
    const reply =
      scriptChoicesOf(scene.beats[at.beat]).find(
        (choice) => choice.id === at.choice,
      )?.reply ?? []
    return [...main, ...reply.slice(0, at.choice ? at.reply + 1 : 0)]
  })
  /** The deepest open floor of the building (1 until the story has loaded). */
  const storyFloor = computed(() => state.value?.floor ?? 1)
  const backgroundKey = computed(() => state.value?.backgroundKey ?? 'parlour')
  const backgrounds = computed<Array<CanonBackground & { unlocked: boolean }>>(
    () =>
      CTHULHUQUARIUM_BACKGROUNDS.map((background) => ({
        ...background,
        unlocked:
          background.unlock === 'default' ||
          !!state.value?.unlockedBackgrounds.includes(background.key),
      })),
  )

  function hasSeen(id: string): boolean {
    return !!state.value?.seenScenes.includes(id)
  }

  function queueScene(id: string): void {
    if (!CTHULHUQUARIUM_SCENES[id] || !state.value) return
    if (hasSeen(id) || queue.value.includes(id)) return
    const coveredByQueued = queue.value.some((queued) =>
      CTHULHUQUARIUM_SCENES[queued]?.covers.includes(id),
    )
    if (!coveredByQueued) queue.value.push(id)
  }

  /**
   * `alreadyDone` is what the player has demonstrably done before this visit
   * (an owned creature means they have unlocked one). A player who left the
   * intro half-way resumes after the last beat awaiting something they have
   * already done, instead of hearing "the first one is on the house" again
   * and being asked for an adoption that already happened.
   */
  async function loadStory(alreadyDone: StoryAction[] = []): Promise<void> {
    const res = await performFetch<StoryState>('/api/aquarium/story')
    if (!res.success || !res.data) return
    state.value = res.data
    loadSoundPreference()
    loadSettings()
    loadGuidePreference()
    queueScene('intro')
    if (queue.value[0] === 'intro' && cursor.value.beat === 0) {
      const beats = CTHULHUQUARIUM_SCENES.intro?.beats ?? []
      let resume = 0
      beats.forEach((beat, index) => {
        if (beat.await && alreadyDone.includes(beat.await as StoryAction)) {
          resume = index + 1
        }
      })
      if (resume >= beats.length) await finishScene()
      else cursor.value = { ...SCRIPT_START, beat: resume }
    }
    if (!queue.value.length && !guideSeen.value) guideOpen.value = true
  }

  /**
   * One missed milestone interstitial per visit: a background that was handed
   * over before its scene existed (or was earned by reconciliation) still
   * gets its Charlotte moment, without replaying a backlog all at once.
   */
  function queueMissedMilestoneScene(): void {
    const unlocked = new Set(state.value?.unlockedBackgrounds ?? [])
    const missed = Object.values(CTHULHUQUARIUM_SCENES).find(
      (scene) =>
        scene.trigger.startsWith('milestone:') &&
        scene.background !== null &&
        unlocked.has(scene.background) &&
        !hasSeen(scene.id) &&
        !queue.value.includes(scene.id),
    )
    if (missed) queueScene(missed.id)
  }

  async function refreshStory(): Promise<void> {
    const res = await performFetch<StoryState>('/api/aquarium/story')
    if (res.success && res.data) state.value = res.data
  }

  async function finishScene(): Promise<void> {
    const scene = activeScene.value
    if (!scene) return
    const ids = [scene.id, ...scene.covers]
    queue.value.shift()
    cursor.value = { ...SCRIPT_START }
    if (replaying.value) {
      replaying.value = false
      return
    }
    const choice = pendingChoices.value[scene.id]
    const choices = choice ? { [scene.id]: choice } : {}
    pendingChoices.value = Object.fromEntries(
      Object.entries(pendingChoices.value).filter(([id]) => id !== scene.id),
    )
    if (state.value) {
      state.value = {
        ...state.value,
        seenScenes: [...new Set([...state.value.seenScenes, ...ids])],
        choices: { ...choices, ...(state.value.choices ?? {}) },
      }
    }
    const res = await performFetch<StoryState>('/api/aquarium/story/seen', {
      method: 'POST',
      body: JSON.stringify({ scenes: ids, choices }),
    })
    if (res.success && res.data) state.value = res.data
    if (scene.id === 'intro' && !guideSeen.value) guideOpen.value = true
  }

  /**
   * Rewatch a seen scene (the Memory Book; the intro from the guide) without
   * resetting the tank, asking for actions again or recording anything. A
   * replayed scene shows only its cinematic beats: the intro stops before
   * its first interactive tutorial beat, as it always has.
   */
  function replayScene(id: string): void {
    if (!state.value || queue.value.length || !CTHULHUQUARIUM_SCENES[id]) return
    queue.value = [id]
    cursor.value = { ...SCRIPT_START }
    replaying.value = true
  }

  function replayIntro(): void {
    replayScene('intro')
  }

  function endReplay(): void {
    queue.value.shift()
    cursor.value = { ...SCRIPT_START }
    replaying.value = false
  }

  async function advanceBeat(): Promise<void> {
    const scene = activeScene.value
    if (!scene) return
    if (replaying.value) {
      const next = scriptStep(scene, cursor.value)
      const nextBeat = next === 'done' ? null : scriptCurrentBeat(scene, next)
      // A replay never asks the player to Feed or Buy again.
      if (next === 'done' || !nextBeat || nextBeat.focus || nextBeat.await) {
        endReplay()
        return
      }
      cursor.value = next
      return
    }
    const next = scriptStep(scene, cursor.value)
    if (next === 'done') {
      await finishScene()
      return
    }
    cursor.value = next
  }

  /** The player's reply on a floor scene's choice beat. */
  function chooseReply(choiceId: string): void {
    const scene = activeScene.value
    if (!scene) return
    const next = scriptChoose(scene, cursor.value, choiceId)
    if (next === cursor.value) return
    cursor.value = next
    if (!replaying.value) {
      pendingChoices.value = { ...pendingChoices.value, [scene.id]: choiceId }
    }
  }

  /**
   * Leave the scene now. A first viewing still counts as seen (it is in the
   * Memory Book to rewatch); a tutorial beat waiting on an action is skipped
   * with its own button instead, so this is for cinematic scenes.
   */
  async function skipScene(): Promise<void> {
    if (!activeScene.value) return
    if (replaying.value) {
      endReplay()
      return
    }
    await finishScene()
  }

  function notifyAction(action: StoryAction): void {
    if (activeBeat.value?.await === action) void advanceBeat()
  }

  function announceMilestones(ids: string[]): void {
    // cthulhuquarium/t-105: a floor's milestone only puts its key on sale; the
    // floor's scene plays when the key is bought (announceFloorKey).
    for (const id of ids) {
      if (floorOpenedBy(id) === null) queueScene(`milestone_${id}`)
    }
    if (ids.length) void refreshStory()
  }

  /** cthulhuquarium/t-105: the key to `floor` was just bought. */
  function announceFloorKey(floor: number): void {
    const milestoneId = floorInfo(floor).milestoneId
    if (milestoneId) queueScene(`milestone_${milestoneId}`)
    void refreshStory()
  }

  /**
   * One floor scene per visit for a key held without its scene seen: a tank
   * whose keys were granted when keys were introduced still gets the moment.
   */
  function queueMissedFloorScene(): void {
    const keys = state.value?.floorKeys ?? []
    for (const floor of [...keys].sort()) {
      const milestoneId = floorInfo(floor).milestoneId
      const id = milestoneId ? `milestone_${milestoneId}` : null
      if (id && !hasSeen(id) && !queue.value.includes(id)) {
        queueScene(id)
        return
      }
    }
  }

  /** cthulhuquarium/t-102: the first species ever known from floor II-V. */
  function announceFirstOfFloor(floor: number | null | undefined): void {
    if (floor && floor > 1) queueScene(`floor_first_${floor}`)
  }

  /**
   * The scene after The Last Aquarium: queued when it is bought, and on any
   * later visit by a tank that bought it before the scene existed.
   */
  function queueFinaleScene(): void {
    const finale = Object.values(CTHULHUQUARIUM_SCENES).find(
      (scene) => scene.trigger === 'finale',
    )
    if (finale) queueScene(finale.id)
  }

  /** The line a screen shows today: stable for the day, different tomorrow. */
  function screenBark(context: string): SpokenBark | null {
    const bark = CTHULHUQUARIUM_BARKS[context]
    if (!bark?.lines.length) return null
    const day = Math.floor(Date.now() / 86_400_000)
    const text = bark.lines[hashString(`${context}:${day}`) % bark.lines.length]
    return text
      ? { context, speaker: bark.speaker, pose: bark.pose, text }
      : null
  }

  /** Say one line from `context` over the tank, if nobody has spoken lately. */
  function sayBark(context: string, chance = 1): void {
    const bark = CTHULHUQUARIUM_BARKS[context]
    if (!bark?.lines.length || activeScene.value) return
    const now = Date.now()
    if (now - lastBarkAt < BARK_COOLDOWN_MS || Math.random() > chance) return
    const text = bark.lines[Math.floor(Math.random() * bark.lines.length)]
    if (!text) return
    lastBarkAt = now
    spokenBark.value = { context, speaker: bark.speaker, pose: bark.pose, text }
    if (barkTimer) clearTimeout(barkTimer)
    barkTimer = setTimeout(() => {
      spokenBark.value = null
    }, BARK_SHOW_MS)
  }

  function dismissBark(): void {
    spokenBark.value = null
  }

  /** Per-browser preference: the tank's room tone is off until asked for. */
  /** cthulhuquarium/t-100: read the settings panel's choices for this browser. */
  function loadSettings(): void {
    if (!import.meta.client) return
    try {
      settings.value = readCthulhuquariumSettings(
        localStorage.getItem(SETTINGS_KEY),
      )
    } catch {
      settings.value = { ...CTHULHUQUARIUM_DEFAULT_SETTINGS }
    }
    applyMotionSetting()
  }

  function applyMotionSetting(): void {
    const motion = settings.value.motion
    setReducedMotionOverride(motion === 'system' ? null : motion === 'reduced')
    // cthulhuquarium/t-107: the art resolvers read the active style.
    setCthulhuquariumArtStyle(settings.value.artStyle)
  }

  function updateSettings(patch: Partial<CthulhuquariumSettings>): void {
    settings.value = readCthulhuquariumSettings(
      JSON.stringify({ ...settings.value, ...patch }),
    )
    applyMotionSetting()
    if (!import.meta.client) return
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    } catch {
      // Without storage the settings still hold for this visit.
    }
  }

  /** The title card shows once per browser session, after the first intro. */
  function maybeOpenTitle(): void {
    if (!import.meta.client || !hasSeen('intro')) return
    try {
      if (sessionStorage.getItem(TITLE_KEY) === 'seen') return
      sessionStorage.setItem(TITLE_KEY, 'seen')
    } catch {
      return
    }
    titleOpen.value = true
  }

  function closeTitle(): void {
    titleOpen.value = false
  }

  function openSettings(): void {
    settingsOpen.value = true
  }

  function closeSettings(): void {
    settingsOpen.value = false
  }

  function loadSoundPreference(): void {
    if (!import.meta.client) return
    try {
      soundOn.value = localStorage.getItem(SOUND_KEY) === 'on'
    } catch {
      soundOn.value = false
    }
  }

  function setSound(on: boolean): void {
    soundOn.value = on
    if (!import.meta.client) return
    try {
      localStorage.setItem(SOUND_KEY, on ? 'on' : 'off')
    } catch {
      // Private windows can refuse storage; the toggle still works this visit.
    }
  }

  /** The illustrated how-to deck: shown once after the opening, then on request. */
  function loadGuidePreference(): void {
    if (!import.meta.client) return
    try {
      guideSeen.value = localStorage.getItem(GUIDE_KEY) === 'seen'
    } catch {
      guideSeen.value = true
    }
  }

  function openGuide(): void {
    guideOpen.value = true
  }

  function closeGuide(): void {
    guideOpen.value = false
    guideSeen.value = true
    if (!import.meta.client) return
    try {
      localStorage.setItem(GUIDE_KEY, 'seen')
    } catch {
      // Without storage the guide simply offers itself again next visit.
    }
  }

  async function chooseBackground(key: string): Promise<boolean> {
    if (key === backgroundKey.value) return true
    backgroundSaving.value = true
    storyError.value = ''
    try {
      const res = await performFetch<StoryState>('/api/aquarium/background', {
        method: 'POST',
        body: JSON.stringify({ backgroundKey: key }),
      })
      if (res.success && res.data) {
        state.value = res.data
        return true
      }
      storyError.value = res.message || 'Could not change the background.'
      return false
    } finally {
      backgroundSaving.value = false
    }
  }

  return {
    storyState: state,
    storyError,
    activeScene,
    activeBeat,
    beatIndex,
    isLastBeat,
    backgroundKey,
    backgrounds,
    backgroundSaving,
    loadStory,
    queueScene,
    queueMissedMilestoneScene,
    advanceBeat,
    replayIntro,
    replayScene,
    chooseReply,
    skipScene,
    activeChoices,
    isReplaying,
    spokenBeats,
    storyFloor,
    hasSeen,
    announceFirstOfFloor,
    announceFloorKey,
    queueMissedFloorScene,
    queueFinaleScene,
    finishScene,
    notifyAction,
    announceMilestones,
    chooseBackground,
    spokenBark,
    screenBark,
    sayBark,
    dismissBark,
    soundOn,
    settings,
    settingsOpen,
    loadSettings,
    updateSettings,
    titleOpen,
    maybeOpenTitle,
    closeTitle,
    openSettings,
    closeSettings,
    loadSoundPreference,
    setSound,
    guideOpen,
    openGuide,
    closeGuide,
  }
}
