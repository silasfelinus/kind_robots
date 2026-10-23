import type { Mystery } from '../types'

// Case VI. Seed: meticulous, analytical, service, perfectionism, harvest, quiet helpers.

export const VIRGIN_SACRIFICE: Mystery = {
  id: 'virgin-sacrifice',
  number: 6,
  sign: 'virgo',
  title: 'The Mystery of the Virgin Sacrifice',
  tagline:
    'Hooded figures, red ribbons, a harvest moon and one badly misunderstood word.',
  region: 'A private ridge up a side canyon off the Eel, above Rio Dell',
  hook: 'The email hit the campus list just before midnight: hooded figures with lanterns on a ridge above Rio Dell, red ribbons tied around things in the dark, and a plan for a virgin sacrifice at the harvest moon. It came from the president of the student paranormal club, who sent it from a gravel pullout below the ridge with every car door locked.',
  design: {
    element: 'earth',
    motif: 'grove',
    palette: { sky: '#16180e', ink: '#dcc788', glow: '#6f8a3a' },
    stars: [
      [10, 34],
      [24, 42],
      [36, 48],
      [46, 36],
      [52, 20],
      [46, 60],
      [50, 80],
      [62, 48],
      [76, 70],
      [88, 64],
      [80, 40],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 4],
      [2, 5],
      [5, 6],
      [3, 7],
      [7, 8],
      [8, 9],
      [7, 10],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. A cathedral grove of enormous old-growth redwoods on a ridge above the Eel River at night under an orange harvest moon, a ring of small brown-robed figures with lanterns circling the widest trunk, holding a long red ribbon between them like a measuring tape, red survey flagging knotted on the neighboring trunks, sword fern and redwood sorrel underfoot, the faint lights of a little mill town in the valley below. Faint brass stars in a gap of sky form an unlabeled long reclining-figure constellation. Moss green, umber and brass. No text, no letters, no logos.',
  provenance:
    'Scotia, Rio Dell and the Eel River are real. “Virgin timber” is a real historical logging term for never-cut old growth. Julia Butterfly Hill’s tree-sit in the redwood called Luna, near Stafford, lasted 738 days, from 1997 to 1999; it is mentioned only as history. Marbled murrelets are real seabirds that nest in old-growth canopy and are protected under endangered species laws, and conservation easements are a real land-protection tool. Gleaner Ridge is an invented private inholding up an invented side canyon, not any real property. Quillmark Land & Timber, the land trust and its contact Spencer Ault, the Sisters of the Understory, Brynn, Dusty and everyone else are invented. No real company, landowner, land trust or public filing is depicted.',
  decline: {
    label: 'Reply-all that the paranormal club can handle its own cult',
    text: 'You reply-all that you have a midterm and a strict policy on cults. Forty people reply-all asking to be taken off the list. Brynn’s last message, to you alone, says only “noted,” and you feel measured.',
  },
  gates: [
    {
      title: 'The Ribbon on the Mirror',
      place: 'A gravel pullout below Gleaner Ridge, Rio Dell',
      chapter: 5,
      scene: 'highway',
      message: {
        medium: 'email',
        from: 'Brynn, Paranormal Society president (self-appointed), to the entire campus list',
        lines: [
          'Subject: NOT A DRILL. Cult activity, Rio Dell. Please do NOT laugh.',
          'We saw them. Robes. Lanterns. Approx. eight. On the ridge up the side canyon above Rio Dell.',
          'One of them tied a RED RIBBON on my side mirror while we were IN THE CAR. I am at the gravel pullout. Anyone with a car and a spine, please come.',
        ],
      },
      body: [
        'Brynn’s hatchback is parked crooked at a gravel pullout where a side canyon meets the Eel above Rio Dell, the river sliding by below and a dark ridge rising above. Two club members sit in the back seat under one blanket. A red ribbon is knotted to the side mirror with a precision that is somehow worse than violence.',
        'Brynn hands you the evidence: a flyer peeled off a laundromat corkboard in Rio Dell. In tidy library-hand it reads: THE VIRGIN WILL BE TAKEN AT THE HARVEST MOON UNLESS EVERY ONE IS COUNTED. VOLUNTEERS WELCOME. BRING A PENCIL.',
      ],
      approaches: [
        {
          id: 'ribbon',
          label: 'Examine the ribbon like a crime scene',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'It is not ribbon. It is plastic survey flagging, the kind foresters buy by the case, and along its length, in pencil so small you need two phone lights, someone has written: R-114 · 271.3 · @1.37 · ok. Something measured nearly three meters across, at exactly chest height, and someone wanted a record that it was ok. Whatever this cult is sacrificing, it keeps immaculate notes.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You untie the ribbon for a closer look and the wind takes it straight over the guardrail toward the river. You and Brynn chase it down a blackberry bank in the dark. You catch the ribbon. The blackberries catch you. Climbing back up, scratched to the elbows, you notice a second ribbon on the guardrail, and a third, and you are too bloody to care.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'old-word',
          label:
            'Ask what “virgin” meant around here before it meant anything else',
          check: { skill: 'lore', target: 7 },
          success: {
            text: 'You call the only mill-town elder in your phone, a friend’s great-uncle who scaled logs for thirty years. He laughs for a full minute. “Virgin timber,” he says. “Virgin stand. Old growth nobody’s ever cut. Every faller in the county said it.” Then he stops laughing. “Isn’t much left that isn’t protected. Somebody’s up a ridge with lanterns? I’d bet you a beer there’s a stand up there nobody wrote down.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You look the word up on one bar of signal. The first result is a medieval manuscript. The second is olive oil. The third is a forum thread titled “cults of norcal: ranked,” which loads exactly far enough to frighten Brynn’s club into locking the car doors, with you still outside them.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'brynn',
          label: 'Calm Brynn down and take her statement properly',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You get Brynn breathing and walk her through it like a lab report. Eight figures. Brown robes, not black. Lanterns held low, moving slowly from tree to tree, with long pauses at each. And the one who tied the ribbon said, Brynn admits, “Excuse me, dear.” “Cults don’t say excuse me,” you point out. Brynn considers this. “The polite ones do,” she says, but she has stopped shaking.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You try to soothe Brynn by explaining that cults are statistically rare. Brynn hears only “statistically.” She produces a spreadsheet of Northern California cult sightings she has kept since ninth grade, and you go through it row by row while the lanterns on the ridge wink out one at a time.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara reads the flyer twice. “Every letter the same height. Nobody this tidy has ever sacrificed anything they didn’t alphabetize first.”',
        kit: 'Kit balances on the guardrail, squinting uphill. “Lanterns at knee height,” she says. “They’re not marching. They’re… stopping. A lot.”',
        juniper:
          'Juniper reads the flyer over your shoulder. “Bring a pencil,” she says. “Finally, a cult with standards. I’d join if the robes were better.”',
        cedar:
          'Cedar squints at the moon coming up orange. “Harvest moon, hooded cult, flyer with good penmanship. The universe is laying it on thick.” He snorts at the word “virgin” and won’t say why.',
      },
      aloneLine:
        'Alone at the pullout, you watch one lantern pause on the ridge for a very long time, as if someone up there is double-checking.',
    },
    {
      title: 'The Sisters on the Deer Trail',
      place: 'Gleaner Ridge, in the dark',
      chapter: 5,
      scene: 'grove',
      message: {
        medium: 'note',
        from: 'Pinned to a stump with a pushpin',
        lines: [
          'To the young people with the flashlights:',
          'Please keep to the deer trail. You are compacting the duff.',
          'Also, someone in a green jacket dropped a granola wrapper at R-87. We have it. — The Sisters',
        ],
      },
      body: [
        'Gleaner Ridge is a private inholding up the canyon, steep and quiet, mostly young redwood that grew back after the last century’s cuts. Past a locked gate and a long switchback the trees change. They get wider, older, absurd: trunks like the sides of barns, bark furrowed deep enough to lose a hand in. Every one has a red ribbon around it at exactly the same height.',
        'Mixed among them are trees tied with blue ribbon instead, spray-painted with numbers. Above you, lanterns move from trunk to trunk, and a woman’s voice says, very clearly, “Two hundred sixty-eight point four. Write it down, Bea.”',
      ],
      approaches: [
        {
          id: 'two-colors',
          label: 'Map the red ribbons against the blue ones',
          check: { skill: 'wits', target: 11 },
          success: {
            text: 'You sketch the grove by flashlight, trunk by trunk. Red ribbons sit at chest height, numbered in pencil, on every big tree. Blue ribbons sit lower with spray-painted numbers, and they follow a clean line along the contour, exactly where a skid road would go. Blue means somebody is marking these trees to be cut. Red means somebody else is racing them, one measurement at a time.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Your map is lovely and completely wrong, because you counted one tree twice, got turned around, and started again from a different trunk. A voice in the dark says, “You’ve done R-40 three times, dear,” and a hand in a brown sleeve takes your pencil, sharpens it with a tiny brass sharpener and gives it back.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'canopy',
          label: 'Name the bird calling from the canopy before dawn',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'Just before dawn a sharp, high keer, keer falls out of the canopy and something small and fast whirs over the grove toward the sea. You know it from a lecture you nearly slept through: a marbled murrelet, a seabird that nests on the broad mossy limbs of old-growth trees and commutes miles to the ocean to feed. Upslope, a robed figure writes it down with the time to the second. “Detection,” she whispers. “That’s four.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You confidently identify the call as an owl and hoot back. A robed woman with a clipboard materializes beside you, lowers your hand gently and says, “That was a seabird, dear, and now you’ve made it self-conscious.” The canopy stays silent for the rest of the morning, and the clipboard notes why.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'climb',
          label: 'Scramble uphill to catch a lantern-bearer',
          check: { skill: 'burly', target: 7 },
          cost: 'The ridge is steep, wet and paved with sword fern.',
          success: {
            text: 'You go straight up the fall line, fern to root to fern, and come out of the dark right beside a lantern. The figure holding it is about four foot eleven, in a brown hooded robe, with a diameter tape stretched around a trunk the size of a garage. She does not scream. She says, “Oh, good, a tall one. Hold this end.” You hold the end.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You go straight up the fall line, and the fall line takes it personally. You slide twenty feet back down on a mat of sword fern and land in a huckleberry bush in front of three robed figures, who look at you, look at each other, and then, in perfect unison, write something down.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara runs a fingertip along a red knot. “Same knot every time, same height every time. Best work I’ve ever seen done in the dark.”',
        kit: 'Kit looks up and up and up. “You could hang a whole circus off that first limb,” she says softly, “and it wouldn’t notice.”',
        juniper:
          'Juniper walks the deer trail barefoot and steps on your heel twice. “You’re compacting the duff,” she tells you, delighted. “They said so. In writing.”',
        cedar:
          'Cedar touches a blue ribbon and his face changes. “That’s a cut line. My dad flagged a hundred like it. My mom hauled supplies for the Luna sit to stop lines like it. They still do Thanksgiving together. Somehow.”',
      },
      aloneLine:
        'Alone among trees this old, you lower your voice without deciding to, the way you would in a library.',
      recall: {
        'g1:fail':
          'You came up the ridge with nothing to go on but a flyer and a club president who still thinks it is a cult. The trees do not seem to mind.',
      },
    },
    {
      title: 'The Harvest Moon',
      place: 'Gleaner Ridge, the eldest grove',
      chapter: 5,
      scene: 'grove',
      message: {
        medium: 'flyer',
        from: 'The Rio Dell laundromat corkboard, again',
        lines: [
          'HARVEST MOON. GLEANER RIDGE. MIDNIGHT TO DAWN.',
          'The eldest will be the last. Robes provided.',
          'No flash photography, please. She is very old.',
        ],
      },
      body: [
        'The harvest moon comes up orange over the Eel and turns the whole ridge the color of old brass. Brynn has rallied the entire paranormal club, four people and a ring light, and they have a plan, the classic one: catch the cult in the act, unmask the leader, post it before breakfast.',
        'In the eldest grove the lanterns gather around one tree, the widest you have ever seen, older than every building in the county put together. Robed figures circle it holding a long red ribbon between them. Down the slope, headlights grind up the logging road: a pickup too clean to be local, with a magnetic sign on the door, QUILLMARK LAND & TIMBER.',
      ],
      approaches: [
        {
          id: 'robe',
          label: 'Borrow a spare robe and join the procession',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'Spare robes sit on a stump, folded with hospital corners. You put one on and fall into line. The woman beside you, without looking, hands you the ribbon and murmurs, “Keep it level, dear, we’re doing the girth.” Nobody unmasks you, because nobody here is wearing a mask. They just need hands. By the time the circle closes, you understand: the ribbon is a tape measure, and the only thing being sacrificed tonight is sleep.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You put the spare robe on inside out and backwards and join the procession with the hood over your face. You walk directly into the eldest tree. Eight robed women stop, turn and help you up with enormous tenderness, and one of them says, “Oh, it’s the granola wrapper,” and you will never, ever live this down.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'box',
          label: 'Spring the club’s classic trap on the trail',
          check: { skill: 'burly', target: 9 },
          cost: 'It is a refrigerator box, a stick and a string. Brynn insists that is the classic.',
          success: {
            text: 'You prop the box on the stick across the deer trail and bait it with a fresh pack of sharpened pencils, because the flyer said to bring one. Forty minutes later somebody kneels for a pencil, you yank the string, and the box comes down on not a hooded cultist but a man in a high-vis vest with a clipboard and a can of blue spray paint: a timber cruiser for Quillmark, counting the same trees from the other side. From inside the box, as robed women gather around it, he says, “Ladies. Again?”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Brynn sits on the string. The box comes down early on the club’s cooler and its treasurer, in that order. The robed women spend twenty minutes extracting the treasurer with great tenderness while the Quillmark pickup grinds past on the logging road, its headlights sweeping over the whole embarrassing tableau. Then they walk everybody up to the circle so nobody gets lost.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'audit',
          label:
            'Check the company’s blue numbers against the Sisters’ red ones',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'You compare a blue tree’s spray-painted number to the pencil tag on the same trunk. The blue number is a rough bid estimate, generous to the saw. The red tag is a measurement to the centimeter, plus a note: moss mat 9 cm, platform limb, murrelet detection 4:51 a.m. The land company is counting board feet. The Sisters are counting everything else.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You compare numbers until the moon is overhead before realizing you have been reading the blue ones upside down. Eighty-six was ninety-eight. A robed woman behind you has been quietly correcting your sums for an hour, and now hands you the fixed page without a word, along with a cough drop.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara watches the circle with professional respect. “A procession that tidy took rehearsals. Whoever runs this would make a terrifying studio manager.”',
        kit: 'Kit is halfway up a neighbor tree with a headlamp. “From here it looks like they’re hugging it,” she calls. “They’re measuring it. Both, maybe.”',
        juniper:
          'Juniper has a red ribbon in her hair, and you did not see anyone give it to her. “I asked nicely,” she says. “You should try it sometime.”',
        cedar:
          'Cedar eyes the Quillmark pickup. “Not a scratch on it,” he says. “Nobody local drives up here on a full moon with a clean truck.”',
      },
      aloneLine:
        'Alone under the eldest tree, you feel very small, very young and very much like someone is about to ask you for a pencil.',
      recall: {
        'g2:canopy':
          'A robed woman with a clipboard nods to you as she passes. She remembers you from the seabird, and so, apparently, does the seabird.',
      },
    },
  ],
  coldCase: {
    title: 'The Ridge Goes Quiet',
    place: 'Rio Dell, the laundromat corkboard',
    chapter: 5,
    scene: 'highway',
    body: [
      'The harvest moon wanes and the lanterns stop. A month later a fresh road scar shows on Gleaner Ridge from the highway, and the blue-flagged trees are gone. Nobody on campus talks about the cult anymore. Brynn has moved on to a sea-lion poltergeist.',
      'On the laundromat corkboard, someone has pinned one last note in library-hand: Thank you to the young people who tried. We counted 371 of 412. It was not enough. It was something.',
    ],
    choices: [
      {
        id: 'wrist',
        label: 'Keep the red ribbon from Brynn’s mirror',
        text: 'You tie it around your wrist. On damp mornings the pencil numbers on it seem to have changed, very slightly, as if something is still growing.',
        effects: { weird: 1 },
      },
      {
        id: 'sign-up',
        label: 'Sign up for the next survey anyway',
        text: 'You write your name under the note. Three days later a postcard arrives: Tuesday, 5 a.m. Wear socks you do not mind losing.',
        effects: { goodwill: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Sisters of the Understory',
    place: 'Gleaner Ridge, under the eldest tree',
    chapter: 5,
    scene: 'grove',
    body: [
      'The circle stops. All eight robed figures turn toward you in the lantern light, and eight retired women lower their hoods. The tallest has close-cropped white hair, a pencil behind each ear, and the posture of a woman who once spent a long time kneeling and now declines to. “Agnes Whitcomb,” she says. “Formerly Sister Agnes. These are the Sisters of the Understory: retired librarians, mostly; Dr. Raman, our botanist, who has not let go of that padded case all night; and Ofelia, who taught fourth grade and frightens all of us. The robes are so nobody asks whether we have a permit. We are too old to sit in a tree for seven hundred and thirty-eight days, the way that young woman did in Luna, so we brought tape measures. And before you ask, “virgin stand” is the correct term. Bea wrote the flyer. Bea has never been on the internet.” Behind you, Brynn’s ring light clicks off, slowly, out of respect.',
      '“Quillmark bought this ridge from an out-of-county estate last year,” Ofelia says. “If we prove the stand is old growth with nesting birds, measured tree by tree, the land trust can buy an easement before the harvest goes through. Our contact there, Spencer, takes every number to the board. Our deadline is sunrise.” She looks up at the eldest tree. “My father was a faller for forty-one years. At the end, in the hospital, he asked me how many of the big ones were left. Nobody could tell him. So we are counting. Every one. So the next time somebody asks, there is an answer.”',
    ],
    afterMiss: [
      'Your plan for the night has failed in every particular, and it turns out not to matter at all. The circle stops anyway. All eight robed figures turn toward you in the lantern light, and eight retired women lower their hoods. The tallest has close-cropped white hair, a pencil behind each ear, and the posture of a woman who once spent a long time kneeling and now declines to. “Agnes Whitcomb,” she says. “Formerly Sister Agnes. These are the Sisters of the Understory: retired librarians, mostly; Dr. Raman, our botanist, who has not let go of that padded case all night; and Ofelia, who taught fourth grade and frightens all of us. The robes are so nobody asks whether we have a permit. And before you ask, “virgin stand” is the correct term. Bea wrote the flyer. Bea has never been on the internet.” Behind you, Brynn’s ring light clicks off, slowly, out of respect.',
      '“Quillmark bought this ridge from an out-of-county estate last year,” Ofelia says. “If we prove the stand is old growth with nesting birds, measured tree by tree, the land trust can buy an easement before the harvest goes through. Our contact there, Spencer, takes every number to the board. Our deadline is sunrise.” She looks up at the eldest tree. “My father was a faller for forty-one years. At the end, in the hospital, he asked me how many of the big ones were left. Nobody could tell him. So we are counting. Every one. So the next time somebody asks, there is an answer.”',
    ],
    recall: {
      'g1:fail':
        'Brynn leans over and whispers that she still thinks it is a cult. Ofelia hears her and looks extremely pleased.',
      'g2:fail':
        '“We have watched you blunder about our ridge,” Agnes adds, kindly. “You improved. We wrote that down too.”',
    },
    choices: [
      {
        id: 'tape',
        label: 'Pick up a diameter tape and start counting',
        text: 'You take a clipboard. Ofelia hands you a pencil she has already sharpened.',
        next: 'the-count',
      },
      {
        id: 'headlights',
        label: 'Find the Quillmark cruiser and ask what he’s counting',
        text: 'You go looking for the man with the blue paint, with your hands where everyone can see them.',
        next: 'the-cruiser',
      },
      {
        id: 'core',
        label: 'Ask Dr. Raman what is in the padded case',
        text: 'Dr. Raman hesitates, then opens the case: a thin rod of wood in a labeled sleeve, a core drawn from the eldest tree.',
        ending: 'ring-for-next-year',
      },
    ],
    leadLines: {
      mara: 'Mara has already borrowed a clipboard. “I’ve wanted to join a cult like this my whole life,” she says, and means it.',
      kit: 'Kit is up the first limb with the end of a tape. “Call it,” she says. “I can reach what you can’t.”',
      juniper:
        'Juniper isn’t counting. She is sitting in the eldest tree’s roots with her eyes shut. “I’m not here for the survey,” she says. “I’m visiting. She’s family, more or less.”',
      cedar:
        'Cedar looks up at the eldest tree. “My mom’s going to love you ladies. My dad’s going to argue with you all night and then carry your gear. The universe put those two together on purpose. I figure it owes this tree one.”',
    },
    aloneLine:
      'Alone with eight retired women and a very old tree, you realize you have stopped being scared and started being useful.',
  },
  branches: {
    'the-count': {
      title: 'Four Hundred and Twelve',
      place: 'Gleaner Ridge, until sunrise',
      chapter: 5,
      scene: 'grove',
      body: [
        'You measure until your fingers go numb. Breast height, one meter thirty-seven off the uphill side, tape level, read it twice, call it out. Bea writes it down. Dr. Raman checks every tenth tree behind you and corrects you twice, gently, and then not at all. The Sisters work like a choir: no wasted motion, no raised voices, a thermos of tea passed down the line every hour on the hour.',
        'By the gray before dawn two trees remain: one across a ravine, and the eldest herself. The circle took her girth at midnight, but only once, and the Sisters do not record a number they have read only once. The land trust’s rule is simple: a census with a hole in it is a guess. Bea’s phone buzzes. It is Spencer, asking for the numbers “before anyone else sees them, so I can tidy them up.” Agnes frowns for the first time all night. Down the slope, a truck door slams.',
      ],
      choices: [
        {
          id: 'both',
          label: 'Split the crew and measure both before sunrise',
          text: 'You send the fastest Sisters across the ravine and take the eldest yourself, three tapes knotted end to end and every hand holding a section. Agnes decides the binder goes to the board by hand, hers, untidied.',
          ending: 'every-tree-counted',
        },
        {
          id: 'eldest-only',
          label: 'Measure only the eldest, perfectly',
          text: 'You choose the eldest and measure her three times. The ravine tree goes unrecorded, and the sun comes up.',
          ending: 'one-tree-saved',
        },
      ],
    },
    'the-cruiser': {
      title: 'The Man With the Blue Paint',
      place: 'The logging road below the grove',
      chapter: 5,
      scene: 'highway',
      body: [
        'The timber cruiser is a Rio Dell guy named Dusty Oyelaran, thirty-four, two kids, a high-vis vest and the exhausted face of someone who has been counting the same trees as eight retired women for a month. By now he has been offered tea by six of them. “I grew up down there,” he says, nodding at the lights of Rio Dell. “This job’s the job there is. I flag what they tell me.”',
        'He lowers his voice. “You know your Sisters’ numbers come to our office every week? Their trust guy, Spencer, sends them over before his own board sees them, and our office sends him a check. Finder’s fee. That’s how we knew which trees to flag first.” He holds out a tablet with a cracked screen: his own honest cruise, and beside it the summary Spencer gave the trust’s board, every big tree rounded down to second growth. “They’ve been measuring for the wrong side,” he says. “Somebody ought to tell them.”',
      ],
      choices: [
        {
          id: 'compare',
          label: 'Put his numbers beside the Sisters’ and go around Spencer',
          text: 'You sit Dusty and Bea side by side on a stump, and two people who were supposed to be enemies compare columns until every number matches to the centimeter. Dusty signs the bottom of every page. Agnes, very quietly, crosses Spencer’s name off the cover.',
          ending: 'every-tree-counted',
        },
        {
          id: 'protect-him',
          label: 'Tell him to keep his job and let the Sisters handle it',
          text: 'You thank him and tell him not to risk it. He looks relieved and ashamed in equal measure, and walks back to his truck. You carry the news about Spencer up the hill alone, too late to matter by much.',
          ending: 'one-tree-saved',
        },
        {
          id: 'no-paint',
          label: 'Ask why the eldest tree has no blue ribbon',
          text: 'Dusty shrugs. “Tried to flag her three times. Paint won’t stick. Ask your botanist about her core.” You do.',
          ending: 'ring-for-next-year',
        },
      ],
    },
  },
  endings: [
    {
      id: 'every-tree-counted',
      title: 'Every Tree Counted',
      tone: 'true',
      text: [
        'Four hundred and twelve trees, measured to the centimeter, with seven murrelet detections and a botanist’s signature on every page. The Sisters carry the binder to the land trust’s board themselves, by hand, and by spring Quillmark has sold a conservation easement on all of Gleaner Ridge for a sum that makes it feel clever. The trees never notice.',
        'The Sisters throw a potluck in a community hall in Rio Dell. Brynn’s club attends in robes. You are given one too, brown, hemmed precisely to your height by someone who never asked it, with a pencil sewn into the sleeve. Ofelia reads the final count aloud and then, softly, adds her father’s name at the bottom of the list.',
      ],
    },
    {
      id: 'one-tree-saved',
      title: 'One Tree Saved',
      tone: 'bittersweet',
      text: [
        'The count comes up short. The harvest goes ahead on most of the ridge, and for a month the log trucks grind down through Rio Dell with loads you cannot look at. But the eldest tree, with a murrelet nest on a limb as broad as a sidewalk, stands in a buffer the company is required to leave, and the trees nearest her stand with her.',
        'Every harvest moon the Sisters climb the ridge to measure her again, and every year she is a few millimeters wider. You go with them. Ofelia lets you hold the tape. On the way down nobody says much, because there is a great deal of open sky where there didn’t used to be.',
      ],
    },
    {
      id: 'ring-for-next-year',
      title: 'The Ring for Next Year',
      tone: 'strange',
      text: [
        'Dr. Raman’s core, a pencil of wood drawn from the eldest tree last spring, should end at the bark. It doesn’t. Past the bark line there is one more ring, a fat pale one that looks like a good year for everybody, and inside it the faint dark line of a fire that hasn’t happened yet. She has counted it nine times. The newest ring is for next year.',
        'The Sisters, being who they are, catalog it. It sits in a labeled tube in the back room of a small-town library, filed under next year’s date. Whatever happens to Gleaner Ridge, the eldest tree seems sure she will be standing to grow that ring. Every few months you go and count again. There is always one more.',
      ],
    },
  ],
}
