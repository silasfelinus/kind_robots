// /utils/achievements/gameAchievements.ts
//
// Game achievements, each a row in the site Achievement catalog
// (training/achievementData.ts holds the site-wide ones). Arcade cabinets and
// smaller games carry three; main games (`main: true`, conductor
// docs/agents/main-game-standard.md) carry 12 to 30, one file each under
// catalog/main. An arcade cabinet's are judged from the finished run (score,
// level, mastery goals); every other game fires its own by code at the moment
// of the deed. scripts/seed_achievements.ts upserts these rows by triggerCode
// and scripts/generate_achievement_art.ts queues each one's badge art.

import { ARCADE_GAMES } from '../arcade/games'
import { ARCADE_ACHIEVEMENT_DEFS } from './catalog/arcade'
import { OTHER_GAME_ACHIEVEMENT_DEFS } from './catalog/games'
import { MAIN_GAME_ACHIEVEMENT_DEFS } from './catalog/main'

export type AchievementSectionKey =
  | 'site'
  | 'arcade'
  | 'zuzu'
  | 'shifting-desks'
  | 'emperor-of-dust'
  | 'slime-city'
  | 'weird-humboldt'
  | 'rainbow-bullet-hell-space-princess'
  | 'save-the-plumber'
  | 'memory-dungeon'
  | 'crystal-street'
  | 'ruler-hooked'
  | 'cthulhuquarium'
  | 'comet-city-academy'
  | 'game-of-captains'
  | 'every-villain-tactics'
  | 'monstress-convention'

export type AchievementSection = {
  key: AchievementSectionKey
  label: string
  icon: string
}

export const ACHIEVEMENT_SECTIONS: readonly AchievementSection[] = [
  { key: 'site', label: 'Kind Robots', icon: 'kind-icon:jellybean' },
  { key: 'arcade', label: 'Arcade', icon: 'kind-icon:arcade' },
  { key: 'zuzu', label: 'Zuzu', icon: 'kind-icon:dragon' },
  {
    key: 'shifting-desks',
    label: 'Shifting Desks',
    icon: 'kind-icon:briefcase',
  },
  { key: 'emperor-of-dust', label: 'Emperor of Dust', icon: 'kind-icon:crown' },
  { key: 'slime-city', label: 'Slime City', icon: 'kind-icon:bubbles' },
  { key: 'weird-humboldt', label: 'Ecotone', icon: 'kind-icon:pine' },
  {
    key: 'rainbow-bullet-hell-space-princess',
    label: 'Space Princess',
    icon: 'kind-icon:rainbow',
  },
  {
    key: 'save-the-plumber',
    label: 'Save the Plumber',
    icon: 'kind-icon:wrench',
  },
  { key: 'memory-dungeon', label: 'Memory Dungeon', icon: 'kind-icon:dungeon' },
  {
    key: 'crystal-street',
    label: 'Crystal Street',
    icon: 'kind-icon:crystal-ball',
  },
  { key: 'ruler-hooked', label: 'Ruler Hooked', icon: 'kind-icon:net' },
  { key: 'cthulhuquarium', label: 'Cthulhuquarium', icon: 'kind-icon:fish' },
  { key: 'comet-city-academy', label: 'Prom of Doom', icon: 'kind-icon:comet' },
  { key: 'game-of-captains', label: 'Space Couch', icon: 'kind-icon:rocket' },
  {
    key: 'every-villain-tactics',
    label: 'Every Villain Tactics',
    icon: 'kind-icon:swords',
  },
  {
    key: 'monstress-convention',
    label: 'MONSTRIQUE',
    icon: 'kind-icon:mask',
  },
]

export type GameAchievementRule =
  | { kind: 'score'; min: number }
  | { kind: 'level'; min: number }
  | { kind: 'mastery'; id: string }
  | { kind: 'event' }

export type GameAchievementTier = 1 | 2 | 3

export type GameAchievementDef = {
  game: string
  key: string
  tier: GameAchievementTier
  label: string
  message: string
  tooltip: string
  subtleHint: string
  icon: string
  rule: GameAchievementRule
  artPrompt: string
}

export type AchievementGame = {
  key: string
  title: string
  section: Exclude<AchievementSectionKey, 'site'>
  route: string
  arcade: boolean
  /** Only administrators can reach it yet, so the public gallery hides it. */
  adminOnly?: boolean
  /** A main game: 12 to 30 achievements, one catalog file in catalog/main. */
  main?: true
  /** Codes keep the cabinet prefix (`arcade-<slug>-<key>`) for a game that began as a cabinet. */
  codePrefix?: 'arcade'
}

export type GameAchievement = GameAchievementDef & {
  code: string
  karma: number
  section: AchievementGame['section']
  gameTitle: string
  route: string
}

export const TIER_KARMA: Record<GameAchievementTier, number> = {
  1: 250,
  2: 500,
  3: 1000,
}

const OTHER_GAMES: AchievementGame[] = [
  {
    key: 'hybridizer',
    title: 'Hybridizer',
    section: 'arcade',
    route: '/play/hybridizer',
    arcade: false,
  },
  {
    key: 'zuzu-showdown',
    title: 'Zuzu Showdown',
    section: 'zuzu',
    route: '/play/zuzu-showdown',
    arcade: false,
  },
  {
    key: 'zuzu-lair',
    title: "Zuzu's Lair",
    section: 'zuzu',
    route: '/admin/zuzu-lair',
    arcade: false,
    adminOnly: true,
  },
  {
    key: 'zuzu-pinball',
    title: 'Zuzu Pinball',
    section: 'zuzu',
    route: '/play/zuzu-pinball',
    arcade: false,
  },
]

const MAIN_GAMES: AchievementGame[] = [
  {
    key: 'slime-city',
    title: 'Slime City',
    section: 'slime-city',
    route: '/play/slime-city',
    arcade: false,
    main: true,
  },
  {
    key: 'weird-humboldt',
    title: 'Ecotone: Weird Humboldt',
    section: 'weird-humboldt',
    route: '/play/ecotone',
    arcade: false,
    main: true,
  },
  {
    key: 'zuzu-gamebook',
    title: 'Zuzu Gamebook',
    section: 'zuzu',
    route: '/play/zuzu-gamebook',
    arcade: false,
    main: true,
  },
  {
    key: 'zuzu-shifting-lands',
    title: 'Zuzu: The Shifting Lands',
    section: 'zuzu',
    route: '/play/zuzu-shifting-lands',
    arcade: false,
    main: true,
  },
  {
    key: 'emperor-of-dust',
    title: 'Emperor of Dust',
    section: 'emperor-of-dust',
    route: '/play/emperor-of-dust',
    arcade: false,
    main: true,
  },
  {
    key: 'rainbow-bullet-hell-space-princess',
    title: 'Rainbow Bullet Hell Space Princess',
    section: 'rainbow-bullet-hell-space-princess',
    route: '/play/rainbow-bullet-hell-space-princess',
    arcade: false,
    main: true,
    codePrefix: 'arcade',
  },
  {
    key: 'save-the-plumber',
    title: 'Save the Plumber',
    section: 'save-the-plumber',
    route: '/play/save-the-plumber',
    arcade: false,
    main: true,
    codePrefix: 'arcade',
  },
  {
    key: 'shifting-desks',
    title: 'Shifting Desks',
    section: 'shifting-desks',
    route: '/play/shifting-desks',
    arcade: false,
    main: true,
  },
  {
    key: 'memory-dungeon',
    title: 'Memory Dungeon',
    section: 'memory-dungeon',
    route: '/play/memory',
    arcade: false,
    main: true,
  },
  {
    key: 'crystal-street',
    title: 'Terrors on Crystal Street',
    section: 'crystal-street',
    route: '/play/crystal-street',
    arcade: false,
    main: true,
  },
  {
    key: 'ruler-hooked',
    title: 'The Ruler Is Hooked',
    section: 'ruler-hooked',
    route: '/play/ruler-hooked',
    arcade: false,
    main: true,
  },
  {
    key: 'cthulhuquarium',
    title: 'Cthulhuquarium',
    section: 'cthulhuquarium',
    route: '/play/aquarium',
    arcade: false,
    main: true,
  },
  {
    key: 'comet-city-academy',
    title: 'Prom of Doom',
    section: 'comet-city-academy',
    route: '/play/comet-city-academy',
    arcade: false,
    main: true,
  },
  {
    key: 'game-of-captains',
    title: 'Space Couch',
    section: 'game-of-captains',
    route: '/play/game-of-captains',
    arcade: false,
    main: true,
  },
  {
    key: 'every-villain-tactics',
    title: 'Every Villain Tactics',
    section: 'every-villain-tactics',
    route: '/admin/every-villain-tactics',
    arcade: false,
    adminOnly: true,
    main: true,
  },
  {
    key: 'monstress-convention',
    title: 'MONSTRIQUE',
    section: 'monstress-convention',
    route: '/play/monstrique',
    arcade: false,
    main: true,
  },
]

export const ACHIEVEMENT_GAMES: readonly AchievementGame[] = [
  ...ARCADE_GAMES.map((game): AchievementGame => ({
    key: game.slug,
    title: game.title,
    section: 'arcade',
    route: `/play/arcade?game=${game.slug}`,
    arcade: true,
  })),
  ...OTHER_GAMES,
  ...MAIN_GAMES,
]

/** Slugs of the main games, which carry 12 to 30 achievements instead of three. */
export const MAIN_GAME_SLUGS: readonly string[] = MAIN_GAMES.map(
  (game) => game.key,
)

const gameByKey = new Map(ACHIEVEMENT_GAMES.map((game) => [game.key, game]))

export function isMainGame(game: string): boolean {
  return Boolean(gameByKey.get(game)?.main)
}

export function achievementCode(def: Pick<GameAchievementDef, 'game' | 'key'>) {
  const game = gameByKey.get(def.game)
  return game?.arcade || game?.codePrefix === 'arcade'
    ? `arcade-${def.game}-${def.key}`
    : `${def.game}-${def.key}`
}

function build(def: GameAchievementDef): GameAchievement {
  const game = gameByKey.get(def.game)
  if (!game) throw new Error(`Unknown achievement game: ${def.game}`)
  return {
    ...def,
    code: achievementCode(def),
    karma: TIER_KARMA[def.tier],
    section: game.section,
    gameTitle: game.title,
    route: game.route,
  }
}

const tierOrder = (a: GameAchievement, b: GameAchievement) => a.tier - b.tier

export const GAME_ACHIEVEMENTS: readonly GameAchievement[] = [
  ...ARCADE_ACHIEVEMENT_DEFS,
  ...OTHER_GAME_ACHIEVEMENT_DEFS,
  ...MAIN_GAME_ACHIEVEMENT_DEFS,
].map(build)

const byCode = new Map(GAME_ACHIEVEMENTS.map((entry) => [entry.code, entry]))

export function gameAchievementByCode(
  code: string | null | undefined,
): GameAchievement | undefined {
  return code ? byCode.get(code.toLowerCase()) : undefined
}

export function achievementsForGame(game: string): GameAchievement[] {
  return GAME_ACHIEVEMENTS.filter((entry) => entry.game === game).sort(
    tierOrder,
  )
}

/** The non-arcade game whose page this is (cabinets show theirs beside the cabinet). */
export function achievementGameForPath(path: string): string | null {
  const game = ACHIEVEMENT_GAMES.find(
    (entry) => !entry.arcade && entry.route === path,
  )
  return game?.key ?? null
}

/** A game achievement only administrators can reach yet. */
export function isAdminOnlyAchievement(
  triggerCode: string | null | undefined,
): boolean {
  const entry = gameAchievementByCode(triggerCode)
  return Boolean(entry && gameByKey.get(entry.game)?.adminOnly)
}

export function achievementSectionOf(
  triggerCode: string | null | undefined,
): AchievementSectionKey {
  return gameAchievementByCode(triggerCode)?.section ?? 'site'
}

export type ArcadeRun = {
  score: number
  level: number
  mastered?: Iterable<string>
}

/** The arcade achievements a finished (or abandoned) run has earned. */
export function arcadeAchievementsEarned(
  slug: string,
  run: ArcadeRun,
): GameAchievement[] {
  const mastered = new Set(run.mastered ?? [])
  return achievementsForGame(slug).filter((entry) => {
    const rule = entry.rule
    if (rule.kind === 'score') return run.score >= rule.min
    if (rule.kind === 'level') return run.level >= rule.min
    if (rule.kind === 'mastery') return mastered.has(rule.id)
    return false
  })
}

export type AchievementCatalogEntry = {
  triggerCode: string
  label: string
  message: string
  icon: string
  karma: number
  pageHint: string
  subtleHint: string
  tooltip: string
  isActive: boolean
  isRepeatable: boolean
  artPrompt: string
}

/** Every game achievement as an Achievement catalog row for the seed. */
export function gameAchievementCatalogRows(): AchievementCatalogEntry[] {
  return GAME_ACHIEVEMENTS.map((entry) => ({
    triggerCode: entry.code,
    label: entry.label,
    message: entry.message,
    icon: entry.icon,
    karma: entry.karma,
    pageHint: entry.route,
    subtleHint: entry.subtleHint,
    tooltip: entry.tooltip,
    isActive: true,
    isRepeatable: false,
    artPrompt: entry.artPrompt,
  }))
}
