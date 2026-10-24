import type { Mystery } from '../types'

// Case V. Seed: pride, the spotlight, a generous heart that wants to be seen.

export const MIDNIGHT_MANE: Mystery = {
  id: 'midnight-mane',
  number: 5,
  sign: 'leo',
  title: 'The Mystery of the Midnight Mane',
  tagline: 'A golden lion steals the spotlight at the last midnight movie.',
  region: 'The Eureka waterfront, the Bellwether Palace',
  hook: 'Every Saturday at midnight a figure in a gold lamé lion mask walks onstage at the Bellwether Palace, hits every cue of the shadow cast’s show better than the cast does, and vanishes before the lights come up. The theater is being sold, and every Saturday since the lion showed up has sold out. The old-timers say they know exactly who is under that mask. The new cast says the old-timers are wrong.',
  design: {
    element: 'fire',
    motif: 'mane',
    palette: { sky: '#2a0d12', ink: '#f6c55a', glow: '#e0663a' },
    stars: [
      [18, 30],
      [26, 22],
      [36, 20],
      [44, 26],
      [42, 36],
      [52, 44],
      [70, 46],
      [82, 58],
      [64, 60],
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
      [8, 5],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. A faded 1912 vaudeville house on the Eureka waterfront at midnight, long since turned movie theater, red velvet curtains half open, a single gold follow-spot on an empty stage where a sequined gold lion mask rests on a corset and fishnet gloves, rice scattered on the boards, a crescent of theater seats in shadow. The spotlight beam fans out like a lion’s mane of rays. Faint gold stars over the proscenium arch form an unlabeled crouching-lion constellation. Warm ember red, gold and smoke. No text, no letters, no logos.',
  provenance:
    'Midnight shadow-cast screenings of The Rocky Horror Picture Show are a real, long-running tradition in many towns. Eureka and its waterfront are real. The Bellwether Palace, a vaudeville house built for longshoremen and mill hands, its history, cast, owner, projectionist, Lady Mane and the Gull & Gable buyer are invented. No real Eureka theater, theater rescue or business is depicted.',
  decline: {
    label: 'Tell Dani you only watch midnight shows from the seats',
    text: 'You reply that you are strictly audience. Dani writes back, “that’s what Brody said in 2019,” and then a photo of one gold sequin on a black floorboard, which you look at for longer than you meant to before you put the phone face down.',
  },
  gates: [
    {
      title: 'The Lion Who Knew the Old Callbacks',
      place: 'The Bellwether Palace, backstage',
      chapter: 3,
      scene: 'theater',
      message: {
        medium: 'text',
        from: 'Dani (Bellwether cast, Columbia)',
        lines: [
          'u were at the midnight show right??',
          'the LION came back. brody is livid. he says it stole his entrance',
          'we need someone not in the cast to look into it. come to the stage door. bring rice, we’re out',
        ],
      },
      body: [
        'The Bellwether was a vaudeville house for longshoremen and mill hands a century before it showed movies, and on wet nights it still smells of rope and sawdust. Its stage door is propped open with a fishnet-wrapped brick. Inside, twelve people in corsets and lab coats argue at once: two crab-boat deckhands, a night-shift nurse, half a Cal Poly Humboldt dorm. Brody, the cast’s current lead, is still in heels and full grievance. “It hit my mark,” he says. “It did my turn. The crowd yelled lines at it I’ve never even heard.”',
        'A gold sequin glints on the floorboards, then another. They lead somewhere. The owner, Marguerite Tsai, a sharp woman with a long black braid pinned up, paces the lobby on the phone with someone she keeps calling “the buyer.” “Ten Saturdays of box office, that was the deal,” she is saying, very crisply. “Count the house yourself.” There is a gold sequin on her cuff, and she doesn’t notice.',
      ],
      approaches: [
        {
          id: 'gossip',
          label: 'Work the cast for gossip over cold pizza',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'Three slices in, the oldest cast member, a retired postal clerk called Pops, goes quiet. “Those callbacks the crowd yelled,” he says. “Nobody’s used them since the eighties. Only two people ever did that turn right, and one of them taught it to the other.” He won’t say who. He looks, just once, at Brody, who has been doing something like that turn in rehearsal lately. Then Pops gets his coat and leaves early.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The cast decides you work for the buyer. Dani vouches for you, but only after you have been made to prove yourself by shouting the audience callbacks, which you do not know. The cast teaches you three, all of them filthy, applauds your delivery, and leaves you alone with the cold pizza and no idea who the lion is.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'sequins',
          label: 'Follow the trail of gold sequins',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'The sequins are metal, not plastic: heavy vintage lamé nobody has manufactured in decades. They lead through a crawlspace behind the screen and up a ladder to the locked projection booth. The dust on the ladder rungs has been wiped clean by someone careful and in heels, and on the top rung, snagged on a splinter, is a single long black hair. Brody is blond. Every old-timer swears Lady Mane went silver years ago.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'The sequin trail ends at a mop bucket. The janitor has been sweeping up gold glitter every Sunday for a month and has a very full jar. He is keeping it. “For my granddaughter,” he says, with the air of a man who will not be cross-examined.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'brody',
          label: 'Read Brody’s grievance for the lie in it',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'Brody’s outrage is very good, very rehearsed, and keeps pausing for him to check his phone. You follow him out to an old Buick in the alley, where a silver-haired woman in perfect eyeliner hands him a pair of heels: Ronnie “Lady Mane” Delacroix, the Bellwether’s lead for twenty-eight years, secretly teaching him her turn. “Don’t tell the cast,” Brody begs. “And I wasn’t the lion. Probably.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You tell Brody, kindly, that his grievance feels a little big. He takes it as a note and performs it again, smaller, then smaller still, until he is whispering it from four inches away with tears in his eyes. The cast gives him a standing ovation. You learn only that Brody can act.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara studies a sequin under her phone light. “Somebody hand-stitched this. Twice. That’s love or obsession, and in my line of work it’s usually both.”',
        kit: 'Kit is already looking up at the fly loft, measuring the drop. “Whoever it is knows this stage better than the cast does.”',
        juniper:
          'Juniper sniffs the air. “Hairspray from 1983,” she says. “I want some. Don’t tell me where it’s from, I’ll find it.”',
        cedar:
          'Cedar knocks on a wall flat. “Full moon, midnight show, a lion,” he says. “If the cosmos wanted subtle, it booked the wrong building.”',
      },
      aloneLine:
        'Alone in the wings, you hear a heel click once in the dark above you and then not again.',
    },
    {
      title: 'The Reel Nobody Ordered',
      place: 'The Bellwether Palace, projection booth',
      chapter: 3,
      scene: 'theater',
      message: {
        medium: 'voicemail',
        from: 'Unknown number, 0:47',
        lines: [
          '“This is Gil. I run the booth at the Bellwether. Dani gave me your number.',
          'There’s a reel on the end of the print that wasn’t there when I threaded it. It’s there every time I rewind. Not my splice. Not my film stock.',
          'Come up before the buyer’s inspector does. Knock twice, then once.”',
        ],
      },
      body: [
        'Gil is eighty-one and has projected film in this booth since the platters were new. He threads the mystery reel with hands that do not shake, and the beam crosses an empty house. Below, on a king tide, the closed balcony smells faintly of bay mud.',
        'On screen, a shadow cast performs in this very theater in 1981: the seats the old red velvet, the walls the old gold, the crowd in clothes nobody has worn since, shoulder pads and satin jackets, a girl of about ten in a homemade gold cape mouthing every word. The lion is onstage in the reel too, younger, already magnificent. In the third row, on the aisle, one seat is empty, and the rice keeps landing on it anyway. Downstairs, a door opens. The inspector is early.',
      ],
      approaches: [
        {
          id: 'watch',
          label: 'Watch the impossible reel to the end',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You do not blink. In the last frame the lion kneels at the lip of the stage and sets the mask, for one second, on the head of the girl in the gold cape. She doesn’t laugh. She looks like she has been handed a crown. Gil exhales like a man who has been holding his breath since the eighties. “Every Saturday there was a kid like that,” he says. “Some of them never left.”',
            effects: { weird: 1 },
          },
          failure: {
            text: 'The reel jumps the sprockets and burns through in a bloom of white. The smell of hot film fills the booth. Gil saves the splice but not the ending. “Whatever it showed,” he says, “it wanted us to stay to the end. We didn’t.”',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'lobby',
          label: 'Match the reel’s cast to the old lobby photos',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'You run downstairs and back with three framed photos under your arm. The lion’s posture matches a 1984 photo of Ronnie “Lady Mane” Delacroix, the Bellwether’s lead for twenty-eight years. But in a 1996 photo, a young understudy stands in the wings in the same mask, face turned from the camera, and her name has been scratched off the caption with something sharp. “Ronnie never missed a show,” Gil says. “So the understudy never went on. Not once.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You grab the wrong photos: the 1997 staff softball team. The inspector catches you on the stairs, frames under your arm, and asks whether you are stealing the theater one picture at a time.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'cans',
          label:
            'Haul the film cans down the ladder before the inspector arrives',
          check: { skill: 'burly', target: 7 },
          cost: 'Forty pounds of film and a ladder built for one careful person.',
          success: {
            text: 'You get all six cans down the back ladder and into the old organ loft before the inspector reaches the booth. He finds an empty projector and a note in Gil’s handwriting that says only, “Intermission.” When he leaves, the impossible reel goes back on the platter, warm to the touch.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'One can slips. It hits every rung on the way down. The inspector, now very awake, confiscates it as “a fire hazard,” which in fairness it is. It turns out to be twenty years of intermission ads for a tire shop. The impossible reel is still on the platter, and Gil is standing very innocently in front of it.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara leans toward the screen. “Those are real shoulder pads,” she says. “Nobody fakes shoulder pads that sincerely.”',
        kit: 'Kit counts the beats of the lion’s choreography under her breath. “That’s not an imitation. That’s the original.”',
        juniper:
          'Juniper points at the girl in the gold cape. “I’m making one of those,” she says. “Mine will be better. Don’t tell her.”',
        cedar:
          'Cedar listens to the projector like it is an engine. “That machine’s running on something other than electricity,” he says. “Old film, full moon. Something up there loves a rerun.”',
      },
      aloneLine:
        'With no one beside you, the reel feels like it is playing for you alone. Maybe it is.',
      recall: {
        'g1:pass':
          'Gil has heard you were asking questions backstage. “Good,” he says, threading the reel. “Somebody should.”',
        'g1:fail':
          'You came up the ladder with no idea who the lion is, which, Gil says, puts you level with everybody else in the building.',
      },
    },
    {
      title: 'The Last Midnight Show',
      place: 'The Bellwether Palace, the stage',
      chapter: 3,
      scene: 'theater',
      message: {
        medium: 'flyer',
        from: 'Taped to the box office window',
        lines: [
          'FINAL MIDNIGHT SHOW: TONIGHT. The Bellwether Palace closes forever after the last bow.',
          'Costumes encouraged. Props sold at the door. No refunds on nostalgia.',
          'Under it, in gold marker: Save me a seat. — L.',
        ],
      },
      body: [
        'Every seat is full, and the aisles are full, and the last bus from Arcata has emptied itself onto the sidewalk in corsets. The cast has agreed to your plan: if the lion comes, it will come for the big dance number, and when it does, somebody has to be ready. In the balcony the fire marshal closed in 2009, a silver-haired woman sits alone with a paper bag of lemon drops and perfect eyeliner, and nobody asks her to move.',
        'Marguerite stands at the back wall with her arms folded beside the buyer, a man from a Eureka outfit called Gull & Gable who wants twelve lofts and a cold-plunge spa where the stage is, and who is clicking a tally counter at every full row. Brody, in full costume, is so nervous he has started stretching his calves for no reason. The house lights dim.',
      ],
      approaches: [
        {
          id: 'bait',
          label: 'Take the lead role yourself to lure the lion onstage',
          check: { skill: 'rizz', target: 9 },
          cost: 'You will be in heels, in front of four hundred people.',
          success: {
            text: 'You strut. You are terrible, gloriously. The crowd loves you for it. At the top of the number, a gold shape drops from the fly loft and lands in a perfect split beside you, and four hundred people scream at once. The lion takes your hand. You are no longer the bait. You are the partner.',
            effects: { nerve: 1 },
            leadLines: {
              kit: 'It dropped straight through Kit’s wind machine. Later she will insist that was the plan.',
            },
          },
          failure: {
            text: 'You freeze on your first entrance. The crowd yells a callback at you that you have no answer for. The lion appears in the balcony, laughs, a deep and generous laugh, and is gone before the spotlight finds it.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'trapdoor',
          label: 'Rig the old trapdoor with the stage crew',
          check: { skill: 'burly', target: 9 },
          success: {
            text: 'The trapdoor has not opened since vaudeville. It takes you and three cast members to crank the counterweight, and when the lion steps onto the mark, the floor obliges. The lion drops two feet onto a pile of folded velvet curtains, sits up, and starts applauding you.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The counterweight sticks, then gives all at once, a full beat late. The trapdoor drops open on empty boards and breathes eighty years of vaudeville dust over the front three rows, who cough in rhythm, because this crowd does everything in rhythm. The lion steps neatly around the hole on its way offstage, pausing to blow you a kiss.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'callback',
          label: 'Yell the 1981 callback only the lion would answer',
          check: { skill: 'lore', target: 7 },
          success: {
            text: 'In the hush before the big number you stand up in the third row and yell a callback you dug out of a 1981 fan newsletter at the county library: the old question, the one the cast stopped teaching. The house goes dead quiet. From the fly loft a deep voice yells the answer back, right on the beat, and the golden lion drops into the follow spot Gil swings onto it, caught like a moth and not even slightly sorry.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You yell the callback a beat early and one word wrong, which in 1981 meant something else entirely. Four hundred people yell the filthy answer back at you with total joy, and the number falls apart laughing. When Gil’s follow spot finds the stage, it is empty. The lion is sitting in the third row, on the aisle, in your seat, eating your popcorn.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara has planted herself between the buyer and the aisle. “I counted the fire exits. Twice,” she says. “Somebody in this room should know where they are.”',
        kit: 'Kit has built a wind machine in the wings out of a bedsheet and two box fans. “If it comes,” she says, “it gets an entrance. Everybody deserves an entrance.”',
        juniper:
          'Juniper has claimed the best aisle seat in the house and will not be giving it up for the investigation.',
        cedar:
          'Cedar wears a lab coat over his flannel. “I’m a scientist,” he says, to everyone, with total confidence.',
      },
      aloneLine:
        'No cast, no crew, no friend in the wings. You walk out under the lights anyway, which is the whole point of a midnight show.',
      recall: {
        'g1:brody':
          'Brody keeps glancing up at the balcony, like somebody up there is grading him.',
        'g2:fail':
          'You never did see the reel all the way through. Gil has it threaded on the second projector tonight, just in case.',
      },
    },
  ],
  coldCase: {
    title: 'The Palace Goes Dark',
    place: 'The Bellwether Palace, the next morning',
    chapter: 3,
    scene: 'theater',
    body: [
      'The next morning, the marquee reads CLOSED. The lion never came back after the last show, or if it did, nobody was ready. A crew is already pulling the velvet seats.',
      'Dani texts a photo of a single gold sequin taped inside a program. “We never found out who it was,” she writes. “Marguerite signed the last papers this morning and didn’t say a word to anybody. Weird day.”',
    ],
    choices: [
      {
        id: 'third-row',
        label: 'Sneak back in and sit alone in the gutted house',
        text: 'A few days later the side door is still unlocked. Every seat is gone but one, bolted down in the third row, on the aisle. There is rice on it.',
        effects: { weird: 1 },
      },
      {
        id: 'venue',
        label: 'Help the cast find a new place to perform',
        text: 'You spend an afternoon calling halls and bars. A Grange in the valley says yes, on the condition that nobody throws toast at the piano.',
        effects: { goodwill: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Lion in the Spotlight',
    place: 'The Bellwether Palace, center stage',
    chapter: 3,
    scene: 'theater',
    body: [
      'The music crashes to its last chord, and the lion takes the bow. Nobody who has ever worn that mask has skipped a curtain call, and this one isn’t starting tonight. The cast freezes. Four hundred people hold their breath. The golden lion stands at center stage, chest heaving, mask glittering, and looks straight at you.',
      'Brody is in the wings, in full costume, mouth open. Up in the balcony, the silver-haired woman has put down her lemon drops. At the back wall the man from Gull & Gable has stopped clicking his tally counter and started looking around for Marguerite, whose place beside him has been empty since the lights went down. The house lights come up amber, the old way, the way they were in 1981. Now you decide what kind of story this is.',
    ],
    afterMiss: [
      'The number ends without its lion, and for one terrible moment the cast bows to a house that is still looking over its shoulder. Then the music comes back for the curtain call, and so does the lion. Nobody who has ever worn that mask has skipped a curtain call. It walks out into the only light left on, center stage, chest heaving, mask glittering, and looks straight at you, as if you were the one who missed a cue.',
      'Brody is in the wings, in full costume, mouth open. Up in the balcony, the silver-haired woman has put down her lemon drops. At the back wall the man from Gull & Gable has stopped clicking his tally counter and started looking around for Marguerite, whose place beside him has been empty since the lights went down. The house lights come up amber, the old way, the way they were in 1981. Now you decide what kind of story this is.',
    ],
    recall: {
      'g1:fail':
        'You still couldn’t swear to who is in there: the old legend, the furious new lead, or somebody else entirely. Four hundred people are about to find out with you.',
    },
    choices: [
      {
        id: 'unmask',
        label: 'Pull off the mask, in front of four hundred people',
        text: 'You reach up. The lion lets you.',
        next: 'unmasked',
      },
      {
        id: 'microphone',
        label: 'Hand the lion the microphone instead',
        text: 'You hold out the mic. The lion takes it like a crown.',
        next: 'encore',
      },
      {
        id: 'fire-door',
        label: 'Step aside so the lion can take the fire door',
        text: 'You step out of the light. The lion bows to you, deeply, and heads for the fire door. Halfway there it stops and, without turning around, lifts the mask an inch, enough for the back rows to see a long black braid pinned up under the mane, and the man from Gull & Gable says, out loud, “Marguerite?” Then, looking down at his tally counter: “Ten Saturdays.” The lion is gone into the fog off the bay, with the whole house cheering its back.',
        ending: 'reel-1981',
      },
    ],
    leadLines: {
      mara: 'Mara is looking at the mane, not the face. “Somebody mended that last week with the same thread as the sequins,” she whispers. “Whoever’s in there sews like they’re apologizing.”',
      kit: 'Kit kills her wind machine and comes out of the wings at a jog. “Whoever it is never once looked at the floor,” she says. “I want lessons.”',
      juniper:
        'Juniper squeezes your hand. “Unmask a lion in front of four hundred people and they’ll make you do the next show,” she says. “I would pay to see that.”',
      cedar: 'Cedar takes off his ballcap like he is in church.',
    },
    aloneLine:
      'Alone at center stage, with no one to look to, you understand that the lion has been waiting for you specifically.',
  },
  branches: {
    unmasked: {
      title: 'The Understudy',
      place: 'The Bellwether Palace, center stage',
      chapter: 3,
      scene: 'theater',
      body: [
        'The mask comes off, and four hundred people gasp, because it is not the legend and it is not the new lead. It is Marguerite Tsai, the owner, long black hair pinned flat under the mane, eyeliner perfect and chin up, with the sale agreement folded into her corset. “Six years her understudy,” Gil says over the booth microphone, to nobody and everybody. “Never once went on.” At the back wall the man from Gull & Gable looks down at his tally counter as if it has bitten him.',
        '“She never missed a Saturday,” Marguerite says into the silence, “so I never got one. When she retired I bought the building instead of taking the part, because owning it felt safer than wanting it. Then the money ran thin, and I was too proud to say I couldn’t run it alone, so I signed with Gull & Gable at a price set by the last ten Saturdays of box office. They were half empty. So I put on the mane, and every Saturday since has sold out.” She looks straight at the buyer. “You were paying for a lion. I told myself the price was all it was. It wasn’t. I was ten when she put this mask on my head in this room, for one second, and I wanted one Saturday.” Up in the balcony the silver-haired woman stands: Ronnie Delacroix, Lady Mane herself, sixty-eight. “You were always late on the turn,” she calls down. “Not tonight.”',
      ],
      choices: [
        {
          id: 'not-alone',
          label: 'Tell her she was never running it alone',
          text: 'You point at the balcony, where Ronnie is already on the stairs, and at the four hundred people behind her. “You just never asked,” you say. Marguerite reaches into her corset.',
          ending: 'long-live',
        },
        {
          id: 'bow',
          label: 'Let her take her bow and keep her word',
          text: 'You step back and start the applause yourself. Marguerite looks up at the balcony for a long time, and then at the man from Gull & Gable.',
          ending: 'one-more',
        },
      ],
      recall: {
        'g1:sequins':
          'Gil, over the booth microphone: “She changed in my booth every Saturday. I never asked. You don’t ask the lion.”',
      },
    },
    encore: {
      title: 'The Encore',
      place: 'The Bellwether Palace, center stage',
      chapter: 3,
      scene: 'theater',
      body: [
        'The lion does the number again, alone, a cappella, with four hundred people providing the backup and every old callback from 1981 coming out of the audience like it has been stored in the walls. When a foghorn sounds on the bay, the old-timers answer it with a callback nobody has yelled since the eighties. Brody stands in the wings mouthing the words and taking notes.',
        'At the end the lion walks to the wings, kneels in front of Brody and bows its head. Brody lifts the mask off with both hands, and his face tells the house before his mouth does: “Marguerite?” Long black hair pinned flat under the mane, eyeliner perfect, chin up, the sale agreement folded into her corset. At the back wall the man from Gull & Gable stops clicking. “Ten Saturdays,” Marguerite tells him, across four hundred people. “You were paying for the lion. I was the lion. I wanted your price and I wanted one Saturday, and I’m only sorry about the first one.” In the balcony the silver-haired woman is on her feet: Ronnie Delacroix, Lady Mane, who taught her the turn thirty years ago and never once let her use it. Up in the booth, Gil is threading the impossible reel again. The camera light on the old projector is blinking red.',
      ],
      choices: [
        {
          id: 'whole-cast',
          label: 'Bring the whole cast onstage, old and new',
          text: 'You wave them on: Pops, Dani, Brody, even the janitor, who has been sweeping up the lion’s sequins every Sunday and saving them in a jar. Ronnie comes down from the balcony and puts Brody’s hands where hers were in 1981, and then puts Marguerite’s beside them.',
          ending: 'long-live',
        },
        {
          id: 'film-it',
          label: 'Let the old projector film the moment',
          text: 'You nod to Gil. He lets the impossible camera roll. Marguerite looks right into the lens, like she has been waiting thirty years for this shot.',
          ending: 'reel-1981',
        },
      ],
      recall: {
        'g1:sequins':
          'Gil leans out of the booth window. “She changed up here every Saturday,” he calls down. “I never asked. You don’t ask the lion.”',
      },
    },
  },
  endings: [
    {
      id: 'long-live',
      title: 'Long Live the Queen',
      tone: 'true',
      text: [
        'Marguerite tears the sale agreement in half onstage, and four hundred people throw rice at her. The man from Gull & Gable walks up the aisle explaining, calmly, what breaking a signed contract costs, and the number is more than the Bellwether has cleared in a decade. Pops writes it on the back of the old 1981 volunteer sign-up sheet, and four hundred people start dividing it into Saturdays. Ronnie does the turn with Marguerite, then with Brody, then with anybody who asks, until the whole house is doing it badly together.',
        'At two in the morning the house lights are still up, and the sign-up sheet has run onto a second page and a pizza box. When you finally sit down, your seat in the third row on the aisle has a gold sequin glued to it and a card in eyeliner capitals: RESERVED: UNDERSTUDY.',
      ],
    },
    {
      id: 'one-more',
      title: 'One More Saturday',
      tone: 'bittersweet',
      text: [
        'Marguerite puts the mask back on and takes the bow she waited thirty years for. Then she tells the man from Gull & Gable, in front of everyone, exactly how ten Saturdays sold out. He takes a third off the price on the spot. She signs anyway, because she gave her word, and that is the kind of proud she is. The Bellwether closes, as planned. The velvet seats are sold in pairs on the internet.',
        'But on the last night the understudy finally went on, and the woman who taught her watched from the balcony and didn’t once look away. You buy two of the velvet seats. They don’t fit in your apartment. You keep them anyway.',
      ],
    },
    {
      id: 'reel-1981',
      title: 'The Reel From 1981',
      tone: 'strange',
      text: [
        'The next time Gil runs the impossible reel, it is longer. Tonight is on the end of it, every frame. And then it keeps going, backward, into 1981: the red velvet, the gold walls, the shoulder pads, and in the third row on the aisle an empty seat with rice falling on it in perfect time, beside a girl of ten in a homemade gold cape.',
        'Onstage in that one, the golden lion is still dancing. Gil has watched it a hundred times and swears it is never quite the same lion twice, and lately, when it turns on the beat, there is a long black braid under the mane.',
      ],
    },
  ],
}
