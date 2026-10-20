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
        speaker: 'The Ledger’s factor and the Yard’s foreman',
        faction: 'ledger',
        lines: [
          'The Ledger’s factor wants the fortress market taxed lightly, so trade comes to the tower. The Yard’s foreman wants it taxed hard, so the wages get paid.',
          'They both want the emperor to decide before lunch.',
        ],
        options: [
          {
            id: 'high',
            label: 'Tax the market hard. The crown needs brass.',
            effects: {
              brass: 30,
              local: { ledger: -3, yard: -1 },
              flags: ['tax-high'],
            },
            response:
              'The factor sighs into her ledger. The foreman looks at the brass, then at his empty hands.',
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
            response: 'Nobody is delighted. Everybody can read it.',
          },
          {
            id: 'low',
            label: 'Tax the market lightly, and let trade grow.',
            effects: {
              local: { ledger: 3, yard: 2, 'old-houses': -2 },
              flags: ['tax-low'],
            },
            response:
              'The factor beams. Somewhere in the fortress, an Old House lord writes a disapproving letter.',
          },
        ],
      },
      {
        id: 'd02-rain-bargain',
        title: 'A Bargain in Rain',
        speaker: 'A Storm Crow envoy',
        faction: 'storm-crows',
        lines: [
          'The Conclave offers a season of rain over your dry fields. In return, one favor from the tower, to be named later.',
          'The contract is here. It is long. We are sure you will find it fair.',
        ],
        options: [
          {
            id: 'honest-terms',
            label: 'Name the favor you will owe and sign it plainly.',
            effects: {
              affinity: { 'storm-crows': 10 },
              flags: ['crow-favor-owed'],
            },
            response:
              'The envoy tilts his head. “Plainly. How unusual.” The rain comes in four days.',
          },
          {
            id: 'fine-print',
            label: 'Have the contract read line by line before anyone signs.',
            effects: {},
            response:
              'The envoy settles in to wait, as if he expected nothing else.',
            postsQuests: ['q-d02-crow-contract'],
          },
          {
            id: 'decline',
            label: 'Decline. The tower will find its own water.',
            effects: { affinity: { 'storm-crows': -5 } },
            response: '“Of course,” says the envoy, looking at the clear sky.',
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
          'The old chapel bell rang all night, Your Majesty, and nobody was near the rope. My people are frightened.',
          'I would rather it stayed a story. But if the crown wants to look, look quietly.',
        ],
        options: [
          {
            id: 'keep-vigil',
            label:
              'Post a quiet vigil in the chapel and wait for the rope to move.',
            effects: {},
            response: '“Quietly,” Mara repeats. “Thank you.”',
            postsQuests: ['q-d03-bell-vigil'],
          },
          {
            id: 'muffle-bell',
            label: 'Muffle the clapper and search the tower stairs.',
            effects: {},
            response:
              'Mara’s pen stops. “Muffle Hollow Bell’s bell. Well. If you must.”',
            postsQuests: ['q-d03-bell-search'],
          },
          {
            id: 'leave-it',
            label: 'Leave Hollow Bell its stories.',
            effects: { affinity: { 'hollow-bell': 3 } },
            response: 'Mara looks relieved, and then, briefly, afraid.',
          },
        ],
      },
      {
        id: 'd03-fen-lanterns',
        title: 'Lanterns in the Fen',
        speaker: 'A Mirefen reed-cutter',
        lines: [
          'There’s lanterns in the fen, Majesty, where nobody lives. They walk in step. My girl counted forty.',
          'I don’t want them gone. I want to know what they are.',
        ],
        options: [
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
            response: 'She goes. She does not look reassured.',
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
          'I brought a letter from the Hollow Bell archive. Nobody sent it. I mean, I sent it. I am delivering it.',
          'It says I would like to work for the tower’s records instead. There is a reason, but it is on a page that is no longer in the ledger.',
        ],
        options: [
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
      },
      {
        id: 'd04-silent-crows',
        title: 'The Silent Heights',
        speaker: 'A Storm Crow fledgling',
        faction: 'storm-crows',
        lines: [
          'Every crow on the Heights stopped talking at once. The elders won’t say why.',
          'I’m not supposed to be here. I just thought someone should know.',
        ],
        options: [
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
              'The fledgling’s eyes go wide. “Don’t say I told you the way up.”',
            postsQuests: ['q-d04-crow-roost'],
          },
        ],
      },
      {
        id: 'd04-painted-feast',
        title: 'A Feast Under Painted Wagons',
        speaker: 'A wagon-painter for hire',
        faction: 'jackalwire',
        lines: [
          'The Pack is throwing a feast in the tower’s honor, Majesty. No blades, they say. Only music and roast goat.',
          'They’d be very hurt if the tower didn’t come.',
        ],
        options: [
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
            response: 'The painter shrugs. “They’ll eat the goat anyway.”',
          },
        ],
      },
    ],
  },
]
