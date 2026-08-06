// /utils/scripts/coreObjectRoutes.ts
//
// The seven core objects, and the ONE route each one lives at.
//
// This is a single source of truth on purpose. Two checks need it —
// verifyRouteGalleryContract.ts gates on it, verifyGalleryAdoption.ts reports
// against it — and the whole class of bug both were written to catch is
// "the same fact, recorded in two places, drifting apart."
//
// It also cannot be derived. Five of the seven routes are the plural of the
// object (`bot` -> /bots), but `scenario` lives at **/stories** and `project`
// at **/conductor**, because those are what Silas calls them. A cleverer
// pluraliser would get both wrong and would look right doing it.
//
// Adding an object here is the moment to notice it has grown a second front
// door — "one route per object, two different routes, that way will lie
// madness" (Silas, on the /facets + /facet-gallery duplicate).

export interface CoreObject {
  /** Singular, and the prefix its components are named with. */
  object: string
  /** The single content route a user browses this object at. */
  route: string
  /** The component that renders the object's collection. */
  gallery: string
  /**
   * The store expression that IS this object's collection.
   *
   * Used to tell a real browser from an option list: a loop over
   * `filteredFacets` resolves back to `facetStore.facets` and is a gallery,
   * while `FACET_TAXONOMIES` merely contains the word and fills a <select>.
   */
  collection: RegExp
}

export const CORE_OBJECT_ROUTES: readonly CoreObject[] = [
  {
    object: 'bot',
    route: '/bots',
    gallery: 'bot-gallery',
    collection: /botStore\.\w*[Bb]ots\b/,
  },
  {
    object: 'character',
    route: '/characters',
    gallery: 'character-gallery',
    collection: /characterStore\.\w*[Cc]haracters\b/,
  },
  {
    object: 'dream',
    route: '/dreams',
    gallery: 'dream-gallery',
    collection: /dreamStore\.\w*[Dd]reams\b/,
  },
  {
    object: 'facet',
    route: '/facets',
    gallery: 'facet-gallery',
    collection: /facetStore\.\w*[Ff]acets\b|catalog\.entries\b/,
  },
  {
    object: 'reward',
    route: '/rewards',
    gallery: 'reward-gallery',
    collection: /rewardStore\.\w*[Rr]ewards\b/,
  },
  {
    // NOT /scenarios.
    object: 'scenario',
    route: '/stories',
    gallery: 'scenario-gallery',
    collection: /scenarioStore\.\w*[Ss]cenarios\b/,
  },
  {
    // NOT /projects.
    object: 'project',
    route: '/conductor',
    gallery: 'conductor-project-gallery-page',
    collection: /projectStore\.\w*[Pp]rojects\b/,
  },
]

/**
 * The route that OWNS this component, given every route that reaches it.
 *
 * Reachability alone names an incidental route: `dream-gallery` is reachable
 * from /academy, because academy-manager -> image-upload -> dream-gallery, and
 * a report that says "reached from /academy" would keep saying it after /dreams
 * lost its gallery entirely. When the component belongs to a core object, that
 * object's route wins; otherwise fall back to the first route, which is all the
 * information there is.
 */
export function ownerRoute(
  component: string,
  routes: readonly string[],
): string | undefined {
  if (!routes.length) return undefined

  const owner = CORE_OBJECT_ROUTES.find(
    (core) =>
      component === core.gallery || component.startsWith(`${core.object}-`),
  )
  if (owner && routes.includes(owner.route)) return owner.route

  // Not a core object: the plural of its own prefix is the best guess left.
  const prefix = component.split('-')[0] ?? ''
  const bySlug = routes.find((route) => {
    const slug = route.split('/').pop() ?? ''
    return slug === prefix || slug === `${prefix}s`
  })
  return bySlug ?? routes[0]
}
