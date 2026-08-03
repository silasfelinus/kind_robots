# Conductor projection in Kind Robots

Kind Robots does not independently own roadmap or human-gate state. It stores a materialized read projection of the canonical Conductor repository so application pages can read coordination data quickly and reliably without fetching dozens of GitHub files on every request.

## Authority

| Data | Authority |
|---|---|
| Project lifecycle and coordination priority | Conductor |
| Roadmap tasks, milestones, dependencies, claims, gates, notes, and pitches | Conductor |
| Project title, description, route, channel, tab, URLs, and artwork | Kind Robots `Project` |
| User state, runtime queues, ArtJobs, payments, grants, and application data | Kind Robots |

`Project.conductorSlug` is the cross-repository join key.

## Data flow

```text
Conductor main commit
  -> scripts/sync_kind_robots_projection.py
  -> POST /api/conductor/sync
  -> ConductorProjection singleton row
  -> GET /api/conductor/projects
  -> For You and project planning surfaces
```

The snapshot contains the exact source commit SHA, lifecycle registry, raw roadmap text, pitch text, and image versions. Kind Robots validates the complete payload before replacing the last known good snapshot.

Human decisions travel back as commands, not database edits:

```text
Kind Robots human action
  -> Conductor task event or pitch update
  -> committed Conductor state
  -> next projection snapshot
  -> Kind Robots read view
```

An optimistic browser update is temporary feedback. It is not canonical completion until Conductor commits the transition and that commit is projected back.

## Project update behavior

The sync endpoint updates only coordination fields on an existing `Project`:

- `conductorSlug`, when missing;
- `status`;
- `priority`;
- `lastSyncedAt`.

It never overwrites an existing Project's title, description, route, channel, tab, URLs, or artwork.

For a missing Project row, legacy presentation values from Conductor may seed the new record once. After creation, Kind Robots owns those fields. Do not add new presentation metadata to Conductor `project-overrides.yaml`.

## Storage

`ConductorProjection` is an additive singleton table created by migration `20260803113000_add_conductor_projection`. It is intentionally accessed through parameterized raw Prisma queries rather than generated Prisma models. This keeps the projection isolated from the application's domain schema and makes its cache status explicit.

The stored payload is versioned. A future payload change must increment the version and preserve a deliberate compatibility path.

## Failure behavior

- A rejected or failed sync leaves the previous projection intact.
- If no projection exists yet, `/api/conductor/projects` returns no live coordination data and the existing static fallback cards remain available.
- Kind Robots must not fall back to live GitHub fan-out, because that would create a second runtime path with different freshness and failure semantics.
- A stale projection is diagnosed by comparing `projection.sourceCommitSha` with Conductor `main` and inspecting the `Sync Kind Robots projection` workflow.
- Repair the sync or event path. Never patch projected roadmap state directly in the Kind Robots database.

## Agent rules

Before changing cross-repository project data:

1. Identify the owning repository from the table above.
2. Make the change only at the authority.
3. For Conductor coordination changes, verify the projection workflow accepted the exact commit SHA.
4. For Kind Robots presentation changes, do not mirror the change into Conductor.
5. For Kind Robots human actions, verify event processing and the subsequent projection round trip.
