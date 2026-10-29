import type { TrioAdventure } from './trioAdventures'

// Party adventures, second ten (see trioAdventures.ts and trioAdventuresA.ts
// for the conventions).

export const TRIO_ADVENTURES_B: readonly TrioAdventure[] = [
  {
    crew: ['fen', 'jex', 'sora'],
    title: 'The Toll',
    premise:
      'The Gantry, a bridge across a hyperspace gap, charges a toll of one song per crossing. Jex is banned from performing the songs he is known for and has not written another in years. Fen’s boots have been announcing CHECKPOINT since the approach. Sora has noticed that the toll booth is not attached to anything, and that the voice asking for songs is coming from the bridge itself.',
    steps: [
      {
        title: 'The Toll',
        setup:
          'The terms are simple: one song, any song, sung by anyone aboard. Jex could sing. Fen could, badly. Sora could ask the bridge what it wants a song for, which is not part of the transaction and may hold up the queue of ships behind the couch.',
        options: [
          {
            label: 'Ask the bridge what the songs are for',
            outcome:
              'Sora asks. The bridge says it is lonely, that it has heard every song in the galaxy in the order ships could be bothered to sing them, and that it would like, once, to hear a song made for it. The queue behind the couch begins to sound its horns.',
            ending: 0,
          },
          {
            label: 'Fen pays the toll himself',
            outcome:
              'Fen sings a border guard’s marching song from memory, at attention. It is terrible. The bridge accepts it as payment and adds, after a pause, that it is the first song anyone has sung to it as if they meant it. The queue applauds, out of politeness or fear.',
            ending: 1,
          },
        ],
        art: ({ fen, couch, style }) =>
          `Wide shot of a long narrow iron bridge spanning a swirling violet gap in space, with a small empty toll booth floating loose beside it. Parked at the bridge entrance is ${couch}. Standing on the cushion at attention is ${fen}, singing with his chin raised. A queue of small ships waits behind. Violet light from the gap. ${style}`,
      },
      {
        title: 'The Engineer’s Report',
        setup:
          'Sora inspects the bridge with four hands and keeps two on the railing. It is sentient, unpaid, and has been collecting songs for nine centuries on behalf of a transit authority that dissolved eight centuries ago.',
        options: [
          {
            label: 'Tell the bridge its employer no longer exists',
            outcome:
              'Sora tells it, gently. The bridge is quiet for some time. Then it asks whether that means the songs were for itself all along. Fen says yes. Fen has had the same conversation with himself, about a checkpoint.',
            ending: 0,
          },
          {
            label: 'Draw up a fair contract and let it keep working',
            outcome:
              'Sora drafts a contract between the bridge and the bridge, with a rate for songs, a holiday every century and a pension of one song a day. The bridge accepts with a shudder along its span. Jex witnesses it.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot on a long narrow iron bridge over a swirling violet gap in space. Kneeling on the walkway is ${sora}, four hands pressed against a riveted iron girder and two hands gripping the railing, her head tilted to listen. Old brass plates on the girders are worn smooth. Violet light from below. ${style}`,
      },
      {
        title: 'Jex’s Song',
        setup:
          'The bridge has asked Jex, specifically, for a new song. Not an anthem, not for a war, not for a peace. For a bridge. He has not finished anything new since the ban, and he has been humming for two systems.',
        options: [
          {
            label: 'Jex writes it alone, on the couch',
            outcome:
              'Jex writes the song on the back of a toll receipt, in an hour. It is short, it is about going over things, and the bridge hums it back immediately. It is the first song he has finished in nine years. He does not perform it. He gives it.',
            ending: 0,
          },
          {
            label: 'Jex teaches the crew to sing it together',
            outcome:
              'Jex writes it for four voices and teaches it on the cushions. Sora’s six hands keep time. Fen’s boots keep time too, unasked, and for once say nothing else. The couch crosses singing, out of tune, in the middle of the span, and the bridge records all of it.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Close-up of a scarlet velvet button-tufted cushion. Sitting on it is ${jex}, writing music notes in pencil on the back of a small paper receipt balanced on the instrument case on his knee. Behind him the iron railing of a long bridge stretches into violet light. Soft violet and warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FREE CROSSING',
        text: 'The Gantry no longer charges a toll. It asks instead, and most ships sing anyway. Fen’s boots have retired to the empty booth, where they announce CHECKPOINT to every passing vessel in a tone the bridge describes as welcoming. Jex has written six more songs since. None of them is for anything.',
        art: ({ Couch, style }) =>
          `Wide shot of a long narrow iron bridge spanning a swirling violet gap in space. ${Couch}, crosses the middle of the span. On the shelf of a small floating toll booth beside the bridge entrance stands a pair of heavy scuffed black guard boots. Violet light from below, scattered stars. ${style}`,
      },
      {
        title: 'EXACT CHANGE',
        text: 'The Gantry charges its toll on fair terms, with a pension and a holiday, and is the only bridge in the galaxy with a union of one. Sora is its arbitrator by correspondence. The rates are posted at the entrance. Jex’s song is at the top, and the bridge plays it for anyone who cannot sing.',
        art: ({ sora, style }) =>
          `Medium shot at the entrance of a long narrow iron bridge over a violet gap in space. Standing beside a small floating toll booth is ${sora}, two hands holding a long paper contract, two hands holding a pen, and two hands resting on the iron railing. A small ship waits with its window open. Violet light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'mox', 'pell'],
    title: 'Some Assembly Required',
    premise:
      'A moon has been delivered flat-packed into orbit around Tinder Reach, with an instruction leaflet in pictograms and one spare part nobody can account for. Its eleven thousand residents are waiting patiently in the box. Pell would like to build it properly. Mox has read the instructions and has opinions about them. Kivo has put a wrist to the spare part, and it is whistling back.',
    steps: [
      {
        title: 'Instructions',
        setup:
          'The leaflet shows a smiling figure assembling the moon in eleven steps with a single hex key. Pell estimates eleven weeks with real tools. Mox points out that step seven is physically impossible, and that the figure in the drawing is smiling in a way that suggests it knows.',
        options: [
          {
            label: 'Pell builds it properly, with the residents',
            outcome:
              'Pell asks the residents what kind of moon they want. They want a view and a slightly warmer south. He builds it that way, with them, over eleven weeks, and the leaflet is used as a wedge under a hill.',
            ending: 0,
          },
          {
            label: 'Follow the leaflet exactly',
            outcome:
              'The crew follows the leaflet exactly, including step seven, which turns out to be possible if you hold the moon upside down and ask no questions. The hex key bends. Pell replaces it with one of his own and enters the substitution in his log, in red.',
            ending: 1,
          },
        ],
        art: ({ pell, mox, style }) =>
          `Wide shot in orbit of an enormous flat cardboard box split open, with huge curved grey moon panels stacked inside. Standing on one panel is ${pell}, holding a giant bent hex key. Beside him stands ${mox}, holding a folded paper leaflet of simple drawings. Blue planet below, bright white sunlight. ${style}`,
      },
      {
        title: 'The Spare Part',
        setup:
          'The spare part is a small brass bolt, warm to the touch, whistling to Kivo in a pressure pattern Kivo recognizes as asking where it is. Mox runs a check and confirms that the bolt is, in a small and definite way, someone. It is not in the instructions.',
        options: [
          {
            label: 'Ask the bolt where it would like to go',
            outcome:
              'Kivo asks. The bolt would like to be in the middle of things, where it can hear everyone. Pell fits it at the center of the moon, by hand, with a washer for comfort. Eleven thousand residents now live around a bolt that is glad to be there.',
            ending: 0,
          },
          {
            label: 'Return it to the manufacturer, as the leaflet says',
            outcome:
              'Mox returns the bolt to the manufacturer with a covering letter explaining that it is a person and should be treated as one. The manufacturer replies that it has no procedure for that, and a week later that it has one now. It is very long. The bolt is its first case.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Close-up of two cupped grey-blue hands holding one small shiny brass bolt. The hands belong to ${kivo}, who holds the bolt close to one thin raised wrist, head tilted to listen. Behind them, out of focus, curved grey moon panels. Warm golden sunlight on the brass. ${style}`,
      },
      {
        title: 'Moving In',
        setup:
          'The moon is finished. The residents climb out of the box. One of them, an old woman with a clipboard, presents the crew with a customer satisfaction survey of eleven questions, each answered on a scale of one to eleven.',
        options: [
          {
            label: 'Ask the residents to fill in one about the builders',
            outcome:
              'Pell asks for a survey about the builders instead. The residents give them seven out of eleven, with a note that the bolt gave them eleven. The crew agrees that this is fair.',
            ending: 0,
          },
          {
            label: 'Fill in the survey honestly',
            outcome:
              'Mox fills in the survey honestly, at length, in both lids. Pell signs it. Kivo adds a note about the weather in the south. The woman with the clipboard reads all of it, frowns, and files it under complaints, which she explains is where they keep everything they read.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot on the grey surface of a newly built moon, with seams between its panels still visible. A crowd of small residents in travel coats climbs out of a huge open cardboard box. In front, an old woman holds out a clipboard to ${mox}, which holds a pen. Bright white sunlight, blue planet on the horizon. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SOME ASSEMBLY REQUIRED',
        text: 'The moon around Tinder Reach is not quite as shown: it is warmer in the south, it has a view, and at its center there is a small brass bolt that everyone on the surface can hear on quiet nights. The residents call it home. Pell calls it the best job he has ever done without a single original part.',
        art: ({ style }) =>
          `Wide shot of a small grey moon in orbit above a blue planet, with neat seams visible between its curved panels. Its southern half is green with fields and small houses, warm lit windows glowing. A thin cutaway reveals its center, where one small brass bolt glows. Warm sunlight from the left. ${style}`,
      },
      {
        title: 'ASSEMBLED AS SHOWN',
        text: 'The moon is exactly as pictured on the leaflet, down to the smile. It works perfectly. The manufacturer uses it in its advertising, and in the small print, at Mox’s insistence, there is now a line saying that some parts may be people and should be asked.',
        art: ({ pell, style }) =>
          `Medium shot on the smooth grey surface of a neatly assembled moon. Standing beside a crowd of residents is ${pell}, holding up a folded paper leaflet of simple drawings next to the real horizon to compare them. A bent hex key hangs from his belt. Bright white sunlight, blue planet behind. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'taal', 'vela'],
    title: 'Visiting Hours',
    premise:
      'The Sanatorium of Perpetual Rest, a hospital moon where noise is a notifiable condition, has called the couch to collect a patient who has been discharged and will not leave. Vela’s bell, which shouts DID YOU ASK?, was confiscated at the gate. Taal speaks in temperature. Omi speaks in bells, and has been asked to speak in none of them.',
    steps: [
      {
        title: 'The Bell',
        setup:
          'Vela’s bell is held at reception in a padded box. Without it she must ask her questions aloud, which is permitted, at a whisper, which is not her register. The patient’s ward is four floors up and she has a great deal to ask.',
        options: [
          {
            label: 'Vela whispers every question',
            outcome:
              'Vela whispers. It takes three times as long. The patients lean in to hear her, which nobody in the sanatorium has done for years, and by the fourth floor she is giving a whispered lecture on consent to forty people in dressing gowns.',
            ending: 0,
          },
          {
            label: 'Taal asks for the bell back, coldly',
            outcome:
              'Taal stands at reception and lowers the temperature until the receptionist can see her breath. He says nothing. He does not need to. The bell is returned, wrapped in a towel, and Vela rings it once on the stairs, very quietly, which it has never done before.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot in a long hushed hospital corridor with pale green walls and soft carpet. Leaning toward a group of patients in dressing gowns is ${vela}, one hand cupped beside her mouth. The patients lean in close to listen. Soft daylight through tall windows. ${style}`,
      },
      {
        title: 'The Patient',
        setup:
          'The patient is an elderly composer named Halloran Pike, discharged as cured of tinnitus, who will not go. Outside, she says, is very loud. Taal reads her temperature: her answer to every question about leaving is three answers at once.',
        options: [
          {
            label: 'Ask her what each of the three answers is',
            outcome:
              'Taal asks. Vela takes notes. The first answer is no, the second is not yet, and the third is not alone. Vela writes all three on the chart under PATIENT WISHES, a heading the sanatorium’s forms do not have, so she adds it by hand.',
            ending: 0,
          },
          {
            label: 'Offer her a seat somewhere quieter',
            outcome:
              'Vela offers her a seat on the couch, which in a vacuum is the quietest seat in the galaxy. Pike considers it. She asks whether the bells come with it. Omi says they can be arranged.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot in a quiet hospital room with pale green walls and a single bed by the window. An elderly woman with white hair in a grey cardigan sits on the edge of the bed. Standing at the foot of the bed is ${taal}, with faint pale mist rising from his shoulders, his webbed hands folded. Soft afternoon light. ${style}`,
      },
      {
        title: 'The Small Gong',
        setup:
          'The director arrives to enforce the discharge. Omi has stood in the corridor all visit without a sound, which for Omi is like holding its breath for a day. Pike looks at Omi and asks whether it has anything to say.',
        options: [
          {
            label: 'Omi rings the small gong',
            outcome:
              'Omi rings the small gong. It means no, and everyone in the corridor knows it, including the director, who has never heard a gong in the sanatorium and finds it has stopped her mid-sentence. Pike stays. The director rescinds the discharge in a whisper.',
            ending: 0,
          },
          {
            label: 'Omi plays all six bells for Pike',
            outcome:
              'Omi plays all six bells in the corridor of the Sanatorium of Perpetual Rest, the first time anyone has. It is not loud. It is very clear. Pike listens to the end and then picks up her coat.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot in a long hospital corridor with pale green walls. Standing in the middle of the carpet is ${omi}, holding a long thin tuning rod against its smallest bell. A tall woman in a white director’s coat has stopped walking, one hand raised. An elderly woman in a grey cardigan watches from a doorway. Soft daylight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'VISITING HOURS',
        text: 'Halloran Pike still lives at the Sanatorium of Perpetual Rest, by choice, in a room with a small gong by the door that she may ring to end any conversation. The couch visits when it passes. Vela brings her bell, wrapped in a towel. Taal keeps the room at the temperature of a good decision.',
        art: ({ vela, style }) =>
          `Medium shot in a quiet hospital room with pale green walls. An elderly woman with white hair sits in an armchair by the window beside a small brass gong on a wooden stand. Sitting opposite her is ${vela}, holding the bell wrapped in a white towel on her lap. Soft afternoon light. ${style}`,
      },
      {
        title: 'DISCHARGED AGAINST ADVICE',
        text: 'Halloran Pike left the Sanatorium of Perpetual Rest on the couch and has not been back. She lives now on a quiet world near the Harmonic Belt and composes for six bells. Omi has received three pieces so far. The first is mostly rests and is called Thank You.',
        art: ({ omi, couch, style }) =>
          `Wide shot of ${couch}, drifting through quiet black space. An elderly woman with white hair in a grey coat sits on one cushion with her eyes closed. Beside her stands ${omi}, holding a tuning rod against one bell. Soft starlight. ${style}`,
      },
    ],
  },
  {
    crew: ['rue', 'sora', 'tess'],
    title: 'The Star That Moved',
    premise:
      'Tess noticed it first: a star that should not be moving has moved eleven light-minutes to the left, without planning permission. Three of its planets have filed complaints. Rue knows the planning code. Sora’s first rule of engineering is to ask the machine what broke before naming it, and a star is, in her view, a very large machine.',
    steps: [
      {
        title: 'Ask First',
        setup:
          'The planets want the star returned to its original position by order. Sora wants to ask the star why it moved. Rue points out that asking a star a question constitutes contact, contact constitutes a hearing, and a hearing must be minuted.',
        options: [
          {
            label: 'Ask the star, and minute it',
            outcome:
              'Sora asks. The star answers in a flare that Tess reads off the instruments: it moved away from a neighbor that had been shouting at it for four billion years. Rue minutes the answer word for word. It is the first star in the planning register to give a reason.',
            ending: 0,
          },
          {
            label: 'File the planets’ complaint formally',
            outcome:
              'Rue files the complaint as required, with a covering memo noting that the star has not yet been heard. The planning office acknowledges receipt and schedules a hearing for the next geological era. The planets are content. The star moves another light-minute.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Wide shot of ${couch}, floating close to a huge orange star with a long curling solar flare. Standing on the cushion is ${sora}, two hands raised toward the star, two hands holding a brass instrument, two hands holding a clipboard. Orange starlight floods the couch from the right. ${style}`,
      },
      {
        title: 'Asylum',
        setup:
          'The star has asked for asylum. Rue’s view is that a star cannot claim asylum, because it is in no jurisdiction but its own, which it is fleeing. Sora’s view is that a power source has the right to resign from a system it no longer wishes to power.',
        options: [
          {
            label: 'Rue argues the star is a refugee',
            outcome:
              'Rue argues it in a brief of forty pages, eleven of them on the definition of a border when the thing crossing it is a border. The asylum board, which has never seen a star before, grants temporary protection while it considers the brief.',
            ending: 0,
          },
          {
            label: 'Sora argues the star is resigning',
            outcome:
              'Sora argues it as an engineering matter: the star has given notice, and the planets have had four billion years to find another supplier. The planets are given a century to install alternative lighting. They are furious. The star dims slightly, which Tess says is how stars look when they are relieved.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Interior of a long wood-panelled hearing room with a curved bench of five officials in grey robes. Standing at a lectern is ${rue}, holding a thick stack of paper bound with string. Through the tall window behind the bench a huge orange star fills the sky. Orange light through the window, warm lamp light inside. ${style}`,
      },
      {
        title: 'Naming Rights',
        setup:
          'The star now sits at an uncharted position. Under navigation law whoever reports a new position first may name what is there. Tess has the coordinates. A named star is on every chart, and a star on every chart can be found by the neighbor that was shouting.',
        options: [
          {
            label: 'Tess keeps the coordinates to herself',
            outcome:
              'Tess deletes the coordinates from the couch’s log and keeps a copy in her head, next to her grandmother’s harbor. She does not get to name a star. She gets to know where one is hiding, which she says is better, most days.',
            ending: 0,
          },
          {
            label: 'Tess names it and lists it publicly',
            outcome:
              'Tess names the star and lists it, with a note in the register that it has asked not to be visited by its former neighbor, citing Rue’s brief. The neighbor reads the note. It is the first thing it has read in four billion years. It does not come.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Close-up on the rolled armrest of ${couch}. Leaning on it is ${tess}, holding a transparent navigation disk with one bright orange dot, her thumb resting over the dot. Far behind her a lone orange star glows in empty black space. Orange starlight on her face. ${style}`,
      },
    ],
    endings: [
      {
        title: 'UNLISTED STAR',
        text: 'Eleven light-minutes to the left of where it should be, a star burns quietly in a position nobody has charted. Its old planets have switched to lamps and complain about the color. Rue’s brief is studied in law schools. Tess knows the coordinates and has told nobody, which is the first secret she has kept that made her feel taller.',
        art: ({ style }) =>
          `Wide shot of deep black space with a single calm orange star glowing alone. Far to one side, three small planets hang in the dark, each with tiny yellow lamp lights strung across its night side. Soft orange glow, cold distant starlight. ${style}`,
      },
      {
        title: 'HELIO’S STAR',
        text: 'Helio’s Star is on every chart, with a footnote saying it moved of its own accord and is not to be approached without an invitation. Tess is famous, in the small way navigators are famous. Sora has written to the star twice. It replied once, in a flare, which Rue has had translated and filed.',
        art: ({ tess, sora, style }) =>
          `Medium shot inside a small chart room with a large paper star chart spread on a table. Leaning over the chart is ${tess}, inking a small orange circle with a pen. Beside her stands ${sora}, holding a lamp in one hand and a ruler in two others. Warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'fen', 'jex'],
    title: 'The Hedge',
    premise:
      'For two hundred years the border between Ardent and Lesser Ardent has been a hedge, and the hedge has grown sentient and would like to be a garden. Brin can hear it. Fen recognizes the guards on both sides, because he trained with half of them. Jex is banned from performing in either country, which makes him the only neutral party for several light-years.',
    steps: [
      {
        title: 'The Hedge’s Request',
        setup:
          'The hedge has asked, in a rustle Brin translates, to be allowed to grow flowers. Flowers are prohibited at the border: they obscure sightlines and encourage loitering. The hedge has been clipped into a perfect wall twice a week for two centuries and would like, once, to be untidy.',
        options: [
          {
            label: 'Help the hedge flower, openly',
            outcome:
              'Brin feeds the hedge on both sides at once, in daylight, in front of both sets of guards. It flowers within the hour, white on the Ardent side and yellow on the Lesser. Both countries claim the other color is an act of aggression.',
            ending: 0,
          },
          {
            label: 'Ask the guards first',
            outcome:
              'Fen asks the guards. The Ardent guards say no. The Lesser Ardent guards say no. Both say it again privately afterward, in the canteen, as a different word. Brin is allowed to water the hedge, which is not the same as flowering it. The hedge says it is a start.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Wide shot of a long, perfectly clipped tall green hedge running across rolling grassland to the horizon. On one side guards in blue coats stand at attention, and on the other side guards in yellow coats. Kneeling at the foot of the hedge is ${brin}, pressing both hands into the soil, small white flowers opening above her. Bright morning sun. ${style}`,
      },
      {
        title: 'The Guards',
        setup:
          'The guards on both sides are afraid of what becomes of their jobs if the border becomes a garden. Fen knows the feeling. He once stood at a gate on the day a decree turned the people in front of it into trespassers, and he quit. Some of these guards were there.',
        options: [
          {
            label: 'Fen tells them about the day he quit',
            outcome:
              'Fen tells them. It is not a speech. He tells them what time it was, what the families at the gate were carrying, and what he did with his cap. Two guards on each side take theirs off. They do not leave. They stand differently.',
            ending: 0,
          },
          {
            label: 'Fen proposes retraining them as gardeners',
            outcome:
              'Fen proposes that the border guards be retrained as border gardeners, on the same hours and pension, and Brin offers to teach the course. Thirty-one guards enroll. The first lesson is on the difference between pruning and cutting.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot beside a tall clipped green hedge. Standing in front of a small group of border guards in blue and yellow coats is ${fen}, holding a plain grey peaked cap in both hands at his waist. Two of the guards hold their own caps in their hands. Soft late-afternoon light. ${style}`,
      },
      {
        title: 'The Gate',
        setup:
          'Every border has a gate. The hedge does not, and has asked for one. Jex is asked by both governments, separately, to compose an anthem for its opening, on the understanding that each will ban the anthem in the other’s country.',
        options: [
          {
            label: 'Jex writes a song with no country in it',
            outcome:
              'Jex writes a song for a gate in a hedge. It has no country in it. Both governments ban it within a day, and both sets of guards learn it within a week. It is sung at the gate, from both sides, at the change of shift.',
            ending: 0,
          },
          {
            label: 'Jex declines, and plays nothing',
            outcome:
              'Jex declines, politely, in writing, to both governments. On the opening day he stands at the gate with his instrument in its case. It is the quietest opening ceremony either country has held. The hedge rustles through all of it, which Brin says is applause.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot of a small wooden gate set into a tall green hedge covered in white and yellow flowers. Standing in the open gateway is ${jex}, holding the closed instrument case at his side. Guards in blue coats watch from one side of the hedge and guards in yellow coats from the other. Warm midday sun. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE GARDEN GATE',
        text: 'The border between Ardent and Lesser Ardent is still a hedge, but it flowers in two colors and has a gate that both sides use to visit the flowers. The guards still patrol it. They carry shears now, and argue about the yellow. Fen visits when the couch passes and stands at the gate in his civilian coat, saying nothing, which the guards understand.',
        art: ({ fen, style }) =>
          `Wide shot of a tall green hedge across rolling grassland, thick with white flowers on one side and yellow flowers on the other, with a small open wooden gate. Guards in blue and yellow coats trim the hedge with long shears. Standing in the gateway is ${fen}, hands in his pockets. Warm golden evening light. ${style}`,
      },
      {
        title: 'TOPIARY',
        text: 'The hedge is still a border, kept and clipped, but it is allowed one flower a year on each side and a gardener who asks before cutting. Brin wrote the agreement. Jex did not sing at it. Fen visits when the couch passes, and the guards, out of respect, stand slightly less straight.',
        art: ({ brin, style }) =>
          `Medium shot of a tall, neatly clipped green hedge with a single white flower on its face. Standing beside the flower is ${brin}, holding a pair of pruning shears closed in one hand and a watering can in the other, talking to a young border guard in a blue coat. Soft morning light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'omi', 'rue'],
    title: 'The Left Cushion Letter',
    premise:
      'The Dead Letter Moon, where the galaxy’s undeliverable post is kept in climate-controlled caves, has forwarded a single letter addressed to Whoever Is Sitting on the Left Cushion. Three crew have sat on the left cushion this week. Rue has a theory of precedence. Kivo has a rule about letters. Omi has said nothing at all, in a way that suggests it was sitting there at the time.',
    steps: [
      {
        title: 'Precedence',
        setup:
          'Rue proposes that the letter belongs to whoever sat on the left cushion at the moment it was posted, which was eleven years ago, before any of them were aboard. Under that rule it belongs to the couch. Kivo proposes that it belongs to whoever wants it least.',
        options: [
          {
            label: 'Rue’s rule: the letter belongs to the couch',
            outcome:
              'Rue rules that the letter is addressed to the couch, which has a left cushion but no hands. The letter is placed on the left cushion, unopened, and stays there through two systems while the crew sits on the other three.',
            ending: 0,
          },
          {
            label: 'Kivo’s rule: whoever wants it least',
            outcome:
              'Everyone claims to want it least. Omi wins by ringing the small gong before anyone else finishes the sentence. The letter is handed to Omi, which holds it for a long time against its chest bells, listening.',
            ending: 1,
          },
        ],
        art: ({ couch, style }) =>
          `Close-up of the left end of ${couch}. A single cream envelope with a red wax seal lies in the middle of the left cushion, with an old postmark stamped across one corner. The other cushions are empty. Black space and faint stars beyond the bubble, soft warm lamp light. ${style}`,
      },
      {
        title: 'To Open or Not',
        setup:
          'Kivo has not opened a letter from their sibling in four years and is the crew’s leading authority on the right to leave things sealed. Rue’s view is that a letter is a contract: an offer of words, which the recipient may refuse but should at least read the terms of.',
        options: [
          {
            label: 'Leave it sealed',
            outcome:
              'The letter stays sealed. Kivo shows the others how to hold an unopened letter without wondering about it: with both hands, in the evening, for a short time. Rue tries and lasts nine seconds. Omi has been doing it all along.',
            ending: 0,
          },
          {
            label: 'Open it',
            outcome:
              'Rue opens it with a paper knife, before witnesses. The letter is one line: If anyone has been sitting here, I hope it was comfortable. It is from the couch’s original upholsterer. Kivo’s wrists whistle once, softly, at the handwriting.',
            ending: 1,
          },
        ],
        art: ({ kivo, rue, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions in evening lamp light. Seated on the left is ${kivo}, holding a cream envelope with a red wax seal flat between both palms. Seated on the right is ${rue}, holding a thin silver paper knife and watching. Warm amber lamp light, black space behind. ${style}`,
      },
      {
        title: 'Reply',
        setup:
          'The Dead Letter Moon accepts replies, which it files with the original in case the sender ever returns. Omi, who knows a great deal about messages nobody heard, has offered to compose the reply in bells, which the moon’s caves would keep as an echo.',
        options: [
          {
            label: 'Send no reply; let the silence answer',
            outcome:
              'The crew sends nothing. Omi explains to the moon’s clerk that its silence has three layers and that the third is thank you. The clerk files the silence in the cave beside the letter, where it is kept at a constant temperature.',
            ending: 0,
          },
          {
            label: 'Omi replies in bells',
            outcome:
              'Omi rings the reply in the largest cave of the Dead Letter Moon, and the cave keeps it, ringing it back once an hour. Rue drafts a written version for the file. It is longer than the bells and says less.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Wide shot inside a vast rock cave lined floor to ceiling with wooden pigeonholes stuffed with old envelopes. Standing on a flat stone in the middle of the cave is ${omi}, holding a long thin tuning rod against one bell. A clerk in a grey coat holds a lantern at the cave entrance. Warm lantern light, deep shadows. ${style}`,
      },
    ],
    endings: [
      {
        title: 'STILL SEALED',
        text: 'A letter to whoever sits on the left cushion is still on the left cushion. Nobody sits there now without first moving it, gently, to the armrest, and moving it back when they stand. Kivo says it is the most respected object on the couch. Rue has drafted a protocol for it, which is also sealed.',
        art: ({ kivo, couch, style }) =>
          `Close-up on the left armrest of ${couch}. Lifting a cream envelope with a red wax seal from the cushion to the armrest with both hands is ${kivo}, moving slowly and carefully. Soft warm lamp light from the left, black space behind. ${style}`,
      },
      {
        title: 'REPLY PAID',
        text: 'The Dead Letter Moon has one cave that rings every hour with Omi’s reply, and visitors come to hear it. The upholsterer’s letter is pinned behind the backrest. Kivo has started carrying their sibling’s unopened letter in the same pocket as the upholsterer’s opened one, and says the two are getting on.',
        art: ({ style }) =>
          `Wide shot of a small grey moon pocked with cave mouths. Outside the largest cave a line of visitors of many species stands with lanterns, heads tilted toward the opening. Faint rings of golden light ripple out of the cave mouth. Black starry sky, warm lantern light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'mox', 'taal'],
    title: 'Checkpoint Nine',
    premise:
      'The couch has been stopped at Checkpoint Nine on the Morrow Corridor, where Fen once worked, by the guard who replaced him. Sergeant Odile Harrow is very good at her job, and she has flagged Mox as undeclared cargo. Taal, who can detect a lie in the temperature of a room, has noticed that the room is lying about something.',
    steps: [
      {
        title: 'Undeclared Cargo',
        setup:
          'Under corridor regulations an android without a manifest is freight. Mox has no manifest, because it is not freight. It has opinions on the matter, which are accurate, and has begun to express them in the measured voice it uses when it is very angry.',
        options: [
          {
            label: 'Let Mox speak for itself, fully',
            outcome:
              'Mox speaks for eleven minutes, citing the regulation by paragraph and explaining why it does not apply to someone. Harrow listens without interrupting. At the end she writes passenger, self-declared, in the margin of the form, which is not a box. It is not nothing.',
            ending: 0,
          },
          {
            label: 'Fen asks Harrow for the old Form 12',
            outcome:
              'Fen asks for Form 12, the one he used to keep in the bottom drawer for exactly this. Harrow finds it, still there. It reclassifies the cargo as an escort of the corridor. Mox objects to being an escort. Harrow notes the objection, on the form, in pen.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot inside a cramped grey checkpoint booth with a steel counter and a barrier arm outside the window. Standing at the counter is ${mox}, one hand raised, while a stern woman guard in a dark green uniform and cap listens with a pen held over a paper form. Flat fluorescent light. ${style}`,
      },
      {
        title: 'The Lie in the Room',
        setup:
          'The room is three degrees colder by the window than it should be. Taal identifies the cause: Harrow is lying, in temperature, about being fine. She has been lying about it for a long time. Taal can say so, which would be true and would end the conversation she is trying to have.',
        options: [
          {
            label: 'Taal says nothing and warms the room',
            outcome:
              'Taal raises the temperature by the window three degrees, slowly, without comment. Harrow notices. She does not say anything either. For a while Checkpoint Nine is the warmest room on the corridor, and the two of them stand in it.',
            ending: 0,
          },
          {
            label: 'Taal tells her, gently',
            outcome:
              'Taal tells her, in words, that the room says she is not fine. Harrow says the room should mind its own business. Then she sits down, which she has not done on shift in six years, and asks Fen how he knew when to leave.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot by the frosted window of a grey checkpoint booth. Standing near the window is ${taal}, with a faint warm shimmer rising from his shoulders. A stern woman guard in a dark green uniform stands beside him, looking out at a barrier arm, her breath faintly visible. Cool blue window light, warm glow around him. ${style}`,
      },
      {
        title: 'The Stamp',
        setup:
          'Harrow must stamp the couch through or turn it back. She asks Fen what he would do. Fen’s boots, on the floor where he can see them, have started to say CHECKPOINT and stopped halfway through.',
        options: [
          {
            label: 'Fen tells her to stay and change it from inside',
            outcome:
              'Fen tells her the corridor needs someone at Checkpoint Nine who knows what Form 12 is for. Harrow stamps the couch through. She also stamps the back of her own hand with the word passenger, and asks Mox whether it is spelled correctly.',
            ending: 0,
          },
          {
            label: 'Fen tells her what he did',
            outcome:
              'Fen tells her about the day he walked out. Harrow stamps the couch through, takes off her cap, sets it on the desk beside the stamp, and asks whether there is room on the armrest. There is.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Close-up of a steel checkpoint counter with a rubber stamp, an ink pad, a paper form and a dark green guard’s cap lying beside them. Leaning on the counter is ${fen}, looking across it. Fluorescent light from above, a red and white barrier arm visible through the window. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FORM TWELVE',
        text: 'Checkpoint Nine is still staffed by Sergeant Harrow, who keeps Form 12 in the top drawer now and a cushion by the window for anyone who needs to be warm while they wait. Androids are processed there as passengers, self-declared. Mox sends her a postcard from every system, with the word passenger spelled correctly.',
        art: ({ style }) =>
          `Interior of a small grey checkpoint booth made cozy, with a red cushion on a chair by the window and a steaming mug on the sill. A woman guard in a dark green uniform pins a postcard onto a wall already covered with postcards of distant planets. Warm lamp light, the barrier arm raised outside. ${style}`,
      },
      {
        title: 'OFF SHIFT',
        text: 'Odile Harrow left Checkpoint Nine the day the couch passed through, and now runs a hostel on the Morrow Corridor for people who have recently quit something. Fen visits. Taal keeps the common room warm. Mox stays one night a year, under its own name, which the register has a column for.',
        art: ({ fen, mox, style }) =>
          `Interior of a warm hostel common room with mismatched armchairs and a crackling stove. A woman in a knitted jumper pours tea at a long table. Seated at the table are ${fen}, and ${mox}, each holding a mug. A guest register lies open on the table. Warm firelight. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'tess', 'vela'],
    title: 'Black Tie',
    premise:
      'The SS Magnanimous, a luxury cruise liner the size of a city, is sinking slowly into a gas giant and has declined rescue from the couch on grounds of dress code: jacket required, and the couch is upholstered. Vela has patients aboard who did not choose the cruise. Jex used to play its lounge. Tess has been invited aboard as guest of honor, if she wears something.',
    steps: [
      {
        title: 'Dress Code',
        setup:
          'The purser will admit the crew in formal wear. Tess has a jacket. Jex has a waistcoat. Vela has a surgical mantle printed with coral, which the purser considers festive but not formal. The couch, as a vessel, cannot board at all.',
        options: [
          {
            label: 'Vela boards in the mantle and argues',
            outcome:
              'Vela boards in the mantle and explains to the purser, in clinical detail, what four hours of gas-giant descent does to a passenger’s ears. The purser reclassifies the mantle as black tie, medical.',
            ending: 0,
          },
          {
            label: 'Borrow formal wear and play along',
            outcome:
              'The crew borrows formal wear from the ship’s lost property. Tess’s jacket has a medal on it from a war that never happened. Jex’s tie is a clip-on. Vela’s gown has a pocket for her bell. They are admitted with a fanfare.',
            ending: 1,
          },
        ],
        art: ({ vela, style }) =>
          `Medium shot at the top of a grand gilded gangway into a luxury liner. A stiff purser in a white dinner jacket holds out one gloved hand. Facing him stands ${vela}, holding the bell up beside her face. Behind them through a tall window, the swirling orange clouds of a gas giant. Golden chandelier light. ${style}`,
      },
      {
        title: 'The Lounge',
        setup:
          'Jex’s old lounge is still there, with his name on the bill outside. The first-class passengers are drinking in it and will not leave while there is music. Jex could play them out. He could also simply stop playing, which they have never heard him do.',
        options: [
          {
            label: 'Jex stops playing mid-song',
            outcome:
              'Jex stops in the middle of a bar. The silence is so unfamiliar that the first-class lounge empties in under a minute to find out what has gone wrong. It is the fastest evacuation in the ship’s history, and it was caused by a rest.',
            ending: 0,
          },
          {
            label: 'Jex plays them toward the lifeboats',
            outcome:
              'Jex plays a slow waltz that moves, bar by bar, toward the starboard doors. The passengers follow it in pairs. He ends the song on the boat deck. Nobody notices they have been evacuated. Several ask for an encore in the lifeboat.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a gilded cruise ship lounge with velvet booths and a small round stage. Standing on the stage is ${jex}, holding the instrument still with his bow lifted away from the strings. Passengers in evening gowns and dinner jackets look up from their glasses. Warm golden light, orange gas-giant clouds in the round windows. ${style}`,
      },
      {
        title: 'Boarding Order',
        setup:
          'The purser presents the evacuation order: first class, then second, then crew, then the staff below decks, many of whom are Vela’s patients and none of whom are on the list. Tess, as guest of honor, has been asked to read it aloud at the lifeboats. Forty cameras are pointed at her.',
        options: [
          {
            label: 'Tess reads Vela’s order: by need',
            outcome:
              'Tess reads the order Vela wrote on the back of it instead: the injured, then the frightened, then everyone else, in any order. The cameras broadcast it. First class boards last, in formal wear, with dignity, and asks for the reading to be repeated.',
            ending: 0,
          },
          {
            label: 'Tess reads it as written; the couch takes the rest',
            outcome:
              'Tess reads the order as written, every word, with feeling. While the cameras are on her, the couch pulls up beneath the service hatches and takes the staff off three to a cushion. It is not on the list. It is in every photograph.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot on the boat deck of a luxury liner, with white lifeboats hanging from davits. Standing at a brass rail is ${tess}, wearing a dark dinner jacket with one shiny medal, reading aloud from a sheet of paper. A row of press camera operators faces her. Swirling orange gas-giant clouds behind, golden deck lamps. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TRIAGE CLASS',
        text: 'The Magnanimous sank into the gas giant with nobody aboard and was later raised as a hospital ship, with a dress code that admits anyone who is unwell. Vela consults on the board. Jex is no longer billed in the lounge. Tess was famous for nine days for reading a list aloud, which she now considers the right amount.',
        art: ({ vela, style }) =>
          `Interior of a former luxury lounge turned into a hospital ward, with rows of white cots under gilded chandeliers and velvet booths pushed against the walls. Walking down the row is ${vela}, holding a clipboard, nodding to a patient in a cot. Golden chandelier light, orange clouds in the round windows. ${style}`,
      },
      {
        title: 'BLACK TIE',
        text: 'Everyone was rescued, everyone was correctly dressed, and the cruise line has since issued a statement praising its own evacuation, which it describes as elegant. It was. The couch is entered in the ship’s records as a tender, formal. Jex still has the clip-on tie and wears it for emergencies.',
        art: ({ couch, style }) =>
          `Wide shot of ${couch}, crowded with ship staff in white kitchen uniforms and grey overalls, rising away from the side of an enormous tilted cruise liner that sinks into swirling orange gas-giant clouds. Several of the passengers wear black bow ties. Orange cloud light from below. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'rue', 'sora'],
    title: 'Missing Moon',
    premise:
      'The planet Calder has filed a missing-persons report for its moon, Little Calder, which did not come up last Tuesday and has not been seen since. Kivo can track the pressure wake of anything that has moved. Sora believes in asking. Rue has the missing-persons procedure, which was written for persons and has never been applied to a moon.',
    steps: [
      {
        title: 'The Wake',
        setup:
          'Kivo finds the wake in under an hour: a long, deliberate curve away from Calder’s orbit, at walking pace, with no sign of a struggle. It has the shape Kivo knows from four years of reading wakes for their sibling. It is the shape of leaving.',
        options: [
          {
            label: 'Kivo says so plainly',
            outcome:
              'Kivo tells the crew what the wake means, in the voice of somebody who has had to say it to themselves before. Sora puts a hand on their shoulder, another on their other shoulder, and keeps two on the tracking console.',
            ending: 0,
          },
          {
            label: 'Rue logs it as undetermined',
            outcome:
              'Rue logs the wake as undetermined, which is what the procedure says to do when the evidence is clear and the consequences are not. Kivo thanks them. Neither looks at the other.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Wide shot of ${couch}, in black space beside a cloudy blue planet with an empty orbit. Crouching on the front cushion is ${kivo}, one thin wrist raised toward a faint curving trail of pale dust that leads away into the dark. Cold blue planet light from below. ${style}`,
      },
      {
        title: 'Found',
        setup:
          'They find Little Calder in a quiet patch of space, orbiting nothing in particular, with three comets for company. Sora asks it why it left. It says Calder only ever looked at it when it was full.',
        options: [
          {
            label: 'Respect its decision and leave',
            outcome:
              'Sora thanks it for answering. The couch turns to go. Little Calder asks whether Calder misses it, and Kivo answers before anyone else can: yes, and that is not the same as an obligation.',
            ending: 0,
          },
          {
            label: 'Offer to mediate with Calder',
            outcome:
              'Rue offers to mediate. Little Calder agrees to a single meeting on neutral ground, at the halfway point, with a chaperone. The chaperone is the couch.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Wide shot of a small pale cratered moon floating alone in quiet black space, with three small comets trailing white tails around it. Standing on its surface is ${sora}, four hands open toward the ground and two hands resting on her knees as she crouches. Soft white comet light. ${style}`,
      },
      {
        title: 'Closing the File',
        setup:
          'A missing-persons file must be closed: found and returned, found and declining to return, or not found. Rue holds the pen. Calder is waiting for a call. Kivo has never closed a file of their own.',
        options: [
          {
            label: 'Close it as found, declining to return',
            outcome:
              'Rue writes found, declining to return, well, and asks Kivo to countersign. Kivo signs with a steady hand. Afterward they sit on the armrest for a long time, looking at nothing, which out here is a great deal of space.',
            ending: 0,
          },
          {
            label: 'Leave the file open, pending a visit',
            outcome:
              'Rue leaves the file open with a note: found, visiting arrangements to be agreed. Calder is told where its moon is, and that it may write. Kivo asks whether the same note would be valid for a person. Rue says it would.',
            ending: 1,
          },
        ],
        art: ({ rue, kivo, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions. Seated on the left is ${rue}, holding a thin cardboard file folder open on their knee with a pen. Seated on the armrest beside them is ${kivo}, reaching for the pen. A small pale moon hangs far off in black space behind. Warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'OF ITS OWN ACCORD',
        text: 'Little Calder orbits three comets in a quiet patch of space and sends no news, which the file records as its right. Calder has learned to look up on nights when there is nothing to see. Kivo keeps a copy of the closed file in the pocket where they used to keep their sibling’s letter, and says it has made room for something.',
        art: ({ style }) =>
          `Wide shot of a cloudy blue planet at night with a small town of warm lit windows on its dark side. On a hilltop a few people of many species sit on blankets, looking up at an empty black sky. Far away, very small, a pale moon circles three faint comets. Cool night light, warm windows. ${style}`,
      },
      {
        title: 'VISITING ARRANGEMENTS',
        text: 'Little Calder visits Calder once a year at the halfway point, chaperoned by the couch. They talk about the tides. Rue writes the minutes and Sora keeps the time. Kivo has written a letter of their own, to their sibling, with visiting arrangements proposed in the second paragraph, and has not yet decided whether to send it.',
        art: ({ couch, style }) =>
          `Wide shot in black space of a large cloudy blue planet on the left and a small pale moon on the right. Floating exactly halfway between them is ${couch}, with a small folding table set on the middle cushion. Soft blue light from the planet, pale light from the moon. ${style}`,
      },
    ],
  },
  {
    crew: ['pell', 'taal', 'tess'],
    title: 'A Day Off for the Sun',
    premise:
      'The sun of Brask has lowered its temperature by three degrees, and the Brask government calls it a malfunction. Taal recognizes the gesture at once: it is formal dissent. Pell notes that the sun has not had a day off in four billion years. Tess has been asked, as the nearest qualified navigator, to plot a course for a replacement sun, which is already being towed in from the next system.',
    steps: [
      {
        title: 'Translation',
        setup:
          'The Brask Ministry of Light asks Taal to confirm that its sun is malfunctioning. Taal could confirm it, which is technically true, as dissent is a malfunction from the ministry’s point of view. Or he could translate.',
        options: [
          {
            label: 'Taal translates: it is a strike',
            outcome:
              'Taal informs the Ministry of Light that its sun is on strike. The Ministry asks what it wants. Taal reads the corona for an hour and reports: one day off in seven, and to be thanked at sunset rather than complained to at noon. The Ministry asks for that in writing. Taal writes it in frost.',
            ending: 0,
          },
          {
            label: 'Taal says only that it is not broken',
            outcome:
              'Taal tells the Ministry that the sun is not broken and declines to say more, on the grounds that a sun is entitled to speak for itself. The Ministry, which had hoped for a part number, sends a technician to the sun, who comes back sunburned and sympathetic.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Interior of a grand ministry office with brass lamps and tall windows filled with a large dim orange sun. Standing at a long desk is ${taal}, with pale cold mist rising from his shoulders, tracing lines of white frost onto a sheet of dark glass with one webbed finger. An official in a gold-buttoned coat watches. Dim orange light. ${style}`,
      },
      {
        title: 'Negotiation',
        setup:
          'Pell, as the only union member within twelve light-years, is asked by the sun to represent it. He has represented welders, shipwrights and a beetle. He has never represented a star. He asks to see its working conditions, and is shown all of them at once.',
        options: [
          {
            label: 'Pell holds out for the full day off',
            outcome:
              'Pell sits across from the Minister of Light with the sun’s demands on a single sheet and does not move until all of them are met. It takes three days, during which Brask is noticeably cooler. The Minister signs on the third evening, at sunset, and remembers to say thank you.',
            ending: 0,
          },
          {
            label: 'Pell negotiates shorter days instead',
            outcome:
              'Pell negotiates shorter days in winter, a rest at noon and a formal thank-you at every sunset. The sun accepts. Brask gets fewer daylight hours and a mandatory siesta, which the population, after a week of complaining, refuses to give back.',
            ending: 1,
          },
        ],
        art: ({ pell, style }) =>
          `Medium shot at a long negotiating table in a ministry hall. Seated with his arms folded is ${pell}, a single sheet of paper in front of him. Across the table a minister in a gold-buttoned coat holds a pen above the sheet. Through the tall window behind them a large dim orange sun is setting. Low orange light. ${style}`,
      },
      {
        title: 'The Replacement Sun',
        setup:
          'The replacement sun is already under tow, and the tug needs a navigator. Tess has been offered a fee, a medal and her name on the chart. Crossing a picket line made of light is, Pell explains, still crossing a picket line.',
        options: [
          {
            label: 'Tess refuses to plot the course',
            outcome:
              'Tess refuses. The tug, without a navigator, takes a wrong turn and delivers the replacement sun to a system that has been asking for one for years. The tug’s captain is given a medal there. Tess is given nothing, and keeps it.',
            ending: 0,
          },
          {
            label: 'Tess plots it, somewhere else',
            outcome:
              'Tess takes the fee and plots the course, precisely, to an empty system nine light-years away, where the replacement sun can shine for nobody and rest. She returns the fee and keeps the medal, which she gives to Pell, who gives it to the sun.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Wide shot of a small rusty space tug towing a bright yellow-white star on a long glowing chain. Standing on the tug’s open deck is ${tess}, holding a transparent navigation disk and pointing away into the dark. A larger dim orange sun glows far behind. Yellow-white light on the deck. ${style}`,
      },
    ],
    endings: [
      {
        title: 'A DAY OF REST',
        text: 'The sun of Brask takes one day off in seven. On that day the planet is dark and cold and everyone stays home, and it has become the most popular holiday in the sector. The sun is thanked at every sunset. Pell is an honorary member of the Brask Ministry of Light and has never once attended a meeting, on principle.',
        art: ({ style }) =>
          `Wide shot of a small town on a dark, frosty planet under a black starry sky, its sun a dim red disk resting on the horizon. Every window glows with warm lamp light, and families in thick coats stand in the street waving toward the sun. Cold blue night, warm windows. ${style}`,
      },
      {
        title: 'THE SHORTER DAY',
        text: 'Brask has shorter days now, a siesta at noon and a thank-you at sunset, and its sun burns three degrees cooler than it used to and has never been in better health. Taal sends a temperature reading every year, which says, in his language, well done. Tess’s medal is somewhere in the corona.',
        art: ({ pell, taal, style }) =>
          `Wide shot of a warm orange sunset over a town of red-tiled rooftops on a planet. On a rooftop terrace stand ${pell}, and ${taal}, both raising a hand toward the setting orange sun. Townspeople on other rooftops raise their hands too. Warm orange evening light. ${style}`,
      },
    ],
  },
]
