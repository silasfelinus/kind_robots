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
  hook: 'Something surfaces by the old pulp mill pier on Samoa after dark: horns and a beard in front, a long scaled tail behind. It climbs the dead smokestack hand over hoof, and at midnight the mill whistle blows, though nothing out there has had power since 2008. The scrap thieves have stopped coming. Nobody is sure whether to be grateful.',
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
    'Samoa, on the peninsula across Humboldt Bay from Eureka, was built as a lumber company town, and many of its cottages still stand. A pulp mill on the peninsula closed in 2008, and in the years after, federal cleanup crews removed millions of gallons of caustic pulping liquor left behind in its tanks. Eelgrass restoration is real work in Humboldt Bay. Marisol Keough, her father Walt, Dolores, Ruthie, the mill whistle, the restoration crew, the scrap crew, the creature and every other person and event here are invented. No real business or person is depicted.',
  decline: {
    label: 'Tell Ruthie goats aren’t your department',
    text: 'You text back that you don’t do livestock. Ruthie sends one goat emoji and one fish emoji, and somehow the two of them together feel like a curse. At midnight, across the bay, a whistle blows that nobody else in Arcata seems to hear.',
  },
  gates: [
    {
      title: 'Hoofprints on the Pier',
      place: 'The old pulp mill pier, Samoa',
      chapter: 3,
      scene: 'bay',
      message: {
        medium: 'text',
        from: 'Ruthie (night-shift tow truck)',
        lines: [
          'ok weird question. do u do monsters',
          'towed a scrap guy’s truck off the mill road at 2am. he left it running. he was CRYING',
          'says a goat came out of the bay. a goat with a TAIL. meet me at the pier, I have maple bars and a crowbar',
        ],
      },
      body: [
        'The old mill pier runs out into Humboldt Bay on pilings the color of burnt toast. Behind it the pulp mill sits dead and enormous, its smokestack raised into the fog like a finger making a point nobody stayed to hear. Ruthie leans on her bumper with a box of maple bars and a crowbar she describes as “emotional support.”',
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
            text: 'The plaster sets around your shoe. Ruthie frees you with a tow strap, gently, which is the least dignified rescue of your life, and she films all of it for her group chat. By the time you are loose, the tide has come up the ladder and licked every print off the planks.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'ladder',
          label: 'Climb the smokestack ladder where the prints stop',
          check: { skill: 'burly', target: 9 },
          cost: 'The ladder cage is rust and good intentions, and it is a long way up.',
          success: {
            text: 'Forty rungs up you find a rest platform scrubbed clean of gull droppings, which no gull has ever done. There is a thermos, still warm, binoculars aimed at the scrap road, and a laminated tide table annotated in a firm, square hand. Whoever climbs this stack is not hiding up here. They are on shift.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Twenty rungs up, the rust bites your palm and your legs vote, unanimously, to go home. You come down slower than you went up. On the bottom step of the stack, someone has left a clean bandage and a tube of ointment, which is helpful, and thoughtful, and deeply unsettling.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara photographs a print with a coin for scale. “Cloven in front, smooth behind. Either it’s a myth or it’s a person with a very specific weekend.”',
        kit: 'Kit eyes the ladder cage and flexes her fingers. “Whoever goes up that every night has better grip strength than me, and I’m annoyed about it.”',
        juniper:
          'Juniper dips a hand in the bay and frowns. “The eelgrass down there is new. Somebody’s been gardening underwater.”',
        cedar:
          'Cedar looks up at the stack a long time. “My dad sold logs to this place,” he says. “Never thought anybody’d still be punching in here.”',
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
        medium: 'voicemail',
        from: 'Unknown number, 1:12',
        lines: [
          '“Hi. You don’t know me. Dolores Ybarra. I worked the bleach plant at the mill for nineteen years.',
          'Ruthie says you’re asking about the whistle. That whistle was Walt Keough’s. Walt was our last foreman. Walt passed in March.',
          'I’m in the yellow cottage on the end. Coffee’s on. Don’t knock on Walt’s door. Somebody answers it.”',
        ],
      },
      body: [
        'The cottages stand in tidy rows with the dunes at their backs, built a century ago for mill families and kept painted ever since by people who refuse to let anything go shabby. Dolores Ybarra, seventy-six, pours coffee strong enough to strip a deck and tells you about the whistle: brass, the size of a fire hydrant, blown by hand at every shift change by Walt Keough for twenty-two years. It vanished from the mill the week the doors closed.',
        'Walt’s cottage is two doors down. The lawn is mowed in perfect stripes. The garage light is on. Through the window you can see a sewing machine, a bolt of green neoprene, and a pair of curved horns drying on a hanger like a winter coat.',
      ],
      approaches: [
        {
          id: 'dolores',
          label: 'Sit with Dolores and let her tell the mill stories',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You ask the right question, which is “What was the best day?”, and Dolores talks for an hour. Walt had a daughter, Marisol, who rode on his shoulders up the catwalk every bring-your-kid day and who now studies the bay for a living. “She called the mill a dragon when she was little,” Dolores says. “Walt said no, mija, it’s a goat. It climbs, and it doesn’t quit.”',
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
            text: 'The ledgers live in a locked cabinet at the community hall, and Dolores has the key, because of course she does. Walt Keough clocked in for twenty-two years and missed four days: three for his daughter’s birth and one for his wife’s funeral. In the margin of the final page, the last shift in 2008, someone has written in square pencil: Whistle goes home with me. Somebody has to keep the hours.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The ledgers are water-stained and filed by a system no living person understands. You find seven Keoughs, a Kehoe and a pressed four-leaf clover from 1961. Dolores looks over your shoulder and says, “That’s the wrong Walt. That Walt drove the forklift. Lovely man, terrible at cards.”',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara studies the horns through the window. “Steam-bent ash, wrapped in leather. That’s not a costume. That’s a commission somebody gave themselves.”',
        kit: 'Kit reads the garage like a workshop she wants to rob. “Neoprene with reinforced knees and palms. Built to climb, and built to last.”',
        juniper:
          'Juniper sniffs the porch roses. “Somebody kept these alive out of pure stubbornness. I love her already.”',
        cedar:
          'Cedar shakes Dolores’s hand with both of his. “My dad says the bleach plant crew were the toughest people on the bay.” Dolores says, “Your dad is correct.”',
      },
      aloneLine:
        'With no one to cover for you, Dolores feeds you three cookies and tells you exactly which window to look through, which is its own kind of crew.',
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
          'Underneath, in a different hand and a worse marker: fri 1130 last load. bring the torch.',
        ],
      },
      body: [
        'Friday, eleven-thirty. You have a plan, which is more than the scrap crew has. They roll in with their headlights off, four guys and somebody’s cousin, dragging a cutting torch toward the last copper on the pier. Ruthie waits up the road with her tow truck idling and a strong opinion about trespassers.',
        'At eleven fifty-eight, the water by the ladder goes flat and glassy. Horns break the surface. Then the beard, then the shoulders, then a long scaled tail that thumps the planks once like a gavel. The sea-goat begins to climb. At the base of the stack, a brass whistle waits on a pipe with no power to it at all.',
      ],
      approaches: [
        {
          id: 'net',
          label: 'Beat it up the ladder and rig a cargo net at the top',
          check: { skill: 'burly', target: 11 },
          cost: 'You have to out-climb it, in the dark, in the wind.',
          success: {
            text: 'You climb like it is your job. You reach the rest platform three rungs ahead and swing an old cargo net across the cage. The sea-goat climbs straight into it, kicks once, and goes still. From inside the net, a woman’s voice says, “Okay. Fair. That was well planned,” in the tone of a supervisor writing you up for excellence.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Halfway up, the wind finds you. You hang there hugging the cage while the creature climbs past you on the outside of the ladder, hand over hoof, and pauses to check that your carabiner is clipped. It is not. The sea-goat clips it for you, pats your helmet, and keeps climbing.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'decoy',
          label:
            'Lure the scrap crew off with a fake copper pile and tow lights',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You stack spray-painted pipe in the gravel lot and dust it with copper glitter, because you are a professional. The scrap crew goes for it. Ruthie lights them up from three sides with her tow beacons, and they bolt for the road. With the pier clear, the sea-goat stops on the ladder and looks down at you, surprised to have backup.',
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
            text: 'You plant yourself beside the whistle and do not move, not when the scrap crew curses, not when the stack groans, not when the bay goes strangely bright. At midnight a valve hisses somewhere you cannot see and the whistle screams shift change across the water. For one second the dead mill windows are full of light, and people in hard hats look out at a bay you do not recognize.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'At eleven fifty-nine your nerve goes and you grab the pull chain to stop it. The whistle blows anyway, right next to your head. You spend the rest of the night hearing only one long, ringing midnight, and the scrap crew, who stood farther back, laughs about it all the way to the road.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara has drawn a tiny goat on her wrist in ballpoint. “Not for luck. For the record. Somebody should document this properly.”',
        kit: 'Kit is halfway up the ladder cage before anyone says go. “If it’s climbing, I’m climbing. That’s just manners.”',
        juniper:
          'Juniper wades out to her knees and whispers to the eelgrass. “Hold on. The night shift’s here.”',
        cedar:
          'Cedar stands with Ruthie by the tow truck, arms folded. “Scrap guys know me from the valley. They’ll go easier if they see a familiar face.”',
      },
      aloneLine:
        'You run the whole trap yourself, with Ruthie on the radio, which is the closest thing to a crew this mill has had in years.',
    },
  ],
  coldCase: {
    title: 'The Whistle Goes Quiet',
    place: 'The old pulp mill pier, Saturday',
    chapter: 3,
    scene: 'bay',
    body: [
      'Saturday morning, the pier gate has a new padlock and a county notice. Either the scrap crew got the last of the copper or the creature drove them off for good; nobody on the peninsula can agree which. The smokestack is just a smokestack again.',
      'Ruthie texts a photo of a plaster hoofprint riding on her dashboard like a hula girl. “Never saw it up close,” she writes. “Kind of wish I had. Kind of glad I didn’t.”',
    ],
    choices: [
      {
        id: 'eelgrass',
        label: 'Volunteer a Saturday with the eelgrass crew',
        text: 'You spend a morning knee-deep in bay mud, planting shoots by hand. The crew lead has curved rust scars across both palms, like ladder rungs. She won’t say where she got them.',
        effects: { goodwill: 1 },
      },
      {
        id: 'listen',
        label: 'Listen for the whistle from across the bay',
        text: 'At midnight you stand on the Eureka waterfront and listen. Nothing. Then, very faint, a breath of brass, like the shift is changing somewhere you cannot follow.',
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
      'The scrap trucks are taillights on the peninsula road. At the top of the stack the sea-goat sits on the rest platform with its tail hanging over the edge and its horns tipped back, breathing hard, waiting for you to do the thing everybody always does at this part.',
      'Up close, the costume is magnificent: a hand-sewn wetsuit with a beard of dyed rope, horns of steam-bent ash, and a fishtail of green neoprene scales, hundreds of them, each one glued on by hand. A dive tank is strapped to the base of the stack below, its hose running to the brass whistle. The tide is turning.',
    ],
    choices: [
      {
        id: 'unmask',
        label: 'Pull back the hood, the way it always goes',
        text: 'You reach for the horns. The sea-goat lets you, and sighs like someone clocking out.',
        next: 'foreman',
      },
      {
        id: 'ask-whistle',
        label: 'Ask who taught it to blow the whistle',
        text: 'You ask about the whistle instead. The sea-goat goes very still, then pulls off its own hood.',
        next: 'shift-change',
      },
      {
        id: 'climb-down',
        label: 'Climb down and let the night shift keep its secret',
        text: 'You climb down without a word. The sea-goat watches you all the way to the ground, then turns back to the bay and the plots it has guarded for months. At midnight the whistle blows again, and this time it sounds almost like thanks.',
        ending: 'half-new',
      },
    ],
    leadLines: {
      mara: 'Mara keeps her hands in her pockets. “Whoever’s in there has been doing this alone a long time. Be gentle.”',
      kit: 'Kit sits on the rail beside the creature, legs swinging over a very long fall. “Nice climb. Truly. Your form is great.”',
      juniper:
        'Juniper looks at the scaled tail and smiles. “Half one thing, half another. Most of us are.”',
      cedar:
        'Cedar takes his cap off. “Whoever you are,” he says, “I think I know your dad’s work.”',
    },
    aloneLine:
      'Alone at the top, you and the sea-goat are just two people on a ledge in the wind, both of you out of breath.',
  },
  branches: {
    foreman: {
      title: 'The Foreman’s Daughter',
      place: 'The top of the mill smokestack',
      chapter: 3,
      scene: 'bay',
      body: [
        'Under the horns is a woman in her thirties with salt in her eyebrows and eelgrass in her ponytail: Marisol Keough, marine biologist, the last foreman’s daughter. “Scrap crews dragging copper off the pier were ripping up my eelgrass plots,” she says. “That grass is the bay’s nursery. So I gave them something to be scared of.”',
        'Then she looks down at the dead mill, and her voice changes. “My dad blew that whistle every working day for twenty-two years. The day the mill closed, he swept his station, oiled the whistle, and carried it home on his shoulder up the middle of the street, and every family on the block came out on their porches and stood there. He kept the hours on it in the garage until March. Somebody has to keep the hours.”',
      ],
      choices: [
        {
          id: 'crew',
          label: 'Tell her she doesn’t have to keep them alone',
          text: 'You tell her about Dolores, and the ledgers, and Ruthie with her tow lights, and a whole street of people who still mow in stripes. Marisol laughs, then covers her face with a neoprene glove for a long moment.',
          ending: 'the-climb',
        },
        {
          id: 'rest',
          label: 'Tell her the scrap crew won’t be back and she can rest',
          text: 'You tell her the pier is safe now, that she has done enough. Marisol nods slowly, unbuckles the tail, and sets it on the platform like a lunchbox at the end of a double shift.',
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
        '“It runs on compressed air,” says the woman under the hood: Marisol Keough, marine biologist, daughter of Walt, the last foreman. “Dad’s whistle, my dive tank, a timer off a sprinkler system. Nothing spooky.” She frowns at her watch. “Except it’s been blowing early. Like it’s keeping time for somebody else.”',
        'At midnight the tank hisses, the whistle sings, and the bay changes under you. The mill is gone. Where its tanks stood there is a tidal wetland silver with channels, and beyond it a working port: cranes, long white turbine blades stacked like giant oars, people in hard hats walking to shift. A whistle answers from across that water. It is the same note. Marisol grips the rail. “That’s Dad’s pitch,” she whispers. “Somebody over there kept it.”',
      ],
      choices: [
        {
          id: 'answer',
          label: 'Pull the chain with her and answer the other whistle',
          text: 'You pull the chain together. The two whistles hold the note across years of water, and the future shift, very small and very far, waves back.',
          ending: 'half-new',
        },
        {
          id: 'gather',
          label: 'Get Marisol down and wake everyone who should see this',
          text: 'You climb down fast and start knocking on cottage doors. Dolores is already dressed. So, it turns out, is half the street.',
          ending: 'the-climb',
        },
      ],
    },
  },
  endings: [
    {
      id: 'the-climb',
      title: 'The Climb',
      tone: 'true',
      text: [
        'By summer the old pier has a crew again. Retired mill workers show up at dawn with tool belts older than you, Marisol’s restoration volunteers show up in waders, and together they rebuild the deck plank by plank, gapped so light reaches the eelgrass below. Dolores runs the schedule. Nobody is late twice.',
        'On the day the pier reopens, Marisol mounts her father’s whistle at the far end on a post of salvaged mill timber, and at noon every retired worker on the peninsula takes a turn on the chain. Your turn comes last. The note goes out across the bay, and something out there, far off and not yet built, answers.',
      ],
    },
    {
      id: 'whistle-stops',
      title: 'The Whistle Stops',
      tone: 'bittersweet',
      text: [
        'The scrap crew never comes back, and by fall the plots under the pier fill in thick and green. Marisol takes a research job down the coast. Before she leaves, she sets the whistle on Dolores’s porch with a note: Keep the hours, would you. Dolores does, for a while.',
        'The costume ends up in a box at the community hall, horns on top. Some nights, kids on the peninsula swear they see something with a tail sitting on the old stack, watching the bay. But the whistle doesn’t blow at midnight anymore, and the cottages sleep straight through.',
      ],
    },
    {
      id: 'half-new',
      title: 'Half of Something New',
      tone: 'strange',
      text: [
        'Marisol never fully comes off the night shift. She works days at the lab and nights on the pier, and the whistle keeps blowing at midnight, sometimes answered, sometimes not. Crab boats coming in late report a fish-tailed shape climbing a smokestack that some nights isn’t there at all, and other nights has cranes beside it.',
        'A year later you get a postcard with no stamp. On the front is a photograph of a tidal wetland and a working port that do not exist yet. On the back, in square pencil: Shift change went well. Your plank is the fourth from the end. — M.',
      ],
    },
  ],
}
