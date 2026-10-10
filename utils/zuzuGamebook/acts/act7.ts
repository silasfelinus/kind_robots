import type { Act } from '../types'
import { CH, s } from '../sections'

/**
 * Act VII · The Night Road (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5; the run of Book One ch. 8).
 * Entry `run-back`; exit `mission-night` (directly, or through the shipped `run-late` and `coyote-return`).
 *
 * The road shifts in the dark. Three ways through: the thin-place cut through the black rocks (in time, and it
 * marks you: `taint:thin-road`, and something follows you out), the long way round (the shipped `run-late`,
 * which sets `late`), or a guide who repays an old debt (Old Ash with the `feather` sets `witch-guide`; Hollis's
 * band with `debt:raider-mother` sets `ally-raiders`; the shipped coyote sets `ally-coyote`). If Dustwater's
 * torches are on the road (`mob-coming`, Act VI) Zuzu can turn the town round (`mob-held`,
 * `honor:held-the-mob`), at the cost of the hour that the honest guides would have saved.
 * Flags set here: `taint:thin-road`, `taint:thin-gift`, `ally-raiders`, `witch-guide`, `mob-held`,
 * `honor:held-the-mob`, `honor:sent-them-home`, `honor:repaid-the-cup`, `clue:something-followed`.
 */
export const ACT_VII: Act = {
  scenes: [
    // The first mile
    s(
      'a7-first-mile',
      CH.VII,
      'The First Mile',
      'zuzu-moon',
      'You find the stride your old sword-master beat into you on mountain roads: long and low, a breath on every fourth step. The moon comes up behind your shoulder, huge and the colour of bone, and the road lies white under it. The miles you walked by day go past like fence rails. The dead tree where you rested at noon. A cairn of stones. The dry wash where you stopped this morning to look back at the bell tower, and told yourself not to. You are making time. For an hour you almost believe you will be there before the chanting starts. Then the wind drops, all at once, as if a door had closed somewhere, and the only sound left in the world is your own breathing.',
      {
        choices: [
          {
            id: 'on',
            label: 'Run on, and do not look back.',
            to: 'a7-road-shifts',
          },
          {
            id: 'look',
            label: 'Stop on the rise and look back toward Dustwater.',
            to: 'a7-torches',
            needs: 'mob-coming',
            unless: 'mob-held',
            hint: 'Behind you the road is dark all the way to Dustwater.',
          },
        ],
      },
    ),
    s(
      'a7-stumble',
      CH.VII,
      'Stones in the Dark',
      'zuzu-bandage',
      'In the first mile a stone turns under your foot and you go down hard, chin and paws, and the scabbard cracks against the back of your skull. For a moment you lie with your cheek on the cold ground and the stars swinging. The pad of your left paw is torn open. It will bleed with every step from here to the mission. Somewhere ahead, a long way ahead, two children are being tucked into bed by kind paws. You get up. The moon is rising now, the colour of bone, and the road is white under it, and for a while that is all there is: the road, the moon, the slap of your feet, the blood.',
      {
        effects: { hurt: 2 },
        choices: [
          {
            id: 'bind',
            label: 'Bind the paw with your bandage as you run.',
            to: 'a7-road-shifts',
            requires: 'bandage',
            spend: 'bandage',
            heal: 2,
          },
          {
            id: 'on',
            label: 'Leave it. Run.',
            to: 'a7-road-shifts',
          },
          {
            id: 'look',
            label: 'Stop on the rise and look back toward Dustwater.',
            to: 'a7-torches',
            needs: 'mob-coming',
            unless: 'mob-held',
            hint: 'Behind you the road is dark all the way to Dustwater.',
          },
        ],
      },
    ),

    // Dustwater's torches
    s(
      'a7-torches',
      CH.VII,
      'Torches on the Road',
      'torch-mob',
      "Dustwater is coming. A long river of torches is pouring out of the town and down the mission road, two hundred lights at least, swinging as they walk. Even from here you can hear them, a low sound like surf on stones. Somewhere at the head of it is a rabbit with a scattergun and her son's name in her mouth. They are slower than you. They will not stop. Fire does not ask which window a child is sleeping behind. If you run, you may reach the children before the torches do. If you go back down to them, you might turn a whole town around. You cannot do both.",
      {
        choices: [
          {
            id: 'race',
            label: 'Run. Reach the children before the fire does.',
            to: 'a7-road-shifts',
          },
          {
            id: 'stand',
            label:
              'Go back down and stand in the road in front of them. (Mercy · 9)',
            to: 'a7-torches-pass',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a7-torches-held',
              failure: 'a7-torches-pass',
              bonus: { flag: 'met:mags', amount: 2 },
            },
          },
        ],
      },
    ),
    s(
      'a7-torches-held',
      CH.VII,
      'A Line in the Road',
      'torch-mob',
      'You walk back down and stand in the middle of the road, and you do not draw. The torches come on until the front of them is a wall of heat and faces. Mags stops a sword\'s length away. You point up the road, toward the mission. You hold your paw flat at the height of a child, then lower, at the height of a smaller one. Then you look at the torches, and shake your head. For a long moment nothing happens. Then Mags lowers the scattergun. "Sunup," she says. "Bring them out by sunup, stranger, or we burn it with you in it." The torches stop. The hour it took is gone. Ahead, the road runs into black rocks that were not there this morning.',
      {
        effects: { flags: ['mob-held', 'honor:held-the-mob'] },
        choices: [
          {
            id: 'long',
            label: 'Run the long way round the rocks, and pray it is enough.',
            to: 'a7-long-way',
          },
          {
            id: 'rocks',
            label:
              'Cut through the black rocks: the only road left fast enough.',
            to: 'a7-black-rocks',
          },
        ],
      },
    ),
    s(
      'a7-torches-pass',
      CH.VII,
      'Fire Does Not Stop',
      'torch-mob',
      'You stand in the road, and the road does not care. The front of the crowd sees a small grey stranger with a sword and does not slow. A shoulder takes you in the chest. A boot. A torch swings past your face so close you smell your own fur singe. Mags goes by without looking at you, her jaw set like a trap. When the last of them has passed you are on your knees in the dust behind two hundred lights, and they are between you and the children now. Up ahead, where the road should run straight, it runs into black rocks that were not there this morning.',
      {
        effects: { hurt: 1 },
        choices: [
          {
            id: 'long',
            label: 'Run the long way round the rocks.',
            to: 'a7-long-way',
          },
          {
            id: 'rocks',
            label: 'Cut through the black rocks, ahead of the fire.',
            to: 'a7-black-rocks',
          },
        ],
      },
    ),

    // The shift
    s(
      'a7-road-shifts',
      CH.VII,
      'The Land Is Not Where It Was',
      'shifting-road',
      'The road ends. It does not fade or fork; it ends, at a wall of black rock that was not here this morning. The rocks shine under the moon like wet glass. The ridge the mission sits behind, which was ahead of you, is off to your left. The dead tree you rested under stands on the wrong side of the road. And in the dust at your feet are footprints, small and round and sandal-soft: your own, from this morning, walking out of the black rocks toward Dustwater. You never went into the rocks. You are certain of that. The air is very still, and it tastes of lightning.',
      {
        choices: [
          {
            id: 'rocks',
            label: 'Follow your own footprints into the black rocks.',
            to: 'a7-black-rocks',
          },
          {
            id: 'ridge',
            label:
              'Climb the ridge and find where the true road went. (Sense · 9)',
            to: 'a7-lost',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a7-high-ground',
              failure: 'a7-lost',
            },
          },
          {
            id: 'feather',
            label: "Hold the witch's feather to your eye and look at the land.",
            to: 'a7-feather-road',
            needs: 'feather',
            hint: 'You carry nothing that shows the world as it is.',
          },
          {
            id: 'voice',
            label:
              'Turn toward the voice behind you that finishes your thought.',
            to: 'a7-ash-knows',
            needs: 'taint:blood',
            hint: 'Nobody out here knows where you are.',
          },
          {
            id: 'paws',
            label: 'Listen to the paws drumming out of the dark behind you.',
            to: 'a7-hollis-band',
            needs: 'debt:raider-mother',
            hint: 'Behind you there is only wind, and nobody who owes you anything.',
          },
        ],
      },
    ),

    // The thin road
    s(
      'a7-black-rocks',
      CH.VII,
      'The Black Rocks',
      'shifting-road',
      "Between the rocks the ground is smooth and flat and takes no prints at all, except your own from this morning, going the other way. The moon finds the rocks, and they light from inside like a river of black glass, every face of them holding a small cold moon of its own. It is the most beautiful thing you have seen since you came to this country, and you hate it, because it is beautiful the way a snake's back is beautiful. Ahead, a path runs between the rocks, perfectly straight. Nothing in this world makes a line that straight. At the end of it you can feel the mission, close, closer than it has any right to be.",
      {
        choices: [
          {
            id: 'path',
            label: 'Step onto the straight path.',
            to: 'a7-thin-walk',
            flag: 'taint:thin-road',
          },
          {
            id: 'back',
            label:
              'Back out of the rocks while you still know which way is back.',
            to: 'a7-turn-back',
          },
        ],
      },
    ),
    s(
      'a7-thin-walk',
      CH.VII,
      'The Straight Path',
      'shifting-road',
      'Under the dust the path is stone, laid in slabs too big for any paw to have set, so old the joins are only lines. Your feet make no sound on it. Your heart makes no sound. A few strides in, you hear footsteps behind you, a beat late, keeping pace exactly: yours, arriving after you have taken them. The stars over the rocks do not move. A cold comes up through your soles and into your knees, and it is not unpleasant, and that is the worst thing about it. Somewhere in the rocks to your left something is speaking, very low, the way stone would speak if it had all the time in the world.',
      {
        choices: [
          {
            id: 'walk',
            label: 'Keep your eyes on the path, and walk.',
            to: 'a7-thin-out',
          },
          {
            id: 'listen',
            label: 'Stop, and listen to what is speaking.',
            to: 'a7-thin-voice',
          },
        ],
      },
    ),
    s(
      'a7-thin-voice',
      CH.VII,
      'What the Rocks Say',
      'stone-face',
      'The voice does not come from any one rock; it comes from all of them, the way cold comes off water. It uses no words, and you understand it anyway. It knows how long you have been running. It knows the torn paw, the bruised ribs, the old ache in your shoulder that you carried here from a country it should not know. It is sorry. It can take all of that away. There is no price, it says, and the part of you that has never once been wrong about a lie tells you it is the truth. The gift is real. That is the trouble with it.',
      {
        choices: [
          {
            id: 'take',
            label: 'Let the cold take the pain out of you.',
            to: 'a7-thin-out',
            heal: 6,
            flag: 'taint:thin-gift',
          },
          {
            id: 'refuse',
            label: 'Bite your tongue until it bleeds, and walk on.',
            to: 'a7-thin-out',
          },
        ],
      },
    ),
    s(
      'a7-thin-out',
      CH.VII,
      'Something Follows You Out',
      'bone-valley',
      'The rocks end the way they began, all at once, and you are standing on the mission road with the adobe wall a short run ahead and the moon still high. Hours early. Hours you did not run. You look back. There are no black rocks behind you, only the plain and the white road running away toward Dustwater. But on the road, as you watch, footprints are arriving. One, then another, small and round and sandal-soft, walking toward you out of nothing, a beat behind, the way yours did between the rocks. They stop where you stopped. Nothing stands in them. The wind does not touch them.',
      {
        effects: { flag: 'clue:something-followed' },
        choices: [
          {
            id: 'wall',
            label: 'Over the wall, before whatever it is catches up.',
            to: 'mission-night',
          },
        ],
      },
    ),
    s(
      'a7-turn-back',
      CH.VII,
      'Which Way Is Back',
      'dust-road',
      'You back out of the rocks one step at a time, the way you would back away from a bear, and you do not turn round until the glassy light has gone from the corners of your eyes. The road you came in on is not there. Nor is the cairn, nor the dead tree. There is only the plain, and the dark bulk of the rocks, and far off beyond them the ridge where the mission has to be. There is one honest way left: round the rocks, the long way, on legs that have already begun to shake.',
      {
        choices: [
          {
            id: 'long',
            label: 'Run the long way round.',
            to: 'a7-long-way',
          },
        ],
      },
    ),

    // Finding the road
    s(
      'a7-high-ground',
      CH.VII,
      'From the Ridge',
      'zuzu-alone',
      "You climb the ridge on all fours, the rock still warm from the day. From the top the whole country lies under the moon, and you see what the dark has done. The road is there, the real road, white and patient; it never moved. It is the land that moved, folding in round the road like a cloth pulled tight, and in the fold lie the black rocks, shining, with a line drawn straight through them like a cut. The road goes the long way round, miles of it. The cut runs straight to the mission's dark tower. Both ways are true. Only one of them is honest.",
      {
        effects: { resolve: 1 },
        choices: [
          {
            id: 'road',
            label: 'Take the road, the long way round.',
            to: 'a7-long-way',
          },
          {
            id: 'cut',
            label: 'Go down into the cut through the black rocks.',
            to: 'a7-black-rocks',
          },
        ],
      },
    ),
    s(
      'a7-lost',
      CH.VII,
      'The Rocks Come to Meet You',
      'shifting-road',
      'The ridge is further than it looked, and then it is not there at all. You climb a slope and come down it into a gully you climbed out of an hour ago; you know it by a split stone. You put the moon on your left shoulder and run, and when you stop, gasping, it is on your right. Twice you pass the same dead tree. The third time it stands at the edge of the black rocks, and the rocks are close, much closer than before, as if they had come out to meet you. A straight path opens between them like a paw held out.',
      {
        effects: { hurt: 1 },
        choices: [
          {
            id: 'rocks',
            label: 'Take the path. Whatever it costs, it is fast.',
            to: 'a7-black-rocks',
          },
          {
            id: 'long',
            label: 'Turn your back on the rocks and run the long way round.',
            to: 'a7-long-way',
          },
        ],
      },
    ),

    // The long way
    s(
      'a7-long-way',
      CH.VII,
      'The Long Way Round',
      'dust-road',
      'The long way is only road. That is its mercy and its cruelty: no wonders, no voices, just miles. The black rocks shine off to your right for an hour, keeping pace, then fall behind. Your breath saws. Your pads are bleeding. You count strides to a hundred and start again, and somewhere in the counting you stop thinking about anything but the next hundred. The moon climbs past the top of the sky and starts down the other side. You watch it go. Every handspan it falls is a door closing somewhere in the mission.',
      {
        choices: [
          {
            id: 'run',
            label: 'Run.',
            to: 'a7-cup-on-post',
          },
          {
            id: 'race',
            label: 'Race the torches you can see on the road ahead of you.',
            to: 'a7-torches-ahead',
            needs: 'mob-coming',
            unless: 'mob-held',
            hint: 'The road ahead is dark and empty all the way to the mission.',
          },
        ],
      },
    ),
    s(
      'a7-torches-ahead',
      CH.VII,
      'Lights Ahead',
      'torch-mob',
      'You top a rise and the torches are ahead of you. While you ran the long way round, Dustwater took the straight road, and now a river of fire is winding up toward the mission ridge, between you and the children, singing something you cannot make out. You run until your sight goes grey at the edges. You gain on them. You do not gain enough. The last light goes over the ridge while you are still on the flat, and then the glow is all there is: a smudge of orange on the dark, getting brighter.',
      {
        effects: { resolve: -1 },
        choices: [
          {
            id: 'run',
            label: 'Keep running.',
            to: 'a7-cup-on-post',
          },
        ],
      },
    ),
    s(
      'a7-cup-on-post',
      CH.VII,
      'A Cup on a Fence Post',
      'camp',
      'A homestead comes up out of the dark: a sod roof, a dead garden, a rail fence leaning. No light in the window. Whoever lives here is asleep, or gone. On the last post of the fence someone has set a tin cup with a flat stone on top to keep out the dust, and under the stone the cup is full. Not for anyone. For whoever comes. You stand with your chest heaving and look at it for longer than you can spare. Nobody in this country has anything to give, and someone has given this, every night perhaps, to strangers they will never see. Above the roof the stars lie thick as spilled salt.',
      {
        choices: [
          {
            id: 'repay',
            label: 'Drink, and leave your apple under the stone in its place.',
            to: 'run-late',
            requires: 'apple',
            spend: 'apple',
            heal: 3,
            flag: 'honor:repaid-the-cup',
          },
          {
            id: 'drink',
            label: 'Drink, set the stone back, and run on.',
            to: 'run-late',
            heal: 3,
          },
        ],
      },
    ),

    // Old Ash
    s(
      'a7-feather-road',
      CH.VII,
      'Through the Feather',
      'crow-witch',
      'You hold the black feather to your eye. Through its vane the world goes grey and very sharp, and the black rocks are not there. There is only the plain, and the road running through it straight and white as it always did, with a skin of something laid over it like oil on water, wrinkling. A mile up the true road, on a fence post where there is no fence, sits a crow in a coat of rags. She lifts one wing and points with it, toward the mission. "Paid is paid," she calls, as you run past with the feather held to your eye. She turns her head to watch you all the way by.',
      {
        effects: { flag: 'witch-guide' },
        choices: [
          {
            id: 'run',
            label: 'Run the road she shows you.',
            to: 'a7-wall-in-time',
          },
        ],
      },
    ),
    s(
      'a7-ash-knows',
      CH.VII,
      'She Always Knows',
      'crow-witch',
      'Behind you, close, someone finishes the thought you were having. "Too far," says the voice, "and too late. Not yet, though." A fence post stands at your shoulder where there was no fence, and on it sits Old Ash, her rags stirring in no wind, her milky eyes on you. You did not call her. Your thumb, where she pricked it, has begun to bleed again. "Told you I\'d always know where you are," she says. "Your girl has chewed through one rope. Not the other. The little one is asleep. That\'s a mercy, tonight." She lifts a wing and points, and the black rocks fold back from the road like a curtain. "Run. I\'m not the only one knows where you are now."',
      {
        effects: { flag: 'witch-guide' },
        choices: [
          {
            id: 'run',
            label: 'Run where she points, and do not look at her again.',
            to: 'a7-wall-in-time',
          },
        ],
      },
    ),

    // Hollis's band
    s(
      'a7-hollis-band',
      CH.VII,
      'Out of the Dark, Running',
      'dry-well',
      'Paws, many of them, drumming the hard ground behind you. You turn with your paw on the hilt. Out of the dark come jackals, a dozen, running low, and at their head a grey one you know. Hollis pulls up a sword\'s length away, panting. "Scouts saw you go by Dustwater like your tail was alight," she says. "Figured where you were headed. That house in the south." She spits. "I\'d have sold it your girl, once. I been thinking on that." She jerks her chin up the road. "Land\'s gone strange tonight. Rocks where there weren\'t rocks. Road through the rocks is ours, even those. We know where they bite. Eleven mouths back at the well, and some of us won\'t come home from that house. I know it. You want us?"',
      {
        choices: [
          {
            id: 'come',
            label: 'Nod. Let them run with you.',
            to: 'a7-raider-road',
            flag: 'ally-raiders',
          },
          {
            id: 'home',
            label: 'Point her back the way she came, toward her kits.',
            to: 'a7-hollis-home',
            flag: 'honor:sent-them-home',
          },
        ],
      },
    ),
    s(
      'a7-hollis-home',
      CH.VII,
      'Go Home',
      'raider-kits',
      'You look at the dozen of them, ribs and knives and old coats, and you think of kits hidden back at the well, all ears and no teeth. You point the way they came. Hollis looks at you a long time. Then she laughs once, without much in it. "Proud," she says. "All right." She does not go yet. She crouches and draws in the dust with a claw: the rocks, the road, a line between. "Black rocks on your left hand. Always your left. You feel them pull, you lean away. Don\'t look at them when the moon\'s on them." She stands. "Now we\'re square." The band melts back into the dark, and you run the way she drew.',
      {
        choices: [
          {
            id: 'run',
            label: 'Run, with the rocks on your left hand.',
            to: 'a7-wall-in-time',
          },
        ],
      },
    ),
    s(
      'a7-raider-road',
      CH.VII,
      "The Raiders' Road",
      'dry-well',
      'You run with the band, and the night changes. Jackals know dark ground the way you know a blade: they flow round the black rocks without looking at them, always keeping them on the left, barking short and low when one strays near the glassy edges. Once a young one does stray, and stops, and stands staring into the rocks with his ears flat, until Hollis cuffs him back into the line. Nobody speaks of it. Under so many feet the road holds still. The mission tower rises black against the stars with the moon still high, and the jackals drop flat in the scrub below the wall without being told, and look at you.',
      {
        choices: [
          {
            id: 'wall',
            label: 'Over the wall, with the band at your back.',
            to: 'mission-night',
          },
        ],
      },
    ),

    // In time
    s(
      'a7-wall-in-time',
      CH.VII,
      'In Time',
      'bell-tower',
      'The mission wall rises out of the plain with the moon still high over the bell tower. You are in time. You crouch in the scrub below the adobe with your sides heaving and make yourself breathe slowly: five breaths, ten. Nothing moves along the wall. No lamp burns in the dormitory. The bell hangs in its tower as it always has, with nothing inside it to ring. Then, low down, through a slit window at the foot of the chapel, a light passes: one candle, carried slowly, going down.',
      {
        choices: [
          {
            id: 'wall',
            label: 'Over the wall.',
            to: 'mission-night',
          },
        ],
      },
    ),
  ],
  extend: {
    'run-back': [
      {
        id: 'a7-paws',
        label: 'Listen to the paws drumming out of the dark behind you.',
        to: 'a7-hollis-band',
        needs: 'debt:raider-mother',
        hint: 'Behind you there is only wind, and nobody who owes you anything.',
      },
    ],
  },
  reroute: {
    'run-back/run#success': 'a7-first-mile',
    'run-back/run#failure': 'a7-stumble',
  },
}
