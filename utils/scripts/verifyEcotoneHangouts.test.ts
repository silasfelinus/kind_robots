import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { COMPANIONS, type CompanionId } from '../ecotone/content'
import {
  advance,
  chooseBeat,
  chooseCrossroads,
  createRun,
  drawFork,
  encounterEligible,
  findCard,
  restoreRun,
  travelParty,
  type RunState,
} from '../ecotone/engine'
import {
  COMPANION_HANGOUTS,
  COMPANION_HANGOUT_CALLBACKS,
  earnedCompanionHangoutCallbacks,
} from '../ecotone/companionHangouts'
import { ecotoneArtSlots, cardArtKey, outcomeArtKey } from '../ecotone/artSlots'
import { ROUTES } from '../ecotone/story'

const ids: CompanionId[] = COMPANIONS.map((c) => c.id)
const slots = ecotoneArtSlots()
assert.equal(Object.keys(COMPANION_HANGOUTS).length, 4)
assert.equal(
  new Set(Object.values(COMPANION_HANGOUTS).map((card) => card.id)).size,
  4,
)
assert.equal(Object.keys(COMPANION_HANGOUT_CALLBACKS).length, 16)

function ready(
  seed: number,
  lead: CompanionId,
  newcomer: CompanionId,
): RunState {
  return {
    ...createRun(seed, 'reporter'),
    phase: 'crossroads',
    event: 'quiet',
    step: ROUTES.quiet.findIndex((step) => step.kind === 'crossroads'),
    day: 2,
    prospect: lead,
    openingState: 'sober',
    currentState: 'sober',
    activeLead: lead,
    meetingOrder: [lead],
    newcomerOrder: [newcomer],
  }
}

for (const newcomer of ids) {
  const card = COMPANION_HANGOUTS[newcomer]
  assert.equal(findCard(card.id), card, 'the story manager can find interludes')
  assert.ok(slots.cards.includes(cardArtKey(card.id)))
  assert.equal(card.choices.length, 3)
  assert.ok(
    card.choices.some((choice) => Boolean(choice.check && choice.failure)),
  )
  for (const choice of card.choices) {
    assert.ok(slots.outcomes.includes(outcomeArtKey(card.id, choice.id, 'success')))
    if (choice.failure)
      assert.ok(
        slots.outcomes.includes(outcomeArtKey(card.id, choice.id, 'failure')),
      )
  }

  // A random fork never deals a private scene as if consent or a relationship
  // could be awarded by a white-rabbit draw.
  const plain = ready(13, ids.find((id) => id !== newcomer)!, newcomer)
  assert.equal(encounterEligible({ ...card, requiresInvitation: true }, plain), false)
  for (const ix of ROUTES.quiet.keys())
    assert.ok(!drawFork(plain, ix).includes(card.id))

  for (const initial of ids.filter((id) => id !== newcomer)) {
    let observedSuccess = false
    let observedFailure = false
    for (let seed = 1; seed <= 120; seed += 1) {
      const start = ready(seed, initial, newcomer)
      const pending = chooseCrossroads(start, 'together')
      const hangout = advance(pending)
      assert.equal(hangout.phase, 'beat')
      assert.equal(hangout.card, card.id, 'correct newcomer receives scene')
      assert.deepEqual(travelParty(hangout), [initial, newcomer])
      assert.deepEqual(
        restoreRun(JSON.parse(JSON.stringify(hangout))),
        hangout,
        'mid-interlude saves remain resumable',
      )
      for (const choice of card.choices) {
        const reply = chooseBeat(hangout, choice.id)
        assert.equal(reply.pending?.entry.source, card.id)
        assert.ok(
          slots.outcomes.includes(reply.pending?.entry.art ?? ''),
          'resolved consequences retain their individual planned illustration slot',
        )
        assert.ok(
          reply.flags.some((flag) => flag.startsWith(`bond_${newcomer}_`)),
          'every response has a named memory',
        )
        const callbacks = earnedCompanionHangoutCallbacks(reply.flags)
        assert.equal(callbacks.length, 1)
        assert.ok(callbacks[0]!.length > 50)
        assert.deepEqual(
          earnedCompanionHangoutCallbacks([
            ...reply.flags,
            ...reply.flags,
          ]),
          callbacks,
          'repeated flags do not repeat epilogue prose',
        )
        const continued = advance(reply)
        assert.notEqual(continued.card, card.id, 'hangout does not loop')
        assert.notEqual(continued.phase, 'crossroads', 'route moves onward')
        assert.deepEqual(travelParty(continued), [initial, newcomer])
        assert.deepEqual(
          restoreRun(JSON.parse(JSON.stringify(continued))),
          continued,
        )
        if (reply.pending?.entry.roll) {
          if (reply.pending.entry.roll.success) observedSuccess = true
          else observedFailure = true
        }
      }
      if (seed === 1) {
        const follow = advance(chooseCrossroads(start, 'follow'))
        const stay = advance(chooseCrossroads(start, 'stay'))
        assert.notEqual(follow.card, card.id, 'switching guides does not invent a group scene')
        assert.notEqual(stay.card, card.id, 'declining group travel does not invent intimacy')
        assert.equal(earnedCompanionHangoutCallbacks(follow.flags).length, 0)
      }
    }
    assert.ok(observedSuccess, `${newcomer} has an earned successful skill outcome`)
    assert.ok(observedFailure, `${newcomer} has a genuinely failed skill outcome`)
  }
}

const board = readFileSync('components/ecotone-board.vue', 'utf8')
assert.match(board, /Companion interlude/)
assert.match(board, /earnedCompanionHangoutCallbacks/)
assert.match(board, /\{\{ callback \}\}/)
assert.deepEqual(earnedCompanionHangoutCallbacks(['started_alone']), [])
console.log('Ecotone personal companion interlude tests passed')
