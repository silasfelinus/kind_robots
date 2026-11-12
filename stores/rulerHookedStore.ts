// stores/rulerHookedStore.ts
//
// The Ruler Hooked playthrough store. A thin Pinia setup-store over the verified
// framework-free engine: active RunSave + current card + current fishing encounter,
// persisted through the localStorage SaveStore.

import { defineStore } from 'pinia'
import { RULER_HOOKED_CONTENT as BUNDLE } from '~/utils/rulerHooked/content'
import { createRun } from '~/utils/rulerHooked/newGame'
import {
  advanceAfterFishingAttempt,
  takeTurn,
  eligibleEnding,
  dismissedFinaleFlag,
} from '~/utils/rulerHooked/loop'
import {
  resolveChoice,
  applyEffect,
  cloneSave,
} from '~/utils/rulerHooked/applyEffects'
import { cycleTime, resolveScene } from '~/utils/rulerHooked/compositor'
import { makeRng } from '~/utils/rulerHooked/seed'
import {
  startFishingEncounter,
  applyFishingStop,
  fishingEncounterFinished,
  type FishingEncounter,
} from '~/utils/rulerHooked/encounter'
import {
  applySimpleFishingStop,
  applySimpleReel,
  simpleFishingFinished,
  startSimpleFishing,
  type SimpleFishingEncounter,
  type ReelInput,
} from '~/utils/rulerHooked/simpleFishing'
import {
  loadIndex,
  loadSave,
  writeSave,
  renameSlot as renameSlotStore,
  deleteSlot as deleteSlotStore,
  setActive,
  makeSaveId,
} from '~/utils/rulerHooked/save'
import {
  putPortrait,
  deletePortrait,
  makePortraitId,
} from '~/utils/rulerHooked/portraitStore'
import { HERO_RULER_PRESET_ID } from '~/utils/rulerHooked/rulerPresets'
import { GEAR_CATALOG, KINGDOM_CATALOG } from '~/utils/rulerHooked/economy'
import {
  ADVISOR_CHARACTER_SLUG,
  currentAdvisorLine,
  type AdvisorLine,
} from '~/utils/rulerHooked/advisor'
import {
  dayNumber,
  hearProclamation as hearProclamationFor,
  pendingProclamation,
} from '~/utils/rulerHooked/dailyEvents'
import {
  learn as learnLesson,
  skipAll as skipAllLessons,
} from '~/utils/rulerHooked/tutorial'
import {
  rulerHookedCatchDeeds,
  rulerHookedChoiceDeeds,
  rulerHookedEndingDeeds,
} from '~/utils/rulerHooked/achievements'
import { useAchievementStore } from './achievementStore'
import type {
  Card,
  CatchResult,
  CharacterRef,
  RunSave,
  SaveSlotMeta,
} from '~/types/ruler-hooked'

const nowStamp = (): string => new Date().toISOString()

/** Site achievements, awarded at the deed (never from init or loadSlot). */
function award(codes: readonly string[]) {
  if (!codes.length) return
  const achievements = useAchievementStore()
  for (const code of codes) void achievements.rewardAchievementByCode(code)
}

export const useRulerHookedStore = defineStore('rulerHooked', () => {
  const bundle = BUNDLE
  const save = ref<RunSave | null>(null)
  const activeCard = ref<Card | null>(null)
  const activeArcId = ref<string | null>(null)
  const pendingEnding = ref<string | null>(null)
  const activeFishing = ref<SimpleFishingEncounter | null>(null)
  const activeClassicFishing = ref<FishingEncounter | null>(null)
  const lastCatch = ref<CatchResult | null>(null)
  const lastEscape = ref<{ fishName: string; cue: string } | null>(null)
  const slots = ref<SaveSlotMeta[]>([])

  const scene = computed(() =>
    save.value ? resolveScene(save.value, bundle.regions) : null,
  )
  /** Today's unheard Town Crier proclamation (dailyEvents.ts), if any. */
  const proclamation = computed(() => pendingProclamation(save.value))
  const day = computed(() => (save.value ? dayNumber(save.value) : 1))
  const timeOfDay = computed(() => cycleTime(save.value?.turnCount ?? 0))

  const canFish = computed(
    () =>
      !!save.value &&
      !proclamation.value &&
      !activeCard.value &&
      !activeFishing.value &&
      !pendingEnding.value &&
      save.value.status === 'ACTIVE',
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
    activeClassicFishing.value = null
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
    award(
      customPortraitId
        ? ['ruler-hooked-crowned', 'ruler-hooked-own-face']
        : ['ruler-hooked-crowned'],
    )
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
    if (customPortraitId) award(['ruler-hooked-own-face'])
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
  function startFishing(mode: 'classic' | 'quiz' = 'classic') {
    if (!save.value || !canFish.value) return
    lastCatch.value = null
    lastEscape.value = null
    activeFishing.value = startSimpleFishing(save.value)
    activeClassicFishing.value =
      mode === 'classic' ? startFishingEncounter(save.value) : null
  }

  /** One input on every beat: the visual stop bar resolves reel/slack/wait.
   * The canonical encounter preserves species-specific behavior, rarity,
   * gear bonuses and deterministic recorded stop positions. */
  function classicStop(position: number) {
    if (!activeClassicFishing.value || !activeFishing.value) return
    const next = applyFishingStop(activeClassicFishing.value, position)
    activeClassicFishing.value = next
    if (!fishingEncounterFinished(next)) return
    activeClassicFishing.value = null
    advanceFishing({
      ...activeFishing.value,
      stage: next.phase === 'LANDED' ? 'LANDED' : 'ESCAPED',
      progress: next.progress,
      tension: next.tension,
      cue: next.cue,
    })
  }

  /**
   * Apply one player beat from the sliding-marker timing bar. `position` is
   * the 0-100 stop the player recorded; applyFishingStop resolves it into an
   * action + quality against the beat's own timing profile. Terminal
   * outcomes immediately advance the reign turn.
   */
  function fishingStop(position: number) {
    if (!activeFishing.value) return
    advanceFishing(applySimpleFishingStop(activeFishing.value, position))
  }

  function reelFishing(action: ReelInput) {
    if (!activeFishing.value) return
    advanceFishing(applySimpleReel(activeFishing.value, action))
  }

  /** A correctly answered learning challenge lands the selected fish through the
   * same turn/reward/quest transition as the classic reeling minigame. */
  function landQuizFish() {
    if (!activeFishing.value || !save.value) return
    advanceFishing({
      ...activeFishing.value,
      stage: 'LANDED',
      progress: 100,
      cue: 'Knowledge hooked it. The fish is yours!',
    })
  }

  function advanceFishing(nextEncounter: SimpleFishingEncounter) {
    if (!save.value) return
    activeFishing.value = nextEncounter
    if (!simpleFishingFinished(nextEncounter)) return
    const narrativeRng = makeRng(`${save.value.seed}:${save.value.turnCount}`)
    if (nextEncounter.stage === 'LANDED') {
      const before = save.value
      const result = takeTurn(bundle, save.value, narrativeRng)
      award(rulerHookedCatchDeeds(before, result.save, result.catch))
      save.value = result.save
      lastCatch.value = result.catch
      lastEscape.value = null
      activeCard.value = result.card
      activeArcId.value = result.arcId ?? null
    } else {
      const result = advanceAfterFishingAttempt(
        bundle,
        save.value,
        narrativeRng,
      )
      save.value = result.save
      lastCatch.value = null
      lastEscape.value = {
        fishName: nextEncounter.fishName,
        cue: nextEncounter.cue,
      }
      activeCard.value = result.card
      activeArcId.value = result.arcId ?? null
    }
    activeFishing.value = null
    activeClassicFishing.value = null
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
    award(rulerHookedChoiceDeeds(choice.effects))
  }

  function acceptEnding() {
    if (!save.value || !pendingEnding.value) return
    const endingKey = pendingEnding.value
    const next = cloneSave(save.value)
    applyEffect(next, { ending: endingKey })
    save.value = next
    pendingEnding.value = null
    persist()
    award(rulerHookedEndingDeeds(endingKey))
  }

  function declineEnding() {
    if (!save.value || !pendingEnding.value) return
    const next = cloneSave(save.value)
    next.flags[dismissedFinaleFlag(pendingEnding.value)] = true
    save.value = next
    pendingEnding.value = null
    persist()
    award(['ruler-hooked-one-more-cast'])
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

  const coins = computed(() => save.value?.counters.coins ?? 0)

  /**
   * Spend coins on a permanent gear upgrade (ruler-hooked/t-029). Both the
   * spend and the flag grant go through the existing closed Effect
   * reducer (applyEffects.ts) -- no bespoke shop mutation path. A no-op if
   * the item is unknown, already owned, or unaffordable; the shop UI
   * disables the button in those cases, this is the authoritative guard.
   */
  function purchaseGear(itemId: string) {
    if (!save.value) return
    const item = GEAR_CATALOG.find((g) => g.id === itemId)
    if (!item) return
    if (save.value.flags[item.flagKey]) return
    if (coins.value < item.cost) return
    const next = cloneSave(save.value)
    applyEffect(next, {
      counters: { coins: -item.cost },
      flags: { set: [item.flagKey] },
    })
    next.updatedAt = nowStamp()
    save.value = next
    persist()
    award(['ruler-hooked-tackle-shop'])
  }

  /** Spend coins on a kingdom investment: moves the real kingdomHealth
   *  sliders (Silas: "wire it to the existing kingdom-health model rather
   *  than a parallel currency"), via the same Effect reducer. Repeatable
   *  -- unlike gear, a kingdom item may be bought again for another dose. */
  function purchaseKingdomItem(itemId: string) {
    if (!save.value) return
    const item = KINGDOM_CATALOG.find((k) => k.id === itemId)
    if (!item) return
    if (coins.value < item.cost) return
    const next = cloneSave(save.value)
    applyEffect(next, {
      counters: { coins: -item.cost },
      sliders: item.sliders,
    })
    next.updatedAt = nowStamp()
    save.value = next
    persist()
  }

  /** Hear the Town Crier: one small nudge, once per in-game day. */
  function hearProclamation() {
    if (!save.value || !proclamation.value) return
    const next = hearProclamationFor(save.value)
    next.updatedAt = nowStamp()
    save.value = next
    persist()
  }

  function learnTutorial(id: string) {
    if (!save.value) return
    learnLesson(save.value, id)
    persist()
  }

  function skipTutorial() {
    if (!save.value) return
    skipAllLessons(save.value)
    persist()
  }

  return {
    proclamation,
    day,
    timeOfDay,
    hearProclamation,
    learnTutorial,
    skipTutorial,
    bundle,
    save,
    activeCard,
    activeArcId,
    pendingEnding,
    activeFishing,
    activeClassicFishing,
    lastCatch,
    lastEscape,
    slots,
    scene,
    canFish,
    coins,
    advisorCharacter,
    advisorLine,
    showOpening,
    init,
    newGame,
    updateCosmetics,
    loadSlot,
    startFishing,
    classicStop,
    fishingStop,
    reelFishing,
    landQuizFish,
    choose,
    acceptEnding,
    declineEnding,
    dismissOpening,
    renameSlot,
    deleteSlot,
    refreshSlots,
    purchaseGear,
    purchaseKingdomItem,
  }
})
