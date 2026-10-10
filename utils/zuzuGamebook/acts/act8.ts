import type { Act } from '../types'
import { CH, s } from '../sections'

/**
 * Act VIII · The Dark (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5; Book One ch. 8). Entry
 * `mission-night`; exits `rescue`, `rescue-quiet`, `last-breath` (via the shipped fights), the shipped endings,
 * and `ending-bargain` / `ending-ashes`.
 *
 * The altar is under the house (Act V's locked-door stair), so the shipped "upstairs" chant leads down. Approaches
 * from `mission-night`: alone (`a8-stair`), with Wren (`wren-ally`), the coyote (`ally-coyote`), Hollis's band
 * (`ally-raiders`), the mob at the gate (`mob-coming`: fire unless `mob-held`), or the crypt passage. The other
 * children first (`children-freed`, and the altar late: the Abbess at knifepoint) or the altar first (in time; the
 * cells may be empty after). The thing speaks aloud after the Abbess falls (`a8-voice`) or when she stabs Zuzu
 * (`stabbed/fight` -> `a8-voice-wound`). The sister's dagger (`last-breath` -> `sister-saves`) is untouched.
 *
 * Flags for later acts: `children-freed`, `clapper`, `honor:refused-the-dark`, `taint:killed-the-abbess`,
 * `sister-free`, `mob-held` / `honor:held-the-mob` (the mob stilled at the gate), `met:kit`; deeds
 * `honor:the-others-first`, `honor:spared-the-abbess`, `honor:let-her-run`, `honor:returned-the-gun`,
 * `taint:killed-the-keeper`, `taint:asked-the-wall`; `cells-emptied` (the cells were found empty).
 */
export const ACT_VIII: Act = {
  scenes: [
    // Approach: alone (mission-night/upstairs). The altar is under the house (Act V); the dilemma: cells or altar.
    s(
      'a8-stair',
      CH.VIII,
      'The Wrong Way Up',
      'refectory',
      'You take the stair two steps at a time toward the chanting, and at the top it is not there. The dormitory is dark, the cots stripped. The chanting is under you, coming up through the old walls the way water comes up through sand. You go back down, past the refectory, and the locked door at the end of the passage is not locked tonight. At the foot of the cellar stair the passage splits. To the left, a corridor of low doors, and behind one of them small fists knocking on wood, slow and patient, the way a child knocks who no longer expects anyone to come. Ahead, candlelight, and the chanting, and the two you came for. You cannot be in both places.',
      {
        choices: [
          { id: 'cells', label: 'Left, to the knocking.', to: 'a8-cells' },
          {
            id: 'altar',
            label: 'Ahead, to the chanting and the two of them.',
            to: 'a8-altar-door',
          },
          {
            id: 'crypt',
            label:
              'Neither: into the dark of the old crypt behind the altar. (Shadow · 9)',
            to: 'a8-crypt',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'a8-crypt',
              failure: 'a8-crypt-lamp',
            },
          },
        ],
      },
    ),
    // Approach: with Wren (wren-ally, Act V).
    s(
      'a8-wren-door',
      CH.VIII,
      'Wren at the Kitchen Door',
      'wren',
      'The kitchen door opens before you touch it. Sister Wren stands there with a shaded lamp and a ring of keys she should not have, her face white inside her wimple. "They took the two down when the supper bell should have rung," she whispers. "The others are under the floor, in the old cells. I can open any door in this house. I can\'t open two at once, and I can\'t stand in front of her." She holds out the keys, and her paw is shaking so hard that they ring. "Tell me which."',
      {
        choices: [
          {
            id: 'cells',
            label: 'Give her the cells; take the cellar stair yourself.',
            to: 'a8-altar-door',
            flag: 'children-freed',
          },
          {
            id: 'sacristy',
            label: 'Ask her to open the sacristy stair behind the altar.',
            to: 'a8-sacristy',
          },
          {
            id: 'crypt',
            label: 'Ask her for the crypt, and for what the Abbess hid there.',
            to: 'a8-crypt',
          },
          {
            id: 'away',
            label: 'Send her away from all of this.',
            to: 'a8-stair',
          },
        ],
      },
    ),
    s(
      'a8-sacristy',
      CH.VIII,
      'The Sacristy Stair',
      'chapel',
      "Wren leads you through the vestry, between cupboards that smell of wax and old linen, to a narrow stair you never saw. She unlocks the door at its foot with a key she has been holding in her mouth so it would not ring against the others. Beyond it is the back of the altar. The ring of nuns kneels facing the other way, toward the door you would have come through. The dark is so close here that the flame in Wren's lamp leans sideways and will not straighten. Wren does not come through. She holds the door, which is all she said she could do, and it is a great deal.",
      {
        choices: [
          {
            id: 'ropes',
            label: 'Step out behind the ring and cut the ropes.',
            to: 'rescue-quiet',
          },
          { id: 'sword', label: 'Step out sword first.', to: 'cellar' },
        ],
      },
    ),
    // Approach: with the coyote (ally-coyote, Act VII).
    s(
      'a8-coyote-split',
      CH.VIII,
      'Two of Us',
      'coyote-bandaged',
      'The coyote crouches beside you in the refectory doorway, breathing hard from the run, and looks at the overturned bowl and the spoon on the floor. He does not ask what this place is. He tips his head at the stair, listening. "That ain\'t upstairs," he says. "That\'s under us." Then you both hear it, fainter, from somewhere under the floor: something small knocking on wood. He flexes the pinned sleeve where his gun hand used to be. "Can\'t hold a sword. I can still open a door. Which one?"',
      {
        choices: [
          {
            id: 'cells',
            label: 'Send him to the knocking while you take the cellar stair.',
            to: 'a8-altar-door',
            flag: 'children-freed',
          },
          {
            id: 'with',
            label: 'Take him down the cellar stair with you.',
            to: 'a8-two-blades',
          },
          {
            id: 'gun',
            label: 'Put his revolver back into his left hand.',
            to: 'a8-coyote-gun',
            needs: 'kept-gun',
            unless: 'gun-traded',
            hint: 'You have nothing of his to give back.',
          },
        ],
      },
    ),
    s(
      'a8-coyote-gun',
      CH.VIII,
      'Left-Handed',
      'coyote-bandaged',
      'You draw the revolver from your sash, the one that went into the shallows at the watering hole a lifetime ago, and hold it out to him butt first. He looks at it for a long time without taking it. Then he does, in his left hand, and weighs it, and turns the cylinder with a clumsy thumb, slow, listening to each click. "Never shot left-handed," he says. "Guess we\'ll find out." It is the first time you have seen him smile with both sides of his mouth. It is not much of a smile. It will do.',
      {
        effects: { flag: 'honor:returned-the-gun' },
        choices: [
          {
            id: 'with',
            label: 'Down the cellar stair together.',
            to: 'a8-two-blades',
          },
          {
            id: 'cells',
            label: 'Send him to the knocking while you take the cellar stair.',
            to: 'a8-altar-door',
            flag: 'children-freed',
          },
        ],
      },
    ),
    s(
      'a8-two-blades',
      CH.VIII,
      'The Coyote Holds the Stair',
      'coyote-bandaged',
      'The nuns come out of the dark at the foot of the cellar stair, knives in their soft paws, faces still kind, and the coyote steps in front of you. He has no sword hand and he does not need one. He has a narrow passage, and a growl that starts somewhere under his ribs, and the plain willingness to be hurt. The nuns hesitate. Nobody has stood in their way before, not in forty years. "Go on," he says, without looking round. You go past him, toward the candlelight, and the Abbess is already at the altar.',
      { choices: [{ id: 'on', label: 'To the altar.', to: 'a8-knifepoint' }] },
    ),
    // Approach: with Hollis's band (ally-raiders, Act VII).
    s(
      'a8-raiders-wall',
      CH.VIII,
      'Hollis at the Wall',
      'dry-well',
      'Hollis comes over the wall first, then her band, jackals all ribs and eyes, landing soft in the yard one after another. They lift their noses. Bread. Oil. A full larder. You see what the smell does to them, and so does Hollis. "We came for the debt," she says. "My lot will carry the little ones out of whatever hole they keep them in. Then the larder\'s ours, every sack. That\'s my price, and it\'s cheap." Behind her the youngest of her band is already looking at the kitchen door the way the toddler looked at stew.',
      {
        choices: [
          {
            id: 'agree',
            label:
              'Agree: her band takes the children out, and the larder is theirs.',
            to: 'a8-altar-door',
            flag: 'children-freed',
          },
          {
            id: 'gate',
            label:
              'Set them on the gate instead, so that no nun leaves this house.',
            to: 'a8-stair',
          },
        ],
      },
    ),
    // Approach: with the mob (mob-coming, Act VI). Not held, it brings fire; ending-ashes waits down this road.
    s(
      'a8-mob-gate',
      CH.VIII,
      'Torches at the Gate',
      'mob-fire-gate',
      'Behind you on the road the dark is full of small fires coming closer: Dustwater, a long ragged line of torches, and at the front of it Mags with her scattergun across her chest. Nobody is talking. They do not stop at the gate. A boy you do not know swings his torch once around his head and lets it go, and it turns over and over in the air and lands on the chapel roof, and the old dry timber takes it like a breath. The children are inside, you could tell them, if you were a creature who talked. Somebody else throws.',
      {
        choices: [
          {
            id: 'stand',
            label: 'Stand in the gateway and make them see you. (Mercy · 11)',
            to: 'a8-mob-stilled',
            check: {
              attribute: 'mercy',
              target: 11,
              success: 'a8-mob-stilled',
              failure: 'a8-fire-spreads',
              bonus: { flag: 'met:mags', amount: 2 },
            },
          },
          {
            id: 'cells',
            label: 'Leave them. Run for the cellar before the fire does.',
            to: 'a8-fire-cells',
          },
          {
            id: 'altar',
            label: 'Leave them. Run for the chanting and the two of them.',
            to: 'a8-fire-altar',
          },
        ],
      },
    ),
    s(
      'a8-mob-stilled',
      CH.VIII,
      'The Gateway',
      'mob-fire-gate',
      'You stand in the open gate with your arms out and your sword still on your back, a small round shape against the burning roof, and you do not move. The next torch does not come. Mags looks at you for a long moment over the scattergun. Then she looks at the chapel, and at the low barred windows along the ground, and you watch her understand what is under the floor. "Water," she says, not loudly, and the line breaks into buckets and blankets. The roof still smokes. It will not take the house tonight.',
      {
        effects: { flags: ['mob-held', 'honor:held-the-mob'] },
        choices: [
          {
            id: 'send',
            label: 'Send Mags to the cells; take the cellar stair yourself.',
            to: 'a8-altar-door',
            flag: 'children-freed',
          },
          {
            id: 'with',
            label: 'Go down to the cells with her.',
            to: 'a8-mags-cells',
          },
        ],
      },
    ),
    // Approach: the mob held (mob-held, Act VI): Mags comes in alone.
    s(
      'a8-mob-waits',
      CH.VIII,
      'Lanterns, Not Torches',
      'mission',
      'At the gate behind you the road is full of lights, but they are lanterns, not torches, and they have stopped where Mags told them to stop. She comes through the gate alone, with her scattergun across her chest and a lantern in her other paw, and looks at the dark mission the way you would look at a grave you had been told was empty. "They\'ll wait," she says. "I said they would. I didn\'t say how long." She looks down at the floor under your feet as if she could see through it. "Where do they keep them?"',
      {
        choices: [
          {
            id: 'send',
            label: 'Send Mags to the cells; take the cellar stair yourself.',
            to: 'a8-altar-door',
            flag: 'children-freed',
          },
          {
            id: 'with',
            label: 'Go down to the cells with her.',
            to: 'a8-mags-cells',
          },
        ],
      },
    ),
    s(
      'a8-mags-cells',
      CH.VIII,
      'Mags Looks',
      'cellar-cells',
      'Mags does not bother with the bolts. She puts the butt of the scattergun through each lock in turn, and the children come out into her lantern light: two young foxes holding paws, a raccoon girl with her hair cut short, a porcupine no bigger than the toddler, and a rabbit kit who does not speak. She looks at every face, slowly, one after another, the way you would read the names on a wall. Her boy is not among them. You knew he would not be; so did she. She picks up the smallest anyway and holds it against her shoulder. Beyond the wall, the chanting rises.',
      {
        effects: { flags: ['children-freed', 'honor:the-others-first'] },
        choices: [
          {
            id: 'altar',
            label: 'Leave them to her and go to the chanting.',
            to: 'a8-knifepoint',
          },
          {
            id: 'kit',
            label: 'Follow the kit, who is tugging you toward the old crypt.',
            to: 'a8-kit-crypt',
          },
        ],
      },
    ),
    s(
      'a8-fire-spreads',
      CH.VIII,
      'The Roof Catches',
      'mob-fire-gate',
      'They do not see you, or they see you and it does not matter. A second torch, a third. The chapel roof goes up in one long sheet of light, and the heat comes across the yard and hits you like a wall, and somebody in the crowd starts, unbelievably, to cheer. Embers drift over the yard like snow. Smoke is already pouring from the low barred windows along the ground: the cellar. Under it all, through the roar, you can still hear the chanting, steady as a heartbeat, as if fire were nothing to it.',
      {
        effects: { hurt: 1 },
        choices: [
          {
            id: 'cells',
            label: 'Down through the smoke to the cells. (Steel · 11)',
            to: 'a8-fire-cells',
            check: {
              attribute: 'steel',
              target: 11,
              success: 'a8-fire-cells',
              failure: 'ending-ashes',
            },
          },
          {
            id: 'altar',
            label: 'Down through the smoke to the altar and the two of them.',
            to: 'a8-fire-altar',
          },
        ],
      },
    ),
    s(
      'a8-fire-cells',
      CH.VIII,
      'Through the Smoke',
      'cellar-cells',
      'You go in low under the smoke, eyes streaming, a sleeve over your nose. The cellar corridor is already hot. The doors have bolts on the outside and you draw them blind, by feel, one after another, and small paws find yours in the dark: two, then four, then more. You count them by touch. Five. You drag and carry and push them up through the coal hatch into the yard, coughing, into the light of the burning roof, and the crowd at the gate goes silent all at once, as if every one of them had been struck. Mags drops her torch.',
      {
        effects: {
          flags: ['children-freed', 'honor:the-others-first'],
          hurt: 2,
        },
        choices: [
          {
            id: 'altar',
            label: 'Back down through the smoke to the chanting.',
            to: 'a8-knifepoint',
          },
        ],
      },
    ),
    s(
      'a8-fire-altar',
      CH.VIII,
      'Smoke at the Altar',
      'altar',
      'The cellar stair is a throat of smoke and the altar room is full of firelight. The ring of nuns has broken; they run past you with their sleeves over their faces and none of them looks at you. The Abbess is nowhere. Only the chanting nun stays on her knees, chanting. You cut the sister free and she takes her brother in her arms without a word. Then you feel it through the soles of your feet and the stones of the wall to your left: heat. The house above is falling into its own cellar, and the cells are on that side.',
      {
        effects: { flag: 'sister-free' },
        choices: [
          {
            id: 'back',
            label: 'Get them out, then go back for the cells. (Steel · 11)',
            to: 'a8-fire-cellar-late',
            check: {
              attribute: 'steel',
              target: 11,
              success: 'a8-fire-cellar-late',
              failure: 'ending-ashes',
            },
          },
          { id: 'out', label: 'Get them out. Only them.', to: 'ending-ashes' },
        ],
      },
    ),
    s(
      'a8-fire-cellar-late',
      CH.VIII,
      'The Cell Doors',
      'zuzu-bandage',
      'You put the two of them out through the coal hatch and go back in. The cell corridor is red. The bolts burn your paws and you draw them anyway, and small shapes come out of the dark on their hands and knees, low under the smoke, the way you showed them with your own body. You count them past you up the hatch. Five. When you come out into the yard your fur is smoking, and Dustwater has dropped its torches, and nobody, not even Mags, can look at you. Below, in the burning house, the chanting has not stopped.',
      {
        effects: { flags: ['children-freed'], hurt: 2 },
        choices: [
          {
            id: 'down',
            label: 'Down once more, to the chanting.',
            to: 'rescue',
          },
        ],
      },
    ),
    // Free the other children first: time spent here sends Zuzu to the altar late (a8-knifepoint).
    s(
      'a8-cells',
      CH.VIII,
      'The Cells',
      'cellar-cells',
      'The corridor is old timber, lit by one candle in a tin sconce. Doors line both sides, each with a slot at the bottom for a bowl. The knocking stops when you turn the corner. Behind the slots eyes catch the candlelight, low down, at the height of very small faces. At the far end a young nun sits asleep on a stool, chin on her chest, a ring of keys on her belt and her paws folded in her lap. Through the wall at your back the chanting goes on, muffled now, like a voice under water. Every breath you spend here, it goes on.',
      {
        choices: [
          {
            id: 'keys',
            label:
              'Lift the keys from her belt without waking her. (Shadow · 9)',
            to: 'a8-cells-open',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'a8-cells-open',
              failure: 'a8-jailer-wakes',
            },
          },
          {
            id: 'feather',
            label: 'Look at the sleeping nun through the feather.',
            to: 'a8-jailer-feather',
            needs: 'feather',
            hint: 'You have only your own eyes.',
          },
          {
            id: 'wake',
            label: 'Wake her with the edge of the sword under her chin.',
            to: 'a8-jailer-wakes',
          },
        ],
      },
    ),
    s(
      'a8-jailer-wakes',
      CH.VIII,
      'The Keeper of Keys',
      'cellar-cells',
      'Her eyes open on steel. She is younger than you thought, barely more than a novice, and she does not reach for the knife on her belt. She pulls the keys off it herself and holds them out to you in both paws, shaking so hard they ring. "Please," she whispers. "I only bring the bowls. I only ever bring the bowls." Behind the doors nobody makes a sound. They are listening to learn what kind of creature you are. Through the wall the chanting drops to a murmur, then rises.',
      {
        choices: [
          {
            id: 'bind',
            label: 'Bind her paws with her own cord and take the keys.',
            to: 'a8-cells-open',
          },
          {
            id: 'kill',
            label: 'Cut her down before she can cry out.',
            to: 'a8-cells-open',
            flag: 'taint:killed-the-keeper',
          },
        ],
      },
    ),
    s(
      'a8-jailer-feather',
      CH.VIII,
      'Through the Feather',
      'cellar-cells',
      'You hold the black feather to your eye and the candle goes thin and blue. Through it the sleeping nun is not asleep. She is a girl in a borrowed habit, holding very still with her eyes shut because she heard the door, and she is so frightened that her face is almost clear, like paper held up to a lamp. There is nothing hungry in her at all. Only fear, and under the fear, shame. When you lower the feather she opens her eyes, unhooks the keys and puts them into your paw. Then she runs, barefoot, the other way.',
      {
        choices: [
          { id: 'open', label: 'Open the doors.', to: 'a8-cells-open' },
        ],
      },
    ),
    s(
      'a8-cells-open',
      CH.VIII,
      'Small Faces',
      'cellar-cells',
      'The bolts are stiff and you draw them one by one. Five children come out of the dark: two young foxes holding paws, a raccoon girl with her hair cut short, a porcupine no bigger than the toddler, and last a rabbit kit who does not speak and does not need to. It was the kit who knocked. He shows you, with one paw on the door: slow and even, like a bell, so the others would know someone was still awake. The smallest asks if it is morning. It is not. Through the wall the chanting has found a new edge, and you know what the bolts have cost.',
      {
        effects: { flags: ['children-freed', 'honor:the-others-first'] },
        choices: [
          {
            id: 'out',
            label:
              'Send them up the coal hatch toward the ridge, and tell them not to stop.',
            to: 'a8-children-run',
          },
          {
            id: 'down',
            label: 'Let the kit lead them where he is pointing: deeper in.',
            to: 'a8-kit-crypt',
          },
        ],
      },
    ),
    // The act's moment of beauty: the sky, after the cells.
    s(
      'a8-children-run',
      CH.VIII,
      'Under the Stars',
      'zuzu-alone',
      'You put them up through the coal hatch one at a time and climb out after them into the yard. The night is enormous and very clear, every star out, the ridge a black line under them. The foxes go first, then the raccoon girl with the porcupine on her back. None of them looks back at the mission. At the low place in the wall the smallest stops, points up at all that sky, and says, in a voice that has not been used much, "Oh." Then they are gone into the dark. Only the kit stays, holding the hem of your poncho, looking back at the hatch.',
      {
        choices: [
          {
            id: 'altar',
            label: 'Back down, to the chanting.',
            to: 'a8-knifepoint',
          },
          {
            id: 'kit',
            label: 'Follow the kit back down, into the old crypt.',
            to: 'a8-kit-crypt',
          },
        ],
      },
    ),
    s(
      'a8-kit-crypt',
      CH.VIII,
      'Where the Kit Points',
      'rabbit-kit',
      'The kit leads you past the cells and through a gap in the old wall into the crypt that runs behind the altar. Niches hold bones wrapped in old black habits. At the far end the wall is not wall: it is dark the way deep water is dark, and the air in front of it moves slowly in and out. The kit will not look at it. He goes to one niche, low by the floor, points inside with his whole arm, and then puts both paws over his ears. He has been here before. Someone once made him carry something down here, and he remembers where.',
      {
        effects: { flag: 'met:kit' },
        choices: [
          { id: 'reach', label: 'Reach into the niche.', to: 'a8-clapper' },
        ],
      },
    ),
    // Straight to the altar first, then back for the others: they may still be there.
    s(
      'a8-cells-late',
      CH.VIII,
      'Still Here',
      'cellar-cells',
      'You take the cellar passage at a run and find the low doors, and the bolts, and behind the bolts the children are still there: two young foxes, a raccoon girl, a porcupine, and a silent rabbit kit who has been knocking on his door all this while, slow and even like a bell, so that the others would not sleep. They come out blinking. You send them up the coal hatch to wait by the wall and tell them, with your paws, not to look back. They do not. They have had a great deal of practice.',
      {
        effects: { flag: 'children-freed' },
        choices: [{ id: 'back', label: 'Back to the altar.', to: 'rescue' }],
      },
    ),
    // ...or they may be gone.
    s(
      'a8-cells-gone',
      CH.VIII,
      'Gone',
      'empty-cot',
      'The low doors stand open. The bolts are drawn. In the cells there is nobody: bowls licked clean, a blanket folded very neatly, a small shoe on its side, and in the candle dust on the floor the prints of soft sandals and smaller bare feet going out by the far stair, toward the yard and whatever waits beyond it. While you were at the altar somebody came down here. You do not know who, or where they went, or whether the children went willingly. You will not know tonight.',
      {
        effects: { flag: 'cells-emptied' },
        choices: [{ id: 'back', label: 'Back to the altar.', to: 'rescue' }],
      },
    ),
    // Approach: by the crypt passage (mission-night/passage, or from the stair or Wren). The clapper is here.
    s(
      'a8-crypt',
      CH.VIII,
      'The Crypt',
      'abbess-crypt',
      'Past the turning the cellar becomes something older. A long low crypt runs behind the altar room, its walls cut into niches, each holding a bundle of bones wrapped in an old black habit, each with a stub of black candle burned out before it. At the far end, through a low arch, is the candlelight of the altar, and the chanting, very close. Beside the arch the wall is not wall. It is dark the way deep water is dark, and the air in front of it moves in and out, slow as sleep. If the Abbess hid anything in this house, she hid it among the dead.',
      {
        choices: [
          {
            id: 'search',
            label: 'Search the niches by candlelight. (Sense · 9)',
            to: 'a8-clapper',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a8-clapper',
              failure: 'a8-wall-whisper',
              bonus: { flag: 'clue:clapperless', amount: 2 },
            },
          },
          {
            id: 'ask',
            label: 'Stand before the dark wall and ask it.',
            to: 'a8-wall-whisper',
          },
          {
            id: 'arch',
            label:
              'Leave the dead alone and slip through the arch. (Shadow · 9)',
            to: 'rescue-quiet',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'rescue-quiet',
              failure: 'a8-knifepoint',
            },
          },
        ],
      },
    ),
    s(
      'a8-crypt-lamp',
      CH.VIII,
      'A Lamp in the Crypt',
      'locked-door',
      'Halfway along the dark a lamp comes to meet you, and behind the lamp a nun. She is young, and she carries a basin in her other paw, and the water in it is dark. For one long moment you stand nose to nose in the narrow way between the niches and neither of you breathes. The lamp shakes. A drop of whatever is in the basin falls on your foot, warm. Then her mouth opens, and you can see the scream gathering in it, and everything you came here for is on the other side of that scream.',
      {
        choices: [
          {
            id: 'grab',
            label:
              'Paw over her mouth, blade where she can see it. (Steel · 9)',
            to: 'a8-crypt',
            check: {
              attribute: 'steel',
              target: 9,
              success: 'a8-crypt',
              failure: 'cellar',
            },
          },
          {
            id: 'let',
            label: 'Step aside into a niche and let her run.',
            to: 'cellar',
            flag: 'honor:let-her-run',
          },
        ],
      },
    ),
    s(
      'a8-wall-whisper',
      CH.VIII,
      'The Wall Answers',
      'the-dream',
      'You do not hear the wall so much as remember it, the way you remember a word that is on the tip of your tongue. It knows what you are looking for. It knows where she put it; it watched her do it, years ago, with her sleeves rolled up. It will tell you. It only wants you to stand a little closer while it does, close enough that the slow air touches your face, close enough to smell the sweetness under the candle smoke. You find you have already taken a step. The candle in your paw is leaning toward the dark.',
      {
        choices: [
          {
            id: 'listen',
            label: 'Let it tell you.',
            to: 'a8-clapper',
            flag: 'taint:asked-the-wall',
            heal: 2,
          },
          {
            id: 'tear',
            label: 'Tear yourself away and go through the arch.',
            to: 'a8-knifepoint',
          },
        ],
      },
    ),
    s(
      'a8-clapper',
      CH.VIII,
      "The Bell's Tongue",
      'bell-tower',
      "Wrapped in a nun's habit at the back of the niche, under a skull no bigger than an apple, is a length of black iron as long as your forearm, swollen at one end like a seed. The bell's clapper. A cut rope is still knotted through its eye, the ends stiff with old wax. Somebody cut it out of the bell so that the bell could never call for help, and hid it among the dead, where nobody would look, because nobody in this house looks at the dead. It is heavy and cold. You push it through your sash beside the sword.",
      {
        effects: { flag: 'clapper' },
        choices: [
          {
            id: 'quiet',
            label: 'Through the arch to the altar, quietly. (Shadow · 9)',
            to: 'rescue-quiet',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'rescue-quiet',
              failure: 'a8-knifepoint',
            },
          },
          {
            id: 'sword',
            label: 'Through the arch with the sword out.',
            to: 'a8-knifepoint',
          },
        ],
      },
    ),
    // Straight to the altar: in time, but the cells are left behind.
    s(
      'a8-altar-door',
      CH.VIII,
      'The Door at the End',
      'chapel',
      'At the end of the cellar passage a heavy door stands an inch open, and the chanting comes through the gap with the light. You put your eye to it. Candelabra. A ring of nuns on their knees with their backs to you. Beyond them the altar, and on it the two shapes you came for, one small and still and one fighting her ropes without a sound. Behind the altar the air itself is wrong, folded, like a curtain with someone standing behind it. Nobody has seen you yet. That will last exactly as long as you let it.',
      {
        choices: [
          {
            id: 'in',
            label: 'Kick the door wide and go in with the sword.',
            to: 'cellar',
          },
          {
            id: 'slip',
            label:
              'Wait for the chant to break for breath, then slip in. (Shadow · 9)',
            to: 'rescue-quiet',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'rescue-quiet',
              failure: 'cellar',
            },
          },
        ],
      },
    ),
    // Past the nuns without a fight: the feather shows which nun is afraid.
    s(
      'a8-afraid-nun',
      CH.VIII,
      'The One Who Is Afraid',
      'altar',
      'You hold the feather to your eye and the ring of nuns changes. Through it their kind faces are lamps with nothing inside, hollow and patient and hungry, every one of them but one. The smallest, at the end of the ring nearest the altar, is only a frightened otter in a habit too big for her, and her knife is shaking. You let her see that you see her. She looks at the knife in her paw as if she does not know how it got there, sets it down on the stone, and steps back out of the ring. The gap she leaves runs straight to the altar. The Abbess sees it when you do.',
      {
        choices: [
          {
            id: 'gap',
            label: 'Through the gap, to the altar.',
            to: 'a8-knifepoint',
          },
        ],
      },
    ),
    // The Abbess at knifepoint: trust her (sometimes she keeps her word), refuse, or strike.
    s(
      'a8-knifepoint',
      CH.VIII,
      'Leave Now',
      'abbess-knife',
      'The Abbess reaches the altar first. She does not hurry; she has never needed to. Her small curved dagger lies along the sister\'s throat, and her other paw strokes the girl\'s ears flat, gently, the way you would calm a frightened animal. The toddler lies limp beside them. Behind the altar the folded dark leans closer, and every candle flame bends toward it. "Leave now," the Abbess says, "and the girl lives." Her voice is warm. She sounds as if she would like to pack you some bread for the road. The sister\'s eyes are on you, and they are not asking you to go.',
      {
        choices: [
          {
            id: 'trust',
            label:
              'Watch her paws, lower your sword and step back. (Sense · 9)',
            to: 'a8-word-kept',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a8-word-kept',
              failure: 'a8-word-broken',
              bonus: { flag: 'clue:look-at-the-hands', amount: 2 },
            },
          },
          {
            id: 'refuse',
            label: 'Do not move. Do not lower the blade.',
            to: 'a8-standoff',
          },
          {
            id: 'strike',
            label:
              'Close the distance and strike before her paw can move. (Steel · 11)',
            to: 'a8-abbess-down',
            check: {
              attribute: 'steel',
              target: 11,
              success: 'a8-abbess-down',
              failure: 'stabbed',
            },
          },
          {
            id: 'nod',
            label: "Meet the sister's eyes and nod once.",
            to: 'a8-sister-bites',
            needs: 'sister-trust',
            hint: 'She does not trust you enough to act on a nod.',
          },
        ],
      },
    ),
    s(
      'a8-word-kept',
      CH.VIII,
      'Her Word',
      'abbess-knife',
      'You lower the sword and take one step back, then another. The Abbess watches your paws, not your face. Then, with a small nod, as if you had learned a lesson well, she cuts the sister\'s ropes with one neat stroke and pushes her off the altar toward you. "There," she says. "I am not a liar. The girl lives. The little one was always spoken for." The sister lands on her knees, and before you can reach her she is up again with a fallen dagger in both bandaged hands, and she is not running to you. She is running back.',
      {
        effects: { flag: 'sister-free' },
        choices: [{ id: 'after', label: 'Go after her.', to: 'abbess' }],
      },
    ),
    s(
      'a8-word-broken',
      CH.VIII,
      'What Her Word Is Worth',
      'abbess-knife',
      'You lower the sword and take one step back. It is the step she was waiting for. The doorway behind you has not been empty for some time; you hear a habit rustle as the nun standing there lifts her arm. Over the sister\'s head the Abbess smiles at you with real fondness, the way you would smile at a guest who has finally understood the rules of the house. "There," she says. "Now you know." The sister has been trying to tell you something with her eyes since you came in, and you understand, too late, what it was.',
      {
        choices: [
          { id: 'turn', label: 'Twist away from the door.', to: 'stabbed' },
        ],
      },
    ),
    s(
      'a8-standoff',
      CH.VIII,
      'The Long Breath',
      'abbess-knife',
      'You stay exactly where you are. The Abbess sighs. "I have done this for forty years," she says, in the voice of someone explaining why bread must rise overnight. "Every town on this road sends me its extra mouths and gets its water back, and not one of them asks how. It is patient, and it is fed, and so it stays where it is. Without me it would take all of you." The knife does not waver. The dark leans closer while she talks, and the sister, very slowly, begins to work one wrist against the rope.',
      {
        choices: [
          {
            id: 'wait',
            label: 'Let her talk, and keep her eyes on you. (Mercy · 9)',
            to: 'a8-standoff-break',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a8-standoff-break',
              failure: 'nuns-attack',
              bonus: { flag: 'sister-trust', amount: 2 },
            },
          },
          { id: 'step', label: 'Step toward her anyway.', to: 'nuns-attack' },
        ],
      },
    ),
    s(
      'a8-standoff-break',
      CH.VIII,
      'One Wrist Free',
      'sister-dagger',
      "You ask her one thing, with your eyes only, and she answers it, because nobody has asked her anything in forty years. She tells you about the first child. She tells you it was a dry year. She is still telling you when the sister's wrist slips the rope and the girl drives her heel into the old otter's knee, and the knife skids away across the altar stone. The Abbess does not cry out. She straightens, slowly, with a second dagger already in her paw from somewhere in her sleeve, and looks at you with something close to respect.",
      {
        effects: { flag: 'sister-free' },
        choices: [{ id: 'face', label: 'Face her.', to: 'abbess' }],
      },
    ),
    s(
      'a8-sister-bites',
      CH.VIII,
      'A Nod',
      'sister-dagger',
      "You meet the sister's eyes and nod, once, the smallest movement you know how to make. She has been waiting for it. She turns her head and bites the paw that is stroking her ears, hard, and the Abbess, for the first time in what must be many years, makes a sound she did not plan. The dagger rings on the stone. By the time it stops spinning you are across the room, and the old otter is on her knees with your blade an inch from her throat, and the sister is spitting, fierce and shaking, on the altar.",
      {
        effects: { flag: 'sister-free' },
        choices: [
          {
            id: 'hold',
            label: 'Hold the blade where it is.',
            to: 'a8-abbess-down',
          },
        ],
      },
    ),
    s(
      'a8-abbess-down',
      CH.VIII,
      'She Pleads',
      'abbess-crypt',
      'On her knees the Abbess is only an old otter, small and round, her habit dusty at the hem. She looks up at you and her eyes fill. "Please," she says. "I am old. I did only what the towns paid me to do; ask them where their water comes from. If you kill me it will come through anyway. Only I know the words that send it back. Please. I can teach you the words." Her paws are open and empty and shaking. Behind her the chanting nun has not stopped, and the folded dark is a little wider than it was.',
      {
        choices: [
          {
            id: 'strike',
            label: 'Strike while she is still pleading.',
            to: 'a8-abbess-killed',
            flag: 'taint:killed-the-abbess',
          },
          {
            id: 'bind',
            label:
              'Bind her paws with the altar rope and leave her for the towns to judge.',
            to: 'a8-abbess-bound',
            flag: 'honor:spared-the-abbess',
          },
        ],
      },
    ),
    s(
      'a8-abbess-killed',
      CH.VIII,
      'Quick',
      'kneeling-blade',
      'It is quick. She looks surprised that it is, as if she had always expected the world to take longer over her than it took over the children. Then she is a small dark heap on the altar steps, and the candles are still burning, and nothing about the dark behind the altar has changed at all. If she knew any words, they are gone with her. The sister saw it. She watches you wipe the blade, and says nothing, and moves her brother a little further from you along the stone.',
      {
        choices: [
          {
            id: 'turn',
            label: 'Turn to the dark behind the altar.',
            to: 'a8-voice',
          },
        ],
      },
    ),
    s(
      'a8-abbess-bound',
      CH.VIII,
      'Rope',
      'abbess-crypt',
      'You bind her paws behind her with the same rope she used on the children, and she lets you, smiling slightly, as if you were a child tying a knot she will undo later. You set her against the wall where she can see the altar and cannot reach it. "They will not judge me," she says. "They will thank me, and send me more." Perhaps. That will be theirs to decide and theirs to carry. The sister saws her brother free with a fallen dagger and gathers him into her lap.',
      {
        choices: [
          {
            id: 'turn',
            label: 'Turn to the dark behind the altar.',
            to: 'a8-voice',
          },
        ],
      },
    ),
    // The thing speaks aloud (after the Abbess is down).
    s(
      'a8-voice',
      CH.VIII,
      'It Speaks',
      'the-dream',
      'The chanting nun does not stop, and now there is a second voice under hers. It does not come from the dark behind the altar. It comes from the stones, from the candle flames, from the inside of your own ears, and it is the most reasonable voice you have ever heard. "Give me the small one," it says, "and I will give you home." And you see it: a road lit from end to end, running east out of this desert and over the mountains, into a valley where a temple bell is about to ring for dusk. It is not a lie. That is the worst of it.',
      {
        choices: [
          {
            id: 'refuse',
            label: 'Stand between it and the altar.',
            to: 'a8-refused',
            flag: 'honor:refused-the-dark',
          },
          {
            id: 'dream',
            label:
              'Lift the small one from the altar. You have walked this road in a dream.',
            to: 'a8-bargain',
            needs: 'taint:dreamed',
            hint: 'It has never shown you its road before.',
          },
          {
            id: 'take',
            label: 'Lift the small one from the altar.',
            to: 'a8-bargain',
            needsTaint: 2,
            unless: 'taint:dreamed',
            hint: 'Nothing in you is willing to hear it out.',
          },
        ],
      },
    ),
    // The thing speaks aloud (stabbed/fight, before the Abbess fight).
    s(
      'a8-voice-wound',
      CH.VIII,
      'In the Wound',
      'altar',
      'The dagger is still in your shoulder when the second voice comes. It does not come from the folded dark behind the altar. It comes from the wound, from the cold of the steel, from the inside of your own ears. "You do not have to fight her," it says, kindly. "Give me the small one, and I will give you home." And you see it: a road lit from end to end, out of this desert and over the mountains, to a valley where a temple bell is about to ring for dusk. It is not a lie. Behind you the Abbess waits, patient, to see what you will do.',
      {
        choices: [
          {
            id: 'refuse',
            label: 'Pull the dagger out of your shoulder and turn to face her.',
            to: 'abbess',
            flag: 'honor:refused-the-dark',
          },
          {
            id: 'dream',
            label:
              'Lift the small one from the altar. You have walked this road in a dream.',
            to: 'a8-bargain',
            needs: 'taint:dreamed',
            hint: 'It has never shown you its road before.',
          },
          {
            id: 'take',
            label: 'Lift the small one from the altar.',
            to: 'a8-bargain',
            needsTaint: 2,
            unless: 'taint:dreamed',
            hint: 'Nothing in you is willing to hear it out.',
          },
        ],
      },
    ),
    s(
      'a8-refused',
      CH.VIII,
      'No',
      'kneeling-blade',
      'You step between the dark and the altar, and you say nothing, because there is nothing to say to it. The road of light hangs a moment longer, the bell in the valley still about to ring. Then it goes out, and you are standing in a cold stone room that smells of candle smoke, a long way from home, with the way back exactly as far as it was before. Behind you the toddler sighs in his sleep. The voice does not argue. It only goes quiet, like something that has all the time in the world.',
      {
        choices: [
          { id: 'nun', label: 'Turn to the chanting nun.', to: 'rescue' },
          {
            id: 'cells',
            label: 'First, the cells along the cellar passage. (Sense · 9)',
            to: 'a8-cells-late',
            unless: 'children-freed',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a8-cells-late',
              failure: 'a8-cells-gone',
            },
          },
        ],
      },
    ),
    // The Bargain: quiet, and terrible.
    s(
      'a8-bargain',
      CH.VIII,
      'The Small One',
      'the-dream',
      'He is lighter than he should be. He does not wake when you lift him; he only turns his face into your poncho, the way he does on the road. Behind you the sister makes a sound, once, that is not a word. She does not make it again. The road of light opens at the back of the altar, just wide enough for one, and the air coming out of it is warm and smells of rain on a temple roof. You carry him to the threshold. You set him down where the light begins, very gently, because you were always gentle with him. Then you let go.',
      {
        choices: [
          { id: 'walk', label: 'Walk down the road.', to: 'ending-bargain' },
        ],
      },
    ),
    s(
      'ending-bargain',
      CH.END,
      'The Bargain',
      'zuzu-moon',
      "The road is everything it promised. It is short, and it is lit, and at the end of it lies the valley where you were born, the terraces green, the temple bell ringing for dusk exactly as it used to. Your mother's door is open. Supper is on the fire. Nobody here has heard of a desert, or a mission, or a bell with no tongue. You sit down and eat, and it tastes of home, and you are home. Only sometimes, late, after the bell has stopped, your arms close on nothing, as if you had carried something small a long way and cannot remember where you put it down.",
      { ending: 'dark' },
    ),
    s(
      'ending-ashes',
      CH.END,
      'Ashes on the Wind',
      'mob-fire-gate',
      'By morning the mission is a black shell, and the bell lies in the coals of its tower where it fell, cracked through, having never once rung. Dustwater stands along the wall with its torches burned down to sticks. Nobody goes home. They are waiting for the cellar to cool enough to look, and they already know what they will find, and they wait anyway, because it is the least they can do and the most. Some time in the night the sister found you in the yard. She has her brother. She has not said how she got out, and you have not asked. The wind takes the ash east, over all of you the same.',
      { ending: 'dark' },
    ),
  ],
  extend: {
    'mission-night': [
      {
        id: 'a8-wren',
        label: 'Whistle softly at the kitchen door.',
        to: 'a8-wren-door',
        needs: 'wren-ally',
        hint: 'No one in this house is on your side.',
      },
      {
        id: 'a8-coyote',
        label: 'Crouch in the doorway with the coyote and listen.',
        to: 'a8-coyote-split',
        needs: 'ally-coyote',
        hint: 'You came here alone.',
      },
      {
        id: 'a8-raiders',
        label: "Signal Hollis's band over the wall.",
        to: 'a8-raiders-wall',
        needs: 'ally-raiders',
        hint: 'Hollis owes you nothing.',
      },
      {
        id: 'a8-torches',
        label:
          'Turn back to the gate: torches are coming up the road behind you.',
        to: 'a8-mob-gate',
        needs: 'mob-coming',
        unless: 'mob-held',
        hint: 'No one followed you from town.',
      },
      {
        id: 'a8-mags',
        label: 'Go back to the gate, where Mags is holding the town.',
        to: 'a8-mob-waits',
        needs: 'mob-held',
        hint: 'No one followed you from town.',
      },
    ],
    cellar: [
      {
        id: 'a8-feather',
        label: 'Look at the ring of nuns through the feather.',
        to: 'a8-afraid-nun',
        needs: 'feather',
        hint: 'You have only your own eyes.',
      },
    ],
  },
  reroute: {
    'mission-night/upstairs': 'a8-stair',
    'mission-night/passage#success': 'a8-crypt',
    'mission-night/passage#failure': 'a8-crypt-lamp',
    'stabbed/fight': 'a8-voice-wound',
  },
}
