// /stores/helpers/weirdHelper.ts
import type { Scenario as PrismaScenario } from '~/server/generated/prisma'

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
  s: Partial<PrismaScenario> & { intros: string },
): ScenarioView {
  return {
    ...s,
    intros: parseIntros(s.intros),
    id: -1,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    title: s.title ?? '',
    description: s.description ?? '',
    genres: s.genres ?? '',
    userId: s.userId ?? 0,
    imagePath: s.imagePath ?? '',
    locations: s.locations ?? '',
    artPrompt: s.artPrompt ?? '',
    inspirations: s.inspirations ?? '',
    artImageId: s.artImageId ?? null,
  }
}
