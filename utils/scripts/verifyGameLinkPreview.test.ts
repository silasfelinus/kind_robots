import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { ARCADE_GAMES } from '../arcade/games'
import {
  GAME_LINK_PREVIEWS,
  arcadeCabinetLinkPreviewMeta,
  gameLinkPreviewMeta,
  publicTankLinkPreviewMeta,
} from '../gameLinkPreview'

const pub = join(process.cwd(), 'public')
for (const [slug, p] of Object.entries(GAME_LINK_PREVIEWS)) {
  assert.ok(p.title.length > 0 && p.title.length <= 70, `${slug}: title length`)
  assert.ok(
    p.description.length >= 40 && p.description.length <= 200,
    `${slug}: description length`,
  )
  assert.ok(/\.(webp|png|jpe?g)$/.test(p.image), `${slug}: raster image only`)
  assert.ok(existsSync(join(pub, p.image)), `${slug}: image missing ${p.image}`)
}

// These front doors have their own designed cards, never the site icon.
for (const slug of [
  'sliding-tile-gallery',
  'brainstorm',
  'mandarin',
  'music-mentor',
  'coloring-page',
  'video-generator',
  'daily-pitches',
  'hybridizer',
  'comic-studio',
  'art-archive',
  'tzaddik-gallery',
  'challenge-leaderboard',
  'arcade',
  'aquarium-leaderboard',
  'crystal-street',
  'emperor-of-dust',
  'rainbow-bullet-hell-space-princess',
  'save-the-plumber',
  'zuzu-ghost-trail',
  'game-of-captains',
  'comet-city-academy',
  'zuzu-gamebook',
  'zuzu-shifting-lands',
  'slime-city-pvp',
]) {
  assert.equal(
    GAME_LINK_PREVIEWS[slug]?.image,
    `/${slug}/link-preview.webp`,
    `${slug}: designed preview card`,
  )
}

const meta = gameLinkPreviewMeta('ecotone', 'https://kindrobots.org/')
assert.equal(meta?.ogUrl, 'https://kindrobots.org/play/ecotone')
assert.equal(
  meta?.ogImage,
  'https://kindrobots.org/ecotone/scenes/prologue-meadow.webp',
)
assert.equal(meta?.twitterCard, 'summary_large_image')
assert.equal(
  gameLinkPreviewMeta('ban-meme', 'https://kindrobots.org/')?.ogUrl,
  'https://kindrobots.org/ban-meme',
)
assert.equal(gameLinkPreviewMeta('nope', 'https://x.test'), null)
assert.equal(
  gameLinkPreviewMeta('aquarium', 'https://kindrobots.org')?.ogUrl,
  'https://kindrobots.org/play/aquarium/browse',
)

// Every previewed page must actually call gameLinkPreviewMeta with its slug.
const pageFor: Record<string, string> = {
  aquarium: 'pages/play/aquarium/browse/index.vue',
  'aquarium-leaderboard': 'pages/play/aquarium/leaderboard/index.vue',
  'butterfly-gallery': 'pages/butterfly-gallery.vue',
  mandarin: 'pages/play/mandarin/index.vue',
  arcade: 'pages/play/arcade/index.vue',
  'ban-meme': 'pages/ban-meme.vue',
  brainstorm: 'pages/brainstorm.vue',
  'music-mentor': 'pages/music-mentor.vue',
  'coloring-page': 'pages/coloring-page.vue',
  'daily-pitches': 'pages/play/daily-pitches/index.vue',
  'comic-studio': 'pages/play/comics/studio.vue',
  'challenge-leaderboard': 'pages/play/challenges/leaderboard.vue',
  'tzaddik-gallery': 'pages/tzaddik-gallery.vue',
  'art-archive': 'pages/art-archive.vue',
}
for (const slug of Object.keys(GAME_LINK_PREVIEWS)) {
  const file = pageFor[slug] ?? `pages/play/${slug}.vue`
  const src = readFileSync(join(process.cwd(), file), 'utf8')
  assert.ok(
    src.includes(`'${slug}'`) && src.includes('gameLinkPreviewMeta'),
    `${slug}: ${file} does not wire its link preview`,
  )
}
// A shared ?game= link unfurls as that cabinet, not the generic hall card.
for (const game of ARCADE_GAMES) {
  const card = arcadeCabinetLinkPreviewMeta(game, 'https://kindrobots.org/')
  assert.ok(card.ogTitle.length <= 70, `${game.slug}: cabinet title length`)
  assert.ok(
    card.ogDescription.length >= 40 && card.ogDescription.length <= 200,
    `${game.slug}: cabinet description length`,
  )
  assert.match(card.ogImage, /\.(webp|png|jpe?g)$/, `${game.slug}: raster art`)
  assert.ok(card.ogImage.startsWith('https://'), `${game.slug}: absolute art`)
  assert.equal(
    card.ogUrl,
    `https://kindrobots.org/play/arcade?game=${encodeURIComponent(game.slug)}`,
  )
}
const pipePals = ARCADE_GAMES.find((game) => game.slug === 'pipe-pals')!
const pipeCard = arcadeCabinetLinkPreviewMeta(pipePals, 'https://x.test')
assert.equal(pipeCard.ogTitle, 'Pipe Pals | Kind Robots Arcade')
assert.equal(
  pipeCard.ogImage,
  'https://x.test/images/arcade/games/pipe-pals-title.webp',
)
const arcadePage = readFileSync(
  join(process.cwd(), 'pages/play/arcade/index.vue'),
  'utf8',
)
assert.ok(
  arcadePage.includes('arcadeCabinetLinkPreviewMeta('),
  'arcade page wires per-cabinet previews',
)

// Shared public tanks unfurl with the owner's name, never raw markup.
const tank = publicTankLinkPreviewMeta(
  'deep_one',
  'my tank',
  'https://kindrobots.org/',
)
assert.equal(tank.ogTitle, "@deep_one's tank | Cthulhuquarium")
assert.equal(
  tank.ogUrl,
  'https://kindrobots.org/play/aquarium/browse/deep_one/my%20tank',
)
assert.ok(existsSync(join(pub, '/cthulhuquarium-front/hero.webp')))
assert.ok(!('title' in tank), 'tank preview must not override the live title')
const odd = publicTankLinkPreviewMeta('<b>x</b>"', 's', 'https://x.test')
assert.equal(odd.ogTitle, "@bxb's tank | Cthulhuquarium")
assert.equal(
  publicTankLinkPreviewMeta('', 's', 'https://x.test').ogTitle,
  'A public tank | Cthulhuquarium',
)
const tankPage = readFileSync(
  join(process.cwd(), 'pages/play/aquarium/browse/[username]/[slug].vue'),
  'utf8',
)
assert.ok(tankPage.includes('publicTankLinkPreviewMeta('), 'tank page wired')
// Silas, 2026-11-14: share cards must match the games as they ship. A game
// whose Play tab requires sign-in never promises "no account needed", and
// Crystal Street's card counts its real nightmares.
for (const [slug, tab] of [
  ['slime-city', 'slime-city'],
  ['slime-city-pvp', 'slime-city'],
  ['hybridizer', 'hybridizer'],
] as const) {
  const tabSource = readFileSync(
    join(process.cwd(), `content/channels/arcade/${tab}.md`),
    'utf8',
  )
  if (/^requiredPermission: authenticated$/m.test(tabSource)) {
    assert.doesNotMatch(
      GAME_LINK_PREVIEWS[slug]!.description,
      /no account needed/i,
      `${slug}: sign-in game must not promise no account`,
    )
    const card = join(pub, slug, 'link-preview.svg')
    if (existsSync(card)) {
      assert.doesNotMatch(readFileSync(card, 'utf8'), /no account/i)
    }
  }
}
assert.equal(
  GAME_LINK_PREVIEWS['shifting-desks']!.title,
  'Downward Mobility | Kind Robots',
)
assert.doesNotMatch(
  GAME_LINK_PREVIEWS['shifting-desks']!.description,
  /classroom/i,
)
assert.doesNotMatch(
  GAME_LINK_PREVIEWS['emperor-of-dust']!.description,
  /exiles/i,
)
assert.doesNotMatch(
  readFileSync(join(pub, 'emperor-of-dust/link-preview.svg'), 'utf8'),
  /band of exiles|ruined empire/i,
)
const nightmareWords = [
  '',
  'ONE',
  'TWO',
  'THREE',
  'FOUR',
  'FIVE',
  'SIX',
  'SEVEN',
  'EIGHT',
  'NINE',
]
const villainCount = readdirSync(
  join(process.cwd(), 'utils/crystalStreet/villains'),
).filter((file) => file.endsWith('.json')).length
const tens = ['', '', 'TWENTY', 'THIRTY'][Math.floor(villainCount / 10)]
const spelled = [tens, nightmareWords[villainCount % 10]]
  .filter(Boolean)
  .join('-')
assert.ok(
  readFileSync(join(pub, 'crystal-street/poster.svg'), 'utf8').includes(
    `${spelled} NIGHTMARES`,
  ),
  `Crystal Street card must count ${villainCount} nightmares (${spelled})`,
)

console.log('game link preview checks passed')
