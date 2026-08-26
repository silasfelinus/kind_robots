// utils/rulerHooked/loop.ts
//
// The pure turn loop (data-model.md §5). Keeps ALL game logic framework-free so
// the Pinia store is a thin wrapper and the loop is testable headlessly.
//
// Interactive fishing now resolves before the kingdom interruption. The legacy
// takeTurn() wrapper remains for headless tests and callers that want an automatic
// successful catch, while advanceAfterFishingAttempt() advances governance after
// either a landed or escaped interactive encounter.
//
// No wall-clock anywhere: turnCount is the only progression counter and time-of-day
// is derived from it.

import type { Card, CatchResult, ContentBundle, RunSave } from '~/types/ruler-hooked'
import { makeRng, type RngStream } from './seed'
import { cloneSave } from './applyEffects'
import { cyclePosition } from './compositor'
import { resolveFishingCatch } from './fish'
import { selectCard, tickCooldowns } from './select'
import { triggerHolds } from './triggers'

export interface TurnResult {
  save: RunSave
  catch: CatchResult
  card: Card | null
  arcId?: string
}

export interface KingdomTurnResult {
  save: RunSave
  card: Card | null
  arcId?: string
}

/** Find an arc-step card by id across all arcs in the bundle. */
export function findArcStep(bundle: ContentBundle, stepId: string): { card: Card; arcId: string } | null {
  for (const arc of bundle.arcs) {
    const card = arc.steps.find((s) => s.id === stepId)
    if (card) return { card, arcId: arc.id }
  }
  return null
}

/** Every free-draw card (non-arc) across all decks. */
export function allDeckCards(bundle: ContentBundle): Card[] {
  return bundle.decks.flatMap((d) => d.cards)
}

/** Resolve governance after the fishing attempt has already consumed the turn. */
function resolveNarrative(
  bundle: ContentBundle,
  next: RunSave,
  rng: RngStream,
  interruptChance = 0.6,
): KingdomTurnResult {
  tickCooldowns(next)
  const seen = new Set(next.deckState.seenCardIds)

  // 1. A pending active-arc step (arcs resolve before free draws).
  for (const arcId of Object.keys(next.deckState.activeArcs)) {
    const step = next.deckState.activeArcs[arcId]?.step
    if (step && !seen.has(step)) {
      const found = findArcStep(bundle, step)
      if (found) return { save: next, card: found.card, arcId }
    }
  }

  // 2. Start a newly eligible arc (seeded chance), presenting its first step.
  for (const arc of bundle.arcs) {
    if (next.deckState.activeArcs[arc.id]) continue
    if (arc.steps.some((s) => seen.has(s.id))) continue
    const trig = arc.start?.trigger
    if (!triggerHolds(next, trig)) continue
    const chance = trig?.chance ?? 1
    if (rng.next() >= chance) continue
    const first = arc.steps[0]
    if (!first) continue
    next.deckState.activeArcs[arc.id] = { step: first.id, flags: {} }
    return { save: next, card: first, arcId: arc.id }
  }

  // 3. A free interrupt/ambient draw (seeded, may be null → quiet fishing).
  const card = selectCard(next, allDeckCards(bundle), rng, interruptChance)
  if (card && card.trigger?.cooldown) {
    next.deckState.cooldowns[card.id] = card.trigger.cooldown
  }
  return { save: next, card }
}

/**
 * Consume one reign turn after an interactive fishing attempt, successful or not,
 * then resolve the normal kingdom interruption. No fish is recorded here.
 */
export function advanceAfterFishingAttempt(
  bundle: ContentBundle,
  save: RunSave,
  rng: RngStream,
  interruptChance = 0.6,
): KingdomTurnResult {
  const next = cloneSave(save)
  next.turnCount += 1
  next.cyclePosition = cyclePosition(next.turnCount)
  return resolveNarrative(bundle, next, rng, interruptChance)
}

/**
 * Compatibility wrapper for an automatic successful catch. Fishing uses a
 * turn-scoped child RNG derived from the run seed. Narrative draws keep the
 * caller-supplied RNG stream, so specimen math cannot perturb kingdom cards.
 */
export function takeTurn(
  bundle: ContentBundle,
  save: RunSave,
  rng: RngStream,
  interruptChance = 0.6,
): TurnResult {
  const next = cloneSave(save)
  const fishRng = makeRng(`${next.seed}:${next.turnCount}:fish`)

  next.turnCount += 1
  next.cyclePosition = cyclePosition(next.turnCount)
  const caught = resolveFishingCatch(next, fishRng)
  const narrative = resolveNarrative(bundle, next, rng, interruptChance)

  return {
    ...narrative,
    catch: caught,
  }
}

/**
 * After a choice is resolved (resolveChoice applied), check for a satisfied
 * ending and, if the run is not already COMPLETE, surface it. Endings are
 * reachable, never forced — the caller decides whether to present it.
 */
export function eligibleEnding(bundle: ContentBundle, save: RunSave): string | null {
  if (save.status === 'COMPLETE') return save.endingKey
  for (const ending of bundle.endings) {
    if (triggerHolds(save, ending.trigger)) return ending.outcomeKey
  }
  return null
}
