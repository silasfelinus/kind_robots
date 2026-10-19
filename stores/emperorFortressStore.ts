import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import {
  assignQuest,
  buyItem,
  chooseAudienceOption,
  createRun,
  earnFlag,
  equipItem,
  finishDay,
  previewQuest,
  recruit,
  upgradeBeds,
  withdrawQuest,
} from '~/utils/emperorOfDust/fortress/engine'
import { FOLLOWERS } from '~/utils/emperorOfDust/fortress/followers'
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

// Emperor of Dust v0.3 (Fortress), conductor SYSTEMS-V03.md.
export type TextSpeed = 'normal' | 'fast' | 'instant'
const TEXT_SPEEDS: readonly TextSpeed[] = ['normal', 'fast', 'instant']
const SPEED_KEY = 'kr-emperor-of-dust-text-speed'
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
const slotKey = (slot: number) => `kr-emperor-of-dust-fortress-slot-${slot}-v3`
const newSeed = (): number => Date.now() >>> 0 || 1

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
  const storageWarning = ref('')
  const lastResponse = ref('')
  const lastReport = ref<DawnReport | null>(null)
  const relicVault = ref<RelicVault>(emptyRelicVault())
  const textSpeed = ref<TextSpeed>('normal')
  let relicVaultUnreadable = false

  const run = computed<FortressRun | null>(() => book.value?.current ?? null)
  const day = computed(() => run.value?.day ?? 1)
  const rewindableDays = computed(() =>
    (book.value?.dawns ?? []).map((dawn) => dawn.day),
  )
  const claimable = computed(() =>
    run.value ? claimableRelics(run.value, relicVault.value) : [],
  )

  function write(key: string, value: string): boolean {
    const store = storage()
    if (!store) {
      storageWarning.value =
        'Browser storage is blocked. This run may not persist.'
      return false
    }
    try {
      store.setItem(key, value)
      return true
    } catch {
      storageWarning.value =
        'Local save unavailable or full. This session is not backed up.'
      return false
    }
  }

  function read(key: string): string | null {
    try {
      return storage()?.getItem(key) ?? null
    } catch {
      return null
    }
  }

  function persist() {
    if (!book.value) return
    if (write(AUTO_KEY, encodeBook(book.value))) storageWarning.value = ''
  }

  function persistCodex() {
    write(CODEX_KEY, JSON.stringify(codex.value))
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
    if (!storage())
      storageWarning.value =
        'Browser storage is blocked. This run may not persist.'
    const rawRelics = read(RELIC_KEY)
    const vault = decodeRelicVault(rawRelics)
    relicVaultUnreadable = !!rawRelics && !vault
    if (relicVaultUnreadable)
      storageWarning.value =
        'The relic vault could not be read. It was not overwritten.'
    relicVault.value = vault ?? emptyRelicVault()
    const speed = read(SPEED_KEY)
    textSpeed.value = TEXT_SPEEDS.find((entry) => entry === speed) ?? 'normal'
    const rawCodex = read(CODEX_KEY)
    codex.value = decodeCodex(rawCodex) ?? emptyCodex()
    const raw = read(AUTO_KEY)
    const saved = decodeBook(raw)
    if (raw && !saved) {
      storageWarning.value =
        'The autosave could not be read. It was not overwritten; start a new run or load a slot.'
    }
    slots.value = Array.from({ length: SLOT_COUNT }, (_, i) =>
      decodeSlot(read(slotKey(i))),
    )
    book.value = saved ?? newBook(createRun(newSeed(), equippedRelics()))
    loaded.value = true
    if (!raw) persist()
  }

  function current(): FortressRun {
    if (!loaded.value || !book.value) throw new Error('Load the fortress first')
    return book.value.current
  }

  function commit(next: FortressRun) {
    book.value = updateCurrent(book.value!, next)
    persist()
  }

  function newRun() {
    if (!loaded.value) load()
    book.value = newBook(createRun(newSeed(), equippedRelics()))
    lastReport.value = null
    lastResponse.value = ''
    persist()
  }

  function answer(audienceId: string, optionId: string) {
    const result = chooseAudienceOption(current(), audienceId, optionId)
    lastResponse.value = result.response
    commit(result.run)
    absorbAllegiances()
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
    const revealed = result.report.quests.flatMap(
      (quest) => quest.revealedTraits,
    )
    const merged = mergeCodex(codex.value, revealed)
    if (merged !== codex.value) {
      codex.value = merged
      persistCodex()
    }
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

  /** Conversation flags; reveals any allegiance trait they unlock. */
  /** Allegiances revealed by a story flag join the persistent Codex. */
  function absorbAllegiances() {
    const flags = current().flags
    const unlocked = FOLLOWERS.flatMap((def) => def.traits)
      .filter((trait) => trait.revealFlag && flags.includes(trait.revealFlag))
      .map((trait) => trait.id)
    const merged = mergeCodex(codex.value, unlocked)
    if (merged !== codex.value) {
      codex.value = merged
      persistCodex()
    }
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
    const raw = encodeSlot(label, book.value, new Date())
    if (!write(slotKey(slot), raw))
      throw new Error('The save could not be written')
    slots.value[slot] = decodeSlot(raw)
  }

  function loadFromSlot(slot: number) {
    const record = decodeSlot(read(slotKey(slot)))
    if (!record) throw new Error('That slot is empty or unreadable')
    book.value = record.book
    lastReport.value = null
    persist()
  }

  function clearSlot(slot: number) {
    try {
      storage()?.removeItem(slotKey(slot))
    } catch {
      storageWarning.value = 'That slot could not be cleared.'
      return
    }
    slots.value[slot] = null
  }

  return {
    book,
    codex,
    slots,
    loaded,
    storageWarning,
    lastResponse,
    lastReport,
    relicVault,
    claimable,
    textSpeed,
    run,
    day,
    rewindableDays,
    load,
    newRun,
    answer,
    preview,
    assign,
    withdraw,
    finish,
    rewind,
    learn,
    hire,
    buy,
    equip,
    expandBarracks,
    saveToSlot,
    loadFromSlot,
    clearSlot,
    claimRelic,
    setNextRelics,
    setTextSpeed,
  }
})
