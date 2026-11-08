// MEAT EXCHANGE: the city's bank, butcher and bailiff. Their evolutions turn
// every exchange into a transfer: the rival boss pays, your boss collects,
// knockouts pay bounties and interest compounds at round end.
import {
  armor,
  boss,
  cleanse,
  damage,
  draw,
  grant,
  guard,
  heal,
  life,
  mend,
  on,
  power,
  sharpen,
  stage,
  stun,
  summon,
  type CardEvolution,
} from './dsl'

export const EXCHANGE_EVOLUTIONS: Record<string, CardEvolution> = {
  'audit-fiend': {
    2: stage('Line-Item Fiend', [on('hit', boss(1))]),
    3: stage('Forensic Audit', [
      on('enter', damage(2, 'weakestFoe'), boss(2), mend(2)),
      on('hit', boss(1)),
    ]),
  },
  'debt-holiday': {
    2: stage('Payment Deferral', [on('enter', mend(2))]),
    3: stage('Jubilee Year', [
      on('enter', mend(4), heal(2, 'allies'), cleanse('allies')),
    ]),
  },
  's1-executive-repo': {
    2: stage('Repo Truck', [on('kill', mend(2))]),
    3: stage('Repossess Everything', [
      on('enter', damage(3, 'across'), boss(1), mend(2)),
      on('kill', mend(2)),
    ]),
  },
  's1-guild-clerk': {
    2: stage('Overtime Clerk', [on('roundEnd', mend(1))]),
    3: stage('Senior Partner', [
      on('enter', draw(1), guard(2, 'adjacentAllies')),
      on('roundEnd', mend(1), boss(1)),
    ]),
  },
  's1-margin-call': {
    2: stage('Called In', [on('enter', boss(2))]),
    3: stage('Market Crash', [
      on('enter', boss(3), mend(3), stun('strongestFoe')),
    ]),
  },
  's1-buy-silence': {
    2: stage('Hush Fund', [on('enter', mend(1), draw(1))]),
    3: stage('Buy the Whole Block', [on('enter', stun('laneFoes'), mend(2))]),
  },
  's1-debt-garnish': {
    2: stage('Wage Lien', [on('spring', boss(1), mend(1))]),
    3: stage('Garnish the Whole Crew', [
      on('spring', damage(1, 'allFoes'), boss(2), mend(2)),
    ]),
  },
  's1-golden-handshake': {
    2: stage('Signing Bonus', [on('kill', mend(2))]),
    3: stage('Golden Parachute Grip', [
      on('enter', life(3, 'self'), armor(1, 'self')),
      on('hit', boss(1), mend(1)),
    ]),
  },
  's2-exchange-bargain-rate-collector': {
    2: stage('Polite Reminder', [on('hit', boss(1))]),
    3: stage('Collections Department', [
      on('enter', summon('neighbors', 1, 3, ['collect'])),
      on('hit', boss(1)),
    ]),
  },
  's2-exchange-golden-bailiff': {
    2: stage('Brass Summons', [on('kill', boss(2))]),
    3: stage('Court-Ordered Eviction', [
      on('enter', stun('laneFoes'), boss(2)),
    ]),
  },
  's2-exchange-compound-interest-notice': {
    2: stage('Second Notice', [on('enter', boss(1))]),
    3: stage('Interest on the Interest', [
      on('enter', damage(1, 'allFoes'), boss(3)),
    ]),
  },
  's2-exchange-contract-amendment': {
    2: stage('Fine Print', [on('enter', life(2, 'target'))]),
    3: stage('Rewritten Charter', [on('enter', sharpen(1, 'allies'), mend(2))]),
  },
  's2-exchange-invisible-lien': {
    2: stage('Hidden Fees', [on('spring', mend(2))]),
    3: stage('Lien on Everything', [
      on('spring', stun('target'), boss(3), mend(3)),
    ]),
  },
  's2-exchange-executive-health-coverage': {
    2: stage('Premium Plan', [on('turnStart', heal(1, 'self'))]),
    3: stage('Platinum Coverage', [
      on('enter', life(3, 'self'), guard(2, 'self')),
      on('turnStart', heal(2, 'self')),
    ]),
  },
  's3-exchange-wage-garnisher': {
    2: stage('Payroll Skim', [on('hit', mend(1))]),
    3: stage('Garnish Every Paycheck', [
      on('enter', boss(2), mend(2)),
      on('hit', boss(1), mend(1)),
    ]),
  },
  's3-exchange-mortgage-minotaur': {
    2: stage('Balloon Payment', [on('kill', boss(2))]),
    3: stage('Labyrinth of Debt', [
      on('enter', damage(2, 'laneFoes')),
      on('kill', mend(2)),
    ]),
  },
  's3-exchange-retainer-clerk': {
    2: stage('On Retainer', [on('roundEnd', mend(1))]),
    3: stage('Billable Hours', [
      on('enter', mend(3), draw(1)),
      on('roundEnd', mend(1)),
    ]),
  },
  's3-exchange-seizure-executive': {
    2: stage('Asset Seizure', [on('hit', sharpen(1, 'self'))]),
    3: stage('Hostile Liquidation', [
      on('enter', damage(3, 'strongestFoe'), boss(2)),
      on('kill', mend(3)),
    ]),
  },
  's3-exchange-hostile-takeover-goon': {
    2: stage('Muscle for Hire', [on('kill', sharpen(1, 'self'))]),
    3: stage('Takeover Squad', [
      on('enter', summon('neighbors', 2, 2, ['collect'])),
    ]),
  },
  's3-exchange-golden-foreclosure': {
    2: stage('Vault Door', [on('roundEnd', boss(1))]),
    3: stage('Foreclosure Engine Online', [on('enter', boss(3), mend(3))]),
  },
  's3-exchange-payment-reminder': {
    2: stage('Firmly Worded Reminder', [on('enter', stun('target'))]),
    3: stage('Collections Agency Visit', [
      on('enter', damage(2, 'adjacentFoes'), boss(2), mend(1)),
    ]),
  },
  's3-exchange-compound-notice': {
    2: stage('Overdue Stamp', [on('enter', mend(2))]),
    3: stage('Compound Catastrophe', [
      on('enter', damage(2, 'allFoes'), boss(2)),
    ]),
  },
  's3-exchange-executive-incentive': {
    2: stage('Stock Options', [on('enter', life(2, 'target'))]),
    3: stage('C-Suite Bonus Round', [
      on('enter', sharpen(1, 'allies'), power(1, 'allies')),
    ]),
  },
  's3-exchange-golden-parachute': {
    2: stage('Silver Lining', [on('enter', guard(2, 'target'))]),
    3: stage('Platinum Parachute', [on('enter', heal(3, 'allies'), mend(4))]),
  },
  's3-exchange-acquisition-clause': {
    2: stage('Due Diligence', [on('enter', power(2, 'target'))]),
    3: stage('Leveraged Buyout', [
      on('enter', grant('collect', 'allies'), boss(2)),
    ]),
  },
  's3-exchange-late-fee-sticker': {
    2: stage('Double Late Fee', [on('spring', boss(1))]),
    3: stage('Sticker Shock', [on('spring', stun('laneFoes'), boss(2))]),
  },
  's3-exchange-escrow-snare': {
    2: stage('Escrow Hold', [on('spring', mend(2))]),
    3: stage('Escrow Seizure', [
      on('spring', damage(2, 'target'), boss(2), mend(2)),
    ]),
  },
  's3-exchange-repossession-notice': {
    2: stage('Tow-Away Zone', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Repossess the Street', [
      on('spring', damage(2, 'laneFoes'), mend(3)),
    ]),
  },
  's3-exchange-ledger-greaves': {
    2: stage('Fast Paperwork', [on('turnStart', mend(1))]),
    3: stage('Quarterly Report', [
      on('enter', draw(1), power(2, 'self')),
      on('boss', mend(2)),
    ]),
  },
  's3-exchange-collection-badge': {
    2: stage('Deputized', [on('kill', mend(2))]),
    3: stage('Badge of the Exchange', [
      on('enter', sharpen(2, 'self'), boss(2)),
      on('hit', mend(1)),
    ]),
  },
}
