/*
 * Book One: The Bell That Never Rang. Section text and graph.
 *
 * World authority: conductor worlds/zuzu (README, WORLD-GUIDE incl. its 2026-10-09
 * gazetteer) and Book One. The acts follow Book One's chapters as an alternate
 * trail: watering hole, Hollow Bell, the followers, the mission's welcome, the
 * notices, the dark. Silas, 2026-10-09: the Abbess welcomes Zuzu with food and
 * lodging before anything turns, and the fight is earned through clues.
 */
import type { Act, Choice, Scene } from './types'
import { CH, s } from './sections'
import { ACTS } from './acts'

const scenes: Scene[] = [
  // I · WATERS — Book One ch. 1
  s(
    'the-crossing',
    CH.I,
    'The Thirsting Road',
    'waterhole',
    'Heat holds the valley by its throat. Beneath a sickle of red stone, a narrow watering hole has survived the summer, ringed by black stones. A one-eyed coyote watches from the far bank. The hilt of your sword casts a thin shadow over your shoulder. Nothing moves beneath the black water. That, perhaps, is the troubling part.',
    {
      choices: [
        {
          id: 'approach',
          label: 'Approach the stranger. Offer the last of your water.',
          to: 'coyote',
          requires: 'water',
          spend: 'water',
          flag: 'coyote-kindness',
        },
        {
          id: 'stare',
          label: 'Kneel, drink, and meet his eye across the water.',
          to: 'standoff',
        },
        {
          id: 'listen',
          label: 'Study the ripples before you step closer. (Sense · 9)',
          to: 'crocodile',
          check: {
            attribute: 'sense',
            target: 9,
            success: 'hidden-pool',
            failure: 'crocodile',
          },
        },
        {
          id: 'avoid',
          label: 'Leave the water and follow the long dust road.',
          to: 'dust-road',
        },
      ],
    },
  ),
  s(
    'standoff',
    CH.I,
    'Two Strangers, One Pool',
    'coyote',
    'You drink with cupped paws and never lower your eyes. Across the water the coyote does the same. His coat is patched past saving and his one eye does not blink. His right hand drifts toward the revolver on his hip. Your own hand rises, slow as a held breath, toward the hilt above your shoulder. Neither of you has decided anything yet. The water decides for you.',
    {
      choices: [
        {
          id: 'open-hand',
          label: 'Let your hand fall open, slowly. (Mercy · 9)',
          to: 'coyote',
          check: {
            attribute: 'mercy',
            target: 9,
            success: 'coyote',
            failure: 'crocodile',
          },
        },
        {
          id: 'hold',
          label: 'Hold his eye. Do not draw. (Steel · 9)',
          to: 'crocodile',
          check: {
            attribute: 'steel',
            target: 9,
            success: 'croc-ready',
            failure: 'crocodile',
          },
        },
      ],
    },
  ),
  s(
    'hidden-pool',
    CH.I,
    'The Thing Below',
    'ripples',
    'A disturbance travels against the wind. The silhouette beneath the surface is longer than your sword. You find a ledge above the bank, giving you a heartbeat to prepare while the coyote remains oblivious.',
    {
      choices: [
        {
          id: 'warn',
          label: 'Warn the coyote and draw from high ground.',
          to: 'croc-ready',
          flag: 'coyote-warned',
        },
        {
          id: 'withdraw',
          label: 'Slip away before the surface breaks.',
          to: 'dust-road',
        },
      ],
    },
  ),
  s(
    'coyote',
    CH.I,
    'An Unsteady Truce',
    'coyote',
    'The coyote lowers his hand a finger at a time. When you hold out the canteen he takes it without lowering his one good eye. His fingers tremble with thirst. He passes the canteen back. Behind him, an impossible ripple splits the black water.',
    {
      choices: [
        {
          id: 'defend',
          label: 'Pull him clear and stand your ground.',
          to: 'crocodile',
          flag: 'coyote-warned',
        },
        {
          id: 'alone',
          label: 'Trust him to run. Take the ridge path.',
          to: 'dust-road',
        },
      ],
    },
  ),
  s(
    'croc-ready',
    CH.I,
    'Already Moving',
    'crocodile',
    'The pool bursts upward in a wall of mud and teeth, and you are already moving. The crocodile is only an animal, old and starving and enormous, but it has waited all summer for something to kneel at its water. Your blade clears the scabbard in the same breath the jaws open.',
    {
      effects: { resolve: 1 },
      choices: [
        { id: 'meet', label: 'Meet it in the shallows.', to: 'crocodile' },
      ],
    },
  ),
  s(
    'crocodile',
    CH.I,
    'The Water Has Teeth',
    'crocodile',
    'The surface erupts. An enormous river crocodile tears from the shallows, its jaw wide enough to swallow your kasa. The coyote falls backward, reaching for his gun. There is no time for another plan.',
    {
      battle: {
        name: 'River Croc',
        hp: 8,
        guard: 1,
        attack: 3,
        win: 'aftermath',
        lose: 'ending-water',
      },
    },
  ),
  s(
    'aftermath',
    CH.I,
    'What Mercy Costs',
    'coyote-wounded',
    'The pool falls still around the floating croc. The coyote sits in the dust holding his right arm to his chest. His gun hand is gone at the wrist. He flinches when you come near, then sees the bandage in your hand and does not move again.',
    {
      choices: [
        {
          id: 'bandage',
          label: 'Bind the wrist, and leave your bandage with him.',
          to: 'parting',
          requires: 'bandage',
          spend: 'bandage',
          flag: 'coyote-trust',
        },
        {
          id: 'apple',
          label: 'Leave an apple at his side and travel on.',
          to: 'parting',
          requires: 'apple',
          spend: 'apple',
          flag: 'coyote-kindness',
        },
        {
          id: 'road',
          label: 'Save your supplies for the road ahead.',
          to: 'hollow-bell',
        },
      ],
    },
  ),
  s(
    'parting',
    CH.I,
    'Backs to Each Other',
    'coyote-bandaged',
    'He tests your knot with his teeth and nods once. Neither of you says a word. You walk east; he walks west; neither looks back. A long way out, you realise you have been listening for the hammer of a revolver behind you and it never came. Somewhere a debt has been written down in a language neither of you speaks.',
    {
      effects: { flag: 'coyote-debt' },
      choices: [
        {
          id: 'gullies',
          label: 'Follow the dry gullies east.',
          to: 'dust-road',
        },
        {
          id: 'smoke',
          label: 'Walk toward the smoke on the horizon.',
          to: 'hollow-bell',
        },
      ],
    },
  ),
  s(
    'dust-road',
    CH.I,
    'The Long Way Round',
    'dust-road',
    'The trail climbs through dry gullies where bleached roots hold the dust together. A single twisted tree keeps watch over the road. At dusk you see smoke on the horizon, and beneath it a hollow bell tower over a town that should have been alive.',
    {
      choices: [
        {
          id: 'hurry',
          label: 'Descend before the sun dies.',
          to: 'hollow-bell',
        },
        {
          id: 'rest',
          label: 'Make camp and recover your breath.',
          to: 'cold-camp',
        },
      ],
    },
  ),
  s(
    'cold-camp',
    CH.I,
    'Fire or Darkness',
    'camp',
    "Night comes down cold and enormous. The sky is so full of stars it looks spilled. A fire would warm your hands and tell everything within a day's walk exactly where you sleep. Without one, you will shiver until dawn and wake unseen.",
    {
      choices: [
        {
          id: 'fire',
          label: 'Strike a small fire behind the rocks.',
          to: 'hollow-bell',
          requires: 'flint',
          heal: 3,
        },
        {
          id: 'cold',
          label: 'Wrap your poncho tight and keep a cold camp.',
          to: 'hollow-bell',
          heal: 1,
        },
      ],
    },
  ),

  // II · ASHES — Book One ch. 2–3
  s(
    'hollow-bell',
    CH.II,
    'Hollow Bell',
    'hollow-bell',
    'Hollow Bell is burning down to nothing. Smoke rolls between the timber fronts; the arch sign over the street hangs by one chain. The dead lie where they fell. You take off your wide hat. Somewhere close, something small moves beneath a burned boardwalk, and a wall of old paper notices flutters in the hot wind.',
    {
      choices: [
        {
          id: 'honour',
          label: 'Stand with the dead a while, hat in hand.',
          to: 'hb-dead',
          unless: 'honoured-dead',
        },
        {
          id: 'search',
          label: 'Kneel beside the boardwalk.',
          to: 'survivors',
        },
        {
          id: 'posters',
          label: 'Read the notices on the wall.',
          to: 'hb-notices',
          unless: 'poster-clue',
        },
        {
          id: 'store',
          label: 'Search the looted store for supplies. (Sense · 9)',
          to: 'hb-store-empty',
          check: {
            attribute: 'sense',
            target: 9,
            success: 'hb-store-find',
            failure: 'hb-store-empty',
          },
        },
      ],
    },
  ),
  s(
    'hb-dead',
    CH.II,
    'Hat in Hand',
    'hollow-bell',
    'You cannot bury a town. You close the eyes you can reach and straighten what can be straightened, a coat, a hand, a fallen hat set back on its owner. Where you come from this is simply what is done. It takes the last of the daylight, and it steadies something in you that the road had loosened.',
    {
      effects: { flag: 'honoured-dead', resolve: 1 },
      choices: [
        {
          id: 'sound',
          label: 'Follow the sound under the boardwalk.',
          to: 'survivors',
        },
      ],
    },
  ),
  s(
    'hb-notices',
    CH.II,
    'Old Paper',
    'names-wall',
    'The notices are older than the fire, curled and sun-bleached, nailed one over another. Faces drawn by careful hands: a rabbit kit, a young raccoon, a fennec girl with enormous ears. Most of the words are gone. On three of them you can still read the same four: last seen, mission road.',
    {
      effects: { flag: 'poster-clue' },
      choices: [
        {
          id: 'sound',
          label: 'Follow the sound under the boardwalk.',
          to: 'survivors',
        },
      ],
    },
  ),
  s(
    'hb-store-find',
    CH.II,
    'What the Looters Missed',
    'hb-store',
    'The shelves are bare and the counter is kicked over, but whoever stripped this place was in a hurry. Behind a loose board under the counter you find a roll of clean linen and a corked water skin, still full.',
    {
      effects: { gain: 'bandage' },
      choices: [
        {
          id: 'sound',
          label: 'A sound, under the boardwalk outside.',
          to: 'survivors',
        },
      ],
    },
  ),
  s(
    'hb-store-empty',
    CH.II,
    'Broken Glass',
    'hb-store',
    'You search too fast in bad light. Broken glass hides under the flour dust and opens the pad of your paw. There is nothing here the looters left behind except the quiet.',
    {
      effects: { hurt: 1 },
      choices: [
        {
          id: 'sound',
          label: 'A sound, under the boardwalk outside.',
          to: 'survivors',
        },
      ],
    },
  ),
  s(
    'survivors',
    CH.II,
    'Teeth and Tears',
    'siblings',
    'Two fennec children come out of the dark among the dead. The older sister, taller than you, has her arms locked around a toddler. Her dress is torn by claws and thorn; her wrists are bandaged with rags. She bares her teeth when you move. There is no trust to spend here, only trust to earn.',
    {
      choices: [
        {
          id: 'feed',
          label: 'Set a dry apple on the planks. Then step away.',
          to: 'they-follow',
          requires: 'apple',
          spend: 'apple',
          flag: 'siblings-fed',
        },
        {
          id: 'canteen',
          label: 'Leave your canteen within her reach and walk off.',
          to: 'they-follow',
          requires: 'water',
          spend: 'water',
          flag: 'siblings-fed',
        },
        {
          id: 'kneel',
          label:
            'Kneel at a distance and wait as long as it takes. (Mercy · 11)',
          to: 'they-follow',
          check: {
            attribute: 'mercy',
            target: 11,
            success: 'sister-trust',
            failure: 'they-follow',
            bonus: { flag: 'honoured-dead', amount: 2 },
          },
        },
        {
          id: 'wait',
          label: 'Retreat without speaking and let them follow.',
          to: 'they-follow',
          flag: 'siblings-follow',
        },
        {
          id: 'leave',
          label: 'Keep walking alone. You cannot save everyone.',
          to: 'ending-alone',
        },
      ],
    },
  ),
  s(
    'sister-trust',
    CH.II,
    'Her Eyes on Your Hands',
    'siblings',
    'You kneel in the ash until your knees ache. She does not stop showing her teeth, but her eyes move from your face to your hands, empty and still. The toddler reaches toward the shadow of your hat and babbles something that is not a word. When you finally stand and walk away, she follows a little closer than she means to.',
    {
      effects: { flag: 'sister-trust' },
      choices: [
        { id: 'go', label: 'Walk out of Hollow Bell.', to: 'they-follow' },
      ],
    },
  ),

  // III · THE FOLLOWERS — Book One ch. 4–5
  s(
    'they-follow',
    CH.III,
    'Two Small Shadows',
    'dust-road',
    'You leave by the east road. Two small figures follow at about the distance a thrown stone travels. You stop; they stop. You walk; they walk. You turn to look and the sister looks at the horizon as though she has always been walking this way by chance.',
    {
      choices: [
        {
          id: 'lose',
          label: 'Lose them in the gullies. (Shadow · 9)',
          to: 'two-fires',
          check: {
            attribute: 'shadow',
            target: 9,
            success: 'lost-them',
            failure: 'two-fires',
          },
        },
        { id: 'let', label: 'Let them follow.', to: 'two-fires' },
      ],
    },
  ),
  s(
    'lost-them',
    CH.III,
    'Gone',
    'zuzu-alone',
    'It is easy, in the end. A dry wash, a turn they do not see, a long wait behind a rock. When you climb back to the ridge the road behind you is empty under the rising moon. You stand there much longer than there is any reason to.',
    {
      choices: [
        {
          id: 'on',
          label: 'Walk on. It is better this way.',
          to: 'ending-alone',
        },
        {
          id: 'back',
          label: 'Go back for them.',
          to: 'two-fires',
          flag: 'went-back',
        },
      ],
    },
  ),
  s(
    'two-fires',
    CH.III,
    'Two Fires',
    'zuzu-fire',
    "Night. You make your fire in the lee of a rock. Some way off, a second fire flickers up, smaller, badly built, a child's fire. Two shapes huddle close to it. The wind is turning cold.",
    {
      choices: [
        {
          id: 'cloth',
          label:
            'Leave your spare cloth and a little food by their fire before dawn.',
          to: 'apple-tree',
          flag: 'night-kindness',
        },
        {
          id: 'watch',
          label: 'Keep watch over both fires all night. (Sense · 9)',
          to: 'apple-tree',
          check: {
            attribute: 'sense',
            target: 9,
            success: 'night-watch',
            failure: 'apple-tree',
          },
        },
        { id: 'sleep', label: 'Sleep. They are not yours.', to: 'apple-tree' },
      ],
    },
  ),
  s(
    'night-watch',
    CH.III,
    'Someone Else Is Watching',
    'zuzu-moon',
    "An hour before dawn you see it: a cowled figure on the ridge above the children's fire, very still, watching them the way a buyer watches stock. When you stand, it is gone. There are no tracks in the morning, only a smell of candle smoke where nothing burned.",
    {
      effects: { flag: 'watcher-seen' },
      choices: [
        {
          id: 'go',
          label: 'Break camp. Keep them closer today.',
          to: 'apple-tree',
        },
      ],
    },
  ),
  s(
    'apple-tree',
    CH.III,
    'Fruit in the Wasteland',
    'apple-tree',
    'A single apple tree grows where nothing should. You eat one apple in the shade and gather the rest. Behind you two small silhouettes stop when you stop. There is a flat rock beside the road.',
    {
      choices: [
        {
          id: 'leave-all',
          label:
            'Leave every apple on the rock and walk on without looking back.',
          to: 'canyon-road',
          flag: 'apples-left',
        },
        {
          id: 'take',
          label: 'Keep one apple for the road, leave the rest.',
          to: 'canyon-road',
          gain: 'apple',
          flag: 'apples-left',
        },
      ],
    },
  ),
  s(
    'canyon-road',
    CH.IV,
    'The Rope Bridge',
    'canyon',
    'The road narrows into a red canyon and ends at a gap spanned by an old rope bridge. The planks are grey and the ropes are older than anyone who could tell you about them. Far below, a dry river winds through bones. The long way down to it will take most of the day.',
    {
      choices: [
        {
          id: 'bridge',
          label: 'Cross first and test every plank. (Steel · 9)',
          to: 'bridge-fall',
          check: {
            attribute: 'steel',
            target: 9,
            success: 'bone-river',
            failure: 'bridge-fall',
          },
        },
        {
          id: 'long',
          label: 'Take the long way down through the dry river.',
          to: 'bone-river',
        },
      ],
    },
  ),
  s(
    'bridge-fall',
    CH.IV,
    'A Plank Gives',
    'canyon',
    'A plank gives under you with a sound like a dry cough. You catch the rope and hang there, the katana dragging at your back, until you can haul yourself up. Your shoulder will remember this. When you look back, the sister is already crossing, stepping only where you stepped.',
    {
      effects: { hurt: 2 },
      choices: [{ id: 'on', label: 'Go on.', to: 'bone-river' }],
    },
  ),
  s(
    'bone-river',
    CH.IV,
    'The Dry River',
    'bone-valley',
    'The riverbed is cracked white and littered with old bones. One skull is far too large and shaped like nothing you have ever hunted or eaten. Beside it, under the dust, runs a strip of stone too straight and too smooth for any river to have laid.',
    {
      choices: [
        {
          id: 'study',
          label: 'Study the bones and the straight stone. (Sense · 9)',
          to: 'wagon',
          check: {
            attribute: 'sense',
            target: 9,
            success: 'relic',
            failure: 'wagon',
          },
        },
        { id: 'pass', label: 'Leave the dead their riverbed.', to: 'wagon' },
      ],
    },
  ),
  s(
    'relic',
    CH.IV,
    'Something Went Wrong Here',
    'bone-valley',
    "The stone road runs on under the sand toward nowhere. In it are letters, worn almost smooth, in a script no one you have met can read. The bones are not an animal's and not a monster's. You do not know what they are, and you do not like that you do not know. The sister stands beside you and stares at the skull for a long time.",
    {
      effects: { flag: 'relic-seen' },
      choices: [
        { id: 'on', label: 'Walk on, and do not speak of it.', to: 'wagon' },
      ],
    },
  ),
  s(
    'wagon',
    CH.IV,
    "The Vulture's Wagon",
    'wagon',
    'A covered wagon stands abandoned by the trail, its canvas shredded. A vulture sits on top and watches you without interest. Whoever owned it left in a hurry, or did not leave at all.',
    {
      choices: [
        {
          id: 'search',
          label: 'Search the wagon. (Sense · 9)',
          to: 'mission-gate',
          check: {
            attribute: 'sense',
            target: 9,
            success: 'wagon-find',
            failure: 'mission-gate',
          },
        },
        { id: 'pass', label: 'Leave it to the vulture.', to: 'mission-gate' },
      ],
    },
  ),
  s(
    'wagon-find',
    CH.IV,
    'A Sealed Cask',
    'wagon',
    "Under the bench, wedged where a looter would not reach, is a small sealed cask of water and a child's shoe. You take the water. You leave the shoe where it is.",
    {
      effects: { gain: 'water', flag: 'shoe-seen' },
      choices: [
        {
          id: 'on',
          label: 'Follow the road toward a bell tower.',
          to: 'mission-gate',
        },
      ],
    },
  ),

  // IV · THE MISSION — Book One ch. 6, welcome first
  s(
    'mission-gate',
    CH.V,
    'A Lantern at the Door',
    'abbess-welcome',
    'At dusk the road reaches adobe walls and an iron gate. Before you can knock, the door opens and an elderly otter in a black habit lifts a lantern to your face. Her own is round and kind. "Travellers," she says, "and such small ones. Come in, come in. There is stew, and there are beds, and no one here will ask you for anything." Behind her, the smell of bread.',
    {
      choices: [
        {
          id: 'supper',
          label: 'Accept supper for the three of you.',
          to: 'supper',
        },
        {
          id: 'stay',
          label: 'Ask to sleep in the stable tonight, near the children.',
          to: 'supper',
          flag: 'staying',
        },
        {
          id: 'deliver',
          label: 'Leave the children in her care and go before dark.',
          to: 'mission',
        },
      ],
    },
  ),
  s(
    'supper',
    CH.V,
    'Stew and Candles',
    'abbess-supper',
    'The Abbess ladles stew herself, steam curling in the candlelight. The toddler eats as though food might be taken back; his sister eats with one eye on you and one on the door. The nuns move quietly between the tables, refilling cups. Everything is warm. Everything is kind. You find that you are watching the Abbess watch the toddler eat.',
    {
      choices: [
        {
          id: 'read',
          label: "Read the Abbess's face. (Mercy · 11)",
          to: 'after-supper',
          check: {
            attribute: 'mercy',
            target: 11,
            success: 'abbess-read',
            failure: 'after-supper',
            bonus: { flag: 'poster-clue', amount: 2 },
          },
        },
        {
          id: 'eat',
          label: 'Eat, and be grateful.',
          to: 'after-supper',
          heal: 2,
        },
      ],
    },
  ),
  s(
    'abbess-read',
    CH.V,
    'The Way She Watches',
    'abbess-supper',
    'It is a small thing. She watches the toddler eat the way a farmer watches a pig fatten: with warmth, and with arithmetic. When she feels your gaze she smiles at you, and the smile is perfect, and that is the second small thing.',
    {
      effects: { flag: 'abbess-doubt' },
      choices: [
        {
          id: 'on',
          label: 'Say nothing. Finish your stew.',
          to: 'after-supper',
        },
      ],
    },
  ),
  s(
    'after-supper',
    CH.V,
    'The House at Night',
    'refectory',
    'The nuns clear the long table. The Abbess shows the children to the dormitory herself and wishes you good night with a hand on your shoulder, light as a moth. The mission settles into silence. Its corridors are very clean.',
    {
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
  s(
    'courtyard',
    CH.V,
    'The Merry-Go-Round',
    'mission',
    'In the courtyard a rusted merry-go-round is wrapped in so many cobwebs it looks upholstered. It has not turned in years, in an orphanage full of children. The dust around it is smooth as a sheet.',
    {
      choices: [
        {
          id: 'tracks',
          label: 'Look at the dust by the gate. (Sense · 9)',
          to: 'chapel',
          check: {
            attribute: 'sense',
            target: 9,
            success: 'tracks',
            failure: 'chapel',
            bonus: { flag: 'watcher-seen', amount: 2 },
          },
        },
        { id: 'chapel', label: 'Go into the chapel.', to: 'chapel' },
      ],
    },
  ),
  s(
    'tracks',
    CH.V,
    'Tracks That Only Go In',
    'mission',
    "By moonlight you see it: small footprints, dozens of them, old and new, all leading in through the gate. None lead out. Your own tracks and the children's are the newest of them.",
    {
      effects: { flag: 'no-tracks-out' },
      choices: [{ id: 'chapel', label: 'Go into the chapel.', to: 'chapel' }],
    },
  ),
  s(
    'chapel',
    CH.V,
    'The Quiet Chapel',
    'chapel',
    'The chapel is plain and moon-washed. Something shrouded stands on the altar under a white cloth. A thick bell rope hangs through a hole in the ceiling. You have not heard the mission bell ring once since you arrived.',
    {
      choices: [
        {
          id: 'climb',
          label: 'Climb the bell tower.',
          to: 'bell-tower',
          unless: 'silent-bell',
        },
        { id: 'sleep', label: 'Go to the dormitory.', to: 'dormitory' },
      ],
    },
  ),
  s(
    'bell-tower',
    CH.V,
    'The Bell That Never Rang',
    'bell-tower',
    'At the top of the tower hangs a fine old bell, and its mouth is empty. Someone has cut the clapper out, carefully, a long time ago. Whatever happens in this house, no one will ever ring an alarm.',
    {
      effects: { flag: 'silent-bell' },
      choices: [{ id: 'down', label: 'Go to the dormitory.', to: 'dormitory' }],
    },
  ),
  s(
    'dormitory',
    CH.V,
    'The Cot Nobody Sleeps In',
    'empty-cot',
    'The dormitory is two neat rows of cots, nearly all empty. The siblings are asleep in one, the sister curled around her brother. On the next cot lies a ragged cloth doll with button eyes, waiting for a child who has not come back for it. At the end of the hall is a door, locked.',
    {
      choices: [
        {
          id: 'doll',
          label: 'Pick up the doll.',
          to: 'locked-door',
          flag: 'doll-found',
        },
        {
          id: 'door',
          label: 'Try the locked door.',
          to: 'locked-door',
        },
        {
          id: 'sleep',
          label: 'Sleep sitting up, your back to the wall.',
          to: 'morning',
        },
      ],
    },
  ),
  s(
    'locked-door',
    CH.V,
    'A Door Kept Locked',
    'locked-door',
    "The door is old and heavy and the lock is new. A draft breathes under it, cold and smelling of candle wax. Low on the wood are small scratches, the height of a child's hands.",
    {
      choices: [
        {
          id: 'pick',
          label: 'Work the lock open with your knife. (Shadow · 11)',
          to: 'caught',
          check: {
            attribute: 'shadow',
            target: 11,
            success: 'crypt-glimpse',
            failure: 'caught',
            bonus: { flag: 'doll-found', amount: 2 },
          },
        },
        { id: 'leave', label: 'Leave it. Sleep.', to: 'morning' },
      ],
    },
  ),
  s(
    'caught',
    CH.V,
    'A Hand on Your Shoulder',
    'abbess-welcome',
    'A hand settles on your shoulder, light as a moth. The Abbess stands behind you with her lantern, smiling. "The cellar," she says. "Damp. Rats. Come, you are exhausted." She walks you back to your blanket and wishes you good night again. You do not sleep.',
    {
      effects: { flag: 'abbess-wary' },
      choices: [{ id: 'morning', label: 'Wait for morning.', to: 'morning' }],
    },
  ),
  s(
    'crypt-glimpse',
    CH.V,
    'Candles Below',
    'altar',
    'The lock gives. Stone steps lead down into candlelight. At the bottom: an altar, coils of rope, and black candles burned down by many nights. Behind the altar the wall is wrong; it looks deep, the way water looks deep. Something on the other side of it is very large and very patient. Above you, soft footsteps cross the dormitory toward the stair.',
    {
      effects: { flag: 'crypt-seen' },
      choices: [
        {
          id: 'wake',
          label: 'Run back up, wake the children and leave tonight.',
          to: 'night-flight',
        },
        {
          id: 'confront',
          label: 'Footsteps on the stair. Hide by the altar and see who comes.',
          to: 'cellar',
        },
      ],
    },
  ),
  s(
    'morning',
    CH.V,
    'Morning at the Gate',
    'mission',
    'Morning is gold and ordinary. The children are fed again. At the gate the Abbess presses bread into your hands. "They will be safe with us," she says. "You have a long road. Go with our blessing." The sister is watching you from the doorway.',
    {
      choices: [
        {
          id: 'go',
          label: 'Leave them. It is what you came here to do.',
          to: 'mission',
        },
        {
          id: 'take',
          label: 'Take the children with you.',
          to: 'take-them',
          needs: 'abbess-doubt',
          hint: 'You have no reason to doubt her kindness. Yet.',
        },
      ],
    },
  ),
  s(
    'take-them',
    CH.V,
    'Her Smile Does Not Move',
    'abbess-welcome',
    'You say the children will come with you. The Abbess\'s smile does not move at all. "Of course," she says, and the gate swings open, and the nuns stand very still along the wall. She watches you go the whole length of the road, and when you look back from the ridge she is still at the gate, paws folded, watching.',
    {
      effects: { flag: 'abbess-wary' },
      choices: [
        { id: 'on', label: 'Do not stop walking.', to: 'ending-hunted' },
      ],
    },
  ),
  s(
    'mission',
    CH.V,
    'Looking Back',
    'mission',
    'You leave them at the mission. At the gate you look back at the courtyard, at the rusted merry-go-round wrapped in cobwebs, and at the Abbess with her paws folded, smiling. The children are already inside. The road to the next town runs on through the heat.',
    {
      choices: [
        {
          id: 'investigate',
          label: 'Circle the wall and look for another way in. (Sense · 11)',
          to: 'posters',
          check: {
            attribute: 'sense',
            target: 11,
            success: 'cellar',
            failure: 'posters',
            bonus: { flag: 'no-tracks-out', amount: 2 },
          },
        },
        {
          id: 'town',
          label: 'Walk on to the next town.',
          to: 'posters',
          flag: 'abbess-suspicion',
        },
        {
          id: 'go',
          label: 'Accept the Abbess at her word and depart.',
          to: 'ending-alone',
        },
      ],
    },
  ),

  // V · THE NOTICES — Book One ch. 7
  s(
    'posters',
    CH.VI,
    'The Wall of Names',
    'posters-boardwalk',
    'You reach the outskirts of Dustwater at dusk. A notice is nailed to a post. Then several. Then the boardwalk walls are papered with them, layer on layer: missing children, dozens, drawn by grieving hands. Lantern light moves over their faces. On notice after notice, the same four words: last seen, mission road.',
    {
      choices: [
        {
          id: 'return',
          label: 'Turn around and run.',
          to: 'run-back',
          flag: 'poster-clue',
        },
        {
          id: 'ask',
          label: 'Ask in the saloon what these notices mean.',
          to: 'saloon',
        },
        {
          id: 'warning',
          label: 'Warn the settlements, and escape.',
          to: 'ending-warning',
        },
      ],
    },
  ),
  s(
    'saloon',
    CH.VI,
    'The Barkeep',
    'shuttered-town',
    'The barkeep is a rabbit with a scattergun across the bar and eyes like old nails. She does not ask what you want. She looks at the dust of the mission road on your poncho and goes very still.',
    {
      choices: [
        {
          id: 'trade',
          label: 'Set an apple on the bar and ask about the mission.',
          to: 'saloon-truth',
          requires: 'apple',
          spend: 'apple',
        },
        {
          id: 'press',
          label: 'Ask her plainly, and let her see you mean it. (Mercy · 9)',
          to: 'run-back',
          check: {
            attribute: 'mercy',
            target: 9,
            success: 'saloon-truth',
            failure: 'run-back',
          },
        },
      ],
    },
  ),
  s(
    'saloon-truth',
    CH.VI,
    'What Dustwater Knows',
    'shuttered-town',
    '"The good sisters take in orphans," she says. "Every year, more. Nobody ever sees one grown." Her paw closes on the scattergun. "My boy went up that road with a fever. They were so kind about it." She does not cry. "That bell up there has never once rung, stranger. Not for a birth. Not for a death."',
    {
      effects: { flag: 'abbess-suspicion' },
      choices: [{ id: 'run', label: 'Run.', to: 'run-back' }],
    },
  ),
  s(
    'run-back',
    CH.VII,
    'The Run Back',
    'dust-road',
    'You run back the way you came, on foot, through the night. The road you walked in a day you must cover before dawn. Your lungs burn; the katana beats against your back with every stride.',
    {
      choices: [
        {
          id: 'run',
          label: 'Run without rest. (Steel · 9)',
          to: 'run-late',
          check: {
            attribute: 'steel',
            target: 9,
            success: 'mission-night',
            failure: 'run-late',
          },
        },
        {
          id: 'call',
          label: 'Call to the shape keeping pace with you on the ridge.',
          to: 'coyote-return',
          needs: 'coyote-debt',
          // Act VI: sold to the bounty hunter, he is roped across a mule in Dustwater, not on the ridge.
          unless: 'bounty-sold',
          hint: 'No one owes you anything out here.',
        },
      ],
    },
  ),
  s(
    'run-late',
    CH.VII,
    'Legs Like Rope',
    'zuzu-bandage',
    'Twice your legs fold under you and twice you get up. You bind your own torn paw without stopping. When the mission wall finally rises out of the dark, the moon is already low.',
    {
      effects: { hurt: 2, flag: 'late' },
      choices: [{ id: 'gate', label: 'Over the wall.', to: 'mission-night' }],
    },
  ),
  s(
    'coyote-return',
    CH.VII,
    'A Debt Repaid',
    'coyote-bandaged',
    'The shape on the ridge is the coyote. His right sleeve is pinned shut over the wrist where the gun hand used to be, and he rides the ache of it the way he rides everything, quietly. "Saw you go by," he says, which is the most anyone has said to you in days. He does not ask where you are going. He runs beside you, and with him to find the short way, you reach the mission before the moon is high.',
    {
      effects: { flag: 'ally-coyote' },
      choices: [
        { id: 'gate', label: 'Over the wall, together.', to: 'mission-night' },
      ],
    },
  ),

  // VI · THE DARK — Book One ch. 8
  s(
    'mission-night',
    CH.VIII,
    'An Empty House',
    'refectory',
    'The mission seems empty. In the refectory supper is still on the table; a small bowl lies overturned and a spoon is on the floor. Upstairs, a voice is chanting. The air tastes of candle smoke and something like lightning.',
    {
      choices: [
        {
          id: 'upstairs',
          label: 'Up the stairs, toward the chanting.',
          to: 'cellar',
        },
        {
          id: 'passage',
          label:
            'Take the stair behind the locked door you opened last night. (Shadow · 9)',
          to: 'cellar',
          needs: 'crypt-seen',
          hint: 'You do not know another way in.',
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
  s(
    'cellar',
    CH.VIII,
    'The Altar',
    'altar',
    'The children are tied on a stone altar between candelabra, the toddler limp and his sister awake and fighting her ropes. A nun kneels before them, chanting. Behind the altar the dark is folding open like a wound, and something enormous and coiled leans through it toward the light.',
    {
      choices: [
        {
          id: 'cut',
          label: "Cut the sister's bonds first.",
          to: 'nuns-attack',
          flag: 'sister-free',
        },
        {
          id: 'charge',
          label: 'Draw the sword and go for the chanting nun.',
          to: 'nuns-attack',
        },
        {
          id: 'slip',
          label: 'Slip around the candles to the children. (Shadow · 11)',
          to: 'nuns-attack',
          check: {
            attribute: 'shadow',
            target: 11,
            success: 'rescue-quiet',
            failure: 'nuns-attack',
          },
        },
      ],
    },
  ),
  s(
    'nuns-attack',
    CH.VIII,
    'Black Habits',
    'altar',
    'The nuns come out of the shadows with knives in their soft paws, faces still kind, and the kindness is the worst of it.',
    {
      battle: {
        name: 'The Otter Nuns',
        hp: 8,
        guard: 1,
        attack: 2,
        win: 'abbess-strikes',
        lose: 'last-breath',
      },
    },
  ),
  s(
    'abbess-strikes',
    CH.VIII,
    'A Knife Behind a Prayer',
    'abbess-crypt',
    'The last nun falls. Behind you, very close, someone sighs as if at a child who will not eat. The Abbess has come up behind you with her dagger, and her face as the kindness drops away is the most frightening thing you have seen in a long life of frightening things.',
    {
      choices: [
        {
          id: 'turn',
          label: 'Turn before the blow lands. (Sense · 9)',
          to: 'stabbed',
          check: {
            attribute: 'sense',
            target: 9,
            success: 'abbess',
            failure: 'stabbed',
            bonus: { flag: 'abbess-doubt', amount: 2 },
          },
        },
      ],
    },
  ),
  s(
    'stabbed',
    CH.VIII,
    'The Shoulder',
    'zuzu-bandage',
    'The dagger goes into your shoulder from behind, cold and then hot. Behind the altar the coiled thing stirs at the smell of it.',
    {
      effects: { hurt: 3 },
      choices: [{ id: 'fight', label: 'Turn and face her.', to: 'abbess' }],
    },
  ),
  s(
    'abbess',
    CH.VIII,
    'The Abbess',
    'abbess-crypt',
    'She does not fight like a nun. She fights like something that has done this many times and never once lost. The altar shakes. A shape presses against the world from the other side. She means to buy it time with your blood.',
    {
      battle: {
        name: 'The Abbess',
        hp: 9,
        guard: 2,
        attack: 3,
        win: 'rescue',
        lose: 'last-breath',
      },
    },
  ),
  s(
    'last-breath',
    CH.VIII,
    'On the Stones',
    'sister-dagger',
    'You are on the stones and the dark thing has your ankle. Above you the dagger rises. Past it you can see the altar, and the ropes, and whether anyone is still tied to them.',
    {
      choices: [
        {
          id: 'trust',
          label: 'Look for the sister.',
          to: 'sister-saves',
          needs: 'sister-free',
          hint: 'You never cut her free.',
        },
        { id: 'end', label: 'Close your eyes.', to: 'ending-altar' },
      ],
    },
  ),
  s(
    'sister-saves',
    CH.VIII,
    'The Lone Survivor',
    'sister-dagger',
    'The Abbess stiffens and falls forward across you. Behind her stands the sister, both bandaged hands still wrapped around a dagger, shaking from her ears to her feet. You hold out your hand. Slowly, shakily, she gives it to you.',
    {
      effects: { heal: 2 },
      choices: [{ id: 'up', label: 'Get up.', to: 'rescue' }],
    },
  ),
  s(
    'rescue-quiet',
    CH.VIII,
    'Ropes in the Dark',
    'sister-dagger',
    'You come out of the dark beside the altar and cut both children free before the chanting falters. The sister snatches up a fallen dagger and holds it in front of her brother. The Abbess turns from the shadows. She is between you and the stairs, and she is smiling.',
    {
      effects: { flag: 'sister-free' },
      choices: [
        {
          id: 'flee',
          label: 'Take the children out through the passage, now.',
          to: 'ending-hunted',
        },
        {
          id: 'face',
          label: 'Put them behind you and face her.',
          to: 'abbess',
        },
      ],
    },
  ),
  s(
    'rescue',
    CH.IX,
    'The Choice That Remains',
    'sister-dagger',
    'The children are alive. Behind the altar the torn air yawns wider, hungry for the world. The chanting nun has not stopped. There is time to flee. There may be enough time to close the breach, at a price.',
    {
      choices: [
        {
          id: 'together',
          label:
            'Throw the dagger into the chanting nun and carry the toddler into the dawn.',
          to: 'ending-three',
          flag: 'siblings-saved',
        },
        {
          id: 'four',
          label:
            'Let the coyote hold the stairs while you get the children out.',
          to: 'ending-four',
          needs: 'ally-coyote',
          hint: 'You came here alone.',
        },
        {
          id: 'seal',
          label: 'Spend your last strength to seal the breach. (2 Resolve)',
          to: 'ending-seal',
          cost: 2,
          flag: 'portal-closed',
        },
      ],
    },
  ),
  s(
    'night-flight',
    CH.V,
    'Out Before the Bell',
    'three-road',
    'You wake the sister with a paw over her mouth. She understands at once; she has run before. With the toddler asleep against your back you go over the wall and into the dark, and you do not stop until the mission is a dot of candlelight behind you.',
    {
      choices: [{ id: 'on', label: 'Keep walking.', to: 'ending-hunted' }],
    },
  ),

  // Endings
  s(
    'ending-water',
    CH.END,
    'Silence Beneath the Surface',
    'kasa-on-water',
    'The watering hole returns to stillness. A wide straw hat turns slowly on the black water. Nobody will tell the story of the stranger who almost changed this place.',
    { ending: 'dark' },
  ),
  s(
    'ending-alone',
    CH.END,
    'One Shadow on the Road',
    'zuzu-moon',
    'At sunrise your tracks run east, alone. The smallest footprints vanish behind you. You survived; the shape of what you left undone will travel farther than you do.',
    { ending: 'bittersweet' },
  ),
  s(
    'ending-warning',
    CH.END,
    'The Unheard Warning',
    'shuttered-town',
    'You carry the news from town to town. Doors are bolted, children kept close, the mission road left empty. You never learn who escaped the mission and who did not, but this year, at least, no one sends a child up that road.',
    { ending: 'bittersweet' },
  ),
  s(
    'ending-altar',
    CH.END,
    'The Bell Without a Ringer',
    'empty-gate',
    'Something comes the rest of the way through. By dawn there is no trace of the mission beyond its broken gate, and a bell hanging in the arch above it, swinging, with no clapper and no one at the rope.',
    { ending: 'dark' },
  ),
  s(
    'ending-hunted',
    CH.END,
    'Hunted',
    'canyon',
    'You get them out. You cut the rope bridge behind you and keep walking, and you will keep walking for a long time. The Abbess still lives. Somewhere behind you is a mission with a bell that never rings, and a patient woman who now knows your face. The sister sleeps with a dagger in her hand.',
    { ending: 'bittersweet' },
  ),
  s(
    'ending-three',
    CH.END,
    'Three Small Shadows',
    'three-road',
    "The mission burns behind the ridge. The sister takes the toddler's hand. You walk ahead, then slow your step until three shadows fall together along the road. Nothing is settled. Something has begun.",
    { ending: 'hope' },
  ),
  s(
    'ending-four',
    CH.END,
    'One Fire',
    'camp',
    'That night there is one fire, not two. The coyote tries to roll a smoke one-handed and fails, and the toddler laughs for the first time since Hollow Bell. The sister sleeps. You keep watch, and for once you are not the only one keeping it.',
    { ending: 'hope' },
  ),
  s(
    'ending-seal',
    CH.END,
    'What the Desert Keeps',
    'kneeling-blade',
    'The breach folds inward. The thing behind it goes back to wherever it waits. When the children look back they see you alive, on your knees, the sword blackened. The road will be longer. There will be a road.',
    { ending: 'hope' },
  ),
]

/** Merge act modules into the shipped spine: new sections, added choices, rerouted choices. */
function assemble(base: Scene[], acts: Act[]): Scene[] {
  const all = [...base, ...acts.flatMap((act) => act.scenes)]
  const byId = new Map(all.map((node) => [node.id, node]))
  if (byId.size !== all.length) throw new Error('Duplicate gamebook scene id')
  const extend = new Map<string, Choice[]>()
  const reroute = new Map<string, string>()
  for (const act of acts) {
    for (const [id, choices] of Object.entries(act.extend ?? {})) {
      if (!byId.has(id)) throw new Error('Extending unknown scene: ' + id)
      extend.set(id, [...(extend.get(id) ?? []), ...choices])
    }
    for (const [key, to] of Object.entries(act.reroute ?? {})) {
      if (reroute.has(key)) throw new Error('Choice rerouted twice: ' + key)
      reroute.set(key, to)
    }
  }
  const used = new Set<string>()
  const merged = all.map((node) => {
    const added = extend.get(node.id) ?? []
    if (!node.choices && !added.length) return node
    const choices = [...(node.choices ?? []), ...added].map((choice) => {
      let next = choice
      const key = node.id + '/' + choice.id
      const to = reroute.get(key)
      if (to) {
        // A checked choice routes by success/failure, so a bare reroute of one would silently do nothing.
        if (choice.check)
          throw new Error(
            'Reroute a checked choice via #success or #failure: ' + key,
          )
        used.add(key)
        next = { ...next, to }
      }
      for (const branch of ['success', 'failure'] as const) {
        const target = reroute.get(key + '#' + branch)
        if (!target) continue
        if (!next.check)
          throw new Error(
            'Rerouting a check branch on an unchecked choice: ' + key,
          )
        used.add(key + '#' + branch)
        next = { ...next, check: { ...next.check, [branch]: target } }
      }
      return next
    })
    return { ...node, choices }
  })
  for (const key of reroute.keys())
    if (!used.has(key)) throw new Error('Rerouting unknown choice: ' + key)
  return merged
}

const assembled = assemble(scenes, ACTS)

export const BOOK: Record<string, Scene> = Object.fromEntries(
  assembled.map((node) => [node.id, node]),
)
export const SCENE_ORDER: string[] = assembled.map((node) => node.id)
