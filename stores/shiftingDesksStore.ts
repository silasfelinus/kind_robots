import { usePlaybookRunReviewStore } from '~/stores/playbookRunReviewStore'
import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { useAchievementStore } from './achievementStore'
import { loadPlaybookLiveText } from './utils/playbookLiveText'
import {
  advance as advanceRun,
  descend as descendRun,
  choose as chooseInRun,
  currentCard,
  SHIFTING_DESKS_LIVE_TEXT,
  newRun,
  outcomeById,
  upgradeRun,
  useInstant as useInstantInRun,
  type ChooseOptions,
  type RunState,
  endingFor,
} from '~/utils/shiftingDesks/rules'
import { dailySeed } from '~/utils/shiftingDesks/daily'
import {
  DEFAULT_DESK_SETTINGS,
  SETTINGS_KEY,
  parseDeskSettings,
  type DeskSettings,
  type EmployeeIdentity,
} from '~/utils/shiftingDesks/preferences'
import {
  completionAchievements,
  instantAchievements,
} from '~/utils/shiftingDesks/achievements'
import {
  emptyRewardArchive,
  migrateFoundEndings,
  newMilestonesForRun,
  parseSavedJSON,
  receiptFor,
  recordReward,
  restoreEndingGallery,
  restoreRewardArchive,
  type RewardArchive,
  type RunReceipt,
} from '~/utils/shiftingDesks/rewards'

const SAVE_KEY = 'shifting-desks-run-v1'
const ENVELOPE_KEY = 'shifting-desks-envelope-opened-v1'
const OUTCOMES_KEY = 'shifting-desks-outcomes-v1'
// Every ending this browser has reached: the front desk's collectible gallery.
const ENDINGS_KEY = 'shifting-desks-endings-v1'
const REWARD_KEY = 'shifting-desks-rewards-v1'

export const useShiftingDesksStore = defineStore('shiftingDesks', () => {
  const run = ref<RunState | null>(null)
  const settings = ref<DeskSettings>({ ...DEFAULT_DESK_SETTINGS })
  const discovered = ref<string[]>([])
  const endingsFound = ref<string[]>([])
  const rewardArchive = ref<RewardArchive>(emptyRewardArchive())
  const printReceipt = ref<RunReceipt | null>(null)
  const newlyEarnedMilestones = ref<string[]>([])
  const archiveUnlocked = computed(
    () => endingsFound.value.length > 0 || rewardArchive.value.runs.length > 0,
  )
  const loaded = ref(false)
  const rollSerial = ref(0)
  const envelopeOpened = ref(false)

  const card = computed(() => (run.value ? currentCard(run.value) : null))
  const outcome = computed(() =>
    outcomeById(run.value?.departmentOutcome ?? null),
  )
  const finished = computed(
    () =>
      !!run.value &&
      (run.value.status === 'complete' || run.value.status === 'eliminated') &&
      !run.value.pending,
  )
  const transition = computed(
    () =>
      !!run.value &&
      run.value.status === 'department-complete' &&
      !run.value.pending,
  )

  function persist(): void {
    try {
      if (run.value) localStorage.setItem(SAVE_KEY, JSON.stringify(run.value))
      else localStorage.removeItem(SAVE_KEY)
      localStorage.setItem(OUTCOMES_KEY, JSON.stringify(discovered.value))
      localStorage.setItem(ENDINGS_KEY, JSON.stringify(endingsFound.value))
      localStorage.setItem(REWARD_KEY, JSON.stringify(rewardArchive.value))
    } catch {
      return
    }
  }

  function setSetting(key: keyof DeskSettings, value: string | number): void {
    settings.value = parseDeskSettings({ ...settings.value, [key]: value })
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    } catch {
      // Preferences remain available until the next visit.
    }
  }

  function resetSettings(): void {
    settings.value = { ...DEFAULT_DESK_SETTINGS }
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
    } catch {
      // Browser storage is optional.
    }
  }

  function resetProgress(): void {
    run.value = null
    discovered.value = []
    endingsFound.value = []
    rewardArchive.value = emptyRewardArchive()
    printReceipt.value = null
    newlyEarnedMilestones.value = []
    envelopeOpened.value = false
    rollSerial.value = 0
    try {
      for (const key of [
        SAVE_KEY,
        ENVELOPE_KEY,
        OUTCOMES_KEY,
        ENDINGS_KEY,
        REWARD_KEY,
      ])
        localStorage.removeItem(key)
    } catch {
      // In-memory progress still resets if storage is unavailable.
    }
  }

  function load(): void {
    if (loaded.value) return
    newlyEarnedMilestones.value = []
    try {
      settings.value = parseDeskSettings(
        parseSavedJSON(localStorage.getItem(SETTINGS_KEY)),
      )
      run.value = upgradeRun(parseSavedJSON(localStorage.getItem(SAVE_KEY)))
      envelopeOpened.value =
        localStorage.getItem(ENVELOPE_KEY) === run.value?.seed
      const seen = parseSavedJSON(localStorage.getItem(OUTCOMES_KEY))
      discovered.value = Array.isArray(seen)
        ? [...new Set(seen.filter((s): s is string => typeof s === 'string'))]
        : []
      endingsFound.value = restoreEndingGallery(
        parseSavedJSON(localStorage.getItem(ENDINGS_KEY)),
      )
      rewardArchive.value = migrateFoundEndings(
        restoreRewardArchive(parseSavedJSON(localStorage.getItem(REWARD_KEY))),
        endingsFound.value,
      )
      recordEnding()
      persist()
    } catch {
      run.value = null
      discovered.value = []
      endingsFound.value = []
      rewardArchive.value = emptyRewardArchive()
    }
    loaded.value = true
    void loadPlaybookLiveText('shifting-desks', SHIFTING_DESKS_LIVE_TEXT).then(
      (changed) => {
        if (changed && run.value) run.value = { ...run.value }
      },
    )
  }

  // `daily` deals today's Daily Memo seed, the same run for everyone.
  function start(
    jobId: string,
    options: { daily?: boolean; identity?: Partial<EmployeeIdentity> } = {},
  ): void {
    const seed = options.daily
      ? dailySeed()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    printReceipt.value = null
    run.value = newRun(seed, jobId, options.identity)
    newlyEarnedMilestones.value = []
    usePlaybookRunReviewStore().begin('shifting-desks', seed)
    envelopeOpened.value = false
    persist()
  }

  function choose(choiceId: string, options: ChooseOptions = {}): void {
    if (!run.value) return
    const prev = run.value
    const before = run.value.log.length
    run.value = chooseInRun(run.value, choiceId, options)
    if (run.value.log.length === before) return
    awardShiftEnd(prev.status, run.value)
    rollSerial.value += 1
    const id = run.value.departmentOutcome
    if (id && !discovered.value.includes(id))
      discovered.value = [...discovered.value, id]
    recordEnding(true)
    persist()
  }

  // True when this run reached an ending the gallery had not seen yet.
  function recordEnding(announce = false): boolean {
    if (!run.value) return false
    if (run.value.pending) return false
    if (run.value.status !== 'complete' && run.value.status !== 'eliminated')
      return false
    const ending = endingFor(run.value)
    if (!ending) return false
    const before = endingsFound.value.length
    if (!endingsFound.value.includes(ending.id))
      endingsFound.value = [...endingsFound.value, ending.id]
    const receipt = receiptFor(run.value, new Date().toISOString())
    if (!receipt) return endingsFound.value.length !== before
    const previousArchive = rewardArchive.value
    rewardArchive.value = recordReward(
      previousArchive,
      receipt,
      endingsFound.value,
    )
    // Only a run finished in play is judged; load() restores silently.
    if (announce) {
      newlyEarnedMilestones.value = newMilestonesForRun(
        previousArchive,
        rewardArchive.value,
        receipt.id,
      )
      award(
        completionAchievements(
          previousArchive,
          rewardArchive.value,
          receipt.id,
          endingsFound.value,
          run.value,
        ),
      )
    }
    return (
      endingsFound.value.length !== before ||
      previousArchive !== rewardArchive.value
    )
  }

  function useInstant(which: 'favor' | 'mutation'): void {
    if (!run.value) return
    const before = run.value
    run.value = useInstantInRun(run.value, which)
    persist()
    award(instantAchievements(before, run.value))
  }

  /** Fires catalog codes at the deed; the achievement store ignores repeats. */
  function award(codes: string[]): void {
    if (!codes.length) return
    const achievements = useAchievementStore()
    for (const code of codes) void achievements.rewardAchievementByCode(code)
  }

  function openEnvelope(): void {
    envelopeOpened.value = true
    try {
      if (run.value) localStorage.setItem(ENVELOPE_KEY, run.value.seed)
    } catch {
      return
    }
  }

  function awardShiftEnd(previous: RunState['status'], after: RunState): void {
    if (previous !== 'playing' || after.status === 'playing') return
    const achievements = useAchievementStore()
    if (after.department === 'orientation' && after.status !== 'eliminated')
      void achievements.rewardAchievementByCode(
        'shifting-desks-survived-review',
      )
    if (after.status === 'complete')
      void achievements.rewardAchievementByCode(
        'shifting-desks-faced-the-board',
      )
  }

  function descend(): void {
    if (!run.value) return
    const previous = run.value.department
    run.value = descendRun(run.value)
    persist()
    if (
      previous !== 'sub-level-zero' &&
      run.value.department === 'sub-level-zero'
    )
      void useAchievementStore().rewardAchievementByCode(
        'shifting-desks-sub-level-zero',
      )
  }

  function advance(): void {
    if (!run.value) return
    run.value = advanceRun(run.value)
    persist()
  }

  function selectPrintReceipt(receipt: RunReceipt): void {
    printReceipt.value = receipt
  }

  function quit(): void {
    printReceipt.value = null
    newlyEarnedMilestones.value = []
    run.value = null
    persist()
  }

  return {
    run,
    settings,
    setSetting,
    resetSettings,
    resetProgress,
    envelopeOpened,
    useInstant,
    openEnvelope,
    discovered,
    endingsFound,
    rewardArchive,
    printReceipt,
    selectPrintReceipt,
    newlyEarnedMilestones,
    archiveUnlocked,
    loaded,
    rollSerial,
    card,
    outcome,
    finished,
    transition,
    descend,
    load,
    start,
    choose,
    advance,
    quit,
  }
})
