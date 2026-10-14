# Channel content authoring

Kind Robots navigation is defined by Markdown documents in `content/channels`.
The navigation UI, workspace cards, tutorial flyer, tab artwork, and legacy dashboard bridge consume the same channel and tab metadata.

## Current channel layout

The five top-level content channels are **Arcade, Zuzu, Projects, Admin, and Home**.
Home remains a content key for route and tutorial resolution but is not a
front-facing channel in the main selector. Account and support surfaces remain
reachable through the user menu. Storybook is a routed entry and submenu within
Projects, not a sixth channel. Keep unreleased admin tools under `/admin/...`
with `requiredRole: ADMIN` and an Admin tab; public game routes belong under
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
---
```

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

Before authoring copy, trace the tab `route` to its real page and component,
including the component's current gates and default mode. Check the actual
image visually before referencing it. A filename existing on disk is not
evidence that it depicts the right page. If no suitable image exists, keep
artwork work tracked explicitly instead of asserting it is verified. Never
claim a feature is playable merely because a PR or scaffold exists.

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
npm run audit:channel-assets
```

The contracts validate the five required channels, authored channel tutorial overview/sections, key syntax, unique locations, defaults, page and Project placements, shared-route groups, component mounts, roles, permissions, inheritance, legacy adapters, and registered data surfaces. They do not replace human review of help accuracy or image relevance.
