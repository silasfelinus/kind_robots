# stores/fallback

Machine-generated public-content snapshots. **Do not edit by hand.**

Each `<model>.json` is written nightly by
[`utils/scripts/snapshotFallback.ts`](../../utils/scripts/snapshotFallback.ts)
via the `fallback-snapshot` GitHub Action, which commits changes to `main`.
Stores import these files the way `conductorStore` imports `CONDUCTOR_CARDS`:
render the snapshot immediately, fetch live data in the background, and keep
the snapshot (flagged as degraded) if the database is unreachable.

Contents are public rows only (`isPublic: true` where the model has the flag)
selected through explicit per-model field allowlists — no user accounts, no
blobs, no private fields. To add a model or field, edit the `SNAPSHOTS`
registry in the script; nothing lands here implicitly.
