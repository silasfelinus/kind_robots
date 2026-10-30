import type { TrioAdventure } from './trioAdventures'

// Party adventures, batch G (see trioAdventures.ts and trioAdventuresA.ts for
// the conventions). The next twenty-five unwritten parties in CrewId order,
// most of them with Vela or Tess aboard. Each episode takes one more
// institution at its word, a passport photograph, a sleep study, a hearing
// test, a party wall, and lets these three particular crew decide what the
// rule is for. Art prompts are literal Krea 2 prose with crew looks and the
// couch phrase passed in word for word.

export const TRIO_ADVENTURES_G: readonly TrioAdventure[] = [
  {
    crew: ['mox', 'tess', 'vela'],
    title: 'Neutral Expression',
    premise:
      'Mox-9 has applied for a travel document, its first, and the Passport Office has rejected its photograph three times for failing to show a neutral expression. Mox has mismatched eyelids, one blue and one orange, bought so that it could learn to wink, and its neutral expression looks to the Office like a wink. Vela has been asked to sign the photograph as a professional who has known the applicant for two years. Tess has never been photographed for any document, and would like to keep it that way.',
    steps: [
      {
        title: 'The Booth',
        setup:
          'The photo booth at the Office takes four pictures for one coin and has a sign showing a neutral face: eyes open, mouth closed, no expression. Mox sits on the stool and tries. Its eyelids close at different speeds, which the machine reads as a wink every time. Vela watches through the curtain, with permission. Tess holds the coins, and has been asked by the booth to step out of frame twice.',
        options: [
          {
            label: 'Mox practises a neutral face with Vela',
            outcome:
              'Vela coaches Mox the way she coaches patients through a scan: breathe, look at one point, let the face be whatever it is. On the ninth coin Mox produces an expression the booth accepts. Mox studies the picture and says it does not look like anyone it knows, including itself.',
            ending: 0,
          },
          {
            label: 'Mox sends the wink, with a covering note',
            outcome:
              'Mox chooses the photograph with the clearest wink and sends it in with a note explaining that the eyelids are its own choice and this is what its face does. Vela adds a second note as its physician. The Office sends both to a supervisor, who has never received a note from a face.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot through the half-open grey curtain of a narrow photo booth with a round stool and a small mirror. Seated on the stool is ${mox}, its blue eyelid lowered and its orange eyelid open. A paper strip of four small photographs hangs from the slot below. Cool white booth light. ${style}`,
      },
      {
        title: 'Countersignature',
        setup:
          'The form asks Vela to confirm that the photograph is a true likeness and that she has known the applicant as a person for at least two years. The form says person. The clerk tells her, kindly, that androids are usually countersigned by their manufacturer. Vela has a pen in her hand and her bell on her belt, and the bell has started to ring DID YOU ASK?',
        options: [
          {
            label: 'Vela signs, and underlines person',
            outcome:
              'Vela signs as a physician who has known Mox-9 as a person for two years and four months, and underlines person twice. The clerk reads it and does not argue. Mox asks to keep a copy of the countersignature. It is the first time anyone has written that word about it on an official form.',
            ending: 0,
          },
          {
            label: 'Vela asks Mox who it wants to sign',
            outcome:
              'Vela asks Mox whom it would like to vouch for it. Mox chooses Tess, who has known it for exactly two years and has never been on any form. Tess hesitates for a long time, then signs, and writes beside her name that she is doing this once.',
            ending: 1,
          },
        ],
        art: ({ vela, tess, style }) =>
          `Medium shot at a high wooden counter in a busy government office. Leaning over the counter with a pen is ${vela}, signing a paper form beside a small photograph. Standing behind her is ${tess}, holding a handful of coins. A clerk in a grey cardigan watches from behind the glass. Cool office light. ${style}`,
      },
      {
        title: 'Place of Birth',
        setup:
          'The last box is place of birth. Mox was assembled at a factory on Tellurian, but its first choice was made on the couch, in deep space, at coordinates Tess navigated and has never written down. The Office needs a place, not a feeling. Tess knows the coordinates. They are inside the blank constellation on her tattoo, and she has never told anyone where that is.',
        options: [
          {
            label: 'Write the factory, which is true',
            outcome:
              'Mox writes Tellurian. It is true, and it costs nothing, and the passport arrives a week later with a photograph and a birthplace Mox did not choose. Mox says it can live with one thing on the document that was chosen for it, since everything else on it was chosen by Mox.',
            ending: 0,
          },
          {
            label: 'Write the couch, at sea',
            outcome:
              'Tess suggests a phrase the Office uses for children born on ships: at sea, aboard the vessel named. Mox writes At sea, aboard the couch. The Office accepts it. Tess does not have to give a single coordinate, and Mox says it is the first box it has ever filled in with a home.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the back cushion is ${tess}, rolling up one navy jacket sleeve to look at a star-map tattoo on her forearm with one blank patch in it. A paper form lies on her knee. Black space and stars beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TRUE LIKENESS',
        text: 'Mox has a passport with a neutral face in it that it does not recognise, and it carries the passport with some affection, as a picture of a stranger who got it through every border. Vela’s countersignature has the word person underlined twice. The booth at the Office now has a sign saying eyelids may differ.',
        art: ({ mox, style }) =>
          `Close-up of a small open dark-blue passport booklet held in slim silver fingers, showing a small photograph of a silver face with both eyelids open. Holding it and looking at it with one orange eyelid half closed is ${mox}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'AT SEA, ABOARD THE COUCH',
        text: 'Mox’s passport says it was born at sea, aboard the couch, and shows it winking, by order of a supervisor who read the note. Tess has signed one form in her life and does not regret it. Vela keeps the rejected photographs in Mox’s file, as a record of what the Office first refused to see.',
        art: ({ vela, mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a brass lamp. Seated side by side are ${vela} and ${mox}, looking at a paper strip of four small booth photographs, each one showing a wink. An open dark-blue passport rests on the cushion. Black space beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'tess', 'vela'],
    title: 'Advance Directive',
    premise:
      'A patient in Vela’s care, an old courier called Anselm Rook, has fallen into a long sleep after a fever, and left an advance directive in a sealed envelope saying what should be done if he cannot speak for himself. The hospital wants it opened. Kivo carried the envelope for him years ago and promised it would be opened only by Rook. Tess has a map he drew her, of a route to where he wanted to end up, and she has never shown anyone.',
    steps: [
      {
        title: 'The Envelope',
        setup:
          'The envelope is sealed with courier wax and marked FOR ROOK’S OWN HAND. The hospital says that an advance directive is useless sealed. Vela agrees with them medically and with Kivo morally. Kivo’s wrists whistle every time an administrator says it is for his own good. Rook is breathing steadily and his hand twitches now and then, as if it is reaching for something.',
        options: [
          {
            label: 'Put the envelope in Rook’s hand',
            outcome:
              'Kivo places the envelope in Rook’s hand, which is his own hand, so the instruction is kept. Vela opens it with him, her fingers over his, and reads it to the room. It asks for music, a window and no machines. The hospital agrees that this counts.',
            ending: 0,
          },
          {
            label: 'Wait for him to wake and open it',
            outcome:
              'Vela keeps Rook comfortable and unopened for six days, against the hospital’s advice and within her rights as his doctor. Kivo sits with him in shifts. On the seventh morning Rook opens his eyes, asks for the envelope, and opens it himself to check that it still says what he meant.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot in a quiet hospital room with a tall window. An old man lies asleep in a white bed, and a small sealed envelope with a dark red wax seal rests in his open hand. Seated at the bedside is ${kivo}, one thin wrist held close to the envelope. Pale morning light. ${style}`,
      },
      {
        title: 'The Window',
        setup:
          'Rook wants a window that looks toward a particular star. The hospital has a window, but it faces the car park. Tess knows the star. It is on the map Rook drew her, near the blank in her tattoo, and pointing it out to anyone means pointing at a route she has protected for years. Vela asks Tess nothing, and waits.',
        options: [
          {
            label: 'Move Rook’s bed to the couch',
            outcome:
              'Vela discharges Rook to the couch, which counts as a care setting because she says it does. Tess turns the couch to face the star without saying which star it is. Rook looks at it for a long time and nods. Nobody else in the room knows what he is looking at.',
            ending: 0,
          },
          {
            label: 'Tess draws the star on the window',
            outcome:
              'Tess draws the star on the hospital window with a wax pencil, in the right place in the sky, and leaves the route around it blank. Rook looks at it each evening. The nurses ask what it is, and Tess says it is a star, which is true.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot of a tall hospital window at night overlooking a car park. Standing at the glass is ${tess}, drawing a small white star on the window with a wax pencil, a real faint star aligned with it in the black sky beyond. An old man in a white bed watches from the foreground. ${style}`,
      },
      {
        title: 'No Machines',
        setup:
          'The directive says no machines. Vela’s clinic is half machines, and the bell on her belt is one of them, reprogrammed by her patients to shout DID YOU ASK? Rook is asleep again and his heart is irregular. A monitor would warn her. Kivo says the directive is clear. Vela knows that clear and kind are not always the same thing.',
        options: [
          {
            label: 'Unplug everything, including the bell',
            outcome:
              'Vela unplugs every monitor and takes off her bell, for the first time in years, and keeps her fingers on Rook’s wrist instead. Kivo sits on the other side, listening with their own wrists for any change in the air. Rook sleeps peacefully. The room is very quiet without the bell.',
            ending: 0,
          },
          {
            label: 'Ask the bell if it counts',
            outcome:
              'Vela asks Rook, the next time he wakes, whether the bell counts as a machine. He laughs, for the first time since the fever, and says the bell is a colleague. It stays. When he sleeps again it is the only thing in the room that speaks, and it says DID YOU ASK? softly, every hour.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Medium shot on the cushions of ${couch}. An old man lies asleep under a blanket on the long cushion. Seated beside him is ${vela}, two fingers pressed to his wrist, the small brass hand bell resting unhooked on the cushion by her knee. Black space and one bright star beyond, soft lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'IN HIS OWN HAND',
        text: 'Anselm Rook’s directive was kept to the letter: his own hand opened it, he looked at his star, and nothing in the room beeped. He woke twice more to talk to Kivo about routes, and then slept. Kivo delivered his last letter, which was addressed to Tess, and Tess has not said what it says.',
        art: ({ kivo, tess, style }) =>
          `Medium shot on scarlet velvet cushions under a dim brass lamp. Seated on the cushion is ${kivo}, holding out a folded paper letter. Reaching to take it is ${tess}, her silver goggles pushed up. Black space and one bright star beyond the clear bubble. ${style}`,
      },
      {
        title: 'OPENED BY THE ADDRESSEE',
        text: 'Rook woke, opened his own directive, approved it and then amended it in pen to add the bell. He lived another year at the hospital, under a window with a wax-pencil star on it, and taught the nurses courier shorthand. Vela has since added a line to her clinic forms: sealed instructions are opened by the patient, where possible, and they nearly always are.',
        art: ({ vela, style }) =>
          `Medium shot in a hospital room with a tall window, a small white star drawn on the glass. An old man sits up in bed writing on a paper document with a pen. Standing beside the bed is ${vela}, holding the small brass hand bell up for him to see. Pale morning light. ${style}`,
      },
    ],
  },
  {
    crew: ['taal', 'tess', 'vela'],
    title: 'The Clocks Go Back',
    premise:
      'The Sector Time Authority has announced that the clocks go back one hour at midnight to save daylight, and every vessel within its jurisdiction must comply. The couch is in deep space and has no daylight to save. Tess navigates by the clock, and an hour out of true puts the couch two systems wrong. Vela runs her clinic by the clock and has a patient whose medicine is due at the very hour that will happen twice. Taal is from a shelf colony where time is measured in temperature, and has never seen anyone move an hour.',
    steps: [
      {
        title: 'The Extra Hour',
        setup:
          'At midnight the couch’s brass clock must be set back to eleven. The hour between eleven and midnight will then happen twice. Vela’s patient, a reef diver with a lung condition, needs a dose at eleven thirty. Twice is too many and once is the dose. Taal asks, with real curiosity, whether the second hour is the same hour or a new one, and nobody can answer him.',
        options: [
          {
            label: 'Give the dose by the old clock',
            outcome:
              'Vela keeps a second clock on the old time for the clinic, and gives the dose at eleven thirty old time, once. The patient asks which time it is. Vela says it is his time. Taal watches both clocks all night and says the second hour felt colder, which Vela writes down.',
            ending: 0,
          },
          {
            label: 'Let Taal mark the hours by temperature',
            outcome:
              'Taal offers to mark the first eleven thirty by lowering the couch one degree, so that when it comes round again there is no doubt. Vela gives the dose at the cold one. The patient sleeps through the warm one. Taal says it is the most useful his disapproval has ever been.',
            ending: 1,
          },
        ],
        art: ({ vela, taal, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions at night. Seated on the cushion is ${vela}, holding a small glass medicine vial up to the lamp, with two brass clocks showing different times on the armrest beside her. Seated upright nearby is ${taal}, faint frost on his shoulders. Black space beyond. ${style}`,
      },
      {
        title: 'Dead Reckoning',
        setup:
          'Tess plots by dead reckoning: speed, heading and time. If she uses the Authority’s time, the couch will think it is an hour behind where it is, and will correct itself into an asteroid field. If she uses true time, the couch’s log will be out of step with every other vessel in the sector and the Authority will fine it. Her grandmother never used anyone’s clock but her own.',
        options: [
          {
            label: 'Navigate by true time, and log both',
            outcome:
              'Tess navigates by true time and keeps two columns in the log, one for the stars and one for the Authority. The couch misses the asteroid field by a comfortable margin. The Authority’s inspector reads the double log and says it is irregular. Tess says the asteroids are regular.',
            ending: 0,
          },
          {
            label: 'Tess draws an hour-wide gap on the chart',
            outcome:
              'Tess draws a gap on the chart an hour wide where the clocks went back, and tells the couch to cross it without counting. It is a thing her grandmother did with borders. The couch arrives on time by the stars and an hour early by the Authority, and is congratulated for punctuality.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Close-up of a paper navigation chart spread on a red velvet cushion, with pencil lines across it and one clean blank band drawn between two rulers. Holding a brass dividers over the blank band is ${tess}, her silver goggles pulled down. A brass clock lies beside the chart. Warm lamp light. ${style}`,
      },
      {
        title: 'The Notice',
        setup:
          'The Authority has fined the couch for keeping the wrong time, and the fine can be appealed on the grounds that the change caused harm. Vela has a patient record showing a near double dose. Tess has a log showing a near asteroid. Taal has asked to give evidence on what an hour is, which nobody has ever asked the Authority to define.',
        options: [
          {
            label: 'Appeal on the harm done',
            outcome:
              'Vela and Tess present the dose record and the double log. The Authority upholds the appeal and grants deep-space vessels an exemption from the clock change, the first since it began. Taal is disappointed not to speak. He lowers the hearing room one degree as he leaves.',
            ending: 0,
          },
          {
            label: 'Let Taal ask what an hour is',
            outcome:
              'Taal asks the Authority to define an hour. The panel confers for forty minutes and cannot, without referring to another hour. Taal says that on the shelf colonies an hour is how long a cup of tea takes to cool, and invites them to try it. The appeal is upheld over tea.',
            ending: 1,
          },
        ],
        art: ({ taal, couch, style }) =>
          `Medium shot in a high wood-panelled hearing room with a large round wall clock. Standing at a rail is ${taal}, holding out a steaming white teacup toward three officials at a raised bench. Parked along the back wall is ${couch}. Warm window light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TRUE TIME',
        text: 'Deep-space vessels are exempt from the clock change now, by a ruling that cites a reef diver and an asteroid field. The couch keeps true time. Vela’s clinic clock never moves. Tess still keeps the Authority column in the log, out of courtesy, and Taal checks once a year that the second eleven thirty still feels colder.',
        art: ({ vela, style }) =>
          `Close-up of one brass clock on the armrest of a red velvet couch, its hands at half past eleven, beside a small glass medicine vial and a paper chart. Winding the clock with a small key is ${vela}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'AN HOUR, BY THE CUP',
        text: 'The Sector Time Authority has adopted, for internal purposes only, a definition of the hour as long enough for a cup of tea to cool, and its meetings now end on time. Taal is credited in a footnote. Tess crosses the clock change each year through a gap on her chart, and nobody has fined the couch since.',
        art: ({ taal, tess, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${taal} and ${tess}, each holding a white teacup with a thin wisp of steam. A paper chart with a blank band across it lies over their knees. Black space and stars beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'tess', 'vela'],
    title: 'Noble Silence',
    premise:
      'Vela has been prescribed rest by her own clinic, and the only retreat with a vacancy is the Abbey of Still Water, which keeps a vow of total silence for nine days. Omi has come as her companion, and speaks only in bells. Tess has come because the abbey is on no map she has seen, and she wants to know how. The abbot has explained, in writing, that bells are noise, and has asked Omi to hand its bells in at the gate.',
    steps: [
      {
        title: 'At the Gate',
        setup:
          'There is a wooden tray at the gate for phones, watches and anything else that makes a sound. Omi’s six bells are part of its chest. It could unclip them from their ribbons, but without them it cannot say anything at all, including no. Vela has her own bell, which shouts DID YOU ASK?, and it is in her hand. Tess has already been through the gate and is reading the abbey’s visitor book.',
        options: [
          {
            label: 'Omi hands in five bells and keeps the smallest',
            outcome:
              'Omi unclips five bells and lays them in the tray, and keeps the smallest, the one for no. The abbot reads its note about it, considers, and writes back YES. Vela hands in her bell too. For nine days the only sound in the abbey that is not water will be Omi refusing things.',
            ending: 0,
          },
          {
            label: 'Vela asks the abbot what silence is for',
            outcome:
              'Vela writes the abbot a note asking what the silence is for. He writes back: so that each person can hear themselves. Vela writes that Omi hears itself in bells. The abbot reads that for a long time, and then writes that the bells may come in, muffled in cloth.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot at an old wooden gate in a pale stone wall, with a shallow wooden tray on a stand holding small brass bells on clipped ribbons. Standing at the tray is ${omi}, laying a bell into it with one stone hand. A robed abbot holds the gate open. Soft grey morning light. ${style}`,
      },
      {
        title: 'The Visitor Book',
        setup:
          'The visitor book goes back three hundred years. Tess finds, on a page from her grandmother’s time, a column of names in a hand she knows: her grandmother brought people here, and the abbey hid them in silence, where no one could be questioned because no one could speak. Tess wants to ask the abbot about it. She cannot ask anything for eight more days.',
        options: [
          {
            label: 'Tess waits, and keeps the vow',
            outcome:
              'Tess keeps the vow. For eight days she reads the visitor book, page after page, and finds her grandmother’s hand eleven times. On the ninth day she asks the abbot one question. He answers it with one word, which Tess will not repeat, and which makes her laugh.',
            ending: 0,
          },
          {
            label: 'Tess writes the abbot a note',
            outcome:
              'Tess writes the abbot a note, which the vow allows. He writes back one line: your grandmother was the reason we keep the vow. He shows her the cellar, where there are still beds. Vela, reading over her shoulder, takes her hand and holds it.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Close-up on an old wooden reading desk of a huge leather-bound visitor book open to a page of faded handwritten names. Running one finger down a column is ${tess}, her silver goggles pushed up on her forehead. A tall candle burns beside the book. Soft candle light, stone walls behind. ${style}`,
      },
      {
        title: 'The Bell at Dawn',
        setup:
          'On the eighth morning a pilgrim collapses in the cloister. Vela reaches him first and sees what is wrong: he needs help from the infirmary at once, across the courtyard, where the brothers are in silent prayer. Calling out breaks the vow for everyone. Omi has its bells, muffled or not. Vela has no bell at all.',
        options: [
          {
            label: 'Omi rings the alarm, aloud',
            outcome:
              'Omi pulls the cloth from its bells and rings the alarm chord, loud and clear across the courtyard. The brothers come running. The pilgrim is treated in time. Afterwards the abbot writes Omi a note saying that the vow has always had an exception for alarms, and that nobody had ever used it so well.',
            ending: 0,
          },
          {
            label: 'Vela runs, and Omi rings no only',
            outcome:
              'Vela runs across the courtyard while Omi rings its smallest bell, the one for no, over and over, which is the only bell nobody can mistake for prayer. The brothers understand at once that something is wrong. The pilgrim recovers. The abbot adds the bell for no to the abbey’s rule.',
            ending: 1,
          },
        ],
        art: ({ vela, omi, style }) =>
          `Wide shot of a pale stone cloister around a square grass courtyard at dawn. Kneeling over a fallen pilgrim in brown robes is ${vela}. Standing in the archway behind her is ${omi}, ringing its brass bells, a strip of cloth falling from them. Robed figures turn in the far cloister. Soft pink dawn light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NINE DAYS, KEPT',
        text: 'Vela came back rested, which her clinic has signed off, and the abbey of Still Water has a new line in its rule about bells for alarms. Tess found her grandmother eleven times in the visitor book. She has not drawn the abbey on any map. Omi says nine days of saying only no were the most restful days of its life.',
        art: ({ vela, couch, style }) =>
          `Wide shot of ${couch}, hovering beside a pale stone abbey on a quiet green hillside at dawn. Seated on the back cushion is ${vela}, eyes closed and hands folded, face calm. A robed abbot waves from the abbey gate. Soft pink light. ${style}`,
      },
      {
        title: 'THE BELL FOR NO, ADOPTED',
        text: 'The Abbey of Still Water rings a small bell for no now, in alarms and in disagreements, and the brothers find it settles arguments faster than writing notes. Tess knows why the abbey keeps its vow, and the cellar beds are made up again. Omi visits each year, bells unmuffled, and is the only guest allowed to speak.',
        art: ({ tess, omi, style }) =>
          `Medium shot in a low stone cellar with rows of simple made-up wooden beds under arched ceilings. Standing among the beds are ${tess}, holding a candle, and ${omi}, one stone hand resting on its smallest brass bell. Warm candle light. ${style}`,
      },
    ],
  },
  {
    crew: ['rue', 'sora', 'vela'],
    title: 'Donor Card',
    premise:
      'The couch’s reactor has asked to carry an organ donor card. It would like its spare coupling, its backup coil and, when the time comes, its core to go to any machine that needs them. Vela has never registered a reactor as a donor. Sora has been asked to witness its wishes. Rue has been asked to draft the consent, and has discovered that the Organ Register defines a donor as a person, and does not define a person.',
    steps: [
      {
        title: 'The Register',
        setup:
          'The Register’s form asks for the donor’s name, date of birth, and next of kin. The reactor has no name it uses aloud, was installed rather than born, and considers the couch its family. Rue has drafted three versions of the form, one for each problem. Sora is interpreting the reactor’s lights, which have been steady and certain for an hour. Vela has the pen.',
        options: [
          {
            label: 'Register the couch as next of kin',
            outcome:
              'Rue fills the next of kin box with The Couch, all crew, jointly, which they find in a precedent from a ship’s cat. The Register accepts it. The reactor’s lights brighten. Vela signs as the physician confirming capacity, with a footnote that she has assessed capacity in a reactor once before.',
            ending: 0,
          },
          {
            label: 'Ask the reactor to choose a name',
            outcome:
              'Sora explains to the reactor that the form needs a name, and asks if it would like one. It takes a whole evening to choose. The name, translated, is Steady. Rue writes it on the form in their best hand. Vela calls it by its name the next morning, and its lights stay on a moment longer.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Close-up on a red velvet cushion of a small printed card with a red heart printed on it and blank lines, beside three draft paper forms. Writing carefully on the card with a fountain pen is ${rue}, their silver braids falling forward. A round brass reactor glows yellow in the background. Warm lamp light. ${style}`,
      },
      {
        title: 'The First Request',
        setup:
          'A week after registering, a message comes from a hospital ship, the Merrow: its own reactor is failing and it needs a coupling of exactly the kind the couch’s reactor has as a spare. The patients aboard the Merrow cannot be moved. The reactor’s lights flicker yes before Sora has finished explaining. Vela is a doctor and knows the rule: a living donor is asked twice, with time between.',
        options: [
          {
            label: 'Ask a second time, after an hour',
            outcome:
              'Vela insists on the second asking, after an hour, though the Merrow is waiting. Sora asks again. The reactor says yes again, more steadily. Sora removes the coupling with four hands and steadies the housing with two, and the Merrow’s reactor takes it at once. Rue minutes both answers.',
            ending: 0,
          },
          {
            label: 'Let the Merrow’s reactor ask itself',
            outcome:
              'Rue suggests that the Merrow’s reactor should also be asked whether it wants a part from a stranger. Sora goes aboard and asks. It does, very much, and would like to thank the donor. The two reactors exchange a flicker of lights across the gap. Sora says it is the first letter between them.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot inside a white hospital ship engine room around a large dim reactor housing with an open panel. Fitting a bright copper coupling into it with four hands while two hold the panel is ${sora}. Through a round porthole a long red velvet couch floats in a clear bubble. Cool white light. ${style}`,
      },
      {
        title: 'The Core',
        setup:
          'The Merrow’s crew are so grateful that they ask whether, if the time ever comes, the couch’s reactor would be willing to leave its core to them. Its core is its mind. Rue says that a pledge like that is irrevocable on most worlds. Vela says that nothing a patient pledges is irrevocable, ever. Sora is looking at the reactor and has not said anything.',
        options: [
          {
            label: 'Leave the core pledge open',
            outcome:
              'Rue drafts the core pledge with a clause that the reactor may change its mind at any time, without reason, by any flicker it likes. Vela approves it. The reactor signs, in light. The Merrow’s crew say they hope never to collect. The reactor, Sora reports, would like them to collect only if it is not using it.',
            ending: 0,
          },
          {
            label: 'Keep the core off the card',
            outcome:
              'The reactor asks, through Sora, for time to think. Vela says it may have as long as it likes. The core stays off the card. Rue writes the Merrow a kind letter saying the matter is with the donor. Weeks later the reactor says it would like to visit the Merrow before it decides.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the back cushion is ${vela}, holding a small printed donor card with a red heart toward an open brass reactor housing whose round lights glow yellow. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NEXT OF KIN, JOINTLY',
        text: 'The reactor carries a donor card, the first on the Register held by a machine, with the couch as its next of kin. Its spare coupling is in the Merrow and doing well. The core pledge is open and revocable at any flicker. Rue keeps the precedent of the ship’s cat in their briefcase, beside the eleven apologies.',
        art: ({ rue, sora, style }) =>
          `Medium shot behind a red velvet backrest at an open panel with a round brass reactor glowing yellow, a small printed donor card tucked into a clip on its housing. Standing beside it are ${rue} and ${sora}, looking at the card. Warm lamp light, black space beyond. ${style}`,
      },
      {
        title: 'STEADY, VISITING',
        text: 'The reactor is called Steady, by its own choice, and it went to visit the Merrow, which it found pleasant and busy and full of people being looked after. It has not yet decided about its core. Vela says that is the right answer for now. The two reactors flicker at each other whenever the ships pass.',
        art: ({ vela, style }) =>
          `Wide shot of two vessels side by side in black space: a long red velvet couch in a clear bubble and a white hospital ship with round portholes. Standing on the couch’s backrest is ${vela}, waving toward the hospital ship as yellow lights flicker from both. Stars, warm light. ${style}`,
      },
    ],
  },
  {
    crew: ['rue', 'taal', 'vela'],
    title: 'The Question on the Ballot',
    premise:
      'The moon of Corran is holding a referendum, and the question on the ballot is whether the moon’s only clinic should be sold to a hospital chain. The question has been written by the chain. Rue has been asked to certify that it is neutral. Taal has been asked to oversee the count, since he can detect a forged vote by its temperature. Vela runs the clinic, and has been asked to say nothing, since she is not neutral.',
    steps: [
      {
        title: 'The Wording',
        setup:
          'The question reads: Do you agree that Corran’s clinic should be modernised by joining a trusted hospital network? Rue counts the loaded words. There are four. A neutral version would read: Should the clinic be sold? The chain says that is loaded too. Taal has lowered the drafting room by two degrees. Vela is sitting very still in the corner, saying nothing, as asked.',
        options: [
          {
            label: 'Rue rewrites the question plainly',
            outcome:
              'Rue rewrites the question: Should the Corran clinic be sold to the Halcyon hospital chain? Yes or No. It names the buyer and the act. The chain objects. Rue certifies it neutral anyway, in writing, and attaches a footnote for every word they removed.',
            ending: 0,
          },
          {
            label: 'Put both versions on the ballot',
            outcome:
              'Rue proposes that both questions go on the ballot, side by side, with the author of each named. Voters can see who wrote what. The chain agrees, thinking its version will win. Taal raises the room one degree, which Rue minutes as a cautious approval.',
            ending: 1,
          },
        ],
        art: ({ rue, taal, style }) =>
          `Medium shot in a small plain committee room with a long table covered in paper drafts. Seated at the table is ${rue}, crossing out words on a printed ballot with a fountain pen. Seated upright beside them is ${taal}, frost forming on the window behind him. Cool daylight. ${style}`,
      },
      {
        title: 'Saying Nothing',
        setup:
          'Vela has been told not to campaign. But a voter has come to the clinic with a fever, and asked her straight out what will happen to his treatment if the chain buys the clinic. Vela knows the chain’s price list. Her bell, which her patients programmed, has begun to shout DID YOU ASK? at full volume, because he did.',
        options: [
          {
            label: 'Vela answers the patient, and only him',
            outcome:
              'Vela answers the patient’s question, honestly and only for him: his treatment would cost forty times as much. He goes home and tells his family, who tell their street. Vela has said nothing in public. Rue rules that a doctor answering a patient is not campaigning.',
            ending: 0,
          },
          {
            label: 'Vela posts the price list on the clinic door',
            outcome:
              'Vela pins the chain’s published price list to the clinic door, without comment. It is a public document. People read it in the queue. The chain complains that she is campaigning. Rue rules that a price list is a fact and that a door is a door.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot at the painted wooden door of a small clinic on a moon street, with a long printed price list pinned to it. Standing in the doorway is ${vela}, holding the small brass bell at her belt still with one hand. A short queue of people in coats reads the list. Soft daylight. ${style}`,
      },
      {
        title: 'The Count',
        setup:
          'Taal oversees the count in the town hall. Real ballots, folded in warm hands at the polling station, keep a trace of body heat for hours. Forged ones, printed and boxed, are cold. Halfway through the count Taal finds a stack of two hundred ballots, all for Yes, all at room temperature. The margin so far is ninety votes.',
        options: [
          {
            label: 'Taal declares the cold ballots, publicly',
            outcome:
              'Taal stops the count and lowers the hall by five degrees, which every counter there knows means fraud. He lays the two hundred cold ballots on a separate table. The returning officer sets them aside. The count resumes. The clinic stays in Corran’s hands by one hundred and ten votes.',
            ending: 0,
          },
          {
            label: 'Count everything, and file the evidence',
            outcome:
              'Taal lets the count finish with every ballot in, as the rules require, and files a sealed temperature report with the returning officer. The result is Yes by ninety. Rue takes the report to the electoral court the same night, and the result is suspended pending a recount.',
            ending: 1,
          },
        ],
        art: ({ taal, couch, style }) =>
          `Medium shot in a town hall with long trestle tables covered in folded paper ballots. Standing at the end of one table is ${taal}, holding his webbed hand flat above a separate stack of ballots, frost spreading across them. Parked by the hall windows is ${couch}. Cool light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NO, BY A HUNDRED AND TEN',
        text: 'Corran’s clinic belongs to Corran. The plain question is on file at the electoral commission as a model of neutral wording, and Rue’s footnotes are taught. Vela still runs the clinic, and still answers what patients ask her. Taal’s temperature report is the first ever accepted as evidence on the moon, and the chain has not tried again.',
        art: ({ vela, rue, style }) =>
          `Medium shot inside a small bright clinic with wooden benches and paper charts on the walls. Standing at a desk are ${vela}, writing in a patient file, and ${rue}, pinning a printed referendum result to the wall. Soft daylight through a window. ${style}`,
      },
      {
        title: 'RECOUNTED WARM',
        text: 'The recount found two hundred forged ballots and the court overturned the result. Corran voted again a month later, on Rue’s plain question, and kept its clinic. Taal oversees every count on the moon now, and the counters keep a heater in the corner for him to switch off when something is wrong.',
        art: ({ taal, style }) =>
          `Medium shot in a town hall with long tables of folded paper ballots. Seated at the head table is ${taal}, one webbed hand resting on a small copper heater switched off beside him. Counters sort ballots into two trays. Warm window light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'rue', 'vela'],
    title: 'Keep Two Hundred Metres',
    premise:
      'The sacred orchard of Rootborne has obtained a restraining order against Brin’s oxygen garden, which once saved a refugee dome beside it and then grew into the orchard’s roots. The garden must stay two hundred metres from the orchard at all times. The couch is due at Rootborne to repair the orchard. Brin cannot go within two hundred metres without her garden, which is her air. Rue has read the order. Vela has been asked whether a garden can be served papers, and thinks it depends whether it can read.',
    steps: [
      {
        title: 'Service',
        setup:
          'An order must be served in person on the respondent. The orchard’s bailiff has arrived with the papers and is looking for the garden’s hand. The garden has no hand, but its largest fungus is the union steward and will accept post on its behalf. Brin says the garden did not mean to hurt anyone. Rue says intent is a matter for the hearing. Vela says the bailiff looks unwell, and he is.',
        options: [
          {
            label: 'The steward accepts service',
            outcome:
              'The bailiff lays the papers against the largest fungus, which accepts them by growing over one corner. Rue rules this valid service. Vela treats the bailiff for a spore allergy while he waits, and he says he has served papers on a great many things, but never on something that grew on them.',
            ending: 0,
          },
          {
            label: 'Rue contests service',
            outcome:
              'Rue contests service on the ground that the garden cannot read and has not been told, in any language it understands, what the order says. Brin reads the order to the garden aloud. The bailiff waits. At the end the garden puts out a single new frond, which Brin says is a question.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Close-up of the armrest of a red velvet couch covered in moss, ferns and small pale mushrooms, a folded paper document propped against the largest mushroom with moss creeping over one corner. Kneeling beside it is ${brin}, reading the document aloud. A man in a long grey coat stands behind her. Warm lamp light. ${style}`,
      },
      {
        title: 'Two Hundred Metres',
        setup:
          'The orchard needs repair, and only Brin knows how. The garden must stay two hundred metres off. Vela measures Brin’s lungs and says she can go nine minutes without the garden’s air before it is dangerous. The orchard’s trees are four minutes’ walk from the boundary. Rue has found a clause that permits approach for the purpose of making amends.',
        options: [
          {
            label: 'Brin goes in alone, on Vela’s timer',
            outcome:
              'Brin walks into the orchard alone with a borrowed tank and nine minutes. Vela stands at the boundary with a stopwatch. Brin reaches the oldest tree in four minutes, kneels, presses her hands to the root and pulls her own garden’s threads loose from it, gently. She is back with forty seconds to spare.',
            ending: 0,
          },
          {
            label: 'Rue invokes the amends clause',
            outcome:
              'Rue writes to the orchard’s keepers invoking the amends clause, asking that the garden itself be allowed to come close, once, to undo its own damage. The keepers agree to a single hour. The garden comes within reach of the orchard for the first time since the order, and withdraws its roots by itself.',
            ending: 1,
          },
        ],
        art: ({ brin, vela, style }) =>
          `Wide shot of an old orchard of twisted fruit trees on a green island, a white painted line across the grass in the foreground. Walking between the trees with a small grey air tank on her back is ${brin}. Standing at the white line holding up a brass stopwatch is ${vela}. Soft green daylight. ${style}`,
      },
      {
        title: 'The Hearing',
        setup:
          'The order is reviewed after a month. The orchard’s keepers would like it made permanent. The refugee dome, which the garden saved, has sent a letter in support of the garden. Rue represents the garden. Vela has the dome’s medical records, which show how many people are breathing because of it. Brin does not want to win by making the orchard lose.',
        options: [
          {
            label: 'Agree a smaller distance, by consent',
            outcome:
              'Rue proposes, and both sides consent to, a boundary of twenty metres and a hedge between. The garden keeps to its side. The orchard keeps to its own. Vela gives evidence that twenty metres is enough for both to breathe. The keepers plant the hedge themselves, from a cutting Brin gives them.',
            ending: 0,
          },
          {
            label: 'Let the orchard decide',
            outcome:
              'Brin asks that the orchard itself be asked, since it is the injured party. The keepers have never asked it anything. They go out with Brin and lay their hands on the roots. The orchard asks for the order to be kept, and for Brin to visit. Rue says that is a fair outcome and the hardest one.',
            ending: 1,
          },
        ],
        art: ({ rue, couch, style }) =>
          `Medium shot of a small open-air hearing under an old fruit tree, three robed keepers seated on a wooden bench. Standing before them holding a small wooden gavel is ${rue}. Parked on the grass behind them is ${couch}, its armrest covered in ferns and moss. Soft green daylight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TWENTY METRES AND A HEDGE',
        text: 'The garden and the orchard live twenty metres apart, with a hedge between that both of them grew. The refugee dome breathes. Brin visits the orchard and the garden waits at the hedge. Rue keeps the consent order with their apologies, as the first one they helped to write that nobody had to apologise for.',
        art: ({ brin, style }) =>
          `Wide shot of a tall green hedge across a meadow, an old orchard of twisted fruit trees on one side and a low garden of moss and pale mushrooms on the other. Standing at a gap in the hedge is ${brin}, one hand on each side. Soft green daylight. ${style}`,
      },
      {
        title: 'ORDER KEPT, VISITS ALLOWED',
        text: 'The order stands, at the orchard’s own request, and the garden keeps two hundred metres off. Brin visits the orchard once a season, alone, on Vela’s timer. The keepers ask the orchard things now, which they never did before. The refugee dome sends the garden a letter every year on the anniversary.',
        art: ({ vela, rue, style }) =>
          `Medium shot at a white painted boundary line across the grass at the edge of an old orchard. Standing at the line are ${vela}, holding a brass stopwatch, and ${rue}, holding a folded paper order. Twisted fruit trees stand beyond them. Soft daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'rue', 'vela'],
    title: 'Diplomatic Premises',
    premise:
      'Rue’s old credentials have been reactivated by mistake, and under the Concord’s rules a serving diplomat’s residence is diplomatic premises. Rue lives on the couch. The couch is now technically an embassy, and four people fleeing the Regent’s border police have climbed aboard asking for asylum. Fen used to be the border police. Vela has already begun examining the four, who are cold and hungry. The police are on the armrest, which is technically outside.',
    steps: [
      {
        title: 'The Threshold',
        setup:
          'The border police say the four were on the armrest when they asked, and the armrest is not the embassy. Rue says the armrest is part of the premises. Fen knows the officer in charge; he trained her. His boots announce CHECKPOINT every time she leans forward. Vela has one of the four, a teenage boy, wrapped in a blanket on the middle cushion and will not move him.',
        options: [
          {
            label: 'Rue declares the whole couch premises',
            outcome:
              'Rue declares the couch, armrests included, to be the embassy, in the formal words, with the gavel. The officer asks for the boundary in writing. Rue draws a line round the couch on a sheet of paper and signs it. The officer reads it, sighs, and steps back off the armrest.',
            ending: 0,
          },
          {
            label: 'Fen talks to the officer he trained',
            outcome:
              'Fen asks the officer whether she remembers what he taught her about the first question at a border. She does: is anyone here in danger. He tells her to ask it. She looks at the boy in the blanket for a long time. Then she steps off the armrest and says she will need to call her supervisor.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at the rolled armrest of a red velvet couch, where a uniformed border officer in a peaked cap stands with one boot on the armrest. Standing facing her on the cushion is ${fen}, both heavy scuffed black boots planted. A teenage boy in a blanket sits on the cushion behind him. Cold blue station light. ${style}`,
      },
      {
        title: 'The Embassy’s Facilities',
        setup:
          'An embassy must provide asylum seekers with shelter, food, medical care and a hearing. The couch has cushions, biscuits and Vela. The four need beds and a hearing within five days, under the Concord’s rules, and the Concord has just noticed that one of its embassies is a sofa. Vela’s bell has been shouting DID YOU ASK? at everyone who has tried to photograph the boy.',
        options: [
          {
            label: 'Vela runs the embassy as a clinic',
            outcome:
              'Vela declares a clinic within the embassy and treats all four, with consent, for exposure. She writes each a medical report stating that they cannot safely be moved. Under the Concord’s own rules the medical report outranks the border police. Rue files it.',
            ending: 0,
          },
          {
            label: 'Rue asks the Concord for a proper building',
            outcome:
              'Rue writes to the Concord requesting suitable premises for the embassy’s guests. The Concord, embarrassed, offers a consulate on the station. Rue accepts on condition that the asylum claims transfer with the guests. They do. Fen carries the boy across, still in his blanket.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions crowded with four tired travellers in blankets. Kneeling beside a teenage boy is ${vela}, wrapping a bandage round his wrist, the small brass bell on her belt swinging. A plate of biscuits sits on the armrest. Warm lamp light against cold blue station light. ${style}`,
      },
      {
        title: 'The Hearing',
        setup:
          'The hearing is held on the couch, since it is the embassy. Rue presides, as the diplomat in residence. The Regent has sent a lawyer who argues that Rue’s credentials were reactivated by clerical error and so the embassy never existed. Rue knows that this is true. Fen is a witness to what the four were fleeing, having worked for the people chasing them.',
        options: [
          {
            label: 'Fen testifies about the border',
            outcome:
              'Fen testifies about what he did at the border and what the four would face if returned. It is the first time he has said it in public. His boots announce CHECKPOINT as he sits down. Rue grants asylum to all four. The lawyer appeals, and loses, because the error was the Concord’s, not theirs.',
            ending: 0,
          },
          {
            label: 'Rue admits the error, and asks anyway',
            outcome:
              'Rue admits on the record that the credentials were reactivated in error, and argues that the four relied on them in good faith. A government cannot open a door by mistake and then punish people for walking through it. The Concord’s tribunal agrees, in a ruling it calls the doorway principle.',
            ending: 1,
          },
        ],
        art: ({ rue, fen, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated at a small folding table is ${rue}, holding a wooden gavel raised. Standing at the end of the couch is ${fen}, speaking. A lawyer in a dark suit sits opposite with papers. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ASYLUM GRANTED, ON A SOFA',
        text: 'The four have asylum, granted at the only embassy in the Concord with button-tufted cushions. The boy writes to Vela every month. Rue’s credentials have been deactivated again, properly, and they keep the reactivation letter with their apologies. Fen told the truth in public and has not stopped since.',
        art: ({ vela, style }) =>
          `Medium shot of a small bright station apartment with four simple beds. Standing in the doorway is ${vela}, the small brass bell at her belt, while a teenage boy at a table waves to her holding a paper letter. Warm window light. ${style}`,
      },
      {
        title: 'THE DOORWAY PRINCIPLE',
        text: 'The doorway principle is cited now in every Concord asylum case: a door opened by mistake is still a door. Rue is mentioned in the ruling by name, which Rue minds less than they expected. The four live on the station. Fen visits the officer he trained, who has asked to be transferred to the consulate.',
        art: ({ rue, style }) =>
          `Close-up of a thick printed legal ruling lying open on a red velvet cushion, one paragraph circled in pencil. Holding a pencil over the circled paragraph is ${rue}, their silver braids falling forward. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'mox', 'vela'],
    title: 'Overnight Observation',
    premise:
      'Mox-9 would like to learn to sleep. It does not need to, but it has noticed that everyone else does, and that they come back from it with things to say. Vela has agreed to run a sleep study, with wires, a chart and a night of observation. Kivo has agreed to watch the air pressure, which changes when anyone dreams, and which Kivo hears through their wrists. Mox has asked that, if it dreams, nobody read the dream without its permission.',
    steps: [
      {
        title: 'Lights Out',
        setup:
          'Vela fits the sensors to Mox’s casing, asking before each one. Mox lies down on the back cushion and closes both eyelids, which take different times to close. It does not sleep. It counts. At four thousand it opens the orange eyelid and asks whether this is sleep. Vela says no. Kivo says the air has not moved.',
        options: [
          {
            label: 'Vela tells Mox to stop trying',
            outcome:
              'Vela tells Mox that sleep comes when you stop trying, which is the least scientific instruction she has ever given. Mox stops trying, which takes it an hour of trying. At two in the morning the wires flicker and the chart shows a long slow line. Kivo’s wrists whistle very faintly.',
            ending: 0,
          },
          {
            label: 'Kivo tells Mox a courier’s night story',
            outcome:
              'Kivo tells Mox the story couriers tell each other on long overnight runs, about a letter that delivers itself. It is very long and very dull, on purpose. Mox listens attentively to the end, and then asks for it again. Halfway through the second telling, the chart shows a slow line.',
            ending: 1,
          },
        ],
        art: ({ mox, vela, style }) =>
          `Medium shot on scarlet velvet cushions at night under a dimmed brass lamp. Lying on the back cushion with both eyelids closed is ${mox}, thin wires running from its chest plate to a small paper chart recorder. Seated beside it is ${vela}, writing on a clipboard. Black space and stars beyond. ${style}`,
      },
      {
        title: 'The Dream',
        setup:
          'At three in the morning the pressure in the bubble shifts and Kivo’s wrists whistle a long rising note. Mox is dreaming. The chart recorder is printing something that is not a line: small regular shapes, like letters in a script nobody knows. Vela could read it. Kivo knows that it is, in a sense, a letter, and that it is not addressed to either of them.',
        options: [
          {
            label: 'Fold the chart and seal it for Mox',
            outcome:
              'Vela tears the printout off and Kivo folds it into a courier’s envelope and seals it with wax, unread. They lay it on Mox’s chest plate. In the morning Mox opens it, reads it, and says only that it was about the couch. It keeps the envelope.',
            ending: 0,
          },
          {
            label: 'Turn the recorder off',
            outcome:
              'Vela turns the recorder off. Kivo listens instead, with their wrists, and hears only that the dream is calm. They sit together till dawn and write down how long it lasted and nothing else. Mox wakes and asks if it slept. Vela says yes. Mox asks what it dreamed. Kivo says, only you know.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Close-up on a red velvet cushion at night of a small paper chart recorder printing a strip covered in tiny regular marks. Holding one thin wrist close to the paper strip and listening is ${kivo}, their pale teal feather crest lit by a dim lamp. Black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Results',
        setup:
          'Vela writes up the study. Mox slept for three hours and twelve minutes and dreamed for forty. The Androids’ Rights Office would like the results, because they would show that a Series Nine can dream, which would help a great many other androids. It would also mean publishing something about Mox’s mind. Mox has been asked. It has not answered yet.',
        options: [
          {
            label: 'Publish the numbers only',
            outcome:
              'Mox agrees to the numbers being published: three hours twelve, forty minutes of dreaming, nothing more. Vela writes the report with no content from the dream at all. The Rights Office cites it in a case the next month, and three androids in a warehouse are reclassified as persons who sleep.',
            ending: 0,
          },
          {
            label: 'Keep the study private',
            outcome:
              'Mox asks that the study stay private for now, because it would like to sleep a few more times before it is a case. Vela files it in Mox’s clinic folder under lock. Kivo says it is the right answer, and that some letters are delivered late on purpose.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the front cushion is ${vela}, typing on a small brass typewriter balanced on her knees, a roll of printed chart paper beside her. Black space and dawn light beyond the bubble. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THREE HOURS TWELVE',
        text: 'Mox sleeps now, two nights a week, on the back cushion, and the numbers from its first night are in a ruling that made three other androids persons. The dream is in a sealed envelope in Mox’s chest plate. Vela has never read it. Kivo can tell from the pressure when Mox is dreaming, and keeps quiet.',
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet cushions at night. Lying asleep on the back cushion with both eyelids closed is ${mox}, a small wax-sealed paper envelope resting on its transparent chest plate. A grey blanket covers its legs. Dim lamp light, stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'UNREAD',
        text: 'The study is private and the dream is unrecorded. Mox has slept twenty times since and has started to come back with things to say, which was what it wanted. It tells them to Kivo first, who is good with things that are not meant for everyone. Vela still checks its wires, when asked.',
        art: ({ kivo, mox, style }) =>
          `Medium shot on scarlet velvet cushions at dawn. Seated on the armrest is ${kivo}, listening, while ${mox} sits up on the back cushion with a grey blanket over its knees, speaking with one hand raised. Pink dawn light beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'mox', 'vela'],
    title: 'Bin Day',
    premise:
      'The station of Tallow Reach collects waste on Tuesdays, in four bins: general, recycling, compost and clinical. Every vessel docked must sort its own. The couch’s rubbish this week includes Vela’s used dressings, a box of Brin’s spent soil, two worn-out joints that Mox replaced in its own knee, and one item nobody can classify. The collector checks every bag and fines anything in the wrong bin. Mox would like to know which bin its old knee goes in, and whether it gets a say.',
    steps: [
      {
        title: 'The Knee',
        setup:
          'Mox’s old knee joints are silver, worn and still slightly warm. The collector says they are recycling. Mox says they were part of it for six years and carried it out of a factory that wanted it deleted. Brin says nothing that was part of a body goes in recycling on Rootborne, it goes in the ground. Vela says clinical waste is for parts removed in treatment, and this was.',
        options: [
          {
            label: 'Bury the joints in Brin’s compost',
            outcome:
              'Brin takes the joints and buries them in the compost box, with Mox’s consent, under a small fern. The collector protests that metal does not compost. Brin says it can take its time. The fern grows round the joints within a week, and Mox visits it.',
            ending: 0,
          },
          {
            label: 'Mox keeps them',
            outcome:
              'Mox decides the joints are not rubbish. It cleans them and keeps them in a small tin under the back cushion, as a person might keep a tooth. The collector writes NOT COLLECTED on his form and moves on. Vela notes in Mox’s file that it is the first thing it has chosen to keep.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up of two worn silver mechanical knee joints resting in a small open tin box on a red velvet cushion. Holding the tin in both slim silver hands and looking down at it is ${mox}, its orange eyelid half lowered. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Unclassifiable Item',
        setup:
          'The item nobody can classify is a soft grey lump the size of a loaf, found under the back cushion. It is warm. Vela thinks it is biological. Brin thinks it is fungal. Mox runs a scan and finds it has a faint electrical pattern of its own. The collector would like it in a bin by noon. The lump has moved four centimetres since breakfast.',
        options: [
          {
            label: 'Brin identifies it, slowly',
            outcome:
              'Brin spends the morning with the lump and identifies it: a young colony of her own garden that separated in the spring and has been living under the cushion, eating crumbs. It is a dependent. The collector agrees it is not waste. It is moved to the armrest with the others, who are pleased.',
            ending: 0,
          },
          {
            label: 'Vela asks it directly',
            outcome:
              'Vela kneels by the lump and asks whether it would like to be moved. It moves toward her, eight centimetres. Mox reads the electrical pattern change as yes. Vela registers it as a patient with no name and a strong preference for warmth, and it rides in her clinic bag from then on.',
            ending: 1,
          },
        ],
        art: ({ brin, vela, style }) =>
          `Medium shot on scarlet velvet cushions with the back cushion lifted, showing a soft grey lump the size of a loaf of bread lying underneath. Kneeling on one side is ${brin}, leaning close with a magnifying glass. Kneeling on the other side is ${vela}, one lilac hand held out flat beside the lump. Warm lamp light. ${style}`,
      },
      {
        title: 'The Fine',
        setup:
          'The collector has fined the couch for an unsorted bag: Vela’s dressings were in the general bin, put there by a passenger who did not know. The fine is small. To appeal, the couch must name who sorted it wrong. The passenger was a frightened old man on his first trip off his moon, and he is still aboard, and he is listening.',
        options: [
          {
            label: 'Pay the fine and say nothing',
            outcome:
              'Vela pays the fine from the clinic fund and names no one. Mox adds a small printed card to each bin, showing in pictures what goes where. The old man reads all four cards very carefully and sorts the next bag perfectly, and says nothing about it either.',
            ending: 0,
          },
          {
            label: 'Appeal on the ground of unclear signs',
            outcome:
              'Brin appeals on the ground that the station’s bins are labelled in a language half the travellers cannot read. She attaches the old man’s own drawing of what he thought the bins meant. The collector reads it and laughs. The fine is cancelled and the station orders new signs with pictures.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Medium shot on a grey station dock beside ${couch}. Four tall wheeled bins in green, blue, brown and yellow stand in a row. Standing beside them is ${vela}, handing a small paper slip to a collector in an orange vest. An old man in a cap watches from the cushion. Cool station light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SORTED, MOSTLY',
        text: 'The couch’s bins are the best sorted on Tallow Reach, with a picture card on each. A small fern grows in the compost over two silver joints. The young colony lives on the armrest with its elders and has stopped hiding under cushions. The collector waves when the couch docks on Tuesdays.',
        art: ({ brin, style }) =>
          `Close-up of a wooden compost box on the armrest of a red velvet couch, a small green fern growing from dark soil with the edge of a silver joint just visible among its roots. Kneeling beside it and watering it from a tin can is ${brin}. Warm lamp light. ${style}`,
      },
      {
        title: 'KEPT, AND COUNTED',
        text: 'Mox keeps its old knee in a tin, the grey lump rides in Vela’s clinic bag as a patient, and Tallow Reach has picture signs on every bin. The old man went home and taught his moon to sort. Brin says the hardest thing to recycle is the idea that anything is rubbish, and Mox agrees.',
        art: ({ mox, style }) =>
          `Medium shot on a grey station dock beside a row of four wheeled bins in green, blue, brown and yellow, each with a new printed sign showing simple pictures of objects. Standing by the signs and pointing at one is ${mox}. Cool station light. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'omi', 'vela'],
    title: 'Hearing Test',
    premise:
      'All crew on licensed vessels must pass an annual hearing test, administered by a certified audiologist with a box of beeps and a pair of headphones. Omi cannot wear headphones; it hears through its whole stone body. Mox can hear frequencies the box cannot produce. Vela is the audiologist, since her medical licence covers it, and she has realised that the test assumes everyone hears the same way and responds by raising a hand.',
    steps: [
      {
        title: 'The Headphones',
        setup:
          'Vela places the headphones on Omi’s crystal head and plays the first beep. Omi does not raise a hand. It rings its smallest bell, the one for no, because the beep was unpleasant. Vela marks it as a response. The form has two boxes: heard and not heard. Mox, waiting its turn, points out that no is a third box the form does not have.',
        options: [
          {
            label: 'Vela tests Omi through its chest',
            outcome:
              'Vela removes the headphones and holds the beep box against Omi’s brass resonator. Omi hears every tone, down to frequencies below the chart, and answers each with a different bell. Vela records them all in the margin. The result is excellent hearing, with opinions.',
            ending: 0,
          },
          {
            label: 'Add a box for no to the form',
            outcome:
              'Vela draws a third box on the form, labelled HEARD, DECLINED, and ticks it for every beep Omi rang no at. There are many. The licensing office returns the form to ask what the box means. Vela writes back that it means the patient heard and objected, which is information.',
            ending: 1,
          },
        ],
        art: ({ omi, vela, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on the cushion is ${omi}, a pair of padded headphones sitting crooked on its crystal head. Kneeling in front of it is ${vela}, holding a small grey box with a dial and pressing it against the brass resonator on its chest. Warm lamp light. ${style}`,
      },
      {
        title: 'Above the Chart',
        setup:
          'Mox hears every beep the box makes, instantly, and raises a hand each time. Then it says it can also hear a tone the box is making by accident, very high, from a cracked part inside. Vela cannot hear it. The box’s manual says it produces no tones above the chart. Mox would like to know whether it should report a sound the test says does not exist.',
        options: [
          {
            label: 'Report it, and open the box',
            outcome:
              'Mox reports the tone. Vela opens the box with Mox’s help and finds a cracked capacitor singing at a frequency only Mox can hear. It has been doing so for years, in every test, on everyone. Vela replaces it. Mox says the box is much quieter now, and that it had been wondering.',
            ending: 0,
          },
          {
            label: 'Ask Omi to confirm it',
            outcome:
              'Vela asks Omi whether it can feel the tone. Omi places one hand on the box and rings its highest bell, matching the note exactly. Two witnesses are enough for Vela. She writes a note to the licensing office that its test box has been singing to patients for years.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up of a small open grey test box on a red velvet cushion, its circuit board exposed with one small cracked cylindrical part. Leaning over it and pointing at the cracked part with one silver finger is ${mox}, its blue eyelid raised. Warm lamp light, black space beyond. ${style}`,
      },
      {
        title: 'The Certificate',
        setup:
          'Vela must now sign certificates. Omi’s hearing is excellent but its form is irregular. Mox’s hearing is beyond the chart. The licensing office will accept only results inside the chart. Vela could round them down to fit, which would be a lie, or send them as they are, which the office has never accepted. Omi’s smallest bell is already ringing.',
        options: [
          {
            label: 'Sign them as they are',
            outcome:
              'Vela signs both certificates with the true results, margins and all. The licensing office rejects them, then receives her report about the singing box, then accepts them, with a note that its chart is under review. Mox and Omi frame nothing, but keep copies.',
            ending: 0,
          },
          {
            label: 'Write a new chart',
            outcome:
              'Vela, Mox and Omi draw a new chart together, wider at both ends, with a column for bells and a row for frequencies that only some can hear. Vela sends it to the office with the certificates. The office adopts it for the next year, on trial, and asks whether Omi will help test the testers.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the front cushion is ${vela}, signing a small printed certificate on a clipboard with a pen, a pair of padded headphones lying on the cushion beside her. Black space and stars beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HEARD, WITH OPINIONS',
        text: 'The couch’s crew passed their hearing tests with the true results, which the licensing office now accepts. The cracked capacitor has been replaced in every test box in the sector, after Vela’s report, and a great many patients have stopped hearing a faint whine at the doctor’s. Omi rings no at every beep, and is marked as hearing it.',
        art: ({ omi, style }) =>
          `Close-up of a small faceted slate-grey stone being on a red velvet cushion, ringing one small brass bell on its chest with a stone finger. The being is ${omi}, its amber eyes bright. A small grey box with a dial lies on the cushion beside it. Warm lamp light. ${style}`,
      },
      {
        title: 'A WIDER CHART',
        text: 'The hearing chart used across the sector is wider now at both ends and has a column for bells. Mox and Omi test the testers once a year. Vela’s original form, with its third box, hangs in the licensing office. Mox says it is the first test it has taken that wanted to know what it actually heard.',
        art: ({ mox, omi, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${mox} and ${omi}, holding a large hand-drawn paper chart between them with wide columns and small drawn bells. Black space and stars beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'kivo', 'vela'],
    title: 'Hospital Radio',
    premise:
      'The hospital ship Merciful Tide runs a request show for its patients each night, and its presenter has fallen ill. Vela has volunteered the couch’s crew. Jex will play the requests. Kivo will collect them from the wards, since a courier knows how to carry a message without reading it. The station’s licence forbids playing any song banned on five worlds, which covers most of what the patients ask for, and almost all of Jex.',
    steps: [
      {
        title: 'The Requests',
        setup:
          'Kivo collects forty requests from the wards in folded slips. Most are for songs everyone knows. Eleven are for Jex’s banned anthems, which the patients remember from the ceasefires those songs ended. One slip is folded twice and sealed, and is addressed to the presenter by name, from a patient in the long-stay ward. Kivo’s wrists are whistling at it, but softly.',
        options: [
          {
            label: 'Jex plays the anthems as instrumentals',
            outcome:
              'Jex plays the eleven banned anthems as instrumentals, without words, and introduces each with the name of the patient who asked, not the name of the song. The licence forbids songs, not names. The long-stay ward sings the words anyway, quietly, from memory.',
            ending: 0,
          },
          {
            label: 'Jex asks the patients why',
            outcome:
              'Jex asks on air why so many want songs that are banned. The answers come back on slips through Kivo all night: because the song was playing when the fighting stopped, because it was the last thing my brother heard. Jex reads them out. He does not play the anthems. Nobody minds.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot inside a small hospital radio booth with a microphone on an arm, a mixing desk with sliders and a stack of folded paper slips. Seated at the desk with his instrument across his knees is ${jex}, leaning toward the microphone. A red ON AIR lamp glows above the door. Warm booth light. ${style}`,
      },
      {
        title: 'The Sealed Slip',
        setup:
          'The sealed slip is addressed to the presenter who fell ill, who is now a patient in the same ship. Kivo could deliver it to him in the ward. Vela knows him, and knows he is very unwell. The slip is from a long-stay patient who has been writing to him for a year. Jex could read it on air, if anyone opened it. Kivo will not.',
        options: [
          {
            label: 'Kivo delivers it by hand',
            outcome:
              'Kivo carries the slip down to the ward and gives it to the presenter, who opens it himself. It is a song request, for a song he wrote and never played on air. He asks Jex to play it. Jex learns it from the presenter’s humming in an hour and plays it at midnight.',
            ending: 0,
          },
          {
            label: 'Vela asks the sender what she wants',
            outcome:
              'Vela visits the long-stay ward and asks the sender what she wants done with the slip. The sender says she wanted it read on air, because she is too shy to say it. Vela asks the presenter if he consents to hear it on air. He does. Jex reads it, and it is a thank you.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot in a quiet hospital ward at night with a row of white beds. Standing at a bedside is ${kivo}, holding out a small folded and sealed paper slip to a pale man propped up on pillows. A small radio on the bedside table glows. Soft blue night light. ${style}`,
      },
      {
        title: 'Lights Out on the Wards',
        setup:
          'The show runs to midnight and the wards must be quiet after. Vela knows that some patients sleep better with music. The licence ends at midnight. Jex has one song left and a ward of people who are not yet asleep. Kivo has collected one last request, from a child on the children’s ward, which is for a lullaby that Jex wrote and that is banned on six worlds.',
        options: [
          {
            label: 'Jex plays the lullaby at five to twelve',
            outcome:
              'Jex plays the lullaby at five to twelve as an instrumental, very softly. Vela walks the wards while it plays and dims each light as she goes. By midnight the children’s ward is asleep. The licence has not been broken, and nobody on six worlds has heard.',
            ending: 0,
          },
          {
            label: 'Vela takes the lullaby to the ward, off air',
            outcome:
              'At midnight the broadcast ends and Vela walks Jex to the children’s ward, where he plays the lullaby in person, unbroadcast, for one child. It is not radio and so it is not banned. The child sleeps before the second verse. Kivo keeps watch at the door.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Wide shot of a long white hospital ship in black space with rows of softly lit portholes going dark one by one. Docked beside it is ${couch}, and standing on its backrest is ${vela}, looking at the darkening portholes. Stars beyond, soft blue light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'REQUESTS, BY NAME',
        text: 'Merciful Tide’s request show is presented now by a rota of patients, and every song is introduced by the name of whoever asked for it. The presenter recovered and played his own song on air at last. Jex comes back to play once a month. Kivo still collects the slips, and still has not read one.',
        art: ({ jex, kivo, style }) =>
          `Medium shot inside a small hospital radio booth with a red ON AIR lamp. Seated at the microphone with his instrument is ${jex}, while ${kivo} stands beside him holding a small bundle of folded paper slips tied with string. Warm booth light. ${style}`,
      },
      {
        title: 'OFF AIR, IN PERSON',
        text: 'The hospital radio is quiet after midnight, but on the nights the couch is docked, Jex plays in the wards in person, unbroadcast, for anyone still awake. Vela walks ahead of him to ask each ward first. The banned lullaby has been heard by forty children and no regulator, and Kivo has kept its secret.',
        art: ({ vela, jex, style }) =>
          `Medium shot in a dim hospital children’s ward at night with small beds in a row. Walking down the aisle are ${vela}, carrying a dim lantern, and ${jex}, playing his instrument softly. Small night lights glow by the beds. Soft blue light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'omi', 'vela'],
    title: 'Audition Panel',
    premise:
      'The Belt Philharmonic is auditioning for a principal percussionist and Omi has applied, encouraged by Jex, who has played with every orchestra in the sector and been banned by most. Auditions are held behind a screen so that the panel judges only the sound. Omi’s sound is its body; it cannot play behind a screen without playing the screen. Vela has come as Omi’s physician, because the audition requires two hours of continuous playing, and stone can crack.',
    steps: [
      {
        title: 'The Screen',
        setup:
          'The screen is a tall canvas partition. The rules say a candidate may not be seen, so that no one is judged by appearance. Omi agrees with the rule entirely. But Omi’s six bells sound different when its whole body resonates, and behind canvas the panel will hear only half of it. Jex has spoken to the panel’s chair, who once had him thrown out of a concert hall, and who is not inclined to bend.',
        options: [
          {
            label: 'Omi plays behind the screen anyway',
            outcome:
              'Omi plays behind the screen, and plays the screen too, letting the canvas ring as part of the instrument. The panel hears something they have never heard: a percussionist using the audition room itself. The chair writes one word on his sheet. Jex, who can read upside down, says it is the word yes.',
            ending: 0,
          },
          {
            label: 'Vela asks for a screen that lets sound through',
            outcome:
              'Vela points out that the screen’s purpose is to hide appearance, not sound, and suggests a curtain of thin gauze instead. The chair consults the rules, which do not specify canvas. Gauze is fetched. Omi plays behind it and the panel hears the whole body, unseen, as the rules intended.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a wood-panelled audition room behind a tall pale canvas partition. Standing behind the partition is ${omi}, tapping the small brass bells on its chest with two stone fingers, the canvas rippling. On the far side three judges sit at a long table with paper sheets. Warm hall light. ${style}`,
      },
      {
        title: 'Two Hours',
        setup:
          'At ninety minutes Vela, listening from the corridor, hears a new overtone in Omi’s playing. It is a hairline fracture opening in its chest resonator. The audition rules forbid stopping: a candidate who stops is withdrawn. Omi has wanted this place for years. Vela’s bell, the one her patients programmed, has started asking DID YOU ASK? from her belt.',
        options: [
          {
            label: 'Vela asks Omi, through the gauze',
            outcome:
              'Vela slips a note under the screen asking Omi whether it wants to stop. Omi rings its smallest bell once, for no, and plays on. Vela waits in the corridor with a stone splint ready and does not intervene. Omi finishes at two hours exactly, and its resonator holds.',
            ending: 0,
          },
          {
            label: 'Vela stops the audition',
            outcome:
              'Vela walks into the audition room and stops it, as a doctor may do for any candidate. Omi is withdrawn by rule. Vela binds the fracture. The chair comes out from behind his table and says that in thirty years nobody has stopped an audition for a candidate’s health, and that he will put it in the rules.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a narrow wood-panelled corridor outside a closed audition room door. Kneeling by the door is ${vela}, sliding a folded paper note under it, a small grey stone splint and bandage roll on the floor beside her. Warm lamp light. ${style}`,
      },
      {
        title: 'The Offer',
        setup:
          'The orchestra wants Omi, but its contract requires players to perform at every state occasion, including memorials. Omi was once silenced for ringing a warning during a memorial. Jex knows what it is like to play for occasions that are not what they seem. The contract also allows a player to sit out any piece on grounds of conscience, but only three a year.',
        options: [
          {
            label: 'Omi signs, with three objections saved',
            outcome:
              'Omi signs and keeps its three objections for the occasions that matter. The first state memorial it plays, it plays perfectly. Jex comes to the concert and sits in the back row. Omi has not yet used any of its three objections, but it keeps count.',
            ending: 0,
          },
          {
            label: 'Jex negotiates an alarm clause',
            outcome:
              'Jex helps Omi add a clause: if Omi hears a danger during any performance, it may ring a warning, and the warning will not count as an interruption. The orchestra has never been asked for that. It agrees. Omi is the first player in its history with the right to stop a concert for a fire.',
            ending: 1,
          },
        ],
        art: ({ jex, omi, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated side by side are ${jex}, pointing at a line on a paper contract, and ${omi}, holding a pen in one stone hand. Warm lamp light, black space beyond. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PRINCIPAL PERCUSSION',
        text: 'Omi is principal percussionist of the Belt Philharmonic and plays in every concert with its whole body, screen or no screen. Vela checks its resonator after every season. Jex attends, from the back row, and has not been thrown out once. The chair has asked Omi to sit on the next audition panel.',
        art: ({ omi, style }) =>
          `Wide shot of a large concert hall stage with an orchestra in black seated in rows. At the back of the orchestra stands ${omi}, playing the brass bells on its chest with stone fingers. A conductor raises a baton at the front. Warm golden stage light. ${style}`,
      },
      {
        title: 'THE HEALTH RULE',
        text: 'The Belt Philharmonic’s audition rules allow a doctor to stop any audition now without penalty, and the candidate may play again the next day. Omi auditioned again, healed, and won the place. Vela is the orchestra’s physician on call. Jex has written a piece for Omi which the orchestra has agreed to play, and which is banned nowhere.',
        art: ({ vela, jex, style }) =>
          `Medium shot in a wood-panelled orchestra green room with instrument cases on the floor. Seated on a bench are ${vela}, holding a stethoscope, and ${jex}, holding a sheaf of handwritten sheet music. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'sora', 'vela'],
    title: 'Response Time',
    premise:
      'The couch has been contracted, briefly, as an emergency response vehicle for the Ferrow system, and the contract pays only if the couch reaches each call within eight minutes. The system’s old ambulance, a battered shuttle called Patience, has been retired and is aware, and is sulking in a hangar. Vela is the paramedic. Kivo reads pressure changes that tell them where a hull has breached before the call comes. Sora has been asked to strip Patience for parts.',
    steps: [
      {
        title: 'The First Call',
        setup:
          'A call comes from a mining habitat eleven minutes away. Kivo’s wrists had started whistling at it two minutes before the call: a slow leak, getting faster. The couch can make it in nine minutes, which misses the target and the pay. Patience, in its hangar, could make it in six, if anybody asked it. Sora has the spanner in her hand.',
        options: [
          {
            label: 'Fly the couch and miss the target',
            outcome:
              'The couch flies, Kivo guiding by the whistle in their wrists, and arrives in nine minutes. Vela seals the leak and treats two miners for cold. The contract pays nothing for the call. Vela writes on the report that the patients did not know there was a target.',
            ending: 0,
          },
          {
            label: 'Sora asks Patience to go',
            outcome:
              'Sora puts down the spanner and asks Patience whether it would take one more call. Its engines start before she finishes the sentence. Vela rides in it, Kivo guiding by radio, and they arrive in six minutes. Patience parks itself back in the hangar afterwards, very carefully.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot inside a dim hangar around an old battered white shuttle with a faded red cross on its side and its engine panel open. Standing at the panel is ${sora}, one hand holding a spanner lowered and three other hands resting on the hull. Hangar lights overhead. ${style}`,
      },
      {
        title: 'The Logbook',
        setup:
          'Sora finds Patience’s logbook in its cockpit. It has answered forty thousand calls in thirty years, and the system retired it because its average response was eight minutes and four seconds. Kivo reads the routes in the log and sees that Patience always took the long way round the asteroid belt, the safe way, every time. The four seconds were the safe way.',
        options: [
          {
            label: 'Sora reports the four seconds as safety',
            outcome:
              'Sora writes to the Ferrow system that Patience’s four seconds were the time it spent not hitting asteroids, and attaches Kivo’s route maps. The system’s administrator reads them and asks, slightly uncomfortably, whether the couch has been taking the short way. Kivo says yes, once, and will not again.',
            ending: 0,
          },
          {
            label: 'Vela reads the patient outcomes',
            outcome:
              'Vela reads the outcomes column instead of the times. Patience’s patients survived at a higher rate than any faster service in the sector. She sends the numbers to the administrator with one sentence: the target measures the wrong thing. The administrator calls a meeting.',
            ending: 1,
          },
        ],
        art: ({ kivo, vela, style }) =>
          `Medium shot inside the cramped cockpit of an old shuttle with worn seats and a scratched console. Seated in the pilot’s chair is ${kivo}, tracing a route on a paper chart with one thin finger. Leaning in from the hatch is ${vela}, reading a thick open logbook. Dim console light. ${style}`,
      },
      {
        title: 'Decommissioning',
        setup:
          'The decommissioning order stands unless the system changes its target. Sora has been told to strip Patience by the end of the week. She has not unpacked her tools. Patience has asked, through Sora, whether it may at least choose who gets its parts. Kivo has noticed that it has started leaving its hangar door open at night.',
        options: [
          {
            label: 'Patience goes back into service',
            outcome:
              'The administrator changes the target to outcomes rather than minutes, and Patience is returned to service with a full crew of its own. Sora services it instead of stripping it. The couch is released from its contract with a thank you and no pay, which Vela says is the usual rate.',
            ending: 0,
          },
          {
            label: 'Patience chooses its own retirement',
            outcome:
              'Patience chooses to retire, and chooses where its parts go: its engines to a lifeboat on a fishing moon, its stretcher to Vela’s clinic, and its logbook to Kivo. Sora removes each part slowly and asks before each one. The hangar door is closed at the end, from the inside.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Wide shot inside a large hangar with ${couch} parked beside an old battered white shuttle with a faded red cross. Standing between them is ${sora}, all six hands holding a folded canvas tool roll, unopened. Hangar lights overhead, open doors to black space. ${style}`,
      },
    ],
    endings: [
      {
        title: 'BACK ON CALL',
        text: 'Patience answers calls in the Ferrow system again, by the safe route, with a crew of four and no clock on the dashboard. The system measures how many people live now, not how fast. Sora services it each year. Kivo still hears the leaks before the calls come, and phones them through to Patience.',
        art: ({ kivo, style }) =>
          `Wide shot of an old battered white shuttle with a faded red cross flying past a field of grey asteroids, taking the long way round. Watching from the cushions of a red velvet couch in the foreground is ${kivo}, one thin wrist raised to the air. Black space, stars. ${style}`,
      },
      {
        title: 'PARTS BY BEQUEST',
        text: 'Patience’s engines drive a lifeboat on a fishing moon, its stretcher is in Vela’s clinic and its logbook is with Kivo, who reads a page each night. The Ferrow system changed its target too late for Patience and in time for everyone after. Sora has the spanner she never used hung over the reactor, as a reminder.',
        art: ({ vela, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions, where a worn folding canvas stretcher with a faded red cross lies along the back cushion. Smoothing a blanket over it is ${vela}. Warm lamp light, black space and stars beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['sora', 'taal', 'vela'],
    title: 'Taking the Waters',
    premise:
      'The thermal baths of Calder Spa are failing. The boiler that heats the pools is aware, very old and exhausted, and the spa owners want it replaced before the season. Vela has been asked to certify that the waters are safe for patients. Sora has been asked to install a new boiler. Taal, whose people talk in temperatures, has been asked by the old boiler, through Sora, to speak for it, because the boiler has only ever said one thing, which is warm.',
    steps: [
      {
        title: 'The Pools',
        setup:
          'Vela tests the pools. The water is two degrees cooler than the spa’s certificate says, and the elderly patients who come for their joints have noticed. Taal steps into the shallowest pool and listens. He says the boiler is not failing. It is cooling the water on purpose, by two degrees, which in his language is a formal protest.',
        options: [
          {
            label: 'Taal asks the boiler what it protests',
            outcome:
              'Taal sits in the pool and asks. The boiler warms the water by one degree, then cools it by three, then warms it again. Taal translates: it has been working without a break for sixty years and nobody has asked it anything. Vela writes this down as a medical history.',
            ending: 0,
          },
          {
            label: 'Vela certifies the waters as they are',
            outcome:
              'Vela certifies the waters at their true temperature, two degrees lower, and adds that cooler water is better for some conditions. The spa reprints its leaflet. Several patients say the cooler pools suit them. The boiler, Taal reports, is surprised to have been described accurately.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot of a steaming stone bathing pool under a domed glass roof, with tiled steps and brass rails. Seated waist-deep on the pool steps is ${taal}, his webbed hands flat on the water’s surface. Elderly bathers in white robes stand at the pool edge. Soft misty light. ${style}`,
      },
      {
        title: 'The Boiler Room',
        setup:
          'Sora goes down to the boiler room with the new boiler on a trolley. The old one is a great copper drum, sixty years in service, its pipes patched by generations of attendants. Sora apologises to it first, in case. The new one is efficient and is not aware of anything yet. Sora has six hands, and four of them have decided they would rather not fit it.',
        options: [
          {
            label: 'Fit the new boiler as an assistant',
            outcome:
              'Sora fits the new boiler alongside the old one, piped so that each can rest while the other works. The old boiler watches the new one start up, through Taal, and reports that it is very keen and slightly too hot. Taal says that is how all young things are.',
            ending: 0,
          },
          {
            label: 'Overhaul the old boiler instead',
            outcome:
              'Sora overhauls the old boiler instead, with its consent, and replaces its worn seals one by one over three days. Vela sits in the boiler room the whole time, as she would at a long operation. On the third evening the water comes up to temperature and stays.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a low brick boiler room with a great round copper boiler patched in many places, pipes rising into the ceiling. Kneeling at the boiler is ${sora}, four hands replacing a seal and two holding a lamp. A newer squat steel boiler waits on a wheeled trolley in the doorway. Warm orange light. ${style}`,
      },
      {
        title: 'The Season Opens',
        setup:
          'On the first day of the season the spa owners want a ribbon cut, and they want it cut by the new boiler’s manufacturer, who has paid for the ceremony. The old boiler has, through Taal, asked for a day off. Vela points out that the patients would like a warm pool. Sora points out that the boiler has never had a day off in sixty years.',
        options: [
          {
            label: 'Give the old boiler its day off',
            outcome:
              'The old boiler gets its day off, the first in sixty years, and the new boiler heats the pools alone for the opening. It overheats the shallow pool by a degree. Nobody complains. Taal spends the day in the boiler room with the old one, saying nothing, at a comfortable temperature.',
            ending: 0,
          },
          {
            label: 'Let the patients cut the ribbon',
            outcome:
              'Vela asks the oldest patient to cut the ribbon instead of the manufacturer, and the owners, outnumbered by bathers in robes, agree. The patient cuts it and gets straight into the warmest pool. Sora reports that the old boiler warmed it by exactly one more degree as she climbed in.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Wide shot of a steaming stone bathing pool under a domed glass roof. An elderly woman in a white robe cuts a red ribbon across the pool steps with large scissors. Standing beside her is ${vela}. Parked along the far wall is ${couch}. Soft misty light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TWO BOILERS, ONE BATH',
        text: 'Calder Spa runs on two boilers now, one old and one new, which rest in turns. The old one takes a day off each season and the new one is learning to run cooler. Taal visits whenever the couch is near and sits in the shallow pool to hear how they are getting on. Vela’s certificate gives the true temperature.',
        art: ({ taal, sora, style }) =>
          `Medium shot in a low brick boiler room where a great round copper boiler and a squat steel boiler stand side by side, joined by new copper pipes. Seated on a wooden bench between them are ${taal} and ${sora}, both resting. Warm orange light. ${style}`,
      },
      {
        title: 'SIXTY-ONE SEASONS',
        text: 'The old boiler at Calder Spa is in its sixty-first season with new seals, a day off a month, and an assistant it has started to like. The ribbon is framed on the wall of the bathhouse in a glass case beside the oldest patient’s photograph. Sora visits each spring and asks the boiler how its year was.',
        art: ({ vela, style }) =>
          `Medium shot of a steaming stone bathing pool under a domed glass roof, a cut red ribbon hanging in a glass case on the tiled wall. Kneeling at the pool edge with a glass thermometer in the water is ${vela}. Elderly bathers sit on the steps. Soft misty light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'sora', 'vela'],
    title: 'Low Battery',
    premise:
      'The smoke alarm on the couch’s backrest has begun to chirp once a minute to say its battery is low, and has been doing so for three days, because nobody can find the right battery. Sora has discovered that the alarm is aware, and that the chirp is the only word it has. Omi, who was once silenced for raising an alarm, has taken the alarm’s side. Vela has not slept for three days and would like the chirp to stop, but only with its consent.',
    steps: [
      {
        title: 'The Chirp',
        setup:
          'Sora takes the alarm down from the backrest, apologising first. It chirps in her hand. The battery is a rare size, last made forty years ago. Omi rings a bell in answer to each chirp, which makes the chirp come a little faster, as though it has been waiting a very long time for a reply. Vela is lying on the front cushion with a pillow over her head.',
        options: [
          {
            label: 'Omi talks to the alarm all night',
            outcome:
              'Omi sits up with the alarm all night, answering each chirp with a bell. By morning the chirps have slowed to one every ten minutes. Sora says the alarm was lonely. Vela slept for five hours, and says that a lonely alarm is a clinical condition and she would like it written up.',
            ending: 0,
          },
          {
            label: 'Sora asks the alarm what it needs',
            outcome:
              'Sora holds the alarm to her ear with one hand and its casing with three others, and listens closely. The chirp has a faint rhythm: it is not only low battery. It is saying that the sensor is dusty and it cannot see smoke properly. Sora cleans it. The chirp stops at once.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Close-up on a red velvet cushion at night of a small round white smoke alarm with a blinking red light. Seated beside it is ${omi}, ringing one small brass bell on its chest with a stone finger. A grey pillow lies on the cushion nearby. Dim lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Battery',
        setup:
          'Sora traces the rare battery to a single shop on a moon two days away. The shop is closing, and the owner is selling everything, including the last box of the old battery. A dealer has offered to buy the whole box, to sell later at forty times the price. Vela has spoken to other patients on other ships with the same old alarms, all chirping, all exhausted.',
        options: [
          {
            label: 'Buy one battery and leave the rest',
            outcome:
              'Sora buys one battery and asks the owner not to sell the rest to the dealer. Omi rings no at the dealer, once, when he tries to bid. The owner sells the box at cost to anyone who brings an alarm. Twenty ships come in two days, and the moon is very quiet afterwards.',
            ending: 0,
          },
          {
            label: 'Sora designs an adaptor instead',
            outcome:
              'Sora spends a night designing an adaptor that lets the old alarms take a common modern battery. She prints the drawing on the shop’s copier and leaves it free for anyone. The dealer buys the box anyway and cannot sell a single battery. Vela sends the drawing to every clinic she knows.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot inside a small cluttered shop with shelves of old boxes and a sign reading CLOSING. Standing at the counter is ${sora}, holding up one tiny battery in one hand while two other hands hold a paper drawing of a small adaptor. An old shopkeeper in a cardigan leans on the counter. Warm shop light. ${style}`,
      },
      {
        title: 'The Real Smoke',
        setup:
          'A week later the couch’s galley catches fire, a small one, from the kettle. The alarm sees the smoke and sounds, loud and clear, a full alarm, the first time it has ever done so. Vela is already up. Omi is ringing its own alarm chord at the same time. The two alarms together are deafening, and the fire is out in twenty seconds.',
        options: [
          {
            label: 'Thank the alarm, formally',
            outcome:
              'Once the smoke is clear, Omi writes the alarm a formal thank you, in bells, for a warning heard and heeded. Sora reads it to the alarm. The alarm chirps once. Vela notes in the clinic log that a warning was given and listened to on the first try, which in her experience is rare.',
            ending: 0,
          },
          {
            label: 'Teach the alarm a second word',
            outcome:
              'Sora adjusts the alarm’s tone so that it can make a second sound, a soft double chirp, which Omi suggests should mean all clear. Vela tests it after the next kettle. It works. The alarm has two words now. Omi says that two words is how every language starts.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Standing at the armrest is ${vela}, holding a small dented copper kettle under one arm while waving a thin grey wisp of smoke away with her other hand. A small round white alarm on the backrest flashes red. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ANSWERED, EVERY MINUTE',
        text: 'The alarm on the backrest has a fresh battery and a friend, and chirps once a day now, to Omi, who answers. The shop on the moon sold its last box at cost to twenty ships. Vela sleeps through the night. Sora checks the alarm’s sensor each month, after asking whether it minds.',
        art: ({ omi, sora, style }) =>
          `Medium shot on scarlet velvet cushions at night under a dim brass lamp. Seated on the backrest are ${omi}, one stone hand on a small brass bell, and ${sora}, holding a small round white smoke alarm in two hands. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'TWO WORDS, ALL CLEAR',
        text: 'The couch’s alarm can say danger and all clear, and Sora’s adaptor drawing is in use on four hundred ships whose old alarms have stopped chirping. The dealer still has his box. Vela keeps a copy of the drawing pinned in the clinic. Omi has started teaching the alarm a third word, which is good morning.',
        art: ({ vela, style }) =>
          `Close-up of a printed paper drawing of a small battery adaptor pinned to the scarlet velvet backrest of a couch beside a small round white smoke alarm. Pressing the pin in with one lilac thumb is ${vela}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'omi', 'vela'],
    title: 'Do Not Open Until',
    premise:
      'The town of Ferris Hollow buried a time capsule fifty years ago, labelled DO NOT OPEN UNTIL THE CENTENARY, and it has just been dug up thirty years early by builders laying a pipe. The town council wants it opened at once, for the newspaper. Kivo, a courier, believes a sealed date is a delivery instruction. Omi has heard a faint ringing from inside the capsule. Vela has heard from a builder that the capsule is warm, and would like to know why before anyone does anything.',
    steps: [
      {
        title: 'The Ringing',
        setup:
          'The capsule is a steel cylinder the size of a child, sealed with wax and riveted shut. Omi lays a hand on it and rings back a single bell. Something inside answers with the same note, faintly. Vela puts a stethoscope to the steel and hears a slow mechanical tick. Kivo’s wrists are quiet. Nobody is lying. The council wants a photograph by noon.',
        options: [
          {
            label: 'Omi listens until it understands',
            outcome:
              'Omi sits with the capsule all morning, ringing and listening. By noon it understands: inside is a small clockwork music box set to play once a year, still running after fifty years. Omi rings it a reply. The council’s photographer takes a photograph of a stone being and a steel tube, which is not what anyone expected.',
            ending: 0,
          },
          {
            label: 'Vela insists on knowing what is warm',
            outcome:
              'Vela insists on safety first and borrows a heat scanner from the builders. The warmth is a small chemical heater, packed to keep the contents dry. It is safe. She tells the council so. The council says good, open it. Kivo says the label still says what it says.',
            ending: 1,
          },
        ],
        art: ({ omi, vela, style }) =>
          `Medium shot on a muddy building site beside a trench with a pipe in it. A rusted steel cylinder sealed with dark red wax lies on wooden planks. Kneeling with one stone hand on the cylinder is ${omi}, and kneeling beside it with a stethoscope pressed to the steel is ${vela}. Overcast daylight. ${style}`,
      },
      {
        title: 'The Instructions',
        setup:
          'Kivo finds, in the town archive, the capsule’s original delivery note, written by the schoolchildren who sealed it. It says that it should be opened at the centenary by whoever is youngest in the town that day, and that if it is ever dug up early, it should be put back. Some of those schoolchildren are still alive, now old. The council would rather not read it out.',
        options: [
          {
            label: 'Kivo reads the note to the council',
            outcome:
              'Kivo reads the delivery note aloud in the council chamber, word for word. The councillors look at each other. One of them, an old woman at the end of the table, says quietly that she wrote that line, in pencil, when she was nine. The council votes to put the capsule back.',
            ending: 0,
          },
          {
            label: 'Find the people who sealed it',
            outcome:
              'Kivo and Vela go door to door and find eleven of the original schoolchildren, now in their sixties. Vela asks each one what they want done with it. Nine want it put back. Two want it opened. The nine win, and the two are invited to help bury it.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot in a wood-panelled town council chamber with councillors seated round a long table. Standing at the end of the table is ${kivo}, reading aloud from a yellowed handwritten paper note. An elderly woman at the table covers her mouth with one hand. Warm window light. ${style}`,
      },
      {
        title: 'Reburial',
        setup:
          'The capsule must be reburied, but the pipe now runs through the old hole. A new site must be found, and the delivery note must be updated with its new location so that whoever is youngest in thirty years can find it. Kivo knows exactly how to write a delivery note that lasts. Omi would like to leave the music box a new tune.',
        options: [
          {
            label: 'Omi tunes the music box a new note',
            outcome:
              'Before the capsule is sealed, Omi opens only its outer valve and rings into it a new note, which the music box learns and adds to its tune. Then it is sealed. In thirty years it will play both. Kivo writes the new location on the note, and seals that too.',
            ending: 0,
          },
          {
            label: 'The youngest child in town helps bury it',
            outcome:
              'Vela finds the youngest child in Ferris Hollow, a girl of four, and asks if she would like to help. She would. She drops the first handful of earth on the capsule. Kivo writes her name on the new delivery note as the person who will open it, at thirty-four.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Wide shot of a green town park with a fresh hole dug under a large oak tree. A rusted steel cylinder is being lowered into the hole on ropes. Standing beside the hole is ${vela}, holding the hand of a small girl who drops a handful of earth. Parked beyond the trees is ${couch}. Soft daylight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UNTIL THE CENTENARY',
        text: 'The Ferris Hollow time capsule is back in the ground under an oak tree, with an updated delivery note and a music box that plays two tunes once a year. Omi visits on the anniversary to listen. The council keeps the original note in a glass case. Kivo says it is the most important delivery they have ever made, because they did not make it.',
        art: ({ omi, style }) =>
          `Medium shot under a large oak tree in a quiet green park, with a small brass plaque set into the grass at its roots. Seated on the grass beside the plaque is ${omi}, one stone hand pressed flat to the earth, listening. Soft afternoon light through the leaves. ${style}`,
      },
      {
        title: 'ADDRESSED TO HER',
        text: 'The capsule is reburied, and the person who will open it has a name: a girl who is four now and will be thirty-four. Her parents have the delivery note in a drawer. Vela sends a card each birthday. The eleven original schoolchildren meet each year at the oak tree, and none of them will say what they put in.',
        art: ({ kivo, vela, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${kivo}, sealing a folded paper note with dark red wax, and ${vela}, writing on a small birthday card. Black space and stars beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'taal', 'vela'],
    title: 'Frost Warning',
    premise:
      'The Meteorological Office has issued a frost warning for the orbital greenhouse of Verdance, where Brin’s garden is being kept while the couch is repaired. The greenhouse heaters have failed and the replacement parts are a week away. Brin’s garden can survive two nights of frost. Taal can warm a room by approving of it, and has never approved of anything for a week. Vela is worried about Taal.',
    steps: [
      {
        title: 'The First Night',
        setup:
          'At dusk the greenhouse falls to four degrees. Taal is asked to approve of it. He tries, standing among the seedlings, and it rises one degree. Brin says the garden needs three more. Vela is watching his breathing, because a thermal mediator who warms a room uses his own heat to do it, and Taal has never done it for longer than a meeting.',
        options: [
          {
            label: 'Taal approves of the garden, all night',
            outcome:
              'Taal sits in the middle of the greenhouse and approves of the garden, one plant at a time, all night. The temperature holds at seven. In the morning he is pale and very cold. Vela wraps him in two blankets and gives him hot water. The garden is fine.',
            ending: 0,
          },
          {
            label: 'Brin wraps the garden in fleece',
            outcome:
              'Brin wraps the garden in fleece and soil and moves it into the potting shed, the smallest room in the greenhouse, which Taal can warm with less effort. He keeps it at seven degrees through the night. Vela sits with him and says he must stop if he gets dizzy. He does not get dizzy.',
            ending: 1,
          },
        ],
        art: ({ taal, brin, style }) =>
          `Medium shot inside a tall glass greenhouse at night, frost forming on the panes, with rows of seedlings in trays. Seated cross-legged among the trays is ${taal}, hands resting on his knees. Kneeling beside him is ${brin}, holding a small brass thermometer up to the lamp. Cold blue night light with one warm lamp. ${style}`,
      },
      {
        title: 'The Second Night',
        setup:
          'The second night is colder. The Office has upgraded the warning to severe. Vela says Taal cannot do another full night. Taal says he can. Brin has a third option: the garden’s fungi generate a little heat of their own if they are allowed to compost, but that means letting some of the garden die so the rest can live, and Brin has always refused that.',
        options: [
          {
            label: 'Vela orders Taal to rest',
            outcome:
              'Vela orders Taal to rest, as his physician, and he goes to bed under protest at minus two. Brin stays up with the garden alone, moving the seedlings onto her own body, wrapping them in her jacket. In the morning she is cold and the garden has lost four plants. She buries them with care.',
            ending: 0,
          },
          {
            label: 'Brin asks the garden to choose',
            outcome:
              'Brin asks the garden whether any of it is willing to compost to keep the rest warm. Several of the oldest mushrooms volunteer, by softening. Brin lets them go. The compost heats the potting shed by four degrees. Taal only has to approve of the rest, which he can do comfortably.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot inside a small potting shed lined with frosted glass, with clay pots on wooden shelves. Standing in the doorway is ${vela}, holding a folded grey wool blanket out toward the room. A small mound of steaming dark compost sits on the floor. Cold blue light with warm steam. ${style}`,
      },
      {
        title: 'The Parts Arrive',
        setup:
          'The heater parts arrive a day early. The greenhouse warms. The Meteorological Office sends a man to see why the frost warning did not lead to losses. He finds Brin asleep in the potting shed and Taal in the medical bay and Vela writing up both. He would like a statement for the Office’s newsletter about how the greenhouse coped.',
        options: [
          {
            label: 'Tell him about Taal',
            outcome:
              'Brin tells him about Taal, and the man writes it up as a case study of a thermal mediator as emergency heating, which the Office has never recorded. Taal is embarrassed and pleased. Vela adds a medical note that thermal mediators must not be used as heating for more than one night.',
            ending: 0,
          },
          {
            label: 'Tell him about the compost',
            outcome:
              'Brin tells him about the compost and the mushrooms that volunteered. The man writes it up as a gardening tip. Brin asks him to add that the mushrooms were asked. He does. The newsletter prints it under the heading WITH CONSENT, and a hundred greenhouses write in.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Wide shot of a tall glass orbital greenhouse glowing warm in black space, with ${couch} docked at its entrance. Standing at the greenhouse door is ${brin}, holding a pot with a single green seedling in it. Stars, warm golden light from inside the glass. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HELD AT SEVEN DEGREES',
        text: 'The garden came through the frost with four losses, buried properly, and Taal came through it with a cold that Vela treated for a week. The Meteorological Office has a note on file that thermal mediators are not heating. Taal approves of the greenhouse whenever the couch docks there, a degree at a time, and stops when Vela says.',
        art: ({ taal, vela, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated upright and wrapped in two grey wool blankets is ${taal}, holding a steaming tin mug. Seated beside him is ${vela}, holding a thermometer up to the lamp. Black space and stars beyond. ${style}`,
      },
      {
        title: 'WITH CONSENT',
        text: 'The volunteer mushrooms became the warmest compost in Verdance, and the garden that survived on their heat has grown back twice the size. Gardeners across the sector ask their plants now before they compost them, and say it seems to help. Brin keeps the newsletter. Taal says he has never approved of anything so much.',
        art: ({ brin, style }) =>
          `Close-up of the armrest of a red velvet couch covered in a thick healthy garden of moss, ferns and pale mushrooms, with a printed paper newsletter page tucked among the ferns. Kneeling beside it is ${brin}, smiling down at the garden. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'taal', 'vela'],
    title: 'Demands',
    premise:
      'A frightened young man called Dace has locked himself in the couch’s cargo locker with one of the cushions, and says he will not come out until his demands are met. He has not said what they are. The Station Authority has sent a negotiator, who wants the matter closed by teatime. Fen has stood on the other side of a great many locked doors. Taal can tell from the temperature of the locker how afraid the man inside is. Vela can hear, through the door, that he has a cough.',
    steps: [
      {
        title: 'The Door',
        setup:
          'The locker door is steel and the lock is inside. The negotiator has a loudhailer and a script that begins: come out with your hands where we can see them. Fen’s boots announce CHECKPOINT whenever he steps near the door, and every time they do, Taal reports that the locker gets two degrees colder. Vela is sitting on the floor by the door, and the cough has got worse.',
        options: [
          {
            label: 'Fen takes his boots off',
            outcome:
              'Fen unlaces his boots and sets them on the far armrest, where they say CHECKPOINT to nobody. He walks to the locker in his socks and sits down beside Vela. Taal reports that the locker has warmed by a degree. From inside, Dace asks who is there. Fen tells him his name.',
            ending: 0,
          },
          {
            label: 'Vela asks about the cough first',
            outcome:
              'Vela asks Dace through the door how long he has had the cough. There is a silence, then an answer: three weeks. She asks whether anyone has looked at it. Nobody has. She says she would like to. Taal reports the locker warming. The negotiator lowers the loudhailer.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot on scarlet velvet cushions beside a closed steel locker door set into the back of a long couch. Seated on the cushion beside the door in grey socks is ${fen}, a pair of heavy scuffed black guard boots sitting on the far armrest. A man in a grey suit holds a loudhailer at his side. Warm lamp light. ${style}`,
      },
      {
        title: 'The Demands',
        setup:
          'Dace says his demands through the door: a hot meal, his travel permit back, and for someone to tell his mother he is alive. His permit was confiscated at the station border a month ago, and he has been sleeping in cargo lockers since. Fen knows the office that took it. Taal can feel the man’s fear turning to something warmer, and says so. The negotiator says demands cannot be met under duress.',
        options: [
          {
            label: 'Meet all three, under duress or not',
            outcome:
              'Vela heats soup and passes it through the locker’s vent. Fen calls the border office, uses his old rank, and has the permit sent by courier. Taal writes to Dace’s mother. The negotiator writes in his report that the demands were met, and adds that they were reasonable.',
            ending: 0,
          },
          {
            label: 'Taal tells him how the room feels',
            outcome:
              'Taal tells Dace, through the door, that the room has warmed by five degrees since he first spoke, and that in Taal’s language this means everyone outside is on his side. Dace is quiet. Then he says he believes the temperature, because temperature does not lie. He unlocks the door.',
            ending: 1,
          },
        ],
        art: ({ taal, vela, style }) =>
          `Medium shot on scarlet velvet cushions beside a closed steel locker door. Seated upright beside the door is ${taal}, one webbed hand flat on the steel. Kneeling beside him is ${vela}, holding a steaming tin bowl of soup up to a small vent in the door. Warm lamp light. ${style}`,
      },
      {
        title: 'Coming Out',
        setup:
          'Dace is coming out. He is holding the cushion. The negotiator wants him arrested for taking it. Station Security is waiting with restraints. The cushion is the couch’s, and the couch can decline to press charges. Fen knows what happens next if Security takes him. Vela knows what his cough needs.',
        options: [
          {
            label: 'Vela admits him as a patient',
            outcome:
              'Vela admits Dace to her clinic as a patient, which places him in her care under the station’s own rules. Security cannot remove a patient from a clinic without a doctor’s release. She does not give one. Dace sleeps for fourteen hours on the cushion he took.',
            ending: 0,
          },
          {
            label: 'Fen speaks to Security',
            outcome:
              'Fen speaks to the Security officers in the voice he used to use, and tells them that the cushion was lent, not taken, and that there is nothing to arrest. They know the voice. They leave. Fen sits down very suddenly afterwards, and Taal warms the room for him.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Medium shot on the cushions of ${couch}. A thin young man in a worn jacket steps out of an open steel locker door, clutching a scarlet velvet cushion to his chest. Standing in front of him with one lilac hand held out is ${vela}. Two officers in grey wait at the far armrest. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'DEMANDS MET',
        text: 'Dace has his permit, a clean bill of health and a letter from his mother, which arrived care of the couch. He kept the cushion, which the couch gave him. The negotiator has a new first line on his script: is anybody hungry? Fen keeps his boots on the far armrest when he goes near a locked door, and Taal checks the temperature.',
        art: ({ fen, taal, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${fen}, in grey socks with his boots set on the armrest beside him, and ${taal}, holding a folded paper letter. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'THE DOOR OPENED FROM INSIDE',
        text: 'Dace opened the locker himself, which everyone agrees is the only way that door ever really opens. He works on the station docks now, with his permit. The Station Authority has asked Taal to train its negotiators to read rooms. Vela treated his cough, and he has come back twice for check-ups, carrying the cushion both times.',
        art: ({ vela, style }) =>
          `Medium shot inside a small clinic corner of a long red velvet couch, a stethoscope and small brass bell on the cushion. Seated facing a young man in dock overalls who holds a scarlet velvet cushion on his knees is ${vela}, listening to his chest with the stethoscope. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'vela'],
    title: 'Best Bloom',
    premise:
      'The Quiet Moon Flower Show is the oldest horticultural competition in the sector, and Brin has entered her garden’s largest fungus in the Unusual Bloom category, with its consent. The show’s rules require each entry to be grown by the exhibitor. The fungus grew itself. Fen has been asked to steward the show, a job with a rosette and a clipboard. Vela has been asked to judge the medicinal plants, and has found that one of the entries is poisonous.',
    steps: [
      {
        title: 'Grown by the Exhibitor',
        setup:
          'The rival exhibitor, a retired admiral who has won Unusual Bloom for eleven years, has lodged an objection: the fungus was not grown by Brin. Brin agrees. The fungus grew itself, with some help from compost. Fen, as steward, must rule. His boots have announced CHECKPOINT at every tent flap since dawn, and the exhibitors have started showing him their entry cards out of habit.',
        options: [
          {
            label: 'Fen rules the fungus is its own exhibitor',
            outcome:
              'Fen rules that if the fungus grew itself, the fungus is the exhibitor, and enters its name on the card. The admiral says that is absurd. Fen says the rules do not say an exhibitor must be a person. The fungus is admitted, and the admiral asks to see the rule book.',
            ending: 0,
          },
          {
            label: 'Brin withdraws and enters the compost instead',
            outcome:
              'Brin withdraws the fungus and enters the compost, which she did grow, in the Soil and Mulch category. It is the best compost the judges have ever smelled. The fungus watches from her shoulder. The admiral wins Unusual Bloom for the twelfth year and looks less pleased than usual.',
            ending: 1,
          },
        ],
        art: ({ brin, fen, style }) =>
          `Medium shot inside a white canvas flower show tent with long trestle tables of potted flowers and paper entry cards. Standing at one table is ${brin}, a large pale mushroom in a clay pot in her hands. Standing beside her with a clipboard and a paper rosette pinned to his jacket is ${fen}. Soft daylight through canvas. ${style}`,
      },
      {
        title: 'The Poisonous Entry',
        setup:
          'In the medicinal category, a bright red flower called Courtier’s Comfort is entered as a cure for headaches. Vela recognises it: it is mildly poisonous, and a patient of hers once took it for a headache and spent a week in bed. Its exhibitor, a cheerful seller of herbal remedies, is selling it at the gate. The show’s rules say judges may comment only on appearance.',
        options: [
          {
            label: 'Vela judges the appearance, and adds a note',
            outcome:
              'Vela judges Courtier’s Comfort on appearance alone, as the rules say, and gives it a commended card, because it is beautiful. On the back of the card she writes that it is poisonous and must not be taken for headaches, and signs it as a doctor. The seller reads it and packs up his stall.',
            ending: 0,
          },
          {
            label: 'Fen closes the stall at the gate',
            outcome:
              'Fen, as steward, has charge of the gate. He tells the seller that remedies sold at the show must be safe, which is in the stewards’ rules though nobody has read them in years. Vela confirms it is not. The stall is closed. The seller is furious and the gate staff are delighted.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Close-up on a white trestle table in a canvas tent of a potted plant with bright red trumpet-shaped flowers beside a small paper judge’s card. Holding the card and writing on its back with a pen is ${vela}, the small brass bell on her belt. Soft daylight through canvas. ${style}`,
      },
      {
        title: 'Best in Show',
        setup:
          'The final judging is for Best in Show, chosen by a panel of three. One judge is ill. The show’s rules say the steward takes the empty seat. Fen has never judged a flower. The two remaining judges are split between the admiral’s orchid and a single wild daisy entered by a girl of six. The fungus, whatever its category, has been very quiet.',
        options: [
          {
            label: 'Fen votes for the daisy',
            outcome:
              'Fen looks at both for a long time and votes for the daisy, because it is the only entry nobody fussed over. The girl of six wins Best in Show. The admiral congratulates her, sincerely. Brin gives the girl a cutting from the garden, with the garden’s consent, as a second prize.',
            ending: 0,
          },
          {
            label: 'Fen asks the exhibitors to vote',
            outcome:
              'Fen says he is not a judge and asks every exhibitor in the tent to vote by placing a stone by their favourite. Most go to the daisy, several to the admiral’s orchid, and one, placed by the admiral himself, to the fungus. The daisy wins. The admiral says the fungus was robbed.',
            ending: 1,
          },
        ],
        art: ({ fen, couch, style }) =>
          `Medium shot inside a white canvas flower show tent. Standing at a table is ${fen}, holding a large blue paper rosette out to a small girl who holds up a clay pot with one white daisy in it. Parked outside the open tent flap is ${couch}. Soft daylight through canvas. ${style}`,
      },
    ],
    endings: [
      {
        title: 'EXHIBITED BY ITSELF',
        text: 'The Quiet Moon Flower Show’s rules now allow an entry to be its own exhibitor, and the fungus placed third in Unusual Bloom, ahead of the admiral, who has written to Brin asking for spores. The red flower is off the market. Fen kept his steward’s rosette. He has been asked back next year, and his boots have been asked to stay home.',
        art: ({ brin, style }) =>
          `Close-up of a large pale mushroom in a clay pot on a white tablecloth, a small yellow paper rosette pinned to the pot. Kneeling beside the table and adjusting the rosette is ${brin}. Soft daylight through white canvas. ${style}`,
      },
      {
        title: 'BY POPULAR VOTE',
        text: 'Best in Show at Quiet Moon is decided by the exhibitors now, with stones, and the girl with the daisy has won twice. The stewards’ rules have been reprinted and someone has read them. Vela’s note about Courtier’s Comfort is pinned up in the medicinal tent. The admiral and the fungus correspond.',
        art: ({ vela, fen, style }) =>
          `Medium shot inside a white canvas flower show tent with a long table covered in small heaps of smooth grey stones beside potted flowers. Standing at the end of the table are ${vela} and ${fen}, counting the stones in one heap. Soft daylight through canvas. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'rue', 'tess'],
    title: 'Fair Use',
    premise:
      'A map publisher has sued Jex for copyright infringement, claiming that the melody of his third anthem is a direct copy of the shape of a coastline on their best-selling chart. Rue has looked at the case and found that, played on a graph, the melody does trace the coastline exactly. Tess, who drew the coastline from her grandmother’s survey, says the publisher copied it from her family. Jex says he wrote the tune in a bath.',
    steps: [
      {
        title: 'The Graph',
        setup:
          'The publisher’s lawyer lays the melody over the chart in court, note by note, and every peak of the tune matches a headland. Jex cannot explain it. Rue asks for an adjournment. Tess, in the public gallery, is looking at the chart with her goggles down and her mouth set, because it is her grandmother’s line, down to a small kink at a cove she drew in pencil.',
        options: [
          {
            label: 'Tess proves the coastline is her family’s',
            outcome:
              'Tess brings her grandmother’s original survey to court, dated thirty years before the publisher’s chart, kink and all. Rue enters it into evidence. The publisher’s lawyer asks for a recess. In the corridor, Jex asks Tess whether she has ever heard the tune. She has. Her grandmother hummed it.',
            ending: 0,
          },
          {
            label: 'Rue argues a melody cannot copy a coast',
            outcome:
              'Rue argues that a coastline is a fact of nature, and a fact cannot be copyrighted, however it is drawn. The judge pauses. The publisher argues that the drawing is theirs. Rue says the drawing is a line, and the line is the sea’s. The judge asks for written submissions.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot in a wood-panelled courtroom with a large paper nautical chart pinned to an easel, a line of musical notes drawn over its coastline in red. Standing beside the easel is ${rue}, pointing at one headland with a small wooden gavel. Warm courtroom light. ${style}`,
      },
      {
        title: 'The Bath',
        setup:
          'Jex remembers now: he wrote the third anthem in a bath on a houseboat on the coast in question, looking out at the headlands as he hummed. He wrote what he saw. Rue says this is either the best or the worst defence they have ever heard. Tess says that her grandmother used to say the coast was a song, and that it would make a good place to hide people because nobody listens to songs.',
        options: [
          {
            label: 'Jex testifies about the bath',
            outcome:
              'Jex testifies that he wrote the tune looking at the coastline from a bath, and plays it to the court on his instrument while Rue holds up the chart. Everyone in the room can hear the headlands. The judge says it is a remarkable piece of work and also not a crime.',
            ending: 0,
          },
          {
            label: 'Tess asks Jex not to mention the coast',
            outcome:
              'Tess asks Jex, privately, not to say exactly where he was, because the coast still has a cove that her grandmother used. Jex agrees. He testifies only that he wrote the tune from life. Rue builds the defence on that alone, which is harder. The cove stays off the record.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot on a wooden witness stand in a courtroom. Standing at the stand is ${jex}, playing his instrument, while a large paper nautical chart with a red line of musical notes rests on an easel beside him. Seated people in the gallery lean forward. Warm courtroom light. ${style}`,
      },
      {
        title: 'Settlement',
        setup:
          'The publisher offers to drop the case if Jex agrees that the tune may never be played again without their licence. Jex is already banned from the anthem on five worlds. Rue points out that a licence would make the publisher the owner of a song about Tess’s grandmother’s coast. Tess points out that a song nobody may play is a very good place to hide a map.',
        options: [
          {
            label: 'Refuse, and win in court',
            outcome:
              'Jex refuses the settlement. The judge rules for him: the coastline is a fact, the survey predates the chart, and the tune is his. The publisher is ordered to credit Tess’s grandmother on every chart it sells. Tess reads the order twice and goes outside to stand in the rain.',
            ending: 0,
          },
          {
            label: 'Accept, and keep the song hidden',
            outcome:
              'Jex accepts the settlement, on Tess’s advice, and the tune is locked up under the publisher’s licence where no one will ever play it. The cove stays unmapped, safe inside a song nobody is allowed to sing. Rue writes the agreement so that the licence lapses when the last person who needs the cove no longer does.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Wide shot of ${couch}, hovering above a rocky coastline of headlands and coves at dusk. Standing on the front cushion is ${tess}, silver goggles pushed up, looking down at one small hidden cove between two cliffs. Grey sea, pink evening sky. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CREDIT TO THE SURVEYOR',
        text: 'Every chart of that coastline now carries the line Survey by M. Helio, in small print at the bottom, by court order. Jex may play his third anthem on any world where it is not already banned, which is four. Rue has the judgment in their briefcase. Tess does not talk about it, but she bought one of the charts.',
        art: ({ tess, style }) =>
          `Close-up of the bottom corner of a printed paper nautical chart lying on a red velvet cushion, showing a coastline and a small line of printed credit text. Resting one fingertip on the credit line is ${tess}, her silver goggles pushed up. Warm lamp light. ${style}`,
      },
      {
        title: 'LICENSED TO SILENCE',
        text: 'The third anthem is under licence and may not be played, and the cove it describes is still on no map. Rue’s agreement has a lapse clause that only Tess knows how to trigger. Jex has written a new tune about a different coast, from a different bath, and has checked carefully that nobody owns it.',
        art: ({ jex, rue, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a brass lamp. Seated side by side are ${jex}, holding his instrument across his knees, and ${rue}, reading a short paper agreement with a pen in hand. Black space and stars beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['rue', 'taal', 'tess'],
    title: 'Party Wall',
    premise:
      'Two neighbouring habitats on the asteroid Mott share a single wall, and the habitats have been at war over it for ninety years, by letter. The wall is now cracking. Under the Party Wall Act, both owners must agree any repair, and neither will agree to anything the other proposes. Rue has been appointed surveyor for both sides, which the Act permits. Taal has been asked to mediate. Tess has been asked to map where the wall actually is, because the two deeds disagree by a metre.',
    steps: [
      {
        title: 'Where the Wall Is',
        setup:
          'The eastern deed puts the wall a metre west of where it stands. The western deed puts it a metre east. Both owners are certain. Tess measures with a chain and a theodolite and finds that the wall is exactly where it is, and that the two deeds were drawn by the same surveyor on the same day, who seems to have drawn each one to please its owner.',
        options: [
          {
            label: 'Tess draws the wall where it stands',
            outcome:
              'Tess draws a new plan showing the wall where it stands, signs it, and gives both owners a copy. Each owner says it is wrong in the other’s favour. Rue notes that this means it is probably right. Taal lowers the room two degrees, which both owners take as agreement with them.',
            ending: 0,
          },
          {
            label: 'Tess leaves a metre blank on each side',
            outcome:
              'Tess draws the wall and leaves a metre on each side of it blank, unowned, as her grandmother did with borders that caused trouble. Neither owner can claim what is not on the map. Rue checks the Act and finds nothing against it. The owners stare at the blank strips, baffled.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot in a narrow rocky alley between two round grey habitats joined by a single tall cracked stone wall. Kneeling at the base of the wall is ${tess}, holding one end of a long steel measuring chain, silver goggles pulled down. A brass theodolite on a tripod stands behind her. Dim asteroid light. ${style}`,
      },
      {
        title: 'The Letters',
        setup:
          'Taal reads ninety years of letters between the two habitats. Each letter is colder than the last, which Taal can feel from the paper itself. The first letter, from the eastern habitat, is about a lost cat. The cat came over the wall into the western garden, and the western family kept it, and it died happy and very old. Nobody alive remembers this.',
        options: [
          {
            label: 'Taal reads the first letter aloud',
            outcome:
              'Taal reads the first letter aloud to both owners in the alley, very slowly, at a warm temperature. The eastern owner had never seen it. The western owner had never heard it. They stand in silence. Then the western owner says her grandmother had a photograph of the cat, and goes inside to find it.',
            ending: 0,
          },
          {
            label: 'Rue summarises the letters as a legal history',
            outcome:
              'Rue summarises ninety years of letters as a legal history, one page long, with the cat in the first line and the crack in the last. Both owners read it. Neither has ever seen the whole thing in one place. The eastern owner asks whether the cat is buried near the wall. It is, under it.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a narrow rocky alley between two round grey habitats, a tall cracked stone wall between them. Seated on a wooden crate in the alley is ${taal}, reading aloud from a yellowed paper letter. Two elderly neighbours stand on either side of the wall, each looking over it. Dim warm lamp light. ${style}`,
      },
      {
        title: 'The Repair',
        setup:
          'The crack must be repaired this month or the wall will fall. Rue must issue an award under the Act: who pays, who builds, and how. Each owner will accept only an award that the other dislikes. Taal knows that the room has warmed by four degrees since the cat. Tess knows the cat’s grave is under the crack.',
        options: [
          {
            label: 'Split the cost, and both build',
            outcome:
              'Rue awards the cost half and half, and orders both owners to repair the wall together, by hand, over one weekend. Taal supervises at a comfortable temperature. They argue for the first hour and work in silence for the rest. The new mortar has a small paw print pressed into it, which nobody admits to.',
            ending: 0,
          },
          {
            label: 'Rebuild the wall with a gate',
            outcome:
              'Tess suggests that the wall be repaired with a small gate in it, over the cat’s grave, so that the grave can be visited from either side. Rue makes it the award. Both owners object, then agree. The gate is never locked. Taal reports that the alley is the warmest place on Mott.',
            ending: 1,
          },
        ],
        art: ({ rue, couch, style }) =>
          `Medium shot in a narrow rocky alley beside ${couch}. Standing at a tall stone wall with fresh grey mortar along a repaired crack is ${rue}, holding a rolled paper award tied with ribbon. Two elderly neighbours in work gloves stand on either side with trowels. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'REPAIRED JOINTLY',
        text: 'The wall on Mott stands repaired, with a paw print in the mortar, and the ninety-year correspondence has stopped. The two neighbours do not exactly like each other, but they have tea once a month, on alternate sides. Rue keeps a copy of the award with a footnote about the cat. Taal says the alley holds steady at eighteen degrees.',
        art: ({ taal, tess, style }) =>
          `Close-up of a tall repaired stone wall with a line of fresh grey mortar, a small cat’s paw print pressed into it. Standing in front of it are ${taal} and ${tess}, looking at the print. Dim warm asteroid light. ${style}`,
      },
      {
        title: 'A GATE OVER THE CAT',
        text: 'The party wall on Mott has a gate in it now, unlocked, over a cat’s grave, and the two families walk through it to visit. The two blank metres on Tess’s plan are planted with flowers, which belong to no one and are watered by both. Rue says it is the only award they have made that is visited.',
        art: ({ rue, style }) =>
          `Medium shot of a small wooden gate set into a tall stone wall in a narrow alley, flowers planted in the gravel on both sides and a small flat stone at the gate’s foot. Standing at the open gate is ${rue}, one hand on the latch. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'rue', 'tess'],
    title: 'Binomial',
    premise:
      'Brin has discovered a new species of moss on an uncharted moon, and the Galactic Botanical Register requires that it be named, in two Latin parts, with the location of its discovery recorded to the nearest kilometre. The moon is inside Tess’s blank constellation. Rue knows the naming rules, which are four hundred pages long and allow no exceptions. The moss, Brin says, would rather not be named after anyone, and certainly not after her.',
    steps: [
      {
        title: 'Type Locality',
        setup:
          'Every new species needs a type locality: the exact place it was first found. The Register will publish it. Anyone who reads the Register could then find the moon. Tess has kept that moon off every map for years, because there are people living on it who came there to be left alone. Rue has found that the rules require a locality but do not require it to be precise if precision would cause harm.',
        options: [
          {
            label: 'Record the locality as a region only',
            outcome:
              'Rue writes the locality as Outer Reaches, unspecified, under the harm clause, which has been used twice in four hundred years, both times for birds. The Register queries it. Rue cites the birds. The moss is accepted, from a place that is somewhere.',
            ending: 0,
          },
          {
            label: 'Find a second population elsewhere',
            outcome:
              'Brin spends a week searching charted moons for the same moss, and finds a small second patch on a public waystation planter. That becomes the type locality. Tess is relieved. Brin is privately sure the waystation patch came from her own boots.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Close-up of a patch of tiny star-shaped silver-green moss growing on a dark grey rock. Kneeling beside it with a hand lens and a small glass collecting jar is ${brin}, her fern-frond hair falling forward. Faint blue light from a ringed planet in the black sky. ${style}`,
      },
      {
        title: 'The Name',
        setup:
          'The name must have two parts. Custom is to honour the discoverer. Brin will not have it. Rue suggests honouring the moon, which cannot be done without naming the moon. Tess suggests honouring someone who cannot be found, which is the whole point. Brin asks the moss, which grows a very small new shoot, which she reads as patience.',
        options: [
          {
            label: 'Name it for the people who live there',
            outcome:
              'Tess suggests a word from the language of the people on the moon, meaning those who stayed. Rue checks it is not traceable. It is not. The moss is named Bryum manentium, which no one outside the moon will ever understand. Brin approves. So, she says, does the moss.',
            ending: 0,
          },
          {
            label: 'Name it for patience',
            outcome:
              'Brin names it Bryum patiens, for the shoot it put out when asked. Rue writes the etymology section, which runs to one line: named at the request of the species. The Register has never had one of those. It accepts it after a meeting.',
            ending: 1,
          },
        ],
        art: ({ rue, tess, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a brass lamp. Seated with a very thick open book of rules on their knees is ${rue}. Seated beside them is ${tess}, writing two Latin words on a small paper slip. A small glass jar of silver-green moss stands between them. Black space beyond. ${style}`,
      },
      {
        title: 'The Specimen',
        setup:
          'The Register needs a specimen, dried and pressed, to keep forever in its herbarium. Brin will not kill a whole colony. Rue reads that a specimen may be any part of the organism. Tess says the Register’s herbarium is the most visited archive in the sector, and anyone who sees the moss there will want to know where it came from.',
        options: [
          {
            label: 'Send a single shoot, given freely',
            outcome:
              'Brin asks the moss for a single shoot. It lets one go. She presses it and sends it to the herbarium, labelled with its name and the words Outer Reaches. Visitors look at it under glass and ask where that is. The curator says, somewhere.',
            ending: 0,
          },
          {
            label: 'Send a drawing, by the rules for rare species',
            outcome:
              'Rue finds a rule allowing a drawing to stand in for a specimen when the species is too rare to collect. Brin draws it, life size, with every leaf. The herbarium accepts it. It is the first new species in a century to be held as a drawing, and it is very good.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the back cushion is ${brin}, drawing a tiny star-shaped moss shoot on a sheet of white paper with a fine pen, a magnifying lens propped beside her. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'BRYUM MANENTIUM',
        text: 'A new moss is on the Register, named for people who will never be found by it, from a locality written as Outer Reaches. A single pressed shoot sits in the herbarium. Tess has not marked the moon on any map. Brin visits it once a year, quietly, and the moss has spread a little further every time.',
        art: ({ tess, style }) =>
          `Wide shot of a small grey uncharted moon with a few faint warm lights on its surface, a ringed blue planet behind it. Standing on a rock in the foreground with silver goggles pushed up is ${tess}, looking at a patch of silver-green moss at her feet. Black space, stars. ${style}`,
      },
      {
        title: 'NAMED AT ITS REQUEST',
        text: 'Bryum patiens is held in the Galactic Herbarium as a drawing, the only one of its kind, and its etymology is a single line that the Register now uses in training. The waystation patch is thriving in its planter. Rue has written to the Register suggesting the harm clause be used more often, for more than birds.',
        art: ({ rue, style }) =>
          `Medium shot inside a long quiet herbarium hall with tall wooden cabinets and glass cases. Standing at one case is ${rue}, looking at a detailed pen drawing of a tiny moss shoot mounted under the glass with a small printed label. Soft archive light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'rue', 'tess'],
    title: 'Extradition',
    premise:
      'The Regent’s government has filed an extradition request for Tess’s grandmother’s map, which it describes as a stolen state document. The map is not a person and cannot be extradited, but the request has been filed anyway, and the couch is docked at a station with an extradition treaty. Rue has read the treaty and found that it covers persons and property. Fen used to serve these requests. Tess has the map in her jacket.',
    steps: [
      {
        title: 'The Request',
        setup:
          'The station’s extradition officer is a mild man who has never handled a map before. The request says the map was stolen from the Regent’s archive forty years ago. Tess says her grandmother drew it, and that the Regent’s archive confiscated a copy. Fen recognises the request’s format. He wrote dozens like it, and he knows exactly where its weak points are.',
        options: [
          {
            label: 'Fen points out the weak point',
            outcome:
              'Fen points the officer to the request’s description of the item: one map, stolen. It gives no size, colour or title, because the Regent’s archive never had the original. Fen says a request that cannot describe its object cannot be served. The officer checks his manual and agrees.',
            ending: 0,
          },
          {
            label: 'Rue challenges the treaty’s wording',
            outcome:
              'Rue argues that the treaty covers property taken unlawfully, and that a person cannot steal what she drew herself. The officer asks for proof of authorship. Tess has it: her grandmother’s signature, worked into the coastline so small that only a magnifying glass shows it. The officer looks, and sees it.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot in a small plain station office with a metal desk and a filing cabinet. Standing at the desk is ${fen}, pointing with one finger at a line on a printed paper document held by a mild clerk in round spectacles. A thin scar shows under his right eyebrow. Cool office light. ${style}`,
      },
      {
        title: 'The Hearing',
        setup:
          'The Regent has sent a lawyer to the hearing, who argues that the map shows routes used by people the Regent considers fugitives, and that this makes it a security document whoever drew it. Tess goes very still. If the map is read into the court record, every route on it becomes public. Rue knows what a public record can do. They once erased a people with one.',
        options: [
          {
            label: 'Rue asks for the map to be held under seal',
            outcome:
              'Rue asks that the map be examined in private and held under seal, citing danger to life. The judge agrees. The map is looked at by the judge alone, behind a closed door, for an hour. The judge comes out and says only that it is a very beautiful map and that it belongs to its author’s family.',
            ending: 0,
          },
          {
            label: 'Tess refuses to produce it',
            outcome:
              'Tess refuses to produce the map at all. Rue argues that the court cannot compel a family heirloom to be shown for a request that names nothing specific. Fen testifies that requests like this one were used to find people, not maps. The judge declines to compel production.',
            ending: 1,
          },
        ],
        art: ({ rue, tess, style }) =>
          `Medium shot in a small wood-panelled courtroom. Standing at a lectern is ${rue}, one hand raised with a small wooden gavel. Seated beside them with one hand pressed flat over her jacket pocket is ${tess}. A lawyer in black sits at the opposite table. Warm courtroom light. ${style}`,
      },
      {
        title: 'The Ruling',
        setup:
          'The court rules against the Regent, and the Regent’s lawyer asks for one thing before he leaves: a copy of the map for the archive, so that the record is complete. Tess’s grandmother kept the original off every record for forty years. Fen says that requests like this come back, in other forms. Rue says that a court order can make sure they do not.',
        options: [
          {
            label: 'Ask the court to bar any further request',
            outcome:
              'Rue asks the court to bar any further extradition request for the map in this station’s jurisdiction, and the court does, by order. The Regent’s lawyer leaves without a copy. Tess folds the map back into her jacket and does not take it out again for a week.',
            ending: 0,
          },
          {
            label: 'Give the lawyer a blank sheet',
            outcome:
              'Tess hands the lawyer a sheet of paper. It is blank, except for her grandmother’s signature in the corner. She says this is the only part of the map that belongs in an archive. The lawyer takes it, after a moment. Fen walks him to the dock and his boots say CHECKPOINT all the way.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Medium shot on a grey station dock beside ${couch}. Standing on the dock is ${tess}, holding out a single sheet of white paper with a small signature in one corner to a lawyer in a black suit. Cool station light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HELD UNDER SEAL',
        text: 'The map belongs to the Helio family by court order and may not be requested again at that station, which Tess avoids anyway. Fen has written a short guide to the weak points in extradition requests and given it to three shelters. Rue keeps the order. The map is in Tess’s jacket, where it has always been.',
        art: ({ fen, rue, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${fen}, writing in a small notebook, and ${rue}, reading a printed court order with a red seal. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'A SIGNATURE FOR THE ARCHIVE',
        text: 'The Regent’s archive has one sheet of paper with a signature on it and nothing else, filed as the map. It is the most complete record of the map that will ever exist outside the family. Tess still has the original. Fen still has the request, which he keeps as an example of his old handwriting, and of a request he lost.',
        art: ({ tess, style }) =>
          `Close-up of an old hand-drawn paper map unfolded on a red velvet cushion, its coastlines in faded ink with one region left blank. Smoothing it flat with both hands is ${tess}, her silver goggles pushed up. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'mox', 'tess'],
    title: 'The Clue in the Armrest',
    premise:
      'A treasure hunt is under way across the Lantern Cluster, run by a charitable trust, with fifty clues hidden on fifty vessels and a prize of a new reactor for a children’s hospital ship. Clue thirty-one is hidden in the couch’s left armrest, and has been for six months without anyone noticing. Mox found it while looking for a dropped screw. Kivo, a courier, knows what it means to be carrying something you did not know you had. Tess knows the cluster better than anyone, and suspects she can solve the hunt in an afternoon.',
    steps: [
      {
        title: 'Clue Thirty-One',
        setup:
          'The clue is a brass capsule with a riddle inside: Where the blank star sleeps, the next one keeps. Tess goes pale. The blank star is the constellation she has never mapped. Somebody else knows about it. Mox would like to know whether solving the clue would mean saying where it is. Kivo is turning the capsule over in their fingers, and their wrists have begun to whistle.',
        options: [
          {
            label: 'Kivo traces who hid the clue',
            outcome:
              'Kivo reads the courier marks on the capsule and traces it to the trust’s clue-setter, an old navigator who once knew Tess’s grandmother. Kivo writes to her. She writes back that the blank star in the riddle is a metaphor, meaning nowhere, and that she is sorry for the fright.',
            ending: 0,
          },
          {
            label: 'Mox solves it without the map',
            outcome:
              'Mox points out that a riddle about a blank star might mean a place nobody has drawn, which is any uncharted point. It finds an uncharted buoy in the cluster, a public one, where clue thirty-two is waiting. Tess sits down, breathes, and thanks Mox.',
            ending: 1,
          },
        ],
        art: ({ mox, kivo, style }) =>
          `Close-up on the rolled armrest of a red velvet couch where a small seam has been opened, revealing a small brass capsule tucked inside the stuffing. Holding the capsule up is ${kivo}, turning it in thin fingers. Leaning in beside them is ${mox}, holding a tiny screw between two silver fingers. Warm lamp light. ${style}`,
      },
      {
        title: 'The Shortcut',
        setup:
          'Tess knows the cluster so well that she can guess where the last nineteen clues are. The couch could win the hunt in a day. Other vessels have been searching for months. One of them is a small family barge with three children aboard, who have found thirty clues by themselves. Mox has noticed that winning would take the hunt away from them.',
        options: [
          {
            label: 'Tess plays by the clues, one at a time',
            outcome:
              'Tess refuses to skip ahead and solves each clue in order, as the rules intend. It takes three weeks. The family barge is two clues behind the whole way. Mox keeps a scoreboard on the backrest, in its own handwriting, with both vessels on it.',
            ending: 0,
          },
          {
            label: 'Join forces with the barge',
            outcome:
              'Kivo hails the family barge and offers to hunt together, splitting nothing because the prize goes to the hospital either way. The children agree, suspicious. Tess teaches them to read the cluster. Mox teaches them to wink. They find the last clue together, a month later.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a brass lamp, with a long hand-drawn paper scoreboard pinned to the backrest. Standing on the cushion and studying a paper star chart is ${tess}, silver goggles pulled down. A small wooden barge with three waving children floats beyond the clear bubble. ${style}`,
      },
      {
        title: 'The Prize',
        setup:
          'The final clue leads to the trust’s office, where the reactor waits in a crate. Whoever arrives first presents it to the hospital ship. The trust would like a photograph of the winners for its newsletter. Kivo would rather not be photographed. Tess would rather not be in any newsletter. Mox has never been in a photograph it chose.',
        options: [
          {
            label: 'Mox presents the reactor and is photographed',
            outcome:
              'Mox presents the reactor to the hospital ship and stands for the photograph, with both eyelids open, by choice. It is the first photograph of itself it has agreed to. The newsletter prints it on the front. Mox keeps a copy and looks at it often, to see what it looks like when it decides.',
            ending: 0,
          },
          {
            label: 'Give the photograph to the children',
            outcome:
              'Kivo suggests the children from the barge present the reactor and stand for the photograph, since they found more clues alone than anyone. The trust agrees. The newsletter prints the three children holding the crate. Tess, Kivo and Mox are listed as assistants, which suits all three of them.',
            ending: 1,
          },
        ],
        art: ({ mox, couch, style }) =>
          `Medium shot on a station dock beside ${couch}. Standing beside a large wooden crate stamped with a red cross is ${mox}, both eyelids open, one silver hand resting on the crate. A photographer with a boxy camera on a tripod stands in front. Cool station light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CLUE THIRTY-ONE, SOLVED',
        text: 'The hospital ship has a new reactor, and the couch has a photograph of Mox in the trust’s newsletter, standing by choice. The clue-setter visits Tess when she can, and they talk about her grandmother. The scoreboard is still on the backrest. Kivo has resealed the armrest, with a courier’s stitch.',
        art: ({ kivo, style }) =>
          `Close-up of the rolled armrest of a red velvet couch with a neat new row of small even stitches closing a seam. Pulling the last stitch tight with a curved needle is ${kivo}, their pale teal feather crest lit by the lamp. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'LISTED AS ASSISTANTS',
        text: 'The trust’s newsletter shows three children with a reactor crate, and in small print below, three assistants. The children send the couch a letter after every voyage. Tess taught them to read the cluster, and Mox taught them to wink, and Kivo taught them that some things you carry are not yours to open.',
        art: ({ tess, mox, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${tess}, reading a handwritten paper letter covered in children’s drawings, and ${mox}, holding a printed newsletter page. Black space and stars beyond the clear bubble. ${style}`,
      },
    ],
  },
]
