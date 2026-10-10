# Zuzu: Shifting Lands journey engine

Pure rules owner: `utils/shiftingLands/journey.ts`. This is the new, **separate**
five-land engine, not an implicit migration of the existing Homestead v2 local
save. The latter remains in `homestead.ts` until task t-009 installs a deliberate
save upgrade and task t-015 wires the visual card board.

## Geography source

`worldSnapshot.json` is a **generated, player-safe subset** of the Conductor
`projects/zuzu-shifting-lands/WORLD-DECKS.json` v2 manifest. It retains exact
stable IDs, location check difficulties, first-land repository artwork paths,
and the Git blob hash of its source. No fictional spoiler secrets, unverified
runtime resource IDs or duplicate image binaries are imported.

From a Kind Robots checkout alongside the Conductor repository:

```sh
node utils/scripts/importShiftingLandsWorld.mjs --check
node utils/scripts/importShiftingLandsWorld.mjs
```

The importer can also take an explicit Conductor source path as its first
argument. A manifest ID/schema change requires a deliberate versioned
migration rather than replacing saved player history.

## Gameplay rules, v1

- Seeded independent three-card layout for each of five lands, with a connected
  triangle route graph and a two-node starting entrance. Visiting an already
  resolved tile changes travel position but cannot farm the encounter.
- An unresolved tile starts one encounter. A deterministic 2d6 skill check or
  costly withdrawal always resolves it; checks never depend on animation timing.
- Some seeded first-encounter outcomes **reorder only unvisited locations**.
  Every mutation includes the triggering place, turn, prior/new order and a
  written causal explanation. Previous visits remain part of the log.
- After exactly three resolved locations, the land boss gate unlocks.
  Challenge, parley or retirement are available; failed trials cost HP, and
  successful trials unlock the next land with a limited HP recovery.
- Five successful bosses end the run in victory. HP 0 ends it in defeat. A
  retreat ends it in retirement. Terminal runs reject further transitions.
- `replayJourney(seed, actions)` deterministically reconstructs run history.
  `restoreJourney` refuses unrecognized versions, source hash mismatches,
  corrupted dice and invalid traversal state, but task t-009 still owns durable
  save/replay persistence and full integrity hardening.

Run the headless contract:

```sh
npx tsx utils/scripts/verifyShiftingJourney.test.ts
```

The v1 encounter effects are provisional and purposely conservative. Named
Rewards, companion stats, complex noncombat trials and game-specific boss
outcomes belong to tasks t-008, t-010 and t-011. No inference provider can
mutate this reducer's state.
