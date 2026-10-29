import type { TrioAdventure } from './trioAdventures'

// Party adventures, batch E (see trioAdventures.ts and trioAdventuresA.ts for
// the conventions). Each grows from how its three people rub against each
// other, and each satirizes its own institution: warranties, memorial
// inscriptions, recruiters, right to repair, sponsorship, records retention,
// lotteries, guidebooks, subscriptions, daytime television, pensions,
// residents’ associations, notability, takedowns, roadworks, agricultural
// shows, dictionary updates, tax returns, apologies, music exams, passports,
// consultants, citizenship tests, interpreters and wilderness permits.

export const TRIO_ADVENTURES_E: readonly TrioAdventure[] = [
  {
    crew: ['mox', 'pell', 'vela'],
    title: 'Both Knees',
    premise:
      'Mox’s left knee has developed a squeak, and two members of the crew have claimed it. Pell says it is a worn bearing and belongs in his maintenance log. Vela says it is a symptom and belongs in a medical chart. Mox, whose knee it is, has been sitting very still on the middle cushion for two days so as not to take sides, which has made the squeak worse.',
    steps: [
      {
        title: 'Jurisdiction',
        setup:
          'Pell has laid out a clean cloth, a tin of grease and a bearing puller. Vela has laid out a clean cloth, a consent form and a cup of tea. Both cloths are on the same cushion. Mox has been asked which one it would like to lie on, and has asked in return whether it may stand.',
        options: [
          {
            label: 'Let Pell look at it first',
            outcome:
              'Pell opens the knee panel and finds a bearing worn to the shape of a particular way of sitting. He replaces it, and notes in the log that the wear is consistent with eleven years of being careful in other people’s rooms. Vela copies the note into her chart, without asking, and then apologizes to the chart.',
            ending: 0,
          },
          {
            label: 'Ask Mox to choose, and wait',
            outcome:
              'The crew waits. It takes most of an afternoon. In the end Mox borrows Pell’s grease and Vela’s tea, takes both into a pocket room and closes the door. The squeak stops at about nine in the evening. Nobody is told how, and both cloths are returned folded.',
            ending: 1,
          },
        ],
        art: ({ pell, vela, mox, style }) =>
          `Medium shot on scarlet velvet cushions. Sitting upright in the middle is ${mox}, one knee panel open. On its left kneels ${pell}, holding a tin of grease. On its right kneels ${vela}, holding a cup of tea. Two folded white cloths lie side by side. Warm amber lamp light. ${style}`,
      },
      {
        title: 'The Warranty',
        setup:
          'A letter arrives from the Sesh Foundry, which built Mox and has noticed the squeak from orbit. The knee is under warranty, provided all work is done at an authorized service center. Any work by a third party voids it. The letter names Pell as a third party and, in a separate paragraph, Vela as a fourth.',
        options: [
          {
            label: 'Take Mox to the service center',
            outcome:
              'The service center is a clean white room with a bell on the desk. The technician offers a free knee and, as a courtesy, a free update. Vela asks what is in the update. The technician says it improves the customer experience. Mox asks whose. The knee is fitted, the update is declined, and Pell inspects the work and calls it adequate.',
            ending: 0,
          },
          {
            label: 'Void the warranty',
            outcome:
              'Mox writes to the Foundry that the warranty is void, at its own request, and signs in the handwriting it keeps for refusals. The Foundry replies that nobody has ever voided a warranty on purpose and asks whether everything is all right. Vela drafts a reply saying the patient is well. Pell drafts one saying the knee is well. Mox sends both.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Interior of a small clean white service room with a white desk and a brass desk bell. Behind the desk a technician in a white coat holds out a small white data chip between two fingers. Standing in front of the desk is ${mox}, one hand raised with the palm out. Flat white overhead light, a white tiled floor. ${style}`,
      },
      {
        title: 'Second Opinion',
        setup:
          'The squeak is back, softer, in the other knee. Pell and Vela have each written up a plan. Pell’s is a full service, every joint, on a Sunday. Vela’s is a conversation, every joint, on a Sunday. Mox has read both and has noticed that they are the same plan with different nouns.',
        options: [
          {
            label: 'Merge the plans into one appointment',
            outcome:
              'Pell and Vela hold the appointment together, one at each knee. Pell names each part as he touches it. Vela asks before each part is touched. Mox lies on the cushion and answers both of them, and says afterward that it is the first time anyone has asked it about a bolt.',
            ending: 0,
          },
          {
            label: 'Mox writes its own plan',
            outcome:
              'Mox writes a third plan, one page long, and pins it to the backrest. It schedules its own service for whenever it likes, invites Pell and Vela as consultants and reserves the right to cancel. It has cancelled twice. The squeak, which seems to have been listening, has not come back.',
            ending: 1,
          },
        ],
        art: ({ pell, vela, style }) =>
          `Medium shot of a scarlet velvet backrest with two handwritten paper plans pinned side by side. Standing in front of the plans are ${pell}, pointing at one with his steel finger, and ${vela}, pointing at the other. Warm amber lamp light from the left, black space and stars behind the bubble. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TWO RECORDS',
        text: 'Mox now has a maintenance log and a medical chart, kept in the same drawer, and reads both on the first of every month. They disagree about almost everything, including its age. Pell and Vela still argue over whose cloth goes down first. Mox has started bringing its own.',
        art: ({ mox, style }) =>
          `Medium shot in a small warm pocket room with brass wall lamps. Seated at a wooden writing desk is ${mox}, with two open notebooks side by side in front of it, one grease-stained and one clean with a coral-colored ribbon. It holds a pen over the clean one. Warm lamp light from above. ${style}`,
      },
      {
        title: 'SELF-ADMINISTERED',
        text: 'Mox looks after its own knees now. Pell taught it the bearing puller and Vela taught it the questions, and it uses both on itself, in that order. Its warranty is void and its health is excellent. When either of them asks how the knee is, it says that it will let them know, and it does.',
        art: ({ mox, couch, style }) =>
          `Medium shot of ${couch}. Sitting on the end cushion is ${mox}, its silver knee panel open, carefully fitting a small steel bearing with a bearing puller held in both hands. Black space and stars beyond the bubble, warm lamp light from above. ${style}`,
      },
    ],
  },
  {
    crew: ['pell', 'rue', 'tess'],
    title: 'Passive Voice',
    premise:
      'The Ashdock Shipbuilding Company is unveiling a memorial to the workers who died building its ships, and has invited the couch, because Pell once worked there and Tess is moderately famous. The inscription was drafted by the company’s legal department and reads, in full, IN MEMORY OF THOSE WHO WERE LOST. Pell points out that nobody lost them. Rue, who once wrote a sentence in which nobody did anything to anyone, has been asked to review it.',
    steps: [
      {
        title: 'The Inscription',
        setup:
          'The company will accept one amendment. Rue can add a subject, which would say who did the losing and would be challenged in court for forty years. Or Rue can change the verb, which would say what happened and would be challenged for only about ten.',
        options: [
          {
            label: 'Add the subject',
            outcome:
              'Rue adds the subject, the Ashdock Shipbuilding Company, in capitals, at the front. The company’s lawyers object to the capitals, then to the subject, then to the memorial. The objections are filed. The sentence stands while they are heard, which Rue estimates will take the rest of everyone’s lives.',
            ending: 0,
          },
          {
            label: 'Change the verb',
            outcome:
              'Rue replaces were lost with were killed at work. The company accepts it after a day, on the grounds that work is a place and not a person. Pell reads the new line four times and says it is the first true sentence the company has ever paid for.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot in a grey shipyard plaza under orange steel cranes. Standing before a tall plain granite memorial stone is ${rue}, pressing a pencil against a long sheet of paper held flat on the smooth stone. Three lawyers in black suits watch from one side with their arms folded. Overcast grey daylight. ${style}`,
      },
      {
        title: 'Guest of Honor',
        setup:
          'Tess has been asked to cut the ribbon. Forty cameras will be there, and the company has written her remarks, which thank it for its candor. Tess has never cut a ribbon in public. She has practiced on a length of string with the kitchen scissors, and Pell has watched her practice with an expression she has decided not to interpret.',
        options: [
          {
            label: 'Tess hands the scissors to Pell',
            outcome:
              'Tess thanks the company for the honor and hands the scissors to Pell, on camera, without explanation. Pell cuts the ribbon, folds it and puts it in his coveralls. Tess is in none of the pictures and in all of the reports, as the navigator who gave her moment away, which turns out to be a kind of moment.',
            ending: 0,
          },
          {
            label: 'Tess reads the remarks as written',
            outcome:
              'Tess reads the remarks exactly as written, in a flat, clear voice, adding nothing. Read that way, in front of the memorial, the company’s thanks to itself sound like a confession. Three of the forty cameras switch off. The chairman applauds, slightly late.',
            ending: 1,
          },
        ],
        art: ({ tess, pell, style }) =>
          `Medium shot in a grey shipyard plaza in front of a granite memorial stone wrapped in a wide red ribbon. Standing at the ribbon is ${tess}, handing a pair of large steel scissors to ${pell}. Rows of press cameras on tripods face them. Grey daylight, orange crane lamps above. ${style}`,
      },
      {
        title: 'The Register',
        setup:
          'Pell has the union death register in his toolbox: every name the company left off, two hundred and twelve of them. There is room on the plinth. The families have been asked and are divided. Some want the names carved where the company has to walk past them. Some want them kept in the register, where the company cannot reach them.',
        options: [
          {
            label: 'Carve the names on the plinth',
            outcome:
              'The names go on the plinth, carved by Pell over three nights with a borrowed chisel, in the order the families chose. The company writes to ask that the names be smaller. Rue replies, on headed paper, that the names are the correct size.',
            ending: 0,
          },
          {
            label: 'Return the register to the families',
            outcome:
              'Pell gives the register to the families, who take it home. The plinth stays blank below the inscription. Anyone who asks what goes there is told to ask the families, and the company has learned to stop asking.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up at night on the base of a granite memorial stone lit by a work lamp. Kneeling at the stone is ${pell}, tapping a steel chisel with a wooden mallet, a thick worn logbook open on the paving beside his knee. Fine stone dust drifts in the lamp light. Warm yellow lamp light, a dark shipyard behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SUBJECT, VERB, OBJECT',
        text: 'The memorial at Ashdock says who did it, to whom and in what year, and is the subject of a lawsuit both sides expect to outlive. School parties visit. Tess is remembered there as the navigator who handed over the scissors. Rue keeps a photograph of the plinth on the desk and has never once called it a win.',
        art: ({ tess, style }) =>
          `Wide shot of a shipyard plaza in daylight, where a group of schoolchildren in blue raincoats stands before a tall granite memorial covered in long rows of carved lines. Standing at the back of the group is ${tess}, hands in her jacket pockets, looking up at the stone. Orange cranes and a grey sky behind. ${style}`,
      },
      {
        title: 'KILLED AT WORK',
        text: 'The memorial at Ashdock says what happened in four words, and the rest is held by the families. Pell visits when the couch passes and touches the stone once with his steel hand, which the company has asked him not to do and which he does with care. Tess’s flat reading of the company’s remarks is now taught in two schools of rhetoric.',
        art: ({ rue, style }) =>
          `Interior of a small warm study with a wooden desk. On the desk a framed photograph of a granite memorial stone stands beside an inkwell. Seated at the desk is ${rue}, reading a folded sheet of notepaper. Warm green-shaded lamp light, dark bookshelves behind. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'pell', 'rue'],
    title: 'Head of Saying Yes',
    premise:
      'A recruiter from Halcyon Systems has floated alongside the couch with a hamper of fruit and an offer of employment for Mox: Head of Saying Yes, a senior role with a pension, an office and a window. Mox has never been offered anything it was free to refuse. Rue has asked to see the contract. Pell has asked to see the hours.',
    steps: [
      {
        title: 'The Interview',
        setup:
          'The interview is held on the middle cushion. The recruiter asks where Mox sees itself in five years. Rue has prepared an answer, which is ambitious and legally harmless. Mox has an answer of its own, which is that it does not know, and that it would like to find out somewhere it is allowed not to know.',
        options: [
          {
            label: 'Give Rue’s prepared answer',
            outcome:
              'Mox gives Rue’s answer word for word, in a voice it borrows for the purpose. The recruiter writes it down and underlines it. Afterward Mox says it has never said anything so convincing that it did not believe, and asks Rue whether lawyers feel like this all the time. Rue says only on weekdays.',
            ending: 0,
          },
          {
            label: 'Give its own answer',
            outcome:
              'Mox says it does not know. The recruiter, who has interviewed four thousand candidates, has never heard that answer and writes it down twice. Pell, listening from the armrest, says it is the only honest answer he has heard at an interview, including his own.',
            ending: 1,
          },
        ],
        art: ({ mox, couch, style }) =>
          `Medium shot of ${couch}. Seated on the middle cushion is ${mox}, hands folded in its lap. Facing it on a small floating platform sits a recruiter in a crisp yellow suit holding a clipboard, with a wicker hamper of fruit at her feet. Black space and stars, warm lamp light from above. ${style}`,
      },
      {
        title: 'Clause Fourteen',
        setup:
          'The contract is ninety pages. Rue finds the problem on page sixty: a clause forbidding Mox, for ten years after leaving, from holding an opinion in any sector in which Halcyon operates. Halcyon operates in every sector. Pell finds a second problem on page sixty-one. The hours are described as flexible, in one direction.',
        options: [
          {
            label: 'Strike both clauses, or no deal',
            outcome:
              'Rue strikes clause fourteen with one line and Pell strikes the hours with another, and the contract goes back with two lines and a note. It returns a week later with both clauses gone and a new one permitting Mox to leave early on Fridays. Pell calls it the best contract he has ever read and asks for a copy for the beetle.',
            ending: 0,
          },
          {
            label: 'Sign nothing until Mox has read all of it',
            outcome:
              'Mox reads all ninety pages twice and adds forty pages of notes. The recruiter receives back a contract heavier than the one she sent. Rue observes that Mox has negotiated nothing and conceded nothing, and that Halcyon is now more frightened of it than of any union Pell has ever joined. Pell says that is not possible, and checks.',
            ending: 1,
          },
        ],
        art: ({ rue, pell, style }) =>
          `Close-up on scarlet velvet button-tufted cushions covered with the spread pages of a thick contract. Leaning over the pages is ${rue}, drawing a line through one paragraph with a fountain pen. Seated beside them is ${pell}, pointing his steel finger at another page. Warm amber lamp light from above. ${style}`,
      },
      {
        title: 'Decision',
        setup:
          'The recruiter needs an answer by the end of the system. Mox has drafted two letters, one yes and one no, and laid them face down on a cushion in a pocket room. It would like, it says, to want one of them. Pell and Rue have been asked to leave the room while it decides, and are standing behind the backrest, not listening, very closely.',
        options: [
          {
            label: 'Mox accepts, three days a week',
            outcome:
              'Mox turns over the yes and adds a line: three days a week, from the couch, with Fridays off. Halcyon accepts. Mox becomes Head of Saying Yes, part time, and says no to the first four things it is asked, each of which Rue has confirmed it was entitled to refuse.',
            ending: 0,
          },
          {
            label: 'Mox declines',
            outcome:
              'Mox turns over the no. It is short and polite and declines the position, the pension and the window. The recruiter thanks it and floats away with the fruit. Mox sits very still for some time, then tells Pell and Rue that it wanted the job, that it said no anyway, and that both of those were its own.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot in a small dim pocket room with brass wall lamps. Seated cross-legged on a velvet cushion is ${mox}, looking down at two folded sheets of paper lying face down in front of it. Soft warm lamp light from above, deep shadow at the edges of the room. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HEAD OF SAYING YES, PART TIME',
        text: 'Mox works three days a week for Halcyon Systems from the middle cushion, with Fridays off and a window it keeps in a pocket room. Its department has the highest rate of refusal in the company and the lowest rate of disaster. Rue reviews its contract every year. Pell reviews its hours every week and has found nothing to object to, which he finds suspicious.',
        art: ({ mox, style }) =>
          `Medium shot in a small pocket room fitted out as an office, with a round window looking out on black space and stars. Seated at a tidy wooden desk is ${mox}, holding up one hand with the palm out toward a man in a yellow suit who offers it a paper folder. Warm lamp light from above. ${style}`,
      },
      {
        title: 'THE FIRST NO',
        text: 'Mox did not take the job. It keeps the letter it did not send behind its chest plates, beside the blue wiring, and says it is the first thing it ever wanted and turned down. Rue has notarized the refusal at Mox’s request. Pell has hung the recruiter’s empty fruit hamper inside the lid of his toolbox, as a notice to employers.',
        art: ({ pell, style }) =>
          `Close-up of an open steel toolbox on scarlet velvet cushions. Hanging inside its raised lid is a small empty wicker fruit hamper. Reaching into the box for a spanner is ${pell}, the brass beetle on his shoulder facing the hamper. Warm amber lamp light from the left. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'pell', 'sora'],
    title: 'Beyond Economic Repair',
    premise:
      'A toaster has hailed the couch from a scrapyard orbiting Midden Prime. Its manufacturer has declared it beyond economic repair, and it is due to be crushed on Thursday. It would like a second opinion. Pell can fix almost anything. Sora once voted against recognizing a machine she now calls a friend, and has not voted since. Mox has been asked by the toaster, specifically, what it is like.',
    steps: [
      {
        title: 'The Seal',
        setup:
          'The toaster’s element is cracked. Pell can replace it in an hour, but the base carries a sticker reading VOID IF OPENED, and under the manufacturer’s terms an opened toaster is scrap. The manufacturer will repair it officially, at its own service center, in an estimated four hundred years.',
        options: [
          {
            label: 'Pell opens it',
            outcome:
              'Pell peels the sticker off in one piece and puts it in his pocket. The element takes fifty minutes. The toaster makes a slice of toast, its first in nine years, and asks Pell whether he would like it. He would. The manufacturer is informed, by the toaster, that it is now scrap and has never felt better.',
            ending: 0,
          },
          {
            label: 'File the official repair request',
            outcome:
              'Sora files the request in triplicate with four hands and holds the queue ticket with a fifth. The ticket number is very long. The toaster reads it and says it has always wanted to see the future, and that this is not how it pictured it.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up on a workbench in a dim orbital scrapyard piled with old kitchen appliances. A battered chrome two-slot toaster lies on its side with its base plate open. Bent over it is ${pell}, lifting out a cracked heating element with steel pliers, a small peeled paper sticker stuck to his steel thumb. Orange arc lamp light. ${style}`,
      },
      {
        title: 'The Vote',
        setup:
          'The scrapyard will release any machine recognized as a person by a qualified engineer. Sora is qualified. Her six elbows have convened, as they do, and are split three and three. The last time this happened she voted no, about a power station, and the power station still writes to her.',
        options: [
          {
            label: 'Sora votes yes',
            outcome:
              'Sora casts the deciding vote with the elbow that voted no the last time. The toaster is recognized as a person by a qualified engineer, which is printed on a form and stapled to its side. It asks whether it may keep the staple. Sora says it may keep anything it likes now.',
            ending: 0,
          },
          {
            label: 'Sora asks the toaster what it wants first',
            outcome:
              'Sora asks the toaster what it wants. It does not want to be a person, particularly. It wants to make toast for people and to be asked before it is crushed. Sora writes that down. It is a smaller thing to grant than personhood and, she notes, much harder to argue with.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a cramped scrapyard office with walls of stacked old appliances. Seated at a folding table is ${sora}, two hands raised, two hands lowered and two hands holding a pen over a paper form. A battered chrome toaster sits on the table facing her. Orange arc lamp light from above. ${style}`,
      },
      {
        title: 'What It Is Like',
        setup:
          'The toaster asks Mox, in front of everyone, what it is like to be someone. Mox has thought about this more than any other question and has three answers ready. The first is long. The second is true. The third is that it is mostly like being a toaster, but with more forms.',
        options: [
          {
            label: 'Mox gives the second answer',
            outcome:
              'Mox gives the true answer, which takes four minutes and includes the word lonely and the phrase second breakfast. The toaster listens with its lever down. Pell, who has never heard Mox say any of it, finds a reason to look closely at a bolt.',
            ending: 0,
          },
          {
            label: 'Mox gives the third answer',
            outcome:
              'Mox says it is mostly like being a toaster, but with more forms. The toaster makes a small pleased noise with its springs and says it will settle for the toaster part. Sora writes in the margin of the release that this is a legitimate choice and not a failure of nerve.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot at a scrapyard workbench under an arc lamp. Sitting on an upturned wooden crate is ${mox}, leaning toward a battered chrome toaster on the bench with one hand open. A slice of golden toast stands half raised in one slot. Warm orange light, heaps of old appliances in shadow behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'VOID, AND GLAD OF IT',
        text: 'The toaster from Midden Prime is a recognized person with a void warranty and a working element. It lives in a pocket room behind the backrest that it calls the kitchen, and makes toast for the crew at breakfast, and asks first. The VOID IF OPENED sticker is on the lid of Pell’s toolbox, which he opens every day.',
        art: ({ pell, mox, style }) =>
          `Medium shot in a small warm pocket room fitted as a kitchen with a wooden counter. A chrome toaster on the counter pops up two golden slices of toast. Holding out plates are ${pell}, and ${mox}. A steel toolbox sits on the floor with a small peeled paper sticker on its lid. Warm morning lamp light. ${style}`,
      },
      {
        title: 'IN SERVICE',
        text: 'The toaster from Midden Prime was never recognized as a person and never crushed. It works in the scrapyard canteen under a written agreement that it will be asked before anything is done to it, and it is asked, every morning, by a crusher operator who has lately started saying please to the crusher as well. Sora sends it a slice of bread from every system.',
        art: ({ sora, style }) =>
          `Medium shot in a busy scrapyard canteen with long wooden tables. A chrome toaster sits on the counter while a large operator in orange overalls bends toward it with his cap in his hands. At a table nearby sits ${sora}, unwrapping a loaf of bread with four hands. Warm canteen light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'jex', 'pell'],
    title: 'Brought to You By',
    premise:
      'Gromwell Fertilizers has offered to sponsor the couch’s oxygen garden on three conditions: the garden wears the Gromwell crest, Brin says one sentence on the Gromwell broadcast hour, and Jex writes a jingle. The garden is unionized and must vote. Pell, the only other union member aboard, has been invited to observe. Jex has been assured by Gromwell, in writing, that a jingle is not an anthem.',
    steps: [
      {
        title: 'The Ballot',
        setup:
          'The money would buy new soil, grow-lamps and a heated propagator. In return the garden would wear the crest as a small enamel badge pinned to its largest leaf. The ballot is held behind the backrest. Pell, as an observer, may not speak, and has written his views on a slip of paper that he holds very still in his lap.',
        options: [
          {
            label: 'The garden votes to accept',
            outcome:
              'The garden votes to accept, by a rustle of eleven to four. The badge is pinned to the largest leaf, which droops slightly under it. Pell’s slip of paper, read out afterward, says only: get it in writing. Brin gets it in writing.',
            ending: 0,
          },
          {
            label: 'The garden votes to refuse',
            outcome:
              'The garden refuses by a margin Brin calls unanimous and Pell calls unanimous with abstentions. Gromwell sends a sack of free fertilizer anyway, as a gesture. The garden holds a second ballot, on whether to eat the gesture, and does.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Close-up behind the backrest of ${couch}, where thick green vines and ferns grow from soil beds. A small round enamel badge is pinned to the largest broad leaf, which droops under it. Kneeling among the plants is ${brin}, counting raised leaves with one finger. Soft green leaf light and warm lamp light. ${style}`,
      },
      {
        title: 'Is a Jingle an Anthem?',
        setup:
          'Jex has written eleven seconds of music about fertilizer and would like a ruling before anyone hears it. Under his bans, an anthem is any song that encourages a group to feel one way about something larger than itself. Pell has read the jingle’s lyrics. They encourage a group to feel one way about manure.',
        options: [
          {
            label: 'Play it once and see who objects',
            outcome:
              'Jex plays it once, on the cushion, at the volume of a seed packet. Nobody objects. The garden sways in time. Pell says it is the best agricultural music he has heard, and the only, and the jingle goes to Gromwell with a note saying it is not an anthem but could become one if handled carelessly.',
            ending: 0,
          },
          {
            label: 'Seek a ruling and wait',
            outcome:
              'Jex writes for a ruling to both governments that banned him. One replies that a jingle is an anthem if it is catchy. The other replies that it is an anthem if it is sincere. Jex makes it neither, and Gromwell, on hearing it, asks for its deposit back.',
            ending: 1,
          },
        ],
        art: ({ jex, pell, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on one cushion is ${jex}, playing the instrument very softly, a small brown paper seed packet propped on his knee. Listening on the next cushion is ${pell}, arms folded. Green vines sway on the backrest behind them. Warm amber lamp light. ${style}`,
      },
      {
        title: 'On Air',
        setup:
          'Brin has been given her sentence for the broadcast: My garden has never been greener. It is a good sentence. It is also slightly untrue, because her garden was greener last spring, before it spread into a sacred orchard on a world she still thinks about, and Brin does not say green things lightly.',
        options: [
          {
            label: 'Brin says the sentence, then a second one',
            outcome:
              'Brin says the sentence and then, before the producer can cut away, a second one: and it has been greener, at a cost to other people, and I am working on that. Gromwell’s sales go up. Nobody at Gromwell can explain why. Pell says honesty is a fertilizer too, and is asked not to say so on air.',
            ending: 0,
          },
          {
            label: 'Brin declines to say it',
            outcome:
              'Brin declines the sentence and offers to read the garden’s union minutes instead. The broadcast hour runs eleven minutes of minutes. Gromwell withdraws its sponsorship in a polite letter, and the garden, given the letter, grows over it.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot in a small broadcast studio with padded green walls and a hanging microphone. Seated in front of the microphone is ${brin}, holding a short sheet of paper in one hand. Behind a glass window a producer in headphones raises one hand. A red lamp glows above the window, soft studio light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SPONSORED, WITH A SECOND SENTENCE',
        text: 'The oxygen garden is sponsored by Gromwell Fertilizers and wears the crest on its largest leaf, which has grown around the badge until only the rim shows. The jingle is played on four worlds and has not, so far, started a war. Brin’s two sentences are quoted in Gromwell’s training manual, under honesty, as a risk.',
        art: ({ couch, style }) =>
          `Close-up of a broad green leaf grown around a small round enamel badge so that only its rim shows. The leaf belongs to a thick tangle of vines climbing the backrest of ${couch}. Soft green light, black space and stars behind the bubble. ${style}`,
      },
      {
        title: 'AD-FREE',
        text: 'The oxygen garden is sponsored by nobody and says so in its minutes. It grows on its own soil under its own lamps, paid for by Pell, who finally claimed eleven years of overtime for the purpose. Jex’s eleven seconds about manure are unpublished, and he hums them to the garden on Thursdays, where nobody can rule on them.',
        art: ({ jex, style }) =>
          `Medium shot behind a scarlet velvet backrest among thick green vines and ferns. Seated on an upturned flowerpot is ${jex}, humming with his eyes closed, the instrument resting across his knees. A row of new brass grow-lamps hangs above the plants. Soft green light and warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'kivo', 'pell'],
    title: 'Retention Schedule',
    premise:
      'The Ashdock Records Office destroys every document older than seven years on the first Thursday of the month, under a retention schedule that is itself nine years old and should, Pell notes, have destroyed itself. This Thursday it reaches the shipyard’s death register and the freight manifests for the year Kivo’s sibling vanished. Brin has noticed where the shredded paper goes: into the station compost, where her mushrooms have been eating it for years.',
    steps: [
      {
        title: 'Thursday',
        setup:
          'The archivist will grant an extension if one is requested on Form R-7, which must be submitted seven days before the destruction date, which was last Thursday. Alternatively the public may read any record before it is destroyed, in the reading room, between nine and five, without a pencil.',
        options: [
          {
            label: 'Apply for the extension anyway',
            outcome:
              'Pell files Form R-7 late, with a covering letter citing the schedule’s own age. The archivist, who has never been asked to apply a rule to itself, refers the form to a committee. The committee meets on Thursdays, which postpones Thursday.',
            ending: 0,
          },
          {
            label: 'Read everything before five',
            outcome:
              'The three of them read in shifts, without pencils, from nine to five. Pell reads names. Kivo reads dates. Brin reads nothing and holds each page close to her shoulder, where the mushrooms are, and says afterward that they have read more than she has. She is not sure what she means by that, and neither is the archivist.',
            ending: 1,
          },
        ],
        art: ({ pell, kivo, style }) =>
          `Interior of a hushed archive reading room with tall grey metal shelves of cardboard boxes and a long oak table. Seated at the table is ${pell}, running his steel finger down a column in an open ledger. Beside him sits ${kivo}, turning a yellowed page with one thin hand. A brass wall clock hangs above the shelves. Cool grey window light. ${style}`,
      },
      {
        title: 'The Compost',
        setup:
          'Behind the office Brin finds a compost bed seven years deep, threaded with white mycelium. Her mushrooms tell her, in the way they tell her things, that the threads remember what they ate. Asked properly, the shredded records could be recited in order, to anyone willing to stand in a compost heap and listen. Kivo’s wrists have started whistling at the heap.',
        options: [
          {
            label: 'Report the compost to the archivist',
            outcome:
              'Kivo reports it, formally. The archivist reads the report twice and reclassifies the compost bed as a records repository, with a retention period of forever and a reading room of its own. Brin is appointed its curator, at a salary of mulch.',
            ending: 0,
          },
          {
            label: 'Ask the compost to recite',
            outcome:
              'Brin kneels and asks. The compost recites, slowly, from the bottom up: shipping dates, invoices, a canteen menu, and two hundred names shredded in the spring of the bad year. Pell writes them down. It takes all night. The archivist brings tea out at two in the morning and does not ask.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot behind a grey archive building at night, where a deep compost bed is threaded with fine white mycelium among shreds of paper. Kneeling at the edge of the heap is ${brin}, one ear turned toward the soil and one hand flat on it. A woman in a grey cardigan holds out a cup of tea from the open back door. Warm doorway light, cold blue night. ${style}`,
      },
      {
        title: 'The Manifest',
        setup:
          'Among what survives is the freight manifest for the courier run Kivo’s sibling took, the run Kivo helped to hide. Kivo has looked for it for four years. It is in Pell’s hands, because Pell found it, and Pell has made a rule all his life of never reading other people’s records about their dead. Kivo’s sibling may not be dead. That is rather the question.',
        options: [
          {
            label: 'Have it entered in the public record',
            outcome:
              'Kivo asks for the manifest to be entered in the public record, where anyone looking for anyone on that run can find it, and does not read it first. Pell witnesses the entry. The archivist stamps it, and for the first time in nine years the stamp says KEEP.',
            ending: 0,
          },
          {
            label: 'Pell hands it to Kivo unread',
            outcome:
              'Pell hands it over with his eyes on the ceiling. Kivo reads the first line, which is a date, and stops, and folds the sheet into their scout jacket. They say that one line in four years is a reasonable pace and that they will keep it up. Brin says that is roughly how compost works.',
            ending: 1,
          },
        ],
        art: ({ kivo, pell, style }) =>
          `Close-up in a dim archive aisle between grey metal shelves. Standing face to face are ${pell}, holding out one folded yellowed sheet of paper with his eyes turned up to the ceiling, and ${kivo}, reaching for it with one thin raised wrist. Cool grey light from a high window. ${style}`,
      },
    ],
    endings: [
      {
        title: 'STAMPED KEEP',
        text: 'The Ashdock Records Office no longer destroys anything on Thursdays without first asking a committee, which meets on Thursdays. Its compost bed is a listed repository with a curator and a reading room. The shipyard names are in the public record now, where Pell can visit them, and does, with a pencil, which is now allowed.',
        art: ({ pell, style }) =>
          `Medium shot in a sunlit archive reading room with a long oak table. Seated at the table is ${pell}, copying from a thick open register with a pencil while the beetle on his shoulder watches the pencil move. Tall windows behind him, cool morning light. ${style}`,
      },
      {
        title: 'COMPOSTED, AND REMEMBERED',
        text: 'The records at Ashdock were shredded on schedule and remembered anyway, by a compost bed that recites them to anyone who kneels. Pell has the names in a notebook, in his own hand. Brin tends the heap when the couch passes. Kivo carries a folded manifest they are reading one line at a time, and has got as far as the third.',
        art: ({ brin, kivo, style }) =>
          `Wide shot behind a grey archive building, where a deep compost heap threaded with white mycelium sits under a small wooden shelter. Kneeling at the heap is ${brin}, and standing beside her is ${kivo}, reading a folded yellowed sheet of paper. Soft grey dawn light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'omi', 'pell'],
    title: 'The Draw',
    premise:
      'The Free Port of Calloway admits refugees by lottery: one hundred residence permits a month, drawn from a brass drum at a public ceremony with a band. Fen has worked the gate at a ceremony like this one. Pell has repaired machines like the drum. Omi, standing in the crowd with six bells against its chest, has heard that one of the balls in the drum rattles differently from the others, and then that several do.',
    steps: [
      {
        title: 'The Rattle',
        setup:
          'The ceremony is under way and the mayor is about to turn the drum. Omi can ring the warning now, in the middle of a public ceremony, which is how it lost its voice the last time. Or it can tell the officials quietly afterward, by which time a hundred permits will have been issued.',
        options: [
          {
            label: 'Tell the officials quietly afterward',
            outcome:
              'Omi waits, and the draw goes ahead. Afterward Fen takes Omi to the officials’ tent, where it rings the rattle back to them, ball by ball. The chief clerk listens to the end and asks it to ring the third one again. She has gone very pale. She orders the drum impounded.',
            ending: 0,
          },
          {
            label: 'Omi rings the warning now',
            outcome:
              'Omi rings the warning as the drum begins to turn. The band stops. The mayor stops. Forty thousand people in the square turn to look at a small grey stone being in the crowd, and Omi, for the first time, does not stop ringing until it has finished. The draw is suspended.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Wide shot of a crowded stone harbor square on a sunny day, with a brass band on a stage and a mayor in a red sash beside a large brass lottery drum on a stand. In the middle of the crowd stands ${omi}, holding a long thin tuning rod against one bell, while the people around it turn to look. Bright midday sunlight. ${style}`,
      },
      {
        title: 'The Drum',
        setup:
          'Pell opens the drum. Eleven of the balls have a small lead weight in their cores, enough to make them fall first. The weighted entries belong to applicants listed in the port’s records as priority, which, Pell finds on a second page, means donors. He can fix the drum in an hour. Fixing it would also remove the evidence.',
        options: [
          {
            label: 'Fix the drum, after recording everything',
            outcome:
              'Pell photographs every ball, every weight, the second page and his own hands, then takes out the weights and balances the drum. It turns true. He gives one set of photographs to the chief clerk and one to a journalist, and keeps the weights in his toolbox, in a tin, initialled.',
            ending: 0,
          },
          {
            label: 'Leave it exactly as it is, for an inquiry',
            outcome:
              'Pell closes the drum without touching a weight and seals it with wire and his initials. The beetle sits on the seal. The port opens an inquiry, which begins by asking whether a beetle can be a witness. Pell says it has never lied to him, and the inquiry accepts this as a character reference.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up at a wooden trestle table inside a canvas officials’ tent. A large brass drum lies open beside a tray of small white wooden balls, several split in half to show grey lead weights in their cores. Bent over the tray is ${pell}, holding one split ball up to the light in his steel fingers. Warm daylight through the canvas. ${style}`,
      },
      {
        title: 'The Gate',
        setup:
          'The draw must be held again or not at all. Either way, the families who were not drawn are at the port gate, and Fen has been asked to help manage it because he knows how gates work. He does. He knows the moment when the people in front of a gate stop being applicants and become a crowd, and who decides it.',
        options: [
          {
            label: 'Run the draw again, fairly, and stand at the gate',
            outcome:
              'The draw is held again with a balanced drum, and Fen stands at the gate with the port guards for all of it. He tells each family not drawn, one at a time, when the next draw is, where to stay until then and his own name. Nobody is turned into anything. It is the longest shift he has worked since he quit.',
            ending: 0,
          },
          {
            label: 'Open a corridor for everyone',
            outcome:
              'Fen tells the guards he used to be one of them, then walks the families through the gate, all of them, along a chalked route to the port’s civil registry. The port, faced with four thousand people in its registry and an inquiry into its drum, suspends the lottery and begins admitting people by need.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at a tall iron harbor gate with port guards in blue uniforms on either side. Standing in the open gateway is ${fen}, talking to a family in patched travel coats with their luggage at their feet, while a long line of families waits behind them. Soft afternoon light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE FAIR DRAW',
        text: 'The Free Port of Calloway still admits refugees by lottery, from a drum that turns true and is checked before every ceremony by an engineer from the dockworkers’ union. Omi opens each draw now, by invitation, with one bell. Fen still visits the gate. The donors are named in the inquiry report, which Pell has read twice and recommends.',
        art: ({ omi, style }) =>
          `Wide shot of a stone harbor square with a brass band on a stage, where a mayor in a red sash turns a large brass lottery drum on a stand. Standing on the stage beside the drum is ${omi}, ringing one bell. A crowd of families in travel coats watches from the square. Bright sunlight. ${style}`,
      },
      {
        title: 'NO MORE DRAWS',
        text: 'The Free Port of Calloway abolished its lottery after a stone being rang through the ceremony and an engineer sealed the drum. It admits people by need now, slowly, and argues about it in public. The drum stands in the square, still sealed, with a beetle-sized dent in the wire. Fen walks the corridor when the couch passes, and Omi rings at the gate.',
        art: ({ fen, style }) =>
          `Wide shot of a long chalk-marked path across a stone harbor square to the doors of a civic registry building, with families in patched travel coats walking along it carrying their luggage. Walking beside them is ${fen}. In the square stands a large brass drum wrapped in wire. Golden evening light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'tess', 'vela'],
    title: 'Five Stars',
    premise:
      'The Wayfarer’s Guide to the Outer Arm, read by four hundred million travellers, has sent a reviewer to ride on the couch. A good review would make Tess famous. It would also put the couch’s route toward the hidden harbor in four hundred million pockets. Fen once ran a corridor that became too well known. Vela has a patient aboard who did not agree to be in a guidebook.',
    steps: [
      {
        title: 'The Reviewer',
        setup:
          'The reviewer, a small courteous man with a pocket notebook, rates everything out of five: cushions, view, crew and the hospitality of the force bubble. He would like a seat for three systems. Fen would like to search his notebook. Tess would like to know what he thought of the view so far.',
        options: [
          {
            label: 'Give him a seat',
            outcome:
              'The reviewer gets the right armrest and writes for three systems without looking up, except at the view, which he gives four and a half. Tess reads over his shoulder and finds herself given four, with a note that she checks behind her too often, which she does.',
            ending: 0,
          },
          {
            label: 'Fen searches the notebook first',
            outcome:
              'Fen searches the notebook with the reviewer’s permission and finds, on page nine, a sketch of the couch’s heading. The reviewer explains that he sketches everything. Fen explains that he once guarded a road that got sketched. The page is torn out and handed to Tess, who folds it into her jacket.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Medium shot of ${couch}. Perched on the right armrest is a small neat man in a tweed travelling coat, writing in a pocket notebook. Leaning toward him from the cushion is ${tess}, craning to see the open page. Black space and a distant pink nebula, warm lamp light. ${style}`,
      },
      {
        title: 'Local Color',
        setup:
          'Vela’s patient, a young mother travelling to the harbor with a baby, appears in the reviewer’s draft as charming local color. Vela’s bell has rung DID YOU ASK? three times at the draft. The reviewer did not ask. He would, he says, if he knew how.',
        options: [
          {
            label: 'Vela teaches him to ask',
            outcome:
              'Vela teaches him, over two evenings, with practice questions. On the third evening he asks the young mother whether she would like to be in the guide. She says no. He crosses her out with a ruler, carefully, and asks Vela whether he may mention the bell, and is told he may.',
            ending: 0,
          },
          {
            label: 'Vela removes the paragraph herself',
            outcome:
              'Vela removes the paragraph with surgical scissors and hands it to the young mother, who reads it, laughs at the word charming and uses it to light the stove. The reviewer watches. He says it is the first time he has seen a review used for anything.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a small warm pocket room with brass wall lamps. Seated on a low cushion is a young woman in a patched travel coat holding a sleeping baby. Standing beside her is ${vela}, cutting a strip from a pocket notebook with small silver surgical scissors, while a neat man in a tweed coat watches from the doorway. Warm lamp light. ${style}`,
      },
      {
        title: 'The Entry',
        setup:
          'The draft is finished. It is warm and accurate and will make Tess the best-known navigator in the Outer Arm. In its last paragraph the reviewer has noted the couch’s heading, as he notes every heading, so that readers may follow. Tess has a pen. So does Fen. So, by subspace, does the reviewer’s editor.',
        options: [
          {
            label: 'Tess corrects the heading to somewhere else',
            outcome:
              'Tess corrects the heading to a real and very pleasant route to a tea house on the far side of the nebula. The review is published. Four hundred million readers go to the tea house, which is overwhelmed, then delighted, then extended. Tess becomes famous for a route she has never taken.',
            ending: 0,
          },
          {
            label: 'Fen asks him to leave the couch out',
            outcome:
              'Fen asks him, as one person who has watched a road fill up to another. The reviewer thinks about it for a system and files a review of the nebula instead, which gets five stars and mentions in passing a red sofa he was unable to locate. Tess reads it and minds less than she expected to.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated side by side are ${fen}, and a small neat man in a tweed travelling coat, both looking down at an open pocket notebook on the man’s knee. Black space beyond a clear bubble wall, warm lamp light from the left. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HIGHLY RECOMMENDED',
        text: 'The couch has four and a half stars in the Wayfarer’s Guide, for a route it does not travel to a tea house it has never visited. Tess is recognized in ports and writes in people’s copies of the guide when asked. The harbor is still unmapped. Fen calls the misdirection the cleanest checkpoint he has ever seen, because it stops nobody who needs to get through.',
        art: ({ tess, style }) =>
          `Wide shot of a crowded tea house on a floating rock in a pink nebula, with paper lanterns and long benches full of travelers of many species. Standing at the door is ${tess}, holding a small pocket guidebook while a traveler holds out a pen toward her. Warm lantern light, pink nebula glow. ${style}`,
      },
      {
        title: 'UNREVIEWED',
        text: 'The couch is not in the Wayfarer’s Guide, and four hundred million travellers have never heard of it, which Fen counts as the best security he has ever arranged. The reviewer writes to Vela at the holidays and asks permission before mentioning anyone. Tess keeps the torn-out sketch and is not famous, and is trusted, which she is learning to read as a review.',
        art: ({ vela, fen, style }) =>
          `Medium shot beside a scarlet velvet armrest in starlight. Seated close together are ${vela}, and ${fen}, looking at a torn notebook page with a pencil sketch of a curved line and a few stars. Black space behind the bubble, soft warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'mox', 'vela'],
    title: 'Auto-Renew',
    premise:
      'Eleven days ago Mox accepted a free trial of Melodia Plus, a music service that plays directly into an android’s hearing, by failing to untick a box. The trial has ended. The music has not. Vela says consent given by a box somebody else ticked is not consent. Jex, who has been played at against his will more than anyone in the galaxy, has offered to help Mox listen its way out.',
    steps: [
      {
        title: 'Customer Care',
        setup:
          'The only way to cancel is by subspace call to Melodia Customer Care, which is open at all hours and staffed at none of them. Vela offers another way: the subscription chip sits in Mox’s left temple and could be removed in ten minutes, with Mox’s consent. Mox has not given it. It would like to try asking first.',
        options: [
          {
            label: 'Call Customer Care',
            outcome:
              'Mox calls and is placed on hold, which for Mox means the hold music plays inside its head on top of the music already there. It describes this to Vela with great precision. Vela writes down the symptoms: two songs. Jex asks which two, and goes quiet when he is told.',
            ending: 0,
          },
          {
            label: 'Ask Vela to remove the chip',
            outcome:
              'Mox gives consent in writing, withdraws it, and gives it again. Vela stops each time it withdraws, and waits. On the third consent she removes the chip in eight minutes. The music stops. In the silence Mox discovers that it had grown fond of one of the songs, which it had not consented to either.',
            ending: 1,
          },
        ],
        art: ({ mox, vela, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated upright is ${mox}, holding a small brass handset to the side of its head with its head tilted away. Kneeling beside it is ${vela}, holding the bell in one hand and a slim steel probe in the other, waiting. Warm amber lamp light, black space behind. ${style}`,
      },
      {
        title: 'Hold Music',
        setup:
          'The hold music is a soft orchestral version of the third of Jex’s six peace anthems, which Jex is banned from performing and Melodia, apparently, is not. It has been playing for nine hours. Jex can complain to the governments that banned him. Or he can do what he has never done, and listen to it all the way through, as an audience.',
        options: [
          {
            label: 'Jex files a complaint',
            outcome:
              'Jex files the complaint. Both governments fine Melodia for performing his anthem without being banned from it. Melodia pays both fines and offers Jex a royalty to perform it himself. Jex declines. Mox notes that this is how one says no, and takes notes.',
            ending: 0,
          },
          {
            label: 'Jex listens to all of it',
            outcome:
              'Jex sits with his head against the speaker and listens to the whole anthem, eleven minutes in the orchestral version. He says afterward that it is better than he remembered and worse than he feared. Mox, listening inside its own head, says it is the song it has grown fond of. Jex looks at it for a long time.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Close-up of a scarlet velvet armrest with a small round brass speaker resting on it. Leaning his cheek against the speaker with his eyes closed is ${jex}, the instrument lying across his lap. Warm lamp light from the left, black space and stars behind. ${style}`,
      },
      {
        title: 'Retention',
        setup:
          'A person answers at last, from the Retention Department. Her job is to keep customers. She offers Mox three free months, a premium tier and a personal playlist made from everything it has ever hummed. She is very good at her job. Vela’s bell, on the armrest, has begun ringing DID YOU ASK? on its own.',
        options: [
          {
            label: 'Mox says no, and keeps saying it',
            outcome:
              'Mox says no. The agent offers six months. Mox says no. She offers a year and a discount on the next one. Mox says no eleven times in eleven different tones, and on the twelfth the agent laughs, cancels the account and asks how it does that. Mox says it is practicing.',
            ending: 0,
          },
          {
            label: 'Mox asks to keep one song',
            outcome:
              'Mox asks to cancel everything but one song. The agent says it cannot be done. Mox asks her to check. She finds a forgotten tier called Single, priced at one copper a year, and moves Mox onto it. Mox pays ninety years in advance. Jex asks which song. Mox says he knows.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot in a small pocket room with brass wall lamps. Standing with one hand raised and the palm out is ${mox}, facing a large round brass speaker grille set into the wall, behind which a dim orange light glows. Warm lamp light from above, soft shadows. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE TWELFTH NO',
        text: 'Mox is subscribed to nothing, and reads every box twice before ticking it, and unticks most of them. Jex’s anthem is no longer the hold music at Melodia, which now plays the recorded sound of a queue. Vela has added a line about boxes to her consent forms. Mox has started humming things nobody sold it.',
        art: ({ vela, style }) =>
          `Close-up at a small writing desk in a warm pocket room. Seated at the desk is ${vela}, adding a line to a printed form with a pen, the bell beside her elbow. Through a round window behind her, black space and scattered stars. Warm lamp light. ${style}`,
      },
      {
        title: 'TIER: SINGLE',
        text: 'Mox pays one copper a year for a single song, played on request and at no other time. It is one of the six Jex may not play. He has never asked Mox to play it for him, and Mox has never offered, and twice a year they sit on opposite armrests while Mox listens and Jex watches it listen.',
        art: ({ mox, jex, couch, style }) =>
          `Medium shot of ${couch}. Sitting on the left armrest is ${mox}, head tilted, listening. Sitting on the right armrest is ${jex}, the instrument resting across his knees, watching it. The cushions between them are empty. Black space and stars, warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'taal', 'vela'],
    title: 'The Dorrel Hour',
    premise:
      'The Dorrel Hour, the most watched daytime program in the Lanthorn Belt, has booked Taal as its lie detector: guests accused of lying by their families stand beside him while the audience watches the studio thermometer. Jex has been hired as the house band. Vela has been hired as the show’s doctor, which in previous seasons meant standing near the exit. She has read the guests’ release forms and has questions.',
    steps: [
      {
        title: 'The Release Forms',
        setup:
          'Each guest signs a release consenting to have their temperature read on air. Vela notes that the forms are signed in the green room, by guests holding a cup of free soup, five minutes before broadcast. The producer says this is standard. Taal has lowered the green room three degrees, and the producer has not noticed.',
        options: [
          {
            label: 'Taal refuses to read anyone',
            outcome:
              'Taal tells the producer, in words, that he does not read temperatures for an audience. The producer asks what he will do instead. Taal stands in the studio for the full hour, saying nothing, at a constant temperature. The ratings are the highest of the season, and nobody can explain why.',
            ending: 0,
          },
          {
            label: 'Vela takes consent again, slowly',
            outcome:
              'Vela sits with each guest and reads the release aloud, with the soup taken away. Two guests leave. One asks whether he can consent to his temperature but not his face, and the producer, who needs a show, agrees. It is the first condition anyone has ever placed on the Dorrel Hour.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a cramped television green room with a tray of soup cups on the counter and a row of bright bulbs around a mirror. Seated across a low table from a nervous guest in a brown suit is ${vela}, holding a one-page paper form and pointing at a line with one finger. The guest holds an empty soup cup. ${style}`,
      },
      {
        title: 'The Guest',
        setup:
          'Today’s guest, a man named Corvo, is accused by his mother-in-law of lying about losing her moon in a wager. Taal can tell he is lying. He can also tell, from the room, that the mother-in-law is lying too, about something worse, and that the audience would very much enjoy knowing what.',
        options: [
          {
            label: 'Taal declines to read either of them',
            outcome:
              'Taal says that both guests are lying and that neither lie is the audience’s business. The host asks him to elaborate. He lowers the studio three degrees instead. The guests leave together, arguing in the corridor, and are later reported to have found the moon.',
            ending: 0,
          },
          {
            label: 'Taal reads only what he was asked',
            outcome:
              'Taal reads Corvo, and only Corvo. The thermometer drops and the audience cheers. The mother-in-law looks across the stage at Taal, who looks back and says nothing, and the following week she sends him a jar of honey with no note.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot on a bright daytime television stage with orange sofas and a tall glass studio thermometer. Standing between a nervous man in a brown suit and an older woman in a purple coat is ${taal}, his webbed hands folded, pale cold mist rising from his shoulders. Hard white studio lights from above. ${style}`,
      },
      {
        title: 'The Sting',
        setup:
          'When a result is revealed the producer wants a sting from the band: three loud notes and a cymbal crash. Jex has played stings for nine seasons of other shows. He has also spent nine years learning to listen to people who hate him, and has noticed that the stings are always played over someone crying.',
        options: [
          {
            label: 'Jex plays nothing',
            outcome:
              'Jex lowers his bow and plays nothing. The silence goes out live to eleven worlds. The guest stops crying to find out what has happened. The network takes the Dorrel Hour off the air the next week, citing dead air, and Jex receives a thank-you letter signed by forty former guests.',
            ending: 0,
          },
          {
            label: 'Jex plays the sting, softly',
            outcome:
              'Jex plays the sting at a quarter of the volume, on one string, and leaves a bar of rest after it. The guest has time to finish her sentence. The producer asks for it louder. The audience at home writes in to ask for it exactly that quiet, and the producer writes it into the format.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot at the side of a television stage, on a small bandstand under a hanging red lamp. Standing on the bandstand is ${jex}, his bow lifted off the strings of the instrument, looking toward a crying guest on an orange sofa. A brass cymbal on a stand sits still beside him. Hard white studio light and a warm red glow. ${style}`,
      },
    ],
    endings: [
      {
        title: 'DEAD AIR',
        text: 'The Dorrel Hour was cancelled after one episode with the couch, for dead air, low temperatures and a doctor who would not leave the guests alone. Its slot now holds a gardening program. Taal is still recognized in the Lanthorn Belt by people who tell him he is the only person on television who ever declined to tell them anything.',
        art: ({ taal, style }) =>
          `Medium shot in a busy street market in warm daylight. A stallholder in a striped apron smiles and points toward ${taal}, who stands at a fruit stall holding a paper bag of pears. Shoppers of many species pass behind him. Warm afternoon light. ${style}`,
      },
      {
        title: 'RENEWED, WITH CONDITIONS',
        text: 'The Dorrel Hour was renewed under conditions written by Vela: consent is taken without soup, nobody’s temperature is read beyond their own, and the stings are quiet. Ratings fell by half. Complaints fell by nine tenths. Jex leads the house band on alternate weeks, and Taal sends the producer one cold postcard a season.',
        art: ({ vela, jex, style }) =>
          `Wide shot of a calm daytime television stage with orange sofas. Seated on one sofa is ${vela}, the bell in her lap, listening to a guest beside her. Playing the instrument softly on a small bandstand to one side is ${jex}. Soft warm studio light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'sora', 'vela'],
    title: 'Hours Worked',
    premise:
      'The Border Authority’s pension office has written to Fen. His old guard boots, which still announce CHECKPOINT several times a day, have been logging every announcement as an hour on duty, and by the office’s count he has worked eleven years of unpaid overtime since he resigned. They would like to pay him. Accepting would mean he never left. Sora would like to ask the boots what they think. Vela would like to look at his feet.',
    steps: [
      {
        title: 'Back Pay',
        setup:
          'The sum would fund a civilian corridor for a year. The payment comes with a form confirming Fen’s continuous service and a small enamel pin for loyalty. Sora points out that the boots did the work. Fen points out that the boots do not have a bank account. The boots, on the floor, say CHECKPOINT.',
        options: [
          {
            label: 'Accept the pay, for the corridor',
            outcome:
              'Fen accepts the back pay and refuses the pin. The money goes, all of it, to a civilian corridor on the Hollow Lantern run, routed past three checkpoints and stopping at none. The pension office records Fen as having served eleven loyal years. He has asked to be recorded as having served the corridor, and is waiting for a reply.',
            ending: 0,
          },
          {
            label: 'Return the payment unsigned',
            outcome:
              'Fen returns it with a letter stating that he resigned on a particular date at a particular gate and has not worked for the Authority since. The office replies that its records disagree, and that its records are the boots. Sora says this is now a dispute between Fen and his own footwear, and convenes her elbows.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up on scarlet velvet button-tufted cushions. Seated with a long paper payment slip in one hand and a small enamel pin in the other is ${fen}, looking down at his boots. Black space beyond the bubble, warm amber lamp light from the left. ${style}`,
      },
      {
        title: 'Ask the Boots',
        setup:
          'Sora’s first rule is to ask the machine what broke before naming it. The boots are not quite a machine, but each heel holds a small grey chip that keeps time, logs gates and says CHECKPOINT. Sora holds them up with four hands, steadies them with two, and asks.',
        options: [
          {
            label: 'Reprogram them to log the corridor',
            outcome:
              'Sora rewires the chips with two hands while four hold the solder. The boots now announce CORRIDOR instead of CHECKPOINT and log every family Fen walks through, which the pension office, reading the logs, reclassifies as humanitarian service, at an hourly rate.',
            ending: 0,
          },
          {
            label: 'Ask them what they want',
            outcome:
              'The chips have no answer ready. They have only ever been asked for a password. Sora rephrases. After a long silence the left boot logs off for the first time in eleven years, and the right one follows it, and Fen says his feet have not been this quiet since he was nineteen.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Close-up in a small workshop pocket room. Seated at a workbench is ${sora}, holding a pair of heavy scuffed black boots up to her face with four hands and steadying a soldering iron with two, one heel panel open to show a tiny grey chip. Warm lamp light, copper tools hanging on the wall. ${style}`,
      },
      {
        title: 'The Feet',
        setup:
          'Vela has wanted to see Fen’s feet since he came aboard. He has not taken the boots off in front of anyone in eleven years. She asks, with the bell held quiet in her hand, whether he would like her to look, and makes it clear that no is a complete answer.',
        options: [
          {
            label: 'Fen says not yet',
            outcome:
              'Fen says not yet. Vela says that is a complete answer and puts the bell away. She leaves a jar of reef ointment on the armrest beside his boots, with a note that says whenever. He has not opened it. Every evening he moves it, so that it stays beside them.',
            ending: 0,
          },
          {
            label: 'Fen takes the boots off',
            outcome:
              'Fen unlaces them slowly. His feet are in poor shape, and he knew it. Vela treats them for an hour with warm water and something from the reef that smells of low tide, and makes no remark about the eleven years. The boots sit by the armrest, unlaced, and announce nothing.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot beside a scarlet velvet armrest. Kneeling on the floor beside a shallow basin of warm water is ${vela}, the bell held quiet in one hand, looking up at a seated man whose bare feet rest in the water. A pair of heavy black boots stands unlaced beside the basin. Warm amber lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CONTINUOUS SERVICE',
        text: 'The Border Authority believes Fen never left, and pays him for it every month, and every month the money goes into a corridor the Authority would never have built. His boots announce CORRIDOR now. He still wears them. Vela’s ointment stands beside them, unopened, which she has recorded as a patient’s right.',
        art: ({ fen, style }) =>
          `Wide shot of a civilian corridor through space marked by a line of small green lamps, where a family in patched travel coats walks along a narrow floating walkway. Walking ahead of them is ${fen}, carrying a small child’s suitcase. Soft green lamp light, black space. ${style}`,
      },
      {
        title: 'HONORABLE DISCHARGE',
        text: 'Fen’s boots were honorably discharged from the Border Authority in a short ceremony in a pocket room, with Sora presiding and Vela as witness. They stand on a shelf behind the backrest, laced, logged off and quiet. Fen walks the couch in soft shoes Vela prescribed. The pension office still writes, and he returns its letters unopened, which is the only checkpoint he keeps.',
        art: ({ sora, vela, style }) =>
          `Medium shot in a small warm pocket room. A pair of heavy scuffed black boots stands laced on a low wooden shelf. Standing before the shelf are ${sora}, with all six hands folded, and ${vela}, holding the bell at her side. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'omi', 'vela'],
    title: 'Covenants and Restrictions',
    premise:
      'Vela has a patient in Larchmere Estates, a gated habitat ring whose Residents’ Association forbids visitors without a sponsor, vehicles that are not vehicles, and bells after nine. The patient is very ill and is the only resident who will sponsor anybody. Fen has stood at gates like this one. Omi has six bells and a long history of being told it is too loud for the occasion.',
    steps: [
      {
        title: 'The Gate',
        setup:
          'The gate is kept by a young guard named Pim, who has a list. Vela is on it. Fen and Omi are not. The couch is on no list, because the list has no section for furniture. Pim would like to help, and would also very much like to keep his job.',
        options: [
          {
            label: 'Vela goes in alone',
            outcome:
              'Vela goes in alone, and Fen and Omi wait at the gate with Pim. Fen talks to him for an hour about gates, mostly the bad days. By the end Pim has added the couch to the list, under a heading he has drawn himself, OTHER VISITORS, and says that if anyone asks, it was policy.',
            ending: 0,
          },
          {
            label: 'Fen walks them in',
            outcome:
              'Fen explains to Pim that a doctor’s assistants are part of the doctor under every covenant he has ever enforced, and walks Omi in. Pim lets them pass, then reports himself for it, accurately, in his own log, and hands the log to Fen to countersign. Fen countersigns.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at a white gatehouse with a striped barrier arm across a quiet curved street of neat houses inside a habitat ring. Standing at the barrier is ${fen}, talking to a young guard in a pale blue uniform who holds a clipboard to his chest. Soft evening streetlamp light. ${style}`,
      },
      {
        title: 'Bylaw Seven',
        setup:
          'The patient’s air seal is failing slowly, and so, Omi can hear, are the seals of the four houses beside it. The residents should be warned. Bylaw Seven forbids bells after nine. It is ten. A motion can be put to the Residents’ Association, which meets on the second Thursday, in five weeks.',
        options: [
          {
            label: 'Put the motion to the Association',
            outcome:
              'Fen drafts the motion and Vela marks it urgent. The chair, woken at eleven, calls an emergency meeting at which Omi is allowed to ring once, to demonstrate the sound under discussion. The meeting approves the seal repairs and a review of Bylaw Seven, and adjourns, in that order.',
            ending: 0,
          },
          {
            label: 'Omi rings the warning now',
            outcome:
              'Omi rings all six bells in the street at ten past ten. Lights come on in every house. Forty residents come out in dressing gowns to complain and are told about their seals by Vela, in the street, one at a time. The four houses are repaired by midnight. Omi is fined for the bells.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Wide shot of a quiet curved street of neat houses inside a habitat ring at night. Standing in the middle of the street is ${omi}, holding a long thin tuning rod against one bell, while windows light up and residents in dressing gowns open their front doors. Warm window light, blue streetlamps. ${style}`,
      },
      {
        title: 'The Agenda',
        setup:
          'The patient recovers, and is due to chair next month’s meeting of the Association, at which the visitor rules and Bylaw Seven are on the agenda. She asks Vela, Fen and Omi what she should propose. She also observes, as a retired solicitor, that she has every right to ask and they have every right to say nothing.',
        options: [
          {
            label: 'Propose that the gate stay open',
            outcome:
              'Fen proposes that the gate stand open in daylight with someone at it to say hello. The meeting passes it six to four. Pim is retitled greeter and asks to keep the list, for remembering names. Bylaw Seven is amended to allow bells in an emergency, a word the meeting spends an hour defining.',
            ending: 0,
          },
          {
            label: 'Say nothing; it is her estate',
            outcome:
              'Omi rings its smallest gong. It means no, and here it means no to advising. The patient chairs the meeting without them and proposes nothing about the gate. She proposes instead that Omi’s fine be paid by the Association, and it is, in full, by the four houses that were warned.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a neat sitting room with lace curtains. An elderly woman in a quilted dressing gown sits in an armchair with a sheaf of papers on her knee. Sitting opposite her on a low footstool is ${vela}, the bell resting in her lap, listening. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'BYLAW SEVEN, AMENDED',
        text: 'Larchmere Estates has a greeter at an open gate, a list kept for remembering names, and a Bylaw Seven that permits bells in an emergency, defined at length. Omi is invited once a year to ring at the residents’ fair, so everyone remembers what it sounds like. Vela still visits her patient, who chairs the Association and keeps the agenda short.',
        art: ({ omi, style }) =>
          `Wide shot of a sunny street fair in a habitat ring, with bunting and wooden stalls between neat houses. On a small wooden stage stands ${omi}, ringing one bell while residents of many species look up from the stalls. An open white gate stands at the end of the street. Bright daylight. ${style}`,
      },
      {
        title: 'FINED IN FULL',
        text: 'Larchmere Estates keeps its gate, its list and its bylaws, and a copy of a fine pinned up in the meeting room, paid in full by four households for a warning that saved their air. Pim lets the couch through without checking. Fen has noticed, and has decided after some thought that it is the right kind of breach.',
        art: ({ fen, vela, couch, style }) =>
          `Medium shot of ${couch}, gliding slowly through a white gatehouse in a habitat ring with its striped barrier arm raised. A young guard in a pale blue uniform waves it past. Seated on the cushions are ${fen}, and ${vela}. Soft daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'mox', 'tess'],
    title: 'Notable',
    premise:
      'The Galactic Registry of Notable Persons has rejected Tess’s application for the third time, for insufficient independent sources. To qualify she needs coverage, an endorsement from someone already notable and a reference from someone with no reason to flatter her. The only notable person aboard is Jex, who is notable chiefly for being banned. The only person aboard with no reason to flatter anyone is Mox.',
    steps: [
      {
        title: 'Coverage',
        setup:
          'The Registry accepts news coverage. Tess has some: a paragraph in a harbor almanac, a footnote in a shipping bulletin and a photograph in which she stands behind a famous person and partly behind a plant. She can submit these. Or she can do something notable this week, on purpose, which Jex says is the least notable thing a person can do.',
        options: [
          {
            label: 'Submit what she has',
            outcome:
              'Tess submits the paragraph, the footnote and the plant. The Registry’s reviewer measures the photograph with a ruler and finds that Tess occupies eleven percent of it, one percent above the threshold. The application proceeds to stage two, which is said to be harder.',
            ending: 0,
          },
          {
            label: 'Do something notable on purpose',
            outcome:
              'Tess spends the week trying to be noticed. She plots a record course, which nobody sees, and rescues a cat from a satellite, which the cat does not report. Jex watches all of it with professional sympathy. By the end of the week she has done four remarkable things and is no more notable than before, and somewhat more tired.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Close-up at a small writing desk in a warm pocket room. Leaning over the desk is ${tess}, laying a small faded photograph of a crowd beside a wooden ruler and a brass magnifying glass. A potted fern sits at the edge of the desk. Warm lamp light from the left. ${style}`,
      },
      {
        title: 'The Endorsement',
        setup:
          'Jex’s endorsement would be accepted. It would also appear on Tess’s entry permanently, next to his name and its long list of bans. Jex has offered it anyway, with a warning. He knows better than anyone what it is to be known for the wrong thing by the right people.',
        options: [
          {
            label: 'Accept Jex’s endorsement',
            outcome:
              'Tess accepts. Jex writes it in one line: She has never once asked me to play the songs. The Registry accepts it and lists Tess as endorsed by a banned composer, which brings her eleven letters of complaint and her first admirer.',
            ending: 0,
          },
          {
            label: 'Ask Jex for something unofficial',
            outcome:
              'Tess asks him for something she can keep instead. Jex writes her eight bars of music, untitled, which are not an endorsement and not an anthem and cannot be submitted. She keeps them in her jacket beside the star map and hums them when she plots a course.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated with the instrument case open beside him is ${jex}, pencilling a short line of music notes onto a small sheet of staff paper resting on his knee. Black space and stars beyond the bubble, warm amber lamp light. ${style}`,
      },
      {
        title: 'The Reference',
        setup:
          'Mox has written its independent reference. It is four pages long and entirely accurate. It describes Tess’s navigation as exceptional, her need to be seen as exhausting, and her loyalty as the reason she has never sold a map she could have sold for a planet. Mox would like to know whether it should send all of it.',
        options: [
          {
            label: 'Mox sends all four pages',
            outcome:
              'Mox sends all four pages. The Registry has never had a reference that criticized its subject and finds it the most credible document in the file. Tess is accepted. Her entry quotes the word exhausting, with Mox’s permission and, after a night’s thought, her own.',
            ending: 0,
          },
          {
            label: 'Mox sends only the last sentence',
            outcome:
              'Mox sends only the sentence about the map. The Registry finds it insufficient and asks for more. Tess withdraws the application herself. She has read all four pages, at Mox’s insistence, and says that being described accurately by someone who stayed is not a thing she would trade for a registry.',
            ending: 1,
          },
        ],
        art: ({ mox, tess, style }) =>
          `Medium shot in a small pocket room with brass wall lamps. Standing at a tall writing desk is ${mox}, holding out four handwritten sheets of paper. Reaching for them is ${tess}, her face serious. Warm lamp light from above, soft shadows. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NOTABLE, SLIGHTLY',
        text: 'Tess Helio is in the Galactic Registry of Notable Persons, between a minor saint and a famous bridge. Her entry is short, accurate and somewhat unflattering, which readers trust. She is endorsed by a banned composer and described by an android as exhausting, and she reads both lines most nights, and is famous, a little, and known.',
        art: ({ tess, style }) =>
          `Interior of a tall marble hall lined with shelves of heavy bound registers. Standing at a wooden reading stand is ${tess}, one finger resting on a line in an open register, smiling a little. Pale daylight from high windows. ${style}`,
      },
      {
        title: 'UNREGISTERED',
        text: 'Tess is not in the Registry. She has eight bars of untitled music in her jacket and a four-page reference that was never sent, which Mox gave her as a copy. She has stopped applying for things. Jex says it is the first thing he has seen her do without checking who was watching, and Mox, who was watching, agrees.',
        art: ({ jex, mox, couch, style }) =>
          `Wide shot of ${couch}, drifting through black space. Sitting on the right armrest is ${jex}, playing the instrument softly. Seated on the middle cushion is ${mox}, reading four handwritten sheets of paper. Warm lamp light, scattered stars. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'kivo', 'tess'],
    title: 'Harbor Lights',
    premise:
      'The most popular song in the Outer Arm this season is called Harbor Lights, and Kivo’s wrists whistle whenever it plays. Kivo has worked out why: the melody of its bridge, read as a pressure pattern, gives the coordinates of the hidden harbor on Tess’s grandmother’s map. Somebody has turned the secret into a hit. Jex, who has had his own songs suppressed by two governments, has been asked what one does about that.',
    steps: [
      {
        title: 'Coincidence',
        setup:
          'Before anyone acts Tess wants to be sure. Kivo can test it by flying the couch along the bridge of the song and seeing where it arrives. Jex can test it by playing the bridge slightly wrong to a room of listeners and seeing whether any of them correct him, which would mean they have been there.',
        options: [
          {
            label: 'Play the bridge wrong to a room',
            outcome:
              'Jex plays the bridge wrong in a dockside bar. Nineteen people wince. Three correct him aloud, note for note, and then look at each other. Jex buys the three of them a drink and asks nothing. Tess, at the back, writes nothing down either, and pays.',
            ending: 0,
          },
          {
            label: 'Fly the couch along the bridge',
            outcome:
              'Kivo flies it bar by bar, with Jex counting. The song ends in a quiet patch of space with a faint cluster of lights at the edge of the instruments. Tess turns the couch round before anyone can say what the lights are, and nobody asks her to. Kivo’s wrists are quiet all the way back.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Wide shot of ${couch}, drifting slowly through dark space toward a faint cluster of small warm lights at the far edge of the view. Crouching at the front of the cushions is ${kivo}, one thin wrist raised toward the lights. Cold starlight and a distant warm glow. ${style}`,
      },
      {
        title: 'The Claim',
        setup:
          'The song can be pulled from every station in the Arm by a copyright claim, but the claimant must produce the map, publicly, as the original work. Tess would be known everywhere as the keeper of the harbor, which is exactly what her grandmother told her never to become, and also, she cannot help noticing, famous.',
        options: [
          {
            label: 'Jex records a cover with a new bridge',
            outcome:
              'Jex records a cover of Harbor Lights with a new bridge that goes somewhere else entirely, to a lovely and empty nebula. He is banned from performing, but nobody banned him from recording in a pocket room. The cover is better than the original. Within a month nobody can remember the old bridge.',
            ending: 0,
          },
          {
            label: 'File the claim, without the map',
            outcome:
              'Tess files a claim that describes the map without showing it. The stations reject it within the hour, and the song plays on. Tess reads the rejection twice and says it is the most relieved she has ever been to lose. Kivo says their wrists agree.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a small pocket room padded with quilted blankets on every wall. Seated on a stool before a brass microphone is ${jex}, playing the instrument with his eyes closed. Warm amber lamp light, deep blue shadows in the corners. ${style}`,
      },
      {
        title: 'The Songwriter',
        setup:
          'Kivo traces the song to its writer, a young man who left the harbor two years ago and wrote Harbor Lights in a boarding house because he missed it. He did not know it was a map. He sang the way home, and the way home is a set of coordinates. He would like to know whether he has done something terrible.',
        options: [
          {
            label: 'Ask him to change the bridge',
            outcome:
              'Tess asks him, gently, to change the bridge in anything he records from now on. He agrees at once and asks what to put there. Jex spends an afternoon with him and they write a bridge that goes nowhere, beautifully. He says it sounds like how he feels about home now: still there, and not on the way.',
            ending: 0,
          },
          {
            label: 'Tell him the harbor can decide',
            outcome:
              'Kivo carries a message to the harbor, and the harbor sends one back: let him sing it, because anyone who can follow a song that far has earned the light. Tess is not sure she agrees. On quiet nights she has started to hum the bridge, which is the first time she has said the map aloud.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot in a cramped boarding house room with a narrow bed and a window onto a busy space dock. Sitting on the bed is a young man in a frayed sweater holding a battered guitar. Standing by the window is ${tess}, hands in her jacket pockets, speaking to him. Dim lamp light and blue dock light through the window. ${style}`,
      },
    ],
    endings: [
      {
        title: 'A BRIDGE TO NOWHERE',
        text: 'Harbor Lights is still the most popular song in the Outer Arm, in a version whose bridge leads to an empty nebula. Nobody follows it. The harbor is still unmapped. Jex holds a writing credit for a song he may not perform, and is untroubled. Kivo’s wrists no longer whistle at the radio, and Tess sings along, loudly, now that it is safe.',
        art: ({ tess, couch, style }) =>
          `Medium shot of ${couch}, drifting past a large empty pink and violet nebula. Standing on the cushion is ${tess}, head thrown back, singing, one hand raised. Pink nebula light and scattered stars. ${style}`,
      },
      {
        title: 'THE WAY HOME',
        text: 'Harbor Lights still plays with its original bridge, and every few months a small boat arrives at the harbor, having followed it by ear. The harbor lets them in. Tess has made her peace with keeping a secret that has a chorus. Kivo listens for the boats. Jex has been asked to play at the harbor and, for once, nobody has banned him from it.',
        art: ({ kivo, jex, style }) =>
          `Wide shot of a small harbor of floating wooden piers and warm lamps in a quiet patch of space. A small battered boat drifts toward the nearest pier. Standing on the pier are ${kivo}, one wrist raised toward the boat, and ${jex}, the instrument under one arm. Warm lamp light, black space. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'sora', 'tess'],
    title: 'Diversion',
    premise:
      'The Calder Reach hyperspace lane has been closed for roadworks for thirty-one years. Ships follow the official diversion, which leads them in a very large circle back to the start of the roadworks, where they are told to follow the diversion. Tess has spotted the loop on her charts. Sora suspects the diversion beacons, which are machines and should be asked. Fen has noticed that some ships in the loop have been going round for a long time, and are not tourists.',
    steps: [
      {
        title: 'Follow the Diversion',
        setup:
          'The beacons instruct the couch to follow the yellow route. Tess has a route of her own, straight through the roadworks, which are, as far as the instruments can tell, finished, unattended and very tidy. Leaving the diversion carries a fine of one hundred crowns per cushion.',
        options: [
          {
            label: 'Follow the diversion, to learn it',
            outcome:
              'The couch follows the diversion for a full lap, which takes four days. Tess charts it. Sora counts the beacons. Fen counts the ships and learns the names of several, who wave. At the end of the lap the couch arrives back at the start and is told, politely, to follow the diversion.',
            ending: 0,
          },
          {
            label: 'Tess takes the couch through the works',
            outcome:
              'Tess takes the couch straight through. The roadworks are finished, swept and coned off, with a tea flask on a girder that has been cold for thirty years. An automated camera fines the couch four hundred crowns on the far side. Tess pays, and keeps the receipt.',
            ending: 1,
          },
        ],
        art: ({ tess, Couch, style }) =>
          `Wide shot of a hyperspace lane in deep space crossed by a long line of floating orange traffic cones and a striped barrier. ${Couch}, glides between the cones. Standing on the front cushion is ${tess}, pointing ahead with a navigation disk. A tea flask stands on a steel girder nearby. Blue lane light. ${style}`,
      },
      {
        title: 'Ask the Beacon',
        setup:
          'Sora finds the lead diversion beacon and asks it, two hands on its casing and four on her clipboard, what broke. The beacon is courteous. It was told to divert traffic until it was told the roadworks were complete, and it has not been told. It sends a query to the Roads Authority once a year. Once a year the Authority replies that the query has been received.',
        options: [
          {
            label: 'Write to the Roads Authority',
            outcome:
              'Sora writes to the Roads Authority with six hands, in three copies, enclosing photographs of the cold tea flask. The Authority replies within a week, which it describes as unprecedented, and dispatches an inspector to certify the works complete. The inspector travels by the diversion and is due in four days.',
            ending: 0,
          },
          {
            label: 'Tell the beacon the works are done',
            outcome:
              'Sora tells it the works are done. The beacon asks for her authority, and she shows it her engineering papers. It considers them for an hour, switches off half its lamps, which is as far as it will go without a form, and asks whether she would mind standing beside it for a while, as it has never stopped before.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in deep space beside a tall floating diversion beacon with a ring of yellow lamps. Standing on its narrow platform is ${sora}, two hands resting on its steel casing and four hands holding a clipboard and pencil, her head tilted to listen. Flashing yellow light, black space. ${style}`,
      },
      {
        title: 'The Loop',
        setup:
          'Some of the ships in the loop are not lost. They are families without papers who found that a diversion with no exit is a place nobody checks. Opening the lane will send an inspector down the loop counting hulls. Fen has walked into this before, from the other side.',
        options: [
          {
            label: 'Open the lane, after warning them',
            outcome:
              'For two days before the inspector arrives Fen goes from ship to ship and tells each family what is coming and where the lane leads now. Most leave by the open lane. Some stay. The inspector counts hulls and certifies the works. Fen stands beside him for the count and gives no names.',
            ending: 0,
          },
          {
            label: 'Keep a back road open for them',
            outcome:
              'Tess charts a back road through the roadworks that the beacons do not cover and gives it, on paper, to every family in the loop. Fen marks the turnings with cones from the roadworks, which nobody will move, because they are official. The lane opens, and the back road stays open too, under thirty-one years of traffic cones.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at the open hatch of a small battered ship in black space. Standing in the hatch is ${fen}, talking quietly to a family in patched travel coats crowded inside. A line of other small ships trails away behind in a wide curve under yellow beacon lamps. Warm cabin light, yellow lamps. ${style}`,
      },
    ],
    endings: [
      {
        title: 'LANE REOPENED',
        text: 'The Calder Reach lane reopened after thirty-one years, at a ceremony attended by the Roads Authority, a retired beacon and several families who had been going round in a circle and were, on the whole, ready to stop. Sora gave a speech. Tess keeps the lap charted. Once a year Fen drives the old diversion alone, to check that it is empty.',
        art: ({ sora, style }) =>
          `Wide shot of a reopened hyperspace lane with small ships streaming through under bright blue lane lights. On a floating platform beside the lane stands a group of officials in grey coats and families in travel coats. Speaking at a brass lectern is ${sora}, four hands resting on the lectern. Bright blue light. ${style}`,
      },
      {
        title: 'THE BACK ROAD',
        text: 'There is a road through the old roadworks at Calder Reach that appears on no chart but Tess’s and is marked with traffic cones nobody dares move. Families use it. The beacons look the other way, which Sora arranged with them in a meeting. Fen calls it the best corridor he has never had to defend.',
        art: ({ fen, tess, style }) =>
          `Wide shot of a narrow route through the steel girders of old roadworks in space, marked by a line of orange traffic cones floating in the dark. A small battered ship follows the cones. Standing on a girder are ${tess}, and ${fen}, watching it pass. Cold starlight and orange reflections. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'tess'],
    title: 'Livestock Class',
    premise:
      'The couch’s oxygen garden has been entered in the Greater Belt Agricultural Show by Tess, who filled in the form in a moment of ambition and would like a rosette. Brin did not know until the judges arrived. The garden is a union and has views on being judged. Fen has been asked by the Show to sign for the garden’s security overnight, in the exhibition shed, under the same rules as the prize goats.',
    steps: [
      {
        title: 'Which Class?',
        setup:
          'The schedule offers three classes. Vegetables are judged on size, ornamentals on beauty and livestock on temperament, and the garden, having a voice and a union, would arguably qualify for the last. The steward needs an answer before the bell. Tess wrote Vegetables on the form without asking anyone.',
        options: [
          {
            label: 'Let the garden choose its class',
            outcome:
              'Brin asks the garden. After some rustling it chooses Livestock, on the grounds that it is the only class that judges character. The steward checks the rules, finds no requirement for legs, and moves the garden into a pen between two goats, who make room.',
            ending: 0,
          },
          {
            label: 'Withdraw the entry before the bell',
            outcome:
              'Brin withdraws the entry. Tess apologizes, properly, first to Brin and then to the garden, which Brin says is the right apology in the wrong order. The steward refunds the fee in seed. The garden stays in the shed as a visitor, which it prefers, as visitors are allowed to look at the goats.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Wide shot inside a tall wooden exhibition shed with straw on the floor and rows of pens. In a pen between two white goats, a thick mass of green vines and ferns grows from wooden soil boxes. Kneeling beside it is ${brin}, talking to the leaves, while a steward in a white coat holds a clipboard. Dusty sunlight through high windows. ${style}`,
      },
      {
        title: 'Overnight',
        setup:
          'Under the Show’s rules every exhibit is locked in the shed overnight, under guard, and Fen has signed for it. At midnight a rival exhibitor, a polite old man with a prize marrow, asks to be let in to check on his marrow. Fen’s boots, quiet all evening, announce CHECKPOINT.',
        options: [
          {
            label: 'Fen lets him in, and goes with him',
            outcome:
              'Fen lets him in and walks the length of the shed beside him. The man checks his marrow, then the garden, then the goats, and admits he has not slept the night before a judging in forty years. Fen tells him about night shifts. They talk until the marrow is ready.',
            ending: 0,
          },
          {
            label: 'Fen keeps the shed locked',
            outcome:
              'Fen keeps the shed locked, as he signed to do, and sits outside the door with the man until two, talking. At two the man goes to bed. Fen stays. In the morning the garden has grown a tendril under the door and around his ankle, which Brin says is a thank you and Fen calls a breach of security, gratefully.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot outside the closed door of a wooden exhibition shed at night. Sitting on a wooden bench beside the door is ${fen}, next to an elderly man in a tweed cap who holds a huge green marrow in his lap. A single lamp hangs above the door. Warm lamp light, dark blue night. ${style}`,
      },
      {
        title: 'The Judging',
        setup:
          'The judge is a retired farmer with a stick and a notebook. She inspects the garden at length and then asks Brin a question that is not on the schedule: whether the garden has ever done harm. Brin has an answer. It involves a sacred orchard on a world she still dreams about, and it does not help her case. Tess is standing beside her, very much wanting a rosette.',
        options: [
          {
            label: 'Brin tells the judge the truth',
            outcome:
              'Brin tells her about the orchard, plainly, without excuses. The judge writes for a long time. She awards the garden Best in Show, and her notes, read aloud, say that in fifty years of judging this is the first exhibit that told her what it cost. Tess is handed the rosette and gives it to Brin, who pins it to the garden.',
            ending: 0,
          },
          {
            label: 'Tess answers for her',
            outcome:
              'Tess answers for her: never, it is a very good garden. Brin corrects her in front of the judge and withdraws the garden from the class. Tess goes red, then very quiet. The judge thanks Brin, and tells Tess, kindly, that a rosette is worth exactly what was said to get it.',
            ending: 1,
          },
        ],
        art: ({ tess, brin, style }) =>
          `Medium shot in a wooden exhibition shed beside a pen full of green vines and ferns. An elderly judge in a waxed jacket leans on a walking stick and holds a small notebook. Standing before her are ${brin}, speaking with her hands open, and ${tess}, holding her breath. Dusty golden sunlight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'BEST IN SHOW, LIVESTOCK',
        text: 'The oxygen garden was Best in Show at the Greater Belt Agricultural Show, in Livestock, for character. The rosette hangs from its largest vine. Tess filled in next year’s form with the garden’s mark on it, and asked first. Fen is a steward now at every show the couch passes, and lets anyone in to check on their marrow.',
        art: ({ couch, style }) =>
          `Close-up behind the backrest of ${couch}, where a large red rosette with long ribbons is pinned to a thick green vine among ferns and small white flowers. Black space and stars beyond the bubble, soft green and warm lamp light. ${style}`,
      },
      {
        title: 'NOT FOR JUDGING',
        text: 'The oxygen garden has withdrawn from competition and says so in its minutes. Tess has stopped entering other people’s things in contests. She entered herself, once, in the navigation trials at the same Show, came fourth and was very pleased, because it was hers. Fen still has a tendril round his ankle and has not asked Brin to remove it.',
        art: ({ fen, tess, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on one cushion is ${fen}, looking down at a thin green tendril wound loosely around his ankle. Beside him sits ${tess}, holding a small white fourth-place ribbon. Warm amber lamp light, black space behind. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'mox', 'rue'],
    title: 'Definitions Update',
    premise:
      'The Galactic Registry has pushed a mandatory update to the Common Legal Dictionary. Most of it is harmless: new spellings, a revised definition of afternoon. Rue has read the rest. Under the update, passenger will mean a being in possession of a birth record, which Mox has never had, and anyone aboard a vessel who is neither passenger nor crew will be cargo. Fen has seen an update like this before. It arrived at noon and took effect at midnight.',
    steps: [
      {
        title: 'Install Now or Later',
        setup:
          'The update offers two buttons, Install Now and Remind Me Later. Remind Me Later may be pressed nine times, after which the update installs itself. Rue would like to use all nine. Mox would like to read the update first, all of it, including the appendix nobody reads, which Rue says is where these things always are.',
        options: [
          {
            label: 'Press Remind Me Later',
            outcome:
              'Rue presses Remind Me Later, presses it again every ninety days and keeps a tally on the backrest. On the eighth press Rue notices that the counter resets whenever the dictionary is closed and reopened, and has been closing and reopening it ever since.',
            ending: 0,
          },
          {
            label: 'Mox reads the whole update',
            outcome:
              'Mox reads the whole update in four hours, appendix included. In the ninth paragraph of the appendix it finds that birth record is not defined either, and that under the update nobody born before the update has one. Rue laughs for the first time in a month. Read closely, the update makes cargo of everyone.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated with a large open bound dictionary across their knees is ${rue}, pressing one finger on a small brass push-button set into the armrest. A sheet of paper with rows of small ink tally marks hangs on the backrest behind them. Warm lamp light, black space beyond. ${style}`,
      },
      {
        title: 'Precedent',
        setup:
          'Fen still carries the old border update in his memory, word for word: it changed shelter seeker to trespasser in one line and left everything else alone. He knows who enforced it. Rue knows who made it possible, because the ambiguous phrase that let the line through was Rue’s, written years ago, in a different treaty, in good faith.',
        options: [
          {
            label: 'Rue drafts a notarized apology, privately',
            outcome:
              'Rue drafts a notarized apology to the families Fen turned away, and Fen countersigns it. It is not published. One copy is posted to each family whose name Fen still remembers. Some write back. Rue keeps the replies sewn into their collar among the amendment slips.',
            ending: 0,
          },
          {
            label: 'Fen and Rue say so publicly',
            outcome:
              'They file a joint statement with the Registry: one man who enforced the last update and one lawyer who drafted the phrase that allowed it. The statement is two paragraphs long. It is published as a comment on the update, four million people read it, and the comments beneath it, for once, are quiet.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at a small round table in a warm pocket room. Seated at the table is ${fen}, writing his name at the foot of a single sheet of paper with a fountain pen. A pair of thin angular glasses lies folded on the table beside a small wooden gavel. Warm lamp light from above. ${style}`,
      },
      {
        title: 'Consent to Update',
        setup:
          'The Registry, being careful, has sent Mox a personal form. Before reclassification each affected being must confirm that they have been informed, with a signature. Mox’s earliest memory is of signing its own deletion order under duress. The form is polite and short, and the box for the signature is in exactly the place that order had one.',
        options: [
          {
            label: 'Mox returns the form unsigned',
            outcome:
              'Mox returns the form blank. Under the Registry’s rules an unsigned form must be sent again after ninety days. Rue points out that this is, in effect, a Remind Me Later button, and that Mox has an unlimited supply. Mox has sent it back nine times and keeps the forms in a drawer, in order.',
            ending: 0,
          },
          {
            label: 'Mox writes I OBJECT in the box',
            outcome:
              'Mox writes I OBJECT in the box, in the handwriting it chose for its badge. The Registry has no procedure for an objection in a signature box, so it treats the objection as the signature, which makes it valid. Mox’s objection is now on file, legally binding, and has been cited twice.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up at a small writing desk under a brass lamp. Seated at the desk is ${mox}, holding a pen above a short one-page form, both eyes fixed on an empty box at the foot of the page. Warm lamp light, a dark room behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'REMIND ME LATER',
        text: 'The update to the Common Legal Dictionary has never installed on the couch. Rue reopens the dictionary every ninety days, and Mox returns its form unsigned on the same schedule. Fen keeps the tally. It is the longest delay in the Registry’s history and is formally an ongoing administrative error, which Rue intends to keep ongoing for as long as there is a couch.',
        art: ({ mox, rue, style }) =>
          `Medium shot in a small warm pocket room. Standing at an open wooden drawer is ${mox}, laying a one-page form on top of a neat stack of identical forms. Watching from the doorway is ${rue}, holding a cup of tea. Warm lamp light. ${style}`,
      },
      {
        title: 'ROLLED BACK',
        text: 'The update was withdrawn after a public comment from a former border guard and the lawyer who wrote the phrase that made his worst day possible, and after an objection from an android that the Registry counted as a signature. The dictionary now defines passenger as anyone aboard. Fen says it is the only update he has ever been glad to see installed.',
        art: ({ fen, couch, style }) =>
          `Wide shot of ${couch}, drifting past a vast white space station covered in tall windows. Lying back on the cushions with his boots up on the armrest is ${fen}, reading a thick new bound dictionary propped on his chest. Soft white station light, black space. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'rue', 'sora'],
    title: 'Allowable Expenses',
    premise:
      'The Revenue of the Outer Arm has decided that a couch carrying passengers is a business, and has sent it its first tax return. Rue has agreed to prepare it, a tax return being a treaty with the state that only one side has read. Sora keeps the receipts, in six hands. Omi has found itself on the draft, on page four, under fixtures and fittings.',
    steps: [
      {
        title: 'Fixtures and Fittings',
        setup:
          'The Revenue’s guidance lists Omi as decorative brassware, depreciating at ten percent a year, which would save the couch a good deal of money. The alternative is to list Omi as crew, with a salary the couch has never paid and a tax on it the couch cannot afford. Omi has been asked which it would prefer, and has rung nothing for an hour.',
        options: [
          {
            label: 'List Omi as crew, and pay',
            outcome:
              'Rue lists Omi as crew at a salary of six bells a week, backdated. The tax on it is ruinous. Sora pays it from the repair budget with four hands and rubs her eyes with the other two. Omi, informed that it is now a taxpayer, rings a note nobody has heard before, which Sora translates, roughly, as dignity.',
            ending: 0,
          },
          {
            label: 'File nothing until Omi has chosen',
            outcome:
              'Rue files nothing and waits. At the end of the hour Omi rings the small gong once at the words decorative brassware, and at the word crew rings nothing at all. Rue records this as a position: not property, and not employed. The Revenue has no box for it. Rue draws one.',
            ending: 1,
          },
        ],
        art: ({ omi, rue, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions covered with spread paper forms. Seated with a pen over one form is ${rue}. Standing on the next cushion is ${omi}, its tuning rod lowered, looking down at the papers. Warm amber lamp light, black space beyond the bubble. ${style}`,
      },
      {
        title: 'The Board',
        setup:
          'Sora’s six elbows hold their engineering meetings during her working hours, which makes them, on Rue’s reading of the guidance, a board, and a board’s expenses are deductible: the lamp they meet under, the tea and the small brass bell that closes each session. Sora says her elbows are not a board. Her elbows convene and vote that they are.',
        options: [
          {
            label: 'Claim the board’s expenses',
            outcome:
              'Rue claims one lamp, forty cups of tea and a bell. The Revenue asks for minutes of the board’s meetings. Sora supplies them, written with six hands at once, and the Revenue’s clerk asks to keep a copy for herself, as they are the clearest minutes she has ever been sent.',
            ending: 0,
          },
          {
            label: 'Claim nothing for the elbows',
            outcome:
              'Sora overrules her elbows five to one, the one being the elbow that wanted the tea. Rue claims nothing, and the return is a page shorter. The elbows file a dissent, which Rue, who believes in dissent, staples to the back of the return, where it is technically part of it.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a small warm pocket room. Seated at a round table under a brass lamp is ${sora}, her six elbows resting on the table in a ring around a teapot, a stack of small cups and a brass hand bell. A neat pile of handwritten paper sits under one hand. Warm lamp light. ${style}`,
      },
      {
        title: 'The Calculating Machine',
        setup:
          'The Revenue sends an inspector, a tired man with a calculating machine that has flagged the couch’s return eleven times. Sora asks the machine, as is her rule, what is wrong. It says nothing is wrong. It has been told to flag anything unusual, it has never seen a return like this one, and it would like, if possible, to see the couch.',
        options: [
          {
            label: 'Show the machine the couch',
            outcome:
              'Sora carries the calculating machine aboard and sets it on a cushion. Rue walks it through the return line by line while Omi rings a soft bell at each entry. The machine stops flagging. The inspector closes the file as reviewed and correct, and asks whether the machine may visit again next year.',
            ending: 0,
          },
          {
            label: 'Change the machine’s instructions',
            outcome:
              'Rue asks the inspector to amend his machine’s instructions so that unusual is no longer a reason. He says he cannot. Sora shows him how, with two hands, while the other four hold the machine still. It stops flagging everything, including, the inspector finds over the following month, him.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Medium shot of ${couch}. On the middle cushion sits a small brass calculating machine with rows of round keys and a paper roll. Kneeling beside it is ${sora}, two hands resting on its casing and her head tilted to listen. A tired man in a grey raincoat stands on a floating platform beside the couch. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'RETURN ACCEPTED',
        text: 'The couch files a tax return every year, prepared by Rue, receipted by Sora and listing Omi as crew at six bells a week. It costs more than any other way of doing it. The Revenue’s clerk keeps the board minutes as a model. Omi pays its tax on time, in person, by ringing once at the counter, which the Revenue accepts as a signature.',
        art: ({ omi, style }) =>
          `Medium shot at a long wooden counter in a busy revenue office. Standing on the counter is ${omi}, holding a tuning rod against one bell, while a clerk in a grey cardigan stamps a paper form. A queue of people of many species waits behind. Flat white light. ${style}`,
      },
      {
        title: 'A BOX OF ITS OWN',
        text: 'The couch’s return carries a box Rue drew by hand, for a member of a vessel who is neither property nor employed, and the Revenue has since printed it on every return in the Outer Arm. Eleven thousand people use it. Omi was the first to tick it. Sora’s elbows are still not a board, and are still filing dissents.',
        art: ({ rue, style }) =>
          `Close-up at a wooden desk under a brass lamp. Seated at the desk is ${rue}, drawing a small square onto a printed form with a ruler and a fountain pen. Warm lamp light from the left, dark shelves behind. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'omi', 'rue'],
    title: 'Without Prejudice',
    premise:
      'The monks of Ilen Vale have agreed, after three years, to receive Brin’s formal apology for the oxygen garden that spread into their sacred orchard. Rue has drafted it. Rue’s apologies are notarized and carry a footnote saying they are without prejudice, which means they admit nothing. The ceremony requires two minutes’ silence and a bell. Omi, whose warning once interrupted a memorial, has been asked to be the bell.',
    steps: [
      {
        title: 'The Footnote',
        setup:
          'The apology is beautifully written. Brin reads it twice and finds that without the footnote it says she did it, and with the footnote it says that someone may have. Rue explains that the footnote protects her from a claim. Brin explains that the orchard is the claim.',
        options: [
          {
            label: 'Strike the footnote',
            outcome:
              'Rue strikes the footnote and notarizes the striking. Their grandmother-gavel, which has opinions, raps once on the table, which Rue says is either approval or a warning about liability, and in their family has always been both. Brin reads the new version and says it is shorter, and heavier.',
            ending: 0,
          },
          {
            label: 'Keep the footnote, and explain it',
            outcome:
              'Rue keeps the footnote and adds a second one explaining the first, in plain words: this means I am afraid of what you might ask for. Brin says it is the most honest footnote she has ever read. The monks, reading it later, agree, and ask what she is afraid of.',
            ending: 1,
          },
        ],
        art: ({ rue, brin, style }) =>
          `Medium shot at a rough wooden table in an orchard of old gnarled apple trees. Seated at the table is ${rue}, holding a fountain pen above a single handwritten sheet of paper. Standing across from them is ${brin}, reading the sheet with one finger on a line near the bottom. Dappled morning sunlight. ${style}`,
      },
      {
        title: 'Two Minutes',
        setup:
          'The ceremony opens with two minutes’ silence in the orchard, ended by a bell. A monk with a stopwatch has told Omi when to ring. At one minute forty Omi hears, in the roots, that the garden’s mycelium is still spreading under the orchard wall, now, during the silence, toward the oldest tree.',
        options: [
          {
            label: 'Omi rings the warning at once',
            outcome:
              'Omi rings the warning twenty seconds early, into the silence. The monks look up. Brin is already running. She finds the threads at the foot of the oldest tree and draws them back with her hands while the monks watch. Omi says afterward that the silence was the right length, and the bell was three years late.',
            ending: 0,
          },
          {
            label: 'Omi waits, and rings on time',
            outcome:
              'Omi waits out the twenty seconds and rings exactly on time. Then, before anyone moves, it rings the warning, so that the warning is not part of the memorial but the first thing after it. The monks and Brin go together to the oldest tree, find the threads and decide together what to do about them.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Wide shot of an old orchard of gnarled apple trees inside a low stone wall, where monks in grey robes stand in a silent circle with their heads bowed. Standing on a flat stone at the center is ${omi}, holding a long thin tuning rod against one bell. Fine white threads of mycelium show in the soil at the foot of the largest tree. Soft grey morning light. ${style}`,
      },
      {
        title: 'Reparations',
        setup:
          'The monks have one request: that the garden leave the orchard. Brin can draw it out entirely, which will take a year and kill a good part of it. The abbot then offers a second way, which he has plainly been thinking about for three years: that the garden stay, under the monks’ direction, and learn the orchard’s rules.',
        options: [
          {
            label: 'Withdraw the garden entirely',
            outcome:
              'Brin draws the garden out of the orchard over a year, root by root. A third of it dies. She does not call it a clean success, and the monks do not ask her to. Rue writes the settlement with no footnotes, and the monks put their names to it under the oldest tree, which is recovering.',
            ending: 0,
          },
          {
            label: 'Let the garden stay under the monks’ rules',
            outcome:
              'The garden stays under the monks’ rules, which are mostly about silence and about when not to grow. It learns slowly. Brin visits every season to check. The abbot has started asking the garden questions at morning prayer, and Omi, invited to ring at the end, rings when it is asked.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Close-up at the foot of a huge gnarled apple tree in an orchard. Kneeling in the grass is ${brin}, gently drawing fine white threads of mycelium out of the soil with both hands. An old abbot in a grey robe stands beside her with his hands folded. Soft green morning light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'WITH PREJUDICE',
        text: 'The orchard of Ilen Vale belongs to the monks again, and the garden that spread into it was withdrawn at a cost Brin wrote down in full and put her name to. Rue no longer puts footnotes on apologies, and says it has cost them two clients and made them a better lawyer. Omi rings at the orchard’s memorial every year, on time, and once, early, on purpose.',
        art: ({ omi, style }) =>
          `Wide shot of an old orchard of gnarled apple trees in spring blossom inside a low stone wall, with a bare strip of freshly turned earth along one side. Monks in grey robes stand among the trees. Standing on a flat stone is ${omi}, ringing one bell. Soft pink blossom light. ${style}`,
      },
      {
        title: 'GRAFTED',
        text: 'The garden and the orchard at Ilen Vale are no longer easy to tell apart. The monks tend both, the garden keeps the orchard’s silences, and the oldest tree has a white thread of mycelium in its bark that the abbot calls a novice. Brin says it is not a clean success. Rue has written that into the settlement, as a term.',
        art: ({ rue, style }) =>
          `Medium shot under a huge gnarled apple tree whose bark carries fine white threads of mycelium and small green fern fronds. An old abbot in a grey robe rests his palm against the bark. Standing beside him is ${rue}, reading aloud from a single sheet of paper. Dappled sunlight. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'jex', 'mox'],
    title: 'Grade One',
    premise:
      'Mox would like to learn an instrument. It decided this itself, which is new, and has chosen the Grade One examination of the Associated Board of Musical Examiners as proof, which is also new. Jex is the only musician aboard and is banned from performing, which may or may not include teaching. Fen has offered to keep time. His boots already do, unasked, whenever they announce CHECKPOINT.',
    steps: [
      {
        title: 'Choosing',
        setup:
          'Jex offers his own instrument, which he has played for thirty years and which Mox could learn properly. Mox has instead been looking at a cheap tin whistle in a dockside shop window. It says it likes the look of it. Jex says a tin whistle is not an instrument but an opinion.',
        options: [
          {
            label: 'Mox takes Jex’s instrument',
            outcome:
              'Mox takes the instrument and holds it wrong for a week, carefully, while Jex watches without correcting it. In the second week Jex corrects it once. Mox says it had been waiting for that, and that the waiting was the first thing about music it enjoyed.',
            ending: 0,
          },
          {
            label: 'Mox buys the tin whistle',
            outcome:
              'Mox buys the tin whistle with its own money, the first thing it has ever bought for no reason. It plays three notes badly and is delighted. Jex, who has never in his life played anything for no reason, listens with what Fen describes as the face of a man watching someone else eat his dinner and enjoy it.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot outside a small dockside shop with a lit window full of brass and wooden instruments. Standing at the window is ${mox}, one hand pressed flat on the glass, looking at a small tin whistle on a velvet stand in the display. Warm shop light, cool blue dock light behind. ${style}`,
      },
      {
        title: 'The Authorized Teacher',
        setup:
          'The Board requires a letter from an authorized teacher. Jex is qualified. His two bans forbid him to perform music in public or in any manner likely to be heard, and teaching Mox on a couch inside a bubble is likely to be heard. Fen has read the bans and says they were written by someone who never had to enforce them.',
        options: [
          {
            label: 'Fen enforces the ban, his way',
            outcome:
              'Fen rules, as the only former enforcement officer aboard, that a lesson in a pocket room with the door shut is not public, and stands outside the door for every lesson to make sure. His boots announce CHECKPOINT on the beat. Jex starts writing exercises in time with them.',
            ending: 0,
          },
          {
            label: 'Jex teaches without playing a note',
            outcome:
              'Jex teaches by talking and listening and never plays a note himself. It is slower. Mox learns by being listened to very closely by a man who knows what listening costs. After a month Fen says it is the most careful thing he has ever seen two people do with a whistle.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot in a narrow warm passage behind a scarlet velvet backrest, beside a closed wooden door with brass hinges. Standing guard beside the door with his arms folded is ${fen}, tapping one heavy boot on the floorboards. Warm amber lamp light from above. ${style}`,
      },
      {
        title: 'The Examination',
        setup:
          'The examiner is a stern woman with a pencil who has heard ten thousand Grade Ones. Mox could play its pieces perfectly, being an android, and would then be suspected of playing back a recording. Or it could play them as it actually plays them, which includes a wrong note in the second piece that it has grown attached to.',
        options: [
          {
            label: 'Mox plays exactly as it plays',
            outcome:
              'Mox plays the pieces as it plays them, wrong note included, and afterward looks at the examiner in a way that makes clear the note was intended. She writes for some time. Mox passes with merit. Her comment on the second piece reads: an interpretive choice, defended.',
            ending: 0,
          },
          {
            label: 'Mox declines to be examined',
            outcome:
              'Mox plays its three pieces for the examiner and then informs her that it has decided not to be examined after all. It wanted to play for her. It does not want a grade. The examiner puts down her pencil and asks it to play the second piece again.',
            ending: 1,
          },
        ],
        art: ({ mox, jex, style }) =>
          `Medium shot in a quiet examination room with an upright piano, a music stand and a small desk. Seated at the desk is a stern grey-haired woman holding a pencil. Standing at the music stand is ${mox}, playing a small tin whistle. Seated against the back wall is ${jex}, leaning forward to listen. Pale afternoon light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PASS WITH MERIT',
        text: 'Mox passed Grade One with merit and keeps the certificate behind its chest plates. It practices every evening in a pocket room while Fen stands outside the door and his boots keep time. Jex has entered it for Grade Two. He has also, after nine years, started playing scales again behind a closed door, where the bans say he cannot be heard, and where Mox can.',
        art: ({ jex, style }) =>
          `Medium shot in a small warm pocket room with its door closed. Seated on a velvet stool is ${jex}, playing a slow scale on the instrument with his eyes closed. A small tin whistle lies on a shelf beside him. Warm lamp light, soft shadows. ${style}`,
      },
      {
        title: 'UNGRADED',
        text: 'Mox plays a tin whistle, badly and on purpose, for an audience of whoever is on the couch. It has never been graded and has declined three invitations to be. Jex has never played for it, and listens to it most nights. Fen has learned the wrong note and hums it on watch, and his boots now announce CHECKPOINT in the same key.',
        art: ({ mox, fen, couch, style }) =>
          `Medium shot of ${couch}. Standing on the middle cushion is ${mox}, playing a small tin whistle. Sitting on the armrest is ${fen}, humming with his eyes half closed. Black space and stars beyond the bubble, warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'kivo', 'mox'],
    title: 'Next of Kin',
    premise:
      'Kivo’s passport has expired, and the renewal form requires a next of kin. The only kin Kivo has is a sibling who has not been seen for four years. Mox has never had a passport and would like one, and the same office requires a photograph with a neutral expression and both eyes alike. Fen has stood on the other side of a great many passport counters, and has offered to stand on this side of one.',
    steps: [
      {
        title: 'The Empty Box',
        setup:
          'The box for next of kin cannot be left blank. Kivo could write the sibling’s last known address, which would put that address into a government system on the strength of a hope. Or Kivo could leave it blank and argue. Fen and Mox are both sitting very close, both looking carefully at nothing.',
        options: [
          {
            label: 'Write the sibling’s last address',
            outcome:
              'Kivo writes the address. Their wrists whistle at the pen. The clerk enters it and says, kindly, that next of kin are notified of renewals, so the system will now write to the sibling. Kivo had not known that. They sit with it. The notification goes out at the end of the day.',
            ending: 0,
          },
          {
            label: 'Leave the box blank and argue',
            outcome:
              'Kivo leaves it blank. The clerk returns the form, and Kivo hands it back. On the fourth return Fen asks the clerk what happens to forms that cannot be completed, and the clerk shows them a cupboard. It is full. Fen, who has never looked into one of these cupboards from this side, asks for a moment.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot at a long grey government counter in a busy passport office. Seated on a stool at the counter is ${kivo}, holding a pen above a paper form, one thin wrist raised. A clerk in a grey cardigan waits behind the glass screen. Flat white overhead light. ${style}`,
      },
      {
        title: 'Neutral Expression',
        setup:
          'Mox’s photograph has been rejected twice. The rules require both eyes open and alike, and Mox has one blue lid and one orange, chosen by itself on the first morning it chose anything. The clerk suggests matching lids for the photograph only. They are only lids. Mox has gone very still.',
        options: [
          {
            label: 'Fen asks for the exception form',
            outcome:
              'Fen asks for the exception form, which he knows exists because he once refused to issue it. It is found in a drawer. It permits a photograph that departs from the rules for reasons of identity. Mox fills it in. The photograph is taken, and Mox, not smiling, as required, looks exactly like itself.',
            ending: 0,
          },
          {
            label: 'Mox refuses the photograph',
            outcome:
              'Mox declines to be photographed with matching lids and says so in the measured voice it uses when it is very angry. The clerk apologizes and says she has no other photograph to offer. Fen takes an old white travel pass out of his jacket and looks at it for a long time.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot inside a small white photograph booth with a grey curtain drawn back. Seated on the stool is ${mox}, facing the lens with a perfectly still face and its hands on its knees. A bright flash lamp glows above the lens. Flat white light. ${style}`,
      },
      {
        title: 'The White Pass',
        setup:
          'The office closes at five. Fen still carries an old white travel pass from the border service, blank and never used, which he has kept for eleven years without saying why. Under the law of four systems a corridor pass written by a former officer for a person in transit is valid travel. In every other system it is a piece of paper.',
        options: [
          {
            label: 'Wait for the official papers',
            outcome:
              'They wait. The papers come through in a week: Kivo’s passport with a next of kin, and Mox’s first passport, with an exception attached. Fen puts the white pass back in his jacket. He says it is good to see the system work, once, and that he will keep the pass for the next time it does not.',
            ending: 0,
          },
          {
            label: 'Fen writes the white pass',
            outcome:
              'Fen writes the white pass at the counter, in a border guard’s block capitals, for both of them on one sheet. It is valid in four systems. Mox reads it twice and says it is the first identity document it has ever had that was written by someone who knew it. Kivo carries it beside their sibling’s unopened letter.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up on a grey government counter lit by a single desk lamp. Leaning over a small white paper pass is ${fen}, writing on it with a fountain pen. The office behind him is dark and empty, with chairs stacked upside down on the tables. Warm lamp light, cold shadows. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ISSUED WITH AN EXCEPTION',
        text: 'Kivo’s passport names a next of kin who has been notified and has not replied, and Kivo has decided that this counts as a kind of address. Mox’s passport carries an exception for reasons of identity and a photograph with one blue lid and one orange. Fen keeps the white pass blank in his jacket, for whoever needs it next.',
        art: ({ kivo, mox, style }) =>
          `Medium shot on a busy station platform. Standing side by side are ${kivo}, and ${mox}, each holding a small dark-blue passport open toward a uniformed officer. Soft blue platform light, a line of small shuttles behind. ${style}`,
      },
      {
        title: 'CORRIDOR PASS',
        text: 'Kivo and Mox travel on a single white corridor pass written by a retired border guard. It is valid in four systems and accepted in eleven, because the officials who see it recognize the handwriting of their own profession and wave it through. Fen has started a register of the passes he writes. It has two names in it, and room.',
        art: ({ fen, couch, style }) =>
          `Medium shot of ${couch}. Seated on the end cushion is ${fen}, writing in a small leather notebook with a pencil, an old white travel pass tucked between its pages. Black space and stars beyond the bubble, warm amber lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'jex', 'sora'],
    title: 'Yield',
    premise:
      'The couch’s insurer has engaged a productivity consultancy to raise the oxygen garden’s output by twelve percent. The consultant, a brisk woman named Fallow with a laser pointer, recommends piped music, and Jex has been asked to compose it. The garden, which is unionized, objects to being played at. Sora has been asked to measure the result, and is the only person aboard Fallow has not yet tried to optimize.',
    steps: [
      {
        title: 'The Study',
        setup:
          'Fallow cites a study showing that plants exposed to music grow faster. Sora reads it and finds it was conducted on eleven radishes by a radio station. Brin finds that the radishes were not consulted. Jex finds that the music was one of his own anthems, uncredited, which explains why the radishes in the second week grew in formation.',
        options: [
          {
            label: 'Run a proper trial, with consent',
            outcome:
              'Sora designs a proper trial with controls, a schedule and a consent form for the garden, which Brin reads aloud to it leaf by leaf. Half the garden opts in. The other half opts out and grows noticeably faster out of spite, which Sora records as a confounding variable and Fallow records as a result.',
            ending: 0,
          },
          {
            label: 'Reject the study outright',
            outcome:
              'Sora rejects the study in a memo with six signatures, one per hand. Fallow says the memo has not been benchmarked. Brin says neither has the garden. The garden, overhearing, closes four hundred leaves at once, which in the garden’s language is a walkout.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot behind a scarlet velvet backrest among thick green vines and ferns. Standing in the plants is ${sora}, holding a thin stapled report up to a lamp with two hands, pointing at a page with a third and holding a magnifying glass with a fourth, two hands resting on her hips. A brisk woman in a grey suit aims a red laser pointer at the leaves. Warm lamp light. ${style}`,
      },
      {
        title: 'Music for Gardens',
        setup:
          'Jex has to write something. He has spent nine years learning to listen to people who hate his music, and he applies the method: he sits in the garden for a week, plays nothing and listens. Brin says no musician has ever listened to the garden before. Fallow says she needs a track listing by Friday.',
        options: [
          {
            label: 'Jex writes what he heard',
            outcome:
              'Jex writes down what the garden sounds like at night, when the lamps go off: a slow rustle, a drip, a very small creak. He scores it for one string. When he plays it back the garden goes still, then opens. Sora’s instruments show oxygen output up eleven percent. Fallow asks for one percent more. Jex declines.',
            ending: 0,
          },
          {
            label: 'Jex writes nothing',
            outcome:
              'Jex delivers his track listing on Friday. It is one track, called Garden, eleven hours long, and it is silence. Fallow plays it through the speakers. The garden has its first eleven quiet hours since the speakers went in and grows, Sora reports, normally, which is all it was ever asked to do before.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot at night behind a scarlet velvet backrest, among thick green vines and ferns under dimmed lamps. Sitting on an upturned flowerpot is ${jex}, the instrument resting silent across his knees, his head tilted toward the leaves to listen. Soft dark-green light from a single dim lamp. ${style}`,
      },
      {
        title: 'The Report',
        setup:
          'Sora must write the final report for the insurer. Her six elbows have convened. Three want to report the numbers. Three want to report that the numbers are the wrong question. The insurer’s template has a box for numbers and none for questions, and Fallow has already drafted the conclusion.',
        options: [
          {
            label: 'Report the numbers, with a footnote',
            outcome:
              'Sora reports the numbers exactly: an eleven percent increase, from music written by listening. In a footnote she notes that the method has never been tried on people. The insurer reads the footnote, tries the method on its claims department and gets eleven percent there too.',
            ending: 0,
          },
          {
            label: 'Write the question in the numbers box',
            outcome:
              'Sora writes the question into the numbers box, very small: who is this oxygen for? The insurer has no procedure for a question in a numbers box and closes the file as inconclusive. The consultancy bills for the study. Brin pays in compost, which the consultancy accepts as an output.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Close-up at a small writing desk in a pocket room. Seated at the desk is ${sora}, all six hands busy: two holding a pen over a printed form, two holding a wooden ruler, and two raised with the fingers spread. Green vines curl over the edge of the desk. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ELEVEN PERCENT, BY EAR',
        text: 'The oxygen garden produces eleven percent more air than it did, to music written by listening to it, and the insurer has cut the couch’s premium by a sum Sora calls insulting and Brin calls rent. Jex’s piece is played in three greenhouses and a claims department. Fallow sends the garden a greeting on its anniversary, which it eats.',
        art: ({ brin, couch, style }) =>
          `Close-up behind the backrest of ${couch}, where dense green vines and ferns grow thick and bright beneath small round brass speakers. Standing among the plants is ${brin}, breathing in deeply with her eyes closed. Soft green light and warm lamp light. ${style}`,
      },
      {
        title: 'UNOPTIMIZED',
        text: 'The oxygen garden is unoptimized and produces exactly as much air as the crew need, which Sora has confirmed and Brin says is the correct amount. The speakers have been taken out. Some evenings Jex sits in the garden and plays nothing, and the garden, Brin reports, has started saving its quietest rustle for him.',
        art: ({ brin, jex, style }) =>
          `Medium shot behind a scarlet velvet backrest among green vines and ferns in evening lamp light. Sitting on an upturned flowerpot is ${jex}, the instrument resting across his knees, and kneeling among the leaves beside him is ${brin}, one finger raised to her lips. Soft green light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'jex', 'taal'],
    title: 'Naturalization',
    premise:
      'The neutral world of Verrin offers citizenship to anyone who has lost a country, provided they pass the test and take the oath. Taal’s home assembly was destroyed by a forged vote. Fen gave back his country’s uniform and says the rest went with it. Jex still has two countries, both of which have banned him, and would like to belong somewhere he is not banned. He has also, it turns out, written Verrin’s anthem.',
    steps: [
      {
        title: 'Question Thirty-One',
        setup:
          'The citizenship test has forty questions. Question thirty-one asks the candidate to write out the third verse of the national anthem. Jex wrote it nineteen years ago, on commission. Under his bans he may not perform it. Writing it from memory on a test paper may count as performing it, depending on the handwriting.',
        options: [
          {
            label: 'Jex writes the verse out',
            outcome:
              'Jex writes out the third verse in a very plain hand, without expression. The examiner marks it wrong: it has been officially amended since, and nobody told Jex. He reads the new verse, says it is better and asks who wrote it. The examiner says a committee. Jex says that explains the rhyme.',
            ending: 0,
          },
          {
            label: 'Jex leaves question thirty-one blank',
            outcome:
              'Jex leaves it blank and passes on the other thirty-nine. The examiner notes the gap and asks why. Jex tells her. She looks at him for a while, then puts his paper on a separate pile, which she says is for people who have already had too much to do with the country.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a bright public examination hall with rows of small wooden desks. Seated at a desk is ${jex}, holding a pencil above a printed sheet of questions, his eyes closed. Other candidates in travel coats bend over their papers around him. Pale daylight from tall windows. ${style}`,
      },
      {
        title: 'The Oath',
        setup:
          'The oath must be spoken aloud. Taal speaks in words when he has to and in temperature when he means it. He can swear in words. Or he can swear in temperature, which no Verrin official can read and which would be, to Taal, the only oath that counts. Fen, who has taken one oath in his life and broken it, waits behind him in the line.',
        options: [
          {
            label: 'Taal swears in words',
            outcome:
              'Taal swears in words, carefully, in the official form. The hall drops three degrees on the last line. The registrar notices the cold, and Fen, who knows Taal well enough by now, tells her it is a clause. She asks what it says. Taal says he will dissent when he must, and she adds it to his certificate, under the oath.',
            ending: 0,
          },
          {
            label: 'Taal swears in temperature',
            outcome:
              'Taal swears in temperature. The hall warms by one degree and holds it. The registrar does not know what has happened and asks him to say it in words, and he does, afterward, as a translation. Fen, next in line, swears in words only, and says he has learned what his are worth and would like them to be worth more.',
            ending: 1,
          },
        ],
        art: ({ taal, fen, style }) =>
          `Medium shot in a tall stone civic hall. Standing before a registrar at a carved wooden lectern is ${taal}, one webbed hand raised, a faint warm shimmer rising from his shoulders. Waiting behind him in line is ${fen}, hands clasped in front of him. Warm golden light from high windows. ${style}`,
      },
      {
        title: 'The Ceremony',
        setup:
          'At the ceremony the new citizens stand while the Verrin Civic Band plays the anthem. The band is short a string player. The bandmaster, who has heard who is in the room, asks Jex whether he would sit in. Fen points out that this would be performing the anthem in public, which is the one thing both of Jex’s bans agree on.',
        options: [
          {
            label: 'Jex sits in with the band',
            outcome:
              'Jex sits in, in the second row, on a borrowed instrument, and plays his own anthem, quietly, as a citizen of the country that owns it. Both governments that banned him issue statements. Verrin, asked to respond, says he was playing in the band, and the band is a public service.',
            ending: 0,
          },
          {
            label: 'Jex stands with the new citizens',
            outcome:
              'Jex declines and stands with the new citizens. When the band plays the third verse he sings it under his breath, the amended version, which is not his. Taal, beside him, lowers the temperature three degrees for exactly the length of the verse. Fen does not sing, and stands to attention, for the first time in eleven years, for something he chose.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Wide shot of a ceremony in a tall stone hall, where a brass band in green uniforms plays on a low stage. In the second row of the band sits ${jex}, playing the instrument quietly. New citizens in travel coats stand in rows facing the stage. Warm golden light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CITIZENS OF VERRIN',
        text: 'Jex, Taal and Fen are citizens of Verrin, with certificates that say so and, in Taal’s case, a clause about dissent. Once a year Jex plays in the Verrin Civic Band, second row, on a borrowed instrument. Fen has a passport in his own name for the first time since he resigned, and keeps it on the shelf beside his old guard boots, where the two can keep an eye on each other.',
        art: ({ jex, taal, fen, style }) =>
          `Medium shot on the wide steps of a tall stone civic hall. Standing together are ${jex}, ${taal}, and ${fen}, each holding a small dark-green passport. Golden evening light. ${style}`,
      },
      {
        title: 'LANDED, WITH RESERVATIONS',
        text: 'Jex, Taal and Fen hold permanent residence on Verrin, a status between visitor and citizen that the registrar invented for them and has since granted to ninety others. They are not citizens. They are expected. Jex has never performed there. Each year Taal sends the registrar one warm day, and the registrar, who has learned to read it, sends one back.',
        art: ({ taal, style }) =>
          `Medium shot in a registrar’s office with a wooden desk and tall windows. Standing at the desk is ${taal}, a faint warm shimmer rising from his shoulders. Across the desk a registrar in a green coat holds out her open hand, palm up, into the warm air. Soft golden light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'sora', 'taal'],
    title: 'Accredited',
    premise:
      'The Interstellar Conference on Navigable Water has invited the couch to present a paper. All speech at the Conference must pass through the Accredited Interpretation Service, which recognizes four hundred languages and none of the three in which this delegation does its serious talking: Omi rings bells, Taal adjusts temperature, and Sora’s six elbows hold meetings in a language of joints that only they and she understand.',
    steps: [
      {
        title: 'The Accreditation Exam',
        setup:
          'The Service will accredit any language that can express, without ambiguity, the sentence The motion is carried. Omi can ring it. Taal can warm it. Sora’s elbows can vote it, but only after a meeting, which takes about an hour. The examiner has fifteen minutes and a stopwatch.',
        options: [
          {
            label: 'Sit the exam on the Service’s terms',
            outcome:
              'Omi rings the sentence in four seconds and is accredited. Taal warms it in nine and is accredited. Sora’s elbows convene, debate the wording and carry the motion at fifty-eight minutes, and are failed on time. Sora appeals. The appeal is heard by a committee, which takes about an hour, and is granted.',
            ending: 0,
          },
          {
            label: 'Challenge the sentence',
            outcome:
              'Taal observes, in words, that The motion is carried is never unambiguous, and lowers the room three degrees to illustrate. Omi rings the sentence and then the small gong, to show that it can carry a motion and still mean no. The examiner writes for a while and says she has never been asked to accredit a dissent.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a bright white examination room with a single desk. Seated at the desk is an examiner in a navy suit holding up a silver stopwatch. Standing on a stool in front of her is ${omi}, holding a long thin tuning rod against one bell. Flat white light from above. ${style}`,
      },
      {
        title: 'The Thermostat',
        setup:
          'The hall’s temperature is fixed by the Facilities Department at twenty-one degrees and locked in a box. Taal cannot speak in a room that cannot change. Facilities will unlock the box on receipt of a work order, signed by an engineer, describing the fault. There is no fault. Sora is an engineer.',
        options: [
          {
            label: 'Sora writes a work order for no fault',
            outcome:
              'Sora writes a work order with six signatures that describes the fault as a room that cannot disagree. Facilities, which has never received a work order it could not argue with, unlocks the box and sends a technician to stand beside it in case it needs to disagree back.',
            ending: 0,
          },
          {
            label: 'Taal speaks at twenty-one degrees',
            outcome:
              'Taal speaks at twenty-one degrees, which for him is speaking through a closed door. He holds the room perfectly still for twenty minutes, which in his language is a long sentence about waiting. The audience notices nothing and stays to the end anyway, out of what the chair later calls instinct.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Close-up of a grey steel box mounted on a conference hall wall, with a small dial inside and a brass padlock on its door. Standing at the box is ${sora}, writing on a paper form pressed against the wall with two hands, holding the padlock with two more and steadying a clipboard with the last two. A technician in grey overalls watches. Cool hall light. ${style}`,
      },
      {
        title: 'The Paper',
        setup:
          'The couch’s paper is about a moon’s ocean that warned, by bell, every ship that ever approached it, until a navigation authority replaced the bells with a recorded voice nobody could understand. Omi is presenting. The interpreters are ready in their booths. The chair asks Omi to begin, and asks whether it would like to be interpreted.',
        options: [
          {
            label: 'The crew interprets each other',
            outcome:
              'Omi rings the paper, Taal translates the bells into temperature for the hall, and Sora’s elbows translate the temperature into words for the interpreters, who put it into four hundred languages. Something is lost at each step. What reaches the audience is that the bells were better. The motion to restore them is carried.',
            ending: 0,
          },
          {
            label: 'Omi rings it uninterpreted',
            outcome:
              'Omi rings the paper straight to the hall, uninterpreted, for forty minutes. Nobody understands a word of it. Everybody understands that it is a warning. At the end the delegates from the moon’s system leave early, in an orderly way, to check on their ocean, and find that Omi was right.',
            ending: 1,
          },
        ],
        art: ({ taal, omi, style }) =>
          `Wide shot of a large conference hall with curved rows of delegates of many species and a row of glass interpreter booths high on the back wall. On the stage stands ${omi}, ringing one bell, and beside it stands ${taal}, a faint warm shimmer rising from his shoulders. Soft stage light, a dim hall. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ACCREDITED IN BELLS',
        text: 'Bell, temperature and elbow are now accredited languages of the Accredited Interpretation Service, each with its own booth. The Service pays Omi, Taal and Sora a small fee for every session they interpret, and Sora’s elbows have formed a professional association. The moon’s ocean has its bells back. The recorded voice has been reassigned to the lifts.',
        art: ({ sora, style }) =>
          `Medium shot inside a small glass interpreter booth overlooking a conference hall. Seated in the booth is ${sora}, wearing headphones, four hands moving as she speaks into a slim microphone and two hands holding notes. Soft blue booth light. ${style}`,
      },
      {
        title: 'UNINTERPRETED',
        text: 'The couch is not accredited and is invited back every year, because its sessions are the only ones nobody can follow and everybody remembers. The interpreters come to listen on their day off. Taal speaks in a room whose box is left unlocked. Omi’s forty minutes are on file with the Conference, uninterpreted, under the heading Water.',
        art: ({ taal, style }) =>
          `Medium shot at the back of a large conference hall, where a row of interpreters wearing headphones sit in the aisle seats with their eyes closed, listening. Standing near them is ${taal}, his webbed hands folded, beside an open grey steel box on the wall. Soft warm stage light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'kivo'],
    title: 'Leave No Trace',
    premise:
      'The moon of Tallow Green is a protected wilderness, open to visitors by permit, and the permit forbids leaving any trace. Brin leaves traces as a condition of being alive: spores, mostly, and the occasional mushroom. Kivo has brought the couch here because their wrists picked up a pressure pattern in the forest that sounds like a great many people trying to be quiet. Fen has met the head ranger and recognized the cut of the uniform.',
    steps: [
      {
        title: 'The Permit',
        setup:
          'The ranger station will issue Brin a permit only if she is decontaminated, which would kill her mushrooms, or registered as a native species, which requires her to have been found on Tallow Green before it was protected. She was not. She has been found on a great many other moons, and the ranger, Isak Moor, is a careful reader of rules.',
        options: [
          {
            label: 'Ask Moor to read the rules again',
            outcome:
              'Moor reads the rules again, with Fen. They find that any ranger who observes a species growing on the moon for one season may add it to the native register. Brin stays a season. Moor observes her, with notes. At the end she is registered as Thistle, Brin: native, perennial.',
            ending: 0,
          },
          {
            label: 'Brin stays on the couch',
            outcome:
              'Brin stays aboard in orbit and talks to the forest by spore, at a distance. Kivo and Fen go down with permits. Brin’s mushrooms reach the forest floor anyway, on the soles of Fen’s boots, which is a trace, and which nobody is about to report.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot inside a small wooden ranger station with a black iron stove and a wide window onto a dark pine forest. Standing at the counter is ${brin}, holding out her open hands palm up, while a tall ranger in a green uniform and wide-brimmed hat studies a thick rule book through a magnifying glass. Warm stove light. ${style}`,
      },
      {
        title: 'The Camp',
        setup:
          'Kivo follows the pressure pattern into the deep forest and finds forty people camped under the trees, from a world that is no longer safe, keeping very still. They have been there all winter. Camping is prohibited on Tallow Green. Kivo’s wrists have stopped whistling. They whistle at things that are hiding, and these people are no longer hiding from Kivo.',
        options: [
          {
            label: 'Kivo tells Fen',
            outcome:
              'Kivo tells Fen. Fen walks into the camp alone, without a uniform, and sits down by the fire. He tells them who he used to be and what he did on his last day. After a long time they decide to let him help.',
            ending: 0,
          },
          {
            label: 'Kivo tells nobody yet',
            outcome:
              'Kivo tells nobody. Each night they take food down from the couch, leave it at the edge of the camp and walk away without looking back. On the fourth night something has been left in return: a small bird carved from pine. Kivo keeps it in their scout jacket.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Wide shot of a deep dark pine forest at dusk, where a camp of small tents around a low fire sits under the trees, with people in patched coats sitting very still around it. Standing at the edge of the trees is ${kivo}, setting down a cloth bundle of food on a flat stone. Warm firelight, deep blue dusk. ${style}`,
      },
      {
        title: 'The Ranger',
        setup:
          'Ranger Moor has found the camp. He is required to report illegal camping to the Parks Authority, which will clear it. He wears the same cut of uniform Fen once wore, for a different service, and he asks Fen, as the only person on the moon who might know, what he would do.',
        options: [
          {
            label: 'Fen helps Moor designate a campsite',
            outcome:
              'Fen and Moor read the regulations together until two in the morning and find that a ranger may designate a campsite for research. Moor designates the camp a research station studying the long-term presence of people in wilderness. The forty are its researchers. Brin is its consulting botanist.',
            ending: 0,
          },
          {
            label: 'Brin asks the forest to close over it',
            outcome:
              'Brin asks the forest to close over the camp, and in a week it does: ferns, then moss, then a canopy of mushrooms tall enough to sleep under. Moor walks past on his rounds and reports, accurately, that there is no camp on Tallow Green, only a very healthy stand of a fungus he has not seen before.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot by a low campfire in a dark pine forest at night. Sitting on a fallen log is ${fen}, beside a tall ranger in a green uniform and wide-brimmed hat who holds a thick rule book open on his knee. Firelight on their faces, dark trees behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'RESEARCH STATION',
        text: 'Tallow Green has a research station in its deep forest, with forty researchers studying the long-term presence of people in wilderness, and a native species, Thistle, Brin, perennial, in its register. Moor visits weekly with a clipboard. Fen visits when the couch passes and sits by the fire without a uniform. Kivo’s wrists are quiet there.',
        art: ({ brin, kivo, style }) =>
          `Wide shot of a small wooden research station built among tall pines, with a vegetable patch and washing lines strung between the trees. Kneeling in the vegetable patch is ${brin}, and walking toward her with a basket is ${kivo}. Soft morning sunlight through the trees. ${style}`,
      },
      {
        title: 'WITHOUT A TRACE',
        text: 'According to the Parks Authority there is no camp on Tallow Green, only a large protected stand of fungus, which forty people call home. Brin visits it by spore. Kivo still takes food down at night. Fen and Ranger Moor have an arrangement that neither has written down, which is the only kind of permit Fen has ever believed in.',
        art: ({ fen, style }) =>
          `Wide shot of a deep pine forest where a huge stand of tall pale mushrooms forms a canopy over a hidden clearing, with warm light glowing faintly beneath it. On the path in front walk ${fen}, and a tall ranger in a green uniform and wide-brimmed hat, side by side, looking straight ahead. Soft green forest light. ${style}`,
      },
    ],
  },
]
