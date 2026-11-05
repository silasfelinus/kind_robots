import type { DrownedRoomContent } from './types'

const MORROW =
  'an androgynous adult in their thirties with short dark hair and a grey cardigan'

/**
 * The Drowned Archive, rows 4–6 (DA-19..DA-36): the server and records wing,
 * Rowan’s corner and the night archive, under the sea. Each room is its
 * Sublevel B twin, flooded; wet ink rewrites itself, while pencil, toner,
 * carbon and anything sealed hold. The guardian is the sea’s ledger at
 * Hollis’s desk.
 */
export const DROWNED_ROOMS_B: readonly DrownedRoomContent[] = [
  {
    id: 'DA-19',
    title: 'The Racks Under Water',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'Past the cold rooms the water turns warm, which is worse. It stands thigh-deep between the server racks, and the racks are still running under it, green lights blinking up through the black like something on a reef. The hum comes through the water now, and for the first time it has a rhythm: in, a long pause, out. Morrow counts it against his own breath and loses. A ventilation fan does not wait for the tide.',
    artSubject: `A narrow server room aisle flooded thigh-deep with still black water, tall racks studded with small green lights glowing up through the surface, warm haze above it, ${MORROW} standing in the water with one palm flat on a rack’s mesh door`,
    autoChoiceId: 'read-labels',
    echoes: [
      {
        flag: 'SB-19:listen',
        text: 'In spring he stood here with his palm on the mesh and took the hum for breathing. He was wrong then. He would very much like to be wrong now.',
      },
      {
        flag: 'entry:walt',
        text: 'Walt holds the torch high in a sandwich bag and won’t look at the lights. ‘They’re meant to trip out wet,’ he says. ‘Everything down here is meant to.’',
      },
      {
        flag: 'entry:alone',
        text: 'Alone, he counts the racks aloud as he passes them, so that something in the room is keeping time that isn’t the water.',
      },
    ],
    choices: [
      {
        id: 'read-labels',
        label: 'Wade to the rack labels and read them by their own lights',
        outcome:
          'Hollis’s neat capitals have run in the wet and set again in the same hand, saying new things: BACKUP reads BELONGS; CCTV 1–9 reads WITNESSES. The biro strip says ROWAN ASLEEP, DO NOT WAKE. Only the rota card she laminated is unchanged. Whatever the water touches, it edits. Whatever was sealed, it can’t.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of a fingertip tracing a row of handwritten labels on a server rack just above black water, the ink of one label visibly wet and reshaping, a laminated card beside it crisp and dry, green lights reflected on the knuckle',
      },
    ],
  },
  {
    id: 'DA-20',
    title: 'Doors That Hold the Sea',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'The badge-reader hall has become a lock: fire doors in a row, each holding back a different height of water, knee at the first, waist at the third. The readers still glow. Their little screens name whatever passes, and something is passing, low and slow, every few minutes: ROWAN. ROWAN. ROWAN. The laminated notice by the first door hasn’t changed: every door releases for one minute during the 01:00 fire-panel test. His phone says 00:41.',
    artSubject: `A long basement hall of heavy fire doors in a row, black water standing at a different height behind each one, small grey badge readers glowing beside them with the same short name on every screen, ${MORROW} knee-deep at the first door, red emergency light`,
    echoes: [
      {
        flag: 'SB-20:swipe',
        text: 'In spring he badged through all four doors in under a minute. The readers kept the beeps. Every few minutes they play them again, in order, to nobody.',
      },
      {
        flag: 'SB-20:wait',
        text: 'He waited out the fire-panel test on this stair once, dry. The step he sat on is under the water now, and someone has written on it in wet biro: 00:41.',
      },
      {
        flag: 'SB-20:walt',
        text: 'Walt mopped this hall in spring with Morrow carrying the bucket. The bucket is here, floating upright, as if waiting to be carried again.',
      },
      {
        flag: 'entry:walt',
        text: 'Walt thumps the first reader on its worn patch, out of habit. It goes green and names him WALT, then, after a pause, WALT AND ONE.',
      },
      {
        flag: 'entry:alone',
        text: 'Alone, he passes the first reader and its screen names him ROWAN. Then it names the empty water behind him, also ROWAN.',
      },
    ],
    choices: [
      {
        id: 'force',
        label: 'Shoulder each door open against the water and keep moving',
        outcome:
          'Each door fights him, then gives at once and lets a wall of cold through at chest height. He reaches the far end soaked to the collar, and every reader names him as he goes: ROWAN, four times, four lines in a log somebody will try to print on Monday from a server that is under the sea.',
        gain: { danger: 2 },
        artSubject: `${MORROW} braced shoulder-first against a fire door as a wave of black water bursts through the gap at chest height, a badge reader glowing beside the frame, spray in red emergency light`,
      },
      {
        id: 'wait',
        label: 'Wait on the stair for the fire-panel test',
        outcome:
          'Nineteen minutes on a wet step with his phone lit for company, which costs what phones cost. At 01:00 every lock drops at once, the water finds its own level down the whole hall with a long sigh, and he walks through waist-deep and unnamed. For one minute the readers have nothing to say.',
        gain: { battery: -1, danger: -1 },
        artSubject: `${MORROW} sitting on a concrete step just above dark water, face lit blue by a phone, a row of fire doors beyond all standing open at once and the water lying level down the hall`,
      },
      {
        id: 'walt-seals',
        label: 'Let Walt pick the doors whose seals have gone',
        outcome:
          'Walt knows which doors were rehung badly in 2009 and which he has been reporting since. He opens only those, a hand’s width at a time, and lets the water ease through instead of slamming. ‘You don’t fight a door,’ he says. ‘You wait for it to stop being angry.’',
        gain: { trust: 1, danger: -1 },
        requires: { entry: 'walt' },
        lockedHint: 'Only if Walt came down with you',
        artSubject: `An older cleaner in a work tabard easing a fire door open a few inches with one hand flat on it, water sliding gently through the gap, ${MORROW} waiting behind him holding a torch in a sandwich bag`,
      },
    ],
  },
  {
    id: 'DA-21',
    title: 'Monitors From Below',
    kind: 'secret',
    speaker: 'Morrow',
    opening:
      'The security cupboard is flooded to the seat of the swivel chair, and all nine monitors are still lit on the shelf above the water. None of them shows a corridor. They show the archive from places no camera was ever fixed: from inside the sump, from under the after-hours desk, from the second chair. The sticky note still says ‘playback: hold F4’. The playback store goes back to tonight, and tonight is when the water came.',
    artSubject: `A cramped security cupboard flooded to the seat of a swivel chair, nine small monitors on a high shelf showing grainy views from impossible low angles, one looking up at a desk lamp through water, ${MORROW} chest-deep bending toward the screens, blue-grey glow on black water`,
    echoes: [
      {
        flag: 'SB-21:watch',
        text: 'He held F4 here in spring and watched himself arrive. The playback counter has not moved since. It is still paused at 02:25.',
      },
      {
        flag: 'SB-21:leave',
        text: 'He turned the ninth monitor down in spring. It is the only dim screen tonight, and the only one whose picture he can still make out: the desk, the lamp, two chairs.',
      },
      {
        flag: 'e03:8,8:risk',
        text: 'He spoke the working at the fountain. On the second screen, water is coming up through a drain at the same slow beat the words had.',
      },
      {
        flag: 'e03:8,8:care',
        text: 'He never spoke the working. He tells himself so again, here, in front of nine screens that have plainly been watching somebody.',
      },
    ],
    choices: [
      {
        id: 'watch',
        label: 'Hold F4 and watch the night the water came',
        outcome:
          '21:40, from beneath the after-hours desk: a thin skin of water crosses the floor from nowhere. It goes round the legs of the second chair as if the chair were occupied. Then the clock jumps eleven minutes, as it did in spring, and when it comes back the desk lamp is burning under the surface and somebody has turned the chair to face the camera.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `Close view of a small grainy monitor showing, from floor level, a film of water flowing around the legs of an empty office chair, the faint reflection of ${MORROW} in the screen glass, one finger pressed on a key`,
      },
      {
        id: 'leave',
        label: 'Turn the screens to the wall and go',
        outcome:
          'He turns all nine to face the plaster, one by one, and the cupboard goes dark but for their glow on the wall. Whatever they saw, they can keep seeing it without him. He does not need to know which chair the water went round.',
        gain: { danger: -1 },
        artSubject:
          'Nine small monitors turned to face a damp plaster wall, their light spilling round the edges onto the water below, an empty swivel chair half submerged',
      },
    ],
  },
  {
    id: 'DA-22',
    title: 'Tapes Afloat',
    kind: 'puzzle',
    speaker: 'Morrow',
    opening:
      'The tape library is waist-deep and the cartridges have floated out of their slots. Every biro label has run and set again, so the words can’t be trusted. Hollis’s laminated rota card can: ‘Month-end tapes in grey cases. Weekday tapes in clear. Yellow label = cleaning tape, never load.’ Three tapes bob by the old drive, dry on its trolley: a clear case marked 30 APR, KEEP; a grey case with a yellow label; a grey case with a white label marked WHO BELONGS.',
    artSubject: `Tall metal shelving of empty tape slots above waist-deep black water, grey and clear cartridge cases floating on the surface, one with a yellow label, an old tape drive glowing on a trolley above the waterline, ${MORROW} holding a laminated card up to the light`,
    echoes: [
      {
        flag: 'SB-22:month-end',
        text: 'He found the right tape here once by trusting the rota card. The card is the one thing in the room the water hasn’t touched. That seems like advice.',
      },
      {
        flag: 'SB-22:pencilled',
        text: 'He trusted a pencilled R here in spring and the tape had forgotten it in a week. Tonight it isn’t only tapes that forget.',
      },
      {
        flag: 'SB-22:yellow',
        text: 'He loaded the cleaning tape here in spring and the drive told the whole floor. Tonight a loud drive would tell the water.',
      },
    ],
    choices: [
      {
        id: 'clear-keep',
        label: 'Load the clear case marked 30 APR, KEEP',
        outcome:
          'Last week’s facilities rota, written over a spring long gone. A clear case: a weekday tape all along, and only its label taught to lie. The drive takes four loud minutes to rewind, and the water shivers every time it clunks.',
        gain: { danger: 1 },
        artSubject: `${MORROW} wincing beside an old tape drive as a clear-cased cartridge ejects, a long list of rota entries on its small screen, ripples spreading on the water below`,
      },
      {
        id: 'yellow',
        label: 'Load the grey case with the yellow label',
        outcome:
          'The drive grinds, cleans its own heads and spits the tape back out. A cleaning tape filed in a month-end case: someone was in a hurry, long before the sea. The pencil tally on Hollis’s card will be one short by morning.',
        gain: { danger: 1 },
        artSubject:
          'A grey cartridge with a yellow label sticking half out of a tape drive slot, a pencil tally on a laminated card pinned above it, a wet hand hovering, dim aisle light over water',
      },
      {
        id: 'white-grey',
        label: 'Load the grey case with the white label, WHO BELONGS',
        outcome:
          'A month-end tape, whatever its label says now. The drive lists Rowan’s folder as it stood on 30 April, opened.txt and all: thirteen nights his files were opened while he slept, exactly as April left them. It is the first record down here the water hasn’t edited. He reads it twice, for the comfort of something staying true.',
        gain: { evidence: 2 },
        artSubject: `${MORROW} leaning close to the green-on-black screen of an old tape drive on a trolley, a grey-cased cartridge seated in the slot, face lit from below, dark water lapping at the trolley wheels`,
      },
    ],
  },
  {
    id: 'DA-23',
    title: 'The Sump Breathes',
    kind: 'hazard',
    speaker: 'Morrow',
    opening:
      'This is where the sea comes in. The sump pit in the corner is a black well, breathing: the water rises a hand’s width, holds, and falls back. The pump shudders against it and loses. By its red standby light Morrow can see the power strip still on its crate, its cable trailing into the water, and the far door’s dry step now just under the surface. The pallets someone once laid as a path float loose, nosing at his knees.',
    artSubject: `A dark flooded plant room, black water rising and falling around a square pit in the corner, a sump pump with a single red standby light, a power strip on a crate with its cable in the water, loose wooden pallets floating, ${MORROW} knee-deep by the door`,
    echoes: [
      {
        flag: 'SB-23:isolator',
        text: 'He killed this pump in spring and let the water creep toward the tapes. Tonight the isolator lever is up, with a strip of tape across it in Hollis’s capitals: PLEASE DON’T.',
      },
      {
        flag: 'SB-23:torch',
        text: 'He walked these pallets like a balance beam in spring and arrived with dry socks. They are turning, slowly, as if to point out the way he went.',
      },
      {
        flag: 'SB-23:wade',
        text: 'He waded this room once by the red light and never knew how close it was. Tonight he can see exactly how close. The pit is wider.',
      },
      {
        flag: 'entry:walt',
        text: 'Walt ties his end of the rope round a pipe bracket without being asked. ‘Don’t argue with a sump,’ he says. ‘It always wins on the night.’',
      },
    ],
    choices: [
      {
        id: 'torch',
        label: 'Light the floating pallets and pick a path',
        outcome:
          'The beam shows what the red light hid: the split cable, the open pit, and the pallets turning with the sump’s breath. He goes when the water falls, pallet to pallet, and reaches the step as it rises again behind him. His socks are not dry. That title is gone.',
        gain: { battery: -1, danger: -1 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        artSubject: `A phone torch beam across black water picking out a split cable and a chain of floating pallets, ${MORROW} stepping from one pallet to the next with arms out, the open pit dark beside them`,
      },
      {
        id: 'wade',
        label: 'Wade along the wall by the standby light',
        outcome:
          'He keeps one hand on the wall and his feet away from where he thinks the pit is. Halfway, the sump breathes in and the water pulls at his knees toward the dark, gently, the way a crowd moves you. He lets go of nothing. He arrives, and will never know by how much.',
        gain: { danger: 2 },
        artSubject: `${MORROW} wading thigh-deep along a wet wall in near darkness, one palm flat on the bricks, water dragging sideways toward a dark pit, the red pin of a standby light reflected in ripples`,
      },
      {
        id: 'isolator',
        label: 'Kill the power at the wall isolator first',
        outcome:
          'The red light dies and the live strip with it, and the room is properly dark and safe to cross. So is the pump. Behind him, with nothing left arguing with it, the sea breathes in and does not breathe out, and the water starts up the corridor toward the night archive, where somebody has been awake all night on purpose.',
        gain: { trust: -1, danger: -1 },
        artSubject:
          'A wet hand pulling down the lever of a grey wall isolator in a dark flooded room, the last red glow of a pump light going out, the water already a little higher on the wall',
      },
    ],
  },
  {
    id: 'DA-24',
    title: 'The Dock Door Knocks',
    kind: 'shortcut',
    speaker: 'Morrow',
    opening:
      'The loading-dock ramp has become a beach. The sea runs down it from under the roller door and back up, and the steel side door slams on its closer with every surge, every forty seconds: a deep iron knock, twice, patient as an appointment. Outside, the covered walkway is a channel of black water with its handrail still standing, running straight to the night archive’s long corridor. The alarm cable hangs unplugged, wound neatly round its bracket.',
    artSubject: `A concrete loading-dock ramp inside a basement with seawater washing up and down it like a shore, a corrugated roller door leaking at the bottom, a steel side door swinging on its closer, a flooded covered walkway beyond with a handrail, ${MORROW} on the wet ramp, sodium light`,
    echoes: [
      {
        flag: 'SB-24:wedge',
        text: 'The folded delivery note he wedged here in spring is still under the door, swollen to a sponge. The sea has been coming in round it for hours, politely.',
      },
      {
        flag: 'SB-24:close',
        text: 'He closed this door in spring and called it the one thing he left as he found it. The sea has been testing that all night.',
      },
      {
        flag: 'DA-18:swim-through',
        text: 'He has already swum the fire stair once tonight; his cardigan hasn’t stopped dripping. Wedging this would make two ways through the archive he opened himself.',
      },
      {
        flag: 'DA-18:stay-dry',
        text: 'He stayed out of the fire stair. This is the only other short way through the archive, and it is not dry.',
      },
      {
        flag: 'entry:walt',
        text: 'This is the ramp they came down together. Walt looks at it as if it owes him money. ‘It wasn’t this wet at quarter to ten,’ he says.',
      },
      {
        flag: 'entry:alone',
        text: 'He forced the door upstairs alone. This ramp is the way Walt would have brought him down, and the sea is using it now.',
      },
    ],
    choices: [
      {
        id: 'wedge',
        label: 'Wedge the side door open against the surge',
        outcome:
          'He jams a floating pallet between door and frame and the knocking stops. Now there is a straight run along the handrail to the long corridor, chest-deep and fair if he keeps hold, and the archive has one more open door for a sea that needs no invitation and has just been given one anyway.',
        gain: { danger: 1 },
        artSubject:
          'A steel side door held open by a wooden pallet jammed into the frame, black water pouring through, a flooded covered walkway beyond with a handrail running straight into the dark',
      },
      {
        id: 'close',
        label: 'Let it slam shut and go the long way',
        outcome:
          'He waits for a surge to fall and hauls the door home with both hands until the bar catches. The knocking goes on, outside now, patient. The long way runs through Rowan’s corner. It was always going to.',
        gain: { danger: -1 },
        artSubject: `${MORROW} hauling a steel door shut with both hands at the top of a wet ramp, water streaming off one sleeve, looking back down into the dark archive`,
      },
    ],
  },
  {
    id: 'DA-25',
    title: 'Carrels Adrift',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The carrel lamps are still lit, and the water is up to the desks, so each carrel holds a small gold pool with a mug floating in it. The chipped ‘World’s Okayest Postdoc’. The one with the fossil teabag. The one full of pens, floating upright. They are all drifting the same way, slowly, against no current he can feel, toward the night archive, like a queue. The brass name slots are wet, and every card in them has been rewritten.',
    artSubject: `A row of wooden study carrels flooded to desk height, each lamp still lit and casting a gold pool on the water, a line of mismatched abandoned mugs floating in single file toward the far end, ${MORROW} wading past them`,
    echoes: [
      {
        flag: 'SB-25:rinse',
        text: 'The mug he rinsed in spring is still upside down by the sink, and inside it, held by a pocket of trapped air, it is dry. It is the only dry thing in the room.',
      },
      {
        flag: 'SB-25:cards',
        text: 'In spring Rowan’s card was turned face down by someone who wanted his absence unannounced. Someone, or something, has turned it back.',
      },
    ],
    choices: [
      {
        id: 'cards',
        label: 'Read the rewritten name cards',
        outcome:
          'Eleven strangers who left years ago, rewritten by the water in Hollis’s hand with the same word after each: RETURNED. Round the corner, the twelfth slot, Rowan’s, has been turned face up. It says IN.',
        gain: { evidence: 1, danger: 1 },
        artSubject:
          'Close view of a wet name card in a brass slot on a carrel end, the handwriting on it glistening as if freshly written, a lamp glowing above lapping water',
      },
      {
        id: 'catch',
        label: 'Catch the mugs and stand them upside down on the top shelf',
        outcome:
          'He fishes them out one by one and stands them upside down on the dry shelf, the way people do upstairs. It stops nothing; the water goes on queueing without them. But twelve strangers’ mugs are out of the sea, and he feels, against all sense, that somebody has noticed.',
        gain: { trust: 1 },
        artSubject: `${MORROW} chest-deep in a flooded carrel row reaching for a floating mug, a dozen others already standing upside down in a neat line on a high shelf above the water`,
      },
    ],
  },
  {
    id: 'DA-26',
    title: 'The Carrel at High Water',
    kind: 'choice',
    speaker: 'Morrow',
    opening:
      'Rowan’s carrel is chest-deep. The ring binder has swollen open and its pages lift and settle like gills, the scrawl crawling into new sentences as he watches. The sensor’s cable is coiled on an empty hook, a dry note pinned over it: ‘Sensor safe in the chiller. H.’ Rowan’s desk phone floats off its hook, the line open, breathing. The photo of Rowan and Jun is pinned just above the waterline. Morrow has time for one thing before the water does.',
    artSubject: `A neat wooden study carrel flooded chest-deep under a single lamp, a swollen ring binder open on the water with its pages lifting, a beige desk phone receiver floating on its curly cord, an empty hook with a pinned note, a photo of two people laughing under an inside-out umbrella pinned just above the surface, ${MORROW} in the water`,
    echoes: [
      {
        flag: 'SB-26:binder',
        text: 'He took the binder in spring and left a clean rectangle in the dust. The binder in the water is a new one, in a new hand, and it would fit the rectangle exactly.',
      },
      {
        flag: 'SB-26:sensor',
        text: 'He posted the sensor to Dr Sen in spring in a padded envelope: ‘Sorry it’s late. R.’ Hollis’s note says she has saved it from the water tonight, which means it came back.',
      },
      {
        flag: 'SB-26:photo',
        text: 'He took the photo in spring and it is still in his inside pocket. Pinned in its place is a print of the same picture, damp at the edges, as if the archive kept a copy.',
      },
    ],
    choices: [
      {
        id: 'binder',
        label: 'Lift the binder out before it finishes rewriting',
        outcome:
          'He hauls it up streaming and shuts it hard, and the crawling stops. Half of it is still Rowan’s nights. Half is new, in a tidier hand, describing a man at a desk at 02:25 who stood up and thanked the night archivist for her name. He carries both halves. The sea has been taking notes.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${MORROW} lifting a streaming, swollen ring binder out of black water and clamping it shut against his chest, lamp light on the spray`,
      },
      {
        id: 'phone',
        label: 'Lift the floating receiver out of the water',
        outcome:
          'The line is open to yesterday’s caller: Dr Sen at four, leaving the message she left, asking kindly after Rowan and whether he is sleeping. He listens to all of it and says, ‘Yes. Better,’ which is a lie she will never hear. Then he hangs up, and the room feels lighter, as if something has stopped listening.',
        gain: { trust: 1, danger: -1 },
        artSubject:
          'Close view of a wet hand holding a dripping beige telephone receiver to an ear, its curly cord trailing down into dark water, a carrel lamp behind',
      },
      {
        id: 'photo',
        label: 'Unpin the photo before the water reaches it',
        outcome:
          'He gets it into his inside pocket with a second to spare: two people on a wet pier, laughing too hard to fix an umbrella. Behind him the binder finishes a sentence it was always going to finish, and he lets it. Whatever the sea writes down tonight, it will not have this.',
        gain: { trust: 2 },
        artSubject: `${MORROW} chest-deep in water slipping a small photograph into an inside pocket, a drawing pin between two fingers, the swollen binder drifting open behind`,
      },
    ],
  },
  {
    id: 'DA-27',
    title: 'Every Night the Seventeenth',
    kind: 'puzzle',
    speaker: 'Morrow',
    opening:
      'The lamp still burns above the water, and Rowan’s three nights are still clipped to its shade, soaked. The toner graphs have held. His biro numbers have run and set again: all three now say Night 17, the night of the trade. Beneath them, in Hollis’s pencil, which has held: ‘Round 02:30, the 4th sign-out. R. awake at desk, stood up, asked my name.’ Page one: asleep 00:40–04:55, heart rate 41. Page two: asleep 00:20–05:30, too smooth. Page three: asleep 02:14–02:25, then nothing.',
    artSubject: `A bent-neck desk lamp burning just above dark water, three soaked printed graphs clipped to its shade with bulldog clips, a pencilled card pinned beneath them, ${MORROW} chest-deep reading with one finger on a line`,
    echoes: [
      {
        flag: 'SB-27:night-fourteen',
        text: 'He caught Rowan’s forged night here in spring by its missing hour. He would know that smooth page anywhere, whatever number it wears.',
      },
      {
        flag: 'SB-27:night-nine',
        text: 'In spring he lost ten minutes to the heart rate of 41. Tonight the 41 is pulsing faintly on the wet page, in time with the water.',
      },
      {
        flag: 'SB-27:night-seventeen',
        text: 'He sat with those eleven minutes in spring longer than the puzzle needed. Tonight the sea is sitting with them too.',
      },
    ],
    choices: [
      {
        id: 'page-one',
        label: 'Page one: the heart rate of 41, a heart that isn’t his',
        outcome:
          'Tempting, and wrong: at half two this sleeper was deep under, and Hollis found Rowan awake. This is Night 9, whatever the biro says now. Morrow loses ten minutes to it, and the water climbs another inch up the clips.',
        gain: { danger: 1 },
        artSubject:
          'Close view of a soaked printed heart-rate graph with one long low trough, wet biro numbers above it blurring, water lapping at its lower edge',
      },
      {
        id: 'page-two',
        label: 'Page two: the night too smooth to be real',
        outcome:
          'A forgery, but Rowan’s, not the sea’s: Night 14, the clocks-forward night he typed in by hand, and its sleeper was asleep at half two. While he reads it the lamp flickers, and his phone, held up for light, has been burning charge the whole time.',
        gain: { battery: -1 },
        artSubject: `${MORROW} holding one soaked printout up beside a flickering lamp, its graph suspiciously smooth, a phone lit in the other hand`,
      },
      {
        id: 'page-three',
        label: 'Page three: eleven minutes, then nothing',
        outcome:
          'Asleep at 02:14, awake by 02:25, and awake at half two when Hollis came round. This is the true Night 17. He unclips it, and the other two pages go limp, and their numbers slide back to 9 and 14, as if the sea needed him to agree with it and he has declined.',
        gain: { evidence: 2 },
        artSubject:
          'A printout with a short burst of graph and then a long flat line held up out of dark water, two other pages hanging limp from a lamp shade behind it',
      },
    ],
  },
  {
    id: 'DA-28',
    title: 'The Cot Above the Tide',
    kind: 'rest',
    speaker: 'Morrow',
    opening:
      'The cot room is a step up from the sleep lab, and the step has held the sea to an inch across the floor. It is the driest place for a hundred metres. The camping cot is still there, the dented pillow, the folded fleece, the phone charger in the only socket, high on the wall. Rowan’s four pencilled dates are on the wall by the cot. There is a fifth now, in the same pencil and the same hand: tonight’s.',
    artSubject: `A cramped storeroom with a camping cot under a bare bulb, a dented pillow and folded fleece blanket, a thin sheet of water across the concrete floor, faint pencil marks on the wall above the cot, a phone charger in a single high socket, ${MORROW} on the step in the doorway`,
    echoes: [
      {
        flag: 'SB-28:sleep',
        text: 'The pillow still holds the dent he left in spring, hands folded, Rowan-shaped. The water has come right up to the cot legs and no further.',
      },
      {
        flag: 'SB-28:search',
        text: 'The receipt for a second desk chair, which he found under this cot in spring, is back under it, dry, as if returned.',
      },
      {
        flag: 'entry:walt',
        text: 'Walt sits on the step with his boots in the inch of water and the torch across his knees. ‘Go on,’ he says. ‘I’ll do the listening.’',
      },
      {
        flag: 'entry:alone',
        text: 'Alone, he wedges the door open with a shoe so that he will hear the water if it changes its mind.',
      },
    ],
    choices: [
      {
        id: 'sleep',
        label: 'Lie down on the cot for an hour with the phone charging',
        outcome:
          'He sets an alarm and lies down in a dent that fits. The water talks to itself on the floor below him all hour, never louder, never closer. He sleeps without dreams. When the alarm goes he is on his back with his hands folded, and the inch of water has not risen at all, as if it, too, had been told to let him rest.',
        gain: { battery: 2, danger: -1 },
        artSubject: `${MORROW} asleep on his back on a narrow camping cot, hands folded on his chest, a phone charging high on the wall with a small glowing light, a thin sheet of still water reflecting the doorway`,
      },
      {
        id: 'search',
        label: 'Search the cot and the shelves instead',
        outcome:
          'Under the pillow, in a sandwich bag Rowan taped shut, a dry page: ‘Who has a key: Hollis. Walt. Me.’ Then a fourth line with only a question mark on it. It was written in March, long before any sea. Tonight it is the most frightening thing he has read.',
        gain: { evidence: 1 },
        artSubject: `${MORROW} kneeling on a wet floor holding up a taped sandwich bag with a folded handwritten page inside, a camping cot and dented pillow above him, bare bulb light`,
      },
    ],
  },
  {
    id: 'DA-29',
    title: 'The Board the Sea Corrected',
    kind: 'choice',
    speaker: 'Morrow',
    opening:
      'Rowan’s whiteboard runs down into the water, and below the surface his marker has lifted off the gloss and hangs in slow ribbons. Above it, the sea has been correcting: arrows straightened, the dose column struck through, his forty lost minutes a night totted into a single column under a heading in Hollis’s capitals, WHO BELONGS. In the bottom corner, just above the waterline, the small ‘M?’ is still there. The question mark is fading.',
    artSubject: `A wall-wide whiteboard disappearing into dark water, ribbons of lifted marker ink drifting under the surface, the dry upper half crowded with neat corrected diagrams, a tiny mark in the lower corner just above the waterline, ${MORROW} crouched chest-deep to look at it`,
    echoes: [
      {
        flag: 'SB-29:erase',
        text: 'He rubbed the M? out with his sleeve in spring. It has come back up through the gloss, darker than Rowan ever wrote it.',
      },
      {
        flag: 'SB-29:answer',
        text: 'His own ‘Morrow’ from spring is still in the corner beside the M?, and it is the only word on the board the sea hasn’t touched. It doesn’t need correcting.',
      },
      {
        flag: 'SB-29:copy',
        text: 'His notebook copy of this board is in his pocket, three pages of Rowan’s loops. The board on the wall no longer matches it.',
      },
      {
        flag: 'DA-21:watch',
        text: 'He has seen tonight’s footage. Every corrected arrow on this board points to 21:40.',
      },
    ],
    choices: [
      {
        id: 'erase',
        label: 'Rub out the M? before the water answers it',
        outcome:
          'Two passes with a wet sleeve and it’s gone, ghost and all. Under the surface the ribbons of marker drift, searching, for a long minute, and then settle. He has hidden a name from the sea by hiding it from Rowan too.',
        gain: { trust: -1, danger: -1 },
        artSubject:
          'A wet grey cardigan sleeve rubbing at the corner of a crowded whiteboard just above dark water, ribbons of ink drifting below the surface',
      },
      {
        id: 'answer',
        label: 'Write your own name beside it, above the water',
        outcome:
          'He writes ‘Morrow’ in Rowan’s handwriting, the only hand this hand has. The ribbons under the surface turn toward it all at once, like fish to a light, and the question mark finishes fading. Something in the archive now has the answer Rowan was asking for. He gave it on purpose.',
        gain: { trust: 1, danger: 1 },
        artSubject: `${MORROW} writing a single small word in marker in the corner of a whiteboard just above the waterline, ribbons of ink under the surface all turned toward the pen`,
      },
      {
        id: 'photograph',
        label: 'Photograph the board with the flash before it’s rewritten',
        outcome:
          'Eight overlapping shots with the flash, which costs what flashes cost. In the pictures the board is Rowan’s again, arrows looping, M? and all, as if the phone can only see what a hand wrote. The water hasn’t learned to edit photographs. Yet.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        artSubject: `${MORROW} holding a phone up to a flooded whiteboard as the flash fires, the phone screen showing a messier, looping version of the diagrams than the board itself`,
      },
    ],
  },
  {
    id: 'DA-30',
    title: 'The Strips Knit',
    kind: 'choice',
    speaker: 'Morrow',
    opening:
      'A dead end, and the water is deepest here, gathered in the box room like something hiding. The shredder bin has emptied itself into it, and the paper strips float in a slow mat on the surface. They are knitting. Edge finds edge, line finds line, and the lined pages are coming back together in Rowan’s writing: a letter that was meant to stay confetti. The motion light clicks off every forty seconds, and stays off longer each time.',
    artSubject: `A tiny windowless box room flooded chest-deep, a mat of shredded paper strips floating on the surface and visibly joining back into lined handwritten pages, an office shredder half submerged, a single motion-sensor light, ${MORROW} raising one arm to wake it`,
    echoes: [
      {
        flag: 'SB-30:piece',
        text: 'He taped this letter together himself in spring, forty minutes by torchlight. The sea is doing it faster, with less respect for where the lines go.',
      },
      {
        flag: 'SB-30:finish',
        text: 'He let the machine finish this letter in spring, for Rowan’s privacy. The water is unfinishing it.',
      },
      {
        flag: 'SB-30:pocket',
        text: 'The half page he pulled from the teeth in spring is in his pocket, dry. On the water, the letter is mending itself round the gap where it was.',
      },
    ],
    choices: [
      {
        id: 'read',
        label: 'Hold the torch on the pages as they mend, and read',
        outcome:
          '‘Dear Dr Sen, I think someone is coming in at night. I know how this sounds.’ Then the strips join wrong, line to the wrong line, and the letter goes on in a hand that is nearly Rowan’s: ‘His name is’, and stops, waiting. It wants someone to finish it. Morrow lowers the torch before it can be him.',
        gain: { battery: -1, evidence: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        artSubject: `A phone torch beam on a mat of floating paper strips joining into a lined handwritten page, the last line ending in a gap, ${MORROW} holding the light low over the water`,
      },
      {
        id: 'drain',
        label: 'Herd the strips down the floor drain unread',
        outcome:
          'He finds the grate with his foot and sweeps the mat toward it, and the strips go down in a long whisper, still trying to join on the way. Rowan chose to shred that letter. Morrow helps him choose it twice.',
        gain: { trust: 1, danger: -1 },
        artSubject: `${MORROW} chest-deep sweeping a mat of floating paper strips toward a swirl over a floor drain with both arms, the motion light just flickering out`,
      },
      {
        id: 'pocket',
        label: 'Tear free the part that has already mended',
        outcome:
          'He tears it loose mid-knit. Six lines and a ragged edge, word for word the six lines he remembers. It is the only part of the letter that was true before the sea started helping.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of wet fingers holding a torn half page of lined handwriting above dark water, the other strips still drifting together below',
      },
    ],
  },
  {
    id: 'DA-31',
    title: 'The Corridor Like Glass',
    kind: 'lore',
    speaker: 'Morrow',
    opening:
      'The long corridor is flooded to the knee and perfectly still, so the ceiling lights lie in the water as a second corridor going down. At the far end the strip of warm light under Hollis’s door shines up through the surface. The intercom by the door is on. Her voice comes along the water, calm, reading names off a list: ‘Hollis, nights. Ines, nights. Kwame, nights. Rowan, in.’ A pause. ‘And one more.’',
    artSubject: `A long straight basement corridor flooded knee-deep with perfectly still water mirroring the ceiling lights, a pinboard of rotas on one wall, at the far end a closed office door with warm light spilling from beneath into the water and a small intercom panel beside it, ${MORROW} small in the middle distance`,
    autoChoiceId: 'walk',
    echoes: [
      {
        flag: 'SB-31:walk',
        text: 'In spring a radio here was playing a phone-in about lost cats. It is still playing, low, under the water. The callers are describing people now, kindly.',
      },
      {
        flag: 'DA-24:wedge',
        text: 'He came by the walkway handrail, chest-deep. Behind him the wedged dock door is letting the sea in, and the corridor water has a faint lean toward the office.',
      },
      {
        flag: 'DA-24:close',
        text: 'He shut the dock door and came the long way round. The knocking has followed him, faint, from behind the office wall.',
      },
      {
        flag: 'entry:walt',
        text: 'Walt stops dead at the voice. ‘That’s her,’ he says. Then, after a moment: ‘That’s her voice.’ It is not the same sentence.',
      },
    ],
    choices: [
      {
        id: 'walk',
        label: 'Wade toward the light under the door',
        outcome:
          'Halfway, the pinboard of rotas: Hollis, nights, every night for years. Under this spring, the four blue-biro entries she wrote to cover Rowan, ‘in archive, returned’, have run and set again. They all say ‘in archive’ now. The water has taken her kind lie and turned it into the truth it prefers.',
        gain: { evidence: 1 },
        artSubject:
          'Close view of a cork pinboard just above still water, layered with yellowing paper rotas, the newest sheet’s blue biro entries wet and glistening as if rewritten, a fingertip resting on one of them',
      },
    ],
  },
  {
    id: 'DA-32',
    title: 'The Sea’s Ledger',
    kind: 'guardian',
    speaker: 'The ledger',
    opening:
      'Hollis’s office is chest-deep. Her chair is empty; her glasses float on their chain. On the desk, above the water as if the water had agreed to it, lies a ledger in her handwriting, its pages dripping and never drying: every name in the archive tonight, and who belongs. Rowan, in. Hollis, Ines, Kwame, nights. A last line, blank. The intercom speaks in her voice, tired and reasonable: ‘One account, love. I only need the one. Who’s that at my door?’',
    artSubject: `A small archive office flooded chest-deep, an empty desk chair, reading glasses on a chain floating on the water, a large open ledger lying perfectly dry on the desk with its pages dripping at the edges, a desk lamp and a small intercom panel on the wall, ${MORROW} in the doorway`,
    echoes: [
      {
        flag: 'SB-32:truth',
        text: 'In spring he told Hollis everything at this desk and she poured him tea. The ledger has that conversation on the page before, word for word, with ‘I don’t believe you’ underlined.',
      },
      {
        flag: 'SB-32:show-evidence',
        text: 'In spring she read his evidence provenance first and filed him in a manila folder. The folder floats by the desk. Its label has run: it says BELONGS?',
      },
      {
        flag: 'SB-32:walt-vouches',
        text: 'Walt vouched for him at this desk once. The ledger has that too, ‘W. says not trouble’, and the ink is running on ‘not’.',
      },
      {
        flag: 'DA-21:watch',
        text: 'On her little monitor the playback is paused at 21:40, the second chair turned toward the camera. The ledger has the same time against the blank line.',
      },
      {
        flag: 'e04:2,1:care',
        text: 'The ledger is a roll call the way Mara’s was on Platform 4: block capitals, only who is here. It has learned the method and got the count wrong.',
      },
      {
        flag: 'e04:2,1:risk',
        text: 'Mara’s count was sixty-one after he rode the coat train. Two names he doesn’t know are at the foot of this page, signed in, ‘nights’.',
      },
      {
        flag: 'DA-12:note',
        text: 'His note for Hollis from the kitchenette is pressed into the ledger like a flower. It was unsigned. Something has been trying to sign it for him.',
      },
      {
        flag: 'DA-12:charge',
        text: '‘You charged your phone on the high socket,’ says the intercom, kindly, in her voice. ‘Phones are always a confession.’',
      },
    ],
    choices: [
      {
        id: 'truth',
        label: 'Give the ledger your real name: Morrow',
        outcome:
          'He takes her pen from the water and writes MORROW on the blank line, in Rowan’s handwriting, the only hand he has. The ink doesn’t run. ‘Thank you,’ says the intercom, and it sounds like her, and like relief. The water drops a hand’s width. Behind the desk the cage door unlatches. Somewhere, a great deal of sea has just learned something.',
        gain: { trust: 1, danger: 1 },
        passesGuardian: true,
        artSubject: `${MORROW} chest-deep at a flooded desk writing one word in capitals on the last line of a dry open ledger, the pen dripping, the desk lamp throwing his shadow onto the water`,
      },
      {
        id: 'show-evidence',
        label: 'Lay the dry records on the ledger and show it its errors',
        outcome:
          'He lays out what he has kept dry: the tape listing, the footage times, the true nights, the pages the water couldn’t edit. The ledger reads them as an archivist would, provenance first. Under ‘Rowan, in’ the ink gathers itself and writes, slowly, ‘not here since spring’. The intercom is quiet a long time. ‘Then I’ve got it wrong,’ it says. ‘Go on through.’',
        gain: { trust: 1, danger: -1 },
        requires: { evidence: 4 },
        lockedHint: 'Needs more evidence (4)',
        passesGuardian: true,
        artSubject:
          'Printouts, a notebook and damp papers squared into a neat spread beside a large open ledger on a flooded desk, one line of the ledger’s handwriting visibly rewriting itself, lamplight on the water',
      },
      {
        id: 'walt-anchors',
        label: 'Let Walt hold the rope while you sign',
        outcome:
          'The moment the pen touches the blank line the water pulls, hard, toward the desk, the way the sump pulled. Walt has the rope round a pipe and in both fists and doesn’t give an inch. Morrow signs ‘R., escorted’, and Walt leans in and signs beneath it, ‘W., escort, 20 yrs’. Two names on one line. The ledger can’t make one account of that. It lets them by.',
        gain: { trust: 2, danger: -1 },
        requires: { entry: 'walt' },
        lockedHint: 'Only if Walt came down with you',
        passesGuardian: true,
        artSubject: `An older cleaner in a work tabard braced against a wall pipe with a rope wrapped round both fists, the rope running to ${MORROW} who leans over a flooded desk signing a dry ledger, water dragging hard toward the desk`,
      },
    ],
  },
  {
    id: 'DA-33',
    title: 'The Cage Above the Tide',
    kind: 'treasure',
    speaker: 'Hollis',
    opening:
      'Behind the desk the wire cage stands open, and the real Hollis is on top of it with the two agency night staff, Ines Duarte and Kwame Asante, in their second week. They sit along the top shelving under the ceiling, the sea at their boots. She went to shut the gate at ten and got this far. She has a thermos, a rota of who gets the warm end, and a voice gone hoarse. ‘Stay high, stay left,’ she says. ‘Good. And that wasn’t me on the intercom.’',
    artSubject:
      'A wire-mesh archive cage flooded nearly to the top, a grey-haired woman in her sixties in a navy fleece and two younger night staff in work lanyards sitting along the top of its shelving just under the ceiling, a thermos passed between them, a small battery safety light, an androgynous adult in their thirties with short dark hair and a grey cardigan in the water below looking up',
    echoes: [
      {
        flag: 'SB-33:power-bank',
        text: 'Hollis looks down at him over her glasses. ‘You had a power bank off me in spring,’ she says. ‘I wrote it down. I’ve still got the slip.’',
      },
      {
        flag: 'SB-33:key-log',
        text: 'He took the spring key log from this cage once. She has started a new one up here, in pencil on the back of a rota: who’s here, who’s warm.',
      },
      {
        flag: 'SB-33:folder',
        text: '‘Still got my R folder?’ He has, somewhere dry. ‘Good,’ she says. ‘Somebody should have been watching him.’',
      },
      {
        flag: 'DA-32:truth',
        text: '‘You gave it your name,’ Hollis says. The intercom carries both ways. ‘Brave or daft. I haven’t decided.’',
      },
      {
        flag: 'DA-32:show-evidence',
        text: '‘You argued it out of a wrong entry,’ Hollis says. ‘I’ve been trying to do that with auditors for thirty years.’',
      },
      {
        flag: 'entry:walt',
        text: 'Walt is already climbing the side of the cage to pass up the dry torch. ‘Evening, H.’ ‘Evening, W.’ That is the whole conversation, and it is enough.',
      },
      {
        flag: 'entry:alone',
        text: '‘On your own?’ Hollis says. ‘Daft.’ Then, gentler: ‘Thank you for coming.’',
      },
    ],
    choices: [
      {
        id: 'power-bank',
        label: 'Take the power bank Ines has kept dry in a sandwich bag',
        outcome:
          'Ines passes it down, unclaimed in lost property since 2023 and still holding charge. ‘We’ve got the safety light,’ Kwame says. ‘You’ve got the dark.’ Hollis writes it on a slip in his name and dates it, on top of a cage, in the sea.',
        gain: { battery: 2 },
        artSubject: `A young night staffer leaning down from the top of a flooded wire cage to pass a sandwich bag with a power bank inside to ${MORROW} reaching up from the water`,
      },
      {
        id: 'pencil-log',
        label: 'Ask for Hollis’s pencil count of tonight',
        outcome:
          'She tears it off and passes it down: a page in pencil, which holds, of who has been on this cage since ten past ten and when each last had tea. Three names. Not four. Not Rowan. ‘That’s the true count,’ she says. ‘Don’t let anything tell you it’s more.’',
        gain: { evidence: 2 },
        artSubject:
          'A grey-haired woman in a navy fleece leaning down from the top of a flooded cage to hand a torn sheet of pencilled paper to an outstretched wet hand, a thermos tucked under her arm',
      },
      {
        id: 'give-light',
        label: 'Leave them your phone torch and go on by feel',
        outcome:
          'He wraps the phone in a sandwich bag and Kwame catches it. Up there it is a second light and an hour less dark; down here he is blind. Hollis looks at the phone, then at him. ‘That’s a confession too,’ she says, ‘a better one.’',
        gain: { battery: -2, trust: 2 },
        requires: { battery: 1 },
        lockedHint: 'Needs torch charge',
        artSubject: `${MORROW} tossing a phone in a sandwich bag up to a night staffer on top of a flooded cage, its torch beam swinging across the ceiling, the water below going dark`,
      },
    ],
  },
  {
    id: 'DA-34',
    title: 'The Box That Floats',
    kind: 'secret',
    speaker: 'Morrow',
    opening:
      'Rowan’s box floats at the back of the cage, the marker on its end run and set again as IN. The lid is off. Under the sodden jumper and the dead phone the black notebook lies open on the water’s skin, and its last entry is still writing itself: ‘02:09. Somebody moved the second chair again. I’m going to stay awake tonight and ask them, politely, what they want with my’. The pen line, which used to trail off to nothing, is moving.',
    artSubject: `A cardboard archive box floating open in dark water inside a wire cage, a sodden jumper and a dead phone in it, a small black notebook lying open on the surface with a line of handwriting visibly extending itself across the page, ${MORROW} chest-deep reaching toward it`,
    echoes: [
      {
        flag: 'SB-34:answer',
        text: 'The ‘life.’ he wrote at the end of this sentence in spring has been washed off. His apology underneath is still there, alone, like a stone in a stream.',
      },
      {
        flag: 'SB-34:read',
        text: 'He read this notebook front to back in spring. He remembers it, which is how he knows which lines are new.',
      },
      {
        flag: 'SB-34:close',
        text: 'He left the sentence open in spring, as if Rowan might come back and finish it. Something else has come back instead.',
      },
      {
        flag: 'e04:3,3:care',
        text: 'Jun’s letter is still in his inside pocket, held back from the golden rain. Tonight it is pressing against him in time with the moving pen.',
      },
      {
        flag: 'e04:3,3:risk',
        text: 'Jun’s letter posted itself in the golden rain in Rowan’s voice: ‘I’ll call before spring.’ The moving line is in the same hand, making the same kind of promise.',
      },
      {
        flag: 'e03:3,3:risk',
        text: 'He once read a page in this hand that stopped at ‘I know sorry is late’. Down here, it seems, Rowan’s sentences don’t get to stay open.',
      },
      {
        flag: 'SB-35:return',
        text: 'This is the box Hollis sealed for him in spring, ‘Hold for owner’. The seal has run. It says ‘Hold’.',
      },
    ],
    choices: [
      {
        id: 'read',
        label: 'Read the notebook from the front before it changes',
        outcome:
          'Spring, a line a night, and the sea has been at all of it. ‘Slept 3h’ is ‘Slept’. ‘Didn’t ring Jun’ is ‘Rang Jun’. ‘The chair’ is ‘The chair is mine’. He reads until he can tell which lines are Rowan’s by how kind they are, and then he can’t bear to.',
        gain: { evidence: 2, danger: 1 },
        artSubject: `${MORROW} holding a small dripping notebook up out of the water close to his face, reading in the glow of a safety light through wire mesh, lines of handwriting glistening as if wet ink`,
      },
      {
        id: 'finish',
        label: 'Finish his sentence yourself, before the sea does',
        outcome:
          'He writes ‘life.’ fast, in the only hand he has, and the moving line stops against it like water against a wall. Underneath: ‘It was me. M.’ The ink holds. The sea has had to let one sentence end the way a person ended it.',
        gain: { trust: 1, danger: 1 },
        artSubject:
          'Close view of a hand pressing a biro to the last line of a wet notebook page floating on dark water, a moving trail of ink halted against a short new word',
      },
      {
        id: 'close',
        label: 'Put the lid on and lift the box out of the water',
        outcome:
          'He jams the lid down and gets the box up onto the fire safe, above the tide. Whatever the pen line was going to say, it will have to say it in the dark, to a jumper. Hollis watches him do it from the cage top and says nothing, which from her is a great deal.',
        gain: { danger: -1 },
        artSubject: `${MORROW} heaving a lidded, dripping archive box up onto a squat grey fire safe above the waterline, a grey-haired woman watching from the top of the cage`,
      },
    ],
  },
  {
    id: 'DA-35',
    title: 'The Drowned Desk',
    kind: 'climax',
    speaker: 'Morrow',
    opening:
      'The desk is under the sea. The lamp still burns below the surface, a gold pool at chest depth, and the second chair has drifted round to face him. The ledger lies open on the desk, dry, waiting. In the wall behind it is the old flood-gate wheel to the drainage channel that runs up toward the station. Hollis and her staff are cold on the cage top. Rowan’s box is in his arms. He can do one thing from here, and the sea is listening.',
    artSubject: `A plain institutional desk submerged in dark seawater, a bent-neck lamp still glowing gold beneath the surface, an office chair drifting to face the viewer, a large dry ledger open on the desk, a rusted iron wheel valve in the wall behind, ${MORROW} chest-deep holding a cardboard archive box`,
    echoes: [
      {
        flag: 'SB-35:return',
        text: 'In spring he sealed Rowan’s work for Rowan’s return. Carrying it out would keep that promise. The people on the cage were never part of it.',
      },
      {
        flag: 'SB-35:finish',
        text: 'In spring he finished the study under Rowan’s name and saved it in four places. Three are dry upstairs. What is in this box is the part he didn’t write: Rowan’s own nights.',
      },
      {
        flag: 'SB-35:confess',
        text: 'In spring he wrote the night of the trade for Mara and Dr Sen, and nobody believed it. The ledger would believe it. That is not the same thing as being believed.',
      },
      {
        flag: 'DA-32:truth',
        text: 'The ledger already has his name from Hollis’s door. Writing the rest would only tell the sea what the name has done.',
      },
      {
        flag: 'e04:2,1:care',
        text: 'Up that channel is the station, where Mara counted sixty-three people who are still on Platform 4 tonight.',
      },
      {
        flag: 'e04:2,1:risk',
        text: 'Up that channel is the station, where Mara is still counting sixty-one, with two names on a separate page.',
      },
      {
        flag: 'e03:8,8:risk',
        text: 'He spoke a working at the fountain once. If this sea is his, then the ledger is his too, and he would like to know what it means that it is asking.',
      },
      {
        flag: 'e03:8,8:care',
        text: 'He never spoke the working. Whosever sea this is, it has come to his desk to ask him.',
      },
      {
        flag: 'DA-33:give-light',
        text: 'His phone is up on the cage top with Kwame, its small beam the only thing down here pointing up.',
      },
    ],
    choices: [
      {
        id: 'salvage',
        label: 'Carry Rowan’s box up out of the flood',
        outcome:
          'He takes the back stair with the box on his shoulder and the sea at his heels for two flights. Rowan’s nights, the notebook, the photo, his life’s work: dry, all of it. The brigade’s pumps reach the cage four hours later. Hollis climbs down on her own, grey with cold. Ines has to be carried, and will be all right, and those four hours were Morrow’s choice.',
        gain: { evidence: 2, trust: -1, danger: 1 },
        artSubject: `${MORROW} climbing a concrete back stair with a dripping cardboard archive box on one shoulder, dark seawater lapping at the lower steps behind, a faint safety light far below`,
      },
      {
        id: 'rescue',
        label: 'Open the flood gate to drain the archive and free them',
        outcome:
          'He puts his whole weight on the wheel and it turns. The sea goes out of the archive in one long roar, up the old channel toward the station, taking the desk papers, the ledger’s loose pages and Rowan’s box with it. Hollis, Ines and Kwame climb down onto a wet floor. Somewhere above, the surge reaches the tide gate, and now the tide gate has to hold.',
        gain: { trust: 2, evidence: -2, danger: 1 },
        artSubject: `${MORROW} hauling on a rusted iron wheel valve as seawater rushes out through an opening in the wall, papers and a cardboard box swept along in the current, three people climbing down a wire cage behind`,
      },
      {
        id: 'testify',
        label:
          'Sit at the drowned desk and write the true account into the ledger',
        outcome:
          'He sits in Rowan’s chair, chest-deep, the lamp lighting his hands from below, and writes it plain: the desk, 02:14, the bargain, whose life, whose name. The ledger takes it and closes. The water lets go of everything at once and goes back down the sump, and everyone walks out. The record went with the sea. So did the fact of him. The sea knows Morrow’s name.',
        gain: { trust: 1, evidence: -1, danger: 2 },
        artSubject: `${MORROW} sitting chest-deep in an office chair at a submerged desk, writing in a large dry ledger lit from beneath by a lamp glowing under the water, the second chair turned to watch`,
      },
    ],
  },
  {
    id: 'DA-36',
    title: 'Up Out of the Water',
    kind: 'exit',
    speaker: 'Morrow',
    opening:
      'The back stair climbs four flights to the Annex stairwell. The water follows him up the first, step by step, then stops at the second landing as if at a line painted on the concrete. Above, the key log hangs on its chain, soaked, every name on it run but one. Morrow climbs the way Rowan never did this spring: in the night’s last hour, wet to the collar, carrying what he decided.',
    artSubject: `A narrow concrete fire stair spiralling upward, dark water standing still on the lower steps and stopping at a landing, a red emergency light above, a steel door at the top with a soaked clipboard on a chain, ${MORROW} climbing with one hand on the rail`,
    echoes: [
      {
        flag: 'DA-35:salvage',
        text: 'Rowan’s box is on his shoulder, wet only on the outside. Below him three people are waiting for pumps, and he can still hear Hollis keeping them talking.',
      },
      {
        flag: 'DA-35:rescue',
        text: 'Below him the archive is a drained, ruined floor, and Hollis, Ines and Kwame are climbing behind him. Somewhere up the channel the tide gate is taking the weight he sent it.',
      },
      {
        flag: 'DA-35:testify',
        text: 'Everyone climbs with him, Hollis last, counting heads. The ledger has gone down with the sea and his account inside it. Every drip on the stair sounds like two syllables. He knows which two.',
      },
      {
        flag: 'entry:walt',
        text: 'Walt climbs a step behind with the wet rope coiled over his shoulder, and holds the pen out at the top before Morrow can reach for it.',
      },
      {
        flag: 'entry:alone',
        text: 'He came down alone. Going up, he finds he is listening for footsteps behind him, and is not sure whose he would like them to be.',
      },
    ],
    choices: [
      {
        id: 'climb',
        label: 'Climb toward the Annex',
        outcome:
          'At the top he takes the pen on its string and signs himself out of Sublevel B. The ink runs at once, as everything has tonight, and sets again in the same hand. He doesn’t look at what it says. He pushes the bar and steps out into the stairwell, where a red emergency light is on and the floor, for the first time in hours, is dry.',
        artSubject: `${MORROW} writing on a soaked clipboard chained beside a steel door, the ink on the page running, the door pushed half open onto a dry stairwell under a red emergency light`,
      },
    ],
  },
]
