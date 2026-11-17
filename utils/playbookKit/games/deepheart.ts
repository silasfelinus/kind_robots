import { DH_PALETTE, portraitArt, romanceArt } from '../../deepheart/art'
import { ENDING_TEXT, REVEAL_TEXT } from '../../deepheart/dungeon'
import { romanceMoment } from '../../deepheart/engine'
import { CHARACTERS, ROLES, shortName } from '../../deepheart/roster'
import type {
  KitCastMember,
  KitEnding,
  KitMoment,
  PlaybookKitSpec,
} from '../types'

// Deepheart: a three-layer party dungeon crawl with fifty preset delvers.
// The roster, rooms and rules live in utils/deepheart/; this spec is what the
// Playbook Kit reads to draw the shell, scrapbook, cast, secrets and endings.

const P = DH_PALETTE

const followers: KitCastMember[] = CHARACTERS.map((c) => ({
  id: c.id,
  name: c.name,
  role: 'follower',
  tagline: `${ROLES[c.role].label}. ${c.blurb}`,
  portrait: portraitArt(c),
  ...(c.romanceable
    ? { romance: { arc: c.arc, moments: [romanceMoment(c.id)] } }
    : {}),
}))

const others: KitCastMember[] = [
  {
    id: 'hollow-king',
    name: 'The Hollow King',
    role: 'villain',
    primary: true,
    faction: 'ember-throne',
    tagline:
      'An empty crown on a throne of cooling stone. He wants the next delver to take his place, and he is not wrong that someone must.',
    portrait: {
      brief:
        'Villain portrait: a crowned suit of empty black armour on a throne of cooling volcanic stone, embers drifting',
      prompt: `A tall suit of black plate armour with an iron crown sits on a throne of cracked volcanic stone, its visor open onto darkness, embers drifting around it and a red glow pulsing from the floor below. Low camera looking up at the throne. ${P}`,
    },
  },
  {
    id: 'bone-warden',
    name: 'The Bone Warden',
    role: 'villain',
    faction: 'bone-court',
    tagline:
      'A giant skeleton who keeps every fallen delver’s bones in perfect order. It means it kindly.',
    portrait: {
      brief:
        'Villain portrait: a giant armoured skeleton with a tower shield in a crypt of stacked skulls',
      prompt: `A giant skeleton in rusted plate armour stands guard with a huge tower shield in a crypt where skulls are stacked neatly in wall niches, candles burning in rows at its feet. Low camera looking up. ${P}`,
    },
  },
  {
    id: 'mother-brine',
    name: 'Mother Brine',
    role: 'villain',
    faction: 'brine-choir',
    tagline:
      'A towering woman of seawater and kelp who sings drowned ships home. Nobody has told her the ships are gone.',
    portrait: {
      brief:
        'Villain portrait: a towering woman made of seawater and kelp singing in a flooded marble hall',
      prompt: `A towering woman made of green seawater with long hair of kelp rises waist-deep from a flooded marble hall, mouth open in song, ripples spreading around her and drowned lanterns glowing under the water. Medium shot at water level. ${P}`,
    },
  },
  {
    id: 'vesper',
    name: 'Vesper the Lich',
    role: 'villain',
    faction: 'ember-throne',
    tagline:
      'The old court wizard, three hundred years dead and still at her desk. She offers power for a promise.',
    portrait: {
      brief:
        'Villain portrait: a skeletal court wizard at a candlelit desk piled with books',
      prompt: `A skeletal woman in faded purple court robes and a tarnished silver circlet sits at a heavy desk piled with old books and guttering candles, one bony hand holding out a signet ring. Medium shot across the desk. ${P}`,
    },
  },
  {
    id: 'ottoline',
    name: 'Ottoline the Undermerchant',
    role: 'figure',
    tagline:
      'She buys anything from the deep, at any price, and always seems to be at the next fire over.',
    portrait: {
      brief: 'Portrait of a cheerful dungeon merchant with a pack of curios',
      prompt: `A plump grey-haired woman in a patched velvet coat grins beside a campfire, an enormous pack of hanging lanterns, potions and trinkets on her back, gold rings on every finger. Waist-up portrait at eye level. ${P}`,
    },
  },
  {
    id: 'snag',
    name: 'Snag',
    role: 'figure',
    tagline:
      'A young goblin who got caught in his own snare and pays his debts in directions.',
    portrait: {
      brief: 'Portrait of a young goblin hanging upside down from a snare',
      prompt: `A skinny young green goblin with big ears hangs upside down by one ankle from a rope snare in a crypt corridor, arms crossed, scowling, coins falling from his pockets. Medium shot at eye level. ${P}`,
    },
  },
  {
    id: 'maren',
    name: 'Maren of the Weeping Door',
    role: 'figure',
    tagline:
      'A spirit sealed behind a door of bone, who only wants to go where the dead go.',
    portrait: {
      brief: 'Portrait of a pale weeping spirit behind a door of bone',
      prompt: `A pale translucent young woman with long drifting hair presses her hands against the inside of a door made of fitted grey bones, tears of light on her cheeks, cold blue glow around her. Close medium shot. ${P}`,
    },
  },
]

const m = (
  id: string,
  title: string,
  caption: string,
  kind: KitMoment['kind'],
  act: number,
  about: string[],
  prompt: string,
): KitMoment => ({
  id,
  title,
  caption,
  kind,
  act,
  about,
  art: { brief: `${title}: ${caption}`, prompt: `${prompt} ${P}` },
})

const sceneMoments: KitMoment[] = [
  m(
    'ossuary-gate',
    'The Ossuary Gate',
    'The stairs go down. The first layer is made of everyone who came before.',
    'faction',
    1,
    ['bone-court'],
    'A spiral stone stairway opens into a vast crypt where walls of neatly stacked skulls rise into the dark, a small party of adventurers with lanterns pausing on the bottom step. Wide shot from behind the party.',
  ),
  m(
    'drowned-halls',
    'The Drowned Halls',
    'The tide comes in from nowhere, and the choir under the water never stops.',
    'faction',
    2,
    ['brine-choir'],
    'A sunken marble palace hall flooded waist-deep with green water, drowned chandeliers glowing under the surface, a party of adventurers wading in with packs held over their heads. Wide shot at water level.',
  ),
  m(
    'ember-deep',
    'The Ember Deep',
    'The hot heart of the mountain. Something waits on a throne.',
    'faction',
    3,
    ['ember-throne'],
    'A cavern of black volcanic rock lit by rivers of glowing magma, a narrow stone bridge leading toward a distant throne, a small party of adventurers crossing with cloaks pulled over their faces. Wide shot from a ledge above.',
  ),
  m(
    'first-fight',
    'First Blood',
    'Skeletons, rats and a goblin with two knives. Welcome to the deep.',
    'scene',
    1,
    ['bone-court'],
    'A party of adventurers fighting off a skeleton footman and a swarm of grey rats in a narrow crypt corridor, a goblin with two knives leaping from a wall niche. Dynamic medium shot at floor level.',
  ),
  m(
    'puzzle-solved',
    'The Seal Breaks',
    'Runes, riddles, scales or sequences: wits open doors that swords cannot.',
    'scene',
    1,
    [],
    'A carved stone door covered in glowing runes swinging open as a young adventurer lowers her hand from the last rune, golden light spilling through the gap onto her companions. Medium shot from inside the doorway.',
  ),
  m(
    'mimic',
    'It Had Teeth',
    'The chest opened its own lid, and it was hungry.',
    'scene',
    1,
    [],
    'A wooden treasure chest with a long purple tongue and rows of jagged teeth lunging at a startled hooded rogue, gold coins flying across a dungeon floor. Dynamic close medium shot.',
  ),
  m(
    'campfire',
    'A Fire in the Deep',
    'Wounds close, stories open. The party talks until the fire burns low.',
    'scene',
    1,
    [],
    'Four mismatched adventurers sit around a small campfire in a vaulted alcove, sharing a cooking pot, one telling a tale with wide gestures while the others laugh. Medium shot at seated height.',
  ),
  m(
    'treasure-hoard',
    'Heavy Pockets',
    'Three hundred gold and still going down.',
    'scene',
    2,
    ['ottoline'],
    'An adventurer staggering under a bulging sack of gold coins in a torchlit vault while a plump merchant woman in a patched velvet coat rubs her ringed hands at the doorway. Medium shot.',
  ),
  m(
    'weeping-door',
    'The Weeping Door',
    'Behind a door of bone, a spirit asks to be let out.',
    'scene',
    1,
    ['maren', 'bone-warden'],
    'A door built of fitted grey bones glows pale blue from behind, a translucent woman’s hands pressed against it from the inside, an adventurer reaching for the latch. Medium shot.',
  ),
  m(
    'goblin-snare',
    'Goblin in a Snare',
    'Snag swears in three languages, then goes very quiet.',
    'scene',
    1,
    ['snag'],
    'A skinny young goblin hangs upside down by one ankle from a rope snare in a crypt, coins dropping from his pockets, as an adventurer with a knife steps closer. Medium shot.',
  ),
  m(
    'drowned-crown',
    'The Drowned Throne',
    'A crown of pearl and bronze waits for a head.',
    'scene',
    2,
    ['brine-choir', 'hollow-king'],
    'A crown of pearls and green bronze resting on a throne under a foot of black water in a drowned hall, an adventurer’s hand reaching down toward it through the ripples. Close shot at water level.',
  ),
  m(
    'lantern-seed',
    'The Lantern Seed',
    'One seed in a drowned garden still glows like sunrise.',
    'scene',
    2,
    ['brine-choir'],
    'A single seed glowing warm orange rests in the black mud of a drowned garden among dead grey stalks, an adventurer kneeling to cup it in both hands. Close shot at ground level.',
  ),
  m(
    'lich-offer',
    'The Lich’s Offer',
    'Vesper is still at her desk, three hundred years dead.',
    'villain',
    3,
    ['vesper'],
    'A skeletal woman in faded purple court robes leans across a candlelit desk piled with books, offering a silver signet ring to a hesitant adventurer standing before her. Medium shot across the desk.',
  ),
  m(
    'keystone',
    'The Keystone',
    'One stone holds up three layers. It wobbles.',
    'scene',
    3,
    [],
    'A single cracked keystone at the top of a huge stone arch inside a dark cavern, dust trickling from it, an adventurer standing on a ladder with both hands on the stone. Low camera looking up.',
  ),
  m(
    'full-party',
    'Four at the Stair',
    'Three companions and a hero, lanterns raised.',
    'scene',
    1,
    [],
    'Four adventurers of different ancestries stand together at the top of a dungeon stairway holding lanterns high, a dwarf with a shield, an elf archer, a robed wizard and a hooded leader. Wide shot from below the steps.',
  ),
  m(
    'duo',
    'Two Against the Dark',
    'Just the two of you, and one lantern.',
    'scene',
    1,
    [],
    'Two adventurers stand back to back in a dark stone corridor with weapons raised, a single lantern on the floor between their boots. Medium shot at eye level.',
  ),
]

const villainMoments: KitMoment[] = [
  m(
    'warden-falls',
    'The Warden Rests',
    'The Bone Warden lowers its shield at last.',
    'villain',
    1,
    ['bone-warden', 'bone-court'],
    'A giant armoured skeleton kneels in a candlelit crypt with its tower shield laid flat on the flagstones, adventurers lowering their weapons around it. Wide shot at eye level.',
  ),
  m(
    'brine-falls',
    'The Tide Goes Out',
    'Mother Brine’s song ends, and the halls drain.',
    'villain',
    2,
    ['mother-brine', 'brine-choir'],
    'A towering woman of seawater and kelp collapses into a great wave across a flooded marble hall while adventurers brace knee-deep in the surge. Wide shot at water level.',
  ),
  m(
    'empty-throne',
    'The Empty Throne',
    'The Hollow King rises. The Deepheart beats behind him.',
    'villain',
    3,
    ['hollow-king', 'ember-throne'],
    'A crowned suit of empty black armour rises from a throne of cooling volcanic stone, a huge glowing red crystal heart pulsing behind it, adventurers facing it on a narrow bridge. Wide shot from behind the party.',
  ),
]

const pair = (a: string, b: string) => [a, b]

const followerMoments: KitMoment[] = [
  m(
    'halloran-twins',
    'Halloran Twins',
    'Rook tells Wren about the farm. She already knew.',
    'follower',
    1,
    pair('rook', 'wren'),
    'Two auburn-haired half-elf twins in green cloaks sit side by side at a campfire, the young man looking down guiltily and the young woman resting her head on his shoulder. Medium shot.',
  ),
  m(
    'old-flame',
    'Old Flame',
    'Corso finds his old lockpick in Idris’s boot.',
    'follower',
    1,
    pair('idris', 'corso'),
    'A man in a burgundy doublet holds a small lockpick up to the firelight beside a sleeping half-elf knight in silver armour, a boot in his other hand. Medium shot.',
  ),
  m(
    'forty-years',
    'Forty Years Married',
    'Quillon and Ambrose have the same argument they had the day they met.',
    'follower',
    1,
    pair('quillon', 'ambrose'),
    'An elderly gnome wizard in a starry hat and an elderly man in tweed and half-moon spectacles point at the same carved rune on a wall, both laughing. Medium shot.',
  ),
  m(
    'sworn-kin',
    'Sworn Kin',
    'Grell is already awake when Pip wakes from the nightmare.',
    'follower',
    1,
    pair('grell', 'pip'),
    'A massive grey-green orc in iron plate hands a steaming cup to a tiny blonde halfling wrapped in a blanket beside a low campfire at night. Medium shot.',
  ),
  m(
    'stoneharrow',
    'Stoneharrow Brothers',
    'Brannoc adds a ring to his brother’s beard.',
    'follower',
    1,
    pair('brannoc', 'torvald'),
    'Two dwarf brothers sit by a fire, the elder with a braided chestnut beard threading a small iron ring into the younger brother’s huge black beard full of gold rings. Close medium shot.',
  ),
  m(
    'ironsong-fell',
    'Ironsong and Fell',
    'Ragna sings. Dagny hums the old harmony.',
    'follower',
    1,
    pair('ragna', 'dagny'),
    'A red-braided human woman with blue woad stripes singing by a fire while a calm orc swordswoman beside her hums with closed eyes, the two of them very close. Medium shot.',
  ),
  m(
    'moth-court',
    'The Moth Court',
    'Hesper’s patron settles on Gloam’s antennae.',
    'follower',
    1,
    pair('gloam', 'hesper'),
    'A huge pale moth settles on the feathery antennae of a mothkin with dusty patterned wings, who sits very still and delighted while a thin woman in a feathered shawl watches. Medium shot.',
  ),
  m(
    'old-rite',
    'The Old Rite',
    'Mother Hesk mouths the words along with Idris.',
    'follower',
    1,
    pair('idris', 'hesk'),
    'An elderly dwarf priestess with a white braided beard leans on her staff beside a kneeling half-elf knight reciting a prayer, her lips moving with his. Medium shot.',
  ),
  m(
    'hedge-kin',
    'Hedge-Kin',
    'Moss and Badger argue about mushrooms until they cry laughing.',
    'follower',
    1,
    pair('moss', 'badger'),
    'A faun with mossy green hair and an old hermit in a badger-pelt cloak hold up two different mushrooms at each other by a campfire, both laughing hard. Medium shot.',
  ),
  m(
    'seven-winds',
    'Seven Winds Doctrine',
    'Lio and Ash meditate back to back for an hour.',
    'follower',
    1,
    pair('lio', 'ash'),
    'A bald monk in saffron robes and a teal-scaled lizardfolk monk sit cross-legged back to back on a stone floor, eyes closed, a single candle burning before each. Medium shot.',
  ),
  m(
    'gearheads',
    'Gearheads',
    'Nettle and Gizelle build a trap and argue whether to trigger it.',
    'follower',
    1,
    pair('gizelle', 'nettle'),
    'A green goblin in brass goggles and a gnome with a clockwork arm crouch over a contraption of springs and gears on a dungeon floor, both reaching for the same lever. Medium shot.',
  ),
  m(
    'graveside',
    'Graveside Lessons',
    'Crell teaches Mortimer the crow-call on the ninth try.',
    'follower',
    1,
    pair('mortimer', 'crell'),
    'A bent old witch with crows on her shoulders cups her hands to her mouth while a gaunt man in spectacles copies her, a flock of crows landing on the crypt wall behind them. Medium shot.',
  ),
]

const romanceMoments: KitMoment[] = CHARACTERS.filter(
  (c) => c.romanceable && c.id !== 'thessaly',
).map((c) =>
  c.id === 'brannoc'
    ? {
        id: 'romance-hearth',
        title: 'Room in the House',
        caption:
          'Brannoc and Thessaly make room for one more on the log by the fire.',
        kind: 'romance' as const,
        act: 2,
        about: ['brannoc', 'thessaly'],
        art: romanceArt(c),
      }
    : {
        id: romanceMoment(c.id),
        title: `${shortName(c)} by the Fire`,
        caption: c.heart,
        kind: 'romance' as const,
        act: 2,
        about: [c.id],
        art: romanceArt(c),
      },
)

const ENDING_ART: Record<string, string> = {
  delver:
    'An adventuring party climbing out of a dungeon doorway into golden morning light, the leader holding up a glowing red crystal heart, dust on their armour. Wide shot from outside the doorway.',
  usurper:
    'A cloaked figure wearing a crown of pearl and green bronze sits on a throne of cooling volcanic stone while monsters of bone, coral and ember kneel in rows before it. Low camera looking up the dais.',
  lichbound:
    'A figure in dark robes with a glowing red light inside their chest stands at a candlelit desk beside a skeletal court wizard, the two of them studying a huge map of the dungeon. Medium shot.',
  dawnbringer:
    'Shafts of golden sunlight pour down through three layers of a vast underground cavern onto a glowing red crystal heart, glowing roots climbing the walls and a pale spirit rising in the light. Wide shot from the cavern floor.',
  redemption:
    'A tired grey-bearded man in ancient black armour weeps with relief as a kneeling adventurer places a glowing red crystal heart into his hands, embers drifting around them. Medium shot.',
  sealed:
    'A party of adventurers running out of a mountain cave mouth into daylight as the cave collapses behind them in a huge cloud of dust and falling stone. Wide shot from the hillside.',
  gilded:
    'A cosy tavern at the top of a dungeon stairway, an adventurer behind the bar pouring ale for a queue of new delvers, a glowing red crystal on a shelf behind a price tag. Wide interior shot.',
  hearthbound:
    'Two adventurers climbing the last stone steps of a dungeon stairway hand in hand into warm sunrise light, packs empty, leaning into each other. Wide shot from the top of the stairs.',
  fallen:
    'A row of guttered lanterns on a crypt floor beside neatly arranged helmets and swords, a giant armoured skeleton tenderly setting a final helmet in place. Medium shot at floor level.',
}

const ENDING_META: Record<
  string,
  { tone: KitEnding['tone']; hint: string; about: string[] }
> = {
  delver: {
    tone: 'hopeful',
    hint: 'Take what you came for.',
    about: ['hollow-king'],
  },
  usurper: {
    tone: 'dark',
    hint: 'A crown in the second layer fits a little too well.',
    about: ['hollow-king', 'mother-brine', 'brine-choir'],
  },
  lichbound: {
    tone: 'dark',
    hint: 'Make a promise to the dead.',
    about: ['vesper', 'ember-throne'],
  },
  dawnbringer: {
    tone: 'secret',
    hint: 'Free what weeps, plant what glows.',
    about: ['maren', 'hollow-king'],
  },
  redemption: {
    tone: 'bittersweet',
    hint: 'Show mercy, again and again.',
    about: ['hollow-king', 'snag'],
  },
  sealed: {
    tone: 'bittersweet',
    hint: 'Some stones should not be braced.',
    about: ['ember-throne'],
  },
  gilded: {
    tone: 'comic',
    hint: 'Fill your pockets all the way down.',
    about: ['ottoline'],
  },
  hearthbound: {
    tone: 'hopeful',
    hint: 'You might find something better than treasure.',
    about: [],
  },
  fallen: {
    tone: 'dark',
    hint: 'Every delve ends somewhere.',
    about: ['bone-warden', 'bone-court'],
  },
}

const endings: KitEnding[] = Object.values(ENDING_TEXT).map((e) => ({
  id: e.id,
  title: e.title,
  tone: ENDING_META[e.id]!.tone,
  summary: e.text,
  hint: ENDING_META[e.id]!.hint,
  about: ENDING_META[e.id]!.about,
  art: {
    brief: `Ending plate: ${e.title}`,
    prompt: `${ENDING_ART[e.id]} ${P}`,
  },
}))

const REVEAL_META: Record<
  string,
  { teaser: string; act: number; about: string[] }
> = {
  'warden-oath': {
    teaser: 'Why does the Warden keep the bones so neatly?',
    act: 1,
    about: ['bone-warden', 'bone-court'],
  },
  'spirit-love': {
    teaser: 'Who is sealed behind the door of bone?',
    act: 1,
    about: ['maren', 'bone-warden'],
  },
  'brine-lighthouse': {
    teaser: 'Who was Mother Brine before the water?',
    act: 2,
    about: ['mother-brine', 'brine-choir'],
  },
  'heart-alive': {
    teaser: 'What is the Deepheart, really?',
    act: 2,
    about: ['hollow-king'],
  },
  'lich-court': {
    teaser: 'Whom did Vesper serve in life?',
    act: 3,
    about: ['vesper', 'hollow-king'],
  },
  'keystone-truth': {
    teaser: 'What is the wobbling stone holding up?',
    act: 3,
    about: ['ember-throne'],
  },
  'king-name': {
    teaser: 'Who wore the crown before it was empty?',
    act: 3,
    about: ['hollow-king'],
  },
  undermerchant: {
    teaser: 'Why is the merchant always at the next fire?',
    act: 3,
    about: ['ottoline'],
  },
}

export const DEEPHEART: PlaybookKitSpec = {
  id: 'deepheart',
  conductorSlug: 'deepheart',
  title: 'Deepheart',
  tagline: 'Three layers down. Bring someone you would follow anywhere.',
  premise:
    'Can a delver and the companions they choose reach the living heart at the bottom of a three-layer dungeon, and what will they decide to do with it, and with each other, when they get there?',
  tier: 'saga',
  route: '/admin/deepheart',
  theme: 'deepheart',
  artPromptsComplete: true,
  keyArt: {
    brief:
      'Key art: a torchlit spiral stair down into a three-tiered dungeon, a small party with lanterns on the top landing, a glowing red heart-shaped crystal far below',
    prompt: `A small party of four adventurers with lanterns stands on the top landing of a huge spiral stone stairway that winds down through three cavern layers, crypts of stacked bones, a flooded marble hall and a cavern of glowing magma, with a glowing red heart-shaped crystal far below at the bottom. Wide shot from above the party. ${P}`,
    alt: 'A party with lanterns at the top of a stair spiralling down to a glowing red heart',
  },
  acts: [
    {
      id: 1,
      title: 'The Ossuary Gate',
      blurb:
        'Crypts of every delver who came before, kept in order by the Bone Warden.',
    },
    {
      id: 2,
      title: 'The Drowned Halls',
      blurb:
        'A sunken palace where Mother Brine’s choir sings under the water.',
    },
    {
      id: 3,
      title: 'The Ember Deep',
      blurb:
        'The hot heart of the mountain, the Hollow King and the Deepheart itself.',
    },
  ],
  meters: [
    { id: 'depth', label: 'Depth', min: 0, max: 21, start: 0 },
    { id: 'health', label: 'Party health', min: 0, max: 100, start: 100 },
    { id: 'gold', label: 'Gold', min: 0, max: 999, start: 20 },
    { id: 'potions', label: 'Potions', min: 0, max: 9, start: 2 },
  ],
  factions: [
    {
      id: 'bone-court',
      name: 'The Bone Court',
      tagline: 'Every delver who fell, kept tidy forever.',
      tone: 'neutral',
      emblem: {
        brief: 'Emblem: a skull inside a ring of candles, carved in grey stone',
        prompt: `A round grey stone plaque carved with a calm skull at its centre, ringed by small carved candles, the carving worn smooth and lit by a single torch from the left. Flat front view. ${P}`,
      },
    },
    {
      id: 'brine-choir',
      name: 'The Brine Choir',
      tagline: 'They sing the drowned ships home.',
      tone: 'info',
      emblem: {
        brief: 'Emblem: a lighthouse under waves, worked in green bronze',
        prompt: `A round green bronze medallion embossed with a small lighthouse standing beneath three curling waves, barnacles crusted on its rim, wet and gleaming in lantern light. Flat front view. ${P}`,
      },
    },
    {
      id: 'ember-throne',
      name: 'The Ember Throne',
      tagline: 'Whoever takes the heart becomes the king.',
      tone: 'error',
      emblem: {
        brief:
          'Emblem: an iron crown over a burning heart, black iron and embers',
        prompt: `A black iron shield-shaped plaque with an iron crown hammered above a heart of glowing red ember glass, hot orange light leaking from the cracks around the heart. Flat front view. ${P}`,
      },
    },
  ],
  cast: [...followers, ...others],
  reveals: Object.entries(REVEAL_TEXT).map(([id, r]) => ({
    id,
    title: r.title,
    teaser: REVEAL_META[id]!.teaser,
    text: r.text,
    act: REVEAL_META[id]!.act,
    about: REVEAL_META[id]!.about,
  })),
  endings,
  moments: [
    ...sceneMoments,
    ...villainMoments,
    ...followerMoments,
    ...romanceMoments,
  ],
  trailer: {
    tagline: 'Three layers down. Bring someone you would follow anywhere.',
    beats: [
      { moment: 'full-party', line: 'Pick your party from fifty delvers.' },
      { moment: 'ossuary-gate', line: 'Go down.' },
      { moment: 'campfire', line: 'Make camp. Make friends. Maybe more.' },
      { moment: 'drowned-halls', line: 'Go deeper.' },
      { moment: 'puzzle-solved', line: 'Riddles, runes and treasure.' },
      { moment: 'ember-deep', line: 'Something is waiting at the bottom.' },
    ],
  },
  allowances: [
    {
      dimension: 'followers',
      max: 50,
      reason:
        'Silas asked for about fifty preset heroes and companions so the roster covers most of the variety of roles, ancestries, identities and romance options; the party builder, optimizer and synergies are the point of the game.',
    },
    {
      dimension: 'romances',
      max: 42,
      reason:
        'Romance depends on the party: every romanceable preset is only reachable with a compatible hero and a full campfire arc, so a single run touches one or two of them.',
    },
    {
      dimension: 'threads',
      max: 50,
      reason:
        'Romances dominate the thread count, but only the companions in the current party of up to three can run in parallel in any one delve.',
    },
  ],
}
