export type MandarinToneNumber = 1 | 2 | 3 | 4 | 5

export type MandarinToneTarget = {
  syllable: string
  lexicalTone: MandarinToneNumber
  spokenTone: MandarinToneNumber
  label: string
  arrow: string
  note?: string
}

export type MandarinTranscriptComparison = {
  status: 'match' | 'contains' | 'different'
  message: string
}

const TONE_MARKS: Record<string, MandarinToneNumber> = {
  ā: 1,
  ē: 1,
  ī: 1,
  ō: 1,
  ū: 1,
  ǖ: 1,
  á: 2,
  é: 2,
  í: 2,
  ó: 2,
  ú: 2,
  ǘ: 2,
  ǎ: 3,
  ě: 3,
  ǐ: 3,
  ǒ: 3,
  ǔ: 3,
  ǚ: 3,
  à: 4,
  è: 4,
  ì: 4,
  ò: 4,
  ù: 4,
  ǜ: 4,
}

const TONE_LABELS: Record<MandarinToneNumber, { label: string; arrow: string }> = {
  1: { label: '1st tone · high and level', arrow: '→' },
  2: { label: '2nd tone · rising', arrow: '↗' },
  3: { label: '3rd tone · low / dipping', arrow: '↘↗' },
  4: { label: '4th tone · falling', arrow: '↘' },
  5: { label: 'neutral tone · light', arrow: '·' },
}

function toneOfSyllable(syllable: string): MandarinToneNumber {
  const numeric = syllable.match(/([1-5])$/)
  if (numeric?.[1]) return Number(numeric[1]) as MandarinToneNumber

  for (const character of syllable.toLowerCase()) {
    const tone = TONE_MARKS[character]
    if (tone) return tone
  }

  return 5
}

export function parsePinyinToneTargets(pinyin: string): MandarinToneTarget[] {
  const syllables = pinyin
    .trim()
    .split(/[\s'’·-]+/u)
    .map((syllable) => syllable.replace(/[.,!?;:，。！？；：]/gu, '').trim())
    .filter(Boolean)

  const lexical = syllables.map((syllable) => toneOfSyllable(syllable))

  return syllables.map((syllable, index) => {
    const lexicalTone = lexical[index] ?? 5
    const nextTone = lexical[index + 1]
    const thirdToneSandhi = lexicalTone === 3 && nextTone === 3
    const spokenTone: MandarinToneNumber = thirdToneSandhi ? 2 : lexicalTone
    const display = TONE_LABELS[spokenTone]

    return {
      syllable,
      lexicalTone,
      spokenTone,
      label: display.label,
      arrow: display.arrow,
      ...(thirdToneSandhi
        ? {
            note: 'Two third tones meet here, so this syllable is normally pronounced with a rising second-tone shape.',
          }
        : {}),
    }
  })
}

export function normalizeMandarinTranscript(value: string): string {
  return value
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\p{P}\p{S}\s]/gu, '')
}

export function compareMandarinTranscript(input: {
  transcript: string
  simplified: string
  traditional?: string
}): MandarinTranscriptComparison {
  const heard = normalizeMandarinTranscript(input.transcript)
  const accepted = [input.simplified, input.traditional]
    .filter((value): value is string => Boolean(value))
    .map(normalizeMandarinTranscript)
    .filter(Boolean)

  if (accepted.some((target) => heard === target)) {
    return {
      status: 'match',
      message: 'The recognizer heard the target word. That is a strong intelligibility signal; use the tone trace below for the next layer of refinement.',
    }
  }

  if (accepted.some((target) => heard.includes(target))) {
    return {
      status: 'contains',
      message: 'The recognizer heard the target inside a longer utterance. Try it once more as a clean, isolated word so the comparison is less forgiving.',
    }
  }

  return {
    status: 'different',
    message: 'The recognizer heard something different from the target. Treat that as an intelligibility clue, not proof of one specific phonetic error; the pitch guide can separately flag the broad tone shape.',
  }
}
