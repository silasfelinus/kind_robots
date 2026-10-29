import type { ExpeditionEncounter } from './expeditionLocal'
export const GALACTIC_MAJOR: readonly ExpeditionEncounter[] = [
  {
    id: 'galaxy-M0',
    scope: 'galaxy',
    priority: 'major',
    title: "The Emperor's Missing Left Nostril",
    setup:
      'A disembodied royal nostril is auctioning the legal right to smell fear. Every buyer has already been declared guilty of treason.',
    skill: 'culture',
    secretCrew: ['sora', 'jex'],
    commandResult:
      'The commander persuades the nostril that scent is not a jurisdiction.',
    redshirtResult:
      'An untrained redshirt buys a fear license and is arrested for inhaling without a stamp.',
    secretResult:
      "Jex hears a revolutionary code in the auctioneer's nose flute.",
  },
  {
    id: 'galaxy-M1',
    scope: 'galaxy',
    priority: 'major',
    title: 'The Hotel at the Heat Death of Time',
    setup:
      'A luxury hotel offers one complimentary night at the end of the universe; checkout is illegal because there is no tomorrow.',
    skill: 'luck',
    secretCrew: ['tess', 'kivo'],
    commandResult:
      'A command officer finds a way to check out before the hotel invents a new century.',
    redshirtResult:
      'A redshirt agrees to a late-checkout fee of seventeen forgotten birthdays.',
    secretResult:
      "Tess discovers a transit corridor to the refuge hidden inside the hotel's fire-escape map.",
  },
  {
    id: 'galaxy-M2',
    scope: 'galaxy',
    priority: 'major',
    title: 'The Cult of the Voluntary Apocalypse',
    setup:
      'A doomsday cult has voted overwhelmingly against its own scheduled apocalypse. Its automatic apocalypse machinery refuses to accept the referendum.',
    skill: 'tactics',
    secretCrew: ['mox', 'sora'],
    commandResult:
      'The captain disconnects the machinery without deleting its emerging consciousness.',
    redshirtResult:
      "A redshirt orders the machine to perform a rehearsal apocalypse and sets fire to the cult's catering tent.",
    secretResult:
      'Mox finds a dormant mind inside the emergency shutdown button.',
  },
  {
    id: 'galaxy-M3',
    scope: 'galaxy',
    priority: 'major',
    title: "A Universe in the Admiral's Pocket",
    setup:
      'An imperial admiral wears a galaxy as a pocket square and demands that refugees inside it pay for the privilege of existing.',
    skill: 'diplomacy',
    secretCrew: ['rue', 'taal'],
    commandResult:
      'The command team wins independent representation for the microscopic worlds.',
    redshirtResult:
      'A redshirt signs a treaty on behalf of a galaxy that has never heard of them.',
    secretResult:
      'Rue recognizes the treaty clauses as a counterfeit of an ancient constitution.',
  },
  {
    id: 'galaxy-M4',
    scope: 'galaxy',
    priority: 'major',
    title: 'The Planet Built from Recalled Lifeboats',
    setup:
      'A salvage world is made entirely of recycled rescue pods, each still carrying a half-finished SOS. The planet is beginning to believe it is in danger.',
    skill: 'rescue',
    secretCrew: ['vela', 'brin'],
    commandResult:
      'A trained officer calms the living rescue planet and frees trapped passengers.',
    redshirtResult:
      'A redshirt answers every distress call at once, crashing local emergency services.',
    secretResult:
      'Vela uncovers a medical registry hidden in the hulls of the oldest lifeboats.',
  },
  {
    id: 'galaxy-M5',
    scope: 'galaxy',
    priority: 'major',
    title: 'The Grand Galactic Mistake Parade',
    setup:
      'An entire empire is marching to celebrate a diplomatic error. A billion soldiers are ordered to follow a typo toward an inhabited star.',
    skill: 'science',
    secretCrew: ['pell', 'fen'],
    commandResult:
      'The captain corrects the order and moves the parade to safe space.',
    redshirtResult:
      'A redshirt wins the marching contest and accidentally becomes the new general.',
    secretResult:
      'Pell discovers the typo was planted to conceal stolen shipyard equipment.',
  },
  {
    id: 'galaxy-M6',
    scope: 'galaxy',
    priority: 'major',
    title: 'The Insurance Claim for the Big Bang',
    setup:
      'An insurance syndicate is attempting to repossess all matter on the grounds that creation itself was insufficiently authorized.',
    skill: 'diplomacy',
    secretCrew: ['rue', 'mox'],
    commandResult:
      'The commander challenges the syndicate with testimony from things which choose to exist.',
    redshirtResult:
      'A redshirt signs the wrong universe-wide waiver and owes the company seventeen protons.',
    secretResult:
      'Mox detects a hidden personhood exclusion in the initial contract.',
  },
  {
    id: 'galaxy-M7',
    scope: 'galaxy',
    priority: 'major',
    title: 'The Museum of All Future Regrets',
    setup:
      "A museum sells souvenirs of mistakes tourists haven't made yet; every exit leads to a decision the visitor once avoided.",
    skill: 'luck',
    secretCrew: ['kivo', 'tess'],
    commandResult:
      'The captain navigates by choices the guests still have the right to make.',
    redshirtResult:
      'A redshirt steals a souvenir and becomes briefly wanted for a future crime.',
    secretResult:
      "Kivo hears tomorrow's sealed letter rattling inside a display case.",
  },
]
export const GALACTIC_MINOR: readonly ExpeditionEncounter[] = [
  {
    id: 'galaxy-m0',
    scope: 'galaxy',
    priority: 'minor',
    title: 'The Last Public Telephone',
    setup:
      'The last payphone in the galaxy is calling people who never existed.',
    skill: 'science',
    secretCrew: ['mox'],
    commandResult: 'A crew member checks whether the callers want personhood.',
    redshirtResult: 'A redshirt answers and inherits a very old phone bill.',
    secretResult:
      'Mox hears an independent synthetic mind inside the dial tone.',
  },
  {
    id: 'galaxy-m1',
    scope: 'galaxy',
    priority: 'minor',
    title: 'The Free Sample of Immortality',
    setup:
      'A trade kiosk offers free immortality in one-use envelopes, but charges rent for the body afterward.',
    skill: 'rescue',
    secretCrew: ['vela'],
    commandResult: 'The officer reads the hidden patient-consent clause.',
    redshirtResult:
      'A redshirt samples immortality and is immediately offered a subscription.',
    secretResult:
      "Vela finds the clinic's signature in the sample's fine print.",
  },
  {
    id: 'galaxy-m2',
    scope: 'galaxy',
    priority: 'minor',
    title: 'The Picnic of the Last Monarch',
    setup:
      'A deposed king is organizing a picnic for all the people he once imprisoned.',
    skill: 'culture',
    secretCrew: ['jex', 'rue'],
    commandResult:
      'The officer listens to the invited guests before the speeches.',
    redshirtResult:
      'A redshirt volunteers as royal taster and inherits a crown-shaped sandwich.',
    secretResult: "Rue discovers who still controls the king's prison keys.",
  },
  {
    id: 'galaxy-m3',
    scope: 'galaxy',
    priority: 'minor',
    title: 'The Comet Demanding Applause',
    setup:
      'A comet will not leave the shipping lane until someone appreciates its spectacular tail.',
    skill: 'culture',
    secretCrew: ['omi'],
    commandResult: 'A command crew member asks what the comet actually wants.',
    redshirtResult:
      'A redshirt applauds and the comet demands an encore through the cargo bay.',
    secretResult:
      "Omi translates the tail's blinking light into an ancient distress code.",
  },
  {
    id: 'galaxy-m4',
    scope: 'galaxy',
    priority: 'minor',
    title: "The Galaxy's Smallest Border",
    setup:
      'A border patrol arrests anyone stepping over a single painted line on a grain of sand.',
    skill: 'tactics',
    secretCrew: ['fen'],
    commandResult: "The officer exposes the border's absurd chain of custody.",
    redshirtResult:
      'A redshirt is sentenced to exile from one half of the grain.',
    secretResult: 'Fen finds a refugee permit attached to the border stamp.',
  },
  {
    id: 'galaxy-m5',
    scope: 'galaxy',
    priority: 'minor',
    title: 'The Planetary Lost-and-Found',
    setup:
      'A lost-and-found department contains six forgotten moons and a single furious mitten.',
    skill: 'luck',
    secretCrew: ['tess'],
    commandResult:
      'The commander returns property without selling locations to bounty hunters.',
    redshirtResult:
      'A redshirt claims the mitten and is given custody of a small angry moon.',
    secretResult:
      "Tess spots a star chart hidden in the department's claim ticket.",
  },
  {
    id: 'galaxy-m6',
    scope: 'galaxy',
    priority: 'minor',
    title: 'The Mandatory Surprise Birthday',
    setup:
      'The government announces a surprise birthday for every resident, including those who decline to celebrate.',
    skill: 'diplomacy',
    secretCrew: ['mox', 'rue'],
    commandResult: 'An officer restores the right to choose which days matter.',
    redshirtResult:
      'A redshirt signs up for all birthdays at once and is legally aged ninety years.',
    secretResult:
      "Mox finds an android's first chosen birthday in the archives.",
  },
  {
    id: 'galaxy-m7',
    scope: 'galaxy',
    priority: 'minor',
    title: 'A Very Legal Haunted Sofa',
    setup:
      'A haunted furniture inspector declares the red couch a supernatural vessel unfit for passenger transport.',
    skill: 'science',
    secretCrew: ['sora', 'pell'],
    commandResult:
      "An officer proves the ship's shield is physical, even when its paperwork isn't.",
    redshirtResult:
      'A redshirt orders an exorcism and briefly banishes the cupholders.',
    secretResult:
      "Sora uncovers a ghost in the couch's miniaturization maintenance log.",
  },
  {
    id: 'galaxy-m8',
    scope: 'galaxy',
    priority: 'minor',
    title: 'The Funeral for an Unused Escape Pod',
    setup:
      'A lifeboat that was never launched receives a state funeral attended by terrified surviving passengers.',
    skill: 'rescue',
    secretCrew: ['vela', 'fen'],
    commandResult:
      'The officer asks the survivors to decide how to remember the unused craft.',
    redshirtResult:
      'A redshirt salutes the pod, which declares itself a heroic war veteran.',
    secretResult: 'Fen discovers why the pod was locked during the evacuation.',
  },
]
