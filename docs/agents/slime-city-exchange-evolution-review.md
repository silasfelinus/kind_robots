# Exchange (The Meat Exchange): individual 40-card CLASH evolution review

Part of Conductor `slime-city/t-041`, following the Catgirls, Bloodfairies, Ironjaw, Undertow and Riot editorial passes. The review covers `utils/slimeCity/clashTwists.ts` (ten native arcs), `utils/slimeCity/evolutions/exchange.ts` (thirty DSL arcs) and real Clash card state. Every ID already exists. This pass adds no new cards, rule changes, faction changes, account changes, art jobs or production release, so CLASH balance is untouched.

**Editorial choice:** the Exchange wins with boss drains, bounties, compounding debt and buyouts. It never heals its allies and adds no stuns of its own beyond native spell text. At level 1 seven DSL cards share the bare native line `Collect: gains +1 power on a kill.` (fighters, gear and a spell), five spells share `Deal N and stun the fighter.`, and five traps share the `Next foe: N damage ...` template. Each card's authored L1 role is therefore deliberately distinct, so the face says what the card is _for_ (cost band, the threat it answers, or who should carry it) before it levels. Roles describe native rules only; none grants a new ability.

| Card ID                                 | Authored L1 role                                            | L2 stage                          | L3 stage                     |
| --------------------------------------- | ----------------------------------------------------------- | --------------------------------- | ---------------------------- |
| `audit-fiend`                           | An armored duelist that grows fat on every kill             | The Flesh Ledger Opens            | The Choir of Unpaid Bones    |
| `debt-holiday`                          | A cheap freeze that buys a turn from a big hitter           | The Drowned Chapel                | The Bell Tolls for Debtors   |
| `s1-executive-repo`                     | An armored collector who outlasts a trade, then grows       | Relics of the Evicted             | The Undertaker               |
| `s1-guild-clerk`                        | A one-drop temp who snowballs off cheap kills               | Ink Drawn from Blood              | The Eternal Night Clerk      |
| `s1-margin-call`                        | A pricey hold order that freezes a threat while you build   | The Tithe Is Due                  | The Tithe Spreads            |
| `s1-buy-silence`                        | Hush money that silences a blocker for a full turn          | The Price of Silence              | The Confessional Web         |
| `s1-debt-garnish`                       | A floor tax that stalls the next intruder and strips armor  | The Butcher                       | The Unending Tithe           |
| `s1-golden-handshake`                   | Cheap gear that turns any fighter into a bounty hunter      | The Hand Beneath the Counter      | The Last Rites of Commerce   |
| `s2-exchange-bargain-rate-collector`    | A mid-cost collector that cashes in once it lands a kill    | A Whisper from the Hook           | Everything Must Be Flesh     |
| `s2-exchange-golden-bailiff`            | A six-drop armored finisher that shoves kills into the boss | Summons from the Deep             | The Emptying of Houses       |
| `s2-exchange-compound-interest-notice`  | A heavy freeze aimed at the rival's biggest debtor          | The Hunger Accrues                | The Debt That Breeds         |
| `s2-exchange-contract-amendment`        | A cheap clause that permanently tops up one fighter         | The Forbidden Thirty-Seventh Page | The Blood-Oath Rider         |
| `s2-exchange-invisible-lien`            | A hidden fee that cracks the next armored arrival           | The Hook Takes Hold               | The Hook Claims the Street   |
| `s2-exchange-executive-health-coverage` | A policy that keeps a frontliner patching itself up         | The Undertaker Pays               | The Beneficiary Below        |
| `s3-exchange-wage-garnisher`            | A one-drop junior agent: early blocker, paid per kill       | The Vein-Tithe                    | The Veins Run Dry            |
| `s3-exchange-mortgage-minotaur`         | A mortgaged bull that tramples through to the boss          | First Tithe                       | Great Maw                    |
| `s3-exchange-retainer-clerk`            | A two-drop accountant that heals between rounds and holds   | The Vigil of the Nameless         | The Final Benediction        |
| `s3-exchange-seizure-executive`         | A five-drop armored wall that seizes what it kills          | The Stillness of the Crypt        | The Choir Takes Another      |
| `s3-exchange-hostile-takeover-goon`     | A street enforcer who toughens up with each flattened foe   | The Butcher                       | The Altar Changes Hands      |
| `s3-exchange-golden-foreclosure`        | A slow vault on legs: armored, self-healing, hard to drop   | The Vault Begins to Breathe       | The Ossuary Opens            |
| `s3-exchange-payment-reminder`          | A one-cost envelope that freezes a striker on the cheap     | The Second Knell                  | The Procession of Collectors |
| `s3-exchange-compound-notice`           | A two-part bill: chip a fighter, then freeze its swing      | The Chapel Returns a Favor        | The Plague of Debts          |
| `s3-exchange-executive-incentive`       | Bonus pay for the fighter you plan to keep alive            | The Covenant of Knives            | The Dead Collect Too         |
| `s3-exchange-golden-parachute`          | Severance that pulls a dying fighter back from the brink    | Terms of the Last Breath          | The Shroud of Gold           |
| `s3-exchange-acquisition-clause`        | A pricey clause that makes any fighter feed on kills        | The Butcher                       | The Night Procession         |
| `s3-exchange-late-fee-sticker`          | A one-cost boot that dents the next intruder                | The First Drop of Blood           | The Blood Keeps Flowing      |
| `s3-exchange-escrow-snare`              | A two-cost cord that roots the next intruder for a turn     | The Sealed Reliquary              | The Reliquary                |
| `s3-exchange-repossession-notice`       | A three-cost legal hold for a sturdy arriving fighter       | The Side Door to the Crypt        | The Bone Cart                |
| `s3-exchange-ledger-greaves`            | Cheap greaves that make a runner hit harder for good        | The Swiftest Funeral              | A Summons at the Door        |
| `s3-exchange-collection-badge`          | A pricey badge for a frontliner who will rack up kills      | Anointed in Tallow                | Marshal of the Bone Tithe    |

**Face budget:** the longest L1 face is `s2-exchange-golden-bailiff` at 154 characters (armor, collect and bulldoze plus its role). The new test in `utils/scripts/verifySlimeCityEvolutions.test.ts` asserts all thirty roles render at L1, are distinct, and that every level stays within the 160-character face.

**Remaining for t-041:** the Mercenary editorial passes, constructed balance (the dead two-slot cards attributed to t-051), art and fun acceptance.
