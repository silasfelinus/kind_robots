// /utils/tzaddikTags.ts
import { TzaddikEditorialTag } from '~/prisma/generated/prisma/browser'

export const TZADDIK_TAG_ORDER: TzaddikEditorialTag[] = [
  TzaddikEditorialTag.POLITICS,
  TzaddikEditorialTag.POP_CULTURE,
  TzaddikEditorialTag.HUMANITARIAN,
  TzaddikEditorialTag.SCIENCE_MEDICINE,
  TzaddikEditorialTag.EDUCATION,
  TzaddikEditorialTag.ENVIRONMENT,
  TzaddikEditorialTag.CIVIL_RIGHTS_JUSTICE,
  TzaddikEditorialTag.PEACE_DIPLOMACY,
  TzaddikEditorialTag.COMMUNITY_MUTUAL_AID,
  TzaddikEditorialTag.ARTS_CULTURE,
  TzaddikEditorialTag.JOURNALISM_TRUTH,
  TzaddikEditorialTag.COURAGE_RESCUE,
]

export const TZADDIK_TAG_LABELS: Record<TzaddikEditorialTag, string> = {
  POLITICS: 'Politics',
  POP_CULTURE: 'Pop Culture',
  HUMANITARIAN: 'Humanitarian',
  SCIENCE_MEDICINE: 'Science & Medicine',
  EDUCATION: 'Education',
  ENVIRONMENT: 'Environment',
  CIVIL_RIGHTS_JUSTICE: 'Civil Rights & Justice',
  PEACE_DIPLOMACY: 'Peace & Diplomacy',
  COMMUNITY_MUTUAL_AID: 'Community & Mutual Aid',
  ARTS_CULTURE: 'Arts & Culture',
  JOURNALISM_TRUTH: 'Journalism & Truth',
  COURAGE_RESCUE: 'Courage & Rescue',
}

export function tzaddikTagLabel(tag: TzaddikEditorialTag): string {
  return TZADDIK_TAG_LABELS[tag] ?? tag
}

export function sortedTzaddikTags(
  tags: TzaddikEditorialTag[],
): TzaddikEditorialTag[] {
  const order = new Map(TZADDIK_TAG_ORDER.map((tag, index) => [tag, index]))
  return [...tags].sort((a, b) => (order.get(a) ?? 0) - (order.get(b) ?? 0))
}
