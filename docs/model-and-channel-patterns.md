# Model and channel implementation patterns

Salvaged from stale branch `claude/model-schema-docs-samples-m5d0jq` and rewritten as documentation rather than live sample code.

Use this as a checklist when adding a new content model or user-facing channel. Verify current files before applying; this doc intentionally avoids copying the stale branch's sample route/component implementations.

## Naming contract

Keep these names aligned or routing, stores, and generated UI will drift.

| Thing | Convention | Example |
| --- | --- | --- |
| Prisma model | singular PascalCase | `Sample` |
| API route | lowercase plural | `/api/samples`, `server/api/samples/` |
| Store | `stores/<x>Store.ts`, `use<X>Store` | `stores/sampleStore.ts`, `useSampleStore` |
| Components | domain folder, kebab-case filenames | `components/sample/sample-manager.vue` |
| Content page | route markdown | `content/samples.md` → `/samples` |

Component filenames must remain globally unique because Nuxt component registration can ignore path prefixes. Treat folders as organization, not namespace safety.

## Adding a new model

1. Add the Prisma model block to `prisma/schema.prisma`.
2. Add required back-relations on `User` and any linked model such as `ArtImage`.
3. Create an additive migration and generate Prisma types.
4. Add server routes under `server/api/<plural>/` using the current canonical route patterns.
5. Add a Pinia store based on the current canonical store pattern.
6. Add components and a content page only after the data layer is stable.
7. Add tests for API ownership/auth, batch behavior, and basic store transformations.

Migration rules:

- Additive-only migrations: create tables, add columns, add indexes, add constraints.
- Never edit, rename, or delete a migration that may already be applied anywhere.
- Never run `prisma migrate reset` unless Silas explicitly orders it in the current session.
- Import Prisma client/types from `~/prisma/generated/prisma/client`, not `@prisma/client`.

## Baseline Prisma model shape

For user-generated content models, start with this structure and adjust deliberately:

```prisma
model Sample {
  id          Int       @id @default(autoincrement())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime? @default(now()) @updatedAt

  title       String    @db.VarChar(764)
  description String?   @db.Text
  label       String?   @db.VarChar(255)

  isPublic    Boolean   @default(true)
  isMature    Boolean   @default(false)

  type        String?   @db.VarChar(128)
  designer    String?   @default("system") @db.VarChar(255)

  userId      Int?
  User        User?     @relation(fields: [userId], references: [id])

  imageId     Int?      @unique
  Image       ArtImage? @relation(fields: [imageId], references: [id])

  @@index([userId])
  @@index([type])
}
```

If `User` or `ArtImage` relations are used, remember the back-relation or `prisma validate` will fail.

## API route expectations

New model routes should follow current house patterns rather than copying old samples blindly:

- Use `validateApiKey` or the current auth helper for writes.
- Derive `userId` from auth unless a trusted server/admin key is explicitly allowed to act on behalf of another user.
- Enforce ownership checks for user-owned records.
- Allow admin bypass through the current shared helper, not ad hoc comparisons.
- Guard update payload fields explicitly; never pass raw `readBody()` straight into `prisma.update`.
- Return the standard `{ success, message, data, statusCode }` envelope.
- Use batch result envelopes with `created`, `skipped`, and `failed`; return 207 on partial success when applicable.
- Make delete behavior explicit. If the route says delete, hard delete unless a product requirement says otherwise.

## Store expectations

Stores should follow the current canonical pattern, not a one-off fetch wrapper:

- Use the shared fetch helper so auth headers, timeout, and circuit breaker behavior are preserved.
- Merge remote rows by id instead of clobbering local state.
- Deduplicate concurrent initialization/fetch requests.
- Expose consistent loading, initialized, and error state.
- Keep SSR-safe `localStorage` access guarded.
- Add snapshot fallback only for content that benefits from offline/bootstrap display.
- Keep transform helpers like `toPayload`, `toForm`, and default form builders close to the store.

## Adding a new channel

The nav system is mostly derived from registries. For a new channel `x` at route `/x` with tabs `t1` and `t2`, verify each of these:

1. `stores/helpers/dashboardHelper.ts` → `dashboardConfigs.footer.tabs[]`: add `key`, `label`, `icon`, `title`, `summary`, `image`, `flourish`, `tagline`, `narrative`, and `route`.
2. Same file → `dashboardConfigs.x`: define `{ key, label, defaultTab, tabs: [...] }` with one tab entry per tab.
3. Same file → `footerDashboardMap`: add `x: 'x'`; this should be compile-enforced.
4. `stores/helpers/tutorialCards.ts` → `tutorialChannels`: add one tutorial section per tab; add the key to `EARNING_CHANNELS` if creators earn from it.
5. `content/x.md`: add the page with `dashboardKey: x` and `dashboardTab: <defaultTab>`.
6. Manager component: render tabs from `getDashboardTabs('x')` rather than hard-coding menus.
7. `components/navigation/channel-select.vue`: update `allChannels[]`; this may fail silently if forgotten.

## Channel image checklist

All paths are under `public/images/` unless the current project has moved to a newer collection pipeline.

| Image | Path |
| --- | --- |
| Channel hero | `nav/heroes/{channel}.webp` |
| Channel card/thumb | `nav/thumbs/{channel}.webp` |
| Dashboard tab | `dashboard-tabs/{channel}/{tab}.webp` |
| Tutorial section | `tutorials/{channel}/{tab}.webp` |
| Tutorial hero | `tutorials/{channel}/hero.webp` |

The channel icon should be an Iconify name such as `kind-icon:*`, not an image file.

## Gotchas

- `performFetch` injects `Content-Type` and bearer authorization automatically; avoid redundant manual headers unless the current helper requires them.
- Guest/system user id has historically been `10`; verify before hard-coding.
- `validateApiKey` returns auth kind information such as JWT, admin token, or server key; use it to control allowed impersonation.
- Mature content should be gated in gallery/list views, usually with `userStore.showMature` plus admin bypass.
