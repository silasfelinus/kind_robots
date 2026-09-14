// server/utils/appmakerSlug.ts
//
// Shared slug validation/collision-check helper for AppMaker's two self-serve
// app creation routes (kind-robots/t-094, split off pitches/2026-08-10-kind-
// robots-slug-integrity.md's second fix after t-061 landed the first half).
// `scaffold-request.post.ts` (monorepo apps/<slug>/ scaffolding) and
// `github/create-app.post.ts` (external-repo AppRepo registration) each
// independently maintained an identical `SLUG_RE`/`slugify()` pair plus
// nearly identical Project/Dream/conductor-apps-folder collision checks
// (appmaker/t-012) that could silently drift apart -- `appmaker-page.vue:169`
// carried its own "keep in sync" comment flagging exactly this risk. This is
// the single source of truth for both.
//
// `server/api/conductor/sync.post.ts` also touches Project slugs, but is
// intentionally NOT consolidated onto this helper: it upserts (create-or-
// update) Conductor-authoritative projects from an already-validated,
// server-generated projection -- there is no user-supplied slug to run
// through `SLUG_RE`/`slugify()`, and its "collision" case means "relink an
// existing Project" rather than "reject a new one," the opposite of what
// `isSlugTaken()` below is for. Forcing it onto this helper would change its
// behavior, not just its shape.
import prisma from '@/server/utils/prisma'
import { conductorList } from '~/server/utils/conductor-github'

export const SLUG_RE = /^[a-z][a-z0-9-]{1,40}$/

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40)
}

// True if `slug` is already claimed by an existing Project (matched by
// `slug` OR `conductorSlug`), an existing Dream, or an apps/<slug>/ folder
// already scaffolded in the conductor repo.
//
// apps.get.ts treats a `dir` entry under conductor's apps/ folder as the
// real source of truth for "already scaffolded," but several apps (e.g.
// apps/storybook, apps/wishmaster) were scaffolded directly by an agent
// before either self-serve flow existed and never got a matching Project
// row, so the Project/Dream checks alone miss them entirely (appmaker/t-012).
// Without this third check, a colliding request would appear to succeed
// (Project created, Todo filed) but the follow-up scaffold step refuses to
// run over the existing folder and fails silently, permanently orphaning the
// user's Project row and one of their FREE_PROJECT_LIMIT slots.
export async function isSlugTaken(slug: string): Promise<boolean> {
  const [existingProject, existingDream, scaffoldedApps] = await Promise.all([
    prisma.project.findFirst({
      where: { OR: [{ slug }, { conductorSlug: slug }] },
      select: { id: true },
    }),
    prisma.dream.findUnique({
      where: { slug },
      select: { id: true },
    }),
    conductorList('apps'),
  ])

  const alreadyScaffolded = (scaffoldedApps ?? []).some(
    (entry) => entry.type === 'dir' && entry.name === slug,
  )

  return Boolean(existingProject || existingDream || alreadyScaffolded)
}
