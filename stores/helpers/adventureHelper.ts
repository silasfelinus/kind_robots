// /stores/helpers/adventureHelper.ts
import type {
  BuilderRewardOption,
  BuilderSheet,
  BuilderStatEntry,
} from '@/stores/helpers/builderCards'
import type { RolledReward } from '@/stores/generatorStore'
import type { Rarity } from '@/stores/rewardStore'

export const ADVENTURE_CORE_CARD_KEYS = [
  'role',
  'name',
  'origin',
  'identity',
  'personality',
  'stats',
  'background',
]

export const ADVENTURE_REQUIRED_CARD_KEYS = [
  ...ADVENTURE_CORE_CARD_KEYS,
  'common-skill',
  'uncommon-skill',
  'rare-skill',
]

export const ADVENTURE_SKILL_RARITY: Record<string, Rarity> = {
  'common-skill': 'COMMON',
  'uncommon-skill': 'UNCOMMON',
  'rare-skill': 'RARE',
}

export function adventureRewardToBuilderOption(
  reward: RolledReward,
): BuilderRewardOption {
  return {
    id: reward.id,
    label: reward.label || reward.text || 'Unnamed Skill',
    description: reward.power || reward.text || '',
    rarity: reward.rarity,
    icon: reward.icon,
    payload: {
      reward,
    },
  }
}

export function builderOptionToAdventureReward(
  option: BuilderRewardOption,
): RolledReward {
  const raw = option.payload?.reward

  if (raw && typeof raw === 'object') {
    return raw as RolledReward
  }

  return {
    id: option.id,
    label: option.label,
    text: option.label,
    power: option.description ?? '',
    rarity: (option.rarity ?? 'COMMON') as Rarity,
    icon: option.icon ?? 'kind-icon:gift',
  }
}

function tierFromValue(value: number): Rarity {
  if (value >= 6) return 'MYTHIC'
  if (value === 5) return 'LEGENDARY'
  if (value === 4) return 'EPIC'
  if (value === 3) return 'RARE'
  if (value === 2) return 'UNCOMMON'
  return 'COMMON'
}

export function syncAdventureStatTiers(sheet: BuilderSheet): void {
  const stats = Array.isArray(sheet.stats)
    ? (sheet.stats as BuilderStatEntry[])
    : []

  const valueFor = (key: string) =>
    stats.find((entry) => entry.key === key)?.value ?? 0

  sheet.luck = tierFromValue(valueFor('luck'))
  sheet.might = tierFromValue(valueFor('swol'))
  sheet.wits = tierFromValue(valueFor('wits'))
  sheet.grace = tierFromValue(valueFor('flexibility'))
  sheet.charm = tierFromValue(valueFor('rizz'))
  sheet.empathy = tierFromValue(valueFor('empathy'))
}

export function buildAdventureArtPrompt(sheet: BuilderSheet): string {
  const parts: string[] = []

  const add = (value: unknown, prefix?: string) => {
    const text = typeof value === 'string' ? value.trim() : ''
    if (!text) return
    parts.push(prefix ? `${prefix}: ${text}` : text)
  }

  if (typeof sheet.name === 'string' && sheet.name.trim()) {
    parts.push(`Character portrait of ${sheet.name.trim()}`)
  }

  add(sheet.species)
  add(sheet.class)
  add(sheet.personality, 'personality')

  if (typeof sheet.genre === 'string' && sheet.genre.trim()) {
    parts.push(`${sheet.genre.trim()} aesthetic`)
  }

  add(sheet.alignment)

  const rewards = sheet.rewards
  if (rewards && typeof rewards === 'object' && !Array.isArray(rewards)) {
    const skillText = Object.values(
      rewards as Record<string, BuilderRewardOption>,
    )
      .map((reward) => {
        const rarity = reward.rarity?.toLowerCase() ?? 'special'
        return `${rarity} skill: ${reward.label}`
      })
      .join(', ')

    if (skillText) parts.push(`skills: ${skillText}`)
  }

  if (typeof sheet.backstory === 'string' && sheet.backstory.trim()) {
    parts.push(`context: ${sheet.backstory.trim().slice(0, 120)}`)
  }

  parts.push(
    'expressive presence, strong silhouette, detailed design, vivid narrative quality',
  )

  return parts.filter(Boolean).join(', ')
}
