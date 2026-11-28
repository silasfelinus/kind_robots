# Rainbow Bullet Hell Space Princess: blind gameplay critic, round 2

Lens: gameplay and fairness (#4146 §2, §3, §4, §8, §9). Build: `main` at `459343a2` (2026-11-27). This was a
read-only review: no game code was changed. Probe scripts were scratch copies of `utils/scripts/rainbowPersonas.ts`
with four hooks added: per-seat idle, forced steering to a parked spot, always-focus or evade-spam flags, and a
cabinet pilot select. They ran against the real engine (`createRainbowPrincessPreview`, damage on, ordinary
`InputFrame`s, no snapshot edits).

## Verdict

**Not yet ready for human playtesting.** The campaign holds together: every persona reaches THE END and all 70
headless verifiers pass. But two co-op mechanics fail silently on the most common local setups (Halo revive, and
X/Y on keyboard or touch), and the solo ship balance gap is large enough that a first-time Petal Wing pilot sees
most guardians escape and a 10–12 minute final boss. Fix those three, then hand it to humans.

## Findings

| #   | Severity | Where                                   | Crew                               | Finding                                                                                                                                      |
| --- | -------- | --------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | major    | every Act, every super                  | 2p always; 3p/4p unless Halo is P3 | **Halo Fin's revive only works from seat index 2.**                                                                                          |
| G2  | major    | all Acts                                | 2–4p on keyboard or touch          | **Local co-op drops X (special) and Y (evade) for every non-gamepad seat.**                                                                  |
| G3  | major    | all Acts, worst at B04 Delphion and B09 | 1p (and seat 1 of every rotation)  | **Solo ship balance: Petal Wing unfocused is about half the DPS of the others, and Halo Fin dominates.**                                     |
| G4  | major    | B09 Eclipse Crown                       | 1p novice; 1p unfocused            | **The finale is a wall and a sponge: novices retry it 15–20 times, and unfocused solo fights run 5–12 min.**                                 |
| G5  | major    | B03 Clawburst, phase 1 (Act III)        | 1p, 4p                             | **Permanent safe pocket at (20,60) that still damages the boss.**                                                                            |
| G6  | minor    | Acts I–V (4p), Act I (1p)               | 4p                                 | **Infinite continues plus boss-HP carry-over still let a crew that never moves progress.** (round-1 D8, unchanged)                           |
| G7  | minor    | all bosses                              | 1p Prism / Comet                   | **Evade spam is the strongest boss strategy for Prism Lance and Comet Crown.**                                                               |
| G8  | minor    | co-op, any Act                          | 2–4p                               | **A fallen seat sits out until the whole crew wipes, and the boss keeps its full-crew hull.**                                                |
| G9  | minor    | Acts II–VIII                            | all                                | **The mortar launcher creature is still shared across 7 Acts** (round-1 D7: shells now differ per Act; the creature, AI and drawing do not). |

### G1 (major): Halo revive is keyed to seat 2, not to the Halo Fin pilot

- **Code:** `superAttack` calls `haloRevive(ships, activePlayers, seat)` (`utils/arcade/games/rainbowPrincessPreview.ts:3816`).
  `haloRevive` then rejects any `caster !== 2` (`utils/arcade/games/rainbowLocalCoop.ts:48`). It compares the _seat
  index_ with the Halo _pilot kind_. The unit tests (`verifyRainbowLocalCoop.test.ts:50-64`,
  `verifyRainbowSuperBoundaries.test.ts:229-234`) pass `2` for both meanings, so they cannot catch this.
- **Effect:** in 2p the revive can never fire, because seat 2 does not exist. In 3p/4p it works only when Halo Fin
  sits in P3, which is true of the default rotation and false of any custom select. Hangar, help and comms
  advertise the revive as Solenne's role. Any 2p crew that picks her gets nothing for it.
- **Repro (ran):** `revive.ts`, typical persona, seed 7. Crew 2, cabinet select pilot 2 (seats = Halo, Comet); seat 1
  idles until it falls; seat 0 keeps flying and fires supers. **15 Halo supers while the partner was down, 0
  revives.** Control: crew 3 default rotation (Petal, Prism, Halo; Halo in seat 2), seat 1 idle: **4 supers, 4
  revives.**
- **Fix:** pass the pilot kind (`pilotOf(seat)`) as a separate argument from the caster seat. Add a test with Halo
  in seats 0, 1 and 3.

### G2 (major): local co-op loses the four-button kit except on gamepads

- **Code:** whenever more than one player is seated (`duo = players > 1`), the cabinet renders only A/B touch
  buttons: `v-if="fourButtons && !duo"` (`components/arcade/arcade-cabinet.vue:288`, `:874`). The shared-keyboard
  maps `P1_KEYS` / `P2_KEYS` (`utils/arcade/input.ts:114-140`) bind no `x` or `y`. Seats 3–4 have no keys at all,
  and remapping is skipped in duo (`seatOneKeys`, `arcade-cabinet.vue:1416`).
- **Effect:** in 2–4p on one keyboard or one tablet, nobody has a special (Petal Shield, Prism Beam, Halo Pulse,
  Comet Volley) or an evade, the untouchable dodge. A gamepad seat beside them has both, so seats are unequal. The
  same ship plays very differently in 1p and 2p. §8 asks for proven local seats with distinct supers and controls.
- **Evidence:** `verifyRainbowCoopCabinet.browser.test.mjs` passes ("4 touch pilots at once"), but its own
  screenshot (`four-pilots-touch.png`, 1024×768) shows four pads with **A and B only**. Keyboard: read in code.
- **Fix:** give P1 and P2 two more keys each (for example P1 `Q`/`E`, P2 `,`/`'` or numpad), and draw X/Y on co-op
  touch clusters where they fit (tablet). Otherwise, state plainly in the help that the special and evade are
  gamepad-only in co-op.

### G3 (major): solo ship balance, with no single mandatory pick but a clear weak default

All runs: solo, seed 7 (and 99 where shown), continues taken, ships chosen through the real cabinet select. Time is
boss on screen until defeat; guardians that hit the 44 s escape timer count as escaped.

| Ship (pilot)         | typical, unfocused: total / B04 / B09 / guardians escaped         | expert (focus in dense fire): B04 / B09 | always focus: total / B04 / B09 |
| -------------------- | ----------------------------------------------------------------- | --------------------------------------- | ------------------------------- |
| Petal Wing (Maribel) | 72.2 min / 275 s / **731 s** / 6 of 8 (seed 99: 63.6 / 262 / 590) | 275 / 204 s; 273 / 496 s (seed 99)      | 49.1 / 77 / 207 s               |
| Prism Lance (Azure)  | 52.5 min / 43 s / 362 s / 2                                       | 130 / 124 s; 131 / 142 s                | 52.4 / 118 / 265 s              |
| Halo Fin (Solenne)   | 58.4 min / 55 s / 584 s / 4                                       | 54 / 110 s; 36 / 102 s                  | 45.7 / 43 / 160 s               |
| Comet Crown (Vivi)   | 59.0 min / 163 s / 443 s / 3                                      | 149 / 333 s; 157 / 355 s                | 56.2 / 129 / ~200 s             |

- Act I boss HP trace (ran `hp.ts`): Petal unfocused deals ~4 HP/s (375 HP in 92.7 s); Prism deals ~8 HP/s (45.6 s).
- Petal Wing is seat 1's ship by default and the persona baseline, so a new solo player gets the weakest unfocused
  ship. Holding B rescues it (B04 275 → 77 s), so the tradeoff is real. But focus also slows the ship: always-focus
  runs took 54–68 hits vs 20–26 unfocused, so "hold B or the guardian escapes" is a steep, unexplained ask.
- Halo Fin is the best or tied-best in every column and also carries the revive and the shield super. Comet Crown
  is the slowest _focused_ ship at bosses.
- Delphion (B04) is the outlier: 126–275 s for three of four ships unfocused.
- **Fix:** raise Petal's unfocused single-target output (narrower spread, or the main shot at 2 damage like Prism),
  bring Halo's power-3 side guns down or Comet's focus up, and run the same table again. Put "hold B to focus" in
  Lilt's Act I teaching beat for Petal specifically.

### G4 (major): the Eclipse Crown is a difficulty wall and, unfocused, a sponge

- **Novice** (re-decides every 18 frames, no B/X/Y), solo, all four ships, seeds 7/99: every run reaches THE END
  only through 37–77 continues. The **Crown accounts for 8–21 attempts per run**, about 35–60 s each, against 2–4
  attempts for every other boss. 4p novice: 7 Crown attempts of 67–102 s.
- **Typical unfocused solo:** the Crown fight alone runs **300–731 s** (5–12 min; plea scene ~7 s included). Expert
  focus runs: 102–496 s.
- The carry-over HP is what lets novices through: each retry chips the hull. That is generous, but it means a
  novice's finale is 15–20 deaths in a row. Human playtesters will feel the spike.
- **Fix:** smooth the curve: a Crown phase-1 hull closer to the Act VIII boss, or a Cadet-only phase cut, and
  re-measure the novice attempts.

### G5 (major): Clawburst phase-1 safe pocket

- **Repro (ran):** typical persona, seed 7, pilot 0. On the first Clawburst frame (Act III), steer every seat to
  **(20,60)** and hold A only.
  - 4p: **0 hits for ~80 s while the hull falls 1530 → 954**, the whole of phase 1. Hits start only in phase 2
    (98 hits by 297 s).
  - 1p: **0 hits for 150 s** while the hull falls 450 → 298 (all of phase 1); hits again in phase 2.
  - (20,34) is also 0 hits but deals no damage.
- Sweep context (13 s holds at 21 spots × 9 bosses, 1p and 4p): no other zero-hit-and-damaging spot survived a 60 s
  confirm. Delphion's (20,215)/(90,215), Glass Eel's (200,215)/(90,175), Sawtooth's (20,95) and Leviathan's
  (200,175) all took 11–47 hits in 60 s. The round-1 Crown pocket (D6) is gone: the best 4p Crown spot dealt 11
  damage in 13 s with 0 hits.
- **Fix:** give phase 1 an aimed or top-lane component, the same treatment Crown and Delphion received, and add the
  case to `verifyRainbowBossCamping.test.ts`.

### G6 (minor, owner call): a parked crew still progresses

- The `idle` persona (never moves, holds fire, takes every continue), seed 7:
  - 4p: reaches **Act VI** within the 400 000-frame cap (111 min, 116 continues), killing the Act I–V bosses through
    HP carry-over.
  - 1p: stuck in Act I (128 continues, 55 min).
- Unchanged from round 1. Cap continues per Act, or reset the boss to its current phase's start on continue.

### G7 (minor): evade spam favours Prism and Comet

- Typical persona plus Y whenever its cooldown allows, seed 7, solo. Hits barely move (Prism 20 → 19, Comet 25 → 16),
  so this is not invulnerability abuse.
- But the forward dash and boost carry the ship to point blank, and boss times collapse:
  - Prism: B04 43 → 42 s, B09 362 → **146 s**, total 52.5 → 44.8 min.
  - Comet: B04 163 → **34 s**.
- For Petal and Halo it is neutral or worse.
- It is a legitimate risk/reward move, but it makes "mash Y toward the boss" the best plan for two ships. Consider
  untouchable frames that do not damage-share with point-blank fire, or a longer cooldown on the forward dash.

### G8 (minor): fallen co-op seats

- A seat that loses its last life is out until the _whole_ crew wipes. Apart from G1's broken Halo revive, there is
  no respawn at a checkpoint, Act or boss.
- Boss and guardian hulls are fixed at spawn by `activePlayers` (`rainbowBossHp`: 2.5 + 2 × (n − 1)), so a lone
  survivor of a 4p crew faces 3.4× the solo hull. The quickest way back is to die on purpose and take the continue.
- Read in code (`rainbowPrincessPreview.ts:4466`, `:3455-3467`); not separately run.

### G9 (minor): shared launcher creature

- `launcher: { kind: 'mortar', every: 1500 }` remains in Moonjelly, Trench, Rosefin, Wreckyard, Crown Reef, Glass
  Current and Eclipse Palace.
- `verifyRainbowPlaytestTwo` proves the shells now differ per Act, but the creature, its AI and its drawing are one
  enemy.
- Read in code only.

## Round-1 items checked again

- **D1 (super on B):** fixed. A tap of 12 frames or less fires the super; a hold is focus (`SUPER_TAP_FRAMES`,
  `:5315-5322`).
- **D2 (super spam):** improved. The kill refund is 4 (`SUPER_REFUND`), boss damage is 3.5–5% of max HP, and a
  typical solo pilot fires 31–44 supers in 50–72 min (about 0.7 per minute). The wipe is still whole-screen.
- **D3 (co-op sponge):** improved. Hull is 3.4× at 4p. A 4p typical crew (default rotation) ran B04 177 s, B09 411 s
  and 60.6 min in total, against solo Petal 275 / 731 s and solo Halo 55 / 584 s. Four ships are now roughly as
  fast as one, not slower.
- **D4 (HUD panel):** the seat rows moved into the top bar (`rainbowHudStatusSlot`, two columns, `:488-494`). Not checked
  visually here.
- **D5 (guardians):** they now have five motions (bob, sweep, orbit, stalk, lunge). HP stays flat by design.
- **D6 (Crown pocket):** fixed (see G5's sweep).
- **D7:** see G9.
- **D8:** see G6.

## What I ran (observed)

- All **70** `npx tsx utils/scripts/verifyRainbow*.test.ts`: **all exit 0**. Campaign matrix: 16 fresh runs to THE
  END, median 47.4 min (36.3–55.4), endings loyal-evacuate, rebel-restore, rebel-sever and stood-down-restore.
- `verifyRainbowCoopCabinet.browser.test.mjs` with the preinstalled Chromium (`CHROMIUM_PATH`): pass, plus the
  screenshot cited in G2. No Nuxt dev server was started; the other browser tests were not run.
- Persona matrix, all to THE END unless noted, 1p:
  - {typical, expert, novice} × 4 ships × seeds {7, 99}
  - always-focus × 4 ships
  - evade-spam × 4 ships
  - idle 1p and idle 4p (capped)
  - typical 2p and 4p, novice 4p
- Pacing: a clean solo run is 45–72 min depending on ship and play style; novices take 52–86 min. About 47 min with
  the autopilot.
- Camping sweep: 21 spots (x ∈ {20, 90, 200} × y ∈ {34…245}) × 9 bosses, 1p and 4p, 13 s each; 60 s confirms on
  every candidate; 300 s confirms on Clawburst.
- Revive probe (G1).

## What I only read in code

G2 keyboard mapping, G8, G9, D4 layout, guardian HP and motion, and the save/medal flow. I found no false-award path
in `awardMedal` / continue: hits accumulate through a continue, and a save resumes at Act start with the counters at
zero. Seed variety (round-1 D9) was not re-checked.

**Verdict: not ready for human playtesting.** Halo Fin's revive never works in 2p, keyboard and touch co-op seats
have no special or evade, and solo Petal Wing (the default ship) is weak enough to skew the first impression. Fix
G1–G3, then hand it to humans.
