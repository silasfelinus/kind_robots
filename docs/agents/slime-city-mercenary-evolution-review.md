# Mercenaries: individual 50-card CLASH evolution review

Part of Conductor `slime-city/t-041`, following the Catgirls, Bloodfairies, Ironjaw, Undertow, Riot and Exchange editorial passes. The review covers `utils/slimeCity/evolutions/mercenaryA.ts` and `mercenaryB.ts` (fifty DSL arcs; the remaining Mercenary IDs use native arcs in `clashTwists.ts`) and real Clash card state. Every ID already exists. This pass adds no new cards, rule changes, faction changes, account changes, art jobs or production release, so CLASH balance is untouched.

**Editorial choice:** Mercenaries are crew-neutral hired help, so each L1 role says what job a crew hires the card for rather than tying it to one faction. At level 1 many cards share bare native lines: fifteen traps share the `Next foe: N damage ...` template, three cards share `Your fighter gains +1 power for good.`, and the swarm, ambush, armor, leech, regen, bulldoze and snare keywords repeat across fighters, spells and gear. Each authored role is distinct and describes native rules only; none grants a new ability.

| Card ID                       | Kind / cost | Authored L1 role                                             | L2 stage                 | L3 stage                 |
| ----------------------------- | ----------- | ------------------------------------------------------------ | ------------------------ | ------------------------ |
| `merc-sewer-sommelier`        | creature 2  | A two-drop sipper who stays topped up by trading hits        | Tasting Flight           | Grand Cru of the Gutter  |
| `merc-skate-taxidermist`      | creature 3  | A skater who hits harder parked beside any hired friend      | Trophy Wall              | Diorama on Wheels        |
| `merc-auction-golem`          | creature 6  | A six-drop wall that sells overkill straight to the boss     | Priced Out               | Sold Out From Under You  |
| `merc-spark-midwife`          | creature 4  | A fuse on legs: make the rival pay to knock her down         | Ideas Are Catching       | Brainstorm               |
| `merc-traffic-witch`          | creature 3  | A crossing guard whose every hit halts a rival swing         | Green Wave               | Gridlock                 |
| `merc-picket-troll`           | creature 4  | A sturdy picket that holds a lane against small hitters      | Permanent Overtime       | General Strike           |
| `merc-escape-crab`            | creature 2  | A cheap snap that strikes first the turn it lands            | Dine and Dash            | The Seventeenth Escape   |
| `merc-living-scaffold`        | creature 5  | A five-drop building that soaks a whole round of hits        | Load-Bearing             | New Wings                |
| `merc-invisible-mime`         | creature 3  | A fragile mime who lands one surprise blow, then folds       | Against the Wind         | Trapped in a Box         |
| `merc-midnight-janitor`       | creature 5  | An armored cleaner who scrubs through enemy plating          | Mops Up                  | Closing Time             |
| `merc-misaddressed-parcel`    | spell 1     | Spare gauze for a fighter one point from falling             | Forwarded Next Door      | Every Door on the Block  |
| `merc-crowd-lightning`        | spell 2     | A cheap zap that finishes off a wounded rival                | Signature Drive          | Lightning Rod Petition   |
| `merc-unofficial-detour`      | spell 3     | A dead-end sign that takes a big hitter out of a turn        | Dead End                 | Road Closed for Repairs  |
| `merc-reputation-laundry`     | spell 2     | A clean record that shrugs off chip damage for good          | Glowing Reference        | Comes Out Spotless       |
| `merc-flashmob-diversion`     | spell 3     | Hired dancers that pump a fighter standing with its crew     | Rehearsal                | The Whole Street Dances  |
| `merc-jury-rigged-radar`      | spell 2     | A coat-hanger sweep that clears a trap before you step       | Feedback Whine           | Locked On                |
| `merc-allergy-season`         | spell 2     | A sneeze of chip damage for a fragile rival                  | Pollen Drift             | Peak Pollen Count        |
| `merc-supervised-demo`        | spell 4     | A permitted blast for a crowded rival lane                   | Hard Hats On             | Controlled Implosion     |
| `merc-unsupervised-demo`      | spell 4     | A reckless blast that drops a big target and nicks its flank | Flying Debris            | Nobody Read the Manual   |
| `merc-mortgage-holiday`       | spell 1     | A one-cost pause that stalls a rival fighter a turn          | Grace Period             | Foreclosure              |
| `merc-secondhand-halo`        | spell 4     | A used halo that lets a frontliner patch up each round       | Still Warm               | Previous Owner           |
| `merc-take-stairs`            | spell 2     | A one-round burst to win a trade you would lose              | Leg Day                  | Stairwell Sprint         |
| `merc-streetlight-confession` | spell 1     | A cheap, lasting edge for a fighter you will keep            | Overheard                | The Truth Hurts          |
| `merc-homebrew-antidote`      | spell 3     | A big heal that rescues a fighter from a bad trade           | Side Effects May Include | Good Batch               |
| `merc-whisper-network`        | spell 3     | A rumor that wounds a fighter and keeps it from swinging     | Grapevine                | Front Page               |
| `merc-mothball-storm`         | spell 5     | A heavy cloud that drops a big fighter and dusts its flank   | Cedar Closet             | Whole-Block Fumigation   |
| `merc-festival-no-refunds`    | spell 3     | A cheap crowd crush for a lane of small fighters             | Crowd Surge              | Final Encore, No Refunds |
| `merc-union-solidarity`       | spell 3     | A shove that sends a fighter's overkill on to the boss       | Union Local              | General Strike           |
| `merc-glass-echo`             | trap 1      | A one-cost chime that stalls the next intruder               | Ringing Ears             | Echo Chamber             |
| `merc-tourist-trapdoor`       | trap 2      | A cheap pit that cracks the next armored tourist             | Gift Shop Exit           | The Whole Tour Group     |
| `merc-concealed-tollbooth`    | trap 3      | A hidden toll that strips armor from the next arrival        | Surge Pricing            | Gridlock at the Gate     |
| `merc-boomerang-buffet`       | trap 4      | A heavy trap built to flatten a mid-sized fighter            | Buffet Line              | It Comes Back Around     |
| `merc-invisible-bump`         | trap 2      | A cheap bump that slows and stings the next runner           | Cone Zone                | Road Works Republic      |
| `merc-market-tripwire`        | trap 3      | A stall wire that trips the next fighter and cuts its guard  | Dropped Bargains         | Everything Must Go       |
| `merc-flooded-fusebox`        | trap 5      | A five-cost shock that can drop a big arriving fighter       | Live Puddle              | Ten-Block Blackout       |
| `merc-parking-meter`          | trap 2      | A cheap meter that defuses the next volatile arrival         | Ticketed                 | Clamped and Towed        |
| `merc-dog-eared-mine`         | trap 5      | A heavy mine that wounds the next fighter and stalls it      | Footnote Shrapnel        | Required Reading         |
| `merc-cursed-sign`            | trap 1      | A one-cost curse that dents the next fighter in              | Wandering Curse          | The Committee Convenes   |
| `merc-ghoul-et-lot`           | trap 5      | A guarded lot that bites whoever claims it next              | Restless Tenant          | The Ghouls Collect       |
| `merc-angry-bees`             | trap 4      | A bag of bees that stings the next fighter off its swing     | Bees Everywhere          | The Queen's Grudge       |
| `merc-borrowed-kneepads`      | equipment 1 | One-cost pads that blunt chip damage on a frontliner         | Pass It Down             | Family Heirloom          |
| `merc-squeaky-wheel`          | equipment 2 | A cheap wheel that gives a runner a permanent edge           | Gets the Oil             | Complaint Department     |
| `merc-edible-kevlar`          | equipment 3 | Gear that lets any fighter freeze the rivals it hits         | Midnight Snack           | Kevlar Potluck           |
| `merc-emergency-wings`        | equipment 4 | Wings that make a fighter stronger beside its crew           | Gliding In               | Emergency Exit           |
| `merc-red-tape-scissors`      | equipment 3 | Scissors that let a fighter cut through armored walls        | Snip the Forms           | Grand Ribbon-Cutting     |
| `merc-theftproof-toolkit`     | equipment 4 | A locked kit that keeps one fighter healing every round      | House Calls              | Clinic in a Case         |
| `merc-counterfeit-license`    | equipment 2 | A forged permit that marks your lead fighter for growth      | Laminated                | Diplomatic Immunity      |
| `merc-rooftop-map`            | equipment 4 | A map that lets a new fighter strike the moment it lands     | Marked Ledges            | Every Rooftop Known      |
| `merc-broken-halo`            | equipment 5 | A halo that heals its wearer with every landed hit           | Second-Hand Grace        | One Last Miracle         |
| `merc-union-suit`             | equipment 5 | Long johns that push a big hitter's overkill into the boss   | Flannel Layers           | Shop Steward             |

**Face budget:** roles render at level 1 only. The longest L1 face is `merc-market-tripwire` at 126 characters. The new test in `utils/scripts/verifySlimeCityEvolutions.test.ts` asserts all fifty roles render at L1, are distinct, and that every level stays within the 160-character face.

**Remaining for t-041:** constructed balance (the dead two-slot cards attributed to t-051), art and fun acceptance.
