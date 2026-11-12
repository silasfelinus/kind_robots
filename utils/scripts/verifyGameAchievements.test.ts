import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ARCADE_GAMES } from '../arcade/games'
import {
  ACHIEVEMENT_GAMES,
  ACHIEVEMENT_SECTIONS,
  GAME_ACHIEVEMENTS,
  MAIN_GAME_SLUGS,
  TIER_KARMA,
  achievementCode,
  achievementSectionOf,
  achievementsForGame,
  arcadeAchievementsEarned,
  gameAchievementByCode,
  gameAchievementCatalogRows,
  isMainGame,
} from '../achievements/gameAchievements'
import { achievementData } from '../../training/achievementData'

const source = (path: string) => readFileSync(path, 'utf8')

const STANDARD_MAIN_GAMES = [
  'slime-city',
  'weird-humboldt',
  'zuzu-gamebook',
  'zuzu-shifting-lands',
  'emperor-of-dust',
  'rainbow-bullet-hell-space-princess',
  'save-the-plumber',
  'shifting-desks',
  'memory-dungeon',
  'crystal-street',
  'ruler-hooked',
  'cthulhuquarium',
  'comet-city-academy',
  'game-of-captains',
  'every-villain-tactics',
  'monstress-convention',
]
const MAIN_MIN = 12
const MAIN_MAX = 30
const RATCHET_PATH = 'utils/scripts/mainGameAchievementRatchet.json'
const ratchet = JSON.parse(source(RATCHET_PATH)) as Record<string, number>
const mainGames = new Set(MAIN_GAME_SLUGS)

for (const slug of STANDARD_MAIN_GAMES) {
  assert.ok(
    mainGames.has(slug) && isMainGame(slug),
    `${slug} is a main game in the main-game standard and must be marked main.`,
  )
}
for (const [slug, floor] of Object.entries(ratchet)) {
  assert.ok(mainGames.has(slug), `${RATCHET_PATH}: ${slug} is not a main game.`)
  assert.ok(
    Number.isInteger(floor) && floor >= 0 && floor < MAIN_MIN,
    `${RATCHET_PATH}: ${slug} needs a whole count under ${MAIN_MIN}.`,
  )
}
for (const slug of Object.keys(ratchet)) {
  assert.ok(
    STANDARD_MAIN_GAMES.includes(slug),
    `${RATCHET_PATH} only shrinks: ${slug} must start with ${MAIN_MIN} achievements instead.`,
  )
}
for (const slug of MAIN_GAME_SLUGS) {
  assert.ok(
    existsSync(`utils/achievements/catalog/main/${slug}.ts`),
    `${slug} keeps its achievements in utils/achievements/catalog/main/${slug}.ts.`,
  )
  assert.ok(
    source('utils/achievements/catalog/main/index.ts').includes(`'./${slug}'`),
    `catalog/main/index.ts must include ${slug}.`,
  )
}
assert.equal(
  achievementCode({ game: 'save-the-plumber', key: 'k' }),
  'arcade-save-the-plumber-k',
  'Cabinet-born main games keep the arcade code prefix.',
)
assert.equal(
  achievementCode({ game: 'rainbow-bullet-hell-space-princess', key: 'k' }),
  'arcade-rainbow-bullet-hell-space-princess-k',
  'Cabinet-born main games keep the arcade code prefix.',
)
for (const code of [
  'zuzu-gamebook-first-fight-won',
  'zuzu-gamebook-hopeful-ending',
  'zuzu-gamebook-ring-the-bell',
  'zuzu-shifting-lands-open-door',
  'zuzu-shifting-lands-canyon-warden',
  'zuzu-shifting-lands-beyond-the-verge',
  'shifting-desks-survived-review',
  'shifting-desks-sub-level-zero',
  'shifting-desks-faced-the-board',
  'emperor-of-dust-orders-carried-out',
  'emperor-of-dust-day-well-ruled',
  'emperor-of-dust-merciful-court',
]) {
  assert.ok(
    gameAchievementByCode(code),
    `${code} is a live DB row with earned records: never rename or drop it.`,
  )
}

for (const game of ACHIEVEMENT_GAMES) {
  const entries = achievementsForGame(game.key)
  const tiers = entries.map((entry) => entry.tier)
  if (!game.main) {
    assert.equal(
      entries.length,
      3,
      `${game.key} must carry exactly three achievements.`,
    )
    assert.deepEqual(
      tiers,
      [1, 2, 3],
      `${game.key} needs one achievement at each tier.`,
    )
    continue
  }
  assert.equal(
    new Set(entries.map((entry) => entry.code)).size,
    entries.length,
    `${game.key} achievement codes must be unique.`,
  )
  const floor = ratchet[game.key]
  if (floor !== undefined) {
    assert.ok(
      entries.length >= floor,
      `${game.key} dropped to ${entries.length} achievements; ${RATCHET_PATH} holds it at ${floor} or more.`,
    )
    assert.ok(
      entries.length < MAIN_MIN,
      `${game.key} reached ${entries.length} achievements: remove it from ${RATCHET_PATH} so the ${MAIN_MIN}-${MAIN_MAX} rule applies.`,
    )
    continue
  }
  assert.ok(
    entries.length >= MAIN_MIN && entries.length <= MAIN_MAX,
    `${game.key} is a main game and must carry ${MAIN_MIN}-${MAIN_MAX} achievements (has ${entries.length}).`,
  )
  for (const tier of [1, 2, 3] as const) {
    assert.ok(
      tiers.includes(tier),
      `${game.key} needs at least one tier ${tier} achievement.`,
    )
  }
}

assert.deepEqual(
  new Set(ARCADE_GAMES.map((game) => game.slug)),
  new Set(
    ACHIEVEMENT_GAMES.filter((game) => game.arcade).map((game) => game.key),
  ),
  'Every listed arcade cabinet must have its achievements.',
)

const siteCodes = new Set(
  achievementData.map((entry) => String(entry.triggerCode).toLowerCase()),
)
const codes = GAME_ACHIEVEMENTS.map((entry) => entry.code)
assert.equal(
  new Set(codes).size,
  codes.length,
  'Game achievement codes must be unique.',
)

const iconNames = new Set(
  readdirSync('assets/icons').map((file) => file.replace(/\.svg$/, '')),
)

for (const entry of GAME_ACHIEVEMENTS) {
  const id = entry.code
  assert.match(
    id,
    /^[a-z0-9]+(-[a-z0-9]+)*$/,
    `${id} must be a canonical slug.`,
  )
  assert.ok(id.length <= 120, `${id} is too long.`)
  assert.ok(!siteCodes.has(id), `${id} collides with a site achievement.`)
  assert.equal(gameAchievementByCode(id), entry)
  assert.ok(
    entry.label.trim() && entry.label.length <= 32,
    `${id} needs a short label.`,
  )
  assert.ok(entry.message.trim(), `${id} needs a message.`)
  assert.ok(entry.tooltip.trim(), `${id} needs an achievable goal.`)
  assert.ok(entry.subtleHint.trim(), `${id} needs a subtle hint.`)
  assert.ok(
    entry.artPrompt.trim().split(/\s+/).length >= 30,
    `${id} needs a full art prompt.`,
  )
  assert.equal(entry.karma, TIER_KARMA[entry.tier])
  assert.ok(
    iconNames.has(entry.icon.replace(/^kind-icon:/, '')),
    `${id} uses a missing icon ${entry.icon}.`,
  )

  const game = ACHIEVEMENT_GAMES.find((g) => g.key === entry.game)!
  const rule = entry.rule
  if (!game.arcade) {
    assert.equal(rule.kind, 'event', `${id}: only arcade cabinets judge runs.`)
    continue
  }
  const meta = ARCADE_GAMES.find((g) => g.slug === entry.game)!
  if (rule.kind === 'event') {
    assert.equal(
      entry.game,
      'zuzu-pinball',
      `${id}: arcade cabinet event awards must be explicitly integrated.`,
    )
    assert.equal(
      meta.maxPlausibleScore,
      0,
      `${id}: an event-driven pinball cabinet must not claim score-rule awards.`,
    )
    continue
  }
  if (rule.kind === 'score') {
    assert.ok(
      rule.min > 0 && rule.min <= meta.maxPlausibleScore,
      `${id}: score ${rule.min} must be under the cabinet's plausible ceiling.`,
    )
  }
  if (rule.kind === 'level') {
    assert.ok(rule.min >= 2, `${id}: a level goal starts past the first level.`)
  }
  if (rule.kind === 'mastery') {
    assert.ok(
      meta.mastery?.some((goal) => goal.id === rule.id),
      `${id}: ${rule.id} is not one of the cabinet's mastery goals.`,
    )
  }
}

const SOURCE_DIRS = ['components', 'stores', 'pages', 'utils']
const appSources: string[] = []
function collect(dir: string) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name)
    if (statSync(path).isDirectory()) {
      if (
        path === join('utils', 'achievements') ||
        path === join('utils', 'scripts')
      )
        continue
      collect(path)
    } else if (/\.(ts|vue)$/.test(name)) {
      appSources.push(source(path))
    }
  }
}
SOURCE_DIRS.forEach(collect)

const FEAT_TABLES: Record<string, string> = {
  'zuzu-pinball': 'utils/arcade/pinball/tables/zuzuLastBell/rules.ts',
}
const featRules = (game: string) =>
  FEAT_TABLES[game] ? (source(FEAT_TABLES[game]!).split('feats:')[1] ?? '') : ''

for (const entry of GAME_ACHIEVEMENTS.filter((e) => e.rule.kind === 'event')) {
  assert.ok(
    appSources.some((text) => text.includes(`'${entry.code}'`)) ||
      featRules(entry.game).includes(`['${entry.key}']`),
    `${entry.code} is never awarded: wire rewardAchievementByCode('${entry.code}') at the deed.`,
  )
}

const sectionKeys = new Set(ACHIEVEMENT_SECTIONS.map((section) => section.key))
for (const game of ACHIEVEMENT_GAMES) assert.ok(sectionKeys.has(game.section))
assert.equal(achievementSectionOf('Dashboard'), 'site')
assert.equal(
  achievementSectionOf(GAME_ACHIEVEMENTS[0]!.code),
  GAME_ACHIEVEMENTS[0]!.section,
)

const sample = ARCADE_GAMES.find((game) =>
  achievementsForGame(game.slug).some((entry) => entry.rule.kind === 'score'),
)!
const scoreGoal = achievementsForGame(sample.slug).find(
  (entry) => entry.rule.kind === 'score',
)!
const min = (scoreGoal.rule as { min: number }).min
assert.ok(
  arcadeAchievementsEarned(sample.slug, { score: min, level: 1 }).includes(
    scoreGoal,
  ),
)
assert.ok(
  !arcadeAchievementsEarned(sample.slug, { score: min - 1, level: 1 }).includes(
    scoreGoal,
  ),
)
assert.deepEqual(
  arcadeAchievementsEarned(sample.slug, { score: 0, level: 0 }),
  [],
)

const rows = gameAchievementCatalogRows()
assert.equal(rows.length, GAME_ACHIEVEMENTS.length)
for (const row of rows) {
  assert.equal(row.isActive, true)
  assert.equal(row.isRepeatable, false)
  assert.ok(row.pageHint.startsWith('/'), `${row.triggerCode} needs a route.`)
}

const cabinet = source('components/arcade/arcade-cabinet.vue')
assert.ok(
  (cabinet.match(/store\.awardRunAchievements\(props\.slug/g) ?? []).length >=
    2,
  'The cabinet must judge achievements at game over and when a run is left.',
)
const arcadeStore = source('stores/arcadeStore.ts')
assert.ok(
  arcadeStore.includes('arcadeAchievementsEarned(game') &&
    arcadeStore.includes('mastered: masteryFor(game)') &&
    arcadeStore.includes('achievements.hasEarnedCode(entry.code)') &&
    arcadeStore.includes('achievements.rewardAchievementByCode(entry.code)'),
  'The arcade store must award new run achievements through the achievement store.',
)
assert.ok(
  source('pages/play/arcade/index.vue').includes(
    '<GameAchievementStrip :game="meta.slug" layout="icons" />',
  ),
  'Each cabinet page shows its three achievements.',
)
assert.ok(
  source('components/achievements/achievement-gallery.vue').includes(
    'achievementSectionOf(achievement.triggerCode)',
  ),
  'The achievements page filters by section.',
)

const runtime = source('utils/arcade/pinball/runtime.ts')
assert.ok(
  runtime.includes(
    'this.featQueue.push(...this.ruleset.feats(this.rules, state))',
  ) &&
    runtime.includes('!this.demo && this.ruleset.feats') &&
    cabinet.includes('game.drainFeats?.()') &&
    arcadeStore.includes('`${game}-${feat}`'),
  'Table feats are queued outside the attract demo and awarded by the cabinet.',
)
assert.ok(
  source('components/navigation/workspace-sheet.vue').includes(
    'achievementGameForPath(route.path)',
  ),
  "Each game page's sidebar shows that game's achievements.",
)

const seed = source('scripts/seed_achievements.ts')
assert.ok(
  seed.includes('gameAchievementCatalogRows()') &&
    seed.includes('for (const achievement of catalog)'),
  'The seed must reconcile the game achievements with the site catalog.',
)
assert.ok(
  /missingCatalogCodes\(prisma, catalog\)[\s\S]{0,200}if \(missing\.length\)[\s\S]{0,40}throw new Error/.test(
    seed,
  ) && seed.includes('process.exitCode = 1'),
  'After --write the seed must re-read every active catalog code and fail when one has no active row.',
)
const driftPlugin = source('server/plugins/02-achievement-catalog-drift.ts')
assert.ok(
  driftPlugin.includes('gameAchievementCatalogRows()') &&
    driftPlugin.includes('prisma.achievement.findMany') &&
    driftPlugin.includes('void (async () =>') &&
    /catch \(error\)\s*{\s*console\.warn/.test(driftPlugin) &&
    !/\.(create|createMany|update|updateMany|upsert|delete|deleteMany)\(/.test(
      driftPlugin,
    ) &&
    !driftPlugin.includes('throw '),
  'The boot catalog drift check only reads and warns: it never seeds or blocks.',
)
const workflow = '.github/workflows/achievement-catalog-maintenance.yml'
assert.ok(existsSync(workflow))
assert.ok(
  source(workflow).includes('scripts/seed_achievements.ts --write') &&
    source(workflow).includes('scripts/generate_achievement_art.ts --write'),
  'Catalog maintenance must seed the rows and queue their art.',
)

console.log(
  `Game achievements contract passed: ${GAME_ACHIEVEMENTS.length} achievements across ${ACHIEVEMENT_GAMES.length} games.`,
)
