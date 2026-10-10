import type { Act } from '../types'
import { CH, s } from '../sections'

/**
 * Act III · The Followers (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5; Book One ch. 4–5).
 * Entry `they-follow`; exits `canyon-road` (Act IV) and `ending-alone`.
 *
 * Flags: `fire-closer` (each kindness on the road narrows the gap between the two fires; read as check bonuses
 * and at the last camp), `sister-trust` (the theft, seen and forgiven), `sister-wary` (trust lost: the theft
 * confronted, or the fever walked through; retires the shared fire), `toddler-weak` (the fever left him weak,
 * for later acts), `one-fire`, `clue:black-candle`, `clue:sandals`, `clue:wax-at-camp`,
 * `honor:let-her-keep-it`, `honor:tended-fever`.
 */
export const ACT_III: Act = {
  scenes: [
    // Day one on the road
    s(
      'a3-first-day',
      CH.III,
      'The Distance of a Thrown Stone',
      'dust-road',
      'The first day is white heat and a road that will not end. You set the pace of someone who has walked all his life, and behind you the two small shapes fall back, catch up, fall back. The sister carries the toddler on her hip and does not put him down even when she stumbles. Toward noon the road passes a dead tree that throws the only shade for miles. You stop. They stop, out in the glare, as far away as they were in Hollow Bell. The sister squints at nothing. The toddler cries once, thinly, and is hushed.',
      {
        choices: [
          {
            id: 'shade',
            label: 'Sit at one end of the shade and leave the other end empty.',
            to: 'a3-shade',
            flag: 'fire-closer',
          },
          {
            id: 'stone',
            label: 'Pour water into a hollow stone by the road and walk on.',
            to: 'a3-hollow-stone',
            spend: 'water',
            flag: 'fire-closer',
          },
          {
            id: 'pace',
            label:
              'Keep your pace. The road is long enough without passengers.',
            to: 'a3-hard-pace',
          },
        ],
      },
    ),
    s(
      'a3-shade',
      CH.III,
      'Half the Shade',
      'siblings',
      'You sit with your back to the trunk and draw your knees in until the shade on the far side of the tree is empty. Then you close your eyes. You hear her come the way a wild thing comes to water: a step, a long stop, a step. When you look, she is crouched at the far edge of the shade with her brother in her lap, fanning him with her paw, watching your sword and not your face. Nobody moves until the sun leans west. When you rise, she rises. The gap on the road that afternoon is a little shorter.',
      {
        choices: [
          { id: 'on', label: 'Walk on into the evening.', to: 'two-fires' },
        ],
      },
    ),
    s(
      'a3-hollow-stone',
      CH.III,
      'Water in the Stone',
      'zuzu-bandage',
      "A grey stone beside the road holds a bowl the rain wore into it long ago. You crouch, unstop your canteen and pour until the hollow shines. It is more than you can spare, and the canteen is lighter on your hip when you walk on. You do not look back. At the next rise you hear a small, careful sound behind you, then a child gulping, then the sister's voice, sharp and low, telling him slowly, slowly. When the road bends you see that she drank last, and least.",
      {
        choices: [
          { id: 'on', label: 'Walk on into the evening.', to: 'two-fires' },
        ],
      },
    ),
    s(
      'a3-hard-pace',
      CH.III,
      'A Hard Pace',
      'dust-road',
      'You walk as you walked before Hollow Bell, as if there were no one behind you. By mid-afternoon the two small shapes are specks. By evening they are gone into the heat-shimmer, and for an hour you feel almost free. Then the sun goes down and the road cools, and far back along it, small and stubborn, two shapes come on through the dusk. The sister carries the toddler on her back now, bent nearly double. She does not stop. She does not look at you. She simply refuses to be left.',
      {
        choices: [
          { id: 'camp', label: 'Make camp where you stand.', to: 'two-fires' },
        ],
      },
    ),
    s(
      'a3-going-back',
      CH.III,
      'Back Along the Wash',
      'zuzu-moon',
      'You go back the way you came, down the dry wash, past the rock where you waited. The moon makes the sand bright as bone. You find them where you lost them. The sister has not gone on and has not gone back. She sits on the open ground with the toddler asleep across her knees, facing the bend in the wash where you vanished, as if you might be the kind of thing that comes back. When she sees you she does not move and does not show her teeth. Somehow that is worse.',
      {
        choices: [
          {
            id: 'past',
            label: 'Walk past them, slowly enough to be followed.',
            to: 'two-fires',
            flag: 'fire-closer',
          },
        ],
      },
    ),

    // The first morning
    s(
      'a3-cloth-dawn',
      CH.III,
      'A Stone for a Stone',
      'siblings',
      'Before dawn you carry your spare cloth and a strip of dried meat to the edge of their firelight and leave them on a flat rock. You do not wait to be seen. In the grey hour you wake to find the cloth gone and the toddler wrapped in it to the ears like a parcel. On the flat rock, where the meat was, sits a single smooth stone striped red and white, the kind a child keeps in a pocket for luck. It has been set down very exactly, in the middle. A debt, paid in the only coin she has.',
      {
        choices: [
          {
            id: 'keep',
            label: 'Put the striped stone in your sash.',
            to: 'a3-salt-pan',
            flag: 'fire-closer',
          },
          {
            id: 'leave',
            label: 'Leave the stone where it lies. You want no payment.',
            to: 'a3-salt-pan',
          },
        ],
      },
    ),
    s(
      'a3-cold-dawn',
      CH.III,
      'Ash and Morning',
      'zuzu-alone',
      "You sleep badly and wake cold. Their fire is a smear of grey ash. The sister is already awake, if she ever slept, sitting with her brother between her knees and picking at his foot. Even from here you can see him flinch. Some splinter of Hollow Bell went with him: glass, or a nail, or a burned shard of somebody's door. She works at it with her claws and he does not cry, which is a worse sign than crying. When you stand, she stands, and hoists him, and waits for you to choose the road.",
      {
        choices: [{ id: 'road', label: 'Choose the road.', to: 'a3-salt-pan' }],
      },
    ),

    // The cowled watcher's trail (after `night-watch`)
    s(
      'a3-sandal-tracks',
      CH.III,
      'Soft Sandals',
      'dust-road',
      'At first light you climb to where the cowled figure stood. There are tracks after all, faint in the grit: no claws, no pads, only the flat print of a soft cloth sole and the stride of something patient. It stood here a long time; the ground is pressed smooth. In a crack in the rock lies a candle, black, burned halfway down. The wax is still soft. The smell of it is the smell you woke to. Below you the children are stirring. The tracks go south.',
      {
        effects: { flag: 'clue:black-candle' },
        choices: [
          {
            id: 'follow',
            label: 'Follow the sandal tracks a little way. (Sense · 9)',
            to: 'a3-tracks-lost',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a3-tracks-end',
              failure: 'a3-tracks-lost',
            },
          },
          {
            id: 'down',
            label: 'Go down to the children. Keep them closer today.',
            to: 'a3-salt-pan',
            flag: 'fire-closer',
          },
        ],
      },
    ),
    s(
      'a3-tracks-end',
      CH.III,
      'Where the Tracks Stop',
      'zuzu-alone',
      'The prints run south for half a mile across hardpan, never hurried, never straying. Then they stop. Not at rock, not at a stream that could carry a scent away. They stop in the open, in the middle of flat ground, the last two side by side, as if whoever made them simply stood here and then was no longer here. There are no tracks out. The wind has not touched them. You stand beside the last prints a long time with your paw on your hilt, and you do not step into them.',
      {
        effects: { flag: 'clue:sandals' },
        choices: [
          {
            id: 'back',
            label: 'Go back to the children. Quickly.',
            to: 'a3-salt-pan',
          },
        ],
      },
    ),
    s(
      'a3-tracks-lost',
      CH.III,
      'Ahead of You',
      'dust-road',
      'The prints fade on stony ground and you cast about too long, sure they must pick up again. They do not. You turn an ankle in a crack in the rock and come down hard on one knee. When you limp back to camp the children are gone. For one long breath you think the cowl came back for them. Then you see them, far down the road, two small shapes walking on alone. For the first time since Hollow Bell they are ahead of you, and the sister keeps looking back.',
      {
        effects: { hurt: 1 },
        choices: [
          { id: 'catch', label: 'Limp after them.', to: 'a3-salt-pan' },
        ],
      },
    ),

    // Day two: the salt pan
    s(
      'a3-salt-pan',
      CH.III,
      'The White Pan',
      'bone-valley',
      'By the second noon the road runs out onto a salt pan, white and cracked, half a day across, with nothing on it but glare. The salt bites through to your pads. Behind you the sister walks with her eyes slitted and her brother on her back, and halfway over she goes down on one knee and stays there. She does not cry out. She is too proud, or too tired, or has learned that crying brings the wrong kind of attention. The toddler, set down on the salt, holds up one foot as if it were burning.',
      {
        choices: [
          {
            id: 'wait',
            label: 'Wait on the far side, in plain sight, until they cross.',
            to: 'a3-salt-wait',
            flag: 'fire-closer',
          },
          {
            id: 'carry',
            label: 'Walk back and offer to carry the boy. (Mercy · 9)',
            to: 'a3-salt-refused',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a3-salt-carry',
              failure: 'a3-salt-refused',
              bonus: { flag: 'fire-closer', amount: 2 },
            },
          },
          {
            id: 'cross',
            label:
              'Cross without looking back. They will cross or they will not.',
            to: 'apple-tree',
          },
        ],
      },
    ),
    s(
      'a3-salt-wait',
      CH.III,
      'In Plain Sight',
      'siblings',
      'You cross and sit on the first rock beyond the salt, where she can see you, and you do nothing at all. It takes her an hour. She gets up, falls, gets up, carries him ten steps and sets him down and carries him ten more. Twice she looks across at you as if daring you to come back and help. You do not. It would be a kind of theft, and you think she knows it. When she reaches the rocks at last she walks past you, closer than she ever has, and does not look at you.',
      {
        choices: [
          { id: 'on', label: 'Go on when she has rested.', to: 'apple-tree' },
        ],
      },
    ),
    s(
      'a3-salt-carry',
      CH.III,
      'The Weight of Him',
      'three-road',
      "You walk back across the salt, stop an arm's length off, hold out your arms and wait. She looks at your hands for a long time. Then, without a word, she lifts her brother onto your back and takes a fistful of your poncho, as if to say she will know if you run. He weighs nothing. He breathes hot and fast against your neck and grips your ear. The three of you cross the rest of the salt in one shadow, and on the far side she takes him back at once and steps away.",
      {
        effects: { flag: 'fire-closer' },
        choices: [{ id: 'on', label: 'Walk on.', to: 'apple-tree' }],
      },
    ),
    s(
      'a3-salt-refused',
      CH.III,
      'Teeth on the Salt',
      'siblings',
      'You take one step back toward her and she is up at once, her brother pushed behind her, lips peeled back from small sharp teeth. In her other paw is a lump of salt-crust the size of a fist. Her arm shakes with the weight of it. You stop, show her your empty hands and back away, and she watches you all the way to the far side. She crosses alone, falling twice. You meant no threat. That does not matter. Every stranger who ever walked back toward her brother was a thief.',
      {
        choices: [
          {
            id: 'wait',
            label: 'Wait for them on the far side.',
            to: 'apple-tree',
          },
        ],
      },
    ),

    // The apple tree's key image (after `apple-tree`)
    s(
      'a3-apples-reach',
      CH.III,
      'Her Paw on the Rock',
      'apples-sister',
      'You set the apples on the flat rock in a careful pile and walk on, and you do not look back. You do not have to. The road climbs the ridge in a switchback, and from the turn above, without turning your head, you can see the rock below, red fruit on grey stone in the late sun. The sister comes to it slowly. She looks up the road at you, then all around, the way she looks at everything, for the trap. Then her paw goes out, thin and bandaged at the wrist, and closes on an apple. She does not eat it. She bites off a piece, chews it soft and feeds it to her brother first. Only when he is eating with both fists does she take a bite herself.',
      {
        effects: { resolve: 1 },
        choices: [
          {
            id: 'on',
            label: 'Walk on into the dusk, and keep the picture.',
            to: 'a3-apple-days',
          },
        ],
      },
    ),
    s(
      'a3-apple-days',
      CH.III,
      'The Apples Run Out',
      'three-road',
      'The apples last two days. You know because you see the cores, picked clean, at the edge of their fire each morning. The land grows harder: red rock now, and thorn, and no shade at all. The toddler limps when he is set down to walk, favouring one foot, and the sister carries him more than she walks beside him. Each night their fire burns some way off. Whether it is nearer than the night before is, you begin to understand, your doing. On the third day your pack holds nothing but the last heel of hard bread.',
      {
        choices: [
          {
            id: 'slow',
            label: 'Slow your pace on the stony ground.',
            to: 'a3-theft',
            flag: 'fire-closer',
          },
          {
            id: 'keep',
            label: 'Keep your pace. Slowing brings no one to water sooner.',
            to: 'a3-theft',
          },
        ],
      },
    ),

    // DILEMMA: the theft
    s(
      'a3-theft',
      CH.III,
      'A Small Sound',
      'zuzu-fire',
      "That night you wake without moving, the way you learned long ago in another country. The fire is low. Someone is at your pack. It is the sister, kneeling in the red light, so thin you can see the bones of her wrists below the rag bandages, and in her paw is your bread: the last food you have. She has not seen your eyes open. She glances back once toward her own fire, where the toddler sleeps, and her face is not a thief's face. It is the face of someone doing sums. One more day for him. None for you.",
      {
        choices: [
          { id: 'catch', label: 'Catch her wrist.', to: 'a3-theft-caught' },
          {
            id: 'let',
            label: 'Close your eyes. Let her take it, and never let her know.',
            to: 'a3-theft-kept',
            flag: 'honor:let-her-keep-it',
          },
          {
            id: 'seen',
            label: 'Let her see that you are awake. Say nothing.',
            to: 'a3-theft-seen',
          },
        ],
      },
    ),
    s(
      'a3-theft-caught',
      CH.III,
      'Caught',
      'camp',
      'Your paw closes on her wrist before she can rise. She makes no sound at all. She twists like a cat in a sack, her teeth meet in the meat of your thumb, and the bread falls between you. Then she is gone across the dark to her own fire, the toddler is snatched up mid-wail, and the two of them vanish past the firelight into the rocks. The bread lies in the dust. Your thumb bleeds. The night is very quiet, and somewhere out in it is a girl who has just learned again what she always knew about strangers.',
      {
        effects: { hurt: 1, flag: 'sister-wary' },
        choices: [
          {
            id: 'after',
            label: 'Go after them now, into the dark. (Sense · 9)',
            to: 'a3-search-dawn',
            check: {
              attribute: 'sense',
              target: 9,
              success: 'a3-search-dark',
              failure: 'a3-search-dawn',
              bonus: { flag: 'went-back', amount: 2 },
            },
          },
          {
            id: 'eat',
            label: 'Eat the bread. Sleep. Look for them at first light.',
            to: 'a3-search-dawn',
            heal: 2,
          },
          {
            id: 'go',
            label: 'Let them go. Walk on alone before dawn.',
            to: 'ending-alone',
          },
        ],
      },
    ),
    s(
      'a3-search-dark',
      CH.III,
      'In the Rocks',
      'zuzu-moon',
      'You do not call out. You read the ground by starlight: a scuff, a pebble turned wet side up, a tuft of pale fur on a thorn. You find them in a cleft between two boulders, the toddler pushed in behind her and the sister in front with a rock raised in both paws. She will throw it. You can see that she will. You set the bread on a flat stone between you, step back, and keep stepping back until the dark has you. In the morning she follows again. Farther off than before.',
      {
        choices: [
          { id: 'on', label: 'Walk on in the morning.', to: 'a3-fever' },
        ],
      },
    ),
    s(
      'a3-search-dawn',
      CH.III,
      'Found at First Light',
      'zuzu-alone',
      'At first light you find their trail and follow it into the rocks. They spent the night under an overhang with no fire, and it was a cold night. The sister is curled around her brother like a fist around a coal. She is awake. She looks at you over his head with flat, tired eyes and does not run, because he is shivering too hard to be carried far and she knows it. You turn your back on her, which is all you have left to give, and walk to the road. Later, when you look, they are following. Much farther off.',
      {
        choices: [{ id: 'on', label: 'Walk on.', to: 'a3-fever' }],
      },
    ),
    s(
      'a3-theft-kept',
      CH.III,
      'What You Did Not See',
      'stolen-bread',
      'You close your eyes, keep your breathing slow and listen to her go, small and careful, back across the dark. At dawn you look over. She is asleep sitting up with her brother in her lap and the bread in her fist, half of it gone, the other half tucked under his chin where no one could take it without waking them both. Your stomach is a hard knot all day. She walks the road with her chin up and never once looks at you. She does not know that you know. She never will. That is the gift.',
      {
        effects: { hurt: 1 },
        choices: [{ id: 'on', label: 'Walk on, hungry.', to: 'a3-fever' }],
      },
    ),
    s(
      'a3-theft-seen',
      CH.III,
      'Eyes in the Firelight',
      'stolen-bread',
      "You open your eyes and let her see them open. She goes still as a rabbit under a hawk. The bread is in her paw and your eyes are on it, and there is no story she can tell. For a long moment neither of you breathes. Then you roll over, pull your poncho up to your ear and give her your back. You hear nothing for a long time. Then her steps, going. In the morning you are hungry, she is asleep with the bread under her brother's chin, and when you rise to walk, she follows nearer than yesterday.",
      {
        effects: {
          hurt: 1,
          flag: 'sister-trust',
          attr: { attribute: 'mercy', amount: 1 },
        },
        choices: [{ id: 'on', label: 'Walk on, hungry.', to: 'a3-fever' }],
      },
    ),

    // DILEMMA: the fever
    s(
      'a3-fever',
      CH.III,
      'Heat in the Night',
      'fever',
      "The next night the toddler stops babbling. You hear the silence before you understand it. Then the sister is at the edge of your firelight with her brother in her arms, and he is limp, his breath quick and shallow as a bird's. The foot he has been favouring is swollen and hot, the cut on its pad gone an ugly colour. She does not ask. She has never asked you for anything. She sets him down on the warm ground at the edge of your fire and steps back, as if paying a toll she cannot afford.",
      {
        choices: [
          {
            id: 'kindness',
            label:
              'Hold him all night and breathe him through it. (Last Kindness · 2 Resolve)',
            to: 'a3-fever-vigil',
            cost: 2,
            flag: 'honor:tended-fever',
          },
          {
            id: 'water',
            label: 'Wet your cloth from your canteen and cool him till dawn.',
            to: 'a3-fever-water',
            spend: 'water',
            flag: 'honor:tended-fever',
          },
          {
            id: 'bandage',
            label: 'Clean the cut and bind his foot in your linen.',
            to: 'a3-fever-bandage',
            spend: 'bandage',
            flag: 'honor:tended-fever',
          },
          {
            id: 'walk',
            label: 'Walk at first light and hope the fever breaks.',
            to: 'a3-fever-walk',
          },
        ],
      },
    ),
    s(
      'a3-fever-vigil',
      CH.III,
      'The Last Kindness',
      'zuzu-fire',
      "You take him on your lap and slow your own breath until it is the only thing in the world: in for four, hold, out for eight. Your teachers called it the last kindness, the one you give when there is nothing left in your hands. You give it to him all night. His breath tangles and you untangle it; it races and you hold it back. Somewhere past midnight the sister stops pacing and sits. When the sky greys the fever breaks in a sweat, and she is asleep an arm's length from you, closer than she has ever slept. You are hollow to the bone.",
      {
        effects: { flag: 'fire-closer' },
        choices: [{ id: 'on', label: 'Rise and walk on.', to: 'a3-last-camp' }],
      },
    ),
    s(
      'a3-fever-water',
      CH.III,
      'Water on His Brow',
      'fever',
      'You soak your cloth from the canteen and lay it on his brow, his chest, the soles of his feet, and soak it again each time it comes away warm. The sister watches the water go the way a miser watches coins spill. She knows what water is out here. So do you. By midnight the canteen is lighter than you have ever felt it; by dawn it is lighter still, and the boy is sleeping, truly sleeping, his breath slow at last. Whatever waits past the red country, you will meet it thirstier.',
      {
        choices: [
          {
            id: 'on',
            label: 'Walk on with a light canteen.',
            to: 'a3-last-camp',
          },
        ],
      },
    ),
    s(
      'a3-fever-bandage',
      CH.III,
      'Clean Linen',
      'fever',
      'You hold his foot to the firelight. The cut is small and deep and angry, with something dark still in it. You warm the point of a thorn in the flame and work the splinter out while the sister holds his shoulders and stares at your paws as if she could stop them by looking. Then you bind the foot in your linen, the clean roll you were saving for your own blood. By the next noon the fever has broken. Whatever cuts you between here and the end of this road, you will bleed on it.',
      {
        choices: [{ id: 'on', label: 'Walk on.', to: 'a3-last-camp' }],
      },
    ),
    s(
      'a3-fever-walk',
      CH.III,
      'Walking on Hope',
      'dust-road',
      'At first light you walk, because walking is what you know. The sister carries him until noon, then cannot, and stands swaying in the road with him in her arms. You take him. She lets you, which tells you how bad it is. All afternoon you carry him through the heat, the sun on your neck and his heat against your chest like a second sun. He does not cry any more. His fingers have stopped gripping. The sister walks at your elbow, close for the first time, and looks at nothing but his face.',
      {
        effects: { hurt: 2 },
        choices: [
          { id: 'on', label: 'Keep walking.', to: 'a3-fever-long-night' },
        ],
      },
    ),
    s(
      'a3-fever-long-night',
      CH.III,
      'The Long Night',
      'camp',
      'That night is the longest of the road. The sister holds him and rocks and makes a sound you have heard once before, in your own country, from a mother at a grave. You sit across the fire and can do nothing. Near dawn, on its own, the fever breaks. He lives. He is quiet and thin and too weak to stand, and he will be for days. When the sister finally looks at you across the ashes, it is the way she looked at you in Hollow Bell. You walked while he burned. She will not forget it.',
      {
        effects: { resolve: -1, flags: ['sister-wary', 'toddler-weak'] },
        choices: [{ id: 'on', label: 'Walk on.', to: 'a3-last-camp' }],
      },
    ),

    // The last camp before the red country
    s(
      'a3-last-camp',
      CH.III,
      'Before the Red Country',
      'zuzu-fire',
      'A day later the land ahead breaks apart into red canyons, layer on layer, like the pages of a burned book. You make camp on the last flat ground. Behind you, at the distance the road has settled on, the sister gathers thorn for her own fire with the toddler on her hip. You have walked together most of a week and have not exchanged a word. You watch her strike a stone against a stone, again and again, until a spark finally takes. It is a better fire than the first one she built.',
      {
        choices: [
          {
            id: 'wave',
            label: 'Wave them in to your fire.',
            to: 'a3-one-fire',
            flag: 'one-fire',
            needs: 'sister-trust',
            hint: 'She has not let you that near yet.',
            unless: 'sister-wary',
          },
          {
            id: 'nearer',
            label: 'Build your fire a little nearer to theirs.',
            to: 'a3-close-fires',
            needs: 'fire-closer',
            hint: 'They have never come close enough for that.',
          },
          {
            id: 'ridge',
            label: 'Keep watch on the ridge for soft sandals.',
            to: 'a3-candle-watch',
            needs: 'clue:black-candle',
            hint: 'You have seen no reason to keep watch.',
          },
          {
            id: 'apart',
            label: 'Make your fire where you stopped, as always.',
            to: 'a3-far-fires',
          },
          {
            id: 'leave',
            label: 'Rise before dawn and go on while they sleep.',
            to: 'a3-before-dawn',
          },
        ],
      },
    ),
    s(
      'a3-one-fire',
      CH.III,
      'One Fire',
      'camp',
      'You lift a paw and beckon, once. The sister stares. Then she comes, slowly, with her brother and an armful of thorn, and sits down across the fire from you with the flames between you like a fence. The toddler crawls halfway round to look at your hat and falls asleep against your knee. She lets him. Late in the night, staring into the coals, she speaks to you for the first time. "You walk too fast," she says. You think about that for a long while. In the morning you walk slower.',
      {
        choices: [
          {
            id: 'on',
            label: 'Walk into the red canyons, the three of you.',
            to: 'canyon-road',
          },
        ],
      },
    ),
    s(
      'a3-close-fires',
      CH.III,
      'Two Fires, Closer',
      'three-road',
      'You carry your sticks forward and build your fire halfway to theirs, and no nearer. The sister watches you do it and does not move her own. Across the gap you can hear the toddler breathing now, and the small sounds she makes to settle him, and the crack of thorn in her fire. Twice in the night you look over and find her looking back. In the morning she is up before you, waiting with her brother on her hip, and when you set off she is no more than a long stride behind.',
      {
        choices: [
          {
            id: 'on',
            label: 'Walk into the red canyons.',
            to: 'canyon-road',
          },
        ],
      },
    ),
    s(
      'a3-far-fires',
      CH.III,
      'The Distance Kept',
      'zuzu-alone',
      'You make your fire where you stopped, in the lee of a rock. Theirs flickers up some way off, as it has every night. You eat nothing, because you have nothing, and watch their small flame lean in the wind. This is what the road is, you tell yourself: a traveller, and a distance, and two children who chose to walk the far end of it. Sometime before dawn their fire goes out and they do not relight it. In the morning they are waiting, at the same distance as ever, to see which way you go.',
      {
        choices: [
          {
            id: 'on',
            label: 'Walk into the red canyons.',
            to: 'canyon-road',
          },
        ],
      },
    ),
    s(
      'a3-candle-watch',
      CH.III,
      'Candle Smoke',
      'zuzu-moon',
      'You sit with your back to their fire, your sword across your knees, and watch the ridge. Nothing moves on it all night. Nothing at all. But an hour before dawn the wind turns and brings you the smell of candle smoke, close, from the dark between your fire and theirs, where no one is and nothing burns. You stand. The smell is gone. In the morning, ten paces from where the children slept, you find a single drop of black wax on a stone, still soft. The sister sees you find it. She does not ask. All that day she walks close enough to touch.',
      {
        effects: { flags: ['clue:wax-at-camp', 'fire-closer'] },
        choices: [
          {
            id: 'on',
            label: 'Walk into the red canyons.',
            to: 'canyon-road',
          },
        ],
      },
    ),
    s(
      'a3-before-dawn',
      CH.III,
      'Before They Wake',
      'zuzu-moon',
      'You rise in the dark and roll your blanket without a sound. Their fire is embers. The sister sleeps curled around her brother, one paw still fisted in his shirt. If you go now you will be over the ridge and into the canyons before they wake, and the canyons are a maze; they will never find your trail. It would be a kindness, of a kind. They would turn back toward the towns. Someone there might take them in. You stand at the edge of their firelight with your hat in your hands.',
      {
        choices: [
          {
            id: 'go',
            label: 'Walk on. Do not look back.',
            to: 'ending-alone',
          },
          {
            id: 'stay',
            label:
              'Sit down at the edge of their fire and wait for them to wake.',
            to: 'canyon-road',
            flag: 'went-back',
          },
        ],
      },
    ),
  ],
  reroute: {
    'they-follow/let': 'a3-first-day',
    'lost-them/back': 'a3-going-back',
    'two-fires/cloth': 'a3-cloth-dawn',
    'two-fires/sleep': 'a3-cold-dawn',
    'night-watch/go': 'a3-sandal-tracks',
    'apple-tree/leave-all': 'a3-apples-reach',
    'apple-tree/take': 'a3-apples-reach',
    // A failed check now lands in the act too, instead of skipping its day-two scenes.
    'they-follow/lose#failure': 'a3-first-day',
    'two-fires/watch#failure': 'a3-cold-dawn',
  },
}
