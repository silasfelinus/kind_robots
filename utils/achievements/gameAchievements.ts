// /utils/achievements/gameAchievements.ts
//
// Game achievements: three per game, each a row in the site Achievement
// catalog (training/achievementData.ts holds the site-wide ones). An arcade
// cabinet's three are judged from the finished run (score, level, mastery
// goals); every other game fires its own by code at the moment of the deed.
// scripts/seed_achievements.ts upserts these rows by triggerCode and
// scripts/generate_achievement_art.ts queues each one's badge art.

import { ARCADE_GAMES } from '../arcade/games'
import { ARCADE_ACHIEVEMENT_DEFS } from './catalog/arcade'
import { OTHER_GAME_ACHIEVEMENT_DEFS } from './catalog/games'

export type AchievementSectionKey =
  'site' | 'arcade' | 'zuzu' | 'shifting-desks' | 'emperor-of-dust'

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
    route: '/admin/hybridizer',
    arcade: false,
    adminOnly: true,
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
    key: 'zuzu-gamebook',
    title: 'Zuzu Gamebook',
    section: 'zuzu',
    route: '/play/zuzu-gamebook',
    arcade: false,
  },
  {
    key: 'zuzu-shifting-lands',
    title: 'Zuzu: The Shifting Lands',
    section: 'zuzu',
    route: '/play/zuzu-shifting-lands',
    arcade: false,
  },
  {
    key: 'zuzu-pinball',
    title: 'Zuzu Pinball',
    section: 'zuzu',
    route: '/play/zuzu-pinball',
    arcade: false,
  },
  {
    key: 'shifting-desks',
    title: 'Shifting Desks',
    section: 'shifting-desks',
    route: '/play/shifting-desks',
    arcade: false,
  },
  {
    key: 'emperor-of-dust',
    title: 'Emperor of Dust',
    section: 'emperor-of-dust',
    route: '/play/emperor-of-dust',
    arcade: false,
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
]

const gameByKey = new Map(ACHIEVEMENT_GAMES.map((game) => [game.key, game]))

export function achievementCode(def: Pick<GameAchievementDef, 'game' | 'key'>) {
  const game = gameByKey.get(def.game)
  return game?.arcade
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
