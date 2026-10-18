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
import { decodeRelicVault } from '~/utils/emperorOfDust/relics'

// Emperor of Dust v0.3 (Fortress). Runs alongside the v0.2 store until the
// fortress UI replaces the pilot page (emperor-of-dust/t-020).
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

  const run = computed<FortressRun | null>(() => book.value?.current ?? null)
  const day = computed(() => run.value?.day ?? 1)
  const rewindableDays = computed(() =>
    (book.value?.dawns ?? []).map((dawn) => dawn.day),
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
    return decodeRelicVault(read(RELIC_KEY))?.nextLoadout ?? []
  }

  function load() {
    if (loaded.value) return
    if (!storage())
      storageWarning.value =
        'Browser storage is blocked. This run may not persist.'
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
  }

  function rewind(toDay: number) {
    if (!book.value) throw new Error('Load the fortress first')
    book.value = rewindTo(book.value, toDay)
    lastReport.value = null
    persist()
  }

  /** Conversation flags; reveals any allegiance trait they unlock. */
  function learn(flag: string) {
    commit(earnFlag(current(), flag))
    const unlocked = FOLLOWERS.flatMap((def) => def.traits)
      .filter((trait) => trait.revealFlag === flag)
      .map((trait) => trait.id)
    const merged = mergeCodex(codex.value, unlocked)
    if (merged !== codex.value) {
      codex.value = merged
      persistCodex()
    }
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
  }
})
