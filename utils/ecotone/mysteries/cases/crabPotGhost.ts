import type { Mystery } from '../types'

// Case IV. Seed: home, shell, protection, mothering, memory, moodiness.

export const CRAB_POT_GHOST: Mystery = {
  id: 'crab-pot-ghost',
  number: 4,
  sign: 'cancer',
  title: 'The Mystery of the Crab Pot Ghost',
  tagline: 'A ghost in yellow oilskins delivers dinner to the dark windows.',
  region: 'King Salmon, Fields Landing and Buhne Point on Humboldt Bay',
  hook: 'Somebody in yellow oilskins is pulling crab pots in the dark off Buhne Point at four in the morning, and full pots keep turning up on King Salmon porches, once inside a locked living room, weeks before the season opens. The old-timers say the only crabber who ever dressed like that is dead. The crabs are very much alive.',
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
    'Portrait 2:3 collectible mystery card, painted. A weathered wooden crab boat moored in a misty Humboldt Bay slough at dawn, geraniums in a coffee can on the wheelhouse roof, woodsmoke curling from a tiny stovepipe, the low houses of King Salmon behind with every porch light glowing. In the foreground a round steel crab pot sits on a wet porch step, its steel ribs and mesh echoing a crab’s shell, a yellow oilskin coat hung on the rail beside it. Faint pearl stars above the mist form an unlabeled small inverted-Y constellation. Deep teal, abyss blue and pearl. No text, no letters, no logos.',
  provenance:
    'King Salmon, Fields Landing and Buhne Point are real places on Humboldt Bay. Dungeness crab is a real local fishery with separate sport and commercial seasons and a legal minimum size. Ione and Arne Sorensen, the Moon Snail, Lindqvist’s yard, the chalked delivery list, the 1970 radio traffic, Teo, Graciela, Royce and every household are invented. No real boatyard, harbor office, vessel-removal program or landlord is depicted.',
  decline: {
    label: 'Tell Teo you don’t do ghosts before breakfast',
    text: 'You reply that it is five in the morning and the ghost can wait. Teo replies, “the CRABS cannot wait,” and then sends nine photos of nine crabs, each captioned with a name. You mute the thread at Gerald.',
  },
  gates: [
    {
      title: 'Nine Crabs on the Good Rug',
      place: 'King Salmon, the blue house past the bait shop',
      chapter: 3,
      scene: 'bay',
      message: {
        medium: 'note',
        from: 'A tag wired to a crab pot, photographed by Teo at 5 a.m.',
        lines: [
          'FOR THE BLUE HOUSE. NINE, ALL LEGAL SIZE. KEEP THEM COLD.',
          'On the back, in tidy sign-painter capitals: THE RUG WILL DRY. — A.S.',
          'Teo’s caption: are u up. crustacean emergency. this was in my abuela’s LIVING ROOM. blue house past the bait shop. bring a cooler',
        ],
      },
      body: [
        'King Salmon sits on the bay so low that the high tide always seems to be thinking about coming in the front door. Teo’s grandmother, Graciela, sits in her recliner beside a steel crab pot that holds nine furious Dungeness and drips onto a rug she has owned since the Carter administration. The front door was locked all night. The pot is still cold from the water.',
        '“A man in yellow,” Graciela says. “I saw him off Buhne Point at four this morning, out in the drizzle, pulling pots like it was 1970. Then I went back to bed and he’d made a delivery.” The buoy tied to the pot is hand-painted. On the windowsill someone has left a stick of spearmint gum, folded in half. Through the window, next door, a retired welder named Royce is hosing out a skiff on a trailer at five in the morning, in a yellow rain jacket. He waves. Graciela does not wave back. “He’s fixed every lock on this street,” she says. “And he hates the new landlord more than I do.”',
      ],
      approaches: [
        {
          id: 'neighbors',
          label: 'Knock on the doors that got crabs too',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You work the street with a cooler and your most trustworthy face. Six houses got pots this month. Every one of them, once you sit at the kitchen table long enough, admits the same thing quietly: the rent went up when the new owner bought the block, and the fridge has been mostly mustard since. “Whoever it is,” says Royce from next door, wiping his eyes and blaming the onions, “they know exactly who’s hungry. That’s not a ghost. That’s a neighbor.”',
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
            text: 'No forced lock, no wet track on the front porch. The drips start on the back step, beside a ceramic frog with a missing toe. The spare key under the frog is damp and smells of bait and diesel. Graciela stares at it. “Nobody knows about the frog,” she says. “Nobody except people who’ve lived on this street forty years.” She looks, without meaning to, at Royce’s skiff. Whoever the ghost is, it has been a neighbor much longer than the landlord.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You test your locked-room theory on the front door with a bobby pin and a confidence you have not earned. The bobby pin snaps off inside. Graciela has to call her nephew the locksmith, who arrives in pajama pants, fixes it in ninety seconds, and charges you one crab, which he selects with insulting care.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'oilskins',
          label: 'Ask the old-timers at the bait counter about yellow oilskins',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'The old men at the bait counter go quiet the way men do when you say a name they used to say every day. The old buttoned-hood oilskins in that yellow haven’t been sold around here in years. Only one boat on the bay still crewed in them: the Moon Snail, Arne Sorensen’s boat. A.S. “Arne passed two winters back,” says the man at the register. “Boat’s been sitting in the slough behind Lindqvist’s yard, waiting on the scrapper. Nobody’s seen her move.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The old men at the bait counter adore you instantly and tell you everything they know: oilskins, rubber boots, the winter the jetty moved, a cousin who caught a halibut the size of a door, and why your generation can’t tie a bowline. Three hours later you can tie an excellent bowline. You know nothing whatsoever about the ghost.',
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
        'Alone with nine crabs and a grandmother, you feel watched by everyone in the room, and the crabs have the most opinions.',
    },
    {
      title: 'The Boat That Waters Its Geraniums',
      place: 'Lindqvist’s yard, on the slough below Fields Landing',
      chapter: 3,
      scene: 'marsh',
      message: {
        medium: 'radio',
        from: 'Marine channel, 2:14 a.m., relayed by Teo',
        lines: [
          'Teo: “GUYS my scanner just picked this up”',
          '“…Moon Snail, Moon Snail. Pots are pulled. Six for the dark windows.”',
          'Static, then someone humming an old waltz, too worn to tell man from woman.',
          'Teo: “my tío says moon snail is that dead guy’s boat. sitting in the slough behind lindqvist’s yard??”',
        ],
      },
      body: [
        'Lindqvist’s yard is a private graveyard for hulls on the slough below Fields Landing: skiffs with grass growing in them, a tug sinking slowly into its own cradle. But at the end of a crooked dock behind it, half hidden in cordgrass, floats a thirty-eight-foot wooden crab boat. MOON SNAIL, says the stern, hand-lettered. A red tag zip-tied to her rail reads LINDQVIST MARINE · STORAGE UNPAID · TO BE BROKEN FOR SCRAP. A thread of woodsmoke rises from her stovepipe, and somebody has watered the geraniums in the coffee can on the wheelhouse roof.',
        'On the piling at the head of her dock someone has chalked a delivery list in tidy capitals: King Salmon house numbers, a count of crabs beside each, most of them ticked off this week. You know that street. Three of the numbers belong to houses that were torn down before Teo was born, Graciela told you, and they are ticked off too. Aboard, someone turns off a lamp.',
      ],
      approaches: [
        {
          id: 'dock',
          label: 'Sit on the dock and wait for whoever is aboard',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You sit on the cold dock with your feet over the water and do nothing, which is harder than it sounds. After forty minutes, a voice behind the wheelhouse door says, “You’re letting the cold into your bones, sitting like that.” Nobody comes out. But a hand sets a thermos on the rail, and two mugs. The coffee is perfect. Both mugs have a lopsided painted snail on them. One is chipped from fifty years of use. The other is Arne’s, and nobody has drunk from it in two winters, until now.',
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
            text: 'The yard office is open because the lock rusted open in 2011. In a logbook going back to the sixties, the Moon Snail is on every other page: hauled out, painted, put back in, always signed A. & I. Sorensen. The last entry, two winters ago, is in one hand only, shakier than the rest: “Arne gone. Boat stays in till I say.” Beside the scrap date someone has written, very neatly, “No.”',
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
          'Cedar’s CB crackles with a crab count in a man’s voice, at 1970 prices. He switches it off. “Wrong decade. The moon pulls the tide and the tide pulls the radio, and nobody ever asks the moon to knock it off.”',
      },
      aloneLine:
        'Alone in the boatyard, you hear the Moon Snail creak against her lines like something breathing in its sleep.',
      recall: {
        'g1:fail':
          'You left King Salmon with less than you hoped, so you came out here on Teo’s tío’s word alone.',
      },
    },
    {
      title: 'The Last Haul Off Buhne Point',
      place: 'Buhne Point, before dawn',
      chapter: 3,
      scene: 'beach',
      message: {
        medium: 'voicemail',
        from: 'Graciela, 0:38',
        lines: [
          '“It’s Graciela. Lindqvist told Royce the yard tows that boat in the slough for scrap at eight tomorrow morning.',
          'And somebody hung a crab-pot tag on every doorknob on the street while we slept. Same capitals. LAST HAUL TONIGHT. LEAVE YOUR PORCH LIGHT ON SO I CAN SAY GOODBYE.',
          'Mine’s on. Bring Teo’s cooler. And a hat.”',
        ],
      },
      body: [
        'Four in the morning, the last night before the tow. Buhne Point is a fist of rock and riprap holding off the bay, and the mist sits on it so thick the channel lights look underwater. Every porch light in King Salmon is on. Word got around. Graciela, Royce and half the street sit on their steps in coats over their pajamas, waiting for a ghost.',
        'Out on the water an engine coughs, catches and settles into an old diesel’s heartbeat. A light comes toward the point. If you are going to meet the crabber in yellow oilskins before the scrapper does, it has to be now.',
      ],
      approaches: [
        {
          id: 'casserole',
          label: 'Leave a hot dinner and a note on the last porch',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You and Graciela build the fastest casserole in King Salmon history and leave it on the last porch on the route with a note in your best handwriting: WE KNOW YOU’RE HUNGRY TOO. Twenty minutes later a figure in yellow climbs the steps with a pot on one hip, reads the note, and sits down hard on the top step. It does not run. It eats, slowly, with a fork, in the drizzle, and you walk up and sit beside it.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The casserole is excellent. The note, written in a hurry, says WE KNOW in letters so large that in the dark it reads as a threat. The figure in yellow reads it, sets down the crab pot with enormous dignity and backs away into the mist. Ten minutes later the dish is back on the step, rinsed in bay water, with a better recipe tucked under the lid. Whoever left it is still out there, close enough to hear the street breathing.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'lantern',
          label:
            'Swing a lantern three times off the dock, the old come-in-there’s-coffee signal',
          check: { skill: 'lore', target: 9 },
          cost: 'You are about to speak a language nobody on this street has used since 1970.',
          success: {
            text: 'You borrow the lantern off Royce’s skiff and walk to the end of the little King Salmon dock. Three slow swings: the old signal from when every house on this block had a boat behind it. Come in, there’s coffee. Out on the water the light stops. Then it turns. The Moon Snail noses out of the mist and ties up, neat as a nurse, and a figure in yellow steps onto the planks and holds out an empty mug. “Well?” says the ghost. “Where is it?”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You get two slow swings in before Royce’s lantern, which has not been filled since the Reagan administration, gutters out. Out on the water the light stops, waits a long, polite moment for the third swing, and turns back into the mist. Up and down the street, old-timers on their steps shake their heads, and one goes inside, unasked, for kerosene.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'route',
          label: 'Work out the ghost’s route and stake out the next house',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'You get Graciela and Royce to list who got pots and in what order. The street has gossiped about nothing else. The route snaps into order: bayside to inland, oldest neighbor to newest arrival. Number 31 is next. You crouch behind its hydrangea. At 4:40 a figure in yellow comes up the walk with a pot on one hip, finds the spare key under the mat without looking, and freezes when your flashlight catches the hood.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You count the route wrong and stake out number 13, which the ghost skips because the man who lives there is doing fine, thank you, and owns a motion light and a small loud dog. The dog finds you. The man finds you. Two houses down, the ghost finishes the route in peace and heads, unhurried, back toward the water.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara has drawn a tiny yellow raincoat on her wrist in ballpoint. “If this goes wrong, at least it’s documented.”',
        kit: 'Kit has run Graciela’s clothesline from the porch rail down to the dock piling, with a pulley and a bent coat hanger for a hook. “A full pot rides down this,” she says, testing it with the cooler. “Whoever’s been carrying them on one hip all month can stop.”',
        juniper:
          'Juniper has claimed Graciela’s porch swing and the good blanket. “If the ghost turns out to be handsome, I saw him first,” she says. “If it’s somebody’s grandmother, you can have her.”',
        cedar:
          'Cedar has the CB on low, tuned to the channel. “Whoever it is has been up since two,” he says. “Tide turns at five. If I were a ghost, I’d come in on it.”',
      },
      aloneLine:
        'You wait alone in the dark with every porch light on behind you, and for once the whole street is on your side.',
      recall: {
        'g2:pass':
          'You know which boat that old diesel belongs to. So does half the street. Nobody says the name out loud.',
        'g2:fail':
          'You never got a good look aboard the Moon Snail. Tonight you meet her out here, or not at all.',
      },
    },
  ],
  coldCase: {
    title: 'The Moon Snail Goes to the Cutter',
    place: 'Lindqvist’s yard, the morning of the tow',
    chapter: 3,
    scene: 'bay',
    body: [
      'At eight the next morning, a tow arrives at the slough. The Moon Snail is empty: stove cold, bunk stripped, geraniums gone. The scrapper’s crew takes her apart in an afternoon, and the old planks smell of sixty years of bait and coffee as they split.',
      'The crab pots stop coming. On Graciela’s porch the last one sits empty and scrubbed clean, with a brass crab gauge tied to the handle. Nobody in King Salmon knows where the ghost went. Everybody leaves their porch light on a little longer, just in case.',
    ],
    recall: {
      'g3:pass':
        'Last night you got close enough to touch the yellow oilskins. But with nothing from the street or the slough to go on, you did not know what to say, and the ghost could tell. “Go home, honey. Put on a hat,” said a raspy voice from under the hood, and by the time anybody on the street stood up, there was only a wake going out into the mist.',
    },
    choices: [
      {
        id: 'gauge',
        label: 'Keep the brass crab gauge',
        text: 'You hang it by your door. On misty mornings it is cold and wet to the touch, as if somebody just measured something with it.',
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
    place: 'The little dock at King Salmon, before dawn',
    chapter: 3,
    scene: 'bay',
    body: [
      'Nobody lets her fade this time, least of all the street. By ten past five the whole night has moved down to the little King Salmon dock: the Moon Snail tied at the end of it, where she always ties up to make her deliveries, engine ticking as it cools; thirty neighbors in rubber boots on the planks; and the figure in yellow in the middle of them with nowhere left to go. The hands come first, big-knuckled and bait-scarred, unwrapping a stick of spearmint gum and folding it in half before she chews it, the way the one on Graciela’s windowsill was folded. Then the hood comes back on a white braid and a pair of very bright, very tired eyes. Royce, still in his yellow rain jacket, lets out a breath like a man being crossed off a list. “Ione,” Graciela says, and her voice cracks. “Ione Sorensen. We thought you went to your sister’s in Oregon.”',
      '“I told everyone that,” Ione says. “When Arne died, the king tide came through the house we rented for forty years, and they red-tagged it, and the owner sold the lot instead of fixing it. The yard wanted the boat for scrap to cover what we owed. So I moved aboard. Arne always said the first haul of the season goes to the house with the dark windows, so I signed them his. This year there were a lot of dark windows.” She measures a crab with a brass gauge, gently, and drops it back in. “Every one legal size, before you ask. I’m a few weeks early on the calendar, and I’ll answer to Arne for that.” Then, quieter: “If they find out I live aboard, I lose the last home I have.”',
    ],
    afterMiss: [
      'You lost the ghost in the dark. The street didn’t. Graciela, who has lived on this block since the Carter administration, says out loud the one thing everybody knows about the ghost: it feeds dark windows. “Lights off,” she says, and walks down the street saying it at every step. One porch at a time, King Salmon goes dark. A quarter of an hour later an old diesel heartbeat comes back across the water, and the Moon Snail noses into the little King Salmon dock with a full string of pots, because a whole street of dark windows is more than whoever wears those oilskins has ever been able to leave hungry.',
      'Thirty neighbors are waiting on the planks in the dark. The figure in yellow ties up, sees them, and does not run. The hands come first, big-knuckled and bait-scarred, unwrapping a stick of spearmint gum and folding it in half before she chews it, the way the one on Graciela’s windowsill was folded. Then the hood comes back on a white braid and a pair of very bright, very tired eyes. Royce, still in his yellow rain jacket, lets out a breath like a man being crossed off a list. “Ione,” Graciela says, and her voice cracks. “Ione Sorensen. We thought you went to your sister’s in Oregon.”',
      '“I told everyone that,” Ione says. “When Arne died, the king tide came through the house we rented for forty years, and they red-tagged it, and the owner sold the lot instead of fixing it. The yard wanted the boat for scrap to cover what we owed. So I moved aboard. Arne always said the first haul of the season goes to the house with the dark windows, so I signed them his. This year there were a lot of dark windows.” She measures a crab with a brass gauge, gently, and drops it back in. “Every one legal size, before you ask. I’m a few weeks early on the calendar, and I’ll answer to Arne for that.” Then, quieter: “If they find out I live aboard, I lose the last home I have.”',
    ],
    recall: {
      'g1:fail':
        'Graciela looks at you sideways. “You took your time,” she says. “But you came back. That counts on this street.”',
      'g2:fail':
        '“You’re the one who was poking around my slough,” Ione says. “I watched you from the wheelhouse. You need a hat.”',
    },
    choices: [
      {
        id: 'see-home',
        label: 'Ask to see her home',
        text: 'You ask, the way you would ask anybody, if you can see her place. Ione hesitates, then opens the wheelhouse door.',
        next: 'aboard',
      },
      {
        id: 'ask-street',
        label: 'Ask the street what happens now',
        text: 'You turn to thirty people in rubber boots and ask them, plainly, what happens now. Somebody goes to put the coffee on.',
        next: 'porch-council',
      },
      {
        id: 'cast-off',
        label: 'Lift her lines and let her go into the mist',
        text: 'You lift her lines off the cleat and hand them aboard. Ione looks at you for a long moment, nods once, and puts the Moon Snail in gear. The street steps back to let her go.',
        ending: 'moored-in-1970',
      },
    ],
    leadLines: {
      mara: 'Mara drapes her jacket over Ione’s shoulders without asking. “You’re frozen. Argue with me later.”',
      kit: 'Kit is already coiling the pot lines the way Ione had them. “Tell us what needs hauling. We’re strong and we work for chowder.”',
      juniper:
        'Juniper is eyeing the bunk through the wheelhouse door. “If you ever want a lodger,” she tells Ione, “I don’t eat much and I’m very good with geraniums.”',
      cedar:
        'Cedar lays a hand on the Moon Snail’s rail like he is checking a horse. “Sixty years of the moon yanking her up and down twice a day,” he says, “and she’s sound. Somebody’s kept her sound.”',
    },
    aloneLine:
      'With nobody beside you, it is just you and Ione and thirty strangers in rubber boots, and she looks at you like a grandmother deciding whether you have eaten.',
  },
  branches: {
    aboard: {
      title: 'The Moon Snail’s Galley',
      place: 'Aboard the Moon Snail',
      chapter: 3,
      scene: 'bay',
      body: [
        'The wheelhouse is a whole life in eighty square feet: a woodstove the size of a breadbox, a bunk under a quilt patched from old oilskins, Arne’s reading glasses still folded on the chart table, a calendar from two years ago that nobody has turned. A rack by the stove holds two lopsided painted snail mugs, one chipped from fifty years of coffee and one that has sat clean for two winters. Every morning she sets out both and fills one.',
        'Ione gives the tour like any proud homeowner, which is what she is. “Arne and I lived aboard the first six years we were married, before the house,” she says. “I told him I’d come back to her someday. I didn’t mean like this.” She laughs, and then she doesn’t. “It’s not a good place to get old. But it’s mine.”',
      ],
      recall: {
        'g2:dock':
          '“You sat out on my dock in the cold,” Ione says, not looking up from the stove. “Arne used to sit right there when he was in trouble with me. Same slouch.”',
      },
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
        'By six there are thirty people on the little dock in rubber boots and borrowed coats, and the crab pot from Graciela’s living room has been carried down to serve as a coffee table. Royce brought donuts. Teo is taking minutes on his phone, badly.',
        '“She fed us all winter,” Graciela tells the crowd, “and not one of us noticed she was hungry too.” Nobody speaks for a while. Woodsmoke from the Moon Snail’s stovepipe drifts up the street, smelling of coffee and bait and sixty years of the same stove. Royce, who spent a week as the street’s favorite suspect without knowing it, passes the donuts to Ione first.',
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
          id: 'old-street',
          label: 'Ask Ione who the vacant lots on her list are for',
          text: 'You ask about the three numbers on her chalked list that are only grass now. Ione looks at you for a long moment. “They still get hungry,” she says, and goes to start the engine. When you turn around, her lines are already off the cleat.',
          ending: 'moored-in-1970',
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
        'On opening day of the commercial season there is a potluck on the dock, and Ione serves crab to the whole street, measuring every one with the brass gauge out of habit. Your plate comes first. “Anybody who sat up all night for a ghost eats first,” she says. “That’s the new rule. Arne would’ve liked it.”',
      ],
    },
    {
      id: 'last-haul',
      title: 'The Last Haul',
      tone: 'bittersweet',
      text: [
        'The Moon Snail goes to the cutter the next morning after all. Ione watches from the dock with Graciela’s arm through hers and doesn’t cry, because she says she did all of that two winters ago. She moves into a ground-floor apartment in Eureka off a waitlist she had been on for a year, with one window that looks at a parking lot. She puts the geraniums in it anyway.',
        'The last haul goes to every dark window in King Salmon at once. On the next king tide, the brass crab gauge is hanging on your door handle in a mesh bait bag, with a note in tidy sign-painter letters: “You’ll know who’s hungry. Measure fair.”',
      ],
    },
    {
      id: 'moored-in-1970',
      title: 'Moored in 1970',
      tone: 'strange',
      text: [
        'The Moon Snail slides out past Buhne Point into the woodsmoke and the morning mist and does not come out the other side. The tow arrives at eight to find nothing to tow, and the yard lists her as lost. Ione is never found, and nobody in King Salmon looks very hard.',
        'But if you leave a scanner on the old fishing channel, a young couple sometimes calls pot counts back and forth at 1970 prices, and one of them laughs the way Ione must have laughed at thirty. On king tides, full pots turn up on the three vacant lots from her list, set neatly where the front steps used to be, and by morning every crab is gone. Once you drive out to Buhne Point at four and find nothing on the water but two wakes, side by side, heading in.',
      ],
    },
  ],
}
