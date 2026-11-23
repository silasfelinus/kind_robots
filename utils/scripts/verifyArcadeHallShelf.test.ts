import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HALL_GAMES } from '../arcade/games'
import {
  arcadeCabinetShareLink,
  arcadeScoreShareLink,
  shareButtonLabel,
  arcadeHallShareLink,
  arrangeArcadeHall,
  isGrowingCabinet,
  shareNoteFor,
  shelfRank,
} from '../arcade/hall'

const showcase = HALL_GAMES.filter((game) => game.shelf === 'showcase')
const growing = HALL_GAMES.filter(isGrowingCabinet)

assert.ok(
  showcase.length >= 6,
  'the hall leads with at least six showcase cabinets',
)
assert.ok(
  !showcase.some((game) => game.route),
  'showcase cabinets open in the arcade player',
)
for (const slug of ['pipe-pals', 'prize-show-panic', 'butterfly-blaster'])
  assert.equal(
    HALL_GAMES.find((game) => game.slug === slug)?.shelf,
    'showcase',
    `${slug} finished its depth pass and leads the hall`,
  )
for (const slug of ['petal-post', 'rain-catcher', 'repair-rampage'])
  assert.equal(
    HALL_GAMES.find((game) => game.slug === slug)?.shelf,
    'growing',
    `${slug} still has open depth slices`,
  )

// The featured Superkate cabinet is pinned above the shelves, so select a
// normal growing cabinet when proving that shelf priority beats ratings.
const loudGrowing = growing.find(
  (game) => game.slug !== 'superkate-spectrum',
)!
const quietShowcase = showcase[showcase.length - 1]!
const arranged = arrangeArcadeHall(HALL_GAMES, {
  [loudGrowing.slug]: { average: 5, count: 99 },
})
assert.equal(
  arranged.length,
  HALL_GAMES.length,
  'no cabinet drops out of the hall',
)
assert.equal(
  arranged[0]?.slug,
  'superkate-spectrum',
  'Superkate Spectrum is the first Arcade cabinet regardless of shelf or rating',
)
const ranks = arranged
  .filter((game) => game.slug !== 'superkate-spectrum')
  .map(shelfRank)
assert.deepEqual(
  ranks,
  [...ranks].sort((a, b) => a - b),
  'showcase, then standard, then growing, whatever the ratings',
)
assert.ok(
  arranged.indexOf(quietShowcase) < arranged.indexOf(loudGrowing),
  'an unrated showcase cabinet still leads a top-rated growing one',
)
const growingShelf = arranged.filter(
  (game) => isGrowingCabinet(game) && game.slug !== 'superkate-spectrum',
)
assert.equal(
  growingShelf[0]?.slug,
  loudGrowing.slug,
  'ratings still order cabinets within a shelf',
)

assert.deepEqual(arcadeHallShareLink('https://kindrobots.org'), {
  title: 'Kind Robots Arcade',
  text: 'Free arcade cabinets from Kind Robots. Pick one and press start.',
  url: 'https://kindrobots.org/play/arcade',
})
assert.equal(
  arcadeCabinetShareLink('https://kindrobots.org', {
    slug: 'pipe-pals',
    title: 'Pipe Pals',
  }).url,
  'https://kindrobots.org/play/arcade?game=pipe-pals',
)
const scoreLink = arcadeScoreShareLink(
  'https://kindrobots.org',
  { slug: 'pipe-pals', title: 'Pipe Pals' },
  12345.7,
)
assert.equal(scoreLink.url, 'https://kindrobots.org/play/arcade?game=pipe-pals')
assert.equal(
  scoreLink.text,
  'I scored 12,345 in Pipe Pals at the Kind Robots Arcade. Can you beat it?',
)
assert.equal(shareButtonLabel('', null), 'Share')
assert.equal(shareButtonLabel('', 0), 'Share', 'a zero run shares the cabinet')
assert.equal(shareButtonLabel('', 4200), 'Share my 4,200')
assert.equal(shareButtonLabel('Link copied!', 4200), 'Link copied!')
assert.equal(shareNoteFor('copied'), 'Link copied!')
assert.equal(shareNoteFor('failed'), 'Copy the address bar')
assert.equal(shareNoteFor('shared'), '')
assert.equal(shareNoteFor('cancelled'), '')

const hall = readFileSync('components/arcade/arcade-hall.vue', 'utf8')
assert.match(
  hall,
  /arrangeArcadeHall\(HALL_GAMES/,
  'the hall uses the shelf order',
)
assert.match(
  hall,
  /data-testid="arcade-growing-stamp"/,
  'growing cabinets carry a stamp',
)
assert.match(
  hall,
  /data-testid="arcade-hall-share"/,
  'the hall has its own Share button',
)
assert.match(
  hall,
  /againstmalaria\.com\/amibot/,
  'the AMI link stays in the hall',
)
const page = readFileSync('pages/play/arcade/index.vue', 'utf8')
assert.match(
  page,
  /@scored="runScore = \$event"/,
  'the page hears each finished run',
)
assert.match(page, /arcadeScoreShareLink\(/, 'a finished run shares its score')
assert.match(
  page,
  /runScore\.value = null/,
  'a new cabinet forgets the last run',
)
for (const [name, source] of [
  ['hall', hall],
  ['arcade page', page],
] as const) {
  assert.match(
    source,
    /store\.shareLink\(/,
    `${name} shares through the arcade store`,
  )
  assert.doesNotMatch(
    source,
    /navigator\.(share|clipboard)/,
    `${name} leaves browser share APIs to the store`,
  )
}

console.log('Arcade hall shelf contract passed.')
