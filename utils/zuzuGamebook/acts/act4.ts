import type { Act } from '../types'
import { CH, s } from '../sections'

/**
 * Act IV · The Waste (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5). Entry `canyon-road`, exit
 * `mission-gate`. Order of the road: the canyon floor, the whispering stone face, the dry well and Hollis's
 * band, Brother Peddler's waystation, then the shipped vulture's wagon, the Storm Crow at the crossroads, the
 * storm and the shrine, and the bloom after rain. Flags read by later acts: `feather`, `homeland-lost`,
 * `debt:raider-mother`, `clue:clapperless`, `taint:listened`, `taint:blood`.
 */
export const ACT_IV: Act = {
  scenes: [
    // The canyon floor (canyon-road/long)
    s(
      'a4-canyon-floor',
      CH.IV,
      'The Long Way Down',
      'canyon',
      'The long way down is a goat trail cut in switchbacks across the red wall. By noon the rock is too hot to touch, and the toddler, who has walked without complaint since the apple tree, sits down in the dust and will not get up. His sister pulls at his arm. He is too tired even to cry; he only looks at the bottom of the canyon as if it were the moon. Far below, the dry river glitters with something white.',
      {
        choices: [
          {
            id: 'carry',
            label: 'Lift him onto your back and carry him the rest of the way.',
            to: 'bone-river',
            cost: 1,
            flag: 'sister-trust',
          },
          {
            id: 'wait',
            label: 'Sit down beside him in the thin shade until he is ready.',
            to: 'bone-river',
          },
        ],
      },
    ),

    // The whispering stone face
    s(
      'a4-stone-face',
      CH.IV,
      'The Face in the Bank',
      'stone-face',
      'Where the riverbed bends, the bank has fallen away and something looks out of it. A face, carved from one grey stone, so large that the sister could lie down along its lower lip. No muzzle, no whiskers, no ears that you can see: a flat brow, a narrow ridge of nose, a mouth closed as though it is about to say something reasonable. A crack runs from its brow to its chin. Warm air comes out of the crack, slow and even, the way breath comes out of a sleeper. The toddler takes one step toward it.',
      {
        choices: [
          {
            id: 'listen',
            label:
              'Send the children back to the bend and put your ear to the crack.',
            to: 'a4-face-listen',
          },
          {
            id: 'look',
            label: 'Study the face without going near the crack. (Sense · 9)',
            to: 'a4-face-offerings',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a4-face-offerings',
              failure: 'a4-face-near',
              bonus: { flag: 'relic-seen', amount: 2 },
            },
          },
          {
            id: 'cover',
            label: "Cover the children's ears and walk on.",
            to: 'a4-face-covered',
          },
        ],
      },
    ),
    s(
      'a4-face-listen',
      CH.IV,
      'What the Stone Says',
      'stone-face',
      'The stone is warm against your cheek. For a long time there is only breath. Then words, in no language at all, arriving in your head already understood, the way you understand cold. *The bell to the south has no tongue. It was cut out so that it could never call for help. Below the bell something is hungry. It has been fed for a long time, and it is patient.* Then, softer, almost kind: *You are a long way from home.* When you straighten, your shoulder no longer aches and your mind is as clear as well water. Down at the bend, the toddler is crying and does not know why.',
      {
        effects: {
          flags: ['taint:listened', 'clue:clapperless'],
          heal: 3,
          resolve: 1,
        },
        choices: [
          {
            id: 'on',
            label: 'Take the children and walk south.',
            to: 'a4-dry-well',
          },
        ],
      },
    ),
    s(
      'a4-face-covered',
      CH.IV,
      'Paws Over Small Ears',
      'stone-face',
      "You set a paw over each of the toddler's ears and nod at the sister to do the same for herself. She does, frowning. You have no paws left for your own ears, so you walk fast and hum under your breath, an old marching tune from home, until the river bends and the face is behind the rock. Whatever it said, you did not hear it. Under your paws the toddler's head is warm and very small, and when you let go he reaches up and holds your wrist instead.",
      {
        effects: { flag: 'sister-trust', resolve: 1 },
        choices: [
          {
            id: 'on',
            label: 'Keep walking south along the riverbed.',
            to: 'a4-dry-well',
          },
        ],
      },
    ),
    s(
      'a4-face-offerings',
      CH.IV,
      'Offerings',
      'stone-face',
      'You walk the edge of the face and keep well clear of the crack. At the foot of the chin, where the sand lies sheltered, someone has been coming here. Black candle stubs stand in a row, melted to the stone. Beside them sit small clay cups, each with a dry dark ring in the bottom. In the soft sand are prints: soft sandals, many of them, and among them smaller prints, bare and close together, which come to the face and do not go back the way they came.',
      {
        effects: { flag: 'clue:offerings' },
        choices: [
          {
            id: 'listen',
            label: 'Now put your ear to the crack.',
            to: 'a4-face-listen',
          },
          {
            id: 'on',
            label: 'Take the children away from here.',
            to: 'a4-dry-well',
          },
        ],
      },
    ),
    s(
      'a4-face-near',
      CH.IV,
      'Too Close',
      'stone-face',
      'You lean in to read the crack and the face breathes on you. The air is warm and smells of candle smoke, and of something under the smoke, sweet, the way a larder smells in summer. A word begins in your head and you pull back before it can finish, so hard that you sit down in the sand. The sister already has the toddler by the collar and is dragging him away. You do not know what the word was. You know it was your name.',
      {
        effects: { resolve: -1 },
        choices: [
          {
            id: 'on',
            label: 'Get up. Get them away from it.',
            to: 'a4-dry-well',
          },
        ],
      },
    ),

    // The dry well and the raiders
    s(
      'a4-dry-well',
      CH.IV,
      'The Dry Well',
      'dry-well',
      'Two days south the riverbed gives out in a bowl of broken rock, and in the middle of the bowl stands a well-house of old stone with a wooden lid. There is no other water for a long way; you can tell from the way the birds circle it. Five jackals sit around the well in the shade of the rocks, thin as fence wire, knives across their knees. One of them stands when she sees you. She is grey at the muzzle and her ribs show through her shirt. The sister moves behind you without being told.',
      {
        choices: [
          {
            id: 'walk',
            label: 'Walk down to the well with your paws in plain sight.',
            to: 'a4-well-toll',
          },
          {
            id: 'circle',
            label: 'Circle through the rocks and watch them first. (Sense · 9)',
            to: 'a4-raider-kits',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a4-raider-kits',
              failure: 'a4-well-toll',
            },
          },
          {
            id: 'scout',
            label:
              'Whistle low for whoever has been shadowing you along the rocks since dawn.',
            to: 'a4-well-scout',
            needs: 'debt:looter',
            hint: 'Only someone you once let walk away would answer.',
          },
          {
            id: 'around',
            label: 'Leave them their well and take the long way round, dry.',
            to: 'a4-wide-berth',
          },
        ],
      },
    ),
    s(
      'a4-well-scout',
      CH.IV,
      'A Familiar Thief',
      'dry-well',
      'A small striped shape drops off a ledge in front of you: the young raccoon from Hollow Bell, in a coat still too big for him. He has a jackal\'s rag tied round his arm now. "I scout for them," he says, quick and low. "They ain\'t bad. They\'re hungry. Hollis is going to ask for the girl. Don\'t let her see you think about it." He looks at the sister, then away. "I\'ll tell her you let me walk. Might be it counts for something."',
      {
        effects: { flag: 'met:looter' },
        choices: [
          {
            id: 'vouch',
            label: 'Let him walk you down and speak for you.',
            to: 'a4-well-vouched',
          },
          {
            id: 'alone',
            label: 'Thank him with a nod, and go down alone.',
            to: 'a4-well-toll',
          },
        ],
      },
    ),
    s(
      'a4-well-vouched',
      CH.IV,
      'His Word for Yours',
      'dry-well',
      'The raccoon talks the whole way down, fast, and you understand perhaps half of it. The grey jackal listens with her arms folded. Her name is Hollis; the others say it the way you would say a prayer. When he is done she looks at you a long time. "Drink," she says at last. "One cup each. Then go, and don\'t come back this way." The cup is muddy and warm and the best thing you have tasted in days. Up in the rocks something small whimpers, and every jackal at the well goes still.',
      {
        effects: { heal: 2, flag: 'met:hollis' },
        choices: [
          {
            id: 'share',
            label: 'Climb toward the whimpering with your canteen in your paw.',
            to: 'a4-shared-water',
            requires: 'water',
            spend: 'water',
          },
          {
            id: 'go',
            label: 'Drink your cup and go, as you were told.',
            to: 'a4-waystation',
          },
        ],
      },
    ),
    s(
      'a4-well-toll',
      CH.IV,
      'The Toll',
      'dry-well',
      '"Water\'s ours," says the grey jackal. The others call her Hollis. "Road through the rocks is ours. Toll\'s the girl." She says it plainly, the way you would name a price for salt. "There\'s a house to the south pays in water for small ones. More than you\'ll ever carry." Behind you, the sister\'s paw closes on the back of your belt. Four jackals stand up around the well. Their knives are old and their eyes are older. Not one of them looks as if it wants to do this. Every one of them will.',
      {
        effects: { flags: ['met:hollis', 'clue:water-for-children'] },
        choices: [
          {
            id: 'fight',
            label: 'Put the children behind the rocks and draw.',
            to: 'a4-well-battle',
          },
          {
            id: 'pay',
            label: 'Offer everything you carry instead, your water first.',
            to: 'a4-well-paid',
            requires: 'water',
            spend: 'water',
          },
          {
            id: 'trick',
            label:
              'Make them believe the girl carries the spotted fever. (Shadow · 9)',
            to: 'a4-well-tricked',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'a4-well-tricked',
              failure: 'a4-well-grab',
              bonus: { flag: 'sister-trust', amount: 2 },
            },
          },
          {
            id: 'why',
            label: 'Hold her eye and wait for the rest of it. (Mercy · 9)',
            to: 'a4-hollis-why',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a4-hollis-why',
              failure: 'a4-well-grab',
            },
          },
        ],
      },
    ),
    s(
      'a4-hollis-why',
      CH.IV,
      'Eleven Mouths',
      'dry-well',
      'You do not draw, and you do not look away. After a while Hollis\'s shoulders drop. "You want to know why." She jerks her chin at the rocks behind her. "Well gives a cup an hour. I got eleven mouths, and three of them don\'t have teeth yet. The house in the south gives a barrel for a child. I asked. I ain\'t proud." She is not lying; that is the worst of it. Up in the rocks something small whimpers, and every jackal at the well goes still.',
      {
        choices: [
          {
            id: 'share',
            label: 'Climb toward the whimpering with your canteen in your paw.',
            to: 'a4-shared-water',
            requires: 'water',
            spend: 'water',
          },
          {
            id: 'fight',
            label: 'Understanding changes nothing. Draw.',
            to: 'a4-well-battle',
          },
          {
            id: 'around',
            label: 'Bow, back away, and take the long way round, dry.',
            to: 'a4-wide-berth',
          },
        ],
      },
    ),
    s(
      'a4-well-grab',
      CH.IV,
      'No',
      'dry-well',
      '"No," says Hollis, to whatever you were about to try. She has heard every lie a road can tell and waited out every silence. Two jackals move at once, one for the sister and one for the toddler, and the sister bites the first so hard that he yells and lets go. There is no more talking now. There is only the space between you and them, and the sword on your back, and the children behind you.',
      {
        choices: [
          {
            id: 'fight',
            label: 'Draw.',
            to: 'a4-well-battle',
          },
          {
            id: 'pay',
            label:
              "Throw your canteen at Hollis's feet. Take it. Take everything.",
            to: 'a4-well-paid',
            requires: 'water',
            spend: 'water',
          },
        ],
      },
    ),
    s(
      'a4-well-battle',
      CH.IV,
      'Five Jackals',
      'dry-well',
      'You push the children into a cleft in the rocks and turn. The jackals come together, the way hungry things learn to: one high, one low, one circling to your blind side, Hollis last and smartest. Their knives are old but their hunger is sharp. There are five of them, and they have nothing left to lose, and that makes them more dangerous than anything you have fought since the river.',
      {
        battle: {
          name: "Hollis's Band",
          hp: 10,
          guard: 2,
          attack: 3,
          win: 'a4-well-won',
          lose: 'a4-well-robbed',
        },
      },
    ),
    s(
      'a4-well-won',
      CH.IV,
      'The Band Breaks',
      'dry-well',
      'The last of them runs. Hollis does not; she is on her knees by the well with a cut across her ribs and a knife in her paw that she does not lift. Two of her band lie still in the dust. You did not want that, and it is done. Out of the rocks above, very slowly, come three jackal kits, all ears and bones, and they stand looking at their mother, and at you, and at the sword.',
      {
        effects: { attr: { attribute: 'steel', amount: 1 } },
        choices: [
          {
            id: 'bind',
            label: 'Kneel and bind her wound with your bandage.',
            to: 'a4-waystation',
            requires: 'bandage',
            spend: 'bandage',
            flags: ['honor:bound-her-wound', 'debt:raider-mother'],
          },
          {
            id: 'drink',
            label: "Draw up the well's cupful for your canteen, and go.",
            to: 'a4-waystation',
            gain: 'water',
          },
          {
            id: 'leave',
            label: 'Leave her the well and walk away without looking back.',
            to: 'a4-waystation',
          },
        ],
      },
    ),
    s(
      'a4-well-robbed',
      CH.IV,
      'Robbed and Left',
      'zuzu-bandage',
      'You wake at dusk with sand in your mouth and the sky turning. The jackals are gone, and so is everything they could see: the cookpot, the dried meat, your blanket roll, the coin sewn into your sleeve. They did not find the pack under you where you fell. The sword they left; none of them wanted to be the one to touch it. The sister sits beside you with a rock in her fist and her brother asleep against her back. There is blood on the rock that is not hers. She does not say anything. Neither do you.',
      {
        effects: { flag: 'a4-stripped', heal: 5, resolve: -1 },
        choices: [
          {
            id: 'on',
            label: 'Get up. Walk south.',
            to: 'a4-waystation',
          },
        ],
      },
    ),
    s(
      'a4-well-paid',
      CH.IV,
      'Everything You Carry',
      'dry-well',
      'Hollis takes the canteen and weighs it. Then she takes the rest: the cookpot, the dried meat, your blanket roll, the coin sewn into your sleeve. She looks at what is left in the bottom of the pack, the little you keep back for the children, and closes it again. She looks at your sword a long moment and decides against it. "Fair," she says, and means it. The canteen goes round the band, one mouthful each, and the last of it goes up into the rocks. Nobody looks at the sister now. That was the price.',
      {
        effects: { flag: 'a4-stripped' },
        choices: [
          {
            id: 'on',
            label: 'Walk through their bowl with your pack light.',
            to: 'a4-waystation',
          },
        ],
      },
    ),
    s(
      'a4-well-tricked',
      CH.IV,
      'Spotted Fever',
      'dry-well',
      'You point at the rags on the sister\'s wrists, then touch your own throat and shake your head slowly: sick, dying, catching. She understands faster than you dared hope. She coughs, a wet and terrible cough, and holds her wrists out toward them. Every jackal steps back. Hollis\'s lip lifts off her teeth. "Then she\'s no good to the sisters either," she says, and spits. "Take her and go. Don\'t touch the well." You go. Behind you nobody watches the girl any more. They are watching the road, for the next child.',
      {
        effects: { attr: { attribute: 'shadow', amount: 1 } },
        choices: [
          {
            id: 'on',
            label: 'Walk on before anyone looks too closely.',
            to: 'a4-waystation',
          },
        ],
      },
    ),
    s(
      'a4-raider-kits',
      CH.IV,
      'In the Rocks',
      'raider-kits',
      'You climb the long way round the bowl, keeping low. Halfway up, in a crack too narrow for a grown jackal, you find three kits pressed together, all ears and ribs. Beside them stands a stoppered clay jar. You lift it: water, nearly full. Their mother has been going thirsty to fill it. The smallest kit looks at you without fear, because nothing has yet taught him any. Down at the well, Hollis has started to look for you.',
      {
        choices: [
          {
            id: 'share',
            label:
              'Give the kits water from your canteen, then carry the rest to their mother.',
            to: 'a4-shared-water',
            requires: 'water',
            spend: 'water',
          },
          {
            id: 'hostage',
            label:
              'Lift the smallest kit and carry him down where she can see.',
            to: 'a4-well-hostage',
          },
          {
            id: 'leave',
            label: 'Leave them hidden and walk down to the well.',
            to: 'a4-well-toll',
          },
        ],
      },
    ),
    s(
      'a4-well-hostage',
      CH.IV,
      'Leverage',
      'raider-kits',
      'You come down out of the rocks with the smallest kit held against your chest, and you let Hollis see your other paw resting on your sword. The bowl goes very quiet. She does not beg. She has done worse than this herself, and she knows how it works. "Take what you want," she says. "Then put him down." Her clay jar goes into your pack. You set the kit down on the far side of the well. The sister walks past Hollis without looking at her, and for a long time afterwards she does not look at you either.',
      {
        effects: { flag: 'taint:held-the-kits', gain: 'water' },
        choices: [
          {
            id: 'on',
            label: 'Walk south with the stolen water.',
            to: 'a4-waystation',
          },
        ],
      },
    ),
    s(
      'a4-shared-water',
      CH.IV,
      'Water Shared',
      'raider-kits',
      'In a crack in the rocks three jackal kits are hidden, all ears and ribs. You kneel and pour from your canteen into its cap until each of them has drunk. Then you go down and put what is left into Hollis\'s paws. She looks at the canteen a long time, the way you might look at a knife someone has handed you hilt first. "I don\'t know what you are," she says at last. "But I\'ll know you again." Her band lets you through without a word. One of them, too young for his whiskers, lifts a paw as you pass.',
      {
        effects: {
          flags: ['honor:shared-water', 'debt:raider-mother', 'met:hollis'],
          attr: { attribute: 'mercy', amount: 1 },
        },
        choices: [
          {
            id: 'on',
            label: 'Walk south with an empty canteen and a light step.',
            to: 'a4-waystation',
          },
        ],
      },
    ),
    s(
      'a4-wide-berth',
      CH.IV,
      'The Long Way Round',
      'dust-road',
      'You turn from the well and take the children the long way round the bowl, through rock that holds the heat like an oven. They drink from what you carry, or from what you can wring out of a barrel cactus with your knife; you take nothing yourself. By evening your tongue is a stone in your mouth and the world tilts when you stand. Behind you the jackals do not follow. Ahead, a smudge of smoke on the flat: half a roof, a fence, a waystation.',
      {
        effects: { hurt: 2 },
        choices: [
          {
            id: 'on',
            label: 'Make for the smoke.',
            to: 'a4-waystation',
          },
        ],
      },
    ),

    // Brother Peddler
    s(
      'a4-waystation',
      CH.IV,
      'Blessed Water',
      'peddler',
      'The waystation is four walls and half a roof. A family of prairie dogs has made camp in its shade: a mother, a grandfather coughing under a blanket, three young ones too quiet for their age. Their cart has burned; what is left of their life fits in two sacks. Before them stands a hare in a clean black coat with a little tin bell on a cord around his neck. "Call me Brother," he is saying gently, and he holds up a jar that shines in the sun. "Blessed by the sisters to the south. It cures what ails." The mother is holding out her wedding ring.',
      {
        effects: { flags: ['met:peddler', 'clue:blessed-water'] },
        choices: [
          {
            id: 'expose',
            label: 'Step in, uncork his jar, and let the mother smell it.',
            to: 'a4-peddler-exposed',
          },
          {
            id: 'silent',
            label: 'Say nothing. They are not your family.',
            to: 'a4-peddler-silent',
          },
          {
            id: 'pay-flint',
            label:
              "Press your flint into the hare's paw: he gives the jar away free.",
            to: 'a4-peddler-paid',
            requires: 'flint',
            spend: 'flint',
          },
          {
            id: 'pay-bandage',
            label:
              'Give the hare your bandage, so the grandfather drinks for nothing.',
            to: 'a4-peddler-paid',
            requires: 'bandage',
            spend: 'bandage',
          },
        ],
      },
    ),
    s(
      'a4-peddler-exposed',
      CH.IV,
      'The Smell of a Lie',
      'peddler',
      'You take the jar out of the hare\'s paw before he can close it, uncork it, and hold it under the mother\'s nose. Seep water: brackish, a little green, the kind any rock spring gives for nothing. The hare does not run. "It\'s water," he says. "It\'s wet. Is that nothing, out here?" The mother looks at the jar, and at her father, and her face closes like a door. She pours the water into the sand. "Get away from us," she says, to the hare and to you both. Walking off, you hear the grandfather ask for a drink. Nobody has one.',
      {
        effects: { flag: 'honor:told-the-truth' },
        choices: [
          {
            id: 'on',
            label: 'Take the south road.',
            to: 'wagon',
          },
        ],
      },
    ),
    s(
      'a4-peddler-silent',
      CH.IV,
      'Not Your Family',
      'peddler',
      "You say nothing. The ring goes into the hare's coat; the jar goes into the grandfather's paws. He drinks and closes his eyes and says it tastes like rain. The mother laughs once, as though something has come loose inside her. Perhaps it is enough. Perhaps hope that is sold is better than none. On the road south the sister walks beside you for a while. Then she looks back at the waystation, and then at you, and you know that she saw everything you did not do.",
      {
        choices: [
          {
            id: 'on',
            label: 'Take the south road.',
            to: 'wagon',
          },
        ],
      },
    ),
    s(
      'a4-peddler-paid',
      CH.IV,
      'The Price of Hope',
      'peddler',
      'You draw the hare aside by his sleeve and put your payment in his paw. He looks at it, and at you, and something tired crosses his face. "It\'s only water, you know," he says quietly. You nod. He goes back and gives the jar to the grandfather for nothing, and then, after a moment, a second one, and rings his little bell over them both. The mother keeps her ring. When you look back from the road, the hare is sitting with the family at their fire. You cannot tell whether he is lying to them. Perhaps he cannot either.',
      {
        effects: { flag: 'honor:paid-for-hope' },
        choices: [
          {
            id: 'on',
            label: 'Take the south road, lighter by one thing.',
            to: 'wagon',
          },
        ],
      },
    ),

    // The Storm Crow at the crossroads (after the wagon)
    s(
      'a4-crossroads',
      CH.IV,
      'The Crow at the Crossroads',
      'crow-witch',
      'South of the wagon your trail crosses another, older one, and where they cross stands a tree that has been dead longer than anything around it has been alive. On its lowest branch sits a crow in a coat of black rags, a string of bones and bottle-glass round her neck. Her eyes are milky and she looks at you anyway. "Long way from my cave," she says. "Longer way from yours, little soldier. Further than you know." She holds up one black feather. "Look through this and you see faces as they are. Old Ash gives nothing free."',
      {
        effects: { flag: 'met:old-ash' },
        choices: [
          {
            id: 'memory',
            label: 'Pay her with a memory of home.',
            to: 'a4-witch-memory',
          },
          {
            id: 'blood',
            label: 'Pay her with a drop of your blood.',
            to: 'a4-witch-blood',
          },
          {
            id: 'refuse',
            label: 'Bow, and walk on without the feather.',
            to: 'a4-witch-refused',
          },
        ],
      },
    ),
    s(
      'a4-witch-memory',
      CH.IV,
      'A Memory of Home',
      'crow-witch',
      '"A small one," she says. "You won\'t miss it." She touches your brow with the tip of a wing. There is a moment of cold, like water poured into an ear, and then she is tucking something away inside her rags and you are holding the feather. You try to remember the temple bell in the valley where you were born, the one that rang at dusk while your mother cooked. You know there was a bell. You know you loved it. Where the sound was, there is only wind, and the road that led back to it is gone as well.',
      {
        effects: { flags: ['feather', 'homeland-lost'] },
        choices: [
          {
            id: 'look',
            label: 'Look at the children through the feather.',
            to: 'a4-feather-look',
          },
          {
            id: 'on',
            label: 'Put the feather away and walk on.',
            to: 'a4-storm',
          },
        ],
      },
    ),
    s(
      'a4-witch-blood',
      CH.IV,
      'A Drop of Blood',
      'crow-witch',
      '"Blood, then. Honest stuff." She pricks the pad of your thumb with her beak, quick as a needle, and catches the drop on the feather\'s shaft, where it soaks in and is gone. "Now I\'ll always know where you are," she says, as if that were a kindness, and perhaps it is. When you take the feather, it is warm. Your thumb does not stop bleeding until sundown, and that night you dream of a fence post with a crow on it, pointing down a road you have not yet walked.',
      {
        effects: { flags: ['feather', 'taint:blood'] },
        choices: [
          {
            id: 'look',
            label: 'Look at the children through the feather.',
            to: 'a4-feather-look',
          },
          {
            id: 'on',
            label: 'Put the feather away and walk on.',
            to: 'a4-storm',
          },
        ],
      },
    ),
    s(
      'a4-witch-refused',
      CH.IV,
      'Your Own Eyes',
      'crow-witch',
      'You bow, the way you would bow to an old priestess at home, and do not reach for the feather. The crow cackles until she has to grip the branch. "A careful one! Then use your own eyes, little soldier, and pray they are enough." As you pass beneath her tree she says, much more quietly, "When a face is kind all the way through, look at the hands." You turn. The branch is empty, and from the dust on it, has been empty a long time.',
      {
        effects: { flag: 'clue:look-at-the-hands' },
        choices: [
          {
            id: 'on',
            label: 'Walk on south.',
            to: 'a4-storm',
          },
        ],
      },
    ),
    s(
      'a4-feather-look',
      CH.IV,
      'True Faces',
      'siblings',
      'You hold the feather up and look at the children through its vane. The world goes grey and very sharp. You see the sister, and she is exactly what she looks like: a child, too thin and too tall, frightened all the time and refusing to be. You see the toddler, and he is exactly what he looks like. That is all the feather shows you. It is the most frightening thing it could have shown you, because now you know that nothing is coming to save them but you.',
      {
        effects: { resolve: 1 },
        choices: [
          {
            id: 'on',
            label: 'Put the feather inside your coat and walk on.',
            to: 'a4-storm',
          },
        ],
      },
    ),

    // The storm and the shrine
    s(
      'a4-storm',
      CH.IV,
      'The Wall of Dust',
      'storm-shrine',
      'In the afternoon the south goes brown. Then it goes black, and the black is moving. The sister sees it before you do and snatches up her brother. The wind arrives first, hot and full of grit, and then the dust, and the world shrinks to the length of your arm. Off to the left, before it vanishes, you glimpse a shape on a rise: walls, square and too regular, older than any town you have passed.',
      {
        choices: [
          {
            id: 'shelter',
            label: 'Take the children by the wrists and make for the walls.',
            to: 'a4-shrine',
          },
          {
            id: 'press',
            label: 'Bend your head into it and keep walking south.',
            to: 'a4-storm-lost',
          },
        ],
      },
    ),
    s(
      'a4-storm-lost',
      CH.IV,
      'Lost in the Dust',
      'dust-road',
      "You walk into the storm with the toddler on your back and the sister's fist in your belt. Within a hundred steps there is no south. Grit fills your eyes, your ears, your teeth. Then the fist in your belt is gone. You turn in a circle and call out, and realise you do not know her name. You call anyway, any sound at all, until a small hard paw finds your sleeve out of the brown and does not let go again. When the old walls loom up in front of you, it is only luck.",
      {
        effects: { hurt: 2 },
        choices: [
          {
            id: 'in',
            label: 'Get them inside.',
            to: 'a4-shrine',
          },
        ],
      },
    ),
    s(
      'a4-shrine',
      CH.IV,
      'Shelter',
      'storm-shrine',
      'The walls are grey stone poured smooth, without a seam, and the doorway is far too tall for any door you know. Inside, out of the wind, rows of long stone benches all face one way, toward a wall where something was once fixed and has been taken down. High up, a strip of glass that does not break hums in the storm. The night comes down cold. You build no fire. The sister sits against your side with her brother in her lap, and before the light is gone they are both asleep, leaning on you as though you were a wall too.',
      {
        choices: [
          {
            id: 'song',
            label: 'Hum the song your people sing when rain is coming.',
            to: 'a4-shrine-song',
            unless: 'homeland-lost',
          },
          {
            id: 'blanket',
            label: 'Spread your blanket roll over them and watch the doorway.',
            to: 'a4-shrine-watch',
            unless: 'a4-stripped',
            flag: 'sister-trust',
          },
          {
            id: 'watch',
            label:
              'Keep watch at the doorway with your sword across your knees.',
            to: 'a4-shrine-watch',
          },
          {
            id: 'sleep',
            label: 'Sleep, and let the old walls keep the watch.',
            to: 'a4-bloom',
            heal: 2,
          },
        ],
      },
    ),
    s(
      'a4-shrine-song',
      CH.IV,
      'A Song for Rain',
      'storm-shrine',
      'You hum it very low, so as not to wake them: the song your people sing on the last dry evening, when the air smells of rain and nobody dares say so. You have not sung it since you left. Outside, the storm throws itself at the old stone and cannot get in. Halfway through, the sister opens her eyes. She does not move. She listens to the end, and then she closes her eyes again, and her paw, which has been a fist since Hollow Bell, opens on your sleeve. Some time after midnight, it begins to rain.',
      {
        effects: { flag: 'sister-trust', resolve: 2 },
        choices: [
          {
            id: 'on',
            label: 'Sleep at last.',
            to: 'a4-bloom',
          },
        ],
      },
    ),
    s(
      'a4-shrine-watch',
      CH.IV,
      'Something Passes',
      'storm-shrine',
      'Near midnight the dust thins, and in the brown dark outside you see a line of figures walking south in single file, cowled and unhurried, as if there were no storm at all. In the middle of the line, between two of them, walks a figure much smaller than the rest. None of them carries a light. You smell candle smoke where nothing burns. Then the dust closes and they are gone. The children sleep on against your back, and you do not sleep at all.',
      {
        effects: { flag: 'clue:procession', resolve: -1 },
        choices: [
          {
            id: 'on',
            label: 'Wait for morning.',
            to: 'a4-bloom',
          },
        ],
      },
    ),
    s(
      'a4-bloom',
      CH.IV,
      'After the Rain',
      'desert-bloom',
      'You wake to silence and a smell you had forgotten. The storm is gone. It rained in the night, briefly and hard, and the desert outside the doorway has done something impossible: it has flowered. Out of dust that held nothing yesterday, small blooms in yellow and white and a violet so deep it is almost black have opened all at once, all turned to the sun. Water stands in every hollow of the old stone. The toddler walks out into it with his arms held wide. His sister stands in the doorway and, for the first time since you have known her, does not look behind her.',
      {
        effects: { gain: 'water', heal: 2 },
        choices: [
          {
            id: 'go',
            label: 'Fill the canteen from the stone hollows and walk south.',
            to: 'a4-mission-road',
          },
          {
            id: 'stay',
            label: 'Let them have the morning. The road can wait an hour.',
            to: 'a4-mission-road',
            heal: 1,
          },
        ],
      },
    ),
    s(
      'a4-mission-road',
      CH.IV,
      'A Tower in the Distance',
      'three-road',
      'By afternoon the flowers are closing again, and the trail has become a real road, hard-packed and rutted, the first road in days that someone has cared for. Ahead, at the foot of the hills, a bell tower stands over adobe walls, and a thread of cooking smoke rises straight up into the still air. The sister stops. The toddler, riding on your back, points at the tower and babbles. Three shadows lie on the road in front of you, closer together now than they were at the river.',
      {
        choices: [
          {
            id: 'on',
            label: 'Walk to the gate.',
            to: 'mission-gate',
          },
        ],
      },
    ),
  ],
  reroute: {
    'canyon-road/long': 'a4-canyon-floor',
    'bone-river/pass': 'a4-stone-face',
    'relic/on': 'a4-stone-face',
    'wagon/pass': 'a4-crossroads',
    'wagon-find/on': 'a4-crossroads',
    // Shipped checks whose failures would otherwise skip the act.
    'bone-river/study#failure': 'a4-stone-face',
    'wagon/search#failure': 'a4-crossroads',
  },
}
