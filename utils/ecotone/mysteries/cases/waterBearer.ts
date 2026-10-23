import type { Mystery } from '../types'

// Case XI. Seed: eccentric, humanitarian, futurist, rebellion, communes, lights in the sky, the detached genius.

export const WATER_BEARER: Mystery = {
  id: 'water-bearer',
  number: 11,
  sign: 'aquarius',
  title: 'The Mystery of the Midnight Water Bearer',
  tagline:
    'Full jugs on every doorstep, each one dated a summer that hasn’t come yet.',
  region: 'Blue Lake, Korbel and the Highway 299 corridor',
  hook: 'Every dawn in Blue Lake, someone leaves full glass jugs of water on doorsteps, each labeled with a date years from now. At night a pale light hovers over the Mad River and moves against the wind. Old-timers have started saying the name of a back-to-the-land commune nobody has mentioned in decades: the Aquarian Ranch, whose members all vanished in 1974.',
  design: {
    element: 'air',
    motif: 'jug',
    palette: { sky: '#161a2e', ink: '#d6dcf2', glow: '#9a8fd0' },
    stars: [
      [86, 30],
      [70, 34],
      [56, 28],
      [46, 34],
      [42, 26],
      [38, 32],
      [36, 22],
      [52, 46],
      [48, 58],
      [40, 64],
      [54, 72],
      [30, 76],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [4, 6],
      [2, 7],
      [7, 8],
      [8, 9],
      [8, 10],
      [9, 11],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. A small-town porch in Blue Lake at dawn, river fog drifting through cottonwoods, an old-fashioned gallon glass jug with a finger loop on the top step, full of water that glows faintly from within, a blank strip of masking tape for a label. Behind it the Mad River curves below a wooded ridge, and above the water hovers a soft four-pointed light, half drone and half something else. A pale stream of light pours from the jug down the porch steps. Faint silver stars above form an unlabeled water-bearer constellation. Fog lavender, silver-blue and pale dawn gold. No text, no letters, no logos.',
  provenance:
    'Blue Lake and Korbel are real communities on the Mad River along the State Route 299 corridor, and the back-to-the-land movement of the late 1960s and 1970s brought many communes to rural Northern California. Drought and falling groundwater are real concerns for rural wells. The Aquarian Ranch, Saffron Gutierrez, Bev, Arlo, Dwayne, the jugs, the drone, the well-share co-op and every other person and event here are invented. No real commune, business or person is depicted.',
  decline: {
    label: 'Tell Bev you don’t drink strangers’ water',
    text: 'You tell Bev a mystery jug is how every bad documentary starts. She agrees, and pours hers on the tomatoes. That night a light hangs perfectly still over the river for an hour, as if waiting for an answer you didn’t send.',
  },
  gates: [
    {
      title: 'The Jugs on the Doorsteps',
      place: 'Blue Lake, a quiet street at dawn',
      chapter: 4,
      scene: 'plaza',
      message: {
        medium: 'text',
        from: 'Bev (Blue Lake, retired mail carrier)',
        lines: [
          'there is a JUG on my porch again',
          'glass. full. label says AUG 14 2041. I do not have plans for that date',
          'six houses on my street got one. come look before the neighbors drink the evidence',
        ],
      },
      body: [
        'On Bev Okafor’s porch sits a gallon glass jug, the old dairy kind with a finger loop, full to the shoulder with water so clear it seems to bend the porch light. A masking-tape label reads, in tidy block capitals, AUG 14 2041. Across the street, the neighbor’s jug says JUL 2 2037. The house on the corner got SEP 30 2052 and has already posted it to the town message board with eleven question marks.',
        'Bev carried the mail here for thirty-one years and knows every porch by its creak. “Nobody saw a car,” she says. “Nobody heard a step. And the dogs didn’t bark, which in this town is the real miracle.” Down the block, a man in a bathrobe holds his jug up to the sun like he’s checking a twenty.',
      ],
      approaches: [
        {
          id: 'map',
          label: 'Map which houses got which dates',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You walk the streets with Bev and a clipboard and plot every jug. The dates aren’t random. Houses that share a well share a date. The earliest dates cluster on the shallow wells uphill; the latest sit on the deep ones near the river. Somebody isn’t leaving gifts. Somebody is leaving a schedule.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You produce a beautiful chart proving that the jug fairy prefers houses with blue trim. Bev studies it and points out that half the town has blue trim because the hardware store had a sale in 1998. Your chart goes on her fridge as a cautionary tale.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'taste',
          label: 'Taste the water and trust what it tells you',
          check: { skill: 'psyche', target: 9 },
          cost: 'You are drinking from a stranger’s jug, and the whole street is watching.',
          success: {
            text: 'The water is cold in a way the morning isn’t, and it tastes of stone and iron and, faintly, smoke. For one swallow you see the street the way the jug remembers it: brown lawns, cracked yards, a line of people with containers outside the fire hall in heat that bends the air. Then it’s a cool morning again, and Bev is asking if you’re all right.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'It tastes like water. You announce, with confidence, that it tastes like water. The man in the bathrobe says “Huh” in a way that suggests he expected more from a detective, then drinks his entire jug on the spot out of solidarity and has to sit down on the curb.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'porches',
          label: 'Ask around about who’s up before dawn',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'The baker who opens at four saw nothing, but she heard something: a faint hum, like a fridge, moving down the street at about head height. And the week the jugs started, she sold a dozen sesame bagels to a woman in a waxed canvas hat towing a trailer full of empty glass jugs. “Older lady. Muddy boots. Paid in exact change and tipped like a saint.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Everyone has a theory and you hear all of them: aliens, the county, a marketing stunt for a water filter, and, from one very confident teenager, “the river, obviously.” By the time the theories run dry, so have most of the jugs, drunk by neighbors who swear it’s the best water they’ve ever had.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara reads the label lettering like a signature. “Draftsman’s capitals. Somebody who writes numbers for a living and wants them read right the first time.”',
        kit: 'Kit taps the glass. “Old dairy jug. Somebody collected a hundred of these at flea markets. That’s dedication or a garage problem.”',
        juniper:
          'Juniper won’t touch the jugs. “That water’s been somewhere,” she says. “Somewhere it didn’t want to leave.”',
        cedar:
          'Cedar squints at the dates and goes quiet. “My uncle’s well went dry a few summers back. Nobody left him a warning.”',
      },
      aloneLine:
        'Alone on the street at dawn, you find a jug on the hood of your own car. The label is blank.',
    },
    {
      title: 'The Light Over the River',
      place: 'A gravel bar on the Mad River, midnight',
      chapter: 4,
      scene: 'grove',
      message: {
        medium: 'radio',
        from: 'Community radio, the overnight call-in show',
        lines: [
          '“…caller, you’re on the air.” “Yeah, hi, Dwayne from Korbel. It’s back.',
          'The light. Over the river by the old bridge. Planes don’t hum in harmony, is my point.',
          'And it’s dipping something in the water. Like it’s thirsty. Somebody go look, I’m in my slippers.”',
        ],
      },
      body: [
        'The Mad River at midnight is louder than you expect and colder than it looks. Under the cottonwoods you find Dwayne, who has upgraded to boots, and a dozen people from both towns sitting on coolers with binoculars and a thermos of cocoa going hand to hand: the mood of a meteor shower that has decided to be personal.',
        'Then the light comes. It drifts in from upriver, soft and white, humming a chord, and stops above a deep pool. A thin line drops from it into the water, hangs, and reels back up. An old man in a camp chair says, “Same as ’74,” and won’t elaborate. Somebody else says “the Aquarian Ranch,” and the whole gravel bar goes quiet.',
      ],
      approaches: [
        {
          id: 'chord',
          label: 'Listen to the hum and work out what makes it',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You close your eyes and count. Four notes, steady, slightly out of tune: four rotors, one of them chipped. It’s a drone, a big homemade one, and the line is a sampling bottle on a cord. When it lifts away, you clock its heading against the bridge and the ridge: northeast, toward the back roads above Korbel.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You announce that the hum is a C major chord, out loud, to a gravel bar full of people who immediately start arguing about it. A retired music teacher wins. It’s a D. By the time the debate ends, the light is gone and someone has finished the cocoa.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'wade',
          label: 'Wade into the pool beneath the light and hold still',
          check: { skill: 'psyche', target: 9 },
          cost: 'The river is cold enough to file a complaint.',
          success: {
            text: 'You stand thigh-deep and do not flinch when the light comes down to meet you. The bottle touches the water beside your hand. In the glow you see your reflection, older, standing in a much lower river, holding a jug. Then the drone, because it is a drone, startles at your face and lifts away.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'The cold takes your breath and then your dignity. You make a noise like a kettle. The light swings toward you, considers you, and moves politely to a different pool, the way a person changes seats on a bus. Dwayne lends you his slippers, which he brought for exactly this.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'arlo',
          label: 'Get the old man in the camp chair to talk about 1974',
          check: { skill: 'lore', target: 7 },
          success: {
            text: 'His name is Arlo, and in 1974 he delivered propane to the Aquarian Ranch up a Korbel back road: twenty-two hippies, a geodesic dome, a goat named Buckminster. “Then one spring they were just gone. Garden going to seed. Folks said the lights took them.” He sips his cocoa. “Except I always wondered about the little girl. Freckled kid, always carrying a bucket.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Arlo talks for an hour about propane, in more detail than you knew propane had. He mentions the Aquarian Ranch only once, to note that they were behind on their account. When you ask what happened to them, he says, “Ask the bucket girl,” and falls asleep in his chair.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara sketches the light on the back of a receipt. “Four points of glow, not one. Whatever that is, it’s got a symmetry habit.”',
        kit: 'Kit watches the light bank against the wind and grins. “That’s a machine. A good one. Somebody tuned that by hand.”',
        juniper:
          'Juniper lies flat on the gravel looking straight up. “Not everything up there is the thing you came to see,” she says, and points at a second, fainter light nobody else has noticed.',
        cedar:
          'Cedar fiddles with his handheld CB and frowns. “There’s chatter under the hum. Numbers. Feet below ground, sounds like.”',
      },
      aloneLine:
        'With no one to whisper to, you notice what the crowd talks over: the light only dips its line where the river runs deepest.',
    },
    {
      title: 'The Aquarian Ranch',
      place: 'A meadow on a back road above Korbel',
      chapter: 4,
      scene: 'meadow',
      message: {
        medium: 'note',
        from: 'Rubber-banded to a jug on your windshield',
        lines: [
          'You’re asking good questions. That’s rarer than water.',
          'Road above Korbel, past the third cattle guard, left at the bathtub.',
          'Come before dawn. The dates don’t wait. Bring a bucket.',
        ],
      },
      body: [
        'Past the third cattle guard there is, in fact, a clawfoot bathtub in a field, full of rainwater and frogs. Beyond it lies a meadow, and in the meadow the ruin of a geodesic dome, its triangles grown through with blackberry, and beside it a hand-dug well with a rotted crank and a dry, dark throat.',
        'The dome isn’t empty. Under tarps stand rows of glass jugs, hundreds, each labeled, each full, shelved by date like a library. A workbench holds a drone with four rotors, one chipped. Somewhere close a generator coughs into silence, and boots crunch on gravel. Someone is coming home for the morning delivery.',
      ],
      approaches: [
        {
          id: 'library',
          label: 'Decode the jug library before the bearer arrives',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'Each shelf is a well. Each label is a water-level reading, plotted forward by someone who knows exactly how fast the valley is drinking itself dry. The dates aren’t prophecy. They are arithmetic. On the last shelf, alone, sits a jug labeled with the ranch’s own name and a date in 1974, and it is empty.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You start pulling jugs to read the labels and get the order wrong, then very wrong, then irreversibly wrong. When the footsteps reach the door, you are standing in a hundred misshelved jugs holding one in each hand, like a bartender caught in a bad dream.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'sit',
          label: 'Sit in the dark dome and let the bearer find you calm',
          check: { skill: 'psyche', target: 7 },
          success: {
            text: 'You sit cross-legged in the middle of the dome with your hands open on your knees. The footsteps stop at the door. A flashlight finds you, wavers, and lowers. “Well,” says a woman’s voice, dry as the meadow, “you’re either a detective or you’re waiting for the mothership. Either way, help me carry these.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You wait in the dark and the dark wins. When the door creaks you leap up, collide with a shelf, and send a cascade of jugs rolling across the floor. None break. The bearer stops the last one with her boot without looking, like someone who has been catching falling things her whole life.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara reads the shelf labels with professional jealousy. “Thousands of letters and not one shaky line. This person has been patient for a very long time.”',
        kit: 'Kit turns the drone over in her hands. “Chipped rotor, homemade gimbal, sampling winch from a fishing reel. I would like to meet this genius and also borrow her tools.”',
        juniper:
          'Juniper lays her palm flat on the dry well’s stones. “It remembers being full,” she says quietly. “It misses it.”',
        cedar:
          'Cedar walks the meadow edge, reading the ground. “Old ditch lines, a dug pond, a pump shed. These folks knew water. They just ran out of it.”',
      },
      aloneLine:
        'Alone in the dome among hundreds of full jugs, you are suddenly very aware of how thirsty you are.',
    },
  ],
  coldCase: {
    title: 'The Last Jug',
    place: 'Blue Lake, a porch at dawn',
    chapter: 4,
    scene: 'plaza',
    body: [
      'The jugs stop. Nobody knows why. The light over the river stays gone, and within a month the town message board has moved on to a loose emu. The Aquarian Ranch goes back to being a rumor.',
      'Bev keeps her jug on the windowsill, unopened, catching the light. AUG 14 2041. “Probably nothing,” she says. Then she has someone out to check her well, just in case.',
    ],
    choices: [
      {
        id: 'well-test',
        label: 'Help Bev get the neighbors’ wells checked too',
        text: 'You staple a flyer about free well testing at the fire hall to every pole on the street. Eleven people sign up. One of them brings a jug.',
        effects: { goodwill: 1 },
      },
      {
        id: 'keep-jug',
        label: 'Keep one jug for yourself, sealed, on a shelf',
        text: 'You set it on a shelf and leave it. Some nights it sweats on the outside, as if it is sitting in a heat you cannot feel.',
        effects: { weird: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Bearer at Dawn',
    place: 'The Aquarian Ranch dome, first light',
    chapter: 4,
    scene: 'meadow',
    body: [
      'She comes through the dome door pushing a hand-truck stacked with empty jugs: a woman of fifty-eight in a waxed canvas hat and muddy boots, reading glasses on a beaded chain, a drone controller clipped to her belt like a sheriff’s badge. She looks at you, at the jugs, at the dry well. She does not run. People who have been meaning to explain themselves for a long time rarely do.',
      '“Saffron Gutierrez,” she says. “Saff. Hydrologist, freelance, unaffiliated, uninvited. Yes, I’m the light. No, I’m not a cult, and the ranch was never a cult either. It was mostly a lot of people who were bad at gardening.” The sun clears the ridge and pours through a hundred jugs at once, and for a moment the whole dome swims with water-light.',
    ],
    choices: [
      {
        id: 'why',
        label: 'Ask her why she does it',
        text: 'You ask the simplest question. Saff takes off her glasses and looks at the dry well for a long time before she answers.',
        next: 'the-well',
      },
      {
        id: 'other-light',
        label: 'Ask about the other light, the one that isn’t hers',
        text: 'You tell her about the second light over the river, the faint one that never moved. Saff goes very still.',
        next: 'second-light',
      },
      {
        id: 'carry',
        label: 'Lift a jug onto the hand-truck and ask where it goes',
        text: 'You don’t ask anything. You load the nearest jug and wait for directions. Saff blinks, then laughs, and hands you a route map in draftsman’s capitals.',
        ending: 'water-for-everyone',
      },
    ],
    leadLines: {
      mara: 'Mara looks at Saff’s hands, stained with ink and river silt. “You write those labels at night,” she says. “I know a night-shift hand.”',
      kit: 'Kit is holding the drone like a puppy. “I have nine questions about your rotor balancing and they can all wait.”',
      juniper:
        'Juniper hugs Saff before anyone can stop her. Saff, startled, allows it.',
      cedar:
        'Cedar tips his cap. “My uncle’s well went dry a few summers back.” Saff nods. “The ridge wells drop fast. I’m sorry. I wasn’t quick enough.”',
    },
    aloneLine:
      'Alone with her in the dome, you realize she has been doing this alone too, for so long she has stopped noticing.',
  },
  branches: {
    'the-well': {
      title: 'The Well That Failed',
      place: 'The Aquarian Ranch, beside the dry well',
      chapter: 4,
      scene: 'meadow',
      body: [
        '“I was nine,” Saff says. “Summer of ’74. Twenty-two grown-ups came up here to live on sunlight and beans and good intentions, and nobody checked the water table. I was the bucket kid. Every morning I lowered that bucket, and every morning the rope went a little longer. I told them. Nobody listens to a nine-year-old with a rope. Then one morning the bucket came up dry, and by June the ranch was over.”',
        '“Everyone says they vanished. They didn’t vanish. They all just got jobs. My mom became a dental hygienist in Fortuna. The guy who named the goat sells insurance. Nobody got abducted. They just got thirsty.” She taps a jug. “So I measure every well in the valley and I leave the date on the porch. Nobody listens to a nine-year-old. Everybody looks at a jug.”',
      ],
      choices: [
        {
          id: 'answerable',
          label: 'Tell her a date on a porch is a question a town can answer',
          text: 'You tell her a warning is the start of something, not the end. Saff looks at you, then at the shelves, and slowly starts counting which wells could share with which.',
          ending: 'water-for-everyone',
        },
        {
          id: 'done-enough',
          label: 'Tell her she has warned them, and that’s enough',
          text: 'You tell her she has done her part, more than her part, for forty years. Saff nods, and the nod looks like it weighs about a gallon.',
          ending: 'jugs-stop',
        },
      ],
    },
    'second-light': {
      title: 'The Light That Isn’t a Drone',
      place: 'The Mad River, before dawn',
      chapter: 4,
      scene: 'grove',
      body: [
        'Saff drives you down to the river in a truck held together with zip ties and conviction. Her drone rides in the bed. Over the deep pool, the sky is not empty. A second light hangs there, smaller than hers, perfectly still, making no sound at all.',
        '“Since August,” she admits. “I figured it was a copycat. Except it doesn’t sample. It watches me sample.” She grips the controller. “And the jugs. I fill every one from the river. But people say they taste of iron and smoke, like water from a much lower river.” She swallows. “Like water from the date on the label.”',
      ],
      choices: [
        {
          id: 'signal',
          label:
            'Flash the drone’s lights at it, like kids signaling across a valley',
          text: 'Saff blinks her drone’s lights in a pattern she clearly invented at age nine. After a long moment, the second light blinks back.',
          ending: 'contact',
        },
        {
          id: 'whole-town',
          label: 'Tell her this is bigger than one person and wake the town',
          text: 'You call Bev, who calls everyone. By sunrise the gravel bar is full of people in bathrobes holding jugs, looking up, deciding together what happens next.',
          ending: 'water-for-everyone',
        },
      ],
    },
  },
  endings: [
    {
      id: 'water-for-everyone',
      title: 'Water for Everyone',
      tone: 'true',
      text: [
        'By the next summer Blue Lake has a well-share co-op, run out of the fire hall on a whiteboard in draftsman’s capitals. Deep wells help shallow ones through the dry months, rain tanks go up on every barn roof that will hold them, and the dates on the porch jugs start getting crossed out and rewritten, years later each time. Bev runs the mailing list. Arlo runs the propane jokes.',
        'The old Aquarian Ranch crowd turns out to be delighted to come back for one potluck. The dental hygienist, the insurance man and the rest stand in the meadow while Saff pours one jug of river water, ceremonially, down the dry well. It doesn’t fix anything. Everyone cries anyway.',
      ],
    },
    {
      id: 'jugs-stop',
      title: 'The Jugs Stop Coming',
      tone: 'bittersweet',
      text: [
        'Saff hangs up the drone and the jugs stop. The numbers were never secret, she says; anyone can ask for their own well reading. Most people don’t. A few do, and quietly put in a tank, or conserve, or move.',
        'In the August of a year you won’t name, Bev’s well runs low but holds. She credits the jug on her windowsill, which she never opened. You visit the dome one last time and find the shelves bare except for one jug, labeled with your address and a date so far out you will never have to worry about it. It is full.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      tone: 'strange',
      text: [
        'The second light drops to the water beside Saff’s drone, close enough to touch, and you see it is no machine. It is a glass jug with a finger loop, glowing from within, full of water that moves the wrong way. Then it lifts away upriver, faster than anything with rotors, and the river behind it rises an inch on a night with no rain.',
        'All that year the deep pool under the bridge never drops below a mark Saff painted on the rock, no matter how dry it gets. She logs it every morning and has stopped trying to explain it. She leaves an extra jug on the gravel bar each night, labeled THANK YOU, and every morning it is gone.',
      ],
    },
  ],
}
