import type { PlaybookKitSpec } from '../types'

// The reference playbook: a complete Vignette that exercises every surface of
// the kit. New playbooks are scaffolded from this shape
// (npm run playbook:new -- <slug> "<Title>").

export const LANTERN_FERRY: PlaybookKitSpec = {
  id: 'lantern-ferry',
  conductorSlug: 'playbook-kit',
  title: 'The Lantern Ferry',
  tagline: 'One night. One river. Everyone you can carry.',
  premise:
    'On the last night before the waterworks floods the valley, can a brand-new ferry pilot carry its strangest passengers across without sinking the boat, the company or themselves?',
  tier: 'vignette',
  artPromptsComplete: true,
  keyArt: {
    brief:
      'Painted storybook key art: a small paddle ferry hung with paper lanterns crossing a black river at night, a giant concrete dam glowing on the horizon, a rusty lantern robot at the bow, warm amber against deep teal',
    prompt:
      'A small wooden paddle ferry hung with glowing paper lanterns crosses a wide black river at night. A huge concrete dam stands on the horizon with rows of lit windows along its top. At the bow a small rusty robot with a glass lantern for a head holds up one arm. Amber lantern light reflects on the dark water. Wide shot from low on the water, painted storybook illustration in amber and deep teal.',
    alt: 'A lantern-hung ferry crossing a dark river toward a glowing dam',
  },
  acts: [
    {
      id: 1,
      title: 'Cast Off',
      blurb: 'Take on passengers and learn the river.',
    },
    {
      id: 2,
      title: 'The Flood Gate',
      blurb: 'The water rises. Someone opened the gate early.',
    },
  ],
  meters: [
    { id: 'oil', label: 'Lamp oil', min: 0, max: 10, start: 7 },
    {
      id: 'trust',
      label: 'Passenger trust',
      min: 0,
      max: 10,
      start: 4,
      faction: 'lanterners',
    },
    { id: 'river', label: 'River rise', min: 0, max: 10, start: 2 },
  ],
  factions: [
    {
      id: 'lanterners',
      name: 'The Valley Lanterners',
      tagline: 'They keep a light in every window the river will take.',
      tone: 'warning',
      emblem: {
        brief:
          'Folk-art emblem: a paper lantern inside a ring of reeds, hand-stamped amber ink',
        prompt:
          'A round stamp of amber ink pressed on rough cream paper: a simple paper lantern drawn in thick lines at the centre, circled by a ring of river reeds. The ink is uneven where the block pressed harder. Flat overhead view, hand-printed folk woodblock style, amber on cream.',
      },
    },
    {
      id: 'waterworks',
      name: "Founder's Waterworks",
      tagline: 'Progress, on schedule, at any depth.',
      tone: 'info',
      emblem: {
        brief:
          'Art-deco corporate seal: a stylized dam with three gears, cold blue enamel',
        prompt:
          'A round enamel badge in cold blue and polished steel: a straight-sided dam drawn in clean lines with three interlocking gears above it, set inside a thin steel ring. Hard white light from the upper left. Flat front view, 1930s art-deco metalwork, cold blue and silver.',
      },
    },
  ],
  cast: [
    {
      id: 'pim',
      name: 'Pim',
      role: 'follower',
      tagline:
        'The ferry lantern. Rusty, earnest, convinced it is the captain.',
      portrait: {
        brief:
          'Character portrait: a small rusty lantern-headed robot with a glowing wick face, brass rivets, wrapped in a too-big rain scarf',
        prompt:
          'A small rusty robot stands on the wet planks of a ferry deck at night. Its head is a glass lantern with a glowing wick inside, and two dark rivets above the flame serve as eyes. Its tin body is dotted with brass rivets and wrapped in an oversized red wool rain scarf that trails on the deck. Warm light from its own head, rain falling behind it. Close-up portrait at the robot’s eye level, painted storybook illustration in amber, rust and teal.',
      },
    },
    {
      id: 'ottoline',
      name: 'Ottoline Reeve',
      role: 'follower',
      tagline:
        'Retired river cartographer. Has mapped every sandbar, and every lie.',
      faction: 'lanterners',
      portrait: {
        brief:
          'Character portrait: an elderly woman in an oilskin coat with brass map-cases on a bandolier, sharp eyes behind round spectacles',
        prompt:
          'An elderly woman with short white hair stands on a riverbank dock at night in a long brown oilskin coat. A leather bandolier of brass map cases crosses her chest. Her sharp grey eyes look straight ahead through round wire spectacles, and one hand rests on a rolled map. Lamplight from the right. Head and shoulders portrait, painted storybook illustration in amber, brown and deep teal.',
      },
    },
    {
      id: 'juno',
      name: 'Juno Marsh',
      role: 'follower',
      tagline:
        'Smuggler-poet with a crate she will not open and a verse for every bridge.',
      portrait: {
        brief:
          'Character portrait: a lanky smuggler in a patched velvet coat, ink-stained fingers, a wooden crate under one arm, wry half-smile',
        prompt:
          'A lanky young woman with cropped black hair leans on a ferry rail in a patched plum velvet coat, a plain wooden crate tucked under one arm. Her fingers are stained with blue ink and she wears a wry half-smile. Paper lanterns glow behind her and rain beads on her shoulders. Waist-up portrait from slightly below, painted storybook illustration in plum, amber and teal.',
      },
      romance: {
        arc: 'Learning whether the person who always leaves will stay for one crossing.',
        moments: ['juno-dock-poem', 'juno-stern-dance'],
      },
    },
    {
      id: 'weir',
      name: 'Ansel Weir',
      role: 'villain',
      primary: true,
      tagline:
        "The Waterworks' founder, who would rather drown a valley than admit a mistake.",
      faction: 'waterworks',
      portrait: {
        brief:
          'Villain portrait: an immaculate industrialist in a grey tailored coat on a rain-lashed dam walkway, umbrella held by an aide, cold smile',
        prompt:
          'A tall middle-aged man in an immaculate tailored grey overcoat stands on a concrete dam walkway in driving rain, smiling coldly at the viewer. An aide in a dark raincoat holds a black umbrella over him. Floodlights on the dam light him from above and behind. Waist-up portrait at eye level, painted storybook illustration in cold grey, steel blue and a little amber.',
      },
    },
    {
      id: 'heron',
      name: 'The Toll Heron',
      role: 'figure',
      tagline: 'Takes one memory from every passenger. Keeps them all.',
      portrait: {
        brief:
          'Mythic portrait: an enormous pale heron wearing a toll-keeper cap, standing on a mooring post in fog, ledger tucked under one wing',
        prompt:
          'An enormous pale grey heron stands on a wooden mooring post in thick river fog, taller than a person. It wears a small dark blue toll-keeper’s peaked cap and holds a thick leather ledger tucked under one wing. Its yellow eye looks down at the viewer. Soft white fog light, black water below. Full-body view from low on the water, painted storybook illustration in pale grey, white and deep teal.',
      },
    },
  ],
  reveals: [
    {
      id: 'pim-first-pilot',
      title: "Pim's first pilot",
      teaser: 'Pim keeps calling you by a name that is not yours.',
      text: 'Pim was built by your grandmother, the ferry’s first pilot. It has been waiting forty years to say goodbye to her properly.',
      act: 1,
      about: ['pim'],
    },
    {
      id: 'cracked-keystone',
      title: 'The cracked keystone',
      teaser: 'Why would anyone flood a valley a day early?',
      text: 'The dam is failing. Weir opened the gate early to bury the evidence under the reservoir before the inspectors arrive.',
      act: 2,
      about: ['weir', 'waterworks'],
    },
    {
      id: 'heron-ledger',
      title: "The Heron's ledger",
      teaser: 'The Heron already knows every passenger’s name. Even yours.',
      text: 'The ledger holds the valley’s memories. Whoever carries it across keeps the valley alive in someone’s head after the water comes.',
      act: 2,
      about: ['heron', 'lanterners'],
    },
  ],
  endings: [
    {
      id: 'every-lamp-lit',
      title: 'Every Lamp Lit',
      tone: 'hopeful',
      summary:
        'Every passenger lands, the ledger crosses with them, and the inspectors read the keystone report on the far bank at dawn.',
      hint: 'Trust your passengers before you trust the current.',
      about: ['lanterners', 'weir', 'ottoline'],
      art: {
        brief:
          'Dawn on a riverbank crowded with lantern-holding villagers, the ferry beached behind them, an old cartographer handing papers to inspectors',
        prompt:
          'Dawn on a muddy riverbank crowded with villagers holding paper lanterns, a small paddle ferry beached on the shingle behind them. In front, an elderly woman in a brown oilskin coat hands a bundle of papers to two inspectors in grey uniforms. Pale gold sunrise from the left, the lanterns still glowing. Wide shot at eye level, painted storybook illustration in gold, amber and soft teal.',
      },
    },
    {
      id: 'last-light-upriver',
      title: 'Last Light Upriver',
      tone: 'bittersweet',
      summary:
        'Pim stays behind to hold the lantern steady at the flood gate so the others can cross. The valley floods. Pim’s light never goes out.',
      hint: 'Someone has been waiting a long time to finish a job.',
      about: ['pim'],
      art: {
        brief:
          'A tiny lantern robot glowing alone on a flooding stone gate at night, the ferry far downstream, the light reflected in rising water',
        prompt:
          'A tiny rusty robot with a glass lantern for a head stands alone on top of a stone flood gate at night, its flame glowing. Rising black water pours over the gate around its feet. Far downstream a small paddle ferry hung with lanterns drifts away. The robot’s light reflects in a long line on the water. Wide shot from above, painted storybook illustration in amber and deep teal.',
      },
    },
    {
      id: 'insurance-paid',
      title: 'Insurance Paid',
      tone: 'dark',
      summary:
        'You take Weir’s offer. The ferry sinks on schedule, the valley drowns quietly, and your name goes on a plaque on the dam.',
      hint: 'Some offers arrive in a very good coat.',
      about: ['weir', 'waterworks'],
      art: {
        brief:
          'A polished brass plaque on a concrete dam engraved with a pilot’s name, a sunken ferry lantern visible through still water below',
        prompt:
          'A polished brass plaque bolted to a wet concrete dam wall, engraved with a single name. Below it, through still clear water, a sunken paper lantern and the rail of a small ferry rest on the riverbed. Grey morning light from above. Close-up from the side, painted storybook illustration in brass, grey and murky green.',
      },
    },
    {
      id: 'pim-takes-the-wheel',
      title: 'Pim Takes the Wheel',
      tone: 'comic',
      summary:
        'Pim declares itself captain, steers straight over the spillway, and somehow the whole ferry surfs to the sea. Juno writes an epic about it.',
      hint: 'Give the lantern exactly what it keeps asking for.',
      about: ['pim', 'juno'],
      art: {
        brief:
          'Comic action painting: a lantern-hung ferry surfing down a dam spillway, a tiny robot at the wheel shouting, passengers clinging on laughing',
        prompt:
          'A small paddle ferry hung with swinging paper lanterns surfs down the white water of a concrete dam spillway at night. A tiny rusty robot with a glass lantern head stands at the wheel with its mouth open, shouting. Passengers cling to the rails, laughing, spray flying around them. Dynamic wide shot from below the spillway, painted storybook comic illustration in amber, white and teal.',
      },
    },
  ],
  moments: [
    {
      id: 'cast-off',
      title: 'Cast off',
      caption:
        'The mooring rope slips free and the lanterns swing out over black water.',
      kind: 'scene',
      act: 1,
      about: [],
      art: {
        brief:
          'Wide cinematic shot: a ferry pulling away from a wooden dock at night, lanterns swinging, rain starting',
        prompt:
          'A small paddle ferry hung with paper lanterns pulls away from an old wooden dock at night. The mooring rope slides off a post into black water, the lanterns swing on their strings and the first rain dots the river. Wide shot from the dock, painted storybook illustration in amber and deep teal.',
      },
    },
    {
      id: 'pim-wakes',
      title: 'Pim wakes up',
      caption: '“Captain on deck!” says the lantern, to nobody, very loudly.',
      kind: 'follower',
      act: 1,
      about: ['pim'],
      art: {
        brief:
          'Close-up: a rusty lantern robot flickering awake on a ferry bow, startled passengers behind it',
        prompt:
          'Close-up of a small rusty robot at the bow of a ferry, its glass lantern head flickering bright as it sits up with one arm raised. Behind it, three passengers in rain coats lean back in surprise. Warm flame light on their faces, rain in the dark. Close-up at deck level, painted storybook illustration in amber, rust and teal.',
      },
    },
    {
      id: 'ottoline-map',
      title: 'Every sandbar, every lie',
      caption:
        'Ottoline unrolls a map with the dam drawn in red pencil, and a second dam behind it.',
      kind: 'follower',
      act: 1,
      about: ['ottoline'],
      art: {
        brief:
          'Lamplit close-up of weathered hands unrolling a hand-drawn river map with a dam circled in red',
        prompt:
          'Close-up of an old woman’s weathered hands unrolling a hand-drawn river map on a wooden table inside a ferry cabin. A dam is circled in red pencil, and a second dam is drawn faintly behind it. A brass lantern beside the map lights the paper from the left. Overhead close-up, painted storybook illustration in amber, cream and red.',
      },
    },
    {
      id: 'juno-dock-poem',
      title: 'A verse for every bridge',
      caption:
        'Juno recites a poem about you to the bridge, loud enough for you to hear.',
      kind: 'romance',
      act: 1,
      about: ['juno'],
      art: {
        brief:
          'Romantic night scene: a smuggler-poet reciting on a ferry rail under a stone bridge, lantern light, rain',
        prompt:
          'Night under an old stone bridge. A lanky young woman in a patched plum velvet coat stands on the rail of a lantern-hung ferry, one hand raised, reciting up at the arch. Rain falls past the paper lanterns and the young ferry pilot in a yellow oilskin watches her from the wheel. Medium shot from the deck, painted storybook illustration in plum, amber and teal.',
      },
    },
    {
      id: 'weir-on-the-bridge',
      title: 'The man on the bridge',
      caption:
        'Weir watches from the dam walkway, and lifts his umbrella to you like a hat.',
      kind: 'villain',
      act: 1,
      about: ['weir'],
      art: {
        brief:
          'Low-angle shot of an industrialist on a high dam walkway in the rain, raising an umbrella in mock salute',
        prompt:
          'Low-angle view of a tall man in an immaculate grey overcoat on a high concrete dam walkway in the rain. He holds a black umbrella raised off his head in his right hand, tilted toward the river below. Floodlights behind him make the rain bright. Painted storybook illustration in cold grey, steel blue and amber.',
      },
    },
    {
      id: 'lanterners-vigil',
      title: 'A light in every window',
      caption:
        'Along both banks, the Lanterners light every window they are about to lose.',
      kind: 'faction',
      act: 2,
      about: ['lanterners'],
      art: {
        brief:
          'Sweeping river valley at night, every cottage window lit with lanterns, the ferry small in the middle',
        prompt:
          'A wide river valley at night seen from a hillside. Cottages line both banks and every cottage window glows with a lantern. In the middle of the black river a small paddle ferry hung with lanterns crosses toward the far bank. Stars above, a lit dam far upstream. Wide high shot, painted storybook illustration in amber and deep teal.',
      },
    },
    {
      id: 'keystone-crack',
      title: 'The crack',
      caption:
        'Under the gate, a crack runs the height of the dam, and it is weeping.',
      kind: 'reveal',
      act: 2,
      about: ['weir', 'waterworks'],
      art: {
        brief:
          'Ominous close-up of a giant crack in concrete dam keystone, water seeping, a lantern held up to it',
        prompt:
          'Close-up of a giant vertical crack running up a concrete dam wall, water seeping out of it in thin dark streaks. A hand in a yellow oilskin sleeve holds a brass lantern up to the crack, lighting the wet concrete. Darkness around the circle of light. Close-up from below, painted storybook illustration in amber, grey and black-green.',
      },
    },
    {
      id: 'heron-toll',
      title: 'The toll',
      caption: 'The Heron asks for one memory. You choose which one.',
      kind: 'scene',
      act: 2,
      about: ['heron'],
      art: {
        brief:
          'Eerie fog scene: a giant heron bending toward a ferry pilot, glowing threads of memory drawn into its ledger',
        prompt:
          'In thick night fog an enormous pale grey heron in a small blue toll-keeper’s cap bends its long neck over the deck of a small ferry toward a young pilot in a yellow oilskin. Thin glowing gold threads drift from the pilot’s forehead into an open leather ledger held under the heron’s wing. Soft white fog light. Medium shot from the deck, painted storybook illustration in pale grey, gold and deep teal.',
      },
    },
    {
      id: 'juno-stern-dance',
      title: 'The stern, at midnight',
      caption:
        'Juno opens the crate. It is full of fireworks. She asks you to dance first.',
      kind: 'romance',
      act: 2,
      about: ['juno'],
      art: {
        brief:
          'Two silhouettes dancing on a ferry stern beside an open crate of fireworks, river reflecting lanterns',
        prompt:
          'Two people dance close together on the stern of a small ferry at midnight: a lanky young woman in a plum velvet coat and a young pilot in a yellow oilskin. Beside them a wooden crate stands open, packed with paper-wrapped fireworks. Paper lanterns overhead reflect in the black river. Medium shot from the stern rail, painted storybook illustration in plum, amber and deep teal.',
      },
    },
  ],
  trailer: {
    tagline: 'The water is coming. The lanterns are lit.',
    beats: [
      { moment: 'cast-off', line: 'The last ferry leaves tonight.' },
      { moment: 'pim-wakes', line: 'Your crew is… enthusiastic.' },
      {
        moment: 'weir-on-the-bridge',
        line: 'The man who owns the river wants it gone.',
      },
      { moment: 'lanterners-vigil', line: 'Carry everyone you can.' },
    ],
  },
}
