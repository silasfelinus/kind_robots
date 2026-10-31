// /utils/achievements/catalog/games.ts
//
// The three achievements of every game outside the arcade hall, each fired
// by code at the moment of the deed.

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
    artPrompt: 'A whimsical copper fusion chamber sparks with emerald lightning as a single impossible painted hybrid creature emerges, bold purple and brass specimen laboratory, richly detailed collectible achievement badge, no text.',
  },
  {
    game: 'hybridizer',
    key: 'recursive-discovery',
    tier: 2,
    label: 'Creature of Creatures',
    message: 'You fed a hybrid back into the chamber. Science resigned.',
    tooltip: 'Successfully combine a previous Hybridizer discovery with another ingredient.',
    subtleHint: 'The result is also an ingredient.',
    icon: 'kind-icon:dna',
    rule: { kind: 'event' },
    artPrompt: 'A spiral of three intertwined fantastical hybrid creatures in a glowing antique brass laboratory, expressive painterly illustration, amethyst and chartreuse, collectible achievement badge, no lettering.',
  },
  {
    game: 'hybridizer',
    key: 'art-critic',
    tier: 3,
    label: 'More Tentacles, Please',
    message: 'You demanded a second take and saved the first for posterity.',
    tooltip: 'Queue a new art version of an existing Hybridizer discovery.',
    subtleHint: 'Every masterpiece deserves an alternate universe.',
    icon: 'kind-icon:images',
    rule: { kind: 'event' },
    artPrompt: 'Two ornate Victorian natural history frames displaying alternate beautiful variations of one hybrid animal, one elevated to a glowing gold easel, acid-green sparks, collectible illustrated achievement badge, no text.',
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

  // Emperor of Dust (ADMIN-ONLY: /admin/emperor-of-dust, requiredRole ADMIN)
  {
    game: 'emperor-of-dust',
    key: 'orders-carried-out',
    tier: 1,
    label: 'Orders Carried Out',
    message:
      'Your first party rode out from the Tower and came home with good news.',
    tooltip: 'In Emperor of Dust, dispatch a party whose mission succeeds.',
    subtleHint:
      'The right leader, enough Horde, and an approach that suits them.',
    icon: 'kind-icon:flag',
    rule: { kind: 'event' },
    artPrompt:
      'A dusty expedition of anthropomorphic animal folk, a lean jackal scout, a broad tortoise engineer and a sharp-eyed otter captain, rides back toward a brass-banded Emperor’s Tower at dusk waving a ragged victory banner, as cheering Horde troops of many species spill out of the gate to greet them. Ash, brass and the last hundred days palette: ash-gray skies, brass lanterns, salvage and patched leather. Expressive animal folk, illustrated character design, bold ink linework, rich controlled colour, cinematic lighting, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'emperor-of-dust',
    key: 'day-well-ruled',
    tier: 2,
    label: 'A Day Well Ruled',
    message:
      'Aqueduct, toll road and Mirefen lanterns: every Day 1 petition ended in success.',
    tooltip:
      'In Emperor of Dust, succeed at all three Day 1 incidents in one run: the Broken Aqueduct, the Painted Wagons at the Toll and the Lanterns on the Mirefen Road.',
    subtleHint: 'Three petitions, three deadlines, and one Horde to share.',
    icon: 'kind-icon:crown',
    rule: { kind: 'event' },
    artPrompt:
      'From the balcony of the Emperor’s Tower at nightfall, Young Komodo, a lanky young komodo dragon adviser in a patched brass-buttoned coat, sweeps a clawed hand over the wasteland below: clear water rushing again through a mended aqueduct toward Hollow Bell, painted wagons rolling freely through an open toll gate, and a line of lanterns moving safely along the Mirefen road. Ash, brass and the last hundred days palette, ragged banners, brass lanterns, expressive animal folk, bold ink linework, rich controlled colour, cinematic lighting, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'emperor-of-dust',
    key: 'merciful-court',
    tier: 3,
    label: 'The Merciful Court',
    message:
      'You repaired, parleyed and escorted, and every kindness held. The wasteland still has a chance.',
    tooltip:
      'In Emperor of Dust, succeed at all three Day 1 incidents in one run using only the kind orders: repair the channel, offer safe passage and escort the refugees.',
    subtleHint: 'The gentlest orders are also the hardest rolls.',
    icon: 'kind-icon:heart',
    rule: { kind: 'event' },
    artPrompt:
      'Dawn beneath the Emperor’s Tower: swamp refugees carrying paper lanterns, punk hyena raiders beside their painted wagons and dusty townsfolk of Hollow Bell, all anthropomorphic animal folk, gather peacefully around a newly repaired stone water channel, sharing bread and cups of clear water, while a single brass lantern is held high at the center like a beacon. Ash, brass and the last hundred days palette warming to gold, ragged banners, patched leather, expressive animal folk, bold ink linework, rich controlled colour, cinematic lighting, centered emblem composition, every surface bare and unmarked.',
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
