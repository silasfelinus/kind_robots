// /utils/achievements/catalog/main/zuzu-gamebook.ts

import type { GameAchievementDef } from '../../gameAchievements'

export const ZUZU_GAMEBOOK_ACHIEVEMENTS: GameAchievementDef[] = [
  // Zuzu Gamebook (public: /play/zuzu-gamebook)
  {
    game: 'zuzu-gamebook',
    key: 'first-fight-won',
    tier: 1,
    label: 'Steel and Dice',
    message: 'The dice rolled your way and the foe gave ground. Zuzu walks on.',
    tooltip:
      'Win any fight in Zuzu Gamebook: The Bell That Never Rang, such as the River Croc at the waterhole.',
    subtleHint: 'Strike, guard, feint, and sometimes the quiet draw ends it.',
    icon: 'kind-icon:dice',
    rule: { kind: 'event' },
    artPrompt:
      'Graphic-novel panel: Zuzu, a chubby, very short koala ronin with a small round belly, in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, stands knee-deep in a desert waterhole with his katana drawn and dripping, as a huge river crocodile sinks back beneath the churned water in defeat. Gritty weird-west atmosphere, grindhouse, high contrast, heavy shadows, weathered and grimy, harsh desert sun glinting on the water, Western comic book illustration with clean ink lines, centered badge composition, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-gamebook',
    key: 'hopeful-ending',
    tier: 2,
    label: 'A Light on the Road',
    message:
      'Against the dust and the dark, you found one of the book’s hopeful endings.',
    tooltip:
      'Reach any hopeful ending of Zuzu Gamebook: The Bell That Never Rang.',
    subtleHint: 'Not every road out of the badlands ends in ashes.',
    icon: 'kind-icon:book-open',
    rule: { kind: 'event' },
    artPrompt:
      'Graphic-novel ending plate: Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, seen from behind walking a long dust road toward a weathered mission arch as the sun rises, a trail of small paw prints running beside his own, warm light breaking over windswept ruins and amber lanterns guttering out behind him. Gritty weird-west atmosphere, grindhouse, high contrast, heavy shadows, weathered, golden dawn light, Western comic book illustration with clean ink lines, centered badge composition, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-gamebook',
    key: 'ring-the-bell',
    tier: 3,
    label: 'The Bell Rings',
    message:
      'Clean paws and a long road of kept faith: at dawn, the bell that never rang finally spoke.',
    tooltip:
      'In Zuzu Gamebook, reach the ending The Bell Rings by ringing the mission bell at dawn.',
    subtleHint:
      'The rope answers only clean paws and a long road of kept faith.',
    icon: 'kind-icon:sun',
    rule: { kind: 'event' },
    artPrompt:
      'Inside a weathered adobe mission chapel at dawn, Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, hauls on a worn rope with both paws as the great bronze bell in the tower above swings over for the first time, a burst of dust and golden shockwaves rolling out across a white salt flat. A long bar of sunrise lies across the floor. Gritty weird-west atmosphere, grindhouse, high contrast, heavy shadows, amber dawn light, Western comic book illustration with clean ink lines, centered badge composition, every surface bare and unmarked.',
  },
]
