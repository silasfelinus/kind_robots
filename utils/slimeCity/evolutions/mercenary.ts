// MERCENARIES: the city's freelancers, hireable by any crew. Their
// evolutions are each one weird joke followed all the way through. Kept a
// notch gentler than faction cards because every deck can hire them.
import {
  armor,
  boss,
  chance,
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

export const MERCENARY_EVOLUTIONS: Record<string, CardEvolution> = {
  'merc-sewer-sommelier': {
    2: stage('Vintage Drainwater', [on('hit', heal(1, 'adjacentAllies'))]),
    3: stage('Grand Cru Tasting', [
      on('enter', heal(2, 'allies'), damage(1, 'across')),
    ]),
  },
  'merc-skate-taxidermist': {
    2: stage('Roller Rink Exhibit', [], { pack: 1 }),
    3: stage(
      'Museum on Wheels',
      [on('enter', summon('neighbors', 1, 2, ['swarm']))],
      { pack: 1 },
    ),
  },
  'merc-auction-golem': {
    2: stage('Going Once', [on('kill', mend(2))]),
    3: stage('Sold to the Highest Bidder', [
      on('enter', stun('across'), armor(1, 'self'), mend(2)),
    ]),
  },
  'merc-spark-midwife': {
    2: stage('Delivery of Sparks', [
      on('death', summon('nearest', 2, 2, ['volatile'])),
    ]),
    3: stage('Labor of Lightning', [
      on('enter', summon('neighbors', 1, 2, ['volatile'])),
      on('death', damage(2, 'laneFoes')),
    ]),
  },
  'merc-traffic-witch': {
    2: stage('Yellow Light Hex', [], { hex: { n: 1, to: 'across' } }),
    3: stage('Gridlock Curse', [on('enter', stun('laneFoes'))]),
  },
  'merc-picket-troll': {
    2: stage('Hold the Line', [on('turnStart', guard(1, 'adjacentAllies'))]),
    3: stage('Nobody Crosses the Picket', [
      on('enter', guard(2, 'allies'), stun('across')),
    ]),
  },
  'merc-escape-crab': {
    2: stage('Sideways Exit', [
      on('death', summon('nearest', 1, 3, ['ambush'])),
    ]),
    3: stage('Seventeenth Escape', [
      on('enter', damage(2, 'weakestFoe')),
      on('death', summon('nearest', 2, 3, ['ambush'])),
    ]),
  },
  'merc-living-scaffold': {
    2: stage('Load-Bearing Smile', [
      on('turnStart', guard(1, 'adjacentAllies')),
    ]),
    3: stage('The Building Unionizes', [
      on('enter', summon('neighbors', 1, 4), armor(1, 'adjacentAllies')),
    ]),
  },
  'merc-invisible-mime': {
    2: stage('Invisible Wall', [on('turnStart', guard(1, 'self'))]),
    3: stage('Invisible Piano', [
      on('enter', damage(3, 'across'), stun('across')),
    ]),
  },
  'merc-midnight-janitor': {
    2: stage('Mop Up', [on('kill', heal(2, 'self'))]),
    3: stage('Clean Sweep', [
      on('enter', damage(1, 'allFoes', true)),
      on('kill', heal(2, 'self')),
    ]),
  },
  'merc-misaddressed-parcel': {
    2: stage('Return to Sender', [on('enter', damage(1, 'across'))]),
    3: stage('Mystery Box', [
      on('enter', heal(2, 'allies'), chance(50, draw(1)), chance(50, mend(3))),
    ]),
  },
  'merc-crowd-lightning': {
    2: stage('Petition Gains Traction', [
      on('enter', damage(1, 'adjacentFoes')),
    ]),
    3: stage('Referendum of Thunder', [
      on('enter', damage(1, 'allFoes'), boss(2)),
    ]),
  },
  'merc-unofficial-detour': {
    2: stage('Detour Ahead', [on('enter', stun('adjacentFoes'))]),
    3: stage('Road Closed Indefinitely', [
      on('enter', stun('laneFoes'), damage(1, 'laneFoes')),
    ]),
  },
  'merc-reputation-laundry': {
    2: stage('Spotless Record', [
      on('enter', cleanse('target'), heal(2, 'target')),
    ]),
    3: stage('Celebrity Endorsement', [
      on('enter', armor(1, 'adjacentAllies'), guard(1, 'allies')),
    ]),
  },
  'merc-flashmob-diversion': {
    2: stage('Spontaneous Dance-Off', [
      on('enter', power(1, 'adjacentAllies')),
    ]),
    3: stage('Flashmob Uprising', [
      on('enter', summon('everyEmpty', 1, 1, ['swarm'])),
    ]),
  },
  'merc-jury-rigged-radar': {
    2: stage('Blip on the Screen', [on('enter', draw(1))]),
    3: stage('Full-Spectrum Sweep', [
      on('enter', draw(1), stun('strongestFoe')),
    ]),
  },
  'merc-allergy-season': {
    2: stage('Hay Fever', [on('enter', chance(50, stun('randomFoe')))]),
    3: stage('Pollen Apocalypse', [
      on('enter', damage(1, 'allFoes'), chance(50, stun('allFoes'))),
    ]),
  },
  'merc-supervised-demo': {
    2: stage('Permit Approved', [on('enter', guard(1, 'allies'))]),
    3: stage('Controlled Implosion', [
      on('enter', damage(2, 'laneFoes'), boss(2)),
    ]),
  },
  'merc-unsupervised-demo': {
    2: stage('Hold My Drink', [
      on('enter', chance(50, damage(2, 'randomFoe'))),
    ]),
    3: stage('Nobody Read the Blueprints', [
      on('enter', damage(2, 'allFoes'), chance(50, damage(1, 'allies'))),
    ]),
  },
  'merc-mortgage-holiday': {
    2: stage('Extended Holiday', [on('enter', mend(2))]),
    3: stage('Permanent Vacation', [on('enter', boss(2), mend(3))]),
  },
  'merc-secondhand-halo': {
    2: stage('Warm Halo', [on('enter', heal(2, 'target'))]),
    3: stage('Miracle Shop Clearance', [
      on('enter', grant('regen', 'adjacentAllies'), heal(2, 'allies')),
    ]),
  },
  'merc-take-stairs': {
    2: stage('Two at a Time', [on('enter', grant('ambush', 'target'))]),
    3: stage('Parkour Up the Tower', [
      on('enter', power(3, 'target'), cleanse('target'), draw(1)),
    ]),
  },
  'merc-streetlight-confession': {
    2: stage('Tell Me Everything', [on('enter', draw(1))]),
    3: stage('Confession Under Neon', [
      on('enter', sharpen(1, 'adjacentAllies'), stun('across')),
    ]),
  },
  'merc-homebrew-antidote': {
    2: stage('Fourth Warning Label', [on('enter', cleanse('allies'))]),
    3: stage('Miracle Moonshine', [
      on('enter', heal(2, 'allies'), life(2, 'target')),
    ]),
  },
  'merc-whisper-network': {
    2: stage('Rumor Mill', [on('enter', stun('target'))]),
    3: stage('Viral Scandal', [on('enter', damage(1, 'allFoes'), boss(2))]),
  },
  'merc-mothball-storm': {
    2: stage('Choking Cloud', [on('enter', stun('adjacentFoes'))]),
    3: stage('Fumigate the District', [
      on('enter', damage(2, 'allFoes'), stun('target')),
    ]),
  },
  'merc-festival-no-refunds': {
    2: stage('All Sales Final', [on('enter', mend(2))]),
    3: stage('Festival Riot Clearance', [
      on('enter', damage(1, 'allFoes'), power(1, 'allies')),
    ]),
  },
  'merc-union-solidarity': {
    2: stage('Strength in Numbers', [on('enter', guard(1, 'adjacentAllies'))]),
    3: stage('Solidarity Forever', [
      on('enter', grant('bulldoze', 'allies'), guard(1, 'allies')),
    ]),
  },
  'merc-glass-echo': {
    2: stage('Echoing Chime', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Shattering Resonance', [on('spring', damage(2, 'laneFoes'))]),
  },
  'merc-tourist-trapdoor': {
    2: stage('Souvenir Spikes', [on('spring', stun('target'))]),
    3: stage('Tour Group Plunge', [
      on('spring', damage(2, 'adjacentFoes'), stun('laneFoes')),
    ]),
  },
  'merc-concealed-tollbooth': {
    2: stage('Toll Increase', [on('spring', boss(1))]),
    3: stage('Express Lane Ambush', [on('spring', stun('laneFoes'), boss(2))]),
  },
  'merc-boomerang-buffet': {
    2: stage('Second Helping', [on('spring', damage(2, 'randomFoe'))]),
    3: stage('Boomerangs All the Way Down', [
      on('spring', damage(2, 'allFoes')),
    ]),
  },
  'merc-invisible-bump': {
    2: stage('Speed Hump Network', [on('spring', stun('adjacentFoes'))]),
    3: stage('The Road Rebels', [on('spring', damage(2, 'laneFoes'), mend(2))]),
  },
  'merc-market-tripwire': {
    2: stage('Two Ankles for One', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Midnight Clearance Sale', [
      on('spring', stun('laneFoes'), mend(2)),
    ]),
  },
  'merc-flooded-fusebox': {
    2: stage('Arcing Puddles', [on('spring', stun('adjacentFoes'))]),
    3: stage('Ten-Block Blackout', [
      on('spring', damage(2, 'allFoes'), stun('target')),
    ]),
  },
  'merc-parking-meter': {
    2: stage('Expired Meter', [on('spring', boss(1), mend(1))]),
    3: stage('Towed and Impounded', [
      on('spring', stun('target'), boss(2), mend(2)),
    ]),
  },
  'merc-dog-eared-mine': {
    2: stage('Page Two Shrapnel', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('The Whole Manual Goes Off', [
      on('spring', damage(2, 'laneFoes'), boss(2)),
    ]),
  },
  'merc-cursed-sign': {
    2: stage('Wrong Way Curse', [on('spring', stun('target'))]),
    3: stage('Every Road Leads Here', [
      on('spring', stun('laneFoes'), damage(1, 'laneFoes')),
    ]),
  },
  'merc-ghoul-et-lot': {
    2: stage('Hungry Lot', [on('spring', mend(2))]),
    3: stage('Ghoul Rush', [on('spring', summon('nearest', 2, 3), boss(2))]),
  },
  'merc-angry-bees': {
    2: stage('Even Angrier Bees', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('The Hive Remembers', [
      on('spring', damage(1, 'allFoes'), stun('laneFoes')),
    ]),
  },
  'merc-borrowed-kneepads': {
    2: stage('Broken-In Pads', [on('turnStart', guard(1, 'self'))]),
    3: stage('Hand-Me-Down Heirloom', [
      on('enter', life(3, 'self'), guard(1, 'adjacentAllies')),
    ]),
  },
  'merc-squeaky-wheel': {
    2: stage('Gets the Oil', [on('turnStart', heal(1, 'self'))]),
    3: stage('Squeakiest Wheel in Town', [
      on('enter', power(2, 'self'), draw(1), mend(2)),
    ]),
  },
  'merc-edible-kevlar': {
    2: stage('Second Helping of Armor', [on('enter', guard(2, 'self'))]),
    3: stage('Armor Buffet', [on('enter', armor(1, 'self'), stun('across'))], {
      bully: 1,
    }),
  },
  'merc-emergency-wings': {
    2: stage('Flapping Confidence', [], { lone: 1 }),
    3: stage('Cardboard Ascension', [
      on(
        'enter',
        power(2, 'self'),
        grant('ambush', 'self'),
        damage(1, 'across'),
      ),
    ]),
  },
  'merc-red-tape-scissors': {
    2: stage('Snip Snip', [on('hit', damage(1, 'target', true))]),
    3: stage('Cut Through Everything', [
      on('enter', sharpen(1, 'self'), damage(2, 'across', true)),
    ]),
  },
  'merc-theftproof-toolkit': {
    2: stage('Field Kit', [on('roundEnd', heal(1, 'adjacentAllies'))]),
    3: stage('Clinic in a Case', [
      on('enter', heal(3, 'allies')),
      on('roundEnd', heal(1, 'adjacentAllies')),
    ]),
  },
  'merc-counterfeit-license': {
    2: stage('Expired Permit', [on('kill', sharpen(1, 'self'))]),
    3: stage('License to Wreck', [
      on('enter', sharpen(2, 'self'), damage(1, 'adjacentFoes')),
    ]),
  },
  'merc-rooftop-map': {
    2: stage('Marked Ledges', [on('enter', draw(1))]),
    3: stage('Every Rooftop Ours', [
      on('enter', grant('ambush', 'adjacentAllies'), power(1, 'allies')),
    ]),
  },
  'merc-broken-halo': {
    2: stage('Flickering Grace', [on('hit', heal(1, 'adjacentAllies'))]),
    3: stage('Halo Restored', [
      on('enter', heal(2, 'allies'), mend(2)),
      on('hit', heal(1, 'adjacentAllies')),
    ]),
  },
  'merc-union-suit': {
    2: stage('Collective Padding', [on('turnStart', guard(1, 'self'))]),
    3: stage('Suit of Solidarity', [
      on('enter', armor(1, 'self'), guard(1, 'adjacentAllies')),
      on('kill', boss(2)),
    ]),
  },
}
