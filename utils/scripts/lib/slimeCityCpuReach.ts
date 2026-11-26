/**
 * Slime City CLASH 300: every card is played by the CPU somewhere in seeded
 * QA (conductor slime-city/t-041).
 *
 * verifySlimeCityEvolutionMatchups fields all 300 cards across two independent
 * 1,080-match seed families. The six historical coverage exceptions below
 * must still be fielded and played in verifySlimeCityClashConstructed, even
 * when the expanded matchup field also reaches some of them. Together the
 * suites retain the claim:
 * a card may leave the list, and nothing may join it without the same proof.
 */
export const CPU_REACH_VIA_CONSTRUCTED_ONLY: readonly string[] = [
  's2-bloodfairies-glitterglass-flood',
  's2-riot-friendly-fire-rehearsal',
  's2-undertow-backwater-iou',
  's3-catgirls-spare-lives',
  's3-ironjaw-furnace-overdrive',
  's3-exchange-acquisition-clause',
]
