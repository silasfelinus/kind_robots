import type { SublevelRoomContent } from './types'

const MORROW =
  'an androgynous adult in their thirties with short dark hair and a grey cardigan'

export const SUBLEVEL_ROOMS_A: readonly SublevelRoomContent[] = [
  {
    id: 'SB-01',
    title: 'Sublevel B Door',
    kind: 'entry',
    speaker: 'Morrow',
    opening:
      'The steel door at the foot of the back stairwell gives onto Sublevel B: an intake counter, a returns trolley, a corridor of strip lights waiting on a switch. Morrow has been here once, on the night of the trade, and he knew it then the way a burglar knows a house: by the cold, the hum, the number of steps to the desk. He has never seen it with the lights on. The switches are by the door. His hand already knows where.',
    artSubject: `A heavy steel basement door standing open onto a dark archive intake area, a faint strip of stairwell light falling across a returns counter and a parked library trolley, ${MORROW} on the threshold with one hand raised toward a row of wall switches`,
    echoes: [
      {
        flag: 'entry:escort',
        text: 'Walt holds the door with his shoulder and signs the log under Rowan’s line, ‘W., escort’, in neat capitals. ‘Floors are done,’ he says. ‘I’ve got an hour, and I’m not spending it in the cold room.’',
      },
      {
        flag: 'entry:badge',
        text: 'The reader blinks amber, thinks about it, then goes green. On its tiny screen: KOWALCZYK, L. ARCHIVES. Somewhere a server is writing down that Lena came to work at a quarter to eleven at night.',
      },
    ],
    choices: [
      {
        id: 'lights',
        label: 'Throw the switches and see it properly',
        outcome:
          'The strips stutter on bank by bank, and the place he remembered as a cave of breath and paper turns out to be beige: a counter, a sign about trolley etiquette, a calendar two months behind. He is almost insulted. The light will also show under every door down here, and on any monitor that cares.',
        gain: { evidence: 1, danger: 1 },
        artSubject: `A beige basement intake area as fluorescent strip lights flicker on one bank at a time, a returns counter, an out-of-date wall calendar, ${MORROW} squinting with one hand still on the switches`,
      },
      {
        id: 'dark',
        label: 'Leave the lights off and walk it by memory',
        outcome:
          'Eleven steps to the counter, a left at the cold draught, a trolley exactly where his shin expects it. He doesn’t know how he knows; he knows. Nobody upstairs will see a light. He will also miss most of what the dark is keeping to itself.',
        gain: { danger: -1 },
        artSubject: `A pitch-dark archive intake lit only by a thin line of light under a door, the outline of ${MORROW} walking with one hand trailing along a counter edge, eyes half closed, a library trolley just ahead`,
      },
    ],
  },
  {
    id: 'SB-02',
    title: 'Key-Log Corridor',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'A second key log hangs at the corridor’s turn, this one for the archive itself. Rowan’s name runs down it four times this spring, every sign-out after ten at night. In the ‘returned’ column beside each one is the night archivist’s initial, H., and a tidy time: 06:10, 06:05, 06:10, 06:00. Same green pen, same pressure, all four as if written in one sitting. Someone signed him back in. He never came back to sign himself.',
    artSubject:
      'A clipboard key log hanging on a chain from a hook in a concrete corridor under strip light, a column of handwritten lines with one column filled in a different colour of ink, a green pen tied to the chain with string',
    choices: [
      {
        id: 'photograph',
        label: 'Photograph the page',
        outcome:
          'The phone’s fake shutter sound is very loud against concrete. Morrow checks the picture twice: four nights out, four mornings in, and a looped green H he will know the next time he sees it.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} holding a phone up to a chained clipboard in a bare corridor, the screen glowing with a photo of the page, shoulders hunched as if the click were too loud`,
      },
      {
        id: 'fill-in',
        label: 'Sign a fifth line, and fill in its return time in advance',
        outcome:
          '‘Rowan, 22:50’ out and, in the returned column, ‘06:00’: a promise the page can keep even if he can’t. His pen is blue. Hers is green. Anyone who reads the log now will see two people covering for one.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${MORROW} writing on a chained clipboard with a blue biro, a green pen dangling unused beside it on its string, a long empty corridor behind`,
      },
    ],
  },
  {
    id: 'SB-03',
    title: 'Returns Trolley Bay',
    kind: 'treasure',
    speaker: 'Morrow',
    opening:
      'Three library trolleys sulk in a bay by the intake counter, loaded with boxes waiting to go back to their shelves. On the bottom tier of the nearest: a lost-property tray (one glove, a hairclip, a power bank with its cable wound round it like a sleeping snake) and the returns book, carbon copies in a spiral binding. Morrow’s phone shows three bars of charge. The returns book is a ledger of who came down here, and when.',
    artSubject:
      'Three steel library trolleys parked in a basement bay loaded with grey archive boxes, a plastic lost-property tray on a bottom shelf holding a single glove, a hairclip and a power bank with a coiled cable, a spiral-bound carbon book beside it, cool strip light',
    choices: [
      {
        id: 'power-bank',
        label: 'Borrow the power bank from lost property',
        outcome:
          'Half full, and labelled in green pen ‘found B, 3 April, unclaimed’. Morrow plugs in and watches the battery climb, and resolves, like a decent sort of thief, to put it back on the way out.',
        gain: { battery: 2 },
        artSubject: `${MORROW} sitting on the edge of a library trolley with a phone plugged into a small power bank, the lost-property tray on his knee, the phone screen lighting his face`,
      },
      {
        id: 'returns-book',
        label: 'Read the returns book',
        outcome:
          'Four returns in the same green pen, on the four mornings after Rowan’s sign-outs: ‘returned by H. for R.’ The last entry has no box number at all, only ‘R.: held in the cage’. Whatever Rowan left, Hollis kept it rather than file it.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} crouched by a library trolley turning the thin carbon pages of a spiral returns book under strip light, a finger stopped on one line`,
      },
    ],
  },
  {
    id: 'SB-04',
    title: 'Night Desk',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The night desk faces the corridor like a sentry box: a green-shaded lamp, a thermos still warm to the touch, a cardigan over the chair that is not grey. The rota pinned above it is one initial all the way down. H., Monday to Thursday. H., Friday, ‘cover’. H., Saturday, ‘cover’. Beside the March column, in pencil, small: ‘R. ok?’ She can’t be far. The lid of the thermos is off.',
    artSubject:
      'An empty archive night desk under a green-shaded lamp, a steel thermos with its lid off beside a mug, a knitted cardigan draped over the chair back, a handwritten rota pinned to a corkboard above, a dark corridor beyond',
    autoChoiceId: 'read-rota',
    echoes: [
      {
        flag: 'SB-02:photograph',
        text: 'The H on the rota is the same looped green H he photographed in the key log. It isn’t a forgery. It’s a habit.',
      },
      {
        flag: 'SB-02:fill-in',
        text: 'There is a blue pen in Morrow’s pocket and a fresh blue line in the key log. Her green pen lies capped by the thermos: the older half of the same lie.',
      },
    ],
    choices: [
      {
        id: 'read-rota',
        label: 'Count the nights on the rota',
        outcome:
          'Forty-one nights since March. Somebody has been sitting up for Rowan all spring, and lying very neatly in a key log to keep him out of trouble. Morrow puts the thermos back exactly where it was, handle out, the way she left it.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} at an empty night desk tracing a column of handwritten initials on a pinned rota with one finger, the other hand carefully setting down a thermos, lamplight on his face`,
      },
    ],
  },
  {
    id: 'SB-05',
    title: 'Fire Stair Landing',
    kind: 'shortcut',
    speaker: 'Morrow',
    opening:
      'A concrete landing, and a fire stair climbing back to the Annex ground floor behind a push-bar door with the small red bell of an alarm contact. The contact’s wire has been unclipped and taped back to the frame with masking tape. On the tape, in Rowan’s capitals, a date in March. This is how he came and went without the building knowing. It is also a fire door that will not shout.',
    artSubject:
      'A bare concrete stair landing with a green-painted fire door and push bar, a small red alarm bell above the frame, its thin wire unclipped and held back against the frame with a strip of masking tape, a stairwell rising into dim light',
    choices: [
      {
        id: 'reconnect',
        label: 'Clip the alarm wire back where it belongs',
        outcome:
          'The contact seats with a click. The stair is honest again: if anyone opens that door now, the whole Annex will hear, even if the anyone is Morrow, running. He peels off Rowan’s tape and keeps it, date and all.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${MORROW} on tiptoe pressing a small alarm wire back into its contact above a fire door, a curl of peeled masking tape in his other hand`,
      },
      {
        id: 'leave-taped',
        label: 'Leave Rowan’s tape where it is',
        outcome:
          'A silent way up, exactly as Rowan built it. Morrow tells himself it is only for tonight, which is probably what the date on the tape meant too. If anyone ever needs this door to scream, it won’t.',
        gain: { danger: -1 },
        artSubject: `${MORROW} standing back from a fire door looking at a strip of tape on its frame, hands in cardigan pockets, a silent stairwell rising behind the door’s narrow window`,
      },
    ],
  },
  {
    id: 'SB-06',
    title: 'Locker 37',
    kind: 'treasure',
    speaker: 'Morrow',
    opening:
      'A bank of grey staff lockers, most with names on tape. Number 37 has none, only a cheap three-wheel combination lock. Morrow tries 0-3-7, the end of Rowan’s library card number, because Rowan reused everything, and it opens. Inside: a spare grey cardigan, twin to the one he’s wearing; a tub of caffeine tablets, nearly empty; an index card of dates; and the smell of instant coffee and very late nights.',
    artSubject: `A row of grey steel staff lockers under strip light, one door open showing a folded grey cardigan, a small plastic tub and an index card on the shelf, ${MORROW} holding a small combination padlock that has just come open`,
    echoes: [
      {
        flag: 'e03:3,7:care',
        text: 'The appointment Morrow booked for Rowan is still written faintly on the back of his hand. Taped inside the locker door is a leaflet from the same clinic, folded small and never unfolded.',
      },
      {
        flag: 'e03:3,7:risk',
        text: '‘Working nights on a project I can’t put down,’ the doctor’s note said. The locker smells exactly like that sentence.',
      },
    ],
    choices: [
      {
        id: 'index-card',
        label: 'Take the index card of dates',
        outcome:
          'Four dates that match the key log, and a fifth with no sign-out at all. Beside each, the hours Rowan slept: 5, 3, 0, 0. Beside the fifth, only a question mark, pressed hard enough to dent the card.',
        gain: { evidence: 1 },
        artSubject: `Close on the hands of ${MORROW} holding a worn index card with a short handwritten column, a deep pen dent visible at the bottom, an open locker door blurred behind`,
      },
      {
        id: 'cardigan',
        label: 'Put on the spare cardigan; the cold rooms are next',
        outcome:
          'Two layers of Rowan’s wool, one over the other. It fits, naturally. There is a biro in the inside pocket and a clinic card he never used. Morrow is warmer than he has been all night and stranger than he has been all week.',
        gain: { danger: -1 },
        artSubject: `${MORROW} shrugging a second, identical grey cardigan on over the first in front of an open locker, catching his own reflection in the steel door`,
      },
      {
        id: 'close',
        label: 'Close the locker as you found it',
        outcome:
          'Morrow has his body, his badge, his name and his mug. The locker he can leave him. He spins the wheels back to 0-0-0, and the small courtesy feels larger than it should.',
        gain: { trust: 1 },
        artSubject: `${MORROW} gently closing a grey locker door and turning the wheels of a small combination lock with a thumb, the row of lockers stretching away under strip light`,
      },
    ],
  },
  {
    id: 'SB-07',
    title: 'Compactor Aisle',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'The compactor stacks: twenty steel shelving units on floor rails, cranked together to save space, opened by a motor at each end panel. Aisle 3 stands open. A yellow light starts turning and a recorded voice, very polite, says the night cycle will close all aisles in thirty seconds. The far end of aisle 3 is where Morrow needs to be. The shelves begin to move with the patience of a tide.',
    artSubject: `A long narrow aisle between two towering steel rolling shelf units packed with archive boxes, the units sliding together on floor rails, a rotating amber warning light at the end panel, ${MORROW} at the mouth of the aisle looking down it`,
    choices: [
      {
        id: 'run',
        label: 'Run the aisle before it closes',
        outcome:
          'He makes the far end with a hand’s width spare and leaves a cardigan button between the shelves, which meet behind him like a book closing. On the end panel at shoulder height: a column of pencil tallies. Someone used to run this aisle at night, and count.',
        gain: { evidence: 1, danger: 2 },
        artSubject: `${MORROW} squeezing sideways out of a nearly closed gap between two steel shelf units, a sleeve snagged, amber light sweeping across the boxes`,
      },
      {
        id: 'stop',
        label: 'Slap the red stop bar',
        outcome:
          'Everything halts with a clunk and a long, aggrieved beep. The aisle is his. On a screen at the night desk a line now reads ‘Aisle 3: emergency stop, 23:04’, and whoever reads it will know someone stood exactly here.',
        gain: { danger: 1 },
        artSubject: `${MORROW} with a palm flat on a big red stop bar on a shelving end panel, the rolling shelves frozen half closed, a small display glowing above his hand`,
      },
      {
        id: 'wait',
        label: 'Stand clear and wait out the cycle by phone torch',
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        outcome:
          'The aisles close, the motion lights decide he isn’t there, and he waits in the dark with the torch on until the cycle finishes and a quiet button opens aisle 3 again. Six minutes by the phone clock. Nothing logs him. The hum of the stacks sounds, for a while, like someone breathing slowly nearby.',
        gain: { battery: -1, danger: -1 },
        artSubject: `${MORROW} standing very still against a wall in a dark stack room, a phone torch making a small pool of light on closed steel shelving`,
      },
    ],
  },
  {
    id: 'SB-08',
    title: 'Aisle Codes',
    kind: 'puzzle',
    speaker: 'Morrow',
    opening:
      'Three aisles hold Annex deposits, 7, 8 and 9, a coloured tag on every box spine. The laminated rule on the end panel: ‘Night deposits shelve to odd aisles. Lab projects: white tag. Personal projects: blue tag.’ Rowan only ever came down after ten at night, and the sleep study was his own, not the lab’s. Aisle 7 is white tags; aisle 8, blue; aisle 9, blue. Morrow, who has only read this room by touch, reads the rule twice.',
    artSubject:
      'Three numbered end panels of motorised archive shelving side by side, each with a crank handle and a laminated card, the boxes inside showing rows of small coloured spine tags, white in one aisle and blue in the other two, cool fluorescent light',
    choices: [
      {
        id: 'aisle-7',
        label: 'Open aisle 7: the night side, where the lab boxes live',
        outcome:
          'Night deposits, all right, but every tag is white: calibration runs, humidity data, Dr Sen’s lab in forty boxes. Not his. The motor whines the whole time, and Morrow cranks it shut feeling noticed by a building.',
        gain: { danger: 1 },
        artSubject: `${MORROW} in a narrow shelving aisle running a finger along box spines with white tags, frowning, the crank handle still turning behind him`,
      },
      {
        id: 'aisle-8',
        label: 'Open aisle 8: the blue tags, personal projects',
        outcome:
          'Personal projects, deposited by day: a staff choir’s recordings, a retired chemist’s memoir in nine drafts. Lovely, and not Rowan’s. The motion lights time out while he reads, and he finds his way back by phone glow.',
        gain: { battery: -1 },
        artSubject: `${MORROW} in a darkening shelving aisle lit by phone glow, holding an open box of cassette tapes, blue tags on the spines around him`,
      },
      {
        id: 'aisle-9',
        label: 'Open aisle 9: an odd aisle, blue tags',
        outcome:
          'Night side, personal, and halfway along a box in Rowan’s capitals: PILOT. Inside, the sensor’s original packaging, Dr Sen’s loan form (‘two weeks’, signed in February) and fourteen nights of printouts, ordinary as porridge. This is what his sleep looked like before anyone read over his shoulder.',
        gain: { evidence: 2 },
        artSubject: `${MORROW} sitting on the floor of a shelving aisle with an archive box open on his knees, holding up a long printout of a calm sleep graph, an empty sensor box beside him`,
      },
    ],
  },
  {
    id: 'SB-09',
    title: 'Map Cabinet',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'A wide steel plan chest, its top drawer labelled FIRE & FLOOR. Inside, the archive drawn on tracing film: the intake, the compactor stacks, the cold rooms, a long corridor, the night archive at the far end. Most of it means nothing to Morrow. One corner does. A small room past the server hum, a radiator drawn as a zigzag, a desk drawn as a square. He has stood in that square. He has never seen it from above.',
    artSubject:
      'A wide steel plan chest with its shallow top drawer pulled open, a large translucent floor plan of a basement archive spread inside, rooms and shelving drawn in fine lines, one small corner room with a desk square under the light of a single lamp',
    choices: [
      {
        id: 'trace',
        label: 'Trace the way to that corner with one finger',
        outcome:
          'Down the corridor, past the hum, left at the warmth. His finger knows it before his eyes do, the way a tongue finds a missing tooth. It is a long way from here, and every room between is one he once walked through blind.',
        gain: { evidence: 1 },
        artSubject: `Close on the hand of ${MORROW} tracing a path across a translucent floor plan toward one small corner room, his grey cuff in the lamplight`,
      },
      {
        id: 'take-copy',
        label: 'Take the spare copy of the plan',
        outcome:
          'The copy folds into a cardigan pocket with a crackle like a confession. Now he can find anything down here. The drawer is also one copy short, and archivists notice exactly that kind of thing.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${MORROW} folding a large sheet of tracing film into quarters beside an open plan chest, glancing over his shoulder down a dim aisle`,
      },
    ],
  },
  {
    id: 'SB-10',
    title: 'Dead Projects Shelf',
    kind: 'choice',
    speaker: 'Morrow',
    opening:
      'A long shelf at the back holds studies that ended before they finished. Every box has a printed label: a title, a name, a status. ‘Withdrawn.’ ‘Funding ended.’ ‘PI left.’ At the end, flat-packed and new, a box from the Research Office: Rowan’s name, ‘sleep self-observation’, and ‘Status: ______’. A notice says boxes without a status are pulped at quarter end. Someone has already folded the coffin. It is waiting on a word.',
    artSubject: `A long archive shelf of worn cardboard boxes with printed labels, a single new flat-packed box at the end of the row with a blank line on its label, ${MORROW} standing before it holding a biro`,
    echoes: [
      {
        flag: 'e03:2,1:care',
        text: 'Third from the end: ‘Shift fatigue survey. Funding ended.’ A sticker underneath reads ‘M., RA, 3 yrs’ in the same exact capitals Mara wrote on his receipt. A career of hers ended on this shelf, and still she walked him onto the train.',
      },
      {
        flag: 'e03:2,1:risk',
        text: 'Third from the end: ‘Shift fatigue survey. Funding ended.’ A sticker underneath reads ‘M., RA, 3 yrs’ in Mara’s capitals. He told her he remembered everything. He didn’t know this, and she will assume he did.',
      },
    ],
    choices: [
      {
        id: 'ongoing',
        label: 'Write ‘ongoing’ in the status line, in Rowan’s hand',
        outcome:
          'Rowan’s handwriting comes out of Morrow’s pen as easily as breath. ‘Ongoing.’ The box will not be pulped, and nobody will be sent down to ask. A form now says Rowan is still doing this work, and Morrow is the only person who can make that true.',
        gain: { danger: -1, trust: -1 },
        artSubject: `${MORROW} writing a single word on a box label with a biro, his face unreadable, a shelf of old labelled boxes receding behind`,
      },
      {
        id: 'leave-blank',
        label: 'Leave the status blank for Rowan to fill in',
        outcome:
          'It isn’t his word to write. Morrow sets the box back square on the shelf. At quarter end someone from the Research Office will come down with a trolley and a question, and they will put it to the face he is wearing.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${MORROW} squaring a flat-packed archive box neatly on a shelf with both hands, pen capped in his breast pocket`,
      },
      {
        id: 'read-others',
        label: 'Read the dead boxes beside it first',
        outcome:
          '‘Withdrawn: participant unwell.’ ‘Ended: PI relocated.’ Every status is in the same typed font, and not one in its author’s hand. Every study on this shelf was ended by someone who wasn’t in it. Morrow closes the last lid gently, as if somebody were asleep inside.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} lifting the lid of an old archive box to read a typed slip inside, a row of other opened boxes along the shelf beside him, dusty light`,
      },
    ],
  },
  {
    id: 'SB-11',
    title: 'Lost Labels',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'A shoebox on a filing cabinet, marked in biro: LABELS THAT FELL OFF. Hundreds of them, glue long dead, curled like pencil shavings. ‘Box 14 of 22.’ ‘Do not freeze.’ ‘Mum’s letters, keep.’ Labels outlive the things they named. Near the top, newer than the rest, one in Rowan’s capitals: ‘NIGHTS 31–40. DO NOT FILE. STILL LOOKING.’ It has come away from whatever it was stuck to.',
    artSubject:
      'An open shoebox on top of a grey filing cabinet overflowing with hundreds of curled paper labels of every size and age, one crisp white label lying on top of the pile, a single desk lamp',
    autoChoiceId: 'keep-label',
    choices: [
      {
        id: 'keep-label',
        label: 'Keep Rowan’s label',
        outcome:
          'Morrow smooths it flat on his knee and slides it inside his phone case, where it will press against the glass all night. Still looking. For what, Rowan doesn’t say. Morrow has an uncomfortable feeling he is the answer.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} sitting on a step stool smoothing a curled paper label flat on his knee beside an open shoebox of labels, phone case open in his other hand`,
      },
    ],
  },
  {
    id: 'SB-12',
    title: 'Staff Kitchenette',
    kind: 'rest',
    speaker: 'Morrow',
    opening:
      'A kitchenette the size of a cupboard: a kettle, a microwave, a fridge door papered in passive aggression. Mugs on hooks, each with a name on tape. One says HOLLIS; one says nothing. The kettle is plugged into the only socket, and the socket is warm. Someone boils water down here every night. Morrow, who once took microwaves for captive hearths, sits on the step stool and lets the fridge hum be the only thing that wants anything from him.',
    artSubject: `A tiny basement staff kitchenette with a kettle, a microwave, a fridge covered in handwritten notes and a row of mugs on hooks, ${MORROW} sitting on a folding step stool with his head against the wall, warm lamplight`,
    choices: [
      {
        id: 'charge',
        label: 'Unplug the kettle and charge the phone',
        outcome:
          'Kettle out, phone in. The battery climbs while he reads the fridge: ‘Whoever keeps taking the oat milk, I know. H.’ He likes her already, which will not help. He plugs the kettle back in when he’s done, so the socket is warm for her.',
        gain: { battery: 2 },
        artSubject: `A phone charging on a kitchenette counter beside an unplugged kettle, ${MORROW} leaning in to read handwritten notes stuck to a fridge door`,
      },
      {
        id: 'note',
        label: 'Leave a note for Hollis under her mug',
        outcome:
          'He writes ‘Thank you for signing the returns’ and stops at the signature. Rowan? Morrow? He leaves it unsigned, under the mug with her name on it, and the not-signing says more than either name would.',
        gain: { trust: 1 },
        artSubject: `${MORROW} tucking a folded note beneath a mug on a kitchenette counter, the pen hovering, a row of named mugs on hooks above`,
      },
    ],
  },
  {
    id: 'SB-13',
    title: 'Cold Room One',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'Cold Room One: four degrees, a heavy insulated door, and a light switch that clicks and does nothing. The dark inside smells of cardboard and metal. Steel racks go back further than the corridor light reaches. Morrow knows there is a step down just inside; he knows it the way he knows all of this, without ever having seen it. Somewhere at the back a compressor ticks like a patient clock.',
    artSubject: `The open insulated door of a walk-in cold room, steel racks of boxes disappearing into total darkness, a faint mist at floor level, ${MORROW} silhouetted on the threshold with breath showing in the cold`,
    choices: [
      {
        id: 'torch',
        label: 'Light the racks with the phone torch',
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        outcome:
          'The beam finds Dr Sen’s rack and, on it, a kit box in Rowan’s capitals: SALIVA, SPARE. Empty tubes, and a leaflet: ‘freeze at −80 °C within one hour of waking’. Rowan was collecting more than heartbeats. The cold reaches Morrow’s fingers before he finishes reading.',
        gain: { battery: -1, evidence: 1 },
        artSubject: `A phone torch beam cutting through a dark cold room onto a small cardboard kit box of empty sample tubes on a steel rack, ${MORROW} holding the phone with breath clouding in the light`,
      },
      {
        id: 'feel',
        label: 'Go in by touch, the way you did before',
        outcome:
          'Step down, three paces, rack on the left. Shelf edge, box, box, and a tray of something glass that doesn’t break but rings for a very long time. He comes out with nothing except the certainty that he has done this before, in the dark, and been just as clumsy.',
        gain: { danger: 1 },
        artSubject: `${MORROW} in near-total darkness inside a cold room, one arm outstretched along a steel rack, a tray of glass vials tilting on a shelf beside his hand`,
      },
      {
        id: 'prop-door',
        label: 'Prop the door open to let the corridor light in',
        outcome:
          'Light falls in a long wedge across the racks, enough to read a kit box on Dr Sen’s shelf: Rowan’s capitals, spare saliva tubes, ‘freeze at −80’. After sixty seconds a door-open alarm begins to bleat, and a red light comes on above the frame that will also, he suspects, come on at the night desk.',
        gain: { evidence: 1, danger: 2 },
        artSubject: `A cold room door wedged open, a long wedge of corridor light across steel racks, a small red alarm light glowing above the frame, ${MORROW} inside reading a box label`,
      },
    ],
  },
  {
    id: 'SB-14',
    title: 'Freezer Log',
    kind: 'puzzle',
    speaker: 'Morrow',
    opening:
      'Three chest freezers hum in a row, each with a clipboard log and a card taped to the lid. A: ‘Staff, −20 °C, NO SAMPLES (whose fish is this?)’. B: ‘Sen Lab, −80 °C’. C: ‘Sen Lab, −20 °C, out of service since March, defrosting’. Rowan’s saliva tubes had to be frozen at −80 within an hour of waking, and he went on collecting them into May. Morrow’s fingers are already cold. He would like to open only one lid.',
    artSubject:
      'Three white chest freezers in a row against a basement wall, each with a clipboard hanging from a string and a taped card on its lid, one with a puddle of water spreading beneath it, frost on another’s seal, cold blue-white light',
    choices: [
      {
        id: 'freezer-a',
        label: 'Open freezer A: the closest, and nobody guards a staff freezer',
        outcome:
          'Fish fingers, a birthday cake with one slice gone, and a soup tub labelled H. that he knocks into the frost and can’t quite set back the same way. No tubes. Somebody will notice her soup has moved, and wonder who could have moved it.',
        gain: { trust: -1 },
        artSubject: `${MORROW} holding up the lid of a chest freezer over packets of frozen food and a cake box, reaching awkwardly to straighten a soup tub`,
      },
      {
        id: 'freezer-b',
        label: 'Open freezer B: Dr Sen’s, at −80',
        outcome:
          'Frost smokes over the rim. In a rack marked R.: forty small tubes, each labelled with a date and a waking time. 06:40. 05:10. 04:02. 03:15. The times creep earlier week by week, and the last tube has a date and no time at all.',
        gain: { evidence: 2 },
        artSubject: `White frost vapour pouring over the rim of an open deep freezer, ${MORROW} lifting out a small rack of labelled sample tubes with a gloved hand, his face lit cold blue`,
      },
      {
        id: 'freezer-c',
        label: 'Open freezer C: Dr Sen’s too, and nobody checks a broken one',
        outcome:
          'Warm air, a puddle, a smell like a pond in August. It has been off since March, so nothing Rowan froze after that could be in it. The seal sighs loudly as the lid comes down, and a fault light blinks to tell someone it has been disturbed.',
        gain: { danger: 1 },
        artSubject: `${MORROW} grimacing over an open chest freezer full of meltwater and empty racks, a small amber fault light blinking on its side`,
      },
    ],
  },
  {
    id: 'SB-15',
    title: 'Dr Sen’s Old Cabinet',
    kind: 'companion',
    speaker: 'Dr Sen',
    opening:
      'A grey filing cabinet stencilled SEN, moved down here when her lab got new furniture; she still files in it. Second drawer: a draft of Rowan’s study proposal, every margin full of Dr Sen’s soft pencil. ‘n = 1. You can’t be your own control.’ ‘Who calibrated this?’ ‘Lovely question. Please sleep.’ On the last page, underlined twice: ‘If the sensor is right, whose heart rate is this?’',
    artSubject: `An old grey filing cabinet with its second drawer pulled open in a quiet archive corner, ${MORROW} holding a stapled typed draft with every margin covered in faint pencil handwriting, a desk lamp angled over it`,
    echoes: [
      {
        flag: 'e03:5,2:care',
        text: 'Morrow has seen this pencil before, under his own admission in the team log: ‘Procedure revised, see p. 12.’ She corrects people the way other people hold doors.',
      },
      {
        flag: 'e03:5,2:risk',
        text: 'Clipped to the front is the chamber booking slip from his 3 a.m. re-run, on Rowan’s badge. Beside it Dr Sen has drawn one small, patient question mark.',
      },
    ],
    choices: [
      {
        id: 'take-draft',
        label: 'Take the annotated draft with you',
        outcome:
          'Her notes are the clearest thinking anyone has done about Rowan’s nights, Rowan included. Morrow folds the draft into his cardigan. It is Dr Sen’s cabinet and Dr Sen’s pencil, and one day she will open this drawer and find it empty.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${MORROW} folding a pencil-marked draft into the inside pocket of his cardigan beside an open filing cabinet drawer, not quite looking at it`,
      },
      {
        id: 'reply',
        label: 'Answer her last note in pencil, beneath it',
        outcome:
          'He writes, in the hand that is his now: ‘I don’t know yet. I’m finding out.’ It is true of Rowan and truer of him. Dr Sen goes through her old files every January; she will find it, and she will want to talk to whoever wrote it.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${MORROW} writing small in pencil at the bottom of a typed page laid on top of a filing cabinet, a stub of pencil, lamplight`,
      },
      {
        id: 'photograph',
        label: 'Photograph the pages and leave them where they are',
        outcome:
          'Twelve pages, twelve shutter sounds. Her pencil is faint on the phone screen but legible. He closes the drawer softly, the way she would, and the draft goes on waiting for the person it was written to.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} holding a phone flat above a draft laid in an open filing drawer, the screen glowing, the cabinet stencil softly lit`,
      },
    ],
  },
  {
    id: 'SB-16',
    title: 'Blast Chiller Door',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'The blast chiller is a walk-in box at −30 °C for freezing samples fast. Its door stands propped on a wooden wedge, and a work order taped at eye level says why: ‘INSIDE RELEASE BROKEN. DO NOT ENTER ALONE.’ The latch works from outside only. On the inside shelf, in plain sight, a box with the night desk’s green R. One kick of that wedge, by anyone, and whoever is inside stays there until the morning shift.',
    artSubject:
      'The heavy steel door of a walk-in blast chiller held a few feet open by a small wooden wedge, frost on the inner walls, a single cardboard box on a shelf inside, a taped paper work order on the door, harsh corridor light',
    echoes: [
      {
        flag: 'entry:escort',
        text: 'Walt reads the work order over Morrow’s shoulder. ‘I wrote that,’ he says. ‘After the summer. Don’t ask about the summer.’',
      },
      {
        flag: 'entry:badge',
        text: 'Nobody upstairs knows Morrow is down here except a card reader, and it thinks he is Lena Kowalczyk from Archives.',
      },
    ],
    choices: [
      {
        id: 'walt-holds',
        label: 'Ask Walt to stand in the doorway',
        requires: { entry: 'escort' },
        lockedHint: 'Only if Walt came down with you',
        outcome:
          'Walt plants himself in the doorway, arms folded, and talks the whole time about his niece’s football so Morrow can hear he’s still there. The box holds Rowan’s sensor charging dock and a receipt for a replacement strap. Walt counts him back out loud.',
        gain: { evidence: 1, trust: 1 },
        artSubject: `An older cleaner in a work tabard standing square in the open doorway of a frosted walk-in chiller, arms folded, talking, while ${MORROW} lifts a box from a shelf inside`,
      },
      {
        id: 'wedge',
        label: 'Trust the wedge and go in fast',
        outcome:
          'Ten seconds in a cold that hurts his teeth. A charging dock and a strap receipt, both Rowan’s. Coming out, his heel catches the wedge and the door swings, slow and enormous, and his hand reaches the edge a second before the latch does. He stands in the corridor shaking for a while.',
        gain: { evidence: 1, danger: 2 },
        artSubject: `${MORROW} braced in the gap of a swinging walk-in freezer door, one hand gripping its edge, a small box clutched to his chest, a wooden wedge skidding across the floor`,
      },
      {
        id: 'leave',
        label: 'Leave it. Nothing in a box is worth that',
        outcome:
          'In the Marches a door that locks from outside is a riddle. Here it is a door with a broken handle, which is worse, because nobody will be clever about it. He kicks the wedge in tighter, for the next person, and goes on.',
        gain: { danger: -1 },
        artSubject: `${MORROW} crouching to tap a wooden wedge firmly under a heavy chiller door with the heel of his hand, the box inside left untouched on its shelf`,
      },
    ],
  },
  {
    id: 'SB-17',
    title: 'Thermometer Wall',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'A wall of dials and chart recorders, one for every cold room, each inking a slow circle on a paper disc that gets changed on Mondays. Cold Room One, four degrees. Freezer B, minus eighty. Blast chiller, minus thirty. And pinned among them, an index card in Rowan’s capitals, ‘ME’, with a column underneath: 36.9, 36.6, 36.2, 35.8, one for each night he logged. He was charting his own body like one more cold room.',
    artSubject:
      'A basement wall covered in round dial thermometers and circular paper chart recorders with thin inked lines, one small handwritten index card pinned among the instruments, cool light and exposed pipes',
    autoChoiceId: 'read-card',
    choices: [
      {
        id: 'read-card',
        label: 'Read Rowan’s column to the bottom',
        outcome:
          'Each night a little lower, all of it normal, the drift a very tired body makes. On the last line there is no temperature, only a time, 02:14, and two words: ‘not mine?’ Morrow pins the card back exactly where it was, one more thing in here being kept cold.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} pinning a small index card back onto a wall crowded with dial thermometers and chart recorders, his reflection faint in a dial’s glass`,
      },
    ],
  },
  {
    id: 'SB-18',
    title: 'Warm Corridor',
    kind: 'shortcut',
    speaker: 'Morrow',
    opening:
      'Behind the compressors the corridor is warm as a held breath: heat thrown off by the machines, dust baking on the pipes. Morrow’s fingers come back to him one at a time. At the end, a fire door with a latch bar opens onto the stair landing by the intake, straight back to where he started. Latched, it is a wall. Unlatched, it is a way through that nobody planned for.',
    artSubject: `A narrow basement corridor lined with warm pipes and humming compressor housings, a heat haze in the light, a fire door with a latch bar at the far end, ${MORROW} holding both hands to a pipe to warm them`,
    echoes: [
      {
        flag: 'SB-05:reconnect',
        text: 'Beyond this door is the stair he made honest again. A shortcut through it would be quick, and loud, if he ever has to take it in a hurry.',
      },
      {
        flag: 'SB-05:leave-taped',
        text: 'Beyond this door is the stair Rowan taped silent. Unlatch it, and Sublevel B has a back way nobody upstairs will ever hear open.',
      },
    ],
    choices: [
      {
        id: 'unlatch',
        label: 'Unlatch the fire door to the stair',
        outcome:
          'The bar lifts with a clunk and the door swings onto the familiar landing. Sublevel B now has a back way, short and warm, from the intake to the cold rooms in two minutes. He has made the archive a little easier to get lost in, and a little easier to leave.',
        gain: { danger: 1 },
        artSubject: `${MORROW} pushing open a fire door from a warm pipe-lined corridor onto a cool concrete stair landing, light from the landing spilling back across the floor`,
      },
      {
        id: 'leave-latched',
        label: 'Leave the door latched, as it should be',
        outcome:
          'He leaves it. The long way round is long, but it is the way the building means him to walk, and he has broken enough of its rules tonight. He warms his hands on a pipe a moment longer before he goes on.',
        gain: { danger: -1 },
        artSubject: `${MORROW} with his back to a closed fire door, palms resting on a warm pipe, eyes shut for a moment in the low hum of the machines`,
      },
    ],
  },
]
