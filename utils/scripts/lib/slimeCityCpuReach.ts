/**
 * Slime City CLASH 300: every card is played by the CPU somewhere in seeded
 * QA (conductor slime-city/t-041).
 *
 * verifySlimeCityEvolutionMatchups fields all 300 cards across 1,080 matches
 * and the CPU plays 294 of them. The six below are two-slot specials it never
 * reaches there; verifySlimeCityClashConstructed fields each one and proves
 * it is played. Both suites read this list, so together they hold the claim:
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
