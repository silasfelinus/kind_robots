export const adjectiveList = [
  // Heroic / Fantasy
  'brave',
  'mighty',
  'cunning',
  'radiant',
  'valiant',
  'noble',
  'ancient',
  'fearless',
  'enchanted',
  'shadowy',

  // Sci-Fi / Futuristic
  'quantum',
  'synthetic',
  'glitching',
  'stellar',
  'neural',
  'holographic',
  'interstellar',
  'zero-gravity',
  'protocol-based',
  'retrofitted',

  // Whimsical / Odd
  'bubbly',
  'plucky',
  'dizzy',
  'sparkly',
  'grumbly',
  'technicolor',
  'surprisingly average',
  'slightly squeaky',
  'gilded-but-unimpressed',
  'mildly haunted',

  // Noir / Mystery
  'smoky',
  'jaded',
  'hardboiled',
  'gritty',
  'sleek',
  'detached',
  'downtrodden',
  'cryptic',
  'two-faced',
  'coated-in-regret',

  // Spooky / Cursed
  'haunted',
  'twisted',
  'vile',
  'forgotten',
  'cursed',
  'shimmering-but-wrong',
  'withered',
  'lingering',
  'phantasmal',
  'void-touched',
]

export function randomAdjective(): string {
  return adjectiveList[Math.floor(Math.random() * adjectiveList.length)]
}
