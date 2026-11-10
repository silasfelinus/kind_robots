import { chooseLetter, newLetterProgress, type LetterProgress } from './earthLetters'

/**
 * Project the two already-playable library decisions into the optional letter
 * ledger. The Earth journal remains authoritative; never persist a second
 * competing copy of these decisions.
 *
 * Unmapped packet branches stay unset until their actual encounters ship.
 */
export function letterProgressFromEarthChoices(
  e03: Readonly<Record<string, string>>,
  e04: Readonly<Record<string, string>>,
): LetterProgress {
  let progress = newLetterProgress()
  const e03Choice = e03['3,3']
  if (e03Choice === 'care')
    progress = chooseLetter(progress, 'e03Letter', 'earth-letter-shelve')
  else if (e03Choice === 'risk')
    progress = chooseLetter(progress, 'e03Letter', 'earth-letter-copy')

  const e04Choice = e04['3,3']
  if (e04Choice === 'care')
    progress = chooseLetter(progress, 'e04Archive', 'earth-archive-seal')
  else if (e04Choice === 'risk')
    progress = chooseLetter(progress, 'e04Archive', 'earth-archive-release')
  return progress
}
