import type { MandarinCard } from './mandarin'
import { homophoneKey } from './mandarinLesson'

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
  drifted: boolean
}

export function buildMandarinSoundFamilies(
  cards: readonly MandarinCard[],
): MandarinSoundFamilyGroup[] {
  const buckets = new Map<string, Map<string, MandarinCard>>()

  for (const card of cards) {
    for (const component of card.components) {
      if (component.role !== 'phonetic' || !component.glyph.trim()) continue
      const bucket = buckets.get(component.glyph) ?? new Map<string, MandarinCard>()
      bucket.set(card.key, card)
      buckets.set(component.glyph, bucket)
    }
  }

  return [...buckets.entries()]
    .map(([phonetic, memberMap]) => {
      const members = [...memberMap.values()]
        .map((card) => ({
          key: card.key,
          simplified: card.simplified,
          pinyin: card.pinyin,
          meaning: card.meaning,
        }))
        .sort((a, b) => a.simplified.localeCompare(b.simplified, 'zh-Hans-CN'))
      const readings = [...new Set(members.map((member) => homophoneKey(member.pinyin)).filter(Boolean))]
      return {
        phonetic,
        members,
        readings,
        drifted: readings.length > 1,
      }
    })
    .filter((family) => family.members.length > 1)
    .sort((a, b) => b.members.length - a.members.length || a.phonetic.localeCompare(b.phonetic, 'zh-Hans-CN'))
}
