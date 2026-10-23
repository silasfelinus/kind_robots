import type { Mystery } from '../types'

// Case III. Seed: duality, chatter, messages, curiosity, a two-faced reputation, quick wits.

export const SECOND_VOICE: Mystery = {
  id: 'second-voice',
  number: 3,
  sign: 'gemini',
  title: 'The Mystery of the Second Voice',
  tagline:
    'A pirate station reads tomorrow’s harbor gossip, and the foghorn answers itself.',
  region: 'Trinidad, the harbor and Trinidad Head',
  hook: 'Every morning at six, a pirate station nobody can find reads out Trinidad harbor gossip a day before it happens. Lyle Pettibone, the sweetest man on the pier before noon and the crankiest bartender in Westhaven after dark, has been seen in both places at the same minute. And on foggy nights, the horn out by the Head blows once, and something down the coast blows back.',
  design: {
    element: 'air',
    motif: 'twin-beams',
    palette: { sky: '#1a1b2e', ink: '#cfd8ec', glow: '#a99bd6' },
    stars: [
      [28, 14],
      [44, 18],
      [30, 32],
      [28, 48],
      [22, 70],
      [16, 78],
      [42, 32],
      [46, 48],
      [40, 60],
      [50, 78],
    ],
    links: [
      [0, 2],
      [2, 3],
      [3, 4],
      [4, 5],
      [1, 6],
      [6, 7],
      [7, 8],
      [7, 9],
      [2, 6],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. Trinidad harbor at night in thin fog, the dark hump of Trinidad Head with its small lighthouse on the cliff, a little white memorial lighthouse on the bluff above town, a wooden pier with moored fishing boats. Two beams of light, one from each lighthouse, cross over the water and form a pair of mirrored figures standing back to back. A small radio antenna on a net shed glows. Faint silver stars above the Head form an unlabeled constellation of two parallel stick figures. Fog lavender, silver-blue and slate. No text, no letters, no logos.',
  provenance:
    'Trinidad, its harbor, its pier, Trinidad Head with its lighthouse, the memorial lighthouse in town and nearby Westhaven are real places and appear here as geography only. Lyle and Lowell Pettibone, the Harbor Hour, the Seawall Bait and Tackle, the Double Hitch Tavern, Marisol, Darlene and every other person, business and event are invented. No real business, broadcaster or resident is depicted.',
  decline: {
    label: 'Tell Marisol you only listen to podcasts',
    text: 'You turn the dial past 88.3 and keep going. For a second, under the static, you could swear a voice says your name, a little disappointed. Then it is just the weather, and the weather is fog.',
  },
  gates: [
    {
      title: 'Gossip From Tomorrow',
      place: 'Trinidad harbor, the pier',
      chapter: 2,
      scene: 'bay',
      message: {
        medium: 'radio',
        from: '88.3 FM, no call sign, 6:02 a.m.',
        lines: [
          '“Good morning, harbor. This is the Harbor Hour. Here’s what’s happening tomorrow.',
          'Bait shop runs out of squid by nine. Somebody’s dog gets on the wrong boat. Darlene finally tells Mo his joke isn’t funny.',
          'Oh, and somebody new comes asking questions. Be nice to ’em. They mean well.”',
        ],
      },
      body: [
        'The next morning, the bait shop runs out of squid at 8:52. A wet spaniel jumps onto a charter boat and has to be negotiated back off. At the end of the pier, Darlene puts down her coffee and tells Mo, kindly and finally, that his joke about the seagull and the lawyer has never once been funny. Mo looks stricken. Everyone on the pier looks at the sky, then at the water, then at you.',
        'Marisol, who runs the Seawall Bait and Tackle and has had the station on her shop radio for a year, waves you over. “Nobody can find it,” she says. “Ham guys have tried. Every prediction comes true. And now it’s talking about you.”',
      ],
      approaches: [
        {
          id: 'pier-talk',
          label: 'Work the pier, trading gossip until somebody trades back',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You trade a rumor for a rumor all the way down the pier. By the end, Mo has forgiven Darlene, the spaniel has a new home, and an old crabber tells you the one thing nobody says out loud: the Harbor Hour only ever gossips about things Lyle Pettibone was around for. “Lyle’s everywhere,” she says. “Sweetest man alive in the morning. Two-faced as a nickel after dark.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You try to start a rumor to see if the station picks it up. You pick the wrong one: that the pier is being sold. Within the hour it has reached Westhaven, Moonstone and somebody’s cousin in Eureka, and three fishermen corner you to ask who is buying. You spend the afternoon un-starting it.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'log',
          label:
            'Write down every prediction for a week and check them against the harbor',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'You keep a notebook. Forty-one predictions in a week; thirty-nine come true. The two that miss both happened in Westhaven instead of the harbor, at night, and both were told in a slightly different voice: lower, rougher, like the same man with a cold. Two voices take turns on the Harbor Hour. Whoever they are, they are reporting to each other.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You write everything down in a notebook you leave on the pier railing. A gull takes it. Somehow, the next morning, the Harbor Hour reports that a gull will be seen reading in the harbor, and three tourists photograph the gull doing exactly that.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara watches Darlene and Mo. “Whoever’s writing this show knows exactly where to put the needle.”',
        kit: 'Kit tunes Marisol’s radio by ear. “Low power. Close by. Somebody built this transmitter out of a toaster and spite.”',
        juniper:
          'Juniper leans on the railing. “Gossip is just the town thinking out loud. This town is thinking ahead.”',
        cedar:
          'Cedar frowns at the radio. “My CB’s been catching a show like this for months. Different station. Same voice.”',
      },
      aloneLine:
        'Alone on the pier, you have the uneasy feeling that tomorrow’s broadcast already knows what you are about to do.',
    },
    {
      title: 'The Man in Two Places',
      place: 'Trinidad pier and the Double Hitch Tavern in Westhaven',
      chapter: 2,
      scene: 'plaza',
      message: {
        medium: 'text',
        from: 'Marisol (Seawall Bait and Tackle)',
        lines: [
          'LYLE IS HERE RIGHT NOW buying sardines',
          'davey just texted me a pic. LYLE IS ALSO BEHIND THE BAR AT THE DOUBLE HITCH',
          'that is 15 min away. i am not drinking. i am scared',
        ],
      },
      body: [
        'Lyle Pettibone is on the pier, in a yellow rain slicker, cheerfully buying three pounds of sardines and asking after everyone’s mother. Marisol’s phone shows a photo, time-stamped one minute ago, of Lyle Pettibone behind the bar at the Double Hitch Tavern in Westhaven, in a black T-shirt, scowling at a man who ordered a mojito.',
        'Same face, same scar through the left eyebrow, same pinky ring. Lyle pays for his sardines, winks at you and walks off up the hill toward his little apartment above the bait shop, whistling. At the Double Hitch, according to Davey, the bartender has just looked at his watch and said, “Close enough.”',
      ],
      approaches: [
        {
          id: 'split-up',
          label:
            'Split the party, one at each Lyle, and keep the phones on speaker',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You race to Westhaven while a friend of Marisol’s tails the pier Lyle home. On speaker, both of you narrate. “He’s opening the apartment door.” “He’s pouring a beer.” “He’s turning on a radio.” “So is this one.” At the same instant, in two places, both Lyles say exactly the same thing to nobody in particular: “Copy that.” Then the line between your phones fills with static and a third voice says, calmly, “Look at the hands.”',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You race to Westhaven while someone tails the pier Lyle. Halfway there your phone dies. When you arrive at the Double Hitch, the bartender is gone, the stool is still warm, and a man at the bar tells you Lyle left in a hurry because someone was coming. “Someone,” he says, looking at you over his beer, “who talks a lot.”',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'trick-question',
          label:
            'Ask the pier Lyle something only last night’s Lyle could know',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You catch up with Lyle on the stairs and ask, friendly as anything, how the mojito guy took it. Lyle smiles, says “Oh, he cried a little,” and then stops, smile frozen, as he hears himself. He has not been to Westhaven today. He knows exactly what happened there. He looks at you a long moment and says, quietly, “Huh. You’re the new one. The radio said you were quick.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You ask him how the mojito guy took it. Lyle beams at you with total, sunny incomprehension and invites you to a potluck. By the time you have politely declined three casseroles, he is gone, and you are holding a recipe card for a tuna dish you will never make.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'tail',
          label: 'Tail the pier Lyle up Trinidad Head in the fog',
          check: { skill: 'burly', target: 9 },
          success: {
            text: 'Lyle takes the trail up the Head, fast for a man his age. You keep pace through the fog and the wet brush and come out at an overlook just as he lifts a handheld air horn from his slicker pocket and gives one long blast toward Westhaven. Far down the coast, through the fog, another horn answers. Lyle nods, satisfied, and says out loud to the empty air, “Your turn.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Lyle takes the trail up the Head faster than any man in a rain slicker has a right to. You lose him in the fog and spend forty minutes going in circles before a very polite jogger leads you down. From somewhere up above, a horn blows once, and from far away, another answers. You hear both. You see neither.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara zooms in on the photo. “Same scar. But this one’s healed with a slight hook at the end. Scars don’t match on two sides. Ask me how I know.”',
        kit: 'Kit is delighted. “Two places at once is the oldest trick in the circus. You just need the right partner.”',
        juniper:
          'Juniper hums. “He’s not lying. He’s just never once been the whole story.”',
        cedar:
          'Cedar’s CB crackles in his truck. He listens and goes pale. “That was your voice. On my CB. Telling me to watch the bartender’s left hand.”',
      },
      aloneLine:
        'Alone, you cannot be in two places at once. For the first time in your life, you wish you could.',
    },
    {
      title: 'The Foghorn That Answers Itself',
      place: 'The net loft behind the bait shop, Trinidad harbor',
      chapter: 2,
      scene: 'beach',
      message: {
        medium: 'radio',
        from: '88.3 FM, the Harbor Hour, 6:01 p.m.',
        lines: [
          '“Evening, harbor. Tomorrow: two men, one cake. And somebody finally asks the right question.',
          'This next part is for the one who’s been asking around.',
          'Hi. It’s me. I mean it’s you. Listen: go to the net loft at eight, and when they lie, talk faster.”',
        ],
      },
      body: [
        'The voice on the radio is yours. Not like yours. Yours, a little older, a little hoarse, warm in a way you have only ever heard on recordings of yourself and hated. Marisol turns the radio off, then on again. It is still you, signing off with a phrase you have never said and are suddenly sure you will.',
        'The net loft behind the bait shop has a thin wire antenna running up the side of the building and a light under the door. Inside, two men are arguing in the same voice. Out on the water, the fog is coming in, and somewhere down the coast a horn is waiting to answer.',
      ],
      approaches: [
        {
          id: 'take-mic',
          label: 'Walk in, take the mic and broadcast a dare to both of them',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You push open the door, grab the mic off its stand and go live before anyone can stop you. “Good evening, harbor. Breaking news: Lyle Pettibone is in two places at once, and I dare both of him to say good night on air.” Silence. Then, from the stool by the transmitter, a gruff voice and a gentle one say good night at the same time, and somewhere out on the water every boat radio in the harbor goes off with laughter.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You push open the door and go live, but you open with a pun, and it is not a good one. The gentle Lyle winces. The gruff one unplugs the transmitter. For one long second the whole harbor hears only static, and then, faintly, your own future voice sighing, “Not the pun. I told you, not the pun.”',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'answer-horn',
          label: 'Climb the Head and answer the foghorn in their own code',
          check: { skill: 'lore', target: 11 },
          cost: 'You have to guess the code from three days of listening and one bad night of sleep.',
          success: {
            text: 'One long, two short means “come home, it’s safe.” You worked it out from the gaps in the broadcasts. You blow it from the overlook with Lyle’s spare horn. Fifteen minutes later, two men in the same face come running up the trail from opposite directions, one in a rain slicker and one in a bar apron, and stop dead, three feet apart, staring at each other in public for the first time in twenty years.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You blow what you think is “come home.” It turns out to mean “ran out of ice.” Twenty minutes later a truck pulls up at the Double Hitch with three bags of ice and a very confused bartender, and the whole night is spent explaining to Davey that you are not, in fact, the new bar manager.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'listen',
          label:
            'Stand outside the loft and do exactly what the second voice tells you',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You turn the radio on outside the door and listen to yourself. “Knock three times,” you say. You knock three times. “Say: I know there are two of you, and I think that’s wonderful.” You say it. On the other side of the door, there is a long silence, and then two locks slide back, one after the other, and someone very quietly starts to cry.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You listen to your own future voice for a full minute and cannot stand it. You talk back. You argue with yourself. You lose. By the time you look up, the light under the door is off, the antenna has been pulled down, and a note on the door reads, in two different hands, OFF THE AIR. SORRY. NICE VOICE.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara squeezes your shoulder. “You sound good older. Tired, but good.”',
        kit: 'Kit holds up a hand-built antenna part she found in the trash. “They’ve been fixing this thing for twenty years. Two people. One pair of pliers.”',
        juniper:
          'Juniper listens to your future voice and grins. “You got funnier. Not a lot. But some.”',
        cedar:
          'Cedar sets his CB on the hood. It is playing the same broadcast. “Whatever this is, it’s reaching me too. Be gentle with ’em.”',
      },
      aloneLine:
        'Nobody else is with you. That is fine. You have, it turns out, yourself.',
    },
  ],
  coldCase: {
    title: 'Off the Air',
    place: 'Trinidad harbor, the next morning',
    chapter: 2,
    scene: 'bay',
    body: [
      'At six the next morning, 88.3 is static. The Harbor Hour never comes back. Lyle Pettibone is on the pier, cheerful as ever, buying sardines, and that night the bartender at the Double Hitch is as cranky as ever. Nobody sees them at the same minute again.',
      'Marisol leaves her radio tuned to the empty frequency, just in case. Some mornings, she swears, there is someone breathing on the other end, getting ready to say something.',
    ],
    choices: [
      {
        id: 'leave-tuned',
        label: 'Leave your own radio tuned to 88.3',
        text: 'You leave it on. Months later, very faintly, you hear your own voice say good morning to a harbor you do not recognize yet.',
        effects: { weird: 1 },
      },
      {
        id: 'buy-sardines',
        label: 'Buy sardines from Lyle and say nothing at all',
        text: 'You buy three pounds. Lyle winks and says, “Tell the other one hi,” and you never find out which one he meant.',
        effects: { goodwill: 1 },
      },
    ],
  },
  reveal: {
    title: 'Two of the Same Man',
    place: 'The net loft behind the bait shop',
    chapter: 2,
    scene: 'beach',
    body: [
      'The net loft is a radio station the size of a closet: a transmitter built from a car stereo and a toaster, two stools, two coffee mugs, two notebooks labeled MORNING and NIGHT, and a wall of index cards covered in harbor gossip in two slightly different handwritings. On the two stools sit two Lyle Pettibones, one in a rain slicker and one in a bar apron, with the same face, the same scar and the same look of men who have been caught.',
      'On the transmitter, the needle is still moving. Someone is still on the air, and it is not either of them. Marisol is in the doorway with her hand over her mouth. Out by the Head, the horn blows once, and nobody answers it.',
    ],
    choices: [
      {
        id: 'names',
        label: 'Ask them, one at a time, to say their own names',
        text: 'You look from one face to the other and ask, as gently as you can. It takes a long time. The one in the slicker goes first.',
        next: 'two-men',
      },
      {
        id: 'whose-voice',
        label: 'Ask who is still on the air',
        text: 'You point at the moving needle. Both brothers look at you, then at each other, then at the speaker, which says, in your own voice, “Hey. Good job.”',
        next: 'your-voice',
        effects: { weird: 1 },
      },
      {
        id: 'say-nothing',
        label: 'Promise them nobody will ever hear it from you',
        text: 'You hold up both hands. “I was never here.” Marisol nods. The brothers look at each other, and for the first time tonight, they both breathe out.',
        ending: 'one-life',
      },
    ],
    leadLines: {
      mara: 'Mara studies the two scars. “Hook on the left one. Straight on the right. Twenty years and nobody looked closely.”',
      kit: 'Kit is very carefully not touching the toaster transmitter. “I have so many questions, and none of them are about the lying.”',
      juniper:
        'Juniper smiles at both men. “You look less tired already. Two people are lighter than one.”',
      cedar:
        'Cedar sets down his CB, still playing. “My dad’s got a brother he hasn’t talked to in thirty years. Say whatever you’re gonna say.”',
    },
    aloneLine:
      'Two men look up at you, and the radio speaks in your voice, and you are suddenly the most outnumbered person in Trinidad.',
  },
  branches: {
    'two-men': {
      title: 'Lyle and Lowell',
      place: 'The net loft behind the bait shop',
      chapter: 2,
      scene: 'beach',
      body: [
        '“Lyle,” says the one in the slicker. “Lowell,” says the one in the apron, like it hurts to use. Twenty years ago their father died and left them one boat, one fishing permit, one apartment and one debt. Lowell was supposed to take a cannery job in Alaska. He got as far as the gate at the little airport in McKinleyville, sat there for six hours and came home.',
        '“I couldn’t figure out how to be half of something,” Lowell says. “And I couldn’t afford two of anything,” Lyle says. So they became one man. Mornings and nights. One name, one permit, one life in shifts, and the radio to keep their stories straight. “Everybody says I’m two-faced,” Lyle says, and laughs, and then neither of them is laughing.',
      ],
      choices: [
        {
          id: 'birthday',
          label: 'Tell them the whole harbor would throw a party for two',
          text: 'You point out the door at Marisol, who is already texting everyone she knows. “When’s your birthday?” she asks. Both brothers answer at once, and the date is the same, and she whoops.',
          ending: 'two-of-a-kind',
          effects: { goodwill: 1 },
        },
        {
          id: 'keep-shifts',
          label: 'Ask what they want, and let them choose to keep the shifts',
          text: 'You ask. They talk it over in low voices for a long time, the gentle one and the gruff one, and finally Lowell says, “Not yet. But thanks for asking us both.”',
          ending: 'one-life',
        },
      ],
    },
    'your-voice': {
      title: 'The Third Voice',
      place: 'The net loft behind the bait shop',
      chapter: 2,
      scene: 'beach',
      body: [
        '“It started showing up six months ago,” Lyle says. “Cutting in on our frequency.” Lowell nods. “Gave us better gossip than we had. Told us somebody was coming. Said to let you find us.” Neither brother can explain it. They both look a little embarrassed to be the ones keeping secrets when there is a voice in the room keeping a bigger one.',
        'The speaker hisses. Your voice says, “I’m in a Trinidad one street over from yours. Close enough to hear. Not close enough to touch. You’ve got about a minute before the fog lifts and the signal goes.” In the voice’s background you can hear gulls, and a party, and two men laughing in the same voice.',
      ],
      choices: [
        {
          id: 'talk-back',
          label: 'Pick up the mic and talk to yourself',
          text: 'You lift the mic. You say hello. You have never been so nervous talking to anyone in your life.',
          ending: 'talk-to-yourself',
        },
        {
          id: 'hand-over',
          label:
            'Hand the mic to Lyle and Lowell so they can say their names on air',
          text: 'You hold out the mic between them. Lowell takes it, then gives half of it to Lyle, and together they say both their names to the whole harbor for the first time.',
          ending: 'two-of-a-kind',
        },
      ],
    },
  },
  endings: [
    {
      id: 'two-of-a-kind',
      title: 'Two of a Kind',
      tone: 'true',
      text: [
        'The harbor throws the party that Saturday on the pier: one long table, two cakes, two sets of candles, and every fisherman in Trinidad arguing about who suspected first. Lowell gets his own fishing permit, eventually, after a very long afternoon of paperwork. Lyle cries when Lowell blows out his own candles for the first time in twenty years. Darlene tells a joke, and it is funny.',
        'The Harbor Hour goes legal by spring, a licensed little community station run out of the net loft, with a morning host and a night host who sound exactly alike and argue on air about everything. Every so often, in the middle of the gossip, a third voice cuts in, says something kind and true about tomorrow, and signs off. Nobody in Trinidad bothers asking who it is anymore.',
      ],
    },
    {
      id: 'one-life',
      title: 'One Life, Shared',
      tone: 'bittersweet',
      text: [
        'Lyle Pettibone goes on being the sweetest man on the pier before noon and the crankiest bartender in Westhaven after dark. The Harbor Hour goes back to whispering tomorrow’s gossip at six, a little quieter now. You and Marisol are the only two people who know, and you keep it, the way you would keep anyone’s secret that was mostly about love.',
        'On your birthday, a card comes in two handwritings. It says, Thanks for seeing both of us. Some foggy nights, from the overlook on the Head, you hear the horn blow once, and far down the coast, another one answer, and you think: there they go. Your turn. My turn. Your turn.',
      ],
    },
    {
      id: 'talk-to-yourself',
      title: 'Talk to Yourself',
      tone: 'strange',
      text: [
        'You talk until the fog lifts. You tell yourself about the case, and yourself tells you about a Trinidad one street over, where things went a little differently and a little better and you still have the same terrible taste in puns. You both laugh at the same moment, at the same joke, which is somehow the most unsettling part.',
        'The signal goes at dawn. But every morning after that, at 6:02, there is a third voice on 88.3 for exactly one minute, and it is always you, and it always knows what you are about to do. Some days you listen. Some days you argue. Lyle and Lowell say that is the most normal thing about you.',
      ],
    },
  ],
}
