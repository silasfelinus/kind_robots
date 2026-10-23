import type { Mystery } from '../types'

// Case IX. Seed: adventure, freedom, philosophy, blunt honesty, optimism, the rider on the open road.

export const WANDERING_ARROWS: Mystery = {
  id: 'wandering-arrows',
  number: 9,
  sign: 'sagittarius',
  title: 'The Mystery of the Wandering Arrows',
  tagline:
    'Someone on the Lost Coast is aiming at places that aren’t there yet.',
  region:
    'The Lost Coast: Shelter Cove, Black Sands Beach, Petrolia and the King Range',
  hook: 'Up and down the Lost Coast, arrows are turning up in driftwood logs and wedged behind trailhead signs, pointing at places no map shows. Lost hikers wake with a trail drawn on the backs of their hands, and at low tide, in the fog, something with a rider’s back and a horse’s legs gallops the black sand and is gone.',
  design: {
    element: 'fire',
    motif: 'arrow',
    palette: { sky: '#1e0c07', ink: '#f6d58e', glow: '#e8743a' },
    stars: [
      [20, 58],
      [32, 50],
      [30, 66],
      [42, 36],
      [52, 48],
      [64, 42],
      [72, 54],
      [58, 62],
      [46, 22],
    ],
    links: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [3, 4],
      [1, 4],
      [4, 7],
      [7, 2],
      [4, 5],
      [5, 6],
      [6, 7],
      [3, 8],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. Black Sands Beach on the Lost Coast at a minus tide before dawn, the steep King Range falling straight into the surf, fog lying low on the water, a lone rider on a tall gray horse galloping the wet black sand in one long silhouette, oilskin coat flying. In the foreground a driftwood arrow fletched with white sailcloth stands in the sand, aimed at a pale rock shelf just rising from the sea. Faint gold stars above the ridgeline form an unlabeled archer constellation. Ember orange, gold and charcoal. No text, no letters, no logos.',
  provenance:
    'Shelter Cove, Black Sands Beach, Petrolia, the Mattole River and the King Range are real places on the Lost Coast. Parts of the Lost Coast Trail are impassable at high tide, and hikers are told to carry and follow a tide chart. The April 1992 Cape Mendocino earthquakes uplifted the shoreline near Petrolia and Cape Mendocino by roughly a meter in places, leaving tide-pool life stranded above the water. Dr. Wren Okonkwo-Barlow, Socrates the horse, Hap Lindqvist, Priya, Dmitri, the arrows and every route they point to are invented.',
  decline: {
    label: 'Tell Priya the Lost Coast is lost for a reason',
    text: 'You text back a wave emoji. Priya sends a thumbs-up and then a photo of an arrow stuck in a driftwood log. It is pointing straight at the camera. At you.',
  },
  gates: [
    {
      title: 'The Arrow in the Trailhead Sign',
      place: 'Black Sands Beach trailhead, Shelter Cove',
      chapter: 5,
      scene: 'beach',
      message: {
        medium: 'text',
        from: 'Priya (outdoor club trip leader)',
        lines: [
          'so we found an arrow wedged behind the trailhead sign',
          'it points at nothing. like the ocean. like specifically a rock IN the ocean',
          'also dmitri woke up with a map drawn on his hand?? he’s fine. he’s being so weird about it',
        ],
      },
      body: [
        'The trailhead at Black Sands Beach is a parking lot with a view that keeps trying to fall into the sea. The King Range goes straight up behind you, the beach runs straight north into fog, and the board by the trail says, in several different ways, that the tide will kill you if you let it. Wedged behind the sign, neatly, not through it, is an arrow: a straight driftwood shaft, a point of filed slate, and three white fletches that look like gull feathers until you get close.',
        'Dmitri, a hydrology major with a beard he is still negotiating with, holds out the back of his left hand. Drawn on it in marker: a trail, a creek, a tide line and the number 1:12. “I got lost last night,” he says. “I sat down to cry a little. I woke up next to a fire that was already out, with this. I followed it here. It was right.”',
      ],
      approaches: [
        {
          id: 'read-arrow',
          label: 'Read the arrow like a sentence',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'Up close, the fletching is white sailcloth, notched to look like feathers. Gull feathers are federally protected; whoever made this knows the law and respects it with style. Scratched along the shaft in tiny capitals is a column of low-tide times and two words: WHY NOT? The arrow points north-northwest, at a rock shelf just under the surf that every map you own calls ocean.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You pull the arrow out to look at it better, and the sign’s whole laminated tide warning slides out with it and blows down the beach. You chase it a quarter mile and catch it. You now know the tide warning by heart, which is useful, and nothing about the arrow, which is not.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'hand-map',
          label: 'Match Dmitri’s hand map against the trail board',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'The line on Dmitri’s hand matches the trail board creek for creek, until it doesn’t: at his second knuckle the drawn trail leaves the beach and runs along a shelf of rock that, on the board, is underwater. And 1:12 is a time. Tonight’s low tide, one-twelve in the morning, almost to the minute. Whoever drew this was telling him when to walk, not just where.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You hold Dmitri’s hand up against the board for so long that a passing family assumes you are proposing. They clap. Dmitri, flustered, says yes to be polite. By the time everyone has been un-engaged and congratulated anyway, the fog has smudged the marker into a gray blur.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'north',
          label: 'Hike north to where the arrow points before the tide turns',
          check: { skill: 'burly', target: 9 },
          cost: 'Three miles of loose black sand, which is like walking on ball bearings.',
          success: {
            text: 'You make the first creek with the tide still out and your calves on fire. In a driftwood log by the creek mouth, a second arrow points the same way, and in the wet sand beside it are hoofprints: big, shod, deep, with a stride so long the horse must have been flying. They go into the surf and do not come out.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'The black sand eats your boots one step at a time. Halfway there the tide turns, and you spend six hours on a boulder with a sandwich, watching the water you were warned about do exactly what you were warned it would do. It is very humbling. The sandwich is excellent.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara inspects the marker on Dmitri’s hand. “Unlicensed linework. Steady, though. Whoever drew this wasn’t scared of him.”',
        kit: 'Kit sights down the arrow shaft like a scope. “Perfectly straight. Somebody spent a week on this and then gave it away.”',
        juniper:
          'Juniper reads the tide warning aloud in a cheerful voice that makes it much scarier.',
        cedar:
          'Cedar looks up at the King Range. “Road in here eats transmissions for breakfast. Anybody living out here on purpose has a reason.”',
      },
      aloneLine:
        'Alone at the trailhead, you notice the arrow is aimed a little to your left, as if it is pointing past you at somebody who isn’t here yet.',
    },
    {
      title: 'The Morning the Sea Stepped Back',
      place: 'The Mattole River mouth, below Petrolia',
      chapter: 5,
      scene: 'rivermouth',
      message: {
        medium: 'voicemail',
        from: 'Hap Lindqvist, Mattole Valley, 1:03',
        lines: [
          '“This is Hap. Priya’s aunt says you’re the kids asking about arrows.',
          'I got one stuck in my fence post pointing at the river mouth. At the sea, really. I remember ’92, and I don’t like it.',
          'Porch is on the left past the store. I’ll have coffee. I’ll have opinions.”',
        ],
      },
      body: [
        'Hap Lindqvist is seventy-nine, raises sheep, and remembers April 1992 the way other people remember the moon landing. “Three big quakes in two days,” he says. “And after, the sea had stepped back. Whole shoreline up out of the water, a yard or more. Mussels and seaweed and tide pools sitting high and dry, going white in the sun. The ground did that. Lifted the coast like a tablecloth.”',
        'The arrow in his fence post points across the river mouth at a shelf of dark rock awash in surf. Below it, on the gravel bar, hoofprints come up out of the Mattole, cross the sand, and walk straight into the sea. “Folks call her the Professor,” Hap says. “Rides a big gray. Finds people. Doesn’t stay for thanks. I say live and let live. My wife says she owes us a library book.”',
      ],
      approaches: [
        {
          id: 'porch',
          label: 'Sit on Hap’s porch and drink the coffee',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You drink the coffee, which is strong enough to have opinions of its own, and let Hap talk sheep for forty minutes. It pays. “She’s a doctor,” he says. “Not the useful kind. Philosophy. Taught back east twenty years, then rode in here on a horse named Socrates. Brings my wife paperbacks and argues with her about them. They both love it.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You tell Hap you don’t drink coffee. There is a pause in which a whole lamb could be born. He tells you, politely, that the river mouth is that way, and goes inside to tell his wife about you. Through the window you can see her laughing so hard she has to sit down.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'tide-chart',
          label: 'Lay the arrows’ tide times against a real tide chart',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'Every time scratched on every arrow is a real low tide this month, the kind that opens the impassable stretches for a few hours. But the arrow in Hap’s post is marked with a tide lower than any on the chart, lower than any in a century of records. The shelf it points to would only ever be dry if the coast lifted again. Like ’92. Like a lot more than ’92.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You lay the arrows’ times against the chart and get every one perfectly wrong, because you are reading the chart for a harbor two hundred miles south. Hap points this out with deep, quiet joy. He has been waiting years for somebody to make that mistake on his porch.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'ford',
          label: 'Follow the hoofprints across the river mouth at low water',
          check: { skill: 'burly', target: 9 },
          cost: 'Cold water to the knees, a gravel bar that moves, and your dignity.',
          success: {
            text: 'You wade the shallow bar, knees screaming, and pick up the prints on the far side. They climb a cliff path no wider than a horse, past a third arrow, to a fire ring still warm and a paperback annotated so heavily the margins are a second book. On the flyleaf, in blunt handwriting: Property of Dr. W. Okonkwo-Barlow. If found, keep reading.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'The gravel shifts under your foot and you sit down in the Mattole River with tremendous dignity and a gasp you will never be able to take back. Hap, watching from the bank, laughs until he has to lean on the fence post. The arrow in it does not move an inch.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara photographs the hoofprints with a coin for scale. “Shod, heavy, very calm. That horse isn’t running from anything.”',
        kit: 'Kit stands on a drift log doing math on the stride. “Either that’s an enormous horse or the rider really likes jumping.”',
        juniper:
          'Juniper presses her ear to the dark rock. “It remembers being lifted. It thinks it’s going to happen again. It’s kind of excited.”',
        cedar:
          'Cedar shakes Hap’s hand like they’ve met before. “Everybody out here’s got a ’92 story. Mine’s my uncle’s chimney.”',
      },
      aloneLine:
        'Alone at the river mouth, you can hear the river and the sea arguing, and neither one is winning.',
    },
    {
      title: 'The Rider at the Minus Tide',
      place: 'Below the King Range, the impassable stretch',
      chapter: 5,
      scene: 'beach',
      message: {
        medium: 'radio',
        from: 'Weather radio, a voice between forecasts',
        lines: [
          'Low tide one-twelve a.m., minus one point one feet.',
          'Whoever’s been following my arrows: come at the low tide, not a minute before.',
          'Bring a headlamp, a tide chart and an argument. Back to the forecast.',
        ],
      },
      body: [
        'At one in the morning the impassable stretch is passable for exactly as long as the sea allows. The surf has pulled back off the black sand and left it shining like a road. Headlamps bob. Fog sits on the water like it is waiting to be introduced. Then the sound: hooves, big ones, coming hard from the north, and out of the fog comes the silhouette from every Lost Coast campfire story, a horse’s body and a rider’s back in one long shape, moving at an arrow’s speed.',
        'You have one tide window to catch the rider, and the rider has had years of practice not being caught. Behind you, the water has already started to come back.',
      ],
      approaches: [
        {
          id: 'gallop',
          label: 'Run the rider down along the hard sand',
          check: { skill: 'burly', target: 11 },
          cost: 'A flat sprint on black sand, at night, with the sea coming back.',
          success: {
            text: 'You run like the tide is behind you, because it is. The horse could lose you in a heartbeat. It doesn’t. The rider looks back, sees you still coming, and laughs out loud, a big honest bark of delight, and reins in at the far rocks. “Nobody follows that far,” she says. “That’s either very stupid or very interesting. Let’s find out which.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You sprint a hundred yards flat out, and then the black sand takes your legs out from under you in a way sand should not legally be allowed to. You lie on your back as the hooves go by. A gloved hand drops a foil-wrapped energy bar on your chest without stopping. It is the good kind.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'bait',
          label: 'Pretend to be lost so the rider comes to find you',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You sit on a rock with your headlamp off and your best lost face, which turns out to be very convincing. Five minutes later a big gray horse stops beside you, and a woman in an oilskin coat leans down with a marker uncapped, ready to draw you a route home. Then she sees the tide chart in your lap. “Oh, that’s dirty,” she says, admiring. “That’s a good trick.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You sit down and look lost with total commitment. A genuinely lost hiker, an older man in a very expensive jacket, sits down next to you, relieved to have company. The rider finds you both, draws a route on his hand, gives you a look of profound disappointment, and leaves. He thanks you for the moral support.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'question',
          label: 'Shout one honest question into the fog',
          check: { skill: 'psyche', target: 7 },
          success: {
            text: 'You cup your hands and shout the only question you have: “Who finds you when you get lost?” The hooves stop. The fog is quiet for a long time. Then a woman’s voice, rough from not being used much: “That is the first good question anybody has asked me in six years.” She rides out of the fog at a walk.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You shout a question. It turns out to be “Are you a horse?” The fog is quiet for a long time. Then a woman’s voice says, very clearly, “No,” and the hooves go away north at a gallop, and you will have to live with having asked that for the rest of your life.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara stays at the waterline, watching the tide instead of the rider. “Somebody has to watch the thing that actually kills people.”',
        kit: 'Kit checks every headlamp’s batteries twice. “Adventure is mostly logistics wearing a cape.”',
        juniper:
          'Juniper is barefoot on the freezing black sand and says she feels great, which is either nymph business or a lie.',
        cedar:
          'Cedar holds the tide chart like a hymnal. “We go when it says go, we turn back when it says turn back. I’m not rescuing anybody tonight.”',
      },
      aloneLine:
        'Alone on wet black sand at one in the morning, with nobody to ask whether this is a good idea, you feel more free than you have ever felt, and also, in fairness, more damp.',
    },
  ],
  coldCase: {
    title: 'The Tide Comes In',
    place: 'Black Sands Beach, Shelter Cove',
    chapter: 5,
    scene: 'beach',
    body: [
      'The arrows stop showing up. Hap says the Professor rode north in the fog and didn’t come back. The trailhead sign has a tidy gap where an arrow used to be, and someone has stuffed it with a wad of gum, which feels like a statement.',
      'Dmitri’s hand map fades to a gray smudge. He swears he can still feel it itch when the tide turns.',
    ],
    choices: [
      {
        id: 'chart',
        label: 'Laminate a tide chart and keep it in your pocket forever',
        text: 'You do. The sea never surprises you again. It never invites you anywhere interesting again, either.',
        effects: { nerve: 1 },
      },
      {
        id: 'own-arrow',
        label: 'Leave an arrow of your own in a driftwood log',
        text: 'You carve it badly and aim it at the trailhead, toward the way out. A week later, someone has turned it a little to the left, toward something that isn’t there yet.',
        effects: { weird: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Professor of Nowhere',
    place: 'A meadow camp high in the King Range',
    chapter: 5,
    scene: 'meadow',
    body: [
      'Her camp is a spring, a tarp, a fire ring, a grazing gray horse the size of a small barn, and four crates of paperbacks swollen with fog. The centaur from every campfire story climbs down and becomes two creatures: Socrates, who goes back to eating, and Dr. Wren Okonkwo-Barlow, sixty-one, in an oilskin coat, reading glasses on a cord, a quiver of driftwood arrows on her back.',
      '“There’s no signal out here,” she says, blunt as a hammer. “People get lost. A phone is a brick. A map gets wet. An arrow in a log doesn’t need batteries. I mark the routes, I find the ones who wander off them, and I draw them home on the backs of their hands, because a hand is the one thing nobody loses.” She hands you an arrow. It points at the sea. “Most of them point at real trails. Some of them,” she says, “I honestly can’t explain. I just know where they go.”',
    ],
    choices: [
      {
        id: 'why',
        label: 'Ask her why a professor quit to live on a beach',
        text: 'You ask. She looks at you over her glasses for a long moment, deciding whether you deserve the true answer. Then she sits down by the fire.',
        next: 'what-it-cost',
      },
      {
        id: 'sea-arrows',
        label: 'Ask her about the arrows that point into the sea',
        text: 'You hold up the arrow from Hap’s fence post. Her face lights up the way only a professor’s does when somebody finally asks the question she was hoping for.',
        next: 'future-shore',
      },
      {
        id: 'let-ride',
        label: 'Thank her and let her ride on',
        text: 'You thank her, and you mean it. She tips her reading glasses at you like a hat and swings back up onto Socrates.',
        ending: 'rider-moves-on',
      },
    ],
    leadLines: {
      mara: 'Mara looks at Wren’s hands, steady and inky. “You’ve got a good line. You ever want to do it on skin, legally, I’m hiring.”',
      kit: 'Kit is already admiring the arrow kit, the straightening jig, the tiny files. “You built a tool to build a tool to save people. That’s my favorite kind of machine.”',
      juniper:
        'Juniper is braiding Socrates’s mane, and Socrates is allowing it, which Wren says has never once happened.',
      cedar:
        'Cedar checks Socrates’s shoes without being asked. “Good farrier. This horse is better looked after than half the trucks in the county.”',
    },
    aloneLine:
      'Alone at her fire, you get her full attention, which is a lot, like sitting in the front row of the only lecture that ever mattered.',
  },
  branches: {
    'what-it-cost': {
      title: 'What Freedom Cost',
      place: 'Wren’s camp, by the fire',
      chapter: 5,
      scene: 'meadow',
      body: [
        '“I taught ethics for nineteen years,” Wren says. “Freedom, duty, what we owe each other. In a room with no windows. Then my nephew got lost out here for three days. A stranger found him, someone who’d marked a route with sticks. No name. Never thanked. I read about the sticks and I couldn’t teach anymore. I’d been lecturing about the good life for two decades, and somebody out here was just living it.”',
        'She feeds the fire. “Here is the honest part, since you asked. My mother called on a Tuesday. I got the message on a Friday, when I rode into Petrolia for oats. The funeral had been Thursday.” She does not look away from you. “I would make the same choice again. That’s the part I don’t like about myself. Freedom costs. It just bills you in a currency nobody else can see.”',
      ],
      choices: [
        {
          id: 'search-rescue',
          label:
            'Offer to help turn the arrows into routes search and rescue can use',
          text: 'You tell her the arrows save people, but only the ones who happen to find them. She thinks about it the way she thinks about everything, hard and out loud. “Fine,” she says. “But I keep the horse, and I don’t carry a phone.”',
          ending: 'follow-the-arrow',
        },
        {
          id: 'go-home',
          label: 'Tell her honestly she should go home for a while',
          text: 'You tell her the truth, because she would know if you didn’t: there are people waiting for her who aren’t lost. She is quiet a long time. “Good argument,” she says at last. “I hate it.”',
          ending: 'rider-moves-on',
        },
      ],
    },
    'future-shore': {
      title: 'The Shore That Isn’t There Yet',
      place: 'Wren’s camp, looking out to sea',
      chapter: 5,
      scene: 'meadow',
      body: [
        'Wren lays the strange arrows out on a tarp. Twelve of them. Every one points at rock that is underwater today. “This coast goes up,” she says. “In ’92 it rose a yard in a night. Someday it will do it again, more. These are routes along a shore that hasn’t been lifted yet. I don’t make them on purpose. I wake up and there’s one in the quiver I don’t remember fletching.”',
        'Far out past the surf line, under the moon, a pale shelf of rock shows for a moment between waves, and on it, impossibly, a line of hoofprints already drying. Wren follows your gaze. “I’ve never had the nerve to follow one,” she admits. “Blunt truth: I’m a coward about exactly one thing.”',
      ],
      choices: [
        {
          id: 'follow-future',
          label: 'Take the strangest arrow and walk out at the next minus tide',
          text: 'You take the arrow. Wren gives you her headlamp, her tide chart and a look of pure envy. At one-twelve in the morning, the sea pulls back farther than any chart says it can.',
          ending: 'trail-not-there',
        },
        {
          id: 'map-now',
          label:
            'Help her map the routes that exist now, for the people lost today',
          text: 'You slide the strange arrows back into the quiver, gently, and spread out a real map. “The future can find its own way,” you say. Wren laughs. “That’s practically a thesis.”',
          ending: 'follow-the-arrow',
        },
      ],
    },
  },
  endings: [
    {
      id: 'follow-the-arrow',
      title: 'Follow the Arrow',
      tone: 'true',
      text: [
        'By spring, the arrows are a system. You and Wren walk every route with a tide chart and a notebook, and the volunteer search and rescue team gets a set of laminated cards: every arrow, every creek, every tide window, every spot where a lost person tends to sit down and give up. Wren will not join anything with a meeting schedule. She signs the cards W. and rides off before anyone can thank her.',
        'She stays free. She still draws routes home on the backs of lost hikers’ hands, and now, under each one, she writes the number of the people who are out looking for them. Once a month a paperback turns up in your mailbox, margins full of arguments. The latest has an arrow drawn on the flyleaf, pointing at you. Underneath: Your turn to disagree.',
      ],
    },
    {
      id: 'rider-moves-on',
      title: 'The Rider Moves On',
      tone: 'bittersweet',
      text: [
        'Wren packs the paperbacks into Socrates’s saddlebags, leaves the camp cleaner than she found it, and rides north at dawn, out of the King Range toward wherever the next lost people are. Maybe home. She doesn’t say. She is too honest to promise and too free to stay.',
        'The arrows stop. The trailhead sign gets a fresh coat of paint. But one morning at Black Sands Beach there is a last arrow wedged behind the sign, neatly, not through it, pointing up the trail toward the parking lot. Toward the way out. Toward you. Scratched on the shaft: Thank you for the argument.',
      ],
    },
    {
      id: 'trail-not-there',
      title: 'The Trail That Isn’t There Yet',
      tone: 'strange',
      text: [
        'At the minus tide the sea steps back the way Hap said it did in ’92, but farther, and the shelf rises out of the surf dry and white and ancient, a whole new shore. The arrow pulls in your hand like a compass needle. You walk a trail that will not exist for a long time: tide pools stranded and bleaching, new creeks cutting new beaches, a driftwood trail sign warning about tides you have never heard of.',
        'Far ahead, a rider on a gray horse waits on the new shore, older than Wren, or younger, impossible to say. She raises one hand. When you look down, there is a route drawn on the back of yours that you did not draw. By the time you are back on the old beach the sea has come in, and your boots are full of sand from a coast that hasn’t been lifted yet.',
      ],
    },
  ],
}
