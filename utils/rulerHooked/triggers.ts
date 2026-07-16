// utils/rulerHooked/triggers.ts
//
// The closed trigger predicate evaluator (decks.md §3). Pure over a RunSave, with
// NO wall-clock input — turns only. Deliberately small and inspectable: numeric
// comparators over sliders/counters, set membership over flags/rewards/cardsSeen.
// `chance` is NOT evaluated here (it's a seeded roll owned by selection).

import type {
  NumericPredicate,
  RunSave,
  Trigger,
  TriggerClause,
} from '~/types/ruler-hooked'

export function numericHolds(value: number, pred: NumericPredicate): boolean {
  if (pred.gte !== undefined && !(value >= pred.gte)) return false
  if (pred.gt !== undefined && !(value > pred.gt)) return false
  if (pred.lte !== undefined && !(value <= pred.lte)) return false
  if (pred.lt !== undefined && !(value < pred.lt)) return false
  if (pred.eq !== undefined && !(value === pred.eq)) return false
  if (pred.neq !== undefined && !(value !== pred.neq)) return false
  return true
}

function ownedRewards(save: RunSave): Set<string> {
  const s = new Set<string>()
  for (const r of save.inventory.skills) s.add(r.slug)
  for (const r of save.inventory.items) s.add(r.slug)
  return s
}

/** True if EVERY condition in the clause holds against the save. */
export function clauseHolds(save: RunSave, clause: TriggerClause): boolean {
  if (clause.sliders) {
    for (const [axis, pred] of Object.entries(clause.sliders)) {
      if (!pred) continue
      if (!numericHolds(save.kingdomHealth[axis as never] ?? 0, pred)) return false
    }
  }
  if (clause.counters) {
    for (const [key, pred] of Object.entries(clause.counters)) {
      if (!numericHolds(save.counters[key] ?? 0, pred)) return false
    }
  }
  if (clause.flags) {
    for (const f of clause.flags) if (!save.flags[f]) return false
  }
  if (clause.rewards) {
    const owned = ownedRewards(save)
    for (const r of clause.rewards) if (!owned.has(r)) return false
  }
  if (clause.cardsSeen) {
    const seen = new Set(save.deckState.seenCardIds)
    for (const c of clause.cardsSeen) if (!seen.has(c)) return false
  }
  return true
}

/** True if ANY condition in the clause holds (used for `forbids`). */
export function clauseTouches(save: RunSave, clause: TriggerClause): boolean {
  if (clause.flags) {
    for (const f of clause.flags) if (save.flags[f]) return true
  }
  if (clause.cardsSeen) {
    const seen = new Set(save.deckState.seenCardIds)
    for (const c of clause.cardsSeen) if (seen.has(c)) return true
  }
  if (clause.rewards) {
    const owned = ownedRewards(save)
    for (const r of clause.rewards) if (owned.has(r)) return true
  }
  if (clause.sliders) {
    for (const [axis, pred] of Object.entries(clause.sliders)) {
      if (pred && numericHolds(save.kingdomHealth[axis as never] ?? 0, pred)) return true
    }
  }
  if (clause.counters) {
    for (const [key, pred] of Object.entries(clause.counters)) {
      if (numericHolds(save.counters[key] ?? 0, pred)) return true
    }
  }
  return false
}

/**
 * Whether a trigger is currently satisfied (ignoring `chance`, and ignoring the
 * per-card cooldown which selection tracks separately via deckState.cooldowns).
 */
export function triggerHolds(save: RunSave, trigger?: Trigger): boolean {
  if (!trigger) return true
  if (trigger.minTurn !== undefined && save.turnCount < trigger.minTurn) return false
  if (trigger.maxTurn !== undefined && save.turnCount > trigger.maxTurn) return false
  if (trigger.requires && !clauseHolds(save, trigger.requires)) return false
  if (trigger.forbids && clauseTouches(save, trigger.forbids)) return false
  return true
}

/** Effective draw weight including any satisfied situational bonus (decks.md §5). */
export function effectiveWeight(save: RunSave, trigger?: Trigger, base = 1): number {
  let w = base
  if (trigger?.weightBonus && clauseHolds(save, trigger.weightBonus.when)) {
    w += trigger.weightBonus.add
  }
  return Math.max(0, w)
}
