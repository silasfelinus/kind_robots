# Project, Dream, and Facet schema split

Status: accepted for additive implementation

## Model boundaries

### Project

A Project represents implementation work managed by Kind Robots and optionally synchronized with a Conductor project directory.

Project owns:

- identity and presentation
- project status, priority, goal, and waypoints
- repository and live URLs
- `conductorSlug`
- `channelKey` and `tabKey`
- an optional Manager bot
- project art
- project Todos, Chats, Reactions, and PitchSheet

Conductor remains authoritative for roadmap milestones, tasks, gates, agent ownership, and calculated progress.

### Dream

A Dream represents a creative pitch expanded into a narrated experience or world.

Dream owns:

- pitch, description, and flavor text
- narrator bots
- characters, scenarios, and rewards
- art and collections
- facets
- creative chats, compositions, life runs, and PitchSheet

Project workflow fields must leave Dream after the compatibility migration is complete.

### Facet

A Facet is a reusable creative building block. Facets do not receive a narrator, cast, scenarios, or rewards of their own.

Initial kinds:

- `GENRE`
- `ANIMAL`
- `COLOR`
- `THEME`
- `CORE`
- `MOOD`
- `STYLE`
- `SETTING`
- `ART_DIRECTION`
- `OTHER`

Facet taxonomy uses Facet-to-Facet relations. Dreams and Scenarios may attach many Facets.

## Navigation contract

Project navigation fields are named `channelKey` and `tabKey` in Prisma and API payloads.

A single placement resolver must translate those keys into a route and dashboard state. Components must not independently guess Project placement.

Editing either key must:

1. persist the Project,
2. refresh the runtime navigation registry,
3. remove the Project from its old placement,
4. add it to its new placement,
5. navigate when the edited Project is currently open.

Unknown top-level channels are invalid. A Project may generate a runtime tab within a known channel.

## PitchSheet ownership

PitchSheet supports exactly one owner during the additive migration:

- `dreamId`, or
- `projectId`.

Both fields are nullable so existing PitchSheets can be classified and moved safely. Application validation and migration audits must reject rows with both owners or neither owner. A later database check constraint may enforce the XOR rule once production data is clean.

When a Project Dream is migrated:

- its PitchSheet moves to the new Project,
- the PitchSheet row is retained,
- `projectId` is populated before `dreamId` is cleared,
- the operation is verified before the legacy Dream is archived or deleted.

## Migration rules

1. Add new models and foreign keys before removing anything.
2. Audit current data before backfilling.
3. Never classify ambiguous Dream rows automatically.
4. Preserve Project Dream IDs when safe; otherwise persist an explicit legacy mapping.
5. Keep `slug` and `conductorSlug` separate.
6. Do not maintain permanent dual writes.
7. Remove `PROJECT` and `GENRE` from `DreamType` only after all readers and writers use Project and Facet APIs.

## Planned implementation slices

### Slice 1: evidence and additive schema

- data audit script
- Project, Facet, and relation models
- dual-owner PitchSheet
- nullable Project foreign keys on project-scoped records
- no behavior cutover

### Slice 2: Project backfill and API

- backfill Project Dreams
- migrate Project PitchSheets and Todos
- create Project API and store
- merge database metadata with Conductor state

### Slice 3: Facet backfill and API

- migrate clear Genre records
- split list-like building blocks
- migrate taxonomy relations
- create Facet API, store, and workspace

### Slice 4: UI cutover and cleanup

- rebuild Project workspace around Project store
- narrow Dream workspace to creative world building
- add dynamic Project placement registry
- remove compatibility fields and legacy paths
