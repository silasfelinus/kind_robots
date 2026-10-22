# Ecotone adversarial playstyle review, pass 9

**Date:** October 22, 2026 PT  
**Status:** Synthetic, source-grounded editorial assessment. Not human-paced usability testing or final creative approval.  
**Scope:** Non-sensitive Ecotone story and gameplay. Excluded cultural material stays excluded; no new art submissions, production deployment or public release.

## What this pass changes

The gameplay contract now executes an extra matrix of **1,260 completed journeys**: three starting events, seven opening lenses, twelve fixed seeds and five contrasting choice policies. The test holds the seed and archetype constant across a group of five; randomness is not credited as player agency. It checks real resolved decisions, save/reload, deterministic replays, ending completion, non-repetition and continued exclusion of WH-121.

The test also reports three **separate** observations for each of the 252 matched groups: decision-history divergence, saved consequence divergence, and ending divergence. Different dialogue or a different final card ID alone should not be counted as a meaningful branch. The exact counts are supplied by CI at run time, not guessed in this document.

| Simulated reader | Policy | What the review is trying to falsify |
| --- | --- | --- |
| Evidence hunter | Prefer clues, research and investigative checks; follow new leads | A sober, skeptical person gets all the substance-free mystery tools without an invisible penalty |
| Community caretaker | Favor goodwill, accept companions, remain loyal | Kindness should create obligations and trade-offs, not become the obvious best-score button |
| Weirdness chaser | Favor unusual events, high-uncertainty skill checks, change companions | Weird scenes should change later interpretation, not just swap adjectives |
| Solitary observer | Avoid initial accompaniment, prioritize nerve, decline later offers | A player can remain independent and still affect the county; solitude is not automatically failure |
| Coalition builder | Value practical goodwill plus evidence; invite newcomers to travel together | Shared journeys cause real disagreement and earned callbacks, not companion-count bonuses |

The test does **not** pretend to model human humor, moral reflection, reading time, accessibility, or genuine satisfaction. It cannot decide whether two prose passages are actually distinct. Those require manuscript review and human play sessions.

## Source-grounded editorial observations

1. **Strength: failure is no longer just losing points.** The Green Ribbon forest-loop, Quiet Way elk and cabin threads have result-specific descriptions, consequence flags and later earned echoes, with explicit solo and companion voices. Preserve those advances rather than homogenizing encounters.
2. **Risk: archetype promises exceed current mechanics.** The seven origin blurbs advertise once-per-chapter perks such as a reporter's sourcing question and a student's partial-success revision, but the reducer uses their starting skill scores, not a spent-perk mechanic. This creates a player-trust gap. Either implement tracked, testable limited-use perks in a separate scoped task or relabel them as roleplay flavor until real.
3. **Risk: collectible breadth can hide narrative sameness.** Seven lenses and six ending lines yield 84 collectible IDs, but unique IDs do not establish 84 different felt journeys. Review the eight broad civic futures and individual final signatures for repeated arguments, stock civic outcomes and callbacks not earned in that run.
4. **Risk: optimistic routes may become stat-maximization.** The ordinary fate resolution uses goodwill, evidence and nerve; Wild Way uses animal-first choices. Require at least one admirable but costly success, one entertaining setback, and one genuinely persuasive reason to reject the apparently profitable answer in each route.
5. **Risk: first-personality labels are thinner than agency.** If the main distinction between caretaker, sleuth, and wanderer is their final tally, the middle chapters need a contested thread that returns in a later *playable* decision, not just an epilogue sentence.
6. **Strength worth protecting: optional social arrangements.** Solo travel and opt-in shared companionship exist. A joined party must remain consensual and scene-specific; having met a character must not make them speak while absent.

## Manual mock-review prompts for the next editorial pass

- **One-and-done reader:** After the first route, what scene would make them recommend the game? What is the single slowest repeated explanation?
- **Completionist:** On the fifth journey, can they discover a causally different interaction, rather than another signature sticker?
- **Sober investigator:** Can they solve the central civic problem without chemical shortcuts, paranormal belief or obligatory romance?
- **Affectionate pacifist:** Do any generous choices cost something substantial, and is the cost acknowledged without punishing decency?
- **Chaos tourist:** Is failed improvisation memorable and funny, and does somebody bring it up again only when it happened?
- **Suspicious local:** Are locals allowed conflicting interests without being caricatures or giving an external player easy moral certainty?
- **Solo ecologist:** Can animals, marshes, river repair and observation support an active hopeful future, rather than a forced anti-social hermit judgement?

## Acceptance bar for future passes

For every route, review one **success and failure** of a meaningful check, a **solo and accompanied** resolution, two **different lens tones** without ideological prescription, and an earned callback that changes a **later choice**. Inspect three consecutive scenes for repetitive rhetorical structure and recurring character voice. A 4/5 or 5/5 fun rating should be reserved for observed human-play evidence, never assigned from a scripted campaign.

**Escalation:** Only the existing ordinary creative-canon and release gates require Silas. Fixable path repetition, hollow choices, missing perks, and weak call-backs are normal development work and should generate focused follow-up PRs, not a new human approval gate.
