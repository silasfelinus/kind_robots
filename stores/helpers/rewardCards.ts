// stores/helpers/rewardCards.ts
//
// Card definitions for the Reward Builder.
// Rewards can be skills, items, treasures, titles, powers, or story beats.
// Each has a name (text), an effect (power), a rarity, and optionally a collection.

import type { BuilderCard } from '@/stores/helpers/builderCards'

// ── Collection presets ─────────────────────────────────────────────────────

export const COLLECTION_PRESETS: string[] = [
  "Adventurer's Standard Kit",
  'Eldritch Bric-a-brac',
  'Diplomatic Necessities',
  'Field Expedients',
  'Legendary Artifacts',
  'Story Complications',
  'Cursed Objects (Labelled)',
  'Maritime Salvage',
  'Bureaucratic Arsenal',
  'Creature Comforts',
  'Forbidden Acquisitions',
  'Things Found in Pockets',
]

// ── Example rewards by type (used for LLM context + UI inspiration) ────────

export const REWARD_EXAMPLES: Record<
  string,
  Array<{ text: string; power: string }>
> = {
  SKILL: [
    {
      text: 'Tactical Retreat',
      power:
        'Move up to twice your speed directly away from an enemy. This is called strategy, not running.',
    },
    {
      text: 'Read the Room',
      power:
        'Once per scene, know exactly the wrong thing to say before saying it anyway. You may then say something else.',
    },
    {
      text: 'Practiced Eye',
      power:
        'Instantly identify any forgery, fake credential, or misrepresented object. The forgery does not have to know this.',
    },
    {
      text: 'Weight Distribution',
      power:
        'Never fall off anything you chose to climb. Things you did not choose to climb are a separate matter.',
    },
    {
      text: 'The Second Glance',
      power:
        'Once per day, re-examine a scene you already left. You notice one thing you missed. It is always the important thing.',
    },
    {
      text: 'Professionally Calm',
      power:
        'In any crisis, you act first and feel it later. The later has been accumulating interest.',
    },
  ],
  ITEM: [
    {
      text: 'Extremely Specific Map',
      power:
        'Accurate to within three inches, but only for a location the cartographer found deeply moving. The location is not labeled.',
    },
    {
      text: 'Bottomless Satchel',
      power:
        'Holds significantly more than it should. Returns items in the order they were least expected.',
    },
    {
      text: 'The Good Pen',
      power:
        'Writes in a hand you are proud of. Ink never runs. Documents signed with it are trusted more than they should be.',
    },
    {
      text: 'Sensible Boots',
      power:
        'Provide exactly the right amount of traction for whatever surface you are currently walking on. Have never once failed to do this.',
    },
    {
      text: "Yesterday's Newspaper",
      power:
        'Always exactly one day old. Contains one piece of information that is still relevant. You will not know which one until it matters.',
    },
    {
      text: 'The Appropriate Tool',
      power:
        'Once per scene, reach into any container and find a tool that is, technically, correct for the current problem.',
    },
  ],
  TREASURE: [
    {
      text: 'Coin from Somewhere Else',
      power:
        'Currency of uncertain origin. Accepted everywhere by merchants who do not look too closely. They never do.',
    },
    {
      text: 'Portrait of Someone Important',
      power:
        'The subject is not labeled. Everyone who sees it has a strong opinion about who it is. No two opinions agree.',
    },
    {
      text: 'The Last Bottle',
      power:
        'Widely agreed to be the final example of something that no longer exists. Extremely valuable. Slightly cursed to be the one who has it.',
    },
    {
      text: 'Receipt for Something Enormous',
      power:
        'Proof of purchase. The purchase is paid. The item has not yet been claimed. The vendor has been waiting.',
    },
  ],
  TITLE: [
    {
      text: 'Technically Still a Lord',
      power:
        'The paperwork exists. The estate does not. The title opens doors at approximately a 60% rate. Nobody checks.',
    },
    {
      text: 'Renowned in Three Villages',
      power:
        'Small villages. Outsized reputation. It precedes you. It is mostly accurate. The inaccurate parts are more interesting.',
    },
    {
      text: 'Former Champion',
      power:
        'The title is past tense. The skills are not. People treat you with a specific kind of respect that also contains a question.',
    },
    {
      text: 'The One Who Came Back',
      power:
        'You left. Something tried to keep you there. You came back anyway. This is known. No one asks what it cost.',
    },
  ],
  POWER: [
    {
      text: 'Structural Awareness',
      power:
        'Can identify load-bearing elements in any building, argument, or relationship. Cannot always explain how.',
    },
    {
      text: 'Ambient Threat',
      power:
        'Creatures and NPCs within 30ft adjust their behavior based on an instinct they cannot name. This instinct is correct.',
    },
    {
      text: 'Lucky Timing',
      power:
        'Once per session, arrive exactly when needed. The narrative does not question this. Neither should you.',
    },
    {
      text: 'Correct About Weather',
      power:
        'Always know what the weather will be. This has broader applications than expected.',
    },
    {
      text: 'The Long Memory',
      power:
        'You do not forget. Anything. The storage requirements are significant but the recall is perfect.',
    },
  ],
  STORY: [
    {
      text: 'A Favor Owed',
      power:
        'Someone significant owes you something significant. The terms were never clarified. This is intentional on both sides.',
    },
    {
      text: 'The Incriminating Document',
      power:
        'You have it. They want it back. Neither party is sure what happens if this situation ever gets resolved.',
    },
    {
      text: 'The Right Enemy',
      power:
        'An opponent who makes you look better by comparison. They resent this professionally. The arrangement benefits everyone except them.',
    },
    {
      text: 'Unfinished Business',
      power:
        'Something is waiting for you in a specific place. It has been waiting a while. It is not angry. It is patient.',
    },
    {
      text: 'The Promised Return',
      power:
        'You told someone you would come back. You meant it. The promise has weight. So does what happens when you keep it.',
    },
  ],
}

// ── Cards ──────────────────────────────────────────────────────────────────

export const REWARD_CARDS: BuilderCard[] = [
  // ── Type ─────────────────────────────────────────────────────────────────
  {
    key: 'type',
    label: 'Type',
    title: 'What kind of reward',
    icon: 'kind-icon:gift',
    flourish: '✦',
    deckImage: '/images/rewards/type.webp',
    heroImage: '/images/rewards/type.webp',
    tagline: 'What does the entity get to keep.',
    narrative:
      'Rewards are the things that change an entity after the story. A skill changes what they can do. An item changes what they carry. A treasure changes what they have. A title changes how the world sees them. A power changes what they are. A story beat changes what happens next.',
    required: true,
    restoresFields: ['rewardType'],
    steps: [
      {
        key: 'rewardType',
        title: 'Reward Type',
        narrative:
          'Choose the category. This shapes the name, the power, and the kind of difference it makes.',
        inputType: 'preset',
        field: 'rewardType',
        choices: [
          {
            value: 'SKILL',
            label: 'Skill',
            subtext:
              'Something they can now do. Practiced, earned, or accidentally acquired through repeated near-disasters.',
            image: '/images/rewards/type/skill.webp',
          },
          {
            value: 'ITEM',
            label: 'Item',
            subtext:
              'Something they carry. Objects accumulate history. The best items have opinions.',
            image: '/images/rewards/type/item.webp',
          },
          {
            value: 'TREASURE',
            label: 'Treasure',
            subtext:
              'Something with value. Monetary, cultural, sentimental, or dangerously specific.',
            image: '/images/rewards/type/treasure.webp',
          },
          {
            value: 'TITLE',
            label: 'Title',
            subtext:
              'Something the world calls them now. May or may not reflect reality. Often opens doors. Sometimes closes them.',
            image: '/images/rewards/type/title.webp',
          },
          {
            value: 'POWER',
            label: 'Power',
            subtext:
              "Something innate. A capacity that was always there, or wasn't, or became. The distinction is unclear.",
            image: '/images/rewards/type/power.webp',
          },
          {
            value: 'STORY',
            label: 'Story',
            subtext:
              'Something narrative. A debt, a connection, a complication. The kind of reward that keeps giving.',
            image: '/images/rewards/type/story.webp',
          },
        ],
      },
    ],
  },

  // ── Rarity ───────────────────────────────────────────────────────────────
  {
    key: 'rarity',
    label: 'Rarity',
    title: 'How rare',
    icon: 'kind-icon:gem',
    flourish: '◈',
    deckImage: '/images/rewards/rarity.webp',
    heroImage: '/images/rewards/rarity.webp',
    tagline: 'How much reality bends around this thing.',
    narrative:
      'Rarity is not just value. It is how much the universe had to agree to make this thing exist. A common reward is reliable. A mythic reward is the kind of thing stories are still explaining centuries later.',
    required: true,
    restoresFields: ['rarity'],
    steps: [
      {
        key: 'rarity',
        title: 'Rarity',
        narrative:
          'Choose the tier. This affects everything from how the power reads to how the world treats the entity who has it.',
        inputType: 'preset',
        field: 'rarity',
        choices: [
          {
            value: 'COMMON',
            label: 'Common',
            subtext:
              'Reliable. Present. Does what it says. Nobody writes songs about it, which is fine — it is busy working.',
            image: '/images/rewards/rarity/common.webp',
          },
          {
            value: 'UNCOMMON',
            label: 'Uncommon',
            subtext:
              "Slightly better than expected. The kind of thing you mention but don't lead with.",
            image: '/images/rewards/rarity/uncommon.webp',
          },
          {
            value: 'RARE',
            label: 'Rare',
            subtext:
              'Noteworthy. People ask where you got it. The honest answer is complicated.',
            image: '/images/rewards/rarity/rare.webp',
          },
          {
            value: 'EPIC',
            label: 'Epic',
            subtext:
              'Significant. Changes the shape of situations it enters. Has a backstory whether you want it to or not.',
            image: '/images/rewards/rarity/epic.webp',
          },
          {
            value: 'LEGENDARY',
            label: 'Legendary',
            subtext:
              "Historical. The kind of thing that already exists in the world's memory before you find it.",
            image: '/images/rewards/rarity/legendary.webp',
          },
          {
            value: 'MYTHIC',
            label: 'Mythic',
            subtext:
              'Should not exist. Does anyway. Reality has filed several complaints. None have been acknowledged.',
            image: '/images/rewards/rarity/mythic.webp',
          },
        ],
      },
    ],
  },

  // ── Name ─────────────────────────────────────────────────────────────────
  {
    key: 'name',
    label: 'Name',
    title: 'What it is called',
    icon: 'kind-icon:edit',
    flourish: '✒',
    deckImage: '/images/rewards/name.webp',
    heroImage: '/images/rewards/name.webp',
    tagline: 'The thing people say when they mean this.',
    narrative:
      "A good reward name does two things: it tells you what the thing is, and it implies a story. 'The Good Pen' tells you more than 'Enchanted Writing Implement'. Name it like something that already exists in the world. It does.",
    required: true,
    restoresFields: ['text', 'label'],
    steps: [
      {
        key: 'rewardText',
        title: 'Name',
        narrative:
          'What is this reward called? The name goes on the card. It should be specific enough to be recognisable and vague enough to be mysterious. Both at once is the goal.',
        inputType: 'text',
        field: 'text',
        placeholder:
          'The Good Pen, Tactical Retreat, Coin from Somewhere Else...',
        inputLabel: 'Reward Name',
        maxLength: 256,
        needsLLM: true,
      },
    ],
  },

  // ── Power ─────────────────────────────────────────────────────────────────
  {
    key: 'power',
    label: 'Power',
    title: 'What it does',
    icon: 'kind-icon:bolt',
    flourish: '⚡',
    deckImage: '/images/rewards/power.webp',
    heroImage: '/images/rewards/power.webp',
    tagline: 'The actual thing that changes.',
    narrative:
      "Power is the mechanical truth of a reward. It should be specific enough to use at the table and interesting enough to remember. The best powers have a rule and a personality. 'Add 2 to rolls' has a rule. 'You do not fall off things you chose to climb' has a personality.",
    required: true,
    restoresFields: ['power'],
    steps: [
      {
        key: 'rewardPower',
        title: 'Power',
        narrative:
          "What does this reward actually do? Write it like you'd say it aloud at a table — clear enough to use, flavourful enough to remember. One or two sentences is usually right.",
        inputType: 'long',
        field: 'power',
        placeholder:
          'Once per scene, you may... / Always know when... / Gain +1 whenever...',
        inputLabel: 'Power',
        needsLLM: true,
      },
    ],
  },

  // ── Collection ────────────────────────────────────────────────────────────
  {
    key: 'collection',
    label: 'Collection',
    title: 'Where it belongs',
    icon: 'kind-icon:folder',
    flourish: '§',
    deckImage: '/images/rewards/collection.webp',
    heroImage: '/images/rewards/collection.webp',
    tagline: 'Optional. Groups rewards that belong together.',
    narrative:
      'Collections are how rewards find each other. Rewards in the same collection share a source, a theme, or a very specific origin story. The collection name is just a string — any rewards with the same string are in the same collection.',
    required: false,
    restoresFields: ['collection'],
    steps: [
      {
        key: 'rewardCollection',
        title: 'Collection',
        narrative:
          'Name the collection this reward belongs to, or pick from common collections below. Leave it blank and it joins the general pool.',
        inputType: 'text',
        field: 'collection',
        optional: true,
        placeholder:
          "Adventurer's Standard Kit, Field Expedients, Things Found in Pockets...",
        inputLabel: 'Collection',
        choices: COLLECTION_PRESETS.map((c) => ({
          value: c,
          label: c,
        })),
      },
    ],
  },

  // ── Icon ─────────────────────────────────────────────────────────────────
  {
    key: 'icon',
    label: 'Icon',
    title: 'The symbol',
    icon: 'kind-icon:grid',
    flourish: '⊕',
    deckImage: '/images/rewards/icon.webp',
    heroImage: '/images/rewards/icon.webp',
    tagline: 'Optional. A small visual handle.',
    narrative:
      'An icon is not the reward. It is the symbol on the card — the small image that makes this reward findable at a glance in a list of fifty. Pick one that fits, obliquely or directly.',
    required: false,
    restoresFields: ['icon'],
    steps: [
      {
        key: 'rewardIcon',
        title: 'Choose an Icon',
        narrative:
          'Pick a symbol. It can be literal (a sword icon for a sword skill) or atmospheric (a moon icon for something nocturnal). The icon is for navigation.',
        inputType: 'icon',
        field: 'icon',
        optional: true,
      },
    ],
  },

  // ── Art ───────────────────────────────────────────────────────────────────
  {
    key: 'art',
    label: 'Art',
    title: 'Make it visible',
    icon: 'kind-icon:palette',
    flourish: '▣',
    deckImage: '/images/rewards/art.webp',
    heroImage: '/images/rewards/art.webp',
    tagline: 'Optional. Give the reward a face.',
    narrative:
      'A reward with an image is a reward someone remembers. Build the art prompt from the name, power, and type. Generate the image. The reward becomes a thing with a presence.',
    required: false,
    restoresFields: ['artPrompt', 'imagePath', 'artImageId'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'rewardArt',
        title: 'Build the Image',
        narrative:
          "Use the reward's name, type, and power to build an art prompt. Refine it, then generate. The image will represent this reward across the app.",
        inputType: 'art',
        field: 'artPrompt',
        optional: true,
        needsLLM: true,
      },
    ],
  },
]
