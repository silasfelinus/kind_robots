import type { Mystery } from '../types'

// Case V. Seed: pride, the spotlight, a generous heart that wants to be seen.

export const MIDNIGHT_MANE: Mystery = {
  id: 'midnight-mane',
  number: 5,
  sign: 'leo',
  title: 'The Mystery of the Midnight Mane',
  tagline: 'A golden lion steals the spotlight at the last midnight movie.',
  region: 'Old Town Eureka, the Bellwether Palace',
  hook: 'Every Saturday at midnight a figure in a gold lamé lion mask walks onstage at the Bellwether Palace, hits every cue of the shadow cast’s show better than the cast does, and vanishes before the lights come up. The theater closes for good in a week. Somebody wants one more curtain call.',
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
    'Portrait 2:3 collectible mystery card, painted. A faded Old Town Eureka movie palace at midnight, red velvet curtains half open, a single gold follow-spot on an empty stage where a sequined gold lion mask rests on a corset and fishnet gloves, rice scattered on the boards, a crescent of theater seats in shadow. The spotlight beam fans out like a lion’s mane of rays. Faint gold stars over the proscenium arch form an unlabeled crouching-lion constellation. Warm ember red, gold and smoke. No text, no letters, no logos.',
  provenance:
    'Midnight shadow-cast screenings of The Rocky Horror Picture Show are a real, long-running tradition in many towns. The Bellwether Palace, its cast, owner, projectionist and Lady Mane are invented. No real Eureka theater or business is depicted.',
  decline: {
    label: 'Tell Dani it’s a cast problem, not yours',
    text: 'You send back a lion emoji and a shrug. Dani replies with seventeen exclamation points and then nothing. Somewhere in Old Town, someone is practicing a strut you will never see.',
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
        'The stage door of the Bellwether Palace is propped open with a fishnet-wrapped brick. Inside, twelve people in corsets and lab coats argue at once. Brody, the cast’s current lead, is still in heels and full grievance. “It hit my mark,” he says. “It did my turn. The crowd yelled lines at it I’ve never even heard.”',
        'A gold sequin glints on the floorboards, then another. They lead somewhere. The owner, Marguerite Tsai, is in the lobby on the phone with someone she keeps calling “the buyer.”',
      ],
      approaches: [
        {
          id: 'gossip',
          label: 'Work the cast for gossip over cold pizza',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'Three slices in, the oldest cast member, a retired postal clerk called Pops, goes quiet. “Those callbacks the crowd yelled,” he says. “Nobody’s used them since the eighties. Only one Frank ever did that turn.” He won’t say the name. He doesn’t have to. He points at a lobby photo nobody has dusted since 1994.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'Brody decides you are a talent scout and performs his whole grievance for you twice. By the time he finishes, the cast has gone home and the pizza is gone. You leave knowing a great deal about Brody and nothing about the lion.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'sequins',
          label: 'Follow the trail of gold sequins',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'The sequins are metal, not plastic: heavy vintage lamé nobody has manufactured in decades. They lead through a crawlspace behind the screen and up a ladder to a locked projection booth. The dust on the ladder rungs has been wiped clean by someone careful and in heels.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'The sequin trail ends at a mop bucket. The janitor has been sweeping up gold glitter every Sunday for a month and has a very full jar. He is keeping it. “For my granddaughter,” he says, with the air of a man who will not be cross-examined.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara studies a sequin under her phone light. “Somebody hand-stitched this. Twice. That’s love or obsession, and in my line of work it’s usually both.”',
        kit: 'Kit is already looking up at the fly loft, measuring the drop. “Whoever it is knows this stage better than the cast does.”',
        juniper:
          'Juniper sniffs the air. “Hairspray from 1983. You can’t fake that.”',
        cedar:
          'Cedar knocks on a wall flat. “These old theaters have more crawlspaces than my uncle’s got excuses.”',
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
          '“This is Hollis. I run the booth at the Bellwether. Dani gave me your number.',
          'Somebody has been splicing a reel onto the end of the print. Not my splice. Not my film stock. It shows a crowd I don’t recognize.',
          'Come up before Marguerite’s inspector does. Knock twice, then once.”',
        ],
      },
      body: [
        'Hollis is seventy-four and has projected film in this booth since the platters were new. He threads the mystery reel with hands that do not shake, and the beam crosses an empty house.',
        'On screen, a shadow cast performs in this very theater, but the seats are new, the walls are painted a color you have never seen, and the audience is older, younger, stranger: people throwing rice in clothes nobody wears yet. The lion is onstage in the reel too, older and still magnificent. Downstairs, a door opens. The inspector is early.',
      ],
      approaches: [
        {
          id: 'watch',
          label: 'Watch the impossible reel to the end',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You do not blink. In the last frame the lion turns to the camera, lifts the mask an inch, and winks. On the marquee behind the crowd, the Bellwether is still open. Hollis exhales like a man who has been holding his breath since the seventies. “So it doesn’t close,” he says. “In that one, anyway.”',
            effects: { weird: 1 },
          },
          failure: {
            text: 'The reel jumps the sprockets and burns through in a bloom of white. The smell of hot film fills the booth. Hollis saves the splice but not the ending. “Whatever it showed,” he says, “it wanted us to stay to the end. We didn’t.”',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'lobby',
          label: 'Match the reel’s cast to the old lobby photos',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'You run downstairs and back with three framed photos under your arm. The lion’s posture, the angle of the wrist on the last note: it matches a 1984 photo of the Bellwether’s longest-running lead, Ronnie “Lady Mane” Delacroix, who played the role for twenty-eight years. Hollis taps the frame. “She retired when the new owners said they wanted younger legs. Broke her heart. Broke mine to watch.”',
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
            text: 'You get all six cans down the back ladder and into Hollis’s hatchback before the inspector reaches the booth. He finds an empty projector and a note in Hollis’s handwriting that says only, “Intermission.”',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'One can slips. It hits every rung on the way down. The inspector, now very awake, confiscates it as “a fire hazard,” which in fairness it is. The reel goes into a county storage unit with a padlock and a waiting list.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara watches the screen without blinking. “That crowd’s wearing ink I haven’t drawn yet.”',
        kit: 'Kit counts the beats of the lion’s choreography under her breath. “That’s not an imitation. That’s the original.”',
        juniper:
          'Juniper sways with the projector’s hum. “Some places keep dreaming after everyone leaves.”',
        cedar:
          'Cedar listens to the projector like it is an engine. “That machine’s running on something other than electricity.”',
      },
      aloneLine:
        'With no one beside you, the reel feels like it is playing for you alone. Maybe it is.',
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
          'FINAL MIDNIGHT SHOW. The Bellwether Palace closes forever after this Saturday.',
          'Costumes encouraged. Props sold at the door. No refunds on nostalgia.',
          'Under it, in gold marker: Save me a seat. — L.',
        ],
      },
      body: [
        'Every seat is full, and the aisles are full, and the balcony the fire marshal closed in 2009 is suspiciously full. The cast has agreed to your plan: if the lion comes, it will come for the big dance number, and when it does, somebody has to be ready.',
        'Marguerite stands at the back with her arms folded and the buyer beside her, a man in a fleece vest who checks his watch every time the audience shouts. Brody, in full costume, is so nervous he has started stretching his calves for no reason.',
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
          },
          failure: {
            text: 'You freeze on your first entrance. The crowd yells a callback at you that you have no answer for. The lion appears in the balcony, laughs, a deep and generous laugh, and is gone before the spotlight finds it.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'net',
          label: 'Rig the old trapdoor with the stage crew',
          check: { skill: 'burly', target: 9 },
          success: {
            text: 'The trapdoor has not opened since vaudeville. It takes you and three cast members to crank the counterweight, and when the lion steps onto the mark, the floor obliges. The lion drops two feet onto a pile of folded velvet curtains, sits up, and starts applauding you.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'The counterweight sticks, then gives all at once. The trapdoor opens under Brody instead. He lands safely, furious, and the lion steps neatly over the hole on its way off stage, pausing to blow you a kiss.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'spot',
          label: 'Kill the house lights and catch the lion in the follow spot',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'Hollis hands you the follow spot. You wait for the exact beat in the dance where the cast jumps, cut the house lights, and swing the beam. There, at center stage, frozen and fabulous, is the golden lion, caught like a moth and not even slightly sorry.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You hit the house lights a beat early. Four hundred people jump to the left in total darkness. When the lights return, the lion is sitting in the front row in your seat, eating your popcorn.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara has drawn a gold lion on the back of her hand in eyeliner. “For luck,” she says. “And for the photo.”',
        kit: 'Kit is in the fly loft before anyone can tell her not to be. “If it comes from above, I’m already here.”',
        juniper:
          'Juniper throws rice at exactly the wrong moments and somehow it feels right.',
        cedar:
          'Cedar wears a lab coat over his flannel. “I’m a scientist,” he says, to everyone, with total confidence.',
      },
      aloneLine:
        'You have nobody to dare you onstage. You go anyway. That is the whole point of a midnight show.',
    },
  ],
  coldCase: {
    title: 'The Palace Goes Dark',
    place: 'The Bellwether Palace, Monday',
    chapter: 3,
    scene: 'theater',
    body: [
      'Monday morning, the marquee reads CLOSED. The lion never came back after the last show, or if it did, nobody was ready. A crew is already pulling the velvet seats.',
      'Dani texts a photo of a single gold sequin taped inside a program. “We never found out who it was,” she writes. “Maybe that was the point.”',
    ],
    choices: [
      {
        id: 'stub',
        label: 'Keep the last ticket stub in your wallet',
        text: 'You keep it. Some nights it smells faintly of hairspray and rice.',
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
      'The music stops. Four hundred people hold their breath. The golden lion stands at center stage in the single white beam, chest heaving, mask glittering, and looks straight at you.',
      'Marguerite is halfway down the aisle. The buyer has stopped checking his watch. From the booth, Hollis switches the follow spot to warm amber, the old way, the way it was in 1981. Every story about this theater has been waiting for this moment. Now you decide what kind of story it is.',
    ],
    choices: [
      {
        id: 'unmask',
        label: 'Pull off the mask, the way it always goes',
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
        text: 'You step out of the light. The lion bows to you, deeply, and walks off through the fire exit into the Old Town fog, with the whole house cheering its back.',
        ending: 'next-year',
      },
    ],
    leadLines: {
      mara: 'Mara whispers, “Whatever you do, do it like it matters. It matters.”',
      kit: 'Kit drops from the loft and lands soft at your side. “Your call. I’ve got your back either way.”',
      juniper:
        'Juniper squeezes your hand. “Masks are only for the people who aren’t ready yet.”',
      cedar: 'Cedar takes off his ballcap like he is in church.',
    },
  },
  branches: {
    unmasked: {
      title: 'Lady Mane',
      place: 'The Bellwether Palace, center stage',
      chapter: 3,
      scene: 'theater',
      body: [
        'Under the mask is a woman of seventy-one with her eyeliner perfect and her chin up: Ronnie Delacroix, Lady Mane, who played the lead here from 1981 to 2009. Somebody in the balcony starts crying before she says a word.',
        '“In 1981,” she says into the silence, “this was the only room in this county where I could be exactly who I was, at full volume, and get applause for it. They retired me for younger legs. I just wanted one more Saturday.” Marguerite is standing at the edge of the stage. She heard every word.',
      ],
      choices: [
        {
          id: 'full-house',
          label:
            'Tell Marguerite the house is fuller than it has been in years',
          text: 'You point at the balcony, the aisles, the people standing three deep at the back. Marguerite looks for a long time. Then she tells the buyer, quietly, to go home.',
          ending: 'long-live',
        },
        {
          id: 'bow',
          label: 'Let Ronnie take her bow and walk out on her own terms',
          text: 'You step back and start the applause yourself. Ronnie takes the longest, slowest bow in the history of the Bellwether, and walks out through the front doors, straight down the center aisle, like she owns the place. For one night she does.',
          ending: 'one-more',
        },
      ],
    },
    encore: {
      title: 'The Encore',
      place: 'The Bellwether Palace, center stage',
      chapter: 3,
      scene: 'theater',
      body: [
        'The lion does the number again, alone, a capella, with four hundred people providing the backup and every old callback from 1984 coming out of the audience like it has been stored in the walls. Brody stands in the wings mouthing the lines and taking notes.',
        'At the end, the lion takes off the mask itself. It is Ronnie Delacroix, seventy-one, Lady Mane, and the house comes apart. Hollis, up in the booth, is threading the impossible reel again. The camera light on the old projector is blinking red.',
      ],
      choices: [
        {
          id: 'whole-cast',
          label: 'Bring the whole cast onstage, old and new',
          text: 'You wave them on. Pops, Dani, Brody, the janitor with the jar of gold glitter. Ronnie puts Brody’s hands where hers were in 1984 and shows him the turn.',
          ending: 'long-live',
        },
        {
          id: 'film-it',
          label: 'Let the old projector film the moment',
          text: 'You nod to Hollis. He lets the impossible camera roll. Ronnie looks right into the lens, like she has been waiting decades for this shot.',
          ending: 'next-year',
        },
      ],
    },
  },
  endings: [
    {
      id: 'long-live',
      title: 'Long Live the Queen',
      tone: 'true',
      text: [
        'The Bellwether does not close. By spring it is a community co-op, owned in small shares by four hundred people who all claim they were there that night. Ronnie directs. Brody learns the old callbacks and becomes, everyone agrees, a much better Frank for it.',
        'On the opening night of the co-op, a gold sequin is glued to every seat. Yours is in the third row, on the aisle, with a hand-lettered card: Reserved for the meddler.',
      ],
    },
    {
      id: 'one-more',
      title: 'One More Saturday',
      tone: 'bittersweet',
      text: [
        'The Bellwether closes, as planned. The velvet seats are sold in pairs on the internet. But on the last night, Ronnie Delacroix had her Saturday, and four hundred people learned her name again.',
        'A week later, a small package arrives: a single gold lamé glove and a note. “Thank you for the spotlight, darling. Everybody deserves one more.”',
      ],
    },
    {
      id: 'next-year',
      title: 'The Reel From Next Year',
      tone: 'strange',
      text: [
        'Hollis splices the night onto the end of the impossible reel. When he runs it the following week, the film has changed. The theater on screen is open and repainted that color you still cannot name, and in the third row, on the aisle, sits a version of you thirty years older, throwing rice with perfect timing.',
        'Onstage in the reel, the golden lion is still dancing. Nobody has ever been able to say who is under the mask in that one.',
      ],
    },
  ],
}
