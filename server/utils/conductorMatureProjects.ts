/**
 * Adult-only Conductor game identities are Kind Robots presentation policy,
 * never a coordination override. New projects are private until publication
 * has been explicitly approved.
 */
const matureOnlyProjects = new Set(['monstress-convention'])

export function isMatureConductorProject(slug: string): boolean {
  return matureOnlyProjects.has(slug)
}

/** No role, query string or admin privilege can override a CHILD restriction. */
export function canExposeConductorProject(
  slug: string,
  viewerShowsMature: boolean,
  isPublic: boolean,
  isAdmin: boolean,
): boolean {
  if (!isMatureConductorProject(slug)) return true
  return viewerShowsMature && (isPublic || isAdmin)
}
