// /stores/utils/randomName.ts

export const nameList = [
  // Classic
  'Alexander',
  'Charlotte',
  'Benjamin',
  'Eleanor',
  'Henry',
  'Victoria',
  'Margaret',
  'Oliver',
  'Sophia',
  'William',

  // Fantasy
  'Arwen',
  'Eldrin',
  'Lyric',
  'Thalion',
  'Zyra',
  'Kael',
  'Soraya',
  'Fenwick',
  'Isolde',
  'Ronan',

  // Modern/Trendy
  'Ava',
  'Liam',
  'Mason',
  'Harper',
  'Noah',
  'Emery',
  'Zoey',
  'Grayson',
  'Peyton',
  'Ryder',

  // Whimsical
  'Fig',
  'Juniper',
  'Mochi',
  'Pippin',
  'Sprout',
  'Wren',
  'Sunny',
  'Basil',
  'Maple',
  'Echo',

  // Quirky
  'Pickle',
  'Banjo',
  'Ziggy',
  'Doodle',
  'Nimbus',
  'Mittens',
  'Churro',
  'Cricket',
  'Snickers',
  'Bubbles',

  // Historical
  'Ada',
  'Beatrix',
  'Clementine',
  'Edgar',
  'Florence',
  'Leonardo',
  'Oscar',
  'Ruth',
  'Theodore',
  'Wilhelmina',

  // Animal-Inspired
  'Bear',
  'Wolf',
  'Fawn',
  'Fox',
  'Raven',
  'Otter',
  'Hawk',
  'Tiger',
  'Sparrow',
  'Panther',

  // Mythological
  'Athena',
  'Apollo',
  'Diana',
  'Freya',
  'Hermes',
  'Loki',
  'Nyx',
  'Orion',
  'Selene',
  'Zephyr',

  // Nature-Inspired
  'Cedar',
  'Lake',
  'Ash',
  'River',
  'Flora',
  'Meadow',
  'Sky',
  'Stone',
  'Willow',
  'Rain',

  // Sci-Fi
  'Nova',
  'Zion',
  'Kylo',
  'Aria',
  'Soren',
  'Juno',
  'Axel',
  'Orion',
  'Vega',
  'Neo',
]

export function randomName(): string {
  return nameList[Math.floor(Math.random() * nameList.length)]
}
