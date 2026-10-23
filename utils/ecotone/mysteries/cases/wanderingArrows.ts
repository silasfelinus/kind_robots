import type { Mystery } from '../types'

// Case IX. Seed: adventure, freedom, philosophy, blunt honesty, optimism, the rider on the open road.

export const WANDERING_ARROWS: Mystery = {
  id: 'wandering-arrows',
  number: 9,
  sign: 'sagittarius',
  title: 'The Mystery of the Wandering Arrows',
  tagline:
    'On the Lost Coast, the arrows in the driftwood keep turning to face whoever is lost.',
  region:
    'The Lost Coast: Shelter Cove, Black Sands Beach, Petrolia and the King Range',
  hook: 'Up and down the Lost Coast, arrows are turning up in driftwood logs and wedged behind trailhead signs, pointing at places no map shows, and some of them will not hold still. Lost hikers wake with a trail drawn on the backs of their hands, and at the lowest tides, in the dark, something with a rider’s back and a horse’s legs gallops the black sand and is gone.',
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
    'Shelter Cove, Black Sands Beach, Petrolia, the Mattole River and the King Range are real places on the Lost Coast. Parts of the Lost Coast Trail are impassable at high tide, and hikers are told to carry and follow a tide chart. The April 1992 Cape Mendocino earthquakes uplifted the shoreline near Petrolia and Cape Mendocino by roughly a meter in places, leaving tide-pool life stranded above the water. Dr. Wren Okonkwo-Barlow, Socrates the horse, Hap Lindqvist and his grandson, Priya, Dmitri, the two arrow-sellers, the search and rescue volunteers, the arrows and every route they point to are invented.',
  decline: {
    label: 'Tell Priya the Lost Coast is lost for a reason',
    text: 'You tell Priya you’re busy. She sends a photo of an arrow stuck in a driftwood log. It is pointing straight at the camera. At you. You decide not to think about what that means, and you do not entirely succeed.',
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
        'The trailhead at Black Sands Beach is a parking lot with a view that keeps trying to fall into the sea. The King Range goes straight up behind you, the beach runs straight north into spray, and the board by the trail says, in several different ways, that the tide will kill you if you let it. Wedged behind the sign, neatly, not through it, is an arrow: a straight driftwood shaft, a point of filed slate, and three white fletches that look like gull feathers until you get close.',
        'Dmitri, a hydrology major with a beard he is still negotiating with, holds out the back of his left hand. Drawn on it in marker: a trail, a creek, a tide line and the number −1.1. “I got lost last night,” he says. “I sat down to cry a little. I woke up next to a fire that was already out, with this. I followed it here. It was right.”',
      ],
      approaches: [
        {
          id: 'read-arrow',
          label: 'Read the arrow like a sentence',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'Up close, the fletching is white sailcloth, notched to look like feathers. Gull feathers are federally protected; whoever made this knows the law and respects it with style. Scratched along the shaft in tiny capitals is a column of minus-tide heights and two words: WHY NOT? The arrow points north-northwest, at a rock shelf just under the surf that every map you own calls ocean. At a minus tide, you realize, it would be a road.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You pull the arrow out to look at it better, and the sign’s whole tide-warning panel slides out with it and blows down the beach. You chase it a quarter mile and catch it. You now know the tide warning by heart, which is useful, and nothing about the arrow, which is not.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'hand-map',
          label: 'Match Dmitri’s hand map against the trail board',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'The line on Dmitri’s hand matches the trail board creek for creek, until it doesn’t: at his second knuckle the drawn trail leaves the beach and runs along a shelf of rock that, on the board, is underwater. And −1.1 isn’t a ratio. It’s a tide height: a minus tide, a foot below zero, the kind that opens the impassable stretch a few nights a year. Whoever drew this was telling him when to walk, not just where.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You hold Dmitri’s hand up against the board for so long that a passing family assumes you are proposing. They clap. Dmitri, flustered, says yes to be polite. By the time everyone has been un-engaged and congratulated anyway, the drizzle has smudged the marker into a gray blur.',
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
        mara: 'Mara photographs Dmitri’s hand before the drizzle can get to it. “Evidence fades,” she says. “So do people who keep saying they’re fine. Sit down, Dmitri.”',
        kit: 'Kit sights down the arrow shaft like a scope. “Perfectly straight. Somebody spent a week on this and then gave it away.”',
        juniper:
          'Juniper reads the tide warning aloud in a cheerful voice that makes it much scarier.',
        cedar:
          'Cedar looks up at the King Range. “Road in here eats transmissions for breakfast. Anybody living out here on purpose has a reason.”',
      },
      aloneLine:
        'Alone at the trailhead, you notice the arrow is aimed a little to your left, as if it is pointing past you at somebody who is still out there.',
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
          'I got one stuck in my fence post and it won’t hold still. I remember ’92, and I don’t like things that won’t hold still.',
          'Pens are on the left past the store. I’ll be sorting ewes. I’ll have opinions.”',
        ],
      },
      body: [
        'Hap Lindqvist is seventy-nine, raises sheep, and remembers April 1992 the way other people remember the moon landing. “Three big quakes in two days,” he says. “And after, the sea had stepped back. Whole shoreline up out of the water, a yard or more. Mussels and seaweed and tide pools sitting high and dry, going white in the sun. The ground did that. Lifted the coast like a tablecloth.”',
        'The arrow in his fence post pointed at the sea all week, he says. This morning it swung round on its own and pointed at his hayloft, where his grandson has been sulking since breakfast. “Lost,” Hap says, “is a broad category.” Down on the gravel bar, hoofprints come up out of the Mattole, cross the bar and go straight up a bluff no goat would like. “Folks say it’s a horse with a man’s chest. Folks say a lot. Whatever it is, it finds lost people and doesn’t stay for thanks. My wife says it owes us a library book.” Behind him, the barn door stands open on a fletching jig and a bolt of white sailcloth. “Grandkids do archery,” Hap says, a little fast.',
      ],
      approaches: [
        {
          id: 'sheep',
          label: 'Help Hap run his ewes through the gate while he talks',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You work the gate while Hap works the dog, and he talks the whole time, mostly about lambing, which turns out to be the price of admission. It pays. “Folks call her the Professor,” he says, between ewes. “She’s a doctor. Not the useful kind. Philosophy. Taught back east twenty years, then rode in here on a horse named Socrates. Brings my wife paperbacks and argues with her about them. They both love it.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You ask Hap whether the ram is friendly. There is a pause in which a whole lamb could be born. Then the ram answers for itself, and you spend the next minute on your back in the pen being studied by forty ewes. Hap tells you, politely, that the river mouth is that way, and goes inside to tell his wife about you. Through the window you can see her laughing so hard she has to sit down.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'tide-chart',
          label: 'Lay the arrows’ marks against a real tide chart',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'Dmitri’s −1.1, and every number Priya’s club has photographed on an arrow since, is a real minus tide this month, the kind that opens the impassable stretches for a few hours. The arrow in Hap’s post has no tide on it at all. Scratched up its shaft, in a careful hand, are first names and dates going back years: everyone, you realize, it has ever pointed at. The newest is from this morning. NILS. Hap reads it twice, puts down his cup, and goes out to the hayloft to talk to his grandson.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You lay the arrows’ times against the chart and get every one perfectly wrong, because you are reading the chart for a harbor two hundred miles south. Hap points this out with deep, quiet joy. He has been waiting years for somebody to make that mistake on his porch.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'bluff',
          label: 'Follow the hoofprints up the bluff above the river mouth',
          check: { skill: 'burly', target: 9 },
          cost: 'Two hundred feet of crumbling bluff, and Hap watching from below.',
          success: {
            text: 'You go up the bluff on hands and toes, the gravel trying to send you home, and pick up the prints at the top. They follow a cliff path no wider than a horse, past a third arrow, to a fire ring still warm and a paperback annotated so heavily the margins are a second book. On the flyleaf, in square handwriting: Property of Dr. W. Okonkwo-Barlow. If found, keep reading.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Halfway up, the bluff remembers 1992 and lets go of you. You ride a small, polite landslide all the way down to the gravel bar on your back and arrive at Hap’s feet with tremendous dignity and a gasp you will never be able to take back. Hap laughs until he has to lean on the fence post. The arrow in it does not move an inch.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara photographs the hoofprints with a coin for scale. “Shod, heavy, very calm. That horse isn’t running from anything.”',
        kit: 'Kit stands on a drift log doing math on the stride. “Either that’s an enormous horse or the rider really likes jumping.”',
        juniper:
          'Juniper watches you crouch over the hoofprints. “You’re hoping it’s a centaur. That’s fine. I hoped that about a guy once.”',
        cedar:
          'Cedar shakes Hap’s hand like they’ve met before. “Everybody out here’s got a ’92 story. The ground moved a yard and my uncle’s chimney moved two.”',
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
        medium: 'note',
        from: 'Sailcloth tied to an arrow in the driftwood log outside the club’s tents',
        lines: [
          'Minus tide. −1.1. Whoever’s following my arrows:',
          'keep up, and I’ll answer one question.',
          'Bring a headlamp, a tide chart and an argument.',
        ],
      },
      body: [
        'At the bottom of the minus tide, deep in the night, the impassable stretch is passable for exactly as long as the sea allows. The surf has pulled back off the black sand and left it shining like a road, and the rock shelf from the trailhead arrow stands out of the water, dry. Headlamps bob: yours, and two more far down the beach, where a pair of guys are pulling arrows out of the logs and bagging them. They sell “authentic Lost Coast centaur arrows” online for ninety dollars, and they have already sent one family the wrong way. Spray hangs over the water like it is waiting to be introduced. Then the sound: hooves, big ones, coming hard from the north, and out of the dark comes the silhouette from every Lost Coast campfire story, a horse’s body and a rider’s back in one long shape, moving at an arrow’s speed.',
        'Dmitri swears the log was empty when he went to bed. He also admits, watching the surf, that he wasn’t only lost on the trail the other night. He’s been lost about hydrology for a semester. “I think she could tell,” he says. The deal is plain: keep up and she answers one question. She has had years of practice at not being kept up with. Behind you, the water has already started to come back.',
      ],
      approaches: [
        {
          id: 'gallop',
          label: 'Run the rider down along the hard sand',
          check: { skill: 'burly', target: 11 },
          cost: 'A flat sprint on black sand, at night, with the sea coming back.',
          success: {
            text: 'You run like the tide is behind you, because it is. The horse could lose you in a heartbeat. It doesn’t. The rider looks back, sees you still coming, and laughs out loud, a big honest bark of delight, and reins in at the far rocks. “Most people quit at the creek,” she says. “That’s either very stupid or very interesting. Let’s find out which.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You sprint a hundred yards flat out, and then the black sand takes your legs out from under you in a way sand should not legally be allowed to. You lie on your back as the hooves go by, and the horse, in passing, steps carefully over your face. You will think about how carefully for days.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'bait',
          label: 'Pretend to be lost so the rider comes to find you',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You sit on a rock with your headlamp off and your best lost face, which turns out to be very convincing. Five minutes later a big gray horse stops beside you, and a woman in an oilskin coat leans down with a marker uncapped, ready to draw you a route home. Then she sees the tide chart in your lap. “Oh, that’s dirty,” she says, admiring. “The arrow did say you were lost. You are, a little. Just not the way you’re pretending.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You sit down and look lost with total commitment. A genuinely lost hiker, an older man in a very expensive jacket, sits down next to you, relieved to have company. He is holding a ninety-dollar authentic centaur arrow he bought online and followed faithfully, here, to nowhere. The rider finds you both, draws a route on his hand, gives you a long look that grades you, and leaves. He thanks you for the moral support.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'question',
          label: 'Shout one honest question into the fog',
          check: { skill: 'psyche', target: 7 },
          success: {
            text: 'You cup your hands and shout the only question you have: “Who finds you when you get lost?” The hooves stop. The fog is quiet for a long time. Then a woman’s voice, rough from not being used much: “That is the first good question anybody has asked me in nine years.” She rides out of the fog at a walk.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You shout a question. It turns out to be “Are you a horse?” The dark is quiet for a long time. Then a woman’s voice says, very clearly, “No,” and the hooves go away north at a gallop, and you will have to live with having asked that for the rest of your life.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara stays at the waterline, watching the tide instead of the rider. “Somebody has to watch the thing that actually kills people.”',
        kit: 'Kit has strapped every spare headlamp in the club to one elastic band around her arm, a bracelet of light. “If she runs, I’m the lighthouse. Adventure is mostly logistics wearing a cape.”',
        juniper:
          'Juniper is barefoot on the freezing black sand and says she feels great, which is either nymph business or a lie.',
        cedar:
          'Cedar holds the tide chart like a hymnal. “We go when it says go, we turn back when it says turn back. I’m not rescuing anybody tonight.”',
      },
      recall: {
        'g1:north':
          'Your calves still remember the three miles of black sand from the first day, and they would like a word before you start running.',
        'g2:fail':
          'You still don’t know who the rider is. Hap’s barn, with its fletching jig and its bolt of white sailcloth, is the only theory you have.',
      },
      aloneLine:
        'Alone on wet black sand in the middle of the night, with nobody to ask whether this is a good idea, you feel more free than you have ever felt, and also, in fairness, more damp.',
    },
  ],
  coldCase: {
    title: 'The Tide Comes In',
    place: 'Black Sands Beach, Shelter Cove',
    chapter: 5,
    scene: 'beach',
    body: [
      'The arrows stop showing up. Hap says the rider went north one wet morning and didn’t come back. The trailhead sign has a tidy gap where an arrow used to be, and someone has stuffed it with a wad of gum, which feels like a statement.',
      'Dmitri’s hand map fades to a gray smudge. He swears he can still feel it itch when the tide turns.',
    ],
    choices: [
      {
        id: 'chart',
        label: 'Tape a tide chart inside your hat and never take it out',
        text: 'You do. The sea never surprises you again. It never invites you anywhere interesting again, either.',
        effects: { nerve: 1 },
      },
      {
        id: 'own-arrow',
        label: 'Leave an arrow of your own in a driftwood log',
        text: 'You carve it badly and aim it at the trailhead, toward the way out. A week later it has turned on its own to point up the beach, and that afternoon a lost birdwatcher walks out exactly where it says.',
        effects: { weird: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Rider, Dismounted',
    place: 'A meadow camp high in the King Range',
    chapter: 5,
    scene: 'meadow',
    body: [
      'She lets you walk at the horse’s shoulder up a deer trail out of the tide’s reach, two hours in the dark, to a camp high in the King Range: a spring, a tarp, a fire ring and four crates of paperbacks swollen with damp. There the centaur from every campfire story climbs down and becomes two creatures: Socrates, a gray horse the size of a small barn, who goes back to eating, and Dr. Wren Okonkwo-Barlow, sixty-one, in an oilskin coat, a ring of fletching thread on a carabiner, one lens of her glasses taped, a quiver of driftwood arrows on her back.',
      '“There’s no signal out here,” she says, without preamble. “People get lost. A phone is a brick. A map gets wet. An arrow in a log doesn’t need batteries. I mark the routes, I find the ones who wander off them, and I draw them home on the backs of their hands, because a hand is the one thing nobody loses.” Hap’s barn? “His jig. He trades me oats and sailcloth for paperbacks and lets me fletch there when it rains. He tells everybody about ’92 so nobody asks him about me.” And the headlamps down the beach? Her mouth goes flat. “Pulling my arrows to sell. One of their customers walked a toddler up the wrong creek last week. I would like a word with them that my old department would not approve of.” She hands you an arrow. It turns in your palm like a compass needle and settles, pointing back down the mountain. “Most of them I make,” she says. “Some of them I honestly can’t explain.”',
    ],
    afterMiss: [
      'You don’t catch her. You spend the rest of the night on a high boulder waiting out the tide, exactly as the sign told you to, and in the morning you trudge back to the trailhead. There is a fresh arrow wedged behind the sign, neatly, not through it, aimed up into the King Range. Scratched on the shaft: COFFEE. The route it points to is on no map, and it is exactly right. At the top, by a spring: a tarp, a fire ring, four crates of paperbacks swollen with damp, a gray horse the size of a small barn grazing, and, pouring two cups, Dr. Wren Okonkwo-Barlow, sixty-one, in an oilskin coat, a ring of fletching thread on a carabiner, one lens of her glasses taped, a quiver of driftwood arrows on her back. The centaur from every campfire story, in two pieces. “You didn’t keep up,” she says. “Sit anyway. The coffee doesn’t care.”',
      '“There’s no signal out here,” she says, without preamble. “People get lost. A phone is a brick. A map gets wet. An arrow in a log doesn’t need batteries. I mark the routes, I find the ones who wander off them, and I draw them home on the backs of their hands, because a hand is the one thing nobody loses.” Hap’s barn? “His jig. He trades me oats and sailcloth for paperbacks and lets me fletch there when it rains. He tells everybody about ’92 so nobody asks him about me.” And the headlamps down the beach? Her mouth goes flat. “Pulling my arrows to sell. One of their customers walked a toddler up the wrong creek last week. I would like a word with them that my old department would not approve of.” She hands you an arrow. It turns in your palm like a compass needle and settles, pointing back down the mountain. “Most of them I make,” she says. “Some of them I honestly can’t explain.”',
    ],
    recall: {
      'g1:hand-map':
        '“You were the one squinting at Dmitri’s hand at the trailhead,” she says. “I know. My minus sign looks like a dash. I’ve been told.”',
      'g3:question':
        '“Technically you spent your one question out on the sand,” she says. “I’m choosing to forget it. Ask another. Don’t tell anybody I’m soft.”',
      'g2:sheep':
        '“Hap says somebody spent a morning in his sheep pen asking about me,” she says. “He described your face. Not kindly, but accurately.”',
    },
    choices: [
      {
        id: 'why',
        label: 'Ask her why a professor quit to live on a beach',
        text: 'You ask. She looks at you over her taped glasses for a long moment, deciding whether you deserve the true answer. Then she sits down by the fire.',
        next: 'what-it-cost',
      },
      {
        id: 'sea-arrows',
        label: 'Ask her about the arrows she can’t explain',
        text: 'You hold up the arrow she just handed you. It has turned again in your hand. Her face lights up the way only a professor’s does when somebody finally asks the question she was hoping for.',
        next: 'arrows-i-didnt-make',
      },
      {
        id: 'let-ride',
        label: 'Thank her and let her ride on',
        text: 'You thank her, and you mean it. She tips her glasses at you like a hat and swings back up onto Socrates.',
        ending: 'rider-moves-on',
      },
    ],
    leadLines: {
      mara: 'Mara counts the arrows in the quiver. “Alone, at night, in surf, with no backup. I’m not impressed.” A pause. “I’m a little impressed.”',
      kit: 'Kit is already admiring the arrow kit, the straightening jig, the tiny files. “You built a tool to build a tool to save people. That’s my favorite kind of machine.”',
      juniper:
        'Juniper is braiding Socrates’s mane, and Socrates is allowing it, which Wren says has never once happened. “I’m keeping him,” Juniper says. Nobody is sure she is joking.',
      cedar:
        'Cedar checks Socrates’s shoes. “Shod on a new moon, I’d bet. Old farriers swear by it. I swear at it, but I do it.”',
    },
    aloneLine:
      'Alone at her fire, you get her full attention, which is a lot, like sitting in the front row of the only lecture that ever mattered.',
  },
  branches: {
    'what-it-cost': {
      title: 'What It Cost',
      place: 'Wren’s camp, by the fire',
      chapter: 5,
      scene: 'meadow',
      body: [
        '“I taught ethics for nineteen years,” Wren says. “Freedom, duty, what we owe each other. In a room with no windows. Then my nephew got lost out here for three days. A stranger found him, someone who’d marked a route with sticks. No name. Never thanked. I read about the sticks and I couldn’t teach anymore. I’d been lecturing about the good life for two decades, and somebody out here was just living it.”',
        'She feeds the fire. “Here is the honest part, since you asked. My sister called on a Tuesday to say Mom was in the hospital. I got the message on a Friday, when I rode into Petrolia for oats. The funeral was the next week. I made it to that, at least, but the Tuesday is the one I think about.” She does not look away from you. “I would make the same choice again. That’s the part I don’t like about myself. Freedom costs. It just bills you in a currency nobody else can see.”',
      ],
      choices: [
        {
          id: 'search-rescue',
          label:
            'Offer to help turn the arrows into routes search and rescue can use',
          text: 'You tell her the arrows save people, but only the ones who happen to find them. She thinks about it the way she thinks about everything, hard and out loud. “Fine,” she says. “But I keep the horse, and I don’t carry a phone.” In the night you walk down to the one bar of signal on the ridge and make the call before she can change her mind.',
          ending: 'coffee-for-ten',
        },
        {
          id: 'go-home',
          label: 'Tell her honestly she should go home for a while',
          text: 'You tell her the truth, because she would know if you didn’t: there are people waiting for her who aren’t lost. She is quiet a long time. “Good argument,” she says at last. “I hate it.”',
          ending: 'rider-moves-on',
        },
      ],
    },
    'arrows-i-didnt-make': {
      title: 'The Arrows I Didn’t Make',
      place: 'Wren’s camp, by the fire',
      chapter: 5,
      scene: 'meadow',
      body: [
        'Wren lays the strange arrows out on a tarp. Twelve of them, fletched in a hand that is not hers. “Some mornings there’s one in my quiver I don’t remember making,” she says. “It always points at somebody lost. A hiker off the trail. A kid in a hayloft. A student who picked the wrong major.” On the tarp the arrows stir like sleeping dogs, each one turning slowly toward its own somebody, out there in the dark.',
        'All but one. The last arrow lies pointed straight at her, and it does not move. “That one’s been pointing at me for nine years,” she says. “I’ve never had the nerve to follow it.”',
      ],
      choices: [
        {
          id: 'follow-hers',
          label: 'Take the arrow that points at her and follow it tonight',
          text: 'You pick it up. It does not point at her where she sits. It pulls, hard, up into the King Range and away from the fire. Wren gives you her headlamp and a look of pure envy.',
          ending: 'arrow-at-her',
        },
        {
          id: 'map-now',
          label:
            'Help her map the routes that exist now, for the people lost today',
          text: 'You slide the strange arrows back into the quiver, gently, and spread out a real map. “Let the strange ones find who they find,” you say. “Let’s make sure everybody else gets found too.” Wren laughs. “That’s practically a thesis.” In the night you walk down to the one bar of signal on the ridge and make a call.',
          ending: 'coffee-for-ten',
        },
      ],
    },
  },
  endings: [
    {
      id: 'coffee-for-ten',
      title: 'Coffee for Ten',
      tone: 'true',
      text: [
        'At first light, eight volunteers from the search and rescue team come up the deer trail, and Wren is furious. She is furious while she builds up the fire. She is furious while she grinds coffee for ten in a hand mill, and furious while she lays every arrow on the tarp and explains every creek, every tide window, every place a lost person tends to sit down and give up, while a retired court stenographer in a reflective vest writes it all down. By the fire sits a duffel bag of stolen arrows, confiscated from the two sellers on the beach at dawn by the stenographer, with a speed that suggests long practice.',
        '“I don’t join anything with a meeting schedule,” Wren says, pouring the last cup. “Noted,” says the stenographer, and writes her down anyway. Before they go, Wren draws a route home on the back of the youngest volunteer’s hand, out of habit, and under it, for the first time, the team’s phone number. Then she hands you a paperback, margins full of arguments, with an arrow on the flyleaf pointing at you. Underneath: Wrong about Kant. Write back.',
      ],
    },
    {
      id: 'rider-moves-on',
      title: 'The Rider Moves On',
      tone: 'bittersweet',
      text: [
        'Wren packs the paperbacks into Socrates’s saddlebags, leaves the camp cleaner than she found it, and rides north out of the King Range toward wherever the next lost people are. Maybe home. She doesn’t say. She doesn’t promise anything. She never has.',
        'The arrows stop. The trailhead sign gets a fresh coat of paint. But one morning at Black Sands Beach there is a last arrow wedged behind the sign, neatly, not through it, pointing up the trail toward the parking lot. Toward the way out. Toward you. Scratched on the shaft: Thank you for the company.',
      ],
    },
    {
      id: 'arrow-at-her',
      title: 'The Arrow That Points at Her',
      tone: 'strange',
      text: [
        'You follow it all night through the King Range, over ridges you could not name, past creeks that run the wrong way in the dark, the arrow tugging in your hand like a dog on a lead. It never once points back. Then, at the gray end of the night, it brings you out of the trees and back to her own fire, from the other side.',
        'Wren is sitting by it exactly the way lost hikers sit down to give up: knees up, hood up, having stopped. She looks up at you as if you have found her. You sit down beside her and don’t say anything. When you look at your hand, there is a route drawn on the back of it that you did not draw, in a hand that is not hers: a long one, east, to a town she has not been back to in nine years.',
      ],
    },
  ],
}
