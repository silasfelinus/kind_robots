import type { Act } from '../types'
import { CH, s } from '../sections'

/**
 * Act V · The Mission (conductor projects/zuzu-gamebook/BOOK-ONE-OUTLINE.md §5; Book One ch. 6).
 * Entry `mission-gate`; exits `mission`, `night-flight`, `take-them`, `cellar` and, by the pilgrim wagon, `posters`.
 *
 * The welcome first (Silas, 2026-10-09): the threshold and the shipped supper are warm before anything turns.
 * Night one is the shipped house (courtyard, chapel, bell, dormitory, locked door). Its quiet endings no longer
 * go straight to `morning`: they lead into a second day (the wall, the bath and the sister's rags, the silent
 * rabbit kit's box, the Abbess's errand, Wren's note), a second night (the dream, or the crypt by Wren's door or
 * the kit's key) and a second dawn, which hands off to the shipped `morning` or drives the pilgrim wagon to
 * Dustwater (`posters`).
 *
 * Flags for later acts: `met:wren`, `wren-ally`, `wren-betrayed`, `honor:kept-wrens-secret`, `met:kit`,
 * `taint:delivered`, `clue:pilgrim-wagon`, `taint:dreamed`; also `abbess-doubt`, `abbess-wary`, `crypt-seen`,
 * `sister-trust` / `sister-wary`, `honor:shielded-the-kit`, `honor:remembered-the-gone`,
 * `honor:freed-the-pilgrim`, `clue:true-face`. Local: `pilgrim-errand`, `kit-key`.
 */
export const ACT_V: Act = {
  scenes: [
    // The welcome (mission-gate/supper, mission-gate/stay)
    s(
      'a5-threshold',
      CH.V,
      'Washing the Road Off',
      'abbess-welcome',
      'Inside the gate the yard is swept and the air smells of bread and woodsmoke. Two nuns come with a basin of warm water and soft cloths. The Abbess kneels, laughing at her own stiff knees, and begins to wash the dust from the toddler\'s feet herself, humming. The sister snatches him back. The Abbess only holds the cloth out to her. "You do it, then. You know him best." After a long moment the sister takes it. A young novice puts a cup of cool water into your paws and bows to the sword on your back as if she knows what it is. Nobody asks where you have come from. Nobody asks you for anything.',
      {
        choices: [
          {
            id: 'wash',
            label: 'Wash the road from your own paws and go in to supper.',
            to: 'supper',
            heal: 1,
          },
          {
            id: 'bow',
            label:
              'Bow to the Abbess the way you would bow to a priestess at home.',
            to: 'supper',
          },
        ],
      },
    ),

    // Supper (extends `supper`)
    s(
      'a5-her-hands',
      CH.V,
      'Look at the Hands',
      'abbess-supper',
      "Her face is kind all the way through, just as the crow said a face might be. So you look at her hands. They are old and clean and folded on the table, and they are very still; she does not eat. Under every claw, packed so deep that no scrubbing has reached it, is a dark rind of black candle wax. When the toddler knocks over his cup, her paws move before her face does, quick as a heron's beak, and catch it before it falls. Then the smile arrives, a moment late, and sets the cup back in front of him.",
      {
        effects: { flag: 'abbess-doubt' },
        choices: [
          {
            id: 'on',
            label: 'Look down at your stew before she feels you looking.',
            to: 'after-supper',
          },
        ],
      },
    ),
    s(
      'a5-true-face',
      CH.V,
      'Through the Feather',
      'abbess-supper',
      'Under the edge of the table you lift the black feather and look through its vane. The room goes grey and very sharp. The nuns are otters, tired ones; one, a young novice, is so afraid that the jug shakes in her paws. The children are children. The Abbess is exactly the same: round, kind, smiling. It is her shadow on the wall behind her that is wrong. The candles throw it long, and it keeps on going past the edge of the wall, coiled and patient and larger than the room, turned toward the toddler the way a flower turns toward the sun. Then she looks straight at the feather, and smiles at it.',
      {
        effects: { flags: ['abbess-doubt', 'clue:true-face'] },
        choices: [
          {
            id: 'on',
            label: 'Put the feather away and finish your stew.',
            to: 'after-supper',
          },
          {
            id: 'novice',
            label:
              'Lower the feather and watch the frightened novice clear the bowls.',
            to: 'a5-scullery',
          },
        ],
      },
    ),
    s(
      'a5-kit-supper',
      CH.V,
      'Our Quiet One',
      'rabbit-kit',
      'At the far end of the table sits a rabbit kit, older than the toddler and younger than the sister, in a clean grey smock. His ears lie flat down his back. He has not touched his stew. A nun refills his cup and strokes his head as she passes. "Our quiet one," she tells you fondly. "He has been with us a long time." The kit watches the toddler eat. Then, very carefully, so that no nun sees, he slides his own full bowl along the bench until it touches the toddler\'s elbow, and folds his paws in his lap.',
      {
        effects: { flag: 'met:kit' },
        choices: [
          {
            id: 'nod',
            label: 'Catch his eye and nod your thanks.',
            to: 'after-supper',
          },
          {
            id: 'bread',
            label: 'Push your own bread down the table to him.',
            to: 'after-supper',
          },
        ],
      },
    ),

    // After supper (extends `after-supper`)
    s(
      'a5-scullery',
      CH.V,
      'The Scullery',
      'wren',
      'The scullery is hot and narrow and smells of lye. The novice is young, an otter whose face is still soft with youth, and her paws shake so that the bowls chatter in the tub. She scrubs without looking at you. "You shouldn\'t," she says to the water. "Guests don\'t. You should—" A door opens behind you. An old nun says "Wren," only that, and the novice\'s mouth shuts like a box. She thanks you for your help in a voice that has been taught to be pleasant. All the way down the passage you can feel her watching your back.',
      {
        effects: { flag: 'met:wren' },
        choices: [
          {
            id: 'courtyard',
            label: 'Walk the courtyard before sleeping.',
            to: 'courtyard',
          },
          {
            id: 'sleep',
            label: 'Look in on the children, then sleep.',
            to: 'dormitory',
          },
        ],
      },
    ),

    // The second day (dormitory/sleep, locked-door/leave, caught/morning)
    s(
      'a5-day-two',
      CH.V,
      'Asked to Stay',
      'mission',
      'You wake to a bell that is not a bell: a nun striking an iron triangle in the yard. Breakfast is porridge with a spoon of honey in the middle of every bowl, and the toddler eats his honey first and then sits looking at the hole it left. The Abbess finds you at the gate, looking at the road. "The spring rains took down a stretch of our east wall," she says, "and Sister Agathe\'s back is not what it was. Would you give us one day? The little ones could rest. So could you." She does not wait for an answer. She puts a trowel in your paw.',
      {
        choices: [
          {
            id: 'stay',
            label: 'Take the trowel. One day.',
            to: 'a5-wall',
          },
          {
            id: 'go',
            label:
              'Hand the trowel back with a bow. You meant to go at first light.',
            to: 'morning',
          },
        ],
      },
    ),
    s(
      'a5-wall',
      CH.V,
      'Mud and Straw',
      'mission',
      'The breach in the east wall is wide enough for a cart. You work it with Sister Agathe, who is ancient, and a second nun who never gives her name: mud, straw and water trodden together in a pit, bricks pressed in wooden frames and laid out to bake. It is honest work, and your shoulders remember what they are for. Near noon the nuns lead the children away to the bathhouse with towels over their arms. The sister looks back at you across the yard, once. Agathe pats your arm with a paw like a dry leaf. "They\'re in good hands," she says.',
      {
        choices: [
          {
            id: 'work',
            label: 'Keep working until the children come back.',
            to: 'a5-bath',
            heal: 1,
          },
          {
            id: 'watch',
            label: 'Set down the brick frame and wait by the bathhouse door.',
            to: 'a5-bath',
          },
        ],
      },
    ),
    s(
      'a5-bath',
      CH.V,
      'Clean Clothes',
      'siblings',
      'They come back across the yard in the hottest hour. The toddler first, running, scrubbed so clean that his fur stands out like dandelion fluff, in a little white smock that flaps at his knees. He smells of soap. Behind him comes a nun with a folded white dress over her arm, and behind her the sister, wet to the ears and still in her own torn dress, the rags knotted fresh on her wrists. "She will not," the nun says, helpless. The Abbess crosses the yard to them. "Those rags must be burned, child," she says gently. "For the other children\'s sake." The sister\'s eyes come to you.',
      {
        choices: [
          {
            id: 'stand',
            label: 'Walk over and stand beside the sister.',
            to: 'a5-rags-kept',
          },
          {
            id: 'nod',
            label:
              'Nod to the sister: let them. The other children have to sleep here too.',
            to: 'a5-rags-burned',
          },
        ],
      },
    ),
    s(
      'a5-rags-kept',
      CH.V,
      'Her Own Clothes',
      'siblings',
      'You wipe your paws on your poncho and go and stand beside her. You say nothing. You do not have to. The Abbess looks at you, and at the girl, and then she laughs, warm as an oven. "Well. Grief has its own clothes," she says, "and so does stubbornness." She takes the white dress from the nun and folds it over her own arm, smoothing it as she goes. "It will keep." The sister washes her rags at the trough with her own paws, wrings them out, and ties them back on wet. Then she comes and sits on the woodpile near the wall, near you, closer than she has ever sat.',
      {
        effects: { flag: 'sister-trust' },
        choices: [
          {
            id: 'on',
            label: 'Go back to the wall.',
            to: 'a5-paw-print',
          },
        ],
      },
    ),
    s(
      'a5-rags-burned',
      CH.V,
      'The White Dress',
      'siblings',
      'You nod to her: let them. Her face does something you will remember for a long time. She goes with the nun without a sound and comes back in the white dress, which is too short for her. Her wrists are bare, and the scars on them are pink and many, and every nun in the yard sees them. Her rags go into the kitchen fire. All afternoon she sits apart from you with her arms wrapped round her knees. In the evening you see that she has torn a strip from the hem of the white dress and bound her wrists again.',
      {
        effects: { flag: 'sister-wary' },
        choices: [
          {
            id: 'on',
            label: 'Go back to the wall.',
            to: 'a5-paw-print',
          },
        ],
      },
    ),
    s(
      'a5-paw-print',
      CH.V,
      'A Small Paw in the Wall',
      'mission',
      'Late in the afternoon the wall is whole again, a long dark scar of new adobe drying pale at the edges. The toddler, who has watched you all day from the shade, totters over in his white smock, reaches up and presses his whole paw into the last wet brick before anyone can stop him. He looks at the print, astonished, and at his paw, and at you. Five round toes, right there in the wall. By morning it will be dry. It will outlast the mission and the road, and very likely all of you. The sister comes and looks at it a long while. Then she sets her own paw beside it, and presses.',
      {
        effects: { resolve: 1 },
        choices: [
          {
            id: 'smooth',
            label: 'Smooth the edges of the brick so the prints will keep.',
            to: 'a5-commission',
          },
          {
            id: 'kit',
            label:
              'Follow the rabbit kit, who has been watching from the woodpile.',
            to: 'a5-kit-box',
          },
        ],
      },
    ),
    s(
      'a5-kit-box',
      CH.V,
      "The Quiet One's Box",
      'rabbit-kit',
      "The rabbit kit waits until no nun is looking, then leads you behind the woodpile, where the wall throws its longest shadow. From under a loose brick he draws a tin box and opens it. Inside, laid out neatly: a hair ribbon. A wooden whistle. A spoon bent by small teeth. A doll's stitched shoe. Things left behind. He touches each one, the way the dead are touched where you come from. Then he lifts the tin's false bottom. Under it lies an old iron key, black with candle grease. He looks at it, and at the toddler across the yard, and holds it out to you.",
      {
        effects: { flag: 'met:kit' },
        choices: [
          {
            id: 'take',
            label: 'Take the key.',
            to: 'a5-commission',
            flag: 'kit-key',
          },
          {
            id: 'return',
            label: 'Close his paw over the key and shake your head.',
            to: 'a5-commission',
          },
          {
            id: 'doll',
            label:
              'Lay the cloth doll from the empty cot in the box, beside her shoe.',
            to: 'a5-commission',
            needs: 'doll-found',
            hint: 'You carry nothing of hers to give.',
            flag: 'honor:remembered-the-gone',
          },
        ],
      },
    ),

    // The Abbess's commission
    s(
      'a5-commission',
      CH.V,
      "The Abbess's Errand",
      'abbess-welcome',
      'At the hour of rest the Abbess sends for you. Her study is small and cool, full of books with cracked spines, and its one window looks south. She pours you a cup of water so cold it hurts your teeth. "I have a favour to ask of a man with a sword," she says. "One of our children is to go to the sister house in Dustwater. A pilgrim, a little girl, with a family waiting for her there. The road is no place for a nun with a cart. Drive her for us. Leave at dawn, back in four days. Two casks of water, and silver besides." She smiles. "Your two will be here, fed and safe, when you come back for your pay."',
      {
        choices: [
          {
            id: 'accept',
            label:
              'Accept the errand. The water would carry the three of you far.',
            to: 'a5-errand-taken',
          },
          {
            id: 'refuse',
            label: 'Refuse, with a bow.',
            to: 'a5-errand-refused',
          },
        ],
      },
    ),
    s(
      'a5-errand-taken',
      CH.V,
      'A Letter in Black Wax',
      'pilgrim-wagon',
      'You nod. She is delighted, and it is a real delight, which is the hard part. She gives you the first cask now, "for good faith," and a letter sealed with black wax for the sister house. The wax is cool and smooth under your thumb. Through the study window you can see the sister sitting on the new wall, watching the study door. She cannot have heard what was agreed. She knows anyway. She has been left before.',
      {
        effects: { flag: 'pilgrim-errand', gain: 'water' },
        choices: [
          {
            id: 'on',
            label: 'Go back out into the heat.',
            to: 'a5-well',
          },
        ],
      },
    ),
    s(
      'a5-errand-refused',
      CH.V,
      'Rarer Than Water',
      'abbess-welcome',
      'You bow, and say no: the one word. The Abbess is not offended. If anything she looks at you the way a teacher looks at a pupil who has surprised her. "No," she agrees softly. "You would not leave them, would you? Not even with us." She sets the cold cup down. "That is a rare thing on these roads. Rarer than water." She thanks you for the wall. When you come out into the heat, the sister is sitting on the new wall, watching the study door. She looks away quickly, but not quickly enough.',
      {
        effects: { flags: ['abbess-wary', 'sister-trust'] },
        choices: [
          {
            id: 'on',
            label: 'Go back to your chores.',
            to: 'a5-well',
          },
        ],
      },
    ),

    // Sister Wren's note
    s(
      'a5-well',
      CH.V,
      'A Word in the Bucket',
      'wren',
      "At sundown you are sent to draw water for the kitchen, and the young novice from the scullery is sent with you. Her name is Wren; the other nuns say it often, the way you call a dog that strays. She works the windlass without a word. When the bucket comes up she bends over it, and her paw goes into the water and out again, quick, and then she is walking back to the kitchen with her own full pail. Floating in the bucket you hold is a scrap of paper, folded small. Inside, in a careful novice's hand, one word: GO.",
      {
        effects: { flag: 'met:wren' },
        choices: [
          {
            id: 'tell',
            label:
              'Show the note to the Abbess and watch her face when she reads it.',
            to: 'a5-tell-abbess',
            flag: 'wren-betrayed',
          },
          {
            id: 'burn',
            label: 'Burn it in the kitchen fire and say nothing to anyone.',
            to: 'a5-note-burned',
          },
          {
            id: 'ask',
            label: 'Find Wren alone after vespers and ask her why. (Mercy · 9)',
            to: 'a5-wren-afraid',
            check: {
              attribute: 'mercy',
              target: 9,
              success: 'a5-wren-talk',
              failure: 'a5-wren-afraid',
              bonus: { flag: 'abbess-doubt', amount: 2 },
            },
          },
        ],
      },
    ),
    s(
      'a5-tell-abbess',
      CH.V,
      'An Honest Guest',
      'chapel',
      'You find the Abbess at her prayers and lay the note on the bench beside her. She reads it. For the space of one breath her face is not there at all; there is only a stillness where it was, like a pond after a stone. Then it comes back, sad and fond. "Poor Wren. She has always had nightmares." She folds the note into her sleeve. "Thank you for your honesty. You must be uneasy in a strange house. Keep the little ones by you tonight, in your own room, if it eases you." Her paw rests on your shoulder, light as a moth.',
      {
        effects: { flag: 'abbess-doubt' },
        choices: [
          {
            id: 'on',
            label: 'Fetch the children to your room.',
            to: 'a5-trusted-night',
          },
        ],
      },
    ),
    s(
      'a5-trusted-night',
      CH.V,
      'Voices in the Corridor',
      'empty-cot',
      "The children sleep on your blanket with their backs against your legs, the sister's fist knotted in your poncho. No nun comes to the door. Near midnight you hear it through the wall: a girl's voice in the corridor, small and pleading, asking for something over and over. Then the Abbess's voice, soft and soothing, the voice of someone settling a child after a bad dream. Footsteps going down. A door. Then nothing at all. The sister is awake. She is looking at you in the dark.",
      {
        choices: [
          {
            id: 'stay',
            label: 'Stay with the children. They are what you are here for.',
            to: 'a5-dream',
          },
          {
            id: 'follow',
            label:
              "Ease the sister's fist from your poncho and go after the voices.",
            to: 'a5-wren-taken',
          },
        ],
      },
    ),
    s(
      'a5-wren-taken',
      CH.V,
      'A Stripped Cot',
      'locked-door',
      "The corridor is empty and the candles are out. At its end the door to the cellar stair is shut and locked, and when you put your ear to it there is only the cold draft and the smell of wax. You stand there until your legs ache. Nothing comes up. At first light a new novice is carrying the water. When you look for Wren, an old nun tells you kindly that she has gone to the sister house in Dustwater; she asked to go. In the novices' room her cot has been stripped to the boards.",
      {
        effects: { resolve: -1 },
        choices: [
          {
            id: 'on',
            label: 'Go out into the yard.',
            to: 'a5-dawn',
          },
        ],
      },
    ),
    s(
      'a5-note-burned',
      CH.V,
      'What Nobody Learns',
      'wren',
      "You fold the note once more and feed it to the kitchen fire while the cook's back is turned. It goes up in a breath. At supper Wren will not look at you, and you do not look at her, and that is the whole of the agreement between you. Once, when the Abbess passes behind her chair and touches her shoulder, the novice's paws go still on the table and stay still, the way a mouse stays still under a hawk's shadow. Whatever she knows, she will carry alone. It is all you can give her: no one will learn from you that she spoke.",
      {
        effects: { flag: 'honor:kept-wrens-secret' },
        choices: [
          {
            id: 'on',
            label: 'Go to the dormitory.',
            to: 'a5-night-two',
          },
        ],
      },
    ),
    s(
      'a5-wren-talk',
      CH.V,
      'The Novice',
      'wren',
      'You find her alone in the chapel after vespers, trimming wicks. She drops the scissors when she sees you. Then she looks at your face for a long time, and whatever she finds there, she decides. "They go down," she whispers. "The little ones. They go down the stair and they don\'t come up. I was one of hers too, once. She kept me. I don\'t know why she kept me." She touches the iron key at her belt, warm from her habit. "The stair door. Tonight, when the bell would ring if it could. I\'ll open it, and hold it for you. I can\'t do more. I can\'t."',
      {
        effects: { flags: ['wren-ally', 'abbess-doubt'] },
        choices: [
          {
            id: 'on',
            label: 'Bow to her, and go to the dormitory.',
            to: 'a5-night-two',
          },
        ],
      },
    ),
    s(
      'a5-wren-afraid',
      CH.V,
      'I Never Wrote Anything',
      'wren',
      'You find her alone in the chapel after vespers, trimming wicks. When she sees you she drops the scissors, and before you can show her your empty paws she has backed into the altar rail with her eyes as wide as a hare\'s. "I never," she says. "I never wrote anything. I don\'t know you." She runs. At supper the Abbess passes you the bread herself. "Our Wren tells me you have been asking after her," she says, smiling. "She is very young. You will forgive her." Wren pours the water with her eyes on the jug. Her paws do not shake at all now.',
      {
        effects: { flag: 'abbess-wary' },
        choices: [
          {
            id: 'on',
            label: 'Go to the dormitory.',
            to: 'a5-night-two',
          },
        ],
      },
    ),

    // The second night
    s(
      'a5-night-two',
      CH.V,
      'The Second Night',
      'empty-cot',
      "The mission goes to sleep around you in the order it always does: the nuns' doors, the kitchen fire, the chapel candles one by one. The children are asleep on their cot, the sister curled round her brother, her ears twitching at dreams. Across the dormitory the rabbit kit lies in his own cot with his eyes open. You sit with your back to the wall and your sword across your knees, and the dark comes up around you like water: warm, and heavy, and kind.",
      {
        choices: [
          {
            id: 'sleep',
            label: 'Let sleep take you.',
            to: 'a5-dream',
          },
          {
            id: 'watch',
            label: 'Pinch the web of your paw and keep watch until dawn.',
            to: 'a5-vigil',
          },
          {
            id: 'wren',
            label:
              'Go to the cellar stair, where Wren said she would hold the door.',
            to: 'a5-crypt-wren',
            needs: 'wren-ally',
            hint: 'No one in this house has offered to help you.',
          },
          {
            id: 'key',
            label: "Take the kit's key to the locked door.",
            to: 'a5-crypt-key',
            needs: 'kit-key',
            hint: 'You have no key to the locked door.',
          },
        ],
      },
    ),
    s(
      'a5-vigil',
      CH.V,
      'The Long Watch',
      'empty-cot',
      "You keep yourself awake the way soldiers do at home: a pinch, a count, a slow breath held and let go. Twice in the night a nun comes to the doorway with a shaded candle. She does not look at you. She looks at the toddler, a long while, the way a cook looks at bread rising, and goes away. The second time it is the Abbess. She stands at the foot of the children's cot with her paws folded and her lips moving, and when she leaves, the smell of her candle stays. By dawn your eyes are full of sand.",
      {
        effects: { flag: 'abbess-doubt', resolve: -1 },
        choices: [
          {
            id: 'on',
            label: 'Get up with the light.',
            to: 'a5-dawn',
          },
        ],
      },
    ),
    s(
      'a5-crypt-wren',
      CH.V,
      'The Door She Holds',
      'altar',
      'Wren is waiting at the top of the stair without a candle, shaking so hard you can hear her teeth. She unlocks the door and sets her back against it. "Be quick," she breathes. Stone steps go down into candlelight. At the bottom: an altar, coils of rope, black candles burned to stubs by many nights. Behind the altar the wall is wrong. It is deep, the way water is deep, and something on the other side of it is very large and very patient, and it has noticed you. Above you, Wren knocks once, softly. Someone is coming.',
      {
        effects: { flag: 'crypt-seen' },
        choices: [
          {
            id: 'flee',
            label: 'Run up, wake the children and go over the wall tonight.',
            to: 'night-flight',
          },
          {
            id: 'hide',
            label: 'Wave Wren away and hide by the altar to see who comes.',
            to: 'cellar',
          },
          {
            id: 'back',
            label: 'Go up with Wren and lie down before you are missed.',
            to: 'a5-dream',
          },
        ],
      },
    ),
    s(
      'a5-crypt-key',
      CH.V,
      "The Kit's Key",
      'altar',
      "The kit's key turns as if it has been oiled for years. The stair goes down into candlelight and a cold that has nothing to do with stone. An altar. Rope. Black candles burned down by many nights. Behind the altar the wall is deep the way water is deep, and something on the other side of it leans toward the light, patient as a tide. When you climb back up, the kit is crouched on the top step in his grey smock, waiting for his key. At the far end of the corridor a lantern is turning the corner.",
      {
        effects: { flag: 'crypt-seen' },
        choices: [
          {
            id: 'shield',
            label:
              'Push the kit behind the door and step into the lantern light yourself.',
            to: 'a5-kit-shielded',
          },
          {
            id: 'run',
            label: 'Press the key into his paw and melt back into the dark.',
            to: 'a5-kit-caught',
          },
          {
            id: 'flee',
            label: 'Wake the children and go over the wall, now.',
            to: 'night-flight',
          },
        ],
      },
    ),
    s(
      'a5-kit-shielded',
      CH.V,
      'You Do Keep Finding the Cellar',
      'rabbit-kit',
      'You push the kit behind the open door and walk into the lantern light with the key in your own paw. It is the Abbess. She looks at you, and at the key, and at the open stair. "You do keep finding the cellar," she says sorrowfully, and holds out her paw. You give her the key. She does not ask where you got it. She does not look behind the door. She walks you back to the dormitory, tucks your blanket round your knees as if you were one of hers, and wishes you good night. Much later, a small shape slides silently into the cot across the room.',
      {
        effects: {
          flags: ['abbess-wary', 'honor:shielded-the-kit'],
          attr: { attribute: 'mercy', amount: 1 },
        },
        choices: [
          {
            id: 'sleep',
            label: 'Close your eyes at last.',
            to: 'a5-dream',
          },
        ],
      },
    ),
    s(
      'a5-kit-caught',
      CH.V,
      'Two Sets of Footsteps',
      'rabbit-kit',
      'You press the key into his paw and step back into the dark between two doors. The kit runs down the corridor without a sound, the key clutched to his chest. The lantern stops. You hear nothing: no voice, no blow. Only the lantern going away, slowly, with two sets of footsteps under it instead of one. You stand in the dark a long time. When the grey light comes, the kit is already on his knees in the yard, scrubbing the chapel steps, and his paws are raw. When you pass, he does not look up. He does not look at you again.',
      {
        effects: { resolve: -1 },
        choices: [
          {
            id: 'on',
            label: 'Walk past him.',
            to: 'a5-dawn',
          },
        ],
      },
    ),

    // The dream
    s(
      'a5-dream',
      CH.V,
      'The Road of Light',
      'the-dream',
      'You dream of the desert at night, and it is not empty. Something lies coiled beneath the whole of it, the way a river lies under sand, and it is speaking. Not in words. It knows you. It knows how far you have walked and what you walked away from, and it is sorry; it is so sorry. *I can show you the road home,* it says, and in the dark a road begins to shine, a thread of pale light running away over the dunes toward a place you have not let yourself think of in years. *Only listen.*',
      {
        choices: [
          {
            id: 'listen',
            label: 'Listen.',
            to: 'a5-dream-home',
            unless: 'homeland-lost',
          },
          {
            id: 'listen-lost',
            label:
              'Listen, though the crow took the road it means to show you.',
            to: 'a5-dream-empty',
            needs: 'homeland-lost',
            hint: 'You still remember the way home.',
          },
          {
            id: 'wake',
            label: 'Bite down hard and wake.',
            to: 'a5-dream-wake',
          },
        ],
      },
    ),
    s(
      'a5-dream-home',
      CH.V,
      'It Was Never Far',
      'the-dream',
      'You listen. The road of light runs over the dunes and the salt pans and the mountains, and at the end of it is your valley, green and wet, and the temple roof, and at dusk the bell rings, the real bell, while your mother cooks. You would know that sound anywhere. *There,* it says. *It is not far. It was never far. I will keep it for you.* You wake rested as you have not been in a year, your hurts eased and your mind as clear as well water. When you lift the toddler for breakfast, he screams, and does not stop until his sister takes him.',
      {
        effects: { flag: 'taint:dreamed', heal: 3, resolve: 2 },
        choices: [
          {
            id: 'on',
            label: 'Go out into the morning.',
            to: 'a5-dawn',
          },
        ],
      },
    ),
    s(
      'a5-dream-empty',
      CH.V,
      'A Hole the Shape of a Crow',
      'the-dream',
      'You listen. The road of light runs away over the dunes, and then it stops, as if it has come to the edge of a page. Where your home should be there is only a hole the shape of a crow. The coiled thing turns this over for a while, puzzled, almost tender. *She took it,* it says. *Then I will find something else that you want.* It is in no hurry. Its attention turns, slow and warm, toward the cot where the children are sleeping, and rests there, the way a thumb rests on a coin. You wake rested and clear-headed. You do not feel grateful.',
      {
        effects: { flag: 'taint:dreamed', heal: 3, resolve: 1 },
        choices: [
          {
            id: 'on',
            label: 'Go out into the morning.',
            to: 'a5-dawn',
          },
        ],
      },
    ),
    s(
      'a5-dream-wake',
      CH.V,
      'Sleepwalker',
      'the-dream',
      'You do not listen. You bite down on your own tongue, and the taste of blood hauls you up out of the dark like a rope. The road of light goes out. You are sitting against the dormitory wall with your sword across your knees, and the sister is not in her cot. She is standing at the end of the hall, barefoot, asleep on her feet, facing the locked door with one paw raised to it. You lift her the way you would lift her brother, and she does not wake. You carry her back. Her fist closes in your poncho and stays closed until dawn.',
      {
        effects: { flag: 'sister-trust' },
        choices: [
          {
            id: 'on',
            label: 'Keep watch until the light comes.',
            to: 'a5-dawn',
          },
        ],
      },
    ),

    // The second dawn
    s(
      'a5-dawn',
      CH.V,
      "A Pilgrim's Flag",
      'pilgrim-wagon',
      "You are up before the triangle, standing on the new wall in the grey light. The small paw print has dried pale and hard. Below you in the yard a nun is harnessing a mule to a little closed wagon with a white cloth tied to its hoop, a pilgrim's flag, and she tests every strap twice. In the dormitory window the sister is already awake, sitting on the sill with her brother asleep in her lap, watching the wagon and then you, the wagon and then you.",
      {
        choices: [
          {
            id: 'wagon',
            label: 'Take the reins of the pilgrim wagon, as you promised.',
            to: 'a5-wagon-road',
            needs: 'pilgrim-errand',
            hint: 'You made the Abbess no promise.',
          },
          {
            id: 'gate',
            label: 'Climb down and walk past the wagon to the gate.',
            to: 'morning',
          },
        ],
      },
    ),
    s(
      'a5-wagon-road',
      CH.V,
      'The Pilgrim Wagon',
      'pilgrim-wagon',
      "The mule knows the road better than you do. The wagon is small and closed, its canvas laced tight, the white cloth snapping on its hoop. The Abbess told you the child is sleeping and must not be woken; she is delicate, and the sun is bad for her. At the gate the sister stood with her brother on her hip and did not wave. By noon the mission's tower is a nail on the horizon behind you. Then, from inside the wagon, very faint, comes a small sound, like someone trying to say a word through cloth.",
      {
        choices: [
          {
            id: 'drive',
            label: 'Drive on. The Abbess said she must not be woken.',
            to: 'a5-delivered',
          },
          {
            id: 'look',
            label: 'Stop the mule, unlace the canvas and look.',
            to: 'a5-wagon-look',
          },
        ],
      },
    ),
    s(
      'a5-wagon-look',
      CH.V,
      'One, as Agreed',
      'pilgrim-wagon',
      'Under a blanket in the wagon bed lies a field mouse girl no bigger than the toddler, in a white smock like his. Her eyes are half open and see nothing. Her breath smells sweet, the way the black candles smell. Round her wrist is a paper tag, and on it, in a careful hand, one word: *Season.* Wedged under the seat is a ledger of barrels and names, years of them. And the letter for the sister house is not addressed to any sister. Black wax, and on the front: *Mr G. Vane, Dustwater. One, as agreed.*',
      {
        effects: { flags: ['clue:pilgrim-wagon', 'abbess-doubt'] },
        choices: [
          {
            id: 'deliver',
            label:
              'Lace the canvas and drive on. Your two are at the mission, and the water is theirs.',
            to: 'a5-delivered',
          },
          {
            id: 'carry',
            label:
              'Lift her out, keep the letter, and carry her into Dustwater yourself.',
            to: 'a5-pilgrim-freed',
          },
        ],
      },
    ),
    s(
      'a5-delivered',
      CH.V,
      'Regards to the Mother',
      'pilgrim-wagon',
      'An hour short of Dustwater, where the road passes a stone well-house, two men in clean hats wait beside a water cart. A little arrow is branded on every barrel. They do not ask your name. One climbs into your wagon and comes out with the blanket bundle over his shoulder, the way a man carries a sack of meal. The other rolls a cask down to you and counts silver into your paw without meeting your eye. "Regards to the Mother," he says. They drive off toward town. You stand by the well with the silver. It is the heaviest thing you have ever carried.',
      {
        effects: { flag: 'taint:delivered', gain: 'water' },
        choices: [
          {
            id: 'on',
            label: 'Walk the last hour into Dustwater.',
            to: 'posters',
          },
        ],
      },
    ),
    s(
      'a5-pilgrim-freed',
      CH.V,
      'Only Asleep',
      'dust-road',
      'You leave the mule and the wagon in a dry wash for whoever finds them, and you carry the girl. She weighs nothing. Somewhere in the hot afternoon she wakes on your back and is very sick, and then she cries for her mother, which is the first word you have heard from her and the best. You give her water a sip at a time. The letter rides inside your coat, against your ribs, black wax and all. When the roofs of Dustwater rise out of the heat she is asleep again, but this time only asleep.',
      {
        effects: { flags: ['honor:freed-the-pilgrim', 'abbess-wary'] },
        choices: [
          {
            id: 'on',
            label: 'Carry her into Dustwater.',
            to: 'posters',
          },
        ],
      },
    ),
  ],
  extend: {
    supper: [
      {
        id: 'hands',
        label: "Remember the crow's words, and watch the Abbess's hands.",
        to: 'a5-her-hands',
        needs: 'clue:look-at-the-hands',
        hint: 'Nothing has told you where to look.',
      },
      {
        id: 'feather',
        label: "Under the table, lift the crow's black feather to your eye.",
        to: 'a5-true-face',
        needs: 'feather',
        hint: 'You have only your own eyes.',
      },
      {
        id: 'kit',
        label: 'Watch the small rabbit at the far end of the table.',
        to: 'a5-kit-supper',
      },
    ],
    'after-supper': [
      {
        id: 'scullery',
        label: 'Carry the stacked bowls to the scullery for the young novice.',
        to: 'a5-scullery',
      },
    ],
  },
  reroute: {
    'mission-gate/supper': 'a5-threshold',
    'mission-gate/stay': 'a5-threshold',
    'dormitory/sleep': 'a5-day-two',
    'locked-door/leave': 'a5-day-two',
    'caught/morning': 'a5-day-two',
  },
}
