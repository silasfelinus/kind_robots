import type { Mystery } from '../types'

// Case XII. Seed: dreams, escape, compassion, illusion, art, sacrifice, two fish swimming opposite ways.

export const TWO_TAILED_MERMAID: Mystery = {
  id: 'two-tailed-mermaid',
  number: 12,
  sign: 'pisces',
  title: 'The Mystery of the Two-Tailed Mermaid',
  tagline:
    'A mermaid with two tails sings to the seals, and a lost busker’s hat keeps coming home full of sea glass.',
  region: 'Moonstone Beach, the Little River mouth and Clam Beach',
  hook: 'At dusk, in the Little River mouth, something with two tails sits on the rocks and sings to the harbor seals. A year ago Coral Venn, the glasswalking, fire-juggling street performer every Arcata kid remembers, walked into the surf at Clam Beach and was never seen again. Now her busking hat keeps turning up on the Arcata Plaza at sunrise, full to the brim with sea glass.',
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
    'Portrait 2:3 collectible mystery card, painted. The Little River mouth on the Humboldt coast at dusk: a wide sand bar where the river braids into the surf, a dark sea stack, silver driftwood, harbor seals hauled out in a row. On a rock sits a figure with two long tails curving in opposite directions, one toward the river and one toward the sea, sewn from faded patched cloth banners. Beside her rests a green felt hat full of glowing sea glass, and a small driftwood camp and low fire glow under the bluff. Faint pearl stars above form an unlabeled two-fish constellation. Teal, abyss blue and pearl. No text, no letters, no logos.',
  provenance:
    'Moonstone Beach, the Little River mouth, Clam Beach and the Arcata Plaza are real places, and harbor seals do haul out along this stretch of coast. Street performance is a real part of Arcata life, and sneaker waves are a real hazard on these beaches. Coral Venn, Wren, Hal, Dex, the hat, the sea glass, the driftwood camp and every other person and event here are invented. No real person, business or incident is depicted.',
  decline: {
    label: 'Tell Wren you don’t chase ghosts, or mermaids',
    text: 'You tell Wren to let it rest. She sends back a photo of the green hat on the Plaza bench, glinting in the sunrise, and then nothing. That night, down the coast, someone sings to the seals for an audience of no one.',
  },
  gates: [
    {
      title: 'The Hat That Keeps Coming Back',
      place: 'Clam Beach, where Coral walked into the surf',
      chapter: 2,
      scene: 'beach',
      message: {
        medium: 'text',
        from: 'Wren (Plaza fire spinner)',
        lines: [
          'the hat was on the plaza AGAIN. third time. same bench, sunrise, full of sea glass',
          'it’s coral’s hat. the green one with the bells. I saw her set it down at clam beach a year ago',
          'I’m taking it back there today. please come. I don’t want to be on that beach alone',
        ],
      },
      body: [
        'Clam Beach in the late afternoon is wide and bright and too windy for sad thoughts, which is why Wren picked it. She wears her fire-spinning chains as a belt and holds Coral Venn’s busking hat in both hands like a bird: green felt gone grey with salt, a ring of tiny brass bells around the brim. It is full of frosted sea glass: greens, ambers and one cobalt piece the size of a thumbnail.',
        '“A year ago Coral did her last show on the Plaza,” Wren says. “Then she drove up here, set the hat on the sand, and walked into the water in her stage clothes. They searched for a week and found nothing.” She swallows. “Somebody keeps filling her hat with sea glass. I need to know who.”',
      ],
      approaches: [
        {
          id: 'glass',
          label: 'Sort the sea glass and read where it came from',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'You spread the glass on Wren’s jacket. Most of it is ordinary beach glass, but three greens are worn long and smooth the way only a river does it. River glass, mixed in with sea glass. On this stretch of coast the two get tumbled together in one place: where the Little River meets the ocean, a few miles north, below Moonstone Beach.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You sort the glass by color into a lovely rainbow and photograph it, and it is a beautiful photo with no information in it whatsoever. A gust takes the cobalt piece out of your hand and bounces it down the beach. A gull eats it, or pretends to. Wren says it’s fine in a voice that means the opposite.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'good-days',
          label: 'Ask Wren what Coral was like when the hat was full',
          check: { skill: 'rizz', target: 7 },
          success: {
            text: 'You ask about the good days, and Wren lights up despite herself. Coral walked barefoot on broken glass and juggled fire on the Plaza every Saturday, and once did a whole show on her knees for a kid in a wheelchair, at eye level. Two summers busking in Europe. Then a man named Dex became her manager, then her partner, then her landlord, then her debt. “She stopped laughing onstage,” Wren says. “She kept smiling. It isn’t the same.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You ask the wrong question first, which is whether Wren thinks she’s dead, and Wren walks to the waterline and stands there a long time. When she comes back she is polite and distant, and the conversation is over. She lets you keep the hat for the night. You are not sure that is a kindness.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'tideline',
          label: 'Stand where Coral stood and look where she looked',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You stand above the tideline with the hat in your hands and look out to sea. Then, without meaning to, you look north, the way the beach curves toward the rocks and the river mouth. The bells on the brim chime once, in a wind blowing the other way. For a heartbeat you see footprints leaving the water a mile up the sand, walking north, and then a wave smooths them away.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You step too close and a sneaker wave arrives, as they do on this coast, with no warning and no remorse, soaking you to the waist. You stagger up the beach holding the hat over your head like a trophy. Wren grabs your arm, furious and frightened. “That’s exactly how it happens,” she says. “Don’t.”',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara turns the hat over and runs a thumb along the brim. “Somebody mended this recently. Small stitches. A performer’s stitches, done by firelight.”',
        kit: 'Kit goes quiet a long time. “I busked next to her once,” she says. “She gave me her pitch when mine got rained out. Nobody does that.”',
        juniper:
          'Juniper holds a piece of glass up to the sun. “This has been in the river and the ocean both,” she says. “Two lives. Like some people.”',
        cedar:
          'Cedar reads the beach like a road. “Her van didn’t sit here,” he says. “Somebody sold it, legit, with a signed title. Ghosts don’t sign titles.”',
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
        medium: 'voicemail',
        from: 'Unknown number, 0:58',
        lines: [
          '“Hi, this is Hal. I count seals for a volunteer survey up at Little River. This is going to sound strange.',
          'There’s a woman with two tails on the rocks at dusk. Singing. The seals come in to listen.',
          'I’ve done this nineteen years. Seals don’t come in to listen to anything. Come tonight. Bring something warm.”',
        ],
      },
      body: [
        'The Little River slides across a wide sand bar to meet the ocean, Moonstone Beach curling away to the south, and the seals lie along the bar like a row of sleeping loaves. Hal, a retired shop teacher with a clipboard of tally marks, hands you binoculars and points. On a rock at the river’s edge, as the sun sinks into the fog bank, a figure sits with two long tails spilling down the stone, one curling toward the river, one toward the sea.',
        'She is singing: no words you can catch, just a low, wandering tune that rises and falls with the surf. Every seal on the bar has turned its head toward her, and three have slid into the water to come closer. Under the bluff, a thin thread of smoke rises from somewhere in the driftwood.',
      ],
      approaches: [
        {
          id: 'duet',
          label: 'Sing back, badly but honestly',
          check: { skill: 'rizz', target: 9 },
          cost: 'You are going to sing, out loud, in front of Hal and the seals.',
          success: {
            text: 'You hum the one tune you know all the way through, which is embarrassing, and the mermaid stops. Then she picks up your tune and sings it back, slower and sadder and much better, the way a pro fixes a rookie’s set without making a show of it. At the end she lifts one hand to you. Hal writes “seals: 14, plus one duet” on his clipboard.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Your voice cracks on the first note so badly that two seals leave. The mermaid stops, turns, and looks at you across the water with pure stagecraft: the face of a performer whose quiet set just got heckled. Then she slips off the rock into the river and is gone.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'smoke',
          label: 'Follow the thread of smoke into the driftwood',
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'Behind a wall of storm-stacked logs you find a camp so tidy it looks curated: a driftwood lean-to, a fire ring of round stones, a crate of library books, and a clothesline hung with faded banners. Two have been cut into long tapering strips. On a third, under the salt, sun-bleached red letters still read CORAL VENN, LIVE.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You lose the smoke in a hundred yards of identical silver logs. When you finally climb out onto the sand it is full dark, the rock is empty, and Hal is sweeping his flashlight along the bluff calling your name like a lost-dog flyer.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'still',
          label:
            'Sit still at the edge of the haul-out and let her come to you',
          check: { skill: 'psyche', target: 7 },
          success: {
            text: 'You sit on the cold sand and do nothing, which is the hardest thing you have done all year. The seals forget you. The song goes on. Between one wave and the next, the two tails look like two different things: one is a stage banner, and the other is wrapped in water from some other evening, glinting with lights you can’t place.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You sit very still and a seal pup, unimpressed by your stillness, flops up beside you and yells. Hal, who knows the rules, makes you back off a full hundred yards for the pup’s sake. By the time you are settled again, the rock is empty and the singing has stopped.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara watches through the binoculars a long time. “She’s not performing. She’s practicing. Those are different faces.”',
        kit: 'Kit studies the tails. “Two banners, cut on the bias, weighted at the fins. She sewed that to move in water. That’s show construction.”',
        juniper:
          'Juniper wades into the river shallows, humming along. “Seals know who’s sad,” she says. “They come close for that.”',
        cedar:
          'Cedar sniffs the wind. “Driftwood fire, and somebody’s making coffee. Mermaids don’t make coffee.”',
      },
      aloneLine:
        'Alone on the bar, the song feels meant for nobody, which may be the whole point of it.',
    },
    {
      title: 'Showtime at Moonstone',
      place: 'Moonstone Beach and the river mouth, dusk',
      chapter: 2,
      scene: 'beach',
      message: {
        medium: 'flyer',
        from: 'Pinned to a driftwood log with a gull feather',
        lines: [
          'TONIGHT AT DUSK. ONE PERFORMANCE ONLY.',
          'Audience: seals. Admission: free. Humans: please don’t.',
          'P.S. to whoever keeps carrying my hat back to Clam Beach: I know where I left it.',
        ],
      },
      body: [
        'Moonstone Beach at dusk is all reflections, the sky doing something orange it will regret. The camp under the bluff has been swept and its banners taken down. On the big rock at the river mouth, someone has set a stage: a ring of sea glass on the stone and a single battered juggling torch, unlit.',
        'Wren has brought half the Plaza: two jugglers, a hula hooper, an accordion player, and the crepe vendor, who refused to be left out. They all promised to stay behind the logs. They are already not behind the logs. Out on the bar, the seals settle in like they bought tickets. The tide is coming in.',
      ],
      approaches: [
        {
          id: 'hush',
          label: 'Keep the Plaza crowd quiet so the show can happen',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You give the Plaza crew a backstage pep talk worth framing: this is her show, not ours, and nobody claps until the seals do. Twenty performers lie flat behind the logs in total silence, which none of them has ever managed. At dusk a two-tailed figure slides onto the rock, lights the torch, and juggles fire for the seals, and nobody breathes.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You ask for quiet, and the accordion player takes this as his cue for a gentle, supportive intro. The hula hooper joins in. On the rock, the mermaid freezes mid-climb, looks at the crowd of people she used to perform beside, and slides back into the river with a splash that sounds a lot like a sob.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'torch',
          label: 'Light a torch and walk out across the bar to join the show',
          check: { skill: 'psyche', target: 9 },
          cost: 'You have never juggled fire. You are going to carry it out there anyway.',
          success: {
            text: 'You light a torch from a driftwood fire and walk across the bar with it held high, not juggling, just carrying it, an offering. The mermaid watches you the whole way. When you reach the rock she leans down, lights her torch from yours, and says quietly, “You’re holding it like it bites. It won’t. Not tonight.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'Your torch gutters out halfway across the bar in a gust of spray. You stand in the dusk holding a smoking stick like a lost birthday guest. On the rock, the mermaid laughs, not unkindly, the laugh of someone remembering their own first time, and is gone before you can relight it.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara has brought a blanket, a thermos and a first-aid kit. “Whatever happens,” she says, “she’s going to be cold.”',
        kit: 'Kit is in her performing clothes. “If she does a show, she deserves somebody in the front row who knows what it costs.”',
        juniper:
          'Juniper sits with her feet where the river braids into the sea. “Two currents,” she murmurs. “Both pulling. Neither one wrong.”',
        cedar:
          'Cedar builds a small fire behind the logs and keeps it low. “Folks living out here are folks,” he says. “Talk to her like a neighbor.”',
      },
      aloneLine:
        'Alone at the river mouth, you have no one to hold your nerve but the seals, and the seals are not taking sides.',
    },
  ],
  coldCase: {
    title: 'The Empty Rock',
    place: 'The Little River mouth, a week later',
    chapter: 2,
    scene: 'rivermouth',
    body: [
      'The rock is empty at dusk. The driftwood camp under the bluff is gone, swept so clean you would never know anyone lived there. Hal’s seal count goes back to ordinary. Nobody sings.',
      'The hat turns up on the Plaza one last time, full of sea glass, with a single cobalt piece shaped like a heart on top. Wren keeps it. “She’s alive,” she says. “I’m choosing to believe that. I think she wants me to.”',
    ],
    choices: [
      {
        id: 'busk',
        label: 'Busk on the Plaza with Wren, in Coral’s old spot',
        text: 'You stand in Coral’s pitch with Wren and do the worst juggling act in Arcata history. People tip anyway. You leave every coin in the green hat on the bench at sunrise.',
        effects: { goodwill: 1 },
      },
      {
        id: 'heart',
        label: 'Keep the cobalt heart in your pocket',
        text: 'You keep it. Some nights, held to your ear, it sounds like surf and, very faintly, two songs going different ways.',
        effects: { weird: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Mermaid on the Rock',
    place: 'The rock at the Little River mouth, dusk',
    chapter: 2,
    scene: 'rivermouth',
    body: [
      'The torch gutters. The seals watch. The two-tailed mermaid sits on her rock with the tide rising around it, sea glass glinting in a ring at her feet, and looks at you with the tired, wary patience of a performer who has met every kind of audience and doesn’t know yet which kind you are.',
      'Up close, the tails are two old busking banners, cut and sewn and weighted with fishing sinkers at the fins, painted letters faded to ghosts across the scales. Her face is painted silver and teal, and under the paint is a face half of Arcata would know. Behind you on the sand, Wren has stopped breathing. The tide will cover the bar in eleven minutes.',
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
        label: 'Sit down on the rock and ask to hear the rest of the song',
        text: 'You don’t say her name. You sit on the cold stone and ask whether she’ll finish the song. After a long moment, she does.',
        next: 'two-currents',
      },
      {
        id: 'walk-back',
        label: 'Nod, walk back before the tide, and leave her be',
        text: 'You nod to her, one performer to another between sets, and walk back across the bar before the water closes it. You tell Wren what you saw, and then that you won’t say anything else.',
        ending: 'let-her-swim',
      },
    ],
    leadLines: {
      mara: 'Mara holds out the blanket and doesn’t step closer. “You don’t have to come down. It’s just here if you want it.”',
      kit: 'Kit kneels on the wet sand at eye level, the way Coral used to kneel for kids. “I’m Kit. You gave me your pitch once in the rain. I never thanked you.”',
      juniper:
        'Juniper smiles at the two tails. “One for the town and one for the sea. You can’t swim both ways forever, but you can try for a while.”',
      cedar:
        'Cedar stays back by his little fire. “Coffee’s on,” he calls, like it’s any other evening, and somehow that’s the kindest thing anyone says.',
    },
    aloneLine:
      'Alone on the rock with her, you are the whole audience, which is exactly what she didn’t want and maybe exactly what she needed.',
  },
  branches: {
    coral: {
      title: 'Coral',
      place: 'The rock at the Little River mouth',
      chapter: 2,
      scene: 'rivermouth',
      body: [
        '“I didn’t drown,” Coral says, hoarse from singing to seals. “I walked in up to my chest and stood there, and I thought, I could just keep going. Then I thought, or I could walk out somewhere else. So I did, a mile up the beach in the dark, in a sequined vest. The debt’s still there. Turns out debt doesn’t care if you’re a mermaid.”',
        'She looks down at the sea glass. “When I was nineteen I juggled fire in a square in Lisbon at two in the morning for six strangers, and one of them cried, and I knew what I was for. Then it turned into rent, and Dex, and smiling on cue, and I couldn’t find that place anymore. Seals don’t tip. Nobody’s selling anything out here. I just wanted to remember what it felt like when it was free.” She almost smiles. “The glass on the Plaza is me paying the town back. For all the years it paid me.”',
      ],
      choices: [
        {
          id: 'one-show',
          label: 'Ask if she would do one show, entirely on her own terms',
          text: 'You ask: one show, here, at sunset, for the seals and anyone willing to sit quietly on the sand. No hat. No manager. She thinks about it while the tide comes up around the rock.',
          ending: 'both-tails',
        },
        {
          id: 'keep-secret',
          label: 'Promise to keep her secret and let her stay',
          text: 'You promise. You tell Wren only that her friend is alive, and okay, and needs room. Coral nods and slides back into the river with both tails trailing.',
          ending: 'let-her-swim',
        },
      ],
    },
    'two-currents': {
      title: 'Two Currents',
      place: 'The rock at the Little River mouth, the song’s end',
      chapter: 2,
      scene: 'rivermouth',
      body: [
        'She sings it through. It is not a song you know, though it sounds like every song you’ve almost known. On the last note, river and sea meet over the bar in a long seam of foam, and the two tails stir in two directions at once, each pulled by its own tide.',
        'In the river-side water you see the Plaza at sunset in a year you don’t recognize, packed and quiet, a woman with silver in her hair juggling fire for kids and grandparents. In the sea-side water you see the same woman, older still, alone on a beach with no name, singing and entirely at peace. Coral, under the paint, is watching both. “I swim between them,” she says. “Every night. One tail each. I can’t tell which one I’m meant to keep.”',
      ],
      choices: [
        {
          id: 'river-side',
          label: 'Point toward the river-side future, the one with the crowd',
          text: 'You point, and Coral follows your hand and looks at that crowded future for a long time. Then she unties one fin and holds it out to Wren on the sand.',
          ending: 'both-tails',
        },
        {
          id: 'no-choice',
          label: 'Tell her she doesn’t have to choose tonight',
          text: 'You tell her nobody has to choose tonight. Coral smiles and lets the tide lift both tails at once.',
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
        'A month later a hand-lettered flyer goes up on the Plaza: ONE SHOW. MOONSTONE, SUNSET. NO HAT. SEALS FREE. Half of Arcata sits on the sand in a silence that would astonish anyone who has met Arcata. Coral walks up out of the river in both tails and does the old act, slower, and between tricks talks plainly about burning out and walking out of the sea somewhere else. Nobody claps until the seals do.',
        'Afterward, Wren and the Plaza crew start paying down Coral’s debt a dollar at a time, in the green hat. Coral does one show a season now, on her own schedule, with a small room in town and the driftwood camp for weekends. Her new banner says only CORAL, with two tails painted on it, swimming opposite ways.',
      ],
    },
    {
      id: 'let-her-swim',
      title: 'Let Her Swim',
      tone: 'bittersweet',
      text: [
        'You keep the secret, and Wren keeps it too once she understands. Coral stays at the river mouth through the winter, and Hal notes in his survey that the local seals have unusually refined taste in music. The hat stops appearing on the Plaza. The sea glass stops.',
        'In spring the camp under the bluff is gone, swept clean. Nobody knows where she went. A postcard reaches Wren with no return address, a painting of two fish swimming in a circle. On the back: Still swimming. Thank you for not calling me back to shore.',
      ],
    },
    {
      id: 'other-current',
      title: 'The Other Current',
      tone: 'strange',
      text: [
        'Coral never quite comes ashore and never quite leaves. People on the Plaza swear she busks there some Saturdays, silver-haired, doing a trick with glass that hasn’t been invented yet. Hal swears she sings at the river mouth every dusk, the same age she was the night you met her. Both of them are right. Some nights, both are right at once.',
        'You go back to the rock once, alone. In the ring of sea glass lies a piece in a color you’ve never seen, somewhere between teal and gold. Held to the light, it shows two Corals, one in each current, waving, and both of them look free.',
      ],
    },
  ],
}
