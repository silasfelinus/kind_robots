import type { TalkDef } from './types'
import { SECRET_TALKS } from './secretTalks'

// Barracks talks (conductor emperor-of-dust t-017): one conversation a day,
// played like a throne-room scene. A talk is heard once; its closing answer
// leaves `heard:<id>`, which later talks and audiences can read. Followers
// who are away on a quest have nothing to say until they come home.
//
// Fortress talks wait on `komodo-betrayal` (set by the engine on the Day 41
// dawn) so that nobody talks about the barracks roof once the tower has
// fallen; Act V talks require it instead. Romance arcs (conductor t-026)
// run in three steps; a later step needs the `romance-<name>` flag that only
// accepting the previous step sets, and the steps after the first wait on
// every other romance's final `romance-<name>-sealed` flag, so that the
// emperor commits to one.

const ROMANCES = [
  'rook',
  'saffron',
  'nera',
  'ash',
  'sable',
  'vesper',
] as const
type Romance = (typeof ROMANCES)[number]

/** The tower has not fallen yet. */
const IN_THE_TOWER = ['komodo-betrayal']

/** A later romance step: the tower stands and no other romance is sealed. */
const courting = (name: Romance): string[] => [
  ...IN_THE_TOWER,
  ...ROMANCES.filter((other) => other !== name).map(
    (other) => `romance-${other}-sealed`,
  ),
]

export const TALKS: readonly TalkDef[] = [
  // --- F001 Rook Bramble -------------------------------------------------------
  {
    id: 'rook-1',
    follower: 'F001',
    title: 'The Raider Who Pulled Them Out',
    fromDay: 2,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Rook is on the barracks roof, legs over the edge, watching the southern road where the painted wagons were. They don’t look round. They know the ladder’s creak.',
      'You want to know why I went quiet in the hall yesterday, when the captain came. Everyone wants to know. Nobody asks.',
      'When I was small the Ford flooded at night. My mother. My two brothers. Me on her back. A Jackalwire scout rode into the water and pulled us out one at a time. Lost her wagon doing it. Never gave her name.',
      'Twenty years I’ve looked for her face on every painted wagon. Send me against the Pack and I’ll go. I’ll just be looking.',
    ],
    options: [
      {
        id: 'promise',
        label: 'Promise Rook the crown will spare her, if she is ever found.',
        effects: { flags: ['rook-spare-scout'] },
        response:
          'Rook laughs. Short. Then looks at you. “You don’t know who she is.” “No.” They don’t argue. They sit closer.',
      },
      {
        id: 'ask-name',
        label: 'Ask what Rook would do if they found her on the wrong side.',
        effects: {},
        response:
          'Rook is quiet a long time. Below, someone in the Yard sings badly.',
        next: 'wrong-side',
      },
      {
        id: 'duty',
        label:
          'Tell Rook a debt to one raider cannot decide the crown’s roads.',
        effects: { local: { 'gate-watch': 1 } },
        response:
          '“No,” Rook says. Too quickly. “It can’t.” They climb down first. Next morning their saddle is packed an hour before anyone else’s.',
      },
    ],
    beats: [
      {
        id: 'wrong-side',
        lines: [
          'If she was raiding a caravan, I’d stop her. I would. Slowly. Badly. I’d let her see my face first.',
          'If you ordered me to bring her in for the hangman, I’d bring her in. Then I’d leave. Not out of spite. I couldn’t sleep in a fortress that hanged her.',
          'Decide now. While it’s only words.',
        ],
        options: [
          {
            id: 'promise',
            label: 'Promise she will never hang by the crown’s order.',
            effects: { flags: ['rook-spare-scout'] },
            response:
              '“Then I’ll ride for you,” Rook says. “Anywhere. Even south.”',
          },
          {
            id: 'honest',
            label:
              'Tell Rook the truth: you cannot promise mercy you have not weighed.',
            effects: { flags: ['rook-honest-answer'] },
            response:
              '“Good,” Rook says. “Someone who promised would be lying.” They hold out a paw. You shake it. Neither of you is sure what you agreed to.',
          },
        ],
      },
    ],
  },
  {
    id: 'rook-ford',
    follower: 'F001',
    title: 'Soot to the Elbows',
    fromDay: 11,
    requires: { flags: ['d10-rook-asked-mercy'], notFlags: IN_THE_TOWER },
    lines: [
      'Rook has scrubbed their paws three times since Thistledown. The soot is still in the creases. They sit on the bottom rung of the barracks ladder, turning a white rag over in their lap.',
      'You sent me under this. I went. I found her. Twenty years, and she was sitting on a wagon tongue at the edge of the smoke, eating an onion.',
      'She remembered the Ford. Remembered a little child on its mother’s back who bit her ear. “Still aches when it rains,” she said. Then she turned her wagons. Half the riders turned with her.',
      'She did it because I asked. I asked in your name. And I promised her something in your name you never gave me leave to promise.',
    ],
    options: [
      {
        id: 'ask-promise',
        label: 'Ask what Rook promised.',
        effects: {},
        response: 'Rook folds the rag into a small hard square.',
        next: 'promise',
      },
      {
        id: 'trust',
        label:
          'Tell Rook the crown keeps whatever they promised. You don’t need to hear it.',
        effects: {
          affinity: { jackalwire: 5 },
          local: { 'gate-watch': -1 },
          flags: ['rook-promise-kept'],
        },
        response:
          '“You don’t know what it was.” “No.” Rook laughs once, like something breaking loose. Next morning a Watch sergeant asks, very correctly, whether there is anything the Watch should know about the southern road.',
      },
    ],
    beats: [
      {
        id: 'promise',
        lines: [
          'One winter. Her band winters in the dry wash below the canyon. Eleven wagons. Old ones and pups. I promised the crown won’t ride on that wash till the thaw. For any reason. Even if they raid.',
          'Only coin in my pocket she’d take. I’d spend it again. But it isn’t mine. It’s yours. And the Watch’s. And every caravan’s that gets robbed this winter by someone sleeping safe in that wash.',
          'Keep it or break it. If you break it, tell me first. I’ll ride down and tell her myself. She should hear it from the one who lied.',
        ],
        options: [
          {
            id: 'keep',
            label:
              'Keep it. A promise that turned the riders from Thistledown is worth a winter.',
            effects: {
              affinity: { jackalwire: 5 },
              local: { 'gate-watch': -1 },
              flags: ['rook-promise-kept'],
            },
            response:
              '“Then I owe you a winter.” The Watch hears within the week. The sergeant who keeps the raider map pins a white rag over the dry wash.',
          },
          {
            id: 'bounded',
            label:
              'Keep it on one condition: the first raid ends it. Rook rides down tonight to tell her so.',
            effects: { flags: ['rook-promise-bounded'] },
            response:
              '“Fair,” Rook says. Then: “That’s the worst part. It’s fair.” Gone before dawn. Back the next night. They don’t say how she took it. They have half an onion.',
          },
          {
            id: 'break',
            label:
              'Break it. Rook had no right to sell the crown’s roads, even for a village.',
            effects: {
              affinity: { jackalwire: -5 },
              local: { 'gate-watch': 2 },
              flags: ['rook-promise-broken'],
            },
            response:
              'Rook doesn’t argue. They ride south alone and come back two days later with a fresh nick in one ear. They sit at the far end of the barracks table for a long time after.',
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
    requires: { flags: ['heard:rook-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Two cups on the barracks roof this time. Rook has poured the second. It has gone cold.',
      'I keep coming up here to watch the southern road. I don’t think I’m looking for her any more. I think I like that you know where to find me.',
      'Strange thing to say to an emperor. Forget it. Or don’t.',
    ],
    options: [
      {
        id: 'stay',
        label: 'Sit down. Drink the cold tea. Stay till the stars are out.',
        effects: { flags: ['romance-rook'] },
        response:
          'You stay. Rook names the stars after roads they’ve ridden. They get most of them wrong on purpose, to see if you notice. You do.',
      },
      {
        id: 'friend',
        label: 'Tell Rook you value them too much to complicate it.',
        effects: { flags: ['rook-friendship'] },
        response:
          '“Too much,” Rook says. They pour your tea over the parapet and pour you a hot one. “All right. I’ll take too much.”',
      },
    ],
  },
  {
    id: 'rook-3',
    follower: 'F001',
    title: 'The Prisoner from the Ford',
    fromDay: 27,
    romance: true,
    requires: {
      flags: ['heard:rook-2', 'romance-rook'],
      notFlags: courting('rook'),
    },
    lines: [
      'First still night in a week. Rook isn’t on the roof. They’re at the bottom of the gaol stair, back to the wall, knees up. Close enough to the cell door to hear someone coughing behind it.',
      'Watch brought in five from the Ford. Four I didn’t know. The fifth has a white streak down her muzzle and a nick out of one ear.',
      'She doesn’t remember me this time. She thinks I’ve come to read her sentence. Raiders taken at the Ford with crown cargo hang at the gate. Dunmark has the order drafted. It wants your seal.',
      'I’m not asking as your outrider. I tried that all the way down the stair. It sounded wrong. I’m asking as the one on the roof. It isn’t fair. I’m asking.',
    ],
    options: [
      {
        id: 'ask-ford',
        label: 'Ask what she did at the Ford.',
        effects: {},
        response: 'Rook lets their head fall back against the stone.',
        next: 'ford',
      },
      {
        id: 'roof-promise',
        label:
          'Remind Rook what you promised on the roof, the second day: she will never hang by the crown’s order.',
        requires: { flags: ['rook-spare-scout'] },
        effects: {
          affinity: { jackalwire: 5 },
          local: { 'gate-watch': -1 },
          flags: ['romance-rook-sealed', 'rook-scout-spared'],
        },
        response:
          '“You remembered.” “You thought I wouldn’t?” “I thought you’d have to.” You seal the pardon on the stair. A sergeant holds the lamp and says nothing. Nobody in the Watch says favourite to your face. All of them say it.',
      },
      {
        id: 'friend',
        label:
          'Tell Rook you cannot be their judge and their sweetheart in one night. Tonight you are the judge.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['rook-friendship'],
          clearFlags: ['romance-rook'],
        },
        response:
          '“Kindest no anyone’s ever given me,” Rook says. “I hate it.” They go up to the roof alone. In the morning there is tea outside your door. Hot.',
      },
    ],
    beats: [
      {
        id: 'ford',
        lines: [
          'She drove the wagon. That’s all. The others had the knives. When the Watch came she stopped the horses instead of running them through the crowd.',
          {
            who: 'A Gate Watch sergeant',
            text: 'She did, Majesty. Stopped the team. She also drove it to the Ford, where a Saltroad driver lost two fingers. The law doesn’t ask who held the knife. It asks who was there.',
          },
          'The sergeant stands at the bottom of the stair with a lamp. Rook doesn’t look at him.',
          'Pardon her and every sergeant in the Watch will know why. They’ll say the emperor has a favourite. They’ll be right.',
        ],
        options: [
          {
            id: 'pardon',
            label: 'Pardon her. Let them say the emperor has a favourite.',
            effects: {
              affinity: { jackalwire: 5 },
              local: { 'gate-watch': -2 },
              flags: ['romance-rook-sealed', 'rook-scout-spared'],
            },
            response:
              'You seal it by the sergeant’s lamp. Rook unlocks the cell. The old raider walks past them without a word. At the top of the stair she looks back. You never learn what she saw. That night Rook doesn’t watch the southern road once.',
          },
          {
            id: 'exile',
            label:
              'Commute it to exile beyond the Saltroad. A sentence, not a favour.',
            effects: {
              local: { 'gate-watch': -1 },
              flags: ['romance-rook-sealed', 'rook-scout-exiled'],
            },
            response:
              '“Exile. She’s old. The Saltroad’s long.” A pause. “Ruler’s answer. I’ll take it from the ruler.” Later, on the roof, they take your paw. The other answer is the one they’re taking from you.',
          },
          {
            id: 'law',
            label:
              'Let the law stand. Then stand at the gate beside Rook when it is done.',
            effects: {
              affinity: { jackalwire: -5 },
              local: { 'gate-watch': 2 },
              flags: ['rook-scout-hanged', 'rook-heartbroken'],
              clearFlags: ['romance-rook'],
            },
            response:
              'Dawn at the gate. Rook holds your sleeve the whole time. Afterwards: “I said I couldn’t sleep in a fortress that hanged her. I was wrong. I can sleep here.” They never carry the second cup up to the roof again.',
          },
          {
            id: 'friend',
            label:
              'Tell Rook this is why you cannot be both things to them. You will judge her as the crown.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['rook-friendship'],
              clearFlags: ['romance-rook'],
            },
            response:
              '“As the crown,” Rook says. “All right.” The sergeant steps aside. Rook goes up the stair without hurrying. Next morning they’re at roll call on time. Polite. Exact.',
          },
        ],
      },
    ],
  },
  {
    id: 'rook-4',
    follower: 'F001',
    title: 'Tracks Toward the Abbey',
    fromDay: 42,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Rook has drawn two lines of prints in the dirt by the hideout fire with a stick. One deep. One shallow. Same direction.',
      'Night the tower fell, I found his tracks in the postern mud. Komodo’s. He drags the left foot when he’s carrying the ledger. He was carrying it.',
      'North. Mission road. A cart met him at the second well. Two sisters walking beside it. I could have followed. I still can. A track like that stays warm a week, if you can read a cold one.',
      'Tell me what to do when I find him. Tell me now. So I don’t decide it on the road with him looking at me.',
    ],
    options: [
      {
        id: 'bring-back',
        label:
          'Find him and bring him back alive. He answers to the crown, not to a knife in a ditch.',
        effects: { flags: ['rook-hunts-komodo'] },
        response:
          '“Alive,” Rook says. They’d hoped for something else. They take two days’ bread, a rope, and no weapon you can see. The drawing is gone by morning.',
      },
      {
        id: 'ask-want',
        label: 'Ask what Rook wants to do.',
        effects: {},
        response: 'Rook scuffs out the deep prints. Then the shallow ones.',
        next: 'want',
      },
      {
        id: 'stay',
        label:
          'Leave the tracks. The crown needs its outrider here, not on the mission road.',
        effects: { flags: ['rook-stays-close'] },
        response:
          '“Here,” Rook says. “All right. Here.” The stick goes on the fire. They sit with their back to the north all night.',
      },
      {
        id: 'sealed',
        label:
          'Tell Rook you have already lost one friend to that road. Not them too.',
        requires: { flags: ['romance-rook-sealed'] },
        effects: { flags: ['rook-stays-close'] },
        response:
          'Rook looks at you across the fire. Then they come round it and sit against your shoulder, like on the roof. The drawing stays till the rain takes it.',
      },
    ],
    beats: [
      {
        id: 'want',
        lines: [
          'I taught him to ride, the first month. He was terrible. He laughed at himself the whole time. I liked him for it.',
          'I want to find him and ask why. If he gave me a good answer I’d let him go. If he gave me a bad one I’d let him go too.',
          'That’s why you shouldn’t send me.',
        ],
        options: [
          {
            id: 'send',
            label: 'Send them anyway. Somebody should ask him why.',
            effects: { flags: ['rook-hunts-komodo'] },
            response:
              '“Somebody,” Rook says. Gone before light. By your bedroll: a cold cup of tea, and a stick drawing of a rider in the dirt. Long ears. Facing north.',
          },
          {
            id: 'together',
            label: 'Then stay. You will ask him together, at the end.',
            effects: { flags: ['rook-stays-close'] },
            response:
              '“Together.” Rook rubs out the last print with their heel.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042): one hard question each, spread so the barracks
  // never goes quiet for long.
  {
    id: 'rook-saddle',
    follower: 'F001',
    title: 'Crown Leather',
    fromDay: 7,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Two saddles on the stable rail. One is Rook’s: cracked, patched, older than the fortress. The other is new Watch leather with the crown pressed into the flap.',
      'Dunmark sent it up. Decent of him. Riders in crown leather get waved through the posts. Riders in old leather get searched.',
      'Thing is, the Pack knows my saddle. They let me ride close because of it. Put me in yours and I’m one more Watch rider. I get through the posts. I stop getting close.',
    ],
    options: [
      {
        id: 'crown',
        label: 'Ride in the crown’s leather. The posts matter more.',
        effects: { local: { 'gate-watch': 1 }, flags: ['rook-crown-saddle'] },
        response:
          'Rook buckles it on without a word. The old saddle goes on a peg by the door. They touch it every morning on the way out.',
      },
      {
        id: 'old',
        label: 'Keep the old saddle. Let the Watch search them.',
        effects: { local: { 'gate-watch': -1 }, flags: ['rook-old-saddle'] },
        response:
          'Rook sends the new one back with thanks. The posts search them twice a week after that. Slowly. They come in late and don’t mention it.',
      },
    ],
  },
  {
    id: 'rook-cistern',
    follower: 'F001',
    title: 'A Cup on a String',
    fromDay: 17,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Rook comes in at dusk with dust to the knees and a full waterskin. Nobody comes off the north ridge with a full waterskin.',
      'Cistern. Old one, under a flat stone where the track bends. Somebody keeps it clean. There’s a tin cup on a string.',
      'One family, I’d guess. Freeholders. It keeps them alive in the dry months. Put it on the crown’s map and the Watch drinks there too. Then the whole ridge. In a month it’s mud.',
      'Leave it off, and the Watch keeps riding that track dry.',
    ],
    options: [
      {
        id: 'mark',
        label: 'Mark it. The Watch rides that ridge for everyone.',
        effects: { local: { 'gate-watch': 1 }, flags: ['rook-cistern-marked'] },
        response:
          'Rook draws a small square on the map. In three weeks there is a queue at the stone. The cup on the string is gone. Nobody knows who took it.',
      },
      {
        id: 'leave',
        label: 'Leave it off the map. It belongs to whoever kept it clean.',
        effects: { affinity: { freeholds: 5 }, flags: ['rook-cistern-kept'] },
        response:
          '“Then I never found it.” Rook hands you the last of the water. A week later a Watch rider comes off the ridge with his tongue split from thirst.',
      },
    ],
  },
  {
    id: 'rook-post',
    follower: 'F001',
    title: 'The Ford Post',
    fromDay: 24,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Rook is sitting on the woodpile with their ears flat. They have been sitting there since the Ford.',
      'Sergeant at the Ford post. Good one. Eleven years. The Pack crossed the shallows last night, twenty wagons, and he watched them go. Didn’t ring. Didn’t ride.',
      'His brother drives the third wagon. He told me so. Then he asked me not to tell you. I said I’d ask you first. That’s as far as I’d go for him.',
    ],
    options: [
      {
        id: 'report',
        label: 'Report him to Dunmark. A post that doesn’t ring is no post.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['rook-sergeant-reported'],
        },
        response:
          'Dunmark breaks him to the ranks in the Yard at noon. He takes it standing. Rook doesn’t watch. That evening the sergeant’s stripes are on the woodpile where Rook sat.',
      },
      {
        id: 'quiet',
        label: 'Move him off the Ford yourself. Quietly. No book.',
        effects: {
          affinity: { jackalwire: 5 },
          local: { 'gate-watch': -1 },
          flags: ['rook-sergeant-moved'],
        },
        response:
          'He goes to the stables. Nobody asks why. The Watch asks anyway, among itself. The new man at the Ford rings the bell at every shadow for a month.',
      },
    ],
  },
  {
    id: 'rook-knife',
    follower: 'F001',
    title: 'Somebody’s Knife',
    fromDay: 31,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Rook puts a knife on your table. Bone handle. A name scratched in it you can’t read.',
      'Rider in the ditch past the second well. No colours. Not ours. Not anybody’s. He was going fast. He wanted this taken to his mother. Canyon road. Two days down, two back.',
      'War’s on. You need your outrider. I know. I also said yes to him. He was holding my sleeve.',
    ],
    options: [
      {
        id: 'go',
        label: 'Let Rook go. Four days. The crown can ride blind that long.',
        effects: { local: { 'gate-watch': -1 }, flags: ['rook-carried-knife'] },
        response:
          'Rook is gone before light. Four days the Watch rides the war roads without them and loses a wagon to a gully nobody marked. Rook comes back thin and says, “She knew it by the handle.”',
      },
      {
        id: 'send',
        label: 'Keep Rook. Send the knife down with the next caravan.',
        effects: { flags: ['rook-knife-sent'] },
        response:
          'A driver takes it. Rook watches the wagon all the way to the bend. Nobody ever hears if it arrived. Rook never asks.',
      },
    ],
  },
  {
    id: 'rook-route',
    follower: 'F001',
    title: 'The Ridge Route',
    fromDay: 37,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Rook comes up the barracks ladder fast and sits on the top rung, which they never do.',
      'Komodo asked me for the ridge route. The one nobody uses. Said the crown wants it for a courier. Polite. Had a pencil ready.',
      'He speaks for you. If I say no, I’m saying I don’t trust him. If I say yes, there’s one more person who knows the only quiet way out of here.',
    ],
    options: [
      {
        id: 'give',
        label: 'Give him the route. He speaks for the crown.',
        effects: { flags: ['rook-gave-komodo-route'] },
        response:
          'Rook draws it for him on the back of a dispatch. Komodo thanks them and folds it twice. Rook can’t say why the fold bothers them.',
      },
      {
        id: 'keep',
        label:
          'Tell Rook to keep it. Nobody has the ridge route but the two of you.',
        effects: { flags: ['rook-kept-route'] },
        response:
          'Komodo doesn’t ask again. He thanks Rook for their caution in front of the whole barracks. It sounds like praise. Rook eats alone that night.',
      },
    ],
  },
  {
    id: 'rook-postern',
    follower: 'F001',
    title: 'The Man Who Opened the Postern',
    fromDay: 47,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Rook brings a Watchman to the hideout fire by the collar. Young. Thin. Still in the tower’s grey.',
      'Found him with the hosts’ goats. He opened the postern the night the tower fell. Says Komodo told him it was your order. Says he believed it.',
      'He’s got a wife down the valley. He came here to find you and say sorry. Then he lost his nerve and hid with the goats. I believe that part.',
    ],
    options: [
      {
        id: 'judge',
        label:
          'Judge him at the fire, in front of everyone who lost the tower.',
        effects: { local: { 'gate-watch': 1 }, flags: ['rook-postern-judged'] },
        response:
          'The court hears him out. Nobody speaks for him. He is sent down the valley without his grey, on foot. Rook walks him to the last cairn and comes back with the coat over one arm.',
      },
      {
        id: 'spare',
        label: 'Let him go. He was lied to. So were you.',
        effects: { flags: ['rook-postern-spared'] },
        response:
          'He cries. Rook looks away while he does it. Two Watchmen at the fire get up and leave. One doesn’t come back.',
      },
      {
        id: 'route',
        label:
          'Tell the fire you gave Komodo the ridge route yourself. You believed him too.',
        requires: { flags: ['rook-gave-komodo-route'] },
        effects: { flags: ['rook-postern-spared', 'rook-shared-blame'] },
        response:
          'It goes quiet. The Watchman stares at you. Then Rook sits down beside him, close, the way they sit with you on the roof. Nobody gets up to leave.',
      },
    ],
  },
  // --- F002 Saffron Kett -------------------------------------------------------
  {
    id: 'saffron-1',
    follower: 'F002',
    title: 'Grease and Old Paint',
    fromDay: 3,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Saffron is elbow-deep in the barracks’ broken pump. You sit on the bucket beside her. She talks without stopping work. Washers. Pressure. A joke the Yard tells about the Ledger.',
      'She is talking very fast.',
      'Her toolkit lies open on the floor. Inside the lid, under a skin of grease, someone has welded a painted tin badge. A jackal’s jaw. A lightning bolt through it.',
    ],
    options: [
      {
        id: 'ask-badge',
        label: 'Ask her about the badge in the lid.',
        effects: {},
        response: 'Saffron stops talking. The pump drips three times.',
        next: 'badge',
      },
      {
        id: 'leave-it',
        label: 'Say nothing about it. Hand her the wrench she’s reaching for.',
        effects: { flags: ['saffron-badge-unasked'] },
        response:
          'She takes it without looking. Keeps talking. The pump works by supper. Next time you pass, the lid is shut.',
      },
    ],
    beats: [
      {
        id: 'badge',
        lines: [
          'The Lightning Jaws. My first crew. I was eleven. They taught me to weld because I was small enough to crawl under the wagons. Taught me to read on the backs of stolen ledgers.',
          'I left when they started taking water from farms that had none to spare. I told everyone I hated them. I don’t. I welded the badge in so I could never take it out and throw it away in a temper.',
          'The Watch would call that a raider’s mark in the emperor’s barracks. They wouldn’t be wrong.',
        ],
        options: [
          {
            id: 'keep-secret',
            label: 'Tell her it stays in the lid, and between the two of you.',
            effects: {
              flags: ['talk-saffron-insignia', 'saffron-badge-kept'],
            },
            response:
              'Saffron shuts the lid like a door on someone sleeping. “The Pack is still family,” she says. “I just want you to know which family I chose.”',
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
              'She nods. Wipes her paws. Walks to the gatehouse herself before you can send anyone. An hour later she is back with a sergeant’s chalk mark on the toolkit. She doesn’t speak to you the rest of the day.',
          },
        ],
      },
    ],
  },
  {
    id: 'saffron-2',
    follower: 'F002',
    title: 'Welding by Lamplight',
    fromDay: 9,
    romance: true,
    requires: { flags: ['heard:saffron-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Midnight. The workshop lamp is still lit. Saffron is under a cart axle with her goggles down. You crouch with a second lamp and she starts talking before she rolls out. Grease. A Watch joke. How the Ledger counts nails as if nails could lie.',
      'She is talking very fast again.',
      'Then she stops. Lies there looking up at you through scratched goggles. You keep coming down here. Nobody comes down here. It’s cold, it stinks of hot iron, and I talk too much.',
      'So either the crown has a lot of broken axles I don’t know about. Or.',
      'She pushes the goggles up. Two pale rings in the soot. She waits.',
    ],
    options: [
      {
        id: 'or',
        label: 'Finish her sentence. “Or.”',
        effects: { flags: ['romance-saffron'] },
        response:
          'Saffron laughs so hard she cracks her head on the axle. Swears. Laughs again. “Or,” she says, holding her head. You hold the lamp until dawn while she explains the whole axle. You both know it isn’t the axle she’s explaining.',
      },
      {
        id: 'chalk',
        label:
          'Ask first whether she has forgiven you for the Watch’s chalk mark.',
        requires: { flags: ['saffron-badge-reported'] },
        effects: {},
        response:
          'Her paw goes to the toolkit lid. The chalk is rubbed nearly away. Not quite.',
        next: 'chalk',
      },
      {
        id: 'ferry',
        label:
          'Tell her you came to ask how the ferry below the bridge is coming. See if she believes it.',
        requires: { flags: ['d05-saffron-ferry'] },
        effects: {},
        response:
          '“The ferry,” Saffron says. Flat. “Right. Very interested in the ferry.”',
        next: 'ferry',
      },
      {
        id: 'friend',
        label:
          'Tell her you come down because she’s the best company in the fortress. That’s all it is.',
        effects: { flags: ['saffron-friendship'] },
        response:
          'Saffron rolls back under the axle where you can’t see her face. “Best company,” she tells the axle. “Good. I’ll take it.” After a while she starts talking again. Slower.',
      },
    ],
    beats: [
      {
        id: 'chalk',
        lines: [
          'I was angry a week. Then I was angry I wasn’t angry any more. You were right. A raider’s mark in the barracks is a crack in the wall. I didn’t want to be the crack.',
          'The sergeant who chalked it brings me his broken buckles now. He breaks them on purpose. So he can come by and say sorry without saying it.',
          'So I’m not angry. I’m something else. I don’t know what you want me to be.',
        ],
        options: [
          {
            id: 'or',
            label:
              'Tell her you want to find out what she is when she isn’t angry.',
            effects: { flags: ['romance-saffron'] },
            response:
              '“Oh,” Saffron says. Then again, quieter. She pulls the goggles down so she has somewhere to hide. You stay until the lamp gutters. She lets you hold the axle steady. In the workshop that is an honour.',
          },
          {
            id: 'friend',
            label: 'Tell her you hope she’ll be your friend. Leave it there.',
            effects: { flags: ['saffron-friendship'] },
            response:
              '“Friend,” Saffron says, checking the word for cracks. “I can do friend.” She hands you a wrench. You hold it. For an hour you are both very interested in the axle.',
          },
        ],
      },
      {
        id: 'ferry',
        lines: [
          'Coming along. Rope’s good. Vane’s people sit on the far bank and watch me work. They say nothing. I say nothing. The river says plenty.',
          'Half of them used to be mine. I taught their pups to splice rope. Now I’m building the thing that kills their bridge toll, with your brass. They watch me like a ghost in your colours.',
          'And you come down at midnight to ask about it. Which you don’t care about. So.',
        ],
        options: [
          {
            id: 'or',
            label: 'Admit it. You don’t care about the ferry.',
            effects: { flags: ['romance-saffron'] },
            response:
              '“Good,” Saffron says. “It’s a rope and a raft.” She grins so wide the soot cracks. You stay till dawn. She doesn’t mention the ferry once.',
          },
          {
            id: 'friend',
            label:
              'Insist you care about the ferry. And about her. As a friend.',
            effects: { flags: ['saffron-friendship'] },
            response:
              'Saffron looks at you a long moment. Nods. Then she tells you every knot of the ferry, for an hour. You listen to all of it. She understands that is its own answer.',
          },
        ],
      },
    ],
  },
  {
    id: 'saffron-pin',
    follower: 'F002',
    title: 'A Filed Pin',
    fromDay: 18,
    requires: {
      flags: ['heard:saffron-1', 'engine-sabotaged'],
      notFlags: IN_THE_TOWER,
    },
    lines: [
      'Saffron puts something on your table. A governor pin from a water engine. Finger-long. A neat bright groove filed halfway through.',
      'Fiddler brought it up from the canyon. Engine’s been whining at night. The pups who mind it don’t know why. I know why. It’s my engine.',
      'Someone fixed it to fail. Someone who learned from my drawings. They put the groove exactly where I would have. If I were the kind of person who did that.',
      'I’m asking once. Did the crown order it?',
    ],
    options: [
      {
        id: 'confess',
        label:
          'Tell her the truth. Yes. You ordered it, to protect Hollow Bell’s stream.',
        effects: { flags: ['saffron-told-sabotage'] },
        response:
          'Saffron doesn’t move. Then she sits on the bench across from you. Carefully. As if the bench might be filed too.',
        next: 'truth',
      },
      {
        id: 'confess-midnight',
        label:
          'Tell her the truth, and that you were afraid to, because of the workshop at midnight.',
        requires: { flags: ['romance-saffron'] },
        effects: { flags: ['saffron-told-sabotage'] },
        response:
          '“Don’t,” Saffron says. “Don’t put the workshop in this.” She sits. Her paw shakes on the pin.',
        next: 'truth',
      },
      {
        id: 'deny',
        label: 'Tell her no. The crown had nothing to do with it.',
        effects: { flags: ['saffron-lied-to'] },
        response:
          'Saffron looks at you a long time. “All right.” The pin goes in her apron pocket. She believes you, or decides to. You can’t tell which. Neither can she.',
      },
    ],
    beats: [
      {
        id: 'truth',
        lines: [
          'A month. In a month the canyon drinks from that engine and it stops. The pups who mind it take the blame. Somebody gets hurt finding out why. You knew all that.',
          'I’d have done it. Ten years ago. For the Pack, against some town. That’s what makes me sick. You did exactly what I used to do.',
          'I can go down and fix it in two days. Nobody would know it was touched. Or I leave it, and keep your secret for you. You decide. You started it.',
        ],
        options: [
          {
            id: 'unpick',
            label:
              'Let her fix it properly. Hollow Bell will have to find water another way.',
            effects: {
              affinity: { jackalwire: 5, 'hollow-bell': -5 },
              flags: ['saffron-unpicked-sabotage'],
            },
            response:
              'Two days. She comes back with grease to the shoulder and the filed pin in her pocket. “It sips now. Somebody at the Bell will see their stream drop and come with a crowbar. Back where we started.” She sounds almost cheerful.',
          },
          {
            id: 'keep-secret',
            label:
              'Ask her to leave it, and keep the secret. The Bell needs that stream more than the canyon needs that engine.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['saffron-keeps-sabotage'],
            },
            response:
              'Saffron nods. Once. The pin goes on the shelf over her bench, where she sees it every morning. She doesn’t speak of the canyon to you again. When she laughs now, it comes half a beat late.',
          },
        ],
      },
    ],
  },
  {
    id: 'saffron-3',
    follower: 'F002',
    title: 'A Pass Without a Name',
    fromDay: 20,
    romance: true,
    requires: {
      flags: ['heard:saffron-2', 'romance-saffron'],
      notFlags: courting('saffron'),
    },
    lines: [
      'Dusk on the wall walk. Saffron has a letter sealed with a painted feather. She has opened and shut it so often the wax is coming off in flakes.',
      'Old Mother Tansy’s dying. Captained the Lightning Jaws when I was eleven. Taught me to weld with a candle and a spoon. Only person who ever called me clever before I’d proved it.',
      'She wants to see me. The canyon road runs past two Watch posts. A crown pass goes in the Watch book. Saffron Kett, emperor’s machinist, to the Pack camp. Everybody reads the Watch book.',
      'So I want a pass with no name on it. Just your seal. I know what I’m asking you to bend. I want to be somebody going to say goodbye to an old woman. And then coming home to you.',
    ],
    options: [
      {
        id: 'unnamed',
        label: 'Seal a pass with no name on it.',
        effects: {
          local: { 'gate-watch': -2 },
          flags: ['saffron-pass-unnamed'],
        },
        response:
          'You seal it with wax from her own letter. Only wax to hand. She holds the blank pass to the light like a weld. “Nobody’s done anything wrong for me before. Only with me.” Three days later a sergeant reports an unnamed traveler passed his post twice under the crown’s seal. He asks whether to write anything down. You say no. He writes that down.',
      },
      {
        id: 'named',
        label:
          'Seal a pass with her name on it. Go openly. The Watch book can say what it likes.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['saffron-pass-named'],
        },
        response:
          'She reads her own name three times. “Everyone will know.” “Yes.” She folds it into her apron. “All right.” She comes back on the third day with ash on her sleeves and a tin spoon in her pocket. At supper she sits beside you. In front of the whole barracks. First time.',
      },
      {
        id: 'ask-tansy',
        label: 'Ask what Mother Tansy will want from her, at the end.',
        effects: {},
        response: 'Saffron turns the letter over. And over.',
        next: 'tansy',
      },
      {
        id: 'friend',
        label:
          'Seal her a pass. Tell her you would rather be her friend than the one she comes home to.',
        effects: {
          flags: ['saffron-friendship'],
          clearFlags: ['romance-saffron'],
        },
        response:
          '“Friend,” she says. Weighing it. “All right. A friend can still walk me to the gate.” You do. She hugs you at the postern, quick and hard, and is gone down the canyon road.',
      },
    ],
    beats: [
      {
        id: 'tansy',
        lines: [
          'To come home. She’ll ask. She asks everyone at the end. She asked my mother.',
          'And I don’t know what I’ll say. I’ll have her paw in mine and the whole Pack outside the wagon listening. I don’t know if I’ll say no.',
          'You want me to promise I’ll come back, I’ll promise. I don’t know if I’m the kind who keeps it. Not in a wagon full of the people who raised me.',
        ],
        options: [
          {
            id: 'trust',
            label:
              'Tell her not to promise anything. Seal the nameless pass. Trust her.',
            effects: {
              local: { 'gate-watch': -2 },
              flags: ['saffron-pass-unnamed', 'saffron-trusted'],
            },
            response:
              '“That’s not fair,” she says. “Now I have to come back.” She goes at dawn. Nameless. She is back on the third night, early, and wakes you to say so.',
          },
          {
            id: 'promise',
            label:
              'Ask her to promise she will come back. Seal the pass with her name on it.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['saffron-pass-named', 'saffron-promised-return'],
            },
            response:
              '“I promise,” Saffron says. Carefully. Twice. Like a seam she isn’t sure of. She keeps it. You never ask what she told the old woman. She never says.',
          },
          {
            id: 'friend',
            label:
              'Tell her to go as free as she can. You will be her friend either way.',
            effects: {
              flags: ['saffron-friendship'],
              clearFlags: ['romance-saffron'],
            },
            response:
              '“As free as I can,” Saffron says. “From you too, you mean.” She isn’t angry. She turns it over like a tool she didn’t ask for.',
          },
        ],
      },
    ],
  },
  {
    id: 'saffron-4',
    follower: 'F002',
    title: 'The Remembering Fire',
    fromDay: 33,
    romance: true,
    requires: {
      flags: ['heard:saffron-3', 'romance-saffron'],
      notFlags: courting('saffron'),
    },
    lines: [
      'Saffron has cleaned her goggles. She never does. She is wearing an apron without a single burn in it. You didn’t know she owned one. She stands in your doorway like someone who rehearsed this and is losing it line by line.',
      'Every autumn the Pack lights a remembering fire in the canyon. You bring the one you’ve chosen. Stand them in front of everyone. Everybody gets a turn telling them what you were like as a pup. It’s mortifying. Best night of the year.',
      'I want to bring you. As mine. Not the emperor visiting raiders. The one I’m bringing home.',
      'I know what it costs, with a war coming. The Freeholds will say the crown sleeps with the Pack. The Watch will say worse. Anyone from Thistledown stops speaking to me. So choose. And choose properly.',
    ],
    options: [
      {
        id: 'openly',
        label: 'Go to the remembering fire openly, as hers.',
        effects: {
          affinity: { jackalwire: 10, freeholds: -5 },
          local: { 'gate-watch': -1 },
          flags: ['romance-saffron-sealed', 'saffron-fire-openly'],
        },
        response:
          'You ride down in daylight under your own banner. She calls it showing off. At the fire Gristle Vane tells a story about Saffron at nine that makes her hide her face in your shoulder for a full minute. By the time you ride home the whole wasteland knows. The Freehold reeves send a letter beginning “With respect.”',
      },
      {
        id: 'hooded',
        label:
          'Go, but hooded, as nobody in particular. The crown cannot afford the story this autumn.',
        effects: {
          affinity: { jackalwire: 5 },
          flags: ['romance-saffron-sealed', 'saffron-fire-hooded'],
        },
        response:
          'A borrowed coat, hood up. The Pack can smell a crown at forty paces. They pretend not to. Saffron introduces you as “mine” and nothing else. On the ride home: “Next year, without the hood.” Not a question. You say yes.',
      },
      {
        id: 'rook',
        label:
          'Tell her the truth first: you have also been sitting on the barracks roof with Rook.',
        requires: { flags: ['romance-rook'], follower: 'F001' },
        effects: {},
        response: 'Saffron’s ears go flat. Then, slowly, come back up.',
        next: 'rook',
      },
      {
        id: 'friend',
        label:
          'Tell her you cannot stand at that fire as hers. Better said here than in front of the Pack.',
        effects: {
          flags: ['saffron-friendship'],
          clearFlags: ['romance-saffron'],
        },
        response:
          '“Properly,” she says. “I did ask.” She unties the clean apron and folds it over her arm. “I’ll still go. Somebody has to tell Vane he’s got the goat story wrong.” She smiles. It only shakes a little.',
      },
    ],
    beats: [
      {
        id: 'rook',
        lines: [
          'Rook. Course it’s Rook. Everyone likes Rook. I like Rook. Rook mended my bench once and apologised to it.',
          'I won’t make a scene. I grew up in a band where people made scenes with crowbars. I decided I never would. But I won’t share a fire with someone still deciding.',
          'So decide. Now. I’ll understand either way. From further off.',
        ],
        options: [
          {
            id: 'choose-saffron',
            label:
              'Choose Saffron. Go to the fire as hers, and tell Rook yourself tonight.',
            effects: {
              affinity: { jackalwire: 5 },
              flags: ['romance-saffron-sealed', 'saffron-fire-openly'],
              clearFlags: ['romance-rook'],
            },
            response:
              'You climb to the roof first. Rook hears all of it. Then pours the second cup over the parapet. “Go on,” they say. “She’s waiting.” At the fire Saffron grips your paw hard enough to ache.',
          },
          {
            id: 'choose-rook',
            label: 'Tell her it is Rook.',
            effects: {
              flags: ['saffron-friendship'],
              clearFlags: ['romance-saffron'],
            },
            response:
              '“Right,” Saffron says. “Good. That’s a proper answer.” She goes to the fire alone. A week later she mends Rook’s saddle without being asked. She doesn’t mention it.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'saffron-hoist',
    follower: 'F002',
    title: 'The Hoist',
    fromDay: 16,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Saffron has rigged a pulley in the barracks loft. A rope, a wheel off a dead cart, a counterweight of scrap. One porter can lift a sack of meal with two fingers. She shows you twice.',
      'Then she stops grinning. Four porters from the Yard carry the stores up that stair. Paid by the sack. Their kids eat by the sack.',
      'I built it because I could. I didn’t think past the wheel. I never do. You tell me if it stays.',
    ],
    options: [
      {
        id: 'keep',
        label: 'Keep the hoist. The porters can carry somewhere else.',
        effects: {
          local: { ledger: 1, yard: -1 },
          flags: ['saffron-hoist-kept'],
        },
        response:
          'The hoist stays. Two porters find work at the gate. Two don’t. One of them spits on the loft stair every morning. Saffron oils the wheel and doesn’t look at him.',
      },
      {
        id: 'down',
        label: 'Take it down. The porters eat by the sack.',
        effects: { local: { yard: 1 }, flags: ['saffron-hoist-down'] },
        response:
          'Saffron unbolts it herself. She keeps the wheel on her bench. When she is thinking, she spins it with one finger. It never stops where she wants.',
      },
    ],
  },
  {
    id: 'saffron-iron',
    follower: 'F002',
    title: 'Free Iron',
    fromDay: 25,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'A cart stands outside the workshop. Rivets, bar iron, good plate. A basket of bread on top with a cloth over it.',
      'Gift from the Mission. Two sisters brought it. Wouldn’t take a receipt. Said it was for the Ford bridge, so nobody else drowns crossing.',
      'Nobody gives iron for nothing. Not in this country. I want to send it back. Then the bridge goes up a month late, and the Ford stays the Ford for another month.',
    ],
    options: [
      {
        id: 'use',
        label: 'Use the iron. The bridge goes up.',
        effects: { affinity: { abbey: 5 }, flags: ['saffron-mission-iron'] },
        response:
          'The bridge is up by the new moon. A sister comes to bless it. Saffron stands at the far end with a hammer in her fist and does not come over.',
      },
      {
        id: 'return',
        label: 'Send it back. Build slower, with iron the crown paid for.',
        effects: { affinity: { abbey: -5 }, flags: ['saffron-refused-iron'] },
        response:
          'She loads it back on the cart herself. Three weeks later a wagon goes over at the Ford in a flash flood. Two drown. Saffron goes to the burial. She doesn’t say why.',
      },
    ],
  },
  {
    id: 'saffron-drawings',
    follower: 'F002',
    title: 'The Red Marks',
    fromDay: 34,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Saffron has every bridge she ever built rolled out on the workshop floor, pinned with spanners. Each one has a small red mark. The place where it breaks.',
      'The Watch wants copies. For defence, they say. They’re right. A sapper who knows the red mark can save a bridge in an hour.',
      'And a sapper who steals the drawings can drop every bridge in the country in a night. If I burn the marks, they’re only in my head. Then you’d better not lose me.',
    ],
    options: [
      {
        id: 'give',
        label:
          'Give the Watch the drawings. A war needs them more than she does.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['saffron-drawings-given'],
        },
        response:
          'The Watch makes three copies. One goes to the Ford post. One to the tower. One gets lost on the road and nobody can say where. Saffron stops sleeping well.',
      },
      {
        id: 'burn',
        label: 'Burn the red marks. Keep them in her head.',
        effects: { flags: ['saffron-drawings-burned'] },
        response:
          'She burns them page by page in the workshop stove. Then she looks at you. “Now don’t lose me.” It isn’t a joke.',
      },
    ],
  },
  {
    id: 'saffron-wagons',
    follower: 'F002',
    title: 'The Lightning Jaws Will Have You',
    fromDay: 45,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'A Pack scout came to the hideout before dawn. Painted wagon, lightning bolt on the side. He talked to Saffron for an hour and didn’t look at anyone else.',
      'The Lightning Jaws will take me back. No questions. And whoever I bring. Twenty wagons. Water. Rifles. They ride for you if I ask. Not for the crown. For me.',
      'They also ride for whoever pays them next spring. I know that. You’d be in their debt. I’d be theirs again.',
    ],
    options: [
      {
        id: 'ask',
        label:
          'Ask her to send for them. The court needs wagons more than pride.',
        effects: { affinity: { jackalwire: 5 }, flags: ['saffron-asked-pack'] },
        response:
          'She writes it in grease pencil on the back of a drawing. The wagons come in four days. She drives the first one in. She is wearing the badge on her coat now. Outside.',
      },
      {
        id: 'refuse',
        label:
          'Tell her she owes them nothing. Not for the court. Not for you.',
        effects: { flags: ['saffron-pack-refused'] },
        response:
          'The scout leaves at noon. Saffron watches the dust till it’s gone. That night the court rations water to half a cup. She gives you hers.',
      },
      {
        id: 'reported',
        label:
          'Tell her you once had that badge reported to the Watch. You won’t spend it now.',
        requires: { flags: ['saffron-badge-reported'] },
        effects: { flags: ['saffron-pack-refused'] },
        response:
          'Saffron laughs. First time in a week. “That’s the worst apology I ever heard.” She sends the scout away with a wrench for his captain. Their wrench. She’s had it twenty years.',
      },
    ],
  },
  // --- F003 Kiyo ---------------------------------------------------------------
  {
    id: 'kiyo-1',
    follower: 'F003',
    title: 'The Last of the Bitter Tea',
    fromDay: 4,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'The infirmary smells of steam and something green and sharp. Kiyo is measuring dried leaves onto a scale with a spoon no bigger than a fingernail. She doesn’t stop when you come in.',
      'The bitter tea, Majesty. From home. It closes wounds faster than anything the Saltroad sells. I have perhaps thirty cups left in the world.',
      'The Yard had a crushed hand this morning. The Watch has a fever. Your outriders will come back with worse. I can spend it on whoever is in front of me. Or save it for the ones you will need most.',
      'I would like you to choose, please. I have been choosing for two years. I am tired.',
    ],
    options: [
      {
        id: 'whoever',
        label: 'Whoever is in front of her. A cup is not a reward.',
        effects: { local: { yard: 2 }, flags: ['kiyo-tea-for-all'] },
        response:
          'Kiyo pours. The crushed hand in the next bed will heal straight. When the tea runs out she doesn’t complain. You remember who chose.',
      },
      {
        id: 'ration',
        label: 'Save it for the followers on dangerous roads.',
        effects: {
          local: { 'gate-watch': 1, yard: -1 },
          flags: ['kiyo-tea-rationed'],
        },
        response:
          'Kiyo closes the tin. “Then the Yard drinks willow bark.” She writes it in the infirmary book. That night you hear the crushed hand through two stone walls.',
      },
      {
        id: 'seeds',
        label: 'Ask whether the tea could ever be grown here.',
        requires: { cost: 20 },
        effects: { local: { lamplight: 1 }, flags: ['kiyo-tea-garden'] },
        response:
          '“It wants rain and shade. The wasteland has neither.” She takes the brass for seed trays anyway. Next time you look, a Yard child is watering them. With a thimble.',
      },
    ],
  },
  {
    id: 'kiyo-pup',
    follower: 'F003',
    title: 'A Pup from the Canyon',
    fromDay: 11,
    requires: { flags: ['d10-camp-struck'], notFlags: IN_THE_TOWER },
    lines: [
      'A new bed in the infirmary, by the stove, screened off with a blanket hung on a broom handle. Kiyo sits beside it with a cup she isn’t drinking. Behind the blanket someone small coughs the dry black cough of the canyon.',
      'The Watch brought her back from the Pack’s camp. She was under a wagon that was burning. A sergeant went in for her. Now the same sergeant comes every hour to ask if she can answer questions yet.',
      'She is perhaps six. She knows where the Pack keeps its water and which wagons carry the old ones. The Watch would like to know before the Pack moves camp.',
      'I told the sergeant she has a fever. She does. It is not as high as I said.',
    ],
    options: [
      {
        id: 'home',
        label:
          'Send her home to the canyon under a white rag as soon as she can travel. No questions.',
        effects: {
          affinity: { jackalwire: 10 },
          local: { 'gate-watch': -2 },
          flags: ['kiyo-pup-home'],
        },
        response:
          'Four days later a Watch volunteer carries her to the canyon mouth in an infirmary blanket. Nobody comes out until he has backed off a hundred paces. A week later the blanket comes back. Washed. Folded. A painted feather pinned to it.',
      },
      {
        id: 'questions',
        label:
          'Let the sergeant ask, with Kiyo at the bedside to stop it whenever she says.',
        effects: {
          local: { 'gate-watch': 2 },
          flags: ['kiyo-pup-questioned'],
        },
        response:
          'The sergeant is gentle. That is worse. The pup answers everything, because she is six and he brought her a honey drop. Kiyo stops it twice. The third time she doesn’t. Afterwards she washes her hands a long time.',
      },
      {
        id: 'ask-sergeant',
        label:
          'Ask why the sergeant went into a burning wagon for a raider’s pup.',
        effects: {},
        response:
          'A cough at the door that isn’t the pup’s. The sergeant has been standing there, helmet under his arm.',
        next: 'sergeant',
      },
    ],
    beats: [
      {
        id: 'sergeant',
        speaker: 'A Gate Watch sergeant',
        lines: [
          'Because she was screaming, Majesty, and I was nearest. That’s the whole of it. I have one at home about her size.',
          'And because we struck that camp on your order, with pups in it. I’d like one thing from that night to be a thing I can tell my girl.',
          'I still want my answers. I want them more than you’d like. I’m telling you both so you know.',
          {
            who: 'Kiyo',
            npc: 'F003',
            text: 'Then we both want something we should not have, sergeant. I want her well, and gone, and never asked anything again.',
          },
        ],
        options: [
          {
            id: 'home',
            label:
              'Send her home. Tell the sergeant that is the thing he can tell his girl.',
            effects: {
              affinity: { jackalwire: 10 },
              local: { 'gate-watch': -2 },
              flags: ['kiyo-pup-home'],
            },
            response:
              'He looks at you a long moment. Nods once. He carries her to the canyon mouth himself. The blanket comes back washed and folded with a painted feather pinned to it. He asks if he can keep the feather.',
          },
          {
            id: 'ward',
            label:
              'Keep her in the Yard as the crown’s ward until the raiding season ends. Safe. Unquestioned.',
            effects: {
              affinity: { jackalwire: -5 },
              local: { yard: 1 },
              flags: ['kiyo-pup-ward'],
            },
            response:
              'Kiyo agrees. It is the safe thing. The pup learns every Yard song in a week. The Pack sends no word about her at all. Kiyo finds that harder than any word.',
          },
          {
            id: 'questions',
            label:
              'Let him ask. The Watch bled for that camp. The next raid costs more if it goes in blind.',
            effects: {
              local: { 'gate-watch': 2 },
              flags: ['kiyo-pup-questioned'],
            },
            response:
              'He asks gently. Kiyo stays at the bedside. The pup answers everything. When it is over Kiyo pours the sergeant a cup of the bitter tea. Neither of them drinks it.',
          },
        ],
      },
    ],
  },
  {
    id: 'kiyo-2',
    follower: 'F003',
    title: 'Afraid of Bells',
    fromDay: 14,
    requires: { flags: ['heard:kiyo-1'], notFlags: IN_THE_TOWER },
    lines: [
      'The gate bell rings the change of watch at midnight. It has every night since the tower was built. You are crossing the Yard when it starts. Kiyo is in the infirmary doorway with a small sleeping shape on her shoulder and her paw cupped over his ear.',
      'She waits for the last stroke to die. Then she speaks, low.',
      'Every night. He wakes at the first stroke and doesn’t sleep again till dawn. He is afraid of bells. I told the cook he likes his bread torn small and he is afraid of bells. She laughed. It sounds like a little thing.',
      'I am going to ask for something foolish. The midnight bell, rung with a cloth over the clapper. Only at midnight. The Watch would still hear it. He might not.',
    ],
    options: [
      {
        id: 'muffle',
        label: 'Muffle the midnight bell. The Watch can listen harder.',
        effects: {
          local: { 'gate-watch': -1, yard: 1 },
          flags: ['kiyo-bell-muffled'],
        },
        response:
          'The night sergeant takes the order with a blank face. That night the bell says its twelve strokes through a wool sock. Nobody in the infirmary wakes. A week later two of the Watch are muffling it at other hours, for their own children. Captain Dunmark doesn’t notice. On purpose.',
      },
      {
        id: 'ask-why',
        label: 'Ask her what bells mean to him.',
        effects: {},
        response: 'Kiyo shifts the boy higher on her shoulder.',
        next: 'bells',
      },
      {
        id: 'seedlings',
        label:
          'Ask first after the tea seedlings and the child with the thimble.',
        requires: { flags: ['kiyo-tea-garden'] },
        effects: {},
        response:
          'Kiyo almost smiles. “Two still alive. The child with the thimble is the only one who can keep them so. My boy follows her about like a duckling.” Then the last echo of the bell is gone. So is the smile.',
        next: 'bells',
      },
      {
        id: 'refuse',
        label: 'Refuse. The gate bell is how the fortress knows it is safe.',
        effects: { local: { 'gate-watch': 1 }, flags: ['kiyo-bell-rung'] },
        response:
          '“Yes,” says Kiyo. “Of course.” No reproach. You would have preferred some. The bell rings full at midnight. A lamp burns in the infirmary every night until dawn.',
      },
    ],
    beats: [
      {
        id: 'bells',
        lines: [
          'On the salt boat they rang the bell for the ones who didn’t wake. Forty of us crossed. They rang it eleven times. He slept in a basket for most of it. I made sure. Not all of it.',
          'He doesn’t remember the boat. He only remembers that a bell means someone is gone. I don’t want him to learn the rest of what it means. Not yet.',
          'Or I am wrong, and he should learn a bell can also mean the gate is shut and everyone is where they should be. I don’t know. I am his mother. That means I am guessing.',
        ],
        options: [
          {
            id: 'muffle',
            label: 'Muffle it. He can learn the rest when he is older.',
            effects: {
              local: { 'gate-watch': -1, yard: 1 },
              flags: ['kiyo-bell-muffled'],
            },
            response:
              'The bell speaks through a wool sock. The infirmary sleeps. In the morning there is a cup of tea on the arm of the throne. Too bitter to drink. You drink it.',
          },
          {
            id: 'teach',
            label:
              'Keep the bell. Let him ring it himself one evening, so he learns what it means here.',
            effects: {
              local: { 'gate-watch': 1, yard: 1 },
              flags: ['kiyo-bell-lesson'],
            },
            response:
              'The night sergeant lifts him to the rope at dusk. He hangs on it with his whole weight. The bell says one enormous word. He shrieks with delight. He still wakes at midnight sometimes. Now he wakes to listen.',
          },
          {
            id: 'refuse',
            label:
              'The bell rings full. A fortress cannot keep its watch through a sock.',
            effects: { local: { 'gate-watch': 1 }, flags: ['kiyo-bell-rung'] },
            response:
              '“Then I will sing louder,” Kiyo says. Some nights at midnight you hear her under the bell. Three notes in a language nobody at court can name. Held until the ringing stops.',
          },
        ],
      },
    ],
  },
  {
    id: 'kiyo-3',
    follower: 'F003',
    title: 'Every Bird Is Komodo',
    fromDay: 41,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'A bird on the hideout roof at dawn. Scruffy. One bent feather. A small voice inside shouts “Komodo!” at it, the way it has shouted at every bird since the coronation.',
      'Kiyo comes out with her kettle and sits beside you on the step. She doesn’t look at the bird.',
      'He asked me last night when Komodo is coming back. Komodo used to bow to him. A deep bow, coat swinging. He thought it was the funniest thing in the world.',
      'What do I tell him, Majesty? You have more practice than I do now. Telling people hard things about friends.',
    ],
    options: [
      {
        id: 'truth',
        label:
          'Tell him the truth: Komodo went away and did something very wrong, and is not coming back.',
        effects: { flags: ['kiyo-told-truth'] },
        response:
          'That afternoon she kneels in the doorway with the boy and talks low. He listens to all of it. Then he goes outside and shouts “Komodo!” at the next bird anyway. Kiyo doesn’t correct him again.',
      },
      {
        id: 'errand',
        label:
          'Tell him Komodo is on a long errand. He is too small for the rest.',
        effects: { flags: ['kiyo-kind-lie'] },
        response:
          '“A long errand.” She tells him at supper. He asks if the errand is to find more birds. She says probably. That night she doesn’t sleep.',
      },
      {
        id: 'both',
        label:
          'Tell him Komodo was kind to him, and that was true. The rest can wait until he asks again.',
        effects: { flags: ['kiyo-both-true'] },
        response:
          '“Kind to him, and that was true.” Kiyo turns it over. “A careful sentence. Thank you.” She pours you the bitter tea. The real one. First time since the tower.',
      },
      {
        id: 'ask',
        label: 'Ask Kiyo what she thinks of Komodo now.',
        effects: {},
        response: 'Kiyo turns the kettle a quarter turn on the step.',
        next: 'kiyo',
      },
    ],
    beats: [
      {
        id: 'kiyo',
        lines: [
          'I think he was frightened. Of whatever is under the Abbey. Long before any of us thought to be. I think he bowed to my son every morning because it was the one easy thing in his day.',
          'And I think he sold the tower with my son asleep in it.',
          'Both. I am trying to hold both. My hands are not large enough.',
        ],
        options: [
          {
            id: 'truth',
            label:
              'Then tell the boy the truth. He will hold both one day. Better he learns it from her.',
            effects: { flags: ['kiyo-told-truth'] },
            response:
              '“From me. Not from a ballad.” She tells him on the step with his paw in hers. When the next bird lands on the roof he looks at it a long time. He doesn’t call it anything.',
          },
          {
            id: 'both',
            label:
              'Tell him only what she can hold: Komodo was kind to him, and that was true.',
            effects: { flags: ['kiyo-both-true'] },
            response:
              '“One thing at a time. That is how you carry a kettle across a deck.” She goes in. You hear her tell him. You hear him laugh about the bow.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'kiyo-gallows',
    follower: 'F003',
    title: 'A Gallows Stitch',
    fromDay: 16,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'There is a raider on Kiyo’s table with a knife wound under the ribs. Two Watchmen at the door. One holds the raider’s boots.',
      'They want him fit to stand on Thursday. For the rope. A man who cannot stand cannot be hanged properly, they say. It upsets the crowd.',
      'I can close it. I am good at this. I would like you to tell me whether I am closing it for him or for the rope.',
    ],
    options: [
      {
        id: 'mend',
        label: 'Mend him. What the law does after is not hers to carry.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['kiyo-mended-condemned'],
        },
        response:
          'Kiyo sews him neat and small. He thanks her. On Thursday he stands. Kiyo is in the infirmary with the shutters closed, boiling her needles twice.',
      },
      {
        id: 'refuse',
        label: 'Let her refuse. Someone else can sew a gallows stitch.',
        effects: {
          local: { 'gate-watch': -1 },
          flags: ['kiyo-refused-gallows'],
        },
        response:
          'The Watch surgeon does it. Badly. On Thursday the man is carried up the steps with his shirt red through. The crowd is upset. Kiyo hears it from the infirmary.',
      },
    ],
  },
  {
    id: 'kiyo-buttons',
    follower: 'F003',
    title: 'Buttons',
    fromDay: 22,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Kiyo opens her paw. Three brass buttons. A Watch button, a Ledger clerk’s, and one off your own steward’s coat.',
      'From my son’s pocket. He has a friend now. A Yard boy, eight, nobody’s. The boy takes things. Small things. My son holds them for him. He is proud to be trusted.',
      'I can keep them apart. Or I can take the boy into the infirmary where I can see him. Then I have two. I do not have enough for one.',
    ],
    options: [
      {
        id: 'apart',
        label: 'Keep them apart. Her son comes first.',
        effects: { local: { yard: -1 }, flags: ['kiyo-kept-apart'] },
        response:
          'Kiyo returns the buttons and says nothing about where she found them. Her son cries for two nights. The Yard boy is caught in the Ledger’s storeroom a week later. The Watch is rough with him.',
      },
      {
        id: 'take',
        label: 'Give the boy a cot in the infirmary. Two sons, then.',
        effects: { local: { yard: 1 }, flags: ['kiyo-took-yard-boy'] },
        response:
          '“Then he is mine too. You did that.” The boy sleeps under the table the first week. The second week, a button turns up on Kiyo’s pillow. Just one. Hers.',
      },
    ],
  },
  {
    id: 'kiyo-vial',
    follower: 'F003',
    title: 'The Vial in the Glove',
    fromDay: 29,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'A white glove on Kiyo’s table, folded round a glass vial. The Black Verge envoy left it when he passed through the infirmary. Left it. Did not give it.',
      'Fever cure, the label says. I cannot read the rest. A Watch girl in the third bed has had the black fever four days. Tonight is the night it decides.',
      'The Verge cures things on conditions. Everyone knows. Nobody knows what the condition is until it comes.',
    ],
    options: [
      {
        id: 'use',
        label: 'Give it to the girl.',
        effects: {
          affinity: { 'black-verge': 5 },
          flags: ['kiyo-used-verge-cure'],
        },
        response:
          'The fever breaks by morning. The girl asks for water, then bread, then where the tall stranger in the gloves went. She asks every day. Kiyo writes down each time.',
      },
      {
        id: 'pour',
        label: 'Pour it out. Fight the fever with what she knows.',
        effects: { flags: ['kiyo-poured-cure'] },
        response:
          'Kiyo empties it into the drain and sits with the girl all night. The girl lives. Her lungs don’t mend. She will never run the wall again.',
      },
    ],
  },
  {
    id: 'kiyo-triage',
    follower: 'F003',
    title: 'Nine Beds',
    fromDay: 35,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Nine beds in the infirmary. Fourteen wounded. Watch, Yard, and three riders from the other side of the war, brought in because they were lying on the road.',
      'At home the rule was worst first. Whoever they were. The Watch says the rule here is ours first. Both rules are a kind of mercy. Both kill somebody tonight.',
      'I want one rule. Yours. Then I do not have to choose fourteen times.',
    ],
    options: [
      {
        id: 'worst',
        label: 'Worst first. Whoever they are.',
        effects: { local: { 'gate-watch': -1 }, flags: ['kiyo-worst-first'] },
        response:
          'A Watch corporal waits on the floor all night while an enemy rider has the bed. He lives. He doesn’t forget whose rule it was. Neither does the Watch.',
      },
      {
        id: 'ours',
        label: 'Ours first. The court’s own come before the war’s.',
        effects: { local: { 'gate-watch': 1 }, flags: ['kiyo-ours-first'] },
        response:
          'At dawn one of the three is dead on the floor. Kiyo sews the sheet over him herself. She writes his name on the wall by the door, small, as best she can spell it.',
      },
    ],
  },
  {
    id: 'kiyo-runner',
    follower: 'F003',
    title: 'Small Enough to Get Through',
    fromDay: 46,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Kiyo’s son wants to run messages with the scouts. He is small. He is quiet. He gets into places. The scouts say he’d be useful. They say it kindly.',
      'Everyone here is useful. He sees it. He wants to be useful too. He asked me. He said please.',
      'I am asking you because I cannot say no to him and I cannot say yes.',
    ],
    options: [
      {
        id: 'run',
        label: 'Let him carry one message. Close by. Home by dark.',
        effects: { flags: ['kiyo-zuzu-runner'] },
        response:
          'He comes back at dusk out of breath with the answer word for word. He is proud for a week. Kiyo watches him practise being quiet. He gets better at it every day.',
      },
      {
        id: 'keep',
        label: 'No. He is a child. He stays by the fire.',
        effects: { flags: ['kiyo-zuzu-kept'] },
        response:
          'He sulks two days. On the third he is on the hideout roof, where nobody saw him climb, watching the road. Kiyo brings him down. She can’t make herself scold him.',
      },
    ],
  },
  {
    id: 'kiyo-postern',
    follower: 'F003',
    title: 'A Lantern at the Postern',
    fromDay: 39,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Kiyo has a child’s shoe in her lap. Her son’s. Wet with dew.',
      'I found it outside the postern this morning. Outside, Majesty. The door was barred when I looked. At the third bell it was not. I saw a lantern there, and a coat I know, going out.',
      'I think it was the adviser. I am not sure. I am a foreigner with a kettle. If I say his name to the Watch and I am wrong, I will not be the one they believe next time.',
    ],
    options: [
      {
        id: 'watch',
        label: 'Tell the Watch. Double the guard on the postern.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['kiyo-postern-reported'],
        },
        response:
          'Dunmark doubles the postern guard without asking whose lantern. One of the two new men is young and thin and proud of the post. Kiyo brings him tea at the third bell.',
      },
      {
        id: 'ask',
        label: 'Ask Komodo yourself. Quietly.',
        effects: { flags: ['kiyo-postern-asked'] },
        response:
          'Komodo laughs. He was walking off a headache. He describes the lantern, and the dew, and the shoe, and thanks Kiyo for her care. Every detail is right. That is what frightens her.',
      },
      {
        id: 'lie',
        label: 'Let it lie. A lantern at a door is not a crime.',
        effects: { flags: ['kiyo-postern-let-lie'] },
        response:
          'Kiyo nods. That night she moves her son’s cot into the middle of the infirmary, away from every wall.',
      },
    ],
  },
  {
    id: 'kiyo-close',
    follower: 'F003',
    title: 'A Cup Kept Warm',
    fromDay: 18,
    requires: {
      flags: ['heard:kiyo-2'],
      notFlags: IN_THE_TOWER,
    },
    lines: [
      'You find Kiyo at the infirmary table, asleep over an open ledger. She wakes before you can turn away. There is a second cup beside hers. The tea in it is still warm.',
      'I made it for myself, she says. Then she looks at the two cups and laughs. No, I did not. I have been waiting for you without intending to.',
      'Some nights I want to be somebody other than the healer and Zuzu’s mother. Then he cries out and I am glad those are the two things I am. I do not want to trade either of them away.',
      'You have the whole fortress to ask things of me, Majesty. I would like this one hour to be something neither of us owes the other.',
    ],
    options: [
      {
        id: 'stay',
        label: 'Put the crown on the table. Stay until the kettle cools.',
        effects: { flags: ['kiyo-friendship'] },
        response:
          'Kiyo tells you how to mend a torn sail. You admit you cannot thread a needle. “That,” she says, “explains the state of your banners.” The tea cools. You pour another cup.',
      },
      {
        id: 'friends',
        label:
          'Ask whether you can be friends when the doors of the court are shut.',
        effects: { flags: ['kiyo-friendship'] },
        response:
          '“We can try,” she says. “But I will still argue with you in front of the Watch.” She pours the second cup. “Especially in front of the Watch.”',
      },
      {
        id: 'respect',
        label:
          'Leave the cup warm. Tell her she never has to make room for the throne here.',
        effects: { flags: ['kiyo-friendship'] },
        response:
          'At breakfast there is a folded note beside your plate: “Come back when you are only yourself.” It is signed Kiyo, and beneath that, in a child’s uneven hand, “Zuzu.”',
      },
    ],
  },
  {
    id: 'kiyo-romance-2',
    follower: 'F003',
    title: 'The Door Left Unlatched',
    fromDay: 27,
    requires: {
      flags: ['heard:kiyo-close', 'kiyo-friendship'],
      notFlags: IN_THE_TOWER,
    },
    lines: [
      'The storm makes every window in the infirmary shiver. A Watch sentry waits in the doorway with a list of names. Two patients inside fought for the other side last week.',
      'Kiyo has set a lantern in the hall so anybody who needs her can find the door. Zuzu is asleep behind the pantry curtain. The sentry will not leave without an answer.',
      '“I can stitch a person or I can ask who they serve. Not both. If your Watch stands at this door, the people who fear it will die outside.” She takes the list from the sentry and puts it face down.',
      '“I need to know whose door this is, Majesty. And who pays when I open it to the wrong person.”',
    ],
    options: [
      {
        id: 'equal',
        label:
          'Make the infirmary neutral ground. The Watch can bring its complaints to you.',
        effects: {
          local: { 'gate-watch': -1, yard: 1 },
          flags: ['kiyo-clinic-neutral', 'kiyo-trusted'],
        },
        response:
          'You send the sentry away. A wounded raider comes through before dawn, carried by two people who would not give their names. The Watch counts the missing prisoner at roll call. You sign the report yourself.',
      },
      {
        id: 'pressure',
        label:
          'Post the Watch at the door. Keep Zuzu and the patients safe, but accept that some will stay away.',
        effects: {
          local: { 'gate-watch': 1, yard: -1 },
          flags: ['kiyo-clinic-guarded'],
        },
        response:
          'The sentry takes the post. By morning the blankets are clean and one cot is empty. Kiyo finds blood on the steps outside, already washed thin by the rain. She says nothing over breakfast.',
      },
      {
        id: 'uncertain',
        label:
          'Leave the door and the decisions to Kiyo. The crown will not order her triage.',
        effects: {
          local: { yard: 1 },
          flags: ['kiyo-clinic-independent'],
        },
        response:
          '“Then write that down,” Kiyo says. You do. She takes the paper and hangs it beside the lantern. Three nights later she turns away a man with a knife under his coat. He leaves cursing her. She keeps the paper up.',
      },
    ],
  },
  {
    id: 'kiyo-friend-2',
    follower: 'F003',
    title: 'The Rules of an Open Door',
    fromDay: 29,
    requires: {
      flags: ['heard:kiyo-close', 'kiyo-friendship'],
      notFlags: IN_THE_TOWER,
    },
    lines: [
      'Zuzu has invented a game in which every spoon is a general and every bowl is a fortress. Kiyo makes you defend a chipped teacup with one wooden spoon.',
      'He wins. Of course he wins. When he has gone, Kiyo clears the dishes and leaves the cracked teacup on the table between you.',
      '“I have friends who remember me from before the boat. Here everyone first knew me because somebody needed stitches. You are the first who stayed after the bandages were put away.”',
    ],
    options: [
      {
        id: 'teach',
        label: 'Ask her to teach you the names of her home’s constellations.',
        effects: { flags: ['kiyo-friendship-deep'], local: { yard: 1 } },
        response:
          'On the roof she draws the constellations in spilled flour. Some have different names here. She does not correct the sky. She corrects you, often.',
      },
      {
        id: 'clinic',
        label: 'Ask her what the infirmary needs before winter.',
        effects: {
          flags: ['kiyo-friendship-deep'],
          brass: -5,
          local: { yard: 2 },
        },
        response:
          '“Clean sheets,” she says at once. “And someone who can mend the stove.” Your five brass makes both possible. She thanks you, then immediately hands you a basket of laundry.',
      },
    ],
  },
  // --- F004 Duchess Flint ------------------------------------------------------
  {
    id: 'flint-1',
    follower: 'F004',
    title: 'A Promise About Threats',
    fromDay: 5,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Duchess Flint doesn’t sit on beds. She sits on the floor, slowly, back against the wall, shawl folded under her. She waits for you to join her before she says anything.',
      'Five days in your court, Majesty. I have heard the word “example” eleven times. Make an example of the toll. Make an example of the fen.',
      'I will carry any message to anyone. I will not carry a threat. Not once. Not a small one. Not one that would save lives. I am telling you now, so you never send me and find out later.',
    ],
    options: [
      {
        id: 'agree',
        label: 'Agree. Flint will never be sent with a threat.',
        effects: { flags: ['flint-no-threats'] },
        response:
          '“Thank you,” says Flint, and closes her eyes. She expected to be dismissed.',
      },
      {
        id: 'challenge',
        label: 'Ask what she would do if a threat could save a hundred lives.',
        effects: {},
        response: 'Flint opens her eyes. She has been asked this before.',
        next: 'hundred',
      },
    ],
    beats: [
      {
        id: 'hundred',
        lines: [
          'I would ask why the only tool in the room is a knife. I would keep asking. Slowly. Until someone found another tool. Or until the hundred were lost and everyone had to look at me while it happened.',
          'I know which happens more often. I have buried both kinds. I would rather be remembered as the one who waited too long than the one who learned to threaten.',
          'You don’t have to agree. You only have to not use my voice for it.',
        ],
        options: [
          {
            id: 'agree',
            label: 'Agree. Her voice will never carry a threat.',
            effects: { flags: ['flint-no-threats'] },
            response:
              'Flint nods once. On her way out she pats the doorframe, the way you pat a horse that has carried you a long way.',
          },
          {
            id: 'refuse',
            label:
              'Tell her you cannot rule with one hand tied. You will use what works.',
            effects: { local: { 'gate-watch': 1 }, flags: ['flint-warned'] },
            response:
              '“Then I will ride with your messengers,” she says, “and stand beside the threat, and be the other thing in the room.” She isn’t angry. She is settling in for a long winter.',
          },
        ],
      },
    ],
  },
  {
    id: 'flint-2',
    follower: 'F004',
    title: 'How the Duchess Got Her Title',
    fromDay: 14,
    requires: { flags: ['heard:flint-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Flint has been given a real chair at last. Arms and all. She has turned it to the window and is not sitting in it. She is on the floor beside it. The chair holds a stack of letters on cream paper.',
      'Lady Vask has written to me. Very kindly. Seven pages. The short of it: she has found out I am not a duchess.',
      'I never was. Twenty years ago a checkpoint on the Ford passed only refugees with a noble patron. I had forty people behind me and no patron. So I told the sergeant I was the Duchess of Flint. He couldn’t read. He let us through. It stuck.',
      'Lady Vask will keep my secret if I speak for the Old Houses’ chair in council. She uses the word kindly four times.',
    ],
    options: [
      {
        id: 'ask',
        label: 'Ask Flint what she wants to do.',
        effects: {},
        response: 'Flint folds her hands on the letters.',
        next: 'want',
      },
      {
        id: 'no-threats',
        label:
          'Promise her first: the crown will not answer Lady Vask with a threat, any more than Flint would.',
        requires: { flags: ['flint-no-threats'] },
        effects: {},
        response: '“Thank you,” says Flint. “I was going to ask.”',
        next: 'want',
      },
      {
        id: 'threaten',
        label:
          'You told her you would use what works. Send Lady Vask a reminder of what the crown knows about the Old Houses’ debts.',
        requires: { flags: ['flint-warned'] },
        effects: {
          local: { 'old-houses': -2, 'gate-watch': 1 },
          flags: ['flint-vask-threatened'],
        },
        response:
          'Flint closes her eyes. “I said I would stand beside the threat. I did not say I would enjoy it.” Lady Vask writes no more letters. She stops greeting Flint in the hall. Flint finds she misses it.',
      },
      {
        id: 'title',
        label:
          'Make it true. Grant Flint a real title under the crown’s seal. Let Lady Vask find it in the register.',
        effects: {
          local: { 'old-houses': -2 },
          flags: ['flint-made-duchess'],
        },
        response:
          'Flint looks at the seal a long time. “A lie made true is still a lie that worked.” She takes the patent and folds it under her shawl. The next time Lady Vask says “Duchess” across the hall, it is nearly a hiss.',
      },
    ],
    beats: [
      {
        id: 'want',
        lines: [
          'I want to tell the truth myself. In the hall, at petitions, in front of the Old Houses. Slowly. All forty names of the people we brought across the Ford. Then mine. Which is only Flint.',
          'It will cost you. They will say the court keeps a fraud in its barracks. The Old Houses will laugh for a week. Some of the forty will hear, and be ashamed of me.',
          'But a secret someone else holds is a leash. I have never worn one. I would rather not start in your service.',
        ],
        options: [
          {
            id: 'confess',
            label: 'Let her say it in the hall. Sit beside her while she does.',
            effects: {
              local: { 'old-houses': -1, yard: 2 },
              flags: ['flint-title-confessed'],
            },
            response:
              'Forty names take her most of the morning. She reads each one slowly enough to be heard. Nobody laughs. When she says “and mine is only Flint,” someone in the Yard gallery calls “Duchess!” anyway. Then the whole Yard says it.',
          },
          {
            id: 'title',
            label:
              'Spare her the hall. Make the title true under the crown’s seal.',
            effects: {
              local: { 'old-houses': -2 },
              flags: ['flint-made-duchess'],
            },
            response:
              '“You have made me a duchess so I would not have to stop being one.” She reads the patent twice. Lady Vask finds it in the register within the week. She sends no eighth page.',
          },
          {
            id: 'speak',
            label:
              'Tell her to give Lady Vask what she asks. One speech in council is a small price for her name.',
            effects: {
              local: { 'old-houses': 2 },
              flags: ['flint-spoke-for-vask'],
            },
            response:
              '“Small,” Flint says at last. She speaks for the Old Houses’ chair in council, slowly and well. Afterwards she sits on the barracks floor with her eyes shut for the rest of the day.',
          },
        ],
      },
    ],
  },
  {
    id: 'flint-censured',
    follower: 'F004',
    title: 'What the Grain Fed',
    fromDay: 28,
    requires: { flags: ['flint-censured'], notFlags: IN_THE_TOWER },
    lines: [
      'Flint hasn’t sat on the floor since the trial. She is in the chair. Upright. Signet ring turned outward again. That frightens you more than anything she could say.',
      'I won’t ask you to undo it. A censure is a censure. The Old Houses have it in their book. The court has it in its memory. I have it in mine.',
      'I only want to tell you what the grain did. Nobody at the trial asked. Forty sacks from the crown store at the Ford. A Mole burrow that had flooded. Thirty-one families. Eleven with pups under a year. They ate it in nine days. Nobody died.',
      'Now it sits in your memory too. Next to the censure.',
    ],
    options: [
      {
        id: 'apologize',
        label: 'Apologize to her in the hall, where the censure was given.',
        effects: {
          local: { 'old-houses': -2, yard: 1 },
          affinity: { moles: 5 },
          flags: ['flint-apology-public'],
        },
        response:
          'Halfway through, in front of the Old Houses, Flint gets up out of her chair. It takes a long time. She comes and stands at your shoulder. “That will do,” she says quietly. “Now they have heard it.” Lady Vask leaves before the end.',
      },
      {
        id: 'repay',
        label:
          'Repay the forty sacks from your own purse, quietly, so the ledger is whole and nobody need be wrong.',
        requires: { cost: 20 },
        effects: { flags: ['flint-grain-repaid'] },
        response:
          '“Kind. And tidy. Now nobody stole anything, nobody was wronged, and nobody has to say so.” She turns her ring back inward. You aren’t sure it was the answer she wanted.',
      },
      {
        id: 'stand',
        label:
          'The censure stands. With the Old Houses and a war at the door, you would judge the same again.',
        effects: {
          local: { 'old-houses': 1 },
          flags: ['flint-censure-stands'],
        },
        response:
          '“Then I know where I stand. More than most of this court can say.” She doesn’t sit on the floor again while you are in the room. She keeps serving. When she is sent somewhere dangerous she still stands between the danger and the others.',
      },
    ],
  },
  {
    id: 'flint-acquitted',
    follower: 'F004',
    title: 'On Her Word',
    fromDay: 28,
    requires: { flags: ['flint-acquitted'], notFlags: IN_THE_TOWER },
    lines: [
      'Flint is back on the floor, shawl folded. She pats the flagstone beside her and waits. Like her fifth day here.',
      'You acquitted me on my word, in front of the Old Houses. Finest thing anyone has done for me in thirty years. I have come to tell you that you should not have done it.',
      'I took the grain. Forty sacks from the crown store at the Ford, for a Mole burrow that had flooded. I said “read the ledgers” because the ledgers would have shown it. I thought you would read them and judge me properly. I could bear that.',
      'You trusted my word instead. Now the court believes my word is enough. It is not. Nobody’s is. What would you like me to do about it?',
    ],
    options: [
      {
        id: 'confess',
        label:
          'Ask her to tell the Old Houses the truth, and take the censure she was spared.',
        effects: {
          local: { 'old-houses': 2 },
          flags: ['flint-confessed-grain'],
        },
        response:
          'She does it next morning with the ledger page in her hand. Lady Vask’s delight curdles line by line, because Flint reads out all thirty-one families the grain fed. The censure is entered. Flint walks out lighter.',
      },
      {
        id: 'keep',
        label:
          'The acquittal stands. The grain fed thirty-one families. The crown is satisfied.',
        effects: { affinity: { moles: 5 }, flags: ['flint-acquittal-kept'] },
        response:
          '“Then the grain was the crown’s gift. I will tell the Moles so. They will thank the crown. It will be true by the time it reaches them.” She looks tired. “That is how most things become true.”',
      },
      {
        id: 'repay',
        label:
          'Repay the forty sacks from your own purse, so the ledger is whole and her word was right after all.',
        requires: { cost: 20 },
        effects: { flags: ['flint-grain-repaid'] },
        response:
          'Flint watches you count the brass. She laughs, softly. You have never heard it before. “You are making me honest after the fact. A strange kindness. I will accept it. Slowly.”',
      },
      {
        id: 'ask',
        label: 'Ask why she didn’t simply tell you before the trial.',
        effects: {},
        response: 'Flint takes a long breath. For Flint, a very long one.',
        next: 'why',
      },
    ],
    beats: [
      {
        id: 'why',
        lines: [
          'Because you would have been kind about it. I did not want kindness. I wanted to see what the court does with a theft it agrees with.',
          'Now I know. It looks the other way and calls it trust. I don’t blame you. I only want it written down. So when the next thief is someone you don’t agree with, someone remembers.',
        ],
        options: [
          {
            id: 'record',
            label:
              'Write it in the court book yourself: acquitted on her word, which was not the whole truth, by an emperor who chose not to look.',
            effects: {
              local: { lamplight: 1 },
              flags: ['flint-acquittal-recorded'],
            },
            response:
              'You write it in your own hand. Flint reads it over your shoulder, slowly, to the end. “Yes. That is what happened.” She pats the page the way she pats doorframes.',
          },
          {
            id: 'confess',
            label:
              'Then she tells the Old Houses herself, and takes the censure.',
            effects: {
              local: { 'old-houses': 2 },
              flags: ['flint-confessed-grain'],
            },
            response:
              'She tells them next morning and reads all thirty-one names. The censure is entered. On the way out she pats the doorframe. Then your arm. She has never done that before.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'flint-light',
    follower: 'F004',
    title: 'Losses: Light',
    fromDay: 7,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Flint has the morning report on her knee. One line is underlined in pencil. Losses: light.',
      'Three people, Majesty. A drover, his boy, a Watch girl called Ennis. Light. I asked the clerk. He said names take an hour a day to copy, and the Ledger pays by the hour.',
      'I would like the names in the report. Every report. I know what an hour costs. I am asking anyway.',
    ],
    options: [
      {
        id: 'names',
        label: 'Names in every report. The Ledger can pay the hour.',
        effects: { local: { ledger: -1 }, flags: ['flint-names-in-reports'] },
        response:
          'The clerks grumble. The reports get longer. Flint reads the first one aloud at supper. Three names. The barracks goes quiet and stays that way.',
      },
      {
        id: 'numbers',
        label: 'Numbers. A court with a war coming has to count, not mourn.',
        effects: { local: { ledger: 1 }, flags: ['flint-numbers-only'] },
        response:
          '“Light,” Flint says. She writes the three names in the back of her own book. After that she adds every name, every day, by hand. Nobody asks her to stop.',
      },
    ],
  },
  {
    id: 'flint-papers',
    follower: 'F004',
    title: 'Good Papers',
    fromDay: 19,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'A family at the gate. Five of them. Their travel papers are good. Too good. The Watch found the forger’s thumbprint in the wax.',
      'Flint is on the gate bench beside the mother, shawl round both of them.',
      'Majesty. I came through a checkpoint on a lie once. Forty people did. You know this. The Watch says a gate that bends for a good lie bends for a bad one. The Watch is right. So am I.',
    ],
    options: [
      {
        id: 'admit',
        label: 'Let them in. Burn the papers.',
        effects: {
          local: { 'gate-watch': -1, yard: 1 },
          flags: ['flint-forgers-admitted'],
        },
        response:
          'The papers go in the guardroom stove. The Watch sergeant watches them burn and writes something in his book. A month later three more families come with the same thumbprint.',
      },
      {
        id: 'turn',
        label: 'Turn them back. The gate holds for everyone or no one.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['flint-forgers-turned'],
        },
        response:
          'Flint walks them out herself. Slowly. She gives the mother her shawl. She comes back without it and sits on the floor of the barracks until dark.',
      },
    ],
  },
  {
    id: 'flint-seating',
    follower: 'F004',
    title: 'Below the Salt',
    fromDay: 33,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Flint has the plan for the Saltroad Congress table. Komodo drew it. Neat squares. Names in each.',
      'He has put the Moles below the salt. By the door. Where the draught is. He says it keeps the Old Houses calm.',
      'It will. And Granny Umber will sit by that door all night and remember every minute of it. Chairs are what people remember, Majesty. Not speeches.',
    ],
    options: [
      {
        id: 'move',
        label: 'Move the Moles up the table. Let the Old Houses sulk.',
        effects: {
          local: { 'old-houses': -1 },
          affinity: { moles: 5 },
          flags: ['flint-moved-moles'],
        },
        response:
          'Flint redraws the squares herself. Komodo looks at the new plan a long time. “Bold,” he says. Lady Vask sends a note asking if the draught by the door can be fixed. It can’t.',
      },
      {
        id: 'leave',
        label:
          'Leave the seating. The Congress is too important for a quarrel about chairs.',
        effects: {
          local: { 'old-houses': 1 },
          flags: ['flint-seating-kept'],
        },
        response:
          'Flint rolls up the plan. “Then I will sit by the door with her,” she says. And she does, when the night comes. Nobody moves her.',
      },
    ],
  },
  {
    id: 'flint-threat',
    follower: 'F004',
    title: 'Surrender by the New Moon',
    fromDay: 43,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Flint sits on the hideout floor with a sealed letter on her knee. The hosts gave it to her this morning.',
      'There is a camp below the ridge. Families who followed Komodo’s buyer and now want to come back. The hosts want them told: surrender by the new moon, or be burned out.',
      'They would let me close. Nobody else. And it is a threat. You know what I said, my fifth day.',
    ],
    options: [
      {
        id: 'carry',
        label: 'Ask her to carry it. Just this once. They will listen to her.',
        effects: { flags: ['flint-carried-threat'] },
        response:
          'Flint is quiet a long time. Then she stands, slowly, and goes. The camp surrenders. Nobody burns. She doesn’t sit on the floor again.',
      },
      {
        id: 'other',
        label: 'Send a host rider with it. Keep her out of it.',
        requires: { notFlags: ['flint-no-threats'] },
        effects: { flags: ['flint-threat-refused'] },
        response:
          'A host rider takes it. He comes back with an arrow in his saddle and no answer. On the new moon there is smoke below the ridge. Flint counts it.',
      },
      {
        id: 'word',
        label: 'Keep your word. Her voice carries no threats. Not even now.',
        requires: { flags: ['flint-no-threats'] },
        effects: { flags: ['flint-threat-refused'] },
        response:
          'Flint hands the letter back unopened. A host rider takes it. He comes back with an arrow in his saddle. On the new moon there is smoke below the ridge. Flint watches it with you. She says thank you, and means it, and it costs her.',
      },
    ],
  },
  {
    id: 'flint-sisters',
    follower: 'F004',
    title: 'One by One',
    fromDay: 48,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Flint has a list on her knee. Sisters of the Mission. Every name the court has heard since the summer.',
      'The coalition wants the Abbey closed when this is over. Some want it burned, sisters and all. The Abbess will say none of them knew. The coalition will say all of them did.',
      'Both are lies. I would like to try them one by one. It will take a year. People will die waiting for a verdict on someone who did nothing.',
    ],
    options: [
      {
        id: 'try',
        label: 'One by one. However long it takes.',
        effects: { flags: ['flint-trials-one-by-one'] },
        response:
          'Flint writes it at the top of her list. One by one. The coalition captains look at each other and say nothing yet. That is the first day of the year it takes.',
      },
      {
        id: 'scatter',
        label: 'Close the Abbey and scatter them. No trials. No fires.',
        effects: { flags: ['flint-abbey-scattered'] },
        response:
          '“Then the guilty walk out with the rest,” Flint says. “Into every village in the country.” She folds the list. She doesn’t argue. She keeps it.',
      },
    ],
  },
  // --- F005 Pip Thread ---------------------------------------------------------
  {
    id: 'pip-1',
    follower: 'F005',
    title: 'Page Two Hundred and Eight',
    fromDay: 5,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Pip has made a nest in the corner of the barracks archive. Three crates of loose paper. A stool. A candle in a jar, so the ordinary moths can’t get at it. They don’t look up. They speak to the page.',
      'I am writing out the register of the missing from memory. Hollow Bell’s. Three volumes. I am on the second. It is easier than supper.',
      'Tobin Lowe. Nine years. Green scarf. Last seen at the far-ward pump. I keep writing him out. Every copy is the same. That is the point of me.',
      'I wanted to ask you something. Here, where it is quiet. I do not ask things well in halls.',
    ],
    options: [
      {
        id: 'ask',
        label: 'Ask what Pip wanted to ask.',
        effects: {},
        response:
          'Pip squares the pen with the edge of the page. Squares it again.',
        next: 'ask',
      },
      {
        id: 'sealed',
        label:
          'Say you can guess. It is about the page Komodo locked in the dispatch chest.',
        requires: { flags: ['d04-page-sealed'] },
        effects: {},
        response: 'Pip goes still, the way moths do on a wall.',
        next: 'chest',
      },
      {
        id: 'posted',
        label: 'Ask whether Pip has been down to see the page on the gate.',
        requires: { flags: ['d04-page-posted'] },
        effects: {},
        response: 'Pip’s antennae lift.',
        next: 'gate',
      },
      {
        id: 'mother',
        label:
          'Tell Pip what the Yard runner saw: the well-cleaner read the page standing up, then sat down on the pump step.',
        requires: { flags: ['d04-page-to-mother'] },
        effects: { local: { lamplight: 1 }, flags: ['pip-told-of-mother'] },
        response:
          'Pip writes it in the margin of the register, word for word. “Sat down on the pump step. Thank you. First thing anyone has added to his page in a year.” They don’t ask their question. Perhaps that was the question.',
      },
    ],
    beats: [
      {
        id: 'ask',
        lines: [
          'The register is the crown’s now. So am I. If someone at court asked me to change a page in it, for a good reason, a kind reason, a reason that saved lives, would you want me to?',
          'Not would I. I would not. Would you want me to. I need to know who I am working for.',
        ],
        options: [
          {
            id: 'never',
            label: 'Never. The record is the record, whoever asks.',
            effects: { local: { lamplight: 2 }, flags: ['pip-record-sacred'] },
            response:
              '“Whoever asks.” Pip writes it inside the register’s cover, small. Later you notice they underlined “whoever”.',
          },
          {
            id: 'depends',
            label: 'Tell Pip the truth: if a page could save lives, you might.',
            effects: { flags: ['pip-record-bent'] },
            response:
              '“Thank you for not lying.” They mean it. From then on they keep two copies of every register. The second is somewhere you don’t know about. That is what you deserve.',
          },
        ],
      },
      {
        id: 'chest',
        lines: [
          'He folded it along a line only he could see. I watched. Komodo folds things the way some people sign them.',
          'A sealed page is a page someone can spend. That is what he said. You agreed. I understand it. I ask one thing. Let me copy it and keep the copy somewhere that is not the chest. If the page is ever spent, there will still be a boy on paper.',
          'In the passage Young Komodo goes by with his ledger under his arm. He glances in. Smiles at you both. Walks on. His claw taps the ledger cover twice as he passes. Pip doesn’t breathe until the footsteps are gone.',
        ],
        options: [
          {
            id: 'copy',
            label: 'Give Pip the key for an hour. Make the copy.',
            effects: { local: { lamplight: 1 }, flags: ['pip-copy-kept'] },
            response:
              'Pip copies the page in the time it takes to drink a cup of tea. Then copies the fold, line for line. “It is part of the text,” they say. “It tells you who held it.” The copy goes somewhere you don’t ask about.',
          },
          {
            id: 'trust',
            label:
              'Komodo keeps the crown’s secrets well. The page stays in the chest. Uncopied.',
            effects: { flags: ['pip-trusted-komodo'] },
            response:
              'Pip says nothing. From Pip, that is a speech. That night through the archive door you see them write out Tobin Lowe’s page from memory. Again. Again. Each copy filed in a different crate.',
          },
        ],
      },
      {
        id: 'gate',
        lines: [
          'Every morning. People read it aloud to each other. Someone tied a green thread to the nail. Now there are thirty. The far wards come up on market day just to tie one.',
          'Hollow Bell has stopped sending its grain tallies. I keep the tallies. I noticed. The mayor’s office is very angry and very quiet.',
          'I wanted to ask if it was worth it. I think I wanted you to say yes. Somebody else has to say it. So it isn’t only me.',
        ],
        options: [
          {
            id: 'yes',
            label: 'Yes. A boy on a gate is worth a town’s grain tallies.',
            effects: { local: { lamplight: 1 }, flags: ['pip-page-worth-it'] },
            response:
              '“Yes.” Pip writes it down. Pip writes down anything they want to keep. On market day they are at the gate with a green thread of their own.',
          },
          {
            id: 'unsure',
            label:
              'Tell Pip you don’t know yet. Neither will they, for a long while.',
            effects: { flags: ['pip-page-unsure'] },
            response:
              '“Not knowing for a long while. A very archival answer.” They seem almost comforted. You leave them writing out the boy’s page once more.',
          },
        ],
      },
    ],
  },
  {
    id: 'pip-2',
    follower: 'F005',
    title: 'The Ration Book',
    fromDay: 20,
    requires: { flags: ['heard:pip-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Pip is standing in the barracks doorway. They never stand in doorways. Doorways are full of people arriving. They hold the Yard’s ration book against their chest.',
      'Someone has been changing the Yard’s ration book. A sack here. Half a sack there. Moved from the Yard’s column to the Ledger’s. Always on nights the Ledger’s clerk does the tally. Over the season, a fortnight of bread.',
      'I can prove the numbers are wrong. I cannot yet prove whose hand changed them. Ledger ink, but half the fortress borrows it. Another week and the clerk’s old drafts, and I would be certain.',
      'The Yard eats short tonight. I know. I would still like the week.',
    ],
    options: [
      {
        id: 'act',
        label:
          'Act now. Restore the Yard’s bread from the Ledger’s stores tonight. The clerk answers for it after.',
        effects: {
          local: { yard: 2, ledger: -2 },
          flags: ['pip-ledger-acted'],
        },
        response:
          'Pip winces. “Without proof, the clerk will say we guessed. The Ledger will believe him.” It does. Factor Tallow writes about due process. The Yard eats full bread. Foreman Dunmore sends Pip a loaf with their name scratched in the crust. Pip keeps it on a shelf until it goes hard.',
      },
      {
        id: 'wait',
        label: 'Give Pip the week. Do it properly.',
        effects: {
          local: { yard: -1, lamplight: 1 },
          flags: ['pip-ledger-waited'],
        },
        response:
          'Pip gets the week, the drafts and the proof. The clerk. Paid by an Old House to keep the Yard lean before the levy. It is all in Pip’s hand by the week’s end. The Yard ate short seven nights. Pip knows the number of loaves. They tell it to you once.',
      },
      {
        id: 'both',
        label:
          'Feed the Yard from the crown’s purse tonight, and give Pip the week.',
        requires: { cost: 15 },
        effects: {
          local: { yard: 1, lamplight: 1 },
          flags: ['pip-ledger-waited'],
        },
        response:
          '“You are paying for my patience. I didn’t know it had a price.” By the week’s end Pip has the hand, the clerk and the Old House that paid him. One tidy column.',
      },
      {
        id: 'ask',
        label: 'Ask why the week matters so much to them.',
        effects: {},
        response:
          'Pip closes the ration book over one finger, keeping the place.',
        next: 'proof',
      },
    ],
    beats: [
      {
        id: 'proof',
        lines: [
          'Once, at Hollow Bell, I was sure about a page. I said so out loud before I could prove it. I was right. It didn’t matter. They moved me to the grain tallies. The page stayed wrong.',
          'Being right is not enough. Being right first is worse than useless. I would rather be right late than right alone.',
        ],
        options: [
          {
            id: 'wait',
            label: 'Then take the week. Be right late, and not alone.',
            effects: {
              local: { yard: -1, lamplight: 1 },
              flags: ['pip-ledger-waited'],
            },
            response:
              'Pip looks you in the eye. Once. The proof comes at the week’s end, a name at the bottom of a column. The Yard ate short seven nights. Pip carries a heel of bread in their pocket all week and doesn’t eat it.',
          },
          {
            id: 'both',
            label:
              'Take the week. The crown feeds the Yard from its own purse while Pip works.',
            requires: { cost: 15 },
            effects: {
              local: { yard: 1, lamplight: 1 },
              flags: ['pip-ledger-waited'],
            },
            response:
              '“Not alone,” Pip says, as if filing it. The Yard eats on the crown’s brass. By the week’s end Pip has the hand, the clerk and the Old House. Nobody can say they guessed.',
          },
        ],
      },
    ],
  },
  {
    id: 'pip-3',
    follower: 'F005',
    title: 'The Fold',
    fromDay: 42,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Out of the whole archive of the tower, Pip saved one satchel. They won’t say what is in it. They sit with it on their knees at the edge of the hideout firelight. For once they speak first.',
      'I keep thinking about the fold. The first week. The page from Hollow Bell. He folded it along a line only he could see. I said he folds things the way some people sign them. I should have said it to someone who would listen.',
      'Everything he touched in the archive, he folded the same way. Reports. Dispatches. Letters for the Abbey. I could find every one. If the archive still existed.',
    ],
    options: [
      {
        id: 'copy',
        label:
          'Ask whether the copy of page two hundred and eight is in the satchel.',
        requires: { flags: ['pip-copy-kept'] },
        effects: {},
        response:
          'Pip opens the satchel. On top, alone in its own sleeve, is a page with a fold drawn on it in ink. Not a real fold. Only the shape of one.',
        next: 'copy',
      },
      {
        id: 'not-yours',
        label: 'Tell Pip it was not theirs to see. Nobody saw it.',
        effects: { flags: ['pip-absolved'] },
        response:
          '“Nobody saw it. That is not the same as nobody could have.” But they lean against your shoulder. They have never done that. They stay until the fire is low.',
      },
      {
        id: 'write',
        label:
          'Ask Pip to write down everything they remember of him. Every fold. Every errand.',
        effects: { local: { lamplight: 2 }, flags: ['pip-komodo-record'] },
        response:
          'Pip starts that night by the fire. By morning, eleven pages. The last line on the eleventh isn’t about folds. It says: he was kind to me on my first day, and I do not know what to do with that, so I am writing it down.',
      },
    ],
    beats: [
      {
        id: 'copy',
        lines: [
          'I copied the fold because the fold told you who held it. I didn’t know what it meant. Every page he sealed, he folded the same way. So the seal faced north when it lay on his desk. Toward the mission road.',
          'It proves nothing. It is a fold. It is also the only thing in this satchel that is true about him.',
        ],
        options: [
          {
            id: 'keep',
            label:
              'Keep it. When this is over, it goes in the record beside his name.',
            effects: { local: { lamplight: 1 }, flags: ['pip-fold-kept'] },
            response:
              'You take the sleeve. Pip watches it go into your coat the way they once watched the dispatch-chest key turn. Then they close the satchel, set it down, and leave it there.',
          },
          {
            id: 'write',
            label:
              'Ask Pip to write it all down. The fold, and everything else.',
            effects: { local: { lamplight: 2 }, flags: ['pip-komodo-record'] },
            response:
              'Pip writes until dawn. The copy of page two hundred and eight goes at the front, with the drawn fold. Behind it, eleven pages about a friend. The small fast hand never once shakes.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'pip-well',
    follower: 'F005',
    title: 'Tax on a Dry Well',
    fromDay: 11,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Pip holds out the tax roll at arm’s length, like something that might bite. One line is pinned with a pin.',
      'The Yard is taxed for the east well. The east well dried up three summers ago. Somebody kept writing it in. Every quarter. Same hand.',
      'If it is corrected back to the start, the crown owes the Yard three years. If it is corrected from today, the crown keeps three years it took for water nobody drank. I do not mind which. I mind that it is written down.',
    ],
    options: [
      {
        id: 'back',
        label: 'Correct it back to the start. Pay the Yard what it’s owed.',
        requires: { cost: 15 },
        effects: {
          local: { yard: 2, ledger: -1 },
          flags: ['pip-well-repaid'],
        },
        response:
          'The Ledger pays it in copper, so it takes two carts. The Yard buys a goat. Nobody else in the country gets their three years back. They hear about the goat.',
      },
      {
        id: 'today',
        label: 'Correct it from today. The crown cannot repay every old wrong.',
        effects: { local: { yard: -1 }, flags: ['pip-well-corrected'] },
        response:
          'Pip strikes the line and writes the date beside it. Small. Then, smaller, in the margin: three years. They do not explain the margin. They do not have to.',
      },
    ],
  },
  {
    id: 'pip-census',
    follower: 'F005',
    title: 'A List of the Yard',
    fromDay: 23,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Pip wants to count the Yard. Every family. Every bed. Names. Then the bread can go by the list, and the north side stops running short every week.',
      'The Yard does not want a list. The Mission keeps lists. The Ledger keeps lists. People on lists get found.',
      'They are right. So am I. A list feeds people. A list is also how you find them.',
    ],
    options: [
      {
        id: 'count',
        label: 'Count them. Fair bread needs a list.',
        effects: { local: { yard: -1, ledger: 1 }, flags: ['pip-yard-census'] },
        response:
          'Pip counts for four days. The bread goes fair for the first time all year. On the fifth morning three families are gone from the north side. Nobody says where.',
      },
      {
        id: 'none',
        label: 'No list. Bread by eye, as before.',
        effects: { local: { yard: 1 }, flags: ['pip-no-census'] },
        response:
          'The bread runs out on the north side first. Every week. Pip writes down which side. They can’t help it. Nobody else sees the page.',
      },
    ],
  },
  {
    id: 'pip-buried',
    follower: 'F005',
    title: 'If the Tower Burns',
    fromDay: 30,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Pip has made a second copy of the register of the missing. Three volumes. Oilcloth. Tied with tarred string. It sits on their stool like a loaf.',
      'If the tower burns, the register burns. I would like this one somewhere else. I can bury it where only I know. Or the Lamplight Archive will take it. The Archive has a vault and a keeper.',
      'Only I know means if I die, nobody knows. The Archive means anybody who owns the Archive owns the names.',
    ],
    options: [
      {
        id: 'bury',
        label: 'Bury it where only Pip knows.',
        effects: { flags: ['pip-copy-buried'] },
        response:
          'Pip is gone one afternoon and comes back with dirt under their nails. They do not say where. They walk lighter. At supper they eat nothing.',
      },
      {
        id: 'archive',
        label:
          'Lodge it with the Lamplight Archive. A vault, a keeper, a receipt.',
        effects: { local: { lamplight: 1 }, flags: ['pip-copy-archived'] },
        response:
          'The keeper signs for it in purple ink. Pip reads the receipt three times. They keep it in their shirt.',
      },
      {
        id: 'tower',
        label:
          'No. The register stays in the tower, where the crown can guard it.',
        effects: { flags: ['pip-copy-in-tower'] },
        response:
          'Pip unties the string and puts the volumes back on the shelf. They tie the string round their wrist instead. They wear it for weeks.',
      },
    ],
  },
  {
    id: 'pip-roster',
    follower: 'F005',
    title: 'A Perfect Hand',
    fromDay: 36,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Pip has a sister’s roster from the Mission, borrowed for one night. Thirty names in a round brown hand. They have copied the hand already, on scrap. It is perfect.',
      'The party going into the Abbey needs a line on this page to get past the door. I can write one. Nobody will ever tell it from hers.',
      'It is the only thing I have never done. I would like you to know that before you ask me.',
    ],
    options: [
      {
        id: 'write',
        label: 'Ask them to write it. People are inside.',
        effects: { local: { lamplight: -1 }, flags: ['pip-forged-roster'] },
        response:
          'Pip writes one line. It takes them an hour. The party gets in. Afterwards Pip burns the scrap and washes their hands until the knuckles crack.',
      },
      {
        id: 'bent',
        label:
          'Remind them you told them once you might bend a page. This is the page.',
        requires: { flags: ['pip-record-bent'] },
        effects: { local: { lamplight: -1 }, flags: ['pip-forged-roster'] },
        response:
          '“You did say.” Pip writes the line. Perfect. They do not burn the scrap. They keep it with your answer from the first week, folded together.',
      },
      {
        id: 'spare',
        label: 'Don’t. The party finds another way in.',
        effects: { flags: ['pip-refused-forgery'] },
        response:
          'Pip puts the pen down. The party goes over the orchard wall instead and comes back a man short, limping. Pip sits with him all night.',
      },
    ],
  },
  {
    id: 'pip-copy',
    follower: 'F005',
    title: 'Let Them Copy',
    fromDay: 48,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Pip is writing out the register of the missing again by the hideout fire. Third time. The hosts’ clerk sits beside them with her own paper and waits.',
      'She wants to copy it as I go. Their villages lost children too. She wants to know which. She would use it. Against the Mission. Against anyone on it.',
      'Once it is in her hand it is not ours. I wanted to ask before it is.',
    ],
    options: [
      {
        id: 'share',
        label: 'Let her copy. Their missing are on it too.',
        effects: { flags: ['pip-register-shared'] },
        response:
          'The clerk copies every page. By the end of the week the hosts have a list of names to say at their fire. And a list of names to hunt. Pip hears both.',
      },
      {
        id: 'hold',
        label: 'Not yet. Not till it is whole and checked.',
        effects: { flags: ['pip-register-held'] },
        response:
          'The clerk puts her paper away. She doesn’t sit with Pip again. The hosts’ bread comes slower after that.',
      },
      {
        id: 'dig',
        label:
          'Send for the copy Pip buried. Give her that one, not the one in their head.',
        requires: { flags: ['pip-copy-buried'] },
        effects: { flags: ['pip-register-shared', 'pip-copy-dug-up'] },
        response:
          'Two scouts dig where Pip draws the map. The oilcloth held. Pip unwraps it at the fire and cries without making a sound. The clerk copies from it. Pip keeps writing anyway.',
      },
    ],
  },
  // --- F006 Nera Gale ----------------------------------------------------------
  {
    id: 'nera-1',
    follower: 'F006',
    title: 'No Weather in It',
    fromDay: 8,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Nera Gale has claimed the highest window in the barracks. Nobody else wants it. The wind comes through. She sits in it with her storm-glass on its chain, coat buttoned to the chin, watching the clouds inside the glass turn.',
      'I owe you an honesty. Better early. In the Heights I drafted forecasts for the Conclave. Good ones. The best of my year. Every one was sold.',
      'Last night, out of habit, I drafted one for you. The Freeholds’ wells run low by the second week of the dry. A crown that knew first could buy their water rights now, cheap, and sell them back in the dry, dear.',
      'It is a very good forecast. It is on your table. I would like you to burn it. And I would like you to want to.',
    ],
    options: [
      {
        id: 'burn',
        label: 'Burn it. Weather is not the crown’s to sell either.',
        effects: { flags: ['nera-forecast-burned'] },
        response:
          'You burn it in the barracks brazier. Nera watches the paper curl. “You will be poorer for that. I will be easier to live with.” The Freehold reeves never learn what they were spared. That, Nera says, is the point.',
      },
      {
        id: 'give',
        label:
          'Don’t sell it. Send it to the Freehold reeves, free, so they can dig deeper before the dry.',
        effects: {
          affinity: { freeholds: 10 },
          local: { ledger: -1 },
          flags: ['nera-forecast-given'],
        },
        response:
          'A quick sideways bird-blink. “Give it away. In the Heights that is a crime.” She copies it three times in her own hand. Factor Tallow sends a note asking, honestly puzzled, why the crown would give away a thing it could sell.',
      },
      {
        id: 'keep',
        label: 'Keep it. The crown is poor, and a forecast is not a person.',
        effects: {
          brass: 15,
          local: { ledger: 1 },
          flags: ['nera-forecast-kept'],
        },
        response:
          '“No. It is not a person. It only decides what persons drink.” She doesn’t ask for it back. She drafts nothing for you for a fortnight. When she does, the prices are left off.',
      },
      {
        id: 'ask-briefing',
        label:
          'Ask about this morning’s briefing instead. She frowned all the way through it.',
        effects: {},
        response: 'The storm-glass stops turning in her fingers.',
        next: 'briefing',
      },
    ],
    beats: [
      {
        id: 'briefing',
        lines: [
          'You noticed. A Conclave habit. You hear a forecast, you check it against the sky.',
          'Two of the reports this morning had weather in them. You could feel where they came from. A road. A well. A frightened runner. The third had none. Smooth all through, like a river stone. I can’t tell you why it was wrong. Only that nobody ever stood outside in it.',
          'Young Komodo read it very well. He reads everything well.',
        ],
        options: [
          {
            id: 'watch',
            label:
              'Ask her to tell you, quietly, whenever a report has no weather in it.',
            effects: { flags: ['nera-watching-briefings'] },
            response:
              '“Quietly.” From then on, some mornings, there is a single grey feather on the arm of the throne before the briefing. You learn not to look at it while Komodo reads.',
          },
          {
            id: 'trust',
            label:
              'Komodo has never misled the crown. The smooth ones are just badly sourced.',
            effects: { flags: ['nera-told-trust-komodo'] },
            response:
              '“Badly sourced. Yes. Probably.” She watches her storm-glass a long while. The clouds inside turn the wrong way. She says that means nothing.',
          },
        ],
      },
    ],
  },
  {
    id: 'nera-2',
    follower: 'F006',
    title: 'Weather on the Wall',
    fromDay: 13,
    romance: true,
    requires: { flags: ['heard:nera-1'], notFlags: IN_THE_TOWER },
    lines: [
      'A storm is building over the Heights. The first real one in a month. Nera has climbed out onto the wall walk to meet it. Coat buttoned wrong. Wind pulling feathers loose at her collar.',
      'Come and see. Quick, before it turns. You will never see one like it from inside.',
      'You go. The cloud stands over the Heights like a wall of slate. The air smells of iron and wet dust. Nera talks you through it, fast: where it breaks, which valley gets it, which elder sold it to whom.',
      'She stops mid-sentence. Looks at you instead of the sky. I have explained weather to a great many people. None of them ever came out into it with me.',
    ],
    options: [
      {
        id: 'stay',
        label: 'Stay out in the storm with her until it breaks.',
        effects: { flags: ['romance-nera'] },
        response:
          'The rain comes all at once. Warm. Enormous. You are both soaked in a breath. Nera laughs like a gull and doesn’t let go of your sleeve. When you come in dripping, the whole barracks works hard at not noticing.',
      },
      {
        id: 'bought',
        label:
          'Ask whether this is the rain the crown bought from the Conclave.',
        requires: { flags: ['rain-covenant'] },
        effects: {},
        response: 'Nera’s face goes still.',
        next: 'bought',
      },
      {
        id: 'refused',
        label:
          'Ask whether she minds that the crown refused the Conclave’s rain, and the Freeholds are dry for it.',
        requires: { flags: ['no-rain'] },
        effects: {},
        response: 'Nera laughs. Then stops.',
        next: 'refused',
      },
      {
        id: 'friend',
        label: 'Thank her for showing you. Go in before it breaks.',
        effects: { flags: ['nera-friendship'] },
        response:
          '“Of course.” She turns back to her storm. From the stair you see her spread her arms into the wind, alone on the wall. It was never only about you.',
      },
    ],
    beats: [
      {
        id: 'bought',
        lines: [
          'Yes. You can tell. It comes in too straight, like a hired cart. The Conclave sends it down the valley it was paid for. Not a drop further.',
          'I don’t hate you for signing. I keep trying, up here. I can’t. The Freeholds would have lost the harvest. I know the arithmetic. I did it for the Conclave a hundred times.',
          'I only wish I could stand in it without knowing what it cost.',
        ],
        options: [
          {
            id: 'stay',
            label: 'Stand in it with her anyway. Know what it cost, together.',
            effects: { flags: ['romance-nera'] },
            response:
              'The rain comes straight as a hired cart. You stand in it side by side, soaked, silent. After a while she takes your paw. “Together,” she says. “That helps the arithmetic.”',
          },
          {
            id: 'friend',
            label:
              'Tell her you understand. Leave her to a storm she needs to stand in alone.',
            effects: { flags: ['nera-friendship'] },
            response:
              '“Thank you.” She doesn’t look round. In the morning her coat is buttoned right. She is precise and kind to you and nothing more.',
          },
        ],
      },
      {
        id: 'refused',
        lines: [
          'Mind? I lay awake the night you refused, laughing. Nobody refuses the Conclave. Corvane folded that covenant so slowly. I have never seen him fold anything slowly.',
          'Next morning I walked the Freehold fields with the tally carts. The wheat was standing yellow. I stopped laughing. You were right. And the wheat is yellow.',
          'This one isn’t for sale. Nobody bought it. It is only weather. I wanted you to see one.',
        ],
        options: [
          {
            id: 'stay',
            label: 'Stay out in the unbought storm with her.',
            effects: { flags: ['romance-nera'] },
            response:
              'It breaks over the tower at dusk. Freehold, fortress, canyon, all alike. Nera stands in it, face up, your paw in hers. “This one is ours,” she says. She doesn’t mean the crown.',
          },
          {
            id: 'friend',
            label: 'Thank her for the storm, as a friend, and go in.',
            effects: { flags: ['nera-friendship'] },
            response:
              '“As a friend.” She lets the rain have her. From the barracks window you watch her an hour. When the lightning shows her where you are, she waves once.',
          },
        ],
      },
    ],
  },
  {
    id: 'nera-3',
    follower: 'F006',
    title: 'A Letter from the Heights',
    fromDay: 24,
    romance: true,
    requires: {
      flags: ['heard:nera-2', 'romance-nera'],
      notFlags: courting('nera'),
    },
    lines: [
      'A letter on Nera’s knees. Unopened. Grey wax, a single copper chime pressed into it. She has sat with it since the afternoon post. Her storm-glass lies face down on the blanket.',
      'My old teacher. I know her hand on the outside. She taught me to read the wind when I was smaller than my forecasts. She is why I am clever. She is why I am afraid of what my cleverness is for.',
      'I can’t open it. If she asks me home, I might go. I have never once refused her to her face. Read it first. Tell me what it says. You decide what I hear.',
      'I know what that asks. I am asking you because you are the only one I would trust to lie to me well.',
    ],
    options: [
      {
        id: 'read',
        label: 'Open it. Read it to yourself first.',
        effects: {},
        response:
          'You break the chime out of the wax. It rings once. Small. Nera flinches.',
        next: 'letter',
      },
      {
        id: 'refuse',
        label: 'She opens it herself. You will sit beside her while she does.',
        effects: { flags: ['nera-opened-own-letter'] },
        response:
          'She looks at you as if you had handed her a knife hilt first. Then she opens it. Her paws shake for one line. Steady by the third. “She wants me home. She wants your weather-books. She says she misses me. I think that part is true.” She burns it herself. She holds your hand while it burns.',
      },
      {
        id: 'friend',
        label:
          'Tell her you cannot decide what she hears. Not as her sweetheart. Be her friend in this.',
        effects: { flags: ['nera-friendship'], clearFlags: ['romance-nera'] },
        response:
          '“Not as my sweetheart. No. Fair. I was asking you to be my teacher, and I already had one.” She opens it alone that night. In the morning she tells you, as a friend, she will not answer it.',
      },
    ],
    beats: [
      {
        id: 'letter',
        lines: [
          'Short. Beautifully written. Her teacher misses her. The Conclave forgives her leaving. A room is ready: the one with the east window. All she need bring is the crown’s weather-books. Copied and returned, as a courtesy between neighbours.',
          'At the bottom, different ink, added later: The ruler you serve will need our rain, whatever they have signed. Come home before you are asked to choose.',
          'Nera is watching your face, not the letter. She is a storm-reader. She can see the weather on you.',
        ],
        options: [
          {
            id: 'truth',
            label: 'Read it to her exactly as written.',
            effects: { flags: ['nera-heard-letter'] },
            response:
              'At the east window her breath catches. At the weather-books her eyes open. “Courtesy between neighbours. She taught me that phrase. It means theft.” She keeps the letter. She doesn’t answer it. She doesn’t throw it away.',
          },
          {
            id: 'soften',
            label:
              'Read her only the kind part. Her teacher misses her and forgives her. Burn the rest.',
            effects: { flags: ['nera-letter-softened'] },
            response:
              'Nera cries a little. You have never seen it. “She forgave me. I didn’t know I needed that.” You burn the second half while she washes her face. You never tell her. Some nights you can’t say if that was love or theft.',
          },
          {
            id: 'double',
            label:
              'Read all of it. Then suggest she write back: go home in letters only, and tell the crown what the Conclave asks.',
            effects: {
              affinity: { 'storm-crows': 5 },
              flags: ['nera-writes-home'],
            },
            response:
              '“You want me to lie to her. For you.” A long pause. “I would. That is what frightens me. I would do it well.” She writes the first letter that night, warm and evasive. She gives you the copy without being asked. She doesn’t sleep.',
          },
          {
            id: 'friend',
            label:
              'Fold it back up. You should not stand between her and her teacher. Be her friend. Let her read it.',
            effects: {
              flags: ['nera-friendship'],
              clearFlags: ['romance-nera'],
            },
            response:
              'She reads it herself while you sit beside her. “Thank you for not choosing for me.” She had wanted you to. She is glad you didn’t. Both are an ending.',
          },
        ],
      },
    ],
  },
  {
    id: 'nera-4',
    follower: 'F006',
    title: 'No Person Is Payment',
    fromDay: 35,
    romance: true,
    requires: {
      flags: ['heard:nera-3', 'romance-nera'],
      notFlags: courting('nera'),
    },
    lines: [
      'The Conclave’s debt is due. The Heights are black with crows. Nera hasn’t slept. She stands at the high window with the storm-glass clenched in her fist, watching them wheel over the far ridge.',
      'I want to ask you something as the person you stood in the rain with. Not your forecaster. It is unfair. I have decided to be unfair once in my life. Now.',
      'Swear it in the hall tomorrow, with Corvane’s crows on the sills to carry it home. No person of this court is ever payment. Not for rain. Not for debt. Not for war. Not runners. Not children. Not me.',
      'It will cost the crown. The Conclave will take it as an insult. It is one. But I cannot love someone who keeps that door open. I am afraid I already do.',
    ],
    options: [
      {
        id: 'swear',
        label: 'Swear it in the hall tomorrow.',
        effects: {
          affinity: { 'storm-crows': -10 },
          local: { lamplight: 1 },
          flags: ['romance-nera-sealed', 'nera-oath-sworn'],
        },
        response:
          'You swear it at morning petitions. Plainly. Every Conclave lookout on every sill lifts at once. A black wind out of the windows toward the Heights. Nera is at the back of the hall. She closes her eyes, the way people do when the rain finally comes.',
      },
      {
        id: 'runners',
        label:
          'Tell her you will swear it, and start by bringing home the six runners the Yard sent up the Heights.',
        requires: { flags: ['runners-lent'] },
        effects: {},
        response: 'The storm-glass goes still in her fist.',
        next: 'runners',
      },
      {
        id: 'honest',
        label:
          'Tell her the truth. You love her. You cannot swear it. A crown at war cannot close every door.',
        effects: { flags: ['romance-nera-sealed', 'nera-oath-refused'] },
        response:
          'The crows turn behind her. “Then I will keep the door,” she says at last. “Somebody has to stand in it.” She stays. She loves you. Some nights you find her at the high window, watching the Heights. You don’t ask what she is forecasting.',
      },
      {
        id: 'friend',
        label:
          'Tell her not to tie her heart to a crown that may have to break that oath. Be her friend instead.',
        effects: { flags: ['nera-friendship'], clearFlags: ['romance-nera'] },
        response:
          'Her fist opens on the storm-glass. “Most honest thing anyone has said to me since the Heights. I wish it were less honest.” She stays. She still leaves a grey feather on the throne on mornings with no weather in them.',
      },
    ],
    beats: [
      {
        id: 'runners',
        lines: [
          'She turns from the window. The crows go on wheeling.',
          'They won’t give them back for nothing. Brass. A great deal. Or the Ford’s water. Or six more. You will pay to undo what you paid.',
          'I would like to tell you not to. To keep your brass for the war. I can’t. Bring them home.',
        ],
        options: [
          {
            id: 'ransom',
            label:
              'Pay what it takes to bring them home. Swear the oath when they are through the gate.',
            requires: { cost: 30 },
            effects: {
              affinity: { 'storm-crows': -5 },
              local: { yard: 3 },
              flags: [
                'romance-nera-sealed',
                'nera-oath-sworn',
                'nera-runners-ransomed',
              ],
            },
            response:
              'Corvane takes the brass without counting. Too much, then. The six come down the Heights road on the fourth day. Thinner. Quieter. One limping. Their mothers are at the Yard gate. Nera is at the back. When you swear the oath that evening she says it with you, under her breath, word for word.',
          },
          {
            id: 'swear',
            label: 'Swear it now. The runners come home when the war is won.',
            effects: {
              affinity: { 'storm-crows': -10 },
              flags: ['romance-nera-sealed', 'nera-oath-sworn'],
            },
            response:
              'You swear it. The crows leave the sills. Nera stands beside you this time. Afterwards: “When the war is won.” Like a date on a forecast. She will hold you to it.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'nera-hail',
    follower: 'F006',
    title: 'Hail on the Wheat',
    fromDay: 29,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Nera’s storm-glass has gone white at the bottom. Small grains, like salt, turning.',
      'Hail. Three days. On the Freehold wheat below the Ford, a week before it’s cut. I am certain.',
      'Forecasts are Conclave property. If the Freeholds are warned and the wheat is saved, Corvane will know exactly who read it. Then I stop being a dissident in your barracks and start being a thief. They hang thieves on the Heights. Slowly.',
    ],
    options: [
      {
        id: 'warn',
        label: 'Warn the Freeholds. Wheat feeds the winter.',
        effects: {
          affinity: { freeholds: 5, 'storm-crows': -5 },
          flags: ['nera-warned-freeholds'],
        },
        response:
          'Riders go out by noon. The Freeholds cut green and lose a third instead of all of it. Four days later a Conclave courier leaves a single black feather on Nera’s sill. She keeps it.',
      },
      {
        id: 'silent',
        label: 'Say nothing. Her cover is worth more than one harvest.',
        effects: { flags: ['nera-kept-hail'] },
        response:
          'The hail comes on the third day, white and loud. The wheat below the Ford is flat by evening. Nera watches from the high window and writes down how long it lasted. Exactly.',
      },
    ],
  },
  // --- F007 Ash Quill ----------------------------------------------------------
  {
    id: 'ash-1',
    follower: 'F007',
    title: 'Letters Delivered Unopened',
    fromDay: 16,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Ash Quill sorts the barracks post on the long table. Fast. Neat. Enormous ears swivel at every footstep. The satchel is still stained with fever-sweat from the Ford. Nobody is allowed to wash it.',
      'I deliver letters unopened. Forty roads. Eleven years. Love letters, death notices, ransom terms, one very angry recipe. Never opened one.',
      'Except one kind. Anything on any Saltroad post addressed to my little brother, Sorrel Quill, I open. He went up the mission road four winters ago to work in the Abbey kitchens. Wrote every week for a month. Then nothing.',
      'Yesterday a letter came. From the Abbey. He is content and at his lessons and does not wish to be disturbed. A sister’s hand. Not his.',
    ],
    options: [
      {
        id: 'ask-letter',
        label: 'Ask to see the Abbey’s letter.',
        effects: {},
        response: 'Ash takes it from an inside pocket and smooths it flat.',
        next: 'letter',
      },
      {
        id: 'hourglass',
        label:
          'Ask instead about the brass hourglass in their satchel. The one addressed to Young Komodo.',
        requires: { flags: ['courier-saved'] },
        effects: {},
        response: 'Ash’s ears go flat. Then, carefully, upright again.',
        next: 'hourglass',
      },
      {
        id: 'ride',
        label:
          'Tell Ash to take a fast horse up the mission road and ask after him.',
        effects: { affinity: { abbey: -5 }, flags: ['ash-asked-abbey'] },
        response:
          'Back two nights later, dust to the ear-tips. “They were so kind. Sister Marrow gave me soup. He is at lessons in the lower house. Visitors upset the little ones. I should write.” A pause. “She counted something on her cord the whole time.” They don’t unpack the satchel for a week.',
      },
    ],
    beats: [
      {
        id: 'letter',
        lines: [
          'Short. Warm. Perfectly spelled. Sorrel is well, at lessons, content, and asks that his family not disturb his peace with visits.',
          'Sorrel can’t spell content. He couldn’t four years ago. He hated lessons so much he once hid in a flour barrel all day to miss one. I don’t know who this boy is. He isn’t my brother.',
          'I could forge a reply in his hand. I know it better than my own. Write to the Abbey as Sorrel, ask about something only the real one would know, and see who answers. It is a forgery. A lie to the Abbey. It may be the only door I have.',
        ],
        options: [
          {
            id: 'forge',
            label:
              'Write the forgery. Let the Abbey answer a boy who isn’t there.',
            effects: { flags: ['ash-forged-sorrel'] },
            response:
              'An hour, in a round sloppy flour-barrel hand. Ash asks after a dog the family never had. The answer comes in nine days. Warm. Perfectly spelled. The dog is well and sends his love. Ash folds it very small and puts it in the inside pocket with the others.',
          },
          {
            id: 'honest',
            label:
              'No forgeries in the crown’s name. Write honestly, as his sibling, under the crown’s seal.',
            effects: { affinity: { abbey: -5 }, flags: ['ash-wrote-honestly'] },
            response:
              'You seal it. Nine days. Same sister’s hand. Very sorry. Sorrel is at lessons in the lower house. Visitors upset the little ones. Nearly the first letter, word for word. Ash lays the two side by side on the table and says nothing.',
          },
        ],
      },
      {
        id: 'hourglass',
        lines: [
          'I carried it from the mission road to the Ford. A sister on the road paid in advance. Brass. Generous. To Young Komodo, at the tower, by hand. Not by post. Very particular about not by post.',
          'I don’t open letters. I didn’t open the hourglass. I know who handed it to me. Grey robes. And Komodo gave it to the court a little fast. The way you drop something hot.',
          'I’m telling you because that is what a courier is for. Someone should know where things came from. It probably means nothing. Most things do.',
        ],
        options: [
          {
            id: 'secret',
            label: 'Thank Ash. Ask them to keep it between the two of you.',
            effects: { flags: ['ash-hourglass-told'] },
            response:
              '“Between us.” They don’t ask why. At the next briefing Komodo asks after Ash’s health, warmly. Ash answers warmly. Neither looks at the hourglass on the shelf.',
          },
          {
            id: 'nothing',
            label:
              'It means nothing. Komodo has friends on every road. The Abbey sends gifts to half the court.',
            effects: { flags: ['ash-hourglass-dismissed'] },
            response:
              '“Half the court.” Back to the post. Fast. Neat. The next letter for Komodo that comes through their paws, they hold a moment longer than the others. Then set it down. Unopened.',
          },
        ],
      },
    ],
  },
  {
    id: 'ash-2',
    follower: 'F007',
    title: 'Papers in Another Name',
    fromDay: 19,
    romance: true,
    requires: { flags: ['heard:ash-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Ash is waiting in your chamber. On the very edge of a chair. Flat oilcloth packet on their knees. The tips of their ears are pink. They can’t help it. They hate it.',
      'The Watch is checking every pass in the Yard this week, for the levy rolls. You should hear this from me before a sergeant.',
      'Before I came here I forged travel papers. Seventy-three sets. Families past checkpoints that would have turned them back. Or sold them. Some of those families are in your Yard. A sergeant with good eyes finds my hand on four passes by the week’s end.',
      'I’m not sorry. I’d do it again tomorrow. But I’m afraid, and I wanted to be afraid in front of you, not behind your back. I don’t know why that mattered so much. That’s a lie. I know exactly why.',
    ],
    options: [
      {
        id: 'seal',
        label:
          'Take the packet. Seal every pass into the crown’s register as genuine.',
        effects: {
          local: { 'gate-watch': -1, yard: 1 },
          flags: ['ash-papers-sealed'],
        },
        response:
          'You stamp the crown’s seal on their forgeries one after another. Their ears go pinker with every stamp.',
        next: 'ears',
      },
      {
        id: 'show',
        label:
          'The Watch must see them. You will stand beside Ash while it does.',
        effects: { local: { 'gate-watch': 2 }, flags: ['ash-papers-shown'] },
        response:
          '“Beside me. All right.” The sergeant is fair. The families keep their places. Ash’s name goes into the Watch book in red.',
        next: 'ears',
      },
    ],
    beats: [
      {
        id: 'ears',
        lines: [
          'Whatever happened to the passes, Ash is still on the edge of the chair. They haven’t left.',
          'I said I know exactly why. Couriers finish what they carry.',
          'I wanted you to think well of me. Not the crown. You. If you heard it from a sergeant you would think I was hiding it from you. I couldn’t bear that. So. Here I am. Ears doing this.',
        ],
        options: [
          {
            id: 'up-close',
            label:
              'Tell Ash you think very well of them, and want to go on thinking it. Up close.',
            effects: { flags: ['romance-ash'] },
            response:
              'Pink to scarlet. “Up close,” they say. “I can do up close.” They stay till the candle is out, talking about every road they have ridden. Halfway through they put their head on your shoulder, like it has carried letters for eleven years and is tired.',
          },
          {
            id: 'friend',
            label:
              'Tell Ash you think well of them, as a friend. That won’t change.',
            effects: { flags: ['ash-friendship'] },
            response:
              '“As a friend. Good. That’s a lot, actually. More than I usually get.” At the door, not turning round: “Thank you for not making it awkward.” That makes it awkward. You both laugh.',
          },
        ],
      },
    ],
  },
  {
    id: 'ash-3',
    follower: 'F007',
    title: 'A Letter Addressed to Ash',
    fromDay: 25,
    romance: true,
    requires: {
      flags: ['heard:ash-2', 'romance-ash'],
      notFlags: courting('ash'),
    },
    lines: [
      'A letter on Ash’s bunk when they come in off the Ford road. Plain paper. Crown seal. Their own name on the front in your hand. You sit on the bunk opposite. You couldn’t make yourself leave before they found it.',
      'Ash stands looking at it, satchel still on.',
      'Eleven years. Nobody’s ever written to me. I carry everybody’s. I didn’t know what it looked like from this side.',
      'They open it carefully, the way couriers open nothing. They read it. Their ears go still. One thing I have to ask before I say anything about what’s in here. It isn’t fair. I’m asking anyway.',
    ],
    options: [
      {
        id: 'ask',
        label: 'Tell them to ask.',
        effects: {},
        response: 'Ash folds the letter and holds it flat against their chest.',
        next: 'ask',
      },
      {
        id: 'friend',
        label:
          'Tell Ash it is a friend’s letter. You should have written that more plainly.',
        effects: { flags: ['ash-friendship'], clearFlags: ['romance-ash'] },
        response:
          'Ash reads it again, looking for the place where it says so. “A very kind friend’s letter. I’ll keep it anyway. Nobody else ever wrote me one.” Into the inside pocket, with the others.',
      },
    ],
    beats: [
      {
        id: 'ask',
        lines: [
          'If Sorrel is in the Abbey, and we ever know it for certain, I need to know the crown goes in after him. Whatever it costs with the Abbess. Whatever the court says about an emperor who goes to war over a courier’s brother.',
          'I’m asking you to spend your crown on my family because you wrote me a letter. A good ruler says no. I’m asking anyway. I’d rather know now.',
        ],
        options: [
          {
            id: 'promise',
            label: 'Promise it. If Sorrel is there, the crown goes in.',
            effects: {
              affinity: { abbey: -5 },
              flags: ['ash-abbey-promise'],
            },
            response:
              'Ash sits down beside you and leans on your arm, ears flat. “I won’t hold you to it.” Then: “I will absolutely hold you to it.” They fall asleep there, satchel and all, your letter in their fist.',
          },
          {
            id: 'honest',
            label:
              'Tell them the truth. Everything a crown can do, you will. You cannot promise a war for one boy.',
            effects: { flags: ['ash-honest-answer'] },
            response:
              '“Everything a crown can. A real answer. I hate that it’s a real answer.” They don’t move away. After a while they read your letter again. Aloud. Quietly. Checking it’s still true after the hard part. It is.',
          },
          {
            id: 'friend',
            label:
              'Tell them you cannot be the reason they choose. You’d rather be their friend than their promise.',
            effects: { flags: ['ash-friendship'], clearFlags: ['romance-ash'] },
            response:
              '“Friend, not promise. Good line. I’d deliver it.” The letter goes in the inside pocket anyway. “I’ll find him with or without the crown,” they add. Kindly. To spare you worrying. That is worse.',
          },
        ],
      },
    ],
  },
  {
    id: 'ash-4',
    follower: 'F007',
    title: 'Bread at the Side Gate',
    fromDay: 36,
    romance: true,
    requires: {
      flags: ['heard:ash-3', 'romance-ash'],
      notFlags: courting('ash'),
    },
    lines: [
      'The Abbey has invited the court to a rehearsal. Everyone knows what that word might mean. Nobody says it. Ash is in the stables with a dark lantern, a set of forged sister’s papers and a grey habit folded over the saddle. They don’t stop packing.',
      'There’s a way in through the kitchens. Sorrel’s third letter, the last real one. The bread goes in at the side gate before dawn. Nobody looks at whoever carries it. I’m going to carry the bread.',
      'It’s lethal. I know. I read the posting.',
      'I’m not asking leave. I’m asking you to say something before I go, so I have it to carry. Or something that stops me. I haven’t decided which I want.',
    ],
    options: [
      {
        id: 'go',
        label: 'Tell Ash you love them. Let them go.',
        effects: { flags: ['romance-ash-sealed', 'ash-goes-in'] },
        response:
          'Ash sets the lantern down. Holds your face in two small ink-stained paws. Looks at you like an address they are memorising. “Then I have it. I’ll bring it back.” Gone by the side gate before dawn, with the bread. You stand on the wall till noon.',
      },
      {
        id: 'stop',
        label:
          'Tell Ash you love them, and forbid it. You will not send them in to die for a face.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['romance-ash-sealed', 'ash-forbidden'],
        },
        response:
          'Ears flat. “Forbid. You’d chain me, for love.” “Yes.” They unbuckle the saddlebag. Leave the grey habit on the stable floor. Two days without a word. On the third they sit beside you at supper and lean on your arm. Neither of you apologises.',
      },
      {
        id: 'promise',
        label:
          'Remind them of your promise. If Sorrel is there, the crown goes in. Not one courier with a lantern. The crown.',
        requires: { flags: ['ash-abbey-promise'] },
        effects: {
          affinity: { abbey: -5 },
          flags: ['romance-ash-sealed', 'ash-promise-renewed'],
        },
        response:
          'Ash looks at the habit. At you. At the habit. “The crown. Banners. Loudly.” “Loudly.” The lantern goes down. “Terrible plan for finding someone,” they say. “I love you.” As if it were one sentence.',
      },
      {
        id: 'friend',
        label:
          'Tell Ash you cannot be the thing they carry in there. Be their friend. Let their reasons be their own.',
        effects: { flags: ['ash-friendship'], clearFlags: ['romance-ash'] },
        response:
          '“My own reasons. Older ones, anyway.” They finish packing. You never learn for certain whether they went to the side gate. The lantern is gone. The habit is gone. On the third day they come back with flour in their fur and say nothing.',
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'ash-seal',
    follower: 'F007',
    title: 'Saltroad Wax',
    fromDay: 30,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Ash has one letter apart from the rest of the post, face down on the table. Their paw is flat on it.',
      'Addressed to the court adviser. Saltroad wax. But the wax is wrong. It’s the factor’s seal pressed into Abbey grey. Somebody melted one over the other.',
      'I don’t open letters. Eleven years. That’s the whole of what I am. And I have never wanted to open one more in my life.',
    ],
    options: [
      {
        id: 'open',
        label: 'Open it. Reseal it. He never knows.',
        effects: { flags: ['ash-opened-komodo-letter'] },
        response:
          'Ash opens it with a hot knife and shaking paws. Grain prices. Nothing else. They reseal it perfectly. They can’t eat that night. They don’t say which part made them sick.',
      },
      {
        id: 'deliver',
        label:
          'Deliver it unopened. A courier who opens one letter opens them all.',
        effects: { flags: ['ash-delivered-unopened'] },
        response:
          'Ash puts it in Komodo’s hand. He thanks them and slits it with one claw. Doesn’t read it there. Ash watches him walk away with it. Their ears stay flat for a day.',
      },
    ],
  },
  // --- F008 Bram Coil ----------------------------------------------------------
  {
    id: 'bram-1',
    follower: 'F008',
    title: 'Everybody Eats First',
    fromDay: 6,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Bram Coil fills the larder doorway the way a wagon fills a gate. Abacus in one hand. Slate in the other. A pencil behind each ear. He counts sacks under his breath. He has never once been hurried.',
      'The barracks eats from the same stores as the Yard. That’s how it was when I came. Then your outriders started coming back hungry enough to eat the table. The cook started cutting them bigger portions. Quietly. From the Yard’s side.',
      'I accuse nobody. The cook is kind. The outriders are hungry. But I have seen what happens when one table eats better than another in a hungry season. I won’t see it twice.',
      'One ration for everyone, or more for those who ride? You decide. Then I hold the line.',
    ],
    options: [
      {
        id: 'equal',
        label: 'One ration. The barracks eats what the Yard eats.',
        effects: {
          local: { yard: 2, 'gate-watch': -1 },
          flags: ['bram-one-ration'],
        },
        response:
          'Bram writes it on the slate in letters a hand high. The outriders grumble for a week. The Yard says nothing. In the Yard that is the loudest praise there is. Foreman Dunmore shares a pipe with Bram on the larder step.',
      },
      {
        id: 'riders',
        label: 'More for those who ride. A hungry outrider makes mistakes.',
        effects: {
          local: { 'gate-watch': 1, yard: -1 },
          flags: ['bram-riders-ration'],
        },
        response:
          '“Then it goes on the board. With the reason.” He nails it up himself. Nobody can call it secret. The Yard reads it anyway.',
      },
      {
        id: 'ask',
        label: 'Ask what he saw happen, the first time.',
        effects: {},
        response: 'Bram sets the abacus down on a sack.',
        next: 'riot',
      },
      {
        id: 'levied',
        label:
          'Ask whether the bread stencilled LEVIED is eaten at both tables alike.',
        requires: { flags: ['d05-millers-flour'] },
        effects: {},
        response:
          '“Every loaf. Every loaf carries the crown’s order on its belly, so the Yard knows whom to thank.” He looks at you levelly. “Bread remembers. Nobody tells emperors that.”',
        next: 'riot',
      },
    ],
    beats: [
      {
        id: 'riot',
        lines: [
          'Saltroad. Six years ago. A caravan town held out a month-long siege. The day it lifted, the factor wanted a victory feast in the square. Speeches first. Then bread.',
          'I was quartermaster. The bread was in my store. I held the door while the speeches went on. And on. Someone at the back who hadn’t eaten in four days tried to climb over the people in front.',
          'Nobody died. A child broke both arms. The factor finished his speech. So: everyone eats first. I have said it to rulers before you. They laughed.',
        ],
        options: [
          {
            id: 'eat-first',
            label:
              'One ration. And nobody speaks in this fortress until everyone has eaten.',
            effects: {
              local: { yard: 2, 'gate-watch': -1 },
              flags: ['bram-one-ration', 'bram-eat-first'],
            },
            response:
              'Bram checks whether you are laughing. You aren’t. On the slate: EVERYONE EATS FIRST. Next time you rise to speak at a feast, the bread is already on the tables. Bram stands at the back with his arms folded. Daring anyone to make you wait.',
          },
          {
            id: 'riders',
            label:
              'More for the riders, posted openly, with the reason. Hungry roads kill more than hungry squares.',
            effects: {
              local: { 'gate-watch': 1, yard: -1 },
              flags: ['bram-riders-ration'],
            },
            response:
              'Bram weighs it like a sack. “Openly. With the reason. Not nothing.” He posts it. Underneath, smaller, his own line: THE YARD EATS BEFORE ANY SPEECH. Nobody takes that one down.',
          },
        ],
      },
    ],
  },
  {
    id: 'bram-2',
    follower: 'F008',
    title: 'No Sky',
    fromDay: 22,
    requires: { flags: ['heard:bram-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Behind the stables at dusk. Bram sits on an overturned trough with his great head in his hands. He doesn’t stand when he sees you. He has never failed to stand.',
      'The board has me on the survey under the old rail line. Three days below ground.',
      'I went down the first ladder this morning to look. Four rungs. Then I was back at the top, on my knees in the dirt. The Yard porters stood round me in a ring, saying nothing. I can’t tell you how I got there.',
      'I can hold a line against anything that walks. Not with a ceiling over me. I’m asking to be taken off the survey. I’m ashamed to ask.',
    ],
    options: [
      {
        id: 'off',
        label: 'Take him off the survey. Nobody needs to know why.',
        effects: {
          local: { 'gate-watch': -1 },
          flags: ['bram-spared-tunnels'],
        },
        response:
          'A long breath. “Somebody always knows why. Thank you.” The porters who saw him never mention it. One of them starts propping the larder door open whenever Bram is inside. Bram pretends not to notice.',
      },
      {
        id: 'face',
        label:
          'The board needs him below. Fear is not a reason. It is a weight, and he can carry weight.',
        effects: { local: { 'gate-watch': 1 }, flags: ['bram-sent-below'] },
        response:
          'Bram stands. All of him. “A weight. All right.” He goes down with a lamp tied to each horn and doesn’t speak for three days. When he comes up he sits in the Yard with his face to the sky for an hour. Nobody disturbs him.',
      },
      {
        id: 'ask',
        label: 'Ask where the fear began.',
        effects: {},
        response: 'Bram looks at his hands as if they belong to someone else.',
        next: 'cellar',
      },
    ],
    beats: [
      {
        id: 'cellar',
        lines: [
          'The riot. When the square broke, they broke the store door too. I went down to hold the cellar stair. They came down after me.',
          'Nobody hurt me. They wanted bread. I was standing in front of it in the dark. The ceiling was low. I could hear that child screaming up in the square the whole time. I couldn’t get to her.',
          'It isn’t the dark. It’s being under. Knowing someone is up there. Not being able to reach them.',
        ],
        options: [
          {
            id: 'walls',
            label:
              'Put him on the walls instead. Where he can see everyone and reach anyone.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['bram-spared-tunnels', 'bram-on-walls'],
            },
            response:
              '“The walls.” His shoulders come down an inch. He takes the night watch on the east wall from then on. The Watch, wary of a quartermaster with no rank, start bringing him their arguments to settle.',
          },
          {
            id: 'above',
            label:
              'Send him down. Promise you will sit at the top of the ladder the whole survey. He will always know where you are.',
            effects: { flags: ['bram-sent-below', 'bram-emperor-above'] },
            response:
              '“Three days at a ladder.” “Yes.” He goes down. You sit at the top, doing the crown’s letters on your knee. Every few hours a voice comes up from far below. It doesn’t say anything. It’s checking. You answer it.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'bram-third',
    follower: 'F008',
    title: 'A Third Off',
    fromDay: 32,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Bram has chalked a new number on the larder door. Two thirds. He stands beside it like a sentry.',
      'War stores have to last to the thaw. They won’t, at the old ration. So the barracks eats two thirds. A Watch sentry fainted on the east wall this morning. He’ll be the first of many.',
      'Hold the line, and the stores last and the Watch is weak. Give it back, and the Watch is strong till the stores run out. Pick the month you want to be hungry in.',
    ],
    options: [
      {
        id: 'hold',
        label: 'Hold the line. Two thirds to the thaw.',
        effects: { local: { 'gate-watch': -1 }, flags: ['bram-held-ration'] },
        response:
          'Bram eats his two thirds at the barracks table where everyone can see. Three more sentries faint that week. The stores hold. Bram looks thinner every day and won’t talk about it.',
      },
      {
        id: 'restore',
        label:
          'Give the Watch its full ration. The Yard makes up the difference.',
        effects: {
          local: { 'gate-watch': 1, yard: -1 },
          flags: ['bram-watch-fed'],
        },
        response:
          'Bram rubs out the chalk. Then he walks down to the Yard and tells them himself, to their faces. He doesn’t send a clerk. They don’t thank him for it.',
      },
    ],
  },
  // --- F009 Keel Understone ----------------------------------------------------
  {
    id: 'keel-1',
    follower: 'F009',
    title: 'The Sluice Decree',
    fromDay: 27,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Keel Understone has a survey map spread across two bunks. A lantern holds down one corner. A boot holds down the other. Keel kneels between the bunks and traces a blue line with one claw.',
      'The imperial well-works. I mapped it for your predecessor’s clerks. Paid by the yard. Good pay.',
      'This is the sluice at the north cistern. There is a decree on the books, never repealed. In a dry year the crown may drop the sluice and send the overflow down the old channels. To keep the mills turning.',
      'The old channels run into the burrows. Forty-one homes. Water finds them in a night.',
      'I want it repealed. In writing. Before the war makes it convenient.',
    ],
    options: [
      {
        id: 'repeal',
        label: 'Repeal the sluice decree. Today, in writing.',
        effects: {
          affinity: { moles: 10 },
          local: { 'old-houses': -2 },
          flags: ['keel-sluice-repealed'],
        },
        response:
          'You sign it on the bunk, on top of the map. Keel reads it twice and puts it in a shell-pocket. The millers send a delegation the next morning. You keep them waiting until noon.',
      },
      {
        id: 'closed',
        label:
          'Tell Keel the crown has dropped that sluice once already, in the drought.',
        requires: { flags: ['wells-closed'] },
        effects: {},
        response: 'Keel’s claw stops on the blue line.',
        next: 'closed',
      },
      {
        id: 'third',
        label:
          'Pay for a survey of a third channel: one that waters the mills and spares the burrows.',
        requires: { cost: 20 },
        effects: {
          affinity: { moles: 5 },
          local: { lamplight: 1 },
          flags: ['keel-third-channel'],
        },
        response:
          'Keel looks up. “That’s a month of digging.” “Then dig.” They start that night with a lamp and a chain. The decree stays on the books. Keel checks the sluice every morning on the way to breakfast.',
      },
      {
        id: 'keep',
        label:
          'Keep the decree. In a war the mills feed the fortress, and the crown may need that sluice.',
        effects: { local: { 'old-houses': 1 }, flags: ['keel-sluice-kept'] },
        response:
          'Keel rolls the map. Edge to edge. “Then I’ll keep a list of who lives in those forty-one homes,” they say. “So somebody has the names, after.” The list goes up over their bunk.',
      },
    ],
    beats: [
      {
        id: 'closed',
        lines: [
          'I know. I was in the burrows that night. You saw a sluice come down. I saw the water come up the stair. A hand a minute.',
          'Nobody drowned. We carried the old ones out on doors. Granny Umber’s cousin lost his loom. That’s the good version.',
          'I came anyway. The truce asked me to believe the crown could change its mind. This is me asking you to prove it.',
        ],
        options: [
          {
            id: 'repeal',
            label: 'Repeal it. Prove it.',
            effects: {
              affinity: { moles: 10 },
              local: { 'old-houses': -2 },
              flags: ['keel-sluice-repealed'],
            },
            response:
              'You sign. Keel takes the paper down to the burrows that night and reads it aloud at the bottom of the stair where the water came up. Nobody cheers. They ask to see the seal.',
          },
          {
            id: 'keep',
            label: 'Keep it. The crown will not tie its own hands in a war.',
            effects: {
              local: { 'old-houses': 1 },
              flags: ['keel-sluice-kept'],
            },
            response:
              '“No,” Keel says. “Crowns never do.” They fold the map. They stay. They sleep with the head-lamp on.',
          },
        ],
      },
    ],
  },
  {
    id: 'keel-2',
    follower: 'F009',
    title: 'Under the Old Houses',
    fromDay: 36,
    requires: { flags: ['heard:keel-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Keel finds you on the wall after midnight. The head-lamp is off. Keel never turns it off.',
      'I’m going to tell you something. Then I’m going to ask you to forget it. You won’t be able to.',
      'There’s a cell in the burrows. Young ones. Not Granny Umber’s. They’ve mapped the Old Houses’ cellars from below. When the war reaches the walls, they mean to open the old channels into them. Flood the houses out.',
      'The Old Houses’ cellars are where the servants sleep. Yard folk. Poor folk. Same as the burrows.',
      'I won’t drown a poor home. Not for you. Not for the revolution. So I’m telling the crown. That makes me the one who sold my own cell.',
    ],
    options: [
      {
        id: 'arrest',
        label:
          'Send the Watch into the burrows tonight and take the cell before it digs.',
        effects: {
          affinity: { moles: -10 },
          local: { 'gate-watch': 2, 'old-houses': 2 },
          flags: ['keel-cell-taken'],
        },
        response:
          'The Watch goes down at midnight with Keel’s map. They bring up six. The youngest is fifteen. Keel stands at the top of the ladder and watches each one come up into the lamplight. None of them looks at Keel.',
      },
      {
        id: 'talk',
        label: 'Let Keel go down alone and talk them out of it. No Watch.',
        effects: { flags: ['keel-talks-down'] },
        response:
          'Keel turns the head-lamp on. “If I’m not back by morning, send the Watch. Not for me.” They come back at dawn with mud to the plates and a split lip. “They’ll wait,” Keel says. “They called me the crown’s mole.”',
      },
      {
        id: 'repealed',
        label:
          'Tell the cell what the crown did with the sluice decree. The crown keeps its word both ways.',
        requires: { flags: ['keel-sluice-repealed'] },
        effects: { affinity: { moles: 5 }, flags: ['keel-talks-down'] },
        response:
          'Keel goes down with the repeal in a shell-pocket. Back at dawn. “They read it. Twice. Then they put the shovels away.” A pause. “Not far away.”',
      },
      {
        id: 'warn',
        label:
          'Warn the Old Houses quietly. Let them move their servants out of the cellars, and say nothing of who told.',
        effects: {
          local: { 'old-houses': 1, yard: 1 },
          flags: ['keel-houses-warned'],
        },
        response:
          'Lady Vask takes the warning without a flicker. By the week’s end the cellars are empty and the servants sleep in the stables. The cell finds dry, empty cellars. They will wonder who told. Keel will hear them wondering.',
      },
    ],
  },

  // --- F010 Lumen Shale --------------------------------------------------------
  {
    id: 'lumen-1',
    follower: 'F010',
    title: 'The Witch She Trusted',
    fromDay: 33,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Lumen Shale has her sash off. It hangs over the bunk rail. Every inch is stitched with names, in a dozen hands and a dozen threads. She is unpicking one.',
      'Two years ago a fen healer came to the burrows with a charity. Medicine for the croup. Bread in the bad month. The Moles said never trust a Mother. I stood up in the hall and said: this one. Trust this one.',
      'Eleven families sent their little ones to the fen clinic because I said so. Nine came home. Two were kept “for the cure”. The clinic writes very kind letters.',
      'She pulls the last thread. The name comes away whole in her paw.',
      'I want to stand up in the hall again and say I was wrong. In front of the burrows and the Mothers’ envoy. Your court will look like it keeps a fool. You say yes or no. I can’t decide it. I decided last time.',
    ],
    options: [
      {
        id: 'speak',
        label: 'Let her say it in the hall.',
        effects: {
          affinity: { 'mire-mothers': -10 },
          local: { lamplight: 1 },
          flags: ['lumen-confessed'],
        },
        response:
          'She says it. Short. Eleven families, nine home, two kept. The Mothers’ envoy leaves before she finishes. Afterwards the burrow folk come up one at a time and put a paw on her sash. Nobody tells her it wasn’t her fault.',
      },
      {
        id: 'quiet',
        label:
          'Tell her to visit the eleven families instead. The hall can wait. The war can’t.',
        effects: { flags: ['lumen-visits-families'] },
        response:
          'She goes on foot. Nine days. She comes back with two new names stitched inside the hem, where only she can see them.',
      },
      {
        id: 'cellars',
        label:
          'Tell her what the crown’s party found in the lantern-house cellars. Jars, labelled by village.',
        requires: { flags: ['mirefen-cellars-seen'] },
        effects: {},
        response: 'Lumen’s paw closes on the loose thread.',
        next: 'jars',
      },
      {
        id: 'isolde',
        label: 'Ask Isolde, mending her shawl two bunks down, what she thinks.',
        requires: { follower: 'F015' },
        effects: {},
        response: 'Isolde puts the needle down.',
        next: 'isolde',
      },
    ],
    beats: [
      {
        id: 'jars',
        lines: [
          'Labelled by village. Which villages.',
          'You tell her. Two are burrow villages.',
          'Some of the jars were small, weren’t they. You don’t have to say. I can see it.',
          'Then it isn’t about my name any more.',
        ],
        options: [
          {
            id: 'speak',
            label: 'Then she says it in the hall. Jars and all.',
            effects: {
              affinity: { 'mire-mothers': -10 },
              local: { lamplight: 1 },
              flags: ['lumen-confessed', 'lumen-named-jars'],
            },
            response:
              'She names the clinic, the fen healer and the jars. The hall goes silent. The Mothers’ envoy does not leave this time. She sits and listens to all of it, and smiles, and writes nothing down.',
          },
          {
            id: 'quiet',
            label:
              'Keep the jars out of the hall. Warn the two villages first.',
            effects: { flags: ['lumen-visits-families'] },
            response:
              'Lumen goes that night. She comes back in four days. She does not say what the mothers in the two villages said. She stitches nothing on the sash for a week.',
          },
        ],
      },
      {
        id: 'isolde',
        lines: [
          {
            who: 'Isolde Brack',
            npc: 'F015',
            text: 'Most of the women in that clinic didn’t know. I didn’t, the first year. A lantern-bearing healer smiles at you and you think: that’s what good looks like.',
          },
          'Lumen turns her head.',
          'You were there. You were a Mother when my families walked in.',
          {
            who: 'Isolde Brack',
            npc: 'F015',
            text: 'I was. I still am. That’s why I can tell you most of them didn’t know. Burn the leaders. Not the women who changed the sheets.',
          },
        ],
        options: [
          {
            id: 'leaders',
            label:
              'Let Lumen speak in the hall, and name the leaders, not the coven.',
            effects: {
              affinity: { 'mire-mothers': -5 },
              local: { lamplight: 1 },
              flags: ['lumen-confessed', 'lumen-isolde-heard'],
            },
            response:
              'Lumen names the healer. Only the healer. Isolde sits at the back with her lantern dark. Afterwards the two of them do not speak. Lumen leaves the bunk between them empty.',
          },
          {
            id: 'walk',
            label:
              'The hall can wait. Lumen goes to the families, and Isolde goes with her.',
            effects: {
              flags: ['lumen-visits-families', 'lumen-isolde-walked'],
            },
            response:
              'They go on foot. Nine days. They come back not friends. Isolde carries Lumen’s pack the last mile. Neither mentions it.',
          },
        ],
      },
    ],
  },
  {
    id: 'lumen-2',
    follower: 'F010',
    title: 'Nobody Begs a Tower',
    fromDay: 42,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Lumen has stitched a new name on her sash. It isn’t a burrow name. It’s the tower’s.',
      'Every speech I ever gave said the same thing. Nobody should have to beg a tower for leave to build a hospital. Tear down the tower.',
      'Well. It’s down. I watched it go dark from the ridge. I wanted to cheer. I couldn’t.',
      'When this is over you’ll want it back. Everyone who loses a tower wants it back. I want to know now what you’ll build instead.',
    ],
    options: [
      {
        id: 'councils',
        label:
          'No tower. Councils: burrow, Yard, Freehold. Each a seat, each a vote.',
        effects: {
          affinity: { moles: 10 },
          flags: ['lumen-councils-promised'],
        },
        response:
          'Lumen stitches it under the tower’s name. Small letters. COUNCILS. “Everyone says they’ll hold you to it,” she says. “I actually will.”',
      },
      {
        id: 'tower',
        label:
          'The tower. Rebuilt, stronger. The kingdom needs somewhere to stand.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['lumen-tower-promised'],
        },
        response:
          '“Honest,” Lumen says. She unpicks the tower’s name and puts the thread in her pocket. She stitches nothing in its place.',
      },
      {
        id: 'flinch',
        label:
          'Ask her about the thirty-eighth day. The young courier’s whisper. She was watching the court. Who flinched?',
        requires: { flags: ['prisoner-pardoned'] },
        effects: {},
        response: 'Lumen stops stitching.',
        next: 'flinch',
      },
      {
        id: 'unknown',
        label: 'Tell her the truth. You don’t know yet.',
        effects: { flags: ['lumen-honest-answer'] },
        response:
          '“Good,” says Lumen. “People who already know are the ones who build towers.” She hands you the needle. You stitch a crooked line under the tower’s name.',
      },
    ],
    beats: [
      {
        id: 'flinch',
        lines: [
          'Him. He didn’t flinch the way guilty people flinch. Everyone else shifted, coughed, looked round. He stopped. Perfectly still. As still as someone who knows they are being watched.',
          'I thought it was nerves. A clever young man in a court that eats clever young men. I thought: poor thing.',
          'I read rooms for a living. I read him wrong.',
        ],
        options: [
          {
            id: 'councils',
            label:
              'Then the next room is built so nobody can stand that still unseen. Councils. Every vote read aloud.',
            effects: {
              affinity: { moles: 10 },
              flags: ['lumen-councils-promised'],
            },
            response:
              'Lumen stitches COUNCILS under the tower’s name. Then, under that, smaller: READ ALOUD.',
          },
          {
            id: 'everyone',
            label: 'Tell her everyone read him wrong. The crown worst of all.',
            effects: { flags: ['lumen-absolved'] },
            response:
              '“The crown worst of all,” Lumen says. “That helps less than it should.” The needle does not stop until dawn.',
          },
        ],
      },
    ],
  },

  // --- F011 Tamsin Gutterwing --------------------------------------------------
  {
    id: 'tamsin-1',
    follower: 'F011',
    title: 'Tally Knots',
    fromDay: 8,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Tamsin Gutterwing sleeps on top of the barracks wardrobe. Nobody told her she could. Nobody has told her she can’t. You find her up there at dusk, picking at the knots on her runner’s sash.',
      'One knot for every forecast I carried between the caves. Two hundred and six. The Conclave says each knot is a day of service owed. Until the sash is clean I’m theirs. Even here.',
      'There’s an old rule in the Heights. If a crown witness watches the knots cut, and signs, the debt’s discharged. Nobody’s ever asked a crown. Crowns don’t climb wardrobes.',
      'She holds out a knife. Hilt first.',
    ],
    options: [
      {
        id: 'witness',
        label: 'Climb up. Witness it. Sign.',
        effects: {
          affinity: { 'storm-crows': -10 },
          flags: ['tamsin-knots-cut'],
        },
        response:
          'It takes an hour. She cuts every knot herself. You sign the sash in barracks ink. Three days later a Conclave messenger lands on the sill, looks at Tamsin a long time, and leaves. She sleeps on a bunk that night.',
      },
      {
        id: 'refuse',
        label:
          'Tell her the crown can’t cross the Conclave over a sash. Not yet.',
        effects: { flags: ['tamsin-knots-kept'] },
        response:
          '“Not yet,” Tamsin says. She takes the knife back and puts it under her pillow. On the wardrobe. The knots stay.',
      },
      {
        id: 'ask',
        label:
          'Ask what happens to a runner who cuts her knots without a witness.',
        effects: {},
        response: 'Tamsin laughs. It isn’t a laugh.',
        next: 'knots',
      },
      {
        id: 'kept',
        label:
          'Tell her about the fledgling who came to the hall with wool in her chimes. The crown kept her.',
        requires: { flags: ['d04-runner-sheltered'] },
        effects: {},
        response: 'Tamsin stops picking.',
        next: 'fledgling',
      },
      {
        id: 'sent',
        label:
          'Tell her about the fledgling the crown sent back up to the elder.',
        requires: { flags: ['d04-runner-returned'] },
        effects: {},
        response: 'Tamsin goes still on the wardrobe.',
        next: 'sent-back',
      },
    ],
    beats: [
      {
        id: 'knots',
        lines: [
          'Nothing. Nothing happens. That’s the trick of it.',
          'You cut them and the Conclave keeps the count. Somewhere in a cave there’s a book with your name and a number. One day a Conclave messenger lands on a sill near you, and you’re carrying for them again, and you don’t remember agreeing.',
          'A witness is the one thing they can’t argue with. They wrote the rule. They never thought anybody would use it.',
        ],
        options: [
          {
            id: 'witness',
            label: 'Then use it. Witness. Sign.',
            effects: {
              affinity: { 'storm-crows': -10 },
              flags: ['tamsin-knots-cut'],
            },
            response:
              'She cuts. You sign. She bundles the cut knots in a rag and drops them down the barracks well. “Let them count that,” she says.',
          },
          {
            id: 'refuse',
            label: 'Not yet. The crown needs the Conclave this season.',
            effects: { flags: ['tamsin-knots-kept'] },
            response:
              'Tamsin nods. She ties a new knot in the sash, small, at the end. She doesn’t say what it’s for.',
          },
        ],
      },
      {
        id: 'fledgling',
        lines: [
          'Wool in her chimes. That’s how they send the little ones. So the elders don’t hear them coming and going.',
          'You kept her. In front of Corvane.',
          'Then you know what I’m asking. Same thing. Bigger knife.',
        ],
        options: [
          {
            id: 'witness',
            label: 'Same answer, then. Witness. Sign.',
            effects: {
              affinity: { 'storm-crows': -10 },
              flags: ['tamsin-knots-cut'],
            },
            response:
              'She cuts. You sign. The fledgling from the hall sits at the foot of the wardrobe the whole hour and counts the knots as they fall. She gets the number right.',
          },
          {
            id: 'refuse',
            label: 'One runner was all the crown could afford. Not two.',
            effects: { flags: ['tamsin-knots-kept'] },
            response:
              '“One,” says Tamsin. “Right. You’re counting too.” She gives the knife to the fledgling to keep. You don’t know what that means. The fledgling does.',
          },
        ],
      },
      {
        id: 'sent-back',
        lines: [
          'You sent her back up. Politely. With thanks.',
          'I was eight when they sent me back up politely. I don’t blame you. You didn’t know.',
          'Now you do.',
        ],
        options: [
          {
            id: 'witness',
            label: 'Witness it. Sign.',
            effects: {
              affinity: { 'storm-crows': -10 },
              flags: ['tamsin-knots-cut'],
            },
            response:
              'She cuts. You sign. She doesn’t thank you. When it’s done she says, “Her name was Tib. The one you sent back.” Then she goes to sleep on a bunk.',
          },
          {
            id: 'refuse',
            label: 'Not yet.',
            effects: { flags: ['tamsin-knots-kept'] },
            response:
              '“Not yet. Same as last time.” She turns her face to the wall. In the morning the knife is gone from under her pillow.',
          },
        ],
      },
    ],
  },
  {
    id: 'tamsin-2',
    follower: 'F011',
    title: 'Clause Eleven',
    fromDay: 21,
    requires: { flags: ['heard:tamsin-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Tamsin is packing. Rope. Climbing wraps. A dark-lantern. A file. No food.',
      'The elder who keeps the east cave. Old Rime. He holds nine runners. Youngest is seven. He holds them on paper nobody’s seen and a debt nobody can count.',
      'The Heights are empty of crows for three nights. Something about the covenant. I can be up and down in one. I know every draught in that cave.',
      'I’m not asking leave. I’m telling you so it isn’t behind your back. If I’m caught, it’s the crown’s runner caught stealing the Conclave’s. That’s war, maybe. Or me on a sill for the rest of my life.',
    ],
    options: [
      {
        id: 'bless',
        label: 'Go. Bring them down.',
        effects: {
          affinity: { 'storm-crows': -10 },
          flags: ['tamsin-raid-blessed'],
        },
        response:
          'She goes at moonrise. She comes back at dawn with seven. Two would not leave. “Their mothers are up there,” Tamsin says. That is all she says. The Conclave sends no letter. That frightens Komodo more than a letter would.',
      },
      {
        id: 'buy',
        label: 'Buy the youngest one’s bond instead. Lawfully.',
        requires: { cost: 30 },
        effects: { flags: ['tamsin-bond-bought'] },
        response:
          'Corvane’s clerk takes the brass and writes a receipt for one runner. The child comes down the road three days later with wool in her chimes. Tamsin pulls the wool out herself. “One,” she says. “Eight left.” She doesn’t unpack the rope.',
      },
      {
        id: 'forbid',
        label: 'Forbid it. The crown can’t afford a war over nine runners.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['tamsin-raid-forbidden'],
        },
        response:
          'Tamsin unpacks. Rope. Wraps. Lantern. File. She lines them up on the bunk in order and leaves them there a week. Then she puts them away.',
      },
      {
        id: 'clause',
        label:
          'Remind her you heard her read clause eleven in the hall: the service owed may be paid in runners.',
        requires: { flags: ['bonded-runner-clause'] },
        effects: {},
        response: 'Tamsin stops packing. She doesn’t turn round.',
        next: 'clause',
      },
    ],
    beats: [
      {
        id: 'clause',
        lines: [
          'I read it. My hands shook. You watched them shake.',
          'So you know what you signed, or didn’t. Either way the Conclave thinks a child is a coin. Every crown before you agreed. Quietly.',
          'Agree loudly or disagree loudly. That’s all I want. I’m going up the cliff either way.',
        ],
        options: [
          {
            id: 'bless',
            label:
              'Disagree loudly. Go, and the crown will say so in the hall.',
            effects: {
              affinity: { 'storm-crows': -10 },
              local: { yard: 1 },
              flags: ['tamsin-raid-blessed'],
            },
            response:
              'You say it at petitions while she is still on the cliff. She comes back at dawn with seven. The Yard takes them in. One of them sleeps on top of the wardrobe. Tamsin lets her.',
          },
          {
            id: 'buy',
            label: 'Buy one bond lawfully, and say in the hall why.',
            requires: { cost: 30 },
            effects: { flags: ['tamsin-bond-bought'] },
            response:
              'You buy one. You say why. Corvane’s crows hear it. Tamsin takes the receipt and pins it over her bunk. “One,” she says. “Out loud. It’s a start.”',
          },
          {
            id: 'forbid',
            label: 'Agree quietly, like every crown before. Forbid it.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['tamsin-raid-forbidden'],
            },
            response:
              'Tamsin looks at you a long time. “Quietly,” she says. She puts the rope away. She ties a new knot in the old sash, and wears it again.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'tamsin-sill',
    follower: 'F011',
    title: 'A Messenger on the Sill',
    fromDay: 12,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'A Conclave messenger waited on the barracks sill at dawn with a forecast tied to its leg. Addressed to Tamsin Gutterwing. By name. In the runners’ hand.',
      'Tamsin has not touched it. She sits on the wardrobe and watches it sit on the bunk.',
      'It’s a true one. They only send true ones the first time. If I read it, I’m carrying again. That’s how it starts. If I don’t, you lose a true forecast in a dry year.',
    ],
    options: [
      {
        id: 'read',
        label: 'Ask her to read it. The court needs to know when it rains.',
        effects: {
          affinity: { 'storm-crows': 5 },
          flags: ['tamsin-read-forecast'],
        },
        response:
          'Tamsin reads it aloud, flat. Rain on the ninth day. It rains on the ninth day. The Yard’s cisterns are open and full. That night a second Conclave messenger lands on the sill. It sits there.',
      },
      {
        id: 'burn',
        label: 'Burn it unread. She carries for nobody.',
        effects: { flags: ['tamsin-burned-forecast'] },
        response:
          'She burns it in the lamp. Nine days later it rains hard for an hour, and the Yard’s cisterns are shut against the dust. Most of it runs off into the Ford. Tamsin watches it go.',
      },
    ],
  },
  {
    id: 'tamsin-climb',
    follower: 'F011',
    title: 'How to Climb a Wall',
    fromDay: 26,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'There are six Yard children on the barracks roof. Tamsin is teaching them which stones on the east wall take a foot and which ones lie.',
      'The Watch caught us. They’re not wrong. A child who can climb the wall can let a thief in over it.',
      'But if this tower ever falls in the night, the gate will be the first place anyone looks. I want them to know another way. I knew one at their age. It’s why I’m alive.',
    ],
    options: [
      {
        id: 'teach',
        label: 'Let her teach them.',
        effects: {
          local: { yard: 1, 'gate-watch': -1 },
          flags: ['tamsin-taught-climbing'],
        },
        response:
          'The lessons go on at dusk. The Watch puts a man on the east wall who mostly watches children. Two weeks later a sack of the Ledger’s salt goes over the east wall in the night. Nobody can prove a thing.',
      },
      {
        id: 'stop',
        label: 'Stop it. The wall is the wall.',
        effects: { local: { 'gate-watch': 1 }, flags: ['tamsin-no-climbing'] },
        response:
          'Tamsin brings them down one by one. The smallest bites her. She lets him. Afterwards she sits on the wardrobe and picks at her sash where the knots used to be.',
      },
    ],
  },
  {
    id: 'tamsin-flue',
    follower: 'F011',
    title: 'The Old Flue',
    fromDay: 32,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Tamsin is black to the elbows with soot. She sits on the hearth with her knees up.',
      'Every place I sleep, I find a way out. Here it’s the old kitchen flue. Up past the bread oven, out on the roof of the stores. Nobody else fits.',
      'Dunmark found the soot on my sash. He wants the flue bricked. Then it’s safe. And then I can’t sleep. That’s my problem, not yours. But it’s also the only door in this tower nobody watches.',
    ],
    options: [
      {
        id: 'brick',
        label: 'Let Dunmark brick it.',
        effects: { local: { 'gate-watch': 1 }, flags: ['tamsin-flue-bricked'] },
        response:
          'The masons brick it in a morning. Tamsin watches them do it. She sleeps on the wardrobe with her boots on for a month.',
      },
      {
        id: 'keep',
        label: 'Keep the flue open. Let it be hers.',
        effects: { flags: ['tamsin-flue-kept'] },
        response:
          'Dunmark hears it from you and says nothing. He doubles the guard on the stores roof. Tamsin starts sleeping with her boots off.',
      },
    ],
  },
  {
    id: 'tamsin-fledgling',
    follower: 'F011',
    title: 'A Spy Nine Years Old',
    fromDay: 38,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'The Watch took a Conclave runner off the wall last night. She is nine. Wool in her chimes. She had a map of the gate sewn in her sash.',
      'Dunmark wants her sent back up before the Congress. A gift. Proof the crown doesn’t hold the Conclave’s children.',
      'Send her back and she carries till she dies. Keep her and the Conclave says the crown steals runners. Which is what they do. Pick one.',
    ],
    options: [
      {
        id: 'keep',
        label: 'Keep her. The Conclave can say what it likes.',
        effects: {
          affinity: { 'storm-crows': -5 },
          flags: ['tamsin-kept-spy'],
        },
        response:
          'Elder Corvane writes before dawn. Three lines. The Crows will come to the Congress, and they will remember. The girl sleeps on top of the wardrobe beside Tamsin and won’t come down.',
      },
      {
        id: 'return',
        label: 'Send her back. Not on the eve of the Congress.',
        effects: {
          affinity: { 'storm-crows': 5 },
          flags: ['tamsin-spy-returned'],
        },
        response:
          'Tamsin walks her to the gate. Gives her a knife, hilt first. “For the knots. When you’re ready.” The girl takes it. She doesn’t look back.',
      },
    ],
  },
  {
    id: 'tamsin-carry',
    follower: 'F011',
    title: 'Carrying Again',
    fromDay: 44,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Tamsin is on the highest beam of the hideout with her legs hanging down. She doesn’t come down when you call. You climb up.',
      'The hosts need a runner across the Heights. Their allies are three caves over. Nobody else knows the draughts. I do.',
      'I swore I’d never carry again. I was eight when I swore it. I’d like you to tell me whether that still counts.',
    ],
    options: [
      {
        id: 'carry',
        label: 'Ask her to carry. Once. The court is out of better roads.',
        effects: { flags: ['tamsin-runs-again'] },
        response:
          'She goes at dusk. She comes back in two days with the answer and her chimes wrapped in wool. She doesn’t unwrap them.',
      },
      {
        id: 'none',
        label: 'Tell the hosts she runs for nobody.',
        effects: { flags: ['tamsin-runs-for-none'] },
        response:
          'The hosts send their own runner. He loses the draught in the second cave. They find him in the spring. Tamsin goes with them to bring him down.',
      },
      {
        id: 'children',
        label:
          'Ask her to carry for the children she taught to climb. They need those allies.',
        requires: { flags: ['tamsin-taught-climbing'] },
        effects: { flags: ['tamsin-runs-again'] },
        response:
          '“That’s a dirty way to ask.” She goes anyway. Two of the Yard children who came over the east wall the night the tower fell watch her go from the same beam.',
      },
    ],
  },
  // --- F012 Brother Teodor Lull -----------------------------------------------
  {
    id: 'teodor-1',
    follower: 'F012',
    title: 'Soup for Forty',
    fromDay: 9,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Brother Teodor runs the Yard kitchen like he was born in it. A ladle hangs from a cord round his neck. He tells a joke about a goat and a bishop while he serves. He gets to the punchline too early. Everyone laughs anyway.',
      'The line ends. He sits down on a flour sack across from you with his own bowl, and doesn’t eat it.',
      'Can I tell you why I left the Abbey? Nobody here asks. They think it’s rude. I think it’s rude not to.',
      'Sister Marrow counts beds. Every night. Forty beds in the lower house. Forty children. Next morning: forty beds, and room for three more. I asked her where the arithmetic went. She said: lessons.',
      'I ran the soup six years, Majesty. Soup is arithmetic.',
    ],
    options: [
      {
        id: 'ask-more',
        label: 'Ask what he thinks happened to the arithmetic.',
        effects: {},
        response: 'Teodor turns the spoon over in his bowl.',
        next: 'arithmetic',
      },
      {
        id: 'coldbrooks',
        label:
          'Ask whether that is why he stayed behind when the Coldbrook family came into the Yard.',
        requires: { flags: ['coldbrooks-in-yard'] },
        effects: {},
        response: 'Teodor looks across the Yard at a lit window.',
        next: 'coldbrooks',
      },
      {
        id: 'leave-it',
        label:
          'Tell him the Abbey is a friend of the crown, and his old troubles are his own.',
        effects: { affinity: { abbey: 5 }, flags: ['teodor-hushed'] },
        response:
          '“Of course,” Teodor says. He eats the soup. It has gone cold. He finishes every spoonful anyway, the way you finish a thing to be polite.',
      },
    ],
    beats: [
      {
        id: 'arithmetic',
        lines: [
          'I don’t know. That’s the honest answer. I think about it at night and I don’t know.',
          'I know the lower house had no windows. I know the cots were always made. Always. Children don’t make cots like that.',
          'I’m not accusing anyone. I can’t. I loved the Abbess. She taught me to read. I only wanted somebody else to know about the beds.',
        ],
        options: [
          {
            id: 'carry',
            label:
              'Tell him somebody knows now. The crown carries the number too.',
            effects: { flags: ['teodor-beds-shared'] },
            response:
              '“Forty,” Teodor says, as if handing it over. He eats the cold soup. Then he serves seconds and tells the goat joke again. He gets the punchline right.',
          },
          {
            id: 'proof',
            label:
              'The crown cannot act on cots that are made too well. Bring proof, or let it lie.',
            effects: { affinity: { abbey: 5 }, flags: ['teodor-needs-proof'] },
            response:
              '“Proof,” says Teodor. “The trouble with proof is you have to go and look.” He tells no jokes for three days.',
          },
        ],
      },
      {
        id: 'coldbrooks',
        lines: [
          'Yes. Four children and the baby. Sister Marrow wanted them for the lower house. She had the beds. She always has the beds.',
          'When you said the Yard, she smiled at you. Same smile. I thought: I am not walking back up that road behind her. So I asked if you needed a cook.',
          'I check on them every night. Wenna thinks I’m being kind. I’m counting.',
        ],
        options: [
          {
            id: 'carry',
            label: 'Tell him the crown will count with him. Every night.',
            effects: { local: { yard: 1 }, flags: ['teodor-beds-shared'] },
            response:
              'That night you walk the Yard with him. Four children. One baby. One tired mother. He counts them twice. Then he goes to bed.',
          },
          {
            id: 'proof',
            label:
              'Tell him a smile is not evidence. Let the family rest, and him too.',
            effects: { affinity: { abbey: 5 }, flags: ['teodor-needs-proof'] },
            response:
              '“A smile is not evidence,” Teodor agrees. He still walks past the Coldbrooks’ window every night. He just stops telling you.',
          },
        ],
      },
    ],
  },
  {
    id: 'teodor-2',
    follower: 'F012',
    title: 'Every Week, Without Fail',
    fromDay: 17,
    requires: {
      flags: ['heard:teodor-1'],
      notFlags: ['talk-teodor-letters', ...IN_THE_TOWER],
    },
    lines: [
      'Midnight. The kitchen is dark except for one candle. Teodor is at the bread table with a pen. A letter half done. A stick of grey wax beside it, and a seal you know: the Abbey’s bell.',
      'He doesn’t hide it. He looks at the letter. Then at you. Then he sets the pen down the way you set down something that might go off.',
      'I write to her every week. The Abbess. Since I came.',
      'It’s nothing. Who’s sick. Who’s eating. How many sleep in the Yard. How the soup is. She always asks about the soup.',
      'I tell myself it’s harmless. Every single week it’s harmless. Until you count the weeks.',
    ],
    options: [
      {
        id: 'read',
        label: 'Read the letter.',
        effects: {},
        response: 'Teodor turns it round and slides it across the flour.',
        next: 'letter',
      },
      {
        id: 'stop',
        label: 'The letters stop tonight.',
        effects: {
          affinity: { abbey: -5 },
          flags: ['talk-teodor-letters', 'teodor-letters-ended'],
        },
        response:
          'Teodor holds the letter over the candle. He doesn’t drop it in. He holds it until it catches and he has to let go. “She’ll ask why,” he says. “She’ll be kind about it.”',
      },
      {
        id: 'dictate',
        label: 'Keep writing. From now on, you choose what goes in.',
        effects: {
          local: { lamplight: 1 },
          flags: ['talk-teodor-letters', 'teodor-turned'],
        },
        response:
          'Teodor looks at the pen a long time. Then he picks it up. You dictate. He writes it in his own round hand, every word, and seals it with her bell. His paw does not shake. You wish it would.',
      },
    ],
    beats: [
      {
        id: 'letter',
        lines: [
          'The hand is round and kind. Dear Mother. Barley soup this week. A cough in the Watch. The tower’s medic has a little boy who is afraid of bells; I thought you would smile. Sixty-one sleep in the Yard now, with the newest family.',
          'At the bottom: The ruler is good. I think you would like them. They ask about the beds.',
          'Teodor watches you read the last line.',
          'I wrote that this morning. I wanted her to know someone asks. I didn’t think what it would mean to her. That someone asks.',
        ],
        options: [
          {
            id: 'stop',
            label: 'Burn it. The letters stop tonight.',
            effects: {
              affinity: { abbey: -5 },
              flags: ['talk-teodor-letters', 'teodor-letters-ended'],
            },
            response:
              'He burns it. The wax goes soft and runs into the flour. Next week a letter comes for him. Grey wax. He gives it to you unopened.',
          },
          {
            id: 'dictate',
            label:
              'Cross out the last line. Then keep writing every week, and you choose what goes in.',
            effects: {
              local: { lamplight: 1 },
              flags: ['talk-teodor-letters', 'teodor-turned'],
            },
            response:
              'You cross it out. He copies the letter clean without the line. Every week after, you sit at the bread table at midnight and he writes what you say. He calls her Mother in every one.',
          },
          {
            id: 'send',
            label:
              'Let it go as written. A good man’s letters to his old teacher. Read each one first, from now on.',
            effects: {
              affinity: { abbey: 5 },
              flags: ['talk-teodor-letters', 'teodor-letters-read'],
            },
            response:
              'He seals it. Every week after, he brings you the letter first. You read every one. You never cross anything out.',
          },
          {
            id: 'names',
            label:
              'Ask whether “the newest family” had a name in last week’s letter.',
            requires: { flags: ['coldbrooks-in-yard'] },
            effects: {},
            response: 'Teodor closes his eyes.',
            next: 'names',
          },
        ],
      },
      {
        id: 'names',
        lines: [
          'Coldbrook. Wenna. Four children and the baby. I wrote their names. She asked after them.',
          'She asked so kindly.',
        ],
        options: [
          {
            id: 'guard',
            label:
              'Put a Watch sergeant on the Coldbrooks’ door tonight. Then the letters stop.',
            effects: {
              affinity: { abbey: -5 },
              local: { 'gate-watch': 1 },
              flags: [
                'talk-teodor-letters',
                'teodor-letters-ended',
                'teodor-coldbrooks-guarded',
              ],
            },
            response:
              'The sergeant sits outside the door all night with a lamp. Teodor sits beside him. Neither of them sleeps. Nothing comes. In the morning the baby cries for breakfast like any baby.',
          },
          {
            id: 'dictate',
            label:
              'Keep writing. Next week, tell her the Coldbrooks have gone east. You choose every word after.',
            effects: {
              local: { lamplight: 1 },
              flags: ['talk-teodor-letters', 'teodor-turned'],
            },
            response:
              'He writes it. Gone east, with the seed and the cart. He seals it with her bell. “That’s the first thing I ever wrote her that wasn’t true,” he says. “It was easy.”',
          },
        ],
      },
    ],
  },
  {
    id: 'teodor-3',
    follower: 'F012',
    title: 'An Invitation Home',
    fromDay: 42,
    requires: { flags: ['komodo-betrayal', 'talk-teodor-letters'] },
    lines: [
      'A letter comes to the hideout. Nobody knows how. It is on Teodor’s blanket when he wakes. Grey wax. The bell.',
      'He brings it to you unopened. Then he opens it in front of you, reads it once, and hands it over.',
      'Dear Teodor. The house has room. It always has room. Come home before the dark comes up the road, and bring anyone you love. Komodo sends his regards.',
      'She knows where we are. Or she knows I’m alive, which is close. And she still wants me home. I don’t know which part frightens me more.',
    ],
    options: [
      {
        id: 'burn',
        label: 'Burn it together.',
        effects: {
          affinity: { abbey: -5 },
          flags: ['teodor-invitation-burned'],
        },
        response:
          'You burn it on the hideout fire. Teodor watches the bell in the wax go soft and run. “Always room for more,” he says. Then he makes soup for everyone. No joke. He hums.',
      },
      {
        id: 'answer',
        label:
          'Have him write back. One last letter. Tell her he is coming, and when, and by which road.',
        effects: { flags: ['teodor-false-letter'] },
        response:
          'He names a road the hideout doesn’t use, and a night. He seals it with the last of his grey wax. “That was easy,” he says. “I want to be sick.” Two nights later the lookout sees lanterns on the wrong road. Waiting.',
      },
      {
        id: 'free',
        label:
          'Tell him he is free to go. The crown will not keep him from safety.',
        effects: { flags: ['teodor-offered-leave'] },
        response:
          '“Safety,” Teodor says. He folds the letter and puts it inside his robe, over his heart. He does not go. Every morning after, you check his blanket first.',
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'teodor-sister',
    follower: 'F012',
    title: 'A Sister at the Kitchen Door',
    fromDay: 26,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Teodor brings you a bowl you didn’t ask for and sits down across from you. He doesn’t tell a joke.',
      'A sister came to the kitchen door last night. Thin. Grey habit with the bell cut off it. She asked for bread. Then she asked for me. By name.',
      'If she ran, she knows things. If she was sent, she’s in my kitchen. I ran once. Nobody asked me a single question. I have wondered since if they should have.',
    ],
    options: [
      {
        id: 'take',
        label: 'Take her in. Let her work the kitchen beside him.',
        effects: { flags: ['teodor-took-sister'] },
        response:
          'She peels potatoes for a week and says nothing. On the eighth day she asks Teodor how many beds the Yard has. He tells you. He doesn’t tell her.',
      },
      {
        id: 'watch',
        label: 'Hand her to the Watch. Questions first. Bread after.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['teodor-sister-questioned'],
        },
        response:
          'The Watch has her two days. She tells them about the lower house, the beds, the lessons. Then she stops talking for good. Teodor brings her soup in the cell and sits outside the bars.',
      },
      {
        id: 'away',
        label: 'Give her bread and send her on. The court cannot risk it.',
        effects: { flags: ['teodor-sister-sent-on'] },
        response:
          'Teodor wraps two loaves and walks her to the Ford road. She doesn’t look back. He stands there until the dust settles. He doesn’t know which way she turned.',
      },
    ],
  },
  {
    id: 'teodor-pot',
    follower: 'F012',
    title: 'One Pot',
    fromDay: 45,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'One pot in the hideout. Teodor stirs it with the ladle on its cord. He has counted the bowls twice.',
      'Our people and the hosts’ children. There isn’t enough for both. Not full bowls. The hosts gave us their roof. Our people gave you everything else.',
      'Soup is arithmetic, Majesty. I said that once like it was a joke.',
    ],
    options: [
      {
        id: 'hosts',
        label: 'The hosts’ children first. It is their roof.',
        effects: { flags: ['teodor-fed-hosts'] },
        response:
          'The children eat full. The court eats thin. A Watchman says something about whose side the crown is on. Teodor gives him his own bowl and doesn’t answer.',
      },
      {
        id: 'ours',
        label: 'The court first. They followed you here.',
        effects: { local: { 'gate-watch': 1 }, flags: ['teodor-fed-court'] },
        response:
          'The court eats full. The hosts’ children watch from the door. Next morning there is a guard on the hosts’ well that wasn’t there before.',
      },
    ],
  },
  // --- F013 Mags Ironhide ------------------------------------------------------
  {
    id: 'mags-1',
    follower: 'F013',
    title: 'Every Name Read Aloud',
    fromDay: 11,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Mags Ironhide sits on the barracks step with a Watch helmet between her knees. Not hers. Too small. She is polishing it with the hem of her tabard. She has been at it an hour. It doesn’t need polishing.',
      'Belonged to a lad called Hob. Young sentry. Swore the oath with his eyes on the smoke at Thistledown.',
      'That night he went. On his own. No orders. Got there at the end. Didn’t come back.',
      'Watch book says deserted post. No pension for his mother. No name read. Rules are rules. I helped write half of them.',
      'I can’t read the book. Letters swim. But I know what it says about him. I want it to say something else.',
    ],
    options: [
      {
        id: 'reasons',
        label:
          'You swore it at the gate: every name is read aloud after. Read his.',
        requires: { flags: ['d10-oath-of-reasons'] },
        effects: {
          local: { 'gate-watch': 1, yard: 1 },
          flags: ['mags-hob-named'],
        },
        response:
          'You read it at roll call. Hob, sentry, Thistledown. Captain Dunmark reads it after you, word for word, in his orders voice. Mags doesn’t cry. She puts the helmet on the shelf over her bunk.',
      },
      {
        id: 'pension',
        label:
          'Strike “deserted” from the book. Pay his mother from the crown’s purse.',
        requires: { cost: 20 },
        effects: {
          affinity: { freeholds: 5 },
          local: { 'gate-watch': -1 },
          flags: ['mags-hob-pensioned'],
        },
        response:
          'Dunmark signs the change with his jaw tight. “The next lad who leaves his post will remember this one.” “Yes,” says Mags. “That’s the idea.”',
      },
      {
        id: 'rules',
        label:
          'The book stands. He left his post. The Watch only holds if the rule holds.',
        effects: { local: { 'gate-watch': 2 }, flags: ['mags-hob-deserter'] },
        response:
          'Mags nods. Once. She finishes polishing. Then she carries the helmet to his mother on foot, two days each way, and comes back and stands her gate shift without a word.',
      },
      {
        id: 'ask',
        label: 'Ask what Mags would have done that night.',
        effects: {},
        response: 'Mags stops polishing.',
        next: 'night',
      },
    ],
    beats: [
      {
        id: 'night',
        lines: [
          'Same as him, maybe. That’s the trouble.',
          'Thirty years on gates. Never stepped aside. Not once. You know what that costs? Every time, somebody else goes instead. Hob went.',
          'I don’t want his name cleared because he was right. He was wrong. I want it cleared because he went.',
        ],
        options: [
          {
            id: 'pension',
            label: 'Clear it. Pay his mother. He went.',
            requires: { cost: 20 },
            effects: {
              affinity: { freeholds: 5 },
              local: { 'gate-watch': -1 },
              flags: ['mags-hob-pensioned'],
            },
            response:
              'The book is changed. Mags carries the first payment herself. She comes back with a jar of plum jam from Hob’s mother and puts it on the barracks table. Nobody opens it.',
          },
          {
            id: 'rules',
            label: 'He was wrong. The book stands.',
            effects: {
              local: { 'gate-watch': 2 },
              flags: ['mags-hob-deserter'],
            },
            response:
              '“Wrong,” Mags agrees. She hangs the helmet on her own hook, under hers. It stays there.',
          },
        ],
      },
    ],
  },
  {
    id: 'mags-2',
    follower: 'F013',
    title: 'Letters Swim',
    fromDay: 24,
    requires: { flags: ['heard:mags-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Mags holds out a letter. Watch seal. Her name on the front in Captain Dunmark’s square hand.',
      'Read it for me. I’d ask the sergeant, but the sergeant talks.',
      'You read it to yourself first. She is watching the wall, not you.',
      'It is short. The captain asks Mags, as the Watch’s oldest wall, to report each week on the emperor’s barracks. Who comes and goes. Who writes to whom. Who sits on the roof at night. For the safety of the crown. Not to be shown to the crown.',
    ],
    options: [
      {
        id: 'truth',
        label: 'Read it to her exactly as written.',
        effects: { local: { 'gate-watch': -1 }, flags: ['mags-read-truth'] },
        response:
          '“Not to be shown to the crown,” Mags repeats. “He knows I can’t read. He knew I’d show somebody.” She walks it back to the gatehouse. The door slams once. Dunmark doesn’t write to her again.',
      },
      {
        id: 'lie',
        label: 'Read her something else. Duty rotas. Nothing more.',
        effects: { flags: ['mags-read-lie'] },
        response:
          'You make up a rota. Mags nods along. “Thought it was worse.” A week later the sergeant who talks reads it to her by accident. She says nothing to you. She stands outside your door that night anyway. All night. Like always.',
      },
      {
        id: 'report',
        label:
          'Read it truly. Then tell her to do it, and to show you every report first.',
        effects: {
          local: { 'gate-watch': 2 },
          flags: ['mags-reports-to-watch'],
        },
        response:
          '“A wall with a door in it,” Mags says. “All right.” Every week she brings the report to you to read aloud before she carries it down. Every week you change one word.',
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'mags-door',
    follower: 'F013',
    title: 'Nobody Armed',
    fromDay: 33,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Mags has been given the Congress door. Her orders are one line, and Dunmark read it to her twice: nobody armed goes in.',
      'The Saltroad factor won’t come without her drivers. Her drivers won’t come without their knives. Komodo says let them in. Says the Congress fails without the Saltroad.',
      'I’ve never once stepped aside. Not for a duke. I’ll do it if you tell me. I want you to know what you’re telling me.',
    ],
    options: [
      {
        id: 'aside',
        label: 'Let the drivers through. The Congress needs the Saltroad.',
        effects: { affinity: { saltroad: 5 }, flags: ['mags-stepped-aside'] },
        response:
          'Mags steps aside. She stands there afterwards with her shoulder against the wall, looking at the floor where she used to stand.',
      },
      {
        id: 'hold',
        label: 'Nobody armed. Mags holds the door.',
        effects: { affinity: { saltroad: -5 }, flags: ['mags-held-door'] },
        response:
          '“Right.” She plants her feet. The factor’s drivers argue an hour. The factor goes in alone, furious, and sits by the door all night where she can see the drivers through it.',
      },
    ],
  },
  // --- F014 Pell Quickmarrow ---------------------------------------------------
  {
    id: 'pell-1',
    follower: 'F014',
    title: 'The Ones That Hum',
    fromDay: 17,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Pell Quickmarrow’s coat has forty pockets. He turns out thirty-nine of them on his bunk for you. Lenses. Bolts. A glass eye. A tin soldier. A key to nothing.',
      'He keeps his paw on the fortieth.',
      'Rule of the rail yards. What you don’t understand, you sell. Fast. Before it understands you.',
      'He takes his paw away. In the pocket is a glass rod as long as a finger, grey-green. You hear it before you see it. One low note. It does not stop.',
      'I break the rule when a thing hums. Archive wants it studied. Ledger wants it sold. Jinx wants it back, but Jinx wants everything back. You’re paying for the bed. What do you want?',
    ],
    options: [
      {
        id: 'archive',
        label: 'Give it to the Lamplight Archive. Let them study it.',
        effects: { local: { lamplight: 2 }, flags: ['pell-hummer-archived'] },
        response:
          'Keeper Vellum takes it in both hands. Pell watches it go. “Write down what it does,” he says. “When you find out. Somebody tell me.” Nobody does.',
      },
      {
        id: 'sell',
        label: 'Sell it. The crown needs brass, and Pell knows the price.',
        effects: {
          brass: 20,
          local: { ledger: 1 },
          flags: ['pell-hummer-sold'],
        },
        response:
          'Factor Tallow pays twenty and doesn’t haggle. That’s the part Pell doesn’t like. “She knows what it is,” he says. “Or she knows who wants it.”',
      },
      {
        id: 'keep',
        label: 'Let him keep it. He found it.',
        effects: { affinity: { rustline: 5 }, flags: ['pell-hummer-kept'] },
        response:
          'Back into the fortieth pocket. “Hums louder at night,” he says. “Louder when the wind’s from the north.” He sleeps with that side of the coat under his head.',
      },
      {
        id: 'ask',
        label: 'Ask where he found it.',
        effects: {},
        response: 'Pell buttons the fortieth pocket before he answers.',
        next: 'where',
      },
      {
        id: 'feathers',
        label:
          'Ask whether it hums on the same note as the glass feathers. The Hollow Bell’s note.',
        requires: { flags: ['glass-feathers-studied'] },
        effects: {},
        response:
          'Pell taps it with a claw. Listens. “No. Lower. Like something under the Bell’s note, holding it up.”',
        next: 'where',
      },
    ],
    beats: [
      {
        id: 'where',
        lines: [
          'Old rail cutting. North. Under the mission road, where the line ran before somebody pulled the rails. Way down. Water on the floor.',
          'There were others down there. Rows of them. Set in the wall like teeth. I took one. I could hear the rest all the way back to the ladder.',
          'I don’t go back. I sold the map. Two weeks ago. Paid double.',
        ],
        options: [
          {
            id: 'buyer',
            label: 'Ask who paid double.',
            effects: {},
            response: 'Pell scratches behind one ear. He doesn’t want to say.',
            next: 'buyer',
          },
          {
            id: 'archive',
            label: 'Give it to the Archive. Tonight.',
            effects: {
              local: { lamplight: 2 },
              flags: ['pell-hummer-archived'],
            },
            response:
              'Vellum locks it in an iron box. The box hums. He moves it to the lowest vault. It hums there too.',
          },
          {
            id: 'keep',
            label:
              'Let him keep it, and keep his mouth shut about the cutting.',
            effects: { affinity: { rustline: 5 }, flags: ['pell-hummer-kept'] },
            response:
              'Pell nods. He keeps it. He keeps his mouth shut. He stops sleeping well.',
          },
        ],
      },
      {
        id: 'buyer',
        lines: [
          'A sister. Grey robes. Counting cord at her belt. Very polite.',
          'Asked if I’d found anything else down there. I said no.',
          'First lie I ever told for free.',
        ],
        options: [
          {
            id: 'archive',
            label:
              'The rod goes to the Archive, under seal. Nobody sells it again.',
            effects: {
              local: { lamplight: 2 },
              flags: ['pell-hummer-archived'],
            },
            response:
              'Vellum seals it in the lowest vault. Pell signs the register. He writes his own name very small.',
          },
          {
            id: 'keep',
            label:
              'Tell Pell to keep it close. If the sister comes back, the crown wants to know.',
            effects: { affinity: { rustline: 5 }, flags: ['pell-hummer-kept'] },
            response:
              'Pell puts it back in the fortieth pocket. “If she comes back,” he says, “you’ll know. I’ll be the one running.”',
          },
        ],
      },
    ],
  },
  {
    id: 'pell-2',
    follower: 'F014',
    title: 'What the Saltroad Is Owed',
    fromDay: 30,
    requires: { flags: ['heard:pell-1'], notFlags: IN_THE_TOWER },
    lines: [
      'There’s a Saltroad agent at the gate with a ledger and two drivers. Big drivers. Pell watches them from the barracks window. Coat on. All forty pockets buttoned.',
      'Oriel’s people. I owe the Saltroad two hundred brass. They’ve come for it, or for me, or for my stash. Their choice of order.',
      'Fair’s fair. I owe it. I haven’t got it. If I go with them I work it off in the salt pans, and you lose your rail rat.',
      'I’m not asking you to pay. I’m telling you they’re at the gate. That’s different.',
    ],
    options: [
      {
        id: 'pay',
        label:
          'Pay what the crown can toward it, with a crown letter for the rest.',
        requires: { cost: 30 },
        effects: { affinity: { saltroad: 5 }, flags: ['pell-debt-paid'] },
        response:
          'The agent counts it twice and takes the letter. The drivers look disappointed. “Now I owe you,” Pell says. “I’m no good at owing.” A lens turns up on your desk every week after. Different one each time.',
      },
      {
        id: 'stash',
        label: 'Let them take his stash instead of him.',
        effects: {
          affinity: { saltroad: 5, rustline: -5 },
          flags: ['pell-stash-taken'],
        },
        response:
          'Thirty-nine pockets turned out on a blanket at the gate. The agent takes all of it. Pell keeps one paw on the fortieth. Nobody asks. The drivers carry the blanket off like a body.',
      },
      {
        id: 'refuse',
        label:
          'Refuse them. Pell is the crown’s. The Saltroad can take it up with the crown.',
        effects: {
          affinity: { saltroad: -10 },
          local: { 'gate-watch': 1 },
          flags: ['pell-debt-refused'],
        },
        response:
          'The agent writes your answer down exactly. Next week salt is a copper dearer at the fortress gate. Only there. Pell buys the barracks’ salt out of his own pocket and won’t take it back.',
      },
      {
        id: 'ask',
        label: 'Ask what the debt was for.',
        effects: {},
        response: 'Pell unbuttons one pocket. Buttons it again.',
        next: 'debt',
      },
    ],
    beats: [
      {
        id: 'debt',
        lines: [
          'A caravan went off the trestle in the canyon. Four wagons. I got there first.',
          'There were people still in the wagons. Two. Maybe three. I could hear them. I took the cargo first. Medicine, mostly. By the time I came back with a rope, the rope wasn’t needed.',
          'The Saltroad doesn’t know about the people. Only the medicine. So the debt is two hundred. It should be more.',
          'That’s all.',
        ],
        options: [
          {
            id: 'confess',
            label:
              'Tell him to go down to the gate and tell the agent about the people. Himself.',
            effects: {
              affinity: { saltroad: 10 },
              flags: ['pell-confessed-wreck'],
            },
            response:
              'Pell walks to the gate. He talks to the agent an hour. He comes back without his coat. “They halved the debt,” he says. “Kept the coat. Said that was fair.” It is.',
          },
          {
            id: 'pay',
            label:
              'Pay toward it. What he did is his to carry. The debt is the crown’s to settle.',
            requires: { cost: 30 },
            effects: { affinity: { saltroad: 5 }, flags: ['pell-debt-paid'] },
            response:
              'You pay. The agent leaves. Pell sits on his bunk with the coat on, all forty pockets buttoned, and doesn’t move until dark.',
          },
          {
            id: 'refuse',
            label: 'Send the agent away. The crown keeps what it has.',
            effects: {
              affinity: { saltroad: -10 },
              local: { 'gate-watch': 1 },
              flags: ['pell-debt-refused'],
            },
            response:
              'The agent goes. Pell watches from the window until the drivers are out of sight. “That’s twice somebody left them on the trestle,” he says.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'pell-handcar',
    follower: 'F014',
    title: 'The Handcar',
    fromDay: 38,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Pell has grease on his whiskers and a grin he can’t put away. He drags you to the barracks window and points at the old rail cut.',
      'Handcar. Under the slag heap. Runs. I ran it. Twenty people down the old line in an hour, and nobody on a horse can follow.',
      'Saltroad would take it against my debt. All of it. I’d be free of the debt. Or it stays under the slag heap and I stay in hock, and the crown’s got a back door nobody knows. Your bed. Your call.',
    ],
    options: [
      {
        id: 'sell',
        label: 'Sell it. Clear his debt.',
        effects: { affinity: { saltroad: 5 }, flags: ['pell-sold-handcar'] },
        response:
          'The Saltroad hauls it off on a dray. Pell signs the release with a flourish and buys the barracks a round with money he doesn’t have yet. He sleeps like the dead.',
      },
      {
        id: 'keep',
        label: 'Keep it under the slag. The crown may need a back door.',
        effects: { flags: ['pell-kept-handcar'] },
        response:
          'Pell oils it once a week at night. The Saltroad agent comes twice more about the debt. Pell meets him at the gate with all forty pockets buttoned.',
      },
    ],
  },
  // --- F015 Isolde Brack -------------------------------------------------------
  {
    id: 'isolde-1',
    follower: 'F015',
    title: 'Forty-One Lights',
    fromDay: 15,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Isolde Brack keeps a green-glass lantern on the barracks sill. The flame does not move when the door opens. It moves when nobody is near it.',
      'She is cleaning the glass with her shawl. She does not look up.',
      'You want to know what a fen-witch does in your barracks. Reads omens. Lights lanterns. Sleeps badly.',
      'And grieves. The Mothers don’t bury their dead where outsiders can see. I have eleven names I haven’t lit a lantern for since I left. I’d like a room. One night a month. No visitors. The Watch will hate it.',
    ],
    options: [
      {
        id: 'room',
        label: 'Give her the old tack room. One night a month. No visitors.',
        effects: {
          affinity: { 'mire-mothers': 5 },
          local: { 'gate-watch': -1 },
          flags: ['isolde-vigil-room'],
        },
        response:
          'The first night there are eleven lanterns under the tack-room door. Green. Still. The Watch posts a sergeant outside. In the morning he asks if he can light one. Isolde lets him.',
      },
      {
        id: 'open',
        label:
          'No closed rooms in a fortress. She lights them in the Yard, where anyone can see.',
        effects: { local: { 'gate-watch': 1 }, flags: ['isolde-vigil-open'] },
        response:
          'She lights them in the Yard. Eleven. The Yard children stand at the edge of the light and stare. She doesn’t explain. One of them cries and doesn’t know why.',
      },
      {
        id: 'road',
        label:
          'Ask whether her lanterns were among the ones that turned back on the Mirefen road, the first night.',
        requires: { flags: ['mire-road-closed'] },
        effects: {},
        response: 'Isolde stops cleaning the glass.',
        next: 'road',
      },
      {
        id: 'count',
        label:
          'Tell her the crown’s escort counted heads on the Mirefen road, the first night.',
        requires: { flags: ['mire-quiet-count'] },
        effects: {},
        response: 'Isolde almost smiles.',
        next: 'count',
      },
    ],
    beats: [
      {
        id: 'road',
        lines: [
          'Yes. I carried the ninth.',
          'We turned back because the tower told us to. Then the Mothers told us to put the lights out. So the raiders wouldn’t see. So you wouldn’t see.',
          'Two didn’t make it home. Two of my eleven. I don’t blame the road. I blame whoever decided a light was the danger.',
        ],
        options: [
          {
            id: 'room',
            label:
              'Then she has the room. Eleven lanterns. Nobody tells her to put them out.',
            effects: {
              affinity: { 'mire-mothers': 5 },
              local: { 'gate-watch': -1 },
              flags: ['isolde-vigil-room'],
            },
            response:
              'Eleven lanterns under the tack-room door. Two burn longer than the rest. In the morning she pinches them out herself.',
          },
          {
            id: 'open',
            label: 'In the Yard, then. Where everyone can see them burn.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['isolde-vigil-open'],
            },
            response:
              'She lights them in the Yard. You stand at the edge of the light until the last one goes. She does not ask you to. She doesn’t ask you to leave either.',
          },
        ],
      },
      {
        id: 'count',
        lines: [
          'I know. I watched him. A sergeant with a ration card, moving his lips.',
          'He counted forty-one. We were forty-two when we left the fen. Nobody told him to count the one who walked behind.',
          'She doesn’t say who walked behind. She goes back to the glass.',
        ],
        options: [
          {
            id: 'who',
            label: 'Ask who walked behind.',
            effects: { flags: ['isolde-forty-second'] },
            response:
              '“A Mother. Inner circle. Making sure nobody went the wrong way.” She sets the lantern back on the sill. “I went the wrong way later. Took me a year.”',
          },
          {
            id: 'room',
            label: 'Don’t ask. Give her the room.',
            effects: {
              affinity: { 'mire-mothers': 5 },
              local: { 'gate-watch': -1 },
              flags: ['isolde-vigil-room'],
            },
            response:
              'Eleven lanterns, the first night. On the second there are twelve. Isolde says nothing about the twelfth.',
          },
        ],
      },
    ],
  },
  {
    id: 'isolde-2',
    follower: 'F015',
    title: 'Still a Daughter of the Fen',
    fromDay: 23,
    requires: { flags: ['heard:isolde-1'], notFlags: IN_THE_TOWER },
    lines: [
      'There is a reed knotted on Isolde’s pillow. Green. Three knots. She sits on the bunk and looks at it. She doesn’t touch it.',
      'Came in with the bread cart. It means: come to the water’s edge, a daughter is asking.',
      'I told you I left the inner circle. True. I didn’t tell you I never left the coven. I’m still a Mother. When they knot a reed, I go.',
      'Most of us are good. Healers. Midwives. The leaders are something else. I mean to outlast them. That means staying in.',
      'So. You have a witch in your barracks who answers to a coven you can’t see. Decide what that is.',
    ],
    options: [
      {
        id: 'stay',
        label:
          'She stays. Coven and all. The crown would rather know her than not.',
        effects: {
          affinity: { 'mire-mothers': 5 },
          flags: ['talk-isolde-coven', 'isolde-kept'],
        },
        response:
          'Isolde breathes out. She goes to the water at dusk. Back by midnight with wet hems. She doesn’t say what the daughter asked. She sleeps with the lantern lit.',
      },
      {
        id: 'cut',
        label: 'She cuts the coven, or she leaves the barracks.',
        effects: {
          local: { 'gate-watch': 1 },
          flags: ['talk-isolde-coven', 'isolde-told-to-cut'],
        },
        response:
          'Isolde burns the reed in her lantern. Green flame. Then nothing. “Cut,” she says. You both know she is lying. You both let it stand.',
      },
      {
        id: 'channel',
        label:
          'Ask her to carry the crown’s word to the good witches. Behind the leaders’ backs.',
        effects: {
          affinity: { 'mire-mothers': 5 },
          local: { lamplight: 1 },
          flags: ['talk-isolde-coven', 'isolde-crown-channel'],
        },
        response:
          '“You’re asking me to split my own coven.” “Yes.” “It’s already split. You’re asking me to say so out loud.” She takes the reed to the water. She comes back with three names.',
      },
      {
        id: 'jars',
        label:
          'Ask her about the jars in the lantern-house cellars. Labelled by village.',
        requires: { flags: ['mirefen-cellars-seen'] },
        effects: {},
        response: 'Isolde goes still.',
        next: 'jars',
      },
    ],
    beats: [
      {
        id: 'jars',
        lines: [
          'You went down. Good. Somebody had to.',
          'They’re names. Hair. A tooth. A child’s first cut nail. The inner circle keeps a piece of everyone the coven ever helped. They say it’s for healing. Remembering the body.',
          'It isn’t for healing. I don’t know what it’s for. That’s the honest answer. It’s why I stay in.',
        ],
        options: [
          {
            id: 'stay',
            label: 'Then stay in, and find out what it’s for.',
            effects: {
              affinity: { 'mire-mothers': 5 },
              flags: ['talk-isolde-coven', 'isolde-kept', 'isolde-hunts-jars'],
            },
            response:
              'She goes to the water at dusk. She comes back with wet hems and three village names. “Theirs are the newest jars,” she says. “Somebody should visit.”',
          },
          {
            id: 'cut',
            label:
              'Then she cuts them. Today. A coven that keeps jars is not hers to save.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['talk-isolde-coven', 'isolde-told-to-cut'],
            },
            response:
              '“Not mine to save,” Isolde says. She burns the reed. The next night another one is on her pillow. Four knots. She burns that too. Then she stops telling you.',
          },
        ],
      },
    ],
  },
  {
    id: 'isolde-3',
    follower: 'F015',
    title: 'The Jars Come Up',
    fromDay: 32,
    requires: { flags: ['talk-isolde-coven'], notFlags: IN_THE_TOWER },
    lines: [
      'Isolde comes back from the water at dawn with mud to the knee and a sack over one shoulder. It clinks. She sets it on the barracks table, carefully.',
      'Forty jars. The oldest. I took them off the bottom shelf while the leaders were at the war-moot. Nobody saw. Somebody will count.',
      'Every name in here is a burrow or a Freehold village. Tied to the jar is tied to the person. That’s what the inner circle says. I don’t know if it’s true. I don’t want to find out by accident.',
      'They have to go somewhere. I’ll keep them, if you let me. I’m the only one here who knows how to hold them.',
    ],
    options: [
      {
        id: 'keep',
        label: 'Let her keep them. She knows how.',
        effects: {
          affinity: { 'mire-mothers': 5 },
          flags: ['isolde-keeps-jars'],
        },
        response:
          'The sack goes under her bunk. She sleeps with one paw hanging down, resting on it. Some nights the jars clink when nobody has touched them. She says that is the cold.',
      },
      {
        id: 'return',
        label: 'Carry them home. Each jar to its own village, by crown riders.',
        requires: { cost: 20 },
        effects: {
          affinity: { 'mire-mothers': -10, freeholds: 5 },
          flags: ['isolde-jars-returned'],
        },
        response:
          'The riders go out with jars wrapped in wool. Most villages bury them. One mother opens hers and holds what is inside a long time. The Mothers send no word. That is how you know they counted.',
      },
      {
        id: 'burn',
        label: 'Burn them. Whatever they are for, they will be for nothing.',
        effects: {
          affinity: { 'mire-mothers': -10 },
          local: { 'gate-watch': 1 },
          flags: ['isolde-jars-burned'],
        },
        response:
          'Isolde does not argue. She does it herself, in the Yard brazier, one jar at a time. The smoke is green. In the morning her paws are blistered to the wrist. She says it was the brazier.',
      },
      {
        id: 'lumen',
        label:
          'Ask Lumen, who knows every burrow name, to read the labels first.',
        requires: { follower: 'F010' },
        effects: {},
        response: 'Lumen comes to the table. She doesn’t touch the sack.',
        next: 'lumen',
      },
    ],
    beats: [
      {
        id: 'lumen',
        lines: [
          {
            who: 'Lumen Shale',
            npc: 'F010',
            text: 'Tullow Burrow. Dry Wash. Hen’s Cross.',
          },
          'Lumen reads them off one at a time without picking them up. Her voice doesn’t change. At the eleventh jar it stops.',
          {
            who: 'Lumen Shale',
            npc: 'F010',
            text: 'That one’s mine. One of the two they kept.',
          },
          'Isolde does not move.',
        ],
        options: [
          {
            id: 'return',
            label: 'Then they all go home. Lumen carries hers herself.',
            requires: { cost: 20 },
            effects: {
              affinity: { 'mire-mothers': -10, moles: 5 },
              flags: ['isolde-jars-returned', 'lumen-carried-jar'],
            },
            response:
              'Lumen carries it on foot. She is gone four days. When she comes back, Isolde is at the gate with the green lantern lit. Neither says anything. They walk in together.',
          },
          {
            id: 'keep',
            label:
              'Leave them with Isolde. Lumen can sit with hers whenever she likes.',
            effects: {
              affinity: { 'mire-mothers': 5 },
              flags: ['isolde-keeps-jars'],
            },
            response:
              'Lumen comes every night. She sits on the floor by Isolde’s bunk with her back to the wall. Isolde sleeps. Lumen doesn’t.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'isolde-burrow',
    follower: 'F015',
    title: 'A Witch at the Burrow',
    fromDay: 37,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Isolde comes back from the Yard with her lantern dark and her jaw set.',
      'A family by the east wall. The little one has fen-fever. I know it by the smell. I can break it in a night.',
      'They won’t let me through the door. A Mother’s hand on their child. They’d rather it died clean. The Watch would carry me in if you said so. I’m asking whether you say so.',
    ],
    options: [
      {
        id: 'order',
        label: 'Order the door open. The child comes first.',
        effects: { affinity: { moles: -5 }, flags: ['isolde-forced-cure'] },
        response:
          'Two Watchmen hold the father in the passage. Isolde works all night. By morning the child is cool. The family moves out of the Yard that week. They take the child. They leave the blanket Isolde used.',
      },
      {
        id: 'respect',
        label: 'Respect the family. It is their door and their child.',
        effects: { affinity: { moles: 5 }, flags: ['isolde-respected-door'] },
        response:
          'Isolde leaves a green candle on their step and walks away. The child dies on the third night. The mother brings the candle back to the barracks, unlit, and sets it on Isolde’s sill.',
      },
    ],
  },
  // --- F016 Sable Thorne -------------------------------------------------------
  {
    id: 'sable-1',
    follower: 'F016',
    title: 'Impeccable Manners',
    fromDay: 29,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Sable Thorne has made tea in the barracks with a kettle borrowed from the infirmary and cups borrowed from nobody. Two cups. White gloves. They pour without spilling a drop, which on a barracks bunk is a kind of violence.',
      'Sit, Majesty. I know. The court thinks I am a spy, or a plague, or a debt the crown will regret. All three are reasonable.',
      'I have a favour to ask. Small. When the fever comes, and it will, I would like to be locked in. A key. Someone else holds it.',
      'The question is who.',
    ],
    options: [
      {
        id: 'you',
        label: 'You will hold the key.',
        effects: { flags: ['sable-key-emperor'] },
        response:
          'Sable hands you a key on a black ribbon. It is warm from the glove. The first fever comes four nights later. You sit outside the door until dawn. At three they knock once. You don’t open it. In the morning they thank you for that.',
      },
      {
        id: 'watch',
        label: 'The Watch holds it. That is what the Watch is for.',
        effects: { local: { 'gate-watch': 1 }, flags: ['sable-key-watch'] },
        response:
          '“Sensible.” The key goes on a nail in the gatehouse. The first fever comes four nights later. The sergeant on the door says they sang all night in a language with no consonants. He asks not to draw that door again.',
      },
      {
        id: 'self',
        label: 'They hold it themself. The crown does not lock up its guests.',
        effects: { flags: ['sable-key-self'] },
        response:
          'Sable hangs the key round their own neck. The first fever comes four nights later. In the morning their gloves are torn at the fingertips. The door is still locked from inside.',
      },
      {
        id: 'ask',
        label: 'Ask what the fever is.',
        effects: {},
        response:
          'Sable takes off one glove. Looks at their own paw. Puts the glove back on.',
        next: 'fever',
      },
      {
        id: 'promised',
        label:
          'Tell them first: the crown promised the Verge’s envoy it would hand them back, in exchange for the cures.',
        requires: { flags: ['promised-sable'] },
        effects: {},
        response:
          'Sable’s cup stops halfway to their mouth. Then it goes the rest of the way.',
        next: 'promised',
      },
    ],
    beats: [
      {
        id: 'fever',
        lines: [
          'At a certain age the Court gives each courtier its condition. A great honour. A ceremony. Everyone wears white.',
          'I was given a date. I left the night before. They had already begun. They did not finish.',
          'Some nights I run a fever that is not a fever. So far it has always passed. The Court will tell you I am dangerous. I may be. That is why I want a lock.',
          'That is all of it. I am running from a ceremony. It sounds smaller out loud.',
        ],
        options: [
          {
            id: 'you',
            label: 'Then you hold the key.',
            effects: { flags: ['talk-sable-flight', 'sable-key-emperor'] },
            response:
              'A key on a black ribbon, warm from the glove. Four nights later you sit outside their door till dawn. At three they knock once. You don’t open it.',
          },
          {
            id: 'watch',
            label: 'The Watch holds it.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['talk-sable-flight', 'sable-key-watch'],
            },
            response:
              'A nail in the gatehouse. A sergeant on the door. In the morning he will not say what he heard. He sleeps in the stables for a week.',
          },
          {
            id: 'self',
            label: 'They hold their own key.',
            effects: { flags: ['talk-sable-flight', 'sable-key-self'] },
            response:
              '“Nobody has ever let me hold my own key,” Sable says. They hang it round their neck. In the morning the door is locked from inside and the gloves are torn.',
          },
        ],
      },
      {
        id: 'promised',
        lines: [
          'I know. The envoy told me at the gate. As a kindness. That is how the Court does kindness.',
          'So the question is not who holds the key. The question is whether the crown keeps its word to the Verge. Decide that first. I will drink my tea while you do.',
        ],
        options: [
          {
            id: 'break',
            label: 'The crown breaks that promise. Sable stays.',
            effects: {
              affinity: { 'black-verge': -10 },
              flags: ['talk-sable-flight', 'sable-promise-broken'],
            },
            response:
              'Sable pours you a second cup. The glove is steady. “Then I owe you a broken promise. I will try to be worth one.” The envoy’s riders are at the gate within the week. Polite. Waiting.',
          },
          {
            id: 'until',
            label:
              'Tell them the truth: the promise stands until the crown finds a way out of it.',
            effects: { flags: ['talk-sable-flight', 'sable-promise-pending'] },
            response:
              '“Until,” Sable says. “Courtiers live in that word.” They finish the tea. They hang the key on their own neck. They don’t ask you to hold it.',
          },
        ],
      },
    ],
  },
  {
    id: 'sable-2',
    follower: 'F016',
    title: 'Eleven Steps',
    fromDay: 31,
    romance: true,
    requires: { flags: ['heard:sable-1'], notFlags: IN_THE_TOWER },
    lines: [
      'Sable has pushed the barracks bunks against the walls. They stand in the middle of the floor in the plum coat, gloves on, one paw held out at shoulder height.',
      'The Verge has a dance. Eleven steps. Courtiers learn it before they can read. I have not danced it in four years. I find I miss it. That is embarrassing.',
      'It needs two. I would ask the Watch, but the Watch would break my foot and apologise.',
      'You may say no. Most people should.',
    ],
    options: [
      {
        id: 'dance',
        label: 'Take their paw. Learn the eleven steps.',
        effects: { local: { 'old-houses': -1 }, flags: ['romance-sable'] },
        response:
          'You get it wrong nine times. Sable counts under their breath and does not laugh. On the tenth you get it right, and they stop counting. The door is open. Lady Vask, passing, says “How charming,” and walks on. By supper the Old Houses know.',
      },
      {
        id: 'ask',
        label: 'Ask what the dance means, at the Verge.',
        effects: {},
        response: 'Sable lowers the paw an inch.',
        next: 'means',
      },
      {
        id: 'friend',
        label:
          'Tell them you are a terrible dancer, and would rather watch. As a friend.',
        effects: { flags: ['sable-friendship'] },
        response:
          'Sable bows. “A friend who watches. Rarer than a partner.” They dance it alone, all eleven steps, to no music. When it is done they put the bunks back themselves.',
      },
    ],
    beats: [
      {
        id: 'means',
        lines: [
          'At the Verge it means: I trust you with my feet. That is a great deal, at a court where everyone is waiting for you to stumble.',
          'Danced at the end of an evening it also means: stay.',
          'It is the middle of the afternoon. So.',
        ],
        options: [
          {
            id: 'dance',
            label: 'Dance it. Afternoon or not.',
            effects: { local: { 'old-houses': -1 }, flags: ['romance-sable'] },
            response:
              'Eleven steps. You miss the seventh twice. On the last step Sable does not let go. Somebody in the doorway coughs and leaves. By supper the Old Houses know.',
          },
          {
            id: 'friend',
            label:
              'Tell them the afternoon is the right hour. Friends dance in daylight.',
            effects: { flags: ['sable-friendship'] },
            response:
              '“Daylight,” Sable says. “Yes.” They teach you all eleven steps, correctly, at arm’s length. You never dance it again. You remember every step.',
          },
        ],
      },
    ],
  },
  {
    id: 'sable-3',
    follower: 'F016',
    title: 'The Fever Night',
    fromDay: 34,
    romance: true,
    requires: {
      flags: ['heard:sable-2', 'romance-sable'],
      notFlags: courting('sable'),
    },
    lines: [
      'Midnight. Sable’s door. You hear them before you knock: breath like someone running uphill, and under it a hum with no tune.',
      'They open the door themself. Collar loose. Gloves off. Their eyes are wrong in the lamplight. Too much shine.',
      'It came early. I am sorry. You should not be here. I am glad you are here.',
      'I don’t know what I am when it is high. I have never let anyone find out. Stay. Or lock the door from outside. Or fetch the medic. Choose quickly. I am not good at choosing tonight.',
    ],
    options: [
      {
        id: 'stay',
        label: 'Stay. Inside. Through the night.',
        effects: { flags: ['sable-fever-shared'] },
        response:
          'You stay. They sit on the floor against the bed and you sit beside them. Some hours they talk about the Verge. Some hours they hold your wrist hard enough to bruise. At dawn it breaks. They look at the marks on your wrist a long time. “You stayed.”',
      },
      {
        id: 'lock',
        label: 'Lock the door from outside, and sit against it till morning.',
        effects: { flags: ['sable-fever-locked'] },
        response:
          'You lock it. You sit with your back to the wood. Around three the humming stops. A voice says, very close, through the door: “Thank you.” You say, “I’m here.” It says, “I know. That’s why.”',
      },
      {
        id: 'kiyo',
        label: 'Fetch Kiyo and her bitter tea.',
        requires: { follower: 'F003' },
        effects: {},
        response: 'Kiyo comes in her shawl with the kettle already hot.',
        next: 'kiyo',
      },
      {
        id: 'friend',
        label:
          'Fetch the medic. Tell them at the door that you can be their friend in this, and no more.',
        effects: { flags: ['sable-friendship'], clearFlags: ['romance-sable'] },
        response:
          '“Friend,” Sable says. “Yes. Correct.” The medic goes in. The door shuts. At breakfast Sable is in fresh gloves and thanks you for your discretion as if you had passed the salt.',
      },
    ],
    beats: [
      {
        id: 'kiyo',
        lines: [
          'Kiyo looks at Sable’s eyes and does not flinch.',
          {
            who: 'Kiyo',
            npc: 'F003',
            text: 'It is not a fever. I don’t know what it is. The tea will not cure it. The tea will make it sit down.',
          },
          {
            who: 'Kiyo',
            npc: 'F003',
            text: 'Someone should hold the cup. Not me. My hands are for the next patient.',
          },
        ],
        options: [
          {
            id: 'hold',
            label: 'Hold the cup.',
            effects: { flags: ['sable-fever-shared', 'sable-kiyo-tea'] },
            response:
              'Sable drinks in sips, both paws over yours. The shine goes out of their eyes by degrees. Kiyo leaves without a word. At dawn they are asleep with their head on your knee. Your leg is dead. You don’t move.',
          },
          {
            id: 'friend',
            label: 'Let Kiyo hold it. Wait outside, as a friend.',
            effects: {
              flags: ['sable-friendship'],
              clearFlags: ['romance-sable'],
            },
            response:
              'Kiyo holds the cup. You wait in the passage. In the morning Sable says, “Thank you for the door,” and means the outside of it.',
          },
        ],
      },
    ],
  },
  {
    id: 'sable-4',
    follower: 'F016',
    title: 'Gloves Off',
    fromDay: 38,
    romance: true,
    requires: {
      flags: ['heard:sable-3', 'romance-sable'],
      notFlags: courting('sable'),
    },
    lines: [
      'A letter from the Verge. White paper. White wax. Sable reads it at the window and holds it out to you without turning round.',
      'The envoy writes that the Verge will sit with the crown at the Congress and send its riders against the crown’s enemies. On one condition. The condition is not named. It does not need to be.',
      'Sable takes off their gloves. Both. Lays them on the sill, palms up, side by side.',
      'I can go back. It would be a good trade. One courtier for a war. I am not being noble; I have done the arithmetic. I want you to know I would go if you asked. And I want you not to ask.',
    ],
    options: [
      {
        id: 'never',
        label: 'No. The crown does not trade the people it loves.',
        effects: {
          affinity: { 'black-verge': -10 },
          flags: ['romance-sable-sealed', 'sable-not-traded'],
        },
        response:
          'Sable puts the gloves back on. One finger at a time. “The people it loves. That was a declaration, Majesty. In front of a window.” “Yes.” They answer the envoy in their best court hand. One line. The Verge does not come to the Congress.',
      },
      {
        id: 'choose',
        label:
          'Tell them you love them, and the choice is theirs. You will not make it for them.',
        effects: { flags: ['romance-sable-sealed', 'sable-chose-to-stay'] },
        response:
          'Sable is quiet a long time. Then they laugh. “Crueller than asking. Now I have to choose you myself.” They burn the white letter in the lamp. They leave the gloves on the sill all evening.',
      },
      {
        id: 'promise',
        label:
          'Tell them the crown promised them to the Verge once, for cures. That promise dies tonight.',
        requires: { flags: ['promised-sable'] },
        effects: {
          affinity: { 'black-verge': -10 },
          local: { lamplight: 1 },
          flags: [
            'romance-sable-sealed',
            'sable-not-traded',
            'sable-promise-broken',
          ],
        },
        response:
          '“You knew all this time. And you kept me anyway.” “Yes.” They take your paw, bare. It is cold. Then it isn’t. You write to the envoy together. Your seal. Their hand.',
      },
      {
        id: 'nera',
        label:
          'Tell them first that Nera has been standing in the rain with you.',
        requires: { flags: ['romance-nera'], follower: 'F006' },
        effects: {},
        response: 'Sable does not turn round.',
        next: 'nera',
      },
      {
        id: 'friend',
        label:
          'Tell them they should not stay for you. Stay for themself, as the crown’s friend.',
        effects: { flags: ['sable-friendship'], clearFlags: ['romance-sable'] },
        response:
          'Sable puts the gloves back on. “For myself,” they say. “Novel.” They stay. Precise and loyal. They never dance the eleven steps again where you can see.',
      },
    ],
    beats: [
      {
        id: 'nera',
        lines: [
          'I know. The whole barracks knows. She came in soaked to the bone and smiling. Courtiers notice who comes in wet.',
          'I am not going to duel her. That is a Verge custom and it ends badly.',
          'I am about to trade myself for a war, or not. I would like to know whom I am staying for.',
        ],
        options: [
          {
            id: 'sable',
            label:
              'Sable. You choose Sable, and you tell Nera yourself, tonight.',
            effects: {
              affinity: { 'black-verge': -10 },
              flags: ['romance-sable-sealed', 'sable-not-traded'],
              clearFlags: ['romance-nera'],
            },
            response:
              'Nera hears it on the wall. She nods. “I saw the weather on you a week ago.” She goes back to her storm-glass. Sable burns the white letter. The Verge does not come to the Congress.',
          },
          {
            id: 'nera',
            label: 'Nera. Tell them the truth.',
            effects: {
              flags: ['sable-friendship'],
              clearFlags: ['romance-sable'],
            },
            response:
              '“The petrel,” Sable says. “She will never bore you.” They pick up the gloves. “I will not go back to the Verge. Not for you. For myself. I find that is possible now.”',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'sable-chain',
    follower: 'F016',
    title: 'No Door That Locks',
    fromDay: 46,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Sable has borrowed a length of wagon chain from the hosts and laid it on their bedroll in a neat coil. White gloves on top.',
      'The fever is coming. A week. Perhaps less. The tower had a door with a lock. This place has curtains.',
      'Chain me to the post. Please. Or someone sits with me through it, and I cannot promise what that someone will be sitting with.',
    ],
    options: [
      {
        id: 'chain',
        label: 'Chain them, as they ask.',
        effects: { flags: ['sable-chained'] },
        response:
          'The fever comes on the fifth night. The chain holds. The hosts’ children hear it rattle till dawn and are afraid of Sable after. Sable thanks you with impeccable manners and cannot look at the post.',
      },
      {
        id: 'sit',
        label: 'No chains. Someone sits with them all night.',
        effects: { flags: ['sable-watched'] },
        response:
          'The fever comes on the fifth night. The Watchman who sits with them comes out at dawn with three long scratches down his arm and says it was nothing. Sable sends him their gloves.',
      },
    ],
  },
  // --- F017 Cobb Harrow --------------------------------------------------------
  {
    id: 'cobb-1',
    follower: 'F017',
    title: 'The Same Barn Three Times',
    fromDay: 11,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Cobb Harrow has been at the fortress two days and has not said what he came to say. He sits on the chopping block in the Yard with his pitchfork across his knees. Bent tine. Straw hat with a burn through the brim.',
      'You sit on the woodpile. He doesn’t look up.',
      'Built that barn three times. First time, lightning. Second time, the Pack. Third time I built it stone to the shoulder. Pack came back. Stone don’t burn. Roof does.',
      'I walked here to say something about Thistledown. Been two days working out what.',
    ],
    options: [
      {
        id: 'held',
        label: 'Ask what he walked here to say, now that Thistledown stands.',
        requires: { flags: ['thistledown-held'] },
        effects: {},
        response: 'Cobb turns the fork over. Bent tine up.',
        next: 'held',
      },
      {
        id: 'burned',
        label:
          'Ask what he walked here to say, now that Thistledown has burned.',
        requires: { flags: ['thistledown-burned'] },
        effects: {},
        response: 'Cobb takes off the hat. Looks at the hole.',
        next: 'burned',
      },
      {
        id: 'struck',
        label:
          'Tell him the Watch struck the Pack’s home camp to turn the raiders from Thistledown.',
        requires: { flags: ['d10-camp-struck'] },
        effects: {},
        response: 'Cobb is quiet a long time.',
        next: 'struck',
      },
      {
        id: 'roof',
        label: 'Offer to pay for the roof.',
        requires: { cost: 20 },
        effects: { affinity: { freeholds: 5 }, flags: ['cobb-barn-paid'] },
        response:
          'Cobb looks at the brass. “One barn. Thirty burned.” He takes it anyway. “Goes in the pot for all of them. Mine goes up last.” He builds four roofs before his own.',
      },
      {
        id: 'no-brass',
        label:
          'Tell him there is no brass for barns. It is going to the next raid.',
        effects: { local: { 'gate-watch': 1 }, flags: ['cobb-no-brass'] },
        response:
          'Cobb nods. Stands. Shoulders the fork. “Fair.” He walks to the board and signs for the next posting before the ink on it is dry.',
      },
    ],
    beats: [
      {
        id: 'held',
        lines: [
          'Thank you. That’s what. Came to say thank you.',
          'Then I got here and heard what it cost. Who rode. Who didn’t come back. Thank you’s too small a word for that.',
          'So I’ll work instead. Whatever needs building. Whatever needs holding. Till it’s paid.',
        ],
        options: [
          {
            id: 'owed',
            label:
              'Tell him nothing is owed. Thistledown was the crown’s to defend.',
            effects: {
              affinity: { freeholds: 5 },
              flags: ['cobb-nothing-owed'],
            },
            response:
              '“Owed or not,” Cobb says. He stands. The next morning the barracks door, which has stuck since the coronation, swings clean. Nobody saw him do it.',
          },
          {
            id: 'work',
            label: 'Accept. The crown needs hands that build.',
            effects: { local: { yard: 1 }, flags: ['cobb-working-debt'] },
            response:
              'Cobb shoulders the fork and walks to the workshop. He keeps a tally on the doorframe with a nail. You never learn what number he is counting to.',
          },
        ],
      },
      {
        id: 'burned',
        lines: [
          'Why nobody came. That’s what. Walked three days to ask it.',
          'Then I got here and saw the board. All the postings. All the places that burned the same week. Somebody had to choose.',
          'So I’m not asking why. I’m asking you to say it. To my face. That you chose.',
        ],
        options: [
          {
            id: 'say',
            label: 'Say it to his face. The crown chose, and Thistledown paid.',
            effects: { affinity: { freeholds: 5 }, flags: ['cobb-heard-it'] },
            response:
              'Cobb listens to all of it. He holds the burned hat in both hands. “All right,” he says. “Now I can work for you.” He puts the hat back on.',
          },
          {
            id: 'reasons',
            label: 'Tell him there were reasons he would not understand.',
            effects: { flags: ['cobb-given-reasons'] },
            response:
              '“Reasons,” Cobb says. He stays. He works harder than anyone in the barracks. He never asks you anything again.',
          },
        ],
      },
      {
        id: 'struck',
        lines: [
          'I heard. Watch lads drinking. Didn’t say much. Said the tents had pups in them. Coughing.',
          'My barn stands because of that. I’d have taken the barn burning. Nobody asked me.',
          'I don’t know what you want me to say. I don’t know what I want to say. I’m a farmer.',
        ],
        options: [
          {
            id: 'right',
            label: 'Tell him it was the right call. Thistledown lives.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['cobb-struck-defended'],
            },
            response:
              '“Thistledown lives,” Cobb says. He looks at the fork. “I’ll sleep in the barn when I get home. Bet I won’t sleep.”',
          },
          {
            id: 'unsure',
            label: 'Tell him you are not sure it was.',
            effects: {
              affinity: { jackalwire: 5 },
              flags: ['cobb-struck-doubted'],
            },
            response:
              '“Good,” Cobb says. “Somebody ought not to be.” That night he leaves half his supper on the gate post for nobody in particular. The Watch looks the other way.',
          },
        ],
      },
    ],
  },
  {
    id: 'cobb-2',
    follower: 'F017',
    title: 'Same Bench',
    fromDay: 20,
    // The whole scene is about Saffron, so it waits for her to be at court.
    requires: {
      flags: ['heard:cobb-1'],
      notFlags: IN_THE_TOWER,
      follower: 'F002',
    },
    lines: [
      'Supper. The barracks table. Cobb comes in with his bowl, sees who is on the bench, and stops.',
      'Saffron Kett. Jackal. Welding scars. She is mid-story and does not see him.',
      'Cobb takes his bowl outside and eats on the chopping block in the cold. Third night running. You follow him out.',
      'I know she left them. I know what she builds. I know it ain’t fair. I can’t sit there. I smell smoke.',
    ],
    options: [
      {
        id: 'order',
        label: 'Order him to the table. The barracks is one barracks.',
        effects: { local: { 'gate-watch': 1 }, flags: ['cobb-ordered-bench'] },
        response:
          'Cobb comes in. Sits at the far end. Eats with his head down. Saffron stops her story and doesn’t finish it. It is a quiet supper. It is quiet for a month.',
      },
      {
        id: 'apart',
        label: 'Let him eat where he likes. Some things can’t be ordered.',
        effects: { flags: ['cobb-eats-apart'] },
        response:
          'Cobb eats on the chopping block until the frost. Then one night there is a second stool beside the block. Nobody admits to it. Saffron’s hammer has sawdust on it.',
      },
      {
        id: 'saffron',
        label:
          'Bring Saffron out to the chopping block. Let her tell him why she left the Pack.',
        requires: { follower: 'F002' },
        effects: {},
        response:
          'Saffron comes out wiping her paws. She sees the fork. She stops at the door.',
        next: 'saffron',
      },
      {
        id: 'badge',
        label:
          'Tell him Saffron still keeps the Pack’s badge, welded in her toolkit.',
        requires: { flags: ['talk-saffron-insignia'] },
        effects: { affinity: { freeholds: 5 }, flags: ['cobb-told-badge'] },
        response:
          'Cobb looks at you a long time. “Why’d you tell me that?” You have no answer. He doesn’t go back to the table. Neither does Saffron, once she hears who told.',
      },
    ],
    beats: [
      {
        id: 'saffron',
        lines: [
          {
            who: 'Saffron Kett',
            npc: 'F002',
            text: 'I left when they started taking water from farms that had none to spare. Your sort of farm. I was fourteen. I walked out of the canyon with a toolbag and nothing to eat for six days.',
          },
          'Cobb doesn’t look at her.',
          {
            who: 'Saffron Kett',
            npc: 'F002',
            text: 'I wasn’t at Thistledown. Not any of the three times. That doesn’t make it all right. I just want you to know whose face to hate.',
          },
          'The fork turns in Cobb’s hands. Bent tine. Straight tine.',
        ],
        options: [
          {
            id: 'roof',
            label:
              'Ask Saffron to help him put the roof back on, when the season turns.',
            effects: {
              affinity: { freeholds: 5, jackalwire: 5 },
              flags: ['cobb-saffron-roof'],
            },
            response:
              'Neither says yes. In the spring they both go. They come back two weeks later, sunburnt, not talking. Cobb’s barn has a roof. There is a lightning bolt on the weathervane. Cobb says he hasn’t noticed.',
          },
          {
            id: 'enough',
            label: 'That is enough for tonight. Send them both in.',
            effects: { flags: ['cobb-heard-saffron'] },
            response:
              'Saffron goes in. Cobb sits a while longer. Then he comes in and sits on the bench. Same bench. Far end. Neither speaks. It is the first time.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'cobb-timber',
    follower: 'F017',
    title: 'My Barn for Sale',
    fromDay: 28,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Cobb puts a charred beam end on your table. Oak. Pegged, not nailed. His mark cut in the end grain.',
      'Rustline trader in the market’s selling Thistledown timber. Salvage. Off my barn. Off my neighbours’. Cheap, and folk are buying.',
      'Salvage law says what burns and lies is anybody’s. I know. I don’t want it back. I want him to stop.',
    ],
    options: [
      {
        id: 'ban',
        label: 'Ban the sale. Salvage law bends for Thistledown.',
        effects: {
          affinity: { rustline: -5, freeholds: 5 },
          flags: ['cobb-salvage-banned'],
        },
        response:
          'The trader packs up, swearing. Next week every Rustline stall puts its prices up a copper, for the crown’s new rules. Cobb buys back one beam with his own pay and nails it over his bunk.',
      },
      {
        id: 'law',
        label: 'Salvage is salvage. The law can’t pick favourites.',
        effects: {
          affinity: { rustline: 5, freeholds: -5 },
          flags: ['cobb-salvage-allowed'],
        },
        response:
          'Cobb takes the beam end back. He walks through the market every morning after that, the long way, past the stall. He never stops. He never buys.',
      },
    ],
  },
  {
    id: 'cobb-frame',
    follower: 'F017',
    title: 'The Fourth Barn',
    fromDay: 44,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Cobb has his hammer and his hat and a bundle on his back. He is standing at the hideout mouth, not leaving.',
      'Word came. Thistledown burned again in the dark. Fourth time. Folk are sleeping in the fields.',
      'It’s three days. I can raise a frame before the frost. Or I stay, and you’ve got one more pair of hands when the end comes. I came here to say something. Never did. Maybe this is it.',
    ],
    options: [
      {
        id: 'go',
        label: 'Go. Raise the frame. Come back if you can.',
        effects: { affinity: { freeholds: 5 }, flags: ['cobb-went-home'] },
        response:
          'He goes at first light. Nine days later he is back with ash in his hat. “Raised the frame,” he says. “Somebody else can roof it.” He sits on the woodpile and sleeps sitting up.',
      },
      {
        id: 'stay',
        label: 'Stay. The court needs your hands now.',
        effects: { flags: ['cobb-stayed'] },
        response:
          'Cobb puts the bundle down. He builds the hosts a lean-to for the sick by nightfall without being asked. He doesn’t look north. Not once. Everyone notices.',
      },
    ],
  },
  // --- F018 Vesper Fanfare -----------------------------------------------------
  {
    id: 'vesper-1',
    follower: 'F018',
    title: 'The Scorched Gloves',
    fromDay: 19,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Vesper Fanfare is on the Yard wall with three unlit clubs and twenty children below her chanting her name. She waves you up. She doesn’t stop juggling to do it.',
      'They want to learn. Fire, I mean. I said I’d ask the boss.',
      'Six of them already know how to light a club. I didn’t teach them. They watched. Kids watch.',
      'Give me a corner of the Yard and a water trough and I teach them proper. Or say no, and they keep teaching themselves behind the stables. Your call. The Watch hates it either way.',
    ],
    options: [
      {
        id: 'school',
        label: 'Give her the corner and the trough.',
        effects: {
          local: { yard: 2, 'gate-watch': -1 },
          flags: ['vesper-fire-school'],
        },
        response:
          'By the week’s end there are twenty children in the corner with wet rags round their paws and one lit club among them, passed hand to hand. Nobody burns. The Watch posts a sergeant with a bucket. He learns three throws.',
      },
      {
        id: 'no',
        label: 'No fire in a drought. Not in the Yard.',
        effects: { local: { 'gate-watch': 1 }, flags: ['vesper-fire-banned'] },
        response:
          'Vesper catches all three clubs. “Fair.” She tells the children. They boo her, not you. She bows. Two nights later the Watch puts out a small fire behind the stables. Nobody is hurt.',
      },
      {
        id: 'gloves',
        label: 'Ask about her gloves. They are scorched through at the palms.',
        effects: {},
        response:
          'The clubs come down. One, two, three, into the crook of her arm.',
        next: 'gloves',
      },
    ],
    beats: [
      {
        id: 'gloves',
        lines: [
          'Fair at the Ford, two summers back. A girl at the front. Leaned in. Her hair went up. I put it out with these.',
          'She’s fine. Bit of a scar. Shorter hair.',
          'I send her family the hat every month. All of it. They think it’s a Saltroad charity.',
          'So when I say teach them proper, that’s what I mean.',
        ],
        options: [
          {
            id: 'school',
            label:
              'Then teach them proper. The corner and the trough are hers.',
            effects: {
              local: { yard: 2, 'gate-watch': -1 },
              flags: ['vesper-fire-school'],
            },
            response:
              '“Rule one,” Vesper tells twenty children, “you don’t lean in.” She makes them say it back. Every lesson. Every day.',
          },
          {
            id: 'no',
            label: 'No. Not after hearing that.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['vesper-fire-banned'],
            },
            response:
              '“Yeah,” Vesper says. “I thought that too, for a while.” She goes down and takes the matches off the six who know how. All of them. She doesn’t give them back.',
          },
        ],
      },
    ],
  },
  {
    id: 'vesper-2',
    follower: 'F018',
    title: 'An Audience of One',
    fromDay: 22,
    romance: true,
    requires: { flags: ['heard:vesper-1'], notFlags: IN_THE_TOWER },
    lines: [
      'After midnight. The Yard is empty. Vesper is on the wall with all three clubs lit, juggling for nobody. The flames draw circles on the stone.',
      'She sees you. She doesn’t stop. She throws higher.',
      'I do this every night. Nobody watches at night. Only time it’s just the fire.',
      'She catches all three in one hand and holds them out to the side so the light is on you.',
      'Well. Now somebody’s watching. Stay or go, boss. I won’t do the next bit if you go.',
    ],
    options: [
      {
        id: 'stay',
        label: 'Stay for the next bit.',
        effects: { flags: ['romance-vesper'] },
        response:
          'The next bit is all three clubs thrown straight up, as high as they go, and Vesper stepping in close while they are in the air, and kissing you once. She steps back. Catches them. One, two, three. “Never done that with an audience.”',
      },
      {
        id: 'ask',
        label: 'Ask what the next bit is.',
        effects: {},
        response: 'Vesper grins. It doesn’t reach all the way.',
        next: 'next',
      },
      {
        id: 'friend',
        label: 'Tell her she was wonderful. Then go, and leave her the fire.',
        effects: { flags: ['vesper-friendship'] },
        response:
          '“Thanks, boss.” She means it. She throws them up again as you go down. From the Yard she is a small figure inside three circles of fire. She does not look down.',
      },
    ],
    beats: [
      {
        id: 'next',
        lines: [
          'Can’t tell you. Ruins it. I’ve never done it for anybody. Might not work with somebody there. Might go wrong.',
          'That’s the thing about a trick. You only find out live.',
        ],
        options: [
          {
            id: 'stay',
            label: 'Find out live.',
            effects: { flags: ['romance-vesper'] },
            response:
              'Three clubs up, high as they go. She steps in. One kiss. Steps back. Catches them, one, two, three. “Works,” she says. Her paws are shaking. The clubs aren’t.',
          },
          {
            id: 'friend',
            label:
              'Tell her some tricks are better left unseen. Say goodnight, as a friend.',
            effects: { flags: ['vesper-friendship'] },
            response:
              '“Unseen,” says Vesper. “Right. Night, boss.” You hear the clubs go up behind you as you take the stair. Then the sound of one dropped on the stone. Then nothing.',
          },
        ],
      },
    ],
  },
  {
    id: 'vesper-3',
    follower: 'F018',
    title: 'The Ballad',
    fromDay: 28,
    romance: true,
    requires: {
      flags: ['heard:vesper-2', 'romance-vesper'],
      notFlags: courting('vesper'),
    },
    lines: [
      'Vesper has written a song. She sits on your bed with a borrowed fiddle she can’t play and sings it anyway, banging the rhythm out on the bed frame.',
      'It is about an emperor who climbed a wall at midnight and a juggler who threw her clubs too high. It rhymes “crown” with “come down”. It is good.',
      'Saltroad fairs pay for new songs. This one would go round the whole road in a month. Every caravan fire. Everybody would know.',
      'That’s the thing. Everybody would know. Your Old Houses would hate it. They like their emperors in portraits.',
      'I want to sing it. Badly. But it’s yours too. So you say.',
    ],
    options: [
      {
        id: 'sing',
        label: 'Let her sing it. Every fire on the road.',
        effects: {
          affinity: { saltroad: 5 },
          local: { yard: 2, 'old-houses': -2 },
          flags: ['vesper-ballad-sung'],
        },
        response:
          'She sings it at the next fair. Then the next. Within a month the Yard children sing it on the wall. Lady Vask hears it under her window and shuts the shutters. Vesper sends her a copy. Signed.',
      },
      {
        id: 'private',
        label: 'Keep it between you. Sing it only here.',
        effects: { flags: ['vesper-ballad-private'] },
        response:
          '“Only here,” she says. She sings it again, quieter, to the bed frame and to you. She never sings it anywhere else. Sometimes in the Yard you catch her humming it, and stopping.',
      },
      {
        id: 'friend',
        label:
          'Tell her it is a fine song, and it should not be about you. Stay friends.',
        effects: {
          flags: ['vesper-friendship'],
          clearFlags: ['romance-vesper'],
        },
        response:
          'Vesper puts the fiddle down. “Not about you. Right.” She rewrites it overnight. The emperor becomes a sailor. It still rhymes crown with come down. It goes round the whole Saltroad. Nobody knows.',
      },
    ],
  },
  {
    id: 'vesper-4',
    follower: 'F018',
    title: 'Dance in Wartime',
    fromDay: 35,
    romance: true,
    requires: {
      flags: ['heard:vesper-3', 'romance-vesper'],
      notFlags: courting('vesper'),
    },
    lines: [
      'The war has reached the Ford. The Yard is short of bread, short of oil, short of sleep. Vesper has built a fire in the middle of it anyway, out of broken crates, and fifty people are standing round it not dancing.',
      'She finds you on the steps.',
      'They need it, boss. One night. They won’t dance unless somebody goes first. They won’t go unless it’s you.',
      'Dance with me. In front of all of them. In a war. The Old Houses will write letters. The Watch will think you’ve gone soft. The Yard will remember it till they die.',
      'Or don’t, and I dance alone, and it’s a good show. Not the same.',
    ],
    options: [
      {
        id: 'dance',
        label: 'Go down. Dance with her in front of everyone.',
        effects: {
          local: { yard: 3, 'old-houses': -2, 'gate-watch': -1 },
          flags: ['romance-vesper-sealed', 'vesper-danced-openly'],
        },
        response:
          'She takes both your paws. You are bad at it. She doesn’t care. By the third song fifty people are dancing on broken crates and nobody is thinking about the Ford. Lady Vask writes a letter. Nobody reads it.',
      },
      {
        id: 'dark',
        label: 'Dance with her later, behind the kitchen, where nobody sees.',
        effects: {
          local: { yard: 1 },
          flags: ['romance-vesper-sealed', 'vesper-danced-dark'],
        },
        response:
          'She dances alone at the fire. Good show. Afterwards, behind the kitchen, in the dark, she dances again. With you. No crowd. “I’m good at being looked at,” she says into your shoulder. “I’ll learn the other thing.”',
      },
      {
        id: 'ash',
        label:
          'Tell her first that Ash has been reading your letters, and writing back.',
        requires: { flags: ['romance-ash'], follower: 'F007' },
        effects: {},
        response: 'Vesper laughs. Short.',
        next: 'ash',
      },
      {
        id: 'friend',
        label:
          'Tell her the Yard needs her to dance with all of them. Not with you.',
        effects: {
          flags: ['vesper-friendship'],
          clearFlags: ['romance-vesper'],
        },
        response:
          'Vesper looks at you. Nods. Once. She goes down alone and grabs Foreman Dunmore by both hands. He is terrible. The Yard roars. She doesn’t look up at the steps again.',
      },
    ],
    beats: [
      {
        id: 'ash',
        lines: [
          'The courier. I know. Ash carries your letters to the Saltroad too, boss. Goes pink every time.',
          'So. Fire or ink. You don’t get both. Not in a war.',
          'Pick. Then we dance, or I dance, or nobody does.',
        ],
        options: [
          {
            id: 'fire',
            label: 'Fire. You pick Vesper, and you tell Ash tonight.',
            effects: {
              local: { yard: 3, 'old-houses': -2 },
              flags: ['romance-vesper-sealed', 'vesper-danced-openly'],
              clearFlags: ['romance-ash'],
            },
            response:
              'You tell Ash first. They listen. They nod. They go back to the post and sort it, fast and neat. Then you go down to the fire. Vesper is already dancing. She holds out her paw without looking.',
          },
          {
            id: 'ink',
            label: 'Ink. Tell her the truth.',
            effects: {
              flags: ['vesper-friendship'],
              clearFlags: ['romance-vesper'],
            },
            response:
              '“Ink,” says Vesper. “Course.” She dances alone. It is the best show of her life. She does not look at the steps once.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'vesper-powder',
    follower: 'F018',
    title: 'One Spark',
    fromDay: 31,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Vesper has her clubs under one arm and the war camp’s quartermaster at her heels, red in the face.',
      'Camp below the Ford’s losing three a night. Deserters. They’re not cowards, boss. They’re bored and scared and nobody’s laughed in a week. Give me one night. One show.',
      'The quartermaster says no fire within a hundred paces of the lamp oil. The oil’s everywhere. He’s right. So am I.',
    ],
    options: [
      {
        id: 'show',
        label: 'Let her do the show. Far from the oil as she can get.',
        effects: {
          local: { yard: 1, 'gate-watch': -1 },
          flags: ['vesper-war-show'],
        },
        response:
          'She juggles on a sandbar in the river, so far out they need lanterns to see her. They laugh. Nobody deserts that week. A spark lands in a fodder cart on the way back. It burns. Nobody’s hurt. The quartermaster doesn’t speak to her again.',
      },
      {
        id: 'no',
        label: 'No fire. Not near the oil. Not in a war.',
        effects: { local: { 'gate-watch': 1 }, flags: ['vesper-no-show'] },
        response:
          'Vesper puts the clubs down. She goes down to the camp anyway and juggles turnips. A few laugh. Two more go over the ridge that night.',
      },
    ],
  },
  // --- F019 Hollin Moss --------------------------------------------------------
  {
    id: 'hollin-1',
    follower: 'F019',
    title: 'Roads That No Longer Exist',
    fromDay: 15,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Hollin Moss has a map unrolled across the barracks floor. New paper. He is drawing it from memory. Three days in, he has reached the north.',
      'He doesn’t look up. Owls rarely do. They turn.',
      'This road. The old pilgrim way, from the Ford to the mission hill. It ran under the hill, not over. Brick-lined. I walked it as a fledgling with my mother, fifty years ago. It has been on no map since.',
      'It comes out under the Abbey. I am almost certain. I remember stairs.',
      'I want to put it on the crown’s map. The Archive will want a copy. The Ledger will want to sell one. The Abbey will want neither.',
    ],
    options: [
      {
        id: 'seal',
        label: 'Put it on the crown’s map, under seal. Only the crown sees it.',
        effects: { local: { lamplight: 1 }, flags: ['hollin-road-sealed'] },
        response:
          'Hollin inks it in brick-red and blots it twice. It goes in the map chest. Two days later Komodo asks, idly, whether Hollin has finished the north. Hollin, from the doorway, says he is still on the west.',
      },
      {
        id: 'archive',
        label:
          'Give the Archive its copy. The record should outlive the crown.',
        effects: { local: { lamplight: 2 }, flags: ['hollin-road-archived'] },
        response:
          'Keeper Vellum takes a quarter of an hour to unroll it. He looks at the red line a long time. Then he rolls it up and puts it in the lowest vault.',
      },
      {
        id: 'leave',
        label: 'Leave it off. Some roads should stay gone.',
        effects: { affinity: { abbey: 5 }, flags: ['hollin-road-forgotten'] },
        response:
          'Hollin lifts the pen. Blinks once. “As you like.” He leaves the north blank. He does not burn his notes. Owls never burn anything.',
      },
      {
        id: 'stairs',
        label: 'Ask about the stairs.',
        effects: {},
        response: 'Hollin’s head turns all the way round to you.',
        next: 'stairs',
      },
    ],
    beats: [
      {
        id: 'stairs',
        lines: [
          'Stone stairs. Going down. A door at the bottom. Iron, with a bell painted on it. My mother would not let me near it.',
          'She said it was where pilgrims left what they could not carry home. I was seven. I thought she meant luggage.',
          'I have not thought about that door in fifty years. I have thought about nothing else for three days.',
        ],
        options: [
          {
            id: 'seal',
            label: 'On the crown’s map. Under seal. Door and all.',
            effects: { local: { lamplight: 1 }, flags: ['hollin-road-sealed'] },
            response:
              'He draws the door. A small square at the bottom of a red line. He draws a bell on it without being asked. It goes in the map chest. You lock it yourself.',
          },
          {
            id: 'archive',
            label:
              'Give it to the Archive. Somebody besides an old archivist should remember.',
            effects: {
              local: { lamplight: 2 },
              flags: ['hollin-road-archived'],
            },
            response:
              'Vellum files it in the lowest vault. He writes the date on the case. Then, below it: do not lend.',
          },
          {
            id: 'leave',
            label: 'Leave it off the map. Leave the door shut.',
            effects: {
              affinity: { abbey: 5 },
              flags: ['hollin-road-forgotten'],
            },
            response:
              '“Shut,” Hollin agrees. He leaves the north blank. That night he does not sleep. Owls don’t, much. But this is different.',
          },
        ],
      },
    ],
  },
  {
    id: 'hollin-2',
    follower: 'F019',
    title: 'Two Dots Before Every Number',
    fromDay: 33,
    requires: { flags: ['ledger-page-kept'], notFlags: IN_THE_TOWER },
    lines: [
      'Hollin is still at the lamp when you come in. The page from the Keeper lies under a lens. Beside it, a dozen other pages from the dispatch chest. All different hands.',
      'Same writer. Every one. He changes the hand. He does not change the habits.',
      'Left-handed. Taps the pen twice before every number. You can see it in the ink: two small dots, then the figure. A habit like that is older than lying.',
      'His head turns all the way round to you.',
      'I have only ever seen one person at this court tap twice before a number. He taps a claw on his ledger. You have watched him do it every morning.',
    ],
    options: [
      {
        id: 'reading',
        label: 'Tell Hollin to keep reading. Quietly. Nobody but you.',
        effects: { flags: ['hollin-keeps-reading'] },
        response:
          'Hollin moves the lamp to the back of the archive, where the door can’t see it. Two nights later Komodo stops in that doorway, looks into the dark, says “Good night, Hollin,” and walks on. Hollin does not answer. He has stopped breathing.',
      },
      {
        id: 'burn',
        label:
          'Tell him to burn his notes. Komodo is the crown’s friend. A habit is not a crime.',
        effects: { flags: ['hollin-told-burn'] },
        response:
          'Hollin looks at you a long time. Then he takes the notes to the brazier. He does not burn the page. You don’t ask. He doesn’t offer.',
      },
      {
        id: 'vault',
        label:
          'Seal it all in the Archive’s lowest vault, to be opened if the crown falls.',
        effects: { local: { lamplight: 1 }, flags: ['hollin-notes-sealed'] },
        response:
          'Keeper Vellum seals it himself. Wax. Thread. His own name. “If the crown falls. A strange instruction, Majesty.” He doesn’t ask why. He writes the date.',
      },
      {
        id: 'feather',
        label:
          'Tell him Nera has been leaving a grey feather on the throne on mornings when a report has no weather in it.',
        requires: { flags: ['nera-watching-briefings'], follower: 'F006' },
        effects: {},
        response: 'Hollin goes still.',
        next: 'feather',
      },
    ],
    beats: [
      {
        id: 'feather',
        lines: [
          'Then two of us have seen it. From two sides. She hears it. I see it.',
          'That is not proof. Two old birds and a feeling.',
          'But I would like it written down that there were two.',
        ],
        options: [
          {
            id: 'reading',
            label: 'Write it down. Then both of them keep watching. Quietly.',
            effects: {
              flags: ['hollin-keeps-reading', 'hollin-nera-watching'],
            },
            response:
              'Hollin writes it on the back of the page. Two names. A date. He folds it in half. Not along any line Komodo would choose.',
          },
          {
            id: 'vault',
            label: 'Write it down, and seal it in the vault with the rest.',
            effects: {
              local: { lamplight: 1 },
              flags: ['hollin-notes-sealed'],
            },
            response:
              'Two names go into the lowest vault under the Keeper’s seal. Vellum reads them before he seals it. He says nothing. His keys are silent all the way back up the stair.',
          },
        ],
      },
    ],
  },
  {
    id: 'hollin-3',
    follower: 'F019',
    title: 'The Map of a Fallen Tower',
    fromDay: 42,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'Hollin is drawing the fortress from memory on the back of a flour sack. Walls. Yard. Barracks roof. He has drawn the tower three times and scraped it out three times.',
      'I cannot decide how to draw it. As it was. Or as it is now, with his banner on it.',
      'A map that lies is no use. A map that tells the truth about this one, I cannot look at.',
    ],
    options: [
      {
        id: 'was',
        label: 'Draw it as it was. That is what we are going back to.',
        effects: { flags: ['hollin-draws-was'] },
        response:
          'He draws it as it was. The roof. The bell. Your window. He gives it to you. You keep it rolled in your coat. You don’t unroll it.',
      },
      {
        id: 'is',
        label: 'Draw it as it is. The crown needs a map it can attack.',
        effects: { local: { 'gate-watch': 1 }, flags: ['hollin-draws-is'] },
        response:
          'He draws the grey banner. The sentries. The postern. Then the drain under the north wall that nobody has thought of in forty years. He circles that.',
      },
      {
        id: 'first',
        label: 'Tell him he saw it first. He was right.',
        requires: { flags: ['hollin-keeps-reading'] },
        effects: {},
        response: 'Hollin puts the pen down.',
        next: 'right',
      },
    ],
    beats: [
      {
        id: 'right',
        lines: [
          'Right. Yes. Two dots before every number.',
          'I was right on the thirty-third day and I wanted proof. On the fortieth I had it. The proof was the tower.',
          'Slow wings. Everyone always said so. I thought they meant flying.',
        ],
        options: [
          {
            id: 'slower',
            label:
              'Tell him the crown was slower. The crown had the page in its hand.',
            effects: { flags: ['hollin-absolved'] },
            response:
              'Hollin blinks. Once. Then he picks up the pen and draws the tower as it was. Beside the door, a tiny figure carrying a map.',
          },
          {
            id: 'is',
            label: 'Then be fast now. Draw it as it is.',
            effects: { local: { 'gate-watch': 1 }, flags: ['hollin-draws-is'] },
            response:
              'He draws it by morning. Banner. Sentries. Postern. The north drain, circled twice. He doesn’t sleep. He says he’ll sleep after.',
          },
        ],
      },
    ],
  },

  // Short talks (t-042).
  {
    id: 'hollin-eyes',
    follower: 'F019',
    title: 'Borrowed Eyes',
    fromDay: 26,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Hollin holds a map up to the lamp. Then closer. Then he puts it down.',
      'The fine lines go now, after dark. Contours. Wells. I drew a well on the wrong side of a ridge on Tuesday. A rider found the mistake. He found it thirsty.',
      'There is a Yard girl with good eyes who already reads my maps over my shoulder. The Archive says only sworn copyists learn the craft. An Archive copyist comes in a month. Riders ride every day.',
    ],
    options: [
      {
        id: 'girl',
        label: 'Teach the girl. Riders ride every day.',
        effects: { local: { lamplight: -1 }, flags: ['hollin-taught-girl'] },
        response:
          'She learns fast. Faster than he did. The Archive writes a stiff letter. In the spring she draws the north ridge alone, and Hollin finds nothing to correct. He looks for an hour.',
      },
      {
        id: 'sworn',
        label: 'Wait for the sworn copyist. The craft has rules for a reason.',
        effects: { local: { lamplight: 1 }, flags: ['hollin-waited-copyist'] },
        response:
          'The copyist arrives in five weeks with a seal and a cough. Until then Hollin draws by daylight only, and slower. Two more wells are wrong. One rider doesn’t come back to report it.',
      },
    ],
  },
  // --- F020 Juniper Slate ------------------------------------------------------
  {
    id: 'juniper-1',
    follower: 'F020',
    title: 'Broth and Gossip',
    fromDay: 10,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'The kitchens at the fourth bell. Juniper Slate has flour to the elbows and a ladle in each fist. They don’t stop. They talk to the pot.',
      'Gossip or broth first? Same price.',
      'Gossip, then. Porter called Nim. Big lad. Three kids at his sister’s. He walks out the back with a half-sack of flour under his coat. Twice a week. I’ve watched him.',
      'I tell you what I hear. That’s the job. I don’t tell you what to do with it. But I’m the one who looks at him over the pot tomorrow.',
    ],
    options: [
      {
        id: 'nothing',
        label: 'Do nothing. Let him have the flour.',
        effects: {
          local: { yard: 1, ledger: -1 },
          flags: ['juniper-nim-spared'],
        },
        response:
          'Juniper stirs. “Ledger counts sacks. Somebody will notice. Not me.” Somebody does, a fortnight later. By then Juniper is leaving a half-sack by the back door twice a week, so it isn’t stealing.',
      },
      {
        id: 'pay',
        label:
          'Pay for his sister’s flour from the crown’s purse. Tell him to stop.',
        requires: { cost: 10 },
        effects: { local: { yard: 2 }, flags: ['juniper-nim-paid'] },
        response:
          'Juniper tells him. Nim cries in the scullery for ten minutes. Big lad. Then he comes out and scrubs every pot in the place without being asked. He never takes another sack.',
      },
      {
        id: 'dock',
        label:
          'Dock his wages for what he took. The Yard eats from the same stores.',
        effects: {
          local: { ledger: 1, yard: -1 },
          flags: ['juniper-nim-docked'],
        },
        response:
          'Juniper tells Nim. Nim nods. Next morning Juniper serves him same as everyone. Same ladle. Same smile. The smile takes a second longer.',
      },
      {
        id: 'bowl',
        label:
          'Ask why this didn’t come under the broth bowl on the arm of the throne.',
        requires: { flags: ['d09-kitchen-ear'] },
        effects: {},
        response: 'Juniper stops stirring.',
        next: 'bowl',
      },
    ],
    beats: [
      {
        id: 'bowl',
        lines: [
          'The notes under the bowl are about the Old Houses. Prices. Who’s hoarding. That’s fair game.',
          'This is Nim. Nim’s Yard. If I write Nim under a bowl, I’m a spy with a soup pot. If I say Nim to your face, I’m a cook with a worry.',
          'I need you to know I know the difference.',
        ],
        options: [
          {
            id: 'nothing',
            label: 'Then the cook’s worry stays in the kitchen. Let Nim be.',
            effects: {
              local: { yard: 1, ledger: -1 },
              flags: ['juniper-nim-spared'],
            },
            response:
              'Juniper nods. Back to the pot. Next morning there is a bowl on the arm of the throne. The note under it is about the price of salt.',
          },
          {
            id: 'pay',
            label: 'Pay for the sister’s flour. Tell Nim to stop.',
            requires: { cost: 10 },
            effects: { local: { yard: 2 }, flags: ['juniper-nim-paid'] },
            response:
              'Nim cries in the scullery. Then he scrubs every pot. Juniper never writes his name anywhere.',
          },
          {
            id: 'dock',
            label:
              'Dock his wages. A worry said to the crown is still a report.',
            effects: {
              local: { ledger: 1, yard: -1 },
              flags: ['juniper-nim-docked'],
            },
            response:
              '“Still a report,” Juniper says. “Right.” They don’t tell you a name again for a month.',
          },
        ],
      },
    ],
  },
  {
    id: 'juniper-2',
    follower: 'F020',
    title: 'Which Side the Kitchens Are On',
    fromDay: 37,
    requires: { flags: ['heard:juniper-1'], notFlags: IN_THE_TOWER },
    lines: [
      'The Ledger has shut its stalls. The Yard’s ovens are cold for want of oil. Juniper has fed two hundred people on one pot of lentils and a lot of talk. Now they sit at the barracks table and put their head down on it.',
      'They’re talking, boss. The Yard. Not about you. About the Ledger. About the Old Houses’ cellars full of oil. About doors. About torches.',
      'Somebody’s going to ask me to open the kitchen’s back gate one night. It’s the only gate the Watch doesn’t watch. I feed everyone. Everyone trusts the cook.',
      'I’m asking which side the kitchens are on. Before somebody else tells me.',
    ],
    options: [
      {
        id: 'eat',
        label:
          'Come down and eat with the Yard tonight. In front of everyone. Answer what they ask.',
        effects: {
          local: { yard: 3, 'old-houses': -2 },
          flags: ['juniper-emperor-ate'],
        },
        response:
          'You eat lentils on a bench between a porter and a washerwoman. They ask hard things. You answer most. Some you can’t. Nobody opens the back gate that night. Juniper gives you seconds without asking.',
      },
      {
        id: 'gate',
        label:
          'Tell Juniper to keep the back gate shut, and to tell you who asks.',
        effects: {
          local: { 'gate-watch': 2, yard: -1 },
          flags: ['juniper-gate-shut'],
        },
        response:
          '“Who asks,” Juniper says. “Right.” Two nights later someone asks. Juniper gives you the name. Then they go and make breakfast, and don’t eat any.',
      },
      {
        id: 'oil',
        label:
          'The crown buys oil for the ovens from its own purse. The Yard bakes tomorrow.',
        requires: { cost: 25 },
        effects: { local: { yard: 2 }, flags: ['juniper-oil-bought'] },
        response:
          'The ovens are lit by dawn. The Yard smells of bread for the first time in a week. The talk about torches stops. Not for good. For bread.',
      },
      {
        id: 'runners',
        label:
          'Ask whether the Yard still talks about the six runners sent up the Heights.',
        requires: { flags: ['runners-lent'] },
        effects: {},
        response: 'Juniper lifts their head off the table.',
        next: 'runners',
      },
    ],
    beats: [
      {
        id: 'runners',
        lines: [
          'Every night. Their mothers sit at the end of my table. They don’t eat. They count the days.',
          'That’s what it’s about, boss. Not oil. Oil’s just what you can set fire to.',
        ],
        options: [
          {
            id: 'eat',
            label: 'Then go down and sit with the mothers first.',
            effects: {
              local: { yard: 3, 'old-houses': -2 },
              flags: ['juniper-emperor-ate'],
            },
            response:
              'You sit at the end of the table with six mothers. They don’t speak to you. You don’t leave. At midnight one of them pushes a bowl toward you. You eat it.',
          },
          {
            id: 'gate',
            label: 'Keep the back gate shut. Tell you who asks.',
            effects: {
              local: { 'gate-watch': 2, yard: -1 },
              flags: ['juniper-gate-shut'],
            },
            response:
              'Juniper nods. The next name they give you is one of the mothers. They give it in a flat voice and go back to the pot.',
          },
        ],
      },
    ],
  },
  {
    id: 'juniper-3',
    follower: 'F020',
    title: 'The Bowl on the Arm',
    fromDay: 41,
    requires: { flags: ['komodo-betrayal'] },
    lines: [
      'There is no throne in the hideout. Juniper sets the bowl of broth on an upturned crate instead. Folded note underneath. Same as every morning.',
      'The note says: Nobody slept. Bread for four days. Three of the Watch want to go home. One of them is lying about why.',
      'Juniper stays. They never stay.',
      'He used to come through my kitchen first. Every morning. Before you. He’d lift the bowl, read my note, put it back. Exactly. I thought he was checking it was hot.',
      'Forty mornings. He read what I knew before you did.',
    ],
    options: [
      {
        id: 'hand',
        label: 'From now on the note comes to your hand. No bowl.',
        effects: { flags: ['juniper-notes-by-hand'] },
        response:
          'Next morning they hand you the note in person, folded once, and stand there until you have read it. Every morning after. They never set a bowl down for anyone again.',
      },
      {
        id: 'not-yours',
        label: 'Tell them it is not their fault. He fooled the crown too.',
        effects: { flags: ['juniper-absolved'] },
        response:
          '“The crown didn’t make his breakfast,” Juniper says. They pick up the bowl and drink it themselves, cold, standing. Then they go and make more.',
      },
      {
        id: 'yard',
        label: 'Ask what the Yard is saying about him.',
        effects: {},
        response: 'Juniper wipes their paws on the apron. Slowly.',
        next: 'yard',
      },
    ],
    beats: [
      {
        id: 'yard',
        lines: [
          'Depends who. Some curse him at the fire. Some say he was kind. He was kind. He knew every porter’s name.',
          'A few say he was right. That the tower was lost anyway. They say it quiet. They say it to me, because I’m the cook.',
          'I don’t bully. You know that. But I want to know if you want their names.',
        ],
        options: [
          {
            id: 'names',
            label: 'Yes. Their names.',
            effects: {
              local: { 'gate-watch': 1 },
              flags: ['juniper-names-given'],
            },
            response:
              'Juniper gives you three names. Then they go back to the pot. The broth is thin that night. Nobody complains.',
          },
          {
            id: 'keep',
            label:
              'No. Let them say it to the cook. Somebody should be able to.',
            effects: { local: { yard: 2 }, flags: ['juniper-names-kept'] },
            response:
              '“Then I keep feeding them.” There is an extra potato in the pot that night. Three bowls get one each.',
          },
        ],
      },
    ],
  },
  // Short talks (t-042).
  {
    id: 'juniper-sugar',
    follower: 'F020',
    title: 'Sugar for a Wedding',
    fromDay: 22,
    requires: { notFlags: IN_THE_TOWER },
    lines: [
      'Juniper is weighing a bag of sugar in one paw and the infirmary’s order slip in the other. Not looking at either.',
      'A Watch sergeant and a Yard porter want to marry. Saturday. The whole Yard’s talking. First good news in a month. They want a cake.',
      'This is the only sugar in the fortress. A spoon of it goes in every fever draught. I’ll bake if you say. I’ll look at the fever beds after. So will you.',
    ],
    options: [
      {
        id: 'cake',
        label: 'Bake the cake. The Yard needs one good Saturday.',
        effects: { local: { yard: 1 }, flags: ['juniper-baked-cake'] },
        response:
          'The cake is lopsided and enormous. The Watch and the Yard dance together in the mud. On Tuesday the fever draughts go out bitter. Two children spit them up. Juniper sits with them.',
      },
      {
        id: 'sick',
        label: 'The sugar stays with the sick.',
        effects: { local: { yard: -1 }, flags: ['juniper-kept-sugar'] },
        response:
          'The wedding has bread and salt. The bride says it’s fine. It is fine. Juniper makes a cake of turnips and honey-water. Nobody eats much of it. They all say thank you.',
      },
    ],
  },
  ...SECRET_TALKS,
]
