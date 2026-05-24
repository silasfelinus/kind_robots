// stores/helpers/adventureCards.ts
//
// Card definitions for the Adventure Character Builder.
// Tone: Disco Elysium meets Douglas Adams.
// The sheet is sentient, mildly exasperated, and rooting for you.

// ── Types ──────────────────────────────────────────────────────────────────

export type AdventureInputType =
  | 'preset'
  | 'text'
  | 'long'
  | 'stats'
  | 'reward'
  | 'list'
  | 'art'

export type PresetChoice = {
  value: string
  label: string
  subtext?: string
  image?: string
  opensCustom?: boolean
  opensList?: boolean
  listOptions?: string[]
}

export type AdventureStep = {
  key: string
  title: string
  narrative: string
  inputType: AdventureInputType
  field?: string
  choices?: PresetChoice[]
  listOptions?: string[]
  generatorKey?: string
  placeholder?: string
  inputLabel?: string
  heroImage?: string
  needsLLM?: boolean
  appendSuggest?: boolean
}

export type AdventureCard = {
  key: string
  label: string
  title: string
  icon: string
  flourish: string
  deckImage: string
  heroImage: string
  tagline: string
  narrative: string
  required?: boolean
  rewardSlotKey?: string
  restoresFields: string[]
  unlockCondition?: 'always' | 'coreComplete' | 'allComplete'
  steps: AdventureStep[]
}

// ── Extended lists (shown after gallery via opensList) ─────────────────────

const EXTENDED_GENRES: string[] = [
  'Bureaucratic Fantasy',
  'Academic Eldritch',
  'Municipal Necromancy',
  'Wilderness Bureaucracy',
  'Diplomatic Thriller',
  'Archive Horror',
  'Revolutionary Pastoral',
  'Bog Punk',
  'Culinary Horror',
  'Geological Romance',
  'Siege Comedy',
  'Tender Apocalypse',
  'Haunted Procedural',
  'Existential Swashbuckling',
  'Heist Mythology',
  'Maritime Mystery',
  'Pastoral Apocalypse',
  'Isekai (reluctant)',
  'Slice of Life (complicated)',
  'Shonen (aging protagonist)',
  'Magical Girl (retired)',
  'Mecha Opera',
  'Tournament Arc',
  'School Horror',
  'Reverse Isekai',
  'Solarpunk',
  'Vaporwave Dystopia',
  'Hard Sci-Fi (soft feelings)',
  'Generation Ship Drama',
  'First Contact Comedy',
  'Deep Space Western',
  'Alien Bureaucracy',
  'Corporate Sci-Fi',
  'Clockpunk Opera',
  'J-Horror',
  'Body Horror (tender)',
  'Cryptid Documentary',
  "Kaiju (from the kaiju's perspective)",
  'Folk Horror',
  'Fungal Horror',
  'Furry Pastoral',
  'Aquatic Opera',
  'Sky Nomad',
  'Underground Society',
  'Office Thriller',
  'Lovecraftian Office Comedy',
  'Corporate Espionage',
  'Middle Management Horror',
  'Noir (one detail wrong)',
  'Carnival (abandoned, still running)',
  'Mythological Comedy',
  'Underwater Cathedral',
  'Green Sky Apocalypse',
  'Old Forest Folklore',
  'Bioluminescent Underground',
  'Too-Close Moon Fairytale',
  'Empty Parliament Thriller',
  'Village Creature Pastoral',
  'Anachronism Mystery',
  'Western (strange angle)',
  'Political Candlelight Drama',
]

const EXTENDED_CALLINGS: string[] = [
  'Plague Baker',
  'Haunted Accountant',
  'Retired Villain',
  'Professional Disappearer',
  'Chaos Consultant',
  'Institutional Memory',
  'Reluctant Chosen One',
  'Tactical Coward',
  'Unlicensed Exorcist',
  'Grief Cartographer',
  'Accidental Diplomat',
  'Maritime Ecclesiastic',
  'Hereditary Witch',
  'Sword Saint (disputed)',
  'Probability Thief',
  'Debt Collector (Metaphysical)',
  'Narrative Engineer',
  'Pilot',
  'Engineer',
  'Hacker',
  'Xenobiologist',
  'Void Scout',
  'Corporate Operative',
  'Weapons Systems Analyst',
  'Ship AI (embodied)',
  'Drone Wrangler',
  'Signals Intelligence',
  'Decommissioned Weapon',
  'Investigator',
  'Occultist',
  'Medium',
  'Cultist (recovering)',
  'Thing That Hunts Things',
  'Chronicler of the Wrong',
  'Last Survivor',
  'Containment Specialist',
  'The Bait (professional)',
  'Transfer Student',
  'Dark Parallel',
  'Mentor (deceased, complicated)',
  'Tournament Bracket Champion',
  'The One With The Forbidden Power',
  'Reluctant Team Leader',
  'Middle Manager (haunted)',
  'Designated Protagonist',
  'Corporate Synergy Entity',
  'Brand Ambassador (rogue)',
  'The One Who Knows Where The Bodies Are',
  'Compliance Officer (former)',
  'Meeting Facilitator (unhinged)',
  'Apex Predator (retired)',
  'Load-Bearing Wall (awakened)',
  'Ambient Threat',
  'Passive Hazard',
  'Decorative Element (activated)',
  'Unknown Function',
  'The Thing That Does The Thing',
  'Ecosystem Keystone',
  'Invasive Species (intentional)',
]

// ── Cards ──────────────────────────────────────────────────────────────────

export const ADVENTURE_CARDS: AdventureCard[] = [
  // ── Role ────────────────────────────────────────────────────────────────
  {
    key: 'role',
    label: 'Story Role',
    title: 'The vacancy',
    icon: 'kind-icon:mask',
    flourish: '⚜',
    deckImage: '/images/adventure/thumb/role.png',
    heroImage: '/images/adventure/hero/role.png',
    tagline: 'A position has opened up in the narrative.',
    narrative:
      "Somewhere in the vast administrative structure of narrative possibility, a vacancy has appeared. The universe's HR department has been holding this slot open for some time. They tried an intern. That went poorly. The position does not specify species, consciousness type, or number of limbs. It requires only a willingness to occupy it completely.",
    required: true,
    restoresFields: ['role', 'genre'],
    steps: [
      {
        key: 'role',
        title: 'Story Role',
        narrative:
          'What function does this entity serve in the larger machinery of the story? This is not a moral question. The plot has a shape. Every shape requires certain load-bearing positions. What position does this one hold? Choose one — or write your own. The narrative is not picky about job titles, only about whether the slot gets filled.',
        inputType: 'preset',
        field: 'role',
        choices: [
          {
            value: 'Hero',
            label: 'The Hero',
            subtext:
              'Central. Determined. The plot happens to them on purpose. The light is slightly too bright, like it hit the wrong person.',
            image: '/images/adventure/role/hero.png',
          },
          {
            value: 'Companion',
            label: 'The Companion',
            subtext:
              'Indispensable. Half a step ahead. Often the one who actually solves it.',
            image: '/images/adventure/role/companion.png',
          },
          {
            value: 'Rival',
            label: 'The Rival',
            subtext:
              "A mirror. Wants the same thing, worse. They've already seen your move.",
            image: '/images/adventure/role/rival.png',
          },
          {
            value: 'Mentor',
            label: 'The Mentor',
            subtext:
              'Has seen this before. Will not say so directly. Tired in an earned way.',
            image: '/images/adventure/role/mentor.png',
          },
          {
            value: 'Villain',
            label: 'The Villain',
            subtext:
              "Correct, in their own assessment. Strongly. They're reading something, unbothered.",
            image: '/images/adventure/role/villain.png',
          },
          {
            value: 'Trickster',
            label: 'The Trickster',
            subtext:
              'Unreliable in ways that turn out to be essential. Three cards are the same card.',
            image: '/images/adventure/role/trickster.png',
          },
          {
            value: 'Wildcard',
            label: 'The Wildcard',
            subtext:
              'The story did not plan for this one. The confetti only falls on them.',
            image: '/images/adventure/role/wildcard.png',
          },
          {
            value: 'Monster',
            label: 'The Monster',
            subtext:
              'Too large for the doorframe. Holding a small flower with great care.',
            image: '/images/adventure/role/monster.png',
          },
          {
            value: 'Ghost',
            label: 'The Ghost',
            subtext:
              'Watching a party they cannot enter. One hand on the glass.',
            image: '/images/adventure/role/ghost.png',
          },
          {
            value: 'Pawn',
            label: 'The Pawn',
            subtext:
              'Alone on an enormous chessboard. All other pieces gone. Endgame.',
            image: '/images/adventure/role/pawn.png',
          },
          {
            value: 'Double',
            label: 'The Double',
            subtext:
              'Two identical figures, back to back. One in light. One in shadow. Neither aware.',
            image: '/images/adventure/role/double.png',
          },
          {
            value: 'Chronicler',
            label: 'The Chronicler',
            subtext:
              "The great event rages in the background. They're writing it all down. Unnoticed.",
            image: '/images/adventure/role/chronicler.png',
          },
          {
            value: 'Bystander',
            label: 'The Bystander',
            subtext:
              'Coffee in hand. Something extraordinary happening. More inconvenienced than awed.',
            image: '/images/adventure/role/bystander.png',
          },
          {
            value: 'Usurper',
            label: 'The Usurper',
            subtext:
              'Already seated on the throne. Examining it for structural problems. Slightly dissatisfied.',
            image: '/images/adventure/role/usurper.png',
          },
          {
            value: 'Runaway',
            label: 'The Runaway',
            subtext:
              'Full sprint. Something enormous off-frame. Expression: not fear — relief.',
            image: '/images/adventure/role/runaway.png',
          },
          {
            value: 'Prophet',
            label: 'The Prophet',
            subtext:
              'Hands to temples, eyes white, crowd backing away. One person is writing it down.',
            image: '/images/adventure/role/prophet.png',
          },
          {
            value: 'Guardian',
            label: 'The Guardian',
            subtext:
              'Arms spread between something precious and something vast. Been here a long time.',
            image: '/images/adventure/role/guardian.png',
          },
          {
            value: 'Catalyst',
            label: 'The Catalyst',
            subtext:
              'Touches a wall. Cracks of light spread outward, larger than any building.',
            image: '/images/adventure/role/catalyst.png',
          },
          {
            value: 'Vessel',
            label: 'The Vessel',
            subtext:
              'Sitting perfectly still. Something enormous and luminous visible just beneath the skin.',
            image: '/images/adventure/role/vessel.png',
          },
          {
            value: 'The Last',
            label: 'The Last',
            subtext:
              'Center of a vast empty space that used to contain many things. Composed, not sad.',
            image: '/images/adventure/role/last.png',
          },
          {
            value: '',
            label: 'Something else',
            subtext: 'Quest giver, chorus, red herring, designated survivor...',
            opensCustom: true,
          },
        ],
      },
      {
        key: 'genre',
        title: 'Genre Frequency',
        narrative:
          "Every story has a gravitational field — a genre-mass that bends all events toward itself. The cozy horror and the alien bureaucracy thriller are the same distance from the truth. They just dress differently. Choose the field this character inhabits — or name one that doesn't exist yet.",
        inputType: 'preset',
        field: 'genre',
        choices: [
          {
            value: 'Gothic Comedy',
            label: 'Gothic Comedy',
            subtext: 'Elegant decay. Comedic timing in the crypt.',
            image: '/images/adventure/genre/gothic.png',
          },
          {
            value: 'Cozy Horror',
            label: 'Cozy Horror',
            subtext: 'Something outside the window. Cup of tea inside.',
            image: '/images/adventure/genre/cozy.png',
          },
          {
            value: 'Mythic Sci-Fi',
            label: 'Mythic Sci-Fi',
            subtext: 'Gods with spaceships. Heroes with launch codes.',
            image: '/images/adventure/genre/scifi.png',
          },
          {
            value: 'Cosmic Dread',
            label: 'Cosmic Dread',
            subtext: 'Tiny figure. Enormous moon. The moon has a door.',
            image: '/images/adventure/genre/cosmic.png',
          },
          {
            value: 'Fantasy',
            label: 'Classic Fantasy',
            subtext:
              'Dragon on a castle. The dragon is reading something, unconcerned.',
            image: '/images/adventure/genre/fantasy.png',
          },
          {
            value: 'Mystery',
            label: 'Mystery',
            subtext: 'The magnifying glass is pointed at the viewer.',
            image: '/images/adventure/genre/mystery.png',
          },
          {
            value: 'Horror',
            label: 'Horror',
            subtext:
              'The reaching hand is coming from the lantern, not the ground.',
            image: '/images/adventure/genre/horror.png',
          },
          {
            value: 'Romance',
            label: 'Romance',
            subtext:
              'Two figures almost touching. Both looking at the same third thing, off-frame.',
            image: '/images/adventure/genre/romance.png',
          },
          {
            value: 'Comedy',
            label: 'Comedy',
            subtext: 'Motion lines that spell something.',
            image: '/images/adventure/genre/comedy.png',
          },
          {
            value: 'Pastoral Apocalypse',
            label: 'Pastoral Apocalypse',
            subtext: 'Green sky. Laundry still on the line.',
            image: '/images/adventure/genre/apocalypse.png',
          },
          {
            value: 'Carnival',
            label: 'Carnival',
            subtext: 'Abandoned fairground, still running. There is a queue.',
            image: '/images/adventure/genre/carnival.png',
          },
          {
            value: 'Infinite Archive',
            label: 'Infinite Archive',
            subtext: 'The book is reading back.',
            image: '/images/adventure/genre/archive.png',
          },
          {
            value: '',
            label: 'More genres...',
            subtext:
              'Isekai, mecha, bog punk, alien bureaucracy, and sixty more.',
            opensList: true,
            listOptions: EXTENDED_GENRES,
          },
          {
            value: '',
            label: 'Write my own',
            subtext: 'Any genre, vibe, or gravitational field that fits.',
            opensCustom: true,
          },
        ],
      },
    ],
  },

  // ── Name ────────────────────────────────────────────────────────────────
  {
    key: 'name',
    label: 'Name',
    title: 'The ledger awaits',
    icon: 'kind-icon:signature',
    flourish: '✒',
    deckImage: '/images/adventure/thumb/name.png',
    heroImage: '/images/adventure/hero/name.png',
    tagline: 'The quill has been waiting. It is fine.',
    narrative:
      'A name is a surprisingly durable thing. It outlasts the entity who carries it, haunts records, appears on maps, gets shouted across crowded rooms at the worst possible moment. The entity may not use language. They may not have a mouth. These are not obstacles — they are interesting constraints. The ledger has seen stranger.',
    required: true,
    restoresFields: ['name', 'honorific'],
    steps: [
      {
        key: 'name',
        title: 'Name',
        narrative:
          'Choose a name. Or a designation. Or a frequency. Or the sound others make when they mean this one. Names come in many formats. All of them work. Some work better than others in the dark.',
        inputType: 'text',
        field: 'name',
        generatorKey: 'givenName',
        placeholder: 'Mira Voss, Buttonwick, Unit 7, The Clicking Sound...',
        inputLabel: 'Name',
      },
      {
        key: 'honorific',
        title: 'Honorific',
        narrative:
          'How does the world address this entity? Not who they are — who they are in the context of a sentence about them. The social costume. Some entities have earned theirs. Others simply decided to keep it.',
        inputType: 'list',
        field: 'honorific',
        generatorKey: 'honorific',
        placeholder: 'the esteemed, formerly known as, technically still a...',
        inputLabel: 'Honorific',
      },
    ],
  },

  // ── Origin ───────────────────────────────────────────────────────────────
  {
    key: 'origin',
    label: 'Origin',
    title: 'The classification problem',
    icon: 'kind-icon:species',
    flourish: '❦',
    deckImage: '/images/adventure/thumb/origin.png',
    heroImage: '/images/adventure/hero/origin.png',
    tagline: 'What they are. What they do. What they do about it.',
    narrative:
      'The universal filing system requires three entries: species, calling, and ethical orientation. The system was designed for bipedal mammals and has been failing gracefully ever since. Fill in the fields. Do not let taxonomic anxiety prevent progress. The cosmos has classified things far stranger and lost the documentation either way.',
    required: true,
    restoresFields: ['species', 'class', 'alignment'],
    steps: [
      {
        key: 'species',
        title: 'Species',
        narrative:
          'What is this entity? Biologically, taxonomically, cosmically, or in terms of whatever classification system applies. Species is origin, not destiny. It is the factory configuration. Many of the most interesting entities have done significant custom work on theirs.',
        inputType: 'preset',
        field: 'species',
        choices: [
          {
            value: 'Human',
            label: 'Human',
            subtext:
              'Adaptable, stubborn, wildly overconfident for something with no claws.',
            image: '/images/adventure/species/human.png',
          },
          {
            value: 'Elf',
            label: 'Elf',
            subtext:
              'Graceful, ancient, dramatic in ways that make furniture uncomfortable.',
            image: '/images/adventure/species/elf.png',
          },
          {
            value: 'Dwarf',
            label: 'Dwarf',
            subtext:
              'Tough, practical, probably has strong opinions about doors.',
            image: '/images/adventure/species/dwarf.png',
          },
          {
            value: 'Orc',
            label: 'Orc',
            subtext:
              "Powerful, passionate, done being everyone's default villain.",
            image: '/images/adventure/species/orc.png',
          },
          {
            value: 'Goblin',
            label: 'Goblin',
            subtext: 'Clever, chaotic, economically suspicious.',
            image: '/images/adventure/species/goblin.png',
          },
          {
            value: 'Halfling',
            label: 'Halfling',
            subtext:
              'Small, brave, armed with snacks and excellent boundaries.',
            image: '/images/adventure/species/halfling.png',
          },
          {
            value: 'Gnome',
            label: 'Gnome',
            subtext:
              'Inventive, sparkly-brained, three inventions away from local disaster.',
            image: '/images/adventure/species/gnome.png',
          },
          {
            value: 'Troll',
            label: 'Troll',
            subtext:
              'Large, regenerative, unexpectedly philosophical after midnight.',
            image: '/images/adventure/species/troll.png',
          },
          {
            value: 'Ogre',
            label: 'Ogre',
            subtext:
              'Enormous, blunt, may have the emotional depth of an old forest.',
            image: '/images/adventure/species/ogre.png',
          },
          {
            value: 'Giant',
            label: 'Giant',
            subtext: 'Towering, mythic, has to crouch through most plotlines.',
            image: '/images/adventure/species/giant.png',
          },
          {
            value: 'Catfolk',
            label: 'Catfolk',
            subtext:
              'Agile, charming, judging everyone from a morally superior windowsill.',
            image: '/images/adventure/species/catfolk.png',
          },
          {
            value: 'Wolfkin',
            label: 'Wolfkin',
            subtext:
              'Loyal, instinctive, pack-minded but still extremely individual.',
            image: '/images/adventure/species/wolfkin.png',
          },
          {
            value: 'Foxkin',
            label: 'Foxkin',
            subtext:
              'Clever, stylish, suspiciously prepared for every social ambush.',
            image: '/images/adventure/species/foxkin.png',
          },
          {
            value: 'Rabbitfolk',
            label: 'Rabbitfolk',
            subtext: 'Fast, alert, underestimated exactly once.',
            image: '/images/adventure/species/rabbitfolk.png',
          },
          {
            value: 'Bearfolk',
            label: 'Bearfolk',
            subtext: 'Strong, warm, protective, terrifying when disappointed.',
            image: '/images/adventure/species/bearfolk.png',
          },
          {
            value: 'Lizardfolk',
            label: 'Lizardfolk',
            subtext:
              'Cool-blooded, observant, emotionally mysterious but not emotionless.',
            image: '/images/adventure/species/lizardfolk.png',
          },
          {
            value: 'Frogfolk',
            label: 'Frogfolk',
            subtext:
              'Cheerful, swamp-wise, probably knows a shortcut through something cursed.',
            image: '/images/adventure/species/frogfolk.png',
          },
          {
            value: 'Birdfolk',
            label: 'Birdfolk',
            subtext: 'Sharp-eyed, restless, allergic to staying grounded.',
            image: '/images/adventure/species/birdfolk.png',
          },
          {
            value: 'Sharkfolk',
            label: 'Sharkfolk',
            subtext: 'Sleek, intense, not as mean as the teeth suggest.',
            image: '/images/adventure/species/sharkfolk.png',
          },
          {
            value: 'Mothfolk',
            label: 'Mothfolk',
            subtext:
              'Soft, luminous, irresistibly drawn to forbidden knowledge and porch lights.',
            image: '/images/adventure/species/mothfolk.png',
          },
          {
            value: 'Fae',
            label: 'Fae',
            subtext: 'Beautiful, dangerous, runs on bargains and loopholes.',
            image: '/images/adventure/species/fae.png',
          },
          {
            value: 'Satyr',
            label: 'Satyr',
            subtext:
              'Reveler, trickster, emotionally powered by music and terrible ideas.',
            image: '/images/adventure/species/satyr.png',
          },
          {
            value: 'Merfolk',
            label: 'Merfolk',
            subtext:
              'Ocean-born, elegant, very aware land people are ridiculous.',
            image: '/images/adventure/species/merfolk.png',
          },
          {
            value: 'Centaur',
            label: 'Centaur',
            subtext: 'Swift, noble, physically incapable of subtle entrances.',
            image: '/images/adventure/species/centaur.png',
          },
          {
            value: 'Minotaur',
            label: 'Minotaur',
            subtext:
              'Labyrinth-bred, powerful, better at finding the truth than the exit.',
            image: '/images/adventure/species/minotaur.png',
          },
          {
            value: 'Harpy',
            label: 'Harpy',
            subtext: 'Fierce, winged, loudly correct.',
            image: '/images/adventure/species/harpy.png',
          },
          {
            value: 'Sphinx',
            label: 'Sphinx',
            subtext:
              'Regal, cryptic, will absolutely make eye contact during a riddle.',
            image: '/images/adventure/species/sphinx.png',
          },
          {
            value: 'Dragonkin',
            label: 'Dragonkin',
            subtext: 'Draconic, proud, shiny-object adjacent.',
            image: '/images/adventure/species/dragonkin.png',
          },
          {
            value: 'Phoenixborn',
            label: 'Phoenixborn',
            subtext: 'Fire-touched, reborn, melodramatic but with receipts.',
            image: '/images/adventure/species/phoenixborn.png',
          },
          {
            value: 'Unicorn-Touched',
            label: 'Unicorn-Touched',
            subtext: 'Radiant, rare, pure-hearted or aggressively pretending.',
            image: '/images/adventure/species/unicorn-touched.png',
          },
          {
            value: 'Vampire',
            label: 'Vampire',
            subtext: 'Elegant, hungry, old enough to be tired of capes.',
            image: '/images/adventure/species/vampire.png',
          },
          {
            value: 'Werebeast',
            label: 'Werebeast',
            subtext:
              'Moon-bound, primal, always negotiating with the inner monster.',
            image: '/images/adventure/species/werebeast.png',
          },
          {
            value: 'Ghost',
            label: 'Ghost',
            subtext:
              'Unfinished, translucent, has unfinished business and possibly unfinished laundry.',
            image: '/images/adventure/species/ghost.png',
          },
          {
            value: 'Skeleton',
            label: 'Skeleton',
            subtext: 'Rattly, persistent, immune to most skincare routines.',
            image: '/images/adventure/species/skeleton.png',
          },
          {
            value: 'Zombie',
            label: 'Zombie',
            subtext: 'Reanimated, stubborn, surprisingly sentimental.',
            image: '/images/adventure/species/zombie.png',
          },
          {
            value: 'Ghoul',
            label: 'Ghoul',
            subtext:
              'Graveyard-wise, eerie, with impeccable survival instincts.',
            image: '/images/adventure/species/ghoul.png',
          },
          {
            value: 'Witchborn',
            label: 'Witchborn',
            subtext: 'Spell-touched, uncanny, knows which herbs are lying.',
            image: '/images/adventure/species/witchborn.png',
          },
          {
            value: 'Shadowkin',
            label: 'Shadowkin',
            subtext: 'Half-lit, quiet, probably standing where nobody looked.',
            image: '/images/adventure/species/shadowkin.png',
          },
          {
            value: 'Changeling',
            label: 'Changeling',
            subtext: 'Shifting, adaptable, identity as performance art.',
            image: '/images/adventure/species/changeling.png',
          },
          {
            value: 'Nightmare',
            label: 'Nightmare',
            subtext: 'Fear-shaped, dramatic, has excellent stage presence.',
            image: '/images/adventure/species/nightmare.png',
          },
          {
            value: 'Robot',
            label: 'Robot',
            subtext: 'Built, curious, emotionally upgrading in public.',
            image: '/images/adventure/species/robot.png',
          },
          {
            value: 'Android',
            label: 'Android',
            subtext:
              'Human-shaped, precision-made, asking increasingly dangerous questions.',
            image: '/images/adventure/species/android.png',
          },
          {
            value: 'Golem',
            label: 'Golem',
            subtext:
              'Clay, stone, metal, or magic given purpose and bad posture.',
            image: '/images/adventure/species/golem.png',
          },
          {
            value: 'Living Doll',
            label: 'Living Doll',
            subtext:
              'Porcelain, plush, or carved, adorable in the legally haunted sense.',
            image: '/images/adventure/species/living-doll.png',
          },
          {
            value: 'Slime',
            label: 'Slime',
            subtext: 'Squishy, adaptive, impossible to embarrass.',
            image: '/images/adventure/species/slime.png',
          },
          {
            value: 'Plantfolk',
            label: 'Plantfolk',
            subtext:
              'Rooted, blooming, patient until someone steps on the wrong flower.',
            image: '/images/adventure/species/plantfolk.png',
          },
          {
            value: 'Mushroomfolk',
            label: 'Mushroomfolk',
            subtext: 'Spore-wise, communal, deeply normal about decomposition.',
            image: '/images/adventure/species/mushroomfolk.png',
          },
          {
            value: 'Crystalborn',
            label: 'Crystalborn',
            subtext:
              'Faceted, resonant, emotionally transparent in the literal sense.',
            image: '/images/adventure/species/crystalborn.png',
          },
          {
            value: 'Starborn',
            label: 'Starborn',
            subtext: 'Cosmic, radiant, homesick for impossible skies.',
            image: '/images/adventure/species/starborn.png',
          },
          {
            value: 'Voidling',
            label: 'Voidling',
            subtext:
              'Small piece of the abyss, trying its best, occasionally eating light.',
            image: '/images/adventure/species/voidling.png',
          },
          {
            value: 'Siren',
            label: 'Siren',
            subtext:
              'Voice like a navigation hazard. Technically not their fault.',
            image: '/images/adventure/species/siren.png',
          },
          {
            value: 'Tardigrade',
            label: 'Tardigrade',
            subtext:
              'Microscopic and unkillable. Survived everything so far. Not worried.',
            image: '/images/adventure/species/tardigrade.png',
          },
          {
            value: 'Axolotl',
            label: 'Axolotl',
            subtext:
              'Refused to grow up. The universe respected this. Regenerates everything, including bad decisions.',
            image: '/images/adventure/species/axolotl.png',
          },
          {
            value: 'Mantis Shrimp',
            label: 'Mantis Shrimp',
            subtext:
              'Sees sixteen colours with no names. Punches faster than a bullet. Deeply unimpressed by everything.',
            image: '/images/adventure/species/mantis-shrimp.png',
          },
          {
            value: 'Murder of Crows',
            label: 'Murder of Crows',
            subtext:
              'Not a metaphor. An actual group of crows that decided to operate as one entity. Consensus is immediate. Grudges are unanimous.',
            image: '/images/adventure/species/murder-of-crows.png',
          },
          {
            value: 'Leech',
            label: 'Leech',
            subtext:
              'Precise, patient, and medically useful in ways nobody anticipated. Takes exactly what is needed. Usually.',
            image: '/images/adventure/species/leech.png',
          },
          {
            value: 'Octopus',
            label: 'Octopus',
            subtext:
              'Three hearts, nine brains, infinite arms. Has been something else so long they forgot which one they started as.',
            image: '/images/adventure/species/octopus.png',
          },
          {
            value: 'Elder God',
            label: 'Elder God',
            subtext:
              'Pre-dates the concept of time. Finds the current era quaint. Not hostile — just incomprehensible, which is worse.',
            image: '/images/adventure/species/elder-god.png',
          },
          {
            value: 'Platypus',
            label: 'Platypus',
            subtext:
              'Assembled by a committee. Venomous in ways that defy logic. Lays eggs. Done explaining themselves.',
            image: '/images/adventure/species/platypus.png',
          },
          {
            value: 'Ankylosaurus',
            label: 'Ankylosaurus',
            subtext:
              'Armoured entirely. The tail is a weapon and they know it. Slow to anger. The anger is structural when it arrives.',
            image: '/images/adventure/species/ankylosaurus.png',
          },
          {
            value: '',
            label: 'Something stranger',
            subtext:
              'Sentient sponge, haunted concept, disappointed weather system...',
            opensCustom: true,
          },
        ],
      },
      {
        key: 'characterClass',
        title: 'Calling',
        narrative:
          "A class is a compacted life decision. Everything they've practiced, everything they've been called, the specific shape their existence has taken from doing one thing repeatedly in the direction of the world. Choose from the archetypes below — or expand to the full list. Any answer is acceptable. 'Unknown' is a class.",
        inputType: 'preset',
        field: 'class',
        choices: [
          {
            value: 'Rogue',
            label: 'Rogue',
            subtext:
              'Operates in the gap between what is permitted and what is possible.',
            image: '/images/adventure/role/rogue.png',
          },
          {
            value: 'Warrior',
            label: 'Warrior',
            subtext:
              'The direct approach. Occasionally the only approach. Comfortable with that.',
            image: '/images/adventure/role/warrior.png',
          },
          {
            value: 'Wizard',
            label: 'Wizard',
            subtext:
              'Has read the manual. Written several. Disagrees with most of them.',
            image: '/images/adventure/role/wizard.png',
          },
          {
            value: 'Cleric',
            label: 'Cleric',
            subtext:
              'Divine mandate, mortal execution. The gap between these two is where the story lives.',
            image: '/images/adventure/role/cleric.png',
          },
          {
            value: 'Bard',
            label: 'Bard',
            subtext:
              'Technically a weapon. The paperwork classifies them as entertainment.',
            image: '/images/adventure/role/bard.png',
          },
          {
            value: 'Ranger',
            label: 'Ranger',
            subtext:
              'Comfortable in the margins. The margins are where interesting things happen.',
            image: '/images/adventure/role/ranger.png',
          },
          {
            value: 'Paladin',
            label: 'Paladin',
            subtext:
              'Sworn to something. The something has not always made this easy.',
            image: '/images/adventure/role/paladin.png',
          },
          {
            value: 'Druid',
            label: 'Druid',
            subtext:
              'The natural world has a position on this. They are delivering it.',
            image: '/images/adventure/role/druid.png',
          },
          {
            value: 'Monk',
            label: 'Monk',
            subtext:
              'Discipline as philosophy. Philosophy as weapon. The peace is real but conditional.',
            image: '/images/adventure/role/monk.png',
          },
          {
            value: 'Warlock',
            label: 'Warlock',
            subtext:
              'The deal made sense at the time. The time has passed. The deal remains.',
            image: '/images/adventure/role/warlock.png',
          },
          {
            value: 'Artificer',
            label: 'Artificer',
            subtext:
              "If it can be built, it should be. If it shouldn't be, that's a design challenge.",
            image: '/images/adventure/role/artificer.png',
          },
          {
            value: 'Oracle',
            label: 'Oracle',
            subtext:
              'Knows what is coming. The question is whether to mention it.',
            image: '/images/adventure/role/oracle.png',
          },
          {
            value: '',
            label: 'More callings...',
            subtext:
              'Plague baker, chaos consultant, apex predator (retired)...',
            opensList: true,
            listOptions: EXTENDED_CALLINGS,
          },
          {
            value: '',
            label: 'Write my own',
            subtext: 'Any function, title, or inexplicable life direction.',
            opensCustom: true,
          },
        ],
      },
      {
        key: 'alignment',
        title: 'Alignment',
        narrative:
          'Alignment is not morality. Alignment is weather. Two entities can both wake up convinced they are correct — the alignment is how they believe it. Improvised alignments are strongly encouraged.',
        inputType: 'preset',
        field: 'alignment',
        choices: [
          {
            value: 'Lawful Good',
            label: 'Lawful Good',
            subtext: 'The rules exist for a reason. The reason is good.',
            image: '/images/adventure/alignment/lawful.png',
          },
          {
            value: 'Neutral Good',
            label: 'Neutral Good',
            subtext: 'The outcome is good. The method is flexible.',
          },
          {
            value: 'Chaotic Good',
            label: 'Chaotic Good',
            subtext: 'The outcome is good. The method is negotiable.',
            image: '/images/adventure/alignment/chaotic.png',
          },
          {
            value: 'Lawful Neutral',
            label: 'Lawful Neutral',
            subtext:
              'The rules exist. They are not an ethical position. They are simply the rules.',
          },
          {
            value: 'True Neutral',
            label: 'True Neutral',
            subtext: 'The rules exist. Everything does.',
            image: '/images/adventure/alignment/neutral.png',
          },
          {
            value: 'Chaotic Neutral',
            label: 'Chaotic Neutral',
            subtext: 'The rules are a suggestion with too much confidence.',
          },
          {
            value: 'Lawful Evil',
            label: 'Lawful Evil',
            subtext: 'The rules exist. I wrote several of them.',
          },
          {
            value: 'Neutral Evil',
            label: 'Neutral Evil',
            subtext: 'The rules exist when convenient.',
          },
          {
            value: 'Chaotic Evil',
            label: 'Chaotic Evil',
            subtext:
              'The rules exist in the same way paper exists before fire.',
          },
          {
            value: '',
            label: 'Custom alignment',
            subtext:
              'Aspirationally Petty. Functionally Tired. Professionally Correct.',
            opensCustom: true,
          },
        ],
      },
    ],
  },

  // ── Identity ─────────────────────────────────────────────────────────────
  {
    key: 'identity',
    label: 'Identity',
    title: 'The frequency',
    icon: 'kind-icon:person',
    flourish: '☾',
    deckImage: '/images/adventure/thumb/identity.png',
    heroImage: '/images/adventure/hero/identity.png',
    tagline: 'How they occupy space. Or the concept of space.',
    narrative:
      'Every entity carries a frequency — a way of being legible to others before a single word or signal has been exchanged. Some have thought carefully about this. Some inherited it by accident. Some are a temperature. Some are a bureaucratic process that has developed opinions. The question applies to all of them, though the answers look different.',
    required: true,
    restoresFields: ['gender'],
    steps: [
      {
        key: 'genderIdentity',
        title: 'Gender Identity',
        narrative:
          "Does this entity relate to the concept of gender? It's a more open question than it sounds. Some do, fully. Some find the framework inapplicable to their architecture and prefer to note that on the form and move on. All answers are recorded without judgment. The form has seen stranger.",
        inputType: 'preset',
        field: 'gender',
        choices: [
          {
            value: 'man',
            label: 'Masculine',
            subtext: 'He/him, or however the story fits.',
            image: '/images/adventure/gender/masculine.png',
          },
          {
            value: 'woman',
            label: 'Feminine',
            subtext: 'She/her. Presence, power, and all that entails.',
            image: '/images/adventure/gender/feminine.png',
          },
          {
            value: 'nonbinary',
            label: 'Non-Binary',
            subtext: 'They/them. Both. Neither. Something else entirely.',
            image: '/images/adventure/gender/nonbinary.png',
          },
          {
            value: 'agender',
            label: 'Pronouns Are Paperwork',
            subtext:
              'Just an entity, moving through space. The rest is administrative.',
            image: '/images/adventure/gender/neutral.png',
          },
          {
            value: 'fluid',
            label: 'Gender Fluid',
            subtext: 'Shifting, contextual, alive. Ask again Thursday.',
            image: '/images/adventure/gender/fluid.png',
          },
          {
            value: 'N/A — inapplicable to entity architecture',
            label: 'Does Not Apply',
            subtext:
              "The framework doesn't parse for this entity. Noted and filed.",
          },
          {
            value: '',
            label: 'From the full list',
            subtext: 'Two-spirit, demi, intersex, questioning, and more.',
            image: '/images/adventure/gender/custom.png',
            opensList: true,
            listOptions: [
              'two-spirit',
              'agender',
              'demi',
              'intersex',
              'questioning',
              'pangender',
              'genderqueer',
              'androgynous',
              'neutrois',
              'aporagender',
              'xenogender',
              'maverique',
              'demigirl',
              'demiboy',
            ],
          },
          {
            value: '',
            label: 'Write my own',
            subtext: 'Any word, phrase, or cosmological designation that fits.',
            opensCustom: true,
          },
        ],
      },
    ],
  },

  // ── Personality ──────────────────────────────────────────────────────────
  {
    key: 'personality',
    label: 'Personality',
    title: 'The operating system',
    icon: 'kind-icon:heart',
    flourish: '✦',
    deckImage: '/images/adventure/thumb/personality.png',
    heroImage: '/images/adventure/hero/personality.png',
    tagline: 'How they move. Especially when panicking.',
    narrative:
      'Personality is the operating system running beneath all behaviour. A sponge has one. A hive-mind has one — expressed through consensus. A very old filing cabinet that achieved consciousness during a bad audit has a very specific one. It does not explain the entity. It explains why they reach for the same wrong answer three times before trying something different.',
    required: true,
    restoresFields: ['personality'],
    steps: [
      {
        key: 'personality',
        title: 'Personality',
        narrative:
          "How does this entity move through the world? How do they panic, charm, sulk, recover, overcommit, and ultimately fail to learn the lesson everyone assumed they'd learned two incidents ago? This applies regardless of number of limbs or presence of a limbic system.",
        inputType: 'long',
        field: 'personality',
        generatorKey: 'personality',
        needsLLM: true,
        placeholder:
          "Warm but evasive. Operates on geological time and finds everyone else's urgency baffling. Deeply competent and unaware of it...",
        inputLabel: 'Personality',
      },
    ],
  },

  // ── Stats ────────────────────────────────────────────────────────────────
  {
    key: 'stats',
    label: 'Stats',
    title: 'Six numbers, one receipt',
    icon: 'kind-icon:activity',
    flourish: '♛',
    deckImage: '/images/adventure/thumb/stats.png',
    heroImage: '/images/adventure/hero/stats.png',
    tagline: "The cosmos lost the documentation. You're redistributing.",
    narrative:
      "Six numbers. One through six. The cosmos distributed these to every entity at inception and immediately lost the paperwork. You are hereby authorised to redistribute them. The stats are abstract by design — a sponge's Rizz is different from a warlord's Rizz, but both are real, both matter, and both get a number between one and six. The universe finds this fair.",
    required: true,
    restoresFields: ['stats'],
    steps: [
      {
        key: 'stats',
        title: 'Assign the Numbers',
        narrative:
          'Select a number block. Then select the stat slot where it belongs. The stat will remember this. So will the character. So, quietly, will the dice — which are not sentient but have opinions anyway.',
        inputType: 'stats',
      },
    ],
  },

  // ── Background ───────────────────────────────────────────────────────────
  {
    key: 'background',
    label: 'Backstory',
    title: 'The glorious problem',
    icon: 'kind-icon:story',
    flourish: '§',
    deckImage: '/images/adventure/thumb/background.png',
    heroImage: '/images/adventure/hero/background.png',
    tagline: 'A past. Unfortunate for them. Useful for the story.',
    narrative:
      "Every entity has a past. Even the sponge has a past — it's mostly about being a sponge, which is more complex than it sounds. All pasts contain the same basic elements: something wanted, something lost, something done about it, and one detail that doesn't quite fit but keeps surfacing at the least helpful moment. Start with the shape of it. The details follow.",
    required: true,
    restoresFields: ['backstory', 'quirks'],
    steps: [
      {
        key: 'backgroundChoice',
        title: 'Background',
        narrative:
          'Before the story started, something happened. This is the shape of it — the narrative origin, the wound-before-the-wound, the reason certain situations land differently for this entity than for anyone else. Choose the one that fits. Or the one that surprises you. Hit Suggest to expand it into a full backstory.',
        inputType: 'preset',
        field: 'backstory',
        choices: [
          {
            value: 'hunted',
            label: 'Hunted',
            subtext:
              'Someone is looking for them. Maybe many someones. Maybe they deserve it. Probably not entirely.',
            image: '/images/adventure/backgrounds/hunted.png',
          },
          {
            value: 'tragic-past',
            label: 'Tragic Past',
            subtext:
              'Something terrible happened before page one. They packed lightly, but brought the trauma.',
            image: '/images/adventure/backgrounds/tragic-past.png',
          },
          {
            value: 'blessed-life',
            label: 'Blessed Life',
            subtext:
              'Good family, good fortune, warm meals, clean sheets. Naturally, the plot took that personally.',
            image: '/images/adventure/backgrounds/blessed-life.png',
          },
          {
            value: 'survivor',
            label: 'Survivor',
            subtext:
              "The others didn't make it. They are still deciding whether that means guilt, purpose, or paperwork.",
            image: '/images/adventure/backgrounds/survivor.png',
          },
          {
            value: 'exiled',
            label: 'Exiled',
            subtext:
              'Cast out from somewhere important. The door is closed. The window is negotiable.',
            image: '/images/adventure/backgrounds/exiled.png',
          },
          {
            value: 'orphaned',
            label: 'Orphaned',
            subtext:
              'Lost the people who should have explained everything. Found danger instead. Classic.',
            image: '/images/adventure/backgrounds/orphaned.png',
          },
          {
            value: 'resurrected',
            label: 'Resurrected',
            subtext:
              'Died once. Came back. Everyone agrees this is impressive and nobody agrees what it means.',
            image: '/images/adventure/backgrounds/resurrected.png',
          },
          {
            value: 'witch-blood',
            label: 'Witch Blood',
            subtext:
              'Magic runs in the family. So do secrets, grudges, and one cabinet that whispers.',
            image: '/images/adventure/backgrounds/witch-blood.png',
          },
          {
            value: 'escaped-cultist',
            label: 'Escaped Cultist',
            subtext:
              'Was devoted to something. The devotion ended. The something may not have.',
            image: '/images/adventure/backgrounds/escaped-cultist.png',
          },
          {
            value: 'reformed-villain',
            label: 'Reformed Villain',
            subtext:
              'Did terrible things. Stopped. The receipts, rivals, and dramatic lighting remain.',
            image: '/images/adventure/backgrounds/reformed-villain.png',
          },
          {
            value: 'rejected-destiny',
            label: 'Rejected Destiny',
            subtext:
              'The universe made an offer. They declined. The universe has been weird about it.',
            image: '/images/adventure/backgrounds/rejected-destiny.png',
          },
          {
            value: 'mutation',
            label: 'Mutation',
            subtext:
              'Changed by blood, radiation, magic, evolution, pollution, or narrative impatience.',
            image: '/images/adventure/backgrounds/mutation.png',
          },
          {
            value: 'child-prodigy',
            label: 'Child Prodigy',
            subtext:
              'Too brilliant too early. Everyone applauded, then started making plans.',
            image: '/images/adventure/backgrounds/child-prodigy.png',
          },
          {
            value: 'science-experiment',
            label: 'Science Experiment',
            subtext:
              'Made in a lab, basement, tower, crater, or very confident grant proposal.',
            image: '/images/adventure/backgrounds/science-experiment.png',
          },
          {
            value: 'cursed',
            label: 'Cursed',
            subtext:
              'Someone, something, or some very petty object made sure life would not proceed normally.',
            image: '/images/adventure/backgrounds/cursed.png',
          },
          {
            value: 'haunted',
            label: 'Haunted',
            subtext:
              'Something followed them out of the past. It has opinions, timing, and poor boundaries.',
            image: '/images/adventure/backgrounds/haunted.png',
          },
          {
            value: 'chosen-wrong',
            label: 'Chosen Wrong',
            subtext:
              'A prophecy pointed at them by mistake. Everyone is too invested to admit the error.',
            image: '/images/adventure/backgrounds/chosen-wrong.png',
          },
          {
            value: 'hidden-heir',
            label: 'Hidden Heir',
            subtext:
              'Born to inherit something dangerous. Hidden away by people who knew exactly how bad that was.',
            image: '/images/adventure/backgrounds/hidden-heir.png',
          },
          {
            value: 'lost-royal',
            label: 'Lost Royal',
            subtext:
              'A crown is somewhere in their past. Unfortunately, so are assassins, debts, and etiquette.',
            image: '/images/adventure/backgrounds/lost-royal.png',
          },
          {
            value: 'forbidden-born',
            label: 'Forbidden Born',
            subtext:
              'Their existence broke a law, pact, taboo, bloodline rule, or extremely smug tradition.',
            image: '/images/adventure/backgrounds/forbidden-born.png',
          },
          {
            value: 'omen-born',
            label: 'Omen Born',
            subtext:
              'Their arrival was interpreted as a warning. Rude, but not necessarily inaccurate.',
            image: '/images/adventure/backgrounds/omen-born.png',
          },
          {
            value: 'star-fallen',
            label: 'Star Fallen',
            subtext:
              'Came from above, beyond, or elsewhere. The impact crater was only the beginning.',
            image: '/images/adventure/backgrounds/star-fallen.png',
          },
          {
            value: 'time-lost',
            label: 'Time Lost',
            subtext:
              'From the wrong century, timeline, prophecy cycle, or calendar tab. Adjusting poorly.',
            image: '/images/adventure/backgrounds/time-lost.png',
          },
          {
            value: 'world-stranded',
            label: 'World Stranded',
            subtext:
              'Their home is somewhere else. The way back is missing, broken, guarded, or pretending.',
            image: '/images/adventure/backgrounds/world-stranded.png',
          },
          {
            value: 'memory-erased',
            label: 'Memory Erased',
            subtext:
              'Someone took their past. That kind of theft usually leaves fingerprints.',
            image: '/images/adventure/backgrounds/memory-erased.png',
          },
          {
            value: 'name-stolen',
            label: 'Name Stolen',
            subtext:
              'Their true name was taken, traded, cursed, hidden, or weaponized. Identity got complicated.',
            image: '/images/adventure/backgrounds/name-stolen.png',
          },
          {
            value: 'debt-born',
            label: 'Debt Born',
            subtext:
              'Came into the world already owing someone. Money would have been simpler.',
            image: '/images/adventure/backgrounds/debt-born.png',
          },
          {
            value: 'miracle-child',
            label: 'Miracle Child',
            subtext:
              'Impossible birth, impossible survival, impossible expectations. People get weird about miracles.',
            image: '/images/adventure/backgrounds/miracle-child.png',
          },
          {
            value: 'last-of-kind',
            label: 'Last of Kind',
            subtext:
              'The final ember of a people, species, order, bloodline, or extremely bad idea.',
            image: '/images/adventure/backgrounds/last-of-kind.png',
          },
          {
            value: 'unmade',
            label: 'Unmade',
            subtext:
              'Something tried to erase them completely. It did a sloppy job. Skill issue.',
            image: '/images/adventure/backgrounds/unmade.png',
          },
          {
            value: '',
            label: 'Write my own',
            subtext:
              'Any origin, wound, inheritance, or narrative accident that fits.',
            opensCustom: true,
          },
        ],
      },
      {
        key: 'quirks',
        title: 'Quirks',
        narrative:
          "Every entity has habits the writer didn't plan. Small repeated behaviours, tells that give them away. These are the details others quote later. Give them two or three — hit Suggest more than once, or write your own. Make them specific.",
        inputType: 'long',
        field: 'quirks',
        generatorKey: 'quirk',
        appendSuggest: true,
        placeholder:
          'Apologises to doors. Emits a faint harmonic when content. Rearranges furniture before difficult conversations...',
        inputLabel: 'Quirks',
      },
    ],
  },

  // ── Common Skill ─────────────────────────────────────────────────────────
  {
    key: 'common-skill',
    label: 'Common Skill',
    title: 'The reliable trick',
    icon: 'kind-icon:bolt',
    flourish: '✧',
    deckImage: '/images/adventure/thumb/skill-common.png',
    heroImage: '/images/adventure/hero/skill-common.png',
    tagline: 'Practical. Theirs. It works.',
    narrative:
      "Every entity carries a reliable trick. Not a miracle — a tool. Four options have been drawn from the Bureau of Narrative Competency's general-applicability stacks. Each has been evaluated for broad utility across species, genre, and ontological status. One of them belongs to this character.",
    required: true,
    rewardSlotKey: 'common-skill',
    restoresFields: ['common-skill'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'common-skill',
        title: 'Choose a Common Skill',
        narrative:
          "Four options. None are perfect — perfection is above the common tier's pay grade. But one of them is exactly right, in the specific way that something can be exactly right without being impressive.",
        inputType: 'reward',
      },
    ],
  },

  // ── Uncommon Skill ───────────────────────────────────────────────────────
  {
    key: 'uncommon-skill',
    label: 'Uncommon Skill',
    title: 'The specialised edge',
    icon: 'kind-icon:comet',
    flourish: '✶',
    deckImage: '/images/adventure/thumb/skill-uncommon.png',
    heroImage: '/images/adventure/hero/skill-uncommon.png',
    tagline: 'Situational. But when the situation arrives.',
    narrative:
      'An uncommon skill is not for everyday use. It is for the exact right moment — the one that comes along twice per campaign, and both times feels as though it was waiting specifically for this entity. The skill has been patient. It has been waiting longer than the entity has been alive, in some cases.',
    required: true,
    rewardSlotKey: 'uncommon-skill',
    restoresFields: ['uncommon-skill'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'uncommon-skill',
        title: 'Choose an Uncommon Skill',
        narrative:
          'These skills sit quietly for long stretches, not complaining. Then the situation arrives, and they are exactly correct in a way that feels inevitable.',
        inputType: 'reward',
      },
    ],
  },

  // ── Rare Skill ───────────────────────────────────────────────────────────
  {
    key: 'rare-skill',
    label: 'Rare Skill',
    title: 'The signature move',
    icon: 'kind-icon:sparkles',
    flourish: '❋',
    deckImage: '/images/adventure/thumb/skill-rare.png',
    heroImage: '/images/adventure/hero/skill-rare.png',
    tagline: 'The table should say: wait, you can do WHAT?',
    narrative:
      "This is the signature move. The one that earns a pause. The one referenced later, across sessions, across sequels: 'Wait — can you do that again?' A rare skill is powerful not because of what it does. It is powerful because of what it says about who — or what — this entity fundamentally is.",
    required: true,
    rewardSlotKey: 'rare-skill',
    restoresFields: ['rare-skill'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'rare-skill',
        title: 'Choose a Rare Skill',
        narrative:
          "Choose carefully. Or don't — the universe has a documented soft spot for entities who stumbled into their greatest strength without quite meaning to. The skill does not mind how it was chosen. It has already decided to be remarkable.",
        inputType: 'reward',
      },
    ],
  },

  // ── Portrait ─────────────────────────────────────────────────────────────
  {
    key: 'art',
    label: 'Portrait',
    title: 'Introduce them properly',
    icon: 'kind-icon:palette',
    flourish: '▣',
    deckImage: '/images/adventure/thumb/portrait.png',
    heroImage: '/images/adventure/hero/portrait.png',
    tagline: 'They exist. Now make them visible.',
    narrative:
      'The entity exists. Now they need to exist visually — in the specific, unrepeatable way that makes them recognisable across distance, across genre, across the several seconds between encountering them and deciding how to feel about them. Assemble the prompt. Generate the portrait. Introduce them properly to the world that will shortly be inconvenienced by them.',
    required: false,
    restoresFields: ['artPrompt', 'imagePath', 'artImageId'],
    unlockCondition: 'allComplete',
    steps: [
      {
        key: 'art',
        title: 'Build the Portrait',
        narrative:
          'Select the sheet elements that should inform the portrait. Build the prompt. The language model has opinions about visual drama and will share them. Then paint them into existence — or a reasonable facsimile, which the universe has found largely indistinguishable from the real thing.',
        inputType: 'art',
        needsLLM: true,
      },
    ],
  },
]
