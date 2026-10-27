import type {
  AudienceDef,
  DayDef,
  DueDef,
  QuestDef,
  SceneVariant,
} from './types'

// Act II, Days 11-20, "Rain Debt" (conductor DAY-PLAN.md): the Crow
// covenant and what it costs, the Mirefen, Saffron's old crew, the Rustline,
// the Mole manifesto, Hollow Bell's vote and the levy. Two Items of Power
// can be earned here: the Brass Hourglass (Day 14) and the Eye (Day 17).

export const ACT_TWO_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d12-mirefen-defense',
    title: 'Hold the Mirefen Edge',
    summary:
      'Raiders camp at the Mirefen’s edge. Sister Reedlight asks the crown to drive them off before they reach the lantern-houses.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      triumph: {
        affinity: { 'mire-mothers': 20 },
        strength: { jackalwire: -1, 'mire-mothers': 1 },
        recruitable: ['F015'],
      },
      success: {
        affinity: { 'mire-mothers': 15 },
        strength: { jackalwire: -1 },
        recruitable: ['F015'],
      },
      partial: { affinity: { 'mire-mothers': 5 } },
      failure: {
        affinity: { 'mire-mothers': -10 },
        strength: { 'mire-mothers': -1 },
      },
    },
    expired: { affinity: { 'mire-mothers': -10 } },
    outcomes: {
      triumph:
        'The raiders broke and ran. A novice fen witch with a green lantern walked the party home. On the road she asked one thing: did the throne have room for a witch who disagreed with her elders?',
      success:
        'The camp is scattered. A lantern-witch named Isolde thanks the party, then asks to see the emperor alone.',
      partial:
        'The raiders retreat into the reed line, close enough for their cooking smoke to reach the village. The watch ties three strips of red cloth to the fence for the families still hiding beyond it.',
      failure:
        'The party comes back by the road, stripped of its warning bells. Lanterns burn across the fen until dawn. Sister Reedlight says the raiders hung some of them; she will not say which.',
      expired:
        'No aid reaches the fen. Sister Reedlight leaves a dry bundle of broken reeds at the fortress gate. By morning every village pole on the road has been stripped of its lantern.',
    },
  },
  {
    id: 'q-d12-mirefen-cellars',
    title: 'What Is Under the Lantern-Houses',
    summary:
      'While the Mothers ask for soldiers, slip into the lantern-houses and see what is in the cellars. Post it and fail to go, and the Mothers will know the crown lost its nerve.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 2,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'lore', band: 'high', hidden: true },
    ],
    danger: 'mid',
    tags: ['records'],
    rewards: {
      success: {
        affinity: { 'mire-mothers': -10, moles: 5 },
        local: { lamplight: 3 },
        flags: ['mirefen-cellars-seen'],
      },
      failure: { affinity: { 'mire-mothers': -15 } },
    },
    // A search posted and never made is still a search: the Mothers saw it.
    expired: {
      affinity: { 'mire-mothers': -5 },
      flags: ['d12-cellars-unlooked'],
    },
    outcomes: {
      success:
        'Jars. Shelves of them, labelled in a neat hand with dates and village names. Some jars are small. The party took the ledger and left the jars.',
      partial:
        'Behind the cellar door something glass knocks gently against something else. The lock carries the stamp of Hollow Bell’s old foundry. The investigators leave with a sketch of it and empty hands.',
      failure:
        'Sister Reedlight meets the party halfway down the stairs with a tray of tea. The investigators climb back into daylight still holding untouched cups. Their map is gone.',
      expired:
        'The party never went down. Sister Reedlight sent the crown a green lantern, unlit. The Mothers saw the search posted, and saw it not dare.',
    },
    outcomeVariants: {
      success: [
        {
          flags: ['d12-names-spoken'],
          text: 'Jars. Shelves of them, labelled in a neat hand with dates and village names. Sedgewick. Low Carrow. Some jars are small. Eleven of the small ones carry names the court heard Sister Reedlight say aloud. The party took the ledger and left the jars.',
        },
      ],
    },
  },
  {
    id: 'q-d13-water-engine',
    title: 'The Pack’s Water Engine',
    summary:
      'Saffron’s old bandmates have a broken water engine and a canyon of thirsty raiders. Only Saffron knows how it was built.',
    region: 'jackalwire',
    faction: 'jackalwire',
    mustInclude: 'F002',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'might', band: 'low' },
    ],
    danger: 'low',
    tags: ['repair'],
    rewards: {
      success: {
        affinity: { jackalwire: 15, 'hollow-bell': -5 },
        flags: ['talk-saffron-insignia', 'pack-engine-fixed'],
      },
      failure: { affinity: { jackalwire: -10 } },
    },
    expired: { affinity: { jackalwire: -10 } },
    outcomes: {
      success:
        'The engine runs. The Pack cheered Saffron like a captain come home. She wept, then denied it. Hollow Bell’s stream runs lower.',
      partial:
        'The Rustline pump starts on the second pull and dies by supper. The Pack posts a guard beside it anyway. Hollow Bell’s stream runs low whenever the engine turns.',
      failure:
        'The pump breaks its flywheel on the first full load. A chunk lands in the watch tent. Gristle Vane sends the cracked bearing to the throne wrapped in the dead mechanic’s apron.',
      expired:
        'The Pack leaves the pump shed open and drains the oil into the dry creek bed. Gristle Vane nails a tally of wasted days to the door. His riders have returned to the toll road.',
    },
  },
  {
    id: 'q-d13-engine-sabotage',
    title: 'Fix It to Fail',
    summary:
      'Fix the Pack’s water engine to break in a month, when the raiders are counting on it.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['repair', 'coercion'],
    rewards: {
      success: {
        strength: { jackalwire: -2 },
        affinity: { jackalwire: 5, 'hollow-bell': 5 },
        flags: ['engine-sabotaged'],
        schedule: ['engine-fails'],
      },
      failure: {
        affinity: { jackalwire: -25 },
        flags: ['engine-sabotage-caught'],
        schedule: ['vane-bolt'],
      },
    },
    expired: {},
    outcomes: {
      success:
        'The engine runs clean. In a month it won’t. Nobody in the canyon suspects.',
      partial:
        'The sabotaged engine turns without complaint. The filed pin slides under the mechanic’s thumb but holds. The party leaves without learning which shift will be blamed when it breaks.',
      failure:
        'Gristle Vane found the filed bolt himself. He kept it. He will show it to people.',
      expired:
        'The mechanic replaces the weakened pin before the party arrives. The old one sits on the workbench in a clean envelope. Gristle Vane asks who wanted the engine to fail.',
    },
  },
  {
    id: 'q-d14-sick-courier',
    title: 'A Sick Courier',
    summary:
      'A Saltroad courier went down at the Eastern Ford with a fever and a satchel nobody may open. Beat the fever there.',
    region: 'east-ford',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'low',
    tags: ['medicine', 'urgent'],
    rewards: {
      triumph: {
        affinity: { saltroad: 15 },
        recruitable: ['F007'],
        flags: ['courier-saved', 'relic-hourglass-earned'],
      },
      success: {
        affinity: { saltroad: 10 },
        recruitable: ['F007'],
        flags: ['courier-saved', 'relic-hourglass-earned'],
      },
      partial: { affinity: { saltroad: 3 }, flags: ['courier-saved'] },
      failure: { affinity: { saltroad: -5 } },
    },
    expired: { affinity: { saltroad: -10 } },
    outcomes: {
      triumph:
        'The courier, Ash Quill, sat up by evening and asked for the satchel. Inside: a brass hourglass addressed to Young Komodo. Komodo let the court keep it. Too quickly.',
      success:
        'Ash Quill will live. The satchel held a brass hourglass addressed to Young Komodo. He waved it off. The court could have it.',
      partial:
        'The fever breaks just before dawn. The courier is carried home wrapped in the caravan master’s spare coat, satchel clenched under one arm. Young Komodo asks whether anyone opened it.',
      failure:
        'The courier’s cot is empty when the healers reach it. A stopped hourglass stands beside a sealed satchel. Nobody at the infirmary will sign the delivery receipt.',
      expired:
        'The road party reaches the milepost after the stretcher tracks have been washed away. Only the courier’s brass seal remains, pressed into the mud. It bears the tower’s address.',
    },
  },
  {
    id: 'q-d15-study-glass',
    title: 'Glass Feathers',
    summary:
      'Rustline salvagers have brought a crate of old-world glass shaped like feathers. Study it before anyone sells it.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'none',
    tags: ['records'],
    rewards: {
      success: {
        affinity: { rustline: 10 },
        local: { lamplight: 3 },
        recruitable: ['F014'],
        flags: ['glass-feathers-studied'],
      },
      failure: { affinity: { rustline: -5 } },
    },
    expired: { affinity: { rustline: -5 } },
    outcomes: {
      success:
        'Struck, the feathers ring on the Hollow Bell’s note. Pell, the salvager who brought them, wants to know what the court learned. And if it’s hiring.',
      partial:
        'The Archive numbers every feather and pins them under glass. By morning one pin has turned green and the others have not. The clerk locks the specimen drawer and gives the key to the throne.',
      failure:
        'The first feather splits when struck and leaves a thin blue line across the measuring table. Pell wraps the others in his coat. He says the Archive may buy the broken piece at full price.',
      expired:
        'The feather crate sells before the court answers. A buyer takes it under a canvas sheet through the north gate. The watch officer remembers the cart, not the face behind the reins.',
    },
  },
  {
    id: 'q-d16-hidden-grain',
    title: 'Three Haystacks',
    summary:
      'Someone is hiding grain in a drought. Three haystacks on the Freehold road weigh more than hay should.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'guile', band: 'high', hidden: true },
    ],
    danger: 'low',
    tags: ['records', 'tracking'],
    rewards: {
      success: {
        brass: 30,
        local: { yard: 3, 'old-houses': -2 },
        flags: ['grain-found'],
        schedule: ['watch-names-short'],
      },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -2 } },
    outcomes: {
      success:
        'Two haystacks held grain sacks stamped with an Old House crest. The third held hay. And a Gate Watch lantern, still warm.',
      partial:
        'The searchers cut open a single haystack and find Old House flour seals under the straw. The farmer’s boots are still by the door. The farmer is gone, and the Yard gets only one wagon.',
      failure:
        'The three haystacks hold ordinary winter fodder. Dunmore Ash comes to see the empty evidence sacks himself. He takes one home and hangs it by the oven as a reminder of what the raid cost.',
      expired:
        'The hiding place is bare at dawn, the grass underneath still pale. Wagon ruts lead toward the Old Houses’ private ford. They disappear where the road joins the river.',
    },
  },
  {
    id: 'q-d17-who-lies',
    title: 'Who Has Been Lying?',
    summary:
      'For two weeks some morning reports have been wrong in the same careful way. Trace them to their source.',
    region: 'storm-crow-heights',
    faction: 'storm-crows',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'guile', band: 'mid' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    tags: ['records', 'forgery'],
    rewards: {
      triumph: {
        local: { lamplight: 4 },
        affinity: { 'storm-crows': 5 },
        flags: ['relic-eye-earned', 'false-reports-traced'],
      },
      success: {
        local: { lamplight: 3 },
        flags: ['relic-eye-earned', 'false-reports-traced'],
      },
      partial: { local: { lamplight: 1 } },
      failure: { affinity: { 'storm-crows': -5 } },
    },
    expired: {},
    outcomes: {
      triumph:
        'Three runners and a Conclave dead-drop. The trail ended at the fortress gate. In the dead-drop: the glass eye of a long-dead Conclave elder. It shows a lie for what it is. The court has it now.',
      success:
        'The false reports ran through a Conclave dead-drop to somewhere inside the fortress. In the dead-drop: a deceased Conclave elder’s glass eye. It shows a lie for what it is.',
      partial:
        'The dead-drop is empty except for a black thread caught in its hinge. It smells of lamp oil from inside the fortress. The runner asks whether the court wants the thread or the name.',
      failure:
        'Three messengers leave the city before the Watch reaches their lodgings. A fourth bed has been slept in but no one booked it. Its pillowcase bears a court laundry mark.',
      expired:
        'Each morning brings another contradictory report, all bearing the tower’s own seal. The Archive clerk keeps them in a separate stack. The stack is taller than the true ones by week’s end.',
    },
  },
  {
    id: 'q-d18-refugee-road',
    title: 'No Water for Strangers',
    summary:
      'Walk the turned-away refugees to the Hollow Bell wells and see them let in.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 2,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'might', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['negotiation'],
    rewards: {
      success: {
        affinity: { 'hollow-bell': 5, freeholds: -3 },
        local: { yard: 2 },
        flags: ['refugees-sheltered'],
      },
      failure: { affinity: { 'hollow-bell': -5 } },
    },
    expired: {},
    outcomes: {
      success:
        'Hollow Bell let them in. Mara Reedbell wrote every name. Then she looked at the crown’s riders and wrote theirs.',
      partial:
        'Mara opens the bell gate for families with trade papers first. The others make camp in the ditch beneath the walls. Their cookfire smoke reaches the mayor’s bedroom window.',
      failure:
        'Mara keeps the gate barred. The escort sleeps among the refugees, passing one cooking pot between six fires. At dawn someone has painted the crown’s mark on the locked gate.',
      expired:
        'The abandoned escort notice remains on the throne board. An Abbey wagon reaches the refugees before the crown does. Its driver leaves a list of names for the tax office to cross out.',
    },
  },
  {
    id: 'q-d19-bell-speech',
    title: 'Speak to Hollow Bell',
    summary:
      'Hollow Bell votes tomorrow on the crown’s protection. Someone has to make the case in the square.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'high' },
      { stat: 'lore', band: 'low' },
    ],
    danger: 'none',
    tags: ['negotiation'],
    rewards: {
      success: {
        affinity: { 'hollow-bell': 15 },
        strength: { 'hollow-bell': 1 },
        flags: ['bell-voted-yes'],
      },
      // t-043: Mara broke the tie and would not say which way. Day 29 asks.
      partial: { flags: ['bell-vote-tied'] },
      failure: {
        affinity: { 'hollow-bell': -10 },
        flags: ['bell-voted-no'],
        schedule: ['bell-gate-shut'],
      },
    },
    expired: { flags: ['bell-voted-no'], schedule: ['bell-gate-shut'] },
    // The square remembers what the crown did for the Bell before the vote.
    aid: [
      {
        flags: ['d13-bell-warned'],
        label: 'The Bell remembers who knocked first',
        bonus: 1,
        stat: 'heart',
      },
      {
        flags: ['d13-water-shared'],
        label: 'The Pack’s water came back down the stream',
        bonus: 1,
        stat: 'heart',
      },
      {
        flags: ['d18-strangers-walked'],
        label: 'The strangers the crown walked to the Bell',
        bonus: 1,
        stat: 'heart',
      },
    ],
    outcomes: {
      success:
        'Hollow Bell voted yes, by nine hands. The bell rang. Somebody was holding the rope.',
      partial:
        'Mara breaks the deadlock behind the old chapel door. When she comes out, she has put the voting tally in her ledger backward. She refuses to read the margin aloud.',
      failure:
        'The town votes against the crown. Mara Reedbell delivers the result in person and brings a loaf from the town bakery. It has been cut in half before she arrives.',
      expired:
        'The speaker’s chair stays empty through the Bell’s assembly. Mara folds the unused invitation and files it beside the negative tally. The bell rings once, without ceremony.',
    },
  },
  {
    id: 'q-d20-ford-dam',
    title: 'Before the Rains',
    summary:
      'The Eastern Ford’s old dam is cracked. The first real rain will take it, whenever it comes. Shore it up before the river picks its own road. The Moles sleep under that river.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'might', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['repair'],
    rewards: {
      success: {
        affinity: { freeholds: 10 },
        strength: { freeholds: 1 },
        flags: ['ford-dam-built'],
      },
      failure: {
        strength: { freeholds: -1 },
        flags: ['ford-flooded'],
        schedule: ['ford-burrows'],
      },
    },
    expired: {
      strength: { freeholds: -1 },
      flags: ['ford-flooded'],
      schedule: ['ford-burrows'],
    },
    outcomes: {
      success:
        'The dam held. The map room has a new blue line where the reservoir will be.',
      partial:
        'The dam keeps its crown and loses its southern spillway. The water finds the tenant fields first. A farmer brings the map room three bricks marked with flood depth.',
      failure:
        'The dam tears open at the center. By morning the two riverside villages stand knee-deep in silt. The burrow roofs below them split under the weight of the water, and Granny Umber demands the names of whoever signed the design.',
      expired:
        'The dam holds without repair until the first hard rain. It breaks in an hour. Two villages are evacuated toward the eastern road, carrying grain ledgers and their door keys because they still intend to return.',
    },
    outcomeVariants: {
      failure: [
        {
          flags: ['no-rain'],
          text: 'No rain all season. Then one night of it, the kind the Conclave does not sell. The dam failed in an hour. The Ford took two villages.',
        },
      ],
      expired: [
        {
          flags: ['no-rain'],
          text: 'No rain all season. Then one night of it, the kind the Conclave does not sell. The cracked dam went in an hour. The Ford took two villages.',
        },
      ],
    },
  },
  {
    // t-061: posted by Day 12's Brown Water audience.
    id: 'q-d12-cistern-crack',
    title: 'Thirty-One Feet Down',
    summary:
      'Go down the fortress cistern on Foreman Ash’s rope, find the crack under the waterline and seal it with clay. The last crew came back one short.',
    region: 'mole-tunnels',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    tags: ['tunnels', 'repair'],
    aid: [
      {
        flags: ['d07-galleries-found'],
        label: 'Chalk marks a tunnel keeper left on the old galleries',
        bonus: 1,
        stat: 'lore',
      },
    ],
    rewards: {
      triumph: {
        brass: 10,
        local: { yard: 3 },
        flags: ['d12-cistern-sealed', 'd12-tull-found'],
      },
      success: { local: { yard: 2 }, flags: ['d12-cistern-sealed'] },
      partial: { local: { yard: 1 } },
      failure: { local: { yard: -2 }, flags: ['d12-cistern-fouled'] },
    },
    expired: {
      local: { yard: -1, 'old-houses': 1 },
      flags: ['d12-cistern-fouled'],
    },
    outcomes: {
      triumph:
        'Thirty-one feet down the crack runs along an old seam. Behind it is a dry gallery. In the gallery a lamp hook is driven into the wall, and under the hook a pair of work boots stand side by side. The party sealed the crack and brought the boots up. Ash took them without a word and went back to his ovens.',
      success:
        'The crack was a hand wide and weeping. The party packed it with clay and held it till it set. On the third day the water came up clear. The Yard baked white bread and sent the first loaf to the tower.',
      partial:
        'They found the crack and packed most of it. The water is better. It is not clear. Ash strains it through flour sacks and says nothing.',
      failure:
        'At thirty-one feet the rope went slack. Ash hauled it up hand over hand. The party was on the end of it, soaked and shaking. Nobody will say what took the lamp out of their hands.',
      expired:
        'Nobody went down. The cistern water went from brown to grey. The Yard bakes with the Old Houses’ water now and pays for every bucket.',
    },
  },
]

// t-061: the Yard's cistern, cracked over the old galleries.
const D12_CISTERN: AudienceDef = {
  id: 'd12-cistern',
  title: 'Brown Water',
  speaker: 'Foreman Dunmore Ash of the Yard',
  npc: 'dunmore-ash',
  faction: 'yard',
  lines: [
    'Foreman Dunmore Ash comes up the carpet with a bucket. He sets it on the bottom step of the dais. It is half full. The water in it is brown.',
    '“Cistern water, Majesty. Drawn this morning. Yesterday it was clear.”',
    '“The Yard bakes for the whole wall. Six hundred loaves on a good day. Brown water makes grey bread, and grey bread makes children sick. The cistern is cracked somewhere under the waterline. It leaks into the old workings, and the old workings leak back.”',
    '“The Old Houses have their own wells. They want the cistern locked till the rain. The Yard wants it fixed.”',
    {
      who: 'Young Komodo',
      npc: 'young-komodo',
      text: 'The cistern sits over the old galleries, Your Majesty. The last crew that went down to patch it came back one short. That was under the last emperor. Nobody wrote down the name.',
    },
  ],
  options: [
    {
      id: 'ask-ash',
      label: 'Ask Ash who did not come back.',
      effects: {},
      response:
        'Ash looks at the bucket a long time. “Merrit Tull. My cousin. I held the rope.”',
      next: 'tull',
    },
    {
      id: 'send-party',
      label: 'Send our own people down to find the crack and seal it.',
      effects: { local: { yard: 1 } },
      response:
        'Ash nods once and takes the bucket with him. By dusk there is a rope coiled at the cistern head and a lamp beside it, already trimmed.',
      postsQuests: ['q-d12-cistern-crack'],
    },
    {
      id: 'lock',
      label:
        'Lock the cistern. The Yard bakes with the Old Houses’ well water, by ration.',
      effects: {
        local: { 'old-houses': 2, yard: -2 },
        flags: ['d12-cistern-locked'],
      },
      response:
        'Lady Vask’s steward brings the well key on a velvet cushion. The Yard queues at her pump with buckets, and every bucket is counted. The loaves are smaller by the next market.',
    },
    {
      id: 'ask-galleries',
      label:
        'The families under the Ford know those galleries. Ask them to find the crack from below.',
      requires: { flags: ['d07-galleries-found'] },
      effects: {
        affinity: { moles: 5 },
        local: { yard: -1, 'old-houses': -1 },
        flags: ['d12-cistern-moles'],
      },
      response:
        'A tunnel keeper climbs out of the cistern at midnight with clay to the shoulder. The water clears in three days. Ash carries the first white loaf up to the tower himself and does not say who it is from.',
    },
  ],
  beats: [
    {
      id: 'tull',
      lines: [
        '“Merrit went down with a lamp and a bag of clay. Forty feet of rope. At thirty-one feet the rope went slack.”',
        '“We pulled it up. The knot was still tied. The lamp was hanging off it. Lit.”',
        '“I’m not asking you to send anybody, Majesty. I’m telling you what it costs when you do.”',
        {
          who: 'Young Komodo',
          npc: 'young-komodo',
          text: 'A lamp sent back lit is a message, Your Majesty. Someone down there wanted the Yard to stop coming. Whether they still do is a question for a better rope.',
        },
      ],
      options: [
        {
          id: 'send-party',
          label: 'Send our people down. Double rope. Ash holds it.',
          effects: { local: { yard: 1 } },
          response:
            'Ash rolls his sleeves to the elbow. “Double rope,” he says. “And I hold it this time too.”',
          postsQuests: ['q-d12-cistern-crack'],
        },
        {
          id: 'lock',
          label: 'Lock it. Nobody else goes down that shaft.',
          effects: {
            local: { 'old-houses': 2, yard: -2 },
            flags: ['d12-cistern-locked'],
          },
          response:
            'Ash hangs the cistern key on the nail by the oven door, where he can see it. The Yard bakes with bought water. Nobody goes down. Ash checks the nail every morning.',
        },
        {
          id: 'new-cistern',
          label: 'Pay the Yard to cut a new cistern on the hill instead.',
          requires: { cost: 35 },
          effects: {
            local: { yard: 2, ledger: -1 },
            flags: ['d12-new-cistern'],
          },
          response:
            'Thirty-five brass buys picks and three weeks of digging. The new cistern is dry stone until the rain. The Yard bakes grey bread in the meantime and thanks you anyway.',
        },
      ],
    },
  ],
}
export const ACT_TWO_DAYS: readonly DayDef[] = [
  {
    day: 11,
    title: 'The Rainmaker',
    briefings: [
      {
        id: 'rustline-fires',
        source: 'Eastern outriders',
        text: 'Salvager fires in the sunken rail yards, where the map shows nothing.',
        truth: true,
      },
      {
        id: 'bell-wells-full',
        source: 'A cheerful Hollow Bell carter',
        text: 'Hollow Bell’s wells are full again after one night of rain.',
        truth: false,
      },
      {
        id: 'rainmaker',
        source: 'Storm Crow Heights',
        text: 'Elder Corvane has come down from the Heights with a covenant written on oilcloth.',
        truth: true,
      },
    ],
    komodo:
      'Nobody fills a well in one night, Your Majesty. Not in this drought. And Corvane does not come down for small favors. Read the covenant twice. I would read it three times.',
    quests: [],
    audiences: [
      {
        id: 'd11-rainmaker',
        title: 'The Rainmaker',
        speaker: 'Elder Corvane of the Storm Crow Conclave',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        lines: [
          'The hall is hot. Fans click in the gallery. At the back, three Freehold reeves hold empty seed sacks folded over their arms like mourning bands. Then the chimes: hundreds of copper bells on Elder Corvane’s mantle, one ring per slow step.',
          'Elder Corvane does not bow. He unrolls a length of oilcloth down the steps of the dais. It keeps unrolling.',
          'The fields are dying, young ruler. The Conclave can bring rain. A season of it, every farm from the Ford to the Bell.',
          'In return, a covenant. The tower lends the Conclave a service when asked. Every covenant has a price. Ours is written down.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'He has not come down from the Heights in my lifetime, Your Majesty. Whatever he wants, he wants it enough to walk.',
          },
        ],
        options: [
          {
            id: 'ask-service',
            label: 'Ask what service the Conclave usually asks for.',
            effects: {},
            response: 'Every chime on Corvane’s mantle goes quiet at once.',
            next: 'price',
          },
          {
            id: 'recall-clause-nine',
            label:
              'Tell him the readers struck clause nine from his envoy’s contract. Ask where it hides in this one.',
            requires: { flags: ['crow-contract-read'] },
            effects: {},
            response:
              'Corvane’s clouded eyes turn to you for the first time. “Ah. The readers. I did wonder who they were.” He taps the oilcloth with one claw. “Clause nine is gone, as they wished. The Conclave names the favour before the rain now. In eleven.”',
            next: 'price',
          },
          {
            id: 'covenant',
            label: 'Sign the rain covenant.',
            effects: {
              affinity: { 'storm-crows': 15, freeholds: 10 },
              local: { yard: 2 },
              strength: { 'storm-crows': 1 },
              flags: ['rain-covenant', 'd11-rain-signed'],
              schedule: ['rain-covenant'],
            },
            response:
              'Corvane signs with an inked claw. A cloud shows over the Heights before he finishes. At the back, a reeve sits down on the floor.',
          },
          {
            id: 'one-season',
            label: 'Buy one season of rain outright, with brass.',
            requires: { cost: 40 },
            effects: {
              affinity: { 'storm-crows': 5, freeholds: 5 },
              local: { ledger: -2 },
              flags: ['d11-rain-bought'],
            },
            response:
              'Corvane takes the brass like a child’s drawing. The rain will come, briefly, and owe nobody anything when it goes.',
          },
          {
            id: 'tamsin',
            label: 'Have Tamsin read the covenant aloud.',
            requires: { follower: 'F011' },
            effects: {
              affinity: { 'storm-crows': -5 },
              local: { lamplight: 2 },
              flags: ['bonded-runner-clause', 'talk-tamsin-bonds'],
            },
            response:
              'Tamsin takes the oilcloth from the step. She does not ask where to start. Corvane’s clouded eyes find her. “Little runner. You came back.”',
            next: 'tamsin-reads',
          },
          {
            id: 'refuse',
            label: 'Refuse. The tower will not sell itself for weather.',
            effects: {
              affinity: { 'storm-crows': -10, freeholds: -5 },
              flags: ['no-rain'],
            },
            response:
              'Corvane folds the covenant away, all of it. The reeves watch every fold. The sky stays clear.',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“Small things,” says Corvane. “A runner to carry forecasts between the caves for a season. A field left fallow for our storm-glass. A bell rung at our hour. Once, long ago, a name.” He lists them like salt and flour.',
              '“We do not hide the price. We write it in a hand too old to hurry, and wait for the signer to stop reading. Clause eleven. Read it if you like. Nobody likes it.”',
              '“The rain does not wait. It is gathering over the Heights now. The Conclave has other customers.”',
              {
                who: 'A Freehold reeve at the back of the hall',
                text: 'We’re eating our seed corn, Majesty. Whatever’s in clause eleven, it isn’t hunger.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He told you the price, Your Majesty, so when it comes due it was your choice. I would still sign. A debt can be argued with. A dead field can’t.',
              },
            ],
            options: [
              {
                id: 'covenant',
                label:
                  'Sign it as written. The fields cannot wait for a kinder contract.',
                effects: {
                  affinity: { 'storm-crows': 15, freeholds: 10 },
                  local: { yard: 2 },
                  strength: { 'storm-crows': 1 },
                  flags: ['rain-covenant', 'd11-rain-signed'],
                  schedule: ['rain-covenant'],
                },
                response:
                  'You sign. Corvane watches the pen to the last letter. A cloud shows over the Heights before the ink dries. At the back of the hall the reeves weep without a sound.',
              },
              {
                id: 'one-season',
                label: 'Buy one season outright. No service, no clause eleven.',
                requires: { cost: 40 },
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 5 },
                  local: { ledger: -2 },
                  flags: ['d11-rain-bought'],
                },
                response:
                  'Corvane weighs the purse and sighs at the dull ending. The rain will come, briefly. In the gallery the Ledger’s factor writes down the cost.',
              },
              {
                id: 'tamsin',
                label:
                  'Let Tamsin read clause eleven aloud, to the whole court.',
                requires: { follower: 'F011' },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  local: { lamplight: 2 },
                  flags: ['bonded-runner-clause', 'talk-tamsin-bonds'],
                },
                response:
                  'Tamsin steps down from behind the throne and takes the oilcloth out of Corvane’s reach. Corvane’s clouded eyes find her. “Little runner,” he says. “You came back.”',
                next: 'tamsin-reads',
              },
              {
                id: 'refuse',
                label:
                  'Refuse. The tower will not sell its people for weather.',
                effects: {
                  affinity: { 'storm-crows': -10, freeholds: -5 },
                  flags: ['no-rain'],
                },
                response:
                  'Corvane rolls up his covenant. The reeves watch every turn. The sky stays clear. By evening every Freehold kitchen knows who kept it that way.',
              },
              {
                id: 'amend',
                label:
                  'Sign, and write in the margin: no person of this court is ever payment.',
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 5 },
                  local: { yard: 2, 'old-houses': -2 },
                  flags: [
                    'rain-covenant',
                    'd11-no-runners-clause',
                    'd11-rain-signed',
                  ],
                  schedule: ['rain-covenant'],
                },
                response:
                  'Corvane reads the margin and initials it himself. Worse than an argument. “No persons. The Conclave is flexible about the coin. Never about the sum.” In the gallery the Old Houses, who lease the high pastures to Freehold herds, begin to whisper.',
              },
              {
                id: 'read-eleven',
                label: 'Read clause eleven yourself before anyone signs.',
                effects: { flags: ['d11-clause-read'] },
                response:
                  'Corvane does not help you find the place. He watches you look for it.',
                next: 'eleven',
              },
            ],
          },
          {
            id: 'eleven',
            lines: [
              'The hand is old and close. The ink has gone brown. You find it at the bottom of the third fold.',
              'Clause eleven: *The service owed may be paid in runners, the season to be counted by the Conclave.*',
              'You read *counted* twice. Corvane waits. He has waited for that word before.',
              {
                who: 'A Freehold reeve at the back of the hall',
                text: 'How long’s a season, to the Conclave?',
              },
              'Corvane looks at the reeve until the reeve looks at the floor.',
            ],
            options: [
              {
                id: 'covenant',
                label:
                  'Sign it as written. Whatever a season is, the fields need rain now.',
                effects: {
                  affinity: { 'storm-crows': 15, freeholds: 10 },
                  local: { yard: 2 },
                  strength: { 'storm-crows': 1 },
                  flags: ['rain-covenant', 'd11-rain-signed'],
                  schedule: ['rain-covenant'],
                },
                response:
                  'You sign under clause eleven. Corvane blows on the ink. A cloud shows over the Heights before it dries. The reeve who asked the question does not clap with the others.',
              },
              {
                id: 'one-season',
                label: 'Buy one season outright. No service, no clause eleven.',
                requires: { cost: 40 },
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 5 },
                  local: { ledger: -2 },
                  flags: ['d11-rain-bought'],
                },
                response:
                  'Corvane weighs the purse. “You read it, and you paid not to owe it,” he says. “Most only do the first.” In the gallery the Ledger’s factor writes down the cost.',
              },
              {
                id: 'refuse',
                label: 'Refuse. A season counted by the seller is no season.',
                effects: {
                  affinity: { 'storm-crows': -10, freeholds: -5 },
                  flags: ['no-rain'],
                },
                response:
                  'Corvane rolls up his covenant. The reeves watch every turn. The sky stays clear. By evening every Freehold kitchen knows who kept it that way.',
              },
              {
                id: 'amend',
                label:
                  'Sign, and write in the margin: no person of this court is ever payment.',
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 5 },
                  local: { yard: 2, 'old-houses': -2 },
                  flags: [
                    'rain-covenant',
                    'd11-no-runners-clause',
                    'd11-rain-signed',
                  ],
                  schedule: ['rain-covenant'],
                },
                response:
                  'Corvane reads the margin and initials it himself. Worse than an argument. “No persons. The Conclave is flexible about the coin. Never about the sum.” In the gallery the Old Houses, who lease the high pastures to Freehold herds, begin to whisper.',
              },
              {
                id: 'amend-term',
                label:
                  'Sign, and write in the margin: a season is ninety days, by the tower’s calendar.',
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 10 },
                  local: { yard: 2 },
                  flags: ['rain-covenant', 'd11-term-fixed', 'd11-rain-signed'],
                  schedule: ['rain-covenant'],
                },
                response:
                  'Corvane reads the margin a long time. He initials it. “Ninety days,” he says. “By your calendar.” He does not ask whose hand keeps it. The runners are still in clause eleven. Only the count has changed.',
              },
            ],
          },
          {
            id: 'tamsin-reads',
            speaker: 'Tamsin Gutterwing',
            npc: 'F011',
            lines: [
              'Tamsin holds the oilcloth flat on the step with both hands and reads in a runner’s voice, flat and fast. Salt. Flour. A field. A bell.',
              'Clause eleven: *The service owed may be paid in runners, the season to be counted by the Conclave.* Her hands shake by the end of it.',
              'She stops. “I was counted,” she says. “Eleven years.” She does not finish the page.',
              {
                who: 'A Freehold reeve at the back of the hall',
                text: 'Eleven years is a long time, Majesty. So is a winter with no seed.',
              },
              'Corvane waits. The hall waits with him. Tamsin does not give the oilcloth back.',
            ],
            options: [
              {
                id: 'covenant',
                label:
                  'Sign it as written. The fields cannot wait, even for her.',
                effects: {
                  affinity: { 'storm-crows': 15, freeholds: 10 },
                  local: { yard: 2 },
                  strength: { 'storm-crows': 1 },
                  flags: ['rain-covenant', 'd11-rain-signed'],
                  schedule: ['rain-covenant'],
                },
                response:
                  'You hold out your hand for the oilcloth. Tamsin gives it to you. Then she walks out of the hall. You sign. A cloud shows over the Heights before the ink dries.',
              },
              {
                id: 'one-season',
                label: 'Buy one season outright. No service, no clause eleven.',
                requires: { cost: 40 },
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 5 },
                  local: { ledger: -2 },
                  flags: ['d11-rain-bought'],
                },
                response:
                  'Corvane takes the purse. Tamsin rolls the oilcloth up herself, tight, and hands it to him like something that bites. The rain will come, briefly, and owe nobody anything.',
              },
              {
                id: 'refuse',
                label: 'Refuse. Not for rain. Not for anything.',
                effects: {
                  affinity: { 'storm-crows': -10, freeholds: -5 },
                  flags: ['no-rain'],
                },
                response:
                  'Corvane takes his covenant back from Tamsin one fold at a time. The reeves watch every fold. The sky stays clear. By evening every Freehold kitchen knows who kept it that way, and why.',
              },
              {
                id: 'amend',
                label:
                  'Sign, and write in the margin: no person of this court is ever payment.',
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 5 },
                  local: { yard: 2, 'old-houses': -2 },
                  flags: [
                    'rain-covenant',
                    'd11-no-runners-clause',
                    'd11-rain-signed',
                  ],
                  schedule: ['rain-covenant'],
                },
                response:
                  'Tamsin watches you write it. Corvane initials it himself. “No persons. The Conclave is flexible about the coin. Never about the sum.” In the gallery the Old Houses, who lease the high pastures to Freehold herds, begin to whisper.',
              },
              {
                id: 'amend-term',
                label:
                  'Sign, and write in the margin: a season is ninety days, by the tower’s calendar.',
                effects: {
                  affinity: { 'storm-crows': 5, freeholds: 10 },
                  local: { yard: 2 },
                  flags: ['rain-covenant', 'd11-term-fixed', 'd11-rain-signed'],
                  schedule: ['rain-covenant'],
                },
                response:
                  'Corvane initials the margin. “Ninety days. By your calendar.” Tamsin reads the margin twice. “Ninety days,” she says. “That’s a real number. They hate those.”',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 12,
    title: 'Lanterns at Mirefen',
    briefings: [
      {
        id: 'mothers-ask-moles',
        source: 'A Saltroad peddler',
        text: 'The Mire Mothers have asked the Moles for help against the raiders.',
        truth: false,
      },
      {
        id: 'mirefen-raiders',
        source: 'Mirefen reed-cutters',
        text: 'Raiders camp at the edge of the Mirefen, close to the lantern-houses.',
        truth: true,
      },
      {
        id: 'lanterns-again',
        source: 'Hollow Bell night watch',
        text: 'Lanterns move through the empty fen again. In step.',
        truth: true,
        variants: [
          {
            flags: ['mire-road-closed'],
            notFlags: ['d03-mire-road-reopened'],
            text: 'Lanterns move through the empty fen again. In step. They stop at the road the crown closed, and wait there.',
          },
          {
            flags: ['mire-quiet-count'],
            source: 'The sergeant who counted the Mirefen road',
            text: 'Lanterns move through the empty fen again, in step. The sergeant counted them from the wall. Fewer than the first night.',
          },
        ],
      },
    ],
    komodo:
      'The Moles would flood their own tunnels before they helped a fen-witch, Your Majesty. The raiders are real. Whether the Mothers told you everything is another matter.',
    quests: [],
    audiences: [
      {
        id: 'd12-mire-protection',
        title: 'Lanterns at Mirefen',
        speaker: 'Sister Reedlight of the Mire Mothers',
        npc: 'sister-reedlight',
        faction: 'mire-mothers',
        lines: [
          'Sister Reedlight comes up the carpet in fen mud to her knees. Two small children hold the hem of her reed cloak, one each side, like a boat they were told not to let drift. Her green lantern’s flame stands dead still.',
          'Raiders at the fen’s edge, Your Majesty. A stone’s throw from our lantern-houses. Three nights, with torches. We have children there.',
          'We are only refugees. We ask the crown’s protection. Nothing else.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Outriders count thirty blades at the fen’s edge, Your Majesty. The raiders are real. What I can’t count is what the Mothers keep in those houses. Nobody who tried could.',
          },
        ],
        options: [
          {
            id: 'ask-raiders',
            label:
              'Ask what raiders want from a fen with no grain and no brass.',
            effects: {},
            response:
              'Sister Reedlight’s hands tighten on the two small heads at her side.',
            next: 'grievance',
          },
          {
            id: 'recall-road',
            label:
              'Ask why the Mothers come back to a throne that closed the road on them.',
            requires: { flags: ['mire-road-closed'] },
            effects: {},
            response:
              'For the first time, Sister Reedlight looks at you without smiling.',
            next: 'closed-road',
          },
          {
            id: 'recall-count',
            label:
              'Tell her the escort counted heads that first night. Ask her to count again.',
            requires: { flags: ['mire-quiet-count'] },
            effects: {},
            response:
              '“You counted us,” she says pleasantly. “Of course you did.”',
            next: 'count',
          },
          {
            id: 'defend',
            label: 'Send a party to hold the Mirefen edge.',
            effects: {},
            response:
              'Sister Reedlight bows. The children copy her, a beat late. Her lantern does not flicker.',
            postsQuests: ['q-d12-mirefen-defense'],
          },
          {
            id: 'investigate',
            label:
              'Promise protection. Send someone to see the lantern-houses’ cellars.',
            effects: {},
            response:
              '“You are so kind,” says Sister Reedlight. Her lantern flickers. One child looks up at it, frightened. It has never done that before.',
            postsQuests: ['q-d12-mirefen-defense', 'q-d12-mirefen-cellars'],
          },
          {
            id: 'decline',
            label: 'The crown cannot spare anyone for the fen.',
            effects: { affinity: { 'mire-mothers': -10, moles: 5 } },
            response:
              'Sister Reedlight leaves without a word, the children trotting after. By nightfall the Moles have heard. They drink to the crown in three tunnels.',
          },
          {
            id: 'swear-unsearched',
            label:
              'Hold the edge, and swear before the court that no one of the crown’s will set foot in the lantern-houses.',
            effects: {
              affinity: { 'mire-mothers': 10 },
              local: { lamplight: -2 },
              flags: ['d12-houses-sworn'],
              schedule: ['d12-low-carrow-names'],
            },
            response:
              'Sister Reedlight’s lantern stands dead still. “Sworn,” she says. “The fen heard it.” In the gallery Keeper Vellum closes his book.',
            postsQuests: ['q-d12-mirefen-defense'],
          },
        ],
        beats: [
          {
            id: 'grievance',
            lines: [
              '“Raiders want bread and brass. The fen has neither.” Her voice does not change. “These want something else. Something they say the Mothers have.”',
              '“They are from Sedgewick and Low Carrow, up the dry river. Grief has made them stupid. They walk the fen’s edge at night with torches, shouting names into the reeds.”',
              {
                who: 'A young lantern-bearer at the back of the Mothers’ escort, holding a green lantern',
                text: 'Children’s names, Majesty. The same eleven, every night. I know them all.',
              },
              '“Hush,” says Sister Reedlight, without turning. The young lantern-bearer hushes.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Sedgewick and Low Carrow lost children to a fever two winters ago, Your Majesty. So the Archive wrote. Think hard before the crown finds out it was not a fever. Some doors belong to whoever opens them.',
              },
            ],
            options: [
              {
                id: 'defend',
                label:
                  'Hold the fen edge anyway. There are children in those houses now.',
                effects: {},
                response:
                  'Sister Reedlight bows low. “The fen remembers kindness.” Behind her the young lantern-bearer with the green lantern is still mouthing names.',
                postsQuests: ['q-d12-mirefen-defense'],
              },
              {
                id: 'investigate',
                label:
                  'Hold the edge. While the Mothers watch the raiders, send someone into the cellars.',
                effects: {},
                response:
                  '“You are so kind,” says Sister Reedlight. Her lantern gutters. Somewhere under it, a door has opened. The young lantern-bearer meets your eyes. Nods once.',
                postsQuests: ['q-d12-mirefen-defense', 'q-d12-mirefen-cellars'],
              },
              {
                id: 'decline',
                label:
                  'Grief is not the crown’s quarrel. Neither is the fen. Send no one.',
                effects: { affinity: { 'mire-mothers': -10, moles: 5 } },
                response:
                  'Sister Reedlight leaves without a word. The Moles hear by nightfall. Later, so do the villages up the dry river.',
              },
              {
                id: 'hear-raiders',
                label:
                  'Tell the raiders to drop the torches and bring their grievance to court. Send no party.',
                effects: {
                  affinity: { 'mire-mothers': -10 },
                  local: { lamplight: 2, 'gate-watch': -1 },
                  flags: ['d12-raiders-heard'],
                },
                response:
                  'Sister Reedlight gathers the children and goes. Two days later a Low Carrow carter brings eleven names, written large by someone who learned letters to write them. That night every window in the lantern-houses goes dark at once.',
              },
              {
                id: 'swear-unsearched',
                label:
                  'Hold the edge, and swear before the court that no one of the crown’s will set foot in the lantern-houses.',
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  local: { lamplight: -2 },
                  flags: ['d12-houses-sworn'],
                  schedule: ['d12-low-carrow-names'],
                },
                response:
                  'Sister Reedlight’s lantern stands dead still. “Sworn,” she says. “The fen heard it.” The young lantern-bearer at the back closes her eyes and stops mouthing names.',
                postsQuests: ['q-d12-mirefen-defense'],
              },
              {
                id: 'names-first',
                label:
                  'Ask the Mothers to say the eleven names, here, before a single blade goes to the fen.',
                effects: {
                  affinity: { 'mire-mothers': -5 },
                  local: { lamplight: 2 },
                  flags: ['d12-names-spoken'],
                },
                response:
                  'Sister Reedlight says them. All eleven. In the order the raiders shout them. She has been listening too. Then she asks again for the blades, and the crown sends them.',
                postsQuests: ['q-d12-mirefen-defense'],
              },
            ],
          },
          {
            id: 'closed-road',
            lines: [
              '“You closed the road, Your Majesty, and forty-one lanterns turned back into the fen. Thirty-six came home. The raiders found the other five in the reeds.”',
              '“I have not come to ask what the tower owes the five. The Mothers forgive you. Once. That is rarer than rain.”',
              '“The raiders who found them camp at our door now. I would like the people who closed the road to stand on it.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Forgiveness from the Mire Mothers, Your Majesty. I have never heard of it. I would like to know what it costs.',
              },
            ],
            options: [
              {
                id: 'defend',
                label: 'Stand on the road this time. Hold the Mirefen edge.',
                effects: {},
                response:
                  'Sister Reedlight inclines her head. “Then the forgiveness is spent,” she says. “Well spent.”',
                postsQuests: ['q-d12-mirefen-defense'],
              },
              {
                id: 'investigate',
                label:
                  'Hold the edge. Send someone to see what the Mothers keep in their cellars.',
                effects: {},
                response:
                  '“Kind,” she says, “and still careful.” Her lantern flickers. “Careful is how the five ended up in the reeds. Be careful of careful.”',
                postsQuests: ['q-d12-mirefen-defense', 'q-d12-mirefen-cellars'],
              },
              {
                id: 'decline',
                label:
                  'The road was closed for a reason. The crown will not be shamed onto it.',
                effects: { affinity: { 'mire-mothers': -10, moles: 5 } },
                response:
                  'Sister Reedlight looks at you until you look away first. “Then I withdraw it,” she says. “It was never for you. It was for the five.”',
              },
              {
                id: 'apologize',
                label:
                  'Apologize before the court, pay blood-price to the five families, and hold the edge.',
                requires: { cost: 20 },
                effects: {
                  affinity: { 'mire-mothers': 10 },
                  local: { 'gate-watch': -2, 'old-houses': -1 },
                  flags: ['d12-road-apology'],
                },
                response:
                  'The hall goes quiet. Captain Dunmark’s jaw sets. His Watch closed that road on your order, and now the crown has called it wrong in public. Sister Reedlight counts the brass into five piles. “The fen will remember this.” It is not a threat.',
                postsQuests: ['q-d12-mirefen-defense'],
              },
            ],
          },
          {
            id: 'count',
            lines: [
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Forty-one went into the fen that night, Your Majesty. Our escort counted them at the reeds. Last night the reed-cutters counted lit windows in the lantern-houses. One lantern to a soul, the Mothers’ custom. Forty-four.',
              },
              '“Babies are born, Your Majesty,” says Sister Reedlight. “Even in the fen.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Three, in ten days. A fertile fen.',
              },
              'Sister Reedlight smiles. The two children at her hem do not. One of them, you see now, is no newt. A small, sleepy-eyed vole in a reed cloak much too big for him.',
              '“The raiders, Your Majesty. Will the crown hold the edge, or go on counting?”',
            ],
            options: [
              {
                id: 'defend',
                label: 'Hold the edge. The counting can wait.',
                effects: {},
                response:
                  'Sister Reedlight bows. The little vole yawns and is hushed.',
                postsQuests: ['q-d12-mirefen-defense'],
              },
              {
                id: 'investigate',
                label:
                  'Hold the edge. Send someone into the cellars to finish the count.',
                effects: {},
                response:
                  '“You are so kind,” says Sister Reedlight. “And so careful.” Her lantern flickers twice.',
                postsQuests: ['q-d12-mirefen-defense', 'q-d12-mirefen-cellars'],
              },
              {
                id: 'decline',
                label:
                  'Send no one. Forty-four lanterns can light their own way.',
                effects: { affinity: { 'mire-mothers': -10, moles: 5 } },
                response:
                  'Sister Reedlight leaves. The little vole looks back at the throne all the way down the hall.',
              },
              {
                id: 'ask-raiders',
                label: 'Ask what the raiders say the Mothers took.',
                effects: {},
                response:
                  '“You will hear it anyway,” she says. “Better from me.”',
                next: 'grievance',
              },
            ],
          },
        ],
      },
      D12_CISTERN,
    ],
  },
  {
    day: 13,
    title: 'The Saffron Deal',
    briefings: [
      {
        id: 'pack-thirsty',
        source: 'Jackalwire deserters',
        text: 'The Pack’s water engine broke a week ago. The canyon is drying out.',
        truth: true,
      },
      {
        id: 'saffron-letter',
        source: 'The barracks',
        text: 'Saffron Kett got a letter sealed with a painted feather.',
        truth: true,
      },
      {
        id: 'pack-surrender',
        source: 'A Gate Watch rumor',
        text: 'Gristle Vane will surrender the canyon to the crown for water.',
        truth: false,
      },
    ],
    komodo:
      'Vane would sell his coat before he surrendered anything, Your Majesty. But a thirsty Pack makes deals. Ask Saffron what is in that letter.',
    quests: [],
    audiences: [
      {
        id: 'd13-saffron-deal',
        title: 'The Saffron Deal',
        speaker: 'Captain Gristle Vane and Saffron Kett',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        requires: { follower: 'F002' },
        lines: [
          'Captain Gristle Vane fills the doorway first. His greatcoat bears a hundred painted feathers, an ear-chain jangling above the canyon dust in every seam. He bows to the throne. Then, slower, to Saffron beside it.',
          'Our engine is broken, Majesty. One person alive knows how it was built. She’s standing beside you, pretending not to know me.',
          {
            who: 'Saffron Kett',
            npc: 'F002',
            text: 'I don’t know him.',
          },
          'Saffron says it to her toolkit. She holds it in both arms like a shield.',
          'Lend us Saffron two days. The Pack has a long memory for kindness. A longer one for the other thing.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The canyon has been dry a week, Your Majesty. A thirsty Pack goes looking for water. The nearest belongs to Hollow Bell.',
          },
        ],
        options: [
          {
            id: 'ask-engine',
            label: 'Ask Vane how the engine came to break.',
            effects: {},
            response: 'Vane’s grin stays put. His ear-chain stops jangling.',
            next: 'broken',
          },
          {
            id: 'lend',
            label: 'Let Saffron go and fix it, if she chooses.',
            effects: {},
            response:
              'Saffron looks at you. Then at Vane. “Two days. I bring my own tools.”',
            postsQuests: ['q-d13-water-engine'],
          },
          {
            id: 'sabotage',
            label: 'Agree. Have the engine quietly fixed to fail in a month.',
            effects: { local: { 'gate-watch': 1 } },
            response:
              'Vane is delighted. Saffron won’t do this repair, so Saffron need not know. Komodo writes nothing down. So he heard.',
            postsQuests: ['q-d13-engine-sabotage'],
          },
          {
            id: 'refuse',
            label: 'Refuse. Saffron serves the crown now.',
            effects: {
              affinity: { jackalwire: -10, 'hollow-bell': 3 },
            },
            response:
              'Vane bows deep, all his feathers whispering. Saffron does not look at either of you the rest of the day.',
          },
          {
            id: 'medicine-debt',
            label:
              'Remind Vane who paid for the Pack’s dust-lung tincture. Ask him to share the water with Hollow Bell.',
            requires: { flags: ['pack-medicine'] },
            effects: {
              affinity: { jackalwire: -5, 'hollow-bell': 10 },
              flags: ['d13-water-shared'],
            },
            response:
              'Vane is quiet a long moment. “The pups at the bridge camp breathe because of you. That buys this.” He spits in his palm and holds it out. Saffron makes a sound that, in a better week, would have been a laugh.',
            postsQuests: ['q-d13-water-engine'],
          },
        ],
        beats: [
          {
            id: 'broken',
            lines: [
              '“Broke? It was broken, Majesty. Somebody came down the canyon in the dark with a crowbar and knew which pin to pull.”',
              '“The engine drinks from the seam that feeds Hollow Bell’s stream. It runs, their stream drops a hand’s width. It stopped, their stream came back.” He shows every tooth. “I know who pulled the pin. So does their mayor. I’ve done nothing. Yet.”',
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: 'I built it to sip, not gulp. You lot took the governor off the week I left, didn’t you. Course somebody from the Bell came with a crowbar. I’d have come myself.',
              },
              'Vane waits. He has wagons. The Bell has a bell.',
            ],
            options: [
              {
                id: 'lend',
                label:
                  'Let Saffron fix it, if she chooses. The canyon is thirstier tonight than the Bell.',
                effects: {},
                response:
                  'Saffron looks at Vane. “Two days. My tools. The governor goes back on, and if anyone takes it off again I come back for it.” Vane laughs. Nobody else does.',
                postsQuests: ['q-d13-water-engine'],
              },
              {
                id: 'sabotage',
                label:
                  'Agree, and have it fixed to fail in a month, when the Bell needs its stream most.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  'Vane is delighted. Saffron won’t do this repair, so Saffron need not know. She does not look at you as she leaves. She knows the sound of a decision kept from her.',
                postsQuests: ['q-d13-engine-sabotage'],
              },
              {
                id: 'refuse',
                label:
                  'Refuse. Saffron serves the crown now. The canyon can find its own water.',
                effects: {
                  affinity: { jackalwire: -10, 'hollow-bell': 3 },
                },
                response:
                  'Vane bows deep. Saffron does not look at either of you all day. That night the Yard hears her filing metal in the dark workshop. For hours.',
              },
              {
                id: 'warn-bell',
                label:
                  'Lend Saffron, but warn Mara Reedbell first: the engine runs again, and her stream will drop.',
                effects: {
                  affinity: { 'hollow-bell': 5, jackalwire: -5 },
                  flags: ['d13-bell-warned'],
                },
                response:
                  'Vane’s smile thins. “You warned the people who broke it. Kind. A week to fill their cisterns. A week to find another crowbar.” Saffron is already packing. She takes no side out loud.',
                postsQuests: ['q-d13-water-engine'],
              },
              {
                id: 'name-culprit',
                label:
                  'Ask Vane who held the crowbar. Promise the crown will judge them.',
                effects: {
                  affinity: { jackalwire: 5, 'hollow-bell': -10 },
                  local: { 'gate-watch': 1 },
                  flags: ['d13-bell-saboteur-named'],
                },
                response:
                  'Vane whispers it. A miller’s son from Hollow Bell, seventeen. His mother’s wheel had stopped. A Watch rider leaves for the Bell within the hour. Mara Reedbell will hear the hooves before the reason. The engine stays broken. Vane says justice will do to drink, for now.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 14,
    title: 'A Sick Courier',
    briefings: [
      {
        id: 'fever-plague',
        source: 'A frightened stablehand',
        text: 'The courier’s fever is a plague. Half the ford has it.',
        truth: false,
      },
      {
        id: 'courier-down',
        source: 'Eastern Ford ferrymen',
        text: 'A Saltroad courier collapsed at the ford with a fever and a sealed satchel.',
        truth: true,
      },
      {
        id: 'archive-maps',
        source: 'The Lamplight Archive',
        text: 'The Archive’s old maps are crumbling faster than they can be copied.',
        truth: true,
      },
    ],
    komodo:
      'One courier is not a plague, Your Majesty. A satchel nobody may open is more interesting than a fever. Send steady hands.',
    quests: ['q-d14-sick-courier'],
    audiences: [
      {
        id: 'd14-archive-funds',
        title: 'Crumbling Maps',
        speaker: 'Keeper Abelard Vellum of the Lamplight Archive',
        npc: 'abelard-vellum',
        faction: 'lamplight',
        lines: [
          'Keeper Vellum, in ink-dark robes, takes his time crossing the throne room. He does not apologize.',
          '“The old maps are dust in their cases, Majesty. Roads, wells, tunnels nobody living remembers. Copying costs ink, paper and time. Mostly time.”',
          '“I brought one.” He unrolls it on the dais step. A corner lifts in the draught and drifts across the floor like a leaf. The Watch lets it go. “That,” says Keeper Vellum, “was the Eastern Ford, before the Ford moved.”',
        ],
        options: [
          {
            id: 'ask-which',
            label: 'Ask which maps are crumbling first.',
            effects: {},
            response:
              'Keeper Vellum blinks. Slowly. He has waited all year for someone to ask.',
            next: 'shelves',
          },
          {
            id: 'fund',
            label: 'Fund the copying.',
            requires: { cost: 20 },
            effects: { local: { lamplight: 4 }, flags: ['maps-copied'] },
            response:
              'The scribes cheer, quietly, as scribes do. Keeper Vellum nods once and goes back to work.',
          },
          {
            id: 'decline',
            label: 'The crown needs its brass for the living.',
            effects: { local: { lamplight: -2 } },
            response:
              'The Archive bows and saves what it can alone. The corner of the Ford is swept up with the morning dust.',
          },
        ],
        beats: [
          {
            id: 'shelves',
            lines: [
              '“The oldest crumble first, and the oldest are the strangest. The tunnels under the Ford. The old road to the Abbey of the Silent Bell, and plans of what stood on that hill before the Abbey.” A long pause, even for him. “Those last are borrowed often. Always returned. Always more worn.”',
              '“The newest are the trade roads. The Ledger would pay to copy those, if it keeps the copies and sells the routes.”',
              {
                who: 'Factor Marisol Tallow',
                npc: 'marisol-tallow',
                text: 'Half the cost, Majesty, today, and the Archive keeps working. The Ledger asks only to own what it pays for.',
              },
              '“Paper does not care who owns it,” says Keeper Vellum. “I do.”',
            ],
            options: [
              {
                id: 'fund',
                label:
                  'Fund the copying from the treasury. Every copy stays in the Archive.',
                requires: { cost: 20 },
                effects: { local: { lamplight: 4 }, flags: ['maps-copied'] },
                response:
                  'The scribes cheer, quietly. Keeper Vellum nods once and goes back to work. Factor Tallow writes a small note in a small book.',
              },
              {
                id: 'decline',
                label:
                  'The crown needs its brass for the living. The dead roads can wait.',
                effects: { local: { lamplight: -2 } },
                response:
                  '“The dead roads have waited a long time,” says Keeper Vellum. He bows, and saves what he can alone.',
              },
              {
                id: 'abbey-first',
                label:
                  'Fund it, but copy the Abbey road and the hill’s plans first, and lock them away.',
                requires: { cost: 20 },
                effects: {
                  local: { lamplight: 2 },
                  affinity: { abbey: -5 },
                  flags: ['maps-copied', 'd14-abbey-maps-first'],
                },
                response:
                  'Keeper Vellum looks at you over his spectacles, a long, slow moment. “Yes. That is wise.” Two days later a sister in grey asks the Archive, politely, to borrow a map no longer on its shelf.',
              },
              {
                id: 'ledger-copies',
                label:
                  'Let the Ledger pay for the copying and keep the trade-road copies.',
                effects: {
                  local: { ledger: 2, lamplight: -1 },
                  affinity: { saltroad: -5 },
                  flags: ['d14-ledger-owns-roads'],
                },
                response:
                  'Factor Tallow pays on the spot. By week’s end the Saltroad buys copies of its own roads at a Ledger stall. The oldest cases, the ones nobody paid for, are emptier every morning.',
              },
            ],
          },
        ],
      },
      {
        id: 'd14-hollin',
        title: 'The Old Mapmaker',
        speaker: 'Hollin Moss of the Lamplight Archive',
        faction: 'lamplight',
        requires: { local: { lamplight: 12 } },
        lines: [
          'An elderly keeper comes in through a high window. Three tries. He settles on the back of the petitioners’ bench. The first two did not happen.',
          'The Archive speaks well of the throne, Majesty. I came to see. I am old and fly slow. I remember roads nobody else does.',
          'If the court has a bed for an archivist, I would like to see some of those roads again before I die.',
          {
            who: 'Keeper Abelard Vellum, from the gallery',
            npc: 'abelard-vellum',
            text: 'Half the roads he drew are only in his head, Majesty. If he dies on a road, the road dies with him.',
          },
        ],
        options: [
          {
            id: 'welcome',
            label: 'There is a bed for you, Hollin.',
            effects: { recruitable: ['F019'], local: { lamplight: 1 } },
            response:
              'Hollin blinks once, slowly. Vellum bows from the gallery, slower. “Send him back to me when he is dying,” he says. “I will need a week.”',
          },
          {
            id: 'archive',
            label: 'The Archive needs you more.',
            effects: { local: { lamplight: 2 } },
            response:
              '“Wisely said,” says Hollin. He flies home by the window. It takes him two tries.',
          },
          {
            id: 'dictate',
            label:
              'Take him at court. Pay a scribe to sit with him every night until the roads are on paper.',
            requires: { cost: 10 },
            effects: {
              recruitable: ['F019'],
              local: { lamplight: 2 },
              flags: ['d14-hollin-dictates'],
            },
            response:
              'Hollin looks at the scribe, then at you. “Every night,” he says. “Owls are awake at night. Scribes are not.” The scribe goes grey by the second week. The shelves fill.',
          },
        ],
      },
    ],
  },
  {
    day: 15,
    title: 'Glass Feathers',
    briefings: [
      {
        id: 'salvagers-arrive',
        source: 'The Gate Watch',
        text: 'Rustline salvagers are at the gate with a crate of glass shaped like feathers.',
        truth: true,
      },
      {
        id: 'rustline-army',
        source: 'Lady Vask’s steward',
        text: 'The Rustline has an army of a thousand rats in the rail yards.',
        truth: false,
      },
      {
        id: 'glass-hums',
        source: 'Pell, a salvage mechanic',
        text: 'The glass hums when the Hollow Bell rings.',
        truth: true,
      },
    ],
    komodo:
      'A thousand rats would have eaten the rail yards bare, Your Majesty. The humming glass is the story. Glass should not hum.',
    quests: [],
    audiences: [
      {
        id: 'd15-glass-feathers',
        title: 'Glass Feathers',
        speaker: 'Jinx Coupler of the Rustline',
        npc: 'jinx-coupler',
        faction: 'rustline',
        lines: [
          'Jinx Coupler, in a bottle-cap coat, struts in ahead of Pell pushing a crate. “Jinx Coupler, Yardboss of the Rustline. That’s Pell. He lifts things.”',
          '“Old-world glass, Majesty, shaped like feathers. Won’t break. Hums when the Bell rings. The Ledger wants to buy it. The Archive wants to study it. I want to know which one the crown is.”',
          {
            who: 'Pell Quickmarrow',
            npc: 'F014',
            text: 'Listen.',
          },
          'Pell flicks one feather with a claw. It rings, thin and high. The hall holds its breath. Far to the east, faint enough to doubt, an answer.',
          'In the gallery the Ledger’s factor has waited since dawn, with a purse. The Archive’s scribes since before dawn, without one.',
        ],
        options: [
          {
            id: 'ask-found',
            label: 'Ask Jinx where in the rail yards the feathers were found.',
            effects: {},
            response:
              'Jinx glances at Pell. Pell studies the ceiling. They are agreeing on what the question is worth.',
            next: 'vault',
          },
          {
            id: 'study',
            label: 'Have the Archive study it before anyone sells it.',
            effects: { affinity: { rustline: -5 } },
            response:
              'Jinx grins. “The studying kind.” The grin does not last to the door. The Yard was counting on a sale.',
            postsQuests: ['q-d15-study-glass'],
          },
          {
            id: 'buy',
            label: 'Buy the crate for the treasury.',
            requires: { cost: 30 },
            effects: {
              affinity: { rustline: 10 },
              local: { ledger: 2 },
              items: ['surveyors-glass'],
              recruitable: ['F014'],
              flags: ['rustline-crate-bought'],
            },
            response:
              'Jinx counts the brass. Pell Quickmarrow throws in a surveyor’s lens. “For the next crate.” He lingers at the gate, looking at the barracks.',
          },
          {
            id: 'send-away',
            label: 'Old-world relics bring trouble. Send them away.',
            effects: { affinity: { rustline: -10 }, local: { lamplight: -2 } },
            response:
              'Jinx shrugs. Pell wheels the crate toward the Ledger’s stalls. In the gallery, a purse is already open.',
          },
        ],
        beats: [
          {
            id: 'vault',
            lines: [
              '“Under the yards there’s a car that never left the station. Old-world sealed, Majesty. Laughs at crowbars. Took Pell three nights to talk it open.”',
              {
                who: 'Pell Quickmarrow',
                npc: 'F014',
                text: 'Straw inside, packed like eggs. A hundred slots, maybe more. Ours were the last dozen. The rest of the straw was fresh-crushed. Not a hundred years. A month.',
              },
              '“So somebody else knows the way in,” says Jinx, “and has been shopping. I don’t like being second. I like unpaid less. The Yard has forty mouths and no harvest. Studying feeds nobody.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Somebody bought eighty-odd feathers of singing glass this month, Your Majesty, and this market never heard a whisper. The strangest thing I have heard all year.',
              },
            ],
            options: [
              {
                id: 'study',
                label:
                  'Have the Archive study these. Find out what the other eighty are for.',
                effects: { affinity: { rustline: -5 } },
                response:
                  'Jinx sighs. “The studying kind.” A claw taps the crate. “Starving is boring too. Only slower.” That week two Rustline kits are caught eating the Archive’s paste.',
                postsQuests: ['q-d15-study-glass'],
              },
              {
                id: 'buy',
                label:
                  'Buy the crate for the treasury, before the other buyer does.',
                requires: { cost: 30 },
                effects: {
                  affinity: { rustline: 10 },
                  local: { ledger: 2 },
                  items: ['surveyors-glass'],
                  recruitable: ['F014'],
                  flags: ['rustline-crate-bought'],
                },
                response:
                  'Jinx counts the brass twice, for luck. Pell throws in a surveyor’s lens. “For the next crate,” he says. “If there is one.” He lingers at the gate, looking at the barracks.',
              },
              {
                id: 'send-away',
                label:
                  'Whoever buys singing glass by the hundred, the crown wants no part of it. Send it away.',
                effects: {
                  affinity: { rustline: -10 },
                  local: { lamplight: -2 },
                },
                response:
                  'Jinx shrugs. Pell wheels the crate toward the Ledger’s stalls. He looks back once at the barracks, then at you. He expected better.',
              },
              {
                id: 'finders-fee',
                label:
                  'Have the Archive study them. Pay the Rustline a finder’s fee so the yard eats meanwhile.',
                requires: { cost: 15 },
                effects: {
                  affinity: { rustline: 5 },
                  local: { ledger: -2 },
                },
                response:
                  'Jinx bites the coin and bows with a rattle of bottle caps. In the gallery Factor Tallow snaps her purse shut. Outbid by a crown that isn’t even buying.',
                postsQuests: ['q-d15-study-glass'],
              },
              {
                id: 'watch-car',
                label:
                  'Pay Jinx to reseal the old car and watch it with a hooded lantern.',
                requires: { cost: 20 },
                effects: {
                  affinity: { rustline: 5 },
                  local: { ledger: 1, lamplight: -1 },
                  flags: ['d15-vault-watched'],
                  schedule: ['vault-watched'],
                },
                response:
                  'Jinx takes the brass and, being Jinx, sells the crate to the Ledger on the way out. That night two Rustline lookouts settle into the rail yards with a hooded lantern and a whistle each. They watch an empty car.',
              },
              {
                id: 'sell-to-tallow',
                label:
                  'Let the Ledger buy the crate tonight. The Rustline eats.',
                effects: {
                  affinity: { rustline: -5 },
                  local: { ledger: 3, lamplight: -2 },
                  flags: ['d15-feathers-to-ledger'],
                },
                response:
                  'Factor Tallow pays triple without counting. “A buyer in the east will be so pleased,” she says, and stops. The Rustline eats that night. Jinx does not thank the crown. “Sold to the Ledger by a throne that wouldn’t buy,” she says, and spits.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 16,
    title: 'Three Haystacks',
    briefings: [
      {
        id: 'grain-missing',
        source: 'The Yard’s foreman',
        text: 'Grain is going missing between the Freehold fields and the fortress.',
        truth: true,
      },
      {
        id: 'mice',
        source: 'Lady Vask’s steward',
        text: 'Mice ate the missing grain.',
        truth: false,
      },
      {
        id: 'heavy-hay',
        source: 'A Freehold carter',
        text: 'Three haystacks on the Freehold road are too heavy for hay.',
        truth: true,
        variants: [
          {
            flags: ['d05-granary-seized'],
            text: 'Three haystacks on the Freehold road are too heavy for hay. The Old Houses started hiding grain the week the Watch opened their granary.',
          },
        ],
      },
    ],
    komodo:
      'Mice with an Old House steward to speak for them, Your Majesty. Lucky mice.',
    quests: ['q-d16-hidden-grain'],
    audiences: [
      {
        id: 'd16-hoarders',
        title: 'Grain in a Drought',
        speaker: 'Foreman Dunmore Ash and Lady Ottoline Vask',
        npc: 'dunmore-ash',
        faction: 'yard',
        lines: [
          'Foreman Dunmore Ash drops an empty flour sack on the step of the dais. It makes almost no sound. Lady Ottoline Vask follows, rings clicking on her wingtips. She looks at the sack like a dead bird carried indoors.',
          'The Yard is on half rations, Majesty, and the Old Houses’ granaries are full. Make them share.',
          {
            who: 'Lady Ottoline Vask',
            npc: 'ottoline-vask',
            text: 'The Old Houses saved in good years, Majesty, while others ate. Is prudence a crime now?',
          },
          'Dunmore does not answer her. He picks a husk off the sack and puts it in his mouth.',
        ],
        options: [
          {
            id: 'ask-vask',
            label:
              'Ask Lady Vask what the Old Houses are saving the grain for.',
            effects: {},
            response: 'Lady Vask’s rings stop clicking.',
            next: 'spoken-for',
          },
          {
            id: 'requisition',
            label: 'Requisition the Old Houses’ grain for the Yard.',
            effects: {
              local: { yard: 4, 'old-houses': -4 },
              flags: ['d16-granary-requisitioned'],
            },
            response: 'Dunmore nods once. Lady Vask writes something down.',
          },
          {
            id: 'buy',
            label: 'Buy the Old Houses’ surplus at a fair price.',
            requires: { cost: 25 },
            effects: {
              local: { yard: 2, 'old-houses': 1 },
              flags: ['d16-surplus-bought'],
            },
            response:
              'Lady Vask names the fair price. It is not. The crown pays it. Dunmore carries the first sack out himself.',
          },
          {
            id: 'leave',
            label: 'Prudence is not a crime.',
            effects: {
              local: { yard: -3, 'old-houses': 2 },
              flags: ['d16-grain-sold-east'],
            },
            response:
              'Dunmore leaves without a word. The Yard is quiet at supper.',
          },
          {
            id: 'council-vote',
            label:
              'Put it to the open council, where the Yard sits beside the Old Houses.',
            requires: { flags: ['open-council'] },
            effects: { local: { yard: 2, 'old-houses': -1, lamplight: 1 } },
            response:
              'The council argues until the lamps are lit. The Yard eats half rations one more night. The granaries split down the middle, and both sides leave sure they were robbed. Dunmore picks his sack back up. Not quite empty.',
          },
        ],
        beats: [
          {
            id: 'spoken-for',
            lines: [
              '“Spoken for, Majesty.” Lady Vask smooths a feather that needs none. “A buyer at the far border pays three times the Ledger’s price. In advance. In silver.”',
              '“Take that grain and the Old Houses break a contract with people who do not, I am told, accept apologies. Better the Yard hungry a fortnight.”',
              '“A fortnight,” says Dunmore Ash. It is all he says. He says it to the empty sack.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Which buyer, my lady?',
              },
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'One who pays in advance, Komodo, and asks little about the grain.',
              },
            ],
            options: [
              {
                id: 'requisition',
                label:
                  'Requisition it anyway. Whoever the buyer is, the Yard eats first.',
                effects: {
                  local: { yard: 4, 'old-houses': -4 },
                  flags: ['d16-granary-requisitioned'],
                },
                response:
                  'Dunmore nods once and shoulders the sack. Lady Vask writes something down. Then something under it. She underlines it twice.',
              },
              {
                id: 'buy',
                label:
                  'Buy the surplus at a fair price, so the Houses can repay their buyer.',
                requires: { cost: 25 },
                effects: {
                  local: { yard: 2, 'old-houses': 1 },
                  flags: ['d16-surplus-bought'],
                },
                response:
                  'The crown pays. Dunmore carries the first sack out himself. Next morning Lady Vask sends the silver back east with a sealed letter.',
              },
              {
                id: 'leave',
                label: 'A contract is a contract. Prudence is not a crime.',
                effects: {
                  local: { yard: -3, 'old-houses': 2 },
                  flags: ['d16-grain-sold-east'],
                },
                response:
                  'Dunmore leaves the sack where it lies. Supper in the Yard is quiet. By morning PRUDENCE is written on the Old Houses’ granary door in flour paste.',
              },
              {
                id: 'seize-silver',
                label:
                  'Requisition the grain. Seize the buyer’s silver for the treasury too.',
                effects: {
                  brass: 20,
                  local: { yard: 2, 'old-houses': -3, ledger: -2 },
                  affinity: { 'black-verge': -5 },
                  flags: ['d16-border-silver-seized'],
                  schedule: ['verge-change'],
                },
                response:
                  'The silver is heavier than brass, and colder. The clerk who counts it shivers all evening. Lady Vask says nothing. The Ledger asks in writing what precedent the crown thinks it has set. The Yard eats. It does not ask where the grain was going.',
              },
              {
                id: 'follow-grain',
                label:
                  'Let the grain go east. Put a rider on the carts and see who eats it.',
                effects: {
                  local: { yard: -3, 'old-houses': 2, lamplight: 2 },
                  flags: ['d16-grain-followed', 'd16-grain-sold-east'],
                },
                response:
                  'Dunmore picks up the empty sack. Folds it. Puts it inside his coat. “I’ll keep this for when your rider comes back,” he says. The Yard eats half rations another fortnight.',
              },
            ],
          },
        ],
      },
      {
        id: 'd16-bandaged-paw',
        title: 'The Mapmaker Comes Back',
        speaker: 'A young informant with a bandaged paw',
        faction: 'jackalwire',
        requires: { flags: ['pack-camp-mapped'] },
        lines: [
          'She comes to the postern at dawn. The Watch nearly turns her away, then knows the bandage. Same paw, same dirty cloth: the young mapmaker who sold the crown a map of the Pack’s camp on a ration card.',
          'They know, Majesty. Somebody saw the card over the Watch’s fire and knew my drawing. I can’t draw good. That’s how.',
          'I’m not asking much. A bed in the Yard. A different name. I’ll scrub pots.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The crown paid ten brass for that map, Your Majesty. The price has gone up.',
          },
        ],
        options: [
          {
            id: 'ask-pack',
            label: 'Ask what the Pack will do if they find her.',
            effects: {},
            response:
              'She looks at her bandaged paw. Then she holds out the other. It is bandaged now too.',
            next: 'offer',
          },
          {
            id: 'shelter',
            label: 'Give her a bed in the Yard and a new name.',
            effects: {
              affinity: { jackalwire: -5 },
              local: { yard: 1, 'gate-watch': 1 },
              flags: ['d16-informant-sheltered'],
            },
            response:
              'She sleeps eighteen hours in the Yard’s loft. Within the week the Pack knows. Gristle Vane sends the crown one painted feather, snapped in half.',
          },
          {
            id: 'pay-east',
            label:
              'Give her brass for the Saltroad. Send her east, far from both of you.',
            requires: { cost: 10 },
            effects: {
              local: { 'gate-watch': -1 },
              flags: ['d16-informant-sent-east'],
            },
            response:
              'She takes the brass uncounted and is gone before the gate is open. The Watch grumbles: paid twice for one map, and lost the mapmaker.',
          },
          {
            id: 'turn-away',
            label:
              'The crown bought a map, not the mapmaker. Send her back to her own.',
            effects: {
              affinity: { jackalwire: 5 },
              local: { 'gate-watch': 1, yard: -2 },
              flags: ['d16-informant-returned'],
            },
            response:
              'She goes without arguing. That is the worst of it. A week later the Gate Watch takes the ration card down from over their fire. Nobody says why.',
          },
        ],
        beats: [
          {
            id: 'offer',
            lines: [
              '“Same as anyone who sells the camp. They don’t kill you. Waste. They walk you to the bridge and leave you on the far side. No water.”',
              '“Or.” She swallows. “Or you send me back. Say I was your prisoner and got away. And I keep drawing. Better this time. The Pack has a new camp. I know where.”',
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: 'The Watch wants that map, Majesty. I won’t pretend. But it was her paw on the card last time. It’ll be her neck on the next.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'It is a good offer, Your Majesty. She knows it. She is maybe fifteen. A spy caught twice is not left at a bridge.',
              },
            ],
            options: [
              {
                id: 'shelter',
                label:
                  'No more maps. Give her a bed in the Yard and a new name.',
                effects: {
                  affinity: { jackalwire: -5 },
                  local: { yard: 1, 'gate-watch': 1 },
                  flags: ['d16-informant-sheltered'],
                },
                response:
                  'She cries, short and furious, then asks where the pots are. Within the week the Pack knows. Gristle Vane sends the crown one painted feather, snapped in half.',
              },
              {
                id: 'pay-east',
                label: 'Give her brass for the Saltroad and send her east.',
                requires: { cost: 10 },
                effects: {
                  local: { 'gate-watch': -1 },
                  flags: ['d16-informant-sent-east'],
                },
                response:
                  'She looks almost disappointed. Then young. Fifteen at most. Then she is gone east with the morning caravan. Dunmark watches her go. He says nothing about his map.',
              },
              {
                id: 'turn-away',
                label:
                  'The crown stays out of the Pack’s quarrels. Send her back to her own.',
                effects: {
                  affinity: { jackalwire: 5 },
                  local: { 'gate-watch': 1, yard: -2 },
                  flags: ['d16-informant-returned'],
                },
                response:
                  'She goes without arguing. By nightfall the Yard knows the crown sold its informant back to the people she informed on. Supper is silent.',
              },
              {
                id: 'spy',
                label:
                  'Accept. Send her back as the crown’s eyes in the Pack. Pay her well.',
                requires: { cost: 10 },
                effects: {
                  affinity: { jackalwire: -5 },
                  local: { 'gate-watch': 2 },
                  flags: ['d16-informant-spy'],
                },
                response:
                  'She goes down the canyon road at dusk, brass sewn into her bandage. Four days later the new camp map arrives, drawn better. The next one is late. The Watch pins both above the fire and waits for the third.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 17,
    title: 'Midnight Choir',
    briefings: [
      {
        id: 'manifesto',
        source: 'The Gate Watch',
        text: 'A Mole manifesto was nailed to the fortress gate at midnight while someone sang below the walls.',
        truth: true,
      },
      {
        id: 'jackal-forgery',
        source: 'Young Komodo’s own runner',
        text: 'The manifesto is a Jackalwire forgery meant to turn the crown against the Moles.',
        truth: false,
        komodoLie: true,
        hindsight:
          'The manifesto was Granny Umber’s, every word. He broke the seal before you woke and handed you a forger instead.',
      },
      {
        id: 'reports-wrong',
        source: 'The Lamplight Archive',
        text: 'Four of the last ten morning reports were wrong in the same careful way.',
        truth: true,
      },
    ],
    komodo:
      'I read it before you woke, Your Majesty. A Jackalwire forgery, I am almost sure. Give it no audience. The Archive’s fuss about the reports is scribes being scribes.',
    quests: ['q-d17-who-lies'],
    audiences: [
      {
        id: 'd17-manifesto',
        title: 'Midnight Choir',
        speaker: 'Granny Umber of the Mole Revolutionaries',
        npc: 'granny-umber',
        faction: 'moles',
        lines: [
          'The singing below the walls has gone on since midnight. Low, patient, many voices, up through the flagstones. Granny Umber climbs the carpet on a cane of old pipe, mud to the knees. Young Komodo already holds the manifesto. Its wax seal is broken.',
          'We didn’t come to burn your tower, young ruler. The burrows are drowning. Your tax decree diverted the Ford.',
          'Your runner said the Ford tunnels were empty. Forty families live there. The water is at their beds.',
          'Give the burrows their water rights, or we take them. We’d rather you gave them.',
          {
            who: 'Captain Ferro Dunmark',
            npc: 'ferro-dunmark',
            text: '“Or we take them,” Majesty. In your hall. Her people sang it under your walls all night. A Freeholder says that, he’s in irons by noon.',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Long and angry, Your Majesty, and I am still nearly sure a Jackalwire hand helped write it. I would not keep her long.',
          },
        ],
        options: [
          {
            id: 'ask-seal',
            label: 'Ask Granny Umber who broke the seal.',
            effects: {},
            response:
              'Granny Umber squints at Komodo through thick spectacles a long moment before she answers you.',
            next: 'seal',
          },
          {
            id: 'ask-tunnels',
            label: 'Ask her about the forty families and the runner’s report.',
            effects: {},
            response:
              'Granny Umber leans on her cane. Her breath smells of wet earth. “Sit down, young ruler. It’s not a short answer.”',
            next: 'tunnels',
          },
          {
            id: 'meet',
            label: 'Open talks on the burrows’ water rights.',
            effects: {
              affinity: { moles: 15 },
              local: { 'old-houses': -2 },
              flags: ['mole-talks-opened'],
            },
            response:
              'Granny Umber squints at you. “Talks,” she says. “We’ll see if they’re worth the walk.”',
          },
          {
            id: 'arrest',
            label: 'Arrest the messenger for sedition.',
            effects: {
              affinity: { moles: -20 },
              local: { 'gate-watch': 2 },
              flags: ['mole-messenger-arrested'],
            },
            response:
              'The Watch takes Granny Umber away. She goes slowly. She is smiling.',
          },
          {
            id: 'ignore',
            label: 'Take Komodo’s advice. Ignore it.',
            effects: { affinity: { moles: -5 } },
            response:
              'Granny Umber is shown out. Komodo looks relieved. Then he looks like he wishes he hadn’t.',
          },
          {
            id: 'honest-count',
            label:
              'Remind her the crown once counted the burrow ledger honestly. Offer a survey of the flooded burrows.',
            requires: { flags: ['mole-ledger-counted'] },
            effects: {
              affinity: { moles: 5 },
              local: { lamplight: 1, 'old-houses': -1 },
              flags: ['d17-burrows-surveyed'],
            },
            response:
              '“You counted honest once,” Granny Umber allows. “Most thrones only count what they’re owed.” She taps her cane twice. Below the walls, the singing changes key.',
          },
        ],
        beats: [
          {
            id: 'seal',
            lines: [
              '“Tallow and my thumbprint,” says Granny Umber. “Your Watch took it off the gate whole. Somebody in your tower reads your mail before you do.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'I did, Your Majesty. It is my work. I broke it to see if it was poisoned. It was not. Only long.',
              },
              '“And the second page? We nailed two pages to your gate. The second was the forty families. Every name, every age. So the crown would know who it was drowning.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'There was one page when I read it, Your Majesty.',
              },
              'He holds it out. One page. Two nail holes at the top, two more a hand lower, where a second sheet could have hung behind it.',
            ],
            options: [
              {
                id: 'meet',
                label:
                  'Open talks on the water rights. Ask her to bring the names herself.',
                effects: {
                  affinity: { moles: 15 },
                  local: { 'old-houses': -2 },
                  flags: ['mole-talks-opened'],
                },
                response:
                  '“Talks,” says Granny Umber. “We’ll see if they’re worth the walk.” All the way to the doors, she does not look at Komodo.',
              },
              {
                id: 'arrest',
                label:
                  'Arrest her for sedition. Lost page or not, a threat nailed to the gate is a threat.',
                effects: {
                  affinity: { moles: -20 },
                  local: { 'gate-watch': 2 },
                  flags: ['mole-messenger-arrested'],
                },
                response:
                  'The Watch takes Granny Umber away, slow and smiling. Passing Komodo, she says something too quiet to hear. He does not answer.',
              },
              {
                id: 'ignore',
                label: 'Take Komodo’s word. One page, and a forgery.',
                effects: { affinity: { moles: -5 } },
                response:
                  'Granny Umber is shown out. Komodo looks relieved, then sorry he did. Below the walls, the singing stops all at once.',
              },
              {
                id: 'write-names',
                label:
                  'Have her write the forty names again, here, in the crown’s own ledger, before anything is decided.',
                effects: {
                  affinity: { moles: 5 },
                  local: { lamplight: 2, 'gate-watch': -1 },
                  flags: ['d17-names-recorded'],
                },
                response:
                  'Granny Umber writes from memory, every name, every age. It takes the morning. Komodo stands at your shoulder and reads each name as it goes down. When she is done he offers, kindly, to file the page himself.',
              },
            ],
          },
          {
            id: 'tunnels',
            lines: [
              '“Your runner went to the Ford and knocked on no doors. He looked down the old shaft at the river end, flooded twenty years, and went home to say the tunnels were empty.”',
              '“Your decree paid for a mill-race to turn the Old Houses’ wheels. The race turned the Ford, and the Ford came through our ceilings. We sleep in shifts on the high shelves. Children on top.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Then my runner was careless, Your Majesty, and I was careless to trust him. I will see to it.',
              },
              'He says it smoothly. One claw taps his ledger, twice, the way it does when he is working something out.',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'The race was paid for lawfully, Majesty. Close it and the wheels stop. Then the Old Houses ask who pays for the Yard’s flour.',
              },
            ],
            options: [
              {
                id: 'meet',
                label: 'Open talks on the burrows’ water rights.',
                effects: {
                  affinity: { moles: 15 },
                  local: { 'old-houses': -2 },
                  flags: ['mole-talks-opened'],
                },
                response:
                  '“Talks,” says Granny Umber. “Mind they’re quicker than the water.”',
              },
              {
                id: 'arrest',
                label:
                  'Arrest her for sedition. Drowned or not, she threatened the crown at its own gate.',
                effects: {
                  affinity: { moles: -20 },
                  local: { 'gate-watch': 2 },
                  flags: ['mole-messenger-arrested'],
                },
                response:
                  'The Watch takes Granny Umber away, slow and smiling. “The water won’t wait in a cell,” she says, to no one.',
              },
              {
                id: 'ignore',
                label: 'Leave Komodo to see to his runner. Send her home.',
                effects: { affinity: { moles: -5 } },
                response:
                  'Granny Umber is shown out. Komodo walks her to the door himself, a hand under her elbow. Kind.',
              },
              {
                id: 'close-race',
                label:
                  'Close the mill-race tonight, before any talks. Let the Old Houses’ wheels stand.',
                effects: {
                  affinity: { moles: 10 },
                  local: { 'old-houses': -3, yard: -1 },
                  flags: ['d17-race-closed'],
                },
                response:
                  'The sluice drops at moonrise. By morning the burrow water is down a hand’s width and the Old Houses’ mills are silent. The Yard buys its flour from those mills. It will notice.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 18,
    title: 'No Water for Strangers',
    briefings: [
      {
        id: 'abbey-wells',
        source: 'A sister of the Abbey',
        text: 'The Abbey has a deep well and turns no stranger away.',
        truth: false,
        variants: [
          {
            flags: ['abbey-took-coldbrook-children'],
            text: 'The Abbey has a deep well and turns no stranger away. The Coldbrook children drink from it every morning.',
          },
        ],
      },
      {
        id: 'wells-closed',
        source: 'Freehold reeves',
        text: 'The Freeholds have closed their wells to anyone without a Freehold token.',
        truth: true,
      },
      {
        id: 'fair',
        source: 'Saltroad drovers',
        text: 'A Saltroad fair is camped outside the gate, with fire-jugglers.',
        truth: true,
      },
    ],
    komodo:
      'The Abbey’s well is shallower than its welcome, Your Majesty. I have seen it. The closed Freehold wells are real. The Yard will take it hard.',
    quests: [],
    audiences: [
      {
        id: 'd18-strangers',
        title: 'No Water for Strangers',
        speaker: 'Hester Plowright, reeve of the Freeholds',
        npc: 'hester-plowright',
        faction: 'freeholds',
        lines: [
          'Hester Plowright, in a mud-hemmed skirt plants herself before the throne like a fence post.',
          '“Our wells are low, Majesty. Every refugee on the road wants a cup. The Freeholds water Freeholders. That’s all we can do.”',
          '“Sign on every well-head now. Freehold token or nothing. I painted them myself. Didn’t enjoy it.”',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'Half the Yard walked here once without a token, Majesty.',
          },
          {
            who: 'Lady Ottoline Vask',
            npc: 'ottoline-vask',
            text: 'The Old Houses don’t open their cisterns to the road either, Foreman. A well is property, or nothing is.',
          },
          'Hester looks from one to the other. She came about wells.',
        ],
        options: [
          {
            id: 'ask-road',
            label: 'Ask who, exactly, is on the road.',
            effects: {},
            response:
              'Hester’s feathers settle, then lift. “All right,” she says. “Since you asked.”',
            next: 'road',
          },
          {
            id: 'ask-thistledown',
            label:
              'Ask whether the families burned out of Thistledown still count as Freeholders.',
            requires: { flags: ['thistledown-burned'] },
            effects: {},
            response:
              'Hester goes still and watches the shadow cross the floor.',
            next: 'tokens',
          },
          {
            id: 'open-wells',
            label: 'Pay the Freeholds to open their wells to all.',
            requires: { cost: 15 },
            effects: {
              affinity: { freeholds: -5, 'hollow-bell': 5 },
              local: { yard: 2 },
              flags: ['wells-shared'],
            },
            response: 'The reeve takes the brass. The wells open, grudgingly.',
          },
          {
            id: 'freehold-rights',
            label: 'The Freeholds’ wells are theirs to keep.',
            effects: {
              affinity: { freeholds: 10 },
              local: { yard: -2 },
              flags: ['wells-closed'],
            },
            response:
              'The reeve bows deep. Dunmore Ash walks out without being dismissed. The road will hear of this.',
          },
          {
            id: 'escort',
            label: 'Walk the refugees to Hollow Bell instead.',
            effects: { flags: ['d18-strangers-walked'] },
            response: 'The reeve looks relieved. Someone else’s problem.',
            postsQuests: ['q-d18-refugee-road'],
          },
        ],
        beats: [
          {
            id: 'road',
            lines: [
              '“Mirefen folk, walking away from whatever the Mothers are doing. Pack deserters, since the engine dried. Goats from the far border who won’t say what they’re running from. Forty, fifty a day.”',
              '“And since you asked: my people sell the water we won’t give. A brass bit a cup, back gates, after dark. Somebody has to pay for the wells, Majesty. It won’t be the crown.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'So the wells are not closed, Your Majesty. They are priced. A very Freehold distinction.',
              },
            ],
            variants: [
              {
                flags: ['d12-raiders-heard'],
                lines: [
                  '“Mirefen folk, walking away from whatever the Mothers are doing. Pack deserters, since the engine dried. Low Carrow folk too. They say the crown listened to them once. They’re walking here to see if it does twice.”',
                  '“And since you asked: my people sell the water we won’t give. A brass bit a cup, back gates, after dark. Somebody has to pay for the wells, Majesty. It won’t be the crown.”',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'So the wells are not closed, Your Majesty. They are priced. A very Freehold distinction.',
                  },
                ],
              },
            ],
            options: [
              {
                id: 'open-wells',
                label:
                  'Pay the Freeholds to open their wells to everyone, front gate and back.',
                requires: { cost: 15 },
                effects: {
                  affinity: { freeholds: -5, 'hollow-bell': 5 },
                  local: { yard: 2 },
                  flags: ['wells-shared'],
                },
                response:
                  'Hester takes the brass. The wells open, grudgingly. The back gates close that night: no profit selling what is free. A few Freeholders curse the crown over empty cash-boxes.',
              },
              {
                id: 'freehold-rights',
                label:
                  'The Freeholds’ wells are theirs. So is what they charge.',
                effects: {
                  affinity: { freeholds: 10 },
                  local: { yard: -2 },
                  flags: ['wells-closed'],
                },
                response:
                  'Hester bows deep. Dunmore Ash walks out without being dismissed. The back gates do good trade that night.',
              },
              {
                id: 'escort',
                label:
                  'Walk the strangers to Hollow Bell instead. Let the Bell decide.',
                effects: { flags: ['d18-strangers-walked'] },
                response: 'Hester looks relieved. Then ashamed of it.',
                postsQuests: ['q-d18-refugee-road'],
              },
              {
                id: 'ban-sales',
                label:
                  'Forbid the back-gate trade. Closed means closed to brass too.',
                effects: {
                  affinity: { freeholds: -10 },
                  local: { lamplight: 2, yard: -1 },
                  flags: ['d18-water-trade-banned'],
                  schedule: ['back-gate-death'],
                },
                response:
                  'Hester’s feathers go up. “Principled,” she says, like a disease. The back gates close. Strangers with a little brass have nothing to spend it on. Those with none are no better off.',
              },
              {
                id: 'tax-sales',
                label: 'Let them sell. The crown takes a tenth of every cup.',
                effects: {
                  brass: 10,
                  affinity: { freeholds: 5 },
                  local: { yard: -2, ledger: 1 },
                  flags: ['d18-water-taxed'],
                },
                response:
                  'Hester looks at you. Then she laughs, short and not kind. “A cup taxed twice. Once by thirst.” By nightfall a crown clerk has a table at the back gate.',
              },
            ],
          },
          {
            id: 'tokens',
            lines: [
              '“Their tokens burned with their houses, Majesty. Brass tokens melt, did you know that? I didn’t. Little puddles in the ash.”',
              '“Token or nothing. Make an exception for Thistledown and by morning every stranger on the road is from Thistledown, and my wells are dry by month’s end. So I don’t. They sleep on the road. Some are my cousins.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'She is not wrong about the morning, Your Majesty. People learn fast where they are from.',
              },
            ],
            options: [
              {
                id: 'open-wells',
                label: 'Pay the Freeholds to open their wells to everyone.',
                requires: { cost: 15 },
                effects: {
                  affinity: { freeholds: -5, 'hollow-bell': 5 },
                  local: { yard: 2 },
                  flags: ['wells-shared'],
                },
                response:
                  'Hester takes the brass. “Then nobody needs a token. Nobody needs to be from anywhere.” She puts the brass away without counting it.',
              },
              {
                id: 'freehold-rights',
                label:
                  'A rule with exceptions is not a rule. The wells stay closed.',
                effects: {
                  affinity: { freeholds: 10 },
                  local: { yard: -2 },
                  flags: ['wells-closed'],
                },
                response:
                  'Hester bows deep. When she straightens, her eyes are wet. “Thank you, Majesty. I couldn’t have said it to them myself.”',
              },
              {
                id: 'escort',
                label: 'Walk Thistledown and the rest to Hollow Bell.',
                effects: { flags: ['d18-strangers-walked'] },
                response:
                  '“Mara will write every one of them down,” says Hester. “At least somebody will.”',
                postsQuests: ['q-d18-refugee-road'],
              },
              {
                id: 'crown-tokens',
                label:
                  'Issue Thistledown new tokens under the crown’s seal. The crown answers for any forgeries.',
                effects: {
                  affinity: { freeholds: -5 },
                  local: { lamplight: 1, yard: 2 },
                  flags: ['d18-crown-tokens'],
                  schedule: ['thistledown-tokens'],
                },
                response:
                  'Hester holds the sealed tokens between two fingers like they are still warm. “The crown deciding who’s a Freeholder. My grandmother would have spat.” She hands them out herself, by name. She does not count.',
              },
            ],
          },
        ],
      },
      {
        id: 'd18-fair',
        title: 'The Saltroad Fair',
        speaker: 'Vesper Fanfare, fire-juggler',
        faction: 'saltroad',
        lines: [
          'You hear the fair first. A fiddle. A drum. A goat screaming like a person. Vesper Fanfare cartwheels the last yards of carpet and lands in a bow, a lit torch in each hand. The Watch puts hands on hilts.',
          'Majesty! A whole fair at your gate. Music, cider and me. The Yard needs a night off. You look like you need a year.',
          'All we ask is the field outside the wall. Maybe some brass for the lamps.',
          {
            who: 'Captain Ferro Dunmark',
            npc: 'ferro-dunmark',
            text: 'Half the Yard is on the wall watching her, Majesty. Fire on a dry night. Forty barrels of something wet. I’d like to know which worries me more.',
          },
        ],
        options: [
          {
            id: 'ask-cider',
            label: 'Ask where a fair finds water for cider in a drought.',
            effects: {},
            response: 'Vesper juggles the two torches once before she answers.',
            next: 'cider',
          },
          {
            id: 'host',
            label: 'Host the fair, and pay for the lamps.',
            requires: { cost: 20 },
            effects: {
              affinity: { saltroad: 10 },
              local: { yard: 3 },
              recruitable: ['F018'],
            },
            response:
              'The best night the fortress has had. At the end Vesper asks if the court ever needs someone who can talk to a crowd.',
          },
          {
            id: 'tax-fair',
            label: 'Let them stay, for a cut of the takings.',
            effects: { brass: 25, affinity: { saltroad: -5 } },
            response: 'The fair is smaller and quieter. Vesper juggles anyway.',
          },
          {
            id: 'decline',
            label: 'Not this week.',
            effects: { affinity: { saltroad: -3 }, local: { yard: -1 } },
            response:
              'The fair rolls on toward Hollow Bell. The Yard watches it go from the wall.',
          },
        ],
        beats: [
          {
            id: 'cider',
            lines: [
              '“Same as anyone, Majesty. Freehold back gates, after dark, a brass bit a cup.” She catches both torches. “Don’t look at me like that. I only juggle. The cider-master pays.”',
              '“Forty barrels. The road smells it a mile off. Some come for the show. Some come to look at the barrels.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'The Yard hasn’t had a night off since the coronation, Majesty.',
              },
              'He does not say whether it should.',
            ],
            options: [
              {
                id: 'host',
                label: 'Host the fair, cider and all, and pay for the lamps.',
                requires: { cost: 20 },
                effects: {
                  affinity: { saltroad: 10 },
                  local: { yard: 3 },
                  recruitable: ['F018'],
                },
                response:
                  'The best night the fortress has had. The road smells of apples until dawn. At the end Vesper asks if the court ever needs someone who can talk to a crowd.',
              },
              {
                id: 'tax-fair',
                label:
                  'Let them stay, for a cut of the takings, cider included.',
                effects: { brass: 25, affinity: { saltroad: -5 } },
                response:
                  'Smaller, quieter, the cider dearer. Vesper juggles anyway, and drops a torch at the tax clerk’s feet. On purpose.',
              },
              {
                id: 'decline',
                label: 'Not this week. Not with the road this thirsty.',
                effects: { affinity: { saltroad: -3 }, local: { yard: -1 } },
                response:
                  'The fair rolls on toward Hollow Bell, forty barrels sloshing. The Yard watches from the wall.',
              },
              {
                id: 'barrels-to-road',
                label:
                  'Host the fair, if half its water barrels go to the strangers on the road.',
                requires: { cost: 20 },
                effects: {
                  affinity: { saltroad: -5 },
                  local: { yard: 2, lamplight: 1 },
                  recruitable: ['F018'],
                  flags: ['d18-fair-water-shared'],
                },
                response:
                  'The cider-master protests, loud, then less loud. The fair runs drier and louder. At midnight Vesper takes her torches to the road and juggles for the people drinking the fair’s water. At dawn she is at the gate. “Turns out I liked it,” she says. “Got a bed?”',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 19,
    title: 'Hollow Bell Votes',
    briefings: [
      {
        id: 'bell-vote',
        source: 'Mara Reedbell',
        text: 'Hollow Bell votes tomorrow on the crown’s protection.',
        truth: true,
      },
      {
        id: 'abbey-campaign',
        source: 'Hollow Bell gossip',
        text: 'Abbey sisters have visited every house in the Bell, speaking against the crown.',
        truth: true,
      },
      {
        id: 'vote-fixed',
        source: 'An Old House cousin',
        text: 'The vote is fixed. The mayor votes however the Ledger pays her to.',
        truth: false,
      },
    ],
    komodo:
      'Mara Reedbell cannot be bought, Your Majesty. I have tried. That is what makes her dangerous. The Abbey going door to door is new. I would like to know why the Abbess cares.',
    quests: [],
    audiences: [
      {
        id: 'd19-bell-vote',
        title: 'Hollow Bell Votes',
        speaker: 'Mara Reedbell, Mayor of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'Mara Reedbell has ridden all night. Her mayoral sash is mended in three places. Her ledger is chained to her belt, and stays shut. The hand-bell at her hip rings with every step until she puts a hoof over it.',
          'Hollow Bell votes tomorrow on your protection, Your Majesty. I won’t say which way I lean.',
          'Give my people a reason. A garrison, water, or a good speech. Promises they can see.',
          '“The Abbey sisters have knocked on every door in the Bell this week. They bring soup. They are good at soup.”',
        ],
        // The Bell votes on what the crown has already done to it.
        variants: [
          {
            flags: ['d13-bell-saboteur-named'],
            lines: [
              'Mara Reedbell has ridden all night. Her mayoral sash is mended in three places. Her ledger is chained to her belt, and stays shut. The hand-bell at her hip rings with every step until she puts a hoof over it.',
              'Hollow Bell votes tomorrow, Your Majesty. Your Watch took the Hessle boy out of his mother’s mill on Day Thirteen. Seventeen. She votes tomorrow. So do her cousins.',
              'Give my people a reason. A garrison, water, or a good speech. Promises they can see.',
              '“The Abbey sisters have knocked on every door in the Bell this week. They bring soup. They are good at soup.”',
            ],
          },
          {
            flags: ['d18-strangers-walked'],
            lines: [
              'Mara Reedbell has ridden all night. Her mayoral sash is mended in three places. Her ledger is chained to her belt, and stays shut. The hand-bell at her hip rings with every step until she puts a hoof over it.',
              'Hollow Bell votes tomorrow, Your Majesty. Your strangers are on my road tonight, forty of them. Half can’t vote. The other half are watching who walks them in.',
              'Give my people a reason. A garrison, water, or a good speech. Promises they can see.',
              '“The Abbey sisters have knocked on every door in the Bell this week. They bring soup. They are good at soup.”',
            ],
          },
          {
            flags: ['d13-bell-warned'],
            lines: [
              'Mara Reedbell has ridden all night. Her mayoral sash is mended in three places. Her ledger is chained to her belt, and stays shut. The hand-bell at her hip rings with every step until she puts a hoof over it.',
              'Hollow Bell votes tomorrow, Your Majesty. You sent word before the Pack’s engine drank our stream. The Bell remembers who knocks first. I still won’t say which way I lean.',
              'Give my people a reason. A garrison, water, or a good speech. Promises they can see.',
              '“The Abbey sisters have knocked on every door in the Bell this week. They bring soup. They are good at soup.”',
            ],
          },
          {
            flags: ['d13-water-shared'],
            lines: [
              'Mara Reedbell has ridden all night. Her mayoral sash is mended in three places. Her ledger is chained to her belt, and stays shut. The hand-bell at her hip rings with every step until she puts a hoof over it.',
              'Hollow Bell votes tomorrow, Your Majesty. The Pack’s water came back down our stream the week you asked Vane for it. The Bell noticed. I won’t say which way I lean.',
              'Give my people a reason. A garrison, water, or a good speech. Promises they can see.',
              '“The Abbey sisters have knocked on every door in the Bell this week. They bring soup. They are good at soup.”',
            ],
          },
        ],
        options: [
          {
            id: 'ask-abbey',
            label: 'Ask what the Abbey’s sisters promise at the doors.',
            effects: {},
            response: 'Mara glances at the hall doors. Checking for grey.',
            next: 'sisters',
          },
          {
            id: 'ask-millers',
            label: 'Ask how the mill families mean to vote.',
            requires: { flags: ['mara-millers-levy'] },
            effects: {},
            response: 'Mara laughs once. No pleasure in it.',
            next: 'millers',
          },
          {
            id: 'garrison',
            label: 'Pledge a Gate Watch garrison to the Bell.',
            requires: { local: { 'gate-watch': 10 } },
            effects: {
              affinity: { 'hollow-bell': 20 },
              local: { 'gate-watch': -2 },
              strength: { 'hollow-bell': 1 },
              flags: ['bell-under-protection', 'bell-voted-yes'],
              schedule: ['bell-garrison'],
            },
            response:
              'Mara smiles and writes one word in her ledger. The Bell votes yes the next day.',
          },
          {
            id: 'water',
            label: 'Pledge the crown’s share of the coming rain to the Bell.',
            requires: {
              standing: { flags: ['rain-covenant', 'd11-rain-bought'], min: 1 },
            },
            effects: {
              affinity: { 'hollow-bell': 15, freeholds: -5 },
              flags: ['bell-voted-yes'],
            },
            response:
              '“Rain,” says Mara. “Now that’s a promise you can see.” In the Freeholds a reeve does the arithmetic and does not like it.',
          },
          {
            id: 'speech',
            label:
              'Send someone to make the case in the square. The vote turns on how they do.',
            effects: {},
            response:
              '“Make it a good one,” says Mara. “The sisters have been busy.”',
            postsQuests: ['q-d19-bell-speech'],
          },
          {
            id: 'free-miller-son',
            label:
              'Release the miller’s son into Mara’s custody before the vote.',
            requires: { flags: ['d13-bell-saboteur-named'] },
            effects: {
              affinity: { 'hollow-bell': 10, jackalwire: -10 },
              local: { 'gate-watch': -1 },
              flags: ['d19-miller-son-released', 'bell-voted-yes'],
            },
            response:
              'Mara signs for him like a parcel. The boy will not look at her. The Bell votes yes the next day. Down the canyon, Gristle Vane hears the bell ring and knows what it cost him.',
          },
        ],
        beats: [
          {
            id: 'sisters',
            lines: [
              '“Care. Their word. Stay free of the crown, and the Abbey takes every orphan in the Bell into its care. Lessons, beds, hot meals.” She stops. “They know exactly how many orphans we have. I never told them.”',
              '“What I won’t say in the square, I’ll say to you. I want the crown’s protection. If I’m seen to want it, the Bell votes against me to prove it’s free.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The Abbey has done much good, Your Majesty. I would not stand in a square and say otherwise with empty hands.',
              },
            ],
            options: [
              {
                id: 'garrison',
                label:
                  'Pledge a Gate Watch garrison. Soup cannot match soldiers at the gate.',
                requires: { local: { 'gate-watch': 10 } },
                effects: {
                  affinity: { 'hollow-bell': 20 },
                  local: { 'gate-watch': -2 },
                  strength: { 'hollow-bell': 1 },
                  flags: ['bell-under-protection', 'bell-voted-yes'],
                  schedule: ['bell-garrison'],
                },
                response:
                  'Mara writes one word in her ledger. The Bell votes yes. The sisters leave by the north road, still carrying their soup.',
              },
              {
                id: 'water',
                label:
                  'Pledge the crown’s share of the coming rain to the Bell.',
                requires: {
                  standing: {
                    flags: ['rain-covenant', 'd11-rain-bought'],
                    min: 1,
                  },
                },
                effects: {
                  affinity: { 'hollow-bell': 15, freeholds: -5 },
                  flags: ['bell-voted-yes'],
                },
                response:
                  '“Soup is good,” says Mara. “Rain is better.” The Bell votes yes. Some Freeholds were counting on that rain. They vote with their feet.',
              },
              {
                id: 'speech',
                label:
                  'Make the crown’s case in the square. Leave the Abbey out of it.',
                effects: {},
                response:
                  '“Make it a good one,” says Mara. “The soup is very good.”',
                postsQuests: ['q-d19-bell-speech'],
              },
              {
                id: 'question-abbey',
                label:
                  'Make the case, and ask the sisters before the square how they know the number.',
                effects: {
                  affinity: { abbey: -10, 'hollow-bell': 5 },
                  local: { lamplight: 1 },
                  flags: ['d19-abbey-questioned'],
                },
                response:
                  'Mara writes one line and closes the ledger. “That won’t make you friends.” Komodo, at your shoulder, says nothing for the rest of the audience. A great deal of nothing.',
                postsQuests: ['q-d19-bell-speech'],
              },
              {
                id: 'ask-coldbrooks',
                label:
                  'Have the crown’s speaker ask the sisters, in the square, when Wenna Coldbrook may visit her children.',
                requires: { flags: ['abbey-took-coldbrook-children'] },
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  local: { yard: 1 },
                  flags: ['d19-coldbrooks-asked'],
                },
                response:
                  'It is asked at noon, loudly. A sister in grey answers at once, warmly: very soon, once the little ones are settled. The square hears the word settled. Some who were nodding stop.',
                postsQuests: ['q-d19-bell-speech'],
              },
            ],
          },
          {
            id: 'millers',
            lines: [
              '“As one family. Against. Your levy saw to that.” She is not sorry. “The mill families have never been so united. Nine hands, and the Bell is decided by fewer.”',
              '“They sent word through me, politely: they’d vote yes for a crown that repealed its unjust levy. They know I signed nothing. They know I asked you to.”',
              'She waits. The levy paid for the poor wards’ water. You both know it.',
            ],
            options: [
              {
                id: 'garrison',
                label:
                  'Pledge a garrison. Let the millers count soldiers instead.',
                requires: { local: { 'gate-watch': 10 } },
                effects: {
                  affinity: { 'hollow-bell': 20 },
                  local: { 'gate-watch': -2 },
                  strength: { 'hollow-bell': 1 },
                  flags: ['bell-under-protection', 'bell-voted-yes'],
                  schedule: ['bell-garrison'],
                },
                response:
                  'Mara writes one word. The Bell votes yes by more than nine hands. The outvoted mill families grind nothing for a day, out of spite.',
              },
              {
                id: 'water',
                label:
                  'Pledge the coming rain instead. Let the millers argue with rain.',
                requires: {
                  standing: {
                    flags: ['rain-covenant', 'd11-rain-bought'],
                    min: 1,
                  },
                },
                effects: {
                  affinity: { 'hollow-bell': 15, freeholds: -5 },
                  flags: ['bell-voted-yes'],
                },
                response:
                  '“Even a miller can’t vote against rain.” The Bell votes yes without the mill families. The levy stands. In the Freeholds a reeve does the arithmetic and does not like it.',
              },
              {
                id: 'speech',
                label:
                  'The levy stands. Make the case in the square and win without them.',
                effects: {},
                response:
                  '“Then make it a very good speech.” For the first time this morning Mara smiles. “The wards are listening. You kept your word to them.”',
                postsQuests: ['q-d19-bell-speech'],
              },
              {
                id: 'repeal-levy',
                label: 'Repeal the millers’ levy for their nine hands.',
                effects: {
                  affinity: { 'hollow-bell': 5 },
                  local: { 'old-houses': 2, yard: -2 },
                  flags: ['d19-millers-levy-repealed', 'bell-voted-yes'],
                },
                response:
                  'The mill families vote yes, as one. The bell rings. Mara does not ring it. She returns the repeal with her signature beside yours and a margin note: “Now we both did it.”',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 20,
    title: 'The Levy',
    briefings: [
      {
        id: 'pack-disbanded',
        source: 'A Saltroad drover',
        text: 'The Jackalwire Pack has disbanded and gone east.',
        truth: false,
      },
      {
        id: 'rains-coming',
        source: 'Storm Crow Heights',
        text: 'Thunderheads stand over the Heights. They have not moved in a week.',
        truth: true,
        variants: [
          {
            flags: ['d11-rain-signed'],
            text: 'The Conclave’s rain broke over the Ford before dawn. It is walking toward the Bell.',
          },
          {
            flags: ['d11-rain-bought'],
            text: 'The rain the crown bought broke over the Ford before dawn. It is walking toward the Bell.',
          },
          {
            flags: ['no-rain'],
            text: 'Clouds over the Heights. They stop at the tower’s border, like a line drawn with a rule.',
          },
        ],
      },
      {
        id: 'verge-riders',
        source: 'Far-border scouts',
        text: 'Riders in plum coats at the far border, where the map ends.',
        truth: true,
      },
    ],
    komodo:
      'The Pack goes nowhere without Vane, Your Majesty, and Vane goes nowhere without his coat. The riders in plum are new. I do not know them. I know most people.',
    quests: ['q-d20-ford-dam'],
    audiences: [
      {
        id: 'd20-levy',
        title: 'The Levy',
        speaker: 'Captain Ferro Dunmark and Lady Ottoline Vask',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'Captain Ferro Dunmark brings a list, not a speech. Names down one side, gaps down the other. The gaps are longer. He reads it at attention. Lady Ottoline Vask waits, head tilted, through a tune she has heard before.',
          'The Watch is thin, Majesty. The borders aren’t. Riders at the edge of the map. Raiders in the canyon. We need a levy, brass and bodies, before the season turns.',
          {
            who: 'Lady Ottoline Vask',
            npc: 'ottoline-vask',
            text: 'A levy should fall on those with least to lose, Majesty. Simple arithmetic.',
          },
          'At the back, Foreman Dunmore Ash repeats it slowly. “The least to lose.” Then once more, to himself.',
        ],
        variants: [
          {
            flags: ['bell-under-protection'],
            lines: [
              'Captain Ferro Dunmark brings a list, not a speech. Names down one side, gaps down the other. The gaps are longer. He reads it at attention. Lady Ottoline Vask waits, head tilted, through a tune she has heard before.',
              'The Watch is thin, Majesty. Twelve of these gaps are at Hollow Bell. You put them there yesterday. The borders aren’t thin. Riders at the edge of the map. Raiders in the canyon. We need a levy, brass and bodies, before the season turns.',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'A levy should fall on those with least to lose, Majesty. Simple arithmetic.',
              },
              'At the back, Foreman Dunmore Ash repeats it slowly. “The least to lose.” Then once more, to himself.',
            ],
          },
        ],
        options: [
          {
            id: 'ask-riders',
            label: 'Ask Dunmark what the riders in plum actually did.',
            effects: {},
            response:
              'Dunmark folds the list away. “Nothing. That’s what I didn’t like.”',
            next: 'plum',
          },
          {
            id: 'ask-oath',
            label:
              'Ask Dunmark whether levying untrained Yard hands spends the Watch cheaply.',
            requires: { flags: ['oath-of-care'] },
            effects: {},
            response:
              'Dunmark looks at you a long moment. “You remember. Good.”',
            next: 'oath',
          },
          {
            id: 'levy-yard',
            label: 'Levy the Yard: brass and able bodies.',
            effects: {
              brass: 40,
              local: { yard: -5, 'gate-watch': 3, 'old-houses': 2 },
              flags: ['levy-yard'],
              schedule: ['yard-double-loss'],
            },
            response:
              'Dunmark nods. Lady Vask smiles. The Yard does not. Dunmore Ash leaves before the order is read.',
          },
          {
            id: 'levy-houses',
            label: 'Levy the Old Houses. They have the most to protect.',
            effects: {
              brass: 30,
              local: { 'old-houses': -5, yard: 2, 'gate-watch': 2 },
              flags: ['levy-houses'],
            },
            response: 'Lady Vask’s smile is gone. Dunmark looks amused.',
          },
          {
            id: 'no-levy',
            label: 'No levy. The Watch will make do.',
            effects: { local: { 'gate-watch': -3, yard: 1 } },
            response:
              'Dunmark salutes, stiff. “We’ll make do. Until we can’t.”',
          },
          {
            id: 'levy-ledger',
            label:
              'Levy the Ledger. The market charter has made its counting-tables rich.',
            requires: { flags: ['market-charter'] },
            effects: {
              brass: 25,
              local: { ledger: -3, 'gate-watch': 2, yard: -1 },
              flags: ['d20-levy-ledger'],
            },
            response:
              'Factor Tallow arrives with the charter open at the clause she expects you to read. You read another. She pays and smiles. By evening interest on every Yard loan in the market has risen by exactly the levy.',
          },
        ],
        beats: [
          {
            id: 'plum',
            lines: [
              '“Far gate, dusk. Six riders, coats the colour of plums, white gloves. Didn’t draw. Asked my sergeant, civil, if a courtier with good manners had passed this way.”',
              '“He said no. One of them took off a glove and gave it to him. A gift, for his trouble.” Dunmark sets a white glove on the dais step. Spotless. “He’s been sick since.”',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'The Black Verge Court, Majesty. The Old Houses have traded with them for years. Perfectly civilized. They pay in silver.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'I did not know them this morning, Your Majesty. I know them a little now. I do not like how much better my lady Vask does.',
              },
            ],
            variants: [
              {
                flags: ['d16-border-silver-seized'],
                lines: [
                  '“Far gate, dusk. Six riders, coats the colour of plums, white gloves. Didn’t draw. Asked my sergeant, civil, if a courtier with good manners had passed this way.”',
                  '“Then one asked after some silver that went astray on the Freehold road. Grain money, he said. Paid in advance.” Dunmark sets a white glove on the dais step. Spotless. “He left that. My sergeant’s been sick since.”',
                  {
                    who: 'Lady Ottoline Vask',
                    npc: 'ottoline-vask',
                    text: 'The Black Verge Court, Majesty. The Old Houses have traded with them for years. Perfectly civilized. They pay in silver.',
                  },
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'I did not know them this morning, Your Majesty. I know them a little now. I do not like how much better my lady Vask does.',
                  },
                ],
              },
              {
                flags: ['d16-grain-followed'],
                lines: [
                  '“Far gate, dusk. Six riders, coats the colour of plums, white gloves. Didn’t draw. Asked my sergeant, civil, if a courtier with good manners had passed this way.”',
                  '“And your rider came back from the grain carts. Their horses were eating Freehold oats out of Old House sacks.” Dunmark sets a white glove on the dais step. Spotless. “They gave my sergeant this. He’s been sick since.”',
                  {
                    who: 'Lady Ottoline Vask',
                    npc: 'ottoline-vask',
                    text: 'The Black Verge Court, Majesty. The Old Houses have traded with them for years. Perfectly civilized. They pay in silver.',
                  },
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'I did not know them this morning, Your Majesty. I know them a little now. I do not like how much better my lady Vask does.',
                  },
                ],
              },
            ],
            options: [
              {
                id: 'levy-yard',
                label:
                  'Levy the Yard. The border needs bodies, and the Yard has them.',
                effects: {
                  brass: 40,
                  local: { yard: -5, 'gate-watch': 3, 'old-houses': 2 },
                  flags: ['levy-yard'],
                  schedule: ['yard-double-loss'],
                },
                response:
                  'Dunmark nods. Lady Vask smiles. The Yard does not. That night the white glove burns in the Watch’s fire. Nobody admits to it.',
              },
              {
                id: 'levy-houses',
                label:
                  'Levy the Old Houses. They trade with the Verge. They can pay to guard against it.',
                effects: {
                  brass: 30,
                  local: { 'old-houses': -5, yard: 2, 'gate-watch': 2 },
                  flags: ['levy-houses'],
                },
                response:
                  'Lady Vask’s smile is gone. Dunmark looks amused. Then he looks at the glove, and isn’t.',
              },
              {
                id: 'no-levy',
                label: 'No levy. The Watch will make do, glove or no glove.',
                effects: { local: { 'gate-watch': -3, yard: 1 } },
                response:
                  'Dunmark salutes, stiff, and carries the glove out in tongs. He does not say anything about making do.',
              },
              {
                id: 'answer-verge',
                label:
                  'No levy yet. Send the glove back with a letter: the crown shelters whom it pleases.',
                effects: {
                  affinity: { 'black-verge': -10 },
                  local: { 'gate-watch': 1, 'old-houses': -2 },
                  flags: ['d20-verge-answered'],
                },
                response:
                  'The letter goes at dawn, the glove folded inside. No answer. Lady Vask leaves court early. The Old Houses’ couriers ride east all night.',
              },
            ],
          },
          {
            id: 'oath',
            lines: [
              '“You swore you’d never spend us cheaply, Majesty. I hold you to it, as I said I would.”',
              '“Yard hands are bodies, not soldiers. They’ll stand at the far gate in borrowed coats, and the first rider in plum who takes off a glove will spend them for you. That’s cheap. I know cheap. I’ve buried it.”',
              '“Brass to train volunteers, or nothing and I’ll make do. Don’t give me conscripts and call it keeping your word.”',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'Volunteers cost money, Captain. Conscripts are free. I thought soldiers understood arithmetic.',
              },
            ],
            options: [
              {
                id: 'levy-yard',
                label: 'Levy the Yard anyway. An oath does not man a wall.',
                effects: {
                  brass: 40,
                  local: { yard: -5, 'gate-watch': 3, 'old-houses': 2 },
                  flags: ['levy-yard'],
                  schedule: ['yard-double-loss'],
                },
                response:
                  'Dunmark is silent a long moment. He takes the list back, salutes to regulation, and leaves. By supper the Watch knows about the oath. So does the Yard.',
              },
              {
                id: 'levy-houses',
                label:
                  'Levy the Old Houses’ brass, not the Yard’s bodies. Let the Captain hire whom he trusts.',
                effects: {
                  brass: 30,
                  local: { 'old-houses': -5, yard: 2, 'gate-watch': 2 },
                  flags: ['levy-houses'],
                },
                response:
                  'Lady Vask’s rings click once on her chair. Dunmark looks nearly happy.',
              },
              {
                id: 'no-levy',
                label: 'No levy. The Watch makes do, and the oath stands.',
                effects: { local: { 'gate-watch': -3, yard: 1 } },
                response:
                  'Dunmark salutes. “When we can’t make do, I’ll tell you so to your face.”',
              },
              {
                id: 'volunteers',
                label:
                  'Pay a bounty for volunteers from the treasury. Train them properly.',
                requires: { cost: 30 },
                effects: {
                  local: { 'gate-watch': 3, yard: 1 },
                  flags: ['d20-volunteer-bounty'],
                },
                response:
                  'Dunmark salutes. Not stiff. By nightfall forty come forward from the Yard, and twelve of the Old Houses’ younger sons. Lady Vask did not expect that.',
              },
            ],
          },
        ],
      },
      {
        id: 'd20-covenant-due',
        title: 'The Covenant Comes Due',
        speaker: 'Elder Corvane of the Storm Crow Conclave',
        npc: 'elder-corvane',
        faction: 'storm-crows',
        requires: { flags: ['rain-covenant'] },
        lines: [
          'The rain broke before dawn. It falls soft and steady from the Ford to the Bell. The fortress smells of wet dust and green. Elder Corvane walks up the carpet bone dry. His chimes are silent.',
          'The rain came, young ruler. The Conclave names its service: three runners from your court, to carry forecasts in the caves for a season.',
          '“Young ones, please. The caves are narrow. Old legs are slow on the ladders.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'He is not asking, Your Majesty. Those are terms. They were terms when you signed.',
          },
        ],
        options: [
          {
            id: 'ask-season',
            label: 'Ask how long a Conclave season lasts.',
            effects: {},
            response:
              'Corvane tilts his head, the way birds do when the question interests them more than the asker.',
            next: 'season',
          },
          {
            id: 'clause-eleven',
            label:
              'Ask about clause eleven, the one Tamsin read: do the runners ever come home?',
            requires: { flags: ['bonded-runner-clause'] },
            effects: {},
            response:
              'Corvane’s clouded eyes search the gallery for the courier he remembers. “Ah,” he says. “She told you.”',
            next: 'season',
          },
          {
            id: 'hold-margin',
            label:
              'Hold Corvane to your margin note: no person of this court is payment.',
            requires: { flags: ['d11-no-runners-clause'] },
            effects: {},
            response:
              '“So it says,” Corvane agrees. “Your hand. My initials. The Conclave is flexible about the coin.”',
            next: 'land',
          },
          {
            id: 'pay-brass',
            label: 'Offer brass instead of runners.',
            requires: { cost: 50 },
            effects: {
              affinity: { 'storm-crows': -5 },
              clearFlags: ['rain-covenant'],
              flags: ['covenant-bought-out'],
              schedule: ['crow-substitution'],
            },
            response:
              'Corvane takes the brass with distaste. “The covenant said runners. We will remember the substitution.”',
          },
          {
            id: 'send-runners',
            label: 'Send three volunteers from the Yard.',
            effects: {
              affinity: { 'storm-crows': 10 },
              local: { yard: -4 },
              clearFlags: ['rain-covenant'],
              flags: ['covenant-paid-in-runners'],
              schedule: ['yard-double-loss', 'runner-at-gate'],
            },
            response:
              'Three young volunteers climb the Heights. The Yard does not forgive it quickly.',
          },
          {
            id: 'break',
            label: 'Break the covenant.',
            effects: {
              affinity: { 'storm-crows': -30 },
              strength: { 'storm-crows': -1 },
              clearFlags: ['rain-covenant'],
              flags: ['covenant-broken'],
              schedule: ['crow-debt'],
            },
            response:
              'Corvane goes still. Outside, the soft rain stops all at once. The sky turns the colour of a bruise.',
          },
          {
            id: 'ask-eleven',
            label:
              'Ask about clause eleven, the one you read yourself: who counts the season?',
            requires: {
              flags: ['d11-clause-read'],
              notFlags: ['bonded-runner-clause'],
            },
            effects: {},
            response:
              '“You read it,” says Corvane. “Most don’t.” It does not sound like praise.',
            next: 'season',
          },
          {
            id: 'hold-term',
            label:
              'Hold Corvane to your margin note: a season is ninety days, by the tower’s calendar.',
            requires: { flags: ['d11-term-fixed'] },
            effects: {},
            response:
              'Corvane unrolls the covenant to the margin and reads your hand back to you, word for word.',
            next: 'term',
          },
        ],
        beats: [
          {
            id: 'season',
            lines: [
              '“A season is as long as the weather it pays for,” says Corvane. “This was a generous rain.”',
              '“The last runner to leave us served nine years for one summer. Well fed. We are not cruel, young ruler. We are exact.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'Three in the Yard already asking to go, Majesty. Orphans. They think it’s an adventure.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Nine years for three months of rain, Your Majesty. I have seen worse loans at the Ledger. Not many. None were children.',
              },
            ],
            variants: [
              {
                flags: ['d11-term-fixed'],
                lines: [
                  '“Your margin says ninety days,” says Corvane. “Your hand. My initials. I read it every night on the way down.”',
                  '“The last runner to leave us had no margin. He served nine years for one summer. Well fed. We are not cruel, young ruler. We are exact.”',
                  {
                    who: 'Foreman Dunmore Ash',
                    npc: 'dunmore-ash',
                    text: 'Three in the Yard already asking to go, Majesty. Orphans. They think it’s an adventure.',
                  },
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'Nine years for three months of rain, Your Majesty. I have seen worse loans at the Ledger. Not many. None were children.',
                  },
                ],
              },
            ],
            options: [
              {
                id: 'pay-brass',
                label:
                  'Pay in brass. Keep every child on this side of the Heights.',
                requires: { cost: 50 },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-bought-out'],
                  schedule: ['crow-substitution'],
                },
                response:
                  'Corvane counts the brass twice. “Runners were written. Brass was given. The Conclave keeps both columns.” The three Yard orphans are bitterly disappointed.',
              },
              {
                id: 'send-runners',
                label: 'Send the three Yard volunteers. They asked to go.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { yard: -4 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-paid-in-runners'],
                  schedule: ['yard-double-loss', 'runner-at-gate'],
                },
                response:
                  'Three young volunteers climb the Heights in borrowed boots, waving. The Yard waves back. Each year they are not home, it forgives the crown less.',
              },
              {
                id: 'break',
                label: 'Break the covenant. Nine years is not a season.',
                effects: {
                  affinity: { 'storm-crows': -30 },
                  strength: { 'storm-crows': -1 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-broken'],
                  schedule: ['crow-debt'],
                },
                response:
                  'Corvane goes still. Outside, the rain stops. Not slowing. Stopped, mid-fall. By noon the gutters are dry.',
              },
              {
                id: 'fixed-term',
                label:
                  'Send them, with a term in writing: one season, by the tower’s calendar, not the Conclave’s.',
                effects: {
                  affinity: { 'storm-crows': -5 },
                  local: { yard: -2 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-paid-in-runners', 'd20-runners-term-fixed'],
                  schedule: ['yard-double-loss'],
                },
                response:
                  'Corvane writes the term himself, in a hand so old it is hard to read. “Three months. By your calendar.” He does not say what your calendar is worth when they are up.',
              },
              {
                id: 'court-runners',
                label:
                  'Send three from the court’s own households: clerks’ children, the Old Houses’ younger sons.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { 'old-houses': -3, yard: 2 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-paid-in-runners', 'd20-court-runners'],
                  schedule: ['runner-at-gate'],
                },
                response:
                  'Lady Vask’s nephew is the second name read. She does not move. Corvane looks the three over like fruit at market. “Well fed,” he says. For once the Yard says nothing against the crown.',
              },
            ],
          },
          {
            id: 'land',
            lines: [
              '“No persons.” Corvane lifts his wings an inch and lets them fall. “So the Conclave takes land. The high pastures above the Ford, for our storm-glass. The rain came from there. Let it be paid there.”',
              '“The Freeholds graze those pastures. They’ll graze somewhere else. That was never in your margin.”',
              {
                who: 'Hester Plowright',
                npc: 'hester-plowright',
                text: 'Those pastures are three hundred goats and every Freehold child’s milk, Majesty. You wrote that margin. You never asked us what it cost.',
              },
            ],
            options: [
              {
                id: 'pay-brass',
                label:
                  'Buy the pastures back with brass. Keep the margin and the land.',
                requires: { cost: 50 },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-bought-out'],
                  schedule: ['crow-substitution'],
                },
                response:
                  'Corvane takes the brass with distaste. “A service was written. Brass was given. We remember the difference.” Hester Plowright lets out her breath.',
              },
              {
                id: 'send-runners',
                label:
                  'Waive your margin note. Send three Yard volunteers after all.',
                effects: {
                  affinity: { 'storm-crows': 10 },
                  local: { yard: -4 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-paid-in-runners'],
                  schedule: ['yard-double-loss', 'runner-at-gate'],
                },
                response:
                  'Corvane says nothing. Three young volunteers climb the Heights. Hester Plowright, whose goats keep their pasture, cannot meet the Yard’s eyes for a month.',
              },
              {
                id: 'break',
                label:
                  'Break the covenant. The Conclave read further than it had a right to.',
                effects: {
                  affinity: { 'storm-crows': -30 },
                  strength: { 'storm-crows': -1 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-broken'],
                  schedule: ['crow-debt'],
                },
                response:
                  'Corvane goes still. Over the high pastures the rain stops in a straight line, as if cut. The goats on the near side of it are wet. The goats on the far side are not.',
              },
              {
                id: 'cede-pastures',
                label:
                  'Cede the high pastures. The tower promised no persons, and it keeps its promises.',
                effects: {
                  affinity: { 'storm-crows': 10, freeholds: -10 },
                  clearFlags: ['rain-covenant'],
                  flags: ['d20-pastures-ceded'],
                  schedule: ['pastures-ceded'],
                },
                response:
                  'Corvane bows, for the first time. By morning the Freehold herds come down off the high pastures in long, bleating lines. Tall glass vanes go up where they grazed, ringing in the wind.',
              },
            ],
          },
          {
            id: 'term',
            lines: [
              '“Ninety days,” says Corvane. “Your hand. My initials. By your calendar.” He looks past the throne at the calendar on the wall as if he has never seen one.',
              '“Three runners, then. Ninety days is a short season. We will run them hard.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'Three in the Yard already asking to go, Majesty. Orphans. They think it’s an adventure. Ninety days, they can count to.',
              },
            ],
            options: [
              {
                id: 'keep-term',
                label:
                  'Send the three Yard volunteers for ninety days. Write the day they come home on the gate.',
                effects: {
                  affinity: { 'storm-crows': 5 },
                  local: { yard: -2 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-paid-in-runners', 'd20-runners-term-fixed'],
                  schedule: ['yard-double-loss'],
                },
                response:
                  'Corvane writes the date of their return under your margin, small. “Count them yourself,” he says. The Yard chalks the day on the gate. Somebody scratches off one mark every morning.',
              },
              {
                id: 'pay-brass',
                label: 'Pay in brass. Not even ninety days.',
                requires: { cost: 50 },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-bought-out'],
                  schedule: ['crow-substitution'],
                },
                response:
                  'Corvane takes the brass. “You fixed the term and then would not serve it,” he says. “We will remember that too.”',
              },
              {
                id: 'break',
                label: 'Break the covenant, margin and all.',
                effects: {
                  affinity: { 'storm-crows': -30 },
                  strength: { 'storm-crows': -1 },
                  clearFlags: ['rain-covenant'],
                  flags: ['covenant-broken'],
                  schedule: ['crow-debt'],
                },
                response:
                  'Corvane rolls the covenant up with your margin inside it. Outside, the rain stops all at once. He takes the dry road home.',
              },
            ],
          },
        ],
      },
    ],
  },
]

/**
 * The runner at the gate (t-036, lead decision 2026-10-21). A covenant paid
 * in runners is not billed in brass on Day 34: a person comes due instead.
 * Linnet, one of the three sent up the Heights, is sent down to ask whether
 * the crown is buying her out early. Act IV lists this audience on Day 34.
 */
export const D34_RUNNER_AT_GATE: AudienceDef = {
  id: 'd34-runner-at-gate',
  title: 'A Runner at the Gate',
  speaker: 'Linnet, a runner bonded to the Conclave',
  faction: 'storm-crows',
  requires: { flags: ['d34-runner-at-gate'] },
  lines: [
    'She is on the gate step when the bar comes off. A young stoat in a Conclave sash, soaked through. She has not knocked. She is waiting to be sent for.',
    '“Linnet, Majesty. From the Yard. You sent three of us up the Heights on Day Twenty. I’m the one they sent down.”',
    '“Elder Corvane asks a thing. Is the crown buying me out early? Sixty brass. He says it is the same to the Conclave either way.” She wipes the rain off her nose. “It isn’t.”',
    '“Two more years, they say. Or nine. They count it.” Rain runs off the sash onto the step. She does not ask to come in.',
  ],
  variants: [
    {
      flags: ['d20-court-runners'],
      lines: [
        'She is on the gate step when the bar comes off. A young stoat in a Conclave sash, soaked through. She has not knocked. She is waiting to be sent for.',
        '“Linnet, Majesty. The clerk’s girl. You sent three of us from your own households on Day Twenty. I’m the one they sent down.”',
        '“Elder Corvane asks a thing. Is the crown buying me out early? Sixty brass. He says it is the same to the Conclave either way.” She wipes the rain off her nose. “It isn’t.”',
        '“Two more years, they say. Or nine. They count it.” Rain runs off the sash onto the step. Her father is at his desk forty yards away. She does not ask for him.',
      ],
    },
  ],
  options: [
    {
      id: 'buy-out',
      label: 'Buy out her term. Sixty brass, and she comes in out of the rain.',
      requires: { cost: 60 },
      effects: {
        affinity: { 'storm-crows': -5 },
        local: { yard: 2 },
        flags: ['d34-runner-home', 'd34-runner-bought'],
      },
      response:
        'A Conclave courier takes the brass off the gate step in three trips. Linnet stands in the hall and drips. She does not know what to do with her hands. For a week the Conclave watchers on the sills sit with their backs to the throne.',
    },
    {
      id: 'leave',
      label: 'Send her back up. The term is the term.',
      effects: {
        affinity: { 'storm-crows': 10 },
        local: { yard: -3 },
        flags: ['d34-runner-left', 'crow-debt-paid'],
      },
      response:
        'Linnet nods as if she knew. She turns on the step and walks back into the rain. Runner’s pace by the second bend. The Yard watches from the wall until there is nothing to watch.',
    },
    {
      id: 'tamsin-goes',
      label: 'Let Tamsin go up in Linnet’s place. She is already on her feet.',
      requires: { follower: 'F011' },
      effects: {
        affinity: { 'storm-crows': 10 },
        local: { yard: 3 },
        flags: ['d34-runner-home', 'd34-tamsin-swapped'],
        dismiss: [
          {
            follower: 'F011',
            reason: 'Tamsin went back up the Heights in a Yard child’s sash.',
          },
        ],
      },
      response:
        'Tamsin takes the sash off the girl’s shoulders and puts it on her own. It still fits. “I know the paths,” she says. “She doesn’t.” At the bend she starts to run. Runner’s pace. She never learned another.',
    },
  ],
}

/**
 * The Day 42 runner in the Crow cave (Act V) as the covenant's runs left her:
 * whoever went up, for how long, and what the crown did at the Day 34 gate.
 */
const D42_FIRST_LINE =
  'A young stoat in a Conclave sash brings you water in the morning. She stands holding the bowl. Not leaving.'
const D42_LAST_LINE =
  '“The bond runs seven more years. I’m not asking anything. I wanted the emperor to see one of us. Once.”'
export const D42_RUNNER_VARIANTS: SceneVariant[] = [
  {
    flags: ['d34-runner-left'],
    lines: [
      D42_FIRST_LINE,
      '“You won’t know me, Majesty. You sent three of us up for the rain. Linnet came down to your gate on Day Thirty-Four. You sent her back.”',
      '“She went off the high path in the first storm after. Bag on her back. Somebody else’s letters. The Crows sang for her. They sent the bag on.”',
      D42_LAST_LINE,
    ],
  },
  {
    flags: ['d34-tamsin-swapped'],
    lines: [
      D42_FIRST_LINE,
      '“You won’t know me, Majesty. You sent three of us up for the rain. Linnet went home. The courier took her sash.”',
      '“Tamsin runs the far paths now, the ones nobody wants. She runs them like she’s late for something. She doesn’t come to the cave while you’re in it.”',
      D42_LAST_LINE,
    ],
  },
  {
    flags: ['d34-runner-home'],
    lines: [
      D42_FIRST_LINE,
      '“You won’t know me, Majesty. You sent three of us up for the rain. You bought Linnet home on Day Thirty-Four. I was the third.”',
      '“They feed us. We run the high paths in storms with letters. The other one fell in the spring. The Crows sang for him. Decent of them.”',
      D42_LAST_LINE,
    ],
  },
  {
    flags: ['d20-runners-term-fixed'],
    lines: [
      D42_FIRST_LINE,
      '“You won’t know me, Majesty. You sent three of us from the Yard for ninety days. They let the other two go on the day, to the hour.”',
      '“They kept me. I asked them to. We run the high paths in storms with letters. The Crows feed us. Nobody counts my days but me.”',
      '“I signed on again, seven years. I’m not asking anything. I wanted the emperor to see one of us. Once.”',
    ],
  },
  {
    flags: ['d20-court-runners'],
    lines: [
      D42_FIRST_LINE,
      '“You won’t know me, Majesty. You sent three of us from your own households to pay for the rain. I was the cook’s daughter.”',
      '“They treat us all right. They feed us. We run the high paths in storms with letters. Two of us fell. The Crows sang for them. Decent of them.”',
      D42_LAST_LINE,
    ],
  },
]

/**
 * The rain covenant (t-040, t-036). Signing it books the Day 20 reckoning.
 * Day 34 bills in brass only a covenant still held or broken; one paid in
 * runners for a Conclave season sends a runner to the gate instead; one
 * bought out, settled in pastures or served on a fixed term owes nothing
 * more. A run that never signed is never billed. The rest of Act II's dues
 * are its threats come home: Vane's bolt, the Verge's silver, the flooded
 * Ford, the Bell's gate, the crown's tokens, the Yard's two losses.
 */
export const ACT_TWO_DUES: readonly DueDef[] = [
  {
    id: 'rain-covenant',
    title: 'The rain covenant',
    day: 20,
    when: { flags: ['rain-covenant'] },
    warning: 'Elder Corvane names the covenant’s price at court on Day 20.',
    line: 'Rain broke over the Ford before dawn. Elder Corvane is on the carpet road with the covenant under his wing.',
    effects: { schedule: ['crow-debt', 'runner-at-gate'] },
  },
  {
    id: 'crow-debt',
    title: 'The Conclave collects',
    day: 34,
    // Brass, pastures or a fixed term close the covenant for good; runners
    // serving a Conclave season are a person owed, not a bill (runner-at-gate).
    when: {
      anyFlags: ['rain-covenant', 'covenant-broken'],
      notFlags: ['d20-runners-term-fixed'],
    },
    warning: 'The Storm Crows come on Day 34 for what the rain still costs.',
    line: 'Every Storm Crow roost on the Heights emptied toward the tower in the night. The Conclave has come to collect.',
    effects: { flags: ['crow-debt-called'] },
  },
  {
    id: 'runner-at-gate',
    title: 'A runner comes down',
    day: 34,
    when: {
      flags: ['covenant-paid-in-runners'],
      notFlags: ['d20-runners-term-fixed'],
    },
    warning:
      'One of the runners sent up the Heights comes to the gate on Day 34.',
    line: 'A runner in a Conclave sash came down the Heights road in the night and sat on the gate step to wait.',
    effects: { flags: ['d34-runner-at-gate'] },
  },
  {
    id: 'd12-low-carrow-names',
    title: 'Eleven names at the gate',
    inDays: 3,
    hidden: true,
    when: { flags: ['d12-houses-sworn'] },
    line: 'Two Low Carrow women stood at the tower gate at dawn and said eleven names to the Watch, slowly, so the sergeant could write them down. Then they walked home. The crown had sworn.',
  },
  {
    id: 'vane-bolt',
    title: 'Gristle Vane’s filed bolt',
    inDays: 4,
    warning: 'Gristle Vane is showing the filed bolt to people.',
    line: 'Gristle Vane wore the filed bolt to the Saltroad fair on a thong round his neck. He let every caravan master hold it. The crown’s engineers are not welcome on the road this month.',
    effects: { affinity: { saltroad: -5, freeholds: -3 } },
  },
  {
    id: 'engine-fails',
    title: 'The Pack’s engine',
    day: 43,
    warning: 'The Pack’s engine fails on the day the crown filed into it.',
    line: 'The Pack’s water engine seized in the night, on the day it was filed to. The canyon was dry by noon. Gristle Vane has the pin now. He knows whose file it was.',
    effects: { affinity: { jackalwire: -10 } },
  },
  {
    id: 'vault-watched',
    title: 'The old car',
    inDays: 4,
    hidden: true,
    line: 'Two whistles from the rail yards in the night. Then one. Pell came up at dawn: two in grey habits came to the old car with a handcart, saw the hooded lantern, and went away with nothing.',
  },
  {
    id: 'verge-change',
    title: 'A second white glove',
    inDays: 5,
    hidden: true,
    line: 'A white glove lay on the far gate’s step at dawn. Inside it, one silver piece. Change. The sergeant would not touch it. He sent for tongs.',
    effects: { local: { 'gate-watch': -1 } },
  },
  {
    id: 'back-gate-death',
    title: 'The back gates',
    inDays: 3,
    hidden: true,
    line: 'A stranger died at a Freehold back gate with brass in his fist. The gate was shut by the crown’s order. There was nothing left to buy.',
  },
  {
    id: 'thistledown-tokens',
    title: 'The crown’s tokens',
    inDays: 6,
    cost: 15,
    warning: 'The crown answers for forged Thistledown tokens.',
    line: 'Sixty crown tokens turned up on the Freehold road this week. The crown sealed nineteen. The treasury paid Hester for the rest, as promised.',
    unpaid: {
      line: 'Sixty crown tokens on the road, and the crown sealed nineteen. The treasury could not pay for the forgeries. Hester stopped honouring the seal.',
      effects: { affinity: { freeholds: -10 } },
    },
  },
  {
    id: 'bell-garrison',
    title: 'The Bell garrison’s pay',
    inDays: 7,
    every: 7,
    until: 40,
    cost: 6,
    when: { flags: ['bell-under-protection'] },
    warning: 'Twelve of the Watch at Hollow Bell draw pay every week.',
    line: 'Twelve of the Watch at Hollow Bell drew a week’s pay. Mara signed for it.',
    unpaid: {
      line: 'The Bell garrison went unpaid. Three walked home without leave. Mara wrote down which three.',
      effects: { local: { 'gate-watch': -2 }, affinity: { 'hollow-bell': -5 } },
    },
  },
  {
    id: 'watch-names-short',
    title: 'Dunmark’s list',
    day: 20,
    hidden: true,
    line: 'Captain Dunmark’s list is two names shorter this morning. Both were Watch. Both were on the Freehold road the night of the haystacks. Dunmark burned their coats himself.',
  },
  {
    id: 'bell-gate-shut',
    title: 'Hollow Bell’s gate',
    inDays: 2,
    hidden: true,
    when: { flags: ['bell-voted-no'] },
    line: 'Hollow Bell shut its gate to the crown’s riders. The Abbey’s soup carts went in at noon. Mara sent a letter. It was polite. It was four lines long.',
  },
  {
    id: 'ford-burrows',
    title: 'The Ford in the burrows',
    inDays: 1,
    hidden: true,
    when: { flags: ['ford-flooded'] },
    line: 'The Ford came through the burrow ceilings again. Granny Umber sent one line up the shaft to the crown: “Twice now.”',
    effects: { affinity: { moles: -5 } },
  },
  {
    id: 'yard-double-loss',
    title: 'The Yard’s two losses',
    inDays: 1,
    hidden: true,
    when: {
      flags: ['levy-yard', 'covenant-paid-in-runners'],
      notFlags: ['d20-court-runners'],
    },
    line: 'Foreman Dunmore Ash nailed one sheet to the Yard gate at dawn. The levy roll down one side. Three runners’ names down the other. He wrote nothing under them.',
    effects: { local: { yard: -2 } },
  },
  {
    id: 'crow-substitution',
    title: 'The substitution',
    inDays: 7,
    warning: 'The Conclave remembers the brass it took instead of runners.',
    line: 'The Conclave’s forecast reached the Freeholds a day late. Exact to the hour. Half the barley was cut in the rain.',
    effects: { affinity: { freeholds: -5 } },
  },
  {
    id: 'pastures-ceded',
    title: 'Goats on the low road',
    inDays: 4,
    hidden: true,
    line: 'Three hundred Freehold goats on the low road, eating the verge to the root. Hester Plowright sold forty head to the Ledger at half price. She did not haggle.',
    effects: { local: { ledger: 1 } },
  },
]
