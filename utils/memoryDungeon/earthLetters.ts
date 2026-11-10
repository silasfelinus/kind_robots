/** Optional e03/e04 Unsent Letters decisions, isolated from Classic and gallery saves. */
export const LETTER_CHOICES = {
  e03Letter: [
    'earth-letter-deliver',
    'earth-letter-shelve',
    'earth-letter-copy',
  ],
  e03Witness: [
    'earth-witness-ask',
    'earth-witness-refuse',
    'earth-witness-protect',
  ],
  e04Archive: [
    'earth-archive-release',
    'earth-archive-seal',
    'earth-archive-annotate',
  ],
  e04Return: [
    'earth-return-offer',
    'earth-return-decline',
    'earth-return-witness',
  ],
} as const

export type LetterScene = keyof typeof LETTER_CHOICES
export type LetterProgress = {
  version: 1
  decisions: Partial<{ [K in LetterScene]: (typeof LETTER_CHOICES)[K][number] }>
}

const scenes = Object.keys(LETTER_CHOICES) as LetterScene[]

export function newLetterProgress(): LetterProgress {
  return { version: 1, decisions: {} }
}

export function chooseLetter(
  progress: LetterProgress,
  scene: LetterScene,
  choice: string,
): LetterProgress {
  if (!scenes.includes(scene)) return progress
  if (!(LETTER_CHOICES[scene] as readonly string[]).includes(choice))
    return progress
  if (progress.decisions[scene]) return progress
  return {
    version: 1,
    decisions: { ...progress.decisions, [scene]: choice },
  }
}

/** Invalid records are rejected, never silently converted into story outcomes. */
export function restoreLetterProgress(input: unknown): LetterProgress | null {
  if (input == null) return newLetterProgress()
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null
  const raw = input as Record<string, unknown>
  // A save is a JSON record, never a class instance or an extensible payload.
  if (Object.getPrototypeOf(raw) !== Object.prototype) return null
  if (Object.keys(raw).some((key) => key !== 'version' && key !== 'decisions'))
    return null
  if (
    raw.version !== 1 ||
    !raw.decisions ||
    typeof raw.decisions !== 'object' ||
    Array.isArray(raw.decisions)
  )
    return null
  const decisions = raw.decisions as Record<string, unknown>
  if (Object.getPrototypeOf(decisions) !== Object.prototype) return null
  if (
    Object.keys(decisions).some((key) => !scenes.includes(key as LetterScene))
  )
    return null
  for (const scene of scenes) {
    const choice = decisions[scene]
    if (
      Object.hasOwn(decisions, scene) &&
      (typeof choice !== 'string' ||
        !(LETTER_CHOICES[scene] as readonly string[]).includes(choice))
    )
      return null
  }
  return {
    version: 1,
    decisions: { ...decisions } as LetterProgress['decisions'],
  }
}

/** The archive remembers the envelope decision without disclosing its contents. */
export function letterArchiveEcho(progress: LetterProgress): string {
  switch (progress.decisions.e03Letter) {
    case 'earth-letter-deliver':
      return 'A drawer opens for a person who might come back.'
    case 'earth-letter-shelve':
      return 'A date stamped on paper repeats every three days.'
    case 'earth-letter-copy':
      return 'Your phone shows an envelope you never opened.'
    default:
      return 'The cabinet offers no explanation of what you missed.'
  }
}
