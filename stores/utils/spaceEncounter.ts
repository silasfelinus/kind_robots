// stores/utils/spaceEncounter.ts

import { randomItem } from './randomItem'

export function spaceEncounter(count: number): string {
  const ships = [
    'a suspiciously smooth alien cruiser',
    'an abandoned escape pod orbiting nothing',
    'a vending machine satellite blinking “HELP”',
    'a freighter filled with existential dread',
    'a karaoke bar drifting through asteroid rings',
    'a diplomatic shuttle staffed entirely by cats',
    'a bio-organic slugship with performance anxiety',
    'a rusty cargo hauler broadcasting lullabies',
    'a spacefaring laundromat stuck in time loop mode',
    'a nebula-tinted observation dome full of jelly',
    'a research vessel designed by committee',
    'a recreational space buoy shaped like a duck',
  ]

  const threats = [
    'a malfunctioning translator bot that only screams',
    'a bureaucratic AI who insists on paperwork',
    'a time anomaly shaped like a jellyfish',
    'a grudge-bearing clone of yourself',
    'a pirate crew obsessed with outdated memes',
    'a smug alien quizmaster who demands trivia battles',
    'a swarm of nano-prophets predicting doom in haiku',
    'a void wraith with a taste for bad decisions',
    'an ancient space god in the shape of a toaster',
    'a rebellious ship engine that thinks it’s a poet',
    'an infestation of gravity crabs in the ducts',
    'a teleportation hiccup that made you two minutes late — and very punchable',
  ]

  const loot = [
    'a plasma fork labeled “experimental”',
    'a crate of glowing beetles',
    'a bootleg star map written in crayon',
    'a data crystal whispering in binary',
    'a friendship bracelet from a parallel timeline',
    'a beverage canister marked “quantum fizz (do not shake)”',
    'a boot full of gravity syrup',
    'an alien plant that hums when insulted',
    'a jigsaw puzzle missing exactly one piece — and it’s YOU',
    'a stolen diplomatic pin from the Galactic Snail Alliance',
    'a helmet that plays elevator music directly into your thoughts',
    'a trading card for a forgotten moon deity',
    'a sidekick application form (approved and already signed)',
    'an AI mood ring that keeps glitching between “mischievous” and “existential”',
  ]

  if (count === 0) {
    return `🚀 You dock at ${randomItem(ships)}, encounter ${randomItem(threats)}, and leave with ${randomItem(loot)}.`
  } else {
    return `🪐 The AI on ${randomItem(ships)} recognizes your transponder code. ${randomItem(threats)} eyes you warily. ${randomItem(loot)} responds to your touch.`
  }
}
