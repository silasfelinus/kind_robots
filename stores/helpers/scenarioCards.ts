// stores/helpers/scenarioCards.ts
//
// Card definitions for the Scenario Builder.
// A Scenario is a popup prompt with 1–4 choice responses.
// Can drive art generation, morality problems, riddles, story beats, or dungeon events.
//
// Schema: title, description, intros (pipe-separated), genres, inspirations,
//         locations, tier, group, difficulty, secretNotes, artPrompt

import type { BuilderCard } from '@/stores/helpers/builderCards'

// ── Genre + extended list (shared with adventure/pitch) ────────────────────

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

// ── Tier presets ───────────────────────────────────────────────────────────

export const TIER_PRESETS: string[] = [
  'introduction',
  'tutorial',
  'trap',
  'puzzle',
  'riddle',
  'encounter',
  'boss',
  'social',
  'moral',
  'discovery',
  'climax',
  'epilogue',
  'sidequest',
  'interlude',
  'mystery',
]

// ── Scenario type examples ─────────────────────────────────────────────────
// Used to help LLM understand what kind of scenario is being written

export type ScenarioTypeTag = {
  key: string
  label: string
  subtext: string
}

export const SCENARIO_TYPES: ScenarioTypeTag[] = [
  {
    key: 'story',
    label: 'Story Beat',
    subtext: 'A moment in an ongoing narrative. Sets up something larger.',
  },
  {
    key: 'moral',
    label: 'Moral Dilemma',
    subtext: 'No good answer. Every choice has a cost.',
  },
  {
    key: 'riddle',
    label: 'Riddle',
    subtext: 'One correct answer exists. Hints may or may not be forthcoming.',
  },
  {
    key: 'art',
    label: 'Art Scene',
    subtext: 'Each choice generates a different scene. Visual storytelling.',
  },
  {
    key: 'trap',
    label: 'Trap',
    subtext: 'Something bad is about to happen. The question is how bad.',
  },
  {
    key: 'puzzle',
    label: 'Puzzle',
    subtext:
      'Multiple solutions. The right one requires specific knowledge or items.',
  },
  {
    key: 'encounter',
    label: 'Encounter',
    subtext:
      'Someone or something is here. What happens next depends on approach.',
  },
  {
    key: 'social',
    label: 'Social Event',
    subtext: 'Words are the weapons. The outcome depends on what gets said.',
  },
  {
    key: 'discovery',
    label: 'Discovery',
    subtext: 'Something has been found. What it means is still unclear.',
  },
  {
    key: 'boss',
    label: 'Boss Moment',
    subtext: 'Everything has led here. There is no walking away from this one.',
  },
]

// ── Cards ──────────────────────────────────────────────────────────────────

export const SCENARIO_CARDS: BuilderCard[] = [
  // ── Genre ──────────────────────────────────────────────────────────────
  {
    key: 'genre',
    label: 'Genre',
    title: 'The gravitational field',
    icon: 'kind-icon:compass',
    flourish: '⊕',
    deckImage: '/images/scenarios/genre.webp',
    heroImage: '/images/scenarios/genre.webp',
    tagline: 'What kind of story does this scenario live inside.',
    narrative:
      'Genre shapes everything — the stakes, the tone, the kind of trouble that makes sense here. A trap in a horror scenario is different from a trap in a comedy, even if the mechanism is identical. Name the field this scenario inhabits.',
    required: true,
    restoresFields: ['genres', 'inspirations'],
    steps: [
      {
        key: 'scenarioGenre',
        title: 'Genre',
        narrative:
          'What genre does this scenario belong to? Choose one or more that fit. Genres are stored as a comma-separated string — multiple selections are combined.',
        inputType: 'preset',
        field: 'genres',
        choices: [
          {
            value: 'Gothic Comedy',
            label: 'Gothic Comedy',
            subtext: 'Elegant decay. Comedic timing in the crypt.',
            image: '/images/adventure/genre/gothic.webp',
          },
          {
            value: 'Cozy Horror',
            label: 'Cozy Horror',
            subtext: 'Something outside the window. Cup of tea inside.',
            image: '/images/adventure/genre/cozy.webp',
          },
          {
            value: 'Mythic Sci-Fi',
            label: 'Mythic Sci-Fi',
            subtext: 'Gods with spaceships. Heroes with launch codes.',
            image: '/images/adventure/genre/science-fiction.webp',
          },
          {
            value: 'Cosmic Dread',
            label: 'Cosmic Dread',
            subtext: 'Tiny figure. Enormous moon. The moon has a door.',
            image: '/images/adventure/genre/cosmic.webp',
          },
          {
            value: 'Fantasy',
            label: 'Classic Fantasy',
            subtext:
              'Dragon on a castle. The dragon is reading something, unconcerned.',
            image: '/images/adventure/genre/fantasy.webp',
          },
          {
            value: 'Mystery',
            label: 'Mystery',
            subtext: 'The magnifying glass is pointed at the viewer.',
            image: '/images/adventure/genre/mystery.webp',
          },
          {
            value: 'Horror',
            label: 'Horror',
            subtext:
              'The reaching hand is coming from the lantern, not the ground.',
            image: '/images/adventure/genre/horror.webp',
          },
          {
            value: 'Romance',
            label: 'Romance',
            subtext:
              'Two figures almost touching. Both looking at the same third thing.',
            image: '/images/adventure/genre/romance.webp',
          },
          {
            value: 'Comedy',
            label: 'Comedy',
            subtext: 'Motion lines that spell something.',
            image: '/images/adventure/genre/comedy.webp',
          },
          {
            value: 'Pastoral Apocalypse',
            label: 'Pastoral Apocalypse',
            subtext: 'Green sky. Laundry still on the line.',
            image: '/images/adventure/genre/apocalypse.webp',
          },
          {
            value: 'Carnival',
            label: 'Carnival',
            subtext: 'Abandoned fairground, still running. There is a queue.',
            image: '/images/adventure/genre/carnival.webp',
          },
          {
            value: 'Infinite Archive',
            label: 'Infinite Archive',
            subtext: 'The book is reading back.',
            image: '/images/scenarios/genre/infinite-archive.webp',
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
            subtext: 'Any genre, vibe, or gravitational field.',
            opensCustom: true,
          },
        ],
      },
      {
        key: 'scenarioInspirations',
        title: 'Inspirations',
        narrative:
          'What inspired this scenario? Films, games, books, other media — these help the LLM understand the register and tone. Comma-separated. Optional but useful.',
        inputType: 'text',
        field: 'inspirations',
        optional: true,
        placeholder:
          'Studio Ghibli, Disco Elysium, The Princess Bride, Kafka...',
        inputLabel: 'Inspirations',
        maxLength: 500,
      },
    ],
  },

  // ── Title ──────────────────────────────────────────────────────────────
  {
    key: 'title',
    label: 'Title',
    title: 'What it is called',
    icon: 'kind-icon:edit',
    flourish: '✒',
    deckImage: '/images/scenarios/title.webp',
    heroImage: '/images/scenarios/title.webp',
    tagline: 'The name. Usually two to five words.',
    narrative:
      "The title is what players will see before they know what the scenario contains. It should create anticipation without explaining everything. 'The Locked Room' tells you where you are. 'The Room That Locks From The Inside' tells you what the problem is.",
    required: true,
    restoresFields: ['title'],
    steps: [
      {
        key: 'scenarioTitle',
        title: 'Title',
        narrative:
          'Name the scenario. Clear enough to be understood, evocative enough to be remembered.',
        inputType: 'text',
        field: 'title',
        placeholder:
          "The Zombie Fashion Runway, A Kitsune's Heart, The Locked Door...",
        inputLabel: 'Title',
        maxLength: 255,
        needsLLM: true,
      },
    ],
  },

  // ── Description ────────────────────────────────────────────────────────
  {
    key: 'description',
    label: 'Description',
    title: 'The setup',
    icon: 'kind-icon:book',
    flourish: '§',
    deckImage: '/images/scenarios/description.webp',
    heroImage: '/images/scenarios/description.webp',
    tagline: 'What the player reads before choosing.',
    narrative:
      'The description is what sets the scene before any choices are presented. It should establish situation, stakes, and tone — enough for the player to feel grounded. The intros are what they choose between; the description is why those choices matter.',
    required: true,
    restoresFields: ['description'],
    steps: [
      {
        key: 'scenarioDescription',
        title: 'Description',
        narrative:
          'Write the scenario setup. Situation, stakes, tone. Two to five sentences is usually enough — more if the scenario is complex. This appears before the choices.',
        inputType: 'long',
        field: 'description',
        placeholder:
          "The apocalypse has never looked so chic. Zombies have taken over Fashion Week, and they're here to slay — literally...",
        inputLabel: 'Description',
        needsLLM: true,
      },
    ],
  },

  // ── Intros ─────────────────────────────────────────────────────────────
  {
    key: 'intros',
    label: 'Intros',
    title: 'The choices',
    icon: 'kind-icon:layers',
    flourish: '◈',
    deckImage: '/images/scenarios/intros.webp',
    heroImage: '/images/scenarios/intros.webp',
    tagline: 'The 1–4 options the player chooses between.',
    narrative:
      'Intros are the choices. Each one is a complete scenario prompt — a situation the player is dropped into, framed as an opening scene rather than a question. Write them like opening lines of a story, not a menu of options. The player picks one and everything follows from there.',
    required: true,
    restoresFields: ['intros'],
    steps: [
      {
        key: 'scenarioIntros',
        title: 'Intros',
        narrative:
          "Write 1–4 scenario intros. Each should be a self-contained opening — dramatic, specific, and immediately engaging. They're stored as pipe-separated strings. Use the 'Add Another' button to add more. Each can be refined individually with the AI.",
        inputType: 'intros',
        field: 'intros',
        needsLLM: true,
        placeholder: 'TITLE IN CAPS: The situation opens with...',
      },
    ],
  },

  // ── Locations ──────────────────────────────────────────────────────────
  {
    key: 'locations',
    label: 'Locations',
    title: 'Where it happens',
    icon: 'kind-icon:map',
    flourish: '◎',
    deckImage: '/images/scenarios/locations.webp',
    heroImage: '/images/scenarios/locations.webp',
    tagline: 'Optional. Places the scenario can take place.',
    narrative:
      'Locations give the scenario physical grounding. They can be a single place or a comma-separated list of possible settings — each one a scene where this scenario might unfold.',
    required: false,
    restoresFields: ['locations'],
    steps: [
      {
        key: 'scenarioLocations',
        title: 'Locations',
        narrative:
          'Name the locations where this scenario takes place. Comma-separated. These can be used to generate art, assign to Dreams, or give the LLM spatial context.',
        inputType: 'text',
        field: 'locations',
        optional: true,
        placeholder:
          'Underground Fashion Week Venue, Zombie HQ, Catwalk of Chaos...',
        inputLabel: 'Locations',
      },
    ],
  },

  // ── Classification ─────────────────────────────────────────────────────
  {
    key: 'classification',
    label: 'Classify',
    title: 'Tier, group, difficulty',
    icon: 'kind-icon:target',
    flourish: '⊗',
    deckImage: '/images/scenarios/classification.webp',
    heroImage: '/images/scenarios/classification.webp',
    tagline: 'Optional. How this scenario fits into a larger system.',
    narrative:
      "Tier, group, and difficulty allow scenarios to be organised into systems. A dungeon might have 'trap' tier encounters at difficulty 2 in the 'dungeon-one' group. None of this is required — it only matters if you're building something larger.",
    required: false,
    restoresFields: ['tier', 'group', 'difficulty'],
    steps: [
      {
        key: 'scenarioClassification',
        title: 'Classification',
        narrative:
          'Choose a tier, name the group, set a difficulty. All optional. Tier is a string label. Group is how you cluster this with related scenarios. Difficulty is a number (1 = easiest).',
        inputType: 'classification',
        optional: true,
      },
    ],
  },

  // ── Secret Notes ───────────────────────────────────────────────────────
  {
    key: 'secretNotes',
    label: 'Secret Notes',
    title: 'Instructions after the choice',
    icon: 'kind-icon:eye',
    flourish: '◉',
    deckImage: '/images/scenarios/secret.webp',
    heroImage: '/images/scenarios/secret.webp',
    tagline: "Optional. What the LLM knows that the player doesn't.",
    narrative:
      "Secret notes are instructions to the language model that run after the player makes a choice. They can shape how the AI responds, add hidden context, specify output formats, or introduce consequences the player hasn't anticipated yet.",
    required: false,
    restoresFields: ['secretNotes'],
    steps: [
      {
        key: 'scenarioSecretNotes',
        title: 'Secret Notes',
        narrative:
          'Write instructions for the AI to follow after a choice is made. These are not shown to the player. You can include: hidden context, consequence rules, format requirements, or follow-up choices to generate.',
        inputType: 'long',
        field: 'secretNotes',
        optional: true,
        placeholder:
          'After the user makes a choice, always respond in-character as the zombie judge. Include a rating out of 10 and a dramatic verdict...',
        inputLabel: 'Secret Notes',
        needsLLM: false,
      },
    ],
  },

  // ── Art ────────────────────────────────────────────────────────────────
  {
    key: 'art',
    label: 'Art',
    title: 'Make it visible',
    icon: 'kind-icon:palette',
    flourish: '▣',
    deckImage: '/images/scenarios/art.webp',
    heroImage: '/images/scenarios/art.webp',
    tagline: 'Optional. An image for the scenario.',
    narrative:
      "An image makes a scenario real in a way text alone doesn't. Build the art prompt from the title, description, and genre — then generate.",
    required: false,
    restoresFields: ['artPrompt', 'artImageId', 'imagePath'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'scenarioArt',
        title: 'Build the Image',
        narrative:
          "Build an art prompt that captures the scenario's mood and setting. Scene illustration, atmospheric, narrative art.",
        inputType: 'art',
        field: 'artPrompt',
        optional: true,
        needsLLM: true,
      },
    ],
  },
]
