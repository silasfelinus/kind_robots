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
  multiSelect?: boolean // true = user picks multiple; value stored as pipe-separated string
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
  'Sword Saint',
  'Probability Thief',
  'Debt Collector',
  'Narrative Engineer',
  'Pilot',
  'Engineer',
  'Hacker',
  'Xenobiologist',
  'Void Scout',
  'Corporate Operative',
  'Weapons Systems Analyst',
  'Ship AI',
  'Drone Wrangler',
  'Signals Intelligence',
  'Decommissioned Weapon',
  'Investigator',
  'Occultist',
  'Medium',
  'Cultist',
  'Thing That Hunts Things',
  'Chronicler of the Wrong',
  'Last Survivor',
  'Containment Specialist',
  'The Bait',
  'Transfer Student',
  'Dark Parallel',
  'Mentor',
  'Tournament Bracket Champion',
  'The One With The Forbidden Power',
  'Reluctant Team Leader',
  'Middle Manager',
  'Designated Protagonist',
  'Corporate Synergy Entity',
  'Brand Ambassador',
  'The One Who Knows Where The Bodies Are',
  'Compliance Officer',
  'Meeting Facilitator',
  'Apex Predator',
  'Load-Bearing Wall',
  'Ambient Threat',
  'Passive Hazard',
  'Decorative Element',
  'Unknown Function',
  'The Thing That Does The Thing',
  'Ecosystem Keystone',
  'Invasive Species',
]

// ── Cards ──────────────────────────────────────────────────────────────────

export const ADVENTURE_CARDS: AdventureCard[] = [
  // ── Role ────────────────────────────────────────────────────────────────
  {
    key: 'role',
    label: 'Genre',
    title: 'The frequency',
    icon: 'kind-icon:mask',
    flourish: '⚜',
    deckImage: '/images/adventure/thumb/role.png',
    heroImage: '/images/adventure/hero/role.png',
    tagline: 'Every story has a gravitational field.',
    narrative:
      'Every story has a genre-mass that bends all events toward itself. The cozy horror and the alien bureaucracy thriller are the same distance from the truth. They just dress differently. Choose the field this character inhabits. It will shape everything — the stakes, the lighting, the kind of trouble that finds them.',
    required: true,
    restoresFields: ['genre'],
    steps: [
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
            value: 'Angel',
            label: 'Angel',
            subtext:
              'Administrative patience. Multiple wings, not all facing the same direction. The eyes are where expected and several places that are not.',
            image: '/images/adventure/species/angel.png',
          },
          {
            value: 'Demon',
            label: 'Demon',
            subtext:
              'Elegant rather than monstrous. Something is burning nearby that they have not acknowledged. Mildly entertained by all of this.',
            image: '/images/adventure/species/demon.png',
          },
          {
            value: 'Trickster',
            label: 'Trickster',
            subtext:
              "Caught between two forms. The shadow on the wall doesn't match the body in front of it. Has been like this for some time.",
            image: '/images/adventure/species/trickster.png',
          },
          {
            value: 'Deity',
            label: 'Deity',
            subtext:
              'Multiple arms, each doing something different. Eyes open in places that are not the face. Currently distracted by something larger.',
            image: '/images/adventure/species/deity.png',
          },
          {
            value: 'Fairy',
            label: 'Fairy',
            subtext:
              'Small, luminous, entirely uncharming. The light they emit flickers when annoyed. Currently annoyed.',
            image: '/images/adventure/species/fairy.png',
          },
          {
            value: 'Imp',
            label: 'Imp',
            subtext:
              'One hand is behind their back. What they are holding is not visible. This is worse than if it were.',
            image: '/images/adventure/species/imp.png',
          },
          {
            value: 'Gremlin',
            label: 'Gremlin',
            subtext:
              'Inside a machine that was working fine before they arrived. Considers that a previous state, not a preferred one.',
            image: '/images/adventure/species/gremlin.png',
          },
          {
            value: 'Dryad',
            label: 'Dryad',
            subtext:
              'Bark-textured, rooted, one eye is a knothole. Ancient patience with a current irritation.',
            image: '/images/adventure/species/dryad.png',
          },
          {
            value: 'Luck Dragon',
            label: 'Luck Dragon',
            subtext:
              "Serpentine, cloud-white, flying through a gap that shouldn't exist. Several things in the background are going wrong specifically around them.",
            image: '/images/adventure/species/luck-dragon.png',
          },
          {
            value: 'Butterfly',
            label: 'Butterfly',
            subtext:
              'Each wing panel is a different world. Landing on something they probably should not be landing on.',
            image: '/images/adventure/species/butterfly.png',
          },
          {
            value: 'Spider',
            label: 'Spider',
            subtext:
              'Eight eyes, all attentive. Sitting at the centre of a web that is also a map. Expression: waiting.',
            image: '/images/adventure/species/spider.png',
          },
          {
            value: 'Imaginary Friend',
            label: 'Imaginary Friend',
            subtext:
              'Slightly translucent. Proportions designed by memory rather than biology. Loyal, and fully aware of how complicated that is.',
            image: '/images/adventure/species/imaginary-friend.png',
          },
          {
            value: 'Poltergeist',
            label: 'Poltergeist',
            subtext:
              'No body — presence indicated entirely by objects mid-flight. The arrangement has a point. It is making it.',
            image: '/images/adventure/species/poltergeist.png',
          },
          {
            value: 'Wendigo',
            label: 'Wendigo',
            subtext:
              'Tall, antlered, too thin. Standing at the treeline. Not approaching. Not retreating. The eye contact is the event.',
            image: '/images/adventure/species/wendigo.png',
          },
          {
            value: 'Cryptid',
            label: 'Cryptid',
            subtext:
              'Blurry at the edges — not from motion but from ontological uncertainty. Up close they are no clearer.',
            image: '/images/adventure/species/cryptid.png',
          },
          {
            value: 'Chupacabra',
            label: 'Chupacabra',
            subtext:
              'Prefers not to be documented. Has not succeeded in this preference.',
            image: '/images/adventure/species/chupacabra.png',
          },
          {
            value: 'Leprechaun',
            label: 'Leprechaun',
            subtext:
              'Sitting on the gold, which they clearly find annoying. The wish-granting is contractual. The contract has footnotes.',
            image: '/images/adventure/species/leprechaun.png',
          },
          {
            value: 'Dragon',
            label: 'Dragon',
            subtext:
              "Coiled around something significant. The hoard is not coins — it's something more specific and more interesting.",
            image: '/images/adventure/species/dragon.png',
          },
          {
            value: 'Whale',
            label: 'Whale',
            subtext:
              'Enormous, slow, bioluminescent markings that suggest a language. Not aware of the small things near it in any way that matters.',
            image: '/images/adventure/species/whale.png',
          },
          {
            value: 'Potted Geranium',
            label: 'Potted Geranium',
            subtext:
              'Completely ordinary. Healthy red flowers. Slightly dry soil. One flower turned toward something off-frame with what can only be described as attention.',
            image: '/images/adventure/species/potted-geraniums.png',
          },
          {
            value: 'SCP',
            label: 'SCP',
            subtext:
              'In containment. Technically. The containment protocols are on their fourth revision. The figure is reading a magazine.',
            image: '/images/adventure/species/scp.png',
          },
          {
            value: 'World Serpent',
            label: 'World Serpent',
            subtext:
              'Large enough that weather systems form on their scales. Not hostile — simply occupying space at a scale that makes the distinction irrelevant.',
            image: '/images/adventure/species/world-serpent.png',
          },
          {
            value: 'Sentient Spaceship',
            label: 'Sentient Spaceship',
            subtext:
              'Made modifications to their own hull that no crew member has taken responsibility for. Currently facing something. Chose to.',
            image: '/images/adventure/species/sentient-spaceship.png',
          },
          {
            value: 'Space Clown',
            label: 'Space Clown',
            subtext:
              'Floating unassisted in the vacuum of space, performing to an audience that may not exist. The physics violations are deliberate.',
            image: '/images/adventure/species/space-clown.png',
          },
          {
            value: 'Kaiju',
            label: 'Kaiju',
            subtext:
              'The foot alone is the size of several city blocks. Not looking down. Whatever they are looking at is elsewhere and more interesting.',
            image: '/images/adventure/species/kaiju.png',
          },
          {
            value: 'Toon',
            label: 'Toon',
            subtext:
              'Motion lines still attached. Currently mid-air. Not yet aware of this. The laws of physics apply on an advisory basis.',
            image: '/images/adventure/species/toon.png',
          },
          {
            value: 'Yokai',
            label: 'Yokai',
            subtext:
              'Slightly wrong proportions, lantern with the wrong-coloured light, path that leads somewhere new. Offering assistance. Whether to accept is a separate question.',
            image: '/images/adventure/species/yokai.png',
          },
          {
            value: 'Evolutionary Architect',
            label: 'Evolutionary Architect',
            subtext:
              'Holding something small and alive, considering what it could become. Has done this before. The surroundings show the previous work.',
            image: '/images/adventure/species/evolutionary-architect.png',
          },
          {
            value: 'Backrooms Entity',
            label: 'Backrooms Entity',
            subtext:
              'At the far end of an infinite fluorescent corridor. Facing this direction. The distance has not changed despite the corridor being walkable.',
            image: '/images/adventure/species/backrooms-entity.png',
          },
          {
            value: 'Virus',
            label: 'Virus',
            subtext:
              'Technically not alive by most definitions, which it finds liberating. Simply insistent on continuing.',
            image: '/images/adventure/species/virus.png',
          },
          {
            value: 'Scarecrow',
            label: 'Scarecrow',
            subtext:
              'Installed to keep things away. Developed opinions about which things. The crows left years ago. Something else visits now.',
            image: '/images/adventure/species/scarecrow.png',
          },
          {
            value: 'Sleep Elemental',
            label: 'Sleep Elemental',
            subtext:
              'Made of the texture of almost-asleep. Trailing the faint suggestion of a dream that belongs to someone else.',
            image: '/images/adventure/species/sleep-elemental.png',
          },
          {
            value: 'Time Being',
            label: 'Time Being',
            subtext:
              'Exists across several moments simultaneously. The expressions do not match. The shadow is cast from the wrong direction for all of them.',
            image: '/images/adventure/species/time-being.png',
          },
          {
            value: 'Blind Mole Rat',
            label: 'Blind Mole Rat',
            subtext:
              'Built for a world without light and completely at home in it. Moving through total darkness with total confidence. Has never needed you to see what they see.',
            image: '/images/adventure/species/blind-mole-rat.png',
          },
          {
            value: 'Lion',
            label: 'Lion',
            subtext:
              'Not a lion-person. An actual lion. Regarding something off-frame with the expression of someone who has been asked a question they consider beneath them.',
            image: '/images/adventure/species/lion.png',
          },
          {
            value: 'Cat',
            label: 'Cat',
            subtext:
              'Fully aware. Chooses when to acknowledge it. The knocking things off shelves is a philosophical position.',
            image: '/images/adventure/species/cat.png',
          },
          {
            value: 'Black-Footed Cat',
            label: 'Black-Footed Cat',
            subtext:
              'Smallest wild cat in Africa. Highest kill rate of any cat on earth. Fits in your hands. This is extremely relevant information.',
            image: '/images/adventure/species/black-footed-cat.png',
          },
          {
            value: 'Dog',
            label: 'Dog',
            subtext:
              'Has decided you are worth it. This is not a small decision. They have met a lot of people.',
            image: '/images/adventure/species/dog.png',
          },
          {
            value: 'Rabbit',
            label: 'Rabbit',
            subtext:
              'Faster than expected. More opinions than anticipated. The ears are always listening and the information is always being processed.',
            image: '/images/adventure/species/rabbit.png',
          },
          {
            value: 'Ocelot',
            label: 'Ocelot',
            subtext:
              'Spotted, precise, nocturnal, and deeply uninterested in being categorised. Slightly smaller than you thought. Still a problem.',
            image: '/images/adventure/species/ocelot.png',
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
            value: 'Witch',
            label: 'Witch',
            subtext: `Knows which doors shouldn't be opened. Opens them anyway, carefully. The workbench has things in jars that should not be in jars.`,
            image: '/images/adventure/role/witch.png',
          },
          {
            value: 'Slacker',
            label: 'Slacker',
            subtext: `Conserving energy for something they haven't decided on yet. This is a strategy, not a condition.`,
            image: '/images/adventure/role/slacker.png',
          },
          {
            value: 'Netrunner',
            label: 'Netrunner',
            subtext:
              'Between two realities simultaneously, fingers on an interface that may not be physical. The real action is clearly elsewhere.',
            image: '/images/adventure/role/netrunner.png',
          },
          {
            value: 'Cupid',
            label: 'Cupid',
            subtext:
              'Created the situation. Currently watching it develop from a safe distance. Entirely too pleased with how this is going.',
            image: '/images/adventure/role/cupid.png',
          },
          {
            value: 'Accountant',
            label: 'Accountant',
            subtext:
              'Found something in the numbers. It is significant. They are the only one who knows what it is yet.',
            image: '/images/adventure/role/accountant.png',
          },
          {
            value: 'Public Notary',
            label: 'Public Notary',
            subtext:
              'Has witnessed many things and is not permitted to comment on any of them. The stamp is raised. The document is for something enormous.',
            image: '/images/adventure/role/public-notary.png',
          },
          {
            value: 'Politician',
            label: 'Politician',
            subtext:
              'Mid-gesture, expression carefully calibrated. One hand is visible. The other is not.',
            image: '/images/adventure/role/politician.png',
          },
          {
            value: 'Groupie',
            label: 'Groupie',
            subtext:
              'In the crowd but in focus. Expression: completely sincere, which is the part people always underestimate.',
            image: '/images/adventure/role/groupie.png',
          },
          {
            value: 'Musician',
            label: 'Musician',
            subtext: `Not performing for the audience — performing for the sound. The instrument is doing something instruments generally don't.`,
            image: '/images/adventure/role/musician.png',
          },
          {
            value: 'Performance Artist',
            label: 'Performance Artist',
            subtext:
              'In the middle of something that is either profound or deeply inconvenient for everyone nearby. The line between these is the point.',
            image: '/images/adventure/role/performance-artist.png',
          },
          {
            value: 'Bounty Hunter',
            label: 'Bounty Hunter',
            subtext:
              'Contract in hand, target in the background unaware. Expression: professional patience. This is just work.',
            image: '/images/adventure/role/bounty-hunter.png',
          },
          {
            value: 'Doctor',
            label: 'Doctor',
            subtext:
              'Mid-procedure, expression focused. The situation is clearly unusual. They are treating it as routine.',
            image: '/images/adventure/role/doctor.png',
          },
          {
            value: 'Lawyer',
            label: 'Lawyer',
            subtext:
              'Has read everything and found the thing. Documents arranged with geometric precision. Not triumphant — prepared.',
            image: '/images/adventure/role/lawyer.png',
          },
          {
            value: 'Space Lawyer',
            label: 'Space Lawyer',
            subtext:
              'Same as lawyer. The jurisdiction visible through the window behind them should not exist. There is precedent.',
            image: '/images/adventure/role/space-lawyer.png',
          },
          {
            value: 'Criminal Mastermind',
            label: 'Criminal Mastermind',
            subtext:
              'One finger on the plan, three steps ahead, aware of exactly which three. The plan looks plausible. That is what makes it alarming.',
            image: '/images/adventure/role/criminal-mastermind.png',
          },
          {
            value: 'Super Hero',
            label: 'Super Hero',
            subtext:
              'Something massive is happening in the background. They are about to address it. They have done this before.',
            image: '/images/adventure/role/super-hero.png',
          },
          {
            value: 'Super Villain',
            label: 'Super Villain',
            subtext:
              'Monologue in visible progress, hero presumably offscreen and restrained. Prepared remarks. Genuinely enjoying this.',
            image: '/images/adventure/role/super-villain.png',
          },
          {
            value: 'Reporter',
            label: 'Reporter',
            subtext: `Standing somewhere they probably shouldn't be standing. Notebook out. Expression: exactly as interested as the situation warrants.`,
            image: '/images/adventure/role/reporter.png',
          },
          {
            value: 'Clown',
            label: 'Clown',
            subtext:
              'Situation entirely inappropriate for the costume. Expression beneath the makeup is a different expression. They are not changing the costume.',
            image: '/images/adventure/role/clown.png',
          },
          {
            value: 'Mime',
            label: 'Mime',
            subtext:
              'Surrounded by invisible architecture that is becoming more real to the viewer with each passing moment. Absolutely committed.',
            image: '/images/adventure/role/mime.png',
          },
          {
            value: 'Assassin',
            label: 'Assassin',
            subtext: `Figure in shadow, target in light. Enormous patience in the posture. The target doesn't know. The assassin has known for some time.`,
            image: '/images/adventure/role/assassin.png',
          },
          {
            value: 'NPC',
            label: 'NPC',
            subtext:
              'Standing in a specific spot, facing a specific direction. Has said the same thing many times. Has begun to suspect they stop existing when not observed.',
            image: '/images/adventure/role/npc.png',
          },
          {
            value: 'Gambler',
            label: 'Gambler',
            subtext:
              'Cards on the table, expression carefully neutral. One hand visible. The pot is significant.',
            image: '/images/adventure/role/gambler.png',
          },
          {
            value: 'Mad Scientist',
            label: 'Mad Scientist',
            subtext:
              'Something unexpected and successful is happening in the background. Expression: delighted. Not yet concerned about what it means.',
            image: '/images/adventure/role/mad-scientist.png',
          },
          {
            value: 'Alchemist',
            label: 'Alchemist',
            subtext:
              'One transformation in visible progress. They have done this many times. Most of the time it works.',
            image: '/images/adventure/role/alchemist.png',
          },
          {
            value: 'Polymath',
            label: 'Polymath',
            subtext:
              'Surrounded by unfinished projects in several unrelated fields. Already interested in something new.',
            image: '/images/adventure/role/polymath.png',
          },
          {
            value: 'Poet',
            label: 'Poet',
            subtext:
              'Listening to something no one else can hear. Finding it adequate. The notebook is open.',
            image: '/images/adventure/role/poet.png',
          },
          {
            value: 'Waste of Space',
            label: 'Waste of Space',
            subtext:
              'Occupying a perfectly good chair with extraordinary commitment. The space is being wasted with intention.',
            image: '/images/adventure/role/waste-of-space.png',
          },
          {
            value: 'Philanthropist',
            label: 'Philanthropist',
            subtext:
              'Something significant changing hands, recipient visibly overwhelmed. Pleased but understated. The point is the gift, not the giving.',
            image: '/images/adventure/role/philanthropist.png',
          },
          {
            value: 'Troublemaker',
            label: 'Troublemaker',
            subtext:
              'Mid-exit from something that has just gone wrong in an interesting way. Not sorry — satisfied. The trouble was the point.',
            image: '/images/adventure/role/troublemaker.png',
          },
          {
            value: '',
            label: 'More callings...',
            subtext: 'Plague baker, chaos consultant, apex predator...',
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
            image: '/images/adventure/alignment/neutral-good.png',
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
            image: '/images/adventure/alignment/lawful-neutral.png',
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
            image: '/images/adventure/alignment/chaotic-neutral.png',
            subtext: 'The rules are a suggestion with too much confidence.',
          },
          {
            value: 'Lawful Evil',
            label: 'Lawful Evil',
            image: '/images/adventure/alignment/lawful-evil.png',
            subtext: 'The rules exist. I wrote several of them.',
          },
          {
            value: 'Neutral Evil',
            label: 'Neutral Evil',
            image: '/images/adventure/alignment/neutral-evil.png',
            subtext: 'The rules exist when convenient.',
          },
          {
            value: 'Chaotic Evil',
            label: 'Chaotic Evil',
            image: '/images/adventure/alignment/chaotic-evil.png',
          },
          {
            value: 'Appetite',
            label: 'Appetite',
            subtext:
              'Desire as the organizing principle. Not greed — the honest admission that wanting is the engine. The thing wanted changes. The wanting does not.',
            image: '/images/adventure/alignment/appetite.png',
          },
          {
            value: 'Onanism',
            label: 'Onanism',
            subtext:
              'To thine own self be true, above all others. The self is the only thing one can truly know and therefore the only thing worth serving. A philosophy, not a flaw.',
            image: '/images/adventure/alignment/onanism.png',
          },
          {
            value: 'Safety',
            label: 'Safety',
            subtext: `Keeping what is known and loved intact is the supreme moral good. Not cowardice — conviction. The emergency exits are always located before the show begins.`,
            image: '/images/adventure/alignment/safety.png',
          },
          {
            value: 'Curious',
            label: 'Curious',
            subtext: `Knowledge as the terminal value. Ethics is an obstacle to data, not a framework for using it. The warning label was read. It was found insufficient.`,
            image: '/images/adventure/alignment/curious.png',
          },
          {
            value: 'Petty',
            label: 'Petty',
            subtext:
              'The organizing principle is the list of grievances. The list is accurate, well-maintained, and longer than anyone suspects.',
            image: '/images/adventure/alignment/petty.png',
          },
          {
            value: 'Correct',
            label: 'Correct',
            subtext:
              'Not good, not lawful — right. Demonstrably, verifiably, on-the-record right. The ethical implications are secondary to the accuracy.',
            image: '/images/adventure/alignment/correct.png',
          },
          {
            value: 'Loyal',
            label: 'Loyal',
            subtext:
              'Aligned to a person, not a principle. Morality is whatever they need it to be. The philosophy updates when the person does.',
            image: '/images/adventure/alignment/loyal.png',
          },
          {
            value: 'Aesthetic',
            label: 'Aesthetic',
            subtext:
              'Beauty and ugliness as the only real moral categories. The good thing is the beautiful thing. The graceless thing is the evil thing. The thing is beige.',
            image: '/images/adventure/alignment/aesthetic.png',
          },
          {
            value: 'Utilitarian',
            label: 'Utilitarian',
            subtext:
              'The math is the morality. Most lives saved wins. Always. The feelings about this are irrelevant to the calculation. Someone off-frame is not going to like the answer.',
            image: '/images/adventure/alignment/utilitarian.png',
          },
          {
            value: 'Transactional',
            label: 'Transactional',
            subtext:
              'Everything is an exchange. Not mercenary — honest. Nothing is free and pretending otherwise is the only real lie. Both parties understand the terms.',
            image: '/images/adventure/alignment/transactional.png',
          },
          {
            value: '',
            label: 'Custom alignment',
            subtext: 'Any organizing principle not listed above.',
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
          "How does this entity move through the world? How do they panic, charm, sulk, recover, overcommit, and ultimately fail to learn the lesson everyone assumed they'd learned two incidents ago? Pick as many as apply. The combination is the character.",
        inputType: 'preset',
        field: 'personality',
        multiSelect: true,
        choices: [
          {
            value: 'introverted',
            label: 'Introverted',
            subtext: `Recharges in silence and spends social energy like it costs something, because it does. The quiet isn't emptiness — it's maintenance.`,
            image: '/images/adventure/quirks/introverted.png',
          },
          {
            value: 'extroverted',
            label: 'Extroverted',
            subtext:
              'Gets louder as the room fills up. Every conversation is an investment and the returns are enormous. Silence is just a room waiting to happen.',
            image: '/images/adventure/quirks/extroverted.png',
          },
          {
            value: 'passionate',
            label: 'Passionate',
            subtext:
              'When they care about something, everyone nearby learns that they care about it. The caring is contagious and non-negotiable.',
            image: '/images/adventure/quirks/passionate.png',
          },
          {
            value: 'hopeless-romantic',
            label: 'Hopeless Romantic',
            subtext:
              'Believes in love the way some people believe in weather — as a force that arrives without asking. Has been wrong before. Has not updated.',
            image: '/images/adventure/quirks/hopeless-romantic.png',
          },
          {
            value: 'foolish',
            label: 'Foolish',
            subtext:
              'Presses buttons before reading labels. Asks questions after acting. Has survived this so far through a combination of luck and being very difficult to permanently damage.',
            image: '/images/adventure/quirks/foolish.png',
          },
          {
            value: 'easily-frustrated',
            label: 'Easily Frustrated',
            subtext: `Things that should work, work. Things that shouldn't work, don't. The problem is the grey area, which is most of the world.`,
            image: '/images/adventure/quirks/easily-frustrated.png',
          },
          {
            value: 'submissive',
            label: 'Submissive',
            subtext:
              'Defers readily, listens well, lets others lead — not from weakness, but from a considered position that this is usually faster. Usually.',
            image: '/images/adventure/quirks/submissive.png',
          },
          {
            value: 'dominant',
            label: 'Dominant',
            subtext:
              'Occupies rooms the way weather does. Nobody assigned them the head of the table. They arrived there anyway.',
            image: '/images/adventure/quirks/dominant.png',
          },
          {
            value: 'narcissistic',
            label: 'Narcissistic',
            subtext:
              'Has a complicated relationship with mirrors — specifically, they think the relationship is perfect and the mirror agrees. Others are invited to observe.',
            image: '/images/adventure/quirks/narcissistic.png',
          },
          {
            value: 'nervous',
            label: 'Nervous',
            subtext:
              'Something is probably about to go wrong. They have calculated the odds. The calculation did not help. They have redone it anyway.',
            image: '/images/adventure/quirks/nervous.png',
          },
          {
            value: 'scatter-brained',
            label: 'Scatter-Brained',
            subtext:
              'Brilliant in all directions simultaneously. The problem is that directions are not the same as destinations. The keys are around here somewhere.',
            image: '/images/adventure/quirks/scatter-brained.png',
          },
          {
            value: 'bookworm',
            label: 'Bookworm',
            subtext:
              'The book is always more interesting than what is currently happening. This has occasionally been wrong. They did not enjoy those occasions.',
            image: '/images/adventure/quirks/bookworm.png',
          },
          {
            value: 'book-smart',
            label: 'Book Smart',
            subtext:
              'Has read the documentation. All of it. Will cite the relevant section. The relevant section is always exactly correct and rarely sufficient.',
            image: '/images/adventure/quirks/book-smart.png',
          },
          {
            value: 'obsequious',
            label: 'Obsequious',
            subtext:
              'So eager to please that the eagerness becomes its own kind of pressure. Means well. Applies this meaning with tremendous force.',
            image: '/images/adventure/quirks/obsequious.png',
          },
          {
            value: 'driven',
            label: 'Driven',
            subtext:
              'Has a goal. The goal is visible from their face at all times. Obstacles are categorised as temporary, permanent, or interesting.',
            image: '/images/adventure/quirks/driven.png',
          },
          {
            value: 'show-off',
            label: 'Show-Off',
            subtext:
              'Can do the thing without making it a performance, but why would they. The audience is right there. The audience did not ask to be an audience.',
            image: '/images/adventure/quirks/show-off.png',
          },
          {
            value: 'altruistic',
            label: 'Altruistic',
            subtext:
              'Helps people and expects nothing back, which is the part people find hardest to believe. The nothing is genuine. The helping is also genuine.',
            image: '/images/adventure/quirks/altruistic.png',
          },
          {
            value: 'generous',
            label: 'Generous',
            subtext:
              'Gives things away — time, objects, attention, food — with a consistency that others eventually stop questioning and start relying on.',
            image: '/images/adventure/quirks/generous.png',
          },
          {
            value: 'apathetic',
            label: 'Apathetic',
            subtext:
              'Has assessed the situation and found it within acceptable parameters. The chaos in the background is noted. It is within acceptable parameters.',
            image: '/images/adventure/quirks/apathetic.png',
          },
          {
            value: 'sarcastic',
            label: 'Sarcastic',
            subtext:
              'Says one thing and means another, but makes very sure you know which is which. The gap between them is where the humour lives.',
            image: '/images/adventure/quirks/sarcastic.png',
          },
          {
            value: 'sense-of-humor',
            label: 'Sense of Humor',
            subtext:
              'Finds things funny. Not everything, but enough. The things they find funny are very specific and theirs, and they will share them.',
            image: '/images/adventure/quirks/sense-of-humor.png',
          },
          {
            value: 'fatalistic',
            label: 'Fatalistic',
            subtext:
              'The outcome has already been determined by forces indifferent to effort. They are still here anyway. This is not optimism — it is policy.',
            image: '/images/adventure/quirks/fatalistic.png',
          },
          {
            value: 'optimist',
            label: 'Optimist',
            subtext:
              'Believes things will work out. Has evidence for this. The evidence is selective and they are aware of this and they believe it anyway.',
            image: '/images/adventure/quirks/optimist.png',
          },
          {
            value: 'pessimist',
            label: 'Pessimist',
            subtext:
              'Has prepared for the worst. The worst has not yet materialised in the precise form anticipated, which means it is still coming.',
            image: '/images/adventure/quirks/pessimist.png',
          },
          {
            value: 'logical',
            label: 'Logical',
            subtext:
              'If it cannot be reasoned, it cannot be trusted. Feelings are noted, categorised, and addressed in order of urgency. The queue is long.',
            image: '/images/adventure/quirks/logical.png',
          },
          {
            value: 'emotional',
            label: 'Emotional',
            subtext:
              'Feels things fully and in real time and occasionally before the thing has finished happening. This is efficient for some purposes.',
            image: '/images/adventure/quirks/emotional.png',
          },
          {
            value: 'charismatic',
            label: 'Charismatic',
            subtext: `People listen when they speak. They don't entirely understand why, but they have stopped questioning it and started using it.`,
            image: '/images/adventure/quirks/charismatic.png',
          },
          {
            value: 'enthusiastic',
            label: 'Enthusiastic',
            subtext:
              'Arrives already excited. The excitement is not dependent on the specifics of what is happening. The specifics will be incorporated.',
            image: '/images/adventure/quirks/enthusiastic.png',
          },
          {
            value: 'energetic',
            label: 'Energetic',
            subtext:
              'In motion more than not. The stillness, when it comes, is either sleep or something requiring serious attention.',
            image: '/images/adventure/quirks/energetic.png',
          },
          {
            value: 'hyperactive',
            label: 'Hyperactive',
            subtext:
              'Doing several things right now, will be doing several different things in a moment, has opinions about what happens in between.',
            image: '/images/adventure/quirks/hyperactive.png',
          },
          {
            value: 'ditzy',
            label: 'Ditzy',
            subtext:
              'Missing information that is technically available. The gap is not malicious — the surrounding details are simply more interesting.',
            image: '/images/adventure/quirks/ditzy.png',
          },
          {
            value: 'artistic',
            label: 'Artistic',
            subtext:
              'Sees the world as material. Everything is either beautiful, interestingly ugly, or raw potential. Most things are raw potential.',
            image: '/images/adventure/quirks/artistic.png',
          },
          {
            value: 'authoritarian',
            label: 'Authoritarian',
            subtext:
              'Rules exist for reasons and the reasons are probably good and if everyone would simply follow the rules things would go much more smoothly.',
            image: '/images/adventure/quirks/authoritarian.png',
          },
          {
            value: 'problem-solver',
            label: 'Problem-Solver',
            subtext:
              'Sees a problem and immediately starts solving it. Has not always confirmed that the problem needed to be solved. Results vary.',
            image: '/images/adventure/quirks/problem-solver.png',
          },
          {
            value: 'puzzler',
            label: 'Puzzler',
            subtext: `Delighted by complexity. The more locked, the more interesting. Has never met a system they didn't immediately want to understand entirely.`,
            image: '/images/adventure/quirks/puzzler.png',
          },
          {
            value: 'devious',
            label: 'Devious',
            subtext:
              'Plans several moves ahead. Shares only the current one. The rest are none of your business and are going very well.',
            image: '/images/adventure/quirks/devious.png',
          },
          {
            value: 'ignorant',
            label: 'Ignorant',
            subtext:
              'Confidently navigating a situation with incomplete information. The confidence is load-bearing. The information gap is not yet visible.',
            image: '/images/adventure/quirks/ignorant.png',
          },
          {
            value: 'obsessive',
            label: 'Obsessive',
            subtext:
              'When interest becomes architecture. Everything eventually connects to the thing. The thing is different from what others think the thing is.',
            image: '/images/adventure/quirks/obsessive.png',
          },
          {
            value: 'amoral',
            label: 'Amoral',
            subtext:
              'Has assessed the ethical framework and found it optional. Operates by a different system. The system is internally consistent and has been tested.',
            image: '/images/adventure/quirks/amoral.png',
          },
          {
            value: 'inventive',
            label: 'Inventive',
            subtext:
              'Sees what something could be before seeing what it is. The gap between those two things is where they spend most of their time.',
            image: '/images/adventure/quirks/inventive.png',
          },
          {
            value: 'creative-writer',
            label: 'Creative Writer',
            subtext:
              'Experiences the world as material. Everything that happens is also something that could be written down. They are writing it down.',
            image: '/images/adventure/quirks/creative-writer.png',
          },
          {
            value: 'secretive',
            label: 'Secretive',
            subtext:
              'Shares selectively. What is held back is not absence of trust — it is presence of other considerations. The ledger is private.',
            image: '/images/adventure/quirks/secretive.png',
          },
          {
            value: 'lone-wolf',
            label: 'Lone Wolf',
            subtext: `Operates better without the coordination overhead. The team is noted. The team's input will be considered. Separately.`,
            image: '/images/adventure/quirks/lone-wolf.png',
          },
          {
            value: 'team-player',
            label: 'Team Player',
            subtext:
              'Genuinely believes the group outcome matters more than the individual one. Has evidence for this. Presents it when relevant, which is always.',
            image: '/images/adventure/quirks/team-player.png',
          },
          {
            value: 'believes-psychic',
            label: `Believes They're Psychic`,
            subtext:
              'Occasionally correct in ways that are statistically explainable. Has declined the statistical explanation. The cards have not been wrong yet.',
            image: '/images/adventure/quirks/believes-psychic.png',
          },
          {
            value: 'metaphysical',
            label: 'Metaphysical',
            subtext:
              'The questions beneath the questions are the real questions. What is this, actually. No, but actually. Has not stopped asking.',
            image: '/images/adventure/quirks/metaphysical.png',
          },
          {
            value: 'superstitious',
            label: 'Superstitious',
            subtext:
              'The patterns are there if you look. The looking does not create the patterns. The patterns were already happening. The salt is just good practice.',
            image: '/images/adventure/quirks/superstitious.png',
          },
          {
            value: 'overly-literal',
            label: 'Overly Literal',
            subtext:
              'Takes the stated meaning. Every time. On purpose or not is a matter of ongoing debate. The stated meaning is right there.',
            image: '/images/adventure/quirks/overly-literal.png',
          },
          {
            value: 'compulsively-honest',
            label: 'Compulsively Honest',
            subtext:
              'Thinks the truth and then says it before the gap closes. The gap is very small. The truth is sometimes inconvenient. They are aware.',
            image: '/images/adventure/quirks/compulsively-honest.png',
          },
          {
            value: 'pathological-liar',
            label: 'Pathological Liar',
            subtext:
              'The truth is a starting point from which many directions are possible. They find the directions more interesting. So do most audiences.',
            image: '/images/adventure/quirks/pathological-liar.png',
          },
          {
            value: 'hoarder',
            label: 'Hoarder',
            subtext:
              'Everything has potential value in a future scenario they can specify. The specification changes. The objects remain. The objects are theirs.',
            image: '/images/adventure/quirks/hoarder.png',
          },
          {
            value: 'conspiracy-minded',
            label: 'Conspiracy-Minded',
            subtext:
              'Things are connected in ways not immediately visible. The board is very large. Some of the strings are definitely accurate. They know which ones.',
            image: '/images/adventure/quirks/conspiracy-minded.png',
          },
          {
            value: 'soft-spoken',
            label: 'Soft-Spoken',
            subtext:
              'Speaks quietly enough that others lean in. This is either a habit or a strategy. The distinction may not matter.',
            image: '/images/adventure/quirks/soft-spoken.png',
          },
          {
            value: 'brash',
            label: 'Brash',
            subtext:
              'Says the thing. Does the thing. Apologises later, if at all, and with genuine bafflement at why the apology was necessary.',
            image: '/images/adventure/quirks/brash.png',
          },
          {
            value: 'dramatic',
            label: 'Dramatic',
            subtext:
              'Everything deserves the full weight of its moment and they will ensure it receives this. The moment will know it was witnessed.',
            image: '/images/adventure/quirks/dramatic.png',
          },
          {
            value: 'deadpan',
            label: 'Deadpan',
            subtext:
              'Expression remains constant across all information. The absence of reaction is itself a reaction. Observers have calibrated to this.',
            image: '/images/adventure/quirks/deadpan.png',
          },
          {
            value: 'melancholy',
            label: 'Melancholy',
            subtext: `Carries something. Not visibly, not loudly — but the weight is there in the posture, in the pauses. Doesn't require fixing. Just noticing.`,
            image: '/images/adventure/quirks/melancholy.png',
          },
          {
            value: 'cheerfully-morbid',
            label: 'Cheerfully Morbid',
            subtext:
              'Has made peace with the difficult things by finding them interesting instead. The result is a cheerfulness that occasionally startles people. Good.',
            image: '/images/adventure/quirks/cheerfully-morbid.png',
          },
          {
            value: 'worrisome',
            label: 'Worrisome',
            subtext:
              'The list of things that could go wrong is thorough, documented, and updated. The documentation is not comforting. It is accurate.',
            image: '/images/adventure/quirks/worrisome.png',
          },
          {
            value: 'reckless',
            label: 'Reckless',
            subtext:
              'Assesses risk at the moment of action. The assessment is fast and optimistic. The confidence is genuine. The survivability is, so far, adequate.',
            image: '/images/adventure/quirks/reckless.png',
          },
          {
            value: 'protective',
            label: 'Protective',
            subtext:
              'Notes threats before they are confirmed as threats. Positions accordingly. Would like everyone to please stay where they can be seen.',
            image: '/images/adventure/quirks/protective.png',
          },
          {
            value: 'jealous',
            label: 'Jealous',
            subtext:
              'Tracks what others have with precision. Knows exactly what is unfair. Rarely says so. The knowing is the thing.',
            image: '/images/adventure/quirks/jealous.png',
          },
          {
            value: 'vindictive',
            label: 'Vindictive',
            subtext:
              'Does not forget. Is patient about this. The patience is the part that makes it different from anger. The difference matters.',
            image: '/images/adventure/quirks/vindictive.png',
          },
          {
            value: 'diplomatic',
            label: 'Diplomatic',
            subtext:
              'Finds the language that everyone can agree was said, regardless of whether everyone agrees on what it means. This is a skill.',
            image: '/images/adventure/quirks/diplomatic.png',
          },
          {
            value: 'blunt',
            label: 'Blunt',
            subtext:
              'Delivers information directly and at normal volume. The information is accurate. The delivery is not calibrated for reception. Both remain true.',
            image: '/images/adventure/quirks/blunt.png',
          },
          {
            value: 'curious',
            label: 'Curious',
            subtext:
              'Wants to know what is in the box before deciding if the box is relevant. The relevance can be determined after. Open the box.',
            image: '/images/adventure/quirks/curious.png',
          },
          {
            value: 'inquisitive',
            label: 'Inquisitive',
            subtext:
              'Has follow-up questions. Then follow-up follow-up questions. The questions are not rhetorical. The patience of others varies.',
            image: '/images/adventure/quirks/inquisitive.png',
          },
          {
            value: 'gullible',
            label: 'Gullible',
            subtext:
              'Assumes good faith as a baseline. Has been wrong about this. Updates locally, not globally. The baseline holds.',
            image: '/images/adventure/quirks/gullible.png',
          },
          {
            value: 'suspicious',
            label: 'Suspicious',
            subtext:
              'Something is off. Has not yet confirmed what. Will confirm before acting. The confirmation will take as long as it needs to.',
            image: '/images/adventure/quirks/suspicious.png',
          },
          {
            value: 'perfectionist',
            label: 'Perfectionist',
            subtext:
              'Good enough is not a standard that has been adopted. The standard in use is different and higher and has not yet been met.',
            image: '/images/adventure/quirks/perfectionist.png',
          },
          {
            value: 'animist',
            label: 'Animist',
            subtext:
              'Things have interiority. The rock has a perspective. The old building has accumulated something. They listen. Sometimes they hear.',
            image: '/images/adventure/quirks/animist.png',
          },
          {
            value: 'serene',
            label: 'Serene',
            subtext:
              'The chaos is noted and placed at an appropriate distance. This is not detachment — it is calibration. They are still here. They are fine.',
            image: '/images/adventure/quirks/serene.png',
          },
          {
            value: 'competitive',
            label: 'Competitive',
            subtext:
              'Has clocked the standings. Knows where they are. Knows where they want to be. The gap is information and information is motivating.',
            image: '/images/adventure/quirks/competitive.png',
          },
          {
            value: 'flirtatious',
            label: 'Flirtatious',
            subtext:
              'Defaults to charm in social interactions the way others default to handshakes. It is genuine. It is also always happening. Both are true.',
            image: '/images/adventure/quirks/flirtatious.png',
          },
          {
            value: 'daydreamer',
            label: 'Daydreamer',
            subtext:
              'Is present, technically, and also somewhere else. The somewhere else is detailed and ongoing. Check-ins are appreciated with sufficient notice.',
            image: '/images/adventure/quirks/daydreamer.png',
          },
          {
            value: 'daredevil',
            label: 'Daredevil',
            subtext:
              'The risk was assessed. The risk was found acceptable. The assessment was very quick. The ride, however, was excellent.',
            image: '/images/adventure/quirks/daredevil.png',
          },
          {
            value: '',
            label: 'Write my own',
            subtext:
              'Any disposition, orientation, or operating mode that fits.',
            opensCustom: true,
          },
        ],
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
          'Every entity has a defining trait that colours how they move through the world. Not a flaw, not a virtue — just something specific and irreducible about how they are. Pick one that fits. Or one that surprises you. The surprise is usually more interesting.',
        inputType: 'preset',
        field: 'quirks',
        choices: [
          {
            value: 'double-jointed',
            label: 'Double-Jointed',
            subtext: `Bends in directions the skeleton wasn't consulted about. Useful in tight spaces. Deeply unsettling at dinner parties.`,
            image: '/images/adventure/quirks/double-jointed.png',
          },
          {
            value: 'fortunate',
            label: 'Fortunate',
            subtext:
              'Things just tend to work out. Not through effort or skill — just a kind of ambient probability bias in their favour. Others have noticed.',
            image: '/images/adventure/quirks/fortunate.png',
          },
          {
            value: 'heterochromia',
            label: 'Heterochromia',
            subtext:
              'Two different eyes, each doing its own thing. Which one to trust is a question strangers spend too long on.',
            image: '/images/adventure/quirks/heterochromia.png',
          },
          {
            value: 'extra-body-part',
            label: 'Extra Body Part',
            subtext: `Has one more of something than expected. They've stopped explaining it. The explanations never helped.`,
            image: '/images/adventure/quirks/extra-body-part.png',
          },
          {
            value: 'musical',
            label: 'Musical',
            subtext: `Hears rhythm in everything. Taps it on surfaces without noticing. Has never been in a room that didn't have a soundtrack.`,
            image: '/images/adventure/quirks/musical.png',
          },
          {
            value: 'likes-to-dance',
            label: 'Likes to Dance',
            subtext:
              'Will dance. Does not require music, occasion, or permission. The quality varies. The commitment does not.',
            image: '/images/adventure/quirks/likes-to-dance.png',
          },
          {
            value: 'left-handed',
            label: 'Left-Handed',
            subtext:
              'Operates in a world designed for the other hand and has strong feelings about this. Adapts without comment. Remembers every inconvenience.',
            image: '/images/adventure/quirks/left-handed.png',
          },
          {
            value: 'obsessive-compulsive',
            label: 'Obsessive-Compulsive',
            subtext:
              'The order of things matters and the order of things is specific and the order of things has been disturbed. This will be addressed.',
            image: '/images/adventure/quirks/obsessive-compulsive.png',
          },
          {
            value: 'clumsy',
            label: 'Clumsy',
            subtext:
              'Not careless — the relationship between intention and execution is just slightly negotiable. Objects in the vicinity have adjusted their expectations.',
            image: '/images/adventure/quirks/clumsy.png',
          },
          {
            value: 'notably-tall',
            label: 'Notably Tall',
            subtext:
              'Ducks through doorways as a reflex. Has a perspective on most rooms that nobody else shares. This is sometimes useful and often lonely.',
            image: '/images/adventure/quirks/notably-tall.png',
          },
          {
            value: 'notably-short',
            label: 'Notably Short',
            subtext:
              'Underestimated continuously and consistently. Has built an entire operational philosophy around this. It works exceptionally well.',
            image: '/images/adventure/quirks/notably-short.png',
          },
          {
            value: 'kleptomaniac',
            label: 'Kleptomaniac',
            subtext:
              'Acquires small objects without quite meaning to. The objects are always interesting. The pockets are always full. An audit would be complicated.',
            image: '/images/adventure/quirks/kleptomaniac.png',
          },
          {
            value: 'pyromaniac',
            label: 'Pyromaniac',
            subtext:
              'Has a deep appreciation for fire as a phenomenon. Respects it. Studies it. Would like to observe more of it, under controlled conditions, please.',
            image: '/images/adventure/quirks/pyromaniac.png',
          },
          {
            value: 'lactose-intolerant',
            label: 'Lactose Intolerant',
            subtext:
              'The cheese is right there and it is extremely good and the consequences are known and this is a decision that will be made with full information.',
            image: '/images/adventure/quirks/lactose-intolerant.png',
          },
          {
            value: 'allergies',
            label: 'Allergies',
            subtext:
              'The world contains substances that have opinions about this entity. The opinions are expressed immediately and at volume.',
            image: '/images/adventure/quirks/allergies.png',
          },
          {
            value: 'addict',
            label: 'Addict',
            subtext:
              'There is something they return to. The returning is a fact, not a judgment. What they do with this fact is theirs to determine.',
            image: '/images/adventure/quirks/addict.png',
          },
          {
            value: 'secret-identity',
            label: 'Secret Identity',
            subtext:
              'The face others see is accurate but not complete. The complete version is stored somewhere safer and brought out when necessary.',
            image: '/images/adventure/quirks/secret-identity.png',
          },
          {
            value: 'always-online',
            label: 'Always Online',
            subtext:
              'Connected to everything at all times. Fully informed. Slightly exhausted. Eleven tabs open that are technically relevant.',
            image: '/images/adventure/quirks/always-online.png',
          },
          {
            value: 'messy',
            label: 'Messy',
            subtext:
              'The system is not visible to others but it is a system. Everything is exactly where it needs to be for them to know where it is.',
            image: '/images/adventure/quirks/messy.png',
          },
          {
            value: 'fashionable',
            label: 'Fashionable',
            subtext:
              'Puts thought into what they present to the world. The thought is invisible. The result is not. Both are intentional.',
            image: '/images/adventure/quirks/fashionable.png',
          },
          {
            value: 'forgetful',
            label: 'Forgetful',
            subtext:
              'The important things stay. The peripheral things — times, names, where they put the key — have a more complicated relationship with memory.',
            image: '/images/adventure/quirks/forgetful.png',
          },
          {
            value: 'animal-magnet',
            label: 'Animal Magnet',
            subtext:
              'Animals approach them. Not all animals, not always — but consistently enough that it has been noticed. They are not sure what they are doing.',
            image: '/images/adventure/quirks/animal-magnet.png',
          },
          {
            value: 'green-thumb',
            label: 'Green Thumb',
            subtext:
              'Things grow. Not everything, not everywhere — but in their presence, plants make an effort. The effort is noted and appreciated.',
            image: '/images/adventure/quirks/green-thumb.png',
          },
          {
            value: 'insomniac',
            label: 'Insomniac',
            subtext:
              'Awake when others are not. Uses the time. The time is good for things that require quiet and a tolerance for the ceiling.',
            image: '/images/adventure/quirks/insomniac.png',
          },
          {
            value: 'bad-luck-magnet',
            label: 'Bad Luck Magnet',
            subtext:
              'Things happen near them. Specific kinds of things. The probability is documented. Insurance companies have been in touch.',
            image: '/images/adventure/quirks/bad-luck-magnet.png',
          },
          {
            value: '',
            label: 'Write my own',
            subtext: 'Anything specific, irreducible, and theirs.',
            opensCustom: true,
          },
        ],
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
