# Model and channel implementation patterns

Salvaged from stale branch `claude/model-schema-docs-samples-m5d0jq` and rewritten as documentation rather than live sample code.

Use this as a checklist when adding a new content model or user-facing channel. Verify current files before applying; this doc intentionally avoids copying the stale branch's sample route/component implementations.

## Naming contract

Keep these names aligned or routing, stores, and generated UI will drift.

| Thing        | Convention                          | Example                                   |
| ------------ | ----------------------------------- | ----------------------------------------- |
| Prisma model | singular PascalCase                 | `Sample`                                  |
| API route    | lowercase plural                    | `/api/samples`, `server/api/samples/`     |
| Store        | `stores/<x>Store.ts`, `use<X>Store` | `stores/sampleStore.ts`, `useSampleStore` |
| Components   | domain folder, kebab-case filenames | `components/sample/sample-manager.vue`    |
| Content page | route markdown                      | `content/samples.md` → `/samples`         |

Component filenames must remain globally unique because Nuxt component registration can ignore path prefixes. Treat folders as organization, not namespace safety.

## The four UI tiers

Silas, 2026-08-07: _"things are either an 'interact' (just one thing) or a studio (a group of models interacting for a purpose)."_

| tier             | owns                                                                                                               | scope                 |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `<x>-manager`    | the route, its tabs, the one status banner, and everything acting on the **set** — create, archive, bulk, taxonomy | many, admin           |
| `<x>-gallery`    | presenting **many**. Store-free and presentational: items in, slots out                                            | many, display         |
| `<x>-interact`   | one decision — browse, or work with the selected one. Nothing else                                                 | one, routing          |
| `<x>-<activity>` | what you actually **do** with one selected object                                                                  | one, doing            |
| `<x>-studio`     | several object _types_ composed into something new                                                                 | many kinds, authoring |

`interact` stays small by construction: it renders its gallery or its activity surface and holds only the condition that chooses between them. That condition is often "an object is selected **or** a conversation is under way", and the second half must live in a store (`chatStore.sessionChats(scope)`) — if it lives in the file that moves out, the router loses sight of its own condition.

**The activity surface is named for what it does**, not with a uniform suffix, because this is the tier where models legitimately differ:

| model     | router               | activity surface   |
| --------- | -------------------- | ------------------ |
| Bot       | `bot-interact`       | `bot-chat`         |
| Character | `character-interact` | `character-chat`   |
| Dream     | `dream-interact`     | `dream-narration`  |
| Reward    | `reward-interact`    | `reward-encounter` |
| Scenario  | `scenario-interact`  | `scenario-story`   |

Contracts locate these by walking the render graph (`utils/scripts/componentGraph.ts`), never by filename, so activity naming costs nothing in enforcement.

**`workspace` is not one of these words.** It belongs to the navigation layer — `components/navigation/workspace-{header,hand,sheet}.vue` are the app's persistent page furniture, mounted straight from `app.vue`, and `stores/workspaceStore.ts` owns their panel state. Using it for a per-object surface collides with that. (`workspace-narrator.vue` predates the split and is a fossil from when a narrator was always front and centre; it is reached only through `dream-narration`.)

`utils/scripts/verifyUiTierVocabulary.ts` enforces the reservation.

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

| Image              | Path                                  |
| ------------------ | ------------------------------------- |
| Channel hero       | `nav/heroes/{channel}.webp`           |
| Channel card/thumb | `nav/thumbs/{channel}.webp`           |
| Dashboard tab      | `dashboard-tabs/{channel}/{tab}.webp` |
| Tutorial section   | `tutorials/{channel}/{tab}.webp`      |
| Tutorial hero      | `tutorials/{channel}/hero.webp`       |

The channel icon should be an Iconify name such as `kind-icon:*`, not an image file.

## Gotchas

- `performFetch` injects `Content-Type` and bearer authorization automatically; avoid redundant manual headers unless the current helper requires them.
- Guest/system user id has historically been `10`; verify before hard-coding.
- `validateApiKey` returns auth kind information such as JWT, admin token, or server key; use it to control allowed impersonation.
- Mature content should be gated in gallery/list views, usually with `userStore.showMature` plus admin bypass.
