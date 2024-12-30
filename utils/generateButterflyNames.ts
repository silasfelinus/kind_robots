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
  'Sprout', 'Frisbee', 'Hopper', 'Wiggle Muffin', 'Doodle Fluff', 'Captain Jiggly', 'Snoozy McGee', 
  'Flopsy Wobble', 'Blinky Blink', 'Mr. Bumble', 
  'Snuggle Puff', 'Twixie', 'Fluffy Noodles', 'Ziggy Zoom', 'Captain Jellybean', 'Whiskers McPuff', 
  'Chuckle Bunny', 'Fizz Whistle', 'Dizzy Doodle', 'Captain Snuggles', 'Squishy Pop', 'Twizzle', 
  'Giddy Giggles', 'Fluffy Fizz', 'Wiggly Toes', 'Sir Quackers', 'Twitchy Tail', 'Sparkle Puff', 
  'Dr. Zippy', 'Sir Tootles', 'Buttercup Boom', 'Pudding Pop', 'Flap Flop', 'Whizzy', 'Captain Paws', 
  'Mister Wobble', 'Nibbly Noodles', 'Glitter Puff', 'Sir Jumpy', 'Bingo Bango', 'Frolic Feather', 
  'Captain Zinger', 'Twizzle Womp', 'Captain Cuddlebug', 'Sir Fluffington', 'Whisker Snap', 
  'Squiggly Wump', 'Boogie Woof', 'Mister Fizz', 'Captain Twizzle', 'Dapper McDoodle', 'Sir Sparky', 
  'Twitchy McGee', 'Captain Tootles', 'Wiggle Bop', 'Snoozy Snap', 'Sir Bubbles', 'Fizzy Wiggle', 
  'Whiskers Wiggle', 'Rumble Puff', 'Captain Jumpy', 'Giggle Feathers', 'Ziggy Zoomer', 'Captain Sprout', 
  'Squeaky Fluff', 'Sparky Swoosh', 'Floppy McFuzz', 'Sir Tumble', 'Captain Fizzle', 'Jolly Jumper', 
  'Quirky Fluff', 'Captain Nibbles', 'Fluffy Snoot', 'Snuggle Snoot', 'Sir Waddle', 'Captain Frolic', 
  'Glitter Fizz', 'Puddle Pop', 'Twitchy Spark', 'Boogie Puff', 'Captain Zoom Zoom', 'Snoozy Tumbles', 
  'Sir Fluffy Tail', 'Whisker Womp', 'Captain Flip Flop', 'Dizzy Puff', 'Jolly Snuggles', 'Captain Waddle', 
  'Giggle Puff', 'Sir Wiggleworth', 'Blinky Womp', 'Snuggly Snap', 'Wiggle Woof', 'Sparky Zoom', 
  'Captain Fizzpop', 'Fuzzy Wiggles', 'Sir Hopscotch', 'Captain Huggles', 'Flippy Doodle', 
  'Dizzy Bop', 'Fluffy Zapper', 'Sir Tummy', 'Twinkle Wiggle', 'Captain Featherflop', 'Wibbly Wobbly', 
  'Sir Puddles', 'Captain Glimmer', 'Jelly Flop', 'Snuggle Puff'
];


// Fallback generator using adjectives and animals
const adjectives = ['Silly', 'Happy', 'Wiggly', 'Fluffy', 'Dizzy', 'Lazy', 'Spunky', 'Sparky']
const animals = ['Panda', 'Koala', 'Unicorn', 'Dolphin', 'Tiger', 'Sloth', 'Dragon', 'Phoenix']

// Function to generate a new funny name (fallback when preset names are exhausted)
const generateNewFunnyName = (): string => {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)]
  const animal = animals[Math.floor(Math.random() * animals.length)]
  return `${adjective} ${animal} ${Date.now()}` // Unique fallback name
}

// Function to generate a funny name, excluding those already in use
export const generateFunnyName = (usedNames: string[]): string => {
  // Filter out names that are already in use
  const availableNames = presetNames.filter(name => !usedNames.includes(name))

  if (availableNames.length > 0) {
    // Select a random available name
    return availableNames[Math.floor(Math.random() * availableNames.length)]
  }

  // If no preset names are left, generate a fallback name
  return generateNewFunnyName()
}
