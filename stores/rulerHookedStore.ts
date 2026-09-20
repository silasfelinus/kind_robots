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
  applyFishingStop,
  fishingEncounterFinished,
  startFishingEncounter,
  type FishingEncounter,
} from '~/utils/rulerHooked/encounter'
import {
  loadIndex, loadSave, writeSave, renameSlot as renameSlotStore,
  deleteSlot as deleteSlotStore, setActive, makeSaveId,
} from '~/utils/rulerHooked/save'
import {
  putPortrait, deletePortrait, makePortraitId,
} from '~/utils/rulerHooked/portraitStore'
import { HERO_RULER_PRESET_ID } from '~/utils/rulerHooked/rulerPresets'
import {
  ADVISOR_CHARACTER_SLUG, currentAdvisorLine, type AdvisorLine,
} from '~/utils/rulerHooked/advisor'
import type { Card, CatchResult, CharacterRef, RunSave, SaveSlotMeta } from '~/types/ruler-hooked'

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

  /** The standing advisor's Character record (ruler-hooked/t-028) -- present
   *  every reign, independent of which card/arc is active. */
  const advisorCharacter = computed<CharacterRef | undefined>(() =>
    bundle.characters.find((c) => c.slug === ADVISOR_CHARACTER_SLUG),
  )
  /** What the advisor is currently saying -- a pure function of save +
   *  transient play state, recomputed whenever any of it changes. */
  const advisorLine = computed<AdvisorLine | null>(() =>
    save.value
      ? currentAdvisorLine(bundle, save.value, {
          lastCatch: lastCatch.value,
          lastEscape: lastEscape.value,
          pendingEnding: pendingEnding.value,
        })
      : null,
  )
  /** Whether this reign's once-per-reign opening (t-028) still needs showing. */
  const showOpening = computed(() => !!save.value && !save.value.openingSeen)

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

  /**
   * `presetId` picks a ruler cosmetic preset (defaults to the hero preset);
   * `customPortraitFile` — when supplied — is downscaled and stored locally
   * (portraitStore.ts, IndexedDB) and takes priority over `presetId` for
   * display (t-021). A failed/unavailable portrait import (e.g. IndexedDB
   * blocked by a privacy setting) silently falls back to the preset instead
   * of blocking new-game creation.
   */
  async function newGame(
    name: string,
    rulerName: string,
    honorific = 'Ruler',
    opts: { presetId?: string; customPortraitFile?: File } = {},
  ) {
    const stamp = nowStamp()
    const saveId = makeSaveId(stamp, rulerName + slots.value.length)
    let customPortraitId: string | undefined
    if (opts.customPortraitFile) {
      const id = makePortraitId(`${saveId}:${opts.customPortraitFile.name}`)
      customPortraitId =
        (await putPortrait(opts.customPortraitFile, id)) ?? undefined
    }
    const run = createRun(bundle, {
      saveId,
      name: name || `${honorific} ${rulerName}'s reign`,
      seed: `${rulerName}-${saveId}`,
      rulerName,
      honorific,
      stamp,
      presetId: opts.presetId,
      customPortraitId,
    })
    save.value = run
    clearTransientPlayState()
    writeSave(run, stamp)
    refreshSlots()
  }

  /**
   * Change the active save's ruler cosmetics after creation ("cosmetic-only
   * by design, so there is no reason to lock them at creation" — t-021).
   * Replaces (rather than merges) any previous custom portrait, deleting the
   * old blob so switching presets/portraits repeatedly doesn't leak storage.
   */
  async function updateCosmetics(opts: {
    presetId?: string
    customPortraitFile?: File
  }) {
    if (!save.value) return
    const prevPortraitId = save.value.ruler.cosmetics?.customPortraitId
    let customPortraitId: string | undefined
    if (opts.customPortraitFile) {
      const id = makePortraitId(
        `${save.value.saveId}:${nowStamp()}:${opts.customPortraitFile.name}`,
      )
      customPortraitId =
        (await putPortrait(opts.customPortraitFile, id)) ?? undefined
    }
    save.value.ruler.cosmetics = {
      ...save.value.ruler.cosmetics,
      presetId:
        opts.presetId ??
        save.value.ruler.cosmetics?.presetId ??
        HERO_RULER_PRESET_ID,
      // Explicitly picking a preset (no new file) clears any prior custom
      // portrait so the preset actually takes visual effect.
      customPortraitId:
        customPortraitId ?? (opts.presetId ? undefined : prevPortraitId),
    }
    if (
      prevPortraitId &&
      prevPortraitId !== save.value.ruler.cosmetics.customPortraitId
    ) {
      void deletePortrait(prevPortraitId)
    }
    persist()
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

  /**
   * Apply one player beat from the sliding-marker timing bar. `position` is
   * the 0-100 stop the player recorded; applyFishingStop resolves it into an
   * action + quality against the beat's own timing profile. Terminal
   * outcomes immediately advance the reign turn.
   */
  function fishingStop(position: number) {
    if (!save.value || !activeFishing.value) return
    const nextEncounter = applyFishingStop(activeFishing.value, position)
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

  /** Mark this reign's opening as seen (t-028) -- skip or finish both call this. */
  function dismissOpening() {
    if (!save.value) return
    save.value.openingSeen = true
    persist()
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
    advisorCharacter, advisorLine, showOpening,
    init, newGame, updateCosmetics, loadSlot, startFishing, fishingStop, choose,
    acceptEnding, declineEnding, dismissOpening, renameSlot, deleteSlot, refreshSlots,
  }
})
