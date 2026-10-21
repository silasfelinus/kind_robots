# Ecotone: simulated playtest and substance-continuity audit

**Audit:** October 20, 2026 PT. This is deterministic gameplay-contract evidence plus targeted synthetic persona simulations. It is **not** a claim of a human-paced 45–75-minute reading session.

## Collectible endings, and how to reach them

The 84 IDs are **7 opening lenses × 6 final lines × 2 fates**. All seven perspectives are voluntarily offered on Green Ribbon, Kinetic, and Quiet, independent of later substance use.

| Ending line               | What the player does                                                                                                                                         |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Mara, Kit, Juniper, Cedar | Meet and travel with the corresponding companion, or follow them when they turn up later at a crossroads. The **last** active companion determines the line. |
| Alone                     | Reach the Green Ribbon or Kinetic conclusion without an active guide, refusing offers to follow along the way.                                               |
| Wild Way / Ecotopia       | Finish the **Quiet** route alone. Four animal-first choices earn the hopeful paradise; fewer than four earn the bittersweet hermit outcome.                  |

For every ordinary final companion or Alone: **Goodwill + number of evidence clues + nerve modifier** determines fate. A steady nerve (5+) adds 1; severely frayed nerve (1 or below) subtracts 1. The goal is **5** at Green Ribbon and Quiet and **7** for the longer Kinetic journey. Wild Way instead uses its own **4 animal-first choice** threshold. These are mechanical rules, not moral labels attached to an opening chemical.

The existing gameplay contract samples **8,400 full campaigns**, plus **3,999 earlier seeded campaigns**, and explicitly demands a real played witness for **84/84 ending IDs**. The dedicated seven-lens Wild Way witness pass repairs coverage not guaranteed by the random sample alone. The test also exercises save/restore continuity, callbacks, outcomes and failed rolls. No new full-suite run has been claimed until this PR's CI finishes.

## Persona-driven audit

1. **Sober observer / occasional drink:** Takes one alcohol interlude, then a clear-headed pause. Receives a social observation once, without an assigned bad future or permanent ideological label.
2. **Persistent partygoer:** Accepts alcohol at every optional scene. Three consecutive moments disrupt their _spoken dialogue_; five produce deliberately unintelligible words. Dialogue asides change, while all scene action labels, IDs and choice availability stay legible and stable. Clarity eventually falls to 0, potentially making Wits checks more difficult. Community decisions still determine the civic future.
3. **Temperate return:** After sustained drinking, chooses water/air twice. The first pause partly restores clarity, the next restores it fully. The ending has a brief trajectory coda honoring the change without treating sobriety as a redemption tax.
4. **Cannabis plus coffee:** Records two co-occurring selections, explicitly recognized as the **hippie speedball**. It changes immediate literary texture and can be remembered in an epilogue. There is no special stat bonus or guaranteed good ending.
5. **Mixed experiments / changed course:** Can select any one or two voluntary substances at an optional scene, or pass entirely. Memory records history rather than pretending the opening lens was an immutable sobriety or identity declaration. Only one optional moment per scene is accepted.
6. **Greedy / ruthless civic actor:** May earn easy short-term advantages, but later companion/county outcomes still depend on flags, clues, and kindness or neglect. Chemical choices do not give this persona a compulsory dark fate.
7. **Careful but unsuccessful investigator:** Can roll failures and still reach either family of future; the evidence, goodwill and nerve system preserves the possibility of a bittersweet outcome without requiring intoxication.

## Editorial diagnosis and constraints

- **Before this pass:** `openingState` and `currentState` were both set by the initial lens offer; no later player action meaningfully updated the current perspective. The ending montage always reflected the opening lens, so a repeat drinker and a one-off drinker were mechanically indistinguishable.
- **After this pass:** Optional per-scene experiences are tracked in a separate, bounded `substanceMoments` record; old version-4 saves gain a safe opening-history fallback without renumbering IDs. Past moments do not dictate the end score.
- **Dignity and consent:** Substance choices are voluntary and not framed as moral superiority or magical factual knowledge. The impaired narrator does **not** rewrite the action choices, force a romance, erase consent, or replace historical information.
- **Reversibility:** Day transitions restore temporary clarity, and intentional breaks offer a visible route toward temperance. The opening perspective remains a memory; current perspective is transient. This is literary game-state, **not** a physiological dosage simulator.
- **Mixed-path risk:** The current optional picker permits at most two experiences in a scene, without quantities, procedures, safety claims or encouragement to take dangerous combinations.
- **What needs humans:** Tone and dignity of severely impaired dialogue, accessibility for readers who dislike scrambled prose, the exact balance of frequency versus repetition, authentic timed playtests, historical/community sign-off, and artwork. Do not interpret passing CI as approval to publish.

## Future polish

A fuller second iteration could give the companions individually written, consent-aware reactions to repeated patterns; offer a limited set of exceptionally consequential recurring-scene interactions; and surface a nonjudgmental history timeline in the journal. Keep the current simple choice contract and 84 endings until actual players demonstrate they want larger branching complexity.
