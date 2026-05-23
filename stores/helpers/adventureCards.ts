// stores/helpers/adventureCards.ts
//
// Card definitions for the Adventure Character Builder.
// Tone: Disco Elysium meets Douglas Adams.
// The sheet is sentient, mildly exasperated, and rooting for you.
//
// Design contract:
//   - needsLLM: true  → AI Suggest button; calls /api/adventure/suggest
//   - needsLLM: false → generatorStore only; no API
//   - species + presentation cover physical form; no separate form field
//   - All narratives assume the entity might be anything. Even a sponge.

// ── Types ──────────────────────────────────────────────────────────────────

export type AdventureInputType =
  | 'preset' // illustrated choice buttons with optional sub-flows
  | 'text' // single-line free entry
  | 'long' // textarea
  | 'stats' // 1–6 block assignment grid
  | 'reward' // four rolled skill options per rarity tier
  | 'list' // searchable dropdown + custom text fallback
  | 'art' // field picker → prompt assembly → generation

export type PresetChoice = {
  value: string // written to sheet field; empty = triggers sub-flow
  label: string
  subtext?: string
  image?: string
  opensCustom?: boolean // reveals inline text input
  opensList?: boolean // reveals listOptions as a sub-panel
  listOptions?: string[]
}

export type AdventureStep = {
  key: string
  title: string
  narrative: string
  inputType: AdventureInputType
  field?: string // which AdventureSheet key this writes to
  choices?: PresetChoice[]
  generatorKey?: string // key into generatorStore
  listOptions?: string[] // direct option list (alternative to generatorKey)
  placeholder?: string
  inputLabel?: string
  heroImage?: string // overrides card-level heroImage
  needsLLM?: boolean
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
          'What function does this entity serve in the larger machinery of the story? This is not a moral question. The plot has a shape. Every shape requires certain load-bearing positions. What position does this one hold?',
        inputType: 'preset',
        field: 'role',
        choices: [
          {
            value: 'Hero',
            label: 'The Hero',
            subtext:
              'Central. Determined. The plot happens to them on purpose.',
            image: '/images/adventure/role/hero.png',
          },
          {
            value: 'Companion',
            label: 'The Companion',
            subtext: 'Indispensable. Often the one who actually solves it.',
            image: '/images/adventure/role/companion.png',
          },
          {
            value: 'Rival',
            label: 'The Rival',
            subtext:
              "A mirror. Wants the same thing. Worse. They've already seen your move.",
            image: '/images/adventure/role/rival.png',
          },
          {
            value: 'Mentor',
            label: 'The Mentor',
            subtext:
              'Has seen this before. Will not say so directly. Looks tired in an earned way.',
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
          'Every story has a gravitational field — a genre-mass that bends all events toward itself. The cozy horror and the alien bureaucracy thriller are the same distance from the truth. They just dress differently.',
        inputType: 'list',
        field: 'genre',
        generatorKey: 'genre',
        placeholder: 'Cozy horror, alien bureaucracy, bog punk opera...',
        inputLabel: 'Genre',
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
    restoresFields: ['name', 'honorific', 'title'],
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
      {
        key: 'title',
        title: 'Epithet',
        narrative:
          'Optional. An epithet, formal billing, or rumour that hardened into a proper noun. The Lantern of Wrong Tuesdays. The Smell Before Rain. Currently Under Investigation. All valid. All earned in ways that do not require explanation.',
        inputType: 'text',
        field: 'title',
        generatorKey: 'title',
        placeholder:
          'The Lantern of Wrong Tuesdays, Currently Under Investigation...',
        inputLabel: 'Epithet',
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
          'What is this entity? Biologically, taxonomically, cosmically, or in terms of whatever classification system applies. Species is origin — not destiny. It is the factory configuration. Many of the most interesting entities have done significant custom work on theirs.',
        inputType: 'list',
        field: 'species',
        generatorKey: 'species',
        placeholder:
          'Sentient Sponge, Distributed Gas Cloud, Haunted Concept...',
        inputLabel: 'Species',
      },
      {
        key: 'characterClass',
        title: 'Calling',
        narrative:
          "A class is a compacted life decision. Everything practiced, everything they've been called, the specific shape their existence has taken from doing one thing repeatedly in the direction of the world. Any answer is acceptable. 'Unknown' is a class. 'The Thing That Does The Thing' is a class.",
        inputType: 'list',
        field: 'class',
        generatorKey: 'class',
        placeholder: 'Apex Predator (Retired), Load-Bearing Wall (Awakened)...',
        inputLabel: 'Calling',
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
            value: 'Chaotic Good',
            label: 'Chaotic Good',
            subtext: 'The outcome is good. The method is negotiable.',
            image: '/images/adventure/alignment/chaotic.png',
          },
          {
            value: 'Chaotic Neutral',
            label: 'Chaotic Neutral',
            subtext: 'The rules are a suggestion with too much confidence.',
          },
          {
            value: 'True Neutral',
            label: 'True Neutral',
            subtext: 'The rules exist. Everything does.',
            image: '/images/adventure/alignment/neutral.png',
          },
          {
            value: 'Lawful Evil',
            label: 'Lawful Evil',
            subtext: 'The rules exist. I wrote several of them.',
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
      'Every entity carries a frequency — a way of being legible to others before a single word or signal has been exchanged. Some have thought carefully about this. Some inherited it by accident. Some are a colour. Some are a temperature. Some are a bureaucratic process that has developed opinions. The question applies to all of them, though the answers look different.',
    required: true,
    restoresFields: ['gender', 'presentation'],
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
      {
        key: 'presentation',
        title: 'Presentation',
        narrative:
          'How does this entity show up in the world? Not internally — externally. What do others register before interaction begins? A sponge presents as a sponge, which is useful information. A gas cloud presents differently on Tuesdays. An office printer presents as deeply, specifically resentful. All presentations are valid data for the portrait.',
        inputType: 'long',
        field: 'presentation',
        generatorKey: 'presentation',
        needsLLM: true,
        placeholder:
          'Glamorous under protest. A vaguely threatening ovoid. Shaped like an accusation...',
        inputLabel: 'Presentation',
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
    restoresFields: ['personality', 'drive'],
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
      {
        key: 'drive',
        title: 'Drive',
        narrative:
          "What does this entity want badly enough to make a questionable decision about it? Drive is the engine of plot. It does not need to be grand. 'I want to be left alone' has started wars. Even a non-sentient sponge wants to absorb things. That counts.",
        inputType: 'long',
        field: 'drive',
        generatorKey: 'drive',
        needsLLM: true,
        placeholder:
          "To find someone who doesn't want to be found. To absorb every experience available. To be believed, just once, without evidence...",
        inputLabel: 'Drive',
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
      "Every entity has a past. Even the sponge has a past — it's mostly about being a sponge, which is more complex than it sounds. All pasts contain the same basic elements: something wanted, something lost, something done about it, and one detail that doesn't quite fit but keeps surfacing at the least helpful moment.",
    required: true,
    restoresFields: ['backstory', 'achievements', 'quirks'],
    steps: [
      {
        key: 'backstory',
        title: 'Backstory',
        narrative:
          'Write the backstory. It should contain desire, trouble, history, and one excellent emotional bruise — the kind that has healed badly and gets pressed on at exactly the wrong moment by exactly the wrong entity.',
        inputType: 'long',
        field: 'backstory',
        needsLLM: true,
        placeholder:
          'They were created in a lab that no longer admits to having existed. They remember the before-time...',
        inputLabel: 'Backstory',
      },
      {
        key: 'achievements',
        title: 'Achievements',
        narrative:
          "What have they done? What do others say they've done? What have they done that they're still working out whether it counts? Accomplishments, rumours, failures being rebranded, titles earned the hard way.",
        inputType: 'long',
        field: 'achievements',
        generatorKey: 'achievement',
        needsLLM: true,
        placeholder:
          'Outlasted three prophecies about them. Received an apology from the ocean. Survived the Incident Without Knowing What the Incident Was...',
        inputLabel: 'Achievements',
      },
      {
        key: 'quirks',
        title: 'Quirks',
        narrative:
          "Every entity has habits the writer didn't plan. Small repeated behaviours, tells that give them away. These are the details others quote later. Give them two or three. Make them specific.",
        inputType: 'text',
        field: 'quirks',
        generatorKey: 'quirk',
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
