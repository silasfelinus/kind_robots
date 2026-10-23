import type { Mystery } from '../types'

// Case XII. Seed: dreams, escape, compassion, illusion, art, sacrifice, two fish swimming opposite ways.

export const TWO_TAILED_MERMAID: Mystery = {
  id: 'two-tailed-mermaid',
  number: 12,
  sign: 'pisces',
  title: 'The Mystery of the Two-Tailed Mermaid',
  tagline:
    'Two tails, two currents, and a mermaid tour that guarantees a sighting.',
  region: 'Moonstone Beach, the Little River mouth and Clam Beach',
  hook: 'At dusk, at the Little River mouth, something sits on the rocks and sings to the harbor seals. Within a month there is a van on Scenic Drive selling MERMAID COVE TOURS, forty dollars, sighting guaranteed, and now, from the pullout, the thing on the rocks has two tails. And on the Arcata Plaza, a green busking hat nobody has claimed in a year keeps turning up at sunrise, full to the brim with sea glass.',
  design: {
    element: 'water',
    motif: 'two-fish',
    palette: { sky: '#04161c', ink: '#e6efe8', glow: '#2fa6a0' },
    stars: [
      [12, 62],
      [20, 55],
      [26, 62],
      [18, 69],
      [36, 66],
      [52, 70],
      [80, 80],
      [72, 60],
      [66, 42],
      [62, 26],
      [56, 16],
    ],
    links: [
      [0, 1],
      [1, 2],
      [2, 3],
      [3, 0],
      [2, 4],
      [4, 5],
      [5, 6],
      [6, 7],
      [7, 8],
      [8, 9],
      [9, 10],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. The Little River mouth on the Humboldt coast at dusk: a wide sand bar where the river braids into the surf, dark sea stacks, silver driftwood, harbor seals hauled out in a row. On two rocks sit two mermaids back to back, their tails curving in opposite directions, one toward the river and one toward the sea: one tail sewn from faded patched cloth banners, the other cheap and glittering. Beside the near rock rests a green felt hat full of glowing sea glass, and a small driftwood camp glows under the bluff. Faint pearl stars above form an unlabeled two-fish constellation. Teal, abyss blue and pearl. No text, no letters, no logos.',
  provenance:
    'Moonstone Beach, the Little River mouth, Clam Beach, Scenic Drive and the Arcata Plaza are real places, and harbor seals do haul out along this stretch of coast. Street performance is a real part of Arcata life, and sneaker waves are a real hazard on these beaches. Coral Venn, Nadia, Gordon, Dex Marlow, Mermaid Cove Tours, the hat, the sea glass, the driftwood camp and every other person, business and event here are invented. No real person, business or incident is depicted.',
  decline: {
    label: 'Tell Nadia you don’t chase ghosts, or mermaids',
    text: 'You tell Nadia to let it rest. She doesn’t answer. Two weeks later you pass a MERMAID COVE TOURS van on Scenic Drive and find you cannot look at it, which on a road that narrow takes real effort.',
  },
  gates: [
    {
      title: 'The Hat That Keeps Coming Back',
      place: 'Clam Beach, where Coral’s hat was found',
      chapter: 2,
      scene: 'beach',
      message: {
        medium: 'text',
        from: 'Nadia (Plaza fire spinner)',
        lines: [
          'the hat was on the plaza AGAIN. third time. same bench, sunrise, full of sea glass',
          'it’s coral’s hat. the green one with the bells. they found it on the sand at clam beach a year ago',
          'I’m taking it back there today. please come. I don’t want to be on that beach alone',
        ],
      },
      body: [
        'Clam Beach in the late afternoon is wide and bright and too windy for sad thoughts, which is why Nadia picked it. She wears her fire-spinning chains as a belt and holds Coral Venn’s busking hat in both hands like a bird: green felt gone grey with salt, a ring of tiny brass bells around the brim. It is full of frosted sea glass: greens, ambers and one cobalt piece the size of a thumbnail.',
        '“A year ago Coral did her last show on the Plaza,” Nadia says. “Next morning her van was in the lot up there and her hat was on the sand, with her shoes beside it. They searched for a week.” She pulls a flyer out of her pocket: MERMAID COVE TOURS, SUNSET SIGHTINGS, $40. “And now this. Dex printed it. Her old manager. He’s been on the Plaza asking everyone about the hat. Says she owed him money. He wants it back from a dead woman.”',
      ],
      approaches: [
        {
          id: 'glass',
          label: 'Sort the sea glass and read where it came from',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'You spread the glass on Nadia’s jacket. Most of it is ordinary beach glass, but three greens are worn long and smooth the way only a river does it. River glass, mixed in with sea glass. On this stretch of coast the two get tumbled together in one place: where the Little River meets the ocean, a mile or two north, just below Moonstone Beach.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You sort the glass by color into a lovely rainbow and photograph it, and it is a beautiful photo with no information in it whatsoever. A gust takes the cobalt piece out of your hand and bounces it down the beach. A gull eats it, or pretends to. Nadia says it’s fine in a voice that means the opposite.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'good-days',
          label: 'Ask Nadia what Coral was like when the hat was full',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You ask about the good days, and Nadia lights up despite herself. Coral walked barefoot on broken glass and juggled fire on the Plaza every Saturday, and once did a whole show on her knees for a kid in a wheelchair, at eye level. Two summers busking in Europe. Then Dex became her manager, then her partner, then her landlord, then her debt. “She stopped laughing onstage,” Nadia says. “She kept smiling. It isn’t the same.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You ask the wrong question first, which is whether Nadia thinks she’s dead, and Nadia walks to the waterline and stands there a long time. When she comes back she is polite and distant, and the conversation is over. She lets you keep the hat for the night. You are not sure that is a kindness.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'tideline',
          label: 'Stand where Coral’s hat was found and look north',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You stand above the tideline with the hat in your hands and look out to sea. Then, without meaning to, you look north, where the beach curves toward the rocks and the river mouth. The bells on the brim chime once, in a wind blowing the other way. For a heartbeat you see footprints leaving the water a mile up the sand, walking north, and then a wave smooths them away.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You step too close and a sneaker wave arrives, as they do on this coast, with no warning and no remorse, soaking you to the waist. You stagger up the beach holding the hat over your head like a trophy. Nadia grabs your arm, furious and frightened. “That’s exactly how it happens,” she says. “Don’t.”',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara turns the hat over and runs a thumb along the brim. “Somebody mended this recently. Small stitches. A performer’s stitches, done by firelight.”',
        kit: 'Kit goes quiet a long time. “I busked next to her once,” she says. “She gave me her pitch when mine got rained out. Nobody does that.”',
        juniper:
          'Juniper pockets the best green piece when she thinks nobody is looking. “Finders keepers,” she says, when she is caught. “The ocean owes me a sandal.”',
        cedar:
          'Cedar’s been on the phone with a guy he knows at a Eureka tow yard. “Her van went at a lien sale three weeks after,” he says. “Lienholder: D. Marlow. He took her van before they’d stopped searching.”',
      },
      aloneLine:
        'Alone with the hat on that wide beach, you notice the bells only ring when you face north.',
    },
    {
      title: 'The Song at the River Mouth',
      place: 'The Little River mouth, dusk',
      chapter: 2,
      scene: 'rivermouth',
      message: {
        medium: 'email',
        from: 'Gordon, Little River seal survey (volunteer list)',
        lines: [
          'Subject: Little River, unusual (long). Hello. Gordon here. I count the seals at this river mouth every week, rain or shine.',
          'There is a mermaid on the rocks at dusk. Some evenings there are two.',
          'When the far one sings, the seals come in. When the near one sings, they leave. I have a spreadsheet. Please come tonight. Bring something warm.',
        ],
      },
      body: [
        'The Little River slides across a wide sand bar to meet the ocean, Moonstone Beach and its sea stacks to the north, Clam Beach running away to the south. Gordon, a retired shop teacher with a waterproof notebook full of tally marks, hands you binoculars. Up on the pullout, a van painted MERMAID COVE TOURS unloads a dozen tourists, and right on cue a mermaid in a shiny one-piece tail waves at them from the near rock. A song you half recognize drifts over the water, a little too clean.',
        'Farther out, on a rock at the river’s edge, a second figure sits with her tail spilling down the stone toward the sea. From the pullout the two rocks line up, and the two of them blur into one creature with two tails, one toward the river and one toward the sea. This one is singing too: no words, a low, wandering tune that rises and falls with the surf. Every seal on the bar has turned its head toward her. Under the bluff, a thin thread of smoke rises from the driftwood.',
      ],
      approaches: [
        {
          id: 'duet',
          label: 'Sing back to the far rock, badly but honestly',
          check: { skill: 'rizz', target: 9 },
          cost: 'You are going to sing, out loud, in front of Gordon and the seals.',
          success: {
            text: 'You hum the one tune you know all the way through, which is embarrassing, and the far mermaid stops. Then she picks up your tune and sings it back, slower and sadder and much better, the way a pro fixes a rookie’s set without making a show of it. At the end she lifts one hand to you. Gordon writes “seals: 14, plus one duet” in his notebook.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Your voice cracks on the first note so badly that two seals leave. The far mermaid stops, turns, and looks at you across the water with pure stagecraft: the face of a performer whose quiet set just got heckled. Then she slips off the rock into the river and is gone. The near one keeps waving at the tourists.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'smoke',
          label: 'Follow the thread of smoke into the driftwood',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'Behind a wall of storm-stacked logs you find a camp so tidy it looks curated: a driftwood lean-to, a fire ring of round stones, a crate of library books, and a clothesline hung with faded banners. One has been cut into a long tapering tail. On another, under the salt, sun-bleached red letters still read CORAL VENN, LIVE. Nailed to a log, someone has pinned a Mermaid Cove flyer and drawn a knife through it.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You lose the smoke in a hundred yards of identical silver logs. When you finally climb out onto the sand it is full dark, both rocks are empty, and Gordon is sweeping his flashlight along the bluff calling your name like a lost-dog flyer.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'still',
          label:
            'Settle at the edge of the haul-out and let the song come to you',
          check: { skill: 'psyche', target: 7 },
          success: {
            text: 'You sit on the cold sand and make yourself smaller than the seals. They forget you. Between one wave and the next, the far mermaid is two women at once: one on the rock in a banner tail, and one on the Plaza at this same minute, juggling fire for a crowd, in a life where she never left. Both of them look tired, and neither one has decided.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You sit very still and a seal pup, unimpressed by your stillness, flops up beside you and yells. Gordon, who knows the rules, makes you back off a full hundred yards for the pup’s sake. By the time you are settled again, the far rock is empty and the singing has stopped.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara watches both rocks through the binoculars. “Near one is performing. Far one is practicing. Those are different faces.”',
        kit: 'Kit studies the tails. “Near one’s a rental, forty a night, I’ve worn it. Far one is a banner cut on the bias and weighted at the fin. She sewed that to move in water.”',
        juniper:
          'Juniper wades into the river shallows, humming along. “I want her to teach me that,” she says. “Not for the seals. For me.”',
        cedar:
          'Cedar sniffs the wind. “Driftwood fire, and somebody’s making coffee. Mermaids don’t make coffee.”',
      },
      aloneLine:
        'Alone on the bar, the far song feels meant for nobody, which may be the whole point of it.',
      recall: {
        'g1:fail':
          'Nadia came anyway. She stands a little apart from you on the bar, still deciding whether she has forgiven Clam Beach.',
      },
    },
    {
      title: 'Showtime at Moonstone',
      place: 'Moonstone Beach and the river mouth, sunset',
      chapter: 2,
      scene: 'beach',
      message: {
        medium: 'voicemail',
        from: 'Gordon, forwarding a recording, 0:41',
        lines: [
          '“Gordon. I recorded this at the far rock last night. I am not sure I should send it. Here.”',
          '[A woman’s voice, close to the mic, talking to the seals] “Okay, babies. One more show. Sunset tomorrow. No hat. No humans.',
          'Especially not him with the van. If he’s there, I’m not.”',
        ],
      },
      body: [
        'Moonstone at sunset is all reflections, the sky doing something orange it will regret. On the far rock at the river mouth someone has set a stage: a ring of sea glass on the stone and a single battered juggling torch, unlit.',
        'Nadia has brought half the Plaza: two jugglers, a hula hooper, an accordion player, and the crepe vendor, who refused to be left out. They all promised to stay behind the logs. They are already not behind the logs. And up on the pullout, right on schedule, the Mermaid Cove van is unloading a SUNSET SPECIAL, while the shiny mermaid wades out to the near rock with a speaker in a dry bag.',
      ],
      approaches: [
        {
          id: 'hush',
          label: 'Keep every crowd on this beach quiet so the show can happen',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You give the Plaza crew a backstage pep talk worth framing: this is her show, not ours, and nobody claps until the seals do. Twenty performers lie flat behind the logs, and somehow the tour group catches the hush too, and nobody so much as jingles. At sunset a mermaid slides onto the far rock, lights the torch, and juggles fire for the seals.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You ask for quiet, and the accordion player takes this as his cue for a gentle, supportive intro. The hula hooper joins in. Out on the water, the real mermaid freezes mid-climb, looks at the crowd of people she used to perform beside, and slides back into the river with a splash that sounds a lot like a sob.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'torch',
          label:
            'Light a torch and carry it out across the bar to the far rock',
          check: { skill: 'psyche', target: 9 },
          cost: 'You have never juggled fire. You are going to carry it out there anyway.',
          success: {
            text: 'You light a torch from a driftwood fire and walk across the bar with it held high, not juggling, just carrying it, an offering. The far mermaid watches you the whole way. When you reach the rock she leans down, lights her torch from yours, and says quietly, “You’re holding it like it bites. It won’t. Not tonight.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Your torch gutters out halfway across the bar in a gust of spray. You stand in the dusk holding a smoking stick like a lost birthday guest. On the far rock, the mermaid laughs, not unkindly, the laugh of someone remembering their own first time, and is gone before you can relight it.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'van',
          label: 'Send the Mermaid Cove van to the wrong beach',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'You tell the teenage van driver, with total confidence, that the mermaid has moved her sunset set to Clam Beach; your cousin has a seal permit. He believes you, because he is seventeen and paid by the hour. The van leaves. On the near rock, the shiny mermaid watches his ride go and says a word mermaids don’t say. On the far rock, a torch flares.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The driver checks his printed script, which says SHE IS ALWAYS HERE in capital letters, and charges you forty dollars for asking. You pay it, somehow. By the time you are back at the logs the far rock is empty and the torch is lying on its side, unlit.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara has brought a blanket, a thermos and a first-aid kit. “Whatever happens,” she says, “she’s going to be cold.”',
        kit: 'Kit is lashing a space blanket between two driftwood poles into a reflector aimed at the far rock. “If she does a show, she gets a follow spot. Sunset’s doing the work; I’m just pointing it.”',
        juniper:
          'Juniper sits with her feet where the river braids into the sea. “Two currents,” she murmurs. “Both pulling. Neither one wrong.”',
        cedar:
          'Cedar builds a small fire behind the logs and keeps it low. “Full moon and a big tide on the same night,” he says. “The universe is trying to get everybody wet. Don’t help it.”',
      },
      aloneLine:
        'Alone at the river mouth, you have no one to hold your nerve but the seals, and the seals are not taking sides.',
      recall: {
        'g2:pass':
          'Gordon has saved you a spot on his log. “Far rock,” he says, without looking up from his notebook. “The near one is a man.”',
      },
    },
  ],
  coldCase: {
    title: 'The Empty Rock',
    place: 'The Little River mouth, a week later',
    chapter: 2,
    scene: 'rivermouth',
    body: [
      'The far rock is empty at dusk. The driftwood camp under the bluff is gone, swept so clean you would never know anyone lived there. The Mermaid Cove van still parks on the pullout every evening, and its shiny mermaid still waves from the near rock, and Gordon’s seals still leave when it sings.',
      'The hat turns up on the Plaza one last time, full of sea glass, with a single cobalt piece shaped like a heart on top. Nadia keeps it. “She’s alive,” she says. “I know it. I just don’t know if she wants to be found.”',
    ],
    choices: [
      {
        id: 'busk',
        label: 'Busk on the Plaza with Nadia, in Coral’s old spot',
        text: 'You stand in Coral’s pitch with Nadia and do the worst juggling act in Arcata history. People tip anyway. You leave every coin in the green hat on the bench at sunrise.',
        effects: { goodwill: 1 },
      },
      {
        id: 'heart',
        label: 'Throw the cobalt heart back in at the river mouth',
        text: 'You throw it as far as you can, out where the river meets the sea. The next morning the hat on the Plaza has two cobalt hearts in it.',
        effects: { weird: 1 },
      },
    ],
    recall: {
      'g2:pass':
        'What you found at the river mouth was not a costume and not a ghost. Nadia has stopped asking whether. Now she is asking why.',
      'g3:pass':
        'At sunset at Moonstone a torch was lit on the far rock by a hand that knew exactly what it was doing. Nadia saw it too.',
      'g3:torch':
        'You carried a torch across that bar toward her, lit or not, and she watched you come. Nadia makes you describe her three times.',
    },
  },
  reveal: {
    title: 'Two Mermaids',
    place: 'The rocks at the Little River mouth, dusk',
    chapter: 2,
    scene: 'rivermouth',
    body: [
      'Full dark is twenty minutes off when the near rock’s show falls apart. The tide reaches the speaker wedged in the stones, it coughs once and dies, and the shiny mermaid is left lip-syncing to the surf. A wave slaps him off the rock. He comes up in the shallows with his wig floating off toward Trinidad: a red-faced man in his forties with a headset mic. “She owes me eleven grand,” Dex Marlow sputters, to nobody. “Somebody was singing on this rock, and I know that voice. Forty bucks a head to sit here every sunset till she showed. Surveillance that pays for itself.”',
      'On the far rock the other mermaid has not stopped singing. You end up at the foot of her rock, the way you were always going to, and up close her tail is an old busking banner, cut and sewn and weighted with fishing sinkers at the fin, painted letters faded to ghosts across the scales. The torch in her hand is real. “I’m not a ghost, before anyone asks,” she says. “Ghosts don’t get this cold.” Nadia, who has waded out behind you, has gone completely still. The tide will cover the bar in eleven minutes.',
    ],
    afterMiss: [
      'The show is over before it starts. The far rock is empty, the seals are drifting back to the bar, and the sunset special wants its forty dollars back. Then the tide reaches the speaker wedged in the near rock. It coughs once and dies, and the shiny mermaid is left lip-syncing to the surf until a wave slaps him off the rock. He comes up in the shallows with his wig floating off toward Trinidad: a red-faced man in his forties with a headset mic. “She owes me eleven grand,” Dex Marlow sputters, to nobody. “Somebody was singing on this rock, and I know that voice. Forty bucks a head to sit here every sunset till she showed. Surveillance that pays for itself.”',
      'Later, when the tourists have gone and the Plaza crew has gone quiet, a voice behind you on the dark sand says, “Is he gone? You’re sure?” The other mermaid has walked up out of the river, her tail dragging, a torch unlit in her hand. Up close the tail is an old busking banner, cut and sewn and weighted with sinkers, painted letters faded to ghosts across the scales. “I’m not a ghost, before anyone asks,” she says. “Ghosts don’t get this cold.” She is looking past you, at Nadia.',
    ],
    choices: [
      {
        id: 'say-name',
        label: 'Say her name, gently',
        text: 'You say, “Coral.” Not as a question. The mermaid closes her eyes, and the torch in her hand shakes once.',
        next: 'coral',
      },
      {
        id: 'hear-song',
        label: 'Sit down beside her and ask to hear the rest of the song',
        text: 'You don’t say her name. You sit down beside her and ask whether she’ll finish the song. After a long moment, she does.',
        next: 'two-currents',
      },
      {
        id: 'walk-back',
        label: 'Nod, walk back before the tide, and leave her be',
        text: 'You nod to her, the way you would to anyone between sets, and walk back across the bar with Nadia before the water closes it. Nadia, beside you, says nothing at all, and you both agree without a word to keep it.',
        ending: 'let-her-swim',
      },
    ],
    leadLines: {
      mara: 'Mara holds out the blanket and doesn’t step closer. “No pressure. It’s just here if you want it.”',
      kit: 'Kit kneels on the wet sand at eye level, the way Coral used to kneel for kids. “I’m Kit. You gave me your pitch once in the rain. I never thanked you.”',
      juniper:
        'Juniper watches Dex wring out his wig. “I wanted to be a mermaid when I was six,” she says. “Then I met the people who sell them.”',
      cedar:
        'Cedar stays back by his little fire. “Coffee’s on,” he calls, like it’s any other evening, and somehow that’s the kindest thing anyone says.',
    },
    aloneLine:
      'Alone with her, you are the whole audience, which is exactly what she didn’t want and maybe exactly what she needed.',
    recall: {
      'g2:duet':
        'She knows your voice. You sang across this water to her once, well or badly, and performers never forget a heckler or a duet.',
    },
  },
  branches: {
    coral: {
      title: 'Coral',
      place: 'The Little River mouth, dusk',
      chapter: 2,
      scene: 'rivermouth',
      body: [
        'She looks past you to Nadia, and her face does something no stage paint can cover. “I’m sorry,” she says. “I couldn’t come back as myself. I didn’t know how.” Then, to you, hoarse from singing to seals: “I didn’t drown. I walked in up to my chest and stood there, and I couldn’t see a way forward. Then a seal came up right in front of me and looked so offended that I laughed, and I hadn’t laughed in a year. I want to say this plainly, because Nadia’s here: I wanted to live. I still do. I walked out of that water on purpose, a mile up the beach in the dark. I didn’t need to vanish from my life. I needed to vanish from a debt and from him. The debt’s still there. Turns out debt doesn’t care if you’re a mermaid.”',
        '“When I was nineteen I juggled fire in a square in Lisbon at two in the morning for six strangers, and one of them cried, and I knew what I was for. Then it turned into rent, and Dex, my manager, then my boyfriend, then my landlord, and smiling on cue, and I couldn’t find that place anymore. Seals don’t tip. Nobody’s selling anything out here, or nobody was.” She almost smiles. “The glass on the Plaza is me paying the town back. For all the years it paid me.”',
      ],
      choices: [
        {
          id: 'one-show',
          label: 'Ask if she would do the show now, on her own terms',
          text: 'You ask: one show, here, right now, on the beach below the bluff, for the seals and anyone willing to sit quietly on the sand. No hat. No manager. She thinks about it while the tide comes in over the bar.',
          ending: 'both-tails',
        },
        {
          id: 'keep-secret',
          label: 'Promise to keep her secret and let her stay',
          text: 'You promise. Nadia promises too, through tears, and says she only needed to know. Coral touches her hand once and slides back into the river.',
          ending: 'let-her-swim',
        },
      ],
    },
    'two-currents': {
      title: 'Two Currents',
      place: 'The Little River mouth, the song’s end',
      chapter: 2,
      scene: 'rivermouth',
      body: [
        'She sings it through. It is not a song you know, though it sounds like every song you’ve almost known. On the last note, river and sea meet over the bar in a long seam of foam, and her reflection splits along it, one in each current.',
        'In the river-side water you see the Plaza at this same minute, packed and quiet, and a Coral who never left juggling fire for kids and grandparents, tired and paid and laughing. In the sea-side water you see a Coral who kept walking north under a new name, frying fish in a harbor town up the coast and singing to the dishwasher, alive and unbothered and nobody’s. Coral, under the paint, is watching both. “I didn’t come out here to stop living,” she says. “I came out here to stop being his. Both of those are lives. I can’t tell which one I’m meant to keep.”',
      ],
      recall: {
        'g2:still':
          'You sat at the edge of this haul-out once before, trying to see her clearly. Tonight she is the one looking.',
      },
      choices: [
        {
          id: 'river-side',
          label: 'Point toward the river-side life, the one with the crowd',
          text: 'You point, and Coral follows your hand and looks at that crowded Plaza for a long time. Then she holds out her hand to Nadia.',
          ending: 'both-tails',
        },
        {
          id: 'no-choice',
          label: 'Tell her she doesn’t have to choose tonight',
          text: 'You tell her nobody has to choose tonight. Coral smiles and lets the tide lift her banner tail, and her reflection, both ways at once.',
          ending: 'other-current',
        },
      ],
    },
  },
  endings: [
    {
      id: 'both-tails',
      title: 'Both Tails',
      tone: 'true',
      text: [
        'The show starts eleven minutes later, on the beach below the bluff, by firelight. Half the Plaza sits on the logs in a silence that would astonish anyone who has met the Plaza, and whatever tourists are left stay to watch for free. Coral walks up out of the river and does the old act, slower: fire, glass, a song for the seals. Between tricks she talks plainly about burning out, and about walking out of the sea on purpose because she wanted to keep living. Nobody claps until the seals do.',
        'Dex watches from the pullout in a wet sequined tail, a man learning what a guaranteed sighting costs. At the end Nadia hands Coral the green hat, full of the night’s tips, and Coral walks it up to him and puts it in his hands. “Down payment,” she says. “The rest goes through a lawyer, like grown-ups.” Then she walks back down to the river mouth where Nadia is waiting with a blanket, and the two of them sit on the sand until the tide makes them move.',
      ],
    },
    {
      id: 'let-her-swim',
      title: 'Let Her Swim',
      tone: 'bittersweet',
      text: [
        'You keep the secret, and Nadia keeps it too. The Mermaid Cove van disappears from Scenic Drive within a week; nobody books a tour whose mermaid is a soaked man in a wig. Coral stays at the river mouth through the winter, and Gordon notes in his survey that the local seals have unusually refined taste in music. The hat stops appearing on the Plaza. The sea glass stops.',
        'In spring the camp under the bluff is gone, swept clean. Nobody knows where she went, but in May Nadia gets a postcard from a harbor town up the coast, no return address, one line: Still laughing. — C. Gordon’s survey sheet for the last evening in April reads, in his careful shop-teacher capitals: Seals present: 14. Mermaid: absent. Song: still going, somewhere.',
      ],
    },
    {
      id: 'other-current',
      title: 'The Other Current',
      tone: 'strange',
      text: [
        'Coral never quite picks one life, and never quite leaves either. People on the Plaza swear she busks there some Saturdays at dusk, juggling three pieces of sea glass that hang in the air a beat too long, like water deciding which way to fall. Gordon swears she sings at the river mouth at that same dusk, at that same minute. Both of them are right. Some evenings, both are right at once.',
        'You go back to the rock once, alone. In the ring of sea glass lies a piece in a color you’ve never seen, somewhere between teal and gold. Held to the light, it shows two Corals, one on the Plaza and one up the coast, both of them alive and waving, and both of them look free.',
      ],
    },
  ],
}
