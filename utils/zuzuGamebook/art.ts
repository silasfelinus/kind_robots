/*
 * Zuzu Gamebook illustration manifest (conductor zuzu-gamebook t-005/t-006).
 * Silas, 2026-10-09: "the images are currently low poly filler, and we already
 * have extensively made art that could be repurposed." Each plate is a vetted
 * Arthemy Western Art v3.0 render (the comic's house lane) exported from its
 * private ArtImage into public/zuzu-gamebook/scenes/<file>.webp, so the reader
 * makes no API call at play time. Most come from the Zuzu intro music video's
 * keyframes (KR music video 12; conductor comic-creator MV-FIXES.yaml).
 *
 * `fit` is 'exact' when the render depicts the section, 'stand-in' when it is
 * the closest vetted render until its own plate lands (conductor
 * projects/zuzu-gamebook/art/ROUND-1.yaml queues those). Alt text describes the
 * picture itself, not the prose.
 *
 * Shared Zuzu canon, locked cast ArtImages and the full Zuzu art inventory live
 * in the conductor world registry, worlds/zuzu (README.md, catalog.json). These
 * plates are indexed there in assets/repository-media.json and their ledger in
 * assets/ledger-part-05.json; keep them in step when a plate changes.
 */
import { SECTION_PLATES } from './sectionArt'

export type ScenePlate = {
  file: string
  alt: string
  artImageId: number
  source: string
  fit: 'exact' | 'stand-in'
  /** CSS object-position for the 4:3 phone crop of a 16:9 plate. */
  focus?: string
  /**
   * The render's shape: 'wide' 1344x768 (the default), 'tall' 896x1152 or 'square' 1024x1024. Wide plates sit
   * above the text, tall and square ones to its right — see plateLayout().
   */
  shape?: PlateShape
}

export type PlateShape = 'wide' | 'tall' | 'square'
export type PlateLayout = 'top' | 'right'

export const PLATE_SIZE: Record<PlateShape, { width: number; height: number }> =
  {
    wide: { width: 1344, height: 768 },
    tall: { width: 896, height: 1152 },
    square: { width: 1024, height: 1024 },
  }

const MV = 'Zuzu intro music video keyframe'

export const PLATES: Record<string, ScenePlate> = {
  waterhole: {
    file: 'waterhole',
    alt: 'Zuzu, a short grey koala in a rust-brown poncho, wide straw kasa and orange sash, stands at the edge of a still desert watering hole at dusk, his katana hilt over his shoulder.',
    artImageId: 242684,
    source: MV + ' s03',
    fit: 'exact',
  },
  ripples: {
    file: 'ripples',
    alt: 'Zuzu stands in the shallows of a pale blue desert pool, ripples spreading around his feet, dunes and bare mountains behind him.',
    artImageId: 242683,
    source: MV + ' s03, alternate seed',
    fit: 'exact',
  },
  coyote: {
    file: 'coyote',
    alt: 'A thin one-eyed coyote in a patched olive riding coat stands alone on red desert sand, a revolver holstered on his hip.',
    artImageId: 242581,
    source: MV + ' s04',
    fit: 'exact',
  },
  crocodile: {
    file: 'crocodile',
    alt: 'A huge scarred crocodile heaves out of a muddy watering hole, jaws wide and teeth bared, water spraying past dead reeds.',
    artImageId: 242572,
    source: MV + ' s05',
    fit: 'exact',
    focus: '35% 50%',
  },
  'coyote-wounded': {
    file: 'coyote-wounded',
    alt: 'The one-eyed coyote stands at the dark edge of the watering hole in the night, his right sleeve ending at a fresh wound.',
    artImageId: 242731,
    source: MV + ' s06',
    fit: 'exact',
  },
  'dust-road': {
    file: 'dust-road',
    alt: 'A lone twisted tree on a ridge above a winding desert road at dawn, a tiny traveller far below on the trail.',
    artImageId: 242562,
    source: MV + ' s01',
    fit: 'exact',
    focus: '62% 50%',
  },
  'hollow-bell': {
    file: 'hollow-bell',
    alt: 'Zuzu stands small in the middle of a burning frontier street, flames along both boardwalks and a wooden bell tower black against the smoke.',
    artImageId: 242696,
    source: MV + ' s08',
    fit: 'exact',
  },
  'posters-boardwalk': {
    file: 'posters-boardwalk',
    alt: 'A dark covered boardwalk stretches away under a single hanging lantern, its plank walls pinned with old yellowed paper notices.',
    artImageId: 243327,
    source: 'Gamebook round 1, gb-posters-r3-2 (repaired ArtJob 34959)',
    fit: 'exact',
  },
  siblings: {
    file: 'siblings',
    alt: 'A thin fennec fox girl in a torn pale dress holds her tiny brother tight against her chest and stares hard at the viewer from burned ground.',
    artImageId: 242585,
    source: MV + ' s09',
    fit: 'exact',
  },
  'apple-tree': {
    file: 'apple-tree',
    alt: 'A lone red-leafed apple tree glows against the setting sun on a desert ridge, a small fox standing beneath it.',
    artImageId: 242569,
    source: MV + ' s10',
    fit: 'exact',
  },
  mission: {
    file: 'mission',
    alt: 'The abbess, a round-faced otter nun in a black habit, stands with folded paws at the open iron gate of an adobe mission, a cobwebbed merry-go-round lit in the yard behind her.',
    artImageId: 242738,
    source: MV + ' s11',
    fit: 'exact',
  },
  altar: {
    file: 'altar',
    alt: 'A dark stone chapel where candelabra flank steps rising to an altar, a great coiled black shape with glowing eyes waiting upon it.',
    artImageId: 242570,
    source: MV + ' s12',
    fit: 'exact',
  },
  'sister-dagger': {
    file: 'sister-dagger',
    alt: 'The fennec fox girl stands alone in a pool of light on a crypt floor between tall candles, a small dagger hanging from her bandaged paw, glaring.',
    artImageId: 243000,
    source: MV + ' s13',
    fit: 'exact',
  },
  'three-road': {
    file: 'three-road',
    alt: 'Three silhouettes walk toward a huge orange sun down a long desert road: Zuzu under his wide hat between two big-eared fennec foxes.',
    artImageId: 242575,
    source: MV + ' s14',
    fit: 'exact',
  },
  'coyote-bandaged': {
    file: 'coyote-bandaged',
    alt: 'The one-eyed coyote stands at the edge of a red watering hole at dusk, his right wrist bound in a fresh bandage, his coat ragged.',
    artImageId: 242735,
    source: MV + ' s07, bandaged stump',
    fit: 'exact',
  },
  camp: {
    file: 'camp',
    alt: 'A tiny figure sits by a small campfire in a rocky desert basin under a sky crowded with stars and the milky way.',
    artImageId: 243339,
    source: 'Gamebook round 2, gb2-camp-1',
    fit: 'exact',
  },
  'zuzu-fire': {
    file: 'zuzu-fire',
    alt: 'Zuzu sits cross-legged beside a crackling campfire at night, poncho drawn around him, the katana hilt over his shoulder.',
    artImageId: 243349,
    source: 'Gamebook round 2, gb2-zuzu-fire-1',
    fit: 'exact',
  },
  canyon: {
    file: 'canyon',
    alt: 'A sagging rope bridge spans a deep red canyon at dusk, tiny travellers at either end of it.',
    artImageId: 243341,
    source: 'Gamebook round 2, gb2-canyon-1',
    fit: 'exact',
  },
  'bone-valley': {
    file: 'bone-valley',
    alt: 'A cracked dry riverbed winds between grey hills, a large bleached skull half buried in the foreground.',
    artImageId: 243345,
    source: 'Gamebook round 2, gb2-salt-flats-1',
    fit: 'exact',
  },
  wagon: {
    file: 'wagon',
    alt: 'An abandoned covered wagon with shredded canvas stands on the trail at dusk, a vulture perched on top.',
    artImageId: 243348,
    source: 'Gamebook round 2, gb2-wagon-2',
    fit: 'exact',
  },
  'abbess-welcome': {
    file: 'abbess-welcome',
    alt: 'The otter abbess stands in a lit mission doorway at dusk, lantern raised in one paw, beckoning inside with the other and smiling.',
    artImageId: 243391,
    source:
      'Gamebook round 2, gb2-abbess-welcome-2 (Kontext from the locked abbess front, 242559)',
    fit: 'exact',
  },
  'abbess-supper': {
    file: 'abbess-supper',
    alt: 'The abbess ladles steaming stew from an iron pot at a long candlelit table set with bread and tin cups.',
    artImageId: 243393,
    source: 'Gamebook round 2, gb2-abbess-supper-2 (Kontext from 242559)',
    fit: 'exact',
  },
  refectory: {
    file: 'refectory',
    alt: 'A long dim timber hall lit by wall candles, a single table at its far end set with bowls.',
    artImageId: 243311,
    source: 'Gamebook round 2, gb2-mission-refectory-1',
    fit: 'exact',
  },
  chapel: {
    file: 'chapel',
    alt: 'A plain chapel washed in pale light from tall windows, a bell rope hanging over an altar where something stands shrouded in white cloth.',
    artImageId: 243317,
    source: 'Gamebook round 2, gb2-mission-chapel-1',
    fit: 'exact',
  },
  'bell-tower': {
    file: 'bell-tower',
    alt: 'A bell hangs on its rope under a timber canopy, the desert stretching away at dusk beyond the beams.',
    artImageId: 243328,
    source: 'Gamebook round 2, gb2-bell-tower-2',
    fit: 'exact',
  },
  'empty-cot': {
    file: 'empty-cot',
    alt: 'A ragged stitched cloth doll with button eyes lies on the pillow of a neatly made cot.',
    artImageId: 243322,
    source: 'Gamebook round 2, gb2-empty-cot-2',
    fit: 'exact',
  },
  'locked-door': {
    file: 'locked-door',
    alt: 'A dark timber corridor lit by one wall candle, a heavy door standing ajar onto blackness where two small eyes glint.',
    artImageId: 243319,
    source: 'Gamebook round 2, gb2-locked-door-1',
    fit: 'exact',
  },
  'zuzu-bandage': {
    file: 'zuzu-bandage',
    alt: 'Zuzu crouches on a rock with his forearms bound in cloth, kasa low over his eyes and the katana slung across his back.',
    artImageId: 243352,
    source: 'Gamebook round 2, gb2-zuzu-bandage-2',
    fit: 'exact',
  },
  'names-wall': {
    file: 'names-wall',
    alt: 'A plank wall pinned edge to edge with torn yellowed sheets, each a faded sketch of a young fennec, fox or raccoon face, lit orange by firelight.',
    artImageId: 243405,
    source: 'Gamebook round 2, gb2-names-wall-2 (Kontext on 242685)',
    fit: 'exact',
  },
  'hb-store': {
    file: 'hb-store',
    alt: 'The looted timber interior of a frontier store: empty shelves, slumped flour sacks, scattered tins and a hook hanging from the beams.',
    artImageId: 243416,
    source: 'Gamebook round 3, gb3-hb-store-1',
    fit: 'exact',
  },
  'zuzu-alone': {
    file: 'zuzu-alone',
    alt: 'Zuzu crouches alone on a rock above moonlit dunes under a starry sky, kasa low, katana across his back.',
    artImageId: 243422,
    source: 'Gamebook round 3, gb3-zuzu-shadow-1',
    fit: 'exact',
  },
  'gun-shallows': {
    file: 'waterhole',
    alt: 'Zuzu, a short grey koala in a rust-brown poncho, wide straw kasa and orange sash, stands at the edge of a still desert watering hole at dusk, his katana hilt over his shoulder.',
    artImageId: 242684,
    source: 'Stand-in (waterhole) until art round 4 renders this plate',
    fit: 'stand-in',
  },
  'croc-eggs': {
    file: 'ripples',
    alt: 'Zuzu stands in the shallows of a pale blue desert pool, ripples spreading around his feet, dunes and bare mountains behind him.',
    artImageId: 242683,
    source: 'Stand-in (ripples) until art round 4 renders this plate',
    fit: 'stand-in',
  },
  'bowl-bones': {
    file: 'bowl-bones',
    alt: 'A cracked clay bowl sits half sunk in still dark water, an old bleached bone lying in it.',
    artImageId: 243519,
    source: 'Gamebook round 4, gb4-bowl-bones-2',
    fit: 'exact',
  },
  'dying-badger': {
    file: 'hb-store',
    alt: 'The looted timber interior of a frontier store: empty shelves, slumped flour sacks, scattered tins and a hook hanging from the beams.',
    artImageId: 243416,
    source: 'Stand-in (hb-store) until art round 4 renders this plate',
    fit: 'stand-in',
  },
  looter: {
    file: 'looter',
    alt: 'A young raccoon in a vest crouches in the dust with a sack over his shoulder and a boot at his feet, a small fire burning behind him at dusk.',
    artImageId: 243522,
    source: 'Gamebook round 4, gb4-looter-1',
    fit: 'exact',
  },
  'candle-wax': {
    file: 'candle-wax',
    alt: 'A stub of black candle burns on a scorched wooden threshold, its black wax pooled and dripping over the edge.',
    artImageId: 243524,
    source: 'Gamebook round 4, gb4-candle-wax-1',
    fit: 'exact',
    shape: 'square',
  },
  'bell-view': {
    file: 'hollow-bell',
    alt: 'Zuzu stands small in the middle of a burning frontier street, flames along both boardwalks and a wooden bell tower black against the smoke.',
    artImageId: 242696,
    source: 'Stand-in (hollow-bell) until art round 4 renders this plate',
    fit: 'stand-in',
  },
  'stolen-bread': {
    file: 'stolen-bread',
    alt: 'A fennec girl with bandaged wrists sits by a campfire under the stars, clutching a piece of bread to her chest.',
    artImageId: 243528,
    source: 'Gamebook round 4, gb4-stolen-bread-1',
    fit: 'exact',
  },
  fever: {
    file: 'camp',
    alt: 'A tiny figure sits by a small campfire in a rocky desert basin under a sky crowded with stars and the milky way.',
    artImageId: 243339,
    source: 'Stand-in (camp) until art round 4 renders this plate',
    fit: 'stand-in',
  },
  'apples-sister': {
    file: 'apples-sister',
    alt: 'Under a lone apple tree in the golden evening, a fennec girl hands a red apple to her little brother.',
    artImageId: 243533,
    source: 'Gamebook round 4, gb4-apples-sister-2',
    fit: 'exact',
  },
  'stone-face': {
    file: 'bone-valley',
    alt: 'A cracked dry riverbed winds between grey hills, a large bleached skull half buried in the foreground.',
    artImageId: 243345,
    source: 'Stand-in (bone-valley) until art round 4 renders this plate',
    fit: 'stand-in',
  },
  'dry-well': {
    file: 'dust-road',
    alt: 'A lone twisted tree on a ridge above a winding desert road at dawn, a tiny traveller far below on the trail.',
    artImageId: 242562,
    source: 'Stand-in (dust-road) until art round 4 renders this plate',
    fit: 'stand-in',
  },
  'raider-kits': {
    file: 'raider-kits',
    alt: 'A wide-eyed young jackal in a hooded wrap peeks round a weathered wooden doorpost, frightened.',
    artImageId: 243538,
    source: 'Gamebook round 4, gb4-raider-kits-1',
    fit: 'exact',
  },
  peddler: {
    file: 'peddler',
    alt: 'A lanky hare in a battered top hat and long coat holds up a bottle of water in a dim wooden waystation, more bottles on the tables beside him.',
    artImageId: 243541,
    source: 'Gamebook round 4, gb4-peddler-2',
    fit: 'exact',
  },
  'crow-witch': {
    file: 'crow-witch',
    alt: 'An old crow witch in a black feather shawl and pointed hat sits on the branch of a dead tree under a full moon, a crow perched beside her.',
    artImageId: 243543,
    source: 'Gamebook round 4, gb4-crow-witch-2',
    fit: 'exact',
  },
  'storm-shrine': {
    file: 'bone-valley',
    alt: 'A cracked dry riverbed winds between grey hills, a large bleached skull half buried in the foreground.',
    artImageId: 243345,
    source: 'Stand-in (bone-valley) until art round 4 renders this plate',
    fit: 'stand-in',
  },
  'desert-bloom': {
    file: 'apple-tree',
    alt: 'A lone red-leafed apple tree glows against the setting sun on a desert ridge, a small fox standing beneath it.',
    artImageId: 242569,
    source: 'Stand-in (apple-tree) until art round 4 renders this plate',
    fit: 'stand-in',
  },
  'hb-noon': {
    file: 'hb-noon',
    alt: 'The empty main street of a timber frontier town at noon, doors hanging open, a tall bell tower at the far end.',
    artImageId: 243412,
    source: 'Gamebook round 3, gb3-hb-noon-1',
    fit: 'exact',
  },
  'zuzu-moon': {
    file: 'zuzu-moon',
    alt: 'Zuzu stands alone on a dusty rise against a pale full moon, poncho over his sash, his katana slung across his back.',
    artImageId: 242587,
    source: MV + ' s15',
    fit: 'exact',
  },
  'abbess-crypt': {
    file: 'abbess-crypt',
    alt: 'The otter abbess stands in a candlelit stone crypt before a bare altar, a small curved dagger in her paw, a huge violet shadow with tentacles rising on the wall behind her.',
    artImageId: 243304,
    source:
      'Gamebook round 1, gb-abbess-crypt-2 (Kontext from her approved front, 242559)',
    fit: 'exact',
  },
  'kasa-on-water': {
    file: 'kasa-on-water',
    alt: 'A lone woven straw kasa floats in the middle of a black pool at night, rings of ripples spreading out to the reeds.',
    artImageId: 243308,
    source: 'Gamebook round 1, gb-ending-water-r2-4',
    fit: 'exact',
  },
  'kneeling-blade': {
    file: 'kneeling-blade',
    alt: 'Zuzu, hatless and spent, kneels on cracked flagstones in his poncho and sash, one paw on the hilt of his katana planted point-down beside him.',
    artImageId: 243309,
    source: 'Gamebook round 1, gb-ending-seal-r2-3',
    fit: 'exact',
  },
  'shuttered-town': {
    file: 'shuttered-town',
    alt: 'Zuzu steps out of a lantern-lit timber doorway into the night, kasa low over his eyes, poncho and orange sash, the katana hilt over his right shoulder.',
    artImageId: 243296,
    source: 'Gamebook round 1, gb-ending-warning-2',
    fit: 'exact',
  },
  'empty-gate': {
    file: 'empty-gate',
    alt: 'An empty adobe archway at grey dawn, its iron gate hanging open, a small bronze bell dangling from a rope that no one holds.',
    artImageId: 243299,
    source: 'Gamebook round 1, gb-ending-altar-1',
    fit: 'exact',
  },
  wren: {
    file: 'wren',
    alt: 'A young otter novice in a grey habit and white veil stands in a dark doorway clutching a folded note, a candle burning on the table beside her.',
    artImageId: 243548,
    source: 'Gamebook round 5, gb5-wren-1',
    fit: 'exact',
  },
  'rabbit-kit': {
    file: 'rabbit-kit',
    alt: 'A small rabbit child in a plain sweater sits very still in a dark doorway, staring out with tired eyes.',
    artImageId: 243550,
    source: 'Gamebook round 5, gb5-rabbit-kit-1',
    fit: 'exact',
  },
  'pilgrim-wagon': {
    file: 'wagon',
    alt: 'An abandoned covered wagon with shredded canvas stands on the trail at dusk, a vulture perched on top.',
    artImageId: 243348,
    source: 'Stand-in (wagon) until art round 5 renders this plate',
    fit: 'stand-in',
  },
  'the-dream': {
    file: 'zuzu-moon',
    alt: 'Zuzu stands alone on a dusty rise against a pale full moon, poncho over his sash, his katana slung across his back.',
    artImageId: 242587,
    source: 'Stand-in (zuzu-moon) until art round 5 renders this plate',
    fit: 'stand-in',
  },
  'mags-bar': {
    file: 'mags-bar',
    alt: 'A weathered rabbit barkeep with one notched ear leans on her counter in lamplight, bottles and a scattergun on the shelf behind her.',
    artImageId: 243556,
    source: 'Gamebook round 5, gb5-mags-bar-1',
    fit: 'exact',
  },
  'baron-office': {
    file: 'baron-office',
    alt: 'A horned water baron in a waistcoat and tie sits on his desk before a map of wells, crystal water jugs beside him.',
    artImageId: 243558,
    source: 'Gamebook round 5, gb5-baron-office-1',
    fit: 'exact',
  },
  'torch-mob': {
    file: 'hollow-bell',
    alt: 'Zuzu stands small in the middle of a burning frontier street, flames along both boardwalks and a wooden bell tower black against the smoke.',
    artImageId: 242696,
    source: 'Stand-in (hollow-bell) until art round 5 renders this plate',
    fit: 'stand-in',
  },
  'bounty-badger': {
    file: 'bounty-badger',
    alt: 'A broad bounty hunter in a wide hat, long coat and bandolier stands in a dim street, a rifle over his shoulder.',
    artImageId: 243562,
    source: 'Gamebook round 5, gb5-bounty-badger-1',
    fit: 'exact',
  },
  'shifting-road': {
    file: 'shifting-road',
    alt: 'A pale road winds across dark broken ground toward a black spire of rock under a huge full moon.',
    artImageId: 243564,
    source: 'Gamebook round 5, gb5-shifting-road-1',
    fit: 'exact',
  },
  'mob-fire-gate': {
    file: 'mission',
    alt: 'The abbess, a round-faced otter nun in a black habit, stands with folded paws at the open iron gate of an adobe mission, a cobwebbed merry-go-round lit in the yard behind her.',
    artImageId: 242738,
    source: 'Stand-in (mission) until art round 5 renders this plate',
    fit: 'stand-in',
  },
  'cellar-cells': {
    file: 'cellar-cells',
    alt: 'In a candlelit stone cell, a fox child and a small mouse wait behind iron bars, frightened.',
    artImageId: 243568,
    source: 'Gamebook round 5, gb5-cellar-cells-1',
    fit: 'exact',
  },
  'abbess-knife': {
    file: 'abbess-knife',
    alt: 'The otter abbess stands in a pitch-dark crypt holding a long curved knife, black candles burning around her feet.',
    artImageId: 243597,
    source: 'Gamebook round 5, gb5-abbess-knife-1',
    fit: 'exact',
  },
  'nuns-kneel': {
    file: 'refectory',
    alt: 'A long dim timber hall lit by wall candles, a single table at its far end set with bowls.',
    artImageId: 243311,
    source: 'Stand-in (refectory) until art round 5 renders this plate',
    fit: 'stand-in',
  },
  'children-leaving': {
    file: 'empty-gate',
    alt: 'An empty adobe archway at grey dawn, its iron gate hanging open, a small bronze bell dangling from a rope that no one holds.',
    artImageId: 243299,
    source: 'Stand-in (empty-gate) until art round 5 renders this plate',
    fit: 'stand-in',
  },
  'bell-dawn': {
    file: 'bell-tower',
    alt: 'A bell hangs on its rope under a timber canopy, the desert stretching away at dusk beyond the beams.',
    artImageId: 243328,
    source: 'Stand-in (bell-tower) until art round 5 renders this plate',
    fit: 'stand-in',
  },
}

export function platePath(plate: ScenePlate): string {
  return '/zuzu-gamebook/scenes/' + plate.file + '.webp'
}

/** The plate a scene's `art` key names (adventure.ts). */
export function plate(key: string): ScenePlate {
  const found = PLATES[key]
  if (!found) throw new Error('Unknown gamebook plate: ' + key)
  return found
}

/**
 * The plate a section shows: its own render when sectionArt.ts has one (one plate per section, conductor
 * zuzu-gamebook art rounds 6+), else the shared plate its `art` key names.
 */
export function sectionPlate(node: { id: string; art: string }): ScenePlate {
  return SECTION_PLATES[node.id] ?? plate(node.art)
}

/**
 * Where the plate sits: a wide plate above the text, a tall or square one to its right. Silas, 2026-10-11: "Ditch
 * the images appearing below the text, or to the left. Just keep a single horizontal view above or portrait to the
 * right." (This replaced the 2026-10-10 hashed top/bottom/left/right mix.)
 */
export function plateLayout(art: ScenePlate): PlateLayout {
  return (art.shape ?? 'wide') === 'wide' ? 'top' : 'right'
}
