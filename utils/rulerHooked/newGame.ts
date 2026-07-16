// utils/rulerHooked/newGame.ts
//
// Fresh RunSave factory (data-model.md §3). Deterministic given the seed; the
// caller stamps createdAt/updatedAt (display metadata, never game logic).

import type { ContentBundle, RunSave } from '~/types/ruler-hooked'
import { AXIS_KEYS } from '~/types/ruler-hooked'

export interface NewGameOpts {
  saveId: string
  name: string
  seed: string
  rulerName: string
  honorific?: string
  stamp: string // ISO timestamp supplied by the caller (no Date.now in the engine)
}

export function createRun(bundle: ContentBundle, opts: NewGameOpts): RunSave {
  const kingdomHealth = Object.fromEntries(
    AXIS_KEYS.map((a) => [a, 50]),
  ) as RunSave['kingdomHealth']

  // The free-draw bag = every non-arc card id (informational; select() reads the
  // deck directly, but the bag is part of the serialized schema).
  const drawBag = bundle.decks.flatMap((d) => d.cards.map((c) => c.id))

  return {
    schemaVersion: 3,
    saveId: opts.saveId,
    name: opts.name,
    dreamSlug: 'ruler-hooked',
    contentVersion: bundle.contentVersion,
    seed: opts.seed,
    status: 'ACTIVE',
    ruler: { name: opts.rulerName, honorific: opts.honorific, cosmetics: {} },
    turnCount: 0,
    cyclePosition: 0,
    kingdomHealth,
    counters: { fishCaught: 0, cardsResolved: 0 },
    regionStates: {},
    regionOverrides: {},
    deckState: { seenCardIds: [], activeArcs: {}, cooldowns: {}, drawBag },
    inventory: { skills: [], items: [] },
    choiceLog: [],
    flags: {},
    endingKey: null,
    createdAt: opts.stamp,
    updatedAt: opts.stamp,
  }
}
