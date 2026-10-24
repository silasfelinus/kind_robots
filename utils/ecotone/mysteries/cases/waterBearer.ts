import type { Mystery } from '../types'

// Case XI. Seed: eccentric, humanitarian, futurist, rebellion, communes, lights in the sky, the detached genius.

export const WATER_BEARER: Mystery = {
  id: 'water-bearer',
  number: 11,
  sign: 'aquarius',
  title: 'The Mystery of the Dated Jugs',
  tagline:
    'Full jugs on every doorstep, each one dated a summer that hasn’t come yet.',
  region: 'Blue Lake, Korbel and the Highway 299 corridor',
  hook: 'Every dawn on the well roads outside Blue Lake, someone leaves full glass jugs of water on doorsteps, each labeled with a date years from now. At night a pale light hovers over the Mad River, humming in harmony, and the next week somebody sells. Old-timers have started saying the name of a back-to-the-land commune nobody has mentioned in decades: the Long Bucket Ranch, whose members all vanished in 1974.',
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
    'Portrait 2:3 collectible mystery card, painted. A small-town porch outside Blue Lake at dawn, river mist drifting through cottonwoods, an old-fashioned gallon glass jug with a finger loop on the top step, full of water that glows faintly from within, a blank strip of masking tape for a label. Behind it the Mad River curves below a wooded ridge, and above the water hovers a ring of cold white lights, half drone and half something else, with one small, still star of a light far above it. A pale stream of light pours from the jug down the porch steps. Faint silver stars above form an unlabeled water-bearer constellation. Fog lavender, silver-blue and pale dawn gold. No text, no letters, no logos.',
  provenance:
    'Blue Lake and Korbel are real communities on the Mad River along the State Route 299 corridor, and the back-to-the-land movement of the late 1960s and 1970s brought many communes to rural Northern California. Drought and falling groundwater are real concerns for rural wells. The Long Bucket Ranch, Saffron Gutierrez, Nell Okafor, Arlo, Earl, Chance Pruitt, Pruitt Basin Partners, the jugs, the drone, the well-share co-op and every other person, company and event here are invented. No real commune, business or person is depicted.',
  decline: {
    label: 'Pour your jug on the hydrangeas and go back to bed',
    text: 'You text Nell that a mystery jug is how every bad documentary starts, and pour yours on the hydrangeas. She agrees, and pours hers on the tomatoes. Two weeks later her neighbor’s house has a SOLD sign, and the neighbor won’t say why, except that he got tired of the lights.',
  },
  gates: [
    {
      title: 'The Jugs on the Doorsteps',
      place: 'Outside Blue Lake, a well road at dawn',
      chapter: 4,
      scene: 'plaza',
      message: {
        medium: 'note',
        from: 'Whoever left a jug on your doormat, then a text from Nell Okafor',
        lines: [
          'OCT 3 2049',
          '“this is nell okafor, out past blue lake, saw ur post on the town board. six on my road. come before the neighbors drink the evidence”',
        ],
      },
      body: [
        'The jug on your doormat was full to the shoulder, block capitals on its tape. You do not have plans for October 3, 2049. Your landlord’s well might. Nell Okafor’s road runs out past where the city water ends, where every house is on a well. On her porch sits a gallon glass jug, the old dairy kind with a finger loop, full of water so clear it seems to bend the porch light. The label reads AUG 14 2041. Across the road, the neighbor’s says JUL 2 2037. The house on the corner got SEP 30 2052 and has already posted it to the town message board with eleven question marks.',
        'Nell drove the Blue Lake school bus long enough to know every driveway by its pothole. “Nobody saw a car,” she says. “Nobody heard a step. And the dogs didn’t bark, which out here is the real miracle.” Down the road, a man in a bathrobe holds his jug up to the sun like he’s checking a twenty.',
      ],
      approaches: [
        {
          id: 'map',
          label: 'Map which houses got which dates',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You walk the road with Nell and the back of a feed-store receipt and plot every jug. The dates aren’t random. Houses that share a well share a date. The earliest dates cluster on the shallow wells uphill; the latest sit on the deep ones near the river. Somebody isn’t leaving gifts. Somebody is leaving a schedule, and anyone who can count could read it.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You produce a beautiful chart proving that the jug fairy prefers houses with blue trim. Nell studies it and points out that half the road has blue trim because the hardware store had a sale in 1998. Your chart goes on her fridge as a cautionary tale.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'taste',
          label: 'Taste the water and trust what it tells you',
          check: { skill: 'psyche', target: 9 },
          cost: 'You are drinking from a stranger’s jug, and the whole road is watching.',
          success: {
            text: 'The water is cold in a way the morning isn’t, and it tastes of stone and iron and, faintly, smoke. For one swallow you are standing at Nell’s wellhead on the date on the label: the pump coughing air, and a rope you have never seen paying down into the dark, and down, getting longer, with nothing on the end of it. Then it’s a cool morning again, and Nell is asking if you’re all right.',
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
            text: 'The baker who opens at four saw a woman in a waxed canvas hat towing a trailer of empty glass jugs. “Older lady. Muddy boots. Paid in exact change and tipped like a saint.” Then she frowns. “And a man in a rented pickup, dealer plates still on, asking which houses got jugs and what the dates said. He wrote them down. He didn’t tip.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Everyone has a theory and you hear all of them: aliens, the county, a marketing stunt for a water filter, and, from one very confident teenager, “the river, obviously.” By the time the theories run dry, so have most of the jugs, drunk by neighbors who swear it’s the best water they’ve ever had.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara tilts a label to the porch light. “Masking tape and a draftsman’s pen. Somebody who’d rather be right than pretty. My favorite kind of client.”',
        kit: 'Kit taps the glass. “Old dairy jug. Somebody collected a hundred of these at flea markets. That’s dedication or a garage problem.”',
        juniper:
          'Juniper uncaps a jug, sniffs, and caps it again. “Somebody’s water is better than mine,” she says, honestly jealous. “I want their well.”',
        cedar:
          'Cedar squints at the dates and goes quiet. “My uncle’s well went dry a few summers back. Nobody left him a warning.”',
      },
      aloneLine:
        'Alone on the road at dawn, you find a jug on the hood of your own car as well. The label is blank. Your car, apparently, is not on a well.',
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
          '“…caller, you’re on the air.” “Yeah, hi, Earl from Korbel. It’s back.',
          'The light. Over the river by the old bridge. Planes don’t hum in harmony, is my point.',
          'And it’s dipping something in the water. Like it’s thirsty. Somebody go look, I’m in my slippers.”',
        ],
      },
      body: [
        'The Mad River at midnight is louder than you expect and colder than it looks. Under the cottonwoods you find Earl, who has upgraded to boots, and a dozen people from both towns sitting on coolers with binoculars and a thermos of cocoa going hand to hand. A woman beside you whispers that her neighbor sold last week, cash, the morning after the light sat over his roof. “And a pickup with dealer plates sat at the bridge turnout all that night,” she adds. “Nobody in it I knew.”',
        'Then the light comes: a ring of cold white glow drifting in from upriver, humming a chord. It stops above a deep pool. A thin line drops from it into the water, hangs, and reels back up. An old man in a camp chair says, “Same as ’74,” and won’t elaborate. Somebody else says “the Long Bucket Ranch,” and the whole gravel bar goes quiet. Higher up, almost lost in the stars, something smaller hangs perfectly still, and nobody points at it.',
      ],
      approaches: [
        {
          id: 'chord',
          label: 'Listen to the hum and work out what makes it',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You close your eyes and count. Four notes from four rotors, and under them a fifth note that never wavers, which no rotor makes. A speaker. Somebody is playing that chord on purpose. It’s a big drone dressed up as a mystery, and the line is a sounding weight on a cord. When it lifts away, you clock its heading against the bridge: northeast, toward the back roads above Korbel.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You announce that the hum is a C major chord, out loud, to a gravel bar full of people who immediately start arguing about it. A retired music teacher wins. It’s a D. By the time the debate ends, the light is gone and someone has finished the cocoa.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'bridge',
          label:
            'Lie under the old bridge and watch it only in the river’s reflection',
          check: { skill: 'psyche', target: 9 },
          cost: 'You will be flat on wet gravel under a bridge while the whole bar wonders why.',
          success: {
            text: 'You lie on the cold gravel under the bridge with your face over the pool and watch the light only in the water, the way you would watch an eclipse. In the reflection it is no light at all: four rotors, a speaker, and a rental-company barcode on its belly that the glow hides from anyone looking up. Then the pool shows you its own date, the river shrunk to a trickle over dry stones and people on the bridge above you holding jugs. You sit up, and the river is loud again.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You lie down to watch the reflection just as the light hums directly over the pool, and the reflection hums back, and for one dizzy second you cannot tell which way is up. You sit up too fast into a bridge beam. The light considers you and moves politely to a different pool, the way a person changes seats on a bus. Down on the gravel bar, Earl gives you a thumbs-up for trying, which is worse.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'arlo',
          label: 'Get the old man in the camp chair to talk about 1974',
          check: { skill: 'lore', target: 7 },
          success: {
            text: 'His name is Arlo, and in 1974 he delivered propane to the Long Bucket Ranch up a Korbel back road: twenty-two hippies, a geodesic dome, a goat named Buckminster. “Then one spring they were just gone. Garden going to seed. Folks said the lights took them.” He sips his cocoa. “Except I always wondered about the little girl. Freckled kid, always carrying a bucket.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Arlo hears “1974” and turns his hearing aid off, firmly, the way some people close a gate. You talk to him for ten minutes anyway. He mentions the bucket girl exactly once, to the river, not to you, and then falls asleep in his chair with the cocoa balanced on his knee.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara sketches the light on the back of a receipt. “Too symmetrical for a ghost. Ghosts don’t have a design budget.”',
        kit: 'Kit is taping a phone into a cut-open coffee can on a driftwood stick and aiming it at the hum. “Poor man’s directional mic. If that chord comes out of a speaker, this hears the speaker. Somebody bought that light. I built this ear in a minute.”',
        juniper:
          'Juniper lies flat on the gravel looking straight up. “I came for the little one,” she says, pointing at the faint, still light nobody else is watching. “The loud one’s for tourists.”',
        cedar:
          'Cedar’s CB picks up a man’s voice under the hum: “Parcel nineteen, one-forty feet, flag it.” Cedar frowns. “Aliens don’t say parcel.”',
      },
      aloneLine:
        'With no one to whisper to, you notice what the crowd talks over: the light only dips its line where the river runs deepest.',
      recall: {
        'g1:pass':
          'Whatever the jugs are, you know now they are no prank. Somebody takes those dates very seriously.',
        'g1:porches':
          'You asked around on Nell’s road all morning. Out here nobody needs asking; the whole gravel bar is whispering at once.',
      },
    },
    {
      title: 'The Long Bucket Ranch',
      place: 'A meadow on a back road above Korbel',
      chapter: 4,
      scene: 'meadow',
      message: {
        medium: 'note',
        from: 'S., rubber-banded to a jug on your windshield',
        lines: [
          'You’re asking good questions. That’s rarer than water.',
          'Road above Korbel. Left at the bathtub. You’ll know it.',
          'Come before dawn. The dates don’t wait, and neither does the light. — S.',
        ],
      },
      body: [
        'Left of the road there is, in fact, a clawfoot bathtub in a field, full of rainwater and frogs. Beyond it lies a meadow, and in the meadow the ruin of a geodesic dome, its triangles grown through with blackberry, and beside it a hand-dug well with a rotted crank and a dry, dark throat.',
        'Under tarps in the dome stand rows of glass jugs, hundreds, each labeled, each full, shelved by date like a library. A workbench holds a hand-cranked well sounder, a reel of tape, and a stack of glossy cash-offer flyers used as coasters. Nobody is home; somewhere down the road a hand-truck rattles on its morning round. Then, over the ridge, humming its chord, comes the light, low and straight for the dry well.',
      ],
      approaches: [
        {
          id: 'line',
          label: 'Grab the sounding line when it drops into the well, and haul',
          check: { skill: 'burly', target: 9 },
          cost: 'You are about to arm-wrestle a UFO.',
          success: {
            text: 'The weight drops into the dry well and you grab the cord and haul it down hand over hand, like a stubborn kite. It hits the blackberries upside down, and it is no UFO: a survey drone wearing a ring of party lights, a speaker humming a recorded chord, a sonar sounder on the line. Down by the cattle guard, someone in the dark swears and starts running, straight into the old ditch fence.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You grab the cord and the light simply keeps going, taking you with it, through fifteen feet of blackberry and one frog. The cord snaps. The light lifts away humming slightly off-key, as if it is laughing at you, and heads down toward the road.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'library',
          label: 'Read the jug library for what the light is after',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'Each shelf is a well. Each label is a water-level reading, plotted forward by someone who knows exactly how fast the valley is drinking itself dry. The dates aren’t prophecy. They are arithmetic. And someone else has read them: the dust on the deep-well shelves is fingered fresh, and the light outside is circling those parcels in order. You follow the order downhill to a turnout, where a man sits in a rented pickup, flying it.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You start pulling jugs to read the labels and get the order wrong, then very wrong, then irreversibly wrong. When the light swings over the dome you are standing in a hundred misshelved jugs holding one in each hand, like a bartender caught in a bad dream, and it moves on without you.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'ring',
          label: 'Call Earl and the gravel-bar regulars to ring the meadow',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'Earl answers on the first ring. Twenty minutes later a dozen people in boots and headlamps stand in a circle around the meadow, and on your signal every flashlight comes on at once, pointed up. The light panics. Its chord jumps an octave and it drops into the bathtub with the frogs. Down the road, a man in a rented pickup tries to leave with his headlights off and backs into the cattle guard.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Earl answers on the first ring and arrives forty minutes later with lawn chairs, cocoa and six people who point their flashlights at everything except the sky. The light watches the picnic for a while, then lifts away toward the road. Earl declares it the best night of his life.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara reads the shelf labels with professional jealousy. “Thousands of letters and not one shaky line. This person has been patient for a very long time.”',
        kit: 'Kit cocks her head at the hum overhead. “Bluetooth party speaker, about forty bucks. Your alien has a playlist.”',
        juniper:
          'Juniper drops a pebble down the dry well and counts. “Nine. In my day it was two.” She does not explain her day.',
        cedar:
          'Cedar walks the meadow edge, reading the ground. “Old ditch lines, a dug pond, a pump shed. These folks knew water. They just ran out of it.”',
      },
      aloneLine:
        'Alone in the dome among hundreds of full jugs, you are suddenly very aware of how thirsty you are.',
      recall: {
        'g2:arlo':
          'Somewhere in here, you think, is the bucket girl Arlo never stopped wondering about, grown up and still carrying water.',
      },
    },
  ],
  coldCase: {
    title: 'The Last Jug',
    place: 'Outside Blue Lake, a porch at dawn',
    chapter: 4,
    scene: 'plaza',
    body: [
      'The jugs stop the morning after you walk out of the dome. Up above Korbel the dome stands empty by the weekend, its shelves cleared overnight, and nobody you ask will say whose they were. The light over the river stays gone, and within a month three houses on Nell’s road get cash offers in the mail from a company nobody has heard of. Two of them sell.',
      'Nell keeps her jug on the windowsill, unopened, catching the light. AUG 14 2041. “Probably nothing,” she says. Then she has someone out to check her well, just in case.',
    ],
    choices: [
      {
        id: 'well-test',
        label: 'Help Nell get the neighbors’ wells checked too',
        text: 'You staple a flyer about free well testing at the fire hall to every pole on the road. Eleven people sign up. One of them brings a jug.',
        effects: { goodwill: 1 },
      },
      {
        id: 'landlord',
        label: 'Pour your own jug into your landlord’s well',
        text: 'You pour it in at midnight, feeling ridiculous. The next month his well tests higher than any on the road, and he cannot work out why.',
        effects: { weird: 1 },
      },
    ],
    recall: {
      'g3:pass':
        'You got closer to the light than anybody on the gravel bar ever has, close enough to know it had a pilot. By the time you got down the hill, the turnout held nothing but fresh tire marks.',
      'g3:fail':
        'The light got away from you in that meadow, humming off-key on its way down the hill. Whoever was flying it already has what he came for.',
    },
  },
  reveal: {
    title: 'The Light Comes Down',
    place: 'The Long Bucket Ranch, first light',
    chapter: 4,
    scene: 'meadow',
    body: [
      'First light finds the UFO grounded for good: a rented survey drone wearing a ring of party lights, a waterproof speaker zip-tied to its belly, and a sonar sounder on a line. Its pilot is not going anywhere. He sits on the cattle guard in a camouflage hunting poncho, night-vision goggles pushed up on his forehead like a crown. When you pull back the hood he hands you a business card out of pure reflex: CHANCE PRUITT, PRUITT BASIN PARTNERS. WE BUY WELLS.',
      'Up the road comes a hand-truck stacked with empty jugs, pushed by a woman in a waxed canvas hat and muddy boots. She sets it down and looks at you, at the drone, at the man on the cattle guard. “You got my note. Good,” she says. “Saffron Gutierrez. Saff. I leave the jugs. I am not the light.” She reads the card, and her face goes very still. “Oh,” she says. “Oh, no. He’s been reading them.”',
    ],
    afterMiss: [
      'The light gets away. It doesn’t get far. At first light a woman in a waxed canvas hat comes up the road pushing a hand-truck of empty jugs. “You got my note. Good,” she says. “I’ve seen it come down past the cattle guard twice. Both times I hid behind my hand-truck. Saffron Gutierrez. Saff. I leave the jugs. I am not the light. I would very much like to know who is.”',
      'You walk down together. In the turnout a man in a camouflage hunting poncho is loading a survey drone into the bed of a rented pickup: party lights, a waterproof speaker zip-tied to its belly, a sonar sounder on a line. He sees all of you and a hand-truck and puts his hands up. When you pull back his hood he hands you a business card out of pure reflex: CHANCE PRUITT, PRUITT BASIN PARTNERS. WE BUY WELLS. Saff reads it and goes very still. “Oh, no,” she says. “He’s been reading them.”',
    ],
    choices: [
      {
        id: 'confront',
        label: 'Ask Pruitt what the dates on the jugs are worth to him',
        text: 'You ask him straight. Pruitt looks at the jugs, at Saff, and decides honesty is cheaper than a lawyer.',
        next: 'the-buyer',
      },
      {
        id: 'why',
        label: 'Ask Saff why she leaves the jugs at all',
        text: 'You ask the simplest question. Saff takes off her hat and looks up the road toward the dry well for a long time before she answers.',
        next: 'the-well',
      },
      {
        id: 'other-light',
        label: 'Ask whether his was the only light over the river',
        text: 'You ask whether his was the only light over the river. Pruitt says yes at once, and for the first time all morning he sounds scared: he only ever flew one. Saff says nothing, and that night she drives you down to the deep pool in a truck held together with zip ties and conviction.',
        ending: 'contact',
      },
    ],
    leadLines: {
      mara: 'Mara reads the tape on Saff’s empty jugs, one after another. “Not a single misspelled September. I need to sit down.”',
      kit: 'Kit has the drone in her lap like a confiscated puppy. “Rental lights, a party speaker and a sounder worth more than my car. You built a UFO out of a water-rights budget.”',
      juniper:
        'Juniper walks a slow circle around Pruitt. “Party lights and a playlist,” she says. “You didn’t even try to be an alien. I’m offended on their behalf.”',
      cedar:
        'Cedar squints at the drone. “Folks up 299 been blaming those lights on outer space since ’74. Turns out it’s a guy with an acquisitions budget. Honestly? Scarier.”',
    },
    aloneLine:
      'Alone with the two of them, you realize the woman with the jugs has been doing this alone so long she has stopped noticing.',
    recall: {
      'g1:fail':
        'Nell’s road gave you nothing you could use, and nobody on it had pictured a man with a rental truck and a business card.',
      'g3:line':
        'Your palms are still striped red from the sounding cord, and he keeps glancing at them as if they might file a complaint.',
      'g3:ring':
        'Earl’s people have followed you down the hill, and every flashlight they brought is pointed at the man in the poncho.',
      'g3:library':
        'Saff glances up the hill toward the dome. “You’ve been in my library,” she says. “Somebody always moves September.”',
    },
  },
  branches: {
    'the-buyer': {
      title: 'The Price List',
      place: 'The Long Bucket Ranch, the cattle guard',
      chapter: 4,
      scene: 'meadow',
      body: [
        'Pruitt Basin Partners, it turns out, brokers water. “I don’t want their houses,” Pruitt says. “I want what’s under them. I buy the parcel, keep the well rights, and resell the house dry. Nobody sells because a well might fail in 2049. They sell because there’s a light over the backyard humming at them, and a jug on the porch counting down. I just mail the offer the next morning.” He tips his head at the dry well. “I calibrate off hers every dawn. If my sounder agrees with her jug for that one, I trust the rest.”',
        'He nods at Saff, almost respectfully. “Her dates are the best survey in the county, and she gives them away. The late ones are the deep wells. That’s my whole buy list.” Saff sits down on her hand-truck as if her knees have been cut. All those labels, all those dawns, and she has been drawing a treasure map. “I was the bucket kid up here in ’74,” she says, to nobody. “Fifty years making sure nobody’s well goes dry without warning. I never once thought about who else could read.”',
      ],
      choices: [
        {
          id: 'buy-list',
          label: 'Take his buy list to the fire hall, every name on it',
          text: 'You take the folder off his dashboard while he is still explaining. By noon every name on it has heard what the light was, and who was flying it.',
          ending: 'water-for-everyone',
        },
        {
          id: 'let-go',
          label: 'Let him drive off, if he leaves the drone and the valley',
          text: 'You make the deal. Pruitt counts out loud what the drone cost him, twice, then hands over the controller and drives away with his hands at ten and two. Saff watches his dust settle and does not look at her jugs.',
          ending: 'jugs-stop',
        },
      ],
    },
    'the-well': {
      title: 'The Well That Failed',
      place: 'The Long Bucket Ranch, beside the dry well',
      chapter: 4,
      scene: 'meadow',
      body: [
        '“I was nine,” Saff says. “Spring of ’74. Twenty-two grown-ups came up here to live on sunlight and beans and good intentions, and nobody checked the water table. I was the bucket kid. Every morning I lowered that bucket, and every morning the rope went a little longer. I told them. Nobody listens to a nine-year-old with a rope. Then one morning the bucket came up dry, and by June the ranch was over.”',
        '“Everyone says they vanished. They didn’t vanish. They got jobs. My mom became a dental hygienist in Willits. Nobody got abducted. They just got thirsty.” She taps a jug. “So I measure every well in the valley and leave the date on the porch. Nobody listens to a nine-year-old. Everybody looks at a jug.” She glances at Pruitt. “Including him.”',
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
          text: 'You tell her she has done her part, more than her part, ever since she was nine. Saff nods, and the nod looks like it weighs about a gallon.',
          ending: 'jugs-stop',
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
        'By the next summer the well roads outside Blue Lake have a well-share co-op, run out of the fire hall on a whiteboard in draftsman’s capitals. Deep wells help shallow ones through the dry months, rain tanks go up on every barn roof that will hold them, and Pruitt does not go quietly: he already holds the well rights under two parcels, and his lawyer’s letter says so. The co-op buys them back at his price with a year of pancake breakfasts and one ruthless raffle, and after that not one more parcel on the well roads sells to Pruitt Basin Partners. The dates on the porch jugs start getting crossed out and rewritten, years later each time. Nell runs the mailing list. Arlo, the old man in the camp chair from the gravel bar, runs the jokes.',
        'In August a dozen grey-haired former ranchers from the Long Bucket days, entirely unabducted, Saff’s mother among them, stand in the meadow while Saff pours one jug of river water, ceremonially, down the dry well. It doesn’t fix anything. Everyone cries anyway. Overhead, a secondhand drone flies the co-op’s well survey in plain white light, humming nothing at all.',
      ],
    },
    {
      id: 'jugs-stop',
      title: 'The Jugs Stop Coming',
      tone: 'bittersweet',
      text: [
        'Saff stops the jugs. A warning anybody can read, she says, is a map anybody can read, and she can’t choose who reads it. Pruitt Basin Partners closes its post office box in Blue Lake and opens one two valleys over. The numbers were never secret; anyone can ask for their own well reading. Most people don’t. A few do, and quietly put in a tank, or conserve, or move.',
        'In the August of a year you won’t name, Nell’s well runs low but holds. She credits the jug on her windowsill, which she never opened. You visit the dome one last time and find the shelves bare except for one jug, labeled with Nell’s address and a date so far out nobody on her road will have to worry about it. It is full.',
      ],
    },
    {
      id: 'contact',
      title: 'Contact',
      tone: 'strange',
      text: [
        'Above the deep pool hangs the small, still light from the gravel bar, the one nobody claimed. “I fill every jug from this river,” Saff says quietly. “But people say they taste of iron and smoke. Like water from a much lower river. Like water from the date on the label.” The light drops to the water close enough to touch, and you see it is no machine. It is a glass jug with a finger loop, glowing from within, full of water that moves the wrong way.',
        'Then it lifts away upriver, faster than anything with rotors, and the river behind it rises an inch on a night with no rain. All that year the deep pool never drops below a mark Saff paints on the rock, no matter how dry it gets. She leaves an extra jug on the gravel bar each night, labeled THANK YOU, and every morning it is gone.',
      ],
    },
  ],
}
