// /utils/achievements/catalog/main/index.ts
//
// Main games carry 12 to 30 achievements each (conductor
// docs/agents/main-game-standard.md), so each has a file of its own. Every
// one is fired by code at the moment of the deed. A game still short of 12 is
// listed in utils/scripts/mainGameAchievementRatchet.json until it gets there.

import type { GameAchievementDef } from '../../gameAchievements'
import { COMET_CITY_ACADEMY_ACHIEVEMENTS } from './comet-city-academy'
import { CRYSTAL_STREET_ACHIEVEMENTS } from './crystal-street'
import { CTHULHUQUARIUM_ACHIEVEMENTS } from './cthulhuquarium'
import { EMPEROR_OF_DUST_ACHIEVEMENTS } from './emperor-of-dust'
import { EVERY_VILLAIN_TACTICS_ACHIEVEMENTS } from './every-villain-tactics'
import { GAME_OF_CAPTAINS_ACHIEVEMENTS } from './game-of-captains'
import { MEMORY_DUNGEON_ACHIEVEMENTS } from './memory-dungeon'
import { MONSTRESS_CONVENTION_ACHIEVEMENTS } from './monstress-convention'
import { RAINBOW_BULLET_HELL_SPACE_PRINCESS_ACHIEVEMENTS } from './rainbow-bullet-hell-space-princess'
import { RULER_HOOKED_ACHIEVEMENTS } from './ruler-hooked'
import { SAVE_THE_PLUMBER_ACHIEVEMENTS } from './save-the-plumber'
import { SHIFTING_DESKS_ACHIEVEMENTS } from './shifting-desks'
import { SLIME_CITY_ACHIEVEMENTS } from './slime-city'
import { WEIRD_HUMBOLDT_ACHIEVEMENTS } from './weird-humboldt'
import { ZUZU_GAMEBOOK_ACHIEVEMENTS } from './zuzu-gamebook'
import { ZUZU_SHIFTING_LANDS_ACHIEVEMENTS } from './zuzu-shifting-lands'

export const MAIN_GAME_ACHIEVEMENT_DEFS: GameAchievementDef[] = [
  ...SLIME_CITY_ACHIEVEMENTS,
  ...WEIRD_HUMBOLDT_ACHIEVEMENTS,
  ...ZUZU_GAMEBOOK_ACHIEVEMENTS,
  ...ZUZU_SHIFTING_LANDS_ACHIEVEMENTS,
  ...EMPEROR_OF_DUST_ACHIEVEMENTS,
  ...RAINBOW_BULLET_HELL_SPACE_PRINCESS_ACHIEVEMENTS,
  ...SAVE_THE_PLUMBER_ACHIEVEMENTS,
  ...SHIFTING_DESKS_ACHIEVEMENTS,
  ...MEMORY_DUNGEON_ACHIEVEMENTS,
  ...CRYSTAL_STREET_ACHIEVEMENTS,
  ...RULER_HOOKED_ACHIEVEMENTS,
  ...CTHULHUQUARIUM_ACHIEVEMENTS,
  ...COMET_CITY_ACADEMY_ACHIEVEMENTS,
  ...GAME_OF_CAPTAINS_ACHIEVEMENTS,
  ...EVERY_VILLAIN_TACTICS_ACHIEVEMENTS,
  ...MONSTRESS_CONVENTION_ACHIEVEMENTS,
]
