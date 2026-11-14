// IRONJAW CHROME LIZARDS: crafted evolutions (CLASH-EVOLUTION-PLAN.md in
// conductor). Each card is designed one at a time, story first, following
// evolutions/catgirls.ts. The lizards own solidarity (shields, armor), heavy
// bodies and boss breakthrough; they never gamble and never drain.
// Approved rules: weaker level threes are rare (one here, the
// Bridgebreaker); situational payoffs are welcome; an earned level three is
// an occasional one-shot gimmick; three cards offer a choose-one level three.
import {
  armor,
  boss,
  damage,
  draw,
  duel,
  grant,
  guard,
  heal,
  life,
  on,
  once,
  pounce,
  mend,
  power,
  rearm,
  rescue,
  retreat,
  sharpen,
  stage,
  stun,
  summon,
  when,
  cleanse,
  type CardEvolution,
} from './dsl'

export const IRONJAW_EVOLUTIONS: Record<string, CardEvolution> = {
  // ------------------------------------------------------------ fighters
  // Arc: a whole repair crew in one lizard -> keeps the line running while
  // the crew fights -> throws the factory gates open for everyone.
  // Trajectory: EARLY BLOOMER. Its own punch flattens at L3 (-1 power) as
  // it turns into the crew's mechanic and gate-opener. Counterplay: block
  // its alley; with a foe across there is no boss hit and no rush.
  'union-millwright': {
    stats: { 3: { attack: -1 } },
    2: stage('Keeps the Line Running', [
      on('turnStart', heal(2, 'woundedAlly')),
    ]),
    3: stage('Gates Thrown Open', [
      on('turnStart', heal(1, 'woundedAlly')),
      on('boss', power(1, 'otherAllies')),
    ]),
  },
  // Arc: an armored furnace with a union card -> pours fresh plate onto the
  // fighters beside it -> Casting Day: it pours whole new workers.
  // Trajectory: EARLY BLOOMER. The furnace spends its own heat (-1 power at
  // L3) on the crew. Counterplay: fill or empty its neighboring alleys
  // first; the cast workers hit for 1 and fall to any sweep.
  's1-walking-foundry': {
    stats: { 3: { attack: -1 } },
    2: stage('Pours Fresh Plate', [on('enter', armor(1, 'adjacentAllies'))]),
    3: stage('Casting Day', [
      on('enter', summon('neighbors', 1, 4), armor(1, 'adjacentAllies')),
    ]),
  },
  // Arc: a welder who barricades mid-charge -> wraps herself in fresh
  // barricade every shift -> seals the narrow corridor and holds it alone.
  // Trajectory: SITUATIONAL (lone). Counterplay: piercing and stuns get
  // past the plate; she guards one alley, so win the other four.
  's1-scrap-welder': {
    2: stage('Mid-Charge Barricade', [
      on('turnStart', guard(2, 'self')),
      on('tap', guard(2, 'adjacentAllies')),
    ]),
    3: stage('Narrow Corridor', [
      on('enter', armor(2, 'self')),
      on('tap', guard(2, 'adjacentAllies')),
    ], { lone: 2 }),
  },
  // Signature: bring another worker across the bridge.
  // L1 makes a fragile 1/2 picket, a useful extra blocker now, not a
  // worthless 1/8-style investment for two future replays. The bridge
  // itself holds the lane, but the *plan* is vulnerable to token sweeps
  // and denial of empty slots.
  // L2 grows a sturdier picket AND increases adjacent allies' power;
  // L3 becomes a pacifist assembly line, raising two 1/4 workers and
  // shielding its neighbors every shift. Combo: Walking Foundry and
  // Scrapyard Dreadnought both reward its protected adjacent workforce.
  // Counterplay: clear the workers, occupy the surrounding lanes, or
  // strike the pacifist bridge before its next guard window.
  's2-ironjaw-union-bridgebearer': {
    stats: { 3: { hp: 4 } },
    1: stage('Night Shift Crossing', [on('enter', summon('nearest', 1, 2))]),
    2: stage('Load-Bearing Shift', [on('enter', summon('nearest', 1, 3))], {
      aura: { n: 1, to: 'adjacentAllies' },
    }),
    3: stage(
      'The Bridge Holds',
      [
        on('enter', summon('neighbors', 1, 4)),
        on('turnStart', guard(1, 'adjacentAllies')),
      ],
      { pacifist: true, aura: { n: 1, to: 'adjacentAllies' } },
    ),
  },
  // Arc: a lion forged from the last working crane -> its crane arms swipe
  // the fighters beside its prey -> the last crane leaps.
  // Trajectory: LATE BLOOMER, with a choose-one L3: leap over an open alley
  // straight into the boss, or bite down on the blocker in front of it.
  // Counterplay: keep its alley blocked to deny the leap; a big blocker
  // wins the bite.
  's2-ironjaw-foundry-lion': {
    2: stage('Crane Arm Swipe', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('Leap of the Last Crane', [
      on('enter', when('acrossEmpty', pounce())),
    ]),
    // Choose one: or clamp the crane jaws on the fighter across.
    // The CPU leaps whenever its alley is open.
    choice: {
      stage: stage('Crane Jaws', [on('enter', duel('across'))]),
      cpu: 'acrossEmpty',
    },
  },
  // Arc: the foundry's cheapest night-shift worker -> her torch finds the
  // seams in rival plate -> at dawn she hands the torch down the line.
  // Trajectory: EARLY BLOOMER (her own swing drops 1 at L3; her neighbors
  // get the torch). Counterplay: she only arms the allies already beside
  // her; kill the neighbors or play around the pierce with big life.
  's3-ironjaw-night-welder': {
    stats: { 3: { attack: -1 } },
    2: stage('Finds the Seams', [on('enter', grant('pierce', 'self'))]),
    3: stage('Dawn Shift Handoff', [
      on(
        'enter',
        grant('pierce', 'adjacentAllies'),
        sharpen(1, 'adjacentAllies'),
      ),
    ]),
  },
  // Signature: take the hit and share protection with the assembly.
  // L1 is an armored BULLDOZE body that shields one neighbor on arrival.
  // L2 reinforces that promise after a hit. L3 cashes in the saved time:
  // its thunderhead abandons direct support for a plate-shedding shockwave
  // and growing threat on every full round it survives. The -4 L3 opening life is intentional counterplay.
  // Combo: Union Bridgebearer's fresh 1/2 workers gain shield, then
  // its L2/L3 aura turns the surviving picket into real pressure.
  // Counterplay: pierce/burst before round end, clear the adjacent
  // workforce, or spread out of the three-alley shockwave.
  's3-ironjaw-dreadnought': {
    stats: { 3: { hp: -4 } },
    1: stage('Welded Convoy', [on('enter', guard(1, 'adjacentAllies'))]),
    2: stage('Scrap Magnet', [
      on('hit', guard(1, 'adjacentAllies'), life(1, 'self')),
    ]),
    3: stage('Thunderhead of Scrap', [
      on('enter', damage(2, 'laneFoes')),
      on('roundEnd', life(1, 'self'), sharpen(1, 'self')),
    ]),
  },
  // Arc: the union lunch lady -> a soup line for the fighters beside her ->
  // the strike kitchen that feeds a whole picket, or a ladle swung in anger.
  // Trajectory: ROLE SHIFT (cook -> quartermaster), with a choose-one L3.
  // Counterplay: piercing burst ends her before the soup matters; the
  // extra life is spread thin, so focus one fighter.
  's3-ironjaw-union-cook': {
    2: stage('Soup Line', [on('enter', grant('regen', 'adjacentAllies'))]),
    3: stage('Strike Kitchen', [on('enter', life(2, 'otherAllies'))]),
    // Choose one: or she picks up the ladle herself.
    // The CPU feeds the picket once two or more allies stand.
    choice: {
      stage: stage('Ladle Swung in Anger', [
        on('enter', sharpen(2, 'self'), guard(2, 'self')),
      ]),
      cpu: 'crowd',
    },
  },
  // Arc: an armored bridge crew punches a route -> the route opens straight
  // into the boss -> it lays itself down as the bridge the crew marches on.
  // Trajectory: PRICE, and the faction's one weaker L3: a smaller body
  // (3/16 instead of 6/22) for a crew-wide arrival. Counterplay: the
  // gifts land only on fighters already standing; the weak body falls.
  's3-ironjaw-bridgebreaker': {
    stats: { 3: { attack: -3, hp: -6 } },
    2: stage('Route Punched Through', [on('boss', boss(2))]),
    3: stage('Bridge of Its Own Back', [
      on('enter', armor(1, 'otherAllies'), sharpen(1, 'otherAllies')),
    ]),
  },
  // Arc: a monitor lizard on stolen rail wheels -> full steam from the yard ->
  // the runaway freight that hits the boss and loops back for another run.
  // Trajectory: PRICE (tempo): at L3 it leaves its alley after every boss
  // hit and must be replayed. Counterplay: block its alley or leave a trap
  // there; a root trap stops freight trains too.
  's3-ironjaw-coal-racer': {
    2: stage('Full Steam', [on('enter', grant('ambush', 'self'))]),
    3: stage('Runaway Freight', [
      on('enter', grant('ambush', 'self')),
      on('boss', retreat()),
    ]),
  },
  // Arc: the six-mana union matriarch -> the shop steward who stiffens
  // every fighter beside her -> she calls the general strike, or stands
  // alone as the iron bulwark.
  // Trajectory: SITUATIONAL, with a choose-one L3 (crowd or no crowd).
  // Counterplay: thin her crew before she arrives; the bulwark has no
  // reach beyond her own alley.
  's3-ironjaw-matriarch': {
    2: stage('Shop Steward', [], { aura: { n: 1, to: 'adjacentAllies' } }),
    3: stage('General Strike', [on('enter', sharpen(1, 'otherAllies'))]),
    // Choose one: or plant herself as the iron bulwark.
    // The CPU calls the strike while two or more allies stand.
    choice: {
      stage: stage('Iron Bulwark', [
        on('enter', armor(2, 'self'), life(4, 'self')),
      ]),
      cpu: 'crowd',
    },
  },

  // -------------------------------------------------------------- spells
  // Arc: an emergency overtime shift -> time and a half (the boost sticks)
  // -> everybody clocks in and the whole block of alleys surges.
  // Trajectory: LATE BLOOMER (positional at L3). Counterplay: the surge
  // ends at round end; stun the target or the neighbors before they swing.
  's1-hydraulic-shift': {
    2: stage('Time and a Half', [on('enter', sharpen(1, 'target'))]),
    3: stage('Everybody Clocks In', [on('enter', power(2, 'adjacentAllies'))]),
  },
  // Arc: lightning off the forge -> it arcs along the chrome to the
  // fighters beside the target -> it grounds straight through the boss.
  // Trajectory: ROLE SHIFT (removal -> splash -> boss breakthrough).
  // Counterplay: armor eats the splash; spread out; the boss hit is fixed.
  's1-forge-spark': {
    2: stage('Arcs Along the Chrome', [on('enter', damage(1, 'adjacentFoes'))]),
    3: stage('Grounded Through the Boss', [on('enter', boss(3))]),
  },
  // Arc: a nonviolent protest -> arms linked around the shover -> a very
  // violent wedge that knocks the blocker off its feet.
  // Trajectory: ROLE SHIFT (a buff -> a shield wall -> a shove).
  // Counterplay: shields fade on your turn; the stun is one strike long.
  's2-ironjaw-shift-change-shove': {
    2: stage('Linked Arms', [on('enter', guard(2, 'adjacentAllies'))]),
    3: stage('A Very Violent Wedge', [on('enter', stun('across'))]),
  },
  // Arc: the foreman loads a lunch pail with rivets -> rivets for the whole
  // line -> after a comrade falls, the crew bolts on everything it has.
  // Trajectory: EARNED ONE-SHOT (an ally must have fallen first).
  // Counterplay: don't trade early; armor caps at 3 and pierce still bites.
  's2-ironjaw-spare-rivet-shower': {
    2: stage('Rivets for the Line', [on('enter', guard(1, 'adjacentAllies'))]),
    3: stage('A Thousand Cuts Answered', [
      on('enter', when('allyFell', armor(1, 'allies'))),
    ]),
  },
  // Arc: an extra sheet of steel -> the overtime bonus thickens the worker
  // -> the bonus plate grows spikes.
  // Trajectory: ROLE SHIFT (a defensive plate becomes a weapon).
  // Counterplay: stun the spiked fighter, or kill it with piercing hits.
  's3-ironjaw-bonus-plate': {
    2: stage('Overtime Bonus', [on('enter', life(2, 'target'))]),
    3: stage('Spiked Bonus Plate', [on('enter', sharpen(2, 'target'))]),
  },
  // Arc: a shop-floor vote -> a show of hands from the crew -> every hand
  // raised: the whole floor bulldozes.
  // Trajectory: LATE BLOOMER (a 2-play that finally pays at L3).
  // Counterplay: big-life blockers leave no overkill to spill.
  's3-ironjaw-reallocation': {
    2: stage('Show of Hands', [
      on('enter', when('crowd', sharpen(2, 'target'))),
    ]),
    3: stage('Every Hand Raised', [on('enter', grant('bulldoze', 'allies'))]),
  },
  // Arc: one numbered hammer -> signed out to a jammed worker -> the full
  // inventory goes to the fighters beside it.
  // Trajectory: ROLE SHIFT (one hammer -> a fix -> an armory).
  // Counterplay: keep the crew apart; stun the bearer after the cast.
  's3-ironjaw-hammer-register': {
    2: stage('Signed Out', [on('enter', cleanse('target'))]),
    3: stage('Every Hammer Accounted For', [
      on('enter', sharpen(1, 'adjacentAllies')),
    ]),
  },
  // Arc: cold weld on a wounded worker -> the weld hardens into a shield ->
  // the patch becomes plate.
  // Trajectory: STEADY. Counterplay: one big piercing hit beats any patch.
  's3-ironjaw-weld-patch': {
    2: stage('Hardened Weld', [on('enter', guard(2, 'target'))]),
    3: stage('Patch Becomes Plate', [
      on('enter', armor(1, 'target'), life(2, 'target')),
    ]),
  },
  // Arc: two immediate AP for a heavy -> the furnace stoked to shield it ->
  // meltdown: the heavy burns, but nothing stops it after.
  // Trajectory: PRICE (the meltdown scorches its own fighter for 2).
  // Counterplay: finish the scorched fighter before it swings.
  's3-ironjaw-furnace-overdrive': {
    2: stage('Stoked Furnace', [on('enter', guard(2, 'target'))]),
    3: stage('Meltdown Charge', [
      on(
        'enter',
        damage(2, 'target'),
        sharpen(2, 'target'),
        grant('bulldoze', 'target'),
      ),
    ]),
  },

  // --------------------------------------------------------------- traps
  // Arc: hidden steel jaws -> the crew braces when the clamp bites -> the
  // union lockout: the whole block stops moving.
  // Trajectory: SITUATIONAL (pays off on a crowded enemy front).
  // Counterplay: scan it, or spring it with a lone runner.
  's1-bolt-clamp': {
    2: stage('Braced Line', [on('spring', guard(2, 'adjacentAllies'))]),
    3: stage('Union Lockout', [on('spring', stun('adjacentFoes'))]),
  },
  // Arc: a hidden jaw buys the foundry another shift -> the shift is spent
  // well (a card) -> the jaw remembers the fallen and bites to the bone.
  // Trajectory: EARNED ONE-SHOT (L3's bite needs a fallen ally).
  // Counterplay: scan it; avoid trading before you cross it.
  's2-ironjaw-hydraulic-lockjaw': {
    2: stage('Another Shift Bought', [on('spring', draw(1))]),
    3: stage('The Jaw Remembers', [
      on('spring', draw(1), when('allyFell', damage(3, 'target', true))),
    ]),
  },
  // Arc: a rusty wheel chock -> pallets stacked as cover for the crew ->
  // the forklift sets the chock down again.
  // Trajectory: ROLE SHIFT (a snare -> cover -> a second snare).
  // Counterplay: send a cheap runner through twice, or scan it.
  's3-ironjaw-forklift-chock': {
    2: stage('Pallet Cover', [on('spring', armor(1, 'adjacentAllies'))]),
    3: stage('Back on the Forks', [on('spring', rearm())]),
  },
  // Arc: a hidden bucket of slag -> it spreads to the alleys beside ->
  // the furnace floods the whole block.
  // Trajectory: LATE BLOOMER. Counterplay: scan it; keep the front thin.
  's3-ironjaw-slag-spill': {
    2: stage('Slag Spreads', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Slag Flood', [on('spring', damage(2, 'laneFoes', true))]),
  },
  // Arc: the union's hidden toll -> the toll is billed to the boss -> payday:
  // the toll goes straight to the crew's fists.
  // Trajectory: ROLE SHIFT (a snare -> a boss toll -> crew payday).
  // Counterplay: scan it; the payday surge ends at round end.
  's3-ironjaw-overtime-toll': {
    2: stage('Toll Billed Upstairs', [on('spring', boss(2))]),
    3: stage('Union Payday', [on('spring', boss(2), mend(2))]),
  },

  // ----------------------------------------------------------- equipment
  // Arc: reclaimed hydraulic parts -> shock absorbers brace every turn ->
  // the spare pistons become a stomping exo-frame.
  // Trajectory: ROLE SHIFT (protection -> offense).
  // Counterplay: stun the wearer; the stomp splashes only 1.
  'spare-pistons': {
    2: stage('Shock Absorbers', [on('turnStart', guard(1, 'self'))]),
    3: stage('Piston Stomp', [
      on('enter', grant('bulldoze', 'self')),
      on('hit', damage(1, 'adjacentFoes')),
    ]),
  },
  // Arc: plate cut from the boss's old office door -> a seat at the
  // bargaining table for the fighters beside it -> an ironclad contract.
  // Trajectory: SITUATIONAL (insurance on a lethal hit). Counterplay: chip
  // it twice, or stun and wait.
  's1-union-plate': {
    2: stage('Seat at the Table', [], { aura: { n: 1, to: 'adjacentAllies' } }),
    3: stage('Ironclad Contract', [on('enter', rescue('self'))], {
      aura: { n: 1, to: 'adjacentAllies' },
    }),
  },
  // Arc: management's 'efficiency' pistons -> mandatory overtime: the
  // wearer swings the moment it lands -> the double shift: it swings twice.
  // Trajectory: PRICE (two trades means taking the return blow twice).
  // Counterplay: a heavy blocker punishes the second trade; stun it.
  's2-ironjaw-overtime-pistons': {
    2: stage('Mandatory Overtime', [on('enter', grant('ambush', 'self'))]),
    3: stage('Double Shift', [on('strike', duel('across'))]),
  },
  // Arc: fitted pistons -> the guard patrols a second tile -> the night
  // patrol walks the whole floor and picks off the weakest intruder.
  // Trajectory: LATE BLOOMER. Counterplay: keep no weak fighter on the
  // board; a strong patroller can still be stunned.
  's3-ironjaw-toe-pistons': {
    2: stage('Two-Tile Patrol', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('Night Patrol', [on('turnStart', duel('weakestFoe'))]),
  },
  // Arc: the foreman's crowbar -> it levers stunned blockers aside -> the
  // first knockout pries open the boss's office door.
  // Trajectory: EARNED ONE-SHOT (one knockout). Counterplay: armored
  // blockers deny the knockout; stun the wearer before it lands one.
  's3-ironjaw-foreman-crowbar': {
    2: stage('Leverage', [], { bully: 2 }),
    3: stage('Pry the Office Door', [once('kill', boss(5))]),
  },
}
