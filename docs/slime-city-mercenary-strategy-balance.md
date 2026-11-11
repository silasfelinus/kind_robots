# Slime City: balance strategies through neutral mercenaries

2026-11-10 PT, Conductor `slime-city/t-009`.

## Guiding principle

Keep crew identities distinct. When a strategy is underserved, first inspect the **shared 60-card mercenary class** instead of increasing one faction's printed stats or granting that crew a private compensating power. Players should be able to recruit broadly useful defenders, engine pieces and support cards from a common toolbox.

**Equal availability is not equal benefit.** A neutral healing card benefits bulky Ironjaw differently from fragile Catgirls, and a SWARM enabler interacts with different crew boards differently. Always measure win-rate changes by both *general* and *ally*, against comparable opponents and both seats. Neutral changes must not accidentally make an already dominant strategy even stronger.

## First reversible experiment

`mercenaryBridgeDeck(general, ally, plan)` offers two **optional** 20-card constructed recipes. Both begin with the existing fighter-forward deck (12 creatures / 8 support). They preserve the same seven ally cards and replace two general creatures and two general support cards with **four identical free mercenary cards**, regardless of the lead faction. The neutral packages are chosen from the account's existing starter collection, never restricted rarities or cards requiring a booster.

- `control`: prefer defensive fighters, heal/armor tools, and lane disruption. A common answer to fast fighter-pressure, without changing another crew's signature.
- `synergy`: prefer SWARM/leech/ambush fighters and cheap attack/ability enablers. A shared investment route for combo-dependent decks, not a mandatory list.

No existing deck, card stats, evolution, economy, account or default recipe is rewritten. These two recipes are available to the test laboratory first, rather than silently substituting for saved decks.

## Controlled balance question

`verifySlimeCityMercenaryBridge.test.ts` tests **all 30 directed crew pairs**, five rival generals, both seat orders, one deterministic seed per pair/rival: **300 matched setups / 1,500 real CPU-vs-CPU Clashes**:

1. Fighter-forward vs fighter-forward, the strong control from PR #4980.
2. Neutral control package vs the same fighter-forward rival.
3. Neutral synergy package vs the same rival.
4. Control vs control, measuring what happens when both sides can adopt the same support kit.
5. Synergy vs synergy, same symmetric adoption check.

The chosen mercenary IDs, results by lead, by ally, and by seat, and changed outcomes compared with fighter-forward are printed in CI. No win-rate pass threshold is invented.

The previous experiment recorded fighter-forward at 65.3% **against classic decks**, not against other fighter-forward decks. This new baseline corrects that denominator before evaluating a neutral countermeasure.

## Decision rule

If a neutral kit improves an underperforming approach without broadly raising its own win rate or worsening outliers across lead/ally roles, consider it as a deck-builder preset. If it fails, change which neutral cards are included or inspect specific mercenary evolution trajectories, not blanket crew buffs. Do not globally alter individual card definitions based only on one CPU recipe or a single-seed pairing. Human matches remain the final fun and play-quality test.
