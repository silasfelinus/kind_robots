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
Selecting _New journey_ deliberately begins a V4 run while leaving the
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

## V5: five authored major trials

Every new expedition now faces one scripted major trial after completing
three locations per land. The five trial records in `authoredTrials.json`
are tied to the fixed World v2 boss IDs and supply atmosphere, three clear
approaches, outcome prose, and original design-only art status. They are
reviewed gameplay scenarios, not claims that individual boss illustrations
have been generated. The Abbess's editorial note records her canonical
ritual motives, but this developer-only knowledge is **not** sent to the
visible trial reader. The source also does not resolve the world's lost
human-history mystery.

The player can always make a physical confrontation with a 2d6 skill
check. A second nonviolent bargain costs one provision and uses a different
skill/target. A third evidence-led option unlocks only when its named
earlier encounter outcome flag was actually earned; flags cannot be
invented by revisiting or refreshing. Every attempt spends a turn and
stores its choice, exact dice, outcome text, injuries, and supply changes.
A failed trial leaves the gate active with a real HP cost; Zuzu can try
again if alive. Successful trials unlock the next land, or complete the
fifth chapter. Retreat is always available.

The **V5 ledger** uses a separate `kr.shiftingLands.journeyLedger.v5`
browser key, pins the boss authoring source revision, replays every
action, and rejects altered flags, dice, story outcomes, saved HP, or
invalid trial choices. **Existing V4, V3, and V2 journeys continue with
their original reducers and storage keys**, including all original
generic boss checks. No old roll or boss result is retroactively
rescored. A malformed newer save never silently falls back to stale
older state; _New journey_ deliberately starts the new rules.

`npx tsx utils/scripts/verifyShiftingTrials.test.ts` covers seeded
five-land playthroughs, clue paths, failure and victory, invalid
and tampered saves, legacy V4 compatibility, and checks the developer
lore never appears in the visible scene DTO. The separate human-gated
public release, bespoke boss illustrations, and live deployment remain
out of scope.

The three boss approaches remain character decisions: a species or faction never
by itself unlocks, blocks, or determines the outcome of a route.

## Illustrated character rail and presentation controls (t-016)

The private Shifting Lands board now uses
`components/shifting-lands-character-rail.vue` to display the derived
`journeyCharacterSheet` alongside the artwork. It shows health,
provisions, six skill ratings, bounded earned techniques, injury
conditions, source-earned supplies/evidence, and named contact bonds.
This is **not** a separate mutable character profile: it reads the
same replay-verified game store as the encounter reader.

- Each supply or medicine button dispatches the existing
  `USE_REWARD` event, which applies its bounded effect only if actually
  earned and useful, persists it in the versioned save, and refuses
  duplicate consumption. Evidence stays non-consumable.
- Contacts accurately distinguish trusted or wary relationships; the
  current authored rewards do not recruit any traveling companions.
  New companion gameplay requires explicit authored onboarding and a
  separately versioned rules contract, not labeling a stranger as
  traveling.
- Dice sound is **muted by default** and only plays when the user
  explicitly enables it and initiates a roll. The short cue uses the
  browser's Web Audio API without fetching audio or contacting a
  service. The motion toggle affects card reveal and dice animations;
  the device's reduced-motion setting is honored when there is no
  saved user preference.
- Motion and sound preferences live in their own local browser
  `kr.shiftingLands.presentation.v1` key. They never change the RNG,
  success target, action ledger, or evidence. Journal filters likewise
  only change which recorded events are displayed.

Run `npx tsx utils/scripts/verifyShiftingCharacterRail.test.ts` to
verify the board wiring, preference guards, replayed one-use rewards,
and the refusal to invent companions or re-score old dice. The
existing five-land/boss and old-save tests run alongside it.

This implementation is an admin-only source change. The bespoke
character/companion illustration campaign, authenticated live visual
vetting and public launch are separate tasks.

## Second-person prose pass (2026-10-18)

Every card, trial and journal line is written in second person ("you"),
present tense, without naming, gendering or describing the hero, so a
later character can walk the same quest. The Kind Robots packs are now the
source of truth for player-facing wording; the pinned Conductor blob SHAs
still name the rules each pack was imported from.

Prose is presentation. Restores (`sameReplay` in `saveLedger.ts`) still
demand identical dice, choices, flags, HP, provisions, routes and trial
results, but ignore `text`, `reason` and `resultText`, so a save made
before a wording change restores with the new wording instead of being
rejected. Rules stay pinned: `verifyShiftingTrials` fingerprints every
trial choice's skill, target, cost and clue flags, and any change there
still needs a new save version.

Choice chips read like Shifting Desks: a difficulty word for the target
(`readCheck` in `journey.ts`: Routine 7 … Desperate 12) followed by what
the two dice must show after the skill bonus. Tapping the chip explains
the sum and shows the stake line (`risk`).

## V6: Shifting Desks-depth decks (t-031/t-032, 2026-10-18)

Silas asked for Shifting Desks' depth (24 encounters per level) in the Zuzu
voice: hard decisions, the cost of sacrifice, and doing good in a world that
does not always reward it. A run still draws one card per location, so the
pool size and the choices on each card are what make replays differ.

- **Content**: `authoredDecksV6.json` adds 72 cards (eight per location, 24
  per land, 120 in all) and a third or fourth choice to each of the 48
  original cards. The originals keep their text and their first two choices
  in the base packs, so V2–V5 saves replay untouched.
- **Choices** (`deckV6.ts`): a choice may be *certain* (`roll: null`, no
  failure), *gated* (`requires.anyFlags` on one of ten shared deed flags such
  as `deed-shared-bread` or `deed-left-someone`, so early mercy or cruelty
  echoes later), and may carry an up-front `cost` in health or provisions.
  `choiceLock` explains a closed route in words; every card keeps at least
  one route with no gate and no cost.
- **Moral ledger**: outcomes add `marks` (mercy, honesty, courage, cunning,
  ruthlessness). Nothing reads them yet; endings that do are t-034.
- **Save**: `kr.shiftingLands.journeyLedger.v6` (`saveLedgerV6.ts`) replays
  every action; trials reuse the V5 trial rules. New journeys start on V6;
  a V5 save keeps playing V5.
- **Board**: certain choices show a "Certain" chip, costs show in red,
  and locked routes sit in a compact dashed row that explains itself on tap.

`verifyShiftingV6.test.ts` checks the content contract, plays 320 seeded
runs with four policies (exact replay, prose-tolerant restore, forged dice
and forged marks rejected, locked routes refused, no dice for certain
choices, costs applied), and pins a fingerprint of the deck rules: any change
to ids, weights, rolls, costs, gates or effects must bump `schemaVersion`
because saves replay against the old draw pools.

Balance at merge (400 seeds per policy, see t-035): V5 random play wins
29%; V6 random 40%, cautious 45%, ruthless 46%, kind 28%. Kindness costs
you, by design; t-034's endings are where it is meant to pay.
