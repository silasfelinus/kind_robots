import { ref } from 'vue';

const adjectives = [
  'Adventurous',
  'Bouncy',
  'Curious',
  'Dazzling',
  'Eccentric',
  'Fluffy',
  'Graceful',
  'Hilarious',
  'Ingenious',
  'Jolly',
  'Kindhearted',
  'Lively',
  'Majestic',
  'Nimble',
  'Optimistic',
  'Playful',
  'Quirky',
  'Radiant',
  'Spirited',
  'Tender',
  'Unique',
  'Vibrant',
  'Whimsical',
  'Xenodochial',
  'Youthful',
  'Zany',
];

const nouns = [
  'Albatross',
  'Butterfly',
  'Chameleon',
  'Dolphin',
  'Elephant',
  'Flamingo',
  'Giraffe',
  'Hedgehog',
  'Iguana',
  'Jellyfish',
  'Kangaroo',
  'Lemur',
  'Meerkat',
  'Narwhal',
  'Octopus',
  'Panda',
  'Quokka',
  'Raccoon',
  'Seahorse',
  'Tiger',
  'Uakari',
  'Viper',
  'Walrus',
  'Xerus',
  'Yak',
  'Zebra',
];

const titles = [
  'the Amiable',
  'the Brilliant',
  'the Courageous',
  'the Daring',
  'the Enigmatic',
  'the Fearless',
  'the Generous',
  'the Humble',
  'the Imaginative',
  'the Joyful',
  'the Kind',
  'the Luminous',
  'the Marvelous',
  'the Noble',
  'the Outstanding',
  'the Persuasive',
  'the Quixotic',
  'the Resilient',
  'the Serendipitous',
  'the Tenacious',
  'the Unstoppable',
  'the Victorious',
  'the Wise',
  'the Xanthous',
  'the Youthful',
  'the Zealous',
];

export function generateSillyName() {
  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];
  const randomTitle = titles[Math.floor(Math.random() * titles.length)];

  return `${randomAdjective} ${randomNoun} ${randomTitle}`;
}

export function useSillyNameGenerator() {
  const sillyName = ref('');

  function generateAndSetSillyName() {
    sillyName.value = generateSillyName();
  }

  generateAndSetSillyName();

  return {
    sillyName,
    generateAndSetSillyName,
  };
}
export function useRandomName() {
  const sillyName = ref('');

  function generateAndSetSillyName() {
    sillyName.value = generateSillyName();
  }

  generateAndSetSillyName();

  return {
    value: sillyName.value,
    generateAndSetSillyName,
  };
}
