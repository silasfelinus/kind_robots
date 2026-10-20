import type { DayDef, QuestDef } from './types'

// Act III, Days 21-30, "Kind Roads" (conductor DAY-PLAN.md): the Black
// Verge at the border, the mission road, the Abbess at court, Flint's trial,
// Mara's secret page and the terms of shelter before the faction wars
// resolve on the map. Harm to children stays off-screen: neat empty cots,
// tracks that only lead in, a door kept locked (WORLD-GUIDE.md).

export const ACT_THREE_QUESTS: readonly QuestDef[] = [
  {
    id: 'q-d22-ford-bodies',
    title: 'Bodies at the Ford',
    summary:
      'Three travellers were pulled from the Eastern Ford at dawn. The Old Houses are already blaming the Moles. Find out who they were before someone hangs the wrong people.',
    region: 'east-ford',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'wits', band: 'high' },
      { stat: 'lore', band: 'mid', hidden: true },
    ],
    danger: 'mid',
    tags: ['tracking', 'records', 'medicine'],
    rewards: {
      success: {
        affinity: { moles: 10 },
        local: { lamplight: 2 },
        flags: ['ford-bodies-identified'],
      },
      partial: { flags: ['ford-bodies-identified'] },
      failure: {
        affinity: { moles: -15 },
        local: { 'old-houses': 2 },
        flags: ['moles-blamed'],
      },
    },
    expired: {
      affinity: { moles: -10 },
      flags: ['moles-blamed'],
    },
    outcomes: {
      success:
        'They were not Moles and not killed by Moles. Each carried a mission-road travel token, the kind the Abbey gives to families it sends home. None of them had been sent home.',
      partial:
        'The travellers carried mission-road tokens. That is all anyone could learn before the river took them back.',
      failure:
        'The party came back with nothing, and the Old Houses filled the silence: the Moles did it. The burrows will not forget.',
      expired: 'Nobody looked closely. The Moles were blamed by suppertime.',
    },
  },
  {
    id: 'q-d23-blue-lantern',
    title: 'Follow the Blue Lantern',
    summary:
      'A blue lantern moves along the old rail line every third night. Smugglers, the Ledger says. Follow it and see where it goes.',
    region: 'rail-yards',
    faction: 'rustline',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'guile', band: 'high' },
      { stat: 'lore', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking', 'tunnels'],
    rewards: {
      triumph: {
        brass: 35,
        affinity: { rustline: 10 },
        flags: ['blue-lantern-route'],
      },
      success: {
        brass: 20,
        affinity: { rustline: 5 },
        flags: ['blue-lantern-route'],
      },
      failure: { affinity: { rustline: -5 } },
    },
    expired: {},
    outcomes: {
      triumph:
        'The blue lantern led to a Rustline cache of medicine and old-world glass, and a smuggler who was very happy to share rather than hang.',
      success:
        'The lantern carries medicine past the Ledger’s tolls to the Freehold farms. The court now knows the route, and so does its purse.',
      partial: 'The lantern went underground and the party did not follow.',
      failure: 'The lantern went out, and the party walked home in the dark.',
      expired: 'The lantern moved on to another line.',
    },
  },
  {
    id: 'q-d24-mission-road',
    title: 'The Mission Road',
    summary:
      'A Freehold mother last saw her son on the mission road, walking toward the Abbey with a sister in grey. Walk it and see what the road remembers.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 3 },
    requirements: [
      { stat: 'guile', band: 'mid' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['tracking'],
    rewards: {
      success: {
        local: { lamplight: 2 },
        affinity: { freeholds: 5 },
        flags: ['mission-road-tracks'],
      },
      failure: { affinity: { abbey: -5 } },
    },
    expired: { affinity: { freeholds: -5 } },
    outcomes: {
      success:
        'The road was swept clean, but not well enough. There are small footprints going toward the Abbey gate, many of them, and none coming back.',
      partial: 'The road had been swept that morning. Very carefully.',
      failure:
        'Two sisters in grey met the party on the road and walked them, kindly, all the way home.',
      expired: 'Nobody walked the road. The mother stopped coming to court.',
    },
  },
  {
    id: 'q-d24-coldbrook-visit',
    title: 'A Visit to the Children',
    summary:
      'Wenna Coldbrook has not been allowed to see the children she gave to the Abbey. Go with her and insist.',
    region: 'mission-road',
    faction: 'abbey',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'heart', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'low',
    tags: ['negotiation'],
    rewards: {
      success: {
        affinity: { abbey: -10, freeholds: 10 },
        flags: ['coldbrook-visit', 'abbey-cots-empty'],
      },
      failure: { affinity: { abbey: -5 } },
    },
    expired: { affinity: { freeholds: -10 } },
    outcomes: {
      success:
        'Sister Marrow showed them the dormitory: four neat cots, made tight, with nothing under the blankets. “They are at lessons,” she said. They were not at lessons.',
      partial: 'The gate stayed closed. A sister promised a visit next week.',
      failure: 'The sisters were so sorry, but the children were sleeping.',
      expired: 'Wenna went alone. She has not come back.',
    },
  },
  {
    id: 'q-d26-dry-well',
    title: 'A Friendly Raid',
    summary:
      'Gristle Vane asks for help against a worse band: the jackals of the dry well, who take people, not goats.',
    region: 'jackalwire',
    faction: 'jackalwire',
    durationDays: 2,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'guile', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      success: {
        affinity: { jackalwire: 15, freeholds: 5 },
        strength: { jackalwire: 1 },
        flags: ['dry-well-cleared'],
      },
      failure: {
        affinity: { jackalwire: -5 },
        strength: { freeholds: -1 },
      },
    },
    expired: { affinity: { jackalwire: -10 } },
    outcomes: {
      success:
        'The dry-well jackals are scattered. Vane threw a feast, and this time nobody brought knives.',
      partial:
        'The jackals pulled back to the dry well. They will come out again.',
      failure:
        'The dry well held, and two Freehold farms were emptied that night.',
      expired: 'Vane fought alone, and lost wagons.',
    },
  },
  {
    id: 'q-d27-flint-evidence',
    title: 'The Case Against Flint',
    summary:
      'The Old Houses say Duchess Flint has been passing grain to the Moles. Read the ledgers before the court passes judgment.',
    region: 'hollow-bell',
    durationDays: 1,
    boardDays: 1,
    party: { min: 1, max: 2 },
    requirements: [{ stat: 'wits', band: 'high' }],
    danger: 'none',
    tags: ['records'],
    rewards: {
      success: {
        local: { lamplight: 3, 'old-houses': -2 },
        flags: ['flint-cleared'],
      },
      failure: { flags: ['flint-doubted'] },
    },
    expired: { flags: ['flint-doubted'] },
    outcomes: {
      success:
        'The grain went to the Moles, yes: from the Old Houses’ own granary, sold at three times the market price. Flint had been trying to stop it.',
      partial:
        'The ledgers are muddled. Nobody is cleared, nobody is condemned.',
      failure: 'The ledgers say what the Old Houses wanted them to say.',
      expired: 'The court never read the ledgers.',
    },
  },
  {
    id: 'q-d28-rot-cure',
    title: 'Charms Against Rot',
    summary:
      'The Black Verge envoys offer a cure for the grain rot spreading in the Yard’s stores. Test it before anyone eats it.',
    region: 'black-verge',
    faction: 'black-verge',
    durationDays: 2,
    boardDays: 2,
    party: { min: 1, max: 2 },
    requirements: [
      { stat: 'lore', band: 'high' },
      { stat: 'wits', band: 'mid' },
    ],
    danger: 'mid',
    tags: ['medicine'],
    rewards: {
      success: {
        local: { yard: 3 },
        affinity: { 'black-verge': 5 },
        flags: ['verge-cure-tested'],
      },
      failure: {
        local: { yard: -3 },
        flags: ['verge-cure-tainted'],
      },
    },
    expired: { local: { yard: -2 } },
    outcomes: {
      success:
        'The charm works on rot. It also leaves the grain faintly cold to the touch, always. The Yard eats it anyway.',
      partial: 'The charm slowed the rot. Nobody likes the taste.',
      failure:
        'The cure did something to the testers’ dreams. They will not say what.',
      expired: 'The rot spread through another storeroom.',
    },
  },
  {
    id: 'q-d30-hold-the-line',
    title: 'Hold the Border Line',
    summary:
      'War is coming between the factions, and the map will change tomorrow. Stand with the weakest of the court’s friends.',
    region: 'east-ford',
    faction: 'freeholds',
    durationDays: 1,
    boardDays: 1,
    party: { min: 2, max: 4 },
    requirements: [
      { stat: 'might', band: 'high' },
      { stat: 'heart', band: 'mid' },
    ],
    danger: 'high',
    tags: ['defense'],
    rewards: {
      triumph: {
        strength: { freeholds: 2, saltroad: 1 },
        affinity: { freeholds: 10, saltroad: 5 },
      },
      success: {
        strength: { freeholds: 1, saltroad: 1 },
        affinity: { freeholds: 5 },
      },
      failure: { strength: { freeholds: -1 } },
    },
    expired: { strength: { freeholds: -1 } },
    outcomes: {
      triumph: 'The line held, and two other factions noticed who held it.',
      success: 'The line held.',
      partial: 'The line bent and held, just.',
      failure: 'The line broke, and the Freeholds paid for it.',
      expired: 'Nobody stood on the line.',
    },
  },
]

export const ACT_THREE_DAYS: readonly DayDef[] = [
  {
    day: 21,
    title: 'A Captain’s Promise',
    briefings: [
      {
        id: 'verge-banners',
        source: 'The map room',
        text: 'A new banner hangs at the far border: the Black Verge Court.',
        truth: true,
      },
      {
        id: 'vane-offer',
        source: 'A Jackalwire runner',
        text: 'Gristle Vane wants to talk alliance, against the riders in plum.',
        truth: true,
      },
      {
        id: 'verge-peaceful',
        source: 'A travelling preacher',
        text: 'The Black Verge Court has sent word that it wants nothing but trade.',
        truth: false,
      },
    ],
    komodo:
      'Courts that want only trade do not send riders before merchants, Your Majesty. Vane wanting an alliance is the most honest thing he has ever done: he is afraid.',
    quests: [],
    audiences: [
      {
        id: 'd21-captains-promise',
        title: 'A Captain’s Promise',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        lines: [
          'Captain Vane comes up the carpet alone, which nobody at court has ever seen him do. His greatcoat of feathers is buttoned to the throat, and he carries a bridle of plum-dyed leather, beautifully stitched, with no horse attached to it.',
          'You have seen the plum riders, Majesty. So have I. They came through the canyon at night and did not stop to rob anybody, which is the most frightening thing I have ever seen a raider do.',
          'We found this on a rock in the morning. No rider, no horse, no blood. Just a very good bridle, set down neatly, as if somebody meant to come back for it.',
          'The Pack will stand with the tower against them. For a price, naturally. I am frightened, not reformed.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'He is telling the truth about being frightened, Your Majesty. I would like to know what he is telling the truth about being paid.',
          },
        ],
        options: [
          {
            id: 'alliance',
            label: 'An alliance, on the Pack’s terms.',
            effects: {
              affinity: { jackalwire: 20, freeholds: -10 },
              strength: { jackalwire: 1 },
              flags: ['pack-alliance'],
            },
            response:
              'Vane spits in his palm and holds it out. It is, apparently, a great honor.',
          },
          {
            id: 'truce',
            label: 'An alliance, if the Pack stops raiding the Freeholds.',
            requires: { affinity: { jackalwire: 'neutral' } },
            effects: {
              affinity: { jackalwire: 10, freeholds: 5 },
              flags: ['pack-truce'],
            },
            response:
              'Vane winces as if you had asked for his coat. “For a season,” he says. “Then we talk again.”',
          },
          {
            id: 'refuse',
            label: 'The crown does not ally with raiders.',
            effects: {
              affinity: { jackalwire: -10 },
              local: { 'old-houses': 2 },
            },
            response:
              'Vane bows. “Then I hope the plum riders feel the same about crowns.”',
          },
          {
            id: 'ask-price',
            label: 'Ask what “a price, naturally” means, in plain words.',
            effects: {},
            response:
              'Vane looks pleased to be asked, the way a fiddler looks pleased to be asked for a second song, and sits down on the step of the dais without permission.',
            next: 'price',
          },
          {
            id: 'ask-saffron',
            label: 'Let Saffron speak to her old captain.',
            requires: { follower: 'F002' },
            effects: {},
            response:
              'Saffron pushes her goggles up onto her forehead and walks out from the followers’ bench, and Vane’s whole face changes.',
            next: 'saffron',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“Three things. The crown’s colours painted on my wagons, so the Freeholds stop shooting at them. The southern bridge toll, legal, in writing, with your seal. And when the plum riders come, the Pack fights in front, and the crown pays for every hyena who does not come home.”',
              '“Or.” He leans in, and his ear-chain jangles. “You could keep a few of my pups in your tower this winter. As guests. Fed, warm, safe from riders. Every captain in the canyon would know the Pack cannot turn on you while its children eat your bread.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'That is a hostage, Your Majesty, offered as a kindness. Or a kindness, offered as a hostage. I genuinely cannot tell which, and I do not think he can either.',
              },
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: 'If the Pack’s pups sleep in my Yard, Majesty, my Watch guards them. I would like to know whether I am guarding them from the riders or from their father.',
              },
            ],
            options: [
              {
                id: 'alliance',
                label: 'Everything he asks. An alliance on the Pack’s terms.',
                effects: {
                  affinity: { jackalwire: 20, freeholds: -10 },
                  strength: { jackalwire: 1 },
                  flags: ['pack-alliance'],
                },
                response:
                  'Vane spits in his palm and holds it out, and grins when you take it. By nightfall a Freehold reeve has sent the court a single sheet of paper with nothing on it but a drawing of a painted wagon with a crown on its side, crossed out twice.',
              },
              {
                id: 'pups-as-guests',
                label:
                  'Take the pups as guests of the crown, and the alliance with them.',
                effects: {
                  affinity: { jackalwire: 5 },
                  local: { yard: -1, 'gate-watch': 2 },
                  flags: ['d21-pack-pups-guests'],
                },
                response:
                  'That evening six hyena pups are led into the Yard in a line, each holding the tail of the one in front. The cooks feed them before anyone tells them to. Vane does not watch them go in.',
              },
              {
                id: 'tincture-debt',
                label:
                  'Remind him who paid for his pups’ tincture on your first morning. The Pack owes the crown.',
                requires: { flags: ['pack-medicine'] },
                effects: {
                  affinity: { jackalwire: -5, freeholds: 5 },
                  flags: ['d21-tincture-debt-called'],
                },
                response:
                  'Vane’s ears go flat against his skull. “So it was a loan,” he says. “I thought it was the other thing.” He agrees to everything, standing very straight, and does not spit in his palm.',
              },
              {
                id: 'camp-threat',
                label:
                  'Tell him the crown knows exactly where the Pack’s camp sleeps. The Pack will stand with the tower, and ask nothing.',
                requires: { flags: ['pack-camp-mapped'] },
                effects: {
                  affinity: { jackalwire: -10, freeholds: 5 },
                  local: { 'gate-watch': 2 },
                  flags: ['d21-pack-threatened'],
                },
                response:
                  'Vane looks at you for a long moment. “The one with the bandaged paw,” he says. “Of course.” He will stand with the tower. You suspect he will never again stand with his back to it, and you do not see the young hyena with the bandaged paw at the postern gate again.',
              },
              {
                id: 'refuse',
                label: 'No colours, no toll, no pups. No alliance.',
                effects: {
                  affinity: { jackalwire: -10 },
                  local: { 'old-houses': 2 },
                },
                response:
                  'Vane stands and buttons his coat to the throat again. “Then I hope the plum riders feel the same about crowns,” he says, and leaves the bridle on your step.',
              },
            ],
          },
          {
            id: 'saffron',
            lines: [
              {
                who: 'Captain Gristle Vane',
                npc: 'gristle-vane',
                text: '“Kett.” He says it the way people say the name of a town they grew up in. “Still fixing things for crowns?”',
              },
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: 'Still fixing what you break, Captain. Your coat is buttoned. You only button it when you are hiding something inside it.',
              },
              {
                who: 'Saffron Kett',
                npc: 'F002',
                text: 'The plum riders did not rob anybody, Majesty, because they did not need to. They offered to carry the Pack’s sick pups to their own physicians. Two mothers said yes. That bridle is what came back.',
              },
              '“They were very polite,” Vane says, to the floor. “They had white gloves. Nobody in the canyon has ever once offered us a doctor.”',
            ],
            options: [
              {
                id: 'pups-back',
                label:
                  'Swear the alliance, and swear the crown will ask the Black Verge for those two pups.',
                effects: {
                  affinity: { jackalwire: 10, 'black-verge': -5 },
                  flags: ['d21-verge-pups-asked'],
                },
                response:
                  'Vane unbuttons his coat. Inside, against his chest, a third pup is asleep, wheezing faintly. “This one I would not give them,” he says. Saffron puts her goggles back down, which is what she does instead of crying.',
              },
              {
                id: 'alliance',
                label:
                  'An alliance on the Pack’s terms. The pups are his affair.',
                effects: {
                  affinity: { jackalwire: 20, freeholds: -10 },
                  strength: { jackalwire: 1 },
                  flags: ['pack-alliance'],
                },
                response:
                  'Vane spits in his palm and holds it out. Saffron watches you take it and says nothing at all, which from Saffron is a long speech.',
              },
              {
                id: 'truce',
                label:
                  'An alliance, if the Pack stops raiding the Freeholds. Frightened or not.',
                requires: { affinity: { jackalwire: 'neutral' } },
                effects: {
                  affinity: { jackalwire: 10, freeholds: 5 },
                  flags: ['pack-truce'],
                },
                response:
                  '“For a season,” says Vane. “Then we talk again.” On his way out he cuffs Saffron gently on the ear, the way you would a younger sister, and she lets him.',
              },
              {
                id: 'refuse',
                label:
                  'The crown does not ally with raiders, even frightened ones.',
                effects: {
                  affinity: { jackalwire: -10 },
                  local: { 'old-houses': 2 },
                },
                response:
                  'Vane bows, and keeps one arm across the front of his coat. “Then I hope the plum riders feel the same about crowns.” Saffron goes to the workshop and does not come out until dark.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 22,
    title: 'Bodies at the Ford',
    briefings: [
      {
        id: 'ford-bodies',
        source: 'Eastern Ford ferrymen',
        text: 'Three travellers were pulled from the Ford at dawn.',
        truth: true,
      },
      {
        id: 'mole-knives',
        source: 'Lady Vask’s steward',
        text: 'The travellers were killed with Mole digging knives.',
        truth: false,
      },
      {
        id: 'tokens',
        source: 'A ferry boy',
        text: 'Each of the dead wore a little wooden token on a string.',
        truth: true,
      },
    ],
    komodo:
      'The Old Houses would blame the Moles for the weather if it helped them, Your Majesty. Find out who those travellers were. Quickly, before the Moles find out they are being blamed.',
    quests: ['q-d22-ford-bodies'],
    audiences: [
      {
        id: 'd22-blame',
        title: 'Justice for the Ford',
        speaker: 'Lady Ottoline Vask of the Old Houses',
        npc: 'ottoline-vask',
        faction: 'old-houses',
        lines: [
          'Lady Vask arrives in mourning grey, which suits her. A steward walks two paces behind her carrying a velvet cushion, and on the cushion lies a short, hooked knife of the kind the Mole cells use to cut roots in their tunnels.',
          'Three dead at the Ford, Majesty, and the Mole tunnels run right beneath it. This was found on the bank beside them. The Old Houses ask for justice, which in this case means arrests.',
          'Justice delayed is only a longer funeral. The Moles were told the Ford would be argued over in council. Evidently they preferred to argue in the river.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The ferrymen say the dead wore wooden tokens, Your Majesty. Lady Vask has brought a knife instead. Somebody chose which of those to carry up the hill.',
          },
        ],
        options: [
          {
            id: 'blame',
            label: 'Arrest the Mole cell nearest the Ford.',
            effects: {
              affinity: { moles: -15 },
              local: { 'old-houses': 3 },
              flags: ['moles-blamed'],
            },
            response:
              'Lady Vask inclines her head. The Moles will hear of it before the arrests are made.',
          },
          {
            id: 'evidence',
            label: 'Nobody is arrested until the court knows who died.',
            effects: { local: { 'old-houses': -2, lamplight: 1 } },
            response:
              '“How judicious,” says Lady Vask, in the tone others use for “how unfortunate.”',
          },
          {
            id: 'ask-knife',
            label: 'Ask to hold the knife.',
            effects: {},
            response:
              'Lady Vask gestures, and the steward brings the cushion up the steps of the dais with the care of a man carrying a crown that is not his.',
            next: 'knife',
          },
          {
            id: 'ask-tokens',
            label: 'Ask about the wooden tokens the dead were wearing.',
            effects: {},
            response:
              'Lady Vask sighs, very faintly, as if you had asked about the weather at a funeral. Somebody sends down to the kitchens for the ferry boy.',
            next: 'tokens',
          },
        ],
        beats: [
          {
            id: 'knife',
            lines: [
              'The knife is heavier than it looks, and very clean. The hinge is bright. There is no soil in it anywhere, and a Mole’s root-knife lives in soil the way a spoon lives in soup.',
              'Someone has filed the grip smooth on one side, in a neat little patch, exactly where a cutler would stamp his mark.',
              '“Moles may own a clean knife,” says Lady Vask. “Even Moles occasionally wash. And a great many knives are filed, Majesty. Thieves file them.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'If you say what you have noticed out loud, Your Majesty, you make an enemy of the Old Houses a week before the war. If you do not, you make it true.',
              },
            ],
            options: [
              {
                id: 'show-court',
                label:
                  'Hold the knife up before the gallery and ask whose mark was filed off.',
                effects: {
                  affinity: { moles: 5 },
                  local: { 'old-houses': -3, lamplight: 2 },
                  flags: ['d22-knife-shown'],
                },
                response:
                  'The gallery goes silent. Lady Vask’s rings tap once on the steward’s shoulder, and he leaves the hall at a walk that is very nearly a run. By evening two Old House families have closed their accounts with the crown’s tailor, which is how the Houses declare a feud.',
              },
              {
                id: 'quiet-word',
                label:
                  'Return the knife to Lady Vask privately, and let the charge die quietly.',
                effects: {
                  local: { 'old-houses': 2, lamplight: -2 },
                  flags: ['d22-knife-returned'],
                },
                response:
                  'Lady Vask takes the knife back with perfect grace. No Moles are arrested, and nobody asks who filed the grip. You have a friend in the Old Houses tonight, and the friend knows exactly what you saw.',
              },
              {
                id: 'blame',
                label:
                  'Arrest the Mole cell anyway. A clean knife proves nothing.',
                effects: {
                  affinity: { moles: -15 },
                  local: { 'old-houses': 3 },
                  flags: ['moles-blamed'],
                },
                response:
                  'Lady Vask inclines her head, and the steward carries the knife away on its cushion like a relic. The Moles will hear of it before the arrests are made, and they will hear about the knife, too.',
              },
              {
                id: 'evidence',
                label:
                  'Keep the knife. Nobody is arrested until the court knows who died.',
                effects: { local: { 'old-houses': -2, lamplight: 1 } },
                response:
                  '“How judicious,” says Lady Vask, and leaves the cushion behind, which is the closest she has ever come to forgetting something.',
              },
            ],
          },
          {
            id: 'tokens',
            speaker: 'A ferry boy from the Eastern Ford',
            lines: [
              'The ferry boy is soaked to the knees and terrified of the carpet. He holds out three little wooden discs on wet string, each burned with the same mark: a bell, with no clapper in it.',
              '“They was round their necks, Majesty. All three. Tied tight, double knots. Like they wanted to be sure somebody would know where they had been.”',
              {
                who: 'Lady Ottoline Vask',
                npc: 'ottoline-vask',
                text: 'Abbey trinkets. The sisters hand them to anyone who will take a loaf. They mean nothing, except that the dead were poor.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Mission tokens, Your Majesty. The Abbey gives them to visitors walking home. Three grieving parents and a cold river: sad, and very ordinary. I would let the dead keep them.',
              },
            ],
            options: [
              {
                id: 'ask-ash',
                label:
                  'Let Ash Quill look at the tokens. Ash knows papers, and lies on string.',
                requires: { follower: 'F007' },
                effects: {},
                response:
                  'Ash takes the tokens from the ferry boy very gently, as if they might still be warm.',
                next: 'ash',
              },
              {
                id: 'write-abbey',
                label: 'Write to the Abbey and ask whose tokens these were.',
                effects: {
                  affinity: { abbey: -5 },
                  local: { lamplight: 1 },
                  flags: ['d22-tokens-asked'],
                },
                response:
                  'The Abbey’s answer is waiting at the gate by evening, in a lovely hand: three dear friends of the mission, sent home with bread and blessings, for whom the sisters will pray. The rider who carried your letter has not yet reached the mission road.',
              },
              {
                id: 'bury-tokens',
                label:
                  'Bury the three with their tokens, and let the river’s business stay the river’s.',
                effects: {
                  local: { yard: 1, lamplight: -1 },
                  flags: ['d22-tokens-buried'],
                },
                response:
                  'They are buried on the bank above the Ford with the tokens on their chests, and the Yard sends bread to the graveside. It is a decent thing to do. Komodo, who arranges it, looks more at ease than he has all week.',
              },
              {
                id: 'evidence',
                label:
                  'Nobody is arrested until the court knows who these three were.',
                effects: { local: { 'old-houses': -2, lamplight: 1 } },
                response:
                  '“How judicious,” says Lady Vask. The ferry boy is allowed to keep a honey-cake for his trouble, and holds it the whole way down the hill without eating it.',
              },
              {
                id: 'blame',
                label:
                  'Trinkets are trinkets. Arrest the Mole cell nearest the Ford.',
                effects: {
                  affinity: { moles: -15 },
                  local: { 'old-houses': 3 },
                  flags: ['moles-blamed'],
                },
                response:
                  'Lady Vask inclines her head. The ferry boy looks at the tokens in his hand, and then at you, and puts them in his pocket instead of giving them back.',
              },
            ],
          },
          {
            id: 'ash',
            lines: [
              'Ash Quill turns the tokens over in small, ink-stained paws, and their enormous ears go slowly flat.',
              {
                who: 'Ash Quill',
                npc: 'F007',
                text: 'These are real, Majesty. I have forged a hundred of these to move families past checkpoints, and I never once got the burn this clean. The Abbey gives one to every parent who comes to visit a child.',
              },
              {
                who: 'Ash Quill',
                npc: 'F007',
                text: 'It means “seen, and sent home”. So these three walked all the way to the mission road to see their children, and the Abbey sent them home. And the road home from the Abbey does not cross the Ford. Not anywhere.',
              },
              '“How tiresome,” says Lady Vask, though not, for once, about you.',
            ],
            options: [
              {
                id: 'copy-stamp',
                label:
                  'Have Ash copy the burn exactly, for the Archive, before the tokens are buried.',
                effects: {
                  affinity: { abbey: -5 },
                  local: { lamplight: 2 },
                  flags: ['d22-token-stamp-copied'],
                },
                response:
                  'Ash traces the clapperless bell three times, very carefully, then puts down the pencil and walks out of the hall without asking leave. They come back an hour later with red eyes and the copy finished.',
              },
              {
                id: 'evidence',
                label:
                  'Nobody is arrested. Find out who these three came to visit.',
                effects: { local: { 'old-houses': -2, lamplight: 1 } },
                response:
                  '“How judicious,” says Lady Vask. Ash is already at the map table, tracing the road home from the Abbey with one claw, and then the road to the Ford, which is not the same road at all.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 23,
    title: 'The Blue Lantern',
    briefings: [
      {
        id: 'blue-lantern',
        source: 'The Ledger’s factor',
        text: 'A blue lantern moves along the old rail line every third night: smugglers.',
        truth: true,
      },
      {
        id: 'medicine-cheap',
        source: 'Freehold reeves',
        text: 'Medicine is suddenly cheap on the Freehold farms.',
        truth: true,
      },
      {
        id: 'lantern-ghost',
        source: 'A rail-yard child',
        text: 'The blue lantern is carried by a ghost with no feet.',
        truth: false,
      },
    ],
    komodo:
      'Ghosts do not lower the price of medicine, Your Majesty. Somebody is moving goods past the Ledger’s tolls, and the Ledger is very upset about it, which tells you something about the tolls.',
    quests: ['q-d23-blue-lantern'],
    audiences: [
      {
        id: 'd23-smugglers',
        title: 'Smugglers on the Rail Line',
        speaker: 'Factor Marisol Tallow of the Ledger',
        npc: 'marisol-tallow',
        faction: 'ledger',
        lines: [
          'Factor Tallow sets a small brown bottle on the arm of the throne before the herald has finished her name. It is a tincture for dust lung at half the Ledger’s price, and there is no Ledger stamp on it anywhere.',
          'Someone is moving medicine past our tolls, Majesty. It is theft, from the crown as much as from the Ledger.',
          'License the route to the Ledger and the crown takes a fifth. Or shut it down. Either way, it must not stay free.',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'Half my cooks’ children stopped coughing this month, Majesty. I did not ask why. I am asking you not to ask either.',
          },
        ],
        options: [
          {
            id: 'license',
            label: 'License the route to the Ledger.',
            effects: {
              brass: 20,
              local: { ledger: 3 },
              affinity: { freeholds: -5 },
              flags: ['rail-route-licensed'],
            },
            response:
              'Factor Tallow produces a license she had, by remarkable luck, already drafted.',
          },
          {
            id: 'free',
            label: 'Medicine should be cheap. Leave the route alone.',
            effects: {
              local: { ledger: -3, yard: 1 },
              affinity: { freeholds: 5 },
            },
            response: 'Factor Tallow writes something down in a different ink.',
          },
          {
            id: 'crown-seal',
            label:
              'You bought a crate from Jinx Coupler once. Send word that the crown knows whose lantern it is, and would rather buy than hang.',
            requires: { flags: ['rustline-crate-bought'] },
            effects: {
              brass: 20,
              affinity: { rustline: 5 },
              local: { ledger: -1 },
              flags: ['d23-lantern-under-seal'],
            },
            response:
              'Jinx’s answer comes back up the rail line that night, scratched on a square of tin: a lantern, a crown, a handshake, and underneath, “a fifth to you, same as the Ledger offered, and you never saw us”. Factor Tallow hears about it by breakfast, and does not say a word, which is worse.',
          },
          {
            id: 'ask-cargo',
            label: 'Ask the Factor what else rides the blue lantern line.',
            effects: {},
            response:
              'Factor Tallow smiles the smile of a woman who has been waiting all morning to be asked, and opens her case.',
            next: 'manifest',
          },
        ],
        beats: [
          {
            id: 'manifest',
            lines: [
              'The case holds a seized manifest, water-stained, written in a smuggler’s cipher the Ledger cracked in an afternoon. Tincture for the Freehold farms. Lamp glass for the Rustline. Bandages for the Yard.',
              '“And every third night, twelve jars of poppy syrup,” says Factor Tallow, “consigned to the Mission kitchen. Enough to quiet a great many coughs. The Ledger does not care who drinks it, Majesty. The Ledger cares that nobody paid the toll.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'Shut the line and my Yard coughs again. Tax it and the farms cannot pay. Those are your choices. The jars are the Abbey’s business.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'An orphanage has a great many children, Your Majesty, and children have a great many coughs. I would not read a ghost story into a grocery list.',
              },
            ],
            options: [
              {
                id: 'seize-syrup',
                label:
                  'Leave the line free, but have the Watch seize anything addressed to the Mission.',
                effects: {
                  affinity: { abbey: -5 },
                  local: { ledger: -2, 'gate-watch': 1 },
                  flags: ['d23-mission-syrup-seized'],
                },
                response:
                  'The Watch takes twelve jars off the lantern line three nights later. The Abbess writes at once, very warmly, to ask after “the children’s medicine”. That night, for the first time anyone can remember, every window in the Abbey stays lit until dawn.',
              },
              {
                id: 'copy-manifests',
                label:
                  'License the route, on condition the Ledger copies every manifest to the Archive.',
                effects: {
                  brass: 10,
                  affinity: { freeholds: -5 },
                  local: { ledger: 1, lamplight: 2 },
                  flags: ['d23-manifests-copied'],
                },
                response:
                  'Factor Tallow agrees so quickly that she must have expected worse. Medicine costs a fifth more on the Freehold farms from tomorrow, and every jar that rides north to the Mission is now written down twice, by clerks who are paid not to wonder.',
              },
              {
                id: 'license',
                label:
                  'License the route to the Ledger. What the Abbey buys is the Abbey’s affair.',
                effects: {
                  brass: 20,
                  local: { ledger: 3 },
                  affinity: { freeholds: -5 },
                  flags: ['rail-route-licensed'],
                },
                response:
                  'Factor Tallow produces a license she had, by remarkable luck, already drafted. The Mission’s twelve jars are on it, taxed at a fifth, perfectly legal.',
              },
              {
                id: 'free',
                label:
                  'Leave the whole line alone, jars and all. Cheap medicine is cheap medicine.',
                effects: {
                  local: { ledger: -3, yard: 1 },
                  affinity: { freeholds: 5 },
                },
                response:
                  'Factor Tallow writes something down in a different ink. Dunmore unfolds his arms for the first time all morning. The blue lantern goes by on the rail line that night, right on time, and nobody stops it.',
              },
            ],
          },
        ],
      },
      {
        id: 'd23-yard-sisters',
        title: 'Bread from the Sisters',
        speaker: 'Wenna Coldbrook',
        faction: 'freeholds',
        requires: { flags: ['coldbrooks-in-yard'] },
        lines: [
          'Wenna Coldbrook has lived in the Yard since the night her farm burned, and she has the Yard’s look now: flour on her sleeves, an oven burn on one wrist. Her eldest, a narrow, serious boy of nine, stands behind her holding a honey-cake he has not eaten.',
          'The sisters come to the Yard every evening now, Majesty. Bread for everyone, sweets for the little ones. Sister Marrow knows all my children’s names. I never told her their names.',
          'Tam wants to go and see the Abbey’s lessons. Only to see. The sisters say he can come home whenever he likes. The whole Yard thinks I am ungrateful for asking you.',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'The sisters’ bread has fed the Yard all winter, Majesty. Close the gate to them and my people will want to know who closed it.',
          },
        ],
        options: [
          {
            id: 'bar-sisters',
            label: 'Bar the sisters from the Yard.',
            effects: {
              affinity: { abbey: -10, freeholds: 5 },
              local: { yard: -2 },
              flags: ['d23-sisters-barred'],
            },
            response:
              'The sisters stop coming. So does the bread. That night the Yard eats thin soup and looks at Wenna, and Wenna keeps her children indoors.',
          },
          {
            id: 'let-him-visit',
            label:
              'Let the boy visit, with a guard who does not leave his side.',
            effects: {
              affinity: { abbey: 5 },
              local: { 'gate-watch': -1 },
              flags: ['d23-tam-visited'],
            },
            response:
              'Tam comes back at dusk with his guard, unharmed, delighted and full of bread. He will not say what the lessons were. The guard, a steady old wolf of the Watch, asks to be moved to the night wall and will not say why either.',
          },
          {
            id: 'keep-bread',
            label:
              'The sisters feed the Yard. Thank them, and let Wenna decide for herself.',
            effects: {
              affinity: { abbey: 5 },
              local: { yard: 1 },
              flags: ['d23-sisters-welcome'],
            },
            response:
              'Wenna nods slowly, as if she had expected nothing else from a throne, and goes back to the ovens. The next evening Sister Marrow brings an extra honey-cake, and calls Tam by name.',
          },
          {
            id: 'ask-tam',
            label: 'Ask Tam what the sisters promised him.',
            effects: {},
            response:
              'Wenna puts a hand on the boy’s shoulder and pushes him one step forward, gently, the way you push a boat off a bank.',
            next: 'tam',
          },
        ],
        beats: [
          {
            id: 'tam',
            speaker: 'Tam Coldbrook',
            lines: [
              'The boy speaks to the carpet, very fast, in the voice children use for a secret they have been told is a present.',
              '“They said there is a room at the bottom of the Abbey where nobody is ever hungry. Or cold. Or sad. Or anything.”',
              '“They said the children from the Ford road are there already, and they asked about me. They said I was very well chosen.”',
              {
                who: 'Wenna Coldbrook',
                text: 'Anything, Majesty. He said anything. I asked him what that meant, and he said that was the best part.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Children embroider, Your Majesty. I said far worse things about the fortress cellars when I was his age.',
              },
            ],
            options: [
              {
                id: 'ask-teodor',
                label:
                  'Let Brother Teodor answer. He served soup in that Abbey for six years.',
                requires: { follower: 'F012' },
                effects: {},
                response:
                  'Teodor gets up from the followers’ bench slowly, like a man getting up to identify something.',
                next: 'teodor',
              },
              {
                id: 'bar-sisters',
                label: 'Bar the sisters from the Yard, tonight.',
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  local: { yard: -2 },
                  flags: ['d23-sisters-barred'],
                },
                response:
                  'The Watch turns the sisters back at the Yard gate that same evening, with their baskets. The Yard eats thin soup and grumbles. Tam cries for an hour, furious, as if something had been stolen from him.',
              },
              {
                id: 'let-him-visit',
                label:
                  'Let him visit, with a guard at his side. The crown needs to know what that room is.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d23-tam-visited'],
                },
                response:
                  'Tam comes back at dusk, unharmed and full of bread, and says he was not allowed downstairs yet. “Next time,” he says, happily. His guard asks to be moved to the night wall, and Wenna does not speak to you again.',
              },
              {
                id: 'keep-bread',
                label:
                  'It is a child’s story. Thank the sisters for the bread.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { yard: 1 },
                  flags: ['d23-sisters-welcome'],
                },
                response:
                  'Wenna takes Tam’s hand and walks him out without bowing. The next evening Sister Marrow brings an extra honey-cake, and calls him by name.',
              },
            ],
          },
          {
            id: 'teodor',
            lines: [
              {
                who: 'Brother Teodor Lull',
                npc: 'F012',
                text: 'I served soup on the top three floors for six years, Majesty. I was never once sent below the third. Sister Marrow kept that key on her counting cord, between two particular knots.',
              },
              {
                who: 'Brother Teodor Lull',
                npc: 'F012',
                text: 'The children who went down were always the ones she called well chosen. I used to think it meant clever. I used to think a great many things.',
              },
              'Wenna has gone very white. Tam, who does not understand, is finally eating his honey-cake.',
            ],
            options: [
              {
                id: 'move-family',
                label:
                  'Move the Coldbrooks into the keep, behind the Watch, tonight.',
                requires: { cost: 10 },
                effects: {
                  affinity: { abbey: -5, freeholds: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d23-coldbrooks-in-keep'],
                },
                response:
                  'Wenna carries the baby up the keep stairs and Teodor carries Tam. In the morning there is a honey-cake on the keep’s doorstep, wrapped in a clean grey cloth. Nobody on the Watch saw who left it.',
              },
              {
                id: 'bar-sisters',
                label: 'Bar the sisters from the Yard. Every one of them.',
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  local: { yard: -2 },
                  flags: ['d23-sisters-barred'],
                },
                response:
                  'The sisters are turned back at the Yard gate. The bread stops. Teodor ladles the thin soup himself that night, and makes the Yard laugh twice, and does not eat any of it.',
              },
              {
                id: 'keep-bread',
                label:
                  'Teodor never saw the lower floors. Nobody has. Keep the bread coming.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { yard: 1 },
                  flags: ['d23-sisters-welcome'],
                },
                response:
                  'Teodor bows and goes back to the bench without a word. The sisters come to the Yard that evening as usual. He serves beside them, and watches Sister Marrow’s counting cord the whole time.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 24,
    title: 'The Mother’s Petition',
    briefings: [
      {
        id: 'missing-boy',
        source: 'A Freehold mother',
        text: 'Her son walked toward the Abbey with a sister in grey three weeks ago and has not written.',
        truth: true,
      },
      {
        id: 'abbey-letters',
        source: 'A sister of the Abbey',
        text: 'Every child at the Abbey writes home on the first of the month.',
        truth: false,
      },
      {
        id: 'notices',
        source: 'Hollow Bell’s notice board',
        text: 'Hollow Bell’s notice board has eleven notices for missing children.',
        truth: true,
      },
    ],
    komodo:
      'Eleven notices is a great many for one town, Your Majesty. I would not accuse anybody. I would walk the road.',
    quests: [],
    audiences: [
      {
        id: 'd24-mothers-petition',
        title: 'The Mother’s Petition',
        speaker: 'A Freehold mother',
        faction: 'freeholds',
        lines: [
          'The Freehold mother has walked two days to reach the hall, and she has not taken off her muddy boots. She holds a folded letter out in front of her in both hands, the way people carry something they cannot read.',
          'My boy went to the Abbey with a sister in grey, Majesty. They said he would have lessons and three meals and write home every month.',
          'He has not written. They sent me this instead, and said it came from him. They say he is well. They will not let me see him.',
          'I cannot read it, Majesty. I was hoping somebody here could.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'The Abbey writes a lovely letter, Your Majesty. I have read several. Perhaps read her the kind parts.',
          },
        ],
        options: [
          {
            id: 'search',
            label: 'Send someone to walk the mission road.',
            effects: {},
            response:
              'She does not thank you. She sits down on the throne-room step and waits.',
            postsQuests: ['q-d24-mission-road'],
          },
          {
            id: 'ask-abbey',
            label: 'Write to the Abbess and ask, politely.',
            effects: {
              affinity: { abbey: 5 },
              flags: ['asked-abbey-politely'],
            },
            response:
              'The Abbess writes back the same day, in a lovely hand: the boy is happy, well, and very busy with his lessons.',
          },
          {
            id: 'read-letter',
            label:
              'Take the letter and read it yourself before you read it to her.',
            effects: {},
            response:
              'She gives it up reluctantly, as if it were warm, and watches your eyes move along the lines.',
            next: 'letter',
          },
        ],
        beats: [
          {
            id: 'letter',
            lines: [
              'It is a lovely letter. The paper is good and the hand is beautiful, and it says that Dov is well, and happy, and very busy with his lessons, and sends his mother a hundred kisses.',
              'It is also, you notice, two letters. The beautiful hand wrote everything except the name. “Dov” has been written in afterward, in a different ink, in a space left a little too large for it.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A busy house uses forms, Your Majesty. The Ledger does. The Watch does. It is efficient, not wicked.',
              },
              '“Is he well?” the mother asks. “Does it say he is well?”',
            ],
            options: [
              {
                id: 'ask-pip',
                label: 'Let Pip look at the ink before you answer her.',
                requires: { follower: 'F005' },
                effects: {},
                response:
                  'Pip takes the letter by its very edges, the way they take every page, as if it might bruise.',
                next: 'pip',
              },
              {
                id: 'tell-her',
                label:
                  'Tell her the truth: it is a form, and someone wrote her son’s name into it.',
                effects: {
                  affinity: { freeholds: 5, abbey: -5 },
                  flags: ['d24-form-letter-told'],
                },
                response:
                  'She listens without moving. Then she takes the letter back, folds it very small, and walks out of the hall and out of the gate toward the mission road before anyone thinks to stop her.',
              },
              {
                id: 'read-kindly',
                label:
                  'Read it to her exactly as written. Let her have the kind version tonight.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { lamplight: -1 },
                  flags: ['d24-letter-read-kindly'],
                },
                response:
                  'She cries with relief, and kisses your hand, and thanks the Abbey by name. Komodo tells you afterward that it was the kindest thing anyone has done in this hall all month. He seems to mean it.',
              },
              {
                id: 'search',
                label:
                  'Send someone to walk the mission road, with this letter in their pocket.',
                effects: {},
                response:
                  'You tell her the letter will go with them. She does not thank you. She sits down on the throne-room step, unlaces her boots at last, and waits.',
                postsQuests: ['q-d24-mission-road'],
              },
              {
                id: 'ask-abbey',
                label:
                  'Write to the Abbess, politely, and ask after Dov by name.',
                effects: {
                  affinity: { abbey: 5 },
                  flags: ['asked-abbey-politely'],
                },
                response:
                  'The Abbess writes back the same day, in that lovely hand: Dov is happy, well, and very busy with his lessons. His name is written in the same ink as everything else this time.',
              },
            ],
          },
          {
            id: 'pip',
            lines: [
              'Pip holds the letter so close to their spectacles that their antennae brush the paper. They say nothing for a long time, which with Pip means certainty, not doubt.',
              {
                who: 'Pip Thread',
                npc: 'F005',
                text: 'The name is in oak-gall ink, Majesty, gone brown. The letter is lamp-black. And I know this hand. Not the lovely one. The one that wrote the name.',
              },
              {
                who: 'Pip Thread',
                npc: 'F005',
                text: 'It is the hand that keeps Hollow Bell’s register of unclaimed children. I have read every page of that register. Some of them twice, because one of them had been replaced.',
              },
              '“Who is Hollow Bell?” the mother asks. Nobody answers her.',
            ],
            options: [
              {
                id: 'pip-copy',
                label:
                  'Have Pip copy both hands into the Archive’s book, side by side.',
                effects: {
                  affinity: { 'hollow-bell': -5 },
                  local: { lamplight: 2 },
                  flags: ['d24-two-hands-copied'],
                },
                response:
                  'Pip copies the name and the letter in two columns, slowly, and underlines nothing. The mother waits on the step the whole time, and when it is done she asks again whether he is well.',
              },
              {
                id: 'search',
                label:
                  'Walk the mission road, and take Pip’s reading of the hand with you.',
                effects: {},
                response:
                  'Pip writes a note for the party in their tiny careful script. The mother does not thank you. She sits on the step and watches Pip write, as if the note were her son.',
                postsQuests: ['q-d24-mission-road'],
              },
              {
                id: 'tell-her',
                label: 'Tell her everything Pip just said.',
                effects: {
                  affinity: { freeholds: 5, abbey: -5 },
                  flags: ['d24-form-letter-told'],
                },
                response:
                  'She listens to all of it, nodding, as if being given directions. Then she folds the letter very small and walks out of the gate toward the mission road. Pip watches her go from the window and does not move until she is out of sight.',
              },
            ],
          },
        ],
      },
      {
        id: 'd24-coldbrook',
        title: 'Wenna Comes Back',
        speaker: 'Wenna Coldbrook',
        faction: 'freeholds',
        requires: { flags: ['abbey-took-coldbrook-children'] },
        lines: [
          'Wenna Coldbrook comes in with the baby on her hip and a bundle under her other arm, tied with a child’s hair ribbon. She has walked to the Abbey gate and back so many times that her skirt has worn ragged along one side of the hem.',
          'You told me I could visit, Majesty. Sister Marrow said so too. I have been to the gate four times.',
          'They are always at lessons. Or sleeping. Or at prayer. I only want to see their faces.',
          'The last time, they gave me this to take home. They said it was a kindness.',
        ],
        options: [
          {
            id: 'go-with-her',
            label: 'Send someone with her, and insist on the visit.',
            effects: {},
            response:
              'Wenna holds the baby, the only one she kept, very tight.',
            postsQuests: ['q-d24-coldbrook-visit'],
          },
          {
            id: 'trust',
            label: 'The Abbey has its rules. Be patient.',
            effects: {
              affinity: { abbey: 5, freeholds: -10 },
              flags: ['wenna-turned-away'],
            },
            response:
              'Wenna leaves without a word, and does not come to court again.',
          },
          {
            id: 'ask-bundle',
            label: 'Ask what the sisters gave her.',
            effects: {},
            response:
              'Wenna kneels on the step, sets the baby down beside her, and unties the ribbon with great care, so as not to crease it.',
            next: 'bundle',
          },
        ],
        beats: [
          {
            id: 'bundle',
            lines: [
              'Inside are three sets of children’s clothes, washed and pressed and folded into perfect squares, with the shoes paired neatly on top.',
              '“The children have grey robes now, the sister said. They will not be needing these. She said I might like something to remember them by.”',
              '“Remember them,” Wenna says again, as if testing whether the word has a second meaning. “They are nine, and six, and four.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Robes are cheaper than three sets of clothes, Your Majesty. I would not frighten her over laundry.',
              },
            ],
            options: [
              {
                id: 'ask-kiyo',
                label: 'Let Kiyo speak with her, one mother to another.',
                requires: { follower: 'F003' },
                effects: {},
                response:
                  'Kiyo comes down from the infirmary with her kettle still in her hand, and sets it down on the step without a sound.',
                next: 'kiyo',
              },
              {
                id: 'demand-return',
                label:
                  'Write to the Abbess: the Coldbrook children come home before the month is out.',
                effects: {
                  affinity: { abbey: -10, freeholds: 5 },
                  flags: ['d24-coldbrooks-demanded'],
                },
                response:
                  'The Abbess replies by return, very warmly. The children have asked to stay, she writes, and she encloses three drawings they made for their mother. All three are drawings of the same grey door.',
              },
              {
                id: 'pay-wenna',
                label:
                  'Give Wenna brass for a new start, and tell her the children eat better than she could feed them.',
                requires: { cost: 15 },
                effects: {
                  affinity: { abbey: 5, freeholds: -5 },
                  flags: ['d24-wenna-paid'],
                },
                response:
                  'Wenna takes the purse, because the baby needs it. She leaves the bundle on the throne-room step. The cleaners do not know what to do with it, so it stays there all week.',
              },
              {
                id: 'go-with-her',
                label:
                  'Send someone with her, and do not leave the gate until they see all three faces.',
                effects: {},
                response:
                  'Wenna ties the ribbon again, very neatly, and holds the baby, the only one she kept, very tight.',
                postsQuests: ['q-d24-coldbrook-visit'],
              },
              {
                id: 'trust',
                label: 'The Abbey has its rules. Take the clothes home, Wenna.',
                effects: {
                  affinity: { abbey: 5, freeholds: -10 },
                  flags: ['wenna-turned-away'],
                },
                response:
                  'Wenna picks up the bundle and the baby and leaves without a word. She does not come to court again.',
              },
            ],
          },
          {
            id: 'kiyo',
            lines: [
              'Kiyo kneels beside Wenna the way she kneels beside the wounded, and looks at the folded clothes for a long time without touching them.',
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'Where I come from, Majesty, we fold clothes this way only once. For a child who is not coming back to wear them.',
              },
              {
                who: 'Kiyo',
                npc: 'F003',
                text: 'Maybe it means something different here. This is not my country, and I am often wrong about it. But if she goes back to that gate, she should not take the baby.',
              },
              'Wenna looks down at the baby, and then up at you.',
            ],
            options: [
              {
                id: 'house-wenna',
                label:
                  'Keep Wenna and the baby inside the fortress, behind the Watch, until this is understood.',
                requires: { cost: 10 },
                effects: {
                  affinity: { abbey: -5, freeholds: 5 },
                  local: { 'gate-watch': -1 },
                  flags: ['d24-wenna-sheltered'],
                },
                response:
                  'Kiyo holds the baby while Wenna eats, and does not give it back for an hour. That night she watches the mission road from the infirmary window until the last lamp along it goes out.',
              },
              {
                id: 'go-with-her',
                label:
                  'Send someone with her to the gate. The baby stays here, with Kiyo.',
                effects: {},
                response:
                  'Wenna hands the baby to Kiyo as if handing over her own heart, and goes. Kiyo sings to it in a language nobody at court knows, the whole afternoon, without stopping.',
                postsQuests: ['q-d24-coldbrook-visit'],
              },
              {
                id: 'trust',
                label: 'Kiyo is a stranger here. The Abbey has its rules.',
                effects: {
                  affinity: { abbey: 5, freeholds: -10 },
                  flags: ['wenna-turned-away'],
                },
                response:
                  'Wenna leaves without a word, and does not come to court again. Kiyo picks up her kettle and goes back to the infirmary, and does not speak to you for the rest of the day.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 25,
    title: 'A Visitor from the Mission',
    briefings: [
      {
        id: 'abbess-coming',
        source: 'The Gate Watch',
        text: 'The Abbess herself is on the road to the fortress, on foot, with two sisters.',
        truth: true,
      },
      {
        id: 'abbey-census',
        source: 'Young Komodo’s own runner',
        text: 'The Abbey’s census lists every child by name, and every child is accounted for.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'abbess-gift',
        source: 'The kitchens',
        text: 'The Abbess sent ahead a cartload of bread for the Yard.',
        truth: true,
      },
    ],
    komodo:
      'I have seen the Abbey’s census myself, Your Majesty; it is very thorough. She is a remarkable woman. I hope the court will receive her warmly. We need friends who feed people.',
    quests: [],
    audiences: [
      {
        id: 'd25-the-abbess',
        title: 'A Visitor from the Mission',
        speaker: 'The Abbess',
        npc: 'the-abbess',
        faction: 'abbey',
        lines: [
          'The Abbess walks into the hall on her own feet, with the dust of the mission road on her hem and two young otter sisters behind her carrying baskets of bread for the Yard. She is smaller than her reputation. On her way up the carpet she stops to touch the head of a kitchen child, who leans into her hand like a cat.',
          'The hall goes quiet the way it does for weather.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Mother Abbess. You walked the whole way? You should have sent word. I would have sent the cart.',
          },
          'What a fine court, Your Majesty, and what a fine young advisor. Young Komodo has been such a friend to the mission.',
          'I walked here to say only this: the wasteland is cruel to little ones, and the Abbey takes them in. We ask nothing but to be left to our work.',
        ],
        options: [
          {
            id: 'honor',
            label: 'Honor the Abbess before the court.',
            effects: {
              affinity: { abbey: 15 },
              local: { yard: 2 },
              flags: ['abbess-honored'],
            },
            response:
              'The Abbess smiles, warm and patient. Komodo bows lower than he bows to you.',
          },
          {
            id: 'tracks',
            label: 'Ask her about the tracks on the mission road.',
            requires: { flags: ['mission-road-tracks'] },
            effects: {
              affinity: { abbey: -10 },
              local: { lamplight: 2 },
              flags: ['abbess-questioned'],
            },
            response:
              'The Abbess does not stop smiling. “Children run to us, Your Majesty. They do not run away.” Behind her, Komodo has gone very still.',
          },
          {
            id: 'cots',
            label: 'Ask her why the Coldbrook children’s cots were empty.',
            requires: { flags: ['abbey-cots-empty'] },
            effects: {
              affinity: { abbey: -15, freeholds: 5 },
              flags: ['abbess-questioned', 'abbess-warned'],
            },
            response:
              'For one moment the smile is gone, and the face beneath it is perfectly flat. Then it is back. “Lessons,” says the Abbess. “Such busy children.”',
          },
          {
            id: 'tax',
            label: 'The Abbey has never paid the crown’s tithe. It will now.',
            effects: {
              brass: 30,
              affinity: { abbey: -15 },
            },
            response:
              'The Abbess pays at once, in brass, from a purse that does not seem to empty.',
          },
          {
            id: 'wenna-named',
            label: 'Tell her Wenna Coldbrook has stopped coming to court.',
            requires: { flags: ['wenna-turned-away'] },
            effects: {
              affinity: { abbey: -5 },
              flags: ['d25-wenna-named'],
            },
            response:
              'The Abbess’s smile softens with what looks like real feeling. “Wenna is with her children now,” she says. “Isn’t that what she wanted?” Nobody in the hall can tell whether it was meant as a comfort or a confession, and nobody asks.',
          },
          {
            id: 'ask-census',
            label: 'Ask to see the census Komodo spoke of this morning.',
            effects: {},
            response:
              'The Abbess turns to Komodo with real delight, the way a grandmother turns to a child who has been mentioned in a sermon.',
            next: 'census',
          },
          {
            id: 'ask-wants',
            label:
              'Ask what she wants, since she walked so far to ask for nothing.',
            effects: {},
            response:
              'The Abbess laughs, a small warm sound, and folds her hands. “You are kind to wonder,” she says.',
            next: 'offer',
          },
          {
            id: 'teodor',
            label: 'Let Brother Teodor greet his old Abbess.',
            requires: { follower: 'F012' },
            effects: { flags: ['talk-teodor-letters'] },
            response:
              'Teodor comes forward from the followers’ bench with his hands folded, and the Abbess’s whole face opens like a window.',
            next: 'teodor',
          },
        ],
        beats: [
          {
            id: 'census',
            lines: [
              '“Our census? Oh, he has been such a help with it. He copied out the whole of last winter’s pages himself, when our sisters’ eyes were tired. Every child, by name.”',
              '“You are welcome to see it, Your Majesty. It lives at the Abbey, of course. Paper does not travel well.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Last winter, Your Majesty, before your crowning. They were short of clerks and I was short of brass. I ought to have mentioned it.',
              },
              'His claw taps the cover of his ledger twice, and then is still.',
            ],
            options: [
              {
                id: 'ask-number',
                label: 'Ask Komodo how many names he copied.',
                effects: {},
                response:
                  'Komodo looks up, surprised, as if it were an odd thing to ask a clerk.',
                next: 'komodo',
              },
              {
                id: 'send-clerk',
                label:
                  'Accept. The crown will send a clerk to read the census at the Abbey.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { lamplight: 1 },
                  flags: ['d25-census-clerk'],
                },
                response:
                  '“How lovely,” says the Abbess. “Send someone young. The stairs are steep, and we would hate to lose anyone on them.”',
              },
              {
                id: 'honor',
                label:
                  'Thank her for her openness, and honor her before the court.',
                effects: {
                  affinity: { abbey: 15 },
                  local: { yard: 2 },
                  flags: ['abbess-honored'],
                },
                response:
                  'The Abbess smiles, warm and patient. The Yard cheers her bread on the way out. Komodo bows lower than he bows to you.',
              },
              {
                id: 'tax',
                label:
                  'A house that keeps such good records can pay the crown’s tithe.',
                effects: {
                  brass: 30,
                  affinity: { abbey: -15 },
                },
                response:
                  'The Abbess pays at once, in brass, from a purse that does not seem to empty. “Write it in your census too,” she tells Komodo, kindly.',
              },
            ],
          },
          {
            id: 'komodo',
            speaker: 'Young Komodo',
            npc: 'young-komodo',
            lines: [
              '“How many? A great many, Your Majesty. Two hundred and twelve, last winter.”',
              'The Abbess smiles at him the way a teacher smiles at a pupil who has given the right answer slightly too fast.',
              {
                who: 'The Abbess',
                npc: 'the-abbess',
                text: 'Fewer this winter, thank goodness. So many have gone home.',
              },
              'Two hundred and twelve names, and on the eighth day of your reign, a sister of the Abbey said they had forty empty beds. Nobody in the hall does the sum out loud.',
            ],
            options: [
              {
                id: 'note-it',
                label:
                  'Thank Komodo, and have the Archive write down what he just said, word for word.',
                effects: {
                  local: { lamplight: 2 },
                  flags: ['d25-komodo-census-noted'],
                },
                response:
                  'Komodo watches the scribe’s pen with polite interest. “I am flattered to be recorded,” he says. He is very kind to you all evening afterward, which you will remember later.',
              },
              {
                id: 'trust-komodo',
                label:
                  'Thank him for his help to the mission. The crown is lucky in its friends.',
                effects: {
                  affinity: { abbey: 5 },
                  flags: ['d25-komodo-trusted'],
                },
                response:
                  '“The crown is very kind,” says Komodo, and bows. On her way out the Abbess pats his arm, once, the way one pats a ledger that has balanced.',
              },
              {
                id: 'honor',
                label:
                  'Say nothing of numbers. Honor the Abbess before the court.',
                effects: {
                  affinity: { abbey: 15 },
                  local: { yard: 2 },
                  flags: ['abbess-honored'],
                },
                response:
                  'The Abbess smiles, warm and patient, and the Yard cheers her bread. Komodo bows lower than he bows to you, and does not look up for a long time.',
              },
            ],
          },
          {
            id: 'offer',
            lines: [
              '“Then let me ask one thing after all.”',
              '“The map room says war is coming. War makes orphans the way rain makes mud. The Yard cannot feed them, though your Foreman is too proud to say so. The Abbey can.”',
              '“Write me a letter in your own hand that says any child without a parent may come to the Abbey, and that nobody may stop them on the road. That is all. One page.”',
              {
                who: 'Foreman Dunmore Ash',
                npc: 'dunmore-ash',
                text: 'She is right, Majesty. I cannot feed what is coming. I have been trying to work out how to tell you.',
              },
              {
                who: 'Captain Ferro Dunmark',
                npc: 'ferro-dunmark',
                text: '“Nobody may stop them on the road.” My Watch stops everything on the road, Majesty. That is what the road is for. I would want to know why one kind of traveller needs a letter.',
              },
            ],
            options: [
              {
                id: 'sign-writ',
                label:
                  'Sign the writ. Children should not starve for the sake of a suspicion.',
                effects: {
                  affinity: { abbey: 10 },
                  local: { yard: 2, 'gate-watch': -2 },
                  flags: ['d25-orphan-writ'],
                },
                response:
                  'The Abbess folds your page into her sleeve like a handkerchief. In the Yard that night they bake with her flour and sing. Captain Dunmark stands the night watch himself, facing the mission road.',
              },
              {
                id: 'writ-with-visits',
                label:
                  'Sign it, with a clause: any kin may visit any child, at any hour, without notice.',
                effects: {
                  affinity: { abbey: 5 },
                  local: { yard: 1, lamplight: 1 },
                  flags: ['d25-orphan-writ', 'd25-visiting-clause'],
                },
                response:
                  '“Any hour,” the Abbess agrees, and signs beneath you in that lovely hand. She does not argue the clause at all. That is the part Dunmark cannot stop thinking about afterward.',
              },
              {
                id: 'refuse-writ',
                label: 'No writ. The crown will feed its own orphans, somehow.',
                requires: { cost: 20 },
                effects: {
                  affinity: { abbey: -10 },
                  local: { yard: -1, 'gate-watch': 1 },
                  flags: ['d25-orphans-kept'],
                },
                response:
                  '“Somehow,” the Abbess repeats, gently, as if it were a word a child had made up. She leaves the bread anyway. The Yard eats it, and the price of the winter’s porridge goes up on the Ledger’s board by morning.',
              },
              {
                id: 'honor',
                label:
                  'Make no promises. Honor her before the court, and leave it there.',
                effects: {
                  affinity: { abbey: 15 },
                  local: { yard: 2 },
                  flags: ['abbess-honored'],
                },
                response:
                  'The Abbess smiles, warm and patient. “Another time,” she says, as if you had agreed. Komodo bows lower than he bows to you.',
              },
              {
                id: 'tax',
                label:
                  'Answer one request with another: the Abbey pays the crown’s tithe, starting today.',
                effects: {
                  brass: 30,
                  affinity: { abbey: -15 },
                },
                response:
                  'The Abbess pays at once, in brass, from a purse that does not seem to empty. “The orphans will still come,” she says. “They always do.”',
              },
            ],
          },
          {
            id: 'teodor',
            lines: [
              '“Teodor. My dear. Your letters are such a comfort to an old woman. You write so beautifully about the court. Every week, without fail.”',
              'The hall goes very still. Teodor’s round ears flatten against his head.',
              {
                who: 'Brother Teodor Lull',
                npc: 'F012',
                text: 'I told her about the soup, Majesty. Who was eating, who was sick, which families slept in the Yard. How many beds we had.',
              },
              {
                who: 'Brother Teodor Lull',
                npc: 'F012',
                text: 'I told myself it was harmless. It is always harmless, every single week, until you count the weeks.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'A good man’s letters to his old teacher, Your Majesty. There are worse things in the world. I would not shame him for them.',
              },
            ],
            options: [
              {
                id: 'teodor-turned',
                label:
                  'Say nothing now. Tonight, tell Teodor to keep writing, and what to write.',
                effects: {
                  local: { lamplight: 1 },
                  flags: ['d25-teodor-turned'],
                },
                response:
                  'You thank the Abbess for her kindness to your follower. That night Teodor sits at the Yard table with a pen you gave him and a letter you dictated, and looks like a man who has been asked to set a small fire in his own house.',
              },
              {
                id: 'teodor-stops',
                label:
                  'Tell the Abbess, before the court, that Brother Teodor’s letters end today.',
                effects: {
                  affinity: { abbey: -10 },
                  flags: ['d25-teodor-letters-stopped'],
                },
                response:
                  '“Of course,” says the Abbess, and then to Teodor, very softly: “You will be missed.” Teodor sits on the followers’ bench until dark, and nobody can tell whether he is relieved.',
              },
              {
                id: 'honor',
                label: 'Let it pass. Honor the Abbess before the court.',
                effects: {
                  affinity: { abbey: 15 },
                  local: { yard: 2 },
                  flags: ['abbess-honored'],
                },
                response:
                  'The Abbess smiles, warm and patient, and squeezes Teodor’s hand on her way out. Komodo bows lower than he bows to you. Teodor writes his letter that week as usual, and shows it to you first, unasked.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 26,
    title: 'A Friendly Raid',
    briefings: [
      {
        id: 'dry-well',
        source: 'Jackalwire runners',
        text: 'The jackals of the dry well are raiding Freehold farms and taking people, not goats.',
        truth: true,
      },
      {
        id: 'mole-truce',
        source: 'Granny Umber’s cell',
        text: 'The Mole cells will talk truce, if the talks the crown opened were meant.',
        truth: true,
      },
      {
        id: 'vane-dead',
        source: 'A gleeful Old House cousin',
        text: 'Gristle Vane was killed by his own lieutenants last night.',
        truth: false,
      },
    ],
    komodo:
      'Vane will die old and in bed, Your Majesty, out of spite. The dry-well jackals are another thing: nobody bargains with them.',
    quests: [],
    audiences: [
      {
        id: 'd26-friendly-raid',
        title: 'A Friendly Raid',
        speaker: 'Captain Gristle Vane of the Jackalwire Pack',
        npc: 'gristle-vane',
        faction: 'jackalwire',
        lines: [
          'Vane does not swagger in today. He has a bandage round one forearm, two wagons fewer than he had last week, and the look of a raider who has seen something that offends him professionally.',
          'The dry-well jackals are taking people, Majesty, not goats. Even raiders have rules. A goat you can sell back. A person you can ransom. These ones do neither.',
          'Help the Pack clear them out. I will ride in front. You can stand at the back and look imperial.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'If they neither sell nor ransom what they take, Your Majesty, then somebody is collecting it. I would want to know who before I burned the road that leads there.',
          },
        ],
        options: [
          {
            id: 'help',
            label: 'Ride with the Pack against the dry well.',
            effects: {},
            response:
              'Vane grins with every tooth. “Bring the big one. The rhino, if you have her.”',
            postsQuests: ['q-d26-dry-well'],
          },
          {
            id: 'decline',
            label: 'The Pack can handle its own kind.',
            effects: { affinity: { jackalwire: -10 } },
            response: '“Our own kind,” Vane repeats. He does not smile.',
          },
          {
            id: 'ask-where',
            label: 'Ask where the dry-well jackals take the people they catch.',
            effects: {},
            response:
              'Vane is quiet for long enough that his ear-chain stops jangling. Then he reaches into his coat and brings out a folded sack.',
            next: 'where',
          },
        ],
        beats: [
          {
            id: 'where',
            lines: [
              '“North,” says Vane. “That is the part that keeps me up. They walk them north in a line, roped at the wrist, and come back three days later with nobody and full bellies.”',
              '“We caught one of them last month. He had this on him. Good white flour, the kind nobody in the canyon has seen in years.”',
              'He shakes out the sack on the step. The stamp on it is faded but clear: a bell, with no clapper in it.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Clear the dry well and you close the road, Your Majesty. Follow it and you learn where it goes. Only one of those helps the people already roped on it, and I am not certain which.',
              },
            ],
            options: [
              {
                id: 'follow',
                label:
                  'Do not clear the well yet. Let them run, and have the Watch follow where they go.',
                effects: {
                  affinity: { jackalwire: -5, freeholds: -5 },
                  local: { 'gate-watch': 1, lamplight: 1 },
                  flags: ['d26-dry-well-followed'],
                },
                response:
                  'Vane stares at you. “You would let them take more,” he says slowly, “to see where they go.” He laughs, without any pleasure at all. “And they call us the raiders.” The Watch rides out at dusk with orders not to interfere, whatever they see.',
              },
              {
                id: 'help',
                label:
                  'Ride with the Pack, and bring every sack like this one back to the court.',
                effects: {},
                response:
                  'Vane grins with every tooth, and folds the sack back into his coat as if it were a letter. “Bring the big one. The rhino, if you have her. And bring a cart for the flour.”',
                postsQuests: ['q-d26-dry-well'],
              },
              {
                id: 'decline',
                label:
                  'The Pack can handle its own kind. The crown has no proof of anything north.',
                effects: { affinity: { jackalwire: -10 } },
                response:
                  '“Our own kind,” Vane repeats. He leaves the sack on the step. Nobody picks it up until evening, when one of the kitchen children takes it to keep bread in.',
              },
            ],
          },
        ],
      },
      {
        id: 'd26-mole-truce',
        title: 'A Genuine Truce',
        speaker: 'Keel Understone, surveyor of the Mole cells',
        faction: 'moles',
        requires: {
          flags: ['mole-talks-opened'],
          affinity: { moles: 'wary' },
        },
        lines: [
          'The surveyor the Mole cells send is not a mole at all but an armadillo, banded and scuffed from tunnel walls, with a brass lantern held up high and a surveyor’s chain coiled over one shoulder. Keel Understone unrolls a map across the throne-room step before anyone has offered them a chair.',
          'Granny Umber sent me. The talks you opened were real, so the cells will meet you halfway: water rights for the burrows, and the cells stand down.',
          'I came myself because I wanted to see if the crown would keep its word. If it does, I would work for it. Against the witches, anyway.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Water rights are forever, Your Majesty. Truces are for a season. I would at least make the season long.',
          },
        ],
        options: [
          {
            id: 'truce',
            label: 'Grant the burrows their water rights.',
            effects: {
              affinity: { moles: 20 },
              local: { 'old-houses': -3 },
              strength: { moles: 1 },
              recruitable: ['F009'],
              flags: ['mole-truce'],
            },
            response:
              'Keel nods once, the way surveyors nod at a wall that will hold. “Then I will stay a while,” they say.',
          },
          {
            id: 'half',
            label: 'Half the water now, the rest next season.',
            effects: {
              affinity: { moles: 5 },
              flags: ['mole-half-truce'],
            },
            response:
              '“Half a wall,” says Keel, “is a very good way to get wet.” They leave.',
          },
          {
            id: 'ask-survey',
            label: 'Ask Keel what the map shows.',
            effects: {},
            response:
              'Keel taps the map twice with the end of the chain, which is clearly how surveyors clear their throats.',
            next: 'survey',
          },
          {
            id: 'apology',
            label:
              'Apologise for the Mole cell the crown arrested at the Ford.',
            requires: { flags: ['moles-blamed'] },
            effects: {},
            response:
              'Keel goes very still, in the way of an armadillo deciding whether to curl up.',
            next: 'apology',
          },
        ],
        beats: [
          {
            id: 'survey',
            lines: [
              '“Two things. Here: the Old Houses dug a new cistern this spring. When they fill it, the water table drops under the burrows and the nurseries flood. That is what the manifesto meant. Nobody at your court read it that way.”',
              '“And here.” The chain moves north. “Under the Ford, there is a tunnel nobody of ours dug. Brick-lined, older than your tower, running toward the mission road. My crew went in forty paces. Then they came out, and would not go back, and would not say why.”',
              '“Neither would I. I tell you that so you know I am not a coward. I am a surveyor. Surveyors know when a wall is wrong.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Old drains, Your Majesty. The wasteland is full of them. I would sign for the water and leave the bricks to the rats.',
              },
            ],
            options: [
              {
                id: 'map-tunnel',
                label:
                  'Before any treaty, ask Keel’s crew to go back into the brick tunnel and map it.',
                effects: {
                  affinity: { moles: -5 },
                  local: { lamplight: 2 },
                  flags: ['d26-brick-tunnel-mapped'],
                },
                response:
                  'Keel rolls up the map very slowly. “Danger first, then. Water later.” They go to fetch their crew without saying goodbye. The map they send up three days afterward ends forty paces in, at a door, in very careful ink.',
              },
              {
                id: 'truce',
                label: 'Grant the burrows their water rights, cistern and all.',
                effects: {
                  affinity: { moles: 20 },
                  local: { 'old-houses': -3 },
                  strength: { moles: 1 },
                  recruitable: ['F009'],
                  flags: ['mole-truce'],
                },
                response:
                  'Keel nods once, the way surveyors nod at a wall that will hold. “Then I will stay a while,” they say, “and I will keep an eye on those bricks for you.”',
              },
              {
                id: 'half',
                label: 'Half the water now. The rest when the war is done.',
                effects: {
                  affinity: { moles: 5 },
                  flags: ['mole-half-truce'],
                },
                response:
                  '“Half a wall,” says Keel, “is a very good way to get wet.” They roll up the map, and take the brick tunnel with them.',
              },
            ],
          },
          {
            id: 'apology',
            lines: [
              '“The cell you arrested were my cousins,” says Keel, flatly. “They are out now. One of them does not talk any more. Granny says an apology costs nothing.”',
              '“I say it costs exactly what you make it cost. So. What does it cost?”',
            ],
            options: [
              {
                id: 'reparations',
                label:
                  'Pay the cousins’ families for every day they spent in the crown’s cells.',
                requires: { cost: 20 },
                effects: {
                  affinity: { moles: 10 },
                  local: { 'old-houses': -2 },
                  flags: ['d26-ford-reparations'],
                },
                response:
                  'Keel counts the brass twice and puts it in a pouch that is clearly not theirs to keep. “That is for them. Now we can talk about water.” They unroll the map again.',
                next: 'survey',
              },
              {
                id: 'truce',
                label:
                  'Grant the water rights. That is what the apology costs.',
                effects: {
                  affinity: { moles: 20 },
                  local: { 'old-houses': -3 },
                  strength: { moles: 1 },
                  recruitable: ['F009'],
                  flags: ['mole-truce'],
                },
                response:
                  'Keel nods once, slowly. “Then I will stay a while,” they say. “My cousin will want to meet you. He will not say anything. That is how you will know he means it.”',
              },
              {
                id: 'half',
                label:
                  'Half the water now. The crown has apologised; it has not surrendered.',
                effects: {
                  affinity: { moles: 5 },
                  flags: ['mole-half-truce'],
                },
                response:
                  '“Half an apology,” says Keel, “to go with half a wall.” They leave, and take the map with them.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 27,
    title: 'The Trial of Flint',
    briefings: [
      {
        id: 'flint-accused',
        source: 'The Old Houses',
        text: 'The Old Houses accuse Duchess Flint of passing crown grain to the Moles.',
        truth: true,
      },
      {
        id: 'flint-confessed',
        source: 'An Old House steward',
        text: 'Duchess Flint has already confessed.',
        truth: false,
      },
      {
        id: 'grain-sold',
        source: 'The Lamplight Archive',
        text: 'Someone sold grain to the Mole burrows at three times the market price.',
        truth: true,
      },
    ],
    komodo:
      'Flint would rather be boiled than confess to something she did not do, Your Majesty. Grain sold at three times the price is not charity. Somebody profited. It was not a tortoise.',
    quests: [],
    audiences: [
      {
        id: 'd27-trial',
        title: 'The Trial of Flint',
        speaker: 'Lady Ottoline Vask and Duchess Flint',
        npc: 'ottoline-vask',
        faction: 'old-houses',
        requires: { follower: 'F004' },
        lines: [
          'The court has never held a trial before, and it shows. The Old Houses fill the gallery in their best coats. Lady Vask stands below the dais with a sheaf of ledger copies tied in black ribbon, and beside her stands Duchess Flint, very slowly, because Flint does everything very slowly, with her shawl round her shoulders and her signet ring turned inward.',
          'The Old Houses accuse your follower of theft from the crown, Majesty. Grain, to the Moles. We ask for judgment.',
          'Flint says nothing in her own defense, only: “Read the ledgers.”',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Whatever you decide, Your Majesty, decide it today. A trial that runs into the war will be decided by the war.',
          },
        ],
        options: [
          {
            id: 'acquit',
            label: 'Acquit her on her word.',
            effects: {
              local: { 'old-houses': -4 },
              affinity: { moles: 5 },
              flags: ['flint-acquitted'],
            },
            response: 'Flint bows slowly. Lady Vask does not.',
          },
          {
            id: 'investigate',
            label: 'Read the ledgers first.',
            effects: {},
            response:
              '“Good,” says Flint. It is the most she has said all day.',
            postsQuests: ['q-d27-flint-evidence'],
          },
          {
            id: 'censure',
            label: 'Censure her, to keep the Old Houses quiet.',
            effects: {
              local: { 'old-houses': 4 },
              flags: ['flint-censured'],
            },
            response:
              'Flint accepts the censure without a word. She will remember it. So will the barracks.',
          },
          {
            id: 'ask-flint',
            label: 'Ask Flint, plainly, why she will not defend herself.',
            requires: { follower: 'F004' },
            effects: {},
            response:
              'Flint turns her head toward you, which takes a while, and the gallery waits for it.',
            next: 'silence',
          },
          {
            id: 'ask-levy',
            label: 'Ask Lady Vask whether this is about the war levy.',
            requires: { flags: ['levy-houses'] },
            effects: {},
            response:
              'Lady Vask smiles for the first time today, as if you had finally said something worth her rings.',
            next: 'levy',
          },
        ],
        beats: [
          {
            id: 'silence',
            lines: [
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: 'Because if I explain what I did, Majesty, I must explain who I did it for. And then the Houses will know where to look.',
              },
              'She lets out a long breath, which for a tortoise takes some time.',
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: 'I did give grain to the Moles. My own ration, forty days of it, to a burrow nursery the Ford had flooded. That is why my shawl hangs looser than it did. That grain was mine to go hungry on.',
              },
              {
                who: 'Duchess Flint',
                npc: 'F004',
                text: 'The rest of what went down those tunnels was sold at three times the price, and not by me. I was trying to learn by whom. I had very nearly learned it.',
              },
              'Lady Vask examines her rings with great attention.',
            ],
            options: [
              {
                id: 'pardon-public',
                label:
                  'Declare it before the court: Flint gave her own bread, and the crown honours it.',
                effects: {
                  affinity: { moles: 5 },
                  local: { 'old-houses': -3, yard: 2 },
                  flags: ['d27-flint-ration-known'],
                },
                response:
                  'The Yard cheers from the back of the hall. Flint closes her eyes. “Now they know I was looking,” she says, quietly enough that only you hear it. That night Captain Dunmark moves her bed to the room nearest the Watch, without being asked.',
              },
              {
                id: 'bury-it',
                label:
                  'Offer Lady Vask a bargain: the charge is dropped, and the crown stops asking who sold the grain.',
                effects: {
                  local: { 'old-houses': 2, lamplight: -2 },
                  flags: ['d27-grain-buried'],
                },
                response:
                  'Lady Vask accepts so smoothly that she must have come prepared to. Flint walks out free. At the door she stops and says, without turning round: “You have bought my freedom with their silence, Majesty. I will try to be worth the price.”',
              },
              {
                id: 'investigate',
                label: 'Read the ledgers, and finish what Flint started.',
                effects: {},
                response:
                  '“Good,” says Flint. Lady Vask’s rings stop tapping. Somewhere in the gallery an Old House cousin leaves early, in a hurry, for no reason anyone can name.',
                postsQuests: ['q-d27-flint-evidence'],
              },
              {
                id: 'acquit',
                label: 'Acquit her on her word. It has never once been wrong.',
                effects: {
                  local: { 'old-houses': -4 },
                  affinity: { moles: 5 },
                  flags: ['flint-acquitted'],
                },
                response:
                  'Flint bows slowly. Lady Vask does not. The ledger copies in their black ribbon go back to the Old Houses unread, and whoever sold that grain sleeps well tonight.',
              },
              {
                id: 'censure',
                label:
                  'Censure her anyway. Crown grain is crown grain, even when it is hers.',
                effects: {
                  local: { 'old-houses': 4 },
                  flags: ['flint-censured'],
                },
                response:
                  'Flint accepts the censure without a word. “The law is the law,” says Lady Vask, pleased. Flint looks at you for a long moment. She will remember it. So will the barracks.',
              },
            ],
          },
          {
            id: 'levy',
            lines: [
              '“Of course it is about the levy,” says Lady Vask, without the faintest embarrassment. “You took from the Houses to pay for a war, Majesty. The Houses take back what they can. This is politics. Your tortoise is merely standing where it happens.”',
              '“Return a third of the levy, and the charge will be found to have been a clerical error. The Houses are very forgiving of clerical errors.”',
              'Flint, beside her, says only: “Do not buy me, Majesty. I am not for sale, and neither are you.”',
            ],
            options: [
              {
                id: 'refund',
                label:
                  'Refund a third of the levy, and let the charge become a clerical error.',
                requires: { cost: 25 },
                effects: {
                  local: { 'old-houses': 3, yard: -2 },
                  flags: ['d27-levy-refunded'],
                },
                response:
                  'The charge is withdrawn before the brass is counted. Flint walks free and does not thank you. The Yard, which paid for the war in bread long before the Houses paid in brass, hears about the refund by supper.',
              },
              {
                id: 'investigate',
                label:
                  'No refunds. Read the ledgers, and let them say who profited.',
                effects: {},
                response:
                  '“Good,” says Flint. Lady Vask inclines her head, perfectly calm, and sends a page running out of the hall before the herald has finished the order.',
                postsQuests: ['q-d27-flint-evidence'],
              },
              {
                id: 'acquit',
                label: 'Acquit Flint, and tell the Houses the levy stands.',
                effects: {
                  local: { 'old-houses': -4 },
                  affinity: { moles: 5 },
                  flags: ['flint-acquitted'],
                },
                response:
                  'Flint bows slowly. Lady Vask does not. “Politics,” she says, “will continue.”',
              },
              {
                id: 'censure',
                label:
                  'Censure Flint. It costs less than a third of a levy, and she can bear it.',
                effects: {
                  local: { 'old-houses': 4 },
                  flags: ['flint-censured'],
                },
                response:
                  'Flint accepts the censure without a word. Lady Vask thanks you for your economy. The barracks hear exactly how much Flint was worth to the crown, to the brass.',
              },
            ],
          },
        ],
      },
      {
        id: 'd27-fen-count',
        title: 'What the Fen Counted',
        speaker: 'Sister Reedlight of the Mire Mothers',
        npc: 'sister-reedlight',
        faction: 'mire-mothers',
        requires: { flags: ['mire-quiet-count'] },
        lines: [
          'Sister Reedlight comes in after the gallery has emptied, with her green lantern lit at noon again. The flame inside it still does not move. She waits until the doors are shut before she speaks.',
          'On the Mirefen road, your escort counted us, Your Majesty. Quietly, as you asked. Forty-one walked, and forty-one arrived. You are the first crown that ever counted the fen and did not sell the number.',
          'Someone came to buy it. A white goat in grey, with a cord of knots at her belt. She wanted to know how many children walk with us, and how old they are.',
          'The fen does not love the Abbey. But the fen hears what moves under the mission road, and it is getting louder. We would show you, if you asked.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'A witch warning you against nuns, Your Majesty. I would ask what the warning costs before I ask what it shows.',
          },
        ],
        options: [
          {
            id: 'accept-help',
            label: 'Accept the fen’s help, whatever it shows.',
            effects: {
              affinity: { 'mire-mothers': 10, abbey: -5 },
              flags: ['d27-fen-watch'],
            },
            response:
              'Sister Reedlight bows. That night a line of small gold lights goes out across the marsh toward the mission road, and stops at the edge of the Abbey’s land, and waits there, unblinking, until dawn.',
          },
          {
            id: 'refuse-help',
            label:
              'Thank her. The crown will not trade one hidden thing for another.',
            effects: {
              affinity: { 'mire-mothers': -5 },
              local: { lamplight: 1 },
              flags: ['d27-fen-refused'],
            },
            response:
              'Sister Reedlight smiles, not unkindly. “The crown is careful,” she says. “The Abbey is counting on it.” Her lantern does not flicker on the way out.',
          },
          {
            id: 'ask-price',
            label: 'Ask what the fen wants for its help.',
            effects: {},
            response:
              'Sister Reedlight looks pleased, the way a teacher looks when a pupil asks the question she was saving.',
            next: 'price',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“A name,” she says. “Not a person. A name, freely given, written once in our book. The fen keeps names. It is how it remembers its friends.”',
              '“Your own would be best. Another’s will do, if they give it to you freely. A name is not a life, Your Majesty. Only a thread.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: '“Only a thread,” Your Majesty. Every rope in the world began that way.',
              },
            ],
            options: [
              {
                id: 'give-name',
                label: 'Write your own name in the fen’s book.',
                effects: {
                  affinity: { 'mire-mothers': 10, abbey: -5 },
                  local: { 'old-houses': -1 },
                  flags: ['d27-name-in-fen-book', 'd27-fen-watch'],
                },
                response:
                  'She opens a book bound in something green and soft, and you write your name. The ink is warm. For the rest of the day every candle in the fortress leans, very slightly, toward the throne, and that night the gold lights go out across the marsh toward the mission road.',
              },
              {
                id: 'false-name',
                label: 'Write a name that is not yours.',
                effects: {
                  affinity: { 'mire-mothers': 5, abbey: -5 },
                  flags: ['d27-false-name-given', 'd27-fen-watch'],
                },
                response:
                  'Sister Reedlight watches you write and says nothing. She closes the book. “Thank you,” she says, “whoever you are.” The gold lights go out across the marsh that night all the same. The fen, it seems, is patient about names.',
              },
              {
                id: 'refuse-help',
                label: 'No names. Not yours, not anyone’s.',
                effects: {
                  affinity: { 'mire-mothers': -5 },
                  local: { lamplight: 1 },
                  flags: ['d27-fen-refused'],
                },
                response:
                  '“The crown is careful,” she says. “The Abbey is counting on it.” She leaves, and the lantern goes with her, and the hall seems colder than the weather explains.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 28,
    title: 'Charms Against Rot',
    briefings: [
      {
        id: 'rot',
        source: 'The Yard’s foreman',
        text: 'Grain rot is spreading through the Yard’s storerooms.',
        truth: true,
      },
      {
        id: 'verge-envoy',
        source: 'The Gate Watch',
        text: 'An envoy of the Black Verge Court waits at the gate in white gloves.',
        truth: true,
      },
      {
        id: 'verge-vampires',
        source: 'Tavern talk',
        text: 'Everyone in the Black Verge Court is a vampire.',
        truth: false,
      },
    ],
    komodo:
      'Some of them carry a condition, Your Majesty; not all, and not all the same one. What matters is that they never offer anything for free. Ask what the cure costs before you ask what it cures.',
    quests: [],
    audiences: [
      {
        id: 'd28-verge-envoy',
        title: 'Charms Against Rot',
        speaker: 'The Envoy of the Black Verge',
        npc: 'the-verge-envoy',
        faction: 'black-verge',
        lines: [
          'The Envoy of the Black Verge is very tall, very still and very pale beneath a plum court coat, and wears white gloves that have never once been dirty. They bow exactly as low as protocol requires and not a hair lower. A servant sets a lacquered box on the step, and beside it a sack of the Yard’s rotten grain.',
          'The Court has heard of your rot, Majesty. We have charms against it. A gift, between neighbours.',
          'The envoy touches the grain with one gloved finger. Where the finger rests, the grey bloom fades, and the kernels underneath look clean and faintly frosted.',
          'There is one small thing. A courtier of ours has wandered from home, a black leopard with lovely manners. If they come to your gate, we would like them back.',
          {
            who: 'Foreman Dunmore Ash',
            npc: 'dunmore-ash',
            text: 'That is half the winter stores, Majesty. Half. I do not care whose gloves it comes in.',
          },
        ],
        options: [
          {
            id: 'pups',
            label:
              'Ask the envoy for the two Pack pups the plum riders carried off to their physicians.',
            requires: { flags: ['d21-verge-pups-asked'] },
            effects: {
              affinity: { 'black-verge': -5 },
              flags: ['d28-pups-asked'],
            },
            response:
              '“The little hyenas,” says the envoy, with real fondness. “They are well. They are warm. They do not cough any more.” A pause. “They will not want to come back, and their mothers would not know them if they did.” The envoy does not offer to return them, and you understand that you have been answered.',
          },
          {
            id: 'accept',
            label: 'Accept the charms, and the condition.',
            effects: {
              affinity: { 'black-verge': 15 },
              local: { yard: 3 },
              strength: { 'black-verge': 1 },
              flags: ['verge-cures-accepted', 'promised-sable'],
            },
            response:
              'The envoy bows. “The Court never forgets a neighbour.” It sounds like a threat.',
          },
          {
            id: 'test',
            label: 'Accept the charms to test them first. Promise nothing.',
            effects: { affinity: { 'black-verge': 5 } },
            response: 'The envoy smiles. “Prudent.” The gloves stay on.',
            postsQuests: ['q-d28-rot-cure'],
          },
          {
            id: 'refuse',
            label: 'The crown will deal with its own rot.',
            effects: { affinity: { 'black-verge': -10 }, local: { yard: -2 } },
            response:
              'The envoy removes one glove, finger by finger, and leaves.',
          },
          {
            id: 'ask-charm',
            label: 'Ask what the charm is made of.',
            effects: {},
            response:
              'The envoy seems genuinely amused, which is not a pleasant thing to see on that face.',
            next: 'charm',
          },
          {
            id: 'ask-sable',
            label: 'Ask why the Court wants its courtier back so badly.',
            effects: { flags: ['d28-sable-debt-heard'] },
            response:
              'The envoy folds their gloved hands, one over the other, very neatly.',
            next: 'debt',
          },
        ],
        beats: [
          {
            id: 'charm',
            lines: [
              '“Made? It is not made, Majesty. It is given. A little warmth, from someone who has warmth to spare. Grain that is never quite alive cannot rot.”',
              '“Some of us at Court carry a condition that is always cold. Others do not, and they give to those who are. It is a very old arrangement, and everyone in it is a volunteer.”',
              '“Everyone,” the envoy repeats, pleasantly, as if you had asked.',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'The Yard will eat it either way, Your Majesty. Hungry people do not ask where warmth comes from. I am not sure the crown can afford to.',
              },
            ],
            options: [
              {
                id: 'buy-charms',
                label:
                  'Take the charms, pay for them in brass, and promise the Court nothing.',
                requires: { cost: 25 },
                effects: {
                  affinity: { 'black-verge': 5 },
                  local: { yard: 2 },
                  flags: ['d28-charms-bought'],
                },
                response:
                  'The envoy accepts the purse between two gloved fingers. “Brass,” they say. “How very local.” The grain stops rotting by morning, and the cooks say it is cold in the hand, always, even fresh from the oven.',
              },
              {
                id: 'test',
                label:
                  'Test the charm first. Promise nothing until the crown knows whose warmth it is.',
                effects: { affinity: { 'black-verge': 5 } },
                response:
                  'The envoy smiles. “Prudent. Do let us know what your testers dream about.” The gloves stay on.',
                postsQuests: ['q-d28-rot-cure'],
              },
              {
                id: 'refuse',
                label:
                  'The crown will not feed its Yard on someone else’s warmth.',
                effects: {
                  affinity: { 'black-verge': -10 },
                  local: { yard: -2 },
                },
                response:
                  'The envoy removes one glove, finger by finger, and leaves. Dunmore Ash watches the lacquered box go out of the hall the way a starving man watches a door close.',
              },
              {
                id: 'accept',
                label:
                  'Accept the charms, and the condition. The Yard is hungry now.',
                effects: {
                  affinity: { 'black-verge': 15 },
                  local: { yard: 3 },
                  strength: { 'black-verge': 1 },
                  flags: ['verge-cures-accepted', 'promised-sable'],
                },
                response:
                  'The envoy bows. “The Court never forgets a neighbour.” It sounds like a threat. By evening the Yard is baking again, and the bread is very good, and nobody can get warm.',
              },
            ],
          },
          {
            id: 'debt',
            lines: [
              '“Sable carries something of ours. Not a stolen spoon. A debt, in the blood. At a certain age every courtier is given the condition. Sable was given a date, and left the night before.”',
              '“Unpaid, it will make them ill. Then it will make them dangerous to everyone near them. Your Yard. Your followers. Your little ones.” The gloves refold. “Returning Sable would be a kindness, Majesty. To your court, and to Sable.”',
              '“We would take very good care of them.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'They may even be telling the truth, Your Majesty. That is what makes the Black Verge so hard to refuse.',
              },
            ],
            options: [
              {
                id: 'accept',
                label:
                  'Accept the charms, and promise Sable back. It may truly be kinder.',
                effects: {
                  affinity: { 'black-verge': 15 },
                  local: { yard: 3 },
                  strength: { 'black-verge': 1 },
                  flags: ['verge-cures-accepted', 'promised-sable'],
                },
                response:
                  'The envoy bows. “The Court never forgets a neighbour, or a kindness.” It sounds like a threat. The Yard bakes again by evening.',
              },
              {
                id: 'test',
                label: 'Test the charms. Sable is not yours to promise.',
                effects: { affinity: { 'black-verge': 5 } },
                response:
                  'The envoy smiles. “Prudent.” The gloves stay on. On the way out they pause at the gate and look for a long time at the road, as if expecting someone.',
                postsQuests: ['q-d28-rot-cure'],
              },
              {
                id: 'refuse',
                label:
                  'No charms, and no promises. The crown keeps its own rot and its own guests.',
                effects: {
                  affinity: { 'black-verge': -10 },
                  local: { yard: -2 },
                },
                response:
                  'The envoy removes one glove, finger by finger. The hand beneath is perfectly ordinary, which is somehow worse. They leave.',
              },
            ],
          },
        ],
      },
      {
        id: 'd28-defector',
        title: 'A Plum Coat at the Gate',
        speaker: 'Sable Thorne',
        faction: 'black-verge',
        lines: [
          'Late in the day, a black leopard in a moth-eaten plum coat walks up the carpet with the posture of someone who used to have a herald. Their white gloves are mended at the fingertips. They stop exactly where petitioners are meant to stop, which nobody else has managed all month.',
          'I had hoped to arrive before my former colleagues, Majesty. I see I am late. I am asking for sanctuary, with impeccable manners.',
          'If you send me back, I will go. But I would very much rather not.',
          'Through the open doors, across the courtyard, the envoy watches without blinking.',
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Sanctuary is a word that costs whoever says it, Your Majesty. The Black Verge has a long memory and very good gloves.',
          },
        ],
        options: [
          {
            id: 'sanctuary',
            label: 'Grant sanctuary, openly.',
            effects: {
              affinity: { 'black-verge': -15 },
              recruitable: ['F016'],
              flags: ['sable-sheltered'],
            },
            response:
              'Sable bows, perfectly. The envoy, across the yard, watches without blinking.',
          },
          {
            id: 'hide',
            label: 'Hide Sable in the barracks and say nothing.',
            requires: { cost: 20 },
            effects: {
              affinity: { 'black-verge': -5 },
              recruitable: ['F016'],
              flags: ['sable-hidden'],
            },
            response:
              'The Watch is paid to forget a plum coat. Most of them do.',
          },
          {
            id: 'return',
            label: 'Return Sable to the envoy.',
            effects: {
              affinity: { 'black-verge': 20 },
              flags: ['sable-returned'],
            },
            response:
              'Sable does not argue. They walk to the envoy with their head high, and do not look back.',
          },
          {
            id: 'ask-flight',
            label: 'Ask Sable what, exactly, they are running from.',
            effects: { flags: ['talk-sable-flight'] },
            response:
              'Sable takes off one glove, looks at their own hand for a moment as if checking it is still there, and puts the glove back on.',
            next: 'flight',
          },
        ],
        beats: [
          {
            id: 'flight',
            lines: [
              '“At a certain age, the Court gives each courtier its condition. It is a great honour. There is a ceremony. Everyone wears white.”',
              '“I was given a date. I left the night before, and they had already begun, and did not finish. Some nights I run a fever that is not quite a fever. It passes. So far it has always passed.”',
              '“They will tell you I am dangerous. I may be, a little. So is everyone at this court, Majesty. I am only the one who said so first.”',
            ],
            options: [
              {
                id: 'head-start',
                label:
                  'Neither shelter nor surrender: give Sable a horse and a day’s head start.',
                requires: { cost: 10 },
                effects: {
                  affinity: { 'black-verge': -5 },
                  flags: ['d28-sable-head-start'],
                },
                response:
                  'Sable takes the reins and bows from the saddle, which is very difficult to do well. “A day,” they say, “is a long time to someone who has been counting hours.” By nightfall the envoy has sent two riders after them, at a walk, in no hurry at all.',
              },
              {
                id: 'confine',
                label:
                  'The envoy says the fever makes them dangerous. Shelter Sable, but behind a locked door.',
                requires: { flags: ['d28-sable-debt-heard'] },
                effects: {
                  affinity: { 'black-verge': -5 },
                  local: { 'gate-watch': 1 },
                  flags: ['d28-sable-confined'],
                },
                response:
                  'Sable inspects the lock of the old tower room, approves of it, and asks only for books. “Sensible,” they say. “I would have done the same.” They do not say it kindly, and they do not offer the crown their service.',
              },
              {
                id: 'sanctuary',
                label: 'Grant sanctuary, openly, fever and all.',
                effects: {
                  affinity: { 'black-verge': -15 },
                  recruitable: ['F016'],
                  flags: ['sable-sheltered'],
                },
                response:
                  'Sable bows, perfectly, and for a moment their composure slips into something younger. The envoy, across the yard, watches without blinking, and then turns and walks away very slowly.',
              },
              {
                id: 'hide',
                label: 'Hide Sable in the barracks, and let the envoy guess.',
                requires: { cost: 20 },
                effects: {
                  affinity: { 'black-verge': -5 },
                  recruitable: ['F016'],
                  flags: ['sable-hidden'],
                },
                response:
                  'The Watch is paid to forget a plum coat. Most of them do. Sable spends the night in the barracks under a borrowed blanket and wakes, for once, without a fever.',
              },
              {
                id: 'return',
                label: 'Return Sable to the envoy. It may be the kinder thing.',
                effects: {
                  affinity: { 'black-verge': 20 },
                  flags: ['sable-returned'],
                },
                response:
                  'Sable does not argue. “Kinder,” they repeat, as if tasting it. They walk to the envoy with their head high, and do not look back. The envoy takes their arm, very gently, the way one takes the arm of an invalid.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 29,
    title: 'The Mayor’s Secret',
    briefings: [
      {
        id: 'missing-page',
        source: 'The Lamplight Archive',
        text: 'A page has been cut from Hollow Bell’s town ledger, the year the drought began.',
        truth: true,
      },
      {
        id: 'mole-forgery',
        source: 'Young Komodo’s own runner',
        text: 'The cut page is a Mole forgery meant to ruin Mayor Reedbell.',
        truth: false,
        komodoLie: true,
      },
      {
        id: 'bell-water',
        source: 'Hollow Bell carters',
        text: 'Hollow Bell had water through the worst of the drought, when nobody else did.',
        truth: true,
      },
    ],
    komodo:
      'A forgery, Your Majesty, I am nearly sure; the Moles have every reason to ruin Mara. I would leave that page alone. Some ledgers are better closed.',
    quests: [],
    audiences: [
      {
        id: 'd29-mayors-secret',
        title: 'The Mayor’s Secret',
        speaker: 'Mara Reedbell, Mayor of Hollow Bell',
        npc: 'mara-reedbell',
        faction: 'hollow-bell',
        lines: [
          'Mara Reedbell comes without her sash. The town ledger is still chained to her belt, and it falls open by itself to the place where a page has been cut out close to the spine, with a very sharp knife. She sets her hand-bell on the step of the dais, mouth down, so that it cannot ring.',
          'You have heard about the page, Your Majesty. Of course you have.',
          'Hollow Bell had water when nobody else did. Water costs something. I paid it. I would pay it again. Do what you like with that.',
          {
            who: 'Keeper Abelard Vellum',
            npc: 'abelard-vellum',
            text: 'The page reached the Archive this morning, Majesty, in a plain envelope. Hollow Bell paper. Hollow Bell ink. The mayor’s own hand. I have kept records for forty years. Forgers hurry. This hand did not.',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Or it is a very patient forgery, Keeper. The Moles have had the whole drought to practise. Your Majesty, I would not let a scrap of paper unmake the one mayor who kept her town alive.',
          },
        ],
        options: [
          {
            id: 'pip',
            label: 'Let Pip read the page aloud.',
            requires: { follower: 'F005' },
            effects: {
              affinity: { abbey: -10, 'hollow-bell': -5 },
              local: { lamplight: 3 },
              flags: ['talk-pip-ledger', 'bell-abbey-ledger'],
            },
            response:
              'Pip reads it in a small, steady voice: water from the Abbey’s deep well, every season, in exchange for “the names of the town’s unclaimed children”. Mara does not look away.',
          },
          {
            id: 'expose',
            label: 'Expose the page to Hollow Bell.',
            effects: {
              affinity: { 'hollow-bell': -15 },
              local: { lamplight: 4 },
              flags: ['mara-exposed'],
            },
            response:
              'Mara nods as if she had expected nothing else. “They will choose another mayor,” she says. “They should.”',
          },
          {
            id: 'protect',
            label: 'Burn the page. The Bell needs its mayor.',
            effects: {
              affinity: { 'hollow-bell': 10 },
              local: { lamplight: -3 },
              flags: ['mara-protected'],
            },
            response:
              'Mara watches the page burn and says nothing at all. Komodo looks very relieved.',
          },
          {
            id: 'bargain',
            label: 'Keep the page, and Mara’s debt to the crown.',
            effects: {
              brass: 20,
              affinity: { 'hollow-bell': 5 },
              flags: ['mara-owes-crown'],
            },
            response: '“A debt,” says Mara. “Well. I know how those work.”',
          },
          {
            id: 'ask-cost',
            label: 'Ask Mara what the water cost, in her own words.',
            effects: {},
            response:
              'Mara looks at the hand-bell on the step instead of at you, and begins as if reading from a page she has read many times.',
            next: 'price',
          },
          {
            id: 'ask-keeper',
            label: 'Ask the Keeper who else knew the page had come.',
            effects: { flags: ['d29-runner-question'] },
            response:
              'Keeper Vellum considers the question for long enough that a candle gutters and a page boy goes to trim it.',
            next: 'envelope',
          },
        ],
        beats: [
          {
            id: 'price',
            lines: [
              '“Names. Every spring a sister came with a list of blanks, and I filled them in. Children nobody would miss. Orphans. Runaways. A boy who stole from the mill twice.”',
              '“In return, the Abbey’s deep well ran into our cisterns all through the drought. Hollow Bell lived. Every ward of it. I told myself the children were being fed and taught. The first year, I believed it.”',
              '“I stopped believing it the third year. I kept signing. The wards kept drinking.” She looks up at you, perfectly steady. “Tell me which of those children you would have traded for the far wards, Majesty, and I will tell you mine.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'She saved a town, Your Majesty. Whatever else she did, she saved a town. Burn the page and let her go on saving it.',
              },
            ],
            options: [
              {
                id: 'confession',
                label:
                  'Have Mara write the whole of it down, in her own hand, and give it to the crown.',
                effects: {
                  affinity: { abbey: -10, 'hollow-bell': -5 },
                  local: { lamplight: 2 },
                  flags: ['d29-mara-confession'],
                },
                response:
                  'Mara writes for an hour without stopping, in a hand that does not shake once. When she is done she signs it, blots it, and asks whether she may go home now and ring the evening bell. You let her. It rings at dusk exactly on time, as it always has.',
              },
              {
                id: 'refuse-water',
                label:
                  'Order Hollow Bell to refuse the Abbey’s water from today, whatever it costs the wards.',
                effects: {
                  affinity: { 'hollow-bell': -10, abbey: -10 },
                  local: { yard: -1 },
                  flags: ['d29-bell-refuses-water'],
                },
                response:
                  'Mara closes her eyes. “Then the far wards go thirsty first,” she says. “They always do.” By the end of the week the Abbey’s sisters are at the Bell’s gate with water carts, free of charge, asking nothing at all.',
              },
              {
                id: 'carry-blame',
                label:
                  'On your first morning she offered you her blame. Take this blame too: the crown made the bargain.',
                requires: { flags: ['mara-millers-levy'] },
                effects: {
                  affinity: { 'hollow-bell': 5, abbey: -5 },
                  local: { lamplight: -2, yard: -2 },
                  flags: ['d29-crown-took-blame'],
                },
                response:
                  'Mara stares at you, and for the first time since you have known her she has nothing ready to say. Then she bows very low, the way she bowed on your first morning. By nightfall the story in every tavern is that the new emperor sold children for water. It is not true. It is the kind of untrue that sticks.',
              },
              {
                id: 'expose',
                label:
                  'Expose the page to Hollow Bell. The wards should know what they drank.',
                effects: {
                  affinity: { 'hollow-bell': -15 },
                  local: { lamplight: 4 },
                  flags: ['mara-exposed'],
                },
                response:
                  'Mara nods as if she had expected nothing else. “They will choose another mayor,” she says. “They should. Tell them the water was good. It was the only good thing about it.”',
              },
              {
                id: 'protect',
                label:
                  'Burn the page. The Bell needs its mayor more than its truth.',
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { lamplight: -3 },
                  flags: ['mara-protected'],
                },
                response:
                  'Mara watches the page burn and says nothing at all. Komodo looks very relieved, and then, catching your eye, arranges his face into something more solemn.',
              },
              {
                id: 'bargain',
                label: 'Keep the page, and Mara’s debt with it.',
                effects: {
                  brass: 20,
                  affinity: { 'hollow-bell': 5 },
                  flags: ['mara-owes-crown'],
                },
                response:
                  '“A debt,” says Mara. “Well. I know how those work. I have been paying one for six years.”',
              },
            ],
          },
          {
            id: 'envelope',
            speaker: 'Keeper Abelard Vellum',
            npc: 'abelard-vellum',
            lines: [
              '“No one, Majesty. The Archive reported a page missing, three days ago. The page itself arrived this morning, and I told no one but the throne.”',
              '“And yet your advisor’s runner had already decided, before dawn, that it was a Mole forgery.” He blinks, very slowly. “I only remark on it. Remarking is most of what keepers do.”',
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'Runners hear things in doorways, Keeper. That is what they are for.',
              },
              'Komodo’s claw taps the cover of his ledger, twice, and then is still.',
            ],
            options: [
              {
                id: 'seal-page',
                label:
                  'Leave the page with the Archive, sealed, and decide nothing today.',
                effects: {
                  affinity: { 'hollow-bell': -5 },
                  local: { lamplight: 2 },
                  flags: ['d29-page-sealed'],
                },
                response:
                  'Keeper Vellum seals the page in wax with his own ring and locks it in a drawer whose key he wears. Mara goes home still mayor, and not forgiven. Komodo is charming at supper, and asks twice, lightly, where the Archive keeps its keys.',
              },
              {
                id: 'expose',
                label:
                  'Expose the page to Hollow Bell. Forgery or not, let the town judge.',
                effects: {
                  affinity: { 'hollow-bell': -15 },
                  local: { lamplight: 4 },
                  flags: ['mara-exposed'],
                },
                response:
                  'Mara nods as if she had expected nothing else. “They will choose another mayor,” she says. “They should.” Keeper Vellum writes a single line in his own book, and does not show it to anyone.',
              },
              {
                id: 'protect',
                label: 'Take Komodo’s advice. Burn the page.',
                effects: {
                  affinity: { 'hollow-bell': 10 },
                  local: { lamplight: -3 },
                  flags: ['mara-protected'],
                },
                response:
                  'Mara watches the page burn and says nothing at all. Komodo looks very relieved. Keeper Vellum watches Komodo, and not the fire.',
              },
              {
                id: 'bargain',
                label: 'Keep the page, and Mara’s debt to the crown.',
                effects: {
                  brass: 20,
                  affinity: { 'hollow-bell': 5 },
                  flags: ['mara-owes-crown'],
                },
                response:
                  '“A debt,” says Mara. “Well. I know how those work.” The Keeper hands you the page as if handing over a live coal.',
              },
            ],
          },
        ],
      },
    ],
  },
  {
    day: 30,
    title: 'Terms of Shelter',
    briefings: [
      {
        id: 'war-coming',
        source: 'Every runner at once',
        text: 'Three factions are mustering at once. The map will change by tomorrow.',
        truth: true,
      },
      {
        id: 'freeholds-weak',
        source: 'Freehold reeves',
        text: 'The Freeholds cannot hold their border alone.',
        truth: true,
      },
      {
        id: 'peace-signed',
        source: 'A hopeful herald',
        text: 'The factions have signed a peace at the Saltroad.',
        truth: false,
      },
    ],
    komodo:
      'No one has signed anything, Your Majesty. Tomorrow some banners on the map will be smaller, and some may be gone. Choose who shelters under the crown tonight.',
    quests: ['q-d30-hold-the-line'],
    audiences: [
      {
        id: 'd30-terms',
        title: 'Terms of Shelter',
        speaker: 'Envoys of three factions',
        faction: 'saltroad',
        lines: [
          'Night has come early, and the hall is lit like a camp. Three envoys stand before the throne in the order they arrived: Hester Plowright of the Freeholds, mud to her knees; a Saltroad drover with Oriel Saltmarsh’s seal on a cord; and an old mole in a quilted vest who keeps glancing up at the ceiling as if it might come down.',
          'The Freeholds, the Saltroad and the Moles have each sent an envoy. Each asks the same thing: if the war comes to us tonight, will the crown open its gates?',
          {
            who: 'Captain Ferro Dunmark',
            npc: 'ferro-dunmark',
            text: 'The fortress can shelter one of them properly, Majesty. Not two. Spread the Watch across three camps and I lose all three, and the gate with them. The others will have to fend for themselves.',
          },
          {
            who: 'Young Komodo',
            npc: 'young-komodo',
            text: 'Choose by strength, Your Majesty. The weak will be gone by morning whatever we do. The strong will remember who opened the gate.',
          },
        ],
        options: [
          {
            id: 'freeholds',
            label: 'Shelter the Freeholds.',
            effects: {
              affinity: { freeholds: 10 },
              strength: { freeholds: 1 },
              flags: ['sheltered-freeholds'],
            },
            response:
              'The Freehold envoy weeps openly. The other two leave without a word.',
          },
          {
            id: 'saltroad',
            label: 'Shelter the Saltroad.',
            effects: {
              affinity: { saltroad: 10 },
              strength: { saltroad: 1 },
              local: { ledger: 2 },
              flags: ['sheltered-saltroad'],
            },
            response:
              'Oriel Saltmarsh’s envoy bows. The caravans roll in by midnight.',
          },
          {
            id: 'moles',
            label: 'Shelter the Moles.',
            requires: { affinity: { moles: 'neutral' } },
            effects: {
              affinity: { moles: 15 },
              strength: { moles: 1 },
              local: { 'old-houses': -3 },
              flags: ['sheltered-moles'],
            },
            response:
              'The Mole envoy blinks up at the gate, as if he had never once expected it to open.',
          },
          {
            id: 'ask-losses',
            label: 'Ask each envoy what they lose if the gate stays shut.',
            effects: {},
            response:
              'The three envoys look at one another, each waiting for someone else to go first, and in the end they all speak at once.',
            next: 'losses',
          },
          {
            id: 'ask-gate',
            label:
              'Ask the Watch who else is waiting outside the gate tonight.',
            effects: {},
            response:
              'Captain Dunmark hesitates, which he never does. “A fourth envoy, Majesty,” he says. “Nobody sent for her.”',
            next: 'marrow',
          },
        ],
        beats: [
          {
            id: 'losses',
            lines: [
              {
                who: 'Hester Plowright',
                npc: 'hester-plowright',
                text: 'Eleven farms, two wells and every child under ten, Majesty. We have no walls. We have fences, and fences are for goats.',
              },
              {
                who: 'A Saltroad drover',
                text: 'The road. Lose the Saltroad tonight and the medicine stops everywhere by spring, your Yard included. Oriel says to tell you she is not begging. She says to tell you it is arithmetic.',
              },
              {
                who: 'The Mole envoy',
                text: 'Nothing we have not lost before. We have tunnels. We always survive. I only came to see whether the gate would open for us. Nobody has ever asked us what we would lose.',
              },
              {
                who: 'Hester Plowright',
                npc: 'hester-plowright',
                text: 'The Moles flooded our east field last spring. I will not sleep in the same courtyard as them, Majesty, war or no war.',
              },
            ],
            options: [
              {
                id: 'children-first',
                label:
                  'Shelter every child of all three peoples, and none of the grown.',
                effects: {
                  affinity: { freeholds: 5, saltroad: 5, moles: 5 },
                  local: { yard: -3 },
                  flags: ['d30-children-sheltered'],
                },
                response:
                  'The envoys stare at you. Then, one by one, they go out into the dark and come back with their children, and kiss them at the gate, and walk away alone. The Yard sleeps three to a bed tonight. Nobody in it sleeps.',
              },
              {
                id: 'freeholds',
                label: 'Shelter the Freeholds. They have only fences.',
                effects: {
                  affinity: { freeholds: 10 },
                  strength: { freeholds: 1 },
                  flags: ['sheltered-freeholds'],
                },
                response:
                  'Hester Plowright weeps openly, and is furious with herself for it. The drover leaves without a word. The old mole thanks you for asking, and goes back down into the dark.',
              },
              {
                id: 'saltroad',
                label: 'Shelter the Saltroad. The arithmetic is not wrong.',
                effects: {
                  affinity: { saltroad: 10 },
                  strength: { saltroad: 1 },
                  local: { ledger: 2 },
                  flags: ['sheltered-saltroad'],
                },
                response:
                  'The drover bows. The caravans roll in by midnight, medicine chests first. Hester Plowright leaves without a word, and the next morning there is a fence post driven into the ground outside the gate, with nothing on it.',
              },
              {
                id: 'moles',
                label: 'Shelter the Moles. Somebody should finally ask.',
                requires: { affinity: { moles: 'neutral' } },
                effects: {
                  affinity: { moles: 15 },
                  strength: { moles: 1 },
                  local: { 'old-houses': -3 },
                  flags: ['sheltered-moles'],
                },
                response:
                  'The Mole envoy blinks up at the gate as if he had never once expected it to open. Hester Plowright spits on your floor, very precisely, and leaves.',
              },
            ],
          },
          {
            id: 'marrow',
            speaker: 'Sister Marrow of the Abbey',
            npc: 'sister-marrow',
            lines: [
              'Sister Marrow walks in out of the dark with a lantern and a counting cord, smiling as patiently as she has smiled at every door she has ever stood at. She bows to each of the three envoys in turn.',
              '“The Abbess sends her love, Your Majesty, and her wagons. Shelter whichever grown folk you like. The Abbey will take the children of all three peoples tonight, and keep them behind our walls until the war is done.”',
              '“The wagons are already at your gate. Warm blankets. Hot milk. We have counted the beds.”',
              {
                who: 'Hester Plowright',
                npc: 'hester-plowright',
                text: 'There is a mother on my roads whose boy walked to the Abbey with a sister in grey. She came to this hall to ask after him. Ask her how often she has seen his face.',
              },
              {
                who: 'Young Komodo',
                npc: 'young-komodo',
                text: 'It solves everything, Your Majesty. The children are safe, the gate shelters the grown, and nobody has to choose which child to save. I cannot find the flaw in it.',
              },
            ],
            options: [
              {
                id: 'abbey-takes-children',
                label:
                  'Accept. Let the Abbey take the children, and let the grown fend for themselves.',
                effects: {
                  affinity: { abbey: 10 },
                  local: { yard: 1 },
                  flags: ['d30-children-to-abbey'],
                },
                response:
                  'Sister Marrow counts the children onto the wagons with her cord, knot by knot, and does not lose her place once. The wagons go north without lanterns. The envoys stand at the gate long after the sound of the wheels is gone.',
              },
              {
                id: 'send-away',
                label: 'Send Sister Marrow away, and hear the envoys out.',
                effects: { affinity: { abbey: -5 } },
                response:
                  '“Of course,” says Sister Marrow, and goes. She leaves the wagons where they are, at the gate, all night, with their lamps lit, in case you change your mind.',
                next: 'losses',
              },
              {
                id: 'tear-writ',
                label:
                  'She carries the writ you signed for the Abbess. Tear it up in front of her, then hear the envoys.',
                requires: { flags: ['d25-orphan-writ'] },
                effects: {
                  affinity: { abbey: -10 },
                  local: { 'gate-watch': 2 },
                  flags: ['d30-writ-torn'],
                },
                response:
                  'You tear the page you signed five days ago into eight pieces. Sister Marrow gathers them from the carpet, every one, and puts them in her pocket. “The Abbess will want these back,” she says, and goes.',
                next: 'losses',
              },
            ],
          },
        ],
      },
    ],
  },
]
