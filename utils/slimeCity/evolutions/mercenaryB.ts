// Crafted evolutions: mercenaryB (CLASH-EVOLUTION-PLAN.md in conductor). Each card is
// designed one at a time, story first, following evolutions/catgirls.ts.
// Mercenaries are wandering hired help: one weird city-life joke each, gentle
// numbers, and nothing that belongs to a single crew. This half is all
// spells, traps and gear, so every arc lives in what the card DOES (no
// stat curves). Choose-one level threes sit only on spells: a trap or a
// piece of gear keeps running its main stage after the play.
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
  once,
  pounce,
  power,
  rearm,
  rescue,
  retreat,
  revive,
  sharpen,
  stage,
  stun,
  summon,
  when,
  type CardEvolution,
} from './dsl'

export const MERCENARY_B_EVOLUTIONS: Record<string, CardEvolution> = {
  // Arc: a landlord fumigates the neighborhood -> the cedar closet keeps
  // your crew's coats safe from the cloud -> the whole block goes under:
  // fumigate every rival, or mothball your own wardrobe.
  // Trajectory: ROLE SHIFT into a choose-one (offense or shelter).
  // Counterplay: spread out so the splash and the closet both miss; the
  // shields end on the caster's next turn.
  'merc-mothball-storm': {
    levelOneText: 'A heavy cloud that drops a big fighter and dusts its flank.',
    2: stage('Cedar Closet', [on('enter', guard(2, 'adjacentAllies'))]),
    3: stage('Whole-Block Fumigation', [on('enter', damage(2, 'allFoes'))]),
    // Choose one: or seal the crew in mothballs. The CPU fumigates while its
    // own crew is mostly whole, else it shelters.
    choice: {
      stage: stage('Mothballed Wardrobe', [
        on('enter', guard(2, 'allies'), cleanse('allies')),
      ]),
      cpu: 'crewWhole',
    },
  },
  // Arc: a festival that forbids refunds -> the crowd surges and the
  // front row gets hurt but hyped -> the final encore, where everyone pays
  // and the rival boss pays most.
  // Trajectory: PRICE (your own crew takes the splash). Counterplay: kill
  // the hurt front row first; a thin rival crew makes the encore cheap.
  'merc-festival-no-refunds': {
    levelOneText: 'A cheap crowd crush for a lane of small fighters.',
    2: stage('Crowd Surge', [
      on('enter', damage(1, 'adjacentAllies'), power(2, 'adjacentAllies')),
    ]),
    3: stage('Final Encore, No Refunds', [
      on('enter', damage(1, 'allies'), damage(1, 'allFoes'), boss(3)),
    ]),
  },
  // Arc: one worker learns the shove -> the union local joins in -> the
  // general strike: everyone shoves, or the strike fund pays out.
  // Trajectory: SITUATIONAL (pays off with a crowd), choose-one at L3.
  // Counterplay: thin the crew first; bulldoze needs overkill, so big
  // blockers absorb the shove.
  'merc-union-solidarity': {
    levelOneText: "A shove that sends a fighter's overkill on to the boss.",
    2: stage('Union Local', [on('enter', grant('bulldoze', 'adjacentAllies'))]),
    3: stage('General Strike', [
      on(
        'enter',
        grant('bulldoze', 'allies'),
        when('crowd', power(1, 'allies')),
      ),
    ]),
    // Choose one: or pay out the strike fund. The CPU strikes with a crowd
    // on the field, else it banks the fund.
    choice: {
      stage: stage('Strike Fund', [on('enter', draw(1), mend(3))]),
      cpu: 'crowd',
    },
  },
  // Arc: the tiniest chime in the sewer -> its ring leaves the alley's ears
  // buzzing -> the echo chamber, where the chime answers itself.
  // Trajectory: ROLE SHIFT (alarm to crowd-maker). Counterplay: send a lone
  // runner into an empty block so nothing is beside it; the echoes are 1/2.
  'merc-glass-echo': {
    levelOneText: 'A one-cost chime that stalls the next intruder.',
    2: stage('Ringing Ears', [on('spring', stun('adjacentFoes'))]),
    3: stage('Echo Chamber', [on('spring', summon('neighbors', 1, 2))]),
  },
  // Arc: a hole under every postcard -> the gift shop sells whatever fell
  // in -> the whole tour group follows the guide down.
  // Trajectory: SITUATIONAL (L3 pays off against a crowded rival line).
  // Counterplay: scan it, or step in where no rival neighbors stand.
  'merc-tourist-trapdoor': {
    levelOneText: 'A cheap pit that cracks the next armored tourist.',
    2: stage('Gift Shop Exit', [on('spring', mend(2))]),
    3: stage('The Whole Tour Group', [
      on('spring', mend(2), damage(2, 'adjacentFoes')),
    ]),
  },
  // Arc: a hidden tollbooth -> surge pricing for the big rigs -> gridlock:
  // the toll lands on the boss and the queue behind stops dead.
  // Trajectory: SITUATIONAL (anti-heavy), then a jam. Counterplay: send a
  // cheap 1-play runner first; the jam lasts one strike.
  'merc-concealed-tollbooth': {
    levelOneText: 'A hidden toll that strips armor from the next arrival.',
    2: stage('Surge Pricing', [on('spring', when('targetHeavy', boss(3)))]),
    3: stage('Gridlock at the Gate', [
      on('spring', boss(2), stun('adjacentFoes')),
    ]),
  },
  // Arc: the all-you-can-eat sign flies -> leftovers land on your crew ->
  // it comes back around for seconds.
  // Trajectory: LATE BLOOMER (a heavy trap that springs twice at L3).
  // Counterplay: spring it with a token or cheap runner, twice; it heals
  // only allies beside it.
  'merc-boomerang-buffet': {
    levelOneText: 'A heavy trap built to flatten a mid-sized fighter.',
    2: stage('Buffet Line', [on('spring', heal(2, 'adjacentAllies'))]),
    3: stage('It Comes Back Around', [
      on('spring', heal(2, 'adjacentAllies'), rearm()),
    ]),
  },
  // Arc: an invisible speed bump -> the road crew puts out a cone wall ->
  // road works declare their own republic and barricade every open alley.
  // Trajectory: ROLE SHIFT (damage to defense). Counterplay: the cones never
  // strike; splash and area damage clear them, and full alleys get none.
  'merc-invisible-bump': {
    levelOneText: 'A cheap bump that slows and stings the next runner.',
    2: stage('Cone Zone', [on('spring', summon('nearest', 0, 3))]),
    3: stage('Road Works Republic', [on('spring', summon('everyEmpty', 0, 2))]),
  },
  // Arc: a tripwire between market stalls -> the victim drops its bargains
  // -> everything must go, and the crew next door kits up.
  // Trajectory: STEADY into a SITUATIONAL L3 (needs allies beside it).
  // Counterplay: scan it, or trip it where no ally of the setter stands.
  'merc-market-tripwire': {
    levelOneText:
      'A stall wire that trips the next fighter and cuts its guard.',
    2: stage('Dropped Bargains', [on('spring', draw(1))]),
    3: stage('Everything Must Go', [
      on('spring', draw(1), sharpen(1, 'adjacentAllies')),
    ]),
  },
  // Arc: one flooded socket -> the puddle goes live next door -> ten blocks
  // dark: every rival is shocked, and your own crew feels it too.
  // Trajectory: PRICE (the blackout zaps your crew). Counterplay: spread
  // thin so the puddle misses; punish the setter's hurt crew after.
  'merc-flooded-fusebox': {
    levelOneText: 'A five-cost shock that can drop a big arriving fighter.',
    2: stage('Live Puddle', [on('spring', damage(2, 'adjacentFoes'))]),
    3: stage('Ten-Block Blackout', [
      on('spring', damage(2, 'allFoes'), damage(1, 'allies')),
    ]),
  },
  // Arc: a hostile meter -> it writes a ticket and pockets the coins ->
  // clamped and towed: the victim cannot move and the boss pays the fine.
  // Trajectory: LATE BLOOMER (small boss swing that grows into a lockdown).
  // Counterplay: scan it; the clamp lasts one strike.
  'merc-parking-meter': {
    levelOneText: 'A cheap meter that defuses the next volatile arrival.',
    2: stage('Ticketed', [on('spring', boss(1), mend(1))]),
    3: stage('Clamped and Towed', [
      on('spring', stun('target'), boss(2), mend(2)),
    ]),
  },
  // Arc: a discarded war manual -> the footnotes are shrapnel -> required
  // reading: the blast teaches you something.
  // Trajectory: STEADY (the file's one plain scaler). Counterplay: scan it,
  // or step in with no neighbors.
  'merc-dog-eared-mine': {
    levelOneText: 'A heavy mine that wounds the next fighter and stalls it.',
    2: stage('Footnote Shrapnel', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Required Reading', [
      on('spring', damage(2, 'adjacentFoes'), draw(1)),
    ]),
  },
  // Arc: a detour sign planned by a vengeful committee -> its curse wanders
  // the block -> the committee convenes and condemns the biggest name.
  // Trajectory: ROLE SHIFT (alley trap to a curse that finds the strongest).
  // Counterplay: keep no single star; the curse lands on your toughest
  // fighter, so give it life to spare.
  'merc-cursed-sign': {
    levelOneText: 'A one-cost curse that dents the next fighter in.',
    2: stage('Wandering Curse', [on('spring', damage(2, 'weakestFoe'))]),
    3: stage('The Committee Convenes', [
      on('spring', damage(3, 'strongestFoe'), boss(1)),
    ]),
  },
  // Arc: foreclosed land bites back -> a restless tenant crawls out -> the
  // ghouls come to collect, feeding as they fight.
  // Trajectory: LATE BLOOMER (a trap that leaves bodies). Counterplay: full
  // alleys beside it leave the ghouls nowhere to rise; they are only 2/2.
  'merc-ghoul-et-lot': {
    levelOneText: 'A guarded lot that bites whoever claims it next.',
    2: stage('Restless Tenant', [on('spring', summon('nearest', 2, 2))]),
    3: stage('The Ghouls Collect', [
      on('spring', summon('neighbors', 2, 2, ['leech'])),
    ]),
  },
  // Arc: never ask about the bag -> it tears and the bees scatter -> the
  // queen's grudge: the whole block is stung still.
  // Trajectory: LATE BLOOMER (a big L3 moment). Counterplay: scan it; the
  // stun lasts one strike, so hold your best striker back a turn.
  'merc-angry-bees': {
    levelOneText: 'A bag of bees that stings the next fighter off its swing.',
    2: stage('Bees Everywhere', [
      on('spring', damage(1, 'weakestFoe'), damage(1, 'strongestFoe')),
    ]),
    3: stage("The Queen's Grudge", [
      on('spring', damage(1, 'allFoes'), stun('laneFoes')),
    ]),
  },
  // Arc: borrowed kneepads -> passed down when the wearer falls -> a family
  // heirloom that toughens the whole alley.
  // Trajectory: PRICE (the payoff needs the wearer to fall). Counterplay:
  // stun the wearer instead of killing it, or kill its neighbors first.
  'merc-borrowed-kneepads': {
    levelOneText: 'One-cost pads that blunt chip damage on a frontliner.',
    2: stage('Pass It Down', [on('death', armor(1, 'woundedAlly'))]),
    3: stage('Family Heirloom', [
      on('death', armor(1, 'adjacentAllies'), life(2, 'adjacentAllies')),
    ]),
  },
  // Arc: the squeaky wheel -> gets the oil every night -> runs the
  // complaint department, and the rival across is too annoyed to aim.
  // Trajectory: ROLE SHIFT (to a durable annoyance). Counterplay: burst the
  // wearer in one round; the heal only lands at round end.
  'merc-squeaky-wheel': {
    levelOneText: 'A cheap wheel that gives a runner a permanent edge.',
    2: stage('Gets the Oil', [on('roundEnd', heal(2, 'self'))]),
    3: stage('Complaint Department', [on('roundEnd', heal(2, 'self'))], {
      hex: { n: 1, to: 'across' },
    }),
  },
  // Arc: armor you can eat -> the wearer snacks on it once when the night
  // gets long -> the potluck, where everyone gets a bite.
  // Trajectory: ROLE SHIFT (selfish snack to shared meal). Counterplay: the
  // snack only lands at round end, so finish the wearer before it; the
  // potluck heals only what is already hurt.
  'merc-edible-kevlar': {
    levelOneText: 'Gear that lets any fighter freeze the rivals it hits.',
    2: stage('Midnight Snack', [once('roundEnd', heal(3, 'self'))]),
    3: stage('Kevlar Potluck', [
      on('enter', heal(2, 'allies'), guard(1, 'adjacentAllies')),
    ]),
  },
  // Arc: cardboard wings and confidence -> a glide over an empty alley ->
  // the emergency exit: one dive at the boss, then gone to try again.
  // Trajectory: PRICE (the L3 dive leaves the board). Counterplay: the
  // wearer is gone after the dive; block every alley at L2.
  'merc-emergency-wings': {
    levelOneText: 'Wings that make a fighter stronger beside its crew.',
    2: stage('Gliding In', [on('enter', when('acrossEmpty', pounce()))]),
    3: stage('Emergency Exit', [on('enter', pounce(), retreat())]),
  },
  // Arc: scissors for the paperwork -> they snip a stuck fighter loose ->
  // the grand ribbon-cutting frees and fires up the whole crew.
  // Trajectory: SITUATIONAL (best against stuns). Counterplay: do not
  // bother stunning; the surge lasts one round.
  'merc-red-tape-scissors': {
    levelOneText: 'Scissors that let a fighter cut through armored walls.',
    2: stage('Snip the Forms', [
      on('enter', cleanse('self'), cleanse('adjacentAllies')),
    ]),
    3: stage('Grand Ribbon-Cutting', [
      on('enter', cleanse('allies'), power(1, 'allies')),
    ]),
  },
  // Arc: a whole clinic in one locked case -> house calls up and down the
  // alley -> the case opens and the neighbors get their own kits.
  // Trajectory: ROLE SHIFT (self-care to street clinic). Counterplay: kill
  // the wearer before round end; regen is slow against focused damage.
  'merc-theftproof-toolkit': {
    levelOneText: 'A locked kit that keeps one fighter healing every round.',
    2: stage('House Calls', [on('roundEnd', heal(1, 'adjacentAllies'))]),
    3: stage('Clinic in a Case', [
      on('enter', grant('regen', 'adjacentAllies')),
      on('roundEnd', heal(1, 'adjacentAllies')),
    ]),
  },
  // Arc: a forged permission slip -> laminated, it grows with every
  // knockout -> diplomatic immunity: the first fatal blow bounces off.
  // Trajectory: LATE BLOOMER. Counterplay: chip it twice instead of one
  // big hit; armored blockers deny the knockouts.
  'merc-counterfeit-license': {
    levelOneText: 'A forged permit that marks your lead fighter for growth.',
    2: stage('Laminated', [on('kill', sharpen(1, 'self'))]),
    3: stage('Diplomatic Immunity', [
      on('enter', rescue('self')),
      on('kill', sharpen(1, 'self')),
    ]),
  },
  // Arc: every ledge marked -> the map shows a card's worth of shortcuts
  // -> shared with the neighbors, the whole block drops in at once.
  // Trajectory: ROLE SHIFT (solo ambusher to group ambush). Counterplay:
  // ambush is one first strike; block with high-life fighters.
  'merc-rooftop-map': {
    levelOneText: 'A map that lets a new fighter strike the moment it lands.',
    2: stage('Marked Ledges', [on('enter', draw(1))]),
    3: stage('Every Rooftop Known', [
      on('enter', draw(1), grant('ambush', 'adjacentAllies')),
    ]),
  },
  // Arc: an obsolete saint's halo -> its grace spills onto the neighbors ->
  // when the wearer falls, the halo works one last miracle.
  // Trajectory: EARNED ONE-SHOT (the miracle needs the wearer to fall and
  // someone to bring back). The L3 halo keeps spilling its L2 grace on
  // every landed hit while the wearer lives; the miracle (the echo) is the
  // extra payoff, not a replacement. The old death-time crew heal was
  // traded for the kept grace so the face stays legible and the L3 budget
  // stays flat. Counterplay: stun the wearer instead of killing it, which
  // denies both the grace and the miracle; the echo is fragile.
  'merc-broken-halo': {
    levelOneText: 'A halo that heals its wearer with every landed hit.',
    2: stage('Second-Hand Grace', [on('hit', heal(1, 'adjacentAllies'))]),
    3: stage('One Last Miracle', [
      on('hit', heal(1, 'adjacentAllies')),
      on('death', revive(2, 3)),
    ]),
  },
  // Arc: collective long underwear -> flannel layers against the cold ->
  // the shop steward, organizing the alley around it.
  // Trajectory: ROLE SHIFT (bruiser to organizer). Counterplay: kill its
  // neighbors; the shield ends on its turn.
  'merc-union-suit': {
    levelOneText: "Long johns that push a big hitter's overkill into the boss.",
    2: stage('Flannel Layers', [on('turnStart', guard(1, 'self'))]),
    3: stage('Shop Steward', [on('turnStart', guard(1, 'self'))], {
      aura: { n: 1, to: 'adjacentAllies' },
    }),
  },
}
