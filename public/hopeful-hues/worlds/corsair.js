;(function (root) {
  'use strict'
  var LOOK =
    'a glamorous confident adult woman space pirate captain with warm brown skin, a big voluminous flipped-out bouffant of glossy tangerine-orange hair under a clear bubble space helmet, a hot pink mod headband with a little silver star, big fluttery eyelashes, sparkly gold star earrings, a playful modest long-sleeve hot pink sequined jumpsuit with a high chrome-silver collar, and white go-go boots'
  var STYLE =
    'groovy 1960s space-age retro-futurist hopecore cutecore 2D hand-painted storybook game illustration, hot pink, tangerine, chrome silver, electric teal and deep space purple palette, glossy rounded friendly shapes, glowing lava-lamp light, unlettered surfaces'
  var COUNT =
    'a lanky goofy alien count with pale lavender skin, a long swirly silver moustache and a dramatic high-collared beige cape'
  var KITTEN =
    'a tiny fluffy lavender moon kitten wearing a little clear bubble helmet'
  var BOT = 'a boxy beige robot wearing a cozy knitted cardigan'
  root.HopefulHuesWorlds.register({
    id: 'corsair',
    order: 4,
    name: 'Starlet Corsair',
    tagline:
      'A glitzy space-age caper where every match plunders back the groove.',
    blurb:
      "Count Monotone's Snooze Ray is fuzzing the whole galaxy with Static Fog, and the lounge music has gone flat. Captain Juno Jubilee fluffs her bouffant, fires up the Velvet Comet and sets sail from her shag-carpet starship to a disco moon to the most ridiculous space station ever built.",
    hero: {
      id: 'jubilee',
      name: 'Captain Juno Jubilee',
      title: 'Starlet Space Corsair',
      pronouns: 'she/her',
      perk: 'bomb-start',
      perkName: 'Grand Entrance',
      perkText:
        'Starts every level with one Sequin Blast already on the board.',
      cheer: [
        'Far out!',
        'Shimmer and shine, crew!',
        'Now THAT is a grand entrance!',
        'Out of this world, darling!',
        'Fabulous teamwork!',
      ],
      epilogue:
        "Juno hangs a brand new disco ball in the Velvet Comet's lounge, and every Friday night the hatch is open to anyone in the galaxy who wants to dance.",
      look: LOOK,
      portrait:
        '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="junoHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffb25c"/><stop offset="1" stop-color="#e2640e"/></linearGradient></defs><circle cx="60" cy="60" r="58" fill="#2a1050"/><g fill="#ffe6f6"><circle cx="18" cy="40" r="1.6"/><circle cx="104" cy="34" r="1.8"/><circle cx="96" cy="100" r="1.4"/><circle cx="22" cy="92" r="1.4"/></g><path d="M24 120 C24 100 40 92 60 92 C80 92 96 100 96 120 Z" fill="#ff4fb8"/><g fill="#ffc4e8"><circle cx="38" cy="108" r="1.8"/><circle cx="48" cy="114" r="1.8"/><circle cx="72" cy="114" r="1.8"/><circle cx="84" cy="106" r="1.8"/></g><path d="M24 78 C14 44 34 16 60 16 C86 16 106 44 96 78 C100 88 92 94 86 86 L34 86 C28 94 20 88 24 78 Z" fill="url(#junoHair)"/><rect x="52" y="82" width="16" height="14" fill="#a86c44"/><path d="M42 92 L60 100 L78 92 L82 102 L60 110 L38 102 Z" fill="#dfe4ee" stroke="#8b95aa" stroke-width="2"/><ellipse cx="60" cy="64" rx="23" ry="26" fill="#b8784e"/><path d="M36 54 C38 32 82 32 84 54 C72 44 48 44 36 54 Z" fill="url(#junoHair)"/><path d="M36 46 C46 34 74 34 84 46" stroke="#ff4fb8" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M60 31 l2.4 4.8 5.2 .8 -3.8 3.6 .9 5.2 -4.7 -2.5 -4.7 2.5 .9 -5.2 -3.8 -3.6 5.2 -.8z" fill="#e6e9f2"/><circle cx="50" cy="63" r="4.2" fill="#2a1050"/><circle cx="70" cy="63" r="4.2" fill="#2a1050"/><circle cx="51.2" cy="61.6" r="1.4" fill="#fff"/><circle cx="71.2" cy="61.6" r="1.4" fill="#fff"/><path d="M46.4 61 l-3 -1.8 M47.4 59.4 l-2 -2.6 M73.6 61 l3 -1.8 M72.6 59.4 l2 -2.6" stroke="#2a1050" stroke-width="1.8" stroke-linecap="round"/><circle cx="43" cy="72" r="4.5" fill="#ff7ac4" opacity=".6"/><circle cx="77" cy="72" r="4.5" fill="#ff7ac4" opacity=".6"/><path d="M50 74 Q60 86 70 74 Z" fill="#fff" stroke="#9b1f62" stroke-width="3" stroke-linejoin="round"/><path d="M37 72 l2.2 4.8 4.8 2.2 -4.8 2.2 -2.2 4.8 -2.2 -4.8 -4.8 -2.2 4.8 -2.2z" fill="#ffd23f"/><path d="M83 72 l2.2 4.8 4.8 2.2 -4.8 2.2 -2.2 4.8 -2.2 -4.8 -4.8 -2.2 4.8 -2.2z" fill="#ffd23f"/><circle cx="60" cy="56" r="45" fill="#bdf4ff" fill-opacity=".12" stroke="#e6f6ff" stroke-width="3"/><path d="M26 42 A38 38 0 0 1 48 18" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".75"/></svg>',
    },
    ui: {
      dark: true,
      bg: ['#170a36', '#341058', '#561456'],
      ink: '#fff4fb',
      inkSoft: '#dccbf5',
      card: 'rgba(34,14,64,.88)',
      accent: '#ff4fb8',
      accent2: '#2ee6d6',
      cell: 'rgba(255,255,255,.1)',
    },
    music: {
      root: 53,
      mode: 'dorian',
      tempo: 112,
      timbre: 'lounge',
      meter: 4,
    },
    effects: {
      glyphs: ['✦', '★', '✧', '◆', '✶'],
      colors: ['#ff4fb8', '#ff8a2a', '#e6e9f2', '#2ee6d6', '#a463ff'],
      label: 'sequins and stars',
    },
    jewels: [
      {
        name: 'Ray-Gun Burst',
        glyph: '✸',
        main: '#ff4fb8',
        light: '#ffc4e8',
        dark: '#c91f86',
        art: '<path d="M50 10 L56 29 L70 15 L66 34 L85 30 L71 44 L90 50 L71 56 L85 70 L66 66 L70 85 L56 71 L50 90 L44 71 L30 85 L34 66 L15 70 L29 56 L10 50 L29 44 L15 30 L34 34 L30 15 L44 29 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="50" r="10" fill="{L}" stroke="{D}" stroke-width="2.5"/>',
      },
      {
        name: 'Retro Rocket',
        glyph: '▲',
        main: '#ff8a2a',
        light: '#ffd1a6',
        dark: '#d45f00',
        art: '<path d="M36 50 L18 78 L36 72 Z M64 50 L82 78 L64 72 Z" fill="{D}" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M44 72 L50 90 L56 72 Z" fill="#ffd23f"/><path d="M50 10 C66 24 70 46 65 72 L35 72 C30 46 34 24 50 10 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="40" r="8" fill="{L}" stroke="{D}" stroke-width="3"/>',
      },
      {
        name: 'Sequin Star',
        glyph: '★',
        main: '#c9d1e0',
        light: '#f4f7fc',
        dark: '#7d889e',
        art: '<path d="M50 12 L60 38 L88 40 L66 57 L74 84 L50 69 L26 84 L34 57 L12 40 L40 38 Z" fill="url(#J)" stroke="{D}" stroke-width="3.5" stroke-linejoin="round"/><g fill="{L}" stroke="{D}" stroke-width="1.5"><circle cx="50" cy="34" r="4"/><circle cx="40" cy="50" r="4"/><circle cx="60" cy="50" r="4"/><circle cx="50" cy="62" r="4"/></g>',
      },
      {
        name: 'Ringed Planet',
        glyph: '◉',
        main: '#20d9c8',
        light: '#b0fff6',
        dark: '#0f9a8e',
        art: '<g transform="rotate(-20 50 50)"><ellipse cx="50" cy="50" rx="42" ry="12" fill="none" stroke="{D}" stroke-width="8"/><ellipse cx="50" cy="50" rx="42" ry="12" fill="none" stroke="{L}" stroke-width="3.5"/></g><circle cx="50" cy="50" r="25" fill="url(#J)" stroke="{D}" stroke-width="3"/><g transform="rotate(-20 50 50)" fill="none"><path d="M8 50 A42 12 0 0 0 92 50" stroke="{D}" stroke-width="8"/><path d="M8 50 A42 12 0 0 0 92 50" stroke="{L}" stroke-width="3.5"/></g>',
      },
      {
        name: 'Lava Lamp',
        glyph: '◆',
        main: '#a463ff',
        light: '#e0c9ff',
        dark: '#6c2ed6',
        art: '<path d="M40 10 L60 10 L62 20 L38 20 Z" fill="{D}" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M38 20 L62 20 L73 64 L27 64 Z" fill="url(#J)" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><path d="M27 64 L73 64 L62 77 L71 90 L29 90 L38 77 Z" fill="{D}" stroke="{D}" stroke-width="3" stroke-linejoin="round"/><g fill="{L}"><circle cx="49" cy="32" r="5"/><ellipse cx="56" cy="47" rx="8" ry="6"/><circle cx="41" cy="55" r="4.5"/></g>',
      },
      {
        name: 'Groovy Daisy',
        glyph: '✿',
        main: '#8ee04a',
        light: '#d4fbb0',
        dark: '#56a81e',
        art: '<g fill="url(#J)" stroke="{D}" stroke-width="3"><ellipse cx="50" cy="26" rx="10" ry="16"/><ellipse cx="50" cy="26" rx="10" ry="16" transform="rotate(45 50 50)"/><ellipse cx="50" cy="26" rx="10" ry="16" transform="rotate(90 50 50)"/><ellipse cx="50" cy="26" rx="10" ry="16" transform="rotate(135 50 50)"/><ellipse cx="50" cy="26" rx="10" ry="16" transform="rotate(180 50 50)"/><ellipse cx="50" cy="26" rx="10" ry="16" transform="rotate(225 50 50)"/><ellipse cx="50" cy="26" rx="10" ry="16" transform="rotate(270 50 50)"/><ellipse cx="50" cy="26" rx="10" ry="16" transform="rotate(315 50 50)"/></g><circle cx="50" cy="50" r="13" fill="#ffd23f" stroke="{D}" stroke-width="3"/>',
      },
    ],
    specials: {
      comb: {
        name: 'Ray-Gun Zap',
        text: 'Match 4 in a line to charge a Ray-Gun Zap that blasts a whole row or column clean.',
      },
      bomb: {
        name: 'Sequin Blast',
        text: 'Match in an L or T shape to make a Sequin Blast that showers everything around it in sparkle.',
      },
      rainbow: {
        name: 'Disco Ball',
        text: 'Line up 5 for a Disco Ball. Swap it with any jewel to clear every one of that color.',
      },
    },
    blockers: {
      gloom: {
        name: 'Static Fog',
        text: 'Static Fog fuzzes up the floor under jewels. Match on top of it to tune it out; thick static needs two tunings.',
        color: '#9d93bd',
        color2: '#655c86',
      },
      tangle: {
        name: 'Tractor-Beam Net',
        text: 'Tractor-Beam Nets lock a space tight. Match right next to one, or zap it with a special, to snap it free.',
        art: '<rect x="8" y="8" width="84" height="84" rx="20" fill="#3a1f6e"/><g fill="none" stroke="#2ee6d6" stroke-width="5" stroke-linecap="round"><path d="M16 28 Q50 40 84 28 M16 50 Q50 62 84 50 M16 72 Q50 84 84 72 M28 16 Q38 50 28 84 M50 16 Q60 50 50 84 M72 16 Q82 50 72 84"/></g><g fill="#ff4fb8"><circle cx="31" cy="32" r="4.5"/><circle cx="55" cy="56" r="4.5"/><circle cx="77" cy="32" r="4.5"/><circle cx="31" cy="77" r="4.5"/><circle cx="77" cy="77" r="4.5"/></g>',
      },
      buddy: {
        name: 'Lost Moon Kitten',
        text: 'Lost Moon Kittens want to float down to the landing pad at the bottom. You can always swap one down a space, and specials whoosh them straight home.',
        art: '<circle cx="50" cy="52" r="38" fill="#bdf4ff" fill-opacity=".22" stroke="#e6f6ff" stroke-width="4"/><path d="M28 50 L30 26 L44 38 Z M72 50 L70 26 L56 38 Z" fill="#c9b6ff" stroke="#6c2ed6" stroke-width="3" stroke-linejoin="round"/><ellipse cx="50" cy="56" rx="24" ry="20" fill="#d9caff" stroke="#6c2ed6" stroke-width="3"/><circle cx="41" cy="54" r="4" fill="#2a1050"/><circle cx="59" cy="54" r="4" fill="#2a1050"/><circle cx="42" cy="52.5" r="1.3" fill="#fff"/><circle cx="60" cy="52.5" r="1.3" fill="#fff"/><path d="M48 60 h4 l-2 2.5z" fill="#ff4fb8"/><path d="M46 64 Q50 67 54 64" stroke="#2a1050" stroke-width="2.5" fill="none" stroke-linecap="round"/><circle cx="35" cy="63" r="3.5" fill="#ff9ed6"/><circle cx="65" cy="63" r="3.5" fill="#ff9ed6"/><path d="M27 60 L15 58 M27 65 L15 67 M73 60 L85 58 M73 65 L85 67" stroke="#6c2ed6" stroke-width="2" stroke-linecap="round"/><path d="M26 34 A30 30 0 0 1 44 18" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".8"/>',
      },
    },
    regions: [
      {
        id: 'corlounge',
        name: 'The Velvet Comet',
        blurb:
          "Captain Juno's starship is all shag carpet, lava lamps and a chrome piano bar. Static Fog is seeping in through the vents, so the first thing to plunder back is her own groove.",
        sky: ['#2b0f55', '#6a1d6e'],
        palette: ['#ff4fb8', '#ff8a2a', '#2ee6d6'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5" stroke-linejoin="round"><path d="M40 12 L60 12 L72 62 L28 62 Z"/><path d="M28 62 L72 62 L62 76 L70 90 L30 90 L38 76 Z"/></g><g fill="currentColor"><circle cx="50" cy="30" r="6"/><circle cx="57" cy="46" r="7"/><circle cx="42" cy="52" r="4"/></g>',
        beats: [
          {
            at: 1,
            title: 'All Aboard the Velvet Comet',
            text: 'Captain Juno Jubilee fluffs her bouffant, checks her lashes in a chrome spoon and takes the wheel. The lounge music has gone fuzzy with Static Fog. "Crew," she says, "we have some groove to plunder back."',
          },
          {
            at: 9,
            title: 'A Stowaway in the Shag',
            text: 'Something is purring under the shag carpet. It is a moon kitten in a tiny bubble helmet, lost and fuzzy with static. Juno scoops it up. "Welcome aboard, sugar plum. You\'re crew now."',
          },
          {
            at: 18,
            title: 'A Fuzzy Distress Call',
            text: 'The radio crackles: the Mirrorball Moon has gone dark right in the middle of a dance. Juno flips every switch on the dashboard to GROOVY and sets a course.',
          },
        ],
      },
      {
        id: 'cordisco',
        name: 'Mirrorball Moon',
        blurb:
          'The Mirrorball Moon throws the best parties in the galaxy, with a roller rink in every crater. Tonight its giant mirrorball is fogged with static, and every match makes it shimmer a little brighter.',
        sky: ['#1d1450', '#14506a'],
        palette: ['#2ee6d6', '#e6e9f2', '#ff4fb8'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="5"><path d="M50 8 L50 26"/><circle cx="50" cy="56" r="30"/><path d="M50 26 L50 86 M20 56 L80 56 M26 40 Q50 48 74 40 M26 72 Q50 64 74 72"/></g><path d="M86 18 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="currentColor"/>',
        beats: [
          {
            at: 1,
            title: 'The Dance Floor in the Crater',
            text: 'The moon-folk are standing around in their roller skates, too fuzzy to boogie. Juno steps onto the rink in her go-go boots. "Darlings, a party is only over when we say so."',
          },
          {
            at: 9,
            title: 'A Beige-Bot Learns to Boogie',
            text: "A boxy Beige-Bot in a cardigan gets stuck on the dance floor, so Juno teaches it the Space Shimmy. It beeps with delight and spills the secret: the static comes from Count Monotone's Snooze Ray.",
          },
          {
            at: 18,
            title: 'Course for the Hyperdome',
            text: 'The mirrorball spins again and the whole moon cheers. The moon-folk pack Juno a lunchbox of moon-cheese crackers and point her toward a very silly beige station at the edge of the galaxy.',
          },
        ],
      },
      {
        id: 'corstation',
        name: 'The Humdrum Hyperdome',
        blurb:
          "Count Monotone's space station is shaped like an enormous fuzzy slipper, and it is packed with extremely serious traps. Juno brings the Velvet Comet, the moon kittens and every bit of sparkle she has plundered back.",
        sky: ['#2a2440', '#5a1458'],
        palette: ['#ff8a2a', '#a463ff', '#ffd23f'],
        motif:
          '<g fill="none" stroke="currentColor" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 66 C12 50 30 46 48 50 L70 52 C86 52 90 66 84 74 L20 74 C14 74 12 70 12 66 Z"/><path d="M48 50 C50 38 66 36 70 52"/><path d="M60 36 L62 16"/></g><circle cx="62" cy="13" r="6" fill="currentColor"/>',
        beats: [
          {
            at: 1,
            title: 'Welcome to the Slipper',
            text: 'A booming voice fills the docking bay. "Welcome, Captain! Please wipe your boots and enjoy my extremely serious traps!" The first trap is a laser grid that plays elevator music.',
          },
          {
            at: 10,
            title: 'The Big Monologue',
            text: "Count Monotone appears on a giant screen, twirls his swirly moustache and monologues for eleven whole minutes. Behind him, his own Beige-Bots start tapping their feet to Juno's lounge music.",
          },
          {
            at: 19,
            title: 'The Party Nobody Came To',
            text: 'In the control room, Juno finds the Count alone in a paper party hat beside a big beige cake. "I sent invitations," he sniffs, "but everyone was at louder parties. So I made all the parties quiet." Juno smiles and rolls up her sequined sleeves.',
          },
        ],
      },
    ],
    ending: {
      id: 'corsair',
      title: 'The Grooviest Party in the Galaxy',
      text: "Juno flips the Snooze Ray into the biggest disco projector in the galaxy and sends out one new invitation: everyone is welcome, especially the Count. The moon-folk come, the Beige-Bots come, every lost moon kitten comes, and Count Monotone dances so hard his moustache uncurls. By morning he has a whole crew of friends and a shiny new job as the Velvet Comet's Official Party Planner.",
    },
    map: {
      path: '#e6e9f2',
      dash: '#2ee6d6',
      node: 'star',
    },
    quests: {
      daily: [
        {
          id: 'corsair-d-zaps',
          text: 'Fire 4 Ray-Gun Zaps',
          stat: 'combs',
          target: 4,
          reward: 35,
        },
        {
          id: 'corsair-d-kittens',
          text: 'Float 3 Lost Moon Kittens home',
          stat: 'buddiesRescued',
          target: 3,
          reward: 40,
        },
        {
          id: 'corsair-d-rockets',
          text: 'Collect 50 Retro Rockets',
          stat: 'color1',
          target: 50,
          reward: 30,
        },
      ],
      weekly: [
        {
          id: 'corsair-w-static',
          text: 'Tune out 120 Static Fog',
          stat: 'gloomCleared',
          target: 120,
          reward: 160,
        },
        {
          id: 'corsair-w-disco',
          text: 'Spin 8 Disco Balls',
          stat: 'rainbows',
          target: 8,
          reward: 175,
        },
      ],
    },
    achievements: [
      {
        key: 'start',
        name: 'Ready for Liftoff',
        text: 'Win your first level aboard the Velvet Comet.',
      },
      {
        key: 'middle',
        name: 'Mirrorball Magic',
        text: 'Get the Mirrorball Moon spinning again.',
      },
      {
        key: 'ending',
        name: 'The Grooviest Party',
        text: 'Throw the grooviest party in the galaxy.',
      },
      {
        key: 'stars',
        name: 'Star of the Show',
        text: 'Get 3 stars on 10 Starlet Corsair levels.',
      },
      {
        key: 'signature',
        name: 'Sequin Storm',
        text: 'Set off 60 Sequin Blasts.',
        stat: 'bombs',
        target: 60,
      },
    ],
    prompts: {
      style: STYLE,
      hero:
        'A character select portrait of ' +
        LOOK +
        ', striking a confident hand-on-hip pose with a sparkly chrome ray gun that shoots pink glitter stars, winking with a big friendly grin. Waist-up centered pose facing the viewer, a deep purple starfield background with floating lava lamps and twinkling sequins, ' +
        STYLE,
      key:
        'A dazzling 1960s space-age galaxy with a sleek chrome and hot pink retro rocket ship trailing sequins, a glittering disco moon with a giant mirrorball, and a silly beige space station shaped like an enormous fuzzy slipper in the distance, ' +
        LOOK +
        ' in the foreground waving from the ship hatch. Wide composition, ' +
        STYLE,
      map:
        'A wide top-down storybook map of a swirly purple galaxy with a winding sparkly path running from a chrome retro rocket ship past a glittering disco moon covered in roller-rink craters to a giant beige space station shaped like a fuzzy slipper, ringed planets, lava-lamp nebulas and twinkling stars, ' +
        STYLE,
      regions: {
        corlounge:
          'The cozy lounge inside a 1960s retro starship with fluffy hot pink shag carpet, bubbling lava lamps, a round chrome piano bar, bubble-shaped portholes full of stars and wisps of soft grey static drifting through the vents, ' +
          LOOK +
          ' standing at a glowing round control wheel, ' +
          STYLE,
        cordisco:
          'A glittering disco moon at night with roller-rink craters, a giant mirrorball hanging above a crater dance floor, cheerful round moon-folk in roller skates and bell-bottoms, and a haze of soft grey static dimming the sparkle, ' +
          STYLE,
        corstation:
          'An enormous silly beige space station shaped like a giant fuzzy slipper floating in deep purple space, with a tiny dish antenna, round porthole windows and a docking bay glowing orange, a chrome and hot pink retro rocket ship flying toward it, ' +
          STYLE,
      },
      beats: {
        'corlounge-9':
          KITTEN +
          ' peeking out of fluffy hot pink shag carpet inside a retro starship lounge, while ' +
          LOOK +
          ' kneels down with a delighted smile and open arms, lava lamps glowing behind them, ' +
          STYLE,
        'corlounge-18':
          'A chrome retro starship cockpit with rows of colorful round buttons and flipped switches, a crackling round radio screen showing a dim mirrorball moon, ' +
          LOOK +
          ' at the controls with ' +
          KITTEN +
          ' on her shoulder, ' +
          STYLE,
        'cordisco-9':
          BOT +
          ' happily learning a dance move on a glowing crater dance floor, ' +
          LOOK +
          ' demonstrating the step beside it, cheerful moon-folk in roller skates clapping along under a mirrorball, ' +
          STYLE,
        'cordisco-18':
          'A giant mirrorball spinning brightly again over a disco moon, scattering pink and teal light across cheering moon-folk in roller skates, ' +
          LOOK +
          ' holding a shiny lunchbox and pointing toward a distant beige station shaped like a fuzzy slipper, ' +
          STYLE,
        'corstation-10':
          'A giant round screen in a beige space station hallway showing ' +
          COUNT +
          ' twirling his moustache mid-speech, while a row of boxy beige robots in cozy knitted cardigans tap their feet and sway to music, ' +
          LOOK +
          ' laughing in the foreground, ' +
          STYLE,
        'corstation-19':
          'A beige space station control room with big dials and a large ray cannon, ' +
          COUNT +
          ' sitting alone in a paper party hat beside a big beige birthday cake, looking hopeful and a little shy, while ' +
          LOOK +
          ' walks up with a warm smile and an outstretched hand, ' +
          STYLE,
      },
      ending:
        'The grooviest party in the galaxy inside a beige slipper-shaped space station transformed by a huge disco projector into a swirl of pink, tangerine and teal light, cheerful moon-folk, boxy beige robots in cozy cardigans and fluffy moon kittens in bubble helmets dancing together, ' +
        COUNT +
        ' dancing joyfully with his moustache uncurled, ' +
        LOOK +
        ' celebrating in the center with a raised ray gun shooting confetti stars, ' +
        STYLE,
    },
  })
})(typeof globalThis !== 'undefined' ? globalThis : this)
