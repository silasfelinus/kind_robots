import type {
  Character,
  Gender,
  Role,
  RoleId,
  StatKey,
  Support,
  Synergy,
  Value,
} from './types'

// The fifty presets. Any one of them can lead the delve; the rest are the
// companions you can bring. Who can romance whom depends on the hero's own
// identity and who they are drawn to, and on each companion's. Eight presets
// are not romanceable (aromantic, or already married to each other) and form
// deep platonic bonds instead.

export const ROLES: Record<RoleId, Role> = {
  guardian: {
    id: 'guardian',
    label: 'Guardian',
    archetype: 'tank',
    base: { hp: 62, atk: 9, def: 10, mag: 3, spd: 4, wit: 4 },
    skill: {
      name: 'Shield Wall',
      cooldown: 3,
      text: 'Draws every attack for two rounds and halves the damage the party takes.',
    },
    perk: 'Holds the line: enemies prefer to strike a Guardian.',
  },
  paladin: {
    id: 'paladin',
    label: 'Paladin',
    archetype: 'tank',
    base: { hp: 55, atk: 11, def: 8, mag: 7, spd: 5, wit: 5 },
    skill: {
      name: 'Smite',
      cooldown: 2,
      text: 'A heavy holy blow that also heals the Paladin.',
    },
    perk: 'Opens holy options in choice rooms.',
  },
  cleric: {
    id: 'cleric',
    label: 'Cleric',
    archetype: 'healer',
    base: { hp: 42, atk: 6, def: 5, mag: 13, spd: 6, wit: 7 },
    skill: {
      name: 'Mend',
      cooldown: 2,
      text: 'Heals the whole party and lifts poison.',
    },
    perk: 'Opens holy options in choice rooms.',
  },
  druid: {
    id: 'druid',
    label: 'Druid',
    archetype: 'healer',
    base: { hp: 44, atk: 7, def: 5, mag: 12, spd: 7, wit: 7 },
    skill: {
      name: 'Thornroot',
      cooldown: 3,
      text: 'Roots strike every enemy while the most wounded ally is healed.',
    },
    perk: 'Hears what the dungeon wants.',
  },
  warrior: {
    id: 'warrior',
    label: 'Warrior',
    archetype: 'striker',
    base: { hp: 52, atk: 14, def: 6, mag: 2, spd: 6, wit: 4 },
    skill: {
      name: 'Cleave',
      cooldown: 2,
      text: 'One sweeping blow against every enemy.',
    },
    perk: 'Hits hard and keeps hitting.',
  },
  monk: {
    id: 'monk',
    label: 'Monk',
    archetype: 'striker',
    base: { hp: 46, atk: 12, def: 5, mag: 4, spd: 11, wit: 6 },
    skill: {
      name: 'Flurry',
      cooldown: 2,
      text: 'Three quick strikes at random enemies.',
    },
    perk: 'Quick enough to dodge often.',
  },
  rogue: {
    id: 'rogue',
    label: 'Rogue',
    archetype: 'striker',
    base: { hp: 38, atk: 13, def: 4, mag: 3, spd: 12, wit: 8 },
    skill: {
      name: 'Backstab',
      cooldown: 3,
      text: 'A precise strike for more than double damage.',
    },
    perk: 'Spots mimics and traps before the lid lifts.',
  },
  ranger: {
    id: 'ranger',
    label: 'Ranger',
    archetype: 'striker',
    base: { hp: 42, atk: 12, def: 4, mag: 4, spd: 10, wit: 7 },
    skill: {
      name: 'Volley',
      cooldown: 2,
      text: 'Arrows into every enemy.',
    },
    perk: 'Scouts ahead: more doors show what lies behind them.',
  },
  mage: {
    id: 'mage',
    label: 'Mage',
    archetype: 'caster',
    base: { hp: 34, atk: 4, def: 3, mag: 15, spd: 7, wit: 11 },
    skill: {
      name: 'Fireball',
      cooldown: 3,
      text: 'A blast of fire across every enemy.',
    },
    perk: 'Reads old runes; puzzles come easier.',
  },
  warlock: {
    id: 'warlock',
    label: 'Warlock',
    archetype: 'caster',
    base: { hp: 38, atk: 5, def: 4, mag: 14, spd: 7, wit: 8 },
    skill: {
      name: 'Hex Drain',
      cooldown: 2,
      text: 'Drains one enemy and heals the Warlock by half the damage.',
    },
    perk: 'Opens dark bargains in choice rooms.',
  },
  necromancer: {
    id: 'necromancer',
    label: 'Necromancer',
    archetype: 'caster',
    base: { hp: 36, atk: 5, def: 4, mag: 14, spd: 6, wit: 10 },
    skill: {
      name: 'Wither',
      cooldown: 3,
      text: 'Weakens every enemy for two rounds and strikes the strongest.',
    },
    perk: 'Opens dark bargains in choice rooms.',
  },
  bard: {
    id: 'bard',
    label: 'Bard',
    archetype: 'support',
    base: { hp: 40, atk: 8, def: 4, mag: 10, spd: 9, wit: 8 },
    skill: {
      name: 'Anthem',
      cooldown: 3,
      text: 'The whole party strikes harder for two rounds.',
    },
    perk: 'Campfire talks run deeper with music.',
  },
  alchemist: {
    id: 'alchemist',
    label: 'Alchemist',
    archetype: 'support',
    base: { hp: 40, atk: 9, def: 4, mag: 10, spd: 7, wit: 10 },
    skill: {
      name: 'Flask Bomb',
      cooldown: 2,
      text: 'A bomb that bursts over every enemy and poisons them.',
    },
    perk: 'Potions heal far more.',
  },
  scholar: {
    id: 'scholar',
    label: 'Scholar',
    archetype: 'support',
    base: { hp: 36, atk: 6, def: 3, mag: 11, spd: 6, wit: 14 },
    skill: {
      name: 'Insight',
      cooldown: 3,
      text: 'Finds the weak points: every enemy takes more damage for two rounds.',
    },
    perk: 'Every puzzle gets a hint.',
  },
  artificer: {
    id: 'artificer',
    label: 'Artificer',
    archetype: 'support',
    base: { hp: 42, atk: 8, def: 6, mag: 11, spd: 6, wit: 12 },
    skill: {
      name: 'Clockwork Turret',
      cooldown: 4,
      text: 'Sets a turret that fires every round for three rounds.',
    },
    perk: 'Disarms traps.',
  },
}

const W: Gender = 'w'
const M: Gender = 'm'
const N: Gender = 'n'
const ALL: Gender[] = [W, M, N]

type Row = [
  id: string,
  name: string,
  gender: Gender,
  ancestry: string,
  role: RoleId,
  edge: StatKey,
  drawnTo: Gender[],
  romanceable: boolean,
  values: [Value, Value, Value],
  text: { blurb: string; secret: string; heart: string; arc: string },
  look: string,
  scene: string,
  extra?: Pick<Character, 'partner' | 'poly'>,
]

const ROWS: Row[] = [
  [
    'brannoc',
    'Brannoc Stoneharrow',
    M,
    'Dwarf',
    'guardian',
    'def',
    ALL,
    true,
    ['kind', 'bold', 'greedy'],
    {
      blurb:
        'A dwarf shieldbearer who hums work songs while he takes the hits meant for you.',
      secret:
        'He spent nine days trapped in a mine collapse. The dark stopped frightening him down there. Silence still does.',
      heart:
        'Brannoc sets down his shield, which he never does, and says there is room in his home and Thessaly’s, and they would like you in it.',
      arc: 'A long, happy marriage deciding, together, to open its door to one more.',
    },
    'A broad, stocky dwarf man with a braided chestnut beard threaded with iron rings, a dented round tower shield on his back and scale armour over a green wool tunic',
    'He sits on one side of a campfire with a tall blonde woman in white and gold plate on the other, both of them leaning in and smiling.',
    { partner: 'thessaly', poly: true },
  ],
  [
    'oona',
    'Oona Vell',
    W,
    'Half-giant',
    'guardian',
    'hp',
    [W],
    true,
    ['kind', 'pious', 'dark'],
    {
      blurb:
        'Seven feet of patience. Her shield is the front door of the tavern she used to run.',
      secret:
        'The tavern burned. She kept the door because her late wife carved both their names into it.',
      heart:
        'Oona carves a small new name beneath the two old ones on her door, and asks, very quietly, whether it can be yours.',
      arc: 'A widow learning there is room for a new name without scraping off the old ones.',
    },
    'A very tall, broad-shouldered half-giant woman with a shaved head, warm brown skin and a gentle face, carrying an old oak tavern door with iron hinges as a shield',
    'She carves a small name into the oak door leaning against the wall beside her, a knife in her big careful hand.',
  ],
  [
    'grell',
    'Grell the Wall',
    N,
    'Orc',
    'guardian',
    'def',
    [],
    false,
    ['bold', 'kind', 'curious'],
    {
      blurb:
        'An orc wall-warden. Speaks rarely, plants their feet, and does not move.',
      secret:
        'Grell raised Pip after finding her in a burned caravan. They call it a debt. It is love.',
      heart:
        'Grell presses their forehead to yours, the orcish oath of shield-kin. They say nothing. They do not need to.',
      arc: 'A quiet orc who has only ever protected one person, choosing a second.',
    },
    'A massive grey-green orc with small tusks, a heavy jaw and close-cropped black hair, wearing riveted iron plate and carrying a tall rectangular wall shield',
    'They rest their forehead against the delver’s forehead, eyes closed, a heavy hand on each shoulder.',
  ],
  [
    'corvin',
    'Corvin Ash',
    M,
    'Human',
    'guardian',
    'hp',
    [W, N],
    true,
    ['pious', 'bold', 'greedy'],
    {
      blurb:
        'A temple guard who walked out of his order the day they turned away a beggar.',
      secret:
        'He still says the morning prayers. He just stopped believing anyone listens except the people beside him.',
      heart:
        'Corvin admits he has started saying your name in the morning prayers, and he means to keep saying it.',
      arc: 'A man who lost his faith in gods finding a person worth praying to.',
    },
    'A tall lean human man in his thirties with a short dark beard and grey temple-guard armour with the insignia torn off, a kite shield on his arm',
    'He kneels in prayer by the fire with his eyes half open, glancing up at the delver with a shy smile.',
  ],
  [
    'thessaly',
    'Thessaly Dawnmere',
    W,
    'Human',
    'paladin',
    'atk',
    ALL,
    true,
    ['pious', 'kind', 'dark'],
    {
      blurb:
        'A Paladin of the Dawn, cheerful to a fault, married to Brannoc for twelve years.',
      secret:
        'Her order cast her out for marrying a dwarf. She kept the vows and dropped the order.',
      heart:
        'Thessaly laughs and takes your hand. They have talked it over for weeks, she says. They would both like to court you.',
      arc: 'A woman who kept her vows to love, not to an order, offering that love a little wider.',
    },
    'A tall, strong human woman with a long blonde braid and freckles, wearing polished white and gold plate armour with a sunburst on the breastplate and a longsword at her hip',
    'She sits beside a broad dwarf with a braided beard, holding out her open hand toward the delver with a wide grin.',
    { partner: 'brannoc', poly: true },
  ],
  [
    'idris',
    'Idris Calloway',
    M,
    'Half-elf',
    'paladin',
    'mag',
    [M],
    true,
    ['pious', 'curious', 'greedy'],
    {
      blurb:
        'An earnest half-elf paladin who apologizes to the monsters before he hits them.',
      secret:
        'He and Corso were together for three years. He still keeps the thief’s lockpick in his boot.',
      heart:
        'Idris kneels, entirely unprompted, and swears an oath to you that appears in no holy book.',
      arc: 'An honest knight learning to trust his heart again after it was stolen once.',
    },
    'A slender half-elf man with pointed ears, soft brown curls and earnest grey eyes, wearing silver plate with a blue tabard and a small lockpick tucked into his boot',
    'He kneels on one knee before the delver with a hand over his heart, firelight on his silver armour.',
  ],
  [
    'sable',
    'Sable Morrow',
    N,
    'Tiefling',
    'paladin',
    'def',
    ALL,
    true,
    ['bold', 'kind', 'pious'],
    {
      blurb:
        'A tiefling paladin of an order that disowned them. They keep every vow anyway, out of spite.',
      secret:
        'The order said a tiefling could hold no light. Sable holds it every day to prove them wrong.',
      heart:
        'Sable unbuckles their oath-sword and lays it at your feet. New vow, they say. Just you.',
      arc: 'A paladin who swore to prove an order wrong, swearing something for themself at last.',
    },
    'An androgynous tiefling with deep violet skin, curled black horns and short silver hair, wearing blackened plate armour with a cracked gold sun on the chest',
    'They lay a sheathed longsword across the flagstones at the delver’s feet, kneeling with a crooked smile.',
  ],
  [
    'hesk',
    'Mother Hesk',
    W,
    'Dwarf',
    'cleric',
    'wit',
    [],
    false,
    ['pious', 'kind', 'dark'],
    {
      blurb:
        'An old dwarf priestess with a bad knee and an unbeatable glare. She has buried four adventuring parties.',
      secret:
        'She remembers every one of their names, and says them at every campfire.',
      heart:
        'Mother Hesk adds your name to her prayers, among the living. She tells you to keep it there.',
      arc: 'An old priestess who keeps the names of the dead, adding one of the living.',
    },
    'An elderly dwarf woman with a white braided beard, deep wrinkles and a fierce squint, wearing brown priest robes, leaning on a heavy iron-shod staff',
    'She holds the delver’s hands between her own gnarled hands and bows her head in prayer.',
  ],
  [
    'fen',
    'Fen Larkspur',
    N,
    'Halfling',
    'cleric',
    'mag',
    [M, N],
    true,
    ['kind', 'curious', 'bold'],
    {
      blurb:
        'A halfling field medic who hums to patients and swears creatively at wounds.',
      secret:
        'Fen was a battlefield surgeon. They came underground to stop counting.',
      heart:
        'Fen stitches a tiny embroidered heart into the lining of your cloak and pretends they did not.',
      arc: 'A healer who stopped counting the dead, starting to count days with someone.',
    },
    'A small halfling with curly copper hair, rosy cheeks and round spectacles, wearing a stained leather apron full of bandages over a sky-blue tunic',
    'They sit with the delver’s cloak across their lap, stitching a small red heart into its lining with a needle.',
  ],
  [
    'aurel',
    'Brother Aurel',
    M,
    'Human',
    'cleric',
    'wit',
    ALL,
    true,
    ['pious', 'curious', 'greedy'],
    {
      blurb:
        'A priest with ink-stained fingers who copies down every carving he finds.',
      secret:
        'His abbey keeps a list of forbidden books. He has read all of them.',
      heart:
        'Aurel shows you the last page of his journal. It is a drawing of you, done many times over.',
      arc: 'A scholar-priest who has written about everything discovering what he cannot put into words.',
    },
    'A gentle human man in his forties with a tonsured head, kind brown eyes and ink-stained fingers, wearing grey monk robes with a satchel full of journals',
    'He holds open a leather journal toward the delver, its page covered in small pencil sketches of one face.',
  ],
  [
    'liesl',
    'Liesl Brasswhistle',
    W,
    'Gnome',
    'cleric',
    'mag',
    [M],
    true,
    ['kind', 'greedy', 'pious'],
    {
      blurb:
        'A gnome cleric who charges for miracles and offers a frequent-healer discount.',
      secret: 'Every coin goes home to a village that her temple forgot about.',
      heart:
        'Liesl tears up your tab. Lifetime membership, she says, and kisses your cheek.',
      arc: 'A healer who prices everything finding one thing she will give away.',
    },
    'A tiny gnome woman with a pink bob haircut, big green eyes and gold spectacles, wearing white cleric vestments covered in coin purses and a ledger on a chain',
    'She tears a long paper receipt in half with a delighted grin, coins spilling from her purses.',
  ],
  [
    'moss',
    'Moss',
    N,
    'Faun',
    'druid',
    'mag',
    ALL,
    true,
    ['kind', 'curious', 'greedy'],
    {
      blurb:
        'A faun druid who smells like rain and talks to lichen as though it answers.',
      secret:
        'Moss can hear the dungeon breathing. It is sick, and Moss wants to help it.',
      heart:
        'Moss braids a sprig of something blooming into your hair, though nothing should bloom down here.',
      arc: 'A gentle druid healing a sick dungeon, finding something else growing too.',
    },
    'A slender faun with small curled horns, goat legs, mossy green hair and freckled tan skin, wearing a vest of woven leaves and holding a gnarled staff sprouting ferns',
    'They braid a sprig of tiny white flowers into the delver’s hair, kneeling behind them.',
  ],
  [
    'yarrow',
    'Yarrow Thane',
    W,
    'Elf',
    'druid',
    'wit',
    [W, N],
    true,
    ['curious', 'dark', 'pious'],
    {
      blurb:
        'An elf druid of rot and renewal. She finds decay beautiful and says so at dinner.',
      secret:
        'She and Tobiah were together for eighty years. It ended over a single dead oak.',
      heart:
        'Yarrow plants a seed between you. It will take a century to grow, she says. She would like to watch it with you.',
      arc: 'An immortal who loves endings learning to plan a beginning.',
    },
    'A pale, ageless elf woman with long ash-grey hair, black lips and amber eyes, wearing a dark green cloak hung with dried mushrooms and bone charms',
    'She presses a single seed into a pot of dark soil set between her and the delver, both of their hands on the pot.',
  ],
  [
    'badger',
    'Old Badger',
    M,
    'Human',
    'druid',
    'hp',
    [],
    false,
    ['kind', 'curious', 'greedy'],
    {
      blurb:
        'An old hedge-hermit with a badger’s temper and a grandmother’s hands.',
      secret:
        'He came down here forty years ago looking for his brother, and still leaves bread out every night.',
      heart:
        'Badger gives you his brother’s walking stick. He would have liked you, he says, gruffly.',
      arc: 'An old hermit who stopped waiting for his brother long enough to make a friend.',
    },
    'A grizzled old human man with a wild white beard, bushy black eyebrows and a striped badger-pelt cloak, holding a crooked walking stick',
    'He holds out a carved walking stick to the delver with both hands, scowling and teary at once.',
  ],
  [
    'ragna',
    'Ragna Ironsong',
    W,
    'Human',
    'warrior',
    'atk',
    [M, W],
    true,
    ['bold', 'greedy', 'pious'],
    {
      blurb: 'A northern axe-singer who fights in time to her own war chants.',
      secret:
        'She lost a duel to Dagny once. She lost her heart to her the same day.',
      heart:
        'Ragna writes you a verse. It is terrible. She sings it anyway, loudly, and blushes.',
      arc: 'A woman who loves the fight learning to love the quiet after it.',
    },
    'A muscular human woman with wild red hair in many braids, blue woad stripes on her cheeks and a fur mantle, a double-bladed axe resting on her shoulder',
    'She stands by the fire singing at the top of her lungs, one hand on her chest and her cheeks red, while the delver laughs.',
  ],
  [
    'dagny',
    'Dagny Fell',
    W,
    'Orc',
    'warrior',
    'def',
    [W],
    true,
    ['bold', 'kind', 'greedy'],
    {
      blurb:
        'An orc swordswoman, calm as still water, devastating when she moves.',
      secret:
        'She left Ragna because Ragna loved the fight more than the quiet after. Dagny wanted the quiet.',
      heart:
        'Dagny sits with you in the quiet after a fight and says this is the part she wants to keep.',
      arc: 'A warrior who wants the stillness after battle finding someone to share it.',
    },
    'A tall orc woman with olive-green skin, small tusks, a shaved undercut of black hair and a calm expression, wearing lacquered leather armour with a curved sword',
    'She sits shoulder to shoulder with the delver in silence, her sword laid across her knees, eyes closed.',
  ],
  [
    'torvald',
    'Torvald Stoneharrow',
    M,
    'Dwarf',
    'warrior',
    'atk',
    [W],
    true,
    ['bold', 'greedy', 'curious'],
    {
      blurb:
        'Brannoc’s younger brother. Louder, greedier, and very proud of his beard rings.',
      secret:
        'Every ring in his beard marks a debt he paid off for his family. There are a lot of rings.',
      heart:
        'Torvald unthreads a gold ring from his beard and offers it to you. Dwarves do not joke about that.',
      arc: 'A dwarf who has paid every debt learning what it is to be given something.',
    },
    'A stout young dwarf man with a huge black beard threaded with dozens of gold rings, a broad grin and a heavy warhammer, wearing chainmail and a fur collar',
    'He holds up a small gold ring between thick fingers toward the delver, his beard full of other rings.',
  ],
  [
    'kaz',
    'Kaz Ironjaw',
    M,
    'Half-orc',
    'warrior',
    'hp',
    [M, N],
    true,
    ['bold', 'kind', 'dark'],
    {
      blurb:
        'A half-orc pit fighter turned bodyguard, soft-spoken off the field.',
      secret:
        'Kaz grows tomatoes. He has opinions about tomatoes. He will share them.',
      heart:
        'Kaz offers you the first tomato of next summer’s harvest. From him, that is a proposal.',
      arc: 'A fighter whose gentlest self lives in a garden, inviting someone in.',
    },
    'A huge half-orc man with mossy green skin, a scarred jaw, a gentle smile and a topknot, wearing a sleeveless leather jerkin with a greatsword on his back',
    'He holds out a single ripe red tomato in his enormous scarred palm toward the delver, smiling shyly.',
  ],
  [
    'pelham',
    'Sir Pelham Gorse',
    M,
    'Human',
    'warrior',
    'def',
    [W, M],
    true,
    ['bold', 'greedy', 'curious'],
    {
      blurb:
        'A knight-errant of very little renown. Vain, brave, and very bad with horses.',
      secret:
        'He was knighted by mistake when a herald misread a name. He has spent every day since trying to earn it.',
      heart:
        'Sir Pelham recites a fumbled, heartfelt sonnet and declares you his liege, his love and his luck.',
      arc: 'An accidental knight who finally has something real to fight for.',
    },
    'A handsome human man with a magnificent waxed moustache and a dented plumed helmet under one arm, wearing slightly too-shiny plate armour',
    'He kneels with one hand over his heart and the other flung wide, reciting with great feeling, his plumed helmet on the floor.',
  ],
  [
    'lio',
    'Lio Sunhand',
    M,
    'Human',
    'monk',
    'spd',
    [],
    false,
    ['pious', 'kind', 'greedy'],
    {
      blurb:
        'A monk of the Open Palm. Peaceful, precise, and politely uninterested in romance.',
      secret:
        'He gave away his family’s estate. He says the lightness was worth every coin.',
      heart:
        'Lio teaches you the closing breath of his order, the one shared only with family.',
      arc: 'A monk who gave away everything finding a family he did not have to buy.',
    },
    'A lean bald human man with brown skin and calm dark eyes, wearing saffron wrap robes and cloth hand wraps, standing barefoot',
    'He sits cross-legged facing the delver, both with eyes closed and palms pressed together, breathing in time.',
  ],
  [
    'juniper',
    'Juniper Quell',
    W,
    'Halfling',
    'monk',
    'atk',
    ALL,
    true,
    ['bold', 'curious', 'pious'],
    {
      blurb:
        'A halfling brawler with knuckles like walnuts and a laugh you can hear across a cavern.',
      secret:
        'She has been banned from eleven taverns. She keeps the list and is proud of it.',
      heart:
        'Juniper challenges you to an arm-wrestle with a kiss as the prize. She lets you win, badly.',
      arc: 'A brawler who has always fought for fun finding someone worth losing to.',
    },
    'A small, muscular halfling woman with a messy black bun, freckles and bandaged knuckles, wearing a sleeveless red gi and a wide grin',
    'She arm-wrestles the delver across an upturned crate, laughing, obviously letting her arm sink.',
  ],
  [
    'ash',
    'Ash-of-Seven-Winds',
    N,
    'Lizardfolk',
    'monk',
    'spd',
    [N, M],
    true,
    ['curious', 'pious', 'greedy'],
    {
      blurb:
        'A lizardfolk monk who counts breaths and storms with the same patience.',
      secret:
        'Their clutch-sibling Skarra left the monastery. Ash never stopped writing letters.',
      heart:
        'Ash offers you a smooth river stone, warmed in their hands: the courtship gift of their people.',
      arc: 'A patient monk who waits on everything, deciding not to wait on this.',
    },
    'A lean lizardfolk with sleek teal scales, golden slit eyes and a long tail, wearing pale grey monk wraps and a string of prayer beads',
    'They hold out a smooth grey river stone in both clawed hands toward the delver.',
  ],
  [
    'vex',
    'Vex Marlowe',
    N,
    'Tiefling',
    'rogue',
    'spd',
    ALL,
    true,
    ['greedy', 'bold', 'pious'],
    {
      blurb:
        'A tiefling cat-burglar with a grin full of trouble and pockets full of yours.',
      secret:
        'Vex steals from the rich and gives to an orphanage they refuse to talk about.',
      heart:
        'Vex returns everything they ever lifted from you, one item at a time, then steals a kiss.',
      arc: 'A thief who takes everything learning to give something back.',
    },
    'A wiry tiefling with red skin, swept-back horns, a long tail and a sly grin, wearing a dark hooded leather coat with many small pockets',
    'They lay out a row of small stolen trinkets on a cloth in front of the delver, then lean in with a sly grin.',
  ],
  [
    'pip',
    'Pip Thistledown',
    W,
    'Halfling',
    'rogue',
    'wit',
    [M],
    true,
    ['greedy', 'curious', 'dark'],
    {
      blurb:
        'A halfling locksmith, Grell’s sworn sister, who has met very few locks she could not talk around.',
      secret:
        'She still has nightmares about the caravan fire. Grell sits up with her every time.',
      heart:
        'Pip picks the lock of a little box. Inside is a key she made. It opens her door, she says.',
      arc: 'A locksmith who keeps every door shut handing over her own key.',
    },
    'A tiny halfling woman with a short blonde pixie cut, sharp blue eyes and a soot smudge on her nose, wearing a leather vest lined with lockpicks',
    'She opens a little brass box in her palm to show a single handmade key, holding it out to the delver.',
  ],
  [
    'corso',
    'Corso Vane',
    M,
    'Human',
    'rogue',
    'atk',
    [M],
    true,
    ['greedy', 'dark', 'kind'],
    {
      blurb: 'A silver-tongued thief with expensive tastes and cheap morals.',
      secret:
        'He left Idris because he did not think he deserved a paladin. He still thinks so.',
      heart:
        'Corso stops talking for once. Then he says he is tired of running from good things.',
      arc: 'A charming thief who always runs, deciding to stay.',
    },
    'A handsome human man with slicked-back black hair, a thin moustache and a gold earring, wearing a fine burgundy doublet and a rapier at his hip',
    'He sits close to the delver with his usual grin gone, holding their hand and looking at it quietly.',
  ],
  [
    'nettle',
    'Nettle',
    W,
    'Goblin',
    'artificer',
    'wit',
    [],
    false,
    ['greedy', 'curious', 'pious'],
    {
      blurb:
        'A goblin tinkerer who builds traps for fun and disarms them for money.',
      secret:
        'Nettle built half the traps on the first layer, years ago, on contract. She is a little sorry.',
      heart:
        'Nettle builds you a clockwork beetle that follows you everywhere. In goblin, that means friend forever.',
      arc: 'A goblin who builds traps for strangers building a gift for a friend.',
    },
    'A small green goblin woman with huge ears, brass goggles pushed up on her forehead and a gap-toothed grin, wearing a tool belt full of springs and gears',
    'She sets a small brass clockwork beetle on the flagstones and it crawls toward the delver, while she grins.',
  ],
  [
    'rook',
    'Rook Halloran',
    M,
    'Half-elf',
    'rogue',
    'spd',
    [W, N],
    true,
    ['curious', 'kind', 'dark'],
    {
      blurb: 'A half-elf scout, Wren’s twin, gentle-handed and quick to laugh.',
      secret:
        'Rook lost the family farm at cards. Wren thinks she does not know.',
      heart:
        'Rook carves your initials beside his own on his bow, so he never misses, he jokes. He is not joking.',
      arc: 'A charming twin carrying a secret, deciding someone deserves the whole of him.',
    },
    'A lanky half-elf man with tousled auburn hair, pointed ears, a freckled face and a crooked smile, wearing a green hooded cloak and two daggers at his belt',
    'He carves small letters into the grip of a longbow with a knife, showing the delver with a crooked smile.',
  ],
  [
    'wren',
    'Wren Halloran',
    W,
    'Half-elf',
    'ranger',
    'atk',
    [W],
    true,
    ['kind', 'curious', 'greedy'],
    {
      blurb: 'A half-elf ranger, Rook’s twin, sharp-eyed and sharper-tongued.',
      secret:
        'She knows Rook lost the farm. She is waiting for him to tell her.',
      heart:
        'Wren shows you the hidden places she has mapped for years, then marks a new one: ours.',
      arc: 'A ranger who maps every hidden place, marking one to share.',
    },
    'A lanky half-elf woman with long auburn hair in a braid, pointed ears, freckles and sharp green eyes, wearing a green ranger cloak with a longbow and quiver',
    'She unrolls a hand-drawn map across her knees and marks a small heart on it with charcoal, showing the delver.',
  ],
  [
    'tobiah',
    'Tobiah Fernweather',
    M,
    'Elf',
    'ranger',
    'spd',
    ALL,
    true,
    ['curious', 'bold', 'dark'],
    {
      blurb:
        'An elf wanderer who has walked every road on the surface and wants to see what lies under them.',
      secret:
        'He and Yarrow parted over a dead oak eighty years ago. He planted a new one. It is tall now.',
      heart:
        'Tobiah says that after centuries of wandering, you are the first place he wants to stay.',
      arc: 'A wanderer who has seen everything looking for a reason to stop.',
    },
    'A tall, ageless elf man with long silver-blond hair, sun-weathered skin and a traveller’s cloak covered in road dust, a carved yew bow on his back',
    'He sets down his worn traveller’s pack and boots by the fire, settling in beside the delver with a soft smile.',
  ],
  [
    'skarra',
    'Skarra',
    N,
    'Lizardfolk',
    'ranger',
    'hp',
    [W],
    true,
    ['bold', 'kind', 'greedy'],
    {
      blurb:
        'A lizardfolk tracker who left the monastery to hunt the things that eat monasteries.',
      secret:
        'Skarra reads every one of Ash’s letters. They have never written back. They do not know how to begin.',
      heart:
        'Skarra offers you the tooth of their first kill on a cord. For your neck, they say. For luck. For us.',
      arc: 'A hunter who never answers letters, finding the words for one person.',
    },
    'A muscular lizardfolk with mottled brown and orange scales, a frilled crest and scarred snout, wearing a hide harness with a spear and a necklace of teeth',
    'They tie a cord with a large curved tooth around the delver’s neck with careful clawed hands.',
  ],
  [
    'hollis',
    'Hollis Reed',
    W,
    'Human',
    'ranger',
    'wit',
    [M, N],
    true,
    ['curious', 'greedy', 'bold'],
    {
      blurb:
        'A cautious trapper who checks every step twice and every exit three times.',
      secret:
        'She is the only survivor of her last party. She checks so nobody else has to.',
      heart:
        'Hollis tells you she has stopped checking the exits when you are near. It is the most romantic thing she has ever said.',
      arc: 'A survivor who watches every exit finding a reason to stay put.',
    },
    'A wiry human woman in her forties with short grey-streaked brown hair, a weathered face and watchful eyes, wearing a patched trapper’s coat with a crossbow',
    'She sits with her back to the chamber door for once, her crossbow set aside, leaning her head on the delver’s shoulder.',
  ],
  [
    'quillon',
    'Archmage Quillon Fairweather',
    M,
    'Gnome',
    'mage',
    'mag',
    [M],
    false,
    ['curious', 'kind', 'bold'],
    {
      blurb:
        'A gnome archmage, ninety-two years old, married to Ambrose for forty of them.',
      secret:
        'He is dying, slowly, of too much magic. He came down here to see one last wonder with his husband.',
      heart:
        'Quillon names a minor star after you. He already named a major one after Ambrose.',
      arc: 'An old wizard spending his last wonder on the people he loves.',
    },
    'An elderly gnome man with a long white beard tucked into his belt, twinkling blue eyes and a tall star-spangled midnight-blue hat, holding a crystal-topped staff',
    'He points up at a ceiling of glowing conjured stars with his staff, telling the delver about one small star.',
    { partner: 'ambrose' },
  ],
  [
    'seraphine',
    'Seraphine Glass',
    W,
    'Elf',
    'mage',
    'wit',
    [W, N],
    true,
    ['curious', 'greedy', 'kind'],
    {
      blurb:
        'An elf arcanist, brilliant and insufferable, top of every class she ever took.',
      secret:
        'She failed one exam once. Marisol beat her. She has never recovered.',
      heart:
        'Seraphine admits, haltingly, that she has been wrong about something: about preferring to be alone.',
      arc: 'A genius who has never been wrong admitting she was wrong about being alone.',
    },
    'A poised elf woman with sleek black hair in a high knot, sharp cheekbones and violet eyes, wearing immaculate white and silver robes and floating glass orbs',
    'She sits stiffly beside the delver, fidgeting with a glowing glass orb, and turns pink as she speaks.',
  ],
  [
    'ember',
    'Ember Kett',
    N,
    'Human',
    'mage',
    'atk',
    ALL,
    true,
    ['bold', 'curious', 'pious'],
    {
      blurb:
        'A pyromancer with singed eyebrows and a nervous habit of lighting candles with their fingers.',
      secret:
        'Ember burned down their school by accident. Quince was the only one who did not run.',
      heart:
        'Ember lights a small steady flame in your palm that does not burn. They are learning control, they say. For you.',
      arc: 'A walking fire hazard learning gentleness for someone else’s sake.',
    },
    'A young human with short spiky orange hair, singed eyebrows, soot-smudged brown skin and an anxious grin, wearing a scorched red mage coat with rolled sleeves',
    'They cup a small steady flame in their palm and pour it gently into the delver’s open hand.',
  ],
  [
    'marisol',
    'Marisol Vantreese',
    W,
    'Human',
    'mage',
    'def',
    [M, W],
    true,
    ['curious', 'kind', 'dark'],
    {
      blurb:
        'A warm-hearted wizard of wards who apologizes to doors before blasting them.',
      secret:
        'She beat Seraphine at that exam on purpose, so Seraphine would stop coasting. She regrets nothing.',
      heart:
        'Marisol weaves a ward around you both. Nothing gets in, she says, and then, softer: and I want to stay in.',
      arc: 'A protector of everyone else letting someone inside her walls.',
    },
    'A plump, cheerful human woman with long curly dark hair, brown skin and gold hoop earrings, wearing layered teal robes embroidered with runes',
    'She traces a shimmering circle of blue runes in the air around herself and the delver, smiling softly.',
  ],
  [
    'lucan',
    'Lucan Thorne',
    M,
    'Tiefling',
    'warlock',
    'mag',
    ALL,
    true,
    ['dark', 'greedy', 'pious'],
    {
      blurb:
        'A tiefling warlock with a velvet voice and a contract he will let nobody read.',
      secret:
        'The contract is for his sister’s life. The price is paid a little every day.',
      heart:
        'Lucan finally lets you read the contract. Then he tears out the escape clause. He is staying, he says.',
      arc: 'A man bound by a dark contract choosing a bond he wrote himself.',
    },
    'A tall tiefling man with dusky crimson skin, long black hair, elegant ram horns and gold eyes, wearing a black velvet coat and holding a scroll sealed in red wax',
    'He hands the delver a long unrolled parchment contract, then tears a strip from its bottom edge with a wry smile.',
  ],
  [
    'hesper',
    'Hesper Crane',
    W,
    'Human',
    'warlock',
    'wit',
    [W],
    true,
    ['dark', 'curious', 'pious'],
    {
      blurb:
        'A warlock sworn to a patron who is, by every indication, a very large moth.',
      secret:
        'The moth is kind. Hesper is unused to kindness and does not trust it, yet.',
      heart:
        'Hesper says her patron approves of you. Then she says she does not care whether it does.',
      arc: 'A warlock who distrusts kindness learning to accept it.',
    },
    'A thin, pale human woman with a sharp face, a black bob haircut and dark lipstick, wearing a grey feathered shawl with a large pale moth resting on her shoulder',
    'She sits beside the delver while a huge pale moth hovers between them, and she reaches for the delver’s hand.',
  ],
  [
    'gloam',
    'Gloam',
    N,
    'Mothkin',
    'warlock',
    'spd',
    ALL,
    true,
    ['dark', 'kind', 'greedy'],
    {
      blurb:
        'A mothkin warlock, soft-winged and soft-spoken, drawn to every light down here.',
      secret:
        'Gloam’s people are dying out. They want to find somewhere bright enough to bring them.',
      heart:
        'Gloam folds their dusty wings around you. You are the brightest thing they have found, they whisper.',
      arc: 'A moth searching for a light bright enough for their whole people.',
    },
    'A slender mothkin with fluffy white fur at the collar, feathery antennae, large black eyes and broad dusty grey-and-cream patterned wings, wearing a simple dark robe',
    'They fold their broad patterned wings around the delver beside the fire, the two of them wrapped together.',
  ],
  [
    'mortimer',
    'Mortimer Vale',
    M,
    'Human',
    'necromancer',
    'wit',
    [M, N],
    true,
    ['dark', 'kind', 'bold'],
    {
      blurb:
        'A gentle necromancer who talks to bones politely and thanks them for their service.',
      secret:
        'He raises the dead only to ask what they need to rest. Usually it is to be remembered.',
      heart:
        'Mortimer says he has spent his life with the dead, and you made him want to spend the rest of it with the living.',
      arc: 'A man at home among the dead choosing the living.',
    },
    'A gaunt, kindly human man with untidy grey hair, round wire spectacles and a long black coat, holding a small polished skull that wears a tiny hat',
    'He sets a small polished skull aside on a stone and takes the delver’s hand in both of his, smiling.',
  ],
  [
    'ines',
    'Ines Ravelle',
    W,
    'Half-elf',
    'necromancer',
    'mag',
    [M],
    true,
    ['dark', 'greedy', 'kind'],
    {
      blurb:
        'An ambitious necromancer who believes death is a problem nobody has solved yet.',
      secret:
        'Her mother died when she was nine. Every spell she has learned since has been for one conversation.',
      heart:
        'Ines admits she wants to live a long, long time now, and that you are the reason.',
      arc: 'A necromancer chasing the dead discovering a reason to live.',
    },
    'A tall half-elf woman with long black hair streaked white, pointed ears and green-glowing eyes, wearing a high-collared black gown and bone rings',
    'She sits close with her glowing green eyes softened, her bone-ringed hand resting over the delver’s heart.',
  ],
  [
    'crell',
    'The Widow Crell',
    W,
    'Human',
    'necromancer',
    'wit',
    [],
    false,
    ['dark', 'curious', 'greedy'],
    {
      blurb:
        'An old graveyard witch with crows in her shawl and dirt under her nails.',
      secret: 'She is no widow and never married. She just liked the title.',
      heart:
        'Crell gives you a crow feather. Show it to any crow, she says. They will know you are kin of hers.',
      arc: 'A solitary witch adopting one more stray.',
    },
    'A bent old human woman with wild grey hair, a hooked nose and bright black eyes, wearing a ragged black shawl with two crows perched on her shoulders',
    'She tucks a glossy black crow feather into the delver’s collar while a crow on her shoulder watches.',
  ],
  [
    'jory',
    'Jory Larkin',
    M,
    'Halfling',
    'bard',
    'spd',
    ALL,
    true,
    ['bold', 'curious', 'dark'],
    {
      blurb:
        'A halfling lute-player whose songs get better the worse things get.',
      secret:
        'Jory has written a ballad about every party he travelled with. None of them have endings yet.',
      heart:
        'Jory plays you the ballad he is writing about this delve. The last verse is about you, and it is his best.',
      arc: 'A bard who never finishes a song, writing the last verse.',
    },
    'A cheerful halfling man with curly brown hair, a feathered green cap and dimples, wearing a patchwork waistcoat and holding a well-worn lute',
    'He sits cross-legged playing a lute for the delver alone, singing softly, eyes on their face.',
  ],
  [
    'delphine',
    'Delphine Sorrel',
    W,
    'Tiefling',
    'bard',
    'mag',
    [W, M],
    true,
    ['greedy', 'bold', 'pious'],
    {
      blurb: 'A tiefling chanteuse who sings for gold and fights for applause.',
      secret:
        'She once sang for a king who refused to pay. She stole his crown. She still has it.',
      heart:
        'Delphine sings to you, with no audience and no coin: the first free song she has sung in years.',
      arc: 'A performer who sings for coin, singing one song for free.',
    },
    'A glamorous tiefling woman with lavender skin, sweeping curved horns and glossy black curls, wearing a sequined emerald gown and a small stolen gold crown',
    'She sings to the delver alone by the fire, one hand extended, her sequined gown catching the firelight.',
  ],
  [
    'calla',
    'Calla',
    N,
    'Faun',
    'bard',
    'wit',
    [W, N],
    true,
    ['kind', 'curious', 'greedy'],
    {
      blurb: 'A faun piper whose tunes make wounds close and frowns uncurl.',
      secret:
        'Calla is afraid of the dark. They play so they never have to hear it.',
      heart:
        'Calla plays a song with no name. It is yours, they say. They will play it for nobody else.',
      arc: 'A musician who plays to drown out the dark, playing for someone instead.',
    },
    'A small faun with soft fawn-spotted legs, short ram horns and a mop of honey-coloured curls, wearing a woven vest and holding a set of reed panpipes',
    'They play a set of reed panpipes close beside the delver, eyes closed, the firelight warm on their curls.',
  ],
  [
    'benny',
    'Benedikt Haas',
    M,
    'Dwarf',
    'bard',
    'hp',
    [W],
    true,
    ['kind', 'greedy', 'dark'],
    {
      blurb:
        'A dwarf tavern singer with a beer-hall baritone and a heart like a hearth.',
      secret:
        'Benny was meant to be a smith like his father. He picked up a fiddle instead and was disowned for it.',
      heart:
        'Benny writes your name on his fiddle in chalk. Then, after thinking about it, he carves it in for good.',
      arc: 'A disowned son who chose music finding a family that sings along.',
    },
    'A round, rosy-cheeked dwarf man with a bushy blond beard in two plaits and a big laugh, wearing a leather apron over a red shirt and holding a fiddle',
    'He carves letters into the body of his fiddle with a small knife while the delver watches, beaming.',
  ],
  [
    'quince',
    'Quince Mabry',
    N,
    'Gnome',
    'alchemist',
    'wit',
    ALL,
    true,
    ['curious', 'greedy', 'pious'],
    {
      blurb:
        'A gnome alchemist who labels every bottle and trusts none of the labels.',
      secret:
        'Quince’s master was Aldous Pike. They left after learning what he tested his tonics on.',
      heart:
        'Quince brews a tea with no purpose at all except tasting good. For you, they say. Only for you.',
      arc: 'An alchemist who measures everything making something just to be kind.',
    },
    'A small gnome with a mop of lilac hair, thick goggles and a cheerful round face, wearing a stained lab coat with dozens of labelled vials on bandoliers',
    'They pour a steaming cup of tea from a glass flask and offer it to the delver with both hands.',
  ],
  [
    'aldous',
    'Dr. Aldous Pike',
    M,
    'Human',
    'alchemist',
    'mag',
    [W],
    true,
    ['curious', 'dark', 'kind'],
    {
      blurb:
        'A coldly brilliant alchemist with a waistcoat full of vials and very few scruples.',
      secret:
        'He tested his first tonics on himself. He has been slowly poisoned for decades and will not stop working.',
      heart:
        'Aldous pours out his entire experimental stock. He would like to be around, he says, surprised at himself.',
      arc: 'A cold scientist poisoning himself for progress choosing a longer life.',
    },
    'A thin, pale human man in his fifties with slicked grey hair, a sharp nose and tired eyes, wearing a black waistcoat lined with green glowing vials',
    'He tips a row of glowing green vials out onto the flagstones one by one, while the delver holds his other hand.',
  ],
  [
    'ambrose',
    'Ambrose Kettleby',
    M,
    'Human',
    'scholar',
    'wit',
    [M],
    false,
    ['curious', 'pious', 'bold'],
    {
      blurb:
        'A scholar of dead languages and Quillon’s husband of forty years. He footnotes his own speech.',
      secret:
        'He knows Quillon is dying. He came to make sure the last wonder is a good one.',
      heart:
        'Ambrose dedicates his next book to you: to the one who carried the lantern.',
      arc: 'A devoted husband making sure the last wonder is worthy.',
    },
    'An elderly human man with neat white hair, half-moon spectacles and a tweed coat with ink-stained cuffs, carrying an armful of old books',
    'He writes a dedication on the first page of a new leather-bound book and shows it to the delver.',
    { partner: 'quillon' },
  ],
  [
    'tamsin',
    'Tamsin Holloway',
    W,
    'Human',
    'scholar',
    'wit',
    ALL,
    true,
    ['curious', 'kind', 'dark'],
    {
      blurb: 'A young cartographer who maps as she walks and reads every wall.',
      secret:
        'She has never been anywhere before this. Everything is the most amazing thing she has ever seen, and she means it.',
      heart:
        'Tamsin draws a map with two landmarks: where you met, and where you are right now.',
      arc: 'A first-time traveller finding the best thing on the map.',
    },
    'A young human woman with wild brown curls held back by a pencil, big brown eyes and ink on her cheek, wearing a satchel stuffed with rolled maps',
    'She sketches a small map on parchment on her knee with two marked points, showing it eagerly to the delver.',
  ],
  [
    'gizelle',
    'Gizelle Brasswhistle',
    W,
    'Gnome',
    'artificer',
    'def',
    [M, N],
    true,
    ['curious', 'bold', 'pious'],
    {
      blurb:
        'A gnome engineer with goggles, a wrench and a clockwork arm she built herself.',
      secret:
        'She lost her arm in a forge accident at sixteen. The new one is better. That annoys her.',
      heart:
        'Gizelle builds a tiny music box that plays your laugh. She recorded it when you were not looking.',
      arc: 'An inventor who rebuilds everything finding something she would keep exactly as it is.',
    },
    'A small gnome woman with a spiky teal ponytail, oil-smudged cheeks and brass goggles, wearing overalls, with a gleaming clockwork brass right arm',
    'She winds a tiny brass music box with her clockwork hand and holds it up for the delver to hear.',
  ],
]

export const CHARACTERS: Character[] = ROWS.map(
  ([
    id,
    name,
    gender,
    ancestry,
    role,
    edge,
    drawnTo,
    romanceable,
    [like1, like2, dislike],
    text,
    look,
    scene,
    extra,
  ]) => ({
    id,
    name,
    gender,
    ancestry,
    role,
    edge,
    drawnTo,
    romanceable,
    likes: [like1, like2],
    dislikes: dislike,
    ...text,
    look,
    scene,
    ...extra,
  }),
)

const BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]))

export function character(id: string): Character {
  const found = BY_ID.get(id)
  if (!found) throw new Error(`Unknown Deepheart character "${id}"`)
  return found
}

export function shortName(c: Character): string {
  if (c.name.startsWith('The ')) return c.name.split(' ').slice(-1)[0]!
  const parts = c.name.split(' ')
  if (
    ['Sir', 'Brother', 'Mother', 'Old', 'Archmage', 'Dr.'].includes(parts[0]!)
  )
    return parts[1]!
  return parts[0]!.replace(/-of-.*/, '')
}

export const PRONOUNS: Record<
  Gender,
  { they: string; them: string; their: string }
> = {
  w: { they: 'she', them: 'her', their: 'her' },
  m: { they: 'he', them: 'him', their: 'his' },
  n: { they: 'they', them: 'them', their: 'their' },
}

export const GENDER_LABEL: Record<Gender, string> = {
  w: 'women',
  m: 'men',
  n: 'nonbinary people',
}

const S = (
  a: string,
  b: string,
  kind: Support['kind'],
  name: string,
  bonus: Support['bonus'],
  scene: string,
): Support => ({ a, b, kind, name, bonus, scene })

export const SUPPORTS: Support[] = [
  S(
    'brannoc',
    'thessaly',
    'lovers',
    'Hearthbound',
    { def: 0.1, atk: 0.1 },
    'Thessaly falls asleep against Brannoc’s shoulder. He does not move for three hours, and tells nobody his arm went numb.',
  ),
  S(
    'quillon',
    'ambrose',
    'lovers',
    'Forty Years Married',
    { mag: 0.15, wit: 0.15 },
    'Ambrose corrects Quillon’s pronunciation of an old rune. Quillon corrects him back. They have had this argument since the year they met, and both are delighted.',
  ),
  S(
    'brannoc',
    'torvald',
    'siblings',
    'Stoneharrow Brothers',
    { def: 0.1, hp: 0.1 },
    'Torvald counts the rings in his beard aloud. Brannoc quietly adds one of his own. Neither mentions it.',
  ),
  S(
    'grell',
    'pip',
    'sworn',
    'Sworn Kin',
    { atk: 0.1, def: 0.1 },
    'Pip wakes from a nightmare. Grell is already awake, already sitting beside her, already holding out a cup of tea.',
  ),
  S(
    'idris',
    'corso',
    'exes',
    'Old Flame',
    { atk: 0.15 },
    'Corso finds his old lockpick in Idris’s boot while mending it. He puts it back exactly where it was.',
  ),
  S(
    'idris',
    'hesk',
    'mentor',
    'The Old Rite',
    { mag: 0.1, def: 0.05 },
    'Mother Hesk makes Idris recite the Old Rite twice. The second time she mouths it along with him.',
  ),
  S(
    'ragna',
    'dagny',
    'exes',
    'Ironsong and Fell',
    { atk: 0.15 },
    'Ragna sings a war chant. Dagny hums the harmony she used to hum. Ragna loses the words.',
  ),
  S(
    'rook',
    'wren',
    'siblings',
    'Halloran Twins',
    { spd: 0.15 },
    'Rook starts to tell Wren about the farm. Wren says she already knows, and that she forgave him years ago.',
  ),
  S(
    'moss',
    'badger',
    'friends',
    'Hedge-Kin',
    { hp: 0.1, mag: 0.05 },
    'Moss and Badger argue about which mushroom is safe. Both are wrong. They laugh until they cry.',
  ),
  S(
    'moss',
    'calla',
    'friends',
    'Pipes and Moss',
    { mag: 0.1 },
    'Calla plays. Moss hums. Somewhere in the walls, the dungeon’s breathing slows to match.',
  ),
  S(
    'lucan',
    'hesper',
    'rivals',
    'Competing Patrons',
    { mag: 0.15 },
    'Lucan and Hesper compare contracts. Hesper’s moth wins. Lucan is quietly jealous.',
  ),
  S(
    'gloam',
    'hesper',
    'friends',
    'The Moth Court',
    { mag: 0.1, spd: 0.05 },
    'Hesper’s patron settles on Gloam’s antennae. Gloam holds very, very still, and is very, very happy.',
  ),
  S(
    'mortimer',
    'crell',
    'mentor',
    'Graveside Lessons',
    { mag: 0.1, wit: 0.05 },
    'Crell teaches Mortimer the crow-call that summons a murder. He gets it on the ninth try.',
  ),
  S(
    'ines',
    'crell',
    'rivals',
    'Old Death, New Death',
    { mag: 0.15 },
    'Ines calls Crell’s methods primitive. Crell raises a skeleton that bows to Ines. Ines takes notes.',
  ),
  S(
    'jory',
    'delphine',
    'rivals',
    'Duelling Lutes',
    { spd: 0.1, mag: 0.05 },
    'Jory and Delphine trade verses until dawn. Neither will admit the other won.',
  ),
  S(
    'jory',
    'pip',
    'friends',
    'Pocket Crew',
    { spd: 0.1 },
    'Jory writes Pip into his ballad as a giant. She demands two more verses.',
  ),
  S(
    'fen',
    'pip',
    'siblings',
    'Thistledown Cousins',
    { hp: 0.1 },
    'Fen re-bandages Pip’s knuckles and lectures her the whole time. Pip lets them.',
  ),
  S(
    'kaz',
    'dagny',
    'siblings',
    'Ironjaw Kin',
    { hp: 0.1, atk: 0.05 },
    'Kaz offers Dagny a tomato. She eats it in one bite. He looks betrayed.',
  ),
  S(
    'seraphine',
    'marisol',
    'rivals',
    'Academy Rivals',
    { mag: 0.15 },
    'Seraphine finally asks Marisol about that exam. Marisol tells the truth. Seraphine laughs for the first time in years.',
  ),
  S(
    'ember',
    'quince',
    'friends',
    'Things That Go Boom',
    { atk: 0.1, mag: 0.05 },
    'Quince fireproofs Ember’s coat. Ember sets fire to it to test. It holds. They high-five.',
  ),
  S(
    'aldous',
    'quince',
    'rivals',
    'Competing Formulae',
    { wit: 0.15 },
    'Aldous corrects a measurement of Quince’s. Quince was right. Aldous apologizes, which has never happened.',
  ),
  S(
    'gizelle',
    'nettle',
    'friends',
    'Gearheads',
    { wit: 0.1, def: 0.05 },
    'Nettle and Gizelle build a trap together and argue whether to trigger it. They trigger it.',
  ),
  S(
    'gizelle',
    'liesl',
    'siblings',
    'Brasswhistle Sisters',
    { def: 0.1, mag: 0.05 },
    'Liesl offers Gizelle a discount on healing. Gizelle offers Liesl one on clockwork. They shake on it seriously.',
  ),
  S(
    'tobiah',
    'yarrow',
    'exes',
    'Long Memory',
    { spd: 0.1, mag: 0.05 },
    'Tobiah tells Yarrow about the oak he planted. She is quiet for a long time, and then asks how tall it is.',
  ),
  S(
    'lio',
    'ash',
    'mentor',
    'Seven Winds Doctrine',
    { spd: 0.15 },
    'Lio and Ash meditate back to back. When they open their eyes, an hour has passed and both are smiling.',
  ),
  S(
    'juniper',
    'lio',
    'friends',
    'Open Palm, Closed Fist',
    { atk: 0.1, spd: 0.05 },
    'Juniper challenges Lio to a spar. He yields at once. She is furious, then delighted.',
  ),
  S(
    'sable',
    'thessaly',
    'rivals',
    'Broken Oath',
    { def: 0.1, mag: 0.05 },
    'Sable and Thessaly compare the orders that cast them out. They agree both orders were wrong.',
  ),
  S(
    'skarra',
    'ash',
    'siblings',
    'Clutch-Kin',
    { hp: 0.1, spd: 0.05 },
    'Skarra hands Ash a letter at last. It says one word: sorry. Ash keeps it in their robe.',
  ),
  S(
    'hollis',
    'rook',
    'friends',
    'Two Cautions',
    { spd: 0.1 },
    'Hollis teaches Rook to check exits. Rook teaches Hollis to cheat at cards.',
  ),
  S(
    'tamsin',
    'ambrose',
    'mentor',
    'Footnotes',
    { wit: 0.15 },
    'Ambrose reads Tamsin’s map and adds a footnote. She frames it, mentally, forever.',
  ),
  S(
    'vex',
    'corso',
    'rivals',
    'Same Mark',
    { spd: 0.1, atk: 0.05 },
    'Vex and Corso both try to lift the same purse. It belongs to Liesl. She bills them both.',
  ),
  S(
    'aurel',
    'idris',
    'friends',
    'Ink and Oath',
    { mag: 0.1 },
    'Aurel copies Idris’s oath into his journal. Idris asks him to fix the spelling. Aurel refuses.',
  ),
  S(
    'pelham',
    'corvin',
    'friends',
    'Squire Days',
    { def: 0.1, atk: 0.05 },
    'Pelham and Corvin trade stories of their worst days as squires. Pelham’s are worse, and funnier.',
  ),
  S(
    'benny',
    'torvald',
    'friends',
    'Ale Oath',
    { hp: 0.1 },
    'Benny and Torvald finish a cask between them and sing until the skeletons upstairs complain.',
  ),
  S(
    'oona',
    'benny',
    'friends',
    'Tavern Folk',
    { hp: 0.1, def: 0.05 },
    'Oona and Benny swap tavern stories. Hers end in fights; his end in songs. Both end in someone crying.',
  ),
]

export function pairKey(a: string, b: string): string {
  return [a, b].sort().join('+')
}

const SUPPORT_BY_KEY = new Map(SUPPORTS.map((s) => [pairKey(s.a, s.b), s]))

export function supportFor(a: string, b: string): Support | undefined {
  return SUPPORT_BY_KEY.get(pairKey(a, b))
}

export const SYNERGIES: Synergy[] = [
  {
    id: 'trinity',
    name: 'Holy Trinity',
    text: 'A tank, a healer and a striker: every stat rises.',
    value: 6,
    mult: { hp: 0.08, atk: 0.08, def: 0.08, mag: 0.08, spd: 0.08 },
    effects: [],
  },
  {
    id: 'arcane',
    name: 'Arcane Circle',
    text: 'Two or more casters: magic burns brighter.',
    value: 4,
    mult: { mag: 0.2 },
    effects: [],
  },
  {
    id: 'twilight',
    name: 'Light and Shadow',
    text: 'Holy and dark together: twilight options open in choice rooms.',
    value: 5,
    mult: { mag: 0.1 },
    effects: ['twilight'],
  },
  {
    id: 'scouts',
    name: 'Scouts',
    text: 'A Ranger and a Rogue: every door shows what is behind it.',
    value: 5,
    mult: { spd: 0.05 },
    effects: ['scoutAll'],
  },
  {
    id: 'hunters',
    name: 'Treasure Hunters',
    text: 'A Rogue with an Artificer or Alchemist: more gold, safer chests.',
    value: 4,
    mult: {},
    effects: ['gold', 'trapSense'],
  },
  {
    id: 'bookworms',
    name: 'Bookworms',
    text: 'A Scholar and a Mage: every puzzle comes with a hint.',
    value: 4,
    mult: { wit: 0.2 },
    effects: ['puzzleHint'],
  },
  {
    id: 'warband',
    name: 'War Band',
    text: 'Two or more Warriors or Monks: strikes land harder.',
    value: 4,
    mult: { atk: 0.15 },
    effects: [],
  },
  {
    id: 'bulwark',
    name: 'Bulwark',
    text: 'Two tanks: the line does not break.',
    value: 4,
    mult: { def: 0.25 },
    effects: [],
  },
  {
    id: 'green',
    name: 'Green Circle',
    text: 'A Druid and a Ranger: campfires heal everyone fully.',
    value: 4,
    mult: { hp: 0.05 },
    effects: ['fullRest'],
  },
  {
    id: 'encore',
    name: 'Encore',
    text: 'A Bard with company: anthems last longer and talks go deeper.',
    value: 3,
    mult: {},
    effects: ['longAnthem', 'warmth'],
  },
  {
    id: 'grave-glass',
    name: 'Grave and Glass',
    text: 'A Necromancer and an Alchemist: enemies start every fight poisoned.',
    value: 4,
    mult: {},
    effects: ['venom'],
  },
  {
    id: 'mixed',
    name: 'Mixed Company',
    text: 'Four different archetypes: a little better at everything.',
    value: 4,
    mult: { hp: 0.05, atk: 0.05, def: 0.05, mag: 0.05, wit: 0.05 },
    effects: ['scoutHalf'],
  },
  {
    id: 'duo',
    name: 'Two Against the Dark',
    text: 'Just you and one companion: both fight far above their weight.',
    value: 5,
    mult: { hp: 0.2, atk: 0.2, def: 0.15, mag: 0.2, spd: 0.1 },
    effects: [],
  },
]

export const VALUE_LABEL: Record<Value, string> = {
  kind: 'Kind',
  bold: 'Bold',
  greedy: 'Greedy',
  curious: 'Curious',
  pious: 'Pious',
  dark: 'Dark',
}
