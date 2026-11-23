;(function (root) {
  'use strict'
  root.HopefulHuesWorlds.register({
    id: 'dustneon',
    order: 8,
    name: 'Dust and Neon',
    tagline:
      'A desert art festival where everyone is welcome and every match is a gift.',
    blurb:
      'A whiteout dust storm blew out the lights of the desert festival city just before the big night. Rio and Shellby, a slow, glowing sea-turtle art car built from bike parts and gifted lights, roll from the sunny playa to the neon night parade to the Temple of Wishes, relighting everything with a little help from everybody.',
    hero: {
      id: 'rio',
      name: 'Rio Quintana',
      title: 'Art-Car Builder',
      pronouns: 'they/them',
      perk: 'score-boost',
      perkName: 'Showstopper Glow',
      perkText:
        'Every match earns 25% more points, because Shellby makes everything shine brighter.',
      cheer: [
        'Radiant!',
        'Gift given, gift glowing!',
        'Shine on, friend!',
        'Look at that glow!',
        'Everybody aboard!',
      ],
      epilogue:
        'Rio parks Shellby at the edge of camp with the lights left on, so anyone who feels a little lost can find their way to a free ride and a friendly wave.',
      look: 'a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace',
      portrait:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><radialGradient id="rioBg" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#6a3488"/><stop offset="1" stop-color="#2a1846"/></radialGradient><linearGradient id="rioLens" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#e6fdff"/><stop offset="1" stop-color="#2fe6ff"/></linearGradient><clipPath id="rioClip"><circle cx="60" cy="60" r="58"/></clipPath></defs><circle cx="60" cy="60" r="58" fill="url(#rioBg)"/><g clip-path="url(#rioClip)"><path d="M18 26 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#ffc94d"/><circle cx="102" cy="74" r="6" fill="none" stroke="#ff4fb8" stroke-width="2.5"/><circle cx="16" cy="78" r="4" fill="none" stroke="#3ff0ff" stroke-width="2"/><circle cx="100" cy="22" r="2.5" fill="#3ff0ff"/><path d="M18 120 C20 98 36 90 60 90 C84 90 100 98 102 120 Z" fill="#ff7a59"/><circle cx="34" cy="108" r="5" fill="#ffc94d"/><rect x="80" y="103" width="11" height="10" rx="2" fill="#9b5cff"/><rect x="52" y="78" width="16" height="14" fill="#a86b48"/><g fill="#3b2230"><circle cx="40" cy="46" r="14"/><circle cx="52" cy="35" r="15"/><circle cx="68" cy="35" r="15"/><circle cx="80" cy="46" r="14"/><circle cx="37" cy="60" r="10"/><circle cx="83" cy="60" r="10"/></g><rect x="86" y="26" width="6" height="22" rx="3" fill="#6ef542" transform="rotate(25 89 37)"/><circle cx="36" cy="66" r="5" fill="#a86b48"/><circle cx="84" cy="66" r="5" fill="#a86b48"/><ellipse cx="60" cy="63" rx="24" ry="26" fill="#b87a56"/><path d="M36 52 C38 36 82 36 84 52 C76 44 44 44 36 52 Z" fill="#3b2230"/><path d="M52 25 C60 21 72 24 78 34" stroke="#ff4fb8" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M33 47 Q60 40 87 47" stroke="#2a1846" stroke-width="5" fill="none"/><circle cx="49" cy="46" r="9" fill="url(#rioLens)" stroke="#ff7a59" stroke-width="3.5"/><circle cx="71" cy="46" r="9" fill="url(#rioLens)" stroke="#ff7a59" stroke-width="3.5"/><path d="M58 46 H62" stroke="#ff7a59" stroke-width="3"/><circle cx="46" cy="43" r="2.2" fill="#fff"/><circle cx="68" cy="43" r="2.2" fill="#fff"/><circle cx="51" cy="66" r="3.6" fill="#24142e"/><circle cx="69" cy="66" r="3.6" fill="#24142e"/><circle cx="52.2" cy="64.6" r="1.2" fill="#fff"/><circle cx="70.2" cy="64.6" r="1.2" fill="#fff"/><circle cx="43" cy="74" r="5" fill="#ff8fa8" opacity=".55"/><circle cx="77" cy="74" r="5" fill="#ff8fa8" opacity=".55"/><path d="M51 77 Q60 84 69 77" stroke="#6a2440" stroke-width="3.5" fill="none" stroke-linecap="round"/><path d="M84 70 l1.6 3.4 3.4 1.6 -3.4 1.6 -1.6 3.4 -1.6 -3.4 -3.4 -1.6 3.4 -1.6z" fill="#ff4fb8"/><path d="M40 100 Q60 114 80 100" stroke="#3ff0ff" stroke-width="8" opacity=".3" fill="none"/><path d="M40 100 Q60 114 80 100" stroke="#bff8ff" stroke-width="2.5" fill="none"/><path d="M60 108 C56 103 52 107 56 110 L60 114 L64 110 C68 107 64 103 60 108 Z" fill="#ff4fb8"/><path d="M34 88 C44 81 76 81 86 88 C84 99 36 99 34 88 Z" fill="#f2a7b8" stroke="#c96a86" stroke-width="2"/><path d="M72 93 C76 101 78 107 75 114 C82 112 87 105 86 96 Z" fill="#f2a7b8" stroke="#c96a86" stroke-width="2" stroke-linejoin="round"/><g fill="#fff4ea" opacity=".85"><circle cx="44" cy="90" r="1.6"/><circle cx="54" cy="92" r="1.6"/><circle cx="66" cy="92" r="1.6"/><circle cx="76" cy="90" r="1.6"/></g></g></svg>',
    },
    ui: {
      dark: true,
      bg: ['#24143f', '#4a2358', '#8a4560'],
      ink: '#fff4ea',
      inkSoft: '#f6cfdc',
      card: 'rgba(30,16,48,.84)',
      accent: '#ff4fb8',
      accent2: '#3ff0ff',
      cell: 'rgba(255,236,250,.13)',
    },
    music: {
      root: 57,
      mode: 'dorian',
      tempo: 108,
      timbre: 'synth',
      meter: 4,
    },
    effects: {
      glyphs: ['◎', '○', '☁', '✦'],
      colors: ['#3ff0ff', '#ff4fb8', '#f2dcc2', '#9b5cff', '#ffc94d'],
      label: 'dust puffs and neon rings',
    },
    jewels: [
      {
        name: 'Neon Heart',
        glyph: '♥',
        main: '#ff3fb4',
        light: '#ffb8e2',
        dark: '#c4128a',
        art: '<path d="M50 84 C20 64 10 46 18 31 C26 16 44 18 50 32 C56 18 74 16 82 31 C90 46 80 64 50 84 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M50 70 C31 57 25 46 29 37 C34 29 44 31 50 41 C56 31 66 29 71 37 C75 46 69 57 50 70 Z" fill="none" stroke="#fff" stroke-width="3.5" opacity=".8"/>',
      },
      {
        name: 'Glow Stick',
        glyph: '/',
        main: '#6ef542',
        light: '#d8ffc2',
        dark: '#2c9e12',
        art: '<g transform="rotate(-40 50 50)"><rect x="37" y="12" width="26" height="76" rx="13" fill="url(#J)" stroke="{D}" stroke-width="3"/><rect x="35" y="10" width="30" height="13" rx="5" fill="{D}"/><circle cx="50" cy="6" r="4" fill="none" stroke="{D}" stroke-width="3"/><rect x="45" y="30" width="9" height="48" rx="4.5" fill="#fff" opacity=".5"/></g>',
      },
      {
        name: 'Disco Sun',
        glyph: '☀',
        main: '#ffc94d',
        light: '#fff1bd',
        dark: '#d0920e',
        art: '<path d="M50 6 V18 M50 82 V94 M6 50 H18 M82 50 H94 M19 19 L27 27 M81 19 L73 27 M19 81 L27 73 M81 81 L73 73" stroke="{D}" stroke-width="5" stroke-linecap="round"/><circle cx="50" cy="50" r="29" fill="url(#J)" stroke="{D}" stroke-width="3"/><g fill="none" stroke="{D}" stroke-width="2" opacity=".55"><path d="M21 50 H79 M25 36 H75 M25 64 H75 M50 21 V79"/><ellipse cx="50" cy="50" rx="14" ry="29"/></g>',
      },
      {
        name: 'Bicycle Wheel',
        glyph: '◎',
        main: '#2fe6ff',
        light: '#c6faff',
        dark: '#0a93b8',
        art: '<circle cx="50" cy="50" r="27" fill="{L}" opacity=".45"/><path d="M50 24 V76 M24 50 H76 M32 32 L68 68 M68 32 L32 68" stroke="{D}" stroke-width="2.5"/><circle cx="50" cy="50" r="34" fill="none" stroke="{D}" stroke-width="17"/><circle cx="50" cy="50" r="34" fill="none" stroke="url(#J)" stroke-width="11"/><circle cx="50" cy="50" r="8" fill="{M}" stroke="{D}" stroke-width="3"/>',
      },
      {
        name: 'Cactus Flower',
        glyph: '✿',
        main: '#ff7a59',
        light: '#ffd0bf',
        dark: '#d4441f',
        art: '<g fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"><path d="M50 50 C36 36 38 18 50 9 C62 18 64 36 50 50 Z"/><path d="M50 50 C36 36 38 18 50 9 C62 18 64 36 50 50 Z" transform="rotate(60 50 50)"/><path d="M50 50 C36 36 38 18 50 9 C62 18 64 36 50 50 Z" transform="rotate(120 50 50)"/><path d="M50 50 C36 36 38 18 50 9 C62 18 64 36 50 50 Z" transform="rotate(180 50 50)"/><path d="M50 50 C36 36 38 18 50 9 C62 18 64 36 50 50 Z" transform="rotate(240 50 50)"/><path d="M50 50 C36 36 38 18 50 9 C62 18 64 36 50 50 Z" transform="rotate(300 50 50)"/></g><circle cx="50" cy="50" r="11" fill="#ffe066" stroke="{D}" stroke-width="3"/>',
      },
      {
        name: 'Gift Box',
        glyph: '■',
        main: '#9b5cff',
        light: '#ddc8ff',
        dark: '#6428d0',
        art: '<rect x="17" y="40" width="66" height="46" rx="6" fill="url(#J)" stroke="{D}" stroke-width="3"/><rect x="12" y="30" width="76" height="16" rx="5" fill="url(#J)" stroke="{D}" stroke-width="3"/><rect x="44" y="30" width="12" height="56" fill="#ffd0f0" stroke="{D}" stroke-width="2"/><path d="M50 30 C40 12 22 14 30 25 C34 30 44 30 50 30 C56 30 66 30 70 25 C78 14 60 12 50 30 Z" fill="#ffd0f0" stroke="{D}" stroke-width="3" stroke-linejoin="round"/>',
      },
    ],
    specials: {
      comb: {
        name: 'Laser Fan',
        text: 'Match 4 in a line to make a Laser Fan that beams light across a whole row or column.',
      },
      bomb: {
        name: 'Glow Burst',
        text: 'Match in an L or T shape to make a Glow Burst that pops everything around it in a ring of light.',
      },
      rainbow: {
        name: 'Prism Lantern',
        text: 'Line up 5 for a Prism Lantern. Swap it with any jewel to light up and clear every one of that color.',
      },
    },
    blockers: {
      gloom: {
        name: 'Whiteout Dust',
        text: 'Whiteout Dust settles over tiles after the storm. Match on top of it to brush it off; thick drifts need two brushings.',
        color: '#efe2d0',
        color2: '#c2a98e',
      },
      tangle: {
        name: 'Light-Strand Snarl',
        text: 'The wind snarled these light strands into a knot that blocks a space. Match right next to a Snarl, or zap it with a special, to untangle it.',
        art: '<rect x="8" y="8" width="84" height="84" rx="20" fill="#2c1b4d" stroke="#6b4fa8" stroke-width="3"/><g fill="none" stroke-width="5" stroke-linecap="round"><path d="M16 30 C40 74 60 8 84 50" stroke="#3ff0ff"/><path d="M16 66 C38 20 62 92 84 30" stroke="#ff4fb8"/><path d="M28 16 C64 36 18 62 70 86" stroke="#ffc94d"/></g><g stroke="#fff" stroke-width="1.5"><circle cx="26" cy="46" r="4.5" fill="#3ff0ff"/><circle cx="72" cy="40" r="4.5" fill="#3ff0ff"/><circle cx="44" cy="58" r="4.5" fill="#ff4fb8"/><circle cx="74" cy="56" r="4.5" fill="#ff4fb8"/><circle cx="46" cy="30" r="4.5" fill="#ffc94d"/><circle cx="56" cy="76" r="4.5" fill="#ffc94d"/></g>',
      },
      buddy: {
        name: 'Lost Glow-Jackalope',
        text: 'Little Glow-Jackalopes are hopping home to their camp at the bottom. You can always swap one down a space, and specials bounce them straight home.',
        art: '<circle cx="50" cy="56" r="42" fill="#3ff0ff" opacity=".18"/><path d="M45 38 L40 16 M42 26 L32 20 M55 38 L60 16 M58 26 L68 20" stroke="#ffc94d" stroke-width="4.5" stroke-linecap="round" fill="none"/><ellipse cx="30" cy="38" rx="7" ry="16" fill="#e6d4ff" stroke="#8a5cd6" stroke-width="3.5" transform="rotate(-35 30 38)"/><ellipse cx="70" cy="38" rx="7" ry="16" fill="#e6d4ff" stroke="#8a5cd6" stroke-width="3.5" transform="rotate(35 70 38)"/><ellipse cx="50" cy="62" rx="28" ry="24" fill="#e6d4ff" stroke="#8a5cd6" stroke-width="4"/><ellipse cx="36" cy="86" rx="9" ry="5" fill="#e6d4ff" stroke="#8a5cd6" stroke-width="3"/><ellipse cx="64" cy="86" rx="9" ry="5" fill="#e6d4ff" stroke="#8a5cd6" stroke-width="3"/><circle cx="41" cy="58" r="4" fill="#2a1846"/><circle cx="59" cy="58" r="4" fill="#2a1846"/><circle cx="42.3" cy="56.6" r="1.3" fill="#fff"/><circle cx="60.3" cy="56.6" r="1.3" fill="#fff"/><path d="M47 65 L53 65 L50 68 Z" fill="#ff4fb8"/><path d="M45 70 Q50 74 55 70" stroke="#2a1846" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="34" cy="67" r="4" fill="#ff9fd0" opacity=".8"/><circle cx="66" cy="67" r="4" fill="#ff9fd0" opacity=".8"/>',
      },
    },
    regions: [
      {
        id: 'dsnplaya',
        name: 'Sunbleached Playa City',
        blurb:
          'A pop-up city of shade domes, bikes and gifting camps rises from the pale pink desert. A whiteout dust storm just dimmed every light in town, and Rio is gathering gifts to rewire them before sundown.',
        sky: ['#ffe0d2', '#f0c99c'],
        palette: ['#e88aa0', '#d9a36a', '#ff7a59'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><circle cx="26" cy="68" r="16"/><circle cx="74" cy="68" r="16"/><path d="M26 68 L42 40 L66 40 L74 68 M42 40 L52 68 L66 40 M38 32 H48 M62 40 L60 30 H70"/></g>',
        beats: [
          {
            at: 1,
            title: 'Everyone Belongs Here',
            text: 'At the edge of the playa, a greeter in a glittery cape gives Rio a big hug. "First time or hundredth time, you belong here." Rio pulls up their goggles and pedals to camp, where Shellby the art car sits dark and dusty after the storm.',
          },
          {
            at: 9,
            title: 'A Lost Little Glow',
            text: 'Behind a shade dome, Rio finds a tiny jackalope glowing like a night-light, ears drooping. It hopped away in the storm and lost its camp. "We will get you home, Tumble," Rio promises. "Everybody here helps everybody."',
          },
          {
            at: 18,
            title: 'Gifts for Shellby',
            text: "By sunset the whole city has shown up with gifts: a string of lights, a spare bike chain, a jar of glitter, a hug. Rio twists the last wire, and Shellby's patchwork shell flickers awake in cyan and pink.",
          },
        ],
      },
      {
        id: 'dsnneon',
        name: 'Neon Art-Car Night',
        blurb:
          'When the sun goes down, the desert becomes a sea of moving lights. Art cars shaped like dragons, teacups and jellyfish roll out to play, but the wind has snarled the light strands all across the parade route.',
        sky: ['#2b1a55', '#a2337e'],
        palette: ['#3ff0ff', '#ff4fb8', '#9b5cff'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M14 66 C16 34 84 34 86 66 Z"/><path d="M30 46 L40 62 L50 44 L60 62 L70 46"/><path d="M86 58 C92 52 96 56 94 62"/><circle cx="28" cy="76" r="9"/><circle cx="72" cy="76" r="9"/></g><g fill="currentColor"><circle cx="50" cy="16" r="4"/><circle cx="30" cy="22" r="3"/><circle cx="70" cy="22" r="3"/></g>',
        beats: [
          {
            at: 1,
            title: 'Shellby Rolls Out',
            text: 'Shellby lumbers onto the open playa at a perfectly turtle-ish speed, glowing like a lagoon. Strangers wave glow sticks, and Tumble rides on top with both ears up.',
          },
          {
            at: 9,
            title: 'A Dance Party for Everyone',
            text: 'A teacup art car pulls up beside them, then a jellyfish, then a dragon puffing bubbles. Kids, grandparents and robots dance in the glowing dust together. Out here, everybody gets to sparkle exactly as they are.',
          },
          {
            at: 18,
            title: 'A Shape on the Horizon',
            text: 'Far out on the deep playa stands the Temple of Wishes, tall and wooden and dark. Its great lantern went out in the storm, and a whole city of wishes is still waiting to be hung.',
          },
        ],
      },
      {
        id: 'dsntemple',
        name: 'The Temple of Wishes',
        blurb:
          'A tall wooden temple carved with spirals rises from the deep desert, where anyone can tie a ribbon wish to its beams. Rio drives Shellby out with a parade of friends and a basket of wishes from every camp.',
        sky: ['#3a2466', '#ffb38a'],
        palette: ['#ffc94d', '#ff7a59', '#f2a7b8'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><path d="M50 10 L70 30 H30 Z"/><path d="M22 52 L34 30 H66 L78 52 Z"/><path d="M16 88 L28 52 H72 L84 88 Z"/><path d="M44 88 V70 Q50 62 56 70 V88"/></g><g stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M34 54 C32 60 36 64 33 70 M66 54 C68 60 64 64 67 70"/></g>',
        beats: [
          {
            at: 1,
            title: 'The Long Ride Out',
            text: "The parade stretches behind Shellby like a glowing comet tail. Tumble bounces on Rio's shoulder, sniffing the cool desert air for any hint of home.",
          },
          {
            at: 10,
            title: 'Ribbons on the Wind',
            text: 'Inside the temple, thousands of ribbon wishes flutter: to be brave, to be seen, to come back next year with a friend. Rio ties one for a kid back home who will be here next time.',
          },
          {
            at: 19,
            title: 'One Last Wish',
            text: "At the very center hangs the great lantern, dusty and dark. Rio tucks their own wish into its heart: that everyone, everywhere, finds a place where they are welcome. Then they flip Shellby's brightest switch.",
          },
        ],
      },
    ],
    ending: {
      id: 'dustneon',
      title: 'Everyone Aboard',
      text: 'The great lantern blooms with light, and every ribbon in the temple glows like a tiny neon rainbow. As sunrise paints the dust pink, the whole festival climbs aboard Shellby for the slow ride back, and Tumble hops into a camp full of glowing jackalopes waiting with open arms. Nobody is left behind, and everybody is home.',
    },
    map: {
      path: '#ffe3c9',
      dash: '#3ff0ff',
      node: 'hex',
    },
    quests: {
      daily: [
        {
          id: 'dustneon-d-gifts',
          text: 'Unwrap 50 Gift Boxes in Dust and Neon',
          stat: 'color5',
          target: 50,
          reward: 30,
        },
        {
          id: 'dustneon-d-jackalopes',
          text: 'Hop 3 Glow-Jackalopes back to camp',
          stat: 'buddiesRescued',
          target: 3,
          reward: 40,
        },
        {
          id: 'dustneon-d-lasers',
          text: 'Fire up 4 Laser Fans',
          stat: 'combs',
          target: 4,
          reward: 35,
        },
      ],
      weekly: [
        {
          id: 'dustneon-w-dust',
          text: 'Brush away 120 Whiteout Dust',
          stat: 'gloomCleared',
          target: 120,
          reward: 160,
        },
        {
          id: 'dustneon-w-lanterns',
          text: 'Light 6 Prism Lanterns',
          stat: 'rainbows',
          target: 6,
          reward: 175,
        },
      ],
    },
    achievements: [
      {
        key: 'start',
        name: 'First Gift Given',
        text: 'Win your first level in Dust and Neon.',
      },
      {
        key: 'middle',
        name: 'Night Parade',
        text: 'Light up the whole Neon Art-Car Night.',
      },
      {
        key: 'ending',
        name: 'Everyone Aboard',
        text: 'Relight the great lantern at the Temple of Wishes.',
      },
      {
        key: 'stars',
        name: 'Brightest Art Car',
        text: 'Get 3 stars on 10 Dust and Neon levels.',
      },
      {
        key: 'signature',
        name: 'Every Jackalope Home',
        text: 'Hop 40 Glow-Jackalopes back to camp.',
        stat: 'buddiesRescued',
        target: 40,
      },
    ],
    prompts: {
      style:
        'dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
      hero: 'A character select portrait of a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace, holding up a wrench wrapped in glowing string lights and grinning with joy. Waist-up centered pose facing the viewer, dusky pink desert sky background with floating neon rings and drifting sparkles, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
      key: 'A dreamy desert art festival stretching across a pale pink playa at dusk, shade domes and decorated bicycles on the sunny side fading into glowing neon art cars and giant light sculptures under a violet starry sky, a tall wooden temple glowing on the horizon, a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace in the foreground riding atop a giant friendly sea-turtle art car with a patchwork shell of cyan and pink lights on bicycle wheels, a tiny round lavender jackalope with small golden antlers glowing softly beside them. Wide composition, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
      map: 'A wide top-down storybook map of a desert art festival with a winding glowing path running from a pastel camp city of shade domes and bicycles across a neon art-car playa to a tall wooden temple, soft dust swirls, string lights, blooming cacti, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
      regions: {
        dsnplaya:
          'A sunbleached pastel desert camp city by day, shade domes draped in rainbow fabric, rows of decorated bicycles, gifting tables piled with wrapped presents, a soft pale dust cloud drifting away on the wind, a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace waving beside a dusty sea-turtle art car under a striped tarp, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
        dsnneon:
          'A desert playa at night glowing with neon art cars shaped like a dragon, a teacup and a jellyfish, giant glowing light sculptures of flowers and hearts, string lights and glow sticks everywhere, happy crowds on bicycles, a violet starry sky, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
        dsntemple:
          'A tall wooden temple carved with spirals standing on the deep desert under a starry violet sky, thousands of colorful ribbons fluttering from its beams, a long glowing parade of art cars approaching across the sand, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
      },
      beats: {
        'dsnplaya-9':
          'Behind a shade dome on a pastel desert afternoon, a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace kneeling to greet a tiny round lavender jackalope with small golden antlers glowing softly like a night-light, bicycles and gentle dust in the background, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
        'dsnplaya-18':
          'Festival friends of many ages bringing gifts at sunset, string lights, a bike chain, a jar of glitter, a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace twisting the last wire as a giant friendly sea-turtle art car with a patchwork shell of cyan and pink lights flickers awake, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
        'dsnneon-9':
          'A joyful dance party on the night desert, kids, grandparents and friendly robots dancing in glowing dust beside a teacup art car, a jellyfish art car and a dragon art car puffing bubbles, floating neon rings in the air, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
        'dsnneon-18':
          'A dark wooden temple on the far horizon of a night desert, a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace standing atop a giant friendly sea-turtle art car glowing cyan and pink and pointing toward the temple, a tiny round lavender jackalope with glowing golden antlers perched on their shoulder, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
        'dsntemple-10':
          'Inside a tall wooden temple, thousands of colorful ribbon wishes fluttering in a warm breeze, small lanterns glowing softly, a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace tying a pink ribbon to a carved beam, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
        'dsntemple-19':
          'The center of a wooden temple at night with a great dusty lantern hanging above, a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace reaching up to place a glowing ribbon wish into its heart while friends holding glow sticks watch hopefully, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
      },
      ending:
        'A great lantern blooming with rainbow light at the heart of a wooden temple at sunrise, every ribbon glowing like a tiny neon rainbow, a pink desert dawn, a whole festival crowd riding a giant friendly sea-turtle art car with a patchwork shell of cyan and pink lights, a cheerful adult art-car builder with warm brown skin, a short cloud of dark curly hair with one magenta streak, round cyan goggles pushed up on the forehead, a dusty rose scarf around the neck, a coral work vest covered in sewn-on patches and a glowing cyan light-wire necklace celebrating in the center as a tiny lavender jackalope hops into a camp of glowing jackalope friends, dreamy desert art festival hopecore cutecore 2D hand-painted storybook game illustration, dusty pastel and glowing neon palette of dusty rose, sand, sunset coral, neon cyan, magenta and ultraviolet violet, rounded friendly shapes, soft glow, unlettered surfaces',
    },
  })
})(typeof globalThis !== 'undefined' ? globalThis : this)
