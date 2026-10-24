import type { Mystery } from '../types'

// Case II. Seed: patience, stubbornness, loyalty to the land, pleasure and comfort, money.

export const STUBBORN_HERD: Mystery = {
  id: 'stubborn-herd',
  number: 2,
  sign: 'taurus',
  title: 'The Mystery of the Stubborn Herd',
  tagline:
    'A glowing calf leads the dairy cows off the low fields, one night at a time.',
  region: 'The Eel River bottoms, between Loleta and Ferndale',
  hook: 'Down in the Eel River dairy country, a calf that glows like a night-light has been leading the Quaresma herd off certain pastures after dark, and by morning the cows refuse to set foot on those fields again. Aged cheese wheels are vanishing from the Quaresma Family Creamery’s cave. And a developer’s survey crew keeps getting chased off the bottomland by very slow, very determined cows.',
  design: {
    element: 'earth',
    motif: 'herd',
    palette: { sky: '#1c1a10', ink: '#d9c48a', glow: '#8a9a3e' },
    stars: [
      [36, 56],
      [42, 48],
      [50, 40],
      [72, 18],
      [44, 60],
      [54, 62],
      [80, 50],
      [24, 68],
      [16, 30],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [0, 4],
      [4, 5],
      [5, 6],
      [0, 7],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. The Eel River bottoms at night, flat green pastures cut by a silver slough, a white dairy barn and cypress windbreak on a low hill, tule fog lying in the fields. A herd of black-and-white dairy cows walks single file uphill, led by a small calf that glows a soft gold-green, the herd’s line curving like a bull’s horn across the field. Below them, faint tidewater shines where the grass should be. Faint brass stars over the barn form an unlabeled V-shaped constellation with two long horns. Moss green, umber and brass. No text, no letters, no logos.',
  provenance:
    'The Eel River bottoms and the dairy country around Loleta and Ferndale are real, and Portuguese immigrant families are a documented part of the valley’s dairy history; that history is referred to here only in general terms, as is the documented Eel River flood of 1964. Sea-level rise is a real and studied concern for the Eel River estuary and its low-lying farmland. The Quaresma Family Creamery, Alma and Rosie Quaresma, the survey crew, Bayline Coastal Holdings and every other person, business and event are invented. No real creamery, dairy or family is depicted.',
  decline: {
    label: 'Text Rosie back that you are lactose intolerant, which is a lie',
    text: 'Rosie replies “totally fine!!” with two exclamation points, which is how you know it is not. An hour later she sends a photo of a twenty-pound wheel of aged cheese and the words “your loss,” and she is right. You eat dry toast for dinner and think about that wheel for a week.',
  },
  gates: [
    {
      title: 'The Empty Shelf',
      place: 'The Quaresma Family Creamery, the aging cave',
      chapter: 5,
      scene: 'meadow',
      message: {
        medium: 'voicemail',
        from: 'Rosie (Quaresma Family Creamery), 0:52',
        lines: [
          '“Hi, it’s Rosie, from the creamery? The cheese one. Four more wheels are gone from the cave. The old ones. Eighteen-month minimum.',
          'Come taste stuff and solve crimes. I will feed you. Please. My grandma is eighty and terrifying and also my boss.',
          'Don’t call back on this number. She answers it.”',
        ],
      },
      body: [
        'The Quaresma Family Creamery is a white barn, a tasting room with six stools and a cave dug into the foot of the only real hill for a mile. Rosie, who is twenty and runs the counter, the website and the goat, sets out a tasting flight before you have even sat down. She has a smear of gold-green paint on one wrist that she blames on the menu board. “Rule one,” she says. “You eat while you investigate. Rule two: do not let Alma see you near the cave. She thinks I called the sheriff. I did not call the sheriff. I called you.”',
        'Inside the cave it is cool and smells like butter, salt and time. The floor of the lowest bay is damp and gritty, one whole low shelf is bare, and fresh scrape marks lead through the dirt to the back door. Out the cave door, the herd is grazing only on the hill. The flat green fields below it are completely empty.',
      ],
      approaches: [
        {
          id: 'tasting',
          label: 'Accept the full tasting flight and charm Rosie between bites',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You go slow. You taste everything twice. By the sixth cheese, Rosie is talking freely, and she mentions that the missing wheels were all made by Alma herself, the old recipe, the ones Alma calls “the family.” Nobody steals a cheese for the money, Rosie says. You could make more selling the shelves. Whoever is taking these is taking them because they love them.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You go fast. You eat the garnish. You eat the decorative fig. You eat a cube of wax by accident and pretend it was on purpose. Rosie watches you in silence, then gently takes the board away. “Okay,” she says. “You can still help. Just not with your mouth.”',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'alma-stare',
          label: 'Knock on the farmhouse door anyway and hold Alma’s stare',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'Alma Quaresma opens the door before you knock: eighty, five feet tall, built like a fence post. She looks at you for so long that the porch light clicks off on its timer. You do not look away. Finally she says, “Hm,” and lets you into a kitchen where a felt calf’s ear is pinned under a sewing machine, half restitched in green thread. “For the pageant,” she says, and does not say which pageant. The radio is playing an old Portuguese song, and she hums along without noticing.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'Alma Quaresma opens the door and looks at you. You last four seconds, then hear yourself apologizing, for what you are not sure. She hands you a wedge of cheese in wax paper, says, “The wheels are safer than you are,” and shuts the door. It is excellent cheese. It is also, very clearly, a bribe, and you took it.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'scrapes',
          label:
            'Follow the scrape marks out the back door and across the dark field',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'The scrape marks become wheelbarrow tracks that go uphill, not down: away from the road, away from any getaway car, toward an old hay barn at the top of the hill. Inside, stacked neatly on new shelves and wrapped in cheesecloth, are all the missing wheels. Somebody did not steal them. Somebody moved them uphill, one at a time, at night.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You follow the tracks straight into a drainage ditch full of last week’s rain. A cow on the far side watches you climb out, chewing, without one ounce of sympathy. You squelch back to the tasting room. Rosie does not ask.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara reads the cave’s inventory board, chalk on slate, and taps one blank row. “Four wheels gone, and somebody erased them neatly. Thieves don’t tidy.”',
        kit: 'Kit inspects the cave’s old rolling shelves. “These run on bicycle chain. Somebody built this cave to move.”',
        juniper:
          'Juniper is negotiating with the goat, or possibly with Rosie about the goat. “If I solve this, I get him. Nobody has said no yet.”',
        cedar:
          'Cedar crumbles a bit of cheese for the goat. “Cheese this old should be paying property tax.”',
      },
      aloneLine:
        'Alone in the cave with nothing but your breath and two hundred wheels of cheese, you understand for the first time how long eighteen months really is.',
    },
    {
      title: 'The Pasture Nobody Will Graze',
      place: 'The Eel River bottoms, the low fields',
      chapter: 5,
      scene: 'marsh',
      message: {
        medium: 'text',
        from: 'Trevor (Bayline Coastal Holdings, survey crew)',
        lines: [
          'hi this is trevor from the survey crew at the quaresma parcel. rosie gave me ur number',
          'cows chased us off AGAIN. they dont run. they just walk at you very slowly forever',
          'also there was a glowing calf and i would like someone else to have seen it. thank you',
        ],
      },
      body: [
        'The low fields along the slough are perfect pasture: deep green, flat, wet at the edges. The cows will not touch them. Trevor and his partner Inez have pounded orange-flagged stakes in a grid across the fields for forty-eight luxury homes called Tidewater Meadows, and every morning half the stakes are pulled up and stacked in a tidy pile by the gate.',
        'When you arrive, a line of twenty dairy cows is standing at the fence, watching. Trevor is holding his surveying rod like a sword. Inez is eating a sandwich and has clearly made her peace with whatever happens next. Trevor waves a folder at you. “We’re not trespassing. There’s an option on this parcel. Signed.” Inez, chewing: “By a Quaresma. Not the one who’s eighty.”',
      ],
      recall: {
        'g1:scrapes':
          'Every cow at the fence is facing uphill, toward the old hay barn, like they’re waiting for something to come down from it.',
      },
      approaches: [
        {
          id: 'restake',
          label:
            'Take Trevor’s mallet and re-drive the pulled stakes yourself, herd or no herd',
          check: { skill: 'burly', target: 9 },
          cost: 'The mallet weighs twelve pounds, and twenty cows are watching every swing.',
          success: {
            text: 'You take Trevor’s mallet and start re-driving the pulled stakes down the line. It is honest, heavy work, and the herd watches every swing. At the third stake the hole fills with water before you can pull the mallet back. You taste it off your finger: salt, a mile from the bay. You drive twelve stakes. Every stake that was pulled up is standing in salt water within the minute. Every one that was left alone sits in dry dirt. Inez applauds with her sandwich.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You take Trevor’s mallet and swing for the first stake. The herd starts walking toward you, slowly, and keeps walking. You get one stake in, crooked, before twenty cows arrive and lean on you very gently until you are inside the surveyors’ truck. They stand around it, chewing, for forty minutes. Trevor uses the time to tell you about his divorce.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'old-maps',
          label:
            'Lay the old field maps over the county’s sea-level planning maps',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'Inez has the county’s public sea-level-rise maps on her tablet. You lay them over the creamery’s hand-drawn 1950s field map that Rosie lent you. The fields the cows refuse are not a random scatter. They follow one shaded line exactly, a line labeled in small type with a year not very far off, where the tide is projected to come up through the grass. Inez puts down her sandwich.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You hold the old map upside down for ten minutes before Inez gently turns it over. By then a cow has eaten the corner with the legend on it. You know the fields are shaded. You do not know what the shading means, and the cow is not sharing.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'walk-with',
          label: 'Ignore everyone and walk with the herd wherever it goes',
          check: { skill: 'psyche', target: 7 },
          success: {
            text: 'You fall in among the cows and let them set the pace, which is the pace of a geological event. It takes an hour to cross one field. The herd walks uphill, stops at the old hay barn and lies down all at once, facing the bottoms, like a congregation. In the mud at the barn door are small hoofprints that glow faintly, then fade, and a human boot print beside them, size six.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You fall in among the cows and lose patience after eleven minutes. You try to hurry them. They do not hurry. One of them steps on your foot and leaves it there with total serenity while she finishes her thought. You limp back to the truck to find Trevor has eaten your sandwich and most of Inez’s.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara studies the herd. “They’re not scared. They’re making a point. I’ve had clients like this.”',
        kit: 'Kit pulls up a survey stake and sights along it. “Every stake they pulled was below the same height. Cows don’t do math. Somebody does.”',
        juniper:
          'Juniper stands barefoot in the low field and shivers. “It’s already salt under here. Just not yet.”',
        cedar:
          'Cedar watches the slough. “My dad says this all flooded in sixty-four. Folks forgot. Cows didn’t.”',
      },
      aloneLine:
        'With no one beside you, you stand in the empty low field long enough to feel how wet it is under the green.',
    },
    {
      title: 'The Calf by Moonlight',
      place: 'The Quaresma hill, the old hay barn',
      chapter: 5,
      scene: 'meadow',
      message: {
        medium: 'email',
        from: 'Rosie, forwarding Bayline Coastal Holdings',
        lines: [
          'they’re fencing it. tonight is the last night. alma printed this out just to glare at it',
          '> You’re invited! COMMUNITY OPEN HOUSE, Tidewater Meadows. 48 luxury homes. On site, tomorrow 2 pm. Refreshments!',
          '> Due to repeated vandalism, a fence crew and site security will be present from 6 am.',
        ],
      },
      body: [
        'The open house is tomorrow afternoon. If the stakes are pulled one more time, Bayline will bring in a fence crew and a security guard, and the cows will lose the bottoms one way or the other. Tonight is the last chance to catch the glowing calf before somebody less patient does.',
        'Rosie gives you the barn key, a bag of day-old sweet bread and the best wheel in the cave, the one Alma calls the grandmother. She says she found the missing wheels this morning, stacked in the old hay barn at the top of the hill, and has not told Alma. She says all of this very fast, then, quieter: “Dad signed something on the bottoms when the cave cooler died. Grandma hasn’t spoken to him since.” Then she has to go close out the register. The moon is up. Tule fog lies in the low fields like spilled milk. Down the hill a cow lows once, and the whole herd stands up.',
      ],
      recall: {
        'g1:scrapes':
          'You followed those scrape marks out the cave door yourself, the first night. Rosie talks right past that, very fast, and does not meet your eye.',
        'g2:old-maps':
          'The fog in the low fields lies exactly along the shading you saw on the maps, as if it had read them too.',
      },
      approaches: [
        {
          id: 'cheese-bait',
          label: 'Bait the barn with the grandmother wheel and wait',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You set the grandmother wheel on an upturned crate in a pool of moonlight and string a rope to the barn door. At 2:50 a.m. the glowing calf comes in on its odd-jointed legs, sees the cheese, and gasps out loud. A calf does not gasp. It reaches for the wheel with both hands, and you pull the rope, and the door swings shut, and the calf sits down heavily on a hay bale and says, “Well, damn,” in a voice trying very hard to sound old.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You set the bait perfectly and then fall asleep in the hay. You wake to find the cheese gone and, in its place, a perfectly decent sandwich in wax paper with a note: THIS ONE IS FOR YOU. YOU LOOK HUNGRY. The capitals are neat and round, like the ones on the tasting-room menu board. Out the barn door, something glowing is already trotting back down to the herd.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'wrangle',
          label:
            'Wrangle the glowing calf by hand when it comes through the field',
          check: { skill: 'burly', target: 7 },
          success: {
            text: 'The calf comes up out of the fog leading a dozen cows uphill, and you vault the fence and tackle it as gently as anyone has ever tackled anything. It is softer than it should be. It is made of felt and glow paint and stuffing. It is swearing in two languages. The cows form a circle and look down at the two of you like a committee that has been kept waiting. You help it up, and it limps beside you to the barn without being asked.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You vault the fence, slip on wet grass and slide on your back through a cow pie the size of a welcome mat. The glowing calf steps neatly over you. As it passes, it reaches down and pats you once on the head, the way someone’s grandmother would.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'outwait',
          label: 'Sit with the herd in the dark and refuse to leave first',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You sit in the grass among the cows and do not move for four hours. Neither do they. Near moonset, the glowing calf comes up the hill, stops and stares at you. You stare back. You are both very stubborn. Finally it sighs, sits down beside you and says, in a creaky old-woman voice that cracks halfway into somebody much younger, “Fine. You win. Don’t tell Alma I sat down.” Then it brushes off its felt knees and walks with you to the barn.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You last three hours. Then a cow lies down on your coat, which you were wearing, and you have to choose between your dignity and your circulation. You choose circulation. Across the field, something glowing laughs, not unkindly, and goes back down into the fog.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara sits on a hay bale sketching the herd by moonlight, one cow a minute. “Wake me when the calf comes. I won’t be asleep.”',
        kit: 'Kit rigs the barn door with a rope and a bicycle pulley. “Gentle trap. Nobody gets hurt. Especially not the cheese.”',
        juniper:
          'Juniper braids a cow’s tail while she waits. “If you fall asleep, I’m telling Rosie you snore. If you don’t, I’m telling her anyway.”',
        cedar:
          'Cedar sits on his tailgate with the CB off for once. “Some things you don’t chase. You just wait for ’em to come home.”',
      },
      aloneLine:
        'Alone on the hill, with forty cows breathing in the dark around you, you are less alone than you have been in weeks.',
    },
  ],
  coldCase: {
    title: 'The Stakes Go In',
    place: 'The Eel River bottoms, the day of the open house',
    chapter: 5,
    scene: 'marsh',
    body: [
      'The open house happens. There are refreshments. The stakes stay in the ground this time, and a fence goes up around the low fields. The cows stand on the hill and watch it all without blinking.',
      'Rosie texts a photo of the cave. The missing wheels are back on their shelf, every one, with a note in neat round capitals: I WILL TRY SOMETHING ELSE.',
    ],
    recall: {
      'g3:pass':
        'You had the calf in the barn at dawn, felt and glow paint and all. But you never worked out the cheese or the low fields, so you had no idea what to ask it. Then somebody’s phone buzzed, not yours, and the calf said, “Bathroom,” in a hurry, and was gone down the hill into the fog.',
    },
    choices: [
      {
        id: 'buy-wheel',
        label: 'Buy a wheel of the old recipe while there still is one',
        text: 'You buy a wedge of the grandmother wheel and eat it slowly over a month. It tastes, faintly, of salt water, and you cannot decide whether that was always in the recipe.',
        effects: { weird: 1 },
      },
      {
        id: 'public-comment',
        label:
          'Show up at the county hearing on Tidewater Meadows and ask what happens to the low fields',
        text: 'You stand at the microphone and ask. A county planner pulls up the public sea-level map and reads the projected tide line, field by field, and the room goes quiet. Nobody claps. Three people come up afterward and ask for a copy.',
        effects: { goodwill: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Calf in the Barn',
    place: 'The Quaresma hill, the old hay barn',
    chapter: 5,
    scene: 'meadow',
    body: [
      'The glowing calf sits on a hay bale in the barn, slightly deflated, glow paint smudged on its felt nose. Around the walls, on the new shelves, are all the missing wheels of cheese, wrapped and labeled in neat round capitals. You text Rosie, GOT IT, and somewhere inside the felt calf a phone buzzes. A small voice from inside the head says “oh no, oh no, oh no,” very quietly.',
      'Down the hill, the low fields are silver under the moon. The whole herd has come up and pressed against the barn, forty heads in the open doors, breathing steam. Every one of them is looking at the calf. Then, slowly, all forty lie down, the way cows do before rain.',
    ],
    afterMiss: [
      'You lose the calf. You lose, around four in the morning, most of your dignity and one boot. Then at first light the barn’s work light clicks on, and there on a hay bale by the open door, felt head still on, sits the glowing calf, eating a sandwich through the mouth hole. On the new shelves around the walls, right where Rosie said they would be, sit the missing wheels. It did not get caught. It just got tired.',
      'You text Rosie, FOUND IT, and inside the felt calf a phone buzzes. The calf goes very still, and from inside the felt head comes a very small “oh no.” Behind you the whole herd has come up the hill and pressed into the doorway, forty heads, breathing steam. The cows look at the calf, then at the sandwich, then fold their legs and settle in the doorway as if a storm were coming.',
    ],
    recall: {
      'g1:alma-stare':
        'You think of Alma in her doorway, five feet tall and unblinking, and of how sure you were that it would be her in here.',
      'g1:fail':
        'The creamery gave you cheese and no answers, and nobody in this barn seems to think you have earned one yet.',
      'g2:fail':
        'You still do not know why the cows refuse the low fields. Forty of them look ready to explain it, very slowly.',
    },
    choices: [
      {
        id: 'unmask',
        label: 'Pull off the calf’s felt head before anyone can stop you',
        text: 'You reach for the felt ears. The calf sighs and holds still, the way someone holds still for a photo they did not want taken.',
        next: 'rosie',
      },
      {
        id: 'second-glow',
        label: 'Look past the calf at the second glow out in the field',
        text: 'Out in the low field, far past the fence, there is another glow: smaller, steadier, and not made of felt. It is standing at the edge of the fog, waiting.',
        next: 'second-calf',
        effects: { weird: 1 },
      },
      {
        id: 'make-offer',
        label:
          'Call Trevor from the survey crew on speaker and let the calf do the talking',
        text: 'You dial Trevor and hold the phone out to the felt calf. After a long silence it says, in a voice you know from the tasting room, “Trevor, it’s Rosie. Get a pen. These are my grandmother’s terms.” Behind you, Alma comes in with a kettle, listens for one sentence, and nods.',
        ending: 'sold-conditions',
      },
    ],
    leadLines: {
      mara: 'Mara points her flashlight at the floor, not the face. “Nobody likes being lit from above when they get caught. Trust me.”',
      kit: 'Kit lifts one felt hoof and finds a volleyball kneepad strapped inside. “Whoever’s in here has crawled a lot of miles on purpose.”',
      juniper:
        'Juniper strokes the nearest cow’s nose. “Say something heroic. I want to hear you try. So do they.”',
      cedar:
        'Cedar looks at forty cows looking at you. “A jury of forty and a calf with a phone in it. Somewhere a comet is laughing so hard it’s off course. Choose your words.”',
    },
    aloneLine:
      'Forty cows are watching you, and nobody else is. You have never felt so thoroughly supervised.',
  },
  branches: {
    rosie: {
      title: 'Rosie Under the Felt',
      place: 'The Quaresma hill, the old hay barn',
      chapter: 5,
      scene: 'meadow',
      body: [
        'The felt head comes off with a rip of velcro, and it is Rosie: twenty, glow paint on her eyebrows, a volleyball kneepad sliding down one shin. “Okay,” she says. “Don’t be mad. I can explain, and so can she.” The barn door creaks, and Alma Quaresma, eighty, five feet tall, in a nightgown and gumboots, comes in carrying a kettle. “Sit,” she tells you. “And you,” she tells Rosie, “stop saying oh no.”',
        '“My family came to this valley with nothing but cows and stubbornness,” Alma says, “like a lot of Portuguese families did. In sixty-four the river came up in the night, and I walked the herd uphill in the dark singing my mother’s song. They have followed that song ever since. The cave floor has gone salt every king tide for five winters. Those fields are going under, and the cows know it. I won’t sell them to put forty-eight families in houses that will flood. My knees can’t walk the bottoms anymore, so I taught her the song and gave her the calf.” Rosie wipes her eyebrows. “And I called you,” she says. “Nobody drives out here because a cow has opinions. Everybody drives out for stolen cheese.” Then: “And the stakes were me. I stacked them, though. Neatly. I’m not an animal.” The calf head, in her lap, does not comment.',
      ],
      choices: [
        {
          id: 'co-op',
          label:
            'Propose the hill stays a dairy and the low fields go back to the tide',
          text: 'You pull up the county’s public sea-level map on your phone and set it on a hay bale between them. Alma looks at it a long time, then at Rosie, then at the herd. “Show me how,” she says.',
          ending: 'herd-knows',
          effects: { goodwill: 1 },
        },
        {
          id: 'sell-terms',
          label: 'Help them sell the low fields, but on Alma’s terms',
          text: 'You help them write the terms on the back of a cheese label: no houses below the hill, the herd keeps the high pasture, and Rosie gets the recipe.',
          ending: 'sold-conditions',
        },
      ],
    },
    'second-calf': {
      title: 'The Other Glow',
      place: 'The Eel River bottoms, the edge of the low field',
      chapter: 5,
      scene: 'marsh',
      body: [
        'Behind you, the felt calf takes off its own head. It is Rosie from the tasting room, glow paint on her eyebrows, staring past you with her mouth open. “Grandma,” she says, very quietly, not taking her eyes off it. “You told me you made that one up.” Alma Quaresma has come up the hill in a nightgown and gumboots with a kettle, and she does not look surprised at all.',
        'The second calf is small and gold and perfectly real. It glows from the inside, like a lantern made of milk. It looks at you, walks a few steps down toward the low field, and stops, waiting. The herd lows, all at once, low and long. Alma sets down the kettle. “The cows were following that one long before Rosie,” she says. “Before me, too. In sixty-four I only ever followed them.”',
      ],
      choices: [
        {
          id: 'follow-calf',
          label:
            'Let the golden calf lead you down to the low field and stand exactly where it stands',
          text: 'You climb the fence and follow the glow down into the low field. Where it stops, you stop. It looks up at you, and its light goes out.',
          ending: 'golden-calf',
        },
        {
          id: 'stay-alma',
          label: 'Stay with Rosie and Alma and let the real calf lead the herd',
          text: 'You stay at the fence with Rosie, Alma and forty cows, and watch the golden glow walk the herd to the top of the hill and lie down among them, like it was always meant to be there.',
          ending: 'herd-knows',
        },
      ],
    },
  },
  endings: [
    {
      id: 'herd-knows',
      title: 'The Herd Knows',
      tone: 'true',
      text: [
        'At two the next afternoon, the Tidewater Meadows open house has a banner, a folding table of refreshments and forty dairy cows standing in a silent line along the fence. Rosie walks to the front in the felt calf suit with the head under her arm. You read the county’s projected tide line aloud, field by field, while Alma holds up the creamery’s old hand-drawn field map beside you, and every cow behind you looks down at the bottoms at the same moment.',
        'Trevor, who saw the glowing calf himself, nods all the way through. Inez quietly starts pulling up her own stakes. The man from Bayline does not fold. He reads out, politely, the option Rosie’s father signed on the bottoms two winters ago when the cave cooler died, the deposit long since spent, and what it costs to walk away. Then Inez texts him a flood-insurance quote for forty-eight homes below that tide line. He reads it twice and agrees to tear up the option the day the deposit comes back. Alma shakes on it without blinking, cuts the grandmother wheel, hands the first slice to Trevor and starts selling the rest of the cave by the pound.',
      ],
    },
    {
      id: 'sold-conditions',
      title: 'Sold, With Conditions',
      tone: 'bittersweet',
      text: [
        'Bayline reads the word easement and sends back a counteroffer, a lawyer’s letter and an invoice for the survey. Alma refuses the first two, pays the third in cash to make a point, refunds her son’s option deposit out of the cave’s takings, and only then does Bayline walk. The low fields go instead to a coastal land trust that wants exactly the marsh the cows have been predicting. The contract is a thing of beauty: no houses below the hill, a conservation easement on the bottoms, and a clause that the herd may graze them every dry summer for as long as there is a Quaresma alive to milk. The money, less one survey invoice and one deposit, keeps the creamery open another twenty years.',
        'Alma retires that winter and gives Rosie the recipe, written on the back of the creamery’s old hand-drawn field map, and the felt calf, folded in tissue paper. You buy one of the last wheels Alma ever made. When you cut it, it tastes like butter, salt and something else, faint and far-off, like the smell of a tide coming in.',
      ],
    },
    {
      id: 'golden-calf',
      title: 'The Golden Calf',
      tone: 'strange',
      text: [
        'When your eyes adjust, it is dark in a different way, and the river is in the field. It comes up through the grass with a sound like a long breath, and the night smells of mud, diesel and wet hay. Up the slope a girl of eighteen with a lantern and a dish towel tied over her hair is walking forty cows uphill in the dark, singing a Portuguese song in a voice that shakes and does not stop. At the front of the line, glowing like a lantern made of milk, walks a small gold calf. The girl never looks at it. She only follows the cows, and the cows follow the calf.',
        'Cold water rises around your knees, unhurried, and drains away again. Then it is just the low field at dawn, wet grass and a meadowlark, and you, with a white salt line on your jeans at exactly the height the river reached in 1964. Alma looks at your knees for a long time. “That’s where it came to,” she says. She hums two bars of her mother’s song and does not ask what you saw.',
      ],
    },
  ],
}
