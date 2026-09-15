// /utils/seeds/facetArtPrompts.ts
//
// Hand-written art prompts, one per Facet, keyed by slug.
//
// These exist because a SHARED clause cannot produce varied art. The generated
// taxonomy clause in scripts/generate_facet_art_v4.ts is the only part of a
// bare Facet's prompt that does not change between rows, so whatever it names
// becomes what every card has in common. That is the same failure three times
// over: "concrete focal subject" made 154 concrete busts, "the tools of the
// trade" put hammers in 50 occupation cards, and "everyone in it ... the
// weather" made 146 genres into the same crowd standing in the same rain
// (Silas, 2026-09-15: "I want varied. You are a text generator and there's
// only so many. Write fresh prompts").
//
// So the clause is not the place to fix variety -- authored prompts are. The
// producer already prefers them: buildFacetIdentityPrompt returns a curated
// artPrompt verbatim and never rewrites it, provided it is not recognizable as
// generator output.
//
// Rules these follow, all enforced by server/utils/artPromptContract.ts and
// checked in utils/scripts/verifyCuratedFacetArtPrompts.ts:
//   - a concrete visible subject, named first
//   - no art-direction vocabulary, no negation, no format nouns
//   - the cast is a decision, stated or absent, never a condition
//   - deliberately varied framing, time of day, and whether anyone is present
//     at all; most of these frames hold no people, which is the whole point

export const CURATED_FACET_ART_PROMPTS: Record<string, string> = {
  // ── GENRE ──
  // Absurdist Strategy
  'absurdist-strategy':
    'A war-room table where the battle map is laid out in breakfast things, one officer nudging a boiled egg forward with a ruler under a low hanging lamp.',
  // Academic Eldritch
  'academic-eldritch':
    'An empty lecture hall after midnight, chalk diagrams crawling off the blackboard and across the ceiling, a lectern lamp still burning.',
  // Alien Bureaucracy
  'alien-bureaucracy':
    'A waiting room of moulded seats shaped for six-limbed bodies, a numbered ticket glowing in its dispenser, every chair empty.',
  // Anachronism Mystery
  'anachronism-mystery':
    'A Roman courtyard at noon with an orange rotary telephone sitting on a marble plinth, its cord trailing into a drain.',
  // Aquatic Opera
  'aquatic-opera':
    'A flooded opera house with water up to the third row of seats, one singer on a floating platform, a shaft of light from the broken dome.',
  // Archive Horror
  'archive-horror':
    'A basement of filing drawers stretching into the dark, one drawer open and breathing pale fog into the aisle.',
  // Body Horror
  'body-horror':
    'A surgical theatre at night, an anatomy model whose ribs have swung open like cabinet doors, wet instruments on a tray.',
  // Bog Punk
  'bog-punk':
    'A peat-cutting rig of brass pipes and tarred rope sunk to its axles in black bog water, dawn mist low across the heather.',
  // Bureaucratic Fantasy
  'bureaucratic-fantasy':
    'A wizard\'s permit window, a wax-sealed scroll pinned under a crystal paperweight, a brass bell nobody has rung, queue rail empty.',
  // Cartoon Noir
  'cartoon-noir':
    'A rain-slick alley in flat black ink, one yellow window burning, a bent streetlamp leaning like rubber over a puddle.',
  // Clockpunk Opera
  'clockpunk-opera':
    'A theatre stage where the scenery is driven by exposed brass gearing, a mechanical swan gliding on rails, footlights blazing.',
  // Corporate Espionage
  'corporate-espionage':
    'A glass office tower at 3am, one floor lit, a briefcase left open on a boardroom table with its lining slit.',
  // Corporate Sci-Fi
  'corporate-sci-fi':
    'A commuter platform on an orbital ring, workers in identical grey coats waiting, the curve of the station roof arcing overhead.',
  // Cosmic Bureaucracy
  'cosmic-bureaucracy':
    'A clerk\'s desk floating in starless black, an in-tray stacked with folded paper, a lamp with nothing to stand on.',
  // Cosmic Horror
  'cosmic-horror':
    'A coastline under a sky that has opened, the sea drawn upward in a slow column, one lighthouse keeper watching from the rail.',
  // Cozy Fantasy
  'cozy-fantasy':
    'A crooked teashop kitchen, bread cooling on a rack, a broom sweeping itself in the corner, afternoon sun through crown glass.',
  // Cozy Mystery
  'cozy-mystery':
    'A village sitting room with the tea gone cold, a magnifying glass resting on an embroidered cushion, rain on the bay window.',
  // Cryptid Documentary
  'cryptid-documentary':
    'A forest clearing at dusk shot from a shaky handheld camera, a shape half behind a trunk, a dropped lens cap in the leaves.',
  // Culinary Horror
  'culinary-horror':
    'A restaurant kitchen at service, something in the stockpot pressing outward against the steel, steam thick under the heat lamps.',
  // Deep Space Western
  'deep-space-western':
    'A dust-red frontier street under two suns, a hitching rail of parked rovers, saloon doors swinging in thin atmosphere.',
  // Deep-Sea Horror
  'deep-sea-horror':
    'A submersible\'s floodlight on a trench wall, a pale shape drifting just past the edge of the beam, silt rising.',
  // Diplomatic Thriller
  'diplomatic-thriller':
    'A long polished table set for two delegations, water glasses untouched, one chair pushed back and empty, snow at the tall windows.',
  // Eco-Fantasy
  'eco-fantasy':
    'A river valley where the trees carry lanterns instead of fruit, a heron picking through the shallows at first light.',
  // Eco-Fiction
  'eco-fiction':
    'A drowned coastal town at low tide, rooftops breaking the surface, a rowing boat tied to a chimney.',
  // Existential Swashbuckling
  'existential-swashbuckling':
    'A duellist pausing mid-lunge on a moonlit pier, blade lowered, looking out at the water instead of the opponent.',
  // Fairy Tale
  'fairy-tale':
    'A path of white stones leading into dark woods, a single shoe left at the treeline, first snow beginning.',
  // First Contact
  'first-contact':
    'A frozen lake at dawn with a smooth object resting on the ice, the ice cracked in a perfect ring around it.',
  // First Contact Comedy
  'first-contact-comedy':
    'A suburban lawn at breakfast time, a landing craft parked crookedly across the hedge, a dog barking at its open ramp.',
  // Folk Horror
  'folk-horror':
    'A hill field of tall corn with a wicker frame standing at its centre, ribbons moving, the village rooftops far below.',
  // Fungal Horror
  'fungal-horror':
    'A farmhouse hallway where the wallpaper has gone soft and grey with growth, spores turning slowly in a bar of window light.',
  // Furry Pastoral
  'furry-pastoral':
    'A badger in a waistcoat hoeing a vegetable row, a fox dozing on the gate, hay meadow rolling away behind them.',
  // Generation Ship Drama
  'generation-ship-drama':
    'A vast interior farm deck curving up and overhead, sun-lamps on their morning cycle, one figure walking a long irrigation channel.',
  // Gentle Sci-Fi
  'gentle-sci-fi':
    'A greenhouse on a small moon, tomato vines against the glass, a repair robot watering them, the planet rising blue beyond.',
  // Geological Romance
  'geological-romance':
    'Two figures sitting on a canyon rim at sunset, rock strata glowing in bands below them, a hammer and a flask between them.',
  // Gothic Horror
  'gothic-horror':
    'A candlelit stair turning up into darkness, a portrait on the landing with its eyes worn away, cold air moving the flames.',
  // Gothic Mechanical
  'gothic-mechanical':
    'A cathedral organ rebuilt as an engine, pistons where the pipes were, oil pooling on the stone floor beneath it.',
  // Hard Science Fiction
  'hard-science-fiction':
    'An orbital truss under construction, a suited welder braced against a strut, Earth\'s terminator line crossing behind.',
  // Haunted Procedural
  'haunted-procedural':
    'A police evidence room where one shelf has frost on it, a case box open, a chair drawn up as if someone had been reading.',
  // Heist Fiction
  'heist-fiction':
    'A vault corridor of mirrored steel, laser grid off, one ceiling panel lifted aside and a rope hanging straight down.',
  // High Fantasy
  'high-fantasy':
    'A mountain citadel of white towers at dawn, banners stiff in cold wind, a long stair cut into the cliff below it.',
  // Horror Comedy
  'horror-comedy':
    'A basement where a summoning circle has gone wrong and produced a very small, very polite demon holding a mop.',
  // J-Horror
  'j-horror':
    'A narrow tiled stairwell lit by one flickering tube, wet footprints leading up, long black hair caught in the handrail.',
  // Lovecraftian Office Comedy
  'lovecraftian-office-comedy':
    'An open-plan office where one cubicle has grown tentacles into the ceiling tiles, a colleague calmly refilling the coffee pot beside it.',
  // Low Fantasy
  'low-fantasy':
    'A muddy village crossroads in the rain, a tired mercenary checking a horse\'s hoof, no banners and no glory anywhere.',
  // Magical Girl
  'magical-girl':
    'A rooftop at sunset with ribbons of light spiralling upward around a transforming figure, laundry lines snapping in the wind.',
  // Magical Realism
  'magical-realism':
    'An ordinary kitchen where the morning\'s oranges are hovering an inch above the bowl, the woman at the sink not looking up.',
  // Maritime Mystery
  'maritime-mystery':
    'A becalmed schooner found with the table still laid, a sextant open on the chart, sails hanging slack in flat grey sea.',
  // Mecha Opera
  'mecha-opera':
    'A hangar where a titanic machine kneels with its chest open, a pilot on a gantry looking up into the cockpit light.',
  // Metafiction
  'metafiction':
    'A study where the writer\'s desk sits inside a larger drawing of the same study, the pencil lines still wet at the edges.',
  // Middle Management Horror
  'middle-management-horror':
    'A meeting room whose whiteboard is covered in a spiral that keeps going onto the wall, one chair occupied, the rest pushed neatly in.',
  // Municipal Necromancy
  'municipal-necromancy':
    'A town hall counter where a clerk stamps a form for a patient queue of the recently dead, ceiling fan turning slowly.',
  // Mythic Fantasy
  'mythic-fantasy':
    'A bronze-age hero standing in a river up to the knee, holding a spear, an enormous shape moving under the water upstream.',
  // Mythological Comedy
  'mythological-comedy':
    'Olympus rendered as a crowded bus stop, a thunder god checking a timetable, a swan pretending not to be anyone in particular.',
  // Office Satire
  'office-satire':
    'A cubicle farm where one desk has been slowly built into a fortress of box files, its occupant serenely typing inside it.',
  // Office Thriller
  'office-thriller':
    'A dark office corridor lit only by a photocopier mid-cycle, a security badge on the carpet, a door closing at the far end.',
  // Political Thriller
  'political-thriller':
    'A marble corridor at night, two figures talking too closely by a window, a folder changing hands out of the light.',
  // Post-Apocalyptic
  'post-apocalyptic':
    'A motorway overgrown to a green channel, cars rusted into hedgerow, a lone cyclist threading between them at dusk.',
  // Reverse Isekai
  'reverse-isekai':
    'A dragon curled uncomfortably in a suburban back garden, trying to fit under a washing line, neighbours peering over the fence.',
  // Revolutionary Pastoral
  'revolutionary-pastoral':
    'A harvest field at dawn where the scythes have been stacked into a barricade across the lane, a red cloth tied at the top.',
  // School Horror
  'school-horror':
    'An empty gymnasium with the lights half on, a chalk circle at centre court, one locker door swinging open by itself.',
  // Sci-Fi
  'sci-fi':
    'A landing field at night, a freighter on its struts venting steam, ground crew signalling with lit batons in the rain.',
  // Sci-Fi Comedy
  'sci-fi-comedy':
    'A cramped ship\'s galley where the food printer has produced an enormous inedible sculpture, the crew regarding it in silence.',
  // Siege Comedy
  'siege-comedy':
    'Defenders on a castle wall lowering a basket of complaints down to the besieging army, who are queueing politely for it.',
  // Slice of Life
  'slice-of-life':
    'A convenience store at 1am, one customer choosing between two identical drinks, rain starting outside the glass.',
  // Space Opera
  'space-opera':
    'A fleet turning above a ringed planet, one flagship in the foreground catching the star\'s light along its whole flank.',
  // Surreal Aquatic
  'surreal-aquatic':
    'A staircase descending into clear water and continuing down, fish moving between the banisters, daylight still overhead.',
  // Surreal Horror
  'surreal-horror':
    'A rain-black forest where the perspective folds, a red-haired figure standing where two paths overlap impossibly, wet oil paint texture.',
  // Sword and Sorcery
  'sword-and-sorcery':
    'A firelit cave mouth, a scarred fighter cleaning a blade while something enormous sleeps in the dark behind.',
  // Tender Apocalypse
  'tender-apocalypse':
    'The last evening on a hill above a quiet city, two people sharing a blanket and a flask, the sky doing something beautiful and final.',
  // Tournament Arc
  'tournament-arc':
    'A packed arena mid-bout, dust and light in the air, two fighters locked in the centre of a ring of raised arms.',
  // Undead Bureaucracy
  'undead-bureaucracy':
    'A ministry corridor where skeletal clerks push trolleys of yellowed files, a ceiling light buzzing over the rota board.',
  // Undead Glamour
  'undead-glamour':
    'A velvet dressing room where a vampire adjusts an opera cloak in a mirror that shows only the cloak.',
  // Urban Fantasy
  'urban-fantasy':
    'A city bridge at night where one lamp burns a different colour, a fox with too many tails trotting past a bus queue.',
  // Vaporwave Dystopia
  'vaporwave-dystopia':
    'An abandoned shopping arcade lit in pink and cyan, a dry fountain, a plaster bust on a pedestal under a dead escalator.',
  // Weird Fiction
  'weird-fiction':
    'A coastal cottage where the horizon has tilted several degrees relative to the garden, the washing still pegged out level.',
  // Wilderness Bureaucracy
  'wilderness-bureaucracy':
    'A ranger station counter deep in pine forest, a permit book open, an enormous unexplained pawprint pressed into the doormat.',
  // Zombie Fiction
  'zombie-fiction':
    'A boarded shopfront seen from inside, daylight in the gaps between planks, hands working at the boards from the street.',

  // ── THEME ──
  // Abandoned Megastructures
  'abandoned-megastructures':
    'A cooling tower the size of a mountain range, half swallowed by forest, birds turning in the updraft through its open top.',
  // Aging Protagonist
  'aging-protagonist':
    'An old fighter sitting on the edge of a bed, wrapping a knee, armour stacked in the corner under a window at dawn.',
  // Alien Carnival
  'alien-carnival':
    'A fairground of impossible geometry at night, a ride spinning on no visible axle, crowds of many shapes queueing happily.',
  // Ancient Space Temples
  'ancient-space-temples':
    'A stone temple carved into an asteroid, its steps worn smooth, starlight falling through a shaft cut dead centre.',
  // Animal Interiority
  'animal-interiority':
    'A crow on a fence post at dusk, head tilted, the whole picture built to suggest it is thinking about something specific.',
  // Anti-Sunrise
  'anti-sunrise':
    'A horizon where the light is draining downward instead of rising, the land going dark from the sky inward.',
  // Ashfall Cities
  'ashfall-cities':
    'A street under steady grey ashfall, shopfronts still lit, a figure sweeping a doorstep that will not stay clear.',
  // Babel Fractures
  'babel-fractures':
    'A tower split into a dozen mismatched architectures stacked upward, each storey built to a different rule, clouds between them.',
  // Bioluminescent Depths
  'bioluminescent-depths':
    'A trench wall alive with blue-green light, pale fronds pulsing in slow sequence, water utterly black above.',
  // Borrowed-Light Bittersweet
  'borrowed-light-bittersweet':
    'A room lit only by the window of the flat opposite, two mugs on the sill, the far window going dark.',
  // Broken Time
  'broken-time':
    'A market square where the same woman appears four times walking in different directions, pigeons frozen mid-flight between them.',
  // Choral Storms
  'choral-storms':
    'A thunderhead over open sea shaped like a vast throat, rain falling in ordered columns, gulls scattering from it.',
  // Clockwork Forests
  'clockwork-forests':
    'A forest where the trees are brass mechanisms, gears turning slowly in the trunks, autumn leaves of thin beaten copper falling.',
  // Complicated Relationships
  'complicated-relationships':
    'Two people at opposite ends of a long kitchen table, one reaching halfway across it, morning light hard between them.',
  // Cosmic Shipwrecks
  'cosmic-shipwrecks':
    'A broken starship hull drifting against a nebula, its ribs open, a single running light still blinking.',
  // Crystalline Jungles
  'crystalline-jungles':
    'A rainforest grown entirely in clear quartz, light refracting into colour bands across the forest floor, a stream of liquid glass.',
  // Cursed Archives
  'cursed-archives':
    'A reading room where the shelves lean inward overhead, one book open on a stand and smoking gently at the spine.',
  // Desert Monasteries
  'desert-monasteries':
    'A cliff monastery at noon, whitewashed cells cut into red rock, a rope lift hanging still above the dry valley.',
  // Digital Ghosts
  'digital-ghosts':
    'A server hall at night where one rack glows warm amber, a chair pulled up to it, dust undisturbed on the keyboard.',
  // Digital Reincarnation
  'digital-reincarnation':
    'A hospital room where a body lies still and the monitor beside it shows a face waking up instead of a heartbeat.',
  // Dream-Eating Beasts
  'dream-eating-beasts':
    'A long-muzzled animal curled on a sleeper\'s chest, breathing in, the bedroom around them slowly losing its colour.',
  // Echoes of the Deep
  'echoes-of-the-deep':
    'A sonar-lit canyon floor, the shape of something enormous implied only by the return pattern, sediment drifting.',
  // Elegiac Wonder
  'elegiac-wonder':
    'A child standing very small at the foot of a colossal ruined statue, hand on its toe, evening light going gold.',
  // Emotional Algorithms
  'emotional-algorithms':
    'A robot sitting alone at a kitchen table with a cooling cup of tea it cannot drink, morning sun across the oilcloth.',
  // Emotionally Intimate
  'emotionally-intimate':
    'Two people on a fire escape sharing a cigarette, knees touching, city noise implied by the light below them.',
  // Eternal Sunset
  'eternal-sunset':
    'A landscape locked at golden hour forever, shadows stretched impossibly long, a town living entirely in amber light.',
  // Floating Cities
  'floating-cities':
    'A city on an island of rock hanging above cloud, waterfalls pouring off its underside into nothing, bridges reaching to smaller islands.',
  // Forgotten Gods
  'forgotten-gods':
    'An overgrown roadside shrine with the face of its statue worn blank, one fresh offering of fruit on the step.',
  // Fractal Realms
  'fractal-realms':
    'A coastline that repeats itself at every scale, bays inside bays inside bays, a boat impossibly small at the centre.',
  // Fractured Utopias
  'fractured-utopias':
    'A garden city with perfect white terraces, one district cracked open and dark, residents walking past without turning their heads.',
  // Fungal Kingdoms
  'fungal-kingdoms':
    'A cavern city built inside giant mushroom stalks, windows cut into the flesh of them, spore light drifting between towers.',
  // Hollow Cosmos
  'hollow-cosmos':
    'The inside of a sphere with a sun at its centre, land curving up on all sides overhead, rivers running around the horizon.',
  // Holographic Memories
  'holographic-memories':
    'A living room where a flickering projection of a family dinner overlays the empty table, one real chair pulled out.',
  // Interstellar Pilgrimage
  'interstellar-pilgrimage':
    'A line of small ships travelling in single file toward a distant star, sails catching light, the nearest one patched many times.',
  // Lost Civilizations
  'lost-civilizations':
    'A city street uncovered from beneath ice, frozen mid-day, a market stall still stacked with unspoiled fruit.',
  // Luminous Catacombs
  'luminous-catacombs':
    'Vaulted burial tunnels where the bones themselves give off a soft white light, a stone floor worn by long use.',
  // Mechanical Gardens
  'mechanical-gardens':
    'A formal garden where every flower is hinged metal, opening and closing on a timer, a gardener oiling a rose bed.',
  // Monster Perspective
  'monster-perspective':
    'The view from inside a cave mouth looking out, enormous clawed hands resting in the foreground, tiny torches approaching.',
  // Mothlight Rituals
  'mothlight-rituals':
    'A night meadow where hundreds of pale moths circle a single lantern, the grass beneath trodden into a wide ring.',
  // Mycelial Networks
  'mycelial-networks':
    'A cross-section of forest soil, white threads running like a lit map between root and root, glowing faintly at the junctions.',
  // Mythic Futures
  'mythic-futures':
    'A spacecraft carved as a longship with a beast\'s head at the prow, banking above a ringed planet.',
  // Nature Reclaimed
  'nature-reclaimed':
    'A shopping centre atrium turned to woodland, trees breaking through the tiles, deer drinking from a flooded escalator well.',
  // Neo-Arcadia
  'neo-arcadia':
    'A pastoral valley of solar terraces and olive trees, shepherd drones moving a flock, a white aqueduct on the ridge.',
  // Neon Tombs
  'neon-tombs':
    'A necropolis of black glass mausoleums lit by pink and blue tubing, rain sheeting off the polished slabs.',
  // Nocturnal Sanctuaries
  'nocturnal-sanctuaries':
    'A wildlife hide under starlight, shuttered window propped open, a badger and a fox feeding together in the clearing.',
  // Orbital Swamps
  'orbital-swamps':
    'A wetland held in a ring station, cypress knees breaking brown water, the far side of the ring curving up through mist.',
  // Overgrown Robots
  'overgrown-robots':
    'A toppled walking machine in a meadow, ferns growing from its joints, a fox asleep in the cavity of its chest.',
  // Parallel Monasteries
  'parallel-monasteries':
    'Two identical cloisters side by side in the same frame, one in summer and one in deep snow, the same monk walking in each.',
  // Post-Human Ritual
  'post-human-ritual':
    'Tall thin figures of ceramic and wire standing in a circle on a salt flat, holding hands, at first light.',
  // Prismatic Fungi
  'prismatic-fungi':
    'A cluster of glass-capped mushrooms splitting a shaft of cave light into hard colour bands across wet stone.',
  // Quantum Gardens
  'quantum-gardens':
    'A walled garden where every plant is faintly doubled, each flower slightly out of register with itself, gravel path crisp.',
  // Reality Slightly Wrong
  'reality-slightly-wrong':
    'A suburban street at midday where every shadow falls the same direction except one, which points at the viewer.',
  // Reluctant Protagonist
  'reluctant-protagonist':
    'A person sitting on a packed rucksack at a crossroads, chin on fist, deliberately not looking down the road they must take.',
  // Retired Hero
  'retired-hero':
    'A vegetable garden with a legendary sword driven into the soil as a trellis stake, beans climbing the blade.',
  // Reverse Gravity Wells
  'reverse-gravity-wells':
    'A waterfall running upward from a lake into a hole in the sky, spray hanging in the air around its base.',
  // Sacred Geometry
  'sacred-geometry':
    'A stone floor inlaid with an enormous interlocking pattern, light through a pierced dome landing exactly on its centre.',
  // Sacrificial Engines
  'sacrificial-engines':
    'A furnace hall where a great machine is fed something precious on a chain hoist, workers watching from the gantry.',
  // Solarpunk Cathedrals
  'solarpunk-cathedrals':
    'A cathedral of laminated timber and coloured photovoltaic glass, gardens on every buttress, light thrown in colour across a nave floor.',
  // Spore Choirs
  'spore-choirs':
    'A cave of fungal stalks arranged like organ pipes, dust rising from them in ordered pulses, faintly lit from below.',
  // Still Operating
  'still-operating':
    'An automated factory running perfectly in an empty building, conveyor stacking finished goods no one will collect, dust thick on the windows.',
  // Submerged Skyscrapers
  'submerged-skyscrapers':
    'Tower tops breaking a calm sea like islands, a boat moored to a roof aerial, fish moving through an upper-floor window.',
  // Synthetic Eden
  'synthetic-eden':
    'A biodome orchard with perfect fruit under magenta grow light, a technician tasting an apple and pausing.',
  // Techno-utopia
  'techno-utopia':
    'A clean high city at dusk seen from a park bench, transit ribbons arcing overhead, someone feeding actual ducks.',
  // Tethered Planets
  'tethered-planets':
    'Two worlds close enough to share an atmosphere, linked by a vast cable, weather spiralling along it between them.',
  // The Library Between Dimensions
  'the-library-between-dimensions':
    'A library whose corridors meet at wrong angles, stairs running along the walls, one door opening onto open sky.',
  // Time-Bent Shrines
  'time-bent-shrines':
    'A wooden shrine gate photographed at four seasons at once, each post in a different weather, the path beneath clear.',
  // Virtual Afterlife
  'virtual-afterlife':
    'A sunlit meadow that resolves into flat coloured blocks near the edges, a figure walking toward where the detail stops.',
  // Whispering Satellites
  'whispering-satellites':
    'A derelict satellite tumbling slowly against Earth\'s night side, dish still turning, city lights below in gold threads.',
  // Zero-G Opera
  'zero-g-opera':
    'A performance in a spherical hall with the audience seated on every surface, singers turning slowly in mid-air at the centre.',

  // ── PROMPT_ENHANCEMENT ──
  //
  // One shared scene could not do this, and the two attempts failed at
  // opposite ends of the same mistake. v1 -- a pear and a marble under flat
  // light -- gave the techniques nothing to ACT ON: no light source to make
  // volumetric, no metal to gild. v2 put all of it in frame, and then the
  // scene was already doing every effect at maximum, so naming one changed
  // nothing: volumetric light and gilded shimmer came back as the same
  // photograph (Silas, 2026-09-15: "volumetric and gilded shimmer are not
  // recognizably different from my eyes"). Only bokeh worked, because a lens
  // operation can transform any frame at all.
  //
  // So each technique now gets a scene chosen so the image IS the technique:
  // volumetric light is dust in a shaft, gilded shimmer is gold leaf under a
  // burnisher, subsurface scattering is a hand held against a window. Direct
  // A/B comparison is given up, and it was never paying for itself -- 45
  // identical pears compared nothing. A picker card has to say its own name at
  // a glance, which is the same conclusion the genre cards reached.
  // ambient occlusion
  'ambient-occlusion':
    'Plain white plaster spheres and cubes crowded together on white paper under flat light, every point of contact darkening to soft grey where the surfaces meet.',
  // bokeh background
  'bokeh-background':
    'A single wet leaf held close to the lens, a street of hanging festival lights behind it dissolved into large soft circles of gold and red.',
  // cinematic lighting
  'cinematic-lighting':
    'A figure standing in a doorway lit hard from one side and edged in cold blue from behind, the rest of the room falling away to black.',
  // clean background
  'clean-background':
    'A single red enamel teapot on a seamless white sweep, nothing else from edge to edge, its shadow a soft pool directly beneath it.',
  // color harmony
  'color-harmony':
    'Folded cloths laid out in ochre, rust and deep amber with one narrow teal ribbon across them, every colour agreeing with its neighbour.',
  // cool reflections
  'cool-reflections':
    'A chrome ball bearing resting on blue glass under an overcast skylight, the whole cold room curving across its surface.',
  // crisp geometry
  'crisp-geometry':
    'Machined aluminium blocks stacked beside a steel rule on a matte bench, every edge dead straight and every corner square under even light.',
  // depth of field
  'depth-of-field':
    'Five brass thimbles in a row receding across a table, the third one perfectly sharp while those in front and behind melt away.',
  // digital painting
  'digital-painting':
    'A harbour at dusk in broad confident digital brushwork, colour blocked in flat and blended soft, the strokes still visible.',
  // dramatic shadows
  'dramatic-shadows':
    'A slatted blind throwing hard bars of light across an empty office wall and floor, a chair cut in half by the pattern.',
  // dynamic lightfall
  'dynamic-lightfall':
    'Sunlight breaking through moving cloud onto a green hillside, bright patches sweeping across the grass while the rest lies in shade.',
  // epic scene composition
  'epic-scene-composition':
    'A lone rider tiny at the foot of a vast canyon wall, the land sweeping back through three ranges of cliffs toward a distant storm.',
  // film grain
  'film-grain':
    'A black and white street photograph on pushed high-speed stock, heavy silver grain across the pale sky and in the shadows under a café awning.',
  // fine brush strokes
  'fine-brush-strokes':
    'A close view of an oil portrait\'s cheek where each small sable stroke of pink and cream sits separately on the canvas weave.',
  // gilded shimmer
  'gilded-shimmer':
    'A restorer laying gold leaf onto a carved frame, the fresh gold flaring where the burnisher has passed and lying dull where it has not.',
  // glass-like skin
  'glass-like-skin':
    'A porcelain doll\'s face under soft window light, the surface so smooth and faintly translucent that the light sinks a little before it returns.',
  // glowing pigments
  'glowing-pigments':
    'Powdered pigments heaped in open jars under ultraviolet light, the magenta and green burning far brighter than the dim room around them.',
  // gradient brilliance
  'gradient-brilliance':
    'A length of silk lifted from a dye bath, running from deep indigo through violet to pale gold in one unbroken sweep.',
  // highlighted contours
  'highlighted-contours':
    'A dark bronze torso lit by a single lamp high to one side, a thin bright line following every muscle and every edge.',
  // holographic glow
  'holographic-glow':
    'A sheet of holographic foil stickers tilted toward a window, rainbow interference sliding across the surface as the angle changes.',
  // impeccable contrast
  'impeccable-contrast':
    'A white ceramic cup on black velvet, the white holding full detail and the black going to true depth with nothing muddy between them.',
  // intricate patterning
  'intricate-patterning':
    'The corner of a hand-knotted carpet filled edge to edge with tiny repeating floral medallions in madder and indigo.',
  // layered complexity
  'layered-complexity':
    'A forest interior with ferns in the foreground, trunks in the middle distance, and mist-separated ridges stacking away behind.',
  // luxurious textures
  'luxurious-textures':
    'Crushed velvet, heavy silk, dense fur and a gold tassel heaped together, each fabric catching the light in its own way.',
  // macro fidelity
  'macro-fidelity':
    'An extreme close view of a bee\'s eye and the fine hairs on its face, every facet and every hair resolved.',
  // moody atmosphere
  'moody-atmosphere':
    'A rain-wet alley at night under one sodium lamp, fog holding the light low and everything beyond it blue-grey.',
  // neon reflections
  'neon-reflections':
    'Wet city pavement beneath a pink and cyan sign, the letters stretched into long coloured streaks across the standing water.',
  // oil on canvas effect
  'oil-on-canvas-effect':
    'A still life of lemons in thick oil paint, ridges of pigment standing up where the knife passed, canvas weave showing at the edges.',
  // painterly mood
  'painterly-mood':
    'A riverbank in summer rendered loosely, edges dissolved and forms suggested rather than described, colour doing all the work.',
  // photo-real shadows
  'photo-real-shadows':
    'A wooden chair on a concrete floor in afternoon sun, its shadow sharp at the legs and softening as it travels away.',
  // photoreal lighting
  'photoreal-lighting':
    'A kitchen window in morning light with a bowl of eggs on the sill, lit exactly as a camera would record it.',
  // precise rim light
  'precise-rim-light':
    'A black cat against a black studio background with one strip light behind, a clean bright edge tracing its back and its ears.',
  // ray tracing
  'ray-tracing':
    'Clear glass spheres clustered on white marble under one bright source, throwing sharp caustic patterns of light across the stone.',
  // renaissance realism
  'renaissance-realism':
    'A three-quarter portrait of a young woman in a dark green gown before a shuttered window, softly modelled in the Florentine manner.',
  // rich color grading
  'rich-color-grading':
    'A desert highway at golden hour with warm highlights and cool teal shadows, the whole frame pushed toward a film look.',
  // sharp focus
  'sharp-focus':
    'A dandelion clock against a plain dark field, every seed and filament rendered crisply from one edge of the frame to the other.',
  // soft bloom
  'soft-bloom':
    'A bedroom window at sunrise where the light spills past the frame and blooms gently into the room.',
  // studio photography
  'studio-photography':
    'A pair of leather boots on a seamless grey backdrop under a large softbox with a reflector below, catalogue-clean.',
  // subsurface scattering
  'subsurface-scattering':
    'A hand held up against a bright window, the fingers glowing deep red where the light passes through the flesh.',
  // symmetric composition
  'symmetric-composition':
    'A tiled hall photographed dead centre, the vaulted ceiling and two rows of columns mirroring exactly about the middle line.',
  // ultra-smooth edges
  'ultra-smooth-edges':
    'Three matte resin shapes on a pale surface, every outline clean and unbroken, the surfaces without grain or pitting.',
  // ultra textured
  'ultra-textured':
    'A weathered oak door seen close, deep grain and flaking paint and rusted nail heads and lichen all raised under raking light.',
  // vivid chroma
  'vivid-chroma':
    'A market stall of powdered holi colours heaped in cones of magenta, emerald and cobalt, saturated to the very limit.',
  // volumetric light
  'volumetric-light':
    'Dust turning in hard shafts of sunlight falling through a high broken window into a dark stone hall, each beam solid in the air.',
  // warm highlights
  'warm-highlights':
    'A copper kettle on a stove in late afternoon, the light picking out warm orange highlights along its shoulder and its handle.',
}
