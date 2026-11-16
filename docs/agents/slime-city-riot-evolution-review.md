# Riot (Anarkiss): individual 40-card CLASH evolution review

Part of Conductor `slime-city/t-041`, following the Catgirls, Bloodfairies, Ironjaw and Undertow editorial passes. The review covers `utils/slimeCity/clashTwists.ts` (ten native arcs), `utils/slimeCity/evolutions/riot.ts` (thirty DSL arcs) and real Clash card state. Every ID already exists. This pass adds no new cards, faction changes, account changes, art jobs or production release.

**Editorial choice:** Anarkiss wins with seeded gambles, showstopping exits and friendly fire. It never heals or armors up. Eleven DSL cards share the bare native line `Volatile: explodes on defeat.` (fighters, gear and one spell), and five spells share the `Deal N, plus 1 to its neighbors.` template. Each card's authored L1 role is therefore deliberately distinct, so the face says what the card is _for_ before it levels.

| Card ID                            | Authored L1 role                                   | L2 synergy                         | L3 payoff                                       |
| ---------------------------------- | -------------------------------------------------- | ---------------------------------- | ----------------------------------------------- |
| `spark-diver`                      | Cheap stunt diver who trades her life for a bang   | Shared burn for +1 power each turn | Last breath: 2 to neighbors, coin-flip 2 to all |
| `firebreak-parade`                 | Breaks up a shoulder-to-shoulder line              | Adjacent allies +1 power           | With a crowd: 1 to every foe                    |
| `s1-mime-fuse`                     | One-drop mime; killing him costs a neighbor        | Death splashes both sides          | Grants VOLATILE to the whole crew               |
| `s1-blast-radius`                  | Sturdy fuse punishing a crowded line               | Knockout and tap splash            | Doomsday last breath hits both crews            |
| `s1-no-witnesses`                  | Cheap removal of a weak foe and its escort         | 2 to target, singes own side       | Stuns three facing foes, singes own side        |
| `s1-chaos-firecracker`             | One-drop sparkler that finishes a hurt foe         | Coin-flip stun                     | One-in-three 2 to every foe                     |
| `s1-fuse-alley`                    | Cheap fuse that defuses a rival bomb               | Coin-flip 3 to intruder            | 2 to adjacent foes, 1 to own neighbors          |
| `s1-volunteer-vest`                | Turns any fighter into a walking bomb              | Adjacent allies +1 aura            | Last breath summons two volatile volunteers     |
| `s2-riot-fuse-lit-bicycle-courier` | Cheap runner whose fall still hurts the foe across | Boss hits +1                       | Last breath leaves a ticking parcel             |
| `s2-riot-radioactive-parade-float` | Slow heavy that makes every blocker pay            | Round-end glow burns both sides    | Arrival 3 to three facing foes, 1 to allies     |
| `s2-riot-friendly-fire-rehearsal`  | Heavy removal of a big foe and its flank           | Chips neighbors for +2 power       | Chips crew for permanent +1                     |
| `s2-riot-homemade-bottle-rocket`   | Straight zap removing a fragile rival              | Coin-flip chip on weakest          | 2 to boss, singes neighbors                     |
| `s2-riot-fusebox-fireworks`        | Powder trap that stalls a runner                   | Sprung: splash adjacent foes       | Sprung: 1 to every fighter on both sides        |
| `s2-riot-last-stand-matchbook`     | Makes the wearer too costly to kill                | Hits splash adjacent foes          | First knockout: 2 to every foe                  |
| `s3-riot-bottle-rocket`            | One-drop skater: blocks early, bursts late         | Coin-flip 2 on arrival             | Last breath: boss +3, singes neighbors          |
| `s3-riot-detonation-deacon`        | Heavy ambusher who hits first and bursts last      | Drumroll chips across and own band | Arrival stuns adjacent foes                     |
| `s3-riot-alley-prophet`            | Sturdy two-drop daring a strike                    | Coin-flip chip each turn           | Self-burn for a 25% 3-to-all                    |
| `s3-riot-firework-bishop`          | Armored strongman anchoring the line               | Adjacent aura                      | Keeps aura; finale last breath                  |
| `s3-riot-riot-bike-messenger`      | Ambush courier striking before blockers settle     | Open lane +2                       | Keeps open-lane +2; hit and run                 |
| `s3-riot-thermite-archangel`       | Big piercing finisher cracking armor               | Hits burn both sides               | Smaller body, piercing 3 to facing foes         |
| `s3-riot-low-budget-grenade`       | One-drop squib tidying a wounded fighter           | Splash both sides                  | Stuns a heavy target                            |
| `s3-riot-wrong-side-of-blast`      | Late blast cleaning up a wounded corner            | 2 to weakest                       | After an ally falls: 2 to every foe             |
| `s3-riot-horrible-idea`            | Risky spark: finish a chipped foe or fizzle        | Coin-flip 2 to target              | Coin-flip boss 3, coin-flip own crew chip       |
| `s3-riot-stolen-detonator`         | Wires one of your fighters to blow                 | Burns target for +3 power          | Choose: crew VOLATILE or blow it now            |
| `s3-riot-final-benediction`        | Heaviest removal, for the foe that must fall       | Splash both sides                  | Choose: crew +2 power or burn every fighter     |
| `s3-riot-fusewire`                 | One-drop wire stalling the first raider            | Sprung: stun adjacent foes         | Sprung: coin-flip 3 to every foe                |
| `s3-riot-night-market-rocket`      | Hidden rocket hitting the first intruder hard      | Sprung: boss +2                    | Sprung: three 2-shots on weakest                |
| `s3-riot-confession-booth`         | Costly booth stalling a heavy raider               | Sprung: stun the strongest         | Sprung: rearms                                  |
| `s3-riot-charred-sneakers`         | Permanent extra punch for a fighter                | Grants AMBUSH                      | Duels the foe across on install                 |
| `s3-riot-posthumous-saint`         | Makes a fallen fighter go out with a bang          | Last breath splash both sides      | Last breath: crew +1, 1 to every foe            |

## Source and verification status

- Inventory: **40/40** Riot IDs, made up of ten native twists and thirty DSL arcs. `clashCardText` renders all thirty authored L1 role lines. They are distinct from each other and fit the 160-character card face at every level, which a new block in `utils/scripts/verifySlimeCityEvolutions.test.ts` asserts.
- Continuity: the thirty arc comments already agree with their L3 code. Firework Bishop keeps its aura, and Bike Messenger keeps its open-lane surge (kind_robots#5232). Spark Diver, Mime Fuse and the PRICE arcs openly document what they trade away. No balance-affecting rule change was needed, so the CLASH crew spread is untouched.
- Not covered: the Exchange and shared Mercenaries editorial passes, constructed Solo/Alliance balance, the dead two-slot cards tied to `t-051`, evolution art, human fun acceptance and production deployment.
