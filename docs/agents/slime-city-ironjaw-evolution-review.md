# Ironjaw: individual 40-card CLASH evolution review

Part of Conductor `slime-city/t-041`, following the Catgirls and Bloodfairies editorial passes. Review is based on `utils/slimeCity/clashTwists.ts` (ten native arcs), `utils/slimeCity/evolutions/ironjaw.ts` (thirty DSL arcs), and actual Clash card state. Every ID is existing: no new cards, faction changes, account changes, art jobs, or production release.

**Editorial choice:** Ironjaw should win with working bodies, local plating, picked-up workers and earned lane breakthroughs. Preserve L2 jobs at L3 rather than making the final stage abandon the reason a player chose that card. A level's printed rule is only accepted if its trigger executes in CLASH; native twists that already have meaningful progression are kept intact.

| Card ID | Useful L1 | L2 synergy | L3 payoff | Opponent's answer |
| --- | --- | --- | --- | --- |
| `scrapper` | Armored line-holder | Shields adjacent friends every turn | Shields the whole friendly line | Spread pressure or pierce armor |
| `welder` | Reliable guard | Mends nearby fighters after each round | Doubles local healing | Remove medic before round end |
| `bulldozer` | Overkill siege striker | Cuts through extra armor | Leaks damage to boss through blockers | Trade with high-life blocker |
| `juggernaut` | Plated siege body | Restores full striking strength | Siege attack plus neighbor armor | Avoid a stacked frontline |
| `overclock` | Temporary power surge | More power with recoil | Huge surge, recoil and splash | Stun boosted fighter; punish self-damage |
| `shocktrap` | Hidden plate stuns intruder | Spreads an arc to neighbor | Roots center and stuns both neighbors | Probe or scan trap |
| `plating` | Permanent armor fitting | Armors adjacent allies | Plates the entire friendly crew | Pierce and split formation |
| `wreckingfist` | Permanent power fitting | Adds BULLDOZE to one attacker | Leaks blocker damage to boss and neighbor | Keep shielded blocker at high life |
| `ducttape` | Immediate repair | Adds lasting armor | Rebuilds a scrap echo | Deny free lanes or pierce patch |
| `slap` | Single-fighter removal | Adds stun | Stuns and harms neighboring rivals | Spread the line |
| `union-millwright` | Armored lane worker | Heals wounded ally each turn | Heals then buffs crew after boss hit | Block millwright's alley |
| `spare-pistons` | Armor equipment | Shields wearer each turn | BULLDOZE stomp splashes adjacent foes | Stun wearer; split defenders |
| `s1-walking-foundry` | BULLDOZE furnace | Plates adjacent allies on entry | Casts neighboring workers and plates them | Fill neighboring lanes; sweep tokens |
| `s1-scrap-welder` | Cheap plated BULLDOZE | Guards self each turn | Lone-lane armor payoff | Attack other lanes; pierce |
| `s1-hydraulic-shift` | Immediate worker surge | Permanent +1 chosen worker | Retains +1 and surges/guards neighbors | Break formation before cast |
| `s1-forge-spark` | Direct hit on rival | Adjacent foe splash | Fixed breakthrough against rival boss | Spread rivals; watch boss clock |
| `s1-bolt-clamp` | Hidden damaging snare | Shields nearby allies when sprung | Shields allies and stuns neighboring foes | Scan or spring with sacrificial runner |
| `s1-union-plate` | Permanent armor fitting | Local attack aura | Rescue wearer with local aura | Stun wearer or spend rescue |
| `s2-ironjaw-union-bridgebearer` | Makes fragile picket on entry | Makes tougher picket and boosts neighbors | Pacifist worker factory shields neighbors | Sweep small allies; occupy neighbor slots |
| `s2-ironjaw-foundry-lion` | Armored BULLDOZE crane | Hit splash plus tap guard | Choose boss leap or blocker duel | Keep opposite lane blocked |
| `s2-ironjaw-shift-change-shove` | Grants BULLDOZE | Adds guards to neighbors | Stuns facing blocker | Spread allies; attack elsewhere |
| `s2-ironjaw-spare-rivet-shower` | Permanent plate for worker | Shields nearby workers | Always shields; after loss, plates crew | Avoid early trades, pierce armor |
| `s2-ironjaw-hydraulic-lockjaw` | Hidden damaging lock | Draws on spring | Draws; post-casualty piercing bite | Scan; avoid early trades |
| `s2-ironjaw-overtime-pistons` | Permanent striker upgrade | Grants immediate AMBUSH | Extra duel during strike | Give wearer big blocker |
| `s3-ironjaw-night-welder` | Cheap plated worker | Adds self PIERCE | Keeps self PIERCE, arms nearby allies | Remove neighboring fighters |
| `s3-ironjaw-dreadnought` | Arrives shielding neighbor | Shield and life after being hit | Shockwave then grows each round at lower starting life | Burst before round end |
| `s3-ironjaw-union-cook` | REGEN kitchen defender | Gives REGEN to neighbors | Keeps REGEN; raises other allies' life | Pierce cook; focus fire |
| `s3-ironjaw-bridgebreaker` | Heavy BULLDOZE monitor | Boss damage on breakthrough | Weaker body, buffs whole friendly line | Clear crew before L3 entry |
| `s3-ironjaw-coal-racer` | Fast plated flanker | Grants AMBUSH | AMBUSH then retreats after boss hit | Block lane; trap re-entry |
| `s3-ironjaw-matriarch` | REGEN armored leader | Boosts adjacent allies | Choose whole-line attack or lone armor | Thin crew before arrival |
| `s3-ironjaw-bonus-plate` | Permanent defensive fitting | Adds life to wearer | Keeps life and adds permanent attack | Pierce; deny strong recipient |
| `s3-ironjaw-reallocation` | Grants BULLDOZE | Bigger boost with friendly crowd | Whole friendly crew gains BULLDOZE | Hold strong blockers |
| `s3-ironjaw-hammer-register` | Permanent attack upgrade | Cleanses chosen worker | Cleanses chosen and sharpens neighbors | Split formation; stun after cast |
| `s3-ironjaw-weld-patch` | Repairs wounded fighter | Adds temporary shield | Permanent armor and expanded life | Piercing burst |
| `s3-ironjaw-furnace-overdrive` | Immediate power on worker | Guards chosen fighter | Hurt target to arm stronger BULLDOZE | Finish self-scorched fighter |
| `s3-ironjaw-forklift-chock` | Hidden low-damage snare | Armors adjacent allies | Armors allies and rearms once | Probe snare twice |
| `s3-ironjaw-slag-spill` | Hidden damaging trap | Splash neighbors on spring | Two piercing damage across facing lanes | Scan; keep front thin |
| `s3-ironjaw-overtime-toll` | Hidden damaging debt toll | Damages rival boss | Damages boss plus heals own boss | Probe or scan |
| `s3-ironjaw-toe-pistons` | Permanent fitted power | Splashes neighbors on hit | Duels weakest rival each turn | Deny vulnerable targets |
| `s3-ironjaw-foreman-crowbar` | Gives BULLDOZE | Bonuses against stunned foes | Keeps anti-stun bonus; first kill bills boss | Avoid stun; armor blocker |

## Source and verification status

- Inventory: **40/40** Ironjaw IDs; ten built-in twists and thirty DSL stages. All thirty authored L1 descriptions are rendered by `clashEvolutionText` and are required by the new card-face length checks.
- Eight authored L3 changes preserve earlier utility while adding conditional/interacting effects: Hydraulic Shift, Spare Rivet Shower, Hammer Register, Bolt Clamp, Forklift Chock, Foreman Crowbar, Night Welder and Union Cook. Bonus Plate also preserves its L2 life addition, for **nine touched arcs** total.
- The regression fixtures in `utils/scripts/verifySlimeCityEvolutions.test.ts` exercise six named evolved cards against the real Clash game state, including deterministic replay of one command, spring timing and a second trap arm. They are **not** a 40-card CPU selection/balance test.
- Remaining acceptance is deliberately open: inspect completed GitHub CI at the final commit; run constructed Solo and Alliance sweeps with mirrored seeds, evolution-stage frequency, dead-hand rates, and opponent answers. Verify unique L3 value on the other cards in real fights and review evolution paintings as they arrive.
- Human enjoyment, art delivery, deployment and all-300-card completion are **not** asserted here.
