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

## Admin board integration (t-015)

`/admin/zuzu-shifting-lands` now opens `components/shifting-lands-journey-board.vue`
by default; the original Homestead prototype remains available through the
Homestead workshop switch. Only administrators see either workshop.

The new private board is a store-driven view of the deterministic journey
reducer. `stores/shiftingLandsJourneyStore.ts` is the one session/persistence
owner: actions dispatch to the pure engine; failed/duplicate actions leave
the state untouched. The board never changes HP, location history, dice,
decks, or boss outcomes in animation callbacks. `NavigationFlipCard`
provides the deal spin; the saved reducer state determines face-up vs
face-down cards after refresh. `kr-card-flip` provides persistent,
keyboard-dismissible inspection of recorded locations. The draw pile
selects the next legal unresolved reachable tile; the discard pile and
history gallery inspect past visits without rerolling.

The new preview uses `kr.shiftingLands.journey.v1` for its own local save,
leaving `kr.shiftingLands.homestead.v1` intact. The resume guard rejects
mismatched source-blob hashes and malformed state. This is local preview
persistence, **not** the robust, audited cross-device save/replay migration
owned by t-009.

Four Homestead plates are tied to source-verified scene files. The later
lands use separate, clearly labeled **provisional ambient plates** from
existing Zuzu Gamebook art, not manufactured location-specific ArtImages.
Later-land dedicated illustration and live resource linkage remain t-013.
The reward/companion decks are intentionally marked upcoming rather than
pretending unimplemented resources have been dealt.

Acceptance for t-015 is code/contract CI and scoped review, **not** proof of
authenticated, live phone/tablet/desktop screenshots, deployment, or public
launch. That last gate remains t-018. No `/play` route has been introduced.
