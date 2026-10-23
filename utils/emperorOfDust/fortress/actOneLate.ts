import type { DayDef, DueDef, QuestDef } from './types'

// Act I, Days 5-10 (conductor DAY-PLAN.md): the toll comes due, the first
// secret revealed, Komodo's first lie of his own, the Abbey's first offer,
// the first lethal quest, and the Gate Watch's oath before the map changes.

export const ACT_ONE_LATE_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d05-flour-barrels',
    title: 'Flour Before the Wages Fail',
    summary:
      'The Yard’s kitchens are three days from empty. Haggle flour barrels off the Saltroad carts before the foreman runs out of patience.',
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
        'The barrels came in at dusk, cheaper than the foreman feared. The ovens were lit before the carts were unloaded.',
      partial: 'Half the barrels arrive. The Yard cuts bread by the slice.',
      failure:
        'The carts wanted more than the tower had. The Yard eats half loaves and says out loud whose fault it is.',
      expired:
        'No one went. The foreman served porridge for supper and told everyone whose fault it was.',
    },
  },
  {
    id: 'q-d05-toll-standoff',
    title: 'Hold the Toll Bridge',
    summary:
      'Captain Gristle Vane’s wagons are back at the southern bridge. Hold it open for the Saltroad carts. Do not start a war.',
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
        'The bridge stayed open two days. The Pack went home with nothing but a sore opinion of the tower.',
      success: 'The carts crossed. Gristle Vane counted every one.',
      partial: 'Half the carts crossed. Then the wagons closed ranks.',
      failure:
        'The Pack held the bridge. You could hear them from the wall all night.',
      expired: 'Nobody went. The Saltroad carts took the long road again.',
    },
  },
  {
    id: 'q-d05-saltroad-escort',
    title: 'Raiders for Hire',
    summary:
      'Pay the Jackalwire to guard the Saltroad carts they used to rob. Someone has to make sure they do it.',
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
        'The Pack guarded the carts the whole road. One goat went missing. The Saltroad calls that a pact.',
      partial: 'The carts arrived. Some of the cargo did not.',
      failure: 'The escort vanished the second night. So did three crates.',
      expired: 'The offer went stale. The Pack took it as an insult.',
    },
  },
  {
    id: 'q-d06-empty-stable',
    title: 'The Empty Stable',
    summary:
      'Every mount in the fortress stable is gone. The gate was opened from inside. One horse came back lame. The stablehands are not talking.',
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
        'The mounts were grazing two valleys over. The stable latch had been filed through, carefully, by someone who knew the fortress.',
      partial: 'Most of the mounts came home. Nobody can explain the latch.',
      failure: 'The trail went cold at the ford.',
      expired: 'The court rode nowhere for a week. The Yard noticed.',
    },
  },
  {
    id: 'q-d07-crow-favor',
    title: 'The Crows’ Errand',
    summary:
      'The Conclave’s price for its storm warning: carry a sealed parcel to the Mirefen. Do not open it.',
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
        'The witch who took the parcel was not surprised. It ticked the whole way. A Conclave scout who followed the courier now asks to see the emperor about what was inside.',
      partial:
        'The parcel arrived damp. The Crows are not pleased, or not saying.',
      failure:
        'The parcel was lost in the reeds. Something in the reeds kept it.',
      expired: 'The Crows took back their warning, word by word.',
    },
  },
  {
    // t-035: Komodo's first lie of his own, made something the crown can test.
    id: 'q-d07-galleries',
    title: 'Under the Ford',
    summary:
      'Go down the old Mole galleries under the Eastern Ford, quietly. Komodo’s runner says rubble and rats. See for yourself.',
    region: 'mole-tunnels',
    faction: 'moles',
    durationDays: 1,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'lore', band: 'low', hidden: true },
    ],
    danger: 'low',
    tags: ['tunnels', 'tracking'],
    rewards: {
      success: {
        affinity: { moles: 5 },
        local: { lamplight: 1 },
        flags: ['d07-galleries-found'],
      },
      partial: { flags: ['d07-galleries-door-barred'] },
      failure: { affinity: { moles: -5 } },
    },
    expired: {},
    outcomes: {
      triumph:
        'No rubble. No rats. Forty Mole families in dry galleries, and a path to the old door worn smooth by small feet. An old tunnel keeper asked the party not to tell the tower. Then she asked who had told the tower it was empty.',
      success:
        'No rubble. No rats. Forty Mole families in dry galleries, and a path to the old door worn smooth by small feet. They asked the party not to tell the tower. The party told you anyway.',
      partial:
        'The party found the old door at the end of a path worn smooth. It was barred from the inside. Somebody behind it was breathing.',
      failure:
        'The party went down with a lamp and came up without it. Something in the dark took it out of a hand, politely.',
      expired: 'Nobody went down. The path stayed smooth.',
    },
  },
  {
    id: 'q-d08-escort-to-bell',
    title: 'A Family of Five',
    summary:
      'Walk a Freehold family to Hollow Bell, past the raider scouts. Settle them with someone who will not lose track of them.',
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
        'The family sleeps above the Hollow Bell bakery. The youngest gave the escort a drawing of a horse that is mostly legs.',
      partial: 'The family arrived tired and frightened. The cart did not.',
      failure:
        'Raider scouts scattered the family on the road. Four were found by nightfall. They are still looking for the fifth.',
      expired: 'Nobody came for them. The family went to the Abbey after all.',
    },
  },
  {
    id: 'q-d09-iron-convoy',
    title: 'Iron on the Road',
    summary:
      'A Saltroad convoy of salvaged iron must cross the rail canyon at night. Three bands want it. Not everyone who goes comes back.',
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
        'Every wagon crossed by dawn. The caravan master pressed a salvaged crowbar on the escort to keep.',
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
      'The Jackalwire are raiding Thistledown, the largest Freehold village. Whatever happens there is on the map tomorrow.',
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
        'Thistledown held. The raiders were run past the canyon mouth. The Freeholds will remember who came.',
      success: 'Thistledown held. Its granary did not.',
      partial: 'The raiders left with half the village’s stores.',
      failure:
        'Thistledown burned. Its people walked to the Eastern Ford with what they could carry.',
      expired:
        'No one went. Thistledown burned. The Freeholds will remember that too.',
    },
    // t-035: the hill farmers the crown fed on Day 9 came down to the granary.
    outcomeVariants: {
      triumph: [
        {
          flags: ['d09-farmers-fed'],
          text: 'Thistledown held. Hill farmers came down with old crossbows and stood in the granary door beside your people. “Your grain came up our road under a flour-sack flag,” one said. “We owed it.”',
        },
      ],
      success: [
        {
          flags: ['d09-farmers-fed'],
          text: 'Thistledown held. Its granary did not. Hill farmers came down to stand in the door anyway. “Your grain came up our road under a flour-sack flag. We owed it.”',
        },
      ],
      expired: [
        {
          flags: ['d10-thistledown-promised'],
          text: 'The rider waited by the board until dark. Nobody signed. Thistledown burned.',
        },
      ],
    },
  },
]

export const ACT_ONE_LATE_DAYS: readonly DayDef[] = [
  {
    day: 5,
    title: 'Raider’s Toll',
    briefings: [
      {
        id: 'vane-retired',
        source: 'A Jackalwire deserter, for a fee',
        text: 'Gristle Vane has retired. The Pack is choosing a new captain by song.',
        truth: false,
      },
      {
        id: 'vane-back',
        source: 'Saltroad cart-drivers',
        text: 'Gristle Vane’s painted wagons are back at the southern bridge. Twice as many.',
        truth: true,
        variants: [
          {
            flags: ['pack-medicine'],
            text: 'Gristle Vane’s painted wagons are back at the southern bridge. Twice as many. The pups the crown dosed ride in the front cart.',
          },
        ],
      },
      {
        id: 'yard-wages',
        source: 'The Yard’s foreman',
        text: 'Three days of flour left at current wages.',
        truth: true,
      },
    ],
    komodo:
      'A man who sells news by the word sells good news. Vane is back, Your Majesty. Vane has never retired from anything.',
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
          'Captain Gristle Vane does not walk up the carpet. He arrives on it. A greatcoat sewn from a hundred kinds of feather, and a few things that are not feathers. An ear-chain that jangles at every step. The two raiders at the doors pick their teeth with the court’s good spoons.',
          'Your Majesty! One of my captains met you at the bridge. Says you have a soft face and a hard floor. I came to see both.',
          'The toll is thirty brass a week now. Prices rise. Or hire us to guard the carts we would otherwise rob. Cheaper than it sounds.',
          'Or hold the bridge yourself. I would bring a chair.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Thirty brass is a week of the Yard’s bread, Your Majesty. He priced it to the slice.',
          },
        ],
        options: [
          {
            id: 'ask-price',
            label: 'Ask why the toll doubled since the bridge.',
            effects: {},
            response:
              'Vane spreads his arms. Feathers rustle. “A customer who reads the bill.”',
            next: 'prices',
          },
          {
            id: 'saffron',
            label: 'Let Saffron Kett answer him. She knows his voice.',
            requires: { follower: 'F002' },
            effects: {},
            response:
              'Saffron steps out from the pillar before you finish her name. Not like her. Vane’s grin widens to the ear-chain.',
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
              'Vane bows until his feathers sweep the floor. “This week only. Of course.” In the gallery the Ledger’s factor writes a line and underlines it twice.',
          },
          {
            id: 'hire',
            label: 'Hire the Pack to guard the Saltroad carts.',
            requires: { affinity: { jackalwire: 'wary' } },
            effects: {},
            response:
              'Vane looks surprised. “Paid to do nothing to the carts. How restful.”',
            postsQuests: ['q-d05-saltroad-escort'],
          },
          {
            id: 'hold',
            label: 'Send a party to hold the bridge open.',
            effects: { local: { 'gate-watch': 1 } },
            response: 'Vane grins with every tooth. “I’ll bring the chair.”',
            postsQuests: ['q-d05-toll-standoff'],
          },
        ],
        beats: [
          {
            id: 'prices',
            // t-035: a crown that already heard the dust-lung story hears
            // something new: who corners the cure, or what the crown changed.
            variants: [
              {
                flags: ['d03-tincture-one-price'],
                lines: [
                  '“One price at the bridge now, Your Majesty. Same as a salt-flat village. The pups drink. I came for the toll anyway.” He shrugs. Feathers. “Habit.”',
                  '“Here is the true bill. Grey robes buy every vial on the flats at your one price before the carts reach my bridge. For their children, they say. They have a great many children. What is left comes to my camps, and there is not much left.”',
                  '“So I still need brass. I am a thief. They are a charity. I know which one of us sleeps better.”',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'One price was the crown’s kindness, Your Majesty. Someone always finds where a kindness can be bought wholesale. The Abbey feeds half the mission road. I would not quarrel with it over cough syrup.',
                  },
                ],
              },
              {
                flags: ['d03-caravan-burners-named'],
                lines: [
                  '“Red Spoke. You named them at court. Chalked it above your Watch’s fire.” Vane says it pleasantly. “They were mine once. They are not now. Because of you, nobody on the Ford road will sell to them, so they sell to me, and I cannot pay.”',
                  '“So the toll doubled. The tincture did not get cheaper because you found the right hyenas to blame. The Saltroad still prices it like we all burned that caravan.”',
                  '“I am a thief. I am also the cheapest thief between here and the canyon. The next one won’t wear such a good coat.”',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'He has lost a band and gained a grievance, Your Majesty. The bridge is still his.',
                  },
                ],
              },
              {
                flags: ['chose:d01-toll:ask-toll'],
                lines: [
                  '“You know why. You asked my fiddler on your first day, and she told you, and she cried after. She does not cry.” Vane spreads his coat. “So ask me something new. Ask me who is buying the tincture now.”',
                  '“Grey robes. The Abbey buys every vial on the flats before the carts reach my bridge. For their children, they say. They have a great many children. What is left the Saltroad sells to me at triple, because there is not much left.”',
                  '“So the toll doubled. I am a thief. They are a charity. I know which one of us sleeps better.”',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'A raider accusing an Abbey, Your Majesty. I would not repeat it outside this hall. The bridge is still his either way.',
                  },
                ],
              },
            ],
            lines: [
              '“Because the tincture doubled, Your Majesty. Dust lung. The pups cough. The Saltroad sells the cure, and it has learned hyenas pay whatever they are asked.”',
              '“So the carts pay me, I pay the carts, and the brass goes round the bridge like water round a drain. Everybody gets wet. Nobody drinks.”',
              '“I am a thief. I am also the cheapest thief between here and the canyon. The next one won’t wear such a good coat.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'All true, Your Majesty, and the bridge is still his. Sympathy is not a toll exemption.',
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
                  'Vane goes quiet. “The little ones stopped coughing black. The crown’s own carts cross free this week. Only the crown’s. I am grateful, not stupid.” The Saltroad factor hears the private bargain and leaves early.',
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
                  'The grin holds. The raiders stop picking their teeth. “A drawing. Who would draw a thing like that?” The bridge is open by evening. He did not go home to move the camp. He went home to find the artist.',
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
                  '“This week only.” Vane counts it into his hat. “I’ll tell the pups who bought their cough syrup. They won’t believe me.” The Ledger’s factor writes it down. Underlines it twice.',
              },
              {
                id: 'hire',
                label: 'Then hire the cheapest thief to guard the carts.',
                requires: { affinity: { jackalwire: 'wary' } },
                effects: {},
                response:
                  '“Paid to do nothing to the carts. How restful. The pups will think I went respectable.”',
                postsQuests: ['q-d05-saltroad-escort'],
              },
              {
                id: 'hold',
                label:
                  'Hold the bridge. A thief in a good coat is still a thief.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  '“Good.” Vane does not look sorry. He looks relieved to be the villain again.',
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
                text: '“Gristle. You put a toll on my bridge.” Too fast. She talks that way when she is hiding the back half of a sentence.',
              },
              '“Kett! Still building for people who won’t pay?” Vane turns to you. “She built that bridge, Your Majesty. Hung the cables herself, the summer before she got too good for us.”',
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: '“There’s a ford below the bridge, by the old rail pilings. Rope, timber, twenty-five brass, and I hang a ferry there inside a week. The carts won’t need his bridge. Or him.”',
              },
              '“And the pups,” says Vane, soft, “won’t need their tincture, I suppose.” Still smiling. Saffron does not look at him.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Elegant, Your Majesty. It takes the Pack’s only lever away for good. Somebody else usually pays for elegant.',
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
                  'Saffron nods once and goes for rope. Vane watches her go. “She always did build the thing that put somebody out of work.” He sounds his age.',
              },
              {
                id: 'hire',
                label:
                  'Hire the Pack to guard the carts. Shelve Saffron’s ferry.',
                requires: { affinity: { jackalwire: 'wary' } },
                effects: {},
                response:
                  'Saffron’s jaw works. “Sure. Pay them to stand on my bridge.” Vane bows to her. She does not bow back.',
                postsQuests: ['q-d05-saltroad-escort'],
              },
              {
                id: 'hold',
                label:
                  'Hold the bridge. Saffron built it; the crown keeps it open.',
                effects: { local: { 'gate-watch': 1 } },
                response:
                  '“Your bolts or mine, Kett?” Vane says, to Saffron. Under her breath she is counting every weak bolt on the bridge she built.',
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
          'Captain Gristle Vane comes alone this time. That is worse. Greatcoat buttoned to the throat. Under one arm, a round loaf with a carving knife baked into the crust.',
          'You came to our feast with knives in the bread carts, Your Majesty. We noticed. My cook found this one with her teeth.',
          'He sets the loaf on the dais step the way you set down something that might wake.',
          'The toll is fifty brass now. The price of an insult. Pay it, or hold the bridge yourself.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'He came alone so you would know he is not afraid, Your Majesty. Or think it.',
          },
        ],
        options: [
          {
            id: 'ask-feast',
            label:
              'Ask what the Pack would have done if the court came unarmed.',
            effects: {},
            response: 'Vane laughs. He looks at the loaf while he does it.',
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
            response: '“Good,” says Vane. “I hoped you’d say that.”',
            postsQuests: ['q-d05-toll-standoff'],
          },
        ],
        beats: [
          {
            id: 'unarmed',
            lines: [
              '“Eaten. Sung. Lied about the toll over the second goat and lowered it over the third.” He shrugs. “The feast was real. The goat was real. The pups made you a crown out of fence wire. It was bad. They were proud of it.”',
              '“You owe me an apology, not fifty brass. An apology doesn’t buy tincture. So I’ll take the brass.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Courts do not apologize to raiders, Your Majesty. The Old Houses are listening. So is every captain in the canyon who wants a feast of his own.',
              },
            ],
            options: [
              {
                id: 'apologize',
                label:
                  'Apologize, here, in front of the whole court, and ask what that is worth to him.',
                requires: { cost: 40 },
                effects: {
                  affinity: { jackalwire: 10 },
                  local: { 'old-houses': -2, 'gate-watch': -1 },
                  clearFlags: ['feast-armed'],
                  flags: ['d05-apologized-to-vane'],
                },
                response:
                  'The hall goes quiet enough to hear the lamp oil. Vane breaks the loaf and hands you the half without the knife. “Forty, then. An apology is worth ten. I checked.” He counts the forty into his hat. On the gallery rail an Old House fan snaps shut.',
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
                  'Vane counts it twice. “Settled. For now.” He leaves the loaf on the step, knife and all. Nobody wants to move it.',
              },
              {
                id: 'hold',
                label: 'No apology. No brass. Hold the bridge.',
                effects: { affinity: { jackalwire: -5 } },
                response: '“Good. I so rarely get to be the wronged party.”',
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
        // t-035: Dunmore's third visit reads as Day 2's consequence.
        variants: [
          {
            flags: ['d02-flour-capped'],
            lines: [
              'Foreman Dunmore Ash comes up from the kitchens with flour to the elbows. He does not bow. He counts on his fingers, loaves maybe, and stops at three.',
              '“Hollow Bell capped its flour like you ordered. They ground exactly what they ground last year. Not one sack more. That’s why I’m here.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He has never asked the throne for anything twice, Your Majesty. Don’t teach him how.',
              },
              'Three days of flour, Majesty. Then the ovens go cold. I don’t want speeches. I want flour, or a reason I can carry back down the stairs.',
            ],
          },
          {
            flags: ['d02-flour-dear'],
            lines: [
              'Foreman Dunmore Ash comes up from the kitchens with flour to the elbows. He does not bow. He counts on his fingers, loaves maybe, and stops at three.',
              '“Flour’s a third dearer since your mill order. Three days. It used to be four.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He has never asked the throne for anything twice, Your Majesty. Don’t teach him how.',
              },
              'Three days of flour, Majesty. Then the ovens go cold. I don’t want speeches. I want flour, or a reason I can carry back down the stairs.',
            ],
          },
          {
            flags: ['d02-chits-voided'],
            lines: [
              'Foreman Dunmore Ash comes up from the kitchens with flour to the elbows. He does not bow. He counts on his fingers, loaves maybe, and stops at three.',
              '“You paid my cooks their chits. They ate it. All of it. Now the flour.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He has never asked the throne for anything twice, Your Majesty. Don’t teach him how.',
              },
              'Three days of flour, Majesty. Then the ovens go cold. I don’t want speeches. I want flour, or a reason I can carry back down the stairs.',
            ],
          },
          {
            flags: ['tax-high'],
            lines: [
              'Foreman Dunmore Ash comes up from the kitchens with flour to the elbows. He does not bow. He counts on his fingers, loaves maybe, and stops at three.',
              '“You taxed the market hard. The Saltroad paid it at the gate and took it back out of my flour.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He has never asked the throne for anything twice, Your Majesty. Don’t teach him how.',
              },
              'Three days of flour, Majesty. Then the ovens go cold. I don’t want speeches. I want flour, or a reason I can carry back down the stairs.',
            ],
          },
          {
            flags: ['tax-low'],
            lines: [
              'Foreman Dunmore Ash comes up from the kitchens with flour to the elbows. He does not bow. He counts on his fingers, loaves maybe, and stops at three.',
              '“Cheap market, cheap bread, you said. Bread’s cheap. There’s just none of it. And the Ledger’s box is still full of my cooks’ paper.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'He has never asked the throne for anything twice, Your Majesty. Don’t teach him how.',
              },
              'Three days of flour, Majesty. Then the ovens go cold. I don’t want speeches. I want flour, or a reason I can carry back down the stairs.',
            ],
          },
        ],
        lines: [
          'Foreman Dunmore Ash comes up from the kitchens with flour to the elbows. He does not bow. He counts on his fingers, loaves maybe, and stops at three.',
          '“Nobody’s fault. That’s the worst kind. Nobody to send the bill to.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'He has never asked the throne for anything twice, Your Majesty. Don’t teach him how.',
          },
          'Three days of flour, Majesty. Then the ovens go cold. I don’t want speeches. I want flour, or a reason I can carry back down the stairs.',
        ],
        options: [
          {
            id: 'ask-short',
            label: 'Make him explain why the flour ran short so fast.',
            effects: { local: { yard: -1 } },
            response:
              'Ash looks at Komodo, then at you. “You want it explained. Fine.” By supper the Yard knows the foreman had to ask twice.',
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
              'The foreman nods once. From him, that is a lot. The quartermaster who drove the flour cart counts every sack twice, then asks if the crown needs someone who can count.',
          },
          {
            id: 'ration',
            label: 'Ration the bread until the next caravan.',
            effects: { local: { yard: -3, 'old-houses': 1 } },
            response: 'The foreman says nothing. That is worse.',
          },
          {
            id: 'old-houses',
            label: 'Ask the Old Houses to open their private stores.',
            requires: { local: { 'old-houses': 12 } },
            effects: {
              local: { yard: 3, 'old-houses': -3 },
              recruitable: ['F008'],
            },
            response:
              'The Old Houses open their larders slowly, like people being robbed politely. Their quartermaster, still clutching a ration abacus, stays to ask about work.',
          },
        ],
        beats: [
          {
            id: 'short',
            lines: [
              '“The Saltroad doubled its price when the Pack doubled the toll. Somebody pays for that bridge. It was always going to be the bread.”',
              '“And the Old Houses’ granary is full. Forty sacks a cart at harvest. Lady Vask’s steward sleeps on them. Old Bellam. He has a cough. He won’t sell. Says he’s seen two bad winters and he’s not seeing a third.”',
              {
                who: 'A Gate Watch sergeant',
                text: 'Say the word, Majesty, and the Watch opens that granary. Just say whether we knock.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Force that granary and you have bread this week and enemies at every dinner for a year, Your Majesty. They lent this throne its first brass. They have not forgotten.',
              },
            ],
            options: [
              {
                id: 'seize',
                label:
                  'Order the Watch to take a tenth of the Old Houses’ granary.',
                effects: {
                  local: { yard: 3, 'old-houses': -3, ledger: -1 },
                  flags: ['d05-granary-seized'],
                },
                response:
                  'The Watch knocks. Old Bellam sits on the top sack and coughs while they count every tenth one out from under him. He does not get up. By nightfall the ovens are hot. Three noble families have stopped saying your name at table.',
              },
              {
                id: 'millers',
                label:
                  'Hollow Bell’s mill families owe the crown a levy. Take it in flour.',
                requires: { flags: ['mara-millers-levy'] },
                effects: {
                  local: { yard: 2, 'old-houses': -1 },
                  affinity: { 'hollow-bell': -5 },
                  flags: ['d05-millers-flour'],
                },
                response:
                  'The mill carts come up next morning. Every sack is stencilled LEVIED in red, so whoever eats the bread knows whose order baked it. Mara sends no letter. The millers send one each.',
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
                  'Ash nods once. The quartermaster who drove the flour cart counts every sack twice, glares at the price, and asks if the crown needs someone who can count.',
              },
              {
                id: 'ration',
                label: 'Ration the bread. Leave the granary closed.',
                effects: { local: { yard: -3, 'old-houses': 1 } },
                response:
                  'Ash goes down the stairs without a word. By supper the whole Yard knows how many sacks sit behind the Old Houses’ doors, and the name of the old man sleeping on them.',
              },
              {
                id: 'old-houses',
                label: 'Ask the Old Houses, politely, to open their stores.',
                requires: { local: { 'old-houses': 12 } },
                effects: {
                  local: { yard: 3, 'old-houses': -3 },
                  recruitable: ['F008'],
                },
                response:
                  'Lady Vask sends word to Bellam herself. He opens the granary and stands at the door the whole time, coughing, counting each sack out loud. Their quartermaster, still clutching a ration abacus, stays to ask about work.',
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
      'There is no ghost, Your Majesty. There is a latch. Send someone who notices things, and watch what they notice.',
    quests: ['q-d06-empty-stable'],
    audiences: [
      {
        id: 'd06-market-charter',
        title: 'A Charter for the Market',
        speaker: 'Factor Marisol Tallow of the Ledger',
        npc: 'marisol-tallow',
        faction: 'ledger',
        // t-035: the egg-seller speaks first; a posted Day 2 rate is read.
        variants: [
          {
            flags: ['tax-posted'],
            lines: [
              'A Freehold woman with a basket of eggs stands where the factor should be. Factor Marisol Tallow waits behind her, a scroll tied in Ledger green under her arm, second for once. She does not like it.',
              {
                who: 'An egg-seller from the Freeholds',
                text: '“Majesty. The factor has rules for the market. I came to hear them read to my face. Nobody reads them to us.”',
              },
              'You painted a rate on the gate, Majesty. Now the blankets can read it too, and they ask why the Ledger’s stalls pay it and theirs do not. Twelve stalls need rules. The Ledger would write them. For a small consideration, and a small seal at the bottom.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'She has already written them, Your Majesty. The question is whose name goes at the bottom, and what it costs.',
              },
              {
                who: 'An egg-seller from the Freeholds',
                text: '“And who.”',
              },
            ],
          },
        ],
        lines: [
          'A Freehold woman with a basket of eggs stands where the factor should be. Factor Marisol Tallow waits behind her, a scroll tied in Ledger green under her arm, second for once. She does not like it.',
          {
            who: 'An egg-seller from the Freeholds',
            text: '“Majesty. The factor has rules for the market. I came to hear them read to my face. Nobody reads them to us.”',
          },
          'The fortress market grew on its own, Majesty. Three stalls became twelve. Twelve stalls need rules, or the strongest stall makes them. The Ledger would write them. Fees, weights, who stands where. For a small consideration, and a small seal at the bottom.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'She has already written them, Your Majesty. The question is whose name goes at the bottom, and what it costs.',
          },
          {
            who: 'An egg-seller from the Freeholds',
            text: '“And who.”',
          },
        ],
        options: [
          {
            id: 'ask-stalls',
            label: 'Ask who keeps the twelve stalls now.',
            effects: {},
            response:
              'Tallow’s pen stops. “Who keeps them,” she repeats, weighing the coin.',
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
            response: 'The factor produces a charter. It is already drafted.',
          },
          {
            id: 'yard-first',
            label: 'Give the Yard first pick of every stall.',
            effects: { local: { yard: 3, ledger: -2 } },
            response: 'The factor writes that down too. Different ink.',
          },
          {
            id: 'archive-rules',
            label:
              'Have the Lamplight Archive write fair rules, posted on the gate.',
            requires: { local: { lamplight: 13 } },
            effects: { local: { lamplight: 2, ledger: 1, yard: 1 } },
            response: 'Nobody gets everything. The rules are long and fair.',
          },
        ],
        beats: [
          {
            id: 'stalls',
            lines: [
              '“Four belong to Ledger houses. Three to the Yard’s cousins. One sells Saltroad flour at a price I won’t repeat in front of the foreman.”',
              '“And four are Freehold women on blankets, selling eggs and thread. Came in with the refugees and stayed. They pay nothing. Under my charter they pay what everyone pays, and most of them go.”',
              '“I am not cruel, Majesty. I am consistent. The rules are the same for everyone. Including the people they hurt.”',
              {
                who: 'An egg-seller from the Freeholds',
                text: 'We’d pay in eggs, Majesty. Nobody ever asks us.',
              },
              {
                who: 'A Yard cousin with a stall',
                text: '“I pay. My mother paid. Her, she pays in eggs?” He is not angry. He is doing sums.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Exemptions breed, Your Majesty. Four blankets today, forty by spring. None of them paying.',
              },
            ],
            options: [
              {
                id: 'blankets',
                label:
                  'Grant the charter. The blanket stalls pay in kind, or not at all.',
                effects: {
                  brass: 5,
                  local: { ledger: 2, yard: -2 },
                  affinity: { freeholds: 5 },
                  flags: ['market-charter', 'd06-blanket-stalls'],
                },
                response:
                  'Tallow writes the exception small in the margin. The egg-seller leaves a basket on the dais step. Two eggs are still warm. That evening the Yard cousin packs up his stall and sets a blanket down beside theirs.',
              },
              {
                id: 'charter',
                label: 'Grant the charter as written. Same rules for everyone.',
                effects: {
                  brass: 10,
                  local: { ledger: 4, yard: -1 },
                  flags: ['market-charter'],
                },
                response:
                  'Tallow’s seal is already inked. By week’s end three of the blankets are gone. Nobody at court can say where.',
              },
              {
                id: 'yard-first',
                label:
                  'Give the Yard first pick of every stall, blankets and all.',
                effects: { local: { yard: 3, ledger: -2 } },
                response:
                  'Different ink again. The Yard’s cousins take the best pitches by noon. The egg-sellers move their blankets toward the midden.',
              },
              {
                id: 'archive-rules',
                label:
                  'Have the Lamplight Archive write fair rules, posted on the gate.',
                requires: { local: { lamplight: 13 } },
                effects: { local: { lamplight: 2, ledger: 1, yard: 1 } },
                response:
                  'The rules are long and fair. The Archive’s clerk reads every one aloud to the egg-sellers. Twice.',
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
          'A Gate Watch sergeant marches a boy up the carpet by the collar. A young stablehand in a worn apron, straw in his fur, trying not to cry in front of the throne.',
          '“Night stablehand, Majesty. Every mount gone, and him asleep in the hayloft. So he says. A gate opened from inside is a Watch matter. We want him in the stocks by noon.”',
          '“I didn’t open it,” the boy says. “I didn’t. I wasn’t even...” He stops. He looks at the floor.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Someone filed that latch, Your Majesty. Stableboys don’t own files. But the Watch needs to see a crown that answers a broken gate. Sometimes that is justice. Usually not.',
          },
          '“Wasn’t even where?” says the sergeant. “Tell the emperor where.”',
        ],
        options: [
          {
            id: 'ask-where',
            label:
              'Come down off the dais. Crouch. Ask the boy yourself, over the sergeant’s head.',
            effects: { local: { 'gate-watch': -1 } },
            response:
              'The sergeant lets go of the collar and steps back. He does not like being stepped over. The boy does not know what to do with his hands.',
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
              'The boy goes to the stocks at noon. The Yard brings him water all afternoon, in full view of the Watch. The latch stays filed. Whoever filed it sleeps fine.',
          },
          {
            id: 'pardon',
            label: 'Release him. The Watch can find the file, not a scapegoat.',
            effects: {
              local: { yard: 2, 'gate-watch': -2 },
              flags: ['d06-stablehand-pardoned'],
            },
            response:
              'The sergeant salutes with great precision. In the Watch that is an insult. The boy runs. Tomorrow the stables are cleaner than they have been in a year.',
          },
        ],
        beats: [
          {
            id: 'postern',
            lines: [
              '“At the postern, Majesty. The little gate by the midden. My sister’s in the camp outside the walls with the Freehold people. I take her the heel of the loaf when the kitchen’s done.”',
              '“I wasn’t at the stable gate. I swear on the bell. But I left the postern on the latch an hour every night this month. Anybody could’ve come in. Anybody.”',
              '“Every night this month,” the sergeant says. “Through a Watch gate. With bread from a kitchen down to three days of flour.” He does not say it cruelly. That is worse.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A boy who knows every gate the Watch forgot is useful, Your Majesty. Better he tells the throne who comes and goes.',
              },
            ],
            options: [
              {
                id: 'informant',
                label:
                  'Pardon him, if he reports everyone he sees at the postern.',
                effects: {
                  local: { 'gate-watch': 2, yard: -1 },
                  flags: ['d06-postern-informant'],
                },
                response:
                  'The boy agrees before you finish. He would have agreed to anything. Within a week the kitchen goes quiet when he walks in.',
              },
              {
                id: 'sister',
                label:
                  'Pardon him. Put his sister on the Yard’s ration roll, inside the walls.',
                requires: { cost: 10 },
                effects: {
                  local: { yard: 3, 'gate-watch': -1 },
                  affinity: { freeholds: 3 },
                  flags: ['d06-stablehand-sister'],
                },
                response:
                  'The sister comes through the main gate that evening, the Watch holding it open. She is younger than him. She has brought back yesterday’s heel of bread. She was saving it for him. Nobody thinks to latch the postern.',
              },
              {
                id: 'stocks',
                label: 'He left a Watch gate open for a month. The stocks.',
                effects: {
                  local: { 'gate-watch': 2, yard: -2 },
                  flags: ['d06-stablehand-stocks'],
                },
                response:
                  'He goes without arguing. That night nobody uses the postern. Outside the walls, somebody sleeps without bread.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 7,
    title: 'A Conclave Warning',
    whisper: {
      source: 'A Freehold reeve, waiting in the gatehouse',
      text: 'My gran sat out every dust storm in the old Mole galleries under the Ford. Nobody’s been down there in years, they tell me. Funny. The path to the old door is still worn smooth.',
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
        text: 'The old Mole tunnels under the Eastern Ford collapsed years ago. Empty.',
        truth: false,
        komodoLie: true,
        hindsight:
          'The galleries under the Ford were never empty. Forty Mole families slept in them. He wanted no party from the tower down there.',
      },
      {
        id: 'freehold-harvest',
        source: 'Freehold reeves',
        text: 'The Freehold harvest is still in the fields. A week until it is in.',
        truth: true,
      },
    ],
    komodo:
      'My own runner checked the Ford tunnels, Your Majesty. Don’t waste a party there. The storm is another matter. The Conclave never warns anyone for free.',
    quests: [],
    audiences: [
      {
        id: 'd07-crow-warning',
        title: 'A Conclave Warning',
        speaker: 'A Storm Crow envoy',
        faction: 'storm-crows',
        // t-035: the rain the crown bought, or the rain it fenced.
        variants: [
          {
            flags: ['crow-favor-owed'],
            lines: [
              'The Storm Crow envoy lands on the high windowsill and steps down into the hall like the floor is a poor branch. The fields below are still dark from the Conclave’s rain. He looks at them like a man checking a receipt.',
              'A dust storm is coming to the Eastern Ford, Your Majesty. Three days out. The Freeholds’ harvest is still standing.',
              'The Conclave has not named its favor yet. Do not mistake this for it. That much is a courtesy. The rest, the hour and the path, costs an errand. A parcel, carried to the Mirefen, by hands that are not ours.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The courtesy is the bait, Your Majesty. The question is what the hook is tied to.',
              },
            ],
          },
          {
            flags: ['d02-favor-no-persons'],
            lines: [
              'The Storm Crow envoy lands on the high windowsill and steps down into the hall like the floor is a poor branch. Forty-three dry days. The Conclave’s fenced rain is still two nights off, and he mentions it before you can.',
              'A dust storm is coming to the Eastern Ford, Your Majesty. Three days out. The Freeholds’ harvest is still standing.',
              'That much is a courtesy. The rest, the hour and the path, costs an errand. A parcel, carried to the Mirefen, by hands that are not ours.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The courtesy is the bait, Your Majesty. The question is what the hook is tied to.',
              },
            ],
          },
        ],
        lines: [
          'The Storm Crow envoy lands on the high windowsill and steps down into the hall like the floor is a poor branch. Rain beads on his feathers. It has not rained at the fortress in forty-three days.',
          'A dust storm is coming to the Eastern Ford, Your Majesty. Three days out. The Freeholds’ harvest is still standing.',
          'That much is a courtesy. The rest, the hour and the path, costs an errand. A parcel, carried to the Mirefen, by hands that are not ours.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The courtesy is the bait, Your Majesty. The question is what the hook is tied to.',
          },
        ],
        options: [
          {
            id: 'ask-hands',
            label:
              'Ask why the parcel must go in the crown’s hands, not a Conclave messenger’s.',
            effects: {},
            response:
              'One eye blinks, then the other. “Good question. The answer is also a parcel.”',
            next: 'hands',
          },
          {
            id: 'ask-shelter',
            label:
              'Ask where the Freeholders could shelter if the storm beats the harvest.',
            effects: {},
            response:
              'He turns to the east windows. The Ford is a brown thread on the horizon. “Under it. Traditionally.”',
            next: 'shelter',
          },
          {
            id: 'errand',
            label: 'Accept the errand. Carry the Conclave’s parcel.',
            effects: {
              schedule: ['d07-storm'],
              affinity: { freeholds: 5 },
              flags: ['crow-forecast-day10'],
              recruitable: ['F011'],
            },
            response:
              'A sealed parcel in oilcloth. Heavier than it looks. The Conclave runner who carried it up the mountain does not leave with the envoy.',
            postsQuests: ['q-d07-crow-favor'],
          },
          {
            id: 'pay',
            label: 'Pay for the forecast in brass instead.',
            requires: { cost: 25 },
            effects: {
              schedule: ['d07-storm'],
              affinity: { freeholds: 5, 'storm-crows': -3 },
              flags: ['crow-forecast-day10'],
            },
            response:
              'He takes the brass with open distaste. Brass is for people with no imagination.',
          },
          {
            id: 'warn-freeholds',
            label: 'Warn the Freeholds with what we know. Owe nothing.',
            effects: {
              schedule: ['d07-storm'],
              affinity: { freeholds: 3, 'storm-crows': -5 },
            },
            response:
              '“A third of a forecast is worse than none.” He may be right.',
          },
        ],
        beats: [
          {
            id: 'hands',
            lines: [
              '“The Mire Mothers take nothing from a Conclave envoy’s hand. An old quarrel, older than your tower. They will take it from yours. Your tower has not yet given them a reason to refuse.”',
              '“What is inside is between the Conclave and the coven. Not a weapon. Not a gift. A sentence that has waited a long time for its full stop.”',
              '“Both of us will remember who carried it. That is the real price. The brass is for those who prefer to be forgotten.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Carry it, Your Majesty. It was going to the fen anyway. Better we know which road it took.',
              },
            ],
            options: [
              {
                id: 'ask-count',
                label:
                  'Ask if the parcel has to do with the lanterns your escort counted the first night.',
                requires: { flags: ['mire-quiet-count'] },
                effects: {},
                response:
                  'For the first time the envoy looks at you like you might be worth a forecast.',
                next: 'count',
              },
              {
                id: 'errand',
                label: 'Carry it. Let both of them remember the crown.',
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { freeholds: 5 },
                  flags: ['crow-forecast-day10'],
                  recruitable: ['F011'],
                },
                response:
                  'The parcel is heavier than it looks. Once, when the hall is quiet, you are almost sure it ticks. The Conclave runner who carried it up the mountain watches it pass to your steward, and stays.',
                postsQuests: ['q-d07-crow-favor'],
              },
              {
                id: 'closed-road',
                label:
                  'The crown closed the Mirefen road once. It stays closed to crows.',
                requires: { flags: ['mire-road-closed'] },
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { 'storm-crows': -5 },
                  local: { 'gate-watch': 1 },
                  flags: ['d07-fen-road-stays-closed'],
                },
                response:
                  '“The Mothers watched forty-one lights go out on that road. So did the Conclave. We wondered which of you would mention it first.” He takes the parcel back to the windowsill, and the forecast with it.',
              },
              {
                id: 'pay',
                label: 'Pay for the forecast in brass. Carry nothing.',
                requires: { cost: 25 },
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { freeholds: 5, 'storm-crows': -3 },
                  flags: ['crow-forecast-day10'],
                },
                response:
                  'He takes the brass like it is damp. “Forgotten, then.”',
              },
            ],
          },
          {
            id: 'count',
            lines: [
              '“Forty-one lanterns on the Mirefen road that night. Thirty-eight walkers. Your escort counted well. The Conclave counted too, from higher up.”',
              '“Three lanterns walked with no one under them. The parcel is for the three. That is more than I should say.”',
              '“The Mothers know your escort counted. They have not decided what kind of crown counts its guests.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Keep the count, Your Majesty. Lists become useful at the end of things.',
              },
            ],
            options: [
              {
                id: 'return-count',
                label:
                  'Send the count to the Mothers, sealed, with the crown’s apology for taking it.',
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { 'mire-mothers': 10, 'storm-crows': -5 },
                  local: { lamplight: -2 },
                  flags: ['d07-count-returned'],
                },
                response:
                  'The Archive gives up its only copy like a funeral. Three days later a sprig of bog myrtle is tied to the fortress gate. The envoy takes the rest of his forecast home.',
              },
              {
                id: 'errand',
                label: 'Carry the parcel to the three. Keep the count.',
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { freeholds: 5 },
                  flags: ['crow-forecast-day10'],
                  recruitable: ['F011'],
                },
                response:
                  'The parcel goes north in oilcloth. The count stays under lock. The Conclave runner stays behind, watching the courier’s road.',
                postsQuests: ['q-d07-crow-favor'],
              },
              {
                id: 'warn-freeholds',
                label:
                  'Neither parcel nor count. Warn the Freeholds. Owe nothing.',
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { freeholds: 3, 'storm-crows': -5 },
                },
                response:
                  '“A third of a forecast and none of the answers. You will be a careful emperor.” Not kindly.',
              },
            ],
          },
          {
            id: 'shelter',
            lines: [
              '“Their grandparents rode out dust storms in the old Mole galleries under the Ford,” the envoy says. “Dry. Deep. Room for a village and its goats. The storm runs straight over them. Whatever is down there now will have company.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Collapsed, Your Majesty. Years ago.',
              },
              'The envoy had not finished. He turns his head to Young Komodo, who is looking at his ledger and tapping one claw on the page. Twice. Like a sum came out wrong.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'My runner went down himself. Rubble and rats. I would not send a family into that. Let alone a village.',
              },
              '“How thorough of him,” says the envoy. Nothing else.',
            ],
            options: [
              {
                id: 'shelter-fortress',
                label:
                  'Open the fortress to the Freeholders until the storm passes.',
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { freeholds: 10 },
                  local: { yard: -3, 'gate-watch': -1, 'old-houses': -1 },
                  flags: ['d07-freeholds-sheltered'],
                },
                response:
                  'They come up the road in a long line, goats and grandparents. The Yard gives up its own floor and sleeps in the kitchens, three days into short bread. Dunmore counts the extra mouths out loud. Young Komodo argues the price of everything. Not this.',
              },
              {
                id: 'errand',
                label:
                  'Carry the parcel for the full forecast. The harvest needs the hour, not a cellar.',
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { freeholds: 5 },
                  flags: ['crow-forecast-day10'],
                  recruitable: ['F011'],
                },
                response:
                  'The parcel in oilcloth, and the hour of the storm in a whisper. The Conclave runner who carried it up the mountain does not leave.',
                postsQuests: ['q-d07-crow-favor'],
              },
              {
                id: 'pay',
                label: 'Pay for the forecast in brass instead.',
                requires: { cost: 25 },
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { freeholds: 5, 'storm-crows': -3 },
                  flags: ['crow-forecast-day10'],
                },
                response:
                  'Open distaste. He leaves the hour of the storm written on a feather.',
              },
              {
                id: 'warn-freeholds',
                label:
                  'Tell the Freeholds what we know. They can find their own cellars.',
                effects: {
                  schedule: ['d07-storm'],
                  affinity: { freeholds: 3, 'storm-crows': -5 },
                },
                response:
                  '“A third of a forecast is worse than none.” Young Komodo has already turned the page.',
              },
              {
                id: 'galleries-anyway',
                label:
                  'Thank Komodo. Then send someone down the old galleries anyway, quietly.',
                effects: { schedule: ['d07-storm'] },
                response:
                  'Komodo does not look up from the ledger. His claw has stopped tapping. “Of course, Your Majesty. Take a lamp. Rats.”',
                postsQuests: ['q-d07-galleries'],
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
          'Lady Ottoline Vask comes up the carpet in a high-collared coat the color of wet ink. Heirloom rings click on her wingtips. Six of the Old Houses line the gallery rail like a jury.',
          'The Old Houses backed this throne when it was a heap of salvage, Majesty. Our brass bought your first walls. Our sons stand in your Watch.',
          'We want a seat on the council for it. One chair. We brought our own cushion.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: '“Lady Vask,” Komodo says, warm, before the herald can. Then, to you: “The chair costs nothing today, Your Majesty. The meetings cost.”',
          },
          '“Young Komodo,” says Lady Vask. “How kind of you to remember me.” She does not say from where.',
        ],
        options: [
          {
            id: 'ask-chair',
            label: 'Ask what the Old Houses would do with their chair.',
            effects: {},
            response:
              'She taps one ring on another. Once. “Sit in it. Initially.”',
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
            label: 'A seat, yes. And one for the Yard.',
            effects: {
              local: { 'old-houses': 1, yard: 3 },
              flags: ['open-council'],
            },
            response: '“How democratic.” She says it like a disease.',
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
              '“The Gate Watch swears its oath in three days. We would like it to name the Old Houses. Our sons swear it. They should swear it to someone who remembers their names.”',
              '“The Yard eats from our granaries. The Ledger lends against our land. The Archive copies our deeds. We don’t want power, Majesty. We want to be in the room where it is spent.”',
              {
                who: 'A Gate Watch recruit',
                text: '“My father wants the oath to say his name, Majesty. I’d rather it said mine.” He is maybe sixteen. His gorget is his father’s, and too big.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'They will be in that room either way, Your Majesty. Better to see which chair.',
              },
            ],
            options: [
              {
                id: 'seat-no-oath',
                label: 'A chair. The Watch swears to the crown alone.',
                effects: {
                  local: { 'old-houses': 2, 'gate-watch': 1, yard: -1 },
                  flags: ['old-houses-council-seat', 'd07-oath-kept-clean'],
                },
                response:
                  '“A chair, then. Chairs are patient.” Young Komodo writes the decree. He spells her name right the first time.',
              },
              {
                id: 'repay-granary',
                label:
                  'Repay the sacks the Watch took from their granary, instead of a chair.',
                requires: { cost: 20, flags: ['d05-granary-seized'] },
                effects: {
                  local: { 'old-houses': 3, yard: -1 },
                  flags: ['d07-granary-repaid'],
                },
                response:
                  'She takes the brass like a returned glove. “Restitution. How old-fashioned. We will still want the chair.” In the Yard the bread tastes the same. Everyone agrees it tastes worse.',
              },
              {
                id: 'seat',
                label: 'Give them the chair. Let the oath name them.',
                effects: {
                  local: { 'old-houses': 4, yard: -2 },
                  flags: ['old-houses-council-seat'],
                },
                response:
                  'Six fans open at once along the rail. The boy in his father’s gorget looks at the floor until he is dismissed.',
              },
              {
                id: 'seat-for-all',
                label:
                  'A chair for the Old Houses. One for the Yard beside it.',
                effects: {
                  local: { 'old-houses': 1, yard: 3 },
                  flags: ['open-council'],
                },
                response:
                  '“How democratic.” The Yard’s chair stays empty until Foreman Ash is fetched up from the kitchens. He looks at it a long time before he sits. Checking it for nails.',
              },
              {
                id: 'refuse',
                label:
                  'The council stays as it is. The oath names the crown, not the cushions.',
                effects: { local: { 'old-houses': -3 } },
                response:
                  'Lady Vask leaves with her cushion. Young Komodo watches her go longer than anyone else does.',
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
      'Forty empty beds is a lot for an orphanage that takes every child it finds, Your Majesty. I would ask where the children go. Not today. But I would ask.',
    quests: [],
    audiences: [
      {
        id: 'd08-family',
        title: 'A Family of Five',
        speaker: 'Wenna Coldbrook and Sister Marrow',
        npc: 'sister-marrow',
        faction: 'abbey',
        lines: [
          'Wenna Coldbrook stands at the foot of the dais, three children behind her, a baby on her hip. Their farm is ash. They still smell of it. The smallest keeps a fist knotted in the back of her mother’s skirt.',
          'Beside them, a novice in grey Abbey robes, smiling. A counting cord hangs from her belt, knotted at even intervals. Her fingers rest on it like a hand on a sleeping dog.',
          '“The Abbey would gladly take the little ones,” says Sister Marrow. “Warm beds. Lessons. Three meals, soup on feast days. Their mother may visit, of course. Once they are settled.”',
          '“Once they are settled,” Wenna repeats. Not a question. She wants to hear it out loud.',
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
              'Sister Marrow’s fingers stop on the cord. Wenna looks up. Nobody has asked her anything in a week.',
            next: 'wenna',
          },
          {
            id: 'ask-beds',
            label:
              'Ask Sister Marrow how many children the Abbey keeps, and how many beds.',
            effects: {},
            response: 'The smile widens. It has worked harder rooms than this.',
            next: 'beds',
          },
          {
            id: 'flint',
            label: 'Let Duchess Flint put a question to the Sister.',
            requires: { follower: 'F004' },
            effects: {},
            response:
              'Flint comes forward slowly. The hall waits for her. That is the point.',
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
              'Sister Marrow gathers the children with practiced hands. Wenna does not cry until the gate closes.',
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
              'Wenna holds the baby tight. Sister Marrow’s smile does not move. Then she is gone. A young Abbey novice stays and asks if the Yard needs a cook.',
          },
          {
            id: 'escort',
            label: 'Send an escort to see them settled in Hollow Bell.',
            effects: { affinity: { abbey: -3 }, recruitable: ['F012'] },
            response:
              '“Of course. The road is so dangerous for little ones.” Her novice, Brother Teodor, does not follow her out.',
            postsQuests: ['q-d08-escort-to-bell'],
          },
        ],
        beats: [
          {
            id: 'wenna',
            lines: [
              '“I want my farm back. My husband’s hands. The barn the way it was. I know. I know.”',
              '“I want them where I can see them. Not warm, not taught. Where I can see them. But I can’t feed four, Majesty. I can feed one, if I don’t eat.”',
              '“The Sisters came to the gatehouse before the Watch was up. They knew our names. I never told anybody our names.”',
              {
                who: 'Sister Marrow',
                npc: 'sister-marrow',
                text: '“The reeves send us word of every burned farm, child. It is how we find the ones who need us.” Kindly. Her fingers move one knot along the cord.',
              },
            ],
            options: [
              {
                id: 'yard',
                label:
                  'Keep them where she can see them. House the family in the Yard.',
                requires: { cost: 15 },
                effects: {
                  local: { yard: 2 },
                  affinity: { freeholds: 8, abbey: -3 },
                  flags: ['coldbrooks-in-yard'],
                  recruitable: ['F012'],
                },
                response:
                  'Wenna holds the baby so tight it squeaks. Sister Marrow is gone. A young Abbey novice stays behind, a soup ladle in his belt, and asks if the Yard needs a cook.',
              },
              {
                id: 'seed',
                label:
                  'Give Wenna seed, a cart and a season’s brass. Let her take them home.',
                requires: { cost: 20 },
                effects: {
                  affinity: { freeholds: 8, abbey: -5 },
                  flags: ['d08-coldbrooks-home'],
                },
                response:
                  'Wenna goes east at dawn with the cart and all four children, back toward the ash. The reeve swore the raider scouts were gone for the season. You will learn if he was right.',
              },
              {
                id: 'abbey',
                label: 'The Abbey can feed them. She cannot. Let them go.',
                effects: {
                  affinity: { abbey: 10, freeholds: 3 },
                  flags: ['abbey-took-coldbrook-children'],
                },
                response:
                  'One, two, three. A knot moves along the cord for each. Wenna keeps the baby. She does not cry until the gate closes.',
              },
            ],
          },
          {
            id: 'beds',
            lines: [
              '“Forty beds empty tonight, Majesty. Forty full. Children come to us and go on. To our sister houses in the south. To apprenticeships. To families who asked for them. The Abbey is a door, not a room.”',
              '“Their mother may visit. Once they are settled. Some children cry for a month. It is kinder not to reopen it.”',
              {
                who: 'Wenna Coldbrook',
                text: '“Which sister houses?” Nobody answers.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'You have a family in front of you, Your Majesty. The beds will still be there next season.',
              },
            ],
            options: [
              {
                id: 'visits',
                label:
                  'Let the Abbey take them, if the crown may visit those beds at any hour.',
                effects: {
                  affinity: { abbey: 5, freeholds: 3 },
                  flags: [
                    'abbey-took-coldbrook-children',
                    'd08-visits-promised',
                  ],
                },
                response:
                  '“Of course. At any hour.” She means it. That is the worst part. Wenna lets go of the smallest hand last.',
              },
              {
                id: 'escort',
                label:
                  'Neither Abbey nor Yard. Walk them to Hollow Bell, where someone keeps count.',
                effects: { affinity: { abbey: -3 }, recruitable: ['F012'] },
                response:
                  '“Of course. The road is so dangerous for little ones.” Brother Teodor, her novice, stays. He looks at the door she went through like a sum that will not come out.',
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
                  'Wenna holds the baby tight. Sister Marrow is gone. A young Abbey novice stays and asks if the Yard needs a cook.',
              },
              {
                id: 'abbey',
                label: 'Let the Abbey take the children in.',
                effects: {
                  affinity: { abbey: 10, freeholds: 3 },
                  flags: ['abbey-took-coldbrook-children'],
                },
                response:
                  'Wenna does not cry until the gate closes. Nobody ever tells her which sister house.',
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
              '“All of them are where they should be.” The smile holds. Her fingers have stopped on the cord. They stay stopped.',
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: '“Neither is that.” Flint turns to the throne. “I have nothing against warm beds, Majesty. I have something against answers shaped like a number that are not one.”',
              },
            ],
            options: [
              {
                id: 'recorded',
                label:
                  'Let the Abbey take them. First Flint writes each child’s name, age and marks in the court’s book.',
                effects: {
                  affinity: { abbey: 3, freeholds: 3 },
                  local: { lamplight: 2 },
                  flags: [
                    'abbey-took-coldbrook-children',
                    'd08-coldbrooks-recorded',
                  ],
                },
                response:
                  'Three names. Three ages. A burn scar on a wrist, a missing tooth, a habit of humming. Sister Marrow watches the pen the whole time.',
              },
              {
                id: 'yard',
                label:
                  'Keep the family together in the Yard. Flint’s question can wait.',
                requires: { cost: 15 },
                effects: {
                  local: { yard: 2 },
                  affinity: { freeholds: 8, abbey: -3 },
                  flags: ['coldbrooks-in-yard'],
                  recruitable: ['F012'],
                },
                response:
                  'Sister Marrow bows to Flint as deep as to you, and leaves. Her novice, a young cook, stays and asks Flint if she wants the number. She says yes. He says he will have to count.',
              },
              {
                id: 'escort',
                label: 'Send an escort to see them settled in Hollow Bell.',
                effects: { affinity: { abbey: -3 }, recruitable: ['F012'] },
                response:
                  '“Of course. The road is so dangerous for little ones.” Her novice, Brother Teodor, does not follow her out.',
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
          'Factor Tallow returns with a smaller book. Green leather, with a lock. She sets it on the arm of the throne like it lives there. A Gate Watch sergeant stands beside the book the way you stand beside a man you have been told not to search.',
          'The Ledger would extend the crown a line of credit, Majesty. Forty brass now. A little more later.',
          'Lending is a kindness. Repayment is a habit. We hope to help the crown form good habits.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: '“A little more later” is the most expensive phrase in the wasteland, Your Majesty. Ask how little. And how much later.',
          },
          {
            who: 'A Gate Watch sergeant',
            text: '“Ask her about the carts, Majesty.”',
          },
        ],
        options: [
          {
            id: 'ask-terms',
            label: 'Ask what “a little more later” means, in numbers.',
            effects: {},
            response:
              'Tallow unlocks the book with a key on a ribbon and turns it round for you.',
            next: 'terms',
          },
          {
            id: 'accept',
            label: 'Take the forty brass.',
            effects: {
              brass: 40,
              local: { ledger: 2, 'gate-watch': -1 },
              flags: ['ledger-credit'],
              schedule: ['ledger-loan'],
            },
            response:
              'The factor writes the debt in a small, permanent hand. The sergeant reads the last line upside down: the Watch does not search Ledger carts. He leaves without being dismissed.',
          },
          {
            id: 'decline',
            label: 'Decline. The crown pays its own way.',
            effects: { local: { ledger: -1, lamplight: 1 } },
            response: 'The factor closes her book. “Another time.”',
          },
        ],
        beats: [
          {
            id: 'terms',
            lines: [
              '“Forty now. Fifty at season’s end. Until it is paid, the Ledger stands first at the market gate, before the Yard and the Old Houses. And the Watch does not search Ledger carts.”',
              '“A formality. We are honest people. We would rather not be treated as the other kind.”',
              {
                who: 'A Gate Watch sergeant',
                text: 'A cart the Watch can’t search, Majesty, is a cart anything can ride in.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The crown is short, Your Majesty. The Ledger is not. Debts only hurt people who mean to default.',
              },
            ],
            options: [
              {
                id: 'surety',
                label:
                  'Take the forty. Pledge the stall fees as surety. The Watch still searches carts.',
                requires: { flags: ['market-charter'] },
                effects: {
                  brass: 30,
                  local: { ledger: 1, yard: -1 },
                  flags: ['ledger-credit', 'd08-fees-pledged'],
                  schedule: ['ledger-loan'],
                },
                response:
                  'Tallow sees her own charter offered back as collateral and smiles for the first time today. “You read it. Nobody reads it.” By evening the stall fees belong to the Ledger.',
              },
              {
                id: 'accept',
                label: 'Take the forty brass, on her terms.',
                effects: {
                  brass: 40,
                  local: { ledger: 2, 'gate-watch': -1 },
                  flags: ['ledger-credit'],
                  schedule: ['ledger-loan'],
                },
                response:
                  'Small, permanent hand. That evening the gate sergeant watches the first unsearched Ledger cart roll through. He makes a note of his own.',
              },
              {
                id: 'decline',
                label: 'Decline. The crown pays its own way, however slowly.',
                effects: { local: { ledger: -1, lamplight: 1 } },
                response:
                  'She locks the book. “Another time.” She has already written down which.',
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
        id: 'iron-cursed',
        source: 'A Saltroad fortune-teller',
        text: 'The iron was dug from a grave. Whoever guards it dies within the year.',
        truth: false,
      },
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
    ],
    komodo:
      'This posting carries a mark, Your Majesty: lethal. It means what it says. Most quests cost a sprain and a week in bed. This one can cost a friend. And the canyon road is two days. Whoever you send tonight will not be home tomorrow.',
    // t-035: the Day 9-10 squeeze, said out loud the day before it bites.
    whisper: {
      source: 'A Thistledown carter, watering his pony at the gate',
      text: 'Painted wagons on the Freehold road at dusk. Going east. Not toward the canyon.',
    },
    quests: ['q-d09-iron-convoy'],
    audiences: [
      {
        id: 'd09-convoy',
        title: 'Iron on the Road',
        speaker: 'Oriel Saltmarsh, caravan master',
        npc: 'oriel-saltmarsh',
        faction: 'saltroad',
        lines: [
          'Oriel Saltmarsh fills the doorway in her caravan coat. Axle grease and the sea. Goggles pushed up, a ledger in her pouch. She does not walk the carpet. She inspects it for load-bearing.',
          'Nine wagons of old-world iron and a canyon full of people who want it. My drivers go tonight, escort or not. The iron is their wages.',
          'Your advisor will have told you what the red mark on the posting means. If you won’t risk your own, there are other swords for hire.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Some who go may not come back, Your Majesty. Not probably. Possibly. That is the whole difference, and it is enough.',
          },
        ],
        options: [
          {
            id: 'ask-bands',
            label: 'Ask who the three bands above the canyon are.',
            effects: {},
            response:
              'Oriel pulls her goggles down. She does that when she would rather nobody saw her eyes.',
            next: 'bands',
          },
          {
            id: 'our-own',
            label: 'Our own will go. Check the board.',
            effects: { affinity: { saltroad: 3 } },
            response:
              'Oriel nods. “Then I’ll tell my drivers to sleep a little.”',
          },
          {
            id: 'hire-pack',
            label:
              'Hire the Jackalwire to ride alongside. Ours still have to go.',
            requires: {
              cost: 25,
              affinity: { jackalwire: 'neutral' },
            },
            effects: {
              affinity: { saltroad: 5, jackalwire: 5 },
              flags: ['pack-guarded-iron'],
              questAid: [
                {
                  questId: 'q-d09-iron-convoy',
                  label: 'Jackalwire outriders',
                  bonus: 2,
                  stat: 'might',
                },
              ],
            },
            response:
              'A long look. “Wolves beside the sheep. Bold.” The posting stays on the board. The Pack rides with whoever you send, not instead.',
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
              '“Two are raiders. Painted wagons, no colors I know. They leave nothing behind but wheel ruts.”',
              '“The third is Freeholders. Hill farmers from above Thistledown. Wells went dry in the summer. Pitchforks, old crossbows, children who haven’t eaten right since spring. They won’t stop a convoy. They’ll die trying.”',
              '“Your people would be guarding my iron against them. Know that before you send anyone. I’d rather you hated me now than later.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Starving farmers with crossbows kill people too, Your Majesty. A quarrel in the dark does not care who is hungry.',
              },
            ],
            options: [
              {
                id: 'farmers-fed',
                label:
                  'Send the hill farmers a cart of the Yard’s own grain tonight, ahead of the convoy.',
                effects: {
                  affinity: { freeholds: 10 },
                  local: { yard: -3 },
                  flags: ['d09-farmers-fed'],
                  questAid: [
                    {
                      questId: 'q-d09-iron-convoy',
                      label: 'One campfire fewer on the hill',
                      bonus: 1,
                    },
                  ],
                },
                response:
                  'The cart goes up the hill road at sunset under a flour-sack flag. Dunmore watches it go from the kitchen door, counting on his fingers. Above the canyon that night, one of the three campfires goes out early.',
              },
              {
                id: 'leave-wagon',
                label:
                  'Tell Oriel to leave one wagon of iron at the canyon mouth for the farmers.',
                effects: {
                  affinity: { saltroad: -5, freeholds: 8 },
                  local: { ledger: -1 },
                  flags: ['d09-wagon-left'],
                  questAid: [
                    {
                      questId: 'q-d09-iron-convoy',
                      label: 'The hill farmers took their wagon home',
                      bonus: 1,
                    },
                  ],
                },
                response:
                  '“One wagon. A ninth of my drivers’ wages, given away by someone who won’t be paying it.” By morning the hill farmers are gone from their perch. So is one wagon.',
              },
              {
                id: 'vane-debt',
                label:
                  'Tell Gristle Vane the crown bought his pups’ tincture. Tonight the debt is called.',
                requires: {
                  flags: ['pack-medicine'],
                  notFlags: ['d05-vane-threatened'],
                },
                effects: {
                  affinity: { saltroad: 5, jackalwire: -5 },
                  flags: ['pack-guarded-iron', 'd09-vane-debt-called'],
                  questAid: [
                    {
                      questId: 'q-d09-iron-convoy',
                      label: 'Vane’s painted wagons',
                      bonus: 3,
                      stat: 'might',
                    },
                  ],
                },
                response:
                  'A pup on a painted bicycle brings the answer: one feather, and PAID IN FULL, misspelled. Tonight painted wagons will flank whoever rides with Oriel. The hill farmers know those wagons. Most of them will stay on their hill.',
              },
              {
                id: 'our-own',
                label: 'Our own will go. They will know who is on the hill.',
                effects: { affinity: { saltroad: 3 } },
                response:
                  'Oriel pushes her goggles up. “I’ll tell my drivers to sleep a little. Tell yours not to.”',
              },
              {
                id: 'hire-pack',
                label:
                  'Hire the Pack to ride beside ours. Raiders scare farmers better than soldiers.',
                requires: {
                  cost: 25,
                  affinity: { jackalwire: 'neutral' },
                },
                effects: {
                  affinity: { saltroad: 5, jackalwire: 5 },
                  flags: ['pack-guarded-iron'],
                  questAid: [
                    {
                      questId: 'q-d09-iron-convoy',
                      label: 'Jackalwire outriders',
                      bonus: 2,
                      stat: 'might',
                    },
                  ],
                },
                response:
                  '“Wolves to scare the sheep off the other wolves. Bold.” The posting stays on the board. Somebody of yours still has to ride.',
              },
              {
                id: 'not-ours',
                label:
                  'Spare no one for a fight the crown would be ashamed to win.',
                effects: { affinity: { saltroad: -3 } },
                response:
                  'The goggles come up. “Then pray for my drivers. And for the hill. Somebody should.”',
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
          'Juniper Slate comes up from the kitchens smelling of onions and carbolic, a ladle through their belt like a sword and a roll of bandage in their apron. They walk straight past the herald. The herald has stopped trying.',
          'The Yard is behind the throne, Majesty. That means the kitchens. That means me. I want to see what the court eats on the road.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Every court has a kitchen that knows more than its council, Your Majesty. The wise ones feed it.',
          },
          'I cook. I bandage. I can tell you what the Yard says when you’re not listening. Nobody pays for that one. It’s the most useful.',
        ],
        options: [
          {
            id: 'ask-yard',
            label: 'Ask what the Yard says when the throne is not listening.',
            effects: {},
            response:
              'Juniper pulls up a stool nobody offered. “How long have you got?”',
            next: 'gossip',
          },
          {
            id: 'welcome',
            label: 'Bring Juniper into the barracks.',
            requires: { cost: 5 },
            effects: { recruit: ['F020'], local: { yard: 1 } },
            response:
              'Juniper salutes with a wooden spoon and starts on the barracks pantry.',
          },
          {
            id: 'kitchens',
            label: 'The kitchens need you more than the road does.',
            effects: { local: { yard: 1 }, recruitable: ['F020'] },
            response: '“Fair. Ask again when the soup’s better.”',
          },
        ],
        beats: [
          {
            id: 'gossip',
            lines: [
              '“They say tonight’s convoy is the first time the crown sent people where people die. They say it like first frost. Not angry. Counting days to the next one.”',
              '“They say the Old Houses eat white bread, the Watch eats brown, the Yard eats what’s left in the sack. They say you’re better than the last one. They say that isn’t hard.”',
              '“And they say if I go on the road, the kitchens burn the porridge for a month. They’re right.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'Take them, and the throne loses a mouth that tells it the truth. Leave them, and the Yard loses a reason to think you were listening.',
              },
            ],
            options: [
              {
                id: 'welcome',
                label:
                  'Come tell the barracks what the Yard says. Bring the ladle.',
                requires: { cost: 5 },
                effects: { recruit: ['F020'], local: { yard: 1 } },
                response:
                  'Juniper salutes with the ladle. Next morning the porridge burns. The Yard forgives it. It burned for the crown.',
              },
              {
                id: 'listen',
                label:
                  'Stay in the kitchens. Come up each morning with what the Yard said overnight.',
                effects: {
                  local: { yard: 2, 'old-houses': -1 },
                  flags: ['d09-kitchen-ear'],
                },
                response:
                  '“A spy with a soup pot. I’ve been called worse, by better.” Every morning after, a bowl of broth on the arm of the throne, a folded note under it. The Old Houses do not like how much the throne knows about bread.',
              },
              {
                id: 'kitchens',
                label: 'The kitchens need you more than the road does.',
                effects: { local: { yard: 1 }, recruitable: ['F020'] },
                response:
                  'Juniper carries the stool back down. “Ask again when the soup’s better.”',
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
        variants: [
          {
            flags: ['d10-harvest-lost'],
            text: 'Jackalwire raiders are at the edge of Thistledown. The storm took the Freehold fields at dawn. Its granary is what is left.',
          },
        ],
      },
      {
        id: 'watch-oath',
        source: 'Captain Ferro Dunmark',
        text: 'The Gate Watch swears its oath to the crown at noon.',
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
      'Something always moves in the east, Your Majesty. The crows have watched it for a week. Today belongs to the Watch, and to Thistledown. Whatever happens at that village is on the map tomorrow.',
    // t-035: the crown checked his Day 7 report. He gets ahead of it.
    komodoVariants: [
      {
        flags: ['d07-galleries-found'],
        text: 'Your people came back from under the Ford with clean boots, Your Majesty. Dry galleries. I was wrong, and my runner will hear about it. Today belongs to the Watch, and to Thistledown. Whatever happens at that village is on the map tomorrow.',
      },
    ],
    quests: ['q-d10-freehold-raid'],
    audiences: [
      {
        id: 'd10-oath',
        title: 'Oath of the Gate',
        speaker: 'Captain Ferro Dunmark of the Gate Watch',
        npc: 'ferro-dunmark',
        faction: 'gate-watch',
        lines: [
          'Noon. The whole Gate Watch stands in the parade yard below the balcony. Sixty, in dented gorgets and patched tabards. The young ones too straight. The old ones leaning on their spears. East, past the walls, a thin line of smoke stands up where Thistledown should be.',
          'Captain Ferro Dunmark climbs to the balcony alone. Broad grey wolf, scarred muzzle, one torn ear. He salutes the way a door closes.',
          'The Watch is ready to swear, Majesty. They want to know what you swear back.',
          'Soldiers will die for a crown. They would rather know it won’t spend them like brass.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Every guardroom will repeat what you say here for as long as you wear the crown, Your Majesty. Choose words you can afford.',
          },
        ],
        options: [
          {
            id: 'ask-last-oath',
            label: 'Ask Dunmark what the last emperor swore to them.',
            effects: {},
            response:
              'The torn ear flicks once. “I wondered if you would ask. He didn’t.”',
            next: 'last-oath',
          },
          {
            id: 'ask-ranks',
            label:
              'Ask the Watch itself, not its captain, what it wants sworn.',
            effects: {},
            response:
              'Dunmark steps aside. You lean over the rail. Sixty faces turn up. Nobody in the yard knows what to do with an emperor who asks.',
            next: 'ranks',
          },
          {
            id: 'care',
            label: '“I will never spend you cheaply.”',
            effects: {
              local: { 'gate-watch': 5, 'old-houses': -1 },
              flags: ['oath-of-care'],
              recruitable: ['F013'],
              schedule: ['d10-oath-tested'],
            },
            response:
              'A long look. A nod. “They’ll hold you to that. So will I.” A towering recruit at the end of the line asks to serve the crown closer than the gate.',
          },
          {
            id: 'crown',
            label: '“You belong to the crown, before all else.”',
            effects: {
              local: { 'gate-watch': 2, 'old-houses': 3, yard: -2 },
              flags: ['oath-of-crown'],
            },
            response: 'The Watch swears. Loud and correct. Nobody smiles.',
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
            // t-035: Day 7's chair is in the gallery when the Watch swears.
            variants: [
              {
                flags: ['old-houses-council-seat'],
                notFlags: ['d07-oath-kept-clean'],
                lines: [
                  '“He swore he would never spend us cheaply. Those words. Then he sent sixty of us down the rail canyon for an engine in the old yards, because somebody told him it could make rain.”',
                  '“Nineteen came back. I was one. The engine never made rain. Far as I know it’s still in the canyon. Nobody went back for it. Nobody went back for the rest of us either.”',
                  '“So the Watch doesn’t want a kind oath. It had one. It wants one you can keep on a bad day, with smoke on the horizon and a good reason to break it.”',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'Then swear them to the crown, Your Majesty, not to yourself. A crown can break a promise and still be a crown. A person who breaks one is a liar.',
                  },
                  {
                    who: 'Lady Ottoline Vask',
                    npc: 'ottoline-vask',
                    text: '“You gave us a chair, Majesty,” Lady Vask says from the gallery. “Give our sons a name to swear to. Ours.”',
                  },
                ],
              },
              {
                flags: ['d07-oath-kept-clean'],
                lines: [
                  '“He swore he would never spend us cheaply. Those words. Then he sent sixty of us down the rail canyon for an engine in the old yards, because somebody told him it could make rain.”',
                  '“Nineteen came back. I was one. The engine never made rain. Far as I know it’s still in the canyon. Nobody went back for it. Nobody went back for the rest of us either.”',
                  '“So the Watch doesn’t want a kind oath. It had one. It wants one you can keep on a bad day, with smoke on the horizon and a good reason to break it.”',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'Then swear them to the crown, Your Majesty, not to yourself. A crown can break a promise and still be a crown. A person who breaks one is a liar.',
                  },
                  {
                    who: 'Lady Ottoline Vask',
                    npc: 'ottoline-vask',
                    text: '“You told me the Watch swears to the crown alone, Majesty,” Lady Vask says from the gallery. “Let us see you keep that one.”',
                  },
                ],
              },
            ],
            lines: [
              '“He swore he would never spend us cheaply. Those words. Then he sent sixty of us down the rail canyon for an engine in the old yards, because somebody told him it could make rain.”',
              '“Nineteen came back. I was one. The engine never made rain. Far as I know it’s still in the canyon. Nobody went back for it. Nobody went back for the rest of us either.”',
              '“So the Watch doesn’t want a kind oath. It had one. It wants one you can keep on a bad day, with smoke on the horizon and a good reason to break it.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Then swear them to the crown, Your Majesty, not to yourself. A crown can break a promise and still be a crown. A person who breaks one is a liar.',
              },
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: '“The Old Houses’ sons stand in that yard, Majesty,” Lady Vask says from the gallery. “Let them swear to something that outlasts any one of us.”',
              },
            ],
            options: [
              {
                id: 'reasons',
                label:
                  '“I will spend you. Never in the dark. Every order has its reason. Every name is read aloud after.”',
                effects: {
                  local: { 'gate-watch': 3, lamplight: 2, 'old-houses': -2 },
                  flags: ['d10-oath-of-reasons'],
                },
                response:
                  'Dunmark is silent until the yard murmurs. Then he gives it to them word for word, and sixty voices give it back. Low, after: “That one you’ll hate keeping. Good.”',
              },
              {
                id: 'care',
                label:
                  '“I will never spend you cheaply.” His words. Mean them.',
                effects: {
                  local: { 'gate-watch': 5, 'old-houses': -1 },
                  flags: ['oath-of-care'],
                  recruitable: ['F013'],
                  schedule: ['d10-oath-tested'],
                },
                response:
                  '“He said it in that same voice. They’ll hold you to it. So will I.” A towering recruit at the end of the line, taller than the gate, asks to serve the crown closer than the walls.',
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
                  'Loud and correct. Nobody smiles. In the gallery Lady Vask nods like a bill has been paid. Young Komodo writes the words down exactly.',
              },
              {
                id: 'bonus',
                label:
                  'He has heard enough words. Pay every sworn guard a bonus.',
                requires: { cost: 30 },
                effects: {
                  local: { 'gate-watch': 6, ledger: -1 },
                  recruitable: ['F013'],
                },
                response:
                  'The cheer is real. Dunmark does not cheer. “Brass is at least honest about what it is.”',
              },
              {
                id: 'name-houses',
                label:
                  '“The Watch swears to the crown, and to the Houses that fed it.”',
                requires: {
                  flags: ['old-houses-council-seat'],
                  notFlags: ['d07-oath-kept-clean'],
                },
                effects: {
                  local: { 'old-houses': 4, 'gate-watch': -2, yard: -2 },
                  flags: ['d10-oath-names-houses'],
                },
                response:
                  'The young ones say it. The old ones move their lips. The boy in his father’s gorget says the Houses’ name and looks at the floor after. Dunmark writes nothing down. He will remember it without paper.',
              },
            ],
          },
          {
            id: 'ranks',
            // t-035: the stableboy from Day 6 is in the yard.
            variants: [
              {
                flags: ['d06-stablehand-sister'],
                lines: [
                  {
                    who: 'A young sentry',
                    text: '“Will you send us to Thistledown today, Majesty?” The sentry who found the stable latch. Barely old enough for the gorget. “My mother’s there. A lot of our mothers are there.”',
                  },
                  {
                    who: 'An old guard with a grey muzzle',
                    text: '“And who holds this gate? Last time the Watch rode out it came back a third its size, and kitchen boys held the gate.”',
                  },
                  '“That’s the oath they want,” Dunmark says. “Not words. Thistledown or the gate. Whatever you choose, half of them swear it with their teeth shut.” Below, the stableboy runs the line with a water bucket. Nobody told him to.',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'Thistledown is already on the board, Your Majesty. Keep the Watch on the walls. An oath sworn on the road is sworn by whoever survives it.',
                  },
                ],
              },
              {
                flags: ['d06-postern-informant'],
                lines: [
                  {
                    who: 'A young sentry',
                    text: '“Will you send us to Thistledown today, Majesty?” The sentry who found the stable latch. Barely old enough for the gorget. “My mother’s there. A lot of our mothers are there.”',
                  },
                  {
                    who: 'An old guard with a grey muzzle',
                    text: '“And who holds this gate? Last time the Watch rode out it came back a third its size, and kitchen boys held the gate.”',
                  },
                  '“That’s the oath they want,” Dunmark says. “Not words. Thistledown or the gate. Whatever you choose, half of them swear it with their teeth shut.” The stableboy stands at the end of the line with his eyes on the postern. The sentries leave a space around him.',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'Thistledown is already on the board, Your Majesty. Keep the Watch on the walls. An oath sworn on the road is sworn by whoever survives it.',
                  },
                ],
              },
              {
                flags: ['d06-stablehand-stocks'],
                lines: [
                  {
                    who: 'A young sentry',
                    text: '“Will you send us to Thistledown today, Majesty?” The sentry who found the stable latch. Barely old enough for the gorget. “My mother’s there. A lot of our mothers are there.”',
                  },
                  {
                    who: 'An old guard with a grey muzzle',
                    text: '“And who holds this gate? Last time the Watch rode out it came back a third its size, and kitchen boys held the gate.”',
                  },
                  '“That’s the oath they want,” Dunmark says. “Not words. Thistledown or the gate. Whatever you choose, half of them swear it with their teeth shut.” The stableboy is on the wall with a spear too long for him. He has not looked up at the balcony since the stocks.',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'Thistledown is already on the board, Your Majesty. Keep the Watch on the walls. An oath sworn on the road is sworn by whoever survives it.',
                  },
                ],
              },
              {
                flags: ['d06-stablehand-pardoned'],
                lines: [
                  {
                    who: 'A young sentry',
                    text: '“Will you send us to Thistledown today, Majesty?” The sentry who found the stable latch. Barely old enough for the gorget. “My mother’s there. A lot of our mothers are there.”',
                  },
                  {
                    who: 'An old guard with a grey muzzle',
                    text: '“And who holds this gate? Last time the Watch rode out it came back a third its size, and kitchen boys held the gate.”',
                  },
                  '“That’s the oath they want,” Dunmark says. “Not words. Thistledown or the gate. Whatever you choose, half of them swear it with their teeth shut.” Below, the stableboy runs the line with a water bucket. Nobody told him to.',
                  {
                    who: 'Young Komodo',
                    npc: 'young-komodo',
                    text: 'Thistledown is already on the board, Your Majesty. Keep the Watch on the walls. An oath sworn on the road is sworn by whoever survives it.',
                  },
                ],
              },
            ],
            lines: [
              {
                who: 'A young sentry',
                text: '“Will you send us to Thistledown today, Majesty?” The sentry who found the stable latch. Barely old enough for the gorget. “My mother’s there. A lot of our mothers are there.”',
              },
              {
                who: 'An old guard with a grey muzzle',
                text: '“And who holds this gate? Last time the Watch rode out it came back a third its size, and kitchen boys held the gate.”',
              },
              '“That’s the oath they want,” Dunmark says. “Not words. Thistledown or the gate. Whatever you choose, half of them swear it with their teeth shut.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Thistledown is already on the board, Your Majesty. Keep the Watch on the walls. An oath sworn on the road is sworn by whoever survives it.',
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
                  questAid: [
                    {
                      questId: 'q-d10-freehold-raid',
                      label: 'The Gate Watch rode out',
                      bonus: 3,
                      stat: 'might',
                      resolve: 'partial',
                      outcome:
                        'The Gate Watch went for Thistledown with nobody from the court beside them. They held the granary door until the raiders tired of it. Thistledown lost its stores and kept its roofs. The Watch came home a dozen short of whole.',
                    },
                  ],
                  schedule: [
                    'd10-postern-night',
                    'd10-postern-cart',
                    'd10-postern-seen',
                    'd10-postern-shut',
                  ],
                },
                response:
                  'They swear it at a run, buckling gorgets, the young sentry loudest. Sixty voices. Fifty-nine. Tonight the old guard with the grey muzzle and the kitchen boys hold the gate. The Old Houses bolt their doors.',
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
                  'The Watch swears to the gate, and holds it. The smoke stands up all afternoon. Nobody on the wall says the village’s name. At dusk the young sentry asks to be relieved. Dunmark lets him go, and does not ask where.',
              },
              {
                id: 'care',
                label:
                  '“I will never spend you cheaply.” Let them decide what cheap means today.',
                effects: {
                  local: { 'gate-watch': 5, 'old-houses': -1 },
                  flags: ['oath-of-care'],
                  recruitable: ['F013'],
                  schedule: ['d10-oath-tested'],
                },
                response:
                  'Quiet while they work out if that was an answer. Then the old guard laughs, once, and swears. The rest follow. A towering recruit at the end of the line asks to serve closer than the gate.',
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
        // t-035: the Day 7 storm landed this morning.
        variants: [
          {
            flags: ['crow-forecast-day10'],
            lines: [
              'The rider from Thistledown is standing only because nobody has told her she can stop. A young stoat, soot in her fur, a broken pitchfork tine through her belt for a knife. Her pony stands foundered in the courtyard.',
              '“Painted wagons at the edge of Thistledown. Forty raiders. Maybe fifty. The crows gave us the storm’s hour and we got the harvest in. Now it’s all in one granary, and they know which one. They’ll be back at dusk.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The posting is already on the board, Your Majesty. She is asking what Thistledown is worth to a crown it never paid.',
              },
              '“We’re not your village. We never paid your tax. My grandmother spat when your crown was named. I’m asking anyway.”',
            ],
          },
        ],
        lines: [
          'The rider from Thistledown is standing only because nobody has told her she can stop. A young stoat, soot in her fur, a broken pitchfork tine through her belt for a knife. Her pony stands foundered in the courtyard.',
          '“Painted wagons at the edge of Thistledown. Forty raiders. Maybe fifty. The storm took the fields at dawn. They came at noon for the granary. It’s what the Ford has left. They’ll be back at dusk for the rest.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The posting is already on the board, Your Majesty. She is asking what Thistledown is worth to a crown it never paid.',
          },
          '“We’re not your village. We never paid your tax. My grandmother spat when your crown was named. I’m asking anyway.”',
        ],
        options: [
          {
            id: 'ask-colors',
            label: 'Ask whose colors the wagons fly.',
            effects: {},
            response: 'She has to think. That tells you how close she was.',
            next: 'colors',
          },
          {
            id: 'rook',
            label: 'Let Rook Bramble look at the soot on her boots.',
            requires: { follower: 'F001' },
            effects: {},
            response:
              'Rook kneels at her feet before you finish. She is too tired to ask why.',
            next: 'rook',
          },
          {
            id: 'promise',
            label: 'Promise her every hand the board can field.',
            effects: {
              affinity: { freeholds: 5 },
              local: { 'old-houses': -1 },
              flags: ['d10-thistledown-promised'],
              schedule: ['d10-promise'],
            },
            response:
              'She nods. No thanks. Nobody has arrived yet. She goes down to wait by the board, where she can see who signs.',
          },
          {
            id: 'bargain',
            label:
              'Tell Thistledown to pay the raiders what the Freeholds always paid, and live.',
            effects: {
              affinity: { freeholds: -10, jackalwire: 5 },
              local: { ledger: 1, 'old-houses': 1 },
              flags: ['d10-thistledown-told-to-pay'],
            },
            response:
              '“Pay them. With what? They’re already taking it.” She leads the pony out, the tine still in her belt. By the time she reaches the horizon the smoke is wider.',
          },
        ],
        beats: [
          {
            id: 'colors',
            lines: [
              '“Not Vane’s. Or not only. Painted jaws, red wheels, a fiddle on the lead wagon. A captain who laughs.”',
              '“They shout that the crown has the bridge now, and the toll, and the carts, so the Pack needs a new road to eat from. They shout that it’s your fault.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'She is not wrong, Your Majesty. Every cart the crown kept safe this week is one the Pack did not eat. Hunger went east. The Freeholds must learn to pay their own way. The crown cannot be every village’s wall.',
              },
            ],
            options: [
              {
                id: 'strike-camp',
                label:
                  'Send the Watch at the Pack’s home camp with the informant’s map. The raiders will ride back to defend it.',
                requires: { flags: ['pack-camp-mapped'] },
                effects: {
                  affinity: { jackalwire: -15, freeholds: 10 },
                  local: { 'gate-watch': 2, yard: -1 },
                  flags: ['d10-camp-struck'],
                  questAid: [
                    {
                      questId: 'q-d10-freehold-raid',
                      label: 'The Pack rode home to its burning camp',
                      bonus: 2,
                      stat: 'might',
                      resolve: 'success',
                      outcome:
                        'The raiders turned for home before dusk to a camp on fire. Thistledown kept its roofs and most of its grain. The Watch came back at midnight and would not say how many tents had pups coughing in them.',
                    },
                  ],
                },
                response:
                  'The Watch rides south with the ration-card map. Before dusk the rider watches from the hill as the painted wagons turn for home. She does not cheer. She goes down to the board to see who else is coming.',
              },
              {
                id: 'tincture',
                label:
                  'Tell the fiddler the crown bought her pups’ tincture. Thistledown is the price.',
                requires: {
                  flags: ['pack-medicine'],
                  notFlags: ['d09-vane-debt-called'],
                },
                effects: {
                  affinity: { freeholds: 5, jackalwire: -5 },
                  flags: ['d10-tincture-called-in'],
                  questAid: [
                    {
                      questId: 'q-d10-freehold-raid',
                      label: 'Half the raiders went home with the fiddler',
                      bonus: 2,
                      resolve: 'partial',
                      outcome:
                        'Half the raiders went home behind the fiddler and her one sour note. The other half took the granary and left the roofs.',
                    },
                  ],
                },
                response:
                  'The rider carries it east herself. At dusk the fiddler plays one long sour note from the lead wagon and turns her wagons round. Half the raiders go with her. Half do not. The posting stays up. Somebody still has to stand in the granary door.',
              },
              {
                id: 'promise',
                label: 'Promise her every hand the board can field.',
                effects: {
                  affinity: { freeholds: 5 },
                  local: { 'old-houses': -1 },
                  flags: ['d10-thistledown-promised'],
                  schedule: ['d10-promise'],
                },
                response:
                  '“Every hand,” she repeats, testing the weight. She goes down to wait by the board, where she can see who signs.',
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
                  'She looks from you to Young Komodo and back. Her face shuts. “My grandmother was right.” She goes.',
              },
            ],
          },
          {
            id: 'rook',
            lines: [
              {
                who: 'Rook Bramble',
                npc: 'F001',
                text: 'Rook rubs soot from her boot between finger and thumb. Smells it. Goes still. “Barn tar. Axle grease off Pack wagons. Red wheels.”',
              },
              {
                who: 'Rook Bramble',
                npc: 'F001',
                text: '“A Pack raider pulled my family out of the Ford in flood when I was small. I’ve owed the Pack ever since. Nobody ever asked me to pay.” Rook does not look up. “She still rides with those wagons. I could ask her for one more mercy. It wouldn’t be free.”',
              },
              '“I don’t care what it costs you,” says the rider. “I care what it costs us.”',
            ],
            options: [
              {
                id: 'rook-mercy',
                label:
                  'Send Rook under a white rag to ask the one they owe for Thistledown.',
                effects: {
                  affinity: { freeholds: 5, jackalwire: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d10-rook-asked-mercy'],
                  questAid: [
                    {
                      questId: 'q-d10-freehold-raid',
                      label: 'Rook asked the one the Pack owes',
                      bonus: 1,
                      resolve: 'partial',
                      outcome:
                        'Rook came back after midnight, soot to the elbows. The raiders left Thistledown its people and took everything else. Rook will not say what was asked, or who will come to collect.',
                    },
                  ],
                },
                response:
                  'Rook goes at a run, a white rag tied to an arrow shaft. The posting stays up behind her. Whatever Rook buys out there, somebody still has to stand in the granary door.',
              },
              {
                id: 'promise',
                label:
                  'Keep Rook here. Promise her every hand the board can field.',
                effects: {
                  affinity: { freeholds: 5 },
                  local: { 'old-houses': -1 },
                  flags: ['d10-thistledown-promised'],
                  schedule: ['d10-promise'],
                },
                response:
                  'Rook nods and stays kneeling a long time. The rider goes down to wait by the board, where she can see who signs.',
              },
              {
                id: 'bargain',
                label:
                  'Tell Thistledown to pay the raiders what the Freeholds always paid, and live.',
                effects: {
                  affinity: { freeholds: -10, jackalwire: 5 },
                  local: { ledger: 1, 'old-houses': 1 },
                  flags: ['d10-thistledown-told-to-pay'],
                },
                response:
                  '“Pay them. With what?” Rook stands, brushes off the soot, and walks out without asking leave.',
              },
            ],
          },
        ],
      },
    ],
  },
]

/**
 * The Day 8 loan: "Forty now. Fifty at season's end." (t-040). The season
 * ends with Act II. Unpaid, the Ledger takes it out of the market and comes
 * back once more, for sixty.
 */
export const ACT_ONE_LATE_DUES: readonly DueDef[] = [
  // t-035: riding out for Thistledown leaves the gate to the old guard and
  // the kitchen boys. What gets in reads Day 6 (the postern) and Day 8 (the
  // carts the Watch may not search). None of it is on the ledger: the court
  // finds out at dawn.
  {
    id: 'd10-postern-night',
    title: 'The postern, unwatched',
    day: 11,
    hidden: true,
    when: { notFlags: ['d06-stablehand-stocks'] },
    effects: { brass: -15, local: { yard: -1 } },
    line: 'With the Watch gone, someone came in by the postern near midnight with a file. The old guard with the grey muzzle met them on the kitchen stair alone. He will mend. The strongbox is fifteen brass lighter, and nobody saw a face.',
  },
  {
    id: 'd10-postern-cart',
    title: 'A Ledger cart, unsearched',
    day: 11,
    hidden: true,
    when: {
      flags: ['ledger-credit'],
      notFlags: ['d06-stablehand-stocks', 'd08-fees-pledged'],
    },
    effects: { local: { 'gate-watch': -1 } },
    line: 'The sergeant’s note from Day 8 has a second line now. The Ledger cart that came in at dusk rode low. Ledger carts ride high. He was not allowed to search it.',
  },
  {
    id: 'd10-postern-seen',
    title: 'The stableboy saw',
    day: 11,
    hidden: true,
    when: {
      flags: ['d06-postern-informant'],
      notFlags: ['d06-stablehand-stocks'],
    },
    line: 'The stableboy saw who opened the postern. He told the sergeant and only the sergeant, in the stable with the door shut. The sergeant has not said the name aloud. He has started sleeping by the postern.',
  },
  {
    id: 'd10-postern-shut',
    title: 'The postern, nailed',
    day: 11,
    hidden: true,
    when: { flags: ['d06-stablehand-stocks'] },
    line: 'With the Watch gone, someone tried the postern near midnight with a file. It held. It has been nailed shut since the stableboy’s day in the stocks.',
  },
  // t-035: “Never cheaply” is the oath the last emperor broke. Sworn with
  // people already on the lethal canyon road, the Watch holds you to it.
  {
    id: 'd10-oath-tested',
    title: '“Never cheaply”',
    day: 11,
    when: { flags: ['oath-of-care', 'quest:q-d09-iron-convoy:failure'] },
    warning:
      'The Watch holds you to “never cheaply”. If the canyon convoy is lost, the oath is spent.',
    line: 'The canyon took the convoy the dawn after you swore “never cheaply”. Dunmark read out in the yard who came home hurt and who did not come home. Then he told the Watch the oath was spent, and walked off the balcony.',
    effects: {
      local: { 'gate-watch': -4 },
      clearFlags: ['oath-of-care'],
      flags: ['d10-oath-of-care-broken'],
    },
  },
  // t-035: a promise to Thistledown is a vow the Freeholds keep for you.
  {
    id: 'd10-promise',
    title: 'Your word to Thistledown',
    day: 11,
    when: {
      flags: ['d10-thistledown-promised', 'quest:q-d10-freehold-raid:expired'],
    },
    warning:
      'You promised Thistledown every hand. If nobody signs for it, the Freeholds remember the promise.',
    line: 'The Freeholds tell it at every well on the Ford: the crown promised every hand and sent none.',
    effects: { affinity: { freeholds: -10 }, flags: ['d10-promise-broken'] },
  },
  // t-035: the Day 7 storm arrives on the day the crows said. With the hour,
  // the Freeholds cut in time; without it, half the harvest is in the dust
  // and Thistledown's granary is the last food on the Ford.
  {
    id: 'd07-storm',
    title: 'The dust storm',
    day: 10,
    when: { flags: ['crow-forecast-day10'] },
    warning:
      'The storm crosses the Eastern Ford at the Day 10 dawn. The Freeholds have the hour.',
    line: 'The storm crossed the Eastern Ford at the hour the crows gave. The Freeholds cut through the night before it. The harvest is in.',
    effects: { affinity: { freeholds: 5 }, flags: ['d10-harvest-in'] },
    lapsed: {
      line: 'The storm crossed the Eastern Ford at dawn. Nobody knew the hour. Half the Freehold harvest is under the dust, and what is left sits in Thistledown’s granary.',
      effects: { affinity: { freeholds: -5 }, flags: ['d10-harvest-lost'] },
    },
  },
  {
    id: 'ledger-loan',
    title: 'The Ledger’s loan',
    day: 20,
    cost: 50,
    when: { flags: ['ledger-credit'] },
    warning: 'Fifty brass to Factor Tallow at the Day 20 dawn.',
    line: 'Factor Tallow came for the fifty at dawn. She counted it twice and wrote PAID in the same small, permanent hand.',
    effects: { clearFlags: ['ledger-credit'], flags: ['ledger-loan-repaid'] },
    unpaid: {
      line: 'Factor Tallow came for the fifty at dawn. The strongbox held less. By noon her clerks stood at every stall, taking the crown’s share before the crown did.',
      effects: {
        local: { ledger: -4, yard: -1 },
        flags: ['ledger-loan-defaulted'],
        schedule: ['ledger-loan-late'],
      },
    },
  },
  {
    id: 'ledger-loan-late',
    title: 'The Ledger’s loan, overdue',
    inDays: 5,
    cost: 60,
    when: { flags: ['ledger-credit'] },
    warning: 'Sixty brass to the Ledger. The fifty went unpaid.',
    line: 'The overdue loan came to sixty. The crown paid it. Tallow locked the green book and did not say thank you.',
    effects: { clearFlags: ['ledger-credit'], flags: ['ledger-loan-repaid'] },
    unpaid: {
      line: 'Sixty brass, and the strongbox could not cover it twice. The Ledger wrote the crown off as a bad debt. Out loud. In the market.',
      effects: {
        local: { ledger: -6 },
        clearFlags: ['ledger-credit'],
        flags: ['ledger-loan-written-off'],
      },
    },
  },
]
