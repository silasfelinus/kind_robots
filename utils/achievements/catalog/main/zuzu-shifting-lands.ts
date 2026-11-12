// /utils/achievements/catalog/main/zuzu-shifting-lands.ts

import type { GameAchievementDef } from '../../gameAchievements'

export const ZUZU_SHIFTING_LANDS_ACHIEVEMENTS: GameAchievementDef[] = [
  // Zuzu: The Shifting Lands (public: /play/zuzu-shifting-lands)
  {
    game: 'zuzu-shifting-lands',
    key: 'open-door',
    tier: 1,
    label: 'Through the Open Door',
    message: 'Zuzu passed the Abbess’s trial and left the Homestead behind.',
    tooltip:
      'Pass The Abbess’s Open Door, the Homestead’s trial, in Zuzu: The Shifting Lands.',
    subtleHint:
      'The bread is warm, but the locked corridor is the real question.',
    icon: 'kind-icon:map',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, steps out through a tall carved mission doorway into golden light, a warm loaf of bread tucked under one arm, the dusty Homestead fields and a spiral road winding away toward distant floating islands. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, dreamlike sense of adventure and discovery, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'canyon-warden',
    tier: 2,
    label: 'Past the Canyon Warden',
    message:
      'Three lands crossed: the masked warden of the Broken Tablelands let Zuzu over the last bridge.',
    tooltip:
      'Pass The Canyon Warden, the Broken Tablelands’ trial, in Zuzu: The Shifting Lands.',
    subtleHint: 'Where two canyon roads meet, a mask guards the last bridge.',
    icon: 'kind-icon:compass',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, crosses a narrow plank bridge between towering red mesas of the Broken Tablelands as a storm rolls in, watchfires glowing on stone parapets, while a tall masked canyon warden steps aside with a respectful bow. Vibrant fantastical landscape, rich saturated color, soft radiant lighting breaking through storm clouds, dreamlike sense of adventure, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'beyond-the-verge',
    tier: 3,
    label: 'Beyond the Verge',
    message:
      'All five lands behind him: Zuzu crossed the last threshold of the Black Verge.',
    tooltip:
      'Complete all five lands in Zuzu: The Shifting Lands by passing the final trial, Beyond the Verge.',
    subtleHint:
      'A door without hinges, a stone key, and a price you refuse to pay.',
    icon: 'kind-icon:portal',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, stands at the final threshold of the Black Verge as a hingeless stone door swings open onto a starry sky, while behind him five lands curve away like a spiral road: golden fields, a river crossing, red canyons, blue-candled caves and black cliffs. The sky shifts from sunrise to starlight. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, dreamlike wonder, centered emblem composition, every surface bare and unmarked.',
  },
]
