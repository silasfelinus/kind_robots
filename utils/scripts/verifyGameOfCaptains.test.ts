import assert from 'node:assert/strict'
import {
  CAPTAIN_STATS,
  CREW_PROFILES,
  SYNERGIES,
  MISSION_RULES,
} from '../gameOfCaptains/crewAssignments'
import { readFileSync } from 'node:fs'
import { CREW_JOURNEYS, NEMESIS_COUNTERPLAY } from '../gameOfCaptains/crewJourneys'
import {
  CAPTAIN_DOSSIERS,
  CREW_DOSSIERS,
} from '../gameOfCaptains/characterDossiers'
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
  crewDetourOptions,
  beginCrewDetour,
  resolveCrewDetour,
  counterCrew,
  detourFor,
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
  Array.from(
    { length: 256 },
    (_, n) =>
      antagonistFor(startVoyage('fluke', ['pell', 'mox', 'rue'], n + 1)).id,
  ),
)
assert.equal(
  villainSeeds.size,
  8,
  'all eight principal enemies are seed-reachable',
)
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
// Every active crew profile owns three distinctive geographical steps.
for (const member of CREW_PROFILES) {
  const path = CREW_JOURNEYS[member.id]
  assert.equal(path.length, 3, member.id)
  assert.equal(new Set(path.map((step) => step.system)).size, 3)
  for (const step of path) {
    assert.ok(step.scene.length > 70, member.id)
    assert.ok(step.careful.length > 25 && step.bold.length > 25, member.id)
    assert.notEqual(step.careful, step.bold)
  }
}
for (const enemy of ANTAGONISTS) {
  const counters = NEMESIS_COUNTERPLAY[enemy.id] ?? []
  assert.ok(counters.length > 0, enemy.id + ' needs a specific crew counter')
  assert.ok(counters.every((id) => CREW_PROFILES.some((member) => member.id === id)))
}

function completeMission(run: ReturnType<typeof startVoyage>) {
  run = launchMission(run)
  assert.equal(run.phase, 'transit')
  const days = run.active!.returnsDay - (run.day ?? 1)
  for (let i = 0; i < days; i++) run = advanceVoyageDay(run)
  assert.equal(run.phase, 'decision')
  return decidePolicy(run, 'aid')
}
for (const member of CREW_PROFILES) {
  const crew = [member.id, ...CREW.filter((x) => x.id !== member.id).slice(0, 2).map((x) => x.id)]
  let run = startVoyage('quill', crew, 3207)
  const worldStops: string[] = []
  for (let chapter = 1; chapter <= 3; chapter++) {
    assert.equal(crewDetourOptions(run).length, 0, 'no detours during a briefing')
    run = completeMission(run)
    assert.ok(crewDetourOptions(run).includes(member.id))
    const detour = beginCrewDetour(run, member.id)
    assert.equal(detour.phase, 'crew-quest')
    assert.equal(detourFor(detour)?.system, CREW_JOURNEYS[member.id][chapter - 1]!.system)
    assert.equal(beginCrewDetour(detour, member.id), detour, 'no double departure')
    const saved = restoreVoyage(JSON.parse(JSON.stringify(detour)))
    assert.deepEqual(saved, detour, 'mid-quest resume is stable')
    const resolved = resolveCrewDetour(detour, 'bold')
    worldStops.push(resolved.journeyHistory!.at(-1)!.system)
    assert.equal(resolved.phase, 'debrief')
    assert.equal(resolved.journeyProgress![member.id], chapter)
    assert.equal(resolved.detourChapter, chapter)
    assert.deepEqual(crewDetourOptions(resolved), [], 'one route stop per chapter')
    assert.equal(resolveCrewDetour(resolved, 'bold'), resolved, 'cannot double-award a step')
    assert.equal(beginCrewDetour(resolved, member.id), resolved, 'cannot farm a route')
    assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(resolved))), resolved)
    run = nextDestination(resolved)
  }
  assert.equal(new Set(worldStops).size, 3)
  assert.equal(run.phase, 'finale')
  assert.ok(finishVoyage(run, 'protect').scene.includes('Quill deposits'))
  assert.ok(finishVoyage(run, 'protect').scene.includes(member.name))
}
// A full crew arc unlocks enemy-specific council action only for a matching nemesis.
for (const enemy of ANTAGONISTS) {
  const selected = NEMESIS_COUNTERPLAY[enemy.id]![0]!
  const seed = Array.from({ length: 800 }, (_, n) => n + 1)
    .find((n) => antagonistFor(startVoyage('vale', [selected, ...CREW.filter((c) => c.id !== selected).slice(0, 2).map((c) => c.id)], n)).id === enemy.id)!
  assert.ok(seed > 0, enemy.id)
  let run = startVoyage('vale', [selected, ...CREW.filter((c) => c.id !== selected).slice(0, 2).map((c) => c.id)], seed)
  assert.equal(counterCrew(run).length, 0)
  for (let i = 0; i < 3; i++) {
    run = completeMission(run)
    run = beginCrewDetour(run, selected)
    assert.equal(run.phase, 'crew-quest')
    run = resolveCrewDetour(run, 'bold')
    if (i < 1) assert.equal(counterCrew(run).length, 0)
    else assert.ok(counterCrew(run).includes(selected))
    run = nextDestination(run)
  }
  assert.equal(run.phase, 'finale')
  const ended = finishVoyage(run, 'counter')
  assert.equal(ended.phase, 'ending')
  assert.ok(ended.scene.includes('witnesses'))
  assert.notEqual(ended.scene, finishVoyage(run, 'protect').scene)
  assert.ok(ended.ending?.includes(enemy.id === 'showrunner' ? 'UNION' : 'WITNESS'))
  assert.equal(finishVoyage(ended, 'counter'), ended, 'cannot replay finale')
}
const unearned = startVoyage('fluke', ['pell', 'mox', 'rue'], 47)
assert.equal(counterCrew(unearned).length, 0)
assert.equal(finishVoyage({ ...unearned, phase: 'finale' }, 'counter').phase, 'finale')
const dryRun = { ...completeMission(startVoyage('rex', ['pell', 'mox', 'rue'], 99)), supplies: 0 }
const withoutSupplies = beginCrewDetour(dryRun, 'pell')
assert.equal(resolveCrewDetour(withoutSupplies, 'careful'), withoutSupplies, 'never spend negative supplies')
assert.equal(resolveCrewDetour(withoutSupplies, 'bold').phase, 'debrief', 'no supply softlock')
for (const captain of CAPTAINS) {
  const finale = { ...startVoyage(captain.id, ['pell', 'mox', 'rue'], 51), phase: 'finale' as const }
  const ending = finishVoyage(finale, 'protect')
  assert.ok(ending.scene.length > 180)
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
assert.ok(page.includes('data-testid="couch-crew-routes"'))
assert.ok(page.includes('data-testid="couch-crew-careful"'))
assert.ok(page.includes('data-testid="couch-crew-bold"'))
assert.ok(page.includes('data-testid="couch-counter-ending"'))
assert.ok(page.includes("run.phase === 'crew-quest'"))
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
