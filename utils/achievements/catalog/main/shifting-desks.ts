// /utils/achievements/catalog/main/shifting-desks.ts

import type { GameAchievementDef } from '../../gameAchievements'

export const SHIFTING_DESKS_ACHIEVEMENTS: GameAchievementDef[] = [
  // Shifting Desks (public: /play/shifting-desks)
  {
    game: 'shifting-desks',
    key: 'survived-review',
    tier: 1,
    label: 'Survived Orientation',
    message:
      'Your 90-Day Review happened on day one, and you are, somehow, still employed.',
    tooltip:
      'Clear Orientation in Shifting Desks by getting through Your 90-Day Review, Today at 3.',
    subtleHint: 'PAL is always grading. Smile for your badge.',
    icon: 'kind-icon:scroll',
    rule: { kind: 'event' },
    artPrompt:
      'A relieved young South Asian new hire in a crisp beige uniform walks out of a fluorescent review room hugging a manila folder to her chest, while a panel of identical clipboard-holding supervisors behind a long desk applauds stiffly and a smiling beige computer terminal glows approvingly above them. Mid-century corporate safety-manual illustration crossed with a retro-futurist beige office, screen-printed gouache with halftone grain, flat confident shapes and crisp silhouettes, limited palette of manila, carbon-paper blue, safety orange, fluorescent-tube green and oxblood, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'shifting-desks',
    key: 'sub-level-zero',
    tier: 2,
    label: 'Going Down',
    message:
      'Four departments survived. The elevator only goes one way from here: Sub-Level Zero.',
    tooltip:
      'Reach Sub-Level Zero in Shifting Desks by clearing Orientation, Records & Forms, Toy Division and Wellness & Testing in one run.',
    subtleHint: 'There is a floor below the floor below the basement.',
    icon: 'kind-icon:dungeon',
    rule: { kind: 'event' },
    artPrompt:
      'Inside a retro-futurist service elevator plunging deep underground, a stocky older office worker with a gray beard, rolled sleeves and a loosened tie grips the brass handrail with grim determination, a column of round indicator lamps blinking downward on the wall, a bare bulb swinging overhead and eerie fluorescent-green light rising from the gap below the doors. Mid-century corporate safety-manual illustration, screen-printed gouache with halftone grain, flat confident shapes and crisp silhouettes, limited palette of manila, carbon-paper blue, safety orange, fluorescent-tube green and oxblood, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'shifting-desks',
    key: 'faced-the-board',
    tier: 3,
    label: 'Faced the Board',
    message:
      'You sat before The Board and walked out with an ending of your own choosing. Probably.',
    tooltip:
      'Finish a full Shifting Desks run by surviving The Board in Sub-Level Zero and earning an ending.',
    subtleHint: 'Employee of the Month is only one of the ways out.',
    icon: 'kind-icon:trophy',
    rule: { kind: 'event' },
    artPrompt:
      'At the end of a vast subterranean boardroom, a small, steady Latina office worker in a cardigan stands in a single spotlight before an impossibly long table of shadowy board members in towering high-backed chairs, holding a gleaming golden stapler aloft like a trophy while paperclips scatter at her feet. Mid-century corporate safety-manual illustration crossed with a retro-futurist beige office, screen-printed gouache with halftone grain, flat confident shapes and crisp silhouettes, limited palette of manila, carbon-paper blue, safety orange, fluorescent-tube green and oxblood, centered emblem composition, every surface bare and unmarked.',
  },
]
