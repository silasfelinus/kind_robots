import type { GatedEncounter } from './questExpansion'

/**
 * Optional meetings after a real change of companions. A former guide retains
 * their own projects, friendships and boundaries. Nothing here implies romance,
 * an unseen reunion, or a companion who was never followed.
 */
export const FORMER_GUIDE_QUESTS: GatedEncounter[] = [
  {
    id: 'FR-MARA-01',
    kind: 'encounter',
    chapter: 5,
    requiresFormerGuide: 'mara',
    place: 'Garberville',
    title: 'A Tattoo Studio with Two Front Doors',
    scene: 'bay',
    body: [
      'Mara is hanging a temporary studio sign in a borrowed Garberville storefront. Her Old Town studio has arranged a three-day workshop without consulting fate, you, or the county marketing office.',
      'She sees you and waves with the end of the sign. A festival promoter has offered free advertising if she shares private client sketches. She has already said no. The only unresolved question is how to pay for the workshop space.',
    ],
    choices: [
      {
        id: 'transparent-lease',
        label: 'Read the lease and help Mara negotiate a real apprentice wage',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'Mara gets a workable lease and an apprenticeship budget. She thanks you, then reminds you that the apprentices will choose whether they want to work here.',
          effects: { goodwill: 1, flag: 'mara_second_studio_agreement' },
        },
        failure: {
          text: 'You find no miracle in the lease, just an expensive clause. Mara crosses it out herself and schedules a meeting with a tenant advocate.',
          effects: { flag: 'mara_lease_renegotiation' },
        },
      },
      {
        id: 'keep-boundaries',
        label:
          'Offer help moving the sign, then let Mara handle her own contracts',
        success: {
          text: 'You carry the heavy end. Mara takes the other. At the new door she gives you coffee and a sincere goodbye, which is an excellent relationship to have.',
          effects: { flag: 'mara_independent_studio', nerve: 1 },
        },
      },
      {
        id: 'public-exhibition',
        label:
          'Organize an exhibition of work the artists explicitly volunteer',
        check: { skill: 'rizz', target: 7 },
        success: {
          text: 'The opening draws people who actually buy art. Every artist has a name card and a price of their own choosing. No private client file leaves the cabinet.',
          effects: { goodwill: 1, flag: 'mara_consensual_show' },
        },
        failure: {
          text: 'The first planning meeting gets stuck on whose work goes in the window. Mara keeps the door unlocked for another discussion, not a forced consensus.',
          effects: { flag: 'mara_show_planning' },
        },
      },
    ],
    provenance:
      'Old Town Eureka is real. This studio, owner, lease, clients and apprenticeship are fictional. Mara speaks for herself, not for any real tribal authority.',
  },
  {
    id: 'FR-KIT-01',
    kind: 'encounter',
    chapter: 3,
    requiresFormerGuide: 'kit',
    place: 'Eureka waterfront',
    title: 'The Unclaimed Shadow Parade',
    scene: 'bay',
    body: [
      'Kit has put together a parade of sculptures made from other people’s mistakes. A bent wheel becomes an elephant. A broken umbrella becomes a jellyfish. One arrangement remains stubbornly a broken umbrella.',
      'She spots you across the square, grins, and keeps working. Nobody is waiting for you to choose between friendship and departure; she has a deadline either way. The parade needs volunteers and a plan for giving each maker credit.',
    ],
    choices: [
      {
        id: 'maker-credits',
        label: 'Build a public roster so every anonymous repair gets its due',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'Kit reads the names before the parade starts. Two people correct their spelling, one chooses a pseudonym, and the broken umbrella gets the loudest applause.',
          effects: {
            evidence: 'Volunteer-approved parade credits',
            flag: 'kit_parade_credits',
          },
        },
        failure: {
          text: 'A maker asks you to remove their name. You do. The parade still happens, with better consent and one less name on the sheet.',
          effects: { flag: 'kit_parade_privacy' },
        },
      },
      {
        id: 'practical-help',
        label:
          'Help reinforce the floats so the whole parade actually finishes',
        check: { skill: 'burly', target: 7 },
        success: {
          text: 'The umbrella-jellyfish survives the square. Kit hugs a wheel, not you, and promises to return the borrowed wrench.',
          effects: { goodwill: 1, flag: 'kit_parade_repairs' },
        },
        failure: {
          text: 'A float loses its tail. Kit declares this excellent evidence of evolution, then helps you collect the pieces so nobody trips.',
          effects: { flag: 'kit_parade_lost_tail' },
        },
      },
      {
        id: 'attend-not-direct',
        label: 'Watch from the crowd and let Kit run her own strange afternoon',
        success: {
          text: 'Kit spots you cheering and bows with exaggerated solemnity. You have not fixed anything, claimed anything or asked her to explain why you left. Sometimes that is enough.',
          effects: { flag: 'kit_parade_witness' },
        },
      },
    ],
    provenance:
      'Eureka waterfront is real; the parade, maker agreements, characters and floats are invented. Kit is Hmong American, but she is not a stand-in for Hmong cultural tradition.',
  },
  {
    id: 'FR-JUNIPER-01',
    kind: 'encounter',
    chapter: 3,
    requiresFormerGuide: 'juniper',
    place: 'Sequoia Park, Eureka',
    title: 'The Forest’s Comment Period',
    scene: 'grove',
    body: [
      'Juniper has posted a handmade sign beside a sapling: PUBLIC COMMENT PERIOD, PLEASE DO NOT ADDRESS THE TREES AS A GROUP. A trail crew, a walker with a mobility aid and one opinionated jay have all arrived.',
      'She once thought a forest could be protected by keeping everyone out. Now she is learning the harder skill of listening to people who need different things from the same path. She nods when she sees you, but the meeting belongs to the people present.',
    ],
    choices: [
      {
        id: 'accessible-crossing',
        label: 'Help the crew find a low-impact accessible route together',
        check: { skill: 'wits', target: 9 },
        success: {
          text: 'The revised trail bends around the roots without shutting out the walker. Juniper objects to one railing, then helps build it where it will do the least harm.',
          effects: { goodwill: 1, flag: 'juniper_accessible_path' },
        },
        failure: {
          text: 'Your first map overlooks a steep grade. The walker points it out. Juniper asks them to lead the next survey rather than pretending your map was good enough.',
          effects: { flag: 'juniper_second_survey' },
        },
      },
      {
        id: 'bird-conditions',
        label:
          'Ask Juniper to write what the wildlife needs without claiming to speak for it all',
        check: { skill: 'psyche', target: 7 },
        success: {
          text: 'She writes down the nesting dates and the uncertainties. The jay adds a complaint about hats. The trail crew agrees to seasonal changes but declines the hat ordinance.',
          effects: {
            evidence: 'Seasonal habitat notes with uncertainty',
            flag: 'juniper_seasonal_habitat',
          },
        },
        failure: {
          text: 'The jay repeatedly interrupts. Juniper laughs, then asks a volunteer naturalist to check the dates in the morning.',
          effects: { flag: 'juniper_habitat_followup' },
        },
      },
      {
        id: 'step-away',
        label:
          'Leave the meeting with Juniper, but let her decide whether to return',
        success: {
          text: 'You walk a little way. Juniper stops, turns back toward the arguing group and says she is not done hearing them. You wish her luck and keep walking.',
          effects: { flag: 'juniper_kept_own_work', nerve: 1 },
        },
      },
    ],
    provenance:
      'Sequoia Park is real. This meeting, characters, accessibility project and supernatural nymph are invented; no real public land decision is implied.',
  },
  {
    id: 'FR-CEDAR-01',
    kind: 'encounter',
    chapter: 5,
    requiresFormerGuide: 'cedar',
    place: 'Eel River valley',
    title: 'A Radio Repeater for Nobody’s Kingdom',
    scene: 'rivermouth',
    body: [
      'Cedar is waist-deep in a shed full of old radio equipment. A sign says FREE SIGNAL, NO KINGS. His father has brought a logger’s tool box and his mother a stack of notes from an earlier community meeting. They disagree about batteries but not about whether the project should be useful.',
      'Cedar looks up, recognizes you and asks whether you have come to help or merely to admire a tower that currently reaches three houses and a suspiciously interested goat.',
    ],
    choices: [
      {
        id: 'community-license',
        label: 'Help write a community-owned maintenance and privacy agreement',
        check: { skill: 'lore', target: 9 },
        success: {
          text: 'The co-op reserves repair training for locals and publishes who can see the logs. Cedar’s parents argue over the title and sign on the same line.',
          effects: { goodwill: 1, flag: 'cedar_repeater_coop' },
        },
        failure: {
          text: 'The first draft gives one volunteer too much access. Cedar catches it, his parents demand a revision, and the goat eats the extra copy.',
          effects: { flag: 'cedar_repeater_privacy_fix' },
        },
      },
      {
        id: 'measure-power',
        label:
          'Test the power draw before anyone promises a technological utopia',
        check: { skill: 'wits', target: 7 },
        success: {
          text: 'The repeater can run on a modest shared solar bank if someone pays attention to winter. Cedar writes the numbers beside the goat’s name in the work log.',
          effects: {
            evidence: 'Measured community repeater power budget',
            flag: 'cedar_repeater_power_plan',
          },
        },
        failure: {
          text: 'The battery dies midway through the demonstration. His mother offers a flashlight; his father offers a new terminal. Neither claims that will settle the argument.',
          effects: { flag: 'cedar_repeater_power_retry' },
        },
      },
      {
        id: 'respect-the-build',
        label: 'Hand Cedar a wrench, then leave him to finish his own work',
        success: {
          text: 'He waves the wrench like a conductor’s baton. The signal improves by exactly one house. The goat remains beyond coverage, an independent citizen.',
          effects: { flag: 'cedar_independent_builder', nerve: 1 },
        },
      },
    ],
    provenance:
      'The Eel River valley is real; Cedar, his intact fictional family, radio system and goat are fictional. This is not a claim about any specific organization, land agreement or real historical participant.',
  },
  {
    id: 'FR-ASSEMBLY-01',
    kind: 'encounter',
    chapter: 3,
    requiresMeetCount: 2,
    place: 'Eureka waterfront',
    title: 'The Potluck That Refuses to Become a Council',
    scene: 'bay',
    body: [
      'Someone has set up a soup table beside a repair workshop. Two people you recognize from the weekend are there, busy with other conversations. A handwritten sign says EVERYBODY WELCOME. Beneath it: THIS IS NOT A GOVERNMENT.',
      'Nobody demands a reunion. Some people are still annoyed with one another. Yet tools, food and useful information are moving between tables, which might be the closest thing the county has to a working miracle.',
    ],
    meetingLines: {
      mara: 'Mara has drawn the supply budget on a napkin with a grease pencil. She keeps the private designs in her closed sketchbook and asks who is paying the dishwasher.',
      kit: 'Kit has balanced a bent bicycle wheel over the soup table. The wheel turns toward whoever is talking, a splendid effect she admits is mostly a draft from the kitchen.',
      juniper: 'Juniper has brought seedlings for the rain-soaked verge. She wants to know who will water them in August, and she will not accept the answer “the forest” this time.',
      cedar: 'Cedar has built a hand-cranked radio that announces the next volunteer shift in a voice from yesterday. He has also posted a paper roster for people who do not trust the radio.',
    },
    flagLines: {
      slug_sank: {
        all: 'Someone produces your waterlogged race number as a ceremonial soup coaster. Nobody offers to erase the sinking from the story; the people who helped bail the sculpture are still laughing together.',
      },
    },
    lensLines: {
      sober:
        'You count shared tools and notice who is cleaning up. Good intentions are wonderful; someone still has to wash the bowls.',
      tipsy:
        'The potluck is one long conversational accident. You laugh at a joke, then help an embarrassed stranger find their soup.',
      stoned:
        'A wrench passes between hands, followed by a bowl. The pattern is interesting precisely because nobody appears to own it.',
      tripping_balls:
        'The potluck resembles a tiny parliament of mismatched spoons. Nobody is elected and everyone has to eat.',
      cocaine:
        'There are too many tasks and half a dozen volunteers. You put the urgent jobs on paper and let the rest wait.',
      meth: 'The crowded room is a lot. Somebody offers you a quiet seat and a later shift, and nobody treats that as leaving the team.',
      mdma: 'People seem briefly connected, though not always in agreement. Asking before hugging keeps the room generous for more than one kind of person.',
    },
    choices: [
      {
        id: 'share-skills',
        label:
          'Offer one useful skill without taking charge of the entire gathering',
        check: { skill: 'rizz', target: 9 },
        success: {
          text: 'You help two strangers exchange a repair trick. They improve it before the soup cools. By dusk you are no longer needed, which is a strangely satisfying result.',
          effects: { goodwill: 1, flag: 'assembly_shared_skills' },
        },
        failure: {
          text: 'Your first explanation makes no sense. Someone shows you a simpler way and the group keeps working. The room has survived a minor outbreak of expertise.',
          effects: { flag: 'assembly_learned_from_others' },
        },
      },
      {
        id: 'make-space',
        label:
          'Make sure people who have been quiet can join on their own terms',
        success: {
          text: 'A visitor asks for a chair at the edge and a written schedule, not an inspirational speech. They get both. Another person simply wants to eat and leave.',
          effects: { goodwill: 1, flag: 'assembly_access_without_pressure' },
        },
      },
      {
        id: 'go-home',
        label: 'Take some soup and leave without promising lifelong friendship',
        success: {
          text: 'Nobody stops you. The soup is good, the county is complicated, and a few people you met are doing things that no longer depend on you.',
          effects: { nerve: 1, flag: 'assembly_respected_independence' },
        },
      },
    ],
    provenance:
      'The Eureka waterfront is real. The gathering, people, project and potluck are entirely fictional. Meeting characters does not imply intimacy, friendship, romance or agreement.',
  },
]
