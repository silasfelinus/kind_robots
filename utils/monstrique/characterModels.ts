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
  /** Height relative to Iris (1). Norb is 4'11", Albina is over six feet of gator. */
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
  /** Never drawn this way, in any style. Merged into negative prompts. */
  never: string[]
  sprite: SpriteRig
  lora: LoraPlan
  /** Approved for the general edition's cast list and stage. */
  general: boolean
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
      'tall and leggy with a belted trench coat flaring at the knee and a chunky press camera on a strap',
    identity: [
      'adult human woman about 30',
      'tousled auburn bob with one stubborn curl over her eye',
      'freckles, bold red lipstick, mischievous green eyes',
      'chunky vintage press camera with a flash bulb on a strap',
      'belted mustard trench coat over a black turtleneck and pencil skirt',
    ],
    wardrobe:
      'mustard trench coat, black turtleneck, pencil skirt, scuffed ankle boots, press pass clipped to the belt',
    acting:
      'Leads with her hips and her camera. Leans on things Norb would never touch. Winks at the audience after every bad idea, then commits to it anyway.',
    expressions: expressions(
      { id: 'flirt', prompt: 'playful half-lidded wink, one eyebrow raised' },
      { id: 'disgust', prompt: 'grimacing, elbow-deep in something wet' },
      { id: 'focus', prompt: 'squinting through the camera viewfinder' },
    ),
    never: ['schoolgirl', 'damsel', 'helpless pose', 'teen'],
    sprite: {
      height: 1,
      heads: 5.2,
      build: 'curvy',
      skin: '#f1c7a8',
      hair: '#b4532a',
      hairStyle: 'bob',
      outfit: '#c99a2e',
      accent: '#141414',
      prop: 'camera',
    },
    lora: lora('mnstq_iris'),
    general: true,
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
      'four foot eleven, an oversized head on a scrawny hunched body, huge round glasses and two raised gloved hands',
    identity: [
      'very short adult man, four foot eleven, oversized head',
      'enormous bulbous doorknob nose and slight buck teeth',
      'thick round coke-bottle glasses magnifying nervous eyes',
      'thinning comb-over plastered flat',
      'yellow latex gloves held up like a surgeon',
    ],
    wardrobe:
      'rumpled brown suit one size too big, crooked bow tie, pocket square used as a sneeze guard, galoshes',
    acting:
      'Recoils from every surface. Gestures with his elbows. Stands at least two metres from anyone. His rebuffs are about germs and the case, never about Iris being undesirable.',
    expressions: expressions(
      {
        id: 'recoil',
        prompt: 'recoiling in horror, gloved hands raised defensively',
      },
      {
        id: 'deduce',
        prompt: 'one gloved finger raised, glasses glinting, smug',
      },
    ),
    never: [
      'handsome',
      'tall',
      'muscular',
      'suave',
      'leading man',
      'romantic lead',
    ],
    sprite: {
      height: 0.68,
      heads: 3.2,
      build: 'scrawny',
      skin: '#e8c4a0',
      hair: '#4a3b2a',
      hairStyle: 'comb-over',
      outfit: '#6d4c35',
      accent: '#f2d64b',
      prop: 'gloves',
      glasses: true,
      bigNose: true,
    },
    lora: lora('mnstq_norb'),
    general: true,
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
  const match = /^\s*([A-Z][A-Za-z]+):/.exec(line)
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
