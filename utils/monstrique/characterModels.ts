/**
 * MONSTRIQUE character model sheets.
 *
 * One sheet per recurring character is the single source for every medium the
 * story is told in: the 2D point-and-click stage sprite, dialogue portraits,
 * 3D animated cutscene renders, scrapbook cards and, later, a trained identity
 * LoRA. Identity (anatomy, silhouette, palette, signature props) lives here and
 * never in a style; styles live in `artStyles.ts` and never describe a person.
 * That split is what lets one LoRA per character be stacked with any style.
 *
 * Proportions follow the comedy: a Larry-style caricature cast with big heads,
 * readable silhouettes and exaggerated reactions. Every character is an adult;
 * apparent age is stated explicitly so no render drifts younger.
 *
 * Canon: conductor projects/monstress-convention/CHARACTER-LOOKBOOK.md and
 * STORY-BIBLE.md. Spoilers never live in a model sheet: these strings become
 * prompt metadata.
 */

export type MonstriqueCharacterId =
  | 'iris'
  | 'norb'
  | 'odette'
  | 'violet'
  | 'marta'
  | 'dolores'
  | 'gavin'
  | 'pip'
  | 'cleo'
  | 'draculina'
  | 'siobhan'
  | 'nyx'
  | 'albina'
  | 'roxie'
  | 'laguna'
  | 'francesca'
  | 'vespa'
  | 'blobzo'
  | 'delta'
  | 'cherie'
  | 'clem'
  | 'deedee'

export type SpriteHair =
  | 'bob'
  | 'curls'
  | 'updo'
  | 'wild'
  | 'scarf'
  | 'bandage'
  | 'comb-over'
  | 'cap'
  | 'snout'
  | 'panther'
  | 'wolf'
  | 'beehive'
  | 'antennae'
  | 'frill'
  | 'goo'
export type SpriteProp =
  | 'camera'
  | 'gloves'
  | 'cape'
  | 'contract'
  | 'long-lens'
  | 'wrench'
  | 'remote'
  | 'ice-bucket'
  | 'pen'
  | 'mic'
  | 'stole'
  | 'none'

/** Parameters for the vector stand-in drawn until generated art is delivered. */
export interface SpriteRig {
  /** Height relative to Iris (1). Norb is a little person about four feet tall, Albina is over six feet of gator. */
  height: number
  /** Body height in heads. Caricature cast: 3.2 is cartoon, 5.5 is glamour. */
  heads: number
  build: 'slim' | 'curvy' | 'stout' | 'scrawny' | 'towering'
  skin: string
  hair: string
  hairStyle: SpriteHair
  outfit: string
  accent: string
  prop: SpriteProp
  glasses?: boolean
  bigNose?: boolean
  /** A single streak of this colour through the hair. */
  streak?: string
  /** A plaster on the side of the neck (Iris's necker of a boyfriend). */
  neckBandage?: boolean
  /** Quasimodo hump and forward lean. */
  hunch?: boolean
  /** Text printed across the shirt front. */
  shirt?: string
  ghost?: boolean
}

export interface CharacterExpression {
  id: string
  /** Prompt words for the face, used in every style. */
  prompt: string
}

export interface LoraPlan {
  /** Unique trigger token. Rare on purpose so it never collides with real words. */
  trigger: string
  /** Resource name once a LoRA is trained and catalogued; null until then. */
  resourceName: string | null
  status: 'dataset-needed' | 'dataset-ready' | 'training' | 'trained'
  strength: number
}

export interface CharacterModel {
  id: MonstriqueCharacterId
  name: string
  /** Hotspot ids in the chapter engine that stand for this character. */
  hotspots: string[]
  /** Names the engine prints before a colon, for dialogue portraits. */
  speakerNames: string[]
  role: string
  species: string
  /** Always an adult. The visual age every render must hold. */
  apparentAge: string
  /** One line that must read at 64 px tall. */
  silhouette: string
  /** Immutable identity traits, in prompt order of importance. */
  identity: string[]
  wardrobe: string
  /** Larry-style comic acting notes for animators and sprite poses. */
  acting: string
  expressions: CharacterExpression[]
  /** The expression a portrait uses when none is asked for: the face that sells who they are. */
  signatureExpression?: string
  /** How this character is drawn when the house style is not enough (Norb's cartoon grotesque). */
  caricature?: string
  /**
   * Danbooru-style identity tags for the tag-trained Illustrious lanes, which
   * read tags far better than prose. Identity and wardrobe only; no style.
   */
  tags?: string
  /** Never drawn this way, in any style. Merged into negative prompts. */
  never: string[]
  sprite: SpriteRig
  lora: LoraPlan
  /** Approved for the general edition's cast list and stage. */
  general: boolean
  /** One of the franchise's monster stars (series-bible grouping, pin-up art). */
  monsterStar?: boolean
  /**
   * An adult outside the monster-star roster who still gets mature, opt-in
   * pin-up art (the Brine daughters). Never set on a minor or a lead.
   */
  pinups?: boolean
  /**
   * Identity for pin-ups when the gameplay look differs (Laguna's 1974 glamour
   * versus her pregnant bayou present). Falls back to `identity`.
   */
  pinupIdentity?: string[]
  /** Short series-bible biography: who they are in the story. */
  bio?: string
  /** Running jokes and canon details a writer needs at hand. */
  canonNotes?: string[]
}

const BASE_EXPRESSIONS: CharacterExpression[] = [
  { id: 'neutral', prompt: 'neutral expression' },
  { id: 'smirk', prompt: 'knowing lopsided smirk' },
  { id: 'shock', prompt: 'comic double-take, eyes wide, jaw dropped' },
  { id: 'laugh', prompt: 'head thrown back laughing' },
  { id: 'annoyed', prompt: 'deadpan annoyed glare' },
]

function expressions(...extra: CharacterExpression[]): CharacterExpression[] {
  return [...BASE_EXPRESSIONS, ...extra]
}

function lora(trigger: string): LoraPlan {
  return {
    trigger,
    resourceName: null,
    status: 'dataset-needed',
    strength: 0.85,
  }
}

export const CHARACTER_MODELS: Record<MonstriqueCharacterId, CharacterModel> = {
  iris: {
    id: 'iris',
    name: 'Iris Quill',
    hotspots: [],
    speakerNames: ['Iris'],
    role: 'Player character: assistant, photographer, the only pair of hands at The Unwashed Truth',
    species: 'human woman',
    apparentAge: 'adult woman, about 30',
    silhouette:
      'a zaftig, curvy streetwise broad in a belted rose trench cinched at the waist, a big messy mane of jet-black hair with one white streak, a plaster on her neck and a press camera swinging on its strap',
    identity: [
      'adult human woman about 30, sassy streetwise broad with a warm open face',
      'zaftig full-figured hourglass: full bust, wide hips, thick thighs, a soft little belly; curvy and well-padded, not thin and not fat',
      'big messy shoulder-length jet-black hair with swept bangs and a single thick bold white streak from the front hairline',
      'bright wide curious eyes with smudged black winged eyeliner, arched expressive eyebrows, a wide crooked grin',
      'a flesh-coloured plaster on the side of her neck',
      'bold berry lipstick, big gold hoop earrings, chipped nail polish',
      'chunky vintage press camera with a flash bulb on a strap',
      'belted rose-and-plum trench coat over a black crop top and high-waisted pencil skirt',
    ],
    wardrobe:
      'rose-and-plum trench coat, black crop top, high-waisted pencil skirt, laddered fishnets, scuffed ankle boots, press pass clipped to the belt; a small retro logo tattoo on her lower back shows when she bends',
    acting:
      'Sassy, fearless and never sour: talks with her hands and her eyebrows, leans in close to anything strange, cracks wise with a grin, laughs at her own bad ideas and is first through the door anyway. Sharp tongue, open heart: she teases everyone and roots for all of them.',
    expressions: expressions(
      {
        id: 'sass',
        prompt:
          'one eyebrow cocked, wide crooked grin, mid-wisecrack, hand on hip',
      },
      {
        id: 'curious',
        prompt:
          'leaning in, eyes wide and bright, eyebrows up, lips parted in a delighted grin',
      },
      {
        id: 'brave',
        prompt: 'chin up, jaw set, eyes blazing, camera raised like a weapon',
      },
      {
        id: 'flirt',
        prompt: 'playful wink, one eyebrow raised, tongue in cheek',
      },
      { id: 'disgust', prompt: 'grimacing, elbow-deep in something wet' },
      { id: 'focus', prompt: 'squinting through the camera viewfinder' },
    ),
    signatureExpression: 'sass',
    never: [
      'schoolgirl',
      'damsel',
      'helpless pose',
      'teen',
      'mousy',
      'brown hair',
      'sleek bob',
      'cold aloof stare',
      'skinny',
      'thin',
      'model-thin waist',
      'obese',
      'bored expression',
    ],
    tags: '1girl, solo, mature female, black hair, streaked hair, white streak, medium hair, messy hair, swept bangs, wide eyes, eyeliner, raised eyebrow, grin, lipstick, hoop earrings, bandaid on neck, curvy, voluptuous, wide hips, thick thighs, trench coat, pink coat, belt, crop top, midriff, pencil skirt, fishnets, ankle boots, camera, holding camera, hand on hip, confident',
    sprite: {
      height: 1,
      heads: 5.2,
      build: 'curvy',
      skin: '#d9a48c',
      hair: '#121016',
      hairStyle: 'bob',
      outfit: '#a8466f',
      accent: '#141414',
      prop: 'camera',
      streak: '#f4f1ea',
      neckBandage: true,
    },
    lora: lora('mnstq_iris'),
    general: true,
    bio: 'Assistant, photographer and fixer at The Unwashed Truth, and the player. A sassy streetwise broad with a sharp tongue and an open heart: broke, bisexual, shameless, curious about everything, brave to a fault and extremely good at her job. She touches everything so Norb never has to.',
    canonNotes: [
      'Jet-black hair with a white streak since forever; she says it is natural, nobody believes her. Never brown, never a sleek bob (that is Draculina).',
      'Sassy, never mean: her insults come with a grin, and she is the first to stand up for anyone the franchise wronged.',
      'Running joke: the plaster on her neck. Her new boyfriend is a real necker and cannot get enough; every character has an opinion about it.',
      'A MONSTRIQUE logo tramp stamp from her high-school days: everybody at Midnight High got one. She rocked it, and still does.',
      'Flirts with Norb constantly; he stays 100% professional, files a half-hearted harassment complaint, and it turns into an argument about who holds power over whom in a class-based society.',
    ],
  },
  norb: {
    id: 'norb',
    name: 'Norbert “Norb” Vale',
    hotspots: ['nico'],
    speakerNames: ['Norb'],
    role: 'Iris’s boss, publisher of The Unwashed Truth, germophobe and deducer',
    species: 'human man',
    apparentAge: 'adult man, about 45',
    silhouette:
      'a little person barely waist-high to Iris: a Quasimodo hump and Igor stoop under a huge lumpy lopsided head, two mismatched bulging eyes, a MONSTRIQUE T-shirt and two raised yellow-gloved hands',
    identity: [
      'adult man with dwarfism, a little person about four feet tall, huge head, short bowed legs, stubby arms with oversized hands',
      'a big Quasimodo hump on one shoulder, Igor stoop, head thrust forward on no neck',
      'lumpy misshapen lopsided skull, sallow skin, stubble, almost no chin',
      'huge wide-open bulging eyes, the left eye much larger and set higher than the right, heavy drooping half-lowered eyelids over both, dark bags underneath: Peter-Lorre-style eyes',
      'enormous bulbous doorknob nose, wide froggy mouth with crooked buck teeth, nervous wheedling grin',
      'small round wire spectacles, the left lens thick and magnifying the big eye even bigger',
      'a few greasy strands combed over a bald lumpy scalp',
      'yellow latex gloves held up like a surgeon',
    ],
    caricature:
      'drawn as a rubbery 1990s TV cartoon caricature: squash-and-stretch, grotesque comic distortion, exaggerated takes, the ugliest face in the room',
    wardrobe:
      'an oversized hot-pink MONSTRIQUE convention T-shirt tucked into high-waisted rumpled grey trousers, a grey suit jacket too small for the hump, crooked bow tie over the T-shirt, galoshes: zero fashion sense',
    acting:
      'Shuffles like a lab assistant, wrings his gloved hands, recoils from every surface and gestures with his elbows. Stands at least two metres from anyone. His eyes do the acting: the big one bulges and swivels, the heavy lids droop when he is smug and fly open when he is horrified. 100% professional with Iris; his rebuffs are about germs, the case and workplace conduct, never about Iris being undesirable.',
    expressions: expressions(
      {
        id: 'unblinking',
        prompt:
          'staring unblinking, mismatched eyes bulging under heavy lids, a nervous wheedling grin',
      },
      {
        id: 'recoil',
        prompt:
          'recoiling in horror, eyes popping wide, gloved hands raised defensively',
      },
      {
        id: 'deduce',
        prompt:
          'one gloved finger raised, the big eye glinting through its thick lens, heavy-lidded and smug',
      },
    ),
    signatureExpression: 'unblinking',
    never: [
      'handsome',
      'tall',
      'muscular',
      'suave',
      'leading man',
      'romantic lead',
      'cute',
      'straight posture',
      'symmetrical face',
      'matching eyes',
      'opaque glasses',
      'average height',
      'young',
      'beard',
      'fantasy dwarf',
    ],
    tags: '1boy, solo, mature male, very short, hunchback, big head, ugly, lopsided face, bulging eyes, uneven eyes, droopy eyes, half-closed eyes, eye bags, big nose, buck teeth, stubble, bald, comb over, round eyewear, rubber gloves, yellow gloves, hands up, bow tie, pink shirt, t-shirt, suit jacket, grey pants, galoshes, caricature, cartoon, comedy',
    sprite: {
      height: 0.58,
      heads: 2.6,
      build: 'scrawny',
      skin: '#d9c09a',
      hair: '#4a3b2a',
      hairStyle: 'comb-over',
      outfit: '#e2468b',
      accent: '#f2d64b',
      prop: 'gloves',
      glasses: true,
      bigNose: true,
      hunch: true,
      shirt: 'MONSTRIQUE',
    },
    lora: lora('mnstq_norb'),
    general: true,
    bio: 'Midnight City’s premiere blogger and amateur sleuth, publisher of The Unwashed Truth. A little person, Quasimodo meets Igor with Peter Lorre’s eyes, drawn like a 1990s TV cartoon. Brilliant, touch-averse and all about the case.',
    canonNotes: [
      'Wears a MONSTRIQUE T-shirt: somebody handed it to him at the convention and wearing it was the easiest way to carry it. He has zero fashion sense.',
      'The comedy is his neuroses, his priorities and his eyes, never his height alone. He is the smartest person in every room and the boss.',
      '100% professional with Iris. After enough advances he half-heartedly accuses her of sexual harassment, which becomes a debate about whether an employee can hold power over her boss in a class-based society.',
      'Never a romance route. The finale pays off with an elbow bump.',
    ],
  },
  odette: {
    id: 'odette',
    name: 'Odette Harker',
    hotspots: ['odette-ghost'],
    speakerNames: ['Odette'],
    role: 'Monstrique’s agent, murdered, now a ghost and the client',
    species: 'human ghost',
    apparentAge:
      'adult woman; her ghost looks 35 because that is how she sees herself',
    silhouette:
      'a translucent silver-blue power suit with shoulder pads, a cigarette holder and a contract waved like a weapon',
    identity: [
      'adult woman ghost, translucent silver-blue glow',
      'sharp platinum chignon and arched painted brows',
      'cigarette holder and a fanned stack of contracts',
      'shoulder-padded power suit, diamond rings on every finger',
    ],
    wardrobe:
      'silver power suit, pearls, stilettos that float an inch above the carpet',
    acting:
      'Talks with her hands and her contracts. Keeps checking a mirror she no longer appears in. Takes ten percent of every scene.',
    expressions: expressions({
      id: 'scheme',
      prompt: 'narrowed eyes and a dealmaker’s cold smile',
    }),
    never: ['gore', 'wound', 'corpse in focus'],
    sprite: {
      height: 1,
      heads: 5.4,
      build: 'slim',
      skin: '#cfe3f4',
      hair: '#eef3f8',
      hairStyle: 'updo',
      outfit: '#9fb6d8',
      accent: '#ffffff',
      prop: 'contract',
      ghost: true,
    },
    lora: lora('mnstq_odette'),
    general: true,
  },
  violet: {
    id: 'violet',
    name: 'Violet Wisp',
    hotspots: ['violet-ghost'],
    speakerNames: ['Violet'],
    role: 'Professional companion hired as a vampire for one night, now a ghost and the sharpest witness',
    species: 'human ghost',
    apparentAge: 'adult woman, about 30',
    silhouette:
      'a lavender ghost in a rented high-collared satin vampire cape with plastic fangs',
    identity: [
      'adult woman ghost with a soft lavender glow',
      'a black costume wig in a sharp bob, slightly askew',
      'rented red-and-black satin vampire cape with a stand-up collar',
      'cheap plastic vampire fangs',
      'wry, observant, professional eyes',
    ],
    wardrobe:
      'satin cape over a little black dress, fishnets, one shoe missing',
    acting:
      'Counts the exits. Arms folded, one hip out, unimpressed by both the afterlife and her client. Every joke is about the job, never about her.',
    expressions: expressions({
      id: 'deadpan',
      prompt: 'flat professional deadpan, one eyebrow up',
    }),
    never: ['victim pose', 'gore', 'degrading pose'],
    sprite: {
      height: 0.98,
      heads: 5.4,
      build: 'curvy',
      skin: '#e3d4f2',
      hair: '#1a1424',
      hairStyle: 'bob',
      outfit: '#2a1830',
      accent: '#b3263b',
      prop: 'cape',
      ghost: true,
    },
    lora: lora('mnstq_violet'),
    general: true,
  },
  marta: {
    id: 'marta',
    name: 'Marta',
    hotspots: ['marta'],
    speakerNames: ['Marta'],
    role: 'Night manager of the Last Call Motor Lodge since 1965',
    species: 'human-presenting woman',
    apparentAge: 'adult woman who looks about 60',
    silhouette:
      'a headscarf, big dark glasses, opera gloves and a thick layer of foundation, always carrying an ice bucket',
    identity: [
      'adult woman who looks about 60',
      'silk headscarf tied under the chin',
      'oversized dark sunglasses, heavy matte foundation',
      'elbow-length gloves',
    ],
    wardrobe:
      'cardigan over a 1960s shift dress, key ring on a lanyard, ice bucket',
    acting:
      'Dry, unhurried, never quite where you left her. Leans on the counter like she owns the decade.',
    expressions: expressions(),
    never: ['visible face under the makeup', 'villain framing'],
    sprite: {
      height: 0.95,
      heads: 5,
      build: 'stout',
      skin: '#e8b996',
      hair: '#7d2f3a',
      hairStyle: 'scarf',
      outfit: '#4e6b5c',
      accent: '#c9c2b4',
      prop: 'ice-bucket',
      glasses: true,
    },
    lora: lora('mnstq_marta'),
    general: true,
  },
  dolores: {
    id: 'dolores',
    name: 'Dolores',
    hotspots: ['neighbor'],
    speakerNames: ['Dolores'],
    role: 'Retired Monstrique superfan in Room 204',
    species: 'human woman',
    apparentAge: 'adult woman, 74',
    silhouette:
      'pink curlers, a quilted housecoat and a remote control aimed like a pistol',
    identity: [
      'adult woman, 74, cheerful and nosy',
      'pink foam hair curlers and cat-eye glasses on a chain',
      'quilted housecoat covered in Monstrique pins',
    ],
    wardrobe: 'quilted housecoat, fuzzy slippers, fan-club pins',
    acting: 'Rehearsed gossip. Presses her ear to the wall mid-sentence.',
    expressions: expressions(),
    never: ['frail', 'pitiable'],
    sprite: {
      height: 0.88,
      heads: 4.4,
      build: 'stout',
      skin: '#f0c9ae',
      hair: '#d7d0e2',
      hairStyle: 'curls',
      outfit: '#e78fb3',
      accent: '#ffd4e4',
      prop: 'remote',
      glasses: true,
    },
    lora: lora('mnstq_dolores'),
    general: true,
  },
  gavin: {
    id: 'gavin',
    name: 'Gavin',
    hotspots: ['gavin'],
    speakerNames: ['Gavin'],
    role: 'The creepy fan with the telephoto lens. Not the killer; still reported.',
    species: 'human man',
    apparentAge: 'adult man, about 35',
    silhouette:
      'a hunched windbreaker behind a telephoto lens longer than his arm',
    identity: [
      'adult man about 35, greasy hair, patchy stubble',
      'enormous telephoto lens camera',
      'windbreaker covered in Monstrique convention lanyards',
    ],
    wardrobe: 'windbreaker, cargo shorts in the rain, socks with sandals',
    acting:
      'Skulks, then over-explains. Never framed as sympathetic or romantic.',
    expressions: expressions(),
    never: ['heroic', 'charming'],
    sprite: {
      height: 0.97,
      heads: 4.6,
      build: 'scrawny',
      skin: '#e2bfa0',
      hair: '#3c3a33',
      hairStyle: 'cap',
      outfit: '#3f5b73',
      accent: '#c7d63e',
      prop: 'long-lens',
    },
    lora: lora('mnstq_gavin'),
    general: true,
  },
  pip: {
    id: 'pip',
    name: 'Pip',
    hotspots: [],
    speakerNames: ['Pip'],
    role: 'Maintenance man who logs every clank of the ice machine like poetry',
    species: 'human man',
    apparentAge: 'adult man, about 50',
    silhouette: 'overalls, a wrench and a clipboard of clank-poems',
    identity: [
      'adult man about 50, walrus moustache',
      'stained overalls with a name patch reading PIP',
      'wrench in one hand, clipboard in the other',
    ],
    wardrobe: 'overalls, flannel, tool belt',
    acting:
      'Talks to the ice machine tenderly. Reads his log aloud like a sonnet.',
    expressions: expressions(),
    never: [],
    sprite: {
      height: 0.92,
      heads: 4.4,
      build: 'stout',
      skin: '#d9a982',
      hair: '#6a6056',
      hairStyle: 'cap',
      outfit: '#4f6aa0',
      accent: '#e0e0e0',
      prop: 'wrench',
    },
    lora: lora('mnstq_pip'),
    general: true,
  },
  cleo: {
    id: 'cleo',
    name: 'Cleo Pappatra',
    hotspots: ['mummy-actress'],
    speakerNames: ['Cleo'],
    role: 'Living mummy, original-era Monstrique icon and elder fashion monarch',
    species: 'living mummy',
    apparentAge: 'mature woman, visibly one of the oldest in the cast',
    silhouette:
      'an elegant column of aged linen bandages under a gold collar and a towering headdress',
    identity: [
      'mature adult living mummy woman, dignified and visibly older',
      'authentic aged linen bandage anatomy with a richly expressive face',
      'broad gold-and-lapis collar, hieroglyphic jewellery',
      'couture gown cut from vintage linen',
    ],
    wardrobe:
      'couture linen gown, gold collar, kohl-lined eyes, signing pen like a sceptre',
    acting:
      'Moves slowly enough to terrify people. Dry, erudite, has survived every trend twice.',
    expressions: expressions(),
    never: [
      'young pin-up',
      'generic human model with a bandage accessory',
      'decayed horror corpse',
    ],
    sprite: {
      height: 1.02,
      heads: 5.6,
      build: 'slim',
      skin: '#d8c7a2',
      hair: '#1f3f78',
      hairStyle: 'bandage',
      outfit: '#e7dcc0',
      accent: '#d4a72c',
      prop: 'pen',
    },
    lora: lora('mnstq_cleo'),
    general: true,
    monsterStar: true,
  },
  draculina: {
    id: 'draculina',
    name: 'Countess Draculina',
    hotspots: [],
    speakerNames: ['Draculina'],
    role: 'Charter Monstrique vampire star and queen bee of the franchise',
    species: 'vampire',
    apparentAge: 'ancient adult vampire who looks about 20, emphatically adult',
    silhouette:
      'a razor-sharp black bob, porcelain skin and an immaculate high-collared 1960s starlet coat',
    identity: [
      'adult vampire woman who looks about 20, poised and emphatically adult',
      'glossy razor-sharp black bob',
      'porcelain-pale skin, dark eyes, striking fangs',
      'immaculate high-collared 1960s starlet coat over a fitted dress',
    ],
    wardrobe:
      'tailored coat with a stand-up collar, gloves, a single blood-red brooch',
    acting:
      'Sweet as poisoned cake. Compliments that insult. Never cartoonishly incompetent.',
    expressions: expressions({
      id: 'sweet',
      prompt: 'sugar-sweet smile that does not reach the eyes',
    }),
    never: ['child', 'schoolgirl', 'school uniform', 'classroom'],
    sprite: {
      height: 0.94,
      heads: 5.6,
      build: 'slim',
      skin: '#f4eef0',
      hair: '#0d0a12',
      hairStyle: 'bob',
      outfit: '#1d1424',
      accent: '#c4122f',
      prop: 'none',
    },
    lora: lora('mnstq_draculina'),
    general: false,
    monsterStar: true,
  },
  siobhan: {
    id: 'siobhan',
    name: 'Siobhan MacRae',
    hotspots: [],
    speakerNames: ['Siobhan'],
    role: 'Scottish werewolf pop veteran from The Pack',
    species: 'werewolf',
    apparentAge: 'adult woman, early-to-mid 20s in appearance',
    silhouette:
      'wild shaggy hair merging into fur, wolf ears, a big leather collar and tartan stagewear',
    identity: [
      'adult werewolf woman with an unmistakable wolf muzzle and fangs',
      'shaggy textured hair merging into fur, tall wolf ears',
      'big studded leather collar',
      'tartan and leather layered pop-punk stagewear',
    ],
    wardrobe:
      'tartan mini kilt, ripped band tee, leather collar, platform boots',
    acting: 'Bouncy, loud, loyal until betrayed. Real musical chops.',
    expressions: expressions(),
    never: ['human face with ears only', 'child'],
    sprite: {
      height: 0.96,
      heads: 5,
      build: 'slim',
      skin: '#a8825e',
      hair: '#7a4a2a',
      hairStyle: 'wolf',
      outfit: '#a52a35',
      accent: '#2d6a3e',
      prop: 'mic',
    },
    lora: lora('mnstq_siobhan'),
    general: false,
    monsterStar: true,
  },
  nyx: {
    id: 'nyx',
    name: 'Nyx Sable',
    hotspots: [],
    speakerNames: ['Nyx'],
    role: 'Were-panther choreographer and Siobhan’s frenemy',
    species: 'were-panther',
    apparentAge: 'adult woman, mid 20s in appearance',
    silhouette: 'a sleek panther head and tail in angular avant-pop tailoring',
    identity: [
      'adult were-panther woman with an unmistakable sleek panther head and ears',
      'dark rosette-spotted fur that catches the light, feline tail',
      'angular avant-pop tailored stage outfit',
    ],
    wardrobe: 'asymmetric black tailoring, chrome accents',
    acting: 'Precise, controlled, generous in secret.',
    expressions: expressions(),
    never: ['human face with painted spots'],
    sprite: {
      height: 1,
      heads: 5.4,
      build: 'slim',
      skin: '#2a2530',
      hair: '#17141c',
      hairStyle: 'panther',
      outfit: '#14121a',
      accent: '#b9c2cc',
      prop: 'none',
    },
    lora: lora('mnstq_nyx'),
    general: false,
    monsterStar: true,
  },
  albina: {
    id: 'albina',
    name: 'Albina “Allie Gator”',
    hotspots: [],
    speakerNames: ['Albina', 'Allie'],
    role: 'Erased 1963 founding Monstrique star living in the sewers',
    species: 'giant albino alligator',
    apparentAge: 'mature adult, an aging old-Hollywood star',
    silhouette:
      'over six feet of upright pale alligator with a long snout, a huge tail, a satin dressing gown and a rhinestone crown',
    identity: [
      'giant upright adult albino alligator woman with true crocodilian anatomy',
      'long pale snout, heavy jaw, pink eyes, bright lipstick',
      'huge tail and clawed hands',
      'aging satin dressing gown, moth-eaten stole, pearls, rhinestone crown',
    ],
    wardrobe: 'satin dressing gown, feather stole, pearls, crown',
    acting:
      'Operatic, haughty, then heartbreaking. Performs to an empty chair. The joke is her self-mythology, never her body.',
    expressions: expressions(),
    never: ['human face', 'dainty nose', 'pin-up human body'],
    sprite: {
      height: 1.2,
      heads: 4.2,
      build: 'towering',
      skin: '#eee9dc',
      hair: '#eee9dc',
      hairStyle: 'snout',
      outfit: '#d8a6c4',
      accent: '#f0e6a8',
      prop: 'stole',
    },
    lora: lora('mnstq_albina'),
    general: false,
    monsterStar: true,
  },
  roxie: {
    id: 'roxie',
    name: 'Roxie Lupin',
    hotspots: [],
    speakerNames: ['Roxie'],
    role: 'The original 1960s werewolf action star; still has it',
    species: 'werewolf',
    apparentAge: 'adult woman who looks in her forties',
    silhouette:
      'a brawny wolf woman with a huge 1960s bouffant and a motorcycle jacket',
    identity: [
      'adult werewolf woman in her forties with brown fur, a true wolf snout and fangs',
      'pointed wolf ears poking through a voluminous 1960s bouffant',
      'broad shoulders, a confident action-star grin',
    ],
    wardrobe:
      'leather motorcycle jacket, capri pants, a silk headscarf knotted at the throat',
    acting:
      'Swaggers, laughs from the belly, and has done all her own stunts since 1964.',
    expressions: expressions(),
    never: ['human face with ears only', 'child'],
    sprite: {
      height: 1.05,
      heads: 5,
      build: 'stout',
      skin: '#8a5a3a',
      hair: '#5a3620',
      hairStyle: 'wolf',
      outfit: '#2a2a2e',
      accent: '#c9a227',
      prop: 'none',
    },
    lora: lora('mnstq_roxie'),
    general: false,
    monsterStar: true,
    bio: 'Founding 1964 werewolf star who never left the line-up. Advises the Pack; wants her stolen prop knife back from Gavin.',
  },
  laguna: {
    id: 'laguna',
    name: 'Laguna Brine',
    hotspots: [],
    speakerNames: ['Laguna'],
    role: 'Lagoon creature star pushed out in 1974; since 2017 a licensed look-alike wears her name on stage while she raises a brood on the bayou',
    species: 'amphibian (frog and salamander)',
    apparentAge: 'mature adult woman in her fifties',
    silhouette:
      'a big heavyset, heavily pregnant green-and-gold amphibian in a cut-down gold sequin robe, feathery pink gills, a garden hose in one webbed hand',
    identity: [
      'mature adult lagoon creature woman with true frog and salamander anatomy, big and heavyset, heavily pregnant',
      'slick green-and-gold skin, feathery pink external gills, head frills',
      'wide golden amphibian eyes, a wry tired smile, webbed hands and feet',
      'her faded 1974 gold-sequin fishtail gown cut down into a house robe over a tank top, flip-flops',
    ],
    pinupIdentity: [
      'adult lagoon creature woman in her 1974 prime, true frog and salamander anatomy',
      'slick green-and-gold skin, feathery pink external gills, head frills',
      'wide golden amphibian eyes and webbed hands',
      'a sequinned gold fishtail gown and pearls',
    ],
    wardrobe:
      'the 1974 gold-sequin gown cut down into a house robe, a tank top, flip-flops on webbed feet, a beat-up porch guitar',
    acting:
      'Languid, wry and warm, with a slow Southern drawl. Sprays herself with the garden hose mid-sentence, rests a guitar on the bump, and remembers every clause of every contract she ever signed.',
    expressions: expressions({
      id: 'wry',
      prompt: 'heavy-lidded wry smile, one webbed hand on her belly',
    }),
    signatureExpression: 'wry',
    never: [
      'human woman in green paint',
      'mermaid tail',
      'thin',
      'mocking body',
    ],
    sprite: {
      height: 0.98,
      heads: 4.8,
      build: 'stout',
      skin: '#5f9e6e',
      hair: '#e48aa8',
      hairStyle: 'frill',
      outfit: '#c9a227',
      accent: '#2f6f7a',
      prop: 'none',
    },
    lora: lora('mnstq_laguna'),
    general: false,
    monsterStar: true,
    bio: 'The best songwriter Monstrique ever had. Pushed out in 1974 for wanting to write instead of pose; Odette sold her face to Lagoon Lass Fish Sticks and, from 2017, to a licensed look-alike who tours as "Laguna". The real one lives in a stilted single-wide at Brine Bottoms with a kiddie pool of tadpoles and every stage of kid up to a sullen teen. Her skin dries out away from water.',
    canonNotes: [
      'Her face is on every box of Lagoon Lass Fish Sticks. She never saw a royalty. The kids eat them because they are cheap and call the box "Mama".',
      'The baby daddy, Earl, is always "out on the boat".',
      'Her weight and pregnancy are her design, never the joke. The joke is the agent who got rich off her face.',
      'Her children and teen are never in flirt, gratitude, pin-up or mature content. Her adult daughters Delta and Cherie have their own sheets.',
    ],
  },
  francesca: {
    id: 'francesca',
    name: 'Francesca Stein',
    hotspots: ['francesca'],
    speakerNames: ['Francesca'],
    role: 'Stitched scientist-actress who built the Hexblades; cut in 1964, rehired in 1974',
    species: 'reanimated stitched woman',
    apparentAge: 'adult woman',
    silhouette:
      'a towering black beehive with white lightning streaks over pale green patchwork skin',
    identity: [
      'adult stitched woman with pale green patchwork skin and neat surgical stitches',
      'small neck bolts',
      'a towering black beehive with white lightning streaks',
    ],
    wardrobe:
      'a lab coat over a 1960s cocktail dress, safety goggles pushed up',
    acting: 'Brilliant, impatient, talks with a soldering iron in her hand.',
    expressions: expressions(),
    never: ['gore', 'corpse'],
    sprite: {
      height: 1.04,
      heads: 5.2,
      build: 'slim',
      skin: '#b7cdb0',
      hair: '#141414',
      hairStyle: 'beehive',
      outfit: '#f1f1ec',
      accent: '#7a2a8a',
      prop: 'none',
      streak: '#ffffff',
    },
    lora: lora('mnstq_francesca'),
    general: true,
    monsterStar: true,
    bio: 'Wrote the science-themed stage props for Beach Hex and made the five Hexblades. Runs a midnight science-cinema on Bolt Street and wants credit for her props.',
    canonNotes: [
      'Chapter Two (Beach Hex) is hers: the 1964 reel, her unpaid prop invoice and the sleeve her face was scratched off. She ends it with "I made five knives."',
      'Her grudge: Odette sold her Hexblade drawings as replica letter openers in 1999. Her flirt payoff (the coil kiss) is mature-edition only; her general-edition lines stay prickly and proud.',
    ],
  },
  clem: {
    id: 'clem',
    name: 'Clem',
    hotspots: ['clem'],
    speakerNames: ['Clem'],
    role: 'Night projectionist at the Starlite Drive-In since 1964, keeper of the reels',
    species: 'human man',
    apparentAge: 'adult man who looks about 80',
    silhouette:
      'a stooped wiry old man with a white pompadour, hugging a big silver film reel',
    identity: [
      'wiry stooped adult man about eighty',
      'proud white pompadour, thick black-rimmed glasses, bushy eyebrows',
      'a toothpick in the corner of his mouth and a projector-light squint',
    ],
    wardrobe:
      'teal bowling shirt printed with film reels, brown cardigan, baggy trousers, tartan carpet slippers, flashlight on the belt',
    acting:
      'Cranky and sentimental. Cradles reels like babies, squints sideways at anyone near the carbon rods.',
    expressions: expressions(),
    never: ['frail', 'pitiable', 'villain framing'],
    sprite: {
      height: 0.9,
      heads: 4.6,
      build: 'scrawny',
      skin: '#e6c2a4',
      hair: '#f2f2ee',
      hairStyle: 'comb-over',
      outfit: '#2f8a8a',
      accent: '#7a5636',
      prop: 'none',
      glasses: true,
    },
    lora: lora('mnstq_clem'),
    general: true,
    bio: 'Has threaded the Starlite’s projectors since he was sixteen, the summer they shot Beach Hex on the beach outside. Kept the 1964 reel the sponsor pulled.',
  },
  deedee: {
    id: 'deedee',
    name: 'Dee Dee',
    hotspots: ['deedee'],
    speakerNames: ['Dee Dee'],
    role: 'Bat-woman carhop at the Starlite snack bar and the beach’s best gossip',
    species: 'bat woman',
    apparentAge: 'adult woman who looks about 25',
    silhouette:
      'big pointed bat ears, small folded wings and roller skates, a tray of floats held high',
    identity: [
      'adult bat-woman about twenty-five with lilac-grey fur at her temples',
      'big pointed bat ears, little upturned bat nose, two tiny fangs',
      'small leathery wings folded at her back',
    ],
    wardrobe:
      '1960s carhop uniform: teal knee-length dress, pink apron, paper soda-jerk cap, name badge, white roller skates',
    acting:
      'Bubbly and nosy. Leans in with a hand cupped by her mouth, spins on her skates mid-sentence.',
    expressions: expressions(),
    never: ['scary', 'feral', 'childlike'],
    sprite: {
      height: 0.96,
      heads: 5,
      build: 'slim',
      skin: '#c9b8d6',
      hair: '#8f7fa3',
      hairStyle: 'cap',
      outfit: '#2fa6a0',
      accent: '#ff8fb8',
      prop: 'none',
    },
    lora: lora('mnstq_deedee'),
    general: true,
    bio: 'Works the Starlite snack bar on skates. Her Aunt Bea scratched one face off every 1964 Beach Hex sleeve at the pressing plant, by order of the sponsor.',
  },
  vespa: {
    id: 'vespa',
    name: 'Dr. Vespa Vane',
    hotspots: [],
    speakerNames: ['Vespa'],
    role: 'Fly-woman star of the 1980s and 1990s, now a late-night television icon',
    species: 'anthropomorphic fly',
    apparentAge: 'adult woman',
    silhouette:
      'a genuine fly head with huge red compound eyes, antennae and shimmering wings',
    identity: [
      'adult fly woman with a genuine fly head',
      'huge iridescent red compound eyes, antennae, small mandibles',
      'shimmering translucent wings',
    ],
    wardrobe: 'a chrome 1980s power suit with shoulder pads',
    acting:
      'Eccentric, brilliant, hyper-observant, rubs her hands together when she has a theory.',
    expressions: expressions(),
    never: ['human face with antennae only'],
    sprite: {
      height: 0.98,
      heads: 4.8,
      build: 'slim',
      skin: '#3b4a3a',
      hair: '#2b2b2b',
      hairStyle: 'antennae',
      outfit: '#b9c2cc',
      accent: '#c41e3a',
      prop: 'none',
    },
    lora: lora('mnstq_vespa'),
    general: false,
    monsterStar: true,
    bio: 'Joined in 1986, smeared out in 2006 by a leaked interview. Wants a date who can hold eye contact (Norb’s spare glasses).',
  },
  blobzo: {
    id: 'blobzo',
    name: 'Blobzo',
    hotspots: [],
    speakerNames: ['Blobzo'],
    role: 'Slime creature star of 1994 to 2017, now an independent online creator',
    species: 'slime creature',
    apparentAge: 'adult woman',
    silhouette:
      'a wobbling translucent pink goo body with bubbles drifting inside',
    identity: [
      'cheerful adult slime creature with a translucent pink gelatinous body',
      'bubbles drifting inside her, dripping edges that hold a womanly shape',
      'big glossy cartoon eyes floating near the top of her goo, a wide happy mouth',
    ],
    wardrobe:
      'a pair of heart-shaped sunglasses and a choker that keeps sinking in',
    acting: 'Bubbly, unpredictable, puddles when she laughs.',
    expressions: expressions(),
    never: ['glossy woman in a slime costume'],
    sprite: {
      height: 0.92,
      heads: 4.2,
      build: 'stout',
      skin: '#f38bbf',
      hair: '#f38bbf',
      hairStyle: 'goo',
      outfit: '#f38bbf',
      accent: '#ffd1e8',
      prop: 'none',
      ghost: false,
    },
    lora: lora('mnstq_blobzo'),
    general: false,
    monsterStar: true,
    bio: 'Idol executives called her unmarketable in 2017; her fans disagree loudly. Wants one night solid (motel ice).',
  },
  delta: {
    id: 'delta',
    name: 'Delta Brine',
    hotspots: [],
    speakerNames: ['Delta'],
    role: 'Laguna’s eldest daughter: airboat captain, bait-shop owner and Iris’s guide on the bayou',
    species: 'half-amphibian woman',
    apparentAge: 'adult woman, about 27',
    silhouette:
      'a strong, curvy half-amphibian woman in grease-stained coveralls tied at the waist, gill frills behind her ears, an airboat pole over one shoulder',
    identity: [
      'adult half-amphibian woman about 27, strong and curvy',
      'green-tinged freckled skin, short pink gill frills behind her ears, wide golden eyes, webbed fingers',
      'messy auburn-green hair tied up in a bandana',
      'grease-stained coveralls tied at the waist over a white tank top, rubber boots',
    ],
    wardrobe:
      'grease-stained coveralls tied at the waist, white tank top, rubber boots, bandana, a pocketknife and a bait bucket',
    acting:
      'Deadpan, competent and protective of her family. Fixes the airboat while she talks, never wastes a word, and warms up to Iris one solved problem at a time.',
    expressions: expressions({
      id: 'deadpan',
      prompt: 'flat deadpan stare, one eyebrow barely raised',
    }),
    signatureExpression: 'deadpan',
    never: ['child', 'teen', 'petite', 'human woman with no amphibian traits'],
    tags: '1girl, solo, mature female, monster girl, amphibian girl, green skin, freckles, gills, yellow eyes, webbed hands, auburn hair, bandana, tank top, coveralls, clothes around waist, rubber boots, curvy, muscular female, swamp, airboat',
    sprite: {
      height: 1.02,
      heads: 5.2,
      build: 'curvy',
      skin: '#9cc08a',
      hair: '#7a4a2a',
      hairStyle: 'scarf',
      outfit: '#5a6b7a',
      accent: '#f1f1ec',
      prop: 'wrench',
    },
    lora: lora('mnstq_delta'),
    general: false,
    pinups: true,
    bio: 'Runs Brine Bottoms Airboat Tours and Bait out of a shed by the dock. The family’s fixer: she knows every channel, every gator and every debt Odette left them.',
    canonNotes: [
      'Helps Iris with the boat and swamp puzzles; her gratitude opens a shortcut through the bayou, never a required clue.',
    ],
  },
  cherie: {
    id: 'cherie',
    name: 'Cherie Brine',
    hotspots: [],
    speakerNames: ['Cherie'],
    role: 'Laguna’s second daughter: waitress at the Gator Bait Bar & Grill and the bayou’s biggest flirt',
    species: 'half-amphibian woman',
    apparentAge: 'adult woman, about 23',
    silhouette:
      'a bombshell half-amphibian woman with big teased hair and frills, a knotted plaid shirt, denim cutoffs and cowboy boots',
    identity: [
      'adult half-amphibian woman about 23, a curvy bombshell',
      'green-tinged skin with gold speckles, pink frills fanning from big teased honey-blonde hair, wide golden eyes, webbed fingers',
      'bright glossy pink lips, a big flirty grin',
      'knotted red plaid shirt, denim cutoff shorts, cowboy boots',
    ],
    wardrobe:
      'knotted red plaid shirt, denim cutoffs, cowboy boots, a name tag from the Gator Bait Bar & Grill, an order pad',
    acting:
      'Flirts with everybody, Iris and Norb included, and means about half of it. Loud, sweet and quicker than she lets on; she hears every bit of gossip that crosses the bar.',
    expressions: expressions({
      id: 'flirt',
      prompt: 'big flirty grin, a wink, hip cocked',
    }),
    signatureExpression: 'flirt',
    never: ['child', 'teen', 'petite', 'human woman with no amphibian traits'],
    tags: '1girl, solo, mature female, monster girl, amphibian girl, green skin, gills, head fins, yellow eyes, webbed hands, blonde hair, big hair, pink lips, grin, wink, plaid shirt, tied shirt, midriff, denim shorts, cutoffs, cowboy boots, curvy, large breasts, wide hips',
    sprite: {
      height: 1,
      heads: 5.2,
      build: 'curvy',
      skin: '#a7c98f',
      hair: '#e3b85a',
      hairStyle: 'curls',
      outfit: '#b8322f',
      accent: '#3b5b8a',
      prop: 'pen',
    },
    lora: lora('mnstq_cherie'),
    general: false,
    pinups: true,
    bio: 'Waits tables at the Gator Bait Bar & Grill and hears everything. Wants out of the bayou and onto a stage, like Mama before the agent.',
    canonNotes: [
      'Flirt and gratitude routes in the mature edition; adults only, opt-in. Her gossip is a second route to the 2017 look-alike contract.',
    ],
  },
}

export const CHARACTER_IDS = Object.keys(
  CHARACTER_MODELS,
) as MonstriqueCharacterId[]

export function modelForHotspot(hotspotId: string): CharacterModel | null {
  return (
    CHARACTER_IDS.map((id) => CHARACTER_MODELS[id]).find((model) =>
      model.hotspots.includes(hotspotId),
    ) ?? null
  )
}

/**
 * The character speaking a printed engine line, read from its leading
 * `Name:` tag. Narration and untagged lines return null.
 */
export function speakerOf(line: string): CharacterModel | null {
  const match = /^\s*([A-Z][A-Za-z]+(?: [A-Z][A-Za-z]+)?):/.exec(line)
  if (!match) return null
  const name = match[1]
  return (
    CHARACTER_IDS.map((id) => CHARACTER_MODELS[id]).find((model) =>
      model.speakerNames.includes(name!),
    ) ?? null
  )
}

export function expressionPrompt(
  model: CharacterModel,
  expressionId = 'neutral',
): string {
  return (
    model.expressions.find((entry) => entry.id === expressionId)?.prompt ??
    BASE_EXPRESSIONS[0]!.prompt
  )
}

/**
 * The shots a style-neutral identity LoRA is trained on. Neutral model-sheet
 * renders teach the LoRA who someone is, not how a style paints them, so the
 * same LoRA can be stacked with the 2D, pixel and 3D styles later.
 */
export const LORA_DATASET_SHOTS = [
  {
    id: 'turn-front',
    framing: 'full body',
    view: 'front view',
    pose: 'neutral A-pose',
  },
  {
    id: 'turn-three-quarter',
    framing: 'full body',
    view: 'three-quarter view',
    pose: 'relaxed standing pose',
  },
  {
    id: 'turn-profile',
    framing: 'full body',
    view: 'side profile view',
    pose: 'standing',
  },
  {
    id: 'turn-back',
    framing: 'full body',
    view: 'back view',
    pose: 'standing',
  },
  {
    id: 'bust-front',
    framing: 'head and shoulders',
    view: 'front view',
    pose: 'portrait',
  },
  {
    id: 'bust-three-quarter',
    framing: 'head and shoulders',
    view: 'three-quarter view',
    pose: 'portrait',
  },
  {
    id: 'action-walk',
    framing: 'full body',
    view: 'three-quarter view',
    pose: 'mid-stride walk cycle key pose',
  },
  {
    id: 'action-point',
    framing: 'full body',
    view: 'front view',
    pose: 'pointing at something off-screen',
  },
  {
    id: 'action-sit',
    framing: 'full body',
    view: 'three-quarter view',
    pose: 'sitting on a motel chair',
  },
  {
    id: 'action-prop',
    framing: 'three-quarter body',
    view: 'three-quarter view',
    pose: 'using their signature prop',
  },
] as const

export type LoraShotId = (typeof LORA_DATASET_SHOTS)[number]['id']
