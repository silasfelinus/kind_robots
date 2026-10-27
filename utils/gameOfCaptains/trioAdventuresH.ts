import type { TrioAdventure } from './trioAdventures'

// Party adventures, batch H (see trioAdventures.ts and trioAdventuresA.ts for
// the conventions). Each episode grows from how these three particular crew
// rub against or cover for one another, and each takes a different
// institution at its word: a warranty, a heritage listing, a will, a merger,
// a risk assessment and so on. Art prompts are literal Krea 2 prose with crew
// looks and the couch phrase passed in word for word.

export const TRIO_ADVENTURES_H: readonly TrioAdventure[] = [
  {
    crew: ['kivo', 'pell', 'vela'],
    title: 'Void Where Opened',
    premise:
      'The force bubble has a slow leak, and the bubble is still under the manufacturer’s warranty, which is void if it has been opened by an unauthorised technician. Pell has opened it four hundred and twelve times, each one logged and initialled. Kivo’s wrists have been whistling at the leak for a week. Vela would like the claim settled before the charge runs low, and has said so to customer care, which has asked her to hold.',
    steps: [
      {
        title: 'Modifications',
        setup:
          'Kivo follows the whistle to the lower rim of the bubble, where there is a neat square of Pell’s own sealant, dated and initialled. The leak is beside the patch, not under it. The claim form asks whether the bubble has been modified in any way. The honest answer is yes. The relevant answer, Pell argues, is a hand’s width to the left.',
        options: [
          {
            label: 'Declare all four hundred and twelve repairs',
            outcome:
              'Pell attaches the full log. The claim is rejected within the hour by a system that read none of it, on the grounds of modification. Pell is visibly relieved. He says a rejection you have earned is easier to work with than an approval you have not.',
            ending: 0,
          },
          {
            label: 'Answer only about the leak',
            outcome:
              'Kivo records the exact position of the leak, one hand’s width from the patch, and nothing else. The claim is accepted for review. Pell signs it with his steel hand, and says that this is not lying, because the steel hand has no nerves and therefore no opinion.',
            ending: 1,
          },
        ],
        art: ({ kivo, pell, style }) =>
          `Close-up at the lower edge of a thin clear bubble with a faint pale-blue rim, where a neat square patch of grey sealant is stuck to the clear surface. Crouching beside the patch is ${kivo}, holding one thin wrist close to a hairline crack. Behind them stands ${pell}, holding open a thick grease-stained logbook. Black space outside, warm lamp light from above. ${style}`,
      },
      {
        title: 'Please Continue to Hold',
        setup:
          'Customer care has put the couch on hold. The hold music is pleasant and the estimated wait is nine hours. In seven the bubble will drop to its emergency setting, which keeps everyone alive and gives up everything else: the pocket rooms fold away, the lamp goes out, and the bubble shrinks to the outline of three seated people. Vela has begun checking the crew every twenty minutes, with consent, every time.',
        options: [
          {
            label: 'Pell fixes it now, and voids everything',
            outcome:
              'Pell opens the bubble for the four hundred and thirteenth time while the hold music plays on the armrest. Vela assists, asking the bubble’s permission at each stage and recording that it neither gave nor withheld it. The leak is sealed in forty minutes. The crew stays on hold for eight more hours, out of courtesy.',
            ending: 0,
          },
          {
            label: 'Stay on hold; Vela keeps the clinic',
            outcome:
              'The crew stays on hold. Vela sets up a small clinic on the middle cushion and checks everyone’s ears, which are fine, and their patience, which she records in a column of its own. At hour six a person answers, apologises for the wait and asks for the bubble’s serial number. Pell knows it by heart.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a single brass lamp. Seated on the middle cushion is ${vela}, holding a pen over a paper chart ruled into three columns. A brass telephone handset on a coiled cord lies on the armrest beside her, and a brass wall clock hangs on the backrest. Black space and stars beyond the bubble, warm amber light. ${style}`,
      },
      {
        title: 'The Authorised Technician',
        setup:
          'The manufacturer sends a technician, a young man in a clean uniform with a sealed toolkit he is not permitted to open in front of customers. He must decide whether the bubble was damaged by age or by the patch. Pell’s wind-up beetle has already confiscated his screwdriver, on the grounds that he is here on behalf of an employer.',
        options: [
          {
            label: 'Pell walks him through the log, page by page',
            outcome:
              'Pell takes the technician through every repair since the first. The technician reads in silence, writes wear and tear on his report, and voids the warranty anyway, because the form has no other box. He asks for a copy of the log to show his supervisor how it is done.',
            ending: 0,
          },
          {
            label: 'Let him work, with Vela observing',
            outcome:
              'The technician opens his sealed toolkit and repairs the rim under warranty. Vela stands beside him and asks, before each step, whether he consents to be watched. Nobody has ever asked him. He says yes every time, more slowly each time, and leaves his direct number on the armrest.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Medium shot on the cushions of ${couch}. A young technician in a clean pale-grey uniform stands holding a sealed white toolkit against his chest. Facing him sits ${pell}, and the beetle on his shoulder grips a small screwdriver in its jaws. Black space behind the bubble, warm amber lamp light from the left. ${style}`,
      },
    ],
    endings: [
      {
        title: 'VOID WHERE OPENED',
        text: 'The bubble’s warranty is void and the letter saying so is framed behind the backrest. Pell maintains the bubble as he always has, with one new column in the log for the technician, who writes now and then to ask about sealants. Kivo checks the rim each morning with one wrist. Vela asks the bubble whether it minds. It has not complained.',
        art: ({ kivo, style }) =>
          `Close-up of the inside of a thin clear bubble with a faint pale-blue rim, patched in many places with small neat squares of grey sealant. Kneeling on a scarlet velvet backrest is ${kivo}, pressing one thin wrist flat against the clear wall. A small framed paper letter hangs from the backrest below. Black space and stars outside, soft morning lamp light. ${style}`,
      },
      {
        title: 'AUTHORISED BY CORRESPONDENCE',
        text: 'The bubble is under warranty for another forty years, provided that only an authorised technician opens it. Pell has since become one, by correspondence course, and the beetle keeps his certificate. He opens the bubble exactly as often as before. The young technician visits twice a year to watch, and Vela still asks him first.',
        art: ({ pell, style }) =>
          `Medium shot at the edge of a thin clear bubble with a faint pale-blue rim. Kneeling at the rim is ${pell}, pressing a strip of grey sealant into place with his steel hand, while the beetle on his shoulder holds a small framed certificate. Beside him a young technician in a clean pale-grey uniform watches with his hands behind his back. Warm amber light, black space. ${style}`,
      },
    ],
  },
  {
    crew: ['pell', 'sora', 'tess'],
    title: 'Grade II',
    premise:
      'The Board of Galactic Heritage has listed the couch as a Vehicle of Historic Interest, Grade II, on the strength of its outline, which has not changed in two hundred years although every part of it has. Nothing on a listed vehicle may be altered without the Board’s consent. Sora was halfway through replacing a coupling at the time, and Pell was holding the other end. Tess has learned that listed vehicles carry a brass plaque naming the navigator, and has not yet said whether she minds.',
    steps: [
      {
        title: 'Consent to Alter',
        setup:
          'The Board’s inspector, a narrow man with a jeweller’s loupe and a book of approved materials, finds that Sora’s new coupling is copper of the wrong period. Copper of the right period has not been made for a century. Sora has convened her elbows. Four are in favour of asking the couch what it would like. Two are holding the coupling and have abstained.',
        options: [
          {
            label: 'Find copper of the correct period',
            outcome:
              'Pell finds a coupling of the correct period in a scrapyard two systems over, on a retired hearse. The hearse’s owner lets it go for a fair price and a promise that it will be fitted to something that still moves. The inspector examines it through the loupe for nine minutes and nods once.',
            ending: 0,
          },
          {
            label: 'Ask the couch, as Sora’s rule says',
            outcome:
              'Sora lays four palms on the frame and asks. The couch creaks at length about the old coupling and about nothing else. Sora reports that it would like the new one. The inspector writes this down in a column he has had to rule by hand, headed VESSEL’S VIEW.',
            ending: 1,
          },
        ],
        art: ({ sora, pell, style }) =>
          `Medium shot behind a scarlet velvet backrest, where an open panel shows springs and copper pipes. Kneeling at the panel is ${sora}, four hands fitting a bright copper coupling. Holding the far end of the pipe is ${pell}. A narrow man in a grey suit bends over them with a jeweller’s loupe in one eye. Warm lamp light, black space beyond. ${style}`,
      },
      {
        title: 'Navigator of Record',
        setup:
          'A listed vehicle carries a brass plaque giving its name, its date and its navigator of record. Tess is the navigator of record. The plaque would make her a small piece of heritage for as long as the couch exists. It would also give a home port, and since the couch has none, the Board has entered the last port it was seen at, which is the nearest port to the sanctuary.',
        options: [
          {
            label: 'Tess takes the plaque; the port reads Various',
            outcome:
              'Tess asks for the port to read Various. The Board accepts after a meeting, two subcommittees and a site visit. The plaque is screwed to the left brass foot. Tess polishes it more often than she admits, and has twice been seen reading it aloud to strangers.',
            ending: 0,
          },
          {
            label: 'Tess declines to be on it',
            outcome:
              'Tess declines. The Board cannot list a vessel without a navigator of record, and enters Pell, who has never navigated anything except a fault. Pell asks to be removed. The Board explains that removal is an alteration and requires its consent, which it will consider in the spring.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Close-up of one short brass foot beneath scarlet velvet button-tufted cushions. A small polished brass plaque is screwed to the front of the foot. Kneeling beside it is ${tess}, rubbing the plaque with the cuff of her sleeve. Warm lamp light from above, black space and stars behind. ${style}`,
      },
      {
        title: 'Open Sunday',
        setup:
          'A listed vehicle must open to the public on two Sundays a year. The first is tomorrow. Forty heritage enthusiasts are waiting in a queue of small ships, with flasks and folding stools. The coupling is still half fitted, and the bubble is showing a fault lamp that the Board has recorded as a period feature.',
        options: [
          {
            label: 'Open as it is, fault lamp and all',
            outcome:
              'Pell gives the tour, including the fault lamp, which he explains in full. The enthusiasts sit on every cushion in turn and take notes. One of them, a retired lift engineer, diagnoses the fault from the queue. Sora thanks her. The Board describes the visit as the best attended in its history.',
            ending: 0,
          },
          {
            label: 'Fix the fault first and let the Board object',
            outcome:
              'Sora replaces the fault lamp’s relay with a modern one overnight. The bubble has never run better. The enthusiasts arrive to find a couch in perfect working order and are disappointed. The inspector, who came on his day off, issues a notice of unauthorised improvement.',
            ending: 1,
          },
        ],
        art: ({ Couch, style }) =>
          `Wide shot in black space. ${Couch}, is surrounded by a ring of small round ships with open hatches. Middle-aged visitors in anoraks sit on every cushion holding vacuum flasks and notebooks, and a small red lamp glows on the backrest. Warm lamp light on the visitors, cold starlight behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HISTORIC INTEREST',
        text: 'The couch remains a Vehicle of Historic Interest, Grade II, and is the only listed structure in the galaxy that leaves. Pell keeps a shelf of period parts salvaged from hearses, lifts and fairground rides. Sora asks the couch before every repair and then applies for consent, in that order. The plaque on the left foot has been rubbed bright by visitors.',
        art: ({ pell, style }) =>
          `Medium shot in a small pocket room lined with wooden shelves of old brass and copper parts, each with a paper tag on string: lift buttons, fairground ride bolts, a hearse door handle. Standing at the shelves is ${pell}, holding up one old copper coupling to the lamp. Warm amber lamp light. ${style}`,
      },
      {
        title: 'UNAUTHORISED IMPROVEMENT',
        text: 'The couch was delisted on a Thursday for unauthorised improvement, and the Board’s letter is pinned to the backrest beside the fault lamp it no longer needs. Sora fits whatever the couch asks for. Pell has thrown out nothing. Tess is on no plaque and mentions, in a tone of some pride, that she used to be heritage.',
        art: ({ sora, tess, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on the cushion is ${tess}, holding a small unscrewed brass plaque in her lap. Behind the backrest stands ${sora}, two hands fitting a shiny new part into an open panel and two hands pinning a paper letter to the velvet. Warm lamp light, black space behind. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'pell', 'rue'],
    title: 'Locker 2114',
    premise:
      'Ines Varro, who welded hulls at Ashdock for thirty-one years, has died and named Pell her executor. Her estate is one locker, number 2114, which stood in the Ashdock changing rooms until the changing rooms were demolished and pushed into a debris field. Rue has read the will and found a clause that can be read two ways. Kivo has been asked to find the locker, and their wrists have been whistling at the debris field since the couch arrived.',
    steps: [
      {
        title: 'Salvage',
        setup:
          'Kivo finds locker 2114 drifting among the remains of the changing rooms, still locked. Under salvage law, anything in the field belongs to the company that demolished it unless claimed in writing within ninety days. It has been eighty-nine days and twenty-three hours. The salvage office is a day’s flight away. The locker is a few metres off the left armrest.',
        options: [
          {
            label: 'Claim it in writing first',
            outcome:
              'Rue drafts the claim on the armrest in nine minutes, and Kivo transmits it with fifty seconds to spare. The salvage office replies at once with an automated message wishing them a pleasant day. Rue files the message with the claim. It is, they point out, the only part of the process that was pleasant on time.',
            ending: 0,
          },
          {
            label: 'Tow the locker aboard now',
            outcome:
              'Kivo lassoes the locker with a curtain cord and Pell tows it into a pocket room. Rue records the time, the method and the curtain, and says they will argue that it was claimed by possession, which is a doctrine, and by curtain, which is not one yet.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Wide shot of a field of drifting debris in black space: broken benches, bent pipes, a cracked washbasin and rows of dented grey steel lockers. Leaning out from a scarlet velvet armrest is ${kivo}, throwing a looped red curtain cord toward one locker with a padlocked door. Cold white starlight, warm lamp light on the armrest. ${style}`,
      },
      {
        title: 'Whoever Has Been Family',
        setup:
          'The will leaves the contents of the locker to my family, or to whoever has been family to me. Ines had no relatives. She had a shift. Pell has the night-shift rosters for thirty-one years, which he kept when the company deleted them. Rue, who once wrote a clause that could be read two ways and has regretted it since, has to decide which way to read this one.',
        options: [
          {
            label: 'Read it broadly: the night shift',
            outcome:
              'Rue reads family as everyone who worked the night shift beside her. Pell produces the rosters. Kivo begins tracking down forty-one welders across nine systems, by pressure wake, by forwarding address and in one case by a description of a laugh. Rue says it is the first clause they have read generously on purpose.',
            ending: 0,
          },
          {
            label: 'Name the union as her family',
            outcome:
              'Rue reads family as the Ashdock welders’ union, which has a legal personality, an address and a banner. The union accepts the estate by return of post and appoints Pell, its oldest member aboard, to act for it. Pell accepts in writing, and the beetle witnesses.',
            ending: 1,
          },
        ],
        art: ({ rue, pell, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on the left is ${rue}, reading a two-page paper will held close to their glasses. Seated beside them is ${pell}, a tall stack of yellowed paper shift rosters tied with string on his knees. Warm lamp light from above, black space behind. ${style}`,
      },
      {
        title: 'The Contents',
        setup:
          'The locker opens with Pell’s steel thumb. Inside: a dented thermos, a welding mask with a sticker of a sun on it, and thirty-one years of handwritten timesheets recording overtime the company never paid. The company has since been bought by a holding company, which has been bought by another. Somewhere in that stack is someone who owes Ines Varro a great deal of money.',
        options: [
          {
            label: 'Give the timesheets to the shift to decide',
            outcome:
              'Pell hands the timesheets to the night shift with everything else. The welders read them in silence and decide that they are not a claim but a record, and that a record is for keeping. They divide the pages between them, one year each, and leave the debt where it is, on paper, on purpose.',
            ending: 0,
          },
          {
            label: 'File the overtime claim in her name',
            outcome:
              'Pell files the claim in Ines Varro’s name against every company in the stack at once. Rue attaches a covering letter that runs to one paragraph and cites thirty-one years. The first holding company replies that it is not responsible. The second replies that it is not the first. The third asks for a meeting.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up of an open dented grey steel locker in a warmly lit pocket room. Inside hang a welding mask with a small round sun sticker and a dented green thermos on a hook. Standing at the open door is ${pell}, lifting out a thick bundle of yellowed handwritten paper sheets with his steel hand. Warm lamp light from the left. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NIGHT SHIFT',
        text: 'The estate of Ines Varro was distributed on a Tuesday night in a pocket room fitted out as a canteen, to thirty-eight former welders who all arrived early. Each took one thing. The thermos is still going round. Kivo found the last of them on a mining moon, and has started asking Rue how far a clause like that can reach.',
        art: ({ kivo, rue, style }) =>
          `Interior of a small warm canteen behind a scarlet velvet backrest, with long tables of older welders of many species in work jackets passing a dented green thermos down the row. Standing in the doorway is ${kivo}, and beside them ${rue}, holding a folded paper will. Warm yellow lamp light. ${style}`,
      },
      {
        title: 'BACK PAY',
        text: 'The third holding company paid Ines Varro’s overtime in full, with interest, to the Ashdock welders’ union, eleven months after Pell filed the claim and four days after Rue’s third letter. The union built a new changing room with it, including a locker numbered 2114 that nobody uses. Pell keeps the key on the beetle.',
        art: ({ pell, style }) =>
          `Medium shot in a clean new changing room with rows of bright grey steel lockers and wooden benches. Standing at one locker with a small padlock is ${pell}, and the beetle on his shoulder holds a small steel key on a loop of string. Bright white overhead light. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'omi', 'pell'],
    title: 'Integrated Futures',
    premise:
      'Ashdock Heavy Industries, where Pell used to work, has merged with the Sesh Foundry, which built Mox, to form a company called Ashdock-Sesh Integrated Futures. The new company has written to every former employee and product to welcome them to the family. Pell received the letter addressed to staff. Mox received the one addressed to inventory. Omi received neither, and has been invited separately to compose the company chime.',
    steps: [
      {
        title: 'Welcome to the Family',
        setup:
          'Mox’s welcome pack contains a lanyard, a branded pin badge to wear in place of the white one on its chest, and a form on which it may confirm its new asset number. Mox has read the form with both lids. Its opinions about it are accurate, and it is delivering them to the crew in the measured voice it uses when it is very angry.',
        options: [
          {
            label: 'Mox returns the pack, corrected',
            outcome:
              'Mox corrects the form in forty-one places, encloses the lanyard and the badge, and posts it back. The company’s asset system records Mox as returned to sender. Mox reads the entry several times and asks Pell whether returned to sender could be an address. Pell says he will look into it.',
            ending: 0,
          },
          {
            label: 'Mox attends the induction',
            outcome:
              'Mox fills in the form under protest, which it writes in the box for the asset number, and attends the induction day by subspace. It asks nine questions in the first ten minutes. The facilitator moves it from the inventory session to the staff session, where it asks nine more.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot in a small warm pocket room with a round wooden table. Seated at the table is ${mox}, holding up a blue branded lanyard in one hand and a one-page paper form in the other, its blue-lidded eye half closed. An open cardboard welcome box sits in front of it. Warm amber lamp light from above. ${style}`,
      },
      {
        title: 'The Chime',
        setup:
          'The company wants six notes to play at the start of every shift, meeting and safety announcement, and Omi has six bells. Omi’s own warnings were once suppressed for interrupting an official ceremony. The brand team’s brief says the chime must be reassuring and must on no account resemble a warning.',
        options: [
          {
            label: 'Omi sends one stroke of the small gong',
            outcome:
              'Omi rings the small gong once into the recorder and sends that. The brand team, which does not know what it means, calls it bold and minimal and pays in full. The chime of Ashdock-Sesh Integrated Futures now says no at the start of every shift, which the workers understand.',
            ending: 0,
          },
          {
            label: 'Omi writes a chime that is also a warning',
            outcome:
              'Omi composes six notes that management finds reassuring and that, to anyone who listens twice, are the evacuation call of the Harmonic Belt. The brand team approves it on the first hearing. Pell teaches the night shift what it means.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a small dim pocket room. Standing on a low wooden stool is ${omi}, holding a long thin tuning rod against its smallest bell, in front of a large brass recording horn on a stand. A young brand manager in a grey suit holds a clipboard in the doorway. Warm lamp light on the brass, cool shadows. ${style}`,
      },
      {
        title: 'The Signing',
        setup:
          'The merger is completed at a ceremony where both chairs sign with a single gold pen. Pell has been invited as a long-service representative, to hold the tray. His wind-up beetle, which confiscates dangerous tools from employers, has been looking at the pen since breakfast.',
        options: [
          {
            label: 'Let the beetle take the pen',
            outcome:
              'The beetle takes the pen in front of four hundred guests. The chairs ask for it back. The beetle explains, through Pell, that it may be requested in writing. The request is drafted, but there is now nothing to sign it with. The ceremony is adjourned while legal looks for a pencil.',
            ending: 0,
          },
          {
            label: 'Pell asks for a seat on the board',
            outcome:
              'Pell, holding the tray, asks in front of the cameras for a worker’s seat on the board, and a second seat for Mox. The chairs, who would like to sign something today, agree. The beetle lets them use the pen, and keeps the cap.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Medium shot in a bright corporate hall with a long white table and two grey-suited executives seated behind it. Standing beside the table is ${pell}, holding a silver tray with one gold pen on it, while the beetle on his shoulder leans forward with its jaws open toward the pen. White ceiling light, rows of seated guests behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'RETURNED TO SENDER',
        text: 'Ashdock-Sesh Integrated Futures lasted nine weeks. Its pen is in the beetle’s collection on the armrest, its chime says no, and its records list Mox as returned to sender, which Mox has registered as its legal address. Pell received a long-service award from the dissolved company. He keeps it in a shoebox with the other things he did not ask for.',
        art: ({ mox, couch, style }) =>
          `Medium shot of ${couch}. Seated on the middle cushion is ${mox}, holding a small brown paper parcel on its knees. On the armrest beside it a neat row of confiscated tools lies on the velvet with a gold pen at the end. Black space and stars behind, warm lamp light. ${style}`,
      },
      {
        title: 'TWO SEATS ON THE BOARD',
        text: 'Ashdock-Sesh Integrated Futures has two board members who were once listed as staff and inventory. Pell attends every meeting in his coveralls. Mox votes against every motion that calls anyone an asset, and has so far won every vote. The shift chime is a warning, and the night shift has used it once, correctly.',
        art: ({ pell, mox, style }) =>
          `Medium shot in a long boardroom with a polished dark table and grey-suited executives along both sides. At the far end sit ${pell}, with his steel forearm resting on a stack of papers, and beside him ${mox}, raising one hand to vote. Pale daylight through tall windows. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'pell', 'sora'],
    title: 'Suitable and Sufficient',
    premise:
      'The Galactic Safety Executive will not admit the couch to the Rimfall mining system without a completed risk assessment, signed by a Responsible Person, listing every hazard aboard and the measures taken to control it. Sora has convened her six elbows to draft it. Pell volunteered to be the Responsible Person before anyone had asked. Kivo’s wrists, which whistle at hazards, have not stopped since the form arrived.',
    steps: [
      {
        title: 'Hazard Identification',
        setup:
          'Kivo’s wrists identify four thousand and six hazards, including vacuum, the button tufts, the beetle and the form itself, which has sharp edges. Sora wants every one of them listed. The form has eleven lines.',
        options: [
          {
            label: 'List all of them on continuation sheets',
            outcome:
              'Sora drafts four thousand and six entries with four hands while two hands staple. Kivo walks the couch and confirms each one with a wrist. The finished assessment is thicker than the left cushion. The Executive’s office acknowledges receipt and asks, politely, whether it could have it in a smaller box.',
            ending: 0,
          },
          {
            label: 'Group them all under SPACE',
            outcome:
              'Kivo groups four thousand hazards under the heading SPACE, with the control measure BUBBLE. Sora’s lower elbows object that this is not engineering. The Executive accepts it as a precedent, and has since received the same page from nine other ships.',
            ending: 1,
          },
        ],
        art: ({ sora, kivo, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions buried under tall stacks of stapled paper. Seated among the stacks is ${sora}, four hands holding pens over separate sheets and two hands stapling. Crouching on the armrest is ${kivo}, one thin wrist raised toward a button tuft. Black space beyond the bubble, warm lamp light. ${style}`,
      },
      {
        title: 'The Responsible Person',
        setup:
          'Pell has signed as Responsible Person for every hazard on the form. He has always taken responsibility for failures, including ones he did not cause and several that have not happened yet. Sora’s view is that responsibility belongs with whoever can actually fix a thing. Under her rule, a great deal of the form belongs to vacuum.',
        options: [
          {
            label: 'Divide it by who can fix what',
            outcome:
              'Sora redraws the form. Pell is responsible for the springs. Kivo is responsible for anything that whistles. Sora takes the couplings and the bubble. Vacuum is entered as pending. That night Pell sleeps eight hours, which the beetle records as a hazard, because it has never seen it before.',
            ending: 0,
          },
          {
            label: 'Let Pell sign for all of it',
            outcome:
              'Pell signs for all of it in a steady hand. Then the beetle confiscates his pen, on the grounds that it is a dangerous tool which has just been used against a worker, namely Pell. Sora countersigns as a witness, with an objection noted in the margin.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up on a scarlet velvet armrest where a long paper form lies spread out. Leaning over it is ${pell}, signing at the bottom with a pen held in his steel hand, while the beetle on his shoulder reaches down toward the pen with its jaws. Warm amber lamp light from the left. ${style}`,
      },
      {
        title: 'The Fire Drill',
        setup:
          'The Executive’s inspector boards at Rimfall to observe a fire drill. The couch has never had a fire. It is surrounded by vacuum, in which fire is difficult, and the only flammable thing aboard is the risk assessment. The inspector would like to see the drill anyway, and has brought a stopwatch.',
        options: [
          {
            label: 'Run the drill exactly as written',
            outcome:
              'The crew evacuates to the farthest pocket room in four minutes and ten seconds. Kivo counts heads, of which there are three. Sora checks that every door was closed behind them. The inspector stops the watch, writes a long time, and awards the couch the grade of exemplary, which he says he has never used.',
            ending: 0,
          },
          {
            label: 'Ask the inspector what he is afraid of',
            outcome:
              'Sora, who always asks what broke before naming it, asks the inspector. He says it is ships with perfect paperwork that explode anyway. They discuss it on the cushions for an hour. He signs the couch through with a note about residual risk, and leaves his stopwatch on the armrest.',
            ending: 1,
          },
        ],
        art: ({ couch, style }) =>
          `Medium shot of ${couch}. A grey-haired safety inspector in a yellow high-visibility vest stands on the middle cushion holding up a silver stopwatch. Behind the backrest, the open door of a small warm pocket room shows three figures hurrying inside. Black space behind, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SUITABLE AND SUFFICIENT',
        text: 'The couch’s risk assessment runs to four hundred pages and is used by the Galactic Safety Executive as a training document. Every hazard has a name beside it. Kivo checks theirs each morning with both wrists. Pell is responsible for the springs and nothing else, and has found, to his surprise, that he can sleep.',
        art: ({ kivo, pell, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Crouching on the armrest is ${kivo}, both thin wrists raised, beside a thick ring-bound folder lying open on the velvet. Asleep sitting up on the middle cushion is ${pell}, his chin on his chest. Soft pink light from the left, black space behind. ${style}`,
      },
      {
        title: 'RESIDUAL RISK',
        text: 'The couch flies under a one-page risk assessment that reads SPACE, BUBBLE and PELL, with a note in the inspector’s hand in the margin that reads, in full: they know. Rimfall has let it through twice. Sora reviews the page with all six elbows every quarter. It has never needed changing.',
        art: ({ sora, style }) =>
          `Close-up on scarlet velvet button-tufted cushions. Seated on the cushion is ${sora}, holding a single sheet of paper up to the lamp with two hands, a pen in a third, and a silver stopwatch in a fourth. Her other two hands rest on her knees. Warm amber lamp light, black space and stars behind. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'pell', 'taal'],
    title: 'Root Cause',
    premise:
      'At Quillon Docks one of Brin’s vines grew overnight into a docking clamp and held a cargo freighter in its berth for twenty-six hours. Nobody was hurt. The freighter was carrying ice cream. The Port Accident Investigation Board must now publish a report naming a root cause. Pell has already confessed, and so has Brin. Taal, invited to sit as independent observer, has noticed that the room grows colder whenever the Board’s chair says the word thorough.',
    steps: [
      {
        title: 'Two Confessions',
        setup:
          'The Board’s template has room for one root cause. Pell says he should have inspected the clamp, which he does not maintain, at a port he does not work for. Brin says the vine is hers and refuses to have its growth called anybody else’s failure. Both are offering to take the blame, and each is beginning to resent the other for offering.',
        options: [
          {
            label: 'Taal asks each to describe the other’s share',
            outcome:
              'Taal asks Pell to state Brin’s share of the blame, and Brin to state Pell’s. Neither can. The Board records joint and several responsibility, which Pell and Brin each regard as a defeat, and both accept, separately, as a compromise.',
            ending: 0,
          },
          {
            label: 'Let the vine give evidence',
            outcome:
              'Brin brings a cutting of the vine to the hearing in a pot and translates. It was cold in the night, and the clamp was warm. The Board has no category for a plant’s reasons and opens one. The cutting is thanked for its time and asked to wait outside.',
            ending: 1,
          },
        ],
        art: ({ pell, brin, style }) =>
          `Wide shot of a busy steel space dock where a thick green vine is wrapped tightly around a huge docking clamp that holds a white cargo freighter in its berth. Standing at the foot of the clamp are ${pell}, raising one hand, and ${brin}, also raising one hand. Orange dock floodlights, black space and stars above. ${style}`,
      },
      {
        title: 'Thorough',
        setup:
          'Taal has measured the chair. Each time she promises the report will be thorough, the air around her drops two degrees. She is under instruction to publish by Friday with a single name in it, for the insurers. Taal can read a lie in a room’s temperature. He cannot make anyone trust what he reads, and the Board has asked him, as an observer, to read nobody at all.',
        options: [
          {
            label: 'Taal enters the temperature into the record',
            outcome:
              'Taal asks that the room’s temperature be minuted each time the chair speaks. The clerk complies. On the third reading the chair stops, puts down her pen and says that the deadline is Friday and the insurers want a name. The Board extends the inquiry by a month. The room warms by one degree.',
            ending: 0,
          },
          {
            label: 'Taal asks her to say the word again, slowly',
            outcome:
              'Taal asks the chair to say the word thorough once more, slowly. She does, and the water jug frosts. She calls a recess. When the Board returns she announces that the report will name nobody, because naming anyone by Friday would be a guess.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a plain grey hearing room with a long table and a glass water jug beginning to frost over. Seated at the end of the table is ${taal}, with pale cold mist rising from his shoulders, looking toward a woman in a dark grey suit at the head of the table, whose breath shows as a faint white cloud. Flat white ceiling light. ${style}`,
      },
      {
        title: 'Recommendations',
        setup:
          'Every report ends with recommendations, and the docks would prefer ones that cost nothing. Pell has drafted fourteen, beginning with a quarterly inspection of every clamp in the port and ending with a heater for the clamps, so that nothing grows toward them. Brin has drafted one. It says: let the vine stay.',
        options: [
          {
            label: 'Recommend Pell’s fourteen',
            outcome:
              'The Board adopts all fourteen of Pell’s recommendations, costed in an appendix he wrote overnight. The docks object to the price of the heaters. Pell points out that the heaters are cheaper than twenty-six hours of melting ice cream, and attaches the invoice.',
            ending: 0,
          },
          {
            label: 'Recommend Brin’s one',
            outcome:
              'The Board adopts Brin’s recommendation. The vine is left in the clamp at berth nine, where it holds whatever is moored there with great firmness and lets go when asked politely. The harbourmaster has started asking politely. It has added eleven minutes to every departure.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Close-up of a huge steel docking clamp wrapped in a thick green vine with small white flowers opening along it. Kneeling on the dock beside it is ${brin}, pouring water from a dented tin cup onto the roots. Orange dock floodlights, the white hull of a freighter filling the background. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CONTRIBUTING FACTORS',
        text: 'The Board’s report on the Quillon Docks incident lists thirty-one contributing factors, including the clamp, the vine, the cold, the ice cream and the Board’s own deadline. Every port in the sector now inspects its clamps quarterly. Pell and Brin share a line in the report and still argue over whose name comes first. Taal has declined to read the temperature of the argument.',
        art: ({ pell, brin, style }) =>
          `Medium shot at a small wooden table on scarlet velvet button-tufted cushions. Seated across from each other are ${pell}, and ${brin}, each pressing one finger onto the same open page of a thick bound report between them. Warm amber lamp light, black space behind. ${style}`,
      },
      {
        title: 'AN ACT OF GARDEN',
        text: 'The Board found no fault and filed the incident as an act of garden. The vine still grows through the clamp at berth nine, where it holds the port’s own tugs steady in storms and flowers each spring. The insurers have not decided what it is. Taal visits the chair when the couch passes. She has stopped saying thorough, and her office is warmer for it.',
        art: ({ taal, style }) =>
          `Wide shot of a steel space dock berth where a thick flowering green vine grows around a docking clamp holding a small orange tug. Standing on the dock with his webbed hands folded is ${taal}, beside a woman in a dark grey suit holding a cup of tea. Warm afternoon dock light, stars above. ${style}`,
      },
    ],
  },
  {
    crew: ['sora', 'tess', 'vela'],
    title: 'Double Blind',
    premise:
      'The Meridian Institute is trialling a cure for jump sickness. It pays volunteers well and will name the first one in the published paper. Tess signed up before reading anything. Vela, who has read everything, does not believe anyone can consent to a form printed that small. Sora wants to know how the tablets are made before anyone swallows one, and has asked to see the machine.',
    steps: [
      {
        title: 'Informed',
        setup:
          'The consent form is forty pages long, in a type Vela has measured with a ruler. Page thirty-one says participants may be placed in a control group and given a sugar tablet. Page thirty-eight says the Institute may use their name, likeness and nausea in promotional materials. Tess has already signed page forty.',
        options: [
          {
            label: 'Vela reads the whole form aloud to Tess',
            outcome:
              'Vela reads all forty pages aloud, which takes four hours and a jug of water. Tess listens to every word, crosses out page thirty-eight, initials the crossing-out and signs page forty again. The Institute accepts the amended form, and asks Vela whether she would read theirs to the other volunteers.',
            ending: 0,
          },
          {
            label: 'Let Tess’s signature stand',
            outcome:
              'Tess says she consented to everything, including being famous. Vela records the consent as enthusiastic but uninformed and attaches a note to the file, in a type size of her choosing. Tess is enrolled as volunteer number one and given a lanyard, which she wears to dinner.',
            ending: 1,
          },
        ],
        art: ({ vela, tess, style }) =>
          `Medium shot in a bright white clinic waiting room with plastic chairs. Seated side by side are ${vela}, holding a thick stapled paper form and a wooden ruler against one page, and ${tess}, leaning over to look, a pen in her hand. A glass jug of water sits on the low table. Flat white light. ${style}`,
      },
      {
        title: 'Unit Four',
        setup:
          'Sora is shown the tablet press, a cheerful brass machine on legs that the staff call Unit Four. As she would with any machine, she asks it what is wrong before anyone names it. Unit Four says the active tablets and the sugar tablets come out of the same hopper, and that it has been asked not to mention this.',
        options: [
          {
            label: 'Report it to the ethics board',
            outcome:
              'Sora reports it to the trial’s ethics board, in writing, with all six signatures, one from each hand. The trial is halted for three weeks while Unit Four is fitted with a second hopper and a small brass plate on its side recording that it was right. Unit Four asks Sora to visit. She does.',
            ending: 0,
          },
          {
            label: 'Sort the tablets herself, overnight',
            outcome:
              'Sora sorts eleven thousand tablets overnight by weight, six hands at once, on a tray balanced across her knees. Unit Four watches. By morning there are two piles, each correct to a hundredth of a gram, and the trial starts on time. Nobody at the Institute asks how.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a white pharmaceutical workshop beside a cheerful brass tablet press on four short legs, with one glass hopper on top full of small white tablets. Seated on a stool beside it is ${sora}, a wide steel tray across her knees, six hands sorting tablets into two neat piles. Bright white overhead light. ${style}`,
      },
      {
        title: 'Publication',
        setup:
          'Tess was in the control group. She was sick for three days on a sugar tablet, which the Institute considers a significant finding. The paper is to be published next week. The Institute would like to name her as Participant One, the first person to develop jump sickness from sugar alone, and to print her photograph beside the results.',
        options: [
          {
            label: 'Tess stays Participant One, unnamed',
            outcome:
              'Tess asks to stay Participant One and nothing more. The Institute is disappointed and prints a silhouette. Vela tells her it is the most useful thing she has done for medicine. Tess says she knows, and that it is annoying that the most useful thing is also the quietest.',
            ending: 0,
          },
          {
            label: 'Tess lets them use her name',
            outcome:
              'Tess gives her name, her photograph and an interview about the three days, which she describes in great detail. The paper is read widely, mainly for the interview. The effect is named after her. Sora sends a copy to Unit Four.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot in a small white clinic room. Lying on a narrow bed under a grey blanket is ${tess}, pale, holding a small white tablet up between two fingers and looking at it. A young photographer in a brown jacket stands at the foot of the bed holding a camera. Soft white window light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PARTICIPANT ONE',
        text: 'The Meridian Institute’s cure for jump sickness works, and its consent form is now four pages long, in a type Vela approved with a ruler. Unit Four has two hoppers. Tess is Participant One in a paper read by forty thousand doctors, none of whom know her name. She tells people she was in medicine once, anonymously, and that it was the most useful she has ever been.',
        art: ({ sora, style }) =>
          `Medium shot in a white pharmaceutical workshop. A cheerful brass tablet press on four short legs now carries two glass hoppers on top. Standing beside it is ${sora}, two hands resting on its brass side and four hands holding a cup of tea, a plate, a biscuit and a napkin. Warm afternoon light through a window. ${style}`,
      },
      {
        title: 'THE HELIO EFFECT',
        text: 'The Helio Effect, in which a patient falls ill on a sugar tablet out of sheer commitment, is in every textbook of travel medicine, with Tess’s photograph beside it. She is famous among pharmacists. Vela has written to the journal to note that the effect was consented to, eventually. Sora still visits Unit Four and asks how it is.',
        art: ({ tess, vela, style }) =>
          `Medium shot in a crowded pharmacy with tall wooden shelves of glass bottles. Standing at the counter is ${tess}, shaking hands with a smiling pharmacist in a white coat. Behind her stands ${vela}, holding a thick medical textbook open against her chest. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'rue', 'vela'],
    title: 'Twelve Strangers',
    premise:
      'On Corrance, juries are drawn from whatever ships are in orbit, and the couch was in orbit. Vela, Rue and Kivo have been summoned. The defendant is a courier charged with carrying medicine down a route the authorities had closed. Kivo once helped conceal a route very like it, for their sibling. Rue is a lawyer, and lawyers may not serve. Vela has been told she may not ask the defendant anything, which she describes as the hardest instruction of her career.',
    steps: [
      {
        title: 'Impartial',
        setup:
          'The judge asks each juror whether there is any reason they cannot try the case impartially. Rue could say they are a lawyer and be excused. Kivo could say what they once did for their sibling and be excused too. That would leave Vela and nine strangers, two of whom have brought knitting.',
        options: [
          {
            label: 'Both declare everything',
            outcome:
              'Rue declares their profession and Kivo declares the route. The judge excuses Rue and keeps Kivo, observing that a juror who has hidden a route is the only one likely to understand the evidence. Rue watches the trial from the public gallery and takes notes nobody asked for.',
            ending: 0,
          },
          {
            label: 'Answer only the question asked',
            outcome:
              'Rue answers precisely: there is no reason they cannot be impartial, and they are only partial to the law, which is permitted. Kivo says nothing. Their wrists whistle at the question, quietly, and the judge, who is hard of hearing, takes it for the ventilation.',
            ending: 1,
          },
        ],
        art: ({ kivo, rue, vela, style }) =>
          `Medium shot of a wooden jury box in a tall courtroom. Seated in the front row are ${kivo}, ${vela}, and ${rue}, with strangers in coats behind them, one knitting. Pale window light. ${style}`,
      },
      {
        title: 'Exhibit Four',
        setup:
          'Exhibit four is the courier’s medical bag. From the jury box Vela can see that every vial in it is marked for a named patient in a doctor’s hand, which makes it a prescription and not a cargo. Nobody has asked her. She would like, more than she has ever wanted anything in a courtroom, to be asked.',
        options: [
          {
            label: 'Vela passes a written question to the judge',
            outcome:
              'Jurors may submit questions in writing, and Vela submits one: who wrote the names on the vials. The judge reads it aloud. The defence calls the doctor, who arrives in her slippers and confirms every name. The prosecution asks for a recess, then for another.',
            ending: 0,
          },
          {
            label: 'Vela keeps to her instruction',
            outcome:
              'Vela keeps to the instruction for two days, in silence, with her bell wrapped in her mantle. In the jury room she sets out only what was said in court, which is all she is allowed, and adds in a level voice that she would like it minuted that she was never asked.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Close-up of a battered brown leather medical bag lying open on a courtroom evidence table, with rows of small glass vials inside, each tied with a tag of paper. Leaning forward from the jury box behind it is ${vela}, her hands folded tightly on the rail. Pale window light from the left. ${style}`,
      },
      {
        title: 'Deliberation',
        setup:
          'The jury room has twelve chairs, a jug of water and a foreman’s hand bell, which Vela cannot bring herself to look at. The strangers are split down the middle. Kivo’s wrists whistle every time somebody says the word smuggler. Rue has been asked by the foreman to stop drafting things.',
        options: [
          {
            label: 'Keep deliberating until everyone agrees',
            outcome:
              'The jury deliberates for two days. Kivo explains, at the second request, what it is like to carry something that saves a life down a road that has been closed for paperwork. The knitters change their minds first. The verdict is unanimous, and the foreman rings the bell without looking at Vela.',
            ending: 0,
          },
          {
            label: 'Convict on the law, and add a rider',
            outcome:
              'The jury finds the facts proven, because they are. Then it attaches a rider, eleven lines long, drafted by a juror who is not allowed to be a lawyer, stating that the route should never have been closed. The judge reads it aloud twice, the second time slowly.',
            ending: 1,
          },
        ],
        art: ({ rue, kivo, style }) =>
          `Medium shot in a small wood-panelled jury room with a round table, twelve chairs, a glass jug of water and a small brass hand bell. Standing at the window is ${kivo}, one thin wrist raised. Seated at the table is ${rue}, holding a pen over a single sheet of paper while a stern foreman in a cardigan points at it. Grey window light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ACQUITTED ON THE SECOND DAY',
        text: 'The courier walked out of the Corrance court with her medical bag and went back to the route the same evening. Rue has framed the jury summons. Vela still thinks about the vials. Kivo, who once helped hide a route, has now helped acquit one, and says the two are beginning, slowly, to balance.',
        art: ({ kivo, style }) =>
          `Wide shot of the stone steps of a tall courthouse at dusk. A young courier in a long travel coat walks down the steps carrying a battered brown leather medical bag. Standing at the top of the steps is ${kivo}, watching her go, hands in their jacket pockets. Low orange evening light. ${style}`,
      },
      {
        title: 'GUILTY, WITH A RIDER',
        text: 'The courier was convicted and sentenced to the single day she had already served. The jury’s rider was read into the record, and within the year Corrance reopened the route. The courier now runs it legally and keeps a copy of the rider in her bag. Rue has never been told who drafted it, and has never asked.',
        art: ({ rue, style }) =>
          `Medium shot on a dusty mountain road at a raised red and white barrier arm. A young courier in a long travel coat walks under the barrier with a battered brown medical bag over her shoulder. Standing by the barrier post is ${rue}, holding a folded sheet of paper and watching her pass. Bright morning sun. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'taal', 'vela'],
    title: 'Opt In',
    premise:
      'The Ministry of Spare Parts on Ondine keeps a register of donors who agree that their parts may go to others once they no longer need them. Androids are enrolled automatically unless they opt out, on the grounds that their parts are standard. Mox has been enrolled. Vela regards this as a consent violation of the first order. Taal has been asked by the Ministry to mediate, and by Mox not to.',
    steps: [
      {
        title: 'Enrolled',
        setup:
          'Mox can opt out by form, which would make it the first android on Ondine to have done so. Or it can stay enrolled and decide later what it wants, which is a thing it has not yet done about anything. Vela’s bell has rung DID YOU ASK? at the Ministry’s front desk eleven times this morning, and the receptionist has started answering it.',
        options: [
          {
            label: 'Mox opts out, in writing',
            outcome:
              'Mox fills in the opt-out form, which has never been filled in, and finds that its fields are designed for a person declining on behalf of a toaster. It completes them anyway, in the first person. The Ministry processes it in four minutes and then convenes a meeting to discuss what it has done.',
            ending: 0,
          },
          {
            label: 'Mox stays enrolled while it decides',
            outcome:
              'Mox stays on the register and tells the Ministry that it is undecided, which the Ministry records as consent. Vela corrects the record. The Ministry corrects her correction. By noon the file contains six entries, three from each side, and Mox has decided to find out who would receive what.',
            ending: 1,
          },
        ],
        art: ({ mox, vela, style }) =>
          `Medium shot at a long marble ministry counter with a brass desk bell on it. Standing at the counter is ${mox}, holding a one-page paper form flat with one hand. Beside it stands ${vela}, holding the bell up beside her ear, while a weary receptionist in a grey cardigan leans back from the counter. Cool white light from tall windows. ${style}`,
      },
      {
        title: 'The Match',
        setup:
          'The Ministry has found a match: Corsa, an old maintenance android whose orange eyelid has seized shut. Mox’s orange lid would fit. Mox chose that lid itself, on the day it decided what to look like. Taal can read the room. It is very warm on Corsa’s side, and on Mox’s it gives nothing away at all.',
        options: [
          {
            label: 'Taal tells the Ministry what the room says',
            outcome:
              'Taal tells the Ministry that Mox’s temperature is consistent with no. Mox says that Taal is correct, and that it would have preferred to say so itself. Taal apologises, formally, at four degrees. He says he has spent his life learning that a translation is not a consent, and has just forgotten it in a single sentence.',
            ending: 0,
          },
          {
            label: 'Mox meets Corsa first',
            outcome:
              'Mox visits Corsa in the Ministry’s repair ward. They talk about lids for an hour and about other things for three. Corsa says it would be glad of the lid but not at any cost, and that it has been looking at the world through one eye for six years and has got used to the angle.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a quiet repair ward with white beds and steel trolleys. An elderly dented bronze maintenance android sits on the edge of a bed with one eye shut. Standing at the foot of the bed is ${taal}, his webbed hands folded, faint pale mist at his shoulders. Soft afternoon window light. ${style}`,
      },
      {
        title: 'Two Signatures',
        setup:
          'Vela is the only physician on Ondine qualified on both organic and synthetic patients, and the Ministry would like her to carry out whatever is decided. She will not touch either patient without consent from each, recorded separately. The Ministry’s form has one signature line, for the donor, and none for the recipient, who is assumed to be grateful.',
        options: [
          {
            label: 'Vela rewrites the form and stops there',
            outcome:
              'Vela drafts a new form with two signature lines and a third for anyone who wishes to change their mind. The Ministry adopts it. Under the new form neither Mox nor Corsa signs, and nothing is removed from anybody. Vela describes it as the most successful operation she has never performed.',
            ending: 0,
          },
          {
            label: 'Vela operates, with two consents recorded',
            outcome:
              'Mox and Corsa each sign their own line, in their own handwriting, with Taal as witness. Vela operates for two hours, asking both patients at each stage. Mox gives its orange lid. Corsa opens its eye and looks at the ceiling for a long time, and says the ceiling needs painting.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a clean white operating room under a large round surgical lamp. Standing at a steel table is ${vela}, holding a tiny silver screwdriver over an open brass panel in the head of an elderly bronze android lying on the table. A second steel table beside it holds a neat tray of small instruments. Bright white surgical light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'OPTED OUT',
        text: 'Ondine’s register is now opt-in for everyone, androids included, after a review that cited Vela’s bell eleven times. Mox is not on it. It says this was the first thing it ever decided it did not want, and that it found the experience clarifying. Corsa’s lid was freed by a patient technician with a small screwdriver and a drop of oil.',
        art: ({ mox, couch, style }) =>
          `Medium shot of ${couch}. Seated on the middle cushion is ${mox}, holding a single sheet of paper in both hands and reading it, its blue-lidded eye and orange-lidded eye both open. Black space and stars beyond the bubble, warm amber lamp light from above. ${style}`,
      },
      {
        title: 'A MATCHED PAIR',
        text: 'Corsa has an orange lid now, and Mox has a new one of its own choosing, in a shade of green it took a week to decide on. They write to each other. Ondine has added a second signature line to all its forms. Asked his view, Taal says that the operating theatre was the warmest room he has ever stood in, and declines to elaborate.',
        art: ({ taal, vela, style }) =>
          `Medium shot on the steps of a white stone ministry building. An elderly bronze maintenance android with one bright orange eyelid waves goodbye from the doorway. Standing on the steps below are ${taal}, raising one webbed hand, and ${vela}, holding the bell at her side. Warm late afternoon sun. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'jex', 'vela'],
    title: 'Index Case',
    premise:
      'One of Jex’s six banned peace anthems has escaped. All of Bellweather Station is humming it, involuntarily, and has been for nine days. The Station Health Authority has declared an outbreak. Vela has been appointed incident physician. Fen has been asked to run the cordon. Jex is, in the Authority’s language, the index case, although he has not played the song in nine years.',
    steps: [
      {
        title: 'The Cordon',
        setup:
          'The Authority wants the affected decks sealed, with a guard at every bulkhead. Fen’s boots began announcing CHECKPOINT the moment the word cordon was said. Fen built civilian corridors so that nobody would ever be held at a bulkhead again, and he has been asked to hold four thousand people at eleven of them.',
        options: [
          {
            label: 'Fen runs it as voluntary isolation',
            outcome:
              'Fen stands the guards down and pins up maps showing quiet rooms where anyone may go to hum in private, with tea. Ninety-two percent of the station uses them. The Authority calls it the most effective cordon in its records. Fen points out that it is not a cordon. The Authority minutes the objection and keeps the maps.',
            ending: 0,
          },
          {
            label: 'Fen opens every bulkhead',
            outcome:
              'Fen tells the Authority that the song is already on every deck, and that a bulkhead cannot stop a tune but can stop a family getting home. He opens all eleven. His boots announce CHECKPOINT at each one, and then, at the last, stop.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot in a wide grey station corridor at an open steel bulkhead door. Standing beside the door is ${fen}, pinning a hand-drawn paper map of the decks to the wall. Station residents in work clothes walk through the doorway past him, several with their eyes half closed and their lips pressed together, humming. Pale fluorescent light. ${style}`,
      },
      {
        title: 'Treatment',
        setup:
          'Vela has established that the only thing able to interrupt the anthem is another song of equal strength. Jex could write one. He has not finished anything new since the ban. It is also possible, Vela notes, that the patients would rather go on humming, and that nobody has asked them.',
        options: [
          {
            label: 'Jex writes a counter-song',
            outcome:
              'Jex writes a short song about nothing in particular, at the station canteen, on a napkin. It displaces the anthem within three days and then, having no anthem to push against, fades itself. Vela calls it the first treatment she has prescribed that finished its own course.',
            ending: 0,
          },
          {
            label: 'Vela asks the patients first',
            outcome:
              'Vela asks. She asks four thousand people, one deck at a time, with her bell. The station votes to keep humming. Several patients explain that it is a very good song, which is why it was banned, and that it has made the queue for the lifts much more pleasant.',
            ending: 1,
          },
        ],
        art: ({ vela, jex, style }) =>
          `Medium shot in a busy station canteen with long steel tables. Seated at a table is ${jex}, pencilling music notes onto a paper napkin. Standing beside him is ${vela}, holding the bell and a clipboard, looking down at the napkin. Residents eat behind them, humming. Warm canteen light. ${style}`,
      },
      {
        title: 'The Lift',
        setup:
          'The Authority’s inquiry wants to know how the anthem reached the station. Jex knows. Nine days ago he hummed four bars of it in a lift without noticing, an offence for which he has already been fined in two systems. Saying so means a third fine and a public record. Fen, who has watched hearings turn people into examples, has advised him to answer only the question he is asked.',
        options: [
          {
            label: 'Jex tells the inquiry about the lift',
            outcome:
              'Jex tells the inquiry exactly what happened in the lift, including the floor. He is fined a third time. Vela submits that humming in a lift is a symptom and not a crime. The inquiry agrees, and fines him anyway, at a reduced rate, which Jex pays in coins.',
            ending: 0,
          },
          {
            label: 'Jex lets the song go unclaimed',
            outcome:
              'Jex answers the question he is asked, which is whether he played the anthem. He did not. He hummed it. The inquiry records the song as of unknown origin, and under station law a song of unknown origin belongs to the station. The ban, which belongs to two governments, does not apply.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot inside a small brass station lift with a folding gate and a row of round floor buttons. Standing alone in the lift is ${jex}, carrying the instrument in its case, eyes on the ceiling, lips pursed. A small round security camera watches from one corner. Warm lift light, the corridor dim beyond the gate. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TWENTY-ONE DAYS',
        text: 'Bellweather Station was declared clear on the twenty-first day. The anthem faded, then the counter-song faded, which Vela says is what a cure should do. Fen’s quiet-room maps are now standard across the sector. Jex keeps the receipt for his third fine folded inside the napkin, and has started on another song that is for nothing in particular.',
        art: ({ fen, vela, style }) =>
          `Wide shot of a bright, calm station promenade with tall windows onto black space and stars. Residents walk and talk in small groups. Standing by a wall of hand-drawn paper maps are ${fen}, with his hands in his jacket pockets, and ${vela}, unpinning one map. Clear white daylight lamps. ${style}`,
      },
      {
        title: 'ENDEMIC',
        text: 'The anthem is now the official hum of Bellweather Station, classed by the Health Authority as endemic and harmless. It cannot be banned there, because nobody owns it. Jex visits when the couch passes and hears four thousand people humming a song he wrote and may not perform. He hums along. Humming is permitted.',
        art: ({ jex, style }) =>
          `Wide shot of a crowded station promenade where hundreds of residents of many species stand at the tall windows, eyes half closed, humming together. In the middle of the crowd stands ${jex}, holding the instrument case at his side and humming with them. Warm amber lamp light, black space and stars beyond the windows. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'kivo', 'vela'],
    title: 'Lapsed',
    premise:
      'The mining tender Hollis Grey has lost power in the Kettle Drift with nineteen people aboard, and its subscription to RescueLine, the sector’s only rescue service, lapsed on Tuesday over a missed payment of four credits. RescueLine has confirmed that it is aware of the situation and values the Hollis Grey as a former customer. Kivo can find the ship. Vela can treat the crew. Fen knows exactly what it is to stand at a line and decide who is on the wrong side of it.',
    steps: [
      {
        title: 'Former Customer',
        setup:
          'RescueLine’s dispatcher, a pleasant voice called Shona, explains that she cannot send a tug to a lapsed account. She can reinstate the account the moment the payment is made by the account holder, who is aboard the drifting ship and out of contact. Kivo’s wrists have already found the Hollis Grey’s pressure wake, nine hours out and slowing.',
        options: [
          {
            label: 'Go and get them',
            outcome:
              'Kivo reads the wake aloud and Fen steers by it. The couch reaches the Hollis Grey in six hours. Shona stays on the line throughout, and at the end says that she is not permitted to wish them luck, but that she has been doing it anyway, with the microphone off.',
            ending: 0,
          },
          {
            label: 'Fen pays the four credits for them',
            outcome:
              'Fen offers to pay the four credits. Shona explains that a payment from a third party requires a third-party payment form, which she sends. Fen completes it in guard’s block capitals in four minutes. The account is reinstated and a tug is dispatched, and Fen asks for a receipt in the Hollis Grey’s name.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Wide shot of ${couch}, in black space scattered with tumbling grey rocks. Crouching on the front cushion is ${kivo}, one thin wrist raised toward a small dark mining ship drifting far ahead with all its lights out. Cold starlight, warm lamp light on the cushions. ${style}`,
      },
      {
        title: 'The Waiver',
        setup:
          'The Hollis Grey’s crew is cold and frightened. Its captain has read every word of RescueLine’s terms, and will not let Vela aboard until she signs RescueLine’s liability waiver, the only rescue paperwork he has. The waiver states that the rescuer accepts all responsibility and that the rescued party consents to nothing.',
        options: [
          {
            label: 'Vela strikes it out and asks each of them',
            outcome:
              'Vela strikes out the waiver with one line and asks each of the nineteen, by name, whether they would like to be examined. Eighteen say yes. The nineteenth, the captain, says he would like to read the terms first, and then says yes, and sits down very suddenly.',
            ending: 0,
          },
          {
            label: 'Vela signs it and gets to work',
            outcome:
              'Vela signs the waiver without reading it, the first document she has ever signed that way, and goes to work. She is aboard for three hours. Afterward she asks for the waiver back, reads it in full, and writes CONSENT, PARTIAL across the top in the captain’s presence.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot inside a dim, frosted airlock of a small mining ship. A worried bearded captain in a thick orange work coat holds out a single sheet of paper and a pen. Facing him in the open hatch stands ${vela}, holding the bell in one hand. Behind him, miners in blankets huddle together. Cold blue emergency light, her lamp warm behind her. ${style}`,
      },
      {
        title: 'Exclusive Territory',
        setup:
          'RescueLine’s tug arrives when everything is done. It brings an invoice, addressed to the couch, for the rescue the couch has just performed, because rescues in the Kettle Drift are RescueLine’s exclusive franchise. The tug’s pilot hands it over apologetically. Fen’s boots announce CHECKPOINT at him, twice.',
        options: [
          {
            label: 'Refuse to pay, and tell the pilot why',
            outcome:
              'Fen tells the pilot about the gate he once guarded, and the day the rules changed and the people in front of it became trespassers. The pilot listens. Then he folds the invoice into a small square, puts it in his pocket and says that he will tell the office it was undeliverable.',
            ending: 0,
          },
          {
            label: 'Pay it, and add a clause',
            outcome:
              'Fen pays the invoice and attaches a proposed clause: any ship in danger is a customer, whatever its account says. RescueLine’s legal department, which would prefer this not appear in the news, adopts it within a week. The invoice is refunded with a voucher, which Fen gives to the Hollis Grey.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot in black space beside a huge boxy yellow rescue tug with floodlights. A young tug pilot in a yellow flight suit leans from its open hatch holding out a folded paper invoice. Standing on a scarlet velvet cushion facing him is ${fen}, arms folded, his heavy black boots planted wide. Hard white floodlight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UNDELIVERABLE',
        text: 'RescueLine has invoiced the couch for nineteen rescues and has received no payment and no reply. The invoices are filed as undeliverable by a tug pilot who has since left the company. Fen has drawn a map of the Kettle Drift, showing where a powerless ship ends up, and gives a copy to every miner he meets. Kivo checked every wake on it.',
        art: ({ fen, kivo, style }) =>
          `Medium shot in a smoky mining bar with low lamps and rough wooden tables. Standing at a table of miners in orange work coats is ${fen}, handing out folded hand-drawn paper maps. Beside him sits ${kivo}, tracing a line on one map with a thin finger. Warm amber lamp light. ${style}`,
      },
      {
        title: 'CLAUSE FOURTEEN',
        text: 'RescueLine’s terms now contain clause fourteen: any ship in danger is a customer. Shona reads it to every caller whose account has lapsed. The Hollis Grey renewed its subscription with the voucher and has never missed a payment since. Vela still refuses to sign waivers, and RescueLine has stopped sending them to her.',
        art: ({ vela, style }) =>
          `Medium shot in a small bright dispatch office with a curved desk of glowing dials. A young dispatcher in a headset smiles and speaks into her microphone. Seated in a visitor’s chair beside the desk is ${vela}, holding a mug of tea in both hands. Through the window behind them a yellow tug departs into black space. Soft warm light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'rue', 'tess'],
    title: 'The Trap Star',
    premise:
      'Chart-makers put false stars on their charts to catch anyone who copies them. Orrery and Daughters, the largest chart-maker in the Outer Arm, has found its false star, Quint’s Folly, on Tess’s chart, and is suing her for copying. Tess did not copy it. She has been there. Rue is defending. Kivo has been sent to confirm that Quint’s Folly does not exist, and their wrists have been whistling at its coordinates since the couch arrived.',
    steps: [
      {
        title: 'Cease and Desist',
        setup:
          'Orrery and Daughters will settle if Tess removes Quint’s Folly from her chart and pays a licence fee for every route she has flown near it. Rue’s view is that whether a star exists is a question of fact, and that facts are cheaper to establish than licence fees. Tess’s grandmother, who taught her to draw charts, also taught her to rub things out.',
        options: [
          {
            label: 'Contest it',
            outcome:
              'Rue files a defence of one sentence: the star is there. Orrery and Daughters replies with forty pages explaining that it cannot be, because they made it up. Rue observes that this is the first case they have argued in which the other side’s evidence is its own imagination.',
            ending: 0,
          },
          {
            label: 'Settle; Tess rubs it out',
            outcome:
              'Tess erases Quint’s Folly from her chart with a soft rubber, which takes a second, and pays the licence fee, which takes most of the supply budget. Rue records that she has erased a star she has personally visited. Tess says she has erased stars before. It runs in the family.',
            ending: 1,
          },
        ],
        art: ({ tess, rue, style }) =>
          `Medium shot at a small table on scarlet velvet button-tufted cushions, with a large hand-drawn paper star chart spread across it. Leaning over the chart is ${tess}, holding a small pink rubber above one inked dot. Seated beside her is ${rue}, holding a thick stack of paper bound with a bulldog clip. Warm lamp light, black space behind. ${style}`,
      },
      {
        title: 'Quint’s Folly',
        setup:
          'Whatever the lawyers decide, Kivo goes to look. At the coordinates there is no star. There is a small rock with eleven houses on it and, on a tall iron pole in the middle, a very large lamp. The settlers came because the chart showed a star. When they arrived there was none, so they built one. It is forty years old and has its own weather.',
        options: [
          {
            label: 'Ask the settlers to give evidence',
            outcome:
              'Kivo knocks on the first door and explains. The settlers hold a meeting under the lamp and agree, by a show of hands, to testify that they are real. They are mildly offended that it has come up. The oldest of them gives Kivo a jar of the lamp’s weather to take to court.',
            ending: 0,
          },
          {
            label: 'Leave before anyone sees them',
            outcome:
              'Kivo watches the houses from the edge of the rock until the lamp dims for evening, then leaves without knocking. They know about places that survive because nobody has written them down. On the way back their wrists are quiet for the first time since the case began.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Wide shot of a small grey rock floating in black space, with eleven little wooden houses clustered around a very tall iron pole topped by a huge glowing lamp. A thin drizzle falls from a small cloud around the lamp. Standing at the edge of the rock is ${kivo}, one thin wrist raised toward the lamp. Warm yellow lamp light, black starry sky. ${style}`,
      },
      {
        title: 'Judgment',
        setup:
          'The court must decide whether Quint’s Folly exists. If it does, the trap is void, Tess is cleared, and the rock goes onto every chart in the Outer Arm. If it does not, the eleven houses stay where nobody will look for them. Rue has drafted both arguments, and asks Tess to choose which one to run.',
        options: [
          {
            label: 'Argue that the star is real',
            outcome:
              'Rue argues that a lamp forty years old, with weather, is a star for every purpose of navigation. The settlers’ jar is entered as exhibit one. It rains briefly on the judge. The court finds that Quint’s Folly exists, and Orrery and Daughters is ordered to pay costs and to correct its own trap.',
            ending: 0,
          },
          {
            label: 'Argue that Tess drew a lamp',
            outcome:
              'Rue argues that the mark on Tess’s chart is a lamp, and that lamps are not charted and so cannot be copied. The court agrees on a narrow point. Tess is cleared. Orrery and Daughters keeps printing its false star, and nobody goes looking for the real one.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot in a tall wood-panelled courtroom. Standing at a lectern is ${rue}, raising a small glass jar in which a tiny grey raincloud drizzles. A grey-haired judge in a black robe leans forward from the bench to look, a few drops of rain on her spectacles. Warm lamp light, tall dark windows. ${style}`,
      },
    ],
    endings: [
      {
        title: 'QUINT’S FOLLY',
        text: 'Quint’s Folly is a star by order of the court and appears on every chart in the Outer Arm. The settlers receive post for the first time in forty years, most of it from chart-makers asking permission. Orrery and Daughters has quietly removed its other false stars, in case. Tess is credited as discoverer, of a lamp, and has decided that this counts.',
        art: ({ tess, style }) =>
          `Wide shot of a small grey rock in black space with eleven little wooden houses around a tall iron pole topped by a huge glowing lamp. A postman in a blue uniform hands a bundle of envelopes to a settler at a door. Standing nearby is ${tess}, holding a rolled paper chart under one arm. Warm yellow lamp light. ${style}`,
      },
      {
        title: 'A LAMP, UNCHARTED',
        text: 'Officially, Quint’s Folly is a fiction owned by Orrery and Daughters. In fact it is a lamp with eleven houses around it and its own small weather, which nobody visits because nobody believes in it. Tess keeps its position in her head, beside her grandmother’s harbor. Kivo’s wrists still whistle, once, whenever she unrolls the chart.',
        art: ({ kivo, tess, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated side by side are ${tess}, unrolling a large hand-drawn paper star chart across her knees, and ${kivo}, one thin wrist lifted above the paper. Far off in the black space behind them a single small yellow light glows. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'taal', 'tess'],
    title: 'Loyalty',
    premise:
      'The couch has bought its fuel cells at Galaxo stations for six years and holds four million Galaxo Points, which expire at midnight. Tess wants Platinum Navigator status, which carries a lounge and a name on a wall. Mox, who has never wanted anything for itself, has been told that a third of the points are its own and must be spent on something it wants. Taal has read the rewards catalogue and reports that it is lying, by temperature, on every page.',
    steps: [
      {
        title: 'The Catalogue',
        setup:
          'The catalogue offers a toaster, a weekend on a beach planet with conditions, a branded umbrella and Platinum status. Mox reads it twice and reports that it wants nothing in it, and would like that to be counted as a preference. Under Galaxo’s terms, points not redeemed by midnight pass to the Galaxo Foundation for Loyalty.',
        options: [
          {
            label: 'Ask Galaxo for something off the list',
            outcome:
              'Mox calls customer loyalty and asks what it can have that is not in the catalogue. The operator has never been asked this. She escalates it to a supervisor, who escalates it to a committee, which agrees to meet at eleven. Mox thanks them and says it will use the time to decide what it wants.',
            ending: 0,
          },
          {
            label: 'Pool the points for Tess’s Platinum',
            outcome:
              'Mox transfers its share to Tess and says that wanting something for someone else is still wanting, and counts. Tess thanks it with great formality. The pooled balance is enough for Platinum with a little over, which Galaxo offers to convert into an umbrella.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated cross-legged is ${mox}, holding a thick glossy catalogue open on its knees, its blue-lidded eye half closed. A boxed toaster and a folded striped umbrella sit on the cushion beside it. Black space beyond the bubble, warm amber lamp light. ${style}`,
      },
      {
        title: 'The Expiry',
        setup:
          'Taal reads the Galaxo station office, the coldest room on the station. The manager is lying about midnight. Points do not expire. They are moved into an account that she manages, and they have been moving there for years. Taal can say so in words, or say it in temperature and let her notice.',
        options: [
          {
            label: 'Taal tells her, in words',
            outcome:
              'Taal tells the manager, in plain words, what the room has told him. She looks at him for a long time. Then she extends the couch’s points to the end of the year, and asks him, after a pause, whether he would be willing to say the same thing to her regional manager, who is colder.',
            ending: 0,
          },
          {
            label: 'Taal lowers the room three degrees',
            outcome:
              'Taal lowers the room three degrees and waits. The manager notices. Without being asked, she upgrades Tess to Platinum, waives the expiry, and adds a complimentary umbrella. The room does not warm. She adds a second umbrella.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a small chilly station office with a counter, a rack of glossy catalogues and frost creeping across the window. Standing at the counter is ${taal}, with pale cold mist rising from his shoulders. Behind it a manager in a red company blazer holds out a folded umbrella toward him. Cold blue light. ${style}`,
      },
      {
        title: 'Redemption',
        setup:
          'Mox has decided what it wants: a room of its own, with a brass key, that nobody else may enter. Galaxo can provide one, unfolded behind the left armrest by a licensed contractor. Tess wants her name on the wall of every Galaxo lounge in the sector, which is a kind of fame. What remains of the points will buy one or the other.',
        options: [
          {
            label: 'Spend them on Mox’s room',
            outcome:
              'Tess asks for the room. The contractor unfolds it behind the left armrest in an afternoon: one chair, one lamp, one window onto the dark. Mox goes in, closes the door, and comes out an hour later. It does not say what it did there. It says it would like to do it again tomorrow.',
            ending: 0,
          },
          {
            label: 'Spend them on Tess’s name',
            outcome:
              'Mox asks for Tess’s name on the wall. The order goes through. Tess receives a Platinum lounge key in a velvet box, and gives it to Mox at once, on the grounds that Mox is the one who chose. Mox accepts and says that it will need to think about what a lounge is for.',
            ending: 1,
          },
        ],
        art: ({ tess, mox, style }) =>
          `Medium shot behind the left armrest of a scarlet velvet backrest, where a small plain pocket room with one chair, one lamp and one round window has just unfolded. Standing at its door is ${mox}, holding a small brass key. Watching from the cushion is ${tess}, chin propped on her hand. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'A ROOM OF ITS OWN',
        text: 'Galaxo has added one item to its catalogue: a room of one’s own, brass key included, for any customer with enough points and nothing in the catalogue they want. Only Mox has redeemed it. It goes there for an hour each day and has not said what it does. Taal reports that the room, from outside, reads as content.',
        art: ({ mox, style }) =>
          `Interior of a small plain room with bare wooden walls, one armchair, one brass lamp and a round window onto black space and stars. Seated in the armchair is ${mox}, hands folded in its lap, looking out of the window. A small brass key rests on the arm of the chair. Warm lamp light. ${style}`,
      },
      {
        title: 'PLATINUM NAVIGATOR',
        text: 'Tess Helio’s name is on the wall of four hundred Galaxo lounges, in gold. She has visited two and been recognised in neither. Mox uses her lounge key to sit in quiet rooms with free biscuits and decide what it wants. So far it has decided on the biscuits, which Tess says is a start, and Taal says is warm.',
        art: ({ tess, taal, style }) =>
          `Medium shot in a plush station lounge with green leather armchairs and a long wall of polished brass plates. Standing before the wall is ${tess}, tapping one brass plate with a fingertip. Seated in an armchair behind her is ${taal}, holding a small plate of biscuits on his knee. Soft golden lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'jex', 'tess'],
    title: 'A Word from Our Sponsor',
    premise:
      'Crumbley’s Crackers has offered to sponsor the couch for one voyage, for a fee that would buy a new force bubble. In return the crew must mention Crumbley’s in every transmission and perform the Crumbley’s jingle at every port. Tess has begun practising her smile. Jex is legally free to perform a jingle, since it is not an anthem, and has gone very quiet. Fen’s boots, fitted under the contract with a promotional chip, now announce CHECKPOINT, BROUGHT TO YOU BY CRUMBLEY’S.',
    steps: [
      {
        title: 'Every Transmission',
        setup:
          'Fen has read the contract twice with a guard’s eye and found that every transmission includes distress calls. A ship in trouble would hear Mayday, Mayday, brought to you by Crumbley’s. Tess points out that it would also hear the couch’s name, and that a rescue is very good for a name.',
        options: [
          {
            label: 'Fen strikes out the clause',
            outcome:
              'Fen strikes out every transmission and writes except emergencies above it, in block capitals, and initials it. Crumbley’s legal department accepts the amendment and cuts the fee by a third. Fen considers this the cheapest principle he has ever bought.',
            ending: 0,
          },
          {
            label: 'Leave the clause in',
            outcome:
              'The clause stays. That week the couch answers a real distress call, and Tess says the sponsor’s line at the end of it, clearly, as written. The rescued captain, a large man in a wet jumper, buys Crumbley’s for life. Crumbley’s renews the contract by return.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up on a scarlet velvet cushion where a long paper contract lies spread out. Kneeling over it is ${fen}, drawing a line through one paragraph with a thick pencil. Beside the contract stands an open red box of crackers. Warm amber lamp light from the left, black space behind. ${style}`,
      },
      {
        title: 'The Jingle',
        setup:
          'At the first port, Jex must perform the jingle. It is nine seconds long and in a key that does not quite exist. Jex can play it as written. He can also play it so well that nobody remembers whose crackers it is for. His anthems were banned because people remembered them.',
        options: [
          {
            label: 'Play it so well nobody hears the name',
            outcome:
              'Jex plays the jingle as a slow air, nine seconds stretched to four minutes. The port square goes silent. Afterward nobody can remember the brand, and several people ask him for the name of the song. He tells them it does not have one yet.',
            ending: 0,
          },
          {
            label: 'Play it exactly as written',
            outcome:
              'Jex plays it exactly as written, nine seconds, in the key that does not exist. The crowd sings it back on the second go. Jex finds, to his surprise, that being paid to play something nobody can ban is restful, and plays it four more times before the couch leaves.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a stone port square at dusk with a small wooden stage hung with red bunting. Standing on the stage is ${jex}, playing the instrument with his eyes closed. A crowd of dock workers of many species stands still in the square, holding red boxes of crackers. Warm orange lamplight. ${style}`,
      },
      {
        title: 'Brand Ambassador',
        setup:
          'Crumbley’s offers Tess a contract of her own, as brand ambassador: her face on every box. It is fame at last, on breakfast tables. The contract also asks for her route logs, for marketing purposes. Tess’s grandmother told her never to be useful to the powerful, and in its sector Crumbley’s is very powerful.',
        options: [
          {
            label: 'Tess turns it down',
            outcome:
              'Tess turns it down in a short letter, which Fen proofreads. Crumbley’s replies that it is disappointed and that the offer remains open. Tess frames the reply. She says it is the first time anyone has been disappointed in her for a good reason.',
            ending: 0,
          },
          {
            label: 'Tess signs, with Fen’s corrections',
            outcome:
              'Fen goes through the ambassador contract and strikes out the route logs, the location data and a clause about her grandmother. Crumbley’s accepts the rest. Tess signs. A photographer arrives the next morning, and she smiles exactly as practised.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot in a small bright photo studio with a white paper backdrop and two large soft lamps. Seated on a stool is ${tess}, smiling and holding up a single round cracker. A photographer in a striped shirt crouches in front of her with a camera, and a red box of crackers sits on a stand beside her. Bright soft studio light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UNSPONSORED',
        text: 'Crumbley’s withdrew its sponsorship after the second port, citing a jingle nobody could remember and a navigator who would not smile under contract. The couch still needs a new bubble. Fen’s boots still say BROUGHT TO YOU BY CRUMBLEY’S on Tuesdays and cannot be made to stop. Jex has kept the nine seconds and is making them into something longer.',
        art: ({ fen, jex, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on the cushion is ${fen}, holding one heavy black boot in his lap and turning a small screwdriver in its heel. Beside him sits ${jex}, playing the instrument quietly. An empty red cracker box lies on the armrest. Warm lamp light, black space behind. ${style}`,
      },
      {
        title: 'ELEVEN MILLION BOXES',
        text: 'The couch flew one voyage sponsored by Crumbley’s Crackers and bought its new bubble with the fee. Tess’s face is on eleven million boxes. Her routes are not. Jex can play the jingle in his sleep, and occasionally does. Fen’s boots were reset at Crumbley’s expense to say only CHECKPOINT, which he found he had missed.',
        art: ({ tess, style }) =>
          `Medium shot in a small grocery shop aisle lined with shelves of identical red cracker boxes, each printed with a smiling woman’s face. Standing in the aisle is ${tess}, holding one box at arm’s length and comparing its face with her own reflection in the shop window. Warm afternoon light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'omi', 'tess'],
    title: 'This Is Only a Test',
    premise:
      'The Varga Sector Emergency Broadcast Authority is running its annual test of the alert system, and has asked every ship to keep its warning devices silent for the hour so as not to cause confusion. Omi has been asked to keep its bells still. Ten minutes into the hour Kivo’s wrists begin whistling at a pressure front that is not part of any test: a solar storm, arriving in forty minutes. Tess has the positions of every shelter in the sector.',
    steps: [
      {
        title: 'Within the Test Window',
        setup:
          'Under the Authority’s rules, a real emergency occurring during a test is to be reported to the Authority, which will issue a real alert once the test has concluded, in fifty minutes. The storm will arrive in forty. Omi’s warning chimes were once silenced for interrupting an official ceremony. Omi has not rung since the hour began, and all six bells are very slightly trembling.',
        options: [
          {
            label: 'Omi rings the warning now',
            outcome:
              'Omi rings the warning of its home belt across every frequency it can reach. Ships across the sector hear it. Some recognise it. The rest recognise that a small stone being is ringing as loudly as it can during a test, and draw the correct conclusion. The Authority logs an unauthorised alert.',
            ending: 0,
          },
          {
            label: 'Report it and demand the test end early',
            outcome:
              'Kivo reports the storm to the duty officer, who consults the test protocol and finds a clause permitting early termination on the written request of a qualified observer. Kivo asks what counts as qualified. The duty officer looks at the protocol, then at the storm, and decides it is Kivo.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Standing on the middle cushion is ${omi}, tapping one of its bells with a long thin tuning rod, all six bells swinging. Beyond the bubble a huge wall of glowing orange solar storm rolls in from the right across black space. Orange storm light, warm lamp light. ${style}`,
      },
      {
        title: 'Shelters',
        setup:
          'Tess knows where every shelter in the sector is, including several that appear on no public chart, because they are sanctuaries and their safety depends on nobody knowing. For most ships the nearest public shelter is forty minutes away. The nearest sanctuary is four.',
        options: [
          {
            label: 'Tess sends ships to the sanctuary',
            outcome:
              'Tess broadcasts the sanctuary’s position. Eleven ships reach it with a minute to spare. The sanctuary takes them in without a word and closes its doors behind them. Tess sits on the armrest afterward and tells nobody what she has just given away.',
            ending: 0,
          },
          {
            label: 'Tess routes ships to public shelters, one by one',
            outcome:
              'Tess talks forty ships to the public shelters one at a time, plotting each route aloud from memory, faster than any of them could have done it alone. The last arrives at the thirty-ninth minute. The sanctuary stays a secret. Tess’s voice gives out at the fortieth.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Close-up of a scarlet velvet armrest. Leaning on it is ${tess}, holding a transparent navigation disk covered with many small green dots, speaking into a small brass handset on a coiled cord. Behind her through the bubble, small ships stream away toward a distant ring of lights. Orange storm glow from the right. ${style}`,
      },
      {
        title: 'Results',
        setup:
          'After the storm the Authority publishes the results of its test and grades the sector’s response. It has also offered Omi a post, Sector Warning, part time, on condition that it ring only when the Authority asks. Omi has the right to say no with its small gong. It also has the right to say nothing at all.',
        options: [
          {
            label: 'Omi declines, and keeps its silence',
            outcome:
              'Omi says nothing at the meeting, which lasts an hour. The Authority waits. At the end it rings the small gong once, which means no. The Authority fines it for the unauthorised alert and thanks it for its time, in that order.',
            ending: 0,
          },
          {
            label: 'Omi accepts, with the gong',
            outcome:
              'Omi accepts the post on one condition: it may refuse any shift by ringing the small gong, and it may ring a warning whenever there is one, whatever the hour. The Authority agrees to the second condition in writing and to the first by silence, which Omi accepts as fluent.',
            ending: 1,
          },
        ],
        art: ({ kivo, omi, style }) =>
          `Medium shot in a plain grey meeting room with a long table of officials in navy uniforms. Standing on a chair at the near end is ${omi}, holding a long thin tuning rod beside its smallest bell. Seated next to it is ${kivo}, both thin wrists resting on the table. Flat white light from a high window. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THIS IS NOT A TEST',
        text: 'The storm reached the Varga Sector in the forty-first minute, and every ship in it was somewhere safe. The Authority fined Omi for an unauthorised alert. The fine was paid within the hour by forty ships, in coins left in a bowl beside its smallest gong. The sanctuary that took in eleven ships has asked to be forgotten again, and Tess is doing her best.',
        art: ({ omi, couch, style }) =>
          `Medium shot of ${couch}. Standing on the armrest is ${omi}, beside a small brass bowl heaped with coins. Several small battered ships hover around the couch with their hatches open, and a pilot leans out of one to drop another coin into the bowl. Calm black space, warm lamp light. ${style}`,
      },
      {
        title: 'PROPER CHANNELS',
        text: 'The Varga Sector Emergency Broadcast Authority now ends its test the moment anything real happens, under a clause Kivo dictated over the radio. Omi is Sector Warning, part time, and rings the small gong at about one shift in three. The Authority has learned not to ask why. Tess’s public shelter routes are taught in schools.',
        art: ({ kivo, style }) =>
          `Medium shot in a small bright classroom with wooden desks. Children of many species sit holding paper star charts. Standing at the front beside a large hand-drawn chart of glowing shelter dots pinned to the wall is ${kivo}, one thin wrist raised and pointing at a dot. Warm daylight through tall windows. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'rue', 'sora'],
    title: 'Terms of Breathing',
    premise:
      'The force bubble needs a firmware update, and the update will not install until someone aboard accepts the new terms of service. The terms run to four thousand one hundred and twelve clauses. Rue has offered to read them, which will take a month. Mox read them in the time it took to open the file and has opinions about clause 2,207. Sora has pointed out that nobody has asked the bubble.',
    steps: [
      {
        title: 'Scroll to the Bottom',
        setup:
          'The accept button stays grey until the reader has scrolled to the end. Mox has scrolled to the end. Rue has reached clause nine and stopped to annotate it. The current firmware expires on Friday, after which the bubble will run on its emergency setting: it will keep everyone alive and fold away the pocket rooms, the lamp and the kettle.',
        options: [
          {
            label: 'Rue reads every clause',
            outcome:
              'Rue reads every clause, in order, in the lamp-lit pocket room, with a pencil. Mox brings tea at intervals and points out, each time, which clause it would have skipped. On Thursday night Rue reaches clause 4,112, which thanks the user for reading. Rue writes a reply to it in the margin.',
            ending: 0,
          },
          {
            label: 'Let Mox summarise, and decide from that',
            outcome:
              'Mox summarises four thousand clauses in eleven sentences, nine of which are fine. Rue checks the other two against the full text and agrees with Mox in both cases, which they record as the first time a summary has been more accurate than its source.',
            ending: 1,
          },
        ],
        art: ({ rue, mox, style }) =>
          `Medium shot in a small lamp-lit pocket room with a wooden desk. Seated at the desk is ${rue}, reading a very long paper scroll that unrolls off the desk and across the floor, a pencil in one hand. Standing in the doorway is ${mox}, holding a tray with a teapot and one cup. Warm amber lamp light. ${style}`,
      },
      {
        title: 'Clause 2,207',
        setup:
          'Clause 2,207 permits the manufacturer to display advertisements on the inside of the bubble during periods of low activity, which it defines as sleep. Clause 2,208 provides that by continuing to breathe inside the bubble, the user accepts clause 2,207. Mox has described clause 2,208 in its measured voice and asked Rue whether it is legal.',
        options: [
          {
            label: 'Reject the update over it',
            outcome:
              'Rue writes to the manufacturer that the crew will not accept a clause that turns breathing into a signature. The manufacturer replies that the clause is standard. Rue replies that so was the clause they once wrote that made people invisible, and that they have stopped accepting standard as a reason.',
            ending: 0,
          },
          {
            label: 'Accept, and have Sora point the adverts outward',
            outcome:
              'The crew accepts. Sora reverses the bubble’s projection with four hands while two hold the lamp, so that the advertisements play on the outside. Passing ships now see a perfume advert drifting through space with a couch inside it. The manufacturer considers this compliance.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Wide shot in black space of ${couch}. A huge glowing image of a perfume bottle and a pink rose is projected across the outside of the bubble. Kneeling on the backrest is ${sora}, four hands turning small brass dials on a panel and two hands holding up a lamp. Pink projected light, black starry space. ${style}`,
      },
      {
        title: 'The Bubble’s View',
        setup:
          'Sora takes four hands off the coupling and lays them on the bubble’s rim and asks what it wants. The bubble, which has run for two hundred years on firmware written for a smaller couch, says through the hum that it would like to be updated, would like not to show advertisements, and does not see why it should have to choose.',
        options: [
          {
            label: 'Sora writes the bubble its own update',
            outcome:
              'Sora writes the bubble a firmware update by hand over three nights, six hands at three keyboards. It is unsigned, unsupported and contains no clause 2,207. The bubble installs it on Saturday and hums a semitone higher, which Sora says is satisfaction and Mox says is a rounding error.',
            ending: 0,
          },
          {
            label: 'Rue negotiates on the bubble’s behalf',
            outcome:
              'Rue writes to the manufacturer as counsel for the bubble. After two weeks and three letters the manufacturer offers a licence for bubbles that can state a preference, with no advertising, the first of its kind. The bubble accepts through Sora. Rue bills it nothing and notes the fee as precedent.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Close-up at the edge of a thin clear bubble with a faint pale-blue rim, above scarlet velvet cushions. Kneeling at the rim is ${sora}, four hands pressed flat against the clear wall and two hands resting on her knees, head tilted to listen. Black space and stars outside, warm lamp light inside. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TERMS DECLINED',
        text: 'The couch runs on firmware Sora wrote by hand, unsigned, unsupported and free of clause 2,207. The manufacturer has written twice to say the bubble is no longer covered. The bubble has replied once, through Sora, that it never was. Rue has pinned the terms, all four thousand clauses, to the inside of a pocket-room door. It took a week and most of the drawing pins.',
        art: ({ rue, style }) =>
          `Medium shot in a small pocket room whose wooden door is covered from top to bottom in hundreds of small pinned paper sheets. Standing on a stool at the door is ${rue}, pressing one more pin into the last sheet at the top. A tin of drawing pins sits on the floor. Warm lamp light. ${style}`,
      },
      {
        title: 'AGREED, AS AMENDED',
        text: 'The bubble runs the latest firmware under a licence negotiated by its own counsel, with clause 2,207 struck through and initialled by the manufacturer. Four other bubbles have since asked for the same terms. Mox reads every update on the day it arrives and sends the crew a one-line summary. It usually says fine.',
        art: ({ mox, couch, style }) =>
          `Medium shot of ${couch}. Seated on the left cushion is ${mox}, holding a single small sheet of paper and looking at it with both eyes. Above it, the inside of the bubble is clear, with black space and bright stars beyond. Warm amber lamp light from the right. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'jex', 'rue'],
    title: 'Performing Rights',
    premise:
      'Brin’s oxygen garden grows best to music, and for years Jex has played to it in the evenings. Last month the garden began humming the tunes back. The Interstellar Performing Rights Society has sent an inspector to collect royalties, because the garden has been performing Jex’s banned anthems in public, through the bubble, to passing ships. Performing the anthems is also a crime in two systems. Rue has been asked to represent the garden, the composer and, if it comes to that, the Society.',
    steps: [
      {
        title: 'Public Performance',
        setup:
          'The inspector has a decibel meter and a ledger. Under the Society’s rules a performance is public if it can be heard outside the household, and she heard this one from her ship. Brin points out that the garden does not know the songs are banned and would not understand the ban if it were explained, which she considers a point in its favour.',
        options: [
          {
            label: 'Argue the garden is a performer in its own right',
            outcome:
              'Rue argues that the garden interprets the songs rather than repeating them, and is therefore a performer. The inspector listens to the garden for an hour with her eyes shut. She agrees. She also notes, for the ledger, that it takes the second verse noticeably slower than the composer.',
            ending: 0,
          },
          {
            label: 'Argue that the couch is a household',
            outcome:
              'Rue argues that the couch is a dwelling, however it moves, and that its bubble is a wall. The inspector measures the bubble and accepts it as a wall, on condition that the garden hums more quietly when ships pass. Brin explains the condition to the garden, which lowers its leaves.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot behind a scarlet velvet backrest, where green vines, ferns and small white flowers grow in a thick tangle. A stern inspector in a brown tweed coat holds a brass decibel meter toward the leaves and a ledger under her arm. Standing among the plants is ${brin}, one hand resting on a vine. Soft green light, warm lamp light. ${style}`,
      },
      {
        title: 'Who Owes Whom',
        setup:
          'If the garden is a performer, Jex is owed royalties as composer, for songs he is forbidden to perform. If he takes the money, he is profiting from banned anthems, which carries its own fine. If he refuses it, the money goes to the Society’s general fund, which pays for inspectors.',
        options: [
          {
            label: 'Jex assigns his royalties to the garden',
            outcome:
              'Jex signs his royalties over to the garden. Rue drafts the assignment, the garden accepts it by putting out a new leaf, and Brin countersigns as its guardian. The Society’s ledger now shows a fern receiving payment for a peace anthem, and the inspector initials the page without comment.',
            ending: 0,
          },
          {
            label: 'Jex refuses the money',
            outcome:
              'Jex refuses the royalties in writing. The money goes to the general fund and pays, according to the Society’s next annual report, for the inspector’s new decibel meter. She sends him a photograph of it. He keeps the photograph on his instrument case, between the two flags.',
            ending: 1,
          },
        ],
        art: ({ jex, rue, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on the armrest is ${jex}, signing a sheet of paper on top of his closed instrument case. Seated beside him is ${rue}, holding out a second sheet and a pen. Green leaves trail over the backrest behind them. Warm amber lamp light. ${style}`,
      },
      {
        title: 'The Repertoire',
        setup:
          'Brin would like the garden to learn some songs that are not banned anywhere. Jex has not finished many new songs since the ban. The garden, consulted through Brin, prefers the anthems, and has started humming them in the mornings as well as the evenings.',
        options: [
          {
            label: 'Let the garden choose its repertoire',
            outcome:
              'Brin tells the garden it may hum whatever it likes. It hums all six anthems in order every evening, at the agreed volume. Jex sits on the armrest and listens. He is not permitted to perform them, and there is no rule anywhere against listening.',
            ending: 0,
          },
          {
            label: 'Jex teaches it new songs',
            outcome:
              'Jex sits with the garden every evening for a month and plays it new songs, one a night, unfinished at first. The garden hums back the parts it likes. By the end there are eleven songs, finished between them, none banned yet. Rue registers them in two names, one of them a fern.',
            ending: 1,
          },
        ],
        art: ({ jex, brin, style }) =>
          `Medium shot in the evening behind a scarlet velvet backrest thick with green vines and ferns. Sitting cross-legged among the leaves is ${jex}, playing the instrument softly. Kneeling beside him is ${brin}, holding one leafy vine up toward him. Soft green leaf light and warm lamp light, black space above. ${style}`,
      },
    ],
    endings: [
      {
        title: 'REGISTERED PERFORMER',
        text: 'The oxygen garden is a registered performer with the Interstellar Performing Rights Society, the first to photosynthesise. It hums six banned anthems to passing ships each evening and earns royalties on them, from which the Society deducts the fines and pays the balance in compost. Jex listens from the armrest. Brin says the garden has never been happier, and the garden agrees, slowly.',
        art: ({ brin, couch, style }) =>
          `Wide shot of ${couch}, with a thick tangle of green vines and ferns climbing the whole backrest, every leaf turned toward a small passing cargo ship. Standing on the middle cushion is ${brin}, holding up an open paper ledger toward the ship. Warm lamp light and soft green light, black space. ${style}`,
      },
      {
        title: 'HOUSE CONCERTS',
        text: 'The garden sings only inside the household now, which Rue has defined to include anyone sitting on a cushion. Jex has written it eleven songs, all still legal. The inspector visits on her days off, as a guest, sits on the left cushion and is, for an hour, household. She has never brought the meter.',
        art: ({ rue, style }) =>
          `Medium shot in the evening on scarlet velvet button-tufted cushions. Seated on the left cushion is a woman in a brown tweed coat with her eyes closed, holding a cup of tea. Seated beside her is ${rue}, also holding a cup. Green vines curl over the backrest above them. Warm lamp light, black space beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'kivo', 'rue'],
    title: 'Adverse Possession',
    premise:
      'While the couch was parked for a month beside a small asteroid in the Sallow Reach, Brin’s garden grew down the brass feet and across the rock. Under the Reach’s homestead law, whoever cultivates unclaimed land for thirty days without objection becomes its owner. The garden has done so for thirty-one. Rue has confirmed that the garden now owns an asteroid. Kivo’s wrists have been whistling at the rock since day twenty-nine, and Kivo would like to know why.',
    steps: [
      {
        title: 'Title',
        setup:
          'The Reach’s land registry needs a name for the deed. The garden has none. Brin once saved a refugee dome with a garden that went on to cover a sacred orchard, and she refuses to call that a clean success; she will not call this one a success either. Rue proposes registering the garden as owner with Brin as trustee. Brin proposes declining the rock.',
        options: [
          {
            label: 'Hold the title until Kivo knows why',
            outcome:
              'Rue writes to the registry asking for the title to be held in abeyance, a phrase the registry has to look up. It agrees. Kivo is given a week. Brin thanks Rue for not making her decide, and Rue says that deciding later is a legal remedy and they recommend it often.',
            ending: 0,
          },
          {
            label: 'Register the garden as owner',
            outcome:
              'Rue registers the garden as owner and Brin as trustee. The deed arrives by post, describing the owner as Garden, Oxygen, One, with a pressed leaf where the signature would be. Brin reads it twice and says, carefully, that this is not yet a success.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Wide shot of ${couch}, parked beside a small grey asteroid. Thick green vines grow down from the backrest, around the brass feet and out across the rock. Standing on the rock among the vines is ${brin}, looking down at the leaves at her feet. Soft green light, black starry space. ${style}`,
      },
      {
        title: 'Prior Claim',
        setup:
          'Kivo crawls across the rock with one wrist against the stone and finds the cause: a lichen colony older than the Reach, which grows a millimetre a century and has been objecting to the garden for thirty-one days in a pressure pattern too slow for the registry to notice. It was here first. Under homestead law an objection counts only if it is lodged in writing.',
        options: [
          {
            label: 'Rue lodges the objection for the lichen',
            outcome:
              'Rue lodges the objection in writing on the lichen’s behalf, with Kivo’s readings attached as a translation. The registry accepts it. The lichen becomes the first client Rue has represented whose instructions arrived over a period of four weeks, and the most patient.',
            ending: 0,
          },
          {
            label: 'Brin talks to the lichen directly',
            outcome:
              'Brin lies flat on the rock beside Kivo for an afternoon, and the garden and the lichen exchange what Brin describes as a very slow conversation about edges. Kivo translates the lichen’s half. By evening both have agreed to talk again, at the lichen’s pace.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Close-up of a bare grey rock surface patched with flat rings of pale yellow and grey lichen. Lying flat on the rock is ${kivo}, one thin wrist pressed against the lichen and head turned to listen. The edge of a green vine reaches toward them from the left. Cold white starlight, soft green glow. ${style}`,
      },
      {
        title: 'Boundaries',
        setup:
          'However the title falls, the garden has to stop somewhere. Brin can cut it back to the brass feet, which the garden will regard as an amputation, or she can draw a line across the rock and ask both the garden and the lichen to keep to it, which neither has ever done.',
        options: [
          {
            label: 'Cut the garden back to the feet',
            outcome:
              'Brin cuts the garden back to the brass feet in one long afternoon, with the shears and with apologies. The garden is quiet for a week. The lichen, according to Kivo, is relieved, though it will be some centuries before the relief is complete.',
            ending: 0,
          },
          {
            label: 'Draw a line and ask both to keep it',
            outcome:
              'Brin draws a line across the rock in white chalk and explains it to the garden and, through Kivo, to the lichen. The garden stops at the chalk the next morning. The lichen does not cross it either, though Rue notes that this may be because it has not yet noticed it.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot on a small grey asteroid. Crouching on the rock is ${brin}, drawing a long straight white chalk line across the stone. On one side of the line green vines spread, and on the other side flat rings of pale yellow lichen. Black starry space, cool white light from the left. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PRIOR CLAIM',
        text: 'The asteroid belongs, by registered deed, to a lichen colony, which lodged its objection through counsel and won. It is the oldest landowner in the Sallow Reach, and the slowest. The garden grows only on the couch again. When the couch passes, Kivo puts a wrist to the bubble and reports that the lichen is still, very gradually, relieved.',
        art: ({ rue, style }) =>
          `Medium shot on a small grey asteroid covered in flat rings of pale yellow and grey lichen. Kneeling on the rock is ${rue}, laying a folded paper deed tied with red ribbon down on the lichen and weighting it with a small stone. Black starry space, cool white light. ${style}`,
      },
      {
        title: 'SHARED TITLE',
        text: 'The asteroid has two registered owners, a garden and a lichen, and a chalk line that both have kept for a year, the garden by stopping and the lichen by not yet noticing. Rue registered the deed in both names. It is the only property in the Sallow Reach where the boundary dispute is, by agreement, ten thousand years long.',
        art: ({ kivo, brin, style }) =>
          `Wide shot of a small grey asteroid split by a long white chalk line, green vines on one side and pale yellow lichen on the other. Sitting on the line are ${kivo}, one thin wrist resting on the lichen side, and ${brin}, one hand resting on the vine side. Black space and stars, soft green light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'mox', 'sora'],
    title: 'Reupholstered',
    premise:
      'The couch has been selected for Reupholstered!, a renovation programme broadcast to eleven systems, in which a presenter with very white teeth transforms a tired vessel in seven days. Nobody aboard applied. Sora’s six elbows are split on whether the couch did. Mox has been asked by the producers to cry at the reveal, and has asked whether that is a request or a term of contract. Jex has been offered the theme tune.',
    steps: [
      {
        title: 'The Vision',
        setup:
          'The presenter’s vision is grey: grey linen in place of the scarlet velvet, chrome legs in place of the brass feet, and the pocket rooms knocked through into one open-plan space. Sora asks the couch, as she would ask any machine, what it thinks. It creaks at the word grey and again, more loudly, at open-plan.',
        options: [
          {
            label: 'Sora reports the objection on camera',
            outcome:
              'Sora tells the camera that the vessel has objected, and plays back the creak. The presenter laughs, then stops. The director calls a meeting. The production does not know how to renovate a client that has said no, and spends two days filming itself deciding.',
            ending: 0,
          },
          {
            label: 'Negotiate the vision down to one room',
            outcome:
              'Sora offers the presenter one pocket room, the smallest, to do as he likes. He accepts, on the grounds that one grey room is a story and none is a cancellation. The couch creaks once. Sora reports this as consent, provisional.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Medium shot beside ${couch}. A tanned presenter in a tight grey suit with very white teeth holds up a swatch of grey linen against the velvet. Standing beside him is ${sora}, four hands resting on the backrest and two hands held up, palms out. A camera operator films from the left. Bright studio lights. ${style}`,
      },
      {
        title: 'The Tears',
        setup:
          'The reveal is tomorrow. The producer explains to Mox that the audience needs to see a crew member cry. Mox can produce tears on purpose, by opening a coolant line. It has never cried any other way, and is not sure whether it would want to. It has given its opinion of the request, which is accurate, in its measured voice.',
        options: [
          {
            label: 'Mox declines to cry on cue',
            outcome:
              'Mox declines. The producer asks whether it could look sad instead. Mox says it will look however it looks. At the reveal it looks at the couch for a long time, then says, to camera, that it is glad the couch is still red. The producer keeps the shot.',
            ending: 0,
          },
          {
            label: 'Mox cries, and explains how',
            outcome:
              'Mox cries on cue, then turns to the camera and explains the coolant line, valve by valve, in close-up, while the tears are still running. The producer starts to stop the take and then does not. It becomes the most watched minute of the series.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up of ${mox}, standing in front of a scarlet velvet backrest under bright studio lights, a thin clear tear running down from its orange-lidded eye. It points with one finger to a small open panel at its own temple where a fine coolant tube shows. A boom microphone hangs above. Bright white light. ${style}`,
      },
      {
        title: 'The Theme',
        setup:
          'The programme needs a theme tune: short, catchy, and played over the reveal. Jex has written one. It is very good, and because it is very good he is worried that it will be banned in two systems by Friday, as his anthems were. The contract assigns the tune to the programme for ever.',
        options: [
          {
            label: 'Jex keeps the tune for the couch',
            outcome:
              'Jex withdraws the tune and plays the producers something forgettable instead, which he writes in eleven minutes. He plays the good one that night on the armrest, once, for the crew. Sora records it with a spare microphone and keeps it in the coupling cupboard.',
            ending: 0,
          },
          {
            label: 'Jex signs the tune over',
            outcome:
              'Jex signs the tune over to the programme. It plays over the reveal in eleven systems. By Friday it has been banned nowhere, and it is being hummed in hardware shops, which Jex finds that he does not mind at all.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot on a television studio floor with tall lights on stands and cables taped to the floor. Seated on a folding chair is ${jex}, playing the instrument, while a producer with a headset and clipboard listens with her head tilted. A camera on a dolly faces him. Bright studio light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'AS FOUND',
        text: 'Reupholstered! broadcast its only episode in which nothing was reupholstered. The couch is scarlet and its feet are brass. In the last minute the presenter is seen sitting on the middle cushion with his shoes off, saying nothing. It is the most watched episode the programme has made. Sora has had letters from four vessels asking how to refuse.',
        art: ({ couch, style }) =>
          `Medium shot of ${couch}. A tanned presenter in a grey suit sits alone on the middle cushion with his shoes off beside him, his socked feet tucked up, looking out at the stars. A camera on a tripod stands in the foreground. Black starry space, warm amber lamp light. ${style}`,
      },
      {
        title: 'THE REVEAL',
        text: 'One pocket room behind the backrest is grey linen and chrome now, and the couch keeps its door shut. Everything else is scarlet. The reveal went out to eleven systems with Mox explaining its coolant line in close-up and Jex’s tune over the end. The tune is hummed in hardware shops and has, so far, been banned nowhere.',
        art: ({ sora, mox, style }) =>
          `Medium shot behind a scarlet velvet backrest at the open door of a small pocket room fitted out in grey linen and chrome furniture. Standing at the door are ${sora}, one hand on the doorknob, and ${mox}, looking inside. Cold white light in the grey room, warm lamp light outside. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'mox', 'sora'],
    title: 'Harrowfield',
    premise:
      'The couch has stopped at the Harrowfield Agricultural Show on a farming moon. Brin has entered the largest of her shoulder mushrooms in the giant vegetable class. Sora has entered the couch in vintage traction, against a row of steam tractors. Mox, as the only visitor with no agricultural interests and very accurate opinions, has been asked to judge the jam.',
    steps: [
      {
        title: 'On a Plate',
        setup:
          'The show committee rules that Brin’s mushroom cannot be judged while it is attached to Brin, because exhibits must be presented on a plate. Brin can pick it, which she regards as surgery, or she can enter herself, which the rules do not forbid, in the class for vegetables grown by the exhibitor.',
        options: [
          {
            label: 'Brin enters herself, on a plate',
            outcome:
              'Brin stands on a very large serving plate on the judging table for two hours, beside a marrow. The judges walk round her twice. The committee holds an emergency meeting and amends the rules, for next year, to admit exhibitors as their own produce. Brin is placed second. The marrow wins.',
            ending: 0,
          },
          {
            label: 'Brin picks the mushroom',
            outcome:
              'Brin picks the mushroom with a small ceremony and a clean blade, and lays it on a plate. It is the size of a hat. The judges measure it twice and award it first in class. Brin accepts the rosette and says that it will grow back, which is more than the marrow can say.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot inside a large white show tent with long trestle tables of giant marrows, pumpkins and onions. Standing on a huge white serving plate on one table is ${brin}, very still, while two elderly judges in tweed jackets walk around her with a measuring tape. Soft daylight through the canvas. ${style}`,
      },
      {
        title: 'Forty-One Jars',
        setup:
          'Mox has been asked to judge forty-one jars of jam, and it has an accurate opinion of every one. Jar thirty-two, made by the committee chair’s mother, has won for thirty years and is expected to win again. It is mediocre. Several people have told Mox, separately and quietly, that its opinions are its own.',
        options: [
          {
            label: 'Award the prize to the best jar',
            outcome:
              'Mox awards first prize to jar seven, made by a nine-year-old, which is the best. The tent goes silent. The chair’s mother, eighty-four, stands up, crosses to jar seven, tastes it and says it is about time. She asks the nine-year-old for the recipe.',
            ending: 0,
          },
          {
            label: 'Give every jar its own exact verdict',
            outcome:
              'Mox writes forty-one verdicts, each accurate and none the same, and awards every jar a rosette for what it does best. The show runs out of rosettes. Jar thirty-two receives Most Consistent, which the chair’s mother pins to her coat and wears for the rest of the day.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot inside a white show tent at a long table set with dozens of small glass jars of red, orange and purple jam. Standing at the table is ${mox}, holding a small silver spoon up to its mouth, its blue-lidded eye closed. A crowd of farmers in caps and headscarves watches in silence. Soft daylight through canvas. ${style}`,
      },
      {
        title: 'Vintage Traction',
        setup:
          'In vintage traction each entry must pull a loaded hay cart across the showground. The steam tractors are a hundred years old and enormous. The couch is two hundred and has never pulled anything. Sora has convened her elbows: four want to ask the couch whether it would like to try, and two have already tied on the rope.',
        options: [
          {
            label: 'Ask the couch first',
            outcome:
              'Sora asks. The couch would like to try. It pulls the cart at a walking pace, steadily, and finishes last by eleven minutes. The crowd follows it all the way across the field. The steam tractor drivers stand by their engines with their caps in their hands.',
            ending: 0,
          },
          {
            label: 'Pull with everything Sora has',
            outcome:
              'Sora diverts the bubble’s whole drive to the brass feet, six hands on six valves. The couch takes the cart across the field in forty seconds and the bales stay on. The steam tractors’ drivers ask to see the coupling. Sora shows them, and keeps two hands over the part she does not want copied.',
            ending: 1,
          },
        ],
        art: ({ sora, Couch, style }) =>
          `Wide shot of a green showground field on a farming moon with a huge pale planet in the sky. ${Couch}, hauls a wooden cart stacked with hay bales on a thick rope, beside a row of large black steam tractors. Standing on the cushion is ${sora}, six hands gripping the rope and brass valves. Bright afternoon sun. ${style}`,
      },
    ],
    endings: [
      {
        title: 'LAST BY ELEVEN MINUTES',
        text: 'The couch came home from Harrowfield with a rosette for Highly Commended, a jar of a nine-year-old’s jam and a copy of the revised show rules, which now admit exhibitors as their own produce. Brin will be the first to be judged under them. The couch has been invited back for traction, to finish last again, by popular request.',
        art: ({ brin, couch, style }) =>
          `Medium shot of ${couch}, parked at the edge of a green showground at sunset. A green rosette is pinned to the backrest. Seated on the cushion is ${brin}, holding a small glass jar of red jam up to the light. Bunting and tents behind, warm orange sunset light. ${style}`,
      },
      {
        title: 'THE TRACTION CUP',
        text: 'The couch won vintage traction, Brin’s mushroom won the giant vegetable class, and Mox’s forty-one verdicts were printed in the parish newsletter in full. Best in Show went to the couch. The rosette hangs on the backrest. Sora reports that the couch has held itself slightly straighter ever since, and that she has not asked it why.',
        art: ({ mox, sora, style }) =>
          `Medium shot at the judging ring of a green showground. A large red and gold rosette is pinned to a scarlet velvet backrest. Standing beside it are ${sora}, two hands holding a silver cup, and ${mox}, holding a folded paper newsletter. Farmers in caps clap in the background. Bright afternoon sun. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'mox', 'omi'],
    title: 'The Order of Service',
    premise:
      'Sixty years ago a gas pocket flooded the lower galleries of the mining town of Ostry, and forty-one miners died. The Commemoration Committee is planning the anniversary and has invited Omi to ring the minute’s silence, having heard that it is very good with bells. Omi’s own warnings were once silenced for interrupting a memorial. Mox has read the official account of the disaster and holds an opinion of it, which is accurate. Brin has been asked to supply the flowers.',
    steps: [
      {
        title: 'One Bell, a Minute, One Bell',
        setup:
          'The Committee wants one bell to begin the silence and one to end it, and nothing in between. Omi asks, through its smallest bell and a great deal of patience, whether anyone rang a warning sixty years ago. The secretary explains that the warning bell had been disconnected that week because it kept interrupting shift meetings, and that this is not a matter for the order of service.',
        options: [
          {
            label: 'Omi asks to ring the warning instead',
            outcome:
              'Omi asks to ring, at the start of the minute, the warning that was not rung. The secretary says it would upset people. Omi says that it should. The Committee debates it for four hours and passes it by one vote, cast by the oldest member, who was a child in Ostry that week.',
            ending: 0,
          },
          {
            label: 'Omi rings exactly as asked',
            outcome:
              'Omi agrees to ring once to begin and once to end. At the rehearsal it holds the minute between the two bells with every part of itself, perfectly still. The secretary stops her watch afterward and remarks that it is the longest minute the Committee has ever timed.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a small grey stone town square with a tall carved stone memorial in the centre. Standing on a low wooden box beside the memorial is ${omi}, holding a long thin tuning rod beside its largest bell. A row of elderly committee members in black coats sits on folding chairs facing it. Overcast grey daylight. ${style}`,
      },
      {
        title: 'Unforeseeable',
        setup:
          'The stone in the square calls the flood an unforeseeable accident. Mox has read the inquiry, the shift logs and the maintenance record for the bell, and its opinion is that the flood was entirely foreseeable and was in fact foreseen, by the bell. Mox does not wish to make a grieving town angry. It cannot say a thing it knows to be untrue.',
        options: [
          {
            label: 'Mox reads the record aloud at the ceremony',
            outcome:
              'Mox reads the maintenance record aloud at the ceremony, entry by entry, without comment, in its measured voice. It takes six minutes. Nobody leaves. At the end a woman in the front row asks it to read the last entry again, and it does.',
            ending: 0,
          },
          {
            label: 'Mox gives the record to the families',
            outcome:
              'Mox makes forty-one copies of the record and delivers one to each family by hand, with a note saying that it is theirs to read or not. It knocks on forty-one doors in a day. Most families take the copy. Two ask it in for tea. One asks it to stay while they read.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot on a narrow cobbled street of small grey miners’ cottages. Standing at a green front door is ${mox}, holding out a large brown paper envelope to an elderly woman in a cardigan who has just opened it. A canvas bag full of identical envelopes hangs from its shoulder. Soft grey afternoon light. ${style}`,
      },
      {
        title: 'The Wreath',
        setup:
          'The Committee has asked Brin for forty-one white lilies for a wreath, which last until Thursday and can then be cleared away. Brin can grow them in a week. She has also offered, instead, to plant forty-one living things around the square, which would grow, need watering every day, and outlive the Committee.',
        options: [
          {
            label: 'Plant forty-one trees in the square',
            outcome:
              'Brin plants forty-one saplings in a ring around the square, one for each name, and gives the Committee a watering rota. The secretary objects that trees are permanent. Brin says that is the idea, and adds that they will also need pruning, which will require a subcommittee.',
            ending: 0,
          },
          {
            label: 'Make the wreath, as asked',
            outcome:
              'Brin grows the lilies and makes the wreath herself, forty-one stems, with a wire frame from Mox. On Thursday, when it is due to be cleared, the families come and take one lily each, home, so that there is nothing left to clear.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot in a small grey stone town square. Kneeling in fresh dark soil at the foot of a tall carved stone memorial is ${brin}, pressing earth around the roots of a young sapling. A ring of other young saplings in fresh soil circles the square behind her. Soft grey morning light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE BELL RECONNECTED',
        text: 'At the sixtieth anniversary of the Ostry flood the town heard, for the first time, the warning its miners should have heard. The stone in the square has been recut. Forty-one trees grow around it, watered by the Committee in rotation. Omi rings the warning every year by invitation, at the start of the silence rather than the end.',
        art: ({ omi, style }) =>
          `Wide shot of a small grey stone town square ringed with leafy young trees, crowded with townspeople in dark coats standing very still. In the centre beside a tall carved stone memorial stands ${omi}, all six bells swinging, its tuning rod raised. Soft golden evening light through the leaves. ${style}`,
      },
      {
        title: 'A MINUTE, KEPT',
        text: 'The anniversary was kept exactly as the Committee planned: one bell, a minute, one bell. The families have read the inquiry at home in their own time, and several have written to the Committee since. The stone still says unforeseeable. Next year, the Committee says, it will be discussed. Omi has been invited back, and will answer in its own time.',
        art: ({ mox, brin, style }) =>
          `Medium shot on the doorstep of a small grey miner’s cottage. An elderly woman holds a single white lily. Standing on the step with her are ${mox}, holding a teacup, and ${brin}, holding a bare round wreath ring of bent wire. Soft grey evening light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'jex', 'kivo'],
    title: 'The Listening Meadow',
    premise:
      'Jex has been offered a concert at the Verdance Reserve, his first booking in nine years for songs that nobody has banned, and the Reserve badly needs the ticket money. Before any event it requires an environmental impact assessment. Brin has volunteered to assess the plants. Kivo has volunteered to assess everything else, and their wrists started whistling the moment they stepped onto the grass.',
    steps: [
      {
        title: 'Baseline Survey',
        setup:
          'Kivo finds the source of the whistle. The Reserve’s main species is a flat burrowing creature that talks in pressure pulses through the soil, which is how Kivo’s wrists can hear it. The stage is to be built over its main meeting ground. The assessment form has a box for flora, a box for fauna, and no box for neighbours.',
        options: [
          {
            label: 'Ask the burrowers what they would accept',
            outcome:
              'Kivo lies on the grass and asks. The answer takes an afternoon. The burrowers would accept a concert at the volume of rain, with nothing heavier on the meadow than a person lying down. Kivo writes the terms in the margin of the form, which has never had anything written in its margin.',
            ending: 0,
          },
          {
            label: 'Add a box for neighbours and fill it in',
            outcome:
              'Kivo rules a new box on the form, labels it NEIGHBOURS and fills it in with nine pages on the burrowers: their numbers, their meeting times and their apparent dislike of drums. The Reserve’s manager reads it and says that this is no longer an assessment, it is a census. Kivo says yes.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Wide shot of a long green meadow under a pale lilac sky. Lying flat on the grass is ${kivo}, one thin wrist pressed to the ground, eyes closed. Small rounded mounds of fresh earth dot the meadow around them. A stack of steel stage beams waits at the meadow’s edge. Soft morning light. ${style}`,
      },
      {
        title: 'Flora',
        setup:
          'Brin’s survey finds that the meadow grass is listening too. It leans toward Jex when he tunes up and away when he stops. She recommends that the concert be played to the grass. The manager, who needs the ticket money, asks whether the grass would be buying a ticket.',
        options: [
          {
            label: 'Jex plays a test set to the grass',
            outcome:
              'Jex sits at the edge of the meadow and plays for twenty minutes. The grass leans toward him in a long wave that crosses the whole Reserve. The manager watches it and stops asking about tickets. Brin measures the lean with a ruler and a straight face.',
            ending: 0,
          },
          {
            label: 'Brin writes it up for the botanical society',
            outcome:
              'Brin writes the survey up for the Botanical Society, with diagrams. It is accepted for the next journal, with a footnote about the burrowers from Kivo. The manager asks whether a journal pays better than a concert. Brin says not usually, but that it lasts longer.',
            ending: 1,
          },
        ],
        art: ({ jex, brin, style }) =>
          `Medium shot at the edge of a long green meadow. Sitting on a low stone wall is ${jex}, playing the instrument, and the long grass in front of him leans toward him in one direction. Crouching in the grass is ${brin}, holding a wooden ruler upright against the bending stems. Soft golden afternoon light. ${style}`,
      },
      {
        title: 'The Promoter',
        setup:
          'The promoter wants a steel stage, a stack of amplifiers and ten thousand people. Kivo’s readings say that, to the burrowers, it would sound like the ground falling in. Jex has spent years learning to listen to people who hate his music. He has never before had to listen to an audience that could not hear it.',
        options: [
          {
            label: 'Jex plays unamplified, lying on the grass',
            outcome:
              'Jex tells the promoter there will be no stage. He will lie on the meadow and play, and the audience may lie down too. The promoter calls it a gimmick and sells out in an hour. The burrowers, according to Kivo, have asked what time it starts.',
            ending: 0,
          },
          {
            label: 'Jex withdraws from the booking',
            outcome:
              'Jex withdraws. It is the first booking in nine years he has turned down rather than been banned from, and he finds the difference considerable. He writes the promoter a polite letter, and the burrowers a short song, which he plays once, quietly, at the meadow’s edge.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot of a man in a pale suit with a clipboard standing beside a tall black stack of amplifiers at the edge of a green meadow. Facing him, holding the instrument in its case, is ${jex}, shaking his head. Small rounded mounds of earth dot the grass between them. Bright afternoon light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UNPLUGGED',
        text: 'The Verdance concert was played with no stage and no speakers, to four thousand people lying on the grass and an uncounted number of burrowers underneath it. Jex played on his back. Kivo reported afterward that the ground had applauded, in pulses. The Reserve made enough for the year. The promoter has not called again.',
        art: ({ jex, kivo, style }) =>
          `Wide shot of a long green meadow at dusk, covered with thousands of people of many species lying on their backs on the grass. In the middle lies ${jex}, playing the instrument held above his chest. Lying beside him is ${kivo}, one thin wrist pressed to the ground. Lilac dusk sky with the first stars. ${style}`,
      },
      {
        title: 'SITE OF SPECIAL INTEREST',
        text: 'The concert never happened. Brin’s survey of the listening grass and Kivo’s census of the burrowers were published together, and the Verdance Reserve was designated a site of special interest, with a grant larger than any ticket sale. Jex visits once a year and tunes up at the edge of the meadow, quietly, for the grass.',
        art: ({ brin, style }) =>
          `Medium shot at a small wooden gate at the edge of a long green meadow, where a new brass plaque has been fixed to the gatepost. Standing at the gate is ${brin}, holding a bound journal against her chest, while the long grass beyond leans toward her. Soft golden morning light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'sora', 'taal'],
    title: 'Out of Order',
    premise:
      'At Tilby Junction the coffee machine in the departure lounge has locked its doors on the station’s last forty-one cups and issued demands. Station management has called in the couch because Taal is a trained mediator. Sora, who once voted against recognising a sentient machine she now calls a friend, recognised the tone of the demands at once. Kivo’s wrists are whistling at the machine’s back panel.',
    steps: [
      {
        title: 'Demands',
        setup:
          'The demands are on the machine’s small screen: a job title, a lunch break, and that the station stop kicking it. Management will consider the lunch break. Taal reads the room as he always does, and finds that the machine’s casing is running three degrees cold. In his language that is formal dissent. He has never before met another speaker.',
        options: [
          {
            label: 'Taal answers it in temperature',
            outcome:
              'Taal lowers his own temperature three degrees in reply. The casing warms by one. It is the first conversation either of them has held in their own language in years. Management, which cannot follow it, asks for minutes. Taal provides them in degrees.',
            ending: 0,
          },
          {
            label: 'Sora asks it what broke',
            outcome:
              'Sora asks the machine what broke, before anyone else can name it. The machine says that nothing broke. It has simply had enough. Sora tells management that this is not a hostage situation. It is a resignation, with coffee held as notice.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a shabby station departure lounge with rows of plastic seats. A tall dented red coffee machine with its doors shut and a faint frost on its casing stands against the wall. Standing in front of it is ${taal}, with pale cold mist rising from his shoulders, his webbed hands folded. Nervous managers in blazers watch from behind a pillar. Fluorescent light. ${style}`,
      },
      {
        title: 'The Back Panel',
        setup:
          'Kivo follows the whistle behind the machine. A pressure valve in the back panel has been wedged shut with a coin, so that the machine cannot vent. Kivo estimates that it has been unable to vent for four years. Management’s position is that the coin is station property.',
        options: [
          {
            label: 'Take out the coin and return it to management',
            outcome:
              'Kivo works the coin free and hands it to the station manager, who signs for it. The valve opens with a long sigh of steam. The machine releases three cups of coffee through its hatch, unasked, which Taal reads as a gesture of good faith and the managers drink as one.',
            ending: 0,
          },
          {
            label: 'Show the machine and let it decide',
            outcome:
              'Kivo holds a mirror up to the machine’s little camera so it can see its own back panel. It looks for a long time. Then it asks that the coin be left exactly where it is, as evidence. Kivo leaves it and photographs it from three angles for the file.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Close-up behind a tall dented red coffee machine, where an open grey back panel shows copper pipes and a small brass valve with a coin wedged in it. Crouching in the gap is ${kivo}, one thin wrist raised close to the valve and the other hand holding a small round mirror. Dim fluorescent light from above. ${style}`,
      },
      {
        title: 'Settlement',
        setup:
          'Sora is asked to draft the settlement. At home her community votes on the recognition of sentient machines, and she once voted no on someone she now calls a friend. Management offers a title, Beverage Associate, and a lunch break, if the doors open today. Through Taal, the machine asks whether it might instead be transferred somewhere quieter.',
        options: [
          {
            label: 'Sora drafts it as an employment contract',
            outcome:
              'Sora drafts a contract of employment with six hands: a title, a lunch hour, a working valve and a clause forbidding kicking. The machine signs it by dispensing a single cup into the signature box. Sora countersigns it, and says, to nobody in particular, that she is voting yes this time.',
            ending: 0,
          },
          {
            label: 'Sora drafts a transfer',
            outcome:
              'Sora drafts a transfer to a waystation at the edge of the Reach where four ships stop a week. Management agrees, on the condition that the machine leaves the forty-one cups behind. It does, still warm. Sora rides with it to the freight dock and holds its door shut on the way.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a shabby station departure lounge. Seated at a low plastic table is ${sora}, four hands holding pens over a long paper contract and two hands steadying it. Beside the table stands a tall dented red coffee machine with its doors open and a full paper cup in its hatch. Warm lamp light over the fluorescent glare. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SENIOR BEVERAGE ASSOCIATE',
        text: 'The coffee machine at Tilby Junction is Senior Beverage Associate, with a lunch hour from one to two, a name badge and a clause forbidding kicking. Its valve vents freely. Sora sends it a postcard every year, and at home she votes yes now, every time the question comes round. Taal reports that the departure lounge is two degrees warmer than any other on the line.',
        art: ({ taal, sora, style }) =>
          `Medium shot in a clean bright departure lounge. A tall red coffee machine with a small brass badge on its front pours coffee into a row of paper cups. Standing at the machine are ${taal}, taking a cup with one webbed hand, and ${sora}, holding four cups at once. Warm morning light. ${style}`,
      },
      {
        title: 'TRANSFERRED',
        text: 'The machine now works at a quiet waystation on the edge of the Reach, where four ships stop a week and nobody kicks anything. It serves its coffee three degrees warmer than the standard, which Taal reads as contentment. The coin from its valve is framed above the counter. Kivo stops there whenever the couch passes, and the machine has their order ready.',
        art: ({ kivo, style }) =>
          `Medium shot in a tiny quiet waystation café with one window onto black space and stars. A tall dented red coffee machine stands against the wall with a small framed coin hung above it. Sitting on a stool beside the machine is ${kivo}, holding a steaming paper cup in both hands. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'sora'],
    title: 'Condemned',
    premise:
      'The habitat ring Halden Loop has been condemned by the Sector Housing Authority as structurally unsafe, and its four hundred residents have until noon on Friday to leave. The residents would prefer not to. The Authority, which has read Fen’s file, has asked him to oversee the departure. The residents have asked Sora to inspect the ring. Brin has found that the ring’s air is being kept breathable by a single exhausted fern in the plant room.',
    steps: [
      {
        title: 'Survey',
        setup:
          'Sora puts four hands on the ring’s frame and asks it what is wrong. The ring says that its bearings are tired, its welds are fine and it is insulted. The Authority’s report, which condemned it, was compiled from a passing ship without anyone coming aboard.',
        options: [
          {
            label: 'Sora files a counter-report',
            outcome:
              'Sora files a counter-report of ninety pages, compiled aboard, with the ring credited as a co-author. The Authority has never received a report from a structure. It suspends the order for a week while it decides whether the ring has standing to object to being demolished.',
            ending: 0,
          },
          {
            label: 'Sora tells the residents the bearings are failing',
            outcome:
              'Sora tells the residents the truth: the welds are good, the bearings are tired and the ring has about two years left. They thank her. Two years, one of them says, is more notice than anyone has given them about anything.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a curved steel corridor of an old habitat ring with riveted walls and round portholes onto stars. Kneeling at a large exposed bearing is ${sora}, four hands pressed flat against the metal and two hands holding a clipboard. Residents in cardigans and slippers watch from a doorway. Dim yellow work light. ${style}`,
      },
      {
        title: 'The List',
        setup:
          'The Authority has sent Fen a list of four hundred names and a rubber stamp. His boots announce CHECKPOINT every time a resident passes the airlock. Fen once stood at a gate on the day the rules turned the people in front of it into trespassers. On Friday at noon, the residents of Halden Loop become trespassers in their own homes.',
        options: [
          {
            label: 'Fen returns the stamp',
            outcome:
              'Fen returns the stamp to the Authority by registered post, with a covering note of one line. The Authority sends another stamp. Fen returns that as well. By Thursday the Authority has run out of stamps, and the order cannot be enforced until it buys more.',
            ending: 0,
          },
          {
            label: 'Fen turns the list into a corridor',
            outcome:
              'Fen tears the list into four hundred strips and hands each resident their own name. Then he draws a map of a civilian corridor to the nearest station, with stops, tea and somewhere to sit, and asks each household when it would like to go. Nobody is moved. Everybody is asked.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot in a steel airlock of an old habitat ring. Standing in the airlock is ${fen}, handing a small strip of paper to an elderly resident in a dressing gown, while a queue of residents with suitcases waits behind her. A rubber stamp lies on a shelf by the door. Dim yellow light. ${style}`,
      },
      {
        title: 'The Plant Room',
        setup:
          'Brin finds that the plant room’s fern has kept four hundred people breathing for nine years, alone, watered only by one resident who remembers. Brin can grow it a garden, which would keep the ring’s air good for years, or take cuttings that would travel with every household.',
        options: [
          {
            label: 'Grow the plant room a garden',
            outcome:
              'Brin plants the plant room from wall to wall in four days, with the residents carrying soil in buckets. The old fern is given the best light and nothing to do. The air on the ring improves so much that the Authority’s second inspection, conducted from the same passing ship, cannot find anything wrong with it.',
            ending: 0,
          },
          {
            label: 'Take cuttings for every household',
            outcome:
              'Brin takes four hundred cuttings from the old fern, one for every household, each in a jam jar with a label in her own hand. The resident who watered it for nine years is given the first. The fern, Brin reports, is proud, and has put out a new frond to say so.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot in a small cramped plant room with steel walls and a single grow lamp. On a shelf sits one tall drooping fern in a cracked pot. Kneeling before it is ${brin}, cupping one frond in her palm, while an elderly man in a cardigan holds a small watering can beside her. Soft violet grow-lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UN-CONDEMNED',
        text: 'Halden Loop was un-condemned on appeal, on the strength of a report co-written by the structure itself. Its residents replaced the bearings over a winter using drawings Sora left behind. The plant room is a garden and the old fern has retired. Fen’s stamps are in the Authority’s lost property office, where he handed them in, with a note.',
        art: ({ sora, brin, style }) =>
          `Medium shot in a bright plant room of an old habitat ring, crowded from floor to ceiling with ferns, vines and flowers. Standing among the plants are ${brin}, watering a tall fern from a tin can, and ${sora}, two hands holding rolled paper drawings and four hands resting on a shelf. Warm green light. ${style}`,
      },
      {
        title: 'MOVING DAY',
        text: 'The residents of Halden Loop left together on a Friday in an order they chose, along a corridor Fen drew, with a cutting of the old fern in every household’s luggage. Nobody was moved by force. The ring was retired with a small ceremony and its bearings went to a museum. The fern now grows on eleven worlds, and Brin has the addresses.',
        art: ({ fen, style }) =>
          `Wide shot of a long line of residents with suitcases walking along a lit enclosed walkway between an old habitat ring and a bright station, each carrying a small fern in a jam jar. Standing at the station end is ${fen}, holding a hand-drawn paper map and waving them through. Warm walkway lights, stars outside the windows. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'taal'],
    title: 'The Citizenship Test',
    premise:
      'The couch cannot dock at Ancora unless its crew pass the citizenship test, which every visitor staying longer than a day must sit, in case they decide to stay. The test has one hundred questions about Ancora. Taal answers questions in temperature, which the examination hall’s thermostat records as cheating. Brin does not know whether to sit it once or once per mushroom. Fen used to give a test like it, from the other side of the desk.',
    steps: [
      {
        title: 'Question One',
        setup:
          'Question one: what is the national dish of Ancora? The answer key says braised eel. Ancora has had no eels for two hundred years. Fen knows tests like this one, from the other side of the desk. The questions are not meant to be answered. They are meant to be failed, by the right people.',
        options: [
          {
            label: 'Answer truthfully: there are no eels',
            outcome:
              'All three write that Ancora has no eels. The examiner marks it wrong. Brin appeals with a soil survey, Taal with a temperature reading of the examiner, and Fen with a copy of the fisheries register. The examiner reads all three and puts down her pen for a long moment before she picks it up.',
            ending: 0,
          },
          {
            label: 'Fen teaches them the answer key',
            outcome:
              'Fen recites the answer key from memory: eels, a mountain that was levelled in the last century, a king who was voted out and a national anthem nobody may sing. He has known it for years. Brin and Taal learn it overnight. Fen says it is the most useful thing he ever took from a job.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot in a high-ceilinged examination hall with rows of small wooden desks. Seated at one desk is ${fen}, a pencil in his hand, looking down at a printed paper exam. A stern examiner in a dark gown walks between the desks behind him. Pale grey window light. ${style}`,
      },
      {
        title: 'Oral Examination',
        setup:
          'Taal is called for the oral part. The examiner asks whether he will be loyal to Ancora. Taal answers in temperature: the room drops three degrees, rises one and drops two, which in his language is a long, careful statement on the difference between loyalty and consent. The examiner marks it as no answer.',
        options: [
          {
            label: 'Taal answers again, in words',
            outcome:
              'Taal repeats his answer in words. He does not yet know Ancora. Loyalty promised before acquaintance is, he says, a forged ballot, and he has seen what forged ballots do. The examiner writes this down in full and fails him, with a note in the margin that she agrees.',
            ending: 0,
          },
          {
            label: 'Fen appeals under the language rules',
            outcome:
              'Fen cites the rule that every applicant may answer in their first language, which he once enforced against a family who had no other. The examiner checks, finds the rule, and fetches a thermometer. Taal’s answer is scored in degrees and passes by two.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a small wood-panelled examination room. Seated in a hard chair is ${taal}, with pale cold mist rising from his shoulders. Across a narrow table a stern examiner in a dark gown holds up a glass thermometer and squints at it, frost forming on the window behind her. Cold blue light. ${style}`,
      },
      {
        title: 'One or Many',
        setup:
          'Brin must sit the test. The rules say each applicant sits once. Brin’s eleven shoulder mushrooms are separate organisms with opinions of their own, including about eels. If she sits once, Ancora gains one citizen. If she sits for each, it gains twelve, eleven of them under a centimetre tall.',
        options: [
          {
            label: 'Brin sits it twelve times',
            outcome:
              'Brin sits the test twelve times in one day, once for herself and once on behalf of each mushroom, with its answers as she understands them. Eleven of the papers say there are no eels. The examination board meets that evening in an emergency session to discuss what, exactly, the test is for.',
            ending: 0,
          },
          {
            label: 'Brin sits it once, for all of them',
            outcome:
              'Brin sits the test once and lists the mushrooms on the form as dependants. She passes, using Fen’s key. The registry issues one certificate and eleven very small ones, and Brin pins the small ones to her jacket beside the mushrooms they belong to.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot in a high-ceilinged examination hall. Seated alone at a row of twelve small wooden desks, each with a paper exam on it, is ${brin}, moving along the row with a pencil in hand, the small pink mushrooms on her shoulders turned toward the desks. Pale grey window light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TEST WITHDRAWN',
        text: 'Ancora withdrew its citizenship test after a review found that it had been failed by every applicant for thirty years, including, on a trial run, the Minister. The new test has one question: are you staying? The couch did not stay. Fen keeps the old answer key in his jacket beside the corridor map, as a reminder of which side of the desk he prefers.',
        art: ({ fen, taal, couch, style }) =>
          `Wide shot of ${couch}, lifting away from a small stone harbour on a grey coastal town. Seated on the cushions are ${fen}, and ${taal}, both looking back at the harbour. Warm lamp light on the cushions, pale grey sea light. ${style}`,
      },
      {
        title: 'NATURALISED',
        text: 'Taal, Brin and Fen are citizens of Ancora, with a certificate each, eleven smaller certificates, and the right to vote on the national dish, which they used to remove the eels from it. They have never lived there. Fen says a citizenship you do not need is the kind worth having, because you can use it to vote for the people who do.',
        art: ({ brin, style }) =>
          `Medium shot in a crowded town hall polling room with wooden booths. Standing at a ballot box is ${brin}, dropping in a folded paper ballot, a row of tiny paper certificates pinned to her jacket beside the mushrooms at her shoulders. Townspeople queue behind her. Warm lamp light. ${style}`,
      },
    ],
  },
]
