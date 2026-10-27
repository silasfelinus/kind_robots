import assert from 'node:assert/strict'
import {
  CAPTAIN_STATS,
  CREW_PROFILES,
  SYNERGIES,
  MISSION_RULES,
} from '../gameOfCaptains/crewAssignments'
import { readFileSync } from 'node:fs'
import { CAPTAIN_DOSSIERS, CREW_DOSSIERS } from '../gameOfCaptains/characterDossiers'
import {
  CAPTAINS,
  POCKET_ROOMS,
  SPACE_COUCH,
  configurePocketRoom,
  rechargeCouchShield,
  CREW,
  MISSIONS,
  ANTAGONISTS,
  assignAwayTeam,
  advanceVoyageDay,
  previewMission,
  antagonistFor,
  decidePolicy,
  finishVoyage,
  launchMission,
  missionFor,
  nextDestination,
  restoreVoyage,
  startVoyage,
} from '../gameOfCaptains/rules'

const fromRoot = (path: string) =>
  readFileSync(new URL('../../' + path, import.meta.url), 'utf8')
assert.equal(CAPTAINS.length, 6)
assert.equal(ANTAGONISTS.length, 8)
assert.equal(new Set(ANTAGONISTS.map((enemy) => enemy.id)).size, 8)
assert.ok(ANTAGONISTS.some((enemy) => enemy.id === 'showrunner'))
for (const enemy of ANTAGONISTS) {
  assert.equal(enemy.acts.length, 3)
  assert.ok(enemy.clue.length > 30 && enemy.interference.length > 30)
  assert.equal(new Set(enemy.acts).size, 3)
}
const villainSeeds = new Set(
  Array.from({ length: 256 }, (_, n) =>
    antagonistFor(startVoyage('fluke', ['pell', 'mox', 'rue'], n + 1)).id,
  ),
)
assert.equal(villainSeeds.size, 8, 'all eight principal enemies are seed-reachable')
assert.equal(POCKET_ROOMS.length, 3)
assert.ok(SPACE_COUCH.vessel.includes('red couch'))
let couch = startVoyage('fluke', ['pell', 'mox', 'rue'], 41)
const unpreparedOdds = previewMission(couch).chance
couch = configurePocketRoom(couch, 'infirmary')
assert.equal(previewMission(couch).chance, Math.min(94, unpreparedOdds + 10))
assert.equal(configurePocketRoom(couch, 'wrong' as 'holodeck'), couch)
const launchedCouch = launchMission(couch)
assert.equal(launchedCouch.shieldCharge, 1)
assert.equal(launchedCouch.supplies, couch.supplies - 1)
assert.equal(launchedCouch.active?.chance, previewMission(couch).chance)
assert.equal(configurePocketRoom(launchedCouch, 'holodeck'), launchedCouch)
couch = rechargeCouchShield(couch)
assert.equal(couch.shieldCharge, 3)
assert.equal(couch.supplies, 6)
assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(couch))), couch)
const oldSave = JSON.parse(JSON.stringify(couch))
delete oldSave.pocketRoom
delete oldSave.shieldCharge
assert.ok(restoreVoyage(oldSave), 'legacy saves remain readable')
assert.equal(CREW.length, 12)
assert.equal(CREW_PROFILES.length, 12)
assert.equal(new Set(CREW.map((x) => x.id)).size, 12)
assert.equal(SYNERGIES.length >= 8, true)
assert.equal(MISSION_RULES.length, 3)
for (const captain of CAPTAINS) {
  assert.equal(Object.keys(CAPTAIN_STATS[captain.id]).length, 6)
  assert.ok(CAPTAIN_DOSSIERS[captain.id].history.length > 80)
  assert.ok(CAPTAIN_DOSSIERS[captain.id].opening.length > 20)
}
for (const member of CREW_PROFILES) {
  const dossier = CREW_DOSSIERS[member.id]
  assert.equal(dossier.itinerary.length, 3)
  assert.equal(new Set(dossier.itinerary).size, 3)
  assert.ok(dossier.history.length > 70)
  assert.ok(dossier.crisis.length > 25 && dossier.nemesisLink.length > 25)
}
assert.equal(MISSIONS.length, 3)
assert.ok(ANTAGONISTS.length >= 3)
for (const captain of CAPTAINS) {
  for (const seed of [1, 2, 2026, 404, 777]) {
    let run = startVoyage(captain.id, ['pell', 'mox', 'rue'], seed)
    const antagonist = antagonistFor(run)
    for (let chapter = 1; chapter <= 3; chapter++) {
      assert.equal(run.phase, 'briefing')
      assert.equal(run.chapter, chapter)
      assert.ok(missionFor(run).title)
      assert.equal(antagonistFor(run).id, antagonist.id)
      const today = run.day ?? run.chapter
      const healthy = ['mox', 'pell', 'rue'].filter(
        (id) => (run.injuredUntil?.[id as 'mox'] ?? 0) <= today,
      ) as ('mox' | 'pell' | 'rue')[]
      const party = healthy.slice(0, 2)
      run = assignAwayTeam(run, party)
      const forecast = previewMission(run)
      assert.ok(forecast.eligible)
      assert.ok(forecast.chance >= 5 && forecast.chance <= 94)
      assert.ok(forecast.expiresInDays >= 1)
      assert.ok(forecast.durationDays >= 1 && forecast.durationDays <= 3)
      assert.ok(
        forecast.requirements.every((x) => x.total >= 0 && x.required > 0),
      )
      if (chapter < 3 && party.includes('mox') && party.includes('pell'))
        assert.ok(forecast.synergies.length > 0)
      assert.deepEqual(assignAwayTeam(run, ['mox', 'rue', 'pell', 'vela']), run)
      assert.deepEqual(assignAwayTeam(run, ['mox', 'mox']), run)
      assert.deepEqual(assignAwayTeam(run, ['jex']), run)
      const original = JSON.stringify(run)
      run = launchMission(run)
      assert.equal(run.phase, 'transit')
      assert.equal(run.active?.chance, forecast.chance)
      assert.equal(
        run.active?.returnsDay,
        (run.day ?? 0) + forecast.durationDays,
      )
      for (let n = 0; n < forecast.durationDays; n++) {
        run = advanceVoyageDay(run)
      }
      assert.equal(run.phase, 'decision')
      assert.equal(run.report?.missionId, MISSIONS[chapter - 1]?.id)
      assert.ok(
        ['flawless', 'success', 'costly', 'disaster'].includes(
          run.report!.result,
        ),
      )
      assert.notEqual(JSON.stringify(run), original)
      assert.equal(launchMission(run), run)
      const saved = JSON.parse(JSON.stringify(run)) as unknown
      assert.deepEqual(
        restoreVoyage(saved),
        run,
        'valid saved voyages survive restoration',
      )
      run = decidePolicy(
        run,
        ['aid', 'observe', 'intervene'][(seed + chapter) % 3] as
          'aid' | 'observe' | 'intervene',
      )
      assert.equal(run.phase, 'debrief')
      assert.ok(run.scene.length > 40)
      run = nextDestination(run)
    }
    assert.equal(run.phase, 'finale')
    for (const choice of ['protect', 'compromise'] as const) {
      const ended = finishVoyage(run, choice)
      assert.equal(ended.phase, 'ending')
      assert.ok(ended.ending && ended.scene.length > 50)
      assert.ok(ended.log.some((line) => line.startsWith('Final captain')))
    }
  }
}
assert.equal(restoreVoyage({ version: 1, captain: 'fluke' }), null)
assert.throws(() => startVoyage('fluke', ['pell', 'pell', 'mox'], 42))
assert.throws(() => startVoyage('fluke', ['pell', 'mox'], 42))
assert.throws(() => startVoyage('fluke', ['pell', 'mox', 'rue', 'vela'], 42))
let expired = startVoyage('vale', ['pell', 'mox', 'rue'], 99)
assert.equal(previewMission(expired).expiresInDays, 2)
expired = advanceVoyageDay(expired)
assert.equal(expired.phase, 'briefing')
expired = advanceVoyageDay(expired)
assert.equal(expired.phase, 'debrief')
assert.ok(expired.log.some((x) => x.includes('expired')))
assert.equal(nextDestination(expired).phase, 'briefing')
const page = fromRoot('pages/play/game-of-captains.vue')
const tab = fromRoot('content/channels/arcade/game-of-captains.md')
const home = fromRoot('components/home/home-visitor-directory.vue')
assert.ok(page.includes('data-layout="console-fixed"'))
assert.ok(page.includes('space-couch-stage.svg'))
assert.ok(page.includes('data-testid="couch-recharge-shield"'))
assert.ok(page.includes('POCKET_ROOMS'))
assert.ok(tab.includes('Space Couch'))
assert.ok(home.includes('Space Couch'))
assert.ok(page.includes('data-testid="captains-launch"'))
assert.ok(page.includes('data-testid="captains-choose-crew"'))
assert.ok(page.includes('data-testid="captains-back-to-captains"'))
assert.ok(page.includes('CREW_DOSSIERS[focusedCrew]'))
assert.ok(page.includes("selectionScreen === 'captain'"))
assert.ok(page.includes('stagePainting'))
assert.ok(tab.includes('route: /play/game-of-captains'))
assert.ok(
  home.includes("route: '/play/game-of-captains'") &&
    home.includes("route: '/play/comet-city-academy'"),
)
assert.ok(page.includes('Space Couch | Kind Robots'))
assert.ok(page.includes('data-testid="captains-odds"'))
assert.ok(page.includes('data-testid="captains-return-day"'))
assert.ok(page.includes('crewProfile(member.id).portraitKey'))
assert.ok(tab.includes('title: Space Couch'))
assert.ok(home.includes("title: 'Space Couch'"))
console.log('Space Couch seeded voyage and highlight contract: OK')
