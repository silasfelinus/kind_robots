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
  hook: 'Down in the Eel River dairy country, a calf that glows like a night-light has been leading whole herds off certain pastures after dark, and by morning the cows refuse to set foot on those fields again. Aged cheese wheels are vanishing from the Furtado Family Creamery’s cave. And a developer’s survey crew keeps getting chased off the bottomland by very slow, very determined cows.',
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
    'The Eel River bottoms and the dairy country around Loleta and Ferndale are real, and Portuguese immigrant families are a documented part of the valley’s dairy history; that history is referred to here only in general terms. Sea-level rise is a real and studied concern for the Eel River estuary and its low-lying farmland. The Furtado Family Creamery, Alma Furtado, Rosie, the survey crew, Bayline Coastal Holdings and every other person, business and event are invented. No real creamery, dairy or family is depicted.',
  decline: {
    label: 'Tell Rosie you are lactose intolerant, which is a lie',
    text: 'You send Rosie a sad cow emoji. She sends back a photo of a twenty-pound wheel of aged cheese and the words “your loss,” and she is right. Somewhere in the bottoms, a herd is turning around in the dark without you.',
  },
  gates: [
    {
      title: 'The Empty Shelf',
      place: 'The Furtado Family Creamery, the aging cave',
      chapter: 5,
      scene: 'meadow',
      message: {
        medium: 'text',
        from: 'Rosie (Furtado Family Creamery, tasting room)',
        lines: [
          'ok so this is gonna sound fake',
          'four more wheels gone from the cave. the OLD ones. 18-month minimum',
          'come taste stuff and solve crimes. i will feed you. please, my boss is 80 and terrifying',
        ],
      },
      body: [
        'The Furtado Family Creamery is a white barn, a tasting room with six stools and a cave dug into the side of the only real hill for a mile. Rosie, who is twenty and runs the counter, the website and the goat, sets out a tasting flight before you have even sat down. “Rule one,” she says. “You eat while you investigate. Rule two: do not let Alma see you near the cave. She thinks I called the sheriff. I did not call the sheriff. I called you.”',
        'Inside the cave it is cool and smells like butter, salt and time. One whole low shelf is bare, and there are fresh scrape marks in the dirt leading to the back door. Out the window, the herd is grazing only on the hill. The flat green fields below it are completely empty.',
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
          id: 'stakeout',
          label: 'Wait in the cold cave all night on an overturned milk crate',
          check: { skill: 'psyche', target: 9 },
          cost: 'Eight hours, forty-eight degrees, no snacks allowed.',
          success: {
            text: 'At 3:10 a.m. the back door opens. A small shape glowing a soft gold-green slips in on four legs that bend in a slightly wrong place, picks up a wheel of cheese with two very human-looking hands, and slips out again. You hold still. You hear it humming. You are almost certain the tune is an old Portuguese folk song, and you are completely certain calves do not hum.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You last until 1:40 a.m. and fall asleep against the shelf. You wake up at dawn with a crocheted blanket tucked around you that you did not bring and a wheel of cheese missing from right beside your head. Whoever took it was kind enough not to wake you. That is somehow worse.',
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
            text: 'You follow the tracks straight into a drainage ditch full of last week’s rain. A cow on the far side watches you climb out, chewing, with the patience of something that has seen many people make this exact mistake. You squelch back to the tasting room. Rosie does not ask.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara holds a slice of aged cheese up to the light like a stencil. “Whoever made this has steady hands and no patience for fools. I already like her.”',
        kit: 'Kit inspects the cave’s old rolling shelves. “These run on bicycle chain. Somebody built this cave to move.”',
        juniper:
          'Juniper lies down in the grass by the cave and listens. “The ground here is very nervous. It keeps thinking about water.”',
        cedar:
          'Cedar crumbles a bit of cheese for the goat. “My abuela would’ve married this cheese if it had a job.”',
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
        medium: 'voicemail',
        from: 'Trevor (Bayline Coastal Holdings, survey crew), 1:12',
        lines: [
          '“Hi, this is Trevor, I’m on the survey crew out at the Furtado parcel. Rosie said you might be able to help.',
          'This is the third time the cows have chased us off. They don’t run. They just walk at you, very slowly, forever.',
          'Also there was a glowing calf, and I would like someone else to have seen it. Thank you.”',
        ],
      },
      body: [
        'The low fields along the slough are perfect pasture: deep green, flat, wet at the edges. The cows will not touch them. Trevor and his partner Inez have pounded orange-flagged stakes in a grid across the fields for forty-eight luxury homes called Tidewater Meadows, and every morning the stakes are pulled up and stacked in a tidy pile by the gate.',
        'When you arrive, a line of twenty dairy cows is standing at the fence, watching. Trevor is holding his surveying rod like a sword. Inez is eating a sandwich and has clearly made her peace with whatever happens next.',
      ],
      approaches: [
        {
          id: 'hold-line',
          label: 'Stand your ground on the survey line while the herd advances',
          check: { skill: 'burly', target: 9 },
          cost: 'A cow weighs about fourteen hundred pounds. All of them are coming.',
          success: {
            text: 'The herd walks toward you, slowly. You do not move. They keep coming. You still do not move. Ten feet away, the lead cow stops, looks you in the eye for a very long time, and then turns and walks uphill. The rest follow. Inez applauds with her sandwich. Every cow, you notice, stepped exactly around the low places, as if they were already wet.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'The herd walks toward you, slowly. You hold your ground for an impressive four seconds and then retreat at speed into the surveyors’ truck. The cows surround the truck and stand there, chewing, for forty minutes. Trevor uses the time to tell you about his divorce.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'old-maps',
          label:
            'Lay the old field maps over the county’s sea-level planning maps',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'Inez has the county’s public sea-level-rise maps on her tablet. You lay them over the creamery’s hand-drawn 1950s field map from the tasting-room wall. The fields the cows refuse are not a random scatter. They follow one shaded line exactly, a line labeled with a year you will live to see, where the tide is projected to come up through the grass. Inez puts down her sandwich.',
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
            text: 'You fall in among the cows and lose patience after eleven minutes. You try to hurry them. They do not hurry. One of them steps on your foot and leaves it there with total serenity while she finishes her thought. You limp back to the truck to find Trevor has eaten your sandwich, too.',
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
      place: 'The Furtado hill, the old hay barn',
      chapter: 5,
      scene: 'meadow',
      message: {
        medium: 'flyer',
        from: 'Stapled to the creamery gate',
        lines: [
          'COMMUNITY OPEN HOUSE: TIDEWATER MEADOWS. 48 luxury homes. Saturday, 2 pm. Refreshments!',
          'Below it, in thick black marker: OVER MY DEAD COWS.',
          'Below that, in pencil: The cows are fine. — R.',
        ],
      },
      body: [
        'The open house is tomorrow. If the stakes are pulled one more time, Bayline will bring in a fence crew and a security guard, and the cows will lose the bottoms one way or the other. Tonight is the last chance to catch the glowing calf before somebody less patient does.',
        'Rosie has given you the barn key, a thermos of coffee and the best wheel in the cave, the one Alma calls the grandmother. The moon is up. The tule fog is lying in the low fields like spilled milk. Somewhere down the hill, a cow lows once, and the whole herd stands up.',
      ],
      approaches: [
        {
          id: 'cheese-bait',
          label: 'Bait the barn with the grandmother wheel and wait',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You set the grandmother wheel on an upturned crate in a pool of moonlight and string a rope to the barn door. At 2:50 a.m. the glowing calf comes in on its odd-jointed legs, sees the cheese, and gasps out loud. A calf does not gasp. It reaches for the wheel with both hands, and you pull the rope, and the door swings shut, and the calf sits down heavily on a hay bale and says, “Well, damn.”',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You set the bait perfectly and then fall asleep in the hay. You wake to find the cheese gone and, in its place, a perfectly decent sandwich wrapped in wax paper with a note: THIS ONE IS FOR YOU. YOU LOOK HUNGRY. Rosie says that is definitely Alma’s handwriting, and that Alma has never once made her a sandwich.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'wrangle',
          label:
            'Wrangle the glowing calf by hand when it comes through the field',
          check: { skill: 'burly', target: 7 },
          success: {
            text: 'The calf comes up out of the fog leading a dozen cows uphill, and you vault the fence and tackle it as gently as anyone has ever tackled anything. It is softer than it should be. It is made of felt and glow paint and stuffing. It is swearing in two languages. The cows form a circle around both of you and look down, deeply disappointed in everyone.',
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
            text: 'You sit in the grass among the cows and do not move for four hours. Neither do they. At dawn, the glowing calf comes up the hill, stops, and stares at you. You stare back. You are both very stubborn. Finally the calf sighs, sits down in the wet grass beside you, and says, in an old woman’s voice, “Fine. You win. Nobody has outwaited me since 1971.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You last three hours. Then a cow lies down on your coat, which you were wearing, and you have to choose between your dignity and your circulation. You choose circulation. Across the field, something glowing laughs, not unkindly, and goes back down into the fog.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara sits on a hay bale with her arms folded. “I can wait. I once waited six hours for a client to stop crying. This is easier.”',
        kit: 'Kit rigs the barn door with a rope and a bicycle pulley. “Gentle trap. Nobody gets hurt. Especially not the cheese.”',
        juniper:
          'Juniper braids a cow’s tail while she waits. “They know what’s coming. They’ve just decided to be polite about it.”',
        cedar:
          'Cedar sits on his tailgate with the CB off for once. “Some things you don’t chase. You just wait for ’em to come home.”',
      },
      aloneLine:
        'Alone on the hill, with forty cows breathing in the dark around you, you are less alone than you have been in weeks.',
    },
  ],
  coldCase: {
    title: 'The Stakes Go In',
    place: 'The Eel River bottoms, Saturday',
    chapter: 5,
    scene: 'marsh',
    body: [
      'The open house happens. There are refreshments. The stakes stay in the ground this time, and a fence goes up around the low fields. The cows stand on the hill and watch it all without blinking.',
      'Rosie texts a photo of the cave. The missing wheels are back on their shelf, every one, with a note in pencil: I WILL TRY SOMETHING ELSE.',
    ],
    choices: [
      {
        id: 'buy-wheel',
        label: 'Buy a wheel of the old recipe while there still is one',
        text: 'You buy a wedge of the grandmother wheel and eat it slowly over a month. It tastes, faintly, of salt water, and you cannot decide whether that was always in the recipe.',
        effects: { weird: 1 },
      },
      {
        id: 'public-comment',
        label: 'Show up at the county hearing and read the sea-level map aloud',
        text: 'You stand at the microphone and read the projected tide line, field by field. Nobody claps. Three people come up afterward and ask for a copy.',
        effects: { goodwill: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Calf in the Barn',
    place: 'The Furtado hill, the old hay barn',
    chapter: 5,
    scene: 'meadow',
    body: [
      'The glowing calf sits on a hay bale in the barn, slightly deflated, glow paint smudged on its felt nose. Around the walls, on the new shelves, are all the missing wheels of cheese, wrapped and labeled in a careful old hand. Rosie is in the doorway with her phone flashlight, saying “oh no, oh no, oh no” very quietly.',
      'Down the hill, the low fields are silver with fog. The whole herd has come up and pressed against the barn, forty heads in the open doors, breathing steam. Every one of them is looking at the calf. Then, slowly, every one of them looks at you.',
    ],
    choices: [
      {
        id: 'unmask',
        label: 'Pull off the calf’s felt head, the way it always goes',
        text: 'You reach for the felt ears. The calf sighs and holds still, the way someone holds still for a photo they did not want taken.',
        next: 'alma',
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
          'Call the developer and broker a deal tonight, before anyone else gets hurt',
        text: 'You dial Trevor. He answers on the first ring, wide awake, as if he has also been sitting up all night waiting for someone to say something sensible.',
        ending: 'sold-conditions',
      },
    ],
    leadLines: {
      mara: 'Mara steps in beside you. “Gently. Whoever’s in there has been carrying this alone for a while.”',
      kit: 'Kit is looking at the costume’s knee joints. “Hand-built. Bike inner tubes. Whoever made this is my new hero.”',
      juniper:
        'Juniper strokes the nearest cow’s nose. “They’re not watching the calf. They’re watching to see what you’ll do.”',
      cedar:
        'Cedar takes his cap off. “Whatever this is, it’s family business. We tread soft.”',
    },
    aloneLine:
      'Forty cows are watching you, and nobody else is. You have never felt so thoroughly supervised.',
  },
  branches: {
    alma: {
      title: 'Alma Furtado',
      place: 'The Furtado hill, the old hay barn',
      chapter: 5,
      scene: 'meadow',
      body: [
        'Under the felt head is a woman of eighty with white hair pinned flat and glow paint on her eyebrows: Alma Furtado, who has run this dairy since before Rosie’s parents were born. “Rosie,” she says, without turning around, “go put the kettle on. And stop saying oh no.”',
        '“My family came to this valley with nothing but cows and stubbornness,” Alma says, “like a lot of Portuguese families did. Four generations on this ground. Everyone thinks I won’t sell because of the money, or because I’m old and mean. I am old and mean. But I’ve watched the high tides climb that slough every winter for sixty years, and so have the cows. They know. Those fields are going under. I won’t sell them to put forty-eight families in houses that will flood. So I painted myself and moved the cheese uphill. Somebody had to listen to the herd.”',
      ],
      choices: [
        {
          id: 'co-op',
          label:
            'Propose the hill stays a dairy and the low fields go back to the tide',
          text: 'You lay the sea-level map on a hay bale between you. Alma looks at it a long time, then at Rosie in the doorway, then at the herd. “Show me how,” she says.',
          ending: 'herd-knows',
          effects: { goodwill: 1 },
        },
        {
          id: 'sell-terms',
          label: 'Help Alma sell the low fields, but on her terms',
          text: 'You help her write the terms on the back of a cheese label: no houses below the hill, the herd keeps the high pasture, and Rosie gets the recipe.',
          ending: 'sold-conditions',
        },
      ],
    },
    'second-calf': {
      title: 'The Other Glow',
      place: 'The Eel River bottoms, the edge of the fog',
      chapter: 5,
      scene: 'marsh',
      body: [
        'Behind you, the felt calf takes off its own head. It is an old woman with glow paint on her eyebrows, and she is staring past you at the field with her mouth open. “That one isn’t mine,” Alma Furtado says. “I swear to God, that one isn’t mine.”',
        'The second calf is small and gold and perfectly real. It glows from the inside, like a lantern made of milk. It looks at you, turns and walks a few steps down into the fog, and stops, waiting. The herd lows, all at once, low and long. Alma grips your sleeve. “The cows have been following that one for a year,” she says. “I only ever followed them.”',
      ],
      choices: [
        {
          id: 'follow-calf',
          label: 'Follow the golden calf down into the fog',
          text: 'You climb the fence and walk after the glow. The fog closes behind you. The ground under your boots gets wetter, then sandier, then very still.',
          ending: 'golden-calf',
        },
        {
          id: 'stay-alma',
          label: 'Stay with Alma and let the real calf lead the herd',
          text: 'You stay at the fence with Alma, Rosie and forty cows, and watch the golden glow walk the herd to the top of the hill and lie down among them, like it was always meant to be there.',
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
        'It takes two years, three grants and one county hearing where Alma brings a wheel of cheese and sets it on the podium like a gavel. The low fields become managed tidal wetland, with channels cut so the salt water can come and go gently instead of all at once. Herons arrive first. Then the salmon fry. Trevor and Inez quit Bayline and do the restoration survey for free.',
        'The herd moves uphill and never looks back. The Furtado Family Creamery becomes a co-op, owned by Rosie, the milkers, three neighbors and you, in a share so small it is mostly symbolic and entirely delicious. The grandmother wheel sits in the tasting room under glass. Every year at the co-op meeting, Alma wears the calf costume, and nobody is allowed to mention it.',
      ],
    },
    {
      id: 'sold-conditions',
      title: 'Sold, With Conditions',
      tone: 'bittersweet',
      text: [
        'The low fields sell, but the contract is a thing of beauty: no houses below the hill, a conservation easement on the bottoms, and a clause that the buyer must let the herd graze the high pasture for as long as there is a Furtado alive to milk them. Bayline takes the deal because the alternative is more cows. The money keeps the creamery open another twenty years.',
        'Alma retires that winter and gives Rosie the recipe, written on the back of the old field map. You buy one of the last wheels she ever made. When you cut it, it tastes like butter, salt and something else, faint and far-off, like the smell of a tide coming in.',
      ],
    },
    {
      id: 'golden-calf',
      title: 'The Golden Calf',
      tone: 'strange',
      text: [
        'The fog lifts and you are standing on a shoreline. The Eel River bottoms are gone. In their place is a wide, shining bay, full of birds, with the old Furtado hill now a green island in the water and a white barn still standing on top of it. Cows are grazing up there. A girl with Rosie’s face and white hair is walking among them with a wheel of cheese under her arm.',
        'The golden calf stands beside you in the shallows, glowing softly, and does not seem worried about any of it. Then it walks back into the fog, and you follow it, and you come out at the fence at dawn with salt water in your boots. Alma looks at your feet and does not ask. She just nods, slowly, the way the herd does.',
      ],
    },
  ],
}
