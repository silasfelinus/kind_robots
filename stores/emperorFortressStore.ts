import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  assignQuest,
  chooseAudienceOption,
  chooseTalkOption,
  createRun,
  earnFlag,
  equipItem,
  finishDay,
  previewQuest,
  recruit,
  upgradeBeds,
  withdrawQuest,
} from '~/utils/emperorOfDust/fortress/engine'
import {
  buyItem,
  sellItem,
  treatFollower,
} from '~/utils/emperorOfDust/fortress/market'
import type { TreatmentKind } from '~/utils/emperorOfDust/fortress/market'
import { FORTRESS_LIVE_TEXT } from '~/utils/emperorOfDust/fortress/content'
import { allegiancesKnown } from '~/utils/emperorOfDust/fortress/codex'
import {
  SLOT_COUNT,
  decodeBook,
  decodeCodex,
  decodeSlot,
  emptyCodex,
  encodeBook,
  encodeSlot,
  mergeCodex,
  newBook,
  recordDawn,
  rewindTo,
  updateCurrent,
} from '~/utils/emperorOfDust/fortress/saves'
import type { SaveBook, SlotRecord } from '~/utils/emperorOfDust/fortress/saves'
import type {
  Codex,
  DawnReport,
  FortressRun,
} from '~/utils/emperorOfDust/fortress/types'
import {
  acquireRelic,
  chooseNextLoadout,
  claimableRelics,
  decodeRelicVault,
  emptyRelicVault,
  encodeRelicVault,
} from '~/utils/emperorOfDust/fortress/relics'
import type { RelicId, RelicVault } from '~/utils/emperorOfDust/fortress/relics'
import { useAchievementStore } from './achievementStore'
import { loadPlaybookLiveText } from './utils/playbookLiveText'

// Emperor of Dust v0.3 (Fortress), conductor SYSTEMS-V03.md.
export type TextSpeed = 'normal' | 'fast' | 'instant'
export type ReadingSize = 'comfortable' | 'large' | 'extra-large'
export type FortressPreferences = {
  readingSize: ReadingSize
  readingFont: 'serif' | 'sans'
  readingWidth: 'balanced' | 'wide'
  contrast: 'standard' | 'high'
  motion: 'system' | 'reduced'
}
export const DEFAULT_FORTRESS_PREFERENCES: FortressPreferences = {
  readingSize: 'comfortable',
  readingFont: 'serif',
  readingWidth: 'balanced',
  contrast: 'standard',
  motion: 'system',
}
const TEXT_SPEEDS: readonly TextSpeed[] = ['normal', 'fast', 'instant']
const SPEED_KEY = 'kr-emperor-of-dust-text-speed'
const PREFERENCES_KEY = 'kr-emperor-of-dust-reading-v1'
const VALID_PREFERENCES = {
  readingSize: ['comfortable', 'large', 'extra-large'],
  readingFont: ['serif', 'sans'],
  readingWidth: ['balanced', 'wide'],
  contrast: ['standard', 'high'],
  motion: ['system', 'reduced'],
} as const
function parsePreferences(raw: string | null | undefined): FortressPreferences {
  if (!raw) return { ...DEFAULT_FORTRESS_PREFERENCES }
  try {
    const obj: unknown = JSON.parse(raw)
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return { ...DEFAULT_FORTRESS_PREFERENCES }
    const record = obj as Record<string, unknown>
    const result = { ...DEFAULT_FORTRESS_PREFERENCES }
    for (const key of Object.keys(VALID_PREFERENCES) as (keyof FortressPreferences)[]) {
      const value = record[key]
      if (typeof value === 'string' && (VALID_PREFERENCES[key] as readonly string[]).includes(value))
        (result as Record<string, string>)[key] = value
    }
    return result
  } catch {
    return { ...DEFAULT_FORTRESS_PREFERENCES }
  }
}
// Day 1 petitions and their kind answers, for the existing achievements.
const DAY_ONE_PETITIONS = ['q-d01-aqueduct', 'q-d01-toll', 'q-d01-mirefen']
const KIND_ORDERS = [
  'q-d01-aqueduct-repair',
  'q-d01-toll-parley',
  'q-d01-mirefen-escort',
]
const AUTO_KEY = 'kr-emperor-of-dust-fortress-auto-v3'
const CODEX_KEY = 'kr-emperor-of-dust-codex-v1'
const RELIC_KEY = 'kr-emperor-of-dust-relic-vault-v1'
const INTRO_KEY = 'kr-emperor-of-dust-intro-seen-v1'
const slotKey = (slot: number) => `kr-emperor-of-dust-fortress-slot-${slot}-v3`
const newSeed = (): number => Date.now() >>> 0 || 1
const BLOCKED = 'Browser storage is blocked. This run may not persist.'
const FULL = 'Local save unavailable or full. This session is not backed up.'
const VAULT_HELD = 'The relic vault could not be read. It was not overwritten.'
const CODEX_HELD =
  'The Codex could not be read. It was not overwritten; what you learn now lasts only this visit.'
const AUTOSAVE_HELD =
  'The autosave could not be read. It was not overwritten; start a new run or load a slot.'

/** localStorage, or null when it is missing or access itself throws. */
function storage(): Storage | null {
  try {
    return globalThis.localStorage ?? null
  } catch {
    return null
  }
}

export const useEmperorFortressStore = defineStore('emperorFortress', () => {
  const book = ref<SaveBook | null>(null)
  const codex = ref<Codex>(emptyCodex())
  const slots = ref<(SlotRecord | null)[]>(Array(SLOT_COUNT).fill(null))
  const loaded = ref(false)
  /** The introduction is showing: on a first visit with no save, or replayed from the Chronicle. */
  const introOpen = ref(false)
  /** The last write that failed; cleared once the autosave writes again. */
  const writeWarning = ref('')
  /** Stored data that could not be read and is being left untouched. */
  const heldNotices = ref<string[]>([])
  const storageWarning = computed(() =>
    [...heldNotices.value, writeWarning.value].filter(Boolean).join(' '),
  )
  /** Slots whose stored text is unreadable: never written over until cleared. */
  const slotUnreadable = ref<boolean[]>(Array(SLOT_COUNT).fill(false))
  const lastResponse = ref('')
  const lastReport = ref<DawnReport | null>(null)
  /** Codex ids learned by the last answer or talk, for the reveal moment. */
  const lastLearned = ref<string[]>([])
  const relicVault = ref<RelicVault>(emptyRelicVault())
  const textSpeed = ref<TextSpeed>('normal')
  const preferences = ref<FortressPreferences>({ ...DEFAULT_FORTRESS_PREFERENCES })
  let relicVaultUnreadable = false
  // An unreadable autosave or Codex is never overwritten: the autosave waits
  // until the player starts a new run or loads a slot, the Codex for good.
  let autosaveHeld = false
  let codexHeld = false
  let codexPending = false

  const run = computed<FortressRun | null>(() => book.value?.current ?? null)
  const day = computed(() => run.value?.day ?? 1)
  const rewindableDays = computed(() =>
    (book.value?.dawns ?? []).map((dawn) => dawn.day),
  )
  const claimable = computed(() =>
    run.value ? claimableRelics(run.value, relicVault.value) : [],
  )

  function hold(notice: string) {
    if (!heldNotices.value.includes(notice))
      heldNotices.value = [...heldNotices.value, notice]
  }

  function release(notice: string) {
    heldNotices.value = heldNotices.value.filter((entry) => entry !== notice)
  }

  /**
   * One setItem. A browser that refuses it (blocked, or over quota) leaves
   * the previous value in place, so a failed autosave never damages the last
   * good one; the failure is reported, not ignored.
   */
  function write(key: string, value: string): boolean {
    const store = storage()
    if (!store) {
      writeWarning.value = BLOCKED
      return false
    }
    try {
      store.setItem(key, value)
      return true
    } catch {
      writeWarning.value = FULL
      return false
    }
  }

  /** The stored text, null when there is none, undefined when reading threw. */
  function read(key: string): string | null | undefined {
    const store = storage()
    if (!store) return null
    try {
      return store.getItem(key)
    } catch {
      return undefined
    }
  }

  function persist() {
    if (!book.value || autosaveHeld) return
    if (!write(AUTO_KEY, encodeBook(book.value))) return
    if (codexPending) persistCodex()
    if (!codexPending) writeWarning.value = ''
  }

  /** Adds ids to the persistent Codex; returns the ones that were new. */
  function remember(ids: readonly string[]): string[] {
    const merged = mergeCodex(codex.value, ids)
    if (merged === codex.value) return []
    const added = merged.revealed.filter(
      (id) => !codex.value.revealed.includes(id),
    )
    codex.value = merged
    persistCodex()
    return added
  }

  function persistCodex() {
    if (codexHeld) return
    codexPending = !write(CODEX_KEY, JSON.stringify(codex.value))
  }

  function equippedRelics(): string[] {
    return [...relicVault.value.nextLoadout]
  }

  function saveRelics(next: RelicVault) {
    if (relicVaultUnreadable)
      throw new Error(
        'The relic vault is unreadable; it will not be overwritten',
      )
    if (!write(RELIC_KEY, encodeRelicVault(next)))
      throw new Error('The relic vault could not be saved; nothing changed')
    relicVault.value = next
  }

  function claimRelic(id: RelicId) {
    saveRelics(acquireRelic(relicVault.value, current(), id))
  }

  function setNextRelics(ids: RelicId[]) {
    saveRelics(chooseNextLoadout(relicVault.value, ids))
  }

  function setTextSpeed(speed: TextSpeed) {
    textSpeed.value = speed
    write(SPEED_KEY, speed)
  }

  function setPreference<K extends keyof FortressPreferences>(key: K, value: FortressPreferences[K]) {
    if (!(VALID_PREFERENCES[key] as readonly string[]).includes(value)) return
    preferences.value = { ...preferences.value, [key]: value }
    write(PREFERENCES_KEY, JSON.stringify(preferences.value))
  }

  function resetPreferences() {
    preferences.value = { ...DEFAULT_FORTRESS_PREFERENCES }
    textSpeed.value = 'normal'
    write(PREFERENCES_KEY, JSON.stringify(preferences.value))
    write(SPEED_KEY, 'normal')
  }

  function awardAchievements(next: FortressRun) {
    const won = new Set(
      next.reports
        .flatMap((report) => report.quests)
        .filter((quest) => quest.tier === 'success' || quest.tier === 'triumph')
        .map((quest) => quest.questId),
    )
    if (!won.size) return
    const achievements = useAchievementStore()
    void achievements.rewardAchievementByCode(
      'emperor-of-dust-orders-carried-out',
    )
    const ids = [...won]
    if (
      DAY_ONE_PETITIONS.every((prefix) =>
        ids.some((id) => id.startsWith(prefix)),
      )
    )
      void achievements.rewardAchievementByCode(
        'emperor-of-dust-day-well-ruled',
      )
    if (KIND_ORDERS.every((id) => won.has(id)))
      void achievements.rewardAchievementByCode(
        'emperor-of-dust-merciful-court',
      )
  }

  function load() {
    if (loaded.value) return
    if (!storage()) writeWarning.value = BLOCKED
    const rawRelics = read(RELIC_KEY)
    const vault = decodeRelicVault(rawRelics ?? null)
    relicVaultUnreadable = rawRelics === undefined || (!!rawRelics && !vault)
    if (relicVaultUnreadable) hold(VAULT_HELD)
    relicVault.value = vault ?? emptyRelicVault()
    const speed = read(SPEED_KEY)
    textSpeed.value = TEXT_SPEEDS.find((entry) => entry === speed) ?? 'normal'
    preferences.value = parsePreferences(read(PREFERENCES_KEY))
    const rawCodex = read(CODEX_KEY)
    const savedCodex = decodeCodex(rawCodex ?? null)
    codexHeld = rawCodex === undefined || (!!rawCodex && !savedCodex)
    if (codexHeld) hold(CODEX_HELD)
    codex.value = savedCodex ?? emptyCodex()
    const raw = read(AUTO_KEY)
    const saved = decodeBook(raw ?? null)
    autosaveHeld = raw === undefined || (!!raw && !saved)
    if (autosaveHeld) hold(AUTOSAVE_HELD)
    const rawSlots = Array.from({ length: SLOT_COUNT }, (_, i) =>
      read(slotKey(i)),
    )
    slots.value = rawSlots.map((rawSlot) => decodeSlot(rawSlot ?? null))
    slotUnreadable.value = rawSlots.map(
      (rawSlot, i) => rawSlot === undefined || (!!rawSlot && !slots.value[i]),
    )
    book.value = saved ?? newBook(createRun(newSeed(), equippedRelics()))
    const untouched =
      !saved ||
      (saved.current.day === 1 &&
        !saved.current.audiencesHeard.length &&
        !saved.current.active.length)
    introOpen.value =
      read(INTRO_KEY) !== '1' && untouched && slots.value.every((slot) => !slot)
    loaded.value = true
    if (!raw) persist()
    absorbAllegiances()
    lastLearned.value = []
    void loadPlaybookLiveText('emperor-of-dust', FORTRESS_LIVE_TEXT).then(
      (changed) => {
        if (changed && book.value) book.value = { ...book.value }
      },
    )
  }

  function openIntro() {
    introOpen.value = true
  }

  function closeIntro() {
    introOpen.value = false
    write(INTRO_KEY, '1')
  }

  function current(): FortressRun {
    if (!loaded.value || !book.value) throw new Error('Load the fortress first')
    return book.value.current
  }

  function commit(next: FortressRun) {
    book.value = updateCurrent(book.value!, next)
    persist()
  }

  /** The player chose a run to replace an unreadable autosave with. */
  function releaseAutosave() {
    autosaveHeld = false
    release(AUTOSAVE_HELD)
  }

  function newRun() {
    if (!loaded.value) load()
    book.value = newBook(createRun(newSeed(), equippedRelics()))
    lastReport.value = null
    lastResponse.value = ''
    releaseAutosave()
    persist()
  }

  /** Answers a barracks talk; returns the beat it moves on to, if it goes on. */
  function talk(talkId: string, optionId: string): string | undefined {
    const result = chooseTalkOption(current(), talkId, optionId)
    lastResponse.value = result.response
    commit(result.run)
    absorbAllegiances()
    return result.next
  }

  /** Answers the audience; returns the beat it moves on to, if it goes on. */
  function answer(audienceId: string, optionId: string): string | undefined {
    const result = chooseAudienceOption(current(), audienceId, optionId)
    lastResponse.value = result.response
    commit(result.run)
    absorbAllegiances()
    return result.next
  }

  function preview(questId: string, party: string[], hourglass = false) {
    return previewQuest(
      current(),
      questId,
      party,
      codex.value.revealed,
      hourglass,
    )
  }

  function assign(questId: string, party: string[], hourglass = false) {
    commit(assignQuest(current(), questId, party, hourglass))
  }

  function withdraw(questId: string) {
    commit(withdrawQuest(current(), questId))
  }

  function finish() {
    const result = finishDay(current(), codex.value.revealed)
    remember(result.report.quests.flatMap((quest) => quest.revealedTraits))
    lastLearned.value = []
    book.value = recordDawn(book.value!, result.run)
    lastReport.value = result.report
    persist()
    awardAchievements(result.run)
    absorbAllegiances()
  }

  function rewind(toDay: number) {
    if (!book.value) throw new Error('Load the fortress first')
    book.value = rewindTo(book.value, toDay)
    lastReport.value = null
    persist()
  }

  /**
   * Allegiances revealed by a story flag join the persistent Codex. The ids
   * newly learned become the reveal moment the room shows next.
   */
  function absorbAllegiances() {
    const added = remember(allegiancesKnown(current()))
    if (added.length) lastLearned.value = [...lastLearned.value, ...added]
  }

  function dismissLearned() {
    lastLearned.value = []
  }

  function learn(flag: string) {
    commit(earnFlag(current(), flag))
    absorbAllegiances()
  }

  function hire(followerId: string) {
    commit(recruit(current(), followerId))
  }

  function buy(itemId: string) {
    commit(buyItem(current(), itemId))
  }

  function sell(itemId: string) {
    commit(sellItem(current(), itemId))
  }

  /** Treats a wounded follower; returns what happened, for the market to show. */
  function treat(followerId: string, kind: TreatmentKind): string {
    const result = treatFollower(current(), followerId, kind)
    commit(result.run)
    return result.text
  }

  function equip(
    followerId: string,
    slot: 'tool' | 'charm',
    itemId: string | null,
  ) {
    commit(equipItem(current(), followerId, slot, itemId))
  }

  function expandBarracks() {
    commit(upgradeBeds(current()))
  }

  function saveToSlot(slot: number, label: string) {
    if (!book.value || slot < 0 || slot >= SLOT_COUNT)
      throw new Error('No such slot')
    if (slotUnreadable.value[slot])
      throw new Error(
        'That slot could not be read, so it was not overwritten. Clear it first.',
      )
    const raw = encodeSlot(label, book.value, new Date())
    if (!write(slotKey(slot), raw))
      throw new Error('The save could not be written')
    slots.value[slot] = decodeSlot(raw)
  }

  function loadFromSlot(slot: number) {
    const record = decodeSlot(read(slotKey(slot)) ?? null)
    if (!record) throw new Error('That slot is empty or unreadable')
    book.value = record.book
    lastReport.value = null
    releaseAutosave()
    persist()
    absorbAllegiances()
    lastLearned.value = []
  }

  function clearSlot(slot: number) {
    try {
      storage()?.removeItem(slotKey(slot))
    } catch {
      writeWarning.value = 'That slot could not be cleared.'
      return
    }
    slots.value[slot] = null
    slotUnreadable.value[slot] = false
  }

  return {
    book,
    codex,
    lastLearned,
    dismissLearned,
    slots,
    slotUnreadable,
    loaded,
    introOpen,
    storageWarning,
    lastResponse,
    lastReport,
    relicVault,
    claimable,
    textSpeed,
    preferences,
    setPreference,
    resetPreferences,
    run,
    day,
    rewindableDays,
    load,
    newRun,
    answer,
    talk,
    preview,
    assign,
    withdraw,
    finish,
    rewind,
    learn,
    hire,
    buy,
    sell,
    treat,
    equip,
    expandBarracks,
    saveToSlot,
    loadFromSlot,
    clearSlot,
    claimRelic,
    setNextRelics,
    setTextSpeed,
    openIntro,
    closeIntro,
  }
})
