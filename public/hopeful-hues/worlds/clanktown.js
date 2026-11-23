;(function (root) {
  'use strict'
  var LOOK =
    'a small round white robot with a glossy black face screen showing glowing cyan happy eyes and a smile, a short antenna with a blue tip, a pink heart on its chest, stubby arms and a rolling base'
  var STYLE =
    'cozy scrap-and-steam hopecore 2D hand-painted storybook game illustration, warm copper brass and teal palette, glowing amber lamplight, chunky rounded friendly shapes, unlettered surfaces'
  root.HopefulHuesWorlds.register({
    id: 'clanktown',
    order: 2,
    name: "Sprocket's Clanktown",
    tagline:
      'A cozy scrap-and-steam town where every match oils a squeaky hinge.',
    blurb:
      'The Grey Drizzle rusted every gear in Clanktown overnight. Sprocket, a small kind robot with a big toolbox, rolls from the junkyard gardens to the humming steamworks to the top of Lantern Hill, fixing things and making friends along the way.',
    hero: {
      id: 'sprocket',
      name: 'Sprocket',
      title: 'Kind Robot Helper',
      pronouns: 'it/its',
      perk: 'extra-moves',
      perkName: 'Spare Parts Pouch',
      perkText: 'Starts every level with 2 extra moves tucked in its toolbox.',
      cheer: [
        'Bzzt! Brilliant!',
        'Gears are turning!',
        'Fixed it together!',
        'Shiny as new!',
        'My heart light is glowing!',
      ],
      epilogue:
        'Sprocket hangs a little sign on its workshop door that just shows a heart and a wrench. Anyone in Clanktown with a squeak, a wobble or a lonely day is welcome to roll right in.',
      look: LOOK,
      portrait:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="58" fill="#e8f9ff"/><line x1="60" y1="14" x2="60" y2="30" stroke="#5a6b94" stroke-width="5"/><circle cx="60" cy="12" r="8" fill="#ffd93b"/><rect x="24" y="30" width="72" height="62" rx="24" fill="#bfeaff" stroke="#5a6b94" stroke-width="5"/><rect x="34" y="42" width="52" height="32" rx="14" fill="#2b3557"/><circle cx="48" cy="57" r="7" fill="#6ff7ff"/><circle cx="72" cy="57" r="7" fill="#6ff7ff"/><path d="M50 66 Q60 73 70 66" stroke="#6ff7ff" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="34" cy="82" r="5" fill="#ffb3d1"/><circle cx="86" cy="82" r="5" fill="#ffb3d1"/><path d="M60 80 l5 5 -5 5 -5 -5z" fill="#ff5fa2"/><circle cx="18" cy="60" r="8" fill="#ffc75f" stroke="#5a6b94" stroke-width="4"/><circle cx="102" cy="60" r="8" fill="#ffc75f" stroke="#5a6b94" stroke-width="4"/></svg>',
    },
    ui: {
      dark: true,
      bg: ['#1c2c31', '#263a3b', '#3a2c24'],
      ink: '#fff2df',
      inkSoft: '#e8cfae',
      card: 'rgba(22,32,36,.88)',
      accent: '#ff9f4a',
      accent2: '#3fd1c2',
      cell: 'rgba(255,236,210,.12)',
    },
    music: {
      root: 55,
      mode: 'mixolydian',
      tempo: 112,
      timbre: 'chip',
      meter: 4,
    },
    effects: {
      glyphs: ['✦', '⚙', '✸', '◆'],
      colors: ['#ffb45c', '#ffe07a', '#5fe3d6', '#fff3c4'],
      label: 'sparks and rivets',
    },
    jewels: [
      {
        name: 'Cherry Battery',
        glyph: '+',
        main: '#ef5350',
        light: '#ffb3ae',
        dark: '#b8302f',
        art: '<rect x="80" y="40" width="10" height="20" rx="3" fill="{D}"/><rect x="12" y="26" width="70" height="48" rx="12" fill="url(#J)" stroke="{D}" stroke-width="3"/><path d="M58 50 H74 M66 42 V58 M22 50 H36" stroke="{L}" stroke-width="6" stroke-linecap="round"/>',
      },
      {
        name: 'Copper Gear',
        glyph: '⚙',
        main: '#f08a3c',
        light: '#ffd2a8',
        dark: '#b85a1c',
        art: '<path d="M81 53 L90 58 L84 73 L74 70 L70 74 L73 84 L58 90 L53 81 L47 81 L42 90 L27 84 L30 74 L26 70 L16 73 L10 58 L19 53 L19 47 L10 42 L16 27 L26 30 L30 26 L27 16 L42 10 L47 19 L53 19 L58 10 L73 16 L70 26 L74 30 L84 27 L90 42 L81 47 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="50" r="12" fill="{D}"/><circle cx="50" cy="50" r="5" fill="{L}"/>',
      },
      {
        name: 'Lamplight Bulb',
        glyph: '☀',
        main: '#ffd23f',
        light: '#fff3b0',
        dark: '#d49a00',
        art: '<path d="M36 64 C26 56 22 48 22 40 A28 28 0 0 1 78 40 C78 48 74 56 64 64 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M42 50 L46 40 L50 50 L54 40 L58 50" stroke="{D}" stroke-width="3" fill="none" stroke-linejoin="round"/><rect x="36" y="64" width="28" height="18" rx="4" fill="{D}"/><path d="M38 70 H62 M38 76 H62" stroke="{L}" stroke-width="2.5"/><path d="M44 82 H56 L52 89 H48 Z" fill="{D}"/>',
      },
      {
        name: 'Verdigris Spring',
        glyph: '≋',
        main: '#5cc46a',
        light: '#c4f2c4',
        dark: '#2f8a42',
        art: '<path d="M26 22 L74 30 M26 38 L74 46 M26 54 L74 62 M26 70 L74 78" stroke="{D}" stroke-width="4" opacity=".6"/><g fill="url(#J)" stroke="{D}" stroke-width="3"><rect x="20" y="12" width="60" height="15" rx="7.5" transform="rotate(8 50 20)"/><rect x="20" y="28" width="60" height="15" rx="7.5" transform="rotate(8 50 36)"/><rect x="20" y="44" width="60" height="15" rx="7.5" transform="rotate(8 50 52)"/><rect x="20" y="60" width="60" height="15" rx="7.5" transform="rotate(8 50 68)"/><rect x="20" y="76" width="60" height="12" rx="6"/></g>',
      },
      {
        name: 'Teal Spark Plug',
        glyph: '⚡',
        main: '#2aa9de',
        light: '#b6e8ff',
        dark: '#1676a8',
        art: '<g fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"><rect x="38" y="8" width="24" height="12" rx="5"/><path d="M32 20 H68 L65 29 L69 35 L65 42 H35 L31 35 L35 29 Z"/><path d="M14 42 H86 L90 53 L86 64 H14 L10 53 Z"/><rect x="34" y="64" width="32" height="18" rx="3"/></g><path d="M34 70 H66 M34 76 H66" stroke="{D}" stroke-width="3"/><path d="M50 82 V90 H66 V85" stroke="{D}" stroke-width="5" fill="none" stroke-linecap="round"/>',
      },
      {
        name: 'Plum Hex Nut',
        glyph: '⬢',
        main: '#9b6be0',
        light: '#dcc8ff',
        dark: '#6a3fb0',
        art: '<path d="M89 50 L69.5 84 L30.5 84 L11 50 L30.5 16 L69.5 16 Z M65 50 A15 15 0 1 0 35 50 A15 15 0 1 0 65 50 Z" fill="url(#J)" fill-rule="evenodd" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="50" r="24" fill="none" stroke="{D}" stroke-width="3" opacity=".45"/>',
      },
    ],
    specials: {
      comb: {
        name: 'Spanner Sweep',
        text: 'Match 4 in a line to build a Spanner Sweep that tightens up a whole row or column.',
      },
      bomb: {
        name: 'Steam Puff',
        text: 'Match in an L or T shape to make a Steam Puff that whooshes away everything around it.',
      },
      rainbow: {
        name: 'Kindness Core',
        text: 'Line up 5 for a Kindness Core. Swap it with any part to clear every one of that color.',
      },
    },
    blockers: {
      gloom: {
        name: 'Drizzle Rust',
        text: 'Drizzle Rust crusts over the parts underneath. Match on top of it to polish it off; thick crusts need two polishes.',
        color: '#b0927c',
        color2: '#6e5446',
      },
      tangle: {
        name: 'Cable Snarl',
        text: 'Cable Snarls jam up a space. Match right next to one, or zap it with a special, to unknot the wires.',
        art: '<rect x="8" y="8" width="84" height="84" rx="18" fill="#3a4c52" stroke="#1f2c30" stroke-width="4"/><g fill="#8fa6a8"><circle cx="18" cy="18" r="4"/><circle cx="18" cy="82" r="4"/><circle cx="82" cy="82" r="4"/></g><g fill="none" stroke-width="8" stroke-linecap="round"><path d="M12 32 C40 82 60 6 88 50" stroke="#ff8f3f"/><path d="M12 68 C42 18 60 96 88 62" stroke="#3fd1c2"/><path d="M34 12 C72 36 20 64 62 88" stroke="#ffd36b"/></g><circle cx="50" cy="50" r="10" fill="#ff8f3f" stroke="#1f2c30" stroke-width="3"/><path d="M45 50 H55 M50 45 V55" stroke="#1f2c30" stroke-width="3" stroke-linecap="round"/>',
      },
      buddy: {
        name: 'Windup Pup',
        text: 'Windup Pups are trying to roll home to the bottom row. You can always swap one down a space, and specials zoom them straight there.',
        art: '<path d="M18 50 Q8 44 12 34" stroke="#2a6f73" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M32 42 V32" stroke="#a86a2c" stroke-width="5"/><ellipse cx="24" cy="28" rx="8" ry="5" fill="#ffd36b" stroke="#a86a2c" stroke-width="3"/><ellipse cx="40" cy="28" rx="8" ry="5" fill="#ffd36b" stroke="#a86a2c" stroke-width="3"/><circle cx="30" cy="80" r="7" fill="#2a6f73"/><circle cx="58" cy="80" r="7" fill="#2a6f73"/><rect x="16" y="42" width="54" height="32" rx="13" fill="#c4f4e8" stroke="#2a6f73" stroke-width="4"/><path d="M36 54 C36 50 41 50 41 54 C41 50 46 50 46 54 C46 58 41 61 41 63 C41 61 36 58 36 54 Z" fill="#ff6fa5"/><path d="M54 24 L50 8 L66 20 Z M84 24 L88 8 L72 20 Z" fill="#ff9f6b" stroke="#2a6f73" stroke-width="3" stroke-linejoin="round"/><rect x="48" y="18" width="42" height="36" rx="13" fill="#c4f4e8" stroke="#2a6f73" stroke-width="4"/><rect x="54" y="25" width="30" height="20" rx="8" fill="#24333a"/><circle cx="63" cy="33" r="3.5" fill="#ffd36b"/><circle cx="75" cy="33" r="3.5" fill="#ffd36b"/><path d="M64 39 Q69 43 74 39" stroke="#ffd36b" stroke-width="2.5" fill="none" stroke-linecap="round"/>',
      },
    },
    regions: [
      {
        id: 'clkjunkyard',
        name: 'Junkyard Gardens',
        blurb:
          'The Grey Drizzle fell all night and left rust on every hinge and watering can in Clanktown. Sprocket rolls out of its little workshop with an oil can and a toolbox to fix the gardens first.',
        sky: ['#26403a', '#4a3b2c'],
        palette: ['#9be37a', '#ffb45c', '#ffe07a'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-linecap="round"><circle cx="50" cy="68" r="17" stroke-width="5"/><circle cx="50" cy="68" r="22" stroke-width="7" stroke-dasharray="6 6"/><path d="M50 46 V22" stroke-width="5"/></g><g fill="currentColor"><path d="M50 34 C38 34 28 26 28 14 C40 14 50 22 50 34 Z"/><path d="M50 30 C62 30 72 22 72 10 C60 10 50 18 50 30 Z"/></g>',
        beats: [
          {
            at: 1,
            title: 'Rise and Whir',
            text: 'Sprocket blinks awake to a town gone quiet and grey. Every gate squeaks, every sprinkler is stuck. "Okay," it beeps, tightening its toolbox strap, "one bolt at a time."',
          },
          {
            at: 9,
            title: 'A Pup in the Tire Pile',
            text: 'Behind a stack of old tires, something goes tick... tick... tick. A tiny windup pup has run down and lost its way home. Sprocket gives its key a gentle turn, and the pup wags its whole body.',
          },
          {
            at: 18,
            title: 'Sprouts Through the Gears',
            text: 'The junkyard gardens are blooming again, tomatoes curling up through old bicycle wheels. Beyond the fence, the Steamworks chimneys sit cold. The pup tugs at Sprocket. Time to go.',
          },
        ],
      },
      {
        id: 'clksteamworks',
        name: 'Copperpipe Steamworks',
        blurb:
          'The humming workshops where Clanktown robots build things for each other have gone still, their big boiler cold and rusty. Sprocket and the pup squeeze through the pipes to wake it up.',
        sky: ['#1f3a44', '#4a2f26'],
        palette: ['#5fe3d6', '#ff9f4a', '#ffd36b'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 84 H38 V54 H66 V30"/></g><g fill="currentColor"><circle cx="66" cy="18" r="8"/><circle cx="80" cy="12" r="6"/><circle cx="88" cy="24" r="5"/><rect x="30" y="76" width="16" height="16" rx="3"/></g>',
        beats: [
          {
            at: 1,
            title: 'Workshop Row',
            text: 'Robots stand frozen at their benches, halfway through building a swing set, a teapot and a bird feeder. Sprocket hums a little tune and gets to work on the first stuck gear.',
          },
          {
            at: 9,
            title: 'Auntie Ratchet',
            text: 'A tall old crane robot creaks awake and peers down. "Hello, little one. I taught half this town to weld." She lowers her hook to give Sprocket and the pup a ride to the upper catwalks.',
          },
          {
            at: 18,
            title: 'The Boiler Breathes',
            text: 'With a great warm WHOOSH, the boiler puffs again and every workshop hums. But high on Lantern Hill, the town lantern that keeps Clanktown cozy through the night is still dark.',
          },
        ],
      },
      {
        id: 'clkclocktower',
        name: 'Lantern Hill',
        blurb:
          'A winding staircase of patched chimneys and copper roofs climbs to the old clocktower, where the Hearth Lantern once lit every window in town. Sprocket starts the climb with a toolbox, a pup and a lot of new friends.',
        sky: ['#2a2f4a', '#5a3a2a'],
        palette: ['#ffd36b', '#ff9f6b', '#8fd8ff'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><circle cx="50" cy="12" r="5"/><path d="M34 28 L50 17 L66 28 Z"/><rect x="34" y="28" width="32" height="46" rx="6"/><path d="M30 80 H70"/></g><path d="M50 38 C58 48 58 58 50 64 C42 58 42 48 50 38 Z" fill="currentColor"/>',
        beats: [
          {
            at: 1,
            title: 'The Long Climb',
            text: 'The stairs up Lantern Hill wind past chimneys and rooftop gardens. Sprocket looks back and sees the pup, Auntie Ratchet and a whole parade of robots following along.',
          },
          {
            at: 10,
            title: 'Everyone Brought Something',
            text: 'One robot brings a spare spring, another brings polish, a tiny drone brings a single shiny bolt. "We wanted to help you," they say. Sprocket has to stop and let its heart light glow for a minute.',
          },
          {
            at: 19,
            title: 'The Hearth Lantern',
            text: 'At the top, the Hearth Lantern is cold and grey. Sprocket opens the little hatch on its chest, and its pink heart glows bright, but alone it is only a flicker. Then every friend rolls in close, and holds out a spark of their own.',
          },
        ],
      },
    ],
    ending: {
      id: 'clanktown',
      title: 'The Lantern of Many Sparks',
      text: 'All the little sparks pour together, and the Hearth Lantern blazes gold and teal across every copper roof in Clanktown. The Grey Drizzle drifts off as a gentle mist, the clocktower chimes, and the whole town has a picnic in the warm light. Sprocket came to fix things, and found a family that fixes things together.',
    },
    map: {
      path: '#ffcf8a',
      dash: '#3fd1c2',
      node: 'hex',
    },
    quests: {
      daily: [
        {
          id: 'clanktown-d-pups',
          text: 'Roll 3 Windup Pups home',
          stat: 'buddiesRescued',
          target: 3,
          reward: 40,
        },
        {
          id: 'clanktown-d-gears',
          text: 'Collect 50 Copper Gears',
          stat: 'color1',
          target: 50,
          reward: 30,
        },
        {
          id: 'clanktown-d-steam',
          text: 'Whoosh up 4 Steam Puffs in Clanktown',
          stat: 'bombs',
          target: 4,
          reward: 35,
        },
      ],
      weekly: [
        {
          id: 'clanktown-w-rust',
          text: 'Polish away 120 Drizzle Rust',
          stat: 'gloomCleared',
          target: 120,
          reward: 160,
        },
        {
          id: 'clanktown-w-cores',
          text: 'Build 8 Kindness Cores',
          stat: 'rainbows',
          target: 8,
          reward: 175,
        },
      ],
    },
    achievements: [
      {
        key: 'start',
        name: 'First Bolt Tightened',
        text: 'Win your first level in Clanktown.',
      },
      {
        key: 'middle',
        name: 'Boiler Buddy',
        text: 'Get the Copperpipe Steamworks humming again.',
      },
      {
        key: 'ending',
        name: 'Many Sparks',
        text: 'Light the Hearth Lantern on top of Lantern Hill.',
      },
      {
        key: 'stars',
        name: 'Polished to a Shine',
        text: 'Get 3 stars on 10 Clanktown levels.',
      },
      {
        key: 'signature',
        name: 'Pack Leader',
        text: 'Roll 40 Windup Pups safely home.',
        stat: 'buddiesRescued',
        target: 40,
      },
    ],
    prompts: {
      style: STYLE,
      hero:
        'A character select portrait of ' +
        LOOK +
        ', holding up a little copper oil can in one hand and a brass wrench in the other, beaming with joy. Waist-up centered pose facing the viewer, a warm workshop background with hanging lightbulbs, copper gears and teal pipes, ' +
        STYLE,
      key:
        'A cozy hillside town of copper roofs, teal pipes, patched brick chimneys and brass clock gears glowing back to life at dusk, junkyard gardens of sunflowers growing through old wheels, a humming steamworks puffing soft white steam and a clocktower lantern shining gold at the top of the hill, ' +
        LOOK +
        ' in the foreground waving next to a small mint-green windup robot puppy. Wide composition, ' +
        STYLE,
      map:
        'A wide top-down storybook map of a cozy hillside robot town with a winding cobblestone path running from junkyard gardens past copper-roofed steam workshops up a hill of chimneys to a clocktower lantern, teal pipes, brass gears, little vegetable patches, puffs of steam, ' +
        STYLE,
      regions: {
        clkjunkyard:
          'A junkyard garden at sunrise covered in a soft grey drizzle, tomato vines and sunflowers growing through old bicycle wheels and teapots, stacked tires and a copper watering can, ' +
          LOOK +
          ' rolling out of a tiny patched workshop with an oil can and a toolbox, ' +
          STYLE,
        clksteamworks:
          'A row of cozy brick robot workshops inside a great hall of teal pipes and copper boilers, workbenches with half-built swing sets and teapots, friendly robots of many shapes standing still under a light grey haze, warm hanging lightbulbs, ' +
          STYLE,
        clkclocktower:
          'A winding staircase climbing a hill of copper roofs and patched brick chimneys toward a tall clocktower with a big dark glass lantern at the top, rooftop gardens and string lights, ' +
          LOOK +
          ' climbing the stairs with a parade of friendly robots behind it, ' +
          STYLE,
      },
      beats: {
        'clkjunkyard-9':
          LOOK +
          ' kneeling beside a stack of old tires and gently turning the brass windup key on the back of a small mint-green robot puppy with orange ears, the puppy wagging happily, ' +
          STYLE,
        'clkjunkyard-18':
          'A junkyard garden in full bloom with tomato vines and sunflowers curling through old bicycle wheels, ' +
          LOOK +
          ' and a small mint-green windup robot puppy looking toward tall cold brick chimneys beyond a fence, ' +
          STYLE,
        'clksteamworks-9':
          'A tall kind old crane robot with a gentle face and a rounded hook lowering it toward ' +
          LOOK +
          ' and a small mint-green windup robot puppy inside a workshop hall of teal pipes and copper catwalks, ' +
          STYLE,
        'clksteamworks-18':
          'A giant copper boiler puffing warm white steam as a hall of robot workshops hums to life, gears turning and lightbulbs glowing, ' +
          LOOK +
          ' cheering with friendly robots, a dark lantern on a distant hilltop visible through a round window, ' +
          STYLE,
        'clkclocktower-10':
          'A crowd of friendly robots of many shapes on a rooftop staircase holding out gifts of a spring, a polish cloth and a shiny bolt to ' +
          LOOK +
          ', its pink heart glowing brightly, ' +
          STYLE,
        'clkclocktower-19':
          'The top of a clocktower at dusk with a big cold grey glass lantern, ' +
          LOOK +
          ' with a small hatch open on its chest and a glowing pink heart inside, a circle of friendly robots rolling close and each holding out a tiny spark of light, ' +
          STYLE,
      },
      ending:
        'A great clocktower lantern blazing gold and teal light across a hillside of copper roofs and chimneys at night, a whole town of friendly robots having a picnic on the rooftops under the glow, soft mist drifting away, ' +
        LOOK +
        ' celebrating in the center with a small mint-green windup robot puppy and a tall kind crane robot, ' +
        STYLE,
    },
  })
})(typeof globalThis !== 'undefined' ? globalThis : this)
