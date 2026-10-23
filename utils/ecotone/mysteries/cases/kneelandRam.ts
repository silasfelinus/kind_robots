import type { Mystery } from '../types'

// Case I. Seed: charge first, competition, courage, impulsiveness, the need to be first.

export const KNEELAND_RAM: Mystery = {
  id: 'kneeland-ram',
  number: 1,
  sign: 'aries',
  title: 'The Mystery of the Ridge Ram',
  tagline: 'Something with curling horns is charging cars in the Kneeland fog.',
  region: 'Kneeland ridge and Kneeland Road',
  hook: 'After eleven at night, when the fog pours over Kneeland Road like milk into a bowl, something with curling horns comes down the mountain at the speed of a bad decision. Car doors come back dented at exactly headbutt height. A crowd of cryptid hunters with trail cams and a merch table has named it the Ridge Ram, and they are planning to catch it.',
  design: {
    element: 'fire',
    motif: 'horns',
    palette: { sky: '#2b0e0a', ink: '#f4b860', glow: '#e8572a' },
    stars: [
      [16, 50],
      [24, 40],
      [40, 32],
      [62, 38],
      [78, 54],
      [70, 68],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. The top of Kneeland ridge at night, a two-lane mountain road dropping into a sea of white fog lit from below by unseen headlights, a lone windsock and a short rural runway light above the cloud line. Racing down the road, a homemade gravity cart built from a church pew, and ahead of it a shaggy escaped ram mid-gallop. The road curls back on itself in the shape of a ram’s spiraling horns. Faint ember stars above the ridge form an unlabeled small bent constellation. Ember orange, gold and charcoal. No text, no letters, no logos.',
  provenance:
    'Kneeland Road climbs from the Freshwater area onto Kneeland ridge, and the small Kneeland airport on the ridge is real and often sits above the coastal fog; they appear here as geography only. The Ridge Ram, the Ridgetop Senior Gravity League, Bev Ostrander, Sergeant Butters, the Ridge Ram Watchers and every other person and event are invented. No real organization, race or business is depicted.',
  decline: {
    label: 'Tell Dwight that rams are a sheep problem, not a you problem',
    text: 'You send back a thumbs-up and turn your phone face down. Dwight replies with a photo of a dented door and the word COWARD in all capitals, then an apology, then a coupon code for Ridge Ram merch. Somewhere up the mountain, something with horns is about to go first without you.',
  },
  gates: [
    {
      title: 'Dents at Headbutt Height',
      place: 'Kneeland Road, a gravel turnout below the fog line',
      chapter: 4,
      scene: 'highway',
      message: {
        medium: 'text',
        from: 'Dwight (Ridge Ram Watchers, admin)',
        lines: [
          'u said ur into weird stuff. this is the weirdest stuff',
          'RIDGE RAM hit 3 cars last week. all dents same height. ALL OF THEM',
          'turnout at mile 4. 11pm. bring a thermos and ur courage. merch available',
        ],
      },
      body: [
        'The turnout is full of folding chairs, trail cameras zip-tied to fence posts and about twenty people in matching orange beanies that say RIDGE RAM WATCHERS: WE SAW IT FIRST. Dwight, twenty-two and never once told no by a cryptid, walks you to a dented Subaru. The dent is perfectly round, knee-high on an adult, and the paint around it is scuffed in a ring.',
        'At 11:02 the fog arrives all at once. At 11:04 there is a sound coming down the mountain that is not an engine: a long, rising whir, like a thousand bicycle wheels in a hurry. Twenty people raise their phones. Nobody has ever gotten a picture.',
      ],
      approaches: [
        {
          id: 'stand-in-road',
          label: 'Walk into the middle of Kneeland Road and meet it head-on',
          check: { skill: 'burly', target: 9 },
          cost: 'The Watchers will remember this forever, one way or another.',
          success: {
            text: 'You plant your feet on the center line. The whir becomes a roar of bearings, and out of the fog comes a shaggy white ram at a full gallop, eyes wild, and right behind it a long low shape with curling horns on top. You do not move. The shape swerves at the last instant, close enough that you feel the wind, and you see three things: a painted number 07, hay bales lashed to the front like a bumper, and a gloved hand giving you a thumbs-up.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You plant your feet on the center line and wait. And wait. At 11:40 the only thing that comes down the mountain is a pickup full of firewood, whose driver stops, rolls down the window and asks if you need a ride to the hospital. The Watchers give you a sticker that says BRAVE IDIOT. You put it on your thermos, because it is fair.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'dents',
          label: 'Measure the dents with a tape and a flashlight',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'Every dent sits at twenty-six inches, dead level, on three different cars on two different slopes. Skulls do not do dead level. Inside the scuffed ring you find black rubber and a smear of the particular safety orange that only comes on traffic cones and road-crew vests. Whatever hit these cars had a padded bumper, and every one was parked a little too far into the same blind curve.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You measure with great seriousness. The owner of the Subaru decides you are an insurance adjuster and follows you around the turnout explaining his deductible. By the time you shake him, the fog has turned your notes to pulp.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'outbrag',
          label:
            'Out-brag the Watchers until someone shows you the real sighting log',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You tell a bigger lie than anyone in the turnout and get a standing ovation. The oldest Watcher, a retired schoolteacher named Opal, quietly hands you a spiral notebook. Every sighting is on a Tuesday or a Friday, between 11:03 and 11:06, always going downhill. “Cryptids,” Opal says, tapping the page, “do not keep a schedule. People do.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You claim you once wrestled a bigfoot near Willow Creek. A Watcher named Tamsin asks which one, by name, and it turns out the Watchers have a spreadsheet. You are gently banned from the group chat for forty-eight hours for spreading disinformation.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara looks at the beanies. “Twenty people, one font, zero photos. I respect the commitment.”',
        kit: 'Kit tilts her head at the whir. “That is not an animal. That is ball bearings having the best night of their lives.”',
        juniper:
          'Juniper sniffs the fog. “Lanolin, wet wool and WD-40. Something out there is half sheep and half garage.”',
        cedar:
          'Cedar crouches by the dent. “I’ve hit a deer, a cow and my brother-in-law’s mailbox. None of ’em left a mark this tidy.”',
      },
      aloneLine:
        'Alone at the turnout with twenty strangers in matching hats, you realize you are the only one here who has not bought merch yet.',
    },
    {
      title: 'The Pit Above the Clouds',
      place: 'Kneeland ridge, an old hay barn near the airfield',
      chapter: 4,
      scene: 'meadow',
      message: {
        medium: 'note',
        from: 'Under your windshield wiper, in grease pencil',
        lines: [
          'YOU STOOD IN THE ROAD. GOOD.',
          'Top of the ridge. Old hay barn past the airfield. Tuesday, 10 pm.',
          'Bring a helmet. Tell no Watchers. — 07',
        ],
      },
      body: [
        'Above the fog, the ridge is a different country. The stars are out, the little airfield’s lights blink in the cold, and below you the whole coast is a white sea with the tops of hills poking up like islands. The hay barn has its doors open and a work light on, and inside are nine of the strangest vehicles you have ever seen: a church pew on go-kart wheels, a clawfoot bathtub with flame decals, a coffin-shaped cart with EARLY RETIREMENT painted on the lid.',
        'The racers are all over sixty, in leathers, cardigans and one bowling shirt. A shaggy white ram with a red bandana stands in the middle of the barn eating someone’s granola bar, and nobody stops him. On a hook by the door hangs a road-crew paddle, STOP on one side and SLOW on the other, the SLOW side scratched out with a key.',
      ],
      approaches: [
        {
          id: 'push-start',
          label:
            'Challenge the bathtub’s driver to a push-start sprint across the barn lot',
          check: { skill: 'burly', target: 7 },
          success: {
            text: 'The bathtub belongs to Hector Villanueva, seventy-four, a retired pharmacist with forearms like bridge cables. You both push off. You win by a nose and nearly die doing it. The barn cheers and Hector shakes your hand. “Two rules,” he says. “Flaggers on every curve, and nobody passes the ram. You’re in, kid. Provisionally.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Hector beats you by six feet, then turns around and beats you back. He hands you a lozenge and says, kindly, that young people do not train their glutes anymore. The barn agrees loudly and at length.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'look-down',
          label:
            'Walk to the ridge edge and look down at the fog where the road should be',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You look down long enough for your eyes to adjust. The fog is not empty. On its surface, faint as breath on glass, a road is drawn in moving lights: Kneeland Road, but lined with cheering crowds, hay bales and a banner you cannot read. A tiny white ram runs at the front of the lights. You blink, and it is a different road, overgrown and empty, and the ram is still there, running. Every version has the ram.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You stare at the fog until it stares back, and then you get dizzy and sit down hard on a cow pie. The ram, Sergeant Butters according to his bandana, comes over and eats the cuff of your jeans while you recover. You will be smelling this for the rest of the case.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'paddle',
          label:
            'Study the scratched-out road-crew paddle and its owner’s helmet hook',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'The paddle is old county road-crew issue, the handle wrapped in thirty years of electrical tape. Below it, on the hook, there is a welding helmet with two big curled horns bolted to the sides, the horns made from bent exhaust pipe and painted bone white. Inside the helmet, written on masking tape in neat block capitals: PROPERTY OF B. OSTRANDER. IF FOUND, I AM STILL GOING.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You reach for the paddle and a voice from the dark says, “Touch that and you flag the next three races in the rain.” You put it down. You never see who said it. Later, somebody hands you a reflective vest with your name already on it.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara runs her hand along the coffin cart’s pinstripes. “Somebody here can hold a line better than I can. I want their name.”',
        kit: 'Kit is already lying under the bathtub cart with a flashlight. “Disc brakes off a mountain bike. Steering off a riding mower. I am in love with all of you.”',
        juniper:
          'Juniper scratches Sergeant Butters behind the horns. “He’s not escaped. He’s just gone where he’s needed.”',
        cedar:
          'Cedar whistles at the axles. “These folks are running better welds than half the trucks in Blue Lake.”',
      },
      aloneLine:
        'Alone in a barn full of strangers twice your age, you are, for once, the slowest person in the room.',
    },
    {
      title: 'Race Night',
      place: 'Kneeland Road, the blind curve at mile 4',
      chapter: 4,
      scene: 'highway',
      message: {
        medium: 'radio',
        from: 'CB channel 19, a voice with no call sign',
        lines: [
          '“Breaker, breaker. Ram runs at eleven. Last heat of the season.',
          'Word is the Watchers got a cargo net and a plan. They don’t got a plan.',
          'Whoever stood in the road: be at the curve. We’re short a flagger.”',
        ],
      },
      body: [
        'The Watchers have strung a cargo net across the blind curve at mile 4, between two fence posts, at roughly chest height on a person in a cart. Dwight is beaming. “Tonight,” he says, “we make history.” Up on the ridge, nine carts are lining up in the starlight, and none of them knows the net is there.',
        'The fog comes in at 11:02, right on schedule. You have maybe two minutes to decide whether you are here to catch a monster or keep somebody from getting hurt, and you are starting to suspect those are the same job.',
      ],
      approaches: [
        {
          id: 'race-down',
          label:
            'Grab the spare cart, launch from the ridge and race the Ram to the curve',
          check: { skill: 'burly', target: 11 },
          cost: 'You are about to ride a church pew down a mountain at night.',
          success: {
            text: 'You throw yourself onto the spare pew and go. The fog swallows you, and for one glorious curve you are side by side with the horned helmet, both of you laughing like maniacs. You pull ahead just enough to shout NET, and the Ram leans hard and drops into the gravel runoff, and you go in right after it. Nine carts follow, safe, and the net catches only Dwight’s trail camera.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'The pew goes faster than you planned and slower than the Ram. You spin out on the first switchback into a blackberry bramble, which is soft and loving and full of thorns. By the time you climb out, the race has gone past and somebody else has handled the net.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'reroute',
          label: 'Talk the Watchers into moving the net onto a hay-bale runoff',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You tell Dwight that real cryptid hunters do not net, they funnel, and you sketch a runoff into the gravel turnout lined with Watcher folding chairs and every hay bale you can find. He loves it and says it was his idea. At 11:04 the Ram and nine carts thunder down out of the fog, peel off into the runoff one by one, and come to a stop in a heap of hay, horns, cardigans and one extremely satisfied ram.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Dwight agrees to move the net, then moves it the wrong way. Nine carts brake in a panic and pile into the ditch in a slow, dignified, very loud tangle. Nobody is hurt. Everyone is livid. A seventy-eight-year-old woman in a bowling shirt tells you exactly what she thinks of you in a voice that could strip paint.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'flag',
          label:
            'Take the flagger’s spot at the curve and wave them through yourself',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You pull on the reflective vest, plant yourself at the curve with a flashlight and wave every cart wide of the net like you were born doing it. The last one down is the horned helmet. It slows, just for you, and the driver lifts one gloved hand off the wheel and points at you: well done. The Ram comes to a stop in the turnout. Dwight drops his phone.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You wave the flashlight with total confidence in exactly the wrong direction. Two carts head for the net, and Sergeant Butters, of all creatures, charges it first, horns down, and tears it off its posts. The carts sail through. The ram looks back at you with what can only be described as professional disappointment.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara pulls on a borrowed vest. “If anyone gets hurt tonight, I’m tattooing NET on Dwight’s forehead.”',
        kit: 'Kit is strapping a bike light to a hay bale. “Every race needs a finish line. I’ll make one. Nobody stop me.”',
        juniper:
          'Juniper stands in the fog with her eyes closed. “They’re coming. Nine hearts and a ram. Ten, counting yours.”',
        cedar:
          'Cedar keys his CB. “Channel 19, this is the curve. Come down wide. You hear me, come down wide.”',
      },
      aloneLine:
        'There is nobody to dare you. You realize, with the fog in your face and the whir coming down the mountain, that you do not need one.',
    },
  ],
  coldCase: {
    title: 'The Fog Keeps Its Secret',
    place: 'Kneeland Road, the morning after',
    chapter: 4,
    scene: 'highway',
    body: [
      'By morning the fog has burned off and Kneeland Road is just a road. The cargo net is in a heap. There are tire tracks in the gravel turnout, very thin ones, and hoofprints that go into the trees and stop.',
      'Dwight posts a blurry photo of a horned shape and calls it proof. It gets four likes. Somewhere on the ridge a barn door rolls shut, and the season is over.',
    ],
    choices: [
      {
        id: 'hoofprint',
        label: 'Photograph the last hoofprint before the sun dries it',
        text: 'You take the picture. Later, zooming in, you see that the hoofprint is pointing uphill, and that the gravel around it is from a road surface the county has not laid yet.',
        effects: { weird: 1 },
      },
      {
        id: 'watchers',
        label: 'Join the Watchers for breakfast and let them tell it',
        text: 'You eat pancakes with twenty people in orange hats. Opal tells the story best. By the third retelling you were in it, standing in the road, and you decide not to correct her.',
        effects: { goodwill: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Ram in the Headlights',
    place: 'Kneeland Road, the gravel turnout',
    chapter: 4,
    scene: 'highway',
    body: [
      'The fog thins. Every flashlight and phone in the turnout swings to the same spot. There sits a long, low cart built from the frame of a hospital gurney, with hay bales lashed to the nose and a padded rubber bumper ringed in safety orange. In the driver’s seat sits a figure in leathers and a welding helmet with two enormous curling horns. Sergeant Butters stands beside it, panting, his bandana askew.',
      'Up the mountain, eight more carts are rolling to a stop in a line, their drivers lifting goggles and helmets. The horned figure turns its head slowly toward you. It has been first all night. Now it is your move.',
    ],
    choices: [
      {
        id: 'unmask',
        label: 'Lift the horned helmet, the way it always goes',
        text: 'You reach out. The figure does not stop you, only tips its head forward so the horns do not catch.',
        next: 'unmasked',
      },
      {
        id: 'rematch',
        label: 'Demand a rematch, right now, top to bottom',
        text: 'You point up the mountain. The horned helmet nods once, slowly, the way a bull nods at a red cape.',
        next: 'rematch',
      },
      {
        id: 'follow-ram',
        label: 'Ignore everyone and follow Sergeant Butters into the fog',
        text: 'Sergeant Butters looks at you, flicks an ear and trots off uphill into the white. You go after him before you can think better of it.',
        ending: 'headfirst',
        effects: { weird: 1 },
      },
    ],
    leadLines: {
      mara: 'Mara keeps her flashlight steady on the helmet. “Whoever’s in there earned this moment. Don’t rush it.”',
      kit: 'Kit is staring at the gurney frame like it is a love letter. “Ask them anything you want. I’m asking about the steering.”',
      juniper:
        'Juniper smiles at the ram. “He already knows how this ends. He’s just waiting to see if you do.”',
      cedar:
        'Cedar takes off his cap. “Twenty years on this mountain, and I never once thought to go down it without an engine.”',
    },
    aloneLine:
      'No one is beside you. The horns turn toward you anyway, as if you were the only person on the road.',
  },
  branches: {
    unmasked: {
      title: 'Bev Ostrander',
      place: 'Kneeland Road, the gravel turnout',
      chapter: 4,
      scene: 'highway',
      body: [
        'Under the helmet is a woman of seventy-one with a silver buzz cut and wind-burned cheeks: Bev Ostrander, who spent thirty-one years on the county road crew holding a STOP/SLOW paddle in the rain on this exact road. Opal gasps. “Bev? You flagged me through a rockslide in 1994.”',
        '“Thirty-one years,” Bev says, “I stood still and told everybody else when they could go. I never once got to go first. Then last spring a doctor looked at my heart and said, Beverly, you need to slow down. And I thought, I have been slowing down since 1983.” She pats the gurney. “He meant well. But I wanted to be first at something, once, before I’m last at everything. So we built the League. Flaggers on every curve. Nobody passes the ram.” Behind her, eight old racers are nodding.',
      ],
      choices: [
        {
          id: 'go-public',
          label:
            'Tell Bev the Watchers would buy tickets, and so would everyone else',
          text: 'You point at Dwight, who is crying openly and already designing a new beanie. Bev looks at the turnout full of people who drove up a mountain at midnight to see her, and starts to laugh.',
          ending: 'first-down',
          effects: { goodwill: 1 },
        },
        {
          id: 'keep-secret',
          label: 'Hand her back the helmet and promise you never saw a thing',
          text: 'You hold out the helmet. Bev takes it, looks at you a long time, and nods. Behind you, Dwight is very quietly deleting his photos.',
          ending: 'ram-stays-wild',
        },
      ],
    },
    rematch: {
      title: 'Top of the Mountain',
      place: 'Kneeland ridge, above the fog',
      chapter: 4,
      scene: 'meadow',
      body: [
        'At the top of the ridge, above the clouds, the stars are so bright they look loud. You are sitting in the spare church pew. Beside you, the horned figure lifts the helmet for just a second to wipe its eyes, and you see a silver buzz cut and a grin seventy-one years in the making. “Bev Ostrander,” she says. “Thirty-one years on the road crew. Doctor told me to slow down. Ready?”',
        'Sergeant Butters steps to the front, the way he always does. Hector drops a bandana. You go. The fog rises to meet you, and inside it, flickering past at every curve, you see tomorrow’s road: crowds, banners, a different you in a better helmet. The ram is in every single one of them, running first.',
      ],
      choices: [
        {
          id: 'lose-gloriously',
          label: 'Give it everything and lose by a horn',
          text: 'You lean into every curve. You are faster than you have ever been. Bev beats you by the length of one painted horn, and the ram beats both of you by a mile.',
          ending: 'first-down',
          effects: { nerve: 1 },
        },
        {
          id: 'chase-butters',
          label: 'Swerve off the road and chase the ram into the fog',
          text: 'Halfway down, Sergeant Butters veers off the asphalt and into the white. You follow, because some part of you has always wanted to.',
          ending: 'headfirst',
        },
        {
          id: 'stop-and-flag',
          label: 'Brake at the curve and wave Bev through first',
          text: 'You pull over at the blind curve, stand up in the pew and wave her past, the way she waved the whole county past for thirty-one years.',
          ending: 'ram-stays-wild',
        },
      ],
    },
  },
  endings: [
    {
      id: 'first-down',
      title: 'First Down the Mountain',
      tone: 'true',
      text: [
        'By next fall it is official. The county closes Kneeland Road one Sunday a year for the Ridge Ram Charity Downhill, with real flaggers, real hay bales and a real ambulance parked at the bottom. The Ridgetop Senior Gravity League raises enough for a new van at the senior center. The Watchers run the merch table. Their beanies now say WE SAW HER FIRST.',
        'You race in a borrowed cart and finish dead last, behind a seventy-nine-year-old in a church pew, and it is the best day of your life. Bev wins. Sergeant Butters crosses the line before all of you, as he always will, and nobody has ever once tried to pass him.',
      ],
    },
    {
      id: 'ram-stays-wild',
      title: 'The Ram Stays Wild',
      tone: 'bittersweet',
      text: [
        'The Watchers never get their photo. The League keeps racing on Tuesdays and Fridays, quietly, with flaggers on every curve, until one spring Bev hangs the horned helmet on the barn hook and leaves it there. Her heart is fine. She just got what she wanted, she says. She got to go first.',
        'A month later the helmet turns up on your doorstep with a note in grease pencil: YOUR TURN. Some nights, driving Kneeland Road in the fog, you still hear the whir, and you pull over and let it pass. You never see who is driving. You always see the ram.',
      ],
    },
    {
      id: 'headfirst',
      title: 'Headfirst Into Tomorrow',
      tone: 'strange',
      text: [
        'The fog closes over you like water. The ram runs, and you run after him, and the road under your feet changes texture three times: new asphalt, cracked asphalt, grass. You glimpse crowds and banners and empty ridges. In every one of them the ram is just ahead, never looking back.',
        'You come out of the fog at the gravel turnout at 11:01, panting. Dwight is setting up his folding chair. Your own car is pulling in, and you are climbing out of it, holding a thermos, about to read a text from a man with a merch table. Sergeant Butters stands beside you, chewing, entirely unbothered, ready to go first again.',
      ],
    },
  ],
}
