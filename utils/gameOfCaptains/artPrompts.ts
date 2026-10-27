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
}

/** The Krea 2 prompt for an asset key, or undefined when none is authored. */
export const warpArtPrompt = (key: string): string | undefined =>
  WARP_ART_PROMPTS[key]
