import type { Act } from '../types'
import { CH, s } from '../sections'

/**
 * Act VI · Dustwater (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5). Entry 'posters'; exits
 * 'run-back' and 'ending-warning'. Order of the night: the wall of names (Pip and her brother's notice), Pell the
 * badger and the coyote's bounty, Mags behind the bar (Lark's notice and the bowl), Gideon Vane's water house,
 * then the torches. Flags read by later acts: 'met:mags', 'baron-bound', 'honor:bound-the-baron',
 * 'taint:killed-unarmed', 'mob-coming', 'mob-held', 'honor:held-the-mob', 'bounty-sold', 'taint:sold-him';
 * 'gun-traded' marks that the coyote's iron ('kept-gun') left Zuzu's sash in Dustwater.
 */
export const ACT_VI: Act = {
  scenes: [
    // The wall of names (posters/read)
    s(
      'a6-wall',
      CH.VI,
      'Names in Lantern Light',
      'posters-boardwalk',
      "You walk the boardwalk slowly, and the faces walk with you. Fennec, mouse, raccoon, rabbit, drawn in charcoal by paws that were not used to drawing. Ages written large, as if a bigger number might help: four, six, nine. Some sheets are so old the faces have faded to ghosts under newer ones. Under the lantern a small mouse girl sits with her knees drawn up, guarding one sheet as though someone might take it down. At the far end of the walk a broad badger in a long coat is driving a nail through a fresh notice with the butt of a pistol. It is not a child's face. It is a coyote with one eye.",
      {
        effects: { flag: 'poster-clue' },
        choices: [
          {
            id: 'kasa',
            label: 'Take off your hat before the names.',
            to: 'a6-kasa',
          },
          {
            id: 'badger',
            label: 'Walk down to the badger and read what he is nailing up.',
            to: 'a6-badger',
          },
          {
            id: 'wagon',
            label:
              'Ask the way to Mr G. Vane, whose name was on the black wax.',
            to: 'a6-water-house',
            needs: 'clue:pilgrim-wagon',
            hint: 'No name here means anything to you yet.',
          },
          {
            id: 'hats',
            label: 'Find the house the two men in clean hats drove toward.',
            to: 'a6-delivered',
            needs: 'taint:delivered',
            unless: 'clue:pilgrim-wagon',
            hint: 'You have no business with anyone in this town.',
          },
          {
            id: 'saloon',
            label: 'Push through the saloon doors.',
            to: 'saloon',
          },
        ],
      },
    ),
    s(
      'a6-kasa',
      CH.VI,
      'Hat in Hand',
      'names-wall',
      'You untie your kasa and hold it against your chest, and stand before the wall the way you stood before the dead of your own country. Nobody here does this. A man crossing the street stops to stare. The mouse girl watches you a long time before she speaks. "That one\'s Tam," she says, touching the sheet she guards. "He\'s six. Mister Vane\'s wagon took him to the sisters, to be fed. Ma says he\'s fat now." She takes a stub of chalk from her pocket and, very carefully, draws a little round hat in the corner of her brother\'s notice. "So he knows somebody stopped," she says. Her name is Pip. She does not ask yours.',
      {
        effects: {
          flags: ['met:pip', 'honor:bowed-to-the-names'],
          resolve: 1,
        },
        choices: [
          {
            id: 'badger',
            label: 'Put your hat back on and walk down to the badger.',
            to: 'a6-badger',
          },
          {
            id: 'saloon',
            label: 'Go into the saloon.',
            to: 'saloon',
          },
        ],
      },
    ),

    // Pell the badger and the coyote's bounty
    s(
      'a6-badger',
      CH.VI,
      'Forty Gallons',
      'bounty-badger',
      'The badger finishes his nail and steps back to admire it. He is built like a stove, grey-striped face, coat dusty to the knee, and he wears his pistol on the hip like a man who has never needed to be quick. WANTED, the notice says, over a fair likeness of the coyote from the watering hole: ONE EYE. KILLED A WELL-KEEPER AT SUTTER\'S DRAW. FORTY GALLONS. "Name\'s Pell," the badger says. "I hunt for pay, and I tell folk so. Saves time." He looks at the dust on you. "You came up the mission road. He was seen that way. You seen him?" He asks it plainly, the way he does everything, and waits.',
      {
        choices: [
          {
            id: 'iron',
            label:
              "Lay the coyote's revolver on a rain barrel: proof he will never draw again.",
            to: 'a6-badger-iron',
            needs: 'kept-gun',
            hint: "You carry nothing of the coyote's.",
          },
          {
            id: 'stand',
            label:
              "Step into the badger's road toward the north, and stay there.",
            to: 'a6-badger-stand',
            needs: 'coyote-debt',
            hint: 'Nothing ties you to the coyote.',
          },
          {
            id: 'lie',
            label:
              'Shake your head. You have seen no one-eyed coyote. (Shadow · 9)',
            to: 'a6-badger-doubts',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'a6-badger-lied',
              failure: 'a6-badger-doubts',
            },
          },
          {
            id: 'truth',
            label:
              'Tell him the whole of it, croc and hand, and let him judge. (Mercy · 9)',
            to: 'a6-badger-rides',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a6-badger-spares',
              failure: 'a6-badger-rides',
              bonus: { flag: 'debt:coyote', amount: 2 },
            },
          },
          {
            id: 'sell',
            label: 'Point him up the north ridge, and hold out your canteen.',
            to: 'a6-badger-sold',
          },
        ],
      },
    ),
    s(
      'a6-badger-stand',
      CH.VI,
      'A Man in the Road',
      'bounty-badger',
      'You step into the badger\'s road and stay there. He looks down at you, and at the hilt over your shoulder, and at your face, which tells him nothing, and waits for the speech. There is none. "He owe you something?" he asks. You nod, once. Pell breathes out through his nose, half a laugh. "Then you\'d like him alive to pay it. Fair." He pulls his nail out of the post with two fingers and folds the coyote into his coat. "Paper\'s good till the first rains. I\'ll go round by Sutter\'s and take my time about it." He settles his hat. "Man who\'ll stand in a road for a one-eyed coyote. That\'s worth knowing."',
      {
        effects: { flag: 'honor:stood-by-the-coyote' },
        choices: [{ id: 'saloon', label: 'Go into the saloon.', to: 'saloon' }],
      },
    ),
    s(
      'a6-badger-iron',
      CH.VI,
      'The Notch in the Grip',
      'bounty-badger',
      'You draw the revolver from your sash by the barrel and lay it on the lid of a rain barrel. Pell picks it up and turns it to the lantern. There is a notch filed in the grip; he finds it with his thumb, and his face changes. "That\'s his piece." You hold up your right paw, close it, and draw a line across the wrist with one claw. Pell is quiet a while. "Paper says him or his gun hand," he says at last. "Croc\'s got the one, and now I\'ve got the other." He tears the notice down. Then he unslings a full canteen and holds it out. "Bounty\'s bounty. A third of it, for the iron."',
      {
        effects: { flag: 'gun-traded' },
        choices: [
          {
            id: 'take',
            label: 'Take the water. Iron was always for buying water.',
            to: 'saloon',
            gain: 'water',
          },
          {
            id: 'refuse',
            label: 'Push the canteen back. You did not do this to be paid.',
            to: 'saloon',
            flag: 'honor:freed-the-coyote',
          },
        ],
      },
    ),
    s(
      'a6-badger-lied',
      CH.VI,
      'West, Then',
      'bounty-badger',
      'You shake your head, once, and hold the badger\'s eye while you do it. Pell looks at you the way a man looks at a mule he is thinking of buying. Then he nods. "West, then. Likely he\'d make for the river." He knocks the dust off his hat. "Obliged." He walks away down the boardwalk, coat swinging, and does not look back, and you cannot tell whether that is because he believed you or because he is a man who knows how to wait. On the post, the coyote\'s single eye watches you go, drawn by someone who never liked him.',
      {
        choices: [{ id: 'saloon', label: 'Go into the saloon.', to: 'saloon' }],
      },
    ),
    s(
      'a6-badger-doubts',
      CH.VI,
      'You Looked North',
      'bounty-badger',
      'You shake your head. Pell smiles for the first time, slow, and not unkindly. "You looked north when you did that," he says. "Most do. Eyes go where the truth is." He settles his hat. "I\'ll not ride in the dark. He\'d hear me a mile off, and I\'m too old to be shot by a one-eyed man. First light, then." He taps the notice with one thick claw. "You bought him a night, stranger. Hope he spends it well." He walks off toward the livery with his hands in his coat, whistling something without a tune.',
      {
        choices: [{ id: 'saloon', label: 'Go into the saloon.', to: 'saloon' }],
      },
    ),
    s(
      'a6-badger-sold',
      CH.VI,
      'Honest Pay',
      'bounty-badger',
      'You turn and point at the north ridge, where a thread of cookfire smoke rose this afternoon that nobody else would have noticed. Then you hold out your canteen. Pell looks at the canteen, and at you, and nods as though you had done something ordinary. He fills it from a cask on his mule until it is heavy. "Rest comes when I bring him in," he says. "Honest pay for honest work. I\'ll not think less of you." He swings up into the saddle. "He will, I expect." The mule goes north at a walk. You stand on the boardwalk with more water than you have carried in a week, and it weighs nothing like what it should.',
      {
        effects: { flags: ['bounty-sold', 'taint:sold-him'], gain: 'water' },
        choices: [{ id: 'saloon', label: 'Go into the saloon.', to: 'saloon' }],
      },
    ),
    s(
      'a6-badger-spares',
      CH.VI,
      "The Paper Doesn't Say",
      'bounty-badger',
      'You tell it the only way you can, with few words and your paws: the black water, the jaws, the coyote standing his ground over a stranger\'s drink, the hand that did not come back out of the river. Pell listens without interrupting. When you finish he looks at the notice for a long time. "Well-keeper at Sutter\'s was charging a cup a child," he says. "Paper doesn\'t say that either." He pulls the nail with two fingers and folds the coyote into his coat. "One hand, one eye. He\'s paid plenty. I\'ll tell them at Sutter\'s I found him dead." He touches his hat. "Which, near enough, the croc saw to."',
      {
        effects: { flag: 'honor:spoke-for-the-coyote' },
        choices: [{ id: 'saloon', label: 'Go into the saloon.', to: 'saloon' }],
      },
    ),
    s(
      'a6-badger-rides',
      CH.VI,
      'With His Own Eyes',
      'bounty-badger',
      "You tell it as well as you can, with few words and your paws: the black water, the jaws, the coyote standing his ground, the hand that did not come back out of the river. Pell hears all of it. \"Might be every word's true,\" he says. \"Might be he's still owed a rope for Sutter's Draw. Paper can't tell me which, and neither can you.\" He checks his mule's cinch. \"I'll go and look at him with my own eyes, and then I'll decide.\" He rides north at a walk, the way the coyote went. You told him the truth. You also told him which way to ride.",
      {
        choices: [{ id: 'saloon', label: 'Go into the saloon.', to: 'saloon' }],
      },
    ),

    // Mags behind the bar (saloon-truth/lark, saloon-truth/who, saloon/press#failure)
    s(
      'a6-lark',
      CH.VI,
      'Proud of Knowing How',
      'mags-bar',
      'Above the bottles, where a mirror would hang in a richer town, there is one notice in a frame of knotted string. A young rabbit with one ear bent over, drawn by someone who knew that face better than her own. LARK, it says, in a mother\'s careful letters. AGE 7. Below it, smaller and crooked, the same name again, scratched in pencil by a child: LARK. Mags sees you looking. "He signed everything he owned," she says. "Proud of knowing how." In your sash, wrapped in cloth, is a cracked clay bowl with the same crooked letters on its rim. You found it at the Black Stones, among small bones.',
      {
        choices: [
          {
            id: 'keep',
            label: 'Leave it wrapped. Let her keep what she has left.',
            to: 'a6-bowl-kept',
          },
          {
            id: 'give',
            label: 'Unwrap the bowl and set it on the bar in front of her.',
            to: 'a6-bowl-given',
          },
          {
            id: 'who',
            label:
              'Look away from the notice and ask who sends the children up that road.',
            to: 'a6-mags-vane',
          },
        ],
      },
    ),
    s(
      'a6-bowl-given',
      CH.VI,
      'Truth for Kindness',
      'mags-bar',
      'You unwrap the bowl and set it on the bar, the name toward her. Mags does not touch it for a long time. Then she turns it over and sees the little bell pressed into its foot, and something leaves her face that does not come back. "Black Stones," she says. It is not a question; she reads where you found it in the way you will not look at her. She does not cry. She sets the bowl on the shelf under her son\'s face, very carefully, the way you set down something that might still be warm. Then she reaches under the bar and lifts out a crate of rags and lamp oil. "Thank you," she says. "Now I know."',
      {
        effects: {
          flags: ['honor:gave-her-the-bowl', 'mags-trust', 'met:mags'],
        },
        choices: [
          {
            id: 'who',
            label: 'Ask her who sends the children up that road.',
            to: 'a6-mags-vane',
          },
        ],
      },
    ),
    s(
      'a6-bowl-kept',
      CH.VI,
      'Some Must Get Out',
      'mags-bar',
      'You leave the bowl where it is. It sits against your ribs like a stone. Mags follows your eyes back to the notice and misreads them. "Some of them must get out," she says. "Somebody\'s boy must walk out of there one day, grown, and not know the way home. Why not mine." She polishes a glass that is already clean. You say nothing. You are good at saying nothing; tonight it costs more than it ever has. Behind her, the boy with the bent ear looks out over the bottles, waiting for someone to come in through the doors.',
      {
        effects: { flag: 'met:mags', resolve: -1 },
        choices: [
          {
            id: 'who',
            label: 'Ask her who sends the children up that road.',
            to: 'a6-mags-vane',
          },
          {
            id: 'give',
            label: 'Change your mind. Unwrap the bowl and set it on the bar.',
            to: 'a6-bowl-given',
          },
        ],
      },
    ),
    s(
      'a6-pilgrim-girl',
      CH.VI,
      'One, as Agreed',
      'mags-bar',
      'Mags takes one look at the bundle on your back and comes round the bar faster than you have seen anyone move in this town. She lays the field mouse girl on a folded apron, lifts one eyelid, smells her breath, and her face goes hard. "Sweet-sleep. They dose them so they don\'t fuss." You lay the black-wax letter beside the girl. Mags reads the front, Mr G. Vane, Dustwater, One, as agreed, and then she reads it again. "He told us they were fed," she says. "He walked one through the market every spring, washed and combed, so we\'d all see." She covers the girl with her own shawl. "She stays with me. Nobody takes her anywhere."',
      {
        effects: { flags: ['met:mags', 'mags-trust'] },
        choices: [
          {
            id: 'who',
            label: 'Ask her who Vane is.',
            to: 'a6-mags-vane',
          },
        ],
      },
    ),
    s(
      'a6-mags-cold',
      CH.VI,
      'Drink or Go',
      'mags-bar',
      'Whatever she sees in your face, it is not enough. "Mission dust on your feet and questions in your mouth," Mags says. "Last one like you was selling something. Drink or go." She turns her back. At the end of the bar an old tortoise lifts his head out of his collar, slow as sunrise. "She lost her boy to that road," he says, too low for her to hear. "Every child in this town that goes up it goes in Vane\'s wagon. Ask at the water house, if you\'ve the stomach." He sinks back into his shell. Behind the bar, Mags is filling a crate with rags and lamp oil, very fast, like someone who has made up her mind.',
      {
        effects: { flag: 'met:mags' },
        choices: [
          {
            id: 'house',
            label: 'Go to the water house.',
            to: 'a6-water-house',
          },
          {
            id: 'wait',
            label: 'Wait on the boardwalk and see what the oil is for.',
            to: 'a6-mob-gather',
          },
          {
            id: 'roped',
            label: 'Turn at the doors. A mule is coming in off the north road.',
            to: 'a6-coyote-roped',
            needs: 'bounty-sold',
            hint: 'No one is coming in from the north.',
          },
          {
            id: 'lark',
            label: 'Look at the notice she keeps pinned above the bottles.',
            to: 'a6-lark',
            needs: 'clue:bowl',
            hint: 'It is one more face on one more notice. You carry nothing of his.',
          },
        ],
      },
    ),
    s(
      'a6-mags-vane',
      CH.VI,
      "Vane's Wagon",
      'mags-bar',
      '"Vane," Mags says. "Gideon Vane. Owns every well in Dustwater, and the last one that still gives." She sets a cup of water in front of you, which here is like setting down a coin. "Every child this town can\'t feed goes up the mission road in his wagon. Kind of him. Every month the casks come back down with a little bell burned in the wood, and he sells us the water by the cup." She lifts the crate of rags onto the bar. "There\'s thirty of us with lamps. Tonight we go up that road and burn it, every nun, every stone." You think of the children behind those walls. She sees you think it. "There\'s no children left up there, stranger. There never are."',
      {
        effects: { flags: ['met:mags', 'abbess-suspicion'] },
        choices: [
          {
            id: 'house',
            label: 'Go and see the man who owns the water.',
            to: 'a6-water-house',
          },
          {
            id: 'stay',
            label: 'Stay, and watch her hand out the torches.',
            to: 'a6-mob-gather',
          },
          {
            id: 'roped',
            label: 'Go to the window. A mule is coming in off the north road.',
            to: 'a6-coyote-roped',
            needs: 'bounty-sold',
            hint: 'No one is coming in from the north.',
          },
        ],
      },
    ),
    s(
      'a6-coyote-roped',
      CH.VI,
      'Fair Trade',
      'bounty-badger',
      "The mule comes in at a walk with the badger at its head. Across its back, roped at the ankles and at the one wrist, hangs the coyote. His right sleeve hangs empty. Townsfolk come out onto the boardwalks to look; a child points. As the mule passes under the lantern the coyote lifts his head, and his one eye finds you at once, standing in the doorway with the badger's water at your hip. He does not curse you. He looks at you the way he looked at the iron in the shallows, as if adding something up, and then he lets his head hang again. Pell touches his hat to you as he goes by.",
      {
        effects: { resolve: -1 },
        choices: [
          {
            id: 'house',
            label:
              'Look away first, and go in to see the man who owns the water.',
            to: 'a6-vane',
          },
          {
            id: 'stay',
            label: 'Go back inside, where Mags is handing out torches.',
            to: 'a6-mob-gather',
          },
        ],
      },
    ),

    // Gideon Vane's water house
    s(
      'a6-water-house',
      CH.VI,
      'The Water House',
      'shuttered-town',
      "The water house is the only building in Dustwater with glass in its windows, and lamps burn behind every pane. Out front, the town's last good pump stands inside an iron cage with a padlock as big as a fist, and a line of townsfolk waits at a hatch with cups, paying in rings, buttons, a pocketknife, a pair of child's shoes. Under a tarp by the side door stand casks of two kinds: Vane's own, a little arrow branded on every head, and empty ones off the mission road with a little bell burned into every stave. A boar with a scattergun across his knees sits in the doorway, and every so often he looks at the line the way a farmer looks at weather.",
      {
        choices: [
          {
            id: 'front',
            label: 'Walk up to the boar and ask to see Mister Vane.',
            to: 'a6-vane',
          },
          {
            id: 'cistern',
            label: 'Slip round the back, where the casks go down. (Shadow · 9)',
            to: 'a6-vane',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'a6-cistern',
              failure: 'a6-vane',
              bonus: { flag: 'clue:pilgrim-wagon', amount: 2 },
            },
          },
          {
            id: 'wagon',
            label:
              "Tell the boar you are the one who brought the sisters' wagon down.",
            to: 'a6-delivered',
            needs: 'taint:delivered',
            hint: 'You have never done business with this house.',
          },
          {
            id: 'gun',
            label:
              "Show the boar the coyote's iron, and let him think you came to sell.",
            to: 'a6-vane-gun',
            needs: 'kept-gun',
            unless: 'gun-traded',
            hint: 'You carry nothing worth selling here.',
          },
          {
            id: 'roped',
            label: 'Stop at the hatch. A mule is coming in off the north road.',
            to: 'a6-coyote-roped',
            needs: 'bounty-sold',
            hint: 'No one is coming in from the north.',
          },
        ],
      },
    ),
    s(
      'a6-cistern',
      CH.VI,
      'Under the House',
      'baron-office',
      "Under the house the air turns cool, and you hear it before you see it: water, a great deal of it, breathing in the dark. The cistern is cut into the rock and lined with tar, and the casks from the mission road are being emptied into it by a lizard with a lamp who does not hear you. Along the wall stand rows of small stoppered jars, each with a tin bell on a cord, waiting to be filled from the same casks and sold up and down the roads as blessed. On the lizard's stool lies a ledger bound in oilcloth. You open it. Names. Ages. A column of casks beside each. You close it and take it with you up the stair.",
      {
        effects: { flag: 'clue:ledger' },
        choices: [
          {
            id: 'up',
            label: 'Climb the stair toward the lamplight.',
            to: 'a6-vane',
          },
        ],
      },
    ),
    s(
      'a6-vane',
      CH.VI,
      'Gideon Vane',
      'baron-office',
      'The boar brings you the last of the way with one heavy hand on your shoulder, as he brings everyone. The office is cool and smells of ink. Maps of the country hang on every wall, wells marked in red, most of them crossed out. Behind the desk sits an old pronghorn with silver capping the tips of his horns and a glass of water at his elbow that he does not touch. "Mission road," he says, looking at your feet. "Sit. You\'ll have had a long walk." He pours you a glass of your own. "Gideon Vane. Whatever they told you about me in that saloon is true, and none of it is the whole of it."',
      {
        choices: [
          {
            id: 'why',
            label: 'Sit, drink, and let him tell you the whole of it.',
            to: 'a6-vane-why',
          },
          {
            id: 'delivered',
            label:
              "Ask him where the child you brought in on the sisters' wagon went.",
            to: 'a6-delivered',
            needs: 'taint:delivered',
            hint: 'You have never done business with this town.',
          },
          {
            id: 'bind',
            label:
              'Open his own ledger on the desk in front of him, and wait. (Mercy · 9)',
            to: 'a6-vane-refuses',
            needs: 'clue:ledger',
            hint: 'You have nothing to hold him to.',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a6-vane-bound',
              failure: 'a6-vane-refuses',
              bonus: { flag: 'clue:water-for-children', amount: 2 },
            },
          },
          {
            id: 'gun',
            label:
              "Set the coyote's revolver on his desk and name a price in water.",
            to: 'a6-vane-gun',
            needs: 'kept-gun',
            unless: 'gun-traded',
            hint: 'You carry nothing he wants to buy.',
          },
          {
            id: 'expose',
            label: 'Take him by the collar and walk him out to the town.',
            to: 'a6-hask',
          },
        ],
      },
    ),
    s(
      'a6-vane-why',
      CH.VI,
      'Four Hundred Cups',
      'baron-office',
      '"Forty years ago this town had six wells," Vane says. "Now it has one, and it\'s mine because I paid to dig it deeper when nobody else would. It gives four hundred cups a day. Dustwater drinks nine hundred." He turns the glass on his desk without lifting it. "The sisters have water, heaven knows where from. And they want children. Children whose mothers can\'t feed them, who\'d be dead by spring. I send them up the road to be fed, the casks come down, and nine hundred animals drink." He opens a ledger and turns it toward you: names, ages, casks. "Every name in that book is a child who ate. You tell me which four hundred of the rest should die."',
      {
        effects: { flag: 'clue:ledger' },
        choices: [
          {
            id: 'bind',
            label: 'Turn the ledger back to face him, and wait. (Mercy · 9)',
            to: 'a6-vane-refuses',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a6-vane-bound',
              failure: 'a6-vane-refuses',
              bonus: { flag: 'clue:water-for-children', amount: 2 },
            },
          },
          {
            id: 'expose',
            label: 'Take him by the collar and walk him out to the town.',
            to: 'a6-hask',
          },
          { id: 'draw', label: 'Draw.', to: 'a6-vane-begs' },
          {
            id: 'leave',
            label: 'Leave him to the town, and to his book.',
            to: 'a6-mob-gather',
          },
        ],
      },
    ),
    s(
      'a6-delivered',
      CH.VI,
      'Into the Book',
      'baron-office',
      'Gideon Vane knows your hat before you are through his door. He does not need to look it up, but he does, for your sake. He runs a finger down the last page of his ledger and stops. "There. One, as agreed, brought down by a stranger in a straw hat." In the margin someone has drawn a little round hat. "She\'s asleep upstairs. The sisters send one down each season, washed and combed and too sleepy to fuss, and I walk her through the market on my arm so every mother in Dustwater can see how well they\'re kept. Then she goes back up the road." He spreads his hands. "You were paid. So was I. Where she goes after, I stopped asking the first year. I\'d advise the same."',
      {
        effects: { flag: 'clue:ledger', resolve: -1 },
        choices: [
          {
            id: 'bind',
            label: 'Keep the book open at that page, and wait. (Mercy · 9)',
            to: 'a6-vane-refuses',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a6-vane-bound',
              failure: 'a6-vane-refuses',
              bonus: { flag: 'clue:water-for-children', amount: 2 },
            },
          },
          {
            id: 'expose',
            label: 'Take him by the collar and walk him out to the town.',
            to: 'a6-hask',
          },
          { id: 'draw', label: 'Draw.', to: 'a6-vane-begs' },
        ],
      },
    ),
    s(
      'a6-vane-gun',
      CH.VI,
      'Iron Buys Water',
      'baron-office',
      'Gideon Vane holds out his hand for the iron before you have said a word. He picks it up as though it might bite, checks the cylinder, and smiles for the first time. "Good iron\'s scarcer than water out here. Almost." He pulls a cord, somewhere below a bell rings, and the boar comes up with a full skin and sets it on the desk. The gun goes into a drawer, and the drawer is locked, and the key goes into Vane\'s waistcoat. "A pleasure," he says, and means it. You carried that iron all this way, cold against your belly. Now it lies in the desk of a man who keeps a ledger of children, and the water is very heavy.',
      {
        effects: { flag: 'gun-traded', gain: 'water' },
        choices: [
          {
            id: 'why',
            label: 'Stay, and ask him what else he buys.',
            to: 'a6-vane-why',
          },
          {
            id: 'expose',
            label: 'Take him by the collar and walk him out to the town.',
            to: 'a6-hask',
          },
          {
            id: 'leave',
            label: 'Take the water and go.',
            to: 'a6-mob-gather',
          },
        ],
      },
    ),
    s(
      'a6-vane-bound',
      CH.VI,
      'The Last Page',
      'baron-office',
      'You lay the ledger open in front of him and wait. Silence is the one weapon here that nobody else carries. Vane reads the names because you will not let him not read them. His finger stops on one. "Lark," he says. "Rabbit boy. Fever. His mother begged me." He reads on, and somewhere in the third column his voice goes. When he looks up he is very old. He takes a fresh sheet, writes down what he has done, and signs it, and pulls the cord. "Tell Hask to open the cage," he says. "Every cup\'s free tonight. Every cup after." He looks at the little bell burned into the ledger\'s cover. "When the sisters\' water stops, we\'ll all be thirsty together."',
      {
        effects: { flags: ['honor:bound-the-baron', 'baron-bound'] },
        choices: [
          {
            id: 'out',
            label:
              'Walk him out into the street, where the torches are being lit.',
            to: 'a6-mob-gather',
          },
        ],
      },
    ),
    s(
      'a6-vane-refuses',
      CH.VI,
      'Prove It to Them',
      'baron-office',
      'Vane closes the ledger gently, as if it were a hymnal. "And who will you show it to? Mags? Half the names in there, their own mothers brought them to my door." He pulls the cord; below, a bell rings, and the boar\'s tread starts up the stair. "Go and tell the town. They\'ll curse me with their mouths full of my water, and come back in the morning with cups. Thirst forgives everything, stranger. It has to." He sits back. He is not afraid of you. He has been afraid of thirst for forty years, and there is no room left in him for anything else.',
      {
        choices: [
          {
            id: 'expose',
            label: 'Take him by the collar before the boar reaches the door.',
            to: 'a6-hask',
          },
          { id: 'draw', label: 'Draw.', to: 'a6-vane-begs' },
          {
            id: 'leave',
            label: 'Leave him to his ledger.',
            to: 'a6-mob-gather',
          },
        ],
      },
    ),
    s(
      'a6-vane-begs',
      CH.VI,
      'On His Knees',
      'baron-office',
      'The blade comes out with the sound it always makes, and Vane hears what that sound means. He is out of his chair and on his knees before the steel has cleared the scabbard, old knees cracking on the boards. "Please," he says. "Please. Take the well. Take the book. I\'m an old man. I only kept them alive." On the stair the boar has stopped, listening. A drawn sword is meant to be used; that is the oldest rule you know. The pronghorn shuts his eyes. Beneath the floor you can hear the cistern breathing: all the water in Dustwater, held back by one iron chain.',
      {
        choices: [
          { id: 'strike', label: 'Strike.', to: 'a6-vane-killed' },
          {
            id: 'chain',
            label:
              'Go down to the cistern and use the blade on the chain instead.',
            to: 'a6-flood',
          },
        ],
      },
    ),
    s(
      'a6-vane-killed',
      CH.VI,
      'What the Blade Is For',
      'baron-office',
      'It is quick. That is the only mercy in it. When you wipe the blade, the pronghorn is lying across his own ledger, and the names are going dark one by one where the ink cannot hold against what is soaking into it. On the stair the boar turns and runs, and his boots go out into the street, and somewhere outside a woman begins to shout. You sheathe the sword. Your paws are steady. That is the part you will remember longest: how steady they were, for a man who begged.',
      {
        effects: {
          flag: 'taint:killed-unarmed',
          attr: { attribute: 'mercy', amount: -1 },
          resolve: -1,
        },
        choices: [
          {
            id: 'street',
            label: 'Go down into the street.',
            to: 'a6-mob-gather',
          },
        ],
      },
    ),
    s(
      'a6-flood',
      CH.VI,
      'Water in the Street',
      'shuttered-town',
      'The chain is old iron, thick as your wrist. It parts at the first stroke. The sluice gate groans and lets go, and the cistern comes out from under the house in a sheet, through the side door, down the steps and into the street. It runs silver under the lamps. Doors open. Someone shouts, and then nobody shouts, because the whole town is on its knees in the road with cups and hats and cupped paws. A small mouse girl stands in it to her ankles, soaked to the ears, laughing. An old jackal washes his face, and keeps washing it. By morning the cistern will be empty. Tonight nobody cares. The sword was used, and nobody died of it.',
      {
        effects: { flag: 'honor:spared-the-baron', heal: 2 },
        choices: [
          {
            id: 'mags',
            label: 'Mags is coming down the street with a torch. Go to her.',
            to: 'a6-mob-gather',
          },
        ],
      },
    ),
    s(
      'a6-hask',
      CH.VI,
      'The Boar in the Door',
      'baron-office',
      'You take Vane by the collar and lift him out of his chair; he weighs less than his coat. You are three steps from the stair when the boar fills the doorway. Hask is twice your height, and most of that is shoulder. He turns the scattergun round in his fists to use as a club, because a shot in here would bring the lamps down, and lowers his head. "Put him down, little man," he says, almost gently. "He pays me." Vane, dangling, says nothing at all. You let go of the pronghorn and reach over your shoulder.',
      {
        battle: {
          name: 'Hask, the water guard',
          hp: 8,
          guard: 1,
          attack: 2,
          win: 'a6-riot',
          lose: 'a6-beaten',
        },
      },
    ),
    s(
      'a6-beaten',
      CH.VI,
      'In the Trough',
      'zuzu-bandage',
      'You wake face-down in the horse trough, which is dry, which is the only reason you wake at all. Your head rings. Your ribs are a row of separate opinions. Above you the water house is dark, and someone has nailed a board across its door. Down the street there is light and noise and the smell of lamp oil. A paw hauls you up by the poncho: Mags, with a torch in her other fist. "Vane\'s barred in with his boar," she says. "Let him keep his house. We\'ve got the mission to see to." She binds your head with a bar rag, quickly, the way she must once have bound a boy\'s knee.',
      {
        effects: { heal: 4, resolve: -1 },
        choices: [
          {
            id: 'follow',
            label: 'Follow her to the torches.',
            to: 'a6-mob-gather',
          },
        ],
      },
    ),
    s(
      'a6-riot',
      CH.VI,
      'The Town Reads the Book',
      'torch-mob',
      "Hask goes down across the doorway and stays down. You march Vane down the stair and out into the lamplit street, and the line at the hatch turns to look. Mags comes out of the saloon, goes up the stair past the boar, and comes back down with the ledger. She reads the names out loud, one at a time, and the street goes quiet the way a room goes quiet at a burial. Then a mother hears a name she knows. Then another does. Someone throws the first stone through the glass. They tear down the stack of casks, the staves split, the mission's water runs out into the dust, and they come for Vane.",
      {
        choices: [
          {
            id: 'between',
            label: 'Put yourself between the pronghorn and the town.',
            to: 'a6-riot-pulled',
          },
          {
            id: 'let',
            label: 'Step back, and let the town have him.',
            to: 'a6-riot-let',
          },
        ],
      },
    ),
    s(
      'a6-riot-pulled',
      CH.VI,
      'A Stone in the Stream',
      'torch-mob',
      'You step into the space in front of Vane and the crowd breaks against you like water against a stone. A fist hits your shoulder. A cup. A shoe. You do not draw; you stand. One by one they stop, because a stranger with a sword who will not use it is a thing nobody here knows what to do with. Behind you the pronghorn lies in the dust with his silver horn-caps scattered round him, alive. Somebody has broken the padlock on the pump cage, and the town is drinking. Mags looks at you over the heads of the crowd with something that is not quite thanks. Then she lights a torch.',
      {
        effects: { flag: 'honor:spared-the-baron', hurt: 2 },
        choices: [{ id: 'go', label: 'Go to her.', to: 'a6-mob-gather' }],
      },
    ),
    s(
      'a6-riot-let',
      CH.VI,
      'What the Town Does',
      'torch-mob',
      'You step back. That is all you do. The crowd closes over the place where the pronghorn was standing, and you do not watch, and later you will not be able to say what you saw. When it opens again there is only a long coat lying in the road, and a silver horn-cap that a small child picks up and then drops, as if it were hot. Somebody has broken the padlock on the pump cage. The town drinks in silence. Nobody looks at anybody. Then Mags lights a torch, and everybody looks at her.',
      {
        effects: { resolve: -1 },
        choices: [
          { id: 'go', label: 'Go to the torches.', to: 'a6-mob-gather' },
        ],
      },
    ),

    // The torches
    s(
      'a6-mob-gather',
      CH.VI,
      'Torches',
      'torch-mob',
      'By full dark the street is a river of fire. Mags stands on the saloon steps with a crate of rags and lamp oil, handing out torches as if she were handing out bread, and the town takes them: mothers, old men, a farrier with his hammer still in his belt, a girl too young to hold anything that burns. Thirty torches. Forty. "We go up that road tonight," Mags says, not loudly; nobody needs her to be loud. "We burn it. Every nun, every stone." Up that road, behind those walls, are the children you left there. The torches are not going to ask which room they sleep in.',
      {
        effects: { flags: ['met:mags', 'abbess-suspicion'] },
        choices: [
          {
            id: 'stand',
            label:
              'Stand in their road and say the one word that matters. (Mercy · 9)',
            to: 'a6-mob-breaks',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a6-mob-held',
              failure: 'a6-mob-breaks',
              bonus: { flag: 'mags-trust', amount: 2 },
            },
          },
          {
            id: 'baron',
            label:
              'Bring Vane forward to swear the water free, in front of them all. (Mercy · 7)',
            to: 'a6-mob-breaks',
            needs: 'baron-bound',
            hint: 'Nobody here would listen to the man who owns the water.',
            check: {
              attribute: 'mercy',
              target: 7,
              success: 'a6-mob-held',
              failure: 'a6-mob-breaks',
              bonus: { flag: 'mags-trust', amount: 2 },
            },
          },
          {
            id: 'pip',
            label:
              "Lift Pip onto the steps beside her brother's notice. (Mercy · 7)",
            to: 'a6-mob-breaks',
            needs: 'met:pip',
            hint: 'You know no one in this crowd by name.',
            check: {
              attribute: 'mercy',
              target: 7,
              success: 'a6-mob-held',
              failure: 'a6-mob-breaks',
              bonus: { flag: 'mags-trust', amount: 2 },
            },
          },
          {
            id: 'lead',
            label: 'Take a torch and lead them up the mission road.',
            to: 'a6-mob-lead',
          },
          {
            id: 'slip',
            label: 'Slip away alone before the first torch is lit.',
            to: 'a6-mob-slip',
          },
        ],
      },
    ),
    s(
      'a6-mob-held',
      CH.VI,
      'Lanterns for the Names',
      'names-wall',
      'In the end it comes down to one word, and someone says it, not loudly: "Children." It goes through the crowd from front to back like wind through grass. Somebody lowers a torch. Then the farrier. Then Mags, last, her jaw working. "Then bring them down to me," she says. "Every one. There\'ll be water, if I carry it myself." Nobody goes home. Instead, one by one, they carry their torches to the boardwalk and set them in the brackets under the notices, until the whole wall of names is lit, every small face gold and warm, the way a house is lit for someone expected home. Somebody begins to read the names aloud. Nobody asks them to stop.',
      {
        effects: {
          flags: ['honor:held-the-mob', 'mob-held'],
          gain: 'water',
          resolve: 1,
        },
        choices: [
          {
            id: 'run',
            label: 'Run. Bring them down to her.',
            to: 'run-back',
          },
        ],
      },
    ),
    s(
      'a6-mob-breaks',
      CH.VI,
      'You Had Your Say',
      'torch-mob',
      'For a moment they listen. Then someone at the back shouts a name, a child\'s name, and someone else shouts another, and the moment is gone. The crowd comes down the steps and around you like a flood around a post. Mags passes so close her torch singes your sleeve. "You had your say, stranger," she says. "Now we\'ll have ours." The carts are already rolling. The old and the slow will take till past midnight to reach the mission; fire, once it gets there, will take no time at all. You have perhaps half a night\'s lead, if you run now and do not stop.',
      {
        effects: { flag: 'mob-coming' },
        choices: [
          {
            id: 'run',
            label: 'Run. Reach the gate before their fire does.',
            to: 'run-back',
          },
        ],
      },
    ),
    s(
      'a6-mob-lead',
      CH.VI,
      'Fire Does Not Choose',
      'torch-mob',
      'You take a torch from the crate. Mags looks at you a long moment, then nods, and the town falls in behind the stranger with the sword as if it had been waiting all along for someone to walk first. You lead them out past the last lamp and onto the mission road. The carts are slow and the old are slower, and the torches stretch out behind you in a line a mile long, beautiful and terrible. Fire does not ask which room the children sleep in. You hand your torch to the farrier, point him up the road, and run on ahead into the dark to get there first.',
      {
        effects: { flag: 'mob-coming' },
        choices: [
          { id: 'run', label: 'Run ahead of the fire.', to: 'run-back' },
        ],
      },
    ),
    s(
      'a6-mob-slip',
      CH.VI,
      'Alone, Again',
      'dust-road',
      'You step back out of the light while every eye is on Mags, and you are gone before the first torch is lit. From the ridge above town you look back: a river of small fires pouring out of Dustwater onto the mission road, slow and certain, singing something you cannot make out. They will reach the mission before dawn. So could you, if you ran and did not stop. Or you could turn east, where there are other towns with other walls of names, and carry what you know to them instead, and let the fire do what fire does.',
      {
        effects: { flag: 'mob-coming' },
        choices: [
          {
            id: 'run',
            label: 'Run for the mission, ahead of the fire.',
            to: 'run-back',
          },
          {
            id: 'warn',
            label: 'Turn east and warn the settlements.',
            to: 'ending-warning',
          },
        ],
      },
    ),
  ],
  extend: {
    posters: [
      {
        id: 'read',
        label: 'Walk the length of the wall and read the names.',
        to: 'a6-wall',
      },
      {
        id: 'badger',
        label: 'Watch the badger nailing a fresh notice to the last post.',
        to: 'a6-badger',
      },
      {
        id: 'pilgrim',
        label:
          'Carry the sleeping girl from the wagon straight into the saloon.',
        to: 'a6-pilgrim-girl',
        needs: 'honor:freed-the-pilgrim',
        hint: 'You carry nothing into town but dust.',
      },
    ],
    saloon: [
      {
        id: 'pilgrim',
        label: 'Lay the sleeping child from the wagon down on the bar.',
        to: 'a6-pilgrim-girl',
        needs: 'honor:freed-the-pilgrim',
        hint: 'You carry nothing in but dust.',
      },
      {
        id: 'lark',
        label: 'Look at the notice she keeps pinned above the bottles.',
        to: 'a6-lark',
        needs: 'clue:bowl',
        hint: 'It is one more face on one more notice. You carry nothing of his.',
      },
    ],
    'saloon-truth': [
      {
        id: 'lark',
        label: 'Look at the notice she keeps pinned above the bottles.',
        to: 'a6-lark',
        needs: 'clue:bowl',
        hint: 'It is one more face on one more notice. You carry nothing of his.',
      },
      {
        id: 'who',
        label: 'Ask her who sends the children up that road.',
        to: 'a6-mags-vane',
      },
    ],
  },
  reroute: {
    // A failed plea no longer skips the act: Mags turns away, but the town still talks.
    'saloon/press#failure': 'a6-mags-cold',
  },
}
