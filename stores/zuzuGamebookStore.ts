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
import { useAchievementStore } from './achievementStore'
import { loadPlaybookLiveText } from './utils/playbookLiveText'

const SAVE_KEY = 'kr-zuzu-gamebook-v1'
const ENDINGS_KEY = 'kr-zuzu-gamebook-endings-v1'
const RECOVERY_KEY = 'kr-zuzu-gamebook-recovery-v1'

export const useZuzuGamebookStore = defineStore('zuzuGamebook', () => {
  const run = ref<Run>(startRun(1))
  const discovered = ref<string[]>([])
  const recoverable = ref<Run | null>(null)
  const loaded = ref(false)
  const rollSerial = ref(0)

  function save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      localStorage.setItem(ENDINGS_KEY, JSON.stringify(discovered.value))
      if (recoverable.value)
        localStorage.setItem(RECOVERY_KEY, JSON.stringify(recoverable.value))
      else localStorage.removeItem(RECOVERY_KEY)
    } catch {
      // The game remains playable without browser storage.
    }
  }

  function rememberEnding() {
    for (const ending of run.value.endings) {
      if (!discovered.value.includes(ending)) discovered.value.push(ending)
    }
  }

  function load() {
    if (loaded.value) return
    try {
      const raw = localStorage.getItem(SAVE_KEY)
      if (raw) {
        const parsed: unknown = JSON.parse(raw)
        if (isSavedRun(parsed))
          run.value = { ...parsed, pendingLoot: parsed.pendingLoot ?? [] }
      }
      const backup = localStorage.getItem(RECOVERY_KEY)
      if (backup) {
        try {
          const parsed: unknown = JSON.parse(backup)
          if (isSavedRun(parsed))
            recoverable.value = {
              ...parsed,
              pendingLoot: parsed.pendingLoot ?? [],
            }
        } catch {
          // A bad recovery slot must not block the current adventure.
        }
      }
      const endings: unknown = JSON.parse(
        localStorage.getItem(ENDINGS_KEY) ?? '[]',
      )
      if (Array.isArray(endings))
        discovered.value = endings.filter(
          (entry): entry is string => typeof entry === 'string',
        )
    } catch {
      // Corrupt or blocked storage starts a new adventure safely.
    }
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
    if (after.endings.length <= before.endings.length) return
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
    recoverable.value = run.value
    run.value = startRun(Date.now() >>> 0 || 1)
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

  return {
    run,
    discovered,
    recoverable,
    loaded,
    rollSerial,
    load,
    choose,
    battle,
    claimLoot,
    restart,
    recover,
  }
})
