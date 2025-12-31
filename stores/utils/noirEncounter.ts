// stores/utils/noirEncounter.ts

export function randomChoice<T>(list: T[]): T {
  return list[Math.floor(Math.random() * list.length)]
}

export function useNoirEncounter(count: number): string {
  const places = [
    'a rain-soaked alley under neon glow',
    'a diner where the jukebox always plays static',
    'a private office above a noodle bar',
    'a subway tunnel buzzing with broken lights',
    'an elevator that never reaches its floor',
    'a synth-jazz bar beneath a parking garage',
    'a monorail terminal at 3:33 a.m.',
    'a rooftop garden where nothing grows',
    'an abandoned VR parlor looping a 90s sitcom',
    'a memory market inside a forgotten phone booth',
    'a loading dock full of leaking neon barrels',
    'a cyber-cat café with no cats',
  ]

  const characters = [
    'a rogue android with a stiletto smile',
    'a detective who speaks only in code snippets',
    'a glitchy femme fatale flickering out of sync',
    'a mob boss made entirely of discarded hard drives',
    'a beat poet with a retinal scanner',
    'a bounty hunter with coffee-stained gloves',
    'a replicant with amnesia and a badge',
    'a con artist who sells counterfeit feelings',
    'a lounge singer with backup memory drives',
    'a neural therapist who always lies',
    'a freelance glitch witch in a trenchcoat',
  ]

  const clues = [
    'a photo that wasn’t taken yet',
    'a matchbook from a bar that doesn’t exist',
    'a bullet inscribed with your name',
    'a bottle of truth serum with a warning label',
    'a credit chip that screams when scanned',
    'a flash drive full of corrupted lullabies',
    'a bootleg memory labeled “do not play”',
    'a subway token carved from obsidian',
    'a napkin sketch of a dream you forgot',
    'a torn page from a noir novel still being written',
    'a receipt for time travel, one-way only',
    'a lipstick-stained coffee cup filled with ash',
    'a business card that changes names every hour',
    'a dossier marked “REDACTED,” filled with poetry',
    'a fortune cookie that predicts your downfall',
  ]

  if (count === 0) {
    return `🌃 You slip into ${randomChoice(places)}, meet ${randomChoice(characters)}, and find ${randomChoice(clues)}.`
  } else {
    return `💼 ${randomChoice(characters)} lights a cigarette and mutters, “You’ve been here before.” ${randomChoice(clues)} pulses in your coat pocket.`
  }
}
