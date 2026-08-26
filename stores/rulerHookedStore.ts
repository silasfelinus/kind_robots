// stores/rulerHookedStore.ts
//
// The Ruler Hooked playthrough store. A thin Pinia setup-store over the verified
// framework-free engine: active RunSave + current card + current fishing encounter,
// persisted through the localStorage SaveStore.

import { defineStore } from 'pinia'
import { RULER_HOOKED_CONTENT as BUNDLE } from '~/utils/rulerHooked/content'
import { createRun } from '~/utils/rulerHooked/newGame'
import { advanceAfterFishingAttempt, takeTurn, eligibleEnding } from '~/utils/rulerHooked/loop'
import { resolveChoice, applyEffect, cloneSave } from '~/utils/rulerHooked/applyEffects'
import { resolveScene } from '~/utils/rulerHooked/compositor'
import { makeRng } from '~/utils/rulerHooked/seed'
import {
  applyFishingAction,
  fishingEncounterFinished,
  startFishingEncounter,
  type FishingAction,
  type FishingEncounter,
} from '~/utils/rulerHooked/encounter'
import {
  loadIndex, loadSave, writeSave, renameSlot as renameSlotStore,
  deleteSlot as deleteSlotStore, setActive, makeSaveId,
} from '~/utils/rulerHooked/save'
import type { Card, CatchResult, RunSave, SaveSlotMeta } from '~/types/ruler-hooked'

const nowStamp = (): string => new Date().toISOString()

export const useRulerHookedStore = defineStore('rulerHooked', () => {
  const bundle = BUNDLE
  const save = ref<RunSave | null>(null)
  const activeCard = ref<Card | null>(null)
  const activeArcId = ref<string | null>(null)
  const pendingEnding = ref<string | null>(null)
  const activeFishing = ref<FishingEncounter | null>(null)
  const lastCatch = ref<CatchResult | null>(null)
  const lastEscape = ref<{ fishName: string; cue: string } | null>(null)
  const slots = ref<SaveSlotMeta[]>([])

  const scene = computed(() =>
    save.value ? resolveScene(save.value, bundle.regions) : null,
  )
  const canFish = computed(
    () => !!save.value
      && !activeCard.value
      && !activeFishing.value
      && !pendingEnding.value
      && save.value.status === 'ACTIVE',
  )

  function refreshSlots() {
    slots.value = loadIndex().slots
  }

  function clearTransientPlayState() {
    activeCard.value = null
    activeArcId.value = null
    pendingEnding.value = null
    activeFishing.value = null
    lastCatch.value = null
    lastEscape.value = null
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
    clearTransientPlayState()
    writeSave(run, stamp)
    refreshSlots()
  }

  function loadSlot(saveId: string) {
    const s = loadSave(saveId)
    if (!s) return
    save.value = s
    clearTransientPlayState()
    setActive(saveId)
    refreshSlots()
  }

  /** Select a deterministic fish and enter its beat-based encounter. */
  function startFishing() {
    if (!save.value || !canFish.value) return
    lastCatch.value = null
    lastEscape.value = null
    activeFishing.value = startFishingEncounter(save.value)
  }

  /** Apply one player beat. Terminal outcomes immediately advance the reign turn. */
  function fishingAction(action: FishingAction) {
    if (!save.value || !activeFishing.value) return
    const nextEncounter = applyFishingAction(activeFishing.value, action)
    activeFishing.value = nextEncounter
    if (!fishingEncounterFinished(nextEncounter)) return

    const narrativeRng = makeRng(`${save.value.seed}:${save.value.turnCount}`)
    if (nextEncounter.phase === 'LANDED') {
      const result = takeTurn(bundle, save.value, narrativeRng)
      save.value = result.save
      lastCatch.value = result.catch
      lastEscape.value = null
      activeCard.value = result.card
      activeArcId.value = result.arcId ?? null
    } else {
      const result = advanceAfterFishingAttempt(bundle, save.value, narrativeRng)
      save.value = result.save
      lastCatch.value = null
      lastEscape.value = { fishName: nextEncounter.fishName, cue: nextEncounter.cue }
      activeCard.value = result.card
      activeArcId.value = result.arcId ?? null
    }
    activeFishing.value = null
    persist()
  }

  /** Resolve the active card's choice; offer an ending if one is now reachable. */
  function choose(choiceId: string) {
    if (!save.value || !activeCard.value) return
    const card = activeCard.value
    const choice = card.choices.find((c) => c.id === choiceId)
    if (!choice) return
    const next = resolveChoice(save.value, card, choice)
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
    pendingEnding.value = null
  }

  function renameSlot(saveId: string, name: string) {
    renameSlotStore(saveId, name)
    if (save.value?.saveId === saveId) save.value.name = name
    refreshSlots()
  }

  function deleteSlot(saveId: string) {
    deleteSlotStore(saveId)
    if (save.value?.saveId === saveId) {
      save.value = null
      clearTransientPlayState()
    }
    refreshSlots()
  }

  function persist() {
    if (save.value) writeSave(save.value, nowStamp())
    refreshSlots()
  }

  return {
    bundle, save, activeCard, activeArcId, pendingEnding, activeFishing,
    lastCatch, lastEscape, slots, scene, canFish,
    init, newGame, loadSlot, startFishing, fishingAction, choose,
    acceptEnding, declineEnding, renameSlot, deleteSlot, refreshSlots,
  }
})
