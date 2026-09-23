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
  // ── Genres frozen on static assets: their stored prompts were the old
  //    'Illustrate the Facet concept ...' wrapper, which the contract gate
  //    rejects, so no job could ever be created for them. Each of these keeps
  //    the specific image its own description already named. ──
  // Animist
  'animist':
    'A mossed boundary stone at a forest path\'s fork, worn smooth where centuries of hands have touched it in passing, one fresh coin left on top.',
  // Comedy
  'comedy':
    'A waiter mid-stumble with a full tray held impossibly level above his head, every diner at the long table turned to watch except one, who is eating.',
  // Cosmic Dread
  'cosmic-dread':
    'A shepherd standing on a bare ridge beneath a moon that fills half the sky, and set into its surface, small and rectangular and unmistakable, a door.',
  // Cozy Horror
  'cozy-horror':
    'A cup of tea steaming on a windowsill in a warm lamplit kitchen, and pressed flat against the dark glass from outside, a wide pale hand.',
  // Dieselpunk
  'dieselpunk':
    'A riveted steel locomotive hauled up on blocks in a soot-blackened yard, mechanics swarming its flank, fuel drums stacked three high against the brick wall behind.',
  // Fantasy
  'fantasy':
    'High on a castle battlement at dusk, a dragon lies coiled with a small book open on one claw, reading, entirely unbothered by the archers below.',
  // Gothic Comedy
  'gothic-comedy':
    'A funeral party crowded into a marble crypt, all in black, all waiting, while the undertaker searches his pockets for a key he has clearly lost.',
  // Horror
  'horror':
    'A lantern set down in a dark wood, and reaching out from inside its glass, thin and lit from within, a human hand.',
  // Kaiju
  'kaiju':
    'A single scaled foot planted across four city blocks, cars and rooftops crushed flat beneath it, the creature above looking away at something on the horizon.',
  // Mystery
  'mystery':
    'A gloved hand holding a magnifying glass turned outward at the viewer, one enormous eye filling the lens, a rain-streaked street behind.',
  // Mythic Sci-Fi
  'mythic-sci-fi':
    'A bronze-armoured giant seated on the launch gantry of a rocket, one hand resting on the fuselage, the countdown board lit behind their shoulder.',
  // Pastoral Apocalypse
  'pastoral-apocalypse':
    'A farmhouse washing line hung with sheets snapping in the wind, under a sky gone green from horizon to horizon.',
  // Romance
  'romance':
    'On a bridge at night, two figures rest their hands on the rail almost but not quite touching, both looking off at the same distant lit window.',
  // Solarpunk
  'solarpunk':
    'A tower block cased in vegetable gardens and glass, a woman on a walkway pinning a blueprint to a trellis while a cargo kite drifts past behind her.',
  // Steampunk
  'steampunk':
    'A brass diving apparatus laid open on a workbench, its gears exposed and its goggles propped on top, steam still bleeding from a cracked copper pipe.',
  // Absurdist Strategy
  'absurdist-strategy':
    'A war-room table where the battle map is laid out in breakfast things, one officer nudging a boiled egg forward with a ruler under a low hanging lamp.',
  // Academic Eldritch
  'academic-eldritch':
    'An empty lecture hall after midnight, pale green tendrils creeping out of a cracked slate blackboard and across the vaulted ceiling, a brass lectern lamp still burning over rows of empty oak benches.',
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
    'A long stone hall where a line of robed wizards, a knight and a small dragon wait on wooden benches, each clutching a sealed blank scroll, while a tired clerk behind a brass grille stamps a wax seal.',
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
    'A crow on a fence post at dusk, head tilted, its eye fixed on one bright bottle cap in the grass below.',
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
    'Two identical cloisters side by side, one in summer and one in deep snow, the same monk walking in each.',
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
    'A desert highway at golden hour with warm highlights and cool teal shadows, soft film grain and gently faded blacks.',
  // sharp focus
  'sharp-focus':
    'A dandelion clock against a plain dark field, every seed and filament rendered crisply from the nearest seed to the farthest.',
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

  // ── Facets still carrying the older 'Illustrate the Facet concept ...'
  //    wrapper, which the contract gate rejects outright. Each keeps the image
  //    its own description already named. ──
  // Alchemist
  'alchemist':
    'A cluttered bench where one flask has just turned clear, its owner already reaching past it for the next, unsurprised.',
  // Artificer
  'artificer':
    'A workshop wall hung with a machine built from three other machines, its maker adding a fourth arm to it in good light.',
  // Assassin
  'assassin':
    'Deep in a colonnade\'s shadow a still figure waits, watching a lit doorway across the courtyard where someone stands unaware.',
  // Bard
  'bard':
    'A lute propped against a tavern chair with a notice of safe conduct tucked under its strings, ale rings drying on the table.',
  // Bounty Hunter
  'bounty-hunter':
    'A folded contract held in a gloved hand at the rail of a crowded market balcony, far below it the one person not moving.',
  // Cleric
  'cleric':
    'Someone kneeling to bandage a wounded stranger in a ruined chapel, the gold light from the window falling well behind them.',
  // Clown
  'clown':
    'Full greasepaint and a ruffled collar at a bus stop in the rain, the face beneath the makeup thinking about something else.',
  // Criminal Mastermind
  'criminal-mastermind':
    'One finger resting on a city map spread across a billiard table, three glasses set out where three people will sit.',
  // Cupid
  'cupid':
    'A small winged figure sitting on a park wall at a comfortable distance, watching two strangers discover the same bench.',
  // Druid
  'druid':
    'Someone standing across a logging road with their hand flat against the bark of the last uncut tree, machines idling ahead.',
  // Gambler
  'gambler':
    'Cards laid face down under a low green lamp, one hand resting flat beside them, the pot heaped and unattended.',
  // Groupie
  'groupie':
    'One upturned face lit from the stage in a dark crowd, entirely absorbed, while everyone around is filming instead.',
  // Mad Scientist
  'mad-scientist':
    'A figure turning toward the room with delight while behind them something in a tank has grown a second working eye.',
  // Mime
  'mime':
    'White gloves pressed against a wall that is not there, on an empty plaza where the pigeons have started walking around it.',
  // Monk
  'monk':
    'Sweeping a stone courtyard at first light, the broom moving evenly, a staff leaning within arm\'s reach against the pillar.',
  // Musician
  'musician':
    'Eyes shut over a battered saxophone in a near-empty club, turned away from the tables toward the amplifier.',
  // Netrunner
  'netrunner':
    'Someone half-lit by a screen in a dark room, their hands on a deck whose cables run up into nothing above them.',
  // NPC
  'npc':
    'A villager standing at a precise spot beside a well, facing the road, mouth open on a sentence they have said before.',
  // Oracle
  'oracle':
    'An old woman in a doorway watching a young traveller approach, already deciding how much of it to say.',
  // Paladin
  'paladin':
    'Armour laid out piece by piece on a stone floor at dawn, its wearer sitting beside it with their hands empty.',
  // Performance Artist
  'performance-artist':
    'A person suspended in a harness above a gallery floor, pouring honey slowly onto a chair while staff watch from the doorway.',
  // Philanthropist
  'philanthropist':
    'A cheque passed across a folding table to a woman whose hands have gone to her face, the giver looking slightly away.',
  // Poet
  'poet':
    'An open notebook on a windowsill above a wet street, its writer turned toward the glass, head tilted, listening.',
  // Politician
  'politician':
    'Mid-gesture at a lectern with one hand raised to the room, the other hidden below the wood.',
  // Polymath
  'polymath':
    'A room where a half-built telescope, an opened clock and a pinned butterfly share one table, their owner starting a fourth thing.',
  // Ranger
  'ranger':
    'A figure at the treeline where the field ends, bow slung, looking back along the way they came rather than ahead.',
  // Reporter
  'reporter':
    'Someone in a cordoned doorway with a notebook out, taking down what they can see past the shoulder of the officer blocking it.',
  // Rogue
  'rogue':
    'A hand testing a shuttered window from a narrow alley while the street beyond carries on in daylight.',
  // Slacker
  'slacker':
    'A person lying full length on a sunlit lawn with a bicycle fallen beside them, eyes open, entirely unhurried.',
  // Super Hero
  'super-hero':
    'Someone standing on a rooftop with their back to the city, behind them a bridge already buckling and traffic stopped.',
  // Super Villain
  'super-villain':
    'A figure mid-speech on a gantry above a great machine, arms wide, addressing something restrained and offscreen below.',
  // Troublemaker
  'troublemaker':
    'A kid slipping out of a side door with a delighted expression while behind them a stack of crates goes over.',
  // Warlock
  'warlock':
    'A man at a desk rereading a signed page by candlelight, the wax seal broken, the room around him long since gone cold.',
  // Warrior
  'warrior':
    'A scarred fighter walking straight up the centre of a rubble-strewn street, shield low, everyone else in doorways.',
  // Waste of Space
  'waste-of-space':
    'A person occupying an armchair with total commitment in a room where three other people are clearly trying to work.',
  // Witch
  'witch':
    'A cellar door propped open with a stone and a woman going down the steps with a lamp, the workbench behind her still lit.',
  // Wizard
  'wizard':
    'An old man at a lectern with a book open before him, annotating the margin of a page in small firm handwriting.',
  // Celtic Mythology
  'celtic-mythology':
    'A ring of standing stones on a wet green hillside at dusk, one stone carved with spirals, sheep grazing between them.',
  // Cli-Fi (Climate Fiction)
  'cli-fi-climate-fiction':
    'Floodwater standing level with the porch steps along a suburban street, a family carrying boxes out to a boat at the kerb.',
  // Cozy Undead
  'cozy-undead':
    'A skeleton in a knitted cardigan pouring tea for two in a warm kitchen, waiting for someone who has not arrived yet.',
  // Eastern European Folklore
  'eastern-european-folklore':
    'A wooden house standing on two enormous bird\'s legs in a birch wood, its shutters open, a path of bones leading up to it.',
  // Noir
  'noir':
    'A man in a wet overcoat under a street lamp at three in the morning, the fog taking the far end of the road entirely.',
  // Oceanic Mythology
  'oceanic-mythology':
    'An outrigger canoe drawn up on black sand beneath carved wooden figures facing out to a bright and empty ocean.',
  // Accountant
  'accountant':
    'A late office where one person has stopped with a finger on a printed column, the rest of the floor dark behind them.',
  // Creative Writer
  'creative-writer':
    'Someone at a cafe window watching an argument outside, their notebook already open and their coffee going cold.',
  // Doctor
  'doctor':
    'A surgeon leaning close under a bright lamp, absolutely still, their assistant watching their hands rather than the patient.',
  // Hacker
  'hacker':
    'A quiet apartment where someone reads a scrolling access log with mild interest, the log being a record of themselves.',
  // Lawyer
  'lawyer':
    'Documents squared in three exact rows across a boardroom table, one page turned face up, its reader already standing.',
  // Public Notary
  'public-notary':
    'An old brass stamp resting on a signed page, its keeper looking steadily at the person across the counter, saying nothing.',
  // Space Lawyer
  'space-lawyer':
    'A woman in a plain suit closing a folder at her desk, and through the window behind her a planet that should not be there.',
  // Infinite Archive
  'infinite-archive':
    'Shelves running up out of sight above a reading table, where one open book has a single eye looking out of the page.',
  // Unusual Perspective
  'unusual-perspective':
    'A kitchen seen from inside the open refrigerator, the cook leaning in with a hand out, lit entirely by the shelf lamp.',
  // physically accurate materials
  'physically-accurate-materials':
    'A cut log, a sheet of hammered copper and a block of wet clay set side by side on a bench, each taking the light its own way.',
  // ── 2026-09-22: Facets that were rendering from their title plus one shared
  //    taxonomy clause and nothing else -- 353 rows across ten taxonomies, the
  //    GENRE/THEME cohort visibly the same crowd in the same weather ("Fantasy
  //    Noir", "Mystery Sci-Fi", "Musical Adventure"). The card-copy rebuild
  //    correctly dropped their descriptions, which left the clause as the whole
  //    prompt. One authored scene each. ──
  // ── GENRE (2026-09-22) ──
  // Absurdist Comedy
  'absurdist-comedy':
    'An office clerk in a grey suit calmly types at a desk floating in a swimming pool, a giraffe in a necktie waiting beside him holding a stack of blank paper under humming fluorescent lights.',
  // African Mythpunk
  'african-mythpunk':
    'A young woman in patterned indigo cloth rides a giant chameleon through a baobab forest at dusk, her copper arm bracelets glowing, while a masked spirit made of woven raffia walks beside her.',
  // Afrofuturism
  'afrofuturism':
    'Tall towers shaped like carved wooden sculptures rise over a savanna city at sunrise, a pilot in a gold-trimmed kente flight suit stepping from a sleek hovercraft onto a terracotta landing pad.',
  // AI Utopia
  'ai-utopia':
    'A sunlit plaza of white terraces and hanging gardens where slender silver robots tend fruit trees while families picnic on the lawn, one quiet child staring at a dusty old stone workshop across the square.',
  // Alien Invasion
  'alien-invasion':
    'Three enormous black tripod machines stride across a flooded wheat field under a bruised purple sky, as townspeople carrying suitcases run along a country road past an overturned tractor.',
  // Alternate History
  'alternate-history':
    'Giant brass airships moor above a Victorian-era Manhattan harbor in afternoon haze, steam trams crossing a cast-iron bridge while dockworkers in flat caps unload crates from a paddle steamer.',
  // Asian Fantasy
  'asian-fantasy':
    'A white fox spirit with nine tails leaps between floating pagoda rooftops above a misty mountain valley, paper lanterns drifting upward past a pale jade moon and crooked pine trees.',
  // Astrobiological Adventure
  'astrobiological-adventure':
    'Two scientists in orange pressure suits kneel on an icy alien shore, one lowering a glass sample vial toward a pool where translucent ribbon-shaped creatures pulse with faint blue light beneath twin setting suns.',
  // Biopunk
  'biopunk':
    'Inside a cramped back-room clinic lit by green tube lamps, a surgeon in a stained apron grafts glossy iridescent scales onto a young man\'s forearm, jars of pink cultured tissue crowding the metal shelves.',
  // Crime Noir
  'crime-noir':
    'A tired detective in a wet fedora stands beside a black sedan under a flickering streetlamp at midnight, cigarette smoke curling past his face, rain streaming down a brick alley toward an open cellar door.',
  // Cyberpunk Fiction
  'cyberpunk-fiction':
    'A teenage hacker with a chrome cybernetic arm crouches on a rain-soaked rooftop at night, soldering wires into a stolen drone, pink and cyan light from the towers below glowing through the drizzle and steam vents.',
  // Dark Academia
  'dark-academia':
    'Two students in tweed coats bend over a brass orrery, closed leather volumes and a human skull on the long oak table of a Gothic library at two in the morning, snow tapping against tall arched windows.',
  // Dark Fairy Tale
  'dark-fairy-tale':
    'A barefoot girl in a red wool cloak stands at the edge of a black pine forest at twilight, holding out a silver key toward a tall antlered figure whose long fingers are twisted branches.',
  // Dreamlike Surrealism
  'dreamlike-surrealism':
    'Melting grandfather clocks float above a pink desert where a staircase rises into the clouds, a man in a bowler hat climbing it with a goldfish bowl, long shadows pointing three different directions.',
  // Dystopia
  'dystopia':
    'Identical grey concrete apartment blocks stretch to the horizon beneath a smog-yellow sky, rows of workers in matching grey overalls marching in step past tall surveillance cameras on steel poles.',
  // Dystopian Romance
  'dystopian-romance':
    'Two young people in drab uniforms press their hands together through a gap in a chain-link fence topped with razor wire, searchlights sweeping the muddy yard behind them at night.',
  // Epic Fantasy
  'epic-fantasy':
    'Vast armies of knights, elves and giants gather on a green plain below a mountain fortress carved into a cliff, dragons circling storm clouds overhead as dawn breaks across a winding river.',
  // Epistolary Fiction
  'epistolary-fiction':
    'A cluttered writing desk by a rainy window holds bundles of sealed envelopes tied with twine, a brass inkwell, a quill pen, red wax seals and a cracked pocket watch under one oil lamp.',
  // Everyday Animist Fantasy
  'everyday-animist-fantasy':
    'A cozy farmhouse kitchen at breakfast, where a copper kettle with tiny blinking eyes whistles on the stove, a teapot bows to an old woman in an apron, and a smiling cloud drifts past the window.',
  // Everyday Wonder
  'everyday-wonder':
    'A postwoman on a bicycle delivers parcels along a quiet suburban street on a clear morning, a small friendly dragon riding in her basket and a floating goldfish trailing behind her through the warm air.',
  // Fantasy Noir
  'fantasy-noir':
    'Rain-slicked cobblestones gleam at night where a dwarf detective in a long coat crouches over a smoking burn mark, a pale elf informant lurking in a doorway with violet sparks at her fingertips.',
  // Folk Fantasy
  'folklore':
    'Villagers in embroidered wool clothing gather around a bonfire in a snowy clearing, an old grandmother telling a tale while a pair of glowing eyes watches from the dark birch trees.',
  // Gaslamp Fantasy
  'gaslamp-fantasy':
    'Gas streetlamps glow along a foggy London square at dusk, where a lady in a bustle gown and top hat steps from a horse-drawn carriage, a spectral hound of pale blue mist padding beside her.',
  // Grimdark Fantasy
  'grimdark-fantasy':
    'A mud-spattered mercenary in dented plate armor trudges through a burned village beneath a heavy grey sky, crows perched on a broken wagon and smoke rising from blackened timber houses.',
  // Heroic Fantasy
  'heroic-fantasy':
    'A muscular barbarian swordswoman with braided red hair braces on a crumbling temple stair, raising a gleaming broadsword against a giant serpent coiled around a stone pillar, torchlight flashing on its green scales.',
  // Historical Fantasy
  'historical-fantasy':
    'Within a lamplit Venetian palazzo around 1600, a masked alchemist in velvet robes releases a small silver phoenix from a glass alembic while a noblewoman in a lace ruff watches beside a gilded harpsichord.',
  // Hopepunk
  'hopepunk':
    'Neighbors in patched jackets rebuild a storm-damaged rooftop greenhouse together at sunrise, passing seedlings and glass panes hand to hand, a teenager hanging string lights across the steel beams.',
  // Horror Fantasy
  'horror-fantasy':
    'A lone knight holding a guttering torch stands in a vast fungal cavern, gazing up at a colossal pale creature with dozens of human hands clinging to the dripping ceiling above him.',
  // Indigenous Futurism
  'indigenous-futurism':
    'Domed earthen homes with solar roofs sit among restored prairie grass at dusk, an elder in a beaded jacket teaching a young girl to fly a feathered drone over a grazing bison herd.',
  // Interactive Fiction
  'interactive-fiction':
    'An explorer with a lantern stands where a stone corridor splits into three doorways glowing red, blue and green, each opening onto a different landscape of jungle, ice and desert.',
  // Isekai
  'isekai':
    'A startled office worker in a crumpled business suit sits in a sunny meadow of giant flowers, clutching his briefcase as a slime creature, a catgirl adventurer and a tiny dragon gather curiously around him.',
  // Japanese Folkloric Fantasy
  'japanese-folkloric-fantasy':
    'A kappa with a water-filled dish on its head sits on a mossy riverbank beside a red torii gate at dusk, trading cucumbers with a small boy in a straw hat while fireflies rise from the reeds.',
  // Latin American Magical Realism
  'latin-american-magical-realism':
    'An elderly woman calmly hangs laundry in the sunlit courtyard of a pastel colonial house, yellow butterflies swarming around her while her granddaughter floats a meter above the tiled patio eating a mango.',
  // Martian Colonization
  'martian-colonization':
    'Pressurized white habitat domes cluster on a rust-red plain under a butterscotch sky, colonists in dusty suits hauling a sled of ice blocks past greenhouse tunnels and a parked rover.',
  // Medieval Fantasy
  'medieval-fantasy':
    'A stone castle crowns a hill above a thatched village on market day, blacksmiths hammering horseshoes and merchants selling bread and cloth as a wizard in a blue robe passes a knight\'s horse on the cart road.',
  // Monster Romance
  'monster-romance':
    'A towering horned beast with shaggy dark fur and gentle amber eyes kneels in a lantern-lit garden, offering a single white rose to a smiling young woman wearing a silk dress beneath a full moon.',
  // Musical Adventure
  'musical-adventure':
    'A troupe of costumed singers and dancers leaps across the deck of a riverboat at sunset, a fiddler on the rail and a drummer on the wheelhouse roof, while the crowd on shore joins the dance.',
  // Mystery Sci-Fi
  'mystery-sci-fi':
    'An investigator in a white lab coat studies a glowing holographic DNA helix floating above a dead crewman in a starship medical bay, cold blue light gleaming off steel instruments and a shattered cryopod.',
  // Mythic Heist
  'heist-mythology':
    'Four thieves in dark hooded gear rappel down the walls of a golden mountain vault toward a sleeping dragon curled around a heap of treasure, one holding a rolled blueprint, another swinging a grappling hook.',
  // Mythpunk
  'mythpunk':
    'A girl with a shaved head and a bone-bead necklace paints a vivid mural of a horned goddess onto a subway wall with a wide brush, a live raven perched on her shoulder under flickering orange tunnel lights.',
  // Nanopunk
  'nanopunk':
    'A grey-coated woman raises her hand as a shimmering silver cloud of microscopic machines pours from a street drain, assembling a bench and a lamppost on an empty morning sidewalk.',
  // Noir Thriller
  'noir-thriller':
    'Rain-soaked rooftop at night, a fugitive in a rumpled suit sprinting across it clutching a leather briefcase, helicopter spotlights sweeping behind him as gunmen in dark coats burst from a stairwell door.',
  // Nordic Noir
  'nordic-noir':
    'A female detective wearing a heavy parka stands on a frozen fjord under the pale midnight sun, orange marker flags ringing a red fishing hut, snowy mountains and a lone patrol car on the shore behind her.',
  // Pastoral
  'pastoral':
    'Sheep graze on rolling green hills dotted with wildflowers on a warm spring afternoon, a shepherd boy playing a wooden flute beneath an oak tree beside a stone cottage and a winding creek.',
  // Pirate Adventure
  'pirate-adventure':
    'A three-masted pirate galleon with black sails fires its cannons across choppy turquoise water, sailors swinging on ropes toward a merchant ship while a parrot circles the crow\'s nest.',
  // Post-Human Dystopia
  'post-human-dystopia':
    'Pale elongated beings with translucent skin and glowing implanted spines drift through an overgrown ruined city, tending a vast glass tank where rows of sleeping ordinary humans float in green fluid.',
  // Psychological Horror
  'psychological-horror':
    'Three in the morning in a narrow hallway: a barefoot woman wearing a nightgown faces a tall mirror where her reflection smiles back while her own face looks frightened.',
  // Retro-Futurism
  'retro-futurism':
    'A gleaming chrome rocket car with tall tail fins cruises along an elevated highway past bubble-domed houses and atomic-shaped towers, a smiling family in 1950s clothing waving from the open cockpit on a bright afternoon.',
  // Science Fantasy
  'science-fantasy':
    'A robed sorceress casts spirals of violet flame beside a battered starship on a crystal plateau, while a cyborg knight with a glowing plasma sword guards the landing ramp beneath two ringed moons.',
  // Science Romance
  'science-romance':
    'A narwhal-shaped brass submarine surfaces through an arctic sea at dawn, gentlemen explorers in waistcoats and goggles standing on its riveted deck, pointing toward a glowing ice cavern.',
  // Shonen
  'shonen':
    'A spiky-haired teenage boy in a torn orange training outfit throws a punch at a waterfall, a crackling blue energy aura around his fists, while his grinning rival and an old master watch from a mossy boulder.',
  // Space Pirates
  'space-pirates':
    'Armed raiders in patched space suits cut through the hull of a cargo freighter with a sparking laser torch, their rusty corvette grappled alongside against a swirling orange nebula and drifting asteroid debris.',
  // Techno-Thriller
  'techno-thriller':
    'Deep red light fills a submarine control room, where a sonar officer in headphones leans toward a glowing green waveform display, the captain gripping the periscope rail and three crew members frozen mid-motion.',
  // Thriller
  'thriller':
    'A raincoated woman crouches behind a parked van in a concrete garage gripping a car key, while a black-gloved man with a flashlight walks slowly between the rows toward her.',
  // Time Travel
  'time-travel':
    'A scientist in a long coat steps out of a crackling brass sphere into a Roman forum at noon, startled senators in white togas backing away as blue lightning arcs across the marble columns.',
  // Vampire Gothic
  'vampire-gothic':
    'A pale aristocrat in a high-collared velvet coat descends the grand staircase of a crumbling mansion at midnight, candelabras glowing, a nervous guest in evening dress below and bats circling the vaulted ceiling.',
  // Weird Fantasy
  'weird-fantasy':
    'A walking city built on the back of a colossal six-legged snail crosses a purple salt flat, merchants trading glowing jellyfish from balconies in its spiral shell beneath three green suns.',
  // Western
  'western':
    'A lone cowboy on a dusty chestnut horse rides into a wooden frontier town at high noon, townsfolk watching from plank porches, tumbleweeds rolling past a sheriff standing beside a water trough.',
  // ── THEME (2026-09-22) ──
  // Dreams
  'dreams':
    'A bedroom doorway opens straight onto a moonlit ocean, a sleeping woman\'s bed drifting out across the calm water while paper boats and slow white whales swim through the starry air above her.',
  // Nightmares
  'nightmares':
    'A long hospital corridor lit by one buzzing bulb stretches into darkness, a tall figure with a smooth pale face standing at the far end beside a wheelchair, dozens of eyes blinking open along the peeling green walls.',
  // Tender
  'tender':
    'Gently tucking a knitted blanket around his sleeping wife, an old man sits in a hospital chair by a rainy window, soft lamplight on his wrinkled hands and tea steaming on the sill.',
  // ── SETTING (2026-09-22) ──
  // Bioluminescent Underground
  'bioluminescent-underground':
    'Vast limestone caverns glow turquoise and violet from giant mushrooms and hanging worm threads, an underground river winding between crystal columns and pale moss-covered rock ledges.',
  // Empty Parliament Thriller
  'empty-parliament-thriller':
    'Rows of empty green leather benches fill a grand wood-panelled parliament chamber at night, a single desk lamp lit beside the speaker\'s chair, a toppled chair on the carpet and tall doors standing ajar.',
  // Green Sky Apocalypse
  'green-sky-apocalypse':
    'Beneath a toxic emerald-green sky, a ruined highway overpass crumbles above abandoned cars half buried in pale dust, dead trees lining the road and a green glow flickering over the far city skyline.',
  // Old Forest Folklore
  'old-forest-folklore':
    'Ancient gnarled oaks draped in moss crowd a misty forest at dawn, a ring of white mushrooms circling a weathered standing stone, ribbons and small offerings tied to the lowest branches.',
  // Too-Close Moon Fairytale
  'too-close-moon-fairytale':
    'An enormous pockmarked moon hangs just above a sleepy hilltop village, filling half the night sky and pouring silver light over crooked rooftops, a tiny bridge and a windmill whose sails nearly touch its surface.',
  // Underground Society
  'underground-society':
    'A sprawling city carved into the walls of a giant cavern, with stacked stone homes, rope bridges and lantern-lit terraces, miners and market stalls crowding the banks of a glowing river far below.',
  // Underwater Cathedral
  'underwater-cathedral':
    'A drowned Gothic cathedral rests on the sandy seabed, shafts of blue sunlight falling through its stained glass windows, schools of silver fish drifting between stone columns and coral-covered pews.',
  // Village Creature Pastoral
  'village-creature-pastoral':
    'Round thatched cottages fill a peaceful valley village where fluffy horned creatures graze beside the sheep, a farmer\'s daughter brushing a moss-backed giant tortoise near a duck pond on a breezy morning.',
  // ── OCCUPATION (2026-09-22) ──
  // Accidental Diplomat
  'accidental-diplomat':
    'A startled young waiter in a white jacket stands between two rival generals at a candlelit banquet table, holding out a silver tray of pastries to both, while both men lower their raised fists and reach for one.',
  // Chaos Consultant
  'chaos-consultant':
    'Tweed suit, orange sneakers, calm smile: an elderly woman tips over a tall stack of office chairs in a glass boardroom at noon while four stunned executives in ties freeze around a long table.',
  // Chronicler of the Wrong
  'chronicler-of-the-wrong':
    'Hunched at a cluttered desk in a stone tower at dusk, a skinny bearded scribe in brown robes dips a quill into an inkpot beside a thick shut leather ledger, surrounded by tall stacks of closed ledgers and a guttering candle.',
  // Compliance Officer
  'compliance-officer':
    'A petite woman wearing a navy blazer with a lanyard and clipboard crouches on a factory floor, measuring the gap under a yellow safety railing with a steel tape, a hard hat tilted on her head under fluorescent lights.',
  // Containment Specialist
  'containment-specialist':
    'Wearing a bulky orange hazmat suit and rubber boots, a heavyset technician lowers a glowing green jar into a steel vault drawer in a cold white laboratory corridor, frost forming on the metal walls.',
  // Corporate Operative
  'corporate-operative':
    'Striding through a rain-slick parking garage at night, a sharp-jawed man wearing a charcoal suit and earpiece carries a locked aluminum briefcase, his polished shoes reflecting the yellow ceiling lamps.',
  // Debt Collector
  'debt-collector':
    'A gaunt old man dressed in a long black coat and bowler hat knocks on a peeling green door of a row house on a drizzly morning, a heavy iron-bound ledger tucked under one arm.',
  // Drone Wrangler
  'drone-wrangler':
    'Swinging a long lasso over her head, a sunburnt rancher woman dressed in a denim shirt, leather chaps and cowboy hat ropes a buzzing quadcopter drone above a dusty corral at noon, a dozen more drones hovering nearby.',
  // Grief Cartographer
  'grief-cartographer':
    'A soft-spoken woman in her sixties with silver hair and a knitted cardigan kneels on a wooden floor, drawing a large hand-painted map of rivers and islands with watercolors, a cup of tea cooling beside her.',
  // Investigator
  'investigator':
    'Kneeling on wet cobblestones under a streetlamp at midnight, a wiry woman detective in a belted tan trench coat and flat cap examines a muddy footprint with a brass magnifying glass, her flashlight beam angled low.',
  // Meeting Facilitator
  'meeting-facilitator':
    'Wearing a striped sweater and khakis, a cheerful middle-aged facilitator stands beside a tall pad of blank paper on an easel, holding a talking stick aloft toward a circle of eight seated coworkers in a sunny conference room.',
  // Middle Manager
  'middle-manager':
    'Squeezed between two towering stacks of paperwork on a crowded office floor, a balding man wearing a short-sleeved shirt and tie holds two ringing desk phones to both ears at late afternoon.',
  // Narrative Engineer
  'narrative-engineer':
    'In a workshop at night, a young woman in welding goggles and a leather apron solders brass gears onto a tall clockwork puppet theatre, tiny carved knights and dragons dangling from wires above the stage.',
  // Plague Baker
  'plague-baker':
    'Wearing a long-beaked plague doctor mask and a flour-dusted black apron, a tall baker slides a tray of dark green loaves into a roaring brick oven in a cramped medieval bakery before sunrise.',
  // Signals Intelligence
  'signals-intelligence':
    'In a dim bunker lined with humming radio sets, a young man with headphones and rolled shirt sleeves leans toward a crackling receiver, pencil raised over a pad, tuning dials glowing amber at 3 a.m.',
  // Transfer Student
  'transfer-student':
    'A lanky boy in a mismatched green uniform from another school clutches a backpack strap in a busy hallway on his first morning, while students in navy blazers pass by glancing at him.',
  // Unlicensed Exorcist
  'unlicensed-exorcist':
    'On a creaky attic floor, a scruffy young man wearing a thrift-store hoodie waves a garlic-stuffed sock and a flashlight at a flickering pale ghost hovering above a dusty rocking chair at midnight.',
  // Void Scout
  'void-scout':
    'Floating tethered outside a small silver spacecraft in pitch-black space, an astronaut in a white suit with orange stripes shines a helmet lamp into a swirling violet rift ahead, one arm outstretched.',
  // Weapons Systems Analyst
  'weapons-systems-analyst':
    'Leaning over a steel workbench in a bright hangar, a stocky woman in grey coveralls and safety glasses inspects a disassembled rifle with calipers, parts laid out in neat rows on a green mat.',
  // Xenobiologist
  'xenobiologist':
    'Kneeling in thick turquoise alien moss beneath two pale suns, a young scientist in a sealed white field suit uses tweezers to lift a wriggling pink tentacled creature into a glass specimen vial.',
  // ── ROLE (2026-09-22) ──
  // Ambient Threat
  'ambient-threat':
    'In a quiet laundromat at midnight, a tall broad man in a grey overcoat sits perfectly still on a plastic chair, hands folded, watching the spinning dryers while three other customers edge toward the door with half-folded shirts.',
  // Apex Predator
  'apex-predator':
    'Crouched on a rooftop ledge at dawn, a lean woman in her forties wearing black climbing gear and a dark braid watches the city street below, one gloved hand resting on a coiled rope, full body visible.',
  // Dark Parallel
  'dark-parallel':
    'Two identical young men face each other across a puddle on a foggy pier at dusk, one in a white shirt and the other in the same shirt dyed black, mirroring each other\'s raised right hand.',
  // Decommissioned Weapon
  'decommissioned-weapon':
    'Rusting quietly in a sunflower field, a giant retired battle robot kneels with its cannon arm resting in the dirt, while a small girl in yellow rain boots climbs its knee to hang a bird feeder.',
  // Decorative Element
  'decorative-element':
    'At a grand ballroom party, a young man clad in a powdered wig and gold-trimmed footman livery stands motionless beside a marble column holding a candelabra, while dancing guests in silk gowns swirl past him.',
  // Designated Protagonist
  'designated-protagonist':
    'A gawky teenage girl in a red hoodie and scuffed sneakers stands in a train station at sunrise, the one brightly lit figure among a crowd of commuters in muted grey coats who all turn to look at her.',
  // Ecosystem Keystone
  'ecosystem-keystone':
    'Knee-deep in a clear mountain creek, a bearded park ranger in olive waders stacks river stones into a small dam while trout gather in the pool behind it and a heron watches from the bank at morning.',
  // Invasive Species
  'invasive-species':
    'One bright purple flowering vine has swallowed an entire suburban cul-de-sac, curling over parked cars, mailboxes and rooftops, while a lone man in a bathrobe stands on his porch holding garden shears at dawn.',
  // Last Survivor
  'last-survivor':
    'A weathered man sporting a torn parka and snow goggles trudges alone across a vast frozen plain at twilight, dragging a wooden sled loaded with supplies, a line of footprints trailing behind him.',
  // Load-Bearing Wall
  'load-bearing-wall':
    'Braced beneath a sagging wooden ceiling beam in a crowded tavern, a huge muscular woman clad in a leather apron holds the beam up on her shoulders while cheerful patrons keep drinking at the tables around her.',
  // Passive Hazard
  'passive-hazard':
    'Asleep on a lawn chair in the middle of a busy hospital hallway, a plump man dressed in a Hawaiian shirt snores with his legs stretched out, while nurses pushing wheelchairs swerve around his sandals.',
  // Reluctant Chosen One
  'reluctant-chosen-one':
    'Clutching a mop, a skinny teenage janitor in overalls stares in dismay at a glowing sword that has floated out of a stone and into his free hand, in an empty school gym at dusk.',
  // Ship AI
  'ship-ai':
    'A glowing blue holographic woman made of soft light stands on the bridge of a spaceship, gesturing to a crew of three uniformed officers while stars streak past the wide curved window.',
  // The Bait
  'the-bait':
    'Sitting cross-legged in a forest clearing at dusk, a nervous young man sporting a bright red jacket holds up a roasted ham leg, while shadowy shapes of large wolves circle at the edge of the pines.',
  // The One Who Knows Where The Bodies Are
  'the-one-who-knows-where-the-bodies-are':
    'A quiet gravedigger in muddy boots and a flat cap leans on his spade in an overgrown churchyard at dusk, pointing with one finger at a patch of freshly turned earth between the tombstones.',
  // The One With The Forbidden Power
  'the-one-with-the-forbidden-power':
    'In a rain-soaked alley at night, a teenage girl wearing a school uniform raises both hands as crackling black lightning spirals from her fingertips, puddles lifting into the air around her boots.',
  // The Thing That Does The Thing
  'the-thing-that-does-the-thing':
    'A round brass robot the size of a washing machine rolls across a sunny kitchen floor, extending twelve jointed arms that simultaneously crack eggs, butter toast, water a plant and feed a cat.',
  // Unknown Function
  'unknown-function':
    'A lumpy bronze machine with three cranks, a bellows and a small bell rests on a cluttered attic workbench, while a frowning woman in a cardigan turns one crank, dust drifting in warm afternoon light from a round window.',
  // ── ARCHETYPE (2026-09-22) ──
  // Brand Ambassador
  'brand-ambassador':
    'Grinning wide, a stocky man in his thirties wearing a lime-green tracksuit hands out bright orange balloons from a bundle on a sunny beach boardwalk, arms stretched toward passing skaters.',
  // Corporate Synergy Entity
  'corporate-synergy-entity':
    'Five identical office workers in matching grey suits stand fused shoulder to shoulder into one wide ten-armed body, each arm holding a coffee mug, a stapler or a phone, in a beige cubicle aisle at midmorning.',
  // Institutional Memory
  'institutional-memory':
    'Surrounded by floor-to-ceiling filing cabinets in a dim basement archive, a wrinkled clerk in a cardigan and half-moon glasses climbs a rolling ladder to pull a yellowed folder from the highest drawer.',
  // Maritime Ecclesiastic
  'maritime-ecclesiastic':
    'Standing at the prow of a small fishing boat in choppy grey seas, an old priest in black cassock and oilskin cape raises a brass censer toward the waves, spray soaking his white beard.',
  // Probability Thief
  'probability-thief':
    'At a smoky casino roulette table, a slim young woman in a sequined emerald dress plucks a spinning white ball out of the air with two fingers while the croupier and gamblers stare with open mouths.',
  // Professional Disappearer
  'professional-disappearer':
    'A plain man clad in a beige raincoat steps sideways into a crowd of identical beige raincoats at a busy crosswalk on an overcast morning, half of his body already blending into the passing commuters.',
  // Reluctant Team Leader
  'reluctant-team-leader':
    'Standing on a folding chair in a muddy campsite at dawn, a tired young woman sporting a rumpled hoodie points at a hand-drawn trail map while six mismatched campers look up at her expectantly.',
  // Retired Villain
  'retired-villain':
    'Tending roses in a sunny cottage garden, a white-haired man in a black cape, gardening gloves and slippers snips a stem with shears, a dusty ray gun hanging as a hook for his watering can.',
  // Sword Saint
  'sword-saint':
    'An ancient barefoot swordswoman in a plain white robe stands on a mossy temple step in falling snow, her katana held level as a single snowflake splits in two across its edge.',
  // Tactical Coward
  'tactical-coward':
    'Peeking out from behind a stack of barrels during a pirate battle on a ship\'s deck, a skinny sailor in a striped shirt holds a frying pan over his head as cannon smoke drifts past.',
  // Thing That Hunts Things
  'thing-that-hunts-things':
    'Stalking through a misty swamp at dawn, a tall lanky creature-hunter in a patched leather duster and wide-brimmed hat carries a lantern and a harpoon, eyes fixed on ripples in the dark water.',
  // Tournament Bracket Champion
  'tournament-bracket-champion':
    'Holding a huge dented gold trophy above her head, a muscular young fighter in a sweaty blue gi stands on a wrestling mat under stadium lights, confetti falling over a cheering crowd.',
  // ── PERSONALITY (2026-09-22) ──
  // Accommodating
  'personality-accommodating':
    'A smiling heavyset grandmother in a floral apron slides over on a crowded park bench to make room for a young mother with a stroller, offering her a slice of cake from a tin.',
  // Ambiguous
  'ambiguous':
    'A middle-aged man wearing a grey suit stands halfway through a doorway on a rainy evening, one foot on the wet porch and one in the warm hallway, his face half smiling and half frowning.',
  // Challenging
  'personality-challenging':
    'Across a chess board in a leafy city park, a sharp-eyed old woman in a beret leans forward with arms crossed and an eyebrow raised, daring the young man opposite to make his move.',
  // Collaborative
  'personality-collaborative':
    'Four friends of different ages in paint-spattered clothes lift a long wooden plank together onto a half-built treehouse in a sunny backyard, laughing and passing tools to one another.',
  // Forward-Looking
  'personality-forward-looking':
    'Sunrise on a rocky summit, a young hiker wearing boots and a windbreaker with one foot up on a boulder, shading her eyes with a hand as she gazes toward distant mountain ranges.',
  // Independent
  'personality-independent':
    'Paddling a red canoe alone across a glassy northern lake at morning, a lean woman in her fifties with a knit cap and flannel shirt steers with steady strokes, gear lashed neatly behind her.',
  // Laid Back
  'personality-laid-back':
    'Slumped comfortably in a hammock strung between two palm trees, a shaggy-haired man in board shorts and sunglasses sips from a coconut, one bare foot dangling over warm white sand at noon.',
  // Mischievous
  'mischievous':
    'Grinning behind a hedge on a sunny afternoon, a freckled girl of about ten in muddy overalls holds a garden hose aimed at a snoozing uncle in a deck chair, thumb ready over the nozzle.',
  // Open Book
  'personality-open-book':
    'Beaming across a diner counter at breakfast, a round-faced young man dressed in a flannel shirt shows a stranger his wallet photos, arms waving mid-story, his whole face open and bright with warmth.',
  // Philosophical
  'personality-philosophical':
    'Sitting on a stone wall above a misty valley at dusk, a bearded old man clad in a wool coat rests his chin on his hand, gazing up at the first stars, a pipe held loosely.',
  // Self-Assured
  'personality-self-assured':
    'Strolling tall down a busy city sidewalk at noon, a woman in her thirties wearing a crisp white suit and sunglasses carries a coffee cup, chin raised, smiling calmly as pedestrians step aside.',
  // Self-Deprecating
  'personality-self-deprecating':
    'At a backyard barbecue, a lanky man in an apron laughs and holds up a burnt black burger on a spatula, one hand on his forehead, while friends at a picnic table laugh with him.',
  // Spontaneous
  'personality-spontaneous':
    'Leaping fully clothed off a wooden dock into a sparkling lake on a hot afternoon, a young woman wearing a sundress and sandals whoops with arms flung wide while her startled friends gasp.',
  // Understated
  'personality-understated':
    'A quiet fellow wearing a plain grey sweater sits at the back of a crowded concert hall, hands folded, giving a small nod while everyone around him leaps up in a standing ovation.',
  // Unflappable
  'personality-unflappable':
    'Calmly pouring tea at a kitchen table while a pipe gushes water across the floor and a dog races through, a composed older woman dressed in a cardigan lifts her cup with a steady hand.',
  // Wide-Eyed
  'personality-wide-eyed':
    'A small boy wearing a puffy blue coat presses his hands and nose against the glass of an enormous aquarium tank, mouth open in delight as a giant whale shark glides overhead in blue light.',
  // World-Weary
  'personality-world-weary':
    'Slouched on a bar stool in a nearly empty diner at 2 a.m., a grizzled trucker in a faded denim jacket stares into a cold cup of coffee, shoulders hunched, cap pushed back.',
  // ── STYLE (2026-09-22) ──
  // 3D Render
  '3d-render':
    'A glossy red teapot and two ceramic cups sit on a pale gray tabletop, smooth computer-modeled surfaces with soft ray-traced reflections, gentle ambient occlusion in the corners, and clean studio lighting from the upper left.',
  // 8-bit Nostalgia
  '8-bit-nostalgia':
    'A small knight stands on a grassy cliff beside a treasure chest, built from chunky square pixels in a sixteen-color palette of bright green, sky blue and brown, with flat blocky clouds overhead and hard stepped edges.',
  // Acrylic Pour
  'acrylic-pour':
    'A koi fish swims through swirling rivers of poured acrylic paint, glossy cells of turquoise, gold and deep magenta splitting into lacy white rings, marbled ribbons of color flowing across a wet high-gloss surface.',
  // AI Collage
  'ai-collage':
    'Torn strips of sky, ocean waves and red brick overlap at odd angles to form a seaside lighthouse, mismatched photographic fragments with soft blended seams, shifting color temperatures between pieces and a pastel haze over everything.',
  // Algorithmic Sculpture
  'algorithmic-sculpture':
    'A twisting white spire of thousands of interlocking lattice struts stands in a sunny courtyard, each strut smoothly varying in thickness, the mathematical mesh casting intricate grid shadows across warm sandstone paving at noon.',
  // Architectural Blueprint
  'architectural-blueprint':
    'A cutaway farmhouse drawn in crisp white technical lines on deep Prussian-blue paper, precise elevation and floor plan views, dotted hidden edges, tidy arcs for door swings and a faint grid texture across the sheet.',
  // ASCII Art
  'ascii-art':
    'A cat\'s face built from tiny green dots, dashes and slashes on a black ground, rows of small glowing marks tightening into eyes, whiskers and ears, with a faint scanline shimmer across dark monitor glass.',
  // Augmented Chalk
  'augmented-chalk':
    'Dusty pastel chalk strokes on gray city sidewalk concrete form a giant whale, glowing cyan outlines and floating light particles hovering above the drawing, a child in yellow sneakers crouched at its edge on a cloudy morning.',
  // Baroque Detail
  'baroque-detail':
    'A silver bowl of grapes, peaches and a peeled lemon rests on dark velvet, painted in rich Baroque oils with deep chiaroscuro shadows, gilded scrollwork on the bowl, dewdrops on every grape and warm candlelight glinting from the left.',
  // Cathedralpunk
  'art-punk-cathedralpunk':
    'Gothic stone vaults and flying buttresses tower over a vast train station, brass locomotives steaming beneath rose windows of colored glass, carved gargoyles holding lanterns, dusty shafts of light slanting through pointed arches at dawn.',
  // Cel Shading
  'cel-shading':
    'A red fox trots through autumn leaves in flat cel shading with two tones per color, thick black ink outlines, crisp hard-edged shadows, a saturated orange and teal palette and clean solid color fills throughout.',
  // Charcoal Sketch
  'charcoal-sketch':
    'An old fisherman\'s weathered hands mend a net, drawn in smudged vine charcoal on rough cream paper, bold dark strokes, soft finger-blended shadows, eraser-lifted highlights on the knuckles and loose gestural marks trailing outward.',
  // Cinematic Keyframe
  'cinematic-keyframe':
    'A lone astronaut walks across a rust-red desert toward a crashed ship at dusk, wide anamorphic widescreen view, dramatic teal and orange color grade, a lens flare streaking across the sky, long shadows and drifting dust.',
  // Claymation Framegrab
  'claymation-framegrab':
    'A plasticine hedgehog baker pulls a tray of lumpy clay buns from a tiny oven, visible thumbprints and tool marks in the modeling clay, soft miniature set lighting, felt curtains and a handmade cardboard kitchen.',
  // Cottagepunk
  'art-punk-cottagepunk':
    'A thatched stone cottage covered in climbing roses, a brass windmill and copper rain collectors bolted to the roof, a patched wooden wagon full of cabbages outside, and warm lamplight in round windows on a misty spring morning.',
  // Digital Embroidery
  'digital-embroidery':
    'A hummingbird hovers by a hibiscus flower, stitched entirely in glossy satin thread, visible chain stitches and French knots, raised textured embroidery on natural linen, tiny thread highlights shimmering in soft window light.',
  // Digital Matte Painting
  'digital-matte-painting':
    'A vast mountain valley with a cliffside monastery above a winding river, painterly digital brushwork blended with photographic textures, layered atmospheric haze receding into blue peaks, enormous scale and soft morning light.',
  // Fantasy Map Style
  'fantasy-map-style':
    'Islands, forests and a jagged coastline drawn in sepia ink on aged parchment, tiny hand-drawn mountains, tree clusters and curling waves, a sea serpent coiling in the ocean, a compass rose and coffee-stained edges.',
  // Faux Fresco
  'faux-fresco':
    'Three goats rest beside a shepherd girl on a hillside, painted in chalky faded pigments on cracked plaster, soft ochre, terracotta and sage tones, flaking patches revealing bare wall and a gentle matte surface.',
  // Fractal Bloom
  'fractal-bloom':
    'A deep-sea anemone unfurls endless self-similar petals, each spiral branching into smaller spirals, luminous magenta and electric violet gradients, crisp mathematical symmetry and glowing edges against a velvety black void.',
  // Glitch Art
  'glitch-art':
    'A city bus at a rainy crosswalk breaks into horizontal slices of displaced pixels, red and cyan channel splitting, smeared data-moshing streaks, blocky compression artifacts and bright scanlines tearing across the wet street.',
  // Glitterpunk
  'art-punk-glitterpunk':
    'A roller-skater in a studded leather jacket spins through a warehouse party, her hair, boots and the concrete floor coated in chunky holographic glitter, safety pins and sequins everywhere, pink and silver disco light scattering over the crowd.',
  // Holographic Overlay
  'holographic-overlay':
    'A vintage motorcycle parked in a dim garage, overlaid with translucent glowing blue wireframe outlines and floating grid planes, an iridescent rainbow sheen along every surface, soft scanlines and a faint projected shimmer.',
  // Hyper-realistic
  'hyper-realistic':
    'A strawberry split open on a wet marble counter, every seed, fine hair and droplet crisply sharp, true-to-life color, shallow depth of field, soft daylight from a kitchen window and glistening juice pooling beside it.',
  // Impressionist
  'impressionist':
    'A riverside café terrace on a breezy summer afternoon, painted in quick visible dabs of broken color, dappled sunlight through plane trees, loose brushstrokes of violet shade and yellow light shimmering on the water.',
  // Infrared Realism
  'infrared-realism':
    'Oak trees along a country road glow snow-white and pale pink in infrared photography, the sky a deep inky blue-black, crisp film grain and dreamy high-contrast tones at midday.',
  // Ink Wash
  'ink-wash':
    'A heron stands among reeds in a misty marsh, painted in black sumi ink washes on white rice paper, graded gray tones, a few swift confident brush strokes for the bird and wide open areas of pale paper.',
  // Inkblot Symmetry
  'inkblot-symmetry':
    'Black and indigo ink spreads into a moth shape mirrored perfectly left to right on folded white paper, soft feathered bleeding edges, pooled dark centers, fine splatter dots and a crisp crease running down the middle.',
  // Isometric Illustration
  'isometric-illustration':
    'A tiny corner bakery seen from a high isometric angle, clean geometric blocks, soft pastel flat colors, crisp edges, miniature ovens and bread racks, a baker and a bicycle out front, all set on plain cream.',
  // Latent Diffusion Markup
  'latent-diffusion-markup':
    'A bowl of lemons emerges from swirling gray noise, the upper half crisp and colorful, the lower half dissolving into grainy static speckles, thin cyan guide outlines and soft colored boxes overlaid across the fruit.',
  // Line Art
  'line-art':
    'A sleeping dog curled on a cushion, drawn in clean single-weight black ink lines on bright white paper, elegant continuous contours, flat white fill and sparse hatching along the cushion folds.',
  // Low Poly
  'low-poly':
    'A deer drinks from a mountain lake, built from faceted low-polygon triangles, flat-shaded planes in muted greens, browns and pale blue, crisp geometric edges and simple angular pine trees along the shore.',
  // Mid-century Modern
  'mid-century-modern':
    'A sunny living room with a teak sideboard, an egg chair and a sunburst clock, drawn in flat mid-century style with a mustard, olive and burnt orange palette, boomerang shapes, grainy screen-print texture and slightly offset color.',
  // Mixed Media
  'mixed-media':
    'A crow perched on a fence post, built from layered collage paper, loose acrylic brushstrokes, pencil scribbles, stamped dots and a strip of lace, with visible glue edges and dripping watercolor across textured cardboard.',
  // Moebius Lines
  'moebius-lines':
    'A tall desert traveler in flowing robes crosses sand dunes toward enormous floating stone domes, fine precise ink contour lines, delicate crosshatching, flat pale colors of peach, lilac and mint and a vast airy sky.',
  // Monoline Tattoo
  'monoline-tattoo':
    'A swallow carrying a rose stem, drawn in one continuous thin black tattoo line on the pale skin of a forearm, even line weight throughout, light dotwork shading, crisp fine edges and small scattered stars nearby.',
  // Mycelial Pattern Mapping
  'mycelial-pattern-mapping':
    'White fungal threads branch between tree roots in a forest floor cross-section, glowing pale gold networks of fine filaments, mushroom caps above the soil, dark loamy browns and small bioluminescent nodes at every junction.',
  // Neon Noir
  'neon-noir':
    'A detective in a dripping fedora waits beneath an elevated train at midnight, hard black shadows, magenta and electric cyan lamplight reflecting in rain puddles, heavy contrast, smoky haze and wet asphalt shine.',
  // Noise-Driven Rendering
  'noise-driven-rendering':
    'Rolling desert dunes generated from layered procedural noise, soft organic ridges in smooth gradients of copper and dusty rose, fine grain textures, subtle turbulence swirls in the sand and a pale sky fading into mist.',
  // Oil Painting
  'oil-painting':
    'A copper kettle, half a loaf of bread and a pear on a wooden table, thick impasto oil paint with visible palette-knife ridges, rich warm umber and ochre tones, glossy highlights and coarse linen weave showing through.',
  // Paper Collage
  'paper-collage':
    'A sailboat on choppy waves assembled from cut and torn colored paper, layered scraps of blue tissue, patterned wrapping paper sails, rough torn white edges, slight paper shadows and a sun cut from orange construction paper.',
  // Papercut Shadowbox
  'papercut-shadowbox':
    'Layered paper cutouts of a night forest stack in depth, a small fox between fern layers and a crescent moon behind the trees, warm backlight glowing through the gaps, crisp cut edges and deepening shades of navy.',
  // Photobash Concept Art
  'photobash-concept-art':
    'A floating fortress city hovers over a stormy sea, assembled from photographic cliffs, ship hulls and industrial textures blended with rough painted strokes, a moody gray-green palette, bold light shafts and brushy overpaint on the clouds.',
  // Photorealist Airbrush
  'photorealist-airbrush':
    'A chrome diner stool and a milkshake glass gleam on a checkered floor, smooth airbrushed gradients, flawless mirror-bright reflections, soft misty highlights and candy-red and pastel mint tones in a glossy seventies photorealist manner.',
  // Pixel Art
  'pixel-art':
    'A cozy bedroom with a cat asleep on the windowsill, drawn in small crisp square pixels, a limited warm palette, dithered shading on the walls, rain streaks on the window and a glowing desk lamp at night.',
  // Pop Art
  'pop-art':
    'A woman\'s face with a single tear holds a telephone receiver, bold black outlines, flat primary reds, yellows and blues, big halftone dots across her skin and a bright hot pink backdrop.',
  // Recycled Junk Assemblage
  'recycled-junk-assemblage':
    'A large owl sculpture welded from rusty bicycle chains, bottle caps, old keys, circuit boards and tin can lids stands in a sunlit scrapyard, mismatched metal patina and bright plastic scraps for eyes.',
  // Retro Anime
  'retro-anime':
    'A teenage girl rides a bicycle down a seaside hill road in summer, hand-painted cel animation style of the late eighties, soft film grain, a pastel sky, towering cumulus clouds and warm faded colors.',
  // Stained Glass
  'stained-glass':
    'A peacock displays its tail in leaded stained glass, jewel-toned panes of emerald, sapphire and ruby joined by thick dark lead lines, sunlight pouring through and casting colored patches across a stone floor.',
  // Steampunk Illustration
  'steampunk-illustration':
    'A brass mechanical octopus crawls across a Victorian workshop bench among gears and coiled springs, engraved sepia ink linework, cross-hatched shading, riveted copper plates, steam valves and warm gaslight tones.',
  // Tatami Patternwork
  'tatami-patternwork':
    'Woven tatami mats cover a quiet Japanese room seen from above, a repeating rectangular grid of pale green straw weave with dark cloth borders, a low wooden table with a teapot and soft afternoon light across the rush texture.',
  // UV Paint Illumination
  'uv-paint-illumination':
    'Parrots and palm leaves painted on a brick wall glow under blacklight, fluorescent pink, acid green and electric orange paint blazing in a deep violet dark room, soft ultraviolet haze and luminous splatter.',
  // Vector Silhouette
  'vector-silhouette':
    'A cyclist and a pine ridge at sunset appear as solid flat black shapes against a smooth vector gradient of orange, coral and violet, clean crisp geometric edges and perfectly even flat color.',
  // Voxel Sculpt
  'voxel-sculpt':
    'A fishing village on a small island built entirely from tiny cubes, chunky voxel boats, blocky palm trees and stepped cube waves, soft toy-scale lighting, bright saturated colors and gentle ambient shading between blocks.',
  // Washi Paper Texture
  'washi-paper-texture':
    'A branch of plum blossoms painted in soft pink and indigo on handmade washi paper, visible long mulberry fibers, uneven deckled edges, translucent layering and gentle watercolor bleeds into the fibrous cream surface.',
  // Woodblock Print
  'woodblock-print':
    'A rainy evening bridge crowded with travelers under paper umbrellas, carved woodblock print with bold outlines, flat areas of indigo, persimmon and gray, visible wood grain texture and fine parallel lines of rain.',
  // ── ANIMAL (2026-09-22) ──
  // African Wild Dog
  'african-wild-dog':
    'Five African wild dogs with blotched tan, black and white coats and large rounded ears trot in a loose line across dry savanna grass at dawn, their white-tipped tails raised.',
  // Arctic Fox
  'arctic-fox':
    'An arctic fox in thick white winter fur leaps nose-first into deep snow on a windswept tundra, hunting a lemming beneath the crust under a pale overcast morning sky.',
  // Atlantic Puffin
  'atlantic-puffin':
    'An Atlantic puffin with a striped orange, blue and yellow beak stands on a grassy sea cliff holding a row of silver sand eels crosswise in its bill, grey waves breaking below.',
  // Axolotl
  'axolotl':
    'A pink axolotl with feathery red gills fanned out on each side of its broad head rests on a muddy lake bed among green waterweed, small dark eyes and a wide gentle mouth.',
  // Bearded Dragon
  'bearded-dragon':
    'A bearded dragon lizard, sandy orange with a spiny throat pouch puffed out dark, basks on a sun-baked red rock in the Australian outback at midday, one front leg raised in a slow wave.',
  // Beluga Whale
  'beluga-whale':
    'Three white beluga whales with rounded bulging foreheads swim slowly beneath floating sea ice in a cold green Arctic bay, pale sunlight falling through the water around their smooth backs.',
  // Black Swan
  'black-swan':
    'A black swan with sooty curled feathers and a bright red bill tipped in white glides across a still lake at dusk, its long neck curved, white flight feathers tucked at its wing edges.',
  // Blue Jay
  'blue-jay':
    'A blue jay with a raised crest, bright blue wings barred in black and a black collar on its grey-white chest grips an acorn on an oak branch in crisp autumn light.',
  // Blue-Footed Booby
  'blue-footed-booby':
    'On black volcanic rock beside the Pacific, a blue-footed booby lifts one bright turquoise foot high in a slow courtship strut, brown wings spread and white chest puffed toward its mate.',
  // Civet Cat
  'civet-cat':
    'A civet cat, long-bodied and grey with black spots and bands, a dark eye mask and a ringed tail climbs a palm trunk at night, sniffing ripe coffee cherries in a tropical plantation.',
  // Clouded Leopard
  'clouded-leopard':
    'A clouded leopard with large dark-edged cloud-shaped blotches on grey-gold fur stretches along a mossy rainforest branch, its very long thick tail hanging down, misty green jungle behind it at dawn.',
  // Crown-of-Thorns Starfish
  'crown-of-thorns-starfish':
    'A crown-of-thorns starfish, purple-red with sixteen arms covered in long sharp spines, spreads over a branching coral head on a sunlit Pacific reef, leaving white bleached coral where it has fed.',
  // Draco Lizard
  'draco-lizard':
    'A draco lizard glides between two rainforest tree trunks with its orange rib-supported wing flaps spread wide on each side of its slender brown body, a yellow throat flag extended, soft morning haze.',
  // Elephant Shrew
  'elephant-shrew':
    'A tiny elephant shrew with a long twitching trunk-shaped nose, big dark eyes and thin legs dashes along a cleared trail through dry leaf litter on an African forest floor in dappled afternoon light.',
  // Fairy Penguin
  'fairy-penguin':
    'Twenty small fairy penguins with slate-blue backs and white bellies waddle up a moonlit sandy beach from the surf toward their burrows in the coastal dunes of southern Australia.',
  // Fennec Fox
  'fennec-fox':
    'A fennec fox with enormous upright ears, cream fur, a black-tipped bushy tail sits at the mouth of its sand burrow on a Saharan dune under a violet twilight sky.',
  // Frilled Lizard
  'frilled-lizard':
    'A frilled lizard rears up on its hind legs on a dusty tree stump, its wide orange and red neck frill flared open around its gaping yellow mouth, eucalyptus woodland behind it.',
  // Galapagos Tortoise
  'galapagos-tortoise':
    'A giant Galapagos tortoise with a domed brown shell stretches its long wrinkled neck to graze on low green plants in a misty highland meadow, a shallow muddy pool nearby.',
  // Giant Anteater
  'giant-anteater':
    'A giant anteater, its tubular snout stretched out, coarse grey coat, a bold black-and-white shoulder stripe and a huge bushy tail tears open a tall termite mound with its curved front claws on open grassland.',
  // Giant Clam
  'giant-clam':
    'A giant clam rests open on a shallow white-sand reef, its wavy ridged shell parted to show a thick mantle patterned in iridescent blue, green and gold under bright tropical sunlight.',
  // Goblin Shark
  'goblin-shark':
    'A pink goblin shark with a long flat blade-shaped snout thrusts its narrow toothed jaws forward to snatch a small fish in the deep dark ocean, lit by faint blue glowing plankton.',
  // Golden Lion Tamarin
  'golden-lion-tamarin':
    'A golden lion tamarin with a flowing mane of bright orange-gold fur and a dark bare face clings to a vine in the Brazilian coastal rainforest, peering into a tree hollow for insects.',
  // Golden Snub-Nosed Monkey
  'golden-snub-nosed-monkey':
    'Two golden snub-nosed monkeys with blue faces, upturned noses and thick orange-gold fur huddle together on a snowy pine branch in a mountain forest of central China on a grey winter morning.',
  // Hammerhead Shark
  'hammerhead-shark':
    'A school of hammerhead sharks with wide flattened T-shaped heads and grey-bronze bodies swims above a rocky seamount in deep blue open water, sunbeams slanting down from the surface.',
  // Harpy Eagle
  'harpy-eagle':
    'A harpy eagle with a grey head, a split double crest raised, a black chest band and massive yellow talons perches on a high emergent tree above the Amazon canopy under stormy clouds.',
  // Hermit Crab
  'hermit-crab':
    'A hermit crab with striped red legs and one oversized claw drags a borrowed spiral whelk shell across wet tidal sand at sunrise, small waves foaming at the edge of the beach.',
  // Honey Badger
  'honey-badger':
    'A honey badger with a thick silver-grey back and black underside digs furiously into a dry riverbank with long front claws, sending red dust flying on a hot Kalahari afternoon.',
  // Horseshoe Crab
  'horseshoe-crab':
    'Dozens of horseshoe crabs with smooth domed olive-brown shells and long spiked tails crawl up a moonlit Atlantic beach at high tide to spawn in the wet sand.',
  // Howler Monkey
  'howler-monkey':
    'A black howler monkey sits high in a rainforest treetop at first light, head thrown back and throat swollen as it roars, its prehensile tail curled around a branch.',
  // Hummingbird
  'hummingbird':
    'A ruby-throated hummingbird hovers beside a red trumpet flower, wings blurred, its long needle bill inside the bloom and green back feathers glinting in soft morning sun in a garden.',
  // Indian Pangolin
  'indian-pangolin':
    'An Indian pangolin covered head to tail in overlapping tan scales walks on its hind legs through dry scrub woodland after dark, sniffing the ground with its small pointed snout.',
  // Indian Star Tortoise
  'indian-star-tortoise':
    'An Indian star tortoise with a high domed black shell patterned in yellow radiating star lines munches a pink hibiscus flower on dry grassland after a monsoon shower.',
  // Japanese Spider Crab
  'japanese-spider-crab':
    'A huge Japanese spider crab with orange knobbly body and white-spotted legs longer than a diver\'s height picks its way across a sandy seafloor in cold dim blue water.',
  // Kiwi Bird
  'kiwi-bird':
    'A brown kiwi bird with shaggy hair-like feathers, a round body and a long thin pale bill probes the damp fern-covered floor of a New Zealand forest under starlight.',
  // Komodo Dragon
  'komodo-dragon':
    'A Komodo dragon, a massive grey-brown monitor lizard with a heavy tail and forked yellow tongue flicking out, lumbers along a dusty island beach beside dry savanna hills at noon.',
  // Leaf Tailed Gecko
  'leaf-tailed-gecko':
    'Clinging flat against mossy tree bark, a leaf-tailed gecko with mottled brown skin, a fringed body edge and a broad dead-leaf-shaped tail blends into the trunk in a Madagascan rainforest at dusk.',
  // Leafcutter Ant
  'leafcutter-ant':
    'A long column of reddish-brown leafcutter ants marches along a forest vine, each worker holding a green leaf fragment high over its body in its jaws, damp tropical morning light.',
  // Leafy Sea Dragon
  'leafy-sea-dragon':
    'A leafy sea dragon, a yellow-green seahorse relative covered in leaf-shaped fleshy fins, drifts slowly through a swaying kelp bed off southern Australia in soft turquoise light.',
  // Manta Ray
  'manta-ray':
    'A giant manta ray with wide black triangular wings, a pale spotted belly and curled head fins glides over a coral cleaning station in clear blue water, small fish nibbling its skin.',
  // Millillillillipede
  'millillillillipede':
    'A pale cream millipede, threadlike and carrying over seven hundred tiny legs, coils through damp dark soil beneath a sandstone boulder in a California oak woodland.',
  // Moon Jellyfish
  'moon-jellyfish':
    'A drifting bloom of moon jellyfish with translucent saucer-shaped bells and four pale violet horseshoe rings pulses through calm dark blue water, lit from above by late afternoon sun.',
  // Ocelot
  'ocelot':
    'An ocelot wearing a sleek golden coat marked by black-edged chain spots and stripes stalks along a fallen log across a moonlit jungle stream, ears forward and eyes shining.',
  // Octopus
  'octopus':
    'A common octopus with mottled red-brown skin and eight curling suckered arms squeezes out of a rocky crevice onto the seabed, changing to sandy tones beside a pile of opened shells.',
  // Orchid Mantis
  'orchid-mantis':
    'An orchid mantis, pale pink and white with petal-shaped lobes on its legs, perches motionless on a pink orchid bloom in a humid Malaysian rainforest, waiting for a visiting bee.',
  // Pallas’s Cat
  'pallas-s-cat':
    'A Pallas\'s cat with dense long grey fur, a flat round face, small low ears and a thick ringed tail glares out from between rocks on a cold Mongolian steppe at sunset.',
  // Pink Fairy Armadillo
  'pink-fairy-armadillo':
    'A tiny pink fairy armadillo with a rosy shell of thin bands over silky white fur and big digging claws burrows into loose sand in the dry Argentine plains under a starry night.',
  // Platypus
  'platypus':
    'A platypus with a flat rubbery duck bill, dense brown fur, webbed feet and a broad flat tail paddles along the pebbly bottom of a clear Australian creek, bubbles trailing behind it.',
  // Praying Mantis
  'praying-mantis':
    'A green praying mantis clings to a garden stem with spiked forelegs folded and raised, its triangular head turned sideways toward a hovering fly, early morning dew on the leaves.',
  // Proboscis Monkey
  'proboscis-monkey':
    'A male proboscis monkey with a large drooping nose, orange-brown fur and a pale grey tail sits in a mangrove tree above a muddy Borneo river, chewing leaves in warm evening light.',
  // Rainbow Lorikeet
  'rainbow-lorikeet':
    'Four rainbow lorikeets with blue heads, green wings and orange-red chests crowd onto a flowering bottlebrush branch, lapping nectar with their brushy tongues in a sunny Australian park.',
  // Red Panda
  'red-panda':
    'A red panda, rust-red all over with a white-marked face and a thick ringed tail, curls asleep along a high branch in a Himalayan bamboo forest while soft snow falls around it.',
  // Ribbon Eel
  'ribbon-eel':
    'A bright blue ribbon eel with a yellow jaw and a flared nostril sways upright from its burrow in coral rubble, mouth open, on a tropical reef in clear midday water.',
  // Rock Hyrax
  'rock-hyrax':
    'A family of six rock hyraxes, small brown round-bodied mammals with short ears, sunbathe huddled together on a warm granite outcrop above the East African plains in early morning.',
  // Sand Cat
  'sand-cat':
    'A sand cat, small and pale sandy-buff with wide-set ears and faint dark bands on its legs, pads across rippled dunes of the Arabian desert beneath a bright full moon.',
  // Sea Cucumber
  'sea-cucumber':
    'A sea cucumber, plump and spotted brown along its sausage body, and tiny tube feet crawls slowly across pale sand on a shallow lagoon floor, sifting sediment with its short frilly tentacles.',
  // Sea Dragon
  'sea-dragon':
    'A weedy sea dragon, slender and red-bodied,, yellow spots, purple-blue bars and small leafy appendages hovers upright beside brown seaweed on a rocky reef in cool green water.',
  // Sea Otter
  'sea-otter':
    'A sea otter floats on its back among golden kelp in a calm Pacific cove, cracking a purple sea urchin against a flat stone resting on its furry chest, whiskers dripping.',
  // Sea Turtle
  'sea-turtle':
    'A green sea turtle with a smooth olive shell of large plates and scaly flippers swims over a seagrass meadow in clear shallow water, a remora fish tucked beneath its belly.',
  // Shoebill Stork
  'shoebill-stork':
    'A tall slate-grey shoebill stork with a huge clog-shaped yellowish bill stands perfectly still in a papyrus swamp in Uganda at dawn, staring down into the water for lungfish.',
  // Slow Loris
  'slow-loris':
    'A slow loris, huge round amber eyes, soft brown coat, a dark stripe along its back grips a bamboo stem with small hands, creeping slowly through a Southeast Asian forest at night.',
  // Snow Leopard
  'snow-leopard':
    'A snow leopard, thick smoky-grey coat dotted with black rosettes, heavy tail wrapped close, crouches on a snowy Himalayan ridge, watching a herd of blue sheep on the slope below.',
  // Spider Monkey
  'spider-monkey':
    'A black spider monkey swings between rainforest branches, hanging by its long prehensile tail with its long thin arms reaching for a ripe fig in bright humid morning sun.',
  // Spotted Hyena
  'spotted-hyena':
    'A spotted hyena with a sloping back, round ears and a sandy coat covered in dark spots lopes across a dusty African plain at twilight, three more hyenas following behind.',
  // Stick Insect
  'stick-insect':
    'A brown stick insect, thin jointed legs and a twig-shaped body sways gently on a eucalyptus branch, its body extended straight along the stem in soft overcast light.',
  // Sugar Glider
  'sugar-glider':
    'A sugar glider, soft grey furred, a black stripe down its back and huge dark eyes glides between gum trees at night, its furry skin membrane stretched wide from wrist to ankle.',
  // Tardigrade
  'tardigrade':
    'A tardigrade, a plump translucent eight-legged water bear with tiny hooked claws, clambers over a green moss leaf glistening with water droplets, seen under a microscope\'s bright light.',
  // Tasmanian Devil
  'tasmanian-devil':
    'A Tasmanian devil with black fur, a white chest band and pink ears opens its powerful jaws wide in a snarl on a mossy log in a dark Tasmanian eucalyptus forest at dusk.',
  // Tree Kangaroo
  'tree-kangaroo':
    'A tree kangaroo with rich chestnut fur, a golden belly and a long hanging tail sits on a high mossy branch in the misty cloud forest of Papua New Guinea, holding a leaf.',
  // Velvet Worm
  'velvet-worm':
    'A velvet worm with a soft dark blue-grey velvety body and many stubby legs creeps over rotting leaves on a damp forest floor at night, squirting sticky white slime at a cricket.',
  // ── SPECIES (2026-09-22) ──
  // Android
  'android':
    'An android with pale ceramic skin plates, visible seams along its jaw and forearms, and glass-blue eyes kneels in a rainy greenhouse at dusk, gently lifting a wilted tomato plant to study its roots.',
  // Angel
  'angel':
    'A towering angel with six white feathered wings spreading in different directions and extra golden eyes along the wing edges stands on marble cathedral steps at dawn, holding a brass hourglass in each of four hands.',
  // Ankylosaurus
  'ankylosaurus':
    'An ankylosaurus with a low, broad body covered in bony oval plates and rows of short spikes swings its heavy club tail beside a muddy riverbank among ferns and cycads under hazy afternoon sun.',
  // Backrooms Entity
  'backrooms-entity':
    'A tall, thin gray humanoid entity with long dangling arms and a smooth blank oval head stands at the far end of an endless yellow office hallway, damp beige carpet and buzzing fluorescent ceiling panels stretching toward it.',
  // Bearfolk
  'bearfolk':
    'A bearfolk man, seven feet tall with thick brown fur, a broad muzzle and heavy clawed paws, stands in a snowy mountain village square, wrapping a wool blanket around a shivering lamb.',
  // Birdfolk
  'birdfolk':
    'Perched on a windy lighthouse railing, a birdfolk scout with a hooked yellow beak, gray-and-white barred feathers and half-spread wing-arms leans into the gale, sharp orange eyes scanning the stormy sea.',
  // Black-Footed Cat
  'black-footed-cat':
    'A black-footed cat, tiny and sandy-buff with dark spots, black-banded legs and wide round eyes, crouches low in dry Kalahari grass at twilight, ears pricked forward, stalking a lark.',
  // Blind Mole Rat
  'blind-mole-rat':
    'Deep inside a dark red soil tunnel, a blind mole rat with soft gray fur, tiny skin-covered eyes and large pale incisors digs forward, pushing loose earth behind it with stubby feet.',
  // Butterfly
  'butterfly':
    'A swallowtail butterfly with yellow wings patterned in black veins, blue crescents and orange eyespots rests on the wet nose of a sleeping bulldog on a sunny back porch.',
  // Cat
  'cat':
    'A gray tabby house cat with green eyes and a white chest sits on a high kitchen shelf beside a row of ceramic mugs, one paw nudging a blue mug over the edge in soft morning light.',
  // Catfolk
  'catfolk':
    'A catfolk woman with orange tabby fur, tall tufted ears, a long striped tail and slit-pupil amber eyes lounges on a wide stone windowsill above a busy cobbled market, chin resting on her paw.',
  // Centaur
  'centaur':
    'Crashing through the swinging doors of a crowded wooden tavern, a centaur with a chestnut horse body, a muscular human torso in a leather vest and a braided beard scatters stools as drinkers look up.',
  // Changeling
  'changeling':
    'A changeling with smooth pale gray skin, milky white eyes and long fingers sits at a theatre dressing-room mirror, half of its face already reshaped into a rosy-cheeked red-haired woman.',
  // Chupacabra
  'chupacabra':
    'A chupacabra, a dog-sized gray creature with bare leathery skin, a ridge of dark spines down its back and long fangs, freezes in a trail-camera flash beside a goat pen on a dusty ranch at night.',
  // Cryptid
  'cryptid':
    'A tall shaggy cryptid covered in matted dark brown fur, long-armed and stooped, walks between wet pine trunks on a foggy logging road at dawn, its outline soft and hazy in the mist.',
  // Crystalborn
  'crystalborn':
    'A crystalborn woman whose body is faceted translucent pink quartz, a warm amber glow pulsing in her chest, stands in a cave of amethyst geodes with palms raised as the crystals around her glow in answer.',
  // Deity
  'deity':
    'A deity with golden skin, six arms and open eyes on each palm sits cross-legged on a floating lotus above a sunrise river, one hand pouring water, another holding a flame, another feeding a sparrow.',
  // Demon
  'demon':
    'A demon in a tailored black suit, with red skin, curved ivory horns and a thin tail, sips wine at a candlelit balcony table while a mansion across the dark garden burns orange.',
  // Dog
  'dog':
    'A scruffy old dog with golden fur, a gray muzzle and one floppy ear sits pressed against a young woman\'s leg at a rainy bus-stop bench, gazing up at her face, tail thumping.',
  // Dragon
  'dragon':
    'Coiled around a hoard of antique brass telescopes and pocket watches, a red dragon with ridged scales, leathery wings folded and smoke curling from its nostrils watches the mouth of a torchlit mountain cave.',
  // Dragonkin
  'dragonkin':
    'A dragonkin warrior with bronze scales, a horned reptilian head, a thick tail and small folded wings admires a jeweled silver goblet at a bustling desert bazaar stall under striped awnings at noon.',
  // Dryad
  'dryad':
    'A dryad with bark-textured brown skin, leafy green hair and a knothole for one eye stands half-merged with an ancient oak in a misty autumn forest, scowling at a woodcutter\'s axe stuck in her trunk.',
  // Dwarf
  'dwarf':
    'A stout dwarf with a braided copper beard, an iron-studded leather apron and thick forearms hammers hinges onto a massive round oak door inside a lantern-lit stone mountain hall.',
  // Elder God
  'elder-god':
    'An elder god, a colossal green-gray being with a crown of drifting tentacles and dozens of pale eyes, looms out of a black ocean under a violet sky, towering over a tiny fishing trawler.',
  // Elf
  'elf':
    'A tall elf with pointed ears, silver hair to her waist and a flowing green gown sweeps down a moonlit spiral staircase in a white birchwood palace, one arm raised theatrically.',
  // Evolutionary Architect
  'evolutionary-architect':
    'An evolutionary architect, a tall robed being with long pale fingers and four glassy eyes, cups a tiny glowing tadpole inside a vast greenhouse laboratory crowded with hybrid plants, fossils and branching coral.',
  // Fae
  'fae':
    'A fae noble with iridescent dragonfly wings, sharp cheekbones, pointed ears, a crown of thorny briar holds out a golden apple across a mossy ring of red mushrooms in twilight woods.',
  // Fairy
  'fairy':
    'A tiny fairy the size of a thumb, with glowing gossamer wings, a scowling face, hovers above a dewy garden rose at night, her yellow light flickering as she glares at a snail.',
  // Foxkin
  'foxkin':
    'A foxkin gentleman with russet fur, a white-tipped bushy tail and pointed black ears adjusts his emerald waistcoat at a lamplit ballroom entrance, a spare umbrella and folded fan tucked under his arm.',
  // Frogfolk
  'frogfolk':
    'A frogfolk guide with smooth green spotted skin, wide golden eyes and webbed hands poles a small reed raft through a misty cypress swamp at dawn, grinning back over its shoulder.',
  // Ghost
  'ghost':
    'The translucent pale-blue ghost of an old woman wearing a nightgown drifts through a dim Victorian laundry room at midnight, folding a floating bedsheet beside a copper washtub.',
  // Ghoul
  'ghoul':
    'A gaunt gray-skinned ghoul with long clawed fingers, sunken yellow eyes, a hunched spine crouches on a mossy tombstone in a foggy churchyard at night, sniffing the air.',
  // Giant
  'giant':
    'A giant with weathered tan skin, a patched wool tunic and a shaggy beard crouches low to squeeze through a stone archway in a mountain pass, clouds drifting around his shoulders and sheep scattering below.',
  // Gnome
  'gnome':
    'A gnome inventor with a white tufted beard, a pointed red cap and brass goggles tinkers at a cluttered workbench as springs and gears fly from a smoking clockwork teapot in his cozy burrow workshop.',
  // Goblin
  'goblin':
    'A green goblin with long pointed ears, sharp teeth and a patched hooded coat haggles over a pile of stolen spoons and buttons at a crooked night-market stall under paper lanterns.',
  // Golem
  'golem':
    'Hunched beneath gray drizzle, a clay golem with cracked reddish-brown earthen skin, glowing amber eyes and slumped heavy shoulders carries a millstone across a shallow river ford.',
  // Gremlin
  'gremlin':
    'A small furry gremlin with bat ears, big yellow eyes, a long thin tail sits inside an open jet engine casing on a runway at night, gleefully yanking wires loose with its claws.',
  // Halfling
  'halfling':
    'A curly-haired halfling with bare hairy feet, a green waistcoat and a short sword on her hip perches on a roadside stone at sunset, unpacking a picnic of bread, cheese and apples.',
  // Harpy
  'harpy':
    'A harpy with a woman\'s fierce face, bronze feathered wings in place of arms and taloned bird legs screeches from a jagged sea cliff above crashing waves, wings flared wide against a stormy sky.',
  // Human
  'human':
    'An ordinary human, a sunburnt woman wearing a patched cotton jacket, plants her boots on the ice atop a vast glacier at noon, driving a small red flag into it and grinning.',
  // Imaginary Friend
  'imaginary-friend':
    'An imaginary friend, a tall slightly translucent purple creature with oversized round eyes, stubby legs, a long striped scarf, sits beside a little girl in a blanket fort lit by a flashlight.',
  // Imp
  'imp':
    'A red-skinned imp with small horns, a spade-tipped tail and a sly grin perches on a dusty library ladder, one hand hidden behind its back, candlelight flickering across rows of leather spines.',
  // Leech
  'leech':
    'A glossy black medicinal leech with olive-brown stripes coils inside a water-filled glass jar on a Victorian apothecary counter, brass scales and dried herbs around it in lamplight.',
  // Leprechaun
  'leprechaun':
    'A red-bearded leprechaun in a green coat and buckled hat sits sulking atop an overflowing pot of gold coins at the end of a rainbow in a wet green meadow.',
  // Living Doll
  'living-doll':
    'A porcelain living doll with cracked rosy cheeks, glass-blue eyes, a lace dress walks along a dusty nursery shelf at night, tiny hand trailing across a row of teddy bears.',
  // Lizardfolk
  'lizardfolk':
    'A lizardfolk hunter with mottled green scales, a long snout, a heavy tail and a bone spear stands perfectly still in a mangrove creek at noon, yellow slit eyes watching a fish below.',
  // Luck Dragon
  'luck-dragon':
    'A luck dragon with a long serpentine body of pearly white fur, a gentle dog-shaped head and pink-tinged scales flies through a narrow gap between two storm clouds, rainbows scattering over a village below.',
  // Mantis Shrimp
  'mantis-shrimp':
    'A mantis shrimp with neon green, orange and blue armour, stalked eyes and folded club arms smashes a snail shell apart on a sunlit coral reef ledge in clear turquoise water.',
  // Merfolk
  'merfolk':
    'A merfolk woman with a teal scaled tail, long seaweed-green hair and pearl earrings lounges on a harbour rock at sunset, smirking at a sailor slipping on the wet dock.',
  // Minotaur
  'minotaur':
    'A minotaur with a black bull\'s head, heavy horns, a massive human torso and hooves walks a torchlit stone labyrinth, tracing a red thread along the wall with one thick finger.',
  // Mothfolk
  'mothfolk':
    'A mothfolk girl with soft cream fuzz, feathery antennae and broad dusty wings patterned in tawny eyespots presses close to a glowing porch light on a summer farmhouse at night.',
  // Murder of Crows
  'murder-of-crows':
    'Dozens of black crows in a murder gather on a bare winter oak above a snowy village road, every head turned the same way toward a lone farmer walking below.',
  // Mushroomfolk
  'mushroomfolk':
    'Mushroomfolk with round red-capped heads, pale stalk bodies and gilled undersides tend a glowing mossy log garden, a whole family of them, deep in a damp forest glade under dim blue light.',
  // Nightmare
  'nightmare':
    'A nightmare, a huge black horse with a flowing smoke mane, burning red eyes and hooves trailing embers, rears at the foot of a child\'s bed in a moonlit bedroom as curtains billow.',
  // Ogre
  'ogre':
    'An enormous ogre with gray-green warty skin, a pot belly and small tusks rests on a mossy boulder in an old forest clearing, cradling a wounded fawn in huge gentle hands.',
  // Orc
  'orc':
    'An orc blacksmith with green skin, lower tusks, a shaved head and thick scarred arms laughs with neighbours while forging horseshoes outside her busy village smithy on a bright spring morning.',
  // Phoenixborn
  'phoenixborn':
    'A phoenixborn man with ember-orange skin, feathered hair of flickering flame and ash-gray eyes climbs out of a smoking pile of cinders in a desert ruin at dusk, arms spread wide.',
  // Plantfolk
  'plantfolk':
    'A plantfolk gardener with green vine limbs, leaf hair and pink blossoms opening across her shoulders kneels in a walled cottage garden in spring rain, glaring at a muddy boot print on a crushed tulip.',
  // Poltergeist
  'poltergeist':
    'Teacups, forks, a hairbrush and a porcelain plate hang mid-air in a tight spiral above a dim farmhouse kitchen table, chairs tilted and cupboard doors flung open by a poltergeist.',
  // Potted Geranium
  'potted-geranium':
    'A potted geranium with bright red flower clusters and round green leaves sits in a terracotta pot on a sunny apartment windowsill, dry soil cracked on top, one bloom turned toward the open door.',
  // Rabbit
  'rabbit':
    'A wild brown rabbit with tall alert ears and a white cottontail sits upright at the edge of a dewy clover meadow at dawn, nose twitching, ready to bolt.',
  // Rabbitfolk
  'rabbitfolk':
    'A rabbitfolk runner with gray fur, long upright ears, powerful hind legs and a light leather tunic sprints across a moonlit wheat field, leaping over a fallen fence rail.',
  // Robot
  'robot':
    'A boxy silver robot with riveted plating, round glowing eyes and treaded feet holds a wilting daisy in a busy city park at lunchtime, office workers watching from benches around it.',
  // Satyr
  'satyr':
    'A satyr with curled ram horns, shaggy goat legs and hooves and a bare chest plays panpipes on a moonlit vineyard hillside, a ring of tipsy dancers spilling wine around a bonfire.',
  // Scarecrow
  'scarecrow':
    'A scarecrow with a burlap sack face, stitched grin, straw hands and a tattered plaid coat stands on its pole in a golden cornfield at dusk, head turned toward a fox creeping between the rows.',
  // SCP
  'scp':
    'An anomalous gray humanoid with elongated limbs hunches on a cot inside a white concrete containment cell behind thick glass, rolling a red rubber ball between its long fingers under harsh lights while armed guards watch from the corridor.',
  // Sentient Spaceship
  'sentient-spaceship':
    'A sentient spaceship, a sleek silver-white vessel with a single glowing blue sensor eye, bolted-on mismatched fins and a copper ring of welded panels, drifts toward a massive ringed planet in black space.',
  // Shadowkin
  'shadowkin':
    'A shadowkin with smoky charcoal skin, dim violet eyes, edges that fade into darkness stands in the corner of a candlelit tavern, half lit by the hearth, watching the crowded tables.',
  // Sharkfolk
  'sharkfolk':
    'A sharkfolk lifeguard with sleek gray skin, a tall dorsal fin, gill slits and rows of jagged teeth carries a rescued swimmer out of rough surf on a bright crowded beach.',
  // Siren
  'siren':
    'A siren with a pale woman\'s face, dark wet hair and a long silver fish tail sings from a black rock in stormy seas, a wooden sailing ship veering toward the jagged reef.',
  // Skeleton
  'skeleton':
    'A cheerful human skeleton with yellowed bones and a jaunty top hat dances on a creaking wooden porch under a harvest moon, finger bones snapping, a fiddle propped against the railing.',
  // Slime
  'slime':
    'A green translucent slime blob the size of a beanbag, with two floating dark eyes and a swallowed coin and key inside it, oozes across the stone floor of a torchlit dungeon.',
  // Space Clown
  'space-clown':
    'A space clown in a baggy red-and-white polka-dot suit, white face paint, a round red nose and curly rainbow hair juggles glowing balls while floating in starry black space above a blue planet.',
  // Sphinx
  'sphinx':
    'A sphinx with a lion\'s golden body, great feathered wings and a stern woman\'s face beneath a striped headdress lies atop a sandstone temple gate at noon, staring down at a lone traveler.',
  // Spider
  'spider':
    'An orb-weaver spider with eight shiny black eyes, a striped yellow abdomen and long jointed legs sits at the hub of a vast dewy web strung between garden fence posts at sunrise.',
  // Starborn
  'starborn':
    'A starborn being with deep indigo skin speckled in glowing constellations, white hair drifting upward and luminous silver eyes sits alone on a rooftop at night, watching a violet nebula.',
  // Time Being
  'time-being':
    'A time being appears as five overlapping copies of the same robed old man, each a different age, standing on a clock tower balcony at dusk, his long shadow falling toward the setting sun.',
  // Toon
  'toon':
    'A cartoon rabbit toon with rubbery white limbs, oversized gloves and giant feet runs straight off a desert cliff edge, hanging mid-air above a deep canyon with speed lines trailing behind.',
  // Trickster
  'trickster':
    'A trickster with a lanky man\'s body, a fox\'s pointed ears and a coyote tail grins in a firelit desert cave, his shadow on the rock wall shaped as a large prowling fox.',
  // Troll
  'troll':
    'A hulking mossy troll with gray stony skin, a long drooping nose and tusks sits under a stone bridge at midnight, studying the stars while a small lantern glows beside it.',
  // Unicorn-Touched
  'unicorn-touched':
    'A unicorn-touched girl with a spiral pearl horn on her brow, silver-white hair and faintly glowing skin feeds an apple to a white foal in a sunlit forest meadow of bluebells.',
  // Vampire
  'vampire':
    'A pale vampire with slicked black hair, sharp fangs and a velvet burgundy dressing gown sits by a crackling fireplace in a dusty gothic library, yawning over a crystal glass of dark red wine.',
  // Virus
  'virus':
    'A virus particle, a spiky sphere with crimson protein spikes and a translucent blue shell, drifts beside a huge pink cell membrane in a watery microscopic world of floating proteins.',
  // Voidling
  'voidling':
    'A voidling, a small round creature of deep black void with two tiny white eyes and stubby limbs, squats atop a kitchen counter at night, slurping the glow from a candle flame.',
  // Wendigo
  'wendigo':
    'A wendigo, a tall skeletal figure with gray stretched skin, a deer skull head and branching antlers, stands motionless at the edge of a snowy pine forest at dusk, glowing eyes fixed on a cabin.',
  // Werebeast
  'werebeast':
    'A werebeast halfway through transformation, a man with a stretching wolf snout and coarse brown fur spreading across his arms and torn shirt, clutches a fence post on a moonlit farm hillside.',
  // Whale
  'whale':
    'A huge blue whale with glowing turquoise patterns along its long flank glides through dark open ocean at night, a tiny wooden rowboat drifting on the surface far above it.',
  // Witchborn
  'witchborn':
    'A witchborn young woman with one green eye and one gold, silver-streaked black hair and herb-stained fingers sorts bundles of dried herbs in a cluttered cottage kitchen while a black cat watches.',
  // Wolfkin
  'wolfkin':
    'A pack of wolfkin warriors, gray and brown furred with wolf heads, tall ears and bushy tails, run together along a rocky ridge at twilight, a white-furred leader in a red scarf out front.',
  // World Serpent
  'world-serpent':
    'The world serpent, a colossal green sea snake whose coils stretch across the horizon, rises from a gray ocean with rain clouds and lightning forming along its scaled back, tiny islands between its loops.',
  // Yokai
  'yokai':
    'A yokai with a long stretched neck, a pale face and a round lantern glowing green walks along a moonlit mountain path lined with red torii gates, beckoning a traveler forward.',
  // Zombie
  'zombie':
    'A shambling zombie in a torn wedding suit, with gray rotting skin and cloudy eyes, clutches a wilted bouquet as it stands beside a grave in a misty morning cemetery.',
  // ── Two rows whose stored prompt ended in the v7 STYLE clause "A finished
  //    picture made this way ...", which Krea paints as a framed picture. ──
  // Cyberpunk
  'cyberpunk':
    'Rain sheeting down between stacked chrome towers at night, pink and cyan light pooling in every puddle, a courier in a mirrored visor leaning a battered motorbike through a narrow gap between steel pylons and cable bundles.',
  // Person
  'art-art-subject-person':
    'Standing alone on a windy hillside in late afternoon light, a woman in a long green coat turns to look over her shoulder, her whole body visible from head to boots, hair lifted by the wind.',
  // ── 2026-09-22: queued with the "picture" re-render sweep, whose rebuild
  //    left it as title plus the stock personality clause. ──
  // Deceptive
  'deceptive':
    'Across a candlelit card table, a smiling man in a velvet waistcoat lays three cups face down while his free hand slides a pearl into his cuff, the opponent leaning in to watch the wrong cup.',
}
