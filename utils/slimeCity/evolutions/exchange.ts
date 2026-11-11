// Crafted evolutions: exchange (CLASH-EVOLUTION-PLAN.md in conductor). Each card is
// designed one at a time, story first, following evolutions/catgirls.ts.
// The Meat Exchange owns boss drains, bounties, debt that compounds and
// buyouts; it never heals its allies and never adds stuns of its own.
import {
  boss,
  damage,
  draw,
  duel,
  grant,
  life,
  mend,
  on,
  once,
  power,
  rearm,
  rescue,
  retreat,
  revive,
  sharpen,
  stage,
  summon,
  when,
  type CardEvolution,
} from './dsl'

export const EXCHANGE_EVOLUTIONS: Record<string, CardEvolution> = {
  // Arc: a walking ledger with claws -> interest piles onto every swing ->
  // the Full Audit, where every rival account is billed the moment it lands.
  // Trajectory: ROLE SHIFT (a duelist that grows into an arrival sweeper).
  // Counterplay: armor blocks the audit's 1 entirely; its body stays small,
  // so trade a cheap fighter into it before the interest compounds.
  'audit-fiend': {
    2: stage('The Flesh Ledger Opens', [on('hit', sharpen(1, 'self'))]),
    3: stage('The Choir of Unpaid Bones', [on('enter', damage(1, 'allFoes'))]),
  },
  // Arc: a delayed payment -> the payment holiday banks a little interest
  // while the debtor is frozen -> the offer expires: a heavy debtor owes the
  // boss.
  // Trajectory: SITUATIONAL (the L3 bill lands only on a 2-play debtor).
  // Counterplay: field cheap fighters against the L3 bill.
  'debt-holiday': {
    2: stage('The Drowned Chapel\'s Mercy', [on('enter', mend(1))]),
    3: stage('The Bell Tolls for Debtors', [on('enter', when('targetHeavy', boss(3)))]),
  },
  // Arc: a repo agent in a pressed suit -> only the big debtors own
  // furniture worth selling -> a repossession spree: every seized debtor
  // leads it straight to the weakest one left.
  // Trajectory: LATE BLOOMER, earned (L2 pays only on a 2-play knockout;
  // L3 chains only off a knockout). Counterplay: deny the first knockout
  // with armor or high life; a glass-cannon weakest foe hits back hard in
  // the chained duel.
  's1-executive-repo': {
    2: stage('Relics of the Evicted', [on('kill', when('targetHeavy', mend(2)))]),
    3: stage('The Undertaker\'s Inventory', [on('kill', duel('weakestFoe'))]),
  },
  // Arc: a temp on the graveyard ledger -> even a paper cut bills the rival
  // -> made permanent: a desk job that bills every round and never fights.
  // Trajectory: PRICE (it gives up its strikes for a steady drain).
  // Counterplay: it never hits back, so swing into it freely; the drip is
  // one a round, so race it.
  's1-guild-clerk': {
    2: stage('Ink Drawn from Blood', [on('hit', boss(1))]),
    3: stage('The Eternal Night Clerk', [on('roundEnd', boss(1))], { pacifist: true }),
  },
  // Arc: an emergency call -> the margin tightens on the boss -> a cascade
  // of calls through the whole street.
  // Trajectory: STEADY (a cheap common that widens). Counterplay: spread
  // out; the cascade only reaches the target's neighbors.
  's1-margin-call': {
    2: stage('The Tithe Is Due', [on('enter', boss(2))]),
    3: stage('The Tithe Spreads', [
      on('enter', damage(1, 'adjacentFoes'), boss(2)),
    ]),
  },
  // Arc: hush money changes hands -> the nondisclosure fee lands in your
  // vault -> the hush network: everything they would have said is yours.
  // Trajectory: ROLE SHIFT (control, then treasury, then information).
  // Counterplay: the stun is one strike; strike before the cards land.
  's1-buy-silence': {
    2: stage('The Price of Silence', [on('enter', mend(2))]),
    3: stage('The Confessional Web', [on('enter', draw(2))]),
  },
  // Arc: a tax tile on the floor -> it garnishes the trespasser's wages ->
  // a garnishment order that follows the next one in, too.
  // Trajectory: LATE BLOOMER (a second spring at L3). Counterplay: scan
  // it; send a cheap runner first to pay both bills.
  's1-debt-garnish': {
    2: stage('The Butcher\'s Due', [on('spring', boss(1))]),
    3: stage('The Unending Tithe', [on('spring', boss(1), rearm())]),
  },
  // Arc: a golden handshake -> an iron grip that bills on contact -> the
  // golden exit: take the bounty and walk out before anyone notices.
  // Trajectory: PRICE (the payoff takes the wearer off the board).
  // Counterplay: deny the knockout with big blockers; when it walks, the
  // alley it leaves is open for a counter-swing.
  's1-golden-handshake': {
    2: stage('The Hand Beneath the Counter', [on('hit', boss(1))]),
    3: stage('The Last Rites of Commerce', [on('kill', mend(2), retreat())]),
  },
  // Arc: a polite collector with a bill stapled to its fist -> every swing
  // is invoiced -> the clearance sale: everything must go, even its bulk.
  // Trajectory: EARLY BLOOMER, the Exchange's one weaker level three: a
  // smaller body for a six-point swing on arrival. Counterplay: it dies to
  // almost anything once the sale is over; keep your boss topped up.
  's2-exchange-bargain-rate-collector': {
    stats: { 3: { attack: -2, hp: -8 } },
    2: stage('A Whisper from the Hook', [on('strike', mend(1))]),
    3: stage('Everything Must Be Flesh', [on('enter', boss(3), mend(3))]),
  },
  // Arc: an overdue summons in polished brass -> it serves papers at the
  // door -> a writ of eviction for the whole block, paid in bounties.
  // Trajectory: STEADY (widens its arrival). Counterplay: armor shrugs off
  // the 2; spread thin fighters away from its alley.
  's2-exchange-golden-bailiff': {
    2: stage('Summons from the Deep', [on('enter', damage(2, 'across'))]),
    3: stage('The Emptying of Houses', [
      on('enter', damage(2, 'laneFoes')),
      on('kill', mend(2)),
    ]),
  },
  // Arc: two damage now, two owed -> the interest accrues to your vault ->
  // interest on interest: the bigger the debtor, the bigger the bill.
  // Trajectory: SITUATIONAL (anti-heavy). Counterplay: field cheap
  // fighters; a 1-play target only pays the base drain.
  's2-exchange-compound-interest-notice': {
    2: stage('The Hunger Accrues', [on('enter', boss(1), mend(1))]),
    3: stage('The Debt That Breeds', [
      on('enter', boss(1), mend(1), when('targetHeavy', boss(3))),
    ]),
  },
  // Arc: a harmless clause -> the rival finds the bill on page 37 -> the
  // amendment rewrites the deal: a rider for the crew, or fine print that
  // cuts through armor.
  // Trajectory: SITUATIONAL (choose one). Counterplay: kill the neighbors
  // before the rider lands; armor still blocks the target's first hit at L2.
  's2-exchange-contract-amendment': {
    2: stage('The Forbidden Thirty-Seventh Page', [on('enter', boss(1))]),
    3: stage('The Blood-Oath Rider', [on('enter', sharpen(1, 'adjacentAllies'))]),
    // Choose one: or the fine print, which lets one fighter cut through
    // armor. The CPU writes the rider when 2+ allies stand.
    choice: {
      stage: stage('Script Beneath the Skin', [on('enter', grant('pierce', 'target'))]),
      cpu: 'crowd',
    },
  },
  // Arc: a hidden parking fee -> the lien attaches to the boss's accounts
  // -> a lien on the whole block.
  // Trajectory: ROLE SHIFT (single bill to a block-wide charge).
  // Counterplay: scan it, or walk an armored fighter in: armor eats the 1.
  's2-exchange-invisible-lien': {
    2: stage('The Hook Takes Hold', [on('spring', boss(2))]),
    3: stage('The Hook Claims the Street', [
      on('spring', damage(1, 'laneFoes'), boss(1)),
    ]),
  },
  // Arc: the insurance pays out to someone dangerous -> claims are paid to
  // the boss -> the big payout: the policy funds the next wave.
  // Trajectory: PRICE (the payoff needs the wearer to fall). Counterplay:
  // stun the wearer and leave it standing, or finish the boss first.
  's2-exchange-executive-health-coverage': {
    2: stage('The Undertaker Pays', [on('death', mend(2))]),
    3: stage('The Beneficiary Below', [on('death', draw(2), mend(3))]),
  },
  // Arc: a junior agent who bills only real hits -> garnishes paychecks
  // into your vault -> garnishes at the source: every rival nearby is paid
  // less before it swings.
  // Trajectory: ROLE SHIFT (collector to suppressor). Counterplay: kill it
  // and the garnish ends; pierce and big hits still get through.
  's3-exchange-wage-garnisher': {
    2: stage('The Vein-Tithe', [on('hit', mend(1))]),
    3: stage('The Veins Run Dry', [on('hit', mend(1))], {
      hex: { n: 1, to: 'laneFoes' },
    }),
  },
  // Arc: a mortgaged bull in armor -> the down payment clears -> the loan
  // comes due: one crushing balloon payment, or thirty years of interest.
  // Trajectory: ROLE SHIFT (choose one: burst or clock). Counterplay: the
  // balloon is all at once, so race it; the long term dies with the bull.
  's3-exchange-mortgage-minotaur': {
    2: stage('The First Offering', [on('enter', mend(2))]),
    3: stage('The Great Devouring', [on('enter', boss(4))]),
    // Choose one: or the long term, thirty years of a slow drain every turn.
    // The CPU takes the balloon while foes stand to threaten the bull.
    choice: {
      stage: stage('A Thousand-Year Tithe', [on('turnStart', boss(1), mend(1))]),
      cpu: 'foesPresent',
    },
  },
  // Arc: a salaried accountant who fights for a living -> put on retainer
  // behind the bureau, billing hours instead of throwing punches -> the
  // termination clause: firing it costs the rival.
  // Trajectory: PRICE (from L2 it never strikes; the L3 payoff needs it to
  // fall). Counterplay: ignore it; a regenerating wall that never hits
  // back can be left standing while you win elsewhere.
  's3-exchange-retainer-clerk': {
    2: stage('The Vigil of the Nameless', [on('roundEnd', mend(1))], { pacifist: true }),
    3: stage('The Final Benediction', [on('death', boss(3))], {
      pacifist: true,
    }),
  },
  // Arc: an executive who invoices every strike -> freezes the assets
  // across the table -> total seizure: each knockout's assets join the firm.
  // Trajectory: LATE BLOOMER. Counterplay: deny knockouts with high-life or
  // armored blockers; the seized echoes are small.
  's3-exchange-seizure-executive': {
    2: stage('The Stillness of the Crypt', [], { hex: { n: 1, to: 'across' } }),
    3: stage('The Choir Takes Another', [on('kill', summon('nearest', 2, 2))]),
  },
  // Arc: a street enforcer -> every fighter it flattens pays protection
  // money -> the hostile takeover: one open door and the boss signs over
  // the deed, a bill paid out of both vaults at once.
  // Trajectory: EARNED ONE-SHOT (L3 needs an empty alley, and fires once).
  // Counterplay: always keep a blocker across it; the takeover happens
  // once, and a goon that never lands a knockout collects nothing.
  's3-exchange-hostile-takeover-goon': {
    2: stage('The Butcher\'s Protection', [on('kill', mend(1))]),
    3: stage('The Altar Changes Hands', [once('boss', boss(2), mend(2))]),
  },
  // Arc: a bank vault on legs -> its interest pays the boss every round ->
  // the vault opens and every neighbor gets a cut for good.
  // Trajectory: ROLE SHIFT (bank to patron). Counterplay: swarm it before
  // it lands, and keep its neighbors dead so the cut has nowhere to go.
  's3-exchange-golden-foreclosure': {
    2: stage('The Vault Begins to Breathe', [on('roundEnd', mend(1))]),
    3: stage('The Ossuary Opens', [on('enter', sharpen(1, 'adjacentAllies'))]),
  },
  // Arc: a polite envelope -> the second notice bills the boss -> sent to
  // collections: the whole crew swings this round.
  // Trajectory: ROLE SHIFT (removal to rally). Counterplay: blockers with
  // armor blunt the extra power; it lasts one round.
  's3-exchange-payment-reminder': {
    2: stage('The Second Knell', [on('enter', boss(1))]),
    3: stage('The Procession of Collectors', [on('enter', power(1, 'allies'))]),
  },
  // Arc: a two-part bill -> the overdue tempo play refunds a card -> cross
  // default: every neighbor of the debtor is billed too.
  // Trajectory: LATE BLOOMER. Counterplay: spread out; armor eats a chunk.
  's3-exchange-compound-notice': {
    2: stage('The Chapel Returns a Favor', [on('enter', draw(1))]),
    3: stage('The Plague of Debts', [on('enter', damage(2, 'adjacentFoes'))]),
  },
  // Arc: a loophole bonus -> a performance clause that pays per knockout ->
  // the posthumous bonus: the one fighter it "cannot help" comes back.
  // Trajectory: EARNED (L3 needs a fallen ally). Counterplay: keep the
  // Exchange's fighters alive-but-stunned; the echo is fragile.
  's3-exchange-executive-incentive': {
    2: stage('The Covenant of Knives', [on('enter', grant('collect', 'target'))]),
    3: stage('The Dead Collect Too', [on('enter', revive(2, 2))]),
  },
  // Arc: a suspicious severance package -> the terms add life for good ->
  // pick the payout: a platinum parachute for the fighter, or cash for the
  // boss.
  // Trajectory: SITUATIONAL (choose one). Counterplay: chip the rescued
  // fighter twice; the cash option leaves the fighter unprotected.
  's3-exchange-golden-parachute': {
    2: stage('Terms of the Last Breath', [on('enter', life(2, 'target'))]),
    3: stage('The Shroud of Gold', [on('enter', rescue('target'))]),
    // Choose one: or cash the package into the boss. The CPU buys the
    // parachute while a foe stands to threaten the fighter.
    choice: {
      stage: stage('Sell the Shroud', [on('enter', mend(3))]),
      cpu: 'foesPresent',
    },
  },
  // Arc: a clause that hands out COLLECT -> a hostile bid wounds the rival
  // across -> the corporate raid: the fighter shoves straight to the boss.
  // Trajectory: ROLE SHIFT (sniper to raider). Counterplay: leave its alley
  // empty or armored; bulldoze needs a knockout to carry over.
  's3-exchange-acquisition-clause': {
    2: stage('The Butcher\'s Bid', [on('enter', damage(2, 'across'))]),
    3: stage('The Night Procession', [on('enter', grant('bulldoze', 'target'))]),
  },
  // Arc: a late-fee sticker -> the fee is collected on the spot -> fees on
  // fees: the bigger the vehicle, the bigger the boot.
  // Trajectory: SITUATIONAL (anti-heavy). Counterplay: send a cheap
  // fighter in first; a scan voids every fee.
  's3-exchange-late-fee-sticker': {
    2: stage('The First Drop of Blood', [on('spring', mend(2))]),
    3: stage('The Blood Keeps Flowing', [
      on('spring', mend(2), when('targetHeavy', boss(3))),
    ]),
  },
  // Arc: a concealed escrow cord -> the funds are held for your boss ->
  // the escrow agent arrives in person to collect from the rooted debtor.
  // Trajectory: ROLE SHIFT (trap to recruiter). Counterplay: scan it; the
  // agent is a small echo that a real fighter brushes aside.
  's3-exchange-escrow-snare': {
    2: stage('The Sealed Reliquary', [on('spring', mend(1))]),
    3: stage('The Reliquary\'s Keeper', [on('spring', summon('nearest', 2, 2))]),
  },
  // Arc: a legal notice in the alley -> a flank clause that catches the
  // fighters trying to go around -> the repo truck hauls off the boss's
  // things.
  // Trajectory: STEADY (anti-flank, then a boss drain). Counterplay: scan
  // it; armored flankers shrug the 1.
  's3-exchange-repossession-notice': {
    2: stage('The Side Door to the Crypt', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('The Bone Cart', [on('spring', damage(1, 'adjacentFoes'), boss(2))]),
  },
  // Arc: courier greaves for the ledger runner -> paperwork moves first ->
  // hand-delivered debt: an open alley bills the boss at the door.
  // Trajectory: LATE BLOOMER (situational at L3). Counterplay: keep a
  // blocker across the wearer; ambush spends its edge on the first strike.
  's3-exchange-ledger-greaves': {
    2: stage('The Swiftest Funeral', [on('enter', grant('ambush', 'self'))]),
    3: stage('A Summons at the Door', [
      on('enter', grant('ambush', 'self')),
      on('boss', boss(2)),
    ]),
  },
  // Arc: a collection badge -> deputized: knockouts pay the boss -> the
  // marshal's badge: the whole street fights harder beside the wearer.
  // Trajectory: ROLE SHIFT (hunter to leader). Counterplay: kill the
  // wearer and the aura ends; keep its neighbors' alleys clear.
  's3-exchange-collection-badge': {
    2: stage('Anointed in Tallow', [on('kill', mend(2))]),
    3: stage(
      'Marshal of the Bone Tithe',
      [on('enter', grant('collect', 'adjacentAllies'))],
      { aura: { n: 1, to: 'adjacentAllies' } },
    ),
  },
}
