# Memory Dungeon: adversarial first-two-reality pass (2026-10-26)

**Scope:** Briar Marches, Dark Briar, Earth Chronicle, cross-map seals and the
optional Minefield Archive. This is **source-backed and automated contract QA**,
not a browser-driven 390/768/1440 screenshot audit and not a completed
full-game human playthrough. ArtJob submission does not prove image delivery.

## Reproducible findings and repairs

| Severity               | Player persona / exploit                                     | Before                                                                                                                                                                                                          | Repair and proof                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0 gameplay bypass     | Impatient / greedy player taps the far corner of a minefield | The generator deliberately guarantees the exit is safe, while `checkExit` declared victory immediately after revealing that one square. Puzzle completion, clue reading and hazard deductions were unnecessary. | Require **every safe square to be revealed**, and the exit itself. Flags alone never count as knowledge. Test 12 seeds on each 8×8/10×10 board: early exit cannot win; visible-clue-only solver still wins. |
| P1 save softlock       | Flag-spam / interruption player hits replay log limit        | The 600-move limit rejects every subsequent action; `openMinefield` resumed the still-exploring but permanently frozen save forever. Repeated taps on already-revealed squares also wasted log capacity.        | No-op actions no longer enter the log. Exhausted logs have an explicit restart button; reentering the archive starts a fresh seed without losing global progress. Terminal outcomes remain immutable.       |
| P2 economy frustration | Player taps paid lantern hint repeatedly before acting       | The same hint can be purchased over and over at one lantern per tap, without gaining information.                                                                                                               | Suppress additional charges while the hint is visible; disable the hint button until the next action resets it.                                                                                             |

## Automated adversarial matrix

- **Seeded greedy/expert:** 24 generated layouts (12 per floor size), each tested for
  a trivially known exit, optional incorrect flag, no mandatory guess, full-clear
  victory, no life loss on proven-safe play, exactly one victory event, and
  immutable completed floors. Existing generation/solver checks also exercise
  80 seeds per size and 30 careful-player runs per size.
- **Cross-reality seal completionist:** all 16 subsets of the four original-world
  inspections combined with four reflected-world inspections in reverse
  order, duplicate visits, JSON persistence, and forged early `matched` /
  `resolved` values. These never grant future-world counterpart completion.
- **Earth photographer / interrupted save:** all 24 permutations of four
  available original/mirror photo scenes; deterministic Earth chronology,
  first response retained, no duplicate discoveries, and journal persistence
  after a world restart.
- **Narrative branches already covered elsewhere:** three original House custody
  resolutions × two mirrored House agreements, mirror bridge choice, 36-room
  House graph, six memory trials and five logic puzzles remain covered by
  their respective CI contract suites.

## Second adversarial installment: mirrored-House full-run bypass

**New source-level P1 finding:** `darkHouseExits` previously treated an ordinary
room as automatically resolved when it contained no minigame. A fast reader
could advance through nearly all the 36-room House without choosing either
authored consequence; even a solved puzzle could be left without its ethical
follow-up. Only the Warden and ending gates forced responses.

**Repair:** An unvisited passage now requires **both** the completed local
memory/logic challenge (when present) **and** a committed room choice. Returning
through already-visited passages stays possible. The UI explains why an
unvisited room is locked; old saves keep their existing visited routes and
committed choices.

**New adversarial contract:** Perform two 36-room depth-first House expeditions,
one consistently honoring the first response and one the second; solve all
six evidence-pair challenges and five logic puzzles; refuse all premature
unvisited exits; serialize/restore after every chamber; verify retreat routes,
72 immutable consequential room choices, all 36 rooms reached and **distinct
`return` / `commons` endings**. Source reducers and visible choice gates are
tested; browser screenshots and commissioned illustrations remain separate.

## Remaining blockers, not claimed tested

1. Actual **phone, tablet and desktop browser journeys** including scrolling,
   focus traps, responsive artwork and real save/refresh inside transitions.
   Component/source checks are not screenshot or human-device proof.
2. End-to-end **art delivery**: reconcile queued versus DONE ArtJobs and physically
   inspect real commissioned images before sign-off.
3. Full novice, pacifist, selfish, combat and relationship run simulations across
   all maps and World One alternate endings. Some existing component contracts
   cover individual gates but not a complete human-like run with authored pacing.
4. Public release and the subjective final human design gate remain **closed**.

**Release policy:** Green CI permits merging reversible repairs; it does not
mean full-game completion. Keep the master issue #4136 and later full
adversarial gate open.
