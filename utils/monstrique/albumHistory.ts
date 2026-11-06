export interface MonstriqueAlbum {
  id: string
  year: number
  title: string
  movement: string
  sound: string
  performers: readonly string[]
  removed: string
  replacement: string
  officialStory: string
  actualHistory: string
  reinvention: string
  collectible: string
  clueFlag: string
  artUrl: string | null
}

export const MONSTRIQUE_ALBUMS: readonly MonstriqueAlbum[] = [
  {
    id: 'beach-hex',
    year: 1964,
    title: 'Beach Hex',
    movement: 'The Drive-In Years',
    sound:
      'Surf harmonies, beach-party horror and four outrageous leading ladies.',
    performers: ['Draculina', 'Roxie Lupin', 'Laguna Brine', 'Nefertari'],
    removed: 'Francesca Stein',
    replacement: 'Nefertari',
    officialStory:
      'Francesca wanted to concentrate on science fiction pictures.',
    actualHistory:
      'Sponsors disliked her intelligent, stitched appearance and erased her work on the science props.',
    reinvention:
      'She became the patron saint of midnight science-horror cinema.',
    collectible:
      'A first-pressing publicity photograph still contains Francesca.',
    clueFlag: 'album-proof-beach-hex',
    artUrl: null,
  },
  {
    id: 'velvet-crypt',
    year: 1974,
    title: 'Velvet Crypt',
    movement: 'The Velvet Revolt',
    sound:
      'Psychedelic glam, smoky European stages and a dangerous guitar sound.',
    performers: ['Draculina', 'Roxie Lupin', 'Francesca Stein', 'Nefertari'],
    removed: 'Laguna Brine',
    replacement: 'Francesca Stein',
    officialStory: 'Laguna left to star in prestige international films.',
    actualHistory:
      'The studio wanted swimsuits instead of her songwriting credits.',
    reinvention:
      'Laguna recorded art-film scores and fought for amphibian performers.',
    collectible:
      'The original gatefold credits a different songwriter than the reissue.',
    clueFlag: 'album-proof-velvet-crypt',
    artUrl: null,
  },
  {
    id: 'night-creatures',
    year: 1986,
    title: 'Night Creatures',
    movement: 'Stadium Monsters',
    sound:
      'Chrome, lasers, giant synthesizers and spectacular music television.',
    performers: [
      'Draculina',
      'Roxie Lupin',
      'Francesca Stein',
      'Dr. Vespa Vane',
    ],
    removed: 'Nefertari',
    replacement: 'Dr. Vespa Vane',
    officialStory: 'Nefertari took a well-earned fashion sabbatical.',
    actualHistory:
      'Her executives believed a mummy could not move records on MTV.',
    reinvention: 'She built a highly successful couture and perfume empire.',
    collectible: 'An early press kit retains Nefertari on the royalty roster.',
    clueFlag: 'album-proof-night-creatures',
    artUrl: null,
  },
  {
    id: 'silver-bite',
    year: 1994,
    title: 'Silver Bite',
    movement: 'The Motel Years',
    sound:
      'Raw alternative rock, defiant performances and rain-soaked publicity.',
    performers: ['Roxie Lupin', 'Francesca Stein', 'Dr. Vespa Vane', 'Blobzo'],
    removed: 'Draculina',
    replacement: 'Blobzo',
    officialStory: 'A friendly parting after a successful run together.',
    actualHistory:
      'Draculina fought over star billing and ownership of master recordings.',
    reinvention:
      'She returned as a prestige horror actress in her own gothic mansion.',
    collectible: 'A torn tour insert shows the headliner that was removed.',
    clueFlag: 'album-proof-silver-bite',
    artUrl: null,
  },
  {
    id: 'back-from-the-grave',
    year: 2006,
    title: 'Back From the Grave',
    movement: 'The Gothic Comeback',
    sound:
      'Operatic goth-pop, eyeliner, velvet curtains and elaborate stage sets.',
    performers: ['Draculina', 'Roxie Lupin', 'Blobzo', 'Nefertari'],
    removed: 'Dr. Vespa Vane',
    replacement: 'Nefertari',
    officialStory: 'Vespa moved into television by mutual agreement.',
    actualHistory:
      'A leaked interview was recut into a scandal to remove the insect star.',
    reinvention:
      'She became a formidable and very strange late-night personality.',
    collectible:
      'The souvenir programme calls her absence an indefinite hiatus.',
    clueFlag: 'album-proof-back-from-the-grave',
    artUrl: null,
  },
  {
    id: 'blood-moon',
    year: 2017,
    title: 'Blood Moon',
    movement: 'The Idol Machine',
    sound:
      'Immaculate choreography, photocards, lore videos and global fandom.',
    performers: [
      'Draculina',
      'Roxie Lupin',
      'Laguna Brine',
      'Siobhan of the Pack',
    ],
    removed: 'Blobzo',
    replacement: 'Siobhan of the Pack',
    officialStory: 'Blobzo needed a break from the accelerated tour calendar.',
    actualHistory:
      'Executives considered her slime-creature body too unpredictable for idol branding.',
    reinvention:
      'Blobzo became an internet creator with a devoted independent audience.',
    collectible:
      'A rejected photocard sheet still has her name in the fourth slot.',
    clueFlag: 'album-proof-blood-moon',
    artUrl: null,
  },
  {
    id: 'six-decades',
    year: 2024,
    title: 'Six Decades of Screams',
    movement: 'The Legacy Tour',
    sound:
      'Prestige reunion pop, expensive collector vinyl and carefully managed history.',
    performers: ['Draculina', 'Laguna Brine', 'Nefertari', 'New Pack recruit'],
    removed: 'Siobhan of the Pack',
    replacement: 'New Pack recruit',
    officialStory: 'Siobhan was eager to pursue independent tours.',
    actualHistory:
      'Management could not control the shaggy, collared, exuberantly Scottish performer.',
    reinvention:
      'She reassembled the Pack as a raucous were-animal collective.',
    collectible:
      'The expensive early deluxe pressing promises a Siobhan photo insert.',
    clueFlag: 'album-proof-six-decades',
    artUrl: null,
  },
]
