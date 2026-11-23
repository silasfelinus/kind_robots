;(function (root) {
  'use strict'
  var STYLE =
    'moonlit gothic romance cutecore 2D hand-painted storybook game illustration, midnight blue, indigo, violet, silver and deep rose palette, soft candle glow, rounded friendly shapes, unlettered surfaces'
  var HERO =
    'a gentle young woman with long wavy midnight-black hair tied back with a deep rose ribbon and a red rose tucked behind one ear, warm brown skin, bright violet eyes, rosy cheeks, a high-collared violet velvet coat with silver buttons and a small red rose pinned at the collar'
  var SABLE =
    'a kind young woman with a short silver-white pixie cut, pale freckled skin, round spectacles, a midnight blue glassmaker apron over a lavender shirt, carrying a glowing blue glass lantern'
  var OWL =
    'a round sleepy grey-brown owl with big amber eyes and a tiny knitted lavender scarf'
  root.HopefulHuesWorlds.register({
    id: 'rosewood',
    order: 3,
    name: 'Rosewood Nocturne',
    tagline: 'A moonlit gothic romance, one candle and one letter at a time.',
    blurb:
      'The Hush Mist settled over Rosewood Manor and the night roses stopped blooming. When a letter arrives tangled in the thorns, Ottilie Vane lights the candles, restores the stained glass and walks the moonlit garden toward the one who wrote it.',
    hero: {
      id: 'ottilie',
      name: 'Ottilie Vane',
      title: 'Keeper of the Night Garden',
      pronouns: 'she/her',
      perk: 'gentle-gloom',
      perkName: 'Candle in the Window',
      perkText:
        'Every two-layer mist or thorn starts at just one layer, so the way is always a little lighter.',
      cheer: [
        'How lovely!',
        'The roses heard that!',
        'Bright as moonlight!',
        'Oh, my heart!',
        'One more candle lit!',
      ],
      epilogue:
        'Ottilie leaves the manor doors open on moonlit nights now, and every letter that arrives at Rosewood gets an answer.',
      look: HERO,
      portrait:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="ottBg" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#5d4cb6"/><stop offset="1" stop-color="#1f1652"/></radialGradient><clipPath id="ottClip"><circle cx="60" cy="60" r="58"/></clipPath></defs><circle cx="60" cy="60" r="58" fill="url(#ottBg)"/><g clip-path="url(#ottClip)"><path d="M26 14 A14 14 0 1 0 40 30 A11 11 0 1 1 26 14 Z" fill="#f1eaff"/><circle cx="96" cy="20" r="1.8" fill="#e6ecff"/><circle cx="104" cy="44" r="1.4" fill="#e6ecff"/><circle cx="14" cy="56" r="1.4" fill="#e6ecff"/><path d="M24 104 C16 58 30 22 60 22 C90 22 104 58 96 104 Z" fill="#1d1636"/><path d="M12 124 C14 102 34 92 60 92 C86 92 106 102 108 124 Z" fill="#7b4fd0"/><rect x="52" y="78" width="16" height="16" fill="#a8704c"/><path d="M36 102 C36 88 38 78 44 70 L58 92 Z" fill="#4c2a92" stroke="#dfe6f5" stroke-width="2.5" stroke-linejoin="round"/><path d="M84 102 C84 88 82 78 76 70 L62 92 Z" fill="#4c2a92" stroke="#dfe6f5" stroke-width="2.5" stroke-linejoin="round"/><ellipse cx="60" cy="58" rx="24" ry="27" fill="#c68a63"/><path d="M34 62 C31 32 54 25 66 28 C82 31 91 46 86 62 C83 52 77 46 68 47 C60 44 52 50 43 48 C39 52 36 56 34 62 Z" fill="#1d1636"/><path d="M44 36 C52 30 64 30 72 34" stroke="#4b3d86" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="50" cy="61" rx="3.8" ry="4.6" fill="#2a1848"/><ellipse cx="70" cy="61" rx="3.8" ry="4.6" fill="#2a1848"/><circle cx="51.4" cy="59.4" r="1.5" fill="#fff"/><circle cx="71.4" cy="59.4" r="1.5" fill="#fff"/><path d="M45 53.5 Q50 51 55 53.5 M65 53.5 Q70 51 75 53.5" stroke="#2a1848" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="43" cy="70" r="4.5" fill="#ff7fa8" opacity=".55"/><circle cx="77" cy="70" r="4.5" fill="#ff7fa8" opacity=".55"/><path d="M53 72 Q60 78 67 72" stroke="#7a2a4a" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M78 42 C84 36 92 38 94 44 C88 46 82 46 78 42 Z" fill="#3f8a63"/><circle cx="84" cy="34" r="8" fill="#e0447a"/><path d="M84 34 m-3 0 a3 3 0 1 1 3 3 a6 6 0 1 1 5 -7" stroke="#9c1f50" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M50 102 C46 96 50 92 56 98 Z M70 102 C74 96 70 92 64 98 Z" fill="#3f8a63"/><circle cx="60" cy="100" r="7" fill="#e0447a"/><path d="M60 100 m-2.5 0 a2.5 2.5 0 1 1 2.5 2.5 a5 5 0 1 1 4 -6" stroke="#9c1f50" stroke-width="1.6" fill="none" stroke-linecap="round"/><circle cx="60" cy="112" r="2.4" fill="#dfe6f5"/><circle cx="60" cy="119" r="2.4" fill="#dfe6f5"/></g><circle cx="60" cy="60" r="57" fill="none" stroke="#ff6fa5" stroke-width="2"/></svg>',
    },
    ui: {
      dark: true,
      bg: ['#0e0a26', '#1e1548', '#2e1442'],
      ink: '#f4eeff',
      inkSoft: '#cbbfe9',
      card: 'rgba(30,20,62,.84)',
      accent: '#ff6fa5',
      accent2: '#ab8eff',
      cell: 'rgba(171,142,255,.13)',
    },
    music: {
      root: 57,
      mode: 'harmonic',
      tempo: 84,
      timbre: 'organ',
      meter: 3,
    },
    effects: {
      glyphs: ['❦', '❀', '♥', '✧'],
      colors: ['#ff4d8d', '#ff9cc2', '#c9a7ff', '#e6ecff'],
      label: 'rose petals',
    },
    jewels: [
      {
        name: 'Velvet Rose',
        glyph: '❀',
        main: '#ff4d8d',
        light: '#ffc0d8',
        dark: '#c21e5e',
        art: '<path d="M30 76 C16 80 10 70 14 62 C22 62 30 68 30 76 Z M70 76 C84 80 90 70 86 62 C78 62 70 68 70 76 Z" fill="#3f9a6a" stroke="#1f6b45" stroke-width="2.5"/><path d="M50 16 C60 12 66 20 72 22 C84 26 90 38 86 52 C84 72 70 86 50 86 C30 86 16 72 14 52 C10 38 16 26 28 22 C34 20 40 12 50 16 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M50 46 C56 44 58 52 52 54 C44 56 40 48 44 42 C50 34 62 38 64 48 C66 60 54 68 44 64 C32 60 30 46 36 38" fill="none" stroke="{D}" stroke-width="3.5" stroke-linecap="round"/>',
      },
      {
        name: 'Silver Crescent',
        glyph: '☾',
        main: '#c9d3ee',
        light: '#ffffff',
        dark: '#6f7caa',
        art: '<path d="M62 10 A40 40 0 1 0 90 66 A31 31 0 1 1 62 10 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M74 28 l3.5 8.5 8.5 3.5 -8.5 3.5 -3.5 8.5 -3.5 -8.5 -8.5 -3.5 8.5 -3.5z" fill="{M}" stroke="{D}" stroke-width="2" stroke-linejoin="round"/>',
      },
      {
        name: 'Candle Flame',
        glyph: '♨',
        main: '#ffbf3c',
        light: '#fff2b0',
        dark: '#dc7410',
        art: '<path d="M52 8 C56 26 74 36 76 58 C78 76 66 90 50 90 C34 90 22 78 24 60 C26 46 34 40 38 28 C44 36 42 44 46 50 C52 40 54 26 52 8 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M50 52 C56 60 60 66 58 74 C56 82 44 82 42 74 C40 66 46 60 50 52 Z" fill="{L}"/>',
      },
      {
        name: 'Amethyst Locket',
        glyph: '♥',
        main: '#a65cff',
        light: '#dcc2ff',
        dark: '#6a2bcc',
        art: '<circle cx="50" cy="17" r="7" fill="none" stroke="{D}" stroke-width="4"/><path d="M50 88 C22 70 10 52 16 38 C22 24 42 22 50 36 C58 22 78 24 84 38 C90 52 78 70 50 88 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M50 70 C38 62 32 54 35 47 C38 41 46 41 50 48 C54 41 62 41 65 47 C68 54 62 62 50 70 Z" fill="none" stroke="{L}" stroke-width="3" stroke-linejoin="round"/>',
      },
      {
        name: 'Sapphire Key',
        glyph: '⚷',
        main: '#4f8cff',
        light: '#bcd6ff',
        dark: '#2152c4',
        art: '<g transform="rotate(-40 50 50)" stroke="{D}" stroke-width="3" stroke-linejoin="round" fill="url(#J)"><path d="M41 40 H59 V66 H76 V77 H67 V86 H59 V96 H41 Z"/><circle cx="50" cy="26" r="22"/><circle cx="50" cy="26" r="8" fill="{D}"/></g>',
      },
      {
        name: 'Luna Moth',
        glyph: '✣',
        main: '#5fdcaa',
        light: '#d2fbe8',
        dark: '#1f9a6e',
        art: '<g fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"><path d="M47 44 C36 14 10 16 12 36 C14 52 32 56 47 52 Z"/><path d="M53 44 C64 14 90 16 88 36 C86 52 68 56 53 52 Z"/><path d="M47 54 C32 56 22 68 28 90 C38 82 46 72 48 60 Z"/><path d="M53 54 C68 56 78 68 72 90 C62 82 54 72 52 60 Z"/></g><circle cx="29" cy="36" r="5" fill="{L}" stroke="{D}" stroke-width="2"/><circle cx="71" cy="36" r="5" fill="{L}" stroke="{D}" stroke-width="2"/><ellipse cx="50" cy="52" rx="6" ry="20" fill="{D}"/><path d="M47 34 C44 24 38 18 32 16 M53 34 C56 24 62 18 68 16" fill="none" stroke="{D}" stroke-width="3" stroke-linecap="round"/>',
      },
    ],
    specials: {
      comb: {
        name: 'Silver Moonbeam',
        text: 'Match 4 in a line to make a Silver Moonbeam that shines down a whole row or column.',
      },
      bomb: {
        name: 'Candelabra Glow',
        text: 'Match in an L or T shape to make a Candelabra Glow that warms away everything around it.',
      },
      rainbow: {
        name: 'Rose Window',
        text: 'Line up 5 for a Rose Window. Swap it with any jewel to light up every one of that color.',
      },
    },
    blockers: {
      gloom: {
        name: 'Hush Mist',
        text: 'Hush Mist curls across the floor beneath the jewels. Match on top of it to let the candlelight back in; thicker mist needs two matches.',
        color: '#9a91e0',
        color2: '#4d4592',
      },
      tangle: {
        name: 'Thornvine Snarl',
        text: 'Thornvine Snarls wrap a space in rose briars. Match right beside them, or reach them with a special, to gently coax them loose.',
        art: '<rect x="6" y="6" width="88" height="88" rx="20" fill="#3a2156" stroke="#a07ad8" stroke-width="3"/><g fill="none" stroke="#4fa274" stroke-width="7" stroke-linecap="round"><path d="M14 30 C38 66 62 14 86 46"/><path d="M14 66 C36 92 64 40 86 80"/></g><g fill="#c6f3d6"><path d="M26 42 L30 30 L36 40 Z"/><path d="M46 42 L52 52 L56 40 Z"/><path d="M26 72 L30 60 L36 70 Z"/><path d="M62 66 L68 76 L74 64 Z"/><path d="M78 44 L82 32 L86 42 Z"/></g><circle cx="66" cy="34" r="9" fill="#ff4d8d" stroke="#a5124a" stroke-width="2.5"/><path d="M66 34 m-3 0 a3 3 0 1 1 3 3 a6 6 0 1 1 5 -7" fill="none" stroke="#a5124a" stroke-width="2"/><circle cx="48" cy="68" r="6" fill="#ff4d8d" stroke="#a5124a" stroke-width="2.5"/>',
      },
      buddy: {
        name: 'Letter Moth',
        text: 'Letter Moths are carrying notes down to the lantern at the bottom. You can always swap one down a space, and specials whisk them straight there.',
        art: '<g stroke="#6a4cc0" stroke-width="3" stroke-linejoin="round"><path d="M45 46 C30 18 6 22 10 42 C12 58 32 60 45 54 Z" fill="#ece2ff"/><path d="M55 46 C70 18 94 22 90 42 C88 58 68 60 55 54 Z" fill="#ece2ff"/><path d="M44 58 C32 60 20 70 26 84 C36 86 44 76 46 64 Z" fill="#cbb6ff"/><path d="M56 58 C68 60 80 70 74 84 C64 86 56 76 54 64 Z" fill="#cbb6ff"/></g><circle cx="24" cy="38" r="5" fill="#ff9cc2"/><circle cx="76" cy="38" r="5" fill="#ff9cc2"/><path d="M45 38 C42 28 36 22 30 22 M55 38 C58 28 64 22 70 22" fill="none" stroke="#6a4cc0" stroke-width="3" stroke-linecap="round"/><ellipse cx="50" cy="56" rx="14" ry="18" fill="#fff3dc" stroke="#b58a5a" stroke-width="3"/><circle cx="45" cy="52" r="3.5" fill="#2b1d46"/><circle cx="55" cy="52" r="3.5" fill="#2b1d46"/><circle cx="46" cy="51" r="1.2" fill="#fff"/><circle cx="56" cy="51" r="1.2" fill="#fff"/><circle cx="41" cy="59" r="3" fill="#ff9cc2"/><circle cx="59" cy="59" r="3" fill="#ff9cc2"/><path d="M46 60 Q50 64 54 60" stroke="#2b1d46" stroke-width="2.5" fill="none" stroke-linecap="round"/><rect x="38" y="68" width="24" height="16" rx="2" fill="#fffaf0" stroke="#b58a5a" stroke-width="2.5"/><path d="M38 69 L50 77 L62 69" fill="none" stroke="#b58a5a" stroke-width="2.5"/><circle cx="50" cy="77" r="3.5" fill="#ff4d8d"/>',
      },
    },
    regions: [
      {
        id: 'rosmanor',
        name: 'The Moonlit Manor',
        blurb:
          'The Hush Mist drifted in one autumn night, and Rosewood Manor forgot how to glow. Ottilie lights a single candle, finds a letter in the rose vines, and decides that is enough to begin.',
        sky: ['#141036', '#2b1e5c'],
        palette: ['#ff6fa5', '#ab8eff', '#e6ecff'],
        motif:
          '<g fill="currentColor"><rect x="22" y="44" width="10" height="32" rx="3"/><rect x="45" y="34" width="10" height="42" rx="3"/><rect x="68" y="44" width="10" height="32" rx="3"/><path d="M27 24 C33 32 32 40 27 40 C22 40 21 32 27 24 Z"/><path d="M50 14 C56 22 55 30 50 30 C45 30 44 22 50 14 Z"/><path d="M73 24 C79 32 78 40 73 40 C68 40 67 32 73 24 Z"/><path d="M14 76 H86 L78 86 H22 Z"/></g>',
        beats: [
          {
            at: 1,
            title: 'A Letter in the Vines',
            text: 'Ottilie finds a letter caught in the thorns by the front door, sealed with a pressed rose. It is from Sable, the glassmaker across the garden: "Is anyone still awake in the manor? I miss the lights."',
          },
          {
            at: 9,
            title: 'Old Thimble',
            text: 'A sleepy owl named Old Thimble offers to carry a reply. Ottilie writes three drafts and crosses out every one, then simply writes: "I am here. I am lighting the candles. Keep watching."',
          },
          {
            at: 18,
            title: 'Every Window Glowing',
            text: 'The last candle catches, and the manor glows from cellar to tower. Far across the dark garden, a small blue lantern blinks back three times.',
          },
        ],
      },
      {
        id: 'rosgallery',
        name: 'Gallery of Stained Glass',
        blurb:
          'A long candlelit gallery of velvet curtains and tall stained-glass windows, every one clouded by mist. Sable made these windows years ago, and Ottilie means to make them shine again.',
        sky: ['#1a1240', '#3a1f63'],
        palette: ['#ab8eff', '#4f8cff', '#ff6fa5'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"><path d="M24 90 V44 A26 26 0 0 1 76 44 V90 Z"/><circle cx="50" cy="44" r="12"/><path d="M50 56 V90 M24 68 H76 M50 32 V56 M38 44 H62"/></g>',
        beats: [
          {
            at: 1,
            title: 'The Rose Window',
            text: "The great rose window at the end of the gallery is clouded grey. Low in one corner of the glass, Ottilie finds a tiny moth etched into a pane: Sable's mark.",
          },
          {
            at: 9,
            title: 'A Waltz for One',
            text: 'In the ballroom, a music box still plays a slow waltz. Ottilie tries a few careful steps alone, practising, just in case. Old Thimble politely looks the other way.',
          },
          {
            at: 18,
            title: 'Moonlight Through the Glass',
            text: 'The rose window blazes violet and blue, and its light falls in a path across the garden, straight to the sleeping Moonrose at its heart. A new letter waits on the sill: "Meet me there?"',
          },
        ],
      },
      {
        id: 'rosgarden',
        name: 'The Night-Blooming Garden',
        blurb:
          'Wrought-iron arches, silver fountains and roses that open only for the moon, all wound in thorns and mist. Ottilie walks the moonlit path with her lantern, and on the far side, someone is walking toward her.',
        sky: ['#0f1a3d', '#2a1450'],
        palette: ['#ff4d8d', '#7de3b5', '#e6ecff'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><circle cx="50" cy="36" r="20"/><path d="M50 36 m-6 0 a6 6 0 1 1 6 6 a12 12 0 1 1 10 -14"/><path d="M50 56 C44 70 56 80 50 94"/><path d="M48 74 C40 64 28 66 24 76 C34 82 44 80 48 74"/></g>',
        beats: [
          {
            at: 1,
            title: 'Through the Iron Gate',
            text: 'The garden gate creaks open. Letter Moths flutter ahead, glowing like tiny lanterns along the path. Ottilie takes a deep breath and follows them in.',
          },
          {
            at: 10,
            title: 'Two Lanterns',
            text: 'Through the thorny arches, Ottilie sees it: a blue lantern bobbing closer from the far side of the garden. Sable has been clearing a path too, one vine at a time.',
          },
          {
            at: 19,
            title: 'The Heart of the Garden',
            text: 'At the centre of the garden, the Moonrose sleeps beneath the last of the mist. Ottilie and Sable reach it at the very same moment, lanterns raised, and this time neither of them needs a letter.',
          },
        ],
      },
    ],
    ending: {
      id: 'rosewood',
      title: 'The Moonrose Waltz',
      text: 'Together they lift their lanterns, and the Moonrose opens in silver and deep rose, scattering the Hush Mist up into the stars. Every rose in Rosewood blooms at once. Under the full moon, with the owls humming along, Ottilie finally asks Sable to dance, and they waltz until the candles burn low, promising to meet in the garden every full moon from now on.',
    },
    map: {
      path: '#e6ecff',
      dash: '#ff6fa5',
      node: 'diamond',
    },
    quests: {
      daily: [
        {
          id: 'rosewood-d-moths',
          text: 'Guide 3 Letter Moths to the lantern',
          stat: 'buddiesRescued',
          target: 3,
          reward: 40,
        },
        {
          id: 'rosewood-d-roses',
          text: 'Gather 50 Velvet Roses',
          stat: 'color0',
          target: 50,
          reward: 30,
        },
        {
          id: 'rosewood-d-candles',
          text: 'Light 3 Candelabra Glows',
          stat: 'bombs',
          target: 3,
          reward: 35,
        },
      ],
      weekly: [
        {
          id: 'rosewood-w-mist',
          text: 'Clear 120 patches of Hush Mist',
          stat: 'gloomCleared',
          target: 120,
          reward: 160,
        },
        {
          id: 'rosewood-w-windows',
          text: 'Open 10 Rose Windows',
          stat: 'rainbows',
          target: 10,
          reward: 170,
        },
      ],
    },
    achievements: [
      {
        key: 'start',
        name: 'First Candle',
        text: 'Win your first level in Rosewood Nocturne.',
      },
      {
        key: 'middle',
        name: 'The Rose Window Shines',
        text: 'Restore every window in the Gallery of Stained Glass.',
      },
      {
        key: 'ending',
        name: 'The Moonrose Waltz',
        text: 'Wake the Moonrose and share a dance in the garden.',
      },
      {
        key: 'stars',
        name: 'Starlit Ballroom',
        text: 'Get 3 stars on 10 Rosewood levels.',
      },
      {
        key: 'signature',
        name: 'Gentle with Thorns',
        text: 'Coax loose 80 Thornvine Snarls.',
        stat: 'tanglesCleared',
        target: 80,
      },
    ],
    prompts: {
      style: STYLE,
      hero:
        'A character select portrait of ' +
        HERO +
        ', holding a silver candlestick with a warm glowing flame in one hand and a rose-sealed envelope in the other, smiling softly. Waist-up centered pose facing the viewer, a moonlit indigo background with climbing rose vines, a crescent moon and drifting rose petals, ' +
        STYLE,
      key:
        'A gothic manor on a hill under a huge silver full moon, tall stained-glass windows glowing violet and blue, a night-blooming rose garden with wrought-iron arches and silver fountains wrapped in rose vines, owls on the rooftops and glowing pale moths, ' +
        HERO +
        ' in the foreground raising a lantern toward a distant blue lantern across the garden. Wide composition, ' +
        STYLE,
      map:
        'A wide top-down storybook map of a moonlit gothic estate with a winding silver path running from a glowing manor house through a long gallery wing of stained-glass windows into a night-blooming rose garden with wrought-iron arches and a great rose at its center, rose vines, small lanterns and glowing moths along the path, ' +
        STYLE,
      regions: {
        rosmanor:
          'A grand moonlit manor hall with velvet curtains, a sweeping staircase and wrought-iron candelabras, soft lavender mist curling across the floor, ' +
          HERO +
          ' lighting the first candle and reading a rose-sealed letter, a crescent moon in a tall arched window, ' +
          STYLE,
        rosgallery:
          'A long candlelit gallery of tall stained-glass windows in violet, blue and rose, velvet benches and gilded frames, a great round rose window at the far end clouded with pale mist, ' +
          HERO +
          ' polishing a pane with a soft cloth, ' +
          STYLE,
        rosgarden:
          'A night-blooming rose garden under a full moon, wrought-iron arches heavy with deep rose blossoms and curling thorny vines, silver fountains, glowing pale green moths drifting along a moonlit path, ' +
          HERO +
          ' walking with a lantern, ' +
          STYLE,
      },
      beats: {
        'rosmanor-9':
          OWL +
          ' perched on a candlelit writing desk holding a rose-sealed envelope in its beak, while ' +
          HERO +
          ' smiles beside a little pile of crumpled draft pages and an inkwell, ' +
          STYLE,
        'rosmanor-18':
          'A gothic manor glowing warmly from every window, cellar to tower, seen from a dark moonlit garden, a small blue lantern glowing far across the roses, ' +
          HERO +
          ' waving from a high balcony, ' +
          STYLE,
        'rosgallery-9':
          'A moonlit ballroom with a polished floor and a small silver music box on a pedestal, ' +
          HERO +
          ' practising a waltz step alone with a shy happy smile, ' +
          OWL +
          ' on a chandelier covering its eyes with a wing, ' +
          STYLE,
        'rosgallery-18':
          'A great round stained-glass rose window blazing violet and blue, its colored moonlight falling in a long glowing path out across a night garden toward a giant sleeping rose bud, ' +
          HERO +
          ' holding a fresh letter on the windowsill, ' +
          STYLE,
        'rosgarden-10':
          'A tunnel of wrought-iron rose arches under the moon, ' +
          HERO +
          ' with a warm lantern on one side and ' +
          SABLE +
          ' approaching from the far end, glowing moths between them, ' +
          STYLE,
        'rosgarden-19':
          'The heart of a moonlit rose garden with a giant closed silver-and-rose bud on a mossy pedestal wrapped in thin mist, ' +
          HERO +
          ' and ' +
          SABLE +
          ' arriving from opposite paths, lanterns raised, smiling at each other, ' +
          STYLE,
      },
      ending:
        'A giant rose blooming open in silver and deep rose light, mist swirling up into a starry sky, every rose in a moonlit garden in full bloom, ' +
        HERO +
        ' and ' +
        SABLE +
        ' waltzing together hand in hand beneath the full moon, owls and glowing moths gathered around them, candles glowing on wrought-iron arches, ' +
        STYLE,
    },
  })
})(typeof globalThis !== 'undefined' ? globalThis : this)
