export function generateUsername(): string {
  const adjectives = [
    'adventurous', 'ambitious', 'amusing', 'artistic', 'auspicious',
    'blissful', 'bold', 'brave', 'bright', 'calm', 'charming', 'cheerful',
    'clever', 'colorful', 'compassionate', 'confident', 'creative', 'curious',
    'daring', 'dazzling', 'delightful', 'dynamic', 'eager', 'earnest',
    'effortless', 'elegant', 'energetic', 'enthusiastic', 'fabulous',
    'fantastic', 'fearless', 'fluffy', 'friendly', 'gentle', 'gleeful',
    'glorious', 'graceful', 'gracious', 'happy', 'helpful', 'hilarious',
    'honest', 'hopeful', 'imaginative', 'inspiring', 'inventive', 'jolly',
    'joyful', 'kind', 'lively', 'loyal', 'lucky', 'majestic', 'marvelous',
    'nimble', 'optimistic', 'peaceful', 'playful', 'polished', 'positive',
    'powerful', 'praiseworthy', 'precious', 'proud', 'quirky', 'radiant',
    'remarkable', 'resilient', 'resourceful', 'serene', 'shining', 'smart',
    'spirited', 'splendid', 'strong', 'stunning', 'stylish', 'supportive',
    'talented', 'thoughtful', 'thrilling', 'trustworthy', 'unique', 'upbeat',
    'vibrant', 'victorious', 'vigorous', 'warmhearted', 'whimsical', 'wise',
    'witty', 'wonderful', 'zany', 'zealous', 'charismatic', 'dedicated',
    'resolute', 'fascinating', 'endearing', 'joyous', 'meticulous',
    'harmonious', 'pioneering', 'practical', 'sincere', 'tenacious',
    'tranquil', 'visionary', 'zesty', 'sublime', 'brilliant', 'radiating',
    'magical', 'majestic', 'robust', 'jubilant', 'focused', 'engaging',
  ];

  const animals = [
    'albatross', 'antelope', 'armadillo', 'badger', 'beaver', 'bison', 'buffalo',
    'butterfly', 'camel', 'caribou', 'cat', 'chameleon', 'cheetah', 'cobra',
    'cougar', 'crane', 'deer', 'dingo', 'dolphin', 'donkey', 'eagle', 'elephant',
    'falcon', 'ferret', 'flamingo', 'fox', 'frog', 'gazelle', 'giraffe', 'goose',
    'hedgehog', 'heron', 'horse', 'hummingbird', 'hyena', 'ibis', 'iguana',
    'jaguar', 'kangaroo', 'koala', 'kudu', 'lemur', 'leopard', 'lion', 'lynx',
    'magpie', 'meerkat', 'mongoose', 'moose', 'narwhal', 'ocelot', 'octopus',
    'orca', 'otter', 'owl', 'panda', 'panther', 'parrot', 'peacock', 'penguin',
    'platypus', 'porcupine', 'puffin', 'quail', 'rabbit', 'raccoon', 'raven',
    'seal', 'shark', 'sloth', 'sparrow', 'swan', 'tiger', 'toad', 'toucan',
    'turtle', 'walrus', 'weasel', 'whale', 'wolf', 'wombat', 'yak', 'zebra',
    'gecko', 'coyote', 'pelican', 'tamarin', 'ermine', 'otter', 'starling',
    'jackal', 'egret', 'python', 'basilisk', 'ibex', 'okapi', 'cassowary',
  ];

  const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const randomAnimal = animals[Math.floor(Math.random() * animals.length)];

  return `${randomAdjective}-${randomAnimal}`;
}
