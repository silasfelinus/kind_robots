import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  CAPTAINS,
  CREW,
  MISSIONS,
  ANTAGONISTS,
  assignAwayTeam,
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
assert.equal(CREW.length, 6)
assert.equal(MISSIONS.length, 3)
assert.ok(ANTAGONISTS.length >= 3)
for (const captain of CAPTAINS) {
  for (const seed of [1, 2, 2026, 404, 777]) {
    let run = startVoyage(captain.id, ['pell', 'vela', 'rue', 'mox'], seed)
    const antagonist = antagonistFor(run)
    for (let chapter = 1; chapter <= 3; chapter++) {
      assert.equal(run.phase, 'briefing')
      assert.equal(run.chapter, chapter)
      assert.ok(missionFor(run).title)
      assert.equal(antagonistFor(run).id, antagonist.id)
      run = assignAwayTeam(run, ['mox', 'rue'])
      assert.deepEqual(assignAwayTeam(run, ['mox', 'rue', 'pell', 'vela']), run)
      assert.deepEqual(assignAwayTeam(run, ['mox', 'mox']), run)
      assert.deepEqual(assignAwayTeam(run, ['jex']), run)
      const original = JSON.stringify(run)
      run = launchMission(run)
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
const page = fromRoot('pages/play/game-of-captains.vue')
const tab = fromRoot('content/channels/arcade/game-of-captains.md')
const home = fromRoot('components/home/home-visitor-directory.vue')
assert.ok(page.includes('data-layout="console-fixed"'))
assert.ok(page.includes('data-testid="captains-launch"'))
assert.ok(tab.includes('route: /play/game-of-captains'))
assert.ok(
  home.includes("route: '/play/game-of-captains'") &&
    home.includes("route: '/play/comet-city-academy'"),
)
console.log('Game of Captains seeded voyage and highlight contract: OK')
