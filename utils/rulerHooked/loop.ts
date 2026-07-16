// utils/rulerHooked/loop.ts
//
// The pure turn loop (data-model.md §5). Keeps ALL game logic framework-free so
// the Pinia store is a thin wrapper and the loop is testable headlessly. One turn:
// fish beat → maybe an arc step, else maybe an interrupt/ambient draw → present a
// card (or none). Applying the chosen effect is resolveChoice() (applyEffects.ts).
//
// No wall-clock anywhere: turnCount is the only progression counter and time-of-day
// is derived from it.

import type { Card, ContentBundle, RunSave } from '~/types/ruler-hooked'
import type { RngStream } from './seed'
import { cloneSave } from './applyEffects'
import { cyclePosition } from './compositor'
import { selectCard, tickCooldowns } from './select'
import { triggerHolds } from './triggers'

export interface TurnResult {
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

/**
 * Advance one turn. Priority: (1) a pending active-arc step, (2) starting a newly
 * eligible arc, (3) a seeded interrupt/ambient draw, else pure fishing. Returns a
 * new save (input untouched) plus the card to present, if any.
 */
export function takeTurn(
  bundle: ContentBundle,
  save: RunSave,
  rng: RngStream,
  interruptChance = 0.6,
): TurnResult {
  const next = cloneSave(save)

  // 1. Fish beat — the cosmetic, always-valid heartbeat.
  next.turnCount += 1
  next.cyclePosition = cyclePosition(next.turnCount)
  next.counters.fishCaught = (next.counters.fishCaught ?? 0) + (rng.next() < 0.5 ? 1 : 0)
  tickCooldowns(next)

  const seen = new Set(next.deckState.seenCardIds)

  // 2. A pending active-arc step (arcs resolve before free draws).
  for (const arcId of Object.keys(next.deckState.activeArcs)) {
    const step = next.deckState.activeArcs[arcId]?.step
    if (step && !seen.has(step)) {
      const found = findArcStep(bundle, step)
      if (found) return { save: next, card: found.card, arcId }
    }
  }

  // 3. Start a newly eligible arc (seeded chance), presenting its first step.
  for (const arc of bundle.arcs) {
    if (next.deckState.activeArcs[arc.id]) continue // already active
    // completed arcs leave no active entry but their steps are in seenCardIds
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

  // 4. A free interrupt/ambient draw (seeded, may be null → pure fishing).
  const card = selectCard(next, allDeckCards(bundle), rng, interruptChance)
  if (card && card.trigger?.cooldown) {
    next.deckState.cooldowns[card.id] = card.trigger.cooldown
  }
  return { save: next, card }
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
