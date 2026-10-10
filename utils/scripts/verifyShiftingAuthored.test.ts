import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { JOURNEY_WORLD, isJourneyState, reachableLocations } from '../shiftingLands/journey'
import {
  AUTHORED_PACK,
  activeAuthoredEncounter,
  authoredOutcomeForLocation,
  newAuthoredJourney,
  restoreAuthoredJourney,
  stepAuthoredJourney,
  validateAuthoredJourney,
  type AuthoredJourneyState,
} from '../shiftingLands/authoredJourney'

const file = (path: string) => fileURLToPath(new URL(path, import.meta.url))
const asset = (path: string) => readFileSync(file(path), 'utf8')
assert.equal(AUTHORED_PACK.schemaVersion, 1)
assert.equal(AUTHORED_PACK.sourceSha.length, 40)
assert.equal(AUTHORED_PACK.encounters.length, 12)
assert.deepEqual(AUTHORED_PACK.locations.map((l) => l.encounter_ids.length), [4,4,4])
assert.ok(AUTHORED_PACK.encounters.every((card) =>
  card.choices.length >= 2 && card.flavor.length >= 90 && card.art === null))
assert.doesNotMatch(JSON.stringify(AUTHORED_PACK), /canon_motivation|world_mysteries|developer_note|locked_character_id/)
assert.ok(asset('../../public/images/shifting-lands/encounter-back.svg').includes('ENCOUNTER'))
assert.ok(asset('../../public/images/shifting-lands/trial-back.svg').includes('TRIAL'))
const flip = asset('../../components/navigation/flip-card.vue')
assert.match(flip, /revealOnTrigger/)
assert.match(flip, /flip-card-reveal/)
assert.match(asset('../../components/shifting-lands-journey-board.vue'), /:reveal-on-trigger="true"/)

const original = newAuthoredJourney(77)
assert.deepEqual(newAuthoredJourney(77), original)
assert.equal(validateAuthoredJourney(original), true)
assert.deepEqual(original.journey, newAuthoredJourney(77).journey)
assert.strictEqual(stepAuthoredJourney(original, {type: 'CHOOSE',choiceId: 'not-ready'}), original)
const location = reachableLocations(original.journey)[0]!
const opened = stepAuthoredJourney(original, {type: 'TRAVEL',locationId:location})
const selected = activeAuthoredEncounter(opened)!
assert.ok(selected)
assert.equal(selected.locationId,location)
assert.ok(AUTHORED_PACK.locations.find(l => l.location_id === location)!.encounter_ids.includes(selected.id))
assert.ok(validateAuthoredJourney(opened))
assert.deepEqual(restoreAuthoredJourney(JSON.parse(JSON.stringify(opened))),opened)
const choice = selected.choices[0]!
const resolved = stepAuthoredJourney(opened, {type: 'CHOOSE',choiceId: choice.id})
assert.notStrictEqual(resolved,opened)
assert.equal(resolved.journey.resolved.length,1)
assert.equal(resolved.outcomes.length,1)
assert.equal(resolved.outcomes[0]!.encounterId,selected.id)
assert.equal(resolved.outcomes[0]!.choiceId,choice.id)
assert.ok(resolved.journey.journal.some(x=>x.kind==='encounter'&&x.text.includes(choice.label)))
assert.equal(resolved.journey.resolved[0]!.roll?.total,resolved.outcomes[0]!.roll.total)
assert.equal(resolved.journey.resolved[0]!.roll?.dice.join(','),resolved.outcomes[0]!.roll.dice.join(','))
assert.equal(resolved.journey.resolved[0]!.approach,'test')
assert.equal(resolved.journey.rngState,opened.journey.rngState,'authored choice does not secretly consume legacy RNG')
assert.ok(resolved.outcomes[0]!.resultText.length > 25)
assert.deepEqual(restoreAuthoredJourney(JSON.parse(JSON.stringify(resolved))),resolved)
assert.ok(isJourneyState(resolved.journey))
assert.ok(validateAuthoredJourney(resolved))
assert.strictEqual(stepAuthoredJourney(resolved,{type:'CHOOSE',choiceId:choice.id}),resolved)
assert.equal(authoredOutcomeForLocation(resolved,location)?.encounterId,selected.id)
assert.equal(restoreAuthoredJourney({...resolved,packSha:'outdated'}),null)
assert.equal(restoreAuthoredJourney({...resolved,drawn:{...resolved.drawn,[location]:'invented'}}),null)
assert.equal(restoreAuthoredJourney({...resolved,outcomes:[resolved.outcomes[0],resolved.outcomes[0]]}),null)
assert.equal(restoreAuthoredJourney({...resolved,drawRng:-1}),null)

let completeHomesteads=0
const seenIds=new Set<string>()
for(let seed=1;seed<=160;seed++){
  let state:AuthoredJourneyState = newAuthoredJourney(seed)
  for(let turn=0;turn<3&&state.journey.phase==='explore';turn++){
    const next=reachableLocations(state.journey).find((id)=>!state.journey.resolved.some((r)=>r.locationId===id))
    assert.ok(next,'a playable Homestead should always have an unvisited route')
    state=stepAuthoredJourney(state,{type:'TRAVEL',locationId:next})
    const card=activeAuthoredEncounter(state)!
    assert.ok(card)
    seenIds.add(card.id)
    state=stepAuthoredJourney(state,{type:'CHOOSE',choiceId:card.choices[seed%card.choices.length]!.id})
    assert.ok(validateAuthoredJourney(state))
    assert.ok(isJourneyState(state.journey))
    assert.equal(state.outcomes.length,state.journey.resolved.length)
    assert.deepEqual(restoreAuthoredJourney(JSON.parse(JSON.stringify(state))),state)
  }
  if(state.journey.phase==='boss'){
    completeHomesteads++
    assert.equal(state.outcomes.length,3)
    const next=stepAuthoredJourney(state,{type:'BOSS',approach:'challenge'})
    assert.ok(validateAuthoredJourney(next))
  }
}
assert.ok(completeHomesteads>50,'authored choices should allow players to reach the first boss')
assert.ok(seenIds.size>=10,'seeded draws should exercise the authored encounter pool')
assert.equal(JOURNEY_WORLD.lands.length,5)
console.log('Shifting Lands authored V2 integration passed: seeded fixed-cast draws, meaningful checked choices, source-pinned save, clean replay and readable bespoke cards')
