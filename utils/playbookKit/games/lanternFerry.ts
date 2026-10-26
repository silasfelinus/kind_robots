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
  keyArt: {
    brief:
      'Painted storybook key art: a small paddle ferry hung with paper lanterns crossing a black river at night, a giant concrete dam glowing on the horizon, a rusty lantern robot at the bow, warm amber against deep teal',
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
