// Ecotone art ledgers for the temporary checkpoint review page
// (/admin/art-review, conductor weird-humboldt t-043): every round's lanes,
// subjects and ArtJob ids, snapshotted from conductor
// projects/weird-humboldt/art/*.yaml. Regenerate when a ledger changes; the
// page reads each job's live status, image and timings from the server.

export type ArtReviewLane = {
  key: string
  label: string
  engine: string
  checkpoint: string
  steps?: number | null
  cfg?: number | null
  sampler?: string | null
}

export type ArtReviewSubject = {
  key: string
  title: string
  asset: string
  size: string
  seed?: number | null
  prompt: string
  /** ArtJob id by lane key. */
  jobs: Record<string, number>
}

export type ArtReviewRound = {
  id: string
  title: string
  blurb: string
  lanes: ArtReviewLane[]
  subjects: ArtReviewSubject[]
  notes: Partial<Record<'people' | 'places' | 'recommendation', string>>
}

export const ART_REVIEW_ROUNDS: ArtReviewRound[] = [
  {
    id: 'bakeoff',
    title: 'Checkpoint bake-off',
    blurb:
      'Eight checkpoints on the same eight subjects and seeds: the four companions and four Humboldt settings.',
    lanes: [
      {
        key: 'arthemy',
        label: 'Arthemy Western Art v3.0 (current house, baseline)',
        engine: 'comfy',
        checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
      {
        key: 'illustrij',
        label: 'Illustrij v2.1',
        engine: 'comfy',
        checkpoint: 'Illustrious/illustrij_v21.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
      {
        key: 'novacomic',
        label: 'Nova Comic XL v2.0',
        engine: 'comfy',
        checkpoint: 'Illustrious/novaComicXL_v20.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
      {
        key: 'realism',
        label: 'Realism Illustrious v5.5',
        engine: 'comfy',
        checkpoint: 'Illustrious/realismIllustriousBy_v55FP16.safetensors',
        steps: 28,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
      {
        key: 'nihilmania',
        label: 'SDXL Unstable Diffusers nihilmania',
        engine: 'comfy',
        checkpoint: 'SDXL/sdxlUnstableDiffusers_nihilmania.safetensors',
        steps: null,
        cfg: null,
        sampler: null,
      },
      {
        key: 'krea2',
        label: 'Krea 2',
        engine: 'krea2',
        checkpoint: 'krea2',
        steps: null,
        cfg: null,
        sampler: null,
      },
      {
        key: 'zimage',
        label: 'Z-Image Turbo',
        engine: 'zimage',
        checkpoint: 'zimage',
        steps: null,
        cfg: null,
        sampler: null,
      },
      {
        key: 'flux2',
        label: 'Flux 2 Klein',
        engine: 'flux2',
        checkpoint: 'flux2',
        steps: null,
        cfg: null,
        sampler: null,
      },
    ],
    subjects: [
      {
        key: 'ck-mara',
        title: 'Mara, tattoo artist (sober guide)',
        asset: '',
        size: '832x1216',
        seed: 64101,
        prompt:
          'A Native Californian woman in her thirties with long black hair tied back and fine-line tattoos down both forearms sits at a festival tattoo table under string lights. She wears a black t-shirt and a canvas shop apron, a pencil tucked behind her ear, a sketchbook of bird designs open in front of her, and gives a dry, knowing half smile. Redwood forest behind her at dusk.',
        jobs: {
          arthemy: 40884,
          illustrij: 40885,
          novacomic: 40886,
          realism: 40887,
          nihilmania: 40888,
          krea2: 40889,
          zimage: 40890,
          flux2: 40891,
        },
      },
      {
        key: 'ck-kit',
        title: 'Kit, kinetic sculptor and juggler (tipsy guide)',
        asset: '',
        size: '832x1216',
        seed: 64102,
        prompt:
          'A Hmong American woman in her late twenties with short asymmetric black hair, wearing paint-splattered mechanic coveralls covered in bright fabric patches, laughs as she juggles three wooden juggling clubs beside a pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights glowing around her.',
        jobs: {
          arthemy: 40892,
          illustrij: 40893,
          novacomic: 40894,
          realism: 40895,
          nihilmania: 40896,
          krea2: 40897,
          zimage: 40898,
          flux2: 40899,
        },
      },
      {
        key: 'ck-juniper',
        title: 'Juniper, forest guide (stoned guide)',
        asset: '',
        size: '832x1216',
        seed: 64103,
        prompt:
          'A curvy young woman in her twenties with messy auburn hair, freckles and a warm teasing smile stands barefoot on moss among giant redwood roots. She wears a layered thrift-store sweater and a long patchwork skirt, with a green ribbon and tiny ferns growing in her hair, lit by a soft green forest glow.',
        jobs: {
          arthemy: 40900,
          illustrij: 40901,
          novacomic: 40902,
          realism: 40903,
          nihilmania: 40904,
          krea2: 40905,
          zimage: 40906,
          flux2: 40907,
        },
      },
      {
        key: 'ck-cedar',
        title: 'Cedar, backroads mechanic (tripping guide)',
        asset: '',
        size: '832x1216',
        seed: 64104,
        prompt:
          'A rugged rural man in his thirties with warm light brown skin, dark hair and short beard stubble, in a worn trucker cap, an oil-stained canvas work jacket and scuffed work boots, grins mischievously while holding a vintage CB radio handset on a coiled cord. He leans on an old pickup truck with a faded green ribbon tied to its antenna on a redwood backroad at dusk.',
        jobs: {
          arthemy: 40908,
          illustrij: 40909,
          novacomic: 40910,
          realism: 40911,
          nihilmania: 40912,
          krea2: 40913,
          zimage: 40914,
          flux2: 40915,
        },
      },
      {
        key: 'ck-grove',
        title: 'Setting, redwood grove in Sequoia Park',
        asset: '',
        size: '1344x768',
        seed: 64201,
        prompt:
          'An old-growth coast redwood grove with enormous red-brown trunks rising out of frame, ferns and redwood sorrel covering the forest floor, a winding dirt path and a small wooden footbridge over a creek, shafts of misty light falling between the trees. Quiet and ancient.',
        jobs: {
          arthemy: 40916,
          illustrij: 40917,
          novacomic: 40918,
          realism: 40919,
          nihilmania: 40920,
          zimage: 40922,
          flux2: 40923,
          krea2: 40962,
        },
      },
      {
        key: 'ck-bigfoot',
        title: 'Setting, Bigfoot family picnic at Moonstone Beach',
        asset: '',
        size: '1344x768',
        seed: 64202,
        prompt:
          'A family of three huge, gentle, shaggy brown sasquatches wearing straw sun hats sits on a checked picnic blanket on a wide sandy beach beside dark sea stacks on a foggy morning. There is a platter of deviled eggs and a blue cooler, and the smallest sasquatch holds up a smartphone for a family selfie. Wholesome and funny.',
        jobs: {
          arthemy: 40924,
          illustrij: 40925,
          novacomic: 40926,
          realism: 40927,
          nihilmania: 40928,
          krea2: 40929,
          zimage: 40930,
          flux2: 40931,
        },
      },
      {
        key: 'ck-plaza',
        title: 'Setting, Arcata Plaza at night',
        asset: '',
        size: '1344x768',
        seed: 64203,
        prompt:
          'A small-town college plaza at night, with a lawn square and a bronze statue in the middle, palm trees and redwoods, two-story brick and wooden storefronts with warm lit windows, and an art deco cinema marquee glowing down the block. Light fog, a few people on the sidewalks. Cozy and slightly uncanny.',
        jobs: {
          arthemy: 40932,
          illustrij: 40933,
          novacomic: 40934,
          realism: 40935,
          nihilmania: 40936,
          krea2: 40937,
          zimage: 40938,
          flux2: 40939,
        },
      },
      {
        key: 'ck-oldtown',
        title: 'Setting, Old Town Eureka waterfront',
        asset: '',
        size: '1344x768',
        seed: 64204,
        prompt:
          'A Victorian old town on a working bay, with ornate painted gingerbread houses and brick storefronts, a wooden boardwalk along the water, fishing boats tied up at a pier and gulls overhead, under overcast silver light with a faint green shimmer on the water.',
        jobs: {
          arthemy: 40940,
          illustrij: 40941,
          novacomic: 40942,
          realism: 40943,
          nihilmania: 40944,
          krea2: 40945,
          zimage: 40946,
          flux2: 40947,
        },
      },
    ],
    notes: {
      people:
        "Krea 2 and Z-Image are the only lanes whose four portraits read as the cast: Mara as a Native tattoo artist sketching flash, Kit as a Hmong American juggler in patchwork coveralls with her sea-serpent sculpture, Juniper barefoot among ferns with the green ribbon, Cedar with the CB handset and the ribboned antenna. Arthemy, Illustrij and Nova Comic give the three women one shared anime face; Realism makes Mara and Kit white; nihilmania painted Kit yellow-skinned in a hard hat (rejected). Krea 2 put garbled text on Mara's apron.",
      places:
        "Partial. Z-Image rendered all four settings well (redwood grove, Bigfoot family picnic under a sea stack, Arcata Plaza with palms, statue and a theater marquee, Old Town's Victorian waterfront). Krea 2 matched it on Bigfoot and the Plaza. nihilmania drew three tourists instead of Bigfoot. Realism and nihilmania are photographic; keep them in mind for Silas's later idea of photo-real backdrops for real locations.",
      recommendation:
        'Z-Image Turbo as the Ecotone house lane for people and places (non-anthro, fast, painterly), Krea 2 as the alternate. Retire Arthemy for Ecotone. Revisit when Flux 2 and the remaining settings finish.',
    },
  },
  {
    id: 'round-3',
    title: 'Round 3 (Z-Image)',
    blurb:
      'Story beats and the companions together, on the provisional house lane.',
    lanes: [
      {
        key: 'zimage',
        label: 'Z-Image Turbo (provisional house lane)',
        engine: 'zimage',
        checkpoint: 'zimage',
        steps: null,
        cfg: null,
        sampler: null,
      },
    ],
    subjects: [
      {
        key: 'eco3-friends',
        title: "The Friends Who Aren't Here, actors in a lantern-lit clearing",
        asset: 'encounters/friends-who-arent-here',
        size: '1344x768',
        seed: 65101,
        prompt:
          'At night in a lantern-lit redwood park clearing, a troupe of adult human physical-theatre performers puts on a tribute show for a small delighted audience sitting on blankets. One grown man wears a handmade papier-mache chimpanzee mask pushed up on his forehead and a shaggy costume coat, blowing a raspberry; a grown woman in a sleek painted otter costume runs along a wooden fence beside a laughing child; three adult actors in knitted prairie dog hoods pop up from behind hay bales. Their human faces show clearly, theatrical, warm and bittersweet.',
        jobs: {
          zimage: 40963,
        },
      },
      {
        key: 'eco3-gr2',
        title: "GR-2 Something to Share, the acrobats' blanket",
        asset: 'encounters/gr-2-something-to-share',
        size: '1344x768',
        seed: 65102,
        prompt:
          "A sunny festival lawn at the edge of a redwood forest. A group of circus acrobats rests on a big patchwork blanket sharing water bottles, sandwiches and a basket of food; a huge bearded man with a gentle smile holds out a wax-paper parcel. In the background a woman in patched coveralls balances upside down on a partner's shoulders, and a giant moss-covered wooden puppet towers over the crowd.",
        jobs: {
          zimage: 40964,
        },
      },
      {
        key: 'eco3-gr4',
        title: 'GR-4 The Path Behind the Stage, the looping trail',
        asset: 'encounters/gr-4-path-behind-the-stage',
        size: '1344x768',
        seed: 65103,
        prompt:
          'A narrow trail runs straight into old-growth redwoods, marked with green ribbons tied at eye level. A fallen mossy log and a fern curled like a question mark sit beside the path, and in the foreground a bright yellow banana slug wearing a tiny racing helmet crosses a root. Soft mist, the same log and ribbons repeating faintly into the distance, quietly uncanny.',
        jobs: {
          zimage: 40965,
        },
      },
      {
        key: 'eco3-gr5',
        title: 'GR-5 The Closing Bonfire, the last night of the fair',
        asset: 'encounters/gr-5-closing-bonfire',
        size: '1344x768',
        seed: 65104,
        prompt:
          'The last night of a forest-edge festival. A tall wicker sculpture of a redwood tree burns in a great bonfire in a meadow while a crowd watches, silhouetted. A giant moss-covered puppet bows beside the fire, two folding tables hold clipboards and lanterns, and the smoke rising over the flames forms the faint outline of a coastline.',
        jobs: {
          zimage: 40966,
        },
      },
      {
        key: 'eco3-kn2',
        title: 'KN-2 The Afterparty, the waterfront warehouse',
        asset: 'encounters/kn-2-the-afterparty',
        size: '1344x768',
        seed: 65105,
        prompt:
          'An old timber warehouse on a foggy bay waterfront at night, turned into a party. A brass band plays under strings of bulbs while dancers in wild homemade race costumes whirl past a pedal-powered sculpture parked inside. Through the open doors a pickup truck waits with its tailgate down and a CB antenna tied with a green ribbon.',
        jobs: {
          zimage: 40967,
        },
      },
      {
        key: 'eco3-kn4',
        title: 'KN-4 Conscripted, the Banana Slug Express',
        asset: 'encounters/kn-4-conscripted',
        size: '1344x768',
        seed: 65106,
        prompt:
          "Morning on a foggy bay waterfront. A twelve-foot yellow banana slug sculpture on bicycle wheels waits at the water's edge. A woman sits on a cooler with a bag of frozen peas on her ankle, pointing a crutch at the viewer with a grin, while her costumed race crew holds out a bicycle helmet with springy antennae on it.",
        jobs: {
          zimage: 40968,
        },
      },
      {
        key: 'eco3-kn5',
        title: 'KN-5 The Bay Crossing, slug and octopus in the fog',
        asset: 'encounters/kn-5-the-bay-crossing',
        size: '1344x768',
        seed: 65107,
        prompt:
          'A pedal-powered yellow banana slug sculpture floats and paddle-wheels across a wide foggy bay beside a pedal-powered purple octopus sculpture, both crewed by people in costumes. Small spectator boats follow, curious harbor seals watch from the water, and a bell buoy rings in a bank of fog ahead.',
        jobs: {
          zimage: 40969,
        },
      },
      {
        key: 'eco3-kn6',
        title: 'KN-6 The Ferndale Finish, Main Street and the cemetery hill',
        asset: 'encounters/kn-6-the-ferndale-finish',
        size: '1344x768',
        seed: 65108,
        prompt:
          'A Victorian village main street lined with ornate painted gingerbread houses and cheering crowds. A muddy yellow banana slug sculpture on bicycle wheels rolls toward a finish banner. On the green hillside above town, among old white headstones in an oak-shaded cemetery, a man in a black frock coat waves a checkered flag.',
        jobs: {
          zimage: 40970,
        },
      },
    ],
    notes: {},
  },
  {
    id: 'round-2',
    title: 'Round 2',
    blurb: 'New cards on the old house lane (Arthemy).',
    lanes: [
      {
        key: 'house',
        label: 'Arthemy Western Art v3.0 (house)',
        engine: 'comfy',
        checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
        steps: 30,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
    ],
    subjects: [
      {
        key: 'eco2-marsh',
        title: 'Arcata Marsh, the marsh that eats its words',
        asset: 'encounters/arcata-marsh',
        size: '1344x768',
        seed: 63101,
        prompt:
          'wide shot, a tidal freshwater marsh at golden dusk, still ponds with reflections, tall reeds and cattails, a wooden boardwalk path, egrets and ducks, a heron standing in the shallows, a distant small town and bay beyond, faint green radio-wave ripples glowing across the water, serene and quietly uncanny',
        jobs: {
          house: 40875,
        },
      },
      {
        key: 'eco2-fickle-hill',
        title: 'Fickle Hill, bad reception',
        asset: 'encounters/fickle-hill',
        size: '1344x768',
        seed: 63102,
        prompt:
          'wide shot, a narrow ridge road climbing through second-growth redwoods at night, thick fog pouring over the ridge, an old pickup truck parked on the shoulder with its dome light on, a cb radio antenna with a faded green ribbon, the lights of a small college town glowing far below through a gap in the fog, a thin beam of green light rising from the radio',
        jobs: {
          house: 40876,
        },
      },
      {
        key: 'eco2-latitude-1',
        title: 'WH-121, The Latitude Argument (seed 1)',
        asset: 'encounters/wh-121-latitude-argument',
        size: '1344x768',
        seed: 63111,
        prompt:
          'wide shot, (a ragged group of 1849 frontier explorers:1.2) in worn coats and battered hats at a foggy river mouth on the pacific coast, one bearded man stubbornly kneeling with a brass sextant and a notebook, the other exhausted men gesturing angrily toward the far bank, pack mules, driftwood, cold surf, comic exasperation, the fog faintly glowing as if from another century',
        jobs: {
          house: 40877,
        },
      },
      {
        key: 'eco2-latitude-2',
        title: 'WH-121, The Latitude Argument (seed 2)',
        asset: 'encounters/wh-121-latitude-argument',
        size: '1344x768',
        seed: 63112,
        prompt:
          'wide shot, (a ragged group of 1849 frontier explorers:1.2) in worn coats and battered hats at a foggy river mouth on the pacific coast, one bearded man stubbornly kneeling with a brass sextant and a notebook, the other exhausted men gesturing angrily toward the far bank, pack mules, driftwood, cold surf, comic exasperation, the fog faintly glowing as if from another century',
        jobs: {
          house: 40878,
        },
      },
      {
        key: 'eco2-friends-1',
        title: "The Friends Who Aren't Here (seed 1)",
        asset: 'encounters/friends-who-arent-here',
        size: '1344x768',
        seed: 63121,
        prompt:
          'wide shot, an outdoor physical theatre performance at night in a redwood park clearing lit by lanterns, (performers in handmade masks and costumes:1.3), one actor in a chimpanzee mask and furry coat pacing playfully, one actor in a sleek river otter costume running beside a laughing child, several small actors in prairie dog hoods popping up from behind hay bales, a small delighted audience, warm magical tribute mood',
        jobs: {
          house: 40879,
        },
      },
      {
        key: 'eco2-friends-2',
        title: "The Friends Who Aren't Here (seed 2)",
        asset: 'encounters/friends-who-arent-here',
        size: '1344x768',
        seed: 63122,
        prompt:
          'wide shot, an outdoor physical theatre performance at night in a redwood park clearing lit by lanterns, (performers in handmade masks and costumes:1.3), one actor in a chimpanzee mask and furry coat pacing playfully, one actor in a sleek river otter costume running beside a laughing child, several small actors in prairie dog hoods popping up from behind hay bales, a small delighted audience, warm magical tribute mood',
        jobs: {
          house: 40880,
        },
      },
      {
        key: 'eco2-anchor-stores-1',
        title: 'Anchor Stores, the mall after hours (seed 1)',
        asset: 'encounters/anchor-stores',
        size: '1344x768',
        seed: 63131,
        prompt:
          'wide shot, the interior of a half-empty 1980s shopping mall at night, dim skylights, a dry fountain, potted palms, rows of dark shuttered storefronts, but three of the storefronts glow with impossible scenes, one opens onto a green forest town with solar roofs, one onto a gleaming corporate warehouse, one onto a foggy abandoned food court, liminal and eerie and funny',
        jobs: {
          house: 40881,
        },
      },
      {
        key: 'eco2-anchor-stores-2',
        title: 'Anchor Stores, the mall after hours (seed 2)',
        asset: 'encounters/anchor-stores',
        size: '1344x768',
        seed: 63132,
        prompt:
          'wide shot, the interior of a half-empty 1980s shopping mall at night, dim skylights, a dry fountain, potted palms, rows of dark shuttered storefronts, but three of the storefronts glow with impossible scenes, one opens onto a green forest town with solar roofs, one onto a gleaming corporate warehouse, one onto a foggy abandoned food court, liminal and eerie and funny',
        jobs: {
          house: 40882,
        },
      },
      {
        key: 'eco2-behind-the-mall',
        title: 'Behind the Mall, the graffiti by the water',
        asset: 'encounters/behind-the-mall',
        size: '1344x768',
        seed: 63141,
        prompt:
          'wide shot, a concrete wall covered in colorful abstract graffiti murals beside a quiet bay slough at dusk, tall reeds, a student film crew with a camera on a tripod and a boom microphone, a homemade rubber monster costume standing in the reeds looking surprisingly real, string of work lights, purple and orange sky, comedic horror',
        jobs: {
          house: 40883,
        },
      },
    ],
    notes: {},
  },
  {
    id: 'round-1',
    title: 'Round 1',
    blurb: 'The first Ecotone ledger on the old house lane (Arthemy).',
    lanes: [
      {
        key: 'house',
        label: 'Arthemy Western Art v3.0 (house)',
        engine: 'comfy',
        checkpoint: 'Illustrious/arthemyWesternArt_v30.safetensors',
        steps: 30,
        cfg: 5,
        sampler: 'euler_ancestral',
      },
    ],
    subjects: [
      {
        key: 'eco1-project-icon',
        title: 'Project icon',
        asset: 'project/icon',
        size: '1024x1024',
        seed: 61901,
        prompt:
          'app icon, centered emblem, a single giant redwood tree whose roots become a glowing radio wave, a crescent moon behind it, fog band across the trunk, bold simple silhouette, strong contrast, dark teal background',
        jobs: {
          house: 40841,
        },
      },
      {
        key: 'eco1-project-card',
        title: 'Project card',
        asset: 'project/card',
        size: '832x1216',
        seed: 61902,
        prompt:
          "vertical key art, four adult friends seen from behind on a forest trail at night, looking up at towering redwoods, a ribbon of green light running through the trees like a radio signal, festival lanterns far below, a pickup truck's headlights in the fog, sense of wonder and mild dread",
        jobs: {
          house: 40842,
        },
      },
      {
        key: 'eco1-project-hero',
        title: 'Project hero',
        asset: 'project/hero',
        size: '1344x768',
        seed: 61903,
        prompt:
          "wide establishing shot, humboldt bay at dusk seen from a redwood ridge, fog rolling in over the water, a small town's lights along the shore, a hand-built kinetic sculpture vehicle crossing the tide flats, a faint second skyline shimmering in the clouds like an alternate future, aurora-green static in the sky",
        jobs: {
          house: 40843,
        },
      },
      {
        key: 'eco1-title-1',
        title: 'Play title art (seed 1)',
        asset: 'title/key-art',
        size: '1344x768',
        seed: 61911,
        prompt:
          'wide shot, a forest-edge festival meadow at night, a huge handmade wooden puppet draped in moss, string lights, distant juggler silhouette, the redwood tree line glowing faintly from within, a shaft of green light in the fog, an old pickup with a radio antenna, magical realism, uncanny but welcoming',
        jobs: {
          house: 40844,
        },
      },
      {
        key: 'eco1-title-2',
        title: 'Play title art (seed 2)',
        asset: 'title/key-art',
        size: '1344x768',
        seed: 61912,
        prompt:
          'wide shot, a forest-edge festival meadow at night, a huge handmade wooden puppet draped in moss, string lights, distant juggler silhouette, the redwood tree line glowing faintly from within, a shaft of green light in the fog, an old pickup with a radio antenna, magical realism, uncanny but welcoming',
        jobs: {
          house: 40845,
        },
      },
      {
        key: 'eco1-mara-1',
        title: 'Mara, sober guide (seed 1)',
        asset: 'companions/mara',
        size: '832x1216',
        seed: 61921,
        prompt:
          'solo, adult woman, indigenous californian woman in her thirties, (fully clothed:1.2), long black hair tied back, sleeves of modern fine-line tattoos on both forearms, black t-shirt and canvas shop apron, pencil behind her ear, sketchbook of bird flash designs, dry knowing half smile, sitting at a festival tattoo flash table under string lights, cowboy shot, warm lamplight, redwood forest behind',
        jobs: {
          house: 40846,
        },
      },
      {
        key: 'eco1-mara-2',
        title: 'Mara, sober guide (seed 2)',
        asset: 'companions/mara',
        size: '832x1216',
        seed: 61922,
        prompt:
          'solo, adult woman, indigenous californian woman in her thirties, (fully clothed:1.2), long black hair tied back, sleeves of modern fine-line tattoos on both forearms, black t-shirt and canvas shop apron, pencil behind her ear, sketchbook of bird flash designs, dry knowing half smile, sitting at a festival tattoo flash table under string lights, cowboy shot, warm lamplight, redwood forest behind',
        jobs: {
          house: 40847,
        },
      },
      {
        key: 'eco1-kit-1',
        title: 'Kit, tipsy guide (seed 1)',
        asset: 'companions/kit',
        size: '832x1216',
        seed: 61931,
        prompt:
          'solo, adult woman, hmong american woman in her late twenties, (fully clothed:1.2), short asymmetric black hair, paint-splattered mechanic coveralls with bright fabric patches, juggling three clubs mid-air, laughing, athletic stance, beside a whimsical pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights, dynamic pose, cowboy shot',
        jobs: {
          house: 40848,
        },
      },
      {
        key: 'eco1-kit-2',
        title: 'Kit, tipsy guide (seed 2)',
        asset: 'companions/kit',
        size: '832x1216',
        seed: 61932,
        prompt:
          'solo, adult woman, hmong american woman in her late twenties, (fully clothed:1.2), short asymmetric black hair, paint-splattered mechanic coveralls with bright fabric patches, juggling three clubs mid-air, laughing, athletic stance, beside a whimsical pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights, dynamic pose, cowboy shot',
        jobs: {
          house: 40849,
        },
      },
      {
        key: 'eco1-juniper-1',
        title: 'Juniper, stoned guide (seed 1)',
        asset: 'companions/juniper',
        size: '832x1216',
        seed: 61941,
        prompt:
          'solo, adult woman, young woman in her twenties, curvy, (fully clothed:1.3), layered thrift-store sweater and long patchwork skirt, messy auburn hair with a green ribbon and tiny ferns growing in it, freckles, warm teasing smile, barefoot on moss among giant redwood roots, her reflection in a puddle has branches growing from its head, soft green forest glow, cowboy shot',
        jobs: {
          house: 40850,
        },
      },
      {
        key: 'eco1-juniper-2',
        title: 'Juniper, stoned guide (seed 2)',
        asset: 'companions/juniper',
        size: '832x1216',
        seed: 61942,
        prompt:
          'solo, adult woman, young woman in her twenties, curvy, (fully clothed:1.3), layered thrift-store sweater and long patchwork skirt, messy auburn hair with a green ribbon and tiny ferns growing in it, freckles, warm teasing smile, barefoot on moss among giant redwood roots, her reflection in a puddle has branches growing from its head, soft green forest glow, cowboy shot',
        jobs: {
          house: 40851,
        },
      },
      {
        key: 'eco1-cedar-1',
        title: 'Cedar, tripping guide (seed 1)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 61951,
        prompt:
          'solo, adult man, contemporary Humboldt working man in his early thirties, Hispanic paternal heritage, rural and mechanically skilled, (fully clothed:1.2), stubble, worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, toolbox in the bed, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40852,
        },
      },
      {
        key: 'eco1-cedar-2',
        title: 'Cedar, tripping guide (seed 2)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 61952,
        prompt:
          'solo, adult man, contemporary Humboldt working man in his early thirties, Hispanic paternal heritage, rural and mechanically skilled, (fully clothed:1.2), stubble, worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, toolbox in the bed, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40853,
        },
      },
      {
        key: 'eco1-ch1-arcata',
        title: 'Chapter 1, Arcata After Hours',
        asset: 'chapters/arcata-after-hours',
        size: '1344x768',
        seed: 61961,
        prompt:
          'wide shot, a small-town college plaza at midnight, a central statue on a lawn, palm and redwood trees, old brick storefronts with warm windows, an empty art deco cinema marquee glowing, fog, a single streetlight flickering green, scattered late-night people, cozy and uncanny',
        jobs: {
          house: 40854,
        },
      },
      {
        key: 'eco1-ch2-coast',
        title: 'Chapter 2, Coast of Improbable Tides',
        asset: 'chapters/coast-of-improbable-tides',
        size: '1344x768',
        seed: 61962,
        prompt:
          'wide shot, a wide sandy beach at a creek mouth with huge dark sea stacks, morning fog, the tide flowing backward out to sea leaving shimmering ripples, a picnic blanket and cooler abandoned on the sand, enormous footprints leading to the rocks, wistful and strange',
        jobs: {
          house: 40855,
        },
      },
      {
        key: 'eco1-ch3-eureka',
        title: 'Chapter 3, Eureka and the Bay',
        asset: 'chapters/eureka-and-the-bay',
        size: '1344x768',
        seed: 61963,
        prompt:
          "wide shot, an ornate victorian old town waterfront on a working bay, painted gingerbread mansion, fishing boats at a wooden pier, gulls, overcast silver light, a crowd in homemade costumes at the water's edge, a marching band, a faint green static shimmer on the water, civic and absurd",
        jobs: {
          house: 40856,
        },
      },
      {
        key: 'eco1-ch4-backroads',
        title: 'Chapter 4, Backroads and Bad Reception',
        asset: 'chapters/backroads-and-bad-reception',
        size: '1344x768',
        seed: 61964,
        prompt:
          'wide shot, a winding two-lane mountain highway through dark forested ridges at night, a lone roadside diner with a giant carved wooden sasquatch statue, a radio tower blinking red on the ridge, strange lights hovering above the trees, a pickup pulled over with headlights on, cryptid country mood',
        jobs: {
          house: 40857,
        },
      },
      {
        key: 'eco1-ch5-older-roads',
        title: 'Chapter 5, Southern Humboldt and Older Roads',
        asset: 'chapters/southern-humboldt-older-roads',
        size: '1344x768',
        seed: 61965,
        prompt:
          'wide shot, a narrow road through a cathedral grove of ancient giant redwoods, shafts of golden light through mist, a river glinting below, a tiny old car dwarfed by the trunks, ferns, a hush of deep time, rural surrealism, one tree trunk bearing a door that should not be there',
        jobs: {
          house: 40858,
        },
      },
      {
        key: 'eco1-ch6-festival',
        title: 'Chapter 6, The Impossible Festival',
        asset: 'chapters/the-impossible-festival',
        size: '1344x768',
        seed: 61966,
        prompt:
          'wide shot, a parade of fantastical human-powered kinetic sculpture vehicles racing across sand dunes toward the bay, crowds cheering, costumes, two different skies meeting overhead, one sunny and green, one stormy with industrial silhouettes, converging timelines, joyful chaos and high stakes',
        jobs: {
          house: 40859,
        },
      },
      {
        key: 'eco1-prologue',
        title: 'Prologue, the woman who knows the trail',
        asset: 'scenes/prologue-meadow',
        size: '1344x768',
        seed: 61971,
        prompt:
          'wide shot, a forest-edge festival meadow at twilight, a hand-painted wooden sign at the trail head, a young woman with a green ribbon in her hair waiting by the path, a puddle reflecting her with branches growing from her head, juggler with clubs in the background, string lights, moss-covered giant puppet',
        jobs: {
          house: 40860,
        },
      },
      {
        key: 'eco1-wh006-minor',
        title: 'WH-006, The Last Houdini Exit',
        asset: 'encounters/wh-006-last-exit',
        size: '1344x768',
        seed: 61981,
        prompt:
          'wide shot, an empty old art deco movie theater stage after midnight, red velvet curtain, a trapdoor lifted one inch with a white-gloved hand pushing up a folded note, dusty spotlight beam, empty seats, warm gold and deep red, comedic eerie mood',
        jobs: {
          house: 40861,
        },
      },
      {
        key: 'eco1-wh021-picnic',
        title: 'WH-021, Bigfoot Family Picnic',
        asset: 'encounters/wh-021-bigfoot-picnic',
        size: '1344x768',
        seed: 61982,
        prompt:
          'wide shot, a family of three enormous gentle sasquatches in sun hats having a beach picnic among sea stacks, a checked blanket, a cooler, a platter piled with deviled eggs, the youngest holding up a phone for a selfie, the tide flowing backward, foggy morning, wholesome and absurd',
        jobs: {
          house: 40862,
        },
      },
      {
        key: 'eco1-wh061-plunge',
        title: 'WH-061, The Perilous Plunge into Monday',
        asset: 'encounters/wh-061-perilous-plunge',
        size: '1344x768',
        seed: 61983,
        prompt:
          'wide shot, a waterfront charity plunge on a cold bay, costumed jumpers queued on a dock, a volunteer in a homemade squid costume surfacing holding a soggy newspaper aloft, a marching band, a steaming hot tub, overcast morning, a faint clock-shaped ripple in the water, joyful civic absurdity',
        jobs: {
          house: 40863,
        },
      },
      {
        key: 'eco1-card-back',
        title: 'Card back',
        asset: 'ui/card-back',
        size: '832x1216',
        seed: 61991,
        prompt:
          'ornamental card back design, symmetrical, a redwood tree in the center with roots and branches mirrored, a crescent moon, concentric radio-wave rings, dark teal and antique gold, art nouveau border, centered',
        jobs: {
          house: 40864,
        },
      },
      {
        key: 'eco1-cedar-r2-1',
        title: 'Cedar, tripping guide (reroll, seed 1)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 62051,
        prompt:
          '1boy, solo, (male focus:1.3), (mature man:1.2), rugged rural man in his thirties, short beard stubble, broad shoulders, (fully clothed:1.2), worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40865,
        },
      },
      {
        key: 'eco1-cedar-r2-2',
        title: 'Cedar, tripping guide (reroll, seed 2)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 62052,
        prompt:
          '1boy, solo, (male focus:1.3), (mature man:1.2), rugged rural man in his thirties, short beard stubble, broad shoulders, (fully clothed:1.2), worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40866,
        },
      },
      {
        key: 'eco1-ch5-r2',
        title: 'Chapter 5, Southern Humboldt and Older Roads (reroll)',
        asset: 'chapters/southern-humboldt-older-roads',
        size: '1344x768',
        seed: 62065,
        prompt:
          'wide shot, (giant ancient redwood trunks:1.3) towering like cathedral pillars, enormous red-brown bark, a narrow two-lane road winding between the giant trunks, a tiny vintage car dwarfed by the trees, golden sun rays through mist, ferns, one massive trunk with a small wooden door in its base, hush of deep time',
        jobs: {
          house: 40867,
        },
      },
      {
        key: 'eco1-ch6-r2',
        title: 'Chapter 6, The Impossible Festival (reroll)',
        asset: 'chapters/the-impossible-festival',
        size: '1344x768',
        seed: 62066,
        prompt:
          'wide shot, a race of whimsical (human-powered kinetic sculptures:1.3), giant pedal-powered contraptions shaped like a dragon, a snail and a fish, riders pedaling hard, racing across sand dunes toward a bay, cheering crowd in colorful costumes, split sky, sunny green sky on the left, storm clouds over smokestacks on the right, joyful chaos',
        jobs: {
          house: 40868,
        },
      },
      {
        key: 'eco1-wh021-r2',
        title: 'WH-021, Bigfoot Family Picnic (reroll)',
        asset: 'encounters/wh-021-bigfoot-picnic',
        size: '1344x768',
        seed: 62082,
        prompt:
          'wide shot, (three sasquatches:1.3), bigfoot family, huge gentle furry brown creatures wearing straw sun hats, sitting on a checked picnic blanket on a beach, a platter piled with deviled eggs, a blue cooler, the smallest sasquatch holding up a smartphone for a family selfie, dark sea stacks, foggy morning, wholesome and comedic',
        jobs: {
          house: 40869,
        },
      },
      {
        key: 'eco1-wh061-r2',
        title: 'WH-061, The Perilous Plunge into Monday (reroll)',
        asset: 'encounters/wh-061-perilous-plunge',
        size: '1344x768',
        seed: 62083,
        prompt:
          'wide shot, a crowd in homemade costumes on a wooden dock, a person in a (homemade red squid costume:1.3) with floppy tentacles bursting up out of cold grey water, holding a soggy newspaper high above their head, a marching band with brass instruments on the dock, overcast morning, splashes, festive civic absurdity',
        jobs: {
          house: 40870,
        },
      },
      {
        key: 'eco1-kit-r3-1',
        title: 'Kit, tipsy guide (Hmong American, seed 1)',
        asset: 'companions/kit',
        size: '832x1216',
        seed: 62131,
        prompt:
          'solo, adult woman, (hmong american woman:1.2) in her late twenties, southeast asian features, (fully clothed:1.2), short asymmetric black hair, paint-splattered mechanic coveralls with bright fabric patches, (juggling three clubs:1.2) mid-air, laughing, athletic stance, beside a whimsical pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights, dynamic pose, cowboy shot',
        jobs: {
          house: 40871,
        },
      },
      {
        key: 'eco1-kit-r3-2',
        title: 'Kit, tipsy guide (Hmong American, seed 2)',
        asset: 'companions/kit',
        size: '832x1216',
        seed: 62132,
        prompt:
          'solo, adult woman, (hmong american woman:1.2) in her late twenties, southeast asian features, (fully clothed:1.2), short asymmetric black hair, paint-splattered mechanic coveralls with bright fabric patches, (juggling three clubs:1.2) mid-air, laughing, athletic stance, beside a whimsical pedal-powered kinetic sculpture with brass gears and a papier mache sea serpent head, festival lights, dynamic pose, cowboy shot',
        jobs: {
          house: 40872,
        },
      },
      {
        key: 'eco1-cedar-r3-1',
        title: 'Cedar, tripping guide (half Hispanic, seed 1)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 62151,
        prompt:
          '1boy, solo, (male focus:1.3), (mature man:1.2), rugged rural man in his thirties, (mixed latino heritage:1.2), warm light brown skin, dark hair, short beard stubble, broad shoulders, (fully clothed:1.2), worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40873,
        },
      },
      {
        key: 'eco1-cedar-r3-2',
        title: 'Cedar, tripping guide (half Hispanic, seed 2)',
        asset: 'companions/cedar',
        size: '832x1216',
        seed: 62152,
        prompt:
          '1boy, solo, (male focus:1.3), (mature man:1.2), rugged rural man in his thirties, (mixed latino heritage:1.2), warm light brown skin, dark hair, short beard stubble, broad shoulders, (fully clothed:1.2), worn trucker cap, oil-stained canvas work jacket, scuffed work boots, holding a vintage cb radio handset with a coiled cord, mischievous confident grin, leaning on an old pickup truck with a faded green ribbon tied to its antenna, redwood backroad at dusk, cowboy shot',
        jobs: {
          house: 40874,
        },
      },
    ],
    notes: {},
  },
]

/** Every job id across the rounds, for one batched status read. */
export function artReviewJobIds(round: ArtReviewRound): number[] {
  return [
    ...new Set(
      round.subjects.flatMap((subject) => Object.values(subject.jobs)),
    ),
  ]
}
