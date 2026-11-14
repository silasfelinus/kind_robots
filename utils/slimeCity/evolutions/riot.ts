// Crafted evolutions: riot (CLASH-EVOLUTION-PLAN.md in conductor). Each card is
// designed one at a time, story first, following evolutions/catgirls.ts.
// Anarkiss owns seeded gambles, showstopping exits (last-breath blasts) and friendly
// fire; they never heal or armor up. Riot already leads CPU sweeps, so their
// level threes win with decisions and moments, and most carry a price paid by
// their own side.
import {
  boss,
  chance,
  damage,
  duel,
  grant,
  on,
  once,
  power,
  rearm,
  retreat,
  sharpen,
  stage,
  stun,
  summon,
  when,
  type CardEvolution,
} from './dsl'

export const RIOT_EVOLUTIONS: Record<string, CardEvolution> = {
  // ---------------------------------------------------------------- fighters
  // Arc: a stunt diver whose safety briefing is a countdown -> the fuse
  // burns while she climbs the high board -> she becomes the firework.
  // Trajectory: PRICE. L2 burns her and her neighbors a little each turn
  // for power (park her alone); L3 only pays when she falls, scorches her
  // neighbors for 2, and is a coin flip. (A +2 countdown with no friendly
  // fire cost Riot ~2 points in CPU sweeps; the burn is now shared.)
  // Counterplay: stun her and leave her standing; kill her when your
  // fighters are healthy enough to shrug off 2.
  'spark-diver': {
    2: stage('Countdown Briefing', [
      on(
        'turnStart',
        damage(1, 'self'),
        damage(1, 'adjacentAllies'),
        power(1, 'self'),
      ),
    ]),
    3: stage('Human Firework', [
      on(
        'death',
        damage(2, 'adjacentAllies'),
        chance(50, damage(2, 'allFoes')),
      ),
    ]),
  },
  // Arc: a mime who never speaks, only lights a fuse -> the silent bang
  // that takes a neighbor with him -> he lights every fuse in the crew.
  // Trajectory: ROLE SHIFT (brawler, then martyr, then fuse-lighter for the
  // whole crew). Counterplay: VOLATILE only hurts the foe across, so spread
  // out against his crew; the match burns his own neighbors on arrival.
  's1-mime-fuse': {
    2: stage('Silent Fuse', [
      on('death', damage(1, 'adjacentFoes'), damage(1, 'adjacentAllies')),
    ]),
    3: stage('Lights Every Fuse', [
      on('enter', grant('volatile', 'allies'), damage(1, 'adjacentAllies')),
    ]),
  },
  // Arc: a demolitions PhD -> field tests on the losers -> the grand unified
  // blast, a thesis that levels the whole street.
  // Trajectory: ROLE SHIFT (knockout splasher, then a doomsday device whose
  // last breath hits both crews alike). Counterplay: never kill him while
  // your side is wider; stun him and leave him alive.
  's1-blast-radius': {
    2: stage('Field Test', [
      on('kill', damage(2, 'adjacentFoes')),
      on('tap', damage(1, 'adjacentFoes')),
    ]),
    3: stage('Grand Unified Blast', [
      on('death', damage(2, 'allFoes'), damage(2, 'allies')),
      on('tap', damage(2, 'adjacentFoes')),
    ]),
  },
  // Arc: a courier with a ticking parcel -> every open street gets a
  // signed-for drop at the rival's door -> the final delivery, a parcel left
  // ticking on the doorstep after she falls.
  // Trajectory: ROLE SHIFT (raider, then a martyr that leaves a bomb).
  // Counterplay: block her lane to deny the signature; at L3, kill the
  // parcel where its burst lands on a cheap blocker.
  's2-riot-fuse-lit-bicycle-courier': {
    2: stage('Signature Required', [on('boss', boss(1))]),
    3: stage('Final Delivery', [
      on('death', summon('nearest', 2, 1, ['volatile'])),
    ]),
  },
  // Arc: the city canceled the parade -> the float marches anyway, glowing
  // -> the parade eats the city, crushing the street as it rolls in.
  // Trajectory: PRICE. Its glow burns neighbors on both sides; its arrival
  // shakes every ally. Counterplay: fight it from the far alleys; at L3,
  // keep your fighters out of the three alleys it faces.
  's2-riot-radioactive-parade-float': {
    2: stage('Glowing Procession', [
      on('roundEnd', damage(1, 'adjacentFoes'), damage(1, 'adjacentAllies')),
    ]),
    3: stage('The Parade Ate the City', [
      on('enter', damage(3, 'laneFoes'), damage(1, 'allies')),
    ]),
  },
  // Arc: a showgirl with bottle rockets on her skates -> a first spark now
  // and then -> curtain launch: she finally rides the rocket into the rival
  // boss. Trajectory: LATE BLOOMER (a 2-power skater until her fall matters).
  // Counterplay: stun her and ignore her; her launch needs her to fall.
  's3-riot-bottle-rocket': {
    2: stage('First Spark', [on('enter', chance(50, damage(2, 'weakestFoe')))]),
    3: stage('Curtain Launch', [
      on('death', boss(3), damage(1, 'adjacentAllies')),
    ]),
  },
  // Arc: a bass drum stuffed with fireworks -> the midnight drumroll, hitting
  // the foe across and rattling its own band -> the deafening crash that
  // stuns both neighboring foes on arrival.
  // Trajectory: ROLE SHIFT (ambusher, then drummer, then a deafener;
  // every crash also rattles its own neighbors). Counterplay: the stun lasts
  // one strike; meet it with high-life blockers in its side alleys.
  's3-riot-detonation-deacon': {
    2: stage('Midnight Drumroll', [
      on('turnStart', damage(1, 'across'), damage(1, 'adjacentAllies')),
    ]),
    3: stage('Deafening Crash', [
      on('enter', stun('adjacentFoes'), damage(1, 'adjacentAllies')),
    ]),
  },
  // Arc: a fortune-teller who foresees an explosion -> palm readings that
  // sometimes spark -> the fortune he volunteers to fulfill.
  // Trajectory: LATE BLOOMER (a lottery each turn, paid for in his own
  // life). Counterplay: kill him fast; the odds favor patience.
  's3-riot-alley-prophet': {
    2: stage('Palm Reading', [
      on('turnStart', chance(50, damage(1, 'across'))),
    ]),
    3: stage('Fire Foretold', [
      on('turnStart', damage(1, 'self'), chance(25, damage(3, 'allFoes'))),
    ]),
  },
  // Arc: a strongman with a fireworks launcher -> leads a parade of the
  // troupe -> the finale, which hits the troupe crowding closest.
  // Trajectory: ROLE SHIFT (tank, then parade leader, then showstopper). L3
  // keeps the glow that draws allies close and punishes them for it.
  // Counterplay: kill him while his neighbors stand, or never kill him.
  's3-riot-firework-bishop': {
    2: stage('Strongman Parade', [], { aura: { n: 1, to: 'adjacentAllies' } }),
    3: stage(
      'The Finale',
      [on('death', damage(3, 'allFoes'), damage(2, 'adjacentAllies'))],
      { aura: { n: 1, to: 'adjacentAllies' } },
    ),
  },
  // Arc: an ambush courier -> finds the open lane -> hit and run, never
  // standing still.
  // Trajectory: EARLY BLOOMER. L3 trades its standing body for a repeat
  // ambush: it strikes, then rides back to the top of your deck.
  // Counterplay: a trap in its lane; at L3 it never stays to block.
  's3-riot-riot-bike-messenger': {
    2: stage('Open Lane', [on('enter', when('acrossEmpty', power(2, 'self')))]),
    3: stage('Hit and Run', [on('strike', retreat())]),
  },
  // Arc: a thermite trapeze star -> burns through her blocker into both
  // sides -> falls like a meteor, wings gone, scorching three alleys.
  // Trajectory: EARLY BLOOMER, Riot's one weaker level three: a much
  // smaller body for a burning arrival. Counterplay: the fallen star is
  // fragile; keep fighters spread so the crater hits fewer of them.
  's3-riot-thermite-archangel': {
    stats: { 3: { hp: -10 } },
    2: stage('Burns Through', [
      on('hit', damage(1, 'adjacentFoes'), damage(1, 'adjacentAllies')),
    ]),
    3: stage('Fallen Star', [
      on('enter', damage(3, 'laneFoes', true), damage(1, 'adjacentAllies')),
    ]),
  },
  // ------------------------------------------------------------------ spells
  // Arc: redirected street fireworks -> the crowd charges behind the red
  // line -> the grand parade, which needs marchers to light up the street.
  // Trajectory: SITUATIONAL (wants a crowd of allies). Counterplay: thin
  // their board first; with fewer than two allies the parade fizzles.
  'firebreak-parade': {
    2: stage('Paint the Line Red', [on('enter', power(1, 'adjacentAllies'))]),
    3: stage('Grand Parade', [
      on('enter', when('crowd', damage(1, 'allFoes'))),
    ]),
  },
  // Arc: a hit with no witnesses -> including us -> especially us: the
  // whole corner knocked senseless, friends included.
  // Trajectory: PRICE. Each level hits harder and singes your own side.
  // Counterplay: crowd your fighters beside theirs; the stun lasts a strike.
  's1-no-witnesses': {
    2: stage('Including Us', [
      on('enter', damage(2, 'target'), damage(1, 'adjacentAllies')),
    ]),
    3: stage('Especially Us', [
      on('enter', stun('laneFoes'), damage(2, 'adjacentAllies')),
    ]),
  },
  // Arc: a mystery glitter bomb -> pink surprise (it stings) -> every
  // color at once, maybe.
  // Trajectory: LATE BLOOMER (a gamble that grows into a lottery ticket).
  // Counterplay: high-life fighters shrug off a 2-point jackpot.
  's1-chaos-firecracker': {
    2: stage('Pink Surprise', [on('enter', chance(50, stun('target')))]),
    3: stage('Every Color at Once', [
      on('enter', chance(33, damage(2, 'allFoes'))),
    ]),
  },
  // Arc: a terrible safety drill -> live-fire training pumps the crew ->
  // no safety officer at all: everyone bleeds, everyone hits harder.
  // Trajectory: ROLE SHIFT (removal, then a crew trainer that hurts).
  // Counterplay: punish the chipped crew with splash; low-life allies may
  // not survive their own drill.
  's2-riot-friendly-fire-rehearsal': {
    2: stage('Live-Fire Drill', [
      on('enter', damage(1, 'adjacentAllies'), power(2, 'adjacentAllies')),
    ]),
    3: stage('No Safety Officer', [
      on('enter', damage(1, 'allies'), sharpen(1, 'allies')),
    ]),
  },
  // Arc: a daredevil fired before the drumroll ends -> a second barrel that
  // goes somewhere -> over the net: it overshoots into the rival boss and
  // scorches the cannon's mouth.
  // Trajectory: LATE BLOOMER (a plain zap that becomes reach).
  // Counterplay: keep your boss healthy; its launch singes your neighbors.
  's2-riot-homemade-bottle-rocket': {
    2: stage('Second Barrel', [
      on('enter', chance(50, damage(1, 'weakestFoe'))),
    ]),
    3: stage('Over the Net', [
      on('enter', boss(2), damage(1, 'adjacentAllies')),
    ]),
  },
  // Arc: a stage-blood squib with no shrapnel -> an extra blood pack that
  // sprays both ways -> the fire marshal's special, a clean charge tuned
  // for the biggest bodies.
  // Trajectory: SITUATIONAL (anti-heavy at L3). Counterplay: crowd its
  // target's neighbors at L2; field cheap fighters against the special.
  's3-riot-low-budget-grenade': {
    2: stage('Extra Blood Pack', [
      on('enter', damage(1, 'adjacentFoes'), damage(1, 'adjacentAllies')),
    ]),
    3: stage("Fire Marshal's Special", [
      on('enter', when('targetHeavy', stun('target'))),
    ]),
  },
  // Arc: three damage on the wrong side of the curtain -> the blast shadow
  // finds the straggler -> brilliant once the cast has already bowed.
  // Trajectory: EARNED. L3 needs a fallen ally before it hits every foe.
  // Counterplay: avoid trading fighters early; with no fallen, no wave.
  's3-riot-wrong-side-of-blast': {
    2: stage('Blast Shadow', [on('enter', damage(2, 'weakestFoe'))]),
    3: stage('Already Bowed', [
      on('enter', when('allyFell', damage(2, 'allFoes'))),
    ]),
  },
  // Arc: a reckless spark -> double or nothing -> it actually worked
  // (maybe), or it went off in the crew's hands.
  // Trajectory: PRICE (two coin flips, one of them against you).
  // Counterplay: keep your boss out of reach; their crew may burn itself.
  's3-riot-horrible-idea': {
    2: stage('Double Down', [on('enter', chance(50, damage(2, 'target')))]),
    3: stage('It Actually Worked', [
      on('enter', chance(50, boss(3)), chance(50, damage(1, 'allies'))),
    ]),
  },
  // Arc: the ringmaster's plunger strapped on -> hot-wired, burning for
  // power -> strap a charge on the whole street, or press the plunger now.
  // Trajectory: ROLE SHIFT with a choice. Counterplay: kill the bomb where
  // its burst finds an empty alley; spread out against Press the Plunger.
  's3-riot-stolen-detonator': {
    2: stage('Hot-Wired', [
      on('enter', damage(1, 'target'), power(3, 'target')),
    ]),
    3: stage('Strap One On Everyone', [
      on('enter', grant('volatile', 'adjacentAllies')),
    ]),
    // Choose one: or blow the charge right now, through your own fighter.
    // The CPU straps the street while it has a crowd of allies.
    choice: {
      stage: stage('Press the Plunger', [
        on('enter', damage(3, 'target'), damage(2, 'laneFoes')),
      ]),
      cpu: 'crowd',
    },
  },
  // Arc: five damage and a kiss -> an ember overture that scatters the
  // house -> a standing ovation for the charge, or bring down the house.
  // Trajectory: ROLE SHIFT with a choice (removal, then a war cry or a
  // street-wide burn). Counterplay: the ovation lasts one round; bringing
  // down the house burns their own crew too.
  's3-riot-final-benediction': {
    2: stage('Ember Overture', [
      on('enter', damage(2, 'adjacentFoes'), damage(1, 'adjacentAllies')),
    ]),
    3: stage('Standing Ovation', [on('enter', power(2, 'allies'))]),
    // Choose one: or rain fire on every fighter, theirs and ours.
    // The CPU blesses a crowd and burns the street otherwise.
    choice: {
      stage: stage('Bring Down the House', [
        on('enter', damage(2, 'allFoes'), damage(1, 'allies')),
      ]),
      cpu: 'crowd',
    },
  },
  // ------------------------------------------------------------------- traps
  // Arc: a backstage thunder sheet -> the rumble cue might blow the cap
  // -> a thunderclap down the whole block, ours included.
  // Trajectory: STEADY (a cheap trap that widens). Counterplay: scan it;
  // its clap singes the trapper's own neighbors.
  's1-fuse-alley': {
    2: stage('Rumble Cue', [on('spring', chance(50, damage(3, 'target')))]),
    3: stage('Thunderclap', [
      on('spring', damage(2, 'adjacentFoes'), damage(1, 'adjacentAllies')),
    ]),
  },
  // Arc: powder-packed footlights -> the fuse chains to the next alley ->
  // the grand footlight show, sparks raining on everyone.
  // Trajectory: LATE BLOOMER. Counterplay: scan it; its show burns both
  // crews, so a wide, healthy board takes it best.
  's2-riot-fusebox-fireworks': {
    2: stage('Chain Fuse', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Grand Footlight Show', [
      on('spring', damage(1, 'allFoes'), damage(1, 'allies')),
    ]),
  },
  // Arc: a fishnet strung across the alley -> every strand binds a pursuer
  // -> a hail of sequins: one gamble that the whole street goes up.
  // Trajectory: EARLY BLOOMER (a sure control trap becomes a gamble).
  // Counterplay: scan it; the gamble misses half the time.
  's3-riot-fusewire': {
    2: stage('Caught in Fishnet', [on('spring', stun('adjacentFoes'))]),
    3: stage('Hail of Sequins', [
      on('spring', chance(50, damage(3, 'allFoes'))),
    ]),
  },
  // Arc: a rocket under a theater seat -> its smoke trail runs to the
  // rival boss -> the whole late show goes up in a barrage.
  // Trajectory: LATE BLOOMER. Counterplay: scan it; the barrage scatters
  // at random, so many small fighters soak it.
  's3-riot-night-market-rocket': {
    2: stage('Smoke Trail', [on('spring', boss(2))]),
    3: stage('Late Show Barrage', [
      on(
        'spring',
        damage(2, 'weakestFoe'),
        damage(2, 'weakestFoe'),
        damage(2, 'weakestFoe'),
      ),
    ]),
  },
  // Arc: a booby-trapped dressing room -> the biggest intruder is made to
  // kneel -> 'places, please': the room arms itself again.
  // Trajectory: EARNED (its second spring needs a second intruder).
  // Counterplay: scan it, or send a cheap runner in to spend each spring.
  's3-riot-confession-booth': {
    2: stage('Who Goes Backstage', [on('spring', stun('strongestFoe'))]),
    3: stage('Places, Please', [on('spring', rearm())]),
  },
  // --------------------------------------------------------------- equipment
  // Arc: an audience volunteer's sash -> the usher captain who leads the
  // crowd -> the whole house volunteers when it falls.
  // Trajectory: ROLE SHIFT (bomb, then leader, then a martyr that leaves
  // two ticking volunteers). Counterplay: fill the alleys beside the
  // wearer so the brigade has nowhere to stand.
  's1-volunteer-vest': {
    2: stage('Usher Captain', [], { aura: { n: 1, to: 'adjacentAllies' } }),
    3: stage('Whole House Volunteers', [
      on('death', summon('neighbors', 1, 1, ['volatile'])),
    ]),
  },
  // Arc: a fire-eater's last torch -> every hit juggles a flame -> the
  // last stand: the first knockout lights the whole act.
  // Trajectory: EARNED ONE-SHOT. Counterplay: high-life or armored
  // blockers deny the knockout; stun the wearer before it lands one.
  's2-riot-last-stand-matchbook': {
    2: stage('Torch Juggler', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('Last Stand', [once('kill', damage(2, 'allFoes'))]),
  },
  // Arc: fireproof platform boots -> hot feet: the wearer can charge at
  // once -> the extra lap: it fights the foe across once they are laced.
  // Trajectory: EARLY BLOOMER (the shoes trade growth for tempo).
  // Counterplay: a strong foe across wins the extra lap; stun it first.
  's3-riot-charred-sneakers': {
    2: stage('Hot Feet', [on('enter', grant('ambush', 'self'))]),
    3: stage('Extra Lap', [on('enter', duel('across'))]),
  },
  // Arc: a medal for the last curtain call -> the ribbon burns as the
  // wearer falls -> legend of the big top: the crew rises as it burns.
  // Trajectory: PRICE (it only pays when the wearer dies).
  // Counterplay: stun the wearer and leave it standing.
  's3-riot-posthumous-saint': {
    2: stage('Burning Ribbon', [
      on('death', damage(2, 'adjacentFoes'), damage(1, 'adjacentAllies')),
    ]),
    // (Gear cannot carry a choose-one: an installed medal would forget the
    // pick, so the ribbon's flame and the legend share one stage.)
    3: stage('Legend of the Big Top', [
      on('death', sharpen(1, 'allies'), damage(1, 'allFoes')),
    ]),
  },
}
