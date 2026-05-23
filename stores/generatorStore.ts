// stores/generatorStore.ts
//
// Model-agnostic random generation and lookup tables.
// No API calls. No LLM. Pure deterministic chaos.
// Covers any entity type: human, furry, alien, monster, sentient appliance,
// abstract concept, or non-sentient sponge with strong opinions.

import { defineStore } from 'pinia'

// ── Types ──────────────────────────────────────────────────────────────────

type Rarity = 'COMMON' | 'UNCOMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC'

export type RewardEntry = {
  label: string
  text: string
  power: string
  icon: string
}

export type RolledReward = RewardEntry & {
  id: string
  rarity: Rarity
}

// ── Lookup tables ──────────────────────────────────────────────────────────

const GIVEN_NAMES: string[] = [
  // Classic fantasy
  'Voss',
  'Mira',
  'Cael',
  'Talin',
  'Sable',
  'Wren',
  'Osric',
  'Lyra',
  'Bramble',
  'Cinder',
  'Orin',
  'Vesper',
  'Rue',
  'Sorrel',
  'Draven',
  'Ixa',
  'Quin',
  'Zephyr',
  'Aldric',
  'Nin',
  'Corvin',
  'Maeve',
  'Tane',
  'Kestrel',
  'Birch',
  'Elio',
  'Thrace',
  'Willa',
  'Casimir',
  'Fenn',
  'Solace',
  'Tova',
  'Riven',
  'Lark',
  'Bastian',
  'Yael',
  'Cress',
  'Ondine',
  'Emrys',
  'Seren',
  'Nyx',
  'Arlo',
  'Dove',
  'Jael',
  'Corin',
  // Sci-fi / alien
  'Xyl',
  'Veth',
  'Orrin-7',
  'Koss',
  'Zelpha',
  'Drez',
  'Nuen',
  'Pakk',
  'Thrix',
  'Quell',
  'Siv',
  'Azen',
  'Murv',
  'Blip',
  'Orrery',
  // Anime / J-flavour
  'Haru',
  'Sora',
  'Ren',
  'Kaji',
  'Yuki',
  'Taro',
  'Mio',
  'Riku',
  'Saku',
  'Nami',
  'Hana',
  'Kenji',
  'Izuna',
  'Tokki',
  'Shio',
  // Designations and objects
  'Unit 7',
  'Protocol-9',
  'The Clicking Sound',
  'Error',
  'Patch',
  'Null',
  'Beacon',
  'Frequency',
  'Remnant',
  'Index',
  'Cache',
  // Furry / animal-coded
  'Brambleclaw',
  'Dustpaw',
  'Siltwhisker',
  'Embertail',
  'Coldsnap',
  'Thornback',
  'Hollowfang',
  'Riversong',
  'Ashpelt',
  'Moonwarden',
]

const SURNAMES: string[] = [
  'Ashkroft',
  'Thorn',
  'Bellamy',
  'Crane',
  'Dusk',
  'Ember',
  'Fallow',
  'Garnet',
  'Hollis',
  'Lacuna',
  'Morrow',
  'Nox',
  'Pale',
  'Quarry',
  'Rook',
  'Silt',
  'Tallow',
  'Umbra',
  'Vale',
  'Wick',
  'Blacktide',
  'Coldwater',
  'Flint',
  'Greymarch',
  'Halfmoon',
  'Ironbell',
  'Longmire',
  'Northgate',
  'Overhill',
  'Pilgrim',
  'Saltmarsh',
  'Underwood',
  // Compound / alien
  'of-the-Drift',
  'ex-Null',
  'formerly-Burning',
  'né-Void',
  'the-Third',
  'Undesignated',
  'Provisional',
  'Pending-Review',
]

const HONORIFICS: string[] = [
  // Standard
  'adventurer',
  'captain',
  'oracle',
  'doctor',
  'agent',
  'specialist',
  'director',
  'commander',
  'professor',
  'reverend',
  'elder',
  // Ironic / bureaucratic
  'the esteemed',
  'formerly known as',
  'technically still a',
  'acting',
  'emeritus',
  'self-described',
  'locally known as',
  'the one they call',
  'reluctant',
  'provisional',
  'the alleged',
  'not officially a',
  'briefly famous',
  'recently retired',
  'once called',
  'junior',
  'senior',
  'the only',
  // Genre-specific
  'pilot',
  'warden',
  'seer',
  'adept',
  'operative',
  'handler',
  'archivist',
  'herald',
  'the last known',
  'designated',
]

const TITLES: string[] = [
  'The Lantern of Wrong Tuesdays',
  'Twice-Returned',
  'Undefeated in Breakfasts',
  'The Reasonably Cautious',
  'Keeper of Mostly Correct Maps',
  'Once Bitten, Twice Documented',
  'The Unavoidable',
  'Extensively Warned',
  'The Marginally Legendary',
  'Survivor of the Incident',
  'The Technically Correct',
  'Bane of Incomplete Sentences',
  'The Unexpectedly Reliable',
  'Holder of the Last Good Pen',
  'The One Who Came Back',
  'Professionally Mysterious',
  'Author of Several Apologies',
  'The Mostly Harmless',
  'Certified Unusual',
  'The Quietly Dangerous',
  'Witness to the Third Thing',
  'Famed Briefly in the North',
  'The Formerly Inevitable',
  'Subject of a Footnote',
  'Currently Under Investigation',
  'The Smell Before Rain',
  'Documented Anomaly',
  'Filed Under Miscellaneous',
  'The Exception',
  'Error in the Record',
  'Not Listed',
  'Recommended for Deletion',
  'The One the Maps Got Wrong',
]

const SPECIES: string[] = [
  // Classic fantasy
  'Human (complicated)',
  'Elf (seasonal)',
  'Dwarf (structural)',
  'Halfling',
  'Tiefling (legacy)',
  'Orc (reformed)',
  'Gnome (theoretical)',
  'Aasimar (lapsed)',
  'Changeling',
  'Warforged',
  'Tabaxi',
  'Tortle',
  'Harengon',
  'Owlin',
  'Loxodon',
  'Plasmoid',
  // Fantastical / weird
  'Moon-Moth Hybrid',
  'Clockwork Saint',
  'Marsh-Drake',
  'Fey-Touched',
  'Dryad (partial)',
  'River-Touched',
  'Archive Spirit',
  'Twice-Cursed',
  // Sci-fi / space
  'Void-Walker',
  'Deep-Swimmer',
  'Cloud-Born',
  'Probability Hermit',
  'Crystalline Entity',
  'Silicon Collective',
  'Orbital Descendant',
  'Signal-Born',
  'Vacuum-Adapted',
  'Hive Delegate',
  'Nested Intelligence',
  'Substrate Being',
  'Resonance Construct',
  'Dark Matter Adjacent',
  // Horror
  'Undead (administrative)',
  'Ghost (provisional)',
  'Revenant',
  'Eldritch Offshoot',
  'Hollow',
  'Parasite Host (recovered)',
  'Formerly Human',
  'Fungal Colony',
  'The Thing That Looks Like One',
  'Living Nightmare (domesticated)',
  'Flesh Golem (self-assembled)',
  // Anime / manga coded
  'Kitsune',
  'Tanuki',
  'Oni',
  'Tengu',
  'Dragon-Touched',
  'Yokai Hybrid',
  'Celestial Bloodline',
  'Cursed Lineage',
  'Magical Construct',
  'Familiar (ascended)',
  // Furry / animal
  'Lupine',
  'Vulpine',
  'Felid',
  'Avian',
  'Ursine',
  'Cervid',
  'Mustelid',
  'Draconic',
  'Serpentine',
  'Leporine',
  'Hyena-Kin',
  'Shark-Touched',
  'Otter-Kin',
  'Bat-Kin',
  'Caprine',
  // Objects and phenomena
  'Sentient Sponge',
  'Awakened Furniture',
  'Haunted Appliance',
  'Ambulatory Plant',
  'Self-Aware Weather Pattern',
  'Living Painting',
  'Distributed Gas Cloud',
  'Animate Shadow',
  'Emergent Algorithm',
  'Recursive Loop',
  'The Idea of a Person',
  // Alien
  'Cephalopoid',
  'Silicon-Based Lifeform',
  'Colony Organism',
  'Radially Symmetric Entity',
  'Non-Euclidean Being',
  'Extradimensional Visitor',
  'Hive Fragment',
  'Gestalt Entity',
]

const CLASSES: string[] = [
  // Classic RPG
  'Oracle',
  'Rogue',
  'Bard',
  'Ranger',
  'Paladin',
  'Fighter',
  'Wizard',
  'Sorcerer',
  'Warlock',
  'Monk',
  'Druid',
  'Cleric',
  'Artificer',
  // Weird fantasy
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
  // Sci-fi
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
  'Gravity Specialist',
  'Organic Interface',
  'Decommissioned Weapon',
  'Archive Node',
  // Horror
  'Investigator',
  'Hunter',
  'Occultist',
  'Medium',
  'Cultist (recovering)',
  'Thing That Hunts Things',
  'Chronicler of the Wrong',
  'Last Survivor',
  'Containment Specialist',
  'The Bait (professional)',
  // Anime
  'Transfer Student',
  'Rival',
  'Chosen Hero',
  'Dark Parallel',
  'Mentor (deceased, complicated)',
  'Tournament Bracket Champion',
  'The One With The Forbidden Power',
  'Training Arc Protagonist',
  'Reluctant Team Leader',
  'Comic Relief (evolved)',
  // Corporate / office
  'Middle Manager (haunted)',
  'Designated Protagonist',
  'Corporate Synergy Entity',
  'Brand Ambassador (rogue)',
  'Performance Review Subject',
  'The One Who Knows Where The Bodies Are',
  'Compliance Officer (former)',
  'Meeting Facilitator (unhinged)',
  // Object / creature callings
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

const GENRES: string[] = [
  // Core
  'Gothic Comedy',
  'Mythic Sci-Fi',
  'Cozy Horror',
  'Cosmic Dread',
  'Pastoral Apocalypse',
  'Maritime Mystery',
  'Existential Swashbuckling',
  'Heist Mythology',
  'Tender Apocalypse',
  'Haunted Procedural',
  // Weird fiction
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
  // Anime / manga flavours
  'Isekai (reluctant)',
  'Slice of Life (complicated)',
  'Shonen (aging protagonist)',
  'Magical Girl (retired)',
  'Mecha Opera',
  'Tournament Arc',
  'School Horror',
  'Reverse Isekai',
  // Sci-fi variants
  'Solarpunk',
  'Vaporwave Dystopia',
  'Hard Sci-Fi (soft feelings)',
  'Generation Ship Drama',
  'First Contact Comedy',
  'Deep Space Western',
  'Alien Bureaucracy',
  'Corporate Sci-Fi',
  'Clockpunk Opera',
  // Horror flavours
  'J-Horror',
  'Body Horror (tender)',
  'Cryptid Documentary',
  "Kaiju (from the kaiju's perspective)",
  'Folk Horror',
  'Fungal Horror',
  // Furry / creature genres
  'Furry Pastoral',
  'Aquatic Opera',
  'Sky Nomad',
  'Underground Society',
  'Predator / Prey Romance (complicated)',
  // Office / mundane
  'Office Thriller',
  'Lovecraftian Office Comedy',
  'Corporate Espionage',
  'Middle Management Horror',
  'The Extremely Long Meeting',
  'Performance Review Arc',
  // Refined additions
  'Noir (one detail wrong)',
  'Carnival (abandoned, still running)',
  'Infinite Archive',
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

const ALIGNMENT_ETHICS: string[] = [
  'Lawful',
  'Chaotic',
  'Neutral',
  'Functionally',
  'Technically',
  'Theoretically',
  'Aspirationally',
  'Reluctantly',
  'Occasionally',
  'Professionally',
  'Emotionally',
  'Bureaucratically',
  'Academically',
  'Historically',
  'Contextually',
  'Aggressively',
  'Passively',
  'Selectively',
  'Conditionally',
  'Formerly',
]

const ALIGNMENT_MORALS: string[] = [
  'Good',
  'Evil',
  'Petty',
  'Helpful',
  'Dramatic',
  'Correct',
  'Hungry',
  'Tired',
  'Confused',
  'Optimistic',
  'Reasonable',
  'Inconvenient',
  'Inevitable',
  'Pending',
  'Motivated',
  'Distracted',
  'Correct (disputed)',
  'Fine',
  'Trying',
  'Apologetic',
]

const QUIRKS: string[] = [
  'Apologises to doors',
  'Counts exits before compliments',
  'Cannot lie while seated',
  'Names all tools immediately and grieves them when lost',
  'Keeps a list of everyone who has ever been correct',
  'Hums when nervous — a different tune each time',
  'Asks for the bad news first; forgets to ask for the good',
  'Refuses to enter rooms that smell of cinnamon',
  'Maintains exactly one active grudge from a previous life',
  'Always knows what time it is; refuses to share this information',
  'Collects doomed spoons',
  'Flinches at specific chord progressions',
  'Has memorised three irrelevant poems and recites them at optimal moments',
  'Refuses to sit with their back to the door, even in closets',
  'Sends apology notes weeks before the incident',
  "Knows the names of everyone's grandmothers",
  'Always carries an exit gift for parties they might need to leave suddenly',
  'Whispers when confident, speaks loudly when uncertain',
  'Has a different expression for each kind of bad news',
  'Keeps a running list of rules they have technically not broken',
  'Always knows where the nearest body of water is',
  'Says goodbye to each room before leaving',
  'Believes in luck and tests it constantly',
  'Categorises strangers by which bird they most resemble',
  "Finishes other people's interrupted sentences, always incorrectly",
  'Carries spare names in case they need an alias immediately',
  'Rates every chair upon sitting (internally, never aloud)',
  'Makes eye contact only during the important parts',
  'Rearranges furniture before difficult conversations',
  'Always has two contingency plans and forgets which one is current',
  'Refers to their past self in third person',
  "Keeps a small rock from every place they've escaped from",
  "Apologises preemptively to anyone they're about to disappoint",
  // Non-human quirks
  'Emits a faint harmonic when content',
  'Changes colour slightly when lying (claims this is a myth)',
  'Absorbs information by physical contact; does not mention this',
  'Processes emotions approximately three hours after the event',
  'Loses mass when sad; regains it when interested',
  'Cannot enter a building without first circling it once',
  'Produces a scent like petrichor when startled',
  "Communicates in a language that hasn't been invented yet",
  "Leaves rooms exactly as they found them, including the previous occupant's mood",
  'Photosynthesises under stress',
  'Gets louder as the room gets quieter',
]

const ACHIEVEMENTS: string[] = [
  'Survived brunch with ghosts',
  'Defeated the Tax Hydra',
  'Named a star (informally; the name has not been accepted)',
  'Escaped a locked room everyone agreed was escape-proof',
  'Started a cult by accident',
  'Ended a cult by asking too many questions',
  'Talked their way out of a paradox',
  'Held the record for Fastest Retreat (Dignified) for two seasons',
  'Successfully complained to a god',
  'Wrote a letter that ended a war (unintentionally)',
  'Survived the Incident Without Knowing What the Incident Was',
  'Won a duel by being technically correct',
  'Attended their own memorial and found it adequate',
  'Made friends with the Unmakeable Thing',
  'Filed a complaint with an office that no longer exists and had it processed',
  'Ate something described as impossible',
  'Returned from somewhere no one returns from, twice',
  'Invented a word now in common use (uncredited)',
  'Outlasted three prophecies about them',
  'Was the thing the other adventurers were warned about',
  'Received an apology from the ocean',
  'Correctly predicted a natural disaster; was not believed',
  'Negotiated with a bureaucracy on behalf of the dead',
  'Appeared in a training document as a cautionary example',
  'Survived a genre shift without losing continuity',
  'Was briefly worshipped; handled it poorly',
  'Achieved closure on something that was not supposed to have closure',
  'Fixed something that everyone agreed could not be fixed, slightly wrong',
  'Successfully haunted a location without being dead',
  'Set a record that no one will ever want to break',
]

const PRESENTATIONS: string[] = [
  'Ceremonial despite themselves',
  'Glamorous under protest',
  'Practical with occasional dramatic lapses',
  'Weathered and deliberate',
  'Elegant with bad shoes',
  'Precise in ways that read as threatening',
  'Aggressively comfortable',
  'Formally dishevelled',
  'Theatrical without trying',
  'Invisible until suddenly not',
  'Dressed for a different occasion',
  'Carrying something heavy with good posture',
  'Severely overdressed for the apocalypse',
  'Underestimated on purpose',
  'Apparently harmless',
  'Immaculate at the worst moments',
  'Wearing the wrong thing with absolute confidence',
  // Non-human presentations
  'Shaped like an accusation',
  'A vaguely threatening ovoid',
  'Larger than expected; apologises for it',
  'Technically invisible but obviously there',
  'Radiates warmth (literal; thermal readings available)',
  'Exists at a slight angle to the visible spectrum',
  'More solid on Tuesdays',
  'Projects an aura of mild institutional disappointment',
  'Presents as completely normal in ways that become increasingly suspicious',
  'Has achieved the aesthetic of a warning sign in a language no one speaks',
]

const DRIVES: string[] = [
  "To find someone who definitely doesn't want to be found",
  'To finish something started in a previous life',
  'To prove a specific person wrong',
  'To recover something everyone insists was never lost',
  'To understand what actually happened',
  "To go somewhere that doesn't appear on any map",
  'To outlast something that should have ended them',
  "To deliver a message they haven't been able to read",
  'To be left alone (failing constantly)',
  'To return to something that might not exist anymore',
  'To find out if the worst thing they believe about themselves is true',
  'To repay a debt to someone who forgot they were owed',
  'To make one thing right in a long list of wrongs',
  "To see a specific thing with their own senses before it's too late",
  'To be believed, just once, without evidence',
  'To outlive the thing that was supposed to outlive them',
  'To find the version of events that makes sense',
  'To absorb every experience available before the opportunity closes',
  'To find out what they actually are',
  'To go unnoticed just once',
  'To be understood across the language barrier that defines their existence',
  'To not repeat the thing they did the last time',
]

const PERSONALITY_SEEDS: string[] = [
  'Warm but evasive. Brilliant at the wrong moment.',
  'Brave until paperwork appears.',
  'Deeply competent and completely unaware of it.',
  'Optimistic in a way that has survived considerable evidence.',
  'Precise in language, imprecise in judgement.',
  'Loyal to a fault, which is specifically the fault.',
  'Catastrophically honest at dinner parties.',
  'Patient in all ways except the one that matters.',
  'Warm to strangers, complicated with people they like.',
  'Dramatic about small things, calm about large ones.',
  'Operates on three hours of sleep and seven theories.',
  'Comfortable with chaos in a way that unsettles calm people.',
  'Confident in ways that turn out to be entirely warranted.',
  "Operates on geological time and finds everyone else's urgency baffling.",
  'Processes emotions approximately three hours after the event, with interest.',
  'Has made peace with being misunderstood — perhaps too much peace.',
  'Remembers everything except the things that would help.',
  'Treats every situation as a negotiation and usually wins.',
  'Deeply curious in a way that occasionally causes international incidents.',
  'Reasonable to a fault. The fault being the situations that require unreasonableness.',
]

// ── Reward tables ──────────────────────────────────────────────────────────

const COMMON_REWARDS: RewardEntry[] = [
  {
    label: 'Pocket Sand Theology',
    text: 'A complete philosophy assembled from practical necessity and minor inconveniences.',
    power:
      'Once per scene, reframe an obstacle as an expected condition. Advantage on composure checks involving bad news.',
    icon: 'kind-icon:bolt',
  },
  {
    label: 'Steady Hands',
    text: "They don't shake. Not from nerves, not from cold, not from things that should shake hands.",
    power:
      'No penalty on fine manipulation under pressure. Once per scene, provide calm to an adjacent ally.',
    icon: 'kind-icon:hand',
  },
  {
    label: 'Local Knowledge',
    text: 'They know which systems give good output and which officials can be reasoned with. More useful than it sounds.',
    power:
      'In any settled environment, ask the GM for one piece of accurate local information per scene.',
    icon: 'kind-icon:map',
  },
  {
    label: 'Good Timing',
    text: 'Not luck — something more precise. An awareness of rhythm that means they arrive at the right moment.',
    power:
      'Once per session, declare perfect timing after the fact. One failed roll of 5 or below may be rerolled.',
    icon: 'kind-icon:clock',
  },
  {
    label: 'The Convincing Shrug',
    text: "A specific social technology: the shrug that means 'I don't know' so convincingly that others stop asking.",
    power:
      'Once per scene, exit a conversation or deflect a question without escalating tension.',
    icon: 'kind-icon:mask',
  },
  {
    label: 'Field Repair',
    text: 'Not a specialist. Not trained. But they know which end of the solution to apply and when to escalate.',
    power:
      'Stabilise a downed ally or broken system without a roll. Basic repair with minimal resources.',
    icon: 'kind-icon:wrench',
  },
  {
    label: 'Navigation by Feel',
    text: "They don't use maps so much as negotiate with terrain. Something always tells them which way is forward.",
    power:
      'Advantage on orientation checks. Can backtrack accurately from any route taken in the last 24 hours.',
    icon: 'kind-icon:compass',
  },
  {
    label: 'Comfortable Silence',
    text: "They have learned that silence doesn't need to be filled. This alone is useful.",
    power:
      'Advantage on patience checks. Other characters are slightly more honest in their presence.',
    icon: 'kind-icon:moon',
  },
  {
    label: 'Light Sleeper',
    text: 'Functional paranoia. They wake up. Every time.',
    power:
      'Cannot be surprised while resting. Detect nearby movement on a natural check.',
    icon: 'kind-icon:eye',
  },
  {
    label: 'Functional Memory',
    text: 'Names, faces, debts, access codes, the third thing someone said at a briefing three months ago.',
    power:
      'Perfect recall of any personally witnessed event. GM confirms if recalled details are accurate.',
    icon: 'kind-icon:archive',
  },
  {
    label: 'The Right Tool',
    text: 'They always seem to have it. Not every tool — just the one the scene requires.',
    power:
      'Once per scene, produce a mundane item appropriate to the current obstacle. Nothing arcane.',
    icon: 'kind-icon:bolt',
  },
  {
    label: 'Reasonable Bluff',
    text: "Not masterful deception. Just the ability to sound like someone who knows what they're doing.",
    power:
      'Advantage on bluff checks when pretending to have authority or expertise. Disadvantage if challenged directly.',
    icon: 'kind-icon:user',
  },
]

const UNCOMMON_REWARDS: RewardEntry[] = [
  {
    label: 'Borrowed Conviction',
    text: "The ability to believe, fully, something they're not sure of — for exactly as long as the situation requires.",
    power:
      'Once per day, claim absolute certainty on any position. Advantage on persuasion. If wrong, disadvantage on the next attempt.',
    icon: 'kind-icon:star',
  },
  {
    label: 'Tactical Retreat (Dignified)',
    text: 'The refined art of leaving. Not fleeing — leaving. There is a meaningful difference they have perfected.',
    power:
      'Exit any scene without triggering pursuit or losing social standing. Requires a moment and a doorway.',
    icon: 'kind-icon:arrow-right',
  },
  {
    label: 'Pattern Recognition',
    text: 'They see shapes in things. The signature of repetition. Before the third time, they expect the fourth.',
    power:
      'After two repetitions of any event or behaviour, identify the pattern. Ask the GM one question answered honestly.',
    icon: 'kind-icon:activity',
  },
  {
    label: 'The Soft Interrogation',
    text: 'Not threatening. Something worse — genuinely curious in a way others find impossible to deceive.',
    power:
      'Once per scene in conversation, ask a question that must be answered truthfully unless the subject explicitly lies.',
    icon: 'kind-icon:quote',
  },
  {
    label: 'Institutional Memory',
    text: 'They remember what it used to be, why it was founded, and what it traded away. This is power.',
    power:
      'In any established institution, invoke original charter, precedent, or forgotten rule to create a narrative opening.',
    icon: 'kind-icon:archive',
  },
  {
    label: 'Debt Ledger',
    text: 'A mental accounting of who owes what to whom. They do not collect. They simply remember. This is sufficient.',
    power:
      'Once per session, call in a favour from an NPC encountered in a previous scene. GM determines the scale.',
    icon: 'kind-icon:book',
  },
  {
    label: 'The Second Look',
    text: "They always look again. Not suspicious — thorough. The thing everyone missed is rarely hidden. It's just unrepeated.",
    power:
      'In any location, take the Second Look action. GM reveals one previously unnoticed significant detail.',
    icon: 'kind-icon:eye',
  },
  {
    label: 'Ambient Authority',
    text: 'They have not been given authority. It has accumulated around them due to posture and tone.',
    power:
      'In crowds or unfamiliar hierarchies, assumed to have appropriate status unless actively challenged.',
    icon: 'kind-icon:crown',
  },
  {
    label: 'The Unasked Question',
    text: 'They know which question will unravel everything, and they know exactly when not to ask it.',
    power:
      'Once per session, withhold the obvious question to gain advantage on all social checks for the rest of the scene.',
    icon: 'kind-icon:idea',
  },
  {
    label: 'Selective Amnesia',
    text: 'They have learned to forget the right things. Selectively. On purpose.',
    power:
      'Immune to forced memory extraction. Once per session, genuinely forget a specific fact to pass a truth check.',
    icon: 'kind-icon:moon',
  },
]

const RARE_REWARDS: RewardEntry[] = [
  {
    label: 'Moonlit Counterspell',
    text: 'Not a spell — a refusal. A specific variety of will that recognises interference as a negotiation and declines.',
    power:
      'Once per day, negate one effect targeting you or an adjacent ally. No save required. No explanation given.',
    icon: 'kind-icon:moon',
  },
  {
    label: 'The Last Word (Literally)',
    text: 'Whatever they say last in an argument is remembered as correct. This has not yet made their life easier.',
    power:
      'In any verbal conflict, if they have the final word, listening parties move one step toward their position.',
    icon: 'kind-icon:quote',
  },
  {
    label: 'Borrowed Fate',
    text: 'Something was going to happen to someone else. Through a complication of timing, it happened to them instead. They kept it.',
    power:
      'Once per session, intercept a negative outcome meant for an ally. Take half the effect. Ally is unharmed.',
    icon: 'kind-icon:star',
  },
  {
    label: 'The Exact Right Lie',
    text: 'Not deception — precision. The ability to say the thing that is exactly as true as the situation needs.',
    power:
      'Once per scene, say something technically untrue that passes all truth detection, magical and mundane.',
    icon: 'kind-icon:mask',
  },
  {
    label: 'Structural Calm',
    text: 'Under actual catastrophe, they become more themselves. Not brave — functional. The difference saves lives.',
    power:
      'Immunity to panic conditions. In a declared crisis, advantage on all actions until the crisis resolves.',
    icon: 'kind-icon:shield',
  },
  {
    label: 'The Unopened Door',
    text: 'They know precisely which doors should stay closed — and have the standing to keep them that way.',
    power:
      'Once per session, declare a narrative door closed. The story must find another way. GM honours it this session.',
    icon: 'kind-icon:lock',
  },
  {
    label: 'Dead Reckoning',
    text: 'Without instruments, without landmarks, without witnesses, they still know exactly where they are.',
    power:
      "Perfect orientation under any conditions. Once per session, identify the location of any being they've encountered.",
    icon: 'kind-icon:compass',
  },
  {
    label: 'The Right Enemy',
    text: "They have acquired an enemy whose opposition is more useful to them than most people's support.",
    power:
      "Once per session, invoke the enemy's reputation to gain a social advantage with that enemy's enemies.",
    icon: 'kind-icon:target',
  },
]

const EPIC_REWARDS: RewardEntry[] = [
  {
    label: 'Reality Audit',
    text: 'A skill that should not exist: the ability to demand that reality account for itself. It usually can.',
    power:
      'Once per session, demand a full accounting of any event. GM must explain all hidden causes and actors.',
    icon: 'kind-icon:archive',
  },
  {
    label: 'The Unbearable Weight of Knowing Better',
    text: 'They have seen enough to recognise the shape of a mistake from a distance.',
    power:
      'When another character is about to make a catastrophic error, interrupt with certainty. Once per session, they listen.',
    icon: 'kind-icon:eye',
  },
  {
    label: 'Recursion',
    text: 'Whatever just happened: they can do it again. Immediately. Before the moment closes.',
    power:
      'Once per session, repeat any successful action or effect that just occurred. Circumstances must be plausible.',
    icon: 'kind-icon:refresh',
  },
  {
    label: 'The Exception Clause',
    text: 'Every rule has an exception. They have found theirs and documented it.',
    power:
      'Once per session, be exempt from one rule, law, effect, or narrative constraint. Declare before the check.',
    icon: 'kind-icon:shield',
  },
]

const LEGENDARY_REWARDS: RewardEntry[] = [
  {
    label: 'Narrative Gravity',
    text: "The story bends toward them. Not because they're important — because they're present.",
    power:
      'Once per session, make one event or NPC directly relevant to the character. GM incorporates it this session.',
    icon: 'kind-icon:sparkles',
  },
  {
    label: 'The Final Argument',
    text: "There is an argument that ends the argument. They have it. They don't use it lightly.",
    power:
      'Once per session, make an irrefutable point. The target cannot continue opposing them on this issue this session.',
    icon: 'kind-icon:bolt',
  },
]

const MYTHIC_REWARDS: RewardEntry[] = [
  {
    label: 'Retcon',
    text: "Something happened. Except it didn't. Except it did. The documentation is unclear.",
    power:
      'Once per campaign, retroactively change one established fact. GM must accept and incorporate it going forward.',
    icon: 'kind-icon:refresh',
  },
  {
    label: "Author's Voice",
    text: 'They have, briefly, the perspective of the one telling the story. This will not last and should not.',
    power:
      'Once per campaign, ask the GM a question about the story they must answer honestly as author, not as the world.',
    icon: 'kind-icon:quote',
  },
]

// ── Upgrade probability map ────────────────────────────────────────────────

const UPGRADE_TABLE: Record<Rarity, { rarity: Rarity; weight: number }[]> = {
  COMMON: [
    { rarity: 'COMMON', weight: 70 },
    { rarity: 'UNCOMMON', weight: 22 },
    { rarity: 'RARE', weight: 8 },
  ],
  UNCOMMON: [
    { rarity: 'UNCOMMON', weight: 65 },
    { rarity: 'RARE', weight: 25 },
    { rarity: 'EPIC', weight: 10 },
  ],
  RARE: [
    { rarity: 'RARE', weight: 60 },
    { rarity: 'EPIC', weight: 25 },
    { rarity: 'LEGENDARY', weight: 12 },
    { rarity: 'MYTHIC', weight: 3 },
  ],
  EPIC: [{ rarity: 'EPIC', weight: 100 }],
  LEGENDARY: [{ rarity: 'LEGENDARY', weight: 100 }],
  MYTHIC: [{ rarity: 'MYTHIC', weight: 100 }],
}

const REWARD_POOL: Record<Rarity, RewardEntry[]> = {
  COMMON: COMMON_REWARDS,
  UNCOMMON: UNCOMMON_REWARDS,
  RARE: RARE_REWARDS,
  EPIC: EPIC_REWARDS,
  LEGENDARY: LEGENDARY_REWARDS,
  MYTHIC: MYTHIC_REWARDS,
}

// ── Generator lookup map ───────────────────────────────────────────────────

export const GENERATOR_LOOKUP: Record<string, string[]> = {
  givenName: GIVEN_NAMES,
  surname: SURNAMES,
  honorific: HONORIFICS,
  title: TITLES,
  species: SPECIES,
  class: CLASSES,
  alignmentEthic: ALIGNMENT_ETHICS,
  alignmentMoral: ALIGNMENT_MORALS,
  genre: GENRES,
  quirk: QUIRKS,
  achievement: ACHIEVEMENTS,
  presentation: PRESENTATIONS,
  drive: DRIVES,
  personality: PERSONALITY_SEEDS,
}

// ── Utility ────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)] as T
}

function weightedRoll<T extends { weight: number }>(options: T[]): T {
  const total = options.reduce((sum, o) => sum + o.weight, 0)
  let roll = Math.random() * total
  for (const option of options) {
    roll -= option.weight
    if (roll <= 0) return option
  }
  // options is always non-empty at call sites; assert to satisfy TS
  return options[options.length - 1] as T
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useGeneratorStore = defineStore('generatorStore', () => {
  /** Return `count` random entries from a named lookup table. */
  function generate(key: string, count = 1): string[] {
    const table = GENERATOR_LOOKUP[key]
    if (!table?.length) return Array(count).fill('')
    return Array.from({ length: count }, () => pickRandom(table))
  }

  /** Return a single random entry from a named lookup table. */
  function generateOne(key: string, fallback = ''): string {
    return generate(key, 1)[0] || fallback
  }

  /** Generate a full name (given + surname). */
  function generateName(): string {
    return `${generateOne('givenName', 'Unnamed')} ${generateOne('surname', 'Entity')}`
  }

  /** Generate a two-word alignment (e.g. "Chaotic Petty"). */
  function generateAlignment(): string {
    return `${generateOne('alignmentEthic')} ${generateOne('alignmentMoral')}`
  }

  /** Return the full list for a given key — for dropdown / list components. */
  function getList(key: string): string[] {
    return GENERATOR_LOOKUP[key] ?? []
  }

  /** Roll the actual rarity of one reward option, with upgrade probability. */
  function rarityUpgrade(base: Rarity): Rarity {
    return weightedRoll(UPGRADE_TABLE[base]).rarity
  }

  /**
   * Roll `count` reward options for a given base rarity.
   * Each option may independently upgrade to a higher tier.
   * Duplicate labels are avoided within the result set.
   */
  function rollRewardOptions(baseRarity: Rarity, count = 4): RolledReward[] {
    const results: RolledReward[] = []
    const usedLabels = new Set<string>()
    let attempts = 0

    while (results.length < count && attempts < 60) {
      attempts++
      const actualRarity = rarityUpgrade(baseRarity)
      const pool = REWARD_POOL[actualRarity]
      if (!pool?.length) continue

      const available = pool.filter((e) => !usedLabels.has(e.label))

      if (!available.length) {
        // Exhausted this tier — fall back to base
        const fallback = REWARD_POOL[baseRarity].find(
          (e) => !usedLabels.has(e.label),
        )
        if (fallback) {
          usedLabels.add(fallback.label)
          results.push({ ...fallback, id: uid(), rarity: baseRarity })
        }
        continue
      }

      const entry = pickRandom(available)
      usedLabels.add(entry.label)
      results.push({ ...entry, id: uid(), rarity: actualRarity })
    }

    return results
  }

  return {
    generate,
    generateOne,
    generateName,
    generateAlignment,
    getList,
    rarityUpgrade,
    rollRewardOptions,
  }
})
