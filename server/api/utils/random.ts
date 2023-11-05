export const adjectives = [
  'Joyful',
  'Cheerful',
  'Delightful',
  'Playful',
  'Kindly',
  'Radiant',
  'Sunny',
  'Laughing',
  'Bubbly',
  'Whimsical',
  'Friendly',
  'Sparkly',
  'Blossoming',
  'Breezy',
  'Lively',
  'Jubilant',
  'Calm',
  'Happy',
  'Blissful',
  'Soothing',
];

export const nouns = [
  'Art',
  'Canvas',
  'Mosaic',
  'Masterpiece',
  'Palette',
  'Sketch',
  'Portrait',
  'Sculpture',
  'Mural',
  'StillLife',
  'Gallery',
  'Exhibit',
  'Display',
  'Scene',
  'Vision',
  'Illusion',
  'Creation',
  'Inspiration',
  'Perspective',
  'Expression',
];

function getRandomElement(array: string[]): string {
  return array[Math.floor(Math.random() * array.length)];
}

export function randomPhrase(): string {
  return `${getRandomElement(adjectives)} ${getRandomElement(nouns)}`;
}
