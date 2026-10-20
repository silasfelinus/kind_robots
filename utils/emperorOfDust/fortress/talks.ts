import type { TalkDef } from './types'

// Barracks talks (conductor emperor-of-dust t-017): one conversation a day,
// played like a throne-room scene. A talk is heard once; its closing answer
// leaves `heard:<id>`, which later talks and audiences can read. Followers
// who are away on a quest have nothing to say until they come home.

export const TALKS: readonly TalkDef[] = [
  {
    id: 'rook-1',
    follower: 'F001',
    title: 'The Raider Who Pulled Them Out',
    fromDay: 2,
    lines: [
      'Rook is on the barracks roof when you find them, legs hanging over the edge, watching the southern road where the painted wagons were. They do not look round. They knew it was you from the way the ladder creaked.',
      'You want to know why I went quiet in the hall yesterday, when the captain came. Everyone wants to know. Nobody asks.',
      'When I was small, the Ford flooded at night. My mother, my two brothers, me on her back. A Jackalwire scout rode into the water and pulled us out one at a time. Lost her wagon doing it. Never told us her name.',
      'I have been looking for her face on every painted wagon for twenty years. If you send me against the Pack, I will go. I just need you to know that I will be looking.',
    ],
    options: [
      {
        id: 'promise',
        label:
          'Promise Rook that if she is ever found, the crown will spare her.',
        effects: { flags: ['rook-spare-scout'] },
        response:
          'Rook laughs, short and surprised, and finally looks at you. “You don’t even know who she is.” “No,” you say. They nod slowly, and do not argue, and sit a little closer.',
      },
      {
        id: 'ask-name',
        label: 'Ask what Rook would do if they found her on the wrong side.',
        effects: {},
        response:
          'Rook is quiet for a long time. Below, someone in the Yard is singing badly.',
        next: 'wrong-side',
      },
      {
        id: 'duty',
        label:
          'Tell Rook that a debt to one raider cannot decide the crown’s roads.',
        effects: { local: { 'gate-watch': 1 } },
        response:
          '“No,” Rook agrees, too quickly. “It can’t.” They climb down before you do, and the next morning their saddle is packed and ready an hour before anyone else’s.',
      },
    ],
    beats: [
      {
        id: 'wrong-side',
        lines: [
          'If she was raiding a caravan, I would stop her. I would. I would just stop her slowly, and badly, and let her see my face first.',
          'And if you ordered me to bring her in for the hangman, I would bring her in. And then I think I would leave, Majesty. Not out of spite. I just could not sleep in a fortress that hanged her.',
          'I am telling you this so you can decide now, while it is only words, whether you want me in your barracks.',
        ],
        options: [
          {
            id: 'promise',
            label: 'Promise that she will never hang by the crown’s order.',
            effects: { flags: ['rook-spare-scout'] },
            response:
              'Rook lets out a breath they seem to have been holding since the Ford. “Then I’ll ride for you,” they say. “Anywhere. Even south.”',
          },
          {
            id: 'honest',
            label:
              'Tell Rook the truth: you cannot promise mercy you have not weighed.',
            effects: { flags: ['rook-honest-answer'] },
            response:
              '“Good,” Rook says, surprising you. “Someone who promised would be lying.” They hold out a paw, and you shake it, and neither of you is sure what you agreed to.',
          },
        ],
      },
    ],
  },
  {
    id: 'saffron-1',
    follower: 'F002',
    title: 'Grease and Old Paint',
    fromDay: 3,
    lines: [
      'Saffron is elbow-deep in the barracks’ broken pump when you sit down on the upturned bucket beside her. She talks without stopping work, fast and cheerful, about washers and pressure and a joke the Yard tells about the Ledger.',
      'She is talking very fast.',
      'Her toolkit lies open on the floor. Inside the lid, under a skin of grease, someone has welded a painted tin badge: a hyena’s jaw with a lightning bolt through it.',
    ],
    options: [
      {
        id: 'ask-badge',
        label: 'Ask her about the badge in the lid.',
        effects: {},
        response:
          'Saffron stops talking. The pump drips three times into the silence.',
        next: 'badge',
      },
      {
        id: 'leave-it',
        label: 'Say nothing about it. Hand her the wrench she is reaching for.',
        effects: { flags: ['saffron-badge-unasked'] },
        response:
          'She takes the wrench without looking, and keeps talking, and the pump works by supper. The lid of the toolkit is closed the next time you pass.',
      },
    ],
    beats: [
      {
        id: 'badge',
        lines: [
          'The Lightning Jaws. My first crew. I was eleven. They taught me to weld because I was small enough to crawl under the wagons. They taught me to read on the back of stolen ledgers.',
          'I left when they started taking water from farms that had none to spare. I told everyone I left because I hated them. I don’t. I welded the badge in so I could never take it out and throw it away in a temper.',
          'The Gate Watch would call that a raider’s mark in the emperor’s barracks. They would not be wrong.',
        ],
        options: [
          {
            id: 'keep-secret',
            label: 'Tell her it stays in the lid, and between the two of you.',
            effects: {
              flags: ['talk-saffron-insignia', 'saffron-badge-kept'],
            },
            response:
              'Saffron closes the lid very gently, the way you close a door on someone sleeping. “The Pack is still family,” she says. “I just want you to know which family I chose.”',
          },
          {
            id: 'tell-watch',
            label:
              'Tell her the Gate Watch must know. A secret in the barracks is a crack in the wall.',
            effects: {
              local: { 'gate-watch': 2 },
              affinity: { jackalwire: -5 },
              flags: ['talk-saffron-insignia', 'saffron-badge-reported'],
            },
            response:
              'She nods, and wipes her paws, and walks to the gatehouse herself before you can send anyone. She comes back an hour later with a Watch sergeant’s chalk mark on her toolkit and does not speak to you for the rest of the day.',
          },
        ],
      },
    ],
  },
  {
    id: 'kiyo-1',
    follower: 'F003',
    title: 'The Last of the Bitter Tea',
    fromDay: 4,
    lines: [
      'The infirmary smells of steam and something green and sharp. Kiyo is measuring dried leaves into a scale with a spoon no bigger than a fingernail, and she does not stop when you come in.',
      'This is the bitter tea, Majesty. From home. It closes wounds faster than anything the Saltroad sells, and I have perhaps thirty cups of it left in the world.',
      'The Yard had a crushed hand this morning. The Gate Watch had a fever. Your outriders will come back with worse. I can spend it on whoever is in front of me, or I can save it for the ones you will need most.',
      'I would like you to choose, please. I have been choosing for two years and I am tired.',
    ],
    options: [
      {
        id: 'whoever',
        label: 'Whoever is in front of her. A cup is not a reward.',
        effects: { local: { yard: 2 }, flags: ['kiyo-tea-for-all'] },
        response:
          'Kiyo exhales and pours. The crushed hand in the next bed will heal straight. Later in the act, when the tea runs out, she does not complain, and you remember that you were the one who chose.',
      },
      {
        id: 'ration',
        label: 'Save it for the followers on dangerous roads.',
        effects: {
          local: { 'gate-watch': 1, yard: -1 },
          flags: ['kiyo-tea-rationed'],
        },
        response:
          'Kiyo closes the tin. “Then the Yard drinks willow bark,” she says, without judgment, and writes it in the infirmary book. That night you hear the crushed hand through two stone walls.',
      },
      {
        id: 'seeds',
        label: 'Ask whether the tea could ever be grown here.',
        requires: { cost: 20 },
        effects: { local: { lamplight: 1 }, flags: ['kiyo-tea-garden'] },
        response:
          'Kiyo looks at you for a long time. “It wants rain and shade, and the wasteland has neither.” Then she takes the brass for seed trays anyway. A child of the Yard is already watering them when you next look, very seriously, with a thimble.',
      },
    ],
  },
  {
    id: 'flint-1',
    follower: 'F004',
    title: 'A Promise About Threats',
    fromDay: 5,
    lines: [
      'Duchess Flint does not sit on beds. She sits on the floor, very slowly, with her back against the wall and her shawl folded under her, and she waits for you to join her before she says anything.',
      'I have been in your court five days, Majesty, and I have heard the word “example” eleven times. Make an example of the toll. Make an example of the fen.',
      'I will carry any message you like, to anyone. But I will not carry a threat. Not once, not even a small one, not even one that would save lives. I want you to know it now, so that you never send me and find out later.',
    ],
    options: [
      {
        id: 'agree',
        label: 'Agree. Flint will never be sent with a threat.',
        effects: { flags: ['flint-no-threats'] },
        response:
          '“Thank you,” says Flint, and closes her eyes, and it occurs to you that she expected to be dismissed.',
      },
      {
        id: 'challenge',
        label:
          'Ask her what she would do if a threat could save a hundred lives.',
        effects: {},
        response:
          'Flint opens her eyes again. She has clearly been asked this before.',
        next: 'hundred',
      },
    ],
    beats: [
      {
        id: 'hundred',
        lines: [
          'Then I would ask why the only tool in the room is a knife. And I would keep asking, very slowly, until someone found another one, or until the hundred were lost and everyone had to look at me while it happened.',
          'I know which of those happens more often. I have buried both kinds. I have decided I would rather be the tortoise who was too slow than the one who learned to be quick.',
          'You do not have to agree. You only have to not use my voice for it.',
        ],
        options: [
          {
            id: 'agree',
            label: 'Agree. Her voice will never carry a threat.',
            effects: { flags: ['flint-no-threats'] },
            response:
              'Flint nods once. On the way out, she pats the doorframe, the way you might pat a horse that has carried you a long way.',
          },
          {
            id: 'refuse',
            label:
              'Tell her you cannot rule with one hand tied. You will use what works.',
            effects: { local: { 'gate-watch': 1 }, flags: ['flint-warned'] },
            response:
              '“Then I will ride with your messengers,” she says, “and stand beside the threat, and be the other thing in the room.” She does not sound angry. She sounds like someone settling in for a long winter.',
          },
        ],
      },
    ],
  },
  {
    id: 'rook-2',
    follower: 'F001',
    title: 'Two Cups on the Roof',
    fromDay: 12,
    romance: true,
    requires: { flags: ['heard:rook-1'] },
    lines: [
      'There are two cups on the barracks roof this time. Rook has already poured the second, and it has gone cold waiting.',
      'I keep coming up here to watch the southern road. I don’t think I’m looking for her any more. I think I just like that you know where to find me.',
      'That’s a strange thing to say to an emperor. Forget I said it. Or don’t.',
    ],
    options: [
      {
        id: 'stay',
        label:
          'Sit down and drink the cold tea. Stay until the stars come out.',
        effects: { flags: ['romance-rook'] },
        response:
          'You stay. Rook names the stars after roads they have ridden, and gets most of them wrong on purpose to see if you notice. You do.',
      },
      {
        id: 'friend',
        label:
          'Tell Rook gently that you value them too much to complicate it.',
        effects: { flags: ['rook-friendship'] },
        response:
          '“Too much,” Rook repeats, and smiles, and pours your tea out over the parapet so they can pour you a hot one. “All right. I’ll take too much.”',
      },
    ],
  },
]
