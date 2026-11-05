import type { DrownedRoomContent } from './types'

const MORROW =
  'an androgynous adult in their thirties with short dark hair and a grey cardigan'

const WALT = 'an older cleaner in a work tabard'

export const DROWNED_ROOMS_A: readonly DrownedRoomContent[] = [
  {
    id: 'DA-01',
    title: 'The Intake, Knee-Deep',
    kind: 'entry',
    speaker: 'Morrow',
    opening:
      'Sublevel B, with the sea in it. Cold black water stands knee-deep across the intake, flat as a floor, and the strip lights are on beneath the surface, so the counter and the returns trolley seem to hang in green glass. It smells of weed, diesel and very old paper. Morrow knew this room by its cold and its hum. The hum is still here. Under it, slow and regular, the whole basement is breathing in.',
    artSubject: `A basement archive intake flooded knee-deep with still black water, fluorescent strip lights glowing green beneath the surface, a returns counter and a library trolley half submerged, ${MORROW} standing in the water at the threshold`,
    echoes: [
      {
        flag: 'entry:walt',
        text: 'They came round by the loading dock ramp, the door upstairs signed shut behind them. Walt has a torch in a freezer bag and a coil of blue rope over one shoulder. ‘Hollis was on tonight,’ he says, ‘with the two new ones. Nobody’s heard from her since nine.’',
      },
      {
        flag: 'entry:alone',
        text: 'Behind him the forced door stands a hand’s width open, and the sea slides past his legs and climbs the stair: uphill, the wrong way. Nobody upstairs knows he is down here. Something further in seems to.',
      },
      {
        flag: 'SB-01:lights',
        text: 'He threw the switches here once and found the place beige. The switches are under the water now. The lights came on anyway.',
      },
      {
        flag: 'SB-01:dark',
        text: 'He walked this room blind once: eleven steps to the counter. He counts them now and makes it nine. The water has moved the counter, or it has moved him.',
      },
    ],
    choices: [
      {
        id: 'straight',
        label: 'Wade straight across under the drowned lights',
        outcome:
          'Green light from below makes the room look deep and his legs look borrowed. Halfway across, his shadow on the ceiling stops a step after he does. He reaches the corridor quickly, soaked to the thigh, and on the counter’s drowned monitor a small figure crosses the intake a second behind him.',
        gain: { evidence: 1, danger: 1 },
        artSubject: `${MORROW} wading fast through knee-deep water lit green from below, a long distorted shadow on the ceiling above, a small submerged monitor glowing on a counter`,
      },
      {
        id: 'wall',
        label: 'Keep one hand on the wall and edge round by feel',
        outcome:
          'Concrete, a notice board, an extinguisher bracket, all cold. It takes three times as long and the water climbs his shins as he goes, but nothing has to notice him to let him pass. At the corner his fingers find a wet handprint at shoulder height, smaller than his, pointing the way he is going.',
        gain: { danger: -1 },
        artSubject: `${MORROW} edging along a concrete wall through flooded darkness with one palm flat on it, a small wet handprint glistening on the wall just ahead of his fingers`,
      },
      {
        id: 'rope',
        label: 'Let Walt tie his rope off at the stair rail',
        requires: { entry: 'walt' },
        lockedHint: 'Only if Walt came down with you',
        outcome:
          'Walt ties a bowline without looking, the way other people tie shoes, and pays out blue rope behind them. ‘Whatever you think you know about this place,’ he says, ‘the water doesn’t know it.’ The line stays taut. Neither of them mentions that something, once, tugs it.',
        gain: { trust: 1, danger: -1 },
        artSubject: `${WALT} knotting a blue rope to a stair rail above flooded water, ${MORROW} beside him holding the slack, a freezer-bagged torch lighting their hands`,
      },
    ],
  },
  {
    id: 'DA-02',
    title: 'The Log That Signs Itself',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The key log hangs on its chain at the corridor’s turn, and the water has reached it; the page is soft as cloth. Rowan’s four spring sign-outs are there, a green H. beside each return. Below them, tonight: ‘H., in 21:05.’ ‘I. Duarte, in 21:05.’ ‘K. Mensah, in 21:05.’ Then the ink goes on without a hand. As he watches, a line writes itself in a looped green he knows: ‘Rowan, in.’ No time. The pen hangs dry on its string.',
    artSubject:
      'A soaked clipboard key log hanging on a chain against a concrete wall, its lower edge dipping into dark floodwater, handwritten lines bleeding green ink, a dry pen dangling on a string beside it, cold strip light',
    echoes: [
      {
        flag: 'SB-02:photograph',
        text: 'He has a dry photo of this page on his phone. In the photo the four returns read 06:10, 06:05, 06:10, 06:00. On the wet page they read 06:10, 06:05, 06:10, and ‘not yet’.',
      },
      {
        flag: 'SB-02:fill-in',
        text: 'His blue line is still here, ‘Rowan, 22:50’, its return written in advance. The water has lifted the blue ‘06:00’ off the page and left a word in green where it was: ‘held’.',
      },
    ],
    choices: [
      {
        id: 'photograph',
        label: 'Photograph the page before it changes again',
        outcome:
          'The flash is green on wet paper. On the screen the page is as he sees it: three staff in at 21:05 and nobody out. He takes it again a minute later, and the second photo has a fourth line under Rowan’s, still writing itself, not yet dry enough to read.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} holding a phone up to a dripping chained clipboard, the screen showing the page in green-tinged light, floodwater around his knees`,
      },
      {
        id: 'sign-out',
        label: 'Sign Hollis and the night staff out in advance, with a time',
        outcome:
          'He writes ‘out, 06:00’ beside the three names in blue biro, the way he once wrote Rowan back in. The ink holds for a breath, runs, and dries again as ‘out, 06:00, R.’ The log has accepted the promise, and has put his name, which is not his name, under it.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${MORROW} writing on a wet chained clipboard with a blue biro, ink spreading from the nib into the damp page, a long flooded corridor behind him`,
      },
    ],
  },
  {
    id: 'DA-03',
    title: 'Trolleys at Moorings',
    kind: 'treasure',
    speaker: 'Morrow',
    opening:
      'The three returns trolleys have floated off their brakes and drifted together, nosing each other like boats at a mooring. Grey archive boxes have slumped into lumps on the top tiers. The lost-property tray rides the lowest shelf just above the water, and in it, sealed in a freezer bag with green-pen care, is a power bank. The spiral returns book floats open beside it, carbon pages fanned on the surface, every one of them rewriting.',
    artSubject:
      'Three steel library trolleys floating together in a flooded basement bay, sodden grey archive boxes on their top shelves, a plastic tray holding a power bank sealed in a freezer bag, a spiral-bound book floating open on the black water',
    echoes: [
      {
        flag: 'SB-03:power-bank',
        text: 'He promised himself he’d put this power bank back on the way out. Someone has done it for him. The bag is labelled in green: ‘found B again. R., you can stop borrowing it.’',
      },
      {
        flag: 'SB-03:returns-book',
        text: '‘R.: held in the cage.’ The carbon of that one line has bled down through every page beneath it, so the floating book says it again and again, fainter each time.',
      },
    ],
    choices: [
      {
        id: 'power-bank',
        label: 'Take the power bank in its bag',
        outcome:
          'Dry, three-quarters full, cable wound neat. Morrow plugs in through the bag and holds the phone high while the battery climbs. Under the label, smaller: ‘Stay high. Stay left. H.’ Somebody wrote this down here tonight, with the water already coming, for whoever came next.',
        gain: { battery: 2 },
        artSubject: `${MORROW} standing in floodwater holding a phone high, a cable running down to a power bank in a freezer bag clutched against his chest, a floating trolley beside him`,
      },
      {
        id: 'returns-book',
        label: 'Fish out the returns book and read tonight’s page',
        outcome:
          'Tonight’s page writes as it soaks. ‘Box 14 returned by H.’ ‘Box 15 returned by H.’ ‘Rowan’s box returned by H. to the cage.’ Then, in a hand that is hers and is not: ‘Hollis returned by the water to the desk.’ Morrow shuts the book on its own sentence. It goes on writing inside, against his palms.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${MORROW} lifting a dripping spiral returns book out of black water, holding it shut with both hands, a library trolley drifting behind`,
      },
    ],
  },
  {
    id: 'DA-04',
    title: 'Desk at the Waterline',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The night desk stands in water to its drawers. The green-shaded lamp is still on, very calm, over a thermos riding upright on the surface, lid screwed tight. The rota has three initials tonight, H., I., K., and FLOOD WATCH in green across the column. Beside March, the old pencil ‘R. ok?’ has an answer beneath it in wet ink: ‘R. here.’ Taped to the lamp: ‘Gone to shut the gate. Back 22:00. H.’ The desk clock says 23:40.',
    artSubject:
      'An archive night desk standing in dark floodwater up to its drawers, a green-shaded lamp still lit, a steel thermos floating upright beside it, a handwritten rota on a corkboard above, a paper note taped to the lamp, a clock on the desk',
    autoChoiceId: 'read-note',
    echoes: [
      {
        flag: 'SB-04:read-rota',
        text: 'He counted forty-one nights of green H. down this rota once. Somebody has gone on counting: forty-two, forty-three, and tonight’s box, which is not an initial but a wavy line, the way a child draws the sea.',
      },
      {
        flag: 'entry:walt',
        text: 'Walt taps the two new initials. ‘Ines and Kwame. Agency, second week. I showed them where the kettle was.’ He says it like an obituary, then shakes his head, angry with himself. ‘I’ll show them again.’',
      },
      {
        flag: 'entry:alone',
        text: 'There is a desk phone. He lifts it: a dial tone, and under the tone, very far away, someone patiently reading out names.',
      },
      {
        flag: 'SB-35:return',
        text: 'Her ‘Hold for owner’ stamp is out on the blotter, the pad open. She meant to seal more of Rowan’s things for him tonight.',
      },
      {
        flag: 'SB-35:finish',
        text: 'A bound copy of the finished study lies under the lamp, Rowan’s name on the cover. Hollis has been reading it. In the margin of the appendix on sensor error, in green: ‘no.’',
      },
      {
        flag: 'SB-35:confess',
        text: 'One of his two signed accounts is on her blotter, not in a pigeonhole; someone sent it down to her. She has underlined ‘02:14’ in green, once, and written nothing else.',
      },
    ],
    choices: [
      {
        id: 'read-note',
        label: 'Read Hollis’s note again, and check the clock',
        outcome:
          'Back at ten, and it is twenty to midnight. Three people went further in to close a flood gate and did not come back to the desk. Morrow lifts the thermos out of the water and stands it on the desk, handle out, the way she left it once. It is still warm.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} standing waist-deep beside a lamplit night desk, setting a dripping thermos upright on the blotter, his eyes on a small desk clock`,
      },
    ],
  },
  {
    id: 'DA-05',
    title: 'Stairwell Full of Sea',
    kind: 'shortcut',
    speaker: 'Morrow',
    opening:
      'The fire door to the stair has a narrow window, and behind it there is no stair, only water standing to the top of the frame like a tank in an aquarium. It does not pour under the door. It waits. The red alarm bell above the frame is beaded with damp. Up there are the Annex ground floor and the night, but the stair between is drowned to the ceiling, and the push bar is cold as a coin.',
    artSubject:
      'A green-painted fire door on a concrete landing, its narrow wire-glass window showing a stairwell completely filled with still dark water, a small red alarm bell beaded with moisture above the frame, a damp push bar',
    echoes: [
      {
        flag: 'SB-05:reconnect',
        text: 'He clipped this alarm wire back once, to make the stair honest. The contact is wet now, and every few seconds the bell gives a single tick, as if someone on the far side of the water keeps almost opening the door.',
      },
      {
        flag: 'SB-05:leave-taped',
        text: 'Rowan’s masking tape still holds the wire back. The March date he wrote on it has run in the damp and dried again as tonight’s.',
      },
    ],
    choices: [
      {
        id: 'ring',
        label:
          'Ring the alarm by hand so someone upstairs knows people are down here',
        outcome:
          'He shorts the contact with his thumb and the bell goes, thin and furious, for ten long seconds. Upstairs the whole Annex must be shouting. Behind the window the water shivers, then turns, all of it at once, toward the sound, and something pale on the drowned stair turns with it.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${MORROW} on tiptoe pressing a thumb to a ringing alarm contact above a fire door, the window beside him showing water swirling in a drowned stairwell`,
      },
      {
        id: 'tie-line',
        label:
          'Tie a guide line of cardigan wool to the push bar for anyone who swims this way',
        outcome:
          'He unpicks a length of grey wool from his cuff, knots it to the bar and runs it back along the landing rail. If anyone ever comes out of that stair blind and breathless, their hand will find it. It is the least magical thing he has ever done, and it feels like a working.',
        gain: { danger: -1 },
        artSubject: `${MORROW} knotting a thin strand of grey wool around the push bar of a fire door and running it along a stair rail, an unravelled cuff on his sleeve`,
      },
    ],
  },
  {
    id: 'DA-06',
    title: 'The Locker That Keeps Opening',
    kind: 'treasure',
    speaker: 'Morrow',
    opening:
      'The staff lockers lean in their row, water seeping from the vents. Number 37 has no name, and its three-wheel lock reads 0-3-7, already set, already open. Inside, the water stands level with the shelf. A grey cardigan, twin to his own, hangs dripping on the hook. On the shelf, out of the wet: a rolled orange dry bag, and the index card of dates, propped upright as if someone wanted it read. It smells of instant coffee and the sea.',
    artSubject: `A row of grey steel staff lockers standing in floodwater, one door open on a dripping grey cardigan on a hook, a rolled orange dry bag and an upright index card on the shelf, ${MORROW} holding an open combination padlock`,
    echoes: [
      {
        flag: 'SB-06:close',
        text: 'He spun these wheels back to 0-0-0 the last time, a small courtesy. Someone has turned them to 0-3-7 again.',
      },
      {
        flag: 'SB-06:cardigan',
        text: 'He took this spare cardigan once. It hangs here again, soaked, buttoned to the throat, with a button missing at the cuff.',
      },
      {
        flag: 'SB-06:index-card',
        text: 'The card he took is in a drawer at home. This is the same card, the same dent at the bottom, wet through.',
      },
    ],
    choices: [
      {
        id: 'dry-bag',
        label: 'Take Rowan’s dry bag for the phone',
        outcome:
          'Roll-top, a bike shop’s sticker. The phone goes in, the torch works through the plastic, and the water can have his sleeves but not his light. Rowan cycled to work in the rain all spring. Morrow has never once thought of him being cold.',
        gain: { battery: 1, danger: -1 },
        artSubject: `${MORROW} rolling the top of an orange dry bag closed over a phone whose torch glows through the plastic, standing in water by an open locker`,
      },
      {
        id: 'index-card',
        label: 'Read the index card',
        outcome:
          'Four dates and the hours Rowan slept: 5, 3, 0, 0. The fifth, the question mark. And now a sixth line, tonight’s date, in Rowan’s capitals, fresh and wet: ‘0. AWAKE.’ Morrow has not slept tonight either. He puts the card in his pocket and feels it go on being wet there.',
        gain: { evidence: 1 },
        artSubject: `Close on the hands of ${MORROW} holding a damp index card with a short handwritten column, ink still glistening on the last line, an open locker behind`,
      },
      {
        id: 'close',
        label: 'Close the locker and spin the wheels to zero',
        outcome:
          'He sets 0-0-0 and shuts the door on the dripping cardigan. Whatever this place is trying to tell him about Rowan, he will not take it by the sleeve. Behind him, quietly, the wheels click round again.',
        gain: { trust: 1 },
        artSubject: `${MORROW} pressing a grey locker door shut with his palm while turning a small combination lock with his thumb, floodwater around the row of lockers`,
      },
    ],
  },
  {
    id: 'DA-07',
    title: 'Aisles in the Surge',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'The compactor stacks have lost their power and kept their rhythm. Each time the sea surges through the basement, the rolling shelves slide a hand’s width on their rails, settle, and slide again, closing aisle 3 by inches. The polite recorded voice runs on a dying battery, slurring ‘all aisles will close in thirty seconds’ over and over, never reaching twenty-nine. The far end of aisle 3 is the way on. The water there is at his waist.',
    artSubject: `A narrow aisle between two towering steel rolling shelf units standing in waist-deep black water, the units visibly closer at one end, a dim amber warning light at the end panel, ${MORROW} at the mouth of the aisle`,
    echoes: [
      {
        flag: 'SB-07:run',
        text: 'He ran this aisle once and left a cardigan button between the shelves. It floats past him now on the surge, going the other way.',
      },
      {
        flag: 'SB-07:stop',
        text: 'He stopped these shelves with the red bar the last time. The bar is under water, still pressed in, and the shelves move anyway.',
      },
      {
        flag: 'entry:walt',
        text: 'Walt watches the shelves through one full surge. ‘Every forty seconds,’ he says. ‘Like a tide that’s been handed a timetable.’',
      },
    ],
    choices: [
      {
        id: 'run',
        label: 'Wade the aisle between surges',
        outcome:
          'He counts the surge, in, hold, slide, and goes on the slide. Waist-deep is slow. The shelves come in behind him like hands closing a book, and he squeezes out of the far end with his shirt torn and the breath crushed out of him. On the end panel, the old pencil tallies, and one new one, still grey with wet graphite.',
        gain: { evidence: 1, danger: 2 },
        artSubject: `${MORROW} forcing his way sideways out of a nearly closed gap between two steel shelf units, waist-deep in churning water, one sleeve torn`,
      },
      {
        id: 'brace',
        label: 'Jam a floating trolley across the aisle as a strut',
        outcome:
          'He shoves a drifting returns trolley crossways between the shelves. The next surge meets steel and stops with a shriek that goes through the whole floor, the kind of sound something listening would mark. The aisle holds. He wades through, and behind him the trolley creaks, slowly, like someone settling in.',
        gain: { danger: 1 },
        artSubject: `A steel library trolley wedged crosswise between two rolling archive shelves in flooded darkness, the shelves pressing against it, ${MORROW} wading past beneath it`,
      },
      {
        id: 'wait',
        label: 'Wait by the end panel with the torch and learn the rhythm',
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        outcome:
          'Back to the panel, torch on, he times six surges by the phone clock until he knows the moment the shelves stand widest and the water sucks back to his knees. Then he walks through a gap that stays open exactly as long as he needs. In the black water between the shelves the torch shows his face, not moving when he moves.',
        gain: { battery: -1, danger: -1 },
        artSubject: `${MORROW} standing very still against a shelving end panel with a phone torch lighting the black water of a narrow aisle, his reflection pale on the surface`,
      },
    ],
  },
  {
    id: 'DA-08',
    title: 'Labels That Run',
    kind: 'puzzle',
    speaker: 'Morrow',
    opening:
      'The surge has turned three boxes loose at the mouths of aisles 7, 8 and 9. Down here wet ink runs and dries again as other words. Pencil doesn’t: graphite is only stone. The laminated rule says loaned equipment is boxed and labelled by the lending lab. Rowan’s sensor was a loan from Dr Sen, who writes everything in soft pencil. Aisle 7’s box: blue ink, crisp, ‘ROWAN. SLEEP. COMPLETE.’ Aisle 8’s: faint grey script under the water. Aisle 9’s: green ink, still crawling.',
    artSubject:
      'Three sodden archive boxes floating at the mouths of three numbered shelving aisles in a flooded stack room, one with a crisp ink label, one with faint grey writing under the water, one with green ink visibly bleeding, a laminated card on an end panel',
    echoes: [
      {
        flag: 'DA-02:photograph',
        text: 'He has two photos of the key log on his phone, a minute apart, and they do not agree. Whatever is written in ink down here is only the latest draft.',
      },
      {
        flag: 'DA-02:sign-out',
        text: 'His blue promise in the key log dried as something he never wrote. He looks at the crisp label on aisle 7 and thinks of it.',
      },
    ],
    choices: [
      {
        id: 'aisle-7',
        label: 'Open aisle 7’s box: Rowan’s name, crisp and clear',
        outcome:
          'Too clear. Crisp blue ink on a box that has been in seawater all night, and inside only grey pulp in the shape of files, every sheet reading ‘complete’ in the same new hand. Something has written the ending it wants on Rowan’s work. The lid comes apart in his fingers.',
        gain: { danger: 1 },
        artSubject: `${MORROW} lifting the lid of a floating archive box to find only grey pulp inside, the lid tearing in his hands, flooded shelving behind`,
      },
      {
        id: 'aisle-8',
        label: 'Open aisle 8’s box: the faint grey writing under the water',
        outcome:
          'Soft pencil, perfectly legible under an inch of sea: ‘Sen lab. Loan: sensor, R. Two weeks.’ Inside, in a sealed sample bag, Rowan’s first fourteen nights, dry and dull and true: calm sleep graphs of a man who was only tired then. The one honest box on the floor is the one nobody labelled in ink.',
        gain: { evidence: 2 },
        artSubject: `${MORROW} holding a sealed plastic bag of dry printouts above floodwater, an open archive box with a pencil label floating at his waist`,
      },
      {
        id: 'aisle-9',
        label: 'Open aisle 9’s box: the green ink still moving',
        outcome:
          'The green settles as he lifts the lid and reads ‘HELD FOR OWNER’, in Hollis’s hand and not quite. Inside: an empty cage tag and seawater. He has spent the torch reading it, and while he read, somewhere down the aisle, a shelf moved in answer.',
        gain: { battery: -1 },
        artSubject: `${MORROW} shining a phone torch into an archive box full of black water, a single paper tag floating inside, green ink spreading across the box label`,
      },
    ],
  },
  {
    id: 'DA-09',
    title: 'The Plan Redraws Itself',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The plan chest’s drawers have filled like drawers in a sunk ship. In the top one, FIRE & FLOOR, the archive floats on tracing film, and the lines are moving. Water marks spread across it in contour rings: deeper toward the far end, shallow along a curve on the left. The night archive is drawn darker than ink should be. And in the corner room he once stood in, the small square of the desk has a second square on top of it, neat, like a ledger laid open.',
    artSubject:
      'A wide steel plan chest with its shallow top drawer full of water, a translucent floor plan floating inside it with spreading watermark rings like a depth chart, one small corner room drawn darker than the rest, a single lamp',
    echoes: [
      {
        flag: 'SB-09:trace',
        text: 'He traced the way to that corner once with one finger. His finger’s path is on the film now, a fine bright line, as if he had drawn it in silver.',
      },
      {
        flag: 'SB-09:take-copy',
        text: 'He took the spare copy from this drawer last time. The drawer is not one short tonight. It has one copy too many, and the extra is still wet.',
      },
    ],
    choices: [
      {
        id: 'read-depths',
        label: 'Read the water rings like a depth chart',
        outcome:
          'Shallow on the left, deep down the long corridor, deepest at the night archive. He learns the left-hand curve by heart, the driest way, the way the plan seems to want him to know. At the bottom the rings tighten round three small blots in the night archive, close together, the size of thumbprints.',
        gain: { evidence: 1, danger: -1 },
        artSubject: `Close on the hand of ${MORROW} hovering over a floating translucent floor plan, following a curve of pale watermark rings toward three small dark blots`,
      },
      {
        id: 'take-plan',
        label: 'Peel the wet plan out and carry it',
        outcome:
          'It comes away like the skin off warm milk, and he folds it flat inside his shirt. All night it will go on drawing itself against him, and every so often he will feel a line move. It is the best map in the building. It also knows exactly where he is.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${MORROW} lifting a dripping sheet of tracing film out of a flooded plan chest drawer, the floor plan lines glistening on it, a dim aisle behind`,
      },
    ],
  },
  {
    id: 'DA-10',
    title: 'The Shelf That Files Itself',
    kind: 'choice',
    speaker: 'Morrow',
    opening:
      'The dead-projects shelf is half under, and the water is doing the archivist’s job. Every status line has run and rewritten as the same word, ‘ended’, even on boxes that were only paused. Rowan’s flat-pack box floats against the end bracket, its status line wet, blank and filling. Beside it, sinking: ‘Shift fatigue survey. Funding ended. M., RA, 3 yrs.’ Mara’s three years, going under. The surge is coming back. He can reach one box before it does.',
    artSubject: `A long archive shelf half submerged in black water, old labelled boxes slumping on it, one new flat-pack box floating at the end, another sinking beside it, ${MORROW} chest-deep reaching toward them`,
    echoes: [
      {
        flag: 'SB-10:ongoing',
        text: 'He wrote ‘ongoing’ on Rowan’s label once, in Rowan’s hand. That label is under the water now, and the word is changing letter by letter into something with an M in it.',
      },
      {
        flag: 'SB-10:leave-blank',
        text: 'He left this status blank for Rowan once. Of every line on the shelf, it is the one the water is working on hardest.',
      },
      {
        flag: 'SB-10:read-others',
        text: 'He read these dead boxes once, every status typed by someone who wasn’t in the study. Tonight’s new statuses aren’t typed. They are handwritten, all in one hand.',
      },
      {
        flag: 'e04:2,1:care',
        text: 'Upstairs Mara is counting only who is actually on the platform. Nobody is counting her box.',
      },
      {
        flag: 'e04:2,1:risk',
        text: 'He rode the coat-filled train for Mara’s missing and came back with coats. Here is one more thing of hers the city is losing quietly.',
      },
    ],
    choices: [
      {
        id: 'lift-rowan',
        label: 'Lift Rowan’s box to the top shelf',
        outcome:
          'He hauls it up dripping and sets it high. The status line stops filling at ‘end’, three letters short of a verdict. Below him Mara’s survey slides under, its label still rewriting where nobody can read it. Rowan’s work is safe for tonight. The box with the living name on it isn’t.',
        gain: { evidence: 1, trust: -1 },
        artSubject: `${MORROW} heaving a dripping archive box onto a high shelf while another box sinks into the black water below him`,
      },
      {
        id: 'lift-mara',
        label: 'Lift Mara’s box instead',
        outcome:
          'Three years of a coworker’s nights, carried up in both arms. Mara will never know, which is the right size for a kindness. Rowan’s box turns slowly on the surge, and its status line fills in, in a careful official hand, with a word Morrow does not stay to read.',
        gain: { trust: 1 },
        artSubject: `${MORROW} lifting an old sodden archive box above his head out of chest-deep water, a new flat-pack box turning on the surface beside him`,
      },
      {
        id: 'pencil',
        label:
          'Write both statuses in pencil, the one mark the water can’t rewrite',
        outcome:
          'He finds a pencil stub on the shelf clipboard and writes, chest-deep, as the surge comes: ‘paused’ on Mara’s, ‘unknown’ on Rowan’s. Graphite holds. Both boxes go under, but when the water goes their labels will say the true thing. The cold is deep in him by the time he is done.',
        gain: { evidence: 1, danger: 2 },
        artSubject: `${MORROW} chest-deep in black water writing with a pencil stub on the label of a half-sunk archive box, a second box bobbing at his shoulder`,
      },
    ],
  },
  {
    id: 'DA-11',
    title: 'Labels Finding Homes',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The shoebox of fallen labels floats on the drowned top of the filing cabinet, and the labels are leaving it. Wet, their dead glue has woken. They drift out one by one and stick to whatever they touch: ‘Do not freeze’ on a water pipe, ‘Box 14 of 22’ on a ceiling tile, ‘Mum’s letters, keep’ flat on the fire extinguisher. One found Morrow while he stood reading. On the back of his hand, in Rowan’s capitals: ‘STILL LOOKING.’',
    artSubject:
      'A shoebox floating on a submerged filing cabinet, dozens of small curled paper labels drifting out across the dark water and clinging to a pipe, a ceiling tile and a red fire extinguisher, a single label stuck to the back of a raised hand',
    autoChoiceId: 'peel',
    echoes: [
      {
        flag: 'SB-11:keep-label',
        text: 'The label he kept last time is in his phone case, against the glass. He checks. It is there and it is dry, but the capitals have changed. It says ‘STILL HERE’.',
      },
      {
        flag: 'e04:3,3:care',
        text: 'Upstairs he held Jun’s letter back from delivering itself. Down here nobody is holding anything back.',
      },
      {
        flag: 'e04:3,3:risk',
        text: 'Upstairs he let Jun’s letter go and followed it. These labels have the same patience. They are not lost. They are on their way.',
      },
    ],
    choices: [
      {
        id: 'peel',
        label: 'Peel Rowan’s label off your hand',
        outcome:
          'It comes away with a sting, like a plaster, and leaves the words faintly on his skin in reverse. He smooths the label onto the cabinet side, where it stays. Still looking. Behind him the other labels go on finding new homes, every one of them a little wrong, every one of them sure.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} peeling a small wet paper label from the back of his hand beside a submerged filing cabinet, other labels clinging to pipes and walls around him`,
      },
    ],
  },
  {
    id: 'DA-12',
    title: 'The High Socket',
    kind: 'rest',
    speaker: 'Morrow',
    opening:
      'The kitchenette is flooded to the counter. The kettle floats on its cord like a buoy; mugs swing on their hooks above the water, HOLLIS and the one with no name; the fridge notes have bled into one blue-green cloud. High on the wall above the cupboards is an old clock socket nobody uses, dry. Morrow climbs onto the counter, back to the wall, knees up, and for a minute nothing in the room wants anything from him.',
    artSubject: `A tiny flooded staff kitchenette with water up to the counter, a kettle floating on its cord, mugs hanging on hooks above the surface, ${MORROW} sitting on the counter with his knees drawn up and his back against the tiled wall, a socket high above him`,
    echoes: [
      {
        flag: 'SB-12:note',
        text: 'His unsigned note from the dry night is pinned high on the fridge, above the water, and someone has answered it in green pen: ‘I know you’re not him. Come anyway. H.’',
      },
      {
        flag: 'SB-12:charge',
        text: 'He unplugged her kettle once and plugged it back in, so the socket would be warm for her. The kettle drifts past him now, still plugged in, still warm.',
      },
    ],
    choices: [
      {
        id: 'charge',
        label: 'Plug the phone into the high socket',
        outcome:
          'It takes, after a doubtful pause. He sits with the phone held to the wall like a shell to an ear while the battery climbs, and listens to the water lap the cupboard doors. Once, very clearly, the floating kettle clicks off, as if it had boiled.',
        gain: { battery: 2 },
        artSubject: `${MORROW} reaching up from a kitchenette counter to hold a charging phone against a socket high on the wall, floodwater below, a kettle floating`,
      },
      {
        id: 'note',
        label: 'Leave a note for Hollis on the top shelf, above the water',
        outcome:
          'He writes it on the back of a tea-bag box: ‘Coming. Stay high. Stay left.’ He signs nothing, then, after a moment, writes ‘M.’, and is surprised how much his hand shakes. He tucks it behind the HOLLIS mug on the highest shelf, where the sea will have to work to reach it.',
        gain: { trust: 1 },
        artSubject: `${MORROW} standing on a kitchenette counter tucking a folded scrap of cardboard behind a mug on a high shelf, floodwater lapping the cupboards below`,
      },
    ],
  },
  {
    id: 'DA-13',
    title: 'Cold Room, Chest-Deep',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'Cold Room One has filled like a well: four degrees, black water to the chest past the step down, the insulated door swinging gently on the swell. The switch clicks and does nothing. The dark smells of cardboard and salt. Dr Sen’s rack is at the back, and the corridor light reaches only a body’s length in. Somewhere in there the compressor is still ticking, under water, which compressors don’t do.',
    artSubject: `The open insulated door of a walk-in cold room flooded with black water to chest height, steel racks disappearing into darkness, faint mist on the surface, ${MORROW} on the threshold with breath showing`,
    echoes: [
      {
        flag: 'SB-13:torch',
        text: 'He found Dr Sen’s rack by torchlight once: three paces past the step, on the left. The water has moved a great many things tonight. Racks are bolted down.',
      },
      {
        flag: 'SB-13:feel',
        text: 'He went in by touch last time and set a tray of glass ringing. From the doorway he can hear it still, under the water, as if nobody ever stopped it.',
      },
      {
        flag: 'SB-13:prop-door',
        text: 'He propped this door once and its alarm bleated for the night desk. The red light above the frame is on again, under the water, blinking very slowly.',
      },
    ],
    choices: [
      {
        id: 'torch',
        label: 'Light the way in with the phone torch',
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        outcome:
          'The beam goes green a hand’s depth into the water and gives up, but above the surface it finds Dr Sen’s rack and a kit box lashed high with a lanyard, Hollis’s green tag on it: ‘SEN. DRY. DON’T.’ Rowan’s spare kit, saved by someone else first. He reads the tag twice and leaves them where they are safe.',
        gain: { battery: -1, evidence: 1 },
        artSubject: `A phone torch beam crossing a dark flooded cold room to a small kit box lashed high on a steel rack with a lanyard, ${MORROW} chest-deep holding the phone, breath clouding`,
      },
      {
        id: 'feel',
        label: 'Go in by touch, the way you did before',
        outcome:
          'Step down, and the cold takes his breath and keeps it. Three paces, rack on the left, a tray of glass that rings under the water, a long low note he feels in his teeth. Somewhere at the back, very gently, something rings back. He comes out with the kit box under one arm and no feeling in his hands.',
        gain: { evidence: 1, danger: 2 },
        artSubject: `${MORROW} in near-total darkness chest-deep in cold water, one arm outstretched along a steel rack, a small box clutched to his chest`,
      },
      {
        id: 'prop-door',
        label: 'Prop the door wide and let the water drain down the corridor',
        outcome:
          'He wedges it with a floating crate. The cold room empties into the corridor in a long black tongue, chest to knee in a minute, and he walks in almost easily. The water runs on downhill, toward the far end of the archive, where three people are waiting for it to go the other way.',
        gain: { evidence: 1, danger: -1, trust: -1 },
        artSubject: `A cold room door wedged wide with a crate, black water pouring out of it in a long stream down a corridor, ${MORROW} wading in against the flow`,
      },
    ],
  },
  {
    id: 'DA-14',
    title: 'Freezers Adrift',
    kind: 'puzzle',
    speaker: 'Morrow',
    opening:
      'The three chest freezers have floated off their places and turned in the water, cords trailing, and the cards on their lids have run and dried to the same words: ‘Sen Lab, −80 °C’. Labels are no use. Rowan’s tubes went in at −80, and a −80 freezer stays brutally cold for a day without power. A −20 freezer frosts its own seal; only far colder freezes the sea against it. One has frost on its seal. One sits in a skin of new ice. One has a warm lid and smells of pond.',
    artSubject:
      'Three white chest freezers floating and turned askew in a flooded basement, trailing power cords, one with frost on its seal, one ringed by a thin skin of fresh ice on the water, one with a dull dry lid in murky water, cold blue-white light',
    echoes: [
      {
        flag: 'SB-14:freezer-b',
        text: 'He knows Dr Sen’s −80 from the dry night: freezer B, middle of the row. There is no row now. The three have turned and traded places, and nothing on their lids is true.',
      },
      {
        flag: 'SB-14:freezer-a',
        text: 'He knocked her soup tub in the staff freezer last time and couldn’t set it back right. That freezer is out there among the three, wearing the same card as the others.',
      },
    ],
    choices: [
      {
        id: 'frosted-seal',
        label: 'Open the freezer with frost on its seal',
        outcome:
          'Fish fingers, a cake box gone soft, and a soup tub labelled H. that rolls off the rim into the sea before he can catch it. The staff freezer, drifted and disguised. He watches the tub sink, absurdly sorry, and hopes she lives to be annoyed about it.',
        gain: { trust: -1 },
        artSubject: `${MORROW} holding up the lid of a floating chest freezer full of frozen food, grabbing too late at a small tub sinking into the black water`,
      },
      {
        id: 'ice-skin',
        label: 'Crack the ice and open the freezer the sea froze to',
        outcome:
          'The lid comes up with a crack like a branch and white vapour rolls out over the water. Forty small tubes in a rack marked R., waking times creeping earlier week by week: 06:40, 05:10, 04:02, 03:15. The last has a date and no time. Beside it, newly frozen into the frost, a forty-first: tonight’s date.',
        gain: { evidence: 2 },
        artSubject: `White frost vapour pouring over the rim of a floating deep freezer ringed with broken ice, ${MORROW} lifting out a small rack of labelled sample tubes, his face lit cold blue`,
      },
      {
        id: 'warm-lid',
        label: 'Open the freezer with the warm lid',
        outcome:
          'Warm water, a pond smell, empty racks: out of service since March, whatever its card says now. As the lid drops the seal sighs, long and tired, and the sound travels off down the corridor and comes back as if someone had answered it.',
        gain: { danger: 1 },
        artSubject: `${MORROW} grimacing over a floating chest freezer full of murky warm water and empty racks, its lid half lowered`,
      },
    ],
  },
  {
    id: 'DA-15',
    title: 'Yesterday’s Call',
    kind: 'companion',
    speaker: 'Dr Sen',
    opening:
      'Dr Sen’s old cabinet stands in seawater to its second drawer, which has swollen shut. Morrow’s phone rings in its bag. Dr Sen, calm and a little distracted, talking about the calibration run she did yesterday. ‘Rowan? You sound like a swimming pool.’ Phones in this city now reach yesterday’s caller; this is hers, arriving tonight. She can hear him. She doesn’t know what tonight is. Behind the drawer front are her pencil notes on Rowan’s draft.',
    artSubject: `An old grey filing cabinet standing in black floodwater up to its second drawer, ${MORROW} beside it holding a phone to his ear through a clear dry bag, the phone screen lighting his face`,
    echoes: [
      {
        flag: 'SB-15:reply',
        text: 'Through the drawer gap he can see his own pencil line on the top page, ‘I don’t know yet. I’m finding out.’ Pencil, so it has kept. Beneath it, in hers, newer: ‘Then come and tell me.’',
      },
      {
        flag: 'SB-15:take-draft',
        text: 'The draft he took is in a drawer at home. Through the gap he can see it in this one too, wet, as if the cabinet had kept a copy.',
      },
      {
        flag: 'e03:5,2:care',
        text: 'She mentions, in passing, the time he put her overnight error on the team record under his own name. ‘You did that properly,’ she says, as if it were obvious, and it lands like a hand on his shoulder.',
      },
      {
        flag: 'e03:5,2:risk',
        text: 'She mentions the chamber booking for a 3 a.m. re-run, on his badge. ‘We should talk about that sometime,’ she says, kindly, from yesterday. He has been not talking about it for weeks.',
      },
    ],
    choices: [
      {
        id: 'take-draft',
        label: 'Wrench the drawer open and take the draft',
        outcome:
          'The drawer gives with a crack. The typed pages have run to grey and dried as sentences he doesn’t recognise. Her pencil sits untouched in every margin: ‘n = 1.’ ‘Please sleep.’ ‘Whose heart rate is this?’ On the phone she asks what that noise was. He says a drawer, which is true, and not nearly enough.',
        gain: { evidence: 2, trust: -1 },
        artSubject: `${MORROW} wrenching open a swollen filing cabinet drawer in floodwater, wet pages spilling out with faint pencil notes in their margins, a phone wedged at his shoulder`,
      },
      {
        id: 'ask',
        label: 'Ask her how to keep a record true in water',
        outcome:
          'She laughs, puzzled, and answers anyway, because she always answers. ‘Pencil. Graphite is just stone; water can’t move it. And write the time down twice, in two places, in case one of them lies.’ She asks if he’s eaten. He says yes, and she can hear the lie from yesterday.',
        gain: { evidence: 1, danger: -1 },
        artSubject: `${MORROW} leaning against a flooded filing cabinet with a phone to his ear, eyes closed, listening, a pencil stub held in his free hand`,
      },
      {
        id: 'warn',
        label: 'Tell her Hollis and two night staff are trapped down here',
        outcome:
          'He says it plainly: names, times, the flood gate. A silence on yesterday’s line. ‘Rowan, it’s Tuesday,’ she says, gently, as if to a patient. Then he hears her pencil moving. ‘I’ll write it down anyway.’ Somewhere upstairs, he hopes, a day-old note is waiting on her desk.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${MORROW} standing waist-deep beside a filing cabinet speaking urgently into a phone in a dry bag, one hand pressed flat against the cold cabinet`,
      },
    ],
  },
  {
    id: 'DA-16',
    title: 'The Only Dry Room',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'The blast chiller is the one room the sea has not got into. Its door was built to hold cold in, so it holds water out. The work order still says INSIDE RELEASE BROKEN, DO NOT ENTER ALONE; the latch works from outside only. The current has floated the wooden wedge away, and the door swings on the swell, a foot open, shut, open. Inside, dry and white with frost: a stack of boxes with green tags, carried in tonight. Hollis has been saving things.',
    artSubject:
      'The heavy steel door of a walk-in blast chiller swinging partly open in a flooded corridor, black water outside, a dry frosted interior with a small stack of cardboard boxes on a shelf, a taped paper work order on the door, a wooden wedge floating away',
    echoes: [
      {
        flag: 'entry:walt',
        text: 'Walt reads his own work order through the frost. ‘I wrote that after the summer,’ he says. ‘I’d write a longer one now.’',
      },
      {
        flag: 'entry:alone',
        text: 'Nobody would know to look for him in there. The key log might. It seems to know everyone.',
      },
      {
        flag: 'SB-16:leave',
        text: 'He kicked this wedge in tight for the next person, the dry night. It held until tonight.',
      },
      {
        flag: 'SB-16:wedge',
        text: 'He nearly lost a hand to this door once. His body remembers before he does: he is already standing a careful step back from the swing.',
      },
      {
        flag: 'SB-16:walt-holds',
        text: 'Walt stood square in this doorway for him once, talking about his niece’s football. Morrow can almost hear him now.',
      },
    ],
    choices: [
      {
        id: 'walt-holds',
        label: 'Ask Walt to hold the door against the swell',
        requires: { entry: 'walt' },
        lockedHint: 'Only if Walt came down with you',
        outcome:
          'Walt sets his back to the door and his boots to the wall and talks about his niece’s football the whole time, loudly, so Morrow can hear the door hasn’t won. Top box, green tag: ‘R. Sensor and dock. Dry.’ Hollis had minutes to choose what to save from the water, and she chose Rowan’s.',
        gain: { evidence: 1, trust: 1 },
        artSubject: `${WALT} bracing his back against a heavy chiller door in waist-deep water, talking, while ${MORROW} lifts a small box from a frosted shelf inside`,
      },
      {
        id: 'dash',
        label: 'Time the swell and go in fast',
        outcome:
          'In on the open: three seconds in a cold that hurts his teeth, the box under his arm, and out on the next open with the door’s edge shoving his shoulder like a bouncer. He makes it. He stands in the black water shaking, holding Rowan’s sensor, as the door slams on the chiller behind him with a sound like a verdict.',
        gain: { evidence: 1, danger: 2 },
        artSubject: `${MORROW} lunging out through the closing gap of a heavy walk-in freezer door into black water, a small box clutched to his chest, frost on his hair`,
      },
      {
        id: 'leave',
        label: 'Leave Hollis’s dry room shut, the way she meant it',
        outcome:
          'She put those things there to keep them. He waits for the swell to close the door and drops the latch from outside, sealing her one dry room against the sea. Nothing in a box is worth that door. He hopes she would agree, and suspects she would have done it faster.',
        gain: { danger: -1 },
        artSubject: `${MORROW} pressing a heavy chiller door shut and dropping its outside latch, floodwater swirling around him in a dim corridor`,
      },
    ],
  },
  {
    id: 'DA-17',
    title: 'Dials Reading the Tide',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The thermometer wall is still recording, but the circles have changed shape. Every chart pen, every cold room, now draws the same curve: a rise, a hold, a fall, every forty seconds, the tide breathing through the instruments. Among them hangs Rowan’s index card, ME, damp at the corners: his falling temperatures, the last line ‘02:14, not mine?’, and a new line beneath in wet ink, in the same capitals: ‘mine.’',
    artSubject:
      'A basement wall of round dial thermometers and circular paper chart recorders whose inked lines all trace the same repeating wave, a small damp handwritten index card pinned among them, exposed pipes, cool light reflected on floodwater below',
    autoChoiceId: 'read-card',
    echoes: [
      {
        flag: 'SB-17:read-card',
        text: 'He pinned this card back exactly where it was, the last time. It is not exactly where it was. It has moved one dial to the left, beside the chart for Cold Room One, as if it belonged with the cold rooms now.',
      },
      {
        flag: 'e03:8,8:risk',
        text: 'Every tide curve on the wall begins on the same morning: the one after he spoke the working at the fountain. He cannot make himself count the days back to be sure.',
      },
      {
        flag: 'e03:8,8:care',
        text: 'He walked home that night with the working unspoken. The charts don’t care what he didn’t do. They begin when they begin.',
      },
    ],
    choices: [
      {
        id: 'read-card',
        label: 'Read the new line again',
        outcome:
          'Mine. Not Rowan’s handwriting, exactly. The way Morrow writes Rowan’s handwriting. He touches it and the ink comes away on his finger, and the card is left with only the old question, as if it had never been answered. He pins it back and wipes his finger on his cardigan for a long time.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} staring at a smudge of wet ink on his fingertip in front of a wall of dial thermometers and chart recorders, a small index card pinned at eye level`,
      },
    ],
  },
  {
    id: 'DA-18',
    title: 'Warm Water, Fire Door',
    kind: 'shortcut',
    speaker: 'Morrow',
    opening:
      'Behind the compressors the water is warm, blood-warm from the machines still labouring under it, and steam lies on the surface in a low white fog. Morrow’s hands come back to him. At the end, the fire door to the stair is drowned to its top hinge. Through it is the flooded fire stair, and beyond that the landing by the intake: a short swim in black water, if he can find the way by touch and hold his breath for the length of a stair.',
    artSubject: `A narrow pipe-lined basement corridor flooded with dark water, a low white steam fog on the surface, humming compressor housings, a fire door submerged to its top hinge at the far end, ${MORROW} waist-deep with both hands under the warm water`,
    echoes: [
      {
        flag: 'SB-18:unlatch',
        text: 'He unlatched this door on the dry night. It is still unlatched under the water, swaying a hand’s width on the swell: there is a way through without fighting the bar.',
      },
      {
        flag: 'SB-18:leave-latched',
        text: 'He left this door latched, as it should be. Under the water the bar is down, and lifting it blind will cost breath.',
      },
      {
        flag: 'DA-05:tie-line',
        text: 'Under the water his fingers find a strand of grey wool pulled taut through the door gap: the guide line he tied on the far side. It runs all the way back to the landing.',
      },
      {
        flag: 'DA-05:ring',
        text: 'Through the drowned door comes a slow tick, tick: the alarm he rang on the far side has never quite stopped.',
      },
    ],
    choices: [
      {
        id: 'swim-through',
        label: 'Swim the flooded fire stair back to the intake landing',
        outcome:
          'Three breaths, then under. Warm, then cold as he goes; the bar under his palm, a turn of stair, a rail. He comes up gasping on the landing by the intake with the sea streaming off him. Now he knows the way back, and it is short. He also knows how long his breath lasts: exactly long enough, and not a second more.',
        gain: { danger: 1 },
        artSubject: `${MORROW} surfacing with a gasp from black water at the top of a flooded stairwell onto a concrete landing, one hand gripping the stair rail`,
      },
      {
        id: 'stay-dry',
        label: 'Stay in the warm and keep to the long way round',
        outcome:
          'He stays where the water is warm and lets the fog close behind him. The long way is long, but it is a way with air in it. He holds his hands under the surface a moment longer, and the machines go on breathing for him.',
        gain: { danger: -1 },
        artSubject: `${MORROW} standing in warm fog-covered water in a pipe-lined corridor, eyes closed, hands submerged, his back turned to a drowned fire door`,
      },
    ],
  },
]
