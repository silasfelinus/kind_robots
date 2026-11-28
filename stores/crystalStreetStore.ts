import { useAchievementStore } from '~/stores/achievementStore'
import { usePlaybookRunReviewStore } from '~/stores/playbookRunReviewStore'
import { crystalStreetDeeds } from '~/utils/crystalStreet/achievements'
import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import { loadPlaybookLiveText } from './utils/playbookLiveText'
import {
  CRYSTAL_STREET_LIVE_TEXT,
  VILLAINS,
  awaitingDraw,
  drawFrom as drawFromInRun,
  buy as buyInRun,
  choose as chooseInRun,
  currentEncounter,
  dismiss as dismissInRun,
  doActivity,
  endingKey,
  repairRun,
  specialKey,
  newRun,
  nightfall as nightfallInRun,
  pendingOutcome,
  reroll as rerollInRun,
  resolve as resolveInRun,
  useItem as useItemInRun,
  villainOf,
  type DayActivity,
  type DeckChoice,
  type LogEntry,
  type NewRunOptions,
  type RunState,
} from '~/utils/crystalStreet/rules'
import { TIP_IDS, tipFor } from '~/utils/crystalStreet/tips'
import type { CompanionId, ItemId, LocationId } from '~/utils/crystalStreet/ids'

import { useUserStore } from '~/stores/userStore'
import { performFetch } from '~/stores/utils'
import {
  accountSaveKey,
  DEFAULT_SETTINGS,
  emptyScrapbook,
  emptyStamps,
  mergeCrystalStreetSaves,
  parseCrystalStreetSave,
  restoreScrapbook,
  restoreSettings,
  SCRAPBOOK_LIMIT,
  type CrystalStreetSave,
  type CrystalStreetSettings,
  type SaveSection,
  type SaveStamps,
  type Scrapbook,
} from '~/utils/crystalStreet/accountSave'

const RUN_KEY = 'crystal-street-run-v1'
const SCRAPBOOK_KEY = 'crystal-street-scrapbook-v1'
const SETTINGS_KEY = 'crystal-street-settings-v1'
const TIPS_KEY = 'crystal-street-tips-v1'
export type {
  CrystalStreetSettings,
  Scrapbook,
  ScrapbookRun,
} from '~/utils/crystalStreet/accountSave'
/** Companions this week has recruited, from its recruit flags. */
export function recruitedIn(run: RunState): string[] {
  return run.flags
    .filter((f) => f.startsWith('recruit:'))
    .map((f) => f.slice('recruit:'.length))
}

export function highlightsOf(run: RunState): LogEntry[] {
  const wins = run.log.filter((l) => l.success)
  const picks = [...wins.slice(-3), run.log[run.log.length - 1]]
  return [...new Set(picks.filter((l): l is LogEntry => !!l))].slice(-4)
}

export const useCrystalStreetStore = defineStore('crystalStreet', () => {
  const run = ref<RunState | null>(null)
  const scrapbook = ref<Scrapbook>(emptyScrapbook())
  const settings = ref<CrystalStreetSettings>({ ...DEFAULT_SETTINGS })
  const tipsSeen = ref<string[]>([])
  // Tips run through a player's first week unless they choose otherwise.
  const tip = computed(() => {
    const mode = settings.value.tips
    if (!run.value || mode === 'off') return null
    if (mode === 'auto' && scrapbook.value.runs.length) return null
    return tipFor(run.value, tipsSeen.value)
  })

  function resetTips(): void {
    tipsSeen.value = []
    persist('tips')
  }

  function seeTip(id: string): void {
    if (tipsSeen.value.includes(id)) return
    tipsSeen.value = [...tipsSeen.value, id]
    persist('tips')
  }
  const loaded = ref(false)
  const storageWarning = ref('')

  const encounter = computed(() =>
    run.value ? currentEncounter(run.value) : null,
  )
  const outcome = computed(() => (run.value ? pendingOutcome(run.value) : null))
  const drawing = computed(() => !!run.value && awaitingDraw(run.value))
  const villain = computed(() => (run.value ? villainOf(run.value) : null))
  const bestFound = computed(
    () =>
      VILLAINS.filter((v) =>
        scrapbook.value.endings.includes(endingKey(v.id, 'best')),
      ).length,
  )
  const metVillains = computed(
    () => new Set(scrapbook.value.runs.map((r) => r.villain)),
  )

  const user = useUserStore()
  const accountOwner = computed(() => user.authenticatedUserId)
  const accountStatus = ref('')
  const accountChecked = ref(false)
  const accountHasSave = ref(false)
  const guestProgress = ref(false)
  const accountReady = computed(
    () => !accountOwner.value || accountHasSave.value || accountChecked.value,
  )
  const canImportDevice = computed(
    () =>
      !!accountOwner.value &&
      accountChecked.value &&
      !accountHasSave.value &&
      guestProgress.value,
  )
  let stamps: SaveStamps = emptyStamps()
  let epoch = 0
  let busy = false
  let retries = 0
  let timer: ReturnType<typeof setTimeout> | undefined

  function snapshot(): CrystalStreetSave {
    return {
      version: 1,
      stamps: { ...stamps },
      run: run.value,
      scrapbook: scrapbook.value,
      settings: settings.value,
      tips: tipsSeen.value,
    }
  }

  function applySnapshot(save: CrystalStreetSave): void {
    stamps = { ...save.stamps }
    run.value = save.run
    scrapbook.value = save.scrapbook
    settings.value = save.settings
    tipsSeen.value = save.tips
    accountHasSave.value = true
  }

  function readGuest(): CrystalStreetSave {
    const read = (key: string, fallback: string) =>
      JSON.parse(localStorage.getItem(key) ?? fallback) as unknown
    const seen = read(TIPS_KEY, '[]')
    return {
      version: 1,
      stamps: emptyStamps(),
      run: repairRun(read(RUN_KEY, 'null')),
      scrapbook: restoreScrapbook(read(SCRAPBOOK_KEY, 'null')),
      settings: restoreSettings(read(SETTINGS_KEY, 'null')),
      tips: Array.isArray(seen) ? TIP_IDS.filter((id) => seen.includes(id)) : [],
    }
  }

  function writeLocal(): void {
    try {
      const owner = accountOwner.value
      if (owner) {
        localStorage.setItem(accountSaveKey(owner), JSON.stringify(snapshot()))
      } else {
        if (run.value) localStorage.setItem(RUN_KEY, JSON.stringify(run.value))
        else localStorage.removeItem(RUN_KEY)
        localStorage.setItem(SCRAPBOOK_KEY, JSON.stringify(scrapbook.value))
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings.value))
        localStorage.setItem(TIPS_KEY, JSON.stringify(tipsSeen.value))
      }
      storageWarning.value = ''
    } catch {
      storageWarning.value = 'This browser could not save your week locally.'
    }
  }

  function scheduleSync(delay = 600): void {
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    if (!loaded.value || !accountOwner.value) return
    timer = setTimeout(() => {
      timer = undefined
      void syncAccount()
    }, delay)
  }

  async function syncAccount(): Promise<void> {
    const owner = accountOwner.value
    if (!owner || !loaded.value) return
    if (busy) {
      scheduleSync()
      return
    }
    const generation = epoch
    const current = () => generation === epoch && owner === accountOwner.value
    busy = true
    accountStatus.value = 'Syncing your account…'
    try {
      const result = await performFetch<{
        ownerId: number
        save: CrystalStreetSave | null
        revision: number | null
      }>('/api/crystal-street/account-save')
      if (!current()) return
      if (!result.success || result.data?.ownerId !== owner)
        throw new Error('Read failed or account changed')
      const { save, revision } = result.data
      if (
        save === undefined ||
        (save === null && revision !== null) ||
        (save !== null &&
          (!Number.isSafeInteger(revision) || Number(revision) < 0))
      )
        throw new Error('Invalid revision')
      const remote = save
        ? parseCrystalStreetSave(JSON.stringify(save))
        : null
      accountChecked.value = true
      if (remote) {
        const merged = accountHasSave.value
          ? mergeCrystalStreetSaves(snapshot(), remote)
          : remote
        if (
          !accountHasSave.value ||
          JSON.stringify(merged) !== JSON.stringify(snapshot())
        ) {
          applySnapshot(merged)
          writeLocal()
        }
        if (JSON.stringify(merged) === JSON.stringify(remote)) {
          accountStatus.value = 'Account progress is up to date.'
          retries = 0
          return
        }
      }
      if (!accountHasSave.value) {
        accountStatus.value = 'No account save yet.'
        retries = 0
        return
      }
      const sent = snapshot()
      const saved = await performFetch<{ revision: number }>(
        '/api/crystal-street/account-save',
        {
          method: 'PUT',
          body: JSON.stringify({
            ownerId: owner,
            save: sent,
            expectedRevision: revision,
          }),
        },
      )
      if (!current()) return
      if (!saved.success || !Number.isSafeInteger(saved.data?.revision))
        throw new Error('Write failed')
      accountStatus.value = 'Account progress saved.'
      retries = 0
      if (JSON.stringify(sent) !== JSON.stringify(snapshot())) scheduleSync()
    } catch {
      if (!current()) return
      accountStatus.value = 'Account sync unavailable. Device progress is safe if local storage is working.'
      if (retries < 3) scheduleSync(1000 * 2 ** retries++)
    } finally {
      if (current()) busy = false
    }
  }

  function persist(...changed: SaveSection[]): void {
    const now = Math.max(Date.now(), ...Object.values(stamps).map((n) => n + 1))
    for (const key of changed) stamps[key] = now
    if (accountOwner.value) accountHasSave.value = true
    writeLocal()
    retries = 0
    scheduleSync()
  }

  function loadScope(): void {
    epoch++
    busy = false
    retries = 0
    if (timer !== undefined) clearTimeout(timer)
    timer = undefined
    accountStatus.value = ''
    storageWarning.value = ''
    accountChecked.value = false
    accountHasSave.value = false
    guestProgress.value = false
    stamps = emptyStamps()
    run.value = null
    scrapbook.value = emptyScrapbook()
    settings.value = { ...DEFAULT_SETTINGS }
    tipsSeen.value = []
    try {
      const owner = accountOwner.value
      if (owner) {
        const saved = localStorage.getItem(accountSaveKey(owner))
        if (saved) applySnapshot(parseCrystalStreetSave(saved))
        try {
          const guest = readGuest()
          guestProgress.value = !!(
            guest.run ||
            guest.scrapbook.runs.length ||
            guest.scrapbook.friends.length ||
            guest.scrapbook.endings.length
          )
        } catch {
          // A corrupt legacy guest save cannot affect the signed-in account.
        }
      } else {
        const guest = readGuest()
        run.value = guest.run
        scrapbook.value = guest.scrapbook
        settings.value = guest.settings
        tipsSeen.value = guest.tips
      }
    } catch {
      storageWarning.value = 'This browser could not read the local save.'
    }
    scheduleSync(0)
  }

  function retryAccount(): void {
    retries = 0
    scheduleSync(0)
  }

  function importDeviceProgress(): void {
    if (!canImportDevice.value) return
    try {
      const guest = readGuest()
      applySnapshot(guest)
      persist('run', 'scrapbook', 'settings', 'tips')
      guestProgress.value = false
    } catch {
      accountStatus.value = 'Could not import this browser’s guest save.'
    }
  }

  function load(): void {
    if (loaded.value) return
    loaded.value = true
    loadScope()
    window.addEventListener('online', () => {
      retries = 0
      scheduleSync(0)
    })
    void loadPlaybookLiveText('crystal-street', CRYSTAL_STREET_LIVE_TEXT).then(
      (changed) => {
        if (changed && run.value) run.value = { ...run.value }
      },
    )
  }

  watch(
    accountOwner,
    () => {
      if (loaded.value) loadScope()
    },
    { flush: 'sync' },
  )

  function record(next: RunState): void {
    if (!next.ending) return
    if (scrapbook.value.runs.some((r) => r.seed === next.seed)) return
    const special = next.ending.special
    const keys = special
      ? special === 'final-girl'
        ? [endingKey(next.villain, next.ending.tier), specialKey(special)]
        : [specialKey(special)]
      : [endingKey(next.villain, next.ending.tier)]
    scrapbook.value = {
      ...scrapbook.value,
      runs: [
        {
          seed: next.seed,
          villain: next.villain,
          tier: next.ending.tier,
          name: next.name,
          ...(next.avatar ? { avatar: next.avatar } : {}),
          archetype: next.archetype,
          crew: [...next.crew],
          clues: next.clues.length,
          wins: next.wins,
          day: next.day,
          endedAt: next.ending.at,
          highlights: highlightsOf(next),
          ...(special ? { special } : {}),
        },
        ...scrapbook.value.runs,
      ].slice(0, SCRAPBOOK_LIMIT),
      endings: [
        ...scrapbook.value.endings,
        ...keys.filter((k) => !scrapbook.value.endings.includes(k)),
      ],
    }
  }

  function commit(next: RunState): void {
    if (next === run.value) return
    const before = run.value
    const bookBefore = scrapbook.value
    run.value = next
    const met = recruitedIn(next).filter(
      (id) => !scrapbook.value.friends.includes(id),
    )
    if (met.length)
      scrapbook.value = {
        ...scrapbook.value,
        friends: [...scrapbook.value.friends, ...met],
      }
    record(next)
    if (bookBefore !== scrapbook.value) persist('run', 'scrapbook')
    else persist('run')
    // Only a committed move awards: load() restores a saved week directly.
    const deeds = crystalStreetDeeds(before, next, bookBefore, scrapbook.value)
    if (deeds.length) {
      const achievements = useAchievementStore()
      for (const code of deeds) void achievements.rewardAchievementByCode(code)
    }
  }

  function start(
    options: Omit<NewRunOptions, 'seed'> & { seed?: string },
  ): void {
    const seed =
      options.seed ??
      `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
    commit(newRun({ ...options, seed }))
    usePlaybookRunReviewStore().begin('crystal-street', seed)
  }

  function abandon(): void {
    run.value = null
    persist('run')
  }

  function setSetting<K extends keyof CrystalStreetSettings>(
    key: K,
    value: CrystalStreetSettings[K],
  ): void {
    settings.value = { ...settings.value, [key]: value }
    persist('settings')
  }

  function resetScrapbook(): void {
    scrapbook.value = emptyScrapbook()
    persist('scrapbook', 'reset')
  }

  function act<T extends unknown[]>(
    fn: (state: RunState, ...args: T) => RunState,
    ...args: T
  ): void {
    if (run.value) commit(fn(run.value, ...args))
  }

  // A click that lands just as the screen changes (the second half of a
  // double-click on Continue) would hit whatever button replaced the one
  // pressed, often the next card's first choice. Moves that change the
  // screen ignore input until it has settled (roadmap #4143, UI torture).
  const SETTLE_MS = 350
  let changedAt = 0
  function move<T extends unknown[]>(
    fn: (state: RunState, ...args: T) => RunState,
    ...args: T
  ): void {
    if (!run.value || Date.now() - changedAt < SETTLE_MS) return
    const before = run.value
    act(fn, ...args)
    if (run.value !== before) changedAt = Date.now()
  }

  return {
    run,
    scrapbook,
    settings,
    loaded,
    storageWarning,
    accountOwner,
    accountStatus,
    accountReady,
    retryAccount,
    canImportDevice,
    importDeviceProgress,
    encounter,
    outcome,
    drawing,
    villain,
    bestFound,
    metVillains,
    load,
    start,
    abandon,
    setSetting,
    resetScrapbook,
    tip,
    tipsSeen,
    seeTip,
    resetTips,
    choose: (choiceId: string) => move(chooseInRun, choiceId),
    reroll: () => move(rerollInRun),
    resolve: () => move(resolveInRun),
    activity: (location: LocationId, activity: DayActivity) =>
      move(doActivity, location, activity),
    nightfall: () => move(nightfallInRun),
    drawFrom: (deck: DeckChoice) => move(drawFromInRun, deck),
    buy: (item: ItemId) => act(buyInRun, item),
    useItem: (item: ItemId) => act(useItemInRun, item),
    dismiss: (id: CompanionId) => act(dismissInRun, id),
  }
})
