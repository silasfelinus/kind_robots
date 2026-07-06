# Sample — adding a new model, front to back

This folder is the reference implementation for wiring a new content model
into kind_robots. Every file is a working template for a fictional `Sample`
model, updated to match the site's current patterns and commented at the
points you change when copying. Read this sheet for the loop; read the
files for the details.

**Naming contract** (keep all five consistent or nothing lines up):

| Thing | Convention | For Sample |
| --- | --- | --- |
| Prisma model | singular PascalCase | `Sample` |
| API route | lowercase plural | `/api/samples` → `server/api/samples/` |
| Store | `stores/<x>Store.ts`, `use<X>Store` | `stores/sampleStore.ts`, `useSampleStore` |
| Components | `components/<domain>/` kebab-case | `components/sample/sample-manager.vue` |
| Content page | `content/<route>.md` | `content/samples.md` → route `/samples` |

Component filenames must be globally unique — Nuxt registers by filename
(`pathPrefix: false`), so the folder is organizational only.

## Where each template goes

| Template | Real destination |
| --- | --- |
| `schema.md` | model block in `prisma/schema.prisma` |
| `index.get.ts`, `index.post.ts`, `[id].get.ts`, `[id].patch.ts`, `[id].delete.ts`, `batch.patch.ts` | `server/api/samples/` |
| `sampleStore.ts` | `stores/sampleStore.ts` |
| `sample-manager.vue.txt` (drop `.txt`) | `components/sample/sample-manager.vue` |
| `add-sample.vue.txt`, `sample-gallery.vue.txt`, `sample-card.vue.txt`, `sample-interact.vue.txt` | `components/sample/` |
| `samples.md` | `content/samples.md` |
| `sample.cy.ts` | `cypress/e2e/api/samples.cy.ts` |
| `sample.http` | next to the route it exercises, e.g. `server/api/samples/` |

## The loop

1. **Schema** — copy the model block from `schema.md` into
   `prisma/schema.prisma`, add the back-relation on `User` (and `ArtImage`
   if used), then `npx prisma migrate dev --name add_<model>` and
   `npx prisma generate`. Migrations are additive-only; never edit an
   applied migration and never reset (AGENTS.md hard rule).
2. **Endpoints** — copy the six `.ts` templates into
   `server/api/<plural>/`. They follow the current house pattern
   (`server/api/scenarios/` is the live reference): `validateApiKey` auth
   with server-key/admin elevation, per-field normalizers, ownership checks
   with the ADMIN/`id === 1` bypass, `{ success, message, data, statusCode }`
   envelope, batch create/patch with `created/skipped/failed` and 207 on
   partial success.
3. **Store** — copy `sampleStore.ts` into `stores/`. It follows
   `stores/rewardStore.ts`: SSR-safe localStorage, Map-based merge (never
   overwrite), nightly-snapshot fallback, promise-deduped
   `initialize({ force, fetchRemote })`, the standard flag set, and
   `toPayload`/`toForm`/`createDefaultForm` transforms. If you want the
   offline fallback, add a snapshot JSON at `stores/fallback/<key>.json`.
4. **Components** — copy the four `.vue.txt` files (dropping `.txt`) into
   `components/<domain>/`. The manager is a tab switcher driven by
   `getDashboardTabs(dashboardKey)` from `stores/helpers/dashboardHelper.ts`;
   it composes the gallery/add/interact children rather than re-implementing
   them. Mature-content gating lives in the gallery
   (`userStore.showMature` + admin bypass), not the manager.
5. **Content page** — copy `samples.md` to `content/<route>.md`. One page
   per channel; frontmatter must use fields that exist in
   `content.config.ts` (`gallery`/`tags`/`layout`/`category`/`navComponent`
   are dead); body is the single `:x-manager` directive.
6. **Channel + tabs** — register the channel (checklist below).
7. **Images** — add the image set (checklist below).
8. **Tests** — copy `sample.cy.ts` to `cypress/e2e/api/<plural>.cy.ts`; it
   uses the shared `cypress/support/api-auth` helpers
   (`createLoggedInTestUser`, `bearerHeaders`, …), not hand-rolled tokens.

## Adding a new channel

The nav system is mostly derived from one registry:
`dashboardConfigs.footer.tabs` in `stores/helpers/dashboardHelper.ts` IS the
channel list. Nav cards, routes, and hero/thumb image paths all derive from
it — you do NOT hand-edit `navCards.ts` for a normal channel (the lone
hand-written card there is conductor, which sits outside the footer).

For a new channel `x` at route `/x` with tabs `t1, t2`, touch these:

1. `stores/helpers/dashboardHelper.ts` → `dashboardConfigs.footer.tabs[]` —
   add the channel entry: `key`, `label`, `icon` (an Iconify
   `kind-icon:*` string, not a file), `title`, `summary`,
   `image: getNavHeroImagePath('x')`, `flourish`, `tagline`, `narrative`,
   `route: '/x'`. Add `requiredRole: 'ADMIN'` for admin-only channels.
2. Same file → `dashboardConfigs.x` — the channel's own
   `{ key, label, defaultTab, tabs: [...] }`. One entry per tab with
   `image: tabImage('x', 't1')`. These tabs are what the manager renders.
3. Same file → `footerDashboardMap` — add `x: 'x'`. **Compile-enforced**:
   missing entry fails `tsc`.
4. `stores/helpers/tutorialCards.ts` → `tutorialChannels` — add the channel
   with one section per tab
   (`image: tutorialImage('x', 't1')`). **Compile-enforced** — every footer
   channel must have a tutorial entry. Add the key to `EARNING_CHANNELS`
   if creators earn from it.
5. `content/x.md` — the page itself, with `dashboardKey: x` and
   `dashboardTab: <defaultTab>` (validated by `validateDashboardPair`).
6. A manager component that renders the tabs via `getDashboardTabs('x')`.
7. `components/navigation/channel-select.vue` → `allChannels[]` — add
   `{ key, label, path: '/x', icon }`. **Hand-maintained and fails
   silently** — forget it and the channel just never appears in the header
   dropdown. This is the easiest one to miss.

Steps 3 and 4 fail the build if skipped; step 7 does not — check it last.

### Image checklist

All under `public/images/`. Helpers in `dashboardHelper.ts` /
`tutorialCards.ts` derive these paths — the filenames must match the keys.

| Image | Path |
| --- | --- |
| Channel hero (nav deck + footer) | `nav/heroes/{channel}.webp` |
| Channel card/thumb | `nav/thumbs/{channel}.webp` |
| Dashboard tab (one per tab) | `dashboard-tabs/{channel}/{tab}.webp` |
| Tutorial section (one per tab) | `tutorials/{channel}/{tab}.webp` |
| Tutorial hero | `tutorials/{channel}/hero.webp` |

The tutorial hero is a **separate file** by default
(`getTutorialHero` falls back to `tutorials/{channel}/hero.webp`); it only
reuses the channel hero if you explicitly set `hero:` on the tutorial
channel entry. The channel "icon" is an Iconify name, not an image.

Net for a two-tab channel: 4 code files + 1 content file (+ manager
component) + 9 images.

## Gotchas

- `performFetch` (stores/utils) injects `Content-Type` and the
  `Authorization` bearer token automatically — don't pass them manually.
- Guest/system user id is `10` (`userStore.userId` falls back to it);
  super-admin bypass in endpoints is `user.Role === 'ADMIN' || user.id === 1`.
- `validateApiKey` returns `{ isValid, user: { id, Role }, kind }` — `kind`
  is `'jwt' | 'beta-admin-token' | 'server'`; server keys may act on behalf
  of a requested `userId`.
- Prisma client and types import from `~/prisma/generated/prisma/client`,
  never `@prisma/client`.
- Content models with `isMature` must gate in the gallery: hide mature rows
  unless `userStore.showMature` (admins bypass).
