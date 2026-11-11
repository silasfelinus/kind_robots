# Slime City Alliance Journey: editorial / adversarial run review

**Scope:** Conductor `slime-city/t-009`, 2026-11-10 PT. This is a deterministic narrative-run assessment and a source-level editorial review, **not** human fun approval or a claim that 120 human-controlled Clash battles were played.

## Finding and repair

The first Alliance pass had 30 different directed pairings but reused one partnership title, premise, two card labels and two resulting paragraphs across all five chapters. Changing the lead's chapter stakes could not disguise that loop. The ending ignored the ally entirely.

This pass preserves each partnership's first scene and writes **four distinct later dilemmas** per pairing, with new protective and risky actions and distinct consequences each chapter. It adds **30 titled partner endings**, each with two authored outcomes chosen by the recorded final decision, plus history based on whether the crews stayed together and how often the player protected people. The existing crew ending remains first, so the Alliance epilogue is earned rather than replacing the protagonist's arc.

## Complete-journey adversarial scenarios

The `verifySlimeCityAllianceEditorial.test.ts` contract simulates:
- 30 directed partnerships × three plans (protect every chapter, gamble every chapter, alternating choices) × five consecutive earned chapter victories: **90 full narrative runs, 450 chapter transitions**.
- One chapter-three defeat/retry per alternating plan: **30 loss paths**, confirming choices survive and a loss does not skip a chapter.
- Every pair's partner switch after chapter three: **30 more five-chapter runs**. Earlier decisions remain owned by the earlier ally; the earned ending belongs to the final partner, with its actual chapter count.
- Solo five-chapter completion, confirming an Alliance ending is never inserted into a Solo-only run.
- Full account-story validation after all decisions and victories, option-label/outcome differentiation, callback provenance, distinct chapter titles, and the precise earned ending.

The static authored-content audit found **120 distinct later-crisis passages, 240 distinct later-choice consequences, and 30 distinct finale titles**. Adding each pairing's first chapter gives 150 scenes and 300 outcome paragraphs across 30 pairings. The two finale branches per pairing produce 60 authored finale outcomes.

## Qualitative notes

**What now reads better:** The story moves through consequences. Anarkiss and Ironjaw face a heated dance floor, predatory sponsorship, a nursery emergency, then a parade through the locked foundry gate. Bloodfairies and Undertow progress from a wiretap through an encoded song and missing fans to a citywide signal jam. The later partner interludes tell a story rather than restarting the same scene.

**Meaningful choices:** The choice *actions* now differ by chapter and partner. The same protective/risky tactical trade remains mechanically comprehensible; one step of repeat-ally support is bounded rather than stacking unbounded bonuses. The saved last decision produces one of two different partner finales, while the count of earlier partnerships and the balance of protective choices changes its closing context.

**Remaining repetition / fun risks:** Both choice slots still resolve to the same core Clash HP trade each chapter. Until human playtests, we cannot say whether that strategic rhythm remains engaging or becomes predictable. The existing three authored crew scenes still come before the partner interlude, and reading length may be tight on phones. The finale reuses existing crew portrait art rather than a unique painting for each ending. A future adversarial *combat* run should measure win rates and HP differential over representative full campaigns, not only narrative legality.

**Suggested human playtest prompt:** Play one five-chapter Alliance with the same partner throughout, and one that switches partners before chapter four. At each scene, ask whether both decisions are tempting, whether the prior choice is remembered truthfully, whether the stakes genuinely changed, and whether the final partner's ending feels earned. Try one loss-and-retry path and one Solo-only path.

No new database tables, cards, currency, generated ArtJobs, or public launch. This report concerns the source-built narrative and its automated scenario coverage; visual and subjective acceptance remain separate.
