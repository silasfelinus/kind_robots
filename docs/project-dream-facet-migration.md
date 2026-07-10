# Project, Dream, and Facet Schema Migration

## Decision

The overloaded `Dream` model is being split into three concepts:

- `Project`: a real implementation record synchronized with Conductor and managed by a Bot.
- `Dream`: a creative pitch expanded with a narrator, characters, scenarios, rewards, art, and Facets.
- `Facet`: a lightweight reusable creative building block such as a genre, animal, color, theme, core, mood, style, setting, or art direction.

The first migration is additive. Legacy Project-shaped and Facet-shaped Dream rows remain intact until the audit and backfill phases are reviewed.

## Project ownership

Kind Robots owns Project identity and presentation:

- title, slug, description, and flavor text
- status, priority, goal, and waypoints
- repository and live URLs
- `channelKey` and `tabKey`
- manager Bot
- public/private and mature-content flags
- primary and associated art
- Project chats, reactions, Todos, ArtJobs, and PitchSheet

Conductor owns roadmap execution state:

- milestones
- tasks
- dependencies
- agent ownership
- gates and approvals
- calculated progress
- roadmap notes

`Project.conductorSlug` is the stable join key. It is intentionally separate from the public Project `slug` so routing changes do not silently disconnect Conductor synchronization.

## Navigation placement

`Project.channelKey` and `Project.tabKey` are optional schema fields.

A future placement resolver will:

1. validate `channelKey` against the registered top-level channels;
2. resolve `tabKey` to either a static tab or a generated Project tab;
3. return the canonical route and dashboard state;
4. update the navigation registry after a Project edit; and
5. move the currently open Project to its new location when placement changes.

Components must not independently guess Project placement.

## PitchSheet ownership

A PitchSheet may belong to a Dream or a Project.

The schema temporarily permits nullable `dreamId` and `projectId` fields so existing rows can be migrated safely. The permanent application invariant is:

```text
exactly one of dreamId or projectId must be non-null
```

Migration rule for a Project-shaped Dream:

1. create the Project row;
2. copy or preserve the Project identity;
3. set the PitchSheet `projectId`;
4. clear its legacy `dreamId`; and
5. commit both ownership changes in the same transaction.

The audit script reports every PitchSheet currently attached to a `PROJECT` Dream. No PitchSheet ownership is guessed from title or slug alone.

## Facet taxonomy

Initial `FacetKind` values:

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

Facets connect to Dreams and Scenarios through explicit join models. Explicit joins are preferred over implicit many-to-many tables so later metadata such as role, weight, source, or ordering can be added without another table replacement.

Facet-to-Facet taxonomy uses `FacetRelation` and `FacetRelationType`.

## Migration phases

### Phase 1: additive schema

- Add `Project`, `Facet`, relation models, enums, and optional foreign keys.
- Keep all legacy Dream fields and `DreamType` values.
- Add dual Dream/Project PitchSheet ownership.
- Add the read-only audit command.

### Phase 2: audit

Run:

```bash
npm run audit:schema-shift -- --output=project-dream-facet-audit.json
```

Review:

- all `PROJECT` Dreams;
- PitchSheets attached to Project Dreams;
- Project Dreams missing slugs;
- `GENRE`, `BRAINSTORM`, and `ART` Facet candidates;
- Facet candidates that already own world infrastructure;
- ambiguous `LOCATION`, `PITCH`, and `WISH` rows; and
- taxonomy-oriented Dream relations.

### Phase 3: Project backfill

- Insert one Project per `PROJECT` Dream.
- Preserve IDs where the database plan allows it.
- Move Project PitchSheets transactionally.
- Move Todo, Chat, Reaction, and ArtJob ownership.
- Copy primary and associated art.
- Set `conductorSlug` only when the Conductor match is verified.

### Phase 4: Facet backfill

- Convert clear Genre/Core records.
- Split list-like rows into individual Facets only when the source format is unambiguous.
- Convert taxonomy Dream relations into Facet relations.
- Attach Facets to Dreams and Scenarios.
- Leave ambiguous rows for explicit review.

### Phase 5: API, stores, and UI

- Add `/api/projects` and `/api/facets`.
- Add `projectStore` and `facetStore`.
- Remove Project responsibilities from `dreamStore`.
- Merge database Project metadata with Conductor roadmap state at the Project service boundary.
- Rebuild Project, Dream, and Facet managers around their separate contracts.

### Phase 6: cleanup

Only after parity checks:

- remove `PROJECT` and `GENRE` from `DreamType`;
- remove legacy Project fields from Dream;
- remove legacy Project-Dream sync code;
- remove compatibility reads and dual writes; and
- enforce PitchSheet owner exclusivity more strictly.

## Safety rules

- No destructive data migration before the audit is reviewed.
- No silent classification of ambiguous rows.
- No permanent dual-write system.
- No Project routing logic scattered through components.
- No automatic creation of unknown top-level channels from arbitrary database strings.
- No PitchSheet may finish migration with zero owners or two owners.
