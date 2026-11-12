// /utils/achievements/catalog/games.ts
//
// The three achievements of every smaller game outside the arcade hall, each
// fired by code at the moment of the deed. Main games live in ./main.

import type { GameAchievementDef } from '../gameAchievements'

export const OTHER_GAME_ACHIEVEMENT_DEFS: GameAchievementDef[] = [
  // Hybridizer: discoveries, recursive creatures and thoughtful art revisions.
  {
    game: 'hybridizer',
    key: 'first-fusion',
    tier: 1,
    label: 'Mad Scientist',
    message: 'Your first impossible creature entered the shared atlas.',
    tooltip: 'Successfully save a shared Hybridizer fusion.',
    subtleHint: 'Two specimens, one ridiculous breakthrough.',
    icon: 'kind-icon:sparkles',
    rule: { kind: 'event' },
    artPrompt:
      'A whimsical copper fusion chamber sparks with emerald lightning as a single impossible painted hybrid creature emerges, bold purple and brass specimen laboratory, richly detailed collectible achievement badge, no text.',
  },
  {
    game: 'hybridizer',
    key: 'recursive-discovery',
    tier: 2,
    label: 'Creature of Creatures',
    message: 'You fed a hybrid back into the chamber. Science resigned.',
    tooltip:
      'Successfully combine a previous Hybridizer discovery with another ingredient.',
    subtleHint: 'The result is also an ingredient.',
    icon: 'kind-icon:dna',
    rule: { kind: 'event' },
    artPrompt:
      'A spiral of three intertwined fantastical hybrid creatures in a glowing antique brass laboratory, expressive painterly illustration, amethyst and chartreuse, playful impossible anatomy with delightful animal details, dramatic stage lighting and elaborate golden decorative filigree, collectible achievement badge, no lettering.',
  },
  {
    game: 'hybridizer',
    key: 'art-critic',
    tier: 3,
    label: 'More Tentacles, Please',
    message: 'You demanded a second take and saved the first for posterity.',
    tooltip: 'Queue a new art version of an existing Hybridizer discovery.',
    subtleHint: 'Every masterpiece deserves an alternate universe.',
    icon: 'kind-icon:image',
    rule: { kind: 'event' },
    artPrompt:
      'Two ornate Victorian natural history frames displaying alternate beautiful variations of one hybrid animal, one elevated to a glowing gold easel, acid-green sparks and rich embroidered velvet curtains around a vibrant specimen studio, collectible illustrated achievement badge, no text.',
  },

  // Zuzu Showdown (public: /play/zuzu-showdown)
  {
    game: 'zuzu-showdown',
    key: 'first-ko',
    tier: 1,
    label: 'First KO!',
    message: 'Your fighter was still standing when the CPU hit the dust.',
    tooltip:
      'Win a match against a CPU opponent in Zuzu Showdown, in CPU or Story mode.',
    subtleHint: 'The wasteland respects whoever is still standing at the bell.',
    icon: 'kind-icon:boxing-glove',
    rule: { kind: 'event' },
    artPrompt:
      'Fighting-game victory splash: Zuzu, a chubby, very short koala ronin with a big round head and a small round belly, in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, strikes a triumphant pose on a sunbaked wasteland arena, katana raised high, while a dazed river crocodile slumps in the dust behind him. A ring of swirling dust and impact sparks encircles him like an emblem. Western comic book illustration, clean bold ink lines, rich natural color, dramatic sunset backlight, centered badge composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-showdown',
    key: 'door-closed',
    tier: 2,
    label: 'The Door Stays Shut',
    message:
      'You climbed the wasteland ladder and drove The Thing Behind the Door back into the dark.',
    tooltip:
      'Clear Story mode in Zuzu Showdown by defeating The Thing Behind the Door, at any difficulty.',
    subtleHint:
      'Past your rival and the Swamp Witch, something waits at the Thin Place.',
    icon: 'kind-icon:door',
    rule: { kind: 'event' },
    artPrompt:
      'On the Thin Place, a desert flat under a vast starry night, Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, braces his shoulder against a towering door made of starry darkness and forces it shut, katana in his other paw, as shadowy tentacles and a single great glowing eye recede into the narrowing gap. Moonlight rims his small round silhouette. Western comic book illustration, clean bold ink lines, rich natural color, high contrast, centered heroic badge composition, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-showdown',
    key: 'showdown-legend',
    tier: 3,
    label: 'Showdown Legend',
    message:
      'You walked the whole road at Showdown difficulty and still closed the door.',
    tooltip:
      'Clear Story mode in Zuzu Showdown after starting it on Showdown difficulty.',
    subtleHint: 'The hardest road starts at the top and never eases off.',
    icon: 'kind-icon:crown',
    rule: { kind: 'event' },
    artPrompt:
      'Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, stands alone atop a wind-carved mesa at dawn, katana sheathed, scarf snapping in the wind, while below him the rivals he defeated look up in respect: a lean coyote, a hyena matriarch, a storm crow, a river crocodile and an old komodo dragon. A plain wooden door stands shut in the sand far behind. Western comic book illustration, clean bold ink lines, golden dawn light, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },

  // Zuzu's Lair (ADMIN-ONLY: /admin/zuzu-lair, requiredRole ADMIN)
  {
    game: 'zuzu-lair',
    key: 'dry-gulch',
    tier: 1,
    label: 'Out of the Dry Gulch',
    message:
      'Bridge, scorpion, rockslide, bandit: Zuzu made it through the Dry Gulch alive.',
    tooltip:
      "Complete chapter one, The Dry Gulch, of Zuzu's Lair on any difficulty.",
    subtleHint: 'Watch for the glow, trust your thumbs, and keep walking.',
    icon: 'kind-icon:path',
    rule: { kind: 'event' },
    artPrompt:
      'Animated-adventure keyframe: Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, leaps clear of a snapping rope bridge high over a red-rock gulch, arms flung toward the far ledge as broken planks tumble into the canyon below, katana sheathed on his back. Hot desert sun and swirling dust. Western comic book illustration, clean ink lines, bold color, high contrast, heavy shadows, gritty weird-west atmosphere, centered heroic badge composition, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-lair',
    key: 'classic-gulch',
    tier: 2,
    label: 'Classic Reflexes',
    message:
      'No wide windows and no flash hints: you beat the Dry Gulch the old-fashioned way.',
    tooltip: "Complete The Dry Gulch in Zuzu's Lair on Classic difficulty.",
    subtleHint: 'The windows get narrower when nobody is helping you.',
    icon: 'kind-icon:lightning',
    rule: { kind: 'event' },
    artPrompt:
      'Frozen split-second in a narrow red canyon: Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, sidesteps a thundering rockslide, boulders hanging in mid-fall around him, while a giant desert scorpion lunges at the empty dust where he stood a heartbeat before. Speed lines and drifting grit. Western comic book illustration, clean ink lines, bold color, high contrast, heavy shadows, harsh noon light, centered dynamic badge composition, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-lair',
    key: 'not-a-scratch',
    tier: 3,
    label: 'Not a Scratch',
    message:
      'Classic difficulty, every window hit, not one life lost. The gulch never laid a paw on you.',
    tooltip:
      "Complete The Dry Gulch in Zuzu's Lair on Classic difficulty without losing a single life.",
    subtleHint: 'Three lives are a promise you never have to spend.',
    icon: 'kind-icon:shield',
    rule: { kind: 'event' },
    artPrompt:
      'At sunset at the mouth of a dusty gulch, Zuzu, a chubby, very short koala ronin in a spotless dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, calmly slides his katana back into its sheath with his back turned, while behind him a masked jackal bandit crumples to the ground and his pistol spins away. Long dramatic shadows and a blazing orange sky. Western comic book illustration, clean ink lines, bold color, high contrast, heavy shadows, centered heroic badge composition, every surface bare and unmarked.',
  },

  // Zuzu Pinball: The Last Bell (public: /play/zuzu-pinball; unlisted preview cabinet)
  {
    game: 'zuzu-pinball',
    key: 'harvest-moon',
    tier: 1,
    label: 'Harvest Moon',
    message:
      'Three balls locked in the Citadel, and the Harvest Moon rose over a table full of steel.',
    tooltip:
      'Lock three balls in the Citadel to start Harvest Moon multiball on Zuzu Pinball: The Last Bell.',
    subtleHint:
      'The Village ramp lights the lock; the Bell lane finds the Citadel.',
    icon: 'kind-icon:moon',
    rule: { kind: 'event' },
    artPrompt:
      'A haunted frontier pinball playfield seen from a dramatic low three-quarter angle: three gleaming steel balls burst from a little stone Citadel tower as an enormous orange harvest moon rises over painted desert hills, the flippers glowing and the ramps lit gold, motion trails and sparks streaking across the table. Glossy toy-like 3D render of Zuzu’s weird-west world, bright saturated color, warm lamp light and playful shadows, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-pinball',
    key: 'death-roll',
    tier: 2,
    label: 'Death Roll!',
    message:
      'The River Croc rolled at the Watering Hole, the coyote stayed safe, and the jackpot was yours.',
    tooltip:
      'Score a Death Roll jackpot at the Watering Hole on Zuzu Pinball: The Last Bell.',
    subtleHint:
      'Feed him in Homestead, then wait for the coyote to come and drink.',
    icon: 'kind-icon:water',
    rule: { kind: 'event' },
    artPrompt:
      'On a haunted frontier pinball table, a grinning animatronic river crocodile toy thrashes in a spinning death roll inside a splashing watering hole, a steel pinball flashing in his jaws and spray glittering in the lamp light, while a scruffy toy coyote drinks safely at the water’s edge. Glossy toy-like 3D render of Zuzu’s weird-west world, bright saturated color, warm lamp light and playful shadows, dynamic splash and motion trails, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-pinball',
    key: 'last-bell',
    tier: 3,
    label: 'The Last Bell',
    message:
      'Five seals broken, six balls loose, every shot a jackpot: you rang The Last Bell.',
    tooltip:
      'Break the fifth seal to start The Last Bell wizard multiball on Zuzu Pinball: The Last Bell.',
    subtleHint:
      'Every chapter the Mortuary tells breaks a seal. Count to five.',
    icon: 'kind-icon:sparkles',
    rule: { kind: 'event' },
    artPrompt:
      'At the heart of a haunted frontier pinball table at dusk, a great bronze abbey bell swings and rings out golden shockwaves while six gleaming steel balls arc through the air above glowing flippers, five shattered stone medallions scattered around the bell tower and ghostly lantern light rising from the playfield. Glossy toy-like 3D render of Zuzu’s weird-west world, bright saturated color, warm lamp light and playful shadows, sparks and motion trails, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
]
