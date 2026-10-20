import type { DayDef, QuestDef } from './types'

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
        'The well road is clear, and the Freeholders who watched have started calling it the emperor’s road.',
      success:
        'The well road is clear by evening. The water barrels roll again.',
      partial: 'Half the rockfall is moved. Carts pass one at a time.',
      failure: 'The rockfall shifted again. The Yard hauls water by hand.',
      expired:
        'Nobody cleared the road. The Yard hauled water by hand for two days and has not stopped mentioning it.',
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
        'Clear water runs toward Hollow Bell again. Mara Reedbell sends a barrel of pickled plums and a very long thank-you.',
      partial:
        'The leak is slowed, not stopped. Hollow Bell is grateful and a little damp.',
      failure:
        'The channel collapsed under the engineers. Hollow Bell is drier than before.',
      expired: 'The aqueduct was left to leak. The mayor stopped writing.',
    },
  },
  {
    id: 'q-d01-toll-parley',
    title: 'Painted Wagons at the Toll',
    summary:
      'Offer the Jackalwire wagons safe passage in exchange for an armistice at the southern toll bridge.',
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
        'The Pack accepts the armistice and plays a terrible song in the emperor’s honor.',
      partial: 'The wagons stay, but nobody draws a blade.',
      failure: 'The parley ended in insults. The toll is still closed.',
      expired:
        'The wagons sat at the bridge all day. Saltroad trade went the long way round.',
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
        'The bridge is open. The Pack withdrew, and they will remember who pushed.',
      partial: 'The wagons pulled back a hundred yards and dug in.',
      failure: 'The Pack held the bridge. The Gate Watch is muttering.',
      expired: 'Nobody moved the wagons.',
    },
  },
  {
    id: 'q-d01-mirefen-escort',
    title: 'Lanterns on the Mirefen Road',
    summary:
      'Escort the swamp refugees past the raider scouts without asking their secrets.',
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
        'There were more travelers than lanterns, and some of the lanterns had no one under them. The Archive has the list.',
      partial: 'The count is half done and doesn’t add up.',
      failure:
        'The refugees refused to be counted and the witches took offense.',
      expired: 'The lanterns passed uncounted.',
    },
  },
  {
    id: 'q-d02-grain-cart',
    title: 'The Drowning Grain Cart',
    summary:
      'A grain cart is stuck midstream at the Eastern Ford and the water is still rising.',
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
        'Clause nine gives the Conclave the right to name the favor after the rain falls. The court strikes it, and the Crows pretend to be impressed.',
      partial:
        'The contract is long and the court is tired. A few clauses are struck.',
      failure:
        'The readers were caught annotating the Conclave’s sacred margins.',
      expired: 'The Crows grew tired of waiting.',
    },
  },
  {
    id: 'q-d02-mole-audit',
    title: 'The Mole Ledger',
    summary:
      'Send quiet auditors into the tunnels to count the tithe the Moles claim to have paid.',
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
        'The tithe was never paid, and the Moles never claimed it was. The clerk invented it. The Moles appreciate being counted honestly.',
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
        'All three wells run clear, and the villages have agreed, for once, on whom to thank.',
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
      'Post a quiet vigil in Hollow Bell’s old chapel and wait for the rope to move.',
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
        'At the third hour the rope moved. Nobody was holding it. The watchers will not say more in front of the court.',
      partial: 'The vigil heard something. Nobody agrees what.',
      failure: 'The watchers fell asleep in the pews.',
      expired: 'The bell rang again that night, unwatched.',
    },
  },
  {
    id: 'q-d03-bell-search',
    title: 'Muffle the Bell',
    summary:
      'Muffle the clapper and search the bell tower stairs for whoever is ringing it.',
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
        'The stairs were dusty and the dust was undisturbed. Hollow Bell resents the muffled bell.',
      partial: 'The search found footprints going up and none coming down.',
      failure: 'The searchers were caught on the stairs by an angry sexton.',
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
        'The toll was never lifted. The clerk was skimming the difference. Saltroad caravans are delighted.',
      partial: 'The count is off, but nobody can prove by whom.',
      failure:
        'The counters lost track somewhere around the four-hundredth goat.',
      expired: 'The toll stayed a mystery and the Ledger noticed.',
    },
  },
  {
    id: 'q-d03-fen-ambush',
    title: 'Ambush in the Reeds',
    summary:
      'Hide in the reeds and ambush the lanterns marching through the empty fen.',
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
        'The lanterns scattered like startled fish. Under the ones the party caught, there was nothing at all.',
      partial: 'The ambush sprang early. The lanterns went dark and vanished.',
      failure: 'Something in the reeds ambushed the ambushers.',
      expired: 'The lanterns marched on.',
    },
  },
  {
    id: 'q-d03-fen-hail',
    title: 'Hail the Lanterns',
    summary:
      'Light a lantern of your own and hail the marching lights across the water.',
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
        'The lanterns stopped. A voice answered in a language nobody at court can read, and then, politely, in ours.',
      partial: 'The lanterns paused, then moved on.',
      failure:
        'The lanterns went dark, and the hailing lantern went out on its own.',
      expired: 'Nobody hailed them.',
    },
  },
  {
    id: 'q-d04-survey-flags',
    title: 'Flags on the Far Bank',
    summary:
      'Follow the clean-booted surveyors back from the Eastern Ford and read whose seal is on their maps.',
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
        'The maps carry a seal nobody at court has seen before: a bell with no clapper.',
      partial:
        'The surveyors lost the party in the hills, but dropped a pencil.',
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
        'On the second night an elder spoke: the crows went silent because something to the east stopped singing first.',
      partial: 'The elders nodded, once, and that was all.',
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
        'From the roost every crow is facing the same way: east, toward the sunken rail yards.',
      partial: 'The climbers saw the crows, and the crows saw them.',
      failure: 'The roost guards were not as silent as the rest.',
      expired: 'Nobody climbed.',
    },
  },
  {
    id: 'q-d04-feast-armed',
    title: 'A Feast Under Painted Wagons',
    summary:
      'Attend the Jackalwire feast with blades hidden in the supply carts, just in case.',
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
        'The feast was an ambush, and the hidden blades were not. The party came home with a captured banner.',
      partial:
        'Both sides kept their hands near their knives all night. Nobody ate much.',
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
        text: 'Painted Jackalwire wagons have assembled by the southern toll bridge.',
        truth: true,
      },
    ],
    komodo:
      'The outriders agree about those wagons. The silver-bell story sounds expensive for a town that cannot repair its own pipes. Watch the roads, Your Majesty.',
    quests: ['q-d01-well-road'],
    audiences: [
      {
        id: 'd01-aqueduct',
        title: 'The Broken Aqueduct',
        speaker: 'Mara Reedbell, Mayor of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'The great doors groan open on your first morning as emperor. The hall smells of lamp oil and old dust, and the first petitioner is already halfway up the carpet before the herald has finished announcing her.',
          'Your Majesty. Congratulations on the crown. It suits you better than it suited the last one, and I say that as someone who sent him a great many polite letters.',
          'Hollow Bell’s aqueduct is leaking into the old roadbed, and my town drinks from that channel. Every day it leaks, the far wards get a little thirstier and a little louder.',
          'I could raise the money myself, if the crown let me tax my own people for it. Or the crown could send someone who knows what a sluice is.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'A mayor who asks permission to tax her own town, Your Majesty, usually wants someone else’s name on the order.',
          },
        ],
        options: [
          {
            id: 'ask-why',
            label: 'Ask why she needs the crown’s leave to tax her own people.',
            effects: {},
            response:
              'Mara’s smile holds, but she sets her ledger down on the step of the dais, which Komodo will later tell you she has never once been seen to do.',
            next: 'millers',
          },
          {
            id: 'repair',
            label: 'Send engineers to repair the channel.',
            effects: {},
            response:
              'Mara smiles, and writes something in her ledger. “Then I’ll expect them.”',
            postsQuests: ['q-d01-aqueduct-repair'],
          },
          {
            id: 'levy',
            label:
              'Levy the town for emergency repairs, and send the crown its share.',
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
              '“Because the last time Hollow Bell raised a levy, it fell on the people with the least, and I was the one who signed it.”',
              '“The mill families own the sluice gates. They could pay for the repair out of one season’s flour. They will not, unless an emperor orders it, and if I order it they will make sure the next mayor is someone more reasonable.”',
              '“So. You can send your engineers and the millers keep their money. You can levy the whole town and the poor wards pay again. Or you can put your name on an order that only the mill families pay, and let me be the reluctant servant of a hard crown.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'There it is. She is offering you the blame, Your Majesty. It is a generous offer. Blame is the only thing in Hollow Bell nobody wants to keep.',
              },
            ],
            options: [
              {
                id: 'repair',
                label:
                  'Send engineers anyway. The millers can keep their flour.',
                effects: {},
                response:
                  '“Then I’ll expect them,” Mara says, and picks the ledger back up. “And I’ll remember who kept the peace with the millers. It was not me.”',
                postsQuests: ['q-d01-aqueduct-repair'],
              },
              {
                id: 'levy-millers',
                label:
                  'Sign the order. The mill families pay, and the crown takes the blame.',
                effects: {
                  brass: 5,
                  affinity: { 'hollow-bell': 10 },
                  local: { 'old-houses': -2, yard: 1 },
                  flags: ['mara-millers-levy'],
                },
                response:
                  'Mara reads the order twice, folds it once, and bows lower than she did when she came in. “They will hate you, Your Majesty. The wards will drink.” Somewhere in the gallery, a member of the Old Houses closes a fan with a snap.',
                postsQuests: ['q-d01-aqueduct-repair'],
              },
              {
                id: 'levy',
                label:
                  'Levy the whole town, as before, and send the crown its share.',
                effects: {
                  brass: 25,
                  affinity: { 'hollow-bell': -10 },
                  local: { ledger: 2, yard: -3 },
                },
                response:
                  '“As before,” Mara repeats, very softly. “Yes. Hollow Bell is used to as before.” She does not bow on her way out.',
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
          'The next petitioner does not wait to be announced. She comes up the carpet with her boots unlaced and a fiddle across her back, a hyena with a painted jaw and a grin like a dropped knife.',
          'Nice tower. The southern toll bridge is ours now, and so are the carts that want to cross it.',
          'We can talk about that. Or you can pay. Or you can try to move us. Everybody gets three choices in the wasteland, and the third one is always the loud one.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Saltroad’s medicine carts cross that bridge, Your Majesty. So does half our grain. She knows it, which is why she is smiling.',
          },
        ],
        options: [
          {
            id: 'ask-toll',
            label: 'Ask what the Pack wants the toll money for.',
            effects: {},
            response:
              'The captain stops grinning. It is the most unsettling thing she has done so far.',
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
              'The captain spits on your floor, cheerfully. “Bring friends.”',
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
              'The captain bites a brass bit, approves, and leaves a painted feather on the arm of your throne.',
          },
        ],
        beats: [
          {
            id: 'dust-lung',
            lines: [
              '“Dust lung. Half the pups in our camp cough black by morning. Saltroad sells the tincture at three times what it sold for last year, because who else is going to sell it to hyenas?”',
              '“So we stand on their bridge, and their carts pay us, and we pay them for the tincture. Round and round the brass goes. Everybody calls us raiders. Nobody calls them anything.”',
              '“You want the bridge open? Fine. Get my pups their medicine and I will play your coronation march myself. Badly, but with feeling.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'It may even be true, Your Majesty. It is also exactly the story a clever raider would tell a new emperor with a soft face.',
              },
            ],
            options: [
              {
                id: 'medicine',
                label:
                  'Buy the tincture yourself and hand it over at the bridge, if the toll lifts today.',
                requires: { cost: 30 },
                effects: {
                  affinity: { jackalwire: 15, saltroad: -5 },
                  local: { yard: 1 },
                  flags: ['pack-medicine'],
                },
                response:
                  'The captain takes your hand in both of hers, which you were not expecting, and squeezes it hard enough to hurt. By evening the wagons have rolled back and the Saltroad factor is sending you a very cold letter about undercutting the market.',
              },
              {
                id: 'informant',
                label:
                  'Thank her. Then quietly pay one of her crew to show you where the Pack’s camp sleeps.',
                requires: { cost: 10 },
                effects: {
                  local: { 'gate-watch': 1 },
                  flags: ['pack-camp-mapped'],
                },
                response:
                  'She leaves without a deal. That night a young hyena with a bandaged paw takes your brass at the postern gate, draws the camp on the back of a ration card, and will not meet your eyes. The Gate Watch pins the card above their fire.',
              },
              {
                id: 'parley',
                label: 'Offer safe passage in exchange for an armistice.',
                effects: {},
                response:
                  '“An armistice doesn’t cure a cough,” she says, “but it’s a start. Send someone who can hold a tune.”',
                postsQuests: ['q-d01-toll-parley'],
              },
              {
                id: 'break-toll',
                label:
                  'Tell her sick pups are not the crown’s problem. The bridge will be cleared.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  'She looks at you for a long moment. Then she spits on your floor, not cheerfully at all. “Bring friends. Bring a lot of them.”',
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
          'The last petitioner of the day brings the smell of the fen with her: wet peat, bog myrtle, something sweeter underneath. Her lantern is lit, though it is noon, and the flame inside it does not move when the doors swing shut.',
          'We are only refugees, Your Majesty. Raider scouts watch the Mirefen road and our people travel by lantern.',
          'An escort would be a kindness. We would ask nothing else. Not your bread, not your beds. Only that the road be safe for one night.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Mire Mothers have asked the throne for nothing in eleven years, Your Majesty. That is either very humble or very patient.',
          },
        ],
        options: [
          {
            id: 'ask-lanterns',
            label: 'Ask why a refugee’s lantern burns without oil.',
            effects: {},
            response:
              'Sister Reedlight looks down at her lantern as if noticing it for the first time, and laughs, and the laugh is lovely.',
            next: 'lanterns',
          },
          {
            id: 'escort',
            label: 'Escort the refugees without asking their secrets.',
            effects: {},
            response:
              'Sister Reedlight bows low. Her lantern does not flicker at all.',
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
              '“Marsh gas, Your Majesty. The fen breathes, and we catch its breath in glass. Our grandmothers taught us. It is the only thing the fen has ever given us for free.”',
              '“There are forty-one of us on the road tonight. Old ones, and children, and a cutter with a broken leg. If you would rather count us than guard us, I understand. A new crown has to know what walks under it.”',
              '“But I will tell you what the raiders will do while your clerks are counting.”',
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'Marsh gas burns blue and smells of eggs, Your Majesty. That flame is gold, and it smells of honey. I do not know what that means. I only know it is not marsh gas.',
              },
            ],
            options: [
              {
                id: 'escort',
                label: 'Guard them tonight. Questions can wait for daylight.',
                effects: {},
                response:
                  'Sister Reedlight bows low. “The fen remembers kindness, Your Majesty.” Kiyo watches her all the way to the doors.',
                postsQuests: ['q-d01-mirefen-escort'],
              },
              {
                id: 'quiet-count',
                label:
                  'Guard them, and have the escort quietly count heads along the way.',
                effects: {
                  local: { lamplight: 1 },
                  flags: ['mire-quiet-count'],
                },
                response:
                  '“You are kind,” says Sister Reedlight, “and careful.” She says careful the way other people say a word in a language they are still learning.',
                postsQuests: ['q-d01-mirefen-escort'],
              },
              {
                id: 'close-road',
                label:
                  'Close the road. The tower cannot protect strangers it does not know.',
                effects: {
                  affinity: { 'mire-mothers': -15 },
                  local: { 'gate-watch': 2 },
                  flags: ['mire-road-closed'],
                },
                response:
                  'She does not argue. That night, from the tower roof, you watch forty-one gold lights turn back into the fen and go out, one by one. You will never learn whether the raiders found them, or whether they simply chose to stop shining.',
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
      'Ferrymen have no reason to invent a drowning cart. The tithe story is the one that would make a clerk smile, and Moles have never made a clerk smile. Choose your roads accordingly, Your Majesty.',
    quests: ['q-d02-grain-cart', 'q-d02-mole-audit'],
    audiences: [
      {
        id: 'd02-dust-tax',
        title: 'Dust Tax',
        speaker: 'Factor Marisol Tallow and Foreman Dunmore Ash',
        npc: 'marisol-tallow',
        faction: 'ledger',
        lines: [
          'They come up the carpet side by side, because neither would let the other go first. Factor Marisol Tallow, a raccoon in a brass-buttoned waistcoat, carries two drafts of the same charter with the tax rate left blank on both. Foreman Dunmore Ash, a heavy boar in a flour-dusted apron, carries nothing at all, and folds his arms as if that were an argument.',
          '“Your Majesty. The fortress market is the first thing the wasteland will judge you by. Tax it lightly and the caravans come to the tower instead of the Ford. Tax it hard and they come once, pay once, and tell everyone on the road.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: '“Wages.”',
          },
          '“The foreman means,” says Tallow, “that the Yard would like the crown to tax my members so it can pay his. He has been saying it all morning. That was the long version.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: '“Ovens don’t light on maybes. Decide before lunch, Majesty. The Yard eats at noon, or it doesn’t.”',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Whatever rate you name will be painted on the gate by evening, Your Majesty. It will be the first law of your reign that anyone can read. Choose one you would not mind being remembered for.',
          },
        ],
        options: [
          {
            id: 'ask-wages',
            label:
              'Ask the foreman how far behind the Yard’s wages really are.',
            effects: {},
            response:
              'Dunmore unfolds his arms for the first time this morning. Tallow, very slightly, closes her charter.',
            next: 'chits',
          },
          {
            id: 'high',
            label: 'Tax the market hard. The crown needs brass.',
            effects: {
              brass: 30,
              local: { ledger: -3, yard: -1 },
              flags: ['tax-high'],
            },
            response:
              'Tallow writes the rate into both drafts without looking up, and sighs into her ledger. Dunmore watches the brass go into the strongbox, then looks down at his own empty hands, as if checking.',
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
            label: 'Tax the market lightly, and let trade grow.',
            effects: {
              local: { ledger: 3, yard: 2, 'old-houses': -2 },
              flags: ['tax-low'],
            },
            response:
              'Tallow beams and signs both drafts at once. Dunmore leaves without a word, and somewhere in the fortress an Old House lord begins a disapproving letter about merchants who pay less than landlords.',
          },
        ],
        beats: [
          {
            id: 'chits',
            lines: [
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: '“Six weeks.” He says it again, slower, as if the number might change. “The old emperor paid the Yard in chits. Paper. Good for a wage when the treasury fills. The treasury never filled.”',
              },
              '“And when a cook’s children are hungry, Your Majesty,” says Tallow, smooth as lamp oil, “a chit for a crown wage is worth whatever someone will give her for it today. The Ledger gave a third. Nobody else gave anything.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: '“So the Ledger holds the Yard’s wages now. Most of them.” He looks at the factor without heat, which is worse than heat. “Tax the market hard to pay the chits, and the brass goes from her members’ stalls back into her members’ strongbox. Three times what they paid. The cooks see none of it.”',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'It is perfectly legal, Your Majesty. That is the impressive part. The factor did the Yard a kindness at a third of the price, and now she would like to be thanked at full price.',
              },
              '“We took a risk nobody else would take,” Tallow says. “Void honest paper, Your Majesty, and the next time the crown needs a loan it will find the Ledger has very short arms.”',
            ],
            options: [
              {
                id: 'void-chits',
                label:
                  'Void the bought chits. The crown pays the cooks and stablehands what they are owed, from its own strongbox.',
                requires: { cost: 25 },
                effects: {
                  local: { yard: 3, ledger: -3, 'old-houses': -1 },
                  flags: ['d02-chits-voided'],
                },
                response:
                  'Tallow’s pen goes very still. “Honest paper,” she says, to no one, and folds the chits away like a lost hand of cards. Dunmore nods once, which from him is a speech. The Old Houses in the gallery begin, quietly, to count their own paper.',
                next: 'rate',
              },
              {
                id: 'redeem-at-cost',
                label:
                  'Buy the chits back at the third the Ledger paid, and not a copper more. Nobody profits from the Yard’s hunger.',
                requires: { cost: 10 },
                effects: {
                  local: { ledger: -1, lamplight: 1, 'old-houses': 1 },
                  flags: ['d02-chits-at-cost'],
                },
                response:
                  '“A third,” Tallow repeats. “The Ledger made nothing and lost nothing.” She sounds less angry than impressed. Dunmore unfolds his arms and folds them again. “Nobody profits,” he says. “Nobody gets paid, either.”',
                next: 'rate',
              },
              {
                id: 'high',
                label:
                  'Tax the market hard anyway. The chits can wait; the strongbox cannot.',
                effects: {
                  brass: 30,
                  local: { ledger: -3, yard: -1 },
                  flags: ['tax-high'],
                },
                response:
                  'Tallow writes the rate into both drafts and smiles at nobody. She can wait. Paper keeps. Dunmore looks at the brass going into the strongbox and says nothing at all, which is how the Yard learns the answer before he gets home.',
              },
              {
                id: 'low',
                label:
                  'Tax the market lightly. Let the Ledger earn its profit from trade, not from the Yard.',
                effects: {
                  local: { ledger: 3, yard: 2, 'old-houses': -2 },
                  flags: ['tax-low'],
                },
                response:
                  'Tallow signs both drafts with a flourish. Dunmore gives you a long, flat look: the chits are still in her strongbox, and a cheap market is cheap bread for a while. He takes the bread and leaves the look.',
              },
            ],
          },
          {
            id: 'rate',
            lines: [
              'Tallow unfolds her drafts again. The rate is still blank on both. Dunmore has gone back to folding his arms, but more loosely.',
              '“The chits were yesterday’s debt, Your Majesty,” says Tallow. “The rate is tomorrow’s. Name it, and I will have it painted on the gate before the Yard sits down to eat.”',
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
                },
                response:
                  'Tallow sighs and writes it in. “You give with one hand,” she says, “and take with the other.” Dunmore looks at both of your hands, as if checking which one fed him.',
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
                  'By evening the rate is painted on the gate, and under it, in smaller letters nobody asked for, the words Chits settled. Nobody is delighted. Everybody can read it.',
              },
              {
                id: 'low',
                label:
                  'Tax the market lightly, and let the Ledger earn back its loss honestly.',
                effects: {
                  local: { ledger: 3, yard: 2, 'old-houses': -2 },
                  flags: ['tax-low'],
                },
                response:
                  'Tallow’s smile comes back, slowly, like a tide. “Honestly,” she says. “Yes. The Ledger can do honestly, at this rate.” An Old House lord in the gallery leaves before the end, to write a letter.',
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
          'He is the best-dressed petitioner the hall has seen, and he has dressed for it on purpose: a miller’s white coat cut like a courtier’s, and a heavy purse that he sets on the step of the dais and does not let go of. Flour rises from his sleeves when he bows, and settles on the carpet like a small, polite snow.',
          '“Aldous Hopper, Your Majesty, of the Hollow Bell mill families. We have paid your levy for the aqueduct. Every copper. I brought the receipt myself, so there would be no confusion about our loyalty.”',
          '“I also brought the new price of flour. Hollow Bell flour feeds your Yard, as you know. From this week it costs a third more. Sluices are expensive. The crown taught us that.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: '“A third.” The voice comes from the back of the hall, where the Yard’s foreman has stopped on his way out. “That’s your levy, Majesty. Out of my ovens.”',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'You put your own name on that order so Hollow Bell’s poor would drink, Your Majesty. The millers have found a way to send the bill to the fortress’s poor instead. One has to admire the plumbing.',
          },
        ],
        options: [
          {
            id: 'ask-who-paid',
            label:
              'Ask Hopper who in the mill families actually paid the levy.',
            effects: {},
            response:
              'Hopper smiles the smile of a man asked a rude question at a good dinner. “The mills paid, Your Majesty.” A pause. “The mills are a great many people.”',
            next: 'grinders',
          },
          {
            id: 'cap-flour',
            label:
              'Cap the price of Hollow Bell flour at last season’s rate, by crown order.',
            effects: {
              affinity: { 'hollow-bell': -5 },
              local: { 'old-houses': -2, yard: 2 },
              flags: ['d02-flour-capped'],
            },
            response:
              'Hopper bows exactly as low as before, and no lower. “Then the mills will grind exactly as much as last season, Your Majesty, and not one sack more.” At the back of the hall, Dunmore nods at nobody in particular.',
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
              'Hopper picks up his purse. Dunmore does not argue; he simply leaves. That night the Yard’s loaves come out of the ovens a finger thinner, and every cook in the kitchen knows whose finger it was.',
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
              'Hopper accepts the brass with the grace of a man who has won and would like you to feel it was a draw. The Yard eats as before. The Ledger’s clerks note that the crown has begun buying bread for its own commons, and underline it twice.',
          },
        ],
        beats: [
          {
            id: 'grinders',
            lines: [
              '“The families own the mills,” Hopper says. “Grinders work them. Carters haul for them. When the crown asked the mills for a levy, the mills asked their grinders for a little more work at a little less pay, as mills do in a hard season. Nobody was forced. Nobody had to be.”',
              '“So the levy is paid. Hollow Bell drinks. Your name is on the order, the mayor is grateful, and my cousins are poorer by not one copper.” He spreads his floury hands. “You may tell me it is unjust, Your Majesty. You will have to tell me which law it breaks.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He is right about the law, Your Majesty. There isn’t one. There could be one by tomorrow, but the Old Houses would want to know which of their own arrangements it reaches next.',
              },
            ],
            options: [
              {
                id: 'post-names',
                label:
                  'Post the names of the families who passed the levy down, on the gate beside the tax rate.',
                effects: {
                  affinity: { 'hollow-bell': 5 },
                  local: { lamplight: 2, 'old-houses': -3 },
                  flags: ['d02-mill-names-posted'],
                },
                response:
                  'Hopper reads his own name on the draft before the ink is dry. He does not protest. He memorizes the clerk’s face instead, and bows to you on his way out, deeply, like a man paying a debt he means to collect.',
              },
              {
                id: 'refund-grinders',
                label:
                  'Refund the grinders their lost wages from the crown’s strongbox, and let the families keep their pride.',
                requires: { cost: 25 },
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { yard: -1, 'old-houses': 1 },
                  flags: ['d02-grinders-refunded'],
                },
                response:
                  'The grinders of Hollow Bell are paid by a crown courier who has never seen a mill. Mara Reedbell sends a single line of thanks. The mill families send nothing, and keep their flour a third dearer, and the fortress Yard pays it.',
              },
              {
                id: 'cap-flour',
                label:
                  'Cap the flour price anyway. If the families want to squeeze someone, let it be each other.',
                effects: {
                  affinity: { 'hollow-bell': -5 },
                  local: { 'old-houses': -2, yard: 2 },
                  flags: ['d02-flour-capped'],
                },
                response:
                  '“Each other,” Hopper repeats, as though tasting it. “Your Majesty has never been to a mill families’ supper.” He leaves the purse on the dais step a moment too long before he remembers to take it.',
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
                  'Hopper bows. “Your Majesty understands mills.” It is not a compliment, and he knows you know it. In Hollow Bell, the grinders go back to work a little longer for a little less, and drink their clean water after dark.',
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
          'The Storm Crow envoy arrives dry, which is the first thing everyone notices. It has not rained on the fortress in thirty-eight days, and his oilcloth mantle has the clean, folded look of something that has never needed to be worn.',
          'He does not approach the throne. He unrolls a contract from the top step of the dais and lets it run down to the carpet, and then keeps unrolling it. The court watches the scroll reach the doors.',
          '“The Conclave offers a season of rain over your dry fields, Your Majesty. Soft rain, at night, the kind that soaks rather than runs. In return, one favor from the tower, to be named later.”',
          '“The contract is here. It is long. We are sure you will find it fair.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Yard’s kitchen gardens have perhaps ten days left, Your Majesty. The Conclave knows that to the day. That is what they sell: not the rain. The knowing.',
          },
        ],
        options: [
          {
            id: 'ask-favors',
            label:
              'Ask what favor the Conclave named the last time a ruler signed this contract.',
            effects: {},
            response:
              'The envoy’s head tilts the way a bird’s does when something moves in the grass. “How historically minded,” he says. “Very well.”',
            next: 'named',
          },
          {
            id: 'honest-terms',
            label:
              'Sign it plainly, and ask only that the favor be named to your face.',
            effects: {
              affinity: { 'storm-crows': 10 },
              flags: ['crow-favor-owed'],
            },
            response:
              'The envoy tilts his head. “Plainly. How unusual.” He rolls the contract up himself, end to end, which takes some time. The rain comes in four days.',
          },
          {
            id: 'fine-print',
            label: 'Have the contract read line by line before anyone signs.',
            effects: {},
            response:
              'The envoy settles onto the bottom step to wait, as if he expected nothing else, and begins to preen.',
            postsQuests: ['q-d02-crow-contract'],
          },
          {
            id: 'decline',
            label: 'Decline. The tower will find its own water.',
            effects: { affinity: { 'storm-crows': -5 } },
            response:
              '“Of course,” says the envoy, looking up at the clear sky through the high windows as if it were a clock.',
          },
        ],
        beats: [
          {
            id: 'named',
            lines: [
              '“The last emperor signed in a dry year, like this one. The rain came. The harvest came. Eleven months later the Conclave named its favor: one child of the fortress Yard, bonded to the Heights as a runner, to carry forecasts between the caves for seven years.”',
              '“The child was chosen by lot. It was all very fair. She eats well, she is taught her letters, and she has seen weather no one in this hall will ever see. Many of our runners are grateful.” A pause. “Many.”',
              '“We do not always name a child. Sometimes it is a well, or a vote, or a silence. We name what the moment needs. That is what makes the favor worth a season of rain.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: '“Her name was Wren.” The foreman has not left after all. “Her mother still sets a place.”',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'One child for a season of harvest, Your Majesty. I have read the old granary books. The year the rain did not come, the Yard buried more than one. I only say what the ledger says.',
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
                  'The envoy watches you write it. “The Conclave accepts. A favor with a fence around it is worth less to us, and we price accordingly.” The rain comes in six days, thin and late, and falls mostly on the Old Houses’ terraces. The Yard’s gardens get the edges.',
              },
              {
                id: 'buy-bond',
                label:
                  'Leave the contract unsigned. Pay Wren’s bond instead, and bring her home.',
                requires: { cost: 30 },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  local: { yard: 3 },
                  flags: ['d02-wren-bond-bought'],
                },
                response:
                  'The envoy names a figure. It is exactly thirty brass, as if he had carried the number up the carpet with him. “She will be sent down within the month,” he says. “She may not want to come.” He leaves with the contract unsigned, and the sky stays clear and hard.',
              },
              {
                id: 'honest-terms',
                label:
                  'Sign plainly. The fields cannot wait on the Conclave’s conscience, or on yours.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  flags: ['crow-favor-owed'],
                },
                response:
                  '“Plainly,” says the envoy. “How unusual.” The rain comes in four days, soft and soaking, exactly as promised. In the Yard a woman sets a place at her table and does not look at the sky.',
              },
              {
                id: 'fine-print',
                label:
                  'Have the contract read line by line. If there is a clause about children, find it.',
                effects: {},
                response:
                  '“There is no clause about children,” the envoy says pleasantly, settling onto the step. “There is a clause about favors. You will find it on the ninth arm’s length.”',
                postsQuests: ['q-d02-crow-contract'],
              },
              {
                id: 'decline',
                label: 'Decline. The tower will find its own water.',
                effects: { affinity: { 'storm-crows': -5 } },
                response:
                  '“Of course,” says the envoy. He rolls the contract up slowly, so that the whole court can watch the season of rain go back into his sleeve.',
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
      text: 'Our sources come good about two times in three, Your Majesty. The trick is knowing which third.',
    },
    briefings: [
      {
        id: 'bell-without-hand',
        source: 'Hollow Bell pilgrims',
        text: 'The bell at the old chapel rang all night and nobody was near the rope.',
        truth: true,
      },
      {
        id: 'jackal-toll-lifted',
        source: 'A cheerful toll-clerk',
        text: 'Jackalwire has abolished its road toll out of loyalty to the tower.',
        truth: false,
      },
      {
        id: 'mire-lights',
        source: 'Mirefen reed-cutters',
        text: 'Lanterns are moving through the fen where no one lives, and they are moving together.',
        truth: true,
      },
    ],
    komodo:
      'A bell that rings itself is a rumor with a rope in it, and lanterns walking in step are rarely ghosts. The toll-clerk is smiling, Your Majesty. Nobody abolishes a toll and smiles about it.',
    quests: ['q-d03-three-wells', 'q-d03-toll-audit'],
    audiences: [
      {
        id: 'd03-bell-vigil',
        title: 'The Bell That Rang Alone',
        speaker: 'Mara Reedbell, Mayor of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'Mara Reedbell comes up the carpet out of breath, which nobody at court has seen before. Her ledger is still chained to her belt, but the little hand-bell that usually hangs beside it has been wrapped in a scrap of cloth and knotted shut, as if it might otherwise join in.',
          '“The old chapel bell rang all night, Your Majesty, and nobody was near the rope. I mean nobody. The chapel was locked. I hold the only key.”',
          '“Half the town says it is a warning and the other half says it is a welcome, and both halves have stopped going out after dark. My people are frightened.”',
          '“I would rather it stayed a story. But if the crown wants to look, look quietly.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'She holds the only key, Your Majesty, and she would like us to look quietly. Those two facts are sitting very close together.',
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
              'Post a quiet vigil in the chapel and wait for the rope to move.',
            effects: {},
            response:
              '“Quietly,” Mara repeats. “Thank you.” She unwraps the little bell at her belt on her way out, and then, after a moment, wraps it up again.',
            postsQuests: ['q-d03-bell-vigil'],
          },
          {
            id: 'muffle-bell',
            label: 'Muffle the clapper and search the tower stairs.',
            effects: {},
            response:
              'Mara’s pen stops. “Muffle Hollow Bell’s bell. Well. If you must.” She writes something down, and underlines it, and does not show you what.',
            postsQuests: ['q-d03-bell-search'],
          },
          {
            id: 'leave-it',
            label: 'Leave Hollow Bell its stories.',
            effects: { affinity: { 'hollow-bell': 3 } },
            response: 'Mara looks relieved, and then, briefly, afraid.',
          },
        ],
        beats: [
          {
            id: 'chapel',
            lines: [
              '“In the chapel,” she says. “Under it. There is a vestry with a good lamp and a door that locks from inside, and nobody in Hollow Bell thinks to look for their mayor at prayer.”',
              '“I do the town’s sums there. The real ones. The ones that do not go in the ledger I carry.” She meets your eye. “Every mayor keeps two books, Your Majesty. I keep mine somewhere quiet. At the third hour the rope above me began to move, and I sat with my hands flat on the table and listened to it ring until dawn.”',
              '“If you send watchers, they will find my lamp and my table. By the end of the week the whole town will be asking what their mayor does alone at night in a locked chapel. I would rather they asked about the bell.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Two books, Your Majesty. In my experience a mayor who admits to the second book is protecting a third.',
              },
            ],
            options: [
              {
                id: 'vigil-with-mara',
                label:
                  'Post the vigil, and give Mara a seat in it. Whatever the watchers find, she will be there to explain it.',
                effects: {
                  affinity: { 'hollow-bell': 5 },
                  local: { lamplight: -1 },
                  flags: ['d03-mara-keeps-vigil'],
                },
                response:
                  '“Thank you,” Mara says, and means it. In the gallery two Lamplight scribes exchange a look that will become a paragraph. Whatever your watchers find in that chapel, they will find it with the mayor sitting beside them.',
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
                  'Mara unchains the ledger from her belt and hands it up without a word. It is the water accounts, every figure in order, every page numbered. It is not the second book, and you both know it. “Quietly,” she says, and takes it back.',
              },
              {
                id: 'chapel-key',
                label:
                  'Remind her whose name is on the millers’ order, and ask for the chapel key.',
                requires: { flags: ['mara-millers-levy'] },
                effects: {
                  affinity: { 'hollow-bell': -3 },
                  local: { lamplight: 1 },
                  flags: ['d03-chapel-key'],
                },
                response:
                  'Mara looks at you for a long moment, then unhooks a small iron key from beneath her sash and lays it in your palm. “The crown took the blame for Hollow Bell once,” she says. “Now we are even. I would very much like us to stay even.”',
                postsQuests: ['q-d03-bell-vigil'],
              },
              {
                id: 'return-levy',
                label:
                  'Give back the crown’s share of Hollow Bell’s levy, to pay a sexton’s watch, and leave the vestry alone.',
                requires: { cost: 15, flags: ['chose:d01-aqueduct:levy'] },
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { ledger: -1 },
                  flags: ['d03-levy-returned'],
                },
                response:
                  'Mara counts the brass twice, the way she counts everything. “As before,” she says, and something in her face eases, “but backwards. Hollow Bell will remember that too.” The bell rings again that night, and this time a sexton is awake to hear it.',
              },
              {
                id: 'keep-vigil',
                label:
                  'Post the quiet vigil anyway. Watchers can be told what not to see.',
                effects: {},
                response:
                  '“Told,” Mara repeats. “Yes. I suppose they can.” She does not sound comforted, and on her way out she does not wrap the bell back up.',
                postsQuests: ['q-d03-bell-vigil'],
              },
              {
                id: 'leave-it',
                label:
                  'Leave Hollow Bell its stories, and its mayor her vestry.',
                effects: { affinity: { 'hollow-bell': 3 } },
                response:
                  'Mara looks relieved, and then, briefly, afraid, as though she had half hoped someone would stop her going down those stairs.',
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
          'The reed-cutter has walked all night to get here and smells of it: black water to the knees, a sickle in her belt that the Gate Watch made her wrap in sacking. In her other hand she holds a tally stick, notched along one edge, the notches fresh and pale.',
          '“There’s lanterns in the fen, Majesty, where nobody lives. They walk in step. Not like folk walk. Like a line of geese.”',
          '“My girl counted them off the roof. Forty. She cut a notch for every one.” She holds the stick up, as if the court might want to count again. “I don’t want them gone. I want to know what they are. I want to know if I should keep my girl off the roof.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Lanterns that walk in step have someone at the front of the line, Your Majesty. The question is whether that someone wants to be found.',
          },
        ],
        options: [
          {
            id: 'ask-girl',
            label: 'Ask what her daughter saw beneath the lanterns.',
            effects: {},
            response:
              'The reed-cutter turns the tally stick over in her hands. For the first time she looks less frightened of the lanterns than of you.',
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
            label:
              'Light a lantern of your own and hail them across the water.',
            effects: {},
            response: 'The reed-cutter nods slowly. “That’s braver.”',
            postsQuests: ['q-d03-fen-hail'],
          },
          {
            id: 'ignore',
            label: 'Tell her to stay indoors after dark.',
            effects: { local: { yard: -1 } },
            response:
              'She goes. She does not look reassured. At the doors she stops to check the notches on the stick again, as if they might have changed on the way.',
          },
        ],
        beats: [
          {
            id: 'beneath',
            lines: [
              '“She says they walk at the height of a heron’s head. She says there’s no mud on the reeds where they pass, not a stem bent. And they sing, Majesty. Low. The hymn my granny sang over drowned folk, the one you’re not to sing unless someone’s gone into the water.”',
              '“That’s not the worst of it.” She grips the tally stick. “My man went out after them two nights back. Came home at dawn soaked to the chest and hasn’t said a word since. Sits by the water and watches. Last night he went out again, and he was walking in step.”',
              '“So if you go hiding in the reeds with spears, Majesty, you mind who you’re spearing.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A funeral hymn and a man who will not speak, Your Majesty. Either the Mothers are burying someone or they are gathering someone. Forgive me. I do not know which I would rather it was.',
              },
            ],
            options: [
              {
                id: 'fetch-husband',
                label:
                  'Send the Gate Watch to bring her husband home before anyone goes near the lanterns.',
                effects: {
                  affinity: { 'mire-mothers': -5 },
                  local: { yard: 1 },
                  flags: ['d03-cutter-husband-home'],
                },
                response:
                  'The Watch find him at the fen edge at dusk, knee-deep, holding a dark lantern he will not put down. They carry him home between them. He is still holding it when his wife thanks you, and he is still watching the water.',
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
                  'She looks at you as if you had struck her, and then, worse, as if she had expected it. She takes the tally stick home. Three nights later a carter brings word from the fen edge that her girl has cut one more notch.',
              },
              {
                id: 'hail',
                label:
                  'Hail the lanterns gently, and ask for her husband by name.',
                effects: {},
                response:
                  '“Corran,” she says. “Ask for Corran. He’ll answer to it.” She hesitates. “If he still answers.”',
                postsQuests: ['q-d03-fen-hail'],
              },
              {
                id: 'ambush',
                label:
                  'Ambush them anyway. Tell the party to find the reed-cutter in the line and keep him out of it.',
                effects: {},
                response:
                  '“Keep him out of it,” she repeats. “In the dark. In the reeds.” She almost laughs. “Majesty, you’ve never been in the fen at night.”',
                postsQuests: ['q-d03-fen-ambush'],
              },
              {
                id: 'ask-count',
                label:
                  'Send for the escort who quietly counted heads on the Mirefen road.',
                requires: { flags: ['mire-quiet-count'] },
                effects: {},
                response:
                  'A Gate Watch sergeant is fetched from the barracks, still buttoning his tabard. He has the count on a scrap of ration card, and he reads it twice before he says anything.',
                next: 'count',
              },
              {
                id: 'ask-closed',
                label:
                  'Ask whether these are the lights the tower turned back on the road.',
                requires: { flags: ['mire-road-closed'] },
                effects: {},
                response:
                  'The reed-cutter is quiet a moment. “I wondered if you’d ask, Majesty. Folk at the fen edge talk of nothing else.”',
                next: 'turned',
              },
            ],
          },
          {
            id: 'count',
            speaker: 'A Gate Watch sergeant',
            lines: [
              '“Forty-one on the road, Majesty, by my own count, quiet like you said. Old ones, little ones, a cutter with a splinted leg we carried the last mile ourselves.”',
              '“Forty-one at the fen edge, when they thanked us and walked off into the reeds with those gold lanterns. I counted them in. I counted them out.”',
              'He looks at the tally stick in the reed-cutter’s hand. “Forty walking now, her girl says. I don’t like a count that goes down, Majesty. I like it less when nobody comes to tell us who.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Forty-one went into the fen, Your Majesty, and forty walk out of it, and one of those forty is a reed-cutter who was never on the road at all. I would very much like to know where the other two went.',
              },
            ],
            options: [
              {
                id: 'file-count',
                label:
                  'Enter the sergeant’s count in the crown’s record, and write to the Mothers for the missing names.',
                effects: {
                  affinity: { 'mire-mothers': -5 },
                  local: { lamplight: 2, 'gate-watch': 1 },
                  flags: ['d03-mire-count-filed'],
                },
                response:
                  'The letter goes out to the fen under the crown’s seal, polite and precise. It comes back three days later unopened, wrapped in a reed cloak, smelling faintly of honey.',
              },
              {
                id: 'let-it-lie',
                label:
                  'Let it lie. Refugees are not prisoners, and the tower does not count its guests twice.',
                effects: {
                  affinity: { 'mire-mothers': 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d03-mire-count-dropped'],
                },
                response:
                  'The sergeant folds his ration card very small and puts it in his tabard pocket, over his heart, where soldiers keep the things they have been told to forget.',
              },
              {
                id: 'hail',
                label: 'Hail the lanterns, and count them yourself this time.',
                effects: {},
                response:
                  'The sergeant asks to go along. “I’ll know the faces,” he says. “Some of them. If they still have faces I’d know.” The reed-cutter does not ask what he means.',
                postsQuests: ['q-d03-fen-hail'],
              },
              {
                id: 'ambush',
                label:
                  'Ambush them. If the Mothers are losing people, someone should find out how.',
                effects: {},
                response:
                  'The sergeant nods slowly. “I’ll want the same lads who carried the cutter,” he says. “They’ll know who to look for.”',
                postsQuests: ['q-d03-fen-ambush'],
              },
            ],
          },
          {
            id: 'turned',
            lines: [
              '“They went out, Majesty. Your first night. Everyone at the fen edge watched them go out, one after another, like somebody pinching wicks.”',
              '“Three nights later they came back. Not on the road. In the water, where no road is. Forty of them, walking in step, and singing.”',
              '“My granny used to say the fen keeps what the road refuses. I never knew what she meant till this week.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'You closed that road for sound reasons, Your Majesty. The Gate Watch still says so. But forty-one went out and forty came back, and the fen is not known for giving things back.',
              },
            ],
            options: [
              {
                id: 'reopen-road',
                label:
                  'Reopen the Mirefen road, and send word that the crown was wrong to close it.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  local: { 'gate-watch': -2 },
                  flags: ['d03-mire-road-reopened'],
                },
                response:
                  'The Gate Watch take down the barrier with the faces of men told to unlock a door they were told to guard. That night, from the roof, you see a single gold light at the very edge of the fen. It does not come closer. It does not go out.',
              },
              {
                id: 'hold-road',
                label:
                  'Keep the road closed. Whatever walks in the water now, the tower was right not to let it in.',
                effects: {
                  affinity: { 'mire-mothers': -5 },
                  local: { 'gate-watch': 2 },
                  flags: ['d03-mire-road-held'],
                },
                response:
                  'The Watch double the barrier and light braziers along it all night. The reed-cutter goes home the long way, around the fires, with her tally stick held flat against her chest.',
              },
              {
                id: 'hail',
                label:
                  'Hail them across the water, and tell them the tower remembers turning them away.',
                effects: {},
                response:
                  'The reed-cutter nods. “Tell them sorry, if you mean it,” she says. “They’ll know if you don’t.”',
                postsQuests: ['q-d03-fen-hail'],
              },
              {
                id: 'ambush',
                label:
                  'Ambush them. Whatever came back is not what the tower turned away.',
                effects: {},
                response:
                  'The reed-cutter backs away from the throne, one step, then two. “Then I’ll keep my girl off the roof,” she says, “and I’ll keep her off it after, too.”',
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
          'The Saltroad factor has brought her cold letter in person, which is a courtesy and also a threat. She is a stout old camel in a caravan coat with medicine vials sewn into the lining, and every one of them chimes when she bows.',
          '“Your Majesty bought Saltroad tincture at Saltroad prices and handed it to the Pack at the bridge. Very generous. I have come to explain, before it becomes a habit, what that generosity costs.”',
          '“We are not a well, Your Majesty. We are a road, and a road has only so many carts. Every vial you give away is a vial a salt-flat village did not get. The Pack’s pups breathe easier this week. Somewhere on the flats, someone else’s do not.”',
          '“So. The Saltroad asks a market fee on any tincture bought for raiders. Or the crown’s word that it was a single kindness, not a policy.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'She is not wrong about the carts, Your Majesty. She is also the one who sets the price on them, and she has not mentioned that.',
          },
        ],
        options: [
          {
            id: 'ask-triple',
            label:
              'Ask why the Pack pays three times what a salt-flat village pays.',
            effects: {},
            response:
              'The vials stop chiming. The factor stands very straight, the way people stand at a graveside.',
            next: 'brother',
          },
          {
            id: 'let-kiyo',
            label: 'Let Kiyo, who came here on a Saltroad boat, answer her.',
            requires: { follower: 'F003' },
            effects: {},
            response:
              'Kiyo sets down the kettle she has been carrying through the hall and comes to stand beside the throne, hands folded in her sleeves.',
            next: 'kettle',
          },
          {
            id: 'pay-fee',
            label: 'Pay the market fee, and keep the Pack’s pups on tincture.',
            requires: { cost: 15 },
            effects: {
              affinity: { saltroad: 5, jackalwire: 5 },
              local: { ledger: -1 },
              flags: ['d03-tincture-fee-paid'],
            },
            response:
              'The factor writes a receipt in a hand so neat it looks engraved. “A pleasure,” she says, and you understand that the price of a kindness has just been set, and that it will rise.',
          },
          {
            id: 'single-kindness',
            label: 'Give her your word: it was one kindness, not a policy.',
            effects: {
              affinity: { saltroad: 10, jackalwire: -5 },
              flags: ['d03-pack-medicine-ended'],
            },
            response:
              'She bows, and the vials chime like small coins. A week later a coughing pup is carried past the southern bridge in the back of a painted wagon, and nobody from the Pack comes to the tower to ask why.',
          },
          {
            id: 'refuse-fee',
            label:
              'The crown will buy medicine for whomever it pleases, at whatever price is asked.',
            effects: {
              affinity: { saltroad: -10, jackalwire: 5 },
              local: { yard: 1 },
              flags: ['d03-tincture-defied'],
            },
            response:
              'The factor folds the letter she never needed to read aloud and tucks it into her coat among the vials. “At whatever price is asked,” she repeats. “I will make sure it is asked.”',
          },
        ],
        beats: [
          {
            id: 'brother',
            lines: [
              '“Because two summers ago a Jackalwire band burned a Saltroad caravan on the Ford road. Eight carts. My brother drove the third one.” She says it the way people say a price they have said many times. “He lived. He does not drive any more.”',
              '“So yes, we charge the Pack three times. Every factor on the road agreed to it. It is not greed, Your Majesty. It is a memorial. We set it in brass so nobody would forget.”',
              '“And their pups had nothing to do with it. I know that. I have known it every day I wrote the price.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A grudge priced in medicine, Your Majesty, and the hyenas who burned those carts may not even run with the band whose pups are coughing. The Pack has a great many captains.',
              },
            ],
            options: [
              {
                id: 'one-price',
                label:
                  'Propose one price for tincture, posted at the bridge, for every buyer. The crown covers her first season’s loss.',
                requires: { cost: 20 },
                effects: {
                  affinity: { saltroad: -5, jackalwire: 10 },
                  local: { lamplight: 1 },
                  flags: ['d03-tincture-one-price'],
                },
                response:
                  'She is silent a long time. “The other factors will call me soft,” she says at last. “My brother will spit when I tell him. And then I think he will sit down, and I think he will be glad.” She writes the price out herself.',
              },
              {
                id: 'name-the-band',
                label:
                  'Ask which band burned the carts. The crown will collect that debt from them, not from their pups.',
                effects: {
                  affinity: { saltroad: 10, jackalwire: -10 },
                  local: { 'gate-watch': 1 },
                  flags: ['d03-caravan-burners-named'],
                },
                response:
                  '“The Red Spoke band,” she says, and writes it down for you like a line on a shipping manifest. By evening the Gate Watch have chalked the name on the board above their fire, and the Pack has heard that they did.',
              },
              {
                id: 'pay-fee',
                label:
                  'Pay her fee. A memorial is owed something, even when it is aimed wrong.',
                requires: { cost: 15 },
                effects: {
                  affinity: { saltroad: 5, jackalwire: 5 },
                  local: { ledger: -1 },
                  flags: ['d03-tincture-fee-paid'],
                },
                response:
                  'She takes the brass with both hands, the way you would take something from a grave. “He would want me to take it,” she says. “That is the trouble with him.”',
              },
              {
                id: 'single-kindness',
                label:
                  'Give her your word: one kindness, not a policy. The road can keep its memorial.',
                effects: {
                  affinity: { saltroad: 10, jackalwire: -5 },
                  flags: ['d03-pack-medicine-ended'],
                },
                response:
                  '“Thank you,” she says, and seems surprised to find that she does not feel better. The vials chime all the way to the doors.',
              },
            ],
          },
          {
            id: 'kettle',
            lines: [
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'I know this tincture, Your Majesty. Willowbark, salt, a little honey, boiled down in copper. The Saltroad carried my family across the straits for nothing, when we had nothing. I owe them more than I can say.',
              },
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'And I can brew something close to it in the Yard kitchen for a tenth of the price. Not as strong. It would not cure a pup. It would let one sleep.',
              },
              '“If the tower starts brewing its own tincture,” the factor says, very quietly, “every village on the flats will want to know why the tower’s pot is cheaper than ours. So will I.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A kettle in the Yard kitchen is a very small thing, Your Majesty, until it is a market.',
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
                  'That night the Yard kitchen smells of willowbark until dawn. The cooks complain about the smell, and then one by one they ask Kiyo for a cup for their own coughs. The factor’s next letter is not cold. It does not come at all.',
              },
              {
                id: 'kiyo-gives-recipe',
                label:
                  'Ask Kiyo to give her recipe to the factor instead, as a gift to the road that carried her.',
                effects: {
                  affinity: { saltroad: 10, jackalwire: -5 },
                  flags: ['d03-kiyo-recipe-shared'],
                },
                response:
                  'Kiyo writes it out in her own hand, with a note at the bottom in a script nobody at court can read. The factor reads the note twice and bows to Kiyo, not to you. The price at the bridge does not change by a single copper.',
              },
              {
                id: 'pay-fee',
                label:
                  'Thank Kiyo, and pay the factor’s fee. Kiyo’s kettle is for the court.',
                requires: { cost: 15 },
                effects: {
                  affinity: { saltroad: 5, jackalwire: 5 },
                  local: { ledger: -1 },
                  flags: ['d03-tincture-fee-paid'],
                },
                response:
                  'Kiyo nods and picks her kettle back up. Later you find her in the Yard kitchen anyway, boiling willowbark for no one in particular, as if keeping her hands in practice.',
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
      'Survey flags cost money and silence costs nerve, so both of those are real. A raider pack that wants only a feast has never existed, Your Majesty. Count your spoons before you attend.',
    quests: ['q-d04-survey-flags'],
    audiences: [
      {
        id: 'd04-letter-from-bell',
        title: 'Letter From Bell',
        speaker: 'Pip Thread, archivist of Hollow Bell',
        faction: 'hollow-bell',
        lines: [
          'The moth comes up the carpet in a coat too heavy for the weather, wings folded tight beneath it, holding a letter in both hands the way someone holds evidence. Their spectacles are mended with thread. They stop exactly at the line where petitioners are meant to stop, check the line, and stop again.',
          '“I brought a letter from the Hollow Bell archive. Nobody sent it. I mean, I sent it. I am delivering it. I am Pip Thread. I also wrote it.”',
          '“It says I would like to work for the tower’s records instead. There is a reason, but it is on a page that is no longer in the ledger.”',
          '“I do not talk very well, Your Majesty. I read very well. I remember everything I read. That is the whole of my petition.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'An archivist who leaves home over a missing page, Your Majesty, is either running from it or carrying it. I would like to know which before we give them a desk.',
          },
        ],
        options: [
          {
            id: 'ask-page',
            label: 'Ask what was on the page that is no longer in the ledger.',
            effects: {},
            response:
              'Pip goes very still, the way a moth does on a windowpane. “I can tell you what was on it,” they say. “I cannot tell you who took it. I have no proof of that. I want to be clear about the proof.”',
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
              'Pip folds the letter very small. “If the tower changes its mind, I will be in the same place. Always.”',
          },
        ],
        beats: [
          {
            id: 'page',
            lines: [
              '“Hollow Bell’s register of the missing. Third volume, page two hundred and eight. A well-cleaner from the far wards reported her son gone in the dry month. Nine years old. She gave his name, his height, the colour of his scarf.”',
              '“A season later I needed the page for a cross-reference. Page two hundred and eight now says the well-cleaner is childless. The ink is a season fresher than the page before it. The binding thread is new. The seal at the foot is the mayor’s office.”',
              '“I asked about it once, politely. The next week I was moved to the grain tallies.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The mayor’s office is a great many clerks, Your Majesty, and Mara Reedbell has been good to this throne. An archivist with a grievance and a perfect memory can do a town a great deal of harm. So, I grant you, can a missing boy.',
              },
            ],
            options: [
              {
                id: 'recall',
                label:
                  'Ask Pip to write the page out from memory, here, before you decide anything.',
                effects: {},
                response:
                  'A clerk brings ink. Pip writes without looking at the paper, fast and small, and the whole court goes quiet listening to the pen.',
                next: 'recall',
              },
              {
                id: 'compare-ledger',
                label:
                  'Tell Pip the mayor showed the crown a ledger this week, and every figure in it was in order.',
                requires: { flags: ['d03-bell-ledger-asked'] },
                effects: { local: { lamplight: 1 } },
                response:
                  'Pip nods slowly. “The water accounts. Every page numbered.” They do not ask how you know. “That is the book she shows people. Let me show you the other kind of page.” A clerk brings ink.',
                next: 'recall',
              },
              {
                id: 'welcome',
                label:
                  'Take Pip in. The question comes with them, and the tower will carry it.',
                requires: { cost: 15 },
                effects: { recruit: ['F005'], local: { lamplight: 2 } },
                response:
                  'Pip bows too low and drops the letter, and picks it up, and holds it out to you. “Then this belongs in your archive now. I will start a file on myself. And one on page two hundred and eight.”',
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
                  'Pip folds the letter very small, smaller than paper should fold. “Hollow Bell will not answer for it, Your Majesty. But I will be in the same place, if the tower changes its mind. Always.”',
              },
            ],
          },
          {
            id: 'recall',
            lines: [
              'The page Pip hands up is dense with the archive’s cramped hand: a date in the dry month, a ward, a well-cleaner’s name, Hesper Lowe, and beneath it, in a clerk’s careful print, “son, Tobin, nine years, green scarf, last seen at the far-ward pump.”',
              '“That is all of it,” Pip says. “It is not very much. It is all she had.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A page like that is worth more in a drawer than on a wall, Your Majesty. Post it, and Hollow Bell tears itself apart over a boy nobody can find. Keep it, and one day it may buy you something from Mara that nothing else can.',
              },
              '“It is not a coin,” Pip says, to the floor. “It is a boy.”',
            ],
            options: [
              {
                id: 'post-page',
                label:
                  'Post the recalled page on the fortress gate, where the far wards’ carters will read it.',
                effects: {
                  affinity: { 'hollow-bell': -8 },
                  local: { lamplight: 2 },
                  flags: ['d04-page-posted'],
                },
                response:
                  'By evening the page is nailed up beside the tax rate. By morning there is a crowd from Hollow Bell in front of it, reading it to each other aloud, and someone has tied a green thread to the nail.',
                next: 'decide',
              },
              {
                id: 'seal-page',
                label:
                  'Keep the page under the tower’s seal, as Komodo advises. A secret held is a secret that can be spent.',
                effects: {
                  local: { lamplight: -1, 'old-houses': 1 },
                  flags: ['d04-page-sealed'],
                },
                response:
                  'Komodo takes the page himself, folds it along a line only he seems to see, and locks it in the dispatch chest. Pip watches the key turn as if it were turning in them.',
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
                  'A Yard runner carries it to the far wards in an unmarked sleeve. He comes back late, and will only say that she read it standing up, then sat down on the pump step, then thanked him three times.',
                next: 'decide',
              },
            ],
          },
          {
            id: 'decide',
            lines: [
              'Pip has not moved from the line on the carpet. They hold the empty letter in both hands.',
              '“That was the page,” they say. “This is the petition. The tower’s records, if the tower will have me. I will work in whatever room is coldest. I do not need to be talked to.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Whatever you decide about the archivist, Your Majesty, Hollow Bell will decide you decided it because of the page.',
              },
            ],
            options: [
              {
                id: 'welcome',
                label: 'Welcome Pip to the court, and pay their passage.',
                requires: { cost: 15 },
                effects: { recruit: ['F005'], local: { lamplight: 2 } },
                response:
                  'Pip bows too low and drops the letter. “I’ll start a file on myself,” they say, and then, more quietly, “and one on Tobin.”',
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
                  'Pip folds the letter very small. “If the tower changes its mind, I will be in the same place. Always.” At the doors they look back once, at the dispatch chest or at the gate. You cannot tell which.',
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
          'The fledgling wears a runner’s mantle cut for someone twice her size, the hem dragging, the copper chimes along it stuffed with wool so they will not ring. She keeps glancing at the high windows while she talks, as if the sky might be listening.',
          '“Every crow on the Heights stopped talking at once, Your Majesty. Yesterday at noon. Mid-word. The elders, the weather-readers, the runners in the caves. Even the chicks.”',
          '“The elders won’t say why. They just sit on the ledges and face east.” She swallows. “I’m not supposed to be here. I just thought someone should know.”',
          'Halfway through her petition, the court notices what she has not: an ancient grey-blue crow has settled on the rail of the far gallery, clouded eyes half closed, his own mantle of chimes perfectly still.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Do not look at the gallery, Your Majesty. She has not seen him yet. I would rather she heard your answer before she does.',
          },
        ],
        options: [
          {
            id: 'ask-leave',
            label: 'Ask the fledgling who gave her leave to come.',
            effects: {},
            response:
              '“Nobody,” she says, and then she follows your eyes to the gallery, and all the colour goes out of her voice.',
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
              'The fledgling’s eyes go wide. “Don’t say I told you the way up.” On the gallery rail, the old crow’s head turns, very slightly, toward her.',
            postsQuests: ['q-d04-crow-roost'],
          },
        ],
        beats: [
          {
            id: 'bond',
            lines: [
              '“I’m a bonded runner, Your Majesty. Four years left. Runners carry the elders’ words and no others. A runner who carries words without leave gets years added. Sometimes a great many years.”',
              '“I thought if something was wrong enough to make the Heights go quiet, somebody down here should know. I thought that was what runners were for.” She is looking at the gallery now and cannot stop. “That is Elder Corvane. He taught me my first forecast.”',
              'On the gallery rail the old crow does not move. He does not need to. Everyone in the hall understands that the warning has already been paid for, and that the only question left is by whom.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Under Conclave law she belongs to the Heights, Your Majesty, on loan to the sky. Keeping her is theft. I say it only because Corvane will, and he will say it more slowly.',
              },
            ],
            options: [
              {
                id: 'shelter-runner',
                label:
                  'Give the fledgling the tower’s protection. A warning should not cost the one who carried it.',
                effects: {
                  affinity: { 'storm-crows': -10 },
                  local: { yard: 1, lamplight: 1 },
                  flags: ['d04-runner-sheltered'],
                },
                response:
                  'You say it loud enough for the gallery. The fledgling stares at you. On the rail, Elder Corvane opens his clouded eyes, and for one moment every chime in his mantle rings at once, though nothing has touched them. Then he is gone, and the window he left by stays open all day.',
              },
              {
                id: 'return-runner',
                label:
                  'Send her back to the elder with the crown’s thanks for the warning, and ask that her years be spared.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { yard: -1 },
                  flags: ['d04-runner-returned'],
                },
                response:
                  'The fledgling climbs the gallery stair on her own. Elder Corvane bows to you, very low and very slowly, which may be an answer to your request and may be an answer to something else. The wool has come out of one of her chimes, and it rings at every step.',
              },
              {
                id: 'address-elder',
                label: 'Speak to the elder in the gallery directly.',
                effects: {},
                response:
                  'The whole hall turns to the gallery. Elder Corvane looks down at you as if you were weather.',
                next: 'elder',
              },
              {
                id: 'climb-roost',
                label:
                  'Send climbers to the roost tonight, and keep the fledgling here until they are back.',
                effects: {},
                response:
                  '“Don’t say I told you the way up,” she whispers, though everyone in the hall, including the gallery, heard her tell you.',
                postsQuests: ['q-d04-crow-roost'],
              },
            ],
          },
          {
            id: 'elder',
            speaker: 'Elder Corvane of the Storm Crow Conclave',
            npc: 'elder-corvane',
            lines: [
              'Elder Corvane does not speak. The Heights are silent, and he is the Heights. He only lifts one grey wing, slowly, and points with it: east, past the windows, toward the sunken rail yards where nothing is supposed to be moving.',
              'Then he lowers the wing and looks at the fledgling, and then at you, and waits with the patience of someone who has waited out droughts.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He has just told you more than the elders have told their own runners, Your Majesty. He will expect something for it. Crows always do.',
              },
            ],
            options: [
              {
                id: 'shelter-runner',
                label:
                  'Tell him, to his face, that the runner stays under the tower’s protection.',
                effects: {
                  affinity: { 'storm-crows': -10 },
                  local: { yard: 1, lamplight: 1 },
                  flags: ['d04-runner-sheltered'],
                },
                response:
                  'Elder Corvane regards you for a long moment. Then every chime in his mantle rings once, together, though nothing has touched them, and he is gone. The fledgling sits down on the carpet where she stands, as if her legs have only just heard the news.',
              },
              {
                id: 'return-runner',
                label:
                  'Send her up to him with the crown’s thanks, and ask, as a courtesy, that her years be spared.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { yard: -1 },
                  flags: ['d04-runner-returned'],
                },
                response:
                  'The elder inclines his head the width of a feather. The fledgling climbs to him without being told. Neither of them looks back, and the wool has come out of one of her chimes, and it rings at every step.',
              },
              {
                id: 'sit-with-elders',
                label:
                  'Bow, and ask that the crown’s envoys be allowed to sit with the elders until the silence ends.',
                effects: {},
                response:
                  'Corvane closes his eyes, which may be consent. The fledgling lets out a breath she has been holding since she came in. “They’re very good at sitting,” she whispers. “Bring cushions.”',
                postsQuests: ['q-d04-crow-elders'],
              },
              {
                id: 'climb-roost',
                label:
                  'Thank him, and send climbers up the high roost tonight to see what he pointed at.',
                effects: {},
                response:
                  'The old crow’s clouded eyes rest on you a moment longer, unreadable. Then he turns on the rail to face east again, as if to show the climbers where to look.',
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
          'The wagon-painter arrives with paint still wet on his paws, a lean hyena in a smock so spattered with colour that it is impossible to say what it was first. He has brought a sample: a little wooden panel showing the tower and the Pack’s wagons side by side under a fat yellow moon, everyone smiling, nobody armed.',
          '“The Pack is throwing a feast in the tower’s honor, Majesty. No blades, they say. Only music and roast goat, and the good fiddles, not the loud ones.”',
          '“They’d be very hurt if the tower didn’t come. Hurt is a dangerous thing in a hyena. I say that as one.”',
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
              'The painter laughs, then looks down at the panel in his paws, then stops laughing.',
            next: 'patron',
          },
          {
            id: 'let-saffron',
            label:
              'Let Saffron, who rode with the Pack once, read the invitation.',
            requires: { follower: 'F002' },
            effects: {},
            response:
              'Saffron takes the painted panel, turns it over, and runs a claw along a mark on the back that nobody else had noticed.',
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
            label: 'Send gifts instead, and a polite apology.',
            requires: { cost: 15 },
            effects: { affinity: { jackalwire: 10 }, local: { ledger: -1 } },
            response:
              'The painter weighs the gifts and looks, for a moment, genuinely surprised.',
          },
          {
            id: 'decline',
            label: 'Decline. The tower does not dine with raiders.',
            effects: {
              affinity: { jackalwire: -10 },
              local: { 'old-houses': 1 },
            },
            response:
              'The painter shrugs. “They’ll eat the goat anyway.” He leaves the little panel on the dais step, face down.',
          },
        ],
        beats: [
          {
            id: 'patron',
            lines: [
              '“Two captains, Majesty. That’s the trouble. The Pack has a great many captains, and two of them paid me, and they didn’t pay me the same.”',
              '“One is the fiddler from the toll bridge, the one with the painted jaw. Her camp wants to feast you. Truly. They’ve been cooking for two days.” He hesitates. “The other has twice as many wagons and a very excellent coat, and he wants the tower’s people sitting down, all in one place, with their hands full of goat.”',
              '“I don’t know what he means by it. I only know which half of the invitation I was paid more for.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'So the feast is real and so is the trap, Your Majesty, and both are being served at the same table. Whatever you send, you send to both.',
              },
            ],
            options: [
              {
                id: 'go-unarmed',
                label:
                  'Attend unarmed. If the fiddler’s camp is sincere, the tower will be sincere back.',
                effects: {
                  affinity: { jackalwire: 10 },
                  local: { 'gate-watch': -2 },
                  flags: ['d04-feast-unarmed'],
                },
                response:
                  'The Gate Watch hand over their blades at the tower door with faces like closed shutters. Under the painted wagons the goat is excellent and the fiddles are the good ones, and all night a big hyena in a feathered coat watches your table from the dark, counting.',
              },
              {
                id: 'warn-fiddler',
                label:
                  'Decline the feast, and send the fiddler a private warning about her fellow captain.',
                effects: {
                  affinity: { jackalwire: -5 },
                  local: { 'gate-watch': 1 },
                  flags: ['d04-pack-split-sown'],
                },
                response:
                  'Your note goes back folded inside the painted panel. The feast is called off by nightfall. By dawn there are two camps by the southern bridge instead of one, and they have turned their wagons to face each other.',
              },
              {
                id: 'fiddler-vouches',
                label:
                  'Send word to the fiddler whose pups the tower dosed: the court will come, if she stands beside its table.',
                requires: { flags: ['pack-medicine'] },
                effects: {
                  affinity: { jackalwire: 10 },
                  local: { 'gate-watch': -1 },
                  flags: ['d04-fiddler-vouches'],
                },
                response:
                  'The fiddler meets your party at the edge of the camp and stands beside your chair for the whole feast. She does not sit down once, and she does not play. Nobody in a feathered coat comes within twenty paces of the table.',
              },
              {
                id: 'ask-informant',
                label:
                  'Ask the painter whether the Pack has found out about the map of their camp.',
                requires: { flags: ['pack-camp-mapped'] },
                effects: {},
                response:
                  'The painter’s smile goes thin. “You’d know about that, would you.”',
                next: 'informant',
              },
              {
                id: 'attend-armed',
                label:
                  'Attend, with blades hidden in the supply carts. If he wants hands full, he can have them.',
                effects: {},
                response:
                  'The painter grins with all his teeth, and then, quietly, turns the panel face down. “Wonderful,” he says. “I’ll paint it afterwards.”',
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
                  'The painter weighs the gifts and looks, for a moment, genuinely surprised. “Only hers,” he says. “He’ll notice. He notices everything that isn’t his.”',
              },
            ],
          },
          {
            id: 'informant',
            lines: [
              '“They found the ration card, Majesty. One of your Gate Watch drank too much and described the drawing to the wrong barmaid. Then the Pack looked for a pup with a bandaged paw, and there was only one.”',
              '“He’s alive. He’s tied to a wagon wheel at the edge of the camp, and the captains are waiting to see whether the tower comes to the feast. They think it would be funny if you ate goat twenty paces from him.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Claim him, Your Majesty, and you confess to spying on the Pack in front of every captain at once. Do not, and the Gate Watch will learn exactly what the crown’s brass is worth to the people who take it.',
              },
            ],
            options: [
              {
                id: 'claim-informant',
                label:
                  'Go to the feast, claim the boy as the crown’s, and pay whatever they ask for him.',
                requires: { cost: 25 },
                effects: {
                  affinity: { jackalwire: -5 },
                  local: { 'gate-watch': 2 },
                  flags: ['d04-informant-claimed'],
                },
                response:
                  'You pay it in front of the whole camp. The captains laugh, take the brass and cut the rope themselves. The boy walks back to the tower behind your wagon with his bandaged paw held against his chest, and the Gate Watch make room for him by their fire.',
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
                  'The painter nods, as if you had confirmed a price. The tower does not go to the feast. Nobody at court ever learns what happened to the boy at the wheel, and after a week the Gate Watch take the ration card down from above their fire and burn it.',
              },
              {
                id: 'attend-armed',
                label:
                  'Attend with blades in the carts, and cut him loose when the fiddles start.',
                effects: {},
                response:
                  'The painter looks at you for a long time. “Then I was never here,” he says, and leaves the little panel on the dais step, the one where everyone is smiling.',
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
                text: '“That’s a naming mark. The good fiddles only come out when somebody’s pup has been named, and somebody’s pup has been named, Majesty, I’d bet my toolkit on it, so the feast is real. It’s real. The cooking is real, I mean.”',
              },
              'Saffron is talking very fast. Her free hand has gone to the toolkit at her hip, and stays there.',
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: '“What else is real I couldn’t tell you. I left. Everybody knows I left. But nobody in the Pack draws a blade across a table with a Kett at it. That’s an old rule. It still works. Probably. Send me.”',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'An old rule of a Pack she has left, Your Majesty. She knows it very well, for someone who has left.',
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
                  'Saffron comes back at dawn smelling of woodsmoke and goat fat, with a smear of paint on her muzzle that she says a pup put there and will not say whose. “Nobody drew,” she says. She does not say who she sat beside.',
              },
              {
                id: 'attend-armed',
                label:
                  'Attend armed, and seat Saffron where she can see the supply carts.',
                effects: {},
                response:
                  'Saffron’s hand comes off the toolkit. “Right,” she says. “Sure. Good. Where I can see the carts.” She does not look at the painter again.',
                postsQuests: ['q-d04-feast-armed'],
              },
              {
                id: 'decline',
                label:
                  'Thank her, and decline the feast. The tower will not test an old rule with her neck.',
                effects: {
                  affinity: { jackalwire: -10 },
                  local: { 'old-houses': 1 },
                },
                response:
                  'Saffron says “Fine” very quickly, and then, slower, “Fine.” That evening you find her on the wall, facing south, where the smoke from the Pack’s cookfires is just visible over the hills.',
              },
            ],
          },
        ],
      },
    ],
  },
]
