import type { Mystery } from '../types'

// Case III. Seed: duality, chatter, messages, curiosity, a two-faced reputation, quick wits.

export const SECOND_VOICE: Mystery = {
  id: 'second-voice',
  number: 3,
  sign: 'gemini',
  title: 'The Mystery of the Second Voice',
  tagline:
    'A pirate station reads out what the harbor hasn’t said yet, and the foghorn answers itself.',
  region: 'Trinidad, the harbor and Trinidad Head',
  hook: 'Every morning at six, a pirate station nobody can find reads out what Trinidad harbor has not said yet: the grudge, the crush, the apology nine years overdue. By lunch, somebody has always said it. The station knows who is behind on slip fees and whose dog is on which boat, and it never once mentions Lyle Pettibone, the sweetest man on the pier before noon and the crankiest bartender in Westhaven after dark. And on foggy nights, the horn out by the Head blows once, and something down the coast blows back.',
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
    'Trinidad, its harbor, its pier, Trinidad Head with its lighthouse, the memorial lighthouse in town and nearby Westhaven are real places and appear here as geography only. Lyle and Lowell Pettibone, the Harbor Hour and its 87.9 FM signal, the Seawall Bait and Tackle, the Double Hitch Tavern, Marisol, Darlene and every other person, business and event are invented. No real business, broadcaster or resident is depicted.',
  decline: {
    label: 'Tell Marisol you only listen to podcasts',
    text: 'You turn the dial past 87.9 and keep going. For a second, under the static, you could swear a voice says your name, a little disappointed. Then it is just the weather, and the weather is fog.',
  },
  gates: [
    {
      title: 'What Nobody Has Said Yet',
      place: 'Trinidad harbor, the pier',
      chapter: 2,
      scene: 'bay',
      message: {
        medium: 'radio',
        from: '87.9 FM, no call sign, 6:02 a.m.',
        lines: [
          '“Good morning, harbor. This is the Harbor Hour. Here’s what nobody’s said yet.',
          'Somebody at the bait shop is sick to death of squid. The Kowalskis’ spaniel would rather live on the Sea Wren. And Darlene thinks Mo’s joke has never once been funny.',
          'Oh, and somebody new on the pier has a question they haven’t asked yet. Answer it. They mean well.”',
        ],
      },
      body: [
        'By nine, the bait shop has a sign in the window that says NO MORE SQUID, EVER. A wet spaniel jumps onto the Sea Wren and refuses to be negotiated back off. At the end of the pier, Darlene puts down her coffee and tells Mo, kindly and finally, that his joke about the seagull and the lawyer has never once been funny. “Nine years I’ve been meaning to say that,” she says, amazed at herself. Mo looks stricken. Everyone on the pier looks at the sky, then at the water, then at you.',
        'Marisol, who opened the Seawall Bait and Tackle on the harbor road a year ago, waves you over. Hers is the only radio on the harbor that never loses the signal, and she has it on all day. “Nobody can find it,” she says. “Ham guys have tried. It says what you haven’t said yet, and then you say it. I put that squid sign up before I knew I was doing it. And now it’s talking about you.”',
      ],
      approaches: [
        {
          id: 'pier-talk',
          label: 'Work the pier, trading gossip until somebody trades back',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You trade a rumor for a rumor all the way down the pier. By the end, Mo has forgiven Darlene, the spaniel has a new home, and an old crabber tells you two things nobody says out loud. One: the Harbor Hour first came on the same week Marisol opened the bait shop, and you might ask her where her antenna goes. Two: in a year, the show has never said one word about Lyle Pettibone. “Sweetest man alive in the morning,” she says. “Two-faced as a nickel after dark.” Then, for no reason you can see, everyone within earshot changes the subject.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You try to start a rumor to see if the station picks it up, and you pick the wrong one: that Mo has a second joke. Within the hour it has reached Westhaven, Moonstone and somebody’s cousin in Eureka, and a small crowd gathers on the pier to hear it. Mo, who does not have a second joke, has to write one live. You spend the afternoon apologizing to Mo.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'log',
          label:
            'Write down every line of the broadcast and check them against the harbor',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'You keep a notebook. The morning show lists fourteen things nobody on the harbor has said yet; by nightfall thirteen have been said out loud, word for word, by the people they belong to. The fourteenth gets said in Westhaven instead, at the Double Hitch, after dark. And the show is not one voice. Two take turns, one easy and one low and rough, and the rough one only ever reads Westhaven. Whoever they are, they are reporting to each other.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You write everything down in a notebook you leave on the pier railing. A gull takes it. The next morning the Harbor Hour announces, on the gull’s behalf, that it has always secretly wanted to read, and three tourists photograph the gull doing exactly that.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'underneath',
          label:
            'Sit by Marisol’s radio at 5:59 and listen for what is underneath the broadcast',
          check: { skill: 'psyche', target: 7 },
          success: {
            text: 'You pull a stool up to Marisol’s radio before dawn and listen past the words. Under the gossip there is a room: a mug set down, a chair creaking, the tick of a toaster element somebody is using as a heater. Under the room there is the harbor, gulls and halyards. And under the harbor, faint as breath on a window, someone else is listening along with you, and laughs, once, half a second before you do.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You pull a stool up to Marisol’s radio before dawn, close your eyes to listen better and wake at 7:40 with a dial-shaped dent in your cheek. You missed the whole broadcast. Marisol has saved you the highlights on a paper bag, and the last one, copied word for word off the air, reads: Somebody new is too tired to admit it. Let ’em sleep.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara watches Darlene and Mo. “Whoever’s writing this show knows exactly where to put the needle.”',
        kit: 'Kit tunes Marisol’s radio by ear. “Low power. Close by. Somebody built this transmitter out of a toaster and spite.”',
        juniper:
          'Juniper edges down the railing, away from the radio. “If that thing reads what people haven’t said yet, I’m standing over here. You do not want to hear what I haven’t said about your shoes.”',
        cedar:
          'Cedar frowns at the radio. “My CB’s been catching a show like this for months. Different station. Same voice.”',
      },
      aloneLine:
        'Alone on the pier, you have the uneasy feeling that tomorrow’s broadcast already knows what you have not said yet.',
    },
    {
      title: 'The Man Who Never Sleeps',
      place: 'Trinidad pier and the Double Hitch Tavern in Westhaven',
      chapter: 2,
      scene: 'plaza',
      message: {
        medium: 'text',
        from: 'Marisol (Seawall Bait and Tackle)',
        lines: [
          'lyle swears he was behind the bar at the double hitch all night. davey backs him up',
          'he was ALSO on the pier at 6 buying sardines. from ME. he says he slept great',
          'i am not drinking. i am scared',
        ],
      },
      body: [
        'Lyle Pettibone is on the pier in a yellow rain slicker, cheerfully buying three pounds of sardines and asking after everyone’s mother. He looks like a man who slept nine hours. According to Davey, who works the Double Hitch Tavern in Westhaven fifteen minutes down the coast, Lyle counted out the till at sunrise and was still scowling at the coffee machine when Davey left at 5:55.',
        'Marisol shows you Davey’s photo from the bar, stamped 2:14 a.m.: Lyle in a black T-shirt, glaring at a man who ordered a mojito. Same face, same scar through the eyebrow. Lyle pays for his sardines, winks at you and walks off toward the Head trail, whistling. Nobody else on the pier so much as looks up. Marisol does. She watches him all the way to the trailhead, then turns her shop radio up, as if it might say something first.',
      ],
      recall: {
        'g1:pass':
          'You came into this already suspecting there is more behind the Harbor Hour than anyone on the pier will say. Lyle Pettibone’s morning has not helped.',
      },
      approaches: [
        {
          id: 'split-up',
          label:
            'Split the party, one on Lyle’s heels and one at the Double Hitch, and keep the phones on speaker',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You race to Westhaven while a friend of Marisol’s tails Lyle up the Head trail, both phones on speaker. “He’s at the overlook,” she reports. “He’s turning on a radio.” You walk into the Double Hitch, and behind the bar, scowling, somebody is turning on a radio too. You hear the same two words at the same instant, on the phone and across the bar: “Copy that.” Then both lines fill with static, and a calm voice you almost know says, “Look at the hands.” You look. The bartender wears a pinky ring on his left hand. On the phone, Marisol’s friend says, “Ring’s on his right. Why?”',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You race to Westhaven while someone tails Lyle up the Head. Halfway there your phone dies. When you arrive at the Double Hitch, the bartender is gone, the stool is still warm, and a man at the bar tells you Lyle left in a hurry because someone was coming. “Someone,” he says, looking at you over his beer, “who talks a lot.”',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'trick-question',
          label: 'Ask the pier Lyle something only the bar Lyle could know',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You catch up with Lyle at the trailhead and ask, friendly as anything, what goes in the Double Hitch house shot, the one he invented. Sunny Lyle hesitates exactly one beat, tips his head toward his collar as if listening to something, and says, “Fernet, pickle brine and regret,” in a voice half a step rougher than his own. Then he hears himself. He looks at you a long moment and says, quietly, “Huh. You’re the new one. The radio said you’d ask.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You ask him what goes in the Double Hitch house shot. Lyle beams at you with total, sunny incomprehension and invites you to a potluck. By the time you have politely declined three casseroles, he is gone, and you are holding a recipe card for a tuna dish you will never make.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'tail',
          label: 'Tail the pier Lyle up Trinidad Head in the drizzle',
          check: { skill: 'burly', target: 9 },
          success: {
            text: 'Lyle takes the trail up the Head, fast for a man his age. You keep pace through the wet brush and come out at an overlook just as he lifts a handheld air horn from his slicker pocket and gives one long blast toward Westhaven. Far down the coast, another horn answers. Lyle nods, satisfied, and says out loud to the empty air, “Your turn.”',
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
        kit: 'Kit unbends a coat hanger into a directional antenna and tapes it to Marisol’s scanner. “Somebody’s whispering on a low band right now. Walk me around. I’ll find the other end.”',
        juniper:
          'Juniper watches Lyle go. “Nobody tends bar till sunrise and looks that rested. Find out his secret and tell me first. Before the radio does.”',
        cedar:
          'Cedar’s CB crackles in his truck. He listens and frowns. “That voice on my CB. I know it from somewhere. Said to watch the bartender’s left hand.”',
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
        from: '87.9 FM, the Harbor Hour, 6:01 p.m.',
        lines: [
          '“Evening, harbor. Here’s what nobody’s said yet. Somebody at the Double Hitch is tired of pretending he hates mojitos.',
          'This next part is for the one who’s been asking around.',
          'Hi. It’s me. I mean it’s you. Here’s what you haven’t said yet: go to the net loft at eight. And when they lie, talk faster.”',
        ],
      },
      body: [
        'The voice on the radio is yours. Not like yours. Yours, warm and unhurried, the way you only ever sound inside your own head. It says, out loud, the things you have been thinking all week and not saying: that this case scares you a little, that you like this harbor more than you meant to, that you have been wondering about Marisol and feel bad about it. Marisol turns the radio off, then on again, and gives you a look. It is still you, signing off with a phrase you have carried around for years and never once said out loud.',
        'The net loft behind the bait shop has a thin wire antenna running up the side of the building and a light under the door. Inside, someone is arguing with someone who never quite interrupts. Out on the water the spray is up and the light is going, and somewhere down the coast a horn is waiting to answer.',
      ],
      recall: {
        'g2:tail':
          'You have already heard that horn answer itself from somewhere on the Head. You know which way the second one comes from.',
        'g2:pass':
          'Whatever Lyle Pettibone is doing, he is not doing it alone. You would bet your notebook on that now.',
        'g2:fail':
          'You never caught either Lyle at it. Tonight, somebody is going to have to explain it to you in person.',
      },
      approaches: [
        {
          id: 'take-mic',
          label:
            'Walk in, take the mic and broadcast a dare to whoever is in there',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You push open the door, grab the mic off its stand and go live before anyone can stop you. “Good evening, harbor. Breaking news: Lyle Pettibone is in two places at once, and I dare all of him to say good night.” Silence. Then, from the stools by the transmitter, a gruff voice and a gentle one say good night at the same time, and somewhere out on the water every boat radio in the harbor goes off with laughter.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You push open the door and go live, but you open with a pun, and it is not a good one. The gentle voice winces. The gruff one unplugs the transmitter. For one long second the whole harbor hears only static, and then, faintly, your own voice from the speaker sighing, “Not the pun. I told you, not the pun.” When you turn around, the back window is open and both stools are empty.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'answer-horn',
          label: 'Climb the Head and answer the foghorn in its own code',
          check: { skill: 'lore', target: 11 },
          cost: 'You have to guess the code from three days of listening and one bad night of sleep.',
          success: {
            text: 'One long, two short means “come home, it’s safe.” You worked it out from the gaps in the broadcasts, and you blow it from the overlook on an air horn borrowed from Marisol’s shop. Down at the harbor the loft light snaps off. Fifteen minutes later two men with the same face come puffing up the trail side by side, one in a rain slicker and one in a bar apron, arguing, and stop dead when they see it is you holding the horn. “Loft,” says the one in the slicker. “Now. Before anybody else heard that.”',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You blow what you think is “come home.” It turns out to mean “ran out of ice.” Twenty minutes later a truck pulls up at the Double Hitch with three bags of ice. By the time you drive down to explain, Davey has decided you are the new bar manager, and it takes an hour to talk him out of it. When you get back to the harbor, the loft is dark.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'listen',
          label:
            'Stand outside the loft and do exactly what the second voice tells you',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You turn the radio on outside the door and listen to yourself. “Knock three times,” you say. You knock three times. “Now say the thing you’ve been thinking since the pier.” So you say it, out loud, to a closed door: “I know there are two of you, and I think that’s wonderful.” On the other side of the door, there is a long silence, and then two locks slide back, one after the other, and someone very quietly starts to cry.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You listen to your own voice for a full minute and cannot stand it. You talk back. You argue with yourself. You lose. By the time you look up, the light under the door is off, the antenna has been pulled down, and a note on the door reads, in two different hands, OFF THE AIR. SORRY. NICE VOICE.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara squeezes your shoulder. “You sound good when you say what you mean. Tired, but good.”',
        kit: 'Kit holds up a hand-built antenna part she found in the trash. “They’ve been fixing this thing for twenty years. Two people. One pair of pliers.”',
        juniper:
          'Juniper listens to you on the radio and grins. “You’re funnier when you don’t edit yourself. Not a lot. But some.”',
        cedar:
          'Cedar listens to your voice on the speaker and whistles low. “Long distance from yourself, collect. My CB’s been trying to put that call through for months.”',
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
      'At six the next morning, 87.9 is static. The Harbor Hour never comes back. Lyle Pettibone is on the pier, cheerful as ever, buying sardines, and that night the bartender at the Double Hitch is as cranky as ever. Nobody catches him in two places at once again.',
      'Marisol leaves her radio tuned to the empty frequency, just in case. On foggy mornings, she swears, there is someone breathing on the other end, getting ready to say something.',
    ],
    recall: {
      'g3:pass':
        'Last night you got as close as anyone ever has: the loft, the voices, two men with one face. But with nothing from the pier and nothing from Westhaven to ask them with, you stood in the doorway with your mouth open, and a voice said, kindly, “Get some sleep, kid.” By morning the loft is swept bare.',
    },
    choices: [
      {
        id: 'leave-tuned',
        label: 'Leave your own radio tuned to 87.9',
        text: 'You leave it on. Months later, very faintly, you hear your own voice say the one thing you have been putting off telling an old friend. You call that afternoon and say it yourself.',
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
      'The net loft is a radio station the size of a closet: a transmitter built from a car stereo and a toaster, two stools, two coffee mugs, two notebooks labeled MORNING and NIGHT, and a wall of index cards covered in harbor gossip in two slightly different handwritings. On the two stools sit two Lyle Pettibones, one in a rain slicker and one in a bar apron, with the same face, the same scar and the same look of men who have been caught, or found.',
      'On the transmitter, the needle is still moving. Someone is still on the air, and it is not either of them. Marisol is in the doorway, staring at the antenna on her own back wall. “The show started the week I opened,” she whispers. “Half the harbor thinks it’s me. I have walked past that every day for a year. I thought it was for the gutters.” Out by the Head, the horn blows once, and nobody answers it.',
    ],
    afterMiss: [
      'It is past midnight when Marisol finds you, phone held up like a lantern. “The loft light’s back on,” she whispers. “Both of them went in. I think they’re packing.” The door isn’t locked. Inside, the transmitter is unplugged, the antenna lies coiled on the floor, and two Lyle Pettibones, one in a rain slicker and one in a bar apron, are packing index cards into two shoeboxes with the look of men who were about to leave town and have just been caught.',
      'Then the unplugged transmitter crackles on by itself. The needle moves. Someone is still on the air, and it is not either of them. Marisol stares at the coil of antenna wire that used to run up her own back wall. “The show started the week I opened,” she says. “Half the harbor thinks it’s me. I walked past that every day for a year. I thought it was for the gutters.” Out by the Head, the horn blows once, and nobody answers it.',
    ],
    recall: {
      'g1:log':
        'Among the index cards is one that just says NOTEBOOK KID, WATCH OUT, in the rougher handwriting.',
      'g2:fail':
        'You never managed to catch both of them in one place until now, and from their faces, they truly believed nobody ever would.',
    },
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
      mara: 'Mara studies the two men. “Ring on the right, ring on the left. Scar hooks one way, then the other. Mirror twins. Somebody on that pier must have noticed.”',
      kit: 'Kit is very carefully not touching the toaster transmitter. “This should not work. Nothing in this room should work. I want to live here.”',
      juniper:
        'Juniper smiles at both men. “You look less tired already. Two people are lighter than one.”',
      cedar:
        'Cedar sets the CB down, still playing. “Two of the same man on one frequency. Physics says no. My CB says hush.”',
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
        '“I couldn’t figure out how to be half of something,” Lowell says. “And I couldn’t afford two of anything,” Lyle says. So they became one man, mornings and nights, one name and one permit, and built the radio to keep their stories straight. “Then Lowell got lonely on the night shift,” Lyle says, “and started doing the weather on the public dial.” Lowell: “People liked the weather. And it was the week the bait shop opened, so if anybody went looking…” He glances at Marisol. “Sorry.” “And the things nobody’s said yet?” you ask. Lyle shrugs. “Half of it’s knowing everybody.” Lowell looks at the transmitter. “The other half isn’t us.”',
        'There is a knock. It is Darlene, with Mo behind her holding a cake tin. “We saw the loft light,” she says. “Lyle. Lowell. Honey. Everybody knows. The whole pier has known since the week of the funeral. We just never said it on the air.” Mo nods. “You built a radio station so nobody would notice. You could have asked.” Both brothers go white, then red. Marisol, holding the door, looks personally betrayed by an entire town.',
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
        '“Lyle,” says the one in the slicker. “Lowell,” says the one in the apron. “One boat, one permit, one debt, twenty years,” Lyle says. “We took turns being me. The radio was how we kept our stories straight.” Lowell nods at the needle. “Then a year ago I got lonely on the night shift and put the show on the public dial, and that started showing up. It reads what people haven’t said yet. Then they say it. It said somebody was coming, and to let you find us.”',
        'The speaker hisses. “Go on,” your own voice says. “You’ve been thinking it since the pier.” So you say it: that you think it is wonderful, two of them, and that you are sorry it was so hard. Then the voice on the speaker changes. It is Darlene’s, then Mo’s, then the old crabber’s, then a dozen voices from the pier one after another, all saying the one thing none of them has ever said on the air: “Lyle. Lowell. Honey. We’ve always known. Since the week of the funeral.” Both brothers go white, then red. Marisol looks personally betrayed by an entire town.',
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
        'The harbor throws the party that Saturday on the pier: one long table, one cake, two sets of candles, and every fisherman in Trinidad arguing about who knew first. Lowell gets his own fishing permit, eventually, after a very long afternoon of paperwork. Lyle cries when Lowell blows out his own candles for the first time in twenty years. Darlene tells a joke, and it is funny.',
        'The Harbor Hour goes legal by spring, a licensed little community station run out of the net loft, with a morning host and a night host who sound exactly alike and argue on air about everything. Every so often, in the middle of the gossip, a third voice cuts in, says the kind thing somebody on the harbor has been meaning to say for years, and signs off. By lunch, somebody always has. Nobody in Trinidad bothers asking who it is anymore.',
      ],
    },
    {
      id: 'one-life',
      title: 'One Life, Shared',
      tone: 'bittersweet',
      text: [
        'Lyle Pettibone goes on being the sweetest man on the pier before noon and the crankiest bartender in Westhaven after dark. The Harbor Hour goes back to whispering the harbor’s unsaid things at six, a little quieter now. You keep it, the way you would keep anyone’s secret that was mostly about love. Months later, over coffee, Darlene says the pier will keep it the way it always has: never once on the air, not even as a joke. It is the only rule the harbor has never broken.',
        'On your birthday, a card comes in two handwritings. It says, Thanks for seeing both of us. Most mornings at six you cannot tell which brother is on the air, and you realize that was always the point. Then, very softly, before the weather: Your turn. My turn. Your turn.',
      ],
    },
    {
      id: 'talk-to-yourself',
      title: 'Talk to Yourself',
      tone: 'strange',
      text: [
        'You talk until the fog lifts. You tell yourself about the case, and yourself tells you everything you have been meaning to say and have not: to your friends, to your family, to the person you still owe an apology, to the kid you were at fifteen. You both laugh at the same moment, at the same joke, which is somehow the most unsettling part.',
        'The signal goes at dawn. But every morning after that, at 6:02, there is a third voice on 87.9 for exactly one minute, and it is always you, saying the one thing you have not said yet that day. By lunch, you always have. Some days you listen. Some days you argue. Lyle and Lowell say that is the most normal thing about you.',
      ],
    },
  ],
}
