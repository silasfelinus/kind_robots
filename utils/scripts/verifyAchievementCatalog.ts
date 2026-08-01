import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { achievementData } from '../../training/achievementData'

const source = (path: string) => readFileSync(path, 'utf8')

assert.equal(
  achievementData.length,
  25,
  'The canonical achievement tour must contain exactly 25 achievements.',
)

const triggerCodes = achievementData.map((achievement) =>
  String(achievement.triggerCode || ''),
)
assert.equal(
  new Set(triggerCodes.map((code) => code.toLowerCase())).size,
  achievementData.length,
  'Achievement trigger codes must be unique.',
)

const validPageHints = new Set([
  '/',
  '/dashboard',
  '/brainstorm',
  '/weirdlandia',
  '/bots',
  '/builder?tab=art',
  '/builder?tab=character',
  '/art',
  '/amibot',
  '/themes',
  '/achievements',
  '/play/memory',
  '/rewards',
  '/prompts',
  '/friends',
  '/button',
])

for (const achievement of achievementData) {
  assert.ok(achievement.label.trim(), `Achievement ${achievement.id} needs a label.`)
  assert.ok(
    String(achievement.tooltip || '').trim(),
    `Achievement ${achievement.id} needs an achievable goal.`,
  )
  assert.ok(
    String(achievement.artPrompt || '').trim(),
    `Achievement ${achievement.id} needs an artPrompt.`,
  )
  assert.ok(
    validPageHints.has(String(achievement.pageHint || '')),
    `Achievement ${achievement.id} points at a retired route: ${achievement.pageHint}`,
  )
}

for (const retiredCode of ['fate', 'test']) {
  assert.ok(
    !triggerCodes.some((code) => code.toLowerCase() === retiredCode),
    `Retired trigger code ${retiredCode} must not return.`,
  )
}

const triggerSources: Record<string, string[]> = {
  Dashboard: ['stores/userStore.ts'],
  Brainstorm: ['components/dreams/dream-brainstorm.vue'],
  weirdlandia: ['stores/weirdStore.ts'],
  botcafe: ['stores/chatStore.ts'],
  artmaker: ['stores/artStore.ts'],
  'first-character': ['stores/characterStore.ts'],
  artcritic: ['stores/reactionStore.ts'],
  amibot: ['stores/achievementStore.ts'],
  theme: ['components/themes/add-theme.vue', 'components/themes/theme-gallery.vue'],
  'achievement-tour': ['stores/achievementStore.ts'],
  'first-bot': ['stores/botStore.ts'],
  'art-ten': ['stores/artStore.ts'],
  'chat-fifty': ['stores/chatStore.ts'],
  'reaction-twentyfive': ['stores/reactionStore.ts'],
  'butterfly-first': ['stores/butterflyStore.ts'],
  'butterfly-swarm': ['stores/butterflyStore.ts'],
  'memory-master': ['stores/memoryStore.ts'],
  'welcome-back': ['stores/userStore.ts'],
  'jellybean-hunter': ['stores/achievementStore.ts'],
  'first-reward': ['stores/rewardStore.ts'],
  'first-prompt': ['stores/promptStore.ts'],
  'first-friend': ['stores/friendStore.ts'],
  'profile-avatar': ['stores/userStore.ts'],
  'story-weaver': ['stores/weirdStore.ts'],
  'rebel-button': ['components/pages/rebel-button.vue'],
}

assert.deepEqual(
  new Set(Object.keys(triggerSources)),
  new Set(triggerCodes),
  'Every catalog entry must have a real application trigger contract.',
)

for (const [triggerCode, paths] of Object.entries(triggerSources)) {
  assert.ok(
    paths.some((path) => source(path).includes(triggerCode)),
    `Achievement trigger ${triggerCode} is not wired in ${paths.join(' or ')}.`,
  )
}

const achievementStore = source('stores/achievementStore.ts')
assert.ok(
  achievementStore.includes("'/achievements': 'achievement-tour'") &&
    achievementStore.includes("'/amibot': 'amibot'"),
  'Route achievements must map to the live achievements and AMI pages.',
)
assert.ok(
  achievementStore.includes('fetchAchievements(true)') &&
    achievementStore.includes('fetchAchievementRecords(true)'),
  'Initialization must force a server refresh after local hydration.',
)

assert.ok(
  source('components/admin/kind-loader.vue').includes(
    'rewardAchievementForPath(route.path)',
  ),
  'The initial route must be evaluated after identity hydration.',
)
assert.ok(
  source('app.vue').includes('<achievement-popup') &&
    source('app.vue').includes('rewardAchievementForPath(route.path)'),
  'The global popup and subsequent route awards must stay mounted.',
)

const earnedCard = source(
  'components/achievements/earned-achievement-card.vue',
)
const unearnedCard = source(
  'components/achievements/unearned-achievement-card.vue',
)
assert.ok(
  earnedCard.includes('v-if="achievement.imagePath"') &&
    earnedCard.includes(':src="achievement.imagePath"'),
  'Earned achievement cards must reveal their generated artwork.',
)
assert.ok(
  !unearnedCard.includes('achievement.imagePath'),
  'Unearned achievement cards must keep artwork hidden.',
)

const generator = source('scripts/generate_achievement_art.ts')
assert.ok(
  generator.includes("entityType: 'achievement'") &&
    generator.includes("field: 'imagePath'") &&
    generator.includes("projectSlug: PROJECT_SLUG") &&
    !generator.includes('openai.images'),
  'Achievement art must use durable entity-backed ArtJobs.',
)

const entityArt = source('server/utils/entityArt.ts')
assert.ok(
  entityArt.includes("'achievement'") &&
    entityArt.includes('db.achievement') &&
    entityArt.includes('artImageId'),
  'ArtJob completion must attach the generated ArtImage to Achievement.',
)

const seed = source('scripts/seed_achievements.ts')
assert.ok(
  seed.includes("['first-character', ['fate']]") &&
    seed.includes("['achievement-tour', ['test']]"),
  'Legacy DB rows must be reconciled without losing earned records.',
)
assert.ok(
  !seed.includes('imagePath: achievement.imagePath') &&
    !seed.includes('artImageId: achievement.artImageId'),
  'Catalog reconciliation must preserve generated achievement art.',
)

const build = source('scripts/vercel-build.mjs')
const seedIndex = build.indexOf("['scripts/seed_achievements.ts', '--write']")
const artIndex = build.indexOf(
  "['scripts/generate_achievement_art.ts', '--write']",
)
assert.ok(seedIndex >= 0 && artIndex > seedIndex, 'Production must seed before queuing art.')

console.log('Achievement catalog contract passed: 25 realistic goals are wired.')
