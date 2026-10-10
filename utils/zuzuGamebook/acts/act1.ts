import type { Act } from '../types'
import { CH, s } from '../sections'

/**
 * Act I · Waters (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5). Entry `the-crossing`; exits
 * `hollow-bell`, `dust-road` (and `cold-camp`), `ending-water`. Adds the black stones and the cracked bowl,
 * the standoff's Shadow route, the fight's ground, the gun in the water, the nest, and the long dusk.
 */
export const ACT_I: Act = {
  scenes: [
    // Before the standoff: the black stones
    s(
      'a1-black-stones',
      CH.I,
      'The Ring of Black Stones',
      'waterhole',
      'You leave the open bank and walk the ring of black stones instead, slow, your sword hand loose. They are hot enough to feel through your sandals. Across the water the coyote turns his head to keep you in the corner of his one eye, the way a man watches weather. Between the stones the water runs clear for a hand or two before it goes black. Pale shapes lie in it, half sunk in silt. Sticks, you think, and then you think again.',
      {
        choices: [
          {
            id: 'look',
            label:
              'Kneel and look closer at what lies between the stones. (Sense · 7)',
            to: 'a1-bowl-bones',
            check: {
              attribute: 'sense',
              target: 7,
              success: 'a1-bowl-bones',
              failure: 'standoff',
            },
          },
          {
            id: 'drink',
            label: 'Leave the shallows be. Kneel, drink, and meet his eye.',
            to: 'standoff',
          },
        ],
      },
    ),
    s(
      'a1-bowl-bones',
      CH.I,
      'A Name in the Clay',
      'bowl-bones',
      "Bones, old and clean, wedged between the stones where the water has rolled them. Most are a goat's, or a deer's. Some are smaller. You do not sort them further. Among them lies a clay bowl, cracked through, the kind a child eats from. Someone has scratched a name into its rim with a nail, in careful crooked letters: LARK. On its foot, pressed into the clay before it was ever fired, is a small bell. Nobody carries a bowl this far from a kitchen. Somebody was carried.",
      {
        choices: [
          {
            id: 'keep',
            label: 'Wrap the bowl in your sash and rise.',
            to: 'a1-stones-watch',
            flag: 'clue:bowl',
          },
          {
            id: 'lay',
            label: 'Lift the bones onto dry stone and take off your hat.',
            to: 'a1-laid-out',
            flags: ['clue:bowl', 'honor:bones-at-the-water'],
          },
        ],
      },
    ),
    s(
      'a1-stones-watch',
      CH.I,
      'What the Stones Can See',
      'ripples',
      'Standing on the stones you see what the bank could never show you. A shadow is moving under the black water, low and unhurried, longer than you are tall three times over. It is not coming for you. It is going toward the far bank, where the coyote has finally knelt to drink, cupping water to his mouth with his gun hand and keeping his one eye on you, the only danger he knows about. He has not seen it. Nothing in his face says he has ever seen it.',
      {
        choices: [
          {
            id: 'warn',
            label: 'Shout across the water and point.',
            to: 'a1-terrain',
            flag: 'coyote-warned',
          },
          {
            id: 'quiet',
            label:
              'Say nothing. Keep the stones and the first move for yourself.',
            to: 'a1-terrain',
          },
        ],
      },
    ),
    s(
      'a1-laid-out',
      CH.I,
      'Hat in Hand',
      'bowl-bones',
      'You lift the bones out one at a time and lay them in a row on the dry stone, the smallest last, the bowl at the head of them. Then you take off your kasa and stand. It is not much. It is what there is. Across the water the coyote has stopped drinking to watch a stranger bury nobody. After a long moment he takes off his own battered hat. Behind you the water makes a sound like a held breath let go, and you are standing bareheaded with your back to it.',
      {
        effects: { hurt: 1 },
        choices: [
          { id: 'turn', label: 'Turn, bareheaded, and draw.', to: 'crocodile' },
        ],
      },
    ),

    // The standoff's Shadow route
    s(
      'a1-downwind',
      CH.I,
      'Downwind',
      'ripples',
      "You drift back from the water as if you have lost interest in it, and let the dead reeds close around you. The wind is in your face, carrying mud and musk and old meat. The coyote's eye searches the reeds, finds nothing, narrows. From here you see what neither of you saw across the pool: two knuckles of eye sliding over the black water toward his bank, and behind them a ridge of back as long as a cart. It has been there the whole time. It has been patient the whole time.",
      {
        choices: [
          {
            id: 'warn',
            label: 'Step out of the reeds and point at the water behind him.',
            to: 'a1-terrain',
            flag: 'coyote-warned',
          },
          {
            id: 'quiet',
            label: 'Stay hidden. Let it show itself first.',
            to: 'a1-terrain',
          },
        ],
      },
    ),
    s(
      'a1-downwind-fail',
      CH.I,
      'A Reed Breaks',
      'coyote',
      "A dead reed cracks under your sandal, loud as a shot. The coyote's revolver is out of its holster before the sound has finished. For one heartbeat you look at each other along a barrel and a half-drawn blade, neither of you breathing, both of you sure the other has decided. Neither of you has. Then the water behind him bulges like a lifted blanket and breaks, and that one heartbeat was all it ever needed.",
      {
        choices: [{ id: 'draw', label: 'Finish the draw.', to: 'crocodile' }],
      },
    ),

    // The fight's ground
    s(
      'a1-terrain',
      CH.I,
      'Choosing the Ground',
      'crocodile',
      'It comes on slowly, the way the old ones do, sure of the water and sure of whatever kneels beside it. You have a breath, perhaps two, to choose where this happens. Behind you the black stones step up out of the pool, slick and sun-hot. To your left the dead reeds stand thick as a fence, their roots in sucking mud. Across the water the coyote has his feet under him. Wherever you choose, the animal will choose too.',
      {
        choices: [
          {
            id: 'stones',
            label:
              'Back up onto the black stones and make it climb to you. (Shadow · 9)',
            to: 'a1-bad-ground',
            check: {
              attribute: 'shadow',
              target: 9,
              success: 'a1-on-the-stones',
              failure: 'a1-bad-ground',
            },
          },
          {
            id: 'reeds',
            label:
              'Wade into the dead reeds, where it must come slowly. (Sense · 9)',
            to: 'a1-bad-ground',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a1-reeds',
              failure: 'a1-bad-ground',
            },
          },
          {
            id: 'shot',
            label: 'Shout for the coyote to fire as it rises.',
            to: 'a1-the-shot',
            needs: 'coyote-warned',
            hint: 'He does not know what is in the water.',
          },
          {
            id: 'open',
            label: 'Meet it in the open shallows.',
            to: 'crocodile',
          },
        ],
      },
    ),
    s(
      'a1-on-the-stones',
      CH.I,
      'Out of Its Water',
      'crocodile',
      'You let it see you, then step backward up the stones, one, two, three, as if you are afraid. It wants you more than it wants caution. It heaves itself out after you, and up here it is no longer a thing of the water. Its belly grinds on the rock. Its claws skid on stone polished by a thousand years of drinking animals. It is heavy up here, and slow, and you are neither. For the first time since you came to this pool, you are the patient one.',
      {
        effects: { attr: { attribute: 'shadow', amount: 1 } },
        choices: [{ id: 'now', label: 'Now.', to: 'crocodile' }],
      },
    ),
    s(
      'a1-reeds',
      CH.I,
      'The Reeds Tell You',
      'ripples',
      'You stand in the reeds up to your knees and close your eyes. There is no point watching water this dark. Instead you listen to the stalks. They hiss where it pushes through them, they knock where its tail swings, they fall silent where it stops to wait. You hear it circle. You hear it decide. When it comes, it comes from the left and low, exactly where the reeds said it would, and your blade is already there to meet it.',
      {
        effects: { attr: { attribute: 'sense', amount: 1 } },
        choices: [{ id: 'now', label: 'Cut.', to: 'crocodile' }],
      },
    ),
    s(
      'a1-bad-ground',
      CH.I,
      'The Ground Says No',
      'crocodile',
      'The ground does not do what you asked of it. A stone turns under your heel; the mud takes your sandal and will not give it back. You are still finding your feet when the tail comes round out of the water like a swung door and takes you across the ribs. You land hard on your side with the breath gone out of you and the sword, thank the old gods, still in your hand. The jaws open over the water, unhurried, as if it has seen this a hundred times.',
      {
        effects: { hurt: 2 },
        choices: [{ id: 'up', label: 'Get up. Fight.', to: 'crocodile' }],
      },
    ),
    s(
      'a1-the-shot',
      CH.I,
      'One Shot',
      'coyote',
      'You shout, and point, and for once in his life the coyote believes a stranger. He turns on one knee as the water lifts. The revolver bucks once in his right hand, and the noise goes round the red rock like a bell. The ball takes the animal above the eye. It does not stop it. It only turns its head, slowly, from you to him: to the smoke, and the hand that made it. He is thumbing the hammer for a second shot when it comes.',
      {
        effects: { resolve: 1 },
        choices: [
          {
            id: 'now',
            label: 'Get between them before the second shot.',
            to: 'crocodile',
          },
        ],
      },
    ),

    // After the fight: the gun in the water
    s(
      'a1-gun',
      CH.I,
      'Iron in the Shallows',
      'gun-shallows',
      "Before you can rise, the last of the light finds something in the shallows. His revolver lies a hand under the clear water, on the black stones where the jaws let it go. The coyote has seen it too. He does not move toward it. He looks at it, then at the place on his arm where a hand should be, and then at you. It is the most valuable thing within a day's walk. In Dustwater, iron like that buys a month of water. In the deep it would never be drawn on anyone again.",
      {
        choices: [
          {
            id: 'return',
            label: 'Wade in, wipe it dry, and set it in his left hand.',
            to: 'a1-gun-returned',
            flags: ['honor:returned-the-gun', 'debt:coyote'],
          },
          {
            id: 'keep',
            label: 'Tuck it into your sash. It will buy water on the road.',
            to: 'a1-gun-kept',
            flag: 'kept-gun',
          },
          {
            id: 'drown',
            label: 'Throw it into the deep, where the animal came from.',
            to: 'a1-gun-drowned',
            flag: 'drowned-gun',
          },
        ],
      },
    ),
    s(
      'a1-gun-returned',
      CH.I,
      'The Wrong Hand',
      'coyote-wounded',
      "You wade in, lift it out and dry it on your poncho, and put it grip-first into his left hand. He holds it like a stranger's tool. He tries to holster it on his right hip, as he has done every day of his life, and stops. Then, slowly, with his teeth and his one hand, he unbuckles the belt and moves the holster to the other side. It takes a long time. You wait. When it is done he looks at you as if you had handed him back something larger than iron.",
      {
        effects: { attr: { attribute: 'mercy', amount: 1 } },
        choices: [
          {
            id: 'bank',
            label: 'Cross to the far bank, where the animal came from.',
            to: 'a1-nest',
          },
          {
            id: 'part',
            label: 'Sit with him until the light goes.',
            to: 'parting',
          },
        ],
      },
    ),
    s(
      'a1-gun-kept',
      CH.I,
      'Fair Trade',
      'gun-shallows',
      'You lift it out of the water and push it through your sash beside the scabbard, where it sits cold and wrong and heavy. Iron that speaks with smoke. You will never draw it; you will trade it, and the water it buys may keep you alive. The coyote\'s eye follows it into your sash and stays there. "Reckon you paid for it," he says at last. He says it without heat, which is worse. He will remember this long after he has forgotten your face.',
      {
        choices: [
          {
            id: 'bank',
            label: 'Cross to the far bank, where the animal came from.',
            to: 'a1-nest',
          },
          {
            id: 'part',
            label: 'Sit with him until the light goes.',
            to: 'parting',
          },
        ],
      },
    ),
    s(
      'a1-gun-drowned',
      CH.I,
      'Into the Deep',
      'ripples',
      'You lift it dripping from the shallows and throw it, hard, out over the black middle of the pool. It turns once in the air, catching the sun, and goes in without a splash worth the name. The rings run out to the reeds and are gone. The coyote watches the place where it sank for a long time. Something in his face loosens, or breaks. You cannot tell which, and he does not tell you. Maybe he does not know himself.',
      {
        choices: [
          {
            id: 'bank',
            label: 'Cross to the far bank, where the animal came from.',
            to: 'a1-nest',
          },
          {
            id: 'part',
            label: 'Sit with him until the light goes.',
            to: 'parting',
          },
        ],
      },
    ),

    // The nest
    s(
      'a1-nest',
      CH.I,
      'What It Was Guarding',
      'croc-eggs',
      'Under the red rock on the far bank, in a scrape of sand still warm from the day, lie a dozen leathery eggs. One of them rocks. Something inside is tapping, patient, the way the mother was patient. It was not only hungry, then. It was keeping something. You are hungrier than you have let yourself notice, and these are food for days. Leave them, and in a few summers this water has teeth again for whoever kneels at it next. Across the pool the coyote watches you, ribs showing through his coat.',
      {
        choices: [
          {
            id: 'eat',
            label: 'Eat your fill and wrap the rest in your poncho.',
            to: 'a1-eggs-eaten',
          },
          {
            id: 'share',
            label:
              'Carry them across the water and split them with the coyote.',
            to: 'a1-eggs-shared',
          },
          {
            id: 'leave',
            label: 'Cover them with warm sand and leave them be.',
            to: 'a1-eggs-left',
            flags: ['honor:spared-the-nest', 'nest-left'],
          },
        ],
      },
    ),
    s(
      'a1-eggs-eaten',
      CH.I,
      'Food for Days',
      'croc-eggs',
      'You break them on a stone and eat with your back to the pool, until the shaking in your hands you had stopped noticing stops. The one that was tapping you leave until last, and then you do not leave it. Out here nothing is spared for long. You wrap the rest in a fold of your poncho. The pool will be only water now, for whoever comes. When you cross back, the coyote has turned his face away from you and the food.',
      {
        effects: { heal: 4, flag: 'nest-eaten' },
        choices: [
          {
            id: 'part',
            label: 'Go back to him as the sun sinks.',
            to: 'parting',
          },
        ],
      },
    ),
    s(
      'a1-eggs-shared',
      CH.I,
      'Half of Everything',
      'coyote-bandaged',
      'You carry them across in your hat and set them down between you. The coyote looks at the eggs, then at you, then cracks one against his knee with his left hand, clumsily, spilling half. He eats the rest out of the shell like a starving man trying not to look like one. You eat too. Neither of you speaks. When there are two left you wrap them in your poncho, and he watches you do it and does not ask for them, and you both understand that he could have.',
      {
        effects: { heal: 2, flags: ['nest-eaten', 'coyote-fed'] },
        choices: [
          { id: 'part', label: 'Rise as the sun sinks.', to: 'parting' },
        ],
      },
    ),
    s(
      'a1-eggs-left',
      CH.I,
      'Something Taps',
      'croc-eggs',
      'You push the warm sand back over them with the side of your paw, the way the mother did. Your stomach tells you exactly what you have done. So does the thought of the next traveller kneeling at this water in a few summers with their back to the deep. You leave the eggs anyway. Too little lives in this country, and this did. As you walk away, something under the sand taps three times, patient and alive, and you do not look back.',
      {
        choices: [
          {
            id: 'part',
            label: 'Go back to the coyote as the sun sinks.',
            to: 'parting',
          },
        ],
      },
    ),

    // The road for those who would not stay
    s(
      'a1-gun-road',
      CH.I,
      'What Is Left Lying',
      'gun-shallows',
      'You shoulder your pack. He does not ask you for anything; he has learned not to. As you turn to go, the light finds his revolver lying a hand under the clear water, on the black stones where the jaws let it go. He sees it too and does not move. A man with one hand and no gun is a man the waste will finish by the end of the week. A man with one hand and a gun is still a man with a gun.',
      {
        choices: [
          {
            id: 'return',
            label: 'Fish it out after all and put it in his left hand.',
            to: 'a1-gun-returned',
            flags: ['honor:returned-the-gun', 'debt:coyote'],
          },
          {
            id: 'keep',
            label: 'Take it. Iron buys water.',
            to: 'a1-far-bank',
            flag: 'kept-gun',
          },
          {
            id: 'drown',
            label: 'Throw it into the deep, where it can hurt no one.',
            to: 'a1-far-bank',
            flag: 'drowned-gun',
          },
          {
            id: 'leave',
            label: 'Leave it where it lies, and him with it.',
            to: 'a1-far-bank',
          },
        ],
      },
    ),
    s(
      'a1-far-bank',
      CH.I,
      'The Far Bank',
      'croc-eggs',
      'Your way out runs along the far bank, under the red rock. In a scrape of sand still warm from the day lie a dozen leathery eggs, and one of them is rocking. Something inside taps, patient as its mother was patient. Food for days, if you want it, and a pool without teeth for whoever comes next. Or a dozen small lives in a country that has very few. Behind you, across the water, the coyote has not moved.',
      {
        choices: [
          {
            id: 'eat',
            label: 'Eat your fill and wrap the rest in your poncho.',
            to: 'dust-road',
            heal: 4,
            flag: 'nest-eaten',
          },
          {
            id: 'leave',
            label: 'Cover them with warm sand and walk on hungry.',
            to: 'dust-road',
            flags: ['honor:spared-the-nest', 'nest-left'],
          },
        ],
      },
    ),

    // Beauty: dusk and the spilled stars
    s(
      'a1-two-shadows',
      CH.I,
      'Two Shadows',
      'dust-road',
      'At the top of the first rise you stop, because the sun is lying down on the flats behind you and you have never seen light do this. It throws your shadow out ahead of you a hundred paces long, thin as a reed, hat and hilt and all. Far off across the pan, another shadow runs the other way, lopsided, one arm short. For a moment, before the light goes, their tips nearly touch in the middle of the flat, where neither of you is standing. Then the sun goes, and takes them both.',
      {
        choices: [
          { id: 'on', label: 'Walk on into the gullies.', to: 'dust-road' },
          {
            id: 'stop',
            label: 'Stop here for the night, where you can still see the flat.',
            to: 'cold-camp',
          },
        ],
      },
    ),
    s(
      'a1-stars',
      CH.I,
      "Someone Else's Stars",
      'zuzu-alone',
      "You lie back on rock that still holds the heat of the day and let the sky have you. There are more stars than dark between them. You look for the hook of five that hangs over the river where you were born, and it is not there, and has not been there for a long time. These are someone else's stars, in someone else's order. They are beautiful anyway. For as long as you look at them, nothing in this country is hungry, and nothing is waiting under the water.",
      {
        effects: { heal: 2, resolve: 1 },
        choices: [
          {
            id: 'sleep',
            label: 'Sleep, and walk toward the smoke at first light.',
            to: 'hollow-bell',
          },
          {
            id: 'name',
            label: 'Think about the name scratched in the bowl.',
            to: 'a1-bowl-night',
            needs: 'clue:bowl',
            hint: 'Nothing you have seen yet needs remembering.',
          },
        ],
      },
    ),
    s(
      'a1-bowl-night',
      CH.I,
      'Lark',
      'camp',
      'LARK, in careful crooked letters, scratched with a nail by someone who was proud of knowing how. And on the foot of the bowl, pressed into the wet clay before it was fired, a little bell. Somebody made bowls like that by the dozen. Somebody handed them out, one to each child, and scratched in names. You do not know yet who rings that bell, or for whom. You only know that the bowl came a long way from its kitchen, and that the child it belonged to did not come back for it.',
      {
        choices: [
          {
            id: 'dawn',
            label: 'Sleep at last, and walk toward the smoke at first light.',
            to: 'hollow-bell',
          },
        ],
      },
    ),
  ],
  extend: {
    'the-crossing': [
      {
        id: 'stones',
        label: 'Circle the pool along the black stones, eyes on the shallows.',
        to: 'a1-black-stones',
      },
    ],
    standoff: [
      {
        id: 'downwind',
        label: 'Ease back from the water and circle downwind. (Shadow · 9)',
        to: 'a1-downwind-fail',
        check: {
          attribute: 'shadow',
          target: 9,
          success: 'a1-downwind',
          failure: 'a1-downwind-fail',
        },
      },
    ],
    'cold-camp': [
      {
        id: 'stars',
        label: 'Lie back on the warm rock and look up.',
        to: 'a1-stars',
      },
      {
        id: 'eggs',
        label: 'Eat the last of the croc eggs, cold, and sleep.',
        to: 'hollow-bell',
        needs: 'nest-eaten',
        hint: 'There is nothing in your poncho to eat.',
        heal: 3,
      },
    ],
  },
  reroute: {
    'coyote/defend': 'a1-terrain',
    'croc-ready/meet': 'a1-terrain',
    'aftermath/bandage': 'a1-gun',
    'aftermath/apple': 'a1-gun',
    'aftermath/road': 'a1-gun-road',
    'parting/gullies': 'a1-two-shadows',
  },
}
