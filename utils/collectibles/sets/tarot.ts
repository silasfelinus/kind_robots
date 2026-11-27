// /utils/collectibles/sets/tarot.ts
//
// The Kind Tarot collection: 100 collectible art cards and 12 unlockable card
// backs for /play/tarot. Rarity follows the deck's own weight: the 40 pips are
// common, the 16 court robots uncommon, the 22 major arcana rare, the 12
// zodiac guardians epic and the 10 planet spirits legendary. Art renders from
// the Conductor ledger projects/tarot-studio/art/COLLECTIBLES-1.yaml, whose
// subject keys are these item keys.

import type { CollectibleBack, CollectibleCard, CollectibleSet } from '../types'

const MAJORS: Array<[string, string, string]> = [
  [
    'The Newly Woken',
    'Beginnings and trust',
    'A small round robot blinking awake for the first time on a sunny cliff edge, a paper map in one hand and a curious white dog tugging its scarf',
  ],
  [
    'The Tinkerer',
    'Skill and making',
    'A many-armed tinkerer robot at a cluttered workbench raising a glowing screwdriver, a lantern, a wrench, a cup and a brass coin laid out before it',
  ],
  [
    'The Quiet Archivist',
    'Knowledge and patience',
    'A tall slender archivist robot seated between two stone pillars holding a closed blue book, a moonlit pool shimmering at its feet',
  ],
  [
    'The Gardener',
    'Nurture and growth',
    'A gentle mossy robot tending wildflowers and ripe wheat in a sunlit meadow, ladybugs resting on its watering-can arm',
  ],
  [
    'The Lighthouse Keeper',
    'Structure and guidance',
    'A sturdy lighthouse-keeper robot seated on a stone throne at the top of a lighthouse, its chest lamp sweeping a warm beam over stormy waves',
  ],
  [
    'The Storyteller',
    'Tradition and teaching',
    'An elder storyteller robot beside a crackling campfire of glowing circuits, two small robots listening wide-eyed on a woven rug',
  ],
  [
    'The Two Bots',
    'Choice and partnership',
    'Two friendly robots sharing one glowing power cell beneath a blossoming tree, their hands linked by a ribbon of light',
  ],
  [
    'The Wayfarer',
    'Will and momentum',
    'A determined robot steering a rolling cart across golden dunes, pulled by two mismatched mechanical beasts, one silver and one bronze',
  ],
  [
    'The Gentle Giant',
    'Strength as kindness',
    'An enormous mossy robot cradling a tiny songbird in its open palm in a wild garden, a sleepy lion curled against its leg',
  ],
  [
    'The Lantern Bearer',
    'Solitude and insight',
    'A lone hooded robot holding a bright lantern on a narrow snowy mountain path, soft fog rolling through the pines below',
  ],
  [
    'The Great Cog Wheel',
    'Cycles and change',
    'A gigantic turning wheel of interlocking brass gears floating among clouds, four small robots riding its rim through spring, summer, autumn and winter',
  ],
  [
    'The Fair Scale',
    'Fairness and truth',
    'A calm robot judge seated upright holding a balanced brass scale with a single white feather in one pan and a glowing heart in the other',
  ],
  [
    'The Upside-Down Bot',
    'Surrender and new views',
    'A smiling robot hanging upside down by one foot from a leafy rafter, a halo of tiny stars circling its head as the world looks new',
  ],
  [
    'The Shedding',
    'Endings and renewal',
    'A robot stepping out of old rusted plating beside a calm river at sunrise, bright new silver gleaming underneath and flowers sprouting from the discarded parts',
  ],
  [
    'The Mender',
    'Balance and repair',
    'A winged mender robot pouring glowing liquid between two cups, one foot in a stream and one on a mossy bank, golden thread stitching a cracked moon together',
  ],
  [
    'The Tangle',
    'Habits and attachment',
    'A worried robot snarled in its own colorful cables, two small friends patiently untangling the loops while a giant shadowy plug looms behind',
  ],
  [
    'The Short Circuit',
    'Upheaval and release',
    'A tall tower of stacked machinery bursting with blue lightning and sparks, little robots gliding safely away under umbrella parachutes',
  ],
  [
    'The Night-Sky Bot',
    'Hope and healing',
    'A robot kneeling by a quiet pond with its chest panel open to the night, pouring starlight onto the grass beneath seven bright stars',
  ],
  [
    'The Moon Pool',
    'Uncertainty and dreams',
    'A robot gazing into a moonlit pool where its reflection has a different, dreaming face, a dog and a wolf howling between two distant towers',
  ],
  [
    'The Sunrise Engine',
    'Joy and vitality',
    'A beaming robot riding a white mechanical horse through towering sunflowers, solar panels unfolded like wings in golden morning light',
  ],
  [
    'The Reboot',
    'Calling and reckoning',
    'Dozens of robots waking together in a misty valley, rising from their charging cradles toward a great brass trumpet sounding in the clouds',
  ],
  [
    'The Whole World',
    'Completion and belonging',
    'A dancing robot floating inside a wreath of leaves and gears above the earth, four guardian creatures watching from the corners of the sky',
  ],
]

const SUITS = [
  { id: 'sparks', title: 'Sparks' },
  { id: 'currents', title: 'Currents' },
  { id: 'breezes', title: 'Breezes' },
  { id: 'cogs', title: 'Cogs' },
] as const

type SuitId = (typeof SUITS)[number]['id']

const PIP_RANKS = [
  ['ace', 'Ace'],
  ['two', 'Two'],
  ['three', 'Three'],
  ['four', 'Four'],
  ['five', 'Five'],
  ['six', 'Six'],
  ['seven', 'Seven'],
  ['eight', 'Eight'],
  ['nine', 'Nine'],
  ['ten', 'Ten'],
] as const

const COURT_RANKS = [
  ['apprentice', 'Apprentice'],
  ['wanderer', 'Wanderer'],
  ['keeper', 'Keeper'],
  ['elder', 'Elder'],
] as const

const PIP_SCENES: Record<SuitId, string[]> = {
  sparks: [
    'A single glowing spark lamp cupped in two brass robot hands above a hillside workshop at dusk, embers swirling upward like fireflies into an orange sky',
    'A copper robot on a cliff-top balcony holding a glowing lamp in each hand, gazing across a burning sunset toward hills it has never visited',
    'Three robot builders on wooden scaffolding raising a tall lantern tower together, one hammering, one hoisting rope, one welding in a shower of golden sparks',
    'A cozy robot dozing in a hammock strung between four lamp posts hung with flower garlands, a picnic of oil cans and bread spread across the grass',
    'Five small robots playfully sparring with lamp-topped staffs in a dusty workshop yard, sparks bouncing everywhere while an old robot laughs from the doorway',
    'A triumphant robot riding a mechanical horse down a cheering village street, a wreath of tiny lights around its head and lantern banners waving overhead',
    'A brave robot standing on a rocky ledge fending off six lamp poles poking up from the scrub below, its own lamp held high like a torch',
    'Eight glowing lamps streaking through a clear evening sky like shooting stars toward a faraway workshop, trailing ribbons of orange light over green hills',
    'A weary bandaged robot leaning on one glowing lamp in front of a fence of eight more, watching the dark road ahead with tired determined eyes',
    'A small robot staggering uphill toward a glowing workshop door with ten heavy lamps bundled in its arms as the last golden light fades behind it',
  ],
  currents: [
    'A shining silver cup overflowing with sparkling water, held aloft by a robot hand rising from a lily pond, five streams spilling down into lotus flowers',
    'Two robots meeting on a little arched bridge over a stream, each offering the other a silver cup while a winged lion made of water rises between them',
    'Three cheerful robots dancing in a circle in a riverside orchard, raising silver cups high as petals and droplets swirl around their heads',
    'A pensive robot sitting under a willow with folded arms beside three cups on the grass, ignoring a fourth cup offered by a hand from a cloud',
    'A cloaked robot bowing its head over three spilled cups on a riverbank, two full cups still standing behind it near a bridge to a warm cottage',
    'A tall robot gently handing a silver cup brimming with white flowers to a tiny robot in a sunny old courtyard full of childhood memories',
    'A dreaming robot gazing up at seven silver cups floating in pastel clouds, each holding a different wonder: a castle, a jewel, a dragon and a wreath',
    'A robot with a walking stick quietly leaving eight stacked silver cups behind on a moonlit shore, heading toward misty mountains under a crescent moon',
    'A content round robot sitting on a bench with arms crossed and a satisfied smile, nine silver cups gleaming on a curved shelf behind it',
    'A robot family hugging in a green valley beside a river as a rainbow of ten shining silver cups arcs across the sky above their cottage',
  ],
  breezes: [
    'A robot hand bursting through clouds holding the string of a single feathered kite crowned with a small golden circlet against a brilliant blue sky',
    'A blindfolded robot sitting calmly on a stone bench by the sea, arms crossed over two kite strings, both kites balanced perfectly in the breeze above',
    'Three kites tangled in a stormy grey sky above a lone robot under an umbrella, rain streaming down as it patiently works the strings loose',
    'A robot resting flat on a stone ledge high above the clouds with eyes closed, three kites tethered quietly overhead and one laid across its chest',
    'A smug robot gathering five fallen kites on a windy hilltop while two other robots walk away toward the sea beneath racing clouds',
    'A robot ferryman poling a small boat across calm water toward a far shore, passengers huddled beside six kites fluttering from the mast',
    'A sneaky robot tiptoeing away from a tent camp with five kites tucked under its arms and a mischievous grin, two kites left flapping behind',
    'A robot standing in a meadow encircled by eight kite strings staked into the ground, the way out wide open if it would only look up',
    'A robot sitting up in bed at night with hands over its eyes, nine glowing kites hanging on the dark wall like quiet worries',
    'A robot lying face down on a misty shore with ten kites resting gently around it while a pale golden sunrise breaks over the calm water',
  ],
  cogs: [
    'A robot hand reaching out of a cloud holding one gleaming engraved brass cog above a blooming garden archway that opens onto distant mountains',
    'A playful robot juggling two brass cogs linked by a ribbon looped in a figure eight, sailing ships tossing on the waves of the bay behind it',
    'A robot stonemason carving three brass cogs into a cathedral archway while two robot architects study rolled blueprints together below',
    'A robot clutching one brass cog tightly to its chest, another balanced on its head and two under its feet, a busy town skyline behind it',
    'Two shivering robots trudging through falling snow past a glowing stained-glass window decorated with five brass cogs, the warm church door just ahead',
    'A kindly robot merchant weighing brass cogs on a hanging scale and sharing them with two grateful little robots kneeling at its feet',
    'A robot gardener leaning on a hoe, admiring a leafy vine heavy with seven ripe brass cogs and waiting patiently for the harvest',
    'A focused robot craftsperson at a workbench polishing brass cogs one by one, seven finished cogs hanging proudly on the wall beside it',
    'An elegant robot strolling through a vineyard of ripe grapes with nine brass cogs among the vines, a small mechanical falcon perched on its glove',
    'An old robot grandparent sitting in a stone archway with two dogs while robot children play, ten brass cogs worked into a family crest above them',
  ],
}

const COURT_SCENES: Record<SuitId, string[]> = {
  sparks: [
    'A young apprentice robot in a feathered cap standing in a desert, gazing with wonder at a lamp staff sprouting green leaves, little salamanders curling at its feet',
    'A dashing wanderer robot galloping on a rearing mechanical horse across orange dunes, a lamp staff raised high and a cape trailing behind like fire',
    'A confident keeper robot seated on a sunflower throne holding a lamp staff and a sunflower, a black mechanical cat sitting proudly at its feet',
    'A commanding elder robot on a throne carved with lions and salamanders, gripping a blossoming lamp staff with a cloak of embers over its shoulders',
  ],
  currents: [
    'A gentle apprentice robot by the seashore holding a silver cup, astonished as a tiny mechanical fish pops its head out of the water',
    'A romantic wanderer robot riding a calm white mechanical horse along a winding river, offering a silver cup forward like an invitation',
    'A dreamy keeper robot seated on a seashell throne at the water’s edge, gazing into an ornate covered cup decorated with little winged figures',
    'A serene elder robot on a stone throne floating on a rolling sea, holding a silver cup and scepter while a ship sails past and a fish leaps',
  ],
  breezes: [
    'An alert apprentice robot on a windswept hill gripping a kite string with both hands, birds scattering through fast moving clouds behind it',
    'A charging wanderer robot on a galloping mechanical horse racing into a strong headwind, kite raised like a banner as trees bend in the gale',
    'A clear-eyed keeper robot seated high among the clouds holding a kite upright, one hand extended as if inviting an honest conversation',
    'A stern but fair elder robot on a throne carved with butterflies, holding an upright kite, tall cypress trees and drifting clouds behind it',
  ],
  cogs: [
    'A studious apprentice robot in a flowering meadow holding one brass cog up to the light, examining every engraved tooth with total fascination',
    'A patient wanderer robot sitting still on a sturdy plow horse at the edge of a freshly tilled field, holding a brass cog with great care',
    'A nurturing keeper robot seated in a lush garden bower cradling a brass cog in its lap while a little mechanical rabbit hops nearby',
    'A prosperous elder robot on a throne wreathed in grapevines and carved bulls, a brass cog in one hand and a castle rising behind',
  ],
}

const ZODIAC: Array<[string, string, string]> = [
  [
    'aries',
    'Aries Guardian',
    'A bold ram-horned guardian robot charging up a red sandstone cliff at sunrise, sparks flying from its hooves as four bright stars blaze in a curve above',
  ],
  [
    'taurus',
    'Taurus Guardian',
    'A broad bull-shaped guardian robot with mossy shoulders standing knee-deep in a blooming spring meadow, the Pleiades glittering like a jeweled crown over its horns',
  ],
  [
    'gemini',
    'Gemini Guardians',
    'Twin mirror-image guardian robots dancing back to back on a rooftop, one silver and one gold, two bright stars shining exactly over their heads',
  ],
  [
    'cancer',
    'Cancer Guardian',
    'A crab-shelled guardian robot sheltering a dozen tiny robots under its pearly carapace on a moonlit beach, gentle waves washing over its claws',
  ],
  [
    'leo',
    'Leo Guardian',
    'A lion guardian robot with a mane of golden solar panels roaring a beam of warm light from the top of a sunlit mesa, a sickle of stars above',
  ],
  [
    'virgo',
    'Virgo Guardian',
    'A graceful guardian robot gathering golden wheat sheaves in a tidy harvest field, a single blue-white star resting in its open palm',
  ],
  [
    'libra',
    'Libra Guardian',
    'A serene guardian robot hovering above a glassy evening sea, holding perfectly balanced scales with a feather in one pan and a seashell in the other',
  ],
  [
    'scorpio',
    'Scorpio Guardian',
    'A sleek scorpion-tailed guardian robot of polished obsidian prowling a violet desert night, its curved tail tipped with a ruby red star',
  ],
  [
    'sagittarius',
    'Sagittarius Guardian',
    'A centaur guardian robot galloping across a starlit plain, drawing a bow of light toward the glowing heart of the Milky Way',
  ],
  [
    'capricorn',
    'Capricorn Guardian',
    'A sea-goat guardian robot climbing a snowy mountain peak, its lower half a shimmering chrome fish tail coiled around the rocks',
  ],
  [
    'aquarius',
    'Aquarius Guardian',
    'A kindly guardian robot pouring a river of glowing stars from a tilted urn, the starry water spilling down into a parched garden that bursts into bloom',
  ],
  [
    'pisces',
    'Pisces Guardians',
    'Two fish-shaped guardian robots circling each other in a luminous turquoise ocean, tethered by a silver ribbon of light that loops into a heart',
  ],
]

const PLANETS: Array<[string, string, string]> = [
  [
    'sun',
    'Spirit of the Sun',
    'a radiant golden robot spirit with a blazing crown of solar flares',
  ],
  [
    'moon',
    'Spirit of the Moon',
    'a silver robot spirit wrapped in moonlight and drifting crescent veils',
  ],
  [
    'mercury',
    'Spirit of Mercury',
    'a quick winged messenger robot spirit trailing ribbons of light',
  ],
  [
    'venus',
    'Spirit of Venus',
    'a rose-gold robot spirit surrounded by blooming roses and pearls',
  ],
  [
    'mars',
    'Spirit of Mars',
    'a crimson armored robot spirit holding a shield of red dust storms',
  ],
  [
    'jupiter',
    'Spirit of Jupiter',
    'a towering jovial robot spirit with swirling storm bands across its chest',
  ],
  [
    'saturn',
    'Spirit of Saturn',
    'an ancient robot spirit encircled by glittering rings and an hourglass',
  ],
  [
    'uranus',
    'Spirit of Uranus',
    'an electric cyan robot spirit tilted sideways, crackling with sudden insight',
  ],
  [
    'neptune',
    'Spirit of Neptune',
    'a dreamy ocean-blue robot spirit rising from misty waves with a trident',
  ],
  [
    'pluto',
    'Spirit of Pluto',
    'a deep violet robot spirit holding a glowing seed in the dark of space',
  ],
]

const rarityLight = {
  common: '',
  uncommon: 'Soft glowing light.',
  rare: 'Radiant iridescent light.',
  epic: 'Shimmering prismatic starlight all around.',
  legendary: 'Blazing gold and prismatic light, cosmic grandeur.',
} as const

const majorCards: CollectibleCard[] = MAJORS.map(
  ([title, subtitle, scene], index) => ({
    key: `major-${String(index).padStart(2, '0')}`,
    title,
    subtitle: `Major Arcana · ${subtitle}`,
    rarity: 'rare',
    group: 'major',
    artPrompt: `${scene}. ${rarityLight.rare}`,
  }),
)

const pipCards: CollectibleCard[] = SUITS.flatMap((suit) =>
  PIP_RANKS.map(([rank, label], index) => ({
    key: `${rank}-of-${suit.id}`,
    title: `${label} of ${suit.title}`,
    subtitle: `${suit.title} · minor arcana`,
    rarity: 'common' as const,
    group: suit.id,
    artPrompt: `${PIP_SCENES[suit.id][index]}.`,
  })),
)

const courtCards: CollectibleCard[] = SUITS.flatMap((suit) =>
  COURT_RANKS.map(([rank, label], index) => ({
    key: `${rank}-of-${suit.id}`,
    title: `${label} of ${suit.title}`,
    subtitle: `${suit.title} · court robot`,
    rarity: 'uncommon' as const,
    group: suit.id,
    artPrompt: `${COURT_SCENES[suit.id][index]}. ${rarityLight.uncommon}`,
  })),
)

const zodiacCards: CollectibleCard[] = ZODIAC.map(([id, title, scene]) => ({
  key: `zodiac-${id}`,
  title,
  subtitle: 'Zodiac guardian',
  rarity: 'epic',
  group: 'zodiac',
  artPrompt: `${scene}. ${rarityLight.epic}`,
}))

const planetCards: CollectibleCard[] = PLANETS.map(([id, title, scene]) => ({
  key: `planet-${id}`,
  title,
  subtitle: 'Planet spirit',
  rarity: 'legendary',
  group: 'planet',
  artPrompt: `${scene}, floating before its planet in deep space. ${rarityLight.legendary}`,
}))

const BACKS: CollectibleBack[] = [
  {
    key: 'back-starlit',
    title: 'Starlit Classic',
    hint: 'Yours from the start.',
    unlock: { kind: 'default' },
    artPrompt:
      'A golden eight-pointed star at the center of deep plum velvet, mirrored silver filigree curling outward to each corner, tiny stars scattered in perfect symmetry, vertical symmetrical composition.',
  },
  {
    key: 'back-moonbeam',
    title: 'Moonbeam Weave',
    hint: 'Claim daily rewards three days in a row.',
    unlock: { kind: 'streak', days: 3 },
    artPrompt:
      'Woven ribbons of silver moonbeam crossing over midnight blue in a lattice, a full moon at the heart and crescent moons mirrored top and bottom, vertical symmetrical composition.',
  },
  {
    key: 'back-sun-gear',
    title: 'Sun Gear',
    hint: 'Keep a seven-day streak.',
    unlock: { kind: 'streak', days: 7 },
    artPrompt:
      'A blazing brass sun assembled from interlocking gears radiating over warm amber, its rays ending in tiny cogwheels arranged in flawless rotational symmetry, vertical symmetrical composition.',
  },
  {
    key: 'back-comet-trail',
    title: 'Comet Trail',
    hint: 'Keep a fourteen-day streak.',
    unlock: { kind: 'streak', days: 14 },
    artPrompt:
      'Two turquoise comets spiraling around each other over deep indigo, their glowing tails sweeping into a mirrored double helix studded with stardust, vertical symmetrical composition.',
  },
  {
    key: 'back-eclipse-crown',
    title: 'Eclipse Crown',
    hint: 'Keep a thirty-day streak.',
    unlock: { kind: 'streak', days: 30 },
    artPrompt:
      'A total solar eclipse at the center of black velvet, a blazing golden corona flaring out like a crown with pearl beads ringing the edge, vertical symmetrical composition.',
  },
  {
    key: 'back-sparks',
    title: 'Hearth of Sparks',
    hint: 'Collect every Sparks card.',
    unlock: { kind: 'group', group: 'sparks' },
    artPrompt:
      'Glowing spark lamps and curling flame motifs in orange and gold arranged like a mirrored hearth mosaic over deep red, ember dots tracing the border, vertical symmetrical composition.',
  },
  {
    key: 'back-currents',
    title: 'Tide of Currents',
    hint: 'Collect every Currents card.',
    unlock: { kind: 'group', group: 'currents' },
    artPrompt:
      'Rolling ocean waves, silver goblets and lily pads in teal and pearl over deep sea blue, mirrored koi fish circling a central pearl, vertical symmetrical composition.',
  },
  {
    key: 'back-breezes',
    title: 'Sky of Breezes',
    hint: 'Collect every Breezes card.',
    unlock: { kind: 'group', group: 'breezes' },
    artPrompt:
      'Feathered kites and swirling wind ribbons in sky blue and silver over slate grey, four kites pointing to the corners from a central compass rose, vertical symmetrical composition.',
  },
  {
    key: 'back-cogs',
    title: 'Garden of Cogs',
    hint: 'Collect every Cogs card.',
    unlock: { kind: 'group', group: 'cogs' },
    artPrompt:
      'Brass cogs entwined with ivy and tiny white flowers in moss green and brass over dark forest green, a central clock face with leafy hands, vertical symmetrical composition.',
  },
  {
    key: 'back-arcana',
    title: 'Arcana Halo',
    hint: 'Collect all 22 major arcana.',
    unlock: { kind: 'group', group: 'major' },
    artPrompt:
      'Twenty-two small radiant halos circling a central open eye of light in violet and gold, mirrored keys and crowns tucked between the halos, vertical symmetrical composition.',
  },
  {
    key: 'back-zodiac-wheel',
    title: 'Zodiac Wheel',
    hint: 'Collect all twelve zodiac guardians.',
    unlock: { kind: 'group', group: 'zodiac' },
    artPrompt:
      'A great wheel of twelve constellations drawn in fine silver lines over starry navy, each sign glyph set in a small jewel around the rim, vertical symmetrical composition.',
  },
  {
    key: 'back-grand-orrery',
    title: 'Grand Orrery',
    hint: 'Complete the whole collection of 100 cards.',
    unlock: { kind: 'unique', count: 100 },
    artPrompt:
      'A magnificent golden orrery of ten orbiting planets and glittering rings over cosmic purple, prismatic light streaming from a radiant central sun, vertical symmetrical composition.',
  },
]

export const TAROT_COLLECTIBLE_SET: CollectibleSet = {
  slug: 'tarot',
  projectSlug: 'tarot-studio',
  title: 'Kind Tarot Collection',
  timeZone: 'America/Los_Angeles',
  ledgerPath: 'projects/tarot-studio/art/COLLECTIBLES-1.yaml',
  ledgerLane: 'krea2',
  artStyle:
    'luminous storybook illustration of friendly robots, iridescent foil highlights, rich jewel tones, soft cinematic glow, centered composition, crisp clean detail',
  cards: [
    ...pipCards,
    ...courtCards,
    ...majorCards,
    ...zodiacCards,
    ...planetCards,
  ],
  backs: BACKS,
  economy: {
    currencyName: 'Moonbeams',
    currencyGlyph: '☾',
    dailyBase: 100,
    dailyStreakStep: 15,
    dailyStreakCap: 7,
    ticketEvery: 7,
    packCost: 200,
    packSize: 5,
    rarityWeights: {
      common: 58,
      uncommon: 25,
      rare: 11.5,
      epic: 4,
      legendary: 1.5,
    },
    packFloor: 'uncommon',
    pityAt: 40,
    duplicateRefund: {
      common: 5,
      uncommon: 10,
      rare: 25,
      epic: 60,
      legendary: 150,
    },
    tasks: [
      { key: 'reading', label: 'Read a spread', reward: 20 },
      { key: 'chart', label: 'Visit your chart', reward: 15 },
      { key: 'chat', label: 'Say hello in the circle', reward: 15 },
    ],
    welcomeTickets: 1,
  },
}
