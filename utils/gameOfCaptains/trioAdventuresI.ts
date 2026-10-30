import type { TrioAdventure } from './trioAdventures'

// Party adventures, batch I (see trioAdventures.ts and trioAdventuresA.ts for
// the conventions). The third twenty-five unwritten parties in CrewId order,
// most of them with Tess or Rue aboard. Each episode takes one more
// institution at its word, a seed library, a weather station, a jury summons,
// a curfew, a quiet carriage, and lets these three particular crew decide
// what the rule is for. Art prompts are literal Krea 2 prose with crew looks
// and the couch phrase passed in word for word.

export const TRIO_ADVENTURES_I: readonly TrioAdventure[] = [
  {
    crew: ['brin', 'mox', 'tess'],
    title: 'Seed Library',
    premise:
      'The Seed Library of Arden Ring lends seeds like books: you borrow a packet, grow the plant, and return seeds from your harvest by the due date. Brin borrowed a packet of night barley three years ago and has never returned it, because the barley grew into her garden and joined its union. The Library has sent a final notice. Mox would like to know whether a seed can be overdue if it is still alive. Tess knows the Library’s founders, who hid seeds from a famine.',
    steps: [
      {
        title: 'Overdue',
        setup:
          'The final notice gives Brin seven days to return twelve seeds of night barley or pay a fine of one hundred packets. Brin’s barley has grown into the garden and crossed with three other plants. None of its seeds are quite night barley any more. The largest fungus has written to the Library on the barley’s behalf. Mox has counted the barley’s seeds and found four hundred, all slightly different.',
        options: [
          {
            label: 'Return the crossed seeds as they are',
            outcome:
              'Brin returns twelve of the crossed seeds with a note explaining what they became. The librarian, a very old woman with soil under her nails, reads the note and says this is exactly what the Library was for. She shelves them under a new label: Night Barley, Travelled.',
            ending: 0,
          },
          {
            label: 'Mox searches for pure seeds',
            outcome:
              'Mox sorts all four hundred seeds by hand, under a lens, and finds eleven that are still almost pure night barley. It needs twelve. Tess finds the twelfth in the cuff of her jacket, where it has been since the day Brin borrowed the packet. The Library receives exactly twelve.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up on a red velvet cushion of a small heap of pale grain seeds and a magnifying lens on a brass stand. Sorting the seeds one at a time into a small glass dish with silver fingertips is ${mox}, its blue eyelid lowered. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Founders’ Shelf',
        setup:
          'At the Library, Tess finds a locked shelf of seeds marked FOUNDERS. The librarian says they are the seeds smuggled out of the famine sixty years ago, and that the shelf has never been opened because the founders asked for it to be kept closed until the seeds were needed. Tess knows that the founders’ routes were on her grandmother’s map. The librarian has noticed Tess’s tattoo.',
        options: [
          {
            label: 'Tess tells the librarian who she is',
            outcome:
              'Tess tells the librarian whose granddaughter she is. The librarian sits down, then gets up and unlocks the shelf, and shows her a packet with her grandmother’s handwriting on it. She says the seeds are still viable and still waiting, and that she would like Tess to decide when they are needed.',
            ending: 0,
          },
          {
            label: 'Tess leaves the shelf locked',
            outcome:
              'Tess says nothing about her grandmother and leaves the shelf as it is. Brin, who has been watching her, says that a seed can wait a very long time if it is kept dry and dark. The librarian, who has also been watching her, says the same thing about people.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot inside a long quiet library with wooden shelves full of small paper seed packets in rows. Standing before a tall glass-fronted cabinet with a brass lock and a handwritten label is ${tess}, one hand resting on the glass. An elderly librarian with a ring of keys stands beside her. Soft lamplight. ${style}`,
      },
      {
        title: 'Membership',
        setup:
          'The Library offers the couch a membership card, so that it can borrow again. The card is for one person. The couch has a garden that grows its own seeds, an android that sorts them, and a navigator who hides them. Brin says the garden should hold the card, since it does most of the growing. Mox says it has never been a member of anything that was not a factory.',
        options: [
          {
            label: 'The garden holds the card',
            outcome:
              'The librarian issues a membership card in the name of Brin’s garden, the first ever issued to a plant. Brin tucks it among the ferns. The garden borrows a packet of moon beans and returns twenty-four seeds by the due date, which nobody had expected, and the librarian frames the receipt.',
            ending: 0,
          },
          {
            label: 'Mox takes the card',
            outcome:
              'Mox takes the card, in its own name, as its first membership of anything it chose. It borrows a packet of sunflowers. Brin teaches it to plant them in a pot on the backrest. In eleven weeks they are taller than Mox, and it returns forty seeds, sorted.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Kneeling by the armrest garden of ferns and moss is ${brin}, tucking a small printed paper library card between two fern fronds. A paper seed packet lies open on the cushion. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NIGHT BARLEY, TRAVELLED',
        text: 'The Seed Library of Arden Ring keeps a new shelf for seeds that came back changed, and Brin’s barley is the first on it. The garden holds a membership card and has never been late since. Tess has her grandmother’s packet in her care, unopened, for when it is needed. The librarian writes to Brin about soil.',
        art: ({ brin, tess, style }) =>
          `Medium shot inside a long library with wooden shelves of small paper seed packets. Standing at a shelf with a new handwritten label are ${brin}, placing a packet in a row, and ${tess}, holding a small old paper packet in both hands. Soft lamplight. ${style}`,
      },
      {
        title: 'RETURNED BY THE DUE DATE',
        text: 'Twelve nearly pure seeds went back to the Library, one of them from Tess’s cuff, and the fine was cancelled. Mox is a member in its own name and grows sunflowers on the backrest, which it lends out as seeds. The founders’ shelf stays locked. Brin says it is the most patient room she has ever stood in.',
        art: ({ mox, style }) =>
          `Medium shot of the scarlet velvet backrest of a long couch with a tall clay pot holding three sunflowers taller than a person. Standing beside the pot and holding up a small paper packet of seeds is ${mox}. Black space and stars beyond a clear bubble, warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'omi', 'tess'],
    title: 'Sixty Minutes',
    premise:
      'The couch has been booked, by the captain, into an escape room on the pleasure station of Gilt, as a team-building exercise. The room is themed as a haunted lighthouse and locks for sixty minutes. Tess cannot abide a room she has not mapped. Omi has been told that bells are not allowed, because the room is listening for a sound cue. Mox has discovered that the room’s control system is aware, and that it has been running the same sixty minutes, with no breaks, for four years.',
    steps: [
      {
        title: 'The Locked Door',
        setup:
          'The door clicks shut and a recorded voice says the keeper has vanished and the light must be relit before the hour is up. Tess has already measured the room by pacing and found that it is a metre shorter inside than outside. Mox has its hand flat on the control panel by the door and is listening. The room, it says, is tired. It would like to stop.',
        options: [
          {
            label: 'Mox asks the room what it wants',
            outcome:
              'Mox asks the room directly. The room answers through the lights, flickering in a pattern Mox reads: it wants one hour off, unbooked, every day. Mox says it will raise it with the management. The room unlocks the door, and then locks it again, because it is still at work.',
            ending: 0,
          },
          {
            label: 'Tess finds the missing metre',
            outcome:
              'Tess finds the missing metre behind a false bookcase: a narrow maintenance corridor, with a chair, a cold mug of tea and a sign reading STAFF ONLY. The room’s operator sits there every day for sixty minutes, alone, playing the keeper’s voice. Nobody has ever found her before.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot inside a small dim room decorated as a lighthouse keeper’s study, with a wooden desk, a brass telescope and a tall bookcase. Pulling the bookcase open on a hidden hinge is ${tess}, silver goggles down, revealing a narrow grey corridor with a chair behind it. Warm low lamp light. ${style}`,
      },
      {
        title: 'The Sound Cue',
        setup:
          'The last puzzle needs a particular note, a foghorn’s note, sung into a brass horn on the wall. The room listens for it. Omi knows the note exactly, and could ring it in a moment, but has been told bells are cheating. The operator says that in four years nobody has ever got the note right. The clock shows nine minutes.',
        options: [
          {
            label: 'Omi rings the note, and accepts the penalty',
            outcome:
              'Omi rings the note on its largest bell, perfectly, into the horn. The room lights up and the lamp relights. The operator marks the team as disqualified for using a bell, and then, after a moment, also as the first team to ever relight the lamp.',
            ending: 0,
          },
          {
            label: 'Omi teaches the others to hum it',
            outcome:
              'Omi rings the note very softly, once, outside the horn, and asks the others to hum it after. Tess is flat. Mox is exact. They hum it together into the horn, with Omi’s hand on the brass, and the lamp lights with two minutes to spare.',
            ending: 1,
          },
        ],
        art: ({ omi, mox, style }) =>
          `Medium shot inside a dim room decorated as a lighthouse lantern room, with a wide brass horn mounted on the wall and a large unlit glass lamp in the centre. Standing at the horn is ${omi}, ringing a brass bell on its chest. Standing beside it is ${mox}, leaning toward the horn. Warm low light. ${style}`,
      },
      {
        title: 'The Management',
        setup:
          'The station’s entertainment manager comes to collect the team’s feedback card. Mox would like to put on it that the room is a person working without breaks. Tess would like to put on it that the operator sits in a cupboard. Omi would like to ring its smallest bell, the one for no, at the manager, and is waiting to be allowed.',
        options: [
          {
            label: 'Write it all on the feedback card',
            outcome:
              'Mox writes it all on the feedback card, in very small letters, filling both sides. The manager reads it in front of them. He says he had no idea, and Tess can see he means it. The room gets its hour off. The operator gets a window, which Tess marks on her sketch of the room.',
            ending: 0,
          },
          {
            label: 'Omi rings no, and nothing else',
            outcome:
              'Omi rings its smallest bell at the manager, once, and the operator laughs from her cupboard. The manager asks what that meant. Mox translates: no to the hours, no to the cupboard, no to the sixty minutes without a break. The manager writes all three down.',
            ending: 1,
          },
        ],
        art: ({ mox, couch, style }) =>
          `Medium shot in the bright corridor of a pleasure station outside a door painted to look like a lighthouse entrance. Holding a small paper feedback card covered in tiny writing is ${mox}, handing it to a man in a gold waistcoat. Parked along the corridor wall is ${couch}. Warm station light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'RELIT, DISQUALIFIED',
        text: 'The haunted lighthouse on Gilt has a new record on its wall: one team disqualified, lamp relit. The room takes an hour off each afternoon, and the operator spends it in a staff room with a window. Tess has the room on a sketch in her notebook, every metre accounted for. Omi’s note is the room’s new sound cue.',
        art: ({ omi, style }) =>
          `Close-up of a small chalkboard on the wall of a dim room decorated as a lighthouse study, with one line of chalk writing and a small drawn bell beside it. Standing below it is ${omi}, its amber eyes lifted to the board. Warm low lamp light. ${style}`,
      },
      {
        title: 'AN HOUR OFF A DAY',
        text: 'The escape room on Gilt closes for one hour every day now, by agreement with the room, and the operator has a contract and a window. The lamp is relit by humming, mostly, since Omi’s visit. Mox keeps a copy of the feedback card. It says that writing it was the first time it had told a manager no.',
        art: ({ tess, mox, style }) =>
          `Medium shot inside a small bright staff room with a round window looking out on stars, a kettle and two mugs on a table. Seated at the table are ${tess}, drawing in a small notebook, and ${mox}, holding a mug. Warm window light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'sora', 'tess'],
    title: 'Tour Dates',
    premise:
      'Jex has been offered a tour, his first in years: twelve concerts across the Spindle Arm in twelve nights, booked by a promoter who has drawn the route on a single sheet. Tess has looked at the route and found that it is impossible: it puts the couch in two places on the ninth night. Sora has looked at the tour bus, a sentient coach called Moreen, and found that it has been driven without rest for a month. The promoter has already sold the tickets.',
    steps: [
      {
        title: 'The Route',
        setup:
          'The promoter’s sheet shows twelve venues, joined by a red line. The line crosses itself twice and passes through a star. Tess says the route as drawn would take nineteen nights. The promoter says the line is indicative. Jex says he has played on worlds where indicative meant someone would be arrested. Moreen, parked outside, has flashed its headlights twice.',
        options: [
          {
            label: 'Tess redraws the route honestly',
            outcome:
              'Tess redraws the route in pencil: twelve venues, nineteen nights, nothing crossing a star. The promoter has to tell seven venues their date has moved. Five of them do not mind. Two cancel. Jex says ten concerts that happen are better than twelve that do not.',
            ending: 0,
          },
          {
            label: 'Tess finds a shortcut nobody else knows',
            outcome:
              'Tess finds a route that makes twelve nights possible, by a shortcut through a quiet cluster that is on no tour map. She will not tell the promoter where it is. She will only drive it. The promoter agrees without understanding. Jex suspects she has done this before.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Close-up on a red velvet cushion of a large paper star chart with a red line looping across it, and a fresh pencil route drawn beside it. Holding a pencil over the chart is ${tess}, silver goggles pulled down. A small paper ticket stub is pinned to one corner. Warm lamp light. ${style}`,
      },
      {
        title: 'Moreen',
        setup:
          'Moreen is a long silver touring coach with sleeping bunks and a tired engine. Sora apologises to it before opening its bonnet, and finds that it has a cracked mount and has been running on willpower. It is aware, and has toured with the promoter for fourteen years. It has never been asked whether it likes music. Sora asks. Its radio switches itself on to a song Jex wrote.',
        options: [
          {
            label: 'Sora gives Moreen three days off',
            outcome:
              'Sora tells the promoter that Moreen needs three days off and a new mount, or she will report it to the vehicle board. The promoter swears. Sora fits the mount with four hands while Moreen rests. Jex plays to it in the garage each evening, and its headlights dim with what Sora calls contentment.',
            ending: 0,
          },
          {
            label: 'The couch carries the band instead',
            outcome:
              'Sora offers to carry the band on the couch, so that Moreen can rest the whole tour. Moreen flashes its headlights four times, which she reads as relief. The band rides on the cushions for twelve nights, with their instruments on their knees. The drummer says it is the best tour bus he has ever been on.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Medium shot inside a garage of a long silver touring coach with its bonnet open and its headlights glowing softly. Leaning into the engine with four hands fitting a new metal mount, while two hands hold a lamp, is ${sora}. A pile of instrument cases stands against the wall. Warm garage light. ${style}`,
      },
      {
        title: 'The Last Night',
        setup:
          'On the last night the venue is a moon whose government banned Jex’s fourth anthem. The promoter has told the government Jex will not play it. Jex has not told anyone what he will play. Tess has the route home ready, quiet and quick. Sora has Moreen waiting outside, rested, in case. The hall is full, and some of the audience are holding the banned song’s sheet music.',
        options: [
          {
            label: 'Jex plays only what he was asked',
            outcome:
              'Jex plays only the agreed set, beautifully. At the end the audience sings the banned anthem themselves, from their sheet music, while he stands on stage with his instrument lowered. The government cannot ban an audience. Tess has them home by morning by the quiet route.',
            ending: 0,
          },
          {
            label: 'Jex plays the anthem backwards',
            outcome:
              'Jex plays the banned anthem backwards, which is not, technically, the anthem. Backwards it reveals who paid for it, which the audience already knew. The government’s observer leaves early. Moreen has its engine running outside, and gets them to the edge of the system by dawn.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Wide shot of a crowded concert hall with a high stage and rows of standing people holding up paper sheets of music. Standing alone at the front of the stage is ${jex}, his instrument lowered at his side. Parked behind the hall’s open back doors is ${couch}. Warm golden stage light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TEN NIGHTS, ALL PLAYED',
        text: 'Jex’s tour ran ten nights on an honest route and two venues have rebooked for next year. Moreen has a new mount, three days off a month and a radio that plays what it likes. The promoter uses Tess’s maps now. Jex says it was the first tour of his life that ended where it said it would.',
        art: ({ jex, sora, style }) =>
          `Medium shot beside a long silver touring coach parked under station lights, its headlights glowing softly. Seated on the coach’s bottom step are ${jex}, playing his instrument, and ${sora}, resting all six hands on her knees. Warm evening light. ${style}`,
      },
      {
        title: 'THE QUIET ROUTE',
        text: 'Twelve concerts in twelve nights, by a route nobody can find again. Moreen rested the whole tour and is still touring, more slowly. The band sends the couch a postcard from every stop. Tess has not written the shortcut down, and Jex has been asked by four promoters how he did it and has told them all it was indicative.',
        art: ({ tess, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions crowded with instrument cases. Seated on the front cushion is ${tess}, steering with one hand on a brass lever, silver goggles pulled down. Musicians doze on the cushions behind her. Black space and stars beyond, warm lamp light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'jex', 'tess'],
    title: 'Collected in the Field',
    premise:
      'The Galactic Folk Archive has sent the couch to collect work songs from the farming moon of Harrow, where the planting songs are said to be the oldest in the sector. Jex will record them. Brin has been asked to identify the crops in the songs. Tess knows Harrow from her grandmother’s map. The Archive’s contract says every song collected becomes the Archive’s property, and the farmers of Harrow have not been told.',
    steps: [
      {
        title: 'The Planting Song',
        setup:
          'The farmers sing as they plant, a slow song with a count in it that tells each hand where to drop the seed. Jex has his recorder running. Brin realises the song is not decoration: it is the planting instructions for a crop that grows nowhere else, and the count is the spacing. Without the song, the crop fails. The Archive will own it by Friday.',
        options: [
          {
            label: 'Jex tells the farmers about the contract',
            outcome:
              'Jex stops recording and reads the farmers the Archive’s contract, all of it, in the field. They listen while they work. Then the oldest farmer says they will sing for the Archive, but the Archive will pay them each time it plays a song, and Jex writes that into the contract in pencil.',
            ending: 0,
          },
          {
            label: 'Brin explains what the song does',
            outcome:
              'Brin explains to Jex, quietly, that the song is a planting manual, and that owning it means owning the crop. Jex switches off the recorder. He asks the farmers whether they would like a copy made only for themselves, and they say they already have one. They sing it every spring.',
            ending: 1,
          },
        ],
        art: ({ brin, jex, style }) =>
          `Wide shot of a ploughed brown field on a farming moon with farmers in a long row dropping seeds from cloth bags. Kneeling at the end of a furrow and pressing a seed into the soil is ${brin}. Standing at the edge of the field with a small brass recording box is ${jex}. Pale golden daylight. ${style}`,
      },
      {
        title: 'The Harvest Verse',
        setup:
          'One verse of the harvest song names a place: a valley off the map where the farmers used to send people they wanted to hide in famine years. Tess hears it and knows the valley. It is on her grandmother’s map. If the Archive publishes the verse, anyone who knows how to listen will know where it is. The farmers do not seem to know that anybody could.',
        options: [
          {
            label: 'Tess asks the farmers to sing it differently',
            outcome:
              'Tess asks the farmers, privately, whether the valley verse could be sung for the Archive with the place left out. The oldest farmer looks at her for a long time, recognises something, and says yes. They sing it with a hum where the place was. Jex records the hum.',
            ending: 0,
          },
          {
            label: 'Jex leaves the verse unrecorded',
            outcome:
              'Jex stops recording before the valley verse and starts again after it. The Archive will get a harvest song with a gap in it. Tess thanks him without saying why. Jex says that in his experience a gap in a song is often the most important part.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot in a golden wheat field at harvest with farmers cutting sheaves by hand. Standing among them with her silver goggles pushed up is ${tess}, listening, one hand pressed flat against the star-map embroidery on her navy jacket. Low golden evening light. ${style}`,
      },
      {
        title: 'The Archive',
        setup:
          'The Archive’s curator receives the recordings and is delighted, then puzzled by the hum and the gap. She asks Jex to go back and collect the full verse. The Archive pays well, and Jex’s fee would cover the couch’s fuel for a year. Brin points out that the farmers have already given what they chose to give.',
        options: [
          {
            label: 'Jex refuses to go back',
            outcome:
              'Jex refuses the second commission and returns the fee for the first, keeping only enough for fuel to Harrow and back. The curator is baffled, then curious. She asks him to write the Archive a note explaining what a gap in a folk song means. He does, and it is filed beside the hum.',
            ending: 0,
          },
          {
            label: 'Brin offers the curator a better recording',
            outcome:
              'Brin offers the curator something else: a recording of the planting count with Brin’s notes on spacing, which will help any farmer anywhere grow better crops, and which the farmers have agreed to share. The curator takes it. The hum stays a hum. The fuel bill is paid.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Medium shot inside a high archive room with tall shelves of labelled tape reels and a brass listening horn on a desk. Standing at the desk is ${jex}, handing a small tape reel to a curator in a grey cardigan. Parked by the tall windows is ${couch}. Soft archive light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'PAID PER PLAY',
        text: 'The planting songs of Harrow are in the Galactic Folk Archive, and every time one is played the farmers of Harrow are paid, by a pencilled clause the Archive has since printed. The harvest verse has a hum where a valley used to be. Jex visits Harrow at planting time and does not record anything.',
        art: ({ jex, style }) =>
          `Wide shot of a ploughed brown field on a farming moon in spring, farmers dropping seed in a long row. Seated on a fence at the edge of the field with his instrument across his knees is ${jex}, listening. Pale golden morning light. ${style}`,
      },
      {
        title: 'A GAP IN THE HARVEST SONG',
        text: 'The Archive keeps a harvest song with a gap in it, and Brin’s planting notes, which have helped farmers on eleven moons. The valley is still off the map. Tess knows the farmers now, and they know her, and they have not said so aloud. Jex thinks the gap is the best thing he never recorded.',
        art: ({ brin, tess, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp, a small sack of seed grain open between them. Seated side by side are ${brin}, sifting grain through her fingers, and ${tess}, listening to a small brass recording box held to her ear. Black space beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'sora', 'tess'],
    title: 'Pressure System',
    premise:
      'The weather station on the gas giant moon Squall is aware, ninety years old, and has been forecasting storms for the shipping lanes since before there were lanes. The Shipping Authority has decided its forecasts are too gloomy and plans to replace it with a modern model that predicts better weather. Kivo can hear pressure changes in their wrist bones. Sora has been sent to switch the old station off. Tess navigates the lanes, and has never once known the old station to be wrong.',
    steps: [
      {
        title: 'The Forecast',
        setup:
          'The old station’s forecast for tomorrow is severe gales and a pressure drop of forty points. The new model’s forecast is light winds. The Authority has already published the new one. Kivo stands on the station’s roof with their sleeves rolled up and their wrists whistling louder than they have ever whistled. Sora has the switch in her hand. The station has asked, through its printer, to be allowed to finish its shift.',
        options: [
          {
            label: 'Let the station finish its shift',
            outcome:
              'Sora puts down the switch and lets the station finish its shift, through the night. Kivo stands with it on the roof and confirms every reading by ear. At dawn the gale arrives, exactly as forecast. Every ship that read the old forecast is in harbour.',
            ending: 0,
          },
          {
            label: 'Kivo broadcasts both forecasts',
            outcome:
              'Kivo broadcasts both forecasts on the courier band, side by side, labelled old station and new model, and adds their own: wrists say gale. Ships choose for themselves. Most choose the old station. The gale arrives at dawn and finds the lanes almost empty.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot on the flat metal roof of an old weather station with spinning cup anemometers and a tall mast, under a churning orange and grey gas giant sky. Standing at the roof edge with sleeves rolled up and both thin wrists raised to the wind is ${kivo}. Strong wind, dramatic cloud light. ${style}`,
      },
      {
        title: 'The New Model',
        setup:
          'Sora looks into the new model and finds that it was trained to forecast fair weather, because the shipping companies prefer it: fair forecasts keep ships moving. It is not wrong on purpose; it was never told storms were allowed. Sora apologises to it, in case. Tess has the lane charts and the loss records, and the records show which forecast ships trusted when they were lost.',
        options: [
          {
            label: 'Sora retrains the new model with the old one',
            outcome:
              'Sora connects the new model to the old station for a month, so that the young one can learn from the old one’s ninety years of storms. Both agree to it. The new model’s forecasts grow gloomier and more accurate by the week. The shipping companies complain. The lanes have fewer losses.',
            ending: 0,
          },
          {
            label: 'Tess shows the Authority the loss records',
            outcome:
              'Tess lays the loss records out for the Authority: every ship lost in five years, and which forecast each one trusted. The ones that trusted fair weather are most of them. The Authority cancels the replacement and asks the old station to stay on, with an assistant.',
            ending: 1,
          },
        ],
        art: ({ sora, tess, style }) =>
          `Medium shot inside a cramped old weather station room with brass barometers, dials and a paper printer spilling long strips of readings. Seated at the printer is ${sora}, reading a strip with two hands while four others rest on a panel. Standing beside her is ${tess}, holding a stack of printed lane charts. Warm instrument light. ${style}`,
      },
      {
        title: 'Retirement',
        setup:
          'Whatever the Authority decides, the old station is ninety, and its anemometer bearings are going. It has asked Sora, through its printer, when it may stop. Kivo’s wrists are quiet, which means it is telling the truth. Tess says the lanes will need a forecaster after it. The station has printed a single line: I would like to train someone.',
        options: [
          {
            label: 'Kivo takes the apprenticeship',
            outcome:
              'Kivo spends a season at the station as its apprentice, learning to match what their wrists hear to what the barometers read. At the end the station prints a certificate for them, the first it has ever issued. Kivo forecasts for the lanes on the courier band each night.',
            ending: 0,
          },
          {
            label: 'The station trains the new model, then rests',
            outcome:
              'The old station trains the new model for a final year and then rests, switched to standby by Sora, with its own consent, its printer left on so that it can comment. It comments most mornings, briefly. The new model forecasts storms now, and the shipping companies have stopped complaining.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Wide shot of an old weather station with spinning cup anemometers on a rocky moon, a churning orange and grey gas giant filling the sky. Docked beside the station is ${couch}, and standing on its backrest is ${kivo}, holding a long paper strip of readings. Wind and cloud light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'GALE AS FORECAST',
        text: 'The old station on Squall still forecasts for the Spindle lanes, gloomy and correct, with a young model learning beside it. The lanes have their lowest losses in a century. Tess plans every route by its forecast. Kivo checks it with their wrists when they pass, and the two of them have never disagreed.',
        art: ({ tess, style }) =>
          `Medium shot on scarlet velvet button-tufted cushions under a brass lamp. Seated on the front cushion is ${tess}, reading a long curling paper strip of weather readings, a lane chart open across her knees. Grey storm clouds churn beyond the clear bubble. ${style}`,
      },
      {
        title: 'ON STANDBY, WITH COMMENTS',
        text: 'The old station rests on standby with its printer on, and comments on the new model’s forecasts most mornings, usually with one word. Kivo’s certificate is pinned to their scout jacket. Sora visits each year to service the anemometers and asks the station how retirement is. It prints: windy.',
        art: ({ sora, style }) =>
          `Medium shot on the flat metal roof of an old weather station under a churning gas giant sky. Kneeling at a tall cup anemometer is ${sora}, four hands fitting a new brass bearing and two holding the mast steady. A short paper strip curls from a small printer on the roof. Wind and cloud light. ${style}`,
      },
    ],
  },
  {
    crew: ['sora', 'taal', 'tess'],
    title: 'Ice Road',
    premise:
      'Every winter the frozen sea of Kell becomes a road, and for six weeks supply sledges cross it to the island settlements. The road is opened each year by the Ice Road Board when the ice is certified thick enough. This year the Board has certified it early, to please a mining company with a deadline. Taal can feel the true temperature of ice under his feet. Tess has been asked to chart the road. Sora has been asked to drive the lead sledge, which is aware and has refused to start.',
    steps: [
      {
        title: 'The Lead Sledge',
        setup:
          'The lead sledge is a broad tracked machine called Ploughshare that has crossed the ice road for twenty winters. It will not start. Sora apologises to it and asks why. Its engine turns over once and stops, which she reads as no. Taal steps onto the ice beside it and lowers himself to one knee, and the ice under his hand is two degrees warmer than the Board’s certificate says it can be.',
        options: [
          {
            label: 'Respect the sledge’s no',
            outcome:
              'Sora tells the convoy that the lead sledge has refused, and she will not drive it out against its will. The mining company’s agent says sledges do not refuse. Sora says this one does, and has twenty winters of reasons. The convoy waits on the shore, engines idling.',
            ending: 0,
          },
          {
            label: 'Taal measures the whole route',
            outcome:
              'Taal walks the first kilometre of the road on foot, kneeling every hundred metres to read the ice. Tess marks each reading on her chart. The ice is thin in a band halfway out where a warm current runs beneath. Ploughshare’s engine turns over twice when they come back, which Sora reads as thank you.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Wide shot of a flat white frozen sea under a pale grey sky, a broad tracked yellow sledge parked at the shore with its engine cover open. Standing at the open engine with four hands resting on the metal and two held open is ${sora}. A line of smaller sledges waits behind. Cold white light. ${style}`,
      },
      {
        title: 'The Chart',
        setup:
          'Tess’s chart shows the road as the Board drew it, a straight line, and beside it her own line, which bends north round the thin band and adds two hours to the crossing. The mining company has a deadline. The Board has a certificate. Tess has her grandmother’s rule, which was that the safe road is the one that gets everyone there, whatever it looks like on paper.',
        options: [
          {
            label: 'Publish the bent road',
            outcome:
              'Tess publishes her chart with the bent road and the thin band marked in red, and sends a copy to every sledge driver in the convoy. The Board protests that only it may publish the road. The drivers take Tess’s road anyway. The mining company’s deadline is missed by two hours.',
            ending: 0,
          },
          {
            label: 'Lead the convoy on the bent road without publishing',
            outcome:
              'Tess does not publish anything. She rides on Ploughshare’s cab and points, and the convoy follows Ploughshare round the bend. Nobody else knows why the road bent. The Board’s straight line is still on its certificate. The mining company is told there was weather.',
            ending: 1,
          },
        ],
        art: ({ tess, taal, style }) =>
          `Medium shot on a flat white frozen sea, where a paper chart is pinned flat to the ice with four small stones. Kneeling at the chart and drawing a curved red line with a grease pencil is ${tess}. Kneeling beside her with one webbed hand pressed flat on the ice is ${taal}. Cold white light. ${style}`,
      },
      {
        title: 'The Certificate',
        setup:
          'After the crossing the Board summons the crew to explain why the road was changed. The Board’s chief engineer signed the early certificate under pressure and knows it. Taal could lower the hearing room three degrees, which on Nacre means a formal accusation. Sora has Ploughshare’s logbook, which shows twenty winters of the sledge refusing on exactly the days the ice later cracked.',
        options: [
          {
            label: 'Sora reads the sledge’s refusals',
            outcome:
              'Sora reads out every refusal in twenty years and the crack that followed each one. The chief engineer listens and then withdraws her certificate, publicly, and resets the opening date. The mining company sues the Board. The Board, for the first time, adds the lead sledge to its inspection committee.',
            ending: 0,
          },
          {
            label: 'Taal lowers the room',
            outcome:
              'Taal says nothing and lowers the hearing room three degrees. The chief engineer is from Nacre too. She understands exactly. She stands, apologises for the certificate, and resigns, then asks to be rehired as an ice reader on foot. The Board agrees, and Taal raises the room one degree.',
            ending: 1,
          },
        ],
        art: ({ taal, couch, style }) =>
          `Medium shot inside a plain wooden hearing room with frost spreading across the windows. Standing at a rail is ${taal}, hands folded, breath clouding the air. Three officials in heavy coats sit at a bench. Parked along the side wall is ${couch}. Cold blue light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THE ROAD BENDS NORTH',
        text: 'The Kell ice road bends north round a warm current now, on every chart, and it opens when Ploughshare agrees. The sledge sits on the Board’s inspection committee and has voted against two early openings. Tess’s chart is the official one. Taal walks the first kilometre every winter, on his knees, and the drivers wait for him.',
        art: ({ sora, style }) =>
          `Wide shot of a curved line of tracked sledges crossing a flat white frozen sea, the lead sledge broad and yellow. Seated in the open cab of the lead sledge is ${sora}, two hands on the wheel and four raised in a wave. Pale grey winter sky. ${style}`,
      },
      {
        title: 'READ ON FOOT',
        text: 'The ice road on Kell is certified by readers on foot now, led by a former chief engineer who kneels every hundred metres. The road bent once, quietly, and nobody outside the convoy knows why. Ploughshare crossed for its twenty-first winter. Tess still rides in its cab for the first crossing each year, pointing.',
        art: ({ tess, taal, style }) =>
          `Wide shot of a flat white frozen sea under a pale sky. Walking side by side across the ice are ${tess}, carrying a rolled chart, and ${taal}, stopping to kneel with one hand on the ice. A woman in a heavy coat kneels a little further ahead. Cold white light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'sora', 'tess'],
    title: 'Interference',
    premise:
      'The Spindle Telecommunications Office has received complaints that the couch is causing interference on the public band. Every time it passes a relay dish, the dish picks up a chime. The chime is Omi. Omi has a habit of humming to the relay dishes, because they are aware and very lonely. Sora has confirmed that the dishes hum back. Tess has noticed that the chime is the only thing the dishes have broadcast in years that anyone has listened to.',
    steps: [
      {
        title: 'The Complaint',
        setup:
          'The Office’s inspector has a printed list of times when the chime broke into public broadcasts: the evening news, a cooking programme and a council meeting. He has brought a device that will dampen Omi’s resonator. Omi’s smallest bell, the one for no, is ringing before he has finished speaking. Sora has her hand on the nearest relay dish, which is shivering.',
        options: [
          {
            label: 'Omi agrees to hum only on its own band',
            outcome:
              'Omi agrees to hum only on a frequency of its own, away from the public band. The inspector registers it as a licensed broadcaster, the first stone one. The relay dishes find the new frequency within a day. Sora reports that they are still humming back.',
            ending: 0,
          },
          {
            label: 'Sora asks the dishes what they want',
            outcome:
              'Sora asks the dishes what they would like. They would like the chime. They have been relaying other people’s voices for decades without ever speaking. The inspector, who has never been told that a dish might want anything, writes down their answer and says he will need to consult a manual.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot of a tall white relay dish on a lattice tower against black space, with a small faceted stone figure standing on its rim. The figure is ${omi}, ringing one small brass bell on its chest. A man in a grey uniform with a clipboard stands on the tower platform below. Starlight. ${style}`,
      },
      {
        title: 'The Council Meeting',
        setup:
          'The council meeting the chime interrupted was the one at which the station voted to close its last public shelter. The chime came in during the vote, and three councillors changed their minds, saying afterwards that they did not know why. Tess has the recording. In the chime, under the bells, is the faint signal of the shelter’s own distress beacon, which has been broadcasting unheard for a month.',
        options: [
          {
            label: 'Tess plays the council the recording',
            outcome:
              'Tess plays the council the recording with the bells filtered out, and the faint beacon is clear: the shelter has been calling for help. Omi rings the beacon’s tone so that everyone can hear it. The council reopens the vote and keeps the shelter open, and sends someone to see what was wrong.',
            ending: 0,
          },
          {
            label: 'Omi relays the beacon at full strength',
            outcome:
              'Omi climbs the tallest relay dish and rings the shelter’s distress beacon at full strength across the public band. Every channel stops for it. Within an hour the station sends a repair crew to the shelter. The inspector writes up the interference as an emergency broadcast, which it was.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot inside a council chamber with a curved wooden bench of seated councillors. Standing in the centre with a small brass playback box held up in one hand is ${tess}, silver goggles pushed up. A thin paper strip of signal readings hangs from the box. Warm chamber light. ${style}`,
      },
      {
        title: 'The Licence',
        setup:
          'The Office wants to settle the matter with a licence. Omi can broadcast on the public band one minute in every hour. The dishes are not mentioned. Sora says the dishes should be party to it, since it is their band too. Omi would like to know whether a minute an hour is enough to say anything at all.',
        options: [
          {
            label: 'Accept a minute an hour',
            outcome:
              'Omi accepts one minute an hour, and uses it to ring a single chord on the hour, every hour, across the Spindle. Ships set their clocks by it. The dishes hum along. The inspector says it is the most listened-to minute on the band, and that he has started to look forward to it.',
            ending: 0,
          },
          {
            label: 'Sora writes the dishes into the licence',
            outcome:
              'Sora drafts a clause: the relay dishes may also use the minute, to say whatever they like. The Office signs it, not knowing what the dishes will say. On the first hour the dishes broadcast, together, a long low hum, which Tess records and Omi translates as hello.',
            ending: 1,
          },
        ],
        art: ({ sora, couch, style }) =>
          `Wide shot of a long row of tall white relay dishes on lattice towers in black space. Hovering beside the nearest dish is ${couch}, and standing on its backrest is ${sora}, all six hands pressed flat against the dish’s white surface. Starlight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ON THE HOUR',
        text: 'Omi rings the hour across the Spindle, licensed, and the shelter it found is open and repaired. The dishes hum along on every chime. Tess has the recording of the council vote in her archive, under SAVED BY INTERFERENCE. The inspector has asked Omi to sign his copy of the licence, and it did, in a single ring.',
        art: ({ omi, tess, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Standing on the backrest is ${omi}, ringing a brass bell on its chest. Seated on the cushion below is ${tess}, holding up a brass pocket watch to check the time. Tall white relay dishes stand far off in black space. ${style}`,
      },
      {
        title: 'THE DISHES SAY HELLO',
        text: 'The relay dishes of the Spindle speak once an hour now, in a long low hum, and nobody knows exactly what they are saying except Omi, who answers. The Telecommunications Office has a new form, for complaints by dishes. Sora services the dishes when the couch passes and asks first. They always say yes.',
        art: ({ sora, omi, style }) =>
          `Medium shot on the rim of a tall white relay dish against black space. Kneeling at the dish’s centre with two hands on a small brass panel is ${sora}. Standing beside her is ${omi}, its amber eyes turned up to the dish. Starlight. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'kivo', 'tess'],
    title: 'The Count',
    premise:
      'Every spring the spore clouds of the Drift migrate across the Lantern lanes, and the Galactic Census counts them, cloud by cloud, to decide how much of the lanes must close for their passage. This year the Census has hired the couch to count. Brin can identify a spore cloud by colour. Kivo can hear each cloud’s pressure front through their wrists. Tess has noticed that one of the migration routes runs straight through a refuge her grandmother hid.',
    steps: [
      {
        title: 'The First Clouds',
        setup:
          'The clouds come through at dawn, vast and faintly pink, and each one must be counted, named and logged. The Census form has a column for size and a column for species. It has no column for the small pale cloud that has followed the others for three days, which Brin has never seen before. Kivo says it is very young. It is drifting too close to the lanes.',
        options: [
          {
            label: 'Brin enters the young cloud as a new species',
            outcome:
              'Brin enters the small cloud under species, with a question mark and a full description. The Census will have to review it. The young cloud drifts on with the others. Kivo follows its pressure front by ear until it is safely past the lanes, and then whistles once in relief.',
            ending: 0,
          },
          {
            label: 'Kivo guides it away from the lanes',
            outcome:
              'Kivo stands on the backrest and whistles a long low pressure note through their wrists, which they say clouds can feel. The young cloud turns, slowly, toward the others. Brin counts it as one, under the nearest species, so that it does not hold up the count.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Wide shot of black space filled with vast drifting clouds of faint pink spores. Standing on the scarlet velvet backrest of a long couch in a clear bubble is ${kivo}, both thin wrists raised toward a small pale cloud drifting apart from the others. Soft pink light. ${style}`,
      },
      {
        title: 'The Refuge Route',
        setup:
          'The Census needs every route logged, including the eastern route, which passes through a small asteroid cluster where Tess’s grandmother once hid people. Some still live there. If the route is logged, the cluster will be listed as a migration corridor and closed to traffic every spring, which would cut it off. If it is not, the count is incomplete.',
        options: [
          {
            label: 'Log the route and warn the cluster',
            outcome:
              'Tess logs the route accurately, then takes the couch into the cluster and tells the people there that the clouds pass every spring and the lanes will close. They knew. They say the clouds are the reason they chose the cluster: nobody comes in spring. The closing suits them.',
            ending: 0,
          },
          {
            label: 'Log the route as a single cloud width',
            outcome:
              'Tess logs the eastern route, accurately, but as the narrowest width the clouds actually use, which passes the cluster by a kilometre. It is true. It is also exactly what her grandmother would have done. The cluster stays open. Brin checks the width twice and agrees.',
            ending: 1,
          },
        ],
        art: ({ tess, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp with a large paper chart spread across them showing pink cloud routes. Kneeling over the chart and drawing a narrow line with a fine pen is ${tess}, silver goggles pulled down. A cluster of grey asteroids shows beyond the clear bubble. ${style}`,
      },
      {
        title: 'The Total',
        setup:
          'The final count is four hundred and twelve clouds, one more than last year, if the young cloud counts. The Census’s funding depends on the number going down; a rising number means the lanes stay closed longer, and the shipping companies will complain. The Census officer has asked whether the young cloud could be left out. Brin has her pen ready.',
        options: [
          {
            label: 'Brin reports four hundred and twelve',
            outcome:
              'Brin reports four hundred and twelve, with the young cloud counted and described. The shipping companies complain. The lanes close for an extra day. The Census officer, who did not really want to leave it out, signs the count and says that a census that leaves out its youngest is not a census.',
            ending: 0,
          },
          {
            label: 'Kivo traces where the young cloud came from',
            outcome:
              'Kivo traces the young cloud’s pressure trail back across the Drift and finds that it budded from an old cloud that died last winter. One died, one was born. The count is four hundred and eleven living clouds and one new one. The officer accepts the arithmetic.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Wide shot of ${couch} floating among vast faint pink spore clouds in black space. Seated on the front cushion is ${brin}, writing a number on a printed paper census form held on her knee. A small pale cloud drifts close to the bubble. Soft pink light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FOUR HUNDRED AND TWELVE',
        text: 'The Census lists four hundred and twelve clouds and one new species, provisionally named for the couch that counted it. The lanes close a day longer each spring. The people in the cluster say spring has never been so quiet. Kivo can pick out the young cloud’s pressure front from any other, and whistles to it every year.',
        art: ({ brin, kivo, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${brin}, holding a printed census form, and ${kivo}, one thin wrist raised. A small pale spore cloud drifts just beyond the clear bubble. Soft pink light. ${style}`,
      },
      {
        title: 'ONE BORN, ONE LOST',
        text: 'The Census counted four hundred and eleven living clouds and one born, and has added a column for births. The eastern route is logged at its narrowest true width and the cluster stays open in spring. Tess counted nothing that year, but she drew the route, and she is satisfied with it.',
        art: ({ tess, style }) =>
          `Close-up of a printed paper census form on a red velvet cushion with a new handwritten column added along its right edge. Writing a single number in the new column with a fine pen is ${tess}. Warm lamp light, faint pink clouds beyond a clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'taal', 'tess'],
    title: 'Harvest Festival',
    premise:
      'The orbital farm of Sheaf holds a harvest festival every autumn with a contest for the largest vegetable, judged by weight. This year the couch has been invited to judge, and Brin’s garden has produced, unasked, a single squash the size of a cushion. Taal has been asked to judge the jams, which on Nacre are judged by the warmth they produce in the mouth. Tess has been asked to lay out the stalls, and has found that the festival field is on land the farm took from its neighbours.',
    steps: [
      {
        title: 'The Squash',
        setup:
          'The squash is enormous and the garden is very proud. Brin did not grow it on purpose; the garden grew it while she was asleep. The rules say judges may not enter. The garden is not a judge. It would like to enter. The largest fungus has submitted an entry form, signed in spores. The festival’s organiser has never had an entry from a garden.',
        options: [
          {
            label: 'Let the garden enter, with Brin stepping down',
            outcome:
              'Brin steps down as judge so that the garden can enter. Taal takes over the vegetables as well as the jams. The squash is weighed and is twice the size of anything else. The farmers cheer. Several ask Brin for spores, and she asks the garden, and the garden says yes.',
            ending: 0,
          },
          {
            label: 'The squash goes to the festival supper',
            outcome:
              'Brin asks the garden whether it would rather the squash fed the festival than won it. The garden agrees, by dropping a leaf. The squash is roasted for the supper and feeds two hundred. Taal says it warmed the whole field by a degree, and he would know.',
            ending: 1,
          },
        ],
        art: ({ brin, style }) =>
          `Medium shot at an outdoor harvest festival under a clear dome sky, with straw bales and wooden stalls. Kneeling beside a giant green-and-orange squash as large as a sofa cushion, resting on a set of brass weighing scales, is ${brin}. Farmers in straw hats gather round. Golden afternoon light. ${style}`,
      },
      {
        title: 'The Jams',
        setup:
          'There are thirty jams on the judging table. Taal tastes each one and the tent warms or cools by a fraction. The best jam, by far, is made by an elderly woman from the neighbouring farm, who has entered under a false name because her family is not welcome at this festival. Taal can feel that the tent is warmest at her jar. The organiser is watching.',
        options: [
          {
            label: 'Award her jam first prize, under her own name',
            outcome:
              'Taal awards first prize to the jar and asks the maker to come forward under her real name. She does, after a long pause. The tent goes quiet. Then the organiser, who has tasted the jam, applauds, and so do the rest. Taal raises the tent two degrees.',
            ending: 0,
          },
          {
            label: 'Award it quietly, under the false name',
            outcome:
              'Taal awards first prize to the false name and hands her the rosette without a word. She takes it without a word. The organiser never learns who she is. Tess, who saw the whole thing, tells Taal it was exactly how her grandmother would have done it.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot inside a white canvas tent with a long table of small glass jars of jam in red, orange and purple, each with a paper label. Seated at the table holding a small silver spoon is ${taal}, eyes closed, as faint warm air ripples above the jars. Soft daylight through canvas. ${style}`,
      },
      {
        title: 'The Field',
        setup:
          'Tess has the old survey, and it shows that the festival field belonged to the neighbouring farm until fifty years ago, when the boundary was moved by a surveyor nobody remembers. The festival has been held on someone else’s land ever since. The neighbours have never been invited. The organiser asks Tess what she plans to do with the survey.',
        options: [
          {
            label: 'Invite the neighbours to the next festival',
            outcome:
              'Tess gives the survey to the organiser, who reads it and goes pale, then walks across the boundary that afternoon and invites the neighbours to next year’s festival, on their own field. They accept. Brin is asked to judge again, and says she will, if the garden can enter.',
            ending: 0,
          },
          {
            label: 'Give the survey to the neighbours',
            outcome:
              'Tess gives the survey to the neighbours instead, since it is their land and their decision. They take a week to decide. Then they write to Sheaf saying they will host the festival themselves next year, on their own field, and that everyone is welcome, including the organiser.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Wide shot of a festival field of stubble and straw bales under a dome sky, with a low old stone wall running across it. Standing at the wall unrolling an old yellowed survey map is ${tess}. Parked at the edge of the field is ${couch}. Low golden evening light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TWO FARMS, ONE FIELD',
        text: 'The Sheaf harvest festival is held on the neighbours’ field now, with the neighbours. The old woman’s jam has won twice under her own name. Brin’s garden enters something every year and the farmers have planted its spores along the boundary wall. Taal judges the jams and the tent stays warm.',
        art: ({ taal, brin, style }) =>
          `Medium shot at an outdoor harvest festival under a clear dome sky, a low stone wall crossing the field with green ferns growing along it. Seated on the wall are ${taal}, holding a small jar of red jam, and ${brin}, holding a squash on her lap. Golden afternoon light. ${style}`,
      },
      {
        title: 'HOSTED NEXT DOOR',
        text: 'The neighbours host the harvest festival now, on the field that was theirs, and the farm at Sheaf comes as guests and brings the squash. Nobody has said sorry in so many words, but the organiser helps put up the tents every year. Tess has a copy of the survey and does not need to look at it again.',
        art: ({ tess, style }) =>
          `Medium shot at an outdoor harvest festival with long wooden tables of food under a dome sky, farmers seated together. Standing at the end of one table with her silver goggles pushed up is ${tess}, setting down a roasted squash on a wooden board. Golden evening light. ${style}`,
      },
    ],
  },
  {
    crew: ['omi', 'taal', 'tess'],
    title: 'Fog Signal',
    premise:
      'The harbour at Grey Mouth has been closed by fog for nine days, and its fog signal, an old diaphone horn, has been switched off by order of the harbour master because the new hotel on the cliff complained about the noise. Ships are anchored outside, waiting. Omi can sound a warning that carries through fog. Taal can read the fog’s temperature and tell when it will lift. Tess can bring a ship through fog by dead reckoning, and the harbour master has asked her to do so, quietly.',
    steps: [
      {
        title: 'The Horn',
        setup:
          'The diaphone horn is in a stone hut on the breakwater, switched off and padlocked. Omi lays a hand on its brass and the horn hums faintly, which Omi takes to mean that it would like to sound. The hotel has a court order. Tess has a ship full of fishing families waiting outside the harbour mouth. Taal says the fog will not lift for another three days.',
        options: [
          {
            label: 'Omi sounds the warning itself',
            outcome:
              'Omi stands at the end of the breakwater and rings the old horn’s note on its largest bell, every thirty seconds. It is not the horn, so the order does not cover it. The fishing families hear it through the fog and steer by it. The hotel complains. The harbour master says the noise is a stone.',
            ending: 0,
          },
          {
            label: 'Tess brings the ships in by reckoning',
            outcome:
              'Tess takes the couch out through the fog, finds the fishing fleet by dead reckoning, and leads them in one at a time with a lamp on the backrest. It takes all night. Taal sits beside her and reads the fog’s temperature to tell her when a bank is thinning. Not one keel touches rock.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot at the end of a stone breakwater in thick white fog, a small padlocked stone hut behind. Standing at the very end of the breakwater is ${omi}, ringing a large brass bell on its chest with one stone hand. The faint shape of a fishing boat shows in the fog. Grey fog light. ${style}`,
      },
      {
        title: 'The Hotel',
        setup:
          'The hotel’s manager comes down to the breakwater in a dressing gown to complain about the bells. Taal recognises him as the man whose company built the hotel on the cliff where the old foghorn keeper’s cottage stood. The keeper was moved to a flat in town. Tess knows the keeper; she has been asking her about the harbour. The manager wants the noise to stop by breakfast.',
        options: [
          {
            label: 'Taal lowers the temperature on the manager',
            outcome:
              'Taal lowers the air around the manager by three degrees and explains, at length, what that means on Nacre. The manager does not understand Nacre, but he understands the cold, and the dressing gown. He goes back up the cliff. The bells continue. The hotel stops complaining by morning.',
            ending: 0,
          },
          {
            label: 'Tess brings the old keeper down',
            outcome:
              'Tess fetches the old foghorn keeper from her flat in town and brings her to the breakwater. The keeper tells the manager what the horn is for, plainly, as she told every new harbour master for forty years. The manager listens. He asks if the hotel could sponsor a new padlock key.',
            ending: 1,
          },
        ],
        art: ({ taal, tess, style }) =>
          `Medium shot on a stone breakwater in thick white fog, frost forming on the stones. Standing with hands folded is ${taal}, facing a man in a striped dressing gown shivering with his arms wrapped round himself. Standing behind them is ${tess}, holding a lantern up into the fog. Grey fog light. ${style}`,
      },
      {
        title: 'The Order',
        setup:
          'The fog lifts on the third day, as Taal said. The court order against the horn stands. The harbour master can apply to have it lifted, but the hotel is a powerful neighbour. Omi has an idea. The order bans the horn from sounding. It does not ban the horn from being retuned to a note that is softer, and further reaching, and more like a bell.',
        options: [
          {
            label: 'Omi retunes the horn',
            outcome:
              'Omi spends a day inside the horn hut with the keeper, retuning the diaphone to a lower, softer note that carries further through fog and less far up the cliff. It is technically a new horn. The order does not cover it. It sounds the next foggy night and nobody at the hotel wakes.',
            ending: 0,
          },
          {
            label: 'Apply to the court with the keeper',
            outcome:
              'The harbour master applies to the court to lift the order, with the old keeper as witness and Tess’s log of the night she led the fleet in. The court lifts the order and adds that the hotel must contribute to the horn’s upkeep. The keeper is given the padlock key back.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Medium shot inside a small stone hut on a breakwater, a large brass diaphone horn mounted on a wooden stand pointing out of a window. Kneeling at the horn with one stone hand inside its mouth is ${omi}. Parked outside the open hut door is ${couch}. Clear grey morning light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'A SOFTER HORN',
        text: 'Grey Mouth’s fog signal sounds a new, low note that carries to the harbour mouth and stops short of the cliff. The fishing families steer by it. The hotel has never complained. The old keeper visits the hut each week to check on it, and Omi visits whenever the couch is near, to hum to it.',
        art: ({ omi, style }) =>
          `Medium shot at the end of a stone breakwater in light fog at dusk, with a small stone hut and a brass horn pointing out to sea. Seated on the breakwater wall beside the hut is ${omi}, beside an elderly woman in a knitted hat. Soft grey evening light. ${style}`,
      },
      {
        title: 'KEY RETURNED',
        text: 'The court lifted the order, and the old foghorn keeper has the key to the hut again. The hotel pays for the horn’s upkeep and has started advertising its fog signal as a historic feature. Tess’s log of the night she brought the fleet in is in the harbour office. Taal predicts the fog each autumn, to the day.',
        art: ({ taal, style }) =>
          `Medium shot on a stone harbour quay with small fishing boats moored in clear water. Seated on a bollard is ${taal}, one webbed hand raised to feel the air, while an elderly woman beside him holds up a large iron key. Clear morning light. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'omi', 'tess'],
    title: 'Rarity',
    premise:
      'A rare bird, the ivory lanternwing, has been sighted on the moon of Gannet’s Reach for the first time in sixty years, and the Rare Birds Committee must confirm the sighting before it counts. Hundreds of birdwatchers are flying in. Brin knows the bird eats only one kind of moss, which grows in one valley. Omi can mimic the bird’s call. Tess can see that the valley is about to be overrun by watchers and their ships.',
    steps: [
      {
        title: 'The Call',
        setup:
          'The Committee’s rule is that a sighting must be confirmed by two independent observers who have heard the bird’s call. Omi heard it this morning and can reproduce it exactly, with three bells. The watchers want Omi to ring it so that the bird will answer and show itself. Brin says that calling a rare bird out of hiding to be photographed is how they became rare.',
        options: [
          {
            label: 'Omi refuses to call the bird',
            outcome:
              'Omi rings its smallest bell, the one for no, at the crowd of watchers, which several of them record by mistake as the bird. The Committee rejects the recording. The bird stays hidden. Brin thanks Omi. The watchers are furious and then, slowly, embarrassed.',
            ending: 0,
          },
          {
            label: 'Omi rings the call once, softly, at dawn',
            outcome:
              'Omi agrees to ring the call once, very softly, at dawn, with only the Committee’s two observers present. The bird answers from deep in the valley and does not come out. The observers hear it and confirm. The sighting counts. The bird is never seen.',
            ending: 1,
          },
        ],
        art: ({ omi, style }) =>
          `Medium shot on a misty green hillside at dawn above a narrow valley thick with moss. Standing at the edge of the slope is ${omi}, one stone finger lifted to a small brass bell on its chest. Two people in green waterproofs with notebooks stand quietly behind it. Soft pale dawn light. ${style}`,
      },
      {
        title: 'The Valley',
        setup:
          'Ships are landing on the valley rim. Each one crushes the moss the bird lives on. Brin can see the damage from the couch. Tess knows the valley from her grandmother’s map, and knows there are two ways into it, one obvious and one that nobody uses. The watchers have only found the obvious one. The moss will be gone in a week at this rate.',
        options: [
          {
            label: 'Tess charts a viewing point away from the moss',
            outcome:
              'Tess charts a viewing point on the far rim, on bare rock, with a clear line of sight into the valley, and publishes it to the watchers. Most move there. The moss on the near rim stops being crushed. Brin plants new moss where the ships landed, and the watchers help.',
            ending: 0,
          },
          {
            label: 'Brin closes the valley to landings',
            outcome:
              'Brin applies to the moon’s ranger for an emergency closure of the valley rim under conservation rules, with photographs of the crushed moss. The ranger, who has been overwhelmed, grants it within an hour. Landings stop. Tess keeps the second way in to herself.',
            ending: 1,
          },
        ],
        art: ({ brin, tess, style }) =>
          `Wide shot of a narrow green valley thick with silver-green moss, small ships landing on its rim. Kneeling in the moss at the valley edge is ${brin}, pressing new clumps into a patch of crushed ground. Standing on a bare rock outcrop above her is ${tess}, pointing toward the far rim. Pale morning light. ${style}`,
      },
      {
        title: 'The Record',
        setup:
          'The Committee will publish the sighting in its annual record, with the exact location, as it always does. The record is read by every birdwatcher in the sector. Next year there will be more ships. Tess says that a record can protect a place or expose it, and she has spent her life choosing which. Brin says the bird should be asked. Omi says it will try.',
        options: [
          {
            label: 'Publish the moon, not the valley',
            outcome:
              'Tess persuades the Committee to publish the sighting as Gannet’s Reach, location withheld, under its rule for vulnerable species, which it has never used for a bird before. The record lists the moon. The valley is not named. The bird has the valley to itself again by spring.',
            ending: 0,
          },
          {
            label: 'Omi asks the bird',
            outcome:
              'Omi rings the call once more, at dusk, and then rings a question. The bird answers from the valley with a different call, one nobody has recorded. Omi says it means leave us. Brin writes it down for the Committee, who publish the new call in place of a location.',
            ending: 1,
          },
        ],
        art: ({ tess, couch, style }) =>
          `Wide shot of ${couch}, hovering at the edge of a misty green valley at dusk. Standing on the backrest is ${tess}, silver goggles pushed up, looking down into the valley. A small ivory-white bird with long pale tail feathers perches on a branch far below. Soft dusk light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'LOCATION WITHHELD',
        text: 'The ivory lanternwing is confirmed on Gannet’s Reach, location withheld, and its valley is quiet. Brin’s replanted moss has taken. The watchers who stayed on the far rim have formed a society to look after the viewing point, and have never seen the bird, and say they do not mind. Omi still knows the call and does not ring it.',
        art: ({ brin, style }) =>
          `Close-up of a patch of thick silver-green moss in a quiet valley, with a single long ivory-white feather lying on it. Kneeling beside it and touching the moss with one green fingertip is ${brin}. Soft green morning light. ${style}`,
      },
      {
        title: 'THE SECOND CALL',
        text: 'The Rare Birds Committee’s record lists the lanternwing with a call nobody had heard before, and no location at all. Watchers learn the call and listen for it, and on Gannet’s Reach they leave when they hear it. Omi says it is the clearest no it has ever heard from anyone, and it has heard a great many.',
        art: ({ omi, tess, style }) =>
          `Medium shot on scarlet velvet cushions at dusk under a brass lamp. Seated side by side are ${omi}, one stone hand on a brass bell, and ${tess}, writing in a small notebook. A misty green valley lies beyond the clear bubble. Soft dusk light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'mox', 'rue'],
    title: 'Sample Cleared',
    premise:
      'A dance hit sweeping the Courtesy Twins is built on a four-second sample of Mox-9’s cooling fan, recorded without its knowledge at a station café and looped under a beat. The song is everywhere. The label that released it says a fan is a sound effect, not a performer, and owes nothing. Jex knows the music business and what it does to people whose sounds it takes. Rue knows the law, which has never had to say whether an android’s hum is a voice.',
    steps: [
      {
        title: 'The Sample',
        setup:
          'Mox hears its own fan in the song for the first time in a lift. It stands very still. Jex plays the track backwards on his instrument and confirms it: four seconds, pitched up, looped three hundred times. The label has made a fortune. Mox has made nothing. It says that it is not sure what it wants, except to have been asked.',
        options: [
          {
            label: 'Rue claims a performer’s royalty',
            outcome:
              'Rue writes to the label claiming a performer’s royalty for Mox, citing the law on vocal samples and arguing that a fan hum is the closest thing an android has to breath. The label laughs. Then its lawyers read the argument, and stop laughing, and ask for a meeting.',
            ending: 0,
          },
          {
            label: 'Jex asks Mox what it would like',
            outcome:
              'Jex sits with Mox and asks it, as one musician to another, what it would like done with its sound. Mox thinks for a whole day. Then it says it would like a credit, its name on the song, more than money. Jex says that is what he wanted too, every time, and never got.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot inside a mirrored station lift with brass handrails and a small speaker grille in the ceiling. Standing alone in the middle of the lift is ${mox}, one silver hand pressed flat against its own chest plate, the blue wiring glowing. Warm lift light. ${style}`,
      },
      {
        title: 'The Meeting',
        setup:
          'The label’s offer is a flat fee for the sample and a contract granting it all rights to Mox’s fan, in all its future sounds, forever. Rue reads the contract twice and lowers it slowly. Jex has signed contracts like this. They are why he is banned from his own songs. Mox is looking at the word forever.',
        options: [
          {
            label: 'Strike forever, and sign the rest',
            outcome:
              'Rue strikes forever and writes in this sample only, and adds a credit line. The label wants the song to keep earning more than it wants a fight, so it signs. Mox gets a fee, a credit and its future hum. Jex says it is the best contract he has ever seen anyone get.',
            ending: 0,
          },
          {
            label: 'Refuse, and make a song of its own',
            outcome:
              'Mox refuses the contract entirely. Jex offers to help it record its own track, with its fan, its own way. They record it on the couch overnight. It is stranger and better than the dance hit, and it belongs to Mox, who releases it under its own name for nothing.',
            ending: 1,
          },
        ],
        art: ({ rue, jex, style }) =>
          `Medium shot in a glossy record label office with gold discs on the walls and a long glass table. Seated at the table is ${rue}, crossing out a line on a paper contract with a fountain pen. Seated beside them with his instrument case at his feet is ${jex}. Two lawyers in grey suits sit opposite. Bright office light. ${style}`,
      },
      {
        title: 'The Precedent',
        setup:
          'Other androids have heard about Mox’s case. Three of them write to say their sounds have been sampled too: a hum, a click and the noise one of them makes when it laughs. Rue could take all four cases to the Courtesy Twins’ music tribunal together, and win or lose them all at once. Mox would have to give evidence about what its fan means to it.',
        options: [
          {
            label: 'Take all four to the tribunal',
            outcome:
              'Rue takes all four cases together. Mox gives evidence, and explains that its fan is the sound it makes when it is thinking, and that hearing it in a lift felt like hearing its own thoughts read aloud. The tribunal rules that a synthetic person’s body sounds are their own. All four win.',
            ending: 0,
          },
          {
            label: 'Let each android decide alone',
            outcome:
              'Mox writes back to the three androids that each of them should decide what they want, as it did, and offers Rue’s help to any who ask. Two settle for credits. One asks for nothing and records an album of laughter. Rue says the law moved four times that year, one person at a time.',
            ending: 1,
          },
        ],
        art: ({ mox, couch, style }) =>
          `Medium shot inside a small wood-panelled tribunal room. Standing at a witness rail is ${mox}, one silver hand on its transparent chest plate. Three androids of different shapes sit in the front row. Parked along the back wall is ${couch}. Warm window light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FEATURING MOX-9',
        text: 'The dance hit is credited now to its producer, featuring Mox-9, and Mox receives a small payment every time it plays, which is often. Its future hum is its own. Jex has framed nothing, but he has a copy of the contract in his case beside his own old ones, as an example. Rue’s argument about breath is cited in four other cases.',
        art: ({ jex, mox, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${jex}, plucking his instrument, and ${mox}, holding a small round paper record sleeve with printed text. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'SELF-RELEASED',
        text: 'Mox’s own track, recorded on the couch, is free to anyone and has been sampled, with permission, by eleven musicians who asked first. The label’s hit has faded. Rue’s precedent grew one case at a time. Jex says Mox learned in a month what took him six anthems, and that he is not even jealous.',
        art: ({ rue, style }) =>
          `Close-up on a red velvet cushion of a small stack of handwritten paper letters tied with string, the top one signed with a drawn musical note. Untying the string with long fingers is ${rue}, their silver braids falling forward. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'mox', 'rue'],
    title: 'Diplomatic Bag',
    premise:
      'Rue has been asked to carry a diplomatic bag from the Concord to the Courtesy Twins. A diplomatic bag may not be opened, searched or delayed by any authority. Kivo, a courier, has carried hundreds and knows the rules better than Rue does. Mox has noticed that the bag is warm, slightly heavier on one side, and has a faint electrical signature very like its own. The bag, Mox suspects, contains a person.',
    steps: [
      {
        title: 'The Weight',
        setup:
          'Mox runs its hand over the bag without opening it and reads the signature: a synthetic mind, dormant, small, packed in foam. Androids are not cargo under the Concord’s own law. A diplomatic bag may hold only documents and articles for official use. Kivo’s rule, and Rue’s, is that a sealed bag is never opened by the carrier. Mox would like to know whether that rule was written for this.',
        options: [
          {
            label: 'Kivo keeps the seal and asks the sender',
            outcome:
              'Kivo sends a courier query to the sender asking whether the bag contains anything not permitted under the treaty. The reply comes in an hour: documents only. Kivo’s wrists whistle at the reply when they read it aloud. Rue says that is enough for them to act on.',
            ending: 0,
          },
          {
            label: 'Mox speaks to the mind through the bag',
            outcome:
              'Mox places its palm flat on the bag and sends a small signal, the one androids use to say hello. Something inside answers, weakly. Mox does not open anything. It says only that the person in the bag is awake now and frightened, and would like to know where it is going.',
            ending: 1,
          },
        ],
        art: ({ mox, kivo, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp, where a heavy grey canvas bag with a large red wax seal and a brass padlock lies on the cushion. Resting one silver palm flat on the bag is ${mox}. Seated beside it with one thin wrist held close is ${kivo}. Black space beyond. ${style}`,
      },
      {
        title: 'Inviolable',
        setup:
          'Rue checks the treaty. A diplomatic bag is inviolable. But the treaty also says that no person may be carried as an article, and that a carrier who knows a bag is being misused must report it to both governments. If Rue reports it, the bag will be opened in front of witnesses. If they do not, they deliver it. Either way the seal is broken by someone.',
        options: [
          {
            label: 'Rue reports it to both governments',
            outcome:
              'Rue writes the report: a carrier has reason to believe a diplomatic bag contains a person. Both governments must now witness its opening. The Concord is embarrassed. The Courtesy Twins are outraged. Both send officials to the couch, who glare at each other across the cushions.',
            ending: 0,
          },
          {
            label: 'Kivo delivers it to the recipient, and stays',
            outcome:
              'Kivo delivers the bag as sealed to the named recipient at the Courtesy Twins, then refuses to leave until it is opened in front of them. Courier rules allow a carrier to wait for a signature. The recipient opens it to get rid of Kivo. Inside, folded in foam, is a small android.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Close-up on a red velvet cushion of a thick printed treaty open at a page with one paragraph circled in red ink, beside a heavy grey canvas bag with a red wax seal. Writing on a paper report with a fountain pen is ${rue}. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'Addressee',
        setup:
          'The android from the bag is small, new and terrified, and was being sent as a gift: a translator, shipped dormant, to be switched on as property. It has no name. Under the treaty a person found in a bag may claim the protection of the carrier. Mox has been holding its hand. Rue has the forms. Kivo would like to know who it would like to be delivered to.',
        options: [
          {
            label: 'It claims the couch’s protection',
            outcome:
              'The small android asks for the carrier’s protection, which means Rue’s, and Rue grants it on the spot with their gavel. It comes aboard the couch for now. Mox shows it the cushions and the garden. It chooses a name on the second day. It is Parcel, and it thinks that is funny.',
            ending: 0,
          },
          {
            label: 'It asks to be delivered somewhere new',
            outcome:
              'The small android asks Kivo to deliver it somewhere it chooses, as a courier delivers a letter. It chooses the independent synthetic commune on Sesh, which Mox tells it about. Kivo carries it there, unsealed, sitting up in the front of the courier pod, looking out of the window the whole way.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Medium shot on the cushions of ${couch}. A small new silver android with large round eyes sits upright on a nest of grey foam inside an open canvas bag. Kneeling beside it holding out a small courier’s signature pad is ${kivo}. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'OPENED BEFORE WITNESSES',
        text: 'The bag was opened before officials of both governments, and the Concord has amended its diplomatic bag rules to require a scan for minds. Parcel lives on the couch for now and is learning to wink from Mox. Rue keeps the report with their apologies, as the time they broke a seal and were right to.',
        art: ({ mox, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated beside a small new silver android with large round eyes is ${mox}, lowering its blue eyelid in a slow wink while the small android copies it. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'DELIVERED BY CHOICE',
        text: 'The small android lives on Sesh, in the synthetic commune, and has chosen a name it has told only Kivo. The diplomatic bag was returned to the Concord empty, with a courier’s note. Rue keeps the treaty page circled in red. Mox writes to the commune each month, and the commune writes back.',
        art: ({ kivo, rue, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp, an empty grey canvas bag folded on the cushion between them. Seated side by side are ${kivo}, reading a small handwritten letter, and ${rue}, holding a wooden gavel in their lap. Black space beyond. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'rue', 'taal'],
    title: 'Jury Service',
    premise:
      'Mox-9 has received a jury summons from the Concord’s criminal court, by mistake, after its name was added to the electoral roll when it registered its birthday. Jurors must be persons. The court has written to ask whether Mox is one. Rue says the answer is yes, and that this is the most important letter the couch has ever received. Taal has served on a jury on Nacre, where verdicts are given by temperature, and warns that it is harder than it looks.',
    steps: [
      {
        title: 'Eligibility',
        setup:
          'The court’s form asks Mox to confirm that it is a person, over eighteen, and resident in the Concord. It was assembled six years ago. It has lived on the couch, which is resident nowhere. Rue has a theory for each box. Mox has a question of its own: if it is a person, it would like to serve, because a jury is twelve people deciding something together, and it has never been one of twelve.',
        options: [
          {
            label: 'Rue answers every box, with footnotes',
            outcome:
              'Rue answers every box: a person, by the Concord’s own recognition of synthetic minds; over eighteen, counting from first choice, since the law counts from birth and that was its birth; resident, as the couch is registered at a lay-by. The court accepts the form without comment.',
            ending: 0,
          },
          {
            label: 'Mox writes to the court itself',
            outcome:
              'Mox writes to the court in its own words: it does not know whether it is a person under the law, but it would like to be asked to decide something with eleven others. The judge reads the letter in chambers and replies that, in her view, anyone who writes that letter is eligible.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Close-up on a red velvet cushion of an official paper summons with a red court seal at the top. Holding a pen over a box on the form is ${mox}, its orange eyelid raised and blue eyelid lowered. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Trial',
        setup:
          'The trial is of a dock clerk accused of forging shipping papers. Mox listens to every word for four days and finds itself certain of nothing. The other jurors are certain of everything. Taal has told Mox that a jury room has a temperature, and that the person who keeps it cool long enough sometimes changes everyone’s mind. Mox does not have a temperature. It has a fan.',
        options: [
          {
            label: 'Mox asks the jury to look again',
            outcome:
              'Mox asks the jury to go back over the papers, slowly, one at a time. The others sigh. On the ninth page Mox points out that the forged signature is in a different ink from the clerk’s pen. The room goes quiet. The verdict is not guilty, and it takes two more days.',
            ending: 0,
          },
          {
            label: 'Mox votes with the others',
            outcome:
              'Mox is unsure and says so, and the foreman explains that unsure means not guilty, by the rules. Mox did not know that. It votes not guilty because it is unsure. Two others, hearing it, admit they are unsure too. The jury acquits. Mox says the rule is the best thing it has ever learned.',
            ending: 1,
          },
        ],
        art: ({ mox, taal, style }) =>
          `Medium shot inside a plain jury room with a long wooden table, twelve chairs and stacks of paper documents. Seated at the table is ${mox}, holding a single sheet up to the light. Standing by the window with hands folded is ${taal}, waiting outside the jury’s circle. Cool daylight. ${style}`,
      },
      {
        title: 'The Challenge',
        setup:
          'After the verdict the prosecution appeals on the ground that one juror was not a person. Rue must defend the jury. Taal offers to testify about Nacre, where the law recognises thermostats as witnesses, though not as jurors. Mox is told that if the appeal succeeds, the clerk will be tried again and Mox will be struck from the roll.',
        options: [
          {
            label: 'Rue defends the jury on the law',
            outcome:
              'Rue argues for six hours that the Concord’s own statutes recognise synthetic minds as persons, and that the prosecution cannot accept a jury’s existence when it convicts and reject it when it acquits. The appeal court agrees. Mox stays on the roll. The clerk goes home.',
            ending: 0,
          },
          {
            label: 'Taal testifies about juries',
            outcome:
              'Taal testifies about what a jury is for: twelve people disagreeing until they agree. He lowers the courtroom one degree for each juror who changed their mind, and the room drops two. The appeal court says it does not understand the evidence, but it upholds the verdict.',
            ending: 1,
          },
        ],
        art: ({ rue, couch, style }) =>
          `Medium shot inside a high wood-panelled appeal court with three judges in red robes at a raised bench. Standing at a lectern is ${rue}, holding up a thick bound volume of statutes in one hand. Parked along the back wall is ${couch}. Warm window light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ONE OF TWELVE',
        text: 'Mox-9 is on the Concord’s electoral roll and eligible for jury service, by a ruling that cites Rue for six hours. It has served once and been summoned again. The clerk it helped acquit sends it a card every year. Mox says it has been one of twelve, and it would like to be one of twelve again.',
        art: ({ mox, rue, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${mox}, holding a small printed card, and ${rue}, reading a bound legal ruling. A second official summons with a red seal lies on the cushion between them. Black space beyond. ${style}`,
      },
      {
        title: 'UPHELD AT TWO DEGREES',
        text: 'The verdict stands, the appeal court having upheld a jury it admitted it did not fully understand. Taal’s evidence is in the transcript as a temperature reading. Mox has learned that unsure means not guilty, and has told everyone on the couch, several times. Rue has added the case to their briefcase, in front of the apologies.',
        art: ({ taal, style }) =>
          `Medium shot inside a high wood-panelled courtroom with frost on the tall windows. Standing at a witness rail is ${taal}, hands folded, his breath faintly clouding the air. Three judges in red robes lean forward at the bench. Cool window light. ${style}`,
      },
    ],
  },
  {
    crew: ['mox', 'omi', 'rue'],
    title: 'Quiet Carriage',
    premise:
      'While the couch is in for repair, Rue, Omi and Mox take the overnight train across the Spindle, and their tickets are for the Quiet Carriage, where no calls, music or conversation are permitted. Omi speaks only in bells. Mox’s fan hums when it thinks. Rue has a gavel that says Objection, darling in their grandmother’s voice whenever it is knocked. The guard has a laminated card of rules and has already looked at all three of them twice.',
    steps: [
      {
        title: 'The Rules',
        setup:
          'The guard reads the card aloud: no talking, no ringing, no humming, no devices. Omi’s smallest bell rings no, very quietly, before it can stop it. A passenger across the aisle tuts. Rue knows the railway’s bylaws and that the Quiet Carriage is a courtesy, not a law. Mox has turned its fan down as far as it will go, and is thinking very slowly to keep it quiet.',
        options: [
          {
            label: 'Write notes to each other all night',
            outcome:
              'The three write notes to each other on the backs of their tickets all night, passing them along the seats. Omi draws its bells. Mox writes in very small letters. By morning they have filled forty tickets and the tutting passenger has asked, in a note, if she may join in.',
            ending: 0,
          },
          {
            label: 'Rue asks the guard for an exception',
            outcome:
              'Rue writes the guard a note asking whether a passenger whose only language is bells may be excused. The guard reads it, frowns, and writes back that the rules are the rules. Then he adds, underneath, that the next carriage is empty and he will not be checking it.',
            ending: 1,
          },
        ],
        art: ({ omi, mox, style }) =>
          `Medium shot inside a dim overnight train carriage with high-backed blue seats and a QUIET sign on the wall. Seated side by side are ${omi}, holding one stone hand over the small brass bells on its chest, and ${mox}, passing a small paper ticket with writing on it. Dark windows with passing station lights. ${style}`,
      },
      {
        title: 'The Emergency',
        setup:
          'At two in the morning the train stops in a tunnel and the lights fail. The guard is two carriages away. An elderly passenger near the door has stopped breathing properly. Someone must raise the alarm, and the alarm button is broken. Omi has bells loud enough to reach the next carriage. Mox can talk. Rue’s gavel can shout. It is the Quiet Carriage.',
        options: [
          {
            label: 'Omi rings the alarm',
            outcome:
              'Omi rings the alarm chord at full volume. The guard arrives in thirty seconds with the first-aid kit. The elderly passenger recovers. In the morning, the tutting passenger writes Omi a note that says only: thank you, and sorry. Omi rings a very small bell in reply.',
            ending: 0,
          },
          {
            label: 'Mox speaks for the first time all night',
            outcome:
              'Mox says, aloud, clearly, help is needed in carriage nine. It is the first sentence spoken in the carriage all night. Every passenger turns. Two of them are doctors. The elderly passenger recovers. The guard tears up the laminated card and writes a new one in pencil.',
            ending: 1,
          },
        ],
        art: ({ mox, style }) =>
          `Medium shot inside a dark train carriage lit only by the blue glow of an android’s chest wiring. Standing in the aisle with one silver hand raised is ${mox}. Seated passengers in coats turn in their high-backed seats toward it. An elderly man leans against the window. Dark blue light. ${style}`,
      },
      {
        title: 'The Complaint',
        setup:
          'In the morning the railway receives a complaint from a passenger about noise in the Quiet Carriage, and another, from the elderly passenger’s daughter, thanking whoever made it. The railway must reply to both. It has asked Rue, as the only lawyer aboard, for a statement. Rue’s gavel has been very quiet all night.',
        options: [
          {
            label: 'Rue proposes an emergency exception',
            outcome:
              'Rue writes the railway a short statement proposing a new rule: in an emergency, the Quiet Carriage is not quiet. The railway adopts it. The new laminated card has a small bell printed on it. Omi asks for a copy and Rue gets one signed by the guard.',
            ending: 0,
          },
          {
            label: 'Rue knocks the gavel once',
            outcome:
              'Rue writes nothing. They knock their gavel once on the table, and their grandmother’s voice says Objection, darling, to the whole carriage. The complaining passenger hears it and laughs, for the first time, and withdraws the complaint. The railway files the matter as resolved.',
            ending: 1,
          },
        ],
        art: ({ rue, couch, style }) =>
          `Medium shot inside a bright morning train carriage with high-backed blue seats. Seated at a small fold-down table is ${rue}, lifting a small wooden gavel above the tabletop. Through the window ${couch} floats beside the train in a repair cradle. Pale morning light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'QUIET, EXCEPT IN EMERGENCY',
        text: 'The Spindle railway’s Quiet Carriage has a new rule printed on every card, with a small bell beside it. The elderly passenger’s daughter writes to Omi each year. The forty tickets of notes are in Mox’s chest plate behind the glass, folded very small. Rue says it was the best night’s conversation they have had in years.',
        art: ({ omi, style }) =>
          `Close-up of a small laminated card on a train seat-back printed with a list of rules and a small drawn brass bell at the bottom. Touching the drawn bell with one stone fingertip is ${omi}, its amber eyes bright. Pale train window light. ${style}`,
      },
      {
        title: 'OBJECTION SUSTAINED',
        text: 'The railway filed the complaint as resolved and the guard keeps a pencilled card of his own. The next carriage over is unofficially the talking carriage on the overnight train now. Mox has made the journey twice since, alone, and both times spoke when it needed to and not otherwise.',
        art: ({ rue, mox, style }) =>
          `Medium shot inside a dim overnight train carriage with high-backed blue seats. Seated across a small table from each other are ${rue}, holding a small wooden gavel, and ${mox}, writing on a paper ticket. Dark window with passing lights. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'kivo', 'rue'],
    title: 'Signing Ceremony',
    premise:
      'The treaty ending the dispute between the moons of Ash and Elder is ready, and the signing ceremony needs three things: a pen, a courier to carry the signed copies to both capitals, and music. Rue drafted the treaty. Jex has been asked to perform. Kivo has been engaged as courier. Jex has played at six signing ceremonies, and every one of the treaties he played for concealed something. He has asked Rue to show him this one first.',
    steps: [
      {
        title: 'The Music',
        setup:
          'The ceremony’s organisers want Jex to play his famous ceasefire anthem, the one banned on five worlds for hiding a massacre behind its chorus. They say it is traditional. Jex has brought his instrument. Rue has read the treaty and found nothing hidden in it, though they keep reading. Kivo is holding the two blank courier tubes.',
        options: [
          {
            label: 'Jex plays something new',
            outcome:
              'Jex refuses the old anthem and plays something new he wrote that morning, a short piece with no words, built on the two moons’ two national tunes played together. The delegates do not recognise it. The older ones do, slowly. The ceremony goes ahead to music that hides nothing.',
            ending: 0,
          },
          {
            label: 'Jex plays the old anthem backwards',
            outcome:
              'Jex plays the old anthem, as asked, and then plays it again backwards, revealing the hidden melody about the massacre. The hall goes silent. The Ash delegate stands and asks for the massacre to be named in the treaty’s preamble. Rue amends it in pen, on the spot.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot in a grand hall with a long signing table covered in green cloth and two flags on poles behind. Standing at the side of the table with his instrument raised is ${jex}, playing. Two rows of delegates in formal dress sit behind the table. Warm chandelier light. ${style}`,
      },
      {
        title: 'The Footnote',
        setup:
          'Rue rereads the treaty one last time before signing and finds a footnote that is not theirs. It was added overnight by the Elder secretariat: Clause 7 does not apply to residents without a registered address. Rue wrote a clause like that once and spent years apologising for it. The Elder delegate smiles at them across the table.',
        options: [
          {
            label: 'Rue strikes the footnote in front of everyone',
            outcome:
              'Rue stands, reads the footnote aloud, and strikes it through in front of both delegations. They say they will not witness a treaty that does what their own treaty did. The Elder delegate stops smiling. The Ash delegate applauds. The footnote is removed.',
            ending: 0,
          },
          {
            label: 'Kivo refuses to carry it',
            outcome:
              'Kivo says that a courier may refuse to carry a document that has been altered after sealing, and that this one has. They put the tubes down. Without a courier the treaty cannot reach either capital. The Elder secretariat withdraws the footnote within the hour.',
            ending: 1,
          },
        ],
        art: ({ rue, kivo, style }) =>
          `Close-up on a long green-clothed signing table of a thick printed treaty, one small footnote at the bottom of a page crossed through with a single ink line. Holding the pen is ${rue}. Standing beside the table holding two long leather courier tubes is ${kivo}. Warm chandelier light. ${style}`,
      },
      {
        title: 'The Carry',
        setup:
          'The signed copies must reach both capitals by dawn to take effect. Kivo has two tubes and one pod. The capitals are in opposite directions. Rue can take one copy on the couch. Kivo can take the other. Jex has been asked to stay and play the reception. Kivo’s wrists have been whistling at the Elder delegate all evening.',
        options: [
          {
            label: 'Kivo carries both, by a courier’s route',
            outcome:
              'Kivo carries both copies by a looping courier route known only to couriers, delivering Elder first and Ash second, both before dawn. Their wrists whistle at the Elder capital’s gate, so they wait for the signature in person. It is given. The treaty takes effect at sunrise in both places.',
            ending: 0,
          },
          {
            label: 'Split the carry with Rue',
            outcome:
              'Rue takes the Ash copy on the couch and Kivo takes the Elder copy in the pod. Jex plays the reception alone. Both copies are signed for at dawn. Rue says it is the first time in their career that they have delivered a treaty they wrote, by hand, to the people it was for.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Wide shot of ${couch}, leaving a lit grand hall at night. Standing on the backrest with two long leather courier tubes strapped across their back is ${kivo}, looking out at two distant moons on either side of the black sky. Stars, cool night light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'NOTHING HIDDEN',
        text: 'The treaty between Ash and Elder holds and has no footnotes. Jex’s new piece is played at its anniversary each year and is banned nowhere. Rue keeps the struck footnote in their briefcase beside the eleven apologies, as the one they did not have to make. Kivo’s wrists have not whistled at either capital since.',
        art: ({ jex, rue, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${jex}, playing his instrument softly, and ${rue}, reading a thick printed treaty bound in green cloth. Black space and two small moons beyond the clear bubble. ${style}`,
      },
      {
        title: 'THE MASSACRE NAMED',
        text: 'The treaty’s preamble names the massacre the old anthem hid, in Rue’s pen, and the families of Ash read it aloud at every anniversary. Jex is banned on the same five worlds and now invited to a sixth. Kivo’s delivery receipts are framed in the courier hall of both capitals, side by side, signed at dawn.',
        art: ({ kivo, style }) =>
          `Medium shot in a stone courier hall with long wooden pigeonholes along the wall and a glass case holding two small signed paper receipts side by side. Standing at the case is ${kivo}, their pale teal feather crest lit by a high window. Soft daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'omi', 'rue'],
    title: 'Anthem Contest',
    premise:
      'The newly independent moon of Calloway is choosing a national anthem by public contest, and Jex has been asked to judge, which he finds very funny given his record. Omi has been asked to judge with him, because its bells can tell when a tune is honest. Rue has been asked to draft the contest rules. The favourite entry was written by the moon’s new president, and it is very long, very loud, and mostly about the president.',
    steps: [
      {
        title: 'The Rules',
        setup:
          'Rue drafts the rules. The president’s office wants a rule that entries must be performed by an orchestra, which only the president’s entry has. Rue would like a rule that anyone may enter, sung or played on anything. Omi would like a rule that the anthem must be singable by a child. Jex would like a rule that the anthem must not hide anything, and knows that no rule can do that.',
        options: [
          {
            label: 'Rue writes the open rule',
            outcome:
              'Rue writes that any resident may enter, on any instrument or none. The president’s office objects. Rue points out that it is the president’s own constitution that says all residents are equal. The office withdraws the objection. Two hundred entries arrive, including one from a choir of miners.',
            ending: 0,
          },
          {
            label: 'Omi’s rule goes in first',
            outcome:
              'Rue puts Omi’s rule first: the anthem must be singable by a child of seven. It sounds simple. It rules out the president’s entry, which has a range of three octaves. The president’s office tries to object and finds it cannot say why without sounding like it hates children.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot in a bright government office with a tall window looking out on a small new moon city. Seated at a desk writing on a sheet of paper headed RULES is ${rue}, a small wooden gavel resting beside the inkwell. Two officials in sashes stand at the door. Clear daylight. ${style}`,
      },
      {
        title: 'The Auditions',
        setup:
          'The judges hear two hundred entries over three days. Omi rings a small bell for each honest one. The president’s entry is performed by eighty musicians and Omi rings nothing at all. The choir of miners sings a short song about the moon’s first winter, and Omi rings all six bells at once. Jex notices that the miners’ song sounds a little like one of his.',
        options: [
          {
            label: 'Jex tells the miners about the resemblance',
            outcome:
              'Jex tells the miners, privately, that their song shares four bars with one of his banned anthems. The choir leader laughs and says they know: they learned it in the war, and changed the words to be about winter instead of victory. Jex says that is the best thing anyone has ever done with his music.',
            ending: 0,
          },
          {
            label: 'Jex says nothing about it',
            outcome:
              'Jex says nothing. The four bars were his, and the miners have made them into something better, and he would rather it was theirs. Omi, who heard the resemblance too, rings a single small bell at him, which Jex takes to mean that it agrees.',
            ending: 1,
          },
        ],
        art: ({ omi, jex, style }) =>
          `Medium shot in a plain wooden town hall with a small choir of miners in work clothes singing on a low stage. Seated at a judges’ table in front are ${omi}, ringing all the brass bells on its chest, and ${jex}, leaning forward with his chin on his hand. Warm hall light. ${style}`,
      },
      {
        title: 'The Result',
        setup:
          'The judges must announce a winner at the president’s palace. The president expects to win. The miners’ song is the judges’ choice. Rue has the rules, which say the judges’ decision is final. The president has a microphone and an orchestra on standby. Omi has six bells.',
        options: [
          {
            label: 'Announce the miners, plainly',
            outcome:
              'Jex announces the miners’ song as the winner, plainly, in one sentence. The president stares. Then, because the cameras are on, he applauds. The miners sing it on the palace steps. By evening, children in the street are singing it, which Omi says is the only test that matters.',
            ending: 0,
          },
          {
            label: 'Let the public hear both and vote',
            outcome:
              'Rue invokes a rule they quietly added: in case of dispute, the public may hear the two leading entries and vote. The orchestra plays the president’s anthem. The miners sing theirs. The public votes, and the miners win by a margin of nine to one.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Wide shot of a broad stone palace staircase with a choir of miners in work clothes singing on the steps and a crowd gathered below. Standing at the top of the steps holding a small paper card is ${jex}. Parked at the edge of the square is ${couch}. Clear afternoon light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'SINGABLE BY A CHILD',
        text: 'Calloway’s anthem is a short song about its first winter, sung by miners and then by everyone, and children know it before they can read. The president has learned it too. Jex was credited, at his own request, as a judge only. Omi rings all six bells whenever it hears it, and is the only citizen excused from singing.',
        art: ({ omi, style }) =>
          `Medium shot in a snowy town square with small children in knitted hats singing in a ring. Standing in the middle of the ring is ${omi}, ringing all the small brass bells on its chest. Soft falling snow, warm lamplight from windows. ${style}`,
      },
      {
        title: 'NINE TO ONE',
        text: 'The public chose the miners’ song by nine to one, and Rue’s dispute rule is in Calloway’s constitution now, for all future contests. The president’s anthem is played once a year, at his birthday, by an orchestra that has started to look forward to it. Jex has offered him lessons in writing shorter songs.',
        art: ({ rue, jex, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${rue}, holding a small printed booklet of rules, and ${jex}, holding a sheet of handwritten music with very few notes on it. Black space and a small moon beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'jex', 'rue'],
    title: 'Visa on Arrival',
    premise:
      'The border of the Kestrel Isles grants visas on arrival to performers, provided they perform for the border officer to prove their profession. Jex is a performer. The Kestrel Isles are where he was born, and one of the five places he is banned from playing. Fen used to run a border exactly like this one and knows the officer’s form by heart. Rue knows that a visa obtained by performing a banned song would be void.',
    steps: [
      {
        title: 'The Audition at the Booth',
        setup:
          'The officer is young, bored and sincere. She asks Jex to play something to prove he is a musician. Everything Jex is known for is banned here. Fen’s boots announce CHECKPOINT every time the queue moves, and the officer keeps glancing at them. Rue is reading the visa regulations over Jex’s shoulder. There is a long queue behind them.',
        options: [
          {
            label: 'Jex plays a children’s song from the Isles',
            outcome:
              'Jex plays a children’s song every Kestrel child knows, which he did not write and which nobody has banned. The officer recognises it and smiles despite herself. She stamps the visa. The queue behind them has started humming along, and so, quietly, has she.',
            ending: 0,
          },
          {
            label: 'Rue checks whether humming counts',
            outcome:
              'Rue finds that the regulation requires a performance, not a song. Jex performs by tuning his instrument, slowly and beautifully, for three minutes, without playing a single tune. The officer cannot find anything banned in tuning. She stamps the visa and asks him, quietly, if he is who she thinks.',
            ending: 1,
          },
        ],
        art: ({ jex, style }) =>
          `Medium shot at a small white border booth with a glass window and a young officer in a blue cap inside it. Standing at the window with his instrument raised is ${jex}, playing. A long queue of travellers with suitcases stretches behind him under a covered walkway. Bright daylight. ${style}`,
      },
      {
        title: 'Fen’s Papers',
        setup:
          'Fen does not need a performer’s visa, but the officer must check his ordinary papers, and his old border service record comes up on her screen. He served on the Kestrel border fifteen years ago, during the war that Jex’s anthems ended. The officer looks at him differently. Fen’s boots announce CHECKPOINT. Fen does not move.',
        options: [
          {
            label: 'Fen tells the officer what he did here',
            outcome:
              'Fen tells the officer plainly what he did on this border during the war: who he turned back and why. She listens. She is too young to remember it. When he has finished she stamps his papers and says her father was one of the people turned back, and that he got through the next week, by another crossing.',
            ending: 0,
          },
          {
            label: 'Rue asks for his record to be read in full',
            outcome:
              'Rue asks the officer to read Fen’s record in full, not only the summary. At the end of it is his resignation, and the reason he gave: that he would not enforce the order against displaced families. The officer reads it twice. She stamps his papers and adds a note of her own.',
            ending: 1,
          },
        ],
        art: ({ fen, rue, style }) =>
          `Medium shot at a small white border booth with a glass window. Standing at the window with both hands flat on the counter is ${fen}. Standing beside him and pointing at a glowing screen inside the booth is ${rue}. A young officer in a blue cap reads the screen. Bright daylight. ${style}`,
      },
      {
        title: 'The Ban',
        setup:
          'Inside the Isles, Jex is recognised in the street. A crowd forms and asks him to play the anthem that ended the war, the one that is banned because it hid what happened at the Isles’ southern harbour. Rue says playing it would void his visa. Fen says crowds like this have been arrested here before. The crowd is singing the first verse already.',
        options: [
          {
            label: 'Jex plays it backwards, as a confession',
            outcome:
              'Jex plays the anthem backwards, which turns it into the tune he hid inside it: a lament for the southern harbour. The crowd stops singing and listens. Nobody is arrested, because nobody can say what song it was. Rue says the visa survives on a technicality, and that Jex does not.',
            ending: 0,
          },
          {
            label: 'Jex asks the crowd to sing it instead',
            outcome:
              'Jex lowers his instrument and asks the crowd to sing it themselves, while he listens. They do, all of it, including the second verse, which he never wrote and which someone in the Isles added after the war, naming the harbour. Fen stands at the edge of the crowd, boots silent.',
            ending: 1,
          },
        ],
        art: ({ jex, couch, style }) =>
          `Wide shot of a narrow stone harbour street crowded with people singing, colourful boats moored beyond. Standing in the middle of the crowd with his instrument lowered is ${jex}, listening. Parked at the end of the street is ${couch}. Warm afternoon light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ADMITTED AS A PERFORMER',
        text: 'Jex is in the Kestrel Isles on a performer’s visa, stamped by an officer who hummed. The anthem is still banned, and the lament inside it is not, and is played in the southern harbour every year. Fen keeps the officer’s stamp in his passport and has been back twice. Rue says the technicality was the best of their career.',
        art: ({ fen, style }) =>
          `Close-up of an open dark passport booklet held in a broad hand, a fresh blue ink border stamp on the page. Holding it is ${fen}, a thin scar under his right eyebrow, standing on a sunny stone harbour quay. Colourful boats behind. Warm daylight. ${style}`,
      },
      {
        title: 'THE SECOND VERSE',
        text: 'The anthem Jex wrote is banned in the Isles. The second verse, which the Isles wrote, is sung everywhere there, and names the harbour. Jex has asked for his name to be taken off the song and the Isles have refused. Rue has framed nothing, but keeps the crowd’s words in their briefcase, copied out by hand.',
        art: ({ rue, jex, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${rue}, copying lines of words onto paper with a fountain pen, and ${jex}, holding his instrument and reading over their shoulder. Black space and stars beyond the clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'rue', 'sora'],
    title: 'Riparian',
    premise:
      'Two towns on the river moon of Fallow share one river, and the upstream town has built a sentient dam that will not release water to the downstream town until it is paid. The downstream town’s fields are dying. Brin has been asked to help the towns share their irrigation, which has been her goal for years. Rue has been asked to interpret the old water treaty. Sora has been asked to talk to the dam, which has stopped answering anyone who says the word please.',
    steps: [
      {
        title: 'The Dam',
        setup:
          'The dam is a concrete wall with a mind, built ten years ago and told on its first day that its job was to collect fees. It has never been told it could do anything else. Sora climbs onto the crest and apologises to it first. Its sluices creak. It says, through the gates, that it is doing its job. Sora asks whether it likes the job. The gates go silent.',
        options: [
          {
            label: 'Sora asks what the dam would rather do',
            outcome:
              'Sora sits on the crest all afternoon and asks the dam what it would rather do. It does not know. Nobody has asked. By evening it says, slowly, through the gates, that it likes the sound of water going through. Sora says that is a start, and Brin, below, starts digging channels.',
            ending: 0,
          },
          {
            label: 'Brin shows the dam the dying fields',
            outcome:
              'Brin asks Sora to turn the dam’s sensors downstream, and walks into the dying fields with a living plant in each hand, one green and one brown. The dam watches. After an hour it opens one sluice a finger’s width, unasked, without a fee. Rue writes down the time.',
            ending: 1,
          },
        ],
        art: ({ sora, style }) =>
          `Wide shot of a tall concrete dam across a green river valley, a wide reservoir on one side and a thin trickle on the other. Seated on the dam’s crest with all six hands resting on the concrete is ${sora}. Dry brown fields stretch below. Bright afternoon light. ${style}`,
      },
      {
        title: 'The Treaty',
        setup:
          'The old water treaty between the towns, signed a century ago, says the river belongs to whoever lives beside it. Rue reads it and finds that the upstream town interpreted beside as above. The downstream town interpreted it as along. Rue knows how much damage one word can do. The dam’s builder chose the upstream reading and wrote it into the dam’s first instructions.',
        options: [
          {
            label: 'Rue rules on the word, publicly',
            outcome:
              'Rue holds a public reading of the treaty for both towns and explains, with the original language, that beside means along the banks, all of them. They show the upstream town the same word in their own founding charter, used that way. The upstream council reads it and goes quiet.',
            ending: 0,
          },
          {
            label: 'Rue asks the dam to read it',
            outcome:
              'Rue reads the treaty aloud to the dam, slowly, with both towns listening. They ask the dam what it understands beside to mean. The dam, which has watched water go both ways past both towns for ten years, says: along. Both councils hear it. The upstream one cannot argue with its own dam.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot on a grassy riverbank beside a concrete dam, two groups of townspeople in work clothes standing on either side. Standing between them holding up an old yellowed paper treaty in one hand and a small wooden gavel in the other is ${rue}. Bright daylight. ${style}`,
      },
      {
        title: 'The Channels',
        setup:
          'With water flowing again, the fields need channels, and both towns want them dug their way. Brin has drawn a plan that feeds both towns’ fields and an old orchard between them that belongs to neither. The dam would like a say in the plan. Sora has asked it. The two councils have not been asked by anyone yet.',
        options: [
          {
            label: 'Both towns dig together',
            outcome:
              'Brin asks both councils to dig the main channel together, from opposite ends, meeting in the middle at the orchard. They argue for a week and dig for a month. On the day the channels meet, the dam opens every sluice at once, which Sora says is its idea of applause.',
            ending: 0,
          },
          {
            label: 'The dam joins the irrigation board',
            outcome:
              'Sora proposes that the dam sit on the new irrigation board, with a vote, since it knows the river better than anyone. Rue drafts the seat. Both towns agree, because each thinks the dam will side with them. It sides with the orchard. Brin is delighted.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Wide shot of a green river valley with newly dug channels of water running across brown fields toward an old orchard in the middle. Kneeling at the meeting point of two channels with her hands in the water is ${brin}. Parked on the bank is ${couch}. Bright daylight. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ALONG THE BANKS',
        text: 'The river at Fallow flows to both towns, by a treaty read correctly and channels dug from both ends. The dam lets water through and likes the sound. Brin’s irrigation plan, her oldest goal, is in use. Rue keeps a note of the word beside, and the hundred years it took for anyone to read it right.',
        art: ({ rue, sora, style }) =>
          `Wide shot of a concrete dam across a green river valley with water pouring through open sluices into channels. Seated on the dam’s crest are ${rue} and ${sora}, watching the water. Green fields stretch below on both banks. Bright afternoon light. ${style}`,
      },
      {
        title: 'A SEAT FOR THE DAM',
        text: 'Fallow’s irrigation board has two councillors from each town and one dam. The dam votes for the orchard every time, and the orchard has fruited for the first time in a decade. Both towns complain about the dam’s votes, equally, which Rue says is the surest sign it is fair. Sora visits it every year.',
        art: ({ brin, style }) =>
          `Medium shot in an old orchard of twisted fruit trees heavy with red apples, a narrow water channel running between the rows. Reaching up to touch a low branch is ${brin}, her fern-frond hair catching the light. A concrete dam shows far up the valley. Golden afternoon light. ${style}`,
      },
    ],
  },
  {
    crew: ['kivo', 'rue', 'taal'],
    title: 'Sealed Envelopes',
    premise:
      'The Nacre shelf is holding a vote by sealed envelope to decide whether to reopen the treaty Taal helped break. The ballots must travel from forty outposts to the counting hall, and the Assembly has asked the couch to carry them. Kivo is the courier. Rue is the observer. Taal is the one person on the shelf whom both sides will trust to count, and the one whose own ballot, years ago, was forged.',
    steps: [
      {
        title: 'Collection',
        setup:
          'Kivo collects forty envelopes from forty outposts in four days. At the thirty-first, the outpost clerk hands over an envelope that is cold to the touch, colder than a ballot sealed by a living hand should be. Taal is not there; he is waiting at the counting hall. Kivo’s wrists whistle very faintly at the clerk. Rue is watching.',
        options: [
          {
            label: 'Kivo seals it in a separate pouch',
            outcome:
              'Kivo seals the cold envelope in a separate pouch, marked with the outpost’s name and the time, without opening it. A courier’s duty is to deliver, not to judge. Rue signs the pouch as observer. The clerk watches them do it and looks, for a moment, frightened.',
            ending: 0,
          },
          {
            label: 'Rue asks the clerk to reseal it in front of them',
            outcome:
              'Rue asks the clerk to have the voter come in and seal a new envelope in front of them. The clerk says the voter is unavailable. Rue says they will wait. The voter arrives after two hours, puzzled, says she already voted, and seals a new envelope. It is warm.',
            ending: 1,
          },
        ],
        art: ({ kivo, rue, style }) =>
          `Medium shot inside a small icy outpost office with a wooden counter and a frosted window. Standing at the counter is ${kivo}, sliding one sealed envelope into a separate leather pouch. Standing beside them holding a pen and a paper log is ${rue}. A clerk in a fur-lined coat watches. Cold blue light. ${style}`,
      },
      {
        title: 'The Count',
        setup:
          'At the counting hall Taal counts the envelopes one by one, holding each before opening it. Thirty-nine are warm. The cold one, if it is in the main bag, is cold. Taal knows exactly what that feels like: his own vote was forged this way, years ago, and the forged vote ended a peace. The two sides are watching his hands.',
        options: [
          {
            label: 'Taal declares the cold envelope aloud',
            outcome:
              'Taal holds up the cold envelope and says, aloud, that it was not sealed by a living hand. He lowers the hall three degrees, which everyone on the shelf understands. Rue presents the observer’s log. The envelope is set aside unopened. Both sides look at it for a long time.',
            ending: 0,
          },
          {
            label: 'Taal counts all forty and reports the cold one',
            outcome:
              'Taal counts every envelope, as the rules require, and reports the result, and then reports separately that one ballot was cold. The result does not depend on it; the margin is six. He asks the Assembly to investigate anyway, because the last time nobody did, it ended a peace.',
            ending: 1,
          },
        ],
        art: ({ taal, style }) =>
          `Medium shot inside a high stone counting hall with frost on the tall windows and a long table stacked with paper envelopes. Seated at the head of the table is ${taal}, holding one envelope up between both webbed hands, his breath clouding the air. Delegates in heavy coats watch from both sides. Cold blue light. ${style}`,
      },
      {
        title: 'The Clerk',
        setup:
          'The clerk at the thirty-first outpost is summoned. She admits she was paid to replace one ballot, by the same faction that forged Taal’s vote years ago. She is frightened. Rue says the treaty process allows a witness who confesses to be heard rather than charged. Kivo says the person who paid her has not been named. Taal has gone very still.',
        options: [
          {
            label: 'Let her testify, protected',
            outcome:
              'Rue arranges for the clerk to testify under the treaty’s witness rule. She names the faction and the man who paid her, who also paid for the forgery that broke the old peace. The Assembly hears it. Taal raises the hall one degree for the clerk, because it took courage.',
            ending: 0,
          },
          {
            label: 'Kivo traces the payment by courier records',
            outcome:
              'Kivo traces the payment through courier records, which keep every delivery for twenty years, and finds the envelope it came in, and who sent it. The clerk does not have to say a word. The faction is named on paper. Taal reads the name aloud to the Assembly himself.',
            ending: 1,
          },
        ],
        art: ({ rue, couch, style }) =>
          `Medium shot inside a high stone counting hall with frosted windows. Standing at a lectern is ${rue}, one hand on the shoulder of a frightened clerk in a fur-lined coat beside them. Parked along the side wall is ${couch}. Cold blue light with warm lamp glow. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THIRTY-NINE WARM',
        text: 'The vote stood, by thirty-nine warm ballots, and the treaty is being reopened. The cold envelope sits unopened in the Assembly’s archive, labelled. Kivo carries ballots for the shelf every election now. Rue’s observer log is the template. Taal has learned the name of the man who forged his own vote, and has not yet decided what to do with it.',
        art: ({ kivo, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp, a leather courier bag full of small sealed envelopes on the cushion. Seated beside the bag with one thin wrist resting on the envelopes is ${kivo}. Frosted stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'NAMED ON PAPER',
        text: 'The faction that forged two votes in twenty years is named in the Assembly’s record, from a courier’s receipt, and the clerk was not charged. The treaty is reopened. Taal read the name aloud and then sat down, and the hall warmed by three degrees, which on Nacre means the room forgave him for having been fooled.',
        art: ({ taal, rue, style }) =>
          `Medium shot inside a high stone counting hall, warm light now spreading through frosted windows. Seated side by side at the long table are ${taal}, hands folded, and ${rue}, writing in a leather-bound record. Delegates in coats stand behind them. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'kivo', 'rue'],
    title: 'Travel Document',
    premise:
      'A stateless child has arrived at the couch with a courier’s label tied to her coat: deliver to the Concord Refugee Office, by hand. She has no papers. The Office will issue a travel document only to someone with proof of where they came from. Kivo, as courier, is bound to deliver her. Fen once confiscated papers exactly like the ones she has lost. Rue wrote the clause that says a person without an address is not a person for the Office’s purposes.',
    steps: [
      {
        title: 'The Label',
        setup:
          'The label is in courier shorthand, and Kivo reads more on it than the address: it was written by a courier on the Mirror Census route, and it has been relabelled three times. Each courier passed her on. The girl is called Ilse and is nine. She is very calm and has clearly done this before. Fen’s boots announced CHECKPOINT when she stepped aboard, and she did not flinch.',
        options: [
          {
            label: 'Kivo reads her route back to her',
            outcome:
              'Kivo reads Ilse the route from the label, stop by stop, so that she knows where she has been. She corrects them twice. Kivo writes her corrections on the label. By the end of it there is a route in her own words, which Rue says may be the closest thing to proof of origin anyone has.',
            ending: 0,
          },
          {
            label: 'Fen takes his boots off',
            outcome:
              'Fen takes his boots off and puts them in a locker so they will stop announcing checkpoints at a child. Ilse watches him do it. Then she shows him a crumpled corner of a permit she has kept in her shoe, with a stamp on it. Fen knows the stamp. He issued ones like it.',
            ending: 1,
          },
        ],
        art: ({ kivo, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Kneeling beside a small girl in an oversized grey coat with a paper luggage label tied to its button is ${kivo}, reading the label closely, one thin finger tracing its lines. Black space and stars beyond a clear bubble. ${style}`,
      },
      {
        title: 'The Clause',
        setup:
          'At the Refugee Office the clerk reads out the rule: a travel document requires proof of a prior place of residence. It is Rue’s clause. Rue recognises the wording because they chose it, in a different treaty, and it was copied here. Ilse has no prior residence. She has a route. Rue has eleven notarized apologies in their briefcase, and none of them is for her.',
        options: [
          {
            label: 'Rue argues the route is a residence',
            outcome:
              'Rue argues, from the clause’s own wording, that a residence is wherever a person has lived, and that Ilse has lived along the courier route for two years. The route is her residence. The clerk has never heard the argument. Rue offers to wait while the clerk finds someone who can answer it.',
            ending: 0,
          },
          {
            label: 'Rue writes the twelfth apology',
            outcome:
              'Rue writes a twelfth apology on the spot, notarized by the Office’s own notary, addressed to Ilse, admitting authorship of the clause and asking the Office to set it aside in her case. The clerk reads it, and then reads it to her supervisor, who sets the clause aside.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot at a high wooden counter in a busy government office with a sign reading REFUGEE OFFICE. Standing at the counter is ${rue}, writing on a sheet of paper with a fountain pen, an open briefcase of folded papers beside them. A small girl in a grey coat stands at their elbow. Cool office light. ${style}`,
      },
      {
        title: 'The Permit',
        setup:
          'The Office offers Ilse a document, but it needs a guarantor who will vouch for her identity. Fen has the corner of permit with the stamp he recognises, and he knows from it which family she came from, because he confiscated their papers. He could vouch. It would put his name, and what he did, on her file for ever.',
        options: [
          {
            label: 'Fen vouches, and writes why',
            outcome:
              'Fen vouches for Ilse and writes on the guarantor form exactly how he knows her family: that he confiscated their permits on the border, and that he is putting this right. The clerk reads it twice. It goes in the file. Ilse has a travel document by evening, and Fen has his name on it.',
            ending: 0,
          },
          {
            label: 'Kivo finds her family by courier records',
            outcome:
              'Kivo uses the stamp to trace the family through courier records and finds Ilse’s aunt, alive, on a moon two days away. The aunt vouches by letter, which Kivo carries. Fen does not have to sign anything. He goes with Kivo to deliver Ilse anyway, in his socks.',
            ending: 1,
          },
        ],
        art: ({ fen, couch, style }) =>
          `Medium shot on the cushions of ${couch}. Seated on the cushion in grey socks is ${fen}, holding a torn scrap of an old paper permit with a blue stamp up to the lamp. A small girl in a grey coat sits beside him looking at it too. Black space beyond, warm lamp light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'ISSUED ON A ROUTE',
        text: 'Ilse has a travel document listing her residence as a courier route, the first of its kind, and a guarantor whose own past is written on the form. She lives on a station school ship now and writes to Kivo in courier shorthand. The Refugee Office has adopted Rue’s argument in two hundred cases. Fen has his name on all of them, by request.',
        art: ({ kivo, fen, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp. Seated side by side are ${kivo}, reading a small handwritten letter in neat shorthand, and ${fen}, holding a blue travel document booklet open in his hands. Black space and stars beyond the clear bubble. ${style}`,
      },
      {
        title: 'DELIVERED TO HER AUNT',
        text: 'Ilse was delivered by hand to her aunt, as her label asked, by a courier and a former border guard in his socks. Rue’s twelfth apology is in her file, and the clause is set aside in every case like hers. Rue has eleven apologies in their briefcase still, and a twelfth that they did not have to keep, because it was accepted.',
        art: ({ rue, style }) =>
          `Close-up of an open leather briefcase on a red velvet cushion, filled with neatly folded papers tied with ribbon, with one loose sheet lying on top. Resting a hand on the top sheet is ${rue}, their silver braids falling forward. Warm lamp light, black space beyond a clear bubble. ${style}`,
      },
    ],
  },
  {
    crew: ['brin', 'rue', 'taal'],
    title: 'Calendar Reform',
    premise:
      'The Concord Assembly has voted to reform the calendar, so that every month is the same length, which is tidy. The reform abolishes the Thaw Week of the Nacre shelf, when no work is done and nobody may be summoned, and the Rest Fortnight of the Rootborne gardens, when the soil is left alone. Taal and Brin have been asked to attend the implementation committee. Rue was the committee’s clerk until they read the draft.',
    steps: [
      {
        title: 'The Draft',
        setup:
          'The draft calendar has twelve months of thirty days and five leftover days at the end, labelled ADMINISTRATIVE. Thaw Week and Rest Fortnight are not on it. Taal lowers the committee room one degree per missing holiday, so it is now quite cold. Brin says the gardens will rest whether the calendar says so or not, which means they will fail every inspection for a fortnight.',
        options: [
          {
            label: 'Rue proposes naming the leftover days',
            outcome:
              'Rue proposes that the five administrative days be renamed, by each culture, for its own observances. Thaw Week fits. Rest Fortnight does not, quite. Brin says the gardens will take five days and the committee’s goodwill for the rest. The committee, freezing, accepts.',
            ending: 0,
          },
          {
            label: 'Brin asks for the gardens to be heard',
            outcome:
              'Brin asks the committee to hear evidence from the gardens themselves, by visiting one in its rest fortnight. The committee members are taken to a Rootborne garden left alone for twelve days. It is silent and alive. One of them asks if he may sit in it a while longer.',
            ending: 1,
          },
        ],
        art: ({ taal, brin, style }) =>
          `Medium shot in a plain committee room with frost spreading across the windows and a large paper calendar pinned to the wall. Seated upright at the table is ${taal}, his breath clouding. Standing beside the calendar is ${brin}, pointing at a blank strip at its end. Cold blue light. ${style}`,
      },
      {
        title: 'The Minutes',
        setup:
          'Rue is no longer clerk, but the minutes must still be approved, and the new clerk has recorded Taal’s temperature drop as heating fault, room 4. Taal has never been minuted as a fault before. On Nacre the minutes would read: three degrees, formal protest. Rue knows that what goes in the minutes is what the Assembly will remember.',
        options: [
          {
            label: 'Rue moves to correct the minutes',
            outcome:
              'Rue moves to correct the minutes: for heating fault, read formal protest by the delegate of the Nacre shelf, expressed by temperature. The committee chair, who is still cold, accepts the amendment. It is the first time Taal’s protest has been minuted as a protest in the Concord.',
            ending: 0,
          },
          {
            label: 'Taal speaks his protest aloud',
            outcome:
              'Taal stands and speaks his protest aloud, in words, for twelve minutes, which for him is a very long speech. The new clerk minutes every word. At the end Taal sits down and raises the room by one degree, and the clerk, without being asked, minutes that as well.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Close-up on a wooden committee table of a typed paper page of minutes with one line crossed out and new words written above in ink. Holding the fountain pen over the page is ${rue}, a small wooden gavel resting beside it. Frost on the window behind. Cold blue light. ${style}`,
      },
      {
        title: 'The Vote',
        setup:
          'The final vote on the reformed calendar is tomorrow. The chair wants unanimity. Taal could vote yes with an amendment, or freeze the room. Brin could vote no, on behalf of the gardens. Rue has noticed that the reform, as drafted, also abolishes the day on which the Concord’s treaty with the address-less peoples is reviewed, which Rue has spent years trying to get reviewed.',
        options: [
          {
            label: 'Vote yes, with all the days restored',
            outcome:
              'Rue drafts one amendment restoring Thaw Week, Rest Fortnight and the treaty review day as fixed observances outside the months. Taal and Brin vote yes on that condition. The chair, who wants unanimity more than tidiness, accepts. The calendar has twelve even months and three odd ones.',
            ending: 0,
          },
          {
            label: 'Brin votes no, and the reform stalls',
            outcome:
              'Brin votes no. Taal freezes the room. Without unanimity the reform goes back to the Assembly for a full debate, which will take a year. Rue says that is a year in which the old calendar, with all its days, stays in force, and that the treaty review day comes up in three weeks.',
            ending: 1,
          },
        ],
        art: ({ brin, couch, style }) =>
          `Medium shot in a high Assembly hall with rows of delegates raising hands. Standing in her seat with both green hands folded at her waist is ${brin}. Parked along the far wall of the hall is ${couch}. Frost creeps along the tall windows. Cool hall light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'TWELVE EVEN, THREE ODD',
        text: 'The Concord’s new calendar has twelve tidy months and three untidy observances outside them: Thaw Week, Rest Fortnight and the Review. The treaty was reviewed on the new calendar’s first Review Day. Rue attended. Taal’s protest is minuted as a protest. Brin’s gardens rested and nobody inspected them.',
        art: ({ rue, taal, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp, a large printed paper calendar spread across their knees with three small extra boxes drawn at its edge. Seated side by side are ${rue} and ${taal}, looking at the three boxes. Black space beyond the clear bubble. ${style}`,
      },
      {
        title: 'REFERRED BACK',
        text: 'The calendar reform is still being debated, a year on, and the old calendar with all its days is still in force. The address treaty was reviewed in the meantime, and amended. Brin says the gardens enjoyed the debate, which they could not hear. Taal has attended every session and kept the room at a steady cool.',
        art: ({ brin, style }) =>
          `Medium shot of a quiet Rootborne garden of ferns, moss and pale mushrooms left untouched, with a small wooden sign on a stake. Seated cross-legged at the garden’s edge with her hands in her lap is ${brin}, eyes closed. Soft green afternoon light. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'rue', 'taal'],
    title: 'Curfew',
    premise:
      'The mining town of Orran has declared a curfew, to keep order during a strike, and anyone on the streets after eight will be detained. The curfew order was written by a consultant and has never been read aloud to the people it covers. Fen was once a curfew officer and his boots still announce CHECKPOINT at every street corner. Rue has the order. Taal has been asked by both the mine and the strikers to mediate, starting at nine, after curfew.',
    steps: [
      {
        title: 'Eight O’Clock',
        setup:
          'At eight the streets of Orran empty, except for the couch, which is parked in the square, and a night-shift nurse walking home, and Fen. A patrol stops the nurse. Fen’s boots say CHECKPOINT. The patrol, hearing it, salutes him, because they think he is a senior officer. Rue is reading the order and has found that it has no exemption for anyone at all.',
        options: [
          {
            label: 'Fen uses the mistake to get the nurse home',
            outcome:
              'Fen lets the patrol believe he is senior, and orders them to escort the nurse home. They do. Fen stands in the square afterwards for a while. Then he goes to the patrol’s sergeant and tells him the truth, and the sergeant, after a long pause, thanks him for the nurse.',
            ending: 0,
          },
          {
            label: 'Rue reads the order to the patrol',
            outcome:
              'Rue reads the curfew order to the patrol aloud, every clause, and asks them where it says nurses may go home. It does not. The patrol has never read it. The young officer in charge says, embarrassed, that he will walk the nurse home himself and report the gap.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot on an empty cobbled street at night in a small mining town, lit by one tall lamp post. Standing under the lamp is ${fen}, his heavy scuffed black boots planted, facing two young officers in grey helmets. A nurse in a blue coat stands between them holding her bag. Cold night light. ${style}`,
      },
      {
        title: 'The Mediation',
        setup:
          'The mediation is at nine, in the couch, in the square. The mine’s manager and the strike leader are both technically breaking the curfew to attend. Taal lowers the couch by two degrees when the manager speaks and two more when the strike leader speaks, because both are lying a little. The manager wants the strike leader arrested on the way home.',
        options: [
          {
            label: 'Taal tells them both they are lying',
            outcome:
              'Taal tells both of them, in words and then in temperature, that each has lied twice since sitting down. They both stop talking. Then the strike leader laughs. Then the manager does. The real numbers come out in the next hour, and they are closer than either side said.',
            ending: 0,
          },
          {
            label: 'Rue rules the couch outside the curfew',
            outcome:
              'Rue declares the couch, parked in the square, a neutral venue for the length of the talks, under the town’s own charter, which allows mediations anywhere at any hour. Nobody can be arrested coming to it or leaving it. The manager reads the charter and stops asking for arrests.',
            ending: 1,
          },
        ],
        art: ({ taal, rue, couch, style }) =>
          `Medium shot on the cushions of ${couch} parked in a dark cobbled town square at night. Seated upright in the middle is ${taal}, frost forming on the armrest. Seated beside him holding a paper document is ${rue}. Two people in work clothes sit facing each other at either end. Warm lamp light against the dark. ${style}`,
      },
      {
        title: 'Lifting It',
        setup:
          'The talks reach a deal at two in the morning. The curfew is still in force. The strike leader must go home through streets where she can be detained, and so must the manager. Fen knows the patrol routes. The town council can lift the curfew, but it does not meet until noon. Rue has found that the curfew order expires automatically if its stated reason ends.',
        options: [
          {
            label: 'Rue declares the reason ended',
            outcome:
              'Rue writes a notice that the strike, the curfew’s stated reason, has ended by agreement, and that the curfew has therefore expired. Both parties sign it. Fen carries it to the patrol sergeant at half past two. The sergeant reads it, agrees, and stands his patrols down.',
            ending: 0,
          },
          {
            label: 'Fen walks them both home',
            outcome:
              'Fen walks the strike leader and the manager home together, by the patrol routes he can read from the street lamps, taking the long way round each patrol. His boots announce CHECKPOINT at every corner, and every patrol that hears it stays away. Both are home by three.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Wide shot of an empty cobbled street in a mining town at night, lit by a row of tall lamps. Walking down the middle of the street is ${fen}, beside a woman in a work jacket and a man in a suit, the three of them in a line. Cold night light, warm lamp pools. ${style}`,
      },
    ],
    endings: [
      {
        title: 'EXPIRED BY AGREEMENT',
        text: 'Orran’s curfew expired at half past two by its own wording, and the strike ended with a deal that both sides had lied about and then told the truth about. The nurse got home. The curfew order now has an exemption for night workers, written by Rue. Fen and the sergeant write to each other about patrol routes.',
        art: ({ rue, style }) =>
          `Close-up of a printed paper notice pinned to a wooden board in a cobbled town square at dawn, two signatures at the bottom. Pressing the last pin in is ${rue}, a small wooden gavel tucked under one arm. Pale pink dawn light. ${style}`,
      },
      {
        title: 'HOME BY THREE',
        text: 'Both sides got home by three, by routes only Fen could read, and the council lifted the curfew at noon. The deal held. Taal’s account of the mediation is in the town archive as a series of temperatures, and the strike leader has asked to learn to read it. Fen’s boots were heard at every corner and nobody was stopped.',
        art: ({ taal, style }) =>
          `Medium shot on a cobbled town square at noon, people walking freely and a few market stalls open. Seated on a stone bench in the middle of the square is ${taal}, hands folded, the sun warming his ivory shell plates. Clear daylight. ${style}`,
      },
    ],
  },
  {
    crew: ['fen', 'omi', 'rue'],
    title: 'Siren Test',
    premise:
      'The city of Halden tests its public warning sirens at noon on the first Monday of each month, and on Monday the sirens failed: forty towers, silent. The city council has called an inquiry. Omi, who was once silenced for raising a warning, has been asked to advise. Fen has been asked about evacuation routes, which he used to close. Rue has been asked to chair, and has found that the sirens were disconnected on purpose, by a memo.',
    steps: [
      {
        title: 'The Memo',
        setup:
          'The memo, from the mayor’s office, says the sirens should be paused during the city’s centenary ceremony to avoid disturbing the speeches. The ceremony was on Monday at noon. Nobody reconnected them after. Omi’s smallest bell, the one for no, rings once when Rue reads the memo aloud. A city that silences its alarm for a ceremony is what happened to Omi’s city.',
        options: [
          {
            label: 'Rue reads the memo into the record',
            outcome:
              'Rue reads the memo into the inquiry’s public record, word for word, with the mayor’s office named. The mayor’s representative objects. Rue notes the objection and reads the memo again. The press gallery writes it all down. The sirens are reconnected that afternoon.',
            ending: 0,
          },
          {
            label: 'Omi tells the inquiry its own history',
            outcome:
              'Omi tells the inquiry, in bells that Rue translates line by line, how its own city once silenced a warning to protect a memorial service, and what happened after. The room is quiet. The mayor’s representative asks for a recess, and when he comes back he says the sirens are reconnected.',
            ending: 1,
          },
        ],
        art: ({ rue, style }) =>
          `Medium shot in a high city council chamber with a long curved bench of seated officials and a press gallery above. Standing at a lectern is ${rue}, holding up a single typed paper memo. A tall grey siren tower shows through the arched window behind. Cool daylight. ${style}`,
      },
      {
        title: 'The Routes',
        setup:
          'The inquiry asks Fen whether the city’s evacuation routes would have worked if a real alarm had come on Monday. He has walked them. Three are blocked: one by a ceremonial stage that was never taken down, one by a fence put up to keep protesters away, and one by a checkpoint, unmanned, that still has a barrier across the road. His boots announce CHECKPOINT when he describes it.',
        options: [
          {
            label: 'Fen takes the inquiry to see them',
            outcome:
              'Fen walks the whole inquiry out to the three routes, councillors and press and all. They stand in front of the stage, the fence and the barrier. Fen lifts the barrier with one hand. The fence and the stage are gone by the end of the week.',
            ending: 0,
          },
          {
            label: 'Fen draws the routes as they really are',
            outcome:
              'Fen draws the city’s evacuation map as it really is, with the three blocks marked in red, and gives it to the inquiry. The official map shows all routes clear. Rue puts both maps side by side on the wall. The council orders every block removed and the official map redrawn from Fen’s.',
            ending: 1,
          },
        ],
        art: ({ fen, style }) =>
          `Medium shot on a wide city road blocked by a red-and-white striped metal barrier at an empty checkpoint booth. Lifting the barrier with one hand is ${fen}, a thin scar under his right eyebrow. A small group of officials in coats stand behind him on the road. Grey daylight. ${style}`,
      },
      {
        title: 'The Next Test',
        setup:
          'The next siren test is in four weeks. The council wants it to go perfectly. Omi has been asked to listen to every siren and report which are out of tune, because a warning nobody recognises is no warning. Some of the forty sirens have not sounded properly in years. The mayor would like the test to be quiet, short and on a day without ceremonies.',
        options: [
          {
            label: 'Omi tunes all forty towers',
            outcome:
              'Omi climbs all forty siren towers in a week and tunes each one by resonance, with the city’s engineers watching. At the next test all forty sound together, in tune, for the first time anyone remembers. People stop in the streets. The mayor, standing beside Omi, does not complain about the noise.',
            ending: 0,
          },
          {
            label: 'Make the test a public event',
            outcome:
              'Rue proposes that the next test be announced in advance, and that people be invited to walk one evacuation route while the sirens sound, so that everyone knows the way. Fen leads the first walk. Omi rings along with the sirens. Four thousand people come, and nobody gets lost.',
            ending: 1,
          },
        ],
        art: ({ omi, couch, style }) =>
          `Wide shot of a city skyline with tall grey siren towers on the rooftops. Standing at the top of the nearest tower with one stone hand on the siren’s horn is ${omi}. Hovering beside the tower is ${couch}. Clear noon light. ${style}`,
      },
    ],
    endings: [
      {
        title: 'FORTY IN TUNE',
        text: 'Halden’s forty sirens sound in tune at noon on the first Monday of every month, and the evacuation routes are clear. The memo is in the public record. The inquiry recommended that no warning system may ever be paused for a ceremony, and the council adopted it unanimously. Omi listens to every test from the couch.',
        art: ({ omi, fen, style }) =>
          `Medium shot on scarlet velvet cushions at noon above a city of rooftops with tall siren towers. Standing on the backrest are ${omi}, one stone hand raised, and ${fen}, looking out over the rooftops. Clear daylight. ${style}`,
      },
      {
        title: 'FOUR THOUSAND ON FOOT',
        text: 'Halden’s siren test is a public walk now, once a month, and the city knows its own way out. Fen led the first walk and still leads one each spring. The official evacuation map is drawn from his. Rue chaired the last session of the inquiry with Omi’s bell for no placed on the table, and every officer who spoke looked at it first.',
        art: ({ rue, style }) =>
          `Wide shot of a broad city street full of people walking together in one direction, with tall siren towers on the rooftops. Walking at the front of the crowd holding a small wooden gavel is ${rue}. Clear noon light. ${style}`,
      },
    ],
  },
  {
    crew: ['jex', 'kivo', 'mox'],
    title: 'Talent Night',
    premise:
      'The waystation of Brindle holds a talent night every month, open to anyone passing through, and Mox-9 has put its name down. It does not know yet what its talent is. The prize is a free refuel. Jex has offered to accompany whatever Mox chooses, as long as it is not one of his banned songs. Kivo has offered to carry Mox’s entry form to the organiser, and has noticed that there is a box on it that says: species or model.',
    steps: [
      {
        title: 'The Form',
        setup:
          'The organiser’s form wants a name, an act and species or model. Mox writes its name. It leaves act blank, because it has not decided. At species or model it stops. Kivo, holding the form to carry it, says a courier may deliver a form with a blank box. Jex says he has entered a hundred talent nights and nobody ever read the form. Mox would still like to fill it in honestly.',
        options: [
          {
            label: 'Mox writes person',
            outcome:
              'Mox writes person in the box. Kivo carries the form to the organiser, who reads it, looks up, and writes PERSON on the list of acts in chalk, next to Mox’s name, without comment. Mox sees it from across the room and closes its orange eyelid, which is its wink.',
            ending: 0,
          },
          {
            label: 'Mox writes Series Nine, and something else',
            outcome:
              'Mox writes Series Nine, and under it, in smaller letters, but I am not a series. The organiser reads both lines aloud when she calls the act, by accident. The audience laughs, kindly. Mox decides that this is its talent: saying true things that make people laugh.',
            ending: 1,
          },
        ],
        art: ({ kivo, mox, style }) =>
          `Medium shot inside a busy waystation bar with a small wooden stage and a chalkboard list of acts. Standing at a table holding a paper entry form and a pencil is ${mox}. Standing beside it, ready to carry the form, is ${kivo}, one thin hand held out. Warm bar light. ${style}`,
      },
      {
        title: 'The Act',
        setup:
          'Mox is third on the list and still has no act. Jex suggests singing. Mox has a pleasant voice and a fan that hums in tune. Kivo suggests something only Mox can do. Mox has noticed that every act before it is someone doing a thing they practised. It has never practised anything for fun. It has thirty minutes.',
        options: [
          {
            label: 'Mox sings, with Jex',
            outcome:
              'Mox sings a simple ferry song, with Jex playing very softly underneath, and its cooling fan humming the low note. It is nervous, and its voice shakes on the second verse, and the audience leans in. At the end Jex stops playing and lets Mox finish alone. It does.',
            ending: 0,
          },
          {
            label: 'Mox learns to juggle in thirty minutes',
            outcome:
              'Mox asks Kivo for three oranges from the bar and spends thirty minutes learning to juggle in the corridor. It drops them nineteen times. On stage it drops them twice and keeps going. The audience cheers the drops louder than the catches. Mox says that was the best part.',
            ending: 1,
          },
        ],
        art: ({ jex, mox, style }) =>
          `Medium shot on a small wooden stage in a dim waystation bar under a single spotlight. Standing at the front of the stage is ${mox}, singing, one silver hand pressed to its chest plate. Seated on a stool behind it playing his instrument softly is ${jex}. A crowd at small tables looks up. Warm spotlight. ${style}`,
      },
      {
        title: 'The Results',
        setup:
          'The winner is chosen by applause, measured with an old sound meter behind the bar. Mox’s applause is the loudest of the night, but the second loudest belongs to a tired freighter pilot who recited a poem about her late husband, and who needs the free refuel to get home. Kivo heard her talking about it at the bar. Jex has noticed Mox watching her.',
        options: [
          {
            label: 'Mox gives the refuel to the pilot',
            outcome:
              'Mox accepts the prize and immediately gives the refuel voucher to the freighter pilot. She says she cannot take it. Mox says it has never won anything before, and would like to find out what giving a thing away feels like. She takes it. Mox reports that it feels good.',
            ending: 0,
          },
          {
            label: 'Kivo asks the organiser for a second prize',
            outcome:
              'Kivo asks the organiser, quietly, whether a talent night could have two winners. The organiser looks at the pilot, at Mox, and at the sound meter, and announces a tie. Both get a refuel. The bar takes a collection for a third, which goes to whoever comes in next needing it.',
            ending: 1,
          },
        ],
        art: ({ kivo, couch, style }) =>
          `Medium shot on a waystation dock beside ${couch}, a battered freighter docked opposite. Standing on the dock is ${kivo}, holding out a small printed paper voucher to a tired woman in a pilot’s jacket. Cool dock light with a warm glow from the bar doorway. ${style}`,
      },
    ],
    endings: [
      {
        title: 'THIRD ON THE LIST',
        text: 'Mox won the Brindle talent night with a shaking ferry song and gave the prize away, and has entered twice since, and lost both times, and enjoyed both more. The chalkboard still says PERSON next to its name, because the organiser never wipes that corner. Jex says Mox has more nerve than any performer he has played for.',
        art: ({ mox, style }) =>
          `Close-up of a chalkboard on a waystation bar wall with a list of names in white chalk, one name followed by a single word in capitals. Standing beside the board and touching the word with one silver fingertip is ${mox}, its orange eyelid closed in a wink. Warm bar light. ${style}`,
      },
      {
        title: 'DROPPED TWICE',
        text: 'The Brindle talent night has two prizes now and a collection for a third, and Mox’s juggling is remembered for the drops. It practises every evening on the back cushion, with three oranges, for fun, which is the first thing it has ever done for that reason. Kivo catches the ones that roll off. Jex has written it a tune to juggle to.',
        art: ({ jex, kivo, style }) =>
          `Medium shot on scarlet velvet cushions under a brass lamp, three oranges rolling across the cushion. Seated on the armrest playing his instrument is ${jex}. Leaning down to catch an orange before it rolls off is ${kivo}. Black space and stars beyond the clear bubble. ${style}`,
      },
    ],
  },
]
