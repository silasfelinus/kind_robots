# Ecotone editorial/playtest, round 7: earned failures and sober wonder

**Working draft, October 21, 2026.** This is an internal non-consultation-dependent writing and mechanical check, not final creative acceptance or a human-timed reading session. The Wiyot/Tuluwat hold remains in force.

## What was wrong

- **GR-4, The Path Behind the Stage:** losing a roll previously meant walking in circles or having a wrong map with no continuing social consequence. The jokes were fleeting; the end of the fair had no memory of what you learned or whom you helped.
- **QW-4, The Elk Meadow:** failing either investigation could be a dead stop, with no meaningful evidence, follow-up, tangible memory, or civic usefulness. This punished the thoughtful investigator more than it made an entertaining story.
- **QW-5, The Long Quiet:** a single day's heavy labor appeared to restore a creek and conjure the first salmon in years. The failure sounded like a generic encouragement, while choosing the porch implied that reflective solitude was literally "deciding nothing." Those flatten ecological work and undermine the legitimately introspective option.

## The edit, in player terms

| Scene and choice | Successful experience | Failed or chosen experience | Later remembered as |
| --- | --- | --- | --- |
| GR-4: follow the racing slug | Keep the existing discovered next-year glade | Team up with a lost volunteer, mark the repeating exit, and still endure the embarrassment | The closing fire attracts volunteer support for a real trail-safety plan |
| GR-4: map the loop | Keep the existing impossible future parking lot | A current map and an old map disagree in demonstrable ways; post them for others | People use the maps to argue about the same actual land boundary |
| GR-4: wait on the log | Find the family stuck since Thursday | Wait costs the morning but lets you share water and agree to walk together | Hikers return with neighbors and their own ideas |
| QW-4: sit with the elk | A mysterious fox carries a dry red mitten; do not invent a missing child | Voluntarily give up daylight to deliver the mitten to lost property | Your humane, mundane act gets a receipt and later echo |
| QW-4: consult the ranger | Earn the existing independently documented west-turn record | A false emergency interrupts, so you file an observational account for follow-up | Three independently observed herd turns arrive as a delayed report |
| QW-4: follow the coast road | Keep the impossible disappearing tracks | Find a real sandwich shop displaying a *future-dated photograph that includes your coat* | Receipt and photograph persist as separately verifiable clues |
| QW-5: restore the creek | Contribute to one useful side-channel intervention with volunteer guidance, without claiming one day restored a watershed | Get stopped before harming a bank, carry supplies, and join the next permitted work day | Existing `creek_restored` and `creek_started` flags stay compatible |
| QW-5: call the impossible number | Keep the unsettling conversation with an earlier tree-plan author | Hear your own future flood report, but **verify it** before trusting it | `cabin_future_message` records a later story seed |
| QW-5: stay on the porch | Solitude remains a valid life choice | Meet a neighbor and learn a way back without making a vow | `porch_neighbor_met` leaves an honest future possibility |

## Why the changes matter

A failed check should not merely give a consolation prize. Here it can cost daylight, dignity, certainty or an immediate clue while opening a practical relationship, future evidence, or an astonishing artifact. The player is allowed to be wrong in public without becoming a fool, and they cannot trivially fix an ecosystem with one strength roll.

The sober route supplies independently checkable abnormalities: competing printed maps, an impossible future photograph, a ranger's observations, and a voice recording that demands checking. They are not an intoxication benefit, a moral superiority reward, or a hallucination that becomes real because the player believes harder.

These are **scene callback asides**, not new collectible endings. Existing card IDs, choice IDs, 2d6 targets, illustration keys, saves, achievements, fixed historical facts, and Wiyot/Tuluwat withholding remain intact. Existing art for outcomes may need visual/text continuity review before claiming full illustration acceptance.

## Executable playtest contract

`utils/scripts/verifyEcotoneEditorial.test.ts` is loaded by the existing `verifyEcotone.test.ts` gameplay entry. It attempts **200 fully played, deterministic, sober Quiet Way campaigns** (100 per investigation), requires both success and failure rolls to occur, verifies the failures leave the correct saved flags and that the final cabin receives their earned lines, checks replay determinism, and requires an actual sober Wild Way outcome.

The same test witnesses both forest-loop failed checks across multiple seeds, verifies their eventual bonfire callbacks, and confirms a fresh run does not invent any of those meetings. This is automated contract playtesting, **not** confirmation of subjective enjoyment, a human 45–75-minute reading session, or visual QA. An actual human-paced playtest should next press on the frequency of pamphlets/forms, front-end timing, optional companion presence, and whether failures feel meaningfully surprising rather than uniformly pleasant.
