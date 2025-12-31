// stores/utils/dungeonEncounter.ts

export function randomChoice<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export function useDungeonEncounter(count: number): string {
  const locations = [
    'a dark cavern',
    'a crumbling wizard tower',
    'a cursed forest clearing',
    'a mossy stone dungeon',
    'the skeleton king’s crypt',
    'a bottomless oubliette',
    'a hall of talking mirrors',
    'a fungus-filled mine',
    'an ancient library of forbidden tomes',
    'a portal room humming with unstable magic',
    'a bridge of sighs over bubbling lava',
    'a banquet hall where no one has aged',
    'a forgotten temple guarded by riddles',
    'a mausoleum with whispering walls',
    'a room full of floating chairs',
    'a spiral staircase that loops forever',
    'an alchemy lab turned sentient',
    'a wine cellar full of haunted barrels',
    'a giant chessboard with missing knights',
    'a wishing well that only takes IOUs',
  ]

  const monsters = [
    'gelatinous cube',
    'angry mimic',
    'kobold squad',
    'enchanted scarecrow',
    'giant eyeball with wings',
    'sassy ghost',
    'lava slug',
    'sentient book swarm',
    'crypt lich with a bad attitude',
    'goblin bard playing aggressively off-key tunes',
    'possessed suit of armor doing yoga',
    'rat king that speaks in rhyme',
    'shadow beast with stage fright',
    'undead accountant tallying souls',
    'dragon with amnesia and a craving for tea',
    'invisible mime who makes very real walls',
    'skeleton juggler with flaming skulls',
    'orc poet reciting bad haiku',
    'banshee whose scream is auto-tuned',
    'wizard frog guarding a single gold coin',
  ]

  const treasures = [
    'a glowing orb of unknown purpose',
    'a rusty key labeled “DO NOT USE”',
    'a potion that smells like strawberries and doom',
    'a map that keeps changing when you blink',
    'a sword with a name and opinions',
    'a pouch of infinite glitter',
    'boots that squeak louder the faster you run',
    'a talking gemstone who won’t stop narrating',
    'a cursed kazoo that summons ducks',
    'a cloak that turns you invisible… but only your clothes',
    'a monocle that reveals people’s regrets',
    'a backpack that hums lullabies',
    'a mirror that shows your inventory instead of your reflection',
    'a sentient sandwich that refuses to be eaten',
    'a wand that casts spells... in pig Latin',
    'a scroll that tells dad jokes when opened',
    'a tiny door that fits no wall',
    'a box of enchanted bingo chips',
    'a set of teeth that chatter when lies are told nearby',
    'a mysterious vial labeled “backstory enhancer”',
  ]

  if (count === 0) {
    return `🧭 You enter ${randomChoice(locations)}, encounter ${randomChoice(monsters)}, and discover ${randomChoice(treasures)}.`
  } else {
    return `📜 You've returned to ${randomChoice(locations)}. The ${randomChoice(monsters)} remembers you. But this time, ${randomChoice(treasures)} hums in recognition.`
  }
}
