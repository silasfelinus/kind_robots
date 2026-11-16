import type { EndingId, EnemyDef, EventDef, ItemDef } from './types'

// The dungeon: three layers, each with its own monsters, boss, treasures and
// choice rooms. The bottom of the third layer holds the Deepheart itself.

export type Layer = {
  id: number
  name: string
  blurb: string
  moment: string
  enemies: string[]
  boss: string
  bossReveal: string
  bossMoment: string
}

export const LAYERS: Layer[] = [
  {
    id: 0,
    name: 'The Ossuary Gate',
    blurb:
      'Crypts stacked with the bones of every delver who came before, kept in order by something that still keeps watch.',
    moment: 'ossuary-gate',
    enemies: ['rats', 'skeleton', 'slime', 'cutthroat', 'shade'],
    boss: 'warden',
    bossReveal: 'warden-oath',
    bossMoment: 'warden-falls',
  },
  {
    id: 1,
    name: 'The Drowned Halls',
    blurb:
      'A sunken palace where the tide comes in from nowhere and the choir under the water never stops singing.',
    moment: 'drowned-halls',
    enemies: ['knight', 'lamprey', 'cultist', 'golem', 'wisp'],
    boss: 'brine',
    bossReveal: 'brine-lighthouse',
    bossMoment: 'brine-falls',
  },
  {
    id: 2,
    name: 'The Ember Deep',
    blurb:
      'The hot heart of the mountain, where an empty king sits on a throne of cooling stone and waits for whoever comes next.',
    moment: 'ember-deep',
    enemies: ['imp', 'obsidian', 'hound', 'pyre', 'hollow'],
    boss: 'king',
    bossReveal: 'king-name',
    bossMoment: 'empty-throne',
  },
]

export const DEPTHS_PER_LAYER = 7

export const ENEMIES: Record<string, EnemyDef> = {
  rats: {
    id: 'rats',
    name: 'Crypt Rat Swarm',
    hp: 18,
    atk: 6,
    def: 1,
    trait: null,
    look: 'a swarm of grey crypt rats',
  },
  skeleton: {
    id: 'skeleton',
    name: 'Skeleton Footman',
    hp: 26,
    atk: 8,
    def: 4,
    trait: null,
    look: 'a skeleton footman with a rusted spear',
  },
  slime: {
    id: 'slime',
    name: 'Grave Slime',
    hp: 30,
    atk: 6,
    def: 2,
    trait: 'poison',
    look: 'a green grave slime',
  },
  cutthroat: {
    id: 'cutthroat',
    name: 'Goblin Cutthroat',
    hp: 20,
    atk: 9,
    def: 2,
    trait: 'crit',
    look: 'a goblin cutthroat with two knives',
  },
  shade: {
    id: 'shade',
    name: 'Restless Shade',
    hp: 22,
    atk: 8,
    def: 0,
    trait: 'drain',
    look: 'a pale restless shade',
  },
  warden: {
    id: 'warden',
    name: 'The Bone Warden',
    hp: 150,
    atk: 12,
    def: 5,
    trait: 'aoe',
    look: 'a giant armoured skeleton with a tower shield',
  },
  knight: {
    id: 'knight',
    name: 'Drowned Knight',
    hp: 48,
    atk: 13,
    def: 7,
    trait: null,
    look: 'a barnacled drowned knight',
  },
  lamprey: {
    id: 'lamprey',
    name: 'Hall Lamprey',
    hp: 34,
    atk: 14,
    def: 3,
    trait: 'drain',
    look: 'a huge eel-like lamprey',
  },
  cultist: {
    id: 'cultist',
    name: 'Tide Cultist',
    hp: 36,
    atk: 12,
    def: 4,
    trait: 'aoe',
    look: 'a robed tide cultist',
  },
  golem: {
    id: 'golem',
    name: 'Coral Golem',
    hp: 60,
    atk: 11,
    def: 9,
    trait: null,
    look: 'a lumbering coral golem',
  },
  wisp: {
    id: 'wisp',
    name: 'Siren Wisp',
    hp: 30,
    atk: 12,
    def: 2,
    trait: 'weaken',
    look: 'a singing blue siren wisp',
  },
  brine: {
    id: 'brine',
    name: 'Mother Brine',
    hp: 270,
    atk: 17,
    def: 8,
    trait: 'aoe',
    look: 'a towering woman of seawater and kelp',
  },
  imp: {
    id: 'imp',
    name: 'Cinder Imp',
    hp: 44,
    atk: 15,
    def: 4,
    trait: 'poison',
    look: 'a cackling cinder imp',
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian Golem',
    hp: 90,
    atk: 15,
    def: 13,
    trait: null,
    look: 'a black glass golem',
  },
  hound: {
    id: 'hound',
    name: 'Ashen Hound',
    hp: 55,
    atk: 18,
    def: 5,
    trait: 'crit',
    look: 'a smouldering ash hound',
  },
  pyre: {
    id: 'pyre',
    name: 'Pyre Cultist',
    hp: 58,
    atk: 16,
    def: 6,
    trait: 'aoe',
    look: 'a pyre cultist in a burning mask',
  },
  hollow: {
    id: 'hollow',
    name: 'Hollow Knight',
    hp: 80,
    atk: 18,
    def: 10,
    trait: 'weaken',
    look: 'an empty suit of black armour',
  },
  king: {
    id: 'king',
    name: 'The Hollow King',
    hp: 400,
    atk: 22,
    def: 11,
    trait: 'aoe',
    look: 'a crowned king of empty armour on a stone throne',
  },
  mimic: {
    id: 'mimic',
    name: 'Mimic',
    hp: 40,
    atk: 14,
    def: 6,
    trait: 'crit',
    look: 'a toothy treasure-chest mimic',
  },
}

export const ITEMS: ItemDef[] = [
  {
    id: 'greatsword',
    name: 'Rusted Greatsword',
    layer: 0,
    bonus: { atk: 3 },
    text: '+3 attack',
  },
  {
    id: 'buckler',
    name: 'Bone Buckler',
    layer: 0,
    bonus: { def: 3 },
    text: '+3 defence',
  },
  {
    id: 'candle',
    name: 'Grave-Candle',
    layer: 0,
    bonus: { mag: 3 },
    text: '+3 magic',
  },
  {
    id: 'knucklebone',
    name: 'Lucky Knucklebone',
    layer: 0,
    bonus: { spd: 3 },
    text: '+3 speed',
  },
  {
    id: 'monocle',
    name: 'Cracked Monocle',
    layer: 0,
    bonus: { wit: 3 },
    text: '+3 wits',
  },
  {
    id: 'wardenmail',
    name: 'Warden’s Mail',
    layer: 0,
    bonus: { hp: 15 },
    text: '+15 health',
  },
  {
    id: 'drownedblade',
    name: 'Drowned Blade',
    layer: 1,
    bonus: { atk: 6 },
    text: '+6 attack',
  },
  {
    id: 'coralshield',
    name: 'Coral Shield',
    layer: 1,
    bonus: { def: 5, hp: 10 },
    text: '+5 defence, +10 health',
  },
  {
    id: 'pearlfocus',
    name: 'Pearl Focus',
    layer: 1,
    bonus: { mag: 6 },
    text: '+6 magic',
  },
  {
    id: 'eelboots',
    name: 'Eelskin Boots',
    layer: 1,
    bonus: { spd: 5, atk: 2 },
    text: '+5 speed, +2 attack',
  },
  {
    id: 'tidecharm',
    name: 'Tide-Charm',
    layer: 1,
    bonus: { hp: 22 },
    text: '+22 health',
  },
  {
    id: 'seaglass',
    name: 'Sea-Glass Lens',
    layer: 1,
    bonus: { wit: 5, mag: 3 },
    text: '+5 wits, +3 magic',
  },
  {
    id: 'emberbrand',
    name: 'Ember Brand',
    layer: 2,
    bonus: { atk: 9 },
    text: '+9 attack',
  },
  {
    id: 'obsidianplate',
    name: 'Obsidian Plate',
    layer: 2,
    bonus: { def: 8, hp: 15 },
    text: '+8 defence, +15 health',
  },
  {
    id: 'cinderheart',
    name: 'Heart of Cinder',
    layer: 2,
    bonus: { mag: 9 },
    text: '+9 magic',
  },
  {
    id: 'ashwraps',
    name: 'Ashwalker Wraps',
    layer: 2,
    bonus: { spd: 7, atk: 4 },
    text: '+7 speed, +4 attack',
  },
  {
    id: 'kingsring',
    name: 'Ring of the Old Court',
    layer: 2,
    bonus: { hp: 10, atk: 3, def: 3, mag: 3, spd: 3, wit: 3 },
    text: '+3 to everything, +10 health',
  },
  {
    id: 'spiritlantern',
    name: 'Spirit Lantern',
    layer: 0,
    bonus: { mag: 5, wit: 2 },
    text: '+5 magic, +2 wits',
  },
  {
    id: 'drownedcrown',
    name: 'The Drowned Crown',
    layer: 1,
    bonus: { atk: 5, mag: 5 },
    text: '+5 attack, +5 magic',
  },
  {
    id: 'lichring',
    name: 'Lich’s Signet',
    layer: 2,
    bonus: { mag: 10, hp: -10 },
    text: '+10 magic, -10 health',
  },
]

export function item(id: string): ItemDef {
  const found = ITEMS.find((i) => i.id === id)
  if (!found) throw new Error(`Unknown Deepheart item "${id}"`)
  return found
}

export const LOOT_TABLE: Record<number, string[]> = {
  0: [
    'greatsword',
    'buckler',
    'candle',
    'knucklebone',
    'monocle',
    'wardenmail',
  ],
  1: [
    'drownedblade',
    'coralshield',
    'pearlfocus',
    'eelboots',
    'tidecharm',
    'seaglass',
  ],
  2: ['emberbrand', 'obsidianplate', 'cinderheart', 'ashwraps', 'kingsring'],
}

export type Riddle = {
  id: string
  text: string
  answer: string
  wrong: string[]
}

export const RIDDLES: Riddle[] = [
  {
    id: 'shadow',
    text: 'I follow you all day and vanish at night. Torchlight makes me tall. What am I?',
    answer: 'A shadow',
    wrong: ['A ghost', 'A cat', 'An echo'],
  },
  {
    id: 'echo',
    text: 'I answer every question in these halls, and I only ever repeat it. What am I?',
    answer: 'An echo',
    wrong: ['A parrot', 'A mirror', 'A bard'],
  },
  {
    id: 'key',
    text: 'I have teeth and never bite. I turn and open, yet stay the same. What am I?',
    answer: 'A key',
    wrong: ['A comb', 'A saw', 'A crown'],
  },
  {
    id: 'candle',
    text: 'The longer I stand guard, the shorter I grow. What am I?',
    answer: 'A candle',
    wrong: ['A sentry', 'A shadow', 'A tree'],
  },
  {
    id: 'river',
    text: 'I have a mouth and never eat, a bed and never sleep. What am I?',
    answer: 'A river',
    wrong: ['A crypt', 'A cave', 'A well'],
  },
  {
    id: 'footsteps',
    text: 'The more you take, the more you leave behind. What are they?',
    answer: 'Footsteps',
    wrong: ['Coins', 'Breaths', 'Memories'],
  },
  {
    id: 'darkness',
    text: 'Fill a room with me and it holds more. Bring a candle and I flee. What am I?',
    answer: 'Darkness',
    wrong: ['Silence', 'Smoke', 'Water'],
  },
  {
    id: 'egg',
    text: 'A box with no hinges, key or lid, yet golden treasure inside is hid. What is it?',
    answer: 'An egg',
    wrong: ['A skull', 'A coin', 'A chest'],
  },
  {
    id: 'map',
    text: 'I hold cities with no houses, rivers with no water, and roads with no stones. What am I?',
    answer: 'A map',
    wrong: ['A dream', 'A painting', 'A song'],
  },
  {
    id: 'secret',
    text: 'Once you share me, I am gone. What am I?',
    answer: 'A secret',
    wrong: ['A gift', 'A meal', 'A coin'],
  },
  {
    id: 'age',
    text: 'I go up and never come down, no matter how deep you delve. What am I?',
    answer: 'Your age',
    wrong: ['Smoke', 'A ladder', 'A debt'],
  },
  {
    id: 'fire',
    text: 'Feed me and I grow; give me water and I die. What am I?',
    answer: 'Fire',
    wrong: ['A goblin', 'A plant', 'A slime'],
  },
]

export const EVENTS: EventDef[] = [
  {
    id: 'weeping-door',
    layer: 0,
    title: 'The Weeping Door',
    text: 'Behind a door of grey bone, something weeps. A voice asks to be let out, to go wherever the dead go.',
    moment: 'weeping-door',
    reveal: 'spirit-love',
    options: [
      {
        id: 'free',
        label: 'Open the door',
        hint: 'Let the spirit go free',
        tag: 'kind',
        effects: { flag: 'spirit', hurt: 0.08 },
        result:
          'Cold rushes past. The weeping becomes a sigh, then a thank-you. Something in the dungeon loosens.',
      },
      {
        id: 'sing',
        label: 'Sing it to rest',
        hint: 'Holy words, gently said',
        tag: 'pious',
        requires: { role: ['cleric', 'paladin'] },
        effects: { flag: 'spirit', heal: 0.3 },
        result:
          'The hymn carries the spirit away. Warmth comes back into your fingers.',
      },
      {
        id: 'bind',
        label: 'Bind its light into a lantern',
        hint: 'Power, at a price',
        tag: 'dark',
        effects: { item: 'spiritlantern' },
        result:
          'The weeping stops. The lantern glows a pale and grateful-looking blue. It is not grateful.',
      },
      {
        id: 'leave',
        label: 'Walk on',
        hint: 'Not your door to open',
        effects: {},
        result: 'You leave the door shut. The weeping follows you a long way.',
      },
    ],
  },
  {
    id: 'goblin-snare',
    layer: 0,
    title: 'Goblin in a Snare',
    text: 'A young goblin dangles by one ankle from a snare, swearing in three languages. He goes quiet when he sees you.',
    moment: 'goblin-snare',
    options: [
      {
        id: 'free',
        label: 'Cut him down',
        hint: 'He looks terrified',
        tag: 'kind',
        effects: { flag: 'goblinfriend', mercy: 1 },
        result:
          'Snag thanks you, then tells you where the next layer’s doors lead. Goblins pay their debts.',
      },
      {
        id: 'rob',
        label: 'Empty his pockets',
        hint: 'He has a heavy purse',
        tag: 'greedy',
        effects: { gold: 45 },
        result: 'His purse is heavy. His curses are heavier.',
      },
      {
        id: 'ask',
        label: 'Question him first',
        hint: 'What does he know?',
        tag: 'curious',
        effects: { reveal: true, flag: 'goblinfriend' },
        result:
          'He knows every door below. He tells you, then you cut him down.',
      },
    ],
  },
  {
    id: 'collection-plate',
    layer: 0,
    title: 'The Shrine of Coins',
    text: 'A small shrine glitters with offerings left by delvers praying to come home.',
    options: [
      {
        id: 'give',
        label: 'Leave an offering',
        hint: 'Costs 30 gold',
        tag: 'pious',
        requires: { gold: 30 },
        effects: { gold: -30, heal: 0.5, flag: 'blessed' },
        result: 'A warmth settles over the party like a blanket.',
      },
      {
        id: 'take',
        label: 'Take the coins',
        hint: 'Nobody is watching',
        tag: 'greedy',
        effects: { gold: 60, flag: 'cursed' },
        result: 'Sixty gold. The shrine’s candles all go out at once.',
      },
      {
        id: 'study',
        label: 'Read the inscriptions',
        hint: 'Names, hundreds of them',
        tag: 'curious',
        effects: { boon: { wit: 2 } },
        result:
          'The names of every delver who prayed here. You learn a few of their tricks.',
      },
    ],
  },
  {
    id: 'bone-dice',
    layer: 0,
    title: 'The Skeleton Gambler',
    text: 'A skeleton in a gambler’s waistcoat rattles a cup of bone dice. Double or nothing, it clacks.',
    options: [
      {
        id: 'bet',
        label: 'Bet 40 gold',
        hint: 'Even odds',
        tag: 'bold',
        requires: { gold: 40 },
        effects: {},
        gamble: {
          chance: 0.5,
          win: { gold: 40 },
          lose: { gold: -40 },
          winText: 'Sixes! The skeleton pays up and rattles with respect.',
          loseText: 'Snake eyes. The skeleton’s jaw clacks with laughter.',
        },
        result: '',
      },
      {
        id: 'cheat',
        label: 'Swap the dice',
        hint: 'A Rogue’s trick',
        tag: 'greedy',
        requires: { role: ['rogue'] },
        effects: { gold: 70 },
        result:
          'Loaded dice, swapped clean. The skeleton never knew it had a weakness.',
      },
      {
        id: 'decline',
        label: 'Decline politely',
        hint: 'Keep your gold',
        effects: {},
        result: 'The skeleton shrugs, which is loud.',
      },
    ],
  },
  {
    id: 'ossuary-library',
    layer: 0,
    title: 'The Ossuary Library',
    text: 'Shelves of books bound in something that is not leather. One lies open, whispering.',
    options: [
      {
        id: 'read',
        label: 'Read the whispering page',
        hint: 'Power, at a cost',
        tag: 'dark',
        effects: { boon: { mag: 3 }, hurt: 0.15 },
        result: 'The words crawl into your head and make themselves at home.',
      },
      {
        id: 'burn',
        label: 'Burn it',
        hint: 'Some books should end',
        tag: 'pious',
        effects: { heal: 0.2 },
        result: 'It screams as it burns. Afterwards the air is cleaner.',
      },
      {
        id: 'sell',
        label: 'Pack it to sell',
        hint: 'Collectors pay well',
        tag: 'greedy',
        effects: { gold: 50 },
        result: 'It whispers in your pack all the way down.',
      },
    ],
  },
  {
    id: 'drowned-crown',
    layer: 1,
    title: 'The Drowned Throne',
    text: 'On a throne under a foot of black water sits a crown of pearl and green bronze. It is waiting for a head.',
    moment: 'drowned-crown',
    options: [
      {
        id: 'wear',
        label: 'Wear the crown',
        hint: 'It fits too well',
        tag: 'bold',
        effects: { flag: 'crown', item: 'drownedcrown' },
        result:
          'It fits as though it was made for you. Somewhere far below, something notices.',
      },
      {
        id: 'smash',
        label: 'Smash it',
        hint: 'No more kings',
        tag: 'kind',
        effects: { mercy: 1, boon: { def: 2 } },
        result: 'Pearls scatter. The water warms by a degree.',
      },
      {
        id: 'leave',
        label: 'Leave it',
        hint: 'Not yours',
        tag: 'pious',
        effects: {},
        result: 'The crown waits. It is patient.',
      },
    ],
  },
  {
    id: 'lantern-seed',
    layer: 1,
    title: 'The Lantern Seed',
    text: 'In a drowned garden, one seed still glows, the colour of sunrise.',
    moment: 'lantern-seed',
    reveal: 'heart-alive',
    options: [
      {
        id: 'plant',
        label: 'Plant it',
        hint: 'Give it a chance',
        tag: 'kind',
        effects: { flag: 'seed' },
        result:
          'It takes root in the black mud at once. A thin line of light runs down into the dark.',
      },
      {
        id: 'eat',
        label: 'Eat it',
        hint: 'Bold, and probably fine',
        tag: 'bold',
        effects: { heal: 1, boon: { hp: 10 } },
        result: 'It tastes like morning. Everyone feels it.',
      },
      {
        id: 'pocket',
        label: 'Pocket it to sell',
        hint: 'Surely priceless',
        tag: 'greedy',
        effects: { gold: 80 },
        result: 'It glows through your pack like a guilty conscience.',
      },
    ],
  },
  {
    id: 'siren-bargain',
    layer: 1,
    title: 'The Siren’s Song',
    text: 'A siren offers to sing you a memory you lost. Her voice is very, very beautiful.',
    options: [
      {
        id: 'listen',
        label: 'Listen',
        hint: 'Curious what you forgot',
        tag: 'curious',
        effects: { affinityAll: 1, hurt: 0.1 },
        result:
          'You remember something small and lovely. The party watches you smile.',
      },
      {
        id: 'duet',
        label: 'Sing back',
        hint: 'A Bard’s answer',
        tag: 'bold',
        requires: { role: ['bard'] },
        effects: { affinityAll: 2, flag: 'duet' },
        result: 'The duet echoes through the halls. Even the siren applauds.',
      },
      {
        id: 'plug',
        label: 'Plug your ears',
        hint: 'Sensible',
        effects: {},
        result: 'You wade on in silence, very sensibly.',
      },
    ],
  },
  {
    id: 'tide-prisoner',
    layer: 1,
    title: 'Prisoner of the Tide',
    text: 'A cultist is chained to a pillar, the water at his chin and rising. He begs.',
    options: [
      {
        id: 'free',
        label: 'Unchain him',
        hint: 'Water is rising',
        tag: 'kind',
        effects: { mercy: 1, potion: 1 },
        result:
          'He presses a potion into your hands and flees upward, weeping.',
      },
      {
        id: 'question',
        label: 'Question him first',
        hint: 'He knows Mother Brine',
        tag: 'curious',
        effects: { flag: 'brinesecret', mercy: 1 },
        result: 'He tells you where Mother Brine is weak, then you free him.',
      },
      {
        id: 'leave',
        label: 'Leave him',
        hint: 'He chose his cult',
        tag: 'dark',
        effects: {},
        result: 'The water rises behind you. You do not look back.',
      },
    ],
  },
  {
    id: 'flooded-vault',
    layer: 1,
    title: 'The Flooded Vault',
    text: 'Gold glints at the bottom of a flooded vault. The water is deep and very cold.',
    options: [
      {
        id: 'dive',
        label: 'Dive for it',
        hint: 'Cold and deep',
        tag: 'bold',
        effects: { gold: 70, hurt: 0.12 },
        result: 'Freezing, gasping, and seventy gold richer.',
      },
      {
        id: 'drain',
        label: 'Rig a drain',
        hint: 'An Artificer’s or Scholar’s job',
        tag: 'curious',
        requires: { role: ['artificer', 'scholar'] },
        effects: { gold: 90 },
        result: 'Gears, a lever, a gurgle. You walk in dry.',
      },
      {
        id: 'pass',
        label: 'Pass it by',
        hint: 'Stay dry',
        effects: {},
        result: 'The gold glints sadly behind you.',
      },
    ],
  },
  {
    id: 'lich-offer',
    layer: 2,
    title: 'The Lich’s Offer',
    text: 'Vesper, the old court wizard, still sits at her desk, three hundred years dead. She offers power in exchange for a promise.',
    moment: 'lich-offer',
    reveal: 'lich-court',
    options: [
      {
        id: 'accept',
        label: 'Accept the pact',
        hint: 'Power now, a promise later',
        tag: 'dark',
        effects: { flag: 'lichpact', item: 'lichring' },
        result:
          'Her signet slides onto your finger. It is cold, and it will stay cold.',
      },
      {
        id: 'twilight',
        label: 'Bargain in twilight',
        hint: 'Holy and dark speak together',
        tag: 'curious',
        requires: { synergy: 'twilight' },
        effects: { flag: 'lichpact', boon: { mag: 3, def: 3 } },
        result:
          'Light and shadow argue her terms down. Vesper is impressed, which has not happened in a century.',
      },
      {
        id: 'refuse',
        label: 'Refuse',
        hint: 'No promises to the dead',
        tag: 'pious',
        effects: { heal: 0.2 },
        result: 'Vesper shrugs. She has time.',
      },
    ],
  },
  {
    id: 'keystone',
    layer: 2,
    title: 'The Keystone',
    text: 'One stone holds up an arch, which holds up a pillar, which holds up all three layers. It wobbles.',
    moment: 'keystone',
    reveal: 'keystone-truth',
    options: [
      {
        id: 'loosen',
        label: 'Loosen it',
        hint: 'Bring it all down, later',
        tag: 'bold',
        effects: { flag: 'collapse' },
        result:
          'The stone shifts a finger’s width. Far above, dust falls on a thousand bones.',
      },
      {
        id: 'brace',
        label: 'Brace it',
        hint: 'Somebody should',
        tag: 'kind',
        effects: { mercy: 1, boon: { def: 2 } },
        result: 'You wedge it firm. The dungeon creaks, almost gratefully.',
      },
      {
        id: 'leave',
        label: 'Leave it',
        hint: 'Not your problem',
        effects: {},
        result: 'It wobbles on behind you.',
      },
    ],
  },
  {
    id: 'ash-forge',
    layer: 2,
    title: 'The Forge of Ashes',
    text: 'An ancient forge still burns, hot enough to temper anything, and anyone.',
    options: [
      {
        id: 'temper',
        label: 'Temper your weapons',
        hint: 'Burns, but worth it',
        tag: 'bold',
        effects: { boon: { atk: 4 }, hurt: 0.15 },
        result: 'Steel and skin both come out harder.',
      },
      {
        id: 'offer',
        label: 'Offer gold to the forge god',
        hint: 'Costs 50 gold',
        tag: 'pious',
        requires: { gold: 50 },
        effects: { gold: -50, boon: { def: 4 } },
        result: 'The flames take your gold and give back a blessing of iron.',
      },
      {
        id: 'loot',
        label: 'Strip the forge',
        hint: 'Old tools sell well',
        tag: 'greedy',
        effects: { gold: 60 },
        result: 'Sixty gold of ancient tongs and hammers.',
      },
    ],
  },
  {
    id: 'mirror-hall',
    layer: 2,
    title: 'The Mirror Hall',
    text: 'A hall of mirrors shows each of you as you truly are.',
    options: [
      {
        id: 'gaze',
        label: 'Look closely',
        hint: 'Know yourself',
        tag: 'curious',
        effects: { boon: { wit: 3 } },
        result:
          'You see yourself, plainly. It is less frightening than you thought.',
      },
      {
        id: 'share',
        label: 'Look together',
        hint: 'See each other',
        tag: 'kind',
        effects: { affinityAll: 1 },
        result:
          'Everyone sees everyone. Nobody says anything. Nobody needs to.',
      },
      {
        id: 'shatter',
        label: 'Shatter them',
        hint: 'No more looking',
        tag: 'bold',
        effects: { boon: { atk: 2 }, hurt: 0.05 },
        result: 'Glass everywhere. It felt good.',
      },
    ],
  },
  {
    id: 'ember-orphans',
    layer: 2,
    title: 'Ember Orphans',
    text: 'Three small imps huddle around a dying coal. They are very young and very hungry.',
    options: [
      {
        id: 'feed',
        label: 'Share a potion with them',
        hint: 'Costs a potion',
        tag: 'kind',
        requires: { potion: 1 },
        effects: { potion: -1, mercy: 1 },
        result:
          'The coal flares bright. They chirp at you all the way to the next door.',
      },
      {
        id: 'scare',
        label: 'Shoo them off',
        hint: 'They might bite',
        tag: 'bold',
        effects: {},
        result: 'They scatter, chirping rudely.',
      },
      {
        id: 'take',
        label: 'Take their coal',
        hint: 'It is a gemstone',
        tag: 'greedy',
        effects: { gold: 55 },
        result: 'Fifty-five gold. They watch you go.',
      },
    ],
  },
]

export function event(id: string): EventDef {
  const found = EVENTS.find((e) => e.id === id)
  if (!found) throw new Error(`Unknown Deepheart event "${id}"`)
  return found
}

export type EndingText = {
  id: EndingId
  title: string
  text: string
  romance: string
}

export const ENDING_TEXT: Record<EndingId, EndingText> = {
  delver: {
    id: 'delver',
    title: 'The Delver’s Return',
    text: 'You carry the Deepheart up three layers into daylight. It beats in your pack all the way home. The bards will sing about this, and some of it will even be true.',
    romance:
      '{partner} walks out of the dark beside you, and keeps walking beside you after.',
  },
  usurper: {
    id: 'usurper',
    title: 'The Drowned Crown’s Heir',
    text: 'You set the Drowned Crown on your head and sit the empty throne. The dungeon kneels. Every monster in three layers now answers to you, and the dark is very comfortable.',
    romance:
      '{partner} stands at your right hand, the only one in the dungeon who may call you by your name.',
  },
  lichbound: {
    id: 'lichbound',
    title: 'Keeper of the Deep',
    text: 'You honour Vesper’s pact. The Deepheart beats inside your chest now, and it will beat for a very long time. Someone has to keep the deep. Now it is you.',
    romance:
      '{partner} chooses to stay, and Vesper, grumbling, teaches them the trick of a long life too.',
  },
  dawnbringer: {
    id: 'dawnbringer',
    title: 'Dawn in the Deep',
    text: 'The freed spirit leads the way, and the Lantern Seed’s roots carry the Deepheart’s light up through all three layers. For the first time in a thousand years, sunlight reaches the bottom of the dungeon. It was never evil. It was only dark.',
    romance:
      '{partner} plants a garden where the throne stood, and you tend it together.',
  },
  redemption: {
    id: 'redemption',
    title: 'The Hollow King Remembers',
    text: 'You hand the Hollow King his own heart back. The armour fills. A tired man named Aldric, the first delver of all, remembers his name and weeps, and walks up into the light with you.',
    romance:
      '{partner} holds your hand while Aldric tells you both what the sun used to feel like.',
  },
  sealed: {
    id: 'sealed',
    title: 'The Last Stone',
    text: 'You pull the loosened keystone and run. All three layers fold into the mountain behind you. Nobody will ever delve here again, and nobody will ever be hurt here again.',
    romance:
      '{partner} drags you the last few steps into daylight, laughing, covered in dust.',
  },
  gilded: {
    id: 'gilded',
    title: 'The Gilded Delve',
    text: 'You sell the Deepheart to the Undermerchant for an obscene sum, buy the tavern at the top of the stairs, and charge every future delver for a drink and a map. It is not heroic. It is extremely comfortable.',
    romance: '{partner} runs the bar. Business has never been better.',
  },
  hearthbound: {
    id: 'hearthbound',
    title: 'Hearthbound',
    text: 'You leave the Deepheart where it lies. You found something better on the way down. You climb back up to the light hand in hand, with nothing in your pack and everything you need.',
    romance:
      '{partner} was the treasure. Everyone saw it coming except the two of you.',
  },
  fallen: {
    id: 'fallen',
    title: 'Lanterns Out',
    text: 'The last lantern gutters out. The Bone Warden will set your bones in order with the others, carefully, kindly, and wait for the next delvers to come.',
    romance:
      '{partner} was beside you at the end, and that counted for something.',
  },
}

export const REVEAL_TEXT: Record<string, { title: string; text: string }> = {
  'warden-oath': {
    title: 'The Warden’s Oath',
    text: 'The Bone Warden was the bodyguard of the first delver. It swore to keep every delver who followed safe, and it keeps their bones safe still.',
  },
  'spirit-love': {
    title: 'Who Weeps Behind the Door',
    text: 'The weeping spirit is the Warden’s beloved, sealed away so the Warden would never leave its post.',
  },
  'brine-lighthouse': {
    title: 'The Lighthouse Keeper',
    text: 'Mother Brine was a lighthouse keeper whose light failed one night. She has been trying to call the drowned ships home ever since.',
  },
  'heart-alive': {
    title: 'The Heart Is Alive',
    text: 'The Deepheart is no jewel. It is the living heart of the mountain, and the dungeon is its body.',
  },
  'lich-court': {
    title: 'Vesper of the Old Court',
    text: 'Vesper the lich was court wizard to the Hollow King when he was a living man. She bound him to the Heart, and has regretted it for three hundred years.',
  },
  'keystone-truth': {
    title: 'What the Keystone Holds',
    text: 'A single keystone holds up all three layers. Whoever pulls it can bury the dungeon forever.',
  },
  'king-name': {
    title: 'The Hollow King’s Name',
    text: 'The Hollow King is Aldric, the first delver. He reached the Deepheart, took it, and it took him back.',
  },
  undermerchant: {
    title: 'The Undermerchant',
    text: 'Ottoline the Undermerchant buys anything from the deep, at any price, and has been waiting a long time for someone to bring her the Heart.',
  },
}
