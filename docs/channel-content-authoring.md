# Channel content authoring

Kind Robots navigation is defined by Markdown documents in `content/channels`.
The navigation UI, workspace cards, tutorial flyer, tab artwork, and legacy dashboard bridge consume the same channel and tab metadata.

## Folder shape

```text
content/channels/
├── home/
├── plan/
├── play/
├── sanctuary/
└── admin/
```

Each folder contains one parent channel document named `index.md` and one Markdown document per tab.

Play is the single creative channel. A model tab should lead to that model's own manager, where browsing, creating, editing, and interacting live together. Do not add a parallel Builder channel or duplicate model-specific creation tabs in another channel.

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

`channelKey` must be lowercase kebab-case. The top-level channel list is intentionally limited to Home, Plan, Play, Sanctuary, and Admin. Update the channel-content contract only when deliberately changing that information architecture.

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

The contracts validate required channels, key syntax, unique locations, defaults, page and Project placements, shared-route groups, component mounts, roles, permissions, inheritance, legacy adapters, and registered data surfaces.
