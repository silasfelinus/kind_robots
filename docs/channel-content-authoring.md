# Channel content authoring

Kind Robots navigation is defined by Markdown documents in `content/channels`.
The navigation UI, workspace cards, tutorial flyer, tab artwork, and legacy dashboard bridge consume the same channel and tab metadata.

## Current channel layout

The old four-channel Home / Storybook / Play / Admin framing is historical.
The front-facing channel selector now shows **Arcade, Zuzu, Projects and
Admin** (Admin only to administrators):

- **Arcade** (`/play/arcade`) — the cabinet hall, its generated per-game
  subtabs, Memory Dungeon, Shifting Desks and Cthulhuquarium.
- **Zuzu** (`/play/zuzu-gamebook`) — Zuzu's gamebook, Shifting Lands,
  Showdown, Ghost Trail and pinball, plus admin-only Zuzu previews.
- **Projects** (`/storybook`) — Storybook is its default, routed tab and a
  submenu holding the ingredient galleries (Dreams, Bots, Characters, Rewards,
  Scenarios, Facets, Models); Art, Video Gen, Music Video, Mandarin, Daily
  Dream Projects and Rebel Button sit beside it. Storybook is not a channel of
  its own.
- **Admin** (`/artjob`, `requiredRole: ADMIN`) — operations, studios being
  built, accounts, and the Retired subtab group.

**Home** is still a content channel, but it is not in the selector: the former
Home dashboard and the personal destinations (account, friends, messages,
achievements, support) live in the user/account hub, and `/` is the visitor
front page. Home keeps its content so those routes resolve their tabs, page
help and permissions. Keep unreleased admin tools under `/admin/...` with
`requiredRole: ADMIN` and an Admin tab; public game routes belong under
`/play/...` only when authorized.

```text
content/channels/
├── arcade/
├── zuzu/
├── projects/
├── admin/
└── home/
```

Each folder contains `index.md` (the channel overview) and one Markdown
document per tab. A `parentTabKey` can nest a group of tabs one level deep.
A routed submenu parent, such as Storybook, remains directly openable.
Do not add new top-level channels merely to hold a project or game.

## Add a channel

Create `content/channels/<channel-key>/index.md`:

```md
---
contentType: channel
channelKey: example
label: Example
title: Example
room: Example Workshop
subtitle: A short channel promise
description: What belongs in this channel and why.
icon: kind-icon:sparkles
route: /example
defaultTab: overview
sort: 80
loadingMessage: Loading Example…
refreshLabel: Refresh Example
dottiTip: Dotti starts this optional two-line conversation.
amiTip: AMI gets the second line.
tutorial:
  title: Example Workshop
  overview: Explain the real tasks and destinations here.
  hero: /images/channels/example/channel.webp
  sections:
    - key: get-started
      title: Begin here
      body: Explain how to complete the first action.
      image: /images/channels/example/get-started.webp
---
```

`channelKey` must be lowercase kebab-case. The five-channel contract is enforced by `utils/scripts/verifyChannelContent.ts`. Changing that set requires an explicit owner-approved navigation change. Retired is an Admin subtab group, not a top-level channel.

Only put `dashboardKey` on the parent when every child truly belongs to the same legacy dashboard. Diverse channels keep legacy adapters on individual tabs instead.

## Add a tab

Create `content/channels/<channel-key>/<tab-key>.md`:

```md
---
contentType: tab
channelKey: example
tabKey: overview
dashboardKey: legacy-dashboard
dashboardTab: legacy-tab
label: Overview
title: Example Overview
subtitle: A concise tab promise
description: What the visitor can do here.
icon: kind-icon:sparkles
route: /example
sort: 10
tutorial:
  title: Using Example
  body: Describe what renders at /example, its controls, access and result.
  image: /images/channels/example/overview.webp
---
```

The `tutorial` block is required for every routed tab (see the
tutorial-completeness contract below); the image must be one you have opened
and checked.

That document can provide channel submenu navigation, workspace cards, tutorial sections, route and active-tab resolution, imagery, loading labels, dialogue, and legacy manager synchronization.

## Add a subtab group

A tab may act as a navigation-only parent for one level of subtabs. Give the parent a normal `tabKey` but omit its route, then point each child at it with `parentTabKey`:

Parent file, `content/channels/admin/retired.md`:

```yaml
---
contentType: tab
channelKey: admin
tabKey: retired
label: Retired
icon: kind-icon:archive
---
```

Child file, `content/channels/admin/retired/example.md`:

```yaml
---
contentType: tab
channelKey: admin
tabKey: example
parentTabKey: retired
label: Example
route: /example
tutorial:
  title: Example
  body: What this archived page still does.
---
```

The parent expands in tab menus and is not itself a routed destination. Children remain ordinary tabs for route resolution, project placement, the full navigation directory, and direct URLs. Top-level fallback card decks stay top-level, so nested children do not leak back out beside their parent group. Keep nesting to one level; the content contract rejects a subtab whose parent is itself a subtab.

## Parent inheritance

A tab inherits missing presentation metadata from its parent channel. Common inherited fields include:

- `room`
- `subtitle`
- `description`
- `summary`
- `narrative`
- `tooltip`
- `icon`
- `cards`
- `requiredRole`
- `requiredPermission`
- `loadingMessage`
- `refreshLabel`
- `dottiTip`
- `amiTip`

The content resolver performs inheritance once. Components receive complete resolved tab objects and should not recreate fallback chains.

## Shared routes and shareable tab URLs

Several tabs may intentionally use the same route while selecting different manager modes. When multiple tabs in one channel share a route, the navigator adds a query parameter:

```text
/example?tab=overview
/example?tab=details
```

The query parameter drives the content tab, remembered state, workspace sheet, browser history, and legacy dashboard synchronization. Do not hand-author `?tab=` inside front matter.

## Images

Explicit front matter paths may be absolute, remote, or relative to `/public/images`:

```yaml
image: navigation/play/characters.webp
```

When `image` is omitted, the resolver tries legacy dashboard artwork and then the channel convention:

```text
/images/channels/<channel-key>/channel.webp
/images/channels/<channel-key>/<tab-key>.webp
```

Run the non-blocking artwork audit with `npm run audit:channel-assets`. Add `-- --strict` when deliberately using it as a gate.

## Authored tutorials and art review

Every channel `index.md` must author a `tutorial` with a title, overview, hero
image path, and at least one `sections` entry containing a unique key, title,
body, and image. The channel-content contract enforces this minimum, not the
quality or factual correctness of the art and copy.

### The tutorial-completeness contract

`utils/scripts/verifyNavigationRouteAccess.ts` holds every current channel —
Arcade, Zuzu, Projects, Admin and Home — to the same help contract (it began as
an Admin-only rule):

- the channel tutorial is **authored** (`sectionsSource: authored`), with an
  overview and at least one section;
- every **routed tab** carries its own `tutorial.title` and `tutorial.body`,
  written for that page, and resolves to artwork (`tutorial.image`, else the
  tab `image`, else the `/images/channels/<channel>/<tab>.webp` convention);
- `tutorial: { enabled: false }` is allowed only where a tab is not a page of
  its own: a route-less submenu parent (Admin's Retired group), or a subtab
  that selects a mode of its parent's page by query string while the parent
  carries the help (Arcade's generated `?game=` subtabs);
- channel copy (description, summary, tutorial overview and sections) must not
  name a tab the viewer's role hides. Sign-in gates are fine to mention ("once
  you are signed in"); a role-gated tab is invisible, not locked. Role and
  permission filtering in `channelContentStore` already drops hidden tabs and
  their page help — keep tutorial lookups going through `getChannel`/`getTab`
  so that stays true.

### Legacy tutorial map

`stores/helpers/tutorialCards.ts` is no longer a tutorial registry. It holds
only legacy exceptions for public standalone pages that belong to no channel
the viewer can see (today `/plan/projects/humboldt-scoop` and
`/plan/projects/sketchy`). The workspace sheet resolves the content channel
from the page or the route first and reaches this map only when nothing
claims the route. Never add a channel, or a route that is also a channel tab
route, there — `verifyTutorialChannelResolver.ts` fails if you do. Write the
help in the tab's front matter instead.

### Trace the route, then look at the art

Two rules from Silas apply to every tutorial edit:

1. **Trace each tab's route to the component that renders it before writing
   its help.** Follow `route` to its page — usually `content/<path>.md` and
   its MDC mount (`:storybook-library-page`, `:dream-manager`), or a file
   under `pages/` — then into the component and the children it actually
   renders by default (for example `/storybook` → `storybook-library-page` →
   `storybook-storymaker` → `storybook-table`). Describe the controls by the
   labels on screen, the default view, and the real gates: check the API route
   for `requireApiUser`/`validateApiKey` (sign-in) and `manaGate` (costs mana)
   before saying either. Do not copy an old card's wording forward.
2. **Open every image before referencing it.** Download it (`/images/...` is
   served from the media origin, `https://media.acrocatranch.com/images/...`;
   other paths live under `public/`) and look at it. A file that exists is not
   evidence that it shows the right thing: reject garbled AI lettering,
   generic portraits, and art for a different feature. If no suitable image
   exists, leave the tutorial without an explicit image (it falls back to the
   tab artwork) and record the gap — with a proposed prompt — in the PR or
   handoff instead of inventing a path.

```yaml
tutorial:
  title: The Workshop
  tagline: What this area is for
  overview: Explain the real destinations and how someone uses them.
  hero: /images/channels/projects/channel.webp
  sections:
    - key: create
      title: Make something
      body: Explain the current actions and their actual effects.
      image: /images/art/generate.webp
```

Every visible routed tab should also have intentional page-specific `tutorial`
metadata rather than inheriting generic catalogue text:

```yaml
tutorial:
  title: Create an image
  body: Explain the actual controls, inputs, cost, and where results appear.
  image: /images/art/generate.webp
```

Follow the route-tracing and look-at-the-art rules above before writing it.
Never claim a feature is playable merely because a PR or scaffold exists.

Use conceptual, task-focused sections in channel tutorials, not a mechanical
enumeration of all tabs. A routed tab's tutorial is what appears first in the
workspace sheet, with the channel overview behind the About control. Test the
sheet on narrow and wide screens, including direct navigation from another
channel and tab switching within one channel.

## Dialogue

The optional simulated conversation remains supported:

```yaml
dottiTip: I built a new tab. It only took one Markdown file.
amiTip: Please do not frame the old helper and hang it in the museum yet.
```

Camel-case `dottiTip` and `amiTip` are canonical. Legacy lowercase spellings remain readable during migration.

## Permissions

Use channel-level permissions when every child shares the same gate. Override on a tab only when necessary.

```yaml
requiredRole: ADMIN
```

```yaml
requiredPermission: member
```

Supported navigation capabilities are `authenticated`, `member`, `family`, `mature`, and `admin`. Administrators bypass capability gates, while `requiredRole` remains an explicit role boundary. Channels with no accessible tabs are omitted.

## Legacy bridge

`dashboardKey` and `dashboardTab` are compatibility adapters, not the public information architecture. Keep them only while the destination still launches an existing dashboard manager. New navigation code should prefer `channelKey` and `tabKey`.

Canonical page activation happens in `pageStore`: content resolves the active channel and tab first, then the old dashboard shell is synchronized as a compatibility adapter. Components should not recreate that synchronization.

## Data surfaces without a content page

Register store-backed surfaces without Markdown pages in `utils/dataSurfaceManifest.ts`. Every entry must have a resolvable `navEntry` or an `acknowledgedGap`, so a data surface cannot become silently undiscoverable.

## Validation

Run:

```bash
npm run test:channel-content
npm run test:channel-resolver
npm run test:data-surface-manifest
npm run test:tutorial-channel-resolver
npx tsx utils/scripts/verifyNavigationRouteAccess.ts
npm run audit:channel-assets
```

The contracts validate the five required channels, authored channel tutorial overview/sections, page help on every routed tab, the role-hidden-destination rule, the legacy tutorial map's limits, key syntax, unique locations, defaults, page and Project placements, shared-route groups, component mounts, roles, permissions, inheritance, legacy adapters, and registered data surfaces. `audit:channel-assets` checks that every referenced image exists. None of them replaces looking at the page and the art.
