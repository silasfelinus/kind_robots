// /utils/achievements/catalog/main/emperor-of-dust.ts

import type { GameAchievementDef } from '../../gameAchievements'

const STYLE =
  'Ash, brass and the last hundred days palette: ash-gray skies, brass lanterns, salvage and patched leather. Expressive animal folk, illustrated character design, bold ink linework, rich controlled colour, cinematic lighting, centered emblem composition, every surface bare and unmarked.'

export const EMPEROR_OF_DUST_ACHIEVEMENTS: GameAchievementDef[] = [
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
  {
    game: 'emperor-of-dust',
    key: 'triumph',
    tier: 1,
    label: 'Beyond Orders',
    message:
      'A party came home with more than you asked for. The court will be telling that one for days.',
    tooltip: 'In Emperor of Dust, have a mission end in a triumph.',
    subtleHint:
      'Send the follower whose hidden strengths fit the job, not just the strongest.',
    icon: 'kind-icon:star',
    rule: { kind: 'event' },
    artPrompt: `A returning expedition of anthropomorphic animal folk, a grinning badger quartermaster and a fox scout, rides through the Tower gate leading a cart heaped with rescued townsfolk, mended tools and a captured raider banner, far more than anyone ordered. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'first-relic',
    tier: 1,
    label: 'Item of Power',
    message:
      'An Item of Power is yours now, and it will follow you into every reign.',
    tooltip: 'In Emperor of Dust, claim a relic for the vault.',
    subtleHint: 'Some deeds leave something behind that outlasts the run.',
    icon: 'kind-icon:treasure',
    rule: { kind: 'event' },
    artPrompt: `In a candlelit stone vault beneath the Emperor’s Tower, a gloved komodo hand lifts a relic from a velvet-lined chest, a brass hourglass and a crow’s glass eye glowing softly side by side among dusty shelves of forgotten heirlooms. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'both-relics',
    tier: 2,
    label: 'The Vault Is Full',
    message:
      'The Eye of the Elder Crow and Komodo’s Brass Hourglass both rest in your vault.',
    tooltip: 'In Emperor of Dust, own every relic: the Eye and the Hourglass.',
    subtleHint: 'One relic is luck. Two is a habit.',
    icon: 'kind-icon:key',
    rule: { kind: 'event' },
    artPrompt: `Two Items of Power rest on a brass pedestal in the heart of the Tower vault, the glass eye of an elder crow glinting beside a brass hourglass that runs upward, while a wary young komodo dragon adviser locks the heavy vault door behind them. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'crypt-sealed',
    tier: 2,
    label: 'The Crypt Holds',
    message:
      'The door under the Abbey is shut. Whatever sang down there sleeps.',
    tooltip: 'In Emperor of Dust, send a party that seals the crypt.',
    subtleHint: 'The last dispatches decide whether the singing stops.',
    icon: 'kind-icon:lock',
    rule: { kind: 'event' },
    artPrompt: `Exhausted animal folk heroes, a scarred boar knight and a lantern-bearing hare, brace their shoulders against a massive iron-bound door deep beneath a ruined abbey, pale ghostly light leaking through the last gap as chains snap tight across it. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'abbess-unmasked',
    tier: 2,
    label: 'Unmasked',
    message: 'The Abbess’s mask came off, and the court finally saw her face.',
    tooltip: 'In Emperor of Dust, unmask the Abbess.',
    subtleHint:
      'Sealing the crypt is one thing. Doing it perfectly is another.',
    icon: 'kind-icon:mask',
    rule: { kind: 'event' },
    artPrompt: `In a cold abbey chapel lit by guttering candles, a porcelain mask falls and shatters on the flagstones before a tall robed animal folk abbess, her true face caught in a shaft of moonlight as the court’s animal folk agents step out of the shadows. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'reign-complete',
    tier: 2,
    label: 'Fifty Dawns',
    message:
      'Fifty days ruled, start to end. Whatever comes next, the kingdom remembers this reign.',
    tooltip: 'In Emperor of Dust, finish a reign through the last day.',
    subtleHint: 'Keep the Tower standing until the final dispatch comes home.',
    icon: 'kind-icon:calendar',
    rule: { kind: 'event' },
    artPrompt: `A weary young komodo dragon adviser and the aging emperor, seen from behind in a heavy ash-gray cloak, watch a fiftieth sunrise from the battlements of the Emperor’s Tower, a long calendar of tally marks scratched into the brass railing beside them as the wasteland glows gold below. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'long-night',
    tier: 1,
    label: 'The Long Night',
    message:
      'The singing spread and the court scattered. Somewhere, it is still alive.',
    tooltip: 'In Emperor of Dust, reach the ending The Long Night.',
    subtleHint: 'Not every reign ends with the door shut.',
    icon: 'kind-icon:moon',
    rule: { kind: 'event' },
    artPrompt: `A small band of animal folk refugees carrying the court’s last banner flees up a moonlit hillside, looking back at a distant abbey where an eerie pale glow spills along the roads, a single brass lantern held high to light the way into the hills. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'hundred-candles',
    tier: 2,
    label: 'A Hundred Candles',
    message:
      'The horror sleeps and the kingdom stands. Every year, the court reads the names aloud.',
    tooltip: 'In Emperor of Dust, reach the ending A Hundred Candles.',
    subtleHint: 'The memorial row can outweigh any peace.',
    icon: 'kind-icon:flame',
    rule: { kind: 'event' },
    artPrompt: `Rows of candles burn along a stone memorial wall inside the Emperor’s Tower as animal folk of every faction stand in quiet mourning, a fox herald reading from a long scroll while warm candlelight fills the dusty hall. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'open-roads',
    tier: 2,
    label: 'Open Roads',
    message:
      'The crown comes home smaller, the Freeholds run themselves, and the roads are open.',
    tooltip: 'In Emperor of Dust, reach the ending Open Roads.',
    subtleHint: 'The peace you make when no faction gets the last word.',
    icon: 'kind-icon:path',
    rule: { kind: 'event' },
    artPrompt: `Caravans of animal folk traders, a camel merchant, a mole surveyor and a goat courier, travel freely along a wide sunlit road winding away from the Emperor’s Tower, its gate standing open behind them and wildflowers growing through the old toll stones. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'iron-peace',
    tier: 2,
    label: 'Iron Peace',
    message:
      'The Gate Watch stands on every road. Nobody raids anybody. Nobody sings much.',
    tooltip: 'In Emperor of Dust, reach the ending Iron Peace.',
    subtleHint: 'Whose peace? The Gate Watch has an answer.',
    icon: 'kind-icon:shield',
    rule: { kind: 'event' },
    artPrompt: `Armoured rhinoceros and bulldog sentries of the Gate Watch stand in a long disciplined line across a dusty crossroads at noon, iron shields locked, while townsfolk pass quietly beneath watchtowers flying plain gray banners. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'crows-bargain',
    tier: 2,
    label: 'The Conclave’s Bargain',
    message:
      'The rain comes exactly when it should, and the Storm Crows name the price each spring.',
    tooltip: 'In Emperor of Dust, reach the ending The Conclave’s Bargain.',
    subtleHint: 'The Storm Crows always have an offer.',
    icon: 'kind-icon:storm',
    rule: { kind: 'event' },
    artPrompt: `A conclave of tall storm crows in feathered robes perches on the Tower battlements beneath swirling thunderclouds, one crow extending a talon to seal a bargain with the emperor as gentle rain finally falls on the parched fields below. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'witchwater-throne',
    tier: 2,
    label: 'The Witchwater Throne',
    message:
      'The Mire Mothers sit at the emperor’s left hand, and green lanterns burn on the tower.',
    tooltip: 'In Emperor of Dust, reach the ending The Witchwater Throne.',
    subtleHint: 'The fen keeps its promises. Be careful with yours.',
    icon: 'kind-icon:water',
    rule: { kind: 'event' },
    artPrompt: `Mysterious frog and newt matriarchs of the Mire Mothers sit beside the emperor’s throne in a hall reflected in still dark water, green paper lanterns glowing along the Tower walls and reeds curling up between the flagstones. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'tunnels-and-councils',
    tier: 2,
    label: 'Tunnels and Councils',
    message:
      'The Moles hold their assemblies in daylight now. Almost nobody is left out.',
    tooltip: 'In Emperor of Dust, reach the ending Tunnels and Councils.',
    subtleHint:
      'The badlands have voices too, if you go underground to hear them.',
    icon: 'kind-icon:people',
    rule: { kind: 'event' },
    artPrompt: `A lively village assembly of animal folk gathers in a sunlit square around a tunnel mouth, mole delegates in miner’s helmets raising their paws to vote beside rabbits, goats and lizards, while a patient komodo scribe tallies every hand. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'no-names',
    tier: 3,
    label: 'No Names on the Wall',
    message:
      'Fifty days and not one follower lost. The memorial row stays empty.',
    tooltip:
      'In Emperor of Dust, finish a reign without losing a single follower.',
    subtleHint: 'Every wound can be treated if you watch the barracks.',
    icon: 'kind-icon:heart',
    rule: { kind: 'event' },
    artPrompt: `Every follower of the court, a diverse band of anthropomorphic animal folk with patched armour and bandaged paws, stands together laughing in the Tower courtyard beside a bare, unmarked memorial wall, brass lanterns strung overhead at dusk. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'codex-complete',
    tier: 3,
    label: 'Knows Every Heart',
    message:
      'Every secret strength, weakness and true allegiance is written in your Codex.',
    tooltip:
      'In Emperor of Dust, learn every follower secret in the Codex, across any number of reigns.',
    subtleHint: 'Missions, talks and audiences all teach the Codex something.',
    icon: 'kind-icon:book-open',
    rule: { kind: 'event' },
    artPrompt: `A thick leather Codex lies open on a lectern in the Tower library, its pages filled with painted portraits of animal folk followers, while a young komodo dragon adviser closes the last clasp by candlelight with a satisfied look. ${STYLE}`,
  },
  {
    game: 'emperor-of-dust',
    key: 'bell-restored',
    tier: 3,
    label: 'The Bell Speaks',
    message:
      'The Silent Bell rang on the last night. Now Hollow Bell rings every evening.',
    tooltip: 'In Emperor of Dust, reach the ending The Bell Restored.',
    subtleHint: 'A peace for the Bell needs a Bell that actually rings.',
    icon: 'kind-icon:crown',
    rule: { kind: 'event' },
    artPrompt: `A great bronze bell swings in the tower of Hollow Bell at dusk, a newly forged clapper fished from the Mirefen ringing out over the hilltop, as animal folk from across the kingdom climb the winding road with lanterns to hear it. ${STYLE}`,
  },
]
