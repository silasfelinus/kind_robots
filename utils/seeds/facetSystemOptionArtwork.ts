// Canonical presentation targets for illustrated enum-backed Builder decks.
//
// Enums remain authoritative for persisted values. These targets let Facets own
// the human-facing label, description, artwork, ordering, and replacement prompt.
import { DREAM_TYPE_CHOICES } from '../../stores/helpers/dreamCards'
import { REWARD_CARDS } from '../../stores/helpers/rewardCards'
import type { BuilderChoice } from '../../stores/helpers/builderCards'

export type SystemOptionTaxonomy =
  | 'DREAM_TYPE'
  | 'REWARD_TYPE'
  | 'RARITY'

export type SystemOptionFacetTarget = {
  taxonomy: SystemOptionTaxonomy
  fieldKey: 'dreamType' | 'rewardType' | 'rarity'
  enumValue: string
  label: string
  description?: string
  path: string
  groupKey: string
  groupLabel: string
  prompt: string
}

function clean(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function choicesForRewardField(fieldKey: string): BuilderChoice[] {
  for (const card of REWARD_CARDS) {
    for (const step of card.steps) {
      if ((step.field || step.key || card.key) === fieldKey) {
        return (step.choices ?? []).filter(
          (choice) => !choice.opensCustom && !choice.opensList,
        )
      }
    }
  }
  return []
}

function target(options: {
  taxonomy: SystemOptionTaxonomy
  fieldKey: SystemOptionFacetTarget['fieldKey']
  groupKey: string
  groupLabel: string
  choice: BuilderChoice
}): SystemOptionFacetTarget | null {
  const enumValue = clean(options.choice.value)
  const label = clean(options.choice.label) || enumValue
  const path = clean(options.choice.image)
  if (!enumValue || !label || !path) return null

  return {
    taxonomy: options.taxonomy,
    fieldKey: options.fieldKey,
    enumValue,
    label,
    description: clean(options.choice.subtext) || undefined,
    path,
    groupKey: options.groupKey,
    groupLabel: options.groupLabel,
    prompt:
      `Kind Robots premium Builder card illustration for ${options.groupLabel}: ${label}. ` +
      `${clean(options.choice.subtext) || 'Clear symbolic visual identity.'} ` +
      'Single centered subject or emblem, polished fantasy-software dashboard art, readable silhouette, no text, no logo, no watermark, WebP.',
  }
}

const dreamTargets = DREAM_TYPE_CHOICES.map((choice) =>
  target({
    taxonomy: 'DREAM_TYPE',
    fieldKey: 'dreamType',
    groupKey: 'dream-type',
    groupLabel: 'Dream Types',
    choice,
  }),
)

const rewardTypeTargets = choicesForRewardField('rewardType').map((choice) =>
  target({
    taxonomy: 'REWARD_TYPE',
    fieldKey: 'rewardType',
    groupKey: 'reward-type',
    groupLabel: 'Reward Types',
    choice,
  }),
)

const rarityTargets = choicesForRewardField('rarity').map((choice) =>
  target({
    taxonomy: 'RARITY',
    fieldKey: 'rarity',
    groupKey: 'rarity',
    groupLabel: 'Rarity',
    choice,
  }),
)

export const SYSTEM_OPTION_FACET_TARGETS: SystemOptionFacetTarget[] = [
  ...dreamTargets,
  ...rewardTypeTargets,
  ...rarityTargets,
].filter((entry): entry is SystemOptionFacetTarget => Boolean(entry))

export const SYSTEM_OPTION_ARTWORK_PATHS = new Set(
  SYSTEM_OPTION_FACET_TARGETS.map((entry) => entry.path),
)
