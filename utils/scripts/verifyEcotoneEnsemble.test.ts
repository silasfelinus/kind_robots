import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { COMPANIONS } from '../ecotone/content'
import { ensembleFuture } from '../ecotone/ensembleFuture'
import {
  advance,
  checkParts,
  chooseBeat,
  chooseCrossroads,
  chooseFork,
  computeEnding,
  createRun,
  encounterEligible,
  findCard,
  restoreRun,
  travelParty,
  type RunState,
} from '../ecotone/engine'
import { openingLensChoices } from '../ecotone/openingLensChoices'
import { ROUTES } from '../ecotone/story'
import { FORMER_GUIDE_QUESTS } from '../ecotone/formerGuideQuests'
import { QUEST_CARDS } from '../ecotone/questExpansion'

const guides = COMPANIONS.map((guide) => guide.id)
const pairs: [typeof guides[number], typeof guides[number]][] = []
for (let i = 0; i < guides.length; i += 1) {
  for (let j = i + 1; j < guides.length; j += 1) {
    pairs.push([guides[i]!, guides[j]!])
  }
}

function atCrossroads(
  seed: number,
  initial: typeof guides[number],
  newcomer: typeof guides[number],
): RunState {
  const start = createRun(seed, 'reporter')
  return {
    ...start,
    phase: 'crossroads',
    event: 'quiet',
    step: ROUTES.quiet.findIndex((step) => step.kind === 'crossroads'),
    day: 2,
    openingState: 'sober',
    currentState: 'sober',
    prospect: initial,
    activeLead: initial,
    travelCompanions: [],
    meetingOrder: [initial],
    newcomerOrder: [newcomer],
  }
}

for (const [initial, newcomer] of pairs) {
  for (let seed = 1; seed <= 18; seed += 1) {
    const start = atCrossroads(seed, initial, newcomer)
    const accepted = chooseCrossroads(start, 'together')
    assert.deepEqual(travelParty(accepted), [initial, newcomer])
    assert.deepEqual(accepted.meetingOrder, [initial, newcomer])
    assert.equal(accepted.activeLead, initial, 'inviting someone does not dismiss the guide')
    assert.equal(accepted.followHistory.at(-1)?.choice, 'together')
    assert.equal(accepted.log.at(-1)?.source, 'CROSSROADS')
    assert.match(accepted.log.at(-1)?.text ?? '', /agree to share the road/)
    assert.deepEqual(
      restoreRun(JSON.parse(JSON.stringify(accepted))),
      accepted,
      'a two-guide party round-trips through real saved-run validation',
    )
    for (const skill of ['burly', 'lore', 'wits', 'psyche'] as const) {
      const helpers = checkParts(accepted, { skill, target: 9 }).filter(
        (part) => part.label.endsWith('helps'),
      )
      assert.ok(helpers.length <= 1, 'multi-guide skills never stack')
      if (
        COMPANIONS.some(
          (guide) =>
            [initial, newcomer].includes(guide.id) &&
            ({ kit: 'burly', cedar: 'lore', mara: 'wits', juniper: 'psyche' })[
              guide.id
            ] === skill,
        )
      )
        assert.equal(helpers.length, 1, 'every guide has a useful specialty')
    }
    const future = computeEnding(accepted)
    assert.equal(future.lead, initial, 'legacy signature still follows lead guide')
    for (const fate of ['hope', 'dark'] as const) {
      assert.ok(
        (ensembleFuture(accepted, fate)?.length ?? 0) > 100,
        'each traveling pair gets a distinct future in both fates',
      )
    }
    assert.notEqual(
      ensembleFuture(accepted, 'hope'),
      ensembleFuture(accepted, 'dark'),
    )

    // Proceed through the actual post-crossroads forks and route finale.
    let playing = advance(accepted)
    let guard = 0
    while (playing.phase !== 'end') {
      assert.ok(++guard < 35, 'every two-guide route terminates')
      if (playing.phase === 'fork') {
        playing = chooseFork(playing, playing.offered[0]!)
      } else if (playing.phase === 'beat') {
        const card = findCard(playing.card)!
        const choice = openingLensChoices(card).find((entry) => !entry.locked)!
        playing = advance(chooseBeat(playing, choice.id))
      } else {
        assert.fail(`unexpected phase after group crossroads: ${playing.phase}`)
      }
    }
    assert.deepEqual(travelParty(playing), [initial, newcomer])
    assert.ok(playing.ending?.startsWith(`${initial}.sober.`))
    assert.ok(ensembleFuture(playing, computeEnding(playing).fate))
    if (seed === 7) {
      assert.deepEqual(
        playing,
        replayPostCrossroads(start),
        'seed and shared party reproduce every decision and final outcome',
      )
    }
  }
}

function replayPostCrossroads(start: RunState): RunState {
  let state = advance(chooseCrossroads(start, 'together'))
  while (state.phase !== 'end') {
    if (state.phase === 'fork') {
      state = chooseFork(state, state.offered[0]!)
    } else if (state.phase === 'beat') {
      const card = findCard(state.card)!
      const choice = openingLensChoices(card).find((entry) => !entry.locked)!
      state = advance(chooseBeat(state, choice.id))
    } else {
      assert.fail('invalid replay phase')
    }
  }
  return state
}

const selected = atCrossroads(17, 'juniper', 'kit')
const stayed = chooseCrossroads(selected, 'stay')
assert.deepEqual(travelParty(stayed), ['juniper'])
assert.equal(ensembleFuture(stayed, 'hope'), null)
assert.deepEqual(travelParty(chooseCrossroads(selected, 'follow')), ['kit'])
assert.deepEqual(travelParty(chooseCrossroads(selected, false)), ['juniper'])
assert.deepEqual(travelParty(chooseCrossroads(selected, true)), ['kit'])
const solo: RunState = {
  ...selected,
  activeLead: null,
  travelCompanions: [],
}
assert.equal(chooseCrossroads(solo, 'together'), solo, 'solo cannot summon a partner')
assert.equal(ensembleFuture(solo, 'hope'), null)

const oldSave = JSON.parse(JSON.stringify(selected)) as Record<string, unknown>
delete oldSave.travelCompanions
const restoredOld = restoreRun(oldSave)
assert.ok(restoredOld)
assert.deepEqual(travelParty(restoredOld), ['juniper'])
assert.deepEqual(restoredOld.travelCompanions, [])
const impossible = {
  ...selected,
  travelCompanions: ['kit', 'kit'],
}
assert.equal(restoreRun(impossible), null, 'duplicated companions invalidate saves')
assert.equal(
  restoreRun({ ...selected, travelCompanions: ['mara'] }),
  null,
  'a traveler must actually have been met',
)
assert.equal(
  restoreRun({ ...selected, activeLead: null, travelCompanions: ['kit'] }),
  null,
  'solo state cannot carry an invisible group',
)

// A former guide has actually departed; a co-traveler is not one.
const mixed = chooseCrossroads(selected, 'together')
const kitFormer = FORMER_GUIDE_QUESTS.find((card) => card.id === 'FR-KIT-01')!
assert.equal(encounterEligible(kitFormer, mixed), false)
const movedOn = chooseCrossroads(selected, 'follow')
const juniperFormer = FORMER_GUIDE_QUESTS.find(
  (card) => card.id === 'FR-JUNIPER-01',
)!
assert.equal(encounterEligible(juniperFormer, movedOn), true)
const juniperQuest = QUEST_CARDS.find((card) => card.id === 'WH-012')!
assert.equal(encounterEligible(juniperQuest, mixed), true)
assert.equal(encounterEligible(juniperQuest, movedOn), false)

const board = readFileSync(
  'components/ecotone-board.vue',
  'utf8',
)
assert.match(board, /id: 'together'/)
assert.match(board, /game\.crossroads\('together'\)/)
assert.match(board, /\{\{ sharedFuture \}\}/)
assert.match(board, /game\.party\.some/)
console.log('Ecotone ensemble travel and shared-future tests passed')
