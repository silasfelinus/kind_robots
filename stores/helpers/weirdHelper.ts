// /stores/helpers/weirdHelper.ts
import type { Scenario as PrismaScenario } from '~/prisma/generated/prisma/client'

export const STORAGE_KEY = 'kindrobots.weirdState.v1'

export interface ScenarioView extends Omit<PrismaScenario, 'intros'> {
  intros: string[]
}

export function toPrismaScenario(view: ScenarioView): PrismaScenario {
  return {
    ...view,
    intros: JSON.stringify(view.intros),
  }
}

export function fromPrismaScenario(prisma: PrismaScenario): ScenarioView {
  return {
    ...prisma,
    intros: parseIntros(prisma.intros),
    isPublic: prisma.isPublic ?? true,
    isMature: prisma.isMature ?? false,
  }
}

export function parseIntros(raw: string | unknown): string[] {
  try {
    const parsed = typeof raw === 'string' ? JSON.parse(raw) : []

    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function fromSeedScenario(
  scenario: Partial<PrismaScenario> & { intros: string },
): ScenarioView {
  return {
    ...scenario,
    intros: parseIntros(scenario.intros),
    id: scenario.id ?? -1,
    createdAt: scenario.createdAt ?? new Date(0),
    updatedAt: scenario.updatedAt ?? new Date(0),
    title: scenario.title ?? '',
    description: scenario.description ?? '',
    genres: scenario.genres ?? '',
    userId: scenario.userId ?? 0,
    imagePath: scenario.imagePath ?? '',
    locations: scenario.locations ?? '',
    artPrompt: scenario.artPrompt ?? '',
    inspirations: scenario.inspirations ?? '',
    artImageId: scenario.artImageId ?? null,
    isPublic: scenario.isPublic ?? true,
    isMature: scenario.isMature ?? false,
  }
}
