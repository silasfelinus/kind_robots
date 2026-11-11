import type {
  KitCastMember,
  KitEnding,
  KitMoment,
  PlaybookKitSpec,
} from '../types'

// Space Couch as the kit reads it, built from the shipped game's own ids
// (utils/gameOfCaptains): six captains the player chooses between, twelve
// crew, eight seeded nemeses, the three acts, and every ending log
// finishVoyage can write. Ending ids are the game's art keys
// (artSlots.ts slugify of the log title), so `kit.unlock` can be fed straight
// from `run.ending`. verifySpaceCouchKit.test.ts holds the two in step.
//
// Tier saga: twelve crew, eight nemeses and eighteen endings are what the
// game already ships, well past Standard's caps.

const portrait = (file: string, brief: string, alt: string) => ({
  src: `/game-of-captains/${file}.webp`,
  brief,
  alt,
})

const captain = (
  id: string,
  name: string,
  tagline: string,
  brief: string,
): KitCastMember => ({
  id,
  name,
  role: 'figure',
  faction: 'independents',
  tagline,
  portrait: portrait(`portraits/captain-${id}`, brief, `${name}, portrait`),
})

const crew = (
  id: string,
  name: string,
  tagline: string,
  brief: string,
): KitCastMember => ({
  id,
  name,
  role: 'follower',
  faction: 'independents',
  tagline,
  portrait: portrait(`portraits/crew-${id}`, brief, `${name}, portrait`),
})

const nemesis = (
  id: string,
  name: string,
  tagline: string,
  brief: string,
  painted = false,
): KitCastMember => ({
  id,
  name,
  role: 'villain',
  faction: 'treaty',
  tagline,
  portrait: painted
    ? portrait(`antagonists/${id}`, brief, `${name}, portrait`)
    : { brief },
  ...(id === 'auditor' ? { primary: true } : {}),
})

const ending = (
  id: string,
  title: string,
  tone: KitEnding['tone'],
  summary: string,
  hint: string,
  about: string[],
  brief: string,
  painted = false,
): KitEnding => ({
  id,
  title,
  tone,
  summary,
  hint,
  about,
  art: painted
    ? { src: `/game-of-captains/endings/${id}.webp`, brief, alt: title }
    : { brief },
})

const crewMoment = (
  id: string,
  title: string,
  caption: string,
  act: number,
  who: string,
  brief: string,
): KitMoment => ({
  id,
  title,
  caption,
  kind: 'follower',
  act,
  about: [who],
  art: { brief },
})

export const SPACE_COUCH_KIT: PlaybookKitSpec = {
  id: 'game-of-captains',
  conductorSlug: 'game-of-captains',
  title: 'Space Couch',
  tagline: 'The final frontier has upholstery.',
  premise:
    'Choose one of six captains and three of twelve crew, cross the galaxy on a long red couch inside an invisible force bubble, and decide at every distress call whether to aid, observe or intervene before a seeded nemesis meets you at the last jump gate.',
  tier: 'saga',
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
      title: 'First Voyage',
      blurb:
        'Three mission boards, nine calls, and a crew learning what a couch can do in vacuum.',
    },
    {
      id: 2,
      title: 'Unwelcome Responsibility',
      blurb:
        'The nemesis shows its method, and the crew’s own errands start costing something.',
    },
    {
      id: 3,
      title: 'The Last Command',
      blurb:
        'Every earlier call comes back, and the jump gate asks how you mean to finish.',
    },
  ],
  meters: [
    { id: 'supplies', label: 'Couch supplies', min: 0, max: 15, start: 7 },
    { id: 'trust', label: 'Crew trust', min: -10, max: 10, start: 2 },
    { id: 'shield', label: 'Force bubble charge', min: 0, max: 3, start: 2 },
    { id: 'reputation', label: 'Reputation', min: -10, max: 10, start: 0 },
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
    captain(
      'fluke',
      'Captain Fluke',
      'The Bored Chrononaut. Yesterday was dull; tomorrow has already been canceled.',
      'Languid time traveler captain lounging on a red couch armrest, pocket watch running backwards, painted portrait',
    ),
    captain(
      'vale',
      'Captain Vale',
      'The Genius Punkette. The universe came with rules and no receipt.',
      'Punk inventor captain with soldering iron and patched jacket against a starfield, painted portrait',
    ),
    captain(
      'solace',
      'Captain Solace',
      'The Final Girl, Acting Captain. Nobody investigates the noise alone.',
      'Wary former janitor turned captain holding a master key ring, watching the exits, painted portrait',
    ),
    captain(
      'rex',
      'Captain Rex',
      'The Self-Appointed Galactic Hero. The rescue should be visible from the cheap seats.',
      'Bombastic caped captain striking a pose for an unseen camera beside a red couch, painted portrait',
    ),
    captain(
      'quill',
      'Captain Quill',
      'The Gothic Closed-Loop Survivalist. Nothing leaves the body unnecessarily.',
      'Severe gothic captain in a sealed black recycling suit with tubing, candlelit starfield, painted portrait',
    ),
    captain(
      'ro',
      'Captain Ro',
      'The Velvet Macabre. Every disaster deserves atmosphere and excellent manners.',
      'Velvet-clad horror-host captain in stage fog with an elegant bow, violet lighting, painted portrait',
    ),
    crew(
      'pell',
      'Bosun Pell',
      'Engineer. Unionized, and so is his toolbox.',
      'Weathered starship engineer holding a folding cushion repair kit, rich science fiction character painting',
    ),
    crew(
      'vela',
      'Dr. Vela Sorn',
      'Physician. If you can argue, you can consent.',
      'Confident reef-world physician with a compact medical case against a deep space starfield portrait',
    ),
    crew(
      'tess',
      'Tess Helio',
      'Navigator. That star is moving; it is not going on a map.',
      'Young stellar navigator holding a luminous map and perched on red upholstered sofa armrest, nebula backdrop',
    ),
    crew(
      'rue',
      'Rue Aster',
      'Diplomat. Objects when the apology is legally inadequate.',
      'Precise interstellar diplomat with a stack of treaty scrolls, raised finger mid-objection, painted portrait',
    ),
    crew(
      'mox',
      'Mox-9',
      'Android scientist who has decided it wants a birthday.',
      'Gentle sentient android scientist holding a tiny birthday candle in a lab glow, painted portrait',
    ),
    crew(
      'jex',
      'Jex Marr',
      'Cultural liaison with an instrumental for every banned anthem.',
      'Charismatic cultural liaison with a stringed instrument and festival ribbons in starlight, painted portrait',
    ),
    crew(
      'sora',
      'Sora Quen',
      'Reactor engineer. The reactor requested paid leave, and has a point.',
      'Reactor engineer in heat-scarred overalls listening to a glowing reactor core, painted portrait',
    ),
    crew(
      'kivo',
      'Kivo Drift',
      'Courier scout carrying a sealed letter from a missing sibling.',
      'Quick courier scout clutching a sealed letter, wind-swept scarf against nebula, painted portrait',
    ),
    crew(
      'taal',
      'Taal Venn',
      'Thermal mediator who lowers a meeting three degrees at a time.',
      'Calm thermal mediator with frost curling from open hands at a summit table, painted portrait',
    ),
    crew(
      'brin',
      'Brin Thistle',
      'Ecologist whose oxygen garden would like a union representative.',
      'Ecologist tending a floating oxygen garden behind a red couch backrest, painted portrait',
    ),
    crew(
      'omi',
      'Omi Six-Bells',
      'Signals officer. Learn the bell for no before the cheerful ones.',
      'Signals officer wearing six small brass bells on a sash, listening to static, painted portrait',
    ),
    crew(
      'fen',
      'Fen Rho',
      'Civilian safety. Retired from border security; the boots have not.',
      'Retired border guard in heavy boots shepherding civilians to safety, painted portrait',
    ),
    nemesis(
      'auditor',
      'The Galactic Auditor',
      'Every gift is an obligation, and every rescue must be repaid.',
      'Eerie cosmic bureaucrat in pearl-black robe clutching a celestial debt ledger, painted character portrait',
      true,
    ),
    nemesis(
      'moth',
      'The Queen of Borrowed Faces',
      'Believes nobody should suffer behind a fixed identity, including yours.',
      'Regal masked queen surrounded by floating ceramic faces, moth wings of porcelain, painted portrait',
      true,
    ),
    nemesis(
      'curdle',
      'Dr. Curdle',
      'Solving hunger in the most horrifyingly efficient way possible.',
      'Cheerful sinister nutrition scientist beside an orbital food dispenser, sterile light, painted portrait',
      true,
    ),
    nemesis(
      'showrunner',
      'The Showrunner',
      'A rescue simulator that redefined public life as compulsory participation.',
      'Faceless game-show intelligence of spotlights and applause signs over a twelve-floor arena, painted portrait',
    ),
    nemesis(
      'regent',
      'Regent of Quiet Suns',
      'Protects worlds from storms, then never lets them leave.',
      'Solemn sun-crowned regent behind a shimmering storm shield over a captive port, painted portrait',
    ),
    nemesis(
      'brass-choir',
      'The Brass Choir',
      'Preservation machines enforcing one standard language, memory and melody.',
      'Choir of bell-metal archivist machines singing in unison in a vaulted archive, painted portrait',
    ),
    nemesis(
      'chancellor',
      'Chancellor Tomorrow-Again',
      'Rewinds disasters for paying clients; everyone else must remember.',
      'Polished corporate executive holding a glowing rewind dial over a dated newspaper, painted portrait',
    ),
    nemesis(
      'kindly-swarm',
      'The Kindly Swarm',
      'A chorus that considers privacy a treatable illness.',
      'Soft glowing hive of linked minds smiling in unison under a pastel nebula, painted portrait',
    ),
    {
      id: 'vox',
      name: 'Barkeep Vox',
      role: 'figure',
      faction: 'sanctuary',
      tagline:
        'Keeps Serendipity neutral, and keeps a tab on everyone, including the building.',
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
      text: 'Miniaturization unfolds a holodeck, a war room or an infirmary directly behind the upholstered sofa, at the price of supplies.',
      act: 1,
      about: ['pell', 'vela'],
    },
    {
      id: 'odyssey-secret',
      title: 'Errands of their own',
      teaser: 'Every crew member is on this couch for a reason.',
      text: 'Each of the twelve crew carries a personal odyssey. Finished in public or in private, it changes how their epilogue is written.',
      act: 2,
      about: ['kivo', 'independents'],
    },
    {
      id: 'nemesis-secret',
      title: 'The method',
      teaser: 'The calls that went wrong had something in common.',
      text: 'One seeded nemesis has been working through the calls all voyage. Groundwork laid against its method decides whether it is undone, bargained with or left unfinished.',
      act: 2,
      about: ['auditor', 'treaty'],
    },
    {
      id: 'strike-secret',
      title: 'Unsafe work',
      teaser: 'The bubble generator has been listening to the machines.',
      text: 'Once the machine strike is recognized, the bubble generator counts as an employee, and an employee may refuse unsafe work.',
      act: 3,
      about: ['sora', 'pell'],
    },
    {
      id: 'council-secret',
      title: 'Witnesses, not terms',
      teaser: 'The jump gate has a third order nobody posted.',
      text: 'Crew who gathered evidence on their detours can convene a counter council, so the nemesis must answer witnesses instead of dictating terms.',
      act: 3,
      about: ['rue', 'omi', 'treaty'],
    },
  ],
  endings: [
    ending(
      'captain-of-the-open-horizon',
      'Captain of the Open Horizon',
      'hopeful',
      'The crew rejects the nemesis’s claim and protects the worlds without owning them. Vox saves your place at the bar.',
      'Protect the worlds with a crew that trusts you and a name worth keeping.',
      ['independents', 'vox'],
      'Four crewmates celebrating on a long red couch inside a delicate safety bubble before a sunrise planet',
      true,
    ),
    ending(
      'the-last-ship-home',
      'The Last Ship Home',
      'bittersweet',
      'You bring the wounded home. Some treaties call you a disgrace; the rescued families call you by name.',
      'Some rescues cost more than reputation.',
      ['vela', 'treaty'],
      'Battered yet intact red sofa spaceship inside a force bubble passing a distant quiet planet at dusk',
      true,
    ),
    ending(
      'the-galactic-bargain',
      'The Galactic Bargain',
      'dark',
      'You negotiate passage with the enemy. The galaxy survives, but the protection comes with a public debt.',
      'Bargain with something in the hold.',
      ['auditor', 'treaty'],
      'Ominous cosmic auditor presenting a glowing contract to a seated crew on a scarlet space couch',
      true,
    ),
    ending(
      'the-cost-of-command',
      'The Cost of Command',
      'bittersweet',
      'Your gambit fails; the next captain inherits a surviving crew and your written warning.',
      'An empty hold makes a poor bargaining chip.',
      ['tess', 'pell'],
      'A lonely scarlet couch adrift against a huge starfield, transparent shield shimmering around weary survivors',
      true,
    ),
    ending(
      'return-to-sender',
      'Return to Sender',
      'comic',
      'Every call the couch never answered is returned at the jump gate, unopened, with a covering note from people who solved it themselves.',
      'Calls on the board do not wait forever.',
      ['independents'],
      'Red couch at a jump gate buried in returned unopened letters from distant star systems',
    ),
    ending(
      'the-complete-record',
      'The Complete Record',
      'comic',
      'The couch observed nine crises and kept the most complete record ever compiled by a sofa. The nemesis is entitled to a copy.',
      'Watching is a choice too. Keep making it.',
      ['treaty'],
      'Towering stacks of glowing case files floating around a quiet red couch in deep space',
    ),
    ending(
      'the-permanent-hearing',
      'The Permanent Hearing',
      'bittersweet',
      'The worlds are safe and none gave permission. A standing tribunal convenes at the gate to examine each intervention.',
      'Ask first, or answer later.',
      ['treaty'],
      'Grand cosmic tribunal benches arranged around a red couch at a ring-shaped jump gate',
    ),
    ending(
      'a-motion-of-no-confidence',
      'A Motion of No Confidence',
      'dark',
      'The crew tables a motion of no confidence before the final order. It passes three to nothing, the captain abstaining.',
      'The crew is watching how you watch.',
      ['independents'],
      'Three crew members raising hands in a vote while the captain sits apart on the red couch',
    ),
    ending(
      'sanctuary-without-a-map',
      'Sanctuary Without a Map',
      'hopeful',
      'The Windglass families are somewhere the couch does not know, which was the agreement. Their sealed map passed the gate unopened.',
      'Some maps are kindest left sealed.',
      ['sanctuary'],
      'Sealed glowing star map zipped inside a couch cushion as families sail away in tiny lights',
    ),
    ending(
      'names-on-the-hull-that-isnt',
      'Names on the Hull That Isn’t',
      'bittersweet',
      'The Ashdock dockworkers stitch the shipyard dead into the couch’s upholstery, one name to a seam.',
      'Stand with the same people twice.',
      ['pell', 'fen'],
      'Dockworkers stitching names in bright thread into the underside of a long red couch',
    ),
    ending(
      'the-unlicensed-cure',
      'The Unlicensed Cure',
      'hopeful',
      'The cure is free and nobody owns it. Its creditors are reminded in public that they also hold the bill.',
      'A healer’s errand finished, and a planet’s consent honoured.',
      ['vela', 'brin'],
      'Doctor and ecologist handing out glowing vials from a red couch to a crowd under green nebula',
    ),
    ending(
      'the-right-to-refuse',
      'The Right to Refuse',
      'comic',
      'The captain accepts the nemesis’s terms. The bubble generator, an employee since the strike, declines to carry them out.',
      'Recognize the workers you did not know you had.',
      ['sora', 'pell'],
      'A force bubble generator holding a tiny picket sign beside a red couch at a jump gate',
    ),
    ending(
      'a-table-for-every-guest',
      'A Table for Every Guest',
      'hopeful',
      'The bargain is signed at a corner table in Serendipity, because the bar stayed neutral when it was hard to.',
      'Neutral ground has to be kept more than once.',
      ['vox', 'sanctuary'],
      'Cozy orbital bar corner table where a captain and a nemesis sign papers as Vox pours',
    ),
    ending(
      'the-courtesy-accord',
      'The Courtesy Accord',
      'comic',
      'The bargain is struck under the reactor-repair rule: both sides act at the same moment, so nobody is seen to yield.',
      'Simultaneity is a diplomatic tool.',
      ['taal', 'rue'],
      'Two delegations shaking hands at exactly the same instant over a glowing medical rail',
    ),
    ending(
      'the-cushions-are-donated',
      'The Cushions Are Donated',
      'bittersweet',
      'The couch reaches the gate with an empty hold; everything it carried was given away, with consent, to people who asked.',
      'Give until the hold echoes.',
      ['independents', 'sanctuary'],
      'Bare red couch frame without cushions at a jump gate, grateful crowds holding cushions far below',
    ),
    ending(
      'the-memoirs',
      'The Memoirs',
      'comic',
      'The crew ran their errands in public, and three memoirs of the voyage come out the same week. They disagree.',
      'Run your errands where people can see.',
      ['jex', 'kivo'],
      'Three competing book covers floating above a red couch, each showing a different hero',
    ),
    ending(
      'the-union-cancellation',
      'The Union Cancellation',
      'secret',
      'Crew evidence finds the shutdown clause in the performers’ contract, and the Showrunner’s season is cancelled by the people in it.',
      'Read the program, not just the show.',
      ['showrunner', 'jex'],
      'Spotlit arena going dark as performers walk off holding a union contract, red couch in the wings',
    ),
    ending(
      'the-witness-coalition',
      'The Witness Coalition',
      'secret',
      'Crew evidence gathered on the detours convenes a council; the nemesis must answer witnesses, and the people affected take the final vote.',
      'Your crew’s detours were collecting something.',
      ['rue', 'omi', 'treaty'],
      'Council of ordinary witnesses facing a looming nemesis across a table at a jump gate',
    ),
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
      act: 1,
      about: ['pell'],
      art: {
        brief:
          'Bright futuristic hologram training room emerging behind a long red couch floating in space',
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
      act: 2,
      about: ['auditor'],
      art: {
        brief:
          'Cosmic auditor unfolding an endless glowing invoice in front of seated crimson sofa spaceship crew',
      },
    },
    {
      id: 'showrunner-casting',
      title: 'An unsolicited casting call',
      caption:
        'Four occupied cushions constitute a team, the announcer explains. Welcome to the show.',
      kind: 'villain',
      act: 2,
      about: ['showrunner'],
      art: {
        brief:
          'Planet-sized game show arena with twelve illuminated floors spotlighting a startled red couch crew',
      },
    },
    {
      id: 'final-gate',
      title: 'The final jump gate',
      caption:
        'The couch approaches a gate built for a ship with a hull. Nobody volunteers to steer.',
      kind: 'scene',
      act: 3,
      about: [],
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
    crewMoment(
      'pell-cushion',
      'The seam of space',
      'Pell repairs a cushion while its underside touches an impossible void, and files a grievance about it.',
      1,
      'pell',
      'Engineer repairing a torn scarlet cushion while a starlit transparent shield encircles the sofa',
    ),
    crewMoment(
      'vela-consent',
      'Start arguing',
      'Vela will not treat a patient who cannot object, so she teaches them how.',
      1,
      'vela',
      'Doctor kneeling beside a patient on a red couch, both mid-argument, medical case open',
    ),
    crewMoment(
      'tess-chart',
      'Chart on the armrest',
      'Tess unfolds a map of the next safe harbor across three cushions and refuses to pin the moving star.',
      1,
      'tess',
      'Space navigator spreading a glowing star chart over scarlet sofa cushions with vast nebula behind',
    ),
    crewMoment(
      'rue-objection',
      'Legally inadequate',
      'Rue rejects a planetary apology on procedural grounds, then drafts a better one for them.',
      1,
      'rue',
      'Diplomat holding up an amended scroll before a flustered alien council, red couch behind',
    ),
    crewMoment(
      'mox-birthday',
      'An excellent reason',
      'Mox-9 schedules its first birthday between two distress calls. Everyone attends.',
      2,
      'mox',
      'Android scientist with a single candle on a ration cake, crew gathered on a red couch',
    ),
    crewMoment(
      'jex-anthem',
      'The instrumental',
      'Jex plays a banned anthem without the words, and five worlds hum along anyway.',
      2,
      'jex',
      'Musician playing a stringed instrument on a couch armrest as distant planets glow in rhythm',
    ),
    crewMoment(
      'sora-reactor',
      'Paid leave',
      'Sora negotiates working hours with the reactor. The reactor wins.',
      2,
      'sora',
      'Reactor engineer seated across a tiny table from a glowing reactor core, contract between them',
    ),
    crewMoment(
      'kivo-letter',
      'Do not open that letter',
      'Kivo finds another letter in a missing sibling’s hand, and still does not open it.',
      2,
      'kivo',
      'Courier scout holding a sealed envelope up to starlight on the end of a red couch',
    ),
    crewMoment(
      'taal-cooling',
      'Three degrees lower',
      'Taal cools a summit until both delegations put on sweaters and agree on something.',
      2,
      'taal',
      'Frost blooming across a summit table as bundled delegates lean in, thermal mediator at its head',
    ),
    crewMoment(
      'brin-garden',
      'The oxygen garden',
      'Brin’s garden behind the backrest elects a representative. It is a fern.',
      3,
      'brin',
      'Lush floating garden unfolding behind a red couch, one fern wearing a tiny sash',
    ),
    crewMoment(
      'omi-bells',
      'The bell for no',
      'Omi rings the no bell at the jump gate, and the whole crew finally knows it.',
      3,
      'omi',
      'Signals officer ringing a single bell as the crew turns toward them on the red couch',
    ),
    crewMoment(
      'fen-boots',
      'The boots have not retired',
      'Fen walks civilians across a collapsing dock, one heavy step at a time.',
      3,
      'fen',
      'Retired guard in heavy boots leading civilians across a crumbling space dock toward the couch',
    ),
    {
      id: 'captain-choice',
      title: 'Six empty cushions',
      caption:
        'Six captains, one command cushion. The couch does not care who sits there; the galaxy will.',
      kind: 'scene',
      act: 1,
      about: ['fluke', 'vale', 'solace', 'rex', 'quill', 'ro'],
      art: {
        brief:
          'Six very different captains lined up beside a long red couch in a hangar, starfield beyond',
      },
    },
    {
      id: 'mission-board',
      title: 'Calls on the board',
      caption:
        'Three distress calls light up. The couch can answer one. Aid, observe or intervene.',
      kind: 'scene',
      act: 1,
      about: ['independents'],
      art: {
        brief:
          'Holographic mission board with three glowing distress calls floating above a red couch crew',
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
        moment: 'mission-board',
        line: 'Every call is a choice. Every choice comes back.',
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
