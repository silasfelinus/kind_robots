# Add a page, tab, or channel in Kind Robots

This is the current route-first workflow for adding a place in the app.
For database models and API routes, use `sample/README.md`. For the full
content schema and permissions model, use `docs/channel-content-authoring.md`.

## What is authoritative?

- `content/channels/<channel-key>/index.md` defines a channel.
- `content/channels/<channel-key>/<tab-key>.md` defines a navigation tab.
- `content/<page>.md` supplies standalone page content and its component mount.
- `components/<domain>/<name>.vue` implements the actual UI.
- `stores/helpers/dashboardHelper.ts` and `stores/helpers/tutorialCards.ts`
  are compatibility layers, **not** the place to register a new channel or
  write tutorial copy. Do not add new entries there for modern destinations.

The current channel keys are `arcade`, `zuzu`, `projects`, `admin`,
and `home`. Home resolves account routes/help but does not appear as a
main front-facing channel. Storybook belongs inside Projects; games go in
Arcade or Zuzu. Admin-only previews have a discoverable Admin tab and an
`/admin/...` route, even when a separate `/play/...` public release route
will exist later.

## Decide where the new experience belongs

A new route in an existing area needs a page and one modern tab. A new
feature within an existing routed tab might only need a component change
and updated tab tutorial. Creating a genuinely new top-level channel is a
human-gated change requiring Silas's approval. Do not create a channel just
to make a game or project discoverable.

## Recipe A: create a routed page

1. Create a page under `content/` with the route's accepted path. Link
   `channelKey` and `tabKey` to its canonical tab, if it participates in
   navigation. Match the existing nearby page idiom; not every modern page
   uses the same manager wrapper.
2. Implement the page's UI in a uniquely named Vue component under
   `components/` and use the correct MDC mount where content-driven.
   Nuxt uses `pathPrefix: false`, so the mount name is the bare component
   filename, not the directory-prefixed name.
3. If private, gate server APIs as well as the page. A client-side
   `requiredRole` check alone cannot protect private or mature resources.
4. Inspect the actual page, including mobile layout, and review any hero or
   tutorial art by eye before linking it.

A new admin feature belongs at `/admin/<slug>` and must also have a
discoverable `content/channels/admin/<slug>.md` entry with
`requiredRole: ADMIN`. Do not expose an admin-only game prototype under
a public `/play` route until the owner approves publication.

## Recipe B: add a tab to an existing channel

Create a Markdown tab in `content/channels/<channel-key>/`:

```yaml
---
contentType: tab
channelKey: projects
tabKey: my-studio
label: My Studio
title: My Studio
subtitle: A tool for a real creative task
description: Explain what visitors can actually do here.
summary: Make something in My Studio.
icon: kind-icon:sparkles
route: /my-studio
sort: 60
tutorial:
  title: Using My Studio
  body: Describe the actual controls, access requirements, and result.
  image: /images/art/generate.webp
---
```

This is illustrative metadata, not a claim that `/my-studio` or its
art exists. Replace the values and **visually verify** any chosen image.
Add `requiredRole: ADMIN` or `requiredPermission: authenticated` when
required by the feature. Never put restricted story spoilers or private
artwork in publicly accessible metadata.

For a submenu, define a parent tab and give child tabs `parentTabKey`
matching its `tabKey`. Navigation supports one nesting level. Routed
parents such as Storybook remain openable as well as expandable.
Keep each destination in only its canonical channel.

A project may also require an update to `utils/projectPlacements.ts` and
its Kind Robots Project record, including `liveUrl`, `channelKey`,
and `tabKey`. Updating `conductor/project-overrides.yaml` alone will
not change the live row. Make authenticated changes only when authorized,
and never claim a URL is live merely because it is in a file.

## Recipe C: add a top-level channel (owner approval required)

Once an explicit channel change is approved:

1. Add `content/channels/<new-key>/index.md` and tabs. Make its
   `defaultTab` a real routed tab.
2. Update the expected channel set in
   `utils/scripts/verifyChannelContent.ts` and audit navigation-group
   ordering, selector visibility, role filtering, and direct route access.
3. Write an **authored** parent `tutorial`: title, overview, hero,
   and conceptual sections with keys, titles, bodies, and reviewed images.
4. Verify page-specific tutorials for all visible routed tabs. They
   describe what the visitor actually sees, not just the tab title.
5. Check route-first workspace help and the About toggle at phone,
   tablet, and desktop widths. Do not bypass permission filtering.

## Verification

```bash
npm run test:channel-content
npm run test:channel-resolver
npm run test:data-surface-manifest
npm run audit:channel-assets
```

Check other relevant contracts and `npm test` as appropriate. The
channel-content contract rejects missing channel overview tutorial fields
and missing/duplicate conceptual section fields. It does not prove that
an image depicts the right feature. Review the browser UI, and keep
unverified art or missing feature builds explicitly tracked.
