;(function (root) {
  'use strict'
  var LOOK =
    'a bright-eyed young child with fluffy brown hair, light brown skin, round pink glasses, a lavender sweater and blue overalls, hugging a spiral sketchbook and pencil'
  var STYLE =
    'hand-drawn sketchbook hopecore 2D storybook game illustration on cream paper with faint blue graph lines, wobbly graphite outlines, waxy crayon hatching and soft watercolor washes in bright crayon primaries, tape and paperclip details, cozy whimsical light, unlettered surfaces'
  var CLOUD = 'a small round soft grey cloud with a shy pencil-drawn face'
  var DOODLES =
    'small round paper doodle creatures with wobbly pencil outlines and pink crayon cheeks'

  root.HopefulHuesWorlds.register({
    id: 'sketchbook',
    order: 5,
    name: "Juniper's Sketchbook",
    tagline: 'Draw the color back into a world somebody erased.',
    blurb:
      'Somebody rubbed a big grey eraser across every page, and the doodles went quiet. Juniper sharpens a pencil, flips to a fresh page and draws their way from the Graph Paper Meadow up the Crayon Cliffs to the Watercolor River, where a lonely little cloud is waiting.',
    hero: {
      id: 'juniper',
      name: 'Juniper',
      title: 'Dreamer With a Sketchbook',
      pronouns: 'they/them',
      perk: 'big-bombs',
      perkName: 'Big Picture',
      perkText:
        'Crayon Bursts color in a big 5x5 area instead of the usual small one.',
      cheer: [
        'Ooh, that one is moving!',
        'Color it in!',
        'Doodle-tastic!',
        'Every color counts!',
        'We drew that together!',
      ],
      epilogue:
        'Juniper leaves the very last page of the sketchbook blank on purpose, so whoever comes next has room to draw themselves in.',
      look: LOOK,
      portrait:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="58" fill="#fffbe0"/><path d="M26 70 C22 30 46 18 62 18 C86 18 100 36 96 70 C90 56 80 48 60 48 C42 48 32 58 26 70 Z" fill="#6b3f2a"/><ellipse cx="60" cy="66" rx="26" ry="29" fill="#c98b62"/><path d="M34 56 C40 40 80 38 86 56 C74 48 48 46 34 56 Z" fill="#6b3f2a"/><circle cx="49" cy="66" r="7" fill="none" stroke="#ff9bd6" stroke-width="3"/><circle cx="71" cy="66" r="7" fill="none" stroke="#ff9bd6" stroke-width="3"/><line x1="56" y1="66" x2="64" y2="66" stroke="#ff9bd6" stroke-width="3"/><circle cx="49" cy="66" r="3" fill="#2d1d14"/><circle cx="71" cy="66" r="3" fill="#2d1d14"/><path d="M51 80 Q60 88 69 80" stroke="#8a3a3a" stroke-width="3.5" fill="none" stroke-linecap="round"/><rect x="74" y="88" width="34" height="24" rx="3" fill="#7be0a6" transform="rotate(-12 91 100)"/><path d="M80 96 l20 -4 M81 102 l16 -3" stroke="#fff" stroke-width="2.5" transform="rotate(-12 91 100)"/><path d="M20 22 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#ff9bd6"/><path d="M98 18 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ffe066"/></svg>',
    },
    ui: {
      dark: false,
      bg: ['#fffaf0', '#f6f0e2', '#e4ecf8'],
      ink: '#2f3650',
      inkSoft: '#56607c',
      card: 'rgba(255,253,246,.92)',
      accent: '#e8453c',
      accent2: '#3a7fd6',
      cell: 'rgba(214,226,244,.55)',
    },
    music: {
      root: 65,
      mode: 'lydian',
      tempo: 92,
      timbre: 'musicbox',
      meter: 3,
    },
    effects: {
      glyphs: ['〰', '✎', '✶', '■', '▲'],
      colors: ['#e8453c', '#3a8ee8', '#ffcc2e', '#3fbf6a', '#9b6bdf'],
      label: 'scribbles and paper confetti',
    },
    jewels: [
      {
        name: 'Cherry Crayon',
        glyph: '♦',
        main: '#e8453c',
        light: '#ffb3a8',
        dark: '#b5231d',
        art: '<g transform="rotate(-14 50 50)" stroke="{D}" stroke-linejoin="round"><path d="M31 38 C35 28 40 20 45 13 Q50 8 55 13 C60 20 65 28 69 37 Z" fill="url(#J)" stroke-width="3"/><path d="M30 38 L70 37 L71 86 Q50 92 29 87 Z" fill="url(#J)" stroke-width="3.5"/><path d="M30 48 L70 47 M30 76 L71 75 M34 59 l7 -7 M38 68 l20 -19 M50 69 l16 -15" stroke-width="3" stroke-linecap="round" fill="none" opacity=".6"/></g>',
      },
      {
        name: 'Tangerine Pencil',
        glyph: '✎',
        main: '#ff8a2b',
        light: '#ffd2a8',
        dark: '#cf5d08',
        art: '<g transform="rotate(42 50 50)" stroke="{D}" stroke-width="3" stroke-linejoin="round"><rect x="38" y="6" width="24" height="14" rx="6" fill="#ff9fb8"/><rect x="37" y="19" width="26" height="9" fill="#c9ced8"/><path d="M37 28 L63 28 L63 70 L37 70 Z" fill="url(#J)" stroke-width="3.5"/><path d="M45 31 L45 67 M55 31 L55 67" stroke-width="2" opacity=".5"/><path d="M37 70 L63 70 L50 94 Z" fill="#f6dcb0"/><path d="M45 84 L55 84 L50 94 Z" fill="#4a5068"/></g>',
      },
      {
        name: 'Sunny Doodle Star',
        glyph: '★',
        main: '#ffcc2e',
        light: '#fff0a8',
        dark: '#d19a00',
        art: '<path d="M51 10 L61 37 L90 37 L67 56 L77 87 L50 69 L24 88 L32 57 L10 39 L39 36 Z" fill="url(#J)" stroke="{D}" stroke-width="3.5" stroke-linejoin="round"/><path d="M53 15 L62 40 L85 41 M73 83 L50 66 L28 83" stroke="{D}" stroke-width="2" fill="none" opacity=".45" stroke-linecap="round"/><path d="M38 48 l8 -8 M38 60 l18 -18 M44 66 l18 -18" stroke="{D}" stroke-width="2.5" stroke-linecap="round" opacity=".4"/>',
      },
      {
        name: 'Clover Paint Splat',
        glyph: '✱',
        main: '#3fbf6a',
        light: '#b6efc8',
        dark: '#1f8a45',
        art: '<path d="M50 16 C58 16 58 28 66 26 C76 22 84 30 78 40 C74 46 88 50 84 60 C80 70 70 64 68 74 C66 84 56 88 50 80 C44 88 32 86 32 76 C32 68 18 70 16 60 C14 50 26 48 22 40 C18 30 30 22 38 28 C42 30 42 16 50 16 Z" fill="url(#J)" stroke="{D}" stroke-width="3.5" stroke-linejoin="round"/><circle cx="86" cy="22" r="5" fill="url(#J)" stroke="{D}" stroke-width="2.5"/><circle cx="15" cy="84" r="4" fill="url(#J)" stroke="{D}" stroke-width="2.5"/><circle cx="87" cy="84" r="3" fill="{D}"/>',
      },
      {
        name: 'Sky Paper Airplane',
        glyph: '▲',
        main: '#3a8ee8',
        light: '#b8dbff',
        dark: '#1f62b5',
        art: '<g stroke="{D}" stroke-width="3.5" stroke-linejoin="round"><path d="M10 46 L90 14 L46 58 Z" fill="url(#J)"/><path d="M46 58 L90 14 L66 84 Z" fill="url(#J)"/><path d="M46 58 L90 14 L66 84 Z" fill="{D}" opacity=".25" stroke="none"/><path d="M46 58 L56 68 L42 80 Z" fill="{D}"/></g><path d="M12 70 q8 -7 16 0 t16 0" fill="none" stroke="{D}" stroke-width="3" stroke-linecap="round" stroke-dasharray="5 6" opacity=".6"/>',
      },
      {
        name: 'Grape Sticker Heart',
        glyph: '♥',
        main: '#9b6bdf',
        light: '#dcc8ff',
        dark: '#6c3fb5',
        art: '<path d="M50 80 C24 62 16 46 22 34 C28 22 44 22 50 34 C56 22 72 22 78 34 C84 46 76 62 50 80 Z" fill="none" stroke="{D}" stroke-width="15" stroke-linejoin="round"/><path d="M50 80 C24 62 16 46 22 34 C28 22 44 22 50 34 C56 22 72 22 78 34 C84 46 76 62 50 80 Z" fill="url(#J)" stroke="#fffdf6" stroke-width="9" stroke-linejoin="round"/><path d="M72 50 L84 40 Q86 56 72 50 Z" fill="#fffdf6" stroke="{D}" stroke-width="2.5" stroke-linejoin="round"/>',
      },
    ],
    specials: {
      comb: {
        name: 'Ruler Swipe',
        text: 'Match 4 in a line to make a Ruler Swipe that colors in a whole row or column in one straight stroke.',
      },
      bomb: {
        name: 'Crayon Burst',
        text: 'Match in an L or T shape to make a Crayon Burst that scribbles color over everything around it.',
      },
      rainbow: {
        name: 'Box of Every Crayon',
        text: 'Line up 5 for a Box of Every Crayon. Swap it with any jewel to color in every one of that kind.',
      },
    },
    blockers: {
      gloom: {
        name: 'Eraser Smudge',
        text: 'Eraser Smudges rubbed the color off the page. Match on top of one to draw it back in; heavy smudges need two passes.',
        color: '#e3ddd4',
        color2: '#aea8a6',
      },
      tangle: {
        name: 'Scribble Knot',
        text: 'Scribble Knots are pencil loops that got all tangled up. Match right beside one, or hit it with a special, to smooth it out.',
        art: '<rect x="8" y="8" width="84" height="84" rx="14" fill="#f6efdf" stroke="#a7b0c4" stroke-width="3"/><path d="M8 30 H92 M8 50 H92 M8 70 H92" stroke="#cfdcef" stroke-width="2"/><path d="M20 52 C18 22 60 18 62 40 C64 62 28 66 30 44 C32 26 76 24 78 48 C80 74 40 82 34 62 C28 44 72 40 70 62 C68 82 24 82 22 64" fill="none" stroke="#3d4560" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/><path d="M26 34 C40 26 54 30 50 40" fill="none" stroke="#8e97ad" stroke-width="3" stroke-linecap="round"/>',
      },
      buddy: {
        name: 'Doodle Pip',
        text: 'Doodle Pips want to hop down to the bottom margin where their friends are. You can always swap one down a space, and specials whisk them straight there.',
        art: '<path d="M38 80 L34 92 M62 80 L66 92" stroke="#3d4560" stroke-width="4" stroke-linecap="round"/><path d="M24 56 L11 46 M76 56 L89 46" stroke="#3d4560" stroke-width="4" stroke-linecap="round"/><path d="M48 22 C44 14 52 8 56 14" fill="none" stroke="#3d4560" stroke-width="3.5" stroke-linecap="round"/><circle cx="57" cy="14" r="4" fill="#ffcc2e" stroke="#3d4560" stroke-width="2"/><path d="M22 58 C19 35 34 22 51 22 C69 23 83 36 78 60 C75 74 64 81 50 80 C35 81 24 73 22 58 Z" fill="#fffaf0" stroke="#3d4560" stroke-width="4" stroke-linejoin="round"/><path d="M30 68 l8 -6 M36 74 l12 -9 M50 76 l12 -9 M62 72 l8 -6" stroke="#3a8ee8" stroke-width="3" stroke-linecap="round" opacity=".7"/><circle cx="41" cy="48" r="5" fill="#2f3650"/><circle cx="61" cy="48" r="5" fill="#2f3650"/><circle cx="42.5" cy="46.5" r="1.6" fill="#fff"/><circle cx="62.5" cy="46.5" r="1.6" fill="#fff"/><path d="M44 58 Q51 65 58 58" stroke="#2f3650" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="33" cy="57" r="4.5" fill="#ff9fb8"/><circle cx="69" cy="57" r="4.5" fill="#ff9fb8"/>',
      },
    },
    regions: [
      {
        id: 'skbmeadow',
        name: 'Graph Paper Meadow',
        blurb:
          'The first pages of the sketchbook used to be a meadow of crayon flowers under a graph-paper sky. Now it is all faint pencil lines and eraser crumbs, waiting for someone to color it in again.',
        sky: ['#fffaf0', '#dfe9f7'],
        palette: ['#3a8ee8', '#3fbf6a', '#ffcc2e'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-linecap="round"><path d="M10 30 H90 M10 50 H90 M10 70 H90 M30 10 V90 M50 10 V90 M70 10 V90" stroke-width="2" opacity=".55"/><path d="M50 26 L56 42 L73 42 L59 52 L64 68 L50 58 L36 68 L41 52 L27 42 L44 42 Z" stroke-width="5" stroke-linejoin="round"/></g>',
        beats: [
          {
            at: 1,
            title: 'A Blank Page',
            text: 'Juniper opens their sketchbook and every drawing has been rubbed down to a faint grey ghost. They push up their pink glasses and sharpen a pencil. "Okay. Then we draw it again."',
          },
          {
            at: 9,
            title: 'The First Doodle Wakes',
            text: 'A little doodle in the corner of the page blinks, wiggles and hops off the line. "You colored me back in!" it squeaks. "My friends are all waiting down in the bottom margin."',
          },
          {
            at: 18,
            title: 'A Trail of Crumbs',
            text: 'The meadow is bright again, and the doodles are throwing paper confetti. A trail of eraser crumbs leads off the page, toward a set of waxy cliffs and a small grey shape drifting quickly out of sight.',
          },
        ],
      },
      {
        id: 'skbcliffs',
        name: 'The Crayon Cliffs',
        blurb:
          'Tall waxy cliffs scribbled in every shade, held together with tape bridges and paperclip ladders. Somebody has rubbed big grey stripes across them, and the doodles who live here are stuck halfway up.',
        sky: ['#fff2e2', '#ffe1d8'],
        palette: ['#e8453c', '#ff8a2b', '#9b6bdf'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-linecap="round"><path d="M8 86 L26 40 L40 62 L58 22 L74 54 L92 34 L92 86 Z" stroke-width="5"/><path d="M24 78 l10 -12 M44 78 l14 -18 M66 78 l12 -14" stroke-width="3" opacity=".7"/></g>',
        beats: [
          {
            at: 1,
            title: 'Tape Bridges',
            text: 'The path up the Crayon Cliffs is made of strips of tape stuck end to end. Juniper tests each one with a careful toe. "Sticky," they decide. "Good sticky."',
          },
          {
            at: 9,
            title: 'The Paperclip Ladder',
            text: 'A whole family of doodles links arms into a wiggly ladder so Juniper can reach the next ledge. "Everybody helps," says the smallest one, "even the ones drawn really tiny."',
          },
          {
            at: 18,
            title: 'The River Below',
            text: 'From the top of the cliffs, Juniper can see a watercolor river winding across the next spread, running pale grey. On its far bank sits a little cloud, raining softly to itself.',
          },
        ],
      },
      {
        id: 'skbriver',
        name: 'The Watercolor River',
        blurb:
          'A river of watercolor once carried every color across the middle of the sketchbook. Juniper follows it with a wet brush and a pocket full of crayons to find out who has been doing all the erasing.',
        sky: ['#e6f1ff', '#f1e8ff'],
        palette: ['#3a8ee8', '#9b6bdf', '#ff7fa8'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-linecap="round"><path d="M26 34 C20 34 18 24 26 22 C28 12 44 12 46 20 C56 16 64 24 58 32 Z" stroke-width="4" stroke-linejoin="round"/><path d="M8 58 Q20 48 32 58 T56 58 T80 58 T96 56" stroke-width="6"/><path d="M4 78 Q16 68 28 78 T52 78 T76 78 T96 76" stroke-width="6" opacity=".7"/></g>',
        beats: [
          {
            at: 1,
            title: 'Wet Paint',
            text: 'The river is thin and grey, but it still remembers its colors. Every time Juniper dips their brush, a ribbon of blue or violet curls out downstream.',
          },
          {
            at: 10,
            title: 'The Lonely Cloud',
            text: 'The little grey cloud holds a worn-down eraser. "Every picture has a sun and flowers," it sniffles, "and I am always the smudge in the corner. So I made everything grey, like me." Juniper sits down beside it.',
          },
          {
            at: 19,
            title: 'One More Drawing',
            text: 'Juniper turns to a fresh page and holds out a crayon. "You were never a smudge. You were just waiting to be drawn in." Every doodle in the sketchbook gathers close to watch.',
          },
        ],
      },
    ],
    ending: {
      id: 'sketchbook',
      title: 'Everyone in the Picture',
      text: 'Juniper draws the little cloud a big crooked smile and a striped rainbow scarf, and the cloud laughs so hard it rains color across every page. The river runs bright, the cliffs glow, and the doodles dance along the margins. Right in the middle of the final spread, the cloud gets a picture all its own.',
    },
    map: {
      path: '#fffdf6',
      dash: '#56607c',
      node: 'star',
    },
    quests: {
      daily: [
        {
          id: 'sketchbook-d-airplanes',
          text: 'Fold and fly 50 Sky Paper Airplanes',
          stat: 'color4',
          target: 50,
          reward: 30,
        },
        {
          id: 'sketchbook-d-pips',
          text: 'Help 3 Doodle Pips hop to the bottom margin',
          stat: 'buddiesRescued',
          target: 3,
          reward: 40,
        },
        {
          id: 'sketchbook-d-bursts',
          text: 'Scribble out 4 Crayon Bursts',
          stat: 'bombs',
          target: 4,
          reward: 35,
        },
      ],
      weekly: [
        {
          id: 'sketchbook-w-knots',
          text: 'Smooth out 60 Scribble Knots',
          stat: 'tanglesCleared',
          target: 60,
          reward: 160,
        },
        {
          id: 'sketchbook-w-rulers',
          text: 'Draw 15 Ruler Swipes across the page',
          stat: 'combs',
          target: 15,
          reward: 170,
        },
      ],
    },
    achievements: [
      {
        key: 'start',
        name: 'First Sketch',
        text: "Win your first level in Juniper's Sketchbook.",
      },
      {
        key: 'middle',
        name: 'Top of the Crayon Cliffs',
        text: 'Color in every page of the Crayon Cliffs.',
      },
      {
        key: 'ending',
        name: 'Everyone in the Picture',
        text: 'Draw the lonely cloud into the picture.',
      },
      {
        key: 'stars',
        name: 'Gold Star Sticker',
        text: 'Get 3 stars on 10 Sketchbook levels.',
      },
      {
        key: 'signature',
        name: 'Un-Eraser',
        text: 'Draw color back over 150 Eraser Smudges.',
        stat: 'gloomCleared',
        target: 150,
      },
    ],
    prompts: {
      style: STYLE,
      hero:
        'A character select portrait of ' +
        LOOK +
        ', holding up a freshly drawn crayon star that is lifting off the paper and glowing, a delighted open smile. Waist-up centered pose facing the viewer, background of a cream sketchbook page with blue graph lines, colorful crayon doodles and paper confetti, ' +
        STYLE,
      key:
        'A giant open sketchbook spread becoming a whole world, a graph-paper meadow of crayon flowers, tall waxy crayon cliffs joined by tape bridges, a winding watercolor river, ' +
        DOODLES +
        ' playing in the margins, ' +
        CLOUD +
        ' peeking from a corner, ' +
        LOOK +
        ' in the foreground drawing a bright streak of color across the page. Wide composition, ' +
        STYLE,
      map:
        'A wide top-down map drawn across an open sketchbook spread, a winding dashed pencil path running from a graph-paper meadow of crayon flowers up waxy crayon cliffs with tape bridges and paperclip ladders to a winding watercolor river, small doodle stars, eraser crumbs and paper confetti along the edges, ' +
        STYLE,
      regions: {
        skbmeadow:
          'A graph-paper meadow on a sketchbook page, half of it faint grey pencil lines and soft eraser smudges, half freshly colored with crayon flowers and green hatched grass, ' +
          LOOK +
          ' kneeling in the meadow and coloring a big yellow flower back in, eraser crumbs scattered nearby, ' +
          STYLE,
        skbcliffs:
          'Tall jagged cliffs scribbled in waxy red, orange and violet crayon with broad pale grey stripes rubbed across them, bridges made of strips of clear tape and ladders made of linked paperclips, ' +
          DOODLES +
          ' waving from the ledges, ' +
          STYLE,
        skbriver:
          'A wide winding watercolor river across a sketchbook spread running pale grey with faint ribbons of blue and violet, soft paint blooms along the banks, ' +
          LOOK +
          ' walking along the bank with a wet paintbrush, ' +
          CLOUD +
          ' sitting on the far bank under its own tiny rain shower, ' +
          STYLE,
      },
      beats: {
        'skbmeadow-9':
          'A little round paper doodle creature with a wobbly pencil outline, pink crayon cheeks and a curly antenna hopping off a pencil line on a sketchbook page, ' +
          LOOK +
          ' leaning close with a joyful surprised smile, ' +
          STYLE,
        'skbmeadow-18':
          'A brightly colored graph-paper meadow full of crayon flowers, ' +
          DOODLES +
          ' throwing paper confetti, a trail of pink eraser crumbs leading toward distant waxy crayon cliffs, a small grey cloud drifting away over the edge of the page, ' +
          STYLE,
        'skbcliffs-9':
          'A family of ' +
          DOODLES +
          ' linking arms into a wiggly living ladder down a waxy crayon cliff, ' +
          LOOK +
          ' climbing up it with a grateful smile, strips of tape and paperclips on the cliff face, ' +
          STYLE,
        'skbcliffs-18':
          'The top of a waxy crayon cliff looking out over a sketchbook spread, a pale grey watercolor river winding below, ' +
          CLOUD +
          ' sitting alone on the far bank under a tiny rain shower, ' +
          LOOK +
          ' looking down with gentle concern, ' +
          STYLE,
        'skbriver-10':
          CLOUD +
          ' holding a worn pink eraser and looking sad on the bank of a watercolor river, ' +
          LOOK +
          ' sitting down beside it on the paper bank with a kind listening face, ' +
          STYLE,
        'skbriver-19':
          LOOK +
          ' holding out a bright crayon to ' +
          CLOUD +
          ' beside a fresh blank sketchbook page, ' +
          DOODLES +
          ' gathered close around them watching hopefully, a softly glowing watercolor river behind, ' +
          STYLE,
      },
      ending:
        'A small round grey cloud with a big crooked crayon smile and a striped rainbow scarf laughing and raining every color across an open sketchbook, a bright watercolor river, glowing crayon cliffs and a flowering graph-paper meadow, ' +
        DOODLES +
        ' dancing along the margins, ' +
        LOOK +
        ' celebrating in the center with arms raised, ' +
        STYLE,
    },
  })
})(typeof globalThis !== 'undefined' ? globalThis : this)
