import type { AudienceDef, DayDef, DueDef, QuestAid, QuestDef } from './types'
import { D34_RUNNER_AT_GATE } from './actTwo'
import { MOLE_REFORMS_OPEN } from './moles'

// Answers that send real help to a quest already on the board (t-040 quest
// aid), so the audience and the board stop booking the same crisis twice
// (playtest act4 #2). Nobody sent: the quest settles at `resolve`.
const FORD = 'q-d31-iron-rain'
const WATCH_AT_FORD: QuestAid = {
  questId: FORD,
  label: 'The Gate Watch holds the near bank',
  bonus: 2,
  stat: 'might',
  resolve: 'partial',
  outcome:
    'Dunmark held the near bank with the Watch and no plan. They came home in carts.',
}
const VOLUNTEERS_AT_FORD: QuestAid = {
  questId: FORD,
  label: 'Thirty-one volunteers hold the near bank',
  bonus: 1,
  stat: 'might',
  resolve: 'partial',
  outcome:
    'The volunteers held the near bank one night. They came home in carts, the youngest first.',
}
const PACK_AT_FORD: QuestAid = {
  questId: FORD,
  label: 'The Pack rides for the Ford',
  bonus: 2,
  stat: 'might',
  resolve: 'partial',
  outcome:
    'The Pack held the Ford two days. On the third they took their pay in Freehold sheep.',
}
const BOXCARS_AT_FORD: QuestAid = {
  questId: FORD,
  label: 'Rustline boxcars wall the Ford',
  bonus: 2,
  stat: 'might',
  resolve: 'partial',
  outcome: 'The boxcars held a day. Then the riders brought rope.',
}
const WATCH_AT_THISTLEDOWN: QuestAid = {
  questId: 'q-d33-thistledown',
  label: 'The Gate Watch rides for Thistledown',
  bonus: 2,
  resolve: 'partial',
  outcome:
    'The Watch reached Thistledown at noon and lost a barn holding the rest. Hester counted heads twice.',
}
const REHEARSAL = 'q-d36-bell-rehearsal'
const EMPEROR_AT_FRONT: QuestAid = {
  questId: REHEARSAL,
  label: 'Every sister watches the emperor in the front row',
  bonus: 3,
  stat: 'guile',
}
const TEODOR_SINGS_FLAT: QuestAid = {
  questId: REHEARSAL,
  label: 'Teodor sings flat; every sister turns to glare',
  bonus: 2,
  stat: 'guile',
}

// Act IV, Days 31-40, "The Long Table" (conductor DAY-PLAN.md): open faction
// war, the coalition that will decide the Act V hideout, and Young Komodo's
// clues tightening until his Day 40 betrayal (which the engine fires at the
// dawn of Day 41). Every [K] beat must read innocently now and damningly
// later. What lies under the Abbey stays off-screen (WORLD-GUIDE.md).

export const ACT_FOUR_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d31-iron-rain',
    title: 'Iron Rain at the Ford',
    summary:
      'Plum riders are taking the Eastern Ford. The Freehold militia cannot hold it alone. Send people who can come home hurt.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 2,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['defense', 'urgent'],
    // t-043: the dam the crown shored up on Day 20 backed the river into a
    // reservoir across the old crossing. The riders have one road over now.
    aid: [
      {
        flags: ['ford-dam-built'],
        label: 'The new reservoir drowns the old crossing',
        bonus: 1,
        stat: 'might',
      },
    ],
    outcomeVariants: {
      success: [
        {
          flags: ['ford-dam-built'],
          text: 'The riders came down to the old crossing and found the reservoir where it used to be. They tried the dam road, one horse wide. The Ford held. The farms behind it still stand.',
        },
      ],
    },
    rewards: {
      triumph: {
        affinity: { freeholds: 15 },
        strength: { freeholds: 1, 'black-verge': -1 },
        local: { 'gate-watch': 2 },
        flags: ['ford-held'],
      },
      success: {
        affinity: { freeholds: 10 },
        strength: { freeholds: 1 },
        flags: ['ford-held'],
      },
      partial: { affinity: { freeholds: 3 } },
      failure: {
        affinity: { freeholds: -5 },
        strength: { freeholds: -1 },
        flags: ['ford-lost'],
      },
    },
    expired: {
      affinity: { freeholds: -10 },
      strength: { freeholds: -1 },
      flags: ['ford-lost'],
    },
    outcomes: {
      triumph:
        'The plum riders broke on the far bank and did not come back. The Freeholds call it the Iron Rain, for the arrows.',
      success:
        'The Ford holds until the final rider withdraws. Dunmark brings back every torn banner but will not count them as trophies. Behind the earthworks, farmers open their doors to fields that still belong to them.',
      partial:
        'The riders fall back at dusk, carrying the deed markers from two stolen fields. The Freehold reeve asks whether the court will call those fields lost or merely borrowed.',
      failure:
        'The Ford falls before the second watch. Hester pitches her militia tents inside the tower wall and hangs a list of the missing beside the throne petitions. She waits there to hear what the crown will do next.',
      expired:
        'No tower banners reach the Ford. Freehold volunteers hold the near bank through one night and retreat at sunrise with the last grain cart. The route to the farm country is open to the raiders.',
    },
  },
  {
    id: 'q-d33-thistledown',
    title: 'Wolves at Noon: Thistledown',
    summary:
      'Plum riders on the ridge above Thistledown at first light. They hit at midday, when the farmers are in the fields. Get there before noon.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense', 'urgent'],
    rewards: {
      success: {
        affinity: { freeholds: 10 },
        strength: { freeholds: 1 },
        flags: ['thistledown-defended'],
      },
      failure: {
        affinity: { freeholds: -5 },
        strength: { freeholds: -1 },
      },
    },
    expired: {
      affinity: { freeholds: -10 },
      strength: { freeholds: -1 },
      flags: ['thistledown-abandoned'],
    },
    outcomes: {
      success:
        'The riders came over the ridge at noon and found the fields full of pitchforks and the crown’s colours. They did not stay.',
      partial:
        'Thistledown loses its west barn but gets the households out. Hester Plowright counts every family in the field behind the mill, then asks whose grain will feed them until planting.',
      failure:
        'The rescue party arrives after the village has loaded its seed grain onto wagons. Raiders take two of those wagons in sight of the road. Hester keeps the wheel ruts as evidence of how late the crown came.',
      expired:
        'The crown chose the other road. Thistledown will remember which one.',
    },
    // t-043: a held Ford sends the riders the long way round.
    outcomeVariants: {
      // t-043: the second time the crown sends Thistledown nobody (Day 10).
      expired: [
        {
          flags: ['d10-promise-broken'],
          text: 'The crown chose the other road. Again. On the tenth day it promised every hand and sent none. Hester Plowright counts this with that. Two promises. No hands.',
        },
      ],
      success: [
        {
          flags: ['ford-held'],
          text: 'The riders came over the ridge at noon, the long way round. The Ford was held against them. They came in tired and found the fields full of pitchforks and the crown’s colours. They did not stay.',
        },
      ],
      failure: [
        {
          flags: ['ford-held'],
          text: 'The party was late. The riders had ridden the long way round the held Ford and still came first. Thistledown paid in barns and seed grain.',
        },
      ],
    },
  },
  {
    id: 'q-d33-waystation',
    title: 'Wolves at Noon: the Saltroad Stop',
    summary:
      'The same riders are circling the Saltroad waystation, where a caravan rests with half the Saltroad’s winter stock. Get there before noon.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense', 'urgent'],
    rewards: {
      success: {
        brass: 25,
        affinity: { saltroad: 10 },
        strength: { saltroad: 1 },
        flags: ['waystation-defended'],
      },
      failure: {
        affinity: { saltroad: -5 },
        strength: { saltroad: -1 },
      },
    },
    expired: {
      affinity: { saltroad: -10 },
      strength: { saltroad: -1 },
      flags: ['waystation-abandoned'],
    },
    outcomes: {
      success:
        'The caravan rolled out at dusk with every crate. Oriel Saltmarsh’s factor paid in brass and salt.',
      partial:
        'The caravan escapes with half its salt and none of its spare axles. At dusk Oriel Saltmarsh sends a factor to collect the names of the stranded waystation workers. The crown receives the bill.',
      failure:
        'The party finds the waystation roof collapsed and its toll ledger blown into the road. The caravan has scattered into the salt flats. Oriel offers half the reward to whoever brings back a driver.',
      expired:
        'The escort board stays blank. Oriel sends her wagons out under private guard and closes her salt account to the throne. The Ledger asks where the missing duties will come from.',
    },
  },
  {
    id: 'q-d35-trestle',
    title: 'Hold Saffron’s Trestle',
    summary:
      'The Jackalwire trestle is the last road south the war has not cut. Saffron Kett welded half of it. Hold it or it burns.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'high' },
    ],
    danger: 'high',
    tags: ['defense', 'repair'],
    rewards: {
      success: {
        affinity: { jackalwire: 10 },
        strength: { jackalwire: 1 },
        flags: ['trestle-held'],
      },
      // A burned bridge is nobody's road out (playtest act4 #8).
      failure: {
        affinity: { jackalwire: -5 },
        strength: { jackalwire: -1 },
        flags: ['trestle-burned'],
        clearFlags: ['route-trestle'],
      },
    },
    expired: {
      strength: { jackalwire: -1 },
      flags: ['trestle-burned'],
      clearFlags: ['route-trestle'],
    },
    outcomes: {
      success:
        'The trestle stands. The Pack’s wagons crossed all night. Somebody painted the crown’s colours on the first span.',
      partial:
        'The rail trestle holds under the final wagon and bends a handspan toward the canyon. Jinx wedges a scrap of iron beneath a broken brace and forbids the Pack to cross again until someone pays for repairs.',
      failure:
        'The trestle burns before the convoy can cross. On the far rim Jinx can see a line of Pack wagons turning back toward the toll road. She sends the crown a charred bolt, still warm.',
      expired:
        'No repair crew reaches the trestle. At midnight the first supports catch fire. By morning the Jackalwire can reach the canyon only by the road it once charged twice to use.',
    },
  },
  {
    id: 'q-d35-tunnel',
    title: 'Hold the Mole Tunnel',
    summary:
      'The Moles’ tunnel runs under the badlands to the fen’s edge. Hold its mouth and the war has a road underneath it.',
    region: 'mole-tunnels',
    faction: 'moles',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense', 'tunnels'],
    rewards: {
      success: {
        affinity: { moles: 10 },
        strength: { moles: 1 },
        flags: ['tunnel-held'],
      },
      // The Moles brought the roof down: the pledge and the way out go with it.
      failure: {
        affinity: { moles: -5 },
        strength: { moles: -1 },
        flags: ['tunnel-collapsed'],
        clearFlags: ['route-tunnel'],
      },
    },
    expired: {
      strength: { moles: -1 },
      flags: ['tunnel-collapsed'],
      clearFlags: ['route-tunnel'],
    },
    outcomes: {
      success:
        'The tunnel mouth held. Granny Umber sent a jar of honey and a note: “Good. Again tomorrow.”',
      partial:
        'The burrow entrance survives, but a raider has nailed a painted marker above it. Granny Umber orders the families moved two galleries deeper. The passage remains open at the price of being known.',
      failure:
        'The defenders bring the tunnel roof down before the riders can take it. The road above sinks into the badlands. Granny Umber writes down the names of every family that must now find another home.',
      expired:
        'No tower party comes. The tunnel wardens seal their own entrance before the raiders arrive. Granny Umber returns the crown its map of the road, torn across the line that used to lead home.',
    },
  },
  {
    id: 'q-d36-bell-rehearsal',
    title: 'The Silent Bell Rehearsal',
    summary:
      'Tonight the Abbey rehearses a bell with no clapper. Every sister will be in the chapel. Get into the cellars below and bring back proof.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'high' },
      { stat: 'lore', band: 'high', hidden: true },
    ],
    danger: 'high',
    lethal: true,
    tags: ['tracking', 'records'],
    rewards: {
      triumph: {
        affinity: { 'hollow-bell': 10, freeholds: 5 },
        local: { lamplight: 3 },
        flags: ['abbey-crypt-evidence', 'abbey-crypt-ledger'],
      },
      success: {
        affinity: { 'hollow-bell': 5 },
        local: { lamplight: 2 },
        flags: ['abbey-crypt-evidence'],
      },
      partial: { flags: ['abbey-crypt-heard'] },
      failure: {
        affinity: { abbey: -10 },
        flags: ['rehearsal-caught'],
        schedule: ['marrow-plums'],
      },
    },
    expired: { flags: ['abbey-crypt-heard'] },
    outcomes: {
      triumph:
        'Under the chapel is a door older than the Abbey. Before it, small shoes in a row, toes to the wall. The party brought back one shoe and the sisters’ tally book. A column for every family that gave a child. A second column: “Paid.”',
      success:
        'Under the chapel is a door older than the Abbey. Before it, small shoes in a row, toes to the wall. The party brought one back. Nobody at court can stop looking at it.',
      partial:
        'The party never reached the cellars. They heard the rehearsal: a choir singing toward the floor, and something under the floor keeping time.',
      failure:
        'Sister Marrow found them on the cellar stair and walked them out by lamplight, kind as you please. She asked after the emperor’s health three times.',
      expired:
        'No investigators take the chapel road. The music reaches the tower after dark through a row of empty windows. Dunmark posts a second watch without waiting for an order.',
    },
  },
  {
    // t-061: posted by Day 31's Next Year in a Sack audience.
    id: 'q-d31-seed-corn',
    title: 'The Carts in the Cut',
    summary:
      'Six seed carts wait in the cut below Thistledown with a fourteen-year-old on the whip. Bring them behind the walls before the plum riders come down the cut.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense', 'urgent'],
    rewards: {
      triumph: {
        affinity: { freeholds: 15 },
        local: { yard: 1 },
        flags: ['d31-seed-in-granary', 'd31-rafe-safe'],
      },
      success: {
        affinity: { freeholds: 10 },
        flags: ['d31-seed-in-granary', 'd31-rafe-safe'],
      },
      partial: { affinity: { freeholds: 5 }, flags: ['d31-rafe-safe'] },
      failure: { affinity: { freeholds: -10 }, flags: ['d31-seed-burned'] },
    },
    expired: { affinity: { freeholds: -10 }, flags: ['d31-seed-burned'] },
    outcomes: {
      triumph:
        'Six carts came through the postern at dusk with the plum riders a mile behind and turning back. Rafe walked beside the lead ox the whole way and would not ride. Thirty sacks went into the granary. Hester counted every one, then sat down on the last of them and did not get up for an hour.',
      success:
        'Five carts came in. The sixth lost a wheel in the cut and the party left it. Rafe wanted to stay with it. They put him on the lead cart and he cried the whole road home without a sound.',
      partial:
        'The riders came down the cut early. The party got the boy out and two carts. The rest burned where they stood. Hester has two carts of seed for nine Freeholds. She is already choosing who plants.',
      failure:
        'The carts burned in the cut. Rafe lit them himself when the riders came over the rise. The party found him in the ditch with the whip still in his hand, alive, deaf in one ear from the oil going up.',
      expired:
        'Nobody rode for the cut. At dusk a black smoke stood over Thistledown, then a smaller one in the cut below it. Rafe walked in two days later with singed eyebrows. He did not look at the tower when he passed it.',
    },
  },
]

// t-061: nine Freeholds' seed, stuck in the cut while the Ford burns.
const D31_SEED_CORN: AudienceDef = {
  id: 'd31-seed-corn',
  title: 'Next Year in a Sack',
  speaker: 'Hester Plowright, reeve of the Border Freeholds',
  npc: 'hester-plowright',
  faction: 'freeholds',
  lines: [
    'Hester Plowright comes in behind the muster with a sack over her shoulder and mud to the knee. She drops it at the foot of the dais. It splits at the seam. Seed corn runs out across the stone, yellow and dry.',
    '“That is next year, Majesty. All of it, from nine Freeholds. Thirty sacks on six carts. The plum coats are burning fields from the east bank in. When they reach the barns they burn those too.”',
    '“I want it in your granary. Behind your walls. Till spring.”',
    {
      who: 'Foreman Dunmore Ash',
      npc: 'dunmore-ash',
      text: 'The granary is the Yard’s winter, Majesty. Thirty sacks of her seed means thirty sacks of our flour sleeping in the rain.',
    },
    {
      who: 'Young Komodo',
      npc: 'young-komodo',
      text: 'Seed is a promise to plant, Your Majesty. A granary of promises feeds nobody in the cold months. It does buy a very loyal spring.',
    },
  ],
  options: [
    {
      id: 'ask-carts',
      label: 'Ask Hester who is with the carts.',
      effects: {},
      response:
        'Hester looks at the corn on the floor. She does not pick it up. “My grandson. Rafe. He’s fourteen and he has the whip.”',
      next: 'carts',
    },
    {
      id: 'bring',
      label: 'Send riders for the carts. The granary makes room.',
      effects: { local: { yard: -2 } },
      response:
        'Ash says nothing. He goes down to the granary with two clerks and starts carrying Yard flour into the courtyard under oilcloth. Hester watches him do it. She does not thank him. She will.',
      postsQuests: ['q-d31-seed-corn'],
    },
    {
      id: 'refuse',
      label:
        'The granary feeds the people already behind these walls. The Freeholds hide their own seed.',
      effects: {
        affinity: { freeholds: -10 },
        local: { yard: 2, 'old-houses': 1 },
        flags: ['d31-seed-refused'],
      },
      response:
        'Hester gathers the spilled corn off the floor into her hat, kernel by kernel. It takes a long time. Nobody helps her. Nobody stops her.',
    },
    {
      id: 'remind-wells',
      label:
        'Remind Hester whose wells were shut on the strangers in the drought.',
      requires: { flags: ['wells-closed'] },
      effects: { local: { yard: 1 }, flags: ['d31-wells-remembered'] },
      response:
        '“I remember,” Hester says. “I shut them.” She stands there a while with her hands empty.',
      next: 'please',
    },
  ],
  beats: [
    {
      id: 'carts',
      lines: [
        '“The carts are in the cut below Thistledown. The oxen are old. If the riders come down the cut before your people get there, Rafe tips the carts and burns them. I told him to. Better ash than theirs.”',
        '“He’ll do it, too. He’s a good boy. He does what I tell him.”',
        {
          who: 'Young Komodo',
          npc: 'young-komodo',
          text: 'Captain Dunmark has half the Watch at the Ford already, Your Majesty. A second party to the cut thins the tower again. The plum riders count gates the way the Ledger counts coin.',
        },
      ],
      options: [
        {
          id: 'bring',
          label: 'Send for the carts. Get the boy out first.',
          effects: { local: { yard: -2 } },
          response:
            'Hester picks one kernel off the floor and puts it in her apron pocket. “For luck,” she says. She has never said that in this hall before.',
          postsQuests: ['q-d31-seed-corn'],
        },
        {
          id: 'burn-now',
          label:
            'Send word to Rafe to burn the carts now. The seed is lost either way. The boy is not.',
          effects: {
            affinity: { freeholds: -5 },
            local: { yard: 1 },
            flags: ['d31-seed-burned'],
          },
          response:
            'The rider takes the order at a gallop. That night a second smoke stands up east of the Ford, smaller than the first and sweet-smelling. Rafe walks in two days later with his eyebrows singed. He will not look at his grandmother.',
        },
        {
          id: 'refuse',
          label: 'The granary stays for the wall. Tell her no.',
          effects: {
            affinity: { freeholds: -10 },
            local: { yard: 2, 'old-houses': 1 },
            flags: ['d31-seed-refused'],
          },
          response:
            'Hester nods as if she expected it. She leaves the split sack where it lies. The Yard sweeps up the corn that night and does not know what to do with it.',
        },
      ],
    },
    {
      id: 'please',
      lines: [
        '“I shut them because there wasn’t enough. There isn’t enough now. That’s the only reason anybody ever asks anybody for anything.”',
        'Then she says please. It costs her more than the corn.',
      ],
      options: [
        {
          id: 'bring',
          label: 'Send for the carts.',
          effects: { local: { yard: -2 } },
          response:
            'Hester lets out a breath she has been holding since the Ford. She goes to the window to watch the riders go.',
          postsQuests: ['q-d31-seed-corn'],
        },
        {
          id: 'refuse',
          label: 'Tell her the wells taught the crown the same lesson.',
          effects: {
            affinity: { freeholds: -10 },
            local: { yard: 2, 'old-houses': 1 },
            flags: ['d31-seed-refused'],
          },
          response:
            '“Fair,” Hester says. It is the worst thing she could have said. She walks out with the split sack leaking a yellow line down the carpet.',
        },
      ],
    },
  ],
}

// t-061: two of the Watch go over the wall; Day 10's oath is called in.
const D36_POSTERN_LADDER: AudienceDef = {
  id: 'd36-postern-ladder',
  title: 'Over the Wall',
  speaker: 'Captain Ferro Dunmark of the Gate Watch',
  npc: 'ferro-dunmark',
  faction: 'gate-watch',
  lines: [
    'Dunmark brings them in himself. Two of his own, tabards with the crown badge torn off. A tall one with a bandaged hand. A short one who keeps looking at the windows. Their spears stay outside the door.',
    '“Caught on the postern ladder at the change of watch, Majesty. Going over. Ward and Cass Tanner. Brothers. Eleven years in the Watch between them.”',
    '“Their mother’s farm is under the plum riders’ smoke. They asked for leave and I said no. I need every spear I have. So they took it.”',
    '“The Watch has hanged deserters in a war. The last emperor did it from that balcony. The Watch is waiting to see what this one does.”',
    {
      who: 'Young Komodo',
      npc: 'young-komodo',
      text: 'A rope is a short speech, Your Majesty. Everyone understands it. That is the trouble with it.',
    },
  ],
  options: [
    {
      id: 'ask-brothers',
      label: 'Ask the brothers why they did not come to the throne.',
      effects: {},
      response:
        'The short one, Cass, looks up for the first time. “We did. We stood in the petition line two days running. It closed both times.”',
      next: 'brothers',
    },
    {
      id: 'hang',
      label: 'The law of the Watch stands. Hang them at dawn.',
      effects: {
        local: { 'gate-watch': 2, 'old-houses': 2, yard: -3 },
        flags: ['d36-tanners-hanged'],
      },
      response:
        'Dawn. The whole Watch in the parade yard, the way it stood for the oath. Dunmark reads the order himself. Afterward he stays on the balcony until the yard is empty, and a while after that.',
    },
    {
      id: 'turn-out',
      label:
        'Strip their tabards and turn them out the gate. Let them go to their mother.',
      effects: {
        local: { 'gate-watch': -2, yard: 1 },
        flags: ['d36-tanners-turned-out'],
      },
      response:
        'The brothers walk out of the main gate in their shirts with the whole wall watching. Halfway down the road the tall one turns and salutes. Nobody on the wall salutes back. Somebody wants to.',
    },
    {
      id: 'oath-care',
      label:
        '“I swore I would never spend you cheaply. A rope is cheap.” Grant the leave they asked for.',
      requires: { flags: ['oath-of-care'] },
      effects: {
        local: { 'gate-watch': 3, 'old-houses': -2 },
        flags: ['d36-tanners-leave'],
      },
      response:
        'Dunmark looks at you the way he looked at you on the balcony the day of the oath. Then he unlocks the irons himself. “Three days,” he tells them. “Then you come back to me.” They come back on the second.',
    },
    {
      id: 'oath-crown',
      label:
        '“You swore you belong to the crown before all else.” Hold them to it.',
      requires: { flags: ['oath-of-crown'] },
      effects: {
        local: { 'gate-watch': 1, 'old-houses': 2, yard: -1 },
        flags: ['d36-tanners-held'],
      },
      response:
        '“Before all else,” Ward Tanner says, to the floor. They go back on the wall in irons that night, at the post nearest the smoke, where they can watch it all the way down.',
    },
  ],
  beats: [
    {
      id: 'brothers',
      lines: [
        '“Ma’s got the two little ones and a bad hip,” Cass says. “The riders burn the field first and the house after. Everybody knows the order now. We wanted to get there in between.”',
        'Ward lifts the bandaged hand. “Cut it on the wall spikes going over. Cass came back down for me. That’s how they got us. He came back down.”',
        {
          who: 'Captain Ferro Dunmark',
          npc: 'ferro-dunmark',
          text: 'Hanging them tells sixty people the rule. Freeing them tells sixty people there is no rule. Both are true, Majesty. I’ve stopped liking either.',
        },
        {
          who: 'Young Komodo',
          npc: 'young-komodo',
          text: 'Send them for the mother under orders, Your Majesty. Then it is not desertion. It is a patrol. Paper is kinder than rope, and it costs only the truth.',
        },
      ],
      options: [
        {
          id: 'patrol',
          label:
            'Write it as a patrol. Send them for their mother under the crown’s orders.',
          effects: {
            local: { 'gate-watch': 1, ledger: -1 },
            flags: ['d36-tanners-patrol'],
          },
          response:
            'Komodo writes the order in his own hand and dates it yesterday. Dunmark reads it, signs under it and says nothing about the date. The brothers ride out at noon with a mule for the hip.',
        },
        {
          id: 'hang',
          label: 'Hang them. The rule has to mean something.',
          effects: {
            local: { 'gate-watch': 2, 'old-houses': 2, yard: -3 },
            flags: ['d36-tanners-hanged'],
          },
          response:
            'Cass nods as if he expected it. Ward does not. At dawn Dunmark reads the order himself. He does not use their names. He uses them later, alone, to the empty yard.',
        },
        {
          id: 'turn-out',
          label: 'Turn them out. They are no longer the Watch’s problem.',
          effects: {
            local: { 'gate-watch': -2, yard: 1 },
            flags: ['d36-tanners-turned-out'],
          },
          response:
            'Dunmark tears the last thread of badge off Ward’s tabard himself. The brothers go out the main gate together, the short one holding the tall one’s good arm.',
        },
      ],
    },
  ],
}
export const ACT_FOUR_DAYS: readonly DayDef[] = [
  {
    day: 31,
    title: 'Iron Rain',
    briefings: [
      {
        id: 'crows-stop-war',
        source: 'A Storm Crow messenger',
        text: 'The Crows will bring a storm that stops the war at the Ford.',
        truth: false,
      },
      {
        id: 'ford-attacked',
        source: 'Freehold riders',
        text: 'Riders in plum crossed toward the Eastern Ford before dawn.',
        truth: true,
      },
      {
        id: 'watch-thin',
        source: 'The Gate Watch',
        text: 'Half the Gate Watch is already on the walls and has not slept.',
        truth: true,
        // t-043: “never cheaply” was spent on the canyon convoy (Day 11).
        variants: [
          {
            flags: ['d10-oath-of-care-broken'],
            text: 'Half the Gate Watch is on the walls and has not slept. Dunmark picks the riders for the Ford by lot. He has not sworn anyone to anything since the canyon.',
          },
        ],
      },
    ],
    komodo:
      'Nobody stops a war with weather, Your Majesty. This one gets paid in people. Send the ones who can carry the bill.',
    quests: ['q-d31-iron-rain'],
    audiences: [
      {
        id: 'd31-muster',
        title: 'The Muster',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'Dunmark comes up the carpet buckling his dented gorget. A Freehold rider limps at his elbow, a young ewe, a broken arrow shaft tied off in her arm. Nobody offers her a chair. She would not take one.',
          '“The Ford is under arrows, Majesty. The Freeholds are asking for the Gate Watch by name.”',
          {
            who: 'A Freehold rider',
            text: 'Plum coats, good horses. They don’t take prisoners, Majesty. They take fields. Every hour we stand here is another farm.',
          },
          '“I can march half my people to the Ford by noon. The tower will be thin behind them. Your call. I’d rather it wasn’t mine.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Pack would ride for brass, Your Majesty. The Rustline would wall the Ford for less. Nobody weeps for a mercenary.',
          },
        ],
        options: [
          {
            id: 'ask-walls',
            label: 'Ask Dunmark who would be left on the walls.',
            effects: {},
            response:
              'Dunmark glances at the rider, then the windows, and lowers his voice. For a captain his size, a courtesy.',
            next: 'walls',
          },
          {
            id: 'march',
            label: 'March the Watch to the Ford.',
            effects: {
              affinity: { freeholds: 10 },
              strength: { freeholds: 1 },
              local: { 'gate-watch': -2 },
              flags: ['watch-marched'],
              questAid: [WATCH_AT_FORD],
            },
            response:
              'Dunmark salutes and is gone before the echo is. By noon the walls are quiet.',
          },
          {
            id: 'hold',
            label: 'Keep the Watch on the walls.',
            effects: {
              affinity: { freeholds: -5 },
              local: { 'gate-watch': 2 },
            },
            response:
              '“Walls it is,” says Dunmark. He watches the smoke over the Ford. The rider goes without asking leave.',
          },
          {
            id: 'pack',
            label: 'Hire the Pack to ride for the Ford.',
            requires: { cost: 30, affinity: { jackalwire: 'neutral' } },
            effects: {
              affinity: { jackalwire: 5, freeholds: -3 },
              strength: { freeholds: 1 },
              flags: ['pack-hired-ford'],
              questAid: [PACK_AT_FORD],
            },
            response:
              'The Pack rides out whooping. The rider watches them go, her good hand on her knife. “They’ll want paying in our fields after,” she says. “They always do.”',
          },
          {
            id: 'rustline',
            label: 'Pay the Rustline to wall the Ford with scrap.',
            requires: { cost: 20, affinity: { rustline: 'neutral' } },
            effects: {
              affinity: { rustline: 10, freeholds: -3 },
              strength: { freeholds: 1 },
              local: { yard: -1 },
              flags: ['rustline-barricades'],
              questAid: [BOXCARS_AT_FORD],
            },
            response:
              'By noon the Ford is walled with boxcars, the Yard’s spare rails and every fence for a mile. The rail salvagers charge by the boxcar. The Freeholds will spend the winter fencing fields they kept.',
          },
        ],
        beats: [
          {
            id: 'walls',
            lines: [
              '“Recruits, Majesty. Twenty. The youngest is fifteen. Then the Yard’s night porters. Fourteen have held a spear. Two held it the right way round.”',
              '“The plum riders aren’t coming for the tower. Not today. But empty the walls every time a farm burns, and some day somebody burns a farm to empty them.”',
              {
                who: 'A Freehold rider',
                text: 'The last crown kept its soldiers home, Majesty. Hester Plowright buried eleven of ours that summer. She still writes to the tower on the day, every year.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'March them, Your Majesty. Nobody has attacked these walls in forty years. The Ford is under attack now. An empty wall is only a wall. An empty Ford is a hole in the kingdom.',
              },
            ],
            options: [
              {
                id: 'march',
                label: 'March the whole Watch. The walls can wait.',
                effects: {
                  affinity: { freeholds: 10 },
                  strength: { freeholds: 1 },
                  local: { 'gate-watch': -2 },
                  flags: ['watch-marched'],
                  questAid: [WATCH_AT_FORD],
                },
                response:
                  'Dunmark salutes and is gone before the echo is. The rider runs after him, arm and all. By noon the walls are empty. Komodo walks them alone, counting his steps.',
              },
              {
                id: 'hold',
                label: 'Keep the Watch on the walls. The Freeholds hold alone.',
                effects: {
                  affinity: { freeholds: -5 },
                  local: { 'gate-watch': 2 },
                },
                response:
                  '“Walls it is,” says Dunmark. The rider studies your face for Hester’s next letter. Then she leaves.',
              },
              {
                id: 'pack',
                label: 'Hire the Pack. Let raiders bleed for farmers.',
                requires: { cost: 30, affinity: { jackalwire: 'neutral' } },
                effects: {
                  affinity: { jackalwire: 5, freeholds: -3 },
                  strength: { freeholds: 1 },
                  flags: ['pack-hired-ford'],
                  questAid: [PACK_AT_FORD],
                },
                response:
                  'The Pack rides out whooping. The rider watches them go, her good hand on her knife. “They’ll want paying in our fields after,” she says. “They always do.”',
              },
              {
                id: 'rustline',
                label: 'Pay the Rustline to wall the Ford with scrap.',
                requires: { cost: 20, affinity: { rustline: 'neutral' } },
                effects: {
                  affinity: { rustline: 10, freeholds: -3 },
                  strength: { freeholds: 1 },
                  local: { yard: -1 },
                  flags: ['rustline-barricades'],
                  questAid: [BOXCARS_AT_FORD],
                },
                response:
                  'By noon the Ford is walled with boxcars, the Yard’s spare rails and every fence for a mile. Nobody from the tower has to go. The Freeholds will spend the winter fencing fields they kept.',
              },
              {
                id: 'volunteers',
                label:
                  'You swore not to spend the Watch cheaply. Ask for volunteers.',
                requires: { flags: ['oath-of-care'] },
                // Kindness costs the walls (playtest act4 R1).
                effects: {
                  affinity: { freeholds: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d31-watch-volunteers'],
                  questAid: [VOLUNTEERS_AT_FORD],
                },
                response:
                  'Dunmark repeats your oath to the yard. Thirty-one step forward, the youngest first. He sends four back to the walls without a word. That night the youngest recruit stands the east wall alone. He is fifteen.',
              },
              {
                id: 'porters',
                label:
                  'March the Watch. Put the Yard’s porters on the walls tonight.',
                effects: {
                  affinity: { freeholds: 5 },
                  local: { 'gate-watch': -1, yard: -3 },
                  flags: ['d31-porters-on-walls'],
                  questAid: [WATCH_AT_FORD],
                },
                response:
                  'By dusk porters in flour-white aprons line the walls, kitchen spits for pikes. Foreman Ash walks the line twice. He does not speak to the throne for a week.',
              },
            ],
          },
        ],
      },
      D31_SEED_CORN,
    ],
  },
  {
    day: 32,
    title: 'A Name in the Ledger',
    briefings: [
      {
        id: 'archive-late',
        source: 'The Lamplight Archive',
        text: 'The Archive’s lamps burned until dawn. The Keeper has asked for an audience.',
        truth: true,
      },
      {
        id: 'ledger-audited',
        source: 'Young Komodo’s runner',
        text: 'The crown’s accounts were checked last month and every page is in order.',
        truth: false,
        komodoLie: true,
        hindsight:
          'Nobody checked the crown’s accounts last month. He kept them himself. The page that did not add up was in his hand.',
      },
      {
        id: 'oil-shortage',
        source: 'The Yard',
        text: 'The Yard is short of lamp oil, though the oil bills are higher than ever.',
        truth: true,
      },
    ],
    komodo:
      'Every ledger has a page that does not add up, Your Majesty. Most are mine, and most of those are rounding. Let the Keeper have his audience.',
    quests: [],
    audiences: [
      {
        id: 'd32-ledger-page',
        title: 'A Name in the Ledger',
        speaker: 'Keeper Abelard Vellum of the Lamplight Archive',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        lines: [
          'Keeper Vellum lays a single page on the arm of the throne and smooths it flat. It takes most of a minute. Nobody hurries him. It only makes him slower.',
          '“Lamp oil, Majesty. Enough this year to light the Saltroad end to end. All of it went up the mission road. The Abbey uses candles.”',
          '“The entries are in a careful hand. The court’s own. I have not matched it. You should decide whether I do.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Eleven clerks keep the court’s hand, Keeper, and I keep the clerks. I can have each one write the word oil by supper. Left hand and right, if you like.',
          },
          'The Keeper blinks at him once, slowly. For Keeper Vellum, that is a speech.',
        ],
        options: [
          {
            id: 'ask-oil',
            label: 'Ask the Keeper what that much oil could be for.',
            effects: {},
            response:
              'Vellum thinks about it until a page in the gallery yawns and gets elbowed.',
            next: 'oil',
          },
          {
            id: 'match',
            label: 'Match the hand, quietly.',
            effects: { local: { lamplight: 2 }, flags: ['ledger-page-kept'] },
            response:
              'Vellum nods once. “Quietly is the only speed I have, Majesty.” The page goes into his sleeve.',
          },
          {
            id: 'hollin',
            label: 'Ask Hollin to read it tonight.',
            requires: { follower: 'F019' },
            effects: {
              local: { lamplight: 3 },
              flags: ['ledger-page-kept', 'ledger-hand-studied'],
            },
            response:
              'Hollin turns the page under the lamp until midnight. “Left-handed,” Hollin says. “Taps the pen twice before every number, the way some people tap a claw.”',
          },
          {
            id: 'komodo',
            label: 'Give the page to Young Komodo to explain.',
            effects: {
              local: { lamplight: -2 },
              flags: ['ledger-page-to-komodo'],
            },
            response:
              'Komodo reads it and laughs. “A clerk who can’t tell oil from wax, Your Majesty. I’ll have it corrected.” He tucks the page into his ledger.',
          },
          {
            id: 'burn',
            label: 'Burn it. The court cannot afford a scandal now.',
            effects: {
              local: { ledger: 2, lamplight: -3 },
              flags: ['ledger-page-burned'],
            },
            response:
              'Vellum watches the page curl in the brazier. “The Archive remembers what it burns, Majesty. It is a terrible habit.”',
          },
        ],
        beats: [
          {
            id: 'oil',
            lines: [
              '“Light, Majesty. A great deal of it, a long time, somewhere dark. A cellar. A road nobody walks by day. A room meant to look empty.”',
              '“And the Yard has run short. The Foreman says that never happened in his lifetime. So the oil is not here, and not in the chapel. It is somewhere in between, burning.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Or a clerk wrote oil for wax, Your Majesty, and the Abbey’s candles came out of the crown’s charity. I approved it myself. So would you have.',
              },
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'My ovens have been dark two nights, Majesty. Whatever it was, it was not wax.',
              },
            ],
            options: [
              {
                id: 'match',
                label: 'Match the hand quietly. Tell no one.',
                effects: {
                  local: { lamplight: 2 },
                  flags: ['ledger-page-kept'],
                },
                response:
                  'Vellum nods once. “Quietly is the only speed I have, Majesty.” The page goes into his sleeve. The Foreman goes back to his dark ovens.',
              },
              {
                id: 'hollin',
                label: 'Ask Hollin to read the hand tonight.',
                requires: { follower: 'F019' },
                effects: {
                  local: { lamplight: 3 },
                  flags: ['ledger-page-kept', 'ledger-hand-studied'],
                },
                response:
                  'Hollin turns the page under the lamp until midnight. “Left-handed,” Hollin says. “Taps the pen twice before every number, the way some people tap a claw.”',
              },
              {
                id: 'komodo',
                label: 'Let Young Komodo take the page and correct his clerk.',
                effects: {
                  local: { lamplight: -2 },
                  flags: ['ledger-page-to-komodo'],
                },
                response:
                  '“Thank you, Your Majesty.” Komodo folds the page once, precisely, into his ledger. Vellum watches it go like a farmer watching a hawk take a chick.',
              },
              {
                id: 'burn',
                label: 'Burn it. A war is no time for a scandal.',
                effects: {
                  local: { ledger: 2, lamplight: -3 },
                  flags: ['ledger-page-burned'],
                },
                response:
                  'Vellum watches the page curl in the brazier. “The Archive remembers what it burns, Majesty. It is a terrible habit.” Foreman Ash remembers too.',
              },
              {
                id: 'count-barrels',
                label:
                  'Send the Yard up the mission road to count the crown’s barrels.',
                effects: {
                  affinity: { abbey: -5 },
                  local: { yard: 2 },
                  flags: ['d32-barrels-counted'],
                },
                response:
                  'Ash takes six porters and a tally stick. After dark they bring back a number: forty barrels behind the Abbey woodshed, empty, scrubbed. Sister Marrow gave them lemonade and asked after the emperor’s health.',
              },
              {
                id: 'same-hand',
                label:
                  'Ask if this is the hand that wrote the false morning reports.',
                requires: { flags: ['false-reports-traced'] },
                effects: {
                  local: { lamplight: 2 },
                  flags: ['ledger-page-kept', 'd32-same-careful-hand'],
                },
                response:
                  'Vellum is quiet a long time. “I hoped you wouldn’t ask, Majesty. I think I know. I have not proved it.” Across the hall Komodo laughs at something a clerk said, a beat after everyone else.',
              },
            ],
          },
        ],
      },
      {
        id: 'd32-reform-list',
        title: 'The Reform List',
        speaker: 'Lumen Shale, organizer of the Mole assembly',
        faction: 'moles',
        requires: { standing: MOLE_REFORMS_OPEN },
        lines: [
          'A reform organiser climbs the hall steps with a speaking trumpet made from a funnel and a sash stitched all over with names. She does not use the trumpet. The hall goes quiet anyway.',
          '“Lumen Shale. I organize for the assembly. Granny Umber says the crown has done two honest things. The assembly says two is luck. Three is a habit.”',
          '“This is the list. Three reforms. A council seat for the burrows in this hall. The crown’s tax ledger nailed to the gate where anyone can read it. And the sedition law burned. The one you can hang a singer with.”',
          '“Grant one and we keep talking. Grant two and I work for you. Grant none and I go home and tell them the truth. That’s worse.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Councils, by all means, Your Majesty. Burn the law if you like. But a ledger on the gate is an open drawer. Thieves can read too.',
          },
        ],
        options: [
          {
            id: 'ask-split',
            label: 'Ask whether the whole assembly wants this list.',
            effects: {},
            response:
              'Lumen looks at the trumpet in her paw for a moment. Then she puts it down.',
            next: 'split',
          },
          {
            id: 'councils',
            label:
              'Grant the council seat. A burrow delegate sits in this hall.',
            effects: {
              affinity: { moles: 10 },
              local: { 'old-houses': -3 },
              flags: ['d32-reform-councils'],
            },
            response:
              'Lumen writes it on the list in front of everyone. Lady Vask’s chair scrapes. Lumen looks up and waits.',
            next: 'second',
          },
          {
            id: 'ledger',
            label: 'Nail the crown’s ledger to the gate.',
            effects: {
              affinity: { moles: 5 },
              local: { ledger: -2, lamplight: 2 },
              flags: ['d32-reform-ledger'],
            },
            response:
              'Lumen writes it down. Young Komodo closes his own ledger. Gently. He holds it against his chest.',
            next: 'second',
          },
          {
            id: 'sedition',
            label: 'Burn the sedition law. Today.',
            effects: {
              affinity: { moles: 5 },
              local: { 'gate-watch': -2, yard: 1 },
              flags: ['d32-reform-sedition'],
            },
            response:
              'A clerk brings the law up from the Archive. It is four pages. It burns fast. Captain Dunmark watches it go and says nothing.',
            next: 'second',
          },
          {
            id: 'refuse',
            label: 'Grant nothing. The crown does not govern by list.',
            effects: {
              affinity: { moles: -10 },
              local: { 'old-houses': 2 },
              flags: ['d32-reforms-refused'],
            },
            response:
              'Lumen folds the list into her sash. “Then I’ll read them your answer,” she says. “Word for word. They’ll like that you were clear.”',
          },
        ],
        beats: [
          {
            id: 'split',
            lines: [
              '“No. Coal Harrow’s sappers think a list is what cowards bring instead of powder. Half the young ones listen to him. They’re not wrong that powder is faster.”',
              '“If you say no to me, you say yes to him. I want you to know that before you choose. I’m not threatening. I’m counting.”',
            ],
            options: [
              {
                id: 'councils',
                label: 'Grant the council seat. Give the young ones a chair.',
                effects: {
                  affinity: { moles: 10 },
                  local: { 'old-houses': -3 },
                  flags: ['d32-reform-councils'],
                },
                response:
                  'Lumen writes it on the list. Lady Vask’s chair scrapes. Lumen waits.',
                next: 'second',
              },
              {
                id: 'ledger',
                label: 'Nail the crown’s ledger to the gate.',
                effects: {
                  affinity: { moles: 5 },
                  local: { ledger: -2, lamplight: 2 },
                  flags: ['d32-reform-ledger'],
                },
                response:
                  'Lumen writes it down. Young Komodo closes his own ledger and holds it against his chest.',
                next: 'second',
              },
              {
                id: 'sedition',
                label: 'Burn the sedition law.',
                effects: {
                  affinity: { moles: 5 },
                  local: { 'gate-watch': -2, yard: 1 },
                  flags: ['d32-reform-sedition'],
                },
                response:
                  'The law is four pages. It burns fast. Captain Dunmark watches it go.',
                next: 'second',
              },
              {
                id: 'seat-coal',
                label:
                  'Give the council seat to Coal Harrow, not to her. Bring the powder inside the tent.',
                effects: {
                  affinity: { moles: 5 },
                  local: { 'gate-watch': -1, 'old-houses': -2 },
                  flags: ['d32-reform-councils', 'd32-coal-seated'],
                },
                response:
                  'Lumen is quiet for a long time. “Smart,” she says at last. “I hate it.” She writes his name on the list herself, in a neat hand, and leaves without asking for anything else.',
              },
              {
                id: 'refuse',
                label: 'Grant nothing. Let Coal Harrow do his counting too.',
                effects: {
                  affinity: { moles: -10 },
                  local: { 'old-houses': 2 },
                  flags: ['d32-reforms-refused'],
                },
                response:
                  'Lumen folds the list into her sash. That night a keg goes off in an empty Old House granary. Nobody is hurt. Nobody is meant to be, yet.',
              },
            ],
          },
          {
            id: 'second',
            lines: [
              'Lumen holds up the list. One line is written in. Two are not.',
              '“One is a start. Two is a promise. I said what two gets you.”',
            ],
            options: [
              {
                id: 'second-councils',
                label: 'The council seat as well.',
                requires: { notFlags: ['d32-reform-councils'] },
                effects: {
                  affinity: { moles: 10 },
                  local: { 'old-houses': -3 },
                  flags: ['d32-reform-councils', 'd32-reforms-two'],
                  recruitable: ['F010'],
                },
                response:
                  'Two lines. Lumen rolls up the list and ties it with a thread from her sash. “I’ll need a bunk,” she says. “Near the door. I get up early.”',
              },
              {
                id: 'second-ledger',
                label: 'The ledger on the gate as well.',
                requires: { notFlags: ['d32-reform-ledger'] },
                effects: {
                  affinity: { moles: 5 },
                  local: { ledger: -2, lamplight: 2 },
                  flags: ['d32-reform-ledger', 'd32-reforms-two'],
                  recruitable: ['F010'],
                },
                response:
                  'Two lines. Lumen ties the list with a thread from her sash. “I’ll need a bunk near the door,” she says. Young Komodo is already writing a note to the Ledger.',
              },
              {
                id: 'second-sedition',
                label: 'Burn the sedition law as well.',
                requires: { notFlags: ['d32-reform-sedition'] },
                effects: {
                  affinity: { moles: 5 },
                  local: { 'gate-watch': -2, yard: 1 },
                  flags: ['d32-reform-sedition', 'd32-reforms-two'],
                  recruitable: ['F010'],
                },
                response:
                  'The law burns in four pages. Lumen ties the list with a thread from her sash. “I’ll need a bunk near the door,” she says. “I get up early.”',
              },
              {
                id: 'one',
                label: 'One. That is what the crown can carry today.',
                effects: { flags: ['d32-one-reform'] },
                response:
                  'Lumen folds the list. “One is a start,” she says. “I’ll tell them it was a start.” She does not say what two would have been.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 33,
    title: 'Wolves at Noon',
    briefings: [
      {
        id: 'riders-thistledown',
        source: 'Thistledown',
        text: 'Plum riders are watching the Thistledown fields from the ridge.',
        truth: true,
        variants: [
          {
            flags: ['d10-thistledown-told-to-pay'],
            text: 'Plum riders are watching the Thistledown fields from the ridge. Thistledown has stopped asking the crown for anything.',
          },
        ],
      },
      {
        id: 'riders-waystation',
        source: 'A Saltroad drover',
        text: 'More riders are circling the waystation on the salt flats.',
        truth: true,
      },
      {
        id: 'one-band',
        source: 'A Gate Watch scout',
        text: 'It is one band of riders, and it can only strike one place.',
        truth: false,
      },
    ],
    komodo:
      'Two bands, Your Majesty, both at noon, when farmers are in the fields. Someone has studied us. Choose what the crown can afford to lose.',
    quests: ['q-d33-thistledown', 'q-d33-waystation'],
    audiences: [
      {
        id: 'd33-both-roads',
        title: 'Both Roads',
        speaker: 'Hester Plowright of the Border Freeholds',
        npc: 'hester-plowright',
        faction: 'freeholds',
        lines: [
          'Hester Plowright, in a mud-heavy skirt, marches up to the throne, egg basket and all. No curtsey. Her reeve’s chain is crooked. She dressed on the horse.',
          '“The Saltroad has guards and money and a hundred wagons. Thistledown has me and my sister and the goats. You know who needs you more, Majesty. Say it out loud.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'There is a Saltroad drover in the gallery, too polite to speak. I mention it so nobody can say afterwards he was not here.',
          },
        ],
        options: [
          {
            id: 'ask-noon',
            label: 'Ask Hester how the riders knew to strike at noon.',
            effects: {},
            response:
              'Hester blinks. People ask her for answers, never questions. She puts the basket down.',
            next: 'studied',
          },
          {
            id: 'thistledown',
            label: 'Promise Thistledown the crown’s best.',
            effects: {
              affinity: { freeholds: 10, saltroad: -5 },
              flags: ['promised-thistledown'],
            },
            response:
              'Hester nods hard. “Before noon,” she says. “Not a minute after.”',
          },
          {
            id: 'saltroad',
            label:
              'Choose the Saltroad. Its stock feeds the kingdom this winter.',
            effects: {
              affinity: { freeholds: -10, saltroad: 5 },
              local: { ledger: 1 },
              flags: ['promised-waystation'],
            },
            response:
              'Hester picks up her basket. “Then I hope the kingdom enjoys its winter.” She leaves.',
          },
          {
            id: 'watch',
            label:
              'Send the Gate Watch to Thistledown and the court to the Saltroad.',
            requires: { local: { 'gate-watch': 12 } },
            effects: {
              affinity: { freeholds: 5 },
              strength: { freeholds: 1 },
              local: { 'gate-watch': -3 },
              flags: ['d33-watch-to-thistledown'],
              questAid: [WATCH_AT_THISTLEDOWN],
            },
            response:
              'Dunmark groans in the doorway and goes to find his boots. Hester looks almost satisfied.',
          },
          {
            id: 'not-twice',
            label:
              'Thistledown burned once while the crown watched. Promise Hester it will not burn twice.',
            requires: { flags: ['thistledown-burned'] },
            effects: {
              affinity: { freeholds: 10, saltroad: -10 },
              local: { 'gate-watch': -1 },
              flags: ['d33-not-twice'],
            },
            response:
              'Hester’s chin comes up. “I was there the first time. I counted the barns. I’ll count them again tomorrow and write you the number.” In the gallery the Saltroad drover gets up and leaves.',
          },
        ],
        beats: [
          {
            id: 'studied',
            lines: [
              '“Noon is when Thistledown eats. Always has. Anybody who sat at our table knows it, and we’ve fed half the kingdom there. Some of your court too.”',
              '“So they know. Now you know. The riders are still on the ridge. Knowing doesn’t move them.”',
              {
                who: 'A Saltroad drover',
                text: 'Begging the reeve’s pardon. The waystation isn’t a warehouse, Majesty. Forty drovers’ families winter in the salt-house. They don’t have goats. They have us, and we have the stock, and the stock is how they eat till spring.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Both true, Your Majesty. That is the trouble with true things. They never share.',
              },
            ],
            options: [
              {
                id: 'thistledown',
                label: 'Promise Thistledown the crown’s best. Say it out loud.',
                effects: {
                  affinity: { freeholds: 10, saltroad: -5 },
                  flags: ['promised-thistledown'],
                },
                response:
                  'Hester nods hard. “Before noon. Not a minute after.” The drover sits down and looks at his hands.',
              },
              {
                id: 'saltroad',
                label:
                  'The salt-house first. Forty families outweigh one village.',
                effects: {
                  affinity: { freeholds: -10, saltroad: 5 },
                  local: { ledger: 1 },
                  flags: ['promised-waystation'],
                },
                response:
                  'Hester picks up her basket. “Forty families. Thistledown is ninety. But we only have the one road, so I suppose we don’t count.” She leaves without bowing.',
              },
              {
                id: 'watch',
                label:
                  'Send the Gate Watch to Thistledown and the court to the Saltroad.',
                requires: { local: { 'gate-watch': 12 } },
                effects: {
                  affinity: { freeholds: 5 },
                  strength: { freeholds: 1 },
                  local: { 'gate-watch': -3 },
                  flags: ['d33-watch-to-thistledown'],
                  questAid: [WATCH_AT_THISTLEDOWN],
                },
                response:
                  'Dunmark groans in the doorway and goes to find his boots. Hester looks almost satisfied. The drover nearly smiles.',
              },
              {
                id: 'salt-house',
                label:
                  'Bring the drovers’ families into the outer court. The stock takes its chances.',
                requires: { cost: 20 },
                effects: {
                  affinity: { saltroad: 10, freeholds: -5 },
                  local: { yard: -2, 'old-houses': -1 },
                  flags: ['d33-drovers-sheltered'],
                },
                response:
                  'By nightfall forty families sleep in the outer court on salt-sacks. Ash counts the bowls twice. Lady Vask complains of the smell. Hester is gone before anyone asks her opinion.',
              },
              {
                id: 'night-fields',
                label:
                  'Thistledown works its fields by night. Send the crown’s best to the salt flats.',
                effects: {
                  affinity: { freeholds: -5, saltroad: 5 },
                  local: { ledger: 1 },
                  flags: ['d33-fields-by-night'],
                },
                response:
                  'Hester stares at you. “By night. With what lamps? Your Yard can’t find a drop of oil.” Thistledown brings in its harvest by starlight, and by the riders’ fires on the ridge.',
              },
            ],
          },
        ],
      },
      {
        id: 'd33-sappers',
        title: 'Three Sappers in the Fen',
        speaker: 'Sister Reedlight of the Mire Mothers',
        npc: 'sister-reedlight',
        faction: 'mire-mothers',
        lines: [
          'Sister Reedlight comes in with fen mud to the hem and a lantern that burns without oil. Three young moles walk ahead of her, tied wrist to wrist with green reed. Nobody at court has seen reed hold a knot like that.',
          '“Your war is loud, so I will be quick. These three were under the Mirefen last night with picks and a keg. Digging a drain. Coal Harrow’s orders, they say. They say it proudly.”',
          '“The fen has its own law for people who come to empty it. I came to ask if the crown would rather judge them first. I am being polite.”',
          {
            who: 'Granny Umber',
            npc: 'granny-umber',
            text: 'The assembly never voted for this. Coal digs where he likes. That’s the trouble with teaching people to dig.',
          },
          'Granny Umber has come in behind them on her cane. She does not look at the three. The youngest keeps looking at her.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The fen’s law has no appeal, Your Majesty. Take them. The crown’s cells at least have a door.',
          },
        ],
        options: [
          {
            id: 'ask-fen',
            label:
              'Ask what the fen’s law does to people who come to empty it.',
            effects: {},
            response:
              'Reedlight lifts the lantern a little, so you can see her face.',
            next: 'fen-law',
          },
          {
            id: 'to-fen',
            label: 'Give them to the fen. They came to drown it.',
            effects: {
              affinity: { 'mire-mothers': 15, moles: -15 },
              flags: ['d33-sappers-to-fen'],
            },
            response:
              'Reedlight bows. The three go out with her, still tied. The youngest looks back at Granny Umber. She does not look up. That night the fen lanterns burn late.',
          },
          {
            id: 'cells',
            label: 'The crown’s cells. A trial when the war allows.',
            effects: {
              affinity: { 'mire-mothers': 5, moles: -5 },
              local: { 'gate-watch': 1 },
              flags: ['d33-sappers-jailed'],
            },
            response:
              'The Watch cuts the reed and puts on iron. The iron is easier to see. Reedlight nods as if the crown has paid half a debt, and goes.',
          },
          {
            id: 'free',
            label: 'Cut them loose. The fen is not the crown’s to defend.',
            effects: {
              affinity: { moles: 10, 'mire-mothers': -15 },
              flags: ['d33-sappers-freed'],
            },
            response:
              'You cut the reed yourself. It is harder than it looks. Reedlight watches the knife the whole time. “Then the fen will defend itself,” she says. She says it like weather.',
          },
          {
            id: 'ask-umber',
            label: 'Ask Granny Umber what the burrows will give for them.',
            effects: {},
            response:
              'Granny Umber leans on the cane with both paws. For a while that is her whole answer.',
            next: 'umber',
          },
          {
            id: 'weir-repaid',
            label:
              'Admit the crown lent Coal powder for her weir. Pay the fen for it, and send the three home.',
            requires: { cost: 30, flags: ['d21-weir-blown'] },
            effects: {
              affinity: { 'mire-mothers': 10 },
              local: { ledger: -1 },
              flags: ['d33-weir-repaid', 'd33-sappers-freed'],
            },
            response:
              'Reedlight counts the brass twice. Then she cuts the reed with one finger. “The crown taught them,” she says. “Now the crown pays tuition.” The three go home with Granny Umber, in step.',
          },
          {
            id: 'name-in-book',
            label:
              'Remind her whose name is in the fen’s book. Ask for the three as a favour to that name.',
            requires: { flags: ['d27-name-in-fen-book'] },
            effects: {
              affinity: { moles: 10, 'mire-mothers': -5 },
              flags: ['d33-name-called-in', 'd33-sappers-freed'],
            },
            response:
              'Reedlight smiles for the first time. “The book remembers you,” she says. “It will remember this.” The reed falls off the three on its own. Nobody saw her touch it.',
          },
        ],
        beats: [
          {
            id: 'fen-law',
            speaker: 'Sister Reedlight of the Mire Mothers',
            npc: 'sister-reedlight',
            lines: [
              '“Nothing you would call cruel. We give them to the water for a night. Most come up in the morning. They are quieter after. They do not dig again.”',
              {
                who: 'Granny Umber',
                npc: 'granny-umber',
                text: 'Most.',
              },
              'Reedlight does not answer that. The lantern does not flicker.',
            ],
            options: [
              {
                id: 'cells',
                label: 'Not the water. The crown’s cells, and a trial.',
                effects: {
                  affinity: { 'mire-mothers': 5, moles: -5 },
                  local: { 'gate-watch': 1 },
                  flags: ['d33-sappers-jailed'],
                },
                response:
                  'The Watch cuts the reed and puts on iron. Reedlight looks at the iron a long time. “Yours is slower,” she says.',
              },
              {
                id: 'to-fen',
                label: 'Most is enough. Give them to the fen.',
                effects: {
                  affinity: { 'mire-mothers': 15, moles: -15 },
                  flags: ['d33-sappers-to-fen'],
                },
                response:
                  'The three go out tied. Granny Umber stays on the step until the hall is empty. Then she goes home the long way, past the fen.',
              },
              {
                id: 'free',
                label: 'Cut them loose. Nobody goes in the water tonight.',
                effects: {
                  affinity: { moles: 10, 'mire-mothers': -15 },
                  flags: ['d33-sappers-freed'],
                },
                response:
                  'You cut the reed yourself. “Then the fen will defend itself,” Reedlight says. She says it like weather.',
              },
              {
                id: 'ask-umber',
                label: 'Turn to Granny Umber. Ask what the burrows will give.',
                effects: {},
                response: 'Granny Umber has been waiting for someone to ask.',
                next: 'umber',
              },
            ],
          },
          {
            id: 'umber',
            speaker: 'Granny Umber of the Mole Revolutionaries',
            npc: 'granny-umber',
            lines: [
              '“I hated the Mothers before your grandmother was born, young ruler. I hate them now. That isn’t the question.”',
              '“Send the three home and I’ll stand up in the assembly tonight and say Coal Harrow does not speak for the burrows. Out loud. He’ll hear it by morning. Half the young ones will walk out behind him.”',
              '“He’s my sister’s boy. Write that down somewhere. Then forget it.”',
            ],
            options: [
              {
                id: 'disown',
                label:
                  'Send the three home. The burrows disown Coal Harrow, out loud.',
                // The burrows split for it (playtest act4 #5: no free win-win).
                effects: {
                  affinity: { moles: 5, 'mire-mothers': 5 },
                  strength: { moles: -1 },
                  flags: ['d33-coal-disowned', 'd33-sappers-freed'],
                },
                response:
                  'She says it in the assembly that night. Her voice does not shake. Her paw on the cane does. Forty of the young ones walk out behind Coal. In the morning Reedlight’s reed is found on the gate step, cut, in a neat coil.',
              },
              {
                id: 'to-fen',
                label: 'No. The fen’s law. Coal can hear about that instead.',
                effects: {
                  affinity: { 'mire-mothers': 15, moles: -15 },
                  flags: ['d33-sappers-to-fen'],
                },
                response:
                  'Granny Umber says nothing at all. She walks out ahead of the three so she does not have to watch them tied.',
              },
              {
                id: 'cells',
                label: 'Neither her nephew nor the fen. The crown’s cells.',
                effects: {
                  affinity: { 'mire-mothers': 5, moles: -5 },
                  local: { 'gate-watch': 1 },
                  flags: ['d33-sappers-jailed'],
                },
                response:
                  'Iron instead of reed. Granny Umber nods once. “Slower,” she says. “I’ll take slower.”',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 34,
    title: 'A Storm Crow Debt',
    briefings: [
      {
        id: 'crows-gather',
        source: 'The Heights',
        text: 'Every Storm Crow roost has emptied toward the tower overnight.',
        truth: true,
      },
      {
        id: 'covenant-due',
        source: 'Elder Corvane’s herald',
        text: 'The rain covenant falls due at noon today.',
        truth: true,
        variants: [
          {
            // A covenant paid in runners comes due as a person (t-036).
            flags: ['covenant-paid-in-runners'],
            notFlags: ['d20-runners-term-fixed'],
            source: 'The gate sergeant',
            text: 'A runner in a Conclave sash sat on the gate step all night in the rain. She has not knocked. The covenant falls due today, and it has sent a face.',
          },
          {
            notFlags: ['crow-debt-called'],
            source: 'The gate sergeant',
            text: 'Elder Corvane’s herald passed the gate at dawn and did not stop. The crown owes the Conclave nothing today.',
          },
        ],
      },
      {
        id: 'covenant-forgiven',
        source: 'A hopeful farmer',
        text: 'The Crows will forgive the rain debt because of the war.',
        truth: false,
      },
    ],
    komodo:
      'Crows forgive nothing, Your Majesty. I admire that most about them. Whatever was promised for the rain, they have come to collect.',
    komodoVariants: [
      {
        flags: ['covenant-paid-in-runners'],
        notFlags: ['d20-runners-term-fixed'],
        text: 'The Crows sent no bill, Your Majesty. They sent the girl. That is the bill.',
      },
      {
        notFlags: ['crow-debt-called'],
        text: 'The Crows are on every sill and want nothing, Your Majesty. They want us to watch them want nothing. That is how they say a debt is closed.',
      },
    ],
    quests: [],
    audiences: [
      {
        id: 'd34-crow-debt',
        title: 'A Storm Crow Debt',
        speaker: 'Elder Corvane of the Storm Crows',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        // Only a covenant still held, or broken, is owed (t-040).
        requires: { flags: ['crow-debt-called'] },
        lines: [
          'Elder Corvane perches on the back of the empty petitioners’ bench and folds his wings like a shut umbrella. A Conclave lookout sits on every windowsill. Every Conclave watcher faces the throne.',
          '“The rain was lent, Majesty. The fields drank it. Now the rain is owed. We do not take back rain, so we take something else.”',
          '“Brass, if you have it. Hands, if you do not. Any shape of debt will do, so long as it is paid in full, in daylight.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Crows keep two ledgers, Your Majesty: what is owed, and who was late. Do not get into the second one. Nobody gets out.',
          },
        ],
        options: [
          {
            id: 'ask-else',
            label: 'Ask what “something else” means.',
            effects: {},
            response:
              'Corvane’s copper chimes stir. There is no wind in the hall.',
            next: 'something-else',
          },
          {
            id: 'tamsin',
            label: 'Let Tamsin Gutterwing answer him.',
            requires: { follower: 'F011' },
            effects: {},
            response:
              'Tamsin steps out from behind the throne before you finish her name. She has waited eleven years.',
            next: 'tamsin-answers',
          },
          {
            id: 'brass',
            label: 'Pay the debt in brass.',
            requires: { cost: 60 },
            effects: {
              affinity: { 'storm-crows': 10 },
              flags: ['crow-debt-paid'],
            },
            response:
              'Corvane counts every coin twice. Then he nods. “Clean. We like clean.”',
          },
          {
            id: 'runners',
            label: 'Lend the Crows runners for the season.',
            effects: {
              affinity: { 'storm-crows': 15 },
              local: { yard: -3 },
              flags: ['crow-debt-paid', 'runners-lent'],
            },
            response:
              'The Yard sends six of its fastest. Corvane looks them over like fruit at market. “These will do.”',
          },
          {
            id: 'favor',
            label: 'Call in the favor the Crows owe the crown.',
            requires: { flags: ['crow-favor-owed'] },
            effects: {
              affinity: { 'storm-crows': -5 },
              clearFlags: ['crow-favor-owed'],
              flags: ['crow-debt-paid'],
            },
            response:
              'Corvane’s feathers lift and settle. “Paid with our own coin,” he says. “Clever. We will remember clever.”',
          },
          {
            id: 'refuse',
            label: 'The crown is at war. The debt will wait.',
            effects: {
              affinity: { 'storm-crows': -20 },
              strength: { 'storm-crows': 1 },
              flags: ['crow-debt-defaulted'],
            },
            response:
              'Corvane rises without a word. That night every Conclave watcher on the Heights faces the tower. None of them sleep. By morning the roosts are armed. Crows keep spite the way farmers keep seed.',
          },
        ],
        beats: [
          {
            id: 'something-else',
            lines: [
              '“Runners, as before. Young ones, quick ones. Six for a season. We feed them well.”',
              '“Or water. Rain lent is water owed. Sign the Ford’s water rights to the Conclave for a generation. The debt is clean, and nobody climbs the Heights.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The Moles have wanted the Ford’s water since the midnight choir, Your Majesty. The Freeholds have drunk it since before there was a crown. Corvane knows that.',
              },
              'Corvane does not deny it. He waits, the way weather waits.',
            ],
            options: [
              {
                id: 'brass',
                label: 'Pay in brass, and let nobody climb the Heights.',
                requires: { cost: 60 },
                effects: {
                  affinity: { 'storm-crows': 10 },
                  flags: ['crow-debt-paid'],
                },
                response:
                  'Corvane counts every coin twice, then nods. “Clean.” The treasury is lighter by a war’s worth of arrows.',
              },
              {
                id: 'runners',
                label: 'Send six runners from the Yard. Children of the tower.',
                effects: {
                  affinity: { 'storm-crows': 15 },
                  local: { yard: -3 },
                  flags: ['crow-debt-paid', 'runners-lent'],
                },
                response:
                  'The Yard sends six of its fastest. Corvane picks the youngest first. Their mothers stand in the gate until the last is out of sight.',
              },
              {
                id: 'favor',
                label: 'Neither. Call in the favor the Crows owe the crown.',
                requires: { flags: ['crow-favor-owed'] },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  clearFlags: ['crow-favor-owed'],
                  flags: ['crow-debt-paid'],
                },
                response:
                  'Corvane’s feathers lift and settle. “Paid with our own coin. Clever. We will remember clever.” The lookout on the nearest sill turns its back on the throne.',
              },
              {
                id: 'refuse',
                label: 'Neither water nor children. The debt will wait.',
                effects: {
                  affinity: { 'storm-crows': -20 },
                  strength: { 'storm-crows': 1 },
                  flags: ['crow-debt-defaulted'],
                },
                response:
                  'Corvane rises without a word. That night every Conclave watcher on the Heights faces the tower. By morning the roosts are armed. You do not sleep much either.',
              },
              {
                id: 'ford-rights',
                label: 'Sign the Ford’s water rights over to the Conclave.',
                effects: {
                  affinity: { 'storm-crows': 15, freeholds: -10, moles: -5 },
                  flags: ['d34-ford-water-signed'],
                },
                response:
                  'Corvane signs with an inked claw. By evening a Conclave watchkeeper sits on every sluice gate along the Ford. Freehold farmers learn to ask politely for their own water.',
              },
            ],
          },
          {
            id: 'tamsin-answers',
            speaker: 'Tamsin Gutterwing',
            npc: 'F011',
            lines: [
              '“Six runners for a season. They said that about me, Majesty. I was seven. I ran for the Conclave eleven seasons.”',
              '“You don’t run messages. You run whatever is in the bag. You don’t look in the bag. You come back without it, you don’t come back.”',
              {
                who: 'Elder Corvane',
                npc: 'elder-corvane',
                text: 'And you ran well, little runner. Very well. That is why we remember your name.',
              },
              '“They remember all our names. That is the whole trouble with them.”',
            ],
            options: [
              {
                id: 'brass',
                label: 'Pay in brass. Not one runner climbs the Heights.',
                requires: { cost: 60 },
                effects: {
                  affinity: { 'storm-crows': 10 },
                  flags: ['crow-debt-paid'],
                },
                response:
                  'Corvane counts every coin twice. “Clean.” Then, to Tamsin: “You bought them dear, little runner.” “Not me,” says Tamsin. “The crown.”',
              },
              {
                id: 'refuse',
                label: 'The crown is at war, and the debt will wait.',
                effects: {
                  affinity: { 'storm-crows': -20 },
                  strength: { 'storm-crows': 1 },
                  flags: ['crow-debt-defaulted'],
                },
                response:
                  'Corvane rises without a word. Tamsin watches the Conclave sentries leave the sills one by one. “They’ll arm the roosts tonight,” she says. “Then they’ll come back for it. They always do.”',
              },
              {
                id: 'wages',
                label:
                  'Lend runners on Tamsin’s terms: wages, their names on every bag, home by first frost. Corvane will call it half paid.',
                requires: { cost: 20 },
                effects: {
                  affinity: { 'storm-crows': 5 },
                  local: { yard: 1 },
                  flags: ['d34-runners-on-wages'],
                },
                response:
                  'Corvane looks at Tamsin a long time. “Wages,” he says, like the word tastes of tin. “Once. The debt stays in the second book until the frost.” Tamsin does not smile. Her tail loosens.',
              },
            ],
          },
        ],
      },
      {
        id: 'd34-outer-court',
        title: 'Militia in the Outer Court',
        speaker: 'A Freehold militia sergeant',
        faction: 'freeholds',
        requires: { flags: ['ford-lost'] },
        lines: [
          'The Freehold militia has camped in the outer court since the Ford fell. Their sergeant, an old ram with a bandaged eye, brings his company up the carpet. Smoke, wet wool, wounds that need cleaning.',
          '“We lost the Ford, Majesty. Thirty-one of us came back. Two days on the Yard’s bread, and the Foreman has started counting it at us.”',
          '“Arm us and we’ll go take it back. Or we go home, what’s left of it. Or we stay, and the Yard keeps counting.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'The Yard has bread for the tower, Majesty. Not for the tower and a war.',
          },
        ],
        options: [
          {
            id: 'feed',
            label: 'Keep feeding them. The crown lost the Ford beside them.',
            requires: { cost: 20 },
            effects: {
              affinity: { freeholds: 10 },
              local: { yard: -2 },
              flags: ['d34-militia-fed'],
            },
            response:
              'The sergeant salutes with the hand that still works. Foreman Ash bakes until midnight, the oven doors slamming one at a time.',
          },
          {
            id: 'arm',
            label:
              'Arm them from the tower’s stores. Send them back to the Ford.',
            effects: {
              affinity: { freeholds: 5 },
              local: { 'gate-watch': -2 },
              flags: ['d34-militia-rearmed'],
            },
            response:
              'They march at dawn with the Watch’s spare spears and helmets. Dunmark stands in the armoury doorway, looking at the empty racks.',
          },
          {
            id: 'home',
            label: 'Send them home. The outer court is not a camp.',
            effects: {
              affinity: { freeholds: -10 },
              local: { yard: 2, 'gate-watch': 1 },
              flags: ['d34-militia-sent-home'],
            },
            response:
              'They go quietly, which is worse. By evening the outer court is swept and empty. Someone has scratched the Ford’s name into the gatepost at a child’s height.',
          },
          {
            id: 'stay-on-gate',
            label:
              'Quarter them in the Yard. They stand the gate beside the Watch.',
            effects: {
              affinity: { freeholds: 5 },
              local: { yard: -3, 'gate-watch': 1 },
              flags: ['d34-militia-on-gate'],
            },
            response:
              'The sergeant salutes with the hand that still works. That night there are rams on the gate. Foreman Ash counts thirty-one more bowls and says nothing about it, loudly.',
          },
          {
            id: 'water-first',
            label:
              'Tell them the truth first: the Ford’s water belongs to the Crows now.',
            requires: { flags: ['d34-ford-water-signed'] },
            effects: {
              affinity: { freeholds: -5 },
              local: { yard: 1 },
              flags: ['d34-militia-told-water'],
            },
            response:
              'The sergeant looks at the windows. A Conclave sentry sits on every sill. “Then what are we taking back,” he says. It is not a question. They go home by the long road, so they will not pass a sluice.',
          },
        ],
      },
      D34_RUNNER_AT_GATE,
    ],
  },
  {
    day: 35,
    title: 'Two Bridges',
    briefings: [
      {
        id: 'routes-cut',
        source: 'The map room',
        text: 'The war has cut every road south except two: the canyon trestle and the Mole tunnel.',
        truth: true,
        variants: [
          {
            flags: ['d26-brick-tunnel-mapped'],
            text: 'The war has cut every road south except two: the canyon trestle and the Mole tunnel. Keel’s survey of the brick tunnel is pinned beside the map.',
          },
        ],
      },
      {
        id: 'riders-moving',
        source: 'Jackalwire outriders',
        text: 'Plum riders are moving on both routes at once.',
        truth: true,
      },
      {
        id: 'both-hold',
        source: 'A Saltroad factor',
        text: 'The court has enough people to hold both routes for a week.',
        truth: false,
      },
    ],
    komodo:
      'Two roads, Your Majesty, and the court can hold one. Whichever survives is the road you will use later. Hold the one you would want to run down in the dark.',
    quests: [],
    audiences: [
      {
        id: 'd35-two-bridges',
        title: 'Two Bridges',
        speaker: 'Granny Umber of the Mole Revolutionaries',
        npc: 'granny-umber',
        faction: 'moles',
        lines: [
          'Granny Umber taps her pipe-cane on the throne room floor, checking for hollows. Mud from both ends of her tunnel is on her boots. She has not wiped them.',
          '“Saffron’s trestle or my tunnel, Majesty. Not both. The trestle is quicker. The tunnel is hidden. One will still be there when you need a way out. One won’t.”',
          '“Saffron Kett welded that trestle. My grandmother dug that tunnel. You’ll break somebody’s heart today, young ruler. Break it on purpose.”',
        ],
        options: [
          {
            id: 'trestle',
            label: 'Hold the trestle.',
            effects: {
              affinity: { jackalwire: 5, moles: -5 },
              flags: ['route-trestle'],
            },
            response:
              'Granny Umber sighs through her star of a nose. “Quick roads. Everybody wants the quick roads.”',
            postsQuests: ['q-d35-trestle'],
          },
          {
            id: 'tunnel',
            label: 'Hold the tunnel.',
            effects: {
              affinity: { moles: 10, jackalwire: -5 },
              flags: ['route-tunnel'],
            },
            response:
              '“Good,” says Granny Umber. “Bring a lamp, and do not sneeze near the props.”',
            postsQuests: ['q-d35-tunnel'],
          },
          {
            id: 'saffron',
            label: 'Let Saffron Kett choose.',
            requires: { follower: 'F002' },
            effects: {
              affinity: { jackalwire: 10, moles: -5 },
              flags: ['route-trestle', 'saffron-chose-route'],
            },
            response:
              'Saffron does not hesitate. “The trestle. I know every weld in it, and which ones hold.” Granny Umber shrugs. She draws her elbows in close. “The crown let its welder choose,” she says. “I’ll tell my grandmother’s bones.”',
            postsQuests: ['q-d35-trestle'],
          },
          {
            id: 'ask-way-out',
            label: 'Ask her what she means by a way out.',
            effects: {},
            response:
              'Granny Umber peers at you over her spectacles. Then, for the first time, she sits down on the step of the dais.',
            next: 'way-out',
          },
        ],
        beats: [
          {
            id: 'way-out',
            lines: [
              '“I’ve watched three crowns go, young ruler. Not at the start of a war. At the end, when everybody is tired and somebody close to the throne decides they know better.”',
              '“When yours goes, and I hope it won’t, you’ll want a road nobody at this court has walked. Everybody knows the trestle. Only Moles know the tunnel. Now you.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Granny Umber is kind to plan your escape, Your Majesty. I thought that was my job. Take the trestle. A tunnel has two ends, and someone is always standing at one of them.',
              },
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: 'Whichever you choose, Majesty, the Watch would rather nobody at court knew which. A road stays secret until somebody writes it down.',
              },
            ],
            options: [
              {
                id: 'trestle',
                label: 'Hold the trestle. Quick roads save lives too.',
                effects: {
                  affinity: { jackalwire: 5, moles: -5 },
                  flags: ['route-trestle'],
                },
                response:
                  'Granny Umber sighs through her star of a nose. “Quick roads. Everybody wants them, and everybody knows where they go.”',
                postsQuests: ['q-d35-trestle'],
              },
              {
                id: 'tunnel',
                label: 'Hold the tunnel. The road nobody knows.',
                effects: {
                  affinity: { moles: 10, jackalwire: -5 },
                  flags: ['route-tunnel'],
                },
                response:
                  '“Good,” says Granny Umber, rising one joint at a time. “Bring a lamp. Don’t sneeze near the props.” Komodo writes something down. Then he crosses it out.',
                postsQuests: ['q-d35-tunnel'],
              },
              {
                id: 'saffron',
                label: 'Let Saffron Kett choose. It is her bridge.',
                requires: { follower: 'F002' },
                effects: {
                  affinity: { jackalwire: 10, moles: -5 },
                  flags: ['route-trestle', 'saffron-chose-route'],
                },
                response:
                  'Saffron does not hesitate. “The trestle. I know every weld in it.” Granny Umber shrugs, mostly elbows. “Then I hope you never need to leave in a hurry.”',
                postsQuests: ['q-d35-trestle'],
              },
              {
                id: 'secret-tunnel',
                label:
                  'Hold the tunnel. Let the court believe you chose the trestle. Your advisor too.',
                // A lie told in the Pack's name costs more than an honest no.
                effects: {
                  affinity: { moles: 10, jackalwire: -10 },
                  flags: ['route-tunnel', 'd35-tunnel-secret'],
                },
                response:
                  'You say “the trestle” aloud for the hall, and Komodo writes it down. The Pack hears by supper that the crown chose their bridge. By the end of the week they hear the rest. At the postern Granny Umber presses a lump of tunnel chalk into your hand. “Now forget where it goes.”',
                postsQuests: ['q-d35-tunnel'],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 36,
    title: 'The Silent Bell Rehearsal',
    briefings: [
      {
        id: 'rehearsal-tonight',
        source: 'A pilgrim on the mission road',
        text: 'The Abbey holds a rehearsal tonight, and every sister will be in the chapel.',
        truth: true,
      },
      {
        id: 'bell-clapper',
        source: 'Sister Marrow',
        text: 'The Abbey has finally found its bell’s lost clapper.',
        truth: false,
      },
      {
        id: 'cellar-door',
        source: 'Brother Teodor’s old letters',
        text: 'There is a cellar under the chapel that the sisters never mention.',
        truth: true,
        variants: [
          {
            flags: ['d22-token-stamp-copied'],
            text: 'There is a cellar under the chapel that the sisters never mention. Its door is burned with the mark Ash copied from the Ford tokens.',
          },
        ],
      },
    ],
    komodo:
      'A rehearsal for a bell that cannot ring, Your Majesty. I would not go. I would not send anyone I liked. But I am a coward about cellars, and you are the emperor.',
    quests: ['q-d36-bell-rehearsal'],
    audiences: [
      {
        id: 'd36-invitation',
        title: 'An Invitation',
        speaker: 'Sister Marrow of the Abbey of the Silent Bell',
        npc: 'sister-marrow',
        faction: 'abbey',
        lines: [
          'An Abbey emissary in grey brings a card sealed with candle wax. She crosses the hall without a sound and stops exactly where petitioners are meant to stop. Nobody ever does.',
          '“The Abbess would be honoured if the emperor attended tonight’s rehearsal. There is a seat at the front. There is always a seat at the front.”',
          '“The children have practised for weeks. Such sweet voices. They sing toward the floor, the way the Abbess taught them, so the floor will learn the tune.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'A seat at the front is a great honour, Your Majesty. It is also the seat furthest from the door.',
          },
        ],
        options: [
          {
            id: 'ask-performance',
            label: 'Ask what the rehearsal is rehearsing for.',
            effects: {},
            response:
              'Sister Marrow’s smile does not change. It is a good smile. It has had practice.',
            next: 'performance',
          },
          {
            id: 'teodor',
            label: 'Let Brother Teodor answer his old sister.',
            requires: { follower: 'F012' },
            effects: {},
            response:
              'Teodor comes forward with his hands folded in his sleeves, the way the Abbey taught him. Then he unfolds them.',
            next: 'teodor',
          },
          {
            id: 'accept',
            label: 'Accept, and sit at the front.',
            effects: { affinity: { abbey: 10 }, flags: ['rehearsal-attended'] },
            response:
              'Sister Marrow smiles. The room gets too warm. “She will be so glad.”',
          },
          {
            id: 'decline',
            label: 'Decline, with thanks. The war keeps the emperor home.',
            effects: { affinity: { abbey: -5 } },
            response:
              '“Of course,” says Sister Marrow. “Another time. There will be other rehearsals, until there is a performance.”',
          },
          {
            id: 'evidence',
            label:
              'Show her the tracks on the mission road. Ask where they lead.',
            requires: { flags: ['mission-road-tracks'] },
            effects: {
              affinity: { abbey: -10, freeholds: 5 },
              flags: ['abbey-confronted'],
            },
            response:
              'Sister Marrow studies the drawing of the small footprints. “They lead to lessons, Majesty.” Her voice does not change.',
          },
          {
            id: 'coldbrook',
            label: 'Ask if the Coldbrook children will sing tonight.',
            requires: { flags: ['abbey-took-coldbrook-children'] },
            effects: {
              affinity: { abbey: -5, freeholds: 5 },
              flags: ['d36-coldbrook-asked'],
            },
            response:
              '“All of them,” says Sister Marrow. “Such sweet voices.” She tilts her head. “Their mother may visit, of course, once they are settled.” Word for word what she said on the eighth day.',
          },
        ],
        beats: [
          {
            id: 'performance',
            lines: [
              '“For the performance, Majesty. There is always a performance, in the end. The bell will ring, and everyone ever kind to the Abbey will hear it.”',
              '“The bell has no clapper,” says someone in the gallery. Sister Marrow smiles at the voice until it stops.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'If the emperor is busy with the war tonight, Sister, I could sit at the front in the crown’s place. Cellars frighten me. Chapels I can manage.',
              },
              '“Oh, would you?” says Sister Marrow. For the first time she sounds pleased.',
            ],
            options: [
              {
                id: 'accept',
                label:
                  'Accept for yourself. The emperor will sit at the front.',
                effects: {
                  affinity: { abbey: 10 },
                  flags: ['rehearsal-attended'],
                },
                response:
                  'Sister Marrow smiles. The room gets too warm. “She will be so glad.” Komodo looks at the floor, listening for a tune.',
              },
              {
                id: 'decline',
                label: 'Decline. Nobody from this court sits at the front.',
                effects: { affinity: { abbey: -5 } },
                response:
                  '“Of course,” says Sister Marrow. “Another time.” She leaves the card on the step. Nobody picks it up until evening.',
              },
              {
                id: 'evidence',
                label:
                  'Show her the mission road tracks. Ask if the children walk them to lessons.',
                requires: { flags: ['mission-road-tracks'] },
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  flags: ['abbey-confronted'],
                },
                response:
                  'Sister Marrow studies the drawing of the small footprints. “They lead to lessons, Majesty.” Her voice does not change. Komodo withdraws his offer to attend.',
              },
              {
                id: 'send-komodo',
                label:
                  'Send Young Komodo to the rehearsal in the crown’s place.',
                effects: {
                  affinity: { abbey: 5 },
                  flags: ['d36-komodo-at-rehearsal'],
                },
                response:
                  '“I will take notes,” says Komodo. He goes up the mission road at dusk and comes back after midnight smelling of candle wax. His notes are thorough. They say nothing.',
              },
              {
                id: 'decoy',
                label:
                  'Sit at the front, so every sister watches you, not the cellar stair.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { lamplight: 1 },
                  flags: ['rehearsal-attended', 'd36-emperor-decoy'],
                  questAid: [EMPEROR_AT_FRONT],
                },
                response:
                  'Three hours at the front while a choir of children sings toward the floor. The Abbess holds your hand. Her hand is warm. You do not let go first. That would be noticed.',
              },
            ],
          },
          {
            id: 'teodor',
            speaker: 'Brother Teodor Lull',
            npc: 'F012',
            lines: [
              '“Sister Marrow. You have grown taller, or I have grown rounder. Both, I expect.”',
              {
                who: 'Sister Marrow',
                npc: 'sister-marrow',
                text: 'Brother Teodor. We pray for you every evening. The Abbess keeps your letters in a box by her bed and reads them when she cannot sleep.',
              },
              'Teodor turns his broad, mild face to the throne. “I served soup in that chapel six years, Majesty. The rehearsal is not for the bell. Don’t sit at the front.”',
              {
                who: 'Sister Marrow',
                npc: 'sister-marrow',
                text: 'Brother Teodor was always so imaginative. We love his letters.',
              },
            ],
            options: [
              {
                id: 'accept',
                label: 'Accept anyway. The emperor will not be frightened off.',
                effects: {
                  affinity: { abbey: 10 },
                  flags: ['rehearsal-attended'],
                },
                response:
                  'Sister Marrow smiles. The room gets too warm. “She will be so glad.” Teodor shuts his eyes until she is gone.',
              },
              {
                id: 'decline',
                label: 'Decline for the whole court. Nobody sits at the front.',
                effects: { affinity: { abbey: -5 } },
                response:
                  'Teodor lets out a breath he has held six years. “Of course,” says Sister Marrow. “Another time.”',
              },
              {
                id: 'teodor-goes',
                label:
                  'Send Teodor in the emperor’s place. Keep the sisters’ eyes on the front row.',
                // He may not come back from her (betrayal.ts CALLED_HOME).
                effects: {
                  affinity: { abbey: 5 },
                  flags: ['d36-teodor-at-rehearsal'],
                  questAid: [TEODOR_SINGS_FLAT],
                },
                response:
                  'Teodor nods. “I’ll sing flat on purpose. It is the one thing in that chapel they cannot bear.” Then, lower: “She will ask me to stay, Majesty. Six years she asked. I don’t know what I’ll say this time.” At the door Sister Marrow takes his arm, the way you hold someone who might run.',
              },
            ],
          },
        ],
      },
      D36_POSTERN_LADDER,
    ],
  },
  {
    day: 37,
    title: 'The Market That Closed',
    briefings: [
      {
        id: 'stalls-shut',
        source: 'The market court',
        text: 'Half the Ledger’s stalls did not open this morning.',
        truth: true,
      },
      {
        id: 'ledger-abbey',
        source: 'Young Komodo’s runner',
        text: 'The Ledger has never lent a single coin to the Abbey.',
        truth: false,
        komodoLie: true,
        hindsight:
          'The Ledger had lent to the Abbey all year. Every note crossed his desk first.',
      },
      {
        id: 'loans-called',
        source: 'Factor Tallow’s clerk',
        text: 'The Ledger is calling in its loans across the kingdom.',
        truth: true,
      },
    ],
    komodo:
      'Merchants shut their stalls when they smell the end of something, Your Majesty. Usually it is credit. Factor Tallow will want paying, or a promise better than payment.',
    quests: [],
    audiences: [
      {
        id: 'd37-market-closed',
        title: 'The Market That Closed',
        speaker: 'Factor Marisol Tallow of the Ledger',
        npc: 'marisol-tallow',
        faction: 'ledger',
        lines: [
          'Factor Tallow taps a clipboard against her palm, fast, a small brass clock. The market court behind her is half shuttered, stallholders in their doorways with arms folded.',
          '“The Ledger does not lend into a war it can’t price, Majesty. Pay down the crown’s debt, or give me something worth more than brass. Then the stalls open.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Ledger has priced worse wars, Factor. It is not the war that frightens you. It is not knowing who pays afterwards.',
          },
          'Tallow does not look at him. “Your advisor is clever, Majesty. He is nearly always right about prices.”',
        ],
        options: [
          {
            id: 'ask-books',
            label: 'Ask the Factor who else owes the Ledger.',
            effects: {},
            response:
              'The clipboard stops tapping. Nobody has ever paid Tallow to answer that.',
            next: 'books',
          },
          {
            id: 'pay',
            label: 'Pay down the crown’s debt.',
            requires: { cost: 50 },
            effects: {
              local: { ledger: 4 },
              clearFlags: ['ledger-crisis'],
              flags: ['ledger-paid'],
            },
            response:
              'Tallow counts the brass without looking at it. That is how you know she is good. “Tomorrow. Early.”',
          },
          {
            id: 'monopoly',
            label: 'Give the Ledger the Saltroad salt licence.',
            effects: {
              local: { ledger: 3 },
              affinity: { saltroad: -15 },
              flags: ['ledger-monopoly'],
            },
            response:
              'Tallow’s whiskers twitch. “Now that is worth more than brass.” Somewhere on the Saltroad, Oriel Saltmarsh will be furious by supper.',
          },
          {
            id: 'rustline',
            label: 'Buy from the Rustline salvagers instead.',
            requires: { affinity: { rustline: 'neutral' } },
            effects: {
              local: { ledger: -3 },
              affinity: { rustline: 15 },
              flags: ['rustline-market'],
            },
            response:
              'Tallow laughs out loud. By evening the empty stalls are full of magpies selling bolts, glass and engine parts at prices nobody can follow.',
          },
          {
            id: 'refuse',
            label: 'The crown will not be priced by merchants.',
            effects: { local: { ledger: -5 }, flags: ['ledger-closed'] },
            response:
              '“Then the crown can shop elsewhere.” Tallow leaves her clipboard so you can see the sums.',
          },
        ],
        beats: [
          {
            id: 'books',
            lines: [
              '“Everyone owes the Ledger, Majesty. The Saltroad. The Old Houses. Hollow Bell, twice over. The Abbey.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The Abbey has never borrowed a coin from the Ledger, Factor. They are a charity. Nobody lends to a charity.',
              },
              'Tallow’s pen stops a hair above the page. “As your advisor says.” She writes nothing. “I keep my clients’ confidences, Majesty. It is most of what I sell.”',
              'She lets that lie between you exactly until Komodo starts talking about grain.',
            ],
            options: [
              {
                id: 'pay',
                label: 'Pay down the debt in brass. Keep it simple.',
                requires: { cost: 50 },
                effects: {
                  local: { ledger: 4 },
                  clearFlags: ['ledger-crisis'],
                  flags: ['ledger-paid'],
                },
                response:
                  'Tallow counts the brass without looking. “Tomorrow. Early.” At the door she stops, on the edge of saying more about the Abbey. She doesn’t.',
              },
              {
                id: 'monopoly',
                label: 'Give the Ledger the Saltroad salt licence.',
                effects: {
                  local: { ledger: 3 },
                  affinity: { saltroad: -15 },
                  flags: ['ledger-monopoly'],
                },
                response:
                  'Tallow’s whiskers twitch. “Now that is worth more than brass.” Somewhere on the Saltroad, Oriel Saltmarsh will be furious by supper.',
              },
              {
                id: 'rustline',
                label: 'Let the Rustline fill the empty stalls instead.',
                requires: { affinity: { rustline: 'neutral' } },
                effects: {
                  local: { ledger: -3 },
                  affinity: { rustline: 15 },
                  flags: ['rustline-market'],
                },
                response:
                  'Tallow laughs out loud. By evening the empty stalls are full of magpies selling bolts, glass and engine parts at prices nobody can follow.',
              },
              {
                id: 'refuse',
                label:
                  'The crown will not be priced by merchants, or by hints.',
                effects: { local: { ledger: -5 }, flags: ['ledger-closed'] },
                response:
                  '“Then the crown can shop elsewhere.” Tallow leaves her clipboard so you can see the sums. One line is scratched out so hard the pen went through.',
              },
              {
                id: 'read-debts',
                label:
                  'Read the Ledger’s book of the crown’s debts, every line, here.',
                effects: {
                  local: { ledger: -2, lamplight: 2 },
                  flags: ['d37-crown-debts-read'],
                },
                response:
                  'Tallow hands it over like a knife, blade first. Nine pages. Page six is lamp oil, on credit, delivered up the mission road. A careful hand. Two small dots before every number, where the pen tapped first.',
              },
              {
                id: 'houses',
                label: 'Let the Old Houses stand surety for the crown’s debt.',
                effects: {
                  local: { ledger: 2, 'old-houses': 3, yard: -2 },
                  flags: ['d37-houses-surety'],
                },
                response:
                  'Lady Vask signs without reading it, which means she read it last night. “The Old Houses are glad to help the crown. And to be remembered for it.” Young Komodo countersigns as witness. His sevens are very proud. The Yard hears by supper.',
              },
            ],
          },
        ],
      },
      {
        id: 'd37-dark-yard',
        title: 'The Dark Yard',
        speaker: 'Foreman Dunmore Ash of the Yard',
        npc: 'dunmore-ash',
        faction: 'yard',
        requires: { flags: ['ledger-page-burned'] },
        lines: [
          'Foreman Ash comes up the carpet with a cold lamp in each hand and sets them on the step of the dais. One. Two.',
          '“The ovens are out, Majesty. The lamps are out. The Yard has baked by candle five nights, and it is the Abbey that sells the candles.”',
          '“Keeper Vellum says somebody bought oil in the crown’s name, and none of it came here. He says the page that proved it went into your brazier.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'A clerical error, Foreman. An embarrassing one. The crown chose not to shame a good clerk in a hard season. So would I.',
          },
        ],
        options: [
          {
            id: 'truth',
            label:
              'Tell him the truth: the crown burned the page to avoid a scandal.',
            effects: {
              local: { yard: 2, 'old-houses': -2 },
              flags: ['d37-burn-admitted'],
            },
            response:
              'Ash looks at you a long time. “Thank you for saying it. The Yard can work in the dark. It doesn’t like being lied to in it.” He leaves the lamps.',
          },
          {
            id: 'oil',
            label: 'Buy the Yard a winter’s oil from the Saltroad.',
            requires: { cost: 25 },
            effects: {
              local: { yard: 3 },
              affinity: { saltroad: 5 },
              flags: ['d37-yard-oil-bought'],
            },
            response:
              'The barrels come up the road by evening. The Yard lights every lamp it owns. Ash lights the last one himself, then stands under it. “Thank you for the oil,” he says. “You didn’t answer me.”',
          },
          {
            id: 'silence',
            label: 'The crown does not answer to the Yard for its paperwork.',
            effects: {
              local: { yard: -3, 'old-houses': 2 },
              flags: ['d37-yard-silenced'],
            },
            response:
              'Ash picks up his lamps. In the gallery one of the Old Houses murmurs “quite right.” Ash hears it. By nightfall so does the whole Yard.',
          },
          {
            id: 'truth-and-oil',
            label:
              'Tell him the truth about the brazier, and buy the oil as well.',
            requires: { cost: 25 },
            effects: {
              local: { yard: 4, 'old-houses': -2 },
              affinity: { saltroad: 5 },
              flags: ['d37-burn-admitted', 'd37-yard-oil-bought'],
            },
            response:
              'You tell him in front of the gallery. Lady Vask leaves before you finish. The barrels come up the road by evening, and Ash lights the ovens first, the lamps after. “Both,” he says. “I didn’t think you had both in you.”',
          },
        ],
      },
      {
        // The war's enemy at the table (playtest act4 #5): every price the
        // Verge names is paid by someone else, and the peace keeps the Verge
        // from bidding for the tower (betrayal.ts VERGE_PEACE).
        id: 'd37-verge-terms',
        title: 'Terms in White Gloves',
        speaker: 'The Envoy of the Black Verge',
        npc: 'the-verge-envoy',
        faction: 'black-verge',
        lines: [
          'The Envoy of the Black Verge walks the carpet at the pace of a funeral. White gloves. A servant follows with a plum pennant folded small and a stool nobody unfolds.',
          '“The Court is tired of the Ford, Majesty. So are the riders. We would like to stop. The Court does not stop for nothing.”',
          '“Three prices. Choose one and the riders go home before the frost.”',
          '“The far fields at the Ford, past the river. The Freeholds plant this bank. We plant that one.”',
          '“Or forty brass. Riders paid to stop must ride somewhere. We suggest the salt flats. The Saltroad has guards.”',
          '“Or a guest of rank, to winter with the Court. Kept warm. Returned in spring.”',
          {
            who: 'Captain Ferro Dunmark',
            npc: 'ferro-dunmark',
            text: 'Every one of those is a price somebody else pays, Majesty. That’s how you know it’s the Verge.',
          },
        ],
        options: [
          {
            id: 'fields',
            label:
              'Cede the far fields. The Freeholds keep this bank, and their lives.',
            effects: {
              affinity: { 'black-verge': 15, freeholds: -10 },
              strength: { freeholds: -1 },
              flags: ['d37-verge-peace', 'd37-far-fields-ceded'],
            },
            response:
              'The envoy draws the new line on your map with one gloved finger. It is very straight. By the week’s end the far-bank farmers come over the Ford with their doors on carts. They stack the doors against your gate.',
          },
          {
            id: 'salt-flats',
            label: 'Pay the forty. Let the riders find the salt flats.',
            requires: { cost: 40 },
            effects: {
              affinity: { 'black-verge': 10, saltroad: -10 },
              strength: { saltroad: -1 },
              flags: ['d37-verge-peace', 'd37-war-sent-south'],
            },
            response:
              'The envoy takes the purse between two fingers. Three nights later the waystation road is lit by burning wagons. Oriel Saltmarsh sends back the crown’s last letter unopened.',
          },
          {
            id: 'vask-son',
            label: 'Send a guest of rank: Lady Vask’s second son.',
            effects: {
              affinity: { 'black-verge': 10 },
              local: { 'old-houses': -3 },
              flags: ['d37-verge-peace', 'd37-vask-son-sent'],
            },
            response:
              '“Corwin is nineteen,” Lady Vask says. That is all she says. The boy walks down the carpet in his good coat and climbs into the plum carriage. His mother watches from the gallery until the dust settles. Then she watches the throne.',
          },
          {
            id: 'refuse',
            label:
              'No price. The crown does not buy peace from people who burn farms.',
            effects: {
              affinity: { 'black-verge': -10, freeholds: 5 },
              flags: ['d37-verge-refused'],
            },
            response:
              'The envoy removes one glove, finger by finger. “The Court keeps a short list, Majesty. Everyone on it is sorry.” That night the riders light their fires one field closer.',
          },
          {
            id: 'ask-warm',
            label: 'Ask what the Court does with the guests it keeps warm.',
            effects: { affinity: { 'black-verge': -5 } },
            response:
              'The envoy’s smile stops short of the eyes. “You may ask, Majesty. You are paying for the answer.”',
            next: 'warm',
          },
          {
            id: 'sable',
            label: 'Give them Sable. The Court asked for Sable once already.',
            requires: {
              follower: 'F016',
              notFlags: ['sable-not-traded', 'sable-chose-to-stay'],
            },
            effects: {
              affinity: { 'black-verge': 15 },
              flags: ['d37-verge-peace', 'd37-sable-returned'],
              dismiss: [
                {
                  follower: 'F016',
                  reason:
                    'Sable went back to the Verge in the envoy’s carriage, the price of the Ford.',
                },
              ],
            },
            response:
              'Sable hears it from the doorway. They take off one glove and fold it into your hand. “Good arithmetic,” they say. They do not look back from the carriage. The glove stays cold all day. Then it is only a glove.',
          },
        ],
        beats: [
          {
            id: 'warm',
            lines: [
              '“Fields feed people. People are warm. The Court is cold, Majesty. It has been cold a long time.”',
              '“Our guests give a little warmth. A cup a month. They eat very well. Most stay after spring. We do not ask why.”',
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: 'The riders don’t burn the farmhouses, Majesty. I always wondered. They burn the barns and leave the houses standing.',
              },
              '“Houses are where the people are,” says the envoy. “Why would anyone burn those?”',
            ],
            options: [
              {
                id: 'fields',
                label: 'Cede the far fields anyway. Peace is peace.',
                effects: {
                  affinity: { 'black-verge': 15, freeholds: -10 },
                  strength: { freeholds: -1 },
                  flags: ['d37-verge-peace', 'd37-far-fields-ceded'],
                },
                response:
                  'The envoy draws the line on your map with one gloved finger. The far-bank farmers come over the Ford with their doors on carts. Some of the houses on that bank keep their doors. Their lamps stay lit all winter.',
              },
              {
                id: 'salt-flats',
                label: 'Pay the forty. The Saltroad has guards.',
                requires: { cost: 40 },
                effects: {
                  affinity: { 'black-verge': 10, saltroad: -10 },
                  strength: { saltroad: -1 },
                  flags: ['d37-verge-peace', 'd37-war-sent-south'],
                },
                response:
                  'The envoy takes the purse between two fingers. Three nights later the waystation road is lit by burning wagons. The drovers’ houses are left standing. Empty.',
              },
              {
                id: 'vask-son',
                label: 'Send Lady Vask’s second son. He will be well fed.',
                effects: {
                  affinity: { 'black-verge': 10 },
                  local: { 'old-houses': -3 },
                  flags: ['d37-verge-peace', 'd37-vask-son-sent'],
                },
                response:
                  '“Corwin is nineteen,” Lady Vask says. That is all she says. She heard the envoy. So did he. He climbs into the plum carriage anyway, because she does not tell him not to.',
              },
              {
                id: 'warn-freeholds',
                label:
                  'Send the envoy home and write Hester what the riders want her farms for.',
                effects: {
                  affinity: { 'black-verge': -15, freeholds: 10 },
                  flags: ['d37-verge-refused', 'd37-freeholds-warned'],
                },
                response:
                  'You write it yourself. Within the week every Freehold house has a bar on the door and a dog behind it. The envoy leaves one glove on the step. The servant comes back for it after dark.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 38,
    title: 'A Pardon for a Thief',
    briefings: [
      {
        id: 'satchel-grain',
        source: 'Young Komodo’s runner',
        text: 'The satchel was full of stolen grain. A Yard matter. Nothing for the throne.',
        truth: false,
        komodoLie: true,
        hindsight:
          'There was no grain. The letters were his, going up the mission road twice a week. He wanted the boy alone before the boy said a name.',
      },
      {
        id: 'mole-caught',
        source: 'The Gate Watch',
        text: 'A young courier was caught leaving the tower before dawn with a satchel.',
        truth: true,
        variants: [
          {
            flags: ['mole-messenger-arrested'],
            text: 'A young courier was caught leaving the tower before dawn with a satchel. He has Granny Umber’s squint.',
          },
        ],
      },
      {
        id: 'satchel-letters',
        source: 'Captain Dunmark',
        text: 'The satchel held sealed letters, with the seals already broken and pressed back.',
        truth: true,
      },
    ],
    komodo:
      'My runner says grain, Your Majesty. The Captain says letters. Either way, thieves carry for somebody important. Let me talk to him. I am very good with frightened people.',
    quests: [],
    audiences: [
      {
        id: 'd38-pardon',
        title: 'A Pardon for a Thief',
        speaker: 'Captain Ferro Dunmark and a jailed courier',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'Dunmark brings in a young burrow courier in chains. Sixteen, no more. He has been crying and stopped, and wiped his face on his chains. There is rust on his cheek.',
          '“I didn’t steal them. I carry them,” the prisoner says. “Up the mission road at night, twice a week, for a year. I know who gives them to me. Pardon me and I’ll say the name.”',
          'The court has turned out for a thief, which it never does. Clerks on the gallery rail. Lady Vask with her fan. Young Komodo at the foot of the dais with the morning’s papers.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Let me talk to him, Your Majesty. I am good with frightened people. They can tell I am frightened too.',
          },
        ],
        options: [
          {
            id: 'ask-letters',
            label: 'Ask Dunmark what was in the letters.',
            effects: {},
            response:
              'Dunmark empties the satchel onto the step. Every seal lifted with a warm knife and pressed back. Practised work.',
            next: 'letters',
          },
          {
            id: 'gran',
            label:
              'He has Granny Umber’s squint. Ask if the crown arrested his grandmother.',
            requires: { flags: ['mole-messenger-arrested'] },
            effects: {},
            response:
              '“You did,” the boy says, to the floor. “Gran says you’ll be fair. She says that about everybody, the first time.” Dunmark empties the satchel.',
            next: 'letters',
          },
          {
            id: 'lumen',
            label: 'Let Lumen Shale read the room while he talks.',
            requires: { follower: 'F010' },
            effects: {},
            response:
              'Lumen stands beside the throne and says nothing for a while. That is how she does it.',
            next: 'lumen',
          },
          {
            id: 'pardon',
            label: 'Pardon him, and hear the name.',
            effects: {
              affinity: { moles: 10 },
              local: { 'gate-watch': -3 },
              flags: ['prisoner-pardoned'],
            },
            response:
              'The prisoner whispers: “The one with the ledger. Under his arm, always.” Then he is out the gate. Half the court carries a ledger.',
          },
          {
            id: 'keep',
            label: 'He stays in the cells until he talks for free.',
            effects: {
              affinity: { moles: -10 },
              local: { 'gate-watch': 3 },
              flags: ['prisoner-kept'],
            },
            response:
              'The prisoner goes back down the stairs. In the morning his cell is empty. The lock has not been forced.',
          },
          {
            id: 'komodo',
            label: 'Let Young Komodo question him.',
            effects: { flags: ['prisoner-to-komodo'] },
            response:
              'Komodo takes the boy gently by the elbow and talks to him all the way down the stairs. By evening, with real regret, he reports the prisoner escaped.',
          },
        ],
        beats: [
          {
            id: 'letters',
            lines: [
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: 'Shipping lists, Majesty. Grain counts. And Watch rosters. Which gate, which night, how many on the wall. My rosters, copied fair by a better hand than mine.',
              },
              '“I can’t read, Majesty,” the boy says. “I just carry. Up the mission road and back. They give me supper at the top.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Rosters go to the Freehold posts every week, Captain. That is what rosters are for. It would be stranger if nobody carried them.',
              },
              '“Not up the mission road, they don’t,” says Dunmark.',
            ],
            options: [
              {
                id: 'pardon',
                label: 'Pardon him, and hear the name.',
                effects: {
                  affinity: { moles: 10 },
                  local: { 'gate-watch': -3 },
                  flags: ['prisoner-pardoned'],
                },
                response:
                  'The prisoner whispers: “The one with the ledger. Under his arm, always.” Then he is out the gate. Half the court carries a ledger. You count them anyway.',
              },
              {
                id: 'keep',
                label: 'He stays in the cells until he talks for free.',
                effects: {
                  affinity: { moles: -10 },
                  local: { 'gate-watch': 3 },
                  flags: ['prisoner-kept'],
                },
                response:
                  'The prisoner goes back down the stairs. In the morning his cell is empty. The lock has not been forced.',
              },
              {
                id: 'komodo',
                label: 'Let Young Komodo question him, gently.',
                effects: { flags: ['prisoner-to-komodo'] },
                response:
                  'Komodo takes the boy gently by the elbow and talks to him all the way down the stairs. By evening, with real regret, he reports the prisoner escaped. The rosters have gone with him.',
              },
              {
                id: 'name-in-court',
                label:
                  'Pardon him, but only once he says the name before the whole court.',
                effects: {
                  affinity: { moles: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d38-named-in-court'],
                },
                response:
                  'The boy looks up at the gallery, at all the ledgers and coats. “I don’t know his name,” he whispers. “He has brass buttons.” Factor Tallow lays a hand over her waistcoat. So do several others. The court spends the evening looking at buttons.',
              },
              {
                id: 'rosters',
                label:
                  'Rewrite every watch roster tonight. Tell no one the new ones.',
                effects: {
                  local: { 'gate-watch': 2, ledger: -1 },
                  flags: ['d38-rosters-changed'],
                },
                response:
                  'Dunmark rewrites the rosters himself, by candle. Near midnight Komodo looks into the guardroom and asks for a copy “for the ledger.” Dunmark says the ink is still wet.',
              },
            ],
          },
          {
            id: 'lumen',
            speaker: 'Lumen Shale',
            npc: 'F010',
            lines: [
              'Lumen stands up straight beside the throne, the way her people do at a burrow mouth. She watches the room, not the boy.',
              '“He isn’t lying, Majesty. He isn’t afraid of the Watch. He’s afraid of somebody behind you, and he’s trying hard not to look at them.”',
              '“Clear the hall and he’ll talk. Keep it full and he’ll say whatever keeps him alive.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A great many people stand behind you, Your Majesty. That is where a court stands.',
              },
            ],
            options: [
              {
                id: 'pardon',
                label:
                  'Pardon him here, in front of everyone, and hear the name.',
                effects: {
                  affinity: { moles: 10 },
                  local: { 'gate-watch': -3 },
                  flags: ['prisoner-pardoned'],
                },
                response:
                  'The prisoner whispers: “The one with the ledger. Under his arm, always.” Then he is out the gate. Lumen watches the whole court at once. She does not say who flinched.',
              },
              {
                id: 'keep',
                label: 'He stays in the cells until he talks for free.',
                effects: {
                  affinity: { moles: -10 },
                  local: { 'gate-watch': 3 },
                  flags: ['prisoner-kept'],
                },
                response:
                  'The prisoner goes back down. “Somebody will come for him tonight,” Lumen says. In the morning his cell is empty. The lock has not been forced.',
              },
              {
                id: 'komodo',
                label: 'Let Young Komodo question him.',
                effects: { flags: ['prisoner-to-komodo'] },
                response:
                  'Komodo takes the boy gently by the elbow. Lumen watches the boy’s face all the way to the stairs. By evening, with real regret, Komodo reports the prisoner escaped.',
              },
              {
                id: 'clear-hall',
                label: 'Clear the hall. Everyone out, the advisor too.',
                effects: { flags: ['d38-hall-cleared'] },
                response:
                  'Komodo goes last, with a bow and a small rueful smile. The doors close on his claw tapping the ledger. Once.',
                next: 'alone',
              },
            ],
          },
          {
            id: 'alone',
            lines: [
              'With the hall empty the boy talks to the floor, fast, all at once.',
              '“He’s kind. He bought me boots. He said the letters keep people safe. He said one day a great many people would be kept safe all at once, and I’d be glad I helped.”',
              '“He has a ledger, under his arm, always. He taps it when he’s thinking. Like this.” The boy taps two fingers on his chain. Once. Twice. Then he sees your face, and stops.',
            ],
            options: [
              {
                id: 'pardon',
                label: 'Pardon him, and let him go alone.',
                effects: {
                  affinity: { moles: 10 },
                  local: { 'gate-watch': -3 },
                  flags: ['prisoner-pardoned'],
                },
                response:
                  'You unlock the chains yourself. The boy is out the postern before Dunmark can find him a coat. He does not look back.',
              },
              {
                id: 'keep',
                label:
                  'He stays in the cells, where the crown can find him again.',
                effects: {
                  affinity: { moles: -10 },
                  local: { 'gate-watch': 3 },
                  flags: ['prisoner-kept'],
                },
                response:
                  'The courier goes down the stairs without a word. In the morning his cell is empty. The lock has not been forced.',
              },
              {
                id: 'escort-home',
                label:
                  'Pardon him. Send him home to the burrows tonight under trusted escort.',
                requires: { cost: 10 },
                effects: {
                  affinity: { moles: 10 },
                  local: { 'gate-watch': -2 },
                  flags: ['d38-boy-escorted'],
                },
                response:
                  'Dunmark takes him himself, by the back stair and the tunnel road. At the burrow mouth the boy says something to the captain. Dunmark will not repeat it, even under orders.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 39,
    title: 'Saltroad Congress',
    briefings: [
      {
        id: 'congress-called',
        source: 'Oriel Saltmarsh',
        text: 'Every kingdom faction has agreed to meet at one table tonight.',
        truth: true,
      },
      {
        id: 'seating-done',
        source: 'The steward',
        text: 'Young Komodo has drawn up the seating himself.',
        truth: true,
      },
      {
        id: 'verge-absent',
        source: 'A Saltroad herald',
        text: 'The Black Verge Court has refused to send anyone.',
        truth: false,
      },
    ],
    komodo:
      'I have seated everyone where they will be most comfortable, Your Majesty. It took all night. Your chair I could not place, so I left it at the head.',
    quests: [],
    audiences: [
      {
        id: 'd39-congress',
        title: 'Saltroad Congress',
        speaker: 'Oriel Saltmarsh of the Saltroad',
        npc: 'oriel-saltmarsh',
        faction: 'saltroad',
        lines: [
          'The long table runs the length of the throne room, a chair for every banner on the map, even the plum one. Down the middle march Abbey candles, a gift. Their flames do not move.',
          'Young Komodo stands at the far end with a seating chart, ticking off each guest. The host of a wedding nobody wanted.',
          'Oriel Saltmarsh rises, beak first. “Majesty, your advisor put the Abbess at your right hand and the Moles by the door. Is that where the crown wants them?”',
        ],
        // The table remembers what the crown said out loud (playtest act4 R2)
        // and the peace it bought (d37-verge-terms).
        variants: [
          {
            flags: ['promised-thistledown', 'thistledown-abandoned'],
            lines: [
              'The long table runs the length of the throne room, a chair for every banner on the map, even the plum one. Down the middle march Abbey candles, a gift. Their flames do not move.',
              {
                who: 'Hester Plowright',
                npc: 'hester-plowright',
                text: 'Before anyone sits. You said it out loud, Majesty. Before noon, you said. I’ve a whole village heard you.',
              },
              'Oriel Saltmarsh rises, beak first. “Majesty, your advisor put the Abbess at your right hand and the Moles by the door. Is that where the crown wants them?”',
            ],
          },
          {
            flags: ['promised-waystation', 'waystation-abandoned'],
            lines: [
              'The long table runs the length of the throne room, a chair for every banner on the map, even the plum one. Down the middle march Abbey candles, a gift. Their flames do not move.',
              'Young Komodo stands at the far end with a seating chart, ticking off each guest. The host of a wedding nobody wanted.',
              'Oriel Saltmarsh rises, beak first. “The crown chose us, Majesty. It said so to Hester’s face. Then it chose nothing.” She lets that sit. “Your advisor put the Abbess at your right hand and the Moles by the door. Is that where the crown wants them?”',
            ],
          },
          {
            flags: ['d37-verge-peace'],
            lines: [
              'The long table runs the length of the throne room, a chair for every banner on the map, even the plum one. Down the middle march Abbey candles, a gift. Their flames do not move.',
              {
                who: 'The Envoy of the Black Verge',
                npc: 'the-verge-envoy',
                text: 'We have our peace, Majesty. I came to watch you keep it. A common front against my riders would be a short peace.',
              },
              'Oriel Saltmarsh rises, beak first. “Majesty, your advisor put the Abbess at your right hand and the Moles by the door. Is that where the crown wants them?”',
            ],
          },
        ],
        options: [
          {
            id: 'ask-seating',
            label: 'Ask Komodo to explain his seating.',
            effects: {},
            response:
              'Komodo rises at once. He has been hoping someone would ask. He taps the chart with one claw.',
            next: 'seating',
          },
          {
            id: 'keep',
            label: 'Keep Komodo’s seating.',
            effects: {
              affinity: { abbey: 10, moles: -5 },
              flags: ['congress-komodo-seating'],
            },
            response:
              'The Abbess settles in at your right hand and pats your sleeve. At the end of the table, Komodo writes something down.',
          },
          {
            id: 'reseat',
            label: 'Move the Moles and the Freeholds up to the throne.',
            effects: {
              affinity: { moles: 10, freeholds: 5, abbey: -10 },
              flags: ['congress-reseated'],
            },
            response:
              'Chairs scrape. Granny Umber sits beside the throne, delighted. Komodo’s claw taps his ledger twice and stops.',
          },
          {
            id: 'shoe',
            label:
              'Set the small shoe from the Abbey cellar before the Abbess.',
            requires: { flags: ['abbey-crypt-evidence'] },
            effects: {
              affinity: { abbey: -20, 'hollow-bell': 10, freeholds: 10 },
              strength: { abbey: -1 },
              flags: ['abbess-shamed'],
            },
            response:
              'The table goes silent. The Abbess looks at the shoe, then at you, and smiles exactly as warmly as before. Komodo looks away first.',
          },
          {
            id: 'front',
            label: 'Ask the table for a common front against the plum riders.',
            effects: {
              affinity: { 'black-verge': -10, saltroad: 5, freeholds: 5 },
              flags: ['congress-common-front'],
            },
            response:
              'Most of the table agrees, loudly. The Envoy of the Black Verge agrees too. Softly. That is worse.',
          },
          {
            id: 'waystation',
            label: 'First, answer Oriel for the waystation the crown let burn.',
            requires: { flags: ['waystation-abandoned'] },
            effects: {
              affinity: { saltroad: 10, freeholds: -5 },
              local: { 'old-houses': -1 },
              flags: ['d39-waystation-answered'],
            },
            response:
              'You say it plainly: the crown chose, and the Saltroad paid. Oriel’s beak opens and closes. “Nobody has ever said that to me at a table.” Across from her, Hester studies the ceiling.',
          },
          {
            id: 'thistledown',
            label: 'First, stand and answer Hester for Thistledown.',
            requires: { flags: ['thistledown-abandoned'] },
            effects: {
              affinity: { freeholds: 10, saltroad: -5 },
              local: { 'old-houses': -1 },
              flags: ['d39-thistledown-answered'],
            },
            response:
              'Hester hears you out with her basket on her knees. Then: “Barns can be rebuilt.” Then: “Seed grain can’t.” Then nothing. Oriel counts something on her feathers under the table.',
          },
          {
            id: 'tally',
            label:
              'Open the sisters’ tally book on the table. Read the “Paid” column aloud.',
            requires: { flags: ['abbey-crypt-ledger'] },
            effects: {
              affinity: {
                abbey: -15,
                'hollow-bell': 5,
                freeholds: -5,
                saltroad: -5,
              },
              strength: { abbey: -1 },
              flags: ['d39-tally-read'],
            },
            response:
              'You read the first page. Families from Thistledown. Families from the salt-house. Brass beside each name. On the second page Hester puts her hand flat on the book. Her sister’s name is on it. The Abbess folds her hands and waits for you to finish. You do not finish.',
          },
        ],
        beats: [
          {
            id: 'seating',
            speaker: 'Young Komodo',
            npc: 'young-komodo',
            lines: [
              '“The Abbess at your right hand, Your Majesty, because she feeds more mouths than anyone here. A hungry kingdom should see who feeds it.”',
              '“The Moles by the door, because Granny Umber asked to sit near a way out. The plum chair beside Lady Vask, because she alone can bore an envoy into peace.”',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'I shall take that as a compliment, Master Komodo. I take most of what you say as one. It saves time.',
              },
              {
                who: 'Oriel Saltmarsh',
                npc: 'oriel-saltmarsh',
                text: 'And the chair at the foot, advisor? There is one more chair than guests.',
              },
              '“That one,” says Komodo, “is for whoever does not come.” He smiles round the table and sits in the chair beside it.',
            ],
            options: [
              {
                id: 'keep',
                label:
                  'Keep Komodo’s seating. He has thought about it more than anyone.',
                effects: {
                  affinity: { abbey: 10, moles: -5 },
                  flags: ['congress-komodo-seating'],
                },
                response:
                  'The Abbess settles at your right hand and pats your sleeve. At the end of the table Komodo writes something down and underlines it.',
              },
              {
                id: 'reseat',
                label: 'Move the Moles and the Freeholds up to the throne.',
                effects: {
                  affinity: { moles: 10, freeholds: 5, abbey: -10 },
                  flags: ['congress-reseated'],
                },
                response:
                  'Chairs scrape. Granny Umber sits beside the throne, delighted. The Abbess takes the chair by the door without a word. Komodo’s claw taps his ledger twice and stops.',
              },
              {
                id: 'shoe',
                label:
                  'Set the small shoe from the Abbey cellar before the Abbess.',
                requires: { flags: ['abbey-crypt-evidence'] },
                effects: {
                  affinity: { abbey: -20, 'hollow-bell': 10, freeholds: 10 },
                  strength: { abbey: -1 },
                  flags: ['abbess-shamed'],
                },
                response:
                  'The table goes silent. The Abbess looks at the shoe, then at you, and smiles exactly as warmly as before. Komodo looks away first.',
              },
              {
                id: 'front',
                label:
                  'Ask the table for a common front against the plum riders.',
                effects: {
                  affinity: { 'black-verge': -10, saltroad: 5, freeholds: 5 },
                  flags: ['congress-common-front'],
                },
                response:
                  'Most of the table agrees, loudly. The Envoy of the Black Verge agrees too. Softly. Komodo writes the Envoy’s answer down word for word.',
              },
              {
                id: 'vask-chairs',
                label:
                  'Let Lady Vask chair the table. The Old Houses speak first.',
                effects: {
                  affinity: { moles: -5 },
                  local: { 'old-houses': 3, yard: -2 },
                  flags: ['d39-vask-chairs'],
                },
                response:
                  'Lady Vask takes the chair like it was always hers. By midnight every faction has agreed to something, and none remembers agreeing. Komodo, beside the empty chair, applauds.',
              },
              {
                id: 'crown-at-foot',
                label:
                  'Leave the head of the table empty. Sit in the empty chair at the foot.',
                effects: {
                  affinity: { freeholds: 5, abbey: -5 },
                  local: { 'old-houses': -2, yard: 2 },
                  flags: ['d39-crown-at-foot'],
                },
                response:
                  'The table goes quiet as you sit at the foot, between Komodo and a burrow delegate. Hester laughs out loud. The Abbess, alone at the head by the empty throne, folds her hands and waits. Komodo does not look at you again.',
              },
              {
                id: 'tally',
                label:
                  'Open the sisters’ tally book on the table. Read the “Paid” column aloud.',
                requires: { flags: ['abbey-crypt-ledger'] },
                effects: {
                  affinity: {
                    abbey: -15,
                    'hollow-bell': 5,
                    freeholds: -5,
                    saltroad: -5,
                  },
                  strength: { abbey: -1 },
                  flags: ['d39-tally-read'],
                },
                response:
                  'You read the first page. Families from Thistledown. Families from the salt-house. Brass beside each name. On the second page Hester puts her hand flat on the book. Her sister’s name is on it. The Abbess folds her hands and waits for you to finish. You do not finish.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 40,
    title: 'The Keep’s Empty Chairs',
    briefings: [
      {
        id: 'watch-reassigned',
        source: 'Captain Dunmark',
        text: 'Half the night watch was reassigned to the mission road by an order under the crown’s seal.',
        truth: true,
      },
      {
        id: 'roads-quiet',
        source: 'Young Komodo’s runner',
        text: 'The roads to the Abbey are quiet tonight.',
        truth: false,
        komodoLie: true,
        hindsight:
          'The roads to the Abbey were full that night. Half your watch marched them, under a seal he pressed himself.',
        variants: [
          {
            flags: ['d38-rosters-changed'],
            text: 'The roads to the Abbey are quiet tonight. Every post on the new rosters is manned.',
          },
        ],
      },
      {
        id: 'chairs-empty',
        source: 'The steward',
        text: 'Several chairs at the long table were left empty after the Congress.',
        truth: true,
      },
    ],
    komodo:
      'Whatever happens, Your Majesty, remember I always told you the price of things. Nearly always.',
    quests: [],
    audiences: [
      {
        id: 'd40-sealed-order',
        title: 'An Order Under Seal',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'The long table from the Congress still stands. Chairs pushed back, cups half full. Dunmark walks past them with a folded order in his fist.',
          '“Half my night watch has orders to stand on the mission road tonight, Majesty. To guard pilgrims. For the Abbey’s rehearsal.”',
          '“It’s under your seal. I’ve served three crowns. I know a seal from a stamp. I don’t remember you telling me.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'You signed forty orders the day of the Congress, Your Majesty. I brought them in a stack. That one was the thirty-first. The pilgrims asked for an escort. It seemed a small thing.',
          },
        ],
        // Day 31's walls, remembered (playtest act4 R1/R6).
        variants: [
          {
            flags: ['watch-marched'],
            lines: [
              'The long table from the Congress still stands. Chairs pushed back, cups half full. Dunmark walks past them with a folded order in his fist.',
              '“Half my night watch has orders to stand on the mission road tonight, Majesty. To guard pilgrims. For the Abbey’s rehearsal.”',
              '“First the Ford took my walls. Now the Abbey wants my nights. It’s under your seal, and I don’t remember you telling me. Somebody’s counting how often I’m gone, Majesty. It isn’t me.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'You signed forty orders the day of the Congress, Your Majesty. I brought them in a stack. That one was the thirty-first. The pilgrims asked for an escort. It seemed a small thing.',
              },
            ],
          },
        ],
        options: [
          {
            id: 'ask-seal',
            label: 'Ask Dunmark who else touches the crown’s seal.',
            effects: {},
            response:
              'Dunmark does not look at Komodo. He works at not looking.',
            next: 'seal',
          },
          {
            id: 'recall',
            label: 'Recall the night watch to the walls.',
            effects: {
              local: { 'gate-watch': 2, 'old-houses': -2 },
              flags: ['d40-watch-recalled'],
            },
            response:
              'Dunmark tears the order in half, then in half again. “I will write to the sisters,” Komodo says mildly. “They always understand.” Lady Vask watches the pieces fall. “The Old Houses hold their land by that seal, Majesty. One does like to know it means something.”',
          },
          {
            id: 'stand',
            label:
              'Let the order stand. The crown gave its word, even if it forgot giving it.',
            effects: {
              local: { 'gate-watch': -2, 'old-houses': 2 },
              flags: ['d40-seal-order-stood'],
            },
            response:
              'Dunmark folds the order along its creases and puts it inside his tabard, over his heart. For later.',
          },
        ],
        beats: [
          {
            id: 'seal',
            lines: [
              '“You, Majesty. The steward, to carry it from room to room. And whoever keeps the order box.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'That would be me, Captain. I keep the box. I keep most boxes. An advisor is a lizard with a great many boxes.',
              },
              '“At the gate on the tenth day, Majesty, you swore us something,” says Dunmark. “I’m not asking you to swear it again. I’m asking what it’s worth tonight.”',
            ],
            options: [
              {
                id: 'recall',
                label:
                  'Recall the night watch. Every one of them, back on the walls.',
                effects: {
                  local: { 'gate-watch': 2, 'old-houses': -2 },
                  flags: ['d40-watch-recalled'],
                },
                response:
                  'Dunmark tears the order in half, then in half again. “I will write to the sisters,” Komodo says mildly. He watches the pieces fall, reading them. From the gallery Lady Vask: “The Old Houses hold their land by that seal, Majesty. One does like to know it means something.”',
              },
              {
                id: 'stand',
                label: 'Let it stand. Komodo has never sealed a wrong order.',
                effects: {
                  local: { 'gate-watch': -2, 'old-houses': 2 },
                  flags: ['d40-seal-order-stood'],
                },
                response:
                  '“As the emperor says.” Dunmark puts the order inside his tabard, over his heart. Komodo thanks you warmly. He does not thank Dunmark.',
              },
              {
                id: 'own-eyes',
                label:
                  'Nothing leaves the tower under seal tonight unless the emperor has read it.',
                effects: {
                  local: { 'gate-watch': 1, ledger: -2 },
                  flags: ['d40-seals-checked'],
                },
                response:
                  '“Wise,” says Komodo. At midnight he brings you a stack as tall as his ledger: grain chits, a wedding licence, a dog’s name for the Yard’s register. Every one is exactly what it says.',
              },
            ],
          },
        ],
      },
      {
        id: 'd40-archive',
        title: 'The Archive’s Request',
        speaker: 'Keeper Abelard Vellum of the Lamplight Archive',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        requires: { flags: ['ledger-page-kept'] },
        lines: [
          'Keeper Vellum takes most of an hour to cross the hall on an ordinary day. Today he arrives before the herald has finished, archive keys clenched in one fist so they will not ring.',
          '“I have matched the hand, Majesty. I would rather not say it in this room. Give me leave to move the Archive’s best books out of the tower. Tonight.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Moving books in the dark, Keeper? Take the good lanterns from the Yard. I will sign for the oil.',
          },
        ],
        options: [
          {
            id: 'ask-name',
            label: 'Ask him, quietly, whose hand it is.',
            effects: {},
            response:
              'Vellum looks past your shoulder at the doorway, a long, slow moment. Long even for him.',
            next: 'name',
          },
          {
            id: 'evacuate',
            label: 'Move the books tonight.',
            effects: { local: { lamplight: 3 }, flags: ['archive-evacuated'] },
            response:
              'By midnight Lamplight clerks carry crates down the back stair. Vellum carries the last one himself. He does not explain.',
          },
          {
            id: 'morning',
            label: 'It can wait until morning.',
            effects: { local: { lamplight: -2 } },
            response:
              'Vellum closes his eyes. “As the emperor wishes. I will sleep in the Archive tonight.”',
          },
        ],
        beats: [
          {
            id: 'name',
            lines: [
              '“Not in this room, Majesty. Rooms have doors. Doors have people standing in them.”',
              '“I’ll tell you this much, because it is not a name. The hand that wrote the oil wrote forty orders for the crown’s seal this month. I have copies. Whoever wrote them was proud of their sevens.”',
              '“I would like to take the books, and the copies, somewhere without this room in it. Tonight.”',
              '“Or I wait. If I move the books tonight, the hand will know I found it. If I wait, the copies are still on the shelf when he comes for them. I can give him the wrong ones. Your choice, Majesty. I have been wrong about fewer things than most, but I have been wrong.”',
            ],
            options: [
              {
                id: 'evacuate',
                label: 'Move the books tonight, and the copies with them.',
                effects: {
                  local: { lamplight: 3 },
                  flags: ['archive-evacuated'],
                },
                response:
                  'Vellum bows, which takes a while, and goes. By midnight Lamplight clerks carry crates down the back stair. The last crate is the copies. He carries it himself.',
              },
              {
                id: 'morning',
                label:
                  'Wait until morning. Leave the copies on the shelf for him to find.',
                effects: {
                  local: { lamplight: -2 },
                  flags: ['d40-archive-bait'],
                },
                response:
                  'Vellum closes his eyes. “As the emperor wishes. I will sleep in the Archive tonight. Door locked. Lamps out. The wrong forty on the top shelf.”',
              },
              {
                id: 'sealed-name',
                label:
                  'Keep the books here. Ask him to write the name, seal it, and give it to you.',
                effects: {
                  local: { lamplight: 1 },
                  flags: ['d40-vellum-sealed-name'],
                },
                response:
                  'Vellum writes one word on the back of an archive slip, folds it twice, and presses his thumb into the wax. “Read it alone, Majesty.” You are not alone again all evening.',
              },
            ],
          },
        ],
      },
      {
        id: 'd40-quiet-word',
        title: 'A Quiet Word',
        speaker: 'Young Komodo',
        npc: 'young-komodo',
        lines: [
          'By evening the long table is gone. A few chairs nobody claimed. The lamps are trimmed low to save oil.',
          'Young Komodo waits until the throne room is empty. Ledger under his arm. Coat buttoned to the throat.',
          'He does not come up the carpet. He comes up the side, along the wall, the way he has every evening for forty days. He stops at the foot of the dais. One claw on the ledger’s spine.',
          '“Forty days, Your Majesty. I liked them more than I expected. I would like to ride out tonight on the crown’s business. Don’t wait up.”',
          '“The Saltroad accounts. Nothing a throne would care about. Some promises came due all at once. They do that.”',
        ],
        options: [
          {
            id: 'sit',
            label: 'Come down from the throne. Sit beside him on the step.',
            effects: {},
            response:
              'He looks at the step like it might be a trick. Then he sits, the ledger across his knees. Up close he smells of ink and road dust. And candle wax.',
            next: 'step',
          },
          {
            id: 'accounts',
            label:
              'Ask which accounts need settling on the Saltroad after dark.',
            effects: {},
            response:
              'Komodo smiles. “The kind that are cheaper settled in the dark, Your Majesty. Most are.” His claw taps the ledger once.',
            next: 'accounts',
          },
        ],
        beats: [
          {
            id: 'step',
            lines: [
              '“Your first morning, a mayor came up that carpet before the herald finished your name. I thought: eaten within the week. I am almost never wrong about prices, Your Majesty. I was wrong about you.”',
              '“You kept asking what things cost. Not in brass. In people. Nobody had asked me that in years. I had stopped asking it myself.”',
              'Far off, up the mission road, the Abbey is rehearsing again. It reaches the tower as pressure more than sound, through the soles of your feet. Tonight it does not sound like a rehearsal.',
              '“May I ask you something? Not as your advisor. As whatever I am when the hall is empty.”',
            ],
            options: [
              {
                id: 'ask',
                label: '“Ask.”',
                effects: {},
                response: 'He nods. For a long while he asks nothing.',
                next: 'question',
              },
              {
                id: 'beds',
                label:
                  'First ask whether he ever learned where the Abbey’s children go.',
                effects: {},
                response:
                  'Komodo looks at the empty petitioners’ bench. “I told you to ask that on the eighth day. Not today. But I would ask, I said.” He turns a page without reading it. “I asked every day since. I found out. Ask me tomorrow what it cost.”',
                next: 'question',
              },
              {
                id: 'coldbrook',
                label:
                  'Ask if he thinks the Coldbrook children are happy at the Abbey.',
                requires: { flags: ['abbey-took-coldbrook-children'] },
                effects: {},
                response:
                  '“Warm beds,” Komodo says. “Lessons.” It is Sister Marrow’s voice, exactly. He hears himself, and stops.',
                next: 'question',
              },
            ],
          },
          {
            id: 'accounts',
            lines: [
              '“Oriel Saltmarsh’s factor holds three of the crown’s notes, and a fourth that is, technically, mine. A caravan master on the salt flats owes the court eleven barrels of lamp oil. That sort of thing.”',
              'He says it lightly. He does not open the ledger. In forty days you have never heard him quote a number without opening the ledger first.',
              '“The roads are quiet tonight. I made sure. I will be back before anyone misses me. If they do, say I went to count barrels. Nobody follows a lizard who is counting barrels.”',
            ],
            options: [
              {
                id: 'trust',
                label:
                  'Accept it. Accounts are his business, and he has never failed them.',
                effects: {},
                response:
                  '“Never,” Komodo agrees. “Not once. I am proud of that.” It sounds like it hurts.',
                next: 'question',
              },
              {
                id: 'roads',
                label:
                  'Tell him Dunmark’s night watch went up the mission road under the crown’s seal.',
                effects: {},
                response:
                  '“Pilgrims,” says Komodo at once. “For the rehearsal. You signed it with the rest. The roads are quiet tonight because I asked them to be.” It is a good answer. He had it ready.',
                next: 'question',
              },
              {
                id: 'oil',
                label:
                  'Ask if the clerk who could not tell oil from wax was ever corrected.',
                requires: { flags: ['ledger-page-to-komodo'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  '“Corrected,” Komodo says. He opens the ledger at last, near the back. There is the Keeper’s page, folded where he tucked it on the thirty-second day. He looks at it and says nothing.',
                next: 'cornered',
              },
              {
                id: 'hand',
                label:
                  'Tell him what Hollin saw: left-handed, a tap of the pen before every number.',
                requires: { flags: ['ledger-hand-studied'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  'Komodo’s claw rests on the ledger. His left. He looks at it. Slowly he lifts it away. He does not put it back.',
                next: 'cornered',
              },
              {
                id: 'boy',
                label:
                  'Repeat the young courier’s whisper: the one with the ledger, under his arm, always.',
                requires: { flags: ['prisoner-pardoned'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  '“Half the court carries a ledger,” Komodo says. You told yourself the same on the thirty-eighth day. Then, lower: “But you did not tell anyone else what he said. You told me.”',
                next: 'cornered',
              },
              {
                id: 'escaped',
                label:
                  'Ask how the young courier got out of a locked cell the night you gave him to Komodo.',
                requires: { flags: ['prisoner-to-komodo'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  '“I said I was sorry about that,” Komodo says. “I was. I am.” He does not say he does not know how.',
                next: 'cornered',
              },
              {
                id: 'reports',
                label:
                  'Remind him the morning reports were wrong in the same careful way, and the runner was never found.',
                requires: { flags: ['false-reports-traced'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  '“Runners,” says Komodo. “They will say anything for a bowl of soup.” He says it to the ledger.',
                next: 'cornered',
              },
              {
                id: 'chain',
                label:
                  'Say nothing. Tap two fingers on the step, twice, the way the courier did.',
                requires: { flags: ['d38-hall-cleared'] },
                effects: { flags: ['d40-komodo-confronted'] },
                response:
                  'Komodo watches your fingers. Once. Twice. He does not ask where you learned it. He knows which room was empty.',
                next: 'cornered',
              },
            ],
          },
          {
            id: 'question',
            lines: [
              'Komodo is quiet a while. When he speaks again it is not about accounts, or the war, or the map.',
              '“Suppose a physician came to court. A good one. Suppose she said the kingdom had a sickness in it, low down, older than this tower, older than the Bell. And the only cure was for the crown to be set down.”',
              '“Not broken. Not stolen. Set down, gently, by someone who loved it. So the thing underneath has no reason to come up and take it.”',
              '“Would you want to be asked first? Or would you rather someone who loved you just did it, and let you hate them for the rest of your life?”',
              'His claw is not tapping. For the first time in forty days it is still.',
            ],
            options: [
              {
                id: 'ask-me',
                label: '“Ask me. A crown that is not asked is only a hat.”',
                effects: { flags: ['d40-komodo-told-ask'] },
                response:
                  'Komodo laughs. A real laugh, startled out of him. “Only a hat. I will write that down.” He does not write it down.',
                next: 'door',
              },
              {
                id: 'do-it',
                label: '“Let them do it. That is what love is for, sometimes.”',
                effects: { flags: ['d40-komodo-told-do-it'] },
                response:
                  'Komodo closes his eyes. “Thank you,” he says. You are not sure it was meant for you.',
                next: 'door',
              },
              {
                id: 'no-cure',
                label: '“There is no such cure. Only people who sell it.”',
                effects: { flags: ['d40-komodo-told-no-cure'] },
                response:
                  '“That is what I would have said,” Komodo says. “Forty days ago.” He smiles. You have passed a test, or failed one. You cannot tell which he wanted.',
                next: 'door',
              },
              {
                id: 'who',
                label: '“Who is the physician, Komodo?”',
                effects: { flags: ['d40-komodo-asked-who'] },
                response:
                  '“Oh, nobody. A hypothetical. I collect them. They cost almost nothing to keep, Your Majesty. Right up until the day they don’t.”',
                next: 'door',
              },
            ],
          },
          {
            id: 'cornered',
            lines: [
              'Komodo shuts the ledger. Not hard. In forty days he has never done anything hard. He folds his hands on the cover and looks at you with the cold, still attention he turns on other people.',
              '“You have been counting, Your Majesty. Good. I taught you that. I am proud of you, believe it or not.”',
              '“I am going to say something. Remember it. Everything I have done in this court, I did for this court. Some of it you would thank me for. Some you would not. Ask me tomorrow which is which.”',
              '“Tonight I would only like to ride to the Saltroad and count some barrels. But since you are counting, count one more thing for me first.”',
            ],
            options: [
              {
                id: 'tomorrow',
                label: 'Ask him tomorrow, then.',
                effects: { flags: ['d40-komodo-asked-tomorrow'] },
                response:
                  '“Tomorrow,” he agrees. His voice catches on the word, like a coat on a nail.',
                next: 'question',
              },
              {
                id: 'now',
                label: 'Ask him now. Wait however long it takes.',
                effects: { flags: ['d40-komodo-pressed'] },
                response:
                  'You wait. The lamps gutter. At last Komodo says, “I have never once lied to you about the price of anything.” As far as you know, it is true. It is not an answer.',
                next: 'question',
              },
              {
                id: 'mercy',
                label:
                  'Tell him you would rather hear it from him than from anyone else.',
                effects: { flags: ['d40-komodo-offered-mercy'] },
                response:
                  'For a moment you think he will tell you. His mouth opens. Up the mission road the bell with no clapper does something that is not quite a sound. He closes his mouth. “From me,” he says. “Yes. You will.”',
                next: 'question',
              },
            ],
          },
          {
            id: 'door',
            lines: [
              'Komodo stands, brushes the dust of the step from his coat, and fastens the top button. It was already fastened.',
              '“Some advice, Your Majesty. It is all I am good for tonight. Whoever your friends were on the map this morning, those are your walls tomorrow. I hope you chose the ones with roofs.”',
              '“Keep the Keeper close. He is slow, and slow things survive. And if you ever hear a bell that has no clapper, do not go toward it. Whatever it sounds like. Whoever is calling.”',
              '“There. That is all the free advice in the tower. The rest has a price, and I have already paid it.”',
            ],
            options: [
              {
                id: 'leave',
                label: 'Let him go. The crown trusts him.',
                effects: { flags: ['komodo-leave-granted'] },
                response:
                  'Komodo bows lower than he has ever bowed. At the door he stops. His claw taps the ledger once, twice. He writes nothing down.',
              },
              {
                id: 'stay',
                label: 'Ask him to stay. The court needs its advisor tonight.',
                effects: { flags: ['komodo-asked-to-stay'] },
                response:
                  '“Of course,” says Komodo. He stays. He is good company all evening, funnier than you have ever heard him. At midnight he excuses himself to check the gate.',
              },
              {
                id: 'escort',
                label:
                  'Let him go, with Captain Dunmark and a doubled watch beside him.',
                requires: { local: { 'gate-watch': 10 } },
                effects: {
                  local: { 'gate-watch': -2 },
                  flags: ['komodo-escorted', 'gate-doubled'],
                },
                response:
                  'Komodo looks at the doubled watch a long moment. “Thorough. I taught you that.” Captain Dunmark rides out beside him, eyes on the ledger.',
              },
              {
                id: 'friend',
                label:
                  'Tell him he has been a friend, and you meant every day of it.',
                effects: { flags: ['d40-komodo-called-friend'] },
                response:
                  'Komodo stands still in the lamplight. “So have you,” he says. “That was never the problem.” He bows and goes. At the door he does not look back. In forty days he always has.',
              },
              {
                id: 'follow',
                label: 'Let him go. Ask Rook Bramble to follow at a distance.',
                requires: { follower: 'F001' },
                effects: { flags: ['d40-komodo-followed'] },
                response:
                  'Rook slips out the postern. Near midnight Rook comes back alone, ears flat. “He took the Saltroad fork. Then he walked his horse back across the scrub to the mission road, in the old ruts, so his tracks would lie. He knew someone would read them. I think he hoped it was me.”',
              },
              {
                id: 'cell',
                label:
                  'Have the Watch hold him in the cells until morning, friend or not.',
                effects: { flags: ['d40-komodo-held'] },
                response:
                  'Komodo does not argue. He goes down the stair between two of Dunmark’s people, talking about the weather. At the bottom he asks the guard, kindly, which cell the courier had.',
              },
            ],
          },
        ],
      },
    ],
  },
]

/**
 * What Act IV's quests bring back on a later dawn (t-043). Hidden: the court
 * learns them when they happen.
 */
export const ACT_FOUR_DUES: readonly DueDef[] = [
  {
    // Sister Marrow walked the party out of the cellars and asked after the
    // emperor's health three times.
    id: 'marrow-plums',
    title: 'A basket from the Abbey',
    inDays: 1,
    hidden: true,
    when: { flags: ['rehearsal-caught'] },
    line: 'A basket came up the mission road at dawn. Plums, a clean cloth, and a card in Sister Marrow’s round hand: For the emperor’s health. The cooks would not touch them. Young Komodo ate one standing up and said it was very good.',
  },
]
