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
  CTHULHUQUARIUM_BACKGROUNDS,
  CTHULHUQUARIUM_SCENES,
  type CanonBackground,
  type CanonBeat,
  type CanonScene,
} from '~/utils/cthulhuquariumCanon.generated'

export interface StoryState {
  seenScenes: string[]
  unlockedBackgrounds: string[]
  backgroundKey: string
}

export type StoryAction = 'unlock' | 'feed' | 'clean' | 'shop' | 'bestiary'

export function useCthulhuquariumStory() {
  const state = ref<StoryState | null>(null)
  const queue = ref<string[]>([])
  const beatIndex = ref(0)
  const backgroundSaving = ref(false)
  const storyError = ref('')

  const activeScene = computed<CanonScene | null>(() => {
    const id = queue.value[0]
    return id ? (CTHULHUQUARIUM_SCENES[id] ?? null) : null
  })
  const activeBeat = computed<CanonBeat | null>(
    () => activeScene.value?.beats[beatIndex.value] ?? null,
  )
  const isLastBeat = computed(
    () =>
      !!activeScene.value &&
      beatIndex.value >= activeScene.value.beats.length - 1,
  )
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

  async function loadStory(): Promise<void> {
    const res = await performFetch<StoryState>('/api/aquarium/story')
    if (!res.success || !res.data) return
    state.value = res.data
    queueScene('intro')
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
    beatIndex.value = 0
    if (state.value) {
      state.value = {
        ...state.value,
        seenScenes: [...new Set([...state.value.seenScenes, ...ids])],
      }
    }
    const res = await performFetch<StoryState>('/api/aquarium/story/seen', {
      method: 'POST',
      body: JSON.stringify({ scenes: ids }),
    })
    if (res.success && res.data) state.value = res.data
  }

  async function advanceBeat(): Promise<void> {
    if (!activeScene.value) return
    if (isLastBeat.value) {
      await finishScene()
      return
    }
    beatIndex.value += 1
  }

  function notifyAction(action: StoryAction): void {
    if (activeBeat.value?.await === action) void advanceBeat()
  }

  function announceMilestones(ids: string[]): void {
    for (const id of ids) queueScene(`milestone_${id}`)
    if (ids.length) void refreshStory()
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
    advanceBeat,
    finishScene,
    notifyAction,
    announceMilestones,
    chooseBackground,
  }
}
