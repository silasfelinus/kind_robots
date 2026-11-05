import type { MandarinCard } from './mandarin'
import {
  cardCharacters,
  characterReadingInCard,
  componentCharacter,
} from './mandarinLesson'

export type MandarinSoundFamilyMember = {
  key: string
  simplified: string
  pinyin: string
  meaning: string
}

export type MandarinSoundFamilyGroup = {
  phonetic: string
  members: MandarinSoundFamilyMember[]
  readings: string[]
  /** Distinct current Hanzi syllables, not evidence of a dated sound change. */
  drifted: boolean
}

export function buildMandarinSoundFamilies(
  cards: readonly MandarinCard[],
): MandarinSoundFamilyGroup[] {
  const buckets = new Map<
    string,
    Map<string, { card: MandarinCard; reading: string }>
  >()

  for (const card of cards) {
    const written = cardCharacters(card.simplified)
    for (const component of card.components) {
      if (component.role !== 'phonetic' || !component.glyph.trim()) continue
      const character = componentCharacter(component, written)
      if (!character) continue
      const reading = characterReadingInCard(card, character)
      if (!reading) continue
      const bucket = buckets.get(component.glyph) ?? new Map()
      const previous = bucket.get(character)
      // A phonetic series is about DIFFERENT characters, not 15 phrases
      // containing the same 有. Prefer standalone character cards as examples.
      if (
        !previous ||
        written.length < cardCharacters(previous.card.simplified).length
      ) {
        bucket.set(character, { card, reading })
      }
      buckets.set(component.glyph, bucket)
    }
  }

  return [...buckets.entries()]
    .map(([phonetic, entries]) => {
      const representatives = [...entries.values()]
      const members = representatives
        .map(({ card }) => ({
          key: card.key,
          simplified: card.simplified,
          pinyin: card.pinyin,
          meaning: card.meaning,
        }))
        .sort((a, b) =>
          a.simplified.localeCompare(b.simplified, 'zh-Hans-CN'),
        )
      const readings = [
        ...new Set(representatives.map(({ reading }) => reading)),
      ]
      return {
        phonetic,
        members,
        readings,
        drifted: readings.length > 1,
      }
    })
    .filter((family) => family.members.length > 1)
    .sort(
      (a, b) =>
        b.members.length - a.members.length ||
        a.phonetic.localeCompare(b.phonetic, 'zh-Hans-CN'),
    )
}
