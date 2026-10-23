import assert from 'node:assert/strict'
import { createRun, findCard, type RunState } from '../ecotone/engine'
import {
  contextualOpeningChoices,
  contextualOfferLine,
  sceneMomentOffer,
} from '../ecotone/sceneOffers'
import { openingLensChoices } from '../ecotone/openingLensChoices'

const openingIds = ['GR-2', 'KN-2', 'QW-2'] as const
const allShown = new Set<string>()
const specialParties = new Set<string>()
const versions = new Set<string>()

for (const seed of [12, 13, 22, 23]) {
  for (const prospect of ['cedar', 'mara', 'juniper', null] as const) {
    for (const id of openingIds) {
      const card = findCard(id)
      assert.ok(card)
      const state: RunState = {
        ...createRun(seed, 'reporter'),
        event:
          id === 'KN-2' ? 'kinetic' : id === 'GR-2' ? 'green-ribbon' : 'quiet',
        phase: 'beat',
        card: id,
        prospect,
      }
      const visible = contextualOpeningChoices(card, state)
      assert.ok(
        visible.length >= 2 && visible.length <= 3,
        id + ' must stay compact',
      )
      assert.equal(
        new Set(visible.map((choice) => choice.id)).size,
        visible.length,
      )
      assert.ok(visible.every((choice) => !choice.locked && choice.lens))
      assert.ok(visible.some((choice) => choice.lens === 'sober'))
      assert.ok(
        visible.every((choice) =>
          openingLensChoices(card).some(
            (authored) => authored.id === choice.id,
          ),
        ),
      )
      assert.ok(
        new Set(
          visible
            .map((choice) => choice.lens)
            .filter((lens) => lens !== 'sober'),
        ).size <= 2,
        id + ' cannot present more than two chemical perspectives',
      )
      for (const choice of visible) allShown.add(choice.lens!)
      versions.add(id + ':' + visible.map((choice) => choice.id).join('|'))
      if (id === 'KN-2') {
        const extras = visible.filter(
          (choice) => !['sober', 'tipsy'].includes(choice.id),
        )
        assert.equal(extras.length, 1)
        specialParties.add(extras[0]!.id)
        assert.match(contextualOfferLine(card, state) ?? '', /offers|offer/)
      } else {
        assert.equal(contextualOfferLine(card, state), null)
      }
      if (id === 'QW-2') {
        assert.deepEqual(
          visible.map((choice) => choice.id),
          ['sober', 'stoned'],
        )
      }
    }
  }
}
assert.deepEqual(
  specialParties,
  new Set(['fast-track', 'race-meth', 'loves-all']),
)
assert.deepEqual(
  allShown,
  new Set([
    'sober',
    'tipsy',
    'stoned',
    'tripping_balls',
    'cocaine',
    'meth',
    'mdma',
  ]),
  'all seven outcomes stay authored across organically separate situations',
)
assert.ok(
  versions.size >= 5,
  'different companions and seeds lead to different party offers',
)

const fair = findCard('GR-3')
const party = findCard('KN-3')
const marsh = findCard('QW-3')
const forest = findCard('GR-4')
assert.ok(fair && party && marsh && forest)
const active = {
  ...createRun(33, 'reporter'),
  phase: 'beat' as const,
  openingState: 'sober' as const,
}
assert.equal(sceneMomentOffer(fair, active)?.id, 'cannabis')
assert.equal(sceneMomentOffer(party, active)?.id, 'alcohol')
assert.equal(sceneMomentOffer(marsh, active), null)
assert.equal(sceneMomentOffer(forest, active), null)
assert.equal(sceneMomentOffer(party, { ...active, openingState: null }), null)
assert.equal(
  sceneMomentOffer(party, {
    ...active,
    pending: {
      entry: {
        source: 'KN-3',
        title: 'Test',
        choice: 'Test',
        roll: null,
        text: 'Test',
        effects: {},
        step: 1,
        day: 1,
      },
      nextStep: 3,
    },
  }),
  null,
)
console.log(
  'Ecotone chemistry UX: no catalog, context-specific offers, abstention always visible',
)
