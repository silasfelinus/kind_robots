import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CAPTAIN_INSTINCTS,
  captainInstinctAvailable,
  captainInstinctReply,
  chooseCaptainInstinct,
} from '../gameOfCaptains/captainInstincts'
import {
  CAPTAIN_DOSSIERS,
  CREW_DOSSIERS,
} from '../gameOfCaptains/characterDossiers'
import { CAPTAIN_STATS } from '../gameOfCaptains/crewAssignments'
import {
  CAPTAINS,
  CREW,
  assignAwayTeam,
  advanceVoyageDay,
  decidePolicy,
  launchMission,
  nextDestination,
  previewMission,
  restoreVoyage,
  startVoyage,
} from '../gameOfCaptains/rules'

const captainHooks = new Set<string>()
const crewHooks = new Set<string>()
const titles = new Set<string>()
assert.equal(CAPTAINS.length, 6)
assert.equal(Object.keys(CAPTAIN_INSTINCTS).length, 6)
for (const captain of CAPTAINS) {
  const dossier = CAPTAIN_DOSSIERS[captain.id]
  const move = CAPTAIN_INSTINCTS[captain.id]
  assert.ok(dossier.hook.length > 45 && dossier.oddity.length > 45)
  assert.ok(dossier.storyPromise.length > 75 && dossier.crewSpark.length > 45)
  assert.ok(move.situation.length > 80)
  assert.ok(move.impulse.length > 20 && move.restraint.length > 20)
  assert.ok(move.crewReplies.length >= 2)
  assert.notEqual(move.impulse, move.restraint)
  titles.add(move.title)
  captainHooks.add(dossier.hook)
  const party = [
    move.crewReplies[0]!.crew,
    ...CREW.map((officer) => officer.id).filter(
      (id) => id !== move.crewReplies[0]!.crew,
    ),
  ].slice(0, 3)
  const start = assignAwayTeam(
    startVoyage(captain.id, party, 41),
    party.slice(0, 2),
  )
  assert.equal(captainInstinctAvailable(start), true)
  assert.ok(captainInstinctReply(start).length > 25)
  const baseline = previewMission(start).chance
  const daring = chooseCaptainInstinct(start, 'impulse')
  assert.equal(daring.captainBonus, 10)
  assert.equal(daring.captainInstincts?.[0]?.approach, 'impulse')
  assert.equal(previewMission(daring).chance, Math.min(94, baseline + 10))
  assert.equal(chooseCaptainInstinct(daring, 'impulse'), daring)
  assert.equal(chooseCaptainInstinct(daring, 'restraint'), daring)
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(daring))), daring)
  const careful = chooseCaptainInstinct(start, 'restraint')
  assert.equal(careful.captainBonus, 0)
  assert.equal(careful.captainInstincts?.[0]?.approach, 'restraint')
  assert.notEqual(careful.scene, daring.scene)
  const legacy = JSON.parse(JSON.stringify(start))
  delete legacy.captainInstincts
  delete legacy.captainBonus
  assert.deepEqual(restoreVoyage(legacy), legacy)
  assert.equal(
    restoreVoyage({
      ...daring,
      captainInstincts: [
        { chapter: 1, approach: 'impulse' },
        { chapter: 1, approach: 'restraint' },
      ],
    }),
    null,
  )
  let voyage = launchMission(daring)
  while (voyage.phase === 'transit') voyage = advanceVoyageDay(voyage)
  voyage = decidePolicy(voyage, 'aid')
  voyage = nextDestination(voyage)
  assert.equal(voyage.chapter, 2)
  assert.equal(voyage.captainBonus, 0)
  assert.equal(captainInstinctAvailable(voyage), true)
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(voyage))), voyage)
  assert.equal(Object.keys(CAPTAIN_STATS[captain.id]).length, 6)
}
assert.equal(captainHooks.size, 6)
assert.equal(titles.size, 6)
for (const officer of CREW) {
  const dossier = CREW_DOSSIERS[officer.id]
  assert.ok(dossier.hook.length > 35 && dossier.oddity.length > 45, officer.id)
  assert.ok(
    dossier.storyPromise.length > 70 && dossier.crewSpark.length > 40,
    officer.id,
  )
  crewHooks.add(dossier.hook)
}
assert.equal(crewHooks.size, 12)
assert.ok(
  CREW.find((officer) => officer.id === 'mox')?.role.includes('android'),
)
assert.ok(CREW_DOSSIERS.mox.storyPromise.includes('body'))
assert.ok(CAPTAIN_DOSSIERS.solace.history.includes('Four weeks ago'))
assert.ok(CAPTAIN_DOSSIERS.fluke.history.includes('stutters'))
const page = readFileSync(
  new URL('../../pages/play/game-of-captains.vue', import.meta.url),
  'utf8',
)
for (const key of [
  'couch-captain-promise',
  'couch-crew-promise',
  'couch-captain-instinct',
  'couch-captain-impulse',
  'couch-captain-restraint',
])
  assert.ok(page.includes(key), key)
assert.ok(page.includes('store.captainAction'))
console.log(
  'Space Couch: six captain identities, twelve crew hooks and tactical choices verified',
)
