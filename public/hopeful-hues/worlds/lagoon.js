;(function (root) {
  'use strict'
  var STYLE =
    'luminous lagoon hopecore cutecore 2D hand-painted storybook game illustration, teal water, gold mosaic, coral and pearl palette, glowing amber paper lanterns, rounded friendly shapes, soft bubbles and gold glints, unlettered surfaces'
  var LOOK =
    'a kind young adult mermaid with warm brown skin, long wavy coral-pink hair braided with tiny pearls, a modest gold scallop-shell top under a flowing sea-green wrap across her shoulders, and a shimmering teal tail, carrying a glowing amber paper lantern'
  var PIP =
    'a cheerful gondolier with short curly black hair, a striped navy and cream shirt and a red neck scarf'
  root.HopefulHuesWorlds.register({
    id: 'lagoon',
    order: 9,
    name: 'Lagoon of the Lantern Mermaids',
    tagline:
      'A canal city of paper lanterns, waiting for its choir to sing again.',
    blurb:
      'Murky silt drifted into Lanternmere and dimmed every paper lantern on the canals. Coralie, the mermaid who lights them, swims from the gondola canals to the mosaic plaza to the deep arch under the Starlight Bridge, singing first so everyone else remembers how.',
    hero: {
      id: 'coralie',
      name: 'Coralie',
      title: 'Lantern-Keeper of the Canals',
      pronouns: 'she/her',
      perk: 'buddy-rescue',
      perkName: 'Tide Escort',
      perkText:
        'Turtle Hatchlings are welcomed home as soon as they reach either of the bottom two rows.',
      cheer: [
        'Light it up, lagoon!',
        'Sing it with me!',
        'Every lantern counts!',
        'Bubbles of joy!',
        'The whole canal is glowing!',
      ],
      epilogue:
        'Every evening now, Coralie lights the first lantern under the Moonstep Bridge and sings the first note, and the whole city is always ready to answer.',
      look: LOOK,
      portrait:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="58" fill="#16485a"/><circle cx="96" cy="92" r="24" fill="#ffb547" opacity=".25"/><circle cx="24" cy="26" r="3" fill="#bff3ee" opacity=".8"/><circle cx="32" cy="16" r="2" fill="#bff3ee" opacity=".7"/><path d="M84 18 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ffd76a"/><path d="M20 112 C16 60 30 22 60 22 C90 22 104 60 100 112 Z" fill="#ff8a8a"/><path d="M22 120 C24 100 40 90 60 90 C80 90 96 100 98 120 Z" fill="#4fc7a6"/><rect x="52" y="80" width="16" height="14" rx="6" fill="#a8704c"/><path d="M42 98 Q60 108 78 98 L76 106 Q60 114 44 106 Z" fill="#f6cf3a" stroke="#c99a12" stroke-width="2"/><path d="M60 96 l-7 9 Q60 110 67 105 Z" fill="#ffe28a" stroke="#c99a12" stroke-width="1.5"/><path d="M30 56 C22 50 18 62 26 68 Z" fill="#2fb7a8"/><path d="M90 56 C98 50 102 62 94 68 Z" fill="#2fb7a8"/><ellipse cx="60" cy="60" rx="26" ry="29" fill="#b9805a"/><path d="M33 54 C36 30 84 28 87 54 C78 40 64 38 60 44 C56 38 42 40 33 54 Z" fill="#ff8a8a"/><path d="M28 64 C24 78 26 92 30 104" stroke="#ff6f6f" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="28" cy="74" r="3" fill="#fff4fb"/><circle cx="27" cy="85" r="3" fill="#fff4fb"/><circle cx="29" cy="96" r="3" fill="#fff4fb"/><circle cx="74" cy="36" r="4" fill="#fff4fb"/><circle cx="49" cy="62" r="4" fill="#24303d"/><circle cx="71" cy="62" r="4" fill="#24303d"/><circle cx="50" cy="60.5" r="1.4" fill="#fff"/><circle cx="72" cy="60.5" r="1.4" fill="#fff"/><path d="M50 74 Q60 83 70 74" stroke="#7a2e3a" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="41" cy="71" r="5" fill="#ff8f8f" opacity=".6"/><circle cx="79" cy="71" r="5" fill="#ff8f8f" opacity=".6"/><path d="M96 70 L96 76" stroke="#7a4a10" stroke-width="2.5"/><rect x="90" y="76" width="12" height="4" rx="2" fill="#7a4a10"/><ellipse cx="96" cy="90" rx="12" ry="11" fill="#ffb547" stroke="#d97a12" stroke-width="2.5"/><path d="M85 87 Q96 84 107 87 M85 94 Q96 97 107 94" stroke="#d97a12" stroke-width="1.5" fill="none"/><rect x="90" y="100" width="12" height="4" rx="2" fill="#7a4a10"/><ellipse cx="93" cy="86" rx="3" ry="2" fill="#fff4c2" opacity=".8"/></svg>',
    },
    ui: {
      dark: true,
      bg: ['#0c3346', '#125566', '#1b7473'],
      ink: '#fff6e3',
      inkSoft: '#cfe8e2',
      card: 'rgba(8,38,52,.84)',
      accent: '#ffb547',
      accent2: '#5fe0cf',
      cell: 'rgba(255,255,255,.12)',
    },
    music: {
      root: 55,
      mode: 'lydian',
      tempo: 84,
      timbre: 'choir',
      meter: 3,
    },
    effects: {
      glyphs: ['○', '◦', '✦', '✧'],
      colors: ['#bff3ee', '#ffd76a', '#ffffff', '#7fe0d6'],
      label: 'bubbles and gold glints',
    },
    jewels: [
      {
        name: 'Moon Pearl',
        glyph: '●',
        main: '#b98cff',
        light: '#ecdfff',
        dark: '#8257d6',
        art: '<circle cx="50" cy="50" r="33" fill="url(#J)" stroke="{D}" stroke-width="3"/><circle cx="50" cy="50" r="24" fill="none" stroke="{L}" stroke-width="2.5" opacity=".6"/><circle cx="62" cy="64" r="5" fill="{L}" opacity=".7"/>',
      },
      {
        name: 'Coral Scallop',
        glyph: '▲',
        main: '#ff6f91',
        light: '#ffc6d4',
        dark: '#d9406a',
        art: '<path d="M50 80 L15 42 Q14 22 31 22 Q36 11 50 12 Q64 11 69 22 Q86 22 85 42 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M50 76 L27 28 M50 76 L41 17 M50 76 L59 17 M50 76 L73 28" stroke="{D}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".5"/><path d="M38 80 L62 80 L58 90 L42 90 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/>',
      },
      {
        name: 'Paper Lantern',
        glyph: '✺',
        main: '#ff9a2e',
        light: '#ffd9a6',
        dark: '#d96d0a',
        art: '<path d="M42 10 Q50 4 58 10" stroke="{D}" stroke-width="3" fill="none"/><rect x="38" y="12" width="24" height="9" rx="3" fill="{D}"/><ellipse cx="50" cy="50" rx="35" ry="29" fill="url(#J)" stroke="{D}" stroke-width="3"/><path d="M17 40 Q50 32 83 40 M15 50 L85 50 M17 60 Q50 68 83 60" stroke="{D}" stroke-width="2.5" fill="none" opacity=".5"/><rect x="38" y="78" width="24" height="9" rx="3" fill="{D}"/><path d="M50 87 L50 94" stroke="{D}" stroke-width="4" stroke-linecap="round"/>',
      },
      {
        name: 'Gold Mosaic',
        glyph: '■',
        main: '#f6cf3a',
        light: '#fff1a8',
        dark: '#c99a12',
        art: '<rect x="15" y="15" width="70" height="70" rx="10" fill="url(#J)" stroke="{D}" stroke-width="3"/><path d="M38 15 L38 85 M62 15 L62 85 M15 38 L85 38 M15 62 L85 62" stroke="{D}" stroke-width="3" opacity=".55"/><rect x="42" y="42" width="16" height="16" rx="2" fill="{L}" opacity=".8"/>',
      },
      {
        name: 'Seahorse',
        glyph: '§',
        main: '#19b3a6',
        light: '#a8f0e6',
        dark: '#0c8378',
        art: '<path d="M42 44 L20 38 L23 50 L18 62 L40 62 Z" fill="{L}" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M38 18 C50 8 68 10 70 24 L86 26 C91 28 91 35 86 36 L68 38 C66 44 60 46 58 50 C72 56 72 72 62 80 C56 86 50 86 48 92 C44 97 32 96 32 88 C32 81 40 80 42 85 C42 78 34 72 32 62 C30 52 34 44 38 38 C33 32 32 24 38 18 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><circle cx="54" cy="26" r="4" fill="{D}"/><path d="M50 60 Q56 62 54 68 M48 70 Q54 72 52 78" stroke="{D}" stroke-width="2.5" fill="none" opacity=".5"/>',
      },
      {
        name: 'Sea Glass',
        glyph: '◆',
        main: '#3f8cff',
        light: '#c3dcff',
        dark: '#2160cf',
        art: '<path d="M30 16 L68 12 L88 40 L78 82 L36 88 L12 58 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M30 16 L46 44 L68 12 M46 44 L88 40 M46 44 L36 88 M46 44 L12 58" stroke="{L}" stroke-width="2.5" fill="none" opacity=".55"/>',
      },
    ],
    specials: {
      comb: {
        name: 'Gondola Glide',
        text: 'Match 4 in a line to launch a Gondola Glide that sails down a whole row or column.',
      },
      bomb: {
        name: 'Lantern Burst',
        text: 'Match in an L or T shape to light a Lantern Burst that glows away everything around it.',
      },
      rainbow: {
        name: 'Choir Chord',
        text: 'Line up 5 for a Choir Chord. Swap it with any jewel to sing away every one of that color.',
      },
    },
    blockers: {
      gloom: {
        name: 'Murky Silt',
        text: 'Murky Silt has settled over the mosaic under the jewels. Match on top of it to stir it clear; thick silt takes two matches.',
        color: '#b9b394',
        color2: '#7f7a5f',
      },
      tangle: {
        name: 'Knotted Net',
        text: 'Knotted Nets snag a space in the canal. Match right beside them, or hit them with a special, to work the knots loose.',
        art: '<rect x="8" y="8" width="84" height="84" rx="20" fill="#d9c79a"/><g fill="none" stroke="#8a6a3a" stroke-width="5" stroke-linecap="round"><path d="M10 30 L70 90 M10 60 L40 90 M30 10 L90 70 M60 10 L90 40 M90 30 L30 90 M90 60 L60 90 M70 10 L10 70 M40 10 L10 40"/></g><g fill="#5f4520"><circle cx="35" cy="35" r="5"/><circle cx="65" cy="35" r="5"/><circle cx="50" cy="50" r="5"/><circle cx="35" cy="65" r="5"/><circle cx="65" cy="65" r="5"/></g>',
      },
      buddy: {
        name: 'Turtle Hatchling',
        text: 'Turtle Hatchlings are swimming down to their cozy nest at the canal bottom. You can always swap one down a space, and specials whisk them straight home.',
        art: '<ellipse cx="22" cy="40" rx="12" ry="6" fill="#7fd6a0" stroke="#2f8f5a" stroke-width="3" transform="rotate(-30 22 40)"/><ellipse cx="78" cy="40" rx="12" ry="6" fill="#7fd6a0" stroke="#2f8f5a" stroke-width="3" transform="rotate(30 78 40)"/><ellipse cx="28" cy="74" rx="9" ry="5" fill="#7fd6a0" stroke="#2f8f5a" stroke-width="3" transform="rotate(30 28 74)"/><ellipse cx="72" cy="74" rx="9" ry="5" fill="#7fd6a0" stroke="#2f8f5a" stroke-width="3" transform="rotate(-30 72 74)"/><ellipse cx="50" cy="58" rx="28" ry="24" fill="#4fb87a" stroke="#2f8f5a" stroke-width="4"/><path d="M50 40 L60 48 L56 62 L44 62 L40 48 Z" fill="#8fe0a8" stroke="#2f8f5a" stroke-width="2.5"/><circle cx="50" cy="24" r="15" fill="#9ee6b4" stroke="#2f8f5a" stroke-width="4"/><circle cx="44" cy="22" r="3.5" fill="#1f3a2c"/><circle cx="56" cy="22" r="3.5" fill="#1f3a2c"/><circle cx="45" cy="21" r="1.2" fill="#fff"/><circle cx="57" cy="21" r="1.2" fill="#fff"/><path d="M45 29 Q50 33 55 29" stroke="#1f3a2c" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="40" cy="28" r="3" fill="#ff9fb0" opacity=".7"/><circle cx="60" cy="28" r="3" fill="#ff9fb0" opacity=".7"/>',
      },
    },
    regions: [
      {
        id: 'lagcanal',
        name: 'Moonstep Canals',
        blurb:
          'Murky silt drifted in on a low tide and dimmed every paper lantern in Lanternmere. Coralie surfaces under the Moonstep Bridge with one flickering lantern and a song she refuses to forget.',
        sky: ['#123f57', '#1d7a7a'],
        palette: ['#ffb547', '#5fe0cf', '#ff8a8a'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M8 62 Q50 18 92 62"/><path d="M8 80 Q24 72 40 80 T72 80 T100 80"/></g><g fill="currentColor"><rect x="44" y="40" width="12" height="4" rx="2"/><ellipse cx="50" cy="52" rx="9" ry="8"/></g>',
        beats: [
          {
            at: 1,
            title: 'The Last Little Light',
            text: 'Under the Moonstep Bridge, only Coralie\'s lantern still glows. The choir that sings beneath the bridges has gone quiet, each voice lost in the murk. "Then I will sing first," she decides, "and loud enough for everyone."',
          },
          {
            at: 9,
            title: 'A Gondolier Who Hums',
            text: 'A gondolier named Pip drifts by, humming wildly off-key and grinning anyway. "I lost the tune when the choir went quiet," they admit. Coralie laughs and hangs her lantern on the gondola\'s bow. "Then we will find it together."',
          },
          {
            at: 18,
            title: 'Music on the Water',
            text: 'Lantern by lantern, the canals glow amber again, and someone on a balcony tosses down a ribbon. Up ahead, the Mosaic Plaza sits quiet where the street players used to gather.',
          },
        ],
      },
      {
        id: 'lagplaza',
        name: 'Goldtile Plaza',
        blurb:
          'A sunken plaza of gold and coral mosaics where buskers, jugglers and singers once filled the evenings. Silt has hidden every tile, and each match brushes another piece of the picture back into the light.',
        sky: ['#1a4f63', '#3a8a7e'],
        palette: ['#f6cf3a', '#ff6f91', '#7fe0d6'],
        motif:
          '<g fill="currentColor"><rect x="14" y="14" width="20" height="20" rx="3"/><rect x="40" y="14" width="20" height="20" rx="3" opacity=".6"/><rect x="66" y="14" width="20" height="20" rx="3"/><rect x="14" y="40" width="20" height="20" rx="3" opacity=".6"/><rect x="40" y="40" width="20" height="20" rx="3"/><rect x="66" y="40" width="20" height="20" rx="3" opacity=".6"/><rect x="14" y="66" width="20" height="20" rx="3"/><rect x="40" y="66" width="20" height="20" rx="3" opacity=".6"/><rect x="66" y="66" width="20" height="20" rx="3"/></g>',
        beats: [
          {
            at: 1,
            title: 'The Empty Stage',
            text: 'Coralie rests her tail on the rim of the plaza fountain. The silt lies so thick over the mosaic that nobody remembers what picture it held.',
          },
          {
            at: 9,
            title: 'The Buskers Come Back',
            text: 'A drummer with a bucket, a juggler in a coral vest, an accordion player with a seahorse pin: one by one they return to the steps. "We stopped because the plaza felt so quiet," the juggler says. "Turns out it just needed someone to start."',
          },
          {
            at: 18,
            title: 'The Picture in the Tiles',
            text: 'The last tile clears and the whole mosaic shines: a choir of mermaids singing under a great bridge, holding up one enormous lantern. Coralie knows exactly where she has to go.',
          },
        ],
      },
      {
        id: 'lagbridge',
        name: 'Beneath the Starlight Bridge',
        blurb:
          'The oldest bridge in Lanternmere arches over the deepest canal, and under it the Mermaid Choir once sang the whole city to sleep. The great Heart Lantern hangs there, dim and waiting.',
        sky: ['#0b2a40', '#195c6e'],
        palette: ['#ffd76a', '#b98cff', '#5fe0cf'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M50 82 L50 30"/><path d="M50 30 Q58 22 66 26"/><circle cx="34" cy="70" r="10"/><path d="M44 70 L44 22 Q54 16 60 22"/></g><g fill="currentColor"><circle cx="78" cy="22" r="3"/><circle cx="84" cy="40" r="4"/><circle cx="76" cy="56" r="2.5"/></g>',
        beats: [
          {
            at: 1,
            title: 'Down to the Deep Arch',
            text: "Coralie dives beneath the Starlight Bridge while Pip's gondola glides above her. In the murky water she finds the choir: dozens of mermaids, each holding a dark lantern, each waiting for someone else to sing first.",
          },
          {
            at: 10,
            title: 'One Voice, Then Two',
            text: 'Coralie sings a single note. A small voice answers from the murk, shaky and brave, and then another. Tiny gold glints begin to swirl through the water like fireflies.',
          },
          {
            at: 19,
            title: 'The Heart Lantern',
            text: 'At the top of the arch hangs the great paper lantern from the mosaic. Coralie lifts her little lantern up to it, Pip squeezes the first chord on an accordion above, and the whole choir takes a breath together.',
          },
        ],
      },
    ],
    ending: {
      id: 'lagoon',
      title: 'The Lanterns Sing Again',
      text: 'The Heart Lantern blooms gold, and light races along every canal, bridge and balcony in Lanternmere at once. Beneath the bridges the Mermaid Choir sings for the first time in a whole season, and above them the buskers, the neighbors and one very off-key gondolier sing right along. Nobody gets every word right, and nobody minds one bit.',
    },
    map: {
      path: '#ffe2a6',
      dash: '#5fe0cf',
      node: 'shell',
    },
    quests: {
      daily: [
        {
          id: 'lagoon-d-lanterns',
          text: 'Light 50 Paper Lanterns',
          stat: 'color2',
          target: 50,
          reward: 30,
        },
        {
          id: 'lagoon-d-hatchlings',
          text: 'Guide 3 Turtle Hatchlings to the canal bottom',
          stat: 'buddiesRescued',
          target: 3,
          reward: 40,
        },
        {
          id: 'lagoon-d-glides',
          text: 'Launch 4 Gondola Glides',
          stat: 'combs',
          target: 4,
          reward: 35,
        },
      ],
      weekly: [
        {
          id: 'lagoon-w-silt',
          text: 'Stir away 120 Murky Silt',
          stat: 'gloomCleared',
          target: 120,
          reward: 160,
        },
        {
          id: 'lagoon-w-chords',
          text: 'Sing 8 Choir Chords',
          stat: 'rainbows',
          target: 8,
          reward: 175,
        },
      ],
    },
    achievements: [
      {
        key: 'start',
        name: 'First Lantern Lit',
        text: 'Win your first level in the Lantern Lagoon.',
      },
      {
        key: 'middle',
        name: 'Plaza Players',
        text: 'Bring the buskers back to Goldtile Plaza.',
      },
      {
        key: 'ending',
        name: 'The Lanterns Sing Again',
        text: 'Relight the Heart Lantern beneath the Starlight Bridge.',
      },
      {
        key: 'stars',
        name: 'Choir Soloist',
        text: 'Get 3 stars on 10 Lagoon levels.',
      },
      {
        key: 'signature',
        name: 'Hatchling Guide',
        text: 'Guide 40 Turtle Hatchlings home to the canal bottom.',
        stat: 'buddiesRescued',
        target: 40,
      },
    ],
    prompts: {
      style: STYLE,
      hero:
        'A character select portrait of ' +
        LOOK +
        ', smiling warmly and singing softly, the lantern lighting her face with amber glow. Waist-up centered pose facing the viewer in calm teal water beside a stone canal step, a curved bridge and floating paper lanterns behind her, ' +
        STYLE,
      key:
        'A lagoon city of winding canals at dusk, arched stone bridges, gondolas gliding past pastel houses with balconies, a sunken plaza of gold mosaics, hundreds of glowing paper lanterns reflected in teal water, a choir of mermaids in shell tops and flowing wraps gathered beneath a grand bridge, ' +
        LOOK +
        ' in the foreground raising her lantern. Wide composition, ' +
        STYLE,
      map:
        'A wide top-down storybook map of a lagoon city with a winding golden path following teal canals from a little moonlit bridge past a round gold mosaic plaza to a grand arched bridge over a deep blue canal, tiny gondolas, lily pads, paper lanterns dotting the bridges, ' +
        STYLE,
      regions: {
        lagcanal:
          'A quiet teal canal at twilight beneath a small stone footbridge, dim paper lanterns strung between pastel houses, soft brown silt drifting in the water, ' +
          LOOK +
          ' surfacing beside the bridge steps with the only bright lantern, ' +
          STYLE,
        lagplaza:
          'A sunken city plaza paved with gold and coral mosaic tiles partly covered in soft brown silt, a round fountain at the center, empty street-performer steps with a drum, juggling clubs and an accordion resting on them, lantern-lit balconies around the edges, ' +
          STYLE,
        lagbridge:
          'The underwater arch of a grand old stone bridge over a deep teal canal, a giant paper lantern hanging dim at the top of the arch, gentle shadowy water, faint gold glints, ' +
          LOOK +
          ' swimming downward with her lantern held high, ' +
          STYLE,
      },
      beats: {
        'lagcanal-9':
          PIP +
          ' laughing and humming on a black gondola in a teal canal, while ' +
          LOOK +
          ' hangs her lantern on the curved bow of the gondola, ' +
          STYLE,
        'lagcanal-18':
          'A lagoon city canal glowing amber with relit paper lanterns, neighbors leaning from flower-filled balconies, a ribbon floating down toward a gondola, a gold mosaic plaza glimmering in the distance, ' +
          STYLE,
        'lagplaza-9':
          'Street performers returning to the steps of a gold mosaic plaza at dusk, a drummer playing a bucket, a juggler in a coral vest, an older accordion player with a seahorse pin, families gathering to listen, ' +
          LOOK +
          ' clapping from the edge of the fountain, ' +
          STYLE,
        'lagplaza-18':
          'A gleaming gold and coral floor mosaic seen from above, showing a choir of mermaids in shell tops and flowing wraps singing under a great bridge while holding up one enormous glowing lantern, ' +
          LOOK +
          ' gazing at it in wonder, ' +
          STYLE,
        'lagbridge-10':
          'Beneath a grand stone bridge in teal water, a shy young mermaid in a flowing lilac wrap singing a first brave note, tiny gold glints swirling like fireflies, ' +
          LOOK +
          ' singing beside her with an encouraging smile, ' +
          STYLE,
        'lagbridge-19':
          'A huge dim paper lantern hanging at the top of an underwater bridge arch, ' +
          LOOK +
          ' lifting her small glowing lantern toward it, a circle of mermaid choir singers in shell tops and flowing wraps taking a breath together, ' +
          PIP +
          ' playing an accordion on a gondola above the water, ' +
          STYLE,
      },
      ending:
        'A lagoon city at night blazing with golden paper lanterns along every canal, bridge and balcony, a great heart-shaped lantern glowing beneath a grand stone bridge, a joyful choir of mermaids in shell tops and flowing wraps singing in the teal water, buskers and neighbors singing along on the bridge, ' +
        PIP +
        ' singing happily on a gondola, ' +
        LOOK +
        ' celebrating in the center, ' +
        STYLE,
    },
  })
})(typeof globalThis !== 'undefined' ? globalThis : this)
