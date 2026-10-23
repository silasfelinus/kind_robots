import type { Mystery } from '../types'

// Case VII. Seed: balance, fairness, partnership, beauty, diplomacy, indecision.

export const MIDNIGHT_MAGISTRATE: Mystery = {
  id: 'midnight-magistrate',
  number: 7,
  sign: 'libra',
  title: 'The Mystery of the Graveyard Gavel',
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
    'Ferndale, its Victorian Main Street and its hillside cemetery are real, and Ferndale is the long-time home of the Humboldt County Fair. Wendell Ames, Rafael, Lupe Miranda, Soren Halvorsen, the Miranda and Halvorsen families, the Grange-hall odds, the Midnight Court, the court of the dead and everything else are invented, and the pie contests are invented. No real business or resident is depicted.',
  decline: {
    label: 'Drop the summons in the recycling',
    text: 'You recycle the card. The next morning a second one is in your mailbox, in the same copperplate: The court notes your absence and does not hold it against you. Somehow that is worse than if it had.',
  },
  gates: [
    {
      title: 'One Gnome for One Fence Board',
      place: 'Ferndale, a side street off Main',
      chapter: 5,
      scene: 'plaza',
      message: {
        medium: 'note',
        from: 'A cream card in your mailbox, no stamp',
        lines: [
          'THE MIDNIGHT COURT',
          'requests the presence of the meddler, as friend of the court,',
          'in the matter of Miranda v. Halvorsen. One gnome. One fence board. Ferndale.',
        ],
      },
      body: [
        'Ferndale looks like a town somebody built for a cake: Victorians in butterscotch and teal, gingerbread trim, a Main Street holding its breath to be photographed. Lupe Miranda, from your stats study group, meets you at the corner holding a card exactly like yours. “My family is haunted now,” she says, a beat too fast. “Grandpa’s gnome is gone, and on our porch is a board from our own fence.” Between her grandfather’s house and the Halvorsens’ runs a fence so old and so argued-over it leans in both directions at once.',
        'On one porch Tony Miranda, eighty-six, holds the fence board like a rifle. On the other, Signe Halvorsen, eighty-four, holds the ceramic gnome like a hostage. Neither looks at the other. Both talk to you. Pinned to each door is the same cream card in the same copperplate hand: The Midnight Court has weighed this exchange and found it fair.',
      ],
      approaches: [
        {
          id: 'two-coffees',
          label: 'Take coffee on both porches, one cup each, in turns',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You split the morning exactly in half: Tony’s coffee black, Signe’s with cardamom, back and forth over the fence like a tennis match. By the fourth cup the story is out. The fence went up in 1966. The water line was shared since the creamery days. And that August, at the county fair, Signe’s olallieberry pie beat the pie of Tony’s wife, Carmen, by a single point. Carmen is gone now. Neither of them has said her name to the other in sixty years.',
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
          check: { skill: 'wits', target: 9 },
          success: {
            text: 'Lupe has a digital scale out of her backpack before you finish asking, the good kind from the chem lab. The gnome: 2.31 kilograms. The fence board: 2.31 kilograms. Tony’s missing hose nozzle and Signe’s missing pie server, both returned across the fence last week: 212 grams each. Every trade balances to the gram. Whoever is doing this is not a thief. It is somebody with a very good scale, a key to both porches and a very particular idea of fair.',
            effects: { weird: 1 },
          },
          failure: {
            text: 'You borrow Tony’s kitchen scale and set the gnome on it. It reads ERR, then 0, then a number so large it suggests the gnome is a small moon. Tony admits the scale has not worked since a pancake incident in 2019. Signe confiscates the gnome again “for evidence handling” and will not say where she put it.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'knothole',
          label: 'Read the history in the traded fence board',
          check: { skill: 'lore', target: 9 },
          success: {
            text: 'The board is old redwood gone silver, with a knothole worn smooth at exactly a small child’s eye level. Lupe turns pink. “That’s the knothole,” she says. “Soren Halvorsen and I passed notes through it from kindergarten through high school. Nobody was supposed to know.” Whoever traded this board knew. Lupe says so too, a little loudly, and changes the subject to the gnome.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You flip the board over looking for clues and collect a sixty-year-old splinter the length of a toothpick. Tony removes it with a pocketknife and a lecture on Halvorsen-grade lumber. Signe, over the fence, shouts that it is Miranda-grade lumber. The splinter, you suspect, is both, and still hurts.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara reads the card twice. “‘Friend of the court’ is a real legal term,” she says. “Somebody took one pre-law class and enjoyed it far too much.”',
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
        medium: 'text',
        from: 'Lupe Miranda (stats study group)',
        lines: [
          'the lanterns are up on the cemetery hill again',
          'grandpa says that’s the court sitting and he is NOT going. he is ironing a shirt',
          'ur the friend of the court apparently. midnight. bring a coat',
        ],
      },
      body: [
        'The cemetery climbs the hill above Ferndale in terraces of white marble and old cypress, and at midnight the town below looks like a dollhouse someone forgot to switch off. Near the top, lantern light glows among the headstones. On a flat granite marker sits a table: a gavel, a ledger, and a pair of brass scales polished until they hold the moon.',
        'Behind it sits the magistrate: black robe, a long curled wig gone yellow at the edges, a face in shadow. At either end of the bench stands an usher in mourning black and a long veil, each holding a lantern, perfectly still. Two chairs marked MIRANDA and HALVORSEN stand empty, as always. The judge regards you, sighs like an old radiator and says, “Well. At least somebody came.”',
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
            text: 'You start arguing both sides and lose the thread in the middle. By the end you have accidentally argued on behalf of a third family who does not exist. The judge hears all of it with infinite patience, writes something in the ledger and says, “Noted. The court thanks its friend for the enthusiasm.” One of the veiled ushers makes a small noise that, in a living person, would be a laugh.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'cross-examine',
          label: 'Talk the judge into answering your questions',
          check: { skill: 'rizz', target: 11 },
          success: {
            text: 'You ask nicely, then cleverly, then honestly, and the third one works. The judge admits the court has no authority, no bailiff and no budget. “I offered free mediation by letter forty times,” he says. “People cross the street to avoid a mediator. They’ll climb a hill at midnight for a ghost.” He glances, very briefly, at the ushers. “Also, the court did not convene itself. It was asked, nicely, by clients I am fond of.” His voice is warm and trained and familiar: the voice of someone who used to count one-and-two-and for children.',
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
            text: 'The lanterns are not candles. They are battery stage lamps with colored gels, keyed to a little receiver hidden in a vase of plastic lilies, with a range of about a block. You follow the line of sight downhill to a carriage house behind a cornflower-blue Victorian, where a man in a cardigan holds a lighting remote in one hand and a sandwich in the other. Two more sandwiches wait on a plate beside him, crusts off, for somebody young. He sees you, sets down the sandwich and says, “Oh, dear.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You follow a cord down the hill in the dark. It is a garden hose. It leads past the last headstone into a dairy pasture, across a cattle guard you find with both shins, to a spigot and a very surprised raccoon, which leads to you sitting in wet clover at one in the morning while, high on the hill, the lanterns brighten as if the whole court is having a good laugh at your expense.',
            effects: { nerve: -1 },
          },
        },
      ],
      leadLines: {
        mara: 'Mara watches the judge’s hands. “Pianist’s hands,” she murmurs. “Look at that reach. He holds the gavel like it’s middle C.”',
        kit: 'Kit circles the scales twice. “No strings, no magnets, no motor,” she mutters. “I’d know. I’d have used them.”',
        juniper:
          'Juniper waves at the veiled ushers. One of them waves back, remembers it is a ghost, and stops. “I like that one,” Juniper says. “It’s wearing sneakers.”',
        cedar:
          'Cedar sizes up the bench. “Granite table, brass scales, no permit,” he says. “Your Honor, the cosmos respects the hustle.”',
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
        medium: 'voicemail',
        from: 'Signe Halvorsen, 1:12 (she does not believe in hanging up)',
        lines: [
          '“This is Signe Halvorsen. There is a flyer in the window of the empty storefront on Main. The Midnight Court will hear Miranda versus Halvorsen tonight, at the stroke. Both parties attend or forfeit the pie.',
          'I am not going. I want that on the record. You are apparently the friend of the court, so you may tell Tony Miranda I am not going.',
          'Also, what does one wear.”',
        ],
      },
      body: [
        'By afternoon the whole town has seen the flyer and the whole town has an opinion. In the back room of the Grange hall somebody is running real odds, and the Halvorsens are three to one. The Mirandas say they will not climb that hill for a Halvorsen. The Halvorsens say they will not climb it for anyone, but Signe has been seen buying a new hat.',
        'This is the trap: everybody in one place at one time, in front of the court, and see who flinches. It only springs if both families come. You have one afternoon to get two stubborn people up one steep hill.',
      ],
      approaches: [
        {
          id: 'signe',
          label: 'Persuade Signe the pie is worth defending',
          check: { skill: 'rizz', target: 9 },
          success: {
            text: 'You tell Signe the truth: if she stays home, people will say she was afraid of a rematch. Her saucer rings. Then she goes to the kitchen and returns with a recipe card in Carmen Miranda’s handwriting, sixty years old, kept in her own box. She won’t say why. “I’ll say it to Tony,” she says, “or not at all.” She puts on the new hat.',
            effects: { goodwill: 1 },
          },
          failure: {
            text: 'You tell Signe she owes it to the town. Signe informs you that she owes the town nothing, the town owes her a stop sign, and you owe her an apology for the coffee incident. By the time you have apologized for something you do not remember doing, it is dark and she is watching a baking competition at a volume that ends discussion.',
            effects: { nerve: -1 },
          },
        },
        {
          id: 'tony',
          label: 'Oil Tony’s porch hinges with him until he decides on his own',
          check: { skill: 'psyche', target: 9 },
          success: {
            text: 'You don’t argue. You sit on Tony’s porch and help him oil a hinge that does not need oiling. After an hour he says, “Carmen would’ve gone up that hill in her slippers just to see the wig.” After another, he goes inside and comes back in his good jacket, the one from the wedding photo on the mantel. “If I’m going to be judged,” he says, “I want to look like the man she married.”',
            effects: { nerve: 1 },
          },
          failure: {
            text: 'You oil hinges with Tony in patient, respectful silence. Forty minutes in, Tony sits down to rest his eyes and falls asleep. You don’t have the heart to wake him, and when he finally does wake, at ten to midnight, he informs you that the nap was strategic and that he has decided nothing.',
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
      recall: {
        'g1:kitchen-scale':
          'Since the business with the scale, you notice Lupe weighs things in her hand before she passes them to you, quick and exact, like someone who has been doing it for weeks.',
        'g2:fail':
          'Under your windshield wiper this morning: a single peppermint and a card in copperplate. NO HARD FEELINGS. — THE COURT.',
      },
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
      'They came. Tony in his good jacket on one side, Signe in her new hat on the other, both families behind them in folding chairs, and half the town hiding badly among the headstones. The judge raises the gavel, and the wig, which has been slipping all week, catches on it. You reach over, as friend of the court, and lift it the rest of the way off. Under it is a bald, kind, seventy-four-year-old head that half of Ferndale learned scales from. “Wendell Ames?” says Signe. “From the Thursday lessons?” In the dark past the lanterns, his husband, Rafael, sheepishly lowers the lighting remote. “Retired couples mediator, retired piano teacher, your court,” Wendell says. “But a court only hears cases. It doesn’t bring them.” He looks, pointedly, at the two veiled ushers.',
      'You lift the first veil and find Soren Halvorsen, very red, holding a digital scale that works to the gram. You lift the second and find Lupe Miranda, your stats study partner, who handed you this case. “I did the Miranda side,” she says. “Soren did the Halvorsen side. Mr. Ames lent us the court and Rafael did the lights. We needed a friend of the court nobody could call ours, so I picked someone from stats.”',
      'Soren finds his voice. “We’ve had back-to-back piano lessons every Thursday since we were seven. Four o’clock and four-thirty. It was the only room in Ferndale where we were allowed to be in the same place.” Lupe takes his hand where both porches can see. “We’re getting married in June,” she says, “and we were not going to do it across a fence.” Wendell closes the ledger gently. “Fifteen years I taught the only duet in this town nobody was allowed to hear,” he says. “The court finds that long enough.”',
    ],
    afterMiss: [
      'At the stroke, the two chairs marked MIRANDA and HALVORSEN are still empty. The judge says it before you can: “Nobody came.” Not angry. Tired. Then the cemetery gate squeals, and up the path, ten yards apart and refusing to close the gap, come Tony Miranda in his good jacket and Signe Halvorsen in a brand-new hat, each of them there, they will both insist for the rest of their lives, only so the other one couldn’t win by default. Half the town follows, hiding badly among the headstones. The judge raises the gavel, and the wig, which has been slipping all week, catches on it. You reach over, as friend of the court, and lift it the rest of the way off. Under it is a bald, kind, seventy-four-year-old head that half of Ferndale learned scales from. “Wendell Ames?” says Signe. “From the Thursday lessons?” In the dark past the lanterns, his husband, Rafael, sheepishly lowers the lighting remote. “Retired couples mediator, retired piano teacher, your court,” Wendell says. “But a court only hears cases. It doesn’t bring them.” He looks, pointedly, at the two veiled ushers.',
      'You lift the first veil and find Soren Halvorsen, very red, holding a digital scale that works to the gram. You lift the second and find Lupe Miranda, your stats study partner, who handed you this case. “I did the Miranda side,” she says. “Soren did the Halvorsen side. Mr. Ames lent us the court and Rafael did the lights. We needed a friend of the court nobody could call ours, so I picked someone from stats.”',
      'Soren finds his voice. “We’ve had back-to-back piano lessons every Thursday since we were seven. Four o’clock and four-thirty. It was the only room in Ferndale where we were allowed to be in the same place.” Lupe takes his hand where both porches can see. “We’re getting married in June,” she says, “and we were not going to do it across a fence.” Wendell closes the ledger gently. “Fifteen years I taught the only duet in this town nobody was allowed to hear,” he says. “The court finds that long enough.”',
    ],
    recall: {
      'g1:fail':
        'Signe spots you among the headstones and gives you the exact nod she gives the mail carrier, which, from her, is a pardon.',
      'g2:lanterns':
        'Rafael gives you a small wave with the remote, the wave of a man who has been watching you on his hill all week and quietly rooting for you.',
    },
    choices: [
      {
        id: 'resume',
        label: 'Ask Wendell to finish the hearing, unmasked',
        text: 'You hold the wig out to him. “Your Honor,” you say. He doesn’t put it back on. He opens the ledger.',
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
        ending: 'older-docket',
      },
    ],
    leadLines: {
      mara: 'Mara quietly hands Lupe a tissue, then Soren one, then, after a moment’s thought, Signe.',
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
        'Wendell runs the hearing like a recital: one side at a time, no interruptions, everyone gets a turn at the keys. Tony speaks about the fence. Signe speaks about the water line. Then, because Wendell asks the right question in the right voice, Signe takes out a recipe card in the handwriting of Tony’s late wife, Carmen, sixty years old. “She gave me this the spring before the fair. I added nutmeg. That was the whole difference. One point.” She reads it aloud, nutmeg and all.',
        'Tony is quiet a long time. “She always said yours was better,” he says at last. “I never told you. I was too busy being angry for her.” Below the hill, Ferndale is dark except for two porch lights, side by side, that somebody left on.',
      ],
      choices: [
        {
          id: 'garden',
          label: 'Propose taking the fence down for good',
          text: 'You suggest it. Everyone looks at Lupe and Soren, still in their ushers’ black and still holding hands. The knothole in the old fence board, it turns out, was a mailbox.',
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
        'Tony lays his hand in one pan. Signe lays hers in the other. And the scales, which have no motor, no strings and no magnets, move: not with weight, but with something else. In the polished brass under Tony’s hand you see a Thanksgiving table in 1967 with a chair nobody sat in. Under Signe’s, a hospital hallway in Eureka, years later, and a phone call to the Miranda house that she did not make.',
        'Wendell has gone pale. “I bought those at an estate sale in Eureka,” he whispers. “They never did that in the living room.” The two old people stare at sixty years of what they did not do, and the scales hold perfectly, terribly level.',
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
          text: 'You lean closer and look past their sixty years, into older ones underneath. The scales let you.',
          ending: 'older-docket',
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
        'The verdict is one word, and Wendell lets Tony and Signe say it together. At two in the morning, by Rafael’s lanterns, both families come down the hill and take the fence apart with crowbars, in their good clothes, the grandchildren holding flashlights and the whole side street awake on its porches. Tony pulls the first board. Signe pulls the second. Nobody says who pulled the last. The traded board, the one with a knothole worn smooth at a small child’s eye level, goes to Lupe and Soren, on purpose. In June they are married in the gap where the fence stood, and Wendell plays them out on an upright piano Rafael wheels down the side street on a dolly.',
        'At three, Signe brings out a pie from a recipe card in the handwriting of Tony’s late wife, Carmen, who gave it to her the spring before the 1966 fair. It is baked exactly as written. They eat it standing in the gap where the fence was, off paper plates, and it is very good, and it is not quite as good as Signe’s, and Tony says so, and everybody laughs. Wendell knocks the gavel once on the last fence post, says “Adjourned,” and leaves it hanging there for anyone who needs it.',
      ],
    },
    {
      id: 'fair-split',
      title: 'A Fair Split',
      tone: 'bittersweet',
      text: [
        'It is settled to the inch. The fence moves eleven inches, back to the 1966 survey. The water bill is split down the middle and paid in two checks. The 1966 blue ribbon, which Signe has kept in a drawer for sixty years, is cut in half with Wendell’s sewing scissors, and each family frames its half and hangs it facing the other house. Nobody sues anybody again. Nobody invites anybody to anything, either.',
        'In June, Lupe and Soren are married twice, once on each porch, in two ceremonies of exactly equal length, and each family attends only its own. The traded fence board, knothole and all, hangs on their apartment wall in Arcata. Wendell closes the ledger. “Fair isn’t the same as whole,” he tells you on the hill. “But it’s somewhere to start.”',
      ],
    },
    {
      id: 'older-docket',
      title: 'The Older Docket',
      tone: 'strange',
      text: [
        'Behind you, unwatched, Tony and Signe sit through the whole hearing without once speaking to each other, which Wendell later calls progress. The brass scales keep tipping after everyone has gone home. Wendell, shaken, gives them to you, saying a friend of the court should hold the evidence. On your windowsill they tip, very slightly, toward any guest who is still carrying an old argument. They are never wrong.',
        'Now and then, driving past the hillside cemetery after midnight, you see lanterns among the headstones again: a judge in a yellowed wig who is not Wendell, hearing a case between two families in clothes from 1890, whose surnames you have read on the headstones in daylight. The dead have feuds too. The judge hears them all. The scales on that bench are the same scales, and by the end of every hearing, they are level.',
      ],
    },
  ],
}
