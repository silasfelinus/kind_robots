# Slime City CLASH: complete card-text editorial audit

**Date:** 2026-11-14 PT  
**Scope:** all 300 existing card IDs, levels 1/2/3, plus both final forms of all 22 choose-one cards.  
**Source of truth:** `utils/slimeCity/clash.ts` (`clashCardText`), `clashTwists.ts` (70 bespoke entries), `clashEvolutions.ts` and `evolutions/*.ts` (230 DSL-authored entries). The source ledger is Conductor `projects/slime-city/CARD-REDESIGN-300.md`.

## Coverage and findings

- **300/300 IDs reviewed:** 110 fighters, 92 spells, 51 traps, 47 equipment. There are **922 actual rendered rule variants**: 900 standard level faces plus 22 alternate level-three forms.
- **52/70 bespoke cards rewritten** to clarify their current trigger, target, timing, scope, or distinct current-level payoff; 18 retained where their text already stood on its own or only had inconsequential flavor.
- **230 authored DSL cards** have generated rules audited against their same-level ability definitions and shared grammar corrected. Changes to the generator replace the context-dependent `Also` lead on spell effects with `Cast`; the default grant description now says `Grants +N permanent power`; plural targets and once-per-fighter duration are explicit.
- **Three overlength rendered variants**, all Madame Chimera levels 1–3, were found and shortened. The captured 922-card baseline had **zero blank rules and zero identical three-level descriptions**. All 22 alternate level-three forms have their own choices and full descriptions.
- **Critical UI defect:** the Collection evolution inspector showed both options, but Option A's card lacked `pick=0`; it displayed only branch names. Solo and multiplayer choice pickers also failed to show the complete level-three card rules. These views now show the full selected form.
- **Mechanic-text accuracy:** fixes distinguish the whole friendly board from neighboring allies (e.g. Confetti), separate arrival from repeatable effects, make attacks/recoil/knockouts explicit, and avoid claiming level-three text implicitly inherits level two.

## Permanent acceptance contract

The CLASH contract now asserts all 300 source identities are covered by exactly one of the two authoring systems; every 922 rendered variants is nonblank, fits **160 characters**, has no dangling sentence-start `Also`, `Again`, `The stronger`, or `As before`, and each level-three fork has independently distinguishable rules. It also checks that Solo, PvP and Collection inspector present chosen-form rules instead of name-only descriptions. This is a text/UX audit; it does not assert 300 cards are perfectly balanced, all art delivered, all effects enjoyable, or production deployed.

## Complete per-card inventory

**Treatment key:** `Rewritten` = bespoke L1/L2/L3 rules revised in this pass; `Reviewed` = bespoke text retained; `Generated` = authored ability stages checked through the shared rule-text generator and canonical 922-face output. `A/B` marks a selectable third evolution. Each row was matched to exactly one live code definition, not assumed from the roster name.

### Gene Riot Catgirls (40)

| Card ID                              | Name                     | Type      | Treatment | L3 fork |
| ------------------------------------ | ------------------------ | --------- | --------- | ------- |
| `lynx`                               | Neon Lynx                | creature  | Reviewed  | -       |
| `mau`                                | Mau-77                   | creature  | Rewritten | -       |
| `calico`                             | Clinic Calico            | creature  | Reviewed  | -       |
| `chimera`                            | Madame Chimera           | creature  | Rewritten | -       |
| `pounce`                             | Catnip Overdrive         | spell     | Rewritten | -       |
| `scentmine`                          | Scent Mine               | trap      | Rewritten | -       |
| `reknit`                             | Reknit Serum             | spell     | Rewritten | -       |
| `shredders`                          | Patent Shredders         | equipment | Rewritten | -       |
| `ninthlife`                          | Ninth Life Collar        | equipment | Reviewed  | -       |
| `laser`                              | Laser Pointer            | spell     | Rewritten | -       |
| `splice-runner`                      | Splice Runner            | creature  | Generated | A/B     |
| `mutual-aid`                         | Mutual Aid Serum         | spell     | Generated | A/B     |
| `s1-roof-phantom`                    | Rooftop Phantom          | creature  | Generated | -       |
| `s1-alley-vet`                       | Alley Veterinarian       | creature  | Generated | -       |
| `s1-clone-salvage`                   | Secondhand Life          | spell     | Generated | -       |
| `s1-nine-lives`                      | Nine Lives, No Refunds   | spell     | Generated | -       |
| `s1-catnip-tripwire`                 | Catnip Tripwire          | trap      | Generated | -       |
| `s1-surgical-piercers`               | Surgical Piercers        | equipment | Generated | -       |
| `s2-catgirls-backstreet-organ-donor` | Backstreet Organ Donor   | creature  | Generated | -       |
| `s2-catgirls-parapet-ghost-kitten`   | Parapet Ghost-Kitten     | creature  | Generated | -       |
| `s2-catgirls-emergency-molt`         | Emergency Molt           | spell     | Generated | -       |
| `s2-catgirls-needle-thread-ambush`   | Needle-Thread Ambush     | spell     | Generated | -       |
| `s2-catgirls-sterile-alley-wire`     | Sterile Alley Wire       | trap      | Generated | -       |
| `s2-catgirls-lab-escape-atlas`       | Lab Escape Atlas         | equipment | Generated | -       |
| `s3-catgirls-glasswalker`            | Gutterglass Scout        | creature  | Generated | -       |
| `s3-catgirls-patent-saboteur`        | Patent Saboteur          | creature  | Generated | -       |
| `s3-catgirls-alley-vet`              | Noodle Cart Veterinarian | creature  | Generated | -       |
| `s3-catgirls-scalpel-captain`        | Velvet Scalpel Captain   | creature  | Generated | -       |
| `s3-catgirls-bicycle-clinic`         | Sutures on Wheels        | creature  | Generated | -       |
| `s3-catgirls-escaped-tiger`          | Gene-Spliced Tiger       | creature  | Generated | A/B     |
| `s3-catgirls-sidewalk-stitches`      | Sidewalk Stitches        | spell     | Generated | -       |
| `s3-catgirls-stolen-saw`             | Stolen Bone Saw          | spell     | Generated | -       |
| `s3-catgirls-fire-escape`            | Climb the Fire Escape    | spell     | Generated | -       |
| `s3-catgirls-counterfeit-heart`      | Counterfeit Heart        | spell     | Generated | -       |
| `s3-catgirls-spare-lives`            | Spare Nine Lives         | spell     | Generated | -       |
| `s3-catgirls-suture-line`            | Suture Line              | trap      | Generated | -       |
| `s3-catgirls-garrote`                | Catwalk Garrote          | trap      | Generated | -       |
| `s3-catgirls-false-clinic`           | False Clinic Sign        | trap      | Generated | -       |
| `s3-catgirls-hollow-scalpel`         | Hollow Scalpel           | equipment | Generated | -       |
| `s3-catgirls-pounce-rig`             | Second Pounce Rig        | equipment | Generated | -       |

### Punk Bloodfairies (40)

| Card ID                                | Name                     | Type      | Treatment | L3 fork |
| -------------------------------------- | ------------------------ | --------- | --------- | ------- |
| `sprite`                               | Bloodsprite              | creature  | Rewritten | -       |
| `pogo`                                 | Pogo Brat                | creature  | Rewritten | -       |
| `razor`                                | Razorwing                | creature  | Rewritten | -       |
| `queen`                                | Queen Safety Pin         | creature  | Reviewed  | -       |
| `mosh`                                 | Moshpit Massacre         | spell     | Rewritten | -       |
| `bloodwire`                            | Bloodwire                | trap      | Rewritten | -       |
| `spurs`                                | Razor Spurs              | equipment | Rewritten | -       |
| `pinprick`                             | Safety-Pin Stab          | spell     | Rewritten | -       |
| `choker`                               | Spiked Choker            | equipment | Reviewed  | -       |
| `feedback`                             | Amp-Stack Feedback       | spell     | Rewritten | -       |
| `pogo-punk`                            | Pogo Punk                | creature  | Generated | -       |
| `amp-tripwire`                         | Amp Tripwire             | trap      | Generated | -       |
| `s1-riot-choir`                        | Glitter Riot Choir       | creature  | Generated | A/B     |
| `s1-pocket-punk`                       | Pocket-Sized Problem     | creature  | Generated | -       |
| `s1-confetti-cannon`                   | Confetti Shrapnel Cannon | spell     | Generated | -       |
| `s1-stage-dive`                        | Unlicensed Stage Dive    | spell     | Generated | -       |
| `s1-feedback-wire`                     | Feedback Wire            | trap      | Generated | -       |
| `s1-blood-mic`                         | Blood Karaoke Microphone | equipment | Generated | -       |
| `s2-bloodfairies-mosquito-disc-jockey` | Mosquito Disc Jockey     | creature  | Generated | -       |
| `s2-bloodfairies-bassquake-colossus`   | Bassquake Colossus       | creature  | Generated | -       |
| `s2-bloodfairies-glitterglass-flood`   | Glitterglass Flood       | spell     | Generated | -       |
| `s2-bloodfairies-afterparty-first-aid` | Afterparty First Aid     | spell     | Generated | -       |
| `s2-bloodfairies-earworm-feedback`     | Earworm Feedback         | trap      | Generated | -       |
| `s2-bloodfairies-roadie-megaphone`     | Roadie Megaphone         | equipment | Generated | -       |
| `s3-bloodfairies-mosh-firefly`         | Moshpit Firefly          | creature  | Generated | -       |
| `s3-bloodfairies-pollen-queen`         | Punk Pollen Queen        | creature  | Generated | -       |
| `s3-bloodfairies-backstage-vamp`       | Backstage Vamp           | creature  | Generated | -       |
| `s3-bloodfairies-karaoke-oracle`       | Riot Karaoke Oracle      | creature  | Generated | A/B     |
| `s3-bloodfairies-tour-bus`             | Tour Bus Swarm           | creature  | Generated | -       |
| `s3-bloodfairies-headliner`            | Blood Moon Headliner     | creature  | Generated | -       |
| `s3-bloodfairies-feedback-burst`       | Feedback Burst           | spell     | Generated | -       |
| `s3-bloodfairies-encore`               | Encore or Die            | spell     | Generated | A/B     |
| `s3-bloodfairies-rafter-dive`          | Dive from the Rafters    | spell     | Generated | -       |
| `s3-bloodfairies-festival-triage`      | Festival Triage          | spell     | Generated | -       |
| `s3-bloodfairies-cathedral-noise`      | Cathedral of Noise       | spell     | Generated | -       |
| `s3-bloodfairies-tripcord`             | Moshpit Tripcord         | trap      | Generated | -       |
| `s3-bloodfairies-amp-socket`           | Broken Amp Socket        | trap      | Generated | -       |
| `s3-bloodfairies-banana-bouncer`       | Bouncer Banana Peel      | trap      | Generated | -       |
| `s3-bloodfairies-van-radio`            | Tour Van Radio           | equipment | Generated | -       |
| `s3-bloodfairies-encore-boots`         | Last Encore Boots        | equipment | Generated | -       |

### Ironjaw Chrome Lizards (40)

| Card ID                         | Name                        | Type      | Treatment | L3 fork |
| ------------------------------- | --------------------------- | --------- | --------- | ------- |
| `scrapper`                      | Chrome Scrapper             | creature  | Reviewed  | -       |
| `welder`                        | Spark Welder                | creature  | Reviewed  | -       |
| `bulldozer`                     | Bulld-Ogre                  | creature  | Rewritten | -       |
| `juggernaut`                    | Maw-9000                    | creature  | Rewritten | -       |
| `overclock`                     | Overclock Core              | spell     | Rewritten | -       |
| `shocktrap`                     | Shock Plate                 | trap      | Rewritten | -       |
| `plating`                       | Foundry Plating             | equipment | Reviewed  | -       |
| `wreckingfist`                  | Wrecking Fist               | equipment | Rewritten | -       |
| `ducttape`                      | Duct-Tape Weld              | spell     | Reviewed  | -       |
| `slap`                          | Hydraulic Slap              | spell     | Rewritten | -       |
| `union-millwright`              | Union Millwright            | creature  | Generated | -       |
| `spare-pistons`                 | Spare Pistons               | equipment | Generated | -       |
| `s1-walking-foundry`            | Walking Foundry             | creature  | Generated | -       |
| `s1-scrap-welder`               | Scrap Welder                | creature  | Generated | -       |
| `s1-hydraulic-shift`            | Emergency Overtime          | spell     | Generated | -       |
| `s1-forge-spark`                | Forge Lightning             | spell     | Generated | -       |
| `s1-bolt-clamp`                 | Union Bolt Clamp            | trap      | Generated | -       |
| `s1-union-plate`                | Collective Bargaining Plate | equipment | Generated | -       |
| `s2-ironjaw-union-bridgebearer` | Union Bridgebearer          | creature  | Generated | -       |
| `s2-ironjaw-foundry-lion`       | Foundry Lion                | creature  | Generated | A/B     |
| `s2-ironjaw-shift-change-shove` | Shift-Change Shove          | spell     | Generated | -       |
| `s2-ironjaw-spare-rivet-shower` | Spare Rivet Shower          | spell     | Generated | -       |
| `s2-ironjaw-hydraulic-lockjaw`  | Hydraulic Lockjaw           | trap      | Generated | -       |
| `s2-ironjaw-overtime-pistons`   | Overtime Pistons            | equipment | Generated | -       |
| `s3-ironjaw-night-welder`       | Night Shift Welder          | creature  | Generated | -       |
| `s3-ironjaw-dreadnought`        | Scrapyard Dreadnought       | creature  | Generated | -       |
| `s3-ironjaw-union-cook`         | Union Lunch Lady            | creature  | Generated | A/B     |
| `s3-ironjaw-bridgebreaker`      | Bridgebreaker Ogre          | creature  | Generated | -       |
| `s3-ironjaw-coal-racer`         | Coal Cart Racer             | creature  | Generated | -       |
| `s3-ironjaw-matriarch`          | Iron Matriarch              | creature  | Generated | A/B     |
| `s3-ironjaw-bonus-plate`        | Shift Bonus Plates          | spell     | Generated | -       |
| `s3-ironjaw-reallocation`       | Union Reallocation          | spell     | Generated | -       |
| `s3-ironjaw-hammer-register`    | Sledgehammer Inventory      | spell     | Generated | -       |
| `s3-ironjaw-weld-patch`         | Cold-Weld Patch             | spell     | Generated | -       |
| `s3-ironjaw-furnace-overdrive`  | Furnace Overdrive           | spell     | Generated | -       |
| `s3-ironjaw-forklift-chock`     | Forklift Chock              | trap      | Generated | -       |
| `s3-ironjaw-slag-spill`         | Slag Spill                  | trap      | Generated | -       |
| `s3-ironjaw-overtime-toll`      | Overtime Paywall            | trap      | Generated | -       |
| `s3-ironjaw-toe-pistons`        | Steel-Toed Pistons          | equipment | Generated | -       |
| `s3-ironjaw-foreman-crowbar`    | Foreman Crowbar             | equipment | Generated | -       |

### Anarkiss (40)

| Card ID                            | Name                        | Type      | Treatment | L3 fork |
| ---------------------------------- | --------------------------- | --------- | --------- | ------- |
| `rat`                              | Riot Rat                    | creature  | Rewritten | -       |
| `firebrand`                        | Firebrand                   | creature  | Rewritten | -       |
| `kaboom`                           | Sister Kaboom               | creature  | Reviewed  | -       |
| `bomber`                           | Grand Detonator             | creature  | Rewritten | -       |
| `firestorm`                        | Accidental Firestorm        | spell     | Rewritten | -       |
| `badluck`                          | Whoops Grenade              | trap      | Reviewed  | -       |
| `fuse`                             | Illegal Booster             | equipment | Rewritten | -       |
| `confetti`                         | Confetti Cannon             | spell     | Rewritten | -       |
| `fusevest`                         | Lit-Fuse Vest               | equipment | Rewritten | -       |
| `drink`                            | Hold My Drink               | spell     | Reviewed  | -       |
| `spark-diver`                      | Spark Diver                 | creature  | Generated | -       |
| `firebreak-parade`                 | Firebreak Parade            | spell     | Generated | -       |
| `s1-mime-fuse`                     | Matchstick Mime             | creature  | Generated | -       |
| `s1-blast-radius`                  | Doctor Blast Radius         | creature  | Generated | -       |
| `s1-no-witnesses`                  | No Witnesses, Especially Us | spell     | Generated | -       |
| `s1-chaos-firecracker`             | Mystery-Flavor Firecracker  | spell     | Generated | -       |
| `s1-fuse-alley`                    | Bottled Thunder             | trap      | Generated | -       |
| `s1-volunteer-vest`                | Volunteer Safety Vest       | equipment | Generated | -       |
| `s2-riot-fuse-lit-bicycle-courier` | Fuse-Lit Bicycle Courier    | creature  | Generated | -       |
| `s2-riot-radioactive-parade-float` | Radioactive Parade Float    | creature  | Generated | -       |
| `s2-riot-friendly-fire-rehearsal`  | Friendly-Fire Rehearsal     | spell     | Generated | -       |
| `s2-riot-homemade-bottle-rocket`   | Homemade Bottle Rocket      | spell     | Generated | -       |
| `s2-riot-fusebox-fireworks`        | Fusebox Fireworks           | trap      | Generated | -       |
| `s2-riot-last-stand-matchbook`     | Last-Stand Matchbook        | equipment | Generated | -       |
| `s3-riot-bottle-rocket`            | Bottle-Rocket Nun           | creature  | Generated | -       |
| `s3-riot-detonation-deacon`        | Detonation Deacon           | creature  | Generated | -       |
| `s3-riot-alley-prophet`            | Alley Prophet of Sparks     | creature  | Generated | -       |
| `s3-riot-firework-bishop`          | Firework Bishop             | creature  | Generated | -       |
| `s3-riot-riot-bike-messenger`      | Riot Bike Messenger         | creature  | Generated | -       |
| `s3-riot-thermite-archangel`       | Thermite Archangel          | creature  | Generated | -       |
| `s3-riot-low-budget-grenade`       | Low-Budget Grenade          | spell     | Generated | -       |
| `s3-riot-wrong-side-of-blast`      | Wrong Side of the Blast     | spell     | Generated | -       |
| `s3-riot-horrible-idea`            | This Is a Horrible Idea     | spell     | Generated | -       |
| `s3-riot-stolen-detonator`         | Stolen Detonator            | spell     | Generated | A/B     |
| `s3-riot-final-benediction`        | Final Benediction of Fire   | spell     | Generated | A/B     |
| `s3-riot-fusewire`                 | Fusewire Rosary             | trap      | Generated | -       |
| `s3-riot-night-market-rocket`      | Night Market Rocket         | trap      | Generated | -       |
| `s3-riot-confession-booth`         | Booby-Trapped Confessional  | trap      | Generated | -       |
| `s3-riot-charred-sneakers`         | Charred Sneakers            | equipment | Generated | -       |
| `s3-riot-posthumous-saint`         | Posthumous Saint Medal      | equipment | Generated | -       |

### Undertow Intelligence (40)

| Card ID                              | Name                      | Type      | Treatment | L3 fork |
| ------------------------------------ | ------------------------- | --------- | --------- | ------- |
| `watcher`                            | Sewer Watcher             | creature  | Rewritten | -       |
| `frogtrooper`                        | Frog Trooper              | creature  | Rewritten | -       |
| `eel`                                | Eel Courier               | creature  | Rewritten | -       |
| `oracle`                             | Drowned Oracle            | creature  | Rewritten | -       |
| `blackout`                           | Signal Blackout           | spell     | Rewritten | -       |
| `tripwire`                           | Tripwire                  | trap      | Rewritten | -       |
| `visor`                              | Spyglass Visor            | equipment | Rewritten | -       |
| `grate`                              | Leech Grate               | trap      | Rewritten | -       |
| `sonar`                              | Drain Sonar               | spell     | Rewritten | -       |
| `drysuit`                            | Rubber Drysuit            | equipment | Reviewed  | -       |
| `pipe-seer`                          | Pipe Seer                 | creature  | Generated | A/B     |
| `snitch-grate`                       | Snitch Grate              | trap      | Generated | -       |
| `s1-basement-ghost`                  | Basement Ghost            | creature  | Generated | -       |
| `s1-static-listener`                 | Static Listener           | creature  | Generated | -       |
| `s1-floodlight-sweep`                | Floodlight Sweep          | spell     | Generated | -       |
| `s1-wiretap-order`                   | Wiretap Restraining Order | spell     | Generated | -       |
| `s1-blue-ink-deadfall`               | Blue-Ink Deadfall         | trap      | Generated | -       |
| `s1-needle-wire`                     | Needle-Wire Antenna       | equipment | Generated | -       |
| `s2-undertow-drainpipe-interrogator` | Drainpipe Interrogator    | creature  | Generated | -       |
| `s2-undertow-subsurface-warden`      | Subsurface Warden         | creature  | Generated | -       |
| `s2-undertow-floodlight-leak`        | Floodlight Leak           | spell     | Generated | -       |
| `s2-undertow-backwater-iou`          | Backwater IOU             | spell     | Generated | -       |
| `s2-undertow-culvert-tollwire`       | Culvert Tollwire          | trap      | Generated | -       |
| `s2-undertow-wiretap-spikes`         | Wiretap Spikes            | equipment | Generated | -       |
| `s3-undertow-drain-sniper`           | Drainpipe Sniper          | creature  | Generated | -       |
| `s3-undertow-interrogation-eel`      | Interrogation Eel         | creature  | Generated | -       |
| `s3-undertow-quiet-listener`         | Quiet Room Listener       | creature  | Generated | -       |
| `s3-undertow-needle-rain-agent`      | Needle Rain Agent         | creature  | Generated | -       |
| `s3-undertow-basement-watchdog`      | Basement Watchdog         | creature  | Generated | -       |
| `s3-undertow-sewer-leviathan`        | Sewer Leviathan           | creature  | Generated | A/B     |
| `s3-undertow-weep-holes`             | Weep Holes in the Wall    | spell     | Generated | -       |
| `s3-undertow-long-drain-sting`       | Long Drain Sting          | spell     | Generated | -       |
| `s3-undertow-reveal-the-ledger`      | Reveal the Ledger         | spell     | Generated | A/B     |
| `s3-undertow-quiet-interdiction`     | Quiet Interdiction        | spell     | Generated | -       |
| `s3-undertow-citywide-blackmail`     | Citywide Blackmail        | spell     | Generated | -       |
| `s3-undertow-red-tape-sensor`        | Red-Tape Sensor           | trap      | Generated | -       |
| `s3-undertow-floodgate-clamp`        | Floodgate Clamp           | trap      | Generated | -       |
| `s3-undertow-anonymous-invoice`      | Anonymous Invoice         | trap      | Generated | -       |
| `s3-undertow-periscope-lens`         | Periscope Lens            | equipment | Generated | -       |
| `s3-undertow-tunnel-harpoon`         | Tunnel Harpoon            | equipment | Generated | -       |

### Meat Exchange (40)

| Card ID                                 | Name                        | Type      | Treatment | L3 fork |
| --------------------------------------- | --------------------------- | --------- | --------- | ------- |
| `repo`                                  | Repo Goblin                 | creature  | Reviewed  | -       |
| `collector`                             | Debt Collector              | creature  | Rewritten | -       |
| `broker`                                | Flesh Broker                | creature  | Rewritten | -       |
| `mogul`                                 | The Meat Mogul              | creature  | Reviewed  | -       |
| `collection`                            | Hostile Collection          | spell     | Rewritten | -       |
| `debttrap`                              | Hidden Fees                 | trap      | Rewritten | -       |
| `contract`                              | Iron Contract               | equipment | Rewritten | -       |
| `foreclosure`                           | Foreclosure                 | spell     | Rewritten | -       |
| `handshake`                             | Golden Handshake            | equipment | Rewritten | -       |
| `hushmoney`                             | Hush Money                  | spell     | Rewritten | -       |
| `audit-fiend`                           | Audit Fiend                 | creature  | Generated | -       |
| `debt-holiday`                          | Debt Holiday                | spell     | Generated | -       |
| `s1-executive-repo`                     | Executive Repossessor       | creature  | Generated | -       |
| `s1-guild-clerk`                        | Guild Clerk (Temporary)     | creature  | Generated | -       |
| `s1-margin-call`                        | Emergency Margin Call       | spell     | Generated | -       |
| `s1-buy-silence`                        | Buy Their Silence           | spell     | Generated | -       |
| `s1-debt-garnish`                       | Garnishment Floor Tile      | trap      | Generated | -       |
| `s1-golden-handshake`                   | Golden Handshake, Iron Grip | equipment | Generated | -       |
| `s2-exchange-bargain-rate-collector`    | Bargain-Rate Collector      | creature  | Generated | -       |
| `s2-exchange-golden-bailiff`            | Golden Bailiff              | creature  | Generated | -       |
| `s2-exchange-compound-interest-notice`  | Compound Interest Notice    | spell     | Generated | -       |
| `s2-exchange-contract-amendment`        | Contract Amendment          | spell     | Generated | A/B     |
| `s2-exchange-invisible-lien`            | Invisible Lien              | trap      | Generated | -       |
| `s2-exchange-executive-health-coverage` | Executive Health Coverage   | equipment | Generated | -       |
| `s3-exchange-wage-garnisher`            | Wage Garnisher              | creature  | Generated | -       |
| `s3-exchange-mortgage-minotaur`         | Mortgage Minotaur           | creature  | Generated | A/B     |
| `s3-exchange-retainer-clerk`            | Retainer Clerk              | creature  | Generated | -       |
| `s3-exchange-seizure-executive`         | Seizure Executive           | creature  | Generated | -       |
| `s3-exchange-hostile-takeover-goon`     | Hostile Takeover Goon       | creature  | Generated | -       |
| `s3-exchange-golden-foreclosure`        | Golden Foreclosure Engine   | creature  | Generated | -       |
| `s3-exchange-payment-reminder`          | Payment Reminder            | spell     | Generated | -       |
| `s3-exchange-compound-notice`           | Compound Notice             | spell     | Generated | -       |
| `s3-exchange-executive-incentive`       | Executive Incentive         | spell     | Generated | -       |
| `s3-exchange-golden-parachute`          | Golden Parachute            | spell     | Generated | A/B     |
| `s3-exchange-acquisition-clause`        | Acquisition Clause          | spell     | Generated | -       |
| `s3-exchange-late-fee-sticker`          | Late-Fee Sticker            | trap      | Generated | -       |
| `s3-exchange-escrow-snare`              | Escrow Snare                | trap      | Generated | -       |
| `s3-exchange-repossession-notice`       | Repossession Notice         | trap      | Generated | -       |
| `s3-exchange-ledger-greaves`            | Ledger Greaves              | equipment | Generated | -       |
| `s3-exchange-collection-badge`          | Collection Badge            | equipment | Generated | -       |

### Mercenaries (60)

| Card ID                       | Name                    | Type      | Treatment | L3 fork |
| ----------------------------- | ----------------------- | --------- | --------- | ------- |
| `merc-bus-driver`             | Gutterbus Driver        | creature  | Rewritten | -       |
| `merc-bribe-rat`              | Bribe-Licked Rat        | creature  | Rewritten | -       |
| `merc-roof-dentist`           | Rooftop Dentist         | creature  | Reviewed  | -       |
| `merc-debt-slug`              | Debt-Eating Slug        | creature  | Reviewed  | -       |
| `merc-clock-grandma`          | Clockwork Grandmother   | creature  | Rewritten | -       |
| `merc-smog-moth`              | Smog Moth Courier       | creature  | Rewritten | -       |
| `merc-grease-oracle`          | Grease Oracle           | creature  | Rewritten | -       |
| `merc-fungal-bouncer`         | Fungal Bouncer          | creature  | Rewritten | -       |
| `merc-discount-angel`         | Discount Archangel      | creature  | Rewritten | -       |
| `merc-union-owl`              | Owl of All Trades       | creature  | Reviewed  | -       |
| `merc-sewer-sommelier`        | Sewer Sommelier         | creature  | Generated | -       |
| `merc-skate-taxidermist`      | Skating Taxidermist     | creature  | Generated | -       |
| `merc-auction-golem`          | Auction Golem           | creature  | Generated | -       |
| `merc-spark-midwife`          | Midwife of Sparks       | creature  | Generated | -       |
| `merc-traffic-witch`          | Traffic Witch           | creature  | Generated | -       |
| `merc-picket-troll`           | Picket Line Troll       | creature  | Generated | -       |
| `merc-escape-crab`            | Escape Artist Crab      | creature  | Generated | A/B     |
| `merc-living-scaffold`        | Living Scaffolding      | creature  | Generated | -       |
| `merc-invisible-mime`         | Invisible Mime          | creature  | Generated | -       |
| `merc-midnight-janitor`       | Midnight Janitor        | creature  | Generated | -       |
| `merc-misaddressed-parcel`    | Misaddressed Parcel     | spell     | Generated | -       |
| `merc-crowd-lightning`        | Crowd-Sourced Lightning | spell     | Generated | -       |
| `merc-unofficial-detour`      | Unofficial Detour       | spell     | Generated | -       |
| `merc-reputation-laundry`     | Reputation Laundering   | spell     | Generated | -       |
| `merc-flashmob-diversion`     | Flashmob Diversion      | spell     | Generated | -       |
| `merc-jury-rigged-radar`      | Jury-Rigged Radar       | spell     | Generated | -       |
| `merc-allergy-season`         | Allergy Season          | spell     | Generated | -       |
| `merc-supervised-demo`        | Supervised Demolition   | spell     | Generated | -       |
| `merc-unsupervised-demo`      | Unsupervised Demolition | spell     | Generated | -       |
| `merc-mortgage-holiday`       | Mortgage Holiday        | spell     | Generated | A/B     |
| `merc-secondhand-halo`        | Secondhand Halo         | spell     | Generated | -       |
| `merc-take-stairs`            | Take the Stairs         | spell     | Generated | -       |
| `merc-streetlight-confession` | Streetlight Confession  | spell     | Generated | -       |
| `merc-homebrew-antidote`      | Homebrew Antidote       | spell     | Generated | A/B     |
| `merc-whisper-network`        | Whisper Network         | spell     | Generated | -       |
| `merc-mothball-storm`         | Mothball Storm          | spell     | Generated | A/B     |
| `merc-festival-no-refunds`    | Festival of No Refunds  | spell     | Generated | -       |
| `merc-union-solidarity`       | Union Solidarity        | spell     | Generated | A/B     |
| `merc-glass-echo`             | Glass Echo Plate        | trap      | Generated | -       |
| `merc-tourist-trapdoor`       | Tourist Trapdoor        | trap      | Generated | -       |
| `merc-concealed-tollbooth`    | Concealed Tollbooth     | trap      | Generated | -       |
| `merc-boomerang-buffet`       | Boomerang Buffet        | trap      | Generated | -       |
| `merc-invisible-bump`         | Invisible Speed Bump    | trap      | Generated | -       |
| `merc-market-tripwire`        | Night Market Tripwire   | trap      | Generated | -       |
| `merc-flooded-fusebox`        | Flooded Fusebox         | trap      | Generated | -       |
| `merc-parking-meter`          | Hostile Parking Meter   | trap      | Generated | -       |
| `merc-dog-eared-mine`         | Dog-Eared Mine          | trap      | Generated | -       |
| `merc-cursed-sign`            | Cursed Detour Sign      | trap      | Generated | -       |
| `merc-ghoul-et-lot`           | Ghoul-Et-Lot            | trap      | Generated | -       |
| `merc-angry-bees`             | Bag of Very Angry Bees  | trap      | Generated | -       |
| `merc-borrowed-kneepads`      | Borrowed Kneepads       | equipment | Generated | -       |
| `merc-squeaky-wheel`          | Squeaky Wheel           | equipment | Generated | -       |
| `merc-edible-kevlar`          | Edible Kevlar           | equipment | Generated | -       |
| `merc-emergency-wings`        | Emergency Wings         | equipment | Generated | -       |
| `merc-red-tape-scissors`      | Red Tape Scissors       | equipment | Generated | -       |
| `merc-theftproof-toolkit`     | Theftproof Toolkit      | equipment | Generated | -       |
| `merc-counterfeit-license`    | Counterfeit License     | equipment | Generated | -       |
| `merc-rooftop-map`            | Rooftop Map             | equipment | Generated | -       |
| `merc-broken-halo`            | Broken Halo             | equipment | Generated | -       |
| `merc-union-suit`             | Union Suit              | equipment | Generated | -       |

## Remaining work outside this editorial scope

The t-041 roadmap still tracks individual payoff and counterplay quality, Solo/Alliance seeded matchups and CPU reachability, evolution artwork and subjective human fun testing. The editorial audit must not be construed as closing those gates. This report is versioned alongside the code so future wording changes can be reviewed against the same inventory and test contract.
