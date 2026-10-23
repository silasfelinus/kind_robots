# Shifting Lands V7: adversarial playtest and mock-review pass

Date: 2026-10-22 PT  
Scope: Conductor `zuzu-shifting-lands/t-041`; Kind Robots V7 game rules, authored-card reachability, and save replay.

## What counts as evidence

These are **scripted adversarial play styles and synthetic reviewer personas**, not conversations with real players or visual acceptance. The game currently has five lands, 15 locations (three each), 120 seeded encounter cards (eight per location), and five boss trials. A completed run sees at most 15 of the 120 encounter cards. Test evidence comes from `utils/scripts/verifyShiftingV7.test.ts`: deterministic policy playthroughs, state transitions, save replays and tamper rejection. The workflow emits the actual counts; this report deliberately does not invent completion percentages.

Five existing real-reducer adversaries each exercise the same 300 default seeds:
- **Kind:** values mercy and honesty over profit; looks for solidarity, witness, then scouting.
- **Safe:** protects health and provisions; scouts when possible.
- **Greedy:** favors provisions and buys trial passage.
- **Ruthless:** favors coercion and ruthlessness marks.
- **Random:** selects legal encounters and trials without moral optimization.

The enhanced verifier also prints per-land distinct card draws out of 24 and failed trial attempts. Those expose blind spots hidden by an overall completion percentage. Replay, tamper, legal-choice and no-stall assertions still run with the five policy cohorts.

## Synthetic reviews and triage

### P1: The dual-hearted traveler, **reproducible rules bug**, fixed

> “I told the truth at one cost and showed mercy at another. The court still says I haven't earned two good deeds.”

**Cause:** `canChooseTrialV7` used `max(mercy, honesty) >= 2`, though the Witness choice describes two mercy *or* honesty marks. One of each was incorrectly excluded. A specialist who repeatedly picked only mercy could access the route while a character showing both virtues could not.

**Improvement:** Witness now counts the **sum** of earned mercy and honesty marks. In-game intent says combined marks explicitly. Regression tests distinguish zero, one, mixed one-plus-one, and two honesty marks. It is an eligibility expansion, not a rewrite of prior outcome history or existing save data; old recorded actions replay unchanged.

### P1: The completionist, **coverage monitoring added**

> “There are supposed to be 120 stories, but which ones will I actually see after a dozen expeditions?”

A run only presents three encounter cards per land. The deck's identity is deterministic for a seed/location and revisits cannot reroll. That preserves fairness but means an overall win-rate test cannot establish content exposure. The V7 verifier now reports **distinct cards actually drawn per land**, per policy, which can flag cards made effectively unreachable by hashing, weights or play styles.

**Remaining:** Use real test counts and future player telemetry (if available and privacy-appropriate) before adjusting weights. Avoid forcing all cards into one run at the cost of meaningful replay.

### P1: The exhausted scout, **ongoing balance watch**

> “I earned a safer trial path, but on my last heart the preparation itself can kill me.”

The rule forbids preparation below three HP, charges one HP, and allows once per land. That is deliberate risk rather than a free rescue. Adversarial runs now separately display failed trial counts per land, exposing loops in which scarce HP and repeated dice failures can make an ostensibly prudent play style a trap. Do not weaken costs without evidence from those counts.

### P2: The dangerous opportunist, **design preserved**

> “The easy choices get me through. Does anyone ever confront me about the people left behind?”

Greedy and ruthless profiles select easier tribute/coercion options, carrying permanent moral marks. V7 world callbacks and constellation endings already make those actions narratively consequential. Balance needs to distinguish **ability to finish** from **quality of the resulting world**. Do not equalize route success by simply penalizing every bad act with arbitrary HP loss.

### P2: The save-scummer, **existing protection retained**

> “Can I edit mercy marks, scout preparation or an already drawn scene and claim the enlightened ending?”

The V7 ledger validates actions by deterministic replay and rejects changed marks/preparation; original selection is saved and cannot reroll on revisit. Existing replay and tamper tests remain mandatory. Any future extra reward or moral mark must be reconstructed from valid actions, not trusted from browser-local state.

## Review and acceptance

- **Implemented in this PR:** combined-deed Witness eligibility, accurate choice description, focused unit regression, per-land card exposure and failed-trial reporting.
- **Tested by automation:** five seeded policy cohorts and replay/tamper assertions, when the Shifting Lands Gameplay Contract job is green. Refer to that job's output for measured results, not invented player impressions.
- **Not claimed:** live human playtesting, art delivery, phone/tablet/desktop rendered acceptance, or production deployment.
- **Parallel work not overwritten:** Conductor t-033 paints the cards; t-036 edits all 120 encounter narratives and five trials. The “Three Cups” painting correction belongs to t-033.

## Next kaizen

Use the new coverage and trial-failure output to isolate **one unreachable card or unexpectedly punishing late-land policy** and correct it with a fixed-seed reproduction. Do not tune arbitrary numbers from a small-seed average alone.
