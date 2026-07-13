# Channel content authoring

Kind Robots navigation is defined by Markdown documents in `content/channels`.
The navigation UI, workspace cards, tutorial flyer, tab artwork, and legacy dashboard bridge all consume the same channel and tab metadata.

## Folder shape

```text
content/channels/
├── home/
│   ├── index.md
│   ├── dashboard.md
│   └── themes.md
├── plan/
├── build/
├── play/
├── lab/
├── sanctuary/
└── admin/
```

Each folder contains one parent channel document named `index.md` and one Markdown document per tab.

## Add a channel

Create `content/channels/<channel-key>/index.md`:

```md
---
contentType: channel
channelKey: example
dashboardKey: legacy-dashboard
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

Optional longer channel copy can live in the Markdown body.
```

`channelKey` must be lowercase kebab-case. The top-level channel list is currently intentionally limited to Home, Plan, Build, Play, Lab, Sanctuary, and Admin; update the channel-content contract only when deliberately changing that information architecture.

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

Optional tutorial or explanatory copy can live here.
```

That single document can provide:

- Channel submenu navigation
- Workspace hand and sheet cards
- Tutorial flyer sections
- Route and active-tab resolution
- Tab imagery and icons
- Loading and refresh labels
- Dotti and AMI dialogue
- Legacy manager synchronization during migration

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

Several tabs may intentionally use the same route while selecting different manager modes. Build is the clearest example.

When multiple tabs in one channel share a route, the navigator adds a query parameter:

```text
/builder?tab=character
/builder?tab=bot
/builder?tab=art
```

The query parameter drives the content tab, remembered state, workspace sheet, browser history, and legacy dashboard synchronization. Tabs with unique routes continue using clean route-only URLs.

Do not hand-author `?tab=` inside front matter. Declare the shared `route` and the navigator creates the address.

## Images

Explicit front matter paths may be absolute, remote, or relative to `/public/images`:

```yaml
image: navigation/build/characters.webp
```

When `image` is omitted, the resolver tries legacy dashboard artwork and then the channel convention:

```text
/images/channels/<channel-key>/channel.webp
/images/channels/<channel-key>/<tab-key>.webp
```

## Dotti and AMI dialogue

The optional simulated conversation remains supported:

```yaml
dottiTip: I built a new tab. It only took one Markdown file.
amiTip: Please do not frame the old helper and hang it in the museum yet.
```

Camel-case `dottiTip` and `amiTip` are canonical. Legacy lowercase `dottitip` and `amitip` remain readable during migration.

## Permissions

Use channel-level permissions when every child shares the same gate. Override on a tab only when necessary:

```yaml
requiredRole: ADMIN
```

`requiredPermission` is available for the future capability-based permission system.

## Legacy bridge

`dashboardKey` and `dashboardTab` are compatibility adapters, not the public information architecture. Keep them while the destination still launches an existing dashboard manager. New navigation code should prefer `channelKey` and `tabKey`.

## Validation

Run:

```bash
npm run test:channel-content
```

The contract checks:

- Required parent channels
- Valid lowercase kebab-case keys
- Unique channel/tab locations
- Valid default tabs
- Existing parent channels
- Valid page placements
- Valid canonical Project placements
- Shared-route tab groups that use `?tab=` addressing

TypeScript validation also runs through the normal project test workflow.
