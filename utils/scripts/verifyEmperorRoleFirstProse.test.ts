import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const STORY_FILES = [
  'onboarding.ts',
  'actOne.ts',
  'actOneLate.ts',
  'actTwo.ts',
  'actTwoCallbacks.ts',
  'actThree.ts',
  'actFour.ts',
  'actFive.ts',
  'dailyEvents.ts',
  'chores.ts',
  'market.ts',
  'talks.ts',
  'secretTalks.ts',
  'epilogue.ts',
  'betrayal.ts',
  'questBriefsEarly.ts',
  'questBriefsLate.ts',
  'questBriefsChores.ts',
] as const

// Guard prose, not species-locked cast records or positive art prompts.
// Proper faction names such as Storm Crows and Mole Revolutionaries are
// political affiliations, not a license to call an individual "a fox".
const SPECIES_AS_IDENTITY =
  /\b(?:a|an|the|another|two|three)\s+(?:[a-z][a-z-]*\s+){0,2}(?:koala|fennec|tortoise|hare|jackal|buffalo|armadillo|raccoon|boar|weasel|otter|rabbit|wolf|owl|magpie|rat|fox|prairie dog)\b/gi

let inspected = 0
for (const file of STORY_FILES) {
  const text = readFileSync(
    new URL(`../emperorOfDust/fortress/${file}`, import.meta.url),
    'utf8',
  )
  // These are explicit food or artwork, not labels applied to people.
  const namesOnly = text
    .replaceAll('a snared hare', 'snared game')
    .replaceAll('A jackal’s jaw', 'A metal crest')
    .replaceAll('A small armadillo is scratched', 'A small figure is scratched')
  const matches = [...namesOnly.matchAll(SPECIES_AS_IDENTITY)]
  assert.equal(
    matches.length,
    0,
    `${file}: use a person's name, role, relationship or allegiance instead of ${matches
      .map((match) => JSON.stringify(match[0]))
      .join(', ')}`,
  )
  inspected += 1
}

// Real animals, ordinary livestock, exact art species, and proper faction
// names remain canonical. Test the negative matcher independently.
const singleMatch = new RegExp(SPECIES_AS_IDENTITY.source, 'i')
assert.doesNotMatch(
  'A farmer feeds a goat. Two horses wait at the gate.',
  singleMatch,
)
assert.doesNotMatch(
  'A Storm Crow courier signs the Conclave ledger.',
  singleMatch,
)
assert.match('A koala enters the throne room.', singleMatch)
assert.match('An elderly wolf brought the petition.', singleMatch)

console.log(`Role-first Emperor prose contract: ${inspected} source files checked`)
