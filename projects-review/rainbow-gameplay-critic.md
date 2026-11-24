# Rainbow Bullet Hell Space Princess: blind gameplay critic pass

Reviewer: an independent, fresh agent session (no prior context). Lens: issue #4146 §4 and §9 (enemy and
pattern variety, rhythm, onboarding, readability, bullet spam, boss sponges, fair deaths, loadout clarity,
exploits, 1-player vs 4-player scaling).
Build: `main` at `13bcffba` (there are no `utils/arcade/` changes since `4897c0c9`, where the runs were taken).
All numbers come from the real engine (`createRainbowPrincessPreview`, `demo: false`) driven headless at
60 Hz with scripted policies. Screenshots are the engine's own `render()` in Chromium (Playwright), with the
painted art served from `public/`.

## Verdict

**You can play it from start to finish, and it is fair, but it does not pass the critic gate yet.** Every
policy that actually flies gets from Act I to THE END with 1 to 4 pilots and on every seed I tried, in
48–66 minutes. A reachability check across both full campaigns found no undodgeable window. I found no hide
spot that holds up over a whole Act in Acts I–VIII; the finale is the exception (D6). There are six major problems, and all of them are systemic, not
cosmetic:

- B is both the focus button and the super button.
- Supers are cheap enough to spam as screen wipes.
- Co-op boss HP over-scales, so 4-player fights are as long as solo fights or longer (the finale is 1.75× longer).
- The 4-player HUD panel covers live playfield and hides hostile pellets.
- The mid-Act guardians are one AI with different pictures, sitting at the same timestamp in every Act.
- The finale Crown has a permanent safe pocket: a parked 4-pilot party took 0 hits for 200 s while it cleared phase 1.

None of these blocks a human playtest. All six should be fixed before the gameplay part of §9 is called met.

## Defects

| id | severity | seed | Act / stage | players · pilots | defect | reproduction | evidence | suggested fix |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| D1 | major | 7 (any) | Act I onward (all) | 1p · Maribel/Petal Wing (any pilot; 4p the same) | **Focus and super share B, and the super fires on any fresh B press.** Charge refills so fast that a pilot who never taps B on purpose sits at 100% for **91%** of combat frames (1p) or **81%** (4p). So nearly every attempt to focus (hold B for precise fire or slow movement) spends the super instead, and the pilot cannot save a super and focus at the same time. The weapon tradeoff the loadouts advertise (focus families vs spread) is muddied by an accidental screen wipe. | Policy `dodgeNoSuper` (fire held, never B) from a fresh run. Charge reaches 100 at frame 748 (tick 749, Act I waves). On the next frame hold and press B to focus: `focus: true`, charge **100 → 0**, enemy pellets **24 → 0**. Share of frames at 100%: `charge.ts` over the full campaign. | `superAttack` is called on `keys.pressed.b` (`rainbowPrincessPreview.ts:5165`), and focus is `keys.held.b` (`:5020`). HUD strip "B FOCUS/SUPER". `d3-super-ready-12s-act1.jpg` shows SUPER READY 12 s into the first waves. | Move the super off B: Y/X on the four-button cabinet, and a deliberate gesture on two buttons (A+B chord, double-tap, or fire on release of a tap under ~8 frames that never became a hold). At minimum, never trigger the super when B is pressed while pellets are within focus range. |
| D2 | major | 7, 99, 2026 | all Acts and bosses | 1p Maribel; 4p Maribel/Azure/Solenne/Vivi | **Supers are effectively unlimited screen wipes.** Each kill refunds +12 charge (an urchin +24), each graze +2, a charge pickup +35 and a guardian +30. Each super deletes *every* enemy pellet on screen and deals a flat 20/28 to the boss. A spam policy fires **3.5 supers per pilot-minute** solo (one every ~17 s). In 4p it is 1.1 per pilot-minute, so the party wipes the screen about **every 14 s**. Spamming is strictly dominant: it is faster and you die less. Issue §3 asks for "limited supers". | Policy `dodgeSpamB` (tap B every 20 frames) vs `dodgeNoSuper`, seed 7, full campaign. | Boss times, solo, no-super → spam: B01 59 → 35 s, B02 88 → 49 s, B06 98 → 46 s, B07 103 → 58 s. Continues, 1p: 16 → 12; 4p: 14 → 8. The 1p spam run ended with 196 supers in 56 min. Refund at `rainbowPrincessPreview.ts:3654-3657`; the wipe is `enemyShots.length = 0` at `:3484`. | Cut the kill refund to about 2–4, keep grazing as the main source of charge, and drop it on death. Make the wipe a radius, not the whole screen (Halo Pulse already does this). Or cap supers at about 1 per life or 2 per Act. Scale boss damage as a share of max HP so it stays meaningful in co-op (see D3). |
| D3 | major | 7 | every boss and guardian; worst at the Finale (B09) | 1p vs 4p (default rotation) | **Co-op hull scaling over-scales, so 4p fights become damage sponges.** `rainbowBossHp = base × (2.5 + 4 × (n − 1))`, so 4 pilots get **5.8×** the solo hull with only 4× the guns. Guardians scale the same way: 125 HP → 725 HP. Stage pressure does *not* scale: waves are identical and aimed fire targets the nearest pilot. Each 4p ship is therefore in about ¼ of the solo danger while the bosses last longer. In the finale, the flat 20-damage super is 2.7% of the solo Crown but 0.46% of the 4p Crown. | Heart-aimed `dodgeNoSuper` bot, seed 7, played to the B09 fight. Party parked at the left edge (20,135) for one minute of Act II: `hide.ts 1 S02 ML` vs `hide.ts 4 S02 ML`. | B09: solo 750 HP, 70 s phase 1 + 90 s heart = **2.7 min**; 4p 4350 HP, 73 s + 210 s = **4.7 min**. With weaker aim, one 4p no-super run took 749 s (12.5 min). The other bosses run 1p ≈ 4p (B02 88 vs 87 s, B03 63 vs 60 s, B08 80 vs 80 s, B07 104 vs 121 s): four ships are no faster than one. The parked Act II minute took 18 hits in total both solo and 4p. `d6-crown-heart-4p.jpg` shows the heart after 60 s of phase 2 at 1557/4350. | Make each extra pilot add roughly ≤ 1.0× the solo share (e.g. `2.5 + 2 × (n − 1)`, about 3.4× at 4p). Scale stage aggression with the party instead: more aimed sources, or alternate targets. Make supers deal a share of `maxHp`. |
| D4 | major | 7 | all Acts, worst at the Finale (B09) | 2p, 4p | **The 2–4-player status panel covers live playfield.** A 91%-opaque box at logical x 304–462, y 29–(33 + 10·(n−1)) (y 29–63 at 4p) is drawn over the action. Ships may fly at y ≥ 34, x ≤ 440, and pellets live down to y 22. Hostile pellets travel under the box unseen, and it also clips the boss bar ("HEART FREE" is cut off). The per-ship "SUPER READY · TAP B" labels also stack into a cluster in 4p. | `hud.ts`: seed 7, `dodgeNoSuper`, full campaign, count frames with a non-ghost pellet inside the box. Screenshot: 4p, first finale frame with ≥ 3 pellets in x 320–450, y 36–60 (frame 180296). | **10.8%** of 4p combat frames have a live pellet hidden under the panel (39 486 pellet-frames; 8284 frames in the finale alone; 2497 frames with an enemy craft's centre under it). 2p: 5.1%. `d4-4p-hud-hides-pellets.jpg`: B09's upper spokes vanish at the panel edge. `d6-crown-heart-4p.jpg`: the boss bar is clipped. Code: `rainbowPrincessPreview.ts:9182-9195`. | Put the seat rows inside the 29-px top bar (two columns of two), or below the playfield. Otherwise keep ships and pellets out of the panel's rectangle, or draw it translucent *under* the pellet layer. Show "SUPER READY" as a ring on the ship, not a text label. |
| D5 | major | 7 | the guardian section of Acts I–VIII, X2, X3 | 1p Maribel (4p the same) | **Guardians are copy-paste AI and sit on a template beat.** All 15 kinds share one body: the same base HP (50, so Act VIII's guardian has the same 125 HP as Act I's), the same hold x 384, the same sine bob `135 + 42·sin(f/70)`, the same 36-frame warning, the same 120/96 cadence and the same escape timer. Six kinds fire the same volley: an aimed double fan that leaves the aimed line open (lantern default; matriarch even volleys; siren odd; warden even; shoalkoi; lampkeeper). The aimed line is where the pilot already is, so **standing still is safe**. Every guardian also arrives exactly **6300 frames (105 s) into Acts II–VIII** and lasts about 31–37 s. | Run `dodgeNoSuper` until the Act II `lantern` guardian appears, then freeze the ship (hold A, no movement) for the whole section: `guard.ts 1 freeze`. Guardian start frames come from the full-campaign boss log. | Act II lantern guardian vs a frozen ship at (89,164): **0 hits over 33 s**. Dodge-bot guardian durations, seed 7, 1p: 34, 31, 31, 32, 37, 35, 31, 32 s. Guardian start offsets from Act start: 5700, 6300, 6300, 6300, 6300, 6300, 6300 frames. Code: `rainbowGuardian.ts` `createRainbowGuardian`, `stepRainbowGuardian` (movement at lines ~133-135; the fan volleys in each branch). | Give each guardian its own movement (charge, orbit, retreat and reform, flank pairs) and an HP tier by Act. Make aimed fans close the aimed line on alternate volleys (aimed core plus static flanks), so a still ship is punished. Vary where in each Act's clock the guardian lands, and what replaces it on Acts that do not need one. |
| D6 | major | 7 | Finale B09, Crown road (loyal/unsworn target `crown`), phases 1 and 2 | 4p (default rotation) | **The Eclipse Crown has permanent safe pockets that still deal damage.** The spokes are quantised to multiples of 20° (`spokeAngle = volleys × π/9`, 6 spokes, `rainbowEclipseCrown.ts:153,203`) and fired from an almost fixed centre (352, ~125–143). So some bearings are *never* on a spoke, and the phase-2 rings leave the same rays open. A party parked on such a ray (e.g. 260 px left of the Crown, about 10° below its centre) is never hit, and is still inside the 44-px ring, so it shreds phase 1. | Fly `dodgeNoSuper` to the first non-scene frame of S09 (frame 179 799), then park every seat at **(95,176)** holding A (`hide3.ts 4 S09 P` with `PX=95 PY=176`, 12 000 frames). Control runs: same policy at (95,94) and at (95,135). The top-left corner (20,34) is also fully safe, for 20 000 frames. | (95,176): **0 hits in 200 s**, Crown 4350 → 1801 (phase 1 cleared, into phase 2). (95,135): 57 hits. (95,94): 52 hits. Corner (20,34): 0 hits in 333 s (no damage dealt). Solo on the flagship road, (95,94) and (95,135) take 58 and 74 hits. `d6-crown-safe-pocket-4p.jpg`: the spokes pass above and below the parked party while its shots land on the ring. | Add a per-volley jitter to the spoke and ring phase (deterministic from the volley count, not from 20° steps), or aim one spoke at the nearest pilot each volley. Let the Crown drift vertically in phase 1, and add an aimed component in phase 2 so no ray stays safe. |
| D7 | minor | 7 | Acts I–VII and X3 | 1p | **One enemy, the "mortar", is reused across 7 Acts and a detour.** It has identical AI (`stepMortar`), an identical vector coral-turret drawing (not an original sea creature, and it looks the same in the Wreckyard and the Glass Current) and an identical cluster shell. It spawns as each Act's periodic `launcher` every 1500 frames. The generic `liven()` rush-and-dart is also applied to the plain craft of every Act, which flattens family movement toward one pattern. | Fly `dodgeNoSuper`. Screenshots: first frame in Act V, then Act VII, with a mortar at x < 400. | `d5-mortar-act5.jpg`, `d5-mortar-act7.jpg`. Code: `MORTAR` (`rainbowPrincessPreview.ts:736`), `stepMortar` (`:2427`), the drawing (`:7046`), `launcher: { kind: 'mortar', every: 1500 }` (`rainbowWreckyard.ts:306`, `rainbowGlassCurrent.ts:271`, …). | Make the launcher an Act-specific creature (art, silhouette, shell shape and burst geometry), or keep the mortar to the 1–2 Acts it belongs to. Give each family its own approach in place of the shared `liven` dart. |
| D8 | minor | 7, 99, 2026 | Acts I–VI | 1p, 4p | **Infinite continues plus boss-HP carry-over remove the fail state for a pilot who never moves.** Boss HP is carried through `resumeFromCheckpoint` (`bossCarryHp` etc.), and continues are unlimited. A stationary, always-firing ship chips bosses down across continues. | (a) 1p: dodge to the start of Act V, then park at (20,135) holding A: `WIN=30000 hide2 1 S05 ML`. (b) 4p: all seats parked at spawn holding A for the whole run (`fireOnly`). | (a) Act V boss killed and Act VI reached within 30 000 frames, with 91 hits and 26 lives lost. (b) A parked 4-pilot party reaches **Act VI** (152 continues). A parked solo pilot never clears Act I, so this is mostly a co-op problem, and the medal is only bronze. | Owner call. Cap continues (e.g. 3 per Act, refilled at the Act start), or reset a boss to the start of its current phase on continue. |
| D9 | minor | 7 vs 99 vs 2026 | all | 1p, 4p | **The seed changes nothing.** Every non-reactive policy (idle, fireOnly, the hides) gives byte-identical results on all three seeds, and dodge runs differ only by bot reactions. `options.rng` is used in just two lines (`rainbowPrincessPreview.ts:2375-2376`, unauthored spawn y and phase). Deterministic authored waves are genre-normal, but replays are identical, so the "replay repetition" item in §9 is fully exposed. | `exp.ts <players> <seed> idle\|fireOnly\|hide*`. | For example, 4p idle on seeds 7/99/2026: 4122 hits, 228 continues, stuck at the Act I boss in all three. | Optional: seed small authored variations (a mirrored lane, a swapped wave order inside a section, guardian kind per run) while keeping the same-seed replay exact. |

## What I checked and found fine

- **No undodgeable patterns (1p and 4p).** I ran a reachability check over the real recorded campaign. Every 15
  frames, it starts from every pellet-free 3-px cell of the playable box and expands at ship speed for 60
  frames, removing cells touched by pellets (radius 7), craft (radius 14) and coral spires. Across ~11 500
  windows per run (1p and 4p, `dodge` and `dodgeNoSuper`): **0 impossible windows**, **0 windows under 1%
  of start positions surviving**, and the worst window still kept **≥ 73%**. Boss bodies were left out, so
  this is an upper bound on safety, not proof of fairness against bodies.
- **No point-blank spawns.** Hits from pellets younger than 15 frames are ~0–3 per campaign for flying
  policies. The only real cluster is a pilot parked against the right edge (x 440), where craft enter about
  40 px away (244 of that policy's 2192 hits). That is expected and is no hide spot.
- **No hide or idle spot outside the finale.** (B09 has one; see D6.) I parked the whole crew in 7 positions (four corners, mid-left, mid-right, centre)
  for one minute of each Act (1p S01–S09, 4p S01–S07). Every spot took 2–30 hits per minute solo; the
  flying bot took 0–1 in the same windows. Outside the finale, the only 0-hit minute was 4p, Act V, mid-left,
  and parking there for the whole Act took 121 hits. Idle and no-fire policies never progress past Act I solo.
- **Density is readable, not spam.** Peak pellets on screen: Act I 33–58, Act IV 65, Finale 76. See
  `peak-4p-act4.jpg` and `peak-1p-act9.jpg` (the escape walls have clear, marked gaps).
- **Campaign continuity.** Every flying policy reaches THE END with 1, 2, 3 and 4 pilots on seeds 7, 99 and
  2026: 47–66 min, 6–20 continues, routes including X1–X4 detours and both roads.
- **Bosses are individually authored.** Nine separate modules, each with its own weak point (beacons, exposed
  eel, the gem, the heart/bridge), a visible warning lane or spoke telegraph, and phase turns at 2/3 and 1/3.
  Only the HP scaling (D3) and supers (D2) undermine them.
- **Onboarding.** Act I's Lilt callouts name each new craft family and its counterplay as it arrives (spirals,
  mine walls, urchins, divers, the coral chicane), and the opening scene is enemy-free (frames 0–300). The
  permanent control strip is legible. The weak spot is D1: "B FOCUS/SUPER" is never explained in play.

## Method (reproducible)

Headless harness (run with `npx tsx`, imports `utils/arcade/games/rainbowPrincessPreview`, LCG seed as in
`verifyRainbowCombat.test.ts`). Policies, all of which press A on the CONTINUE screen:

| policy | what it does |
| --- | --- |
| `idle` | no input |
| `fireOnly` | holds A, never moves |
| `hideTL` / `hideBL` / `hideRight` / `hideMidLeft` | holds A and parks at that spot |
| `dodge` | a 9-direction one-step look-ahead over pellets (18-frame linear extrapolation), craft, spires and boss bodies, biased toward x ≈ 90 and the nearest target's lane (the B09 heart in phase 2); holds A and supers whenever charge is full and a boss is up or more than 25 pellets are on screen |
| `dodgeNoSuper` | `dodge` without supers |
| `dodgeSpamB` | `dodge`, tapping B every 20 frames |
| `dodgeFocus` | `dodge`, holding B whenever danger is non-zero |

Matrix:

- 64 full runs: {1, 4} players × seeds {7, 99, 2026} × 10 policies, plus 2p and 3p `dodge`, capped at 300 000
  frames.
- 144 Act-window hide tests.
- Targeted B09 parking tests at three points along x = 95 and at the top-left corner.
- Guardian freeze and track tests.
- Two reachability sweeps per player count.
- Charge, HUD-occlusion and Crown-phase probes.

The bot is deliberately mediocre: it often clips coral spires and dies to them. I did not treat its spire
deaths as a game defect, and every claim above is supported by a comparison between policies or by code.
The harness lived in a session scratchpad and is not committed. Its core is the `dodge` cost function: the
danger sum over pellets within 13 px across 18 frames, plus craft within 30 px, spires in their column, and
boss bodies within 60 px.
