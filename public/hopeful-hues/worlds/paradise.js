;(function (root) {
  'use strict'
  root.HopefulHuesWorlds.register({
    id: 'paradise',
    order: 1,
    name: "Superkate's Rainbow Paradise",
    tagline: 'A tropical rainbow getaway where every match is a fresh dye job.',
    blurb:
      "The Grey Drizzle washed the color out of Superkate's seaside town. With a salon chair, a bottle of rainbow dye and a whole lot of heart, she paints her way from the salon street to the carnival boardwalk to the top of Rainbow Falls.",
    hero: {
      id: 'kate',
      name: 'Superkate',
      title: 'Rainbow Hair Hero',
      pronouns: 'she/her',
      perk: 'rainbow-start',
      perkName: 'Color Theory',
      perkText: 'Starts every level with a Rainbow Dye already on the board.',
      cheer: [
        'Gorgeous!',
        'That color is SO you!',
        'Fresh dye, fresh start!',
        'Glowing!',
        'We did that together!',
      ],
      epilogue:
        'Kate opens the salon doors wide. The first appointment of the day is for anyone who needs a little color, no charge.',
      look: 'a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt',
      portrait:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="kateHair" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5fa2"/><stop offset=".25" stop-color="#ff9f43"/><stop offset=".45" stop-color="#ffd93b"/><stop offset=".65" stop-color="#3ddc97"/><stop offset=".82" stop-color="#4cc9f0"/><stop offset="1" stop-color="#a66cff"/></linearGradient></defs><circle cx="60" cy="60" r="58" fill="#fff0f7"/><path d="M18 104 C14 54 30 18 60 18 C92 18 108 54 102 104 Z" fill="url(#kateHair)"/><ellipse cx="60" cy="62" rx="27" ry="31" fill="#f7c9a8"/><path d="M33 52 C38 30 82 26 88 54 C76 40 52 36 33 52 Z" fill="url(#kateHair)"/><circle cx="49" cy="64" r="4" fill="#3a2a46"/><circle cx="71" cy="64" r="4" fill="#3a2a46"/><circle cx="50" cy="62.5" r="1.4" fill="#fff"/><circle cx="72" cy="62.5" r="1.4" fill="#fff"/><path d="M50 78 Q60 86 70 78" stroke="#c2456f" stroke-width="3.5" fill="none" stroke-linecap="round"/><circle cx="41" cy="74" r="5" fill="#ff9ec4" opacity=".7"/><circle cx="79" cy="74" r="5" fill="#ff9ec4" opacity=".7"/><path d="M84 20 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4z" fill="#ffd93b"/><rect x="88" y="78" width="22" height="6" rx="3" fill="#a66cff" transform="rotate(-30 99 81)"/><circle cx="92" cy="90" r="5" fill="none" stroke="#7d42e0" stroke-width="3"/><circle cx="104" cy="84" r="5" fill="none" stroke="#7d42e0" stroke-width="3"/></svg>',
    },
    ui: {
      dark: false,
      bg: ['#ffe3f1', '#fff4d6', '#dcfff0'],
      ink: '#3b2b5c',
      inkSoft: '#6c5a8e',
      card: 'rgba(255,255,255,.85)',
      accent: '#ff5fa2',
      accent2: '#a66cff',
      cell: 'rgba(255,255,255,.7)',
    },
    music: {
      root: 60,
      mode: 'major',
      tempo: 100,
      timbre: 'bell',
      meter: 4,
    },
    effects: {
      glyphs: ['♥', '✦', '✿', '★'],
      colors: ['#ff5fa2', '#ffd93b', '#4cc9f0', '#a66cff'],
      label: 'hearts and sparkles',
    },
    jewels: [
      {
        name: 'Rose Heart',
        glyph: '♥',
        main: '#ff5fa2',
        light: '#ffc2dc',
        dark: '#d93a7f',
        art: '<path d="M50 82 C20 62 10 44 18 30 C26 16 44 18 50 32 C56 18 74 16 82 30 C90 44 80 62 50 82 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/>',
      },
      {
        name: 'Mango Star',
        glyph: '★',
        main: '#ff9f43',
        light: '#ffd8ae',
        dark: '#e2781a',
        art: '<path d="M50 12 L60 38 L88 40 L66 58 L74 86 L50 70 L26 86 L34 58 L12 40 L40 38 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/>',
      },
      {
        name: 'Sunny Hibiscus',
        glyph: '✿',
        main: '#ffd93b',
        light: '#fff2a8',
        dark: '#e0b400',
        art: '<g fill="url(#J)" stroke="{D}" stroke-width="3"><circle cx="50" cy="28" r="15"/><circle cx="71" cy="43" r="15"/><circle cx="63" cy="68" r="15"/><circle cx="37" cy="68" r="15"/><circle cx="29" cy="43" r="15"/></g><circle cx="50" cy="51" r="9" fill="{D}"/>',
      },
      {
        name: 'Palm Leaf',
        glyph: '♣',
        main: '#3ddc97',
        light: '#b5f5d9',
        dark: '#1fae70',
        art: '<path d="M50 14 C74 26 80 52 62 76 C56 84 44 84 38 76 C20 52 26 26 50 14 Z" fill="url(#J)" stroke="{D}" stroke-width="3"/><path d="M50 22 L50 80 M50 40 L36 32 M50 40 L64 32 M50 56 L34 48 M50 56 L66 48" stroke="{D}" stroke-width="3" stroke-linecap="round" fill="none" opacity=".55"/>',
      },
      {
        name: 'Dye Drop',
        glyph: '●',
        main: '#4cc9f0',
        light: '#bdeeff',
        dark: '#1f9fcb',
        art: '<path d="M50 12 C64 34 76 48 76 62 A26 26 0 0 1 24 62 C24 48 36 34 50 12 Z" fill="url(#J)" stroke="{D}" stroke-width="3"/>',
      },
      {
        name: 'Moon Shell',
        glyph: '☾',
        main: '#a66cff',
        light: '#dcc6ff',
        dark: '#7d42e0',
        art: '<path d="M58 14 A36 36 0 1 0 86 62 A28 28 0 1 1 58 14 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/>',
      },
    ],
    specials: {
      comb: {
        name: 'Rainbow Comb',
        text: 'Match 4 in a line to make a Rainbow Comb that sweeps a whole row or column.',
      },
      bomb: {
        name: 'Glitter Bomb',
        text: 'Match in an L or T shape to make a Glitter Bomb that sparkles away everything around it.',
      },
      rainbow: {
        name: 'Rainbow Dye',
        text: 'Line up 5 for a Rainbow Dye. Swap it with any jewel to clear every one of that color.',
      },
    },
    blockers: {
      gloom: {
        name: 'Grey Drizzle',
        text: 'Grey Drizzle soaks into the sand under jewels. Match on top of it to rinse it away; darker puddles need two rinses.',
        color: '#c9c4d8',
        color2: '#9c97ad',
      },
      tangle: {
        name: 'Seaweed Knot',
        text: 'Seaweed Knots wash up and block a space. Match right next to them, or hit them with a special, to untie them.',
        art: '<rect x="8" y="8" width="84" height="84" rx="22" fill="#9fd8c2"/><g fill="none" stroke="#3f8f74" stroke-width="7" stroke-linecap="round"><path d="M18 30 C40 70 60 10 82 52"/><path d="M18 58 C40 92 62 34 84 78"/><path d="M30 14 C34 40 22 62 30 88"/></g>',
      },
      buddy: {
        name: 'Hermit Crab Pal',
        text: 'Hermit Crab Pals want to reach the shore at the bottom. You can always swap one down a space, and specials scoot them straight home.',
        art: '<path d="M24 58 C24 30 76 30 76 58 Z" fill="#ff9fc7" stroke="#d93a7f" stroke-width="4"/><path d="M30 56 C40 44 60 44 70 56" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/><ellipse cx="50" cy="66" rx="30" ry="14" fill="#ffb38a" stroke="#e2781a" stroke-width="4"/><circle cx="40" cy="64" r="4" fill="#3b2b5c"/><circle cx="60" cy="64" r="4" fill="#3b2b5c"/><path d="M44 72 Q50 77 56 72" stroke="#3b2b5c" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M18 64 L8 54 M82 64 L92 54" stroke="#e2781a" stroke-width="5" stroke-linecap="round"/>',
      },
    },
    regions: [
      {
        id: 'salon',
        name: 'Sunrise Salon Street',
        blurb:
          'The Grey Drizzle rolled in overnight and rinsed every color off the block. Superkate unlocks the salon, rolls up her sleeves and mixes the first batch of hope.',
        sky: ['#ffe3f1', '#ffd7b5'],
        palette: ['#ff8fc7', '#ffd36e', '#ffb38a'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5"><circle cx="30" cy="70" r="12"/><circle cx="70" cy="70" r="12"/><path d="M38 61 L72 20 M62 61 L28 20"/></g>',
        beats: [
          {
            at: 1,
            title: 'Opening Day',
            text: 'Superkate flips the sign to OPEN. Outside, the whole street is grey. "Well," she says, snapping on her gloves, "nobody said hope was a small job."',
          },
          {
            at: 9,
            title: 'A Robot at the Door',
            text: 'A little kind robot rolls in, dripping grey. "Please," it beeps, "my sensors cannot find blue." Kate pats the styling chair. "Sit. I know exactly what you need."',
          },
          {
            at: 18,
            title: 'The Neighbors Return',
            text: 'One by one, neighbors peek out. The bakery is pink again and someone starts a playlist. Down by the water, the carnival lights blink once, hopefully.',
          },
        ],
      },
      {
        id: 'carnival',
        name: 'Coral Carnival',
        blurb:
          'A seaside carnival of carousels and kindness booths. The Ferris wheel is stuck on grey, and every match turns another light back on.',
        sky: ['#ffe1ec', '#d6fffb'],
        palette: ['#ff7aa8', '#4fe0d6', '#ffd56b'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round"><path d="M10 40 Q25 25 40 40 T70 40 T100 40"/><path d="M0 62 Q15 47 30 62 T60 62 T90 62"/></g>',
        beats: [
          {
            at: 1,
            title: 'Booths of Kindness',
            text: 'The Coral Carnival has no prize booths. Only kindness booths, where you win a compliment and give one back.',
          },
          {
            at: 9,
            title: 'Carousel Friends',
            text: 'The carousel horses are actually seahorses, and they are very excited to meet you.',
          },
          {
            at: 18,
            title: 'Up the Waterfall Stairs',
            text: 'Behind the Ferris wheel, a staircase of seashells climbs a cliff toward a waterfall that used to pour pure rainbow. Now it trickles grey.',
          },
        ],
      },
      {
        id: 'falls',
        name: 'Rainbow Falls',
        blurb:
          'The great waterfall at the top of the island once poured every color into the sea. Superkate climbs the cliff path with her brightest dye and the whole town behind her.',
        sky: ['#e8ddff', '#dffbff'],
        palette: ['#ff5fa2', '#4cc9f0', '#ffd93b'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"><path d="M20 14 C20 50 30 70 26 90"/><path d="M40 14 C40 50 50 70 46 90"/><path d="M60 14 C60 50 70 70 66 90"/><path d="M80 14 C80 50 86 70 84 90"/></g>',
        beats: [
          {
            at: 1,
            title: 'The Cliff Path',
            text: 'Halfway up the cliff, the whole town is cheering from below. Kate tucks a comb behind her ear and keeps climbing.',
          },
          {
            at: 10,
            title: 'Mist of Every Color',
            text: 'The spray from the falls starts catching the light again: a pink mist, then gold, then a tiny double rainbow.',
          },
          {
            at: 19,
            title: 'The Top of the Falls',
            text: 'At the very top, the spring is grey and still. Kate uncaps her brightest bottle of dye. This one is for everybody down there.',
          },
        ],
      },
    ],
    ending: {
      id: 'paradise',
      title: 'The Rainbow Returns',
      text: 'Kate pours the dye and Rainbow Falls roars back to life, spilling every color down the cliff, through the carnival and into the sea. The whole town dances on the boardwalk until the stars come out, and every single person goes home with brighter hair than they arrived with.',
    },
    map: {
      path: '#ffffff',
      dash: '#ffb8dc',
      node: 'heart',
    },
    quests: {
      daily: [
        {
          id: 'paradise-d-dye',
          text: 'Mix 2 Rainbow Dyes in the Paradise',
          stat: 'rainbows',
          target: 2,
          reward: 40,
        },
        {
          id: 'paradise-d-crabs',
          text: 'Walk 3 Hermit Crab Pals to the shore',
          stat: 'buddiesRescued',
          target: 3,
          reward: 40,
        },
        {
          id: 'paradise-d-hearts',
          text: 'Collect 50 Rose Hearts',
          stat: 'color0',
          target: 50,
          reward: 30,
        },
      ],
      weekly: [
        {
          id: 'paradise-w-drizzle',
          text: 'Rinse away 120 Grey Drizzle',
          stat: 'gloomCleared',
          target: 120,
          reward: 160,
        },
        {
          id: 'paradise-w-glitter',
          text: 'Make 12 Glitter Bombs',
          stat: 'bombs',
          target: 12,
          reward: 170,
        },
      ],
    },
    achievements: [
      {
        key: 'start',
        name: 'Open for Business',
        text: 'Win your first level in the Rainbow Paradise.',
      },
      {
        key: 'middle',
        name: 'Carnival Lights',
        text: 'Light up the whole Coral Carnival.',
      },
      {
        key: 'ending',
        name: 'The Rainbow Returns',
        text: 'Bring the color back to Rainbow Falls.',
      },
      {
        key: 'stars',
        name: 'Salon Star',
        text: 'Get 3 stars on 10 Paradise levels.',
      },
      {
        key: 'signature',
        name: 'Untangler of Tides',
        text: 'Untie 80 Seaweed Knots.',
        stat: 'tanglesCleared',
        target: 80,
      },
    ],
    prompts: {
      style:
        'lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
      hero: 'A character select portrait of a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt, holding up a glass bottle of swirling rainbow hair dye that spills ribbons of color, beaming with joy. Waist-up centered pose facing the viewer, tropical pastel rainbow background with hibiscus and sparkles, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
      key: 'A tropical seaside town bursting back into color under a giant rainbow, a cozy salon street, a carnival boardwalk with a Ferris wheel and a rainbow waterfall pouring from a cliff into a turquoise sea, a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt in the foreground raising a bottle of rainbow dye. Wide composition, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
      map: 'A wide top-down storybook map of a tropical island with a winding rainbow path running from a pastel salon street past a seaside carnival up a cliff to a rainbow waterfall, palm trees, hibiscus, gentle waves, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
      regions: {
        salon:
          'A pastel salon street at sunrise slowly turning from soft grey into color, a cozy hair salon with a striped awning and its door open, a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt snapping on pink gloves in the doorway, a small shy grey raincloud drifting above the rooftops, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
        carnival:
          'A seaside carnival on a boardwalk at golden hour, a carousel of smiling seahorses, kindness booths with heart garlands, a tall Ferris wheel with pastel cars against a turquoise sea, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
        falls:
          'A towering tropical cliff with a waterfall trickling soft grey, a seashell staircase climbing the cliff past hibiscus and palms, a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt climbing with a bottle of rainbow dye, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
      },
      beats: {
        'salon-9':
          'A small round white robot with a glossy black face screen and a pink heart on its chest rolling into a pastel hair salon dripping grey, while a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt smiles and pats a styling chair to welcome it, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
        'salon-18':
          'Neighbors of many ages and a few robots stepping out onto a salon street that has bloomed into color, a pink bakery and a lavender bookshop, people dancing, carnival lights glowing by the sea, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
        'carnival-9':
          'A carnival carousel where the riding animals are cheerful pastel seahorses, children and a robot riding and laughing under string lights, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
        'carnival-18':
          'A staircase of giant seashells climbing a tropical cliff behind a Ferris wheel toward a grey trickling waterfall, a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt looking up with determination, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
        'falls-10':
          'Waterfall spray catching sunlight in pink, gold and a tiny double rainbow, a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt laughing on a cliff ledge with mist in her rainbow hair, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
        'falls-19':
          'The still grey spring at the top of a tropical waterfall, a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt kneeling and uncapping a glowing bottle of rainbow dye while the whole town cheers far below, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
      },
      ending:
        'A rainbow waterfall roaring back to life and spilling every color down a tropical cliff into the sea, a whole seaside town dancing on a glowing carnival boardwalk under the stars, a cheerful adult hair stylist with a chin-length bob of vivid rainbow-dyed hair in stripes of red, orange, yellow, green, blue and violet, rosy cheeks, a black stylist apron over a white t-shirt celebrating in the center, lush tropical hopecore cutecore 2D hand-painted storybook game illustration, pastel rainbow palette, rounded friendly shapes, glowing light, unlettered surfaces',
    },
  })
})(typeof globalThis !== 'undefined' ? globalThis : this)
