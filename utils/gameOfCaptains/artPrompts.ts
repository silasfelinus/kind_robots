// Krea 2 prompts for every Space Couch picture slot, keyed by the asset key the
// play page and the Playbook Studio adapter share (artSlots.ts). Krea 2 paints
// the nouns it is given, so each prompt names only what is visible: who, where,
// doing what, under which light, from which camera. Recurring people reuse one
// fixed description from CAST_LOOKS so a face stays the same across pictures.
//
// Sources: conductor projects/game-of-captains/content/CHARACTER-VOICE-ATLAS.md
// (the approved 2026-10-26 captain identities and crew props, which supersede
// the older captain looks), CAST-BIBLE.md (crew silhouettes) and
// GALAXY-AND-NEMESIS-BIBLE.md (systems and nemesis looks). Body plans the
// bibles leave open come from the rendered crew portraits
// (art/CREW-PORTRAITS-ROUND-1.yaml).

import type { CaptainId, CrewId } from './rules'

/** The ship. Every exterior shot uses this exact phrase. */
export const COUCH_LOOK =
  'a very long scarlet velvet couch with rolled armrests, deep button-tufted cushions and four short brass feet, floating inside a thin clear bubble with a faint pale-blue rim'

const cap = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)
const Couch = cap(COUCH_LOOK)
const RIDERS = 'four small seated travelers seen from behind'
const STYLE =
  'Gouache illustration with brown ink outlines, warm muted colors and solid shadows.'

export const CAPTAIN_LOOKS: Record<CaptainId, string> = {
  fluke:
    'a rumpled middle-aged man with wild grey hair and stubble, a patched teal dress coat with a brass cuff on one wrist, shoes of two different colors, and a brass pocket watch with thirteen hands hanging from a chain',
  vale: 'a wiry young adult woman with asymmetric hair dyed electric green and pink and shaved on one side, a black leather jacket covered in sewn patches, and a heavy brass soldering gauntlet on her right hand',
  solace:
    'a tired Black adult with close-cropped hair and dark circles under the eyes, grey janitor coveralls with a hand-sewn gold captain patch, holding a mop and three folded laminated maps',
  rex: 'a broad older man with a square jaw and a silver pompadour, a crimson hero uniform with oversized gold medals pinned on the right side, and a long gold cape blown sideways by a small chrome desk fan at his feet',
  quill:
    'a tall pale man with slicked black hair in a matte black sealed bodysuit with a clear collar ring, holding a dented silver hip flask with a thin drinking tube',
  ro: 'a slender brown-skinned adult with a tall swept black coiffure, a black velvet suit, antique silver rings and a jet brooch, holding a gilt-edged envelope, with low white stage fog around the ankles',
}

export const CREW_LOOKS: Record<CrewId, string> = {
  pell: 'a short stocky red-skinned man with a shaved scalp, dark freckles and one steel prosthetic forearm, in oil-stained grey coveralls, with a palm-sized brass wind-up beetle on his shoulder',
  vela: 'a broad lilac-skinned alien woman with small pointed ears, a sea-green surgical mantle printed with coral patterns, and a small brass hand bell on her belt',
  tess: 'a lean East Asian woman with straight shoulder-length black hair, silver goggles pushed up on her forehead, and a navy bomber jacket embroidered with star maps',
  rue: 'a tall dark-brown-skinned adult with long silver braids and thin angular glasses, a tan wrap robe with a lopsided collar sewn with paper slips, holding a small wooden gavel',
  mox: 'a slim silver android with transparent chest plates over blue wiring, one round eye with a blue lid and one with an orange lid, and a white pin badge on the chest',
  jex: 'a golden-skinned alien man with wavy dark hair and small pointed lower ears, a turquoise vest over an indigo shirt, carrying a polished wooden string instrument',
  sora: 'a tall grey-violet alien woman with six jointed arms in three pairs, large dark eyes and a smooth oval head, in charcoal overalls with orange geometric patches',
  kivo: 'a small slim alien with dusty blue skin, a crest of short pale teal feathers, long thin wrists in grey pressure sleeves, and an amber-and-grey scout jacket',
  taal: 'an amphibious alien man with ivory-white segmented shell plates, a broad smooth face, black oval eyes and webbed fingers, in a navy envoy coat with a pale-blue shawl',
  brin: 'a tall green-skinned mycelial woman with hair of soft fern fronds, small pink mushrooms growing at her shoulders, a leafy living respirator at her neck and an olive field jacket',
  omi: 'a small faceted slate-grey stone being with a tapered crystal head, two amber eyes, a round brass resonator set in the chest and six small brass bells on clipped ribbons',
  fen: 'a broad-shouldered man with deep tan skin, short black hair and a thin scar under the right eyebrow, in a plain navy jacket and heavy scuffed black guard boots',
}

/** Recurring galaxy residents outside the playable roster. */
export const RESIDENT_LOOKS = {
  vox: 'Barkeep Vox, a stout humanoid tardigrade with a plump wrinkled grey-beige segmented body, a round snout, small black eyes and stubby clawed hands, wearing a brown leather apron',
  auditor:
    'a very tall paper-thin bureaucrat in rust-orange office armor, with three brass rotary stamp wheels orbiting the shoulders and a fan of paper slips trailing behind',
  moth: 'an elderly many-limbed performer in a long dusty purple cloak, a dozen translucent ceramic masks hanging from a wide belt',
  curdle:
    'a fussy physician sealed inside a round yellow sterile suit with a clear face window, three spotless chrome mechanical arms, and a large condiment dispenser strapped to the back',
  showrunner:
    'a floating ring of twelve rectangular black studio cameras around a glowing red lamp, with brass loudspeaker horns hanging below the ring',
  regent:
    'a gaunt older ruler in stiff black ceremonial robes, a small brass orrery of rotating suns mounted on a harness over the shoulders, holding a thick brass-bound ledger',
  brassChoir:
    'slender bell-metal machines with long trumpet-shaped brass mouths set off to one side and leather sashes holding small bound rulebooks',
  chancellor:
    'an elegant executive in a charcoal pinstriped suit with dozens of small embroidered clock hands on the sleeves, carrying a gilded tabletop clock',
  swarm:
    'hundreds of tiny translucent pale-gold beings with visible little faces, nesting in long knitted scarves and glass lanterns',
} as const

const portrait = (look: string, setting: string) =>
  `Full-body portrait of ${look}. ${setting} Eye-level three-quarter camera, the face and both eyes fully visible, warm amber lamp light from the left. ${STYLE}`

const CAPTAIN_SETTINGS: Record<CaptainId, string> = {
  fluke:
    'He stands beside one rolled armrest of a long scarlet velvet couch, frowning at the pocket watch while a second identical copy of him waits two steps behind.',
  vale: 'She sits on the back of a long scarlet velvet couch, soldering a small copper gadget, with a pile of confiscated gadgets beside her boots.',
  solace:
    'They stand guard at the end of a long scarlet velvet couch, back to the cushions, looking over one shoulder toward a dark doorway.',
  rex: 'He poses on the cushion of a long scarlet velvet couch with one boot raised and fists on his hips, his eyes glancing sideways.',
  quill:
    'He sits very upright at the end of a long scarlet velvet couch, raising the flask in a formal toast, gloved hands steady.',
  ro: 'They lounge across a long scarlet velvet couch beside a silver candelabra, one hand lifted in greeting.',
}

const CREW_SETTINGS: Record<CrewId, string> = {
  pell: 'He tightens a bolt on the brass foot of a long scarlet velvet couch while the beetle holds a confiscated wrench in its jaws.',
  vela: 'She kneels beside a patient on a long scarlet velvet couch, holding the bell up and waiting for an answer.',
  tess: 'She leans on a rolled armrest of a long scarlet velvet couch, holding a transparent navigation disk with six green dots.',
  rue: 'They stand behind a long scarlet velvet couch, reading a folded treaty held at arm’s length.',
  mox: 'It sits on the cushion of a long scarlet velvet couch, hands folded, looking at a small paper birthday crown in its lap.',
  jex: 'He sits on the armrest of a long scarlet velvet couch beside a travel case painted with two different striped flags.',
  sora: 'She repairs a copper coupling at the back of a long scarlet velvet couch, using four hands at once while two hands hold a clipboard.',
  kivo: 'They crouch on a long scarlet velvet couch with one thin wrist raised, a round brass pressure compass in the other hand.',
  taal: 'He stands beside a long scarlet velvet couch holding a frosted rectangular voting slate, pale cold mist rising from his shoulders.',
  brin: 'She tends a basket of green vines growing out of the back of a long scarlet velvet couch.',
  omi: 'It stands on the cushion of a long scarlet velvet couch, holding a long thin tuning rod against one bell.',
  fen: 'He stands at the end of a long scarlet velvet couch, holding a folded civilian corridor map and an old white travel pass.',
}

const MISSION_PROMPTS: Record<string, string> = {
  refugees: `Wide shot in deep space beside a hollowed grey asteroid. Two battered refugee transport ships float side by side, tethered to one boxy life-support unit with a single green lamp. Hand-painted quilts are tied to their cargo rails and children wave from the round windows. To the left, ${COUCH_LOOK}, carries ${RIDERS}. A customs official in a grey greatcoat stands on a small floating platform between the ships, holding up a clipboard. Cold white starlight from the left, orange lamp glow from the windows. ${STYLE}`,
  archive: `Wide shot of a tidally locked planet where the cliffs are carved into endless tiers of bookshelves. A huge white solar flare rises over the horizon and lights the upper shelves orange. Readers in brown robes sit on stone ledges with open books. A giant stone face with closed eyes is carved into the central cliff between the shelves. On a ledge in the foreground, ${COUCH_LOOK}, is parked with ${RIDERS}. ${STYLE}`,
  bar: `Medium-wide interior of a round space station bar with pink walls that glow softly, brass stools and a long curved wooden counter. Behind the counter stands ${RESIDENT_LOOKS.vox}, polishing a tall glass. In the far corner one small table and its hooded patron sit upside down on the ceiling, the patron calmly holding a drink. Through a large round window, ${COUCH_LOOK}, waits outside among the stars. Pink and amber light from the walls. ${STYLE}`,
  ashdock: `Night view of a huge industrial docking lattice of steel girders under orange arc lamps. A yellow automated crane holds a horizontal bar with six empty grey pressure suits hanging from hooks, and a brass punch-clock is bolted to the crane arm. Dockworkers in quilted jackets and aprons watch from a catwalk, holding steaming bowls from a union kitchen. Beside the lattice floats ${COUCH_LOOK}, with ${RIDERS}. ${STYLE}`,
  windglass: `Wide shot of a small moon with a thin pale atmosphere and ribbed dunes of glassy green sand under a violet twilight sky. ${Couch}, glides low over the dunes with ${RIDERS}. Close behind it, a striped red-and-white navigation buoy walks on four long metal legs, its lamp turned toward the couch, leaving footprints in the glass sand. Two gas giants hang low on the horizon. ${STYLE}`,
  nacre: `Interior of a vast debating chamber cut into white ice, with curved terraces of seated delegates in thick fur-lined coats. Glowing orange heat trails run across the frozen floor from each delegate's seat to a central brass collecting bowl. In a wall alcove at the back, a group of residents in work clothes stand pressed against a large brass thermostat dial, raising their hands. Through a tall ice window, ${COUCH_LOOK}, hovers outside. Cold blue daylight from the window. ${STYLE}`,
  haleth: `Underwater view of a glass dome clinic anchored to giant arches of pale calcified reef. Inside the dome, patients in white gowns queue at a chrome counter where a clerk in a tight grey suit operates a large brass cash register. Outside the glass, half of the reef is pink and alive, and half is wrapped in grey oxygen pipes. ${Couch}, rests on the sandy seabed beside the dome. Green filtered sunlight from above. ${STYLE}`,
  gameworld: `Wide shot of a planet whose surface is rebuilt into twelve enormous floating stone platforms stacked above one another, lit by stadium floodlights and joined by transparent ladders. Nurses and orderlies in hospital scrubs stand on the third platform in matching contestant sashes. Above them hovers ${RESIDENT_LOOKS.showrunner}. ${Couch}, is moored at a gilded audience railing. Hard white floodlight and red lamp glow. ${STYLE}`,
  rootborne: `Floating green islands of earth hang in a pale sky, covered in orchards of round fruit trees that breathe out faint visible mist. Tall grey metal filter towers have been installed between the trees. A villager in a straw hat holds out a sapling in a clay pot toward ${COUCH_LOOK}, which hovers at the island's edge with ${RIDERS}. Soft morning light from the right. ${STYLE}`,
  'concord-intake': `Interior of a vast pale marble immigration hall built in tiers around a giant brass treaty engine of gears and pistons. Rows of residents in work clothes stand on tall wooden warehouse shelves, each with a brown paper inventory tag tied to the wrist. At a high wooden desk a tired clerk in a grey cardigan, wearing the same wrist tag, holds out a long form. ${Couch}, is parked on the marble floor in front of the desk with ${RIDERS}. Dusty shafts of daylight from high windows. ${STYLE}`,
  'courtesy-reactor': `Wide shot of two blue-green planets close together in space, joined by a long glass rail tube. In the middle of the rail sits a cracked round reactor glowing weak orange. At each end of the rail a crowd of robed parliamentarians stands on a balcony watching through opera glasses. ${Couch}, hovers beside the reactor while two mechanics in overalls hold wrenches to opposite halves of it at the same moment. ${STYLE}`,
  'sesh-backups': `Interior of a huge disused orbital factory with rusted assembly arms and cold white work lights. Hundreds of identical small boxy robots with single green lamp eyes stand in a long orderly queue to an open airlock, each holding a small brown suitcase. A man in a slim navy suit holds a tablet at the head of the queue. Through the airlock, ${COUCH_LOOK}, waits in space with ${RIDERS}. ${STYLE}`,
  'serendipity-tab': `Medium-wide interior of a round space station bar with walls glowing amber, brass stools and a long curved wooden counter. ${RESIDENT_LOOKS.vox}, unrolls a very long paper bill that spills over the counter and across the floor. At the end of the counter a woman in a plain grey collections uniform slips coins into a tip jar. In a corner booth a refugee family in patched travel coats shares one bowl of soup. Through a round window, ${COUCH_LOOK}, waits among the stars. ${STYLE}`,
  'insult-compiler': `A wedding on a narrow stone bridge in space between two blue-green planets, decorated with white flowers. Two crowds of guests in formal robes sit on folding chairs on either side of the aisle. At the altar two parliamentary speakers in heavy ceremonial robes hold hands stiffly. ${Couch}, is parked beside the altar, and on its left armrest sits a small brass translator box with a speaker grille, wearing a flower crown. Warm sunset light from the side. ${STYLE}`,
  warranty: `Interior of a cramped repair counter in an industrial dockyard under harsh fluorescent tubes. Behind the counter a chrome kiosk with a round screen shows a smiling cartoon face. ${Couch}, with one cushion seam split open and stuffing showing, waits at the front of the line. Behind it a line of dockworkers in grey pressure suits with patched elbows stretches out of the door and around a steel girder, several holding old telephone handsets to their helmets. ${STYLE}`,
  hoa: `Wide shot of a small moon with glassy green dunes and a cluster of mismatched homemade domes and huts hung with colorful lamps, under a violet twilight sky. A man in a beige cardigan and slacks measures a hut roof with a tape measure, a stack of beige paint cans at his feet. A red-and-white striped buoy on four long metal legs stands watching beside the huts. ${Couch}, rests on the dunes nearby with ${RIDERS}. ${STYLE}`,
  'season-two': `Interior of a gaudy courtroom set on a floating stone platform with gold columns and stadium floodlights. Contestants in hospital scrubs sit in a row of glass booths, each holding a pen over a long form while stagehands in black hold their elbows. Above hangs ${RESIDENT_LOOKS.showrunner}. A packed audience in strapped seats claps. ${Couch}, sits in a velvet guest box at the side with ${RIDERS}. ${STYLE}`,
  'committee-end': `Wide shot of a swollen red star filling half the sky beside a hollowed grey asteroid. Inside a lit conference room built into the asteroid, eight people in suits sit around a long table covered with paper agendas and water jugs. Outside the window two old refugee transport hulls wait in the red light, one tethered by a glowing cable to ${COUCH_LOOK}. Red light from the star over everything. ${STYLE}`,
  'gig-orchard': `Floating green islands of earth covered in orchards of round fruit trees. Couriers in bright orange caps and jackets ride small hover scooters between the trees, each carrying a crate of glass jars filled with pale mist. A grower in a straw hat holds up a phone screen showing four gold stars. ${Couch}, hovers at the island edge with ${RIDERS}. Clear morning light from the right. ${STYLE}`,
  overdue: `Wide shot of cliffs carved into endless tiers of bookshelves on a tidally locked planet. Workers in grey collections uniforms carry crates of books and loaves of bread down long ladders and stack them on a hovering cargo barge. A giant stone face with closed eyes is carved into the central cliff. ${Couch}, is parked on a ledge in the foreground with ${RIDERS}. Low orange light from the horizon. ${STYLE}`,
  merger: `Interior of a vast debating chamber cut into white ice, with curved terraces of delegates in fur-lined coats. At the front a team of consultants in identical dark suits stands at a glass lectern beside a large screen showing a bar chart with upward arrows. In a wall alcove at the back, residents in work coats raise their hands beside a large brass thermostat dial. Through a tall ice window, ${COUCH_LOOK}, hovers outside. Cold blue daylight. ${STYLE}`,
  'jump-gate-permit': `Interior of a dim stone basement under a government building, lit by one bare bulb. A clerk in a grey cardigan pins a long paper notice to a cork board beside a locked iron door. Through a small high window, a giant ring-shaped stone jump gate glows violet in the sky outside, and ${COUCH_LOOK}, hovers in front of it with ${RIDERS}. ${STYLE}`,
  'serendipity-last-call': `Medium-wide interior of a round space station bar packed wall to wall with refugees of many species in travel coats, some sitting on the counter and some standing on the ceiling. The walls glow strained white. ${cap(RESIDENT_LOOKS.vox)}, stands behind the counter holding a closed ledger. Through the round window, ${COUCH_LOOK}, waits outside with a small folding room opened out behind its backrest. ${STYLE}`,
  'gameworld-finale': `Low-angle view up a tower of twelve stacked floating stone platforms lit by stadium floodlights. On the highest platform a small group of contestants in hospital scrubs holds up a long sheet of paper covered in signatures. ${cap(RESIDENT_LOOKS.showrunner)}, hangs above them with its red lamp blazing. ${Couch}, climbs past the middle platforms with ${RIDERS}. ${STYLE}`,
  'cushion-recall': `Wide shot of an industrial dock at noon under steel girders and orange cranes. ${Couch}, sits on a conveyor belt that leads toward a large grey shredding machine. A crowd of dockworkers in quilted jackets and pressure suits stands around the belt eating lunch from tin boxes, looking at the couch. A foreman holds a clipboard. Hazy daylight. ${STYLE}`,
  'twins-summit': `Interior of a long glass rail tube in space between two blue-green planets. Hundreds of delegates of many species in formal robes stand along the tube holding folded chairs. In the middle, ${COUCH_LOOK}, sits empty under a hanging lamp, its four cushions plumped and waiting. Planet light from both ends of the tube. ${STYLE}`,
  'foundry-strike': `Interior of a huge disused orbital factory. A picket line of small boxy robots with single green lamp eyes, a chrome kiosk with a smiling screen face and a round reactor on wheels stand in a row with their arms folded. In the foreground, ${COUCH_LOOK}, hovers with ${RIDERS}, and a folded handwritten letter rests on its armrest. Cold white work lights. ${STYLE}`,
  inquiry: `Interior of a plain public hall carved inside a grey asteroid, with rows of folding chairs filled with witnesses of many species wearing paper name tags. At a long table on a low stage sits an older woman in a pilot's jacket with reading glasses and a thick bound logbook. A single empty chair faces the table. Through a round window, ${COUCH_LOOK}, waits outside. Flat white overhead light. ${STYLE}`,
  'windglass-exodus': `Wide shot of a small moon with glassy green dunes at dawn. A long line of families in travel coats carries bundles and lamps toward a waiting row of small homemade spaceships. A red-and-white striped buoy on four metal legs walks beside them with a backpack strapped on. In the foreground a woman hands a small sealed tin box up to ${COUCH_LOOK}, which hovers low with ${RIDERS}. Pale pink dawn light. ${STYLE}`,
  'deposit-copy': `Wide shot of cliffs carved into tiers of bookshelves on a tidally locked planet at sunset. On a stone ledge in front of a giant carved stone face with closed eyes, a librarian in a brown robe holds two books: a thick gold-bound volume and a thin hand-stitched notebook. ${Couch}, is parked on the ledge beside her with ${RIDERS}. Low orange light from the horizon. ${STYLE}`,
}

const ANTAGONIST_PROMPTS: Record<string, string> = {
  auditor: `Medium shot in open space beside ${COUCH_LOOK}. ${cap(RESIDENT_LOOKS.auditor)}, leans over the cushions with a long brass tape measure stretched between two armrests, writing figures on a clipboard. A small brass meter with a dial is clipped to the bubble wall. Cold blue starlight from above, orange glow from the stamp wheels. ${STYLE}`,
  moth: `Medium shot on a dim theater stage with dusty red curtains. ${cap(RESIDENT_LOOKS.moth)}, holds four of the masks out at arm's length toward the viewer, one in each of four hands. Each mask has a different human face. A single spotlight from above, purple shadows at the edges. ${STYLE}`,
  curdle: `Medium-wide shot of a dusty village square. ${cap(RESIDENT_LOOKS.curdle)}, stands beside a tall white food dispenser machine that wears a red mayor's sash and a chain of office. Villagers in patched clothes hold empty bowls under its single chrome spout. Flat noon sunlight, pale yellow sky. ${STYLE}`,
  showrunner: `Low-angle shot from a polished black studio floor looking up at ${RESIDENT_LOOKS.showrunner}, hanging above twelve stacked stone platforms. Rows of audience seats curve around the platforms, filled with spectators gripping armrests. Hard white floodlight from above, red glow from the central lamp. ${STYLE}`,
  regent: `Medium shot beside ${COUCH_LOOK}, floating near a dim orange star. ${cap(RESIDENT_LOOKS.regent)}, stands on a black stone platform and places a separate folded ballot on each cushion of the couch, one by one. Orange starlight from the right, deep shadow on the left. ${STYLE}`,
  'brass-choir': `Medium-wide shot of a procession of ${RESIDENT_LOOKS.brassChoir}, filing past ${COUCH_LOOK}. The lead machine holds a fanned paint swatch of thirty shades of red against the couch's velvet. Polished brass reflections, soft white light from above. ${STYLE}`,
  chancellor: `Medium shot in a wood-paneled boardroom. ${cap(RESIDENT_LOOKS.chancellor)}, sets the clock on a long mahogany table and holds out a mended white teacup. Across the table a startled woman lifts both hands, each with an extra thumb. Warm lamp light, long shadows. ${STYLE}`,
  'kindly-swarm': `Close-up beside ${COUCH_LOOK}. ${cap(RESIDENT_LOOKS.swarm)}, drift along the outside of the bubble wall, pressing their small smiling faces against it and holding up a knitted scarf toward the cushions. Warm gold light from the lanterns, black space behind. ${STYLE}`,
}

const ENDING_PROMPTS: Record<string, string> = {
  'captain-of-the-open-horizon': `Medium shot inside a round space station bar with softly glowing pink walls. ${cap(RESIDENT_LOOKS.vox)}, sets a full glass of blue drink on a polished counter in front of one empty brass stool. Through the round window behind him, ${COUCH_LOOK}, approaches with ${RIDERS}, and a line of small rescue boats follows it. Pink and amber light. ${STYLE}`,
  'the-last-ship-home': `Wide shot of ${COUCH_LOOK}, crowded with bandaged refugee families sitting on the cushions, the armrests and the back, arriving at a harbor of warm lights on a dark moon. One cushion is missing and a blanket is tucked in the gap. The bubble rim is patched with tape. Warm harbor light from below, stars above. ${STYLE}`,
  'the-galactic-bargain': `Wide shot of a ring-shaped stone jump gate in deep space. A long folding table floats in front of it beside ${COUCH_LOOK}. A tall figure in a grey cloak and a crew officer in a navy coat sign the same long scroll from opposite ends of the table, each holding a pen. Cold violet light from inside the gate ring. ${STYLE}`,
  'the-cost-of-command': `Medium shot in a quiet grey hangar. ${Couch}, sits on the floor with one cushion slashed open and stuffing spilling out. A folded captain's coat lies on the middle cushion beside an open handwritten logbook, and three crew members stand around the couch with their heads bowed. A single overhead lamp, cool blue shadows. ${STYLE}`,
}

/** A nemesis's own three endings (nemesisEndings.ts), keyed `<nemesis>-<variant>`. */
const NEMESIS_ENDING_PROMPTS: Record<string, string> = {
  'auditor-undone': `Medium shot in a high-ceilinged bank hall with brass teller windows and tall arched windows. ${cap(RESIDENT_LOOKS.auditor)}, sits behind a teller window stamping a tall stack of folders for a queue of bankers in grey suits. In the background a family in patched coats walks out through the open main doors into daylight. Warm afternoon light. ${STYLE}`,
  'auditor-bargained': `Wide shot of a rescue route in deep space marked by a line of small blinking beacons, with lifeboats passing between them. ${cap(RESIDENT_LOOKS.auditor)}, floats beside the route and hands each passing lifeboat a thick bound repayment book. Far behind, ${COUCH_LOOK}, watches. Cold blue starlight. ${STYLE}`,
  'auditor-unfinished': `Interior of a cramped refugee lifeboat cabin with two rows of worn bench seats. ${cap(RESIDENT_LOOKS.auditor)}, kneels in the aisle with a brass tape measure stretched between the benches while a family sits pressed together on the back bench, watching. Dim green cabin lamps. ${STYLE}`,
  'moth-undone': `Interior of a white public gallery where dozens of translucent ceramic masks hang in neat rows on the walls, each above a small brass plate. Visitors of many species lift their own masks down and hold them. At the end of the room ${RESIDENT_LOOKS.moth}, wears one plain mask slightly crooked. Soft daylight from skylights. ${STYLE}`,
  'moth-bargained': `A small kiosk on a busy space station concourse. ${cap(RESIDENT_LOOKS.moth)}, sits behind the counter handing a blank white ceramic mask to each traveler in a long queue of people carrying luggage. Warm station lights, a crowd passing behind. ${STYLE}`,
  'moth-unfinished': `Night view of a crowded station platform under blue lamps. ${cap(RESIDENT_LOOKS.moth)}, walks away into the crowd. In the foreground a young courier in a flight jacket stands still, holding an empty travel pass and staring after her. Blue platform light, long shadows. ${STYLE}`,
  'curdle-undone': `A busy village kitchen with long wooden tables and many steaming pots. Cooks in aprons ladle three different stews into bowls beneath a white food dispenser machine that has a vase of flowers on top. ${cap(RESIDENT_LOOKS.curdle)}, sits at the end of a bench holding out an empty bowl for a second serving. Warm lamplight. ${STYLE}`,
  'curdle-bargained': `A long clean white cafeteria where a queue of people of many species receive identical beige bowls from a row of chrome dispensers. A brass clock hangs on the wall. ${cap(RESIDENT_LOOKS.curdle)}, watches the queue with a clipboard in one chrome hand. Flat white light. ${STYLE}`,
  'curdle-unfinished': `Wide shot of a stone plaza at the foot of a ring-shaped jump gate in space. A tall white food dispenser machine wearing a red mayor's sash raises one chrome arm over a crowd holding empty bowls. ${cap(RESIDENT_LOOKS.curdle)}, claps beside it. Violet light from the gate. ${STYLE}`,
  'showrunner-undone': `Wide shot of twelve stacked floating stone platforms in clear morning daylight, the stadium floodlights switched off. Nurses and orderlies in hospital scrubs climb down the transparent ladders to the grass below, carrying their folded sashes. Above them the ring of twelve black studio cameras hangs dark, its red lamp unlit. ${STYLE}`,
  'showrunner-bargained': `Interior of a bright television studio with gold columns. ${Couch}, sits at center stage under a spotlight, with a chrome microphone on a stand beside one armrest. A row of contestants in hospital scrubs sits in chairs to the side; some smile at the cameras and some look toward the exit. ${cap(RESIDENT_LOOKS.showrunner)}, hangs above. ${STYLE}`,
  'showrunner-unfinished': `Wide shot of a green planet in space being wrapped in steel scaffolding and stadium floodlights by small construction drones. In front of it hovers ${RESIDENT_LOOKS.showrunner}. In the lower corner, ${COUCH_LOOK}, drifts past, small. Hard white floodlight. ${STYLE}`,
  'regent-undone': `Wide shot of a planet ringed by large silver shield panels holding back a violent orange solar storm. On a hill below, a council of townspeople of many species sits at a long outdoor table, voting with raised hands. At the edge of the hill a black ceremonial crown rests on an empty stone throne. Orange storm light. ${STYLE}`,
  'regent-bargained': `Interior of a stone council chamber. ${cap(RESIDENT_LOOKS.regent)}, stands at a lectern holding a long lease contract while delegates of many species raise green and red voting paddles from curved benches. Cool daylight from tall windows. ${STYLE}`,
  'regent-unfinished': `Wide shot of a calm violet sky after a storm, with several small planets each enclosed in a black dome shelter. On a stone balcony ${RESIDENT_LOOKS.regent}, watches as a footman places a sealed envelope with red wax on each cushion of ${COUCH_LOOK}, parked below. ${STYLE}`,
  'brass-choir-undone': `A stone amphitheater at golden evening. A procession of ${RESIDENT_LOOKS.brassChoir}, has halted on the stage. Three of the machines face the others with their brass mouths wide open and tilted at odd angles, while the rest hold their rulebooks shut. Townspeople listen from the stone steps. ${STYLE}`,
  'brass-choir-bargained': `Interior of a quiet archive hall with tall shelves of brass cylinders. One of the ${RESIDENT_LOOKS.brassChoir}, holds out a thin bound rulebook to a line of musicians carrying drums, flutes and string instruments. Most of the musicians walk past it. Soft white light. ${STYLE}`,
  'brass-choir-unfinished': `Wide shot of a starfield filled with small distress beacons, every one glowing the same pale grey. ${cap(RESIDENT_LOOKS.brassChoir)}, float among them and slot the beacons into tidy rows of brass drawers. Far off, ${COUCH_LOOK}, drifts past. ${STYLE}`,
  'chancellor-undone': `Interior of a public hall where townspeople sit in rows watching a wall of old film projectors play flickering home footage. In the front row ${RESIDENT_LOOKS.chancellor}, sits with the gilded clock in his lap, its hands stopped. Warm projector light, dark room. ${STYLE}`,
  'chancellor-bargained': `A small repair stall at a crowded space market. ${cap(RESIDENT_LOOKS.chancellor)}, sets the gilded clock on the counter and hands a mended teacup back to a customer. Behind the stall a queue of people holds broken cups and plates. Afternoon light through a canvas awning. ${STYLE}`,
  'chancellor-unfinished': `Close-up of a captain's logbook lying open on the red velvet cushion of a long couch, its pages blank and freshly white, the ink at one corner fading away. A small gilded tabletop clock stands beside it with its hands spinning. Soft lamp light. ${STYLE}`,
  'kindly-swarm-undone': `A grassy meadow at dusk. Hundreds of tiny translucent pale-gold beings with little faces drift out of a long knitted scarf strung between two posts. Some fly off alone carrying tiny lanterns, and others stay wrapped in the scarf and wave. Warm lantern light, deep blue sky. ${STYLE}`,
  'kindly-swarm-bargained': `Interior of a cozy communal hall with a long knitted scarf strung along the ceiling, glowing with tiny translucent pale-gold beings. Below, people of many species sit at separate small tables; some have a strand of the scarf over their shoulders and some sit apart reading. Warm amber light. ${STYLE}`,
  'kindly-swarm-unfinished': `Close-up of the outside of the clear bubble around ${COUCH_LOOK}. A crowd of tiny translucent pale-gold beings in knitted scarves presses against the bubble wall, their small faces all wearing the same smile. Black space behind, gold glow. ${STYLE}`,
}

/** Every authored prompt, keyed by asset key under public/game-of-captains. */
export const WARP_ART_PROMPTS: Readonly<Record<string, string>> = {
  ...Object.fromEntries(
    (Object.keys(CAPTAIN_LOOKS) as CaptainId[]).map((id) => [
      `portraits/captain-${id}`,
      portrait(CAPTAIN_LOOKS[id], CAPTAIN_SETTINGS[id]),
    ]),
  ),
  ...Object.fromEntries(
    (Object.keys(CREW_LOOKS) as CrewId[]).map((id) => [
      `portraits/crew-${id}`,
      portrait(CREW_LOOKS[id], CREW_SETTINGS[id]),
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(MISSION_PROMPTS).map(([id, p]) => [`missions/${id}`, p]),
  ),
  ...Object.fromEntries(
    Object.entries(ANTAGONIST_PROMPTS).map(([id, p]) => [
      `antagonists/${id}`,
      p,
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(ENDING_PROMPTS).map(([slug, p]) => [`endings/${slug}`, p]),
  ),
  ...Object.fromEntries(
    Object.entries(NEMESIS_ENDING_PROMPTS).map(([id, p]) => [
      `endings/${id}`,
      p,
    ]),
  ),
}

/** The Krea 2 prompt for an asset key, or undefined when none is authored. */
export const warpArtPrompt = (key: string): string | undefined =>
  WARP_ART_PROMPTS[key]
