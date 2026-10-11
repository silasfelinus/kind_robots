# Zuzu: Shifting Lands journey engine

Pure rules owner: `utils/shiftingLands/journey.ts`. This is the new, **separate**
five-land engine, separate from the earlier Homestead v1 prototype in
`homestead.ts`. The illustrated five-land board uses the authored journey
reducer plus the V3 replay ledger below, without rewriting older saves.

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

## Derived character progression

`progression.ts` projects a character sheet from saved, source-verified authored
encounter outcomes. Skills, earned techniques, inventory, injuries and named
relationships come from the committed encounter/choice rather than arbitrary
flags or independently rolled cast. Duplicate visits cannot award an item twice.
The Store exposes this derived sheet for the later character rail.

Existing v2 saves and already-recorded 2d6 results remain unchanged. The
`checkJourneySkill` and `canUseJourneyReward` pure helpers define bounded
future checks and consumable eligibility, but do not silently rescore a saved
run or persist item use. Task t-009 must version and replay-validate new
spent-item and technique-modified roll events before the board enables them.

Run `npx tsx utils/scripts/verifyShiftingProgression.test.ts` for the focused
progression and anti-farming contract.

## V3 durable replay ledger

The private board now persists `kr.shiftingLands.journeyLedger.v3`.
`saveLedger.ts` stores the original seed, source hashes, ordered player
commands, spent reward IDs and the current authored V2 rules snapshot.
On restore it replays every command against the pinned authored pack and
checks the exact resulting state, including both dice, selected card identity,
route mutations, journal, boss outcomes and inventory use. Invalid or
duplicate actions, out-of-date sources and mismatched snapshots are rejected.

An existing `kr.shiftingLands.authoredJourney.v2` save is migrated only if
no V3 save exists. The old V2 data is preserved as an explicitly marked
checkpoint because V2 did **not** record every earlier player command.
Every subsequent V3 action is strictly replay-verified from that checkpoint.
The original V2 localStorage key is left untouched. A corrupted V3 record
never falls back to an older V2 copy, which could otherwise restore spent
rewards. Use _New journey_ to clear a rejected V3 in the private preview.

`USE_REWARD` is a deterministic action (currently a healing willow-bark
dose or recovered rations), gated on the specific previously earned item,
available capacity and no earlier use. Replayed actions cannot spend the
same item twice. The existing V2 roll formula remains unchanged so saved
encounters are never retroactively rerolled. Applying newly learned skill
bonuses to live checks requires a separately versioned authored roll contract.

Verify with:

```sh
npx tsx utils/scripts/verifyShiftingSaveLedger.test.ts
```

## V4: authored fixed-cast encounters in all five lands

`authoredLaterLands.json` is a player-safe import from the four source-authoring
packs in Conductor, with each upstream Git blob SHA pinned in `sources`. It
contains 36 additional encounter cards at the twelve later-land locations,
each with whole-card identity, two authored 2d6 choices and separate written
outcomes. Developer notes, prospective art briefs, species/job randomization
and imaginary live ArtImage IDs are not imported. Face art remains pending,
with the existing private board's explicit provisional-art label.

New private expeditions save to `kr.shiftingLands.journeyLedger.v4`; V4
records player actions and source revisions and strictly replays both dice
and the chosen encounter, effects, prospective map shifts, boss gates,
history and spent Rewards before accepting a restored save. The V4 reducer
only changes the later four lands. Homestead's existing authored source and
mechanics stay intact. The V4 branch prohibits legacy prototype `RESOLVE`
actions, so new later-land visits always offer two explicit authored
choices, and a revisit never draws a new scene.

**Compatibility boundary:** An existing V3 save remains a V3 run with the
original V3 reducer and its older prototype rules for the later lands.
V3/old-V2 saves are restored unchanged from their original localStorage
keys; the new V4 key takes precedence if present. A V4 restore failure
does not silently fall back to an earlier save or reroll lost decisions.
Selecting *New journey* deliberately begins a V4 run while leaving the
old saved data untouched. Neither rule set rescales historic dice or
converts a prototype outcome into an authored one.

Validation: `npx tsx utils/scripts/verifyShiftingV4.test.ts` includes
seeded five-land playthroughs, deterministic replay, encounter source
integrity, source-hash and save-tampering rejection, V3 isolation,
outcome/flag history, no double resolution and causal map changes.

Boss-specific story alternatives, bespoke scene image production and the
visible companion/inventory controls remain separate tasks. Production
deployment and public route approval have not occurred as part of this
source implementation.
