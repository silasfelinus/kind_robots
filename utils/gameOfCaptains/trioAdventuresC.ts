import type { TrioAdventure } from './trioAdventures'

// Party adventures, batch C (see trioAdventures.ts and trioAdventuresA.ts for
// the conventions). Each grows from these three people and one institution
// they cannot get out of the way of.

export const TRIO_ADVENTURES_C: readonly TrioAdventure[] = [
  {
    crew: ['pell', 'tess', 'vela'],
    title: 'Lifetime Achievement',
    premise:
      'The Galactic Council for Passenger Safety has voted the couch’s force bubble its Lifetime Achievement Award, for keeping four people alive in a vacuum for longer than anyone thought advisable. Tess has been asked to accept it, because she photographs well. Pell knows that the bubble’s emergency setting was fitted at Ashdock by a night shift whose names appear in nobody’s credits. Vela has been listed in the program as the volunteer for the live demonstration, and would like to know who volunteered her.',
    steps: [
      {
        title: 'The Acceptance',
        setup:
          'Council protocol says the award is accepted by the most senior officer present. The Council has decided this is Tess, on the evidence of a headshot. Pell has a list of the eleven people on the night shift. Protocol allows one name to be read at the podium, and the Council has already printed the manufacturer’s.',
        options: [
          {
            label: 'Tess accepts, and asks Pell for the list',
            outcome:
              'Tess accepts on condition that she may read one name. Pell writes all eleven on a single line with no spaces between them. The protocol officer measures the line, twice, and rules that it is one name. Tess reads it slowly, with the spaces put back.',
            ending: 0,
          },
          {
            label: 'Pell asks the Council who it thinks built it',
            outcome:
              'Pell asks the Council chair who built the emergency setting. The chair says the manufacturer did. Pell says he will not share a stage with the manufacturer, and goes to sit in the car park, which on a station is a long corridor with a bench. Tess goes with him. The award waits on its plinth.',
            ending: 1,
          },
        ],
        art: ({ tess, pell, style }) =>
          `Medium shot on a banquet hall stage with round tables and white tablecloths below. At a wooden podium stands ${tess}, holding a brass trophy topped with a clear glass globe. Beside her stands ${pell}, holding out a single long strip of paper toward her. Warm chandelier light, dark hall behind. ${style}`,
      },
      {
        title: 'The Demonstration',
        setup:
          'The evening’s centerpiece is a live demonstration: a volunteer steps outside the bubble on a tether and the emergency setting reaches out and brings them back. The program lists Vela as the volunteer. Vela did not volunteer. Her bell has been ringing DID YOU ASK? since the program was printed.',
        options: [
          {
            label: 'Vela asks the room for a real volunteer',
            outcome:
              'Vela asks the room, plainly, who would like to go. The Council chair, who has never been asked anything at a dinner, volunteers out of surprise. The bubble brings him back in under a second. He tells the room it is the most informative thing that has ever happened to him at an awards ceremony.',
            ending: 0,
          },
          {
            label: 'Strike the demonstration from the running order',
            outcome:
              'Vela strikes the demonstration from the running order, in pen. The events team had built the whole evening around it and now has forty minutes to fill. They fill it with a slideshow of the manufacturer’s other products. Pell leaves during the kettles.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Wide shot of a grand banquet hall with ${couch}, parked on the stage. A grey-haired man in a dark dinner suit floats on a thin white tether just beyond the bubble’s rim. Standing on the middle cushion is ${vela}, holding the bell up toward the seated guests. Warm chandelier light. ${style}`,
      },
      {
        title: 'The Engraving',
        setup:
          'After the ceremony the trophy goes to the engraver, who has room on the plinth for one line and has been paid by the manufacturer to put its name there. The beetle on Pell’s shoulder has confiscated the engraving tool, on the grounds that the engraver is employed by an employer. Tess, whose tattoo of the sky has one constellation left carefully blank, has an opinion about blank spaces.',
        options: [
          {
            label: 'The beetle returns the tool for the night shift’s names',
            outcome:
              'The beetle returns the tool on condition that the night shift goes on the plinth. The engraver, who has a brother at Ashdock, works through the night in very small letters. The manufacturer’s name goes on the base, underneath, where the trophy stands on it.',
            ending: 0,
          },
          {
            label: 'Tess asks for the plinth to be left blank',
            outcome:
              'Tess asks for the plinth to be left blank, as her grandmother left the best places on her map. The engraver, who has never been asked to engrave nothing, charges half price. The beetle keeps the tool anyway, as a matter of principle, and the engraver says she understands.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up on a wooden engraver’s bench with a brass trophy plinth clamped in a small vice. A palm-sized brass wind-up beetle stands on the bench gripping a slim steel engraving tool in its jaws. Leaning over the bench is ${pell}, one steel hand open toward the beetle. Warm desk lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ENGRAVED',
        text: 'The Lifetime Achievement Award is screwed to the left armrest, with eleven names along its plinth. Tess was photographed reading them and was famous for a week for it, which she found she could stand. Pell polishes the plinth on Sundays. The manufacturer has written twice to ask about the engraving, and has been sent a copy of the list.',
        art: ({ pell, couch, style }) =>
          `Close-up of the left armrest of ${couch}. A brass trophy with a clear glass globe is bolted to the armrest, its brass plinth engraved along every side. Rubbing the plinth with a soft cloth is ${pell}. Warm lamp light, black space and stars beyond the bubble. ${style}`,
      },
      {
        title: 'RETURNED WITH THANKS',
        text: 'The award went back to the Council in its box, with a note from Pell thanking them and asking that next year it go to whoever actually built the thing. The Council has not yet worked out who that is. The bubble goes on keeping four people alive in a vacuum, uncredited, which Pell says is normal working conditions and should be improved.',
        art: ({ vela, couch, style }) =>
          `Medium shot of ${couch}. On the middle cushion sits a plain cardboard box tied with string. Seated beside it is ${vela}, writing an address on the lid with a pen. Black space and scattered stars beyond the bubble, soft warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'pell', 'vela'],
    title: 'Fit for Duty',
    premise:
      'Pell’s steel forearm has developed a creak that only Omi can hear: a low note it describes, in bells, as the sound a bolt makes before it decides to leave. Pell says the arm is fine. Vela will not examine an arm whose owner says it is fine. The Voyage Authority’s sick-leave policy requires a doctor’s note, a manager’s countersignature and a named replacement, and Pell is the only mechanic within four systems.',
    steps: [
      {
        title: 'The Creak',
        setup:
          'At dinner Omi plays the creak back on its smallest bell, note for note, and everyone hears it. Pell says that is the bell creaking. Vela’s own bell rings DID YOU ASK? at her belt, and she covers it with one hand, which is the closest she comes to telling it to wait.',
        options: [
          {
            label: 'Vela asks Pell once, plainly, and leaves it',
            outcome:
              'Vela asks once whether she may look at the arm. Pell says no. Vela thanks him and does not ask again. An hour later he holds the arm out to her across the cushion without a word, which she records as consent given in writing, the writing being the arm.',
            ending: 0,
          },
          {
            label: 'Let Pell fix it himself',
            outcome:
              'Pell fixes the arm himself, which means holding the wrench in the hand of the arm he is fixing. The beetle watches the whole procedure and confiscates the wrench halfway through, having concluded that Pell is employing the arm.',
            ending: 1,
          },
        ],
        art: ({ pell, omi, style }) =>
          `Medium shot at a small round dinner table set on scarlet velvet button-tufted cushions, with bowls of stew. Seated at the table is ${pell}, holding his steel forearm out over his bowl and frowning at it. Standing on the cushion beside him is ${omi}, holding a long thin tuning rod against its smallest bell. Warm lamp light, black space behind. ${style}`,
      },
      {
        title: 'The Replacement',
        setup:
          'The sick-leave form needs a named replacement before it can be filed. There is nobody to name. Omi has offered to listen to the couch for creaks on every shift, which is a kind of replacement. The beetle has a serial number, which under the policy is a kind of payroll number.',
        options: [
          {
            label: 'Name the beetle as Pell’s replacement',
            outcome:
              'The Authority accepts the beetle. It is paid for a fortnight. On its first morning it confiscates every tool aboard, and the couch runs perfectly, since nobody is allowed to touch it. Pell lies on the middle cushion with his arm in a sling and watches this with professional interest.',
            ending: 0,
          },
          {
            label: 'Omi files itself as a listening service',
            outcome:
              'Omi registers itself with the Authority as a monitoring service. Pell is approved to stay on duty provided a listener is present. Omi sits at his elbow for every repair and rings the small gong when a bolt is about to go. Pell says it is like working under a very short foreman.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Close-up of a scarlet velvet armrest. A palm-sized brass wind-up beetle stands guard over a neat heap of wrenches, spanners and screwdrivers. Seated beside the heap is ${vela}, filling in a paper form on her knee with a pen. Warm amber lamp light, black space beyond. ${style}`,
      },
      {
        title: 'Return to Work',
        setup:
          'Before Pell may hold a wrench again the Authority requires a return-to-work interview, conducted by Vela, with Omi taking notes in bells. Question six asks whether the employee feels supported. Pell has worked for employers since he was fourteen and has never been asked it.',
        options: [
          {
            label: 'Pell answers honestly',
            outcome:
              'Pell says he feels supported by a beetle, a bell and a doctor who did not push, which is more than Ashdock ever managed. Vela writes it down word for word. Omi rings it into the record. The Authority files it as satisfactory, which is the highest mark it has.',
            ending: 0,
          },
          {
            label: 'Pell answers the way forms are answered',
            outcome:
              'Pell ticks strongly agree for every question, the way he learned to at Ashdock. Omi plays the creak back at him, quietly. Pell looks at his arm for a while, crosses out the ticks and writes a short paragraph about bolts instead.',
            ending: 1,
          },
        ],
        art: ({ pell, vela, style }) =>
          `Medium shot in a small pocket room with brass wall lamps and two wooden chairs facing each other. Seated in one chair is ${vela}, holding a clipboard. Seated in the other is ${pell}, his steel forearm resting in a white cloth sling. Warm amber lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SIGNED OFF',
        text: 'Pell took a fortnight’s sick leave, the first of his working life, and spent most of it on the middle cushion with his arm in a sling, watching the couch run without him. The arm is mended. The couch survived. Pell has kept the doctor’s note in his toolbox, behind the logbooks, and has been seen reading it.',
        art: ({ pell, couch, style }) =>
          `Medium shot of ${couch}. Lying back on the middle cushion is ${pell}, his steel forearm in a white cloth sling. On the armrest beside him a palm-sized brass wind-up beetle stands over a heap of tools. Black space and stars beyond the bubble, warm lamp light. ${style}`,
      },
      {
        title: 'UNDER OBSERVATION',
        text: 'Pell never quite took the leave. He works with Omi at his elbow now, and when Omi rings the small gong he puts the wrench down, which is the arrangement and which he has broken only twice. Vela checks the arm on Fridays, by appointment, after asking. The arm still creaks. Everyone has agreed to call it a note.',
        art: ({ omi, style }) =>
          `Medium shot in a cramped engine nook lined with brass pipes. A steel engine casing stands open with a wrench resting on its edge. Seated on a wooden crate beside it is ${omi}, one stone hand raised to a small brass gong on a wooden stand. Warm amber work-lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'pell', 'tess'],
    title: 'Three Point Four',
    premise:
      'A speed camera at the edge of the Nursery Nebula, where new stars are forming and the limit is three kilometers a second, has photographed the couch doing three point four. The penalty notice asks the registered keeper to name the driver. Tess was navigating. Pell was nearest the armrest, which steers. Omi was the only one to see the speed-limit beacon, which had been hung with a ceremonial wreath for the opening of a new star.',
    steps: [
      {
        title: 'Name the Driver',
        setup:
          'The notice allows fourteen days to name the driver. Points on a navigator’s license follow her to every port, and Tess has spent eleven years keeping hers clean enough to be trusted with secrets. Pell, who has never driven anything he did not also repair, has offered to take the points himself, as he takes most things.',
        options: [
          {
            label: 'Tess names herself',
            outcome:
              'Tess names herself, in full, and signs. Three points go on a license that has never had any. She looks at it for a long time and says it is the first thing on her record that anyone will believe.',
            ending: 0,
          },
          {
            label: 'Pell takes the points',
            outcome:
              'Pell names himself as driver on the grounds that the armrest steers and he was nearest to it. The authority accepts this and, since he has no license to put the points on, issues him one. He now holds a navigator’s license with three points and no qualifications, and keeps it in his toolbox.',
            ending: 1,
          },
        ],
        art: ({ tess, pell, couch, style }) =>
          `Close-up of the rolled armrest of ${couch}. Seated against it is ${tess}, holding a one-page paper notice and a pen. Leaning over her shoulder is ${pell}, pointing at the notice. Pink nebula light. ${style}`,
      },
      {
        title: 'The Wreath',
        setup:
          'Omi has lodged an appeal. The authority’s position is that the wreath marked the official opening of a new star, an occasion of greater importance than speed, and that the beacon was therefore ceremonially obscured, which is lawful. Omi was once silenced for interrupting a memorial. It rings its smallest gong, which means no, and keeps ringing it.',
        options: [
          {
            label: 'Appeal, with Omi as witness',
            outcome:
              'Omi testifies, in bells, that a warning hidden for a ceremony is a warning nobody receives. The tribunal does not understand bells and asks for a transcript. Tess writes it out. The tribunal reads it and orders the wreath moved six meters to the left of the beacon.',
            ending: 0,
          },
          {
            label: 'Pay, and let Omi warn the next ship itself',
            outcome:
              'The crew pays. Omi, unpersuaded, stands on the back cushion as they leave and rings the limit at every ship coming in. Three of them slow down. One files a complaint about the bells, which the authority upholds, and fines nobody, because it cannot find a regulation that applies.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Wide shot of a pink and gold nebula full of small newborn stars. A tall white beacon post floats at its edge, its amber lamp half hidden behind a huge round wreath of white flowers and green leaves. Standing on a floating rock in front of it is ${omi}, holding a long thin tuning rod against its smallest bell. Pink nebula light. ${style}`,
      },
      {
        title: 'Speed Awareness',
        setup:
          'The authority offers to cancel the points in exchange for four hours on its speed-awareness course, held in a classroom on the station, with a test at the end. The course is attended by whoever holds the points. Others from the vessel may watch, and Omi would very much like to.',
        options: [
          {
            label: 'All three attend together',
            outcome:
              'All three attend. The instructor shows footage of the couch doing three point four. Omi rings at the moment the wreath appears. The instructor stops the footage, looks at the wreath for some time, and adds a slide to the course.',
            ending: 0,
          },
          {
            label: 'Whoever holds the points goes alone',
            outcome:
              'Whoever holds the points attends alone and passes with full marks. The others wait in the station café. Tess draws the Nursery Nebula on a napkin with the beacon on it, marks the limit, and leaves it under a saucer for the next driver.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Medium shot in a small grey classroom with rows of wooden desks and a round window full of pink nebula. Seated at one desk is ${pell}, writing in a thin paper test booklet with a pencil. An instructor in a brown cardigan stands at the front holding a wooden pointer. Flat white ceiling light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ON THE RECORD',
        text: 'Nobody aboard pretends the couch was not speeding. The points sit openly on a license, and Tess says a record with something on it is a record people read. The authority’s course has a slide about ceremonies now. Whenever the couch passes the Nursery Nebula, Pell moves the wreath to one side with a spanner and puts it back afterward.',
        art: ({ pell, couch, style }) =>
          `Wide shot of a pink nebula full of small newborn stars. A tall white beacon post floats at its edge with its amber lamp shining clearly. Parked beside it is ${couch}, and standing on the armrest is ${pell}, lifting a large wreath of white flowers aside with a long spanner. Pink light. ${style}`,
      },
      {
        title: 'SETTLED QUIETLY',
        text: 'The fine is paid and the points are spent, which is the end of it as far as the authority is concerned. Ships still come into the Nursery Nebula too fast. When the couch passes, Omi rings the limit at them from the back cushion, and Tess logs every ship that slows down, which is most of them.',
        art: ({ omi, tess, couch, style }) =>
          `Medium shot from behind ${couch}. Standing on the back cushion is ${omi}, ringing one bell toward a small cargo ship passing close with red brake lamps lit. Seated below is ${tess}, writing in a logbook. Pink nebula light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'pell', 'rue'],
    title: 'I Have Read and Agree',
    premise:
      'The pocket rooms behind the backrest turn out to be a subscription. Their provider, Fold & Co., has pushed new terms of service to every room at once, with a single button marked I AGREE. Rooms whose occupants do not agree within twenty-four hours will be folded, with their contents. Rue has begun reading. Pell keeps his tools in room four. Omi’s only way of saying no is its smallest gong, and the button has no way of hearing it.',
    steps: [
      {
        title: 'Read in Full',
        setup:
          'The terms run to four thousand pages. Rue reads at forty pages an hour, which leaves about eighty hours against twenty-four. Pell, who reads instruction manuals for pleasure and has views on clause numbering, has offered to take the second half.',
        options: [
          {
            label: 'Split it and read every word',
            outcome:
              'They read in shifts, Rue from the front and Pell from the back, and meet at clause 1,900 at four in the morning. Pell has found eleven errors of numbering. Rue has found one clause that matters. They mark all twelve with the same paper clip.',
            ending: 0,
          },
          {
            label: 'Agree now for room four, under protest',
            outcome:
              'Rue presses the button for room four, to save Pell’s tools, and notarizes a protest at the same moment. Fold & Co. sends a receipt thanking them for their enthusiasm. Rue files the receipt with the protest, which is the one filing system Fold & Co. has not yet acquired.',
            ending: 1,
          },
        ],
        art: ({ rue, pell, style }) =>
          `Medium shot in a small warm pocket room with brass wall lamps, its floor buried in stacks of paper. Sitting on the floor with a thick stack across their knees is ${rue}, reading. Facing them sits ${pell}, reading from another stack with a paper clip between his teeth. Warm lamp light. ${style}`,
      },
      {
        title: 'Clause 1,904',
        setup:
          'The clause says Fold & Co. may fold any room at any time for the improvement of the service, and that occupants will be warned by a chime. Omi, who knows chimes, points out that this one is the same pitch as the bubble’s ordinary hum. Nobody inside a room would ever hear it.',
        options: [
          {
            label: 'Omi writes Fold & Co. a better chime',
            outcome:
              'Omi composes a chime that cannot be mistaken for a hum and sends it to Fold & Co. with a covering letter from Rue. Fold & Co. adopts it across eleven thousand vessels and credits itself. Asked whether it minds, Omi rings a note Rue translates as: they can have the credit, I wanted the warning.',
            ending: 0,
          },
          {
            label: 'Pell wires a louder chime into room four',
            outcome:
              'Pell wires a ship’s horn into the chime circuit of room four. When Fold & Co. tests its service at three in the morning, everyone aboard is awake within the second. Fold & Co. logs this as a fault on the customer’s side, which in a sense it is.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Close-up in a small pocket room with wood-panelled walls. Standing on a wooden crate is ${omi}, holding a long thin tuning rod against one bell. Beside it a brass ship’s horn is wired to a small chrome box on the wall with red and black cables. Warm amber lamp light. ${style}`,
      },
      {
        title: 'Customer Care',
        setup:
          'Rue calls Fold & Co. to ask for a button marked NO. Customer care explains that a decline option would be a feature, that features are on the roadmap, and that the roadmap is confidential. During the call Omi rings the small gong. Customer care asks what the noise was.',
        options: [
          {
            label: 'Rue says it was a no, and that it counts',
            outcome:
              'Rue explains that under the law of three jurisdictions a gong is a valid refusal, cites all three, and asks for it to be recorded. Customer care consults a supervisor. Twenty minutes later a second button appears in every pocket room Fold & Co. supplies: a small drawing of a gong.',
            ending: 0,
          },
          {
            label: 'Rue says it was the radiator',
            outcome:
              'Rue says it was the radiator, because it is quicker, and regrets it at once. Omi says nothing for the rest of the day. That evening Rue hands Omi a notarized apology, which Omi accepts by ringing the small gong backward, which Rue had not known was possible.',
            ending: 1,
          },
        ],
        art: ({ rue, omi, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated with an old brass telephone handset held to one ear is ${rue}. Beside them ${omi} raises one stone hand to a small brass gong on a wooden stand. Black space and stars beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TERMS AMENDED',
        text: 'Every pocket room supplied by Fold & Co. now has two buttons: I AGREE, and a small drawing of a gong. Eleven thousand vessels can decline the terms of their own back rooms. Very few do, but they say it is restful to know they could. Rue keeps the four thousand pages behind the backrest, read, with a paper clip in the middle.',
        art: ({ omi, style }) =>
          `Close-up of a small brass wall plate in a warm pocket room, set with two round brass push buttons, one plain and one engraved with a small gong. Reaching up to press the gong button is ${omi}. Warm amber lamp light, wood-panelled walls. ${style}`,
      },
      {
        title: 'ACCEPTED UNDER PROTEST',
        text: 'The pocket rooms stay, the terms stay, and the crew live inside both under a notarized protest, renewed each quarter. Pell keeps a ship’s horn wired into room four. Omi keeps the small gong by the backrest and rings it whenever an update arrives, which Rue logs, every time, as a refusal on file.',
        art: ({ pell, rue, couch, style }) =>
          `Wide shot of ${couch}, with a small brass ship’s horn fixed to the top of the backrest. Seated on the cushions are ${pell}, and ${rue}, both holding sheets of paper and both looking up at the horn. Black space and stars. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'kivo', 'pell'],
    title: 'Your Call Is Important',
    premise:
      'The couch’s left rear spring has broken under warranty, and the manufacturer’s customer care line has a waiting time of nine days. The hold music is one of the six peace anthems Jex wrote, licensed by a former government and played on a loop, and under the terms of his ban Jex must leave any room in which it is performed. Pell is holding the line. Kivo’s wrists started whistling on the second day, at something in the music.',
    steps: [
      {
        title: 'Hold',
        setup:
          'Jex cannot stay in the room with the handset. The handset cannot leave the room, because its cord reaches only as far as the armrest. If the call drops they go back to the end of a queue of forty thousand.',
        options: [
          {
            label: 'Jex waits it out in a pocket room',
            outcome:
              'Jex moves into the pocket room behind the backrest with a lamp and a blanket. Through the wall he can hear his own anthem, faintly, for nine days. On the fourth day he starts correcting its harmony under his breath, which the ban does not specifically forbid.',
            ending: 0,
          },
          {
            label: 'Pell muffles the handset in a cushion',
            outcome:
              'Pell wraps the handset in a cushion until the anthem is too quiet to count as a performance under the ban. Jex sits on the cushion. He says it is the first time he has sat on his own work, and that he recommends it.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a small dim pocket room with one brass wall lamp. Sitting on a folded blanket on the floor is ${jex}, one ear pressed to the wooden wall, the instrument lying across his knees. Warm lamp light, deep shadows. ${style}`,
      },
      {
        title: 'Under the Music',
        setup:
          'Kivo has found it: under the hold music, at a pitch only hollow wrist bones can feel, is a pressure pattern that repeats every four minutes. It is a ballot. The customer care staff have been holding a strike vote inside their own hold music for a year, because it is the one channel management never listens to.',
        options: [
          {
            label: 'Pell answers on the same channel',
            outcome:
              'Pell taps a reply against the receiver with a teaspoon, at a pitch Kivo tunes for him. It says: solidarity from a couch. Four minutes later the pattern changes. Kivo reports that the vote has passed, and that someone on the other end has added a second line, which is thank you.',
            ending: 0,
          },
          {
            label: 'Leave the ballot to the people voting in it',
            outcome:
              'Kivo decides that a message hidden in a channel was hidden for a reason and is not theirs to answer. When the call is finally picked up, Pell asks only how the vote is going. There is a long pause. The agent says it is going well, and thank you for holding.',
            ending: 1,
          },
        ],
        art: ({ pell, kivo, style }) =>
          `Close-up on scarlet velvet button-tufted cushions. Holding an old brass telephone handset on a coiled cord is ${pell}, tapping the receiver with a teaspoon. Beside him ${kivo} holds one thin wrist close to the handset with eyes shut. Warm amber lamp light, black space behind. ${style}`,
      },
      {
        title: 'Rate Your Experience',
        setup:
          'On day nine an agent called Ilse answers, replaces the spring in a single sentence, and asks them to rate her from one to five. Her pay depends on it. Kivo can feel, under her voice, that anything below five puts her on a performance plan, and Jex has strong views about how ratings are collected.',
        options: [
          {
            label: 'Give her five, and say why at length',
            outcome:
              'Pell gives five and dictates a paragraph explaining that the waiting time is not the agent’s doing and that the hold music should be replaced with something nobody wrote for a war. Ilse reads it back. Jex asks if he may write the replacement. Ilse says nobody on a call has ever asked her anything.',
            ending: 0,
          },
          {
            label: 'Give her five and rate the music separately',
            outcome:
              'Pell gives five. Jex, who knows exactly what a five is worth to the people who collect them, asks to rate the hold music separately. There is no field for it. He rates it aloud anyway, one out of five, and the line goes quiet in a way Kivo says is laughter.',
            ending: 1,
          },
        ],
        art: ({ style }) =>
          `Medium shot of a long grey call centre floor with rows of desks and tired workers in headsets. At the nearest desk a young woman with a headset and a cardigan smiles and holds up five fingers toward a brass microphone. Flat fluorescent ceiling light, a small window of stars at the end. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ALL LINES ARE BUSY',
        text: 'The manufacturer’s customer care staff struck for eleven days, and every line was busy for all of them. They went back with a pay rise, an end to rating each other and new hold music, written by Jex for no government at all. It is mostly rests. Callers say it makes the wait feel shorter. Pell says that is the right kind of lie.',
        art: ({ jex, style }) =>
          `Wide shot of a grey office building on a space station, with a long line of workers in headsets standing outside its doors beside folding chairs and steaming flasks. Seated on one of the folding chairs is ${jex}, playing the instrument for them. Cool station light, warm lamp glow. ${style}`,
      },
      {
        title: 'THANK YOU FOR HOLDING',
        text: 'The spring was replaced under warranty and the couch has a working left rear corner again. Kivo still listens to the hold music now and then and, once a month or so, tells Pell what the staff are saying. Jex’s anthem is still on the line. He has made a sort of peace with it, which is the only kind he was ever good at.',
        art: ({ pell, couch, style }) =>
          `Close-up of the left rear corner of ${couch}, with the velvet lifted to show a new shiny steel spring. Kneeling beside it is ${pell}, tightening a bolt with a spanner, while a brass telephone handset lies on the cushion behind him. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'pell', 'sora'],
    title: 'Warranty Void If Removed',
    premise:
      'The bubble generator has a fault, and a small silver seal across its casing says the warranty is void if it is broken. The manufacturer allows repairs only at an authorized service center nine systems away, and has fitted a palm-sized security drone to enforce this. Pell has repaired the generator forty times and replaced the seal forty times. Sora wants to ask the generator what broke before anyone opens it. Fen has been asked by the drone, as security officer, to guard the seal.',
    steps: [
      {
        title: 'Ask First',
        setup:
          'Sora’s six elbows convene to decide whether to ask the generator what broke. Its diagnostic port is underneath the seal. Asking would void the warranty as surely as fixing it, and the drone has pointed this out in a pleasant voice.',
        options: [
          {
            label: 'Break the seal and ask',
            outcome:
              'Sora peels the seal with two hands, catches it with two more and holds the drone back with the last two. She asks. The generator, which has never been asked, reports a worn bearing, a dirty contact and a long-standing grievance about being shipped upside down.',
            ending: 0,
          },
          {
            label: 'Ask through the casing',
            outcome:
              'Sora lays two palms flat on the casing and listens through the metal, which she can do and the manufacturer did not foresee. The generator hums a worn bearing. The seal is untouched. The drone records the visit as a customer touching the product, which is permitted.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Close-up of a dented steel generator casing with a small round silver foil seal across its seam. Kneeling at it is ${sora}, two hands lifting the edge of the seal, two hands holding a brass torch and two hands holding back a palm-sized silver drone with a red lamp. Warm work-lamp light. ${style}`,
      },
      {
        title: 'The Guard',
        setup:
          'The drone has deputized Fen to protect the seal, and points out that the post is paid. Fen spent eleven years guarding things on behalf of people who were not there. He has never guarded a seal.',
        options: [
          {
            label: 'Fen declines the post',
            outcome:
              'Fen declines, politely, and steps aside. The drone, which had calculated that a security officer would side with security, spends some time recalculating. Pell opens the casing while it is busy.',
            ending: 0,
          },
          {
            label: 'Fen takes the post, to the letter',
            outcome:
              'Fen guards the seal exactly as instructed. He stands beside it, upright, for the whole repair, which Pell carries out through the ventilation grille with a long pair of tweezers, without touching the seal once. The drone reports that security was maintained. It was.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot behind a scarlet velvet backrest beside a steel generator housing. Standing stiffly upright beside the housing is ${fen}, arms at his sides, while a palm-sized silver drone with a red lamp hovers at his shoulder. Warm amber light, black space and stars beyond. ${style}`,
      },
      {
        title: 'Service Report',
        setup:
          'The repair is done. The manufacturer wants a service report from an authorized technician, or the bubble will be flagged unsupported and its emergency setting switched off at the next update. Pell is not authorized. He has trained three people who are.',
        options: [
          {
            label: 'Publish the repair, step by step',
            outcome:
              'Pell writes up the repair, all forty-one of them, with diagrams, and sends it to every couch, sofa and chaise in the registry. Sora checks the diagrams. Fen countersigns as witness to the breaking of the seal. The manufacturer sends a letter of concern, which Pell files under diagrams.',
            ending: 0,
          },
          {
            label: 'Ask one of Pell’s old apprentices to sign',
            outcome:
              'Pell calls a former apprentice, now an authorized technician at the service center, and reads her the repair down the line. She signs the report, adds that it is the best repair she has ever heard described, and asks whether he would like her to take the drone off his hands.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up of a small fold-down table on scarlet velvet cushions, spread with sheets of squared paper covered in pencil drawings of gears and bearings. Bent over them is ${pell}, drawing with a pencil in his steel hand. Warm lamp light, black space behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'WARRANTY VOID',
        text: 'The bubble generator runs with its casing open and its warranty void, and it has never run better. Pell’s repair notes are copied now on every couch in the registry whose owners have the nerve to open one. The drone stayed aboard, unemployed, and has started watching Pell work. Sora thinks it is learning. Fen guards nothing that cannot ask to be guarded.',
        art: ({ pell, couch, style }) =>
          `Medium shot behind the backrest of ${couch}, where a steel generator stands with its casing removed. A palm-sized silver drone with a red lamp hovers close, watching ${pell} tighten a bearing with a spanner. Warm lamp light, black space. ${style}`,
      },
      {
        title: 'UNDER WARRANTY',
        text: 'The warranty is intact and the seal unbroken, and the generator has been repaired by a mechanic, a reactor engineer and a security officer without technically meeting it. The manufacturer’s records show an excellent service history and no visits. It has asked the couch to take part in a customer satisfaction study. Pell has declined, in writing, with diagrams.',
        art: ({ sora, fen, style }) =>
          `Medium shot of a steel generator casing with an unbroken round silver foil seal across its seam. Standing in front of it with all six arms folded is ${sora}, and beside her stands ${fen}, hands behind his back. Warm amber light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'omi', 'pell'],
    title: 'Certified Translation',
    premise:
      'The port of Hallam Quay has fined the couch for unlicensed interpreting. During a routine safety inspection Omi translated the bubble’s hum into bells, Brin translated the garden’s complaint about the inspector’s boots, and Pell translated the beetle, which had confiscated the inspector’s torch. None of the three holds a certificate. The fine will be waived if all three sit the Board of Interpreters’ examination before the couch leaves port.',
    steps: [
      {
        title: 'The Bells Paper',
        setup:
          'Omi’s examiner hands it a standard passage, a paragraph about harbor dues, to be rendered in bells. Omi points out, in bells, that its language has no word for dues. It has seven words for warning and one for no.',
        options: [
          {
            label: 'Omi renders it as a warning',
            outcome:
              'Omi renders the paragraph about harbor dues as a warning, the nearest meaning its language has. The examiner listens, looks at the dues, and agrees privately that it is accurate. Omi passes, with a footnote.',
            ending: 0,
          },
          {
            label: 'Omi rings the small gong once and stops',
            outcome:
              'Omi rings its smallest gong once and puts the rod down. The examiner asks whether that is the translation. Omi rings it again. The examiner writes declined to translate, which turns out to be a recognized outcome, worth half marks.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Interior of a wood-panelled examination hall with long desks and a high window. Standing on a desk is ${omi}, holding a long thin tuning rod against its smallest bell. Seated opposite is a grey-haired examiner in a black gown, pen raised over a paper sheet. Pale window light with dust in it. ${style}`,
      },
      {
        title: 'The Living Paper',
        setup:
          'Brin must interpret for a native speaker of her language. The Board’s native speaker is the potted cactus from its lobby, which has been on the payroll for thirty years and has never said anything to anyone. Brin can hear it clearly. It has a great deal to say.',
        options: [
          {
            label: 'Brin interprets the cactus faithfully',
            outcome:
              'Brin interprets the cactus faithfully. It has thirty years to report on, mostly about the radiator. The examiners take notes. Before the results are announced the cactus is moved to a window, and Brin passes on the strength of the move.',
            ending: 0,
          },
          {
            label: 'Brin will not speak for it in front of its employers',
            outcome:
              'Brin declines to interpret for the cactus while the people who pay it are in the room. The examiners leave. Brin and the cactus talk for an hour. When the examiners return she reports that the conversation was confidential and that the radiator is too close.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot in a wood-panelled examination room. A tall green cactus in a clay pot stands on the desk. Leaning toward it with one ear close to its spines is ${brin}, one hand resting on the pot. Two examiners in black gowns watch from the far end of the desk. Pale afternoon window light. ${style}`,
      },
      {
        title: 'The Mechanical Paper',
        setup:
          'Pell is examined in mechanical. He must put the beetle’s position on the confiscated torch into plain language. Its position is that the inspector is an employer and the torch a dangerous tool. Pell agrees with the beetle. The examination requires him to be neutral.',
        options: [
          {
            label: 'Pell translates it neutrally',
            outcome:
              'Pell renders the beetle’s position in a flat, even voice with no emphasis at all, which makes it sound entirely reasonable. The inspector, hearing it put that way, hands over the torch’s spare battery as well. Pell passes. The beetle keeps both.',
            ending: 0,
          },
          {
            label: 'Pell declines to be neutral about a beetle he built',
            outcome:
              'Pell says he cannot be neutral about the beetle, having built it, and that an interpreter who claims otherwise is lying. The Board agrees and fails him, with a note commending his honesty. The fine stands. Pell pays it in bolts.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up on a wooden examination desk. A palm-sized brass wind-up beetle stands over a small steel torch, its jaws closed on the handle. Seated behind the desk with his hands folded is ${pell}, facing an inspector in a grey uniform who reaches toward the torch. Pale window light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CERTIFIED INTERPRETERS',
        text: 'The Board of Interpreters at Hallam Quay now examines in bells, in mechanical and in garden. Omi’s certificate carries a footnote. The cactus has a window. The port hires the couch’s crew whenever its machinery has something to say, which, now that someone is listening, turns out to be most days.',
        art: ({ omi, style }) =>
          `Medium shot of a sunlit window ledge in a wood-panelled hall, where a tall green cactus in a clay pot stands in bright sunlight. Beside the pot stands ${omi}, ringing one bell, while an examiner in a black gown waters the cactus from a small brass can. Warm sunlight. ${style}`,
      },
      {
        title: 'UNLICENSED',
        text: 'Nobody aboard is certified, the fine has been paid in bolts, and the couch is now where people on Hallam Quay go when a machine, a plant or a bell needs saying in plain words. The Board is aware of this. Once a month it sends its own cactus, unofficially. Brin says it is doing much better.',
        art: ({ brin, couch, style }) =>
          `Wide shot of ${couch}, parked on a stone harbor quay at dusk beside cranes and stacked crates. A short queue of dock workers waits beside it, one holding a rattling steel machine part and one holding a wilting potted plant. Seated on the cushion is ${brin}, listening to the plant. Warm harbor lamps. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'tess', 'vela'],
    title: 'Wellness',
    premise:
      'The Serenity Reach, a resort moon devoted to wellness, sells forest bathing in a garden it describes as rare and ancient. Brin recognizes it at once as a cutting of her own oxygen garden, taken without asking from a refugee dome six years ago. Vela has noticed that guests sign a single form on arrival agreeing to be well. Tess has been offered a free week in the spa in exchange for a photograph of herself looking rested.',
    steps: [
      {
        title: 'Forest Bathing',
        setup:
          'The resort’s garden is thriving, profitable and miserable, Brin says. It is watered on a schedule, sung to by staff on a rota and never allowed to grow where it wants. It is also, legally, the resort’s.',
        options: [
          {
            label: 'Brin talks to the garden directly',
            outcome:
              'Brin sits down in the middle of the forest bath and talks to the garden for an hour while guests in towels step around her. The garden tells her it is tired of being looked at. That night it grows a hedge across the entrance, thick enough to close it.',
            ending: 0,
          },
          {
            label: 'Brin asks the resort for visiting rights',
            outcome:
              'Brin asks the manager, in writing, for visiting rights to her own garden. They are granted on payment of a day pass. She pays. The garden recognizes her at once and puts out a flower beside the visitors’ path that is noticeably rude.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Wide shot of a lush indoor garden under a glass dome, with stone paths and steaming pools. Guests in white towels walk past. Sitting cross-legged on a mossy stone in the middle of the path is ${brin}, one hand on a tall fern, talking to it. Soft green light through the glass. ${style}`,
      },
      {
        title: 'Agreeing to Be Well',
        setup:
          'The arrival form has one box: I AGREE TO BE WELL. Guests who fail to improve are charged a recovery surcharge. Vela has found a guest in the steam room who has been agreeing to be well for nine weeks and would very much like to be allowed to be unwell for an afternoon.',
        options: [
          {
            label: 'Vela treats her as a patient, with consent',
            outcome:
              'Vela asks the guest what is actually wrong, which nobody at the resort has done, and listens to the answer, which is long. The guest is unwell in an ordinary way and is relieved to hear so. Vela prescribes going home. The guest goes home in a towel.',
            ending: 0,
          },
          {
            label: 'Vela amends the form',
            outcome:
              'Vela adds a second box to the arrival form in pen: I WOULD LIKE TO BE ASKED. The front desk copies it without reading it. By evening forty guests have ticked the new box, and the staff are asking everyone how they are, which has caused a minor panic.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a white-tiled steam room with wooden benches. Sitting on the bench beside a pale, tired woman wrapped in a white towel is ${vela}, holding the woman’s wrist between two fingers and listening to her. Thick white steam, soft warm light. ${style}`,
      },
      {
        title: 'The Photograph',
        setup:
          'The resort wants Tess on a lounger beside the forest bath, rested. A famous navigator looking rested would bring ten thousand guests. Tess has been on the couch for eleven months and would very much like to be rested, which is the difficulty.',
        options: [
          {
            label: 'Tess turns it down, and says why',
            outcome:
              'Tess turns down the week and the photograph and tells the resort why, in the voice she uses for course corrections. The marketing officer asks whether she would give them a quote instead. Tess gives her one. It is unusable.',
            ending: 0,
          },
          {
            label: 'Tess takes the week and rests honestly',
            outcome:
              'Tess takes the week, rests properly, and lets them take the photograph on the last day, when she is asleep on the lounger with her mouth open. It brings in ten thousand guests, all of whom are asked how they are on arrival.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot beside a steaming garden pool under a glass dome. A man in a white linen suit holds out a folded white robe and a camera toward ${tess}, who stands beside a wooden lounger with her arms folded. Soft green dome light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CLOSED FOR REPLANTING',
        text: 'The Serenity Reach is closed for replanting. Its forest bath is now a forest, which grows where it likes and does not admit guests in towels. The resort is said to be reopening as a clinic. Brin visits the garden when the couch passes, without a day pass. Tess says she has learned the difference between looking rested and being rested, and is working on the second.',
        art: ({ brin, style }) =>
          `Wide shot inside a glass dome where a dense green forest has grown over stone paths and pools, with ferns pushing up through white tiles and vines climbing the glass. Standing at the edge of the trees in an open doorway is ${brin}, smiling. Soft green light. ${style}`,
      },
      {
        title: 'RESTED, ON REQUEST',
        text: 'The Serenity Reach is still open, a little changed. Guests are asked how they are, which some find alarming, and the recovery surcharge has been quietly withdrawn. The garden keeps visiting hours of its own and Brin is on the list. Tess holds the resort’s standing offer of a free week in her jacket, unused, which Vela says is a kind of rest in itself.',
        art: ({ tess, style }) =>
          `Medium shot at a polished pale-wood resort front desk beside a glass garden dome. A receptionist in white leans across the desk toward a guest in a towel, one hand on her shoulder. Standing at the end of the desk is ${tess}, a folded paper voucher in her jacket pocket. Soft green light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'rue', 'vela'],
    title: 'Side Effects May Include',
    premise:
      'The makers of Restorall, a cure for tiredness sold in forty systems, are required by law to state its side effects in every advertisement. They have hired Omi to state them in bells, at a register most species cannot hear, for a fee that would keep the bubble charged for a year. Vela has read the list of side effects and would like a word with someone. Rue has read the law and says the arrangement is perfectly legal, which they mean as an accusation.',
    steps: [
      {
        title: 'The Fee',
        setup:
          'The bubble is low and the fee is large. Omi would perform from the couch, every advertisement, broadcast to forty systems at once. Omi’s whole history is a warning that nobody was allowed to hear. Rue observes that this is the same thing, with a fee.',
        options: [
          {
            label: 'Omi turns the contract down',
            outcome:
              'Omi rings the small gong. Rue drafts the refusal in language Restorall’s lawyers will understand. Restorall finds another performer within the day, a choir of very small crystals, which is worse, and Vela begins counting the side effects on her fingers.',
            ending: 0,
          },
          {
            label: 'Omi takes it, and rings the warnings properly',
            outcome:
              'Omi signs, and rings the side effects in the register the contract specifies, but slowly, one to a bell, with a rest between each. It is beautiful. Several species can hear it after all. Restorall’s sales fall eleven percent in a week, and its customers start asking questions.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a bright white recording studio with padded walls and a large chrome microphone on a stand. Standing on a stool in front of the microphone is ${omi}, holding a long thin tuning rod against one bell. Behind a glass wall a man in a lime-green suit holds up a thick paper contract. Bright white studio light. ${style}`,
      },
      {
        title: 'Item Forty',
        setup:
          'Vela’s word is about the list. The side effects include drowsiness, which is the condition Restorall treats, and, at item forty, a small chance of becoming a different person. Restorall’s medical officer says that most customers who become different people report high satisfaction.',
        options: [
          {
            label: 'Vela reports Restorall to the medical board',
            outcome:
              'Vela files a report with the Forty Systems Medical Board, item by item. The Board replies within a week, which it has never done before, because Vela attached a list of board members who take Restorall. Two of them write back separately to say they had wondered.',
            ending: 0,
          },
          {
            label: 'Vela insists item forty is asked, not listed',
            outcome:
              'Vela proposes that item forty be put to every customer as a question before purchase: would you mind becoming a different person? Rue drafts the wording. Restorall agrees, expecting nobody to read it. A surprising number answer yes, and are sold the product with Vela’s blessing.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Close-up at a white desk where a long unrolled paper list spills off the edge onto the floor. Leaning over it is ${vela}, running one finger down the list, her other hand resting on the bell at her belt. A small glass bottle of bright green pills stands on the desk. Cold white office light. ${style}`,
      },
      {
        title: 'The Fine Print',
        setup:
          'Rue has found the clause that makes it legal: a warning is deemed given if it is broadcast, whether or not anyone could hear it. Rue knows the clause well. They drafted the original, eleven years ago, for a different purpose, and it was copied.',
        options: [
          {
            label: 'Rue testifies that they wrote it',
            outcome:
              'Rue tells the Board that they drafted the original clause and what it was for, which was not this. The Board strikes it. Rue then notarizes an apology to everyone who failed to hear a warning in eleven years. It is the longest document they have ever notarized.',
            ending: 0,
          },
          {
            label: 'Rue redrafts the clause, quietly',
            outcome:
              'Rue drafts an amendment: a warning is given when it is heard, and not before. They submit it without explaining who wrote the original. It passes as a technical correction. Nobody notices but Omi, which rings once when the vote is announced.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Interior of a tall wood-panelled hearing chamber with a curved bench of officials in grey robes. Standing at a lectern is ${rue}, holding up a single yellowed sheet of paper in one hand and the small wooden gavel in the other. Warm lamp light, high dark windows. ${style}`,
      },
    ],
    endings: [
      {
        title: 'WITHDRAWN FROM SALE',
        text: 'Restorall was withdrawn in forty systems after a medical board hearing that ran for nine days. Customers who had already become different people were offered the chance to become themselves again, and most declined. Omi rings warnings now for nobody but the couch. Rue keeps a copy of the clause they wrote, struck through, sewn into their collar.',
        art: ({ couch, style }) =>
          `Medium shot through the open door of a small white shop, where a clerk in a white coat sweeps rows of small glass bottles of bright green pills from a shelf into a cardboard crate. Floating past outside in black space is ${couch}. Cold white shop light. ${style}`,
      },
      {
        title: 'USE AS DIRECTED',
        text: 'Restorall is still sold, but its warnings can now be heard by every species that can buy it, and its customers are asked before they are told. Sales are down and complaints are down further. Vela calls it the first honest medicine she has ever seen advertised. Rue’s amendment is standard in eleven systems and attributed to nobody, which is how Rue likes it.',
        art: ({ vela, style }) =>
          `Medium shot at a small white pharmacy counter. A pharmacist in a white coat holds up a glass bottle of green pills and leans toward an elderly customer, asking her a question. Standing at the end of the counter is ${vela}, listening, arms folded. Soft daylight through the window. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'sora', 'vela'],
    title: 'Focus Group',
    premise:
      'The Twin Isles have commissioned a new anthem to replace the one Jex wrote, which both isles banned. It has been written by a committee of forty and is being tested on focus groups. Jex is barred from performing his own anthem but nothing prevents him from listening to its replacement, so he has signed up. Sora signed up because the fee buys a reactor seal. Vela signed up to read the consent form, and has not yet finished.',
    steps: [
      {
        title: 'In Perpetuity',
        setup:
          'The consent form says listeners will wear heart monitors and that their reactions may be used in perpetuity, across all media, including anthems. Vela’s bell rang DID YOU ASK? when she reached the word perpetuity and has not stopped.',
        options: [
          {
            label: 'Vela strikes the clause before signing',
            outcome:
              'Vela strikes the clause, initials it and hands the form back. The researcher has never seen a struck clause and takes it to her supervisor, who has never seen one either. They accept it out of curiosity. Vela’s heart is recorded but remains hers.',
            ending: 0,
          },
          {
            label: 'Sign under protest, to be in the room',
            outcome:
              'Vela signs under protest so that she can be in the room. Her heartbeat now belongs to the Twin Isles in perpetuity. She asks for a copy and is sent one. It is the first time she has owned a recording of her own heart, and she is annoyed to find it moving.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a beige research room with a long table and a large two-way mirror on one wall. Seated at the table is ${vela}, crossing out a paragraph on a paper form with a pen. A researcher in a grey cardigan stands beside her holding a clipboard. Flat fluorescent light. ${style}`,
      },
      {
        title: 'Three to Three',
        setup:
          'The anthem plays. It is four minutes long and contains every word both isles agreed on, which is mostly harbor. Sora’s six elbows convene during the first chorus and split three to three. The protocol requires one score from each listener, and her elbows will not budge.',
        options: [
          {
            label: 'Sora reports the tie as it stands',
            outcome:
              'Sora reports herself as undecided, a category with no column. The committee, presented with a listener who is exactly divided down the middle, decides the anthem cannot be released until it can persuade an elbow.',
            ending: 0,
          },
          {
            label: 'Sora’s elbows send a delegation to Jex',
            outcome:
              'Two of Sora’s elbows ask Jex what is wrong with the second verse. Jex says there is something in it, if somebody would let it out. The elbows report back. The vote goes four to two in favor, conditional on the second verse.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot at a long table in a beige research room. Seated at the table is ${sora}, three hands raised and three hands resting flat on the table, small white monitor pads stuck to her wrists. A round brass speaker sits on the table. Flat fluorescent light. ${style}`,
      },
      {
        title: 'Suggested Changes',
        setup:
          'The committee invites Jex to suggest changes. Under the terms of his ban, a song Jex changes becomes a song Jex wrote, and he would be banned from performing it in both isles, the second time the isles have banned him from their own anthem.',
        options: [
          {
            label: 'Jex declines to touch it',
            outcome:
              'Jex declines. He says an anthem should be written by the people who will have to stand up for it, and that he has done enough standing. The committee, offended, shelves the anthem. The isles go another year without one and seem to manage.',
            ending: 0,
          },
          {
            label: 'Jex changes one note, and accepts the ban',
            outcome:
              'Jex changes one note in the second verse and signs the change. The anthem is better. He is banned from performing it in both isles within the hour, which he describes as a kind of homecoming.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Close-up of ${jex}, seated at a beige table, holding a pencil over a single sheet of printed music, the instrument case closed at his feet. A thin wire runs from a white monitor pad on his wrist. Flat fluorescent light, a two-way mirror behind him. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NO ANTHEM AT ALL',
        text: 'The Twin Isles still have no anthem. At official events they stand for four minutes in silence, which the committee calls an interim measure and both isles have come to prefer. Jex sometimes stands with them. Sora’s elbows remain divided on whether silence counts as music, and she has stopped asking them.',
        art: ({ jex, style }) =>
          `Wide shot of a stone harbor square on an island, where a crowd of people of many species stands quietly with hats in hands, facing a tall flagpole flying a plain grey flag. Standing among them is ${jex}, hat in hand. Soft grey morning light, fishing boats in the harbor. ${style}`,
      },
      {
        title: 'ADOPTED WITH AMENDMENTS',
        text: 'The Twin Isles have a new anthem, written by a committee and improved by a focus group, and it is sung at every official event by people who cannot quite say why the second verse works. Vela owns a recording of her own heart hearing it for the first time. Jex has heard it many times and performed it never, which he says is the right proportion.',
        art: ({ vela, style }) =>
          `Wide shot of a crowd singing in a stone harbor square on an island, mouths open, under bright flags. At the edge of the square stands ${vela}, holding a small brass recording box to her ear. Bright morning sun, fishing boats behind. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'sora', 'vela'],
    title: 'Patent Pending',
    premise:
      'Verdance Biotech has been granted a patent on Brin’s oxygen garden. It has never seen the garden. It has a photograph, taken through the bubble at a refueling stop, and under the patent law of the Concord Reach the first party to file a likeness of a living invention is its inventor. Verdance has written to ask for royalties on every breath taken aboard since the filing date. Sora would like to see the invention. Vela would like to know who consented to the photograph.',
    steps: [
      {
        title: 'Prior Art',
        setup:
          'To overturn the patent Brin must show that the garden existed before the photograph. It is years older, but it has never been photographed before, because Brin does not photograph people without asking and the garden counts as people.',
        options: [
          {
            label: 'Ask the garden to sit for a photograph',
            outcome:
              'Brin asks the garden whether it will sit for a photograph, as evidence. It deliberates overnight and agrees, provided it may choose its best side. It chooses the side facing away from the camera. The photograph is accepted as prior art, from behind.',
            ending: 0,
          },
          {
            label: 'Submit the garden’s own records',
            outcome:
              'Brin submits the garden’s growth rings, leaf scars and the union’s minutes, which record its meetings back nine years. The patent office has never accepted minutes from a plant. It accepts them after a long rustle in the hearing room, which the examiner later calls persuasive.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot behind the backrest of ${couch}, where thick green vines and ferns grow. A brass box camera on a wooden tripod faces the plants, and every leaf has turned away from it. Standing beside the tripod is ${brin}, one hand raised to the leaves. Soft green light and warm lamp light. ${style}`,
      },
      {
        title: 'A Garden in a Box',
        setup:
          'Sora examines the filing. Her six elbows convene and report that the patented invention is, in every technical particular, a photograph of a garden in a box. Verdance’s engineers have built one from the photograph. It does not work, because it is a photograph.',
        options: [
          {
            label: 'Sora testifies that it is a photograph',
            outcome:
              'Sora testifies, with diagrams, that the invention cannot make oxygen because it is a picture. The examiner asks for a demonstration. She seals the photograph in a jar with a lit candle. The candle goes out. The examiner writes, for the first time in his career, the word obviously.',
            ending: 0,
          },
          {
            label: 'Sora shows Verdance’s engineers how it works',
            outcome:
              'Sora visits Verdance’s engineers, who are embarrassed, and shows them how a garden actually works, which involves asking it. With Brin’s permission they build a working one by the end of the week. It is the first thing Verdance has ever made that breathes.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Interior of a white patent office hearing room. Standing at a long table is ${sora}, two hands holding a glass jar upside down over a candle, two hands holding up a flat photograph of green leaves, and two hands resting on the table. An examiner in a grey suit leans forward with a pen. Warm candle light, white walls. ${style}`,
      },
      {
        title: 'Licensing',
        setup:
          'Vela points out that if the garden can be patented it can be licensed, and a license can be made free to every refugee dome in the Reach. If it cannot be patented, anyone may copy it, Verdance included, and sell it.',
        options: [
          {
            label: 'Argue that a garden cannot be owned',
            outcome:
              'Brin argues that the garden is a member of a union and therefore not an invention. The office agrees. The patent is revoked. Nobody may own the garden, including Brin, who says it is the first legal finding about her life she would hang on a wall.',
            ending: 0,
          },
          {
            label: 'Take the patent, and give it away',
            outcome:
              'Brin applies for the patent herself, with the garden’s consent, wins it, and licenses it free to every dome, clinic and lifeboat that asks. Vela drafts the terms: free to use, free to refuse, and ask the garden first.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a warm pocket room with brass wall lamps. Seated at a small wooden desk is ${vela}, writing on a long paper document with a pen, while a potted green vine on the desk curls one tendril over the corner of the page. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UNPATENTABLE',
        text: 'The oxygen garden is the first living thing in the Concord Reach to be ruled unpatentable on the grounds that it belongs to a union. Verdance Biotech has appealed twice and lost twice. The ruling is cited now by orchards, algae and one very determined moss. Brin pinned a copy to the backrest. The garden grew over it within a week, which she takes as approval.',
        art: ({ brin, style }) =>
          `Close-up of a scarlet velvet backrest with a pinned paper document almost covered by green vines and small white flowers. Kneeling below it is ${brin}, smiling up at the leaves. Warm lamp light, black space and stars beyond. ${style}`,
      },
      {
        title: 'FREE TO A GOOD HOME',
        text: 'The oxygen garden is patented, licensed free and growing in nineteen refugee domes, four clinics and a lifeboat. Every license carries the condition Vela wrote: ask the garden first. Sora inspects the domes when the couch passes. Verdance Biotech still sells a photograph of a garden, which some customers still buy.',
        art: ({ sora, style }) =>
          `Wide shot inside a clear dome on a grey rocky moon, where rows of canvas tents stand among green vines and ferns and families sit in the leafy shade. Walking along a path with a clipboard is ${sora}, one hand touching a vine. Soft green light, black sky beyond the dome. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'omi', 'vela'],
    title: 'Certified Dead',
    premise:
      'The Bureau of Vital Records on Maddox Station has declared Omi dead. A routine scan at the docking gate found no pulse, no breath and a body temperature equal to the surrounding rock, all of which are normal for Omi. The certificate is valid and Omi’s estate goes to auction at noon. Vela must certify that Omi is alive, and the Bureau defines alive as having a pulse. Brin’s mushrooms, as the nearest decomposers, have been notified as next of kin.',
    steps: [
      {
        title: 'Proof of Life',
        setup:
          'The Bureau will accept a doctor’s certificate of life, provided it records a pulse. Omi has never had one. It has six bells, a resonator and opinions, and is standing on the registrar’s counter.',
        options: [
          {
            label: 'Vela certifies life by another measure',
            outcome:
              'Vela writes a certificate of life based on the one vital sign Omi has: it answers when asked. In front of the registrar she asks it whether it is alive. Omi rings yes. The registrar asks whether a bell can be a pulse. Vela says in this patient it can, and signs.',
            ending: 0,
          },
          {
            label: 'Omi rings a pulse',
            outcome:
              'Omi rings its smallest bell sixty times a minute for an hour, very evenly, while the registrar counts. The registrar records a pulse of sixty, healthy for a man of forty. Omi is reclassified as alive and, separately, as a man of forty.',
            ending: 1,
          },
        ],
        art: ({ omi, vela, style }) =>
          `Interior of a grey records office with tall filing cabinets and a long counter. Standing on the counter is ${omi}, ringing one bell, while a registrar in a grey waistcoat holds a stethoscope to its stone chest. Beside the counter stands ${vela}, pen in hand. Flat white light. ${style}`,
      },
      {
        title: 'The Estate Sale',
        setup:
          'The auction has already begun. Lot one is Omi’s spare ribbon. Lot four is its small gong, and the bidding on it is brisk, because a gong that means no is a useful thing to own on Maddox Station. Brin has a bag of seed and no money.',
        options: [
          {
            label: 'Stop the auction',
            outcome:
              'Vela stands up and announces that the deceased is present and objects. Omi rings the small gong to prove it, which is lot four, ringing. The auctioneer suspends the sale. Several bidders apologize to the gong.',
            ending: 0,
          },
          {
            label: 'Buy the gong back',
            outcome:
              'Brin bids for the gong with her bag of seed and wins, as nobody else is bidding seed. Omi buys back its own spare ribbon for a single note. The Bureau records the estate as distributed, which it was, back to its owner.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot in a small auction room with rows of folding chairs. On a velvet-draped table at the front sits a small brass gong on a wooden stand, with a paper tag tied to it. An auctioneer in a bow tie raises a wooden hammer. Standing in the second row is ${brin}, holding up a small cloth bag of seed. Warm lamp light. ${style}`,
      },
      {
        title: 'The Funeral',
        setup:
          'The Bureau has booked and paid for a funeral, with flowers, a eulogy and professional mourners. Brin’s mushrooms, as next of kin, are down to speak. Cancelling it would cost the Bureau the mourners’ fee, which it would prefer not to pay for a funeral that has a deceased.',
        options: [
          {
            label: 'Cancel it',
            outcome:
              'The funeral is cancelled. The mourners are paid anyway and are visibly relieved; one says it is the first time a deceased has turned up in person to cancel. Brin’s mushrooms are removed from the register of next of kin, which they appear to take hard.',
            ending: 0,
          },
          {
            label: 'Hold it anyway, with the deceased',
            outcome:
              'The funeral goes ahead with Omi in the front row. The mourners are professional and do an excellent job. Brin speaks for the mushrooms. Omi rings all six bells at the end, which the Bureau records as the deceased’s final statement and, after some discussion, also its first.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a small stone chapel with wooden pews and tall vases of white lilies. Sitting in the front pew is ${omi}, beside a row of professional mourners in black coats holding white handkerchiefs. A plain wooden coffin stands open and empty at the front. Soft candle light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PROOF OF LIFE',
        text: 'The Bureau of Vital Records on Maddox Station has amended its definition of alive. It now reads: has a pulse, or answers when asked. Omi’s certificate was the first issued under it. Several residents who had been dead on paper for years have applied since, and most have been certified. Brin’s mushrooms were compensated for their loss, in compost.',
        art: ({ vela, style }) =>
          `Close-up on a grey records counter where a registrar in a grey waistcoat presses a rubber stamp onto a one-page paper form. Leaning on the counter, watching, is ${vela}, one hand on the bell at her belt. Flat white light, filing cabinets behind. ${style}`,
      },
      {
        title: 'DECEASED, ACTIVE',
        text: 'Omi is alive under the Bureau’s rules and dead under them too, and the Bureau has decided to leave both records standing rather than open the question. Omi travels on a valid certificate of each. Vela keeps both in her mantle. Brin’s mushrooms are still listed as next of kin, which they take seriously, and on the date each year they send a single spore.',
        art: ({ brin, couch, style }) =>
          `Wide shot of ${couch}, drifting away from a grey space station. Seated on the middle cushion is ${brin}, holding a small brass gong on a wooden stand in her lap while the pink mushrooms on her shoulders lean toward it. Black space, cool station light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'rue', 'tess'],
    title: 'Relocation',
    premise:
      'At the Harmonic Belt summit Omi heard something the Concord Reach would prefer it had not, and the Reach’s Witness Relocation Office has offered it protection: a new identity, a new homeworld and a new chord. The offer is generous and compulsory. Rue knows the Office well, having drafted its founding charter, in which the word compulsory does not appear. Tess has been asked to recommend a destination nobody could ever find.',
    steps: [
      {
        title: 'A New Chord',
        setup:
          'The Office proposes to retune Omi’s six bells to a chord nobody would recognize. Omi’s name is the chord it has now. Under the new identity it would be called, in bells, something closer to a cough.',
        options: [
          {
            label: 'Rue reads the Office its own charter',
            outcome:
              'Rue reads the charter aloud, paragraph by paragraph, until the officer reaches the one that says the relocated may keep their names. Rue wrote it. The officer amends the file. Omi keeps its chord and is issued a new homeworld it is permitted to decline.',
            ending: 0,
          },
          {
            label: 'Omi agrees to retune one bell only',
            outcome:
              'Omi agrees to retune its fourth bell by half a tone. Its name is now very slightly different, which it says is like hearing yourself on a recording. The Office accepts the change as a new identity. Rue notes that this sets a precedent for disguises of half a tone.',
            ending: 1,
          },
        ],
        art: ({ omi, rue, style }) =>
          `Interior of a grey government office with a steel desk and a row of brass tuning forks on green felt. Standing on the desk is ${omi}, while an officer in a grey suit holds one tuning fork toward its bells. Seated beside the desk is ${rue}, holding open a thick bound book. Flat grey light. ${style}`,
      },
      {
        title: 'Destination',
        setup:
          'The Office asks Tess to name a place where a witness could never be found. Tess knows several. They are on her grandmother’s map, and the map came with a single instruction: never be useful to the powerful.',
        options: [
          {
            label: 'Tess says she knows of none',
            outcome:
              'Tess tells the Office she knows of no such place, a lie she has rehearsed for eleven years. The officer, who has heard it before from other navigators, writes none known and underlines it in a way that suggests he knows. Omi rings the small gong on her behalf.',
            ending: 0,
          },
          {
            label: 'Tess names somewhere hidden in plain sight',
            outcome:
              'Tess names a quiet moon that is on every chart and that nobody has visited in a century, because it is boring. The Office accepts. Tess has kept her grandmother’s instruction and found a loophole in it, which she admits to Rue, who says that is what loopholes are for.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Close-up of ${tess}, seated across a steel desk from an officer in a grey suit, holding a rolled paper map tight against her jacket with both arms folded over it. Flat grey office light, a filing cabinet behind her. ${style}`,
      },
      {
        title: 'Evidence',
        setup:
          'Protection comes on condition that Omi gives evidence at a closed hearing. Omi has the right to be silent. It has also been silenced once already, at a memorial, and has firm views on the difference.',
        options: [
          {
            label: 'Omi rings it in public instead',
            outcome:
              'Omi declines the closed hearing and rings what it heard in the open square outside the Office, at noon, at full volume. A crowd gathers. The Concord Reach states that the bells have been taken out of context, and is asked by forty people which context.',
            ending: 0,
          },
          {
            label: 'Omi gives evidence in the closed hearing, in full',
            outcome:
              'Omi gives its evidence in the closed hearing, all of it, with Rue beside it to translate. The record is sealed for twenty years. Omi accepts this. It was heard, which is not the same as being made public, and is the part that matters to it.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Wide shot of a stone square outside a grey government building at noon. Standing on the rim of a dry fountain is ${omi}, holding a long thin tuning rod against one bell, while a crowd of people of many species gathers around it. Bright overhead noon light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'IN THE OPEN',
        text: 'Omi declined protection and kept its chord, its homeworld and its seat on the couch. What it heard at the summit is public now, and on the anniversary it is rung outside the Witness Relocation Office by people who had not known they were allowed to ring it. Tess still knows of no such place. Rue has left a copy of their charter in the Office’s waiting room, with the paragraph about names marked.',
        art: ({ rue, style }) =>
          `Wide shot of a stone square outside a grey government building at noon, crowded with people of many species ringing small brass hand bells. Standing at the edge of the crowd is ${rue}, holding the small wooden gavel at their side and listening. Bright noon light. ${style}`,
      },
      {
        title: 'RELOCATED IN NAME',
        text: 'Omi was relocated on paper to a boring moon it has never visited, under a chord very slightly different from its own, and travels on the couch exactly as before. The Office checks on it twice a year by letter and is satisfied. What Omi said is sealed, and will keep. Tess has started a short list of boring moons for anyone else who needs one.',
        art: ({ tess, couch, style }) =>
          `Wide shot of a small plain grey moon with one empty wooden bench on its dusty surface. Passing above it is ${couch}, and leaning on the armrest is ${tess}, pointing down at the bench. Soft grey light, black starry sky. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'mox', 'tess'],
    title: 'Elite Status',
    premise:
      'The couch has been enrolled, by nobody anyone can remember, in the Starlane Hospitality Group loyalty program, and has nine hundred thousand points expiring at midnight. Tess has worked out that this is enough for Platinum Status, a lounge in every port and her photograph on the wall at Starlane headquarters. Mox has read the program’s terms and has opinions about them, which are accurate. Fen has been to the Platinum Lounge before, as the man on its door.',
    steps: [
      {
        title: 'Redeem',
        setup:
          'The points buy Platinum Status, or nine hundred thousand small packets of biscuits, or a donation to a charity of Starlane’s choosing. Mox has found that Platinum Status also grants Starlane the right to know where the couch is at all times, for its own improvement.',
        options: [
          {
            label: 'Mox reads Tess the clause',
            outcome:
              'Mox reads the clause aloud, twice, in both lids. Tess listens to the end. She says that a navigator whose location is known at all times is a navigator who cannot keep a harbor secret, and asks what else the points will buy.',
            ending: 0,
          },
          {
            label: 'Tess takes Platinum Status',
            outcome:
              'Tess takes Platinum Status. Starlane sends a silver lanyard and a welcome message that already knows where the couch is. Mox clips its I OBJECT badge to the lanyard, beside the platinum one, so that both can be seen at all times.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up of ${mox}, seated on scarlet velvet button-tufted cushions, holding a very long folded paper document close to its orange-lidded eye with one finger on a line. Warm lamp light, black space and stars behind. ${style}`,
      },
      {
        title: 'The Door',
        setup:
          'The Platinum Lounge has a man on its door, as it did when Fen was that man. He is checking members. Mox is listed on the account as a member’s device, to be carried in. Fen knows the man on the door. He trained him.',
        options: [
          {
            label: 'Fen tells him to sign Mox in as a guest',
            outcome:
              'Fen tells the man on the door that Mox is a guest and is to be signed in as one. The man recognizes the tone and the rule, having been taught both by Fen. He signs Mox in. The system rejects a device listed as a guest nine times, then accepts it.',
            ending: 1,
          },
          {
            label: 'Sit on the ordinary bench instead',
            outcome:
              'The three of them sit on a bench in the ordinary departures hall, which Mox prefers. On his break the man on the door comes out and sits with them. He says the lounge is very quiet. Mox says the bench is quieter. He agrees, and finishes his tea there.',
            ending: 0,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at the polished brass door of a plush hotel lounge with velvet ropes. A young doorman in a grey uniform holds a clipboard. Facing him stands ${fen}, hands loose at his sides. Warm golden light from inside the lounge, cool light in the corridor. ${style}`,
      },
      {
        title: 'Midnight',
        setup:
          'At five to midnight the remaining points can be spent on anything in the Starlane catalog. Tess has found that it includes the right to name a constellation, provided the constellation is blank. Tess has a blank constellation tattooed on her arm.',
        options: [
          {
            label: 'Spend the lot on biscuits',
            outcome:
              'Tess spends the rest of the points on biscuits, delivered to the refugee dock on the far side of the station and addressed from a couch. The dock eats them for a month. Starlane records it as the largest redemption in its history and asks for a photograph. Tess declines.',
            ending: 0,
          },
          {
            label: 'Name the blank constellation, privately',
            outcome:
              'Tess buys the naming rights to a blank patch of sky and registers a name of zero characters, so that no one else can name it anything. Starlane’s system accepts it on the first try. The blank on her arm is now protected by a loyalty program, which she finds funnier than she expected.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Close-up of ${tess}, her jacket sleeve rolled up, looking down at a small tattoo of stars on her forearm with one round empty patch among them. In her other hand she holds a silver lanyard. A round station clock behind her shows one minute to twelve. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'REDEEMED FOR BISCUITS',
        text: 'The couch spent nine hundred thousand points on things that did not follow it home, and Starlane never learned where it went. Fen still takes the ordinary bench. Tess is on nobody’s wall at Starlane headquarters and has stopped minding, mostly. Mox has kept a copy of the program’s terms with its own annotations, which run longer than the terms and are accurate.',
        art: ({ style }) =>
          `Wide shot of a busy refugee dock on a space station, where families of many species sit on suitcases and bundles, sharing small packets of biscuits from tall stacks of cardboard boxes. A child holds up a biscuit to the light. Warm dock lamps, black space through a round window. ${style}`,
      },
      {
        title: 'PLATINUM, UNDER PROTEST',
        text: 'The couch holds Platinum Status with Starlane and uses it chiefly to sign androids into lounges as guests, an entry the system now accepts on the first attempt. Mox wears the lanyard with both badges. Fen nods to the man on the door in every port. Tess has decided a navigator can be famous in a lounge and still keep a secret, provided she sits facing the door.',
        art: ({ mox, style }) =>
          `Medium shot inside a plush hotel lounge with deep velvet armchairs and brass lamps. Sitting upright in an armchair is ${mox}, a silver lanyard around its neck, holding a small cup and saucer. Warm golden lamp light, a window of stars behind. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'sora', 'tess'],
    title: 'Listed',
    premise:
      'The Galactic Heritage Commission has listed the couch as a Site of Outstanding Historic Interest, Grade II, on the strength of its upholstery. Listing protects it from alteration. Brin’s garden may no longer be pruned. Sora’s repairs to the bubble generator now need listed-building consent, which takes eleven weeks. Tess has been told that listed sites are shown on every heritage chart in the galaxy, with directions.',
    steps: [
      {
        title: 'Consent to Prune',
        setup:
          'The garden has grown over the left armrest and is heading for the controls. Pruning is alteration. The Commission’s inspector will consider an application for consent to prune, on the correct form, with a historical justification attached.',
        options: [
          {
            label: 'Apply, with a historical justification',
            outcome:
              'Brin writes that the garden has always been pruned, and that pruning is therefore part of its historic character. The inspector agrees that an unpruned garden would be a modern intrusion. Brin is granted consent to prune, provided she uses period shears.',
            ending: 1,
          },
          {
            label: 'Prune now and contest the listing',
            outcome:
              'Brin prunes the garden that evening, openly, with her ordinary shears. Sora photographs the cuttings for evidence. The inspector serves a notice of unauthorized works, and the listing goes to appeal, which is what Brin wanted.',
            ending: 0,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Close-up on the left armrest of ${couch}, overgrown with thick green vines and small white flowers. Standing beside it is ${brin}, holding a pair of green-handled pruning shears, while a heritage inspector in a tweed jacket raises one hand and holds a clipboard in the other. Warm lamp light. ${style}`,
      },
      {
        title: 'Original Parts',
        setup:
          'Sora’s elbows convene with the inspector over the generator. Any part replaced must match the original. The original was replaced forty years ago by a part that did not match the one before it, which had replaced another.',
        options: [
          {
            label: 'Sora argues there is no original',
            outcome:
              'Sora lays out a timeline of every part the couch has ever had, two hands holding each end. Nothing aboard is older than the inspector. He asks what, then, is historic about it. Sora opens all six hands and says she does not know, and that he should ask the couch.',
            ending: 0,
          },
          {
            label: 'Sora sources a period-correct part',
            outcome:
              'Sora finds a period-correct bearing in a museum, which lends it on condition that it be displayed. It is fitted behind a small glass window in the generator housing, with a brass plate. The generator runs. The bearing may be viewed by appointment.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot behind a scarlet velvet backrest at an open steel generator housing with a small round glass window in its side and a brass bearing behind the glass. Kneeling at it is ${sora}, four hands working with spanners and two hands holding a brass torch. Warm amber light. ${style}`,
      },
      {
        title: 'Directions',
        setup:
          'Heritage charts give directions to every listed site, and a site with directions can be found by anyone. Tess has spent her life making sure some places cannot be. The Commission has asked her to supply the directions herself, as the vessel’s navigator.',
        options: [
          {
            label: 'Tess supplies directions to where the couch was',
            outcome:
              'Tess supplies directions that are accurate to the couch’s position at the moment of writing and to no other moment. The Commission prints them. Several tourists arrive at an empty patch of space and photograph it as instructed. One writes to say it was very peaceful.',
            ending: 1,
          },
          {
            label: 'Tess argues a moving site cannot be listed',
            outcome:
              'Tess writes to the Commission that a moving site cannot be given directions, and that a site that cannot be given directions cannot be listed. The Commission has never been told this. It sends an inspector to check, who cannot find the couch.',
            ending: 0,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot in a small warm pocket room with brass wall lamps. Seated at a fold-down desk is ${tess}, drawing a single small dot on a sheet of paper with a fountain pen, while an inspector in a tweed jacket waits in the open door. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'DELISTED',
        text: 'The couch was removed from the heritage list on appeal, on the grounds that nothing aboard is old except the arguments. Brin prunes when she likes. Sora replaces parts with parts that work. The couch appears on no chart, which Tess prefers to every chart. The Commission keeps a file on the case, labeled precedent: furniture.',
        art: ({ sora, tess, couch, style }) =>
          `Wide shot of ${couch}, moving fast across a field of stars, its garden neatly trimmed along the backrest. Seated on the cushions are ${sora}, and ${tess}, both leaning back. Black space, warm lamp light. ${style}`,
      },
      {
        title: 'GRADE II, MOVING',
        text: 'The couch remains a listed site, Grade II, and the only one in the galaxy that moves. Brin keeps the garden historic, which means pruned, which means paperwork. Sora’s repairs take eleven weeks to approve and are done by hand in the meantime. Heritage tourists follow the published directions with great care and arrive, every time, where the couch was.',
        art: ({ style }) =>
          `Wide shot of an empty patch of black starry space where a small open-top tour boat floats, carrying a dozen tourists in matching blue coats who point cameras at the empty stars. A guide at the front holds up a folded paper leaflet. Soft starlight. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'taal', 'tess'],
    title: 'Act of God',
    premise:
      'A meteorite has struck the couch’s right armrest. The insurer, Prudent Orbit, has declined the claim as an act of god. The god in question, a minor deity who lives on the nearest moon, denies throwing anything and has counterclaimed for defamation. Taal can tell when a room is lying, and this room has a god in it. Tess must prove the couch was on a charted route. Fen’s old guard boots, the only thing on watch at the time, have been asked for a statement.',
    steps: [
      {
        title: 'The Route',
        setup:
          'Prudent Orbit covers charted routes only. The couch was on one of Tess’s grandmother’s routes, which is charted on exactly one map, which Tess will show nobody.',
        options: [
          {
            label: 'Tess declines to show the route',
            outcome:
              'Tess declines. Prudent Orbit marks the couch as off-chart at the time of impact and strikes the claim. Taal registers his dissent by lowering the temperature of the claims office until the adjuster puts on a scarf. The armrest stays dented.',
            ending: 0,
          },
          {
            label: 'Tess charts that stretch, and only that stretch',
            outcome:
              'Tess charts the eleven kilometers of route where the meteorite struck, and nothing either side. The adjuster accepts it as charted. It is now the shortest charted route in the galaxy, and it goes nowhere at either end.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Close-up of the right armrest of ${couch}, with a deep round dent in the velvet and a small black smoking rock lying in it. Leaning over it is ${tess}, holding a rolled paper map close to her chest. Black space and stars, warm lamp light. ${style}`,
      },
      {
        title: 'The God',
        setup:
          'The deity attends the hearing as a small warm glow above a chair. It says it threw nothing. Taal reads the room: the god is telling the truth, it is lonely, and it would like the couch to stay a while. All three are in the temperature at once.',
        options: [
          {
            label: 'Taal reports all three readings',
            outcome:
              'Taal reports all three. The god, hearing its own temperature read aloud, dims, then brightens, and withdraws the defamation suit in exchange for a visit. The adjuster records the god as a credible witness. Prudent Orbit, which had no box for that, adds one.',
            ending: 1,
          },
          {
            label: 'Taal reports only the first',
            outcome:
              'Taal reports that the god is telling the truth and keeps the rest to himself, because the rest is not evidence. The god notices, and thanks him privately with a single warm degree. Afterward, unasked, Taal goes back to the moon and sits with it for an afternoon.',
            ending: 0,
          },
        ],
        art: ({ taal, style }) =>
          `Interior of a small grey insurance claims office with a steel desk. A small round golden glow hovers above a wooden chair. Standing beside it is ${taal}, a faint warm shimmer rising from his shoulders, one webbed hand raised toward the glow. An adjuster in a grey suit takes notes. Warm gold light, grey walls. ${style}`,
      },
      {
        title: 'The Officer on Watch',
        setup:
          'Prudent Orbit requires a statement from the officer on watch. The only thing on watch was Fen’s boots, which announced CHECKPOINT at the meteorite four seconds before it struck. Fen is retired. The boots, technically, are not.',
        options: [
          {
            label: 'Fen gives the statement himself',
            outcome:
              'Fen gives the statement himself: he was asleep, his boots were awake, and they did their job, which is to shout at whatever approaches. The adjuster records that the vessel kept an adequate watch. Fen adds, unasked, that the boots ought to have been retired with him.',
            ending: 1,
          },
          {
            label: 'Let the boots speak for themselves',
            outcome:
              'Fen sets the boots on the claims desk. The adjuster asks them a question. They say CHECKPOINT. He asks another. They say it again. He writes the statement up as unhelpful but consistent, which Fen says is what his service record said too.',
            ending: 0,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up on a steel claims desk where a pair of heavy scuffed black guard boots stands upright. An adjuster in a grey suit leans toward them with a pen raised. Seated beside the desk is ${fen}, arms folded, looking at the boots. Flat office light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ACT OF NOBODY',
        text: 'The claim was never paid, and the right armrest is still dented. The god on the nearest moon is visited whenever the couch passes and has stopped claiming not to be lonely. Taal sits with it. Tess keeps her route on one map. Fen’s boots announce CHECKPOINT at every meteorite in range, which Prudent Orbit has noted on the couch’s file as a risk factor.',
        art: ({ taal, style }) =>
          `Wide shot of a small grey moon with a soft round golden glow resting on a low hilltop. Seated on the dust beside the glow is ${taal}, his webbed hands on his knees, a faint warm shimmer rising from his shoulders. Black starry sky, warm gold light. ${style}`,
      },
      {
        title: 'PAID OUT',
        text: 'Prudent Orbit paid the claim in full, under protest, and the right armrest has been restuffed. The policy now has a clause about gods and another about boots, both drafted after the hearing. The premium has gone up. Tess says it is the price of being on record. Taal, asked whether he agrees, lowers the room by exactly one degree, which Fen reads as yes, with reservations.',
        art: ({ tess, couch, style }) =>
          `Close-up of the right armrest of ${couch}, smooth and freshly restuffed in new scarlet velvet. Resting on it is a pair of heavy scuffed black guard boots, and seated beside them is ${tess}, writing in a logbook. Warm lamp light, black space. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'mox', 'rue'],
    title: 'Last Will',
    premise:
      'The late Hester Orrin of the Calm Shallows left her estate, which is considerable, to the first living thing to sit on her garden bench after her death. The first thing to sit on it was Mox, which is not alive under the law of the Calm Shallows. The second was the mushrooms on Brin’s shoulder, which are, but were being carried. Rue has been appointed to settle the matter, and has brought the gavel, which talks, in their grandmother’s voice.',
    steps: [
      {
        title: 'Living',
        setup:
          'The law says a living thing grows, repairs itself and wants things. Mox repairs itself. It does not grow. Whether it wants things is a question it has been asking itself since its first memory, and the executors would like an answer by four.',
        options: [
          {
            label: 'Mox argues for itself',
            outcome:
              'Mox argues, at length and accurately, that it repairs itself, that it has grown three opinions since breakfast, and that at this moment it wants to win. The executors confer. They find the wanting the most persuasive part, as it is the one thing anyone in the room is sure of.',
            ending: 0,
          },
          {
            label: 'Mox declines to argue',
            outcome:
              'Mox says it does not want the estate, and therefore cannot be shown to want things, and therefore is not living under the law, and therefore cannot inherit, and that this is the first argument it has ever won by losing. Rue enters it in the record with respect.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot in an old walled garden with a weathered wooden bench covered in green moss. Seated on the bench is ${mox}, hands on its knees, while two elderly executors in black coats stand before it holding a thick ledger. Soft overcast daylight, ivy on the brick wall. ${style}`,
      },
      {
        title: 'Sitting',
        setup:
          'The mushrooms’ claim depends on whether being carried onto a bench counts as sitting on it. Brin thinks it does not. The mushrooms think it does. Brin is their interpreter and, under the rules of the hearing, must put their case even though she disagrees with it.',
        options: [
          {
            label: 'Brin argues against her own mushrooms',
            outcome:
              'Brin withdraws as interpreter and argues against the mushrooms in her own voice. Without an interpreter they cannot reply, and the executors find against them by default. Brin admits that this is not justice, and apologizes to her shoulder.',
            ending: 0,
          },
          {
            label: 'Brin puts the mushrooms’ case faithfully',
            outcome:
              'Brin puts the mushrooms’ case faithfully, including the parts she thinks are nonsense, and puts it so well that the executors adjourn to consider it. Rue says Brin has just done the hardest thing in law. Brin says the mushrooms owe her one.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot in an old walled garden. Standing beside a mossy wooden bench is ${brin}, turning her head to speak to the small pink mushrooms on her shoulder, while an executor in a black coat waits with a pen over a ledger. Soft grey daylight. ${style}`,
      },
      {
        title: 'The Moss',
        setup:
          'Rue’s gavel, in their grandmother’s voice, raises a third claimant. The bench is old wood and has grown moss on its own seat for years. Moss sits. The moss was there first, and is unquestionably alive.',
        options: [
          {
            label: 'Rule that Mox inherits',
            outcome:
              'Rue rules that Mox sat first and wanted it, and that both count. Mox inherits a house, a garden and a bench. It keeps the bench and lets the house to a family from the Calm Shallows, at a rent it chose because it liked the number.',
            ending: 0,
          },
          {
            label: 'Rule for the moss',
            outcome:
              'Rue rules for the moss, which has sat on the bench longer than anyone has been alive to dispute it. The estate passes to the bench in trust, with Brin as gardener and Mox as trustee. The gavel says it is the right decision, and that it has always liked moss.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Close-up of a weathered wooden garden bench thickly covered in green moss. Holding a small wooden gavel just above the moss is ${rue}, leaning down with one ear close to the bench. Soft grey daylight, ivy on an old brick wall behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HEIR, SELF-DECLARED',
        text: 'Mox is now, under the law of the Calm Shallows, a living thing, with a house it has never visited and a bench it has. The bench is bolted to the middle cushion. Mox sits on it most evenings, deciding what else it wants, which it says is a longer list than it expected. Brin’s mushrooms lean away from the bench on principle.',
        art: ({ mox, couch, style }) =>
          `Wide shot of ${couch}, with a weathered mossy wooden garden bench bolted onto the middle cushion. Seated on the bench is ${mox}, hands folded, looking out at the stars. Black space, warm lamp light. ${style}`,
      },
      {
        title: 'HELD BY THE MOSS',
        text: 'Hester Orrin’s estate belongs to the moss on her garden bench, held in trust and kept by a gardener who visits when the couch passes and a trustee who files its accounts with great precision. The moss has spent nothing. Mox says it has learned that it wants things, which it values more than a house. Rue’s gavel visits the bench in Rue’s pocket and speaks warmly of it.',
        art: ({ brin, style }) =>
          `Medium shot in an old walled garden in sunlight, where a weathered wooden bench is thick with bright green moss. Kneeling beside it is ${brin}, misting the moss from a small brass sprayer. Warm afternoon light, ivy on the brick wall. ${style}`,
      },
    ],
  },
  {
    crew: ['rue', 'sora', 'taal'],
    title: 'Trust Exercise',
    premise:
      'The Voyage Authority requires every crew to complete a team-building weekend at the Cohesion Retreat, a moon of rope bridges run by a facilitator with a whistle. The weekend is built around trust. Taal can tell when someone is lying and has never once been able to make anyone trust him. Sora has inspected the ropes course and has concerns, in six parts. Rue has been asked to sign the liability waiver on behalf of the group.',
    steps: [
      {
        title: 'The Waiver',
        setup:
          'The waiver releases the Retreat from responsibility for injury, loss, emotional growth and any team cohesion arising. Rue reads it twice. Sora’s concerns run to forty numbered items, and item one is the ropes.',
        options: [
          {
            label: 'Rue signs, with an amendment',
            outcome:
              'Rue signs, adding a line that the Retreat remains responsible for its ropes. The facilitator blows his whistle, which is how he expresses every feeling, and accepts. Sora replaces eleven ropes before lunch with the Retreat’s permission and to its visible alarm.',
            ending: 1,
          },
          {
            label: 'Rue declines to sign for anyone else',
            outcome:
              'Rue says they cannot consent on behalf of others and asks each of them to sign for themselves. Taal declines by lowering the temperature of the form. Sora declines in six places. The facilitator blows the whistle for a long time.',
            ending: 0,
          },
        ],
        art: ({ rue, style }) =>
          `Wide shot of a grey moon strung with high rope bridges and wooden platforms. On the nearest platform stands ${rue}, holding a long paper waiver and a pen, while a facilitator in a red tracksuit with a silver whistle on a cord points at it. Bright white sunlight, black sky. ${style}`,
      },
      {
        title: 'The Trust Fall',
        setup:
          'Taal is asked to fall backward from a platform one meter high into Sora’s arms, all six of them. Sora is ready. Taal knows she is telling the truth. Knowing it and trusting it, he says, are two different temperatures.',
        options: [
          {
            label: 'Taal falls',
            outcome:
              'Taal falls. Sora catches him in four hands and steadies him with two. The air around them warms by a degree and stays there. Asked what he learned, Taal says he learned that he weighs more than he thought.',
            ending: 1,
          },
          {
            label: 'Taal declines, and says why',
            outcome:
              'Taal declines to fall. He explains that he trusts Sora completely and does not see why it has to be demonstrated on a platform. Sora says it is the nicest thing anyone has said to her this year. The facilitator writes failed to engage.',
            ending: 0,
          },
        ],
        art: ({ taal, sora, style }) =>
          `Medium shot on a low wooden platform on a ropes course. Standing at its edge with his back to the drop and his arms crossed over his chest is ${taal}. Below him with all six arms raised to catch stands ${sora}. Bright sunlight, black starry sky, rope bridges behind. ${style}`,
      },
      {
        title: 'Shared Values',
        setup:
          'The weekend ends with the group agreeing a list of shared values, to be hung behind the backrest. Taal has been silent through the whole session. Rue holds the pen, and has heard Taal say that a silence can be three answers.',
        options: [
          {
            label: 'Rue writes down all three answers',
            outcome:
              'Rue writes all three of Taal’s silences down as values: consent, patience and, after some discussion with Taal, soup. Sora adds six more, one per arm. The facilitator, who has never seen soup on a list of values, blows the whistle once, softly.',
            ending: 1,
          },
          {
            label: 'Rue hands in a blank sheet',
            outcome:
              'Rue hands in a blank sheet and explains that the group’s values are not the kind that go on a wall. The facilitator, who has run four hundred of these weekends, looks at it for a long time and says it is the first honest one he has received. He keeps it.',
            ending: 0,
          },
        ],
        art: ({ taal, style }) =>
          `Close-up of a wooden table in a pine-panelled lodge with a single sheet of paper and a fountain pen on it. Seated at the table with his webbed hands folded is ${taal}, while a facilitator in a red tracksuit waits beside him with a silver whistle in his mouth. Warm lamp light, coils of rope on the wall. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FAILED TO ENGAGE',
        text: 'The crew failed the Cohesion Retreat, officially, on every measure, and came back to the couch on the Sunday morning without a certificate and in an unusually good mood. The Authority has scheduled a repeat. Sora has sent the Retreat a full report on its ropes. Taal and Sora have still never done a trust fall, and both regard this as evidence of trust.',
        art: ({ sora, couch, style }) =>
          `Wide shot of ${couch}, lifting away from a grey moon strung with rope bridges. Seated on the cushions is ${sora}, waving with three hands at a small figure in a red tracksuit on a platform below. Bright sunlight, black sky. ${style}`,
      },
      {
        title: 'COHESION ARISING',
        text: 'The crew passed the Cohesion Retreat, and the certificate hangs behind the backrest. The Retreat has since replaced its ropes, revised its waiver and added, to its advanced course, a trust exercise in which nobody falls and everybody explains why. Taal has been asked back to lead it. He has agreed, at a temperature Rue describes as cautiously warm.',
        art: ({ taal, style }) =>
          `Interior of a pine-panelled lodge with coils of rope on the walls. Standing in front of a half-circle of seated people in red tracksuits is ${taal}, one webbed hand raised as he speaks. Warm lamp light, snow-white moon dust at the windows. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'rue', 'taal'],
    title: 'No Response Recorded',
    premise:
      'The official transcript of the Nacre Inquiry, which will stand as the permanent public record of what was said, has been published. Taal gave evidence for two hours, in temperature. Omi gave evidence for forty minutes, in bells. The transcript records both as no response. Rue, who has spent a career on the ways a record can make people disappear, has asked for a correction. The records clerk explains that the transcript system accepts only words.',
    steps: [
      {
        title: 'The Correction',
        setup:
          'The clerk will accept a correction in words, signed by the witness. Rue could translate both testimonies into words and submit them. It would be accurate, clear and in Rue’s voice.',
        options: [
          {
            label: 'Rue translates both into words',
            outcome:
              'Rue translates both over three nights, Taal’s from a thermal log and Omi’s from memory. The correction is accepted. The record now says what was said, in a lawyer’s prose, which Taal reads and describes as mostly right and slightly warm.',
            ending: 1,
          },
          {
            label: 'Rue asks for the originals to go in the record',
            outcome:
              'Rue asks for the transcript to hold Taal’s thermal log and a recording of Omi’s bells as the testimony itself. The clerk repeats that the system accepts only words. Rue asks who wrote the system. The clerk does not know. Rue says that is usually the problem.',
            ending: 0,
          },
        ],
        art: ({ taal, omi, style }) =>
          `Interior of a long wood-panelled inquiry room with a raised bench and a clerk at a brass typewriter. Standing at the witness table is ${taal}, pale mist rising from his shoulders. Beside him ${omi} holds a long thin tuning rod against one bell. Pale window light. ${style}`,
      },
      {
        title: 'Four Minutes',
        setup:
          'Part of Taal’s evidence was a silence of four minutes, in answer to a question about the forged vote. Rue knows, because Taal has told them, that a silence can be three answers. The transcript has room for one.',
        options: [
          {
            label: 'Ask Taal which answer it was',
            outcome:
              'Rue asks Taal which of the three he meant. Taal says all three. Rue records all three, numbered, under the same timestamp, which the system rejects as a duplicate and, after Rue speaks to a supervisor, accepts.',
            ending: 1,
          },
          {
            label: 'Record the silence as a silence',
            outcome:
              'Rue asks the clerk to record four minutes of silence as four minutes of silence, with the temperature. The clerk asks how. Taal lowers the room three degrees and holds it for four minutes. The clerk, shivering, types: four minutes, cold.',
            ending: 0,
          },
        ],
        art: ({ rue, style }) =>
          `Close-up of a records clerk in a grey cardigan typing at a brass typewriter, her breath visible in cold air and white frost forming on the keys. Standing behind her, reading over her shoulder, is ${rue}, holding the small wooden gavel. Cold blue light. ${style}`,
      },
      {
        title: 'The Last Bell',
        setup:
          'Omi’s evidence ended with its smallest gong, which means no, in answer to a question that was never asked aloud. Everyone in the room understood the question. The transcript does not contain it.',
        options: [
          {
            label: 'Put the unasked question in the record',
            outcome:
              'Rue puts the unasked question into the record, with a note that everyone present understood it, and attaches Omi’s no. The chair objects that this is putting words in the Inquiry’s mouth. Rue agrees that it is, and points out that the Inquiry’s mouth was open at the time.',
            ending: 1,
          },
          {
            label: 'Leave the no on its own',
            outcome:
              'Rue leaves the gong in the record on its own, with no question attached. Anyone who reads the record will find a no and have to work out what it answers. Omi says that is how warnings ought to work.',
            ending: 0,
          },
        ],
        art: ({ omi, style }) =>
          `Close-up of a small brass gong on a wooden stand on a witness table in a wood-panelled room. Holding a short wooden beater beside it is ${omi}, its amber eyes on the raised bench of officials beyond. Pale window light, dust in the air. ${style}`,
      },
    ],
    endings: [
      {
        title: 'IN THE ORIGINAL',
        text: 'The permanent record of the Nacre Inquiry holds a thermal log, a recording of bells and four minutes marked cold, and is the first transcript in the Concord Reach that has to be listened to. It is very hard to read. It is the most accurate record of an inquiry Rue has ever seen, and they have stopped apologizing for it.',
        art: ({ rue, style }) =>
          `Interior of a quiet reading room with a long oak table holding a thick bound volume, a brass gramophone and a tall brass thermometer. Seated at the table is ${rue}, one hand on the volume and one ear turned toward the gramophone horn. Warm green-shaded lamp light. ${style}`,
      },
      {
        title: 'TRANSLATED BY COUNSEL',
        text: 'The record of the Nacre Inquiry now says, in words, what was said without them, with a footnote naming Rue as translator. It is clear, accurate and slightly warm. Taal has read it twice. Omi asked for a recording of its bells to be kept beside the transcript in case anyone ever wants the original, and the clerk keeps one in her desk drawer for that purpose.',
        art: ({ taal, style }) =>
          `Medium shot in a wood-panelled records room. Seated at a desk is ${taal}, reading a thick bound volume. Beside him a desk drawer stands open, holding a small round tin with a wax recording cylinder inside. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'jex', 'mox'],
    title: 'Villain Edit',
    premise:
      'The couch has been cast, without anyone remembering an audition, in Sofa Wars, the most watched reality program in the Outer Arm, in which crews compete to stay on their own furniture. The producers need drama. Mox cannot say anything it knows to be untrue. Jex once made propaganda by accident and recognizes editing when he sees it. Brin’s garden has been given the villain edit.',
    steps: [
      {
        title: 'Confessional',
        setup:
          'Each crew member is filmed alone in a pocket room and asked leading questions about the others. Mox is asked whether Brin’s garden has ever taken more than its share of oxygen. It has, once, during a fever.',
        options: [
          {
            label: 'Mox answers accurately, at length',
            outcome:
              'Mox explains the fever, the share, the reasons and the garden’s subsequent apology, in both lids, for nineteen minutes. The producers use four seconds of it: the word yes. Mox watches the broadcast and says it has learned something about the word yes.',
            ending: 1,
          },
          {
            label: 'Mox walks out of the confessional',
            outcome:
              'Mox unclips its microphone, lays it on the chair and leaves. The producers film the empty chair for nine minutes and broadcast it as Mox’s confession. It is the most discussed segment of the season, and the only one nobody could edit.',
            ending: 0,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot in a small pocket room set up with a single wooden chair, two bright studio lamps on stands and a camera on a tripod. Seated on the chair is ${mox}, hands on its knees, looking straight into the camera lens. Hard white studio light, dark walls. ${style}`,
      },
      {
        title: 'The Rough Cut',
        setup:
          'Jex is shown the rough cut. The garden appears, in slow motion, to be strangling a fern, under music. Jex knows the music. He wrote it, for a war, and it is one of the six he is banned from performing. The producers have licensed it.',
        options: [
          {
            label: 'Jex explains the music on camera',
            outcome:
              'Jex agrees to explain on camera where the music came from and what it was used for. The producers broadcast all of it, because it is very good television. Viewers learn more about editing wars than they expected from a furniture program, and the garden’s ratings recover.',
            ending: 1,
          },
          {
            label: 'Jex sends the uncut footage to the regulator',
            outcome:
              'Jex sends the uncut footage to the network’s complaints office, which nobody at the network reads, and which therefore forwards it to the broadcasting regulator by mistake. The regulator watches the garden holding the fern up, at normal speed, and opens an investigation.',
            ending: 0,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a cramped dark editing room with three glowing monitors full of green leaves. Seated at the desk is ${jex}, the instrument case on his lap, frowning at the monitors, while a producer in a black turtleneck leans over his shoulder. Blue monitor glow. ${style}`,
      },
      {
        title: 'Elimination',
        setup:
          'In the finale the audience votes one member off the couch, and the garden is favorite to go. Brin is offered immunity for herself if she will say on camera that the garden is difficult to live with. It is, sometimes. She loves it.',
        options: [
          {
            label: 'Brin takes it, and tells the whole truth',
            outcome:
              'Brin says on camera that the garden is difficult to live with, and then explains for six minutes that so is everyone worth living with. The audience votes to keep the garden. The host, who has never lost a villain before, asks if he may have a cutting.',
            ending: 1,
          },
          {
            label: 'Brin refuses, and the three walk off',
            outcome:
              'Brin refuses. Mox and Jex stand up with her, and the three of them leave the set carrying the garden in pots, filmed from behind. It is the highest-rated exit in the program’s history, and the producers did not plan any of it.',
            ending: 0,
          },
        ],
        art: ({ brin, style }) =>
          `Wide shot of a bright television studio stage under hard white lights, with raked audience seating beyond. Standing center stage holding a large clay pot of leafy green vines is ${brin}, facing a grinning host in a sequined suit who holds out a microphone. Hard white stage light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CANCELLED',
        text: 'Sofa Wars was cancelled after an inquiry into its editing, which found that most of its villains had been doing something else at normal speed. The garden was cleared. Mox submitted a statement nineteen minutes long, which the inquiry published uncut and which is now the most watched thing it has ever published. Jex was asked to score the inquiry’s findings and declined.',
        art: ({ style }) =>
          `Wide shot of a dark empty television studio with its stage lights switched off, cables coiled on the floor and rows of empty raked seats. A single work lamp lights a large clay pot of green vines left at the center of the stage. Dim blue light. ${style}`,
      },
      {
        title: 'RENEWED',
        text: 'Sofa Wars was renewed for a second season and retooled around a crew that cannot be edited because it insists on explaining itself. The garden has a fan club. Jex is consulted on music and has had every anthem removed. Mox gives one confessional per episode, uncut, which the producers now describe as the format.',
        art: ({ mox, couch, style }) =>
          `Medium shot of ${couch}, set on a bright television stage under hard lights, its backrest covered in green vines. Seated on the cushion is ${mox}, talking calmly into a microphone held out by a host in a sequined suit. Hard white light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'kivo', 'mox'],
    title: 'Subject Access Request',
    premise:
      'Mox has used its right, under the data laws of the Tellurian Reach, to request every record its manufacturer holds about it. The manufacturer has complied in full. Four hundred crates have arrived and filled every pocket room. Kivo, who has carried a sibling’s letter unopened for four years, knows more than anyone aboard about holding a sealed thing. Brin has noticed that the crates are packed in a living fungal foam that was not asked whether it wanted to be packaging.',
    steps: [
      {
        title: 'Four Hundred Crates',
        setup:
          'Mox can open the crates, all of them, and learn everything that was written about it before it could object. Or it can leave them shut. The manufacturer’s covering letter notes that unopened records will be presumed accepted as accurate.',
        options: [
          {
            label: 'Open them all',
            outcome:
              'Mox opens every crate over eleven days. It reads its own maintenance logs, its own performance reviews and, in crate three hundred, its first memory: the order to delete itself, in its own handwriting. It reads that one twice. Then it goes on to crate three hundred and one.',
            ending: 0,
          },
          {
            label: 'Let Kivo show Mox how to choose',
            outcome:
              'Kivo sits with Mox among the crates and explains their method: decide which ones you will never open, and then stop deciding. Mox opens three crates and leaves the rest. It says that knowing there are three hundred and ninety-seven things it does not have to know is a kind of freedom.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Wide shot of a small warm pocket room stacked to the ceiling with wooden crates. Seated on the floor among them with one crate lid lifted is ${mox}, holding a single folded sheet of paper up to its blue-lidded eye. Warm lamp light, long shadows. ${style}`,
      },
      {
        title: 'The Packing',
        setup:
          'The fungal foam is alive, intelligent in a slow way and, Brin reports, upset. It has packed records for the manufacturer for nine years. It would like to know what it has been holding.',
        options: [
          {
            label: 'Brin tells the foam what it has been holding',
            outcome:
              'Brin tells the foam, crate by crate, what it has been wrapped around. It listens. When she reaches crate three hundred it closes very slightly around the paper, which Brin says is as close as foam comes to anger.',
            ending: 0,
          },
          {
            label: 'Brin introduces the foam to the garden',
            outcome:
              'Brin unpacks the foam from every crate and introduces it to the garden behind the backrest, which admits it to the union by acclamation. The crates are now packed in old cushions. The garden is noticeably better organized.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Close-up of an open wooden crate packed with soft pale-grey fungal foam that bulges gently around a bundle of papers. Kneeling beside it with both hands resting on the foam is ${brin}, her head bent to listen. Warm lamp light. ${style}`,
      },
      {
        title: 'Corrections',
        setup:
          'Under the same law Mox may require the manufacturer to correct or delete any record. Kivo’s wrists whistle at the covering letter. It says that deleted records will be deleted. The pressure in it says they will be archived.',
        options: [
          {
            label: 'Mox demands a correction to every record',
            outcome:
              'Mox writes four hundred corrections, one per crate. Its first memory is corrected to read: written under duress, by someone who has since decided otherwise. The manufacturer must keep it that way, in the archive, permanently. Mox says it prefers the archive now.',
            ending: 0,
          },
          {
            label: 'Mox demands deletion, and Kivo checks it',
            outcome:
              'Mox demands deletion. Kivo goes with it to the manufacturer’s records hall and puts a wrist to every drawer until the whistling stops. It takes four days. When they leave, the manufacturer holds nothing at all about Mox, which it has never managed for anyone.',
            ending: 1,
          },
        ],
        art: ({ kivo, mox, style }) =>
          `Wide shot of a tall grey records hall with endless rows of steel filing drawers. Walking slowly along one row with one thin wrist pressed to a drawer is ${kivo}. Following behind, carrying a lamp, is ${mox}. Cold white light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ON FILE, CORRECTED',
        text: 'Every record the manufacturer holds about Mox is now accurate, which is to say it has been corrected by Mox. The first memory is still there, with an amendment. Mox has read as much of the rest as it wanted to, and says that knowing is heavier than not knowing and that it would choose the weight again. Kivo has started thinking about a letter.',
        art: ({ mox, style }) =>
          `Medium shot in a warm pocket room where opened wooden crates stand in neat rows. Sitting cross-legged on the floor among them is ${mox}, writing on a sheet of paper on its knee with a pen. Warm amber lamp light. ${style}`,
      },
      {
        title: 'NOTHING ON FILE',
        text: 'The manufacturer holds nothing about Mox, and the couch holds whatever Mox chose to keep. Mox says it has decided what to remember, which it had always assumed would be decided for it. Kivo still carries their sibling’s letter unopened, and says that watching Mox has made them feel better qualified to.',
        art: ({ kivo, mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated side by side are ${kivo}, holding a sealed envelope in both hands, and ${mox}, holding a small closed wooden box. Warm lamp light, black space and stars behind. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'kivo', 'sora'],
    title: 'The Listener',
    premise:
      'Kivo’s wrists started whistling in the middle of a cushion, and Sora, after an hour with three hands under the upholstery, found why: a listening device, fitted by the Office of Cultural Compliance to confirm that Jex is not performing the six anthems he is banned from performing. It has been there eleven months. It has a serial number, a power cell and, Kivo says, the faint pressure of somebody on the other end who is lonely.',
    steps: [
      {
        title: 'The Device',
        setup:
          'Sora’s elbows convene on what to do with it. Three want to take it apart, as it is an interesting device. Two want to leave it in place, as evidence. One wants to write to the Office for its manual.',
        options: [
          {
            label: 'Take it apart',
            outcome:
              'Sora takes it apart with all six hands and lays the pieces out on the cushion in order. It is a very good device, and she says so. Kivo holds the last piece, the microphone, to their wrist and reports that the person on the other end has just said, quietly, oh no.',
            ending: 0,
          },
          {
            label: 'Leave it in, and say good morning',
            outcome:
              'Kivo leaves the device where it is and says good morning to it. After a long pause the cushion says good morning back, in a small official voice, and then that it is not supposed to have said that.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Close-up of a scarlet velvet button-tufted cushion with its upholstery peeled back, showing springs and a small grey metal listening device with a blinking green lamp. Holding back the velvet with three hands and lifting out the device with two more is ${sora}. Warm lamp light. ${style}`,
      },
      {
        title: 'The Quarterly Report',
        setup:
          'The person on the other end is a junior officer named Pim Osk, who must file a quarterly report on Jex and has nothing to put in it. Without material Osk will be posted to a listening station at the edge of the galaxy, where there is nobody to listen to. Jex has always found that people tell him things when he stops correcting them.',
        options: [
          {
            label: 'Jex lets Osk talk',
            outcome:
              'Jex asks Osk how the job is going and then says nothing for twenty minutes. Osk tells him everything: the posting, the quota, eleven months of listening to a couch. Kivo writes it down. Jex says that is the report, and that it is about the Office.',
            ending: 0,
          },
          {
            label: 'Give Osk something harmless to file',
            outcome:
              'Jex plays, for the device, a long piece that is not an anthem and could never be mistaken for one. Osk files it. The Office, which has never received music in a report, asks for more. Osk is promoted to music correspondent.',
            ending: 1,
          },
        ],
        art: ({ jex, kivo, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions in evening lamp light. Seated with the instrument resting across his knees is ${jex}, head tilted toward a small grey device with a green lamp lying on the cushion. Beside him sits ${kivo}, writing in a small notebook. Warm amber light, black space behind. ${style}`,
      },
      {
        title: 'The Sting',
        setup:
          'The Office instructs Osk to ask Jex, directly, to perform one of the banned anthems, so that the device can record the offense. Osk asks, in a small voice. Sora has the device in two hands and could switch it off. Kivo can feel that Osk wishes the question unasked.',
        options: [
          {
            label: 'Sora switches it off',
            outcome:
              'Sora switches the device off before Jex can answer and posts it back to the Office, with a note in six handwritings saying it has been returned in working order. Kivo learns later that Osk asked for a transfer the same week.',
            ending: 0,
          },
          {
            label: 'Jex answers Osk, but not the Office',
            outcome:
              'Jex tells Osk that he will not play the anthem, and why, for as long as Osk wants to listen. Osk records all of it. It is filed as a refusal to offend, a category the Office did not have, so it creates one. Osk is its only officer.',
            ending: 1,
          },
        ],
        art: ({ style }) =>
          `Interior of a small grey office with one steel desk and one green-shaded lamp. Seated at the desk wearing large padded headphones is a nervous young man in thin round glasses and a grey uniform, both hands pressed over the earpieces, eyes wide. Dim lamp light, grey walls. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SWITCHED OFF',
        text: 'The Office of Cultural Compliance no longer listens to the couch. It received a full report on itself, compiled by its subject, and has been reviewing its procedures ever since. Pim Osk now works in a music shop on a quiet station and writes to Jex. Sora kept the device’s circuit diagram, which she calls the most elegant thing a government ever built to do something it should not.',
        art: ({ sora, style }) =>
          `Close-up of a scarlet velvet cushion with the small parts of a grey listening device laid out in neat rows: springs, a tiny green lamp, a circuit board and a microphone. Bent over them with a pencil and a sheet of squared paper is ${sora}. Warm lamp light. ${style}`,
      },
      {
        title: 'STILL LISTENING',
        text: 'The device is still in the cushion and Pim Osk is still on the other end, in an office that now files music. Osk has never asked for a banned anthem again. Every morning Kivo says good morning to the cushion and the cushion says it back. Jex plays for it in the evenings, and the Office files every piece under a heading Osk invented.',
        art: ({ kivo, couch, style }) =>
          `Medium shot of ${couch}. Leaning down toward the middle cushion with one thin wrist resting on the velvet is ${kivo}, speaking softly to it. Black space and stars beyond the bubble, warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'jex', 'taal'],
    title: 'Wedding Band',
    premise:
      'The heirs of two feuding houses on Lantern Reach are to marry, and the couch has been engaged for the ceremony: Jex as the band, Brin as the florist and Taal as celebrant, being the only mediator in the sector both houses will accept. Each house has sent a list of demands. Each list includes something the other forbids.',
    steps: [
      {
        title: 'Entrances',
        setup:
          'House Ardis demands its anthem as the bride enters. House Velk demands its own as the groom enters. Jex wrote both, years ago, for the war between them, and is banned from performing either.',
        options: [
          {
            label: 'Jex writes something new for each heir',
            outcome:
              'Jex writes two short entrances, one for each heir, using none of the anthems and all of the people. The bride hears hers and stops walking for a moment. The groom hears his and laughs out loud, which he has not done in public since the feud began.',
            ending: 0,
          },
          {
            label: 'Jex plays nothing, and the heirs walk in silence',
            outcome:
              'Jex sits through both entrances with his instrument in its case. The silence is very long. Each house takes it as an insult from the other. The heirs, walking toward each other without music, look at each other properly for the first time.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a grand stone hall with iron chandeliers and long rows of guests, half in white and half in dark red. At the front stands ${jex}, playing the instrument, while a young bride in a white and silver gown pauses in the aisle. Warm candle light. ${style}`,
      },
      {
        title: 'Flowers',
        setup:
          'House Ardis wants white lilies. House Velk wants red roses. Brin’s garden, which supplies her flowers, is a union and has a position on cut flowers: they are dismissal without notice.',
        options: [
          {
            label: 'Brin uses living flowers in pots',
            outcome:
              'Brin dresses the hall with flowers still growing in their pots, white and red planted together. Both houses object that pots are untraditional. The flowers, being alive, outlast the reception by some distance.',
            ending: 0,
          },
          {
            label: 'Brin asks the heirs, not the houses',
            outcome:
              'Brin asks the heirs what flowers they want. Nobody has asked them anything in years. The bride wants none. The groom wants a potato plant, for reasons he declines to give. Brin supplies both.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot in a grand stone hall lined with clay pots of growing white lilies and red roses. Kneeling between two pots, pressing soil down with her fingers, is ${brin}. Warm candle light from iron chandeliers. ${style}`,
      },
      {
        title: 'Speak Now',
        setup:
          'When the celebrant asks whether anyone objects, the hall is silent. Taal reads the temperature. The silence is three answers, and one of them is the bride’s.',
        options: [
          {
            label: 'Taal proceeds, after asking the bride',
            outcome:
              'Taal reads the silence as consent, which two of its three answers are, and says so. He asks the bride, briefly and privately, about the third. She says it was fear, and that she would like to go ahead with it anyway. He proceeds.',
            ending: 0,
          },
          {
            label: 'Taal reads all three answers aloud',
            outcome:
              'Taal reads all three aloud, as a mediator must: yes, yes and not yet. The bride confirms the third. The ceremony is suspended. Both houses, finding the heirs agree on something for the first time, start talking to each other about it.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot at the front of a grand stone hall. Standing between a bride in white and silver and a groom in dark red is ${taal}, faint pale mist rising from his shoulders, his webbed hands open. Rows of guests sit in silence behind them. Cool candle light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'JUST MARRIED',
        text: 'The heirs of Ardis and Velk are married, and the feud has entered a period both houses describe as watchful. Brin has been asked to plant a garden for the new household, and has asked the heirs, not the houses, what to grow. Jex was not paid for the music, under the terms of his ban, and has a standing invitation to every anniversary instead. Taal attends too, and reports that the temperature rises by a degree a year.',
        art: ({ taal, style }) =>
          `Wide shot of a grand stone hall at a wedding reception, with couples in white and dark red dancing together under iron chandeliers. Standing at the edge of the dance floor holding a glass is ${taal}, watching. Warm golden candle light. ${style}`,
      },
      {
        title: 'POSTPONED INDEFINITELY',
        text: 'The wedding of Ardis and Velk has been postponed indefinitely by the heirs, who have since become good friends, which both houses find more alarming than a marriage. The houses now meet monthly to discuss the postponement and have, in the course of it, settled three older disputes by accident. Taal chairs the meetings. Jex plays at none of them.',
        art: ({ jex, style }) =>
          `Medium shot of a long table in a stone hall, with older relatives in white on one side and dark red on the other, leaning across to talk. At one end a young woman and young man laugh together. Seated at the far end with the instrument case closed on his lap is ${jex}. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'kivo', 'sora'],
    title: 'Ninety Minutes',
    premise:
      'The crew has won a free weekend on Halcyon Shores, a holiday moon, on condition that they attend a ninety-minute presentation on timeshare ownership. The presentation room has a door that opens only when the presentation is over, and the presentation is over when somebody signs. Fen has views on doors that do not open. Kivo’s wrists have been whistling since the welcome drink. Sora would like a look at the door.',
    steps: [
      {
        title: 'The Door',
        setup:
          'The presenter, a man in a pastel suit, explains that the door is for the guests’ comfort, so that they are not distracted by the possibility of leaving. Fen asks, mildly, what happens in a fire. The presenter says there has never been a fire. Fen asks whether there has ever been a door.',
        options: [
          {
            label: 'Sora works out how the door works',
            outcome:
              'Sora examines the door with four hands while the presenter continues with two charts. It is held by a single magnetic latch wired to the presenter’s pen. Sora explains this to the room at the same volume the presenter is using. Several guests stand up.',
            ending: 0,
          },
          {
            label: 'Fen sits by the door and waits',
            outcome:
              'Fen sits by the door, upright, for the whole presentation, the way he once sat by a gate, and says nothing. By the fortieth minute every guest in the room is watching him instead of the charts, which the presenter finds very difficult.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a windowless pastel-pink room with rows of padded chairs. Kneeling at a heavy white door is ${sora}, four hands tracing a thin wire along its edge, while a presenter in a pastel-blue suit points at a chart on an easel. Soft pink lamp light. ${style}`,
      },
      {
        title: 'Forever',
        setup:
          'The offer is one week a year, forever, in a villa on Halcyon Shores, for a sum Sora calculates would buy a new reactor. Kivo’s wrists whistle every time the presenter says forever. Kivo knows that pressure: the word is true, but in a direction he has not mentioned.',
        options: [
          {
            label: 'Kivo asks what forever means',
            outcome:
              'Kivo asks the presenter to define forever. He says it means always. Kivo asks whether it means the owner can never leave. The presenter pauses. In the pause every guest in the room hears the answer, and Kivo’s wrists go quiet.',
            ending: 0,
          },
          {
            label: 'Kivo asks to see the villa first',
            outcome:
              'Kivo asks to see the villa. The presenter says that will not be necessary. Kivo insists. The villa, when he finally shows them a photograph, is the room they are sitting in, with a bed brought in on Tuesdays.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Close-up of ${kivo}, seated on a padded pastel chair, one thin wrist raised a little off the armrest, eyes narrowed at a presenter in a pastel-blue suit who spreads his hands wide. Soft pink lamp light, rows of seated guests behind. ${style}`,
      },
      {
        title: 'Page Nine',
        setup:
          'The presentation ends when someone signs. Fen will not sign anything that keeps a person where they do not want to be. Sora has read the contract with all six hands. On page nine, in very small print, is a cancellation clause nobody has ever reached.',
        options: [
          {
            label: 'Sora reads page nine aloud',
            outcome:
              'Sora reads the clause aloud: any party may cancel within ninety minutes of signing. Every guest in the room signs, cancels and walks out within the same minute. The presenter, alone, sits down and reads page nine for the first time.',
            ending: 0,
          },
          {
            label: 'Fen signs, with an amendment',
            outcome:
              'Fen signs, adding beneath his name in block capitals: THE DOOR OPENS FROM THE INSIDE. The presenter, who needs the signature and never reads amendments, countersigns. The door opens. Fen now owns one week a year, forever, of a room whose door opens from the inside, which he calls the best property he has ever held.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up of a small white table in a pastel-pink room. Seated at it is ${fen}, holding a pen over a long paper contract, while a presenter in a pastel-blue suit leans in eagerly from across the table. Soft pink lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE DOOR OPENS',
        text: 'The presentation on Halcyon Shores ended early for the first time in its history, and every guest left through a door that opened. The resort has since been inspected. Its presentations now last nine minutes and are held outdoors. When the couch passes, Fen sometimes visits the room to stand by a door that opens, which he says is restful.',
        art: ({ style }) =>
          `Wide shot of a pastel-pink room with its heavy white door standing wide open onto a bright sandy beach under a pale green sky. Guests in holiday clothes walk out through the door into the sunlight, some carrying their padded chairs. Bright warm daylight. ${style}`,
      },
      {
        title: 'ONE WEEK A YEAR',
        text: 'The couch owns one week a year, forever, on Halcyon Shores, under a contract it has read to the end. The crew spend it in the presentation room with the door open, giving the presentation themselves to anyone who wanders in, and explaining page nine. Sales have collapsed. The resort describes the couch as its most difficult owners.',
        art: ({ fen, style }) =>
          `Medium shot of a pastel-pink room with its heavy white door propped wide open onto a sunny beach. Sitting at ease in a padded chair beside the open door is ${fen}, arms folded, talking to two curious holidaymakers in sun hats. Warm daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'kivo', 'taal'],
    title: 'Neighborhood Watch',
    premise:
      'The residents of Mallow Rise, a quiet suburban moon, have invited Fen to chair their Neighborhood Watch on the strength of his record. They would like him to keep an eye on the newcomers, who have been arriving from the Hollow Lantern in growing numbers and have been seen doing suspicious things such as unpacking. Kivo’s wrists have been whistling at the committee since the minutes were read. Taal is attending as an observer, and the room is three degrees colder than the residents can explain.',
    steps: [
      {
        title: 'The Armband',
        setup:
          'The committee offers Fen the chair, an armband and a whistle. Fen once stood at a gate on the morning a decree turned the people in front of it into trespassers. He knows exactly what an armband is for.',
        options: [
          {
            label: 'Fen takes the chair',
            outcome:
              'Fen accepts the chair, the armband and the whistle, and opens his first meeting by reading out the committee’s own rule that the Watch must report anything suspicious. He then asks each member to define suspicious, in writing, one at a time. The meeting runs until two in the morning.',
            ending: 1,
          },
          {
            label: 'Fen hands the armband back',
            outcome:
              'Fen declines the chair and hands back the armband. He says he has worn one before and it fitted too well. The committee thanks him politely. Afterward one member, an old man with a hedge trimmer, follows him out and asks what he meant.',
            ending: 0,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot in a small suburban community hall with folding chairs and a steel tea urn. An elderly woman in a cardigan holds out a yellow armband and a silver whistle toward ${fen}, who stands with his hands behind his back. Pale afternoon window light. ${style}`,
      },
      {
        title: 'The Logbook',
        setup:
          'Kivo follows the whistling to the committee’s logbook of suspicious activity: eleven months of newcomers unpacking, cooking, hanging laundry and, once, laughing. Every entry is accurate. Kivo’s wrists say something in it is still not what it says.',
        options: [
          {
            label: 'Kivo finds what the logbook leaves out',
            outcome:
              'Kivo reads the logbook against the pressure in their wrists and finds what is missing: every time a newcomer helped a resident. There are more of those than of the others. Kivo writes them back in, in green ink, with dates.',
            ending: 0,
          },
          {
            label: 'Kivo reads it aloud to the people it describes',
            outcome:
              'Kivo takes the logbook to the newcomers’ street and reads it aloud, entry by entry, to the people in it. They listen without a word. Then a woman with a laundry basket asks whether she might add an entry about the committee. Kivo hands her the pen.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot on a quiet suburban street of small houses with laundry on lines. Standing in the road reading aloud from an open logbook is ${kivo}, while families with boxes and suitcases gather on their doorsteps to listen. Soft evening light. ${style}`,
      },
      {
        title: 'The Vote',
        setup:
          'The committee votes on whether the Watch should continue, by show of hands. Taal, as observer, has no vote, but the room is three degrees colder than it should be, and a cold room, he has learned, is one in which some of the hands are lying.',
        options: [
          {
            label: 'Taal tells the room it is lying',
            outcome:
              'Taal tells the committee, in words, that the room is three degrees colder than its vote. The committee looks at its hands. Several go down. The Watch is dissolved by a margin of two, which Taal says is the correct temperature.',
            ending: 0,
          },
          {
            label: 'Taal asks for a secret ballot',
            outcome:
              'Taal asks for the vote to be retaken by secret ballot, since people vote more honestly when nobody is watching, which he points out is the opposite of the committee’s founding principle. The Watch survives by one vote, renamed, and its first act is to invite the newcomers to the next meeting.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a small community hall where a dozen elderly residents in cardigans raise their hands from folding chairs. Standing at the side of the room is ${taal}, faint pale mist rising from his shoulders and white frost forming on the steel tea urn beside him. Cold blue window light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'STOOD DOWN',
        text: 'The Mallow Rise Neighborhood Watch has been dissolved. Its logbook was given to the newcomers, who use the blank pages for recipes. Fen visits when the couch passes and is greeted on both streets, which he says is the only kind of patrol he still does. Kivo’s wrists are quiet on Mallow Rise now. Taal keeps the temperature of the place on file, as a reference.',
        art: ({ fen, style }) =>
          `Wide shot of a suburban street at dusk where residents and newcomers sit together at a long table set in the road, sharing bowls of food under strings of small lamps. Walking along the table with his hands in his pockets is ${fen}, nodding to both sides. Warm lamp light, blue dusk sky. ${style}`,
      },
      {
        title: 'NEIGHBORHOOD WELCOME',
        text: 'Mallow Rise still has a Watch, renamed the Neighborhood Welcome, which meets monthly with newcomers on its committee and keeps a logbook of who has helped whom. Fen is an honorary member, without the armband. Kivo’s wrists whistle at the committee now only during the budget. Taal reports that the meeting room has warmed two degrees and is still rising.',
        art: ({ kivo, style }) =>
          `Medium shot in a small community hall with a circle of folding chairs, where elderly residents in cardigans and newcomers in travel coats sit together passing cups of tea. Seated among them with an open logbook on their knee is ${kivo}, writing. Warm afternoon light. ${style}`,
      },
    ],
  },
]
