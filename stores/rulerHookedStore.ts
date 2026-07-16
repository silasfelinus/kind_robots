// stores/rulerHookedStore.ts
//
// The Ruler Hooked playthrough store (data-model.md §8). A thin Pinia setup-store
// over the verified framework-free engine (utils/rulerHooked/*): it holds the
// active RunSave + current card, drives the turn loop, and persists via the
// localStorage SaveStore. All game logic lives in the engine; this is UI glue.

import { defineStore } from 'pinia'
import { RULER_HOOKED_CONTENT as BUNDLE } from '~/utils/rulerHooked/content'
import { createRun } from '~/utils/rulerHooked/newGame'
import { takeTurn, eligibleEnding } from '~/utils/rulerHooked/loop'
import { resolveChoice, applyEffect, cloneSave } from '~/utils/rulerHooked/applyEffects'
import { resolveScene } from '~/utils/rulerHooked/compositor'
import { makeRng } from '~/utils/rulerHooked/seed'
import {
  loadIndex, loadSave, writeSave, renameSlot as renameSlotStore,
  deleteSlot as deleteSlotStore, setActive, makeSaveId,
} from '~/utils/rulerHooked/save'
import type { Card, RunSave, SaveSlotMeta } from '~/types/ruler-hooked'

const nowStamp = (): string => new Date().toISOString()

export const useRulerHookedStore = defineStore('rulerHooked', () => {
  const bundle = BUNDLE
  const save = ref<RunSave | null>(null)
  const activeCard = ref<Card | null>(null)
  const activeArcId = ref<string | null>(null)
  const pendingEnding = ref<string | null>(null)
  const slots = ref<SaveSlotMeta[]>([])

  const scene = computed(() =>
    save.value ? resolveScene(save.value, bundle.regions) : null,
  )
  const canFish = computed(
    () => !!save.value && !activeCard.value && !pendingEnding.value && save.value.status === 'ACTIVE',
  )

  function refreshSlots() {
    slots.value = loadIndex().slots
  }

  /** Load the last active slot (or leave null for the title screen). */
  function init() {
    refreshSlots()
    const idx = loadIndex()
    if (idx.activeSaveId) {
      const s = loadSave(idx.activeSaveId)
      if (s) save.value = s
    }
  }

  function newGame(name: string, rulerName: string, honorific = 'Ruler') {
    const stamp = nowStamp()
    const saveId = makeSaveId(stamp, rulerName + slots.value.length)
    const run = createRun(bundle, {
      saveId,
      name: name || `${honorific} ${rulerName}'s reign`,
      seed: `${rulerName}-${saveId}`,
      rulerName,
      honorific,
      stamp,
    })
    save.value = run
    activeCard.value = null
    pendingEnding.value = null
    writeSave(run, stamp)
    refreshSlots()
  }

  function loadSlot(saveId: string) {
    const s = loadSave(saveId)
    if (!s) return
    save.value = s
    activeCard.value = null
    pendingEnding.value = null
    setActive(saveId)
    refreshSlots()
  }

  /** Advance one turn: present a card if one fires, else it's a quiet catch. */
  function fish() {
    if (!save.value || !canFish.value) return
    const rng = makeRng(`${save.value.seed}:${save.value.turnCount}`)
    const result = takeTurn(bundle, save.value, rng)
    save.value = result.save
    activeCard.value = result.card
    activeArcId.value = result.arcId ?? null
    persist()
  }

  /** Resolve the active card's choice; offer an ending if one is now reachable. */
  function choose(choiceId: string) {
    if (!save.value || !activeCard.value) return
    const card = activeCard.value
    const choice = card.choices.find((c) => c.id === choiceId)
    if (!choice) return
    let next = resolveChoice(save.value, card, choice)
    next.counters.cardsResolved = (next.counters.cardsResolved ?? 0) + 1
    save.value = next
    activeCard.value = null
    activeArcId.value = null
    const ending = eligibleEnding(bundle, next)
    if (ending && next.status !== 'COMPLETE') pendingEnding.value = ending
    persist()
  }

  function acceptEnding() {
    if (!save.value || !pendingEnding.value) return
    const next = cloneSave(save.value)
    applyEffect(next, { ending: pendingEnding.value })
    save.value = next
    pendingEnding.value = null
    persist()
  }
  function declineEnding() {
    pendingEnding.value = null // reachable, never forced
  }

  function renameSlot(saveId: string, name: string) {
    renameSlotStore(saveId, name)
    if (save.value?.saveId === saveId) save.value.name = name
    refreshSlots()
  }
  function deleteSlot(saveId: string) {
    deleteSlotStore(saveId)
    if (save.value?.saveId === saveId) save.value = null
    refreshSlots()
  }

  function persist() {
    if (save.value) writeSave(save.value, nowStamp())
    refreshSlots()
  }

  return {
    bundle, save, activeCard, activeArcId, pendingEnding, slots,
    scene, canFish,
    init, newGame, loadSlot, fish, choose, acceptEnding, declineEnding,
    renameSlot, deleteSlot, refreshSlots,
  }
})
