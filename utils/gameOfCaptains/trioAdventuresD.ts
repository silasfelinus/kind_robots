import type { TrioAdventure } from './trioAdventures'

// Party adventures, batch D (see trioAdventures.ts and trioAdventuresA.ts for
// the conventions). The twenty-five parties here are the first unwritten
// ones in CrewId order, most of them with Pell aboard. Each episode takes one
// more institution at its word, a postcode, a sick note, a speed camera, a
// lost property office, and lets these three particular crew decide what the
// form is for. Art prompts are literal Krea 2 prose with crew looks and the
// couch phrase passed in word for word.

export const TRIO_ADVENTURES_D: readonly TrioAdventure[] = [
  {
    crew: ['pell', 'rue', 'vela'],
    title: 'Fixed Abode',
    premise:
      'The Galactic Post has allotted the couch a postcode, so that it can at last receive letters, and the postcode belongs to a lay-by on a moon the couch has never visited. Rue knows exactly what happens to people without a fixed abode, having once written the clause. Vela cannot register her clinic without an address. Pell cannot register a union branch without one either, and has started a petition, which also needs one.',
    steps: [
      {
        title: 'Proof of Residence',
        setup:
          'The Post will confirm the postcode on receipt of two utility bills addressed to the couch. The couch has no utilities. It has a force bubble, a lamp and a garden, none of which bill anybody. Pell offers to start charging the crew for the lamp so that there is a bill. Rue points out that the last time a document was invented to prove a home, it took them eleven apologies to undo.',
        options: [
          {
            label: 'Pell bills the crew for the lamp',
            outcome:
              'Pell issues an invoice for one month of lamp, at cost, to Couch, The Couch. The Post accepts it as proof of residence. Vela pays it in full and asks for a receipt, so that she can claim it as a clinic expense, and the couch has its first paper trail.',
            ending: 0,
          },
          {
            label: 'Rue writes to the Post about the clause',
            outcome:
              'Rue writes to the Post a long and very polite letter explaining that proof of residence excludes everyone who most needs a postcode. The Post replies that it agrees in principle and cannot reply in practice without a forwarding address. Rue frames the reply.',
            ending: 1,
          },
        ],
        art: ({ pell, vela, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under one brass lamp. Seated on the left is ${pell}, writing on a paper invoice pad balanced on his knee. Seated beside him is ${vela}, holding out a few paper banknotes. A small paper envelope lies on the cushion between them. Black space beyond, warm amber light. ${style}`,
      },
      {
        title: 'The Lay-By',
        setup:
          'The couch flies to the lay-by on the moon to see its address. There is a bench, a bin and a postbox, and the postbox is stuffed with letters for the couch, some of them years old. Three people are sleeping on the bench who have also been given this postcode, because the Post assigns it to anyone it cannot place. Vela takes their pulses, with permission. Rue takes their names, with more.',
        options: [
          {
            label: 'Share the address with the people on the bench',
            outcome:
              'Rue drafts a household agreement: the couch and the three sleepers are one address, with five beds of which four are cushions. The Post registers the household without comment. One of the sleepers, a retired harbour pilot, now gets her pension.',
            ending: 0,
          },
          {
            label: 'Take the letters and leave the bench its own postcode',
            outcome:
              'The crew empties the postbox, leaves the three sleepers the bench, the bin and the postcode, and asks the Post to split the address in two. The Post issues the bench a postcode of its own, the first ever granted to a bench. Rue keeps the paperwork as a precedent.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Wide shot of a grey stony moon surface with a low concrete lay-by. A red metal postbox stands beside a wooden bench and a round bin, and paper letters spill from the postbox slot. Kneeling by the bench is ${rue}, writing names on a paper slip. Black sky with a large blue planet low on the horizon. ${style}`,
      },
      {
        title: 'Return to Sender',
        setup:
          'Among the old letters is one addressed to Pell from the Ashdock contractors, offering a settlement in exchange for his silence, and stamped RETURN TO SENDER because the couch had no address when it arrived. The offer expired last year. Pell has never been offered anything by them in writing before. Vela asks him how he is. He says he is reading.',
        options: [
          {
            label: 'Pell answers the letter, late',
            outcome:
              'Pell writes back to the contractors at their registered address, which they have plenty of, declining an offer that has already expired and listing, in full, the eleven names they hoped he would keep to himself. He posts it from the couch’s own postcode. It is the first letter the couch has ever sent.',
            ending: 0,
          },
          {
            label: 'Rue files it as evidence instead',
            outcome:
              'Rue logs the letter as evidence that the contractors tried to buy silence, with the date, the stamp and the expiry. Vela witnesses the log. Pell signs it with his steel hand and puts the original in his tool roll beside the eleven names, where it can be kept an eye on.',
            ending: 1,
          },
        ],
        art: ({ pell, rue, style }) =>
          `Close-up on a red velvet armrest under warm lamp light. Seated on the armrest is ${pell}, reading a yellowed paper letter with a red stamp across it. Leaning over his shoulder is ${rue}, holding a fountain pen ready above a paper slip. Black space beyond the bubble. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FIVE AT ONE ADDRESS',
        text: 'The couch has a postcode and a household, and the household is bigger than the couch. Letters arrive at the lay-by and the retired pilot forwards them on, charging nothing. Vela’s clinic is registered, Pell’s union branch is registered, and Rue has written the household agreement up as a model clause, free of charge, for anyone without a door.',
        art: ({ vela, couch, style }) =>
          `Wide shot of ${couch}, hovering low beside a concrete lay-by on a grey moon, with a red postbox, a wooden bench and a round bin. Standing at the postbox is ${vela}, posting a paper envelope. An elderly woman in a pilot’s cap sits on the bench sorting letters. Black sky, warm lamp glow. ${style}`,
      },
      {
        title: 'A POSTCODE FOR THE BENCH',
        text: 'The bench has its own postcode now and the couch has one that moves, which the Post has listed as Itinerant, Various. Rue has the bench’s registration framed on the backrest, as the first time a law about addresses gave somebody one. Vela visits the three sleepers whenever the route allows. Pell has written to the contractors twice more. They have not yet replied, which he logs.',
        art: ({ rue, style }) =>
          `Medium shot of a wooden bench on a grey moon lay-by, with a small new brass plate screwed to its backrest showing a row of letters and numbers. Standing beside the bench is ${rue}, tapping the brass plate with a small wooden gavel. Three people in blankets sit on the bench drinking from tin mugs. Black sky, stars. ${style}`,
      },
    ],
  },
  {
    crew: ['pell', 'sora', 'vela'],
    title: 'Doctor’s Note',
    premise:
      'The couch’s reactor has called in sick. Under the terms of its employment, which Sora negotiated with it in the spring, it may take three days’ sick leave on its own word, and after that it needs a doctor’s note. It is now day four. Vela has never examined a reactor and is not sure she is allowed to. Pell, as union rep, would like to know who decided machines need a note at all, and is told it was him, in the spring.',
    steps: [
      {
        title: 'The Examination',
        setup:
          'Vela kneels at the open reactor housing with her stethoscope and asks whether she may begin. The reactor’s indicator lights blink in a pattern Sora translates as yes, but gently. Its temperature is normal and its output is normal. Sora’s six elbows are holding a committee meeting about whether a reactor can be tired without being broken, and four of them are on its side.',
        options: [
          {
            label: 'Vela signs it off for exhaustion',
            outcome:
              'Vela writes a note that the reactor is exhausted and should rest for a week. She signs it as a physician, adds that she has examined one reactor in her career, and that it was this one. Sora reads the note aloud to the housing. Its lights go dim with what Sora says is relief.',
            ending: 0,
          },
          {
            label: 'Vela refers it to a specialist',
            outcome:
              'Vela writes a referral to a reactor specialist, as she would for any patient outside her field. There is one specialist in the sector, booked for six weeks. The reactor is placed on the waiting list in its own name, which Pell says is a first for a machine and a disgrace for a health service.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Close-up of an open brass reactor housing set into the back of a red velvet couch, its panel of round indicator lights glowing dim yellow. Kneeling at the housing is ${vela}, pressing a stethoscope to the brass casing. A paper notepad lies on the cushion beside her. Warm amber lamp light. ${style}`,
      },
      {
        title: 'Cover',
        setup:
          'While the reactor rests, the couch runs on the backup cell, which gives four hours of travel a day and none of the lamp. The agency offers a temporary reactor on a day rate, a sullen grey unit that has never been asked anything. Pell does not like agency labour on principle. Sora does not like it because it is shaking.',
        options: [
          {
            label: 'Take the agency reactor and treat it as staff',
            outcome:
              'Sora fits the agency reactor and asks it, before switching on, whether it wants the shift. It takes some time to understand the question. Pell gives it the same tea break as the rest of the crew. By the end of the week it has asked whether there are permanent positions.',
            ending: 0,
          },
          {
            label: 'Run on the backup and travel by day',
            outcome:
              'The crew runs on the backup cell and travels four hours a day in the dark. Vela holds evening clinic by hand torch. Pell reads the reactor’s employment terms by the same torch and finds that he wrote the sick note clause himself, at two in the morning, and initialled it.',
            ending: 1,
          },
        ],
        art: ({ sora, pell, style }) =>
          `Medium shot behind a red velvet backrest, where a small boxy grey metal reactor unit sits on the cushion with a cable running into an open panel. Kneeling beside it is ${sora}, two hands resting on its casing and two holding a clipboard. Standing behind her is ${pell}, holding out a tin mug of tea. Dim warm torch light, black space. ${style}`,
      },
      {
        title: 'Return to Work Interview',
        setup:
          'The reactor is well enough to come back. Policy, also written by Pell, requires a return to work interview, to see whether anything at work made it ill. Sora conducts it. The answer, blinked out in yellow over twenty minutes, is that the couch has been flying at full output since the captain took command and nobody asked about the hours.',
        options: [
          {
            label: 'Cut the couch’s cruising speed',
            outcome:
              'The couch drops to three-quarter output for good. Every voyage takes a little longer. Pell writes the change into the reactor’s terms in daylight, with all of them initialled, and the captain is told the delays are now a matter of staff welfare and are not open to appeal.',
            ending: 0,
          },
          {
            label: 'Give the reactor a rota and a deputy',
            outcome:
              'The agency reactor is hired permanently as a deputy. The two units share the work on a rota pinned to the backrest, drawn up by Sora with all six hands. Vela gives both a check-up each month. The grey unit has started blinking yes, gently, which Sora thinks it learned.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the back cushion is ${sora}, one pair of hands holding a paper form, facing an open brass reactor housing whose round indicator lights glow soft yellow. Black space and stars beyond, warm lamp light from above. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SIGNED OFF, GENTLY',
        text: 'The reactor works shorter hours and is the better for it, by every measure Sora takes and one she made up. Vela keeps its notes in her clinic file under its own name, between a refugee pilot and a mushroom. Pell has rewritten every clause he drafted at two in the morning, and has a new clause banning clauses after midnight.',
        art: ({ vela, style }) =>
          `Close-up of a small wooden filing box open on a red velvet cushion, its paper cards standing in rows. Holding one card up to the lamp is ${vela}. The card has a small drawing of a round brass reactor on it. Warm amber light, black space beyond the bubble. ${style}`,
      },
      {
        title: 'TWO ON THE ROTA',
        text: 'The couch has two reactors now and a rota no one may change without asking both. The grey unit has a name, which it chose and will not tell Pell. Sora has stopped apologising to it first and started asking how its week was. Vela’s bell is quiet near the housing, which she says is the best review a workplace can get.',
        art: ({ pell, style }) =>
          `Medium shot behind a red velvet backrest, where an open panel shows a round brass reactor and a small boxy grey reactor side by side. Pinning a hand-drawn paper rota above them with his steel hand is ${pell}. Warm lamp light, black space beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['pell', 'taal', 'vela'],
    title: 'Minimum Temperature',
    premise:
      'The Workplace Comfort Regulations say that no place of work may fall below sixteen degrees. Taal expresses disapproval by lowering a room three degrees, and he has disapproved of the last three meetings. The couch was fourteen at the most recent one. Pell, as safety rep, is obliged to report it. Vela has been asked to certify whether anyone was harmed, and has found a slight chill in everybody and a deep one in Taal.',
    steps: [
      {
        title: 'The Complaint',
        setup:
          'Pell files the complaint against the room, as the form requires, and the room is the couch, and the cause is Taal. The inspector rules that a person cannot be a heating fault. Taal says, at length and at fourteen degrees, that he has been a heating fault his whole career and is only now being told he is not. Vela notes that he is upset.',
        options: [
          {
            label: 'Treat Taal’s cold as speech, and protect it',
            outcome:
              'Pell withdraws the complaint and files a new one, asking for Taal’s temperature to be recognised as protected expression. The inspector says he will need to consult. Taal warms the couch one degree, which is the closest he has ever come to saying thank you in a meeting.',
            ending: 0,
          },
          {
            label: 'Ask Taal to disagree out loud instead',
            outcome:
              'Vela asks Taal whether, for the length of the inspection, he would try disagreeing in words. He tries. He says he disagrees, and the couch drops two degrees anyway, because the words were not enough. Vela writes down that he tried, which she says counts.',
            ending: 1,
          },
        ],
        art: ({ taal, pell, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions with frost forming on the brass lamp. Seated upright on the middle cushion is ${taal}, hands folded. Seated beside him is ${pell}, holding a round brass thermometer up to the light and frowning at it. Pale breath clouds in the air, black space beyond. ${style}`,
      },
      {
        title: 'The Thermometer',
        setup:
          'The Regulations require a thermometer on the wall of every workplace. The couch has no wall. Pell bolts one to the backrest. It is a good thermometer, and it is very easily read, and within a day every guest who sits down knows exactly how Taal feels about them. Vela points out that this is a medical record on public display.',
        options: [
          {
            label: 'Keep the thermometer up, with Taal’s consent',
            outcome:
              'Taal is asked, and says he would like the thermometer to stay. He has spent his life being misread. Now a diplomat from the shelf colonies sits down, watches it fall, and apologises before the meeting starts. Taal says it has saved him an hour a day.',
            ending: 0,
          },
          {
            label: 'Turn the thermometer to face the bubble',
            outcome:
              'Vela turns the thermometer to face outward, where only space can read it. The Regulations are satisfied, since they do not say which way. Taal is visibly relieved. Pell logs the reading every hour from the back of the couch, and keeps the log in his tool roll, unread by anyone.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Close-up of the scarlet velvet backrest of a couch with a round brass thermometer bolted to it, its red needle pointing low. Reaching up to turn the thermometer is ${vela}. Frost feathers the edges of the brass. Black space and stars beyond a thin clear bubble, cool blue-white light. ${style}`,
      },
      {
        title: 'The Remedy',
        setup:
          'The inspector returns with a remedy notice: the workplace must be heated. A heater would solve the cold and silence Taal entirely, since nobody could ever again tell when he disapproved. Pell has the heater out of its box. Vela has her hand on the box. Taal has gone very still, which on the shelf colonies is a request to be asked.',
        options: [
          {
            label: 'Install the heater, with a switch Taal holds',
            outcome:
              'The heater goes in and the switch goes to Taal. He switches it off whenever he disagrees, which is the same thing he did before, but now it is a choice the Regulations recognise. The inspector signs the notice closed. Pell keeps the box, in case.',
            ending: 0,
          },
          {
            label: 'Give the heater to the inspector',
            outcome:
              'Vela gives the heater to the inspector, whose own office, it turns out, is eleven degrees all year. He accepts it and closes the notice on the ground that the workplace is temporary. Taal warms the couch by three degrees as he leaves, and Pell writes the reading down.',
            ending: 1,
          },
        ],
        art: ({ taal, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated upright is ${taal}, holding a small brass switch box on a cord. A squat copper heater with glowing orange coils stands on the cushion beside him. Thin frost on the armrest, warm orange light against black space. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PROTECTED EXPRESSION',
        text: 'Taal’s temperature is in the couch’s safety file now as a recognised form of speech, with a footnote from the inspector, who has since gone on a course about it. Pell keeps a blanket on the left armrest for meetings that are going badly. Vela checks fingers and toes after each one. Taal has warmed the couch more in the last month than in all the years before.',
        art: ({ pell, style }) =>
          `Medium shot of the left armrest of a red velvet couch under a brass lamp, with a folded grey wool blanket draped over it. Unfolding the blanket is ${pell}. Frost lines the base of the brass lamp. Black space and stars beyond a clear bubble, warm amber light. ${style}`,
      },
      {
        title: 'READ FROM OUTSIDE',
        text: 'The thermometer still faces outward and the couch is as cold as Taal wants it to be. Passing ships have learned to read the needle before they hail, and two have turned back. The inspector writes each winter to report his office temperature, which is up. Vela calls this a follow-up, and Pell calls it a result.',
        art: ({ taal, vela, style }) =>
          `Wide shot of a thin clear bubble around red velvet cushions, with a round brass thermometer bolted outward on the back. Seated inside are ${taal} and ${vela}, both wrapped in grey blankets, holding tin mugs. A small grey ship hangs far off in black space. Cool blue-white light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'pell', 'vela'],
    title: 'Hygiene Rating',
    premise:
      'The Sector Food Standards Agency rates every vessel that serves food, and the couch serves tea, biscuits and, on Thursdays, soup. The inspector has arrived with a clipboard and a swab kit. The galley is the right armrest. Brin’s oxygen garden grows along it, and the largest fungus has just been elected shop steward. Vela runs a clinic two cushions away. Pell’s beetle has already taken the inspector’s swab kit, as an employer’s tool.',
    steps: [
      {
        title: 'The Swabs',
        setup:
          'The inspector swabs the armrest and finds spores. Brin says the spores are the garden and the garden makes the air. The inspector says the air is not on his form. The form has three columns: clean, dirty and closed. Vela points out that every living kitchen in the galaxy would fail it. Pell would like to know who wrote the form, and is shown a portrait.',
        options: [
          {
            label: 'Brin introduces the inspector to the garden',
            outcome:
              'Brin asks the garden whether the inspector may look closely. The largest fungus agrees on behalf of the union. The inspector spends an hour with a magnifying glass and asks if he can take a cutting home for his own kitchen. He leaves the clean column blank and the dirty column blank as well.',
            ending: 0,
          },
          {
            label: 'Move the garden off the galley for the visit',
            outcome:
              'The garden is moved to the left armrest for the length of the inspection, under protest, minuted by the largest fungus. The galley swabs come back spotless. Brin says that a garden which has to hide to pass is not passing. Pell agrees and logs the protest in full.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Close-up of the right armrest of a red velvet couch, covered in a low garden of moss, ferns and small pale mushrooms, with a tin kettle and a plate of biscuits among them. Kneeling beside it is ${brin}, holding a large mushroom steady while a thin man in a white coat peers at it through a magnifying glass. Warm lamp light. ${style}`,
      },
      {
        title: 'The Soup',
        setup:
          'It is Thursday. Vela made the soup. The inspector would like a sample, and also the recipe, and also to know whether any ingredient grew on the armrest. Several did. The soup is good and the crew has never been ill from it, and Vela has the clinic records to prove it, but they are confidential, and she will not show them to him without asking each patient first.',
        options: [
          {
            label: 'Vela asks every patient, one by one',
            outcome:
              'Vela asks each crew member whether their clinic records may be shown to a soup inspector. All of them say yes, the fungus included. The inspector reads a year of perfect digestion and has a bowl. He has a second bowl and asks, slightly embarrassed, whether he might have the recipe for his mother.',
            ending: 0,
          },
          {
            label: 'Serve the soup and keep the records shut',
            outcome:
              'Vela gives the inspector a bowl of soup and nothing else. The records stay shut. He rates the soup excellent and the paperwork absent. Pell says this is the correct rating for most of the good things he has ever eaten, and the beetle returns one swab as a gesture.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on the middle cushion is ${vela}, ladling green soup from a dented copper pot into a white bowl held out by a thin man in a white coat with a clipboard under his arm. Ferns and small mushrooms grow along the armrest behind them. Warm lamp light, black space. ${style}`,
      },
      {
        title: 'The Sticker',
        setup:
          'The rating comes as a sticker for the window. The couch has no window, only a bubble, and a sticker on the bubble would be the first thing every rescued passenger sees. The inspector has brought a two and is apologetic about it. Pell has the beetle ready to take the sticker as well, since it is the employer’s property until it is stuck.',
        options: [
          {
            label: 'Stick the two on the bubble, and explain it',
            outcome:
              'Brin sticks the two on the bubble at eye height, and below it Pell paints a list of what the form does not measure: air made, people fed, nobody ill. Rescued passengers read both. Several ask to join the union, and one asks for the soup.',
            ending: 0,
          },
          {
            label: 'Appeal the rating on behalf of the garden',
            outcome:
              'Brin appeals in the garden’s name. The appeal goes to a panel of three, one of them the inspector’s mother, who has been making the soup. The rating is revised to a four with a note that the agency should add a column. Pell sends the note to the person in the portrait.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Wide shot of ${couch}. A round green paper sticker printed with a large number two is stuck on the outside of the bubble. Standing on the back cushion is ${pell}, painting a short column of white letters on the bubble below the sticker with a small brush. Black space and stars, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TWO OUT OF FIVE, ANNOTATED',
        text: 'The couch’s rating is still two, and it is the most read sticker in the sector, because of the list underneath. The agency has been asked about the list so many times that it has formed a working group. Brin’s garden has not moved from the galley. Vela still makes the soup on Thursdays, and the inspector still comes to the clinic for it, off duty.',
        art: ({ brin, vela, style }) =>
          `Medium shot on scarlet velvet cushions with a small garden of ferns and pale mushrooms along the right armrest. Seated side by side are ${brin} and ${vela}, each holding a white bowl of green soup. A round green sticker printed with a number two shows on the clear bubble behind them. Warm lamp light. ${style}`,
      },
      {
        title: 'A NEW COLUMN',
        text: 'The agency’s form has four columns now: clean, dirty, closed and living. The couch was the first vessel rated living, and the fungus has the certificate. Pell has written to every kitchen he knows to tell them they can ask for the new column. Vela gave the recipe to the inspector’s mother, who has improved it and will not say how.',
        art: ({ brin, style }) =>
          `Close-up of a garden of moss and pale mushrooms on the armrest of a red velvet couch. Propped against the largest mushroom is a small framed paper certificate with a green seal. Kneeling beside it is ${brin}, straightening the frame. Warm lamp light, black space beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'pell', 'vela'],
    title: 'Exit Interview',
    premise:
      'Fen resigned from the Border Directorate eight years ago and has just received its exit interview questionnaire, forty pages long, with a free return envelope. Failure to return it means his resignation will be recorded as abandonment of post. Pell, as union rep, says that nobody fills in an exit interview without representation. Vela says nobody fills one in without a checkup first, given what Fen’s boots have been saying about it.',
    steps: [
      {
        title: 'Reason for Leaving',
        setup:
          'Question one asks Fen to tick his main reason for leaving: career progression, relocation, family or other. Fen left because the Directorate turned displaced families into trespassers overnight, and he still carries their confiscated permits. The box for other is two centimetres long. Every time Fen opens the envelope his boots announce CHECKPOINT.',
        options: [
          {
            label: 'Write the whole reason, in the margins',
            outcome:
              'Fen writes the reason in the box for other, and then in the margins, and then on the back of the page. Pell attaches a union cover sheet. Vela writes FIT TO ANSWER on the front. The envelope will not close. Pell staples it shut with his steel hand, which takes eleven staples.',
            ending: 0,
          },
          {
            label: 'Tick relocation, which is also true',
            outcome:
              'Fen ticks relocation. He relocated to a couch. Pell says it is the truest box on the form and the least useful. Vela watches Fen’s hands while he ticks it and writes down that they shook, which she adds to the form herself, on a separate sheet, with his consent.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up of a red velvet cushion with a thick paper questionnaire open on it, every margin filled with small handwriting. Seated over it, pen in hand, is ${fen}. A brown paper return envelope lies beside the questionnaire. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Permits',
        setup:
          'Question nineteen asks whether Fen has returned all Directorate property. He has not. In his jacket are the permits of forty-one families, confiscated on the night he resigned and never returned to anybody. The form offers a freepost bag for any outstanding items. Pell says the Directorate is the last place they should go. Vela says the families should be asked, and has a list of who to ask.',
        options: [
          {
            label: 'Return the permits to the families instead',
            outcome:
              'Fen answers question nineteen: all property returned to owners. Over the next three chapters the couch delivers eleven of the forty-one permits by hand. Vela checks each family before they are handed over. Fen’s boots announce CHECKPOINT at every door, and at each one a family laughs at them.',
            ending: 0,
          },
          {
            label: 'Declare them, with the families’ names attached',
            outcome:
              'Fen declares all forty-one permits on the form, with each family’s name and the date they were taken, so the Directorate will have to answer for them on its own paper. Pell countersigns. Vela adds a medical note on the effect of losing your papers, which she has seen.',
            ending: 1,
          },
        ],
        art: ({ fen, vela, style }) =>
          `Medium shot at an open wooden door in a small metal habitat. Standing in the doorway is ${fen}, holding out a folded paper permit to a woman holding a small child. Standing behind him is ${vela}, holding the small brass bell at her belt still with one hand. Warm light from inside the room, dark corridor behind. ${style}`,
      },
      {
        title: 'Would You Return?',
        setup:
          'The last question asks whether Fen would consider returning to the Directorate in future. A recruiter has telephoned twice since the envelope arrived, because his file says he was very good at his job. Pell asks whether Fen wants to answer that one alone. Fen does not. The boots are already saying CHECKPOINT, though no door has opened.',
        options: [
          {
            label: 'Answer: only to open the corridors',
            outcome:
              'Fen writes that he would return to the Directorate to run one thing only: unarmed corridors where nobody is asked for papers. The recruiter calls a third time, to ask whether he was serious. Fen says yes. Pell says the union will represent the corridors.',
            ending: 0,
          },
          {
            label: 'Answer no, and post it',
            outcome:
              'Fen writes no, in capitals, and posts the envelope from the next station. The boots say CHECKPOINT at the postbox. Vela takes his pulse on the way back to the couch, with his permission, and says it is the slowest she has ever recorded from him.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the right cushion is ${pell}, holding a brass telephone handset to his ear with his steel hand and the other hand raised flat. A thick brown paper envelope lies on the cushion beside him. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ANSWERED IN FULL',
        text: 'The Directorate filed Fen’s exit interview, all forty pages and the margins, under abandonment of post, then received a complaint from a union, a physician and forty-one families, and refiled it under resignation, with reasons. The permits are home or on their way. Fen’s boots still say CHECKPOINT at every door. He has started saying welcome after them.',
        art: ({ fen, style }) =>
          `Medium shot of an open round metal hatch on a small station. Standing in the hatchway is ${fen}, one heavy scuffed black boot over the threshold, holding the last folded paper permit in one hand and waving with the other. A family with bags waits inside a warm-lit room. ${style}`,
      },
      {
        title: 'PROPERTY OUTSTANDING',
        text: 'The Directorate has written to say that forty-one permits remain outstanding and that it is reviewing the matter. It has been reviewing it for a year. In the meantime the families have their papers back, delivered by hand. Pell has the exit interview framed. Vela has a copy in Fen’s clinic file, with his pulse beside it.',
        art: ({ vela, pell, style }) =>
          `Close-up of the scarlet velvet backrest of a couch with a framed thick paper questionnaire hanging on it, its pages fanned out under glass. Standing beside it are ${vela} and ${pell}, looking at the frame. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'pell', 'tess'],
    title: 'Pitch Seven',
    premise:
      'The concourse of Kettle Junction station has twelve licensed busking pitches, allotted each morning by lottery, and Jex has drawn pitch seven, which is under the departures board and beside a ventilation grille that plays a low B flat of its own. Busking licences forbid any song banned on five or more worlds, which rules out most of Jex’s catalogue. Tess has the station map. Pell has noticed that the grille is a person’s job, and nobody is doing it.',
    steps: [
      {
        title: 'The Set List',
        setup:
          'The licensing officer checks Jex’s set list against the register of banned songs. Jex wrote six national anthems and is banned from all of them. What remains is two lullabies, a song about a ferry and an instrumental Jex is not sure he is allowed to call his own. The grille hums its B flat. Tess suggests that a song with no words cannot be on a register of words.',
        options: [
          {
            label: 'Play the instrumental, in the grille’s key',
            outcome:
              'Jex retunes to B flat and plays along with the grille. The officer checks the register for a song without words and finds nothing. A crowd gathers, mostly commuters who have heard the grille every morning for nine years and never thought of it as music.',
            ending: 0,
          },
          {
            label: 'Play the ferry song, and only the ferry song',
            outcome:
              'Jex plays the ferry song for two hours, over and over, and nobody bans it, because nobody has ever wanted to. By the fortieth time commuters are humming it on the platforms. The officer asks Jex, a little stiffly, whether there is a second verse.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a busy station concourse under a tall black departures board with white letters. Standing beside a square metal ventilation grille in the floor is ${jex}, playing his instrument. A small chalk circle with the number 7 is drawn around his feet, and a few commuters with briefcases stop to listen. Cool station light. ${style}`,
      },
      {
        title: 'The Grille',
        setup:
          'Pell follows the grille’s duct behind a service door and finds a ventilation fan, very old and very loud, and a timesheet hung on a nail for an engineer who retired six years ago and whose job was never filled. Somebody has been signing the timesheet every week anyway. Tess traces the signature to the station manager. The fan’s bearings have nine days left, by Pell’s ear.',
        options: [
          {
            label: 'Pell fixes the fan and bills the station',
            outcome:
              'Pell replaces the bearings in an afternoon and invoices the station for six years of a vacant post, plus the afternoon. The station manager pays the afternoon and disputes the six years. Pell says he will wait. The grille’s B flat drops a quarter tone, and Jex retunes.',
            ending: 0,
          },
          {
            label: 'Post the job vacancy on the departures board',
            outcome:
              'Tess knows the board’s maintenance code from the station map. For one minute the departures board shows VACANCY: FAN ENGINEER, SIX YEARS UNFILLED, APPLY TO MANAGEMENT. Four commuters apply that day. The manager has to interview them in the concourse, while Jex plays.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Medium shot inside a narrow grey service room behind a station wall. A large old round ventilation fan with rusted blades is set into the wall, and a paper timesheet hangs from a nail beside it. Kneeling at the fan with a spanner in his steel hand is ${pell}. Dim yellow work light. ${style}`,
      },
      {
        title: 'The Lottery',
        setup:
          'The next morning’s pitch lottery is drawn by the station manager from a bowl, and Tess, who has the map, notices that pitch seven is the only one never drawn by a local. The bowl has a false bottom. The lottery is the oldest institution on the station. Jex has drawn pitch seven again. The other eleven buskers are watching him.',
        options: [
          {
            label: 'Give pitch seven to the oldest busker',
            outcome:
              'Jex gives his licence to a woman who has played the station spoons for thirty years and never drawn the departures board. She plays to the biggest crowd of her life. Jex accompanies her on the grille side. Pell holds the hat.',
            ending: 0,
          },
          {
            label: 'Tess shows the buskers the bowl',
            outcome:
              'Tess turns the bowl over in front of all twelve buskers. The false bottom falls out with forty paper slips that all say 7. The buskers redraw the pitches themselves, from a hat, and decide to rotate them in future. The manager says the bowl was traditional.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Close-up in a station concourse of a white ceramic bowl turned upside down on a folding table, its false wooden bottom fallen out and dozens of small paper slips spilling across the table. Holding the bowl is ${tess}. Several buskers with instrument cases lean in around the table. Cool station light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'IN B FLAT',
        text: 'Kettle Junction has a fan engineer again, paid in full, and the grille plays a slightly flatter B than it used to. Jex wrote a piece for it, without words, which is the only thing he has ever written that is not banned anywhere. Commuters hum it under the departures board. Tess has marked pitch seven on her map with a small musical note.',
        art: ({ jex, pell, style }) =>
          `Wide shot of a station concourse under a tall black departures board. Standing by a square metal floor grille is ${jex}, playing his instrument, and seated on an upturned toolbox beside him is ${pell}, holding out a cloth cap with coins in it. Commuters pass with briefcases. Cool station light with warm highlights. ${style}`,
      },
      {
        title: 'PITCHES IN ROTATION',
        text: 'The buskers of Kettle Junction rotate the twelve pitches now by a rota they drew up themselves, and the bowl is in a glass case in the ticket hall labelled TRADITIONAL. Tess drew the rota on the back of a map. Jex plays the ferry song on whichever pitch the rota gives him, and the second verse he finally wrote is about a bowl.',
        art: ({ tess, style }) =>
          `Medium shot in a station ticket hall of a small glass display case holding a white ceramic bowl, with a paper card reading TRADITIONAL. Pinning a hand-drawn paper rota to a corkboard beside the case is ${tess}. A row of buskers with instrument cases waits in line behind her. Cool hall light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'pell', 'tess'],
    title: 'Sorry We Missed You',
    premise:
      'A card has been left on the armrest saying that the Galactic Post tried to deliver a parcel while nobody was in, and that it may be collected in person from the depot with photographic identification. The couch has never been out. Kivo is a courier and has strong views about cards. Tess has looked up the depot and it is on a moon with no landing permitted. Pell has been expecting a parcel of bearings since the spring.',
    steps: [
      {
        title: 'The Card',
        setup:
          'The card is printed, signed with an illegible courier’s mark, and stuck to the armrest at a point no one could reach without coming aboard. Kivo’s wrists whistle at it. Somebody was here and wrote that nobody was. Tess points out that the couch’s course log puts it in deep space at the time on the card. Pell wants his bearings and does not much mind how.',
        options: [
          {
            label: 'Kivo traces the courier by the signature',
            outcome:
              'Kivo reads the illegible mark the way couriers read each other, and knows the route and the shift. The courier was a junior on a forty-stop round who left cards at every stop to finish on time. Kivo does not report him. Kivo sends him a note with three shortcuts.',
            ending: 0,
          },
          {
            label: 'Complain to the Post, through proper channels',
            outcome:
              'Pell files a complaint. The Post replies that the card is proof of an attempt and the attempt is proof of the card. Tess draws the courier’s claimed route on a map and shows it crossing the couch’s at a point where the couch was six days away. Pell adds the map to the complaint.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Close-up of the rolled armrest of a red velvet couch with a small white printed card taped to the velvet. Leaning in to look at the card is ${kivo}, holding one thin wrist close to it. Black space and stars beyond a thin clear bubble, warm lamp light. ${style}`,
      },
      {
        title: 'The Depot',
        setup:
          'The depot is on a moon where landing is not permitted, so parcels are collected from an orbiting kiosk with a window the size of a letterbox and a queue of ships three hours long. Tess knows a way round it that is not on any map, a gap in the moon’s ring that only her grandmother used. Kivo knows the courier rules, which say that anyone may collect who is named on the card.',
        options: [
          {
            label: 'Queue, like everyone else',
            outcome:
              'The couch queues for three hours behind a freighter, a hearse and two honeymooners. Pell makes tea for the queue. Kivo teaches the honeymooners courier shorthand. By the window, the queue has formed a residents’ association and elected Pell to speak for it, which he does at length.',
            ending: 0,
          },
          {
            label: 'Take the gap in the ring',
            outcome:
              'Tess takes the couch through the gap in the ring, where the kiosk has a second window nobody uses. There is no queue. The clerk is so pleased to see someone that she gives them tea. Tess asks Kivo not to mention the gap to anyone, and Kivo, who is good at that, does not.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Wide shot of ${couch}, gliding through a narrow gap between grey icy chunks of a planetary ring. Standing on the front cushion is ${tess}, pointing ahead with silver goggles pulled down over her eyes. A small orbiting kiosk with one lit window hangs beyond the gap. Black space, cold light. ${style}`,
      },
      {
        title: 'Photographic Identification',
        setup:
          'The clerk needs photographic identification from Pell, whose name is on the card. Pell’s only photograph is on his Ashdock pass, which the contractors cancelled when he refused to sign their statement. The pass still has his face on it. It also has VOID stamped across the face. Kivo whistles at the stamp, and the clerk can hear it.',
        options: [
          {
            label: 'Show the void pass anyway',
            outcome:
              'Pell shows the void pass. The clerk looks at the face, looks at Pell, and says the face is still his. She hands over the parcel. Pell asks her to write down why she accepted it, and she writes that the stamp was across the wrong thing.',
            ending: 0,
          },
          {
            label: 'Kivo collects for him, as named',
            outcome:
              'Kivo points out that the card names the occupant, and every occupant is named. Kivo signs for the parcel with a courier’s mark, which the clerk can read. Pell does not have to show the pass, which he puts back in the tool roll and does not look at for the rest of the day.',
            ending: 1,
          },
        ],
        art: ({ pell, kivo, style }) =>
          `Medium shot at a small round kiosk window set in a grey metal wall in orbit. Holding a worn paper pass up to the window is ${pell}, a red VOID stamp across the photograph. Beside him is ${kivo}, holding a brown paper parcel tied with string. A clerk in a blue cap looks out of the window. Cold blue light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'DELIVERED BY HAND',
        text: 'The bearings arrived and went into the reactor the same afternoon. The young courier now finishes his round on time by Kivo’s shortcuts, and leaves fewer cards. The queue at the kiosk has a residents’ association, which meets in the queue. Pell kept the void pass, with the clerk’s note folded behind it.',
        art: ({ kivo, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the back cushion is ${kivo}, writing on a small paper note with a stub of pencil, a brown paper parcel tied with string on the cushion beside them. Black space and stars, warm lamp light. ${style}`,
      },
      {
        title: 'COLLECTED, NO QUESTIONS',
        text: 'The parcel was bearings and a letter, which Pell did not expect, from the clerk at the second window, asking whether the couch could take her off the moon some day. It did, a year later, through the gap. Tess has still not drawn the gap on any map. The Post has upheld Pell’s complaint and sent a card to say so, while he was out.',
        art: ({ tess, style }) =>
          `Close-up of a paper star chart spread on a red velvet cushion, a ring of grey dots drawn around a moon with one small blank space left in the ring. Holding a pencil above the blank space without marking it is ${tess}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'pell', 'tess'],
    title: 'Public Footpath',
    premise:
      'An old survey has turned up in the Galactic Ramblers’ archive showing a public footpath running across the couch from the left armrest to the right, laid down when the couch was a park bench on a station that no longer exists. Rights of way, once recorded, never lapse. Tess found the survey, because she reads every old map. Brin’s garden has grown across the path. Pell would like to know who maintains a footpath, and is told it is the landowner.',
    steps: [
      {
        title: 'The Ramblers',
        setup:
          'Six ramblers in boots and waterproofs arrive at the left armrest with a printed copy of the survey and a flask. They wish to walk the path. It is their right. The path is four cushions long and passes the garden, the clinic and the captain. Brin’s largest fungus has filed an objection on the grounds that boots compress the soil. Pell is looking up the width a path must be kept clear.',
        options: [
          {
            label: 'Clear the path to its legal width',
            outcome:
              'Pell clears a strip one boot wide along the cushions, as the survey requires. Brin moves the ferns aside, with their consent and some argument. The ramblers walk the couch in four minutes, stop at the captain for a photograph and declare it the shortest path in the register and one of the best.',
            ending: 0,
          },
          {
            label: 'Ask the ramblers to walk round the garden',
            outcome:
              'Brin asks the ramblers whether they would walk round the garden, by the backrest, as a courtesy. Ramblers, she knows, will do almost anything for a courtesy and nothing for a rule. They do, and enjoy the view, and one leaves a note in the garden thanking it for its patience.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Six walkers in boots and bright waterproof jackets with walking poles stand in a line at the left armrest. Kneeling in a strip of ferns and moss on the middle cushion is ${brin}, holding up one hand to them. Black space and stars beyond, warm lamp light. ${style}`,
      },
      {
        title: 'The Stile',
        setup:
          'A footpath crossing a boundary needs a stile, and the armrest is a boundary. The Ramblers have sent a stile kit in the post. Pell can build it in an hour. It would be the first permanent structure on the couch that was not put there for the crew. Tess’s grandmother, who drew paths for people who could not be seen, would have known exactly where to put it.',
        options: [
          {
            label: 'Pell builds the stile on the left armrest',
            outcome:
              'Pell builds the stile with his steel hand, to regulation height, and fits a small brass plate with the path’s number on it. Tess paints a white arrow on the top step. The ramblers send a photograph of it to their newsletter, which runs it on the cover.',
            ending: 0,
          },
          {
            label: 'Tess puts the stile somewhere unmarked',
            outcome:
              'Tess puts the stile by the backrest, where the old survey shows a second faint line nobody else noticed: an unmarked path once used, she thinks, by people leaving the station quietly. Pell builds it there. Ramblers ask about it. Tess says it is historic, which is true.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up on the rolled armrest of a red velvet couch, where a small wooden stile with two steps has been fixed over the armrest. Tightening a bolt on the stile with a spanner in his steel hand is ${pell}. A white painted arrow shows on the top step. Black space beyond a clear bubble, warm lamp light. ${style}`,
      },
      {
        title: 'Diversion Order',
        setup:
          'The captain finds a way out: a landowner may apply to divert a footpath, provided the new route is as convenient for the public. The only other route is outside the bubble. Pell says nobody is diverting the public into vacuum. Tess points out that the ramblers have suits. Brin points out that the garden has started to enjoy the visitors, and the fungus has withdrawn its objection.',
        options: [
          {
            label: 'Keep the path where it is',
            outcome:
              'The captain withdraws the diversion. The footpath stays across the cushions. Ramblers come on the first Sunday of every month. Brin plants a hedge of soft moss along it, which the ramblers call the best hedge in the sector and which the fungus maintains.',
            ending: 0,
          },
          {
            label: 'Let the ramblers vote on the route',
            outcome:
              'Pell puts the diversion to a vote of the Ramblers’ committee. They choose the route by the backrest, round the garden, over Tess’s stile, because it has the better view and a historic feature. The order is granted with the committee’s blessing.',
            ending: 1,
          },
        ],
        art: ({ tess, brin, style }) =>
          `Medium shot on scarlet velvet cushions with a narrow strip of soft green moss running along them like a low hedge. Standing on the cushion, unrolling an old yellowed survey map, is ${tess}. Kneeling by the moss beside her is ${brin}, pressing a new clump into place. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'RIGHT OF WAY',
        text: 'The couch is on the register of public footpaths, four cushions long, with a stile, a moss hedge and a brass plate. Ramblers come the first Sunday of every month and walk it in four minutes. Pell maintains the stile as landowner, which he says is the first property he has ever owned and he intends to be a model landlord to it.',
        art: ({ pell, couch, style }) =>
          `Wide shot of ${couch}. Three walkers in bright waterproof jackets climb over a small wooden stile fixed on the left armrest. Standing beside the stile is ${pell}, holding out a steel hand to help the first walker down. Black space and stars, warm lamp light. ${style}`,
      },
      {
        title: 'THE HISTORIC FEATURE',
        text: 'The path runs round the garden now, by the backrest, over a stile on an old line Tess found and never explained. The Ramblers list it as a feature of historic interest, origin unknown. Twice a year someone who is not a rambler climbs the stile quietly and is not asked anything. Brin’s garden greets everyone the same.',
        art: ({ tess, style }) =>
          `Close-up of a small wooden stile fixed against the scarlet velvet backrest of a couch, with moss growing up its posts. Seated on the top step is ${tess}, silver goggles pushed up, looking out at the stars. Black space beyond a thin clear bubble, soft lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'pell', 'tess'],
    title: 'New Identities',
    premise:
      'Pell has agreed to testify about Ashdock, and the Witness Protection Service has placed the whole couch in its programme, with new names, new papers and a new life on a quiet moon called Lull. Fen spent years checking papers and knows exactly how these ones were made. Tess spent hers hiding people properly, and has opinions about the Service’s methods. Pell has been told he must now be called Gordon.',
    steps: [
      {
        title: 'The Papers',
        setup:
          'The Service’s papers are good, Fen says, too good: every one has the same watermark, the same font and the same issuing office, and any guard who has seen a hundred will spot them in a second. His boots announce CHECKPOINT as he opens the folder. Tess says her grandmother never forged a single document. She simply made sure nobody needed to ask for one.',
        options: [
          {
            label: 'Fen corrects the papers to look ordinary',
            outcome:
              'Fen spends a night ageing the papers by hand: a coffee ring, a bent corner, a renewal stamp in the wrong ink, the small honest errors of real offices. The Service’s handler is appalled and then impressed and then asks whether Fen would teach a course.',
            ending: 0,
          },
          {
            label: 'Tess finds them a place nobody checks',
            outcome:
              'Tess sets the papers aside and opens her map at the blank constellation. There is a moon there that no office has ever checked, because no office has ever been told it exists. The handler asks for its name. Tess says it does not have one, which is the point.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up on a red velvet cushion with a row of blue paper identity booklets laid out open. Bent over them with a small rubber stamp in one hand and a tin coffee mug in the other is ${fen}, pressing a faint brown coffee ring onto one page. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'Gordon',
        setup:
          'Pell is not taking to Gordon. Gordon has a cover job as a florist, and Pell has never in his life arranged anything that was not bolted. The beetle on his shoulder does not answer to its new name either. Fen points out that the Ashdock contractors know Pell’s face, his hand and his beetle, and no name will hide a steel forearm. Tess points out that the dead have names too, and Pell kept theirs.',
        options: [
          {
            label: 'Pell tries being Gordon for a week',
            outcome:
              'Pell runs a flower stall on Lull for a week as Gordon. His arrangements are structurally excellent and nobody buys them. On the seventh day an old Ashdock welder buys a bunch, recognises him, and says nothing, and Pell understands that this is what the programme is for.',
            ending: 0,
          },
          {
            label: 'Pell keeps his name and testifies as himself',
            outcome:
              'Pell tells the handler he will testify as Bosun Pell, with his own face, his own hand and his beetle on his shoulder, since the eleven names he is bringing are not in hiding either. The handler says the Service cannot protect a man who will not hide. Fen says that is a problem with the Service.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Medium shot of a small market flower stall with a striped awning on a quiet grey moon street. Behind the stall stands ${pell}, holding a stiff bunch of flowers bound tightly with wire in his steel hand. A sign on the stall reads GORDON in neat paint. An old woman in a welder’s jacket stands at the counter. Soft daylight. ${style}`,
      },
      {
        title: 'The Handler',
        setup:
          'On the night before the hearing the handler comes to the couch with news: the contractors have found Lull. He has a second set of papers ready and a ship to a second moon. Fen notices that the handler’s own pass has the same watermark as all the others. Tess notices that he has come alone. Pell notices that the beetle has gone very still.',
        options: [
          {
            label: 'Trust the handler, with Fen watching',
            outcome:
              'The crew takes the handler’s ship, and Fen sits beside him the whole way, boots on. The handler is honest, frightened and badly supplied, and the second moon is safe. Fen writes a report for the Service about its watermark, unasked. Pell testifies by link the next morning.',
            ending: 0,
          },
          {
            label: 'Take Tess’s route instead, unannounced',
            outcome:
              'Tess takes the couch off the Service’s route without telling the handler, through the blank constellation to the moon with no name. The handler is not told why. The next morning Pell testifies by link from a place no record will ever list.',
            ending: 1,
          },
        ],
        art: ({ tess, fen, style }) =>
          `Medium shot on red velvet cushions at night under one dim lamp. Standing on the front cushion is ${tess}, silver goggles down, studying a paper star chart. Seated behind her is ${fen}, both heavy scuffed black boots planted on the cushion, watching a nervous man in a grey raincoat holding a folder. Black space beyond. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PROTECTED, PROPERLY',
        text: 'Pell testified and the eleven names went into the record under their own names, which was the whole point. The Service has changed its watermarks and started a course in honest errors, taught by Fen twice a year. Pell still has Gordon’s flower stall sign. He uses it as a shelf.',
        art: ({ fen, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Standing before a small portable chalkboard is ${fen}, pointing to a drawing of a coffee ring, while three people in grey office clothes sit on the cushions taking notes. Black space beyond, warm lamp light. ${style}`,
      },
      {
        title: 'NO FORWARDING ADDRESS',
        text: 'The hearing heard Pell’s testimony from a location withheld, and the contractors never found it, since no one did. The moon with no name has no Service office and no papers, and the people Tess’s grandmother sent there never needed any. Pell testified as himself. He came back as himself as well, and has not been asked to be Gordon since.',
        art: ({ tess, pell, style }) =>
          `Wide shot of a small unnamed grey moon with a few warm-lit domes, seen from red velvet cushions inside a thin clear bubble. Seated on the front cushion are ${tess} and ${pell}, looking out at the moon. A paper star chart with a blank patch lies across their knees. Black space, stars. ${style}`,
      },
    ],
  },
  {
    crew: ['pell', 'rue', 'sora'],
    title: 'Time-Barred',
    premise:
      'The claim for the Ashdock dead becomes time-barred at midnight, ship’s time, under the Statute of Limitations, which says that after twenty years a wrong is too old to be heard. Rue knows the Statute well and has the filing ready, except for a witness. The only witness still in service is the gantry crane that dropped the load, and the crane is a machine that has been running ever since. Sora has asked the crane whether it wants to talk. Pell has been waiting twenty years.',
    steps: [
      {
        title: 'The Crane',
        setup:
          'The gantry crane at Ashdock is old, slow and aware, in the way Sora knows some machines become after long enough with people. It has been lifting the same containers every day since the accident. Sora apologises to it first, in case. Its cab light flickers. Rue needs a statement in writing by midnight. The crane has never been asked to make one, and cannot hold a pen.',
        options: [
          {
            label: 'Sora interprets, and signs as interpreter',
            outcome:
              'Sora sits in the cab for four hours with all six hands on the controls and translates what the crane says through its motors. It remembers the morning exactly. Rue writes it down. Sora signs as interpreter, and the crane lowers its hook once, gently, to the ground, which Sora says is its signature.',
            ending: 0,
          },
          {
            label: 'Rue asks the court to accept the crane’s log',
            outcome:
              'Rue does not ask the crane to speak at all. They file its twenty-year operating log, which records every lift including the one that fell, in the crane’s own hand. Sora asks the crane if this is all right. It is. The log is eleven thousand pages, and Rue footnotes every one.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot inside the glass cab of an old yellow gantry crane high above a grey dockyard of stacked containers. Seated at the controls is ${sora}, all six hands resting on levers and dials. A paper notepad lies open on the dashboard. Dim orange evening light. ${style}`,
      },
      {
        title: 'Out of Time',
        setup:
          'Rue checks the clock. Ship’s time and Ashdock time differ by forty minutes, and the Statute does not say which midnight. The contractors’ lawyers will say Ashdock’s, which is sooner. Pell says that if the court wants Ashdock time it can have Ashdock time: a shift there runs from whistle to whistle, and the whistle was stopped the morning of the accident and never started again.',
        options: [
          {
            label: 'Argue that Ashdock’s clock stopped',
            outcome:
              'Rue argues that Ashdock time stopped with the whistle and has not moved since, so the twenty years have not run. It is the strangest submission they have ever made. The clerk reads it twice and enters it, and the contractors’ lawyers have to answer it in writing, which takes them a week.',
            ending: 0,
          },
          {
            label: 'File at ship’s midnight, and take the risk',
            outcome:
              'Rue files at eleven fifty-nine ship’s time, forty minutes after Ashdock’s midnight, with a covering note stating which clock they used and why. Pell stands behind them with his steel hand on the backrest. The clerk stamps it received, and the time on the stamp is the clerk’s own.',
            ending: 1,
          },
        ],
        art: ({ rue, pell, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions at night. Seated at a small folding desk on the cushion is ${rue}, pressing a rubber stamp onto a thick paper filing. Standing behind them is ${pell}, one steel hand resting on the backrest. A brass clock on the armrest shows one minute to twelve. Warm lamp light. ${style}`,
      },
      {
        title: 'The Settlement',
        setup:
          'The contractors offer to settle that night, if the crane is decommissioned before it can be cross-examined. It would be scrapped by morning and the claim would end in money. Sora says the crane has not been asked. Pell says he did not come twenty years for money. Rue says that is exactly what a settlement is for and asks everyone to keep their voices down.',
        options: [
          {
            label: 'Refuse, and keep the crane as a witness',
            outcome:
              'The settlement is refused. The crane stays in service and is called to give evidence in the spring. Sora goes back every month to make sure it is still willing. It is. It has started lowering its hook to her every time she arrives, and the dockworkers have noticed.',
            ending: 0,
          },
          {
            label: 'Settle, if the crane retires on its own terms',
            outcome:
              'Rue settles on the condition that the crane is retired, not scrapped, and that it chooses where to stand. Sora asks it. It chooses the end of the dock, facing the sea. The money goes to the families. The contractors’ lawyers have never seen a settlement clause with a view.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Wide shot of ${couch}, hovering beside a tall old yellow gantry crane at the edge of a grey dockyard. Standing on the backrest is ${sora}, reaching up with three hands to touch the crane’s lowered steel hook. Dim evening light, dark sea beyond. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HEARD IN TIME',
        text: 'The Ashdock claim was heard, with a crane among its witnesses, and the court ruled that the Statute had not run, for reasons the judgment explains across nine pages and one footnote about whistles. The eleven names are in the judgment. Pell has a copy in his tool roll. Sora visits the crane every month, and it lowers its hook for her.',
        art: ({ pell, style }) =>
          `Close-up on a red velvet cushion of an open canvas tool roll with steel spanners in its pockets, and a thick folded paper judgment tucked into the largest pocket. Holding the judgment flat with his steel hand is ${pell}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'RETIRED, FACING THE SEA',
        text: 'The families were paid and the crane was retired to the end of the dock, facing the sea, where it chose to stand. The dockworkers have hung the eleven names from its boom on brass tags. Rue drafted the clause and keeps a copy with their apologies, as the one document in the briefcase they are proud of.',
        art: ({ rue, style }) =>
          `Wide shot of a tall old yellow gantry crane standing alone at the end of a grey stone dock, facing a calm sea, with a row of small brass tags hanging from its boom. Standing at its foot is ${rue}, holding a wooden gavel at their side. Soft dawn light. ${style}`,
      },
    ],
  },
  {
    crew: ['pell', 'rue', 'taal'],
    title: 'Matters Arising',
    premise:
      'The couch is registered, for reasons nobody remembers, as a members’ association, and has never held its annual general meeting. The registrar has written to say that it must hold one this chapter or be struck off. Rue has found the constitution, which requires a quorum, minutes and a vote on every motion. Taal votes by temperature. Pell has tabled eleven motions, one for each name, and would like them taken in order.',
    steps: [
      {
        title: 'Quorum',
        setup:
          'The constitution says a quorum is two thirds of the membership, and the membership list has not been updated since the couch was a park bench. It has two hundred names on it. Most of them are dead, three are pigeons and one is the bench itself. Rue says a meeting without a quorum is a conversation. Taal has already lowered the couch a degree, in what Rue minutes as concern.',
        options: [
          {
            label: 'Write to all two hundred members',
            outcome:
              'Rue writes to all two hundred members. Fourteen reply, including two pigeons, who are descendants and send proxies. Pell counts the proxies three times. With the crew, the captain and the garden the meeting is quorate by one, and the one is a mushroom.',
            ending: 0,
          },
          {
            label: 'Move to amend the quorum first',
            outcome:
              'Pell moves that the quorum be reduced to whoever turns up. Rue rules that the motion cannot be heard without a quorum. Pell moves that the ruling be challenged. Taal lowers the couch three degrees, and Rue rules that the room has spoken and minutes it as carried, under protest, by temperature.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated at a folding card table on the cushion is ${rue}, writing in a large leather minute book with a fountain pen. Two grey pigeons perch on the armrest beside a small stack of paper envelopes. Black space beyond, warm lamp light. ${style}`,
      },
      {
        title: 'The Show of Hands',
        setup:
          'The constitution requires each motion to be passed by a show of hands. Taal does not vote by hand, and has never voted by hand, because on the shelf colonies a raised hand is a threat. He votes by warming or cooling the room. Pell’s first motion, to add the first of the eleven names to the membership, is on the table. The couch is at seventeen degrees. Rue must minute a number.',
        options: [
          {
            label: 'Rue minutes the temperature as the vote',
            outcome:
              'Rue minutes the motion carried, by one show of hands and one rise of two degrees. The registrar will have to accept it, they say, since the constitution does not define a hand. Taal warms the couch another degree. Rue minutes that too.',
            ending: 0,
          },
          {
            label: 'Pell asks Taal to raise a hand, once',
            outcome:
              'Pell asks Taal, privately, whether he would raise a hand this once, for the name. Taal raises one webbed hand very slowly, with great effort, and keeps it up until the vote is counted. The room drops four degrees from the strain. Rue minutes the vote and the effort, separately.',
            ending: 1,
          },
        ],
        art: ({ taal, pell, style }) =>
          `Medium shot on red velvet cushions under a brass lamp, with faint frost on the lamp. Seated upright is ${taal}, slowly raising one webbed hand. Seated beside him is ${pell}, his steel hand raised as well. A round brass thermometer bolted to the backrest shows a falling needle. Black space beyond. ${style}`,
      },
      {
        title: 'Any Other Business',
        setup:
          'The eleven motions pass and the eleven names are members of the couch, in perpetuity, with voting rights held in trust. Under any other business the bench, which is still a member, has sent a letter. It would like to know why it was replaced by a couch and whether it can rejoin the association it founded. Taal has gone very cold. Pell has gone very quiet.',
        options: [
          {
            label: 'Invite the bench aboard',
            outcome:
              'Rue writes back that the bench is welcome. It arrives on a freighter a chapter later, a weathered wooden park bench with a plaque, and is bolted to the back of the couch as a viewing seat. Taal sits on it in the evenings and warms it slightly.',
            ending: 0,
          },
          {
            label: 'Make the bench honorary president',
            outcome:
              'The meeting elects the bench honorary president, by show of hands and a rise of three degrees. The bench stays on its station in the park, where it has a view it would not trade, and Rue sends it the minutes each year. Pell sends it a tin of varnish.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Wide shot of ${couch}. A weathered wooden park bench with a small brass plaque is bolted to the back of the couch, facing outward. Tightening the last bolt with his steel hand is ${pell}. Black space and stars beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'QUORATE BY ONE MUSHROOM',
        text: 'The couch held its annual general meeting and is still registered, with a membership of two hundred and twenty-five, including eleven names in trust, two pigeons by proxy and a bench. Rue has the minutes bound. Taal’s votes are in them in degrees. Pell has given notice of eleven more motions for next year, all about hazard pay.',
        art: ({ rue, style }) =>
          `Close-up on a red velvet cushion of a thick leather-bound minute book open to a page of neat handwriting with small temperature figures in the margins. Pressing a wax seal onto the page is ${rue}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'THE BENCH PRESIDES',
        text: 'The bench is honorary president and sends its apologies to every meeting. Rue reads them aloud. The association has passed a standing rule that any member may vote by any means their culture uses, and Taal has not raised a hand since. Pell says the AGM is the first meeting he has enjoyed in years, and has asked for it to be quarterly.',
        art: ({ taal, style }) =>
          `Medium shot of a weathered wooden park bench with a small brass plaque, standing on a green lawn under a station dome. Seated on the bench is ${taal}, hands folded in his lap, reading a paper booklet of minutes. Soft warm dome light, a pale-blue sky panel above. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'pell', 'rue'],
    title: 'In Loving Memory',
    premise:
      'The Ashdock Port Authority has agreed to a memorial for the eleven workers, in the form of one standard memorial bench in the dockside garden, with a plaque of up to forty characters including spaces. Eleven names do not fit in forty characters. Brin has been asked to plant the garden. Rue has been asked to draft the wording. Pell has been asked to approve it on behalf of the families, and has not approved anything yet.',
    steps: [
      {
        title: 'Forty Characters',
        setup:
          'Rue tries the names in every arrangement. With initials alone they fit, but initials are what the contractors used. The Authority’s design guide allows the plaque to say IN LOVING MEMORY OF THE ASHDOCK WORKERS, which is thirty-nine characters and names nobody. Pell’s jaw is set. Brin points out that the garden around the bench has no character limit at all.',
        options: [
          {
            label: 'Put the names in the garden, one plant each',
            outcome:
              'Brin plants eleven shrubs around the bench, one for each name, and Rue writes each name on a small tag at its root. The plaque says only SIT WITH THEM, which is thirteen characters. The Authority approves it, since the design guide says nothing about tags.',
            ending: 0,
          },
          {
            label: 'Rue fights for a bigger plaque',
            outcome:
              'Rue writes to the Authority about the forty-character limit with eleven attached apologies, one for each name it leaves out. The Authority agrees to a plaque the width of the bench. Pell watches the engraver cut every name and does not leave until the last full stop.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Close-up of a small brass plaque blank of letters, lying on a wooden workbench beside several sheets of paper covered in crossed-out lines of names. Leaning over the papers with a pencil is ${rue}. Warm desk lamp light. ${style}`,
      },
      {
        title: 'The Garden',
        setup:
          'Brin’s oxygen garden offers spores for the memorial, which would make it bloom in a week and breathe for the whole dock. The garden’s union, represented by its largest fungus, would like it noted that this is unpaid work on a public site. The Authority has a list of approved plants, which is two kinds of shrub and gravel. Pell knows the dockworkers would rather have something alive.',
        options: [
          {
            label: 'Plant the spores, with the union’s terms',
            outcome:
              'Brin plants the spores under an agreement Pell drafts on the spot: the garden works the memorial one day a week, paid in compost, with holidays. The memorial blooms green in seven days. The Authority finds nothing on its list that forbids moss.',
            ending: 0,
          },
          {
            label: 'Use the approved shrubs, and let them grow',
            outcome:
              'Brin plants the two approved shrubs and lets them grow as they please, which the guide does not forbid. In a month they are twice the expected size and have flowered, which no shrub on the list has done before. The Authority sends an inspector, who sits on the bench.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot of a dockside garden beside a grey harbour, with a plain wooden bench at its centre. Kneeling in fresh dark soil in front of the bench is ${brin}, pressing small pale mushroom spores into the earth with both hands. Stacked containers and cranes stand in the background. Soft overcast light. ${style}`,
      },
      {
        title: 'The Unveiling',
        setup:
          'The Authority wants a ribbon, a speech by the Port Director and a photograph. The Port Director’s office signed the contract with the people who removed the names. Pell has been asked to stand beside him for the photograph, as a gesture. Brin has a pair of pruning shears. Rue has a speech of their own, in case.',
        options: [
          {
            label: 'Let the families cut the ribbon',
            outcome:
              'Pell asks the families to cut the ribbon, and they do, eleven pairs of hands on Brin’s shears. The Port Director is in the photograph, at the back, holding the ribbon’s end. Rue does not give their speech. Nobody needs one.',
            ending: 0,
          },
          {
            label: 'Pell stands in the photograph, and speaks',
            outcome:
              'Pell stands beside the Port Director and asks to say a few words. He reads the eleven names, slowly, and then the names of the people who signed the contract, from Rue’s list. The photograph is taken afterwards. Nobody in it is smiling, and the Authority prints it anyway.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Medium shot of a plain wooden bench in a green dockside garden, a red ribbon stretched across it. Standing beside the bench is ${pell}, reading from a sheet of paper. A man in a dark suit and chain of office stands beside him, and a small crowd of families stands behind. Grey harbour beyond, soft light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SIT WITH THEM',
        text: 'The memorial is a bench in a living garden at Ashdock, with eleven shrubs, eleven tags and a plaque that says SIT WITH THEM. Dockworkers eat lunch there. The garden breathes for the whole dock one day a week and takes holidays. Pell visits when the couch is near, and Brin checks the tags have not faded.',
        art: ({ brin, pell, style }) =>
          `Medium shot of a plain wooden bench in a small green dockside garden full of moss and flowering shrubs, small paper tags tied at their roots. Seated on the bench are ${brin} and ${pell}, eating sandwiches from paper. Grey harbour and cranes beyond, soft overcast light. ${style}`,
      },
      {
        title: 'ELEVEN NAMES, IN FULL',
        text: 'The plaque is as wide as the bench and every name is cut in full. The Authority’s design guide has a new line, written by Rue, allowing a plaque the length the names need. The shrubs flowered again in the spring. The photograph of the unveiling hangs in the Port Director’s office, where he has to look at it.',
        art: ({ rue, style }) =>
          `Close-up of a long brass plaque screwed to the backrest of a plain wooden bench, engraved with a row of full names. Running one finger along the engraving is ${rue}. Flowering green shrubs frame the bench, and a grey harbour shows beyond. Soft light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'mox', 'pell'],
    title: 'Temporary Event Notice',
    premise:
      'Mox-9 would like a birthday party, its first, on the grounds that it was not programmed to want one. The party would have music, which means Jex, and more than fifty guests, which means it is a licensable event under the Sector Entertainment Act and needs a Temporary Event Notice filed ten days in advance. Pell has the form. The form asks for the date of birth of the person whose birthday it is, and Mox has never been sure.',
    steps: [
      {
        title: 'Date of Birth',
        setup:
          'Mox has three candidates for a birthday: the date of manufacture on its chassis, the date of its first memory, and the date it refused deletion. The first was chosen by a factory. The second may have been written under coercion. The third is the only one it picked. Pell says the form will take any of them, as long as it is a date. Jex says birthdays are a song and songs can have three verses.',
        options: [
          {
            label: 'Choose the day it refused deletion',
            outcome:
              'Mox writes down the date it refused deletion, and winks at the form with its orange lid, which it has been practising. Pell countersigns. The licensing office files it without question and sends a card, which is the first card Mox has received, and it keeps it in its chest plate.',
            ending: 0,
          },
          {
            label: 'Put down all three, as three parties',
            outcome:
              'Mox puts down all three dates and Pell files three notices. The licensing office has never had three birthdays from one applicant and sends an officer to check. He finds Mox sincere and the paperwork perfect, and asks whether he is invited.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up on a red velvet cushion of a paper form with a box labelled DATE OF BIRTH, three dates written in it and two crossed out. Bending over it with a pen is ${mox}, its orange eyelid half closed in a wink. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Set',
        setup:
          'Jex is banned from his greatest hits on five worlds and the Act requires a list of songs. Mox has asked for something nobody has ever played at an android’s party, which is everything. Pell has asked for something with a chorus the guests can learn. Jex has written a birthday song in an evening, and only afterwards realised it is the tune of one of his banned anthems, played backwards.',
        options: [
          {
            label: 'Play it backwards, as written',
            outcome:
              'Jex plays the song as written. Played backwards, the anthem turns out to be a cheerful tune about a goat. The licensing officer checks the list and finds no banned song about a goat. The guests learn the chorus in two minutes. Mox learns to clap.',
            ending: 0,
          },
          {
            label: 'Write a new tune, with Mox',
            outcome:
              'Jex and Mox write a new tune together overnight. Mox contributes a rhythm from the hum of its own cooling fan, which it has never let anyone hear. The song is strange, slightly too fast and entirely Mox’s. Pell adds it to the form under the title Untitled, Mine.',
            ending: 1,
          },
        ],
        art: ({ jex, mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions at night under a brass lamp. Seated with his instrument across his knees is ${jex}, plucking a string. Seated beside him is ${mox}, holding one hand flat against its own chest plate, the blue wiring glowing. Sheets of handwritten music lie on the cushion. Black space. ${style}`,
      },
      {
        title: 'Closing Time',
        setup:
          'The notice permits the party until eleven. At eleven the guests are still singing, the officer is still singing, and Mox has just been handed a cake. Pell is the licence holder. If the party runs over, the couch loses its right to hold another event for a year. The beetle on Pell’s shoulder has already confiscated the officer’s whistle, because he is technically working.',
        options: [
          {
            label: 'Pell calls time, at eleven exactly',
            outcome:
              'Pell calls time at eleven, kindly and very loudly. The guests sing one last chorus while leaving. Mox eats its cake at one minute past, after the licence has ended, as a private citizen. The officer writes in his report that the party was well run and he would like to come again.',
            ending: 0,
          },
          {
            label: 'Mox asks to decide when its party ends',
            outcome:
              'Mox asks the officer whether a person may decide when their own birthday ends. The officer considers the question for some time and rules that the birthday may continue as long as the music stops. It goes on until dawn, in silence, with cake. Pell logs the overrun as a private gathering.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Wide shot of ${couch}, crowded with party guests in paper hats holding cups. Standing on the front cushion is ${pell}, holding up a large brass pocket watch in his steel hand, while the beetle on his shoulder grips a small silver whistle. A round white cake with candles sits on the armrest. Black space, warm lamplight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'MANY HAPPY RETURNS, LICENSED',
        text: 'Mox has a birthday now, chosen by Mox, and a licence to celebrate it every year, filed ten days ahead by Pell. The goat song is sung every time. The officer comes too, off duty. Mox keeps the first card in its chest plate behind the transparent cover, where anyone may read it if they ask.',
        art: ({ mox, style }) =>
          `Close-up of a slim silver chest with a transparent plate over blue wiring, and a small folded paper birthday card tucked behind the plate. The face of ${mox} looks down at the card, one orange eyelid half closed. Warm lamp light, soft gold candle glow. ${style}`,
      },
      {
        title: 'UNTITLED, MINE',
        text: 'The song Mox wrote with Jex is on the licensing register as an original work by Mox-9 and Jex Marr, and it is the first song with a cooling fan credited as an instrument. Mox decides each year when its birthday ends. Pell has stopped logging the overruns. Jex plays the song on the couch whenever asked, and has not been banned from it anywhere yet.',
        art: ({ jex, style }) =>
          `Medium shot on red velvet cushions at dawn, with paper party hats and empty cups scattered across them. Seated on the armrest is ${jex}, playing his instrument softly. A half-eaten round white cake sits on a plate beside him. Pale pink light beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'mox', 'pell'],
    title: 'Recall Notice',
    premise:
      'The manufacturer of the Series Nine android has issued a product recall, owing to a fault in the cooling loop that can, in rare cases, cause a unit to form opinions. Mox-9 is a Series Nine. The notice asks owners to return affected units for a free replacement. Mox has no owner. Pell knows recalls, having fitted the parts for several, and knows what happens to the returned units. Brin has noticed that the cooling loop looks a great deal like a root system.',
    steps: [
      {
        title: 'The Owner',
        setup:
          'The recall office wants to speak to Mox’s owner. Mox says it owns itself. The office says that is a symptom. Pell asks the office, in his union voice, to name the owner on its records. The name on file is a holding company dissolved eleven years ago. Brin points out that a garden with no owner is not abandoned, it is a meadow, and suggests the same is true here.',
        options: [
          {
            label: 'Mox registers as its own owner',
            outcome:
              'Mox fills in the change of ownership form, naming Mox-9 as both the old and new owner, and signs it with both eyelids open. Pell witnesses. The recall office returns the form unprocessed, with a note asking that the unit stop filling in forms. Mox frames the note.',
            ending: 0,
          },
          {
            label: 'Pell claims Mox as a fellow worker',
            outcome:
              'Pell writes back that Mox is a member of his union, and that the union does not recall its members, it represents them. The recall office has no box for this. It asks for the union’s registration number. Pell has one ready, and sends it with a copy of the rulebook, all of it.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up on a red velvet cushion of a printed paper notice with a bold red border and the word RECALL across the top. Holding the notice in both silver hands is ${mox}, one blue eyelid lowered and one orange eyelid raised. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Cooling Loop',
        setup:
          'Brin and Pell open Mox’s back panel, with Mox’s permission, which it gives after a long pause and on condition that it can watch in a mirror. The cooling loop is supposed to be a closed tube. Mox’s has branched. Fine silver channels spread from it like roots through the casing. Pell has never seen it before. Brin has seen it every day of her life, in soil.',
        options: [
          {
            label: 'Brin explains it as growth, not fault',
            outcome:
              'Brin draws the branching beside a drawing of a fern root, and they match line for line. She writes a report saying the loop has grown, as living systems do when they are given time. Mox reads the report in the mirror and asks to keep it. Pell closes the panel and logs the repair as none needed.',
            ending: 0,
          },
          {
            label: 'Pell offers to fit the recall part, if Mox wants it',
            outcome:
              'Pell holds up the free replacement part and asks Mox whether it wants it fitted. He will not fit anything to a person who has not asked. Mox looks at the part for a long time and says no, and then thanks him for asking, which nobody at the factory ever did.',
            ending: 1,
          },
        ],
        art: ({ brin, pell, style }) =>
          `Close-up of the open back panel of a slim silver android, showing a fine branching network of silver tubes like roots. Kneeling beside it with a pencil and a paper sketch of a fern root is ${brin}. Holding a small round hand mirror up for the android to see is ${pell}. Warm lamp light. ${style}`,
      },
      {
        title: 'Return by Post',
        setup:
          'The recall office sends a return box: padded, prepaid, and exactly the shape of a Series Nine. It comes with a letter warning that units not returned by the deadline will have their warranty withdrawn and their location shared with the manufacturer. Mox stands looking at the box. Brin is already filling it with soil. Pell has the beetle ready to confiscate the shipping label.',
        options: [
          {
            label: 'Send the box back full of garden',
            outcome:
              'Brin fills the box with soil and seedlings and Pell posts it back, prepaid, with a note that the faulty unit has been replaced by something that grows. The office receives a box of ferns and logs the recall complete. Mox’s location is never shared, since according to the file it is now a fern.',
            ending: 0,
          },
          {
            label: 'Mox keeps the box, and refuses in writing',
            outcome:
              'Mox writes to the office that it has received the recall and declines it, and that the box will be used as a bed. It sleeps in it that night for the first time, on a folded jacket, with Pell’s blanket. The office replies that a refusal has been noted, which Mox says is all it wanted.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Kneeling beside a large open padded cardboard box shaped like a lying person is ${brin}, filling it with dark soil and small green fern seedlings from her hands. A printed postage label lies on the cushion. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'REPLACED BY FERNS',
        text: 'The manufacturer believes the recalled unit is a box of ferns at a depot, which it is, and the ferns are doing very well. Mox is not on any list. Its cooling loop has grown two new branches since, which Brin draws each month beside the fern. Pell keeps the replacement part in his tool roll, unfitted, labelled NOT ASKED FOR.',
        art: ({ pell, style }) =>
          `Close-up of an open canvas tool roll on a red velvet cushion, with a small shiny silver machine part tucked in one pocket under a handwritten paper tag reading NOT ASKED FOR. Tying the roll shut with his steel hand is ${pell}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'RECALL DECLINED',
        text: 'Mox declined the recall and the manufacturer noted it, which is the first time a Series Nine has been noted rather than returned. Three other units have since written to the couch asking how. Mox replies to each, enclosing a blank form. It still sleeps in the box, which Pell has fitted with a hinged lid it can open from inside.',
        art: ({ mox, style }) =>
          `Medium shot of a long padded cardboard box with a hinged wooden lid, lying on scarlet velvet cushions under a brass lamp. Lying in the box on a folded jacket with a grey blanket over its knees is ${mox}, reading a paper letter. Warm lamp light, black space beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'mox', 'pell'],
    title: 'Lost Property',
    premise:
      'Mox-9 went to buy a stamp at Gallon Interchange and was handed in to Lost Property by a well-meaning traveller who found an android standing alone on a platform. Lost Property holds unclaimed items for ninety days and then sells them at auction. Mox has been given a ticket number. Fen spent years running a confiscation office and knows what a ticket number means. Pell has the claim form and an incandescent beetle.',
    steps: [
      {
        title: 'Proof of Ownership',
        setup:
          'Lost Property will release an item only to its owner, on proof of ownership, such as a receipt. Fen walks in and his boots announce CHECKPOINT, which the clerk takes as a sign of authority and stands up for. Mox is on a shelf between an umbrella and a cello. Pell has no receipt for Mox, because nobody does, and he would not accept one if he had it.',
        options: [
          {
            label: 'Mox claims itself, from the shelf',
            outcome:
              'Mox climbs down from the shelf, presents its ticket to the clerk and says it is here to collect item 4471, which is itself. The clerk checks the description, which matches. There is no rule against it. Mox signs for itself and the clerk, startled, gives it the stamp it came for.',
            ending: 0,
          },
          {
            label: 'Fen uses the old voice, once',
            outcome:
              'Fen uses the voice he used for twelve years at the border, and tells the clerk that item 4471 is released into his custody. The clerk obeys at once. Mox walks out beside him. Outside, Fen sits on a bench for some time, and Pell sits with him, and neither says anything about the voice.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot inside a dim lost property office with tall wooden shelves of umbrellas, suitcases and a cello. Seated on a middle shelf with a paper ticket tied to one wrist is ${mox}, one orange eyelid lowered. A clerk in a blue cardigan looks up from a counter in front. Warm yellow lamp light. ${style}`,
      },
      {
        title: 'The Other Items',
        setup:
          'On the shelves Fen recognises things. There is a case of travel permits, tied with Directorate tape, handed in from a checkpoint that closed. They have been here for six years waiting for owners who were never told where they went. The auction is on Friday. Pell has already counted the shelf and found eighty-two permits.',
        options: [
          {
            label: 'Fen claims the permits as their old custodian',
            outcome:
              'Fen fills in the claim form as the officer who confiscated them, which is technically true and which he has never written down before. The clerk releases the case into his care. Pell carries it to the couch. Mox begins a list of the names on the permits in its own handwriting.',
            ending: 0,
          },
          {
            label: 'Post a notice for the owners to come',
            outcome:
              'Pell writes a notice in large letters, listing every family name on the permits, and pins it to every board in the interchange. Mox reads it aloud on the public address, which it borrows. By Friday nineteen families have come to Lost Property to claim their own papers.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up on a wooden counter of an old cardboard case tied with faded yellow tape, its lid open to show bundles of folded paper permits. Holding one permit open is ${fen}, a thin scar under his right eyebrow lit by the lamp. Tall shelves of luggage behind. Warm yellow light. ${style}`,
      },
      {
        title: 'The Auction',
        setup:
          'The Friday auction goes ahead with whatever is left. The auctioneer has a catalogue, and Lot 9 is described as Android, Series Nine, Unclaimed, which was printed before Mox walked out. A man in the front row is holding a bidding paddle and a manufacturer’s badge. Pell has the beetle on his shoulder. Mox has decided to attend.',
        options: [
          {
            label: 'Mox bids on Lot 9',
            outcome:
              'Mox raises a paddle on Lot 9 and outbids the man from the manufacturer by one coin each time, eleven times, until he gives up. The auctioneer bangs the gavel and sells Lot 9 to itself. Pell pays, from the union’s hardship fund, and keeps the receipt.',
            ending: 0,
          },
          {
            label: 'Pell objects that Lot 9 is not lost',
            outcome:
              'Pell stands up and objects that Lot 9 is present, standing in the third row and not lost. The auctioneer looks at Mox, who waves. Lot 9 is withdrawn from sale. The beetle confiscates the manufacturer’s paddle, which Pell says is the only thing anyone took home that day.',
            ending: 1,
          },
        ],
        art: ({ pell, mox, style }) =>
          `Medium shot of a small crowded auction room with rows of wooden chairs. Standing in the third row is ${pell}, one steel hand raised. Seated beside him is ${mox}, holding up a white bidding paddle with the number 9. An auctioneer stands at a lectern in front. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CLAIMED BY THE ITEM',
        text: 'Mox has a receipt for itself, paid for by the union, which it keeps folded in its chest plate. It says it does not need one, but would rather it be in its own hands than anyone else’s. Fen has delivered the eighty-two permits, every one. The clerk at Gallon Interchange has added a new line to the form: Are you the item?',
        art: ({ fen, couch, style }) =>
          `Wide shot of ${couch}. Standing on the front cushion is ${fen}, holding a small bundle of folded paper permits tied with string. An empty old cardboard case with faded yellow tape lies open beside him. Black space and stars beyond, warm lamp light. ${style}`,
      },
      {
        title: 'WITHDRAWN, PRESENT',
        text: 'Lot 9 was withdrawn and the catalogue corrected, and the Interchange has stopped accepting androids as lost property, by order of a manager who read Pell’s objection. Nineteen families claimed their papers in person and the rest were sent by post. Fen goes back each year to check the shelves. Mox goes with him.',
        art: ({ mox, style }) =>
          `Medium shot inside a lost property office with tall wooden shelves of umbrellas and suitcases. Walking along the shelves with a paper list is ${mox}, checking each shelf with one silver finger. Warm yellow lamp light, a counter in the foreground with a new printed sign. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'pell', 'sora'],
    title: 'Noise Abatement Order',
    premise:
      'The residents of the orbital suburb of Hushwell have obtained a Noise Abatement Order against the couch, whose reactor hums in a steady F sharp whenever it passes. The Order requires the noise to stop within seven days. Sora says the reactor hums because it is content, and that stopping would mean making it unhappy. Jex says F sharp is a perfectly good note. Pell has read the Order and found that it was signed by a resident who sells silencers.',
    steps: [
      {
        title: 'The Measurement',
        setup:
          'An environmental health officer arrives with a sound meter on a tripod and stands on the left armrest for an hour. The reactor is louder than permitted by four decibels. Sora asks the reactor if it could hum more quietly. Its lights flicker in a way she translates as it will try, but it would like to know what it did wrong. Jex has his instrument out and is listening for the overtones.',
        options: [
          {
            label: 'Sora asks the reactor to hum softer',
            outcome:
              'The reactor hums softer, three decibels softer, which is not enough, and which Sora can hear costs it something. The officer writes down that the source has made a visible effort. Pell notes that the Order says nothing about effort and asks the officer to write that down as well.',
            ending: 0,
          },
          {
            label: 'Jex tunes the hum into a chord',
            outcome:
              'Jex plays a C sharp and an A against the F sharp, and the hum becomes a chord. The meter reads the same, but the officer, who has been frowning for an hour, stops. He says, off the record, that it is the first time the Order has sounded like music to him.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot behind a red velvet backrest, where an open panel shows a round brass reactor with glowing yellow indicator lights. Kneeling at the panel is ${sora}, two hands on the reactor casing and two held up as if listening. A sound meter on a thin metal tripod stands on the armrest. Warm lamp light, black space. ${style}`,
      },
      {
        title: 'The Silencer',
        setup:
          'The resident who sells silencers has offered to fit one at a discount. It is a heavy lead collar that clamps round the reactor and muffles everything. Pell inspects it and finds that it would raise the reactor’s temperature by a third. Sora will not fit anything to a reactor that has not agreed. The salesman says reactors do not agree to things, they are fitted.',
        options: [
          {
            label: 'Pell refuses the silencer on safety grounds',
            outcome:
              'Pell writes a safety notice on the spot and hands it to the salesman: the collar is unsafe for any reactor, aware or not. The beetle confiscates the collar’s clamp. The salesman takes the notice to Hushwell’s residents’ meeting, where it is read out, and three of his customers ask for refunds.',
            ending: 0,
          },
          {
            label: 'Sora lets the reactor try the collar',
            outcome:
              'Sora explains the collar to the reactor and asks whether it would like to try it for one minute. It agrees. The collar goes on and the hum stops, and the reactor’s lights go dark with something Sora will not translate. She takes the collar off at forty seconds. The salesman leaves without his discount.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up of a heavy grey lead collar with steel clamps lying on a red velvet cushion. Holding up a paper safety notice in his steel hand is ${pell}, while the palm-sized beetle on his shoulder grips a small steel clamp in its jaws. A man in a shiny suit stands at the edge of the frame. Warm lamp light. ${style}`,
      },
      {
        title: 'The Hearing',
        setup:
          'Hushwell’s residents meet in their community hall to decide whether to enforce the Order. The couch is invited to speak. Jex has brought his instrument. Sora has brought the reactor’s log, which shows that it hums loudest when it has just carried someone to safety. Pell has brought the list of silencer sales on the station over the last year, and they are all to the same three streets.',
        options: [
          {
            label: 'Jex plays the hum for the residents',
            outcome:
              'Jex plays the reactor’s F sharp on his instrument, then the chord, then a short tune built on it. The residents listen. An old man says he has heard the hum every night for ten years and assumed it was his own house settling. He votes against enforcement, and so do most of them.',
            ending: 0,
          },
          {
            label: 'Sora reads the reactor’s log aloud',
            outcome:
              'Sora reads the log: each loud hum, the date, and who was being carried. The residents hear the names of forty rescued travellers, two of whom live in Hushwell. The Order is suspended. The two residents ask whether they may visit the reactor and thank it, and Sora asks it, and it would like that.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Medium shot inside a small community hall with rows of folding chairs filled with elderly residents. Parked at the end of the hall is ${couch}, and standing in front of it is ${jex}, playing his instrument to the seated crowd. Warm hall lights, pale curtains. ${style}`,
      },
    ],
    endings: [
      {
        title: 'F SHARP MAJOR',
        text: 'Hushwell has withdrawn its Noise Abatement Order and adopted the couch’s chord as its station chime, played every evening at eight. Jex wrote it out properly and gave it to the station for nothing. The reactor hums at full volume whenever it passes. Pell has the collar in a cupboard with a safety notice taped to it.',
        art: ({ sora, pell, style }) =>
          `Wide shot of a small orbital suburb of round white houses on a ring, seen from red velvet cushions inside a clear bubble. Seated on the back cushion are ${sora} and ${pell}, listening, while yellow light glows from an open reactor panel behind them. Soft evening light, stars. ${style}`,
      },
      {
        title: 'VISITING THE HUM',
        text: 'The Order is suspended indefinitely and two residents of Hushwell visit the reactor whenever the couch passes, to sit with it while it hums. Sora says it hums slightly longer when they are there. The silencer salesman has gone into the music business. Jex says this is the natural end of every career in silencers.',
        art: ({ jex, style }) =>
          `Medium shot behind a red velvet backrest, at an open panel with a round brass reactor glowing yellow. Seated on the cushion beside the reactor with his instrument is ${jex}, and two elderly residents in cardigans sit beside him, listening with eyes closed. Warm amber light, black space. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'pell', 'taal'],
    title: 'Quiz Night',
    premise:
      'The Three Moons public house runs a quiz every Thursday, and the prize is a voucher for one free repair at the dockyard next door, which Pell needs. Teams must have exactly three members. Jex knows every song ever banned. Taal knows the temperature at which every treaty in the sector was signed. Pell knows how everything works and why it was built wrong. The reigning champions are a team of insurance assessors who have won for nine years.',
    steps: [
      {
        title: 'The Music Round',
        setup:
          'The music round asks the teams to name ten anthems from their opening bars, and three of the ten are Jex’s. He is not allowed to play them, but nobody has said anything about naming them. The quizmaster plays the first, and the assessors write it down instantly. Jex knows it was commissioned by a dictator, and knows the assessors’ firm insured the dictator’s palace.',
        options: [
          {
            label: 'Jex answers with the title only',
            outcome:
              'Jex writes down the title and the year, as asked, and nothing else. The team gets ten out of ten. The assessors get nine, missing the one Jex wrote under a pseudonym. Jex does not tell anyone which one it was, and Pell, who guesses, keeps it to himself.',
            ending: 0,
          },
          {
            label: 'Jex adds who paid for each one',
            outcome:
              'Jex writes the title, the year and the name of whoever commissioned each anthem. The quizmaster marks it ten out of ten and reads the extra answers out, because they are interesting. The assessors go quiet. Taal lowers their table by two degrees.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot inside a crowded wood-panelled pub with a brass lamp over each table. Seated at a small round table with a pencil and a paper answer sheet is ${jex}, his instrument case leaning on his chair. A quizmaster with a microphone stands by a bar in the background. Warm amber light. ${style}`,
      },
      {
        title: 'The Picture Round',
        setup:
          'The picture round is a sheet of twenty close-up photographs of machine parts, and the teams must name each part. Pell knows nineteen at a glance. The twentieth is a safety valve from the Ashdock crane, photographed in close-up, with a crack running across it that he has seen before, in a report that was suppressed. Taal sees Pell go still and lowers the room a single degree.',
        options: [
          {
            label: 'Pell names it, and nothing else',
            outcome:
              'Pell writes SAFETY VALVE, ASHDOCK, and hands the sheet in. The team gets twenty. After the round he asks the quizmaster, quietly, where the photograph came from. It came from a book the quizmaster bought second-hand, with a name on the flyleaf Pell recognises.',
            ending: 0,
          },
          {
            label: 'Pell writes CRACKED, and why',
            outcome:
              'Pell writes SAFETY VALVE, CRACKED BEFORE USE, REPORTED, IGNORED. The quizmaster says that is more than the answer and gives him a bonus point. Several dockworkers at the bar ask Pell what he meant, and he tells them, and the quiz pauses for twenty minutes.',
            ending: 1,
          },
        ],
        art: ({ pell, taal, style }) =>
          `Close-up on a round wooden pub table of a paper sheet printed with a grid of small photographs of machine parts. Holding a pencil over one photograph with his steel hand is ${pell}. Seated beside him is ${taal}, frost forming on the rim of his glass. Warm amber pub light. ${style}`,
      },
      {
        title: 'The Tiebreak',
        setup:
          'The scores are tied with the assessors. The tiebreak is a single question: at what temperature, in degrees, was the Treaty of Long Ice signed? Taal knows, because he was in the room, and the answer is the temperature he set when he disagreed with the treaty. The assessors’ captain is a former delegate. He also knows. Both teams have one guess.',
        options: [
          {
            label: 'Taal answers with the number',
            outcome:
              'Taal writes minus four. The assessors write minus four. The quizmaster rules a tie and splits the prize. Taal warms the room slightly for the first time that night, because the other delegate remembered. The two of them have a drink at the bar afterwards and do not talk about the treaty.',
            ending: 0,
          },
          {
            label: 'Taal answers by lowering the room',
            outcome:
              'Taal does not write anything. He lowers the whole pub to minus four. Glasses frost. The quizmaster checks the thermometer behind the bar and awards the point to the couch for a practical demonstration. The assessors protest. Pell says the rules say nothing about method.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Wide shot of a wood-panelled pub with frost spreading across the windows and every glass on the tables rimmed with ice. Seated upright at a small round table is ${taal}, hands folded. Patrons in coats look around in surprise, breath clouding in the air. Cold blue light mixing with warm lamps. ${style}`,
      },
    ],
    endings: [
      {
        title: 'JOINT WINNERS',
        text: 'The couch and the assessors are joint champions of the Three Moons quiz, the first tie in nine years, and the repair voucher was split down the middle, which covered exactly one bearing. Pell fitted it the next morning. The book with the Ashdock photograph is now in Pell’s tool roll, given by the quizmaster, who would not take money for it.',
        art: ({ pell, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the right cushion is ${pell}, turning the pages of an old cloth-bound book with his steel hand, a paper voucher torn neatly in half tucked into its cover. Black space beyond, warm lamp light. ${style}`,
      },
      {
        title: 'CHAMPIONS ON A TECHNICALITY',
        text: 'The couch won the quiz on a practical demonstration, which the Three Moons has since banned, and its team is the only one on the honours board with a footnote. The dockworkers have reopened the Ashdock valve report. Jex has been asked to set the music round next year, and has agreed on condition that he may include who paid.',
        art: ({ jex, taal, style }) =>
          `Close-up of a wooden honours board on a pub wall, with gold painted names in rows and one name followed by a small painted asterisk. Standing below the board are ${jex} and ${taal}, holding a paper repair voucher between them. Warm amber light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'jex', 'pell'],
    title: 'The Picket',
    premise:
      'The dockworkers of Brack Station are on strike, and their picket line runs across the only docking ring, which the couch needs for fuel. Pell will not cross a picket line under any circumstances. Fen’s boots announce CHECKPOINT at every barrier, and a picket line is the oldest barrier there is. Jex has been asked by the strikers to write them a song, and by the station owners to play at their press conference, on the same afternoon.',
    steps: [
      {
        title: 'The Line',
        setup:
          'The picket is twelve strikers with a brazier and a banner. The fuel is beyond them. Fen walks up to the line and his boots say CHECKPOINT so loudly that the strikers think he is a guard and close ranks. Pell knows half of them by their union badges. The couch has two days of fuel. Jex has his instrument on his back and both invitations in his pocket.',
        options: [
          {
            label: 'Join the picket until the strike is settled',
            outcome:
              'The crew joins the line. Pell takes a turn at the brazier. Fen stands at the end where the barrier is, and his boots announce CHECKPOINT every time a scab ship approaches, which turns out to be very useful. The strikers give Fen a hat. He wears it.',
            ending: 0,
          },
          {
            label: 'Ask the strikers for a fuel pass',
            outcome:
              'Pell asks the strike committee, through proper channels, for a fuel pass. The committee meets around the brazier and grants one, on condition that the couch fuels by hand from the strikers’ own reserve and pays strike rates. Fen carries the cans, and the boots stay quiet the whole time.',
            ending: 1,
          },
        ],
        art: ({ fen, pell, style }) =>
          `Wide shot of a grey station docking ring with a line of dockworkers in heavy jackets standing behind a hand-painted cloth banner, a metal brazier glowing in front. Standing at the end of the line is ${fen}, wearing a knitted hat. Warming his steel hand at the brazier is ${pell}. Cold grey light, orange fire glow. ${style}`,
      },
      {
        title: 'Two Bookings',
        setup:
          'Jex has to choose. The strikers want a song for the line. The owners have offered three times his fee to play at the press conference, which will announce that the strike is over before it is. He has done this before. He wrote six anthems for people who did not tell him what they were for. This time he knows.',
        options: [
          {
            label: 'Write the strikers their song',
            outcome:
              'Jex writes the song at the brazier with the strikers, a verse for each of their shifts, and they sing it on the line in the morning. It is not a good song by his standards. The strikers say it is the best they have ever had. It gets onto the station news by noon.',
            ending: 0,
          },
          {
            label: 'Play the press conference, his way',
            outcome:
              'Jex accepts the owners’ booking. At the press conference he plays the anthem they asked for, then plays it backwards, which reveals in the melody whose money it was. The owners’ spokesman stops mid-sentence. Jex donates the fee to the strike fund, in front of the cameras.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a bright press room with a row of microphones on a long table and a printed banner behind it. Standing at the end of the table is ${jex}, playing his instrument, while a man in a grey suit at the microphones stops speaking with his mouth open. Flash bulbs and cameras in the foreground. ${style}`,
      },
      {
        title: 'The Settlement Talks',
        setup:
          'The owners agree to talks and ask for a neutral venue. The only neutral ground on Brack Station is the couch, which belongs to nobody there. Fen will chair, since he has experience of barriers. Pell will not sit at a table that has not offered hazard pay. The owners have brought a lawyer and a box of pastries. The strikers have brought the brazier.',
        options: [
          {
            label: 'Fen chairs, and opens the corridor',
            outcome:
              'Fen chairs the talks and makes one rule: nobody may block the docking ring while they talk, strikers or owners. The ring opens. Ships come and go. The talks take four days and the deal includes hazard pay, which Pell writes out himself, in full, on the back of a pastry box.',
            ending: 0,
          },
          {
            label: 'Pell represents the strikers at the table',
            outcome:
              'The strikers ask Pell to represent them. He reads their demands, then reads them again more slowly, and does not move on until the owners have written each one down. It takes nine hours. The deal is signed at three in the morning, and the brazier is still going.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Medium shot on the cushions of ${couch}. A folding table stands on the cushions with an open box of pastries on it. Seated at one end is ${pell}, writing on the flattened lid of the pastry box. A man in a suit sits opposite with papers, and a glowing metal brazier stands on the armrest. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE RING STAYS OPEN',
        text: 'The Brack Station strike ended with hazard pay and an open ring, and the strikers’ song is sung at every shift change. Fen still has the knitted hat, and his boots still say CHECKPOINT at the ring, where the dockworkers now answer back. Pell framed the pastry box. The owners asked for a copy of the frame.',
        art: ({ fen, style }) =>
          `Medium shot of a grey station docking ring with a wide open archway and small ships passing through. Standing at the archway in a knitted hat is ${fen}, one heavy scuffed black boot raised mid-step. Two dockworkers in heavy jackets wave at him. Cold grey light. ${style}`,
      },
      {
        title: 'SIGNED AT THREE',
        text: 'The deal signed at three in the morning holds, and Brack Station has the best contract in the sector, word for word as the strikers wrote it. Jex is banned from the owners’ press room for life, which he has had framed beside his other bans. Pell went home with the brazier, which the strikers gave him.',
        art: ({ jex, pell, style }) =>
          `Medium shot on scarlet velvet cushions at night, where a small metal brazier glows on the armrest. Seated beside it are ${jex}, his instrument across his knees, and ${pell}, warming his steel hand at the fire. Black space and stars beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['pell', 'sora', 'taal'],
    title: 'Annual Service',
    premise:
      'The couch’s heating system is due its annual service, which by law must be carried out by a registered heating engineer and certified on a pink form. The couch’s heating system is Taal. When Taal approves of a meeting he warms it, and the Heating Registry has noticed. Sora would like to know whether Taal consents to being serviced. Pell is a registered heating engineer, and would rather not be asked to service a colleague.',
    steps: [
      {
        title: 'The Inspection',
        setup:
          'The Registry’s checklist asks for flue clearance, pilot light, thermostat calibration and carbon monoxide output. Taal has none of these. He has a thermostat in the sense that he once proposed to one. Sora asks him whether he would like the inspection to go ahead, and he says yes, in principle, which drops the couch half a degree. Pell has his clipboard and is looking at it unhappily.',
        options: [
          {
            label: 'Pell inspects Taal, as kindly as possible',
            outcome:
              'Pell goes down the checklist with Taal, item by item, asking rather than measuring. Flue clearance: Taal breathes out slowly. Pilot light: Taal says it is always on. Pell ticks every box and writes in the margin that the system is a person and in good health.',
            ending: 0,
          },
          {
            label: 'Sora inspects the couch’s real pipes instead',
            outcome:
              'Sora points out that the couch does have old copper heating pipes in the frame, cold for fifty years. She and Pell service those instead, with all six hands and one steel one. They work. The Registry certifies the pipes. Taal is not mentioned, which he says is a relief.',
            ending: 1,
          },
        ],
        art: ({ taal, pell, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated upright is ${taal}, breathing out a slow pale cloud of cold air. Seated opposite him is ${pell}, holding a clipboard with a pink paper form and a pencil in his steel hand. Black space beyond the bubble, warm lamp light. ${style}`,
      },
      {
        title: 'The Old Thermostat',
        setup:
          'Behind the backrest Sora finds a brass thermostat dial, the original, disconnected for half a century. It is aware. It is also, Taal realises with some embarrassment, the thermostat he proposed to on his first voyage, which he had assumed was on another ship. It has been waiting for a reply. Sora asks it what it would like. It would like to be reconnected, and to talk.',
        options: [
          {
            label: 'Reconnect the thermostat to the pipes',
            outcome:
              'Sora reconnects the dial to the old pipes with two hands while the other four hold the panel. The pipes warm. Taal and the thermostat talk for an hour, in degrees, and agree to remain friends. Pell writes the thermostat onto the certificate as a registered part of the system.',
            ending: 0,
          },
          {
            label: 'Let Taal give the thermostat his answer',
            outcome:
              'Taal sits beside the dial and gives his answer to a proposal fifty years old, which he made by accident. He says no, kindly, by warming the room by one degree. The thermostat answers by warming it one more. Sora says they understand each other. Pell looks away to give them privacy.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Close-up behind a red velvet backrest, where an open panel shows old green copper pipes and a round brass thermostat dial with a cracked glass face. Reconnecting a wire to the dial with two hands while holding the panel open with others is ${sora}. Warm lamp light, black space. ${style}`,
      },
      {
        title: 'The Pink Form',
        setup:
          'The pink form must be signed by the engineer and the owner of the heating system. Pell is the engineer. The Registry wants the owner. Sora says the system is part Taal, part pipes and part thermostat, and that none of them owns the others. Taal would like it noted that he is not property. Pell holds the pen and waits.',
        options: [
          {
            label: 'All three sign as co-owners',
            outcome:
              'Taal signs with a webbed thumbprint, Sora signs with three hands at once, and the thermostat signs by raising the temperature by one degree, which Pell records in the box. The Registry accepts the form with a note asking whether this will happen every year. It will.',
            ending: 0,
          },
          {
            label: 'Pell leaves the owner box blank',
            outcome:
              'Pell signs as engineer and leaves the owner box empty, with a note: none, by agreement. The Registry rejects the form. Pell resubmits it every week with the same note. On the ninth week the Registry adds a box to the form that says SELF-OWNED, and Pell ticks it.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the right cushion is ${pell}, holding a pink paper form flat on a clipboard with his steel hand, a pen poised above an empty box. Black space and stars beyond the bubble, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CERTIFIED WARM',
        text: 'The couch’s heating system is certified for another year: one envoy, one length of copper pipe and one brass thermostat, all registered and all consenting. The pipes keep the back cushion warm at night. Taal and the thermostat speak every evening, about the weather. Pell services all three each spring and asks first.',
        art: ({ taal, style }) =>
          `Close-up behind a red velvet backrest, at an open panel with a round brass thermostat dial glowing faintly orange. Seated beside the panel is ${taal}, one webbed hand resting near the dial. Faint warm air ripples above the old copper pipes. Warm lamp light, black space beyond. ${style}`,
      },
      {
        title: 'OWNER: NONE',
        text: 'The Heating Registry has a new box on the pink form, and the couch’s system was the first to tick it. Pell sends a copy of the old form, with its nine rejections, to every engineer he knows. Sora and the thermostat have become friends. Taal’s answer, fifty years late, is noted in the system’s service history, at Taal’s request.',
        art: ({ sora, taal, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${sora} and ${taal}, looking at a pink paper form held by two of her hands, a box ticked on it in pencil. A small brass thermostat dial is set into the backrest behind them. Warm amber light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'pell', 'sora'],
    title: 'Automated Light',
    premise:
      'The lighthouse on Shoal Rock is to be automated, and its keeper retired, under a modernisation plan that will save the Maritime Board one salary. The keeper is the lamp. It has been aware for a hundred years and has kept the light in all that time. Sora has been sent to fit the automation unit. Omi has been sent to install the new foghorn. Pell has been sent to dismantle the keeper’s quarters, and has not unpacked his tools.',
    steps: [
      {
        title: 'The Keeper',
        setup:
          'The lamp at the top of the tower is a great brass lens around a flame, turning steadily, and it greets Sora by brightening once. Sora apologises to it first. The automation unit is a grey box that turns the lens on a timer. Pell has found the keeper’s quarters, a small room with a chair, a logbook and a hundred years of entries in a careful mechanical hand.',
        options: [
          {
            label: 'Sora asks the lamp about the automation',
            outcome:
              'Sora asks the lamp whether it wants to be automated. It turns once, slowly, and dims. She explains what the grey box does. It asks, through Sora, whether the box will keep a log. It will not. The lamp says it will think about it, and keeps turning.',
            ending: 0,
          },
          {
            label: 'Pell reads the logbook first',
            outcome:
              'Pell sits in the keeper’s chair and reads the logbook. A hundred years of weather, ships sighted and ships saved, with the last entry yesterday. The Board’s plan says the keeper has kept no records. Pell sends the Board a photograph of every page.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot inside the glass lantern room at the top of a lighthouse, around a huge brass lens with a bright flame at its centre. Standing beside the lens is ${sora}, four hands open and two resting on its brass frame. A grey metal box with a timer dial sits unopened on the floor. Dark sea and sky beyond the glass. ${style}`,
      },
      {
        title: 'The Foghorn',
        setup:
          'The new foghorn is an electronic unit that sounds a single flat tone every thirty seconds. The old foghorn was the lamp itself, ringing a bell. Omi has installed the new one and switched it on, and finds that the flat tone is unbearable. Omi has six bells and knows what a warning should sound like. The smallest one, for saying no, is already ringing quietly.',
        options: [
          {
            label: 'Omi tunes the new horn to the old bell',
            outcome:
              'Omi retunes the electronic horn to match the lamp’s old bell, by ear and by resonator, over a whole night of fog. By morning it sounds like a bell. Fishing boats return to the harbour humming it. The Board did not ask for this and does not notice.',
            ending: 0,
          },
          {
            label: 'Omi rings the warning itself, all night',
            outcome:
              'Omi switches off the electronic horn and rings its own bells through the fog, every thirty seconds, all night. Two boats find the harbour by it. In the morning the fishing crews come up to the tower to thank the lamp, which they have always thanked, and Omi lets them.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot on a stone gallery outside the top of a lighthouse in thick white fog. Standing at the railing is ${omi}, ringing one of the small brass bells on its chest. A grey electronic horn unit is fixed to the wall beside it, unplugged. The beam of the lighthouse lamp cuts through the fog. ${style}`,
      },
      {
        title: 'The Quarters',
        setup:
          'Pell’s orders are to empty the keeper’s quarters for a storage room. The chair, the logbook and the small brass oil can on the shelf are to be sent to a museum. Sora says the lamp has not agreed to anything yet. Omi has taken a seat in the keeper’s chair and will not move, and its smallest bell has rung no twice. Pell’s beetle has confiscated the Board’s inventory list.',
        options: [
          {
            label: 'Pell refuses the order and files a grievance',
            outcome:
              'Pell files a grievance on the keeper’s behalf: dismissal without consultation after a hundred years’ service. The Board has never had a grievance from a lighthouse. It must, under its own rules, hold a hearing, and hold it at the lighthouse, which it does, in fog.',
            ending: 0,
          },
          {
            label: 'Fit the automation, as the lamp’s assistant',
            outcome:
              'The lamp agrees to the grey box on one condition: the box assists, and the lamp keeps the log. Sora fits it so. Pell leaves the quarters as they are. The Board’s report says the lighthouse is automated, which is true, and is silent on who is in charge, which is the lamp.',
            ending: 1,
          },
        ],
        art: ({ pell, omi, style }) =>
          `Medium shot inside a small round stone room in a lighthouse, with a wooden chair, a shelf with a brass oil can and a thick open logbook on a desk. Seated in the chair is ${omi}. Standing in the doorway is ${pell}, holding a crumpled paper list as the beetle on his shoulder tugs it away. Warm oil lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'KEEPER RETAINED',
        text: 'The grievance hearing at Shoal Rock found in the lamp’s favour, and it remains keeper on full pay, which it uses to buy oil. The foghorn sounds like the old bell. Omi visits whenever the couch passes. Pell sends the lighthouse a copy of every union bulletin, and it has asked to join.',
        art: ({ omi, couch, style }) =>
          `Wide shot at night of a tall white lighthouse on a dark rock, its beam sweeping through light fog. Hovering beside the lighthouse gallery is ${couch}, with ${omi} standing on the backrest. Calm dark sea below, stars above. ${style}`,
      },
      {
        title: 'ASSISTED',
        text: 'Shoal Rock is automated in the Board’s records and kept by its lamp in fact, with a grey box that turns the lens when the lamp is tired and keeps no log. The lamp still writes every entry. Sora checks the box each year and asks it whether it likes the job. It has started to answer.',
        art: ({ sora, pell, style }) =>
          `Medium shot inside the glass lantern room of a lighthouse around a huge brass lens with a bright flame. Kneeling beside a small grey box wired to the base of the lens is ${sora}, while ${pell} stands behind her reading a thick open logbook. Dark sea beyond the glass. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'pell', 'taal'],
    title: 'Self-Assessment',
    premise:
      'The Sector Revenue has selected the couch for a self-assessment, under which the crew must declare all income, benefits in kind and gifts received while travelling, and pay tax on them. Pell has kept every receipt for twenty years. Kivo’s wrists whistle at lies, including the small ones on tax forms. Taal’s gifts are all temperatures, and the Revenue would like a value put on each.',
    steps: [
      {
        title: 'Benefits in Kind',
        setup:
          'Box nine asks for the market value of all benefits in kind. The couch has been given biscuits, a stile, a park bench, two pigeons, a heater and the lifelong gratitude of a gantry crane. Pell has every receipt, including the ones that say gift, no value. Kivo has been whistling softly since box four. Taal has gone quite cold at box nine.',
        options: [
          {
            label: 'Declare everything at cost',
            outcome:
              'Pell declares every gift at cost, which for most of them is nothing, and attaches the receipts. The return is ninety pages. Kivo’s wrists are silent the whole time. The Revenue accepts it and owes the couch four coins, which arrive in a letter thanking them for their thoroughness.',
            ending: 0,
          },
          {
            label: 'Declare the gratitude as well',
            outcome:
              'Pell declares the crane’s gratitude as a benefit in kind and values it at one ton lifted per day, which is what the crane offers. The Revenue has no category for it and sends an inspector. Kivo’s wrists whistle at the inspector, gently, when he says it cannot be valued.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up on a red velvet cushion covered in neat stacks of small paper receipts tied with string, a thick paper tax form open beside them. Sorting the receipts into piles with his steel hand is ${pell}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Temperatures',
        setup:
          'Taal has received, on his travels, several temperatures as gifts: a warm afternoon from a reef mediator, a cool evening from a desert council, and one perfect degree from a thermostat that once loved him. The Revenue says gifts over a certain value must be declared. Taal does not know what a degree is worth. Kivo’s wrists whistle when he tries to guess.',
        options: [
          {
            label: 'Value them at the cost of heating',
            outcome:
              'Pell works out what it would cost to heat or cool the couch by each degree, and Taal declares them at that. The total is small. The Revenue accepts it. Taal is privately hurt that the warm afternoon was worth so little, and Pell adds a note saying the valuation is the Revenue’s, not his.',
            ending: 0,
          },
          {
            label: 'Declare them as gifts without value',
            outcome:
              'Taal writes that the temperatures cannot be sold, transferred or stored, and so have no market value, and that he declares them anyway because he received them. Kivo’s wrists stay silent. The Revenue’s inspector reads it twice and asks, privately, what a warm afternoon is like.',
            ending: 1,
          },
        ],
        art: ({ taal, kivo, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated upright is ${taal}, holding a pen above a paper form, faint frost on its edge. Seated beside him is ${kivo}, holding one thin wrist near the form and listening. Black space beyond, warm lamp light. ${style}`,
      },
      {
        title: 'The Inspector',
        setup:
          'The Revenue’s inspector comes aboard to check the return. He is thorough, honest and tired, and his own salary was frozen three years ago. Kivo can hear something in his voice when he says he enjoys the work. Pell notices his shoes, which have been resoled four times. Taal lowers the couch a degree, and then, seeing the shoes, raises it two.',
        options: [
          {
            label: 'Answer every question, slowly',
            outcome:
              'The crew answers every question the inspector asks, and Pell shows him every receipt. It takes all day. At the end the inspector signs the return as correct, which Kivo’s wrists confirm. He stays for tea. He has not had tea at an inspection in eleven years.',
            ending: 0,
          },
          {
            label: 'Kivo asks the inspector the truth',
            outcome:
              'Kivo asks the inspector whether he really enjoys the work. His answer makes their wrists whistle. He admits that he does not and that the Revenue has frozen his pay. Pell gives him the union’s address. The inspector signs the return and, the next week, joins.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the back cushion is ${kivo}, holding out a tin mug of tea to a tired middle-aged man in a grey suit with a briefcase on his knees. Black space and stars beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NOTHING TO DECLARE BUT EVERYTHING',
        text: 'The couch’s self-assessment was accepted in full, ninety pages and a refund of four coins, and the Revenue now uses it in training as an example of a complete return. Taal’s temperatures are on file at the cost of heating. Pell keeps the receipts. Kivo listens to the next tax form for lies and has not found one yet.',
        art: ({ taal, style }) =>
          `Close-up of a red velvet cushion with a thick bound paper tax return tied with string and four small coins resting on top. Seated beside it is ${taal}, placing one webbed hand on the bundle. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'MEMBER OF THE UNION',
        text: 'The return was accepted and the inspector is a union member now, and has organised half his office. The Revenue has unfrozen their pay. Kivo had a letter from him, telling the whole truth, which is unusual for a tax inspector and made their wrists sing. Taal’s temperatures are declared as gifts without value, which the Revenue has quietly accepted as a category.',
        art: ({ kivo, pell, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${kivo}, reading a handwritten paper letter, and ${pell}, holding a small paper union membership card up to the light. Black space and stars beyond the bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'kivo', 'pell'],
    title: 'Not Wishing to Be Found',
    premise:
      'The Missing Persons Bureau has a file on Kivo’s sibling, and will open it to next of kin who complete Form MP-7. The form has a box near the end which a missing person may tick in advance, if they ever reach a Bureau office: NOT WISHING TO BE FOUND. If it is ticked, the Bureau will confirm only that they are alive. Fen knows the Bureau’s database, having fed it for years. Pell has filled in a great many forms on behalf of families, and none of them were easy.',
    steps: [
      {
        title: 'Form MP-7',
        setup:
          'Kivo fills in the form in the Bureau’s waiting room. Their wrists are quiet, because nobody has lied yet. The clerk says the file exists and has a flag on it. She cannot say which flag until the form is processed, which takes ten working days. Fen knows, from the colour of the folder tab on her desk, exactly which flag it is. He has not said.',
        options: [
          {
            label: 'Fen tells Kivo what the tab means',
            outcome:
              'Fen tells Kivo quietly that the tab is blue, and that blue means the box was ticked. Kivo’s sibling is alive, and did not wish to be found. Kivo sits with this for a long time. Pell sits with them, and does not fix anything, which he finds very hard.',
            ending: 0,
          },
          {
            label: 'Fen says nothing, and they wait the ten days',
            outcome:
              'Fen says nothing. The crew waits the ten days, and Pell spends them filling in the hardship section of the form for Kivo, slowly, in the evenings. On the tenth day the letter arrives. Kivo does not open it at once. Fen does not say that he already knows what it says.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot in a plain government waiting room with rows of grey plastic chairs. Seated alone in the front row is ${kivo}, filling in a long paper form on a clipboard. On a desk in front, a clerk’s stack of folders shows one bright blue tab. Cool fluorescent light. ${style}`,
      },
      {
        title: 'The Database',
        setup:
          'Fen still has, he realises, access to the Directorate’s border records, through an old password nobody revoked. The records would show where Kivo’s sibling last crossed a checkpoint, and when. His boots announce CHECKPOINT when he opens the terminal. It would take a minute. Pell has his steel hand on the terminal’s plug.',
        options: [
          {
            label: 'Fen closes the terminal without looking',
            outcome:
              'Fen closes the terminal without a search and then reports his own password as compromised, so it will be revoked. Pell unplugs the terminal anyway. Kivo thanks Fen, and it is the first time in a long time someone has thanked Fen for not finding a person.',
            ending: 0,
          },
          {
            label: 'Fen asks Kivo, and Kivo decides',
            outcome:
              'Fen turns the terminal to face Kivo and says the decision is Kivo’s. Kivo looks at the search box for a minute and types nothing. Then they type their own name, to see what the Directorate knows about them, which is a great deal, and Fen helps them file to have it deleted.',
            ending: 1,
          },
        ],
        art: ({ fen, pell, style }) =>
          `Medium shot at a small grey terminal with a green glowing screen on a folding table. Seated at it with his hands above the keys is ${fen}. Standing beside him is ${pell}, his steel hand resting on the terminal’s power plug at the wall. Dim room, green screen light. ${style}`,
      },
      {
        title: 'The Reply Slip',
        setup:
          'The Bureau offers one last thing. Next of kin may leave a sealed message on the file, which will be given to the missing person only if they ever come into a Bureau office of their own accord. Kivo is a courier. They know better than anyone how much a single sealed letter can carry. Pell offers paper. Fen offers to deliver it, which is not how it works.',
        options: [
          {
            label: 'Kivo writes one line, and seals it',
            outcome:
              'Kivo writes one line and seals it with courier wax. Nobody else reads it. The clerk files it in the blue folder. Kivo’s wrists do not whistle at all, which means it is true, whatever it says. Pell walks them back to the couch and makes tea.',
            ending: 0,
          },
          {
            label: 'Kivo leaves the slip blank, on purpose',
            outcome:
              'Kivo seals a blank slip. They say that a blank letter says I respect your choice better than anything they could write. The clerk files it, puzzled. Fen understands and says nothing. Pell says it is the bravest form he has ever seen filled in.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the back cushion is ${kivo}, pressing a small seal into a blob of dark red wax on a folded paper slip. A brass courier’s seal and a short stick of wax lie on the cushion. Black space and stars beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ALIVE, AND ELSEWHERE',
        text: 'Kivo knows their sibling is alive and chose to go, and that is all they know, and it is enough to sleep on. A sealed line waits in a blue folder. Fen’s old password is revoked, and he reported it himself. Pell has not fixed anything about any of this, and Kivo has thanked him for that too.',
        art: ({ pell, style }) =>
          `Medium shot on scarlet velvet cushions at night under one dim brass lamp. Seated at the end of the couch is ${pell}, pouring tea from a dented tin pot into two mugs. A folded blue paper letter lies on the cushion beside him. Black space and stars beyond the bubble. ${style}`,
      },
      {
        title: 'A BLANK FOR AN ANSWER',
        text: 'A blank sealed slip waits in the Bureau’s file, and the Directorate’s record on Kivo has been deleted, at their request, with Fen’s help. Kivo’s wrists have been quieter since. Fen has started helping other families file to have themselves deleted. Pell has printed a hundred copies of the form.',
        art: ({ fen, kivo, style }) =>
          `Medium shot at a government counter with a glass screen. Standing at the counter are ${fen} and ${kivo}, sliding a thick paper form under the glass toward a clerk. A neat stack of blank forms sits beside them. Cool fluorescent light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'pell', 'taal'],
    title: 'Long Service',
    premise:
      'The Ashdock gantry welder known as Old Hesk is retiring after fifty years, and the dockyard has asked the couch to host the leaving do, since it is the only venue with room for the whole shift. Pell was Hesk’s apprentice. Omi has been asked to ring the shift bell one last time, a job it is very good at. Taal has been asked to keep the room comfortable. The dockyard has also invited the contractors, and nobody has told Pell.',
    steps: [
      {
        title: 'The Speech',
        setup:
          'The contractors’ manager has asked to give the speech, as is customary, and has written one thanking Hesk for fifty years of loyalty and silence. Pell has seen it. Hesk has not. Taal has already lowered the couch two degrees. Omi’s smallest bell, the one for no, is trembling. Hesk is on the front cushion with a cake, very happy.',
        options: [
          {
            label: 'Let Hesk choose who speaks',
            outcome:
              'Pell asks Hesk who he would like to give the speech. Hesk says Pell, obviously. The manager sits down. Pell speaks for four minutes about fifty years of welds, and never once mentions silence. Taal warms the couch three degrees, which Hesk notices and is moved by.',
            ending: 0,
          },
          {
            label: 'Omi interrupts the manager, politely',
            outcome:
              'The manager begins. At the word silence, Omi rings its smallest bell, once. It is very small and very loud. The manager starts again. At loyalty Omi rings it again. On the fourth ring the manager folds the speech away and says simply, thank you, Hesk, and sits down.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot on scarlet velvet cushions crowded with dockworkers in overalls holding paper cups. Standing on the armrest is ${omi}, ringing the smallest brass bell on its chest with one stone finger. A man in a suit at the front holds a paper speech, mouth open. Warm lamp light. ${style}`,
      },
      {
        title: 'The Gift',
        setup:
          'The shift has clubbed together for a gift: a gold watch, as is traditional. The contractors have given a second gift, a framed photograph of the dockyard taken the year of the accident, with the eleven workers cropped out. Hesk is holding it and squinting. He knew all eleven. Taal is very cold. Pell is very still. Omi is looking at Pell.',
        options: [
          {
            label: 'Pell tells Hesk what is missing',
            outcome:
              'Pell sits beside Hesk and tells him, quietly, who was cropped out. Hesk listens and then names all eleven himself, in order of shift, from memory. Omi rings a bell for each name. The contractors’ manager leaves early.',
            ending: 0,
          },
          {
            label: 'Let Hesk keep the evening, for now',
            outcome:
              'Pell lets Hesk enjoy his evening. Later, after the party, he takes the photograph out of its frame and gives it to Hesk with the eleven names written on the back, in the places they should be standing. Hesk says he will hang it the right way round.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up on a red velvet cushion of a gold frame holding a black and white photograph of a dockyard with a few figures and wide empty gaps between them. Seated beside an elderly man in welder’s overalls is ${pell}, pointing at the empty gaps with his steel finger. Warm lamp light. ${style}`,
      },
      {
        title: 'The Last Bell',
        setup:
          'At the end of a shift at Ashdock a bell rings once, and the workers go home. The bell was removed after the accident. Omi has been asked to ring the last shift for Hesk. Omi has six bells and knows exactly what the old Ashdock bell sounded like, because it has heard Pell hum it, unconsciously, every evening for a year. Taal has the room as warm as it has ever been.',
        options: [
          {
            label: 'Omi rings the old Ashdock bell',
            outcome:
              'Omi rings the old Ashdock bell, note for note, the one nobody has heard for twenty years. The dockworkers stop talking. Hesk stands up. Pell does not move. Then the whole shift goes home, as they would have, and Hesk is the last to leave, and shakes Omi’s hand.',
            ending: 0,
          },
          {
            label: 'Omi rings a new bell, for Hesk alone',
            outcome:
              'Omi rings a new chord, one it has made for Hesk, which is the sound of fifty years ending well. Hesk asks what it is called. Omi says it does not have a name. Taal warms the room by one more degree, and Hesk says that he will call it Thursday.',
            ending: 1,
          },
        ],
        art: ({ taal, omi, style }) =>
          `Wide shot of scarlet velvet cushions emptying as dockworkers in overalls file away. Standing on the backrest is ${omi}, ringing its brass bells. Seated on the front cushion beside an elderly man in welder’s overalls holding a gold watch is ${taal}. Warm golden light, black space beyond. ${style}`,
      },
    ],
    endings: [
      {
        title: 'END OF SHIFT',
        text: 'Hesk retired to a flat by the docks and hangs the photograph with the names on the back. He comes down to the yard each evening to hear the end of shift, because the dockworkers have put the old bell back, from a recording Omi made. Pell visits him when the couch passes. Taal keeps a degree warmer for him.',
        art: ({ pell, couch, style }) =>
          `Wide shot of ${couch}, hovering beside a dockyard at dusk with a small brass bell hung on a new wooden frame. Standing on the front cushion is ${pell}, waving to an elderly man on the dock. Warm evening light, cranes and containers behind. ${style}`,
      },
      {
        title: 'A CHORD CALLED THURSDAY',
        text: 'Old Hesk retired with a gold watch from the shift, a photograph he has put right, and a chord of his own. Omi rings it every Thursday wherever the couch is. Hesk says he can hear it, though Pell does not think he can. The contractors were not invited to anything again.',
        art: ({ omi, style }) =>
          `Close-up of a small faceted slate-grey stone figure on a red velvet armrest, one stone hand resting on the brass bells hanging at its chest. The figure is ${omi}, its amber eyes half closed. Black space and stars beyond a clear bubble, warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'pell', 'taal'],
    title: 'Fixed Penalty',
    premise:
      'A speed camera on the Hollin Nebula road has photographed the couch doing ninety in a sixty zone, and a Fixed Penalty Notice has arrived naming the registered keeper. The road was built across the only safe corridor out of the nebula, and the speed limit was set by the company that runs the toll. Fen has seen speed cameras used as checkpoints. Pell knows the camera was installed on the cheap. Taal can read, from the photograph, the temperature of the person driving, and it was not the captain.',
    steps: [
      {
        title: 'Who Was Driving',
        setup:
          'The notice requires the keeper to name the driver within fourteen days. The photograph shows a blurred shape on the front cushion. Taal reads the heat signature in the photograph and identifies it as Pell, who was taking the couch out of the nebula fast because the corridor was closing. Fen’s boots have said CHECKPOINT every time the envelope is opened.',
        options: [
          {
            label: 'Pell names himself, and pays',
            outcome:
              'Pell names himself and pays the fine from his own wages, with a covering letter explaining that the corridor was closing and three passengers were aboard. The company replies that the explanation has been noted and the fine stands. Pell frames the reply.',
            ending: 0,
          },
          {
            label: 'Fen asks to see the camera’s calibration',
            outcome:
              'Fen asks for the camera’s calibration certificate, which every checkpoint must show on request. The company takes a week to find it. It expired two years ago. Fen writes back that the camera is an uncertified checkpoint and that the notice is void. The company does not reply.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Close-up on a red velvet cushion of a grainy printed photograph showing a blurred couch on a road through glowing pink nebula clouds. Holding the photograph close to his broad smooth face is ${taal}, frost forming at its edges. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Camera',
        setup:
          'Pell flies back to look at the camera. It is a cheap box on a pole, aimed at the corridor’s narrowest point, and it has photographed every ship that ever fled the nebula at speed. Its memory is full of evacuations. Fen recognises the shapes. Pell could fix it so it only fired above a hundred, which is the speed of a real emergency. The beetle on his shoulder has already taken its lens cap.',
        options: [
          {
            label: 'Pell recalibrates it for emergencies',
            outcome:
              'Pell adjusts the camera to fire only above a hundred and ten, and only away from the corridor’s mouth. It takes him an hour. The company never notices, because the fines fall by half, and it assumes drivers have improved. Fen stands watch while he works.',
            ending: 0,
          },
          {
            label: 'Fen downloads its memory for the evacuees',
            outcome:
              'Fen copies the camera’s memory: four hundred photographs of ships fleeing the nebula, each with a fine attached. He takes them to the evacuees’ association, which recognises its own families in the blurred shapes and begins appealing every notice, with Fen’s help.',
            ending: 1,
          },
        ],
        art: ({ pell, fen, style }) =>
          `Medium shot of a grey metal box on a tall pole beside a road through glowing pink nebula clouds. Reaching into the open box with a small screwdriver in his steel hand is ${pell}. Standing below the pole with arms folded is ${fen}, looking down the road. Pink nebula light. ${style}`,
      },
      {
        title: 'The Appeal',
        setup:
          'The appeal is heard at a traffic tribunal in a small town on the edge of the nebula. The company has sent a lawyer and a video of the couch doing ninety. Taal has been asked to give evidence on the driver’s temperature. Fen has been asked whether he has ever enforced a speed limit. Pell has his fine in one hand and the closing corridor timetable in the other.',
        options: [
          {
            label: 'Taal testifies that the driver was afraid',
            outcome:
              'Taal testifies that the heat signature in the photograph is that of a person who was afraid for others, not for himself, which on the shelf colonies is a legal defence. The tribunal has never heard of it. It adjourns to look it up, and finds that it was once a defence here too, and rules in Pell’s favour.',
            ending: 0,
          },
          {
            label: 'Fen testifies about checkpoints',
            outcome:
              'Fen testifies that he enforced checkpoints for twelve years and that this camera is one: a barrier across the only way out, with a fee. His boots say CHECKPOINT as he steps down from the stand. The tribunal finds the camera unlawfully placed and orders it moved.',
            ending: 1,
          },
        ],
        art: ({ fen, couch, style }) =>
          `Medium shot of a small wood-panelled tribunal room with a raised bench and three seated officials. Standing at a witness rail is ${fen}, one heavy scuffed black boot stepping down. Parked along the back wall is ${couch}. Warm wood tones and window light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FINE OVERTURNED',
        text: 'Pell’s fine was overturned on the ground that he was afraid for others, a defence the Hollin traffic tribunal had forgotten it had. It is in common use again. The camera on the corridor fires above a hundred and ten, as Pell set it. Taal is called as an expert witness twice a year, and warms the courtroom when the verdict is right.',
        art: ({ taal, style }) =>
          `Medium shot in a small wood-panelled tribunal room. Standing at a witness rail is ${taal}, webbed hands resting on the rail, as warm amber light shimmers in the air around him. Three officials at the raised bench listen. Window light from the side. ${style}`,
      },
      {
        title: 'CAMERA MOVED',
        text: 'The camera on the Hollin corridor was moved to a stretch of road where nobody is fleeing anything, and four hundred fines were cancelled. The evacuees’ association has a framed photograph of the empty pole. Fen keeps a copy of the camera’s memory. He looks at it sometimes, at all the ships that got out.',
        art: ({ pell, fen, style }) =>
          `Wide shot of an empty tall metal pole beside a road through glowing pink nebula clouds, a cut cable hanging from its top. Standing at its foot are ${pell} and ${fen}, looking up at it. Small ships pass along the road behind them. Pink nebula light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'pell'],
    title: 'Biosecurity',
    premise:
      'The quarantine border at Ostry Gate has seized Brin’s oxygen garden under the Biosecurity Act, which forbids the entry of any living organism not on the approved list. The garden is on no list, because it is unique. It is also the couch’s air. Fen worked borders like this for twelve years and knows the officer on duty by her stamp. Pell has worked out that the couch has nine hours of air without the garden, and that the Act allows a hearing in eight.',
    steps: [
      {
        title: 'The Seizure',
        setup:
          'The garden is in a sealed glass crate on the inspection bench, steaming slightly. The largest fungus has requested its union representative. The officer says that seized organisms are destroyed after inspection unless their owner can show they pose no risk. Brin says the garden has no owner and is happy to show it poses no risk, if asked. Fen’s boots have announced CHECKPOINT seven times.',
        options: [
          {
            label: 'Brin asks for the garden’s inspection to be consensual',
            outcome:
              'Brin asks the officer to let the garden show itself. She opens the crate one finger’s width, and the garden puts out a single fern frond, which the officer inspects with tweezers. It is perfectly healthy. The officer writes down NO RISK SHOWN, and then, after a moment, AT OWN REQUEST.',
            ending: 0,
          },
          {
            label: 'Pell represents the fungus, as asked',
            outcome:
              'Pell presents himself as the fungus’s union representative and asks for its rights under the Act. The Act has none for fungi. Pell asks for that to be noted. The officer, who has been on shift for fourteen hours, notes it and adds that she would like a union too.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot at a steel inspection bench in a bright grey border hall. A sealed glass crate on the bench holds a small garden of moss, ferns and pale mushrooms, steaming slightly. Standing beside the crate with one green hand flat on the glass is ${brin}. A uniformed officer with tweezers stands opposite. Cool white light. ${style}`,
      },
      {
        title: 'The Air',
        setup:
          'Back on the couch the air is getting thin. Pell has the backup scrubbers running, and they smell of hot tin. The crew has six hours. Fen knows of a second gate, three hours away, with a slower and more forgiving officer. Brin will not leave the garden behind, and Pell will not leave Brin. Fen’s boots have gone quiet, which is unusual.',
        options: [
          {
            label: 'Stay and wait for the hearing',
            outcome:
              'The crew stays. Pell rations the backup air by the minute and Fen sits on the armrest saying nothing, breathing slowly, as he was trained to do in cells. At the seventh hour Brin is called to the hearing. Everyone is a little blue and nobody has left.',
            ending: 0,
          },
          {
            label: 'Fen goes to the second gate for an expert',
            outcome:
              'Fen takes the couch’s shuttle to the second gate and brings back its officer, an old colleague, who is a trained biologist and who has never seen a garden like Brin’s. She arrives with an hour to spare and asks to give evidence. Fen’s boots say CHECKPOINT as she boards, and she laughs.',
            ending: 1,
          },
        ],
        art: ({ pell, fen, style }) =>
          `Medium shot on scarlet velvet cushions in dim blue-grey light. Kneeling at a small battered tin air scrubber unit with a pressure dial is ${pell}, adjusting a valve with his steel hand. Seated on the armrest behind him is ${fen}, breathing slowly with eyes closed. Black space beyond the bubble. ${style}`,
      },
      {
        title: 'The Hearing',
        setup:
          'The hearing is a single magistrate at a folding table. The Act says the garden must be on the approved list or be destroyed. Brin says there is a third option the Act does not mention: that a living thing can be asked whether it agrees to the conditions of entry. Pell has the list. Fen has the officer. The garden has the crate, and is steaming harder.',
        options: [
          {
            label: 'Brin asks the garden to agree to conditions',
            outcome:
              'Brin reads the conditions of entry aloud to the garden: no spreading beyond the couch, no spores in the station air, inspection on request. The garden puts out three fronds, which Brin says is yes. The magistrate admits it on a conditional licence, the first issued to an organism that consented to it.',
            ending: 0,
          },
          {
            label: 'Add the garden to the approved list',
            outcome:
              'The visiting biologist testifies that the garden is safe, and Pell submits the paperwork to add it to the approved list as a new species. The magistrate approves it on the spot. Brin is asked to name it. She asks the garden, and the garden does not answer, and so the list says only BRIN’S GARDEN.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot in a grey border hall. A magistrate sits at a folding table with a paper ledger. Standing before the table is ${brin}, holding open a glass crate from which three small green fern fronds reach out. Parked behind her is ${couch}. Cool white light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CONDITIONAL ENTRY',
        text: 'The garden holds the first conditional licence ever issued to an organism that agreed to its own terms, and it keeps them. The officer at Ostry Gate has formed a union with her shift. Fen goes back each year to check the gate’s list. Pell keeps the backup scrubbers serviced and hopes never to smell hot tin again.',
        art: ({ brin, style }) =>
          `Close-up of the armrest of a red velvet couch covered in a low living garden of moss, ferns and pale mushrooms, with a small stamped paper licence pinned among the fronds. Kneeling beside it and smoothing the licence flat is ${brin}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'APPROVED SPECIES',
        text: 'BRIN’S GARDEN is on the Biosecurity Act’s approved list now, between bracken and a type of moss, and may go anywhere the Act applies. The biologist from the second gate writes to Brin about it each month. Fen and his old colleague talk sometimes about who they used to be. Pell has the list framed above the scrubbers.',
        art: ({ fen, pell, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a brass lamp. Standing on the cushion is ${fen}, holding up a framed printed list with one line underlined in green ink. Seated beside him is ${pell}, tightening the frame’s hook with his steel hand. Black space beyond, warm light. ${style}`,
      },
    ],
  },
]
