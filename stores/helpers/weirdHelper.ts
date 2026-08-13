// /stores/helpers/weirdHelper.ts
import type { Scenario as PrismaScenario } from '~/prisma/generated/prisma/client'

export const STORAGE_KEY = 'kindrobots.weirdState.v1'

export interface ScenarioView extends Omit<PrismaScenario, 'intros'> {
  intros: string[]
}

export type ScenarioSeedInput = Partial<Omit<PrismaScenario, 'intros'>> & {
  intros?: string | string[] | null
}

export function toPrismaScenario(view: ScenarioView): PrismaScenario {
  return {
    ...view,
    intros: stringifyIntros(view.intros),
  }
}

export function fromPrismaScenario(prisma: PrismaScenario): ScenarioView {
  return {
    ...prisma,
    intros: parseIntros(prisma.intros),
    updatedAt: prisma.updatedAt ?? null,
    imagePath: prisma.imagePath ?? null,
    locations: prisma.locations ?? null,
    artPrompt: prisma.artPrompt ?? null,
    genres: prisma.genres ?? null,
    inspirations: prisma.inspirations ?? null,
    artImageId: prisma.artImageId ?? null,
    difficulty: prisma.difficulty ?? null,
    tier: prisma.tier ?? null,
    group: prisma.group ?? null,
    secretNotes: prisma.secretNotes ?? null,
    isPublic: prisma.isPublic ?? true,
    isMature: prisma.isMature ?? false,
    isActive: prisma.isActive ?? true,
  }
}

export function stringifyIntros(
  value: string[] | string | null | undefined,
): string {
  if (Array.isArray(value)) {
    return JSON.stringify(value.map((entry) => entry.trim()).filter(Boolean))
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) return '[]'

    try {
      const parsed = JSON.parse(trimmed)

      if (Array.isArray(parsed)) {
        return JSON.stringify(
          parsed.map((entry) => String(entry).trim()).filter(Boolean),
        )
      }

      return JSON.stringify([trimmed])
    } catch {
      return JSON.stringify(
        trimmed
          .split('\n')
          .map((entry) => entry.trim())
          .filter(Boolean),
      )
    }
  }

  return '[]'
}

export function parseIntros(raw: string | string[] | unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((entry) => String(entry).trim()).filter(Boolean)
  }

  if (typeof raw !== 'string') return []

  const trimmed = raw.trim()

  if (!trimmed) return []

  try {
    const parsed = JSON.parse(trimmed)

    if (Array.isArray(parsed)) {
      return parsed.map((entry) => String(entry).trim()).filter(Boolean)
    }

    return []
  } catch {
    return trimmed
      .split('\n')
      .map((entry) => entry.trim())
      .filter(Boolean)
  }
}

export function fromSeedScenario(scenario: ScenarioSeedInput): ScenarioView {
  return {
    id: scenario.id ?? -1,
    createdAt: scenario.createdAt ?? new Date(0),
    updatedAt: scenario.updatedAt ?? null,
    title: scenario.title ?? '',
    slug: scenario.slug ?? null,
    outputType: scenario.outputType ?? 'STORY',
    description: scenario.description ?? '',
    intros: parseIntros(scenario.intros),
    userId: scenario.userId ?? 0,
    artImageId: scenario.artImageId ?? null,
    imagePath: scenario.imagePath ?? null,
    icon: scenario.icon ?? null,
    iconPath: scenario.iconPath ?? null,
    cardPath: scenario.cardPath ?? null,
    heroPath: scenario.heroPath ?? null,
    // Per-slot ArtImage ids. A seed scenario has no generated art behind it,
    // so these stay null; they exist here only to satisfy ScenarioView.
    iconArtImageId: scenario.iconArtImageId ?? null,
    cardArtImageId: scenario.cardArtImageId ?? null,
    heroArtImageId: scenario.heroArtImageId ?? null,
    // Schema default is true. A seed scenario arriving without the field was
    // being presented as reviews-off, which is not what the column says and not
    // what the owner chose.
    allowReviews: scenario.allowReviews ?? true,
    locations: scenario.locations ?? null,
    artPrompt: scenario.artPrompt ?? null,
    genres: scenario.genres ?? null,
    inspirations: scenario.inspirations ?? null,
    isMature: scenario.isMature ?? false,
    isPublic: scenario.isPublic ?? true,
    isActive: scenario.isActive ?? true,
    difficulty: scenario.difficulty ?? null,
    tier: scenario.tier ?? null,
    group: scenario.group ?? null,
    secretNotes: scenario.secretNotes ?? null,
    cast: scenario.cast ?? null,
    // Card theme. A seed Scenario has none stored, and NULL is the right value
    // rather than a picked one: resolveEntityTheme derives a stable theme from
    // the id when this is empty, so choosing here would only be able to
    // disagree with it. Same reason the per-slot ArtImage ids above stay null.
    theme: scenario.theme ?? null,
  }
}
