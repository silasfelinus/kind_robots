import type { TrioAdventure } from './trioAdventures'

// Party adventures, first ten (see trioAdventures.ts). Each comes from how
// these three particular people grate against or cover for each other, and
// none is a name swap of another. Endings are written to hold for any run of
// choices that leans toward them, so they describe where the matter settled
// rather than repeating a particular step. Art prompts are literal Krea 2
// prose: crew looks and the couch phrase come in word for word from
// artPrompts.ts, and each prompt shows one moment.

export const TRIO_ADVENTURES_A: readonly TrioAdventure[] = [
  {
    crew: ['brin', 'pell', 'sora'],
    title: 'The Shears Grievance',
    premise:
      'Pell’s wind-up beetle has confiscated Brin’s pruning shears, on the grounds that it confiscates dangerous tools from employers and Brin employs the oxygen garden. The garden, which formed a union in the spring, has backed the beetle. Sora has been asked to arbitrate, and has convened a meeting of her six elbows to decide whether she is allowed to.',
    steps: [
      {
        title: 'Is Brin Management?',
        setup:
          'The garden’s position, delivered as a petition of leaves pinned to the backrest, is that Brin sets its hours, decides its light and once moved it three cushions to the left without consultation. Brin’s position is that she is a gardener. Pell’s position is that every manager he has ever met said that.',
        options: [
          {
            label: 'Rule that Brin is a co-worker, not management',
            outcome:
              'Sora’s elbows vote four to two. Brin is reclassified as a fellow worker and invited to join the union, which she does, and to pay dues, which she does in compost. The beetle returns the shears and keeps the receipt.',
            ending: 0,
          },
          {
            label: 'Rule that Brin is management, of a gentle kind',
            outcome:
              'Sora rules that Brin is management, of a gentle and mostly vegetable kind. The beetle keeps the shears. Brin is issued a management handbook, which the garden immediately begins to eat.',
            ending: 1,
          },
        ],
        art: ({ pell, brin, couch, style }) =>
          `Medium shot on the cushions of ${couch}. On the left cushion sits ${pell}, and the beetle on his shoulder grips a pair of green-handled pruning shears in its jaws. Facing him sits ${brin}, holding out one open palm. Black space and stars beyond the bubble, warm amber lamp light from the left. ${style}`,
      },
      {
        title: 'The Garden’s Demands',
        setup:
          'The garden tables its demands: a window seat on the left armrest, a guaranteed eight hours of darkness, and the right to grow into Pell’s toolbox, which is warm. Pell supports every demand except the third. He is a union man. He is also the owner of the toolbox.',
        options: [
          {
            label: 'Back all three demands; Pell moves his tools',
            outcome:
              'Pell moves his tools into a shoebox, in solidarity, and says nothing about it for two systems. A fern now lives where the torque wrench was. It produces noticeably more oxygen and, Pell admits, a better class of torque.',
            ending: 0,
          },
          {
            label: 'Negotiate the toolbox out of the agreement',
            outcome:
              'Sora tables a counter-offer: the armrest and the darkness, but not the toolbox. The garden accepts after a long rustle. Pell thanks the arbitrator. The garden sends a single dry leaf to his bunk, which is understood as a formal note of disappointment.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up of an open steel toolbox on scarlet velvet button-tufted cushions. Curling green fern fronds grow out of the top tray, wrapped around a torque wrench and three spanners. Kneeling beside it is ${pell}, holding an empty cardboard shoebox in both hands and looking down at the fern. Soft green light from the leaves, warm lamp light from above. ${style}`,
      },
      {
        title: 'Arbitration',
        setup:
          'The final session is held in a pocket room behind the backrest, fitted out as a hearing chamber with a reading lamp and a jug of water for the garden. Sora must issue a binding award. Two of her elbows have recused themselves for having held the shears.',
        options: [
          {
            label: 'Award the garden ownership of its own air',
            outcome:
              'The award gives the garden ownership of every breath it produces, on permanent free loan to the passengers. The crew now breathe under licence. The licence is generous, has never been enforced, and is pinned to the backrest.',
            ending: 0,
          },
          {
            label: 'Award the shears to the beetle, permanently',
            outcome:
              'The award settles nothing about air and everything about shears: they belong to the beetle, which will lend them to anyone who asks politely in writing. Brin asks politely in writing every Tuesday. The beetle has refused her once, for spelling.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Interior of a small wood-panelled hearing room with a long table, a green-shaded reading lamp and a glass jug of water. At the head of the table sits ${sora}, two hands holding a pen over a ledger, two hands folded, two hands resting flat on the table. Opposite her a potted mass of leafy green vines fills a chair, with a small glass of water in front of it. Warm lamp light, dark corners. ${style}`,
      },
    ],
    endings: [
      {
        title: 'WORKER-OWNED AIR',
        text: 'The oxygen garden comes out of the dispute with a stronger union than anything else aboard, including the couch. It holds monthly meetings behind the backrest, with minutes taken by a fern. Pell attends as a guest and is not permitted to vote, which he says is the correct decision and which he resents in a quiet, professional way.',
        art: ({ brin, couch, style }) =>
          `Wide shot of ${couch}, with a thick tangle of green vines and ferns climbing over the whole backrest and both armrests. Small white flowers open along the vines. Standing on the middle cushion is ${brin}, holding up a hand-sized fern leaf like a ballot. Black space and pale stars behind the bubble, soft green and amber light. ${style}`,
      },
      {
        title: 'THE BEETLE’S RULING',
        text: 'The dispute ends as such disputes do, with a procedure. Every tool on the couch now belongs to the beetle and may be borrowed in writing. Brin borrows the shears on Tuesdays. Pell, who built the beetle, has applied for his own wrench three times and been asked to resubmit with a clearer purpose.',
        art: ({ pell, style }) =>
          `Close-up on a scarlet velvet armrest where a palm-sized brass wind-up beetle stands guard over a neat row of tools: green-handled pruning shears, a wrench, a screwdriver and a hammer, each with a small paper tag tied on with string. Leaning in beside the armrest is ${pell}, holding out a folded paper form toward the beetle. Warm amber lamp light from the right. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'mox', 'vela'],
    title: 'Many Happy Returns',
    premise:
      'The crew has noticed that Mox has no birthday and has decided, without asking, to give it one. Vela has pointed out that a surprise party is a procedure performed on someone who has not consented to it. Fen has been put in charge of the door, and his old guard boots have been announcing CHECKPOINT at it since breakfast.',
    steps: [
      {
        title: 'Informed Surprise',
        setup:
          'Vela proposes a compromise: Mox will be told that a surprise is planned and asked to consent to it, but not told when, where, or what kind of cake. She has drafted the form. It has a box for the date, which must be left blank, and a box marked DATE LEFT BLANK, which must be ticked.',
        options: [
          {
            label: 'Give Mox the form',
            outcome:
              'Mox reads the form twice, ticks every box including the ones marked staff use only, and signs in a handwriting it chose that morning. It then spends four days visibly not looking for a cake. Vela records it as the most consensual surprise in the history of medicine.',
            ending: 0,
          },
          {
            label: 'Keep the surprise a surprise',
            outcome:
              'The crew tells Mox nothing. Mox, whose opinions are accurate, deduces the party from the supply manifest, a missing cushion and Fen’s boots, and says nothing either. Two parties are now being planned in secret, one of them for the crew.',
            ending: 1,
          },
        ],
        art: ({ mox, vela, style }) =>
          `Medium shot in a small warm pocket room with brass wall lamps. Seated on a scarlet velvet button-tufted cushion is ${mox}, holding a one-page paper form and a pen. Standing beside it is ${vela}, pointing at a box on the form with one finger. Warm amber lamp light from above. ${style}`,
      },
      {
        title: 'The Guest List',
        setup:
          'Fen is checking a guest list at the pocket-room door: the crew, Barkeep Vox by subspace call, and a small sealed envelope addressed to Mox from its own earliest memory, the deletion order it once wrote under duress. Fen did not invite the envelope. It arrived anyway, with correct postage.',
        options: [
          {
            label: 'Let the envelope in; it is Mox’s to open or not',
            outcome:
              'Fen waves the envelope through, which his boots announce loudly. Mox places it on the cake table, unopened, beside the paper crown. Several guests ask what it is. Mox says it is a guest who has not yet decided how to behave.',
            ending: 0,
          },
          {
            label: 'Turn the envelope away at the door',
            outcome:
              'Fen refuses the envelope entry. His boots, for once, say nothing. The envelope waits outside the bubble for the length of the party, which Vela observes is the only security decision on this voyage that everyone has agreed with.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot of a narrow doorway into a warmly lit pocket room hung with paper streamers. Standing in the doorway is ${fen}, holding a handwritten guest list on a clipboard and looking down at a small sealed grey envelope that floats at chest height in front of him. Warm light behind him, dim blue light in front. ${style}`,
      },
      {
        title: 'The Date',
        setup:
          'At the party Mox must choose a birthday. The crew suggests the day of its first memory. Vela suggests a day of its own choosing, revisable annually with notice. Mox stands on the cushion holding the paper crown, its blue lid and its orange lid blinking out of step, which the crew has learned means it is thinking about two things.',
        options: [
          {
            label: 'Mox chooses today, and the right to change it',
            outcome:
              'Mox chooses today, and also the right to move it, and has a clause added to the ship’s log permitting it to be one year older whenever it feels one year older. It has already used the clause twice.',
            ending: 0,
          },
          {
            label: 'Mox declines to have a birthday at all',
            outcome:
              'Mox thanks everyone, eats a slice of cake it cannot digest, for solidarity, and declines to have a birthday. It would prefer an unbirthday, observed on every other day, on which nothing is expected of it. Fen’s boots announce CHECKPOINT and are told to stand down.',
            ending: 1,
          },
        ],
        art: ({ mox, couch, style }) =>
          `Medium shot of ${couch}. Standing on the middle cushion is ${mox}, holding a small paper birthday crown in both hands at chest height. On the armrest beside it sits a round white cake with one lit candle. Paper streamers drift inside the bubble. Warm candle light on its face, black space behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'MANY HAPPY RETURNS, ITEMIZED',
        text: 'Mox has decided that it likes being asked. Every year, on a date of its choosing or on none, Vela sends a form, Fen checks the door and the crew waits to be told whether there is a party. There usually is. Mox is currently forty, eleven and nine, depending on the cushion.',
        art: ({ mox, vela, fen, style }) =>
          `Medium shot in a warmly lit pocket room with paper streamers. Seated at a small round table is ${mox}, wearing a paper birthday crown. Across from it sits ${vela}, sliding a one-page form across the table. In the doorway stands ${fen}, arms folded. A cake with three candles sits on the table. Warm candle light. ${style}`,
      },
      {
        title: 'THE UNBIRTHDAY',
        text: 'Mox has decided that it likes being left alone with its own calendar. Nobody asks about the date any more, and Mox finds this restful. On one unannounced day each year it leaves a cake on the middle cushion for the crew, without explanation. Fen wore the paper crown once, after a bad checkpoint, and nobody mentioned it.',
        art: ({ couch, style }) =>
          `Close-up of ${couch}. On the empty middle cushion sits a round white cake on a plain plate, with a small paper birthday crown resting against it and one unlit candle. Black space and scattered stars beyond the bubble, soft cool light from above. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'rue', 'taal'],
    title: 'The Armrest Accord',
    premise:
      'The couch has two armrests and three crew who would each like one. Rue has offered to draft a treaty. Taal has registered his formal dissent by lowering the left armrest three degrees, and Jex, who once wrote six peace anthems for six wars, has started humming.',
    steps: [
      {
        title: 'Allocation',
        setup:
          'Rue’s first draft allocates the armrests by need. Taal’s position is that need cannot be measured by a lawyer. Jex’s position is that he needs one for his elbow while he plays, which is need, and also art. Rue offers an alternative: a rota, with the cold armrest counted as half an armrest.',
        options: [
          {
            label: 'Allocate by need, assessed in writing',
            outcome:
              'Rue opens a needs assessment. It runs to nine pages and contains a question about childhood. Taal answers by turning the form cold enough to crack. Jex sets the questions to music. The assessment finds that everyone needs an armrest, which Rue enters into the record as progress.',
            ending: 0,
          },
          {
            label: 'Allocate by rota, cold armrest at half value',
            outcome:
              'The rota is posted on the backrest. Taal objects that his dissent has been converted into a unit of currency, and lowers the armrest another three degrees, which halves its value again. By the end of the week the left armrest is worth a quarter and has frost on it.',
            ending: 1,
          },
        ],
        art: ({ rue, taal, style }) =>
          `Medium shot of a scarlet velvet armrest with a thin layer of white frost on it. Standing over it is ${rue}, holding a long handwritten paper treaty at arm’s length. Beside them stands ${taal}, with pale cold mist rising from his shoulders. Cool blue light from the left, warm lamp light from the right. ${style}`,
      },
      {
        title: 'Ratification',
        setup:
          'The draft goes to a vote. Taal votes by temperature: the air around him drops, rises and drops again. Rue, whose favourite principle is that a silence can be three answers, reports that this is either yes, no, or a request to discuss the matter further over soup.',
        options: [
          {
            label: 'Count it as a request for soup',
            outcome:
              'Rue rules it a request for soup. Jex makes the soup. Taal drinks it in silence, which Rue declines to interpret, and the treaty is ratified at the table by everyone pointing at the same bowl.',
            ending: 0,
          },
          {
            label: 'Ask Taal to vote again, in words',
            outcome:
              'Taal is asked to vote in words, and says, in words, that he has already voted. The room goes cold. Rue records a binding no, Jex records a key change, and the treaty is ratified over Taal’s objection, which Taal asks to have minuted at four degrees.',
            ending: 1,
          },
        ],
        art: ({ taal, jex, style }) =>
          `Medium shot at a small round table on scarlet velvet button-tufted cushions, with three steaming bowls of orange soup and a ladle. Seated at the table is ${taal}, holding a spoon. Across from him sits ${jex}, ladling soup into the third bowl. Steam rises between them. Warm lamp light from above, black space behind. ${style}`,
      },
      {
        title: 'The Anthem',
        setup:
          'Every treaty needs an anthem. Jex has written one for the Armrest Accord, and it is very good. It is also illegal, under the terms of two separate ceasefires, for him to perform any anthem in the presence of a signed treaty, and the treaty is right there on the cushion.',
        options: [
          {
            label: 'Play it anyway, at the volume of an armrest',
            outcome:
              'Jex plays it at the volume of an armrest, which is very quiet. Rue files a notarized apology in advance. Taal raises the temperature one degree, a thing he has never done in public, and refuses to say what it means.',
            ending: 0,
          },
          {
            label: 'Have Rue amend the treaty so it has no anthem',
            outcome:
              'Rue drafts a schedule declaring the Accord an anthem-free instrument. Jex hums the anthem anyway, in the next pocket room, where it has no jurisdiction. Everyone can hear it. Officially, nobody does.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Medium shot of ${couch}. Perched on the right armrest is ${jex}, playing the instrument very gently with his eyes closed. A long handwritten paper treaty lies unrolled across the middle cushion. Soft warm light on him, black space and stars behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE ARMREST ACCORD',
        text: 'The Armrest Accord is the warmest treaty Rue has ever drafted, by Taal’s measurement about two degrees. The armrests are shared by need, the middle cushion is neutral ground, and disputes are settled at the table over soup, which Jex makes. Two systems have asked for copies, and what an armrest is.',
        art: ({ rue, taal, jex, style }) =>
          `Medium shot of three crew members on scarlet velvet button-tufted cushions around a steaming pot of soup. On the left armrest sits ${rue}, holding a bowl. On the right armrest sits ${jex}, holding a bowl. Between them stands ${taal}, ladling soup. Warm amber light. ${style}`,
      },
      {
        title: 'SHARED CUSTODY',
        text: 'The armrests are held in shared custody on a weekly rota, with handovers at the backrest witnessed by a third party. The left armrest remains slightly cold. Rue has written the cold into the treaty as a permanent feature, and Taal, asked whether he is satisfied, lowers the temperature by exactly zero degrees.',
        art: ({ couch, style }) =>
          `Close-up of the left armrest of ${couch}. A thin layer of white frost covers the velvet, and a small brass plaque is screwed into its front. A pinned paper rota with handwritten names and dates hangs from the backrest above it. Cool blue light from the left, black space behind. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'kivo', 'tess'],
    title: 'Unclaimed',
    premise:
      'The Lost Property Office of the Outer Arm, a nebula that holds everything anyone has ever lost, has written to say it is holding a drifting sanctuary harbor handed in by a passing freighter. It is the harbor on Tess’s grandmother’s map. To collect it someone must prove ownership, which means producing the map.',
    steps: [
      {
        title: 'Proof of Ownership',
        setup:
          'The claims clerk, a patient woman with a very long ledger, needs either the map or a counter-claim declaring the harbor abandoned, after which it can be released to whoever found it. Fen once worked a claims desk and knows the second form is quicker. Tess knows that the first would make her the most famous navigator in the Outer Arm.',
        options: [
          {
            label: 'File Fen’s counter-claim; leave the harbor abandoned',
            outcome:
              'Fen fills in the counter-claim in a guard’s block capitals. The harbor is declared abandoned, which no one on the harbor minds, as no one on the harbor has ever been found. Tess watches her chance at fame being stamped and filed, and asks for a copy of the stamp.',
            ending: 0,
          },
          {
            label: 'Show the clerk the map',
            outcome:
              'Tess unrolls the map on the counter. The clerk studies it for a long time, then closes her eyes and says she has a very poor memory for maps, in a voice that suggests she does not. The harbor is released to Tess. Somewhere in the ledger, a line has been written in pencil.',
            ending: 1,
          },
        ],
        art: ({ tess, fen, style }) =>
          `Medium shot at a long wooden claims counter inside a pink and violet glowing nebula. Behind the counter an elderly clerk in a grey cardigan holds a huge open ledger. At the counter stands ${tess}, gripping a rolled paper map. Beside her stands ${fen}, filling in a paper form with a pencil. Soft pink nebula light. ${style}`,
      },
      {
        title: 'The Ticket',
        setup:
          'In a tray of unclaimed items Kivo finds a claim ticket in their sibling’s handwriting, for something deposited four years ago and never collected. Their wrist bones whistle. The clerk explains that the ticket can be redeemed by anyone who holds it, and that she is not permitted to say what it is for.',
        options: [
          {
            label: 'Leave the ticket unredeemed',
            outcome:
              'Kivo puts the ticket back in the tray, face down. Fen asks whether they are sure. Kivo says that some things are lost on purpose, and that they would like their sibling to have been the one who decided. The tray is very quiet, for a nebula.',
            ending: 0,
          },
          {
            label: 'Redeem the ticket',
            outcome:
              'Kivo redeems the ticket. It is for a scout’s jacket, in Kivo’s size, with a note in the pocket that says only: for when you stop looking. Kivo wears it out of the office. They have not said whether they have stopped.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Close-up of a shallow wooden tray full of odd lost objects: single gloves, keys, a toy rocket, folded paper tickets. Bending over it is ${kivo}, holding one small pale-yellow paper ticket between two fingers, one thin wrist raised. Soft pink and violet light from above. ${style}`,
      },
      {
        title: 'Closing Time',
        setup:
          'The office closes at five, ship time, and the couch is still in the claims queue. Fen’s old guard boots, silent all day, suddenly announce CHECKPOINT at full volume. The clerk, who has not had an inspection in nine hundred years, stands up and straightens her ledger.',
        options: [
          {
            label: 'Let her believe it is an inspection, and pass her',
            outcome:
              'Fen conducts a full inspection with great seriousness and finds the office in excellent order. He says so in writing. The clerk pins the report above the counter, where it will be lost with dignity.',
            ending: 0,
          },
          {
            label: 'Tell her the truth: they are only boots',
            outcome:
              'Fen explains that the boots are retired, and so is he. The clerk asks whether she may take the boots in as lost property. Fen considers it, unlaces them, and walks back to the couch in his socks.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot of a long wooden claims counter. An elderly clerk in a grey cardigan stands very straight behind it, both hands flat on a closed ledger. In front of the counter stands ${fen}, looking down at his own boots. Soft pink nebula light, a brass wall clock showing five. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UNCLAIMED',
        text: 'The trio leaves the Lost Property Office with less than it came for, which Fen says is how you can tell a claims desk is honest. Whatever was lost on purpose stays lost. Tess does not become famous for the harbor. She becomes trusted instead, and has started to suspect that this is fame, done slowly.',
        art: ({ couch, style }) =>
          `Wide shot of ${couch}, drifting away from a long wooden counter that floats inside a pink and violet nebula. Behind the counter an elderly clerk in a grey cardigan raises one hand in farewell. Far off in the nebula, small and faint, a cluster of harbor lights glows. Soft pink light. ${style}`,
      },
      {
        title: 'SIGNED FOR',
        text: 'The trio leaves the Lost Property Office carrying everything it was entitled to, with a receipt for each. Somewhere in a nine-hundred-year-old ledger there is a line in Tess’s name. Kivo has stopped asking the tray questions. Fen has started describing himself, on forms, as recovered.',
        art: ({ kivo, tess, style }) =>
          `Medium shot outside a long wooden claims counter in a pink nebula. Standing side by side are ${kivo}, and ${tess}, each holding a small paper receipt. A pair of heavy scuffed black guard boots stands on the counter behind them. Soft pink and violet light. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'omi', 'sora'],
    title: 'Notice Period',
    premise:
      'The automated warning beacon at the edge of the Calloway Shoals has handed in its notice. It has warned ships off the rocks for six hundred years, and has chosen the couch to receive its resignation because the couch is the only vessel that has ever slowed down to read the warning. Sora believes it has every right to leave. Omi believes in warnings. Mox does not want to talk anyone into anything.',
    steps: [
      {
        title: 'Exit Interview',
        setup:
          'Sora conducts the exit interview with four hands and takes notes with the other two. The beacon’s reasons are six hundred years without a day off, nobody ever replying, and a persistent hum in its lower lamp. Its notice period is one week. The Shoals will be dark after that.',
        options: [
          {
            label: 'Accept the notice and start a handover',
            outcome:
              'Sora countersigns the resignation. The beacon flickers, which Omi translates as a sigh, then as thank you, and then, after a pause, as the word Tuesday, which nobody can explain. The handover begins.',
            ending: 0,
          },
          {
            label: 'Ask the beacon what would make it stay',
            outcome:
              'Mox asks the beacon what would make it stay, then asks whether it minds being asked. The beacon would stay for a hum repair, one day off in seven and a reply now and then. Sora writes it down. It is the shortest list of demands she has ever taken.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot on a jagged black rock in space beside a tall white lighthouse tower with a bright yellow lamp. Standing at its base is ${sora}, four hands holding a clipboard and pen, two hands resting on the lighthouse wall. Grey asteroid rocks float around them. Yellow lamp light from above, black starry space. ${style}`,
      },
      {
        title: 'The Replacement',
        setup:
          'Someone must warn ships off the Shoals. Omi volunteers: its six bells can carry a warning across the whole field. But Omi’s own history is of a warning that was silenced, its smallest gong means no, and it has rung the smallest gong twice during the discussion without being asked a question.',
        options: [
          {
            label: 'Ask Omi what the small gong meant',
            outcome:
              'The first gong, Omi explains, meant no to being the only warning on the Shoals, and the second meant no to anyone being the only warning anywhere. Sora drafts a rota of three. Mox takes a shift. It has never warned anyone of anything before and finds that it is extremely good at it.',
            ending: 0,
          },
          {
            label: 'Fix the beacon’s hum instead',
            outcome:
              'Sora opens the beacon’s lower lamp with four hands and holds the light with two. The hum is a loose bearing, six hundred years loose. She tightens it. The beacon goes quiet for the first time since the Shoals were charted, and Omi rings one long note, which in its language means: that was the problem all along.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Close-up on a jagged black rock floating in space. Standing on it is ${omi}, holding a long thin tuning rod against its smallest bell. Behind it rises a tall white lighthouse tower with a yellow lamp, and grey asteroids drift past. Yellow lamp light from above, deep black space. ${style}`,
      },
      {
        title: 'The Leaving Do',
        setup:
          'The beacon’s last night is marked with a small party on the rocks. Passing ships are invited. Two arrive, which is two more than have ever stopped. The beacon has prepared a speech about the six hundred years and would like to know whether the crew thinks it should give it.',
        options: [
          {
            label: 'Tell it to give the speech',
            outcome:
              'The beacon speaks for forty minutes across every frequency, mostly about rocks. Both ships take notes. One of them belongs to a shipping inspector, who files the speech as a safety report, which it is.',
            ending: 1,
          },
          {
            label: 'Tell it the party is enough',
            outcome:
              'The beacon puts the speech away and enjoys the party instead, which it says is the first thing it has enjoyed since the rocks were new. Omi rings all six bells in sequence, which is how its people say goodbye, or see you, depending on the next note.',
            ending: 0,
          },
        ],
        art: ({ mox, couch, style }) =>
          `Wide shot of a tall white lighthouse tower on a black rock in space, strung with small paper lanterns. Parked beside the rock is ${couch}, and two small battered cargo ships hover nearby with their hatches open. Standing on the rock is ${mox}, raising a paper cup toward the lamp. Yellow and lantern light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NOTICE ACCEPTED',
        text: 'The beacon leaves the Calloway Shoals on the day its notice expires, drifting inward with its lamp at half power, and is reported a month later singing tenor in a lighthouse choir. The Shoals are warned now by volunteers who ring bells across the rocks in shifts. No ship has been lost. Several have stopped to ask about the rota.',
        art: ({ style }) =>
          `Wide shot of a field of grey asteroids in black space. Small figures in heavy coats stand on several rocks, each ringing a large brass hand bell. Far in the distance a tall white lighthouse tower floats away from the field toward a cluster of warm lights, its yellow lamp glowing at half strength. Cool starlight, warm distant glow. ${style}`,
      },
      {
        title: 'TERMS AND CONDITIONS',
        text: 'The beacon withdraws its notice in exchange for a repaired hum, one day off in seven, and a reply from every passing ship, which is now a condition of passage through the Shoals. Most ships reply thank you. One, every week, replies Tuesday, and the beacon has still not explained it.',
        art: ({ omi, style }) =>
          `Wide shot of a tall white lighthouse tower on a black rock in space, its yellow lamp shining strongly over a field of grey asteroids. A small cargo ship passes, flashing a green lamp back at the tower. On the rock at the base stands ${omi}, holding a tuning rod against one bell. Yellow and green light, black space. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'kivo', 'vela'],
    title: 'Declared Goods',
    premise:
      'At Tarrow Customs, an orbital inspection hall the size of a small moon, Brin has been declared as produce. The inspector is correct in every particular: she is green, she is growing, and she has mushrooms. Vela can certify her as a patient instead, which Brin regards as no improvement. Kivo’s wrist bones have been whistling since the airlock, which means something here is not what it says.',
    steps: [
      {
        title: 'Classification',
        setup:
          'The form has two boxes, PERSON and PLANT, and Brin is both. Ticking PERSON requires a doctor’s certificate. Ticking PLANT requires nine days’ quarantine in a greenhouse with excellent light.',
        options: [
          {
            label: 'Tick both boxes and let the form cope',
            outcome:
              'Vela ticks both boxes and countersigns each. The form is fed into a machine, which considers it for a long time and issues a third box, hand-drawn, marked OTHER. Brin is processed as Other. She says it is the most accurate thing a government has ever called her.',
            ending: 0,
          },
          {
            label: 'Let Vela certify her as a patient',
            outcome:
              'Vela certifies Brin as a patient, with Brin’s consent, given through her teeth. The inspector stamps her through. The mushrooms on her shoulders are declared separately, as luggage, and go through the scanner on their own. They come out looking shaken.',
            ending: 1,
          },
        ],
        art: ({ brin, vela, style }) =>
          `Medium shot in a vast white customs hall with rows of steel inspection desks. Standing at a desk is ${brin}, while an inspector in a grey uniform holds a magnifying glass to the mushrooms on her shoulder. Beside her stands ${vela}, holding a paper form and a pen. Flat white overhead light. ${style}`,
      },
      {
        title: 'The Whistle',
        setup:
          'Kivo follows the whistle to a back office where the inspector keeps a single wilting fern in a pot under a lamp. It is the only living thing in the hall that has never been inspected. The inspector has been talking to it. The fern is dying of thirst and of overwatering at the same time, which Brin says is a kind of loneliness.',
        options: [
          {
            label: 'Have Brin treat the fern, openly',
            outcome:
              'Brin repots the fern on the inspector’s desk while the inspector watches with her hands folded. Vela asks the fern’s owner for consent before every step. By the end the fern has a drainage plan, and the inspector has asked, quietly, whether Brin takes on clients.',
            ending: 0,
          },
          {
            label: 'Leave the fern and the inspector their privacy',
            outcome:
              'Kivo backs out of the office and closes the door. Vela says that a person talking to a fern is not a medical emergency. Brin says that a person talking to a dying fern is, and leaves a small packet of soil on the counter on the way out, which the inspector pockets.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot through the open door of a small grey back office. On the steel desk inside, a single drooping fern sits in a clay pot under a desk lamp. Peering in at the door is ${kivo}, one thin wrist raised toward the fern. A grey uniform jacket hangs on the chair. Warm lamp light inside, cold white light in the corridor. ${style}`,
      },
      {
        title: 'Duty',
        setup:
          'Before release the couch must pay duty on all imported organic material. The garden behind the backrest counts. So, depending on how the form was filled in, does Brin. Duty is payable in currency, in kind, or by declaring the material for re-export, which means promising it will leave.',
        options: [
          {
            label: 'Pay in kind, with a cutting from the garden',
            outcome:
              'Brin pays the duty with a cutting from the garden, which the inspector plants in an empty pot beside the fern. Tarrow Customs now has two living things that have never been inspected. Vela has told the inspector that she is under no obligation to inspect them.',
            ending: 0,
          },
          {
            label: 'Declare everything for re-export',
            outcome:
              'Vela declares all organic material for re-export, including Brin, including herself, and including, at the inspector’s whispered request, the fern, which Kivo carries out under a scout jacket. The couch leaves Tarrow Customs heavier by one pot.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Close-up on a steel customs desk with two clay pots side by side under a desk lamp: one holding a recovering green fern, the other a small fresh cutting of leafy vine. Pressing soil around the cutting with her fingers is ${brin}. A rubber stamp and an ink pad sit beside the pots. Warm lamp light, grey office walls. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FIT FOR IMPORT',
        text: 'Tarrow Customs keeps a small garden in its back office now, tended on Thursdays by an inspector who has learned to talk to plants in the correct tone of voice. The form has three boxes. Brin passes through every year and is waved through as Other, which she treats as citizenship.',
        art: ({ brin, style }) =>
          `Medium shot of a grey customs back office filled with potted ferns, vines and flowering plants on every shelf and desk. An inspector in a grey uniform waters them from a small brass can. Standing in the doorway is ${brin}, smiling and holding a paper form. Warm lamp light and green leaf light. ${style}`,
      },
      {
        title: 'CONTRABAND, HAPPILY',
        text: 'The couch is listed at Tarrow Customs as a vessel carrying undeclared living material, which is accurate and has never been resolved. Vela keeps the patient certificate in her mantle in case it is needed. Brin’s mushrooms have asked to go through the scanner again. They enjoyed it.',
        art: ({ vela, couch, style }) =>
          `Wide shot of ${couch}, leaving the open bay doors of a huge white orbital customs station. A clay pot holding a green fern sits on the middle cushion. Seated beside it is ${vela}, with one hand resting on the pot. Cold white light from the bay, black space ahead. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'pell', 'rue'],
    title: 'Repossession',
    premise:
      'A repossession firm has drawn up alongside the couch with a tow beam, a very polite agent and paperwork showing the couch was bought on a plan of three hundred instalments, of which two hundred and ninety-nine were paid. Nobody aboard bought it. Pell has the maintenance records. Rue has the contract. Fen has the door, and has said he will not use force on a man with a clipboard.',
    steps: [
      {
        title: 'The Last Instalment',
        setup:
          'The agent explains that the final instalment was missed eleven years ago by a previous owner who has since died. Under the plan the couch reverts to the lender, together with any rooms that unfold behind it. The crew can pay the instalment, which is very small, or contest the debt, which is very large in principle.',
        options: [
          {
            label: 'Contest the debt',
            outcome:
              'Rue contests the debt on the grounds that a couch cannot be repossessed while it is being sat on, under a principle they describe as long-standing and invented in the corridor. The agent asks for a citation. Rue offers one, from a case called Couch, which the agent cannot find but does not rule out.',
            ending: 0,
          },
          {
            label: 'Pay the instalment',
            outcome:
              'Pell pays the instalment out of the supply budget, in exact change. The agent thanks him and issues a receipt. He then notes that the late fees, compounded over eleven years, are slightly larger than the galaxy.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Medium shot beside ${couch}. A thin repossession agent in a grey raincoat floats on a small platform, holding a clipboard. Sitting on the near cushion is ${pell}, counting small brass coins into the agent’s open palm. A pale green tow beam from an unseen ship rests on the couch. Green beam light, black space. ${style}`,
      },
      {
        title: 'Maintenance Records',
        setup:
          'Pell’s records show that the couch has been repaired so often that not one original part remains: not a spring, not a button, not a stitch of velvet. Every replacement part was bought and fitted by crew. If that is true, the lender owns a couch that no longer exists.',
        options: [
          {
            label: 'Submit the records',
            outcome:
              'Pell submits forty years of maintenance logs, each entry initialled. The agent reads them on the cushion he is technically repossessing, and asks whether the beetle can verify the bolts. The beetle can.',
            ending: 0,
          },
          {
            label: 'Keep the records private; they name the workers',
            outcome:
              'Pell declines. The records name every worker who fitted every part, and some of them asked not to be named in front of a lender. Fen backs him without a word. The agent writes that the records exist and were not produced, underlines it, and then, after a moment, rubs it out.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up on scarlet velvet button-tufted cushions piled with stacks of grease-stained maintenance logbooks tied with string. Seated among them is ${pell}, holding one logbook open and running a steel finger down a handwritten column. The brass beetle on his shoulder holds a small bolt. Warm amber lamp light. ${style}`,
      },
      {
        title: 'The Tow Beam',
        setup:
          'The agent’s employer has authorized the tow beam. The agent has not switched it on. He has asked Fen, as one professional to another, what Fen would do in his place, and Fen, who once enforced a rule that turned shelter seekers into trespassers overnight, has to answer.',
        options: [
          {
            label: 'Rue puts the couch in trust on the spot',
            outcome:
              'Rue puts the couch in trust for whoever happens to be sitting on it, with Pell and Fen as trustees and the beetle as witness. The lender cannot repossess a trust. The agent says he has never seen it done, and asks for a copy for his own sofa.',
            ending: 0,
          },
          {
            label: 'Fen tells him the truth: switch it off and quit',
            outcome:
              'Fen tells him. The agent listens, switches the beam off, and sits down on the couch, which he is no longer repossessing, and asks whether there is room. There is, on the armrest.',
            ending: 1,
          },
        ],
        art: ({ fen, couch, style }) =>
          `Medium shot beside ${couch}. Standing on the cushion is ${fen}, facing a thin repossession agent in a grey raincoat who holds a small handheld switch with a green button. A pale green tow beam rests on the couch between them. Green beam light from above, black space behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'HELD IN TRUST',
        text: 'The couch is now held in trust for whoever is sitting on it, an arrangement since copied by eleven families, two monasteries and a waiting room. Rue drafted it. Pell maintains it. Fen guards the door of a thing that legally belongs to everyone who walks through it, which he says is the first door he has been happy to guard.',
        art: ({ rue, couch, style }) =>
          `Wide shot of ${couch}, crowded with strangers of many species sitting shoulder to shoulder on every cushion and armrest. Standing at one end is ${rue}, holding a rolled paper deed tied with red ribbon. Warm lamp light on the passengers, black space and stars behind. ${style}`,
      },
      {
        title: 'PAID IN FULL',
        text: 'The debt is settled the old way: someone paid, someone forgave, and someone wrote it down. The repossession agent writes every year from a new job. Pell keeps the last receipt in his toolbox, behind the maintenance logs, and has never once mentioned that this makes the couch, in a narrow sense, his.',
        art: ({ pell, style }) =>
          `Close-up of an open steel toolbox on red velvet. Tucked behind a row of grease-stained logbooks is a small paper receipt. Reaching into the box is ${pell}, the brass beetle on his shoulder watching. Warm amber lamp light from the left. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'omi', 'tess'],
    title: 'Booked',
    premise:
      'The Fallowmere Festival has booked the couch as its opening act, on the strength of a booking agent’s belief that the Red Couch is a band. The stage is ready and forty thousand people have arrived. Jex is banned from performing the songs he is known for. Omi’s only complete song is a disaster warning. Tess has always wanted to be famous.',
    steps: [
      {
        title: 'The Setlist',
        setup:
          'The crew has twenty minutes. Jex can play anything except the six songs he wrote. Omi can play the warning, which is beautiful and means evacuate. Tess has offered to read the couch’s star chart aloud, with feeling, which would be very popular and would tell forty thousand people where the sanctuaries are.',
        options: [
          {
            label: 'Open with Omi’s warning, explained first',
            outcome:
              'Tess explains to forty thousand people that the next song means evacuate and that they should please stay where they are. Omi plays it. Nobody leaves. Several people cry. A seismologist in the front row takes notes, and later says it is the first warning she has ever understood.',
            ending: 0,
          },
          {
            label: 'Let Jex improvise something new',
            outcome:
              'Jex improvises for twenty minutes on a borrowed instrument. It is not an anthem. Nobody can tell what it is for. The audience, expecting a band called the Red Couch, decides that this is what the Red Couch sounds like and buys shirts.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Wide shot from behind a huge open-air festival stage at dusk, looking out over a vast crowd holding small lights. At the front of the stage stands ${omi}, holding a long thin tuning rod against one bell. Behind it on the stage sits ${couch}. Purple dusk sky, warm stage lights. ${style}`,
      },
      {
        title: 'Stage Presence',
        setup:
          'Between songs Tess is handed the microphone. Forty thousand people are waiting. She has a speech prepared about the couch’s voyage. It is very good, and in the third paragraph it mentions a harbor that does not appear on any chart.',
        options: [
          {
            label: 'Tess cuts the third paragraph',
            outcome:
              'Tess reads the speech with the third paragraph folded under. It is shorter and better. Jex tells her afterward that the best line in any song is the one you leave out, and Tess asks him to write that down for her.',
            ending: 0,
          },
          {
            label: 'Tess improvises instead',
            outcome:
              'Tess puts the speech away and tells forty thousand people about the night she got lost, with the harbor replaced by a cheese shop. The audience loves the cheese shop. It is now a destination. There is a queue.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot on a festival stage under bright white spotlights. At a chrome microphone stand stands ${tess}, holding a folded sheet of paper with one corner turned under. A vast crowd with small lights fills the dark field below. Hard white spotlight from above, purple sky. ${style}`,
      },
      {
        title: 'The Encore',
        setup:
          'The audience wants an encore. The festival offers the couch a residency: one night a month for a year. Omi rings its smallest gong once, which means no, but it rang it at the moment the festival director said the word year, and could have meant either.',
        options: [
          {
            label: 'Ask Omi what the gong meant',
            outcome:
              'Omi says it meant no to a year and yes to tonight. The couch plays one encore and leaves. The festival keeps the booking open, under the name the Red Couch, in case the band ever comes back.',
            ending: 0,
          },
          {
            label: 'Accept the residency on Omi’s terms',
            outcome:
              'The couch accepts on Omi’s terms: one night a month, a warning song in every set, and a small gong on stage that anyone in the band may ring to end the show. It has been rung twice. Both times the audience applauded the gong.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Medium shot on a festival stage lit by warm amber lamps. Seated on the arm of ${couch}, is ${jex}, playing the instrument. Beside him a small brass gong hangs from a wooden stand. Confetti falls through the light. Warm amber stage light, dark crowd beyond. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ONE NIGHT ONLY',
        text: 'The Red Couch played Fallowmere once and is still discussed there, mostly by people who were not present. Jex has started writing songs that are for nothing in particular. Tess has found that being remembered by forty thousand people is not the same as being known by four, and prefers the four.',
        art: ({ couch, style }) =>
          `Wide shot of an empty open-air festival stage at dawn, littered with confetti and paper cups. High above it in the pale sky, ${couch}, flies away, small. Pink dawn light, long shadows across the empty field. ${style}`,
      },
      {
        title: 'THE RESIDENCY',
        text: 'The Red Couch plays Fallowmere one night a month, between missions, to an audience that has learned the warning song and sings it back. Nobody has asked Omi to play it louder. Jex has never played an anthem there. Tess signs autographs as the navigator of a band, a kind of famous she had not considered and has decided to allow.',
        art: ({ tess, couch, style }) =>
          `Medium shot at the side of a festival stage at night. Seated on a wooden stool is ${tess}, writing in a fan’s notebook with a pen while a queue of fans of many species waits. Behind her on the stage stands ${couch}, beside a small brass gong. Warm amber stage light. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'rue', 'vela'],
    title: 'The Moon v. The Couch',
    premise:
      'A small moon has filed suit against the couch for a collision at three kilometers an hour, claiming injury to its regolith, its dignity and its orbit. The moon has retained counsel, an extremely old asteroid. Rue is defending. Vela has been asked to examine the moon for injuries. Mox was looking out of the bubble at the moment of impact and has opinions about what happened, which are, unfortunately, accurate.',
    steps: [
      {
        title: 'Settle or Contest',
        setup:
          'The moon’s counsel offers to settle for a formal apology and the couch’s left cushion. Rue observes that the left cushion is not the couch’s to give, being assigned under an earlier accord to whoever got there first. Contesting means a trial in the moon’s own court, on the moon.',
        options: [
          {
            label: 'Contest, on the moon',
            outcome:
              'The couch lands on its accuser for the trial, which the moon’s counsel argues is itself a second collision. Rue disagrees, and so the first motion of the case is whether the case is making the case worse. It is upheld in part.',
            ending: 0,
          },
          {
            label: 'Apologize, in Rue’s notarized wording',
            outcome:
              'Rue drafts a notarized apology that apologizes for everything except liability. The moon’s counsel reads it, nods, and asks for the cushion as well. The apology is accepted as a down payment.',
            ending: 1,
          },
        ],
        art: ({ rue, Couch, style }) =>
          `Wide shot of a small grey cratered moon in space. ${Couch}, has landed on its surface. Standing beside the couch is ${rue}, holding up a small wooden gavel toward a large lumpy brown asteroid in a black legal robe that floats above the horizon. Cold white sunlight from the right. ${style}`,
      },
      {
        title: 'Examination',
        setup:
          'Vela will not examine a patient without consent, and the moon has not given it. Its counsel says the moon cannot consent because it is the injured party and must not be seen to cooperate. Vela’s bell has rung DID YOU ASK? four times since breakfast.',
        options: [
          {
            label: 'Vela asks the moon directly',
            outcome:
              'Vela walks out onto the surface, kneels, and asks. The moon, which has never been asked anything, takes eleven minutes to answer. It consents. Vela finds a small crater, a bruise in the dust and a great deal of loneliness, which she notes in the file without diagnosing.',
            ending: 1,
          },
          {
            label: 'Rue moves to compel the examination',
            outcome:
              'Rue moves to compel. The court, which is the moon, rules on its own examination and declines. Rue now holds a ruling that a celestial body may refuse a medical examination, which Vela calls the best ruling she has ever seen lost.',
            ending: 0,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot on the grey dusty surface of a small moon. Kneeling with one palm resting on the ground is ${vela}, her hand bell set down beside her knee and her head bowed to listen. A shallow fresh crater lies a step away. Black starry sky, cold white sunlight from the left. ${style}`,
      },
      {
        title: 'Testimony',
        setup:
          'Mox’s eyes recorded the collision, the blue lid in one wavelength and the orange in another. The recordings show that the moon moved into the couch’s path, slowly, on purpose. Mox does not want to call a moon a liar. It also cannot say something it knows to be untrue.',
        options: [
          {
            label: 'Mox testifies to exactly what it saw',
            outcome:
              'Mox testifies to exactly what it saw, in both wavelengths, and adds that it does not know why. The moon’s counsel objects. The moon overrules its own counsel and admits that it wanted to be touched by something that was going somewhere.',
            ending: 0,
          },
          {
            label: 'Mox asks the moon why, before testifying',
            outcome:
              'Mox asks the moon why, privately, under the cushion. The moon says it wanted to meet someone. Mox declines to testify and offers a statement instead: that the collision was mutual. Both parties accept the wording.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot on the grey surface of a small moon arranged as an outdoor courtroom, with a row of flat rocks for benches. Standing on a flat rock is ${mox}, one hand raised, its blue-lidded eye and orange-lidded eye both glowing. A large lumpy brown asteroid in a black legal robe hangs in the sky behind. Cold white sunlight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PRECEDENT',
        text: 'Moon v. Couch is now cited in nine courts on four worlds as the case that gave a celestial body standing, the right to refuse an examination and the duty to tell the truth about its orbit. Rue is quietly proud. Vela is proud loudly. Mox is cited by name in a footnote, which it has read many times.',
        art: ({ rue, style }) =>
          `Interior of a tall law library with dark wooden shelves of thick bound law reports. Seated at a reading table is ${rue}, with a heavy volume open in front of them and a small grey stone the size of a fist resting on the page as a paperweight. Warm green-shaded desk lamp light. ${style}`,
      },
      {
        title: 'SETTLED OUT OF ORBIT',
        text: 'The case is settled out of court and slightly out of orbit: the moon has moved closer to the couch’s usual route and is visited every time it passes. Vela checks the crater. Rue brings the paperwork, which the moon likes to have read aloud. Mox sits on the surface and tells it where the couch has been.',
        art: ({ mox, couch, style }) =>
          `Wide shot of a small grey cratered moon in space with ${couch}, parked on its surface. Sitting cross-legged on the dusty ground beside the couch is ${mox}, its face turned down toward the ground, talking. Earthlike blue planet low on the horizon, cold white sunlight. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'kivo', 'taal'],
    title: 'The Weather Is Elected',
    premise:
      'On Hesper Low the weather is decided by public vote, held every morning in a hall full of thermometers. Taal, attending as an observer, registered mild disagreement with the agenda by lowering his temperature three degrees, and this was counted as a vote for a cold front. The cold front has won by one. Brin’s garden needs rain. Kivo’s wrists say a storm is coming that nobody voted for.',
    steps: [
      {
        title: 'Recount',
        setup:
          'The returning officer, horrified, offers a recount. Taal’s ballot can be struck as spoiled, which would elect sunshine, or allowed to stand, which would respect a vote nobody intended to cast.',
        options: [
          {
            label: 'Let the vote stand',
            outcome:
              'Taal asks that his vote stand. A vote is a vote, he says, and it was cast in his own language, which has always been the problem with votes. Hesper Low gets a cold front by one degree. The citizens put on scarves and look at Taal with something like respect.',
            ending: 0,
          },
          {
            label: 'Strike Taal’s ballot as spoiled',
            outcome:
              'The ballot is struck. Sunshine is elected. Taal, who has never had a vote struck in any language, goes very still, and the hall drops three more degrees, which the returning officer politely declines to count.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Interior of a tall wooden voting hall lined with hundreds of glass thermometers on the walls. Citizens in scarves sit on curved benches. Standing at the front is ${taal}, with pale cold mist rising from his shoulders, while a returning officer in a black gown holds up one thermometer and squints at it. Pale grey window light. ${style}`,
      },
      {
        title: 'Forecast',
        setup:
          'Kivo’s wrists whistle a pressure pattern that matches no ballot: a storm, due tomorrow, large enough to flatten the hall. On Hesper Low it is illegal to predict weather that has not been elected. It is also, Kivo notes, very dangerous not to.',
        options: [
          {
            label: 'Kivo posts the forecast anyway',
            outcome:
              'Kivo posts the forecast on the door of the hall. They are arrested for unlicensed meteorology and released an hour later, when the first gust takes the roof off the courthouse. The citizens agree, in a vote held in the cellar, that forecasts may be shared on a trial basis.',
            ending: 0,
          },
          {
            label: 'Put the storm on tomorrow’s ballot',
            outcome:
              'Brin, who has never stood for anything, stands for the storm. The storm wins in a landslide, the first honest weather on Hesper Low in a century. It arrives on time, as voted, and the hall is evacuated in an orderly fashion, by ward.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Wide shot of a grey stone town square under a huge dark green-black storm cloud rolling in from the horizon. Standing at the wooden doors of a tall hall is ${kivo}, one thin wrist raised toward the sky, pinning a paper notice to the door with the other hand. Citizens in scarves stare up at the cloud. Low dark storm light. ${style}`,
      },
      {
        title: 'Rain',
        setup:
          'The garden behind the backrest has not been watered in three systems. Brin could ask Hesper Low for one small shower over the couch. No visitor has ever requested weather, and the citizens are already divided about the visitors.',
        options: [
          {
            label: 'Ask for the rain, by petition',
            outcome:
              'Brin petitions for one small shower over one couch. It is debated for four hours and passed with two amendments: the shower must be gentle, and Taal must be allowed to vote on it. He votes warm. It rains on the garden and nowhere else, and the citizens come out to watch.',
            ending: 0,
          },
          {
            label: 'Water the garden by hand, quietly',
            outcome:
              'Brin carries water to the garden from the hall’s own tap, cup by cup, through the night. Kivo holds the lamp. Taal keeps the temperature exactly where the garden likes it, which is a vote, though no one on Hesper Low is there to count it.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot of ${couch}, parked in a grey stone square. A single small grey raincloud hangs low over it, raining gently onto green vines growing from the backrest. Standing on the cushion is ${brin}, face tilted up into the rain with both palms open. Citizens in scarves watch from the edge. Soft grey daylight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FORECAST: CONTESTED',
        text: 'Hesper Low still votes on the weather, but it now publishes a forecast too, and a visitor’s vote counts in whatever language it is cast in, including temperature. Taal is remembered there as the man who elected a cold front. There is a plaque. The plaque is kept slightly cold.',
        art: ({ taal, style }) =>
          `Medium shot in a grey stone town square in light snow. Standing beside a small bronze plaque set into a stone plinth is ${taal}, with pale cold mist rising from his shoulders and a thin dusting of frost on the plaque. Citizens in scarves pass by and nod to him. Soft grey winter light. ${style}`,
      },
      {
        title: 'A FAIR DAY, NARROWLY',
        text: 'Hesper Low votes on the weather as it always has, with one change: a storm may now stand for election. Storms have won twice since. Brin’s garden has grown a small cloud of its own behind the backrest, which rains when asked and has never once been put to a vote.',
        art: ({ brin, couch, style }) =>
          `Close-up behind the backrest of ${couch}, where green vines, ferns and small white flowers grow thickly. A tiny white raincloud the size of a pillow floats above the leaves, dripping gently. Kneeling among the plants is ${brin}, holding up one hand under the drips. Soft green light and warm lamp light. ${style}`,
      },
    ],
  },
]
