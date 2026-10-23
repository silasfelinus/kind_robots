import type { Mystery } from '../types'

// Case VII. Seed: balance, fairness, partnership, beauty, diplomacy, indecision.

export const MIDNIGHT_MAGISTRATE: Mystery = {
  id: 'midnight-magistrate',
  number: 7,
  sign: 'libra',
  title: 'The Mystery of the Midnight Magistrate',
  tagline:
    'A ghost judge with brass scales settles a sixty-year feud one porch at a time.',
  region: 'Ferndale: the hillside cemetery and the Main Street Victorians',
  hook: 'For three weeks, two Ferndale families who have not spoken since 1966 have been waking up to each other’s belongings on their porches, traded in pairs so exactly balanced you could weigh them. Then the summonses started. Somebody in a powdered wig is holding court in the hillside cemetery at midnight, and so far nobody has come to be judged.',
  design: {
    element: 'air',
    motif: 'scales',
    palette: { sky: '#1d1b2f', ink: '#d9def0', glow: '#a397d1' },
    stars: [
      [50, 18],
      [24, 50],
      [76, 44],
      [18, 80],
      [70, 76],
      [82, 86],
    ],
    links: [
      [0, 1],
      [0, 2],
      [1, 2],
      [1, 3],
      [2, 4],
      [4, 5],
    ],
  },
  artPrompt:
    'Portrait 2:3 collectible mystery card, painted. A Victorian hillside cemetery above a small dairy-country town at midnight, white marble headstones and windswept cypress in drifting fog, a lantern-lit table set on a flat granite marker holding an open ledger, a gavel and a polished pair of brass balance scales, an old curled judge’s wig resting beside them. Below, gingerbread Victorian rooftops with two porch lights glowing side by side. Faint silver stars above the fog form an unlabeled small balance-shaped constellation. Fog lavender, silver-blue and brass. No text, no letters, no logos.',
  provenance:
    'Ferndale, its Victorian Main Street and its hillside cemetery are real, and Ferndale is the long-time home of the Humboldt County Fair. Wendell Ames, Rafael, the Miranda and Halvorsen families, the Midnight Court, the 1966 pie contest and everything else are invented. No real business, resident or fair judging is depicted.',
  decline: {
    label: 'Tell Lupe that gnome law is outside your jurisdiction',
    text: 'You text back that you don’t practice gnome law. Lupe sends a photo of her grandfather glaring at a fence board. In Ferndale, a copperplate summons goes unanswered, and somebody sighs and puts away a wig.',
  },
  gates: [
    {
      title: 'One Gnome for One Fence Board',
      place: 'Ferndale, a side street off Main',
      chapter: 5,
      scene: 'plaza',
      message: {
        medium: 'text',
        from: 'Lupe Miranda (stats study group)',
        lines: [
          'ok so my family is haunted now',
          'grandpa’s gnome is GONE and on our porch is a board from our own fence. the halvorsens have the gnome. and a card that says “one for one. the court has weighed it.”',
          'they think we did it. we think they did it. come before someone calls the sheriff about a gnome',
        ],
      },
      body: [
        'Ferndale looks like a town somebody built for a cake: Victorians in butterscotch and teal, gingerbread trim, a Main Street holding its breath to be photographed. Two houses on a side street are the exception. Between them runs a fence so old and so argued-over it leans in both directions at once.',
        'On one porch Tony Miranda, eighty-six, holds a fence board like a rifle. On the other, Signe Halvorsen, eighty-four, holds a ceramic gnome like a hostage. Neither looks at the other. Both talk to you. Pinned to each door is the same cream card in a beautiful copperplate hand: The Midnight Court has weighed this exchange and found it fair.',
      ],
      approaches: [
        {
          id: 'two-coffees',
          label: 'Take coffee on both porches, one cup each, in turns',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You split the morning exactly in half: Tony’s coffee black, Signe’s with cardamom, back and forth over the fence like a tennis match. By the fourth cup the story is out. The fence went up in 1966. The water line was shared since the creamery days. And that August, at the county fair, Signe’s olallieberry pie beat the pie of Tony’s wife, Rosa, by a single point. Rosa is gone now. Neither of them has said her name to the other in sixty years.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You accept coffee on the Miranda porch first. Over the fence, Signe Halvorsen watches you drink it the way a general watches a border crossing. When you reach her steps the door is shut, and through the window you can see her adding to a list on the refrigerator titled TRAITORS, with a fair description of you at the bottom.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'kitchen-scale',
          label: 'Weigh the traded items on a kitchen scale',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'You borrow Lupe’s baking scale. The gnome: 2.31 kilograms. The fence board: 2.31 kilograms. Tony’s missing hose nozzle and Signe’s missing pie server, both returned across the fence last week: 212 grams each. Every trade balances to the gram. Whoever is doing this is not a thief. It is somebody with a very good scale and a very particular idea of fair.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You set the gnome on Lupe’s baking scale. It reads ERR, then 0, then a number so large it suggests the gnome is a small moon. Lupe admits the scale has not worked since a pancake incident in 2019. Signe confiscates the gnome again “for evidence handling” and will not say where she put it.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'knothole',
          label: 'Read the history in the traded fence board',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'The board is old redwood gone silver, with a knothole worn smooth at exactly a small child’s eye level. Lupe turns pink. “That’s the knothole,” she says. “Soren Halvorsen and I passed notes through it from kindergarten through high school. Nobody was supposed to know.” Whoever traded this board knew. Somebody has been watching these two houses for a very long time, and kindly.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You flip the board over looking for clues and collect a sixty-year-old splinter the length of a toothpick. Tony removes it with a pocketknife and a lecture on Halvorsen-grade lumber. Signe, over the fence, shouts that it is Miranda-grade lumber. The splinter, you suspect, is both, and still hurts.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara squints at the copperplate. “That’s a real dip pen. Whoever wrote this practiced for years and wants you to notice.”',
        kit: 'Kit sights down the fence like a balance beam. “It leans toward both houses,” she says. “That’s structurally impossible. Also very sad.”',
        juniper:
          'Juniper waves at both porches at once. “The gnome looks happier over there,” she says, which helps nobody.',
        cedar:
          'Cedar crouches at the water meter between the houses. “One line, two families, sixty years. That’s not plumbing. That’s a marriage.”',
      },
      aloneLine:
        'Alone between the two porches, you feel the feud on either side of you like two weather fronts.',
    },
    {
      title: 'Court Among the Headstones',
      place: 'The hillside cemetery above Ferndale, midnight',
      chapter: 5,
      scene: 'meadow',
      message: {
        medium: 'note',
        from: 'A summons under your windshield wiper',
        lines: [
          'THE MIDNIGHT COURT',
          'requests the presence of the meddler, as friend of the court,',
          'tonight, at the stroke. Bring an open mind and a warm coat.',
        ],
      },
      body: [
        'The cemetery climbs the hill above Ferndale in terraces of white marble and old cypress, and at midnight the town below looks like a dollhouse someone forgot to switch off. Near the top, lantern light glows among the headstones. On a flat granite marker sits a table: a gavel, a ledger, and a pair of brass scales polished until they hold the moon.',
        'Behind it sits the magistrate: black robe, a long curled wig gone yellow at the edges, a face in shadow. Two chairs marked MIRANDA and HALVORSEN stand empty, as always. The judge regards you, sighs like an old radiator and says, “Well. At least somebody came.”',
      ],
      approaches: [
        {
          id: 'amicus',
          label: 'Sit as friend of the court and argue both sides',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You make Tony’s case, then Signe’s, then Tony’s again, and somewhere in the middle you realize you believe both of them. So does the judge. He leans forward, wig slipping. “That,” he says, “is the hardest thing anybody ever learns. Most people die first.” With nothing in either pan, the brass scales dip to one side, then the other, and settle level.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You start arguing both sides and lose the thread in the middle. By the end you have accidentally argued on behalf of a third family who does not exist. The judge hears all of it with infinite patience, writes something in the ledger and says, “Noted. The court thanks its friend for the enthusiasm,” in the tone of a teacher who is not angry, only disappointed.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'cross-examine',
          label: 'Talk the judge into answering your questions',
          check: { skill: 'rizz', target: 11 },
          success: {
            text: 'You ask nicely, then cleverly, then honestly, and the third one works. The judge admits the court has no authority, no bailiff and no budget. “I offered free mediation by letter forty times,” he says. “People cross the street to avoid a mediator. They’ll climb a hill at midnight for a ghost.” His voice is warm and trained and familiar: the voice of someone who used to count one-and-two-and for children.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You open with a lawyer joke. The judge does not laugh. You try a second lawyer joke. The gavel comes down, the judge says “Contempt,” and every lantern goes out at once. When your eyes adjust, the table is bare and you are holding a single peppermint, which you suspect is the court’s idea of a sentence.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'lanterns',
          label: 'Follow the lanterns’ signal down the hill',
          check: { skill: 'wits', target: 7 },
          success: {
            text: 'The lanterns are not candles. They are battery stage lamps with colored gels, keyed to a little receiver hidden in a vase of plastic lilies, with a range of about a block. You follow the line of sight downhill to a carriage house behind a cornflower-blue Victorian, where a man in a cardigan holds a lighting remote in one hand and a sandwich in the other. He sees you, sets down the sandwich and says, “Oh, dear.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You follow a cord down the hill in the dark. It is a garden hose. It leads to a spigot, which leads to a very surprised raccoon, which leads to you sitting in wet grass at one in the morning while, high on the hill, the lanterns brighten as if the whole court is having a good laugh at your expense.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara watches the judge’s hands. “Pianist’s hands,” she murmurs. “Look at that reach. He holds the gavel like it’s middle C.”',
        kit: 'Kit circles the scales twice. “No strings, no magnets, no motor,” she mutters. “I’d know. I’d have used them.”',
        juniper:
          'Juniper sits on a headstone, swinging her feet. “Everyone under here has been waiting a long time to hear somebody apologize,” she says. “Anybody.”',
        cedar:
          'Cedar tips his cap. “Your Honor. My grandpa and his brother didn’t speak for thirty years over a tractor. Do you take walk-ins?”',
      },
      aloneLine:
        'Alone before the bench, you notice the judge has set out two empty chairs and a third, smaller one, for you.',
    },
    {
      title: 'Miranda v. Halvorsen',
      place: 'Ferndale, both porches, then the hill',
      chapter: 5,
      scene: 'plaza',
      message: {
        medium: 'flyer',
        from: 'Taped in the window of an empty storefront on Main Street',
        lines: [
          'THE MIDNIGHT COURT will hear the matter of MIRANDA v. HALVORSEN.',
          'Friday, at the stroke. Both parties will attend or forfeit the pie.',
          'Refreshments. No gnomes.',
        ],
      },
      body: [
        'By Friday the whole town has seen the flyer and the whole town has an opinion. Somebody at the hardware counter is running a pool. The Mirandas say they will not climb that hill for a Halvorsen. The Halvorsens say they will not climb it for anyone, but Signe has been seen buying a new hat.',
        'This is the trap, the oldest one there is: get everybody in one place at one time and see who flinches. It only springs if both families come. You have one afternoon to get two stubborn people up one steep hill.',
      ],
      approaches: [
        {
          id: 'signe',
          label: 'Persuade Signe the pie is worth defending',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You tell Signe the truth: if she stays home, people will say she was afraid of a rematch. Her saucer rings. Then she goes to the kitchen and returns with a recipe card in Rosa Miranda’s handwriting, sixty years old, kept in her own box. “Rosa gave me this the spring before the fair,” she says. “I added nutmeg. That was the whole difference. One point. I’ve been ashamed for sixty years.” She puts on the new hat.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You tell Signe she owes it to the town. Signe informs you that she owes the town nothing, the town owes her a stop sign, and you owe her an apology for the coffee incident. By the time you have apologized for something you do not remember doing, it is dark and she is watching a baking competition at a volume that ends discussion.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'tony',
          label: 'Sit with Tony until he decides on his own',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You don’t argue. You sit on Tony’s porch and help him oil a hinge that does not need oiling. After an hour he says, “Rosa would’ve gone up that hill in her slippers just to see the wig.” After another, he goes inside and comes back in his good jacket, the one from the wedding photo on the mantel. “If I’m going to be judged,” he says, “I want to look like the man she married.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You sit with Tony in patient, respectful silence. Forty minutes in, Tony falls asleep. You don’t have the heart to wake him, and when he finally does wake, at ten to midnight, he is certain you are his late brother-in-law and would like to settle an argument about a 1971 pickup first.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'exhibit',
          label: 'Haul the disputed fence section up the hill as evidence',
          check: { skill: 'burly', target: 7 },
          cost: 'Eleven feet of sixty-year-old redwood and a hill steeper than it looks.',
          success: {
            text: 'You unbolt the leaning section, the one with the gap where the knothole board used to be, and carry it up through the cemetery on your shoulder, half exhibit and half penance. Both families follow it, because neither will let the other say anything about it behind their back. The trap springs itself, and you did not even have to bait it.',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You unbolt the section and discover it was the only thing holding up the rest of the fence. All forty feet go down at once, flat into the flower beds, with the sound of a sixty-year argument ending badly. Both families rush out. Both blame each other. Both, at least, are now outdoors and wearing shoes.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara is making two identical corsages. “Same flowers, same ribbon, same pin,” she says. “Nobody gets to say the other one’s is nicer.”',
        kit: 'Kit is rigging her own lantern line in the cypress. “If the judge wants a show,” she says, “he can have a better one.”',
        juniper:
          'Juniper has invited the gnome. “It was a witness,” she says, and nobody can argue with that.',
        cedar:
          'Cedar checks the shared water valve on his way past. “Leaks on both sides,” he reports. “Figures.”',
      },
      aloneLine:
        'Alone, you go from porch to porch so many times that both families start setting out a cup for you.',
    },
  ],
  coldCase: {
    title: 'Court Is Not in Session',
    place: 'Ferndale, the following week',
    chapter: 5,
    scene: 'plaza',
    body: [
      'The trades stop. The summonses stop. On the hill someone has cleared away the table and the lanterns, and only a pale square on the granite shows where the scales stood. The fence between the Mirandas and the Halvorsens leans the way it always has, in both directions at once.',
      'Lupe texts you a photo: on her grandfather’s porch, overnight, someone has left an olallieberry pie with no card, cut into two perfect halves. Nobody knows which family it was meant for.',
    ],
    choices: [
      {
        id: 'half',
        label: 'Eat exactly half',
        text: 'You eat precisely half the pie on the steps between the two houses, where both families can see. It is very good. Nobody admits to baking it.',
        effects: { goodwill: 1 },
      },
      {
        id: 'gnome-note',
        label: 'Leave a note under the gnome',
        text: 'You tuck a note under the gnome: Somebody is still trying. In the morning it is gone, and in its place, in copperplate: So are you.',
        effects: { weird: 1 },
      },
    ],
  },
  reveal: {
    title: 'The Magistrate Unwigged',
    place: 'The hillside cemetery, at the stroke',
    chapter: 5,
    scene: 'meadow',
    body: [
      'They came. Tony in his wedding jacket on one side, Signe in her new hat on the other, both families behind them in folding chairs, and half the town hiding badly among the headstones. The judge raises the gavel, and the wig, which has been slipping all week, finally gives up and slides into the ledger. Under it is a bald, kind, seventy-four-year-old head that half of Ferndale learned scales from. “Mr. Ames?” says Lupe. “My piano teacher?”',
      '“Wendell Ames,” he says, setting the wig aside. “Retired couples mediator. Retired piano teacher. Your court.” In the dark past the lanterns, his husband, Rafael, sheepishly lowers the lighting remote. “My brother and I didn’t speak for twenty-two years over our mother’s house. I made a living getting strangers to talk, and I couldn’t get him to pick up the phone. By the time we made up, we had nine months left.” He folds his hands on the ledger. “I would not wish those twenty-two years on anyone. I will not sit by and watch sixty.”',
    ],
    choices: [
      {
        id: 'resume',
        label: 'Ask Wendell to finish the hearing, unmasked',
        text: 'You pick up the wig and hold it out. “Your Honor,” you say. He doesn’t put it back on. He opens the ledger.',
        next: 'open-court',
      },
      {
        id: 'to-the-scales',
        label: 'Bring both families to the scales themselves',
        text: 'You move the brass scales to the center of the table and ask Tony and Signe to come up, one on each side.',
        next: 'the-weighing',
      },
      {
        id: 'watch-the-brass',
        label: 'Watch the empty scales instead of the people',
        text: 'While everyone else watches Wendell, you watch the scales. They are moving, with nothing in either pan.',
        ending: 'scales-tip-forward',
      },
    ],
    leadLines: {
      mara: 'Mara picks up the wig and fluffs it with a professional’s care. “You’ll want this for the photos,” she tells Wendell.',
      kit: 'Kit flashes Rafael a thumbs-up across the graves. “Great cue timing,” she whispers. “Seriously. Call me.”',
      juniper:
        'Juniper is sitting between Tony and Signe now, holding one hand of each, and neither of them has noticed yet.',
      cedar:
        'Cedar clears his throat. “For the record, Your Honor, I’d have come to mediation,” he says. “If anybody’d put a ghost on the flyer.”',
    },
    aloneLine:
      'With nobody beside you, you are the only one who sees Rafael mouth “I told him so” into the dark.',
  },
  branches: {
    'open-court': {
      title: 'Open Court',
      place: 'The hillside cemetery',
      chapter: 5,
      scene: 'meadow',
      body: [
        'Wendell runs the hearing like a recital: one side at a time, no interruptions, everyone gets a turn at the keys. Tony speaks about the fence. Signe speaks about the water line. Then, because Wendell asks the right question in the right voice, Signe takes out Rosa’s recipe card and reads it aloud, nutmeg and all.',
        'Tony is quiet a long time. “She always said yours was better,” he says at last. “I never told you. I was too busy being angry for her.” Below the hill, Ferndale is dark except for two porch lights, side by side, that somebody left on.',
      ],
      choices: [
        {
          id: 'garden',
          label: 'Propose taking the fence down for good',
          text: 'You suggest it. Everyone looks at the knothole board on the table, then at Lupe and Soren, who are holding hands and have stopped hiding it.',
          ending: 'court-adjourned',
        },
        {
          id: 'halves',
          label: 'Propose dividing everything exactly in half',
          text: 'You suggest an exact split: fence line, water bill, ribbon. It is fair. It is perfectly, precisely fair. Wendell writes it down.',
          ending: 'fair-split',
        },
      ],
    },
    'the-weighing': {
      title: 'The Weighing',
      place: 'The hillside cemetery, before the scales',
      chapter: 5,
      scene: 'meadow',
      body: [
        'Tony lays his hand in one pan. Signe lays hers in the other. And the scales, which have no motor, no strings and no magnets, move: not with weight, but with something else. In the polished brass under Tony’s hand you see a Thanksgiving table with a chair nobody sits in. Under Signe’s, a hospital hallway, and a phone call she does not make.',
        'Wendell has gone pale. “I bought those at an estate sale in Eureka,” he whispers. “They never did that in the living room.” The two old people stare at what they are about to lose, and the scales hold perfectly, terribly level.',
      ],
      choices: [
        {
          id: 'shake',
          label: 'Ask them to shake hands over the scales',
          text: 'You ask. Tony lifts his hand from the pan. Signe lifts hers. They reach across the table, and the brass goes still and quiet.',
          ending: 'court-adjourned',
        },
        {
          id: 'look-further',
          label: 'Keep looking into the brass',
          text: 'You lean closer and look past their futures, into yours. The scales let you.',
          ending: 'scales-tip-forward',
        },
        {
          id: 'take-half',
          label: 'Suggest they each take half and go home',
          text: 'You suggest it gently. They both nod, relieved to stop looking. The scales go dull, like any old brass.',
          ending: 'fair-split',
        },
      ],
    },
  },
  endings: [
    {
      id: 'court-adjourned',
      title: 'Court Adjourned',
      tone: 'true',
      text: [
        'The fence comes down the next Saturday with both families on the crowbars. By June there is a shared garden where it stood: olallieberry canes on one side, Signe’s rhubarb on the other, a bench in the middle, and one water line paid out of one coffee can. The knothole board is screwed to the back of the bench at a small child’s eye level, on purpose.',
        'At the county fair in August, an olallieberry pie is entered under two names, Halvorsen and Miranda, with Rosa’s card and a little nutmeg. It takes second. Nobody minds. Wendell plays the piano at the garden’s opening, Rafael lights it, and the Midnight Court is declared adjourned for good, the gavel hung on the bench for anyone who needs it.',
      ],
    },
    {
      id: 'fair-split',
      title: 'A Fair Split',
      tone: 'bittersweet',
      text: [
        'It is settled to the inch. The fence moves eleven inches, back to the 1966 survey. The water bill is split down the middle and paid in two checks. The old blue ribbon is cut in half with Wendell’s sewing scissors, and each family frames its half and hangs it facing the other house. Nobody sues anybody again. Nobody invites anybody to anything, either.',
        'But on Sundays the grandkids pass a pie back and forth across the new fence line, in plain view now, and the knothole board hangs on Lupe’s wall in Arcata. Wendell closes the ledger. “Fair isn’t the same as whole,” he tells you on the hill. “But it’s somewhere to start.”',
      ],
    },
    {
      id: 'scales-tip-forward',
      title: 'The Scales Tip Forward',
      tone: 'strange',
      text: [
        'The brass scales keep tipping after everyone has gone home. Wendell, shaken, gives them to you, saying a friend of the court should hold the evidence. You set them on your windowsill, and they tip, very slightly, whenever you are about to make a choice that matters. Toward what, they never say.',
        'Some foggy nights, walking past the hillside cemetery, you see lanterns among the headstones again: a judge in a yellowed wig hearing a case between two families you do not recognize, in clothes nobody wears yet, in a Ferndale that is still standing, still painted, still arguing. The scales on that bench are the same scales. By the end of every hearing, they are level.',
      ],
    },
  ],
}
