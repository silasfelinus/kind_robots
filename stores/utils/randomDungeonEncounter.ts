// stores/utils/randomDungeonEncounter.ts

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
]

export function dungeonEncounter() {
  const place = locations[Math.floor(Math.random() * locations.length)]
  const foe = monsters[Math.floor(Math.random() * monsters.length)]
  const loot = treasures[Math.floor(Math.random() * treasures.length)]

  return `🗺️ You enter ${place}, encounter ${foe}, and discover ${loot}.`
}
