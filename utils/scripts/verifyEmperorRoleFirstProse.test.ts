import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const STORY_FILES = [
  'followers.ts',
  'followersLate.ts',
  'followersSecret.ts',
  'dailyEventsActOne.ts',
  'endings.ts',
  'factions.ts',
  'items.ts',
  'laws.ts',
  'moles.ts',
  'rooms.ts',
  'relics.ts',
  'board.ts',
  'engine.ts',
  'codex.ts',
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
  'briefings.ts',
  'questBriefsEarly.ts',
  'questBriefsLate.ts',
  'questBriefsChores.ts',
] as const

// Guard prose, not species-locked cast records or positive art prompts.
// Proper faction names such as Storm Crows and Mole Revolutionaries are
// political affiliations, not a license to call an individual "a fox".
const SPECIES_AS_IDENTITY =
  /\b(?:a|an|the|another|two|three|every|each)\s+(?:(?:young|old|elderly|ancient|small|big|lean|thin|heavy|steady|nameless|free|grey-blue|little|taller|dead|snared|black|white|speckled|red)\s+){0,2}(?:koala|fennec(?: fox)?|tortoise|hare|jackal|buffalo|armadillo|raccoon|boar|weasel|otter|rabbit|wolf|owl|magpie|rat|fox|prairie dog|gecko|capybara|rhino|newt(?:-witch)?|leopard|badger|ferret|opossum|porcupine|ibis|antelope|civet|heron|hyena|pelican|hen|sloth|gorilla|moth)(?![-’'])\b/gi

// A faction's proper title is allowed, but a child, courier or prisoner
// must be identified by their role rather than a bare species/faction shorthand.
// The Storm Crow proper faction name is intentionally excluded.
const SPECIES_ROLE = /(?<!Storm\s)\b(?:Mole|Crow)\s+(?:boy|girl|child|children|prisoner|courier|digger|diggers|family|widow|person|people|worker|workers|scout|guard|guards|elder|woman|man|messenger)\b|\b(?:a|an|the)\s+(?:Mole|Crow)\s+(?:goes|walks|asks|says|said|speaks|waits|stands|holds|knows)\b/gi

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
    .replaceAll('the pig turns out to be a boar', 'the pig turns out to be a wild pig')
  const matches = [
    ...namesOnly.matchAll(SPECIES_AS_IDENTITY),
    ...namesOnly.matchAll(SPECIES_ROLE),
  ]
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
assert.match('A hyena captain brought the petition.', singleMatch)
assert.match('A young capybara in a novice robe arrived.', singleMatch)
assert.match('The gecko courier stayed behind.', singleMatch)

const roleMatch = new RegExp(SPECIES_ROLE.source, 'i')
assert.match('The Mole boy whispers at the gate.', roleMatch)
assert.match('Mole family by the east wall.', roleMatch)
assert.match('Two Mole diggers are trapped.', roleMatch)
assert.match('A Crow messenger demands brass.', roleMatch)
assert.match('The Mole goes downstairs.', roleMatch)
assert.doesNotMatch('A Storm Crow messenger requests an audience.', roleMatch)
assert.doesNotMatch('The Mole Revolutionaries hold the galleries.', roleMatch)
assert.doesNotMatch('A goat climbs the stairs; a wild boar crosses the road.', roleMatch)
assert.doesNotMatch('Young Komodo studies a root-knife from the burrows.', roleMatch)

console.log(
  `Role-first Emperor prose contract: ${inspected} source files checked`,
)
