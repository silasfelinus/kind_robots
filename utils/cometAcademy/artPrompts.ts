import { CAST_LOOKS, DEAN_LOOK, TEAM_LOOKS, castLook } from './castLooks'
import { IDENTITY_ARCS } from './identityArcs'
import { EXPANDED_MISSIONS } from './expandedNightCases'

// Krea 2 prompts for every Capes & Tassels picture slot still waiting for a
// render, keyed by the asset key in artSlots.ts. Each names only what is
// visible: who (from castLooks.ts, word for word), where, doing what, the
// light and the camera. Ported from the conductor runtime-beat and mastermind
// ledgers (projects/comet-city-academy/art) where one existed, then rewritten
// to drop similes, negations and format words.

const MEDIUM =
  'Hand-painted comic illustration with bold ink outlines and saturated gouache color.'

const paint = (text: string) =>
  `${text} ${MEDIUM}`.replace(
    /(^|\. )([a-z])/g,
    (_, gap, letter) => `${gap}${letter.toUpperCase()}`,
  )
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** A rookie's first context splash. The other two show the same person in different roles. */
const IDENTITY_MOMENTS: Record<string, string> = {
  'accident-fire':
    'He stands in an academy workshop holding both mitted hands away from a nervous younger classmate, orange welding sparks flying from a broken drone on the steel table. Orange light glows from his hands against cool blue window light. Medium-full shot at eye level.',
  'accident-air':
    'She hovers a hand above the flagstones of the academy courtyard with her knees pulled up, gripping a stair rail, while classmates walk past on the ground below her. Bright overcast daylight, wind tugging at her hair. Low-angle medium-full shot.',
  'accident-earth':
    'He sits on a bench in the academy locker room pressing one stone-grey palm flat against a cracked concrete wall, a crumpled transit authority letter in his other fist. Cold fluorescent light from above. Medium shot.',
  'accident-water':
    'She sits alone on a wooden bench in a marble hallway outside a courtroom, hugging a thick binder of legal papers to her chest while water pools on the bench and drips onto the floor. Cool morning light from tall windows. Medium shot.',
  'accident-discipline':
    "In the academy dojo he stands perfectly still holding a wooden practice sword while a sparring partner's strike hangs in mid-swing a hand's width from his shoulder, dust motes motionless in the air around them. Afternoon light through paper screens. Medium-full shot.",
  'accident-genius':
    'She stands at a chalkboard covered in dense chalk equations, chalk in one hand, glancing sideways at a smiling friend in the doorway while her other hand hides a small scrap of paper behind her back. Warm classroom lamplight. Medium shot.',
  'accident-birthright':
    'In the academy trophy hall he stands among glass cases of old hero helmets and medals, tugging at the frayed hem of the heavy antique cape with one hand, while three grinning classmates point at it from the background. Warm museum spotlights. Medium-full shot.',
  'accident-social':
    'Under a concrete underpass beside a tall broadcasting tower they sit on an upturned crate with the guitar quiet across their knees, looking warily at a half-circle of smiling classmates swaying with their eyes closed. A faint gold shimmer hangs around the guitar strings. Dusk streetlight. Medium-wide shot.',
  'mutant-fire':
    'She sits cross-legged on her dormitory bed holding a thick leather journal shut with both hands, small gold healing flames curling from her fingertips across the unburnt brown leather. A strip of six registration photographs of her face is pinned to the wall beside the bed. Warm firelight in a dim blue room. Medium shot.',
  'mutant-air':
    'On the academy roof he flinches and pulls his folded wings tight as a classmate reaches toward his back with an open hand, the overcoat sliding off one shoulder. Windy grey morning sky with pigeons scattering. Medium-full shot from slightly below.',
  'mutant-earth':
    'She stoops in the back row of a class photograph on the academy front steps, smiling nervously, while a photographer behind a tripod waves her toward the middle and classmates in blazers turn to look up at her. Bright spring daylight. Wide shot.',
  'mutant-water':
    'He sits at a lecture-hall desk misting his own neck with a squeeze bottle, a puddle spreading under his chair, while two classmates in the next row lean away with their hands over their noses. Grey daylight through tall classroom windows. Medium shot.',
  'mutant-discipline':
    'In the academy training hall she holds a classical dance pose with all four hands shaped into precise gestures, while a combat instructor beside her points at a rack of wooden training staves. Polished wooden floor, warm late-afternoon light through high windows. Full-body shot at eye level.',
  'mutant-genius':
    'They sit at a cluttered coffee-shop table drawing a complex rescue plan across a pile of napkins while a classmate watches with a worried frown. A small paper wall calendar beside them has rows of days crossed out in pencil. Warm cafe light. Medium shot.',
  'mutant-birthright':
    'She stands beneath a long row of oil paintings of winged ancestors in armor, her own wings drooping, holding a heavy ceremonial gold breastplate awkwardly in both hands. Late golden light from tall gallery windows. Medium-full shot.',
  'mutant-social':
    'He sits at the end of a long table in the busy academy cafeteria eating alone, pressing the patch on his neck with two fingers, as one classmate sets a lunch tray down across from him. Bright overhead light. Medium-wide shot.',
  'tech-fire':
    'In a cramped garage workshop she pulls a welding blanket over the gauntlet as two academy engineers in white lab coats peer in under the half-open roll-up door holding a briefcase. Orange glow from the gauntlet vents, cold blue daylight from the doorway. Medium shot.',
  'tech-air':
    'He stands on a training tower ledge checking a large stopwatch strapped to his wrist, one foot tapping, while racing drones circle in the sky behind him. Bright cloudy afternoon, wind tugging the wingsuit fabric. Low-angle medium-full shot.',
  'tech-earth':
    'She sits in the open cockpit of a two-legged yellow walking excavator in the academy yard, gripping the control levers and staring at a snapped steel rebar rod lying in the dirt in front of the machine. Dusty golden afternoon light. Medium-wide shot.',
  'tech-water':
    'On a windy harbor pier she holds a brass dive helmet against her hip and glares across the water at a coast guard station with its shutters pulled down and an empty boat slip. Grey stormy morning. Medium-full shot.',
  'tech-discipline':
    'At dawn he crouches in a sprint start on the academy running track, jaw set, while three coaches in tracksuits stand by the far bleachers with their arms folded. Low pink dawn light and long shadows. Low-angle wide shot.',
  'tech-genius':
    'At the hospital roof at night Dr. Lionel Marsh, still entirely human, demonstrates a huge green brass-jointed F.R.O.G. leap harness before independent safety chemists, goggles sliding down his nose as the spring boots compress. An unopened vial of dangerous amber serum is sealed in a clear case nearby. Warm work lights against a cobalt skyline. Full-body action shot.',
  'tech-birthright':
    'In a gleaming corporate workshop he stands beside an empty open suit of silver-and-blue power armor with his hands in his blazer pockets, looking at his own reflection in its polished chest plate, while lawyers in grey suits wait by the door holding folders. Cold white showroom light. Medium-full shot.',
  'tech-social':
    'They stand alone at the edge of a crowded evening protest square holding a phone on a selfie stick, the glasses projecting small floating face outlines over the people around them while the phone screen fills with pink hearts. Streetlights and neon. Medium shot.',
  'magic-fire':
    'Behind the counter of a cramped candle shop she cups a single burning taper in both hands while a small salamander made of flame curls around the wick and looks up at her face. Hundreds of unlit candles line the shelves behind her. Warm candlelight in a dark shop. Close medium shot.',
  'magic-air':
    'In the back row of a lecture hall he whispers to a classmate behind one hand, while the papers on his desk lift and swirl in a small private gust and rain clouds gather at the window. Grey stormy light. Medium shot.',
  'magic-earth':
    'Granny Mayhem, a fierce elderly woman with silver double buns and rune-stitched patchwork shawl, perches on the roof of an old yellow school bus as luminous knitting needles coax the cobblestones beneath a harbor boarding house into a protective ramp. A grown tenant-council leader argues with her below. Golden twilight and pink rune light. Wide shot.',
  'magic-water':
    'Alone in a classroom after hours he leans over a dented silver bowl of water on a desk, where a reflection of himself lying still on a rainy rooftop ripples on the surface, and grips the edge of the desk. Dim blue dusk light. Close medium shot.',
  'magic-discipline':
    'On a stone stair outside the academy at dawn she kneels with a wooden staff across her knees, eyes open and fixed on a line of valley refugees carrying bundles along the road below. Cold blue dawn light under a gold sky. Medium-wide shot.',
  'magic-genius':
    'Late at night in a mathematics classroom he stands before a blackboard covered in chalk equations, where one glowing equation in the middle has opened into a small doorway of violet light, an older professor’s tweed coat hanging on an empty chair behind him. Dark room lit by the violet glow. Medium shot.',
  'magic-birthright':
    'In an attic hung with drying herbs she sits on the floorboards with a huge leather-bound grimoire open on her lap, its pages lifting on their own, holding a faded photograph of a dark-haired woman up to the candlelight. Warm candlelight and cold moonlight from a round window. Medium shot.',
  'magic-social':
    'He stands on a small cabaret stage under a pink spotlight while the crowd at the tables rises to applaud, and at the back of the dim room a tall shadowed stranger in a top hat with glowing white eyes sits alone tapping a pocket watch. Medium-wide shot.',
  'alien-fire':
    'She stands at an immigration office counter clutching her academy enrollment folder to her chest while a clerk behind glass studies a computer, sunlight from a high window making her skin glow. Families wait on rows of plastic chairs behind her. Bright midday light. Medium-wide shot.',
  'alien-air':
    'In a classroom they float above their desk holding a stack of homework out at arm’s length with both hands and bowing to it formally, while the teacher at the chalkboard turns to stare. Soft morning light. Medium shot.',
  'alien-earth':
    'In a natural history museum hall he stands stiffly with his arms pressed to his sides beside an empty display plinth, while a tourist family raises a camera and its flash bursts white. Cool museum spotlights. Medium-full shot.',
  'alien-water':
    'At the end of a long wooden pier at sunset she sits with her feet in the water, seals, gulls and silver fish gathered close in the waves around her, gazing out at the open horizon. Warm orange sunset light. Wide shot.',
  'alien-discipline':
    'Zuzu, a very short stocky grey koala assassin with fluffy round ears and amber eyes, stands on a desk far taller than himself in his rust-red weird-west desert duster. His battered katana rests on two chairs while adult academy cadets watch the absurdly precise crouching demonstration. Indigo gym floodlights, cinematic low-angle wide shot.',
  'alien-genius':
    "In a university chemistry lab he leans over a student's bubbling flask with a delighted smile and pats the glass gently, while the student and a professor behind him glare. Bright laboratory light. Medium shot.",
  'alien-birthright':
    'In a cramped foster-home bedroom she stares into a tall mirror, where a robed royal court kneels behind her reflection holding out a glass crown, while the real room behind her holds only a narrow bed and a lamp. Dim lamplight and a cold glow from the mirror. Medium shot.',
  'alien-social':
    'They huddle in a chair in a silent library study carrel with both hands cupped over their antennae, while a row of classmates nearby work quietly in headphones. Soft lamplight. Medium shot.',
  'psychic-fire':
    'She sits on the edge of her dormitory bed holding an orange pill bottle in one hand, a small red fire extinguisher standing on the floor beside the bed and a scorched brown ring on the window curtain. Grey early-morning light. Medium shot.',
  'psychic-air':
    'In a concrete apartment stairwell they float cross-legged in midair between two landings, holding a phone to one ear with a guilty smile. Yellow stairwell light. Low-angle medium-full shot.',
  'psychic-earth':
    'On the steps of the old city hall he pulls off one glove and lays his bare palm on a weathered granite cornerstone, eyes wide, as faint grey images of past crowds and stonemasons shimmer on the stone around his hand. Overcast afternoon light. Medium shot.',
  'psychic-water':
    'On a rocky shore below a white lighthouse he stands with one hand over his chest as the waves around his boots rise and fall with his breathing, a crying stranger sitting on the rocks nearby. Overcast blue-grey evening light. Wide shot.',
  'psychic-discipline':
    'Between tall public library shelves she sidesteps a thrown punch from a sparring partner while still reading the open book in her hand, as two classmates beside her argue at her with raised hands. Warm library lamplight. Medium-full shot.',
  'psychic-genius':
    "In an exam hall he sits at a desk with his pen stopped mid-stroke, glancing up at an examiner pacing the aisle, while faint translucent images of other students' thoughts float above their heads. Bright fluorescent light. Medium-wide shot.",
  'psychic-birthright':
    'During a decorating party in the academy ballroom she stands motionless holding a paper streamer, staring up at a glittering twelve-sided crystal chandelier while classmates on ladders laugh and hang strings of lights around her. Warm party lights. Medium-wide shot.',
  'psychic-social':
    'In a busy academy hallway she clutches a notebook to her chest as classmates turn their backs and whisper, faint gold threads drifting from their heads toward her. Bright hallway light. Medium shot.',
  'animal-technical-training':
    'In the academy training gym, his katana sheathed on his back, he stands on a vaulting box demonstrating a low crouching dodge, while a row of adult cadets in grey training uniforms copy his pose on the mats below. Bright gym lights. Medium-wide shot.',
  'stellar-navigation':
    'In an academy administration office she holds a scratched folded star chart tight against her chest while a smiling administrator gestures toward a large photocopier, a small boxy starship waiting on the landing pad outside the window. Afternoon light. Medium shot.',
}

const identityPrompts = Object.fromEntries(
  Object.keys(CAST_LOOKS).flatMap((signature) => {
    const look = capital(castLook(signature)!)
    const person = IDENTITY_ARCS.find(
      (identity) => identity.signature === signature,
    )
    const rookie: [string, string] = [
      `identities/${signature}/student`,
      paint(`${look}. ${IDENTITY_MOMENTS[signature] ?? ''}`),
    ]
    if (!person) return [rookie]
    // Three story splash pages, one persistent face, build and codename.
    // These are contextual compositions, never three separately designed heroes.
    const protagonist: [string, string] = [
      `identities/${signature}/hero`,
      paint(
        `${look}. This same distinctive person takes the lead in a night rescue near Comet City's skyline, using their signature ability: ${person.hero.method} Wind, floodlights and cheering distant witnesses, wide cinematic view, full-body readable silhouette.`,
      ),
    ]
    const villainLook =
      signature === 'tech-genius'
        ? 'The SAME human Dr. Lionel Marsh has transformed after his villain serum into a gigantic emerald humanoid frog with bulging amber eyes, webbed hands and a curling tongue, identifiable by his original brass safety goggles and torn green laboratory coat'
        : look
    const antagonist: [string, string] = [
      `identities/${signature}/villain`,
      paint(
        `${villainLook}. This recognizable person confronts the academy at night after choosing a dangerous path: ${person.villain.method} Strong backlighting, watchful teammates in the distance, wide cinematic view, full-body readable silhouette.`,
      ),
    ]
    return [rookie, protagonist, antagonist]
  }),
)

const { mina, sol, imani, ash, nix, kit, mara } = TEAM_LOOKS
const zuzu = `a ${CAST_LOOKS['animal-technical-training']!.look.replace(/^a /, '')}, in ${CAST_LOOKS['animal-technical-training']!.student}`
const tess = `${CAST_LOOKS['stellar-navigation']!.look}, in ${CAST_LOOKS['stellar-navigation']!.student}`

const SCENE_PROMPTS: Record<string, string> = {
  // Patrol incidents
  'incidents/monorail':
    'Wide exterior view of a glass-towered city at violet dusk, where a gleaming elevated monorail hangs on a curved track high above the street. Its lead carriage tilts forward with sparks spraying from locked wheels, and adult commuters press their hands against the lit windows. A lone passenger crouches on the carriage roof pointing at a small blinking antenna bolted there. Ahead of the train, a young rescuer in a short cape hangs in midair over the rails inside a ring of violet portal light, one arm braced toward the lead car. Farther down the line the track curves above a hospital with a brightly lit emergency entrance. A comet hangs above the towers.',
  'incidents/museum':
    'Wide interior view of a civic museum gallery at midnight after a gala, with abandoned glasses and folded napkins on cocktail tables. In the middle, a huge glass diorama of a miniature future city cracks in long white lines beneath floating cyan holographic rescue beacons, and a polished silver sculpture tips from its plinth above it. Guests in evening wear and two security guards lead a small group of schoolchildren toward a lit exit. On a shadowed balcony, a buyer in a grey suit holds out a slim metal case toward a glowing key resting on a pedestal.',
  'incidents/flood':
    'Wide exterior view of a waterfront market at night as the blue harbor rises into a towering translucent wall of water above rows of canvas stalls. Red and blue siren light scatters through the curling wave. Vendors in raincoats tug at locked stall shutters while others carry crates of medicine and bundled folders up a flooded ramp. On a high seawall walkway, an operator in a hard hat points toward a dry promenade of luxury shops. Wind tears at the awnings and rain slants across the market.',
  'incidents/garden':
    'Wide exterior view at night of an emerald glass greenhouse that has burst its frame and grown across a fire lane between small brick apartment buildings. Huge luminous leaves press against the green panes and spill over the street. Deep in the tangled roots, a tiny amber emergency beacon blinks beside a botanist in a lab coat cradled unharmed in a hollow of vines, and the vines curl back from the flashlight beams. Residents in pajamas watch from their balconies while institute staff wheel a sealed incinerator cart to the edge of the lane.',
  'incidents/broadcast':
    'Wide exterior view of a crowded media-district plaza at dusk beneath a colossal floating screen glowing with swirling orange and red light. The crowd below is split down the middle: on one side people cheer and raise their drinks under strings of festival lights, on the other side people clutch each other, point upward and back away. Tall glass broadcast towers with dish antennas ring the plaza. On a rooftop ledge, a figure in a long dark coat holds a small transmitter and watches.',
  'incidents/skybridge':
    'Wide exterior view between two immense academy towers at sunset, where a glass skybridge breaks apart and falls in glittering shards. Eight cleaners in blue work uniforms, pushing mops and supply carts, run along the last intact span toward the east tower landing. A small white shuttle tumbles more slowly beside the falling glass, its running lights blinking. A young rescuer wrapped in rippling waves of force holds a buckling section of the walkway steady with both arms outstretched. Orange and violet sunset light blazes through the shards, and a comet hangs above the towers.',

  // Late night calls (lateIncidents.ts)
  'incidents/ferris':
    "Wide exterior view of a harbor pier at night in a squall, rain slanting across a tall Ferris wheel strung with colored bulbs. The wheel has stopped, and its top car swings in the wind with a wedding party inside: a bride in white, a groom in a grey suit and two guests pressing against the glass. A young rescuer in a short cape braces both arms against the wheel's rim to hold it still. At the base, a maintenance chief in a yellow raincoat points at a smoking gearbox while a man in a sharp suit shouts beside a news van. Wet boards reflect the bulbs.",
  'incidents/blackout':
    'Wide interior view of a hospital ward during a power cut, lit only by red emergency lamps and the small screens of ventilators running on battery. Nurses in blue scrubs squeeze hand pumps beside the beds. Through the ward window, a substation outside crackles with blue lightning held in place by a young rescuer standing on its fence with both arms raised. In the dark parking lot below, three figures in black coats wait beside a generator on a flatbed truck.',
  'incidents/quarry':
    'Wide interior view of a collapsed subway maintenance tunnel, broken rock and twisted rails filling half the space, lit by headlamps and work lights. Four workers in orange vests and hard hats huddle in a small pocket of air behind the rubble. On the near side, a crew of muscular tunnel diggers in muddy coveralls pull rocks away by hand while a young rescuer opens a ring of violet portal light through the rubble wall. Dust hangs in the lamp beams.',
  'incidents/rally':
    'Wide exterior view of a crowded city square at dusk under falling gold confetti, a fresh crater cracked into the paving stones beside a stage. A hero in a white and gold costume stands in the crater looking surprised. The crowd surges toward a single narrow exit between metal barricades, while marshals in green vests link arms to open a side street and a young rescuer with glowing hands calls to the crowd from a lamppost. Stage lights and long shadows.',
  'incidents/refinery':
    'Wide exterior view at night of an oil refinery venting a thick yellow cloud over a row of brick row houses. Residents in pajamas cough on their fire escapes, holding wet cloths over their mouths. Tall sensor masts on the refinery fence have small black boxes strapped over their lenses. A young rescuer in a respirator carries an elderly man down a fire escape, while a security chief in a dark uniform stands at the refinery gate with a clipboard. Yellow haze lit by sodium streetlights.',
  'incidents/vault':
    'Wide interior view of a marble bank lobby in lockdown, steel shutters down over the tall windows. Three people in battered grey training armor with cracked visors stand by the open vault door holding stacks of folders, while bank customers sit on the floor along the wall. A young rescuer stands in the middle of the lobby with outstretched hands as blue sparks crackle across the armor joints. A bank manager in a pinstripe suit points at a single steel deposit box on the counter. Cold white light from the glass ceiling.',

  // Return visits (returnVisits.ts)
  'returns/academy-roof': `Wide exterior view of a gravel academy rooftop at night with vent stacks, potted tomato plants and a low parapet over glowing glass towers. An older janitor in grey coveralls holds a green watering can over the tomatoes while ${imani} kneels beside a steel support beam, shining a flashlight on a deep straight saw cut in the metal. A rusted saw blade lies beside her knee. Cool moonlight and a warm flashlight beam, with a comet in the violet sky.`,
  'returns/theater-wing':
    'Wide interior view of a dark theater fly loft above a stage, rows of hanging ropes and sandbags. A translucent blue projection of a dancer in a prom gown walks along a narrow catwalk toward an open steel door. Three adult dancers in practice clothes follow the projection with rolls of white tape, and through the door a boxy radio transmitter with a blinking red light points down toward a distant ballroom. Blue projection light and warm work lamps.',
  'returns/archive-stacks':
    'Wide interior view of tall wooden archive shelves at night, a long table covered with stacks of yellowed attendance sheets and twelve student photographs laid in a row. A tired adult student in a hooded sweatshirt sorts the sheets by lamplight while a second student copies pages beside them. A narrow iron door at the back is half bricked over with fresh mortar. Green-shaded lamplight and drifting dust.',
  'returns/transit-gate': `Wide exterior view of a turquoise dimensional portal above a station platform on a bright afternoon. ${zuzu}, stands with his katana lowered in front of a frightened family of three holding suitcases, facing four company guards in silver uniforms. A lawyer in a rumpled tan coat holds up a folder of papers beside him. Commuters watch from the platform edge. Turquoise portal light and harsh daylight.`,
  'returns/observatory': `Wide interior view of a domed observatory at night, its brass telescope aimed at a field of stars through an open slit. ${tess}, leans over a desk of star charts beside an astronomer in a cardigan, drawing three faint pencil lines that cross at one point. A comet hangs in the violet sky beyond the slit, and wall screens glow with star maps. Cool starlight and warm desk lamps.`,
  'returns/city-grants':
    'Wide interior view of a marble civic grants hall in afternoon light, long oak tables and arched windows over a harbor. A clerk in a grey cardigan holds out a single ledger page to an adult student, while beside them a cart holds prom decorations: a crated crystal chandelier, a smoke machine and boxes of glow sticks. An auditor in round glasses watches from the next table. Sunbeams slant across the floor.',
  'returns/transit-lab':
    "Wide interior view of an academy transit lab with model tracks and brass gears around a ring-shaped prediction machine. The machine projects two life-size holographic copies of one adult student: on the left in a rescue coat, on the right seated behind a grey prison desk. The real student and a friend stand together in front of the projections, the friend's hand on the student's shoulder and the student's other hand gripping a thick power cable. Cool blue and deep red light divide the room.",
  'returns/student-commons': `Wide interior view of a bright student cafeteria at lunchtime. A long line of students with trays receives small plates of scallops and saffron rice from silver catering platters, while a small ice sculpture of a swan melts in a tray on the counter. ${mina} serves from behind the counter, and two donors in expensive coats stand awkwardly at the end of the line holding trays. Empty steel pantry shelves line the back wall. Warm overhead light.`,
  'returns/infirmary': `Wide interior view of a campus infirmary ward in daylight, six adult students in beds and chairs each wearing a sling on the right shoulder. A dented orange rescue suit hangs on a stand in the middle of the ward. ${kit} stands beside it pointing at a cracked shoulder joint while three faculty reviewers in dark suits take notes. Bright window light across the white sheets.`,
  'returns/training-arena': `Wide interior view of an academy training arena after hours, the sand floor ringed with folding chairs full of maintenance staff in work uniforms. ${sol} and a trainee in a gold-trimmed sparring suit circle each other in the middle, both bruised and grinning. A glass jar half full of coins and bills sits on a chair by the rail, and a producer in a blazer waits in the tunnel holding a contract. Work lamps on stands and one spotlight.`,
  'returns/engineering-workshop': `Wide interior view of an engineering workshop with a long steel bench. A line of adult students in padded undersuits stand beside their open rescue suits, each pulling a tiny black chip from the armor with tweezers and dropping it into a large glass jar. ${ash} stands at the head of the bench holding up their own weather coat with its lining slit open. Late afternoon light through high factory windows.`,
  'returns/botanical-conservatory': `Wide interior view of a student cafeteria beside tall windows, where an elderly gardener in a muddy apron kneels and presses a small vine cutting with one pale blue bud into a fresh wooden planter. Wet newspaper and an opened parcel box lie on the floor beside her. ${kit} holds a watering can, and a few students with lunch trays stop to watch. Bright morning light.`,
  'returns/student-dormitory': `Wide interior view of a cramped boiler room in staff tunnels at night, pipes overhead and a glowing furnace door. A thin adult student in a dirty hooded sweatshirt hugs an older mother and father, all three crying. ${nix} stands beside a flickering violet portal in the doorway holding a small plastic pass. A hand-drawn map lies on an upturned crate. Orange furnace light and violet portal glow.`,
  'returns/ethics-hall':
    "Wide exterior view of a small backyard on a Saturday morning, where an adult student in rolled shirtsleeves hammers a new board into a broken wooden fence. A large shaggy brown dog sniffs the student's elbow, and its owner, an older woman in a cardigan, watches from the porch with her arms crossed. A toolbox and a stack of fresh boards lie on the grass. Bright morning sun.",
  'returns/academy-docks':
    'Wide exterior view of academy docks at dawn beneath tall cranes. A hulking grey robot guard with a single red lens eye stands on the pier wearing a small yellow hard hat perched on its head, holding a crate of medical supplies in both hands. Dockworkers in orange vests stand around it, one patting its arm. A rusty barge is tied up behind them. Mist on the canal and glass towers beyond the harbor.',
  'returns/waterfront-market':
    'Wide exterior view of a waterfront market at night during a spring tide. Water pours along a hand-dug stone channel between canvas stalls while vendors and students in rain boots pass sandbags down a long line and bail with buckets. Beyond the market, a row of tall steel flood barriers guards a few expensive stalls. Lanterns swing in the rain and the harbor rises behind them.',
  'returns/transit-union': `Wide interior view of a transit union hall packed with train drivers in blue uniforms on folding chairs. ${mara} stands on a folding table reading aloud from a thick stapled report held high, while the drivers lean forward and one older driver covers her mouth. A torn brown envelope lies on the table at her feet. Fluorescent light and a tall window onto parked trains in the yard.`,
  'returns/neon-arcade': `Wide interior view of a neon arcade at night. A young woman in a laundromat uniform stands on the lit tournament floor holding a headset, looking up at a large screen with a column of glowing red clock icons. ${sol} points at the screen while a crowd of adult players listens, and a technician pulls the plug on a tall glowing leaderboard tower. Pink and cyan neon washes over everything.`,
  'returns/civic-hospital':
    "Wide interior view of a civic hospital waiting room with pale green walls and rows of plastic chairs. A ceiling triage camera on its arm has been turned to face the wall. A nurse in blue scrubs kneels to check a small feverish child in a parent's lap, the child's hands glowing faint warm orange. Torn pieces of a contract lie on the floor by the chair, and other patients applaud. Soft fluorescent light.",
  'returns/industrial-foundry':
    'Wide interior view of an industrial foundry at night, workers in heat-proof aprons and goggles raising their hands in a vote around a shift supervisor. Behind them the furnace pours molten orange alloy into long flat molds for flood barrier plates. An adult student holds up a folded order from the market vendors. Sparks drift into the dark rafters and orange light falls across their faces.',
  'returns/skyport':
    'Wide exterior view of a skyport landing deck in a night storm, rain slanting through the runway lights. A battered shuttle sets down hard on the deck with sparks flying from its skids, and well-dressed passengers in soaked expensive coats climb out under umbrellas. Volunteer pilots in mismatched flight jackets hold portable runway lamps, and in the glass control tower a controller watches through a headset. A comet glows faintly behind the clouds.',
  'returns/media-spire':
    "Wide interior view of a media control room at midnight, a curved wall of monitors glowing in the dark. An older woman in a bathrobe and slippers sits in the editor's chair beside an adult student, both watching a large central screen that shows a bridge rescue filmed from a balcony high above. Through floor-to-ceiling windows the real bridge glows across the harbor. Blue monitor light on their faces.",
  'returns/labor-museum':
    'Wide interior view of a labor museum hall inside an old brick factory, a bronze statue of a caped hero lifting a beam. Beneath the statue young recruits in academy jackets haul on ropes through a wooden pulley rig, lifting a steel beam off a padded dummy, coached by retired engineers in flat caps. Two lawyers in dark suits take notes by the doorway. Dusty sunlight through high factory windows.',
  'returns/night-bazaar':
    'Wide exterior view of a night bazaar alley strung with red, gold and teal paper lanterns. Behind a half-drawn curtain, a medic in a patched apron stitches a cut on the forearm of a sweating middle-aged man in a rumpled grey suit seated on a folding cot, as he hands a thick bundle of papers to an adult student. Shelves of medicine bottles glow in the lantern light. Patrol flashlight beams sweep the far end of the alley.',

  // Campus encounters
  'encounters/a-promise-on-the-roof': `Wide exterior view of the academy roof at night, a gravel deck with vent stacks, potted tomato plants and a low parapet overlooking glowing glass towers and a harbor. ${imani} stands near the edge holding a single sheet of paper close to a small lantern, her eyes wide with alarm. A second student in an academy jacket stands across from her, seen from behind. Her teal scarf lifts in the night wind and a bright comet hangs in the violet sky.`,
  'encounters/the-fire-drill-that-wasnt':
    'Wide interior view of an academy theater during a prom committee rehearsal. On a large stage dressed with painted cardboard skyscrapers and a prop rescue ladder, adult students in rehearsal capes freeze mid-pose as the stage floor lights up with a spiraling ring of glowing geometric marks, one mark after another. Spotlights swing wildly overhead and a fog machine spills haze across the boards. Dancers in practice clothes crowd toward the aisle exits, while one student in the front row holds up a wrist device to record the glow.',
  'encounters/the-principals-favor':
    'Wide interior view of the academy archive stacks at night, towering wooden shelves of bound records and rolling ladders fading into shadow. A tall instructor in a tailored charcoal faculty coat leans close to a student beneath a single green-shaded reading lamp and slides a sheet of paper across the table with a pen resting on it. Dust drifts through the lamplight. Behind them, a narrow iron door to the staff tunnels stands ajar.',
  'encounters/the-stray-blade-arrives': `Wide exterior view above an elevated commuter rail line on a bright afternoon, where a jagged circular portal tears open in the air, crackling with turquoise light. ${zuzu}, lands in a crouch on the station canopy with his katana drawn, a torn paper sketch of his own face fluttering from his belt. Commuters on the platform below look up in surprise. On a nearby gantry, a gate operator in a crisp silver uniform holds out a glowing reward token.`,
  'encounters/a-visitor-from-the-stars': `Wide interior view of a domed city observatory at night, its great brass telescope aimed through an open slit at a violet sky with a comet. A fractured jump gate crackles in midair beneath the dome, a broken ring of white and indigo light. ${tess}, steps through holding a scratched star chart whose lines swirl and blur. Across the telescope floor, ${DEAN_LOOK}, extends an open hand toward the chart. Through the dome slit a distant boxy refugee ship waits among the stars.`,
  'encounters/the-unclaimed-scholarship':
    'Wide interior view of a civic grants hall, a marble room with long oak tables and tall arched windows over a harbor. On one table an open ledger of ruled columns sits beside an open crate packed with fireworks rockets. An adult student on crutches, one knee bandaged, stands beside a clerk and stares at the crate. On a wall screen the dark silhouette of a donor glows in flat blue light. Afternoon sun slants across rows of filing cabinets with colored tabs.',
  'encounters/the-class-list-has-two-endings':
    'Wide interior view of an academy transit lab, a high-ceilinged workshop of model tracks, brass gears and a large ring-shaped prediction machine humming in the middle. The machine projects two life-size holographic copies of the same adult student side by side: on the left wearing a bright rescue cape before a cheering crowd of tiny glowing citizens, on the right wearing a dark angular mask before a looming projected prison tower. Two classmates watch from the foreground, one reaching a hand toward the projections. Cool blue and deep red light divide the room.',

  // District scenes
  'districts/student-commons': `Wide interior view of the student commons at lunchtime, a bright cafeteria with long tables and rows of empty steel pantry shelves. A floating donor hologram above the shelves shows glowing crates of apples and bread over the bare metal beneath. ${mina} kneels by an empty shelf holding a bundle of invoices. Behind the kitchen pass, a nervous volunteer in an apron and hairnet peeks out with one finger raised to their lips. Students with empty trays wait in line.`,
  'districts/infirmary': `Wide interior view of a campus infirmary at night, a quiet ward of curtained beds lit by soft blue monitor glow. An injured adult student lies awake in one bed with an arm in a white sling and a bandage around the forehead, looking worried. ${kit} sits beside the bed holding a small recorder. The bedside monitor shows an empty dark panel. In the doorway an insurer in a grey suit holds a clipboard and a sealed envelope.`,
  'districts/training-arena': `Wide interior view of an academy training arena under harsh broadcast lights, a sunken sand floor ringed by tiered seats and hovering camera drones. ${sol} stands in the middle facing a wealthy trainee in a gleaming gold-trimmed sparring suit, threads of amber light flickering around his raised hand. Gold and blue sponsor streamers hang along the stands. In a shadowed backstage doorway a technician in a headset and worn overalls watches with a coiled cable over one shoulder.`,
  'districts/engineering-workshop': `Wide interior view of an academy engineering workshop cluttered with workbenches, hanging cables, welding curtains and half-built rescue armor on stands. ${ash} leans over the open chest plate of a hero armor suit and lifts out a tiny black command chip glowing sickly red with fine tweezers. The classmate who owns the armor stands beside the bench in a padded undersuit, stunned. Late afternoon light falls through high factory windows, and small whirls of air from their free hand push the sparks away.`,
  'districts/botanical-conservatory': `Wide interior view of a sunlit glass botanical conservatory crowded with ferns, hanging moss and a single rare vine on a trellis, its pale blue flowers glowing softly. A locked iron gate with a heavy padlock blocks the path to the vine. On the near side an elderly gardener in a muddy apron grips the bars beside ${kit} who holds an empty glass vial. Beyond the gate an institute official in a crisp white coat stands guard beside the vine. Warm mist hangs in the humid air.`,
  'districts/student-dormitory': `Wide interior view of a narrow student dormitory hallway at night with plain wooden doors, soft sconce light and a worn runner rug. ${nix} crouches in an open doorway picking up a curfew pass, a small plastic rectangle with a faint glowing stripe, that was slid under the door. A small violet portal flickers beside them. On a corkboard at the end of the hall hangs a pencil portrait of a missing student.`,
  'districts/ethics-hall': `Wide interior view of an academy ethics hall, a round wood-paneled chamber with tiered benches. A civilian review panel of residents, including a baker in an apron, an elderly man with a cane and a bus driver in uniform, sits behind a long table facing a row of student heroes in capes. At the front, ${DEAN_LOOK}, holds out a waiver and a pen to one student. ${imani} stands to one side with her hand raised to speak. Afternoon light falls through tall windows onto the polished floor.`,
  'districts/academy-docks':
    'Wide exterior view of academy docks at dawn, where a rusty relief barge loaded with yellow emergency generators is tied to a pier beneath tall cranes. An open cargo hatch reveals three hulking dormant robot guards hidden below deck, their single lens eyes glowing faint red. Dockworkers in hard hats and orange vests stand in a line on the pier with their arms folded. A shipping clerk holds out a clipboard while gulls wheel overhead. Mist drifts across the canal and glass towers rise beyond the harbor.',
  'districts/waterfront-market':
    'Wide exterior view of a waterfront market under a cloudy sky, with damp cobblestones and patched canvas stalls. A broker in a sharp teal suit gestures at a gleaming row of steel flood barriers stacked on a flatbed truck. Nearby, vendors in rain boots gather around an old clogged storm drain holding shovels and a hand-drawn map of channels. One vendor clutches a folder marked with a red cross. Puddles reflect the glass towers, and the harbor waterline creeps toward the stalls.',
  'districts/transit-union':
    'Wide exterior view of a rail yard at dusk, where train drivers in blue uniforms stand in a picket line with linked arms. Behind them an idle commuter train sits on the tracks while a mechanic shines a flashlight on a cracked brake assembly. A plain white van with its back doors open waits at the gate, stacked with medical supply crates. The mayor in a dark overcoat stands beside a caped academy student, pointing past the picket line toward the train. Yard floodlights flick on against the violet sky.',
  'districts/neon-arcade': `Wide interior view of a neon arcade at night, glowing cabinets around a lit tournament floor where adult students wear augmented-reality headsets. Above each player floats a translucent holographic silhouette of a shadowy caped alter ego. ${sol} stands at an open maintenance panel full of wires, pulling streams of glowing data dots out of the machine on threads of amber light. On a raised platform the arcade's designer in a sleek white jacket spreads his arms proudly. Pink and cyan neon washes over everything.`,
  'districts/civic-hospital':
    'Wide interior view of a civic hospital waiting room with rows of plastic chairs and pale green walls. A sleek triage camera on a ceiling arm sweeps the room with a fan of white light, and a large wall screen ranks the patients as a column of glowing bars, the top bars bright gold. Patients wait with bandaged hands and ice packs. At the far end of the row a small child sits quietly beside a parent under the dimmest bar. Nurses in scrubs confer at the desk, frowning up at the camera, while an administrator in a suit watches with a tablet.',
  'districts/industrial-foundry':
    'Wide interior view of an industrial foundry at night, where a towering furnace pours molten orange alloy into ingot molds along a long conveyor. Workers in heat-proof aprons, goggles pushed up on their foreheads, gather around a shift supervisor holding an order folder, their faces troubled. Freshly cast armor plates and long steel blades lie stacked on pallets. Through a wide loading door, a row of small family homes with lit windows stands beneath power lines running straight from the plant. Sparks drift up into the dark rafters.',
  'districts/skyport':
    'Wide exterior view of a skyport at night, a broad landing deck of glowing runway lights on a tall platform above a harbor. A battered refugee shuttle hovers just off the deck with its landing lights blinking, passenger faces at its round windows. In the glass control tower a controller in a stiff grey uniform holds a flat palm against the window. Out on the deck volunteer pilots in mismatched flight jackets roll out portable runway lamps. A comet hangs in the violet sky streaked with distant starship trails.',
  'districts/media-spire':
    'Wide interior view of a media control room high above a city, a curved wall of monitors glowing in the dark. Two large central screens show the same bridge rescue from opposite angles: on one a caped hero carries a resident to safety, on the other the same hero stands blocking the only exit as smoke rises behind. An editor in rolled shirtsleeves and a student in an academy jacket lean toward the screens, comparing them. Through floor-to-ceiling windows the real bridge glows across the night harbor.',
  'districts/labor-museum':
    'Wide interior view of a labor museum hall inside an old brick factory with iron trusses and preserved machinery. A towering bronze statue of an early caped hero lifts a factory beam above a polished bronze base. In front of it, a retired engineer in a flat cap and work jacket opens a battered notebook of hand-drawn rescue diagrams of pulleys and harnesses, and two other retired workers stand behind her holding stacks of worn notebooks. Dusty sunlight falls through high factory windows across the statue’s shoulders.',
  'districts/night-bazaar':
    'Wide exterior view of a night bazaar, a narrow alley strung with red, gold and teal paper lanterns above crowded food carts. Behind a half-drawn curtain in a tucked-away stall, a medic in a patched apron bandages the hand of an elderly neighbor seated on a folding cot, shelves of plain medicine boxes and glass bottles behind her. Other neighbors wait quietly on crates in the lantern light. At the far end of the alley, the beams of patrol flashlights sweep across the cobblestones toward the stall.',

  // Masterminds
  'villains/glass-architect-portrait':
    'Three-quarter-length portrait from the knees up of an adult woman engineer with silver braided hair and an angular translucent prism eyepiece over one eye, in a dark indigo tailored coat with copper lapels and geometric embroidered cuffs. She holds a palm-sized twelve-point glass prism in gloved fingers. Behind her sit a miniature angular model of city shield towers and a square glass workbench under teal task lamps. Her face is patient and calculating, both hands in view.',
  'villains/null-registrar-portrait':
    "Three-quarter-length portrait of an adult city official in a rigid midnight-blue long coat, one half of a polished white porcelain mask lifted to show a thoughtful brown-skinned face beneath. They hold a brass-edged student registry with empty rectangular photograph windows and point to the blank space where a person's picture belongs. Behind them stand wall-high black archive drawers and a stained glass window with a broadcast mast beyond it. Cool archive light.",
  'villains/tidemaker-portrait':
    'Three-quarter-length portrait from the knees up of an adult male floodworks investor in a pale green waterproof trench coat over burgundy business clothes, slick black hair with one white streak. He clasps a heavy brass floodgate wheel at his waist, a leather case of harbor deeds at his side, before a round illuminated tank of swirling harbor water and a row of industrial sluice valves. His face is persuasive and cold, with worry lines, and coastal damp shines on the brass.',
  'villains/eclipse-choir-portrait':
    'Three-quarter-length portrait from the knees up of an older woman conductor with short platinum curls and translucent hearing aids, in a dark plum tailcoat over a steel-grey high-collared dress. She raises a silver baton beside a bronze frequency oscillator and an open mechanical music box. Behind her four narrow radio transmitter rods glow in front of dusty auditorium curtains, a cracked chandelier hanging in silhouette above. Expressive face and hands in three-quarter view.',
  'villains/mercy-circuit-portrait':
    'Three-quarter-length portrait from the knees up of an adult man in a spotless pale mint surgical coat with silver piping and a high collar, with a gentle smile and steady eyes, holding a slim chrome injector shaped like a flower stem. A cloud of tiny glowing petal-shaped nanites drifts from his open palm. Behind him a row of white volunteer medkits stands open on a clinic counter under soft green lamps, and through a tall window a city shield dome shimmers faint pink.',
  'villains/mirror-chancellor-portrait':
    'Three-quarter-length portrait from the knees up of an adult woman official in a long charcoal ceremonial robe trimmed with mirrored silver panels, sleek black hair pinned high, holding a hand mirror whose reflection shows a different smiling version of the room. Behind her two tall mirrored shield towers rise from a council chamber, each reflecting the room from a slightly different angle. Her face is calm and courteous.',
  'villains/orchard-engine-portrait':
    'Three-quarter-length portrait from the knees up of an adult botanist in a moss-green greenhouse coat with brass buttons and rolled sleeves, braided auburn hair threaded with tiny white blossoms, cradling a glass seed canister glowing with drifting golden spores. Thick living roots coil across a cracked concrete floor around their boots and climb a steel shield repeater behind them. A vaulted greenhouse with fogged glass panes surrounds them in warm amber light. Their face is serene and certain.',
  'villains/static-commissioner-portrait':
    'Three-quarter-length portrait from the knees up of a tall adult man in a crisp navy emergency-services commissioner uniform with silver radio insignia and short grey hair, one gloved hand pressed to an earpiece and the other holding a black handheld radio. A wall of emergency broadcast consoles behind him flickers with blue static and waveform lines, and rescue crews on small monitors pause mid-stride. His face is composed and authoritative.',

  // Endings still to paint
  'endings/the-broken-grid':
    'Wide exterior view at dawn from a shattered ballroom terrace over a glass-towered harbor city after prom night. Through the open terrace doors the twelve-sided crystal chandelier lies overturned on the dance floor beneath a fractured glass dome. Across the city dozens of small separate shield domes glow pale blue over individual neighborhoods, a few flickering, with scorched broken rooftops between them. Adult students in torn formalwear and capes sit on the terrace steps sharing blankets, some with bandaged arms, each holding a small brass emergency key. A comet fades into a pink and gold sunrise.',
  'endings/the-price-of-a-single-switch':
    'Wide interior view at dawn of a wrecked academy ballroom after prom night, the twelve-sided crystal chandelier overturned on the wooden floor and pink light spilling through the fractured glass dome. In the middle stands a large control console with one heavy switch thrown, joined by a thick beam of light to a distant shield tower seen through the broken roof. One student in a tattered cape and formal suit stands alone at the console with a hand still on the switch. Other students and guests in torn evening clothes sit apart along the walls wrapped in blankets, watching uneasily. Outside, one vast shield dome glows over the whole city.',
  'endings/honors-in-the-prom-simulation':
    'Wide interior view of a faculty holographic training hall staging a prom-night disaster, glowing cyan grid lines across the floor, walls and ceiling and rows of ceiling projectors casting beams of light. A projected ballroom shimmers around the space, its holographic chandelier and dance floor semi-transparent. Adult students in capes over formalwear stand shoulder to shoulder with arms linked, looking up as a projected comet bends away through the simulated glass dome. Faculty observers in a glass booth high on the wall stand and applaud. Warm gold hologram light against the cool blue grid.',
  'endings/the-rescue-that-counted':
    'Wide interior view of a faculty holographic training hall with cyan grid lines across the floor and walls and projectors along the ceiling. A simulated prom ballroom lies half collapsed in flickering holographic debris. One student in a cape kneels in the projected rubble shielding a classmate who sits safely against a hologram column, while other classmates rush toward them with hands outstretched. Above them a floating hologram bar dims from gold to grey. The flickering projections cast soft blue light over their faces.',
  'endings/master-of-the-simulation':
    'Wide interior view of a faculty holographic training hall where one student controls a prom-night disaster simulation. The cyan grid lines across the floor and walls warp into new patterns and the ceiling projectors swivel to follow the student’s raised hands. In a dark cape over formalwear, the student stands on a glowing control dais as holographic chandeliers, falling glass and a projected comet stop in midair and rearrange themselves. Classmates step back with wide eyes. In an observation booth high on the wall, the dean in a formal robe types quickly on a tablet.',
  'endings/the-shield-changes-hands':
    'Wide exterior view at dawn of a glass-towered harbor city seen from a wrecked ballroom balcony after prom night. Every shield tower across the skyline glows cold violet, joined by beams of light to one tall central spire, and small violet drones hover above the empty streets. On the balcony, adult students in torn formalwear and capes sit among broken glass with bandaged hands, watching the towers. Behind them the twelve-sided crystal chandelier lies overturned on the dance floor. Grey dawn light under a violet sky.',
  'endings/the-transmitter-goes-dark':
    'Wide interior view at dawn of a collapsed academy ballroom, a smoking transmitter of copper coils and cracked glass lying in pieces in the middle of the dance floor beneath a fractured glass dome. Through the broken roof, the shield towers across the city stand dark and grey. Adult students in torn formalwear carry injured guests on doors and tablecloths toward the open terrace, where neighbors from the city wait with blankets and stretchers. Pink sunrise light through drifting dust.',
  'endings/an-unexpected-reboot':
    'Wide interior view of a faculty holographic training hall in chaos during a prom-night disaster simulation. Ceiling projectors spark and strobe, and the cyan grid lines on the floor and walls glitch into jagged loops. A student in a formal suit and cape is tangled in ribbons of looping hologram light rising from a central control console, and a rival classmate in a crimson cape grabs the student’s wrist and pulls them free, both unharmed. Around them the projected ballroom, chandelier and comet stutter and break into fragments of light.',
}

/** Every authored Krea 2 prompt, by art key; MEDIUM is appended once here. */
export const PROM_ART_PROMPTS: Record<string, string> = {
  ...identityPrompts,
  // Prompts are registered for jobs; this is NOT evidence of painted delivery.
  ...Object.fromEntries(
    EXPANDED_MISSIONS.map((mission) => [
      `incidents/${mission.incident.id}`,
      paint(
        mission.incident.art.length > 400
          ? mission.incident.art
          : `${mission.incident.art} ${mission.briefing}`,
      ),
    ]),
  ),
  ...Object.fromEntries(
    Object.entries(SCENE_PROMPTS).map(([key, text]) => [key, paint(text)]),
  ),
}

export const promArtPrompt = (key: string): string | undefined =>
  PROM_ART_PROMPTS[key]
