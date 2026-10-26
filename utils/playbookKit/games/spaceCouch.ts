import type { PlaybookKitSpec } from '../types'

// A truthful Kit-preview ledger for Space Couch, not an assertion that the
// three-act 16-ending saga or its painterly art has shipped. Forge and the
// Conductor roadmap remain the source for the complete production target.
export const SPACE_COUCH_KIT: PlaybookKitSpec = {
  id: 'game-of-captains',
  conductorSlug: 'game-of-captains',
  title: 'Space Couch',
  tagline: 'The final frontier has upholstery.',
  premise:
    'Choose a captain and three companions, cross the galaxy aboard an actual long red couch protected by an invisible vacuum shield, and expand pocket rooms behind the backrest to face ethically costly missions.',
  tier: 'standard',
  route: '/play/game-of-captains',
  keyArt: {
    src: '/game-of-captains/front/splash.webp',
    brief:
      'Wide painterly outer space scene with a very long crimson upholstered couch carrying four seated travelers inside a barely visible transparent life-support bubble, nebula and planets, one compact folding holodeck doorway directly behind its backrest.',
    alt: 'Four travelers on a red couch spaceship inside a protective force bubble',
  },
  acts: [
    {
      id: 1,
      title: 'Every Seat a Command',
      blurb: 'Appoint your crew and learn what a couch can do in vacuum.',
    },
    {
      id: 2,
      title: 'The Fold Behind',
      blurb:
        'Choose which pocket room to unfold and whose crisis to intervene in.',
    },
    {
      id: 3,
      title: 'The Last Jump Gate',
      blurb:
        'Protect strangers or bargain with a rival who remembers your choices.',
    },
  ],
  meters: [
    { id: 'supplies', label: 'Couch supplies', min: 0, max: 10, start: 7 },
    { id: 'trust', label: 'Crew trust', min: -10, max: 10, start: 2 },
    { id: 'shield', label: 'Force bubble charge', min: 0, max: 3, start: 2 },
  ],
  factions: [
    {
      id: 'sanctuary',
      name: 'Serendipity Sanctuary',
      tagline: 'The bar remembers every person it has sheltered.',
      tone: 'info',
      emblem: {
        brief:
          'Tiny glowing neon space bar sign beside an orbital ring, violet and teal painted emblem',
      },
    },
    {
      id: 'treaty',
      name: 'Treaty Authority',
      tagline:
        'Noninterference makes excellent paperwork and difficult funerals.',
      tone: 'warning',
      emblem: {
        brief:
          'Iridescent translucent treaty seal circling a miniature chart of twelve inhabited star systems',
      },
    },
    {
      id: 'independents',
      name: 'The Independent Crews',
      tagline:
        'Small ships and improbable couches answer distress calls first.',
      tone: 'primary',
      emblem: {
        brief:
          'A tiny scarlet sofa silhouette suspended inside a delicate aqua star-shaped force field emblem',
      },
    },
  ],
  cast: [
    {
      id: 'pell',
      name: 'Bosun Pell',
      role: 'follower',
      faction: 'independents',
      tagline: 'Engineer, union loyalist, reluctant upholstery mechanic.',
      portrait: {
        brief:
          'Weathered starship engineer holding a folding cushion repair kit, rich science fiction character painting',
      },
    },
    {
      id: 'vela',
      name: 'Dr. Vela Sorn',
      role: 'follower',
      faction: 'independents',
      tagline:
        'Doctor who knows a life-support bubble cannot make a decision ethical.',
      portrait: {
        brief:
          'Confident reef-world physician with a compact medical case against a deep space starfield portrait',
      },
    },
    {
      id: 'tess',
      name: 'Tess Helio',
      role: 'follower',
      faction: 'independents',
      tagline:
        'Navigator of impossibly small safe harbors and very long sofas.',
      portrait: {
        brief:
          'Young stellar navigator holding a luminous map and perched on red upholstered sofa armrest, nebula backdrop',
      },
    },
    {
      id: 'auditor',
      name: 'The Galactic Auditor',
      role: 'villain',
      primary: true,
      faction: 'treaty',
      tagline: 'Every rescue is a debt; every couch cushion has a surcharge.',
      portrait: {
        brief:
          'Eerie cosmic bureaucrat in pearl-black robe clutching a celestial debt ledger, painted character portrait',
      },
    },
    {
      id: 'vox',
      name: 'Barkeep Vox',
      role: 'figure',
      faction: 'sanctuary',
      tagline:
        'A neutral-ground host who has seen stranger arrivals than the sofa.',
      portrait: {
        brief:
          'Wry retrofuturist space-bar bartender in violet and copper ambient light, atmospheric portrait',
      },
    },
  ],
  reveals: [
    {
      id: 'shield-secret',
      title: 'The safety backup',
      teaser: 'The couch bubble has another setting nobody mentioned.',
      text: 'When its main shield charge reaches zero the couch keeps a safe emergency atmosphere. Missions become harder, not fatal from exposure.',
      act: 1,
      about: ['pell', 'independents'],
    },
    {
      id: 'fold-secret',
      title: 'Behind the backrest',
      teaser: 'Why does the couch cast the shadow of a room?',
      text: 'Miniaturization technology unfolds impossible-sized holodecks, war rooms and infirmaries directly behind the upholstered sofa.',
      act: 2,
      about: ['pell', 'vela'],
    },
    {
      id: 'debt-secret',
      title: 'The price of kindness',
      teaser: 'The Auditor counts rescues that never passed a register.',
      text: 'The Galactic Auditor has converted voluntary rescue into a collectible cosmic debt, threatening the worlds the crew tried to help.',
      act: 3,
      about: ['auditor', 'treaty'],
    },
  ],
  endings: [
    {
      id: 'open-horizon',
      title: 'Captain of the Open Horizon',
      tone: 'hopeful',
      summary:
        'Your crew defends the worlds and returns on the red couch without owning anyone they helped.',
      hint: 'Ask the people you help what they need.',
      about: ['pell', 'vela', 'independents'],
      art: {
        brief:
          'Four crewmates celebrating on a long red couch inside a delicate safety bubble before a sunrise planet',
      },
    },
    {
      id: 'last-couch-home',
      title: 'The Last Couch Home',
      tone: 'bittersweet',
      summary:
        'The refugees survive, but treaties and trust are damaged; your couch carries the cost back through the stars.',
      hint: 'Some rescues cost more than fuel.',
      about: ['vela', 'treaty'],
      art: {
        brief:
          'Battered yet intact red sofa spaceship inside a force bubble passing a distant quiet planet at dusk',
      },
    },
    {
      id: 'galactic-bargain',
      title: 'The Galactic Bargain',
      tone: 'dark',
      summary:
        'You purchase passage from the Auditor and discover that the contract charges the whole galaxy.',
      hint: 'Read every cosmic invoice.',
      about: ['auditor', 'treaty'],
      art: {
        brief:
          'Ominous cosmic auditor presenting a glowing contract to a seated crew on a scarlet space couch',
      },
    },
    {
      id: 'cost-command',
      title: 'The Cost of Command',
      tone: 'bittersweet',
      summary:
        'Your gambit breaks down, but the crew and the couch survive to warn the next captain.',
      hint: 'The shield protects bodies, not reputations.',
      about: ['tess', 'pell', 'auditor'],
      art: {
        brief:
          'A lonely scarlet couch adrift against a huge starfield, transparent shield shimmering around weary survivors',
      },
    },
    {
      id: 'uninvited-guest',
      title: 'The Fifth Cushion',
      tone: 'comic',
      summary:
        'You give a refugee the captain cushion and the galaxy acquires a new diplomatic etiquette.',
      hint: 'The best seat may not belong to the person in charge.',
      about: ['vox', 'sanctuary'],
      art: {
        brief:
          'Comical welcoming scene with five travelers somehow seated on a very long crimson space couch under bright nebulae',
      },
    },
  ],
  moments: [
    {
      id: 'couch-launch',
      title: 'Departure, seated',
      caption:
        'The couch rises straight out of atmosphere. Nobody remembers signing a seatbelt waiver.',
      kind: 'scene',
      act: 1,
      about: [],
      art: {
        brief:
          'Long red upholstered couch with four travelers soaring into orbit in a translucent bubble above a planet',
      },
    },
    {
      id: 'pell-cushion',
      title: 'The seam of space',
      caption:
        'Pell repairs a cushion while its underside touches an impossible void.',
      kind: 'follower',
      act: 1,
      about: ['pell'],
      art: {
        brief:
          'Engineer repairing a torn scarlet cushion while a starlit transparent shield encircles the sofa',
      },
    },
    {
      id: 'tess-chart',
      title: 'Chart on the armrest',
      caption:
        'Tess unfolds a map of the next safe harbor across three cushions.',
      kind: 'follower',
      act: 1,
      about: ['tess'],
      art: {
        brief:
          'Space navigator spreading a glowing star chart over scarlet sofa cushions with vast nebula behind',
      },
    },
    {
      id: 'bubble-glint',
      title: 'The bubble glints',
      caption:
        'A meteor brushes the invisible shield, and everybody remembers they are in space.',
      kind: 'scene',
      act: 1,
      about: [],
      art: {
        brief:
          'Meteor field revealing the blue edge of a force bubble surrounding a long red sofa spaceship',
      },
    },
    {
      id: 'first-contact',
      title: 'Please take a seat',
      caption:
        'The envoy asks where the bridge is. The captain points to the other cushion.',
      kind: 'faction',
      act: 1,
      about: ['treaty'],
      art: {
        brief:
          'Alien diplomat puzzled by seated spacers on a long crimson couch protected by transparent force bubble',
      },
    },
    {
      id: 'holodeck-fold',
      title: 'A room behind us',
      caption:
        'The holodeck unfolds behind the backrest, larger inside than the planet overhead.',
      kind: 'reveal',
      act: 2,
      about: ['pell'],
      art: {
        brief:
          'Bright futuristic hologram training room emerging behind a long red couch floating in space',
      },
    },
    {
      id: 'infirmary-fold',
      title: 'Medical emergency',
      caption:
        'Vela unfolds the infirmary without disturbing the captain cushion.',
      kind: 'follower',
      act: 2,
      about: ['vela'],
      art: {
        brief:
          'Doctor using a glowing pocket infirmary opening directly behind a red upholstered couch in space',
      },
    },
    {
      id: 'war-room',
      title: 'Couch diplomacy',
      caption:
        'A tactical map appears behind the sofa while nobody agrees which planet matters.',
      kind: 'faction',
      act: 2,
      about: ['treaty'],
      art: {
        brief:
          'Tactical planetary hologram room folded out behind red couch spaceship with four distinct seated crew',
      },
    },
    {
      id: 'vox-refuge',
      title: 'One free drink',
      caption: 'Vox charges the whole crew for the drink they never ordered.',
      kind: 'scene',
      act: 2,
      about: ['vox', 'sanctuary'],
      art: {
        brief:
          'Quirky cosmic bartender serving unusual cups near a floating scarlet couch in an orbital neon bar',
      },
    },
    {
      id: 'auditor-ledger',
      title: 'The account comes due',
      caption:
        'The Auditor presents a bill for every life your captain helped save.',
      kind: 'villain',
      act: 3,
      about: ['auditor'],
      art: {
        brief:
          'Cosmic auditor unfolding an endless glowing invoice in front of seated crimson sofa spaceship crew',
      },
    },
    {
      id: 'final-gate',
      title: 'The final jump gate',
      caption:
        'The couch approaches a gate built for a ship with a hull. Nobody volunteers to steer.',
      kind: 'scene',
      act: 3,
      about: ['auditor'],
      art: {
        brief:
          'Red sofa inside an invisible force shield sailing toward colossal ring-shaped jump gate in space',
      },
    },
    {
      id: 'homeward',
      title: 'The long way home',
      caption:
        'The bubble still holds, which is more than can be said for the captain arguments.',
      kind: 'ending',
      act: 3,
      about: ['independents'],
      art: {
        brief:
          'Cinematic long red sofa with four seated companions flying toward sunrise planet beneath starfield',
      },
    },
  ],
  trailer: {
    tagline: 'One couch. Infinite vacuum. Several poor decisions.',
    beats: [
      {
        moment: 'couch-launch',
        line: 'What if the spaceship really was just a couch?',
      },
      {
        moment: 'bubble-glint',
        line: 'Fortunately the air comes with a warranty.',
      },
      {
        moment: 'war-room',
        line: 'The rooms fit behind the sofa. Science declines to explain.',
      },
      {
        moment: 'final-gate',
        line: 'And everyone has opinions about where you should sit.',
      },
    ],
  },
}
