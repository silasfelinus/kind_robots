// /components/conductor/projectFront.ts
//
// Shared config + helpers for public-facing project front pages. A project page
// is a thin wrapper around <project-front-page>: it passes a slug (to pull the
// live Project record from projectStore) plus a static `fallback` config so the
// page always renders something styled even when no public DB row exists yet.
//
// Conventions verified against ecosystem-map/TAB-INTEGRATION.md and
// kind_robots/sample/new-section.md. Art paths mirror
// conductor-overview-gallery-page.vue (local public asset first, conductor repo
// raw asset as the fallback).

const CONDUCTOR_IMAGE_BASE =
  'https://raw.githubusercontent.com/silasfelinus/conductor/main/projects/images'

/** Local public path for a project image kind, keyed by conductor slug. */
export function projectAssetPath(
  slug: string,
  kind: 'hero' | 'card' | 'icon',
): string {
  return `/images/projects/${slug}/${kind}.webp`
}

/** Conductor-repo raw fallback for a project image kind. */
export function projectAssetFallback(
  slug: string,
  kind: 'hero' | 'card' | 'icon',
): string {
  return `${CONDUCTOR_IMAGE_BASE}/${slug}-${kind}.webp`
}

export type ProjectFrontLink = {
  label: string
  href: string
  icon?: string
  external?: boolean
}

export type ProjectFrontSection = {
  key: string
  title: string
  body: string
  icon?: string
}

export type ProjectFrontStat = {
  label: string
  value: string
  icon?: string
}

/**
 * Static fallback describing a project front page. Any field present on the live
 * Project record overrides the matching fallback field at render time.
 */
export type ProjectFrontConfig = {
  slug: string
  title: string
  /** Short hero tagline. */
  tagline?: string
  /** One or two paragraph public description. */
  description?: string
  /** Existing channel + tab this page is stitched into. */
  channelKey: string
  tabKey: string
  /** Iconify kind-icon name for the hero chip. */
  icon?: string
  /** Optional hero image override (else resolved from slug). */
  heroImage?: string
  /** Primary launch action (defaults to Project.liveUrl / this route). */
  launch?: ProjectFrontLink
  /** Extra links (repo, external app, docs). */
  links?: ProjectFrontLink[]
  /** Marketing/explainer blocks rendered under the hero. */
  sections?: ProjectFrontSection[]
  /** Headline stats shown in the hero strip. */
  stats?: ProjectFrontStat[]
  /** "What's shipped / what's next" deliverable bullets. */
  deliverables?: { done?: string[]; next?: string[] }
  /** ArtCollection label to surface as a gallery strip, if any. */
  collectionLabel?: string
  /** When true, this is an external/bridge surface (launch is primary CTA). */
  bridge?: boolean
}
