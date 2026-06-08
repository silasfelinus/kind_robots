// /stores/helpers/rewardCards.ts
import type { BuilderCard } from '@/stores/helpers/builderCards'

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
  'Pocket Familiars',
  'Minor Miracles',
  'Owed Debts',
  'Training Montage Results',
  'Impossible Curriculum',
]

export type RewardExample = {
  name: string
  description: string
  flavorText?: string
  effect: string
}

export const REWARD_EXAMPLES: Record<string, RewardExample[]> = {
  SKILL: [
    {
      name: 'Tactical Retreat',
      description:
        'A practiced maneuver for leaving danger with dignity mostly intact.',
      flavorText: 'This is called strategy, not running.',
      effect:
        'When played into a scene, the character can reposition away from danger without losing narrative momentum.',
    },
    {
      name: 'Read the Room',
      description:
        'A social survival instinct sharpened by many spectacular mistakes.',
      flavorText:
        'You know exactly the wrong thing to say before saying it anyway.',
      effect:
        'When played into a scene, reveal the emotional tension, hidden awkwardness, or social trap currently present.',
    },
    {
      name: 'Practiced Eye',
      description:
        'A reliable knack for spotting forgery, false fronts, and badly disguised nonsense.',
      flavorText: 'The forgery does not have to know it has been caught.',
      effect:
        'When played into a scene, identify one false, fake, copied, altered, or misrepresented thing.',
    },
    {
      name: 'Weight Distribution',
      description:
        'A strangely graceful understanding of balance, leverage, and not falling off things.',
      flavorText:
        'Things you chose to climb respect your commitment to the bit.',
      effect:
        'When played into a scene, let the character climb, balance, perch, or cross unstable terrain with surprising competence.',
    },
    {
      name: 'The Second Glance',
      description:
        'The useful habit of noticing the important detail five minutes late, but not too late.',
      flavorText: 'The first look saw the room. The second saw the story.',
      effect:
        'When played into a scene, re-examine a previously visited situation and uncover one overlooked clue.',
    },
    {
      name: 'Professionally Calm',
      description:
        'A trained crisis response that keeps the panic politely waiting outside.',
      flavorText:
        'You act first and feel it later. Later has been accumulating interest.',
      effect:
        'When played into a scene, allow the character to act clearly during fear, pressure, noise, or chaos.',
    },
  ],
  ITEM: [
    {
      name: 'Extremely Specific Map',
      description:
        'A map with flawless detail for one emotionally significant location and suspicious gaps everywhere else.',
      flavorText: 'The cartographer cared deeply. About exactly one place.',
      effect:
        'When played into a scene, reveal a precise route, secret entrance, hidden landmark, or local oddity in one specific area.',
    },
    {
      name: 'Bottomless Satchel',
      description:
        'A bag that holds more than physics agreed to and returns objects with dramatic timing.',
      flavorText: 'It gives things back in the order they are least expected.',
      effect:
        'When played into a scene, produce a plausible small object that could have been packed earlier.',
    },
    {
      name: 'The Good Pen',
      description:
        'A trustworthy writing instrument with excellent ink flow and suspicious bureaucratic authority.',
      flavorText:
        'Documents signed with it are trusted more than they should be.',
      effect:
        'When played into a scene, make a written note, signature, form, or message seem unusually official or persuasive.',
    },
    {
      name: 'Sensible Boots',
      description:
        'Footwear that knows exactly what surface it is on and has prepared accordingly.',
      flavorText: 'They have never once made a big deal about saving you.',
      effect:
        'When played into a scene, grant sure footing on mud, ice, rubble, decks, rooftops, or other unfriendly ground.',
    },
    {
      name: "Yesterday's Newspaper",
      description:
        'A newspaper that is always one day old and somehow still annoyingly relevant.',
      flavorText: 'The important article is never the headline. Naturally.',
      effect:
        'When played into a scene, introduce a recent clue, public rumor, warning, or contradiction from the previous day.',
    },
    {
      name: 'The Appropriate Tool',
      description:
        'A tool that is technically correct for the current problem, which is sometimes the funniest kind of correct.',
      flavorText: 'Nobody packed it. Everyone needed it.',
      effect:
        'When played into a scene, produce a mundane tool that helps solve the immediate practical obstacle.',
    },
  ],
  POWER: [
    {
      name: 'Structural Awareness',
      description:
        'An uncanny ability to identify load-bearing elements in buildings, arguments, and relationships.',
      flavorText: 'Cannot always explain how. Still correct.',
      effect:
        'When played into a scene, reveal what is physically, socially, or narratively holding a situation together.',
    },
    {
      name: 'Ambient Threat',
      description:
        'A quiet field of menace that makes nearby creatures reconsider their choices.',
      flavorText: 'Nobody knows what they sensed. Their nervous system does.',
      effect:
        'When played into a scene, cause nearby opponents or NPCs to hesitate, posture, retreat, or reveal caution.',
    },
    {
      name: 'Lucky Timing',
      description:
        'The suspicious gift of arriving exactly when the scene needs someone like you.',
      flavorText: 'The narrative does not question this. Neither should you.',
      effect:
        'When played into a scene, justify a perfectly timed entrance, interruption, discovery, or coincidence.',
    },
    {
      name: 'Correct About Weather',
      description:
        'A deeply specific instinct for atmospheric drama and incoming inconvenience.',
      flavorText:
        'It has broader applications than expected. Weather usually does.',
      effect:
        'When played into a scene, predict or use weather conditions to alter movement, visibility, mood, or danger.',
    },
    {
      name: 'The Long Memory',
      description:
        'Perfect recall with emotional storage requirements that are frankly unreasonable.',
      flavorText: 'You do not forget. Anything. Sorry.',
      effect:
        'When played into a scene, recall an exact detail, phrase, face, route, symbol, or promise from earlier.',
    },
    {
      name: 'Gravity Negotiation',
      description:
        'A personal relationship with falling that includes several loopholes.',
      flavorText: 'Gravity has rules. You have notes.',
      effect:
        'When played into a scene, soften a fall, make an impossible leap plausible, or bend vertical movement briefly.',
    },
  ],
  PET: [
    {
      name: 'Pocket Griffin',
      description:
        'A tiny feathered menace with the pride of an empire and the mass of a sandwich.',
      flavorText: 'Technically majestic. Practically bitey.',
      effect:
        'When played into a scene, scout from above, intimidate something small, steal a shiny object, or create aristocratic chaos.',
    },
    {
      name: 'Lantern Toad',
      description:
        'A calm amphibian companion whose throat glows when secrets are nearby.',
      flavorText: 'It croaks once for danger, twice for gossip.',
      effect:
        'When played into a scene, reveal hidden writing, concealed doors, magical residue, or suspicious vibes.',
    },
    {
      name: 'Moss-Covered Cat',
      description:
        'A forest-soft cat that grows tiny flowers when pleased and mushrooms when annoyed.',
      flavorText: 'Both are useful. One is a warning.',
      effect:
        'When played into a scene, calm a creature, find a natural path, or mark a safe resting place.',
    },
    {
      name: 'Clockwork Finch',
      description:
        'A brass bird with jeweled eyes, perfect rhythm, and absolutely no indoor voice.',
      flavorText: 'Keeps time. Keeps secrets poorly.',
      effect:
        'When played into a scene, deliver a tiny message, distract guards, trigger a mechanism, or keep exact timing.',
    },
    {
      name: 'Emotional Support Mimic',
      description:
        'A loyal little chest that holds snacks, secrets, and several opinions about your enemies.',
      flavorText: 'The teeth are mostly for boundaries.',
      effect:
        'When played into a scene, hide a small object, surprise a nosy NPC, or provide morale at an awkward moment.',
    },
    {
      name: 'Starlight Minnow',
      description:
        'A floating fish that swims through air and glows brighter near wonder.',
      flavorText: 'Impossible to leash. Easy to follow.',
      effect:
        'When played into a scene, guide the party toward magic, dreams, lost memories, or beautiful trouble.',
    },
  ],
  MAGIC: [
    {
      name: 'Borrowed Moonbeam',
      description:
        'A folded sliver of moonlight kept for emergencies, ceremonies, and dramatic reveals.',
      flavorText: 'The moon wants it back eventually. Probably.',
      effect:
        'When played into a scene, illuminate the hidden, bless a threshold, reveal a disguise, or make something ordinary feel sacred.',
    },
    {
      name: 'Cup of Almost Tea',
      description:
        'A warm cup that tastes like the drink someone needed, not necessarily the one they wanted.',
      flavorText: 'Steeped in emotional accuracy.',
      effect:
        'When played into a scene, soothe panic, invite honesty, restore focus, or begin a necessary conversation.',
    },
    {
      name: 'Door-Sized Maybe',
      description:
        'A portable uncertainty that can become an entrance if the story is feeling cooperative.',
      flavorText: 'Not all doors are architectural.',
      effect:
        'When played into a scene, open a temporary passage, shortcut, escape route, or symbolic threshold.',
    },
    {
      name: 'Tiny Weather Spell',
      description:
        'A pocket-sized meteorological opinion with limited scope and excellent timing.',
      flavorText: 'Local forecast: narrative inconvenience.',
      effect:
        'When played into a scene, create a brief gust, drizzle, fog patch, sunbeam, static charge, or dramatic breeze.',
    },
    {
      name: 'Polite Hex',
      description:
        'A mild curse with impeccable manners and a very specific complaint.',
      flavorText: 'It says please. It still works.',
      effect:
        'When played into a scene, inconvenience a target in a flavorful but non-lethal way.',
    },
    {
      name: 'Thread of Elsewhere',
      description:
        'A shimmering strand tied to a place, person, or possibility just outside the current world.',
      flavorText: 'Pull gently. Reality is watching.',
      effect:
        'When played into a scene, connect the current moment to a distant location, memory, dream, or alternate path.',
    },
  ],
  FAVOR: [
    {
      name: 'A Favor Owed',
      description:
        'Someone significant owes you something significant. The terms were never clarified.',
      flavorText: 'This is intentional on both sides.',
      effect:
        'When played into a scene, introduce an NPC, institution, or old contact willing to help under complicated terms.',
    },
    {
      name: 'The Incriminating Document',
      description:
        'A document someone badly wants back, though everyone disagrees about why.',
      flavorText:
        'Neither party is sure what happens if this ever gets resolved.',
      effect:
        'When played into a scene, pressure a powerful person, unlock leverage, or complicate negotiations.',
    },
    {
      name: 'The Right Enemy',
      description:
        'An opponent who makes you look better by comparison and resents this professionally.',
      flavorText: 'The arrangement benefits everyone except them. Delicious.',
      effect:
        'When played into a scene, bring in a rival whose presence clarifies stakes, motives, or public opinion.',
    },
    {
      name: 'Unfinished Business',
      description:
        'Something is waiting for you in a specific place. It has been waiting a while.',
      flavorText: 'It is not angry. It is patient.',
      effect:
        'When played into a scene, reveal a pending obligation, unresolved promise, or location that demands return.',
    },
    {
      name: 'The Promised Return',
      description:
        'A promise to come back that has gathered weight while nobody was looking.',
      flavorText: 'You meant it. That is the dangerous part.',
      effect:
        'When played into a scene, make a prior promise matter immediately and reshape what an NPC expects.',
    },
    {
      name: 'Letter of Introduction',
      description:
        'A formal note connecting you to someone who has no idea what they are about to be dragged into.',
      flavorText: 'The signature opens the door. You handle the rest.',
      effect:
        'When played into a scene, gain an audience, bypass suspicion, or enter a social space with borrowed credibility.',
    },
  ],
}

export const REWARD_CARDS: BuilderCard[] = [
  {
    key: 'type',
    label: 'Type',
    title: 'What kind of reward',
    icon: 'kind-icon:gift',
    flourish: '✦',
    deckImage: '/images/rewards/type.webp',
    heroImage: '/images/rewards/type.webp',
    tagline: 'What does the character get to keep?',
    narrative:
      'Rewards are the things that change a character after the story touches them. A skill changes what they can do. An item changes what they carry. A power changes what they are capable of. A pet changes who travels with them. Magic changes what reality allows. A favor changes who owes whom.',
    required: true,
    restoresFields: ['rewardType'],
    steps: [
      {
        key: 'rewardType',
        title: 'Reward Type',
        narrative:
          'Choose the category. This shapes the name, the description, the effect, and the kind of difference it makes in a scene.',
        inputType: 'preset',
        field: 'rewardType',
        choices: [
          {
            value: 'SKILL',
            label: 'Skill',
            subtext:
              'Something they can now do. Practiced, earned, stolen from experience, or learned through repeated near-disasters.',
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
            value: 'POWER',
            label: 'Power',
            subtext:
              "Something innate, awakened, granted, or impossible. A capacity that changes what they're capable of.",
            image: '/images/rewards/type/power.webp',
          },
          {
            value: 'PET',
            label: 'Pet',
            subtext:
              'A companion, familiar, helper, menace, emotional support goblin, or tiny plot accelerator.',
            image: '/images/rewards/type/pet.webp',
          },
          {
            value: 'MAGIC',
            label: 'Magic',
            subtext:
              'A spell, charm, blessing, hex, ritual, miracle, loophole, or beautifully irresponsible reality edit.',
            image: '/images/rewards/type/magic.webp',
          },
          {
            value: 'FAVOR',
            label: 'Favor',
            subtext:
              'A debt, introduction, promise, obligation, alliance, social key, or narrative string waiting to be pulled.',
            image: '/images/rewards/type/favor.webp',
          },
        ],
      },
    ],
  },
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
          'Choose the tier. This affects everything from how the effect reads to how the world treats the character who has it.',
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
    restoresFields: ['name'],
    steps: [
      {
        key: 'rewardName',
        title: 'Name',
        narrative:
          'What is this reward called? The name goes on the card. It should be specific enough to be recognizable and vague enough to be mysterious. Both at once is the goal.',
        inputType: 'text',
        field: 'name',
        placeholder:
          'The Good Pen, Tactical Retreat, Pocket Griffin, Borrowed Moonbeam...',
        inputLabel: 'Reward Name',
        maxLength: 256,
        needsLLM: true,
      },
    ],
  },
  {
    key: 'description',
    label: 'Description',
    title: 'What it is',
    icon: 'kind-icon:scroll',
    flourish: '☰',
    deckImage: '/images/rewards/description.webp',
    heroImage: '/images/rewards/description.webp',
    tagline: 'The readable front-facing description.',
    narrative:
      'Description explains what the reward is in the world. It should be useful to players, readable on the front end, and flavorful without doing the job of the effect text.',
    required: false,
    restoresFields: ['description'],
    steps: [
      {
        key: 'rewardDescription',
        title: 'Description',
        narrative:
          'Describe what this reward is. Keep it concrete, flavorful, and easy to understand at a glance.',
        inputType: 'long',
        field: 'description',
        placeholder:
          'A brass bird with jeweled eyes, perfect rhythm, and absolutely no indoor voice.',
        inputLabel: 'Description',
        optional: true,
        needsLLM: true,
      },
    ],
  },
  {
    key: 'flavor',
    label: 'Flavor',
    title: 'What it whispers',
    icon: 'kind-icon:sparkles',
    flourish: '❧',
    deckImage: '/images/rewards/flavor.webp',
    heroImage: '/images/rewards/flavor.webp',
    tagline: 'A short memorable line.',
    narrative:
      'Flavor text is the little quote, wink, omen, joke, or poetic sting that makes the card memorable. It should be short enough to sit comfortably on a card.',
    required: false,
    restoresFields: ['flavorText'],
    steps: [
      {
        key: 'rewardFlavorText',
        title: 'Flavor Text',
        narrative:
          'Write the card’s short mood line. This can be funny, ominous, poetic, or weirdly specific.',
        inputType: 'text',
        field: 'flavorText',
        placeholder: 'It says please. It still works.',
        inputLabel: 'Flavor Text',
        maxLength: 512,
        optional: true,
        needsLLM: true,
      },
    ],
  },
  {
    key: 'effect',
    label: 'Effect',
    title: 'How it changes the scene',
    icon: 'kind-icon:bolt',
    flourish: '⚡',
    deckImage: '/images/rewards/effect.webp',
    heroImage: '/images/rewards/effect.webp',
    tagline: 'The LLM-facing narrative hook.',
    narrative:
      'Effect is the storytelling-engine instruction. It tells the LLM how this reward behaves when played into a scene. Keep it actionable. The effect should help the story move.',
    required: true,
    restoresFields: ['effect'],
    steps: [
      {
        key: 'rewardEffect',
        title: 'Effect',
        narrative:
          "What does this reward do when it enters a scene? Write it as a narrative hook the storytelling engine can use. Clear, flavorful, and actionable. That's the whole spell.",
        inputType: 'long',
        field: 'effect',
        placeholder:
          'When played into a scene, reveal... / allow... / introduce... / change...',
        inputLabel: 'Effect',
        needsLLM: true,
      },
    ],
  },
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
        choices: COLLECTION_PRESETS.map((collection) => ({
          value: collection,
          label: collection,
        })),
      },
    ],
  },
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
          'Pick a symbol. It can be literal, atmospheric, or absolutely unhinged as long as it helps the reward feel findable.',
        inputType: 'icon',
        field: 'icon',
        optional: true,
      },
    ],
  },
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
      'A reward with an image is a reward someone remembers. Build the art prompt from the name, description, effect, rarity, and type. Generate the image. The reward becomes a thing with a presence.',
    required: false,
    restoresFields: ['artPrompt', 'imagePath', 'artImageId'],
    unlockCondition: 'coreComplete',
    steps: [
      {
        key: 'rewardArt',
        title: 'Build the Image',
        narrative:
          "Use the reward's name, type, rarity, description, and effect to build an art prompt. Refine it, then generate. The image will represent this reward across the app.",
        inputType: 'art',
        field: 'artPrompt',
        optional: true,
        needsLLM: true,
      },
    ],
  },
]
