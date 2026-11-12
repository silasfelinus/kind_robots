// /utils/achievements/catalog/main/zuzu-shifting-lands.ts

import type { GameAchievementDef } from '../../gameAchievements'

// Awarded from utils/shiftingLands/journeyDeeds.ts, which diffs the journey
// ledger before and after each played step (never on restore). Since the
// character creator (t-052) anyone can walk the road, so every message speaks
// to "you" rather than naming one traveler.
export const ZUZU_SHIFTING_LANDS_ACHIEVEMENTS: GameAchievementDef[] = [
  // Zuzu: The Shifting Lands (public: /play/zuzu-shifting-lands)
  {
    game: 'zuzu-shifting-lands',
    key: 'open-door',
    tier: 1,
    label: 'Through the Open Door',
    message: 'You passed the Abbess’s trial and left the Homestead behind.',
    tooltip: 'Pass The Abbess’s Open Door, the Homestead’s trial.',
    subtleHint:
      'The bread is warm, but the locked corridor is the real question.',
    icon: 'kind-icon:map',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, steps out through a tall carved mission doorway into golden light, a warm loaf of bread tucked under one arm, the dusty Homestead fields and a spiral road winding away toward distant floating islands. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, dreamlike sense of adventure and discovery, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'crossing-gate',
    tier: 1,
    label: 'The Crossing Gate',
    message:
      'The keeper of Dustwater Crossing lifted the chain, and the river let you through.',
    tooltip: 'Pass The Crossing Gate, the trial of Dustwater Crossing.',
    subtleHint: 'A chain, a wheel, and a keeper who counts every boat.',
    icon: 'kind-icon:water',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: a great iron chain gate across a wide muddy river at dusk slowly rises, a counterweight wheel turning on a timber landing, small boats with paper lanterns gliding through the opening one after another, reeds and sandbars glowing amber. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, dreamlike sense of passage, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'witness-trial',
    tier: 1,
    label: 'Many Voices',
    message:
      'The people you helped stood beside you, and a trial gave way to their witness.',
    tooltip: 'Pass any trial by calling the people you helped as witnesses.',
    subtleHint: 'One voice can be silenced. A doorway full of them cannot.',
    icon: 'kind-icon:people',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: a crowd of travelers of many animal kinds, farmers, boat crews and caravan folk holding lanterns, stand shoulder to shoulder before a tall stone gate that swings open in front of them, warm light spilling from the lanterns onto a dusty road. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, hopeful dreamlike mood, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'scouted',
    tier: 1,
    label: 'Scouted Ahead',
    message:
      'You paid for the way in patience and bruises, then walked it straight past a trial.',
    tooltip: 'Prepare at a trial, then pass it by the route you scouted.',
    subtleHint: 'Before you knock, learn when the patrols change.',
    icon: 'kind-icon:compass',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: a hand-inked survey map pinned flat on a sun-warmed rock, a brass compass and chalk marks tracing a hidden ledge path around a guarded barricade, red canyon walls and a winding trail below under a wide evening sky. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, dreamlike sense of discovery, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'spent-deed',
    tier: 1,
    label: 'Paid in Deeds',
    message:
      'An old kindness opened a road no coin could, and you spent it gladly.',
    tooltip: 'Take a route that spends a deed you earned earlier on the road.',
    subtleHint: 'Some doors open only for what you did, not what you carry.',
    icon: 'kind-icon:handshake',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: a weathered wooden token carved with a simple handprint glows softly as it is laid in an open palm at a roadside gate, the gate swinging wide onto a sunlit path through golden grass and distant floating islands. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, warm dreamlike mood of trust repaid, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'healer',
    tier: 1,
    label: 'Willow Bark',
    message:
      'A measured dose of willow bark, and the road looked a little shorter.',
    tooltip: 'Use a willow-bark dose to recover on the road.',
    subtleHint: 'The infirmary taught you more than where the cots are.',
    icon: 'kind-icon:health-potion',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: curls of pale willow bark and a small clay cup of steaming tea rest on a folded travel cloth beside a campfire, a leather satchel and bedroll nearby, stars appearing over quiet hills. Vibrant fantastical landscape, rich saturated color, soft radiant firelight, gentle dreamlike mood of rest and recovery, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'turn-back',
    tier: 1,
    label: 'Knowing When',
    message:
      'You chose to stop walking while you still could. That is its own kind of ending.',
    tooltip: 'End a journey by retiring from the road.',
    subtleHint: 'Not every road has to be walked to its last gate.',
    icon: 'kind-icon:house',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: a worn walking staff leaning against the doorframe of a small adobe cottage at sunset, a pair of dusty sandals on the step, a spiral road curving away into far floating islands that glow pink and gold. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, peaceful dreamlike mood, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'canyon-warden',
    tier: 2,
    label: 'Past the Canyon Warden',
    message:
      'Three lands crossed: the masked warden of the Broken Tablelands let you over the last bridge.',
    tooltip: 'Pass The Canyon Warden, the Broken Tablelands’ trial.',
    subtleHint: 'Where two canyon roads meet, a mask guards the last bridge.',
    icon: 'kind-icon:compass',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, crosses a narrow plank bridge between towering red mesas of the Broken Tablelands as a storm rolls in, watchfires glowing on stone parapets, while a tall masked canyon warden steps aside with a respectful bow. Vibrant fantastical landscape, rich saturated color, soft radiant lighting breaking through storm clouds, dreamlike sense of adventure, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'storm-crow-depths',
    tier: 2,
    label: 'Out of the Depths',
    message:
      'The candle court of the Storm-Crow Depths let its guardian go, and let you climb back to the sky.',
    tooltip:
      'Pass The Deep-Cave Judgement, the trial of the Storm-Crow Depths.',
    subtleHint: 'Below the crows, a court of candles weighs an old binding.',
    icon: 'kind-icon:dungeon',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: a ring of tall blue candles in a vast cavern, glittering crystal walls and black storm-crow feathers drifting down a shaft of daylight, a broken stone shackle lying open in the center of the circle as a path climbs toward the light. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, dreamlike sense of release, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'hard-roll',
    tier: 2,
    label: 'Against the Odds',
    message: 'The dice owed you nothing, and you won the roll anyway.',
    tooltip: 'Succeed at a check that needed 10 or more on the two dice.',
    subtleHint: 'One roll in six. Someone has to be the one.',
    icon: 'kind-icon:dice',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: two carved bone dice tumbling through the air above a weathered map table, both landing on high faces in a burst of golden dust, a lantern and travel journal beside them, a stormy canyon sky beyond an open window. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, dramatic dreamlike moment of luck, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'kitchen-loyal',
    tier: 2,
    label: 'Two Witnesses',
    message:
      'You and the kitchen sister read the missing names together, and the court could not silence you both.',
    tooltip:
      'Stand with the kitchen sister when the cave court demands a scapegoat.',
    subtleHint: 'A ledger of names is heavier carried by one.',
    icon: 'kind-icon:book-open',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: an open family ledger held up between two travelers in a candlelit cave courtroom, its pages full of glowing ink names, robed judges leaning back from the light, a lantern on the stone floor. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, brave dreamlike mood of solidarity, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'restitution',
    tier: 2,
    label: 'Bread for Bread',
    message:
      'You came back with food instead of an excuse. It is not forgiveness, but it is a start.',
    tooltip:
      'Offer restitution to the kitchen sister for supplies you betrayed.',
    subtleHint: 'A broken trust can be mended, though never with words alone.',
    icon: 'kind-icon:hand-heart',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: a basket of fresh round loaves and dried fruit set down on a rough wooden table in a cave hearing room, a single lamp being handed across the table between two pairs of hands, families waiting in the warm shadows. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, quiet dreamlike mood of repair, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'debt-carried',
    tier: 2,
    label: 'The Debt Carried',
    message:
      'You took the quick road once, then stood with the people who paid for it.',
    tooltip: 'End a journey on the path of reckoning and partial repair.',
    subtleHint: 'A shortcut leaves a debt. Some travelers turn back to pay it.',
    icon: 'kind-icon:scale',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: two rope bridges span the same red canyon side by side, one old and frayed, one newly mended with fresh planks, travelers crossing both in the dawn light while a heavy sack of grain rests at the near end. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, thoughtful dreamlike mood, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'mittens-road',
    tier: 2,
    label: 'Mittens Knows a Way',
    message:
      'Every gap in the rocks, every back door: Jeffery Mittens talked, slipped or scouted past a trial.',
    tooltip: 'Pass any trial while traveling as Jeffery Mittens.',
    subtleHint: 'The quartermaster of the barefoot knows the old roads.',
    icon: 'kind-icon:key',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: Jeffery Mittens, a scrappy young raccoon in a patched brown vest with a bulging satchel of scavenged trinkets, grins as he squeezes through a narrow gap between canyon boulders beside a closed fortress gate, a hand-drawn map in his paw and moonlight on the red stone. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, playful dreamlike sense of adventure, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'fennec-road',
    tier: 2,
    label: 'Little Brother Fed First',
    message:
      'Big ears, small paws, fierce hearts: the fennec siblings passed a trial together.',
    tooltip: 'Pass any trial while traveling as the fennec siblings.',
    subtleHint: 'She shares the bread before she shares the danger.',
    icon: 'kind-icon:heart',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: a fierce young fennec fox girl with huge ears and a travel scarf holds her tiny toddler brother by the paw as they walk through an opened stone gate, she offers him half a loaf of bread, golden desert dunes and a ferry landing behind them. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, tender dreamlike sense of adventure, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'beyond-the-verge',
    tier: 3,
    label: 'Beyond the Verge',
    message:
      'All five lands behind you: you crossed the last threshold of the Black Verge.',
    tooltip:
      'Complete all five lands by passing the final trial, Beyond the Verge.',
    subtleHint:
      'A door without hinges, a stone key, and a price you refuse to pay.',
    icon: 'kind-icon:portal',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: Zuzu, a chubby, very short koala ronin in a dark terracotta poncho, orange scarf and wide-brimmed woven straw hat, stands at the final threshold of the Black Verge as a hingeless stone door swings open onto a starry sky, while behind him five lands curve away like a spiral road: golden fields, a river crossing, red canyons, blue-candled caves and black cliffs. The sky shifts from sunrise to starlight. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, dreamlike wonder, centered emblem composition, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'honest-road',
    tier: 3,
    label: 'No Toll Taken',
    message:
      'Five lands, and you never bought a place or pushed the danger onto anyone else.',
    tooltip:
      'Complete a journey without ever bribing or coercing your way past a trial.',
    subtleHint: 'The quick road is always offered. You can always say no.',
    icon: 'kind-icon:shield',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: an open toll gate on a mountain pass with an empty unclaimed coin dish on its post, a single set of footprints walking straight through toward a bright dawn, wildflowers along the path and five distant lands glowing below. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, clean dreamlike mood of integrity, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'wide-road',
    tier: 3,
    label: 'Wide Enough',
    message:
      'You reached the end of the road with everyone you refused to leave behind.',
    tooltip: 'Complete a journey on the road of hard-won solidarity.',
    subtleHint: 'At the last door, how many people are standing with you?',
    icon: 'kind-icon:users',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: a great hingeless stone door thrown wide open onto a starlit valley, a long procession of travelers, families, boat crews and caravan animals walking through together carrying lanterns, the road behind them broad and welcoming. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, triumphant dreamlike mood of community, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'constellation',
    tier: 3,
    label: 'Star-Read Road',
    message:
      'Your choices drew a new future in the stars: a commons, an open book, or a ford with no toll.',
    tooltip:
      'Earn one of the three hopeful constellation endings of the Black Verge.',
    subtleHint:
      'Witnesses, evidence and shared roads, repeated, become a shape in the sky.',
    icon: 'kind-icon:stars',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: above the black cliffs of the Verge, the night sky arranges itself into a glowing constellation shaped like an open lantern and a book, faint star-lines linking five small lands below, a quiet campfire on the cliff edge. Vibrant fantastical landscape, rich saturated color, soft radiant starlight, awe-filled dreamlike mood, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
  {
    game: 'zuzu-shifting-lands',
    key: 'own-legend',
    tier: 3,
    label: 'A Legend of Your Own',
    message:
      'A traveler of your own making walked all five lands. The road will remember the name.',
    tooltip: 'Complete a journey as a custom traveler you created.',
    subtleHint: 'The road has room for someone nobody has met yet.',
    icon: 'kind-icon:feather',
    rule: { kind: 'event' },
    artPrompt:
      'Illustrated board-game card scene: an empty traveler silhouette outlined in glowing gold stands at the top of a spiral road that winds through five shifting lands, golden fields, a river crossing, red canyons, candlelit caves and black cliffs, a blank parchment and quill floating beside it. Vibrant fantastical landscape, rich saturated color, soft radiant lighting, dreamlike sense of possibility, centered emblem composition, clear silhouette, every surface bare and unmarked.',
  },
]
