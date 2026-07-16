// utils/rulerHooked/applyEffects.ts
//
// The pure effects reducer (decks.md §6, data-model.md §8). The ONLY way content
// mutates a save. Additive + clamped for sliders/counters (mirrors the davinci
// server reducer server/utils/davinci.ts), never absolute, so effects compose and
// stay legible. Deterministic and side-effect-free: returns a new RunSave, never
// mutates the input, and records the applied effect into choiceLog as the audit
// trail (so a run reconstructs even if the card's authored effects later change).

import type { AxisKey, Card, Choice, Effect, RunSave } from '~/types/ruler-hooked'
import { AXIS_KEYS } from '~/types/ruler-hooked'

const clamp = (n: number, lo = 0, hi = 100): number =>
  Math.max(lo, Math.min(hi, n))

/** Deep-ish clone of a RunSave (plain JSON data — safe to structuredClone-lite). */
export function cloneSave(save: RunSave): RunSave {
  return JSON.parse(JSON.stringify(save)) as RunSave
}

function isAxis(key: string): key is AxisKey {
  return (AXIS_KEYS as readonly string[]).includes(key)
}

/** Apply one Effect to a save in place (caller owns the clone). */
export function applyEffect(save: RunSave, effect: Effect): void {
  if (effect.sliders) {
    for (const [axis, delta] of Object.entries(effect.sliders)) {
      if (delta == null || !isAxis(axis)) continue
      save.kingdomHealth[axis] = clamp((save.kingdomHealth[axis] ?? 0) + delta)
    }
  }
  if (effect.counters) {
    for (const [key, delta] of Object.entries(effect.counters)) {
      if (delta == null) continue
      save.counters[key] = (save.counters[key] ?? 0) + delta
    }
  }
  if (effect.regionOverride) {
    for (const [region, state] of Object.entries(effect.regionOverride)) {
      if (state == null) continue
      ;(save.regionOverrides as Record<string, string>)[region] = state
    }
  }
  if (effect.flags) {
    for (const f of effect.flags.set ?? []) save.flags[f] = true
    for (const f of effect.flags.clear ?? []) save.flags[f] = false
  }
  if (effect.grant) {
    for (const g of effect.grant) {
      const bucket = save.inventory.items // default; caller may re-bucket by RewardType
      if (!bucket.some((r) => r.slug === g.reward)) {
        bucket.push({ slug: g.reward, rarity: 'COMMON' })
      }
    }
  }
  if (effect.revoke) {
    save.inventory.items = save.inventory.items.filter(
      (r) => !effect.revoke!.includes(r.slug),
    )
    save.inventory.skills = save.inventory.skills.filter(
      (r) => !effect.revoke!.includes(r.slug),
    )
  }
  if (effect.arc) {
    const { start, advance, complete } = effect.arc
    if (start && !save.deckState.activeArcs[start]) {
      save.deckState.activeArcs[start] = { step: '', flags: {} }
    }
    if (advance) {
      // advance names the NEXT step id; find the owning arc and set its step.
      for (const arcId of Object.keys(save.deckState.activeArcs)) {
        const arc = save.deckState.activeArcs[arcId]
        if (arc) arc.step = advance
      }
    }
    if (complete) delete save.deckState.activeArcs[complete]
  }
  if (effect.ending) {
    save.endingKey = effect.ending
    save.status = 'COMPLETE'
  }
}

/**
 * Resolve a player's choice on a card: apply its effects, append the choiceLog
 * entry, and return a new save. Pure — the input save is never mutated.
 */
export function resolveChoice(
  save: RunSave,
  card: Card,
  choice: Choice,
): RunSave {
  const next = cloneSave(save)
  const effect: Effect = choice.effects ?? {}
  applyEffect(next, effect)
  next.choiceLog.push({
    turn: next.turnCount,
    cardId: card.id,
    prompt: card.title,
    choiceText: choice.text,
    effects: effect,
    resultText: choice.result,
  })
  if (!next.deckState.seenCardIds.includes(card.id)) {
    next.deckState.seenCardIds.push(card.id)
  }
  next.updatedAt = save.updatedAt // stamped by the caller/store, not game logic
  return next
}
