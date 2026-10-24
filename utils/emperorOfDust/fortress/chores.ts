import type { QuestDef } from './types'

// Seeded wasteland chores drawn at dawn (content.ts QUEST_TEMPLATES). Each
// draw depends on the run's seed and branch, so a rewound day can post
// different ones. t-041: thirty chores instead of ten, each posted only inside
// its `days`, at most twice a run, never beside another copy of itself or its
// authored twin (`shuns`), and with `outcomeAlts` so its second trip home
// reads differently from its first. Rewards are small: chores are how the
// court keeps faith with its neighbours, not how it gets rich.
export const CHORES: readonly QuestDef[] = [
  // --- the first ten, in the stark register -----------------------------------
  {
    id: 'r-bandit-sighting',
    title: 'Bandits on the Saltroad',
    summary:
      'A caravan master reports armed strangers shadowing the trade road. Drive them off before they pick a target.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'guile', band: 'low' },
    ],
    danger: 'mid',
    tags: ['defense'],
    days: [1, 40],
    rewards: {
      success: { brass: 8, affinity: { saltroad: 3 } },
      failure: { affinity: { saltroad: -3 } },
    },
    expired: { affinity: { saltroad: -3 } },
    outcomes: {
      success:
        'The strangers broke for the hills. They left a cookpot on the fire and a boy of twelve tied to the axle. Nobody claims him.',
      partial:
        'The strangers moved off the road. Not far. Their fires are still there at night.',
      failure:
        'The strangers had crossbows the report never mentioned. The party walked home without their boots.',
      expired: 'The caravan master hired someone else, and told everyone why.',
    },
    outcomeAlts: {
      success: [
        'Three of them ran. The fourth was too slow. The caravan master buried him beside the road and charged the crown for the shovel.',
      ],
      failure: [
        'The strangers were waiting where the road narrows. The party came home in the back of a salt wagon, lying down.',
      ],
      expired: [
        'The caravan went through without an escort. Two wagons came out the far side.',
      ],
    },
  },
  {
    id: 'r-sick-herd',
    title: 'A Sick Herd',
    summary:
      'A Freehold herd is coughing blood. Find out why before it spreads.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'lore', band: 'low', hidden: true },
    ],
    danger: 'low',
    tags: ['medicine'],
    days: [1, 35],
    rewards: {
      success: { brass: 6, affinity: { freeholds: 3 }, local: { yard: 1 } },
      failure: { affinity: { freeholds: -3 } },
    },
    expired: { affinity: { freeholds: -5 } },
    outcomes: {
      success:
        'A cracked cistern, and a body in the water. The herd will live.',
      partial: 'Half the herd stood up again. The other half went to the pit.',
      failure:
        'Nobody could say what it was. The farmer burned the herd himself and would not let anyone help.',
      expired: 'The cough crossed the fence to the next farm by morning.',
    },
    outcomeAlts: {
      success: [
        'Bad feed, not bad blood. The party burned one rick and saved the rest. The farmer cried, then charged them for the rick.',
      ],
      failure: [
        'The herd went down one at a time while the party watched. The smoke from the pit was black for two days.',
      ],
      expired: ['By the time anyone thought of it, the pit was already dug.'],
    },
  },
  {
    id: 'r-lost-caravan',
    title: 'The Late Caravan',
    summary:
      'A Saltroad caravan is three days late. Find the tracks before the wind does.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'mid',
    tags: ['tracking'],
    days: [1, 30],
    rewards: {
      triumph: { brass: 16, affinity: { saltroad: 5 } },
      success: { brass: 8, affinity: { saltroad: 3 } },
      failure: { affinity: { saltroad: -5 } },
    },
    expired: { affinity: { saltroad: -5 } },
    outcomes: {
      triumph:
        'The caravan was stuck in a dry wash, every wagon whole. The drivers had started rationing the water by the cup.',
      success:
        'The caravan is found. Two wagons are not. Nobody asks after the drivers.',
      partial:
        'The tracks ended at one wagon on its side. The mules were gone. So were the drivers.',
      failure: 'The wind took the tracks. The Saltroad has stopped asking.',
      expired:
        'The caravan never arrived. Its bells turned up a week later, for sale at the Ford.',
    },
    outcomeAlts: {
      triumph: [
        'They found it at the bottom of a dune, buried to the axles, the drivers asleep under it. Every bale of salt was there.',
      ],
      success: [
        'The caravan was holed up in a cut, waiting out a band of riders who never came. One driver had a fever. He made it home.',
      ],
      partial: [
        'They found the lead wagon and its driver, alone, walking it home with no mule. He would not say where the rest went.',
      ],
      failure: [
        'Two days of tracks that went nowhere. The party came back with sand in their teeth and nothing else.',
      ],
    },
  },
  {
    id: 'r-boundary-dispute',
    title: 'A Fence in the Wrong Place',
    summary:
      'Two Hollow Bell families both claim the same well, and one of them has built a fence around it.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [{ stat: 'heart', band: 'mid' }],
    danger: 'none',
    tags: ['negotiation'],
    days: [1, 30],
    rewards: {
      success: {
        brass: 3,
        affinity: { 'hollow-bell': 3 },
        local: { 'old-houses': 1 },
      },
      failure: { affinity: { 'hollow-bell': -3 } },
    },
    expired: { affinity: { 'hollow-bell': -2 } },
    outcomes: {
      success:
        'The fence is a gate now. Both families have a key. Neither will use it first.',
      partial:
        'The fence stays. The shouting stopped. The children still are not allowed to play together.',
      failure:
        'The fence is a wall now. Someone has set broken glass along the top.',
      expired:
        'The families settled it themselves, with shovels. One of them is still limping.',
    },
    outcomeAlts: {
      success: [
        'The party drew a chalk line through the middle of the well. Both families spat on it. Both families drink.',
      ],
      failure: [
        'The older son struck the party’s envoy with a fence post. The well belongs to whoever is holding the post.',
      ],
      expired: [
        'One family moved away in the night. The other family now owns a well and a house with no neighbours.',
      ],
    },
  },
  {
    id: 'r-strange-relic',
    title: 'Glass That Does Not Break',
    summary:
      'Salvagers dug up a pane of old-world glass that will not shatter. The Archive wants it studied before it is sold.',
    region: 'rail-yards',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'low',
    tags: ['records'],
    days: [1, 40],
    shuns: ['q-d15-study-glass'],
    rewards: {
      success: { brass: 6, local: { lamplight: 3 } },
      failure: { local: { lamplight: -1 } },
    },
    expired: { local: { lamplight: -1 } },
    outcomes: {
      success:
        'The glass is catalogued. It hums when the bell rings. Nobody at the Archive has slept well since.',
      partial: 'The glass is catalogued, roughly. Half the notes are guesses.',
      failure:
        'The salvagers sold it before anyone arrived. They would not say to whom.',
      expired: 'The salvagers sold it. The buyer wore grey.',
    },
    outcomeAlts: {
      success: [
        'A hammer bounced off it. A chisel bounced off it. A clerk breathed on it and it fogged with a handprint that was not his.',
      ],
      failure: [
        'The pane was there. The salvager who found it was not. His crew had already split his share.',
      ],
    },
  },
  {
    id: 'r-roost-storm',
    title: 'A Roost in the Storm',
    summary:
      'Lightning split a Storm Crow roost on the Heights, and the fledglings are on the ledge below it. The Crows will not ask for help. Go anyway.',
    region: 'storm-crow-heights',
    faction: 'storm-crows',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'might', band: 'low' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'low',
    tags: ['weather'],
    days: [1, 40],
    rewards: {
      success: { brass: 6, affinity: { 'storm-crows': 3 } },
      failure: { affinity: { 'storm-crows': -2 } },
    },
    expired: { affinity: { 'storm-crows': -2 } },
    outcomes: {
      success:
        'Every fledgling is back in a dry nest. An elder watched the whole climb without a word. That was thanks enough.',
      partial: 'The party brought up five. The ledge kept the sixth.',
      failure:
        'The rock was wet and the rope was short. The Crows took it from there, and did not look at the party once.',
      expired: 'The Crows managed alone, and wrote down who did not come.',
    },
    outcomeAlts: {
      success: [
        'The party climbed in the rain with the fledglings inside their shirts. One bit through a thumbnail. All of them lived.',
      ],
      partial: [
        'They got the small ones. The biggest fledgling tried to fly. It almost could.',
      ],
    },
  },
  {
    id: 'r-fen-lantern',
    title: 'A Light Gone Out',
    summary:
      'One of the green lights on the Mirefen causeway has gone dark, and travellers are walking off the path. Relight it before someone drowns.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'low',
    tags: ['tracking'],
    days: [1, 45],
    rewards: {
      success: {
        brass: 6,
        affinity: { 'mire-mothers': 3 },
        local: { lamplight: 1 },
      },
      failure: { affinity: { 'mire-mothers': -2 } },
    },
    expired: { affinity: { 'mire-mothers': -2 } },
    outcomes: {
      success:
        'It burns green again. The reeds leaned toward the tower all evening.',
      partial:
        'It flickers. A few nights, maybe. The party did not like how it looked at them.',
      failure: 'The wick would not take. The causeway stays dark.',
      expired:
        'Someone walked off the path that night. The fen did not give them back.',
    },
    outcomeAlts: {
      success: [
        'The oil was fish fat and something else. The party did not ask. The light took on the first strike.',
      ],
      expired: [
        'A pedlar and his donkey went into the water at the dark post. The donkey came out.',
      ],
    },
  },
  {
    id: 'r-wagon-escort',
    title: 'An Escort for the Painted Wagons',
    summary:
      'A Jackalwire wagon wants to cross Freehold land to sell scrap at the Ford, and nobody will let it pass without a crown escort.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'might', band: 'low' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    days: [1, 35],
    rewards: {
      success: { brass: 6, affinity: { jackalwire: 3 } },
      failure: { affinity: { jackalwire: -2, freeholds: -2 } },
    },
    expired: { affinity: { jackalwire: -2 } },
    outcomes: {
      success:
        'The wagon reached the Ford, sold everything and left before anyone changed their mind. The Pack sent a painted hubcap.',
      partial: 'The wagon got through. It lost a wheel and most of its temper.',
      failure:
        'A Freehold farmer and a Pack driver came to blows at the gate. The farmer lost an eye.',
      expired:
        'The wagon turned back. The Pack blamed the crown, out loud, at every fire.',
    },
    outcomeAlts: {
      success: [
        'Freehold children threw stones the whole way. The driver caught one and kept it. He says it is the best thing he sold all year.',
      ],
      failure: [
        'Someone cut the wagon’s traces in the night. The Pack walked home. The scrap stayed in a Freehold ditch.',
      ],
    },
  },
  {
    id: 'r-tunnel-rescue',
    title: 'A Tunnel Caved In',
    summary:
      'A side tunnel under the badlands came down in the night with two diggers trapped behind it. The Moles are digging. They need more hands.',
    region: 'mole-tunnels',
    faction: 'moles',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'mid',
    tags: ['tunnels', 'urgent'],
    days: [1, 50],
    rewards: {
      success: { affinity: { moles: 3 }, local: { yard: 1 } },
      failure: { affinity: { moles: -2 } },
    },
    expired: { affinity: { moles: -3 } },
    outcomes: {
      success:
        'Both diggers came out blinking and furious about the delay. Granny Umber sent a jar of honey up to the tower.',
      partial:
        'One digger came out. The Moles are still digging for the other. They will dig until they find something.',
      failure:
        'The roof came down again before anyone reached them. The Moles sealed the tunnel and sang over it.',
      expired: 'The Moles dug alone, all night. In the morning they stopped.',
    },
    outcomeAlts: {
      success: [
        'They heard tapping by noon and broke through by dark. The younger digger had kept the older one awake by telling him lies.',
      ],
      failure: [
        'They reached the air pocket at dawn. It was quiet. The Moles carried the two of them out wrapped in one blanket.',
      ],
      expired: [
        'Granny Umber went down herself. She came up alone and did not speak to the tower for a week.',
      ],
    },
  },
  {
    id: 'r-salvage-claim',
    title: 'A Disputed Salvage Claim',
    summary:
      'Two Rustline crews both say they found the same derailed engine first. Settle it before they settle it with crowbars.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'none',
    tags: ['negotiation', 'records'],
    days: [11, 40],
    rewards: {
      success: { brass: 4, affinity: { rustline: 3 } },
      failure: { affinity: { rustline: -2 } },
    },
    expired: { affinity: { rustline: -2 } },
    outcomes: {
      success:
        'The engine was cut down the middle along a chalk line. Both crews say they were cheated, which means it was fair.',
      partial:
        'The crews agreed to share it. For now. They are both sleeping beside it.',
      failure:
        'The crowbars came out anyway. A digger named Dace will not use his left hand again.',
      expired: 'The crowbars decided it.',
    },
    outcomeAlts: {
      success: [
        'The party found the first crew’s chalk mark under the second crew’s paint. The second crew left without a word. The first crew paid the crown a tithe in bolts.',
      ],
      expired: [
        'By the time anyone looked, the engine was gone, carried off in pieces by a third crew nobody had heard of.',
      ],
    },
  },

  // --- Act I and II: the kingdom's small cruelties ----------------------------
  {
    id: 'r-well-poison',
    title: 'Something in the Well',
    summary:
      'A Freehold well at Thistle Row has turned sweet, and three children who drank from it will not wake. Find what is in the water.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'low',
    tags: ['medicine', 'urgent'],
    days: [4, 30],
    rewards: {
      success: { brass: 6, affinity: { freeholds: 4 }, local: { yard: 1 } },
      failure: { affinity: { freeholds: -3 } },
    },
    expired: { affinity: { freeholds: -4 } },
    outcomes: {
      success:
        'Honey-root, dumped upstream to kill rats. The children woke on the second day. One of them asked for more of the sweet water.',
      partial:
        'Two of the children woke. The third is breathing. That is all anyone will say.',
      failure:
        'The party could not name it. The well was filled with stones. Thistle Row walks a mile for water now.',
      expired:
        'The mothers sat by the beds all night. In the morning they filled the well themselves.',
    },
    outcomeAlts: {
      success: [
        'A dead mule in the feeder stream, three days rotted. The party hauled it out with their hands. The water ran clear by dusk.',
      ],
      failure: [
        'They tested the water on a goat. The goat lay down and did not get up. The well was capped with a millstone.',
      ],
    },
  },
  {
    id: 'r-debt-collector',
    title: 'The Collector at the Yard',
    summary:
      'The Ledger has sent a collector to the Yard with a list of names. He is taking tools. He will take beds next. The Yard wants the crown to stand between.',
    region: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'none',
    tags: ['negotiation', 'coercion'],
    days: [6, 38],
    rewards: {
      triumph: { brass: 8, local: { yard: 3, ledger: -1 } },
      success: { brass: 4, local: { yard: 2, ledger: -1 } },
      partial: { local: { yard: 1 } },
      failure: { local: { yard: -2, ledger: 1 } },
    },
    expired: { local: { yard: -2, ledger: 1 } },
    outcomes: {
      success:
        'The collector went home with half his list crossed out and a crown seal on the other half. The Ledger will remember the seal.',
      partial:
        'He took the tools and left the beds. A smith in the Yard sharpens nails with a stone now.',
      failure:
        'The collector read the crown’s letter aloud, folded it into his list and took the beds anyway.',
      expired:
        'The collector took a cradle. The family had nothing else on the list.',
    },
    outcomeAlts: {
      success: [
        'The party read the collector’s list against his own receipts. Four names were paid twice. He left the Yard faster than he came.',
      ],
      failure: [
        'The collector had a Gate Watch escort. The party stood aside. The Yard watched them stand aside.',
      ],
      expired: [
        'He took a cooper’s whole kit. The cooper sat in his empty shop all day with his hands in his lap.',
      ],
    },
  },
  {
    id: 'r-runaway-runner',
    title: 'A Runner in the Reeds',
    summary:
      'A bonded Conclave runner has run. The Crows want her back and are paying for news of her. The Mirefen say she asked them for a boat.',
    region: 'mirefen',
    faction: 'storm-crows',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'low',
    tags: ['tracking'],
    days: [8, 35],
    rewards: {
      success: {
        brass: 6,
        affinity: { 'storm-crows': 4, 'mire-mothers': -2 },
      },
      failure: { affinity: { 'storm-crows': -2 } },
    },
    expired: { affinity: { 'mire-mothers': 2, 'storm-crows': -2 } },
    outcomes: {
      success:
        'She was hiding in a duck blind with a knife she did not know how to hold. The Crows paid. She did not look back at the party once.',
      partial:
        'They found the boat. Not her. The Crows paid half and asked twice.',
      failure:
        'Her tracks went into the water and did not come out. The Crows say the crown let her go. The Crows may be right.',
      expired:
        'The Mirefen gave her the boat. The Crows know it. They know who did not look.',
    },
    outcomeAlts: {
      success: [
        'She gave herself up when she saw the crown’s colours. She thought it meant mercy. It meant the bounty.',
      ],
      expired: [
        'A girl in a Mirefen boat was seen at dawn, rowing badly, going south. Nobody followed.',
      ],
    },
  },
  {
    id: 'r-fever-ward',
    title: 'Fever in the Yard',
    summary:
      'A fever is moving through the Yard’s back rows. The healer has one bed and nine names. Somebody has to choose, or find more beds.',
    region: 'saltroad',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    tags: ['medicine'],
    days: [11, 40],
    rewards: {
      triumph: { brass: 16, local: { yard: 3 } },
      success: { brass: 8, local: { yard: 2 } },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -3 } },
    outcomes: {
      triumph:
        'The party boiled every sheet in the back rows and slept in the street. Nine went in. Nine came out.',
      success:
        'Seven of nine stood up again. The healer burned the bedding of the other two and wrote their names on the wall.',
      partial:
        'The fever broke on the fourth night. Four of the nine were already under the ash pile.',
      failure:
        'The fever went through the back rows and into the front ones. The party came home coughing.',
      expired:
        'The healer chose. She will not say how. She has not slept since.',
    },
    outcomeAlts: {
      success: [
        'They turned the grain store into a ward and the grain into broth. Six lived. The grain was the crown’s. Nobody mentions it.',
      ],
      failure: [
        'The healer caught it on the third day. The party nursed her with the others. She went first.',
      ],
    },
  },
  {
    id: 'r-pack-raid',
    title: 'Pups in the Grain Store',
    summary:
      'Hyena pups are slipping into a Freehold grain store at night. The farmers have set traps with teeth. The Pack says touch one pup and see.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'guile', band: 'low' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    days: [11, 35],
    rewards: {
      success: { brass: 6, affinity: { jackalwire: 3, freeholds: 2 } },
      failure: { affinity: { jackalwire: -3, freeholds: -2 } },
    },
    expired: { affinity: { jackalwire: -4 } },
    outcomes: {
      success:
        'The party sprang every trap with a stick and sat in the store all night. At dawn they walked three pups home by the scruff. The farmer fixed his door.',
      partial:
        'The traps came up. The pups still come. The farmer has started leaving out the spoiled sacks.',
      failure:
        'A trap closed on a pup before the party got there. The Pack came for it in daylight. The farmer’s dog did not come home.',
      expired:
        'A trap took a pup’s foot off. The Pack hung the trap from the farmer’s gate.',
    },
    outcomeAlts: {
      success: [
        'The pups were taking the grain to their mothers. The party told the farmer. The farmer did not say anything for a long while. Then he left a sack by the fence.',
      ],
    },
  },
  {
    id: 'r-salt-weigh',
    title: 'Short Weight at the Scales',
    summary:
      'Someone at the Saltroad scales is selling a pound that weighs fourteen ounces. The buyers are the Yard’s cooks. Find the thumb on the scale.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'guile', band: 'low', hidden: true },
    ],
    danger: 'none',
    tags: ['records', 'forgery'],
    days: [10, 40],
    rewards: {
      success: { brass: 4, local: { yard: 2 }, affinity: { saltroad: -1 } },
      failure: { local: { yard: -1 } },
    },
    expired: { local: { yard: -1 } },
    outcomes: {
      success:
        'Lead in the pan, under the felt. The weigher was the factor’s nephew. The Saltroad paid the Yard back in salt and does not like the crown for it.',
      partial:
        'The scales are honest now. The weigher is gone. So is the Yard’s money.',
      failure:
        'The party weighed every pan twice and found nothing. The cooks still swear the pound is short.',
      expired:
        'The cooks bought short all month. They cut the soup with river water.',
    },
    outcomeAlts: {
      success: [
        'The weights were cast hollow. The party broke one open on the counter in front of the queue. Nobody in the queue said thank you. They said about time.',
      ],
    },
  },
  {
    id: 'r-bell-thief',
    title: 'The Chapel Poor Box',
    summary:
      'Someone is emptying Hollow Bell’s poor box a coin at a time. The chapel suspects the gravedigger’s boy. The gravedigger suspects the chapel.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'none',
    tags: ['records'],
    days: [11, 40],
    rewards: {
      success: { brass: 4, affinity: { 'hollow-bell': 3 } },
      failure: { affinity: { 'hollow-bell': -2 } },
    },
    expired: { affinity: { 'hollow-bell': -2 } },
    outcomes: {
      success:
        'It was the curate. He was buying medicine for his mother. The chapel forgave him. The town did not.',
      partial:
        'The thefts stopped. Nobody was caught. Everybody has a name in mind.',
      failure:
        'The party named the gravedigger’s boy. The chapel whipped him. The coins kept going missing.',
      expired: 'The chapel put a lock on the box. Now it holds nothing at all.',
    },
    outcomeAlts: {
      success: [
        'A hoarder had hidden the copper in the bell loft. The gravedigger’s boy was set free and given the abandoned room.',
      ],
      failure: [
        'The party watched the box for a night and fell asleep. In the morning the box was empty and someone had left them a blanket.',
      ],
    },
  },

  // --- Act II to IV: the war comes closer --------------------------------------
  {
    id: 'r-trestle-sags',
    title: 'The Trestle Sags',
    summary:
      'The old rail trestle over the canyon groans when the wind turns. A Rustline crew will shore it up if someone stands under it with them.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['repair'],
    days: [14, 45],
    rewards: {
      success: { brass: 8, affinity: { rustline: 3 } },
      failure: { affinity: { rustline: -3 } },
    },
    expired: { affinity: { rustline: -2 } },
    outcomes: {
      success:
        'Four new beams and a cable from a dead crane. The trestle stopped talking. The crew foreman shook every hand with his good one.',
      partial:
        'They braced two spans of three. A sign at the near end now reads ONE AT A TIME.',
      failure:
        'A beam came loose and took a Rustline girl into the canyon with it. The crew went home. The trestle still groans.',
      expired:
        'The wind turned on the third night. Half the trestle is in the canyon now.',
    },
    outcomeAlts: {
      success: [
        'They worked by the light of a burning tyre. At dawn a goat crossed the trestle to test it. It is still a good goat.',
      ],
      failure: [
        'The cable snapped and caught a Rustline man across the chest. He will live. He will not climb again.',
      ],
    },
  },
  {
    id: 'r-fen-gave-back',
    title: 'What the Fen Gave Back',
    summary:
      'The Mirefen surfaced a body in the night, wrapped in prayer cloth, a coin in its mouth. The Mire Mothers want it reburied. The Archive wants it read.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'mid' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'low',
    tags: ['records'],
    days: [14, 45],
    rewards: {
      success: {
        brass: 6,
        affinity: { 'mire-mothers': 3 },
        local: { lamplight: 1 },
      },
      failure: { affinity: { 'mire-mothers': -3 } },
    },
    expired: { affinity: { 'mire-mothers': -2 } },
    outcomes: {
      success:
        'The coin was old crown brass with a face nobody knew. The party copied it and put it back between the teeth. The fen took the body down again without a ripple.',
      partial:
        'They reburied it. The clerk kept the coin. The clerk has not been well since.',
      failure:
        'The party argued over it until the tide turned. The fen took the body back on its own. The Mothers did not forgive the argument.',
      expired:
        'The body lay on the bank three days. Then something came for it.',
    },
    outcomeAlts: {
      success: [
        'Under the cloth was a girl of maybe ten, perfectly kept. The Mothers sang. The party held the rope. Nobody wrote anything down.',
      ],
    },
  },
  {
    id: 'r-low-galleries',
    title: 'Water in the Low Galleries',
    summary:
      'Rain found a crack and the Moles’ lowest galleries are flooding. The nursery is down there. Bring hands and buckets and do not stop.',
    region: 'mole-tunnels',
    faction: 'moles',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'mid',
    tags: ['tunnels', 'urgent', 'weather'],
    days: [18, 50],
    rewards: {
      success: { affinity: { moles: 4 } },
      failure: { affinity: { moles: -3 } },
    },
    expired: { affinity: { moles: -4 } },
    outcomes: {
      success:
        'A bucket line forty paws long, all night. The nursery is dry. The Moles named the new gallery after the party and then changed their minds and named it after the bucket.',
      partial:
        'The nursery is out. The stores are not. The Moles will be hungry this month.',
      failure:
        'The water came faster than the buckets. The Moles closed the lowest door with the water on the other side. They will not say who was behind it.',
      expired:
        'The Moles bailed alone. In the morning there were fewer cradles.',
    },
    outcomeAlts: {
      success: [
        'They dug a channel to the old well and let the water fall away into the dark. It is still falling. Nobody has heard it land.',
      ],
    },
  },
  {
    id: 'r-verge-scouts',
    title: 'Plum Scouts on the Ridge',
    summary:
      'Riders in plum have been seen counting the Freehold barns from the ridge. Run them off, or let them count. Run them off and someone may not come back.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 2,
    party: { min: 2, max: 3 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['defense'],
    days: [22, 40],
    rewards: {
      triumph: {
        affinity: { freeholds: 5 },
        strength: { freeholds: 1 },
        local: { 'gate-watch': 2 },
      },
      success: {
        brass: 12,
        affinity: { freeholds: 4 },
        local: { 'gate-watch': 1 },
      },
      failure: { affinity: { freeholds: -2 } },
    },
    expired: { affinity: { freeholds: -3 } },
    outcomes: {
      triumph:
        'The scouts ran. The party caught one horse and the count he had made. Every barn on the ridge was on it, with a number for the people inside.',
      success:
        'The scouts went back over the ridge at a gallop. They will come back with more.',
      partial:
        'One scout stayed down. The others left with the count. The party buried the one who stayed.',
      failure:
        'The scouts were not scouts. The party came back over the ridge carrying what they could.',
      expired:
        'They counted every barn. Two weeks later the count was correct to the head.',
    },
    outcomeAlts: {
      success: [
        'An arrow in a saddle and a plum cloak in the mud. The ridge is empty this morning. The farmers sleep in their clothes.',
      ],
      failure: [
        'Plum horses came down the ridge at a walk. The party ran. Not all of them ran fast enough.',
      ],
    },
  },
  {
    id: 'r-deserter',
    title: 'A Watchman Over the Wall',
    summary:
      'A Gate Watch private went over the wall with his kit and a sergeant’s purse. Dunmark wants him back to hang. His mother wants him back alive.',
    region: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'low',
    tags: ['tracking', 'coercion'],
    days: [24, 40],
    rewards: {
      success: { brass: 6, local: { 'gate-watch': 2 } },
      partial: { local: { yard: 1 } },
      failure: { local: { 'gate-watch': -2 } },
    },
    expired: { local: { 'gate-watch': -1 } },
    outcomes: {
      success:
        'He was asleep in his mother’s woodshed with the purse under his head. He came back quietly. Dunmark hanged him at noon. His mother watched.',
      partial:
        'The party found him and let him go, minus the purse. The Watch has one less private and one more story.',
      failure:
        'He was gone. The purse turned up in a Pack game, two nights later.',
      expired: 'Dunmark sent his own men. They brought back the kit.',
    },
    outcomeAlts: {
      success: [
        'He had spent the purse on bread for his street. He gave back the crusts. Dunmark took twenty lashes off the sentence and none off the rope.',
      ],
    },
  },
  {
    id: 'r-thistle-smoke',
    title: 'Smoke Over Thistle Row',
    summary:
      'Barns are burning on the Freehold edge, one a night, always the one with people sleeping in it. Find who is lighting them.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'might', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking', 'defense'],
    days: [26, 40],
    rewards: {
      success: {
        brass: 8,
        affinity: { freeholds: 4 },
        local: { 'gate-watch': 1 },
      },
      failure: { affinity: { freeholds: -3 } },
    },
    expired: { affinity: { freeholds: -4 } },
    outcomes: {
      success:
        'A Freehold widow with a grudge and a tinderbox. Her own barn burned first, last year, and nobody came. The party brought her in. The fires stopped.',
      partial:
        'The fires stopped. Nobody was caught. Somebody still has the tinderbox.',
      failure:
        'Another barn went up the night the party stood watch. There was a family in it. The party got the father out.',
      expired:
        'Three more barns. The Freeholds have started sleeping in shifts.',
    },
    outcomeAlts: {
      success: [
        'Boys, three of them, paid in brass by a man in grey. The boys are in the stocks. The man in grey is not anywhere.',
      ],
    },
  },
  {
    id: 'r-dead-engine',
    title: 'Lights in the Dead Engine',
    summary:
      'An engine that has not moved in a hundred years is showing lights at night. The Rustline will not go near it. The Archive will, if someone holds the rope.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'high' },
      { stat: 'might', band: 'low' },
    ],
    danger: 'low',
    tags: ['records', 'repair'],
    days: [15, 45],
    rewards: {
      success: { brass: 6, local: { lamplight: 2 }, affinity: { rustline: 2 } },
      failure: { local: { lamplight: -1 } },
    },
    expired: {},
    outcomes: {
      success:
        'A battery the size of a coffin, still holding a charge. It lit three bulbs and a voice that said one word over and over in no language anybody knew.',
      partial:
        'The lights went out when the party came close. They came back on when the party left.',
      failure:
        'The clerk on the rope came back with his hair standing up and would not say why.',
      expired:
        'The lights went out on their own on the fourth night. Nobody went to see.',
    },
    outcomeAlts: {
      success: [
        'Glow-moss in the boiler, nothing more. The clerk was disappointed. The Rustline paid the crown anyway, for the peace of mind.',
      ],
    },
  },
  {
    id: 'r-graves',
    title: 'Graves Without Names',
    summary:
      'Hollow Bell is out of ground. The war sends bodies faster than the gravedigger can mark them. Someone has to write down who is in which hole.',
    region: 'hollow-bell',
    faction: 'hollow-bell',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'lore', band: 'low' },
    ],
    danger: 'none',
    tags: ['records'],
    days: [30, 50],
    rewards: {
      success: {
        brass: 4,
        affinity: { 'hollow-bell': 3 },
        local: { lamplight: 1 },
      },
      failure: { affinity: { 'hollow-bell': -2 } },
    },
    expired: { affinity: { 'hollow-bell': -2 } },
    outcomes: {
      success:
        'Forty-one names on forty-one boards. Six of them say only “a boy” or “a woman, tall”. The party wrote those too.',
      partial:
        'Half the boards have names. The other half have numbers. The numbers are in a book.',
      failure:
        'The rain washed the chalk off before the paint came. The gravedigger started over.',
      expired:
        'The gravedigger stopped marking them. He says the ground knows.',
    },
    outcomeAlts: {
      success: [
        'A mother came while they worked and told them her son’s name. She stood at the board until the paint dried.',
      ],
    },
  },

  {
    id: 'r-ferry-stalled',
    title: 'The Ferry Will Not Cross',
    summary:
      'The Mirefen ferryman has tied up his raft and will not cross until someone pays what the last passenger owed him. The last passenger was a crown courier, and he drowned.',
    region: 'mirefen',
    faction: 'mire-mothers',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'guile', band: 'mid', hidden: true },
    ],
    danger: 'low',
    tags: ['negotiation'],
    days: [32, 48],
    rewards: {
      success: { brass: 6, affinity: { 'mire-mothers': 3, saltroad: 1 } },
      failure: { affinity: { 'mire-mothers': -2 } },
    },
    expired: { affinity: { saltroad: -2 } },
    outcomes: {
      success:
        'The party sat with the ferryman and the courier’s satchel until he could say what happened. Then he untied the raft.',
      partial:
        'He crosses again. Not at night. Not with anyone in crown colours.',
      failure:
        'He spat in the water and went inside. The raft is still tied. The traffic goes the long way, three days round.',
      expired:
        'The Saltroad built its own raft. It sank on the second crossing, loaded.',
    },
    outcomeAlts: {
      success: [
        'The courier had owed him for nine crossings. The party paid in rope and nails. The ferryman counted the nails twice.',
      ],
    },
  },

  // --- Act V: the court in hiding ------------------------------------------------
  {
    id: 'r-hidden-bread',
    title: 'Bread Without Questions',
    summary:
      'A miller two valleys over will sell flour to anyone who does not say who they are. The crown pays his price: 12 brass for the sacks, and the risk of being seen.',
    region: 'east-ford',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    days: [41, 49],
    rewards: {
      success: { brass: -12, local: { yard: 3 } },
      partial: { brass: -12, local: { yard: 1 } },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -2 } },
    outcomes: {
      success:
        'Six sacks, paid in crown brass, carried by night. The miller counted the coins twice and did not look at the faces.',
      partial:
        'Six sacks paid for. Two arrived. A cart wheel broke in the dark and the rest went into a ditch.',
      failure:
        'The miller took one look at the party and shut his door. The Yard ate thin soup that week.',
      expired: 'The miller sold the flour to someone else. Someone in grey.',
    },
    outcomeAlts: {
      success: [
        'The miller’s wife put a loaf in for free and asked them to say a word for her son, who rode with the Watch. They said it.',
      ],
    },
  },
  {
    id: 'r-checkpoint',
    title: 'The Toll at the Crossing',
    summary:
      'The buyer’s men hold the river crossing and stop everyone. A letter has to reach the far bank. A purse of 10 brass may get it across. So may a good lie.',
    region: 'mission-road',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'high' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'mid',
    tags: ['coercion', 'forgery'],
    days: [42, 49],
    rewards: {
      triumph: { local: { 'gate-watch': 2, yard: 1 } },
      success: { brass: -10, local: { 'gate-watch': 2 } },
      failure: { local: { 'gate-watch': -1 } },
    },
    expired: {},
    outcomes: {
      triumph:
        'The party talked their way across with a pass that said nothing true. The purse came home full.',
      success:
        'The sergeant at the crossing took the purse and did not count it. The letter is on the far bank.',
      partial:
        'The letter got across. The party did not. They waited in a culvert until dark.',
      failure:
        'The sergeant read the letter, smiled and kept it. The party walked home the long way, through the river.',
      expired: 'The letter stayed in its satchel. The far bank never heard.',
    },
    outcomeAlts: {
      success: [
        'They paid a ferryman’s boy to swim it over in his teeth. The boy came back for more brass. He got it.',
      ],
    },
  },
  {
    id: 'r-last-straggler',
    title: 'One More on the Road',
    summary:
      'A cook from the tower kitchens is walking the roads at night calling for the court by name. Someone has to bring her in before someone else does.',
    region: 'saltroad',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking', 'urgent'],
    days: [42, 49],
    rewards: {
      success: { local: { yard: 2 } },
      failure: { local: { yard: -1 } },
    },
    expired: { local: { yard: -2 } },
    outcomes: {
      success:
        'She was sitting in a ditch with her shoes in her lap. She had walked eleven miles. She asked if anyone had eaten.',
      partial:
        'They found her shawl on a fence post and her tracks going toward the tower.',
      failure:
        'Riders found her first. The party heard it from the trees and could not get there.',
      expired: 'Nobody went. The calling stopped on the second night.',
    },
    outcomeAlts: {
      success: [
        'It was the scullery boy, not a cook. He had brought the good knives. All of them, wrapped in a curtain.',
      ],
    },
  },
  {
    id: 'r-face-at-window',
    title: 'A Face at the Window',
    summary:
      'Someone in the next village has been asking where the old court sleeps, and paying for answers. Find who is asking before the answer gets back to the tower.',
    region: 'east-ford',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking', 'coercion'],
    days: [43, 49],
    rewards: {
      success: { local: { 'gate-watch': 2 } },
      failure: { brass: -10, local: { 'gate-watch': -2 } },
    },
    expired: { brass: -10 },
    outcomes: {
      success:
        'A tinker with a buyer’s token sewn in his hat. The party took the hat. They let him keep his head. He left at a run.',
      partial:
        'The asking stopped. Nobody knows if it stopped because it got its answer.',
      failure:
        'The tinker had friends. The court moved its stores in the night and lost ten brass of them on the road.',
      expired:
        'The answer got back. The court moved its stores in the night and lost ten brass of them on the road.',
    },
    outcomeAlts: {
      success: [
        'A girl of fourteen, paid a copper a question. The party paid her two to stop. She took them both and asked what else they needed.',
      ],
    },
  },
]
