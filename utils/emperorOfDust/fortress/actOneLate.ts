import type { DayDef, QuestDef } from './types'

// Act I, Days 5-10 (conductor DAY-PLAN.md): the toll comes due, the first
// secret revealed, Komodo's first lie of his own, the Abbey's first offer,
// the first lethal quest, and the Gate Watch's oath before the map changes.

export const ACT_ONE_LATE_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d05-flour-barrels',
    title: 'Flour Before the Wages Fail',
    summary:
      'The Yard’s kitchens are three days from empty. Haggle flour barrels out of the Saltroad carts before the foreman’s patience runs out.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'low' },
      { stat: 'wits', band: 'low' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    rewards: {
      success: { brass: -10, affinity: { saltroad: 5 }, local: { yard: 2 } },
      failure: { local: { yard: -1 } },
    },
    expired: { local: { yard: -2 } },
    outcomes: {
      success:
        'The barrels roll in at dusk, cheaper than the foreman feared. The kitchens sing for a full night.',
      partial: 'Half the barrels arrive. The Yard rations bread by the slice.',
      failure:
        'The carts wanted more than the tower could pay. The Yard tightens its belts and its jaws.',
      expired:
        'No one went. The foreman served porridge for supper and made sure everyone knew whose fault it was.',
    },
  },
  {
    id: 'q-d05-toll-standoff',
    title: 'Hold the Toll Bridge',
    summary:
      'Captain Gristle Vane’s wagons are back at the southern bridge. Hold it open for the Saltroad carts without starting a war.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'mid',
    tags: ['defense'],
    rewards: {
      triumph: {
        brass: 20,
        affinity: { saltroad: 15, jackalwire: -5 },
        local: { 'gate-watch': 3 },
        strength: { jackalwire: -1 },
      },
      success: {
        brass: 10,
        affinity: { saltroad: 10, jackalwire: -10 },
        local: { 'gate-watch': 2 },
      },
      partial: { affinity: { saltroad: 3, jackalwire: -5 } },
      failure: {
        affinity: { saltroad: -5, jackalwire: -5 },
        local: { 'gate-watch': -2 },
      },
    },
    expired: { affinity: { saltroad: -5 } },
    outcomes: {
      triumph:
        'The bridge stayed open for two days and the Pack went home with nothing but a sore opinion of the tower.',
      success:
        'The carts crossed. Gristle Vane watched every one of them and counted.',
      partial: 'Half the carts crossed before the wagons closed ranks again.',
      failure: 'The Pack held the bridge and laughed about it all night.',
      expired: 'Nobody went. The Saltroad carts took the long road again.',
    },
  },
  {
    id: 'q-d05-saltroad-escort',
    title: 'Raiders for Hire',
    summary:
      'Pay the Jackalwire to guard the Saltroad carts they used to rob. Someone has to make sure they actually do it.',
    region: 'saltroad',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'mid' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    rewards: {
      success: {
        affinity: { jackalwire: 15, saltroad: 5 },
        flags: ['jackalwire-escort-pact'],
      },
      failure: { affinity: { saltroad: -10 }, brass: -10 },
    },
    expired: { affinity: { jackalwire: -5 } },
    outcomes: {
      success:
        'The Pack guarded the carts, and only ate one goat that was not theirs. The Saltroad calls that a pact.',
      partial: 'The carts arrived. Some of the cargo did not.',
      failure:
        'The escort vanished on the second night, along with three crates.',
      expired: 'The offer went stale. The Pack took it as an insult.',
    },
  },
  {
    id: 'q-d06-empty-stable',
    title: 'The Empty Stable',
    summary:
      'Every mount in the fortress stable is gone: the gate was opened from the inside, a horse came back lame, and the stablehands are not talking.',
    region: 'east-ford',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'wits', band: 'low' },
      { stat: 'guile', band: 'low' },
    ],
    danger: 'low',
    // Each starter has a secret that fits one of these: this quest is where
    // the court first learns what its followers are hiding.
    tags: ['tracking', 'repair', 'medicine', 'negotiation'],
    rewards: {
      success: {
        brass: 10,
        local: { yard: 2, 'gate-watch': 1 },
        flags: ['stable-recovered'],
      },
      failure: { local: { yard: -2 } },
    },
    expired: { local: { yard: -3, 'gate-watch': -1 } },
    outcomes: {
      success:
        'The mounts were found grazing two valleys over. The stable gate’s latch was filed through, carefully, by someone who knew the fortress.',
      partial: 'Most of the mounts came home. The latch is still a mystery.',
      failure: 'The trail went cold at the ford.',
      expired: 'The court rode nowhere for a week and the Yard noticed.',
    },
  },
  {
    id: 'q-d07-crow-favor',
    title: 'The Crows’ Errand',
    summary:
      'The Conclave’s price for its storm warning: carry a sealed parcel to the Mirefen and do not open it.',
    region: 'mirefen',
    faction: 'storm-crows',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    tags: ['weather'],
    rewards: {
      success: {
        affinity: { 'storm-crows': 15, 'mire-mothers': -5 },
        flags: ['crow-parcel-delivered'],
        recruitable: ['F006'],
      },
      failure: { affinity: { 'storm-crows': -10 } },
    },
    expired: { affinity: { 'storm-crows': -10 } },
    outcomes: {
      success:
        'The parcel was delivered to a witch who did not seem surprised. It ticked, faintly, the whole way. A Storm Crow who had followed the courier asks to see the emperor about what was inside.',
      partial:
        'The parcel arrived damp. The Crows are not pleased, or not saying.',
      failure:
        'The parcel was lost in the reeds. Something in the reeds kept it.',
      expired: 'The Crows took back their warning, word by word.',
    },
  },
  {
    id: 'q-d08-escort-to-bell',
    title: 'A Family of Five',
    summary:
      'Walk a Freehold family to Hollow Bell, past the raider scouts, and see them settled with someone who will not lose track of them.',
    region: 'hollow-bell',
    faction: 'freeholds',
    durationDays: 2,
    boardDays: 1,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'might', band: 'mid' },
      { stat: 'heart', band: 'low' },
    ],
    danger: 'mid',
    rewards: {
      success: {
        affinity: { freeholds: 10, 'hollow-bell': 5 },
        flags: ['family-of-five-safe'],
      },
      failure: {
        affinity: { freeholds: -5 },
        flags: ['family-of-five-scattered'],
      },
    },
    expired: { affinity: { freeholds: -10 } },
    outcomes: {
      success:
        'The family is lodged above the Hollow Bell bakery. The youngest gave the escort a drawing of a horse that is mostly legs.',
      partial: 'The family arrived, tired and frightened, missing their cart.',
      failure:
        'Raider scouts scattered the family on the road. Four were found by nightfall. Searchers are still looking for the fifth.',
      expired: 'Nobody came for them. The family went to the Abbey after all.',
    },
  },
  {
    id: 'q-d09-iron-convoy',
    title: 'Iron on the Road',
    summary:
      'A Saltroad convoy of salvaged iron must cross the rail canyon at night. Three bands want it. Whoever goes may not all come back.',
    region: 'saltroad',
    faction: 'saltroad',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'high',
    lethal: true,
    tags: ['defense'],
    rewards: {
      triumph: {
        brass: 60,
        affinity: { saltroad: 15 },
        local: { 'gate-watch': 3, ledger: 2 },
        items: ['old-road-crowbar'],
      },
      success: {
        brass: 40,
        affinity: { saltroad: 10 },
        local: { 'gate-watch': 2 },
      },
      partial: { brass: 15, affinity: { saltroad: 3 } },
      failure: {
        affinity: { saltroad: -10 },
        local: { 'gate-watch': -3 },
        strength: { saltroad: -1 },
      },
    },
    expired: { affinity: { saltroad: -10 }, strength: { saltroad: -1 } },
    outcomes: {
      triumph:
        'The convoy crossed at dawn with every wagon. The caravan master pressed a salvaged crowbar on the escort as a keepsake.',
      success: 'The iron reached the far side. The escort did not sleep.',
      partial: 'Two wagons in five made it across.',
      failure: 'The canyon took the convoy, and not only the iron.',
      expired: 'The convoy went without an escort. It did not arrive.',
    },
  },
  {
    id: 'q-d10-freehold-raid',
    title: 'Smoke Over Thistledown',
    summary:
      'The Jackalwire are raiding Thistledown, the largest Freehold village. Whatever happens there will be on the map tomorrow.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      triumph: {
        affinity: { freeholds: 20 },
        strength: { freeholds: 2, jackalwire: -2 },
        local: { 'gate-watch': 2 },
        flags: ['thistledown-held'],
        recruitable: ['F017'],
      },
      success: {
        affinity: { freeholds: 15 },
        strength: { freeholds: 1, jackalwire: -1 },
        flags: ['thistledown-held'],
        recruitable: ['F017'],
      },
      partial: {
        affinity: { freeholds: 5 },
        strength: { freeholds: -1 },
        recruitable: ['F017'],
      },
      failure: {
        affinity: { freeholds: -5 },
        strength: { freeholds: -2, jackalwire: 1 },
        flags: ['thistledown-burned'],
        recruitable: ['F017'],
      },
    },
    expired: {
      affinity: { freeholds: -15 },
      strength: { freeholds: -2, jackalwire: 1 },
      flags: ['thistledown-burned'],
      recruitable: ['F017'],
    },
    outcomes: {
      triumph:
        'Thistledown held, and the raiders were chased past the canyon mouth. The Freeholds will remember who came.',
      success: 'Thistledown held. Its granary did not.',
      partial: 'The raiders left with half the village’s stores.',
      failure:
        'Thistledown burned. Its people walked to the Eastern Ford with what they could carry.',
      expired:
        'No one went. Thistledown burned, and the Freeholds will remember that too.',
    },
  },
]

export const ACT_ONE_LATE_DAYS: readonly DayDef[] = [
  {
    day: 5,
    title: 'Raider’s Toll',
    briefings: [
      {
        id: 'vane-back',
        source: 'Saltroad cart-drivers',
        text: 'Gristle Vane’s painted wagons are back at the southern bridge, twice as many as before.',
        truth: true,
      },
      {
        id: 'yard-wages',
        source: 'The Yard’s foreman',
        text: 'The kitchens have three days of flour left at current wages.',
        truth: true,
      },
      {
        id: 'vane-retired',
        source: 'A Jackalwire deserter, for a fee',
        text: 'Gristle Vane has retired and the Pack is choosing a new captain by song.',
        truth: false,
      },
    ],
    komodo:
      'A deserter who sells news by the word has every reason to sell good news. Vane is back, Your Majesty, and Vane has never retired from anything.',
    quests: ['q-d05-flour-barrels'],
    audiences: [
      {
        id: 'd05-toll',
        title: 'The Toll Comes Due',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        requires: { notFlags: ['feast-armed'] },
        lines: [
          'Captain Gristle Vane does not walk up the carpet so much as arrive on it. His greatcoat is sewn from a hundred kinds of feather and a few things that are not feathers, his ear-chain jangles at every step, and the two raiders he leaves by the doors pick their teeth with the court’s good spoons.',
          'Your Majesty! One of my captains met you at the bridge. She says you have a soft face and a hard floor. I have come to see both.',
          'The toll is thirty brass a week now. Prices rise; ask anyone on the Saltroad. Or you could hire us to guard the carts we would otherwise be robbing, which is cheaper than it sounds and funnier than you think.',
          'Or you could try to hold the bridge. I would enjoy watching that. I would bring a chair.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Thirty brass is a week of the Yard’s bread, Your Majesty. He knows that. He has priced it to the slice.',
          },
        ],
        options: [
          {
            id: 'ask-price',
            label: 'Ask why the toll has doubled since the bridge.',
            effects: {},
            response:
              'Vane spreads his arms, and the feathers on his sleeves rustle like a crowd settling in. “Ah. A customer who reads the bill.”',
            next: 'prices',
          },
          {
            id: 'saffron',
            label: 'Let Saffron Kett answer him. She rode with the Pack once.',
            requires: { follower: 'F002' },
            effects: {},
            response:
              'Saffron steps out from beside the pillar before you have finished saying her name, which is not like her. Vane’s grin widens until it nearly meets his ear-chain.',
            next: 'saffron',
          },
          {
            id: 'pay',
            label: 'Pay the toll. Thirty brass, this week only.',
            requires: { cost: 30 },
            effects: {
              affinity: { jackalwire: 10, saltroad: 5 },
              local: { ledger: -2 },
              flags: ['paid-vane-twice'],
            },
            response:
              'Vane bows so low his feathers sweep the floor. “This week only. Of course.” In the gallery, the Ledger’s factor writes something down and underlines it twice.',
          },
          {
            id: 'hire',
            label: 'Hire the Pack to guard the Saltroad carts instead.',
            requires: { affinity: { jackalwire: 'wary' } },
            effects: {},
            response:
              'Vane looks, for a moment, honestly surprised. “Paid to do nothing to the carts. How restful.”',
            postsQuests: ['q-d05-saltroad-escort'],
          },
          {
            id: 'hold',
            label: 'Send a party to hold the bridge open.',
            effects: { local: { 'gate-watch': 1 } },
            response:
              'Vane grins with every tooth. “Bring snacks. It may take a while.”',
            postsQuests: ['q-d05-toll-standoff'],
          },
        ],
        beats: [
          {
            id: 'prices',
            lines: [
              '“Because the tincture doubled, Your Majesty. Dust lung. The pups cough, the Saltroad sells the cure, and the Saltroad has learned that hyenas pay whatever they are asked.”',
              '“So the carts pay me, and I pay the carts, and the brass goes round the bridge like water round a drain. Everyone gets a little wetter. Nobody gets a drink.”',
              '“You think I am a thief. I am. But I am the cheapest thief between here and the canyon, and the next one will not wear such a good coat.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Every word of that can be true, Your Majesty, and the bridge can still be his. Sympathy is not a toll exemption.',
              },
            ],
            options: [
              {
                id: 'remind',
                label:
                  'Remind him who bought the pups their tincture on the first day.',
                requires: { flags: ['pack-medicine'] },
                effects: {
                  affinity: { jackalwire: 5, saltroad: -5 },
                  local: { ledger: 1 },
                  flags: ['d05-toll-waived'],
                },
                response:
                  'Vane is quiet for a moment, which costs him visible effort. “The little ones stopped coughing black,” he says. “The crown’s own carts cross free this week. Only the crown’s. I am grateful, not stupid.” The Saltroad factor in the gallery hears every word of the private bargain, and leaves early.',
              },
              {
                id: 'threaten',
                label:
                  'Tell him the Gate Watch keeps a drawing of his camp above their fire.',
                requires: { flags: ['pack-camp-mapped'] },
                effects: {
                  affinity: { jackalwire: -10, saltroad: 5 },
                  local: { 'gate-watch': 2, ledger: 1 },
                  flags: ['d05-vane-threatened'],
                },
                response:
                  'Vane’s grin does not move, but the raiders by the door stop picking their teeth. “A drawing,” he says. “Who would draw a thing like that?” He leaves without naming a price, and the bridge is open by evening. Only later do you understand that he did not go home to move the camp. He went home to find the artist.',
              },
              {
                id: 'pay',
                label: 'Pay the thirty. This week only, and he knows it.',
                requires: { cost: 30 },
                effects: {
                  affinity: { jackalwire: 10, saltroad: 5 },
                  local: { ledger: -2 },
                  flags: ['paid-vane-twice'],
                },
                response:
                  '“This week only,” Vane agrees, counting it into his hat. “I will tell the pups who bought their cough syrup. They will not believe me.” The Ledger’s factor writes something down and underlines it twice.',
              },
              {
                id: 'hire',
                label: 'Then hire the cheapest thief to guard the carts.',
                requires: { affinity: { jackalwire: 'wary' } },
                effects: {},
                response:
                  '“Paid to do nothing to the carts,” Vane says, and tries the idea on like a new hat. “How restful. The pups will think I have gone respectable.”',
                postsQuests: ['q-d05-saltroad-escort'],
              },
              {
                id: 'hold',
                label:
                  'Hold the bridge. A thief with a good coat is still a thief.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  'Vane grins with every tooth. “Bring snacks. It may take a while.” He does not look sorry. He looks, if anything, relieved to be the villain again.',
                postsQuests: ['q-d05-toll-standoff'],
              },
            ],
          },
          {
            id: 'saffron',
            lines: [
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: '“Gristle. You put a toll on my bridge.” She says it fast, too fast, the way she talks when she is hiding the second half of a sentence.',
              },
              '“Kett! Still building things for people who will not pay for them?” Vane turns to you, delighted. “She built that bridge, Your Majesty. Did she tell you? Hung the cables herself, the summer before she decided she was too good for us.”',
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: '“There’s a ford below the bridge where the old rail pilings stand. Give me rope, timber and twenty-five brass, and I’ll hang a ferry there inside a week. The carts won’t need his bridge. They won’t need him.”',
              },
              '“And the pups,” says Vane softly, “will not need their tincture, I suppose.” He is still smiling. Saffron is not looking at him.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'It is an elegant answer, Your Majesty. It takes the Pack’s only lever away for good. Elegant answers are usually the ones somebody else pays for.',
              },
            ],
            options: [
              {
                id: 'ferry',
                label: 'Fund Saffron’s ferry below the bridge.',
                requires: { cost: 25 },
                effects: {
                  affinity: { saltroad: 10, jackalwire: -15 },
                  local: { yard: 1, ledger: 1 },
                  flags: ['d05-saffron-ferry'],
                },
                response:
                  'Saffron nods once and goes to find rope before anyone can thank her. Vane watches her leave. “She always did build the thing that put somebody out of work,” he says, and for the first time today he sounds his age.',
              },
              {
                id: 'hire',
                label:
                  'Hire the Pack to guard the carts. Saffron can keep her ferry plans.',
                requires: { affinity: { jackalwire: 'wary' } },
                effects: {},
                response:
                  'Saffron’s jaw works. “Sure,” she says. “Pay them to stand on my bridge.” Vane bows to her, extravagantly, and she does not bow back.',
                postsQuests: ['q-d05-saltroad-escort'],
              },
              {
                id: 'hold',
                label:
                  'Hold the bridge. Saffron built it; the crown can keep it open.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  '“Bring snacks,” says Vane, but he says it to Saffron. She is already listing, under her breath, every weak bolt on the bridge she built.',
                postsQuests: ['q-d05-toll-standoff'],
              },
            ],
          },
        ],
      },
      {
        id: 'd05-toll-grudge',
        title: 'The Toll Comes Due',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        requires: { flags: ['feast-armed'] },
        lines: [
          'Captain Gristle Vane comes alone this time, which is worse. His greatcoat is buttoned to the throat, and under one arm he carries a round loaf with a carving knife baked into the crust.',
          'You came to our feast with knives in the bread carts, Your Majesty. We noticed. My cook found this one with her teeth.',
          'He sets the loaf on the step of the dais, very gently, the way you would set down something that might wake.',
          'The toll is fifty brass now. That is the price of an insult. Pay it, or hold the bridge yourself.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'He came alone so that you would know he is not afraid, Your Majesty. Or so that you would think so.',
          },
        ],
        options: [
          {
            id: 'ask-feast',
            label:
              'Ask what the Pack would have done if the court had come unarmed.',
            effects: {},
            response: 'Vane laughs, but he looks at the loaf while he does it.',
            next: 'unarmed',
          },
          {
            id: 'pay',
            label: 'Pay fifty brass and call it settled.',
            requires: { cost: 50 },
            effects: {
              affinity: { jackalwire: 15 },
              local: { ledger: -3 },
              clearFlags: ['feast-armed'],
            },
            response: 'Vane counts it twice. “Settled. For now.”',
          },
          {
            id: 'hold',
            label: 'Send a party to hold the bridge open.',
            effects: { affinity: { jackalwire: -5 } },
            response: '“Good,” says Vane. “I was hoping you’d say that.”',
            postsQuests: ['q-d05-toll-standoff'],
          },
        ],
        beats: [
          {
            id: 'unarmed',
            lines: [
              '“Eaten. Sung. Lied to you about the toll over the second goat, and lowered it over the third.” He shrugs. “The feast was real, Your Majesty. The goat was real. The pups made you a crown out of fence wire. It was bad. They were proud of it.”',
              '“You do not owe me fifty brass. You owe me an apology. But an apology does not buy tincture, so I will take the brass.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Courts do not apologize to raiders, Your Majesty. The Old Houses are listening, and so is every captain in the canyon who would like a feast of their own.',
              },
            ],
            options: [
              {
                id: 'apologize',
                label: 'Apologize, here, in front of the whole court.',
                effects: {
                  affinity: { jackalwire: 10 },
                  local: { 'old-houses': -2, 'gate-watch': -1 },
                  clearFlags: ['feast-armed'],
                  flags: ['d05-apologized-to-vane'],
                },
                response:
                  'The hall goes so quiet you can hear the lamp oil. Vane listens with his head on one side. Then he breaks the loaf, hands you the half without the knife, and says the toll is forty. “An apology is worth ten,” he says. “I checked.” Along the gallery rail, an Old House fan snaps shut.',
              },
              {
                id: 'pay',
                label: 'Pay the fifty. Brass is cheaper than pride.',
                requires: { cost: 50 },
                effects: {
                  affinity: { jackalwire: 15 },
                  local: { ledger: -3 },
                  clearFlags: ['feast-armed'],
                },
                response:
                  'Vane counts it twice. “Settled. For now.” He leaves the loaf on the step, knife and all, and nobody at court wants to be the one who moves it.',
              },
              {
                id: 'hold',
                label: 'No apology and no brass. Hold the bridge.',
                effects: { affinity: { jackalwire: -5 } },
                response:
                  '“Good,” says Vane. “I was hoping you’d say that. I so rarely get to be the wronged party.”',
                postsQuests: ['q-d05-toll-standoff'],
              },
            ],
          },
        ],
      },
      {
        id: 'd05-flour',
        title: 'Three Days of Flour',
        speaker: 'Foreman Dunmore Ash of the Yard',
        npc: 'dunmore-ash',
        faction: 'yard',
        lines: [
          'Foreman Dunmore Ash comes up from the kitchens with flour on his apron and nothing in his hands, which in the Yard is a kind of speech. He does not bow. He lays an empty sack on the carpet, folded in four.',
          'Three days of flour, Majesty. After that the ovens go cold and the Yard goes hungry, and a hungry Yard is a loud Yard.',
          'I don’t want speeches. I want flour, or a reason I can carry back down the stairs.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The foreman has never asked the throne for anything twice, Your Majesty. I would not make him learn how.',
          },
        ],
        options: [
          {
            id: 'ask-short',
            label: 'Ask why the flour ran short so fast.',
            effects: {},
            response:
              'Ash unfolds the sack and turns it inside out. A little dust falls on the carpet. “That’s why,” he says. “But you asked, so.”',
            next: 'short',
          },
          {
            id: 'buy',
            label: 'Buy flour from the Saltroad at their price.',
            requires: { cost: 20 },
            effects: {
              local: { yard: 3 },
              affinity: { saltroad: 5 },
              recruitable: ['F008'],
            },
            response:
              'The foreman nods once. That is a lot, from him. The buffalo who drove the flour cart counts every sack twice, and asks whether the crown needs someone who can count.',
          },
          {
            id: 'ration',
            label: 'Ration the bread until the next caravan.',
            effects: { local: { yard: -3, 'old-houses': 1 } },
            response: 'The foreman says nothing at all, which is worse.',
          },
          {
            id: 'old-houses',
            label: 'Ask the Old Houses to open their private stores.',
            requires: { local: { 'old-houses': 8 } },
            effects: {
              local: { yard: 3, 'old-houses': -3 },
              recruitable: ['F008'],
            },
            response:
              'The Old Houses open their larders, very slowly, as if they are being robbed politely. Their quartermaster, a buffalo with a ration abacus, stays behind to ask about work.',
          },
        ],
        beats: [
          {
            id: 'short',
            lines: [
              '“The Saltroad doubled its price when the Pack doubled the toll. Somebody has to pay for that bridge, and it was always going to be the bread.”',
              '“And the Old Houses’ granary is full. I watched the carts go in at harvest, forty sacks to a cart. They are saving it for a bad winter, they say. It is a bad winter in my kitchens now.”',
              {
                who: 'A Gate Watch sergeant',
                text: 'If the crown wants that granary opened, Majesty, the Watch will open it. Just say whether we knock.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Open the Old Houses’ granary by force, Your Majesty, and you will have bread this week and enemies at every dinner for a year. They lent this throne its first brass. They have not forgotten it. Neither should you.',
              },
            ],
            options: [
              {
                id: 'seize',
                label:
                  'Order the Watch to take a tenth of the Old Houses’ granary for the ovens.',
                effects: {
                  local: { yard: 3, 'old-houses': -3, ledger: -1 },
                  flags: ['d05-granary-seized'],
                },
                response:
                  'The Watch knocks, because you told them to. The Old Houses stand beside their own granary doors in silence while every sack is counted out. By nightfall the ovens are hot, and three noble families have stopped saying your name at table.',
              },
              {
                id: 'millers',
                label:
                  'Hollow Bell’s mill families already owe the crown a levy. Take it in flour.',
                requires: { flags: ['mara-millers-levy'] },
                effects: {
                  local: { yard: 2, 'old-houses': -1 },
                  affinity: { 'hollow-bell': -5 },
                  flags: ['d05-millers-flour'],
                },
                response:
                  'The mill carts come up from Hollow Bell the next morning, and every sack is stencilled LEVIED in red, so that everyone who eats the bread will know whose order baked it. Mara sends no letter. The millers send one each.',
              },
              {
                id: 'buy',
                label:
                  'Buy at the Saltroad’s doubled price. The Yard eats first.',
                requires: { cost: 20 },
                effects: {
                  local: { yard: 3 },
                  affinity: { saltroad: 5 },
                  recruitable: ['F008'],
                },
                response:
                  'Ash nods once. That is a lot, from him. The buffalo who drove the flour cart counts every sack twice, glares at the price, and asks whether the crown needs someone who can count.',
              },
              {
                id: 'ration',
                label: 'Ration the bread, and leave the granary closed.',
                effects: { local: { yard: -3, 'old-houses': 1 } },
                response:
                  'Ash folds the sack back into four, puts it under his arm and goes down the stairs without a word. By supper the whole Yard knows exactly how many sacks are behind the Old Houses’ doors.',
              },
              {
                id: 'old-houses',
                label: 'Ask the Old Houses, politely, to open their stores.',
                requires: { local: { 'old-houses': 8 } },
                effects: {
                  local: { yard: 3, 'old-houses': -3 },
                  recruitable: ['F008'],
                },
                response:
                  'The Old Houses open their larders, very slowly, as if they are being robbed politely. Their quartermaster, a buffalo with a ration abacus, stays behind to ask about work.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 6,
    title: 'The Empty Stable',
    briefings: [
      {
        id: 'stable-empty',
        source: 'The stablemaster',
        text: 'Every mount in the fortress stable was gone at dawn.',
        truth: true,
      },
      {
        id: 'stable-latch',
        source: 'A Gate Watch sentry',
        text: 'The stable gate was opened from the inside.',
        truth: true,
      },
      {
        id: 'stable-ghost',
        source: 'The kitchen boys',
        text: 'The old emperor’s ghost rode them all out at midnight.',
        truth: false,
      },
    ],
    komodo:
      'There is no ghost, Your Majesty, there is a latch. Send someone who notices things, and watch closely what they notice. You learn a great deal about people on a day like this.',
    quests: ['q-d06-empty-stable'],
    audiences: [
      {
        id: 'd06-market-charter',
        title: 'A Charter for the Market',
        speaker: 'Factor Marisol Tallow of the Ledger',
        npc: 'marisol-tallow',
        faction: 'ledger',
        lines: [
          'Factor Marisol Tallow arrives with a pen behind one ear and a second pen behind the other, in case of emergencies. Under her arm is a scroll tied in Ledger green, and she does not untie it yet.',
          'The fortress market grew on its own, Majesty: three stalls became twelve. Twelve stalls need rules, or the strongest stall makes them.',
          'The Ledger would write those rules for you. Fees, weights, who stands where. For a small consideration, and a very small seal at the bottom.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'She has already written them, Your Majesty. The only question is whose name goes at the bottom, and what it costs to put it there.',
          },
        ],
        options: [
          {
            id: 'ask-stalls',
            label: 'Ask who keeps the twelve stalls now.',
            effects: {},
            response:
              'Tallow’s pen pauses over nothing. “Who keeps them,” she repeats, as if the question had been paid in a foreign coin.',
            next: 'stalls',
          },
          {
            id: 'charter',
            label: 'Grant the Ledger a market charter.',
            effects: {
              brass: 10,
              local: { ledger: 4, yard: -1 },
              flags: ['market-charter'],
            },
            response:
              'The factor produces a charter she had, by remarkable luck, already drafted.',
          },
          {
            id: 'yard-first',
            label: 'Give the Yard first pick of every stall.',
            effects: { local: { yard: 3, ledger: -2 } },
            response: 'The factor writes that down too, in a different ink.',
          },
          {
            id: 'archive-rules',
            label:
              'Have the Lamplight Archive write fair rules, posted on the gate.',
            requires: { local: { lamplight: 9 } },
            effects: { local: { lamplight: 2, ledger: 1, yard: 1 } },
            response:
              'Nobody gets everything. The rules are very long and very fair.',
          },
        ],
        beats: [
          {
            id: 'stalls',
            lines: [
              '“Four belong to Ledger houses. Three to the Yard’s cousins. One sells Saltroad flour at a price I will not repeat in front of the foreman.”',
              '“And four are Freehold women on blankets, selling eggs and thread, who came in with the refugees and never left. They pay nothing. Under my charter they would pay what everyone pays, and most of them would go.”',
              '“I am not cruel, Majesty. I am consistent. A market only works if the rules are the same for everyone, including the people they hurt.”',
              {
                who: 'An egg-seller from the Freeholds',
                text: 'We’d pay, Majesty, if we had it. We’d pay in eggs, gladly. Nobody ever asks us.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Exemptions breed, Your Majesty. Exempt four blankets today and there will be forty by spring, all of them very sad and none of them paying.',
              },
            ],
            options: [
              {
                id: 'blankets',
                label:
                  'Grant the charter, but the blanket stalls pay in kind, or not at all.',
                effects: {
                  brass: 5,
                  local: { ledger: 2, yard: 1 },
                  affinity: { freeholds: 5 },
                  flags: ['market-charter', 'd06-blanket-stalls'],
                },
                response:
                  'Tallow writes the exception in the margin, in a smaller hand than the rest, the way a merchant writes a debt she expects to collect later. The egg-seller leaves a basket on the step of the dais. Two of the eggs are still warm.',
              },
              {
                id: 'charter',
                label:
                  'Grant the Ledger its charter as written. The same rules for everyone.',
                effects: {
                  brass: 10,
                  local: { ledger: 4, yard: -1 },
                  flags: ['market-charter'],
                },
                response:
                  'Tallow produces the seal, which she had, by remarkable luck, already inked. By the end of the week three of the blankets are gone from the market, and nobody at court can say where they went.',
              },
              {
                id: 'yard-first',
                label:
                  'Give the Yard first pick of every stall, blankets and all.',
                effects: { local: { yard: 3, ledger: -2 } },
                response:
                  'The factor writes that down too, in a different ink. The Yard’s cousins take the best pitches by noon, and the egg-sellers move their blankets a little closer to the midden.',
              },
              {
                id: 'archive-rules',
                label:
                  'Have the Lamplight Archive write fair rules, posted on the gate.',
                requires: { local: { lamplight: 9 } },
                effects: { local: { lamplight: 2, ledger: 1, yard: 1 } },
                response:
                  'Nobody gets everything. The rules are very long and very fair, and the Archive’s clerk reads every one of them aloud to the egg-sellers, twice.',
              },
            ],
          },
        ],
      },
      {
        id: 'd06-stablehand',
        title: 'The Night Stablehand',
        speaker: 'A Gate Watch sergeant',
        faction: 'gate-watch',
        lines: [
          'A Gate Watch sergeant marches a boy up the carpet by the collar. The boy is a young weasel in a stablehand’s apron with straw still caught in his fur, and he is trying very hard not to cry in front of the throne.',
          '“Night stablehand, Majesty. Every mount gone, and him asleep in the hayloft, or so he says. The Watch wants him in the stocks by noon. A gate opened from the inside is a Watch matter.”',
          '“I didn’t open it,” the boy says. “I didn’t. I wasn’t even...” He stops, and looks at the floor.',
          '“Wasn’t even where?” says the sergeant. “Go on. Tell the emperor where.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Someone filed that latch, Your Majesty, and stableboys do not own files. But the Watch needs to see a crown that answers a broken gate. Sometimes that is the same thing as justice. Usually it is not.',
          },
        ],
        options: [
          {
            id: 'ask-where',
            label: 'Ask the boy, gently, where he was at midnight.',
            effects: {},
            response:
              'The sergeant lets go of the collar. The boy does not seem to know what to do with his hands.',
            next: 'postern',
          },
          {
            id: 'stocks',
            label: 'A gate was left open on his watch. A day in the stocks.',
            effects: {
              local: { 'gate-watch': 2, yard: -2 },
              flags: ['d06-stablehand-stocks'],
            },
            response:
              'The boy goes to the stocks at noon. The Yard brings him water all afternoon, in full view of the Watch, and nobody stops them. The latch stays filed, and whoever filed it sleeps well.',
          },
          {
            id: 'pardon',
            label: 'Release him. The Watch can find the file, not a scapegoat.',
            effects: {
              local: { yard: 2, 'gate-watch': -2 },
              flags: ['d06-stablehand-pardoned'],
            },
            response:
              'The sergeant salutes very precisely, which in the Watch is how you say something rude to an emperor. The boy runs. The stables are cleaner tomorrow than they have been in a year.',
          },
        ],
        beats: [
          {
            id: 'postern',
            lines: [
              '“At the postern, Majesty. The little gate by the midden. My sister’s in the camp outside the walls, with the Freehold people. I take her the heel of the loaf when the kitchen’s done.”',
              '“I wasn’t at the stable gate. I swear on the bell. But I left the postern on the latch for an hour, every night this month, and anybody could have come in through it. Anybody.”',
              '“Every night this month,” the sergeant says. “Through a Watch gate. With bread out of a kitchen that has three days of flour.” He does not say it cruelly. That is somehow worse.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'There is a use for a boy who knows every gate the Watch forgot, Your Majesty. Better he tell the throne who comes and goes than tell no one.',
              },
            ],
            options: [
              {
                id: 'informant',
                label:
                  'Pardon him, if he reports everyone he sees at the postern to the Watch.',
                effects: {
                  local: { 'gate-watch': 2, yard: -1 },
                  flags: ['d06-postern-informant'],
                },
                response:
                  'The boy agrees before you have finished, because he would have agreed to anything. The sergeant claps him on the shoulder. Within a week the Yard has learned to stop talking when the stablehand comes into the kitchen.',
              },
              {
                id: 'sister',
                label:
                  'Pardon him, and put his sister on the Yard’s ration roll, inside the walls.',
                requires: { cost: 10 },
                effects: {
                  local: { yard: 3, 'gate-watch': -1 },
                  affinity: { freeholds: 3 },
                  flags: ['d06-stablehand-sister'],
                },
                response:
                  'The sister comes in through the main gate that evening, in daylight, with the Watch holding it open for her. She is younger than the boy. She has brought back the heel of yesterday’s loaf, because she had been saving it for him.',
              },
              {
                id: 'stocks',
                label: 'He left a Watch gate open for a month. The stocks.',
                effects: {
                  local: { 'gate-watch': 2, yard: -2 },
                  flags: ['d06-stablehand-stocks'],
                },
                response:
                  'He goes without arguing. That night, for the first time in a month, nobody goes out through the postern, and somebody in the camp outside the walls goes to sleep without bread.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 7,
    title: 'A Crow’s Warning',
    whisper: {
      source: 'A Freehold reeve, waiting in the gatehouse',
      text: 'My gran sat out every dust storm in the old Mole galleries under the Ford. Nobody’s been down there in years, they tell me. Funny how the path to the old door is still worn smooth.',
    },
    briefings: [
      {
        id: 'crow-storm',
        source: 'A Storm Crow envoy',
        text: 'A dust storm will cross the Eastern Ford in three days.',
        truth: true,
      },
      {
        id: 'mole-tunnels-empty',
        source: 'Young Komodo’s own runner',
        text: 'The old Mole tunnels under the Eastern Ford collapsed years ago and are empty.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'freehold-harvest',
        source: 'Freehold reeves',
        text: 'The Freehold harvest is in the fields and will not be in for a week.',
        truth: true,
      },
    ],
    komodo:
      'My own runner checked the Ford tunnels himself, Your Majesty; I would not waste a party there. The Crow’s storm is a different matter. The Conclave never warns anyone for free.',
    quests: [],
    audiences: [
      {
        id: 'd07-crow-warning',
        title: 'A Crow’s Warning',
        speaker: 'A Storm Crow envoy',
        faction: 'storm-crows',
        lines: [
          'The Storm Crow envoy lands on the high windowsill rather than use the doors, and steps down into the hall as if the floor were a slightly disappointing branch. Rain beads on his feathers. It has not rained at the fortress in forty days.',
          'A storm is coming to the Eastern Ford, Your Majesty. A dust storm, three days out. The Freeholds’ harvest is still standing in the fields.',
          'The Conclave tells you this as a courtesy. The rest of the forecast, the hour and the path, costs a small errand: a parcel, carried to the Mirefen, by hands that are not ours.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Conclave never gives anything away, Your Majesty, so the courtesy is the bait. The question is what the hook is tied to.',
          },
        ],
        options: [
          {
            id: 'ask-hands',
            label:
              'Ask why the parcel must travel in the crown’s hands and not a crow’s.',
            effects: {},
            response:
              'The envoy blinks, one eye and then the other. “An excellent question,” he says, “to which the answer is also a parcel.”',
            next: 'hands',
          },
          {
            id: 'ask-shelter',
            label:
              'Ask where the Freeholders could shelter if the storm beats the harvest.',
            effects: {},
            response:
              'The envoy turns his head toward the east windows, where the Ford is a brown thread on the horizon. “Ah,” he says. “Under it, traditionally.”',
            next: 'shelter',
          },
          {
            id: 'errand',
            label: 'Accept the errand. Carry the Conclave’s parcel.',
            effects: {
              affinity: { freeholds: 5 },
              flags: ['crow-forecast-day10'],
              recruitable: ['F011'],
            },
            response:
              'The envoy hands over a sealed parcel wrapped in oilcloth. It is heavier than it looks. The gecko runner who carried it up the mountain does not leave with him.',
            postsQuests: ['q-d07-crow-favor'],
          },
          {
            id: 'pay',
            label: 'Pay for the forecast in brass instead.',
            requires: { cost: 25 },
            effects: {
              affinity: { freeholds: 5, 'storm-crows': -3 },
              flags: ['crow-forecast-day10'],
            },
            response:
              'The envoy takes the brass with visible distaste. Brass, his look says, is for people without imagination.',
          },
          {
            id: 'warn-freeholds',
            label:
              'Warn the Freeholds with what we already know, and owe nothing.',
            effects: { affinity: { freeholds: 3, 'storm-crows': -5 } },
            response:
              '“A third of a forecast,” says the envoy, “is worse than none.” He may be right.',
          },
        ],
        beats: [
          {
            id: 'hands',
            lines: [
              '“The Mire Mothers will take nothing from a crow’s claw. It is an old quarrel, older than your tower. They will take it from yours, because your tower has not yet given them a reason to refuse.”',
              '“What is inside is between the Conclave and the coven. It is not a weapon. It is not a gift. Think of it as a sentence that has waited a long time for its full stop.”',
              '“Whoever carries it will be remembered by both of us. That is the real price, Your Majesty. The brass is for those who would prefer to be forgotten.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Carry it, Your Majesty. Whatever is in it was going to the fen anyway. Better that we know which road it took.',
              },
            ],
            options: [
              {
                id: 'ask-count',
                label:
                  'Ask whether the parcel has anything to do with the lanterns your escort counted on the first night.',
                requires: { flags: ['mire-quiet-count'] },
                effects: {},
                response:
                  'For the first time, the envoy looks at you as if you might be worth a forecast of your own.',
                next: 'count',
              },
              {
                id: 'errand',
                label: 'Carry it. Let both of them remember the crown.',
                effects: {
                  affinity: { freeholds: 5 },
                  flags: ['crow-forecast-day10'],
                  recruitable: ['F011'],
                },
                response:
                  'The envoy hands over the parcel in its oilcloth. It is heavier than it looks, and once, when the hall is quiet, you are almost sure it ticks. The gecko runner who carried it up the mountain watches it pass from your hands to your steward’s, and does not leave with the envoy.',
                postsQuests: ['q-d07-crow-favor'],
              },
              {
                id: 'closed-road',
                label:
                  'Tell him the crown closed the Mirefen road once, and will not open it for a crow.',
                requires: { flags: ['mire-road-closed'] },
                effects: {
                  affinity: { 'storm-crows': -5 },
                  local: { 'gate-watch': 1 },
                  flags: ['d07-fen-road-stays-closed'],
                },
                response:
                  'The envoy regards you with something close to respect and something closer to pity. “The Mothers watched forty-one lights go out on that road,” he says. “So did the Conclave. We wondered which of you would mention it first.” He takes his parcel back to the windowsill, and the forecast with it.',
              },
              {
                id: 'pay',
                label: 'Pay for the forecast in brass, and carry nothing.',
                requires: { cost: 25 },
                effects: {
                  affinity: { freeholds: 5, 'storm-crows': -3 },
                  flags: ['crow-forecast-day10'],
                },
                response:
                  'The envoy takes the brass as if it were slightly damp. “Forgotten, then,” he says. “As you prefer.”',
              },
            ],
          },
          {
            id: 'count',
            lines: [
              '“Forty-one lanterns on the Mirefen road that night, Your Majesty. Thirty-eight walkers. Your escort counted well. The Conclave counted too, from higher up.”',
              '“Three lanterns walked with no one under them. The parcel is for the three. That is all I am permitted to say, and a little more than I should.”',
              '“The Mothers know your escort counted. They have not decided yet what kind of crown counts its guests.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A count is only a list, Your Majesty. Keep it. Lists have a way of becoming useful at the end of things.',
              },
            ],
            options: [
              {
                id: 'return-count',
                label:
                  'Send the escort’s count to the Mothers instead, sealed, with the crown’s apology for taking it.',
                effects: {
                  affinity: { 'mire-mothers': 10, 'storm-crows': -5 },
                  local: { lamplight: -2 },
                  flags: ['d07-count-returned'],
                },
                response:
                  'The Archive surrenders its only copy with a face like a funeral. Three days later a sprig of bog myrtle is found tied to the fortress gate, and the envoy, who has not been paid in errands, takes the rest of his forecast home.',
              },
              {
                id: 'errand',
                label: 'Carry the parcel to the three. Keep the count.',
                effects: {
                  affinity: { freeholds: 5 },
                  flags: ['crow-forecast-day10'],
                  recruitable: ['F011'],
                },
                response:
                  'The parcel goes north in oilcloth, the count stays in the Archive under lock, and the gecko runner who carried it up the mountain stays behind, watching the road the courier took.',
                postsQuests: ['q-d07-crow-favor'],
              },
              {
                id: 'warn-freeholds',
                label:
                  'Neither parcel nor count. Warn the Freeholds and owe nothing.',
                effects: { affinity: { freeholds: 3, 'storm-crows': -5 } },
                response:
                  '“A third of a forecast,” says the envoy, “and none of the answers. You are going to be a very careful emperor.” He does not mean it kindly.',
              },
            ],
          },
          {
            id: 'shelter',
            lines: [
              '“The Freeholders’ grandparents rode out dust storms in the old Mole galleries under the Ford,” says the envoy. “Dry, deep, and big enough for a village and its goats. The storm’s path runs straight over them. Whatever is down there now will have company.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Collapsed, Your Majesty. Years ago.',
              },
              'The envoy had not quite finished. He turns his head toward Young Komodo, who is looking down at his ledger and tapping one claw on the page, twice, as if a sum has come out wrong.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'My runner went down himself. Rubble and rats. I would not send a family into that, let alone a village.',
              },
              '“How thorough of him,” says the envoy, and says nothing else about it.',
            ],
            options: [
              {
                id: 'shelter-fortress',
                label:
                  'Open the fortress to the Freeholders until the storm has passed.',
                requires: { cost: 20 },
                effects: {
                  affinity: { freeholds: 10 },
                  local: { yard: -2, 'gate-watch': -1, 'old-houses': -1 },
                  flags: ['d07-freeholds-sheltered'],
                },
                response:
                  'The Freeholders come up the road in a long line with their goats and their grandparents, and the Yard makes room it does not have. Young Komodo, who argues the price of everything, does not argue the price of this. The envoy, leaving, remarks to no one that walls are a very expensive kind of tunnel.',
              },
              {
                id: 'errand',
                label:
                  'Carry the parcel for the full forecast. The harvest needs the hour, not a cellar.',
                effects: {
                  affinity: { freeholds: 5 },
                  flags: ['crow-forecast-day10'],
                  recruitable: ['F011'],
                },
                response:
                  'The envoy hands over the parcel in its oilcloth and the hour of the storm in a whisper. The gecko runner who carried the parcel up the mountain does not leave with him.',
                postsQuests: ['q-d07-crow-favor'],
              },
              {
                id: 'pay',
                label: 'Pay for the forecast in brass instead.',
                requires: { cost: 25 },
                effects: {
                  affinity: { freeholds: 5, 'storm-crows': -3 },
                  flags: ['crow-forecast-day10'],
                },
                response:
                  'The envoy takes the brass with visible distaste, and the hour of the storm with it, written on a feather.',
              },
              {
                id: 'warn-freeholds',
                label:
                  'Tell the Freeholds what we know, and let them find their own cellars.',
                effects: { affinity: { freeholds: 3, 'storm-crows': -5 } },
                response:
                  '“A third of a forecast,” says the envoy, “is worse than none.” Young Komodo has already turned the page.',
              },
            ],
          },
        ],
      },
      {
        id: 'd07-old-houses',
        title: 'A Seat at Court',
        speaker: 'Lady Ottoline Vask of the Old Houses',
        npc: 'ottoline-vask',
        faction: 'old-houses',
        lines: [
          'Lady Ottoline Vask glides up the carpet in a high-collared house coat the color of wet ink, heirloom rings clicking on her wingtips. Six members of the Old Houses follow at a precise distance and arrange themselves along the gallery rail like a jury.',
          'The Old Houses backed this throne when it was a heap of salvage, Majesty. Our brass bought your first walls. Our sons stand in your Watch.',
          'We would like a seat on the court’s council to show for it. One chair. We have brought our own cushion.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: '“Lady Vask,” Komodo says warmly, before the herald can. Then, to you: “One chair costs nothing today, Your Majesty. It is the meetings that cost.”',
          },
          '“Young Komodo,” says Lady Vask. “How kind of you to remember me.” She does not say from where.',
        ],
        options: [
          {
            id: 'ask-chair',
            label: 'Ask what the Old Houses would do with their chair.',
            effects: {},
            response:
              'Lady Vask taps one ring against another, once. “Sit in it,” she says. “Initially.”',
            next: 'chair',
          },
          {
            id: 'seat',
            label: 'Give the Old Houses a council seat.',
            effects: {
              local: { 'old-houses': 4, yard: -2 },
              flags: ['old-houses-council-seat'],
            },
            response:
              'Lady Vask inclines her head exactly as far as gratitude requires.',
          },
          {
            id: 'seat-for-all',
            label: 'A seat, yes, and one for the Yard as well.',
            effects: {
              local: { 'old-houses': 1, yard: 3 },
              flags: ['open-council'],
            },
            response:
              'Lady Vask’s smile is very thin. “How democratic,” she says, as if it were a disease.',
          },
          {
            id: 'refuse',
            label: 'The council stays as it is.',
            effects: { local: { 'old-houses': -3 } },
            response: 'Lady Vask leaves without looking back. People notice.',
          },
        ],
        beats: [
          {
            id: 'chair',
            lines: [
              '“The Gate Watch swears its oath in three days. The Old Houses would like that oath to mention the Old Houses. Our sons swear it, after all. It seems only fair they swear it to someone who will remember their names.”',
              '“The Yard eats from our granaries, the Ledger lends against our land, the Archive copies our deeds. We are not asking for power, Majesty. We are asking to be in the room where it is spent.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'The Yard eats from their granaries at their price. If they get a chair, I want to know whose bread it is made of.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'They will be in that room whether you seat them or not, Your Majesty. Better that you can see which chair they are in.',
              },
            ],
            options: [
              {
                id: 'seat-no-oath',
                label: 'A chair, but the Watch swears to the crown alone.',
                effects: {
                  local: { 'old-houses': 2, 'gate-watch': 1, yard: -1 },
                  flags: ['old-houses-council-seat', 'd07-oath-kept-clean'],
                },
                response:
                  'Lady Vask considers this the way she might consider a cake with one slice already gone. “A chair, then,” she says. “Chairs are patient.” Young Komodo writes out the decree, and spells her name right the first time.',
              },
              {
                id: 'repay-granary',
                label:
                  'Offer to repay the sacks the Watch took from their granary, in place of a chair.',
                requires: { cost: 20, flags: ['d05-granary-seized'] },
                effects: {
                  local: { 'old-houses': 3, yard: -1 },
                  flags: ['d07-granary-repaid'],
                },
                response:
                  'Lady Vask accepts the brass with the air of someone being handed back her own glove. “Restitution,” she says. “How old-fashioned. We will still want the chair, Majesty. But we will ask more nicely next time.” In the Yard, the bread tastes no different, and everyone agrees it tastes worse.',
              },
              {
                id: 'seat',
                label: 'Give them the chair, and let the oath name them.',
                effects: {
                  local: { 'old-houses': 4, yard: -2 },
                  flags: ['old-houses-council-seat'],
                },
                response:
                  'Lady Vask inclines her head exactly as far as gratitude requires. Along the gallery rail six fans open at once. Foreman Ash goes down the stairs before anyone can see his face.',
              },
              {
                id: 'seat-for-all',
                label:
                  'A chair for the Old Houses, and one for the Yard beside it.',
                effects: {
                  local: { 'old-houses': 1, yard: 3 },
                  flags: ['open-council'],
                },
                response:
                  '“How democratic,” Lady Vask says, as if it were a disease. Foreman Ash looks at the second chair for a long time before he sits in it, as if checking it for nails.',
              },
              {
                id: 'refuse',
                label:
                  'The council stays as it is. The oath names the crown, not the cushions.',
                effects: { local: { 'old-houses': -3 } },
                response:
                  'Lady Vask leaves without looking back, and takes her cushion. People notice. Young Komodo watches her go for slightly longer than anyone else does.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 8,
    title: 'A Family of Five',
    briefings: [
      {
        id: 'freehold-refugees',
        source: 'The Gate Watch',
        text: 'A Freehold family of five is sleeping in the fortress gatehouse.',
        truth: true,
      },
      {
        id: 'abbey-beds',
        source: 'A sister of the Abbey',
        text: 'The Abbey has forty empty beds and warm meals for any child who needs one.',
        truth: true,
      },
      {
        id: 'raiders-gone',
        source: 'A tired Freehold reeve',
        text: 'The raider scouts have left the Freehold roads for the season.',
        truth: false,
      },
    ],
    komodo:
      'Forty empty beds is a great many for an orphanage that takes in every child it finds, Your Majesty. I would ask where the children go. Not today, perhaps. But I would ask.',
    quests: [],
    audiences: [
      {
        id: 'd08-family',
        title: 'A Family of Five',
        speaker: 'Wenna Coldbrook and Sister Marrow',
        npc: 'sister-marrow',
        faction: 'abbey',
        lines: [
          'Wenna Coldbrook stands at the foot of the dais with three children behind her and a baby on her hip. Their farm is ash. She smells of it still, and so do the children, and the smallest keeps one hand knotted in the back of her mother’s skirt as if the floor might move.',
          'Beside them, a white goat in grey Abbey robes smiles with great patience. A counting cord hangs from her belt, knotted at even intervals, and her fingers rest on it the way other people rest a hand on a sleeping dog.',
          '“The Abbey would gladly take the little ones,” says Sister Marrow. “Warm beds. Lessons. Three meals, and soup on feast days. Their mother may visit, of course, once they are settled.”',
          '“Once they are settled,” Wenna repeats. She is not asking anything. She only wants to hear what it sounds like out loud.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Abbey feeds half the mission road, Your Majesty. Whatever else is true, the soup is real.',
          },
        ],
        options: [
          {
            id: 'ask-wenna',
            label: 'Ask Wenna what she wants, not what she can afford.',
            effects: {},
            response:
              'Sister Marrow’s fingers stop on the cord. Wenna looks up at you as if nobody has asked her a question in a week.',
            next: 'wenna',
          },
          {
            id: 'ask-beds',
            label:
              'Ask Sister Marrow how many children the Abbey keeps, and how many beds.',
            effects: {},
            response:
              'Sister Marrow smiles a little wider. It is a very good smile. It has been practiced on harder rooms than this one.',
            next: 'beds',
          },
          {
            id: 'flint',
            label: 'Let Duchess Flint put a question to the Sister.',
            requires: { follower: 'F004' },
            effects: {},
            response:
              'Flint comes forward at her own pace, which is slow, and the whole hall waits for her, which is the point.',
            next: 'flint',
          },
          {
            id: 'abbey',
            label: 'Let the Abbey take the children in.',
            effects: {
              affinity: { abbey: 10, freeholds: 3 },
              flags: ['abbey-took-coldbrook-children'],
            },
            response:
              'Sister Marrow gathers the children with practiced hands. Wenna watches them go and does not cry until the gate closes.',
          },
          {
            id: 'yard',
            label: 'House the whole family in the fortress Yard.',
            requires: { cost: 15 },
            effects: {
              local: { yard: 2 },
              affinity: { freeholds: 8, abbey: -3 },
              flags: ['coldbrooks-in-yard'],
              recruitable: ['F012'],
            },
            response:
              'Wenna holds the baby very tight. Sister Marrow’s smile does not move, and then she is gone. A young capybara in a novice’s robe stays behind, and asks whether the Yard needs a cook.',
          },
          {
            id: 'escort',
            label: 'Send an escort to see them settled in Hollow Bell.',
            effects: { affinity: { abbey: -3 }, recruitable: ['F012'] },
            response:
              '“Of course,” says Sister Marrow. “The road is so dangerous for little ones.” Her novice, Brother Teodor, does not follow her out.',
            postsQuests: ['q-d08-escort-to-bell'],
          },
        ],
        beats: [
          {
            id: 'wenna',
            lines: [
              '“I want my farm back, and my husband’s hands, and the barn the way it was. I know. I know.”',
              '“I want them where I can see them. That’s all. Not warm, not taught. Where I can see them. But I can’t feed four, Majesty. I can feed one, if I don’t eat.”',
              '“The Sisters came to the gatehouse before the Watch was awake. They knew our names. I never told anybody our names.”',
              {
                who: 'Sister Marrow',
                npc: 'sister-marrow',
                text: '“The Freehold reeves send us word of every burned farm, child. It is how we find the ones who need us.” She says it kindly. Her fingers move one knot along the cord.',
              },
            ],
            options: [
              {
                id: 'yard',
                label:
                  'Then keep them where she can see them. House the whole family in the Yard.',
                requires: { cost: 15 },
                effects: {
                  local: { yard: 2 },
                  affinity: { freeholds: 8, abbey: -3 },
                  flags: ['coldbrooks-in-yard'],
                  recruitable: ['F012'],
                },
                response:
                  'Wenna holds the baby so tight it squeaks. Sister Marrow’s smile does not move, and then she is gone. A young capybara in a novice’s robe stays behind with a soup ladle in his belt, and asks whether the Yard needs a cook.',
              },
              {
                id: 'seed',
                label:
                  'Give Wenna seed, a cart and a season’s brass, and let her take them home.',
                requires: { cost: 20 },
                effects: {
                  affinity: { freeholds: 8, abbey: -5 },
                  flags: ['d08-coldbrooks-home'],
                },
                response:
                  'Wenna goes east at dawn with the seed and the cart and all four children, back toward the ash. The reeve swore the raider scouts have left the Freehold roads for the season. You will learn soon enough whether the reeve was right.',
              },
              {
                id: 'abbey',
                label: 'The Abbey can feed them and she cannot. Let them go.',
                effects: {
                  affinity: { abbey: 10, freeholds: 3 },
                  flags: ['abbey-took-coldbrook-children'],
                },
                response:
                  'Sister Marrow gathers the children with practiced hands, one, two, three, and a knot moves along the cord for each. Wenna keeps the baby. She does not cry until the gate closes.',
              },
            ],
          },
          {
            id: 'beds',
            lines: [
              '“Forty beds empty tonight, Majesty, and forty more full. Children come to us and children go on: to our sister houses in the south, to apprenticeships, to families who have asked for them. The Abbey is a door, not a room.”',
              '“Their mother may visit, of course. Once they are settled. Settling takes time. Some children cry for a month. It is kinder not to reopen it.”',
              {
                who: 'Wenna Coldbrook',
                text: '“Which sister houses?” Wenna says. Nobody answers her.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'You have a court to run and a family standing in front of you, Your Majesty. The beds will still be there to ask about next season.',
              },
            ],
            options: [
              {
                id: 'visits',
                label:
                  'Let the Abbey take them, on condition the crown may visit those beds at any hour.',
                effects: {
                  affinity: { abbey: 5, freeholds: 3 },
                  flags: [
                    'abbey-took-coldbrook-children',
                    'd08-visits-promised',
                  ],
                },
                response:
                  '“Of course,” says Sister Marrow. “At any hour.” She means it, and somehow that is the worst part. Wenna kisses each child once and lets go of the smallest hand last.',
              },
              {
                id: 'escort',
                label:
                  'Neither the Abbey nor the Yard. Walk them to Hollow Bell, where someone keeps count.',
                effects: { affinity: { abbey: -3 }, recruitable: ['F012'] },
                response:
                  '“Of course,” says Sister Marrow. “The road is so dangerous for little ones.” Her novice, Brother Teodor, stays where she left him, looking at the door she went through as if working a sum that will not come out.',
                postsQuests: ['q-d08-escort-to-bell'],
              },
              {
                id: 'yard',
                label: 'House the whole family in the fortress Yard.',
                requires: { cost: 15 },
                effects: {
                  local: { yard: 2 },
                  affinity: { freeholds: 8, abbey: -3 },
                  flags: ['coldbrooks-in-yard'],
                  recruitable: ['F012'],
                },
                response:
                  'Wenna holds the baby very tight. Sister Marrow’s smile does not move, and then she is gone. A young capybara in a novice’s robe stays behind, and asks whether the Yard needs a cook.',
              },
              {
                id: 'abbey',
                label: 'Let the Abbey take the children in.',
                effects: {
                  affinity: { abbey: 10, freeholds: 3 },
                  flags: ['abbey-took-coldbrook-children'],
                },
                response:
                  'Sister Marrow gathers the children with practiced hands. Wenna watches them go and does not cry until the gate closes. Nobody ever tells her which sister house.',
              },
            ],
          },
          {
            id: 'flint',
            lines: [
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: '“Sister. How many children did the Abbey take in last winter?”',
              },
              '“Every one who needed us, Duchess.”',
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: '“That is not a number. How many are in the Abbey this morning?”',
              },
              '“All of them are where they should be.” Sister Marrow’s smile does not change. Her fingers have stopped on the cord, and they stay stopped.',
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: '“Neither is that.” Flint turns her head, very slowly, toward the throne. “I have nothing against warm beds, Majesty. I have something against answers that are the shape of a number and are not one.”',
              },
            ],
            options: [
              {
                id: 'recorded',
                label:
                  'Let the Abbey take them, but Flint writes each child’s name, age and every mark in the court’s book first.',
                effects: {
                  affinity: { abbey: 3, freeholds: 3 },
                  local: { lamplight: 2 },
                  flags: [
                    'abbey-took-coldbrook-children',
                    'd08-coldbrooks-recorded',
                  ],
                },
                response:
                  'Flint writes slowly: three names, three ages, a burn scar on a wrist, a missing tooth, a habit of humming. Sister Marrow waits with perfect patience and watches the pen the whole time.',
              },
              {
                id: 'yard',
                label:
                  'Keep the family together in the Yard. Flint’s question can wait for its number.',
                requires: { cost: 15 },
                effects: {
                  local: { yard: 2 },
                  affinity: { freeholds: 8, abbey: -3 },
                  flags: ['coldbrooks-in-yard'],
                  recruitable: ['F012'],
                },
                response:
                  'Sister Marrow bows to Flint, exactly as deeply as to you, and leaves. Her novice, a young capybara, stays behind and quietly asks Flint whether she would like to know the number. Flint says yes. He says he will have to count.',
              },
              {
                id: 'escort',
                label: 'Send an escort to see them settled in Hollow Bell.',
                effects: { affinity: { abbey: -3 }, recruitable: ['F012'] },
                response:
                  '“Of course,” says Sister Marrow. “The road is so dangerous for little ones.” Her novice, Brother Teodor, does not follow her out.',
                postsQuests: ['q-d08-escort-to-bell'],
              },
            ],
          },
        ],
      },
      {
        id: 'd08-ledger-loan',
        title: 'An Offer of Credit',
        speaker: 'Factor Marisol Tallow of the Ledger',
        npc: 'marisol-tallow',
        faction: 'ledger',
        lines: [
          'Factor Tallow returns with a smaller book than last time. It is bound in green leather and has a lock, and she sets it on the arm of the throne as if it already lives there.',
          'The Ledger would extend the crown a line of credit, Majesty. Forty brass now, a little more later. Every throne needs a friend at the counting table.',
          'Lending is a kindness. Repayment is a habit. The Ledger simply hopes to help the crown form good habits.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: '“A little more later” is the most expensive phrase in the wasteland, Your Majesty. I would ask how little, and how much later.',
          },
        ],
        options: [
          {
            id: 'ask-terms',
            label: 'Ask what “a little more later” means, in numbers.',
            effects: {},
            response:
              'Tallow unlocks the green book with a key she wears on a ribbon, and turns it round so you can read it.',
            next: 'terms',
          },
          {
            id: 'accept',
            label: 'Take the forty brass.',
            effects: {
              brass: 40,
              local: { ledger: 2 },
              flags: ['ledger-credit'],
            },
            response:
              'The factor writes the debt in a very small, very permanent hand.',
          },
          {
            id: 'decline',
            label: 'Decline politely. The crown pays its own way.',
            effects: { local: { ledger: -1, lamplight: 1 } },
            response: 'The factor closes her book. “Another time.”',
          },
        ],
        beats: [
          {
            id: 'terms',
            lines: [
              '“Forty now. Fifty at the end of the season. And until it is paid, the Ledger stands first at the market gate, before the Yard and before the Old Houses, and Ledger carts are not searched by the Watch.”',
              '“That last part is a formality. We are honest people. We would simply rather not be treated as the other kind.”',
              {
                who: 'A Gate Watch sergeant',
                text: 'A cart the Watch can’t search, Majesty, is a cart anything can ride in.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The crown is short, Your Majesty, and the Ledger is not. Debts are only dangerous to people who mean to default.',
              },
            ],
            options: [
              {
                id: 'surety',
                label:
                  'Take the forty, pledge the market’s stall fees as surety, and keep the Watch on the carts.',
                requires: { flags: ['market-charter'] },
                effects: {
                  brass: 30,
                  local: { ledger: 1, yard: -1 },
                  flags: ['ledger-credit', 'd08-fees-pledged'],
                },
                response:
                  'Tallow considers the charter she wrote, offered back to her as collateral, and smiles for the first time today. “You read it,” she says. “Nobody reads it.” The stall-keepers learn by evening that their fees belong to the Ledger until the crown says otherwise.',
              },
              {
                id: 'accept',
                label: 'Take the forty brass, on her terms.',
                effects: {
                  brass: 40,
                  local: { ledger: 2 },
                  flags: ['ledger-credit'],
                },
                response:
                  'The factor writes the debt in a very small, very permanent hand. That evening the sergeant at the gate watches the first unsearched Ledger cart roll through, and makes a note of his own.',
              },
              {
                id: 'decline',
                label: 'Decline. The crown pays its own way, however slowly.',
                effects: { local: { ledger: -1, lamplight: 1 } },
                response:
                  'The factor locks her book. “Another time,” she says, in the tone of someone who has already written down which time.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 9,
    title: 'Iron on the Road',
    briefings: [
      {
        id: 'iron-convoy',
        source: 'Oriel Saltmarsh, caravan master',
        text: 'A convoy of salvaged iron will try the rail canyon tonight.',
        truth: true,
      },
      {
        id: 'three-bands',
        source: 'Rail canyon scouts',
        text: 'Three separate raider bands are camped above the canyon road.',
        truth: true,
      },
      {
        id: 'iron-cursed',
        source: 'A Saltroad fortune-teller',
        text: 'The iron was dug from a grave and anyone who guards it will die within the year.',
        truth: false,
      },
    ],
    komodo:
      'You will see a mark on this one’s posting, Your Majesty: lethal. It means what it says. Most quests cost a sprain and a week in bed. This one can cost a friend. Send strong people, or send nobody, but do not send them without knowing.',
    quests: ['q-d09-iron-convoy'],
    audiences: [
      {
        id: 'd09-convoy',
        title: 'Iron on the Road',
        speaker: 'Oriel Saltmarsh, caravan master',
        npc: 'oriel-saltmarsh',
        faction: 'saltroad',
        lines: [
          'Oriel Saltmarsh fills the doorway with her caravan coat and a faint smell of axle grease and the sea. Her goggles are pushed up on her brow, there is a ledger in her pouch, and she does not walk up the carpet so much as inspect it for load-bearing.',
          'I have nine wagons of old-world iron and a canyon full of people who want it. My drivers will go tonight with or without an escort. They have families, and the iron is their wages.',
          'The posting is on your board, and I expect your advisor has told you what the red mark beside it means. If you would rather not risk your own, there are other swords for hire.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'It means some of the people who go may not come back, Your Majesty. Not probably. Possibly. That is the whole difference, and it is enough.',
          },
        ],
        options: [
          {
            id: 'ask-bands',
            label: 'Ask who the three bands above the canyon are.',
            effects: {},
            response:
              'Oriel pulls her goggles down over her eyes, which she does, you will learn, when she would rather nobody saw what they were doing.',
            next: 'bands',
          },
          {
            id: 'our-own',
            label: 'Our own will go. Check the board.',
            effects: { affinity: { saltroad: 3 } },
            response:
              'Oriel nods. “Then I will tell my drivers to sleep a little.”',
          },
          {
            id: 'hire-pack',
            label: 'Hire the Jackalwire to ride with the convoy instead.',
            requires: {
              cost: 25,
              affinity: { jackalwire: 'neutral' },
            },
            effects: {
              affinity: { saltroad: 5, jackalwire: 5 },
              flags: ['pack-guarded-iron'],
            },
            response:
              'Oriel looks at you for a long moment. “Wolves to guard the sheep. Bold. It may even work.”',
          },
          {
            id: 'not-ours',
            label: 'The crown cannot spare anyone tonight.',
            effects: { affinity: { saltroad: -3 } },
            response:
              'Oriel shrugs. “Then pray for my drivers. Somebody should.”',
          },
        ],
        beats: [
          {
            id: 'bands',
            lines: [
              '“Two of them are raiders. Painted wagons, no colors I know, the sort who leave nothing behind but wheel ruts.”',
              '“The third is Freeholders. Hill farmers from above Thistledown whose wells went dry in the summer. They have pitchforks and very old crossbows and children who have not eaten properly since spring. They will not stop a convoy. They will die trying.”',
              '“Your people would be guarding my iron against them, Majesty. I want you to know that before you send anyone. I would rather you hated me now than later.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Starving farmers with crossbows kill people too, Your Majesty. The iron does not care who is hungry, and neither does a quarrel in the dark.',
              },
            ],
            options: [
              {
                id: 'farmers-fed',
                label:
                  'Send the hill farmers a cart of the fortress’s own grain tonight, ahead of the convoy.',
                requires: { cost: 20 },
                effects: {
                  affinity: { freeholds: 10 },
                  local: { yard: -2 },
                  flags: ['d09-farmers-fed'],
                },
                response:
                  'The cart goes up the hill road at sunset with two Yard drivers and a white flag made from a flour sack. The Yard grumbles about feeding strangers while its own ovens run low. Above the canyon that night, one of the three campfires goes out early.',
              },
              {
                id: 'leave-wagon',
                label:
                  'Tell Oriel to leave one wagon of iron at the canyon mouth for the farmers to sell.',
                effects: {
                  affinity: { saltroad: -5, freeholds: 8 },
                  local: { ledger: -1 },
                  flags: ['d09-wagon-left'],
                },
                response:
                  'Oriel is quiet for a long moment. “One wagon,” she says. “A ninth of my drivers’ wages, given away by someone who will not be paying it.” She goes. In the morning the hill farmers have left their perch above the canyon, and so has one wagon.',
              },
              {
                id: 'vane-debt',
                label:
                  'Send word to Gristle Vane: the crown bought his pups’ tincture, and tonight the debt is called in.',
                requires: {
                  flags: ['pack-medicine'],
                  notFlags: ['d05-vane-threatened'],
                },
                effects: {
                  affinity: { saltroad: 5, jackalwire: -5 },
                  flags: ['pack-guarded-iron', 'd09-vane-debt-called'],
                },
                response:
                  'Vane’s answer comes back with a pup on a painted bicycle: a single feather and the words PAID IN FULL, misspelled. That night painted wagons ride on either side of Oriel’s convoy, and the hill farmers, who know those wagons, stay on their hill.',
              },
              {
                id: 'our-own',
                label:
                  'Our own will go, and they will know who is on the hill.',
                effects: { affinity: { saltroad: 3 } },
                response:
                  'Oriel nods and pushes her goggles back up. “Then I will tell my drivers to sleep a little,” she says. “Tell yours not to.”',
              },
              {
                id: 'hire-pack',
                label:
                  'Hire the Pack to ride with the convoy. Raiders frighten farmers better than soldiers do.',
                requires: {
                  cost: 25,
                  affinity: { jackalwire: 'neutral' },
                },
                effects: {
                  affinity: { saltroad: 5, jackalwire: 5 },
                  flags: ['pack-guarded-iron'],
                },
                response:
                  'Oriel looks at you for a long moment. “Wolves to frighten the sheep away from the other wolves,” she says. “Bold. It may even work.”',
              },
              {
                id: 'not-ours',
                label:
                  'The crown will not spare anyone for a fight it would be ashamed to win.',
                effects: { affinity: { saltroad: -3 } },
                response:
                  'Oriel shrugs, and the goggles come back up. “Then pray for my drivers,” she says. “And for the hill. Somebody should.”',
              },
            ],
          },
        ],
      },
      {
        id: 'd09-kitchens',
        title: 'The Kitchens Send Their Cook',
        speaker: 'Juniper Slate of the Yard',
        faction: 'yard',
        requires: { local: { yard: 12 } },
        lines: [
          'Juniper Slate comes up from the kitchens smelling of onions and carbolic: an opossum with a ladle through their belt like a sword and a roll of bandage in one apron pocket. They walk straight past the herald, who has learned not to try.',
          'The Yard is behind the throne, Majesty, which means the kitchens are, which means me. I want to see what the court eats on the road.',
          'I can cook, I can bandage, and I can tell you what the Yard says when you are not listening. Mostly that last one. It is the most useful and it is the one nobody pays for.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Every court has a kitchen that knows more than its council, Your Majesty. The wise ones feed it.',
          },
        ],
        options: [
          {
            id: 'ask-yard',
            label: 'Ask what the Yard says when the throne is not listening.',
            effects: {},
            response:
              'Juniper grins and pulls up a stool nobody offered them. “How long have you got?”',
            next: 'gossip',
          },
          {
            id: 'welcome',
            label: 'Bring Juniper into the barracks.',
            requires: { cost: 5 },
            effects: { recruit: ['F020'], local: { yard: 1 } },
            response:
              'Juniper salutes with a wooden spoon and is already rearranging the barracks pantry.',
          },
          {
            id: 'kitchens',
            label: 'The kitchens need you more than the road does.',
            effects: { local: { yard: 1 }, recruitable: ['F020'] },
            response:
              '“Fair,” says Juniper. “Ask again when the soup is better.”',
          },
        ],
        beats: [
          {
            id: 'gossip',
            lines: [
              '“They say tonight’s convoy is the first time the crown has sent people where people die. They say it the way you say the first frost: not angry, just counting the days to the next one.”',
              '“They say the Old Houses eat white bread and the Watch eats brown and the Yard eats whatever is left in the sack. They say you are better than the last one. They say that is not hard.”',
              '“And they say if I go on the road with your followers, the kitchens will burn the porridge for a month. They are right about that too.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'Take them, and the Yard has one less mouth that tells the throne the truth. Leave them, and the Yard has one less reason to think you were listening.',
              },
            ],
            options: [
              {
                id: 'welcome',
                label:
                  'Then come and tell the barracks what the Yard says. Bring the ladle.',
                requires: { cost: 5 },
                effects: { recruit: ['F020'], local: { yard: 1 } },
                response:
                  'Juniper salutes with the ladle and starts rearranging the barracks pantry before you have finished speaking. The porridge burns the next morning. The Yard forgives it, because it burned for the crown.',
              },
              {
                id: 'listen',
                label:
                  'Stay in the kitchens, and come up each morning to tell the throne what the Yard said overnight.',
                effects: {
                  local: { yard: 2, 'old-houses': -1 },
                  flags: ['d09-kitchen-ear'],
                },
                response:
                  'Juniper considers it. “A spy with a soup pot,” they say. “I’ve been called worse, by better.” Every morning after that there is a bowl of broth on the arm of the throne, and under the bowl a folded note. The Old Houses do not like how much the throne suddenly knows about bread.',
              },
              {
                id: 'kitchens',
                label: 'The kitchens need you more than the road does.',
                effects: { local: { yard: 1 }, recruitable: ['F020'] },
                response:
                  '“Fair,” says Juniper, and takes the stool back down the stairs with them. “Ask again when the soup is better.”',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 10,
    title: 'Oath of the Gate',
    briefings: [
      {
        id: 'thistledown',
        source: 'A rider from Thistledown',
        text: 'Jackalwire raiders are at the edge of Thistledown, the largest Freehold village.',
        truth: true,
      },
      {
        id: 'watch-oath',
        source: 'Captain Ferro Dunmark',
        text: 'The Gate Watch will swear its oath to the crown at noon.',
        truth: true,
      },
      {
        id: 'east-quiet',
        source: 'A Saltroad peddler',
        text: 'Nothing has moved in the sunken rail yards to the east for a hundred years.',
        truth: false,
      },
    ],
    komodo:
      'Something always moves in the east, Your Majesty; the crows have been watching it for a week. But today is the Watch’s day, and Thistledown’s. Whatever happens at that village will be on the map tomorrow.',
    quests: ['q-d10-freehold-raid'],
    audiences: [
      {
        id: 'd10-oath',
        title: 'Oath of the Gate',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'At noon the whole Gate Watch stands in the parade yard below the throne-room balcony: sixty in dented gorgets and patched tabards, the young ones too straight, the old ones leaning very slightly on their spears. Past the walls, to the east, a thin line of smoke stands up from where Thistledown should be.',
          'Captain Ferro Dunmark climbs to the balcony alone. He is a broad grey wolf with a scarred muzzle and one torn ear, and he salutes the way a door closes.',
          'The Gate Watch is ready to swear, Majesty. Every one of them. They want to know what you swear back.',
          'Soldiers will die for a crown. They would rather know it will not spend them like brass.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Whatever you say on this balcony will be repeated in every guardroom for as long as you wear the crown, Your Majesty. Choose words you can afford.',
          },
        ],
        options: [
          {
            id: 'ask-last-oath',
            label: 'Ask Dunmark what the last emperor swore to them.',
            effects: {},
            response:
              'Dunmark’s torn ear flicks once. “I wondered whether you would ask,” he says. “He didn’t.”',
            next: 'last-oath',
          },
          {
            id: 'ask-ranks',
            label:
              'Ask the Watch itself, not its captain, what it wants sworn.',
            effects: {},
            response:
              'Dunmark steps aside without a word and lets you lean over the balcony rail. Sixty faces turn up. For a moment nobody in the yard knows what to do with an emperor who asks.',
            next: 'ranks',
          },
          {
            id: 'care',
            label: '“I will never spend you cheaply.”',
            effects: {
              local: { 'gate-watch': 5, 'old-houses': -1 },
              flags: ['oath-of-care'],
              recruitable: ['F013'],
            },
            response:
              'Dunmark looks at you a long time, then nods. “They’ll hold you to that. So will I.” A rhino at the end of the line asks to serve the crown closer than the gate.',
          },
          {
            id: 'crown',
            label: '“You belong to the crown, before all else.”',
            effects: {
              local: { 'gate-watch': 2, 'old-houses': 3, yard: -2 },
              flags: ['oath-of-crown'],
            },
            response:
              'The Watch swears. It is loud and correct and nobody smiles.',
          },
          {
            id: 'bonus',
            label: 'Words are cheap. Pay every sworn guard a bonus.',
            requires: { cost: 30 },
            effects: {
              local: { 'gate-watch': 6, ledger: -1 },
              recruitable: ['F013'],
            },
            response:
              'The cheer is real. Whether the loyalty is, time will tell.',
          },
        ],
        beats: [
          {
            id: 'last-oath',
            lines: [
              '“He swore he would never spend us cheaply. Those words, Majesty. Then he sent sixty of us down the rail canyon to fetch him an engine out of the old yards, because somebody told him it could make rain.”',
              '“Nineteen came back. I was one. The engine never made rain. As far as I know it is still lying in the canyon. Nobody went back for it, and nobody went back for the rest of us either.”',
              '“So the Watch does not want a kind oath. It has had one. It wants one you can keep on a bad day, with smoke on the horizon and a good reason to break it.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Then swear them to the crown, Your Majesty, not to yourself. A crown can break a promise and still be a crown. A person who breaks one is only a liar.',
              },
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: '“The Old Houses’ sons stand in that yard, Majesty,” says Lady Vask from the gallery. “We would prefer they swore to something that outlasts any one of us.”',
              },
            ],
            options: [
              {
                id: 'reasons',
                label:
                  '“I will spend you. I will never spend you in the dark. Every order comes with its reason, and every name is read aloud after.”',
                effects: {
                  local: { 'gate-watch': 3, lamplight: 2, 'old-houses': -2 },
                  flags: ['d10-oath-of-reasons'],
                },
                response:
                  'Dunmark is silent so long that the yard begins to murmur. Then he turns to the rail and gives it to them word for word, in the voice he uses for orders, and sixty voices give it back. “That one,” he says afterward, quietly, “you will hate keeping. Good.”',
              },
              {
                id: 'care',
                label:
                  '“I will never spend you cheaply.” The same words he said, and mean them.',
                effects: {
                  local: { 'gate-watch': 5, 'old-houses': -1 },
                  flags: ['oath-of-care'],
                  recruitable: ['F013'],
                },
                response:
                  'Dunmark looks at you for a long time. “He said it in that same voice,” he says. “They’ll hold you to it. So will I.” A rhino at the end of the line, taller than the gate, asks to serve the crown closer than the walls.',
              },
              {
                id: 'crown',
                label:
                  '“You belong to the crown, before all else.” Let the crown carry the promise.',
                effects: {
                  local: { 'gate-watch': 2, 'old-houses': 3, yard: -2 },
                  flags: ['oath-of-crown'],
                },
                response:
                  'The Watch swears. It is loud and correct and nobody smiles. Along the gallery Lady Vask nods, like someone whose bill has been paid, and Young Komodo writes the words down exactly.',
              },
              {
                id: 'bonus',
                label:
                  'He has heard enough words. Pay every sworn guard a bonus instead.',
                requires: { cost: 30 },
                effects: {
                  local: { 'gate-watch': 6, ledger: -1 },
                  recruitable: ['F013'],
                },
                response:
                  'The cheer is real. Dunmark does not cheer. “Brass,” he says, “is at least honest about what it is.” Whether the loyalty is, time will tell.',
              },
            ],
          },
          {
            id: 'ranks',
            lines: [
              {
                who: 'A young sentry',
                text: '“Will you send us to Thistledown today, Majesty?” It is the sentry who found the stable latch, barely old enough for his gorget. “My mother is there. A lot of our mothers are there.”',
              },
              {
                who: 'An old guard with a grey muzzle',
                text: '“And if you send us, who holds this gate? The last time the Watch rode out, it came back a third its size, and the gate was held by kitchen boys.”',
              },
              '“That is the oath they want, Majesty,” Dunmark says. “Not words. Today. Thistledown or the gate. Whatever you choose, half of them will swear it with their teeth shut.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Thistledown is already on the board, Your Majesty. Post it, and keep the Watch on the walls. An oath sworn on the road is sworn by whoever survives it.',
              },
            ],
            options: [
              {
                id: 'ride-out',
                label:
                  'Swear the oath on the road. The Watch rides for Thistledown within the hour.',
                effects: {
                  local: { 'gate-watch': 3, 'old-houses': -2, ledger: -1 },
                  affinity: { freeholds: 10 },
                  flags: ['d10-oath-on-the-road'],
                },
                response:
                  'They swear it at a run, buckling gorgets, the young sentry loudest of all. The gate is held that night by the old guard and the kitchen boys, and the Old Houses bolt their own doors. Whatever happens at Thistledown, the Watch went.',
              },
              {
                id: 'hold-gate',
                label:
                  'Swear them to the gate. Thistledown gets the posting and whoever the board can spare.',
                effects: {
                  local: { 'gate-watch': 1, 'old-houses': 2 },
                  affinity: { freeholds: -5 },
                  flags: ['d10-oath-of-the-gate'],
                },
                response:
                  'The Watch swears to hold the gate, and holds it. The young sentry swears with his eyes on the smoke the whole time. By evening he has asked to be relieved, and Dunmark, after a long look at you, lets him go.',
              },
              {
                id: 'care',
                label:
                  '“I will never spend you cheaply,” and let them decide what cheap means today.',
                effects: {
                  local: { 'gate-watch': 5, 'old-houses': -1 },
                  flags: ['oath-of-care'],
                  recruitable: ['F013'],
                },
                response:
                  'The yard is quiet while they work out whether that was an answer. Then the old guard laughs, once, and swears, and the rest follow. A rhino at the end of the line asks to serve the crown closer than the gate.',
              },
            ],
          },
        ],
      },
      {
        id: 'd10-thistledown',
        title: 'Smoke Over Thistledown',
        speaker: 'A rider from Thistledown',
        faction: 'freeholds',
        lines: [
          'The rider from Thistledown is still on her feet only because nobody has told her she may stop. She is a young stoat with soot in her fur and a broken pitchfork tine pushed through her belt in place of a knife, and her pony stands foundered in the courtyard below.',
          '“Painted wagons at the edge of Thistledown, Majesty. Forty raiders, maybe fifty. They came at dawn for the granary, and they will be back at dusk for whatever is left.”',
          '“We are not your village. We never paid your tax. My grandmother spat whenever your crown was named. I am asking anyway.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The posting is already on the board, Your Majesty. What she is really asking is what Thistledown is worth to a crown it never paid.',
          },
        ],
        options: [
          {
            id: 'ask-colors',
            label: 'Ask whose colors the wagons fly.',
            effects: {},
            response:
              'She has to think about it, which tells you how close she was to them.',
            next: 'colors',
          },
          {
            id: 'rook',
            label: 'Let Rook Bramble look at the soot on her boots.',
            requires: { follower: 'F001' },
            effects: {},
            response:
              'Rook kneels at the rider’s feet before you have finished the sentence, and she lets them, too tired to ask why.',
            next: 'rook',
          },
          {
            id: 'promise',
            label: 'Promise her every hand the board can field.',
            effects: {
              affinity: { freeholds: 5 },
              local: { 'old-houses': -1 },
              flags: ['d10-thistledown-promised'],
            },
            response:
              'She nods and does not thank you, because she has not yet seen anyone arrive. She goes down to wait by the board in the courtyard, where she can see who signs.',
          },
          {
            id: 'bargain',
            label:
              'Tell Thistledown to pay the raiders what the Freeholds have always paid them, and live.',
            effects: {
              affinity: { freeholds: -10, jackalwire: 5 },
              local: { ledger: 1, 'old-houses': 1 },
              flags: ['d10-thistledown-told-to-pay'],
            },
            response:
              '“Pay them,” she repeats. “With what? They are already taking it.” She goes. You watch her lead the pony out of the courtyard with the tine still through her belt, and the smoke on the horizon is a little wider by the time she reaches it.',
          },
        ],
        beats: [
          {
            id: 'colors',
            lines: [
              '“Not Vane’s. Or not only Vane’s. Painted jaws, red wheels, a fiddle on the lead wagon. A captain who laughs.”',
              '“They shout that the crown has the bridge now, and the toll, and the carts, so the Pack needs a new road to eat from. They shout that it is your fault.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'She is not wrong, Your Majesty. Every cart the crown kept safe this week is a cart the Pack did not eat. Hunger has to go somewhere. It went east. That is also why the Freeholds should learn to pay their own way: the crown cannot be every village’s wall.',
              },
            ],
            options: [
              {
                id: 'strike-camp',
                label:
                  'Send the Watch against the Pack’s home camp with the informant’s map. The raiders will ride back to defend it.',
                requires: { flags: ['pack-camp-mapped'] },
                effects: {
                  affinity: { jackalwire: -15, freeholds: 10 },
                  local: { 'gate-watch': 2, yard: -1 },
                  flags: ['d10-camp-struck'],
                },
                response:
                  'The raiders turn for home before dusk, exactly as you were told they would, and Thistledown keeps whatever it had left. The Watch comes back from the canyon at midnight, very quiet. Nobody in the guardroom will say what the camp looked like, or how many of the tents had pups coughing in them.',
              },
              {
                id: 'tincture',
                label:
                  'Send the fiddler a message: the crown bought her pups’ tincture, and Thistledown is the price.',
                requires: {
                  flags: ['pack-medicine'],
                  notFlags: ['d09-vane-debt-called'],
                },
                effects: {
                  affinity: { freeholds: 5, jackalwire: -5 },
                  flags: ['d10-tincture-called-in'],
                },
                response:
                  'The rider carries your message east herself. At dusk the fiddler plays one long, sour note from the lead wagon, loud enough to hear at the edge of the village, and turns her wagons round. Half the raiders go with her. Half do not.',
              },
              {
                id: 'promise',
                label: 'Promise her every hand the board can field.',
                effects: {
                  affinity: { freeholds: 5 },
                  local: { 'old-houses': -1 },
                  flags: ['d10-thistledown-promised'],
                },
                response:
                  '“Every hand,” she repeats, as if testing whether it will hold weight. She goes down to wait by the board, where she can see who signs.',
              },
              {
                id: 'bargain',
                label:
                  'Komodo is right. Tell Thistledown to pay the raiders, and live.',
                effects: {
                  affinity: { freeholds: -10, jackalwire: 5 },
                  local: { ledger: 1, 'old-houses': 1 },
                  flags: ['d10-thistledown-told-to-pay'],
                },
                response:
                  'She looks from you to Young Komodo and back, and something in her face closes for good. “My grandmother was right,” she says, without heat, and goes.',
              },
            ],
          },
          {
            id: 'rook',
            lines: [
              {
                who: 'Rook Bramble',
                npc: 'F001',
                text: 'Rook rubs the soot from her boot between finger and thumb, smells it, and goes very still. “Barn tar,” they say. “And axle grease off Pack wagons. Red wheels.”',
              },
              {
                who: 'Rook Bramble',
                npc: 'F001',
                text: '“A Pack raider pulled my family out of the Ford in flood when I was small, Majesty. I have owed the Pack ever since, and I have never once been asked to pay.” Rook does not look up. “She rides with those wagons still. I could go and ask her for one more mercy. It would not be free.”',
              },
              '“I don’t care what it costs you,” says the rider. “I care what it costs us.”',
            ],
            options: [
              {
                id: 'rook-mercy',
                label:
                  'Send Rook to the raiders under a white rag, to ask the one they owe for Thistledown.',
                effects: {
                  affinity: { freeholds: 5, jackalwire: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d10-rook-asked-mercy'],
                },
                response:
                  'Rook goes at a run, a white rag tied to an arrow shaft. They come back after midnight with soot to the elbows, and will not say what was asked, or what was promised in return.',
              },
              {
                id: 'promise',
                label:
                  'Keep Rook here. Promise her every hand the board can field.',
                effects: {
                  affinity: { freeholds: 5 },
                  local: { 'old-houses': -1 },
                  flags: ['d10-thistledown-promised'],
                },
                response:
                  'Rook nods without looking up, and does not stand for a long time. The rider goes down to wait by the board, where she can see who signs.',
              },
              {
                id: 'bargain',
                label:
                  'Tell Thistledown to pay the raiders what the Freeholds have always paid them, and live.',
                effects: {
                  affinity: { freeholds: -10, jackalwire: 5 },
                  local: { ledger: 1, 'old-houses': 1 },
                  flags: ['d10-thistledown-told-to-pay'],
                },
                response:
                  '“Pay them,” the rider repeats. “With what?” Rook stands, brushes the soot from their hands, and walks out of the hall without asking leave.',
              },
            ],
          },
        ],
      },
    ],
  },
]
