import { createError } from 'h3'
import {
  isZuzuProjectSlug,
  parseZuzuUsage,
  type ZuzuUsageFields,
} from '../../utils/zuzuWorld'

export type ZuzuAssignmentBody = {
  artImageIds?: unknown
  projectIds?: unknown
  action?: unknown
  usage?: unknown
}

export type ZuzuAssignmentPlan = {
  artImageIds: number[]
  projectIds: number[]
  action: 'link' | 'unlink'
  usage: ZuzuUsageFields | null
}

type Pair = { projectId: number; artImageId: number }

export type ZuzuUsageStore = {
  projectArtImage: {
    createMany(args: {
      data: (Pair & Partial<ZuzuUsageFields>)[]
      skipDuplicates: true
    }): Promise<{ count: number }>
    updateMany(args: {
      where: { OR: Pair[] }
      data: ZuzuUsageFields
    }): Promise<{ count: number }>
    deleteMany(args: { where: { OR: Pair[] } }): Promise<{ count: number }>
  }
}

export type ZuzuAssignmentDeps = {
  requireAdmin(): Promise<unknown>
  accessIsAdmin(): Promise<boolean>
  ledgerHas(id: number): Promise<boolean>
  accessibleArtImageIds(ids: number[]): Promise<number[]>
  zuzuProjects(
    ids: number[],
  ): Promise<{ id: number; conductorSlug: string | null }[]>
  store: ZuzuUsageStore
}

export type ZuzuAssignmentResult = {
  changed: number
  created: number
  updated: number
  references: number
  action: 'link' | 'unlink'
  message: string
}

function ids(value: unknown, max: number, label: string): number[] {
  if (!Array.isArray(value) || !value.length || value.length > max) {
    throw createError({ statusCode: 400, message: `Select 1–${max} ${label}.` })
  }
  const unique = [...new Set(value)]
  if (
    unique.length !== value.length ||
    !unique.every(
      (id) => typeof id === 'number' && Number.isSafeInteger(id) && id > 0,
    )
  ) {
    throw createError({ statusCode: 400, message: `Invalid ${label} IDs.` })
  }
  return unique
}

export function parseZuzuAssignment(body: unknown): ZuzuAssignmentPlan {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw createError({ statusCode: 400, message: 'Invalid assignment.' })
  }
  const input = body as ZuzuAssignmentBody
  const artImageIds = ids(input.artImageIds, 48, 'art images')
  const projectIds = ids(input.projectIds, 8, 'projects')
  const action = input.action
  if (action !== 'link' && action !== 'unlink') {
    throw createError({ statusCode: 400, message: 'Use link or unlink.' })
  }
  let usage: ZuzuUsageFields | null = null
  if (input.usage !== undefined && input.usage !== null) {
    if (typeof input.usage !== 'object' || Array.isArray(input.usage)) {
      throw createError({ statusCode: 400, message: 'Invalid usage details.' })
    }
    const parsed = parseZuzuUsage(input.usage as Record<string, unknown>)
    if (!parsed.ok) {
      throw createError({ statusCode: 400, message: parsed.message })
    }
    usage = parsed.value
  }
  return { artImageIds, projectIds, action, usage }
}

export async function applyZuzuUsage(
  store: ZuzuUsageStore,
  plan: ZuzuAssignmentPlan,
): Promise<ZuzuAssignmentResult> {
  const pairs: Pair[] = plan.artImageIds.flatMap((artImageId) =>
    plan.projectIds.map((projectId) => ({ artImageId, projectId })),
  )
  if (plan.action === 'unlink') {
    const removed = await store.projectArtImage.deleteMany({
      where: { OR: pairs },
    })
    return {
      changed: removed.count,
      created: 0,
      updated: 0,
      references: pairs.length,
      action: 'unlink',
      message: `Unlinked ${removed.count} references. Original art was preserved.`,
    }
  }
  const updated = plan.usage
    ? (
        await store.projectArtImage.updateMany({
          where: { OR: pairs },
          data: plan.usage,
        })
      ).count
    : 0
  const created = await store.projectArtImage.createMany({
    data: plan.usage
      ? pairs.map((pair) => ({ ...pair, ...plan.usage }))
      : pairs,
    skipDuplicates: true,
  })
  const parts = [`Linked ${created.count} new project references`]
  if (plan.usage) parts.push(`updated ${updated} existing roles`)
  return {
    changed: created.count + updated,
    created: created.count,
    updated,
    references: pairs.length,
    action: 'link',
    message: `${parts.join(', ')}. Originals were not copied.`,
  }
}

export async function runZuzuAssignment(
  deps: ZuzuAssignmentDeps,
  readBody: () => Promise<unknown>,
): Promise<ZuzuAssignmentResult> {
  await deps.requireAdmin()
  if (!(await deps.accessIsAdmin())) {
    throw createError({ statusCode: 403, message: 'Admin access required.' })
  }
  const plan = parseZuzuAssignment(await readBody())
  for (const id of plan.artImageIds) {
    if (!(await deps.ledgerHas(id))) {
      throw createError({
        statusCode: 400,
        message: 'Unknown Zuzu source artwork.',
      })
    }
  }
  const [accessible, projects] = await Promise.all([
    deps.accessibleArtImageIds(plan.artImageIds),
    deps.zuzuProjects(plan.projectIds),
  ])
  if (accessible.length !== plan.artImageIds.length) {
    throw createError({
      statusCode: 403,
      message: 'One or more images are not accessible.',
    })
  }
  if (
    projects.length !== plan.projectIds.length ||
    !projects.every(
      (project) =>
        project.conductorSlug && isZuzuProjectSlug(project.conductorSlug),
    )
  ) {
    throw createError({
      statusCode: 400,
      message: 'Invalid Zuzu production selection.',
    })
  }
  return applyZuzuUsage(deps.store, plan)
}
