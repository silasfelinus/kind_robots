import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { HALL_GAMES } from '../arcade/games'
import {
  arcadeShareTargets,
  namesThisCabinet,
  readShareTags,
  unfurlProblems,
} from '../arcade/shareCheck'

const titleArt = new Set<string>()
for (const game of HALL_GAMES) {
  assert.match(
    game.titleArt,
    /^\/[\w./-]+\.(webp|png|jpe?g)$/,
    `${game.slug}: title art is a root-relative raster path`,
  )
  assert.ok(!titleArt.has(game.titleArt), `${game.slug}: title art is its own`)
  titleArt.add(game.titleArt)
}

const hall = readFileSync('components/arcade/arcade-hall.vue', 'utf8')
assert.match(
  hall,
  /@error="onArtError\(game\.slug\)"/,
  'a missing title art falls back',
)
assert.match(
  hall,
  /FALLBACK_ART/,
  'the hall keeps an image-shaped fallback slot',
)

const targets = arcadeShareTargets('https://kindrobots.org/')
assert.equal(targets.length, HALL_GAMES.length)
const pipe = targets.find((target) => target.slug === 'pipe-pals')!
assert.equal(pipe.pageUrl, 'https://kindrobots.org/play/arcade?game=pipe-pals')
assert.equal(
  pipe.artUrl,
  'https://kindrobots.org' +
    HALL_GAMES.find((game) => game.slug === 'pipe-pals')!.titleArt,
)
for (const target of targets.filter(
  (entry) => HALL_GAMES.find((game) => game.slug === entry.slug)?.route,
))
  assert.ok(
    !target.pageUrl.includes('?game='),
    `${target.slug} uses its own page`,
  )

const html = `<head>
<meta property="og:title" content="Pipe Pals &amp; friends · Kind Robots Arcade">
<meta name="description" content="site default">
<meta property='og:description' content="Connect the pipes before the water arrives in this free arcade cabinet.">
<meta content="https://kindrobots.org/images/arcade/games/pipe-pals-title.webp" property="og:image">
<meta name="twitter:card" content="summary_large_image">
<meta property="og:title" content="A later duplicate">
</head>`
const tags = readShareTags(html)
assert.equal(tags['og:title'], 'Pipe Pals & friends · Kind Robots Arcade')
assert.equal(
  tags['og:image'],
  'https://kindrobots.org/images/arcade/games/pipe-pals-title.webp',
)
assert.deepEqual(unfurlProblems(tags), [])
assert.ok(namesThisCabinet(tags, { title: 'Pipe Pals' }))
assert.ok(
  !namesThisCabinet({ 'og:title': 'The Arcade' }, { title: 'Pipe Pals' }),
)
assert.deepEqual(
  unfurlProblems({ 'og:title': 'The Arcade', 'og:image': '/arcade/x.svg' }),
  [
    'og:description under 40 chars',
    'og:image is not absolute',
    'missing twitter:card',
  ],
)

console.log('Arcade share check contract passed.')
