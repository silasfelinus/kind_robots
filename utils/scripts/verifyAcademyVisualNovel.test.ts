import assert from 'node:assert/strict'
import {
  chooseNovelNight,
  finishAcademy,
  incidentsFor,
  openingNightFriend,
  restoreAcademy,
  resolveDispatch,
  startFullAcademy,
} from '../cometAcademy/rules'
import { fieldFor } from '../cometAcademy/identityArcs'
import { newTacticalInterlude } from '../cometAcademy/tacticalInterlude'

const lead = 'accident-fire'
const power = fieldFor(lead)
for (const tacticalMissions of [false, true]) {
  for (const nightPatrols of [false, true]) {
    const base = startFullAcademy(power, 21987, lead, 'shelter', 'student', {
      tacticalMissions, nightPatrols,
    })
    assert.equal(base.campaignOptions?.tacticalMissions, tacticalMissions)
    assert.equal(base.campaignOptions?.nightPatrols, nightPatrols)
    assert.ok(restoreAcademy(JSON.parse(JSON.stringify(base))))
    const night = { ...base, day: 4, phase: 'dispatch' as const }
    const cases = incidentsFor(night)
    assert.ok(cases.length > 0)
    const selected = chooseNovelNight(night, cases[0]!.id, 'rescue')
    if (nightPatrols) {
      assert.equal(selected, night, 'manual patrol mode ignores visual-novel choice')
    } else {
      assert.equal(selected.playerCaseId, cases[0]!.id)
      assert.equal(selected.missionApproach, 'rescue')
      assert.equal(selected.nightPatrol, null)
      assert.ok(restoreAcademy(JSON.parse(JSON.stringify(selected))))
      const resolved = resolveDispatch(selected)
      assert.equal(resolved.phase, 'debrief')
      assert.ok(resolved.reports.length > 0)
      assert.ok(resolved.reports.some((entry) => entry.names.includes('YOU')))
      assert.ok(restoreAcademy(JSON.parse(JSON.stringify(resolved))))
      const finale = finishAcademy({ ...resolved, day: 30, phase: 'finale' }, 'share')
      assert.equal(finale.phase, 'ending')
      assert.ok(finale.ending)
    }
    const withCall = { ...night, playerCaseId: cases[0]!.id }
    const tactical = newTacticalInterlude(withCall)
    assert.equal(Boolean(tactical), tacticalMissions)
  }
}
const novel = startFullAcademy(power, 10291, lead, 'unmask', 'student', {
  tacticalMissions: false,
  nightPatrols: false,
})
for (const day of [1, 2, 4, 8, 15, 23, 30]) {
  const night = { ...novel, day, phase: 'dispatch' as const }
  const caseId = incidentsFor(night)[0]!.id
  const prepared = chooseNovelNight(night, caseId, 'rescue')
  assert.equal(prepared.playerCaseId, caseId)
  assert.equal(resolveDispatch(prepared).phase, 'debrief')
}
const friend = openingNightFriend(novel.seed)
const third = { ...novel, day: 3, phase: 'dispatch' as const, contacts: [friend.id] }
const crisis = incidentsFor(third)
assert.equal(crisis.length, 2)
const split = chooseNovelNight(third, crisis[0]!.id, 'split')
const together = chooseNovelNight(third, crisis[0]!.id, 'concentrate')
assert.equal(split.assignments[0]?.caseId, crisis[1]!.id)
assert.equal(together.assignments[0]?.caseId, crisis[0]!.id)
assert.match(resolveDispatch(split).reports.find((entry) => entry.caseId === crisis[1]!.id)!.names, new RegExp(friend.name))
assert.ok(restoreAcademy(JSON.parse(JSON.stringify(split))))
assert.equal(
  chooseNovelNight(third, crisis[0]!.id, 'investigate'),
  third,
  'night three must preserve the authored two-crisis dilemma',
)
const invalid = JSON.parse(JSON.stringify(novel))
invalid.campaignOptions.nightPatrols = 'false'
assert.equal(restoreAcademy(invalid), null)
const oldSave = JSON.parse(JSON.stringify(novel))
delete oldSave.campaignOptions
assert.ok(restoreAcademy(oldSave), 'saves from before the mode selector remain valid')
console.log('Prom of Doom visual-novel mode: four independent options, 30-day outcomes, third-night allocation, tactical guard and old save compatibility.')
