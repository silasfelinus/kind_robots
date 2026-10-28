import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { startVoyage, restoreVoyage } from '../gameOfCaptains/rules'
import {
  arriveAtWorld, startWorldTravel, currentExpedition, hireRedshirt,
  recruitedOriginals, REDSHIRT_QUARTERS,
} from '../gameOfCaptains/expedition'
import {
  dispatchEpisodeBatch, drawEpisodeDeck, episodeDraws, episodePlotOdds,
  episodePlotSeats, episodePlotSkill, questDuration, questOdds,
} from '../gameOfCaptains/episodeConsole'
import {
  learnRedshirtKnowledge, normalizeRedshirtKnowledge, knownRedshirtSkills,
} from '../gameOfCaptains/redshirtKnowledge'
import { REDSHIRT_BY_ID } from '../gameOfCaptains/redshirts'

const make = (seed = 12045) => startVoyage('vale', ['pell', 'mox', 'rue'], seed)
const first = arriveAtWorld(startWorldTravel(make()))
const card = currentExpedition(first).find((c) => c.priority === 'major')!
const recruit = first.redshirtRoster![0]!
assert.equal(questDuration(first, card.id), 1)
assert.equal(questOdds(first, card, recruit, {}), null)
const played = dispatchEpisodeBatch(first, [{ encounterId: card.id, lead: recruit }])
assert.equal(played.expeditionVisit?.results[0]?.durationDays, 1)
assert.equal(played.day, first.day, 'no hidden multi-day round advancement')
const reports = learnRedshirtKnowledge(played)
assert.deepEqual(knownRedshirtSkills(make(), reports, recruit), [card.skill])
assert.equal(questOdds(first, card, recruit, reports)! > 0, true)
assert.deepEqual(learnRedshirtKnowledge(played, reports), reports, 'idempotent')
assert.equal(REDSHIRT_BY_ID[recruit]!.stats[card.skill] > 0, true)
assert.deepEqual(normalizeRedshirtKnowledge({ [recruit]: [card.skill, card.skill, 'INVALID'], bogus: ['science'] }), reports)
const saved = JSON.parse(JSON.stringify(reports))
assert.deepEqual(normalizeRedshirtKnowledge(saved), reports)

// Scarce originals: six starters and exactly two additional identities per voyage.
// A death or clone does not free the recruitment allowance.
let hiring = make()
assert.equal(recruitedOriginals(hiring), 6)
hiring = hireRedshirt(hiring)
hiring = hireRedshirt(hiring)
assert.equal(recruitedOriginals(hiring), REDSHIRT_QUARTERS.recruitmentLimit)
assert.equal(hireRedshirt(hiring), hiring)
const lost = hiring.redshirtRoster![0]!
const afterLoss = {
  ...hiring,
  redshirtRoster: hiring.redshirtRoster!.filter((id) => id !== lost),
  redshirtFallen: [{ id: lost, chapter: 1, encounterId: card.id, missionId: 'refugees' }],
}
assert.equal(recruitedOriginals(afterLoss), REDSHIRT_QUARTERS.recruitmentLimit)
assert.equal(hireRedshirt(afterLoss), afterLoss)

// Planet/casino/bar/star/nemesis story cards are one-round command scenes.
// Only the actual captain and three chosen officers may star; 2-person
// encounters appear for seeded rounds and provide a meaningful synergy.
let single = 0, double = 0
for (let seed = 1; seed <= 90; seed++) {
  const run = make(seed)
  for (const deck of ['planet', 'casino', 'serendipity'] as const) {
    const slots = episodePlotSeats(run, deck)
    assert.equal(slots === 1 || slots === 2, true)
    if (slots === 2) double++; else single++
    assert.equal(episodePlotOdds(run, deck, []), 0)
    assert.equal(episodePlotOdds(run, deck, [recruit]), 0)
    assert.equal(episodePlotOdds(run, deck, ['captain', 'captain']), 0)
    assert.equal(episodePlotOdds(run, deck, ['captain', 'vela']), 0)
    assert.ok(episodePlotSkill(run, deck))
    assert.ok(episodePlotOdds(run, deck, ['captain']) > 0)
    if (slots === 1) assert.equal(episodePlotOdds(run, deck, ['captain', 'pell']), 0)
    else assert.ok(episodePlotOdds(run, deck, ['captain', 'pell']) >
      episodePlotOdds(run, deck, ['captain']))
  }
}
assert.ok(single > 0 && double > 0)
const ready = dispatchEpisodeBatch(first, currentExpedition(first)
  .filter((c) => c.priority === 'major')
  .map((c, index) => ({ encounterId: c.id, lead: ['captain', 'pell', 'mox', 'rue'][index]! })))
assert.equal(drawEpisodeDeck(ready, 'planet', 'ask', []), ready)
assert.equal(drawEpisodeDeck(ready, 'planet', 'ask', [recruit]), ready)
assert.equal(drawEpisodeDeck(ready, 'planet', 'ask', ['captain', 'vela']), ready)
const planet = drawEpisodeDeck(ready, 'planet', 'ask', ['pell'])
assert.equal(episodeDraws(planet)[0]?.cast?.[0], 'pell')
assert.equal(typeof episodeDraws(planet)[0]?.successful, 'boolean')
assert.equal(episodeDraws(planet)[0]?.skill, episodePlotSkill(ready, 'planet'))
assert.match(episodeDraws(planet)[0]!.result, /one round/)
assert.equal(planet.day, ready.day)
assert.deepEqual(drawEpisodeDeck(ready, 'planet', 'ask', ['pell']), planet)
assert.equal(drawEpisodeDeck(planet, 'planet', 'document', ['captain']), planet)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(planet))), planet)
const ui = readFileSync(new URL('../../components/gameOfCaptains/daily-console.vue', import.meta.url), 'utf8')
const store = readFileSync(new URL('../../stores/gameOfCaptainsStore.ts', import.meta.url), 'utf8')
assert.ok(ui.includes('space-couch-plot-assignment'))
assert.ok(ui.includes('space-couch-plot-officer'))
assert.ok(ui.includes('FIELD REPORTS'))
assert.ok(store.includes('game-of-captains-redshirt-knowledge-v1'))
console.log('Space Couch one-round staffing, scarce redshirts and cross-voyage skill memory verified')
