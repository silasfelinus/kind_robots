// utils/rulerHooked/console.selftest.ts
//
// Headless test of the illustrated console's pure layers (2026-11-05
// overhaul): daily proclamations, the situational tutorial, and the art
// library's fallback chains. Run via `npx tsx`, like the other selftests.

import assert from 'node:assert/strict'
import { createRun } from '~/utils/rulerHooked/newGame'
import { RULER_HOOKED_CONTENT as C } from '~/utils/rulerHooked/content'
import {
  CASTS_PER_DAY,
  DAILY_EVENTS,
  PROCLAMATION_COUNTER,
  dayNumber,
  eventForDay,
  hearProclamation,
  pendingProclamation,
} from '~/utils/rulerHooked/dailyEvents'
import {
  LESSONS,
  currentLesson,
  learn,
  lessonsRemaining,
  skipAll,
  type TutorialContext,
} from '~/utils/rulerHooked/tutorial'
import {
  BACKDROPS,
  TAB_ART,
  cardCandidates,
  characterCandidates,
  lakeBackdropCandidates,
  sceneVistaCandidates,
  vistaCandidates,
} from '~/utils/rulerHooked/artLibrary'
import { resolveScene } from '~/utils/rulerHooked/compositor'
import type { RunSave } from '~/types/ruler-hooked'

const fresh = (seed = 'console-seed'): RunSave =>
  createRun(C, {
    saveId: 'sv_console',
    name: 'Console',
    seed,
    rulerName: 'Mo',
    stamp: '2026-11-05T00:00:00Z',
  })

// --- daily proclamations ----------------------------------------------------

{
  const save = fresh()
  assert.equal(dayNumber(save), 1)
  assert.equal(dayNumber({ turnCount: CASTS_PER_DAY - 1 }), 1)
  assert.equal(dayNumber({ turnCount: CASTS_PER_DAY }), 2)

  const pending = pendingProclamation(save)
  assert.ok(pending, 'day one opens with a proclamation')
  assert.equal(pending.day, 1)

  // Deterministic: same seed + day, same event.
  assert.equal(eventForDay(save, 7).key, eventForDay(fresh(), 7).key)

  const heard = hearProclamation(save)
  assert.notEqual(heard, save, 'hearing returns a new save')
  assert.equal(heard.counters[PROCLAMATION_COUNTER], 1)
  assert.equal(pendingProclamation(heard), null, 'heard once per day')
  assert.equal(hearProclamation(heard), heard, 'hearing twice is a no-op')
  assert.equal(
    save.counters[PROCLAMATION_COUNTER] ?? 0,
    0,
    'original untouched',
  )

  // Nothing expires: skip several days, the current day's crier still waits.
  const later = { ...heard, turnCount: CASTS_PER_DAY * 4 + 2 }
  assert.equal(pendingProclamation(later)?.day, 5)

  // Every event is a small nudge, never a gate.
  for (const e of DAILY_EVENTS) {
    assert.ok(
      !e.effect.flags && !e.effect.arc && !e.effect.ending && !e.effect.grant,
      `${e.key} must not gate content`,
    )
    for (const v of Object.values(e.effect.sliders ?? {})) {
      assert.ok(Math.abs(v) <= 5, `${e.key} nudges, it does not swing`)
    }
  }

  // A completed reign has no crier.
  assert.equal(pendingProclamation({ ...save, status: 'COMPLETE' }), null)

  // Variety: a reign's first 30 days are not all the same proclamation.
  const keys = new Set(
    Array.from({ length: 30 }, (_, i) => eventForDay(save, i + 1).key),
  )
  assert.ok(keys.size >= 5, `expected variety, saw ${keys.size}`)
}

// --- tutorial ---------------------------------------------------------------

{
  const ctx = (over: Partial<TutorialContext> = {}): TutorialContext => ({
    screen: 'lake',
    fishing: false,
    hasCatch: false,
    hasPetition: false,
    hasProclamation: false,
    ...over,
  })
  const save = fresh()
  assert.equal(currentLesson(save, ctx({ hasProclamation: true }))?.id, 'crier')
  assert.equal(currentLesson(save, ctx())?.id, 'cast')
  learn(save, 'cast')
  assert.equal(
    currentLesson(save, ctx())?.id,
    undefined,
    'learned lessons do not repeat',
  )
  assert.equal(currentLesson(save, ctx({ fishing: true }))?.id, 'reel')
  assert.equal(currentLesson(save, ctx({ hasPetition: true }))?.id, 'petition')
  assert.equal(lessonsRemaining(save), LESSONS.length - 1)
  skipAll(save)
  assert.equal(
    currentLesson(save, ctx({ fishing: true })),
    null,
    'skip retires everything',
  )
  assert.equal(lessonsRemaining(save), 0)
  assert.equal(currentLesson(null, ctx()), null)
  assert.equal(
    new Set(LESSONS.map((l) => l.id)).size,
    LESSONS.length,
    'lesson ids unique',
  )
}

// --- art library ------------------------------------------------------------

{
  const save = fresh()
  const lake = lakeBackdropCandidates(save, 'day')
  assert.match(lake[0]!, /\/images\/ruler-hooked\/far_shore-[a-z]+-day\.webp$/)
  assert.ok(
    lake.includes('/images/ruler-hooked/lake-clear-day.webp'),
    'plain lake is the safety net',
  )
  assert.doesNotMatch(
    lake.join(' '),
    /\/ruler-(?!hooked)|key-art/,
    'first person: the ruler is never in the lake frame',
  )

  // t-054: a tyrant's lake tries the gallows shore and the poisoned water
  // first, then the shore the reign would show without the pin.
  const tyrant = fresh()
  tyrant.kingdomHealth = {
    ...tyrant.kingdomHealth,
    nature: 10,
    joy: 20,
    order: 92,
  }
  const scene = resolveScene(tyrant, C.regions)
  const grim = lakeBackdropCandidates(tyrant, 'day', scene)
  assert.equal(grim[0], '/images/ruler-hooked/far_shore-gallows-day.webp')
  assert.ok(grim.includes('/images/ruler-hooked/lake-poisoned-day.webp'))
  const under = scene.fallbackStates?.far_shore
  assert.ok(under && under !== 'gallows')
  assert.ok(
    grim.indexOf(`/images/ruler-hooked/far_shore-${under}-day.webp`) >
      grim.indexOf('/images/ruler-hooked/lake-poisoned-day.webp'),
  )
  assert.equal(grim.at(-1), '/images/ruler-hooked/lake-clear-day.webp')
  assert.deepEqual(
    lakeBackdropCandidates(tyrant, 'day'),
    lake,
    'without a scene the chain is unchanged',
  )
  const village = sceneVistaCandidates('village_edge', scene, 'day')
  assert.equal(
    village[0],
    '/images/ruler-hooked/village_edge-garrisoned-day.webp',
  )
  assert.ok(village.length > 1, 'the garrison falls back to the ramp state')

  assert.deepEqual(vistaCandidates('treeline', 'wild', 'dusk'), [
    '/images/ruler-hooked/treeline-wild-golden.webp',
    '/images/ruler-hooked/treeline-wild-night.webp',
    '/images/ruler-hooked/treeline-wild-day.webp',
  ])
  assert.deepEqual(vistaCandidates('lake', undefined, 'day'), [])

  for (const [key, list] of Object.entries(BACKDROPS)) {
    assert.ok(list.length >= 2, `${key} backdrop has a rendered fallback`)
  }
  for (const [key, list] of Object.entries(TAB_ART)) {
    assert.ok(list.length >= 2, `${key} tab has a rendered fallback`)
  }
  assert.deepEqual(characterCandidates('bard-fen'), [
    '/images/ruler-hooked/characters/bard-fen.webp',
    '/images/ruler-hooked/character-bard-fen.webp',
  ])
  const card = cardCandidates({ art: 'card-tax-season' }, 'taxman-gristle')
  assert.equal(card[0], '/images/ruler-hooked/card-tax-season.webp')
  assert.equal(card[1], '/images/ruler-hooked/characters/taxman-gristle.webp')
}

console.log(
  'Ruler console (proclamations, tutorial, art library) self-test passed.',
)
