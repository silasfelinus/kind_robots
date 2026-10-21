import type { DayDef, DueDef, QuestDef } from './types'

// Act I, Days 1-4 (conductor DAY-PLAN.md). The v0.2 Day 1-4 incidents are
// kept as throne-room petitions whose answers post day-length quests.

export const ACT_ONE_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d01-well-road',
    title: 'Clear the Well Road',
    summary:
      'Rockfall blocks the cart road to the tower well. Clear it before the water barrels run dry.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'might', band: 'low' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'low',
    tags: ['repair'],
    rewards: {
      success: { brass: 10, affinity: { freeholds: 5 }, local: { yard: 1 } },
      failure: { local: { yard: -1 } },
    },
    expired: { local: { yard: -2 } },
    outcomes: {
      triumph:
        'The well road is clear. The Freeholders who watched have started calling it the emperor’s road.',
      success:
        'The well road is clear by evening. The water barrels roll again.',
      partial: 'Half the rockfall is moved. Carts pass one at a time.',
      failure: 'The rockfall shifted again. The Yard hauls water by hand.',
      expired:
        'Nobody cleared the road. The Yard hauled water by hand for two days and still talks about it.',
    },
  },
  {
    id: 'q-d01-aqueduct-repair',
    title: 'The Broken Aqueduct',
    summary:
      'Hollow Bell’s aqueduct is leaking into the old roadbed. Send engineers to repair the channel.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'might', band: 'low' },
    ],
    danger: 'low',
    tags: ['repair'],
    rewards: {
      success: {
        brass: 10,
        affinity: { 'hollow-bell': 10 },
        local: { yard: 2 },
      },
      failure: { affinity: { 'hollow-bell': -5 } },
    },
    expired: { affinity: { 'hollow-bell': -8 }, local: { yard: -2 } },
    outcomes: {
      success:
        'Clear water runs to Hollow Bell again. Mara Reedbell sends a barrel of pickled plums and a long thank-you.',
      partial:
        'The leak is slowed, not stopped. Hollow Bell is grateful and damp.',
      failure:
        'The channel collapsed under the engineers. Hollow Bell is drier than before.',
      expired: 'The aqueduct was left to leak. The mayor stopped writing.',
    },
  },
  {
    id: 'q-d01-toll-parley',
    title: 'Painted Wagons at the Toll',
    summary:
      'Offer the Jackalwire wagons safe passage for an armistice at the southern toll bridge.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'guile', band: 'low' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    rewards: {
      success: { brass: 5, affinity: { jackalwire: 15, saltroad: 5 } },
      failure: { affinity: { jackalwire: -5 } },
    },
    expired: { affinity: { saltroad: -5 }, local: { ledger: -2 } },
    outcomes: {
      success:
        'The Pack accepts the armistice and plays a terrible song for the emperor.',
      partial: 'The wagons stay, but nobody draws a blade.',
      failure: 'The parley ended in insults. The toll is still closed.',
      expired:
        'The wagons sat at the bridge all day. Saltroad trade went the long way.',
    },
  },
  {
    id: 'q-d01-toll-break',
    title: 'Break the Blockade',
    summary:
      'Clear the Jackalwire wagons from the southern toll bridge by force.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [{ stat: 'might', band: 'high' }],
    danger: 'mid',
    tags: ['coercion'],
    rewards: {
      success: {
        brass: 15,
        affinity: { jackalwire: -15, saltroad: 10 },
        local: { 'gate-watch': 2 },
      },
      failure: { affinity: { jackalwire: -5 }, local: { 'gate-watch': -2 } },
    },
    expired: { affinity: { saltroad: -5 } },
    outcomes: {
      success:
        'The bridge is open. The Pack withdrew. They will remember who pushed.',
      partial: 'The wagons pulled back a hundred yards and dug in.',
      failure: 'The Pack held the bridge. The Gate Watch is muttering.',
      expired: 'Nobody moved the wagons.',
    },
  },
  {
    id: 'q-d01-mirefen-escort',
    title: 'Lanterns on the Mirefen Road',
    summary:
      'Escort the swamp refugees past the raider scouts. Ask no secrets.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 2,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'mid',
    rewards: {
      success: { affinity: { 'mire-mothers': 15 }, local: { yard: 1 } },
      failure: { affinity: { 'mire-mothers': -5 } },
    },
    expired: { affinity: { 'mire-mothers': -5 } },
    outcomes: {
      success:
        'Every lantern reached the far side. The refugees left a sprig of bog myrtle on the escort’s saddle.',
      partial:
        'Most of the refugees made it. Two lanterns turned back into the fen.',
      failure: 'Raider scouts scattered the column.',
      expired: 'No escort came. The lanterns went on alone.',
    },
  },
  {
    id: 'q-d01-mirefen-inspect',
    title: 'Count the Lanterns',
    summary:
      'Inspect the refugee lanterns on the Mirefen road and record every traveler.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 2,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'low',
    tags: ['records'],
    rewards: {
      success: {
        affinity: { 'mire-mothers': -5 },
        local: { lamplight: 3 },
        flags: ['mire-lantern-ledger'],
      },
      failure: { affinity: { 'mire-mothers': -10 } },
    },
    expired: {},
    outcomes: {
      success:
        'More travelers than lanterns. Some lanterns had no one under them. The Archive has the list.',
      partial: 'The count is half done and doesn’t add up.',
      failure: 'The refugees refused the count. The witches took offense.',
      expired: 'The lanterns passed uncounted.',
    },
  },
  {
    id: 'q-d02-grain-cart',
    title: 'The Drowning Grain Cart',
    summary:
      'A grain cart is stuck midstream at the Eastern Ford. The water is still rising.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'mid',
    tags: ['repair', 'urgent'],
    rewards: {
      success: { brass: 10, affinity: { freeholds: 10 }, local: { yard: 2 } },
      failure: { affinity: { freeholds: -5 } },
    },
    expired: { affinity: { freeholds: -10 }, local: { yard: -2 } },
    outcomes: {
      success: 'The cart is out and the grain is dry. Mostly.',
      partial: 'The cart is out. Half the grain is not.',
      failure: 'The river took the cart.',
      expired:
        'The river took the cart while the court argued about something else.',
    },
  },
  {
    id: 'q-d02-crow-contract',
    title: 'The Fine Print',
    summary:
      'Have the archivists comb the Storm Crow rain contract for loopholes before anyone signs.',
    region: 'storm-crow-heights',
    faction: 'storm-crows',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'lore', band: 'high', hidden: true },
    ],
    danger: 'none',
    tags: ['records', 'weather'],
    rewards: {
      success: {
        brass: 15,
        local: { lamplight: 3 },
        flags: ['crow-contract-read'],
      },
      failure: { affinity: { 'storm-crows': -10 } },
    },
    expired: { affinity: { 'storm-crows': -5 } },
    outcomes: {
      success:
        'Clause nine lets the Conclave name the favor after the rain falls. The court strikes it. The Crows pretend to be impressed.',
      partial:
        'The contract is long and the court is tired. A few clauses are struck.',
      failure:
        'The readers were caught writing in the Conclave’s sacred margins.',
      expired: 'The Crows grew tired of waiting.',
    },
  },
  {
    id: 'q-d02-mole-audit',
    title: 'The Mole Ledger',
    summary:
      'Send quiet auditors into the tunnels to count the tithe the Moles claim they paid.',
    region: 'mole-tunnels',
    faction: 'moles',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['records', 'tunnels'],
    rewards: {
      success: {
        brass: 20,
        affinity: { moles: 5 },
        flags: ['mole-ledger-counted'],
      },
      failure: { affinity: { moles: -10 } },
    },
    expired: { affinity: { moles: -5 } },
    outcomes: {
      success:
        'The tithe was never paid. The Moles never claimed it was. The clerk invented it. The Moles appreciate an honest count.',
      partial: 'The auditors found the ledger but not the tithe.',
      failure: 'The auditors were escorted out of the tunnels, blindfolded.',
      expired: 'Nobody went down. The rumor of a paid tithe grew.',
    },
  },
  {
    id: 'q-d03-three-wells',
    title: 'Three Wells',
    summary:
      'Three villages, one water crew. Split the work so none of the wells goes dry.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 2,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'might', band: 'mid' },
    ],
    danger: 'low',
    tags: ['repair'],
    rewards: {
      triumph: { brass: 15, affinity: { freeholds: 15 }, local: { yard: 3 } },
      success: { brass: 10, affinity: { freeholds: 10 }, local: { yard: 3 } },
      failure: { affinity: { freeholds: -5 } },
    },
    expired: { affinity: { freeholds: -10 } },
    outcomes: {
      triumph:
        'All three wells run clear. For once the villages agree on whom to thank.',
      success: 'All three wells run. One of them tastes of iron.',
      partial: 'Two wells run. The third village is not pleased.',
      failure: 'The wells silted over again.',
      expired: 'The wells went dry and the villages blamed the tower.',
    },
  },
  {
    id: 'q-d03-bell-vigil',
    title: 'The Bell That Rang Alone',
    summary:
      'Post a quiet vigil in Hollow Bell’s old chapel. Wait for the rope to move.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'mid', hidden: true },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'low',
    rewards: {
      success: {
        affinity: { 'hollow-bell': 5 },
        local: { lamplight: 2 },
        flags: ['bell-rings-alone-seen'],
      },
      failure: { local: { lamplight: -1 } },
    },
    expired: {},
    outcomes: {
      success:
        'At the third hour the rope moved. Nobody was holding it. The watchers will say no more in front of the court.',
      partial: 'The vigil heard something. Nobody agrees what.',
      failure: 'The watchers fell asleep in the pews.',
      expired: 'The bell rang again that night, unwatched.',
    },
  },
  {
    id: 'q-d03-bell-search',
    title: 'Muffle the Bell',
    summary:
      'Muffle the clapper. Search the bell tower stairs for whoever rings it.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'might', band: 'low' },
    ],
    danger: 'low',
    tags: ['tracking'],
    rewards: {
      success: {
        affinity: { 'hollow-bell': -3 },
        local: { lamplight: 1 },
        flags: ['bell-stair-searched'],
      },
      failure: { affinity: { 'hollow-bell': -5 } },
    },
    expired: {},
    outcomes: {
      success:
        'The dust on the stairs was undisturbed. Hollow Bell resents the muffled bell.',
      partial: 'The search found footprints going up and none coming down.',
      failure: 'An angry sexton caught the searchers on the stairs.',
      expired: 'Nobody searched the tower.',
    },
  },
  {
    id: 'q-d03-toll-audit',
    title: 'The Vanishing Toll',
    summary:
      'Count every cart through the Jackalwire gate and compare it to the toll ledger.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'guile', band: 'low' },
    ],
    danger: 'low',
    tags: ['records', 'forgery'],
    rewards: {
      success: {
        affinity: { saltroad: 10, jackalwire: -5 },
        local: { ledger: 3 },
      },
      failure: { affinity: { saltroad: -5 } },
    },
    expired: { local: { ledger: -2 } },
    outcomes: {
      success:
        'The toll was never lifted. The clerk skimmed the difference. Saltroad caravans are delighted.',
      partial: 'The count is off, but nobody can prove by whom.',
      failure: 'The counters lost track around the four-hundredth goat.',
      expired: 'The toll stayed a mystery. The Ledger noticed.',
    },
  },
  {
    id: 'q-d03-fen-ambush',
    title: 'Ambush in the Reeds',
    summary:
      'Hide in the reeds. Ambush the lanterns marching through the empty fen.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'high',
    tags: ['coercion'],
    rewards: {
      success: {
        affinity: { 'mire-mothers': -15 },
        local: { 'gate-watch': 3 },
        flags: ['fen-ambush'],
      },
      failure: {
        affinity: { 'mire-mothers': -10 },
        local: { 'gate-watch': -3 },
      },
    },
    expired: {},
    outcomes: {
      success:
        'The lanterns scattered like startled fish. Under the ones the party caught, there was nothing.',
      partial: 'The ambush sprang early. The lanterns went dark and vanished.',
      failure: 'Something in the reeds ambushed the ambushers.',
      expired: 'The lanterns marched on.',
    },
  },
  {
    id: 'q-d03-fen-hail',
    title: 'Hail the Lanterns',
    summary:
      'Light a lantern of your own. Hail the marching lights across the water.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    rewards: {
      success: {
        affinity: { 'mire-mothers': 10 },
        flags: ['fen-lanterns-hailed'],
      },
      failure: { affinity: { 'mire-mothers': -5 } },
    },
    expired: {},
    outcomes: {
      success:
        'The lanterns stopped. A voice answered in a language nobody at court can read. Then, politely, in ours.',
      partial: 'The lanterns paused, then moved on.',
      failure:
        'The lanterns went dark. The hailing lantern went out by itself.',
      expired: 'Nobody hailed them.',
    },
  },
  {
    id: 'q-d04-survey-flags',
    title: 'Flags on the Far Bank',
    summary:
      'Follow the clean-booted surveyors back from the Eastern Ford. Read the seal on their maps.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'low',
    tags: ['tracking', 'records'],
    rewards: {
      success: {
        affinity: { freeholds: 5 },
        local: { lamplight: 2 },
        flags: ['survey-seal-read'],
      },
      failure: { affinity: { freeholds: -3 } },
    },
    expired: { affinity: { freeholds: -5 } },
    outcomes: {
      success:
        'The maps carry a seal nobody at court has seen: a bell with no clapper.',
      partial:
        'The surveyors lost the party in the hills. They dropped a pencil.',
      failure:
        'The surveyors noticed they were followed and burned their maps.',
      expired: 'The flags stayed planted on the far bank.',
    },
  },
  {
    id: 'q-d04-crow-elders',
    title: 'Sit With the Elders',
    summary:
      'Sit with the Storm Crow elders on the cold ledge until someone speaks.',
    region: 'storm-crow-heights',
    faction: 'storm-crows',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'high' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'none',
    tags: ['negotiation', 'weather'],
    rewards: {
      success: {
        affinity: { 'storm-crows': 15 },
        flags: ['crow-silence-explained'],
      },
      failure: { affinity: { 'storm-crows': -5 } },
    },
    expired: {},
    outcomes: {
      success:
        'On the second night an elder spoke. The crows went silent because something to the east stopped singing first.',
      partial: 'The elders nodded once. That was all.',
      failure: 'The envoys fidgeted. The elders turned their backs.',
      expired: 'The Heights stayed silent.',
    },
  },
  {
    id: 'q-d04-crow-roost',
    title: 'Climb to the High Roost',
    summary:
      'Climb to the high roost and see what the silent crows are watching.',
    region: 'storm-crow-heights',
    faction: 'storm-crows',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'might', band: 'mid' },
    ],
    danger: 'mid',
    rewards: {
      success: {
        affinity: { 'storm-crows': -5 },
        local: { lamplight: 2 },
        flags: ['crow-roost-seen'],
      },
      failure: { affinity: { 'storm-crows': -10 } },
    },
    expired: {},
    outcomes: {
      success:
        'From the roost, every crow faces the same way. East, toward the sunken rail yards.',
      partial: 'The climbers saw the crows, and the crows saw them.',
      failure: 'The roost guards were not as silent as the rest.',
      expired: 'Nobody climbed.',
    },
  },
  {
    id: 'q-d04-feast-armed',
    title: 'A Feast Under Painted Wagons',
    summary:
      'Attend the Jackalwire feast with blades hidden in the supply carts.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['coercion'],
    rewards: {
      success: {
        affinity: { jackalwire: -5 },
        local: { 'gate-watch': 2 },
        flags: ['feast-armed'],
      },
      failure: { affinity: { jackalwire: -10 } },
    },
    expired: {},
    outcomes: {
      success:
        'The feast was an ambush. The hidden blades were ready. The party came home with a captured banner.',
      partial:
        'Both sides kept a hand near a knife all night. Nobody ate much.',
      failure: 'The Pack found the hidden blades before dessert.',
      expired: 'The feast went on without the court.',
    },
  },
]

export const ACT_ONE_DAYS: readonly DayDef[] = [
  {
    day: 1,
    title: 'First Bell',
    briefings: [
      {
        id: 'aqueduct',
        source: 'Hollow Bell surveyors',
        text: 'The southern aqueduct is leaking into the old roadbed.',
        truth: true,
      },
      {
        id: 'silver-bell',
        source: 'An overexcited court herald',
        text: 'Hollow Bell cast its famous bell from pure silver.',
        truth: false,
      },
      {
        id: 'wagons',
        source: 'Border outriders',
        text: 'Painted Jackalwire wagons are massing at the southern toll bridge.',
        truth: true,
      },
    ],
    komodo:
      'The outriders agree on the wagons. A silver bell is an expensive story for a town that can’t fix its pipes. Watch the roads.',
    quests: ['q-d01-well-road'],
    audiences: [
      {
        id: 'd01-aqueduct',
        title: 'The Broken Aqueduct',
        speaker: 'Mara Reedbell, Mayor of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'The great doors groan open on your first morning as emperor. Lamp oil and old dust. The first petitioner is halfway up the carpet before the herald finishes her name.',
          'Your Majesty. Congratulations on the crown. It fits you better than the last one. I sent him a great many polite letters.',
          'Hollow Bell’s aqueduct is leaking into the old roadbed. My town drinks from that channel. Every day it leaks, the far wards get thirstier. Louder.',
          'I could raise the money myself, if the crown let me tax my own people. Or send someone who knows what a sluice is.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'A mayor who asks leave to tax her own town, Your Majesty, wants someone else’s name on the order.',
          },
        ],
        options: [
          {
            id: 'ask-why',
            label: 'Ask why she needs the crown’s leave to tax her own people.',
            effects: {},
            response:
              'Mara’s smile holds. She sets her ledger down on the dais step. Komodo tells you later she has never once done that.',
            next: 'millers',
          },
          {
            id: 'repair',
            label: 'Send engineers to repair the channel.',
            effects: {},
            response:
              'Mara writes something in her ledger. “Then I’ll expect them.”',
            postsQuests: ['q-d01-aqueduct-repair'],
          },
          {
            id: 'levy',
            label:
              'Levy the town for emergency repairs. The crown takes its share.',
            effects: {
              brass: 25,
              affinity: { 'hollow-bell': -10 },
              local: { ledger: 2, yard: -3 },
            },
            response:
              'Mara’s smile does not move. “Hollow Bell will pay. Hollow Bell will remember paying.”',
          },
        ],
        beats: [
          {
            id: 'millers',
            lines: [
              '“Because the last time Hollow Bell raised a levy, it fell on the people with the least. I signed it.”',
              '“The mill families own the sluice gates. One season’s flour would pay for the repair. They won’t pay unless an emperor orders it. If I order it, the next mayor is someone more reasonable.”',
              '“So. Send engineers, and the millers keep their money. Levy the whole town, and the poor wards pay again. Or order the mill families alone to pay, and I am the reluctant servant of a hard crown.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'There it is. She is offering you the blame, Your Majesty. Blame is the one thing in Hollow Bell nobody wants to keep.',
              },
            ],
            options: [
              {
                id: 'repair',
                label: 'Send engineers anyway. The millers keep their flour.',
                effects: {},
                response:
                  '“Then I’ll expect them.” Mara picks up the ledger. “I’ll remember who kept peace with the millers. Not me.”',
                postsQuests: ['q-d01-aqueduct-repair'],
              },
              {
                id: 'levy-millers',
                label:
                  'Sign the order. The mill families pay. The crown takes the blame.',
                effects: {
                  brass: 5,
                  affinity: { 'hollow-bell': 10 },
                  local: { 'old-houses': -2, yard: 1 },
                  flags: ['mara-millers-levy'],
                },
                response:
                  'Mara reads the order twice and folds it once. She bows lower than when she came in. “They will hate you, Your Majesty. The wards will drink.” In the gallery an Old House fan snaps shut.',
                postsQuests: ['q-d01-aqueduct-repair'],
              },
              {
                id: 'levy',
                label:
                  'Levy the whole town, as before. The crown takes its share.',
                effects: {
                  brass: 25,
                  affinity: { 'hollow-bell': -10 },
                  local: { ledger: 2, yard: -3 },
                },
                response:
                  '“As before,” Mara says. “Yes. Hollow Bell is used to as before.” She does not bow on her way out.',
              },
            ],
          },
        ],
      },
      {
        id: 'd01-toll',
        title: 'Painted Wagons at the Toll',
        speaker: 'A Jackalwire captain',
        faction: 'jackalwire',
        lines: [
          'The next petitioner does not wait to be announced. A hyena with a painted jaw, boots unlaced, a fiddle on her back. Her grin is a dropped knife.',
          'Nice tower. The southern toll bridge is ours now. So are the carts that want to cross it.',
          'We can talk. You can pay. Or you can try to move us. Everybody gets three choices in the wasteland. The third one is always loud.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Saltroad’s medicine carts cross that bridge, Your Majesty. Half our grain too. She knows. That’s why she’s smiling.',
          },
        ],
        options: [
          {
            id: 'ask-toll',
            label: 'Ask what the Pack wants the toll money for.',
            effects: {},
            response:
              'The captain stops grinning. It is the worst thing she has done so far.',
            next: 'dust-lung',
          },
          {
            id: 'parley',
            label: 'Offer safe passage in exchange for an armistice.',
            effects: {},
            response:
              'The captain laughs. “Send someone who can hold a tune. We’ll see.”',
            postsQuests: ['q-d01-toll-parley'],
          },
          {
            id: 'break-toll',
            label: 'Tell the captain the bridge will be cleared by force.',
            effects: { local: { 'gate-watch': 1 } },
            response:
              'The captain spits on your floor. Cheerfully. “Bring friends.”',
            postsQuests: ['q-d01-toll-break'],
          },
          {
            id: 'pay',
            label: 'Pay the toll for every Saltroad cart this week.',
            requires: { cost: 20 },
            effects: {
              affinity: { jackalwire: 5, saltroad: 5 },
              local: { ledger: -1 },
            },
            response:
              'The captain bites a brass bit, nods, and leaves a painted feather on the arm of your throne.',
          },
        ],
        beats: [
          {
            id: 'dust-lung',
            lines: [
              '“Dust lung. Half our pups cough black by morning. Saltroad sells the tincture at triple last year’s price. Who else sells to hyenas?”',
              '“So we stand on their bridge. Their carts pay us. We pay them for tincture. Everybody calls us raiders. Nobody calls them anything.”',
              '“You want the bridge open? Get my pups their medicine and I’ll play your coronation march myself. Badly. With feeling.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'It may be true, Your Majesty. It is also the story a clever raider tells a new emperor with a soft face.',
              },
            ],
            options: [
              {
                id: 'medicine',
                label:
                  'Buy the tincture yourself. Hand it over at the bridge if the toll lifts today.',
                requires: { cost: 30 },
                effects: {
                  affinity: { jackalwire: 15, saltroad: -5 },
                  local: { yard: 1 },
                  flags: ['pack-medicine'],
                },
                response:
                  'She takes your hand in both of hers and squeezes until it hurts. By evening the wagons have rolled back, and the Saltroad factor sends a cold letter about undercutting the market.',
              },
              {
                id: 'informant',
                label:
                  'Thank her. Then pay one of her crew to show you where the Pack sleeps.',
                requires: { cost: 10 },
                effects: {
                  local: { 'gate-watch': 1 },
                  flags: ['pack-camp-mapped'],
                },
                response:
                  'She leaves without a deal. That night at the postern a young hyena with a bandaged paw takes your brass and draws the camp on a ration card, eyes down. The Gate Watch pins the card above their fire.',
              },
              {
                id: 'parley',
                label: 'Offer safe passage in exchange for an armistice.',
                effects: {},
                response:
                  '“An armistice doesn’t cure a cough. It’s a start. Send someone who can hold a tune.”',
                postsQuests: ['q-d01-toll-parley'],
              },
              {
                id: 'break-toll',
                label:
                  'Tell her sick pups are not the crown’s problem. The bridge will be cleared.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  'She looks at you a long time. Then she spits on your floor, not cheerfully. “Bring friends. Bring a lot of them.”',
                postsQuests: ['q-d01-toll-break'],
              },
            ],
          },
        ],
      },
      {
        id: 'd01-mirefen',
        title: 'Lanterns on the Mirefen Road',
        speaker: 'Sister Reedlight of the Mire Mothers',
        npc: 'sister-reedlight',
        faction: 'mire-mothers',
        lines: [
          'The last petitioner brings the fen in with her: wet peat, bog myrtle, and honey. Her lantern is lit at noon. When the doors swing shut, the flame does not move.',
          'We are only refugees, Your Majesty. Raider scouts watch the Mirefen road. Our people travel by lantern.',
          'An escort would be a kindness. We ask nothing else. Not bread. Not beds. A safe road for one night.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Mire Mothers have asked the throne for nothing in eleven years, Your Majesty. Humble, or patient.',
          },
        ],
        options: [
          {
            id: 'ask-lanterns',
            label: 'Ask why a refugee’s lantern burns without oil.',
            effects: {},
            response:
              'Sister Reedlight looks at the lantern. Then she laughs. It is a good laugh. You don’t trust it.',
            next: 'lanterns',
          },
          {
            id: 'escort',
            label: 'Escort the refugees without asking their secrets.',
            effects: {},
            response:
              'Sister Reedlight bows low. Her lantern does not flicker.',
            postsQuests: ['q-d01-mirefen-escort'],
          },
          {
            id: 'question',
            label: 'Inspect the lanterns and record every traveler.',
            effects: { local: { lamplight: 1 } },
            response: '“Of course,” says Sister Reedlight, a moment too late.',
            postsQuests: ['q-d01-mirefen-inspect'],
          },
        ],
        beats: [
          {
            id: 'lanterns',
            lines: [
              '“Marsh gas, Your Majesty. The fen breathes, and we catch its breath in glass. The only thing the fen gives free.”',
              '“Forty-one of us on the road tonight. Old ones. Children. A cutter with a broken leg. If you would rather count us than guard us, I understand. A new crown has to know what walks under it.”',
              '“But I will tell you what the raiders do while your clerks count.”',
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'Marsh gas burns blue and smells of eggs, Your Majesty. That flame is gold. It smells of honey. It is not marsh gas.',
              },
            ],
            options: [
              {
                id: 'escort',
                label: 'Guard them tonight. Questions can wait for daylight.',
                effects: {},
                response:
                  'Sister Reedlight bows low. “The fen remembers kindness.” Kiyo watches her all the way to the doors.',
                postsQuests: ['q-d01-mirefen-escort'],
              },
              {
                id: 'quiet-count',
                label:
                  'Guard them. Have the escort count heads on the way, quietly.',
                effects: {
                  local: { lamplight: 1 },
                  flags: ['mire-quiet-count'],
                },
                response:
                  '“You are kind,” says Sister Reedlight. “And careful.” She says careful like a word in a foreign language.',
                postsQuests: ['q-d01-mirefen-escort'],
              },
              {
                id: 'close-road',
                label:
                  'Close the road. The tower can’t protect strangers it doesn’t know.',
                effects: {
                  affinity: { 'mire-mothers': -15 },
                  local: { 'gate-watch': 2 },
                  flags: ['mire-road-closed'],
                },
                response:
                  'She does not argue. That night you watch forty-one gold lights turn back into the fen and go out, one by one. You never learn whether the raiders found them, or whether they chose to stop shining.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 2,
    title: 'Dust Tax',
    briefings: [
      {
        id: 'crow-rain',
        source: 'Storm Crow weather-reader',
        text: 'The Conclave will trade a season of rain for a single favor from the tower.',
        truth: true,
      },
      {
        id: 'mole-tithe',
        source: 'A nervous tax clerk',
        text: 'The Moles have started paying the imperial tithe in full and on time.',
        truth: false,
      },
      {
        id: 'ford-drowned-cart',
        source: 'Eastern Ford ferrymen',
        text: 'A grain cart is stuck midstream and the water is still rising.',
        truth: true,
      },
    ],
    komodo:
      'Ferrymen don’t invent drowning carts. The tithe story would make a clerk smile, and Moles never make clerks smile. Choose your roads, Your Majesty.',
    quests: ['q-d02-grain-cart', 'q-d02-mole-audit'],
    audiences: [
      {
        id: 'd02-dust-tax',
        title: 'Dust Tax',
        speaker: 'Factor Marisol Tallow and Foreman Dunmore Ash',
        npc: 'marisol-tallow',
        faction: 'ledger',
        lines: [
          'They come up the carpet side by side, neither willing to go second. Factor Marisol Tallow, a raccoon in a brass-buttoned waistcoat, carries two drafts of one charter, the tax rate blank on both. Foreman Dunmore Ash, a heavy boar in a floury apron, carries nothing. He folds his arms. That is his argument.',
          '“Your Majesty. The wasteland will judge you first by the fortress market. Tax it light and the caravans come here, not the Ford. Tax it hard and they come once, pay once, and tell the whole road.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: '“Wages.”',
          },
          '“The foreman means,” says Tallow, “tax my members so the Yard can pay his. He’s said it all morning. That was the long version.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: '“Ovens don’t light on maybes. Decide before lunch, Majesty. The Yard eats at noon or it doesn’t.”',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Whatever rate you name goes on the gate by evening, Your Majesty. The first law of your reign anyone can read.',
          },
        ],
        options: [
          {
            id: 'ask-wages',
            label: 'Ask the foreman how far behind the Yard’s wages are.',
            effects: {},
            response:
              'Dunmore unfolds his arms for the first time this morning. Tallow closes her charter.',
            next: 'chits',
          },
          {
            id: 'high',
            label: 'Tax the market hard. The crown needs brass.',
            effects: {
              brass: 30,
              local: { ledger: -3, yard: -1 },
              flags: ['tax-high'],
              schedule: ['market-rate-hard'],
            },
            response:
              'Tallow writes the rate into both drafts. Dunmore watches the brass go into the strongbox, then looks at his own empty hands.',
          },
          {
            id: 'fair',
            label:
              'A fair rate, posted on the gate where everyone can read it.',
            effects: {
              brass: 15,
              local: { ledger: 1, yard: 1, lamplight: 1 },
              flags: ['tax-posted'],
            },
            response:
              'By evening the rate is painted on the gate in letters a hand high. Nobody is delighted. Everybody can read it.',
          },
          {
            id: 'low',
            label: 'Tax the market lightly. Let trade grow.',
            effects: {
              local: { ledger: 3, yard: 2, 'old-houses': -2 },
              flags: ['tax-low'],
              schedule: ['market-rate-light'],
            },
            response:
              'Tallow beams and signs both drafts. Dunmore leaves without a word. An Old House lord starts a letter about merchants taxed below landlords.',
          },
        ],
        beats: [
          {
            id: 'chits',
            lines: [
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: '“Six weeks. The old emperor paid the Yard in chits. Paper. Good for a wage when the treasury fills. The treasury never filled.”',
              },
              '“And when a cook’s children are hungry, Your Majesty,” says Tallow, smooth as lamp oil, “a chit is worth what someone pays for it today. The Ledger paid a third. Nobody else paid anything.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: '“So the Ledger holds the Yard’s wages now. Most of them.” He looks at the factor without heat, which is worse. “Tax the market hard to pay the chits, and the brass goes from her members’ stalls to her members’ strongbox. Three times what they paid. The cooks see none of it.”',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'It is legal, Your Majesty. That’s the impressive part. She bought the Yard’s wages at a third. Now she wants thanks at full.',
              },
              '“We took a risk nobody else would,” Tallow says. “Void honest paper, and next time the crown needs a loan, the Ledger has short arms.”',
            ],
            options: [
              {
                id: 'void-chits',
                label:
                  'Void the bought chits. Pay the cooks and stablehands from the crown’s strongbox.',
                requires: { cost: 25 },
                effects: {
                  local: { yard: 3, ledger: -3, 'old-houses': -1 },
                  flags: ['d02-chits-voided'],
                },
                response:
                  'Tallow’s pen stops. “Honest paper,” she says to no one, and folds the chits away like a losing hand. Dunmore nods once, which from him is a speech. In the gallery, the Old Houses start counting their own paper.',
                next: 'rate',
              },
              {
                id: 'redeem-at-cost',
                label:
                  'Buy the chits back at the third the Ledger paid. Nobody profits from the Yard’s hunger.',
                requires: { cost: 10 },
                effects: {
                  local: { ledger: -1, lamplight: 1, 'old-houses': 1 },
                  flags: ['d02-chits-at-cost'],
                },
                response:
                  '“A third. The Ledger made nothing and lost nothing.” Tallow sounds impressed. Dunmore refolds his arms. “Nobody profits. Nobody gets paid, either.”',
                next: 'rate',
              },
              {
                id: 'high',
                label:
                  'Tax the market hard anyway. The chits can wait. The strongbox can’t.',
                effects: {
                  brass: 30,
                  local: { ledger: -3, yard: -1 },
                  flags: ['tax-high'],
                  schedule: ['market-rate-hard'],
                },
                response:
                  'Tallow writes the rate in and smiles at nobody. Paper keeps. Dunmore watches the brass go into the strongbox, and the Yard knows before he gets home.',
              },
              {
                id: 'low',
                label:
                  'Tax the market lightly. Let the Ledger profit from trade, not from the Yard.',
                effects: {
                  local: { ledger: 3, yard: 2, 'old-houses': -2 },
                  flags: ['tax-low'],
                  schedule: ['market-rate-light'],
                },
                response:
                  'Tallow signs with a flourish. Dunmore gives you a long, flat look. The chits stay in her strongbox, but cheap market means cheap bread. He takes the bread and leaves the look.',
              },
            ],
          },
          {
            id: 'rate',
            lines: [
              'Tallow unfolds her drafts. The rate is still blank on both. Dunmore folds his arms again, looser.',
              '“The chits were yesterday’s debt,” says Tallow. “The rate is tomorrow’s. Name it. It goes on the gate before the Yard eats.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: '“Whatever you name. We’ll know who it’s for.”',
              },
            ],
            options: [
              {
                id: 'high',
                label:
                  'Tax the market hard. The strongbox is lighter than it was this morning.',
                effects: {
                  brass: 30,
                  local: { ledger: -3, yard: -1 },
                  flags: ['tax-high'],
                  schedule: ['market-rate-hard'],
                },
                response:
                  'Tallow writes it in. “One hand gives, the other takes.” Dunmore looks at both your hands, checking which one fed him.',
              },
              {
                id: 'fair',
                label:
                  'A fair rate, posted on the gate where everyone can read it.',
                effects: {
                  brass: 15,
                  local: { ledger: 1, yard: 1, lamplight: 1 },
                  flags: ['tax-posted'],
                },
                response:
                  'By evening the rate is on the gate, and under it, in smaller letters: Chits settled. Nobody is delighted. Everybody can read it.',
              },
              {
                id: 'low',
                label:
                  'Tax the market lightly. Let the Ledger earn back its loss honestly.',
                effects: {
                  local: { ledger: 3, yard: 2, 'old-houses': -2 },
                  flags: ['tax-low'],
                  schedule: ['market-rate-light'],
                },
                response:
                  'Tallow’s smile comes back slow. “Honestly. The Ledger can do honestly, at this rate.” An Old House lord leaves early to write a letter.',
              },
            ],
          },
        ],
      },
      {
        id: 'd02-millers-price',
        title: 'The Millers’ Price',
        speaker: 'Aldous Hopper of the Hollow Bell mill families',
        faction: 'old-houses',
        requires: { flags: ['mara-millers-levy'] },
        lines: [
          'The best-dressed petitioner the hall has seen: a miller’s white coat cut like a courtier’s. He sets a heavy purse on the dais step and keeps his hand on it. Flour drifts from his sleeves when he bows.',
          '“Aldous Hopper, Your Majesty, of the Hollow Bell mill families. We have paid your aqueduct levy. Every copper. I brought the receipt myself, so nobody doubts our loyalty.”',
          '“I also brought the new price of flour. Hollow Bell flour feeds your Yard. From this week it costs a third more. Sluices are expensive. The crown taught us that.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: '“A third.” The Yard’s foreman has stopped at the back of the hall. “That’s your levy, Majesty. Out of my ovens.”',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'You signed that order so Hollow Bell’s poor would drink, Your Majesty. The millers sent the bill to the fortress’s poor instead. Admire the plumbing.',
          },
        ],
        options: [
          {
            id: 'ask-who-paid',
            label:
              'Ask Hopper who in the mill families actually paid the levy.',
            effects: {},
            response:
              'Hopper smiles like a man asked a rude question at dinner. “The mills paid, Your Majesty.” A pause. “The mills are a great many people.”',
            next: 'grinders',
          },
          {
            id: 'cap-flour',
            label:
              'Cap Hollow Bell flour at last season’s price, by crown order.',
            effects: {
              affinity: { 'hollow-bell': -5 },
              local: { 'old-houses': -2, yard: 2 },
              flags: ['d02-flour-capped'],
            },
            response:
              'Hopper bows exactly as low as before. “Then the mills grind exactly as much as last season. Not one sack more.” At the back of the hall, Dunmore nods.',
          },
          {
            id: 'let-it-rise',
            label:
              'Let the price rise. The levy was for Hollow Bell’s water, not the Yard’s bread.',
            effects: {
              local: { yard: -2, 'old-houses': 1 },
              flags: ['d02-flour-dear'],
            },
            response:
              'Hopper picks up his purse. Dunmore leaves. That night the Yard’s loaves come out a finger thinner, and every cook knows whose finger.',
          },
          {
            id: 'crown-pays',
            label:
              'Have the crown pay the difference on the Yard’s flour this season.',
            requires: { cost: 20 },
            effects: {
              local: { yard: 2, ledger: -1 },
              flags: ['d02-flour-subsidy'],
            },
            response:
              'Hopper takes the brass like a man who won and wants you to call it a draw. The Yard eats as before. The Ledger’s clerks note that the crown now buys its commons’ bread, and underline it twice.',
          },
        ],
        beats: [
          {
            id: 'grinders',
            lines: [
              '“The families own the mills,” Hopper says. “Grinders work them. The crown asked the mills for a levy, so the mills asked the grinders for more work at less pay. As mills do in a hard season. Nobody was forced. Nobody had to be.”',
              '“So the levy is paid. Hollow Bell drinks. The mayor is grateful, and my cousins are not one copper poorer.” He spreads floury hands. “Call it unjust, Your Majesty. Then tell me which law it breaks.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He’s right, Your Majesty. There’s no law. There could be by tomorrow. The Old Houses would ask whose arrangements it reaches next.',
              },
            ],
            options: [
              {
                id: 'post-names',
                label:
                  'Post the names of the families who passed the levy down, beside the tax rate.',
                effects: {
                  affinity: { 'hollow-bell': 5 },
                  local: { lamplight: 2, 'old-houses': -3 },
                  flags: ['d02-mill-names-posted'],
                },
                response:
                  'Hopper reads his own name before the ink is dry. He doesn’t protest. He memorizes the clerk’s face and bows deep on his way out, like a man paying a debt he means to collect.',
              },
              {
                id: 'refund-grinders',
                label:
                  'Refund the grinders’ lost wages from the crown’s strongbox. Let the families keep their pride.',
                requires: { cost: 25 },
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { yard: -1, 'old-houses': 1 },
                  flags: ['d02-grinders-refunded'],
                },
                response:
                  'A crown courier who has never seen a mill pays the grinders. Mara Reedbell sends one line of thanks. The mill families send nothing, keep flour a third dearer, and the fortress Yard pays it.',
              },
              {
                id: 'cap-flour',
                label:
                  'Cap the flour price anyway. If the families must squeeze someone, let it be each other.',
                effects: {
                  affinity: { 'hollow-bell': -5 },
                  local: { 'old-houses': -2, yard: 2 },
                  flags: ['d02-flour-capped'],
                },
                response:
                  '“Each other,” Hopper says, tasting it. “Your Majesty has never been to a mill families’ supper.” He leaves the purse on the step a moment too long.',
              },
              {
                id: 'let-it-rise',
                label:
                  'Let it stand. The crown asked for a levy and got one. How is not its business.',
                effects: {
                  local: { yard: -2, 'old-houses': 1 },
                  flags: ['d02-flour-dear'],
                },
                response:
                  'Hopper bows. “Your Majesty understands mills.” It is not a compliment. In Hollow Bell the grinders work longer for less, and drink clean water after dark.',
              },
            ],
          },
        ],
      },
      {
        id: 'd02-rain-bargain',
        title: 'A Bargain in Rain',
        speaker: 'A Storm Crow envoy',
        faction: 'storm-crows',
        lines: [
          'The Storm Crow envoy arrives dry. It has not rained on the fortress in thirty-eight days. His oilcloth mantle has never been wet.',
          'He does not approach the throne. He unrolls a contract from the top step and lets it run down the carpet. The scroll reaches the doors.',
          '“The Conclave offers a season of rain on your dry fields, Your Majesty. Soft rain, at night, the kind that soaks. In return, one favor from the tower. Named later.”',
          '“The contract is here. It is long. We are sure you will find it fair.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Yard’s kitchen gardens have ten days left, Your Majesty. The Conclave knows it to the day. That’s what they sell. Not the rain. The knowing.',
          },
        ],
        options: [
          {
            id: 'ask-favors',
            label:
              'Ask what favor the Conclave named the last time a ruler signed.',
            effects: {},
            response:
              'The envoy tilts his head like a bird at movement in the grass. “How historically minded. Very well.”',
            next: 'named',
          },
          {
            id: 'honest-terms',
            label:
              'Sign it plainly. Ask only that the favor be named to your face.',
            effects: {
              affinity: { 'storm-crows': 10 },
              flags: ['crow-favor-owed'],
            },
            response:
              '“Plainly. How unusual.” The envoy rolls the contract up himself, end to end. The rain comes in four days.',
          },
          {
            id: 'fine-print',
            label: 'Have the contract read line by line before anyone signs.',
            effects: {},
            response:
              'The envoy settles on the bottom step to wait, like he expected nothing else, and preens.',
            postsQuests: ['q-d02-crow-contract'],
          },
          {
            id: 'decline',
            label: 'Decline. The tower will find its own water.',
            effects: { affinity: { 'storm-crows': -5 } },
            response:
              '“Of course.” The envoy looks up through the high windows at the clear sky, like a man reading a clock.',
          },
        ],
        beats: [
          {
            id: 'named',
            lines: [
              '“The last emperor signed in a dry year, like this one. The rain came. The harvest came. Eleven months later the Conclave named its favor: one child of the fortress Yard, bonded to the Heights as a runner for seven years.”',
              '“The child was chosen by lot. All very fair. She eats well. She learns her letters. She has seen weather no one in this hall will see. Many runners are grateful.” A pause. “Many.”',
              '“We don’t always name a child. Sometimes a well, or a vote, or a silence. We name what the moment needs. That is what a season of rain is worth.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: '“Her name was Wren.” The foreman never left. “Her mother still sets a place.”',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'One child for a season of harvest, Your Majesty. I’ve read the old granary books. The year the rain failed, the Yard buried more than one. I only say what the ledger says.',
              },
            ],
            options: [
              {
                id: 'no-persons',
                label:
                  'Sign, but strike a line in your own hand: the favor will never be a person.',
                effects: {
                  affinity: { 'storm-crows': 5 },
                  local: { yard: -1, 'old-houses': 1 },
                  flags: ['d02-favor-no-persons'],
                },
                response:
                  '“Accepted. A favor with a fence around it is worth less, and we price accordingly.” The rain comes in six days, thin and late, mostly on the Old Houses’ terraces. The Yard’s gardens get the edges.',
              },
              {
                id: 'buy-bond',
                label:
                  'Leave the contract unsigned. Pay Wren’s bond and bring her home.',
                requires: { cost: 30 },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  local: { yard: 3 },
                  flags: ['d02-wren-bond-bought'],
                },
                response:
                  'The envoy names thirty brass. He brought the number with him. “She’ll be sent down within the month. She may not want to come.” The sky stays clear and hard.',
              },
              {
                id: 'honest-terms',
                label:
                  'Sign plainly. The fields can’t wait on the Conclave’s conscience, or yours.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  flags: ['crow-favor-owed'],
                },
                response:
                  '“Plainly. How unusual.” The rain comes in four days, soft and soaking, as promised. In the Yard a woman sets a place at her table and does not look at the sky.',
              },
              {
                id: 'fine-print',
                label:
                  'Have it read line by line. If there’s a clause about children, find it.',
                effects: {},
                response:
                  '“There is no clause about children,” the envoy says, settling onto the step. “There is a clause about favors. Ninth arm’s length.”',
                postsQuests: ['q-d02-crow-contract'],
              },
              {
                id: 'decline',
                label: 'Decline. The tower will find its own water.',
                effects: { affinity: { 'storm-crows': -5 } },
                response:
                  '“Of course.” He rolls the contract up slowly. The court watches the season of rain go back into his sleeve.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 3,
    title: 'Three Wells',
    whisper: {
      source: 'A junior clerk of the Lamplight Archive, sorting dispatches',
      text: 'Our sources come good two times in three, Your Majesty. The trick is knowing which third.',
    },
    briefings: [
      {
        id: 'jackal-toll-lifted',
        source: 'A cheerful toll-clerk',
        text: 'Jackalwire has abolished its road toll out of loyalty to the tower.',
        truth: false,
      },
      {
        id: 'bell-without-hand',
        source: 'Hollow Bell pilgrims',
        text: 'The bell at the old chapel rang all night and nobody was near the rope.',
        truth: true,
      },
      {
        id: 'mire-lights',
        source: 'Mirefen reed-cutters',
        text: 'Lanterns are moving through the fen where no one lives. They move together.',
        truth: true,
      },
    ],
    komodo:
      'A bell that rings itself is a rumor with a rope in it. Lanterns in step are rarely ghosts. And the toll-clerk is smiling, Your Majesty. Nobody abolishes a toll and smiles.',
    quests: ['q-d03-three-wells', 'q-d03-toll-audit'],
    audiences: [
      {
        id: 'd03-bell-vigil',
        title: 'The Bell That Rang Alone',
        speaker: 'Mara Reedbell, Mayor of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'Mara Reedbell comes up the carpet out of breath. Nobody has seen that before. Her ledger is chained to her belt. The little hand-bell beside it is wrapped in cloth and knotted shut.',
          '“The old chapel bell rang all night, Your Majesty, and nobody was near the rope. The chapel was locked. I hold the only key.”',
          '“Half the town says it’s a warning. Half says it’s a welcome. Nobody goes out after dark. My people are frightened.”',
          '“I would rather it stayed a story. But if the crown wants to look, look quietly.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'She holds the only key, Your Majesty, and she wants us to look quietly. Those two facts sit close together.',
          },
        ],
        options: [
          {
            id: 'ask-key',
            label: 'Ask Mara where she was when the bell began to ring.',
            effects: {},
            response:
              'Mara’s hand goes to the wrapped bell at her belt, and stays there.',
            next: 'chapel',
          },
          {
            id: 'keep-vigil',
            label:
              'Post a quiet vigil in the chapel. Wait for the rope to move.',
            effects: {},
            response:
              '“Quietly,” Mara says. “Thank you.” On her way out she unwraps the little bell at her belt. Then wraps it again.',
            postsQuests: ['q-d03-bell-vigil'],
          },
          {
            id: 'muffle-bell',
            label: 'Muffle the clapper and search the tower stairs.',
            effects: {},
            response:
              'Mara’s pen stops. “Muffle Hollow Bell’s bell. If you must.” She writes something and underlines it.',
            postsQuests: ['q-d03-bell-search'],
          },
          {
            id: 'leave-it',
            label: 'Leave Hollow Bell its stories.',
            effects: { affinity: { 'hollow-bell': 3 } },
            response: 'Mara looks relieved. Then, for a moment, afraid.',
          },
        ],
        beats: [
          {
            id: 'chapel',
            lines: [
              '“In the chapel. Under it. There’s a vestry with a good lamp and a door that locks from inside. Nobody looks for their mayor at prayer.”',
              '“I do the town’s sums there. The real ones, not the ledger I carry. Every mayor keeps two books, Your Majesty. At the third hour the rope above me started to move. I sat with my hands flat on the table and listened to it ring until dawn.”',
              '“Send watchers and they find my lamp and my table. By week’s end the town asks what their mayor does alone at night in a locked chapel. I’d rather they asked about the bell.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Two books, Your Majesty. In my experience, a mayor who admits to the second book is protecting a third.',
              },
            ],
            options: [
              {
                id: 'vigil-with-mara',
                label:
                  'Post the vigil, and give Mara a seat in it. Let her explain what the watchers find.',
                effects: {
                  affinity: { 'hollow-bell': 5 },
                  local: { lamplight: -1 },
                  flags: ['d03-mara-keeps-vigil'],
                },
                response:
                  '“Thank you,” Mara says, and means it. Two Lamplight scribes in the gallery trade a look that will become a paragraph. Whatever your watchers find, the mayor will be sitting beside them.',
                postsQuests: ['q-d03-bell-vigil'],
              },
              {
                id: 'ask-for-book',
                label:
                  'Ask to see the second book, as the crown’s price for looking quietly.',
                effects: {
                  affinity: { 'hollow-bell': -8 },
                  local: { lamplight: 2 },
                  flags: ['d03-bell-ledger-asked'],
                },
                response:
                  'Mara unchains the ledger and hands it up: the water accounts, every page numbered. Not the second book. “Quietly,” she says, and takes it back.',
              },
              {
                id: 'chapel-key',
                label:
                  'Remind her whose name is on the millers’ order. Ask for the chapel key.',
                requires: { flags: ['mara-millers-levy'] },
                effects: {
                  affinity: { 'hollow-bell': -3 },
                  local: { lamplight: 1 },
                  flags: ['d03-chapel-key'],
                },
                response:
                  'Mara looks at you a long moment. Then she lays a small iron key in your palm. “The crown took the blame for Hollow Bell once. Now we’re even. I’d like us to stay even.”',
                postsQuests: ['q-d03-bell-vigil'],
              },
              {
                id: 'return-levy',
                label:
                  'Give back the crown’s share of the levy for a sexton’s watch. Leave the vestry alone.',
                requires: { cost: 15, flags: ['chose:d01-aqueduct:levy'] },
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { ledger: -1 },
                  flags: ['d03-levy-returned'],
                },
                response:
                  'Mara counts the brass twice. “As before,” she says, and her face eases. “But backwards. Hollow Bell will remember that too.” That night the bell rings again, and a sexton is awake to hear it.',
              },
              {
                id: 'keep-vigil',
                label:
                  'Post the quiet vigil anyway. Watchers can be told what not to see.',
                effects: {},
                response:
                  '“Told,” Mara says. “I suppose they can.” On her way out she does not wrap the bell back up.',
                postsQuests: ['q-d03-bell-vigil'],
              },
              {
                id: 'leave-it',
                label:
                  'Leave Hollow Bell its stories, and its mayor her vestry.',
                effects: { affinity: { 'hollow-bell': 3 } },
                response:
                  'Mara looks relieved, then afraid, like she half hoped someone would stop her going down those stairs.',
              },
            ],
          },
        ],
      },
      {
        id: 'd03-fen-lanterns',
        title: 'Lanterns in the Fen',
        speaker: 'A Mirefen reed-cutter',
        lines: [
          'The reed-cutter walked all night and smells of it: black water to the knees, a sickle the Gate Watch made her wrap in sacking. In her other hand, a tally stick. The notches are fresh and pale.',
          '“There’s lanterns in the fen, Majesty, where nobody lives. They walk in step. Not like folk walk. Like a line of geese.”',
          '“My girl counted them off the roof. Forty. A notch for every one.” She holds the stick up. “I don’t want them gone. I want to know what they are. I want to know if I should keep my girl off the roof.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Lanterns that walk in step have someone at the front of the line, Your Majesty. Question is whether that someone wants to be found.',
          },
        ],
        options: [
          {
            id: 'ask-girl',
            label: 'Ask what her daughter saw beneath the lanterns.',
            effects: {},
            response:
              'The reed-cutter turns the tally stick over. Now she is more afraid of you than of the lanterns.',
            next: 'beneath',
          },
          {
            id: 'ambush',
            label: 'Hide in the reeds and ambush the marching lanterns.',
            effects: {},
            response:
              'The reed-cutter swallows. “I said I wanted to know what they are.”',
            postsQuests: ['q-d03-fen-ambush'],
          },
          {
            id: 'hail',
            label: 'Light a lantern of your own. Hail them across the water.',
            effects: {},
            response: 'The reed-cutter nods. “That’s braver.”',
            postsQuests: ['q-d03-fen-hail'],
          },
          {
            id: 'ignore',
            label: 'Tell her to stay indoors after dark.',
            effects: { local: { yard: -1 } },
            response: 'She goes. At the doors she checks the notches again.',
          },
        ],
        beats: [
          {
            id: 'beneath',
            lines: [
              '“She says they walk at the height of a heron’s head. No mud on the reeds. Not a stem bent. And they sing, Majesty. Low. The hymn my granny sang over drowned folk.”',
              '“That’s not the worst of it. My man went out after them two nights back. Came home at dawn soaked to the chest. Hasn’t said a word since. Sits by the water. Last night he went out again. He was walking in step.”',
              '“So if you go hiding in the reeds with spears, Majesty, mind who you’re spearing.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A funeral hymn and a man who won’t speak, Your Majesty. The Mothers are burying someone or gathering someone. I don’t know which is worse.',
              },
            ],
            options: [
              {
                id: 'fetch-husband',
                label: 'Send the Gate Watch to bring her husband home first.',
                effects: {
                  affinity: { 'mire-mothers': -5 },
                  local: { yard: 1 },
                  flags: ['d03-cutter-husband-home'],
                },
                response:
                  'The Watch find him at the fen edge at dusk, knee-deep, holding a dark lantern he won’t put down. They carry him home. He is still holding it when his wife thanks you, and still watching the water.',
              },
              {
                id: 'let-him-walk',
                label:
                  'Tell her to let him walk. Whatever the Mothers are doing, he chose to follow.',
                effects: {
                  affinity: { 'mire-mothers': 5 },
                  local: { yard: -2 },
                  flags: ['d03-cutter-husband-walks'],
                },
                response:
                  'She looks at you like you struck her. Then, worse, like she expected it. Three nights later word comes from the fen edge: her girl has cut one more notch.',
              },
              {
                id: 'hail',
                label: 'Hail the lanterns gently. Ask for her husband by name.',
                effects: {},
                response:
                  '“Corran. Ask for Corran.” She stops. “If he still answers.”',
                postsQuests: ['q-d03-fen-hail'],
              },
              {
                id: 'ambush',
                label:
                  'Ambush them anyway. Tell the party to find her husband in the line and spare him.',
                effects: {},
                response:
                  '“Keep him out of it. In the dark. In the reeds.” She almost laughs. “Majesty, you’ve never been in the fen at night.”',
                postsQuests: ['q-d03-fen-ambush'],
              },
              {
                id: 'ask-count',
                label:
                  'Send for the escort who quietly counted heads on the Mirefen road.',
                requires: { flags: ['mire-quiet-count'] },
                effects: {},
                response:
                  'A Gate Watch sergeant is fetched from the barracks, still buttoning his tabard. He reads his count off a ration card, twice.',
                next: 'count',
              },
              {
                id: 'ask-closed',
                label:
                  'Ask whether these are the lights the tower turned back on the road.',
                requires: { flags: ['mire-road-closed'] },
                effects: {},
                response:
                  'The reed-cutter is quiet a moment. “The fen edge talks of nothing else, Majesty.”',
                next: 'turned',
              },
            ],
          },
          {
            id: 'count',
            speaker: 'A Gate Watch sergeant',
            lines: [
              '“Forty-one on the road, Majesty, by my own count, quiet like you said. Old ones, little ones, a cutter with a splinted leg we carried the last mile.”',
              '“Forty-one at the fen edge, when they walked into the reeds with those gold lanterns. I counted them in. I counted them out.”',
              'He looks at the tally stick. “Forty now, her girl says. I don’t like a count that goes down, Majesty. Less when nobody tells us who.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Forty-one went into the fen, Your Majesty. Forty walk out, and one of those is a reed-cutter who was never on the road. I would like to know where the other two went.',
              },
            ],
            options: [
              {
                id: 'file-count',
                label:
                  'Enter the sergeant’s count in the crown’s record. Ask the Mothers for the missing names.',
                effects: {
                  affinity: { 'mire-mothers': -5 },
                  local: { lamplight: 2, 'gate-watch': 1 },
                  flags: ['d03-mire-count-filed'],
                },
                response:
                  'The letter goes to the fen under the crown’s seal. It comes back unopened, wrapped in a reed cloak, smelling of honey.',
              },
              {
                id: 'let-it-lie',
                label:
                  'Let it lie. Refugees aren’t prisoners. The tower doesn’t count its guests twice.',
                effects: {
                  affinity: { 'mire-mothers': 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d03-mire-count-dropped'],
                },
                response:
                  'The sergeant folds his ration card small and puts it in his pocket, over his heart, where soldiers keep what they’ve been told to forget.',
              },
              {
                id: 'hail',
                label: 'Hail the lanterns, and count them yourself this time.',
                effects: {},
                response:
                  'The sergeant asks to go along. “I’ll know the faces. Some of them. If they still have faces I’d know.” Nobody asks what he means.',
                postsQuests: ['q-d03-fen-hail'],
              },
              {
                id: 'ambush',
                label:
                  'Ambush them. If the Mothers are losing people, someone should find out how.',
                effects: {},
                response:
                  'The sergeant nods. “I’ll want the lads who carried the cutter. They’ll know who to look for.”',
                postsQuests: ['q-d03-fen-ambush'],
              },
            ],
          },
          {
            id: 'turned',
            lines: [
              '“They went out, Majesty. Your first night. One after another, like somebody pinching wicks.”',
              '“Three nights later they came back. Not on the road. In the water, where no road is. Forty of them, in step, singing.”',
              '“My granny said the fen keeps what the road refuses. I never knew what she meant till this week.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'You closed that road for good reasons, Your Majesty. But forty-one went out and forty came back. The fen doesn’t give things back.',
              },
            ],
            options: [
              {
                id: 'reopen-road',
                label:
                  'Reopen the Mirefen road. Send word that the crown was wrong to close it.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  local: { 'gate-watch': -2 },
                  flags: ['d03-mire-road-reopened'],
                },
                response:
                  'The Gate Watch take down the barrier like men unlocking a door they were told to guard. That night one gold light waits at the edge of the fen. It does not come closer. It does not go out.',
              },
              {
                id: 'hold-road',
                label:
                  'Keep the road closed. Whatever walks in the water, the tower was right to keep it out.',
                effects: {
                  affinity: { 'mire-mothers': -5 },
                  local: { 'gate-watch': 2 },
                  flags: ['d03-mire-road-held'],
                },
                response:
                  'The Watch double the barrier and burn braziers along it all night. The reed-cutter goes home the long way, tally stick against her chest.',
              },
              {
                id: 'hail',
                label:
                  'Hail them across the water. Tell them the tower remembers turning them away.',
                effects: {},
                response:
                  'The reed-cutter nods. “Tell them sorry, if you mean it. They’ll know if you don’t.”',
                postsQuests: ['q-d03-fen-hail'],
              },
              {
                id: 'ambush',
                label:
                  'Ambush them. Whatever came back is not what the tower turned away.',
                effects: {},
                response:
                  'The reed-cutter backs away from the throne. One step. Two. “Then I’ll keep my girl off the roof. After, too.”',
                postsQuests: ['q-d03-fen-ambush'],
              },
            ],
          },
        ],
      },
      {
        id: 'd03-tincture-letter',
        title: 'A Cold Letter, Delivered Warm',
        speaker: 'A Saltroad tincture factor',
        faction: 'saltroad',
        requires: { flags: ['pack-medicine'] },
        lines: [
          'The Saltroad factor brings her cold letter in person, a courtesy and a threat. She is a stout old camel with medicine vials sewn into her coat. They chime when she bows.',
          '“Your Majesty bought Saltroad tincture and handed it to the Pack. Generous. I’ve come to explain the cost, before it becomes a habit.”',
          '“We are not a well, Your Majesty. We are a road, and a road has only so many carts. Every vial you give away, a salt-flat village doesn’t get. The Pack’s pups breathe easier this week. Somewhere on the flats, someone else’s don’t.”',
          '“So. The Saltroad asks a market fee on any tincture bought for raiders. Or the crown’s word that it was one kindness, not a policy.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'She’s right about the carts, Your Majesty. She also sets the price on them. She hasn’t mentioned that.',
          },
        ],
        options: [
          {
            id: 'ask-triple',
            label:
              'Ask why the Pack pays three times what a salt-flat village pays.',
            effects: {},
            response:
              'The vials stop chiming. The factor stands straight, like at a graveside.',
            next: 'brother',
          },
          {
            id: 'let-kiyo',
            label: 'Let Kiyo, who came here on a Saltroad boat, answer her.',
            requires: { follower: 'F003' },
            effects: {},
            response:
              'Kiyo sets down her kettle and comes to stand beside the throne, hands in her sleeves.',
            next: 'kettle',
          },
          {
            id: 'pay-fee',
            label: 'Pay the market fee. Keep the Pack’s pups on tincture.',
            requires: { cost: 15 },
            effects: {
              affinity: { saltroad: 5, jackalwire: 5 },
              local: { ledger: -1 },
              flags: ['d03-tincture-fee-paid'],
            },
            response:
              'The factor writes a receipt so neat it looks engraved. “A pleasure.” The price of a kindness has been set. It will rise.',
          },
          {
            id: 'single-kindness',
            label: 'Give her your word: it was one kindness, not a policy.',
            effects: {
              affinity: { saltroad: 10, jackalwire: -5 },
              flags: ['d03-pack-medicine-ended'],
            },
            response:
              'She bows, and the vials chime like coins. A week later a coughing pup rides past the southern bridge in a painted wagon. Nobody from the Pack comes to the tower to ask why.',
          },
          {
            id: 'refuse-fee',
            label:
              'The crown buys medicine for whomever it pleases, at whatever price is asked.',
            effects: {
              affinity: { saltroad: -10, jackalwire: 5 },
              local: { yard: 1 },
              flags: ['d03-tincture-defied'],
            },
            response:
              'The factor tucks the letter among the vials. “At whatever price is asked. I’ll make sure it is asked.”',
          },
        ],
        beats: [
          {
            id: 'brother',
            lines: [
              '“Because two summers ago a Jackalwire band burned a Saltroad caravan on the Ford road. Eight carts. My brother drove the third.” She says it like an old price. “He lived. He doesn’t drive any more.”',
              '“So yes, we charge the Pack three times. Every factor agreed. It isn’t greed, Your Majesty. It’s a memorial, set in brass so nobody forgets.”',
              '“And their pups had nothing to do with it. I know that. I have known it every day I wrote the price.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A grudge priced in medicine, Your Majesty. The hyenas who burned those carts may not run with the band whose pups cough. The Pack has many captains.',
              },
            ],
            options: [
              {
                id: 'one-price',
                label:
                  'Post one tincture price at the bridge for every buyer. The crown covers her first season’s loss.',
                requires: { cost: 20 },
                effects: {
                  affinity: { saltroad: -5, jackalwire: 10 },
                  local: { lamplight: 1 },
                  flags: ['d03-tincture-one-price'],
                },
                response:
                  'A long silence. “The other factors will call me soft. My brother will spit when I tell him. Then I think he’ll sit down and be glad.” She writes the price out herself.',
              },
              {
                id: 'name-the-band',
                label:
                  'Ask which band burned the carts. The crown collects that debt from them, not their pups.',
                effects: {
                  affinity: { saltroad: 10, jackalwire: -10 },
                  local: { 'gate-watch': 1 },
                  flags: ['d03-caravan-burners-named'],
                },
                response:
                  '“The Red Spoke band.” She writes it down like a line on a manifest. By evening the Gate Watch have chalked the name above their fire, and the Pack has heard.',
              },
              {
                id: 'pay-fee',
                label:
                  'Pay her fee. A memorial is owed something, even aimed wrong.',
                requires: { cost: 15 },
                effects: {
                  affinity: { saltroad: 5, jackalwire: 5 },
                  local: { ledger: -1 },
                  flags: ['d03-tincture-fee-paid'],
                },
                response:
                  'She takes the brass with both hands, like something from a grave. “He’d want me to take it. That’s the trouble with him.”',
              },
              {
                id: 'single-kindness',
                label:
                  'Give your word: one kindness, not a policy. The road keeps its memorial.',
                effects: {
                  affinity: { saltroad: 10, jackalwire: -5 },
                  flags: ['d03-pack-medicine-ended'],
                },
                response:
                  '“Thank you,” she says, surprised she doesn’t feel better. The vials chime all the way to the doors.',
              },
            ],
          },
          {
            id: 'kettle',
            lines: [
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'I know this tincture, Your Majesty. Willowbark, salt, honey, boiled in copper. The Saltroad carried my family across the straits when we had nothing. I owe them.',
              },
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'And I can brew something close in the Yard kitchen for a tenth of the price. Weaker. It won’t cure a pup. It will let one sleep.',
              },
              '“If the tower brews its own,” the factor says, “every village on the flats will ask why the tower’s pot is cheaper. So will I.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A kettle in the Yard kitchen is a small thing, Your Majesty. Until it’s a market.',
              },
            ],
            options: [
              {
                id: 'kiyo-brews',
                label:
                  'Let Kiyo brew for the Pack’s pups in the Yard kitchen, openly.',
                effects: {
                  affinity: { saltroad: -10, jackalwire: 5 },
                  local: { yard: -1, lamplight: 1 },
                  flags: ['d03-kiyo-brews'],
                },
                response:
                  'The Yard kitchen smells of willowbark until dawn. The cooks complain, then one by one ask Kiyo for a cup. The factor’s next letter is not cold. It never comes.',
              },
              {
                id: 'kiyo-gives-recipe',
                label:
                  'Ask Kiyo to give the recipe to the factor, a gift to the road that carried her.',
                effects: {
                  affinity: { saltroad: 10, jackalwire: -5 },
                  flags: ['d03-kiyo-recipe-shared'],
                },
                response:
                  'Kiyo writes it out with a note at the bottom in a script nobody at court can read. The factor reads the note twice and bows to Kiyo, not to you. The price at the bridge does not move a copper.',
              },
              {
                id: 'pay-fee',
                label:
                  'Thank Kiyo and pay the factor’s fee. Kiyo’s kettle is for the court.',
                requires: { cost: 15 },
                effects: {
                  affinity: { saltroad: 5, jackalwire: 5 },
                  local: { ledger: -1 },
                  flags: ['d03-tincture-fee-paid'],
                },
                response:
                  'Kiyo picks up her kettle. Later you find her in the Yard kitchen anyway, boiling willowbark for no one.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 4,
    title: 'Letter From Bell',
    briefings: [
      {
        id: 'ford-toll-flags',
        source: 'Eastern Ford ferrymen',
        text: 'Strangers in clean boots are planting survey flags along the far bank of the ford.',
        truth: true,
      },
      {
        id: 'crow-sky-silent',
        source: 'A Storm Crow fledgling',
        text: 'Every crow on the Heights has gone quiet at once, and the elders will not say why.',
        truth: true,
      },
      {
        id: 'jackal-peace-feast',
        source: 'A wagon-painter for hire',
        text: 'The Jackalwire Pack has laid down every blade and wants only to feast with the tower.',
        truth: false,
      },
    ],
    komodo:
      'Survey flags cost money and silence costs nerve. Both are real. A raider pack that only wants a feast has never existed. Count your spoons, Your Majesty.',
    quests: ['q-d04-survey-flags'],
    audiences: [
      {
        id: 'd04-letter-from-bell',
        title: 'Letter From Bell',
        speaker: 'Pip Thread, archivist of Hollow Bell',
        faction: 'hollow-bell',
        lines: [
          'The moth comes up the carpet in a coat too heavy for the weather, holding a letter in both hands like evidence. Their spectacles are mended with thread. They stop at the petitioners’ line, check it, and stop again.',
          '“I brought a letter from the Hollow Bell archive. Nobody sent it. I mean, I sent it. I am delivering it. I am Pip Thread. I also wrote it.”',
          '“It says I want to work for the tower’s records. There is a reason. It is on a page no longer in the ledger.”',
          '“I don’t talk well, Your Majesty. I read well. I remember everything I read. That is the whole petition.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'An archivist who leaves home over a missing page is running from it or carrying it, Your Majesty. I’d know which before we give them a desk.',
          },
        ],
        options: [
          {
            id: 'ask-page',
            label: 'Ask what was on the page that is no longer in the ledger.',
            effects: {},
            response:
              'Pip goes still, a moth on a windowpane. “I can tell you what was on it. I can’t tell you who took it. I have no proof. I want to be clear about the proof.”',
            next: 'page',
          },
          {
            id: 'welcome',
            label: 'Welcome Pip to the court and pay their passage.',
            requires: { cost: 15 },
            effects: { recruit: ['F005'], local: { lamplight: 2 } },
            response:
              'Pip bows too low and drops the letter. “I’ll start a file on myself.”',
          },
          {
            id: 'turn-away',
            label: 'Send Pip home. Hollow Bell needs its archivist.',
            effects: {
              affinity: { 'hollow-bell': 3 },
              local: { lamplight: -2 },
              recruitable: ['F005'],
            },
            response:
              'Pip folds the letter small. “If the tower changes its mind, I will be in the same place. Always.”',
          },
        ],
        beats: [
          {
            id: 'page',
            lines: [
              '“Hollow Bell’s register of the missing. Third volume, page two hundred and eight. A well-cleaner from the far wards reported her son gone in the dry month. Nine years old. His name, his height, the colour of his scarf.”',
              '“A season later I needed the page again. Page two hundred and eight now says the well-cleaner is childless. The ink is a season fresher than the page before it. The binding thread is new. The seal at the foot is the mayor’s office.”',
              '“I asked about it once, politely. The next week I was moved to the grain tallies.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The mayor’s office is a great many clerks, Your Majesty, and Mara Reedbell has been good to this throne. An archivist with a grudge and a perfect memory can do a town harm. So can a missing boy.',
              },
            ],
            options: [
              {
                id: 'recall',
                label:
                  'Ask Pip to write the page out from memory, here, before you decide.',
                effects: {},
                response:
                  'A clerk brings ink. Pip writes without looking at the paper, fast and small. The court listens to the pen.',
                next: 'recall',
              },
              {
                id: 'compare-ledger',
                label:
                  'Tell Pip the mayor showed the crown her ledger this week. Every figure in order.',
                requires: { flags: ['d03-bell-ledger-asked'] },
                effects: { local: { lamplight: 1 } },
                response:
                  'Pip nods. “The water accounts. That is the book she shows people. Let me show you the other kind of page.” A clerk brings ink.',
                next: 'recall',
              },
              {
                id: 'welcome',
                label:
                  'Take Pip in. The question comes with them. The tower will carry it.',
                requires: { cost: 15 },
                effects: { recruit: ['F005'], local: { lamplight: 2 } },
                response:
                  'Pip bows too low, drops the letter, and holds it out to you. “Then this belongs in your archive. I will start a file on myself. And one on page two hundred and eight.”',
              },
              {
                id: 'turn-away',
                label:
                  'Send Pip home. If Hollow Bell has a missing page, Hollow Bell must answer for it.',
                effects: {
                  affinity: { 'hollow-bell': 3 },
                  local: { lamplight: -2 },
                  recruitable: ['F005'],
                },
                response:
                  'Pip folds the letter smaller than paper should fold. “Hollow Bell will not answer for it, Your Majesty. I will be in the same place if the tower changes its mind. Always.”',
              },
            ],
          },
          {
            id: 'recall',
            lines: [
              'The page Pip hands up is in the archive’s cramped hand: a date in the dry month, a ward, a well-cleaner named Hesper Lowe. Beneath it, in a clerk’s print: “son, Tobin, nine years, green scarf, last seen at the far-ward pump.”',
              '“That is all of it,” Pip says. “It isn’t much. It is all she had.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A page like that is worth more in a drawer than on a wall, Your Majesty. Post it, and Hollow Bell tears itself apart over a boy nobody can find. Keep it, and one day it buys you something from Mara.',
              },
              '“It is not a coin,” Pip says, to the floor. “It is a boy.”',
            ],
            options: [
              {
                id: 'post-page',
                label:
                  'Post the recalled page on the fortress gate, where the far wards’ carters read.',
                effects: {
                  affinity: { 'hollow-bell': -8 },
                  local: { lamplight: 2 },
                  flags: ['d04-page-posted'],
                },
                response:
                  'By evening the page is nailed up beside the tax rate. By morning a crowd from Hollow Bell is reading it aloud to each other. Someone has tied a green thread to the nail.',
                next: 'decide',
              },
              {
                id: 'seal-page',
                label:
                  'Keep the page under the tower’s seal, as Komodo advises. A secret held can be spent.',
                effects: {
                  local: { lamplight: -1, 'old-houses': 1 },
                  flags: ['d04-page-sealed'],
                },
                response:
                  'Komodo takes the page himself, folds it along a line only he sees, and locks it in the dispatch chest. Pip watches the key turn.',
                next: 'decide',
              },
              {
                id: 'page-to-mother',
                label:
                  'Send the page to the well-cleaner, privately, with the crown’s word that someone is listening.',
                effects: {
                  affinity: { 'hollow-bell': -3 },
                  local: { yard: 1 },
                  flags: ['d04-page-to-mother'],
                },
                response:
                  'A Yard runner carries it to the far wards in a plain sleeve. He comes back late. He will only say she read it standing, then sat down on the pump step, then thanked him three times.',
                next: 'decide',
              },
            ],
          },
          {
            id: 'decide',
            lines: [
              'Pip has not moved from the line on the carpet. They hold the empty letter in both hands.',
              '“That was the page. This is the petition. The tower’s records, if you’ll have me. I will work in the coldest room. I don’t need to be talked to.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Whatever you decide about the archivist, Your Majesty, Hollow Bell will say the page decided it.',
              },
            ],
            options: [
              {
                id: 'welcome',
                label: 'Welcome Pip to the court, and pay their passage.',
                requires: { cost: 15 },
                effects: { recruit: ['F005'], local: { lamplight: 2 } },
                response:
                  'Pip bows too low and drops the letter. “I’ll start a file on myself.” Then, quieter: “And one on Tobin.”',
              },
              {
                id: 'turn-away',
                label:
                  'Send Pip home. The page is the tower’s now. The archivist is Hollow Bell’s.',
                effects: {
                  affinity: { 'hollow-bell': 3 },
                  local: { lamplight: -2 },
                  recruitable: ['F005'],
                },
                response:
                  'Pip folds the letter small. “If the tower changes its mind, I will be in the same place. Always.” At the doors they look back once, at the dispatch chest or the gate.',
              },
            ],
          },
        ],
      },
      {
        id: 'd04-silent-crows',
        title: 'The Silent Heights',
        speaker: 'A Storm Crow fledgling',
        faction: 'storm-crows',
        lines: [
          'The fledgling wears a runner’s mantle cut for someone twice her size. The hem drags. Its copper chimes are stuffed with wool so they won’t ring. She keeps glancing at the high windows.',
          '“Every crow on the Heights stopped talking at once, Your Majesty. Yesterday at noon. Mid-word. Even the chicks.”',
          '“The elders won’t say why. They sit on the ledges and face east.” She swallows. “I’m not supposed to be here.”',
          'Halfway through, the court sees what she has not: an ancient grey-blue crow on the far gallery rail. Clouded eyes half closed. His chimes perfectly still.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Don’t look at the gallery, Your Majesty. She hasn’t seen him. Let her hear your answer first.',
          },
        ],
        options: [
          {
            id: 'ask-leave',
            label: 'Ask the fledgling who gave her leave to come.',
            effects: {},
            response:
              '“Nobody,” she says. Then she follows your eyes to the gallery, and the colour goes out of her voice.',
            next: 'bond',
          },
          {
            id: 'sit-with-elders',
            label: 'Send envoys to sit with the elders until someone speaks.',
            effects: {},
            response:
              'The fledgling hops, nervous. “They’re very good at sitting.”',
            postsQuests: ['q-d04-crow-elders'],
          },
          {
            id: 'climb-roost',
            label:
              'Send climbers to the high roost to see what the crows are watching.',
            effects: {},
            response:
              'The fledgling’s eyes go wide. “Don’t say I told you the way up.” On the gallery rail, the old crow’s head turns.',
            postsQuests: ['q-d04-crow-roost'],
          },
        ],
        beats: [
          {
            id: 'bond',
            lines: [
              '“I’m a bonded runner, Your Majesty. Four years left. Runners carry the elders’ words and no others. Carry words without leave and they add years. Sometimes a lot.”',
              '“I thought if something was wrong enough to make the Heights go quiet, somebody down here should know. I thought that was what runners were for.” She is looking at the gallery now. “That’s Elder Corvane. He taught me my first forecast.”',
              'On the rail the old crow does not move. He doesn’t need to. The warning has been paid for. The question is by whom.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Under Conclave law she belongs to the Heights, Your Majesty. Keeping her is theft. I say it because Corvane will, and slower.',
              },
            ],
            options: [
              {
                id: 'shelter-runner',
                label:
                  'Shelter the fledgling. A warning shouldn’t cost the one who carried it.',
                effects: {
                  affinity: { 'storm-crows': -10 },
                  local: { yard: 1, lamplight: 1 },
                  flags: ['d04-runner-sheltered'],
                },
                response:
                  'You say it loud enough for the gallery. Elder Corvane opens his clouded eyes, and every chime in his mantle rings at once, though nothing touched them. Then he is gone. The window he left by stays open all day.',
              },
              {
                id: 'return-runner',
                label:
                  'Send her back to the elder with thanks. Ask that her years be spared.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { yard: -1 },
                  flags: ['d04-runner-returned'],
                },
                response:
                  'The fledgling climbs the gallery stair alone. Elder Corvane bows to you, low and slow. That may be an answer. The wool has come out of one of her chimes, and it rings at every step.',
              },
              {
                id: 'address-elder',
                label: 'Speak to the elder in the gallery directly.',
                effects: {},
                response:
                  'The hall turns to the gallery. Elder Corvane looks down at you like you are weather.',
                next: 'elder',
              },
              {
                id: 'climb-roost',
                label:
                  'Send climbers to the roost tonight. Keep the fledgling here until they are back.',
                effects: {},
                response:
                  '“Don’t say I told you the way up,” she whispers. The whole hall heard her tell you. So did the gallery.',
                postsQuests: ['q-d04-crow-roost'],
              },
            ],
          },
          {
            id: 'elder',
            speaker: 'Elder Corvane of the Storm Crow Conclave',
            npc: 'elder-corvane',
            lines: [
              'Elder Corvane does not speak. The Heights are silent, and he is the Heights. He lifts one grey wing and points east, toward the sunken rail yards, where nothing should be moving.',
              'He lowers the wing. He looks at the fledgling, then at you, and waits like someone who has waited out droughts.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He just told you more than the elders tell their own runners, Your Majesty. He’ll want something for it. Crows always do.',
              },
            ],
            options: [
              {
                id: 'shelter-runner',
                label:
                  'Tell him to his face: the runner stays under the tower’s protection.',
                effects: {
                  affinity: { 'storm-crows': -10 },
                  local: { yard: 1, lamplight: 1 },
                  flags: ['d04-runner-sheltered'],
                },
                response:
                  'Corvane regards you. Every chime in his mantle rings once, though nothing touched them, and he is gone. The fledgling sits down on the carpet where she stands, like her legs just heard the news.',
              },
              {
                id: 'return-runner',
                label:
                  'Send her up to him with thanks. Ask, as a courtesy, that her years be spared.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { yard: -1 },
                  flags: ['d04-runner-returned'],
                },
                response:
                  'The elder dips his head the width of a feather. The fledgling climbs to him. Neither looks back. The wool has come out of one of her chimes, and it rings at every step.',
              },
              {
                id: 'sit-with-elders',
                label:
                  'Bow. Ask that the crown’s envoys sit with the elders until the silence ends.',
                effects: {},
                response:
                  'Corvane closes his eyes. Consent, maybe. The fledgling breathes out. “They’re very good at sitting,” she whispers. “Bring cushions.”',
                postsQuests: ['q-d04-crow-elders'],
              },
              {
                id: 'climb-roost',
                label:
                  'Thank him. Send climbers up the high roost tonight to see what he pointed at.',
                effects: {},
                response:
                  'The old crow’s clouded eyes rest on you a moment longer. Then he turns on the rail to face east, showing the climbers where.',
                postsQuests: ['q-d04-crow-roost'],
              },
            ],
          },
        ],
      },
      {
        id: 'd04-painted-feast',
        title: 'A Feast Under Painted Wagons',
        speaker: 'A wagon-painter for hire',
        faction: 'jackalwire',
        lines: [
          'The wagon-painter is a lean hyena with wet paint on his paws. He brings a sample: a wooden panel of the tower and the Pack’s wagons under a fat yellow moon. Everyone smiling. Nobody armed.',
          '“The Pack is throwing a feast in the tower’s honor, Majesty. No blades. Roast goat. The good fiddles, not the loud ones.”',
          '“They’d be hurt if the tower didn’t come. Hurt is dangerous in a hyena. I say that as one.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'He paints whatever he is paid to paint, Your Majesty. The question is who paid for this one.',
          },
        ],
        options: [
          {
            id: 'ask-patron',
            label: 'Ask who paid him to carry the invitation.',
            effects: {},
            response:
              'The painter laughs. Then he looks down at the panel in his paws, and stops laughing.',
            next: 'patron',
          },
          {
            id: 'let-saffron',
            label:
              'Let Saffron, who rode with the Pack once, read the invitation.',
            requires: { follower: 'F002' },
            effects: {},
            response:
              'Saffron turns the panel over and runs a claw along a mark on the back nobody else noticed.',
            next: 'old-rule',
          },
          {
            id: 'attend-armed',
            label: 'Attend, with blades hidden in the supply carts.',
            effects: {},
            response: 'The painter grins with all his teeth. “Wonderful.”',
            postsQuests: ['q-d04-feast-armed'],
          },
          {
            id: 'bring-gifts',
            label: 'Send gifts instead, with a polite apology.',
            requires: { cost: 15 },
            effects: { affinity: { jackalwire: 10 }, local: { ledger: -1 } },
            response:
              'The painter weighs the gifts. For a moment he looks surprised.',
          },
          {
            id: 'decline',
            label: 'Decline. The tower does not dine with raiders.',
            effects: {
              affinity: { jackalwire: -10 },
              local: { 'old-houses': 1 },
            },
            response:
              'The painter shrugs. “They’ll eat the goat anyway.” He leaves the panel on the dais step, face down.',
          },
        ],
        beats: [
          {
            id: 'patron',
            lines: [
              '“Two captains, Majesty. That’s the trouble. Two of them paid me, and not the same.”',
              '“One is the fiddler from the toll bridge, the painted jaw. Her camp wants to feast you. Truly. They’ve cooked for two days.” He hesitates. “The other has twice the wagons and a fine coat. He wants the tower’s people sitting down, in one place, hands full of goat.”',
              '“I don’t know what he means by it. I know which half of the invitation paid more.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'So the feast is real and so is the trap, Your Majesty. Same table. Whatever you send, you send to both.',
              },
            ],
            options: [
              {
                id: 'go-unarmed',
                label:
                  'Attend unarmed. If the fiddler’s camp is sincere, the tower will be too.',
                effects: {
                  affinity: { jackalwire: 10 },
                  local: { 'gate-watch': -2 },
                  flags: ['d04-feast-unarmed'],
                },
                response:
                  'The Gate Watch hand over their blades at the tower door, faces shut. The goat is good and the fiddles are the good ones. All night a big hyena in a feathered coat watches your table from the dark, counting.',
              },
              {
                id: 'warn-fiddler',
                label:
                  'Decline the feast. Send the fiddler a private warning about her fellow captain.',
                effects: {
                  affinity: { jackalwire: -5 },
                  local: { 'gate-watch': 1 },
                  flags: ['d04-pack-split-sown'],
                },
                response:
                  'Your note goes back folded inside the painted panel. The feast is off by nightfall. By dawn two camps face each other across the southern bridge road.',
              },
              {
                id: 'fiddler-vouches',
                label:
                  'Tell the fiddler whose pups the tower dosed: the court comes if she stands by its table.',
                requires: { flags: ['pack-medicine'] },
                effects: {
                  affinity: { jackalwire: 10 },
                  local: { 'gate-watch': -1 },
                  flags: ['d04-fiddler-vouches'],
                },
                response:
                  'The fiddler meets your party at the camp’s edge and stands behind your chair all night. She never sits. She never plays. No feathered coat comes within twenty paces.',
              },
              {
                id: 'ask-informant',
                label:
                  'Ask the painter whether the Pack found out about the map of their camp.',
                requires: { flags: ['pack-camp-mapped'] },
                effects: {},
                response:
                  'The painter’s smile goes thin. “You’d know about that, would you.”',
                next: 'informant',
              },
              {
                id: 'attend-armed',
                label:
                  'Attend with blades in the supply carts. If he wants hands full, he can have them.',
                effects: {},
                response:
                  'The painter grins with all his teeth, then turns the panel face down. “Wonderful. I’ll paint it afterwards.”',
                postsQuests: ['q-d04-feast-armed'],
              },
              {
                id: 'bring-gifts',
                label:
                  'Send gifts to the fiddler’s camp only, and a polite apology to the other.',
                requires: { cost: 15 },
                effects: {
                  affinity: { jackalwire: 10 },
                  local: { ledger: -1 },
                },
                response:
                  'The painter weighs the gifts, surprised. “Only hers. He’ll notice. He notices everything that isn’t his.”',
              },
            ],
          },
          {
            id: 'informant',
            lines: [
              '“They found the ration card, Majesty. One of your Gate Watch drank too much and talked to the wrong barmaid. Then the Pack looked for a pup with a bandaged paw. There was only one.”',
              '“He’s alive. Tied to a wagon wheel at the edge of camp. The captains want to see if the tower comes. They think it would be funny if you ate goat twenty paces from him.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Claim him, Your Majesty, and you confess to spying in front of every captain at once. Don’t, and the Gate Watch learns what the crown’s brass is worth to the people who take it.',
              },
            ],
            options: [
              {
                id: 'claim-informant',
                label:
                  'Go to the feast, claim the girl as the crown’s, and pay what they ask.',
                requires: { cost: 25 },
                effects: {
                  affinity: { jackalwire: -5 },
                  local: { 'gate-watch': 2 },
                  flags: ['d04-informant-claimed'],
                },
                response:
                  'You pay in front of the whole camp. The captains laugh and cut the rope themselves. The girl walks home behind your wagon, bandaged paw to her chest, and the Gate Watch make room for her by their fire.',
              },
              {
                id: 'deny-informant',
                label: 'Say nothing. The crown never paid anyone for anything.',
                effects: {
                  affinity: { jackalwire: 5 },
                  local: { 'gate-watch': -2 },
                  flags: ['d04-informant-denied'],
                },
                response:
                  'The painter nods like you confirmed a price. Nobody at court learns what happened to the girl at the wheel. After a week the Gate Watch take the ration card down from above their fire and burn it.',
              },
              {
                id: 'attend-armed',
                label:
                  'Attend with blades in the carts. Cut him loose when the fiddles start.',
                effects: {},
                response:
                  'The painter looks at you a long time. “Then I was never here.” He leaves the panel on the dais step, the one where everyone is smiling.',
                postsQuests: ['q-d04-feast-armed'],
              },
            ],
          },
          {
            id: 'old-rule',
            lines: [
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: '“That’s a naming mark. The good fiddles only come out when somebody’s pup’s been named, and somebody’s pup has been named, Majesty, I’d bet my toolkit, so the feast is real. The cooking is real, I mean.”',
              },
              'Saffron is talking fast. Her free hand has gone to the toolkit at her hip.',
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: '“What else is real I couldn’t tell you. I left. Everybody knows I left. But nobody in the Pack draws a blade across a table with a Kett at it. Old rule. It still works. Probably. Send me.”',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'An old rule of a Pack she left, Your Majesty. She knows it well, for someone who left.',
              },
            ],
            options: [
              {
                id: 'send-saffron',
                label:
                  'Send Saffron to the feast as the tower’s guest, unarmed, under the old rule.',
                effects: {
                  affinity: { jackalwire: 10 },
                  local: { 'gate-watch': -1 },
                  flags: ['d04-saffron-at-feast'],
                },
                response:
                  'Saffron comes back at dawn smelling of woodsmoke and goat fat, a pup’s smear of paint on her muzzle. She won’t say whose. “Nobody drew,” she says. She doesn’t say who she sat beside.',
              },
              {
                id: 'attend-armed',
                label:
                  'Attend armed, and seat Saffron where she can see the supply carts.',
                effects: {},
                response:
                  'Saffron’s hand comes off the toolkit. “Right. Sure. Where I can see the carts.” She does not look at the painter again.',
                postsQuests: ['q-d04-feast-armed'],
              },
              {
                id: 'decline',
                label:
                  'Thank her, and decline. The tower won’t test an old rule with her neck.',
                effects: {
                  affinity: { jackalwire: -10 },
                  local: { 'old-houses': 1 },
                },
                response:
                  'Saffron says “Fine” fast, then slower: “Fine.” That evening she is on the wall, facing south, watching the Pack’s cookfire smoke over the hills.',
              },
            ],
          },
        ],
      },
    ],
  },
]

/**
 * Act I's standing obligations (t-040). The Day 2 rate stays on the gate as a
 * law (laws.ts): the taxes change every dawn, and once a week the Ledger
 * feels it, until the court leaves the tower or the rate is repealed.
 */
export const ACT_ONE_DUES: readonly DueDef[] = [
  {
    id: 'market-rate-hard',
    title: 'The hard rate',
    inDays: 7,
    every: 7,
    until: 40,
    when: { flags: ['tax-high'] },
    effects: { local: { ledger: -1 } },
    line: 'The hard rate held another week. The Ledger’s stalls opened late and shut early.',
    warning:
      'The hard rate stays on the gate. Every seven days the Ledger cools.',
  },
  {
    id: 'market-rate-light',
    title: 'The light rate',
    inDays: 7,
    every: 7,
    until: 40,
    when: { flags: ['tax-low'] },
    effects: { local: { ledger: 1 } },
    line: 'The light rate held another week. Two more caravans chose the fortress gate over the Ford.',
    warning:
      'The light rate stays on the gate. Every seven days the Ledger warms.',
  },
]
