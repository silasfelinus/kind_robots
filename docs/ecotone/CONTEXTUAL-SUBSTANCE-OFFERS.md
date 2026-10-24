# Ecotone: substances are encounters, not a questionnaire

**October 23, 2026 PT.** This replaces the older UI assumption that seven authored opening lenses should be presented together. The in-story choice is an offer made in a particular place, by a plausible person, not a browseable drug catalogue.

## Player-facing contract

| Beat                                  | Who/what is there                                                                    | Actually presented                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Green Ribbon Fair (`GR-2`)            | Food and water, a shared joint and an explicitly fictional enchanted brownie         | Decline with water; smoke; accept the enchanted brownie                                                          |
| Pre-race warehouse (`KN-2`)           | A beer and one of three rotating party offers grounded by a new situational sentence | Abstain; beer; **one** offered stimulant/empathogen, selected deterministically by encounter/seed                |
| Quiet marsh (`QW-2`)                  | Thermos, binoculars, a nearby person with a joint                                    | Stay clear-headed; accept the joint. No stimulants or party drugs spontaneously materialize at an isolated bench |
| Subsequent festival social (`GR-3`)   | A nearby fair volunteer makes one offer                                              | Decline; accept one offered joint                                                                                |
| Subsequent warehouse meeting (`KN-3`) | A racer offers a beer                                                                | Decline; accept the beer                                                                                         |
| All other scenes                      | Nothing establishes a substance offer                                                | **No chemistry panel at all**                                                                                    |

The KN-2 offer can vary by the earlier encounter and seeded story, but it never enumerates every possibility. Even when drinking was available at the party, it remains optional. There is no skill or story gate for abstaining.

The seven historic `LensId` values and previously authored outcomes are retained for save compatibility, internal test fixtures, and collected ending IDs. **The full seven-choice authoring catalogue is not a player-facing menu.** Tests now directly verify bounded player-visible choices, situational lines and hidden chemistry controls on ordinary scenes. The existing seven-lens simulation coverage still exercises archival authored outcomes; that simulation is not a screenshot or an assertion that all seven options are shown.

## Next design pass

For future optional substance offers, write the scene first and record the source, who offers, consent/decline option and credible consequence. Present a single substance with an abstain/moderation spectrum, or at most two locally plausible offers plus abstention. Never add an all-substances picker to a global sidebar, modal, or normal beat. Sustained/repeated use needs its own authored moments and consequences, not seven new buttons.

The fictional chemistry state does not confer paranormal truth, moral virtue, or a forced companion. Review children and cultural materials separately under their existing scope rules.
