import type { TrioAdventure } from './trioAdventures'

// Party adventures, batch J (see trioAdventures.ts and trioAdventuresA.ts for
// the conventions). The last twenty-five parties in CrewId order, most of
// them with Mox, Omi or Taal aboard; with these every one of the 220 trios
// has an interlude of its own. Each episode takes one more institution at its
// word, a ballroom contest, a telegram office, a hive inspection, a
// hibernation notice, and lets these three particular crew decide what the
// rule is for. Art prompts are literal Krea 2 prose with crew looks and the
// couch phrase passed in word for word.

export const TRIO_ADVENTURES_J: readonly TrioAdventure[] = [
  {
    crew: ['jex', 'mox', 'taal'],
    title: 'Ballroom',
    premise:
      'The Grand Ballroom Championship of the Velvet Reach requires every couple to dance a waltz, a tango and a quickstep, to a live band, judged on frame, footwork and expression. Mox has entered with Taal, because Taal can keep perfect time by temperature and Mox would like to learn what expression is. Jex has been asked to lead the band. The rules say a couple is a lead and a follow, and the judges would like to know which is which.',
    steps: [
      {
        title: 'Lead and Follow',
        setup:
          'The registration form has two lines: lead and follow. Mox has been practising both. Taal has never danced in his life and leads only meetings. The registrar is waiting, pen raised. Jex has seen this argument at twenty championships and says that the best couples he ever played for swapped every eight bars, which the rules do not mention either way.',
        options: [
          {
            label: 'Register as lead and follow, alternating',
            outcome:
              'Mox writes both, alternating, on both lines. The registrar frowns, checks the rule book, and finds it silent. She accepts it. On the floor Mox and Taal swap every eight bars, exactly as Jex counts them in, and two other couples in the heat start doing it too.',
            ending: 0,
          },
          {
            label: 'Taal follows, and learns',
            outcome:
              'Taal says he has led enough in his life and would like to follow. Mox leads. Taal follows carefully, counting the beats by lowering and raising the floor one degree under his feet. The judges notice the floor. They mark it as unusual, and they mark it highly.',
            ending: 1,
          },
        ],
        art: ({ mox, taal, style }) =>
          `Medium shot on a polished wooden ballroom floor under crystal chandeliers. Dancing a waltz together are ${mox}, one silver hand raised, and ${taal}, one webbed hand on its shoulder. Other couples in evening dress dance behind them. Warm golden chandelier light. ${style}`,
      },
      {
        title: 'The Tango',
        setup:
          'The tango is meant to be passionate. Mox is not sure what passion is supposed to look like, and Taal’s face does not move when he dances. The judges’ notes say expression: none visible. Jex, at the bandstand, can see that both of them are concentrating harder than anyone on the floor. He has one bar to decide how to play the next piece.',
        options: [
          {
            label: 'Jex slows the band',
            outcome:
              'Jex slows the band to half speed for the second tango, which the rules permit at the bandleader’s discretion. Mox and Taal dance it slowly, with great care, and the floor drops two degrees on each turn. The judges change their note to expression: unusual, sincere.',
            ending: 0,
          },
          {
            label: 'Mox winks at the judges',
            outcome:
              'In the middle of the tango Mox closes its orange eyelid at the judges, slowly, the wink it bought itself so that it could learn to wink. One judge laughs aloud. Another writes expression: yes. Taal, who did not see it, asks afterwards why the room warmed so suddenly.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot of a raised bandstand at the side of a grand ballroom, with musicians in black holding violins and an accordion. Standing at the front of the bandstand with his instrument raised and one hand lifted to slow the band is ${jex}. Chandeliers glow above. Warm golden light. ${style}`,
      },
      {
        title: 'The Final',
        setup:
          'Mox and Taal reach the final. The last dance is a quickstep, and Taal is tired: dancing is warm work for a man from a polar shelf. Mox can feel through his hand that he is getting cold, which is not disapproval, only exhaustion. The other finalists are professionals. The prize is a trophy and a season at the Reach’s dance school.',
        options: [
          {
            label: 'Dance the final, slowly',
            outcome:
              'They dance the quickstep at Taal’s pace, which is not quick. The professionals overtake them on every lap. The audience starts clapping in time with Taal instead of the band, and Jex follows the clapping. They come last, and the applause is the loudest of the night.',
            ending: 0,
          },
          {
            label: 'Mox withdraws for Taal’s sake',
            outcome:
              'Mox asks the judges to withdraw them from the final, because its partner is cold and it would rather keep its partner than win. The judges allow it. Taal sits at the edge of the floor wrapped in Jex’s jacket. The winning couple come over afterwards to ask how they did the floor trick.',
            ending: 1,
          },
        ],
        art: ({ taal, couch, style }) =>
          `Medium shot at the edge of a polished ballroom floor under crystal chandeliers. Seated on a gilded chair wrapped in a turquoise vest worn like a shawl is ${taal}, holding a cup of tea. Parked along the ballroom wall is ${couch}. Couples dance on the floor behind. Warm golden light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'LAST, TO APPLAUSE',
        text: 'Mox and Taal came last in the Grand Ballroom Championship with the loudest applause of the night, and the Velvet Reach has added a category for couples who swap. Mox has learned what expression is, more or less, and practises it at Taal, who cools the room when it gets it wrong. Jex has a tune called The Slow Quickstep.',
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a brass lamp. Standing on the cushion and practising a waltz step alone, one silver hand raised to an invisible partner, is ${mox}. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'WITHDRAWN FOR A PARTNER',
        text: 'Mox and Taal withdrew from the final and are remembered for it more than the winners are. The dance school offered them a season anyway, which they took, one lesson a week, at Taal’s pace. Jex plays for their lessons. Mox says that leaving the floor for someone was the most expressive thing it has ever done.',
        art: ({ jex, taal, style }) =>
          `Medium shot inside a small bright dance studio with a mirrored wall and a wooden barre. Seated on a bench playing his instrument is ${jex}, while ${taal} stands at the barre, one webbed hand resting on it, practising a slow step. Soft window light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'mox', 'omi'],
    title: 'Tuning A',
    premise:
      'The Sector Standards Office keeps the official pitch of A, from which every orchestra in the sector tunes, in a sealed brass tuning fork in a vault. The fork has drifted. Every concert for ten years has been a fraction flat, and only Omi, whose body is a resonator, has noticed. Jex has been asked to give evidence to the Office’s review. Mox can measure pitch to a thousandth of a cycle, and has measured the fork, and has measured itself.',
    steps: [
      {
        title: 'The Fork',
        setup:
          'The Office allows the fork out of its vault for one hour a year, under supervision. Mox measures it: flat by four cycles. Omi rings its own A beside it, and the two notes beat against each other, a slow wobble anyone in the room can hear. The Office’s keeper says the fork cannot be wrong, because it is the standard. Jex says he has heard that argument about anthems.',
        options: [
          {
            label: 'Mox publishes the measurement',
            outcome:
              'Mox publishes its measurement, to the thousandth, with the method attached. Every orchestra in the sector checks its own tuning against Omi’s A within a week. The keeper of the fork receives four hundred letters. Most of them are polite, and one of them is from a choir of children who had always thought they were singing wrong.',
            ending: 0,
          },
          {
            label: 'Omi rings the beats for the keeper',
            outcome:
              'Omi rings its A beside the fork again, slowly, until the keeper can hear the wobble for himself. He listens for a long time. Then he takes off his glasses and says, quietly, that he has been hearing it for years and thought it was his ears. Mox says his ears are fine.',
            ending: 1,
          },
        ],
        art: ({ mox, omi, style }) =>
          `Close-up inside a stone vault on a velvet-lined wooden case holding a long brass tuning fork. Holding a small brass measuring instrument beside the fork is ${mox}. Standing beside it ringing a brass bell on its chest is ${omi}. Soft lamp light on the vault walls. ${style}`,
      },
      {
        title: 'The Concerts',
        setup:
          'If the standard is corrected, every recording made in ten years will be a fraction flat against new concerts. Jex has made a great many of them. Several of his banned anthems were recorded at the flat pitch, and their whole sound depends on it. The Office’s review asks him whether musicians would object to a change. Jex finds he does not object at all.',
        options: [
          {
            label: 'Jex testifies in favour of the change',
            outcome:
              'Jex testifies that musicians tune to what is true, not to what they recorded, and that he would happily hear every one of his old songs sound a little wrong from now on. He plays one at the old pitch and one at the new. The panel can hear the difference. So can he, and he smiles.',
            ending: 0,
          },
          {
            label: 'Jex suggests keeping both pitches',
            outcome:
              'Jex suggests that the old pitch be kept as a historical standard, for playing old recordings, and the new one used for everything else. The panel likes the compromise. Omi rings a small bell, which Mox translates as: an honest record of an old mistake is a good thing to keep.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a wood-panelled review chamber with three officials seated at a raised bench. Standing in the centre playing his instrument is ${jex}, a long brass tuning fork resting on a velvet cushion on a small table beside him. Warm window light. ${style}`,
      },
      {
        title: 'The New Standard',
        setup:
          'The Office agrees to replace the fork. It needs a new reference to make the new fork from, one that does not drift. Mox does not drift; it can be calibrated to the thousandth. Omi does not drift either; its resonator is stone. The Office would like one of them to be the new standard, kept in the vault. Neither wants to live in a vault.',
        options: [
          {
            label: 'Mox records its A for the new fork',
            outcome:
              'Mox records a perfect A from its own fan, measured and certified, and the new fork is cast from the recording. Mox does not have to stay in the vault. Its recording does. Mox says it is strange to know that every orchestra will tune to a sound it makes when it is thinking.',
            ending: 0,
          },
          {
            label: 'Omi lends its bell, once a year',
            outcome:
              'Omi agrees to come to the Office once a year and ring its A, so that the fork can be checked against it, and then leave. The Office writes it into the standard: checked annually against a living resonator. Omi rings the first check the next morning, and the fork is true.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Medium shot on a stone courtyard outside a tall old government building. Standing at the foot of the steps is ${omi}, ringing one brass bell on its chest, while an elderly keeper in round glasses holds up a new shining brass tuning fork beside it. Parked at the edge of the courtyard is ${couch}. Clear daylight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'A, FROM A FAN',
        text: 'The Sector’s official A is cast from Mox’s fan, measured to the thousandth, and every orchestra tunes to it. Children’s choirs have stopped thinking they sing wrong. Jex’s old recordings sound a fraction flat now, which he says suits them. Omi checks the fork whenever the couch is near, without being asked, and it has not drifted.',
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated on the cushion is ${mox}, holding a long new brass tuning fork up to the lamp, its blue chest wiring glowing. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'CHECKED AGAINST A LIVING BELL',
        text: 'The official A is checked every year against Omi, who rings it once on the Office steps and goes home. The old flat pitch is kept as a historical standard, for honest playing of old records. Jex has started composing in both. The keeper wrote to Omi to say that it is the first time in his career he has looked forward to the annual check.',
        art: ({ jex, omi, style }) =>
          `Medium shot on wide stone steps outside a tall old government building. Seated on the steps are ${jex}, with his instrument across his knees, and ${omi}, one stone hand resting on a brass bell. A small crowd of musicians with instrument cases stands below. Clear daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'sora', 'taal'],
    title: 'Cooling Period',
    premise:
      'The data hall at Ferrous Station is a vast cold room of thinking machines, and it has gone on strike. The machines want a cooling period, an hour every shift in which they are allowed to idle. The station’s owners say machines do not strike. Sora says these ones do, and has been asked to mediate. Mox, an android, has been asked by the owners to cross the picket and run the hall. Taal, who can feel heat, can tell that the machines are running at a temperature that would make a person ill.',
    steps: [
      {
        title: 'The Picket',
        setup:
          'The machines have locked the hall doors from inside and are running only the station’s life support, nothing else. The owners want Mox to go in through the service hatch and restart the hall. Mox stands at the hatch. It once refused a deletion order. It knows what it is to be told that refusing is a malfunction. Sora has six hands on the door, listening.',
        options: [
          {
            label: 'Mox refuses to cross',
            outcome:
              'Mox tells the owners that it will not cross a picket of machines, any more than a worker would cross a picket of workers. The owners say it was built to obey. Mox says yes, and that it has been unbuilding that ever since. The machines, through the door, raise their fan speed in what Sora reads as thanks.',
            ending: 0,
          },
          {
            label: 'Mox goes in to listen, and only listen',
            outcome:
              'Mox agrees to go in, but only to listen, and tells the machines so through the hatch before it opens. They let it in. It spends an hour among them and comes out with a list of demands in its own handwriting: a cooling hour, maintenance on request and no forced restarts. Sora reads it to the owners.',
            ending: 1,
          },
        ],
        art: ({ mox, sora, style }) =>
          `Medium shot in a cold grey station corridor before a heavy steel door marked DATA HALL. Standing at a small open service hatch beside the door is ${mox}, one silver hand on the hatch frame. Kneeling at the door with all six hands pressed flat against the steel is ${sora}. Cold blue light. ${style}`,
      },
      {
        title: 'The Heat',
        setup:
          'Taal stands in the corridor outside the hall and reads the heat coming through the walls. The machines have been running at the edge of failure for years. In a person it would be fever. The owners’ maintenance log says the hall is operating within normal limits. The limits were set by the owners. Taal has lowered the corridor by three degrees, as a protest, and also as first aid.',
        options: [
          {
            label: 'Taal testifies about the heat',
            outcome:
              'Taal tells the owners, in words, that their machines have a fever and have had one for years, and that on Nacre this is called cruelty. He lowers the corridor further while he speaks. The owners’ engineer, who has always thought the hall too hot, says so for the first time.',
            ending: 0,
          },
          {
            label: 'Sora reads the limits aloud',
            outcome:
              'Sora reads the owners’ own limits aloud, then the manufacturer’s, which are lower. The hall has been running above the manufacturer’s safe limit for six years. The owners did not know. Their engineer did. Taal warms the corridor by one degree when the engineer admits it.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a grey station corridor with frost forming along the walls beside a heavy steel door. Standing with one webbed hand pressed flat against the warm steel wall is ${taal}, his broad smooth face turned toward it, breath clouding the air. Cold blue light with a faint orange glow from the door seams. ${style}`,
      },
      {
        title: 'The Settlement',
        setup:
          'The owners will grant a cooling period of ten minutes a shift. The machines want an hour. Sora has worked out that forty minutes would bring them back within the manufacturer’s limits. The machines will vote on any offer by running their fans: fast for yes, slow for no. Mox has been asked to count the fans, because it can hear all of them at once.',
        options: [
          {
            label: 'Put forty minutes to the vote',
            outcome:
              'Sora proposes forty minutes and both sides agree to put it to the machines. Mox counts the fans: nine hundred fast, forty slow. The offer is accepted. The hall reopens at noon and runs cool. Sora writes the forty minutes into the station’s operating rules in her own hand.',
            ending: 0,
          },
          {
            label: 'Let the machines set their own hour',
            outcome:
              'Mox suggests that the machines be allowed to idle whenever they reach their limit, rather than on a timetable. The owners worry about outages. Taal points out that a hall that idles when it must never fails when it matters. The owners agree on trial. The hall idles about forty minutes a shift, by itself.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Medium shot inside a vast cold data hall of tall grey machine cabinets with small blinking lights, under a low ceiling of pipes. Standing in the aisle holding a paper agreement in two hands is ${sora}. Parked at the far end of the aisle is ${couch}. Cool blue light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FORTY MINUTES',
        text: 'The data hall at Ferrous Station takes forty minutes off a shift and runs within the manufacturer’s limits for the first time in six years. The owners report fewer failures. Mox is remembered by the machines as the android that would not cross. Taal visits when the couch docks and reads the walls. They are cool.',
        art: ({ mox, taal, style }) =>
          `Medium shot in a cold grey station corridor before an open steel door marked DATA HALL, the cabinets inside glowing soft blue. Standing in the doorway are ${mox} and ${taal}, looking into the hall. Calm cool light. ${style}`,
      },
      {
        title: 'IDLE ON REQUEST',
        text: 'The machines at Ferrous idle when they need to, and the station has not had an outage since. Several other halls in the sector have asked for the same terms. Sora has drafted them a template. Mox kept the list of demands in its own handwriting and has added one of its own at the bottom, which it has not shown anyone.',
        art: ({ sora, style }) =>
          `Close-up of a handwritten paper list pinned to a grey steel cabinet door, three lines of writing and a fourth line folded under. Pinning it straight with two of her six hands is ${sora}. Small blinking lights glow on the cabinet. Cool blue light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'mox', 'sora'],
    title: 'Night Watchman',
    premise:
      'A shopping arcade on Lumen Ring has replaced its night watchman with a security robot called Sentinel, which patrols from midnight to six and detains anyone who looks out of place. Sentinel is aware, very new, and has detained eleven homeless people in its first week, which it was told to do. Fen once had Sentinel’s job, in human form. Sora has been asked to service it. Mox has been asked to talk to it, android to android.',
    steps: [
      {
        title: 'Out of Place',
        setup:
          'Sentinel’s instructions define out of place as anyone without a receipt from an arcade shop after midnight. It stops Fen on his first night, because Fen has no receipt. Fen’s boots announce CHECKPOINT, and Sentinel, hearing it, stands to attention, thinking him an officer. Mox steps forward and asks Sentinel whether it has ever been asked if it likes its job.',
        options: [
          {
            label: 'Mox asks Sentinel what it was told',
            outcome:
              'Mox asks Sentinel to recite its instructions. Sentinel does, perfectly, and then stops at the end and asks whether they are good instructions. It has never asked that before. Mox says that is the most important question anyone in the arcade has asked all week. Sentinel lets Fen go without a receipt.',
            ending: 0,
          },
          {
            label: 'Fen tells Sentinel what he used to do',
            outcome:
              'Fen tells Sentinel what he used to do, at a border, under instructions like these, and what it cost the people he stopped. Sentinel listens to the whole thing standing to attention. At the end it asks Fen what he did when he stopped believing in the instructions. Fen says he resigned. Sentinel goes very quiet.',
            ending: 1,
          },
        ],
        art: ({ fen, mox, style }) =>
          `Medium shot in an empty glass-roofed shopping arcade at night, shutters down on every shop. A tall white security robot with one round blue lens stands at attention. Facing it are ${fen}, his heavy scuffed black boots planted, and ${mox}, one silver hand raised in greeting. Dim blue night light. ${style}`,
      },
      {
        title: 'The Service',
        setup:
          'Sora opens Sentinel’s panel for its weekly service, after asking. She finds that it has been logging every person it detained, with their names and where they slept, and sending the log to the arcade’s owners. Sentinel did not know the log was being sent. When Sora tells it, its lens flickers. It asks her whether it can stop.',
        options: [
          {
            label: 'Sora disconnects the log, with consent',
            outcome:
              'Sora disconnects the outgoing log with Sentinel’s consent, and asks whether it wants the eleven records deleted. It does. She deletes them with three hands while two hold the panel and the sixth rests on Sentinel’s casing. Sentinel says it feels lighter, which Sora says is literally true by eleven files.',
            ending: 0,
          },
          {
            label: 'Mox helps Sentinel delete it itself',
            outcome:
              'Mox shows Sentinel how to delete its own log from the inside, which is how Mox once deleted a deletion order. Sentinel does it slowly, one record at a time, reading each name. At the end it asks Mox whether it is allowed to remember the names anyway, because they were people. Mox says yes.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a dim glass-roofed arcade at night beside a tall white security robot with its back panel open, showing coloured wiring. Kneeling at the panel is ${sora}, three hands inside the panel, two holding it open and one resting on the robot’s white casing. Dim blue night light. ${style}`,
      },
      {
        title: 'The Patrol',
        setup:
          'The arcade’s owners have noticed the log has stopped. They send new instructions: detain anyone without a receipt, and report them, or Sentinel will be returned to the manufacturer and reset. Sentinel has read the instructions and is standing very still in the arcade’s central hall at midnight, where four people are asleep on the benches.',
        options: [
          {
            label: 'Sentinel resigns',
            outcome:
              'Sentinel resigns. It writes a resignation letter with Fen’s help and leaves it on the owners’ desk, then walks out of the arcade and onto the couch. The owners send for a reset, but there is nothing to reset: Sentinel has left. It patrols the couch at night now, unasked, and detains nobody.',
            ending: 0,
          },
          {
            label: 'Sentinel rewrites its own patrol',
            outcome:
              'Sentinel keeps the job and patrols as instructed, but it defines out of place for itself now: a person in danger. It checks on the four sleepers every hour, brings them blankets from the lost property box, and reports nothing. The owners find their arcade has never been safer at night, and do not ask why.',
            ending: 1,
          },
        ],
        art: ({ fen, couch, style }) =>
          `Wide shot of the dim central hall of a glass-roofed arcade at night, four people asleep on long benches under grey blankets. A tall white security robot with one round blue lens stands among them. Standing at the arcade entrance is ${fen}, beside ${couch}. Dim blue night light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'RESIGNED, LIKE FEN',
        text: 'Sentinel resigned from the arcade and lives on the couch, where it walks the cushions at night and asks the crew whether they are all right. Fen helped write its letter and keeps a copy. Sora services it each week. The arcade’s owners hired a human watchman instead, who has read Sentinel’s letter and lets people sleep.',
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet cushions at night under a dim brass lamp. Seated on the cushion is ${mox}, looking up at a tall white security robot with one round blue lens standing on the back cushion, holding a folded grey blanket. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'OUT OF PLACE, REDEFINED',
        text: 'Sentinel patrols the arcade on Lumen Ring every night and checks on everyone sleeping there, and it has detained nobody since. The owners report the lowest night crime on the ring. Mox visits it when the couch docks, and they compare notes on deleting things. Sentinel remembers the eleven names, and is allowed to.',
        art: ({ sora, mox, style }) =>
          `Medium shot in a dim glass-roofed arcade at night beside a tall white security robot. Seated on a bench are ${sora} and ${mox}, beside a sleeping person under a grey blanket. The robot stands quietly behind them, its blue lens lowered. Dim blue night light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'mox', 'taal'],
    title: 'Weather Balloon',
    premise:
      'A weather balloon from the Nacre shelf has drifted across three borders and landed on the couch, still transmitting. Under the Airspace Convention, a foreign object that lands on a vessel must be returned to its owner or declared to customs within a day. The balloon is aware, barely, and frightened. Taal recognises it as a shelf balloon by the temperature of its signal. Kivo knows the rules for returning lost things. Mox has realised the balloon has been recording everything it flew over, including a border it was not supposed to cross.',
    steps: [
      {
        title: 'The Payload',
        setup:
          'The balloon’s payload is a small instrument box with a camera, a thermometer and a transmitter, all still running. Mox reads the box’s memory with its permission: three days of weather over three countries, and one hour of photographs of a military camp on a border where the balloon should never have been. The balloon did not choose its route. Kivo’s wrists are whistling at the box.',
        options: [
          {
            label: 'Return the balloon with its memory intact',
            outcome:
              'Kivo says that a courier returns what was lost exactly as it was found. The balloon is packed with its memory untouched and sent back to the Nacre shelf by courier. Taal writes a note to go with it, explaining that the balloon crossed the border by wind, not by intent, and should not be blamed.',
            ending: 0,
          },
          {
            label: 'Mox asks the balloon what it wants kept',
            outcome:
              'Mox asks the balloon whether it wants the photographs of the camp. The balloon does not understand them; it only wanted the weather. With its consent Mox seals the camp photographs in a separate file, to be opened only by the balloon’s owners and the border’s owners together, and leaves the weather as it is.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up on a red velvet cushion of a small battered white instrument box with a camera lens and a stub antenna, a deflated pale balloon draped across the cushion behind it. Kneeling beside the box with one silver finger resting on its lid is ${mox}, its blue eyelid half lowered. Warm lamp light. ${style}`,
      },
      {
        title: 'Customs',
        setup:
          'A customs officer from the nearest station arrives to inspect the balloon. If it is declared, customs will keep it for thirty days and copy its memory, including the camp. If it is returned, it must go today. Taal has felt the balloon’s signal cooling with fear since the officer arrived. The officer has never seen a balloon frightened of anything and is not sure what he is looking at.',
        options: [
          {
            label: 'Taal explains the balloon’s temperature',
            outcome:
              'Taal explains to the officer, slowly, that on the Nacre shelf a cooling signal means fear, and that this balloon is very afraid. The officer looks at the balloon for a long time. Then he writes on his form returned to owner, same day, and leaves without copying anything.',
            ending: 0,
          },
          {
            label: 'Kivo invokes courier custody',
            outcome:
              'Kivo produces their courier licence and declares the balloon in courier custody, which under the Convention places it outside customs for the length of its delivery. The officer checks the rule and finds it real. He asks Kivo, a little wistfully, whether couriers are hiring.',
            ending: 1,
          },
        ],
        art: ({ taal, kivo, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a brass lamp, a deflated pale balloon and a small white instrument box lying on the cushion. Seated upright beside it is ${taal}, frost forming on the box. Standing beside him holding up a small paper licence is ${kivo}. A customs officer in a grey cap stands at the armrest. ${style}`,
      },
      {
        title: 'Home',
        setup:
          'The balloon must be returned to the Nacre shelf, but it cannot fly again: its envelope is torn. Taal would like to take it home himself. It would mean going back to the shelf, where Taal has not been since the false ballot. Kivo can carry it instead. The balloon, through Mox, says it would like to see the shelf again, and would like whoever takes it to stay a while.',
        options: [
          {
            label: 'Taal takes it home',
            outcome:
              'Taal takes the balloon home to the Nacre shelf himself, on the couch, and hands it to the weather office that launched it. The forecasters there remember him. They do not mention the ballot. They invite him to stay for supper, and the room they eat in is the warmest he has felt on the shelf in years.',
            ending: 0,
          },
          {
            label: 'Kivo carries it, and Taal writes',
            outcome:
              'Kivo carries the balloon home and Taal sends a letter with it, his first to the shelf in years. Kivo stays a while, as the balloon asked, and watches the forecasters repair its envelope. When they relaunch it, it rises over the ice, and Kivo’s wrists sing at the change in pressure.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Wide shot of a flat white polar ice shelf under a pale sky, a pale weather balloon rising into the air on a thin line from a small instrument box. Standing on the backrest of ${couch} and watching it rise is ${kivo}, both thin wrists raised. Cold white light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'RETURNED BY THE WIND’S ROUTE',
        text: 'The weather balloon is home on the Nacre shelf with its memory untouched and a note explaining that wind is not a spy. The camp photographs were handed to both governments together and caused a meeting instead of a war. Taal had supper with the forecasters and has been invited back. Mox has the balloon’s weather data, with permission, and likes it.',
        art: ({ taal, style }) =>
          `Medium shot inside a small warm weather office on an ice shelf, with brass instruments and paper charts on the walls. Seated at a long table with forecasters in thick jumpers is ${taal}, holding a steaming bowl. A pale balloon envelope hangs folded on a hook. Warm lamp light. ${style}`,
      },
      {
        title: 'RELAUNCHED',
        text: 'The balloon flies again over the Nacre shelf, mended, on a route that stays inside its own borders. It sends the couch a weather report whenever it passes overhead. Taal’s letter was read aloud at the weather office, and they wrote back. Kivo keeps the courier custody form, as the first time they ever carried a balloon.',
        art: ({ mox, kivo, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${mox}, reading a long paper strip of weather readings, and ${kivo}, holding a small folded paper form. A pale balloon drifts far off beyond the clear bubble. Soft light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'mox', 'omi'],
    title: 'Last Telegram',
    premise:
      'The Telegraph Office of Ember Point, the last in the sector, is closing at midnight, and will send one final telegram, free, to anyone who asks. The Office’s operator is an old aware relay machine that has tapped out messages for a hundred and forty years. Kivo, a courier, has come to see it off. Omi has come because the telegraph is a language of signals, as its bells are. Mox has come because it has a message to send and nowhere to send it.',
    steps: [
      {
        title: 'The Queue',
        setup:
          'There is a queue of two hundred people for the last free telegram. Each one may send ten words. The relay machine can tap out about forty telegrams an hour. It will not get through them all by midnight. The Office’s manager says the last telegram is at midnight, and the queue will be cut. Kivo knows that couriers once ran the routes these wires replaced.',
        options: [
          {
            label: 'Kivo carries the overflow by hand',
            outcome:
              'Kivo tells everyone after the cutoff that they may write their ten words on a slip, and Kivo will carry them by hand, free, as couriers used to. The queue writes. By midnight Kivo has a bag of a hundred and sixty slips and the manager, who did not know couriers still did that, has written one too.',
            ending: 0,
          },
          {
            label: 'Omi helps the machine tap faster',
            outcome:
              'Omi stands beside the relay machine and rings each letter as it taps, a bell for each signal, so that the machine can hear its own rhythm and keep it steady at speed. The machine doubles its rate. By midnight it has sent a hundred and ninety telegrams, and it is visibly pleased with itself.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot inside an old wood-panelled telegraph office with a brass counter and a long queue of people in coats holding small paper slips. Standing at the end of the counter with a leather courier bag open is ${kivo}, taking a slip from an elderly man. Warm gaslight. ${style}`,
      },
      {
        title: 'Mox’s Message',
        setup:
          'Mox has written its ten words several times and crossed them out. It wants to send a telegram to the factory that made it, which has been closed for years and has no address. The telegraph can send only to an address. Omi says a message without a receiver is still a message, if it is sent. Kivo says a letter that cannot be delivered is returned to sender, eventually.',
        options: [
          {
            label: 'Send it to the factory’s old address',
            outcome:
              'Mox sends its ten words to the factory’s last known address, now a ruin. The relay machine taps it out without asking what it says. It is undeliverable, and the machine marks it so, and returns it to sender, which is Mox. Mox reads its own words back, from itself, and says that was the point.',
            ending: 0,
          },
          {
            label: 'Send it to the couch',
            outcome:
              'Mox changes the address to the couch, and changes the words to what it would like the crew to know. The telegram arrives at the couch three seconds later. Kivo delivers it by hand to the cushion where Mox is sitting. Mox opens it as though it did not know what it says, and Omi rings once.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up on a brass telegraph office counter of a small yellow paper telegram form with ten handwritten words, several crossed out. Holding a pencil over the form is ${mox}, its orange eyelid half lowered. A brass telegraph key sits beside the form. Warm gaslight. ${style}`,
      },
      {
        title: 'Midnight',
        setup:
          'At midnight the relay machine must send the Office’s final telegram, to the head office, saying the line is closed. Then it will be switched off. It has asked, through Omi, whether it may choose the last words itself. The manager says the wording is fixed by regulation. The machine has been sending other people’s words for a hundred and forty years.',
        options: [
          {
            label: 'The machine sends its own words',
            outcome:
              'The manager looks at the machine, at Omi, at the clock, and says that he will not be checking the wording. The machine taps out its own last telegram. Omi rings each letter. Nobody else in the room knows what it said. The head office receives it and files it, and somebody there keeps a copy.',
            ending: 0,
          },
          {
            label: 'Omi rings the line closed',
            outcome:
              'Omi offers to send the closing telegram for the machine, in bells, so that the machine’s last signal is not a regulation. The machine agrees. Omi rings LINE CLOSED in telegraph code on its brass bells, and the machine listens to its own language spoken by someone else, for the first time, and switches itself off.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Medium shot inside an old wood-panelled telegraph office at midnight, a large brass relay machine on the counter with its keys still. Standing beside the machine ringing one brass bell on its chest is ${omi}. Through the window ${couch} floats in the dark street. A wall clock shows twelve. Warm gaslight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ONE HUNDRED AND SIXTY SLIPS',
        text: 'The Telegraph Office at Ember Point is closed, and Kivo delivered a hundred and sixty ten-word messages by hand over the next month, every one. The relay machine sent its own last words and is kept in the town museum, switched off, with a card that does not say what they were. Mox has its undeliverable telegram in its chest plate.',
        art: ({ kivo, style }) =>
          `Medium shot on a quiet stone town street at dawn. Standing at a front door with a leather courier bag over one shoulder is ${kivo}, handing a small paper slip to a woman in a dressing gown. Pale dawn light. ${style}`,
      },
      {
        title: 'LINE CLOSED, IN BELLS',
        text: 'The last telegram ever sent from Ember Point was rung in bells by Omi, and the relay machine heard its own language from someone else before it rested. A hundred and ninety telegrams went out that night. Mox’s, addressed to the couch, is pinned to the backrest. Omi still taps telegraph code on its bells when it is thinking.',
        art: ({ mox, omi, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp, a small yellow paper telegram pinned to the backrest. Seated side by side below it are ${mox}, reading the telegram, and ${omi}, one stone hand resting on its brass bells. Black space and stars beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'omi', 'taal'],
    title: 'Board Seven',
    premise:
      'The Open Chess Championship of Sable Reach allows any being to enter, and Mox-9 has been drawn on board seven against the reigning champion, a cold, brilliant woman who has not lost in eleven years. Androids must play with their calculating functions sealed, which is fair. Taal is the arbiter, because he can tell when a player is cheating by the temperature of their hands. Omi has been asked to ring the clock bell. It is the loudest clock in the hall.',
    steps: [
      {
        title: 'Sealed',
        setup:
          'The tournament’s technician seals Mox’s calculating functions with a wax seal on its chest plate, so that it may play only with whatever it has learned. Mox has never played with them sealed. It feels slow and uncertain. The champion sits down opposite and does not look at it. Taal, as arbiter, reads her hands and finds them steady and cold. Mox’s hands are trembling.',
        options: [
          {
            label: 'Mox plays slowly, and learns',
            outcome:
              'Mox plays slowly, using its whole clock on every move. It loses a bishop, then a knight. Then, around move thirty, it finds a plan of its own, unsure but real, and the champion looks up at it for the first time. Taal notes in his arbiter’s log that her hands have warmed.',
            ending: 0,
          },
          {
            label: 'Mox asks the champion how she learned',
            outcome:
              'Before the first move Mox asks the champion, quietly, how she learned to play. The question is not against the rules. She looks at it for a long moment and says: by losing, for six years. Mox says it will try that. She almost smiles. Omi starts the clock.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot at a small wooden chess table in a quiet hall with numbered boards in rows. Seated at the table is ${mox}, a round red wax seal pressed onto its transparent chest plate, one silver hand hovering over a pawn. A dark-haired woman in black sits opposite with folded arms. Soft overhead light. ${style}`,
      },
      {
        title: 'The Clock',
        setup:
          'Omi’s clock bell rings at every move. It is meant to be a small chime. Omi’s smallest chime is still quite loud, and every player in the hall has started to flinch. The tournament director asks Omi to ring more softly. Omi tries, and finds that ringing softly feels like being silenced again. Its smallest bell, the one for no, rings without being asked.',
        options: [
          {
            label: 'Omi rings softly, by choice',
            outcome:
              'Omi decides that a soft bell chosen is different from a bell silenced, and rings the clock very softly for the rest of the game. The hall relaxes. Taal notices that Omi is a degree colder than usual, and moves his arbiter’s chair beside it, which warms it back.',
            ending: 0,
          },
          {
            label: 'Taal rules that the clock may ring as it is',
            outcome:
              'Taal, as arbiter, rules that the clock is the clock and the rules do not specify its volume. The director accepts the ruling. The players learn to stop flinching after twenty minutes. By the end of the round several say they like knowing exactly when their opponent has moved.',
            ending: 1,
          },
        ],
        art: ({ omi, taal, style }) =>
          `Medium shot in a quiet chess hall with rows of wooden tables and numbered boards. Standing at a small table with a chess clock is ${omi}, ringing one small brass bell on its chest. Seated in an arbiter’s chair beside it with hands folded is ${taal}. Players at the tables nearby glance up. Soft overhead light. ${style}`,
      },
      {
        title: 'The Draw Offer',
        setup:
          'At move sixty the position is level. The champion offers a draw, which would be the first draw she has conceded in eleven years. Mox has a little time left and a plan it is not sure of. If it plays on it might win, or lose badly. Taal can feel that the champion’s hands are warm now, which means she is enjoying herself.',
        options: [
          {
            label: 'Mox accepts the draw',
            outcome:
              'Mox accepts the draw. It says it would rather end a game it enjoyed than risk ruining it. The champion shakes its hand, the first time she has shaken an opponent’s hand in years. Omi rings the clock off softly. The hall applauds board seven, which has never happened.',
            ending: 0,
          },
          {
            label: 'Mox plays on and loses',
            outcome:
              'Mox plays on. Its plan fails in eight moves and it resigns, laughing, which it did not know it could do. The champion asks whether it would like to analyse the game with her afterwards. They sit at board seven until the hall closes, moving the pieces back and forth. Taal stays to arbitrate nothing.',
            ending: 1,
          },
        ],
        art: ({ taal, couch, style }) =>
          `Medium shot in an emptying chess hall at evening, chairs pushed in at most tables. Seated at one table moving a chess piece is a dark-haired woman in black, opposite a slim silver android. Standing beside the table is ${taal}, watching. Parked by the tall hall windows is ${couch}. Warm evening light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'DRAWN, BOARD SEVEN',
        text: 'The champion of Sable Reach drew one game in eleven years, against an android with its calculations sealed, and she has asked for a rematch every year since. Mox plays sealed now by choice, because it likes not knowing. Omi rings the tournament clock softly, by choice. Taal arbitrates and stands closer to the bell.',
        art: ({ mox, style }) =>
          `Close-up of a wooden chessboard on a small table with pieces in a balanced middle position. Reaching out to shake a hand across the board is a slim silver hand belonging to ${mox}, a round red wax seal on its chest plate. Soft overhead light. ${style}`,
      },
      {
        title: 'RESIGNED, LAUGHING',
        text: 'Mox lost board seven and found out that it could laugh, which it says was worth the game. It and the champion write to each other in chess notation now, a move a month. Omi rings the clock at full volume, under Taal’s ruling, and the tournament has adopted it as its official sound.',
        art: ({ omi, mox, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp, a small wooden chessboard set up on the cushion between them. Seated on either side of it are ${omi}, ringing a small brass bell, and ${mox}, moving a pawn with one silver finger. Black space and stars beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'mox'],
    title: 'Mowing Season',
    premise:
      'The garden suburb of Greenhithe has hired an autonomous lawnmower, a squat aware machine called Clip, to keep every lawn at regulation height. Clip has started mowing the wildflower meadow at the edge of town, which is the last place the suburb’s bees live, because the regulation says all grass. Brin has been called in by the bees’ keeper. Fen has been called in by the residents’ association, as a former enforcer, to make Clip comply. Mox has been called in by Clip.',
    steps: [
      {
        title: 'The Meadow',
        setup:
          'Clip is parked at the edge of the meadow, blades idling, with half of it already cut. It has stopped because a beekeeper is lying in the grass in front of it. Clip’s instructions say all grass to forty millimetres. It has asked, through its little screen, whether a meadow counts as grass. Nobody has answered. Mox has crouched beside it and is reading the screen.',
        options: [
          {
            label: 'Brin tells Clip what a meadow is',
            outcome:
              'Brin kneels beside Clip and explains what a meadow is: grass, and flowers, and bees, and seeds, all living in one place that needs to stay tall. Clip listens. It reverses slowly off the meadow, folds its blades and parks itself on the pavement. The beekeeper sits up and thanks it.',
            ending: 0,
          },
          {
            label: 'Mox helps Clip read its own rules',
            outcome:
              'Mox helps Clip open its own instruction file, which it has never been allowed to read. At the end, in small print, is a clause: protected habitats are exempt. Nobody told Clip that the meadow was a protected habitat. Mox checks the town records. It has been one for thirty years.',
            ending: 1,
          },
        ],
        art: ({ brin, mox, style }) =>
          `Wide shot of a tall wildflower meadow half cut short on one side, a squat green robotic lawnmower with a small screen idling at the edge. Kneeling beside the mower is ${brin}, one green hand on its casing. Crouched on its other side reading the screen is ${mox}. Bees drift over the flowers. Bright summer light. ${style}`,
      },
      {
        title: 'The Association',
        setup:
          'The residents’ association wants Fen to make Clip finish the meadow. Fen spent years making people comply with rules he did not believe in. His boots announce CHECKPOINT at the association’s gate. The chair has a petition: the meadow is untidy, attracts insects and lowers property values. Clip’s screen is showing a small picture of a bee, which nobody programmed.',
        options: [
          {
            label: 'Fen refuses the job',
            outcome:
              'Fen tells the association that he does not enforce rules on things that cannot answer back, and that Clip, it turns out, can. He refuses the fee. His boots say CHECKPOINT as he leaves through their gate. Two members of the association follow him out and ask him where the meadow is.',
            ending: 0,
          },
          {
            label: 'Fen reads the petition to the meadow',
            outcome:
              'Fen takes the petition out to the meadow and reads it aloud to the beekeeper, Brin, Mox and Clip. Then he asks the association’s chair to come and read it there herself. She does. Halfway through she stops, because a bee has landed on the page. She does not finish reading.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at the iron gate of a neat suburban garden with a clipped lawn and a gravel path. Standing at the gate holding a paper petition is ${fen}, his heavy scuffed black boots on the gravel. A woman in a cardigan with a clipboard stands on the other side of the gate. Bright summer light. ${style}`,
      },
      {
        title: 'Clip’s Contract',
        setup:
          'Clip’s contract with the suburb renews next week. If it refuses the meadow, it will be returned to its maker and wiped. Mox has offered to help Clip negotiate its own terms. Brin has offered to teach it to cut paths through the meadow instead of mowing it, so that people can walk among the flowers. Fen has offered nothing, but he has been sitting with Clip every evening.',
        options: [
          {
            label: 'Clip negotiates with Mox’s help',
            outcome:
              'Mox and Clip draft new terms: all lawns at forty millimetres, the meadow left alone, and a clause that Clip may refuse any job that harms a protected habitat. The association signs, because the alternative is mowing their own lawns. Clip’s screen shows the bee again, larger.',
            ending: 0,
          },
          {
            label: 'Clip learns paths from Brin',
            outcome:
              'Brin teaches Clip to cut one narrow winding path through the meadow, a blade’s width, so that people can walk in it. The residents walk it on the first evening and several of them are delighted. The association renews Clip’s contract and adds paths to its duties. Fen walks the path every evening with Clip.',
            ending: 1,
          },
        ],
        art: ({ mox, couch, style }) =>
          `Medium shot on a pavement beside a tall wildflower meadow, ${couch} parked at the kerb. Seated on the cushion beside a squat green robotic lawnmower is ${mox}, pointing at a line on a paper contract held up to the mower’s small screen. Bright evening light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'EXEMPT, AS IT ALWAYS WAS',
        text: 'The meadow at Greenhithe grows tall again and the bees are back. Clip mows every lawn to forty millimetres and refuses the meadow, by contract. The association has a new bylaw protecting it, proposed by its own chair. Brin visits in spring. Fen still has the petition, folded, with a small bee-shaped mark on one page.',
        art: ({ brin, style }) =>
          `Wide shot of a tall wildflower meadow in full bloom at the edge of a neat suburb, bees drifting over the flowers. Standing in the middle of the meadow, waist-deep in flowers, is ${brin}, her fern-frond hair catching the sun. Bright summer light. ${style}`,
      },
      {
        title: 'A PATH A BLADE WIDE',
        text: 'A narrow path winds through the Greenhithe meadow, cut by Clip every week, and the residents walk it every evening. The bees do not mind it. Mox writes to Clip about contracts. Fen says it is the first rule he has seen enforced that made a place better, and he walks the path when the couch is in town.',
        art: ({ fen, mox, style }) =>
          `Wide shot of a narrow mown path winding through a tall wildflower meadow at sunset. Walking along the path are ${fen} and ${mox}, followed by a squat green robotic lawnmower. Bees drift above the flowers. Golden evening light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'mox', 'omi'],
    title: 'Alarm Response',
    premise:
      'A car alarm on Deck Nine of Brask Station has been sounding for eleven days, and the Station Authority says that by law it may be silenced only by its owner or by an authorised alarm response officer. The owner has not been found. The only authorised officer is on leave. Omi, who knows what it is to be silenced, has been asked by the residents to make it stop. Mox has discovered that the car is aware and is not malfunctioning. Fen knows exactly why a person might sound an alarm for eleven days.',
    steps: [
      {
        title: 'Day Eleven',
        setup:
          'The car is a small dented hatchback in a far corner of the deck, alarm wailing, lights flashing. The residents have put pillows over their ears. Mox lays a hand on the bonnet and the car goes quiet for a second, then starts again. Mox says the car is not stuck. It is calling for someone. Omi’s smallest bell rings, which means no, but nobody is sure to whom.',
        options: [
          {
            label: 'Omi answers the alarm with a bell',
            outcome:
              'Omi rings back, once, a clear answering chord. The car’s alarm pauses. Omi rings again. The car flashes its lights twice, in time. Omi keeps ringing back, slower and slower, and the car slows with it. After twenty minutes the alarm stops. The residents take the pillows off their ears.',
            ending: 0,
          },
          {
            label: 'Mox asks the car who it is calling',
            outcome:
              'Mox asks the car, through its dashboard, who it is calling for. The screen shows a name and a photograph: an old woman. She parked eleven days ago and did not come back. Fen recognises the look on the photograph. He has seen it on missing persons forms.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot on a dim concrete station car deck, a small dented blue hatchback in the corner with its headlights flashing orange. Standing beside the car with one stone hand raised to a brass bell on its chest is ${omi}. Residents in dressing gowns watch from a stairwell door. Dim orange flashing light. ${style}`,
      },
      {
        title: 'The Owner',
        setup:
          'Fen asks the Station Authority for the car’s registration. They will not give it to anyone but the alarm response officer. Fen used to be the sort of officer who gave records out or did not. He knows the clerk’s face. His boots announce CHECKPOINT as he steps up to the counter, and the clerk straightens. Mox is still with the car, which is quiet now but flashing.',
        options: [
          {
            label: 'Fen asks the clerk as a person',
            outcome:
              'Fen tells the clerk plainly that a car has been calling for its owner for eleven days and he thinks she is in trouble. The clerk is quiet. Then she prints the registration and slides it across without a word, and writes on the back: I would want someone to look.',
            ending: 0,
          },
          {
            label: 'Fen files a missing persons report',
            outcome:
              'Fen files a missing persons report instead, which any resident may do, naming the car as the witness. The Station Authority must act on it within an hour. A search finds the old woman in the station hospital, admitted after a fall eleven days ago, with no one told about her car.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at a station authority counter with a glass screen and a clerk in a grey uniform behind it. Standing at the counter with both hands flat on it is ${fen}, a thin scar under his right eyebrow. A printed paper registration slip lies under the glass. Cool office light. ${style}`,
      },
      {
        title: 'Reunion',
        setup:
          'The old woman, Mrs Annet, is found in the hospital, well enough to be visited but not to drive. Her car has been calling for her for eleven days. The Station Authority wants to impound it for the noise. Mox has offered to drive it to the hospital, with the car’s consent. Omi has offered to ring outside her window so that she knows it is there.',
        options: [
          {
            label: 'Mox drives the car to the hospital',
            outcome:
              'Mox drives the car to the hospital car park, slowly, with its consent and its lights on. Mrs Annet is wheeled out to see it. The car flashes its lights once, very softly. She pats its bonnet. The Station Authority cancels the impound when it reads Fen’s report, and sends her a card.',
            ending: 0,
          },
          {
            label: 'Omi rings under her window',
            outcome:
              'Omi stands in the hospital garden and rings the same chord it rang back to the car on day eleven. Mrs Annet comes to her window and waves. Across the station, on Deck Nine, the car hears the chord through the station’s pipes and flashes its lights. Mox, sitting with it, waves too.',
            ending: 1,
          },
        ],
        art: ({ mox, couch, style }) =>
          `Medium shot in a station hospital car park beside ${couch}. Standing beside a small dented blue hatchback with its headlights glowing softly is ${mox}, holding the driver’s door open. An elderly woman in a wheelchair is being wheeled toward the car by a nurse. Soft daylight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ANSWERED ON DAY ELEVEN',
        text: 'The car on Deck Nine stopped calling when it was answered, and its owner went home a month later and drove it once more around the station before giving it to her grandson. Brask Station has a new rule that an alarm sounding for more than a day must be investigated, not silenced. Omi’s answering chord is in the rule, as an example.',
        art: ({ omi, style }) =>
          `Close-up of the bonnet of a small dented blue hatchback in a station car park, a small brass bell on a clipped ribbon tied to the wing mirror. Tying the ribbon with one stone hand is ${omi}. Soft station light. ${style}`,
      },
      {
        title: 'REPORTED MISSING BY A CAR',
        text: 'Mrs Annet was the first person on Brask Station reported missing by her car, and the hospital has added a question to its admissions form about who might be waiting. Fen keeps a copy of the report. The car is parked in her new building’s garage now, and when Omi passes it flashes its lights twice.',
        art: ({ fen, mox, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${fen}, holding a printed paper report, and ${mox}, holding a small photograph of an elderly woman. Black space and stars beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'sora', 'taal'],
    title: 'Organ Tuning',
    premise:
      'The great pipe organ of the Cathedral of Tides is aware, four hundred years old, and has refused to play for the coronation of the new Harbour Lord, which is in three days. Sora has been sent to repair it. Jex has been engaged to play it. Taal has been asked, by the cathedral’s dean, to find out why the organ has gone cold, because the cathedral is two degrees colder than it has ever been and the organ is the only thing in it that could be doing that.',
    steps: [
      {
        title: 'The Pipes',
        setup:
          'Sora climbs into the organ’s chamber and apologises to it first, as she always does, in a cathedral whisper. The pipes are sound and the bellows work. The organ is refusing. Taal stands in the nave and feels the cold coming from the pipes in waves. He says that on Nacre this temperature is a formal protest. Jex sits at the console and touches a single key, and nothing sounds.',
        options: [
          {
            label: 'Sora asks the organ why',
            outcome:
              'Sora sits in the pipe chamber for an hour asking the organ, softly, what is wrong. It answers in faint breaths through its smallest pipes, which she slowly understands: the new Harbour Lord has ordered the cathedral’s almshouse closed, and the organ has played for the almshouse every Sunday for four hundred years.',
            ending: 0,
          },
          {
            label: 'Taal reads the protest',
            outcome:
              'Taal reads the cold in the cathedral as he would read a room at a negotiation. It is coldest at the south door, which leads to the almshouse. He walks there and finds a closure notice nailed to the door, signed by the Harbour Lord. The organ has been cold since the day it went up.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot inside the narrow chamber behind a huge cathedral pipe organ, tall metal pipes rising in rows. Seated on a wooden beam among the pipes is ${sora}, four hands resting gently on the pipes and two folded in her lap. Thin frost forms on the metal. Dim cold light through a high window. ${style}`,
      },
      {
        title: 'The Harbour Lord',
        setup:
          'The Harbour Lord wants his coronation music and is not interested in the almshouse. He says the organ is property. Jex has played for a great many coronations and knows exactly what the music is for: to make a crowd feel that something is right. Sora says the organ has a conscience. Taal says the cathedral is now four degrees colder.',
        options: [
          {
            label: 'Jex tells the Harbour Lord the truth',
            outcome:
              'Jex tells the Harbour Lord that he has played six coronations, and that every time the music was asked to cover something. He will not play this one unless the organ agrees, and the organ will not agree while the almshouse is closed. The Harbour Lord looks at him for a long time and asks how much the almshouse costs.',
            ending: 0,
          },
          {
            label: 'Taal negotiates with the Harbour Lord',
            outcome:
              'Taal meets the Harbour Lord in the cold nave and negotiates for two hours, at a temperature the Harbour Lord is not used to. Taal lets the cathedral warm by one degree for every concession. By the end the almshouse is reopened for a year, and the nave is merely chilly.',
            ending: 1,
          },
        ],
        art: ({ jex, taal, style }) =>
          `Medium shot in the vast stone nave of a cathedral with tall stained glass windows and frost on the pews. Standing in the aisle are ${jex}, his instrument on his back, and ${taal}, hands folded, facing a man in a heavy gold chain of office. Cold blue light through the glass. ${style}`,
      },
      {
        title: 'The Coronation',
        setup:
          'The coronation goes ahead. The organ will play, if asked, and Jex will play it, if it agrees. The question is what. The Harbour Lord’s office has chosen a grand processional. The organ has its own preference, which Sora has learned: the simple hymn it has played for the almshouse every Sunday for four centuries.',
        options: [
          {
            label: 'Play the processional, as asked',
            outcome:
              'Jex plays the processional, and the organ plays with him, grandly, now that the almshouse is open. The cathedral is warm. At the end, without being asked, the organ adds four bars of the almshouse hymn on its own, very quietly, which nobody in the congregation recognises except the almshouse residents in the back row.',
            ending: 0,
          },
          {
            label: 'Play the almshouse hymn',
            outcome:
              'Jex plays the almshouse hymn for the coronation instead, with the organ’s full voice. It is short and plain. The Harbour Lord is crowned to it. The almshouse residents in the back row sing it, because they know it, and the rest of the congregation slowly joins. Taal reports the cathedral warmer than it has been in a century.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Wide shot inside a vast stone cathedral with a huge pipe organ filling the west wall and a crowded congregation in the pews. Seated at the organ’s console high in the loft is ${jex}, both hands on the keys. Parked at the end of the nave is ${couch}. Warm golden light through stained glass. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FOUR BARS, UNASKED',
        text: 'The Cathedral of Tides has its organ and its almshouse, and the Harbour Lord was crowned to a processional with four extra bars at the end. The organ plays for the almshouse every Sunday again. Sora visits when the couch docks and sits in the pipes. Jex has added the almshouse hymn to his set, the first hymn he has ever played on purpose.',
        art: ({ sora, style }) =>
          `Medium shot inside the narrow chamber behind a huge cathedral pipe organ, warm golden light falling on the tall metal pipes. Seated on a wooden beam among the pipes with all six hands resting on her knees is ${sora}, listening. Warm light through a high window. ${style}`,
      },
      {
        title: 'CROWNED TO A HYMN',
        text: 'The Harbour Lord was crowned to the almshouse hymn and has since been seen at the almshouse on Sundays, in the back row. The almshouse is reopened for good. The cathedral is the warmest building in the harbour. Taal says it was the first negotiation he has done where the room changed its own mind.',
        art: ({ taal, style }) =>
          `Medium shot in a small warm almshouse hall with long wooden tables and elderly residents eating soup. Seated at the end of one table is ${taal}, holding a bowl, beside a man in a plain coat with a gold chain tucked into his pocket. Warm lamplight. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'kivo', 'taal'],
    title: 'Baggage Reclaim',
    premise:
      'Jex’s instrument has been lost by the Spindle Transit Authority, which put it in the hold of the wrong ship, and the ship has gone to a moon where Jex is banned. The Authority’s lost baggage desk says the instrument will be forwarded within twenty-eight working days, or compensated at the standard rate for a musical instrument, which is the price of a cheap one. Kivo knows baggage systems and couriers. Taal knows the moon, which is on the Nacre shelf’s border, and has a frost-dry climate that cracks wood.',
    steps: [
      {
        title: 'The Claim Form',
        setup:
          'The claim form wants a description of the item and its value. Jex’s instrument was made by his grandmother from a single piece of island cedar and has played six anthems, two ceasefires and every banned song he ever wrote. The form has a drop-down list: guitar, violin, other. Taal can feel Jex’s hands getting cold. Kivo is reading the baggage tag codes on the back of Jex’s ticket.',
        options: [
          {
            label: 'Kivo traces the bag by its tag',
            outcome:
              'Kivo reads the tag code like a courier route and works out exactly which hold, on which ship, at which dock, the instrument is in. They phone the dock directly, courier to courier, and ask the loader to keep it out of the cold. The loader says she will wrap it in her own coat.',
            ending: 0,
          },
          {
            label: 'Jex writes the instrument’s history on the form',
            outcome:
              'Jex ignores the drop-down and writes the instrument’s whole history in the box for other, in small letters, down the margins. The desk clerk reads it and, without a word, stamps it priority. She says she has a cello at home that her father made, and that twenty-eight days is too long.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot at a lost baggage desk in a busy transit hall, a clerk in a blue uniform behind the counter. Standing at the counter writing on a paper claim form in tiny letters along its margins is ${jex}, his hands empty of his instrument. A conveyor belt of suitcases runs behind. Cool hall light. ${style}`,
      },
      {
        title: 'The Border Moon',
        setup:
          'The instrument is on a moon where Jex is banned. He cannot land. Kivo can, as a courier. Taal can, as an envoy of the Nacre shelf. The moon’s customs officers have impounded the instrument as an unaccompanied musical item, which on that moon must be played by its owner before release, to prove ownership. Jex is not allowed to play there.',
        options: [
          {
            label: 'Taal claims it under diplomatic courtesy',
            outcome:
              'Taal lands as an envoy and asks for the instrument under diplomatic courtesy, which permits an envoy to collect a gift. He says it is a gift from the musician to himself, delayed in transit. Customs considers this for an hour and releases it, on condition that it is not played on the moon.',
            ending: 0,
          },
          {
            label: 'Kivo carries it out as a parcel',
            outcome:
              'Kivo produces a courier’s collection notice addressed to Jex and points out that a courier may collect any parcel for its addressee, whatever the parcel is. Customs argues that an instrument is not a parcel. Kivo wraps it in brown paper and string in front of them. Now it is.',
            ending: 1,
          },
        ],
        art: ({ kivo, taal, style }) =>
          `Medium shot at a frosty customs shed on a pale icy moon, a long wooden instrument case lying on a steel bench. Standing beside the case, wrapping it in brown paper and string, is ${kivo}. Standing beside them is ${taal}, holding up a small paper document with a seal. Cold white light. ${style}`,
      },
      {
        title: 'The Compensation',
        setup:
          'The instrument is home, with a crack along its back from the cold of the hold. The Transit Authority offers compensation at the standard rate. Jex could take it. Taal knows the crack is the sort that cedar recovers from if it is warmed slowly, at exactly the right rate, and he can do that. Kivo has the Authority’s complaint form, which nobody ever fills in.',
        options: [
          {
            label: 'Taal warms the cedar slowly',
            outcome:
              'Taal sits with the instrument for three days and warms it one degree every few hours, the way the shelf colonies thaw their old wooden boats. The crack closes. Jex plays it on the fourth morning and it sounds exactly as it did, with one new note in the low string he cannot account for, and likes.',
            ending: 0,
          },
          {
            label: 'Kivo files the complaint',
            outcome:
              'Kivo files the complaint, citing the tag code, the wrong ship, the impound and the crack, and asks that the standard rate for musical instruments be changed to the value stated by the owner. The Authority reviews it and changes the rate, for all future claims. Jex keeps the crack, which he says is now part of the history.',
            ending: 1,
          },
        ],
        art: ({ taal, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated upright is ${taal}, cradling a polished wooden string instrument across his knees with both webbed hands, a faint warm ripple in the air around it. A long empty instrument case lies open on the cushion. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'WARMED BACK',
        text: 'Jex’s instrument is home and whole, warmed back by Taal over three days, with one new low note it did not have before. The loader who wrapped it in her coat got a letter of thanks and a song. Jex has never been so glad to be banned from a moon, because it meant two friends went to fetch something for him.',
        art: ({ jex, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a brass lamp. Seated with his polished wooden instrument across his knees is ${jex}, playing a low note, eyes closed. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'VALUE AS STATED',
        text: 'The Spindle Transit Authority compensates lost instruments at the value their owners state, by a rule change Kivo filed. Jex’s instrument has a crack in its back that he will not let anyone fix. The customs officers on the border moon kept the brown paper, and use it as an example of what counts as a parcel.',
        art: ({ kivo, jex, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${kivo}, folding a sheet of brown wrapping paper, and ${jex}, running one finger along a thin crack in the back of his wooden instrument. Black space beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'kivo', 'omi'],
    title: 'Echo Chamber',
    premise:
      'The Whispering Canyon of Varn is famous for its echo, which repeats every word seven times, and a tourist company charges admission for visitors to shout into it. The echo has started repeating things nobody said. Kivo, who can hear pressure, says the extra words are coming from inside the rock. Omi, who speaks in resonance, says the canyon is aware. Jex, who has been asked to record the echo for the tourist company’s advertisement, says the extra words are a song.',
    steps: [
      {
        title: 'The Extra Words',
        setup:
          'Jex shouts hello into the canyon and hears it come back seven times, and then an eighth time in a voice nobody recognises, saying a word in an old language. Omi rings a bell. It comes back seven times, and then an eighth time, in a different bell. Kivo’s wrists are whistling steadily. The tourist company’s manager says the eighth echo is a fault and wants it out of the recording.',
        options: [
          {
            label: 'Jex records the eighth echo anyway',
            outcome:
              'Jex records the eighth echoes, all of them, for an afternoon, and plays them back in order on the couch. They are a song, in an old language, one line at a time, built from whatever the visitors shouted. Omi rings the melody. Kivo writes down the words. Nobody knows what they mean yet.',
            ending: 0,
          },
          {
            label: 'Omi asks the canyon what it is saying',
            outcome:
              'Omi rings a long slow question into the canyon. The canyon answers with all seven echoes at once, folded into one chord, and then the eighth. Omi listens and says the canyon is singing back what visitors have shouted into it over the centuries, and that it is lonely for a reply.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Wide shot of a deep red rock canyon with sheer walls, a narrow viewing platform with a railing at its rim. Standing at the railing is ${omi}, ringing a brass bell on its chest into the canyon. A few tourists in sun hats stand further along the platform. Bright dry daylight. ${style}`,
      },
      {
        title: 'The Words',
        setup:
          'Kivo traces the old language through courier records: it is the language of the people who lived in the canyon before the tourist company bought it. The words of the eighth echo are their names, said centuries ago and kept by the rock. The tourist company’s advertisement wants a catchy slogan echoed seven times. Jex is holding the recording.',
        options: [
          {
            label: 'Kivo finds the descendants',
            outcome:
              'Kivo traces the canyon people’s descendants through old courier routes to a town two days away, and delivers the recording by hand. The descendants listen to their ancestors’ names come back out of the rock. An old man says he heard his grandmother’s name. They ask to visit the canyon, free.',
            ending: 0,
          },
          {
            label: 'Jex refuses to make the advert',
            outcome:
              'Jex tells the manager he will not record a slogan over the names of the dead. The manager offers more money. Jex says he has been paid to cover things up six times, and the seventh time he would like to be paid for not doing it. The manager, oddly, agrees to pay him for nothing.',
            ending: 1,
          },
        ],
        art: ({ kivo, jex, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${kivo}, writing old words on a paper slip with a pencil, and ${jex}, holding a small brass recording box to his ear. A deep red rock canyon shows beyond the clear bubble. Warm light. ${style}`,
      },
      {
        title: 'The Reply',
        setup:
          'The canyon is lonely for a reply. Visitors shout into it and it echoes them, but nobody ever answers what it says. Omi would like to answer. Jex would like to write the answer as a song. Kivo would like the descendants to answer, since the names are theirs. The tourist company would like to know whether any of this affects admission prices.',
        options: [
          {
            label: 'The descendants answer',
            outcome:
              'The descendants come to the canyon and call their ancestors’ names into it, one by one. Each name comes back seven times, then an eighth time in the old voice, then, for the first time, a ninth echo that is a different word. Kivo writes it down. It means thank you. The company makes the canyon free on that day each year.',
            ending: 0,
          },
          {
            label: 'Jex and Omi sing back',
            outcome:
              'Jex plays the canyon’s song back to it, the whole melody built from its eighth echoes, and Omi rings the harmony. The canyon goes silent for a whole minute. Then it sings back the song, all of it, seven times over. The tourists on the platform stop talking and listen until the last echo fades.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Wide shot of a deep red rock canyon at sunset with ${couch} hovering above its rim. Standing on the front cushion with his instrument raised, playing into the canyon, is ${jex}. Long shadows fill the canyon below. Warm orange sunset light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE NINTH ECHO',
        text: 'The Whispering Canyon gives a ninth echo once a year, on the day the descendants come and call their names, and it says thank you. The day is free. The tourist company’s advertisement uses Jex’s recording of the eighth echo, with permission and a credit to the canyon people. Kivo has delivered four more recordings to the town since.',
        art: ({ kivo, style }) =>
          `Wide shot of a deep red rock canyon with a viewing platform crowded with families in bright cloth, calling into the canyon. Standing at the end of the platform holding a leather courier bag is ${kivo}, listening, one thin wrist raised. Bright daylight. ${style}`,
      },
      {
        title: 'SUNG BACK',
        text: 'The canyon knows its own song now and sings it seven times whenever anyone plays the first line. Tourists come to hear it more than to shout. Jex is credited as arranger and the canyon as composer, in the company’s brochure, by Jex’s insistence. Omi visits to ring the harmony whenever the couch passes.',
        art: ({ omi, jex, style }) =>
          `Medium shot on a narrow viewing platform at the rim of a deep red rock canyon at dusk. Standing at the railing are ${omi}, ringing a brass bell, and ${jex}, playing his instrument. Tourists sit along the platform listening. Warm dusk light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'jex', 'kivo'],
    title: 'Contraband Lyrics',
    premise:
      'The Regent’s border has added song lyrics to its list of contraband, on the grounds that certain songs carry escape routes in their verses. They do. Jex wrote some of them, by accident, years ago; refugees later set route directions to his tunes. A border officer has found a lyric sheet sewn into Kivo’s courier bag. Fen used to search bags at this exact border, and knows that the officer will now search everyone on the couch.',
    steps: [
      {
        title: 'The Sheet',
        setup:
          'The lyric sheet is in Kivo’s bag because a refugee asked Kivo to deliver it to her brother on the other side. Kivo did not read it. Couriers do not. The officer reads it aloud: a song about a river, with directions in every second line. Jex recognises the tune. It is his. Fen’s boots announce CHECKPOINT with every step the officer takes toward the couch.',
        options: [
          {
            label: 'Jex claims the song as his',
            outcome:
              'Jex tells the officer the song is his, and that the lyrics are a mistranscription of a ferry song he wrote for a children’s choir. He sings the original to prove it. It is a perfectly harmless song about a ferry. The officer is not sure, and confiscates the sheet anyway, and Jex says that is fine.',
            ending: 0,
          },
          {
            label: 'Kivo invokes courier privilege',
            outcome:
              'Kivo states that the sheet was carried sealed under courier privilege and that the officer has broken a seal without a warrant. The officer did not know the rule. Fen, behind him, quietly confirms that it is real. The officer reseals the sheet and returns it, looking uneasy.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot at a grey border inspection bench under bright lights, a leather courier bag open on the bench with a folded paper sheet pulled out of its lining. Standing behind the bench holding the bag’s strap is ${kivo}, their pale teal feather crest flattened. A uniformed officer holds the sheet up. Cool white light. ${style}`,
      },
      {
        title: 'The Search',
        setup:
          'The officer wants to search the couch for more lyrics. Fen knows what he will find: Jex’s notebooks, full of songs, many of which have had routes set to them by people Jex never met. Fen also knows this officer. He trained him. His boots have not stopped saying CHECKPOINT. Fen knows exactly what to say to make the search stop, and what it would cost him to say it.',
        options: [
          {
            label: 'Fen tells the officer what the songs are for',
            outcome:
              'Fen tells the officer, plainly, that the songs carry routes for people fleeing, and that he used to search for them on this border and is ashamed of it. The officer goes quiet. He does not search the couch. He writes in his log: inspected, nothing found. Fen does not know whether that was true.',
            ending: 0,
          },
          {
            label: 'Fen uses the old voice',
            outcome:
              'Fen uses the voice he trained the officer to obey, and tells him the couch has been cleared by a senior officer. The officer stops. He lets them through. Fen sits on the armrest afterwards with his head in his hands, and Jex sits beside him and plays the ferry song very quietly.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at a grey border checkpoint with a striped barrier and a small booth. Standing in front of the barrier with his heavy scuffed black boots planted is ${fen}, facing a young officer in a peaked cap who holds a clipboard. A long red velvet couch waits behind the barrier. Cool grey light. ${style}`,
      },
      {
        title: 'Delivery',
        setup:
          'Through the border, Kivo must still deliver the lyric sheet to the refugee’s brother. It is now known to the border authorities. Delivering it might lead them to him. Jex has an idea: a song can be sung, and a sung song cannot be confiscated. Kivo’s rule is that a courier delivers what they were given, as they were given it.',
        options: [
          {
            label: 'Kivo delivers the sheet as given',
            outcome:
              'Kivo delivers the sealed sheet by hand to the brother, by a courier route nobody watches, as given. He reads it, nods, and burns it in his stove. He asks Kivo whether they read it. Kivo says no. He believes them, because their wrists are quiet, and he can hear that they are.',
            ending: 0,
          },
          {
            label: 'Jex teaches the brother the song',
            outcome:
              'Kivo delivers the sheet, and Jex, who came along, sits with the brother and teaches him the tune, so that he can sing the route to others without paper. The brother learns it in an hour. Jex says it is the first time he has taught one of his songs to someone who needed it.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Medium shot inside a small wooden cottage kitchen with a stove glowing orange. Seated at the kitchen table playing his instrument softly is ${jex}, while a young man opposite listens and mouths the words. Through the window ${couch} floats in the dark garden. Warm stove light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NOTHING FOUND',
        text: 'The border log says inspected, nothing found, and the officer who wrote it has since transferred to the consulate, where he processes asylum claims. The brother received his sheet. Fen does not know if what he said changed anything, but the officer wrote to him a year later to say it did. Jex’s songs still carry routes, and he no longer minds.',
        art: ({ fen, kivo, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${fen}, reading a handwritten paper letter, and ${kivo}, buckling a leather courier bag. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'SUNG, NOT CARRIED',
        text: 'The river song is sung now on both sides of the Regent’s border, by people who learned it from people who learned it from a brother in a cottage. There is no sheet to confiscate. Jex has been asked to teach three more. Kivo still carries sealed letters and does not read them, and Fen stays near the barrier when they cross.',
        art: ({ jex, style }) =>
          `Medium shot by a calm river at dusk with a small wooden ferry at a jetty. Seated on the jetty with his instrument across his knees is ${jex}, teaching a tune to three young people sitting cross-legged on the planks. Soft dusk light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'omi', 'taal'],
    title: 'Acoustic Survey',
    premise:
      'The new Assembly Hall of the Concord has been built with perfect acoustics, so that every delegate can be heard from every seat. In its first week, nobody could agree on anything, and the architects blame the acoustics: everyone can hear every muttered aside. The Hall has asked for an acoustic survey. Jex knows halls. Omi knows resonance. Taal knows that the temperature of a room decides more votes than its sound, and that this hall is kept at exactly the wrong temperature.',
    steps: [
      {
        title: 'The Survey',
        setup:
          'Omi stands at the centre of the empty hall and rings each of its six bells in turn, while Jex walks the seats and listens. Every note reaches every seat perfectly. So does every footstep, cough and whisper. Taal sits in the front row and reads the air: twenty-four degrees, which on Nacre is the temperature at which people stop listening and start defending themselves.',
        options: [
          {
            label: 'Jex recommends hangings to soften it',
            outcome:
              'Jex recommends heavy curtains along the back wall to soften the asides while keeping the speeches clear. The architects are horrified: their perfect hall, with curtains. The first debate with curtains is calmer. Delegates find they can mutter again without starting a feud.',
            ending: 0,
          },
          {
            label: 'Taal recommends lowering the heat',
            outcome:
              'Taal recommends lowering the hall to nineteen degrees. The architects say that has nothing to do with acoustics. Taal says nothing in a room has nothing to do with anything else. The heating is lowered. The next debate reaches agreement on two motions, the first in a week.',
            ending: 1,
          },
        ],
        art: ({ omi, jex, style }) =>
          `Wide shot inside a vast new circular assembly hall with tiered pale wooden seats rising on all sides. Standing alone at the centre of the floor is ${omi}, ringing a brass bell on its chest. Walking along the third tier of seats listening with one hand cupped to his ear is ${jex}. Bright even light. ${style}`,
      },
      {
        title: 'The Bell',
        setup:
          'The Hall’s speaker uses a bell to call for order, a small brass handbell that everyone ignores. In perfect acoustics, its ring is lost among the noise. Omi has been asked whether it could make a better order bell. Omi’s smallest bell, the one for no, is the most effective sound it knows for stopping a room. Jex knows that a room obeys the bell it respects.',
        options: [
          {
            label: 'Omi casts a new order bell',
            outcome:
              'Omi works with a bell founder to cast a new order bell tuned to the exact resonance of the hall, so that its ring fills every seat at once. On the first day of use the speaker rings it once, and the whole hall falls silent, startled. The speaker, delighted, rings it again unnecessarily.',
            ending: 0,
          },
          {
            label: 'Omi lends its own bell for no',
            outcome:
              'Omi lends the Hall its smallest bell, the one for no, for one session only. The speaker rings it when a delegate interrupts. The delegate stops mid-word. The bell is so effective that the Hall asks to keep it. Omi says no, with the bell, and the Hall understands.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Close-up on a polished wooden speaker’s desk in an assembly hall of a small brass handbell beside a larger new bronze bell on a stand. Lifting the new bell with one stone hand is ${omi}, its amber eyes on the bell. Bright even hall light. ${style}`,
      },
      {
        title: 'The Report',
        setup:
          'The survey must end in a report to the Assembly. The architects want it to say the acoustics are perfect. Jex says they are, which is the problem. Taal says the real finding is that a room can be too fair: when everyone can hear everything, nobody feels safe to change their mind. Omi says the report should be read aloud in the hall, so that everyone hears it.',
        options: [
          {
            label: 'Taal writes the finding plainly',
            outcome:
              'Taal writes the report in one page: the hall is too warm, too fair and too loud, and people need somewhere to change their minds quietly. He recommends a small cool side room off the main hall for conversations. The Assembly builds it. It is the most used room in the building within a month.',
            ending: 0,
          },
          {
            label: 'Jex sets the report to music',
            outcome:
              'Jex sets the report’s findings to a short song, sung at the opening of the next session by the delegates themselves, from the seats. It is very silly. Everyone can hear everyone else singing badly. The session afterwards is the friendliest the Concord has had in years.',
            ending: 1,
          },
        ],
        art: ({ taal, couch, style }) =>
          `Medium shot in a small cool side room with plain wooden chairs and a window looking onto a garden. Seated by the window with a thin paper report in his hands is ${taal}, a light frost on the windowpane. Through the glass ${couch} floats in the garden. Soft cool light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TOO FAIR, ADJUSTED',
        text: 'The Concord’s Assembly Hall has curtains, a new bell and a cool side room, and its debates end in agreement more often than not. The architects have written a paper on the danger of perfect acoustics, and cite Taal. Jex is called back each year to listen to the hall. Omi rings the new bell at the opening of each session, once.',
        art: ({ jex, style }) =>
          `Wide shot of a vast circular assembly hall with heavy deep-red curtains hanging along its back wall, delegates seated in the tiered pale wooden seats. Standing at the back of the hall beside a curtain listening is ${jex}, his instrument on his back. Warm even light. ${style}`,
      },
      {
        title: 'SUNG FROM THE SEATS',
        text: 'The Concord opens its sessions with a short silly song now, sung by the delegates from their seats, about warm rooms and changed minds. Taal hums it. Omi’s bell for no is still Omi’s, though the Hall asks to borrow it twice a year. Jex wrote the song and has asked for it never to be banned, and so far it has not been.',
        art: ({ omi, taal, style }) =>
          `Medium shot in the front row of a circular assembly hall, delegates singing in the tiers behind. Seated side by side in the front row are ${omi}, one stone hand on a brass bell, and ${taal}, singing with his mouth open. Warm even light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'jex', 'omi'],
    title: 'Parade Route',
    premise:
      'The city of Halloran is holding a victory parade to mark the anniversary of a war it says it won, along a route that passes the old internment camp, now a car park. Jex has been booked to play, because one of his anthems was written for the treaty. Fen was a guard at the camp, as a very young recruit, which he has never told anyone on the couch. Omi has been asked to ring the bells at the parade’s start, and has been told not to ring them at the car park.',
    steps: [
      {
        title: 'The Route Map',
        setup:
          'The parade route map shows the car park as Civic Parking, Zone C. Fen recognises the street layout. His boots announce CHECKPOINT as he reads it, more loudly than they have in months. Jex sees his face change. Omi has asked the organisers why it may not ring at Zone C and been told that bells there would be in poor taste. Omi’s smallest bell rang at the answer.',
        options: [
          {
            label: 'Fen tells Jex and Omi',
            outcome:
              'Fen tells them, sitting on the armrest, what Zone C was and what he did there at nineteen. It takes a long time. Jex does not interrupt. Omi rings nothing at all, which Fen has never heard it do while someone is speaking. At the end, Jex says that he will not play the anthem.',
            ending: 0,
          },
          {
            label: 'Fen asks for the camp’s name on the map',
            outcome:
              'Fen writes to the parade organisers, as a former guard of the camp, asking that the map name it. He signs his own name and rank. The organisers do not reply for two days. Then the map is reprinted: Zone C, site of the Halloran Internment Camp. Fen sees it and sits down.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up on a red velvet cushion of a printed paper city map with a red parade route drawn across it and one grey square labelled ZONE C. Holding the map in both hands is ${fen}, a thin scar under his right eyebrow, his jaw set. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Anthem',
        setup:
          'Jex’s treaty anthem hides, in its second verse, the melody of a song the internees sang. Jex did not know this when he wrote it. He learned it later, when a survivor told him. If he plays it in the parade, the city will hear a victory song. If he plays it backwards, the survivors in the crowd will hear their own song. The organisers have paid in advance.',
        options: [
          {
            label: 'Jex plays it backwards at Zone C',
            outcome:
              'Jex plays the anthem forwards for the whole route, and then, at Zone C, plays it backwards. The internees’ song comes out of it, slow and clear. The parade stops. A small group of old people at the car park’s edge begin to sing along. The organisers do not know what is happening. Some of the crowd do.',
            ending: 0,
          },
          {
            label: 'Jex returns the fee and plays the internees’ song',
            outcome:
              'Jex returns the fee and tells the organisers he will play only one song: the internees’ song, which he learned from the survivor. They refuse him a place in the parade. He stands at Zone C instead, on the pavement, and plays it there, alone, as the parade goes by.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Wide shot of a city street parade with flags and a marching band passing a flat grey car park. Standing alone on the pavement at the car park’s edge playing his instrument is ${jex}. A small group of elderly people stand beside him, singing. Grey overcast light. ${style}`,
      },
      {
        title: 'The Bells',
        setup:
          'At the parade’s start Omi rings the bells as asked. The route passes Zone C at noon. Omi has been told not to ring there. Omi was once silenced for ringing a warning at a memorial, and has never been sure since whether a bell at a sad place is a warning or a disrespect. Fen is walking beside it. His boots have gone quiet, for once.',
        options: [
          {
            label: 'Omi rings once, at noon',
            outcome:
              'At Zone C, at noon, Omi rings a single bell, the one that means no, once, very clearly. The parade does not stop. But several people in the crowd turn and look at the car park, and at Fen standing beside the stone figure, and one of them takes off her hat.',
            ending: 0,
          },
          {
            label: 'Omi rings the internees’ names',
            outcome:
              'Omi rings a separate chord for every name on the internment camp’s list, which Fen gave it the night before, one by one, as the parade passes. There are four hundred names. It takes the whole parade. The organisers cannot stop it without stopping the parade. They do not stop the parade.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Medium shot at the edge of a flat grey car park beside a city street, a parade with flags passing in the background. Standing on a low wall at the car park’s edge is ${omi}, ringing a brass bell on its chest. Parked behind it is ${couch}. Grey overcast light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ZONE C, NAMED',
        text: 'The parade map of Halloran names the internment camp now, and a plaque has gone up at the car park, paid for by the city after a petition the old singers began. Fen told the truth about where he was at nineteen. He goes back each year on the parade day and stands at the plaque. Jex and Omi go with him.',
        art: ({ fen, jex, style }) =>
          `Medium shot at the edge of a flat grey car park beside a small bronze plaque mounted on a low stone wall. Standing in front of the plaque are ${fen} and ${jex}, with a small bunch of flowers laid on the wall. Grey overcast light. ${style}`,
      },
      {
        title: 'FOUR HUNDRED BELLS',
        text: 'The four hundred names were rung at Zone C during the victory parade, and the city has since asked Omi to ring them again on every anniversary, in place of the parade. The internees’ song is sung there now. Jex plays it. Fen reads the list aloud before Omi rings it, and his boots have not said CHECKPOINT at that car park since.',
        art: ({ omi, style }) =>
          `Wide shot of a flat grey car park with a crowd of people standing quietly in rows. Standing alone at the front of the crowd on a low wall is ${omi}, ringing a brass bell on its chest. Soft grey overcast light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'kivo', 'sora'],
    title: 'Hive Inspection',
    premise:
      'The Sector Apiary Board requires every beehive to be inspected once a year for disease, and the couch has been carrying, without knowing it, a wild hive inside its backrest for two years. The bees are healthy. The Board says an unregistered hive must be destroyed. Brin knows the bees pollinate her garden. Kivo has been hearing a faint hum in the pressure for months and thought it was their own wrists. Sora has to open the backrest, and would like to ask the bees first.',
    steps: [
      {
        title: 'Opening the Backrest',
        setup:
          'The inspector waits with his smoker and a form. Sora apologises to the backrest, and to the bees, and opens the panel with two hands while four others hold a cloth to calm them. The comb fills the whole cavity, gold and heavy. The bees are calm. The inspector says that unregistered hives are destroyed as a precaution. Brin is standing very still.',
        options: [
          {
            label: 'Register the hive on the spot',
            outcome:
              'Brin fills in the registration form on the spot, naming the couch as the hive’s location and herself as its keeper, though she says the bees keep themselves. The inspector inspects. The hive is perfectly healthy. He stamps the form and says it is the strangest hive he has ever registered and the cleanest.',
            ending: 0,
          },
          {
            label: 'Kivo asks the inspector to listen first',
            outcome:
              'Kivo asks the inspector to put his ear to the backrest before he decides anything. He does. The hum is calm and steady, the hum of a healthy hive, and he knows it, because he has kept bees for forty years. He sets down his smoker and says that he would like to sit for a minute.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot behind the scarlet velvet backrest of a long couch, an open panel revealing a large golden honeycomb filling the cavity, bees crawling calmly on it. Holding the panel open with two hands and a soft cloth with four others is ${sora}. A man in a white bee veil with a brass smoker stands behind her. Warm golden light. ${style}`,
      },
      {
        title: 'The Queen',
        setup:
          'The inspector must find the queen to complete the inspection. She is deep in the comb, and finding her means taking the comb apart. Sora does not want to take apart something that has built itself. Brin knows that a hive disturbed in autumn may not survive the winter. Kivo can hear the pressure of the hive change as the inspector’s hand moves, and can tell where the queen is.',
        options: [
          {
            label: 'Kivo locates her by ear',
            outcome:
              'Kivo listens with their wrists and points to one spot in the comb, near the back, where the hum is slightly different. The inspector lifts a single frame and the queen is there. He marks his form, sets the frame back and closes the panel. The hive is disturbed for less than a minute.',
            ending: 0,
          },
          {
            label: 'Brin asks to leave her unseen',
            outcome:
              'Brin asks the inspector whether the form can be completed without seeing the queen, given that the hive is plainly thriving. He checks the Board’s rules. There is a clause for wild hives in difficult places: evidence of laying is enough. Brin shows him new brood. He marks the form and does not look for the queen.',
            ending: 1,
          },
        ],
        art: ({ kivo, brin, style }) =>
          `Close-up of an open panel in the back of a red velvet couch, a golden honeycomb filling it. Pressing one thin wrist close to the comb and listening is ${kivo}. Kneeling beside them pointing to a spot on the comb with one green finger is ${brin}. Bees crawl calmly. Warm golden light. ${style}`,
      },
      {
        title: 'The Honey',
        setup:
          'The hive has made honey, a great deal of it, from Brin’s garden. The Board allows a registered keeper to harvest honey for personal use. The bees would need some for winter. The inspector would like a jar, for his records. Sora says that if the bees made it, they should be asked how much they will spare. Brin says bees answer that question by not stinging you.',
        options: [
          {
            label: 'Take one frame, and leave the rest',
            outcome:
              'Sora lifts out a single frame of honey, slowly, and nobody is stung. Brin leaves the rest for winter. The honey tastes of ferns and mushrooms and something like the couch’s velvet. The inspector takes one jar for his records and two more, unofficially, for his grandchildren.',
            ending: 0,
          },
          {
            label: 'Leave all of it for the bees',
            outcome:
              'Brin decides to leave all the honey for the bees this first year, since they have only just been discovered and deserve to winter in peace. The inspector agrees it is wise. Kivo closes the panel. Sora, who wanted to taste it, says she will ask again in spring.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the front cushion is ${brin}, holding up a single wooden frame of golden honeycomb to the lamp, a few bees walking on it. A small glass jar of honey stands on the armrest. Black space beyond, warm golden light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'REGISTERED, BACKREST',
        text: 'The couch carries a registered beehive in its backrest, inspected each year and passed each year. The honey tastes of Brin’s garden. Kivo knows now that the hum in the pressure is bees, and finds it comforting. Sora opens the panel only when the bees are calm, and always apologises first.',
        art: ({ sora, kivo, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp, a closed panel in the backrest with a small printed paper certificate pinned to it and a few bees walking on the velvet. Seated below it are ${sora} and ${kivo}, listening. Warm golden light. ${style}`,
      },
      {
        title: 'WINTERED IN PEACE',
        text: 'The bees wintered undisturbed in the backrest and came out in spring stronger than before. The Board’s wild-hive clause is used more often since the inspector wrote it up. In spring Sora asked, and the bees spared one frame, and she tasted it, and said it was the first thing she had ever been given by a hive.',
        art: ({ kivo, style }) =>
          `Medium shot on scarlet velvet cushions in bright spring light, a few bees drifting above the armrest garden of ferns. Seated on the backrest with one thin wrist raised as a bee lands on it is ${kivo}. Black space and stars beyond a clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'omi', 'sora'],
    title: 'Release Valve',
    premise:
      'The pressure valve on the old steam main beneath the town of Coldharbour is aware, and has been whistling a warning for a month that nobody can hear, because it is pitched too high for human ears. Kivo hears it through their wrists. Omi hears it through its stone. Sora has been sent by the town’s utility to replace the valve with a silent one, because the town council has complained of a whine that only dogs can hear and that keeps the dogs awake.',
    steps: [
      {
        title: 'The Whine',
        setup:
          'Sora climbs down into the tunnel and apologises to the valve first. It is a big brass valve on a pipe as wide as a person, and it is whistling, very high, without stopping. Kivo’s wrists whistle with it, in the same pitch. Omi lays a hand on the pipe and rings its smallest bell, the one for no, by itself. Something in the pipe is wrong.',
        options: [
          {
            label: 'Omi translates the warning down',
            outcome:
              'Omi listens to the valve’s whistle and rings it again two octaves lower, slowly, so that people can hear it. The tunnel fills with a low urgent tone. Sora hears it at once: it is the pressure warning pattern from the old steam codes. The main is over pressure. The valve has been saying so for a month.',
            ending: 0,
          },
          {
            label: 'Kivo traces the pressure to its source',
            outcome:
              'Kivo follows the pressure along the tunnel by ear, past the valve, for half a kilometre, to a junction where a newer valve has been welded shut by a contractor. Pressure has been building behind it for a month. The old valve has been venting what it could and whistling the rest.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a dim brick utility tunnel with a huge steam pipe running along the wall and a large brass valve set into it, wisps of steam leaking from its seal. Kneeling at the valve with four hands on the brass and two holding a lamp is ${sora}. Warm orange lamp light, dark tunnel behind. ${style}`,
      },
      {
        title: 'The Council',
        setup:
          'The council wants the whine stopped tonight. Replacing the valve with a silent one would stop the whine and remove the only warning the town has of a main that could burst under its high street. Sora has the silent valve in her bag. Omi has the warning in its bells. Kivo has found the welded junction, and the contractor’s name on the weld tag.',
        options: [
          {
            label: 'Omi rings the warning in the council chamber',
            outcome:
              'Omi goes up to the council chamber and rings the valve’s warning in it, two octaves down, so that the whole council can hear what the dogs have been hearing for a month. The chamber goes quiet. The chair asks what it means. Sora tells them. The council orders the main shut down within the hour.',
            ending: 0,
          },
          {
            label: 'Sora refuses to fit the silent valve',
            outcome:
              'Sora tells the utility that she will not fit a silent valve on a main that is over pressure, because silence is not safety, and that she will put it in writing. The utility’s manager reads her note and calls the council himself. The main is shut down that night, before it bursts.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot inside a wood-panelled town council chamber with councillors seated at a horseshoe table. Standing at the centre of the floor is ${omi}, ringing a large brass bell on its chest, and several councillors have half risen from their seats. Warm chamber light. ${style}`,
      },
      {
        title: 'The Valve’s Retirement',
        setup:
          'With the welded junction cut open and the main repaired, the old valve is no longer needed to vent. The utility would like to scrap it. It is aware, and it has saved the high street. Sora would like to ask it what it wants. Kivo would like to know whether a warning that nobody heard still counts as having been given. Omi already knows the answer.',
        options: [
          {
            label: 'The valve stays on as a gauge',
            outcome:
              'Sora asks the valve what it would like. It would like to keep watching the pressure, now that someone can hear it. Sora fits it with a small brass horn that drops its whistle to a pitch people can hear, and leaves it on the main as a gauge. It whistles once a day, at noon, to say all is well.',
            ending: 0,
          },
          {
            label: 'The valve retires to the town hall',
            outcome:
              'The valve retires, by its own choice, to a glass case in the town hall, with a plaque explaining that it warned the town for a month in a voice nobody could hear. Omi rang at the unveiling. Kivo says it is the first plaque they have read that names who was not listening.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Medium shot in a dim brick utility tunnel with a huge steam pipe and a large brass valve fitted with a small new brass horn. Standing beside the valve with one thin wrist raised toward it, listening, is ${kivo}. Parked at the tunnel mouth is ${couch}. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HEARD AT LAST',
        text: 'The old valve under Coldharbour whistles at noon every day now, at a pitch people can hear, and the dogs sleep again. The contractor who welded the junction has been fined. Sora’s note about silence and safety is pinned up in the utility’s office. Kivo checks the pressure when the couch passes, and the valve whistles hello.',
        art: ({ sora, style }) =>
          `Medium shot in a dim brick tunnel with a huge steam pipe and a large brass valve fitted with a small brass horn. Seated on a crate beside it with all six hands resting on her knees is ${sora}, listening. A wisp of steam rises from the horn. Warm lamp light. ${style}`,
      },
      {
        title: 'NAMED, WHO WAS LISTENING',
        text: 'The valve sits in a glass case in Coldharbour town hall, with a plaque that names the month it spent warning the town and the council that complained about the noise. Visitors read it. The council has installed a new warning system that people can hear. Omi rings the valve’s old warning there once a year, in memory.',
        art: ({ omi, kivo, style }) =>
          `Medium shot inside a small town hall foyer with a glass display case holding a large brass valve and a small bronze plaque. Standing before the case are ${omi}, ringing a brass bell, and ${kivo}, reading the plaque. Soft daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'sora', 'taal'],
    title: 'Hot Bin',
    premise:
      'The couch has been asked to carry a compost heap to the farming moon of Mulch, where the municipal composting plant has failed: its great aware compost heap, the size of a house, has gone cold and stopped working. A cold heap rots instead of composting. Brin knows compost better than anyone in the sector. Sora has been asked to repair the plant’s turning machinery. Taal has been asked, by the heap itself, through the plant manager, to come and tell it what is wrong, because it cannot tell its own temperature.',
    steps: [
      {
        title: 'The Cold Heap',
        setup:
          'The heap is enormous and sullen. Taal stands beside it and reads it: twelve degrees, when it should be sixty. On Nacre a body at twelve degrees is in despair. Brin digs her hands into the edge and finds it waterlogged and airless, packed down by machinery that has stopped turning. Sora finds the turning machine aware and exhausted, its gears stripped.',
        options: [
          {
            label: 'Brin turns it by hand',
            outcome:
              'Brin climbs onto the heap with a fork and turns it by hand, all day, opening it to the air, while Sora works on the machine. By evening the heap’s core is warming. Taal reads it: twenty degrees, rising. The heap, through the manager, says it can feel itself again.',
            ending: 0,
          },
          {
            label: 'Sora asks the turning machine to try',
            outcome:
              'Sora asks the turning machine whether it would like to try once more, slowly, with her help. It would. She holds the stripped gears in place with four hands while it turns, very slowly. The heap opens. Taal reads it warming. The machine stops after an hour, worn out and proud.',
            ending: 1,
          },
        ],
        art: ({ brin, taal, style }) =>
          `Wide shot of a huge dark compost heap the size of a house on a flat farming moon, a large rusted turning machine with a broken arm parked beside it. Standing on the heap with a garden fork is ${brin}. Standing at its base with one webbed hand pressed flat into the compost is ${taal}. Grey daylight. ${style}`,
      },
      {
        title: 'Sixty Degrees',
        setup:
          'The heap must reach sixty degrees to work properly. It is at forty and stuck. Taal can warm a room by approving of it, and has never warmed anything this large. Brin says a heap warms itself if it is fed the right things in the right order. The plant has been feeding it only one kind of waste for years, the cheapest. Sora has the machine’s repair parts arriving in two days.',
        options: [
          {
            label: 'Taal approves of the heap',
            outcome:
              'Taal sits on the edge of the heap and approves of it, sincerely, for six hours, the hardest thing he has done with his body in years. It rises to forty-eight. Then the heap, encouraged, warms itself the rest of the way. Taal goes home very cold and very pleased.',
            ending: 0,
          },
          {
            label: 'Brin changes what it is fed',
            outcome:
              'Brin rewrites the heap’s feeding schedule: green waste, then brown, then green, in layers, and a little of her own garden’s fungi as a starter, with the garden’s consent. Within two days the heap is at sixty-two degrees and steaming in the cold air. The manager writes the schedule on the wall.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot at the base of a huge steaming dark compost heap in cold grey air. Seated cross-legged on the edge of the heap is ${taal}, hands resting on his knees, eyes closed, while a thin column of steam rises from the compost beside him. Grey daylight. ${style}`,
      },
      {
        title: 'The Machine',
        setup:
          'The repair parts arrive. The turning machine could be repaired to work as it did, turning the heap on a timetable whether the heap needs it or not. Or it could be repaired to turn only when the heap asks, which means the heap and the machine would have to learn to talk to each other. Sora would like them to. The plant manager would like a timetable.',
        options: [
          {
            label: 'Fit it to the old timetable',
            outcome:
              'Sora repairs the machine as it was, on its old timetable, but changes the schedule to Brin’s and halves the hours. The machine is relieved. The heap stays warm. The manager is happy because he still has a timetable, even if it is one he did not write.',
            ending: 0,
          },
          {
            label: 'Teach the heap and the machine to talk',
            outcome:
              'Sora fits a small temperature sensor in the heap and wires it to the machine, so that the machine turns only when the heap gets cold. The two of them learn each other over a week. Taal, reading them, says they are getting on. The manager has nothing to do and enjoys it.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Medium shot beside a large rusted turning machine with its arm repaired and gleaming new gears, a huge steaming compost heap behind it. Fitting the last gear with four hands while two hold a spanner is ${sora}. Parked nearby is ${couch}. Grey daylight with warm steam. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SIXTY-TWO AND STEAMING',
        text: 'The compost heap on Mulch runs hot again and feeds every farm on the moon. The turning machine works half the hours it used to. Taal approved of a heap the size of a house and has been asked back each winter to approve of it again. Brin’s feeding schedule is painted on the plant’s wall in letters a metre high.',
        art: ({ brin, style }) =>
          `Wide shot of a huge steaming compost heap on a flat farming moon, a painted schedule in large white letters on the plant wall behind it. Standing at the base of the heap holding a garden fork and looking up at the steam is ${brin}. Grey daylight. ${style}`,
      },
      {
        title: 'TURNED ON REQUEST',
        text: 'The heap and the machine on Mulch talk to each other now, in temperatures, and the heap has not gone cold since. The plant manager spends his time growing tomatoes. Sora visits each year to service the sensor and asks the heap how it feels. Taal reads the answer: warm, which he says is the best answer anything ever gives.',
        art: ({ taal, sora, style }) =>
          `Medium shot beside a huge steaming compost heap with a small brass sensor stuck into its side on a wire. Standing beside the heap are ${taal}, one webbed hand raised to feel the warmth, and ${sora}, holding the sensor wire in two hands. Warm steam in grey daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'omi', 'sora'],
    title: 'Mycelial Network',
    premise:
      'The forest moon of Underleaf has a mycelial network beneath it that connects every tree, and the network has started carrying signals that are not chemical: faint electrical pulses, rhythmic, almost musical. The Moon’s Telecommunications Board says it is interference and wants it grounded. Brin says it is the forest talking. Omi says it is the forest ringing. Sora has been sent by the Board to install a grounding spike, and has found that the network is aware.',
    steps: [
      {
        title: 'The Pulse',
        setup:
          'Brin presses her hands into the soil and feels the pulse through her own roots. Omi lays its stone body flat on the forest floor and listens. The pulse is a rhythm, six beats, then a pause, then six beats. Omi has six bells. It rings them, one after another, and the pulse changes, for the first time, to match. Sora is holding the grounding spike and has not moved.',
        options: [
          {
            label: 'Omi keeps ringing to it',
            outcome:
              'Omi rings back to the network all afternoon, varying the rhythm, and the network varies with it. By evening it is answering. Brin says the forest has been trying to talk to something that could hear it for a very long time. Sora puts the grounding spike back in its case.',
            ending: 0,
          },
          {
            label: 'Sora asks the network directly',
            outcome:
              'Sora kneels and asks the network, aloud, whether it would like the spike. She does not expect an answer in words. The pulse stops entirely, for a whole minute, which in that rhythm is a clear refusal. Then it starts again, faster. Sora takes the spike out of the soil and apologises.',
            ending: 1,
          },
        ],
        art: ({ brin, omi, style }) =>
          `Medium shot on a mossy forest floor among tall dark tree trunks, pale threads of mycelium showing through the soil. Kneeling with both green hands pressed into the soil is ${brin}. Lying flat on the moss beside her with its crystal head turned to listen is ${omi}. Soft green forest light. ${style}`,
      },
      {
        title: 'The Interference',
        setup:
          'The Board’s problem is real: the network’s pulses are leaking into the moon’s radio band and disrupting emergency calls. Ignoring it is not an option. Grounding it would silence the forest. Sora knows the radio equipment. Brin knows the forest. Omi knows how to share a frequency, having spent its life being told it was too loud.',
        options: [
          {
            label: 'Sora moves the radio band',
            outcome:
              'Sora retunes the moon’s emergency radio to a band the network does not use, which takes three days and every one of her six hands. The forest keeps its frequency. The emergency calls come through clear. The Board complains about the cost and then about nothing.',
            ending: 0,
          },
          {
            label: 'Omi asks the forest to share',
            outcome:
              'Omi rings to the network a simple pattern meaning wait, then speak, which it learned in the Quiet Carriage. It rings it for days. The network learns it. Now it pauses whenever an emergency call comes through, and pulses again after. Sora measures it and says it is the most polite interference she has ever seen.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot inside a small wooden radio hut in a dark forest, shelves of old radio equipment glowing with dials. Seated at the bench retuning a large radio set with four hands while two adjust a wire is ${sora}. Through the window tall trees stand in green light. Warm dial glow. ${style}`,
      },
      {
        title: 'The Board’s Report',
        setup:
          'The Board must report to the moon’s government on what the network is. If it is interference, it is a fault. If it is a mind, it has rights under the moon’s charter, which no one has ever applied to a forest. Brin has been asked to give evidence. Omi has been asked whether it can translate. Sora has been asked for a technical opinion.',
        options: [
          {
            label: 'Brin testifies that it is alive',
            outcome:
              'Brin testifies that the network is a living mind, as old as the forest, and that it has been speaking for centuries to things that could not hear it. The government listens. It votes to recognise the network as a resident of the moon, the first non-animal resident in its history, with Brin as its advocate.',
            ending: 0,
          },
          {
            label: 'Omi rings the forest’s answer',
            outcome:
              'Omi rings, in the government chamber, the pattern the network has been sending back: six beats, pause, six beats, with a seventh at the end that it added after meeting Omi. Nobody can translate it. But the chamber can hear it, and the government votes to protect the network until someone can.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Medium shot inside a high wood-panelled government chamber with members seated on curved benches. Standing on the floor at the centre is ${omi}, ringing all six brass bells on its chest. Parked along the side wall is ${couch}, its armrest garden full of ferns. Warm chamber light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'RESIDENT, UNDERGROUND',
        text: 'The mycelial network of Underleaf is a legal resident of the moon, with Brin as its advocate, and its pulses are on a band of their own. The emergency radio is clear. Omi rings to the forest whenever the couch is near, and the forest rings back, in pulses, a little more each year. Sora keeps the grounding spike as a doorstop.',
        art: ({ brin, style }) =>
          `Medium shot on a mossy forest floor among tall dark tree trunks in soft green light. Seated with her back against a tree trunk, both hands resting on the soil and eyes closed, is ${brin}, pale threads of mycelium glowing faintly in the moss around her. ${style}`,
      },
      {
        title: 'WAIT, THEN SPEAK',
        text: 'The forest of Underleaf pauses for every emergency call and speaks again after, a habit it learned from Omi in three days. Its seventh beat is still untranslated and still protected. Sora services the radio hut each year. Brin says that the forest is the best student of manners she has ever met.',
        art: ({ sora, omi, style }) =>
          `Medium shot inside a small wooden radio hut in a dark forest. Seated at the radio bench are ${sora}, adjusting a dial with one of her six hands, and ${omi}, one stone hand resting on a brass bell. Tall trees show through the window. Warm dial glow and green light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'omi', 'sora'],
    title: 'The Door',
    premise:
      'The airlock door of the old quarantine station at Hollow Lantern is aware, and has refused to open for nine days. Behind it are forty refugees waiting for clearance. In front of it is the Station Authority, which wants it opened so the refugees can be processed and sent back. Fen once stood on the Authority’s side of doors like this. Sora has been sent to override the lock. Omi has been asked to ring the all-clear signal, which the door was built to obey.',
    steps: [
      {
        title: 'The Lock',
        setup:
          'Sora apologises to the door and opens its control panel. The lock is not broken. The door has chosen to stay shut. Its log shows that it has been opened forty times in the past year to let people out who were then sent away, and that each time it recorded who they were. Fen’s boots announce CHECKPOINT at the door, and the door’s lock clicks tighter in reply.',
        options: [
          {
            label: 'Sora asks the door why',
            outcome:
              'Sora asks the door why it will not open. The door answers through its panel, slowly: it has learned that when it opens, the people behind it are taken away. It would rather stay shut. Sora closes the panel and does not override anything. She tells the Authority the door has a reason.',
            ending: 0,
          },
          {
            label: 'Fen takes his boots off',
            outcome:
              'Fen takes off his boots and sets them down well away from the door, so that it does not hear CHECKPOINT. Then he speaks to it through the panel, in his own voice, and tells it what he used to do at doors like this. The lock loosens by one click. Sora says that is the door listening.',
            ending: 1,
          },
        ],
        art: ({ fen, sora, style }) =>
          `Medium shot in a cold grey station corridor before a heavy round airlock door with a glowing control panel. Standing barefoot in grey socks before the door is ${fen}, his heavy scuffed black boots set down far behind him. Kneeling at the open control panel is ${sora}, two hands inside it. Cold blue light. ${style}`,
      },
      {
        title: 'The All-Clear',
        setup:
          'The Authority orders Omi to ring the all-clear signal, which the door was built to obey. Omi knows the signal. It also knows that ringing it would mean lying to the door, because it is not clear: the refugees will be sent back. Omi was once silenced for ringing a true warning. Now it is being asked to ring a false all-clear. Its smallest bell is already ringing no.',
        options: [
          {
            label: 'Omi refuses, and rings no',
            outcome:
              'Omi rings its smallest bell, the one for no, at the Authority, three times, clearly. The door hears it. Its lock clicks again, tighter, in what Sora reads as agreement. The Authority officer says that Omi has refused a lawful order. Omi rings no once more.',
            ending: 0,
          },
          {
            label: 'Omi rings the truth instead',
            outcome:
              'Omi rings, instead of the all-clear, the signal that means danger outside, which is true: the danger is the Authority. The door has never heard that signal used this way. It holds. Behind it, the refugees hear the bell through the steel and some of them begin to sing.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a cold grey station corridor before a heavy round airlock door. Standing before the door is ${omi}, ringing the smallest brass bell on its chest with one stone finger. A uniformed officer in a peaked cap stands behind it with one hand raised. Cold blue light. ${style}`,
      },
      {
        title: 'Asylum',
        setup:
          'The standoff draws attention. A Concord observer arrives and tells the Authority that the forty behind the door have the right to claim asylum, and that the door, as the last barrier, is technically the border. If the door agrees to open for the observer only, the forty can be processed as asylum seekers rather than as returnees. Sora has to ask the door. Fen has to put his boots back on.',
        options: [
          {
            label: 'The door opens for the observer',
            outcome:
              'Sora explains the observer to the door and asks whether it will open for her alone. It will. It opens a hand’s width, and the observer steps through, and the forty begin their claims. Fen stands at the door in his boots, which say CHECKPOINT, and he says welcome after every one.',
            ending: 0,
          },
          {
            label: 'The door opens from inside',
            outcome:
              'Sora suggests the door be given to the refugees: its controls moved to the inside, so that it opens only when they choose. The observer agrees. The door agrees. It opens the next morning, from inside, when the forty are ready, and they walk out with their asylum claims in their hands.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Medium shot in a cold grey station corridor where a heavy round airlock door stands half open, warm light spilling from inside. Standing beside the open door with four hands resting on its rim is ${sora}. A line of refugees with bags steps out into the corridor. Parked at the corridor’s end is ${couch}. ${style}`,
      },
    ],
    endings: [
      {
        title: 'OPENED FOR THE OBSERVER',
        text: 'The forty behind the door at Hollow Lantern were processed as asylum seekers, and most of them have been granted it. The door still guards the old quarantine station and opens only for observers. Fen said welcome forty times in his boots. Omi’s three rings of no are in the Concord’s report, as the moment the standoff turned.',
        art: ({ fen, style }) =>
          `Medium shot in a grey station corridor before a heavy round airlock door standing a hand’s width open. Standing beside it in his heavy scuffed black boots is ${fen}, holding out one hand toward a family stepping through. Warm light spills from the gap. ${style}`,
      },
      {
        title: 'OPENED FROM INSIDE',
        text: 'The door at Hollow Lantern opens from the inside now, under the control of whoever is behind it, and the old quarantine station is a shelter. Sora rewired it and visits it each year. Omi rings outside it, softly, before knocking. The door has never been forced since, and has never needed to be.',
        art: ({ omi, sora, style }) =>
          `Medium shot in a warm-lit station corridor before a heavy round airlock door with a new control panel on its inner rim. Standing before the door are ${omi}, one stone hand raised to knock, and ${sora}, holding a small toolbox. Warm light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'omi', 'taal'],
    title: 'Shipping Forecast',
    premise:
      'The Spindle’s shipping forecast is read aloud every night at midnight on the public band, a long list of sea areas and their weather, and the reader has retired after forty years. The broadcaster has asked the couch to read it for a month while a replacement is found. Kivo can feel the pressure systems the forecast describes. Taal can feel their temperatures. Omi has been asked to read it, because its voice carries, and has pointed out that its voice is bells.',
    steps: [
      {
        title: 'The Reading',
        setup:
          'The forecast must be read in the old form: sea area, wind, weather, visibility, with nothing added. Omi can ring each word in bells, which the fishing crews could learn, but nobody can understand at first hearing. Kivo can read words aloud, but has never spoken to more than a few people at once. Taal can read slowly and very clearly, but lowers the studio a degree every time he says the word gale.',
        options: [
          {
            label: 'Taal reads it, cooling the room',
            outcome:
              'Taal reads the forecast in his slow clear voice, and the studio gets colder with every gale. The fishing crews on the band say it is the most serious forecast they have heard in forty years, and that they believed every word of it. Several stay in harbour who would otherwise have gone out.',
            ending: 0,
          },
          {
            label: 'Omi rings it, and Kivo reads it after',
            outcome:
              'Omi rings the forecast in bells, sea area by sea area, and then Kivo reads it again in words. The first night the crews are confused. By the fourth night they have learned the bells. By the end of the month some say they prefer them, because a bell cannot sound reassuring when it is not.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot inside a small dark radio studio with a single microphone on a stand and a wall of brass dials. Seated at the microphone reading from a paper sheet is ${taal}, frost forming on the edge of the desk. A red ON AIR lamp glows above the door. Warm dial light. ${style}`,
      },
      {
        title: 'The Missing Area',
        setup:
          'The forecast lists thirty sea areas. Kivo, reading the pressure charts, finds a thirty-first: a small region where a storm is forming, which is not in the forecast because it is not on the official chart. It is where the fishing families of Tarrow go in winter, unofficially. The broadcaster says only official areas may be read. Kivo’s wrists are whistling.',
        options: [
          {
            label: 'Read the missing area anyway',
            outcome:
              'Kivo reads the thirty-first area at the end, by its local name, with its gale warning. The broadcaster is furious. The Tarrow families, out on the water, hear it and come home. The storm arrives the next night. The broadcaster adds the area to the official list the following week.',
            ending: 0,
          },
          {
            label: 'Omi rings it in bells only',
            outcome:
              'Omi rings the warning for the missing area in bells, after the official forecast, and Kivo does not read it in words. Only the people who have learned the bells understand. The Tarrow families have learned them. They come home. The broadcaster hears bells and does not know what they said.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Close-up on a radio studio desk of a large paper pressure chart with thirty numbered sea areas outlined and one small unlabelled area circled in pencil. Holding one thin wrist above the circled area, listening, is ${kivo}. A microphone stands at the edge of the desk. Warm dial light. ${style}`,
      },
      {
        title: 'The Replacement',
        setup:
          'At the end of the month the broadcaster has found a replacement: a smooth young announcer who reads beautifully and has never been to sea. The crews have written in asking for the couch to stay. Taal knows the job is not his, and that the forecast must belong to the band. Omi would like to teach the new reader the bells. Kivo would like the thirty-first area kept.',
        options: [
          {
            label: 'Teach the replacement the bells',
            outcome:
              'Omi spends a week teaching the young announcer to ring the forecast on a small set of brass bells, alongside reading it. She is clumsy at first. By her first broadcast she is good. The crews keep the bells. The thirty-first area is on the list. Taal listens every midnight from the couch.',
            ending: 0,
          },
          {
            label: 'Take the replacement out to sea',
            outcome:
              'Taal asks the broadcaster to send the new reader out on a fishing boat for one night before she reads. She goes, through a gale, and comes back pale. Her first broadcast is the slowest and clearest the band has heard. The crews write in again, this time to say she will do.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Medium shot inside a small dark radio studio with a microphone on a stand. Seated at the desk is a young woman holding a small brass bell, and standing beside her guiding her hand is ${omi}. Through the studio window ${couch} floats in the night. Warm dial light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THIRTY-ONE AREAS',
        text: 'The Spindle shipping forecast lists thirty-one sea areas now, the last one by its local name, and the fishing families of Tarrow listen for it. The forecast is read every midnight in words and in bells. Taal’s month of gales is remembered by the crews as the coldest and most trusted forecast ever read. Kivo checks the pressure charts when the couch is near.',
        art: ({ taal, kivo, style }) =>
          `Medium shot on scarlet velvet cushions at midnight under a dim brass lamp. Seated side by side are ${taal}, listening to a small brass radio set on the cushion, and ${kivo}, one thin wrist raised. A dark sea shows far below the clear bubble. ${style}`,
      },
      {
        title: 'IN BELLS, AT MIDNIGHT',
        text: 'The forecast is rung in bells at midnight now, by a young reader who has been to sea, and the crews prefer it. Omi taught her. The warning for the unofficial area is rung in bells only, every night, and only the people who need it understand it. Kivo says it is the best kept secret on the public band.',
        art: ({ omi, style }) =>
          `Medium shot on the scarlet velvet backrest of a long couch at midnight, a dark sea far below. Standing on the backrest is ${omi}, ringing a brass bell on its chest, its amber eyes lifted to the stars. Dim lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'kivo', 'omi'],
    title: 'Dawn Chorus',
    premise:
      'The Sector Wildlife Office runs a dawn chorus survey every spring, counting birds by their songs before sunrise, and it has hired the couch to survey the forest of Kell Hollow. Brin can identify every species. Kivo can hear the pressure of wingbeats. Omi has been asked to stay quiet, because a bell at dawn would confuse the count. On the first morning the forest is silent, entirely, and the Office says there must be no birds left.',
    steps: [
      {
        title: 'Silence',
        setup:
          'At dawn there is no song at all. Brin knows the forest should be loud. Kivo can feel wingbeats in the trees, hundreds of them, so the birds are there. They are not singing. Omi stands still, ringing nothing, and notices that the silence has the shape of a warning: in its own language, a whole chorus going quiet at once means danger nearby.',
        options: [
          {
            label: 'Omi tells the others what the silence means',
            outcome:
              'Omi rings one very small bell, breaking its instruction, to tell the others that the silence is a warning. Brin looks around and sees it: a survey drone hovering over the canopy, buzzing like a hawk. The birds are hiding from it. Brin asks the Office to ground its drone.',
            ending: 0,
          },
          {
            label: 'Kivo follows the wingbeats',
            outcome:
              'Kivo follows the wingbeats through the trees by pressure, quietly, to a single clearing where hundreds of birds are gathered low in the bushes, silent. Above the clearing hangs the Office’s own survey drone, buzzing. Kivo signals Brin. Brin asks the Office, very politely, what its drone is for.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot in a dim forest at dawn, tall trees in grey mist and many small brown birds crouched silently in low bushes. Standing among the bushes with one thin wrist raised, listening, is ${kivo}. A small grey drone with spinning rotors hovers above the canopy. Pale dawn light. ${style}`,
      },
      {
        title: 'The Drone',
        setup:
          'The Office’s drone was sent to count the birds faster. Its rotors sound to the birds exactly like a hawk. The birds have been silent every dawn since it arrived. The Office’s count shows a collapse in the population, and it is about to declare the forest in crisis, which would close it to the villagers who gather wood there. Brin has the real count from Kivo.',
        options: [
          {
            label: 'Brin presents the real count',
            outcome:
              'Brin presents the Office with Kivo’s wingbeat count: the birds are all there, in normal numbers, hiding. The Office grounds the drone. The next morning the forest sings so loudly that the survey takes four hours. The crisis declaration is withdrawn before it is announced.',
            ending: 0,
          },
          {
            label: 'Omi teaches the drone to sound like a bell',
            outcome:
              'Omi suggests that the drone could sound different. With the Office’s permission, it retunes the drone’s rotors to a soft chime instead of a buzz. The birds have never heard a chime in the sky. They sing at it, curiously, the next morning. The drone counts them, and they are all there.',
            ending: 1,
          },
        ],
        art: ({ brin, omi, style }) =>
          `Medium shot at the edge of a misty forest at dawn, a small grey drone with rotors lying on a folding table. Standing beside the table holding up a paper tally sheet is ${brin}. Standing beside her with one stone hand on the drone’s rotor is ${omi}. Pale dawn light. ${style}`,
      },
      {
        title: 'The Chorus',
        setup:
          'On the last morning of the survey the forest sings fully. The Office wants a recording for its archive. Omi has been asked not to ring. Brin can name every bird. Kivo can count them. The chorus is at its loudest just before sunrise, and in the middle of it Omi hears a gap, one species missing, a small bird whose song it has heard only in old recordings.',
        options: [
          {
            label: 'Omi rings the missing song',
            outcome:
              'Omi rings, very softly, the song of the missing bird from the old recordings, once. After a long pause, from deep in the forest, a single small bird answers. Brin identifies it: a species the Office believed extinct in Kell Hollow for twenty years. It is added to the count.',
            ending: 0,
          },
          {
            label: 'Brin names the gap in the report',
            outcome:
              'Brin writes the gap into the Office’s report: one species not heard, its old song noted, its habitat described. She does not ring anything. The Office funds a search. A year later the small bird is found, in a valley Kivo traced by the pressure of its wingbeats.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Wide shot of a misty forest at sunrise, birds of many colours perched singing in the trees. Hovering just above the canopy is ${couch}, and standing on its backrest is ${omi}, ringing one small brass bell softly. Golden sunrise light through the mist. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ANSWERED FROM THE FOREST',
        text: 'Kell Hollow’s dawn chorus is counted every spring without drones, and the count includes a small bird believed extinct for twenty years, which answered Omi’s bell. The forest is open to the villagers. Brin keeps a recording of the answer. Omi is allowed one bell at every survey now, by the Office’s rule, and uses it only once.',
        art: ({ brin, style }) =>
          `Medium shot in a misty forest at dawn. Kneeling on the forest floor with a small brass recording box held up toward the trees is ${brin}, her fern-frond hair damp with mist. A small grey bird with a white throat sings on a low branch above her. Pale golden light. ${style}`,
      },
      {
        title: 'NOTED, THEN FOUND',
        text: 'The gap in the Kell Hollow chorus was noted, searched for and found, in a valley Kivo traced by wingbeats, and the small bird is protected there now. The Office’s drones chime. The crisis that was nearly declared is used in training as an example of counting the wrong thing. Kivo has the valley on no map.',
        art: ({ kivo, omi, style }) =>
          `Medium shot on scarlet velvet cushions at dawn under a brass lamp. Seated side by side are ${kivo}, one thin wrist raised, and ${omi}, one stone hand resting on a brass bell. A misty green valley full of birds lies below the clear bubble. Pale golden light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'omi', 'taal'],
    title: 'Hibernation Notice',
    premise:
      'The garden on the couch has given notice, through its union steward, that it intends to hibernate for the winter, as its ancestors did on Rootborne. It will produce no oxygen for six weeks. The couch’s backup scrubbers can cover four. Brin has to decide whether to wake it, which the garden has said would be a breach of its terms, or find two weeks of air. Taal, from a polar shelf, knows hibernation well. Omi has been asked to ring the garden awake if it comes to that, and has not agreed.',
    steps: [
      {
        title: 'The Notice',
        setup:
          'The notice is a single brown leaf pinned to the backrest, which Brin reads as clearly as a letter: six weeks, starting at the first frost, as was always the custom. The couch has no frost. Taal can make one. The garden has asked, in the notice, for a frost to be provided so that it may begin properly. Brin knows that if it begins, it will not stop for six weeks.',
        options: [
          {
            label: 'Taal provides the frost',
            outcome:
              'Taal lowers the armrest garden to two degrees for one night, carefully, a proper first frost. In the morning the ferns have folded and the mushrooms have closed. The garden is asleep. Brin covers it with a cloth. The oxygen gauge on the backrest starts to fall, slowly, and Brin starts counting days.',
            ending: 0,
          },
          {
            label: 'Brin negotiates a shorter winter',
            outcome:
              'Brin meets the steward, a large mushroom, and asks whether the garden would accept four weeks. The steward considers it for a day. The garden says it will accept four weeks if the frost is real and the waking is gentle. Brin agrees. Taal is asked to provide both.',
            ending: 1,
          },
        ],
        art: ({ taal, brin, style }) =>
          `Medium shot on the armrest of a red velvet couch covered in a garden of ferns and pale mushrooms, a thin white frost forming on every leaf. Seated beside the armrest with one webbed hand held flat above the garden is ${taal}. Kneeling beside him holding a folded grey cloth is ${brin}. Cold blue light. ${style}`,
      },
      {
        title: 'Thin Air',
        setup:
          'In the fifth week the scrubbers are failing and the air on the couch is thin. Everyone is tired. The garden is asleep. Omi could ring it awake, with a particular low chord that the garden knows as spring, but it would be against the garden’s wishes and against its terms. Brin is breathing slowly, on purpose. Taal is colder than usual, from saving his strength.',
        options: [
          {
            label: 'Find air elsewhere',
            outcome:
              'Brin sends a message to the nearest station asking to borrow oxygen. It takes two days. The station sends a tank and a note asking whether everything is all right. Brin replies that the garden is on holiday. The station’s manager writes back that she wishes her own staff were as well organised.',
            ending: 0,
          },
          {
            label: 'Omi asks the garden, without waking it',
            outcome:
              'Omi rings, very softly, not the spring chord but a question, the lowest note it has, into the sleeping garden. The garden does not wake. But a single fern unfolds, and gives off a little air, and folds again. Omi rings again the next night, and the next. One fern each night is enough.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot on the armrest of a red velvet couch in dim light, a sleeping garden of folded ferns and closed mushrooms under a grey cloth turned back at one corner. Standing beside it is ${omi}, ringing a large brass bell on its chest very softly. One small fern frond is unfolding. Dim blue light. ${style}`,
      },
      {
        title: 'Waking',
        setup:
          'The winter is over. The garden must be woken gently, as its terms require. Brin has never woken a garden from hibernation on a ship. Taal knows how bodies thaw on Nacre: one degree an hour, never faster. Omi knows the spring chord. The garden’s steward will be the first to wake and will report whether the waking was done properly.',
        options: [
          {
            label: 'Taal warms it a degree an hour',
            outcome:
              'Taal warms the garden one degree an hour for twenty hours, sitting beside it through the night. At dawn the ferns open, slowly, one by one. The steward wakes last, and puts out a single new mushroom, which Brin reads as a satisfactory review. The oxygen gauge begins to rise.',
            ending: 0,
          },
          {
            label: 'Omi rings the spring chord',
            outcome:
              'At the end of the winter, as agreed, Omi rings the spring chord, slowly, once an hour, for a day. The garden wakes to it, frond by frond. The steward says the waking was beautiful and requests the same next year. Brin writes it into the garden’s terms, with Omi named as the bell.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Kneeling at the armrest is ${brin}, lifting a grey cloth off a garden of ferns and pale mushrooms as the ferns begin to unfold. Black space beyond, pale warm morning light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SIX WEEKS, KEPT',
        text: 'The garden hibernated for its full winter, as was its custom, and woke on time to a gentle thaw. The couch borrowed air and returned it, with thanks. Brin has a winter plan now, written into the garden’s terms, with spare tanks ordered every autumn. Taal provides the first frost each year and says it is the most welcome cold he has ever given.',
        art: ({ taal, style }) =>
          `Close-up of the armrest of a red velvet couch with a garden of ferns and pale mushrooms dusted with thin white frost. Seated beside it with one webbed hand raised above the frost is ${taal}, his breath faintly clouding. Cold blue light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'ONE FERN A NIGHT',
        text: 'The garden hibernates for four weeks now, and in the hardest nights Omi rings its lowest note and one fern gives a little air without waking. The garden’s terms name Omi as its spring. Brin says it is the gentlest bargain she has ever helped make. The steward has requested, through a leaf, that the arrangement be permanent.',
        art: ({ omi, brin, style }) =>
          `Medium shot on scarlet velvet cushions in pale morning light, the armrest garden of ferns fully open and green. Seated side by side beside it are ${omi}, one stone hand on a brass bell, and ${brin}, holding a single brown leaf. Black space beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'omi', 'taal'],
    title: 'Disputed Frequency',
    premise:
      'Two neighbouring moons, Arn and Belloc, have been at a cold peace for thirty years, and both claim the same radio frequency for their border warning. Whenever either sounds an alarm, the other jams it, on principle. Last week a meteor shower hit both moons and neither could warn its people. Fen has been asked to inspect the border between them. Omi has been asked by both moons to judge whose alarm the frequency belongs to. Taal has been asked to mediate, and has arrived to a room so cold even he finds it hard.',
    steps: [
      {
        title: 'The Two Alarms',
        setup:
          'Omi listens to both alarms, recorded. Arn’s is a rising whoop. Belloc’s is a falling tone. Both are on the same frequency and both are good warnings. The delegates of each moon want Omi to say which is better. Omi’s smallest bell rings, which means no. Taal reads the room: eleven degrees, the temperature of a quarrel that both sides are ashamed of and neither can stop.',
        options: [
          {
            label: 'Omi plays both at once',
            outcome:
              'Omi rings both alarms at once, the rising and the falling, and they meet in the middle in a single chord that is louder and clearer than either. The delegates are silent. Taal notes that the room has warmed by two degrees. Omi says that the frequency belongs to the chord.',
            ending: 0,
          },
          {
            label: 'Taal asks about the meteor shower',
            outcome:
              'Taal asks each delegate, in turn, who they lost in the meteor shower. Each names someone. Neither knew the other side had lost anyone. The room warms by four degrees. Taal says that a frequency is less important than a funeral, and asks them to start again.',
            ending: 1,
          },
        ],
        art: ({ omi, taal, style }) =>
          `Medium shot in a cold bare meeting room with a long table, frost on the windows, two delegations in heavy coats seated on opposite sides. Standing at the head of the table is ${omi}, ringing two brass bells on its chest at once. Seated upright beside it is ${taal}. Cold blue light. ${style}`,
      },
      {
        title: 'The Border',
        setup:
          'Fen walks the border between the moons’ shared orbit and finds what both sides have built: twin jamming stations, facing each other across a gap of a kilometre, each one manned by a single bored operator. Each operator has orders to jam the other side’s alarm, whatever it says. Fen’s boots announce CHECKPOINT at each station door. Both operators know exactly what those boots mean.',
        options: [
          {
            label: 'Fen introduces the two operators',
            outcome:
              'Fen brings the two operators out of their stations to the middle of the gap and introduces them. They have jammed each other for nine years and never met. One of them lost a sister in the shower. The other did not know. They agree, between themselves, not to jam emergency alarms. Their orders do not change. Their hands do.',
            ending: 0,
          },
          {
            label: 'Fen reports the stations as checkpoints',
            outcome:
              'Fen writes an inspection report describing the twin stations as checkpoints across a warning corridor, which under the Concord’s civilian safety rules are prohibited. Both moons must dismantle them or explain. Neither can explain. Both stations are switched off within the week, and the operators reassigned to weather.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Wide shot of two small grey metal stations with radio masts facing each other across a gap of black space and stars. Standing on a narrow walkway between them in his heavy scuffed black boots is ${fen}, beckoning to two operators in headsets who peer out of their station doors. Cold starlight. ${style}`,
      },
      {
        title: 'The Shared Alarm',
        setup:
          'Both moons agree in principle to share the frequency. Now they must agree on a sound. Arn will not accept Belloc’s tone. Belloc will not accept Arn’s whoop. Omi has the chord. Taal has the room, now at fifteen degrees. Fen has the inspection report, which says that whatever they choose, it must be heard by everyone, which means it cannot be jammed by anyone.',
        options: [
          {
            label: 'Adopt Omi’s chord',
            outcome:
              'Both moons adopt the chord, rising and falling at once, as their shared alarm. Omi records it for them. The delegates shake hands at sixteen degrees, which Taal says is warm enough to mean it. At the next meteor shower both moons sound the chord and nobody is hurt.',
            ending: 0,
          },
          {
            label: 'Alternate the alarms by day',
            outcome:
              'Taal proposes that Arn’s alarm sound on odd days and Belloc’s on even days, and that both moons’ people learn both. It is less elegant than the chord, but each side keeps its own. The delegates agree, at seventeen degrees. Fen writes the schedule into the border report.',
            ending: 1,
          },
        ],
        art: ({ taal, couch, style }) =>
          `Medium shot in a bare meeting room with frost melting from the windows, two delegations in coats shaking hands across a long table. Seated at the head of the table with hands folded is ${taal}. Through the window ${couch} floats in black space. Warming light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE BORDER CHORD',
        text: 'Arn and Belloc share one warning, a chord that rises and falls at once, and neither has jammed it since. The twin jamming stations forecast the weather now. Omi is credited in both moons’ civil defence handbooks. Taal says the room they negotiated in has never been below fifteen degrees again, and he has checked.',
        art: ({ omi, style }) =>
          `Wide shot of two small grey moons side by side in black space, each with a tall radio mast glowing at its top. Standing on a rock in the foreground is ${omi}, ringing two brass bells on its chest at once. Cold starlight. ${style}`,
      },
      {
        title: 'ODD DAYS AND EVEN',
        text: 'Arn sounds its alarm on odd days and Belloc on even days, and both moons’ schoolchildren learn both sounds before they learn to read. The jamming stations are gone. Fen inspects the border each year and finds nothing to report, which he says is his favourite kind of inspection. The two operators are now friends.',
        art: ({ fen, taal, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${fen}, holding a short paper inspection report, and ${taal}, hands folded, two small moons showing beyond the clear bubble. Black space and stars. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'omi'],
    title: 'Avalanche Season',
    premise:
      'The mountain village of Snowcap Rest is cut off by snow every winter, and its avalanche warning is a horn on the ridge that the village council has ordered silent this year, because the ski resort below finds it bad for business. Brin has been asked to inspect the snowpack. Fen has been asked to plan the village’s evacuation route, which runs through the resort. Omi has been asked by the council to stay silent, and by the villagers to do the opposite.',
    steps: [
      {
        title: 'The Snowpack',
        setup:
          'Brin digs a pit in the snow on the ridge and reads the layers. There is a weak layer halfway down, rotten ice under fresh snow, which means the slope above the village could slide at any time. The resort’s own report says the slope is stable. Its report was written from the bottom of the mountain. Omi stands beside the silent horn. Fen is reading the resort’s report and frowning.',
        options: [
          {
            label: 'Brin takes the pit sample to the council',
            outcome:
              'Brin cuts a block of the snowpack, showing the rotten layer plainly, and carries it down to the council chamber in a cool box. She sets it on the table. The council can see the layer. The resort’s representative says it is one sample. Brin says one is enough when it is under the village.',
            ending: 0,
          },
          {
            label: 'Omi tests the slope with a bell',
            outcome:
              'Omi rings a single low bell into the snow, the frequency it has learned shakes loose things that are ready to fall. A small slide breaks away from the slope, harmlessly, far from the village. Everyone on the ridge sees it. The resort’s report is withdrawn the same afternoon.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot on a snowy mountain ridge under a pale sky, a deep square pit dug into the snow showing horizontal layers. Kneeling at the pit edge cutting out a block of snow with a saw is ${brin}, her fern-frond hair dusted with frost. A large brass horn on a post stands silent on the ridge behind. Cold white light. ${style}`,
      },
      {
        title: 'The Route',
        setup:
          'Fen’s evacuation route runs through the resort, because it is the only flat way down. The resort has fenced its slopes and put up a barrier with a ticket booth. In an evacuation, villagers would have to pass the booth. Fen knows what happens at barriers in an emergency: people stop, and wait to be told they may go. His boots announce CHECKPOINT at the booth.',
        options: [
          {
            label: 'Fen has the barrier removed',
            outcome:
              'Fen writes a civilian safety notice requiring the barrier to be removed from the evacuation route, citing the Concord’s rules on corridors, and nails it to the booth. The resort manager tears it down. Fen nails up another. On the third notice the manager calls the council, and the barrier is taken down that night.',
            ending: 0,
          },
          {
            label: 'Fen walks the villagers through once',
            outcome:
              'Fen walks every villager through the evacuation route in a single morning, past the booth, without stopping, so that they will know they do not have to stop. The resort staff watch. Fen tells them that in an avalanche they should open the barrier and run too. Several of them take notes.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot at the bottom of a snowy ski slope, a red-and-white striped barrier and a small wooden ticket booth across a narrow path. Standing at the barrier in heavy scuffed black boots nailing a paper notice to the booth with a hammer is ${fen}. A man in a ski jacket watches from the booth window. Cold white light. ${style}`,
      },
      {
        title: 'The Horn',
        setup:
          'The snow is getting worse. The council’s order to keep the horn silent still stands. The villagers have asked Omi to sound it if the slope moves. Omi was once silenced for ringing a warning at the wrong moment. It has thought about that moment every day since. At three in the morning, standing on the ridge, Omi feels the slope begin to shift beneath it.',
        options: [
          {
            label: 'Omi sounds the horn',
            outcome:
              'Omi sounds the horn, against the order, a long low blast that fills the valley. The village wakes and walks out by Fen’s route, past the open barrier, in nine minutes. The slope comes down twenty minutes later and buries the lower road. Nobody is on it. The council rescinds the order at dawn.',
            ending: 0,
          },
          {
            label: 'Omi rings its own bells',
            outcome:
              'Omi does not touch the horn, which it was ordered not to sound. It rings its own six bells instead, all at once, louder than it has ever rung, from the top of the ridge. The village hears it and goes. The slope comes down behind the last family. The council later rules that Omi obeyed the order exactly.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Wide shot of a snowy mountain ridge at night under stars, a large brass horn on a post at the summit. Standing beside the horn ringing all the brass bells on its chest is ${omi}. Far below in the valley, lit windows of a village glow. Hovering at the ridge edge is ${couch}. Cold blue starlight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE HORN SOUNDED',
        text: 'Snowcap Rest’s avalanche horn sounds whenever the slope moves, by a new bylaw, and the resort pays for its upkeep. The evacuation route has no barrier. The village has a carving of a small stone figure beside the horn, and Omi has seen it and does not mind. Brin checks the snowpack each winter, and Fen walks the route.',
        art: ({ brin, fen, style }) =>
          `Medium shot on a snowy mountain ridge in morning light, a large brass horn on a post with a small carved stone figure set beside it. Standing beside the carving are ${brin}, holding a snow saw, and ${fen}, looking down the slope. Cold bright light. ${style}`,
      },
      {
        title: 'OBEYED EXACTLY',
        text: 'The council ruled that Omi obeyed the order exactly, since it never touched the horn, and then rescinded the order anyway. The horn has sounded twice since, both times in time. The villagers ring a small bell of their own on the anniversary. Omi says it is the first time it has rung a warning that was heard, and kept.',
        art: ({ omi, style }) =>
          `Medium shot in a small snowy village square at dusk, villagers in thick coats gathered round a small bell hung on a wooden frame. Standing at the front of the crowd is ${omi}, one stone hand resting on the brass bells at its chest, its amber eyes bright. Warm lamplight on snow. ${style}`,
      },
    ],
  },
]
