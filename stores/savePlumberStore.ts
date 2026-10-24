import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useArcadeStore } from '~/stores/arcadeStore'
import { DEFAULT_HEROINE_SEED } from '~/utils/arcade/games/savePlumberHeroine'
import {
  rosterHeroine,
  rosterIndex,
} from '~/utils/arcade/games/savePlumberRoster'
import {
  PLUMBER_SLUG,
  readPlumberFile,
  readPlumberSave,
} from '~/utils/arcade/games/savePlumberSave'
import { completionPercent } from '~/utils/arcade/games/savePlumberOverworld'
import { CAMPAIGN } from '~/utils/arcade/games/savePlumberLevels'

/**
 * The front page's view of the player's Save the Plumber run. The heroine is
 * chosen inside the cabinet (its heroine select), and the cabinet keeps the
 * run's save on this device; the page reads that save to star the same
 * heroine on the title scene and map.
 */
export type PlumberScreen = 'title' | 'play' | 'map' | 'heroines' | 'cast'

export const useSavePlumberStore = defineStore('savePlumber', () => {
  const arcade = useArcadeStore()
  /** Which front-page tab is showing; the cabinet suspends while another is. */
  const screen = ref<PlumberScreen>('title')
  function setScreen(next: PlumberScreen) {
    screen.value = next
  }

  const progress = computed(() => readPlumberSave(arcade.saveFor(PLUMBER_SLUG)))
  const seed = computed(() => progress.value?.heroine ?? DEFAULT_HEROINE_SEED)
  const heroine = computed(() => rosterHeroine(seed.value))
  const rosterSlot = computed(() => rosterIndex(seed.value))
  const chosen = computed(() => progress.value !== null)
  const nextStage = computed(() =>
    progress.value ? CAMPAIGN[progress.value.stage]!.code : null,
  )
  const gears = computed(() => new Set(progress.value?.gears ?? []))
  const gearCount = computed(() => gears.value.size)
  const gearTotal = CAMPAIGN.length
  /** The longest Endless run on this device, in metres (0 before the first); kept beside the files. */
  const endlessBest = computed(
    () => readPlumberFile(arcade.saveFor(PLUMBER_SLUG)).endlessBest,
  )
  /** How much of the campaign the active file has done, 0-100. */
  const percent = computed(() =>
    progress.value
      ? completionPercent({
          done: progress.value.done ?? [],
          secrets: progress.value.secrets,
          gears: progress.value.gears,
        })
      : 0,
  )

  return {
    screen,
    setScreen,
    seed,
    heroine,
    rosterSlot,
    chosen,
    nextStage,
    progress,
    gears,
    gearCount,
    gearTotal,
    endlessBest,
    percent,
  }
})
