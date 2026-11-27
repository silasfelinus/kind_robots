import { DH_PALETTE, portraitArt, romanceArt } from '../../deepheart/art'
import {
  DEEPHEART_ACHIEVEMENT_ART,
  deepheartArtSrc,
} from '../../deepheart/renderedArt'
import {
  COURT_CHOICE_KEYS,
  COURT_DEITIES,
  COURT_LINKS,
} from '../../deepheart/court'
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
      prompt: `An anthropomorphic opossum merchant woman with charcoal-and-cream fur, a tall grey head-fur bouffant and a generous build grins beside a campfire, her patched velvet coat and enormous pack hung with lanterns, potions and curios. Waist-up portrait at eye level. ${P}`,
    },
  },
  {
    id: 'snag',
    name: 'Snag',
    role: 'figure',
    tagline:
      'A young trapper who got caught in his own snare and pays his debts in directions.',
    portrait: {
      brief: 'Portrait of Snag hanging upside down from a snare',
      prompt: `An anthropomorphic raccoon youth with mottled grey fur, a black eye mask and oversized ears hangs upside down by one ankle from a rope snare in a crypt corridor, arms crossed and scowling as coins tumble from his pockets. Medium shot at eye level. ${P}`,
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
      prompt: `A translucent anthropomorphic snow leopard spirit woman with soft grey rosettes and drifting head fur presses her pale paws against the inside of a door made of fitted grey bones, glowing tears lighting her cheeks. Close medium shot. ${P}`,
    },
  },
  ...COURT_DEITIES.map((deity): KitCastMember => ({
    id: `fairy-${deity.id}`,
    name: deity.name,
    role: 'figure',
    tagline: `${deity.epithet}. ${deity.impact}`,
    portrait: {
      src: deepheartArtSrc(`court:${deity.id}`),
      brief: `Portrait of ${deity.name}, an unnervingly human-faced fairy ruler`,
      prompt: `${deity.look} The visibly human-faced fairy ruler poses alone in an ancient underground palace, amid stained-glass lift machinery and candlelit paperwork. Hand-inked mature Western fantasy animation, bold cartoon shapes, saturated jewel tones, flat cel shadows and a painted stone background.`,
    },
  })),
]

for (const member of others) {
  const src = deepheartArtSrc(`cast:${member.id}`)
  if (src) member.portrait.src = src
}

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
  art: {
    brief: `${title}: ${caption}`,
    prompt: `${prompt} ${P}`,
    src: deepheartArtSrc(`moment:${id}`),
  },
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
    'An adventurer staggering under a bulging sack of gold coins in a torchlit vault while a broad opossum merchant in a patched velvet coat rubs her ringed paws at the doorway. Medium shot.',
  ),
  m(
    'weeping-door',
    'The Weeping Door',
    'Behind a door of bone, a spirit asks to be let out.',
    'scene',
    1,
    ['maren', 'bone-warden'],
    'A door built of fitted grey bones glows pale blue from behind, a translucent snow leopard spirit’s paws pressed against it from the inside, an adventurer reaching for the latch. Medium shot.',
  ),
  m(
    'goblin-snare',
    'Snag in a Snare',
    'Snag swears in three languages, then goes very quiet.',
    'scene',
    1,
    ['snag'],
    'A small anthropomorphic raccoon with a black eye mask hangs upside down by one ankle from a rope snare in a crypt, coins dropping from his pockets, as an adventurer with a knife steps closer. Medium shot.',
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
    'Four adventurers of different ancestries stand together at the top of a dungeon stairway holding lanterns high, a broad wild-boar shieldbearer, a long-eared hare archer, a feathered owl mage and a hooded animal-person leader. Wide shot from below the steps.',
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
    'support-brannoc-thessaly',
    'Hearthbound',
    'Thessaly falls asleep against Brannoc’s shoulder. He does not move for three hours, and tells nobody his arm went numb.',
    'romance',
    1,
    pair('brannoc', 'thessaly'),
    'A compact russet wild boar man in green wool and scale armour sits on a wooden bench, his chestnut mane braided with iron rings. A tall golden lioness woman in white-and-gold plate sleeps with her braided honey mane resting on his shoulder; his broad round shield leans against the bench. Seated-height view beside a low fire, amber light on their faces.',
  ),
  m(
    'forty-years',
    'Forty Years Married',
    'Quillon and Ambrose have the same argument they had the day they met.',
    'romance',
    1,
    pair('quillon', 'ambrose'),
    'An elderly snow-white stoat wizard with a flowing white beard and star-covered midnight hat points a crooked finger at a rune carved into a wall. His small elderly ash-brown house mouse husband in half-moon spectacles and a tweed coat points at the same carving with a pencil, both laughing. Eye-level view with two open books on a stone ledge and yellow lamplight.',
  ),
  m(
    'stoneharrow',
    'Stoneharrow Brothers',
    'Brannoc adds a ring to his brother’s beard.',
    'follower',
    1,
    pair('brannoc', 'torvald'),
    "Two adult stocky wild boar men sit beside a fire. The older boar with russet bristles and green wool threads a small iron ring into the younger boar's thick black braided mane among several gold rings. The younger boar wears chainmail, tusks protruding beside his grin; a warhammer and round shield rest against the wall. Close view from beside the fire.",
  ),
  m(
    'sworn-kin',
    'Sworn Kin',
    'Grell is already awake when Pip wakes from the nightmare.',
    'follower',
    1,
    pair('grell', 'pip'),
    'A massive graphite-grey anthropomorphic rhinoceros guardian in riveted iron armour holds out a steaming clay cup with both hands. A tiny adult sandy ferret woman with blue eyes and a blonde pixie tuft sits on a bedroll wrapped in a blue blanket, accepting the cup. Low seated view in a dark stone alcove with an enormous rectangular shield propped behind them and a small fire.',
  ),
  m(
    'old-flame',
    'Old Flame',
    'Corso finds his old lockpick in Idris’s boot.',
    'romance',
    1,
    pair('idris', 'corso'),
    'A slim adult silver fox man with charcoal ear tips, swept-back dark head fur and a burgundy doublet holds a small iron lockpick in one hand and a worn leather boot in the other. A cinnamon hare knight with one folded ear, silver armour and blue tabard sleeps on a bedroll nearby. Close medium view across a campfire, amber light on the boot and fox muzzle.',
  ),
  m(
    'old-rite',
    'The Old Rite',
    'Mother Hesk mouths the words along with Idris.',
    'follower',
    1,
    pair('idris', 'hesk'),
    "A short elderly porcupine priestess with white quills, brown robes and an iron-shod walking staff stands beside a kneeling cinnamon hare knight in silver armour and a blue tabard. Both mouths are open in prayer, the hare's folded ear hanging beside his cheek. Medium side view in a limestone chapel, candles on a low stone altar.",
  ),
  m(
    'ironsong-fell',
    'Ironsong and Fell',
    'Ragna sings. Dagny hums the old harmony.',
    'romance',
    1,
    pair('ragna', 'dagny'),
    'A muscular grey wolf woman with a crimson braided mane and painted blue cheek stripes sings beside a small fire, her double-bladed axe lying on the floor. A broad brown bear swordswoman with dark cropped head fur and lacquered leather armour sits close beside her, eyes closed and mouth open in song. Seated-height three-quarter view, glowing embers and warm light on fur.',
  ),
  m(
    'halloran-twins',
    'Halloran Twins',
    'Rook tells Wren about the farm. She already knew.',
    'follower',
    1,
    pair('rook', 'wren'),
    'Two adult lanky black-and-white magpie twins with auburn crest highlights and matching green travelling cloaks sit on a bench beside a fire. The man lowers his head with his wing-hands clasped, the woman rests her head against his shoulder. A longbow and two daggers lie on a folded blanket. Medium view across the fire, soft yellow light on their feathers.',
  ),
  m(
    'hedge-kin',
    'Hedge-Kin',
    'Moss and Badger argue about mushrooms until they cry laughing.',
    'follower',
    1,
    pair('moss', 'badger'),
    'A long-limbed forest deer person with speckled umber fur, moss-covered antlers and a woven leaf vest holds up a purple mushroom. An ancient stooped olive tortoise man in a striped cloak holds a different orange mushroom, both mouths open in laughter. Close seated view at a campfire surrounded by little baskets and a crooked walking stick.',
  ),
  m(
    'support-calla-moss',
    'Pipes and Moss',
    'Calla plays. Moss hums. Somewhere in the walls, the dungeon’s breathing slows to match.',
    'follower',
    1,
    pair('moss', 'calla'),
    'A petite tawny gazelle person with curved horns and honey-colored head fur sits on a flat rock playing reed panpipes. A tall umber forest deer person with moss-wrapped antlers and leaf vest sits opposite with eyes closed and lips parted. Ferns and pale lichen cover the damp cavern walls; side view with green reflected light and a copper lantern.',
  ),
  m(
    'support-hesper-lucan',
    'Competing Patrons',
    'Lucan and Hesper compare contracts. Hesper’s moth wins. Lucan is quietly jealous.',
    'follower',
    1,
    pair('lucan', 'hesper'),
    'A tall black ram man with curled horns and a fitted velvet coat unrolls a parchment sealed in crimson wax beside a pale grey anthropomorphic orb-weaver spider woman with six slender secondary arms and a feathered shawl. She holds a broad-winged cream moth on one palm while he stares at it. Medium view across a candlelit oak table with two documents.',
  ),
  m(
    'moth-court',
    'The Moth Court',
    'Hesper’s patron settles on Gloam’s antennae.',
    'follower',
    1,
    pair('gloam', 'hesper'),
    'A slender anthropomorphic luna moth person in a charcoal robe sits perfectly still, silver-grey patterned wings folded behind them and a pale moth perched on their velvety antennae. A pearl-grey orb-weaver spider woman with a dark bob, feathered shawl and six delicate secondary arms leans forward smiling. Eye-level close view, dim cavern and an orange lantern behind.',
  ),
  m(
    'graveside',
    'Graveside Lessons',
    'Crell teaches Mortimer the crow-call on the ninth try.',
    'follower',
    1,
    pair('mortimer', 'crell'),
    'An elderly anthropomorphic crocodile woman with weathered grey-green scales and a ragged shawl holds her webbed hands to her long muzzle. A gaunt turkey vulture man in a black coat, round spectacles and grey feathered collar copies her gesture. Three black crows land on the stone wall behind them. Medium side view with a pale moonbeam from a shaft above.',
  ),
  m(
    'support-crell-ines',
    'Old Death, New Death',
    'Ines calls Crell’s methods primitive. Crell raises a skeleton that bows to Ines. Ines takes notes.',
    'follower',
    1,
    pair('ines', 'crell'),
    'A tall black panther woman in a high-collared black gown with a white forelock writes in a small notebook. An elderly grey-green crocodile woman in a ragged shawl raises one hand toward a human-shaped skeleton bowing at the waist between them; two crows perch on her shoulder. Wide view at eye level in a crypt with lanterns and loose bones.',
  ),
  m(
    'support-delphine-jory',
    'Duelling Lutes',
    'Jory and Delphine trade verses until dawn. Neither will admit the other won.',
    'follower',
    1,
    pair('jory', 'delphine'),
    'A small golden rabbit man wearing a feathered cap and patchwork waistcoat strums a wooden lute. A tall violet-blue peacock woman in a sequined emerald gown plays a second lute, her green tail feathers spread behind her and beak open mid-song. Seated eye-level view in a stone tavern alcove, a lantern and two cups on the table.',
  ),
  m(
    'support-jory-pip',
    'Pocket Crew',
    'Jory writes Pip into his ballad as a giant. She demands two more verses.',
    'follower',
    1,
    pair('jory', 'pip'),
    'A cheerful golden rabbit man with long ears and a feathered cap plucks his lute and laughs. A tiny adult sandy ferret woman with a blonde pixie tuft and a leather lockpick vest stands with her paws on her hips, smiling and holding up two fingers. Medium view at a stone bench, soft amber lamplight and a half-packed travel bag.',
  ),
  m(
    'support-fen-pip',
    'Thistledown Cousins',
    'Fen re-bandages Pip’s knuckles and lectures her the whole time. Pip lets them.',
    'follower',
    1,
    pair('fen', 'pip'),
    'A petite copper-and-cream ferret medic with spectacles and an untidy curled forelock wraps a fresh white bandage around the knuckles of a tiny sandy ferret woman with blue eyes and a blonde pixie tuft. The medic wears a sky-blue tunic and stained apron, the patient sits on a stool in a leather vest. Close view of their faces and paws under a hanging oil lamp.',
  ),
  m(
    'support-dagny-kaz',
    'Ironjaw Kin',
    'Kaz offers Dagny a tomato. She eats it in one bite. He looks betrayed.',
    'follower',
    1,
    pair('kaz', 'dagny'),
    'A huge brown bear man with moss-tinted fur, a scarred muzzle, topknot and sleeveless leather holds an empty palm out in astonishment. His tall dark-brown bear sister in lacquered leather chews a red tomato with a small smile, a curved sword beside her chair. Medium view across a rough dining table with a few tomatoes and a lantern.',
  ),
  m(
    'support-marisol-seraphine',
    'Academy Rivals',
    'Seraphine finally asks Marisol about that exam. Marisol tells the truth. Seraphine laughs for the first time in years.',
    'follower',
    1,
    pair('seraphine', 'marisol'),
    'A tall ivory swan woman with a swept black feather crest and silver robes sits beside a full-figured golden jaguar woman with dark rosettes, curled head fur, gold earrings and teal rune robes. The swan tilts her neck back laughing while the jaguar points at a folded exam parchment on their table. Eye-level view, floating glass orbs cast blue light on the paper.',
  ),
  m(
    'support-ember-quince',
    'Things That Go Boom',
    'Quince fireproofs Ember’s coat. Ember sets fire to it to test. It holds. They high-five.',
    'follower',
    1,
    pair('ember', 'quince'),
    "A black-and-orange striped anthropomorphic fire salamander in a red mage coat extends one sleeve toward a small flame. A lavender axolotl person with pink frilled gills, oversized goggles and a vial-filled lab coat raises a palm to meet the salamander's raised free hand. Wide medium view at a stone laboratory bench, warm orange firelight on glass flasks.",
  ),
  m(
    'support-aldous-quince',
    'Competing Formulae',
    'Aldous corrects a measurement of Quince’s. Quince was right. Aldous apologizes, which has never happened.',
    'follower',
    1,
    pair('aldous', 'quince'),
    'A slim dark-umber platypus man in a black waistcoat bends over a glass measuring cylinder on a laboratory table. A round lavender axolotl person in oversized goggles and a white coat holds a small pipette and smiles as the platypus bows his head. Close medium view from the other side of the workbench, green liquid glows in the vials and brass lamps light their faces.',
  ),
  m(
    'gearheads',
    'Gearheads',
    'Nettle and Gizelle build a trap and argue whether to trigger it.',
    'follower',
    1,
    pair('gizelle', 'nettle'),
    'A slate-grey chinchilla woman with an electric-blue hair tuft and a finely engineered brass prosthetic arm crouches on a stone floor with a round hedgehog woman whose quill tips are dyed moss green. Both wear brass goggles; one reaches for a lever on a spring-loaded trap while the other holds a wrench. Eye-level view of the floor-level mechanism, scattered gears and golden lamplight.',
  ),
  m(
    'support-gizelle-liesl',
    'Brasswhistle Sisters',
    'Liesl offers Gizelle a discount on healing. Gizelle offers Liesl one on clockwork. They shake on it seriously.',
    'follower',
    1,
    pair('gizelle', 'liesl'),
    'Two slate-grey chinchilla sisters shake hands across a narrow workbench. One has a bright blue hair tuft, brass goggles and a brass clockwork prosthetic arm; the other is tiny and plump with a pink forelock, white cleric robes and a chained ledger. Medium view with potion bottles on one side and copper gears on the other, warm lamplight.',
  ),
  m(
    'support-tobiah-yarrow',
    'Long Memory',
    'Tobiah tells Yarrow about the oak he planted. She is quiet for a long time, and then asks how tall it is.',
    'romance',
    1,
    pair('tobiah', 'yarrow'),
    'A tall elderly white elk man with broad antlers and silver mane sits on a boulder, hands extended far apart as he talks. A lanky silver fox woman with amber eyes and black-tipped ears listens with her muzzle tilted toward him, green cloak fastened with mushroom and bone charms. Wide medium view at a cavern camp, pale roots hang overhead and firelight warms both faces.',
  ),
  m(
    'seven-winds',
    'Seven Winds Doctrine',
    'Lio and Ash meditate back to back for an hour.',
    'follower',
    1,
    pair('lio', 'ash'),
    'A lean rust-orange red panda man in saffron monk wraps sits cross-legged back to back with a slender teal gecko person in grey monk wraps and prayer beads. Both have closed eyes and relaxed hands resting on their knees; the gecko tail curves along the stone floor. Symmetrical side view with a candle at either end, warm light and quiet blue shadows.',
  ),
  m(
    'support-juniper-lio',
    'Open Palm, Closed Fist',
    'Juniper challenges Lio to a spar. He yields at once. She is furious, then delighted.',
    'follower',
    1,
    pair('juniper', 'lio'),
    'A short muscular brown harvest mouse woman with round ears, a messy dark bun and a sleeveless red fighting gi stands with wrapped fists raised. A lean red panda man in saffron monk wraps bows with his palms together, smiling gently. Full-length side view across a stone practice area, an oil lamp and rolled mats against the wall.',
  ),
  m(
    'support-sable-thessaly',
    'Broken Oath',
    'Sable and Thessaly compare the orders that cast them out. They agree both orders were wrong.',
    'follower',
    1,
    pair('sable', 'thessaly'),
    'A sturdy midnight-black mountain goat person with curled horns, silver forelock and black plate armour sits beside a tall golden lioness woman in white-and-gold plate. The goat holds a broken golden sun emblem on one palm while the lioness holds a worn metal crest in her other hand. Close view across a small campfire, orange highlights on the two pieces of metal.',
  ),
  m(
    'support-ash-skarra',
    'Clutch-Kin',
    'Skarra hands Ash a letter at last. It says one word: sorry. Ash keeps it in their robe.',
    'follower',
    1,
    pair('skarra', 'ash'),
    'A muscular rust-and-sand desert gecko person with a broad frilled crest and a scarred snout hands a folded parchment to a willowy teal gecko person wearing grey monk wraps and prayer beads. The teal gecko presses the folded paper to their chest, both tails rest on the stone bench. Medium eye-level view with a spear leaning against the wall and soft yellow lantern light.',
  ),
  m(
    'support-hollis-rook',
    'Two Cautions',
    'Hollis teaches Rook to check exits. Rook teaches Hollis to cheat at cards.',
    'follower',
    1,
    pair('hollis', 'rook'),
    'A middle-aged brown river otter woman with silver muzzle fur and a patched trapper coat points toward two stone doorways on a parchment map. A lanky black-and-white magpie man with auburn crest and green cloak demonstrates a playing card held behind his wing-hand, both smiling. Medium shot across a travel table with a crossbow and daggers beside the map.',
  ),
  m(
    'support-ambrose-tamsin',
    'Footnotes',
    'Ambrose reads Tamsin’s map and adds a footnote. She frames it, mentally, forever.',
    'follower',
    1,
    pair('tamsin', 'ambrose'),
    'A long-limbed tawny lynx woman with tufted ears, dark curls and a map-filled satchel watches a small elderly ash-brown house mouse scholar in tweed add a pencil annotation to her unfolded map. His half-moon spectacles sit low on his muzzle and her ears are perked forward. View from slightly above the wooden tabletop, amber light on paper and fur.',
  ),
  m(
    'support-corso-vex',
    'Same Mark',
    'Vex and Corso both try to lift the same purse. It belongs to Liesl. She bills them both.',
    'follower',
    1,
    pair('vex', 'corso'),
    'A wiry black bat person with long ears, wine-red wing membranes and a hooded leather coat reaches toward a leather coin purse at the same moment as a slim silver fox man in a burgundy doublet. A tiny slate-grey chinchilla cleric with a pink forelock and white vestments holds the purse string and lifts a chained ledger. Medium eye-level view in a crowded stone market stall.',
  ),
  m(
    'support-aurel-idris',
    'Ink and Oath',
    'Aurel copies Idris’s oath into his journal. Idris asks him to fix the spelling. Aurel refuses.',
    'follower',
    1,
    pair('aurel', 'idris'),
    'A tawny barn owl man with heart-shaped pale facial feathers and grey robes writes with a quill in an open journal. A slim cinnamon hare man with one folded ear and silver armour leans over the journal, pointing at the page while the owl raises an eyebrow. Medium view from the opposite side of a wooden table, one brass lantern lighting the parchment.',
  ),
  m(
    'support-corvin-pelham',
    'Squire Days',
    'Pelham and Corvin trade stories of their worst days as squires. Pelham’s are worse, and funnier.',
    'follower',
    1,
    pair('pelham', 'corvin'),
    'A tall glossy chestnut horse man in polished knight armour and a feather-plumed helmet laughs with one hand pressed to his chest. A rangy middle-aged raven man with black feathers greying at the temples and battered grey temple armour sits beside him, beak open in laughter. Medium shot across a campfire with two battered helmets and a stone arch behind.',
  ),
  m(
    'support-benny-torvald',
    'Ale Oath',
    'Benny and Torvald finish a cask between them and sing until the skeletons upstairs complain.',
    'follower',
    1,
    pair('benny', 'torvald'),
    'A stout tawny bulldog man in a red shirt and leather tavern apron holds up a wooden mug beside a stocky wild boar man with black braided mane full of gold rings and chainmail. Both sing with mouths open, an empty cask rests on its side near their boots and a fiddle lies across a stool. Wide seated view under amber lanterns in a vaulted stone tavern.',
  ),
  m(
    'support-benny-oona',
    'Tavern Folk',
    'Oona and Benny swap tavern stories. Hers end in fights; his end in songs. Both end in someone crying.',
    'follower',
    1,
    pair('oona', 'benny'),
    'A towering broad chestnut bison woman with close-cropped head fur, amber eyes and a scar on her shoulder gestures with both hands as she tells a story. A stout tawny bulldog man in a leather apron wipes a tear from his laughing face; an old oak door shield leans against their bench. Medium view across a tavern table, warm candlelight on two wooden mugs.',
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
    src: deepheartArtSrc(`ending:${e.id}`),
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
  ...Object.fromEntries(
    COURT_DEITIES.map((deity) => [
      `court-meet-${deity.id}`,
      {
        teaser: 'Why does this noble have a human face?',
        act: deity.layer + 1,
        about: [`fairy-${deity.id}`],
      },
    ]),
  ),
  ...Object.fromEntries(
    COURT_DEITIES.map((deity) => [
      `court-immortality-${deity.id}`,
      {
        teaser: 'Why can this god never die?',
        act: deity.layer + 1,
        about: [`fairy-${deity.id}`],
      },
    ]),
  ),
  ...Object.fromEntries(
    COURT_LINKS.map((link) => [
      link.id,
      {
        teaser: 'Someone is hiding a court relationship.',
        act: 3,
        about: [`fairy-${link.from}`, `fairy-${link.to}`],
      },
    ]),
  ),
  ...Object.fromEntries(
    COURT_DEITIES.flatMap((deity) =>
      COURT_CHOICE_KEYS.flatMap((choice) =>
        (['success', 'failure'] as const).map((result) => [
          `court-ending-${deity.id}-${choice}-${result}`,
          {
            teaser: 'How did your last audience with the court end?',
            act: 3,
            about: [`fairy-${deity.id}`],
          },
        ]),
      ),
    ),
  ),
}

export const DEEPHEART: PlaybookKitSpec = {
  id: 'deepheart',
  conductorSlug: 'deepheart',
  title: 'Deepheart',
  tagline: 'Three layers down. Bring someone you would follow anywhere.',
  premise:
    'Three inhabited levels separate daylight from the living heart of the mountain. Delvers can fight or bargain with the people below, then confront the strangely human-faced fairy court that turned class, debt and old family scandals into laws of nature.',
  tier: 'saga',
  route: '/admin/deepheart',
  theme: 'deepheart',
  artPromptsComplete: true,
  achievementArt: DEEPHEART_ACHIEVEMENT_ART,
  keyArt: {
    src: deepheartArtSrc('premise'),
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
        src: deepheartArtSrc('faction:bone-court'),
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
        src: deepheartArtSrc('faction:brine-choir'),
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
        src: deepheartArtSrc('faction:ember-throne'),
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
      dimension: 'moments',
      max: 95,
      reason:
        'All 35 authored support pairs have their own scrapbook moment, in addition to the original scene and romance collection. Only the current party can discover its support moments in a delve.',
    },
    {
      dimension: 'reveals',
      max: 136,
      reason:
        'The twelve immortal rulers have encounter, deathless-secret and six finale-outcome reveals each, plus thirty-two unlockable family ties. These are persistent catalogue discoveries, not simultaneous active quests; an individual delve sees only a few.',
    },
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
