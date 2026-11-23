;(function (root) {
  'use strict'
  var LOOK =
    'a lanky adult street performer with warm brown skin, freckles, a mop of copper-red curls under a small tilted black top hat with an ember-orange ribbon, a plum and gold striped vest over a loose cream shirt with rolled sleeves, a tiny aqua glass earring, bare feet'
  var STYLE =
    'warm hopecore storybook 2D hand-painted game illustration, ember orange, flame gold, smoky plum and glass aqua palette, cozy cobblestone glow, rounded friendly shapes, unlettered surfaces'
  root.HopefulHuesWorlds.register({
    id: 'circus',
    order: 7,
    name: 'The Ember and Glass Street Circus',
    tagline: 'A traveling troupe, a chalk circle and a hat passed with love.',
    blurb:
      'A soot-grey Hush has settled over the old town of Vellacorte, and folks hurry past without looking up. Tamsin Spark and the Ember and Glass Street Circus chalk their circle on the cobbles and busk their way from the fountain piazza over the canal bridges to the festival nobody has dared to hold in years.',
    hero: {
      id: 'tamsin',
      name: 'Tamsin Spark',
      title: 'Fire-Juggling Glasswalker',
      pronouns: 'they/them',
      perk: 'comb-start',
      perkName: 'Two Torches Lit',
      perkText:
        'Starts every level with two Fire Staff Sweeps already on the board.',
      cheer: [
        'Hup! Nailed it!',
        'Round of applause for you!',
        'Catch, spin, shine!',
        'Steady feet, bright heart!',
        'The hat is filling up!',
      ],
      epilogue:
        'Tamsin leaves a chalk circle on the fountain steps, with a little arrow pointing inside it: the next show belongs to whoever steps in.',
      look: LOOK,
      portrait:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="tamsinSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a2a4f"/><stop offset="1" stop-color="#ff9a52"/></linearGradient><clipPath id="tamsinClip"><circle cx="60" cy="60" r="58"/></clipPath></defs><circle cx="60" cy="60" r="58" fill="url(#tamsinSky)"/><g clip-path="url(#tamsinClip)"><path d="M22 120 C24 98 40 90 60 90 C80 90 96 98 98 120 Z" fill="#fff1dc"/><path d="M26 120 C28 100 40 92 52 90 L57 120 Z" fill="#8a3f86"/><path d="M94 120 C92 100 80 92 68 90 L63 120 Z" fill="#8a3f86"/><path d="M33 104 L52 100 M30 113 L54 109 M87 104 L68 100 M90 113 L66 109" stroke="#ffc23a" stroke-width="3" stroke-linecap="round"/><rect x="53" y="78" width="14" height="14" fill="#a8693f"/><g fill="#c8552a"><circle cx="36" cy="56" r="11"/><circle cx="84" cy="56" r="11"/><circle cx="38" cy="72" r="9"/><circle cx="82" cy="72" r="9"/></g><ellipse cx="60" cy="63" rx="24" ry="27" fill="#b8784a"/><g fill="#d9662f"><circle cx="43" cy="44" r="9"/><circle cx="55" cy="40" r="9"/><circle cx="67" cy="40" r="9"/><circle cx="78" cy="46" r="8"/></g><g transform="rotate(-12 60 30)"><ellipse cx="60" cy="35" rx="27" ry="6" fill="#2b1d2e"/><rect x="44" y="9" width="32" height="26" rx="3" fill="#2b1d2e"/><rect x="44" y="25" width="32" height="7" fill="#ff7a2f"/></g><circle cx="51" cy="65" r="3.8" fill="#2b1d2e"/><circle cx="69" cy="65" r="3.8" fill="#2b1d2e"/><circle cx="52.2" cy="63.6" r="1.3" fill="#fff"/><circle cx="70.2" cy="63.6" r="1.3" fill="#fff"/><path d="M51 77 Q60 85 69 77" stroke="#6e2b2b" stroke-width="3.2" fill="none" stroke-linecap="round"/><circle cx="43" cy="73" r="4.5" fill="#ff8a6b" opacity=".55"/><circle cx="77" cy="73" r="4.5" fill="#ff8a6b" opacity=".55"/><g fill="#7a4126"><circle cx="46" cy="70" r="1"/><circle cx="49" cy="72" r="1"/><circle cx="71" cy="72" r="1"/><circle cx="74" cy="70" r="1"/></g><path d="M36 74 l3 5 -3 5 -3 -5z" fill="#45d3e6"/><path d="M22 44 Q60 -10 98 40" stroke="#ffd98a" stroke-width="2" stroke-dasharray="4 5" fill="none" opacity=".7"/><g transform="translate(20 40) rotate(-25)"><rect x="-2" y="5" width="4" height="15" rx="2" fill="#efe3d0"/><path d="M0 -10 C7 -3 7 4 0 7 C-7 4 -7 -3 0 -10 Z" fill="#ffc23a"/><path d="M0 -3 C3 0 3 3 0 5 C-3 3 -3 0 0 -3 Z" fill="#ff7a2f"/></g><g transform="translate(100 38) rotate(25)"><rect x="-2" y="5" width="4" height="15" rx="2" fill="#efe3d0"/><path d="M0 -10 C7 -3 7 4 0 7 C-7 4 -7 -3 0 -10 Z" fill="#ffc23a"/><path d="M0 -3 C3 0 3 3 0 5 C-3 3 -3 0 0 -3 Z" fill="#ff7a2f"/></g><path d="M88 92 l3 -6 3 6 -3 6z M18 86 l2 -4 2 4 -2 4z" fill="#bff4fb"/></g></svg>',
    },
    ui: {
      dark: true,
      bg: ['#2a1a33', '#3f2240', '#5c2f2a'],
      ink: '#fff3e2',
      inkSoft: '#f0cfb4',
      card: 'rgba(38,22,44,.86)',
      accent: '#ff8a3d',
      accent2: '#45d3e6',
      cell: 'rgba(255,236,214,.10)',
    },
    music: {
      root: 57,
      mode: 'mixolydian',
      tempo: 112,
      timbre: 'accordion',
      meter: 3,
    },
    effects: {
      glyphs: ['✦', '✧', '✺', '◆'],
      colors: ['#ff8a3d', '#ffc23a', '#45d3e6', '#fff3d6'],
      label: 'sparks and glass glints',
    },
    jewels: [
      {
        name: 'Ember Club',
        glyph: '♣',
        main: '#ff7a2f',
        light: '#ffc49c',
        dark: '#d4531a',
        art: '<g transform="rotate(-18 50 50)"><path d="M44 80 L45 58 C24 48 26 12 50 10 C74 12 76 48 55 58 L56 80 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M38 34 Q50 40 62 34" stroke="{L}" stroke-width="5" fill="none" stroke-linecap="round"/><circle cx="50" cy="86" r="7" fill="url(#J)" stroke="{D}" stroke-width="3"/></g>',
      },
      {
        name: 'Torch Flame',
        glyph: '✺',
        main: '#ffc23a',
        light: '#ffe9a8',
        dark: '#d99a00',
        art: '<path d="M50 6 C56 22 66 28 66 40 C72 34 72 26 70 20 C82 32 82 52 78 64 C74 82 62 92 50 92 C38 92 26 82 22 64 C18 50 24 38 32 30 C32 38 34 42 38 44 C36 30 42 18 50 6 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M50 50 C58 60 62 68 58 76 C55 82 45 82 42 76 C38 68 44 60 50 50 Z" fill="{L}"/>',
      },
      {
        name: 'Glass Prism',
        glyph: '▲',
        main: '#45d3e6',
        light: '#c4f6fc',
        dark: '#1ea3b8',
        art: '<path d="M50 10 L88 84 L12 84 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M50 10 L50 84 M50 58 L12 84 M50 58 L88 84" stroke="{L}" stroke-width="3" fill="none" opacity=".8"/>',
      },
      {
        name: 'Velvet Top Hat',
        glyph: '■',
        main: '#a35de0',
        light: '#dcbcff',
        dark: '#7232b0',
        art: '<path d="M30 18 L70 18 L67 70 L33 70 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><rect x="32" y="54" width="36" height="10" fill="{D}"/><ellipse cx="50" cy="74" rx="38" ry="10" fill="url(#J)" stroke="{D}" stroke-width="3"/>',
      },
      {
        name: 'Beanbag Ball',
        glyph: '●',
        main: '#ff4d6d',
        light: '#ffb8c6',
        dark: '#d42a4c',
        art: '<circle cx="50" cy="50" r="36" fill="url(#J)" stroke="{D}" stroke-width="3"/><path d="M22 34 C40 46 60 46 78 34 M22 66 C40 54 60 54 78 66" stroke="{D}" stroke-width="3" fill="none" stroke-dasharray="5 4" opacity=".7"/>',
      },
      {
        name: 'Lucky Ticket',
        glyph: '★',
        main: '#8ad44a',
        light: '#d4f5b0',
        dark: '#5ca624',
        art: '<g transform="rotate(-14 50 50)"><path d="M12 28 L88 28 L88 42 A8 8 0 0 0 88 58 L88 72 L12 72 L12 58 A8 8 0 0 0 12 42 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M66 32 L66 68" stroke="{D}" stroke-width="3" stroke-dasharray="4 4"/><path d="M38 38 L42 47 L52 48 L44 54 L47 63 L38 58 L29 63 L32 54 L24 48 L34 47 Z" fill="{L}"/></g>',
      },
    ],
    specials: {
      comb: {
        name: 'Fire Staff Sweep',
        text: 'Match 4 in a line to light a Fire Staff Sweep that twirls across a whole row or column.',
      },
      bomb: {
        name: 'Hat Trick Burst',
        text: 'Match in an L or T shape to make a Hat Trick Burst that pops a shower of sparks all around it.',
      },
      rainbow: {
        name: 'Prism Spotlight',
        text: 'Line up 5 for a Prism Spotlight. Swap it with any jewel to clear every one of that color.',
      },
    },
    blockers: {
      gloom: {
        name: 'Soot Haze',
        text: 'Soot Haze from the Hush hangs over the cobbles. Match on top of it to fan it away; thick smoke needs two puffs.',
        color: '#9a8c97',
        color2: '#6e6170',
      },
      tangle: {
        name: 'Rigging Knot',
        text: 'Rigging Knots are snarled rope from the old stage. Match right beside them, or send a special their way, to shake them loose.',
        art: '<rect x="8" y="8" width="84" height="84" rx="18" fill="#c9a77c"/><g fill="none" stroke="#7a5230" stroke-width="7" stroke-linecap="round"><path d="M14 34 C40 34 60 66 86 66"/><path d="M14 66 C40 66 60 34 86 34"/><circle cx="50" cy="50" r="13"/></g><g fill="none" stroke="#f2dcb8" stroke-width="2" stroke-linecap="round" opacity=".7"><path d="M18 32 C40 32 60 64 84 64"/><path d="M18 64 C40 64 60 32 84 32"/></g>',
      },
      buddy: {
        name: 'Busker Mouse',
        text: 'Busker Mice are hurrying to the stage edge at the bottom. You can always swap one down a space, and specials carry them straight there.',
        art: '<circle cx="30" cy="44" r="12" fill="#c9b8c4" stroke="#6e5a70" stroke-width="3"/><circle cx="70" cy="44" r="12" fill="#c9b8c4" stroke="#6e5a70" stroke-width="3"/><circle cx="30" cy="44" r="6" fill="#ffb3c1"/><circle cx="70" cy="44" r="6" fill="#ffb3c1"/><ellipse cx="50" cy="64" rx="26" ry="22" fill="#d9cad4" stroke="#6e5a70" stroke-width="4"/><circle cx="41" cy="61" r="4" fill="#2b1d2e"/><circle cx="59" cy="61" r="4" fill="#2b1d2e"/><circle cx="50" cy="71" r="4" fill="#ff7a8f"/><path d="M38 76 L24 80 M62 76 L76 80" stroke="#6e5a70" stroke-width="2" stroke-linecap="round"/><ellipse cx="50" cy="44" rx="18" ry="4" fill="#2b1d2e"/><rect x="40" y="22" width="20" height="22" rx="2" fill="#2b1d2e"/><rect x="40" y="36" width="20" height="5" fill="#ff7a2f"/>',
      },
    },
    regions: [
      {
        id: 'crcpiazza',
        name: 'Fountain Piazza',
        blurb:
          'The fountain in the old piazza has gone quiet, and a soot-grey Hush hangs over the cafe tables. Tamsin chalks a circle on the cobbles, sets down a battered top hat and lights the first torch.',
        sky: ['#3f2240', '#a8523a'],
        palette: ['#ff8a3d', '#ffc23a', '#a35de0'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M20 90 L20 50 A15 15 0 0 1 50 50 L50 90"/><path d="M50 90 L50 50 A15 15 0 0 1 80 50 L80 90"/><path d="M10 90 L90 90"/><circle cx="50" cy="20" r="6"/></g>',
        beats: [
          {
            at: 1,
            title: 'The Chalk Circle',
            text: 'Tamsin draws a big chalk circle on the cobbles and tosses their hat down in the middle. Folks shuffle past through the haze. "Nobody has stopped yet," Tamsin grins, lighting a torch. "Yet is my favorite word."',
          },
          {
            at: 9,
            title: 'A Button in the Hat',
            text: 'A kid with a scarf up to their nose stops, watches three flaming clubs loop through the air, and drops a shiny button in the hat. A tiny mouse in an even tinier top hat climbs out of the drain and takes a bow.',
          },
          {
            at: 18,
            title: 'The Boarded Stage',
            text: 'The cafe owner whispers that Vellacorte used to hold a festival every summer, until the Hush rolled in and the stage was boarded up. Tamsin looks toward the canal bridges. "Then that is where we are headed."',
          },
        ],
      },
      {
        id: 'crccanal',
        name: 'Canal Bridge Crossings',
        blurb:
          'A string of humpbacked bridges over green canal water, perfect for busking. Tamsin and their partner acrobat Bram turn every crossing into a stage, and the crowd starts following them from bridge to bridge.',
        sky: ['#2f2f4f', '#2c8a92'],
        palette: ['#45d3e6', '#ff8a3d', '#c8b8a6'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M8 60 Q50 14 92 60"/><path d="M8 60 L92 60"/><path d="M10 78 Q20 70 30 78 T50 78 T70 78 T90 78"/></g>',
        beats: [
          {
            at: 1,
            title: 'Hand to Hand',
            text: 'On the first bridge, Bram plants his feet and Tamsin steps up onto his shoulders, then into a handstand on his palms. Boats slow down underneath. Someone on a balcony claps once, then again.',
          },
          {
            at: 9,
            title: 'The Glass Bed',
            text: 'Kit, the troupe juggler with a hundred props, pours out a bed of glittering glass. Tamsin takes off their shoes, breathes slow and dances across it, light as a leaf, years of careful practice in every step. The bridge gasps, then cheers.',
          },
          {
            at: 18,
            title: 'Lanterns on the Water',
            text: 'The canal folks float paper lanterns under the last bridge to light the way. Beyond it, the festival square waits in a heavy cloud of Hush, its stage still boarded shut.',
          },
        ],
      },
      {
        id: 'crcfestival',
        name: 'Festival Night Square',
        blurb:
          'The great square where Vellacorte once danced all night. The troupe pries the boards off the old stage, the chalk artists get to work, and the whole town gathers at the edge of the light.',
        sky: ['#1f1530', '#6a2f5a'],
        palette: ['#ffc23a', '#ff4d6d', '#45d3e6'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M10 22 Q30 36 50 22 Q70 36 90 22"/><path d="M22 28 L26 40 L32 30 M44 30 L50 42 L56 30 M68 30 L74 40 L78 28"/><path d="M14 88 L86 88 L80 64 L20 64 Z"/></g>',
        beats: [
          {
            at: 1,
            title: 'Boards Off',
            text: 'Bram and Kit pry the last plank from the old stage while the chalk artists sketch giant flowers across the square. Tamsin checks the safety towel and water bucket, like always. "Fire is a friend you respect," they say.',
          },
          {
            at: 10,
            title: 'The Mural Wakes',
            text: 'The chalk mural spreads from stage to fountain: dragons made of daisies, a whale wearing a top hat, a hundred hands holding a hundred juggling balls. People kneel down and start adding their own drawings.',
          },
          {
            at: 19,
            title: 'Every Torch Lit',
            text: 'The whole town is standing at the edge of the chalk circle now, quiet and hopeful. Tamsin lights every torch, steps onto the glass, and holds out a hand. "This last part," they say, "we do together."',
          },
        ],
      },
    ],
    ending: {
      id: 'circus',
      title: 'The Whole Town Joins the Show',
      text: 'The torches spin, the glass glitters, and the Hush drifts up and away like smoke from a candle. Grandparents learn to juggle scarves, kids build a wobbly human pyramid, the baker balances a cake on her head, and the passed hat comes back overflowing with coins, buttons and folded thank-you notes. Vellacorte holds its festival again, and the Ember and Glass Street Circus promises to come home every summer.',
    },
    map: {
      path: '#ffd89a',
      dash: '#ff8a3d',
      node: 'diamond',
    },
    quests: {
      daily: [
        {
          id: 'circus-d-mice',
          text: 'Guide 3 Busker Mice to the stage edge',
          stat: 'buddiesRescued',
          target: 3,
          reward: 40,
        },
        {
          id: 'circus-d-torches',
          text: 'Catch 50 Torch Flames',
          stat: 'color1',
          target: 50,
          reward: 30,
        },
        {
          id: 'circus-d-sweeps',
          text: 'Twirl 5 Fire Staff Sweeps',
          stat: 'combs',
          target: 5,
          reward: 35,
        },
      ],
      weekly: [
        {
          id: 'circus-w-soot',
          text: 'Fan away 120 Soot Haze',
          stat: 'gloomCleared',
          target: 120,
          reward: 160,
        },
        {
          id: 'circus-w-spotlight',
          text: 'Shine 10 Prism Spotlights',
          stat: 'rainbows',
          target: 10,
          reward: 175,
        },
      ],
    },
    achievements: [
      {
        key: 'start',
        name: 'First Coin in the Hat',
        text: 'Win your first level in the Street Circus.',
      },
      {
        key: 'middle',
        name: 'Bridge to Bridge',
        text: 'Busk across every Canal Bridge Crossing.',
      },
      {
        key: 'ending',
        name: 'The Whole Town Joins the Show',
        text: 'Bring the festival back to Vellacorte.',
      },
      {
        key: 'stars',
        name: 'Standing Ovation',
        text: 'Get 3 stars on 10 Street Circus levels.',
      },
      {
        key: 'signature',
        name: 'Torchbearer',
        text: 'Twirl 60 Fire Staff Sweeps.',
        stat: 'combs',
        target: 60,
      },
    ],
    prompts: {
      style: STYLE,
      hero:
        'A character select portrait of ' +
        LOOK +
        ', juggling three softly glowing performance torches in a bright arc overhead, beaming with joy. Waist-up centered pose facing the viewer, warm dusk piazza background with string lights and glass glints, ' +
        STYLE,
      key:
        'An old-world cobblestone town at festival night, a fountain piazza, humpbacked canal bridges with floating lanterns and a big square with a bright open stage, a joyful troupe of street performers with partner acrobats, a juggler surrounded by colorful props and chalk artists drawing flowers, ' +
        LOOK +
        ' in the foreground juggling glowing performance torches above a sparkling bed of glass, a crowd of smiling townsfolk gathering. Wide composition, ' +
        STYLE,
      map:
        'A wide top-down storybook map of an old cobblestone town with a winding golden path running from a fountain piazza across a chain of humpbacked canal bridges to a big festival square with a stage, terracotta rooftops, cafe umbrellas, lantern-lit canals, ' +
        STYLE,
      regions: {
        crcpiazza:
          'An old-world fountain piazza at dusk under a soft drift of grey smoky haze, cafe tables and arched colonnades, a big chalk circle on warm grey cobblestones with a battered top hat in the middle, ' +
          LOOK +
          ' lighting a single performance torch with a calm smile, ' +
          STYLE,
        crccanal:
          'A chain of humpbacked stone bridges over green canal water at golden hour, little boats gliding underneath, two partner acrobats balancing in a hand-to-hand handstand on the bridge, ' +
          LOOK +
          ' balanced upside down on the palms of a broad smiling partner, townsfolk waving from flower balconies, ' +
          STYLE,
        crcfestival:
          'A grand cobblestone festival square at night with an old wooden stage covered in planks, strings of unlit bunting and lanterns, a thick cloud of soft grey haze, street performers carrying ladders and juggling props toward the stage, ' +
          STYLE,
      },
      beats: {
        'crcpiazza-9':
          'A small child in a long striped scarf dropping a shiny button into a battered top hat on the cobbles, a tiny grey mouse wearing a tiny black top hat with an orange ribbon bowing beside the hat, ' +
          LOOK +
          ' juggling three glowing performance clubs in the background, ' +
          STYLE,
        'crcpiazza-18':
          'A kind cafe owner with an apron pointing across a misty piazza toward a row of humpbacked canal bridges, ' +
          LOOK +
          ' looking toward the bridges with a hopeful grin, warm lamplight on cobblestones, ' +
          STYLE,
        'crccanal-9':
          LOOK +
          ' dancing gracefully barefoot across a glittering bed of glass on a stone canal bridge, arms spread wide for balance, a juggler with a cart of a hundred colorful props cheering beside them, a delighted crowd, aqua and gold glints sparkling, ' +
          STYLE,
        'crccanal-18':
          'Paper lanterns floating on a dark green canal under the last stone bridge, glowing orange and gold, a festival square beyond under a cloud of soft grey haze, a boarded wooden stage, ' +
          STYLE,
        'crcfestival-10':
          'A giant colorful chalk mural spreading across a cobblestone square at night, dragons made of daisies, a whale in a top hat and many hands holding juggling balls, townsfolk of all ages kneeling to draw with chalk, ' +
          LOOK +
          ' smiling among them, ' +
          STYLE,
        'crcfestival-19':
          LOOK +
          ' standing on a glittering glass bed on an open wooden stage with a ring of glowing performance torches, holding out a welcoming hand toward a whole town gathered at the edge of a chalk circle, soft grey haze lifting into the stars, ' +
          STYLE,
      },
      ending:
        'A joyful festival night in a cobblestone square, the whole town performing together, grandparents juggling bright silk scarves, kids building a wobbly human pyramid, a baker balancing a cake on her head, a top hat overflowing with coins and buttons, glowing torches spinning in the air and glitter of glass under the stars, ' +
        LOOK +
        ' laughing in the center with arms raised, ' +
        STYLE,
    },
  })
})(typeof globalThis !== 'undefined' ? globalThis : this)
