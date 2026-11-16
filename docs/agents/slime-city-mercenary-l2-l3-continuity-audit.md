# Slime City Mercenary L2-to-L3 continuity audit

Conductor task: `slime-city/t-070`, a bounded Mercenary QA slice of umbrella `t-041`.
Date: 2026-11-16 PT.

## Method

A mechanical pass over `utils/slimeCity/evolutions/mercenaryA.ts` and `mercenaryB.ts`
listed every Mercenary whose L2 `on(...)` effect does not appear verbatim in its L3
stage. The pass flagged 35 of 60 cards. Each one was then read against its arc comment,
which names its trajectory and counterplay. Kind Robots #5255 already fixed Auction Golem
and Spark Midwife.

## Outcome

**One unintended loss, fixed here: Broken Halo.** Its arc is "grace spills onto the
neighbors, then one last miracle when the wearer falls". At L3 the stage dropped the L2
on-hit adjacent heal, so the evolved halo did nothing for the crew until its wearer
died. Its stated counterplay ("stun the wearer instead of killing it") also meant nothing
while the wearer lived. L3 now keeps `on('hit', heal(1, 'adjacentAllies'))`.

To keep the 160-character card face, the halo's death payoff changed. It used to heal
all allies 2 and summon a 2/3 echo; now it only summons the echo. The L3 face is 152
characters.

A seeded real-Clash fixture in `verifySlimeCityClashCpuEvolutions.test.ts` covers the
change:

- The wearer's landed hit heals both wounded neighbors.
- A stunned wearer heals nobody.
- The strike replays deterministically.
- The card face names the kept grace.

The fixture fails on the old definition. The default 20-card balance report
(`slimeCityClashBalanceReport.ts`) is byte-identical to main.

**The other 34 flagged cards are deliberate changes, not losses.** Each falls into one of
these groups:

- **Role shift stated in the arc** (L3 replaces the L2 job on purpose): Picket Troll,
  Living Scaffold, Unofficial Detour, Reputation Laundry, Jury-Rigged Radar, Unsupervised
  Demo, Take the Stairs, Glass Echo, Invisible Bump, Cursed Sign, Angry Bees, Concealed
  Tollbooth (anti-heavy toll becomes a jam).
- **Choose-one L3** (the L2 job became one branch of a choice): Mortgage Holiday, Homebrew
  Antidote, Mothball Storm, Union Solidarity.
- **L3 is a superset or wider version of L2** (the parser saw changed numbers or scope,
  but nothing was lost): Misaddressed Parcel, Crowd Lightning, Flashmob Diversion,
  Allergy Season, Streetlight Confession, Whisper Network, Tourist Trapdoor, Boomerang
  Buffet, Market Tripwire, Flooded Fusebox, Parking Meter, Dog-Eared Mine, Ghoul-et Lot,
  Borrowed Kneepads, Red Tape Scissors, Rooftop Map.
- **Price trajectory** (the L3 cost is the design): Emergency Wings, whose dive leaves
  the board, and Festival No Refunds, whose front-row hype becomes a crew-wide toll.

## Not claimed

This audit does not cover:

- constructed-selection rebalancing of rarely chosen Mercenaries;
- art;
- human fun acceptance;
- deployment.
