import assert from 'node:assert/strict'
import { ARCHETYPES, type Choice } from '../ecotone/content'
import {
  ALL_CARDS,
  chooseBeat,
  createRun,
  originPerkAvailable,
  restoreRun,
  type RunState,
} from '../ecotone/engine'
import { openingLensChoices } from '../ecotone/openingLensChoices'

function eligibleDecision(archetype: string): {
  cardId: string
  choice: Choice
  chapter: number
} {
  for (const card of ALL_CARDS) {
    const state = {
      ...createRun(73, archetype),
      event: card.event ?? 'green-ribbon',
      card: card.id,
      phase: 'beat' as const,
    }
    const choice = openingLensChoices(card).find((item) =>
      originPerkAvailable(state, item.id),
    )
    if (choice) return { cardId: card.id, choice, chapter: card.chapter }
  }
  throw new Error(archetype + ' needs a usable authored origin-perk decision')
}

for (const archetype of ARCHETYPES) {
  const { cardId, choice, chapter } = eligibleDecision(archetype.id)
  const base: RunState = {
    ...createRun(73, archetype.id),
    phase: 'beat',
    event: 'green-ribbon',
    card: cardId,
  }

  assert.ok(originPerkAvailable(base, choice.id))
  const ordinary = chooseBeat(base, choice.id)
  const perk = chooseBeat(base, choice.id, true)
  assert.ok(ordinary.pending && perk.pending)
  assert.deepEqual(ordinary.perkUsedChapters, [])
  assert.deepEqual(perk.perkUsedChapters, [chapter])
  assert.notEqual(perk.pending.entry.text, ordinary.pending.entry.text)
  assert.deepEqual(perk.played, ordinary.played)
  assert.equal(perk.pending.entry.art, ordinary.pending.entry.art)
  assert.deepEqual(
    restoreRun(JSON.parse(JSON.stringify(perk))),
    perk,
    archetype.id + ' must survive reload with the chapter spent',
  )

  const alreadySpent = { ...base, perkUsedChapters: [chapter] }
  assert.equal(originPerkAvailable(alreadySpent, choice.id), false)
  assert.deepEqual(
    chooseBeat(alreadySpent, choice.id, true),
    chooseBeat(alreadySpent, choice.id),
    archetype.id + ' cannot spend twice in the same chapter',
  )
  assert.equal(originPerkAvailable({ ...base, phase: 'end' }, choice.id), false)

  const anotherChapter = ALL_CARDS.find(
    (candidate) =>
      candidate.chapter !== chapter &&
      openingLensChoices(candidate).some((item) =>
        originPerkAvailable({ ...alreadySpent, card: candidate.id }, item.id),
      ),
  )
  assert.ok(anotherChapter, archetype.id + ' has a fresh chapter opportunity')
  const another = openingLensChoices(anotherChapter!).find((item) =>
    originPerkAvailable({ ...alreadySpent, card: anotherChapter!.id }, item.id),
  )!
  const newChapter = chooseBeat(
    { ...alreadySpent, card: anotherChapter!.id },
    another.id,
    true,
  )
  assert.ok(
    newChapter.perkUsedChapters.includes(anotherChapter!.chapter),
    archetype.id + ' regains a perk on a new chapter',
  )
  assert.equal(new Set(newChapter.perkUsedChapters).size, 2)

  if (archetype.id === 'mechanic') {
    assert.ok(
      perk.nerve < ordinary.nerve,
      'improvisation incurs its advertised real nerve cost',
    )
    assert.equal(
      (perk.pending.entry.roll?.bonus ?? 0) -
        (ordinary.pending.entry.roll?.bonus ?? 0),
      2,
    )
  }
  if (archetype.id === 'reporter' || archetype.id === 'local') {
    assert.ok(
      perk.evidence.includes(`origin_${archetype.id}_${cardId}`),
      'sourcing or a local lead leaves checkable evidence',
    )
  }
  if (archetype.id === 'dealer') {
    assert.equal(
      (perk.pending.entry.roll?.bonus ?? 0) -
        (ordinary.pending.entry.roll?.bonus ?? 0),
      2,
    )
  }
}

for (const archetypeId of ['student', 'rower', 'gardener'] as const) {
  const { cardId, choice } = eligibleDecision(archetypeId)
  let witnessed = false
  for (let seed = 1; seed <= 250; seed++) {
    const base: RunState = {
      ...createRun(seed, archetypeId),
      phase: 'beat',
      event: 'green-ribbon',
      card: cardId,
    }
    const normal = chooseBeat(base, choice.id)
    const altered = chooseBeat(base, choice.id, true)
    if (normal.pending?.entry.roll?.success !== false) continue
    assert.ok(altered.pending)
    if (archetypeId === 'student') {
      assert.ok(
        altered.goodwill > normal.goodwill,
        'failed research salvages goodwill',
      )
    } else if (archetypeId === 'rower') {
      assert.ok(altered.nerve >= normal.nerve, 'hazard resilience keeps nerve')
    } else {
      assert.ok(
        (altered.pending.entry.roll?.bonus ?? -999) >
          (normal.pending.entry.roll?.bonus ?? -999),
        'risk spotting changes the check',
      )
    }
    witnessed = true
    break
  }
  assert.ok(witnessed, archetypeId + ' needs a real losing-roll witness')
}

const oldSave = createRun(77, 'reporter') as Partial<RunState>
delete oldSave.perkUsedChapters
assert.deepEqual(
  restoreRun(JSON.parse(JSON.stringify(oldSave)))?.perkUsedChapters,
  [],
  'old version-4 saves start with an unused perk',
)
for (const invalid of [[1, 1], [0], [7], [-1], [1.5]]) {
  assert.equal(
    restoreRun({ ...createRun(77, 'reporter'), perkUsedChapters: invalid }),
    null,
    'invalid or duplicated spent-chapter records are rejected',
  )
}
console.log('Ecotone origin perks: seven usable, spent, replayable archetypes')
