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

Only put `dashboardKey` on the parent when every child truly belongs to the same legacy dashboard. Diverse channels such as Lab, Sanctuary, and Admin keep legacy adapters on individual tabs instead.

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

Legacy dashboard adapters can also inherit, but use that only for channels whose children genuinely share one old manager. Otherwise declare `dashboardKey` and `dashboardTab` directly on each tab.

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

Run the non-blocking artwork audit to list resolved images that do not exist under `public/`:

```bash
npm run audit:channel-assets
```

Add `-- --strict` when deliberately using the audit as a local gate.

## Dotti and AMI dialogue

The optional simulated conversation remains supported:

```yaml
dottiTip: I built a new tab. It only took one Markdown file.
amiTip: Please do not frame the old helper and hang it in the museum yet.
```

Camel-case `dottiTip` and `amiTip` are canonical. Legacy lowercase `dottitip` and `amitip` remain readable during migration.

## Permissions

Use channel-level permissions when every child shares the same gate. Override on a tab only when necessary.

Role gate:

```yaml
requiredRole: ADMIN
```

Capability gate:

```yaml
requiredPermission: member
```

Supported navigation capabilities are:

- `authenticated` — any signed-in user
- `member` — an active Kind Robots member
- `family` — a user with the FAMILY role
- `mature` — a user who enabled mature content
- `admin` — an administrator

Role and capability gates are evaluated independently. Administrators bypass capability gates, while `requiredRole` still expresses the explicit role boundary. Channels with no accessible tabs are omitted from navigation.

## Legacy bridge

`dashboardKey` and `dashboardTab` are compatibility adapters, not the public information architecture. Keep them while the destination still launches an existing dashboard manager. New navigation code should prefer `channelKey` and `tabKey`.

Canonical page activation happens in `pageStore`: content resolves the active channel and tab first, then the old dashboard shell is synchronized as a compatibility adapter. Header, navigator, Builder, and tutorial components should not recreate that synchronization.

## Validation

Run:

```bash
npm run test:channel-content
npm run test:channel-resolver
npm run audit:channel-assets
```

The content contract checks:

- Required parent channels
- Valid lowercase kebab-case keys
- Unique channel/tab locations
- Valid default tabs
- Existing parent channels
- Valid page placements
- Valid canonical Project placements
- Shared-route tab groups that use `?tab=` addressing

The resolver contract checks:

- Parent inheritance
- Dotti and AMI dialogue compatibility
- Legacy dashboard aliases
- Shared-route defaults
- Role filtering
- Capability filtering
- Administrator bypass

TypeScript validation also runs through the normal project test workflow. Admin users can inspect the live resolved graph at `/navigation-health` and apply Project placement updates at `/project-placement`.
