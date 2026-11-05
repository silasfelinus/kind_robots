import type { SublevelRoomContent } from './types'

/**
 * Sublevel B, rows 4–6 (SB-19..SB-36): the server and records wing,
 * Rowan’s corner, and the night archive with Hollis, the after-hours desk
 * and the way up. Nothing supernatural happens on screen; the dread is in
 * the records.
 */
export const SUBLEVEL_ROOMS_B: readonly SublevelRoomContent[] = [
  {
    id: 'SB-19',
    title: 'Server Hum',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'Past the cold rooms the air turns warm and dry, and the server room hums at a pitch Morrow feels in his back teeth. Racks of small green lights blink in no rhythm he can find. He knows this sound. On the night of the trade it was the only thing in the dark that wasn’t afraid of him, and he took it for the breathing of something large and patient. It is a ventilation fan. It is still a little like breathing.',
    artSubject:
      'A narrow server room aisle between tall black racks studded with tiny green and amber lights, warm haze in the air, an androgynous adult in their thirties with short dark hair and a grey cardigan standing with one palm flat on a rack’s mesh door and eyes closed, lit only by the equipment',
    autoChoiceId: 'listen',
    choices: [
      {
        id: 'listen',
        label: 'Stand in the warm aisle and read the rack labels',
        outcome:
          'The labels are in Hollis’s neat capitals: BACKUP, BADGES, CCTV 1–9. One strip of masking tape was added later, in biro: ROWAN SLEEP, DO NOT WIPE. Somebody down here was protecting his work long before Morrow came back to want it.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of a fingertip tracing a row of handwritten tape labels on a server rack, one strip of masking tape visibly newer than the rest, green status lights reflected on the knuckle',
      },
    ],
  },
  {
    id: 'SB-20',
    title: 'Badge Reader Hall',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'A long hall of fire doors, each with a grey badge reader and a small screen that names whoever passes. Above the third door a camera turns, slowly, like a heron. Morrow understands readers now: they don’t stop you, they remember you, and the memory goes upstairs by morning. A laminated notice says every door releases for one minute during the 01:00 fire-panel test. His phone says 00:41.',
    artSubject:
      'A long institutional basement hall of heavy fire doors in a row, each with a small grey badge reader glowing beside it, a ceiling camera on a bracket angled down the corridor, an androgynous adult in their thirties with short dark hair and a grey cardigan pausing at the first door, flat fluorescent light',
    echoes: [
      {
        flag: 'entry:escort',
        text: 'Walt badges the first door and the reader sulks red. He thumps it once on the casing, exactly where the paint is worn through. ‘Been doing that since 2009,’ he says. It goes green, as if embarrassed.',
      },
      {
        flag: 'entry:badge',
        text: 'Lena Kowalczyk’s badge turns the first reader green, and the little screen says HOLLIS. Not Lena. Not Rowan. A third name, logged at 00:41 at a door its owner is nowhere near.',
      },
    ],
    choices: [
      {
        id: 'swipe',
        label: 'Badge through every door and keep moving',
        outcome:
          'Four doors, four beeps, four lines in a log somebody will print on Monday. He is through in under a minute. The camera follows him the whole way, without opinion.',
        gain: { danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan walking briskly through a series of propped fire doors, a lanyard badge held out toward a green-lit reader, the ceiling camera turned to follow',
      },
      {
        id: 'wait',
        label: 'Wait in the stairwell for the fire-panel test',
        outcome:
          'Nineteen minutes on cold concrete with his phone for company, which costs what phones cost. At 01:00 every lock drops at once with a clunk down the whole hall, and he walks through unnamed.',
        gain: { battery: -1, danger: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan sitting on a concrete stair with knees drawn up, face lit blue by a phone screen, a fire door ajar beside him',
      },
      {
        id: 'walt',
        label: 'Let Walt take the doors at his own pace',
        outcome:
          'Walt mops his way down the hall and badges each door as part of the work, the way he does every night. On the log it will read as a cleaner cleaning. Morrow carries the bucket, which turns out to be the price of being invisible.',
        gain: { danger: -1, trust: 1 },
        requires: { entry: 'escort' },
        lockedHint: 'Only if Walt came down with you',
        artSubject:
          'An older cleaner in a work tabard mopping a basement hall and tapping a badge reader with his card as he passes, an androgynous adult in their thirties with short dark hair and a grey cardigan following behind carrying a yellow mop bucket',
      },
    ],
  },
  {
    id: 'SB-21',
    title: 'Security Monitors',
    kind: 'secret',
    speaker: 'Morrow',
    opening:
      'A cupboard of a room: nine small monitors, a swivel chair with a cushion tied on, a sticky note that says ‘playback: hold F4’. Eight screens show empty corridors. The ninth shows a corner of the archive Morrow would know blindfolded: a desk, a lamp, two chairs. The playback store goes back to spring. Somewhere in it is the night he arrived.',
    artSubject:
      'A cramped security cupboard with a grid of nine small monitors showing grainy empty corridors, one showing a desk with a lamp and two chairs, a worn swivel chair with a cushion tied to it, an androgynous adult in their thirties with short dark hair and a grey cardigan bending toward the screens, blue-grey screen glow',
    echoes: [
      {
        flag: 'e03:5,2:care',
        text: 'One feed shows the data room upstairs, where the shared log lies open on the table with his line under the error: too small to read, easy to find.',
      },
      {
        flag: 'e03:5,2:risk',
        text: 'The humidity lab upstairs is in the rotation too. Somewhere in its archive he is alone at 3 a.m., re-running a chamber so that nobody would ask.',
      },
    ],
    choices: [
      {
        id: 'watch',
        label: 'Hold F4 and watch the night of the trade',
        outcome:
          '02:14: Rowan at the desk, talking to the empty second chair, patient, the way you talk to someone you’ve been expecting. Then the clock jumps to 02:25. The same man sits up straighter, looks at the lamp as if lamps were news, and finds the camera with his eyes. Morrow watches himself arrive.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'Close view of a small grainy monitor showing a figure at a lamplit desk turned toward an empty chair, the reflection of an androgynous adult in their thirties with short dark hair faint in the screen glass, one finger pressed on a keyboard key',
      },
      {
        id: 'leave',
        label: 'Leave spring where it is',
        outcome:
          'He turns the ninth monitor down until the desk is only a grey shape, and goes. Rowan should be allowed one night that nobody replays. So, perhaps, should he.',
        gain: { danger: -1 },
        artSubject:
          'A hand turning down the brightness dial on one small monitor among nine, its picture fading to grey, an empty swivel chair pushed back from the desk',
      },
    ],
  },
  {
    id: 'SB-22',
    title: 'Tape Library',
    kind: 'puzzle',
    speaker: 'Morrow',
    opening:
      'Backup tapes stand in slots under a rota card in Hollis’s capitals: ‘Weekday tapes reused every Monday. Friday tapes kept five weeks. Month-end tapes kept for good. Yellow label = cleaning tape, never load.’ It is November. Rowan’s spring folder could be on three tapes: a weekday tape with an R pencilled on it, a yellow-labelled tape marked APR, or a white tape marked 30 APR. The old drive takes one at a time, slowly.',
    artSubject:
      'Floor-to-ceiling metal shelving of grey data backup cartridges in labelled slots, one cartridge with a yellow label standing out, a bulky old tape drive on a trolley with a slot glowing faintly, an androgynous adult in their thirties with short dark hair and a grey cardigan holding two cartridges side by side, cool strip light',
    choices: [
      {
        id: 'pencilled',
        label: 'Load the weekday tape with the pencilled R',
        outcome:
          'It holds last week’s facilities rota, written over a spring that is long gone. Whatever R once meant, the tape forgot it within seven days. The drive takes four loud minutes to rewind.',
        gain: { danger: 1 },
        artSubject:
          'A tape cartridge being ejected from an old drive while an androgynous adult in their thirties with short dark hair and a grey cardigan winces at the noise, a long list of rota entries on a small screen',
      },
      {
        id: 'yellow',
        label: 'Load the yellow tape marked APR',
        outcome:
          'The drive grinds, cleans its own heads and spits the tape back out. On the card, in pencil, is a running count of cleanings that Hollis will find one higher by morning.',
        gain: { danger: 1 },
        artSubject:
          'A yellow-labelled cartridge sticking half out of a tape drive slot, a pencil tally on a card pinned above it, a hand hovering, dim aisle light',
      },
      {
        id: 'month-end',
        label: 'Load the white month-end tape, 30 APR',
        outcome:
          'The drive lists Rowan’s folder as it stood on the last day of April. Beside the spreadsheets sits a text file, opened.txt: dates and times his files were opened on nights his sensor had him asleep. Thirteen lines, all between two and three in the morning.',
        gain: { evidence: 2 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan leaning close to the small green-on-black screen of an old tape drive, a white-labelled cartridge seated in the slot, face lit from below',
      },
    ],
  },
  {
    id: 'SB-23',
    title: 'Sump Pump Room',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'The floor dips and the strip lights stop. Water stands ankle-deep on the concrete, black and still until the sump pump in the corner kicks in, shudders for thirty seconds and stops. By its red standby light Morrow can make out a power strip on a crate, its cable trailing into the water, and a door on the far side with a dry step. He has crossed rivers that wanted him dead. This one only has to be careless once.',
    artSubject:
      'A dark flooded basement plant room, still black water across a concrete floor, a sump pump in the corner with a single red standby light, a power strip on a crate with its cable dipping into the water, a far door above a dry step, an androgynous adult in their thirties with short dark hair and a grey cardigan at the water’s edge',
    choices: [
      {
        id: 'torch',
        label: 'Light the way with the phone torch',
        outcome:
          'The beam finds what the red light hid: the cable’s split sheath under the surface, a missing grate over the sump pit, and a line of pallets someone laid as a path. Morrow walks the pallets like a balance beam and arrives with dry socks, which feels, absurdly, like a title.',
        gain: { battery: -1, danger: -1 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        artSubject:
          'A phone torch beam cutting across black water to show a row of wooden pallets and an open square pit, an androgynous adult in their thirties with short dark hair and a grey cardigan balancing along the pallets with arms out',
      },
      {
        id: 'wade',
        label: 'Wade straight across by the standby light',
        outcome:
          'He keeps to where he thinks the floor is. The pump kicks in at the halfway point, the water shivers against his shins, and nothing happens, and he will never know how close it was. His shoes squelch for the rest of the night.',
        gain: { danger: 2 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan wading shin-deep through black water in near darkness, trouser legs soaked, the red pin of a standby light reflected in ripples beside a trailing cable',
      },
      {
        id: 'isolator',
        label: 'Kill the pump at the wall isolator first',
        outcome:
          'The red light dies and the room goes properly dark, quiet and safe. He crosses by feel, one hand on the wall, and steps around the edge of something deeper. Behind him the water stops being pumped and begins, very slowly, to rise toward the tape library. Someone on the morning shift will spend an hour with a wet-vac and a question.',
        gain: { trust: -1 },
        artSubject:
          'A hand pulling down the lever of a grey wall isolator switch in a dark wet room, the last red glow of a pump light going out, faint outline of a figure in a cardigan against the wall',
      },
    ],
  },
  {
    id: 'SB-24',
    title: 'Loading Dock Ramp',
    kind: 'shortcut',
    speaker: 'Morrow',
    opening:
      'A concrete ramp climbs to a roller door and a steel side door with a push bar, where the archive takes its deliveries. Rain is loud beyond it. The floor plan taped beside the door shows a covered walkway outside, running straight to the night archive’s long corridor. A sign says the door is alarmed after 22:00. The alarm cable hangs unplugged, wound neatly round its bracket by someone who wanted to come and go.',
    artSubject:
      'A concrete loading-dock ramp inside a basement rising to a corrugated roller door and a steel side door with a push bar, an unplugged cable coiled neatly on a wall bracket, rain sound implied by wet streaks under the door, an androgynous adult in their thirties with short dark hair and a grey cardigan with one hand on the push bar, sodium light leaking in',
    echoes: [
      {
        flag: 'SB-18:unlatch',
        text: 'The warm corridor’s fire door is already unlatched behind him. If he wedges this one too, Sublevel B will have two doors that only he has propped open.',
      },
      {
        flag: 'SB-18:leave-latched',
        text: 'He left the warm corridor’s fire door latched, so there is no quick way back to the intake. This is the only shortcut on offer.',
      },
    ],
    choices: [
      {
        id: 'wedge',
        label: 'Wedge the side door with a folded delivery note',
        outcome:
          'He folds a delivery note into a thick square and kicks it under the door. Wet air comes in smelling of bins and buses. Now there is a straight run along the walkway to the long corridor, and an open door in a locked archive that anyone might find.',
        gain: { danger: 1 },
        artSubject:
          'A steel door held a few inches open by a folded wad of paper jammed underneath, rain blowing in across a covered walkway outside, wet light on the concrete ramp',
      },
      {
        id: 'close',
        label: 'Let it shut and do this the long way',
        outcome:
          'The push bar clunks home. Whatever else he does down here, he won’t have left a door open in the rain for strangers. The long way runs through Rowan’s corner, and he suspects that was always the point.',
        gain: { danger: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan turning away from a shut steel door at the top of a loading ramp, rain-beaded sleeve, looking back down into the archive',
      },
    ],
  },
  {
    id: 'SB-25',
    title: 'Carrel Row',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'Twelve study carrels in a row, each with a reading lamp, a name card in a brass slot and a mug its owner left behind. A chipped one says ‘World’s Okayest Postdoc’. One has a teabag fossilised to its side. One is full of pens, as if someone meant to come back for them. Most of the names belong to people who left years ago; the mugs stayed. Archives keep what people forget, Morrow thinks, and then, less comfortably: so does he.',
    artSubject:
      'A row of wooden study carrels in a basement archive, each with a small reading lamp and a different abandoned mug, one chipped, one stained, one stuffed with pens, an androgynous adult in their thirties with short dark hair and a grey cardigan walking slowly past them, pools of warm lamplight in a dim room',
    choices: [
      {
        id: 'rinse',
        label: 'Rinse the fossil mug and leave it upside down to dry',
        outcome:
          'There’s a small sink by the last carrel. He scrubs a stranger’s years-old tea out with his thumb and sets the mug upside down on a paper towel, as he has seen people do upstairs. It helps nobody. He feels better anyway.',
        gain: { trust: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan rinsing a stained mug at a small steel sink, sleeves pushed up, a row of carrel lamps glowing behind',
      },
      {
        id: 'cards',
        label: 'Read the name cards for Rowan’s',
        outcome:
          'Eleven strangers. Rowan’s carrel is the last one, round the corner, and its name card has been turned face down in the slot by someone who wanted his absence unannounced.',
        gain: { evidence: 1 },
        artSubject:
          'A finger lifting a small card that sits face down in a brass slot on the end of a wooden carrel, the lamp above it switched off',
      },
    ],
  },
  {
    id: 'SB-26',
    title: 'Rowan’s Carrel',
    kind: 'choice',
    speaker: 'Morrow',
    opening:
      'Rowan’s carrel is the tidy one. A ring binder of nights in his quick scrawl. A wrist sensor with Dr Sen’s lab sticker on the strap, borrowed in February and never returned, its cable coiled like a sleeping thing. Pinned to the partition, a photo: two people on a wet pier under an umbrella blown inside out, laughing too hard to fix it, ‘me + Jun’ on the border. Morrow has room in his arms, and his conscience, for one thing.',
    artSubject:
      'A neat wooden study carrel under a single lamp, a thick ring binder, a small black wrist sensor with its coiled charging cable, and a pinned photograph of two people laughing under an inside-out umbrella on a rainy pier, an androgynous adult in their thirties with short dark hair and a grey cardigan standing over it, hands at his sides',
    choices: [
      {
        id: 'binder',
        label: 'Take the sleep-study binder',
        outcome:
          'It is heavier than paper should be: three months of nights, printed, highlighted and argued with in the margins. Under his arm it stops being Rowan’s desk and starts being Morrow’s evidence. The carrel looks robbed without it.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan lifting a fat ring binder bristling with sticky tabs from a carrel shelf, leaving a clean rectangle in the dust',
      },
      {
        id: 'sensor',
        label: 'Bag the sensor to return to Dr Sen’s lab',
        outcome:
          'He winds the cable, slides the sensor into a padded envelope from the drawer and writes on it: ‘Dr Sen. Sorry it’s late. R.’ Then he looks at the R for a long time. He has been signing that letter for weeks. This is the first time it has been an apology.',
        gain: { trust: 2 },
        artSubject:
          'Close view of hands writing on a padded envelope with a biro, a small wrist sensor and coiled cable beside it on the carrel desk, warm lamplight',
      },
      {
        id: 'photo',
        label: 'Unpin the photo of Rowan and Jun',
        outcome:
          'He puts it in the inside pocket with Rowan’s pens. On the back, in Rowan’s hand: ‘ring J. Sunday’. No date. Morrow doesn’t know which Sunday, and Jun doesn’t know anyone is still meaning to.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan holding a small photograph turned over to read a pencil note on its back, a drawing pin between his fingers, the empty pin mark on the carrel partition',
      },
    ],
  },
  {
    id: 'SB-27',
    title: 'Sleep Lab',
    kind: 'puzzle',
    speaker: 'Morrow',
    opening:
      'Rowan’s ‘sleep lab’ is a desk, a lamp and three nights printed out and clipped to the shade. Dr Sen’s pencil on the cover sheet: ‘Sensor runs on phone time. Clocks went forward, 1 a.m. to 2 a.m., Sun 29 Mar.’ Night 9: asleep at the desk 00:40–04:55, heart rate 41, circled ‘not mine?’ Night 14, 28–29 Mar: asleep 00:20–05:30, deepest sleep at 01:35. Night 17, the last: asleep 02:14–02:25, then nothing. One night can’t be true as written.',
    artSubject:
      'A small desk with a bent-neck lamp, three printed graphs of jagged lines clipped to the lampshade with bulldog clips, a pencil-marked cover sheet on the desk, an androgynous adult in their thirties with short dark hair and a grey cardigan reading them with one finger on a line, a single warm pool of light in a dark room',
    echoes: [
      {
        flag: 'e03:2,7:dr-pereira',
        text: 'At the clinic Gwen said Rowan was meant to come back in March for a sleep follow-up. Here is March, in numbers.',
      },
      {
        flag: 'e03:2,7:care',
        text: 'At the clinic he wrote down the wrong doctor and never learned what Rowan was due back for. He is learning now.',
      },
      {
        flag: 'e03:2,7:risk',
        text: 'At the clinic he wrote down the wrong doctor and never learned what Rowan was due back for. He is learning now.',
      },
    ],
    choices: [
      {
        id: 'night-nine',
        label: 'Night 9: a heart rate of 41',
        outcome:
          'Low, not impossible; Dr Sen’s margin says some athletes sleep at 40. Rowan was no athlete, and it isn’t his usual, and that is a different kind of problem. Morrow loses ten minutes to it and can’t find an answer that isn’t himself.',
        gain: { danger: 1 },
        artSubject:
          'Close view of a printed heart-rate graph with one deep dip circled in biro, a hand resting beside it very still',
      },
      {
        id: 'night-fourteen',
        label: 'Night 14: the deepest sleep at 01:35',
        outcome:
          'There was no 01:35 that night. The clocks went from one straight to two, and a sensor on phone time would have skipped the hour. Rowan typed this night in afterward, minute by careful minute: a whole good night’s sleep he wanted on the record. Morrow knows that kind of forgery. He is living one.',
        gain: { evidence: 2 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan holding one printout up to the lamp, its graph suspiciously smooth, the other two pages hanging from the shade',
      },
      {
        id: 'night-seventeen',
        label: 'Night 17: eleven minutes, then nothing',
        outcome:
          'Eleven minutes of sleep is a terrible night, not an impossible one; after that the sensor simply stopped being worn. Morrow knows which eleven minutes they were. He sits with that longer than the puzzle needed.',
        gain: { danger: 1 },
        artSubject:
          'A printout with a short burst of graph and then a long flat empty line, laid on the desk under the lamp, an empty chair across from it',
      },
    ],
  },
  {
    id: 'SB-28',
    title: 'Cot Room',
    kind: 'rest',
    speaker: 'Morrow',
    opening:
      'Behind the sleep lab is a storeroom with a camping cot, a folded fleece blanket and a phone charger in the only socket. Rowan slept here, or tried to. The pillow still holds a dent. A glass on the floor wears a ring of evaporated water, and four dates are pencilled on the wall by the cot, each a night he didn’t go home. Morrow is very tired. This body has been tired since he got it.',
    artSubject:
      'A cramped basement storeroom with a camping cot under a bare bulb, a dented pillow and folded fleece blanket, an empty glass on the concrete floor, faint pencil marks on the painted wall above the cot, a phone charger plugged into a single socket, an androgynous adult in their thirties with short dark hair and a grey cardigan in the doorway',
    echoes: [
      {
        flag: 'e03:3,7:care',
        text: 'The sleep appointment Rowan kept avoiding is written on Morrow’s hand, in his phone and on a receipt, three weeks out. Looking at the cot, it seems less like an errand.',
      },
      {
        flag: 'e03:3,7:risk',
        text: '‘Working nights on a project I can’t put down,’ the doctor’s note said. This is where he put himself down instead.',
      },
    ],
    choices: [
      {
        id: 'sleep',
        label: 'Lie down on Rowan’s cot for an hour',
        outcome:
          'He sets an alarm, plugs in the phone and lies down in a dent the wrong shape for him that fits perfectly. He sleeps at once, without dreams, for the first time in this city. When the alarm goes he is on his back with his hands folded, a habit this body has and Morrow never did.',
        gain: { battery: 2, danger: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan asleep on his back on a narrow camping cot, hands folded on his chest, a phone charging on the floor with its small light glowing, bare bulb switched off, faint light from the doorway',
      },
      {
        id: 'search',
        label: 'Search the cot and the shelves instead',
        outcome:
          'Under the pillow, a foil strip of sleeping tablets, two gone, prescribed in January. Under the cot, a receipt for a second desk chair, bought in March, which nobody needs to work alone.',
        gain: { evidence: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan kneeling to pull a creased receipt from under a camping cot, a foil blister strip on the pillow above him, bulb light',
      },
    ],
  },
  {
    id: 'SB-29',
    title: 'Whiteboard Wall',
    kind: 'choice',
    speaker: 'Morrow',
    opening:
      'A whiteboard the width of the wall holds Rowan’s model of his own nights: minutes asleep, minutes lost, a dose column, arrows that loop back on themselves. Someone wiped part of it once, and he rewrote it, harder. In the bottom corner, small enough to be private: ‘M?’ It sits beside the melatonin dose. It could mean melatonin. It could mean missing minutes. Morrow reads it the only way he can.',
    artSubject:
      'A huge whiteboard covering a basement wall in dense marker diagrams, curved arrows and columns of figures, faint ghosts of earlier erased writing in the gloss, a tiny mark in the lower corner, an androgynous adult in their thirties with short dark hair and a grey cardigan crouched to look at that corner, strip light glare',
    echoes: [
      {
        flag: 'SB-21:watch',
        text: 'He has seen the footage. Every arrow on this board bends, sooner or later, toward a quarter past two.',
      },
      {
        flag: 'SB-21:leave',
        text: 'He chose not to watch the footage. The board makes it hard to pretend he doesn’t know roughly what it shows.',
      },
    ],
    choices: [
      {
        id: 'erase',
        label: 'Rub out the M? with your sleeve',
        outcome:
          'Two passes and it’s gone. A faint ghost stays in the gloss, the way they do, but nobody who didn’t already know would find it. It is the first thing of Rowan’s he has destroyed on purpose.',
        gain: { danger: -1, trust: -1 },
        artSubject:
          'A grey cardigan sleeve rubbing at the corner of a crowded whiteboard, a faint smudge left behind under hard strip light',
      },
      {
        id: 'answer',
        label: 'Write your own name beside it',
        outcome:
          'He uncaps a marker and writes ‘Morrow’, in Rowan’s handwriting, because it is the only handwriting this hand has. It looks like a doodle. It looks like a confession. Hollis does a round at four.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan writing a single small word in marker in the corner of a crowded whiteboard, cap held in his teeth',
      },
      {
        id: 'copy',
        label: 'Copy the board into your notebook, M? and all',
        outcome:
          'Twenty minutes and three pages. Halfway through he understands the model: Rowan was losing about forty minutes a night he couldn’t account for, and had started plotting where they went. The last arrow runs off the edge of the board.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan sitting cross-legged on the floor copying diagrams from a wall-wide whiteboard into a small notebook, pen moving fast',
      },
    ],
  },
  {
    id: 'SB-30',
    title: 'Shredder Room',
    kind: 'choice',
    speaker: 'Morrow',
    opening:
      'A dead end: a box room, a cross-cut shredder with a full bin, no way on. Something jammed it mid-job. Lined pages hang from its teeth, the top half intact, in Rowan’s writing: ‘Dear Dr Sen, I think someone is coming in at night. I know how this sounds. I’d rather you heard it from me than’, and the teeth have the rest. The motion-sensor light clicks off every forty seconds unless he waves at it.',
    artSubject:
      'A tiny windowless box room with an office shredder whose overflowing bin bulges with paper strips, a few lined handwritten pages caught half-swallowed in its slot, a single motion-sensor ceiling light, an androgynous adult in their thirties with short dark hair and a grey cardigan lifting one arm to wake the light',
    choices: [
      {
        id: 'piece',
        label: 'Tape the strips back together by torchlight',
        outcome:
          'Forty minutes with packing tape and the phone propped on a box. The letter ends: ‘than from the clinic. I’m not asking you to believe me. I’m asking you to check the logs.’ It was never sent. He shredded the one plain thing he’d written rather than be the man who sent it.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan kneeling over a mosaic of paper strips taped together on the floor, a phone torch propped on a box lighting them, the room otherwise dark',
      },
      {
        id: 'finish',
        label: 'Feed the rest through and let Rowan keep his privacy',
        outcome:
          'He clears the jam and lets the machine finish what Rowan asked of it. The letter becomes confetti in a bin of confetti. Whatever Rowan was afraid to say stays unsaid. That was his choice, and Morrow has taken enough of those.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'A hand guiding the last lined page into a shredder slot, paper ribbons spilling from the full bin below, the motion light just flickering out',
      },
      {
        id: 'pocket',
        label: 'Pull the top half free and pocket it',
        outcome:
          'The half page comes loose with a dry rip. Six lines and a ragged edge. It is the first proof Morrow has held that Rowan knew, and the first time he has seen how alone that made him.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of fingers holding a torn half page of lined handwritten paper, its bottom edge ragged, the jammed shredder mouth behind',
      },
    ],
  },
  {
    id: 'SB-31',
    title: 'Long Corridor',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The night archive begins with a long lit corridor, its floor polished to a shine. At the far end an office door has a strip of warm light under it, and a radio is playing low: a late phone-in about lost cats, people ringing at three in the morning to describe them kindly. For the first time down here Morrow is not alone in the dark. Someone has been awake all night on purpose.',
    artSubject:
      'A long straight basement corridor with a gleaming polished floor reflecting the ceiling lights, a pinboard of rotas on one wall, at the far end a closed office door with warm light spilling from beneath it, an androgynous adult in their thirties with short dark hair and a grey cardigan small in the middle distance walking toward it',
    echoes: [
      {
        flag: 'SB-24:wedge',
        text: 'Somewhere behind him the dock door he wedged is letting the rain in. The corridor smells faintly of it.',
      },
      {
        flag: 'SB-24:close',
        text: 'The dock door he shut is the one door down here he can say he left as he found it.',
      },
    ],
    autoChoiceId: 'walk',
    choices: [
      {
        id: 'walk',
        label: 'Walk toward the light under the door',
        outcome:
          'Halfway along is a pinboard of rotas: Hollis, nights, every night, back to a year with a different first digit. Under this spring, Rowan’s four absences are covered in the same blue biro, ‘in archive, returned’, each with her initials. She has been lying in neat handwriting for months.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of a cork pinboard layered with years of yellowing paper rotas, the newest sheet marked with small tidy entries in blue biro, a fingertip resting on one of them',
      },
    ],
  },
  {
    id: 'SB-32',
    title: 'Hollis’s Office',
    kind: 'guardian',
    speaker: 'Hollis',
    opening:
      'Hollis doesn’t get up. She is in her sixties, in a navy fleece, reading glasses on a chain, a thermos at her elbow and a monitor showing the corridor he just walked. ‘Rowan takes the stairs two at a time and apologises to doors,’ she says. ‘You came down my corridor like you’d bought it.’ She caps her pen. ‘I’ve covered for that face four times this spring. I’d like to know who I’ve been covering for.’',
    artSubject:
      'A small cluttered archive office lit by a desk lamp, a woman in her sixties with cropped grey hair, a navy fleece and reading glasses on a chain sitting calmly behind a desk with a thermos and a small security monitor, a radio on a shelf, an androgynous adult in their thirties with short dark hair and a grey cardigan standing in the doorway',
    echoes: [
      {
        flag: 'SB-21:watch',
        text: 'The playback counter on her screen says someone rewound April tonight. ‘So you’ve seen it,’ she says. ‘I watched it in May. Twice.’',
      },
      {
        flag: 'SB-21:leave',
        text: 'Her screen shows the April footage untouched. ‘You didn’t rewind it,’ she says. ‘I did. I wish I hadn’t.’',
      },
      {
        flag: 'e03:2,1:care',
        text: '‘Mara rang down at six,’ she adds. ‘She said if you seemed lost, you were, and to be kind about it. Mara is never wrong about that.’',
      },
      {
        flag: 'e03:2,1:risk',
        text: '‘Mara rang down at six. She says you remember everything now.’ Hollis lets that sit. ‘Mara only says things like that when she’s frightened.’',
      },
      {
        flag: 'entry:escort',
        text: 'Walt props his mop in the corner as if he has done it ten thousand times, which he has. Hollis doesn’t look at him. That is how Morrow knows they are friends.',
      },
      {
        flag: 'entry:badge',
        text: 'Her terminal lists every door her own name walked through tonight while she sat here. ‘Lena’s card runs on my sub-account,’ she says. ‘So apparently I’ve been busy.’',
      },
      {
        flag: 'SB-12:note',
        text: 'His note from the kitchenette is on her desk under the thermos, flattened like a pressed flower.',
      },
      {
        flag: 'SB-12:charge',
        text: '‘The kettle socket was warm when I went for my tea,’ she mentions. ‘Phones are always a confession.’',
      },
    ],
    choices: [
      {
        id: 'truth',
        label: 'Tell her who you are, all of it',
        outcome:
          'He tells her about the Briar Marches, a bargain struck at the desk down the hall, two lives traded across one lamp. Hollis doesn’t interrupt. Halfway through she pours him a cup from the thermos. ‘I don’t believe you,’ she says at the end. ‘I believe something happened at that desk. Go on, then.’ She reaches for the cage key.',
        gain: { trust: 1, danger: 1 },
        passesGuardian: true,
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan sitting forward on a hard chair talking with open hands, a grey-haired woman in a navy fleece across the desk pouring tea from a thermos into a plastic cup without looking away from him, lamplight',
      },
      {
        id: 'show-evidence',
        label: 'Lay out the key log, the footage and the sleep data',
        outcome:
          'Hollis reads it as archivists do, provenance first. At the timestamps she stops. ‘I did my round at half two that night. He was at the desk with the lamp on, and he stood up when I came in. Rowan never stands. He asked my name and thanked me for it.’ She takes off her glasses. ‘That was you.’ The cage key is already in her hand.',
        gain: { evidence: 1, trust: 1 },
        requires: { evidence: 4 },
        lockedHint: 'Needs more evidence (4)',
        passesGuardian: true,
        artSubject:
          'Papers, printouts and a notebook squared into a neat spread on an office desk under a lamp, a grey-haired woman in a navy fleece holding her reading glasses in one hand and a ring of keys in the other, an androgynous adult in their thirties with short dark hair and a grey cardigan waiting opposite',
      },
      {
        id: 'walt-vouches',
        label: 'Let Walt speak for you',
        outcome:
          'Walt leans on the mop. ‘Signed him in myself. Says thank you to the lift. Carried my bucket.’ A pause. ‘Whoever he is, he’s not trouble. I’d tell you.’ Hollis looks at Walt for a long time, then at Morrow, then gets up for the cage key. Twenty years of nights on the same floor buys a man that.',
        gain: { trust: 2, danger: -1 },
        requires: { entry: 'escort' },
        lockedHint: 'Only if Walt came down with you',
        passesGuardian: true,
        artSubject:
          'An older cleaner in a work tabard leaning on a mop in an office doorway, speaking to a grey-haired woman in a navy fleece who is rising from her desk with a key ring, an androgynous adult in their thirties with short dark hair and a grey cardigan standing between them, warm lamplight',
      },
    ],
  },
  {
    id: 'SB-33',
    title: 'Vault Cage',
    kind: 'treasure',
    speaker: 'Hollis',
    opening:
      'Behind Hollis’s desk a wire-mesh cage holds what the archive won’t leave on open shelves: sealed boxes, a fire safe, a lost-property tray, a coat stand with one forgotten umbrella. She unlocks it and stands aside, arms folded. ‘Rowan’s box is at the back,’ she says. ‘You can take one thing from the front on the way. Choose as if it’s being written down. It is.’',
    artSubject:
      'A wire-mesh storage cage in a basement archive with its door swung open, shelves of sealed cardboard archive boxes, a squat grey fire safe, a plastic tray of lost property, a coat stand with a single umbrella, a grey-haired woman in a navy fleece standing beside the open door with arms folded, an androgynous adult in their thirties with short dark hair and a grey cardigan stepping inside',
    echoes: [
      {
        flag: 'SB-32:truth',
        text: 'She still doesn’t believe him. She has let him into the cage anyway, which is a different and rarer thing.',
      },
      {
        flag: 'SB-32:show-evidence',
        text: 'His evidence sits squared on her desk in a manila folder, already labelled in her hand. She has filed him.',
      },
      {
        flag: 'SB-32:walt-vouches',
        text: 'Walt stays in the doorway, mop and all, keeping a friendly eye on both of them.',
      },
    ],
    choices: [
      {
        id: 'power-bank',
        label: 'Take the full power bank from the lost-property tray',
        outcome:
          'Somebody’s power bank in a sandwich bag, unclaimed since 2023, still holding charge. Hollis writes it on a slip in his name and dates it. The phone’s battery icon fills while he watches, which down here counts as a small miracle and up there as Tuesday.',
        gain: { battery: 2 },
        artSubject:
          'A hand lifting a sandwich bag with a power bank inside from a plastic tray of keys, gloves and odd cables, a phone already plugged in and glowing',
      },
      {
        id: 'key-log',
        label: 'Take the carbon key log for the spring',
        outcome:
          'The carbon book with Rowan’s four sign-outs and Hollis’s initials in every returned box. She watches him take it and says nothing. If anyone ever audits this, the book that proves he lied proves she did too.',
        gain: { evidence: 2, trust: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan holding a thin carbon-copy logbook open on one palm inside a wire cage, a grey-haired woman watching from outside the mesh with an unreadable face',
      },
      {
        id: 'folder',
        label: 'Ask for the folder she keeps under R',
        outcome:
          'She hesitates, then hands it over: her own notes on four spring nights. ‘R. asleep at desk 03:00, left him a blanket.’ ‘R. talking to himself, kindly.’ ‘R. asked if anyone else has a key. Told him no. Checked. No.’ She kept a record of a man nobody else was watching.',
        gain: { evidence: 1, trust: 1 },
        requires: { trust: 2 },
        lockedHint: 'Only if Hollis trusts you',
        artSubject:
          'A grey-haired woman in a navy fleece handing a slim manila folder across the threshold of a wire cage to an androgynous adult in their thirties with short dark hair and a grey cardigan, both looking at the folder rather than each other',
      },
    ],
  },
  {
    id: 'SB-34',
    title: 'Rowan’s Box',
    kind: 'secret',
    speaker: 'Morrow',
    opening:
      'At the back of the cage is an archive box with ROWAN on the end in marker. Inside, under a jumper and a dead phone, is a black notebook. The last entry is dated the night of the fourth sign-out: ‘02:09. Sensor on, lamp on. Somebody moved the second chair again; it’s facing the screen. I’m going to stay awake tonight and ask them, politely, what they want with my’, and there it stops, the pen line trailing off to nothing.',
    artSubject:
      'An open cardboard archive box on the floor of a wire cage, a folded jumper and a dark phone set aside, an androgynous adult in their thirties with short dark hair and a grey cardigan kneeling with a small black notebook open across both palms, its handwriting ending partway down the page, single lamp light through the mesh',
    echoes: [
      {
        flag: 'e03:3,3:care',
        text: 'Jun’s letter is still sealed in his inside pocket. For the first time Morrow wonders whether it, too, stops halfway down the page.',
      },
      {
        flag: 'e03:3,3:risk',
        text: 'He has already read one page in this hand that stopped mid-sentence: ‘I know sorry is late’. Rowan, it seems, left a great many sentences open.',
      },
    ],
    choices: [
      {
        id: 'read',
        label: 'Read the notebook from the front',
        outcome:
          'Spring, a line a night. ‘Slept 3h.’ ‘Someone’s been in the files.’ ‘Didn’t ring Jun.’ ‘The chair.’ By April the lines are shorter and kinder, as if he were saving his strength to be polite to whatever came. Morrow reads until he can’t.',
        gain: { evidence: 2, danger: 1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan sitting on the cage floor with his back against a shelf of boxes, reading a small notebook by lamplight through wire mesh, a jumper across his knees',
      },
      {
        id: 'answer',
        label: 'Finish his sentence in the same hand',
        outcome:
          'He writes ‘life.’ in Rowan’s handwriting, because it is the only handwriting this hand has. Underneath: ‘I didn’t know it was a question. I am sorry. M.’ It is the first true thing he has written in this body, and it is in someone else’s notebook.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Close view of a hand holding a biro to the last line of a notebook page, a short new line of writing beneath an unfinished one, the knuckles tense',
      },
      {
        id: 'close',
        label: 'Put the lid back on and leave it as he left it',
        outcome:
          'The sentence stays open, as if Rowan might come back and finish it himself. Morrow folds the jumper back on top. It smells of someone else’s washing powder, which is to say, of his own.',
        gain: { danger: -1 },
        artSubject:
          'Two hands settling a folded jumper into an archive box and lowering the lid, a name on the box end out of focus, lamp light through wire mesh',
      },
    ],
  },
  {
    id: 'SB-35',
    title: 'The After-Hours Desk',
    kind: 'climax',
    speaker: 'Morrow',
    opening:
      'The desk. One lamp, one screen, two chairs, the second still turned toward the screen. With the lights on it is smaller than he remembered and wants dusting. Rowan’s study is open, three chapters done and a fourth blank under ‘Discussion’. Dr Sen’s funder wants it by December; a contract and a lab line hang from it. Morrow sits where Rowan sat. Anything he does from this chair, he does in Rowan’s name.',
    artSubject:
      'A plain institutional desk in a dim basement archive with one bent-neck lamp, a computer screen showing a long document with a blank final page, two office chairs, the second turned to face the screen, an androgynous adult in their thirties with short dark hair and a grey cardigan sitting in the first chair with hands flat on the desk, warm lamp pool in surrounding dark',
    echoes: [
      {
        flag: 'e03:5,2:care',
        text: 'Dr Sen’s pencil note is taped to the monitor: ‘Good to have you back on the record. No rush. Some rush.’',
      },
      {
        flag: 'e03:5,2:risk',
        text: 'His 3 a.m. re-run sits in the shared folder beside the study, beautiful and unexplained. Whatever he decides here will sit next to it.',
      },
      {
        flag: 'SB-34:answer',
        text: 'Rowan’s notebook is in his pocket, with Morrow’s apology at the bottom of the last page.',
      },
    ],
    choices: [
      {
        id: 'return',
        label: 'Seal Rowan’s work, untouched, for when he comes back',
        outcome:
          'He changes nothing and asks Hollis for a box and her seal. ‘Hold for owner,’ she writes, and dates it. In December the funding lapses, Dr Sen loses the line, and Morrow will have to look at her when it does. But if Rowan ever walks back down that corridor, his nights will be exactly where he left them.',
        gain: { trust: 1, evidence: -1, danger: -1 },
        artSubject:
          'A sealed cardboard archive box with a strip of tape across its lid resting on an empty desk under a lamp, the screen dark, both chairs pushed neatly in, an androgynous adult in their thirties with short dark hair and a grey cardigan walking away down the corridor beyond',
      },
      {
        id: 'finish',
        label: 'Finish the study under Rowan’s name',
        outcome:
          'He writes the Discussion over four nights at this desk, and it is good: careful, generous, better than he is. Dr Sen keeps her line. The contract renews. Mara stops worrying. The strange nights go into an appendix on sensor error, and the only person who could correct it is the one whose name is on the cover.',
        gain: { evidence: 2, danger: 1, trust: -1 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan typing at the lamplit desk in the small hours, the screen full of finished pages, several empty mugs around the keyboard, the second chair still turned toward him',
      },
      {
        id: 'confess',
        label: 'Write down the night of the trade for Mara and Dr Sen',
        outcome:
          'Plain sentences, no Marches poetry: the desk, the chair, 02:14, the bargain, his name. He prints two copies and signs them with the only signature this hand knows. They won’t believe it. They will read it as Rowan’s, and worry for Rowan, and book him the sleep appointment. It is still the truth, and now it is on file.',
        gain: { trust: 2, danger: 2 },
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan holding two freshly printed pages beside a humming desk printer, a pen in his other hand, the lamp throwing his shadow across the empty second chair',
      },
    ],
  },
  {
    id: 'SB-36',
    title: 'The Way Up',
    kind: 'exit',
    speaker: 'Morrow',
    opening:
      'A back stair from the night archive climbs four flights to the Annex stairwell, where the key log hangs on its chain. Above, the Annex will be waking: the first lights in the data room, the service lift complaining, Mara’s train somewhere in the rain. Morrow has been down here the whole night. He goes up the way Rowan never did this spring, in the morning, carrying what he decided.',
    artSubject:
      'A narrow concrete fire stair spiralling upward, grey dawn light falling from a high landing, a steel door at the top with a clipboard on a chain beside it, an androgynous adult in their thirties with short dark hair and a grey cardigan climbing with one hand on the rail',
    echoes: [
      {
        flag: 'SB-35:return',
        text: 'Behind him a sealed box waits on Hollis’s shelf. Upstairs nothing has changed, and in December that will cost people he likes.',
      },
      {
        flag: 'SB-35:finish',
        text: 'The study is saved in four places. Upstairs, everyone he works with will be glad of him today, and he will have to let them.',
      },
      {
        flag: 'SB-35:confess',
        text: 'Two copies of the truth wait in two pigeonholes upstairs. By lunchtime someone will have read one.',
      },
      {
        flag: 'entry:escort',
        text: 'Walt climbs a step behind with the bucket, whistling something with no tune, and holds the pen out at the top before Morrow can reach for it.',
      },
      {
        flag: 'entry:badge',
        text: 'At the top, the reader will log Lena’s badge one last time, under Hollis’s name. He has to give it back today, and say where it’s been.',
      },
    ],
    choices: [
      {
        id: 'climb',
        label: 'Climb toward the morning',
        outcome:
          'He signs the key log in Rowan’s name, and in the returned box, for the first time since spring, the time is written by the one who actually came back. Then he pushes the bar and steps out into the grey ordinary light of a working day.',
        artSubject:
          'An androgynous adult in their thirties with short dark hair and a grey cardigan writing on a clipboard chained beside a steel door, the door pushed half open onto a stairwell full of pale morning light',
      },
    ],
  },
]
