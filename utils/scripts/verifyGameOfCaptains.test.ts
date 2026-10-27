import assert from 'node:assert/strict'
import {
  chooseRomance,
  romanceMoment,
  relationshipEpilogue,
  type RomanceVoyage,
  type RomanceChoiceId,
} from '../gameOfCaptains/romance'
import {
  ROMANCE_STORIES,
  SOLO_ROMANCE_ROUTES,
  PAIR_ROMANCE_ROUTES,
} from '../gameOfCaptains/romanceStories'
import {
  CAPTAIN_STATS,
  CREW_PROFILES,
  SYNERGIES,
  MISSION_RULES,
} from '../gameOfCaptains/crewAssignments'
import {
  ACT_TWO_ABOARD,
  ACT_TWO_BOARDS,
  ACT_TWO_CONSEQUENCES,
  ACT_TWO_ECHOES,
  ACT_TWO_MISSIONS,
  ACT_TWO_MOVES,
  ACT_TWO_NEMESIS,
  ACT_TWO_ORDERS,
} from '../gameOfCaptains/actTwo'
import {
  MISSION_CALLBACKS,
  VOYAGE_BOARDS,
  VOYAGE_CHAPTERS,
  earnedCallbacks,
  nemesisMove,
} from '../gameOfCaptains/voyageMap'
import {
  ACT_ONE_BOARDS,
  ACT_ONE_CONSEQUENCES,
  ACT_ONE_NEMESIS,
  ACT_ONE_ORDERS,
} from '../gameOfCaptains/actOne'
import { readFileSync } from 'node:fs'
import {
  CREW_JOURNEYS,
  NEMESIS_COUNTERPLAY,
} from '../gameOfCaptains/crewJourneys'
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
  stageCrewDetour,
  resolveCrewDetour,
  counterCrew,
  detourFor,
  launchMission,
  missionFor,
  missionBoard,
  chooseMission,
  worldEcho,
  nextDestination,
  restoreVoyage,
  startVoyage,
} from '../gameOfCaptains/rules'

import { WARP_ART_PROMPTS, warpArtPrompt } from '../gameOfCaptains/artPrompts'
import {
  WARP_ENDINGS,
  antagonistArtKey,
  captainArtKey,
  crewArtKey,
  endingArtKey,
  missionArtKey,
} from '../gameOfCaptains/artSlots'

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
assert.equal(MISSION_RULES.length, MISSIONS.length)
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
assert.equal(MISSIONS.length, 21)
assert.ok(ANTAGONISTS.length >= 3)
for (const captain of CAPTAINS) {
  for (const seed of [1, 2, 2026, 404, 777]) {
    let run = startVoyage(captain.id, ['pell', 'mox', 'rue'], seed)
    const antagonist = antagonistFor(run)
    for (let chapter = 1; chapter <= VOYAGE_CHAPTERS; chapter++) {
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
      assert.equal(run.report?.missionId, VOYAGE_BOARDS[chapter - 1]![0])
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
  assert.equal(new Set(path.map((step) => step.prize)).size, 3)
  for (const step of path) {
    assert.ok(step.reversal.length > 80, member.id)
    assert.ok(
      step.scene.length > 200 && step.carefulOutcome.length > 90,
      member.id,
    )
    assert.ok(step.boldOutcome.length > 90 && step.prize.length > 12, member.id)
    assert.ok(
      step.finalCareful.length > 35 && step.finalBold.length > 35,
      member.id,
    )
    assert.ok(step.scene.length > 70, member.id)
    assert.ok(step.careful.length > 25 && step.bold.length > 25, member.id)
    assert.notEqual(step.careful, step.bold)
  }
}
for (const enemy of ANTAGONISTS) {
  const counters = NEMESIS_COUNTERPLAY[enemy.id] ?? []
  assert.ok(counters.length > 0, enemy.id + ' needs a specific crew counter')
  assert.ok(
    counters.every((id) => CREW_PROFILES.some((member) => member.id === id)),
  )
}

/** Plays every remaining chapter with the default call and aid, then stops at the jump gate. */
function toFinale(run: ReturnType<typeof startVoyage>) {
  run = nextDestination(run)
  while (run.phase === 'briefing') {
    run = completeMission(run)
    run = nextDestination(run)
  }
  assert.equal(run.phase, 'finale')
  return run
}
function completeMission(run: ReturnType<typeof startVoyage>) {
  run = launchMission(run)
  assert.equal(run.phase, 'transit')
  const days = run.active!.returnsDay - (run.day ?? 1)
  for (let i = 0; i < days; i++) run = advanceVoyageDay(run)
  assert.equal(run.phase, 'decision')
  return decidePolicy(run, 'aid')
}
// Act I star chart: different crews, destinations and civic policies lead to
// different reachable missions, modifiers, witnesses and finale memories.
assert.equal(ACT_ONE_BOARDS.length, 3)
assert.equal(Object.keys(ACT_ONE_CONSEQUENCES).length, 9)
assert.equal(Object.keys(ACT_ONE_NEMESIS).length, 8)
for (const missionId of Object.keys(ACT_ONE_ORDERS)) {
  const commands = ACT_ONE_ORDERS[missionId as keyof typeof ACT_ONE_ORDERS]
  assert.equal(new Set(Object.values(commands)).size, 3, missionId)
  const consequences =
    ACT_ONE_CONSEQUENCES[missionId as keyof typeof ACT_ONE_CONSEQUENCES]
  assert.equal(
    new Set(Object.values(consequences).map((x) => x.flag)).size,
    3,
    missionId,
  )
}
assert.equal(new Set(MISSIONS.map((m) => m.id)).size, 21)
assert.equal(new Set(MISSIONS.map((m) => m.system)).size, 12)
assert.deepEqual(
  missionBoard(startVoyage('vale', ['pell', 'mox', 'rue'], 310)).map(
    (m) => m.id,
  ),
  ['refugees', 'ashdock', 'windglass'],
)
for (const mission of MISSIONS) {
  assert.ok(mission.briefing.length > 95)
  assert.ok(mission.dilemma.length > 65)
  assert.ok(MISSION_RULES.some((rule) => rule.id === mission.id))
}
let workerRoute = startVoyage('vale', ['pell', 'mox', 'rue'], 310)
assert.equal(
  chooseMission(workerRoute, 'gameworld'),
  workerRoute,
  'locked world',
)
workerRoute = chooseMission(workerRoute, 'ashdock')
assert.equal(missionFor(workerRoute).id, 'ashdock')
assert.equal(chooseMission(workerRoute, 'ashdock'), workerRoute)
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(workerRoute))),
  workerRoute,
)
workerRoute = launchMission(workerRoute)
assert.equal(
  chooseMission(workerRoute, 'refugees'),
  workerRoute,
  'no mid-flight teleport',
)
while (workerRoute.phase === 'transit')
  workerRoute = advanceVoyageDay(workerRoute)
workerRoute = decidePolicy(workerRoute, 'intervene')
assert.equal(workerRoute.phase, 'debrief')
assert.ok(workerRoute.worldFlags?.includes('ashdock-exposed'))
assert.equal(workerRoute.missionHistory?.[0]?.missionId, 'ashdock')
assert.ok(workerRoute.scene.includes('contractor'))
assert.ok(worldEcho(workerRoute).includes('contractor'))
workerRoute = nextDestination(workerRoute)
assert.ok(missionBoard(workerRoute).some((m) => m.id === 'nacre'))
workerRoute = chooseMission(workerRoute, 'nacre')
assert.equal(missionFor(workerRoute).id, 'nacre')
workerRoute = completeMission(workerRoute)
assert.equal(workerRoute.missionHistory?.[1]?.missionId, 'nacre')
workerRoute = nextDestination(workerRoute)
assert.ok(missionBoard(workerRoute).some((m) => m.id === 'gameworld'))
workerRoute = chooseMission(workerRoute, 'gameworld')
workerRoute = completeMission(workerRoute)
assert.equal(workerRoute.worldFlags?.length, 3)
const workerEnding = finishVoyage(toFinale(workerRoute), 'protect')
const villainPressure = {
  ...startVoyage('quill', ['mox', 'sora', 'omi'], 22),
  chapter: 3,
  missionId: 'gameworld',
  antagonist: ANTAGONISTS.findIndex((a) => a.id === 'showrunner'),
}
const ordinaryPressure = {
  ...villainPressure,
  antagonist: ANTAGONISTS.findIndex((a) => a.id === 'auditor'),
}
assert.equal(
  previewMission(villainPressure).chance,
  Math.max(5, previewMission(ordinaryPressure).chance - 10),
  'a seeded nemesis changes the odds at the world it controls',
)
assert.ok(workerEnding.scene.includes('Ashdock Shipyards'))
assert.ok(workerEnding.scene.includes('Nacre Assembly'))
assert.ok(workerEnding.scene.includes('Gameworld'))
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(workerEnding))),
  workerEnding,
)

let healerRoute = startVoyage('vale', ['vela', 'brin', 'tess'], 310)
assert.equal(chooseMission(healerRoute, 'ashdock').phase, 'briefing')
healerRoute = completeMission(healerRoute)
assert.equal(healerRoute.worldFlags?.[0], 'convoy-invited')
healerRoute = nextDestination(healerRoute)
assert.ok(missionBoard(healerRoute).some((m) => m.id === 'haleth'))
healerRoute = chooseMission(healerRoute, 'haleth')
assert.equal(missionFor(healerRoute).id, 'haleth')
const halethDispatch = assignAwayTeam(healerRoute, ['vela', 'brin'])
assert.equal(
  previewMission(halethDispatch).chance,
  Math.min(
    94,
    previewMission({ ...halethDispatch, worldFlags: [] }).chance + 10,
  ),
)
healerRoute = completeMission(healerRoute)
healerRoute = nextDestination(healerRoute)
assert.ok(missionBoard(healerRoute).some((m) => m.id === 'rootborne'))
healerRoute = chooseMission(healerRoute, 'rootborne')
const orchardDispatch = assignAwayTeam(healerRoute, ['vela', 'brin'])
assert.equal(
  previewMission(orchardDispatch).chance,
  Math.min(
    94,
    previewMission({ ...orchardDispatch, worldFlags: [] }).chance + 10,
  ),
)
healerRoute = completeMission(healerRoute)
const healerEnding = finishVoyage(toFinale(healerRoute), 'protect')
assert.ok(healerEnding.scene.includes('Haleth Reef'))
assert.ok(healerEnding.scene.includes('Rootborne Gardens'))
assert.notEqual(healerEnding.scene, workerEnding.scene)
assert.notDeepEqual(healerRoute.worldFlags, workerRoute.worldFlags)
assert.ok(workerEnding.log.some((line) => line.includes('contractor')))
assert.equal(
  chooseMission(workerRoute, 'refugees'),
  workerRoute,
  'no post-mission reroute',
)

// A captain without diplomatic contacts is not automatically entitled to
// every sealed hearing; their prior conduct has to change the route board.
let sealedHearing = startVoyage('rex', ['pell', 'mox', 'jex'], 910)
sealedHearing = completeMission(sealedHearing)
sealedHearing = nextDestination(sealedHearing)
assert.equal(
  missionBoard(sealedHearing).some((m) => m.id === 'nacre'),
  false,
)
assert.equal(
  missionBoard(sealedHearing).some((m) => m.id === 'haleth'),
  true,
)
const oldChapterTwo = { ...sealedHearing }
delete oldChapterTwo.missionId
delete oldChapterTwo.missionHistory
delete oldChapterTwo.worldFlags
assert.equal(missionFor(oldChapterTwo).id, 'archive')
assert.ok(restoreVoyage(JSON.parse(JSON.stringify(oldChapterTwo))))
assert.equal(restoreVoyage({ ...sealedHearing, missionId: 'invalid' }), null)
assert.equal(
  restoreVoyage({
    ...sealedHearing,
    missionHistory: [
      {
        chapter: 9,
        missionId: 'bar',
        system: 'Serendipity Space Bar',
        policy: 'aid',
        result: 'success',
      },
    ],
  }),
  null,
)

for (const member of CREW_PROFILES) {
  const crew = [
    member.id,
    ...CREW.filter((x) => x.id !== member.id)
      .slice(0, 2)
      .map((x) => x.id),
  ]
  let run = startVoyage('quill', crew, 3207)
  const worldStops: string[] = []
  for (let chapter = 1; chapter <= 3; chapter++) {
    assert.equal(
      crewDetourOptions(run).length,
      0,
      'no detours during a briefing',
    )
    run = completeMission(run)
    assert.ok(crewDetourOptions(run).includes(member.id))
    const detour = beginCrewDetour(run, member.id)
    assert.equal(detour.phase, 'crew-quest')
    assert.equal(
      detourFor(detour)?.system,
      CREW_JOURNEYS[member.id][chapter - 1]!.system,
    )
    assert.equal(
      beginCrewDetour(detour, member.id),
      detour,
      'no double departure',
    )
    const saved = restoreVoyage(JSON.parse(JSON.stringify(detour)))
    assert.deepEqual(saved, detour, 'mid-quest resume is stable')
    const firstAct = stageCrewDetour(detour, chapter === 2 ? 'bold' : 'careful')
    assert.equal(firstAct.detour?.gambit, chapter === 2 ? 'bold' : 'careful')
    assert.ok(firstAct.scene.includes(detourFor(firstAct)!.reversal))
    assert.equal(
      stageCrewDetour(firstAct, 'bold'),
      firstAct,
      'cannot stage twice',
    )
    assert.deepEqual(
      restoreVoyage(JSON.parse(JSON.stringify(firstAct))),
      firstAct,
    )
    const resolved = resolveCrewDetour(firstAct, 'bold')
    assert.equal(
      resolved.journeyHistory?.at(-1)?.prize,
      detourFor(firstAct)!.prize,
    )
    assert.ok(resolved.scene.includes(detourFor(firstAct)!.boldOutcome))
    worldStops.push(resolved.journeyHistory!.at(-1)!.system)
    assert.equal(resolved.phase, 'debrief')
    assert.equal(resolved.journeyProgress![member.id], chapter)
    assert.equal(resolved.detourChapter, chapter)
    assert.deepEqual(
      crewDetourOptions(resolved),
      [],
      'one route stop per chapter',
    )
    assert.equal(
      resolveCrewDetour(resolved, 'bold'),
      resolved,
      'cannot double-award a step',
    )
    assert.equal(
      beginCrewDetour(resolved, member.id),
      resolved,
      'cannot farm a route',
    )
    assert.deepEqual(
      restoreVoyage(JSON.parse(JSON.stringify(resolved))),
      resolved,
    )
    run = chapter < 3 ? nextDestination(resolved) : toFinale(resolved)
  }
  assert.equal(new Set(worldStops).size, 3)
  assert.equal(run.phase, 'finale')
  assert.ok(finishVoyage(run, 'protect').scene.includes('Quill deposits'))
  assert.ok(finishVoyage(run, 'protect').scene.includes(member.name))
}
// A full crew arc unlocks enemy-specific council action only for a matching nemesis.
for (const enemy of ANTAGONISTS) {
  const selected = NEMESIS_COUNTERPLAY[enemy.id]![0]!
  const seed = Array.from({ length: 800 }, (_, n) => n + 1).find(
    (n) =>
      antagonistFor(
        startVoyage(
          'vale',
          [
            selected,
            ...CREW.filter((c) => c.id !== selected)
              .slice(0, 2)
              .map((c) => c.id),
          ],
          n,
        ),
      ).id === enemy.id,
  )!
  assert.ok(seed > 0, enemy.id)
  let run = startVoyage(
    'vale',
    [
      selected,
      ...CREW.filter((c) => c.id !== selected)
        .slice(0, 2)
        .map((c) => c.id),
    ],
    seed,
  )
  assert.equal(counterCrew(run).length, 0)
  for (let i = 0; i < 3; i++) {
    run = completeMission(run)
    run = beginCrewDetour(run, selected)
    assert.equal(run.phase, 'crew-quest')
    run = resolveCrewDetour(run, 'bold')
    if (i < 1) assert.equal(counterCrew(run).length, 0)
    else assert.ok(counterCrew(run).includes(selected))
    run = i < 2 ? nextDestination(run) : toFinale(run)
  }
  assert.equal(run.phase, 'finale')
  const ended = finishVoyage(run, 'counter')
  assert.equal(ended.phase, 'ending')
  assert.ok(ended.scene.includes('witnesses'))
  assert.notEqual(ended.scene, finishVoyage(run, 'protect').scene)
  assert.ok(
    ended.ending?.includes(enemy.id === 'showrunner' ? 'UNION' : 'WITNESS'),
  )
  assert.equal(finishVoyage(ended, 'counter'), ended, 'cannot replay finale')
}
const unearned = startVoyage('fluke', ['pell', 'mox', 'rue'], 47)
assert.equal(counterCrew(unearned).length, 0)
assert.equal(
  finishVoyage({ ...unearned, phase: 'finale' }, 'counter').phase,
  'finale',
)
const dryRun = {
  ...completeMission(startVoyage('rex', ['pell', 'mox', 'rue'], 99)),
  supplies: 0,
}
const withoutSupplies = beginCrewDetour(dryRun, 'pell')
assert.equal(
  resolveCrewDetour(withoutSupplies, 'careful'),
  withoutSupplies,
  'never spend negative supplies',
)
assert.equal(
  resolveCrewDetour(withoutSupplies, 'bold').phase,
  'debrief',
  'no supply softlock',
)
for (const captain of CAPTAINS) {
  const finale = {
    ...startVoyage(captain.id, ['pell', 'mox', 'rue'], 51),
    phase: 'finale' as const,
  }
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
assert.ok(page.includes('data-testid="couch-grand-quest"'))
assert.ok(page.includes('data-testid="couch-quest-reversal"'))
assert.ok(page.includes('data-testid="couch-crew-plan-careful"'))
assert.ok(page.includes("store.planDetour('bold')"))
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
assert.ok(page.includes('data-testid="space-couch-route-board"'))
assert.ok(page.includes('data-testid="space-couch-world-echo"'))
assert.ok(page.includes('store.chartMission(call.id)'))
assert.ok(page.includes('data-testid="captains-return-day"'))
assert.ok(page.includes('crewProfile(member.id).portraitKey'))
assert.ok(tab.includes('title: Space Couch'))
assert.ok(home.includes("title: 'Space Couch'"))
function arriveAtRelationshipDebrief(
  run: ReturnType<typeof startVoyage>,
  policy: 'aid' | 'observe' | 'intervene' = 'aid',
) {
  let current = launchMission(run)
  assert.equal(current.phase, 'transit')
  while (current.phase === 'transit') current = advanceVoyageDay(current)
  assert.equal(current.phase, 'decision')
  return decidePolicy(current, policy)
}
function romanceStatus(run: ReturnType<typeof startVoyage>) {
  return (run as RomanceVoyage).romance?.status
}
let lovers = arriveAtRelationshipDebrief(
  startVoyage('fluke', ['vela', 'taal', 'omi'], 85),
)
assert.ok(romanceMoment(lovers)?.choices.some((c) => c.id === 'invite-fourple'))
assert.equal(
  romanceStatus(lovers),
  undefined,
  'crew appointment never implies romance',
)
lovers = chooseRomance(lovers, 'invite-fourple')
assert.equal(romanceStatus(lovers), 'invited')
assert.equal(romanceMoment(lovers), null, 'one decision per chapter')
assert.equal(
  chooseRomance(lovers, 'invite-fourple'),
  lovers,
  'double-submit is a no-op',
)
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(lovers))),
  lovers,
  'romantic consent history survives v1 save and reload',
)
lovers = arriveAtRelationshipDebrief(nextDestination(lovers))
assert.ok(romanceMoment(lovers)?.speakers.some((line) => line.name === 'Omi'))
lovers = chooseRomance(lovers, 'listen')
assert.equal(romanceStatus(lovers), 'courting')
lovers = arriveAtRelationshipDebrief(nextDestination(lovers))
assert.ok(romanceMoment(lovers)?.speakers.some((line) => line.name === 'Taal'))
lovers = chooseRomance(lovers, 'commit')
assert.equal(romanceStatus(lovers), 'committed')
assert.equal((lovers as RomanceVoyage).romance?.history.length, 3)
lovers = toFinale(lovers)
assert.equal(lovers.phase, 'finale')
const galacticEnding = finishVoyage(lovers, 'protect')
const loveEnding = relationshipEpilogue(galacticEnding)
assert.equal(
  loveEnding.ending,
  galacticEnding.ending,
  'romance never overwrites galactic fate',
)
assert.ok(
  loveEnding.scene.includes('Vela') &&
    loveEnding.scene.includes('Taal') &&
    loveEnding.scene.includes('Omi'),
)
assert.deepEqual(
  relationshipEpilogue(loveEnding),
  loveEnding,
  'epilogue is idempotent',
)
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(loveEnding))),
  loveEnding,
)

let pressure = arriveAtRelationshipDebrief(
  startVoyage('quill', ['vela', 'taal', 'omi'], 96),
)
pressure = chooseRomance(pressure, 'invite-fourple')
pressure = arriveAtRelationshipDebrief(nextDestination(pressure))
const noPressurePenalty = {
  supplies: pressure.supplies,
  trust: pressure.trust,
  crew: [...pressure.crew],
}
pressure = chooseRomance(pressure, 'press')
assert.equal(romanceStatus(pressure), 'rejected')
assert.deepEqual(
  { supplies: pressure.supplies, trust: pressure.trust, crew: pressure.crew },
  noPressurePenalty,
  'romantic rejection leaves command resources and staffing alone',
)
assert.equal(
  romanceMoment(arriveAtRelationshipDebrief(nextDestination(pressure))),
  null,
)

let disengage = arriveAtRelationshipDebrief(
  startVoyage('vale', ['vela', 'taal', 'omi'], 117),
)
disengage = chooseRomance(disengage, 'friends')
assert.equal(romanceStatus(disengage), 'friends')
assert.equal((disengage as RomanceVoyage).romance?.route, 'none')
assert.equal(
  romanceMoment(arriveAtRelationshipDebrief(nextDestination(disengage))),
  null,
)

let coldCaptain = arriveAtRelationshipDebrief(
  startVoyage('rex', ['vela', 'taal', 'omi'], 13),
  'intervene',
)
coldCaptain = chooseRomance(coldCaptain, 'invite-fourple')
coldCaptain = arriveAtRelationshipDebrief(
  nextDestination(coldCaptain),
  'intervene',
)
coldCaptain = chooseRomance(coldCaptain, 'listen')
assert.equal(
  romanceStatus(coldCaptain),
  'rejected',
  'ethical and trust choices can end a courtship',
)

for (const [crew, invite] of [
  [['rue', 'pell', 'mox'], 'invite-rue'],
  [['tess', 'pell', 'mox'], 'invite-tess'],
] as const) {
  let solo = arriveAtRelationshipDebrief(startVoyage('solace', [...crew], 65))
  assert.ok(romanceMoment(solo)?.choices.some((c) => c.id === invite))
  solo = chooseRomance(solo, invite as RomanceChoiceId)
  solo = arriveAtRelationshipDebrief(nextDestination(solo), 'aid')
  solo = chooseRomance(solo, 'listen')
  assert.equal(romanceStatus(solo), 'courting')
  solo = arriveAtRelationshipDebrief(nextDestination(solo), 'aid')
  solo = chooseRomance(solo, 'part')
  assert.equal(romanceStatus(solo), 'separated')
  const epilogue = relationshipEpilogue(finishVoyage(toFinale(solo), 'protect'))
  assert.ok(
    epilogue.log.some((entry) => entry.startsWith('Relationship epilogue: ')),
  )
}

let noRomance = arriveAtRelationshipDebrief(
  startVoyage('ro', ['pell', 'mox', 'jex'], 29),
)
assert.ok(
  romanceMoment(noRomance)?.choices.some(
    (choice) => choice.id === 'invite-pell',
  ),
)
assert.ok(
  romanceMoment(noRomance)?.choices.some(
    (choice) => choice.id === 'invite-pair:pell:mox',
  ),
)
assert.equal(chooseRomance(noRomance, 'commit'), noRomance)
noRomance = chooseRomance(noRomance, 'friends')
assert.equal(romanceMoment(noRomance), null)
noRomance = nextDestination(noRomance)
assert.equal(noRomance.phase, 'briefing')

assert.ok(page.includes('data-testid="space-couch-romance-scene"'))
assert.ok(page.includes('data-romance-choice'))
assert.ok(page.includes('romanceScene.speakers'))
// Every current adult officer has a distinct complete three-chapter relationship.
// Six two-crew arcs cover the entire roster, without replacing the four-person path.
assert.equal(SOLO_ROMANCE_ROUTES.length, CREW.length)
assert.equal(PAIR_ROMANCE_ROUTES.length, 6)
assert.deepEqual(
  new Set(SOLO_ROMANCE_ROUTES.map((story) => story.id)),
  new Set(CREW.map((crew) => crew.id)),
)
const pairedPeople = new Set(
  PAIR_ROMANCE_ROUTES.flatMap((story) => story.people),
)
assert.deepEqual(pairedPeople, new Set(CREW.map((crew) => crew.id)))
assert.equal(ROMANCE_STORIES.length, 19)
for (const story of ROMANCE_STORIES) {
  assert.ok(
    story.chapter2.speakers.length >= 1 && story.chapter3.speakers.length >= 1,
  )
  assert.ok(story.negotiation.length > 60)
  assert.ok(story.ending.length > 55 && story.separation.length > 35)
  assert.ok(story.portraitKeys.length === story.people.length)
  assert.ok(new Set(story.people).size === story.people.length)
  assert.ok(story.people.every((id) => CREW.some((crew) => crew.id === id)))
  const team = [
    ...new Set([...story.people, ...CREW.map((member) => member.id)]),
  ].slice(0, 3)
  let voyage = arriveAtRelationshipDebrief(startVoyage('solace', team, 61))
  const invite = `invite-${story.id}` as RomanceChoiceId
  assert.ok(
    romanceMoment(voyage)?.choices.some((c) => c.id === invite),
    story.id,
  )
  voyage = chooseRomance(voyage, invite)
  assert.equal(romanceStatus(voyage), 'invited')
  assert.equal(chooseRomance(voyage, invite), voyage)
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(voyage))), voyage)
  voyage = arriveAtRelationshipDebrief(nextDestination(voyage), 'aid')
  assert.equal(romanceMoment(voyage)?.title, story.chapter2.title)
  voyage = chooseRomance(voyage, 'listen')
  assert.equal(romanceStatus(voyage), 'courting', story.id)
  voyage = arriveAtRelationshipDebrief(nextDestination(voyage), 'aid')
  assert.equal(romanceMoment(voyage)?.title, story.chapter3.title)
  voyage = chooseRomance(voyage, 'commit')
  assert.equal(romanceStatus(voyage), 'committed', story.id)
  assert.equal((voyage as RomanceVoyage).romance?.history.length, 3)
  const original = finishVoyage(toFinale(voyage), 'protect')
  const epilogue = relationshipEpilogue(original)
  assert.equal(epilogue.ending, original.ending)
  assert.ok(epilogue.scene.includes(story.ending), story.id)
  assert.ok(epilogue.scene.includes('Solace'))
  assert.deepEqual(relationshipEpilogue(epilogue), epilogue)
  assert.deepEqual(
    restoreVoyage(JSON.parse(JSON.stringify(epilogue))),
    epilogue,
  )
  // Romance cannot remove staff, supplies or command trust, even on rupture.
  let rupture = arriveAtRelationshipDebrief(startVoyage('solace', team, 72))
  rupture = chooseRomance(rupture, invite)
  rupture = arriveAtRelationshipDebrief(nextDestination(rupture))
  const previousStats = [rupture.supplies, rupture.trust, ...rupture.crew]
  rupture = chooseRomance(rupture, 'press')
  assert.equal(romanceStatus(rupture), 'rejected')
  assert.deepEqual(
    [rupture.supplies, rupture.trust, ...rupture.crew],
    previousStats,
  )
  assert.equal(
    romanceMoment(arriveAtRelationshipDebrief(nextDestination(rupture))),
    null,
  )
}
// Earlier saves with a single Rue or Tess route continue to resolve after expansion.
for (const legacy of ['rue', 'tess'] as const) {
  const saved = {
    ...startVoyage('fluke', [legacy, 'pell', 'mox'], 42),
    romance: {
      route: legacy,
      status: 'invited',
      lastChapter: 1,
      result: 'A conversation without coercion',
      history: ['A conversation without coercion'],
    },
  }
  assert.deepEqual(restoreVoyage(JSON.parse(JSON.stringify(saved))), saved)
}

// Act II, Unwelcome Responsibility: twelve more calls on three more boards,
// played after Act I, reading Act I's flags and leaving flags of their own.
assert.equal(ACT_TWO_MISSIONS.length, 12)
assert.equal(ACT_TWO_BOARDS.length, 3)
assert.equal(VOYAGE_CHAPTERS, 6)
assert.deepEqual(
  [...new Set(ACT_TWO_BOARDS.flat())].sort(),
  ACT_TWO_MISSIONS.map((m) => m.id).sort(),
)
for (const system of ['Concord Freehold', 'Courtesy Twins', 'Sesh Foundry'])
  assert.ok(
    ACT_TWO_MISSIONS.some((m) => m.system === system),
    system,
  )
const actOneFlags = new Set(
  Object.values(ACT_ONE_CONSEQUENCES).flatMap((c) =>
    Object.values(c).map((x) => x.flag),
  ),
)
const actTwoFlags = new Set(
  Object.values(ACT_TWO_CONSEQUENCES).flatMap((c) =>
    Object.values(c).map((x) => x.flag),
  ),
)
assert.equal(actTwoFlags.size, 36, 'every Act II order leaves its own flag')
for (const flag of actTwoFlags) assert.ok(!actOneFlags.has(flag), flag)
for (const flag of Object.keys(ACT_TWO_ECHOES))
  assert.ok(actTwoFlags.has(flag), flag)
for (const mission of ACT_TWO_MISSIONS) {
  const id = mission.id
  assert.ok(mission.briefing.length > 200, id)
  assert.ok(mission.dilemma.length > 120 && mission.note.length > 30, id)
  assert.equal(new Set(Object.values(ACT_TWO_ORDERS[id])).size, 3, id)
  for (const outcome of Object.values(ACT_TWO_CONSEQUENCES[id]))
    assert.ok(outcome.text.length > 80, id)
  assert.ok(
    MISSION_RULES.some((rule) => rule.id === id),
    id,
  )
  const asides = Object.entries(ACT_TWO_ABOARD[id])
  assert.ok(asides.length >= 3, id)
  assert.ok(asides.every(([crewId]) => CREW.some((c) => c.id === crewId)))
  const callbacks = MISSION_CALLBACKS[id] ?? []
  assert.ok(callbacks.length >= 2, `${id} reads earlier choices`)
  const earlier = new Set([
    ...actOneFlags,
    ...ACT_TWO_MISSIONS.filter((m) => m.chapter < mission.chapter).flatMap(
      (m) => Object.values(ACT_TWO_CONSEQUENCES[m.id]).map((x) => x.flag),
    ),
  ])
  for (const callback of callbacks)
    assert.ok(earlier.has(callback.flag), `${id} reads ${callback.flag}`)
  assert.ok(
    callbacks.some((c) => c.odds > 0) && callbacks.some((c) => c.odds < 0),
    `${id} remembers both kindness and harm`,
  )
}
for (const enemy of ANTAGONISTS) {
  const threat = ACT_TWO_NEMESIS[enemy.id]
  assert.ok(ACT_TWO_MISSIONS.some((m) => m.id === threat.missionId))
  assert.equal(new Set(ACT_TWO_MOVES[enemy.id]).size, 3)
  for (let chapter = 4; chapter <= 6; chapter++)
    assert.equal(
      nemesisMove(enemy, chapter),
      ACT_TWO_MOVES[enemy.id][chapter - 4],
    )
  assert.equal(nemesisMove(enemy, 2), enemy.acts[1])
}
assert.equal(
  new Set(Object.values(ACT_TWO_NEMESIS).map((t) => t.missionId)).size,
  8,
  'each nemesis contaminates its own Act II call',
)

function play(
  run: ReturnType<typeof startVoyage>,
  missionId: string,
  policy: 'aid' | 'observe' | 'intervene',
) {
  assert.ok(
    missionBoard(run).some((m) => m.id === missionId),
    `${missionId} is on the chapter ${run.chapter} board`,
  )
  run = staffed(chooseMission(run, missionId))
  assert.equal(missionFor(run).id, missionId)
  run = launchMission(run)
  while (run.phase === 'transit') run = advanceVoyageDay(run)
  assert.equal(run.phase, 'decision')
  run = decidePolicy(run, policy)
  assert.equal(run.phase, 'debrief')
  assert.ok(
    run.scene.includes(VOYAGE_CONSEQUENCES_TEXT(missionId, policy)),
    missionId,
  )
  return run
}
function VOYAGE_CONSEQUENCES_TEXT(
  missionId: string,
  policy: 'aid' | 'observe' | 'intervene',
) {
  return ((
    ACT_TWO_CONSEQUENCES as Record<string, Record<string, { text: string }>>
  )[missionId] ??
    (ACT_ONE_CONSEQUENCES as Record<string, Record<string, { text: string }>>)[
      missionId
    ])![policy]!.text
}
/** Sends every officer who is fit for duty. */
function staffed(run: ReturnType<typeof startVoyage>) {
  const today = run.day ?? run.chapter
  return assignAwayTeam(
    run,
    run.crew.filter((id) => (run.injuredUntil?.[id] ?? 0) <= today),
  )
}
const oddsWithout = (run: ReturnType<typeof startVoyage>) =>
  previewMission({ ...run, worldFlags: [] }).chance

// Voyage A: union-minded crew. Act I flags open and sweeten Act II calls.
let unionVoyage = startVoyage('vale', ['pell', 'mox', 'rue'], 310)
unionVoyage = play(unionVoyage, 'ashdock', 'aid')
unionVoyage = play(nextDestination(unionVoyage), 'nacre', 'aid')
unionVoyage = play(nextDestination(unionVoyage), 'gameworld', 'aid')
unionVoyage = nextDestination(unionVoyage)
assert.equal(unionVoyage.phase, 'briefing')
assert.equal(unionVoyage.chapter, 4)
assert.ok(unionVoyage.scene.startsWith('ACT II'))
assert.equal(missionFor(unionVoyage).id, 'concord-intake')
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(unionVoyage))),
  unionVoyage,
  'an Act II save restores under the v1 key',
)
const unionBoard = missionBoard(unionVoyage).map((m) => m.id)
assert.deepEqual(unionBoard, [
  'concord-intake',
  'courtesy-reactor',
  'sesh-backups',
])
assert.deepEqual(
  earnedCallbacks('concord-intake', unionVoyage.worldFlags!).map((c) => c.flag),
  ['nacre-hearing'],
)
assert.equal(
  previewMission(staffed(unionVoyage)).chance,
  Math.min(94, oddsWithout(staffed(unionVoyage)) + 8),
  'helping Nacre in Act I improves the Concord odds',
)
unionVoyage = play(unionVoyage, 'concord-intake', 'intervene')
assert.ok(unionVoyage.worldFlags!.includes('concord-guardian'))
unionVoyage = nextDestination(unionVoyage)
assert.ok(worldEcho(unionVoyage).includes('birthday'))
assert.equal(
  missionBoard(unionVoyage).some((m) => m.id === 'hoa'),
  false,
  'nobody aboard knows the Windglass sanctuary',
)
unionVoyage = staffed(chooseMission(unionVoyage, 'warranty'))
assert.equal(
  previewMission(unionVoyage).chance,
  Math.min(94, oddsWithout(unionVoyage) + 8),
)
unionVoyage = play(unionVoyage, 'warranty', 'aid')
unionVoyage = nextDestination(unionVoyage)
assert.ok(missionBoard(unionVoyage).some((m) => m.id === 'merger'))
unionVoyage = play(unionVoyage, 'merger', 'aid')
assert.equal(unionVoyage.worldFlags!.length, 6)
unionVoyage = nextDestination(unionVoyage)
assert.equal(unionVoyage.phase, 'finale')
const unionEnding = finishVoyage(unionVoyage, 'protect')
for (const system of [
  'Ashdock Shipyards',
  'Concord Freehold',
  'Nacre Assembly',
])
  assert.ok(unionEnding.scene.includes(system), system)
assert.ok(unionEnding.scene.includes('eleven degrees'))
assert.deepEqual(
  restoreVoyage(JSON.parse(JSON.stringify(unionEnding))),
  unionEnding,
)

// Voyage B: the same seed, a sanctuary crew and a careless broadcast.
let sanctuaryVoyage = startVoyage('vale', ['tess', 'kivo', 'vela'], 310)
sanctuaryVoyage = play(sanctuaryVoyage, 'windglass', 'intervene')
sanctuaryVoyage = play(nextDestination(sanctuaryVoyage), 'haleth', 'aid')
sanctuaryVoyage = play(nextDestination(sanctuaryVoyage), 'rootborne', 'aid')
sanctuaryVoyage = nextDestination(sanctuaryVoyage)
const sanctuaryBoard = missionBoard(sanctuaryVoyage).map((m) => m.id)
assert.notDeepEqual(sanctuaryBoard, unionBoard)
assert.ok(sanctuaryBoard.includes('serendipity-tab'))
assert.ok(!sanctuaryBoard.includes('sesh-backups'))
sanctuaryVoyage = staffed(chooseMission(sanctuaryVoyage, 'courtesy-reactor'))
assert.equal(
  previewMission(sanctuaryVoyage).chance,
  Math.max(5, oddsWithout(sanctuaryVoyage) - 6),
  'the Windglass broadcast follows the couch to the Twins',
)
sanctuaryVoyage = play(sanctuaryVoyage, 'courtesy-reactor', 'aid')
sanctuaryVoyage = nextDestination(sanctuaryVoyage)
sanctuaryVoyage = staffed(chooseMission(sanctuaryVoyage, 'hoa'))
assert.equal(
  previewMission(sanctuaryVoyage).chance,
  Math.max(5, oddsWithout(sanctuaryVoyage) - 10),
)
sanctuaryVoyage = staffed(chooseMission(sanctuaryVoyage, 'insult-compiler'))
assert.equal(
  previewMission(sanctuaryVoyage).chance,
  Math.min(94, oddsWithout(sanctuaryVoyage) + 10),
  'a reactor repaired with consent earns the Twins’ benefit of the doubt',
)
sanctuaryVoyage = play(sanctuaryVoyage, 'insult-compiler', 'observe')
sanctuaryVoyage = nextDestination(sanctuaryVoyage)
sanctuaryVoyage = play(sanctuaryVoyage, 'gig-orchard', 'intervene')
const sanctuaryEnding = finishVoyage(
  nextDestination(sanctuaryVoyage),
  'protect',
)
assert.ok(sanctuaryEnding.scene.includes('Courtesy Twins'))
assert.ok(sanctuaryEnding.scene.includes('Courier of the Month'))
assert.notEqual(sanctuaryEnding.scene, unionEnding.scene)

// A seeded nemesis also controls one Act II call.
const queenAtConcord = {
  ...staffed(startVoyage('ro', ['rue', 'fen', 'taal'], 5)),
  chapter: 4,
  missionId: 'concord-intake',
  antagonist: ANTAGONISTS.findIndex((a) => a.id === 'moth'),
}
assert.equal(
  previewMission(queenAtConcord).chance,
  Math.max(
    5,
    previewMission({
      ...queenAtConcord,
      antagonist: ANTAGONISTS.findIndex((a) => a.id === 'auditor'),
    }).chance - 8,
  ),
)
// Save bounds: six chapters, and each call only on its own board.
assert.ok(restoreVoyage({ ...queenAtConcord }))
assert.equal(restoreVoyage({ ...queenAtConcord, chapter: 7 }), null)
assert.equal(
  restoreVoyage({ ...queenAtConcord, chapter: 5 }),
  null,
  'a chapter 4 call cannot be resumed in chapter 5',
)
// A pre-Act II save at the end of chapter 3 continues into Act II.
const legacyDebrief = {
  ...completeMission(startVoyage('rex', ['pell', 'mox', 'jex'], 4)),
  chapter: 3,
  missionId: 'bar',
}
delete (legacyDebrief as Partial<typeof legacyDebrief>).worldFlags
const resumed = nextDestination(
  restoreVoyage(JSON.parse(JSON.stringify(legacyDebrief)))!,
)
assert.equal(resumed.chapter, 4)
assert.equal(missionFor(resumed).id, 'concord-intake')
assert.ok(page.includes('data-testid="space-couch-callbacks"'))
assert.ok(page.includes('v-for="n in VOYAGE_CHAPTERS"'))
assert.ok(page.includes('nemesisLine'))

const gameStore = fromRoot('stores/gameOfCaptainsStore.ts')
assert.ok(gameStore.includes('relationshipEpilogue(finishVoyage('))
assert.ok(gameStore.includes('run.value = applyRomanceChoice('))
assert.ok(gameStore.includes("const SAVE_KEY = 'game-of-captains-voyage-v1'"))

// Every picture slot carries an authored Krea 2 prompt; mission and ending scenes show the couch.
const slotKeys = [
  ...CAPTAINS.map((c) => captainArtKey(c.id)),
  ...CREW.map((c) => crewArtKey(c.portraitKey)),
  ...MISSIONS.map((m) => missionArtKey(m.id)),
  ...ANTAGONISTS.map((a) => antagonistArtKey(a.id)),
  ...WARP_ENDINGS.map((e) => endingArtKey(e)),
]
for (const key of slotKeys) {
  const prompt = warpArtPrompt(key)
  assert.ok(prompt && prompt.length >= 120 && prompt.length <= 900, key)
}
assert.equal(new Set(Object.values(WARP_ART_PROMPTS)).size, slotKeys.length)
for (const key of slotKeys.filter((k) => /^(missions|endings)\//.test(k)))
  assert.ok(
    /couch|bar with/i.test(warpArtPrompt(key)!),
    `${key} shows the couch or the bar`,
  )

console.log('Space Couch seeded voyage and highlight contract: OK')
