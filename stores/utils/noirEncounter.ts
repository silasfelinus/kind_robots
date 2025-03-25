import { randomItem } from './randomItem'

export function noirEncounter(count: number): string {
  const places = [
    'a rain-soaked alley under neon glow',
    'a diner where the jukebox always plays static',
    'a private office above a noodle bar',
    'a subway tunnel buzzing with broken lights',
  ]

  const characters = [
    'a rogue android with a stiletto smile',
    'a detective who speaks only in code snippets',
    'a glitchy femme fatale flickering out of sync',
    'a mob boss made entirely of discarded hard drives',
  ]

  const clues = [
    'a photo that wasn’t taken yet',
    'a matchbook from a bar that doesn’t exist',
    'a bullet inscribed with your name',
    'a bottle of truth serum with a warning label',
  ]

  if (count === 0) {
    return `🌃 You slip into ${randomItem(places)}, meet ${randomItem(characters)}, and find ${randomItem(clues)}.`
  } else {
    return `💼 ${randomItem(characters)} lights a cigarette and says, “You’ve been here before.” ${randomItem(clues)} pulses in your coat pocket.`
  }
}
