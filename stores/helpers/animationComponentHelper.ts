// /stores/helpers/animationComponentHelper.ts
//
// Convention layer for conductor's animation-manager t-004: "museum of development
// attempts" tracking for passive Screen FX animations, built entirely on the existing
// Component/Reaction models (no schema change — see prisma/schema.prisma's Component
// doc comment and projects/animation-manager/SPEC.md's "Attempt records" section).
//
// One Component row per animation build:
//   folderName:    'screenfx'
//   componentName: '<animation-slug>@v<build-number>'  (e.g. bioluminescent-tide@v1)
//   status:        WORKING / UNDER_CONSTRUCTION / BROKEN / RETIRED / ... (ComponentStatus)
//   notes:         short human-readable summary (the column is an unindexed
//                  VARCHAR(191) with no app-layer length cap — too easy to silently
//                  truncate a real ledger, so the structured payload below lives in
//                  `tags` (an unconstrained JSON column) instead)
//   tags:          AnimationAttemptTags — slug, build number, catalog id, source path,
//                  commit/PR, technique, quality checklist, supersedes/supersededBy
//
// This module only defines the naming/parsing/composition conventions. The store
// actions that actually call the Component API live in componentStore.ts so a new
// attempt is pushed into the same reactive `components` list as every other Component
// mutation, and so front-end components never call /api/components directly.
import type { Component } from '~/prisma/generated/prisma/client'
import type { ComponentStatus } from '@/utils/wonderlab/componentStatus'

export const ANIMATION_ATTEMPT_FOLDER = 'screenfx'

export interface AnimationQualityChecklistItem {
  item: string
  passed: boolean
}

export interface AnimationAttemptTags {
  slug: string
  buildNumber: number
  catalogId?: string
  componentPath?: string
  commit?: string
  pr?: string
  technique?: string
  qualityChecklist?: AnimationQualityChecklistItem[]
  supersedes?: string | null
  supersededBy?: string | null
}

// Matches the widened componentName validation in
// server/api/components/[id].patch.ts (componentNameValue) — kept in sync by
// utils/scripts/verifyAnimationComponentAttempts.ts.
const ANIMATION_COMPONENT_NAME_PATTERN = /^(.+)@v(\d+)$/

export function buildAnimationComponentName(
  slug: string,
  buildNumber: number,
): string {
  if (!slug.trim()) {
    throw new Error('Animation slug is required to build a component name.')
  }

  if (!Number.isInteger(buildNumber) || buildNumber < 1) {
    throw new Error('buildNumber must be a positive integer.')
  }

  return `${slug}@v${buildNumber}`
}

export function parseAnimationComponentName(
  componentName: string,
): { slug: string; buildNumber: number } | null {
  const match = ANIMATION_COMPONENT_NAME_PATTERN.exec(componentName)
  const slug = match?.[1]
  const buildNumber = match?.[2]
  if (!match || slug === undefined || buildNumber === undefined) return null

  return { slug, buildNumber: Number(buildNumber) }
}

export function isAnimationAttemptComponent(
  component: Pick<Component, 'folderName' | 'componentName'>,
): boolean {
  return (
    component.folderName === ANIMATION_ATTEMPT_FOLDER &&
    parseAnimationComponentName(component.componentName) !== null
  )
}

export function listAnimationAttempts<
  T extends Pick<Component, 'folderName' | 'componentName'>,
>(components: T[], slug?: string): T[] {
  return components
    .filter((component) => isAnimationAttemptComponent(component))
    .filter((component) => {
      if (!slug) return true
      return parseAnimationComponentName(component.componentName)?.slug === slug
    })
    .sort((a, b) => {
      const aBuild = parseAnimationComponentName(a.componentName)?.buildNumber ?? 0
      const bBuild = parseAnimationComponentName(b.componentName)?.buildNumber ?? 0
      return aBuild - bBuild
    })
}

export function getLatestAnimationAttempt<
  T extends Pick<Component, 'folderName' | 'componentName'>,
>(components: T[], slug: string): T | null {
  const attempts = listAnimationAttempts(components, slug)
  return attempts.at(-1) ?? null
}

export function nextAnimationBuildNumber<
  T extends Pick<Component, 'folderName' | 'componentName'>,
>(components: T[], slug: string): number {
  const latest = getLatestAnimationAttempt(components, slug)
  if (!latest) return 1

  return (parseAnimationComponentName(latest.componentName)?.buildNumber ?? 0) + 1
}

export function parseAnimationAttemptTags(
  tags: Component['tags'] | undefined,
): AnimationAttemptTags | null {
  if (!tags || typeof tags !== 'object' || Array.isArray(tags)) return null

  const candidate = tags as Record<string, unknown>
  if (
    typeof candidate.slug !== 'string' ||
    typeof candidate.buildNumber !== 'number'
  ) {
    return null
  }

  return candidate as unknown as AnimationAttemptTags
}

export interface RecordAnimationAttemptInput {
  slug: string
  buildNumber: number
  title: string
  status: ComponentStatus
  summary?: string | null
  catalogId?: string
  componentPath?: string
  commit?: string
  pr?: string
  technique?: string
  qualityChecklist?: AnimationQualityChecklistItem[]
  supersedes?: string | null
}

export function buildAnimationAttemptPayload(
  input: RecordAnimationAttemptInput,
): Partial<Component> {
  const componentName = buildAnimationComponentName(input.slug, input.buildNumber)

  const tags: AnimationAttemptTags = {
    slug: input.slug,
    buildNumber: input.buildNumber,
    catalogId: input.catalogId,
    componentPath: input.componentPath,
    commit: input.commit,
    pr: input.pr,
    technique: input.technique,
    qualityChecklist: input.qualityChecklist,
    supersedes: input.supersedes ?? null,
    supersededBy: null,
  }

  return {
    folderName: ANIMATION_ATTEMPT_FOLDER,
    componentName,
    title: input.title,
    status: input.status,
    notes: input.summary ?? null,
    tags: tags as unknown as Component['tags'],
  }
}

export function buildSupersededTags(
  previous: { tags: Component['tags'] | undefined },
  supersededByComponentName: string,
): Component['tags'] {
  const previousTags = parseAnimationAttemptTags(previous.tags)

  if (!previousTags) {
    throw new Error(
      'Cannot mark supersession: the previous Component row has no valid animation attempt tags.',
    )
  }

  const nextTags: AnimationAttemptTags = {
    ...previousTags,
    supersededBy: supersededByComponentName,
  }

  return nextTags as unknown as Component['tags']
}
