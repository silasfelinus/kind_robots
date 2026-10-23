import type { Mystery } from '../types'

// Case VIII. Seed: secrets, death and rebirth, intensity, loyalty, taboo, digging deep.

export const CROW_COURT: Mystery = {
  id: 'crow-court',
  number: 8,
  sign: 'scorpio',
  title: 'The Mystery of Murder Mountain',
  tagline:
    'Every dusk, the crows of an empty homestead mourn a man who isn’t dead yet.',
  region: 'Alderpoint and the backcountry ridges above the Eel River',
  hook: 'Above Alderpoint, on a ridge nobody farms anymore, the crows gather every dusk around an empty clearing and hold what can only be called a funeral. Hikers come down with crow gifts laid out in lines, a feathered Crow Man chases off anyone who digs, and the tavern at the bend keeps getting postcards from a man the whole ridge buried six winters ago.',
  design: {
    element: 'water',
    motif: 'crows',
    palette: { sky: '#06171c', ink: '#d6ebe6', glow: '#2f8f8a' },
    stars: [
      [84, 14],
      [88, 26],
      [84, 38],
      [76, 30],
      [70, 38],
      [64, 48],
      [60, 58],
      [56, 68],
      [48, 78],
      [38, 84],
      [28, 80],
      [24, 70],
    ],
    links: [
      [0, 3],
      [1, 3],
      [2, 3],
      [3, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
      [10, 11],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. A ridge-top clearing above the Eel River at dusk, an abandoned homestead cabin with a porch slumped to one knee, a split redwood stump in the center ringed by bottle caps, a brass key and a gold ring laid in neat lines. Dozens of crows perch silent on a split-rail fence and a dead oak, wings folded like mourners, and a tall figure in a cloak of black feathers watches from the tree line. Folded ridges sink into teal fog below. Faint pearl stars over the ridge form an unlabeled curling-tailed constellation. Abyss teal, pearl and black. No text, no letters, no logos.',
  provenance:
    'Alderpoint is a real unincorporated community in southern Humboldt County above the Eel River. The nickname “Murder Mountain” is real; it was popularized by news coverage and a 2018 documentary series about the area’s reputation for violence and missing people during the black-market cannabis era. This case refers to that history only in general terms and invents no real crime, victim, case or property. Crows recognizing individual human faces for years, and gathering around their dead, are behaviors documented by university researchers. The tavern at the bend, the Pell homestead, Dot Kimura, Tamsin, Reyna and Augustine “Gus” Pell, Teo Faleolo, the Fortuna care home, the postcards, the crow gifts and the Crow Man are invented.',
  decline: {
    label: 'Tell Tamsin you don’t climb mountains with that name',
    text: 'You send back a skull emoji and immediately regret the skull emoji. Tamsin replies, “fair.” That evening, on a ridge you will never see, fifty crows bow their heads over nobody at all.',
  },
  gates: [
    {
      title: 'Why They Call It That',
      place: 'The tavern at the bend, above Alderpoint',
      chapter: 5,
      scene: 'highway',
      message: {
        medium: 'text',
        from: 'Tamsin (geology field camp)',
        lines: [
          'ok so our field camp was mapping a ridge above alderpoint',
          'a CROW MAN chased us off. feathers. like a whole guy made of feathers',
          'also the crows were having a funeral?? we’re at the tavern at the bend. it has jerky and one (1) kind of soda',
        ],
      },
      body: [
        'The tavern at the bend has no name on it, just a neon sign that has said OPE since the last time anyone bothered. Inside: four geology students in muddy rain shells, a woodstove, a jar of pickled eggs nobody has been brave enough to open, and behind the bar Dot Kimura, eighty-one, who has poured coffee on this ridge since before the road was paved. On a bar towel, laid out like evidence: three bottle caps, a gold wedding ring and a brass key, in a perfectly straight line.',
        '“The crows set them out like that,” Tamsin says. “In rows. Pointing.” One of her classmates finally asks the question the whole room has been not asking: why the mountain is called what it’s called. Dot wipes her hands. “Folks up here’ll tell you it’s for the crows. A murder of crows.” She sets the rag down. “Folks down the hill’ll tell you it’s for the other thing. Both are true, and only one of them is funny.” She does not say which. Nobody makes her.',
      ],
      approaches: [
        {
          id: 'dot',
          label: 'Buy Dot a coffee and ask whose crows they are',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You buy the coffee and drink it slowly, which up here counts as a reference. “Gus Pell’s crows,” Dot says at last. “Fed them every morning for twenty years off his porch, two scoops from a blue bin. Then Gus stopped coming down the hill. Six winters ago.” She shrugs at the window. “Folks decided he died. Up here, when you stop showing up, folks decide things.” She taps the ring. “That’s not his, though. Gus’s ring was plain.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You ask too fast and too cheerfully, like a podcast. Dot’s face closes like a screen door. She sells you a pickled egg you did not order and goes to talk to the woodstove, which has better manners. A man at the end of the bar tells you, kindly, that up here you earn a story by sitting still long enough to deserve one.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'gifts',
          label: 'Study the crow gifts lined up on the bar towel',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'Two of the bottle caps are from breweries you know. The third, small and gold with a leaping salmon on it, is from a brewery nobody in the room has ever heard of. The key is old brass, the kind for a padlock on a gate. And inside the wedding ring, tiny and fresh, is an engraving: R + J, and a date four years from now. Tamsin reads it over your shoulder and stops chewing her jerky.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You pick up the ring to read the inside, and a crow on the porch rail sees you do it. It starts yelling. Three more join in. By the time you put the ring back, every window of the tavern is lined with furious black birds and Dot is looking at you like you tracked something in on your shoes.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'dusk',
          label: 'Hike up and watch the crows hold their funeral at dusk',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You sit at the edge of the clearing as the light goes amber. The crows come in from every ridge, forty, fifty, and land on the fence and the dead oak without a sound. Biologists say crows really do gather around their dead like this, to learn what killed them. But there is no dead crow in the clearing. There is nobody at all. They are mourning a stump, a patch of dirt, and something that hasn’t happened yet.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You fidget. Crows notice fidgeting. The whole congregation turns its heads to you at once, decides your face is a problem, and escorts you back to your car with commentary. One of them rides on the roof a full mile down the switchbacks, shouting at the windshield, and you are fairly sure it is reading your mail.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara turns the ring in the lamplight without touching the engraving. “Somebody’s going to get married with this. I just don’t know when ‘going to’ is.”',
        kit: 'Kit lines the bottle caps back up the way the crows had them. “That’s not random. That’s a pointer. Birds built a pointer.”',
        juniper:
          'Juniper waves at the crows on the porch rail, and two of them lift one wing back at her, which crows do not do.',
        cedar:
          'Cedar takes his cap off for Dot. “My mom’s people are from up a road like this. You don’t ask what somebody grew. You ask if they need a ride.”',
      },
      aloneLine:
        'Alone at the bar, you get the full Dot treatment: one coffee, no questions, and a look that says she will decide about you later.',
    },
    {
      title: 'Postcards From a Dead Man',
      place: 'The old Pell homestead, the clearing',
      chapter: 5,
      scene: 'meadow',
      message: {
        medium: 'note',
        from: 'Postcard pinned behind the tavern register',
        lines: [
          'Dear Crows. Blue bin, two scoops, not three. You’ll get fat.',
          'Tell R. it’s the wrong side of the stump. The side with the sun at supper.',
          'Don’t let anybody else dig. — Gus P.',
        ],
      },
      body: [
        'Dot has eleven of these behind the register, all addressed to The Crows, care of the bar at the bend, all postmarked Fortuna, all signed by Augustine “Gus” Pell, whom the whole ridge quietly buried six winters ago. The handwriting wobbles like it is walking downhill. A second hand, round and patient, has fixed his spelling in pencil.',
        'The homestead is an hour up a dirt road that is mostly a suggestion. A cabin with its porch slumped to one knee, a blue plastic bin on the rail, a split redwood stump in the middle of the clearing, and around the stump, holes. Fresh ones, none of them deep. Somebody digs here every night and quits every time the crows land.',
      ],
      approaches: [
        {
          id: 'wrong-side',
          label: 'Work out which side of the stump is “the wrong side”',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'The sun at supper is west. Dot said Gus always called the west “the wrong side” because it was where the day went to get away from him. Every fresh hole in the clearing is on the east side. Whoever has been digging has been reading the postcards too, and reading them exactly backwards. You plant a stick on the west side, and the crows on the oak go quiet in a way that feels like approval.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You decide “the wrong side” means downhill, because that is the side you would least like to dig on. You dig a very respectable hole there. It contains roots, a rusted sardine tin and a deep sense of being watched by fifty crows who know exactly how wrong you are and have decided not to say.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'faces',
          label: 'Stand in the open and let the crows decide about your face',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'Crows remember faces. Researchers in Seattle once trapped a few birds while wearing a rubber caveman mask, and years later crows that had never been caught still scolded anyone who wore it. So you stand still, bare-faced and harmless, while fifty birds study you. One drops from the oak and lays a gold bottle cap at your feet, salmon side up. You have been entered into the record.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You last ninety seconds. Then a crow lands close enough that you can see its eyes, and your face does something nervous and guilty all on its own. The crows note it. For the rest of the case, every crow on the ridge gives you the specific look a teacher gives a student she has already heard about.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'postmark',
          label: 'Trace the round, patient pencil back to Fortuna',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'The pencil has the loops of someone who fills out a lot of forms. Two postcards carry a smudged ink stamp on the back, half scraped off: a care home in Fortuna, residents’ mail. You call. A young man named Teo answers, says he is an aide, and says carefully that he cannot confirm who lives there. Then, before you can hang up, he asks, “Are the crows okay?”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You trace the postmark to Fortuna and then to every mailbox in Fortuna, which is a lot of mailboxes. By sunset you have learned the complete history of the town’s post office, three strong opinions about the Rohnerville airport and nothing whatsoever about Gus.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara reads the postcards twice. “The pencil loves him. Pencil is for people you don’t want to embarrass.”',
        kit: 'Kit measures the holes against her forearm. “Same depth every time. Somebody digs until something scares them, then stops.”',
        juniper:
          'Juniper lays her palm flat on the stump. “It’s keeping something warm for somebody. Stumps do that.”',
        cedar:
          'Cedar lifts the lid of the blue bin, finds it full of fresh peanuts, and closes it again very slowly. “Somebody’s still feeding them. Somebody alive.”',
      },
      aloneLine:
        'Alone in the clearing, you feel fifty pairs of eyes take your measurements and file them somewhere permanent.',
    },
    {
      title: 'The Crow Man',
      place: 'The old Pell homestead, at dusk',
      chapter: 5,
      scene: 'grove',
      message: {
        medium: 'voicemail',
        from: 'Dot (tavern landline), 0:38',
        lines: [
          '“It’s Dot. Two fellas with a metal detector and a lot of opinions just bought jerky and asked about Gus’s money.',
          'I told them there isn’t any. They didn’t like that answer.',
          'If you’re going up tonight, go before they do. And be polite to the birds.”',
        ],
      },
      body: [
        'The plan is classic and nobody is proud of it: catch the Crow Man before the treasure hunters do. At dusk the crows come in over the ridge, silent, and settle around the stump for their funeral. Then, from the tree line, comes the rattle, a long dry clatter like a bag of bones in a dryer, and a shape steps out: seven feet of black feathers and a beak like a pickaxe.',
        'Down the road, headlights. The metal-detector guys are early. The Crow Man’s head snaps toward them, then toward you. It has to decide who to chase first, and so, suddenly, do you.',
      ],
      approaches: [
        {
          id: 'hold',
          label: 'Stand your ground in the clearing while it charges',
          check: { skill: 'psyche', target: 11 },
          cost: 'Seven feet of feathers at a dead run, and you have to not blink.',
          success: {
            text: 'It charges. You do not move. The crows do not move either, and that is the clue: they are not afraid of it. At the last second the Crow Man skids to a stop, beak inches from your nose, and under the mask you hear a woman breathing hard and saying a word that is not a crow word. The crows hop down onto the stump behind you. They have picked a side, and it is not against you.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You hold your ground for almost a full second, which is longer than most people manage. Then you are running through the manzanita making a sound you will deny later. The Crow Man stops at the clearing’s edge and does not follow. Behind you, fifty crows laugh in the specific, unhurried way crows laugh.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'trap',
          label:
            'Rig the classic trap: a tarp, a rope and the blue bin of peanuts',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You set the blue bin by the stump as bait, because nobody who feeds these crows could stand to see it kicked over. The Crow Man spots the treasure hunters’ headlights, sprints to guard the bin, and steps square onto the tarp. Your knot does the rest. The tarp scoops the Crow Man up and swings it gently from the oak like a feathered burrito, while the crows gather underneath to inspect the situation.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'The trap springs perfectly on the first person who steps on it, a metal-detector guy named Brent. He swings from the oak in a tarp burrito, yelling about lawyers, while the Crow Man stands at the edge of the clearing with its feathered arms folded, watching, and possibly laughing. The crows definitely are.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'scare',
          label: 'Help the Crow Man run the treasure hunters off first',
          check: { skill: 'burly', target: 7 },
          success: {
            text: 'You grab a rattle-stick you did not know you would need, and together you and the Crow Man come out of the dark shrieking. The treasure hunters leave so fast they leave the metal detector. The Crow Man turns to you, breathing hard, beak knocked sideways, and for one second it is obvious you are both just people who ran very hard downhill in the dark.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You trip over a hole someone dug last night and go face-first into the dirt. The treasure hunters see you sprawled there, decide you are the Crow Man’s latest victim, and flee screaming. Technically it worked. A gloved hand helps you up, brushes off your shoulder, and is gone before you can say thank you.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara pulls her hood up. “If it comes for you, I’m stepping in. If it’s just a guy in a costume, I’m stepping in harder.”',
        kit: 'Kit is up the dead oak with the rope before the plan is finished. “Trap from above. It’s always from above.”',
        juniper:
          'Juniper hums something low, and the crows on the fence stop rustling to listen.',
        cedar:
          'Cedar leaves his truck lights off and his keys in. “Nobody’s getting chased down this road tonight. Not even the bad guys.”',
      },
      aloneLine:
        'With nobody to catch you if you run, you decide, for once, not to run.',
    },
  ],
  coldCase: {
    title: 'The Crows Go Quiet',
    place: 'The tavern at the bend',
    chapter: 5,
    scene: 'highway',
    body: [
      'The postcards stop coming. The Crow Man is seen once more, at the bottom of the dirt road, and then not at all. The holes around the stump fill with rain. Up on the ridge, the crows still gather at dusk around nothing, which nobody up here considers strange anymore.',
      'Dot sets your coffee down in front of the row of crow gifts, still on its bar towel. “Some things up here don’t want to be found,” she says. “And some things just haven’t been asked right.”',
    ],
    choices: [
      {
        id: 'peanuts',
        label: 'Leave a handful of unsalted peanuts on the porch rail',
        text: 'You leave them in a straight line. In the morning they are gone, and in their place is a gold bottle cap with a salmon on it, from a brewery that doesn’t exist yet.',
        effects: { weird: 1 },
      },
      {
        id: 'coffee',
        label: 'Stay for a second cup and let Dot talk',
        text: 'She talks about the ridge before the road, the winters, the people who came up here to start over, the ones who made it and the ones who didn’t. You listen. Up here, that counts.',
        effects: { goodwill: 1 },
      },
    ],
  },
  reveal: {
    title: 'Unmasking the Crow Man',
    place: 'The old Pell homestead, the clearing',
    chapter: 5,
    scene: 'grove',
    body: [
      'The Crow Man stands in the clearing with the crows settling around its boots: fifty silent mourners and one costume made of black contractor bags, cut into feathers by somebody patient. You reach for the mask, the way it always goes. A gloved hand slaps yours away. “I’m not a land developer,” says a tired woman’s voice, “if that’s what you were hoping.” She takes it off herself.',
      'Reyna Pell is forty-four, sunburned, with her father’s jaw and a school-bus driver’s whistle on a cord around her neck. “Dad’s not dead,” she says. “He’s in Fortuna. He has dementia. Most days he doesn’t know my name, but every morning he asks Teo if somebody fed the crows. He buried something up here for me and he can’t tell me where anymore. So I dig, and the treasure hunters dig, and I scare them off, and nobody finds it.”',
      'She looks down at the dark folds of the Eel. “You know why I never corrected anybody? Because up here, when a man stops coming to town, folks down the hill think the other thing. Sometimes they’re right. There are families who still drive these roads every year with a photo on the dashboard, asking at every tavern, and their people didn’t go to a care home in Fortuna.” She wipes her eyes with a plastic-feathered sleeve. “I’m the lucky one. I know that. It doesn’t help as much as you’d think.”',
    ],
    choices: [
      {
        id: 'fortuna',
        label: 'Offer to drive down to Fortuna with her tonight',
        text: 'You say it before you think it through. Reyna looks at you for a long moment, then at the crows, then picks up her keys.',
        next: 'care-home',
      },
      {
        id: 'dig',
        label: 'Dig on the wrong side of the stump, together',
        text: 'You point west, where the sun went down. Reyna starts to laugh, stops, and picks up the shovel.',
        next: 'wrong-side',
      },
      {
        id: 'leave',
        label: 'Hand her back the mask and walk down the hill',
        text: 'You hand her the mask. Some things belong to the people who have to carry them. You walk down in the dark with fifty crows watching you go.',
        ending: 'let-it-stay-buried',
      },
    ],
    leadLines: {
      mara: 'Mara steps between Reyna and the road without being asked, in case those headlights come back.',
      kit: 'Kit unties the rope from the oak and coils it slowly, like she is giving everyone time.',
      juniper:
        'Juniper sits on the stump among the crows. “They’ve started missing him early,” she says. “Crows get ahead of themselves.”',
      cedar:
        'Cedar says quietly, “My grandpa forgot my name his last year. Never forgot where the good fishing hole was. It’s not personal. It’s just where things get kept.”',
    },
    aloneLine:
      'Alone with her and the crows, you realize you are the only person on this ridge who knows her father is alive, and that she has just trusted you with it.',
  },
  branches: {
    'care-home': {
      title: 'Residents’ Mail',
      place: 'A care home in Fortuna',
      chapter: 5,
      scene: 'plaza',
      body: [
        'Teo Faleolo meets you at the side door at ten at night, in scrubs and slippers. “He’s up,” he says. “He’s always up when the crows are on his mind.” Gus Pell is eighty-three, in a cardigan buttoned wrong, at a table covered in blank postcards. He looks at Reyna with polite interest, the way you look at a nice stranger on a bus. Then he looks at you. “You’ve been up the hill,” he says. “You smell like my birds.”',
        'Teo shows you the routine: every Tuesday Gus dictates, Teo helps with the spelling, and they mail it to the bar at the bend. “He thinks the crows can read,” Teo says. “I don’t argue. Honestly, I’m not sure they can’t.” Gus is drawing on a postcard now: a stump, an arrow, and the sun going down.',
      ],
      choices: [
        {
          id: 'bring-him',
          label: 'Ask Teo if Gus can come up the hill for one dusk',
          text: 'Teo checks the rules, then the weather, then his conscience, and goes to find a wheelchair with good tires.',
          ending: 'crows-remember',
        },
        {
          id: 'let-him-rest',
          label: 'Let Gus finish his postcard and leave him where he’s warm',
          text: 'You watch him finish the drawing. Reyna takes it, kisses the top of his head, and says she will see him Sunday. He tells her she seems like a very nice girl.',
          ending: 'let-it-stay-buried',
        },
      ],
    },
    'wrong-side': {
      title: 'The Wrong Side of the Stump',
      place: 'The old Pell homestead, west of the stump',
      chapter: 5,
      scene: 'grove',
      body: [
        'Two feet down on the west side, where the sun goes at supper, the shovel hits tin. It is a coffee can, the big kind, rusted at the rim and sealed with tape that has outlived several presidents. Inside: a roll of old bills, not much, a careful man’s whole savings, and a bundle of envelopes in a bread bag, each addressed in a strong hand that does not wobble yet: For Reyna.',
        'The crows come down from the oak at once, all of them, and stand around the hole in a silent ring. Not a funeral now. Something else, like a jury waiting for a verdict. One hops forward and drops the brass key into the can. It fits nothing in there. It is for something that doesn’t exist yet.',
      ],
      choices: [
        {
          id: 'carry',
          label: 'Carry the can down so Gus can hand it to her himself',
          text: 'Reyna holds the can like it is a person. In Fortuna, Teo hears the whole story and says there is only one right way to do this: bring Gus up the hill.',
          ending: 'crows-remember',
        },
        {
          id: 'open-hand',
          label: 'Kneel by the hole and hold out an open hand to the crows',
          text: 'You kneel and hold out your hand, palm up, the way Gus must have every morning for twenty years. The nearest crow studies your face for a long time. Then it steps onto your wrist.',
          ending: 'murder-adjourned',
        },
        {
          id: 'rebury',
          label: 'Help Reyna put it back exactly where he left it',
          text: 'Reyna reads the first line of the first letter, stops, and folds it closed. “Not yet,” she says. “Not while he’s still here.” You fill the hole together.',
          ending: 'let-it-stay-buried',
        },
      ],
    },
  },
  endings: [
    {
      id: 'crows-remember',
      title: 'The Crows Remember',
      tone: 'true',
      text: [
        'Gus Pell comes up the hill at dusk in a borrowed wheelchair with good tires, Teo pushing and Reyna walking beside him with the coffee can. He does not know the road. He does not know the cabin. Then the crows come in over the ridge, and he lifts both arms like a man who has done it every morning for twenty years, and they land on him: wrists, shoulders, the brim of his cap. Crows remember a face for years. These remember his exactly.',
        'Nobody holds a funeral that night. Reyna reads the letters aloud by headlamp, every one, and they are plain and loving and occasionally about tomatoes; in the last, he apologizes for never being much of a talker. When she finishes, a crow walks down his arm and drops the gold ring into her palm, R + J, four years early. “For your wedding,” Gus says, suddenly clear. “Tell her I liked her.” Down at the bar at the bend, Dot pins that week’s postcard over the register and never takes it down.',
      ],
    },
    {
      id: 'let-it-stay-buried',
      title: 'Let It Stay Buried',
      tone: 'bittersweet',
      text: [
        'Reyna hangs the Crow Man cloak on a nail inside the cabin door and lets the rumor of buried money die of boredom. Whatever is in the ground stays there. She drives to Fortuna every Sunday instead, and Gus is glad to meet her every time, and the postcards to the crows keep coming on Tuesdays in two kinds of handwriting.',
        'Up on the ridge, the crows still gather at dusk around the stump and bow their heads over nothing. They are early, and they seem to know it, and they practice anyway. Some evenings Reyna drives up to watch them. She says it helps, a little, to know someone else is getting ready.',
      ],
    },
    {
      id: 'murder-adjourned',
      title: 'A Murder, Adjourned',
      tone: 'strange',
      text: [
        'The crows take your face into the permanent record, and this time it is a good entry. The funeral stops. The next dusk they gather around the stump and simply look at you, all of them, until you understand that court is adjourned and you are the new keeper of the blue bin: two scoops, not three, every morning. Reyna gives you the key to the gate. In Fortuna, Gus is told, and nods like he had already heard.',
        'Then the gifts start. A bottle cap from a brewery that opens next spring. A bus transfer for a route that doesn’t run yet. A photo-booth strip of strangers laughing at a wedding that hasn’t happened. And once, laid neatly on your porch rail, a postcard addressed to The Crows, care of the bar at the bend, in your own handwriting, postmarked a year from now.',
      ],
    },
  ],
}
