;(function (root) {
  'use strict'
  var STYLE =
    'cozy cottagecore hopecore 2D hand-painted storybook game illustration, soft sage, moss green, honey gold, poppy red, cornflower blue and lavender on warm cream, rounded friendly shapes, gentle golden light, unlettered surfaces'
  var LOOK =
    'a warm friendly gardener with dark curly hair and deep brown skin, a crown of pink, blue and yellow flowers, a green apron over a yellow shirt'
  root.HopefulHuesWorlds.register({
    id: 'wildflower',
    order: 6,
    name: "Marigold's Wildflower Hollow",
    tagline: 'A cozy seed-swap garden where every match helps something grow.',
    blurb:
      'A late frost settled over the Hollow and the neighborhood garden fell fast asleep. With a teapot, a jar of seeds and a whole lot of patience, Marigold tends their way from the seed-swap commons over the honeybee hills to a sleepy moonlit meadow.',
    hero: {
      id: 'marigold',
      name: 'Marigold',
      title: 'Gardener of Good Vibes',
      pronouns: 'they/them',
      perk: 'bloom',
      perkName: 'Second Bloom',
      perkText: 'Big cascades give you one extra move, up to twice per level.',
      cheer: [
        'Look at that bloom!',
        'Growing beautifully!',
        'Slow and steady, friend!',
        'Ooh, good soil!',
        'We grew that together!',
      ],
      epilogue:
        'Marigold sets the swap table back out on the Commons, with a fresh pot of tea and a new sign: take what you need, plant what you can, rest when you are tired.',
      look: LOOK,
      portrait:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="58" fill="#fff3e6"/><path d="M28 80 C20 40 40 20 60 20 C82 20 100 40 92 80 Z" fill="#2f2440"/><ellipse cx="60" cy="64" rx="26" ry="29" fill="#8d5a3b"/><path d="M34 50 C44 34 78 32 88 52 C76 44 50 42 34 50 Z" fill="#2f2440"/><circle cx="30" cy="34" r="7" fill="#ff9f43"/><circle cx="30" cy="34" r="2.5" fill="#fff6c9"/><circle cx="45" cy="32" r="7" fill="#ff5fa2"/><circle cx="45" cy="32" r="2.5" fill="#fff6c9"/><circle cx="60" cy="30" r="7" fill="#ffd93b"/><circle cx="60" cy="30" r="2.5" fill="#fff6c9"/><circle cx="75" cy="32" r="7" fill="#c59bff"/><circle cx="75" cy="32" r="2.5" fill="#fff6c9"/><circle cx="90" cy="34" r="7" fill="#3ddc97"/><circle cx="90" cy="34" r="2.5" fill="#fff6c9"/><path d="M48 64 Q50 61 52 64" stroke="#1e1426" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M68 64 Q70 61 72 64" stroke="#1e1426" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M50 77 Q60 85 70 77" stroke="#5a2430" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="42" cy="73" r="5" fill="#ff8f6b" opacity=".55"/><circle cx="78" cy="73" r="5" fill="#ff8f6b" opacity=".55"/><path d="M90 96 C92 84 100 80 106 82 C104 90 98 96 90 96 Z" fill="#7be0a6"/><line x1="90" y1="96" x2="86" y2="108" stroke="#3a9a66" stroke-width="3"/></svg>',
    },
    ui: {
      dark: false,
      bg: ['#f6f0da', '#e3edd2', '#f7e3bd'],
      ink: '#33402a',
      inkSoft: '#56633f',
      card: 'rgba(255,252,240,.88)',
      accent: '#d9534a',
      accent2: '#5f8a45',
      cell: 'rgba(255,253,244,.72)',
    },
    music: {
      root: 55,
      mode: 'lydian',
      tempo: 84,
      timbre: 'harp',
      meter: 3,
    },
    effects: {
      glyphs: ['✿', '❀', '•', '❁'],
      colors: ['#e8484f', '#f5b82e', '#a77fe0', '#5b8def', '#fff3c4'],
      label: 'petals and pollen',
    },
    jewels: [
      {
        name: 'Poppy Tulip',
        glyph: '✿',
        main: '#e8484f',
        light: '#ffb3ae',
        dark: '#b02a33',
        art: '<path d="M50 86 C30 86 20 70 20 50 L20 20 L35 34 L50 14 L65 34 L80 20 L80 50 C80 70 70 86 50 86 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M50 32 C42 46 42 66 50 78 C58 66 58 46 50 32 Z" fill="{D}" opacity=".28"/>',
      },
      {
        name: 'Honeycomb',
        glyph: '⬢',
        main: '#f5b82e',
        light: '#ffe6a3',
        dark: '#c98a0c',
        art: '<path d="M50 12 L83 31 L83 69 L50 88 L17 69 L17 31 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M50 34 L64 42 L64 58 L50 66 L36 58 L36 42 Z" fill="{L}" stroke="{D}" stroke-width="3" stroke-linejoin="round" opacity=".7"/>',
      },
      {
        name: 'Sage Sprout',
        glyph: '♣',
        main: '#6cbf5a',
        light: '#c9efb6',
        dark: '#3f8a33',
        art: '<ellipse cx="50" cy="84" rx="24" ry="6" fill="{D}" opacity=".5"/><path d="M50 84 C50 70 49 60 50 50" stroke="{D}" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M48 58 C30 60 12 48 12 28 C34 26 48 38 48 58 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M52 52 C54 30 70 14 90 16 C90 38 74 54 52 52 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/>',
      },
      {
        name: 'Cozy Toadstool',
        glyph: '☂',
        main: '#b06f45',
        light: '#e8b98f',
        dark: '#7a4626',
        art: '<path d="M38 56 L35 84 C35 89 65 89 65 84 L62 56 Z" fill="#fff1d6" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M10 58 C10 22 90 22 90 58 C90 66 10 66 10 58 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><g fill="#fff6e0"><circle cx="32" cy="42" r="6"/><circle cx="56" cy="32" r="5"/><circle cx="72" cy="48" r="6"/></g>',
      },
      {
        name: 'Blueberry Bunch',
        glyph: '●',
        main: '#5b8def',
        light: '#c3d6ff',
        dark: '#2f5fc0',
        art: '<path d="M50 16 C44 8 36 10 34 14 C40 16 46 18 50 22 Z" fill="#6cbf5a" stroke="#3f8a33" stroke-width="2"/><g fill="url(#J)" stroke="{D}" stroke-width="3"><circle cx="50" cy="36" r="18"/><circle cx="32" cy="64" r="19"/><circle cx="68" cy="64" r="19"/></g><g fill="{D}"><circle cx="50" cy="36" r="3.5"/><circle cx="32" cy="64" r="3.5"/><circle cx="68" cy="64" r="3.5"/></g>',
      },
      {
        name: 'Lavender Sprig',
        glyph: '✦',
        main: '#a77fe0',
        light: '#e2d2ff',
        dark: '#7450b8',
        art: '<path d="M50 90 L50 30" stroke="#5f8a45" stroke-width="6" stroke-linecap="round"/><path d="M50 80 C40 78 34 70 34 64 C42 66 48 72 50 80 Z M50 80 C60 78 66 70 66 64 C58 66 52 72 50 80 Z" fill="#6cbf5a"/><g fill="url(#J)" stroke="{D}" stroke-width="3"><circle cx="50" cy="16" r="8"/><circle cx="41" cy="29" r="10"/><circle cx="59" cy="29" r="10"/><circle cx="39" cy="45" r="11"/><circle cx="61" cy="45" r="11"/><circle cx="50" cy="58" r="11"/></g>',
      },
    ],
    specials: {
      comb: {
        name: 'Garden Rake',
        text: 'Match 4 in a line to make a Garden Rake that tidies a whole row or column.',
      },
      bomb: {
        name: 'Seed Bomb',
        text: 'Match in an L or T shape to make a Seed Bomb that bursts open and clears everything around it.',
      },
      rainbow: {
        name: 'Wildflower Wreath',
        text: 'Line up 5 for a Wildflower Wreath. Swap it with any jewel to gather every one of that color.',
      },
    },
    blockers: {
      gloom: {
        name: 'Late Frost',
        text: 'Late Frost has settled on the soil under some tiles. Match on top of it to warm it away; thick frost needs two warm-ups.',
        color: '#e4eef5',
        color2: '#a9bccb',
      },
      tangle: {
        name: 'Bramble Knot',
        text: 'Bramble Knots grow right into a space. Match next to them, or reach them with a special, to gently trim them back.',
        art: '<rect x="8" y="8" width="84" height="84" rx="22" fill="#c3d3a3"/><g fill="none" stroke="#6b4a32" stroke-width="7" stroke-linecap="round"><path d="M16 30 C40 66 60 14 84 50"/><path d="M16 66 C38 92 60 40 86 76"/><path d="M34 14 C26 42 44 62 30 88"/></g><g fill="#6b4a32"><path d="M26 40 L18 38 L24 46 Z"/><path d="M58 34 L60 24 L64 34 Z"/><path d="M50 72 L46 80 L54 76 Z"/><path d="M78 66 L88 64 L82 72 Z"/></g><path d="M66 56 C74 50 84 54 86 60 C78 64 70 62 66 56 Z" fill="#5e8f3e"/><g fill="#5a3f8c"><circle cx="66" cy="30" r="6"/><circle cx="73" cy="37" r="5"/><circle cx="64" cy="39" r="4.5"/></g>',
      },
      buddy: {
        name: 'Bumble Buddy',
        text: 'Bumble Buddies are sleepy and want to snuggle into the flower bed at the bottom. You can always swap one down a space, and specials float them straight home.',
        art: '<ellipse cx="32" cy="30" rx="15" ry="10" fill="#e6f3ff" stroke="#8fb3d9" stroke-width="3" transform="rotate(-25 32 30)"/><ellipse cx="68" cy="30" rx="15" ry="10" fill="#e6f3ff" stroke="#8fb3d9" stroke-width="3" transform="rotate(25 68 30)"/><path d="M42 30 Q38 18 32 14 M58 30 Q62 18 68 14" stroke="#5a3a1e" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="32" cy="14" r="4" fill="#5a3a1e"/><circle cx="68" cy="14" r="4" fill="#5a3a1e"/><ellipse cx="50" cy="60" rx="32" ry="27" fill="#ffcf4a" stroke="#7a4b23" stroke-width="4"/><path d="M22 68 Q50 78 78 68 M30 80 Q50 88 70 80" stroke="#5a3a1e" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M42 52 Q44 48 46 52 M54 52 Q56 48 58 52" stroke="#3a2a18" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M45 59 Q50 63 55 59" stroke="#3a2a18" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="35" cy="58" r="4.5" fill="#ff9e8a" opacity=".75"/><circle cx="65" cy="58" r="4.5" fill="#ff9e8a" opacity=".75"/>',
      },
    },
    regions: [
      {
        id: 'wldcommons',
        name: 'Seed-Swap Commons',
        blurb:
          'Behind a ring of mossy stone walls sits the neighborhood garden, where everyone used to trade seeds and stories. Since the Late Frost, the beds are bare and the swap table has been folded away.',
        sky: ['#f6f0da', '#dfead0'],
        palette: ['#7fa865', '#e8484f', '#f5b82e'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M50 84 L50 46"/><path d="M50 58 C36 58 24 48 24 32 C40 32 50 42 50 58 Z"/><path d="M50 52 C64 52 76 42 76 26 C60 26 50 36 50 52 Z"/><path d="M12 84 L88 84"/></g>',
        beats: [
          {
            at: 1,
            title: 'The Empty Swap Table',
            text: 'Marigold unfolds the old swap table, sets out a teapot and a single jar of marigold seeds, and waits in the frosty quiet. "Seeds are patient," they tell the empty chairs. "So am I."',
          },
          {
            at: 9,
            title: 'A Packet in the Jar',
            text: 'Next morning there is a packet of poppy seeds in the jar with a tiny heart doodled on it. Then a neighbor rolls up in her wheelchair with a basket of bean starts, and two dads from the corner house pull a wagon of sunflower seedlings. "Is this the swap?" "It is now," Marigold grins.',
          },
          {
            at: 18,
            title: 'Waiting on the Bees',
            text: 'The Commons is busy again, full of trading and teacups. But the new blossoms need pollinators, and the bees of Honeybee Hills have stayed snug in their hives since the frost. Marigold packs a scarf and heads uphill.',
          },
        ],
      },
      {
        id: 'wldhills',
        name: 'Honeybee Hills',
        blurb:
          'Rolling hills of clover and painted hive boxes hum above the Hollow. The frost has made the bees drowsy, and brambles have crept over the sunny slopes.',
        sky: ['#fbefc9', '#e2efd4'],
        palette: ['#f5b82e', '#7fa865', '#5b8def'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M32 16 L46 24 L46 40 L32 48 L18 40 L18 24 Z"/><path d="M60 38 L74 46 L74 62 L60 70 L46 62 L46 46 Z"/><path d="M8 88 Q30 70 52 84 Q72 96 92 80"/></g>',
        beats: [
          {
            at: 1,
            title: 'A Hum in the Hive',
            text: 'The hives on the hilltop are hushed and the clover sparkles with frost. Marigold wraps a scarf around the nearest hive box and hums one low, warm note. From inside, very softly, something hums back.',
          },
          {
            at: 9,
            title: "The Beekeeper's Tea",
            text: 'Basil, the hill beekeeper, pours two mugs of honey tea. "You can rush a kettle, but you cannot rush a bee," she says. "Make the world warm and welcoming, and they will decide." Marigold decides to be patient on purpose.',
          },
          {
            at: 18,
            title: 'The Ring of Mushrooms',
            text: 'The bees are finally awake, and they are drifting toward the edge of the hills, where a ring of speckled mushrooms circles a shady wood. Beyond it, people say, a meadow glows silver at night.',
          },
        ],
      },
      {
        id: 'wldmeadow',
        name: 'Moonlit Meadow',
        blurb:
          'Past the mushroom-ring wood lies the oldest meadow in the Hollow, where the very first wildflowers grew. Tonight it sleeps under the moon, waiting for someone to tuck in the seeds of spring.',
        sky: ['#d9d6f2', '#2f3f5e'],
        palette: ['#a77fe0', '#5b8def', '#fff3c4'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"><path d="M56 14 A32 32 0 1 0 84 60 A24 24 0 1 1 56 14 Z"/><path d="M80 18 L80 30 M74 24 L86 24"/><path d="M20 86 L20 70 M30 86 L30 64 M40 86 L40 74"/></g>',
        beats: [
          {
            at: 1,
            title: 'Through the Mushroom Ring',
            text: 'The mushroom-ring wood is soft and hushed, lit by little glowing caps. A round hedgehog shuffles alongside Marigold for a while, which feels like a very good sign.',
          },
          {
            at: 10,
            title: 'Everyone Brought a Seed',
            text: 'Footsteps rustle behind them: the whole neighborhood, carrying lanterns, trowels and every seed from the swap. Basil brought the honey tea. Nobody came alone.',
          },
          {
            at: 19,
            title: 'Plant, Then Rest',
            text: 'The frost in the meadow is thin and silver now. Together they plant every last seed, pat the soil down, and lie back in the grass to watch the stars. For once, waiting feels like part of the work.',
          },
        ],
      },
    ],
    ending: {
      id: 'wildflower',
      title: 'The Long Bloom',
      text: "At sunrise the frost melts into dew and the meadow wakes all at once: poppies, cornflowers, lavender and a thousand marigolds, with bees humming from flower to flower. Every neighbor finds the seed they planted blooming right beside someone else's. Marigold sits in the middle of it all, a little sleepy and very proud, because the Hollow grew back the way good things do: slowly, and together.",
    },
    map: {
      path: '#fffaf0',
      dash: '#c9a45c',
      node: 'circle',
    },
    quests: {
      daily: [
        {
          id: 'wildflower-d-tulips',
          text: 'Gather 60 Poppy Tulips in the Hollow',
          stat: 'color0',
          target: 60,
          reward: 30,
        },
        {
          id: 'wildflower-d-bumbles',
          text: 'Guide 3 Bumble Buddies down to the flower bed',
          stat: 'buddiesRescued',
          target: 3,
          reward: 40,
        },
        {
          id: 'wildflower-d-seedbombs',
          text: 'Toss 3 Seed Bombs',
          stat: 'bombs',
          target: 3,
          reward: 35,
        },
      ],
      weekly: [
        {
          id: 'wildflower-w-frost',
          text: 'Warm away 120 patches of Late Frost',
          stat: 'gloomCleared',
          target: 120,
          reward: 160,
        },
        {
          id: 'wildflower-w-blooms',
          text: 'Grow 25 big blooming cascades',
          stat: 'bigCascades',
          target: 25,
          reward: 175,
        },
      ],
    },
    achievements: [
      {
        key: 'start',
        name: 'First Sprout',
        text: 'Win your first level in Wildflower Hollow.',
      },
      {
        key: 'middle',
        name: 'Hills Abuzz',
        text: 'Wake every hive on Honeybee Hills.',
      },
      {
        key: 'ending',
        name: 'The Long Bloom',
        text: 'Plant the seeds of spring in the Moonlit Meadow.',
      },
      {
        key: 'stars',
        name: 'Green Thumb',
        text: 'Get 3 stars on 10 Wildflower Hollow levels.',
      },
      {
        key: 'signature',
        name: 'Friend of the Bees',
        text: 'Guide 40 Bumble Buddies home to the flower bed.',
        stat: 'buddiesRescued',
        target: 40,
      },
    ],
    prompts: {
      style: STYLE,
      hero:
        'A character select portrait of ' +
        LOOK +
        ', holding a small clay pot with a fresh green sprout and smiling warmly, bees and petals drifting nearby. Waist-up centered pose facing the viewer, a soft cottage garden background with mossy stone walls and wildflowers, ' +
        STYLE,
      key:
        'A cozy wildflower valley waking up in spring, a neighborhood seed-swap garden inside mossy stone walls, rolling honeybee hills with painted hive boxes, a ring of speckled mushrooms at the edge of a soft green wood and a meadow glowing under a crescent moon in the distance, ' +
        LOOK +
        ' in the foreground holding up a jar of seeds, ' +
        STYLE,
      map:
        'A wide top-down storybook map of a cozy valley with a winding cream footpath running from a walled community garden over clover hills dotted with beehives, through a mushroom-ring wood to a round meadow under a crescent moon, wildflowers, mossy stones and little cottages, ' +
        STYLE,
      regions: {
        wldcommons:
          'A frosty community garden inside mossy stone walls at early morning, bare garden beds, a little folding table with a teapot and a single glass jar of seeds, ' +
          LOOK +
          ' sitting patiently beside the table with a warm mug, pale frost on the grass and a first pink sunrise, ' +
          STYLE,
        wldhills:
          'Rolling green hills of clover with colorful painted wooden beehive boxes, soft frost on the clover, bramble vines on the slopes, plump fuzzy bumblebees dozing on flowers, ' +
          STYLE,
        wldmeadow:
          'A sleepy meadow at night under a big crescent moon and many stars, silver frost on the grass, a ring of softly glowing mushrooms at the edge of the wood, ' +
          LOOK +
          ' walking in with a lantern and a pocket full of seeds, ' +
          STYLE,
      },
      beats: {
        'wldcommons-9':
          'A busy community garden table piled with seed packets and baskets of seedlings, a smiling neighbor in a wheelchair holding a basket of bean starts, two dads pulling a wagon of sunflower seedlings, ' +
          LOOK +
          ' grinning and pouring tea for everyone, ' +
          STYLE,
        'wldcommons-18':
          'A lively walled community garden full of neighbors trading seeds over teacups, fresh blossoms in the beds, ' +
          LOOK +
          ' wrapping a knitted scarf around their neck and looking up toward green hills with beehives, ' +
          STYLE,
        'wldhills-9':
          'A cozy wooden beekeeper hut on a clover hill, an older beekeeper in a wide straw hat pouring honey tea into two mugs, ' +
          LOOK +
          ' listening thoughtfully, honey jars glowing on a shelf, ' +
          STYLE,
        'wldhills-18':
          'Fuzzy bumblebees drifting in a golden line toward a ring of speckled red and cream mushrooms at the edge of a shady wood, ' +
          LOOK +
          ' following with a lantern at sunset, ' +
          STYLE,
        'wldmeadow-10':
          'A crowd of neighbors of many ages walking together through a moonlit wood of glowing mushrooms, carrying lanterns, trowels and seed baskets, a beekeeper in a straw hat with a teapot, ' +
          LOOK +
          ' leading the way with a happy smile, ' +
          STYLE,
        'wldmeadow-19':
          'Neighbors lying back together in a moonlit meadow after planting seeds, freshly patted soil rows, lanterns glowing in the grass, a sky full of stars, ' +
          LOOK +
          ' resting in the middle with a hedgehog curled beside them, ' +
          STYLE,
      },
      ending:
        'A meadow bursting into bloom at sunrise with red poppies, blue cornflowers, lavender and golden marigolds, fuzzy bumblebees humming between flowers, a whole neighborhood celebrating with teacups and lanterns, ' +
        LOOK +
        ' sitting happily in the middle of the flowers, ' +
        STYLE,
    },
  })
})(typeof globalThis !== 'undefined' ? globalThis : this)
