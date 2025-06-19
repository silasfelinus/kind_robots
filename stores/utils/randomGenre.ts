export const genreList = [
  // Classic Genres
  'Fantasy',
  'Sci-Fi',
  'Steampunk',
  'Post-Apocalyptic',
  'Cyberpunk',
  'Space Opera',
  'Mystery',
  'Thriller',
  'Romance',
  'Western',

  // Modern and Niche Genres
  'Urban Fantasy',
  'Superhero',
  'Horror Comedy',
  'Dark Academia',
  'Dieselpunk',
  'Eco-Fiction',
  'Cli-Fi (Climate Fiction)',
  'Alternate History',
  'Time Travel',
  'Retro-Futurism',

  // Whimsical and Fun
  'Fairy Tale',
  'Magical Realism',
  'Absurdist Comedy',
  'Pirate Adventure',
  'Dreamlike Surrealism',
  'Monster Romance',
  'Cartoon Noir',
  'Whimsical Stew',
  'Space Pirates',
  'Mythpunk',

  // Dark and Gritty
  'Grimdark Fantasy',
  'Gothic Horror',
  'Noir Thriller',
  'Post-Human Dystopia',
  'Lovecraftian Horror',
  'Vampire Gothic',
  'Dystopian Romance',
  'Psychological Horror',
  'Cosmic Horror',
  'Crime Noir',

  // Sci-Fi Subgenres
  'Hard Science Fiction',
  'Biopunk',
  'Nanopunk',
  'Solarpunk',
  'Astrobiological Adventure',
  'AI Utopia',
  'Martian Colonization',
  'First Contact',
  'Alien Invasion',
  'Techno-Thriller',

  // Fantasy Subgenres
  'High Fantasy',
  'Low Fantasy',
  'Sword and Sorcery',
  'Epic Fantasy',
  'Heroic Fantasy',
  'Gaslamp Fantasy',
  'Dark Fairy Tale',
  'Weird Fantasy',
  'Cozy Fantasy',
  'Medieval Fantasy',

  // Experimental and Mixed Genres
  'Science Fantasy',
  'Historical Fantasy',
  'Horror Fantasy',
  'Science Romance',
  'Mystery Sci-Fi',
  'Fantasy Noir',
  'Musical Adventure',
  'Epistolary Fiction',
  'Interactive Fiction',
  'Metafiction',

  // Cultural and Regional
  'Afrofuturism',
  'Asian Fantasy',
  'Celtic Mythology',
  'Indigenous Futurism',
  'Nordic Noir',
  'Latin American Magical Realism',
  'Eastern European Folklore',
  'Oceanic Mythology',
  'African Mythpunk',
  'Arabian Nights Redux',
]

export function randomGenre(): string {
  return genreList[Math.floor(Math.random() * genreList.length)]
}
