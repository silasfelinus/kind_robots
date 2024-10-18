// generateButterflyNames.ts

const presetNames = [
  'Spike', 'Lawrence', 'Tiffany', 'Grognar', 'Grover', 'Lemmon', 'Penelope', 'Princess Buzzsaw',
  'Madame Fifi', 'Amanpreet', 'Mitch', 'Curly', 'Bozo', 'Serendipity', 'AMI', 'Teddy', 'Lemonade', 
  'Tinkerblaze', 'Aaaaaagh', 'Captain Fizz', 'Dizzy McTwist', 'Professor Bubbles', 'Sir Wigglesworth', 
  'Lady Fluffernutter', 'Major Giggles', 'Ziggy Stardust', 'Whiskers the Brave', 'Flapjack', 'Bamboozle', 
  'Funky Doodle', 'Captain Cuddles', 'Lord Hoppington', 'Princess Buttercup', 'Dr. Zoom', 'Squeezy', 
  'Frizzle', 'Sunny Daze', 'Gigglepotamus', 'Sir Fuzzyboots', 'Wobblebottom', 'Quasar', 'Chuckleberry', 
  'Zapper', 'Squiggle', 'Fluffy Toes', 'Captain Whiskers', 'Fizzletop', 'Sir Nibbles', 'Sprinkles', 
  'Whizbang', 'Snicker Doodle', 'Fuzzbucket', 'Zippy', 'Puffin', 'Glitterbug', 'Razzle Dazzle', 
  'Sir Fluffernoodle', 'Tater Tot', 'Chewy McChomp', 'Twinkle Toes', 'Wiggly Wompus', 'Chubby Cheeks', 
  'Noodle', 'Cuddle Muffin', 'Sprinkle Star', 'Wobblebutt', 'Gizmo', 'Sparky McGlow', 'Captain Boombox', 
  'Lollipop', 'Peaches', 'Buzz Lightwing', 'Fizzy Pop', 'Sir Snugglepuff', 'Doodlebug', 'Tater Muffin', 
  'Waffles', 'Mister Wiggles', 'Glitter Pants', 'Boogaloo', 'Jellybean', 'Dinky', 'Sir Snuggles', 
  'Popcorn', 'Bumblebee', 'Rumble McThunder', 'Squishy', 'Sir Swoosh', 'Captain Featherpants', 
  'Zigzag', 'Twisty', 'Bubbles', 'Frodo Fluff', 'Tango', 'Blip', 'Captain Sparklepants', 'Zappy', 
  'Sprout', 'Frisbee', 'Hopper', 'Wiggle Muffin'
];


// Track used names to avoid duplication
const usedNames = new Set<string>()

// Fallback generator using adjectives and animals
const adjectives = ['Silly', 'Happy', 'Wiggly', 'Fluffy', 'Dizzy', 'Lazy', 'Spunky', 'Sparky']
const animals = ['Panda', 'Koala', 'Unicorn', 'Dolphin', 'Tiger', 'Sloth', 'Dragon', 'Phoenix']

// Function to generate a new funny name (fallback when preset names are exhausted)
const generateNewFunnyName = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${adjective} ${animal} ${Date.now()}`
}

// Function to generate a funny name
export const generateFunnyName = (): string => {
  // Filter out names that have already been used
  const availableNames = presetNames.filter(name => !usedNames.has(name))

  if (availableNames.length > 0) {
    // Select a random available name
    const name = availableNames[Math.floor(Math.random() * availableNames.length)]
    usedNames.add(name)
    return name
  }

  // If no preset names are left, generate a new one
  const newName = generateNewFunnyName()
  usedNames.add(newName)
  return newName
}
