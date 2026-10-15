import assert from 'node:assert/strict'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { ARCADE_GAMES } from '../arcade/games'
import {
  ACHIEVEMENT_GAMES,
  ACHIEVEMENT_SECTIONS,
  GAME_ACHIEVEMENTS,
  TIER_KARMA,
  achievementSectionOf,
  achievementsForGame,
  arcadeAchievementsEarned,
  gameAchievementByCode,
  gameAchievementCatalogRows,
} from '../achievements/gameAchievements'
import { achievementData } from '../../training/achievementData'

const source = (path: string) => readFileSync(path, 'utf8')

for (const game of ACHIEVEMENT_GAMES) {
  const entries = achievementsForGame(game.key)
  assert.equal(
    entries.length,
    3,
    `${game.key} must carry exactly three achievements.`,
  )
  assert.deepEqual(
    entries.map((entry) => entry.tier),
    [1, 2, 3],
    `${game.key} needs one achievement at each tier.`,
  )
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
  assert.notEqual(
    rule.kind,
    'event',
    `${id}: a cabinet achievement needs a run rule.`,
  )
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
