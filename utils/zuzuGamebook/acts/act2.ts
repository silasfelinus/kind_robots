import type { Act, Choice } from '../types'
import { CH, s } from '../sections'

/*
 * Act II · Ashes (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5, Book One ch. 2–3).
 * Entry `hollow-bell`; exits `they-follow`, `ending-alone`.
 *
 * Evening: the dead and the song, the dying shopkeeper, the looter, then the siblings under the boardwalk.
 * Night: a vigil at the foot of the bell tower (the shamed looter can come back for the canteen).
 * Noon: the investigation (boots and brass vs black wax and made beds; never settled), the sister at the
 * notices, the bell tower and the view south, and the arch out of town.
 *
 * Flags set here: honor:sang, honor:last-water, taint:false-promise, taint:broke-the-boy, debt:looter (Act IV),
 * looter-shamed, met:looter, clue:raiders, clue:wax, clue:before-the-fire, clue:bell-rang, clue:empty-beds,
 * clue:candle-light, clue:torn-notice, clue:mission-south, sister-trust, siblings-fed.
 */

const toBoardwalk: Choice[] = [
  { id: 'boardwalk', label: 'Go to the boardwalk.', to: 'survivors' },
]

const nightOrRoad: Choice[] = [
  {
    id: 'night',
    label: 'Stay where you are as the night comes down.',
    to: 'a2-vigil',
  },
  {
    id: 'go',
    label: 'Rise slowly and walk out of Hollow Bell.',
    to: 'they-follow',
  },
]

const looterChoices: Choice[] = [
  {
    id: 'break',
    label: 'Take his knife wrist and break his hand.',
    to: 'a2-looter-broken',
    flags: ['taint:broke-the-boy', 'met:looter'],
  },
  {
    id: 'shame',
    label: 'Take the boots back and lace them on the dead while he watches.',
    to: 'a2-looter-shamed',
    flags: ['looter-shamed', 'met:looter'],
  },
  {
    id: 'spare',
    label: 'Let him keep a pair for his feet. Give the rest back to the dead.',
    to: 'a2-looter-spared',
    flags: ['debt:looter', 'met:looter'],
  },
]

/** The morning's ways on, in walking order: each section offers only what lies further along. */
const toWall: Choice = {
  id: 'sister',
  label: 'Find where the sister has gone: the wall of notices.',
  to: 'a2-sister-wall',
}
const toTower: Choice = {
  id: 'tower',
  label: 'Climb the bell tower.',
  to: 'a2-tower',
}
const toArch: Choice = {
  id: 'leave',
  label: 'Walk out under the arch.',
  to: 'a2-leaving',
}
const toHouse: Choice = {
  id: 'house',
  label: 'Walk to the long low house with the small pegs by its door.',
  to: 'a2-wax',
}

export const ACT_II: Act = {
  scenes: [
    // Evening: the dead
    s(
      'a2-song',
      CH.II,
      'The Song for the Dead',
      'hollow-bell',
      'Where you come from, the dead are not left in silence. You stand in the middle of the street with your hat against your chest and sing what your people sing for them: a slow song about a river that forgets its banks and goes, unafraid, to the sea. Your voice is not good. It does not need to be. The words are in a language nobody in this country has ever heard, and the smoke carries them up past the bell tower anyway. When the last note goes, the fire sounds quieter than it did. Under the boardwalk, something small has stopped crying to listen.',
      {
        effects: {
          flag: 'honor:sang',
          attr: { attribute: 'mercy', amount: 1 },
        },
        choices: [
          {
            id: 'scrape',
            label: 'Something scrapes across the planks. Go and see.',
            to: 'a2-looter',
          },
        ],
      },
    ),

    // Evening: the dying shopkeeper
    s(
      'a2-badger',
      CH.II,
      'Water',
      'dying-badger',
      "The voice comes from the back room of the store, behind a curtain half burned away. An old badger sits against the flour sacks in a shopkeeper's apron, his spectacles still on his nose. The fire reached him before it reached the shelves. He does not look at that side of himself, so you do not either. His eyes find the canteen at your hip and stay there. 'Water,' he says. 'Please.' He will not see morning; you both know it. Somewhere outside there are children you have not found yet, and the canteen is not full.",
      {
        choices: [
          {
            id: 'give',
            label: 'Kneel and give him your canteen.',
            to: 'a2-badger-water',
            requires: 'water',
            spend: 'water',
            flag: 'honor:last-water',
          },
          {
            id: 'promise',
            label:
              'Tap the canteen and nod: water, once he has talked. (Shadow · 9)',
            to: 'a2-badger-turned',
            flag: 'taint:false-promise',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'a2-badger-lie',
              failure: 'a2-badger-turned',
            },
          },
          {
            id: 'hold',
            label:
              'Keep the canteen for the children. Hold his paw until it is over.',
            to: 'a2-badger-dies',
          },
        ],
      },
    ),
    s(
      'a2-badger-water',
      CH.II,
      'The Last Water',
      'dying-badger',
      "You hold the canteen to his mouth. He drinks the way the dying drink, too fast, spilling, and then he is still for so long you think it is over. 'The bell rang,' he says. His voice is clearer now. 'Inside the smoke. Nobody at the rope. I heard it.' His paw closes on your sleeve. 'The little ones were gone before. Before the fire. Beds all made.' He says something else, a name perhaps, and then nothing more. You leave the canteen in his paws. It would be a poor thing to take it back.",
      {
        effects: { flags: ['clue:before-the-fire', 'clue:bell-rang'] },
        choices: [
          { id: 'out', label: 'Step out into the street.', to: 'a2-looter' },
        ],
      },
    ),
    s(
      'a2-badger-lie',
      CH.II,
      'A Promise Kept Corked',
      'dying-badger',
      "You tap the canteen and nod. He understands; everyone out here understands that bargain. 'Bell rang,' he says, quick, greedy for the trade. 'Inside the smoke, and nobody at the rope. And the little ones. The little ones were gone before. Before the fire.' He reaches for the canteen. You are still working at the cork, slowly, when his paw falls. His eyes are open and on the water. You close them. It does not help as much as it should, and it will not help later either.",
      {
        effects: {
          flags: ['clue:before-the-fire', 'clue:bell-rang'],
          resolve: -1,
        },
        choices: [
          { id: 'out', label: 'Step out into the street.', to: 'a2-looter' },
        ],
      },
    ),
    s(
      'a2-badger-turned',
      CH.II,
      'He Knows That Look',
      'hb-store',
      "You tap the canteen and nod, and he looks at you a long moment over his spectacles. He has kept a store for forty years; he knows a customer who means to pay from one who does not. He turns his face to the flour sacks. 'Ask the bell,' he says, to the wall and not to you, and that is all he says. You stay until his breathing stops. The canteen at your hip is still full. It weighs more than it did when you came in.",
      {
        effects: { resolve: -1 },
        choices: [
          { id: 'out', label: 'Step out into the street.', to: 'a2-looter' },
        ],
      },
    ),
    s(
      'a2-badger-dies',
      CH.II,
      'What He Gives Instead',
      'dying-badger',
      "You kneel and take his paw instead, and keep the canteen corked for children you have not found. He understands that too. He does not ask again. After a while he presses something into your palm, warm from his apron pocket: a brass shell casing, green at the neck. 'Off my floor,' he whispers. 'Not mine. Never owned a gun.' His breathing grows long and far apart, like a man walking away down a road, and then it stops. You set his spectacles on the counter, where he would look for them.",
      {
        effects: { flag: 'clue:raiders' },
        choices: [
          { id: 'out', label: 'Step out into the street.', to: 'a2-looter' },
        ],
      },
    ),

    // Evening: the looter
    s(
      'a2-looter',
      CH.II,
      'Boots',
      'looter',
      "Between you and the boardwalk where the small sound hides, a young raccoon kneels among the dead. He is working a boot off a dead man's foot. Four more pairs hang round his neck by their laces. His own feet are bare and bleeding from the hot ground. He sees you and pulls a little knife, holding it the way nobody who has ever used one holds it. 'They're dead,' he says, and his voice cracks in the middle. 'They don't need 'em.'",
      {
        choices: [
          {
            id: 'watch',
            label: 'Stay in the smoke and watch him a while first.',
            to: 'a2-looter-watch',
          },
          ...looterChoices,
        ],
      },
    ),
    s(
      'a2-looter-watch',
      CH.II,
      'Before He Sees You',
      'looter',
      "You keep still in the smoke and he forgets you were ever there. He works fast and badly. Before each boot he touches the dead one's shoulder, a quick small touch, and says something you cannot hear. The bundle round his neck is too many boots for one boy; somewhere, then, there are others with bare feet. Once he stops with a boot in his paws and says to the dead man, quite clearly: 'Weren't me. Weren't us. We only come after.' Then he looks up, and sees you.",
      { choices: looterChoices },
    ),
    s(
      'a2-looter-broken',
      CH.II,
      'The Hand',
      'looter',
      'It is quick, the way the things you were taught are quick. The knife falls. The sound he makes is very young. He runs into the smoke holding his hand against his chest like something he has been given to carry, the boots round his neck thumping as he goes. You lace them back onto the dead. It is the right thing to do with them, and your paws are steady doing it. That is the part you will remember. Under the boardwalk, nothing breathes. Whoever is hiding there saw.',
      { choices: toBoardwalk },
    ),
    s(
      'a2-looter-shamed',
      CH.II,
      'Lace by Lace',
      'looter',
      'You lift the boots from round his neck and he lets you; his knife was never going to be any use. Then you kneel and put them back on the dead, one pair at a time, lacing each one properly, while he stands and watches. It takes a long while. You make him watch all of it. When you finish he walks off barefoot toward the dark end of the street, leaving small red prints. At the edge of the firelight he looks back once, and it is a face that will remember yours.',
      { choices: toBoardwalk },
    ),
    s(
      'a2-looter-spared',
      CH.II,
      'One Pair',
      'looter',
      "You lift the bundle from his neck and choose a pair his size, plain and scuffed, from a dead man whose feet are already crossed. You set them in front of him. The rest you lace back onto their owners. He watches with his knife still out, forgotten. Then he pulls the boots on fast, before you can change your mind. At the arch he stops. 'Jackals from the dry well,' he says. 'They'll come for what's left. Don't be here.' He is gone before you can nod.",
      { choices: toBoardwalk },
    ),

    // Night: the first inch of trust
    s(
      'a2-hum',
      CH.II,
      'A Song Through the Planks',
      'siblings',
      "You sit down in the street a good way off, take off your hat, and hum the song again without its words, as if it were only for the dead. The sister's lip stays curled over her teeth. But the toddler's ears come round toward the sound like two small cups, and she lets them. She does not pull his head back against her. When you stop there is a long quiet, then a small hoarse sound from the toddler that might be the first note, wrong, and the sister hushes him without any anger at all.",
      { effects: { flag: 'sister-trust' }, choices: nightOrRoad },
    ),
    s(
      'a2-linen',
      CH.II,
      'Clean Linen',
      'siblings',
      'You unroll the linen, lay it on the planks within reach of her raw wrists, and walk to the far side of the street. You do not watch. That is the gift as much as the cloth. When you look again, much later, the rags on her wrists are gone and clean white is wound there instead, knotted with her teeth. The old rags lie on the planks where the linen was, folded very small. You understand that this is not thanks. It is a debt, set down where you can see it.',
      { effects: { flag: 'sister-trust' }, choices: nightOrRoad },
    ),
    s(
      'a2-back',
      CH.II,
      'Your Back to Them',
      'siblings',
      'You sit in the warm ash with your back to the boardwalk and your sword where a hand could reach it. It is the most foolish thing you have done in this country, and you do it on purpose. Time passes. The fire settles. Then something tugs at your poncho, very lightly: a small paw, curious, and a babble at your shoulder. There is a scramble and a hiss and he is snatched away. But she does not run, and you hear her sit down again, closer than before.',
      { effects: { flag: 'sister-trust' }, choices: nightOrRoad },
    ),
    s(
      'a2-walk-away',
      CH.II,
      'Within Her Reach',
      'shuttered-town',
      'You set it on the planks, within her reach, and step back, and keep stepping. You do not look round. Behind you there is a rush of movement and then nothing, the kind of nothing that is listening. At the end of the street the last light is going. The road east will be cold and black within the hour. The foot of the bell tower is out of the wind, and from there you could see the boardwalk all night long.',
      {
        choices: [
          {
            id: 'go',
            label: 'Keep walking. Leave Hollow Bell tonight.',
            to: 'they-follow',
          },
          {
            id: 'stay',
            label:
              'Sit down at the foot of the bell tower and wait for daylight.',
            to: 'a2-vigil',
          },
        ],
      },
    ),

    // Night: the vigil
    s(
      'a2-vigil',
      CH.II,
      'The Bell at Night',
      'zuzu-fire',
      'You build a small fire at the foot of the bell tower from what the big fire left. It is a strange thing, to warm your paws over a town. Across the street, under the boardwalk, two pairs of eyes catch the light and go out again. Toward the darkest hour you feel the tower move against your back: the long, slow lean of a bell swinging overhead. You look up. No sound comes. The bell hangs still in the dark, and the rope beside you has burned through a yard above your head.',
      {
        choices: [
          {
            id: 'sleep',
            label:
              'Close your eyes. Sleep sitting up, sword across your knees.',
            to: 'a2-noon',
            heal: 2,
          },
          {
            id: 'watch',
            label: 'Keep your eyes on the street until dawn. (Sense · 9)',
            to: 'a2-noon',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a2-candle',
              failure: 'a2-noon',
            },
          },
          {
            id: 'step',
            label: 'Turn toward the soft step behind the tower.',
            to: 'a2-looter-night',
            needs: 'looter-shamed',
            hint: 'Nothing in the dark has a reason to come for you.',
          },
        ],
      },
    ),
    s(
      'a2-candle',
      CH.II,
      'A Light at the Doors',
      'zuzu-moon',
      "Near dawn a light comes along the far end of the street: candle-coloured, low, carried at about the height of a child's head. It stops at each door the way someone stops to read a number, a long moment, and moves on to the next. It does not stop at the boardwalk. You stand, and it is not there; there is no moment when it goes out. In the grey morning you walk the street. On three thresholds there are fresh drips of black wax, still soft enough to take a claw mark.",
      {
        effects: { flag: 'clue:candle-light' },
        choices: [{ id: 'sun', label: 'Wait for the sun.', to: 'a2-noon' }],
      },
    ),
    s(
      'a2-looter-night',
      CH.II,
      'The Barefoot Boy',
      'looter',
      'A step, soft, behind the tower. You know him before you see him: the raccoon, still barefoot, his little knife held properly now, as if he spent the evening practising. His eyes go to your canteen and your pack and then to your face, and you see that he has decided something about you. He comes in low and fast. You do not draw. The blade is drawn to be used, and you will not use it on him. That leaves your paws, his knife, and the dark.',
      {
        battle: {
          name: 'The Barefoot Boy',
          hp: 6,
          guard: 1,
          attack: 2,
          win: 'a2-looter-disarmed',
          lose: 'a2-looter-cut',
        },
      },
    ),
    s(
      'a2-looter-disarmed',
      CH.II,
      'His Wrist in Your Paw',
      'looter',
      "You have his wrist, and then you have his knife, and then he is sitting in the ash with his arms over his head, waiting for whatever you did to the dead men's boots to be done to him. He is crying without any noise. Across the street, under the boardwalk, two pairs of eyes are watching to see what you are. The knife is a poor thing, a kitchen blade with the edge ground thin from too much sharpening and too little to cut.",
      {
        choices: [
          {
            id: 'return',
            label:
              'Give back his knife, and a pair of boots from the dead. Let him go.',
            to: 'a2-noon',
            flags: ['debt:looter'],
          },
          {
            id: 'keep',
            label: 'Keep the knife. Point him at the dark.',
            to: 'a2-noon',
          },
          {
            id: 'break',
            label: 'Break the hand that held it.',
            to: 'a2-noon',
            flags: ['taint:broke-the-boy'],
          },
        ],
      },
    ),
    s(
      'a2-looter-cut',
      CH.II,
      'Grey Morning',
      'zuzu-bandage',
      'You wake to grey light and the smell of cold ash, lying on your side with your forearm stiff and wet. He opened it to the edge of the bone, and then, it seems, he could not bring himself to do the rest. Your pack is turned out on the ground; he ran before he could take much. Someone has pressed a rag to the cut while you lay there and tied it with a knot made by teeth. There is no one in sight. The boardwalk is very quiet.',
      {
        effects: { heal: 4, resolve: -1 },
        choices: [{ id: 'up', label: 'Get up.', to: 'a2-noon' }],
      },
    ),

    // Noon: the investigation
    s(
      'a2-noon',
      CH.II,
      'Hollow Bell at Noon',
      'hb-noon',
      "By noon nothing is burning. In daylight Hollow Bell looks less like a massacre than a town that has stepped out for a moment: doors standing open, a broom against a wall, washing on a line, scorched brown. The bell tower stands at the far end of the street with its rope hanging short. The siblings have not left. Now and then you catch the sister at the edge of your eye, in a doorway's shade with the toddler on her hip, always a thrown stone away. Whoever did this left marks. So did the fire.",
      {
        choices: [
          {
            id: 'tracks',
            label: 'Read the street for whoever did this. (Sense · 9)',
            to: 'a2-tracks',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a2-tracks-close',
              failure: 'a2-tracks',
              bonus: { flag: 'clue:before-the-fire', amount: 2 },
            },
          },
          toHouse,
          {
            id: 'sister',
            label: 'Follow the sister to the wall of notices.',
            to: 'a2-sister-wall',
          },
          toTower,
          toArch,
        ],
      },
    ),
    s(
      'a2-tracks',
      CH.II,
      'Boots and Brass',
      'hb-noon',
      'Boot prints everywhere in the ash: big ones, hobnailed, a dozen pairs or more, coming in off the west road in a crowd and spreading out door to door. By the water trough lies a scatter of brass shell casings, green at their necks. Somebody fired a great many shots here, quickly. You have seen enough of this country to know what it looks like when raiders take a town. This looks like that. You tell yourself so twice, and do not know why you need to.',
      {
        effects: { flag: 'clue:raiders' },
        choices: [toHouse, toWall, toTower, toArch],
      },
    ),
    s(
      'a2-tracks-close',
      CH.II,
      'Under and Over',
      'hb-noon',
      'The boot prints come in off the west road in a crowd, hobnailed, a dozen pairs or more. Shell casings lie by the trough in a neat little heap, as though someone emptied a cylinder there and reloaded, unhurried. But you look closer, and the prints do not agree with each other. Some are pressed into the ash. Some lie under it, softened, older than the fire. You crouch over them a long while. You cannot tell which came first to Hollow Bell, the boots or the burning, and nothing here will tell you.',
      {
        effects: { flag: 'clue:raiders' },
        choices: [toHouse, toWall, toTower, toArch],
      },
    ),
    s(
      'a2-wax',
      CH.II,
      'Black Wax',
      'candle-wax',
      "At the end of the street stands a long low house with a row of small pegs by its door, set at the height of a child's shoulder. Every peg is empty. The house did not burn; the fire went round it as if it had been asked to. On the threshold someone has dripped black wax, a great deal of it, in one place, the way wax gathers when a person stands a long time holding a candle and waiting to be let in. You have never seen a black candle. You do not think anyone in this town had either.",
      {
        effects: { flag: 'clue:wax' },
        choices: [
          {
            id: 'inside',
            label: 'Step over the wax and go in.',
            to: 'a2-beds',
          },
          toWall,
          toTower,
          toArch,
        ],
      },
    ),
    s(
      'a2-beds',
      CH.II,
      'Every Bed',
      'empty-cot',
      'Inside, two rows of small cots. Every one is empty, and every one is made: blankets folded back neatly, as if for children about to climb in, pillows plumped, shoes paired under the frames. No blood. No sign that anyone fought anything. On one pillow a stitched cloth doll lies face up, the only thing in the room anyone left behind, and that seems wrong in a way you cannot name. Whatever happened in this house, it did not happen in a hurry. You go out backward, the way you would leave a shrine.',
      {
        effects: { flag: 'clue:empty-beds' },
        choices: [toWall, toTower, toArch],
      },
    ),

    // Noon: the sister at the notices
    s(
      'a2-sister-wall',
      CH.II,
      'Her Paw on the Wall',
      'names-wall',
      'The sister stands at the wall of old notices with the toddler on her hip. She is not reading; you are not sure she can. She has her paw flat against one sheet, over the face, the way you might lay a paw on a sleeping animal to feel it breathe. She hears you and turns, teeth bared, her body between you and her brother. But she does not take her paw off the wall, and she does not run.',
      {
        choices: [
          {
            id: 'water',
            label: 'Set your canteen at the foot of the wall and walk away.',
            to: 'a2-sister-water',
            requires: 'water',
            spend: 'water',
            flag: 'siblings-fed',
          },
          {
            id: 'look',
            label: 'Step closer, to see whose face it is.',
            to: 'a2-sister-snarl',
          },
          {
            id: 'tower',
            label: 'Leave her the wall. Climb the bell tower.',
            to: 'a2-tower',
          },
          toArch,
        ],
      },
    ),
    s(
      'a2-sister-water',
      CH.II,
      'At the Foot of the Wall',
      'siblings',
      'You set the canteen in the dust at the foot of the wall, walk to the trough, and sit there with your back half turned. She waits until she is sure. Then she crouches, pulls the cork with her teeth, and drinks first: one swallow, and then she waits, watching you, to see whether it will hurt her. Only then does she hold it to her brother. When she sets it down she looks at you over it, straight, without showing her teeth. It lasts one breath. It is something.',
      {
        effects: { flag: 'sister-trust' },
        choices: [toTower, toArch],
      },
    ),
    s(
      'a2-sister-snarl',
      CH.II,
      'Not Yours',
      'posters-boardwalk',
      'You take one step and she tears the notice down. She folds it one-pawed, fast and small, and pushes it into the front of her dress, and snarls at you with her ears flat, a real snarl, the toddler wailing on her hip. You saw the face for only a breath. Faded ink. Enormous ears. It could have been anyone. She backs down the boardwalk into its dark end and does not come out again while you are near. Whatever that face was, it is not yours to know. Not yet.',
      {
        effects: { flag: 'clue:torn-notice' },
        choices: [toTower, toArch],
      },
    ),

    // Noon: the bell tower
    s(
      'a2-tower',
      CH.II,
      'The Ladder',
      'bell-tower',
      'The stair inside the tower has burned, but a ladder runs up the outside, its rungs blackened, a few gone altogether. At the top, under a timber canopy, the bell hangs over the town with its rope burned short. The wood ticks as it cools in the sun. From up there you would see a long way in every direction. You are not sure every rung will hold a koala, and there is no one to catch you but a girl who would rather you fell.',
      {
        choices: [
          {
            id: 'climb',
            label: 'Climb the charred ladder. (Steel · 9)',
            to: 'a2-tower-fall',
            check: {
              attribute: 'steel',
              target: 9,
              success: 'a2-bell-view',
              failure: 'a2-tower-fall',
            },
          },
          {
            id: 'down',
            label: 'Leave the tower. Walk out under the arch.',
            to: 'a2-leaving',
          },
        ],
      },
    ),
    s(
      'a2-tower-fall',
      CH.II,
      'The Rung Gives',
      'zuzu-bandage',
      'Three rungs from the top, a rung turns to charcoal in your paw. You fall the height of a door, hit the boardwalk hard, and lie looking up at the bell with your breath knocked somewhere far away. When it comes back, the first thing you hear is a sound from the shade of the doorway across the street: a small sharp breath, quickly stopped, as if someone had nearly called out and caught herself just in time.',
      {
        effects: { hurt: 2 },
        choices: [
          {
            id: 'again',
            label: 'Climb again, slower, testing every rung.',
            to: 'a2-bell-view',
          },
          toArch,
        ],
      },
    ),
    s(
      'a2-bell-view',
      CH.II,
      'From the Bell',
      'bell-view',
      'Up under the canopy everything is warm to the touch from the fire: the beams, the rail, the nails. Everything but the bell. You lay your paw on it and it is cold as well water, and you take your paw away. From here the waste runs out in every direction, brown and white. Far to the south, in the heat haze, stands another tower, thin and pale and alone. And across the flat between, straight as a drawn line, runs a row of small tracks. A great many small tracks. No large ones that you can see.',
      {
        effects: { flag: 'clue:mission-south' },
        choices: [{ id: 'down', label: 'Climb down.', to: 'a2-leaving' }],
      },
    ),

    // The arch
    s(
      'a2-leaving',
      CH.II,
      'Under the Arch',
      'dust-road',
      'The arch sign over the east road hangs by its one chain, turning a little in the hot wind, showing you the name of the town and then its blank back, and then the name. Beyond it the road goes out into the waste. Behind you, in the shade of the last doorway, the sister stands with her brother on her hip and watches what you will do. She has nowhere to go that you know of. Neither, out here, do you.',
      {
        choices: [
          {
            id: 'go',
            label: 'Walk out under the arch and do not look back.',
            to: 'they-follow',
          },
          {
            id: 'post',
            label: 'Look at what hangs from the arch post.',
            to: 'a2-gift',
            needs: 'debt:looter',
            hint: 'Nobody in this town owes you anything.',
          },
          {
            id: 'alone',
            label:
              'Leave by the back of town, alone. You cannot save everyone.',
            to: 'ending-alone',
          },
        ],
      },
    ),
    s(
      'a2-gift',
      CH.II,
      'Left on the Arch Post',
      'dust-road',
      'Hung from a nail on the arch post, where nothing hung when you came in, is a water skin, full and still cold from the night. Scratched into the post beside it, fresh, is a little mask: two dark eyes in a band, the mark a boy makes who cannot write his name. Nothing else. No one in sight. You take it down. Out here a debt can be paid in water. It can also be only the first payment, and you do not yet know which.',
      {
        effects: { gain: 'water' },
        choices: [
          { id: 'go', label: 'Walk out under the arch.', to: 'they-follow' },
        ],
      },
    ),
  ],

  extend: {
    'hollow-bell': [
      {
        id: 'voice',
        label: 'Answer the voice croaking for water inside the store.',
        to: 'a2-badger',
      },
    ],
    'hb-dead': [
      {
        id: 'sing',
        label: 'Sing what your people sing for the dead.',
        to: 'a2-song',
      },
    ],
    'hb-store-find': [
      {
        id: 'back',
        label: 'Follow the rasp of breathing to the back room.',
        to: 'a2-badger',
      },
    ],
    'hb-store-empty': [
      {
        id: 'back',
        label: 'Follow the rasp of breathing to the back room.',
        to: 'a2-badger',
      },
    ],
    survivors: [
      {
        id: 'hum',
        label: 'Hum the song for the dead, low, as though to no one.',
        to: 'a2-hum',
        needs: 'honor:sang',
        hint: 'You have not sung for anyone here.',
        unless: 'taint:broke-the-boy',
      },
      {
        id: 'linen',
        label: 'Lay clean linen on the planks for her raw wrists. Walk away.',
        to: 'a2-linen',
        requires: 'bandage',
        spend: 'bandage',
      },
      {
        id: 'back',
        label: 'Sit down in the ash with your back to them. (Mercy · 9)',
        to: 'a2-vigil',
        check: {
          attribute: 'mercy',
          target: 9,
          success: 'a2-back',
          failure: 'a2-vigil',
          bonus: { flag: 'honoured-dead', amount: 1 },
        },
      },
    ],
    'sister-trust': [
      {
        id: 'stay',
        label: 'Sit down at the foot of the bell tower and wait for daylight.',
        to: 'a2-vigil',
      },
    ],
  },

  reroute: {
    // Every way to the boardwalk now passes the boy stripping the dead (the shipped `search` still goes straight there).
    'hb-dead/sound': 'a2-looter',
    'hb-notices/sound': 'a2-looter',
    'hb-store-find/sound': 'a2-looter',
    'hb-store-empty/sound': 'a2-looter',
    // Leaving food or water in reach and walking away (Book One ch. 3) now opens onto the night in town.
    'survivors/feed': 'a2-walk-away',
    'survivors/canteen': 'a2-walk-away',
  },
}
