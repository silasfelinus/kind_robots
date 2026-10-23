import type { Mystery } from '../types'

// Case X. Seed: ambition, discipline, duty, tradition, hard work, the long climb, the old boss.

export const SEA_GOAT: Mystery = {
  id: 'sea-goat',
  number: 10,
  sign: 'capricorn',
  title: 'The Mystery of the Sea-Goat of Samoa',
  tagline:
    'Half goat, half fish, all work: something climbs the dead mill stack at midnight.',
  region:
    'The Samoa Peninsula: the old pulp mill, its pier and the company-town cottages',
  hook: 'Something surfaces by the old pulp mill pier on Samoa after dark: horns and a beard in front, a long scaled tail behind. It climbs the dead smokestack hand over hoof, and at midnight the mill whistle blows, though nothing out there has had power since 2008. The scrap thieves have started leaving in a hurry, sometimes without their trucks. Nobody is sure whether to be grateful.',
  design: {
    element: 'earth',
    motif: 'sea-goat',
    palette: { sky: '#171c12', ink: '#d9b76a', glow: '#6f7f3f' },
    stars: [
      [82, 24],
      [78, 32],
      [66, 58],
      [60, 70],
      [44, 64],
      [22, 34],
      [28, 38],
      [42, 38],
      [56, 36],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 1],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. The Samoa Peninsula on Humboldt Bay at night: a weathered timber pier running out over black water and eelgrass, the rusted bulk of an abandoned pulp mill and its tall smokestack, a brass steam whistle on a pipe catching the moonlight. Climbing the smokestack ladder, a figure with curled goat horns and a rope beard above and a long green-scaled fishtail below, half creature and half homemade costume. Fog rolls off the bay; Eureka’s lights glow small across the water. Faint brass stars above form an unlabeled sea-goat constellation. Moss green, umber and brass. No text, no letters, no logos.',
  provenance:
    'Samoa, on the peninsula across Humboldt Bay from Eureka, was built as a lumber company town, and many of its cottages still stand. A pulp mill on the peninsula closed in 2008, and in the years after, federal cleanup crews removed millions of gallons of caustic pulping liquor left behind in its tanks. Eelgrass restoration is real work in Humboldt Bay. Tess Keough, her father Walt, Dolores Ybarra, Jojo, the mill whistle, the restoration grant, the scrap crew, the creature and every other person and event here are invented. No real business or person is depicted.',
  decline: {
    label: 'Let Jojo’s voicemail sit with the others',
    text: 'You don’t call back. At two in the morning Jojo leaves one more message: eleven seconds of a whistle across water, then her voice, quietly, “Okay. Never mind. I’ll handle it.” You lie awake wondering how a tow truck handles a goat.',
  },
  gates: [
    {
      title: 'Hoofprints on the Pier',
      place: 'The old pulp mill pier, Samoa',
      chapter: 3,
      scene: 'bay',
      message: {
        medium: 'voicemail',
        from: 'Jojo (night-shift tow), 0:47',
        lines: [
          '“Hey, it’s Jojo, night tow, we met at that thing. Okay. Weird question. Do you do monsters?',
          'I just pulled a scrap guy’s truck off the mill road on Samoa. Engine running, door open. He was crying. Grown man.',
          'Says a goat came up out of the bay. With a tail. I’m at the pier with maple bars and a crowbar. Just come.”',
        ],
      },
      body: [
        'The old mill pier runs out into Humboldt Bay on pilings the color of burnt toast. Behind it the pulp mill sits dead and enormous, its smokestack raised into the fog like a finger making a point nobody stayed to hear. Jojo leans on her bumper with a box of maple bars and a crowbar she describes as “emotional support.” Before she says hello she photographs the abandoned truck’s plate for her invoice. Third tow off this one road this month, she mentions, at the county rate. “Not complaining,” she says, not complaining.',
        'On the pier planks: wet prints. Cloven, deep, and behind each pair a long smooth drag. They climb out of the water and stop at the base of the stack, beside an abandoned bolt cutter and a coil of stripped copper wire somebody left in a hurry. At the end of the pier, a bundle of fresh eelgrass is tied to a piling with a mill rigger’s knot.',
      ],
      approaches: [
        {
          id: 'prints',
          label: 'Cast the hoofprints and measure the stride',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You mix plaster in a donut box and pour. The casts come out crisp: cloven prints in front, and behind them a smooth drag like a sled, or a tail. The stride is wrong for a goat and exactly right for a person in fins walking very carefully. Pressed into the plaster is a fiber of neoprene, and stitched to it, a tuft of goat hair dyed seaweed green.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'The plaster sets around your shoe. Jojo frees you with a tow strap, gently, which is the least dignified rescue of your life, and she films all of it for her group chat. By the time you are loose, the tide has come up the ladder and licked every print off the planks.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'ladder',
          label: 'Climb the smokestack ladder where the prints stop',
          check: { skill: 'burly', target: 9 },
          cost: 'The ladder cage is rust and good intentions, and it is a long way up.',
          success: {
            text: 'Forty rungs up you find a rest platform scrubbed clean of gull droppings, which no gull has ever done. There is a thermos, still warm, binoculars aimed at the scrap road, and a trail camera bolted to the rail, pointed not at the road but down the ladder, at whoever climbs it. Whoever climbs this stack is not hiding up here. They are on shift, and they want it on the record.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Twenty rungs up, the rust bites your palm and your legs vote, unanimously, to go home. You come down slower than you went up. At the bottom, a scrap-crew lookout you never noticed is leaning on the fence with a cigarette, and he gives you a long, slow clap before he walks off into the dark.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara crouches over a print. “Cloven in front, smooth behind. Either it’s a myth or it’s somebody with fins and no shame.”',
        kit: 'Kit eyes the ladder cage and flexes her fingers. “Whoever goes up that every night has better grip strength than me, and I’m annoyed about it.”',
        juniper:
          'Juniper dips a hand in the bay and frowns. “The eelgrass down there is new. Somebody’s been gardening underwater.”',
        cedar:
          'Cedar looks from the stack to the abandoned truck. “I’ve hauled out of this mill road at two in the morning,” he says. “Never saw a goat. Saw plenty of guys who should’ve been scared of one.”',
      },
      aloneLine:
        'Alone on the pier, you hear something heavy and patient shift beneath the planks, waiting for you to leave so it can get back to work.',
    },
    {
      title: 'The Foreman’s Cottage',
      place: 'The company-town cottages, Samoa',
      chapter: 3,
      scene: 'dunes',
      message: {
        medium: 'text',
        from: 'Unknown number',
        lines: [
          'THIS IS DOLORES YBARRA. MY GRANDSON IS TYPING. I DO NOT TEXT.',
          'jojo says you are asking about the whistle. it is WALT KEOUGHS whistle. walt was our last foreman. he is in yuma with his sister and very much alive, he wants that known',
          'yellow cottage on the end. coffee is on. do not knock on walts door. somebody answers it',
        ],
      },
      body: [
        'The cottages stand in tidy rows with the dunes at their backs, built a century ago for mill families and kept painted ever since by people who refuse to let anything go shabby. Dolores Ybarra, seventy-six, pours coffee strong enough to strip a deck and tells you about the whistle: brass, the size of a fire hydrant, blown by hand at every shift change by Walt Keough for thirty-seven years. “The day the doors closed, Walt carried it home on his shoulder, and the whole street came out to watch. When he went south to his sister’s, it stayed in his garage. Hasn’t made a sound since. Until last month.”',
        'Walt’s cottage is two doors down. The lawn is mowed in perfect stripes, which is a lot of effort for a man in Arizona. The garage light is on. Through the window you can see a sewing machine, a laptop open to a spreadsheet titled INCIDENTS, and something long and green draped over the workbench, half covered by a tarp.',
      ],
      approaches: [
        {
          id: 'dolores',
          label: 'Sit with Dolores and let her tell the mill stories',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You ask the right question, which is “What was the best day?”, and Dolores talks for an hour. Walt has a daughter, Tess, who rode on his shoulders up the catwalk every bring-your-kid day and who now runs the eelgrass project under the old pier. “Nine years in waders, grant to grant. She’s got Walt’s disease: if it isn’t on the record, it didn’t happen.” Dolores smiles. “She called the mill a dragon when she was little. Walt said no, mija, it’s a goat. It climbs, and it doesn’t quit.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You ask what the mill made, and Dolores spends forty minutes explaining pulping with diagrams on napkins. It is fascinating. It is also, it turns out, a quiz. When you get the bleaching sequence wrong, she takes your coffee back, kindly, and tells you to come again when you’ve studied.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'ledgers',
          label:
            'Find Walt in the mill’s old shift ledgers at the community hall',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'The ledgers live in a locked cabinet at the community hall, and Dolores has the key, because of course she does. Walt Keough clocked in for thirty-seven years and missed four days: three for his daughter’s birth and one for a World Series game he has never once apologized for. In the margin of the final page, the last shift in 2008, someone has written in square pencil: Whistle goes home with me. Somebody has to keep the hours.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The ledgers are water-stained and filed by a system no living person understands. You find seven Keoughs, a Kehoe and a pressed four-leaf clover from 1961. Dolores looks over your shoulder and says, “That’s the wrong Walt. That Walt drove the forklift. Lovely man, terrible at cards.”',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara studies the garage through the window. “Somebody’s hemming neoprene on a walking-foot machine at midnight. That isn’t a hobby. That’s a deadline.”',
        kit: 'Kit reads the garage like a workshop she wants to rob. “Dive tank, sprinkler timer, industrial glue. Whoever works in there finishes things.”',
        juniper:
          'Juniper sniffs the porch roses. “Somebody kept these alive out of pure stubbornness. I want her to do mine.”',
        cedar:
          'Cedar shakes Dolores’s hand with both of his. “My dad says the bleach plant crew were the toughest people on the bay.” Dolores says, “Your dad is correct.”',
      },
      aloneLine:
        'With no one to cover for you, Dolores feeds you three cookies and tells you exactly which window to look through, which is its own kind of crew.',
      recall: {
        'g1:fail':
          'Dolores has already heard how your first night on the pier went. Everyone on the peninsula has; Jojo talks on the tow radio.',
      },
    },
    {
      title: 'Midnight on the Stack',
      place: 'The old pulp mill, the smokestack and pier',
      chapter: 3,
      scene: 'bay',
      message: {
        medium: 'flyer',
        from: 'Stapled to the pier gate',
        lines: [
          'NOTICE TO WHOEVER KEEPS TAKING THE COPPER:',
          'This pier is on shift. The whistle blows at midnight. Clock out.',
          'Underneath, in a different hand and a worse marker: 2nite 1130 last load. bring the torch.',
        ],
      },
      body: [
        'Eleven-thirty. You have a plan, which is more than the scrap crew has. They roll in with their headlights off, four guys and somebody’s cousin, dragging a cutting torch toward the last copper on the pier. Up the road Jojo waits with her tow truck idling and every beacon she owns aimed at the gravel lot. “If this were about tows,” she says, “I’d let them stay. I want them gone.”',
        'At eleven fifty-seven, the water by the ladder goes flat and glassy. Horns break the surface. Then the beard, then the shoulders, then a long scaled tail that thumps the planks once like a gavel. The sea-goat begins to climb. At the base of the stack, a brass whistle waits on a pipe with no power to it at all.',
      ],
      approaches: [
        {
          id: 'early',
          label: 'Beat it up the ladder and be waiting on the platform',
          check: { skill: 'burly', target: 11 },
          cost: 'You have to out-climb it, in the dark, in the wind.',
          success: {
            text: 'You climb like it is your job, which tonight it is. You haul onto the rest platform three rungs ahead, sit down on the cold grating and check your watch like a supervisor. The horns rise over the edge and stop. “…You’re early,” says a woman’s voice from inside the goat, sounding honestly impressed. “Nobody is ever early.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Halfway up, the wind finds you. You hang there hugging the cage while the creature climbs past you on the outside of the ladder, hand over hoof, without slowing down, and from somewhere inside the costume you hear, faintly, the click of a stopwatch.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'decoy',
          label:
            'Lure the scrap crew off with a fake copper pile and tow lights',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You stack spray-painted pipe in the gravel lot and dust it with copper glitter, because you are a professional. The scrap crew goes for it. Jojo lights them up from three sides with her beacons, and they bolt for the road, leaving a truck behind that she pointedly does not tow. With the pier clear, the sea-goat stops on the ladder and looks down at you, surprised to have backup.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The scrap crew is not fooled by painted plumbing. They are, however, deeply offended by it, and spend ten minutes lecturing you about craftsmanship while the creature reaches the top of the stack unobserved. You learn the current price of copper per pound, against your will.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'whistle',
          label: 'Stand guard at the brass whistle and wait for midnight',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You plant yourself beside the whistle and do not move, not when the scrap crew curses, not when the stack groans. At eleven fifty-nine, a minute early, a valve hisses somewhere you cannot see and the whistle screams shift change across the water. For one second the dead mill windows are full of light, and the 1971 graveyard shift is filing in under the stack, lunch pails swinging, every one of them looking up at you like you’re late.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'At eleven fifty-eight your nerve goes and you grab the pull chain to stop it. The whistle blows anyway, a minute later, right next to your head. You spend the rest of the night hearing only one long, ringing note, and the scrap crew, who stood farther back, laughs about it all the way to the road.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara has rigged her phone on a tripod of zip ties. “If a fish-goat climbs a smokestack and nobody gets it in focus, I’m quitting art.”',
        kit: 'Kit is halfway up the ladder cage before anyone says go. “If it climbs, I climb. That’s the whole job description.”',
        juniper:
          'Juniper wades out to her knees and whispers to the eelgrass. “Hold on. The night shift’s here.”',
        cedar:
          'Cedar stands with Jojo by the tow truck, arms folded. “Scrap guys know me from the valley,” he says. “Also, Saturn’s been sitting right over this stack all month. Bad month to steal from a goat.”',
      },
      aloneLine:
        'You run the whole trap yourself, with Jojo on the radio, which is the closest thing to a crew this mill has had in years.',
      recall: {
        'g2:pass':
          'At eleven-fifteen your phone buzzes: GOOD LUCK. DO NOT FALL. WALT SAYS THE THIRTIETH RUNG IS LOOSE. — D. (GRANDSON TYPING)',
      },
    },
  ],
  coldCase: {
    title: 'The Whistle Goes Quiet',
    place: 'The old pulp mill pier, the next morning',
    chapter: 3,
    scene: 'bay',
    body: [
      'By morning, the pier gate has a new padlock and a county notice. Either the scrap crew got the last of the copper or the creature drove them off for good; nobody on the peninsula can agree which. The smokestack is just a smokestack again.',
      'Jojo texts a photo of a little plastic goat and a plastic fish zip-tied together on her dashboard like a hula girl. “Never saw it up close,” she writes. “Kind of wish I had. Kind of glad I didn’t.”',
    ],
    choices: [
      {
        id: 'eelgrass',
        label: 'Volunteer a morning with the eelgrass crew',
        text: 'You spend a morning knee-deep in bay mud, planting shoots by hand. The crew lead has curved rust scars across both palms, like ladder rungs, and a camera on a tripod filming every minute of your work for a grant report. She won’t say where she got the scars.',
        effects: { goodwill: 1 },
      },
      {
        id: 'listen',
        label: 'Listen for the whistle from across the bay',
        text: 'At midnight you stand on the Eureka waterfront and listen. Nothing. Then, a minute early, very faint, a breath of brass, like a shift is changing somewhere you cannot follow.',
        effects: { weird: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Sea-Goat Unmasked',
    place: 'The top of the mill smokestack',
    chapter: 3,
    scene: 'bay',
    body: [
      'The scrap trucks are taillights on the peninsula road. You and the sea-goat end up on the rest platform together, forty rungs above the pier, both of you breathing hard. It sits with its tail hanging over the edge and its horns tipped back, and it makes no move to leave. Bolted to the rail beside it, a trail camera blinks red.',
      'Up close, the costume is magnificent: a hand-sewn wetsuit with a beard of dyed rope, horns of steam-bent ash, and a fishtail of green neoprene scales, hundreds of them, each one glued on by hand. Far below, a dive tank is strapped to the base of the stack, its hose running to the brass whistle. Clipped to the creature’s belt, of all things, is a laminated county incident form.',
    ],
    afterMiss: [
      'The trap is a bust, and it turns out not to matter. By a few minutes past midnight, one way or another, the scrap crew is gone, their trucks taillights on the peninsula road, and nobody on that road is coming back tonight. At the top of the stack, the sea-goat leans over the rail, looks down at you, and does something no monster has ever done. It waits.',
      'You climb the forty rungs on shaking arms. It is sitting on the rest platform with its tail over the edge, beside a trail camera blinking red. Up close the costume is magnificent: a hand-sewn wetsuit, a beard of dyed rope, horns of steam-bent ash, and a fishtail of green neoprene scales, each one glued on by hand. Clipped to its belt, of all things, is a laminated county incident form.',
    ],
    choices: [
      {
        id: 'unmask',
        label: 'Pull back the hood and see who’s been punching in',
        text: 'You reach for the horns. The sea-goat lets you, and sighs like someone clocking out.',
        next: 'foreman',
      },
      {
        id: 'ask-whistle',
        label: 'Ask how a dead whistle blows with no power',
        text: 'You ask about the whistle instead. The sea-goat goes very still, then pulls off its own hood.',
        next: 'shift-change',
      },
      {
        id: 'climb-down',
        label: 'Climb down and let the night shift keep its secret',
        text: 'You climb down without a word. The sea-goat watches you all the way to the ground, then turns back to the bay and the plots it has guarded for months. Halfway to the car you hear the whistle once more, softly, like a shift being signed off.',
        ending: 'half-new',
      },
    ],
    leadLines: {
      mara: 'Mara counts the scales under her breath and stops at two hundred. “I charge by the hour. Whoever glued these would bankrupt me.”',
      kit: 'Kit sits on the rail beside the creature, legs swinging over a very long fall. “Nice climb. Truly. Your form is great.”',
      juniper:
        'Juniper flicks the scaled tail. “Fish below, goat on top. That’s everybody at the Green Ribbon Fair after midnight.”',
      cedar:
        'Cedar looks the costume up and down. “Half goat, half fish, all overtime. The sky made one of you a long time ago and quit. Somebody down here didn’t.”',
    },
    aloneLine:
      'Alone at the top, you and the sea-goat are just two people on a ledge in the wind, both of you out of breath.',
    recall: {
      'g1:fail':
        'The pier gave you almost nothing that first night. Up here, the evidence is all in one place, and it is breathing hard.',
      'g2:fail':
        'Without Dolores’s stories you have no name to put to the horns, only a stranger who knows this ladder better than you know your own stairs.',
    },
  },
  branches: {
    foreman: {
      title: 'The Foreman’s Daughter',
      place: 'The top of the mill smokestack',
      chapter: 3,
      scene: 'bay',
      body: [
        'Under the horns is a woman in her thirties with salt in her eyebrows and eelgrass in her ponytail: Tess Keough, marine biologist, the last foreman’s daughter. “My restoration grant comes up on the first,” she says. “Nine years of eelgrass under this pier, and the scrap crews drag copper right through it. The county won’t fence a pier until something documented happens on it. So I documented something.” She taps the incident form. “Forty-one reports. Three tows. One grown man crying. Dad says a job’s not done till it’s on the clock. I put a monster on the clock.”',
        'Then she looks down at the dead mill, and her voice changes. “Dad blew that whistle every working night for thirty-seven years. Now he’s on his sister’s couch in Yuma, and he still calls me at midnight so I can hold the phone up to the brass. Somebody has to keep the hours, he says.” She laughs, short. “He thinks I’m keeping them. I’m faking them for a grant committee.”',
      ],
      recall: {
        'g2:pass':
          'You half expected her. Walt Keough had one daughter, and the whole peninsula has been proud of her for years.',
      },
      choices: [
        {
          id: 'crew',
          label: 'Tell her the pier needs a real night watch, not a monster',
          text: 'You tell her about Dolores, and Jojo and her tow truck, and a whole street of people who still mow in stripes, who would stand on a pier at midnight for nothing if anyone asked. Tess laughs, then covers her face with a neoprene glove for a long moment.',
          ending: 'the-climb',
        },
        {
          id: 'rest',
          label: 'Tell her the footage worked and nobody needs to know',
          text: 'You tell her the pier is safe, the grant is as good as hers, and a monster is nobody’s business. Tess nods slowly, unbuckles the tail, and sets it on the platform like a lunchbox at the end of a double shift.',
          ending: 'whistle-stops',
        },
      ],
    },
    'shift-change': {
      title: 'The Shift Change',
      place: 'The top of the mill smokestack, midnight',
      chapter: 3,
      scene: 'bay',
      body: [
        '“It runs on compressed air,” says the woman under the hood: Tess Keough, marine biologist, daughter of Walt, the last foreman. “Dad’s whistle, my dive tank, a timer off a sprinkler system. Nothing spooky.” She frowns at her watch. “Except it blows a minute early. Every night, however I set it. Like it’s clearing the way for somebody else’s shift.”',
        'Then it is midnight, and below you a whistle blows that is not hers. The mill comes alive. Every window is lit, the yard is full of cars with fins, and the 1971 graveyard shift is filing in under the stack, lunch pails swinging, hard hats tipped back, every one of them looking up at you like you’re late. At the gate a skinny young man with a foreman’s clipboard puts two fingers in his mouth and whistles the same note as the brass. Tess grips the rail. “That’s Dad,” she whispers. “That’s Dad at twenty-four.”',
      ],
      recall: {
        'g3:whistle':
          'You stood beside that brass earlier tonight, one way or another, and your ears still have not entirely forgiven it.',
      },
      choices: [
        {
          id: 'answer',
          label: 'Pull the whistle line with her and answer him',
          text: 'Tess opens the valve by hand and you pull the line together, the cord running forty rungs down to the brass. The two whistles hold the note across fifty-five years, and at the gate the young foreman looks up, grins, and taps his watch.',
          ending: 'half-new',
        },
        {
          id: 'gather',
          label: 'Get Tess down and wake everyone who should see this',
          text: 'You climb down fast and start knocking on cottage doors. Dolores is already dressed. So, it turns out, is half the street. They heard two whistles tonight, and one of them was Walt’s.',
          ending: 'the-climb',
        },
      ],
    },
  },
  endings: [
    {
      id: 'the-climb',
      title: 'The Night Watch',
      tone: 'true',
      text: [
        'A little before one in the morning the old crew walks out onto the pier in bathrobes and work boots, Dolores at the front with a thermos and a clipboard. Tess has her phone on speaker, and from his sister’s couch in Yuma, Walt Keough calls the shifts the way he did for thirty-seven years. Everybody takes a turn on the chain. The whistle goes out over the black bay again and again, and across the water in Eureka, porch lights come on one at a time.',
        'Between pulls, Tess calls the county’s overnight line and, with the whole crew listening, reports one sea-goat, homemade, hers. Then she asks for the fence anyway. Dolores takes the phone and adds that the pier now has a night watch of eleven retirees and a tow truck, and that the county would be wise to believe them. When the chain comes around to you, Walt’s voice crackles out of the phone: “Pull like you mean it.” You do.',
      ],
    },
    {
      id: 'whistle-stops',
      title: 'The Whistle Stops',
      tone: 'bittersweet',
      text: [
        'The grant renews. The footage goes in an appendix nobody reads closely, the county fences the pier, and by fall the plots under it fill in thick and green. Tess gets the promotion down the coast she has been climbing toward for nine years. Before she leaves she carries the whistle to Dolores’s porch and hands it over in person. “Keep the hours?” Dolores does, for a while.',
        'The costume ends up in a box at the community hall, horns on top. Tess still calls her father at midnight from her new office, and for the first time there is nothing to hold up to the phone. Some nights, kids on the peninsula swear they see something with a tail on the old stack, watching the bay. But the whistle doesn’t blow anymore, and the cottages sleep straight through.',
      ],
    },
    {
      id: 'half-new',
      title: 'The Graveyard Shift',
      tone: 'strange',
      text: [
        'The night shift never fully clocks out. Someone works days at the lab and nights on the pier, and the whistle keeps blowing a minute before midnight, the way it must have when the mill ran on its own clock. Crab boats coming in late report a fish-tailed shape on the smokestack, and some nights every window in the dead mill lit up behind it.',
        'Dolores keeps a tally on her fridge. Some midnights, the crab boats count two figures on the stack, one with a tail and one with a lunch pail, and only one of them has a time card.',
      ],
    },
  ],
}
