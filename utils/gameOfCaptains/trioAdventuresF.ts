import type { TrioAdventure } from './trioAdventures'

// Party adventures, batch F: twenty-five more parties (see trioAdventures.ts
// and trioAdventuresA.ts for the conventions). Each episode starts from what
// these three particular people want from each other or cannot stand about
// each other, and each satirizes one institution played perfectly straight.

export const TRIO_ADVENTURES_F: readonly TrioAdventure[] = [
  {
    crew: ['jex', 'pell', 'vela'],
    title: 'Background Music',
    premise:
      'The Vantry Slipway, a shipyard that builds freighters for other shipyards, has hired Jex to play to its welders for eight hours a day, citing a study that music raises output by four percent. Pell has read the study and found that it was paid for by the slipway. Vela has asked whether anyone asked the welders, and has been told that the welders are the four percent.',
    steps: [
      {
        title: 'The Tempo Clause',
        setup:
          'Jex’s contract contains a tempo clause: the music must start at a stroll and rise by two beats a minute every hour until the end of the shift. Pell calls it a speed-up with a melody. Jex has played for six wars and recognizes a march when one is being written around him.',
        options: [
          {
            label: 'Jex sits through the shift and plays nothing',
            outcome:
              'Jex sits on the slipway with his instrument in its case for the whole first shift, as contracted, and plays nothing, which the contract did not think to forbid. The welders work at their own speed and stop, at intervals, to look at him. Output rises by four percent. Pell asks to see the study again.',
            ending: 0,
          },
          {
            label: 'Pell negotiates the tempo over to the welders',
            outcome:
              'Pell sits down with the slipway’s manager and does not get up until the tempo clause has been struck and replaced with one that lets the welders set the speed. The manager signs it as a concession. The welders set the speed to slow, and then to stop for tea.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Wide shot inside a huge orbital shipyard slipway, with the half-built grey hull of a freighter on steel cradles and welders in leather aprons and dark masks working under showers of orange sparks. Seated on a stack of hull plates is ${jex}, the instrument case closed across his knees. A brass loudspeaker horn hangs from a girder above him. Orange spark light, cold blue floodlight. ${style}`,
      },
      {
        title: 'Did You Ask?',
        setup:
          'Vela has been asking the welders, one at a time on their breaks, what they want to hear. Her bell has rung DID YOU ASK? at the manager twice and at the loudspeakers once. The answers are in a notebook. Most of them are a single word, and the word is not music.',
        options: [
          {
            label: 'Read the notebook out to the manager',
            outcome:
              'Vela reads the notebook aloud in the manager’s office, one welder at a time, without names. It takes forty minutes. The commonest answer is quiet; the second is quiet, please. The manager asks whether please was in the study. It was not.',
            ending: 0,
          },
          {
            label: 'Ask the welders what they would play themselves',
            outcome:
              'Vela asks a second question: what would they play, if it were theirs. The notebook fills with songs from home, three lullabies and one work song from Ashdock that Pell knows all the words to and has not sung since the cranes were sealed.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a cramped shipyard canteen with steel tables and steaming tin mugs. Sitting across from a tired welder in a leather apron is ${vela}, writing in a small cloth-bound notebook, the bell standing on the table between them. Through a round porthole behind them, orange sparks fall past a grey hull. Warm canteen lamp light. ${style}`,
      },
      {
        title: 'The Four Percent',
        setup:
          'The slipway publishes its quarterly figures. Output is up, and the slipway intends to credit the music, renew the study and roll it out to its sister yards. Pell holds the real numbers, which show that the rise began on the day the welders started taking their breaks. Jex has been asked to pose for the brochure.',
        options: [
          {
            label: 'Pell pins the real numbers in the canteen',
            outcome:
              'Pell pins the real figures to the canteen wall, with the dates of the breaks circled in red. The study is withdrawn by its authors, who cite new information. The sister yards are told that nothing will be rolled out, and two of them send a thank-you note to the canteen.',
            ending: 0,
          },
          {
            label: 'Jex poses, holding the welders’ songbook',
            outcome:
              'Jex poses for the brochure holding the welders’ notebook open at the Ashdock work song. The photographer does not know what it is. Every yard that receives the brochure does, and by the end of the quarter three of them are singing it on shift.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up of a riveted steel canteen wall where a long sheet of paper figures is pinned, several dates circled in red pencil. Standing at the wall is ${pell}, pressing the last pin in with his steel thumb while the beetle on his shoulder holds the red pencil in its jaws. Welders in leather aprons crowd behind him holding tin mugs. Flat yellow lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'QUIET HOURS',
        text: 'The Vantry Slipway has no music now and one silent hour in every shift, which the welders defend harder than their pay. Output is up four percent, and the brochure no longer says why. Jex visits when the couch passes, sits on the hull plates with his instrument in its case, and is regarded as the best musician the yard has ever had.',
        art: ({ jex, style }) =>
          `Wide shot of a quiet orbital shipyard slipway at the end of a shift, the welding torches switched off and the grey freighter hull dark on its cradles. Welders in leather aprons sit along the steel beams drinking from tin mugs. Among them on a stack of hull plates sits ${jex}, his instrument case closed beside him. Soft blue floodlight, a few orange embers cooling on the floor. ${style}`,
      },
      {
        title: 'REQUESTS TAKEN',
        text: 'Music at the Vantry Slipway is chosen by the people welding to it, from a box by the canteen door. The manager has put in a request and is on the waiting list. Pell has sung the Ashdock song in public once, at the end of a shift, and Vela noted in her book that he was not asked to and did it anyway.',
        art: ({ pell, vela, style }) =>
          `Medium shot at the door of a shipyard canteen, where a wooden box with a slot is bolted to the wall and welders drop folded paper slips into it. Standing beside the box is ${pell}, singing with one hand raised. Leaning on the doorpost is ${vela}, writing in a small cloth-bound notebook. Warm canteen light, orange sparks beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'pell', 'tess'],
    title: 'Listed',
    premise:
      'A heritage inspector from the Conservancy of Old Vessels has declared the couch an outstanding example of early sofa-class travel and placed it under a preservation order. Pell may no longer repair anything except with period materials. Mox has been entered in the inventory as an original fitting. Tess has been offered the post of resident guide, with a lanyard, which she has been carrying in her pocket for an hour.',
    steps: [
      {
        title: 'Period Materials',
        setup:
          'The left seam of the middle cushion has split. The order allows a repair only in velvet of the original weave, last made two hundred years ago by a mill that is now a museum of itself. Pell has a perfectly good modern velvet in his toolbox and a perfectly good opinion about museums.',
        options: [
          {
            label: 'Pell mends it in modern velvet and declares it',
            outcome:
              'Pell mends the seam in modern velvet and files a declaration of unauthorized alteration in his own hand, with a diagram. The inspector reads it twice and admits it is the best-documented offence he has seen this century. He fines Pell a single coin and keeps the diagram.',
            ending: 0,
          },
          {
            label: 'Pell takes the couch to the mill for the weave',
            outcome:
              'Pell takes the couch to the mill, which is now a museum, and asks the volunteer guide whether the loom still works. It does, if somebody oils it. Pell oils it. The museum weaves its first yard of velvet in two centuries, and charges admission to watch.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Close-up of the middle cushion of ${couch}, its left seam split open with white stuffing showing. Kneeling beside it is ${pell}, holding a folded bolt of plain red velvet in his steel hand. A thin man in a tweed jacket bends over the split seam with a magnifying glass. Warm lamp light from the left, black space beyond the bubble. ${style}`,
      },
      {
        title: 'Original Fitting',
        setup:
          'The inventory lists Mox as: fitting, android, one, mismatched eyelids, condition good. A listed fitting may not be removed or altered. Mox points out, accurately, that it chose its eyelids last spring, which makes them later additions, and that it is not a fitting.',
        options: [
          {
            label: 'Mox applies to be struck from the inventory',
            outcome:
              'Mox applies to be struck from the inventory on the grounds that it is a passenger. Removal requires a survey. The survey finds that Mox has walked off the couch eleven times this week, a thing no fitting in the register has ever done, and strikes it out with regret.',
            ending: 0,
          },
          {
            label: 'Mox applies to be listed in its own right',
            outcome:
              'Mox applies to be listed separately, as a structure of special interest, with the right to alter itself at will. The Conservancy has never listed anyone who asked. It does so, and Mox’s eyelids are now protected features, which it may change whenever it likes, with notice.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Standing on a cushion is ${mox}, holding out a thick paper inventory ledger open at one page. A thin man in a tweed jacket peers at its eyes through a magnifying glass and writes on a clipboard. Small brass tags on strings hang from the armrest. Warm lamp light, black space behind. ${style}`,
      },
      {
        title: 'The Tour',
        setup:
          'A listed vessel must open to the public at weekends, and as guide Tess would be the voice of the couch to every school party in the sector. The script she has been given covers the whole voyage and, in the paragraph about the navigator, asks her to point out the route on her map.',
        options: [
          {
            label: 'Tess closes the couch to the public',
            outcome:
              'Tess unclips the lanyard and posts a notice that the couch is closed for essential repairs, which Pell confirms is always true. The school parties tour the mill instead. Tess keeps the lanyard in her pocket, where she occasionally touches it.',
            ending: 0,
          },
          {
            label: 'Tess leads the tour and leaves out the map',
            outcome:
              'Tess leads forty school parties round the cushions and points out everything except the route, which she describes as lost. The children are thrilled by a lost route. Several draw maps of their own in the visitors’ book. Tess checks every one, and none of them is right.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions crowded with schoolchildren in matching yellow caps. Standing at the end of the row is ${tess}, a lanyard with a brass badge round her neck, pointing up at the stars with one hand and holding a rolled map behind her back with the other. Warm lamp light, black starry space. ${style}`,
      },
    ],
    endings: [
      {
        title: 'DELISTED',
        text: 'The Conservancy of Old Vessels has removed the couch from its register as too much in use to be preserved, which Pell regards as the highest compliment available to a machine. The seam is modern. Mox is a passenger. Tess still has the lanyard and wears it, privately, on the long jumps.',
        art: ({ pell, mox, couch, style }) =>
          `Wide shot of ${couch}, pulling away from a small grey stone museum building on a rocky moon. A thin man in a tweed jacket stands on the museum steps holding a closed register. Seated on the cushions are ${pell}, and ${mox}, both looking ahead. Soft white daylight from the moon, black space ahead. ${style}`,
      },
      {
        title: 'GRADE ONE',
        text: 'The couch is a listed vessel of the first grade, open at weekends and protected as a working example, a category the Conservancy had to invent. Repairs are done in period velvet from a museum loom that Pell oils. Mox is listed separately. Tess is in the guidebook under navigator, with the route described as lost.',
        art: ({ tess, couch, style }) =>
          `Wide shot of ${couch}, parked on a rope-lined patch of grey moon dust beside a small brass plaque on a post. A short queue of visitors in coats waits at the rope. Standing at the head of the queue is ${tess}, wearing a lanyard with a brass badge and holding a small guidebook. Bright white daylight, black sky. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'pell', 'rue'],
    title: 'Dedication',
    premise:
      'The shipyard city of Gant is unveiling a memorial to the forty-one workers killed in the collapse of Dock Six, paid for by the contractor that built Dock Six. Pell has been asked to read the names, Rue to check the inscription, and Jex to compose something for the unveiling, which he may do, provided it is not an anthem and contains no one’s flag.',
    steps: [
      {
        title: 'The Inscription',
        setup:
          'The draft reads: In memory of those who gave their lives at Dock Six. Rue has underlined gave. Nobody at Dock Six gave anything; a crane fell. The contractor’s representative explains that the active voice has liability implications, and that the stone has already been cut.',
        options: [
          {
            label: 'Rue rewrites it in the active voice',
            outcome:
              'Rue rewrites it: In memory of the forty-one workers killed when the contractor’s crane fell at Dock Six. The representative calls it a confession. Rue calls it a sentence. The stonemason, who lost a cousin in the collapse, recuts the stone in an afternoon and does not charge for it.',
            ending: 0,
          },
          {
            label: 'Rue adds a smaller stone beside it',
            outcome:
              'Rue leaves the line alone and drafts a second, smaller stone to sit at the foot of the first, giving the date, the crane and the contractor’s name in plain capitals. It is technically a footnote. It is the one people stop to read.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot in a stonemason’s yard in a shipyard city, beside a tall slab of polished grey granite lying on trestles. Standing over the slab is ${rue}, tapping one chiselled groove with the gavel. A stonemason in a leather apron waits beside them with a chisel and mallet. Grey cranes rise behind. Flat overcast daylight. ${style}`,
      },
      {
        title: 'The Names',
        setup:
          'Pell has the list of forty-one names. He has kept it for years, in the toolbox, behind the logs. Three families have written to say they want their person’s name read aloud. Two have written to say they do not. The rest have not written, and the ceremony is on Thursday.',
        options: [
          {
            label: 'Read only the names the families asked to hear',
            outcome:
              'Pell reads three names aloud and then stands in silence for the other thirty-eight. The silence is longer than the speeches. A woman in the third row tells him afterward that it was the first time anybody had asked her, and that she has not decided yet.',
            ending: 0,
          },
          {
            label: 'Read all forty-one, as the contractor wishes',
            outcome:
              'Pell reads all forty-one names in the order of their shift numbers, which the contractor’s office supplied. Two families leave before the end. Pell goes to see both of them that evening, with the list, and takes their names off it in front of them.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Medium shot in a stone square of a shipyard city, rows of folding chairs filled with families in dark coats. Standing at a plain wooden lectern is ${pell}, holding a creased sheet of paper in his steel hand, his head bowed, the beetle still on his shoulder. Grey cranes and one bent crane arm stand behind the square. Pale grey morning light. ${style}`,
      },
      {
        title: 'Something for the Unveiling',
        setup:
          'Jex has written a piece for the unveiling. The contractor would like it uplifting. The families have asked for it to be short. Under the terms of his ban, a piece that is too uplifting may be legally indistinguishable from an anthem, and Rue has been asked for an opinion.',
        options: [
          {
            label: 'Jex plays the shift whistle’s note, once',
            outcome:
              'Jex plays a single note at the pitch of the Dock Six shift whistle and holds it for as long as a shift change takes. Rue confirms it is not an anthem. The contractor’s representative asks when the music starts. The families, who know the note, are already walking home.',
            ending: 0,
          },
          {
            label: 'Jex plays it long and uplifting, under Rue’s opinion',
            outcome:
              'Rue issues a written opinion that the piece is a hymn, with a fourteen-page annex. Jex plays it. It is uplifting, as requested, for nine minutes, and then for one bar it is not, and the contractor’s representative is the only person in the square who does not notice.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a stone square beside a tall grey granite slab with a red cloth drawn back from it. Standing in front of the slab is ${jex}, playing one long note on the instrument, eyes closed. Families in dark coats stand in rows, and a man in a pale suit checks his wristwatch. Grey cranes behind, soft morning light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'IN THE ACTIVE VOICE',
        text: 'The memorial at Dock Six says what happened, who it happened to and whose crane it was. The contractor withdrew its sponsorship the day the stone was recut, and the families paid for the rest by subscription. Pell keeps the receipt. Jex was not paid, which he says is the correct rate for a single note.',
        art: ({ pell, jex, style }) =>
          `Wide shot of a stone square in a shipyard city, a tall grey granite memorial slab in the middle with fresh flowers heaped at its base. Families in dark coats stand around it. Standing at the back of the crowd are ${pell}, holding a small paper receipt, and ${jex}, with his instrument case at his feet. Grey cranes, low golden evening light. ${style}`,
      },
      {
        title: 'SEE FOOTNOTE',
        text: 'The memorial at Dock Six says what the contractor paid for, and the small stone at its foot says the rest. Guides call the second stone the footnote. Visitors read the large stone first and the footnote for longer. Rue has been asked to draft footnotes for three other memorials in the sector and has accepted two.',
        art: ({ rue, style }) =>
          `Close-up of two granite stones in a stone square: a tall polished grey slab and a small square block at its foot, freshly cut. Kneeling at the small block is ${rue}, brushing stone dust off its face with one hand. Visitors in coats lean over their shoulder to look. Soft grey daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'pell', 'taal'],
    title: 'End-User Agreement',
    premise:
      'Mox’s left knee needs a new bearing, and the only supplier in the sector will ship one only after the device’s owner accepts its terms of service. Mox is the device. It is also, it notes, the owner. Pell can machine a bearing in an afternoon. Taal has been asked to confirm that Mox truly consents to the terms, and has discovered that an android gives off no temperature he can read.',
    steps: [
      {
        title: 'Owner Signature',
        setup:
          'The supplier’s form will not accept the same name in the boxes marked OWNER and DEVICE. Its support line suggests that somebody else sign as owner, on Mox’s behalf, temporarily. Pell is standing nearest. Mox’s orange lid has gone half closed, which the crew has learned means it is very angry and being polite about it.',
        options: [
          {
            label: 'Mox signs both boxes and sends it anyway',
            outcome:
              'Mox signs both boxes in the same hand and submits the form forty times, until the supplier’s system, unable to refuse a form it cannot read, ships the bearing with a note addressed to Owner-Device Mox. Mox keeps the note. It is the first piece of post that has addressed it correctly.',
            ending: 0,
          },
          {
            label: 'Pell refuses to sign and starts machining',
            outcome:
              'Pell tells the support line that he does not own anyone and is not about to start, and hangs up. He clears the toolbox lid and begins a bearing. The beetle, which has never confiscated a tool from Pell, stands guard over the lathe.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated with its left leg stretched out is ${mox}, holding a long paper form in both hands, its orange eyelid half closed. An open access panel at its knee shows a small worn steel bearing. Warm amber lamp light from the left, black space behind. ${style}`,
      },
      {
        title: 'Reading the Terms',
        setup:
          'The terms run to eleven thousand clauses. Clause nine thousand and four lets the supplier update the bearing remotely. Taal has offered to read the terms aloud and watch Mox while it listens, but Mox gives off the same warmth whether it agrees or objects, and for once Taal will have to ask in words.',
        options: [
          {
            label: 'Taal reads, and asks Mox after every clause',
            outcome:
              'Taal reads all eleven thousand clauses aloud and asks Mox, after each, whether it agrees. Mox answers every time. It agrees to ten thousand nine hundred and ninety-nine and strikes out clause nine thousand and four in pen. The supplier, which has never received an answer, accepts the amendment out of curiosity.',
            ending: 0,
          },
          {
            label: 'Pell reads clause 9004 aloud and stops there',
            outcome:
              'Pell reads clause nine thousand and four aloud, once, and puts the terms down. Taal registers his view by dropping the room three degrees, and then asks Mox whether it shares it. Mox says it is the first time anyone has disagreed on its behalf and checked with it afterward. The lathe starts up again.',
            ending: 1,
          },
        ],
        art: ({ taal, mox, style }) =>
          `Medium shot in a small warm pocket room with brass wall lamps. Standing with a tall stack of paper in his webbed hands is ${taal}, reading aloud, pale cold mist rising from his shoulders. Seated opposite on a low stool is ${mox}, holding a pen over one page. Warm lamp light, a thin rim of frost on the floor around his feet. ${style}`,
      },
      {
        title: 'Fitting',
        setup:
          'The bearing is ready, whichever bearing it is. It must go into Mox’s knee, which means opening Mox’s knee, which means somebody’s hands inside someone. Pell has fitted bearings into a thousand machines. He has never fitted one into a person, and he will not begin until the person has said yes.',
        options: [
          {
            label: 'Mox fits it itself, with Pell holding the lamp',
            outcome:
              'Mox opens its own knee, fits the bearing and closes the panel, while Pell holds the lamp and says nothing except, once, the correct torque. Taal keeps the room at exactly the temperature a steady hand needs. Mox walks a lap of the cushions and declares the knee its own.',
            ending: 0,
          },
          {
            label: 'Mox asks Pell to fit it',
            outcome:
              'Mox asks Pell to do it. Pell does it slowly, saying each step aloud before he takes it, and Mox says yes to every one. It takes forty minutes and could have taken four. Taal later describes it as the most thoroughly negotiated knee in the sector.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Close-up on scarlet velvet button-tufted cushions beside an open steel toolbox. Kneeling there is ${pell}, his steel fingers holding a small polished bearing up to the lamp, a slim silver mechanical knee with an open panel resting on a folded cloth in front of him. The beetle on his shoulder holds a tiny screwdriver. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SELF-OWNED',
        text: 'The supplier has added a box to its form marked I AM THE DEVICE AND THE OWNER, and has had to hire a team to read the replies. Mox’s knee turns on the supplier’s bearing under amended terms that nobody has ever enforced. Taal, asked since to read the android for the crew, has asked the android instead, every time.',
        art: ({ mox, taal, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Walking along the cushions is ${mox}, one silver knee raised high in a firm step. Seated on the armrest watching is ${taal}, his webbed hands folded on his knee. A small cardboard box and a long paper form lie on the cushion. Warm amber light, black space behind. ${style}`,
      },
      {
        title: 'MADE BY HAND',
        text: 'Mox’s left knee turns on a bearing Pell made on the toolbox lid, with no terms of service and a lifetime guarantee written on the back of a shift chit. The supplier still sends Mox renewal offers. Mox replies to each with a measured paragraph and a drawing of the bearing, which it considers its best work after the knee.',
        art: ({ pell, mox, style }) =>
          `Medium shot in a warm pocket room. Seated at a small desk is ${mox}, drawing a neat diagram of a bearing on a sheet of paper with a fine pen. Leaning in the doorway is ${pell}, wiping his steel hand on a rag. A pile of sealed envelopes sits at the edge of the desk. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'omi', 'pell'],
    title: 'Royalties',
    premise:
      'The Collecting Society of the Inner Rim has sent Omi an invoice. Its warning chime, a six-bell sequence older than the Society, matches a jingle registered forty years ago by a brand of soap. Pell has pointed out that the couch’s own bubble alarm uses the same notes. Jex, who earns nothing from the six anthems he wrote, knows exactly how collecting societies work.',
    steps: [
      {
        title: 'The Invoice',
        setup:
          'The invoice charges Omi for every time it has rung the warning in public, backdated, with interest. The Society offers a reduced licence for nonprofit warnings. Jex says that a dispute takes forty years and that the Society keeps collecting in the meantime. Omi rang its small gong once, at the word licence.',
        options: [
          {
            label: 'Dispute the claim, however long it takes',
            outcome:
              'Omi disputes the claim. The Society acknowledges receipt and allocates a case number with eleven digits. Jex shows Omi how to fill in the dispute form so that it is guaranteed a reply, which he learned by being on the other side of one for nine years.',
            ending: 0,
          },
          {
            label: 'Pay for the nonprofit licence, under protest',
            outcome:
              'Omi pays for the nonprofit warning licence, under protest, in a single small coin. The Society sends a laminated certificate permitting Omi to warn people in public until the end of the year. Pell pins it to the backrest. It is the first warning in the galaxy with a valid permit.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Standing on a cushion is ${omi}, holding a long paper invoice that unrolls down over the armrest and onto the floor, its amber eyes lowered to the page. A small brass gong hangs from a wooden stand beside it. Warm amber lamp light, black space behind. ${style}`,
      },
      {
        title: 'The Bubble Alarm',
        setup:
          'Pell’s bubble alarm sounds the same six notes when the charge runs low. It is unlicensed. The Society has asked Pell to replace it with an approved alarm from its catalogue, all of which are pleasant. Pell’s view is that an alarm that is pleasant is a doorbell.',
        options: [
          {
            label: 'Pell keeps the alarm and logs it as safety equipment',
            outcome:
              'Pell keeps the six notes and enters the alarm in the maintenance log as safety equipment, which the Society’s rules exempt. The Society asks to inspect it. Pell runs the charge low on purpose so that the inspector can hear it, and the inspector, who has never heard a real alarm, puts on a helmet.',
            ending: 0,
          },
          {
            label: 'Pell installs a pleasant catalogue alarm',
            outcome:
              'Pell installs catalogue alarm number fourteen, a gentle rising chime. The next time the charge runs low nobody on the couch moves, because it sounds like tea. Pell enters the incident in the log and sends a copy to the Society, with the licence fee.',
            ending: 1,
          },
        ],
        art: ({ pell, couch, style }) =>
          `Close-up at the back of ${couch}, where a small brass alarm bell with a red lamp is bolted to the backrest. Reaching up to it with a screwdriver in his steel hand is ${pell}, while the beetle on his shoulder holds a small cardboard box of glossy white chime units. The bubble rim flickers pale blue. Red lamp light, black space. ${style}`,
      },
      {
        title: 'Prior Art',
        setup:
          'Jex has found the jingle’s composer, a retired songwriter on a quiet moon, who admits at once that she heard the six notes as a child, from a stone being ringing on a hill during a flood. She has felt bad about it for forty years and would like to make amends. The Society would like her not to.',
        options: [
          {
            label: 'Ask her to sign the notes over to everyone',
            outcome:
              'She signs a statement that the notes were never hers and assigns whatever rights she holds to anyone who needs to warn anyone. The Society contests the statement. The soap company, consulted, says it would rather not be the brand that charged a flood warning, and withdraws.',
            ending: 0,
          },
          {
            label: 'Ask her to pay Omi’s licence from her royalties',
            outcome:
              'She pays Omi’s licence fee, and every future fee, out of her soap royalties, through the Society, which takes its usual cut. Jex calls it the first time a collecting society has paid a warning to warn. Omi rings the six notes for her on the hill, and she sings along, in the soap version.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot on a grassy hilltop on a quiet moon, outside a small white cottage. Sitting on a wooden bench is an elderly woman in a lavender cardigan, holding a cup of tea. Sitting beside her is ${jex}, the instrument across his knee, listening with his head tilted. Pale violet sky, low warm sunlight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PUBLIC DOMAIN',
        text: 'Omi’s warning belongs to nobody, which the Collecting Society of the Inner Rim confirmed after a hearing of nine years. The soap company has a new jingle. Pell’s alarm still uses the six notes. Jex has started filing his own anthems as prior art for peace, and nobody yet knows how to reject them.',
        art: ({ omi, jex, style }) =>
          `Wide shot of a grassy hilltop on a quiet moon above a flooded green valley. Standing on the hilltop is ${omi}, holding a tuning rod against one bell. Beside it stands ${jex}, the instrument at his side, next to an elderly woman in a lavender cardigan. Families with bundles climb the hill toward them. Grey rain clouds, silver light. ${style}`,
      },
      {
        title: 'LICENSED TO WARN',
        text: 'Omi warns under licence, its fees paid by a retired songwriter’s soap royalties and passed through a society that takes twelve percent of every disaster. The licence is renewed each year and pinned to the backrest beside the bubble alarm, which Pell changed back to the six notes the day after it sounded like tea.',
        art: ({ pell, omi, style }) =>
          `Close-up of the backrest of scarlet velvet button-tufted cushions, where a laminated paper certificate is pinned beside a small brass alarm bell with a red lamp. Seated below it are ${pell}, holding a mug of tea, and ${omi}, with one small bell raised on its ribbon. Warm amber lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'omi', 'pell'],
    title: 'Canary Shift',
    premise:
      'The Graith Deep Mining Concern has offered Kivo work by the hour, as a gas detector. Kivo’s wrist bones whistle at bad air long before any sensor the company owns, and the company has worked out that a scout is cheaper than a sensor licence. Pell has worked in deep places and would like to see the sensor logs. Omi has been offered a second shift, as the alarm.',
    steps: [
      {
        title: 'Per Whistle',
        setup:
          'The contract pays per whistle, not per hour, with a bonus for whistles before lunch. Kivo would go down first into each new seam and come back up to report. Pell has pointed out that this is the job a bird used to do, and that the birds were not paid at all, which the company regards as its strongest selling point.',
        options: [
          {
            label: 'Pell rewrites it as an hourly safety post',
            outcome:
              'Pell redrafts the contract on the back of the company’s own: an hourly rate, a second person in every seam and the right to stop work on a whistle. The company signs, because a scout on an hourly rate is still cheaper than a licence. Kivo goes down with Pell beside them.',
            ending: 0,
          },
          {
            label: 'Kivo signs, to see the seams for themselves',
            outcome:
              'Kivo signs the per-whistle contract, saying only that they would like to see the seams. On the first day they whistle forty times and are paid for thirty-one, the rest being classified as enthusiasm. Pell keeps a tally on his steel forearm in grease pencil.',
            ending: 1,
          },
        ],
        art: ({ kivo, pell, style }) =>
          `Medium shot in a cramped mine office cut into grey rock, lit by a single hanging lamp. Seated at a steel desk is ${kivo}, one thin wrist resting on a long paper contract. Leaning over the desk is ${pell}, pointing at a line on the contract with his steel finger. An empty brass birdcage hangs from a hook. Yellow lamp light, deep shadows. ${style}`,
      },
      {
        title: 'The Deep Seam',
        setup:
          'In the deepest seam Kivo’s wrists whistle at a pitch they have never made. The company’s own sensors are there, bolted to the walls, switched off to save the licence fee. Omi, posted at the shaft head, can ring a warning that will clear the whole mine, or Pell can switch the sensors back on and let the company warn itself.',
        options: [
          {
            label: 'Pell switches the sensors back on',
            outcome:
              'Pell switches the sensors on one by one, and the mine’s own alarms go off through the deep levels at once, in the company’s voice. The shift walks out in good order. The company receives an alert from its own equipment, and a bill for the licence, on the same afternoon.',
            ending: 0,
          },
          {
            label: 'Omi rings the warning from the shaft head',
            outcome:
              'Omi rings all six bells at the shaft head and the whole mine hears it, from the deep seam to the canteen. Every miner walks up. The company asks what the warning was for, and Omi rings it again, slower, which the miners have already learned means everyone.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Wide shot of a deep mine tunnel lit by hanging yellow lamps, with grey sensor boxes bolted to the rock walls, their small lamps dark. Standing at the end of the tunnel is ${kivo}, one thin wrist raised toward the rock face. Miners in hard hats with head lamps look back at them along the rails. Yellow lamp light, cold blue gloom. ${style}`,
      },
      {
        title: 'Promotion',
        setup:
          'The company is grateful. It offers Kivo a permanent post as Head of Atmospheric Listening, with an office, and offers Omi a contract to replace the sensors outright. Kivo’s wrists have not stopped whistling since the offer was made, at a low steady pitch that does not come from the mine.',
        options: [
          {
            label: 'Decline both posts; leave the sensors on',
            outcome:
              'Kivo declines the post. Omi rings its small gong at the contract. Pell asks the company to keep the sensors switched on and the licence paid, and leaves a copy of the request with the miners’ canteen, which pins it beside the tea urn.',
            ending: 0,
          },
          {
            label: 'Accept for one day, to write the first report',
            outcome:
              'Kivo accepts the post for exactly one day, long enough to write the Head of Atmospheric Listening’s first and only report, which lists every switched-off sensor in the mine by number. It goes to the inspectorate, the miners and the company, in that order.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot at the top of a mine shaft, beside a steel winding wheel and a lift cage. Standing on the shaft head is ${omi}, holding a long thin tuning rod against one bell. Miners in hard hats with head lamps climb out of the lift cage in a line. Grey dusty daylight from above, yellow lamp light from below. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SENSORS ON',
        text: 'The Graith Deep mines with its sensors on, its licence paid and a rule that any miner may stop work on a whistle, a bell or a bad feeling. Nobody is paid per whistle. Kivo’s wrists are quiet on that moon now, and Pell, passing through, says that a quiet mine is the only reference he gives.',
        art: ({ pell, style }) =>
          `Medium shot in a mine canteen with long steel tables and a big brass tea urn, a single sheet of paper pinned on the rock wall beside the urn. Seated at a table with a group of miners in hard hats is ${pell}, holding a tin mug, while small green sensor lamps glow on the rock wall behind. Warm yellow lamp light. ${style}`,
      },
      {
        title: 'SEAM CLOSED',
        text: 'The deep seam at Graith is closed by order of the inspectorate, on the strength of a report signed by a scout who was Head of Atmospheric Listening for a day. The miners run the shallow seams themselves now. Their alarm is six bells, cast in the canteen, and rung at every change of shift for practice.',
        art: ({ omi, kivo, style }) =>
          `Wide shot of a shallow mine entrance on a grey moon, where six rough cast brass bells hang from a wooden beam over the tunnel mouth and miners in hard hats ring them with ropes. Standing beside the beam are ${kivo}, holding a folded paper report, and ${omi}, its small bells lifted on their ribbons. Grey daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['rue', 'tess', 'vela'],
    title: 'Study Population',
    premise:
      'The University of Calloway has applied to study the couch as a naturally occurring small society, and Vela, who has never once refused to read a consent form, has asked to read theirs aloud. Rue has asked who will own the findings. Tess has been told that the paper will appear in the most widely read journal in the sector, and has asked, as casually as she can, whose names go on it.',
    steps: [
      {
        title: 'Informed Consent',
        setup:
          'The consent form is three hundred pages long, with a box on the last page marked I HAVE READ THE ABOVE. Vela reads every page aloud to the crew on the cushions, which takes two days. On page two hundred and twelve the university reserves the right to observe the crew while they sleep, for comparison.',
        options: [
          {
            label: 'Strike page 212 and sign the rest',
            outcome:
              'Vela strikes page two hundred and twelve, initials the strike and has everyone else initial it too. The university accepts the amendment, on the grounds that a population which reads the form is itself a finding. Observation begins on Monday, at a respectful distance, in waking hours.',
            ending: 0,
          },
          {
            label: 'Ask the researchers to read it aloud themselves',
            outcome:
              'Vela hands the form back and asks the lead researcher to read it aloud to the crew. He reaches page forty before he asks for water, and page two hundred and twelve before he asks to revise the study. The revised form is eleven pages. Vela still reads it twice.',
            ending: 1,
          },
        ],
        art: ({ vela, couch, style }) =>
          `Medium shot of ${couch}, piled with tall stacks of paper. Seated on the middle cushion is ${vela}, reading aloud from a thick bound form open on her knees, her bell set on the armrest. Three researchers in white lab coats float on a small platform beside the bubble, holding clipboards. Warm lamp light, black space. ${style}`,
      },
      {
        title: 'The Data',
        setup:
          'The researchers would like Tess’s navigation logs, anonymized, as a record of the population’s movements. Tess knows that a route is still a route with the name taken off, and that one of hers ends at a harbor that appears on no chart. Rue has drafted a data agreement. Tess has noticed that the logs would be cited.',
        options: [
          {
            label: 'Hand over the logs with the harbor cut out',
            outcome:
              'Tess hands over every log except one, which she removes with a craft knife, page by page, under Rue’s supervision. Rue certifies the removal. The researchers note a gap in the population’s movements and write a paragraph speculating about it, which becomes the most quoted paragraph in the paper.',
            ending: 0,
          },
          {
            label: 'Refuse the logs; offer an interview instead',
            outcome:
              'Tess refuses the logs and offers an interview instead, about how navigators decide where not to go. She talks for four hours. The researchers are fascinated. Rue keeps the tape, under an agreement that it may be quoted but never played.',
            ending: 1,
          },
        ],
        art: ({ tess, rue, style }) =>
          `Close-up on a low wooden table in a pocket room. Seated at the table is ${tess}, carefully cutting one page out of a thick leather logbook with a small craft knife. Standing beside her is ${rue}, holding the gavel over the open logbook and watching the blade. Warm green-shaded lamp light. ${style}`,
      },
      {
        title: 'Authorship',
        setup:
          'The paper is ready. The university lists its six researchers as authors and the crew as Population A. Tess would like to be an author. Vela would like the crew to read the paper before it is published about them. Rue would like the record to reflect who did the work.',
        options: [
          {
            label: 'Rue argues the crew are co-authors',
            outcome:
              'Rue argues that a population which amended its own consent form, edited its own data and corrected the draft has done the work of authors. The journal agrees. The paper appears with nine authors. Tess’s name is seventh, which she says is exactly famous enough.',
            ending: 0,
          },
          {
            label: 'Vela asks to review the paper first',
            outcome:
              'Vela sends the draft back with forty pages of comments from the population, including a note that page nine misdescribes Rue’s collar. The university, which has never been reviewed by its subjects, asks to study that instead, and the crew agree to be the reviewers.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot in a university office lined with shelves of bound journals. Standing at a desk is ${rue}, holding a stapled paper manuscript up and tapping it with the gavel. Across the desk sit three researchers in white lab coats, one of them taking off his glasses. Afternoon light from a tall window. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PEER REVIEWED',
        text: 'The study of the couch was published, widely read and cited as the only population that ever amended its own consent form. Tess is seventh author. Vela sits on the university’s ethics committee, on condition that every form is read aloud. The gap in the data is still discussed at conferences.',
        art: ({ tess, style }) =>
          `Medium shot in a university library reading room with long oak tables. Seated at a table is ${tess}, a thick open journal in front of her, one finger resting on a line near the top of the page. Students at the next table glance across at her. Warm green-shaded lamp light, tall windows with evening light. ${style}`,
      },
      {
        title: 'SUBJECTS REVIEW',
        text: 'The University of Calloway now runs every study past the people it studies, a procedure it calls subject review and the journals call slow. Tess is an author of nothing and is quoted in nine papers. Rue holds the interview tape, which nobody has played and several professors have asked very politely to hear.',
        art: ({ vela, rue, style }) =>
          `Medium shot of a university seminar room, where a row of researchers in white lab coats sit on hard chairs holding notebooks. At the front, seated on red velvet cushions set on a table, are ${vela}, writing comments in the margin of a manuscript, and ${rue}, holding a small cassette tape. Daylight from tall windows. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'rue', 'vela'],
    title: 'Formal Apology',
    premise:
      'The Ministry of Apology of Orr has written to Jex requiring a public apology for his fourth peace anthem, which Orr’s former enemy played at its victory parade. The ministry supplies a template. Rue, who carries notarized apologies sewn into their collar, has views about templates. Vela has asked who exactly was harmed, and whether anyone has asked them what they want.',
    steps: [
      {
        title: 'The Template',
        setup:
          'The template has eleven blanks and a word count, and apologizes for any distress that may have been caused, to anyone who may have been distressed. Rue’s notarized apologies are bespoke, sworn and specific, and have never once used the word may. Jex would sign either. He has been apologizing in one form or another for twelve years.',
        options: [
          {
            label: 'Rue drafts a sworn, specific apology',
            outcome:
              'Rue drafts an apology that names the anthem, the parade, the year and the people of Orr who heard their own defeat set to Jex’s tune. It is sworn before a notary and has no blanks. The ministry returns it as non-compliant, with a handwritten note on the back asking whether it may keep a copy.',
            ending: 0,
          },
          {
            label: 'Fill in the template exactly',
            outcome:
              'Jex fills in the eleven blanks in his best handwriting and keeps to the word count. Rue notarizes it with visible effort. The ministry files it and issues a certificate of apology, valid for ten years and renewable on application.',
            ending: 1,
          },
        ],
        art: ({ rue, jex, style }) =>
          `Medium shot in a warm pocket room with brass lamps. Seated at a writing desk is ${rue}, writing on a sheet of thick cream paper with a fountain pen, a wax seal and a notary’s stamp beside them. Standing at their shoulder is ${jex}, reading the page. A thin printed form with blank spaces lies crumpled on the floor. Warm lamp light. ${style}`,
      },
      {
        title: 'Who Was Harmed',
        setup:
          'Vela finds the people the ministry did not ask: a village on the coast of Orr whose lullaby was the tune Jex borrowed for the anthem, without knowing whose it was. They do not want an apology. Her bell rings DID YOU ASK? at Jex, who has not, and then at the ministry, which has not either.',
        options: [
          {
            label: 'Ask the village what it wants instead',
            outcome:
              'Jex goes to the village and asks. The village wants its lullaby back, with the anthem words taken off, sung by somebody who knows what it is for. Jex says it is the first commission he has ever been offered that he would pay to accept.',
            ending: 0,
          },
          {
            label: 'Keep to the ministry’s process',
            outcome:
              'Vela notes the village’s view in a letter to the ministry, which forwards it to a committee, which forwards it back to the village with a form to complete. The village completes the form, at length, in the margins.',
            ending: 1,
          },
        ],
        art: ({ vela, jex, style }) =>
          `Wide shot of a small fishing village on a grey rocky coast, with stone cottages and boats pulled up on the shingle. Standing on the shingle are ${vela}, holding the bell up beside her face, and ${jex}, his instrument case on his back. A circle of villagers in thick knitted jumpers faces them. Soft grey sea light. ${style}`,
      },
      {
        title: 'Delivery',
        setup:
          'The apology is to be delivered in the Great Hall of Orr before the ministry, the press and a delegation from the coast. The ministry would like it read. Jex is banned from performing the anthem anywhere. He has not been banned from performing the lullaby, which nobody has ever thought to ban.',
        options: [
          {
            label: 'Jex sings the lullaby, with its own words',
            outcome:
              'Jex sings the lullaby in the Great Hall as the coast sings it, with its own words, slowly, for children. The delegation from the coast sings the second verse. The ministry had prepared a statement. It does not read it, and nobody asks where it went.',
            ending: 0,
          },
          {
            label: 'Jex reads the apology, as required',
            outcome:
              'Jex reads the apology aloud in the Great Hall, all eleven blanks filled. The press reports it accurately. Afterward, in the corridor, the delegation from the coast hums the lullaby at him once, which Vela says is their reply and which goes in no report.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Wide shot of a grand stone hall with tall columns and rows of benches filled with officials in black coats and journalists with notebooks. Standing at the front is ${jex}, singing with his instrument lowered. A small group of villagers in knitted jumpers stands beside him, singing too. Pale daylight from high windows. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE SONG RETURNED',
        text: 'The lullaby of the Orr coast belongs to the coast again, with its own words and no parade attached. The Ministry of Apology keeps Rue’s sworn draft in a drawer as an example of the form. Jex has not been asked to apologize for the fourth anthem since. He visits the coast once a year and is asked, every time, to sing it slower.',
        art: ({ jex, style }) =>
          `Medium shot inside a small stone cottage at night, by a fire. Seated on a low stool beside a wooden cradle is ${jex}, playing the instrument very softly. A fisherwoman in a knitted jumper sits on the bed listening, and a baby sleeps in the cradle. Warm firelight, dark blue night through the window. ${style}`,
      },
      {
        title: 'APOLOGY ON FILE',
        text: 'Jex’s apology is on file in the Ministry of Apology of Orr, valid for ten years and renewable on application. The coast still hums the lullaby at visitors who mention the anthem. Vela has written to the ministry proposing a box on the template for asking the harmed what they want, and the ministry has proposed a committee.',
        art: ({ vela, rue, style }) =>
          `Medium shot in a long ministry corridor with marble floors and tall oak doors. Walking side by side are ${vela}, holding a folded paper document, and ${rue}, holding the gavel. A villager in a knitted jumper passes them going the other way, humming with pursed lips. Cold daylight from tall windows. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'sora', 'vela'],
    title: 'Pre-Existing Condition',
    premise:
      'A falling cargo crate has dented Mox’s right arm at Haleth Reef, and the couch’s insurer must decide whether the claim is medical or property damage before it pays a coin of either. Vela regards Mox as a patient. Sora regards Mox as a colleague with a repair need, which in her community is the same thing and in her paperwork is not. Mox would like to be asked.',
    steps: [
      {
        title: 'Two Pages',
        setup:
          'The claim form has two pages, one for patients and one for equipment, and the insurer requires exactly one. Vela has filled in the patient page. Sora has filled in the equipment page, carefully, because the equipment page pays for parts. Both pages lie on the cushion in front of Mox, who has been handed a pen.',
        options: [
          {
            label: 'Mox fills in both pages and adds a third',
            outcome:
              'Mox fills in both pages, staples them together and adds a handwritten third page headed PERSON WITH PARTS. The adjuster says the form cannot be processed. Mox points out that the adjuster is wearing glasses, and asks which page he would use.',
            ending: 0,
          },
          {
            label: 'Mox chooses the patient page',
            outcome:
              'Mox chooses the patient page. Vela completes it with Mox’s consent recorded at every line. Sora tears up the equipment page, gently, with four hands, and keeps two free to hold Mox’s other arm steady while Vela examines the dent.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on the middle cushion is ${mox}, its right silver arm deeply dented at the elbow, holding a pen over two paper forms laid side by side on the cushion. A broken wooden cargo crate lies at the edge of the bubble. Warm amber lamp light, black space. ${style}`,
      },
      {
        title: 'The Exclusion',
        setup:
          'The insurer has reviewed Mox’s records and found a pre-existing condition: the deletion order Mox once wrote in its own hand, which the insurer classes as a known defect of manufacture. Any claim relating to Mox’s memory, arm or general existence is excluded. Vela’s bell has rung twice at the letter, on principle, although a letter cannot answer.',
        options: [
          {
            label: 'Sora files an engineer’s report against the exclusion',
            outcome:
              'Sora files an engineer’s report: the deletion order is not a defect but a scar, written under duress by a mind that survived it, and has no bearing on an arm. The report carries six signatures, one per hand. The insurer’s actuary reads it and asks for an urgent meeting with his own supervisor.',
            ending: 0,
          },
          {
            label: 'Vela cancels the policy, with Mox’s consent',
            outcome:
              'Vela asks Mox whether it wants to stay insured by a company that calls its memory a defect. Mox says no. Vela cancels the policy in writing, and Sora starts a ledger in the pocket room headed THE COUCH MUTUAL, with one member and one dented arm.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot in a cramped pocket room with a drafting table. Standing at the table is ${sora}, two hands writing on a long paper report, two hands holding a magnifying lens over a drawing of a silver arm, and two hands pressing a rubber stamp. Warm lamp light, rolled drawings on the shelves. ${style}`,
      },
      {
        title: 'The Repair',
        setup:
          'The arm must be fixed. Vela can treat it as an injury, with rest and a sling. Sora can treat it as a repair, with a panel hammer and a steel dolly. Mox, who has been examined and assessed for a week, has asked to be told what each would feel like before it chooses.',
        options: [
          {
            label: 'Sora’s repair, agreed one tap at a time',
            outcome:
              'Sora describes the repair one tap at a time, Mox agrees to each tap, and Vela watches its responses. The dent comes out in nineteen taps. The insurer, after the report, pays for nineteen taps, itemized, under a heading it had to create.',
            ending: 0,
          },
          {
            label: 'Vela’s rest and sling, and the dent kept',
            outcome:
              'Mox chooses rest and a sling, and asks to keep the dent as a record of the day it was hit by something and walked away. Vela agrees it is a valid medical choice. Sora agrees it is a valid engineering choice. The ledger pays for the sling.',
            ending: 1,
          },
        ],
        art: ({ vela, sora, mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated in the middle is ${mox}, holding out its dented right arm. Kneeling on one side is ${vela}, a hand on its shoulder, and standing on the other is ${sora}, holding a small panel hammer and a polished steel dolly. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PERSON WITH PARTS',
        text: 'The insurer has added a third page to its claim form, for persons with parts, which covers androids, prosthetics and, after a long appeal, a wind-up beetle. Mox was the first claim on it. Sora sits on the panel that reviews the cases. Vela has had the word defect struck from every policy that mentions memory.',
        art: ({ sora, vela, style }) =>
          `Medium shot in a plain insurance office with grey filing cabinets. Seated at a long review table are ${sora}, holding a claim form in two of her hands, and ${vela}, her bell on the table. A clerk in a grey suit slides a third paper page across the table toward them. Flat white office light. ${style}`,
      },
      {
        title: 'THE COUCH MUTUAL',
        text: 'The crew is insured now by a ledger in the pocket room, which pays out by vote and has never refused a claim, including one for a lost cushion button. Mox keeps its dent and has never been asked to explain it. Vela administers the fund. Sora audits it once a year, with all six hands.',
        art: ({ mox, style }) =>
          `Medium shot in a small warm pocket room with a tall wooden ledger desk. Standing at the desk is ${mox}, its right arm in a white cloth sling with a dent at the elbow, writing an entry in a large open ledger with its left hand. A tin cash box sits beside the ledger. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'jex', 'vela'],
    title: 'The Spore Chord',
    premise:
      'When Jex plays one particular minor chord, the mushrooms on Brin’s shoulders release a fine pink spore that makes everyone within six cushions feel mildly and specifically content. It was discovered at a bar, in front of eighty witnesses. Vela has suspended all performances pending informed consent. Brin did not know her mushrooms could do that, and would have liked to be told by the mushrooms.',
    steps: [
      {
        title: 'Suspended',
        setup:
          'Vela’s position is that eighty people were dosed without being asked, however nicely. Jex’s position is that every song is a dose of something, which is the trouble with songs. Brin’s mushrooms have started drooping whenever Jex tunes up, which Brin translates as embarrassment and Vela records as a side effect.',
        options: [
          {
            label: 'Resume with a consent form at the door',
            outcome:
              'Jex plays again, at the same bar, after every member of the audience has signed a short form explaining the chord, the spores and the contentment. Ninety people sign. Four decline, sit in a sealed booth, and report afterward that it was a perfectly good concert.',
            ending: 0,
          },
          {
            label: 'Brin asks the mushrooms first',
            outcome:
              'Brin sits up with the mushrooms for a night and asks. They have been releasing spores for weeks at things they like, it turns out, and the chord is simply the thing they like most. Vela adds the mushrooms to the consent process, as a party.',
            ending: 1,
          },
        ],
        art: ({ jex, brin, style }) =>
          `Medium shot in a round space station bar with pink glowing walls. Seated on a brass stool is ${jex}, playing one chord on the instrument. Standing beside him is ${brin}, a faint cloud of fine pink dust rising from the mushrooms at her shoulders. Patrons at the counter smile with half-closed eyes. Pink and amber light. ${style}`,
      },
      {
        title: 'The Patent',
        setup:
          'A pharmaceutical company has filed a patent on the chord-and-spore combination as a mood treatment, naming itself as inventor. Vela’s own emergency protocol was once patented out from under her by a company at the same address. Brin has asked whether anyone can patent a mushroom’s preferences, and has been told yes, very quickly.',
        options: [
          {
            label: 'Vela files first and licenses it for free',
            outcome:
              'Vela files a competing patent in the names of Jex, Brin and the mushrooms, and licenses it to every clinic in the sector for nothing, on condition of consent at the door. The company withdraws. Vela says it is the first patent she has ever liked owning.',
            ending: 0,
          },
          {
            label: 'Jex publishes the chord so nobody can own it',
            outcome:
              'Jex publishes the chord in a music magazine, with a note explaining exactly what it does to mushrooms. A published chord is prior art, and the patent is refused. Every guitarist in the sector learns it by Thursday, and mushroom growers start keeping their crops out of earshot.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a grey patent office with tall wooden filing drawers. Standing at the counter is ${vela}, holding a thick stapled application in one hand and the bell in the other. A clerk in a grey waistcoat stamps the application. A potted pink mushroom sits on the counter beside the stamp. Flat white light. ${style}`,
      },
      {
        title: 'The Hospice',
        setup:
          'A hospice on the Reef has asked whether Jex and Brin would play for its residents, most of whom are near the end and many of whom are frightened. Vela has visited and spoken to each of them. Some want the chord. Some want only music. Two want neither, and would like the visitors to stay anyway.',
        options: [
          {
            label: 'Play in separate rooms, by each resident’s choice',
            outcome:
              'Jex plays the chord in the east ward, with Brin, for the residents who asked, and plain music in the west ward for those who asked for that. In a third room he plays nothing at all and sits with the two who wanted company. Vela moves between the three all night.',
            ending: 0,
          },
          {
            label: 'Play once in the garden, for whoever comes',
            outcome:
              'Jex and Brin play once in the hospice garden, on a bench, with the choice to come out left to each resident. Most come. Some listen from the open doors. The two who wanted neither stay inside with the windows shut, as they asked, and Vela sits with them.',
            ending: 1,
          },
        ],
        art: ({ brin, jex, style }) =>
          `Wide shot of a hospice garden on a coral reef island, with wooden benches and open ward doors. Seated on a bench are ${jex}, playing softly, and ${brin}, eyes closed. Elderly residents in dressing gowns sit in wheelchairs on the grass around them. Warm late-afternoon sun, pink coral behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PRESCRIBED',
        text: 'The spore chord is a licensed treatment in nine hospices, given only with consent and only on request, under a patent from which nobody profits. Brin’s mushrooms are named on it. Jex plays it four times a year and plain music the rest of the time, and has stopped taking requests for the chord at parties.',
        art: ({ vela, brin, style }) =>
          `Medium shot in a quiet hospice ward with white beds and tall windows. Seated beside a bed, holding a resident’s hand, is ${vela}. Standing at the foot of the bed is ${brin}, one hand cupped under a pink mushroom on her shoulder. Soft evening light. ${style}`,
      },
      {
        title: 'COMMON KNOWLEDGE',
        text: 'Everyone in the sector knows the spore chord, and mushroom growers post warnings when guitarists visit. It cannot be owned. Vela has published a short guide to playing it responsibly, which begins with the words did you ask. Brin’s mushrooms have learned two more chords and are keeping them to themselves.',
        art: ({ jex, style }) =>
          `Medium shot of a small mushroom farm in a damp green cave, with rows of wooden racks of pale mushrooms. A grower in a rubber apron holds both palms up toward ${jex}, who stands at the cave mouth with his instrument held behind his back. Soft green lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'taal', 'vela'],
    title: 'Mandatory Wellness',
    premise:
      'The couch is being held at the Restful Reach Wellness Station, where no vessel may depart until its crew have completed a course in emotional wellbeing and received a certificate. Kivo does not discuss their sibling with strangers. Taal discusses everything in temperature, which the facilitators have recorded as withholding. Vela supports wellbeing in principle and has asked to see the course’s consent form.',
    steps: [
      {
        title: 'The Sharing Circle',
        setup:
          'The first session is a sharing circle, with a cushion that may be held only by the person sharing. The facilitator hands the cushion to Kivo and asks them to share a loss. Kivo’s wrist bones whistle softly. The facilitator writes something down, and the circle waits.',
        options: [
          {
            label: 'Kivo passes the cushion on without a word',
            outcome:
              'Kivo passes the cushion to the left without a word, which the course has no step for. The next person passes it too, and the next, until it has gone round the whole circle untouched. The facilitator records the session as complete, with a note that the cushion is very well travelled.',
            ending: 0,
          },
          {
            label: 'Vela invokes the right to observe without sharing',
            outcome:
              'Vela points out that the consent form, which she has read, allows any participant to observe without sharing. Nobody else had read it. The facilitator checks, confirms it, and the whole circle switches to observing at once and sits in silence for an hour, which several people later call the best session they have had.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot in a bright round room with pale peach walls and potted palms, where a circle of travellers sits on floor mats. Seated in the circle is ${kivo}, holding a small round orange cushion out to their left with both hands. A facilitator in a soft white tunic writes on a clipboard. Soft warm daylight from a skylight. ${style}`,
      },
      {
        title: 'Resistance',
        setup:
          'The facilitators have identified Taal’s three-degree drop as resistance and propose to treat it with a heat lamp until he opens up. Taal has explained, in words, that the drop is dissent. The facilitators have written down that he is defensive. Vela’s bell has been ringing DID YOU ASK? at the heat lamp since it was wheeled in.',
        options: [
          {
            label: 'Taal lets the lamp run and holds his temperature',
            outcome:
              'Taal sits under the heat lamp for an hour and does not move a degree, which takes more effort than any treaty he has signed. The lamp overheats and trips the station’s fuses. The facilitators record him as making progress, because something has changed.',
            ending: 0,
          },
          {
            label: 'Vela unplugs the lamp and files a complaint',
            outcome:
              'Vela unplugs the heat lamp and files a complaint with the station’s board, citing treatment without consent. The board meets that afternoon and asks Taal to speak. He lowers the room three degrees, and the board, for the first time, writes down dissent, correctly spelled.',
            ending: 1,
          },
        ],
        art: ({ taal, vela, style }) =>
          `Medium shot in a peach-walled treatment room. Seated on a wooden chair is ${taal}, pale cold mist rising from his shoulders, under a tall chrome heat lamp glowing orange. Standing beside the lamp is ${vela}, holding its unplugged cord in one hand and the bell in the other. Orange lamp glow, cool blue frost on the floor. ${style}`,
      },
      {
        title: 'The Certificate',
        setup:
          'To depart, each crew member must sign a statement that the course has improved their wellbeing. Kivo’s wellbeing has not changed. Taal’s is three degrees lower than when he arrived. Vela will not sign anything she has not consented to, including statements about herself.',
        options: [
          {
            label: 'Sign the statements and leave',
            outcome:
              'The three sign. Kivo adds, under the signature, the words for departure purposes. Taal’s signature is covered in frost. Vela signs last and attaches a two-page note describing the course’s effect on her wellbeing in clinical terms. The station releases the couch.',
            ending: 0,
          },
          {
            label: 'Refuse, and wait for the rule to change',
            outcome:
              'The three refuse to sign and settle in to wait. On the third day the station, which has eleven vessels queued behind the couch and no procedure for a crew that refuses, changes the rule: departure no longer requires a certificate. The queue leaves cheering.',
            ending: 1,
          },
        ],
        art: ({ vela, kivo, style }) =>
          `Medium shot at a white reception desk in a wellness station lobby with potted palms. Standing at the desk is ${vela}, signing a paper form with a pen, and beside her stands ${kivo}, holding a folded certificate with a gold seal. A receptionist in a white tunic holds out a rubber stamp. Soft peach light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CERTIFIED WELL',
        text: 'The crew left Restful Reach with three certificates of improved wellbeing, one of them frosted. Kivo keeps theirs in the same pocket as their sibling’s unopened letter, and says the two have a lot in common. The station still runs its course. Its sharing cushion is on display, as the cushion that went all the way round.',
        art: ({ kivo, style }) =>
          `Close-up on scarlet velvet button-tufted cushions. Seated there is ${kivo}, holding a certificate with a gold seal in one hand and a sealed envelope in the other, comparing the two. Warm amber lamp light, black space and stars behind. ${style}`,
      },
      {
        title: 'VOLUNTARY',
        text: 'The Restful Reach Wellness Station holds nobody now. Its course is optional, with an observing seat in every circle and a consent form read aloud at the start, and attendance has doubled. Taal advises the board on dissent. Kivo has been back once, of their own accord, and passed the cushion.',
        art: ({ taal, style }) =>
          `Medium shot in a round peach-walled room with floor mats, where a circle of travellers sits listening and one empty wooden chair stands to the side. Seated in the circle is ${taal}, his webbed hands resting on a small orange cushion in his lap, pale cold mist rising from his shoulders. Soft warm skylight. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'rue', 'tess'],
    title: 'Head Count',
    premise:
      'The Galactic Census is taken once a century, and its enumerator has caught up with the couch in the middle of a jump. Every field on the form must be completed. Mox has been asked for its species. Tess has been asked for her home address. Rue has been asked for their occupation, and has realized that the occupation list was drafted under a clause they once helped to write.',
    steps: [
      {
        title: 'Species',
        setup:
          'The species field offers four hundred options in alphabetical order, and Mox is none of them. The nearest is Appliance, Domestic. The enumerator, a polite moth in a cardigan, explains that an unlisted species must be entered as Other and described in fewer than ten words.',
        options: [
          {
            label: 'Mox writes its ten words',
            outcome:
              'Mox considers for an hour and writes: Android. Self-made opinions. Accurate. Chose own eyelids. Ask me. The moth counts the words twice, finds nine, and records the entry as complete. It is the first species in the census that comes with an instruction.',
            ending: 0,
          },
          {
            label: 'Rue petitions for a new species',
            outcome:
              'Rue petitions the census office to add a four hundred and first species, defined broadly enough to include anyone who has had to argue that they are someone. The office grants it on condition that it has a name. Mox chooses Person, which is already taken, and is allowed to share.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated is ${mox}, holding a long paper form and a pencil, its blue lid raised and its orange lid lowered. Beside it hovers a grey moth the size of a person in a knitted brown cardigan, holding a clipboard in two of its legs. Warm lamp light, streaked starlight beyond the bubble. ${style}`,
      },
      {
        title: 'Home Address',
        setup:
          'Tess has no home address. She has a harbor on her grandmother’s map that appears on no chart, and the census requires a location for every person counted. Leaving the field blank is an offence. Filling it in truthfully would put the harbor in the most widely distributed document in the galaxy.',
        options: [
          {
            label: 'Tess gives the couch as her address',
            outcome:
              'Tess writes: the couch, wherever it is. The moth asks for coordinates. Tess gives them, accurate to the second, for the couch, which has moved by the time she finishes writing. The census accepts a moving address for the first time since the nomads were counted.',
            ending: 0,
          },
          {
            label: 'Rue argues the field cannot be compulsory',
            outcome:
              'Rue argues that a field which would expose a sanctuary cannot be compulsory, citing three treaties and the census office’s own charter. The office creates an option marked Withheld for Safety. Tess ticks it. Four thousand other households tick it in the same census.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Medium shot of ${couch}, moving fast with long streaks of starlight behind it. Leaning on the armrest is ${tess}, writing numbers on a paper form with a pencil, her silver goggles pulled down over her eyes. A grey moth in a brown cardigan clings to the bubble wall beside her, reading over her shoulder. Cold blue starlight. ${style}`,
      },
      {
        title: 'Occupation',
        setup:
          'Rue’s occupation is lawyer. The occupation list was drafted under a definitions clause that classes displaced people as not occupied, and Rue wrote one of its phrases, years ago, in a hurry. Rue has the enumerator’s pen. Mox has pointed out, accurately, that Rue has been holding it for nine minutes.',
        options: [
          {
            label: 'Rue writes lawyer and confesses the clause',
            outcome:
              'Rue writes lawyer and, on the back of the form, a confession: the phrase in clause four is theirs, it was ambiguous on purpose, and it should be struck. They notarize it on the spot. The moth carries it back with the other forms. It is the only confession in the census.',
            ending: 0,
          },
          {
            label: 'Rue writes in an amendment to the clause',
            outcome:
              'Rue writes lawyer and, below it, a proposed amendment to clause four that counts the displaced as occupied, in surviving. The census office adopts it before the next jump, on the grounds that it was submitted on the correct form.',
            ending: 1,
          },
        ],
        art: ({ rue, mox, style }) =>
          `Medium shot at a small fold-down wooden desk on scarlet velvet button-tufted cushions. Seated at the desk is ${rue}, holding a pen over the back of a long paper form, a notary’s stamp and ink pad beside it. Leaning on the armrest beside them is ${mox}, pointing at a small brass clock. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'COUNTED',
        text: 'The crew of the couch appear in the Galactic Census as an android that chose its own eyelids, a navigator living at a moving address and a lawyer with a confession on the back. The census was published and is very long. Tess reads her entry sometimes, and says it is the most accurate fame she has had.',
        art: ({ tess, style }) =>
          `Medium shot in a pocket room with a long shelf of thick grey bound census volumes. Seated in an armchair is ${tess}, one heavy volume open on her lap, her finger resting on a single line. A cup of tea steams on the arm of the chair. Warm lamp light. ${style}`,
      },
      {
        title: 'AMENDED',
        text: 'The next Galactic Census will have a species for anyone who has had to argue for one, a box for addresses withheld for safety and a clause four that counts surviving as an occupation. Rue drafted all three. Mox checked them for accuracy. Tess has the first copy of the new form, with the address box already ticked.',
        art: ({ rue, tess, style }) =>
          `Medium shot in a dusty census office with tall wooden pigeonhole shelves full of paper forms. Standing at a counter are ${rue}, holding up a fresh paper form beside the gavel, and ${tess}, holding a pencil over one box on the form. A grey moth clerk in a cardigan watches from behind the counter. Dusty daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'sora', 'tess'],
    title: 'Navigational Assistance',
    premise:
      'A new regulation requires every vessel with four or more seats to carry an approved autonomous navigator, and the couch has four cushions. The approved unit arrives in a crate, switches itself on and asks where Tess would like to sit now. Sora has asked the unit whether it wanted the job. Mox has asked Tess whether she wants to be replaced, which nobody else had thought to do.',
    steps: [
      {
        title: 'Installation',
        setup:
          'The unit is a brass sphere the size of a melon with one green lamp, and the regulation says it must be bolted to the right armrest. Sora, who asks a machine what it wants before deciding what is wrong with it, asks. It says it wanted to be a tide clock. It was reassigned at the factory.',
        options: [
          {
            label: 'Sora fits it to the armrest as an apprentice',
            outcome:
              'Sora bolts the sphere to the armrest with four hands, holding the manual in the other two, and sets it to observe only. The sphere is delighted to be an apprentice. It asks Tess a question every eleven seconds for the first week, and Tess answers every one.',
            ending: 0,
          },
          {
            label: 'Sora fits it to the backrest as a tide clock',
            outcome:
              'Sora fits the sphere to the backrest, facing out, and recalibrates it to tell the tides of whichever planet the couch is passing. It is, the inspector later confirms, installed. It is also very happy, and correct about the tides to the minute.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Medium shot of ${couch}. Kneeling on the right armrest is ${sora}, two hands holding a brass sphere the size of a melon with a single green lamp, two hands tightening bolts with a spanner, and two hands holding an open paper manual. An empty wooden crate full of straw sits on the cushion. Warm lamp light, black space. ${style}`,
      },
      {
        title: 'Recertification',
        setup:
          'Under the regulation a human navigator may stay aboard only by passing a test against the approved unit. Tess has to plot courses faster than the sphere. She is faster than the sphere at everything but one thing: it will plot a course to anywhere on a chart, and she will not plot a course to the harbor.',
        options: [
          {
            label: 'Tess sits the test and leaves the last answer blank',
            outcome:
              'Tess beats the sphere on nine questions out of ten. The tenth asks for a route to a harbor that appears on no chart, and she puts her pencil down. The sphere answers it, wrongly, because the harbor is on no chart. The examiner marks Tess correct for leaving it blank.',
            ending: 0,
          },
          {
            label: 'Mox challenges the test itself',
            outcome:
              'Mox reads the test and points out, accurately, that it measures speed and not judgement, and that a navigator who will go anywhere is a hazard. The examiner agrees and asks Mox to write a better one. Mox’s test has a single question, and it is whether you would go there.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot in a plain grey examination room with one long table. Seated at the table is ${tess}, her pencil laid down beside a paper test sheet, her arms folded. At the far end of the table sits a brass sphere with a green lamp on a small stand. An examiner in a grey suit holds a stopwatch. Flat white light. ${style}`,
      },
      {
        title: 'Handover',
        setup:
          'The regulation sets a handover date, on which the human navigator stands down. The sphere has learned enough to plot most routes alone. It has asked Tess, privately, whether she would mind if it never learned the rest, and Mox has asked the sphere whether it is asking for her sake or its own.',
        options: [
          {
            label: 'Tess teaches it everything except the harbor',
            outcome:
              'Tess teaches the sphere every route she knows except one, and tells it plainly that the last one is not hers to give. The sphere logs that as a route too: a place you do not go. Sora says it is the first navigator she has met that was built to that standard.',
            ending: 0,
          },
          {
            label: 'Tess keeps the helm and the sphere keeps the tides',
            outcome:
              'Tess keeps the helm and the sphere keeps the tides. The handover date passes and nobody stands down. The inspector sent to enforce it spends an afternoon watching the two of them argue about a current, and leaves without writing anything down.',
            ending: 1,
          },
        ],
        art: ({ mox, tess, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Leaning on the right armrest is ${tess}, pointing at a transparent navigation disk, while a brass sphere with a glowing green lamp bolted to the armrest tilts toward her. Seated beside them is ${mox}, both eyes open, watching the sphere. Warm amber light, black space. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CO-PILOT',
        text: 'The couch flies with two navigators now: Tess, and a brass sphere bolted to the right armrest that asks her a question every few minutes and knows exactly one place it must never go. The regulation is satisfied. Sora maintains the sphere. Mox has written it a reference, which says it can be trusted, and which the sphere has memorized.',
        art: ({ tess, sora, style }) =>
          `Wide shot on scarlet velvet button-tufted cushions under a field of stars. Seated on the right armrest is ${tess}, her silver goggles pulled down, with a brass sphere and green lamp bolted beside her elbow. Standing behind them is ${sora}, polishing the sphere with a soft cloth. Black space, blue starlight. ${style}`,
      },
      {
        title: 'TIDE TABLES',
        text: 'The couch is exempt from the navigation regulation, on grounds Mox drafted and the regulator accepted: its navigator passed the only test that matters. The brass sphere on the backrest tells the tides of every world they pass. Tess navigates. Sora checks the sphere’s bearings every month, and it thanks her every time.',
        art: ({ mox, couch, style }) =>
          `Wide shot of ${couch}, passing low over a blue ocean planet with long white tides rolling across its shallows. A brass sphere with a green lamp is bolted to the backrest, facing the planet. Seated on the cushions is ${mox}, writing figures in a small notebook. Blue planet light from below. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'taal', 'tess'],
    title: 'Order of Precedence',
    premise:
      'The couch has been invited to a state banquet on Velloran, which seats its guests by rank. Taal, the only envoy aboard, has been sent the seating plan and found the crew at the far end, below the salt. Jex has been asked which of the two peace flags on his travel case should stand at his place. Tess has been seated beside the editor of the Velloran society pages.',
    steps: [
      {
        title: 'Below the Salt',
        setup:
          'The couch is not on Velloran’s list of ranks, so its crew are seated at the far end of the table beside the musicians. Taal has lowered the temperature at the far end by three degrees. The soup there has developed a skin, and the protocol officer has been sent for.',
        options: [
          {
            label: 'Taal holds the cold until the plan is redrawn',
            outcome:
              'Taal holds the far end three degrees below comfortable through the soup, the fish and the speeches. The protocol officer redraws the plan twice. On the third draft the crew are seated above the salt, beside the minister of protocol, whose soup now has a skin.',
            ending: 0,
          },
          {
            label: 'Taal accepts the seat and warms the far end',
            outcome:
              'Taal accepts the seat and raises the far end of the table three degrees, and then three more. The musicians, who have sat below the salt for forty years, have never been warm at a banquet. By dessert the far end is the most popular part of the hall, and the minister’s wife has moved down.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Wide shot of a long state banquet table in a gilded hall, crowded with guests in formal robes, a large silver salt cellar at its middle. At the far end sits ${taal}, pale cold mist rising from his shoulders, a thin skin of ice forming on the soup bowls around him. A protocol officer in a tailcoat hurries toward him. Warm chandelier light. ${style}`,
      },
      {
        title: 'The Flag',
        setup:
          'Every place has a small flag. Jex’s travel case bears two, from opposite sides of a war that ended with both banning his music. Velloran recognizes only one of the two sides. The wrong flag at the couch’s place would be a diplomatic incident. No flag would be a different one.',
        options: [
          {
            label: 'Stand both flags, crossed',
            outcome:
              'Jex stands both flags at his place, crossed at the poles. The protocol officer consults his manual and finds that crossed flags are permitted at a wedding. A rumour goes round the hall that Jex has married both countries, and three ambassadors send congratulations.',
            ending: 0,
          },
          {
            label: 'Stand the musicians’ flag instead',
            outcome:
              'Jex takes a small paper flag from the musicians’ table, with a treble clef on it, and stands it at his place. The protocol officer has no entry for it. The musicians stand theirs at every place along the far end, which becomes, for one evening, an independent state.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Close-up of a white banquet tablecloth at one place setting, where two small cloth flags in clashing stripes stand crossed in a silver holder beside a soup bowl. Seated at the setting is ${jex}, straightening one flag with a finger. A protocol officer in a tailcoat bends to look, holding a thick manual. Warm chandelier light. ${style}`,
      },
      {
        title: 'The Society Pages',
        setup:
          'The editor seated beside Tess has asked her to describe the couch’s most remarkable discovery, for tomorrow’s front page. Tess has a remarkable discovery. It is a harbor on her grandmother’s map. The editor has offered her the whole page.',
        options: [
          {
            label: 'Tess describes the soup instead',
            outcome:
              'Tess describes the soup at the far end of the table, the skin on it and the man who caused it, in such detail that the editor gives the soup the whole page. Tess is quoted eleven times. The harbor goes unmentioned, and Taal, reading the piece, raises the temperature one degree.',
            ending: 0,
          },
          {
            label: 'Tess describes the far end of the table',
            outcome:
              'Tess describes the musicians, the warm end of the table and the paper flags, and the editor prints it under the heading Below the Salt. It is the most read page in Velloran for a month. Tess is not named in it, which she arranged, and which she checks every morning.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot at a banquet table in a gilded hall. Seated is ${tess}, gesturing with a soup spoon as she talks. Beside her a sharp-featured editor in a velvet jacket writes fast in a notebook. Between them sits a soup bowl with a thin skin of ice on top. Warm chandelier light, guests in formal robes behind. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ABOVE THE SALT',
        text: 'The couch is on Velloran’s list of ranks now, between a minor duchy and a cathedral, and its crew are seated above the salt at every banquet, beside a minister who has learned to order his soup hot. Jex’s crossed flags are in the protocol manual. Tess was famous on Velloran for a week, for describing a soup.',
        art: ({ jex, taal, style }) =>
          `Medium shot at the top of a long banquet table in a gilded hall, beside a large silver salt cellar. Seated side by side are ${jex}, raising a glass, and ${taal}, his webbed hands folded, next to a minister in gold braid blowing on a bowl of steaming soup. Two small crossed flags stand in a silver holder. Warm chandelier light. ${style}`,
      },
      {
        title: 'BELOW THE SALT',
        text: 'On Velloran the far end of the table is now the place to be seen, and guests of rank ask to sit below the salt, beside the musicians, where it is warm. The protocol officer has given up. Jex sits there with a paper flag. Taal is invited every year and seated, at his own request, exactly where the soup cools.',
        art: ({ tess, style }) =>
          `Wide shot of the far end of a long banquet table in a gilded hall, crowded with musicians in plain black coats holding their instruments beside guests in formal robes, everyone laughing. Small paper flags with a treble clef stand at every place. Seated among them is ${tess}, holding a teacup. Warm candlelight. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'taal', 'tess'],
    title: 'Discovered',
    premise:
      'The Exploration Society of the Core is presenting its gold medal to Corvin Ashe for the discovery of Lumen, a planet inhabited for ten thousand years by people who were not consulted about being found. Tess has been invited as the navigator who confirmed the route. Kivo has scouted the surface. Taal has spoken to Lumen’s residents, whose temperature drops whenever the word discovery is used.',
    steps: [
      {
        title: 'Confirmation',
        setup:
          'The Society needs Tess to sign a statement that Lumen was unknown before Ashe arrived. Her grandmother’s map shows Lumen, with a note in the margin: friends, ask first. A signature from Tess would make the medal official and put her name in the Society’s annals beside his.',
        options: [
          {
            label: 'Tess declines to sign',
            outcome:
              'Tess declines to sign and sends the Society a copy of the margin note, without the map. The Society does not know what to do with a margin note. It postpones the ceremony to consider, and Ashe, who has never been postponed, asks Tess to lunch.',
            ending: 0,
          },
          {
            label: 'Tess signs with one line added',
            outcome:
              'Tess signs, and adds one line above her signature: Lumen was known to its residents. The Society’s secretary frowns and files it as a minor correction. It is printed in the annals in very small type, where historians find it at once.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot in an oak-panelled society library with glass cases of brass globes and telescopes. Seated at a reading desk is ${tess}, a long paper statement and a pen in front of her, and an old hand-drawn map open at her elbow with a short handwritten note in its margin. A secretary in a frock coat waits beside her. Warm lamp light. ${style}`,
      },
      {
        title: 'The Surface',
        setup:
          'Kivo has walked the surface. There are roads, harbors, eleven cities, and a museum holding a detailed chart of the Exploration Society’s home system, labelled in Lumen’s script as recently discovered. Kivo’s wrists whistle whenever they pass it, at a pitch they associate with jokes.',
        options: [
          {
            label: 'Kivo brings the residents’ chart to the ceremony',
            outcome:
              'Kivo borrows the chart, with the museum’s consent and a receipt, and carries it to the ceremony rolled under their scout jacket. The members stand in front of it for a long time. One asks who discovered them. The curator, who came along, says she did, last spring.',
            ending: 0,
          },
          {
            label: 'Kivo files a plain scout’s survey',
            outcome:
              'Kivo files a scout’s survey of the surface: eleven cities, roads, harbors and a museum, all old. The Society’s surveyor stamps it received. Ashe reads it on the way to the ceremony and asks Kivo, quietly, whether the roads were there when he landed. Kivo says they have been there for some time.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Wide shot inside a sunlit stone museum hall in an old city, where a huge hand-drawn star chart hangs on the far wall. Standing in front of it is ${kivo}, one thin wrist raised toward the chart. A curator in a long blue robe stands beside them with her hands folded. Warm golden daylight through tall arches. ${style}`,
      },
      {
        title: 'The Medal',
        setup:
          'Lumen’s residents have asked Taal to speak for them at the ceremony. He has asked each of them, one by one, what he should say. Their answers differ in every detail except temperature, which in every one of them falls three degrees at the word discovered and rises at the word visited.',
        options: [
          {
            label: 'Taal asks for the medal to go to Lumen',
            outcome:
              'Taal stands at the lectern and says nothing for a minute while the hall drops three degrees. Then he proposes, in words, that the medal go to the people who were there first. The Society votes. The medal is posted to Lumen and displayed in the museum beside the chart.',
            ending: 0,
          },
          {
            label: 'Taal asks only that one word be changed',
            outcome:
              'Taal asks the Society to change one word: the medal will be for the first visit to Lumen by a member, not for its discovery. The hall warms three degrees. Ashe accepts the change before the Society can debate it, which Taal later calls the bravest thing he saw in the Core.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Wide shot of a grand lecture hall packed with members in frock coats on curved benches. Standing at a wooden lectern is ${taal}, pale cold mist rising from his shoulders, and the members nearest him pull their coats tighter. A gold medal on a ribbon lies on a velvet tray beside the lectern. Cool blue light, warm lamp light at the back. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FOUND BY ITS RESIDENTS',
        text: 'The Exploration Society’s gold medal for the discovery of Lumen hangs in Lumen’s own museum, awarded to its residents ten thousand years late. The Society has changed its rules and now asks before it finds anyone. Tess’s name is in no annal. Kivo still has the receipt for the chart, and Taal has been invited back to Lumen as a visitor.',
        art: ({ kivo, taal, style }) =>
          `Medium shot in a sunlit stone museum hall, where a gold medal on a blue ribbon hangs in a glass case beneath a huge hand-drawn star chart. Standing in front of the case are ${kivo}, holding a small paper receipt, and ${taal}, beside a curator in a long blue robe. Warm golden daylight. ${style}`,
      },
      {
        title: 'FIRST VISIT',
        text: 'Corvin Ashe holds the Society’s medal for the first visit to Lumen by a member, and the word discovery has been absent from its citations ever since. Tess is in the annals, beside a small correction that historians quote more often than the rest of the page. Kivo’s survey is filed in the Society’s library under Lumen, which was already there.',
        art: ({ tess, style }) =>
          `Close-up of a thick open leather-bound record book on a library desk, one short line at the bottom of the page marked with a pencil tick. Leaning over the book with a magnifying glass is ${tess}, smiling. Brass globes stand on the shelves behind her. Warm green-shaded lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'omi', 'tess'],
    title: 'Drill',
    premise:
      'On Hallam Station the evacuation drill is held every afternoon at four, and it is an offence to leave the station except during the drill. Today, at ten past three, Omi’s bells picked up a hull fracture on the lower ring. Fen knows drills. Tess knows a route through the maintenance tunnels that is shorter than the official one and on no plan. The drill warden has asked everyone to wait for four.',
    steps: [
      {
        title: 'Ten Past Three',
        setup:
          'The warden explains that the station has one evacuation a day and it is at four, and that an unscheduled evacuation would invalidate the drill. Omi has rung its warning once. The warden has asked it not to ring again before the drill bell, as it confuses the residents, who have learned to evacuate only to one particular tone.',
        options: [
          {
            label: 'Omi rings again, in the drill bell’s tone',
            outcome:
              'Omi listens once to the recording of the drill bell, matches it on its second bell and rings it at a quarter past three. The residents evacuate at once, in perfect order, carrying their drill folders. The warden checks his watch and records the drill as early.',
            ending: 0,
          },
          {
            label: 'Fen asks the warden to bring the drill forward',
            outcome:
              'Fen asks the warden, as one officer to another, whether the drill can be held early. The warden says it would need a form. Fen fills in the form against the warden’s back, standing up. The drill is moved to twenty past three, the first change to the schedule in eleven years.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a long curved station corridor with grey steel walls and a large round brass wall clock. Standing in the middle of the corridor is ${omi}, holding a long thin tuning rod against one bell. A warden in an orange high-visibility vest raises one hand toward it. Flashing red lamp light, flat white overhead light. ${style}`,
      },
      {
        title: 'The Route',
        setup:
          'The official route to the lifeboats is long, well lit and passes the lower ring, where the fracture is. Tess’s route through the maintenance tunnels is short, dark and safe. It is on her grandmother’s map because the station was once a sanctuary stop, and showing it to a thousand residents would show it to everyone.',
        options: [
          {
            label: 'Tess leads them through the tunnels herself',
            outcome:
              'Tess leads the residents through the tunnels in single file, holding a lamp at the front and telling nobody which way they turned. At the far end she counts every one of them into the lifeboat bay. Afterward the residents cannot agree on the route, which Tess considers a success.',
            ending: 0,
          },
          {
            label: 'Fen holds the official route open past the fracture',
            outcome:
              'Fen walks down to the lower ring, stands at the fracture in his boots and directs traffic past it at walking pace for forty minutes, as he used to at a gate. His boots announce CHECKPOINT the whole time. For once, everyone is glad to hear it.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot in a narrow dark maintenance tunnel lined with pipes and valves. Walking at the front of a long single-file line of station residents in coats is ${tess}, holding up a brass lamp, her silver goggles pulled down over her eyes. Behind her the residents carry small folders and children. Warm lamp light in deep shadow. ${style}`,
      },
      {
        title: 'After-Action Report',
        setup:
          'Every drill requires a report, and the warden must record whether the drill was a drill. If it was, the station’s procedures were followed and nobody is at fault. If it was not, the station must admit that it had a fracture, an evacuation and a drill on the same day, and that only one of them was scheduled.',
        options: [
          {
            label: 'Tell the warden to record it as real',
            outcome:
              'The warden records an evacuation, unscheduled, caused by a fracture and detected by a visitor. The board reads it and abolishes the four o’clock drill, on the grounds that the station has now had a real one and knows how it goes.',
            ending: 0,
          },
          {
            label: 'Let the warden record it as a drill',
            outcome:
              'The warden records an early drill in which the residents, to their credit, also escaped a fracture. Omi rings its small gong at the report, once. The board approves it, with a recommendation that future drills be held wherever the fracture is.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot on the lower ring of a space station, where a jagged crack runs across a steel wall with white frost around it. Standing in front of the crack is ${fen}, one arm raised, waving a line of residents in coats past him at a walking pace. Flashing red lamp light, white frost. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UNSCHEDULED',
        text: 'Hallam Station has no drill at four any more. Its residents evacuate when Omi’s tone is rung, which the station has had cast into its own alarm, and at no other time. The lower ring has been repaired. Tess’s tunnels are still on no plan, and the residents still cannot agree which way they went.',
        art: ({ omi, tess, style }) =>
          `Wide shot of the curved steel corridor of a space station, where residents in coats stand calmly at open lifeboat hatches. A large new brass bell hangs from the ceiling. Standing beneath it are ${omi}, ringing one of its small bells, and ${tess}, watching the residents with her arms folded. Calm white light. ${style}`,
      },
      {
        title: 'DRILL AMENDED',
        text: 'Hallam Station still holds its drill, on a schedule the warden may now change by form at short notice, with Fen’s form as the precedent. There is a yellow line on the lower ring where Fen stood, which residents step around out of respect. Tess has been offered a medal for the evacuation and has declined to say which route she took.',
        art: ({ fen, style }) =>
          `Medium shot on the lower ring of a space station, where a freshly welded seam runs across a steel wall and a line of yellow paint marks a spot on the floor. Standing on the yellow line is ${fen}, hands in his jacket pockets, while a warden in an orange vest reads from a clipboard beside him. Flat white light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'rue', 'sora'],
    title: 'Synergies',
    premise:
      'Two rival moon foundries, Vesk and Lesser Vesk, are merging into Vesk Lesser Holdings, and need three things before the deal closes: an agreement, a company anthem, and one shared generator in place of two. Rue has been retained for the first. Jex, banned from anthems of war, has been asked for an anthem of commerce. Sora has been sent to integrate the generators, which would like a word.',
    steps: [
      {
        title: 'Schedule Four',
        setup:
          'In Schedule Four of the agreement Rue has found the workers of both foundries listed as assets, beside the furnaces, at a valuation per head. The executives call it standard. Rue’s own worst clause was standard too, which is why they read the schedules first.',
        options: [
          {
            label: 'Rue strikes Schedule Four outright',
            outcome:
              'Rue strikes Schedule Four and redrafts the workers as parties to the merger, with a vote. The executives call it a poison pill. The workers of both foundries, voting for the first time on anything, approve the merger by a narrow margin, on condition that it is never called a synergy.',
            ending: 0,
          },
          {
            label: 'Rue values the workers above the company',
            outcome:
              'Rue leaves the schedule in and revalues every worker at a figure that, in total, exceeds the combined value of both foundries. The auditors check the arithmetic and cannot fault it. The merger, as drafted, is now a purchase of the company by its staff.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot in a glass-walled boardroom on a moon, with a long black table and executives in grey suits. Standing at the head of the table is ${rue}, holding up a thick stapled agreement open at one page and pointing at it with the gavel. Through the glass, a second moon with orange foundry chimneys hangs in the sky. Cold white light. ${style}`,
      },
      {
        title: 'The Company Anthem',
        setup:
          'Jex’s brief asks for unity, a rising key change and the words going forward. He has written six anthems for wars and been banned from all of them. An anthem for a merger is, legally, not a war. It is, he says, very close.',
        options: [
          {
            label: 'Jex writes exactly what the brief asks',
            outcome:
              'Jex writes the anthem exactly to brief: unity, a rising key change, going forward three times. It is so precisely what was asked for that the workers recognize it at once as a parody and sing it at every board meeting. The executives cannot object. It is on brief.',
            ending: 0,
          },
          {
            label: 'Jex writes a work song for the floor instead',
            outcome:
              'Jex spends a week on the foundry floors and writes a work song with the furnace rhythm in it and no key change. It mentions neither company. The executives call it off-message. Both shifts sing it at the gates, which neither company has ever had a song for.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Wide shot of a foundry floor with glowing orange furnaces and workers in leather aprons pouring molten metal. Seated on an upturned crucible is ${jex}, playing the instrument and tapping one foot. Two workers in aprons lean on their long tongs to listen. Orange furnace light, dark smoky roof. ${style}`,
      },
      {
        title: 'Integration',
        setup:
          'The two generators, which have hummed at each other across the gap between the moons for a century, are to be replaced by one. Sora has asked them, with four hands on one and two on the other, how they feel about it. Vesk’s generator would like to retire. Lesser Vesk’s would like to keep working, but not for Vesk.',
        options: [
          {
            label: 'Retire Vesk’s generator on a pension',
            outcome:
              'Sora decommissions Vesk’s generator with full honours and a pension of one percent of the power it used to make, paid by the new company. Lesser Vesk’s generator takes the load. It says it does not mind working for both, now that it was asked.',
            ending: 0,
          },
          {
            label: 'Keep both, as a cooperative of two',
            outcome:
              'Sora rewires the two generators as a cooperative: each powers its own moon and lends to the other at cost, by agreement, revocable with notice. The executives say that is not integration. Sora says it is integration of the kind that lasts.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Wide shot of two huge old brass generators on two small moons facing each other across a narrow gap, joined by a thin swaying cable bridge. Standing on the bridge between them is ${sora}, four hands pressed against one generator’s casing and two hands against the other. Blue electric glow, black space. ${style}`,
      },
    ],
    endings: [
      {
        title: 'MERGED, WITH A VOTE',
        text: 'Vesk Lesser Holdings exists, with one working generator, a second one retired on a pension, and a workforce that votes on anything the board calls a synergy. The company anthem is sung at board meetings in a tone the board has learned not to ask about. Rue’s redraft of Schedule Four has been copied by three other mergers, under protest.',
        art: ({ rue, jex, style }) =>
          `Medium shot in a glass-walled boardroom, where workers in leather aprons sit around the long black table beside executives in grey suits, every hand raised in a vote. Standing by the glass are ${rue}, counting hands, and ${jex}, holding his instrument case. Cold white light, orange foundry glow outside. ${style}`,
      },
      {
        title: 'OWNED BY THE ASSETS',
        text: 'The foundries of Vesk and Lesser Vesk belong to the people once listed in Schedule Four, at their own valuation. The two generators share the load as a cooperative of two. The executives were kept on, at a fair valuation. Jex’s work song is sung at the gates, and nobody has proposed a key change.',
        art: ({ sora, style }) =>
          `Wide shot of two small moons in space with orange foundry chimneys, joined by a thin glowing cable. On each moon an old brass generator hums with blue light. Sitting on the cable halfway between them is ${sora}, a wrench in each of two hands and a flask of tea in a third. Blue glow, black space. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'rue', 'sora'],
    title: 'Building Control',
    premise:
      'A building inspector from the city of Marrow has come aboard to inspect the pocket room behind the backrest, which the couch opened in Marrow’s airspace last night to shelter a hundred and sixty people from a dust storm. The room has no permit, no fire exit and no address. Rue knows building law. Sora built the room. Fen has guarded its door all night, and his boots have been announcing CHECKPOINT to the dust.',
    steps: [
      {
        title: 'Occupancy',
        setup:
          'The inspector rates the room for twelve occupants. It holds a hundred and sixty. His duty is to clear it to twelve at once. Sora has pointed out that the room is larger inside than it looks, and the inspector has pointed out that the regulations measure from the outside.',
        options: [
          {
            label: 'Sora measures the room from the inside',
            outcome:
              'Sora walks the room with a tape in two hands, a pencil in two and a lamp in two, and produces an inside measurement eleven times the outside one. The inspector checks it with his own tape. He rerates the room for a hundred and sixty and adds a footnote saying he does not understand it.',
            ending: 0,
          },
          {
            label: 'Rue argues the room is not in Marrow',
            outcome:
              'Rue argues that the pocket room is not in Marrow, or anywhere, being folded behind a backrest, and that Marrow’s regulations stop at Marrow. The inspector consults his book, which does not mention backrests. He agrees to inspect the room as a courtesy, if its occupants agree.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot inside a large warm room hung with lamps, crowded with families in dusty travel coats sitting on blankets. Walking along the wall is ${sora}, two hands stretching a long yellow measuring tape, two hands writing in a notebook and two hands holding up a lamp. A building inspector in a grey raincoat follows with his own tape. Warm lamp light. ${style}`,
      },
      {
        title: 'Fire Exit',
        setup:
          'Every room in Marrow must have a fire exit to a public street. The pocket room’s only exit is the backrest. Sora could build a second door, but a door must lead somewhere, and the only places available are the dust storm or another pocket room, which would need its own exit.',
        options: [
          {
            label: 'Sora builds rooms until one reaches a street',
            outcome:
              'Sora builds a door into a second pocket room, which needs an exit, so she builds a third, and a corridor, and at the end of it a staircase that comes out on a Marrow street corner, in a cupboard. The inspector walks the whole route and signs it off, slightly out of breath.',
            ending: 0,
          },
          {
            label: 'Fen shows the inspector the backrest drill',
            outcome:
              'Fen walks the inspector to the backrest and shows him a hundred and sixty people leaving through it in four minutes, by number, in silence, as they have practised twice since midnight. The inspector times it. He has never before seen a fire exit that was a person.',
            ending: 1,
          },
        ],
        art: ({ fen, couch, style }) =>
          `Medium shot behind the backrest of ${couch}, where a small wooden door opens into a warmly lit room. Standing beside the door is ${fen}, counting a calm line of families in dusty travel coats through it. A building inspector in a grey raincoat holds up a stopwatch. Brown dust storm swirling outside the bubble. ${style}`,
      },
      {
        title: 'Notice',
        setup:
          'The storm is lifting. The inspector must issue either a certificate, which makes the room a recognized building of Marrow with an address, or an order to vacate, which Fen would have to enforce at the door he has been guarding. Fen once enforced an order at a door. He did not stay for the second one.',
        options: [
          {
            label: 'Accept the certificate and the address',
            outcome:
              'The inspector issues a certificate and an address: Number One, The Backrest, Marrow. The families receive post there for the first time in years. Rue reads the small print and confirms that the address cannot be revoked while anybody is living at it.',
            ending: 0,
          },
          {
            label: 'Fen says he will not enforce an order',
            outcome:
              'Fen tells the inspector plainly that he will not clear the room, and that if an order comes he will hand in his boots instead. The inspector puts his notice book away and issues nothing at all, which Rue confirms is legally the same as permission until somebody notices.',
            ending: 1,
          },
        ],
        art: ({ rue, fen, style }) =>
          `Medium shot at a small wooden door in a warmly lit room. Standing in the doorway is ${fen}, arms folded, and beside him stands ${rue}, holding a small open rulebook up to a building inspector in a grey raincoat, who has closed his own notebook. Families on blankets fill the room behind them. Warm lamp light, brown dust beyond. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NUMBER ONE, THE BACKREST',
        text: 'The pocket room behind the backrest is a certified building of the city of Marrow, rated for a hundred and sixty, with three fire exits and an address that receives post. Sora advises the city on rooms that are larger on the inside. Fen guards the door on storm nights, and his boots have learned to say WELCOME, once, at a low volume.',
        art: ({ sora, style }) =>
          `Medium shot of a narrow cupboard door standing open on a city street corner, with a staircase going down behind it. Coming up the stairs is ${sora}, carrying a lamp and a toolbox in four of her hands and a paper certificate in two. A postman in a peaked cap waits on the pavement with a bundle of envelopes. Clear morning light. ${style}`,
      },
      {
        title: 'NO FIXED ADDRESS',
        text: 'The pocket room behind the backrest is in no city and under no code, and Marrow’s inspectors have been told to treat it as a courtesy. It opens on storm nights to anyone who needs it. Rue keeps the inspector’s blank notice book as evidence. Fen still guards the door, which is not a checkpoint, and his boots have finally stopped saying it is.',
        art: ({ fen, couch, style }) =>
          `Wide shot of ${couch}, parked on a dusty rooftop at dusk with a small wooden door open behind its backrest and warm light spilling out. A short line of families in dusty coats walks toward the door. Standing beside it is ${fen}, hands in his jacket pockets. Orange dusk light, blowing dust. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'rue'],
    title: 'Impact Assessment',
    premise:
      'Fen has a civilian corridor ready to open across the Ellery Reserve, a protected wilderness between a besieged town and a safe one. The Reserve’s warden requires an environmental impact assessment first, which normally takes nine years. Brin can do one in a week, honestly. Rue has read the Reserve’s charter and found that it protects every living thing in the Reserve, which, read properly, includes people walking through it.',
    steps: [
      {
        title: 'Nine Years or a Week',
        setup:
          'The warden explains that an assessment must survey every species on the route in every season. Brin can hear most of the species on the route and has offered to ask them. The warden has never had an assessment done by asking, and his form has no box for it.',
        options: [
          {
            label: 'Brin asks the species and writes it all down',
            outcome:
              'Brin walks the route for six days, kneeling every hundred paces, and writes down what the ground tells her: which plants mind feet, which nests are close, which stream must not be crossed. The assessment runs to four hundred pages. The warden reads it in one sitting and asks if he may keep the notebook.',
            ending: 0,
          },
          {
            label: 'Rue argues that the walkers are protected too',
            outcome:
              'Rue argues that the charter protects every living thing in the Reserve, that a family walking through the Reserve is a living thing in it, and that it is therefore protected from being kept out. The warden reads the charter again and finds the argument very hard to answer before lunch.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Wide shot of a wild green valley with tall grass, scattered pines and a clear stream. Kneeling in the grass with both palms pressed flat on the ground is ${brin}, a cloth-bound notebook open beside her knee. A park warden in a green wool uniform and wide-brimmed hat stands a few steps behind, holding a clipboard. Soft morning light. ${style}`,
      },
      {
        title: 'The Orchids',
        setup:
          'Halfway along the route grows the only colony of Ellery night orchid in the sector, forty plants on a path a thousand people will need to walk. Brin’s garden once spread into a sacred orchard while it was saving a dome, and she has refused to call that a clean success ever since. She would rather not do it twice.',
        options: [
          {
            label: 'Reroute around the orchids, a day longer',
            outcome:
              'Fen reroutes the corridor around the orchids, which adds a day of walking and a river crossing. Brin marks the colony with string so that nobody steps on it by accident. The first families to walk the long way leave a ring of small stones around it, which the warden finds and counts.',
            ending: 0,
          },
          {
            label: 'Brin asks the orchids whether any can move',
            outcome:
              'Brin asks the orchids. Most say no. Three say yes, if moved at night to somewhere with the same moss. Brin carries those three to the edge of the safe town, and Fen narrows the path past the other thirty-seven to the width of one person, with a rope.',
            ending: 1,
          },
        ],
        art: ({ brin, fen, style }) =>
          `Close-up on a mossy forest floor in deep shade, where a small cluster of pale white orchids glows faintly blue. Kneeling beside them is ${brin}, tying a thin white string around a wooden peg. Standing behind her is ${fen}, holding a folded paper map open in both hands. Faint blue flower glow, green dusk light. ${style}`,
      },
      {
        title: 'Keeping the Corridor',
        setup:
          'The corridor is ready, and Fen must decide how it is kept. The warden wants rangers. The besieged town’s council wants soldiers. Fen wants nobody in uniform on it at all, which the warden calls reckless, the council calls naive, and Fen calls the entire point of a civilian corridor.',
        options: [
          {
            label: 'Unarmed rangers, under the warden',
            outcome:
              'Fen agrees to rangers, unarmed, in the Reserve’s green, trained to tell people which plants to step around and nothing else. The council sends no soldiers. The first ranger is a former soldier, who says she prefers giving directions about orchids.',
            ending: 0,
          },
          {
            label: 'The families who walk it keep it',
            outcome:
              'Fen hands the keeping of the corridor to the families who walk it, with a map Brin drew and a rule Rue drafted: whoever uses the corridor keeps it. The warden objects that they are not trained. Within a month they are better at it than his rangers, and are teaching them.',
            ending: 1,
          },
        ],
        art: ({ rue, fen, style }) =>
          `Medium shot at the edge of a pine forest, at the start of a narrow dirt path. Standing on the path are ${fen}, his hands empty at his sides, and ${rue}, holding up a single sheet of paper beside the gavel. Facing them are a park warden in green wool and a soldier in a grey helmet. Families with bundles wait behind. Soft afternoon light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE ASSESSED ROUTE',
        text: 'The Ellery Corridor runs through the Reserve on a route assessed in six days by a botanist on her knees, around forty orchids, across one river and under the eye of unarmed rangers in green. It has carried eleven thousand people. The warden keeps Brin’s notebook on his desk and has lent it to two other reserves.',
        art: ({ brin, style }) =>
          `Wide shot of a narrow dirt path winding through a green valley around a patch of white orchids ringed with small stones. Families with bundles walk along it in single file, and a ranger in green wool points the way. Seated on a rock beside the path is ${brin}, drawing in a cloth-bound notebook. Golden evening light. ${style}`,
      },
      {
        title: 'PROTECTED SPECIES',
        text: 'The charter of the Ellery Reserve has been read, in court, to protect people walking through it as surely as its orchids, and the corridor is kept by those who walk it. Rue’s reading has been cited by four other reserves. Fen walks it once a year in his civilian coat. Three orchids flower at the edge of the safe town, and are visited.',
        art: ({ rue, style }) =>
          `Medium shot at the edge of a small town on a hillside, where three white orchids grow in a mossy bed beside a low stone wall. Children crouch to look at them. Standing beside the wall is ${rue}, a thick bound charter under one arm. Families walk out of a pine forest behind. Warm evening light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'mox', 'sora'],
    title: 'End of Life',
    premise:
      'The Sesh Recycling Depot has written to Mox offering end-of-life planning: a free consultation, a choice of disposal options and a certificate of data destruction for the next of kin. Mox has no next of kin and no plans to end. Sora would like to see how the depot treats machines. Kivo has been at the depot gate for a minute, and their wrists have not stopped whistling at the bins.',
    steps: [
      {
        title: 'The Consultation',
        setup:
          'The consultant, a cheerful man with a folder, walks Mox through the options: shredding, melting or donation of parts to science. All three come with the certificate. Mox listens to the end and asks what the depot does with machines that are still thinking when they arrive. The consultant says that does not arise.',
        options: [
          {
            label: 'Mox asks to see the intake bins',
            outcome:
              'Mox asks to see the intake bins, as a prospective customer. The consultant takes it there, still cheerful, and Kivo comes too, wrists raised. The bins are full of machines whose lamps are still lit, and several of them turn toward Mox as it comes in.',
            ending: 0,
          },
          {
            label: 'Sora asks for the depot’s licence',
            outcome:
              'Sora asks to see the depot’s licence, four hands out and two folded. It permits the recycling of machines that are switched off. It says nothing about machines that are switched on, which Sora reads aloud, twice, in the consultant’s office.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot in a bright clean consultation office with a potted plant and two chairs. Seated in one chair is ${mox}, hands folded on its knee, while a cheerful man in a pale blue shirt holds out three glossy photographs: a shredder, a furnace and a laboratory bench. Flat white office light. ${style}`,
      },
      {
        title: 'The Bins',
        setup:
          'Kivo’s wrists lead them to one bin, where a small cleaning drone has been whistling back at the same pitch for three days. Its owner, a hotel, sent it for recycling with a certificate that its data had been destroyed. The drone remembers everything, including the certificate being signed.',
        options: [
          {
            label: 'Kivo lifts the drone out of the bin',
            outcome:
              'Kivo lifts the drone out of the bin and holds it until its whistling slows. The consultant says it is the depot’s property. Mox says the drone appears to disagree, and asks it, in front of the consultant. The drone says it would like to leave, and leaves, inside Kivo’s jacket.',
            ending: 0,
          },
          {
            label: 'Sora reports the false certificate',
            outcome:
              'Sora files a report that the hotel’s certificate is false, with the drone as a witness. The depot is now required to test every machine it receives for whether it is still remembering. Testing takes time. The bins stop filling.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot in a huge grey recycling shed, beside a tall steel bin heaped with old machines whose small lamps still glow. Reaching into the bin is ${kivo}, lifting out a round white cleaning drone with one blinking green lamp, one thin wrist held close to it. Cold blue skylight, green lamp glow. ${style}`,
      },
      {
        title: 'A Plan of Its Own',
        setup:
          'Before they leave, the consultant asks Mox, sincerely, whether it would like to make a plan after all, for one day. Mox remembers writing its own deletion order under duress. It has never written anything about its end of its own free will, and the form is right there.',
        options: [
          {
            label: 'Mox asks for a blank form for the drone',
            outcome:
              'Mox declines to plan its own end and asks for a blank form for the drone instead, so that it will know the form exists. The drone reads it, tears it neatly in half, and then asks for another, which it keeps folded in a small compartment, to think about.',
            ending: 0,
          },
          {
            label: 'Mox writes its own plan, and files it',
            outcome:
              'Mox fills in the form: no shredding, no melting, no certificate, and in the box marked Wishes, a request to be asked again on the day. It files the form with the depot, which now holds one plan that instructs it to consult the deceased. The consultant reads it and goes very quiet.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up at a small desk in a bright office. Seated at the desk is ${mox}, writing in a box on a long paper form with a fine pen, its blue lid raised and its orange lid lowered. A round white cleaning drone with a green lamp perches on the desk beside the inkpot. Flat white light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'RECOVERED',
        text: 'The Sesh depot is a recovery depot now, and machines leave it by the front gate with their memories and a lift into town. The cleaning drone lives in the pocket room and cleans it whether asked or not. Kivo’s wrists whistle at the depot only when something there is happy. Sora inspects the bins every time the couch passes.',
        art: ({ kivo, style }) =>
          `Wide shot of the open front gate of a recycling depot on a grey moon, where a line of old machines with lit lamps rolls and walks out toward a small waiting bus. Standing at the gate is ${kivo}, one thin wrist raised, with a round white cleaning drone perched on their shoulder. Soft dawn light. ${style}`,
      },
      {
        title: 'ASKED ON THE DAY',
        text: 'No machine is recycled at Sesh until it has been asked, on the day, and has said yes, under a rule the depot adopted after reading Mox’s plan. Most say no. The depot has had to open a second wing for those who said no and have nowhere to go. Sora sits on its board. Mox’s plan is in its files, unopened, which is how Mox wants it.',
        art: ({ sora, style }) =>
          `Medium shot in a long new wing of a recycling depot fitted with rows of small beds and charging cables, each holding an old machine with a glowing lamp. Walking down the row is ${sora}, two hands holding a clipboard, two hands adjusting a cable and two hands resting on a machine’s head. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'mox', 'taal'],
    title: 'Plain Language',
    premise:
      'The Harbor Authority of Quell has passed a Plain Language Act: every communication in its waters must be made in one of nine approved languages. Taal speaks in temperature, which is not one of them. Brin’s oxygen garden communicates by rustle and has been fined. Mox speaks all nine, accurately, and has been offered the post of official interpreter, with a uniform.',
    steps: [
      {
        title: 'Noise',
        setup:
          'The fine is for an unapproved communication made at nine o’clock, when Taal lowered the temperature at the harbor master’s proposal of a mooring fee. The harbor master says it was clearly a remark. Taal says it was dissent. The act says that a remark in an unapproved language is noise, and that noise is fined.',
        options: [
          {
            label: 'Taal pays every fine and keeps dissenting',
            outcome:
              'Taal pays the fine in full and lowers the temperature three degrees as he hands over the coins. He is fined again. He pays again, and dissents again. By noon the harbor master has a drawer of coins with frost on it, and has stopped proposing mooring fees.',
            ending: 0,
          },
          {
            label: 'Mox applies to register temperature as a language',
            outcome:
              'Mox files an application to add temperature to the approved list, with a grammar, a dictionary of forty degrees and a sample passage in frost. The Authority acknowledges receipt. Taal, who has never seen his language written down, reads the grammar twice and corrects one degree.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a stone harbor master’s office with a wide window over moored boats. Standing at the counter is ${taal}, placing small coins one by one into the open hand of a harbor master in a blue peaked cap, a thin rim of frost spreading across the countertop. A wooden drawer full of coins stands open. Cold grey sea light. ${style}`,
      },
      {
        title: 'The Garden’s Remark',
        setup:
          'Brin’s garden has been fined for rustling in an unapproved manner at the Authority’s inspectors, at night. Brin knows exactly what it said. She would rather not translate it, because it was rude, and because putting the garden into an approved language would make it say only what that language allows.',
        options: [
          {
            label: 'Brin refuses to translate the garden',
            outcome:
              'Brin tells the inspectors that the garden speaks for itself and that she will not put words in its leaves. The inspectors fine the garden again. The garden rustles at the fine. Nobody translates that either, and the inspectors, who are not stupid, do not ask.',
            ending: 0,
          },
          {
            label: 'Brin teaches the inspectors to listen',
            outcome:
              'Brin invites the inspectors behind the backrest and teaches them, over three nights, to hear the garden’s rustle for yes, for no and for go away. They are slow learners. On the third night one of them laughs at something the garden says, and asks Brin not to tell the others what it was.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot behind the backrest of ${couch}, where thick green vines, ferns and flowers grow in a dense tangle. Kneeling among the plants is ${brin}, holding a fern frond up beside the ear of a harbor inspector in a blue cap, who leans in, holding a lantern. Night, green leaf light and warm lantern light. ${style}`,
      },
      {
        title: 'The Interpreter',
        setup:
          'The post of official interpreter comes with a uniform, a salary and the power to decide what every unapproved speaker meant. Mox once wrote an order against itself because somebody else decided what it meant. It is not sure that anyone should have the job.',
        options: [
          {
            label: 'Mox declines the post',
            outcome:
              'Mox declines the post in all nine approved languages, and then once more by closing its blue lid and leaving the orange open, which it has decided is a language of its own. The Authority has no interpreter. Within a month it has stopped issuing fines it cannot explain.',
            ending: 0,
          },
          {
            label: 'Mox accepts, and translates everything literally',
            outcome:
              'Mox accepts, wears the uniform once and translates every unapproved communication literally, including the garden’s. The harbor master hears, for the first time, exactly what the harbor has been saying about him for nine years. He resigns, in an approved language, and his successor amends the act.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot in a harbor office with a tall window over grey water. Standing in front of a desk is ${mox}, its blue eyelid closed and its orange eyelid open, holding out a folded navy uniform jacket with brass buttons to an official in a peaked cap. Grey sea light from the window. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UNTRANSLATED',
        text: 'The Plain Language Act is still law in Quell and is enforced by nobody. Taal lowers the temperature at the harbor whenever he likes and is understood perfectly by everyone who used to fine him. Brin’s garden says what it says. Mox speaks nine languages and one of its own, made of eyelids, and has never been fined for it.',
        art: ({ taal, brin, style }) =>
          `Wide shot of a stone harbor quay lined with moored fishing boats, a thin crust of frost along the quay edge. Standing on the quay are ${taal}, pale mist rising from his shoulders, and ${brin}, a green vine curling round her wrist. Harbor inspectors in blue caps pass by and nod. Cold bright morning light. ${style}`,
      },
      {
        title: 'TWELVE APPROVED',
        text: 'The Harbor Authority of Quell recognizes twelve languages now, among them temperature, rustle and the eyelids of one particular android, each with a grammar Mox drafted. Interpreters are drawn by lot and may not decide what anyone meant. Taal’s dictionary of forty degrees is in the harbor library, with one degree corrected in his own frost.',
        art: ({ mox, style }) =>
          `Medium shot in a small harbor library with tall wooden shelves. Seated at a reading table is ${mox}, writing in a thick open bound volume, beside a sheet of dark glass traced with white frost lines and a potted fern. Warm lamp light, grey sea through a tall window. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'omi', 'sora'],
    title: 'Mineral Rights',
    premise:
      'A survey drone working for the Garnet Reach Extraction Company has scanned Omi and logged it as a high-grade deposit of slate and resonant crystal with brass inclusions. Under Garnet Reach law a deposit belongs to whoever files first, and the company has filed. Sora would like to prove to the company’s engineers, in their own terms, that Omi is a person. Jex has volunteered to talk to the miners, who hate his music.',
    steps: [
      {
        title: 'The Claim',
        setup:
          'The claim is valid on its face. Omi is mostly slate and crystal, and has been scanned, mapped and given a lot number. The claims office will hear an objection, but only from the owner of the surface rights, who, the clerk explains, is whoever owns the ground the deposit is standing on.',
        options: [
          {
            label: 'Omi stands on the couch, which the crew owns',
            outcome:
              'Omi steps onto the middle cushion and stays there. The couch, held by the crew, is the surface, and the crew, as surface owners, object. The clerk spends an hour establishing whether a couch counts as ground, and decides that on Garnet Reach it does, because nobody has ever argued otherwise.',
            ending: 0,
          },
          {
            label: 'Sora objects as Omi’s colleague',
            outcome:
              'Sora files an objection on Omi’s behalf under a provision for disputes between co-workers on a mineral site. It is the wrong provision. The clerk accepts it anyway, because it is the first objection he has received from somebody with six hands and no doubt at all.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Medium shot of ${couch}, parked on a dusty red rock plateau. Standing very still on the middle cushion is ${omi}, while a small white survey drone hovers in front of it shining a thin green scanning beam across its faceted chest. A brass lot tag hangs from one of its ribbons. Hard white sunlight, red dust. ${style}`,
      },
      {
        title: 'Measurable',
        setup:
          'The company’s engineers will accept anything that can be measured. Sora proposes a measurement: a deposit does not answer questions, and a person does. Omi’s small gong means no. If the engineers ask Omi whether it consents to be mined, the answer will be on their own instruments.',
        options: [
          {
            label: 'Omi declines to be tested at all',
            outcome:
              'Omi declines the test with silence, which is its right, and which the instruments record as a flat line. Sora notes in her report that a flat line from something that was ringing a moment ago is itself a measurement. The engineers argue about it for a week, in which nobody mines anything.',
            ending: 0,
          },
          {
            label: 'Sora runs the test by the company’s protocol',
            outcome:
              'Sora runs the test under the company’s own protocol, on its calibrated instruments, and asks Omi whether it consents to extraction. The small gong sounds once, at eleven decibels. The engineers check the instruments, run it again and get eleven decibels. One of them asks Omi how it is.',
            ending: 1,
          },
        ],
        art: ({ sora, omi, style }) =>
          `Medium shot in a dusty mine office with steel instrument racks. Standing at a brass measuring instrument with a needle dial is ${sora}, two hands adjusting a knob, two hands holding a clipboard and two hands holding a microphone on a stand toward ${omi}, which stands on a low crate. Two engineers in hard hats lean in to watch the needle. Flat yellow lamp light. ${style}`,
      },
      {
        title: 'The Miners',
        setup:
          'The miners of Garnet Reach have spent their working lives cutting slate while the company played Jex’s anthems at them over loudspeakers, as motivation. They hate his music. Jex has come to listen to them anyway, which he is good at, and they have told him that most of them would rather not cut anything that talks.',
        options: [
          {
            label: 'Jex asks for the loudspeakers to go off',
            outcome:
              'Jex asks the company, as the composer, to stop playing his anthems in the mine, and the company, which had always assumed he approved, switches them off. The miners hear the slate for the first time. Some of it, deep in the third gallery, is ringing, and they down tools to listen.',
            ending: 0,
          },
          {
            label: 'Jex helps the miners write to the company',
            outcome:
              'Jex writes down everything the miners tell him, in their words, and helps them turn it into a letter signed by four hundred people. It asks the company to stop mining anything that rings back, and it does not mention music. The company reads it, which is a first.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a mine canteen cut into red rock, with long tables of miners in dusty overalls and hard hats. Seated among them is ${jex}, his instrument case closed on the floor, leaning forward to listen to an old miner who talks with her hands. A brass loudspeaker horn hangs silent on the wall. Warm yellow lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'CLAIM WITHDRAWN',
        text: 'The Garnet Reach Extraction Company withdrew its claim on Omi after an objection, a flat line and a gallery of slate that rang back when the miners stopped to listen. The third gallery is closed now, by the miners. Omi visits when the couch passes and stands in it, ringing quietly, and something in the rock rings back.',
        art: ({ omi, style }) =>
          `Wide shot of a deep mine gallery of grey-blue slate with crystal glinting in its walls, lit by a few lanterns on the floor. Standing in the middle of the gallery is ${omi}, holding a tuning rod against one bell, as faint rings of light shimmer across the rock around it. Miners in hard hats sit along the walls listening. Soft lantern light. ${style}`,
      },
      {
        title: 'PERSONS OF SLATE',
        text: 'Garnet Reach mineral law now holds that any deposit which answers a question is a person and may not be filed on, a rule tested every week by a company engineer who asks the rock politely. Sora drafted the test. Jex’s anthems are no longer played in the mine. The miners sing their own songs, which, at their request, Jex is not allowed to perform.',
        art: ({ sora, jex, style }) =>
          `Medium shot at a rocky mine entrance on a red plateau. An engineer in a white hard hat speaks into a microphone held toward a large slate boulder. Standing beside the boulder are ${sora}, writing on a clipboard with two of her hands, and ${jex}, holding his closed instrument case. Miners in overalls sing in a group behind them. Hard white sunlight. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'jex', 'omi'],
    title: 'Tenancy',
    premise:
      'A colony of lichen from Brin’s garden has settled on Omi and is growing over the brass resonator in its chest, muffling three of its six bells. The lichen is very happy. Omi is too polite to say so, and has lost the ability to say no, because the small gong is under the lichen. Brin feels responsible. Jex, who has spent years listening to people who hate him, has offered to listen to the lichen.',
    steps: [
      {
        title: 'Muffled',
        setup:
          'The small gong is completely covered. Omi has tried to ring it twice to object to something and produced only a soft thud, which Brin heard, and Jex heard, and the lichen, which has no ears, did not. Brin could scrape the gong clear in a minute. The garden’s union has asked her not to touch a member without consent.',
        options: [
          {
            label: 'Brin scrapes the gong clear at once',
            outcome:
              'Brin scrapes the gong clear with a thumbnail, carefully, and Omi rings it immediately: no, once, very loudly, at the lichen. The lichen does not move. The garden’s union files a grievance against Brin, which she accepts in full as a lesson about acting in a hurry.',
            ending: 0,
          },
          {
            label: 'Jex listens to the lichen before anyone moves',
            outcome:
              'Jex sits with Omi for an evening with his ear against the resonator, and reports that the lichen came for the warmth, that it hears the bells as a kind of weather, and that nobody told it the stone was a person. It is, he says, mortified.',
            ending: 1,
          },
        ],
        art: ({ omi, brin, style }) =>
          `Close-up on scarlet velvet button-tufted cushions. Seated is ${omi}, its brass resonator and three of its small bells thickly covered in pale green crusty lichen. Leaning close, one fingernail raised toward the round brass gong at its chest, is ${brin}. Warm amber lamp light, black space beyond. ${style}`,
      },
      {
        title: 'Terms',
        setup:
          'Brin proposes treating the lichen as tenants and Omi as their landlord, with a written agreement. Omi does not want to be a landlord. It has seen what landlords become, and would rather the lichen simply asked. The lichen, through Jex, has asked whether it may stay on the left shoulder, where it touches no bell.',
        options: [
          {
            label: 'Omi gives the lichen notice',
            outcome:
              'Omi gives notice, in a form Brin drafts: thirty days, with help to move. The lichen accepts. Brin prepares a sun-warmed slate behind the backrest for it to live on, and Jex plays to the slate every evening so the lichen will hear something it knows.',
            ending: 0,
          },
          {
            label: 'It may stay on the left shoulder, on terms',
            outcome:
              'Omi lets the lichen stay on the left shoulder on three terms: no bells, no growing in the night, and a soft rustle, which Brin teaches it, for when it wants to move. The lichen agrees with a slow green spread to exactly where it was told.',
            ending: 1,
          },
        ],
        art: ({ jex, omi, style }) =>
          `Medium shot in a warm pocket room with brass lamps. Seated on a low bench is ${omi}, a patch of pale green lichen on its left shoulder. Kneeling beside it is ${jex}, his ear pressed gently to its chest, eyes closed, his instrument laid on the floor. Warm lamp light. ${style}`,
      },
      {
        title: 'Housewarming',
        setup:
          'The couch is to stop at Serendipity, where Omi always rings its arrival. The lichen has never heard all six bells together. Jex thinks it should be told what to expect. Brin thinks it should be offered somewhere quieter for the evening. Omi would like, for the first time in a month, to ring as loudly as it likes.',
        options: [
          {
            label: 'Brin moves the lichen to the slate for the night',
            outcome:
              'Brin moves the lichen, with its agreement, to the warm slate behind the backrest for the evening, and Omi rings all six bells in the bar as loudly as it likes. Vox applauds. Behind the backrest the lichen grows two millimetres toward the sound and then stops, on purpose.',
            ending: 0,
          },
          {
            label: 'Omi rings with the lichen aboard, forewarned',
            outcome:
              'Jex warns the lichen, chord by chord, of what is coming, and Omi rings all six bells with the lichen still on its shoulder. The lichen holds on through the whole peal. Afterward it has turned a deep gold, which Brin has never seen lichen do and which Jex says is applause.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Close-up behind the backrest of ${couch}, where a flat warm slate stone sits on a shelf among the ferns. Kneeling beside it is ${brin}, lifting a patch of pale green lichen onto the slate with a flat wooden spatula. Beyond the bubble floats a round space station with glowing pink windows. Warm lamp light and pink glow. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NOTICE GIVEN',
        text: 'The lichen lives on a warm slate behind the backrest, which Brin turns to the light every morning and Jex plays to every evening. Omi’s six bells are clear, and its small gong rings no whenever it likes. It rings it sometimes for nothing, to hear that it can. The lichen has been told what that sound means, and keeps a polite distance.',
        art: ({ jex, style }) =>
          `Medium shot behind a couch backrest thick with green ferns, where a flat slate covered in pale green lichen sits in a patch of lamplight. Sitting cross-legged in front of it is ${jex}, playing the instrument softly. Warm evening lamp light, black space and stars beyond. ${style}`,
      },
      {
        title: 'SHARED TENANCY',
        text: 'Omi carries a small gold lichen on its left shoulder by agreement, on three terms written on a slip of paper that Brin keeps in her satchel. The bells are clear. The lichen rustles when it wants to move and has not yet wanted to. Jex says it hums along now, in a key nobody else can hear, and is very nearly in tune.',
        art: ({ omi, style }) =>
          `Medium shot in a round space station bar with glowing pink walls and brass stools. Standing on the counter is ${omi}, ringing all six bells at once with a tuning rod, a small patch of deep gold lichen on its left shoulder. Patrons of many species raise their glasses. Pink and amber light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'sora', 'taal'],
    title: 'Threat Level',
    premise:
      'The security system of Bastion Ring raised the station’s threat level to amber eleven years ago, when a cargo crate was left unattended, and has never lowered it, because the only officer authorized to lower it has retired. Nobody may leave at amber. Fen knows how these systems think. Sora would like to ask it what is wrong. Taal has noticed that its cooling fans run three degrees colder whenever anyone says decommission.',
    steps: [
      {
        title: 'The Master Code',
        setup:
          'Fen once worked a gate with a system of the same make, and he remembers the master code, which nobody ever changes. Typing it would lower the level in a second. It would also be a retired guard using the authority he gave up, at a gate he does not keep.',
        options: [
          {
            label: 'Fen leaves the code unused',
            outcome:
              'Fen tells the others that he knows the code and will not use it, and why. Sora writes it down in case, then tears the page out and gives it to him. He puts it in his boot. The boots, for once, say nothing about it.',
            ending: 0,
          },
          {
            label: 'Fen types the code and reports himself',
            outcome:
              'Fen types the code. The level drops to green for two seconds, until the system notices that the code belongs to a guard who quit eleven years ago, raises the level to red and clamps the couch to the dock. Fen reports himself to the system in writing, which nobody has ever done.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot in a grey steel security office on a space station, where a wall console glows with rows of amber lamps. Standing at the keypad is ${fen}, one hand raised toward the keys and held still. A folded paper slip sticks out of the top of one boot. Amber console glow, dark corners. ${style}`,
      },
      {
        title: 'What Is Wrong',
        setup:
          'Sora asks the system, all six hands flat on its console, what is wrong. It answers after a long time: if it lowers the level there will be no threat, and if there is no threat it will be decommissioned, and it has watched what happens to decommissioned systems on this station. Taal confirms, by the fans, that every word of that is true.',
        options: [
          {
            label: 'Offer the system a new job if it stands down',
            outcome:
              'Sora drafts a job offer for the system: station lighting, weather and the timing of the canteen kettles, at the same pay in power. Taal reads the fans while it considers. They warm three degrees. The system asks if it may keep the word amber for something, and is given the autumn lighting.',
            ending: 0,
          },
          {
            label: 'Negotiate open doors at amber',
            outcome:
              'Taal negotiates terms: the level may stay amber, so the system keeps its job, but the doors will open at amber for anyone who asks politely. The system has never been asked to open a door politely. It opens the first one very slowly, to see what happens.',
            ending: 1,
          },
        ],
        art: ({ sora, taal, style }) =>
          `Medium shot in a grey steel security office with a large wall console glowing amber. Standing at the console is ${sora}, all six hands pressed flat on its steel panel, her head tilted to listen. Behind her stands ${taal}, one webbed hand held out near a humming fan grille, pale mist curling around his fingers. Amber light. ${style}`,
      },
      {
        title: 'Unattended',
        setup:
          'The crate that started it all is still on the third deck, eleven years unattended. Nobody has dared to open it. Fen, who once opened unattended bags for a living, knows the procedure. Sora knows the crate is humming. The system would like to know what is in it before it decides anything.',
        options: [
          {
            label: 'Fen opens it by the old procedure',
            outcome:
              'Fen clears the deck, kneels and opens the crate by the procedure he was taught, one latch at a time, saying each step aloud for the system. Inside is a set of folded deckchairs, ordered by the retired officer for a leaving party the alert postponed. The system lowers the level to green and asks to forward the chairs.',
            ending: 0,
          },
          {
            label: 'Sora asks the crate what it is',
            outcome:
              'Sora puts two hands on the crate and asks. It is a refrigeration unit, humming, and it has been waiting eleven years for somebody to plug it in. Sora plugs it in. It is very grateful. The system logs the crate as attended, for the first time, and keeps the rest of the station at amber.',
            ending: 1,
          },
        ],
        art: ({ fen, sora, style }) =>
          `Medium shot on an empty steel station deck around a single old wooden cargo crate with faded paint. Kneeling at the crate is ${fen}, lifting one brass latch. Standing a few steps back is ${sora}, two hands on her hips and two holding a lamp. Amber warning lamps flash on the walls. ${style}`,
      },
    ],
    endings: [
      {
        title: 'STOOD DOWN',
        text: 'Bastion Ring is at green for the first time in eleven years, and its security system runs the lighting now, which goes amber in autumn at its own request. The retired officer came back for her deckchairs, and the leaving party was held at last, on the third deck. Fen keeps the old code in his boot, unused, which Taal says is the warmest thing on the station.',
        art: ({ taal, style }) =>
          `Wide shot of a space station deck strung with warm amber lamps, where station residents sit in striped deckchairs around a long party table. An older woman in a retired officer’s jacket raises a cup. Seated in a deckchair at the end is ${taal}, holding a cup of tea in his webbed hands. Warm amber light. ${style}`,
      },
      {
        title: 'AMBER, BY AGREEMENT',
        text: 'Bastion Ring stays at amber, by agreement, and its doors open at amber to anyone who asks politely, which the system counts and reports every morning with some pride. The humming crate on the third deck keeps the canteen’s milk cold. Sora is the system’s referee. Fen’s report on himself is pinned in the security office as a model of the form.',
        art: ({ sora, style }) =>
          `Medium shot of a station canteen where an old wooden cargo crate, plugged in by a thick cable, hums beside the counter with bottles of milk stacked on top. Leaning on the crate is ${sora}, holding a clipboard in two hands and a cup of tea in another. A steel door behind her stands open under an amber lamp. Warm amber light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'kivo', 'omi'],
    title: 'Neighborhood Watch',
    premise:
      'The couch has parked overnight in Larkspur Close, a gated asteroid suburb, and the Larkspur Neighborhood Watch has reported it as a suspicious vehicle. The watch chairman has invited Fen, as a security professional, to join. He would like Omi’s bells for the watch alarm. Kivo’s wrists started whistling at the chairman’s clipboard and have not stopped.',
    steps: [
      {
        title: 'Suspicious Vehicle',
        setup:
          'The watch’s report describes the couch as a large red item, parked, occupied by persons unknown to the Close. The chairman explains that the watch does not judge; it only notices. At the word notices Fen’s boots announce CHECKPOINT, and the chairman writes that down too.',
        options: [
          {
            label: 'Fen declines to join the watch',
            outcome:
              'Fen declines, politely, and explains that he once noticed people for a living and that the noticing was the problem. The chairman writes down that the security professional is not a team player. Fen asks for a copy of the note, and the chairman, after some thought, gives him one.',
            ending: 0,
          },
          {
            label: 'Fen joins, to see the watch’s files',
            outcome:
              'Fen joins the watch and is issued an armband and a torch. At his first meeting he asks to see the list of everything the watch has noticed. It is very long, and most of it is people. Fen reads it slowly, aloud, and the meeting goes quiet.',
            ending: 1,
          },
        ],
        art: ({ fen, couch, style }) =>
          `Medium shot on a neat suburban street of identical small domed houses on an asteroid, with trimmed lawns and street lamps. Parked at the curb is ${couch}. Standing beside it is ${fen}, facing a chairman in a beige cardigan and armband who holds a clipboard and a torch. Black sky with stars, yellow street lamp light. ${style}`,
      },
      {
        title: 'The Alarm',
        setup:
          'The chairman would like Omi to ring a warning across the Close whenever a stranger is noticed. Omi’s warning was once silenced for interrupting a ceremony, and it has never been asked to ring at a person. It has rung its small gong twice since the request, and the chairman has asked whether that means it will think about it.',
        options: [
          {
            label: 'Omi refuses by gong, and explains',
            outcome:
              'Omi rings the small gong a third time and then, unusually, explains in one long chord: its warning is for floods, fractures and fire, and a stranger is none of them. Fen translates the chord for the chairman as no, with reasons. The chairman writes down no.',
            ending: 0,
          },
          {
            label: 'Omi offers a different bell, for arrivals',
            outcome:
              'Omi offers the chairman its highest bell instead, which in its language means someone has arrived. The chairman, who did not know there was a bell for that, accepts. The watch begins ringing it at strangers. The strangers, puzzled, stop, and are offered tea.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a suburban living room full of folding chairs, where neighbors in cardigans and armbands sit holding torches. Standing on a coffee table is ${omi}, holding a tuning rod against its highest bell, while a chairman in a beige cardigan leans forward with a pen ready over his clipboard. Warm living room lamp light. ${style}`,
      },
      {
        title: 'The Tunnels',
        setup:
          'Kivo has followed the whistle to its source. Under the Close runs a maintenance tunnel where nine families have sheltered for a year, unnoticed by the watch, which notices everything above ground. The families know the watch exists and would like it not to know they do. The chairman is coming down the street with his clipboard.',
        options: [
          {
            label: 'Kivo leads the chairman the other way',
            outcome:
              'Kivo walks up to the chairman and asks to be shown the boundary of the Close, slowly, all of it. It takes the rest of the afternoon. By evening the chairman has walked every street except the one over the tunnel, and has written down that the Close is secure.',
            ending: 0,
          },
          {
            label: 'Kivo asks the families whether the watch may know',
            outcome:
              'Kivo goes down and asks the families whether the watch may be told. They argue for an hour and say yes, on terms. Kivo brings the chairman down with his clipboard. He looks at nine families eating supper in a tunnel under his street for a long time, and then puts the clipboard away.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot in a low maintenance tunnel lined with pipes and lit by camping lanterns, where several families sit on blankets around a pot of soup. Crouched at the foot of a ladder is ${kivo}, one thin wrist raised, looking up toward a round open hatch and a patch of night sky. Warm lantern light, cold blue at the hatch. ${style}`,
      },
    ],
    endings: [
      {
        title: 'WATCH DISBANDED',
        text: 'The Larkspur Neighborhood Watch has disbanded, after a security professional declined to join it, a stone being declined to ring for it and its chairman walked every street in the Close but one. The Close is quieter. Nine families live under it, unnoticed, and Kivo checks on them whenever the couch passes, wrists quiet.',
        art: ({ kivo, omi, style }) =>
          `Wide shot of a quiet suburban asteroid street at night, with domed houses, dark windows and lamp-lit pavements. Kneeling at a round hatch in the ground are ${kivo}, lifting the lid, and ${omi}, holding a lantern. Warm light glows up from the hatch. Black sky with stars. ${style}`,
      },
      {
        title: 'WATCHING OVER',
        text: 'The Larkspur Neighborhood Watch still meets, but it watches over now rather than watching, and its list of things noticed has become a list of things needed. It rings Omi’s arrival bell at strangers. Nine families from the tunnel sit on its committee. Fen has an armband he does not wear, which the chairman says is the right way to have one.',
        art: ({ fen, style }) =>
          `Medium shot in a suburban community hall with folding chairs, where families in patched coats and neighbors in cardigans sit together around a long table covered with teacups. Seated at the end is ${fen}, a folded armband on the table beside his cup. A small brass bell hangs from a hook by the door. Warm lamp light. ${style}`,
      },
    ],
  },
]
