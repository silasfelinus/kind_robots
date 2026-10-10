import type { Act, Choice } from '../types'
import { CH, s } from '../sections'

/**
 * Act IX · The Bell (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5; Book One ch. 8–9).
 * Entry `rescue`; exits are endings only.
 *
 * Order of the night's end: the breach (`rescue`: the dagger thrown, the coyote on the stair, the sword in the
 * fold, open hands, or flight), the surviving nuns on their knees, Sister Wren, the cells and the small dead,
 * the mission's children, the sister among the dead with the knife (SF3 mirror: beside or behind), the cistern,
 * the bell (hang the found `clapper`, the kept revolver, or forge one from the cell chains) and the yard at dawn.
 *
 * Endings authored here: `ending-bell` (Honor ≥ 6, Taint ≤ 1, `clapper`), `ending-hollow-saint` (Taint ≥ 3),
 * `ending-coyote-road` (`ally-coyote`). Shipped endings reached from here: `ending-three`, `ending-four`,
 * `ending-seal`, `ending-hunted`.
 *
 * Reads: children-freed, clapper, wren-ally, wren-betrayed, met:wren, met:mags, mob-coming, ally-coyote,
 * portal-closed, taint:killed-the-abbess, kept-gun, gun-traded, debt:looter, debt:raider-mother, honor:sang,
 * homeland-lost, taint:listened, toddler-weak, one-fire, sister-trust, sister-wary.
 * Sets (nothing later reads them): honor:closed-her-eyes, honor:spared-the-kneeling, taint:killed-the-kneeling,
 * honor:trusted-wren, honor:made-amends, taint:left-her-locked, honor:buried-the-small,
 * honor:sang-for-the-small, taint:heard-the-wall, honor:brought-them-home, honor:let-him-follow,
 * honor:gave-back-the-knife, honor:opened-the-cistern, honor:kept-their-names, honor:returned-the-gun,
 * nuns-spared, nuns-to-mob, nuns-to-desert, wren-stays, wren-with-you, clue:clapper-in-cistern,
 * sister-beside, sister-behind, clapper, gun-traded (the revolver hung in the bell).
 */

// After the nuns are dealt with: Wren (in her three possible states), then the cells.
const afterNuns: Choice[] = [
  {
    id: 'wren-ally',
    label: 'Find Sister Wren where she said she would wait.',
    to: 'a9-wren-ally',
    needs: 'wren-ally',
    hint: 'No one in this house ever stood with you.',
  },
  {
    id: 'wren-cell',
    label: 'Unlock the punishment cell where they put Sister Wren.',
    to: 'a9-wren-cell',
    needs: 'wren-betrayed',
    hint: 'You never gave anyone in this house away.',
  },
  {
    id: 'wren',
    label: 'Look for the young novice who was not in the line.',
    to: 'a9-wren-dorm',
    needs: 'met:wren',
    unless: 'wren-betrayed',
    hint: 'You never learned any of the novices’ names.',
  },
  {
    id: 'cells',
    label: 'Go down to the cells under the house.',
    to: 'a9-cells',
  },
]

const toChildren: Choice = {
  id: 'children',
  label: 'Go up to the children you let out of the cells.',
  to: 'a9-children',
  needs: 'children-freed',
  hint: 'Whoever slept in these cells is gone.',
}

const toSister: Choice = {
  id: 'sister',
  label: 'Wash your paws at the trough and look for the sister.',
  to: 'a9-sister-knife',
}

// After the sister: the cistern, then the tower (whose last choice is to leave the bell and go to the yard).
const afterSister: Choice[] = [
  {
    id: 'cistern',
    label: 'Find out where this house keeps its water.',
    to: 'a9-cistern',
  },
  { id: 'tower', label: 'Climb the bell tower.', to: 'a9-tower' },
]

const toRope: Choice = {
  id: 'rope',
  label: 'Go down to the chapel, where the rope hangs.',
  to: 'a9-rope',
}

export const ACT_IX: Act = {
  scenes: [
    // The breach
    s(
      'a9-thrown',
      CH.IX,
      'The Dagger Thrown',
      'altar',
      'You do not think. The dagger leaves your paw and crosses the altar room in one turn of the candlelight, and the chanting stops in the middle of a word. The nun folds over her prayer. For a heartbeat the torn air behind the altar hangs open with nothing to hold it, and the coiled thing in it goes still, the way a hand goes still when the thread it was pulling breaks. Then it is drawing back: not fast, not afraid, simply gone. The wall is a wall again. Almost. When you look straight at it, it is stone. When you look away, it is deep the way water is deep. The toddler is warm against your neck. The sister has not let go of your poncho.',
      {
        choices: [
          {
            id: 'eyes',
            label: 'Cross to the dead nun and close her eyes before you climb.',
            to: 'a9-kneeling',
            flag: 'honor:closed-her-eyes',
          },
          {
            id: 'up',
            label: 'Carry the toddler up the stair, into air that moves.',
            to: 'a9-kneeling',
          },
        ],
      },
    ),
    s(
      'a9-coyote-stair',
      CH.IX,
      'One Hand on the Stair',
      'coyote-bandaged',
      'You carry the children up the cellar stair. Halfway up, the coyote stops you with his stump against your chest. He pulls an iron candle-stand off the wall with his one good hand, goes back down past you like a man wading into cold water, and swings it into the chanting. The voice stops. Behind the altar the torn air shudders and folds shut, slow as an eyelid, and leaves a wall that looks too deep to be a wall. When he comes back up he is shaking. "Never hit a woman before," he says. "Wasn\'t sure that was one." In the doorway at the top of the stair the last of the nuns stand in a row with their knives. One by one, looking at him and then at you, they lay the knives down on the steps.',
      {
        choices: [
          {
            id: 'herd',
            label: 'Herd the nuns up the stair into the refectory.',
            to: 'a9-kneeling',
          },
        ],
      },
    ),
    s(
      'a9-sealed',
      CH.IX,
      'Into the Fold',
      'kneeling-blade',
      "You drive the sword into the fold of the dark up to the guard. It bites, and the cold comes up the steel into your arms. Everything you have left goes down the blade: the long road from the watering hole, the night run, every mile of it. The torn air takes all of it and closes on it like a mouth. The chanting cracks into an ordinary voice, an old woman's, and stops. When you can see again you are on your knees, and the sword is black from point to guard. Behind the altar is a wall of plain wet stone, and it is only stone. The sister is holding your sleeve in both hands, as if you might go into the dark after it.",
      {
        choices: [
          {
            id: 'out',
            label: 'Let the children lead you up the stair into the morning.',
            to: 'ending-seal',
          },
          {
            id: 'up',
            label: 'Get up. There are still nuns in this house.',
            to: 'a9-kneeling',
          },
        ],
      },
    ),
    s(
      'a9-flight',
      CH.IX,
      'Do Not Look Back',
      'abbess-crypt',
      'You snatch up the toddler, take the sister by the wrist and go up the cellar stair three steps at a time, and the chanting follows you up like smoke. At the top you look back once. That is a mistake. Where the Abbess fell there is nothing but a dark smear across the flagstones, and the smear goes, slow and deliberate, behind the altar, into the place where the wall is not a wall. Something down there is still breathing. Something down there knows your face. The sister pulls at your poncho, hard, toward the gate.',
      {
        choices: [
          { id: 'run', label: 'Run, and keep running.', to: 'ending-hunted' },
        ],
      },
    ),
    s(
      'a9-hollow',
      CH.IX,
      'Open Hands',
      'the-dream',
      'You sheathe the sword. You walk toward the dark with your paws open, the way you would walk up to a frightened animal, and the thing on the other side, which has always wanted a door that walks, stops leaning toward the children and leans toward you. You let it in. It comes through your palms like cold water through cupped hands, more of it than there is room for, and it keeps coming. Behind it the wall goes still and hard and closes, because there is nowhere left for it to be but you. Every candle in the room leans the same way. When you breathe out, the flames lean toward you.',
      {
        effects: { heal: 4, resolve: 2 },
        choices: [
          { id: 'up', label: 'Climb the stair.', to: 'a9-hollow-after' },
        ],
      },
    ),
    s(
      'a9-hollow-after',
      CH.IX,
      'Saint',
      'nuns-kneel',
      "In the refectory the surviving nuns are on their knees before you have said a word. They are not begging. They are praying, and the words are the Abbess's words, and they are for you. You understand them now. You understand a great many things: where the water runs under the desert, which of the nuns is lying, how many days the toddler would last on the road. Every cut the night gave you has closed without a scar. The sister stands between you and her brother with the sacrificial knife held out in both hands, and her hands are perfectly steady. She has never been less afraid of anything in her life. She is looking at you.",
      {
        choices: [
          {
            id: 'walk',
            label: 'Walk out into the morning. Let them follow or not.',
            to: 'ending-hollow-saint',
          },
        ],
      },
    ),

    // The surviving nuns
    s(
      'a9-kneeling',
      CH.IX,
      'On Their Knees',
      'nuns-kneel',
      'The refectory is grey with first light. Supper is still on the long table, gone cold. The nuns who are left kneel on the boards in a row, four of them, habits torn, their knives on the floor in front of them where you can see them. Up close they are not one thing. One is old and shakes. One has a candle burn across her paw. The youngest cannot be much older than the sister. "We came here small," the old one says. "Like them. She fed us, and then she taught us how to feed it." She bows her head. "Mercy, sir, if you have any. We have none of our own to ask it with."',
      {
        choices: [
          {
            id: 'spare',
            label: 'Give them water and the open gate, and let them go.',
            to: 'a9-spared',
            flag: 'honor:spared-the-kneeling',
          },
          {
            id: 'mob',
            label: 'Bind them at the gate for the torches coming up the road.',
            to: 'a9-mob',
            needs: 'mob-coming',
            hint: 'No one from town is coming. Not yet.',
          },
          {
            id: 'mags',
            label:
              'Bind them at the gate for Mags, whose boy went up this road.',
            to: 'a9-mob',
            needs: 'met:mags',
            hint: 'You know no one in Dustwater who would come for them.',
          },
          {
            id: 'desert',
            label:
              'Put them out the gate with nothing, and bar it behind them.',
            to: 'a9-desert',
          },
          {
            id: 'blade',
            label: 'Draw the sword.',
            to: 'a9-kneel-blood',
            flag: 'taint:killed-the-kneeling',
          },
        ],
      },
    ),
    s(
      'a9-spared',
      CH.IX,
      'The Open Gate',
      'empty-gate',
      'You fill four skins at the trough and set them on the boards. The nuns look at the water longer than they looked at the sword. At the gate the old one stops. "The bell\'s tongue," she says, without turning round. "She had it dropped down the cistern the year she came, so no one would ever find it." Then they go south across the white flat, four black shapes getting smaller, toward wherever the next town is, and the next house with a bell. You do not know what they will be, out there. Neither do they. The sister watches them all the way to the edge of the world and does not look at you once.',
      {
        effects: { flags: ['nuns-spared', 'clue:clapper-in-cistern'] },
        choices: afterNuns,
      },
    ),
    s(
      'a9-mob',
      CH.IX,
      'Rope at the Gate',
      'torch-mob',
      "You bind them to the gate posts with the altar's own rope and sit down in the arch with the sword across your knees to wait. Nobody speaks. Before the sun is a hand high there is dust on the Dustwater road, a lot of dust, and at the front of it a rabbit with a scattergun and eyes like old nails. The town comes up the road on foot, with hoes and lanterns and nothing at all in its faces. You stand aside. That is all you do. You take the children indoors before the rope goes over the arch, and you keep them there, and the sister listens to every sound through the wall.",
      {
        effects: { flags: ['nuns-to-mob', 'met:mags'] },
        choices: afterNuns,
      },
    ),
    s(
      'a9-desert',
      CH.IX,
      'The White Flat',
      'dust-road',
      "You open the gate and point at the desert. They understand. The old one reaches for a water skin on the hook and you put the point of the sword between her paw and the hook, and she lets go. Then they walk out into the white with nothing, and you bar the gate behind them. It is the desert's verdict, not yours; that is what you tell yourself. By noon there will be no shade between here and anywhere. By evening there will be birds over the eastern flat, turning slowly. The sister watched you bar the gate. She will remember how quick it was, and how easy.",
      {
        effects: { flag: 'nuns-to-desert' },
        choices: afterNuns,
      },
    ),
    s(
      'a9-kneel-blood',
      CH.IX,
      'What the Sword Is For',
      'refectory',
      'Your teacher said a blade is drawn only to be used. You draw it. The old one closes her eyes. The youngest does not, and she is the one you will remember. It does not take long, and nobody runs. When it is done the refectory is very quiet, and the sword is the only thing in the room that does not look ashamed. Behind you, in the doorway, the sister has seen all of it. She does not cry out. She takes her brother by the hand, slowly, the way you take a hand when you are not sure what the person beside you is going to do next.',
      {
        effects: { flag: 'sister-wary' },
        choices: afterNuns,
      },
    ),

    // Sister Wren
    s(
      'a9-wren-ally',
      CH.IX,
      'The Novice',
      'wren',
      'Sister Wren is sitting on the chapel steps where she said she would wait, with the dormitory keys in her lap and blood on her sleeve that is not hers. She stood with you tonight, and everyone in this house saw it. When the town comes, it will see only a habit. "I can\'t go home," she says. "I was given here. There isn\'t a home." She holds the keys out to you. "The house has a cistern and a roof. Somebody has to sleep in it who isn\'t her."',
      {
        choices: [
          {
            id: 'children',
            label:
              'Give her the keys, and the children you let out of the cells.',
            to: 'a9-with-wren',
            needs: 'children-freed',
            hint: 'There are no other children left in this house to give her.',
            flags: ['honor:trusted-wren', 'wren-stays'],
          },
          {
            id: 'keys',
            label: 'Close her paws back around the keys.',
            to: 'a9-cells',
            flags: ['honor:trusted-wren', 'wren-stays'],
          },
          {
            id: 'come',
            label: 'Cut the hood from her habit and take her with you.',
            to: 'a9-cells',
            flag: 'wren-with-you',
          },
        ],
      },
    ),
    s(
      'a9-wren-cell',
      CH.IX,
      'The Punishment Cell',
      'cellar-cells',
      'They put her in the cell at the end, the one with a door instead of bars, because of what you told the Abbess. Sister Wren sits against the far wall with her knees drawn up. Somebody has cut her fur short to the skin in patches. She looks at the key in your paw, then at your face, then at the floor. "I wrote go," she says. "That was all I wrote." Somewhere above, the bell rope creaks in a draft. She has not asked you to open the door. She does not think she is allowed to ask you anything.',
      {
        choices: [
          {
            id: 'key',
            label: 'Unlock the door and put the key in her paw.',
            to: 'a9-cells',
            flags: ['honor:made-amends', 'wren-stays'],
          },
          {
            id: 'open',
            label: 'Unlock the door and walk away before she can look at you.',
            to: 'a9-cells',
          },
          {
            id: 'lock',
            label: 'Leave her locked in for whoever comes up the road.',
            to: 'a9-cells',
            flag: 'taint:left-her-locked',
          },
        ],
      },
    ),
    s(
      'a9-wren-dorm',
      CH.IX,
      'The Doll',
      'empty-cot',
      'You find the youngest novice in the dormitory, not in the line with the others. Sister Wren sits on the empty cot with the button-eyed doll in her lap, smoothing its yarn hair flat with one finger. "There were a lot of them in here when I came," she says. "I counted them every night. Then I stopped counting." She does not ask you for mercy. She asks what will happen to the children now. It is the first time anyone in this house has asked that question out loud.',
      {
        choices: [
          {
            id: 'children',
            label:
              'Give her the keys, and the children you let out of the cells.',
            to: 'a9-with-wren',
            needs: 'children-freed',
            hint: 'There are no other children left in this house to give her.',
            flags: ['honor:trusted-wren', 'wren-stays'],
          },
          {
            id: 'keys',
            label: 'Give her the dormitory keys, and the house with them.',
            to: 'a9-cells',
            flags: ['honor:trusted-wren', 'wren-stays'],
          },
          {
            id: 'gate',
            label: 'Point her to the gate.',
            to: 'a9-cells',
          },
        ],
      },
    ),

    // The cells and the small dead
    s(
      'a9-cells',
      CH.IX,
      'Under the House',
      'cellar-cells',
      'Under the house the cells stand open in a row, the straw still pressed into the shapes of small sleepers. Low on the walls are scratches: tally marks, a lopsided sun, a name you cannot read. At the end of the row a gap in the old wall opens into the crypt behind the altar, where the niches hold bundles wrapped in black habits, row on row, as neat as the cots upstairs. You know now what is in them, and how small. Beyond them, the wall where the dark came through is sweating in the cold.',
      {
        choices: [
          {
            id: 'bury',
            label: 'Carry the small dead up into the light and bury them.',
            to: 'a9-graves',
          },
          {
            id: 'wall',
            label:
              'Lay your ear to the wall, as you once did to the stone face.',
            to: 'a9-wall',
            needs: 'taint:listened',
            unless: 'portal-closed',
            hint: 'Nothing down here has ever spoken to you.',
          },
          toChildren,
          {
            id: 'up',
            label: 'Leave the dead to the dark and go up.',
            to: 'a9-sister-knife',
          },
        ],
      },
    ),
    s(
      'a9-wall',
      CH.IX,
      'What the Wall Knows',
      'the-dream',
      'The stone is warm, which no stone down here should be. For a while there is only the sound of your own blood. Then it is there, closer than in any dream, careful as a hand on a sleeper: *You closed a door. There are other doors. I could show you yours.* And you see it, plain as the candles: a road of pale stone running east over the sea, a valley at the end of it, a temple roof. Your shoulder stops hurting. Your mind is clear and cold as well water. Behind you the sister has come down the steps and is standing very still.',
      {
        effects: { flag: 'taint:heard-the-wall', heal: 2, resolve: 1 },
        choices: [
          {
            id: 'take',
            label: 'Let it in. All of it.',
            to: 'a9-hollow',
            needsTaint: 3,
            hint: 'It needs more room in you than you have made.',
          },
          {
            id: 'bell',
            label:
              'Listen for the temple bell in the valley, and hear only wind.',
            to: 'a9-graves',
            needs: 'homeland-lost',
            hint: 'There is still something in you for it to sell.',
          },
          {
            id: 'away',
            label: 'Take your ear from the stone and carry the small dead up.',
            to: 'a9-graves',
          },
          {
            id: 'up',
            label: 'Pull away and climb the stair.',
            to: 'a9-sister-knife',
          },
        ],
      },
    ),
    s(
      'a9-graves',
      CH.IX,
      'Small Graves',
      'kneeling-blade',
      'You carry them up in your poncho, a few at a time, and lay them in the soft ground under the merry-go-round, because it is the only place in this courtyard that was ever meant for children. The sister digs beside you without being asked, with a ladle from the refectory. Neither of you counts. When the last grave is closed, the merry-go-round stands over them with its cobwebs stirring in the dawn wind, and for the first time since you came through the gate it looks like what it is: a thing made for children to play on.',
      {
        effects: { flag: 'honor:buried-the-small' },
        choices: [
          {
            id: 'sing',
            label: 'Take off your hat and sing them the river song.',
            to: 'a9-river-song',
            needs: 'honor:sang',
            hint: 'You have no song for them.',
          },
          toChildren,
          toSister,
        ],
      },
    ),
    s(
      'a9-river-song',
      CH.IX,
      'Unafraid, to the Sea',
      'desert-bloom',
      'You sing what your people sing for the dead: the slow song about the river that forgets its banks and goes, unafraid, to the sea. You sang it once in Hollow Bell, over strangers. These are strangers too. Halfway through, under your voice, there is another voice, thin and off the note. The sister heard it once, from under a boardwalk, and kept it. She does not know the words. She sings the shape of them. When the song is done she goes on humming after you stop, as though she is not ready to let them go to the sea alone.',
      {
        effects: { flag: 'honor:sang-for-the-small' },
        choices: [toChildren, toSister],
      },
    ),

    // The mission's children
    s(
      'a9-children',
      CH.IX,
      'The Others',
      'children-leaving',
      'The children you let out of the cells are in the courtyard, more of them than you thought, standing in a clump in the grey light as if waiting to be told where to sleep. A rabbit kit who has not spoken since he came here holds the paw of a smaller one. Some have been here a season. Some do not remember anywhere else. All of them are watching you, because you are the one with the sword, and in this house that has always meant you decide. The road to Dustwater is two days long. The desert does not care how many of you there are.',
      {
        choices: [
          {
            id: 'town',
            label: 'Walk them all down the road to Dustwater, every one.',
            to: 'a9-many',
            flag: 'honor:brought-them-home',
          },
          {
            id: 'wren',
            label:
              'Leave them here with Sister Wren and the keys to the house.',
            to: 'a9-with-wren',
            needs: 'wren-stays',
            hint: 'There is no one here you would trust them to.',
          },
          {
            id: 'two',
            label: 'Point them toward the town and walk on with only the two.',
            to: 'a9-only-two',
          },
        ],
      },
    ),
    s(
      'a9-many',
      CH.IX,
      'A Long Tail of Children',
      'three-road',
      'It will be slow. Children walk at the speed of the smallest and drink at the speed of the thirstiest, and the road to town is two days of nothing. You fill every skin the trough will give. You will carry someone on your back most of the way, and you already know which one. Dustwater sold them once; it is not safety you are walking them toward. But there are faces on that notice wall that are still waiting, and some of these are those faces. The sister has already gone to find a place at the back of the line, where the stragglers will be.',
      {
        choices: [
          {
            id: 'sister',
            label:
              'Before you set out, look for the sister. She has gone below.',
            to: 'a9-sister-knife',
          },
        ],
      },
    ),
    s(
      'a9-with-wren',
      CH.IX,
      'A House with the Door Unlocked',
      'wren',
      "You give the house to the children and the children to Wren, and she takes them as if they might break. The house has a cistern, a roof and a garden gone to seed. It has a cellar, which you nail shut with planks from the merry-go-round's broken seat. It also has a wall that is not quite a wall, and a young otter in a habit whom the towns will never trust. You cannot fix either. The rabbit kit stands at Wren's side and watches you work, and the third time you look up from your hammer he lifts one paw. It is almost a wave.",
      {
        choices: [
          {
            id: 'sister',
            label: 'Put down the hammer and look for the sister.',
            to: 'a9-sister-knife',
          },
        ],
      },
    ),
    s(
      'a9-only-two',
      CH.IX,
      'The Ones Who Stay Behind',
      'dust-road',
      'You point down the road toward the town and give the oldest of them what water you can spare. It is not much. Then you turn your back on them, because you are one man with a sword and two children already, and the road does not get shorter for being shared. When you look back from the gate, they are standing where you left them. All but one. The silent rabbit kit has picked up a stick for a staff and is following, a long way behind, at the distance the sister once kept from you. He stops when you stop. He does not come closer.',
      {
        choices: [
          {
            id: 'let',
            label: 'Let him follow.',
            to: 'a9-sister-knife',
            flag: 'honor:let-him-follow',
          },
          {
            id: 'send',
            label: 'Point him back toward the others.',
            to: 'a9-sister-knife',
          },
        ],
      },
    ),

    // The sister among the dead (SF3 mirror)
    s(
      'a9-sister-knife',
      CH.IX,
      'The Lone Survivor',
      'sister-dagger',
      'The sister is not where you left her. You find her below, back in the altar room, standing alone among the dead with the sacrificial knife in her bandaged hands. The candles have burned down to puddles. She is not crying. She stands exactly as she stood in Hollow Bell the evening you found her, among the bodies of strangers, her teeth bared at nothing, and she does not put the knife down when she sees you. Her brother sits on the bottom step behind her with his thumb in his mouth, watching her the way he always watches her: to learn what is safe.',
      {
        choices: [
          {
            id: 'hand',
            label:
              'Hold out your paw for the knife, palm up, and wait. (Mercy · 9)',
            to: 'a9-behind',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a9-beside',
              failure: 'a9-behind',
              bonus: { flag: 'sister-trust', amount: 2 },
            },
          },
          {
            id: 'kneel',
            label:
              'Kneel among the dead, smaller than she is, and say nothing.',
            to: 'a9-beside',
            needs: 'one-fire',
            unless: 'sister-wary',
            hint: 'She has never once sat at your fire.',
          },
          {
            id: 'brother',
            label:
              'Lift her brother off the step first. He is still too weak to climb.',
            to: 'a9-beside',
            needs: 'toddler-weak',
            hint: 'Her brother is strong enough to climb on his own.',
          },
          {
            id: 'turn',
            label: "Turn and climb the stair. She will follow, or she won't.",
            to: 'a9-behind',
          },
        ],
      },
    ),
    s(
      'a9-beside',
      CH.IX,
      'Beside',
      'sister-dagger',
      'For a long moment she does not move. Then she comes across the room between the dead and puts the knife into your paw hilt first, and her paws shake so hard that the blade chatters against your claws. You wipe it clean on your poncho. You turn it round. You hold it out to her, hilt first, the way it was given. She stares at it. Then she takes it back and pushes it through the rag at her waist, and picks up her brother, and when you climb the stair she climbs it at your side, not behind you. On the narrow steps your shoulders touch. She does not move away.',
      {
        effects: {
          flags: ['honor:gave-back-the-knife', 'sister-beside'],
          attr: { attribute: 'mercy', amount: 1 },
        },
        choices: afterSister,
      },
    ),
    s(
      'a9-behind',
      CH.IX,
      'Behind',
      'siblings',
      'She keeps the knife. She does not come near you, and you do not make her. When you climb the stair she follows three steps behind, her brother on her hip and the blade held low against her dress where he cannot see it, and when you stop at the top, she stops. It is the distance from Hollow Bell. It is not nothing; a week ago it was the width of a desert. She has learned something about you tonight, and something about herself, and it will be a long road before she knows which of the two frightens her more.',
      {
        effects: { flag: 'sister-behind' },
        choices: afterSister,
      },
    ),

    // The cistern
    s(
      'a9-cistern',
      CH.IX,
      'The Cistern',
      'locked-door',
      'The cistern is under a stone lid in the kitchen yard, and the lock on it is newer than the lock on the crypt door. You break it with the pommel of the sword. Below, black and still, is more water than you have seen since the watering hole: cold, clean, enough for Dustwater for a month. All this time. The town sold its children for water, and the house that bought them sat on a lake. The sister looks down into it, then at you, and for once she understands everything there is to understand without anyone saying a word.',
      {
        choices: [
          {
            id: 'tongue',
            label:
              'Climb down and drag up what the old nun said lies at the bottom.',
            to: 'a9-hang',
            needs: 'clue:clapper-in-cistern',
            hint: 'You do not know what lies at the bottom.',
            flag: 'clapper',
          },
          {
            id: 'open',
            label:
              'Leave the lid off and the gate propped open for the thirsty.',
            to: 'a9-tower',
            flag: 'honor:opened-the-cistern',
          },
          {
            id: 'hollis',
            label: "Tie a rag to the gate the way Hollis's band marks water.",
            to: 'a9-tower',
            needs: 'debt:raider-mother',
            hint: 'You owe no one out in the waste a well.',
            flag: 'honor:opened-the-cistern',
          },
          {
            id: 'scout',
            label:
              'Whistle low for the raccoon who shadows you, and send word.',
            to: 'a9-tower',
            needs: 'debt:looter',
            hint: 'No one out there owes you a run in the dark.',
            flag: 'honor:opened-the-cistern',
          },
          {
            id: 'lock',
            label: 'Put the lid back. Water is what this country kills for.',
            to: 'a9-tower',
          },
        ],
      },
    ),

    // The bell
    s(
      'a9-tower',
      CH.IX,
      'The Empty Mouth',
      'bell-tower',
      'You climb the tower in the last of the dark. The bell hangs where it has always hung, fine and old and green at the lip, its mouth empty. From up here the whole country is grey and flat and silent to the edge of the world: the white flat, the Dustwater road, the red canyons you came through, very small. Somewhere out there is every town that never heard this bell, because there was never anything inside it to ring. The rope runs down through a hole in the boards to the chapel floor. It would take only a tongue.',
      {
        choices: [
          {
            id: 'hang',
            label: "Hang the bell's own tongue back in its mouth.",
            to: 'a9-hang',
            needs: 'clapper',
            hint: 'You have nothing to hang in it.',
          },
          {
            id: 'gun',
            label:
              "Lash the coyote's revolver into the bell's mouth for a tongue.",
            to: 'a9-gun-tongue',
            needs: 'kept-gun',
            unless: 'gun-traded',
            hint: 'You carry no iron heavy enough.',
          },
          {
            id: 'forge',
            label:
              'Carry the cell chains to the kitchen fire and forge a tongue. (Steel · 9)',
            to: 'a9-forge-crack',
            check: {
              attribute: 'steel',
              target: 9,
              success: 'a9-forge',
              failure: 'a9-forge-crack',
            },
          },
          {
            id: 'leave',
            label: 'Leave the bell as it has always been, and go down.',
            to: 'a9-dawn-yard',
          },
        ],
      },
    ),
    s(
      'a9-hang',
      CH.IX,
      'The Tongue Restored',
      'bell-tower',
      "You carry it up the tower in both arms. It is heavier than it looks, the way true things are: a long tongue of dark iron, pitted and green from wherever it has lain since the Abbess had it cut out. You hook it up through the crown of the bell and pin it with a nail from the refectory door. It hangs in the dark mouth, still, a finger's width from the lip. For the first time in longer than anyone in this country has been alive, the bell is whole. The wind moves it, very slightly. It does not ring. It is waiting for someone to ask.",
      {
        choices: [toRope],
      },
    ),
    s(
      'a9-gun-tongue',
      CH.IX,
      'Iron for a Tongue',
      'bell-tower',
      "You take the coyote's revolver out of your sash, the one you kept at the watering hole because iron buys water. It has never bought you anything. You empty the cylinder into your palm and drop the shells down the tower, one by one. Then you lash the gun by its trigger guard to the crown of the bell with a strip torn from your poncho, barrel up, so that the heavy butt hangs a finger's width from the lip. It looks like nothing on earth. When the wind touches it, it knocks once against the bronze, soft and dull. It will be enough.",
      {
        effects: { flags: ['clapper', 'gun-traded'] },
        choices: [toRope],
      },
    ),
    s(
      'a9-forge',
      CH.IX,
      'A Tongue of Chain',
      'zuzu-fire',
      'You build the kitchen fire up until the iron pot on its hook glows, and you lay the chains from the cells in it, link by link, the chains that held children to the walls. The sister works the bellows without being asked. It is ugly work with the wrong tools: a hammer meant for nails, a step of the tower for an anvil, your paws wrapped in wet sacking. Near dawn you have it. A black, lumpen tongue as long as your forearm, a loop at the top and a weight at the bottom, that hangs true from your fist. It is not beautiful. It will ring.',
      {
        effects: { flag: 'clapper' },
        choices: [
          {
            id: 'names',
            label:
              'Scratch the names from the cell walls into the iron before it cools.',
            to: 'a9-rope',
            flag: 'honor:kept-their-names',
          },
          {
            id: 'up',
            label: 'Carry it up the tower and hang it.',
            to: 'a9-rope',
          },
        ],
      },
    ),
    s(
      'a9-forge-crack',
      CH.IX,
      'Bad Iron',
      'zuzu-fire',
      'The first casting cracks as it cools, with a sound like a knuckle, and a flake of it spits out of the fire into the back of your paw. You do not make a sound. The next link will not weld to the one after it. The fire is too small, the iron too old, the night too short; it is the wrong forge, and you are a swordsman, not a smith. The sister watches you sit back on your heels with your burned paw in your lap. Then she gets up without a word and goes to fetch more wood.',
      {
        effects: { hurt: 2 },
        choices: [
          {
            id: 'again',
            label: 'Start again, with the sister on the bellows.',
            to: 'a9-forge',
          },
          {
            id: 'yard',
            label: 'Let the fire die and go out to the yard.',
            to: 'a9-dawn-yard',
          },
        ],
      },
    ),
    s(
      'a9-rope',
      CH.IX,
      'The Rope',
      'bell-dawn',
      'Down in the chapel the rope hangs where it has hung for years, through the hole in the ceiling, worn smooth at the height of a paw that never once pulled it. The sun is coming. The first of it lies across the chapel floor in a long gold bar. Out on the Dustwater road, out on the white flat, in every town that ever nailed a notice to a wall, people are waking and do not yet know what happened here in the night. You put your paws on the rope. It is warm from the sun. Behind you, someone small has come in to watch.',
      {
        choices: [
          {
            id: 'ring',
            label: 'Ring the bell.',
            to: 'ending-bell',
            needs: 'clapper',
            needsHonor: 6,
            maxTaint: 1,
            hint: 'This bell answers only clean paws and a long road of kept faith. Not yet yours.',
          },
          {
            id: 'leave',
            label:
              'Let go of the rope. Leave it for someone with cleaner paws.',
            to: 'a9-dawn-yard',
          },
        ],
      },
    ),

    // The yard at dawn
    s(
      'a9-dawn-yard',
      CH.IX,
      'Dawn at the Gate',
      'children-leaving',
      'Dawn comes up gold and ordinary over the mission wall, the way it did on the first morning, when the Abbess put bread in your hands and told you to go with her blessing. The gate stands open. The merry-go-round throws a long spoked shadow across the yard. Behind you the house is silent and full of candles and full of the dead. The sister waits by the gate with her brother on her hip, watching to see which way you will turn. This time, whichever way it is, nobody is going to be left behind.',
      {
        choices: [
          {
            id: 'burn',
            label:
              'Put a candle to the chapel hangings and walk out with them.',
            to: 'ending-three',
          },
          {
            id: 'fire',
            label: 'Follow the coyote to wherever he means to make his fire.',
            to: 'ending-four',
            needs: 'ally-coyote',
            hint: 'You came here alone.',
          },
          {
            id: 'bury',
            label:
              'Send the children on with the coyote, and stay to bury the dead.',
            to: 'a9-bury',
            needs: 'ally-coyote',
            hint: 'There is no one here you would trust them to.',
          },
          {
            id: 'spent',
            label: 'Walk, though your legs will barely hold you.',
            to: 'ending-seal',
            needs: 'portal-closed',
            hint: 'You spent nothing tonight that you cannot spare.',
          },
          {
            id: 'abbess',
            label: "Go down once more to look at the Abbess's body.",
            to: 'a9-abbess-gone',
            unless: 'taint:killed-the-abbess',
          },
        ],
      },
    ),
    s(
      'a9-abbess-gone',
      CH.IX,
      'Where She Fell',
      'abbess-crypt',
      'You go down one last time. The dead nuns lie where they fell. The Abbess does not. Where she went down there is a dark smear on the flagstones, and it goes, slow and deliberate, across the floor and behind the altar to the wall that is only a wall when you look straight at it, and there it stops. There is no body. There is one soft footprint in the spilled wax, pointing in. Up in the yard the toddler begins to cry, and does not know why.',
      {
        choices: [
          {
            id: 'go',
            label: 'Take the children and walk, and keep walking.',
            to: 'ending-hunted',
          },
        ],
      },
    ),
    s(
      'a9-bury',
      CH.IX,
      'The Gravedigger',
      'coyote-bandaged',
      'The coyote does not argue. He has buried people too. He takes the toddler on his good arm, and the sister takes his empty sleeve, because it is the side nearest her. She does not want to go. She does not say so. She looks at you the way she looked at the mission gate the first morning, and you look back, and that is all the arguing there is. There are a great many dead in this house, nuns and children both. The ground is hard. You have two paws and a long time. It is what your people do.',
      {
        choices: [
          {
            id: 'gun',
            label: 'At the gate, put his revolver back in his left hand.',
            to: 'ending-coyote-road',
            needs: 'kept-gun',
            unless: 'gun-traded',
            hint: 'You carry nothing of his to give back.',
            flag: 'honor:returned-the-gun',
          },
          {
            id: 'spade',
            label: 'Watch them go to the bend in the road, then find a spade.',
            to: 'ending-coyote-road',
          },
        ],
      },
    ),

    // Endings
    s(
      'ending-bell',
      CH.END,
      'The Bell Rings',
      'bell-dawn',
      "You pull. The rope fights you, then gives, and above you the bell swings over for the first time in its life and speaks. It is not a pretty sound. It is enormous. It goes out of the tower and across the white flat and down the Dustwater road, and under the house the wall that was not a wall goes quiet and becomes only stone. You ring it until your arms shake. The sister's paws are on the rope below yours. The toddler, on the floor between your feet, stares up at the noise with his mouth open, and then he laughs out loud, a small cracked sound like a bell's. By noon there is dust on the road. People are coming to see who rang it.",
      { ending: 'hope' },
    ),
    s(
      'ending-hollow-saint',
      CH.END,
      'The Hollow Saint',
      'zuzu-alone',
      "They follow. Children always follow someone. They keep the old distance, the Hollow Bell distance, and the sister sleeps sitting up with the knife across her knees and her brother at her back. You no longer need to sleep. You need very little water. Where you walk, the wells you pass stand a hand's width higher, and the towns that see you coming bar their doors, and are right to. Some nights, when the fire is low, you hear yourself humming a song that is not the river song, in a voice that is not quite yours, and across the embers the sister's eyes are open. The children live. You tell yourself that is what you wanted.",
      { ending: 'dark' },
    ),
    s(
      'ending-coyote-road',
      CH.END,
      "The Coyote's Road",
      'dust-road',
      "It takes nine days. You bury them in rows in the kitchen garden, the small ones nearest the water, and over each one you sing the river song until your voice is gone, and then you go on singing it without one. Nobody comes up the mission road. On the tenth morning you shoulder your pack, close the gate behind you, and follow two sets of small tracks and one set of large ones south, toward the coyote's country. They are old tracks now; the wind has been at them. You do not know whether you will catch them up, or whether, if you do, the sister will still be keeping a place for you by the fire.",
      { ending: 'bittersweet' },
    ),
  ],

  extend: {
    rescue: [
      {
        id: 'hollow',
        label: 'Sheathe the sword and open your paws to the dark.',
        to: 'a9-hollow',
        needsTaint: 3,
        hint: 'It needs more room in you than you have made.',
      },
      {
        id: 'flee',
        label: 'Snatch up both children and run for the stair.',
        to: 'a9-flight',
        unless: 'taint:killed-the-abbess',
      },
    ],
  },

  reroute: {
    'rescue/together': 'a9-thrown',
    'rescue/four': 'a9-coyote-stair',
    'rescue/seal': 'a9-sealed',
  },
}
