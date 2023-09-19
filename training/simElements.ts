export interface elementData {
  title: string // the title of the element
  power: number // how much it does in damage to a weak enemy
  speed: number // the likelihood of it having a move on a given round
  health: number // the starting health of each spawn
  spawn: number // how many will spawn on generate.
  aggression: number // on a scale of 1 (flight) to 10 (fight), odds of running away versus bullying
  spawnIcon: string // for the score display of number spawned still alive
  gameIcon: string // the icon used to represent an element in game
  toggleIcon: string // the icon to toggle the element for game use.
  strengths: string[] // titles the element can attack
  weaknesses: string[] // titles the element takes damage from
}

export const elements: elementData = [
  {
    title: 'Rock',
    power: 10,
    speed: 1,
    health: 10,
    spawn: 5,
    aggression: 5,
    spawnIcon: 'fluent-emoji-flat:rock',
    gameIcon: 'game-icons:rock',
    toggleIcon: 'fa:hand-rock-o',
    strengths: ['Scissors', 'Lizard'],
    weaknesses: ['Paper', 'Spock']
  },
  {
    title: 'Paper',
    power: 10,
    speed: 1,
    health: 10,
    spawn: 5,
    aggression: 5,
    spawnIcon: 'icon-park:paper-ship',
    gameIcon: 'icon-park-outline:paper-ship',
    toggleIcon: 'akar-icons:paper',
    strengths: ['Rock', 'Spock'],
    weaknesses: ['Scissors', 'Lizard']
  },
  {
    title: 'Scissors',
    power: 10,
    speed: 1,
    health: 10,
    aggression: 5,
    spawn: 5,
    spawnIcon: 'emojione-v1:scissors',
    gameIcon: 'heroicons:scissors-solid',
    toggleIcon: 'humbleicons:scissors',
    strengths: ['Paper', 'Lizard'],
    weaknesses: ['Rock', 'Spock']
  },
  {
    title: 'Lizard',
    power: 10,
    speed: 1,
    health: 10,
    aggression: 5,
    spawn: 5,
    spawnIcon: 'twemoji:lizard',
    gameIcon: 'emojione-monotone:lizard',
    toggleIcon: 'fa6-solid:hand-lizard',
    strengths: ['Spock', 'Paper'],
    weaknesses: ['Rock', 'Scissors']
  },
  {
    title: 'Spock',
    power: 10,
    speed: 1,
    health: 10,
    aggression: 5,
    spawn: 5,
    spawnIcon: 'solar:ufo-2-bold-duotone',
    gameIcon: 'game-icons:spock-hand',
    toggleIcon: 'fa:hand-spock-o',
    strengths: ['Scissors', 'Rock'],
    weaknesses: ['Lizard', 'Paper']
  }
]
