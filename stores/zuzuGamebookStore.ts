import { usePlaybookRunReviewStore } from '~/stores/playbookRunReviewStore'
import { playbookRunKey } from '~/utils/playbook/runReview'
import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  startRun,
  takeChoice,
  fight,
  isSavedRun,
  resolveLoot,
  scene,
  GAMEBOOK_LIVE_TEXT,
  type Run,
  type BattleAction,
} from '~/utils/zuzuGamebook/adventure'
import { decodeSaveCode, encodeSaveCode } from '~/utils/zuzuGamebook/saveCode'
import {
  ENDING_IDS,
  collectionAchievements,
  stepAchievements,
} from '~/utils/zuzuGamebook/achievements'
import { useAchievementStore } from './achievementStore'
import {
  SCRAPBOOK_KEY,
  addJourney,
  captureJourney,
  decodeScrapbook,
  type JourneyMemory,
} from '~/utils/zuzuGamebook/scrapbook'
import { loadPlaybookLiveText } from './utils/playbookLiveText'

const SAVE_KEY = 'kr-zuzu-gamebook-v1'
const ENDINGS_KEY = 'kr-zuzu-gamebook-endings-v1'
const RECOVERY_KEY = 'kr-zuzu-gamebook-recovery-v1'
/** Endings reached in play here, for the collection achievements; never fed by a save code. */
const PLAYED_KEY = 'kr-zuzu-gamebook-played-endings-v1'

export const useZuzuGamebookStore = defineStore('zuzuGamebook', () => {
  const run = ref<Run>(startRun(1))
  const discovered = ref<string[]>([])
  const played = ref<string[]>([])
  const recoverable = ref<Run | null>(null)
  const scrapbook = ref<JourneyMemory[]>([])
  const loaded = ref(false)
  const rollSerial = ref(0)
  /** When this browser last kept the journey (the reader's "Saved" mark), or null when storage refused it. */
  const savedAt = ref<number | null>(null)
  const saveFailed = ref(false)

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      localStorage.setItem(ENDINGS_KEY, JSON.stringify(discovered.value))
      localStorage.setItem(PLAYED_KEY, JSON.stringify(played.value))
      localStorage.setItem(
        SCRAPBOOK_KEY,
        JSON.stringify({ version: 1, runs: scrapbook.value }),
      )
      if (recoverable.value)
        localStorage.setItem(RECOVERY_KEY, JSON.stringify(recoverable.value))
      else localStorage.removeItem(RECOVERY_KEY)
      savedAt.value = Date.now()
      saveFailed.value = false
    } catch {
      // The game remains playable without browser storage; the reader says so.
      saveFailed.value = true
    }
  }

  function rememberJourney() {
    if (run.value.visited.length <= 1) return
    scrapbook.value = addJourney(
      scrapbook.value,
      captureJourney(run.value, new Date().toISOString()),
    )
  }

  function rememberEnding() {
    for (const ending of run.value.endings) {
      if (!discovered.value.includes(ending)) discovered.value.push(ending)
    }
  }

  /** Each browser slot is independent: a corrupt gallery must not erase a valid run. */
  function readStoredJson(key: string): unknown {
    try {
      const raw = localStorage.getItem(key)
      return raw === null ? null : JSON.parse(raw)
    } catch {
      return null
    }
  }

  function load() {
    if (loaded.value) return
    const current = readStoredJson(SAVE_KEY)
    if (isSavedRun(current))
      run.value = { ...current, pendingLoot: current.pendingLoot ?? [] }

    const backup = readStoredJson(RECOVERY_KEY)
    if (isSavedRun(backup))
      recoverable.value = { ...backup, pendingLoot: backup.pendingLoot ?? [] }

    // A damaged scrapbook or gallery must not prevent the active run from loading.
    try {
      scrapbook.value = decodeScrapbook(localStorage.getItem(SCRAPBOOK_KEY))
    } catch {
      scrapbook.value = []
    }
    const endings = readStoredJson(ENDINGS_KEY)
    if (Array.isArray(endings))
      discovered.value = [...new Set(endings.filter(
        (entry): entry is string =>
          typeof entry === 'string' && ENDING_IDS.includes(entry),
      ))]
    // Legacy installs had only the discovered gallery, not the played record.
    const reached = readStoredJson(PLAYED_KEY)
    const playedSource = reached === null ? discovered.value : reached
    if (Array.isArray(playedSource))
      played.value = [...new Set(playedSource.filter(
        (entry): entry is string =>
          typeof entry === 'string' && ENDING_IDS.includes(entry),
      ))]
    loaded.value = true
    save()
    void loadPlaybookLiveText('zuzu-gamebook', GAMEBOOK_LIVE_TEXT).then(
      (changed) => {
        // A fresh object makes the scene computeds re-read the edited text.
        if (changed) run.value = { ...run.value }
      },
    )
  }

  function awardDeeds(before: Run, after: Run) {
    const achievements = useAchievementStore()
    const foe = scene(before.sceneId).battle
    if (foe && before.battle && after.sceneId === foe.win)
      void achievements.rewardAchievementByCode('zuzu-gamebook-first-fight-won')
    for (const code of stepAchievements(before, after))
      void achievements.rewardAchievementByCode(code)
    if (after.endings.length <= before.endings.length) return
    if (
      ENDING_IDS.includes(after.sceneId) &&
      !played.value.includes(after.sceneId)
    ) {
      const earlier = played.value
      played.value = [...earlier, after.sceneId]
      for (const code of collectionAchievements(earlier, played.value))
        void achievements.rewardAchievementByCode(code)
    }
    if (scene(after.sceneId).ending === 'hope')
      void achievements.rewardAchievementByCode('zuzu-gamebook-hopeful-ending')
    if (after.sceneId === 'ending-bell')
      void achievements.rewardAchievementByCode('zuzu-gamebook-ring-the-bell')
  }

  function choose(id: string) {
    if (!loaded.value) return
    const before = run.value
    const next = takeChoice(run.value, id)
    if (next === run.value) return
    run.value = next
    awardDeeds(before, next)
    if (next.lastRoll) rollSerial.value++
    rememberEnding()
    if (scene(next.sceneId).ending && next.sceneId !== before.sceneId)
      rememberJourney()
    save()
  }

  function battle(action: BattleAction) {
    if (!loaded.value) return
    const before = run.value
    const next = fight(run.value, action)
    if (next === run.value) return
    run.value = next
    awardDeeds(before, next)
    rollSerial.value++
    rememberEnding()
    if (scene(next.sceneId).ending && next.sceneId !== before.sceneId)
      rememberJourney()
    save()
  }

  function claimLoot(replacementIndex: number | null) {
    if (!loaded.value) return
    const next = resolveLoot(run.value, replacementIndex)
    if (next === run.value) return
    run.value = next
    save()
  }

  function restart() {
    if (!loaded.value) return
    rememberJourney()
    recoverable.value = run.value
    run.value = startRun(Date.now() >>> 0 || 1)
    usePlaybookRunReviewStore().begin(
      'zuzu-gamebook',
      playbookRunKey(run.value),
    )
    rollSerial.value = 0
    save()
  }

  function recover() {
    if (!loaded.value || !recoverable.value) return
    const current = run.value
    run.value = recoverable.value
    recoverable.value = current
    rollSerial.value++
    save()
  }

  /** The journey as a code to carry to another browser or device. */
  function exportCode(): string {
    return encodeSaveCode(run.value)
  }

  /** Load a journey from a code; the journey it replaces waits in the recovery slot. */
  function importCode(code: string): boolean {
    if (!loaded.value) return false
    const next = decodeSaveCode(code)
    if (!next) return false
    recoverable.value = run.value
    run.value = next
    rollSerial.value++
    rememberEnding()
    save()
    return true
  }

  return {
    run,
    discovered,
    recoverable,
    scrapbook,
    loaded,
    rollSerial,
    savedAt,
    saveFailed,
    load,
    choose,
    battle,
    claimLoot,
    restart,
    recover,
    exportCode,
    importCode,
  }
})
