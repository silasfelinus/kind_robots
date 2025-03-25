import { randomItem } from './randomItem'

export function spaceEncounter(count: number): string {
  const ships = [
    'a suspiciously smooth alien cruiser',
    'an abandoned escape pod orbiting nothing',
    'a vending machine satellite blinking “HELP”',
    'a freighter filled with existential dread',
  ]

  const threats = [
    'a malfunctioning translator bot that only screams',
    'a bureaucratic AI who insists on paperwork',
    'a time anomaly shaped like a jellyfish',
    'a grudge-bearing clone of yourself',
  ]

  const loot = [
    'a plasma fork labeled “experimental”',
    'a crate of glowing beetles',
    'a bootleg star map written in crayon',
    'a data crystal whispering in binary',
  ]

  if (count === 0) {
    return `🚀 You dock at ${randomItem(ships)}, encounter ${randomItem(threats)}, and leave with ${randomItem(loot)}.`
  } else {
    return `🪐 The AI on ${randomItem(ships)} recognizes your transponder code. ${randomItem(threats)} eyes you warily. ${randomItem(loot)} responds to your touch.`
  }
}
