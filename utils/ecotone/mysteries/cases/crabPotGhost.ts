import type { Mystery } from '../types'

// Case IV. Seed: home, shell, protection, mothering, memory, moodiness.

export const CRAB_POT_GHOST: Mystery = {
  id: 'crab-pot-ghost',
  number: 4,
  sign: 'cancer',
  title: 'The Mystery of the Crab Pot Ghost',
  tagline: 'A ghost in yellow oilskins delivers dinner to the dark windows.',
  region: 'King Salmon, Fields Landing and Buhne Point on Humboldt Bay',
  hook: 'Somebody in yellow oilskins is pulling crab pots in the fog off Buhne Point at four in the morning, and full pots keep turning up on King Salmon porches, once inside a locked living room, weeks before the season opens. The old-timers say the only crabber who ever dressed like that is dead. The crabs are very much alive.',
  design: {
    element: 'water',
    motif: 'crab-pot',
    palette: { sky: '#05212b', ink: '#dcefe9', glow: '#3aa8a1' },
    stars: [
      [46, 12],
      [50, 32],
      [53, 47],
      [36, 82],
      [74, 78],
      [42, 40],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [2, 4],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. A weathered wooden crab boat moored in a foggy Humboldt Bay slough at dawn, geraniums in a coffee can on the wheelhouse roof, woodsmoke curling from a tiny stovepipe, the low houses of King Salmon behind with every porch light glowing. In the foreground a round steel crab pot sits on a wet porch step, its steel ribs and mesh echoing a crab’s shell, a yellow oilskin coat hung on the rail beside it. Faint pearl stars above the fog form an unlabeled small inverted-Y constellation. Deep teal, abyss blue and pearl. No text, no letters, no logos.',
  provenance:
    'King Salmon, Fields Landing and Buhne Point are real places on Humboldt Bay. Humboldt Bay is widely reported to have some of the fastest relative sea-level rise on the West Coast, and low-lying King Salmon is among the areas studied for flood risk. Dungeness crab is a real local fishery with separate sport and commercial seasons. Ione and Arne Sorensen, the Moon Snail, Teo, Graciela, Royce and every household are invented. No real boatyard, harbor office or landlord is depicted.',
  decline: {
    label: 'Tell Teo to call a crab person, not you',
    text: 'You text back a crab emoji and “that’s above my pay grade.” Teo replies, “u don’t have a pay grade.” Somewhere in King Salmon, a porch light stays on all night for a delivery you will never see.',
  },
  gates: [
    {
      title: 'Eleven Crabs on the Good Rug',
      place: 'King Salmon, the blue house past the bait shop',
      chapter: 3,
      scene: 'bay',
      message: {
        medium: 'text',
        from: 'Teo (marine bio lab partner)',
        lines: [
          'are u up. emergency. crustacean emergency',
          'there is a crab pot in my abuela’s LIVING ROOM. full. alive. on the good rug',
          'she says the ghost left it. king salmon, blue house past the bait shop. bring a cooler',
        ],
      },
      body: [
        'King Salmon sits on the bay so low that the high tide always seems to be thinking about coming in the front door. Teo’s grandmother, Graciela, sits in her recliner beside a steel crab pot that holds eleven furious Dungeness and drips onto a rug she has owned since the Carter administration. The front door was locked all night. The pot is still cold from the water.',
        '“A man in yellow,” Graciela says. “I saw him in the fog off Buhne Point at four this morning, pulling pots like it was 1970. Then I went back to bed and he’d made a delivery.” The buoy tied to the pot is hand-painted. On the windowsill someone has left a wet thumbprint and a folded stick of spearmint gum.',
      ],
      approaches: [
        {
          id: 'neighbors',
          label: 'Knock on the doors that got crabs too',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You work the street with a cooler and your most trustworthy face. Six houses got pots this month. Every one of them, once you sit at the kitchen table long enough, admits the same thing quietly: the rent went up when the new owner bought the block, and the fridge has been mostly mustard since. “Whoever it is,” says a retired welder named Royce, wiping his eyes and blaming the onions, “they know exactly who’s hungry. That’s not a ghost. That’s a neighbor.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The third door you knock on belongs to a man who is sure you work for the new landlord. He films you on his phone and narrates, at length, for an audience of one cousin in Fresno. By the time you have explained that you are a college student investigating a crab ghost, the explanation has made everything worse, and the whole street has closed its curtains.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'frog',
          label: 'Work out how a crab pot got through a locked door',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'No forced lock, no wet track on the front porch. The drips start on the back step, beside a ceramic frog with a missing toe. The spare key under the frog is damp and smells of bait and diesel. Graciela stares at it. “Nobody knows about the frog,” she says. “Nobody except people who’ve lived on this street forty years.” Whoever the ghost is, it has been a neighbor much longer than the landlord.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You test your locked-room theory on the front door with a bobby pin and a confidence you have not earned. The bobby pin snaps off inside. Graciela has to call her nephew the locksmith, who arrives in pajama pants, fixes it in ninety seconds, and charges you forty dollars and one crab, which he selects with insulting care.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'oilskins',
          label: 'Ask the old-timers at the bait counter about yellow oilskins',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'The old men at the bait counter go quiet the way men do when you say a name they used to say every day. The old buttoned-hood oilskins in that yellow haven’t been sold around here in years. Only one boat on the bay still crewed in them: the Moon Snail, Arne Sorensen’s boat. “Arne passed two winters back,” says the man at the register. “Boat’s been sitting off Fields Landing waiting on the scrapper.” A pause. “His wife made the best chowder on the bay.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The old men at the bait counter adore you instantly and tell you everything they know: oilskins, rubber boots, the 1964 flood, a cousin who caught a halibut the size of a door, and why your generation can’t tie a bowline. Three hours later you can tie an excellent bowline. You know nothing whatsoever about the ghost.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara crouches by the buoy and reads the lettering like a signature. “Hand-painted, sign-painter style. Nobody under seventy letters like that anymore.”',
        kit: 'Kit lifts the pot one-handed to read the drip pattern and sets it down gently. “It came in the back. Somebody strong, or somebody who knows exactly how this house opens.”',
        juniper:
          'Juniper kneels and murmurs to the crabs until they stop clicking. “They’re not scared,” she says. “Someone kind put them in there.”',
        cedar:
          'Cedar sniffs the windowsill. “Old diesel and spearmint gum. That’s an old-timer, or an old boat, or both.”',
      },
      aloneLine:
        'Alone with eleven crabs and a grandmother, you feel watched by everyone in the room, and the crabs have the most opinions.',
    },
    {
      title: 'The Boat That Waters Its Geraniums',
      place: 'Fields Landing, the slough behind the boatyard',
      chapter: 3,
      scene: 'marsh',
      message: {
        medium: 'radio',
        from: 'Marine channel, 2:14 a.m., relayed by Teo',
        lines: [
          'Teo: “GUYS my scanner just picked this up”',
          '“…Moon Snail, Moon Snail. Pots are pulled. Six for the dark windows.”',
          'Static, then someone humming an old waltz, too worn to tell man from woman.',
        ],
      },
      body: [
        'The boatyard at Fields Landing is a graveyard for hulls: skiffs with grass growing in them, a tug sinking slowly into its own cradle. But at the end of a crooked dock in the slough behind it, half hidden in cordgrass, floats a thirty-eight-foot wooden crab boat. MOON SNAIL, says the stern, hand-lettered. A red tag zip-tied to her rail reads DERELICT VESSEL: SCHEDULED FOR REMOVAL. A thread of woodsmoke rises from her stovepipe, and somebody has watered the geraniums in the coffee can on the wheelhouse roof.',
        'Then the fog moves, and for one breath the boatyard isn’t there. The slough runs straight into a King Salmon where the streets are water and the houses stand on stilts, and the Moon Snail is tied to somebody’s porch rail with the same geraniums on top. The fog closes. Aboard, someone turns off a lamp.',
      ],
      approaches: [
        {
          id: 'dock',
          label: 'Sit on the dock and wait for whoever is aboard',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You sit on the cold dock with your feet over the water and do nothing, which is harder than it sounds. After forty minutes, a voice behind the wheelhouse door says, “You’re letting the cold into your bones, sitting like that.” Nobody comes out. But a hand sets a thermos on the rail, and then a second cup. The coffee is perfect. The cup has a lopsided painted snail on it, the kind a kid makes in pottery class and a parent keeps for fifty years.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You last eleven minutes before your phone buzzes: Teo, asking if you have died. The lamp aboard stays dark. When you creep to the rail, the wheelhouse is locked, the stovepipe is cold, and a note is tucked under a cleat: GO HOME, IT’S LATE, PUT ON A HAT. It is the most motherly threat you have ever received.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'logbook',
          label: 'Read the boat’s history in the yard’s old logbook',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'The yard office is open because the lock rusted open in 2011. In a logbook going back to the sixties, the Moon Snail is on every other page: hauled out, painted, put back in, always signed A. & I. Sorensen. The last entry, two winters ago, is in one hand only, shakier than the rest: “Arne gone. Boat stays in till I say.” Beside the removal date someone has written, very neatly, “No.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You find the logbook under forty years of tide tables and open it just as a gust comes off the slough. An entire decade of pages lifts out and scatters across the mudflat. You spend an hour retrieving 1987 from a great blue heron, who does not want to give it back and makes that extremely clear.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'skiff',
          label: 'Row a borrowed skiff out to look under her stern',
          check: { skill: 'burly', target: 7 },
          cost: 'The skiff’s oarlocks squeal like a gull with a grievance.',
          success: {
            text: 'You row out with your heart in your teeth. Under the Moon Snail’s stern, clean and new, hangs a string of pots on fresh line, every buoy painted the same yellow as the ghost’s oilskins. Each buoy carries a house number in tiny tidy letters: 14, 22, 9, 31. King Salmon addresses. This is not a haunting route. It is a delivery route, and somebody has worked it out very carefully.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'The skiff has a leak nobody mentioned. Halfway out you are rowing a bathtub. You make it back to the dock ankle-deep and squelching, and someone aboard the Moon Snail, unseen, laughs once, a warm, raspy laugh, and calls across the water, “Bail with your left hand, honey, and row with your back.”',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara points at the stern lettering. “Same hand as the buoy at Graciela’s. One person, a lot of years, a very steady brush.”',
        kit: 'Kit tests a mooring line and frowns. “This knot was retied this morning. Somebody lives here, and they’re good at it.”',
        juniper:
          'Juniper watches the geraniums. “Nobody waters flowers on a boat they’re leaving,” she says.',
        cedar:
          'Cedar’s CB crackles in his pocket with a tide report for a street that isn’t a street yet. He switches it off without a word, which is how you know it scared him.',
      },
      aloneLine:
        'Alone in the boatyard, you hear the Moon Snail creak against her lines like something breathing in its sleep.',
    },
    {
      title: 'The Last Haul Off Buhne Point',
      place: 'Buhne Point, before dawn',
      chapter: 3,
      scene: 'beach',
      message: {
        medium: 'flyer',
        from: 'Stapled to a piling at Fields Landing',
        lines: [
          'NOTICE OF DERELICT VESSEL REMOVAL: MOON SNAIL.',
          'Vessel to be towed and broken for scrap Friday, 8 a.m.',
          'Under it, in pencil, small and neat: Last haul Thursday. Leave your porch lights on.',
        ],
      },
      body: [
        'Thursday, four in the morning. Buhne Point is a fist of rock and riprap holding off the bay, and the fog sits on it so thick the channel lights look underwater. Every porch light in King Salmon is on. Word got around. Graciela and Royce and half the street sit on their steps in bathrobes, waiting for a ghost.',
        'Out on the water an engine coughs, catches and settles into an old diesel’s heartbeat. A light comes toward the point. If you are going to meet the crabber in yellow oilskins before the scrapper does, it has to be now.',
      ],
      approaches: [
        {
          id: 'casserole',
          label: 'Leave a hot dinner and a note on the last porch',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You and Graciela build the fastest casserole in King Salmon history and leave it on the last dark porch with a note in your best handwriting: WE KNOW YOU’RE HUNGRY TOO. Twenty minutes later a figure in yellow climbs the steps with a pot on one hip, reads the note, and sits down hard on the top step. It does not run. It eats, slowly, with a fork, in the fog, and you walk up and sit beside it.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The casserole is excellent. The note, written in a hurry, says WE KNOW in letters so large that in the fog it reads as a threat. The figure in yellow reads it, sets down the crab pot with enormous dignity and backs into the fog. In the morning the dish is on Graciela’s porch, washed and dried, with a better recipe tucked under the lid.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'wade',
          label: 'Wade out off the point to meet the boat',
          check: { skill: 'burly', target: 9 },
          cost: 'The bay in autumn is the temperature of regret.',
          success: {
            text: 'You wade until the water is at your ribs and the cold is a fist around your chest. The Moon Snail’s bow looms out of the fog, and a figure in yellow leans over the rail with a boathook, braced for a sea monster, and finds a shivering college student instead. “Oh, for heaven’s sake,” says the ghost, in a voice that has scolded a great many children, and hauls you aboard like a full pot.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You step into a hole only the bay knew about. You go under, come up spluttering, and are dragged ashore by the collar by a figure in yellow who vanishes back into the fog without a word. You are left on the riprap wrapped in a wool blanket that smells of woodsmoke, next to a small crab pot with a tag that reads FOR THE DROWNED RAT.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'route',
          label: 'Stake out the next house on the buoy route',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'You lay the painted buoy numbers over a map of the street and the route snaps into order: bayside to inland, oldest neighbor to newest arrival. Number 31 is next. You crouch behind its hydrangea. At 4:40 a figure in yellow comes up the walk with a pot on one hip, finds the spare key under the mat without looking, and freezes when your flashlight catches the hood.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You count the route wrong and stake out number 13, which the ghost skips because the man who lives there is doing fine, thank you, and owns a motion light and a small loud dog. The dog finds you. The man finds you. Two houses down, the ghost finishes the route in peace.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara has drawn a tiny yellow raincoat on her wrist in ballpoint. “If this goes wrong, at least it’s documented.”',
        kit: 'Kit is on the roof of Graciela’s carport, crouched like a gargoyle. “From up here the boat’s light looks like it’s coming in from two directions,” she says, and doesn’t explain.',
        juniper:
          'Juniper stands barefoot in the shallows. “The water’s higher here every year,” she says. “It remembers when this was all marsh.”',
        cedar:
          'Cedar brought a second thermos for the ghost. “Whoever it is has been up since two,” he says. “That’s just manners.”',
      },
      aloneLine:
        'You wait alone in the fog with every porch light on behind you, and for once the whole street is on your side.',
    },
  ],
  coldCase: {
    title: 'The Moon Snail Goes to the Cutter',
    place: 'Fields Landing, Friday',
    chapter: 3,
    scene: 'bay',
    body: [
      'Friday at eight, a tow arrives at the slough. The Moon Snail is empty: stove cold, bunk stripped, geraniums gone. The scrapper’s crew takes her apart in an afternoon, and the old planks smell of sixty years of bait and coffee as they split.',
      'The crab pots stop coming. On Graciela’s porch the last one sits empty and scrubbed clean, with a brass crab gauge tied to the handle. Nobody in King Salmon knows where the ghost went. Everybody leaves their porch light on a little longer, just in case.',
    ],
    choices: [
      {
        id: 'gauge',
        label: 'Keep the brass crab gauge',
        text: 'You hang it by your door. On foggy mornings it is cold and wet to the touch, as if somebody just measured something with it.',
        effects: { weird: 1 },
      },
      {
        id: 'porch-fridge',
        label: 'Start a porch fridge for the street',
        text: 'You and Teo put a secondhand fridge on Graciela’s porch with a sign that says TAKE WHAT YOU NEED. By winter it is full every morning. Nobody admits to filling it.',
        effects: { goodwill: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Crabber in Yellow',
    place: 'Aboard the Moon Snail, off Buhne Point',
    chapter: 3,
    scene: 'bay',
    body: [
      'The hood comes back. Under the yellow oilskins is a woman of seventy-eight with a white braid tucked into her collar, a face like a weathered dock piling, and very bright, very tired eyes. “Ione Sorensen,” Graciela says from the shore, and her voice cracks. “Ione. We thought you went to your sister’s in Oregon.”',
      '“I told everyone that,” Ione says. “When Arne died the house sold out from under me and the rent doubled, and the boat was supposed to go for scrap to pay what we owed. So I moved aboard. Arne always said the first haul of the season goes to the house with the dark windows. Well. This year there were a lot of dark windows.” She measures a crab with a brass gauge, gently, and drops it back in. “Every one legal on the sport limit, before you ask. I’m only illegal about where I sleep.” Then, quieter: “If they find out I live here, I lose the last home I have.”',
    ],
    choices: [
      {
        id: 'see-home',
        label: 'Ask to see her home',
        text: 'You ask, the way you would ask anybody, if you can see her place. Ione hesitates, then opens the wheelhouse door.',
        next: 'aboard',
      },
      {
        id: 'call-street',
        label: 'Call the whole street down to the dock',
        text: 'You turn and wave both arms at the shore. Porch lights blink. Bathrobes start down the steps.',
        next: 'porch-council',
      },
      {
        id: 'cast-off',
        label: 'Lift her lines and let her go into the fog',
        text: 'You lift her lines off the cleat and hand them aboard. Ione looks at you for a long moment, nods once, and puts the Moon Snail in gear.',
        ending: 'moored-in-tomorrow',
      },
    ],
    leadLines: {
      mara: 'Mara drapes her jacket over Ione’s shoulders without asking. “You’re soaked. Argue with me later.”',
      kit: 'Kit is already coiling the pot lines the way Ione had them. “Tell us what needs hauling. We’re strong and we work for chowder.”',
      juniper:
        'Juniper looks at the geraniums, then at you. “Home is wherever somebody waters the flowers,” she says.',
      cedar:
        'Cedar lays a hand on the Moon Snail’s rail like he is checking a horse. “She’s sound,” he says, surprised. “Somebody’s kept her sound.”',
    },
    aloneLine:
      'With nobody beside you, it is just you and Ione and the fog, and she looks at you like a grandmother deciding whether you have eaten.',
  },
  branches: {
    aboard: {
      title: 'The Moon Snail’s Galley',
      place: 'Aboard the Moon Snail',
      chapter: 3,
      scene: 'bay',
      body: [
        'The wheelhouse is a whole life in eighty square feet: a woodstove the size of a breadbox, a bunk under a quilt patched from old oilskins, Arne’s reading glasses still folded on the chart table, a calendar from two years ago that nobody has turned. A rack by the stove holds exactly one mug, the lopsided painted snail.',
        'Ione gives the tour like any proud homeowner, which is what she is. “The bay comes up a little every winter,” she says. “The low streets flood on a king tide now. Me, I just float.” She laughs, and then she doesn’t. “It’s not a good place to get old. But it’s mine.”',
      ],
      choices: [
        {
          id: 'mooring',
          label: 'Find her a legal mooring, tonight',
          text: 'You get out your phone and start calling everyone Ione has ever fed. It turns out to be most of King Salmon, and all of them are awake.',
          ending: 'home-port',
        },
        {
          id: 'one-more-string',
          label: 'Help her pull one last string of pots',
          text: 'You pull on borrowed boots and haul until your arms shake while Ione steers and tells you about every house on the route.',
          ending: 'last-haul',
        },
      ],
    },
    'porch-council': {
      title: 'The Porch Council',
      place: 'The little dock at King Salmon, dawn',
      chapter: 3,
      scene: 'bay',
      body: [
        'By six there are thirty people on the little dock in bathrobes and rubber boots, and the crab pot from Graciela’s living room has been carried down to serve as a coffee table. Royce brought donuts. Teo is taking minutes on his phone, badly.',
        '“She fed us all winter,” Graciela tells the crowd, “and not one of us noticed she was hungry too.” Nobody speaks for a while. Past Buhne Point the fog thins, and for a second the street behind you looks very wet, as if the tide has come all the way in to stay. Then it doesn’t.',
      ],
      choices: [
        {
          id: 'pass-the-pot',
          label: 'Pass the crab pot around for slip fees',
          text: 'You turn the pot upside down and hold it out. It comes back full: cash, two checks, an IOU, a pie, and Royce’s promise to weld anything Ione needs for life.',
          ending: 'home-port',
        },
        {
          id: 'her-call',
          label: 'Let Ione decide, with all of them watching',
          text: 'You step back. Ione looks at the crowd, then the boat, then the bay, and makes up her own mind, the way she always has.',
          ending: 'last-haul',
        },
        {
          id: 'wet-street',
          label: 'Keep watching the street that turned to water',
          text: 'You look back at the drowned street and keep looking. So does Ione. When you turn around, her lines are already off the cleat.',
          ending: 'moored-in-tomorrow',
        },
      ],
    },
  },
  endings: [
    {
      id: 'home-port',
      title: 'Home Port',
      tone: 'true',
      text: [
        'It takes three weeks, two potlucks and one very patient woman at the harbor office, but the Moon Snail gets a legal liveaboard slip, registered, inspected and paid six months ahead by thirty households who each put in what they could. Royce welds her a new rail. Graciela hangs curtains in the wheelhouse whether Ione wants them or not.',
        'On opening day of the commercial season there is a potluck on the dock, and Ione serves crab to the whole street, measuring every one with the brass gauge out of habit. Your plate comes first. “Meddlers eat first,” she says. “That’s the new rule. Arne would’ve liked it.”',
      ],
    },
    {
      id: 'last-haul',
      title: 'The Last Haul',
      tone: 'bittersweet',
      text: [
        'The Moon Snail goes to the cutter on Friday after all. Ione watches from the dock with Graciela’s arm through hers and doesn’t cry, because she says she did all of that two winters ago. She moves into a ground-floor apartment in Eureka off a waitlist she had been on for a year, with one window that looks at a parking lot. She puts the geraniums in it anyway.',
        'The last haul goes to every dark window in King Salmon at once. A week later a package arrives for you: the brass crab gauge and a note in tidy sign-painter letters. “You’ll know who’s hungry. Measure fair.”',
      ],
    },
    {
      id: 'moored-in-tomorrow',
      title: 'Moored in Tomorrow',
      tone: 'strange',
      text: [
        'The Moon Snail slides off into the fog past Buhne Point and does not come out the other side. The scrapper arrives Friday to an empty slough, and the paperwork lists her as lost. Ione is never found, and nobody in King Salmon looks very hard.',
        'But anyone who leaves a scanner on the old fishing channel will sometimes hear a tide report for streets that are canals, and once, on a king tide, you see her yourself: the Moon Snail moored to a porch rail in a King Salmon where the roads are water, geraniums on the wheelhouse, smoke in the stovepipe, a lamp in the window. Still somebody’s home. A full crab pot waits on the step for whoever needs it.',
      ],
    },
  ],
}
