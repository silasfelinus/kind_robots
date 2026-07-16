// utils/rulerHooked/select.ts
//
// The seeded card-selection engine (decks.md §5). Deterministic given the save's
// RNG stream, so "replay variety" and "reload parity" are the same mechanism.
// Pure over (save, cards, rng); rng is advanced as draws are made.

import type { Card, RunSave } from '~/types/ruler-hooked'
import type { RngStream } from './seed'
import { effectiveWeight, triggerHolds } from './triggers'

/** Cards eligible to fire this turn: trigger holds, not on cooldown, and — if
 *  `once` — not already seen. Arc-step cards are excluded (they fire via arcs). */
export function eligiblePool(save: RunSave, cards: Card[]): Card[] {
  const seen = new Set(save.deckState.seenCardIds)
  return cards.filter((c) => {
    if (c.kind === 'arc-step') return false
    if (c.once && seen.has(c.id)) return false
    if ((save.deckState.cooldowns[c.id] ?? 0) > 0) return false
    return triggerHolds(save, c.trigger)
  })
}

/** Seeded weighted pick from a non-empty pool. Returns null for an empty pool. */
export function weightedPick(
  save: RunSave,
  pool: Card[],
  rng: RngStream,
): Card | null {
  if (pool.length === 0) return null
  const weights = pool.map((c) => effectiveWeight(save, c.trigger, c.weight ?? 1))
  const total = weights.reduce((a, b) => a + b, 0)
  if (total <= 0) return null
  let roll = rng.next() * total
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i] ?? 0
    if (roll < 0) return pool[i] ?? null
  }
  return pool[pool.length - 1] ?? null
}

/**
 * Decide the card that fires this turn (or null for a pure-fishing turn).
 * `interruptChance` in [0,1] gates whether an interrupt is attempted at all.
 * Arc advancement is handled by the caller (it needs the arc catalog); this
 * function covers the free-draw interrupt/ambient path.
 */
export function selectCard(
  save: RunSave,
  cards: Card[],
  rng: RngStream,
  interruptChance = 0.5,
): Card | null {
  if (rng.next() >= interruptChance) return null
  const pool = eligiblePool(save, cards)
  return weightedPick(save, pool, rng)
}

/** Decrement all per-card cooldowns by one turn (never below zero). */
export function tickCooldowns(save: RunSave): void {
  for (const id of Object.keys(save.deckState.cooldowns)) {
    save.deckState.cooldowns[id] = Math.max(0, (save.deckState.cooldowns[id] ?? 0) - 1)
  }
}
