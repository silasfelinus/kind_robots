// Crafted evolutions: mercenaryA (CLASH-EVOLUTION-PLAN.md in conductor). Each card is
// designed one at a time, story first, following evolutions/catgirls.ts.
// Mercenaries are wandering hired help: one weird city-life joke each,
// gentler numbers, and stages that stay crew-neutral (any crew can hire them).
import {
  boss,
  chance,
  cleanse,
  damage,
  draw,
  duel,
  grant,
  guard,
  heal,
  life,
  mend,
  on,
  once,
  power,
  retreat,
  revive,
  sharpen,
  stage,
  stun,
  summon,
  when,
  type CardEvolution,
} from './dsl'

export const MERCENARY_A_EVOLUTIONS: Record<string, CardEvolution> = {
  // Arc: a sommelier who pairs drainwater with landlords' tears -> pours a
  // tasting flight for whoever stands beside him -> uncorks the gutter's
  // grand cru, and the whole table learns to sip from a fight.
  // Trajectory: ROLE SHIFT (a self-healer becomes the table's host).
  // Counterplay: leech only heals on a hit; stun or out-armor the guests,
  // or keep him from landing hits so the flight never pours.
  'merc-sewer-sommelier': {
    2: stage('Tasting Flight', [on('hit', heal(1, 'adjacentAllies'))]),
    3: stage('Grand Cru of the Gutter', [
      on('enter', grant('leech', 'adjacentAllies')),
      on('hit', heal(1, 'adjacentAllies')),
    ]),
  },
  // Arc: a museum on roller skates -> every knockout goes up on the trophy
  // wall and the rink cheers -> the diorama rolls out: a mounted bear on
  // skates joins the crowd.
  // Trajectory: LATE BLOOMER (a plain skater until the exhibit arrives).
  // Counterplay: deny the knockouts with big-life blockers; the exhibit is
  // a 2/2, so splash damage clears it before the swarm gathers.
  'merc-skate-taxidermist': {
    2: stage('Trophy Wall', [on('kill', sharpen(1, 'adjacentAllies'))]),
    3: stage('Diorama on Wheels', [
      on('enter', summon('nearest', 2, 2, ['swarm'])),
      on('kill', sharpen(1, 'adjacentAllies')),
    ]),
  },
  // Arc: a wrecking wall that sells the ground you stand on -> the opening
  // bid prices the tenant across out of a fight -> SOLD: the occupant is
  // evicted, or the empty lot is sold straight to the rival boss.
  // Trajectory: SITUATIONAL (eviction if occupied, a boss bill if empty).
  // Counterplay: a big-life foe across survives the eviction; the golem is
  // a slow 2-play body, so race it in the other alleys.
  'merc-auction-golem': {
    2: stage('Priced Out', [], { hex: { n: 2, to: 'across' } }),
    3: stage('Sold Out From Under You', [
      on('enter', damage(4, 'across', true)),
      on('enter', when('acrossEmpty', boss(3))),
    ]),
  },
  // Arc: she keeps every dangerous new idea alive -> the ideas are
  // catching, and her neighbors start to fizz -> when she finally goes off,
  // two fresh sparks are born beside her.
  // Trajectory: PRICE (her big payoff needs her to fall). Counterplay: stun
  // her instead of killing her, or bring her down while her neighbors'
  // alleys are full so no spark has room to land.
  'merc-spark-midwife': {
    2: stage('Ideas Are Catching', [
      on('enter', grant('volatile', 'adjacentAllies')),
    ]),
    3: stage('Brainstorm', [
      on('death', summon('neighbors', 1, 1, ['volatile'])),
    ]),
  },
  // Arc: a witch with one red light -> she runs the intersection, green for
  // friends -> gridlock: one perfect hit jams the whole block.
  // Trajectory: ROLE SHIFT (stopper, then director, then a one-shot jam).
  // Counterplay: the gridlock fires once; spread out so her neighbors'
  // alleys are empty, or stun her before she lands the hit.
  'merc-traffic-witch': {
    2: stage('Green Wave', [on('hit', power(1, 'adjacentAllies'))]),
    3: stage('Gridlock', [once('hit', stun('adjacentFoes'))]),
  },
  // Arc: a troll walking the strike line in permanent overtime -> the line
  // only gets thicker -> the general strike: it downs tools, and the three
  // rivals facing it lose the will to swing too.
  // Trajectory: EARLY BLOOMER (it gives up its own strikes for a wall that
  // saps the facing foes). Counterplay: it never strikes, so it never
  // threatens; push through the alleys out of its reach.
  'merc-picket-troll': {
    2: stage('Permanent Overtime', [on('roundEnd', life(1, 'self'))]),
    3: stage('General Strike', [on('enter', guard(3, 'self'))], {
      pacifist: true,
      hex: { n: 2, to: 'laneFoes' },
    }),
  },
  // Arc: a crab that has escaped sixteen seafood restaurants -> dine and
  // dash, back out the door after every bite -> the seventeenth escape, or
  // the night it breaks the whole lobster tank free.
  // Trajectory: ROLE SHIFT with a choose-one L3: a hit-and-run loop that
  // never holds an alley, or a liberator that builds a board.
  // Counterplay: the dasher holds no alley, so its lane is free for your
  // boss hits; the freed crabs are 1/2s that splash damage sweeps away.
  'merc-escape-crab': {
    2: stage('Dine and Dash', [on('strike', retreat())]),
    3: stage('The Seventeenth Escape', [
      on('enter', power(2, 'self')),
      on('strike', retreat()),
    ]),
    // Choose one: or it stays and frees the tank. The CPU dashes only when
    // two allies already hold the street.
    choice: {
      stage: stage('Free the Tank', [on('enter', summon('neighbors', 1, 2))]),
      cpu: 'crowd',
    },
  },
  // Arc: an entire building that learned to unionize -> it carries its
  // neighbors' weight -> it builds new wings out into the empty alleys.
  // Trajectory: ROLE SHIFT (anchor, then support, then architect).
  // Counterplay: the wings never strike (0 power), so ignore them; fill the
  // alleys beside it first and there is nowhere to build.
  'merc-living-scaffold': {
    2: stage('Load-Bearing', [on('enter', life(2, 'adjacentAllies'))]),
    3: stage('New Wings', [on('enter', summon('neighbors', 0, 4))]),
  },
  // Arc: a mime who is silent, obvious and somehow behind you -> walks
  // against the wind alone and hits harder for it -> traps the biggest foe
  // in an invisible box.
  // Trajectory: SITUATIONAL (a loner; the box is best against one big
  // threat). Counterplay: crowd a fighter in beside it to break the solo
  // act; the box holds for one strike and the mime is fragile.
  'merc-invisible-mime': {
    2: stage('Against the Wind', [], { lone: 2 }),
    3: stage('Trapped in a Box', [on('enter', stun('strongestFoe'))], {
      lone: 2,
    }),
  },
  // Arc: a night janitor who mops up champions and takes no overtime ->
  // every knockout is a mess cleaned and a breather earned -> closing
  // time: after a knockout, he mops the weakest foe on the way out.
  // Trajectory: LATE BLOOMER (knockouts chain at L3). Counterplay: keep
  // big-life blockers across him so he never gets the first knockout.
  'merc-midnight-janitor': {
    2: stage('Mops Up', [on('kill', heal(3, 'self'))]),
    3: stage('Closing Time', [on('kill', duel('weakestFoe'))]),
  },
  // Arc: a parcel of gauze sent to the wrong door -> forwarded to the
  // neighbors on the way -> delivered to every door on the block.
  // Trajectory: STEADY (a cheap common that widens its reach).
  // Counterplay: burst the hurt fighters before the parcel arrives; it
  // mends chip damage, not a knockout.
  'merc-misaddressed-parcel': {
    2: stage('Forwarded Next Door', [on('enter', heal(1, 'adjacentAllies'))]),
    3: stage('Every Door on the Block', [
      on('enter', heal(2, 'woundedAllies')),
    ]),
  },
  // Arc: hundreds of residents sign a petition for lightning -> the
  // signature drive works only with a crowd behind it -> the petition
  // passes, and a lightning rod points at the rival boss.
  // Trajectory: SITUATIONAL (pays with 2+ allies on the field).
  // Counterplay: thin the crowd first; with fewer than two allies the
  // petition is just a zap.
  'merc-crowd-lightning': {
    2: stage('Signature Drive', [
      on('enter', when('crowd', damage(2, 'target'))),
    ]),
    3: stage('Lightning Rod Petition', [on('enter', when('crowd', boss(3)))]),
  },
  // Arc: a painted arrow into a dead end -> big trucks get stuck worst ->
  // the whole road is closed for repairs.
  // Trajectory: SITUATIONAL (anti-heavy), then a wide stop.
  // Counterplay: spread your fighters so the closure catches one; the stun
  // lasts a single strike.
  'merc-unofficial-detour': {
    2: stage('Dead End', [
      on('enter', when('targetHeavy', damage(2, 'target'))),
    ]),
    3: stage('Road Closed for Repairs', [on('enter', stun('adjacentFoes'))]),
  },
  // Arc: someone writes a glowing reference -> the fighter walks out free
  // and confident -> the boss comes out spotless.
  // Trajectory: ROLE SHIFT (fighter armor, then a boss mend).
  // Counterplay: the mend is capped; race the boss before the laundering
  // matters, and chip the armored fighter with piercing.
  'merc-reputation-laundry': {
    2: stage('Glowing Reference', [
      on('enter', cleanse('target'), power(1, 'target')),
    ]),
    3: stage('Comes Out Spotless', [on('enter', mend(3))]),
  },
  // Arc: one fighter's cause draws a crowd -> a dancer joins rehearsal ->
  // the whole street dances, filling every empty alley.
  // Trajectory: LATE BLOOMER (best on a sparse board at L3).
  // Counterplay: the dancers are 1/1s; any splash clears them, and a full
  // board leaves no empty alley to fill.
  'merc-flashmob-diversion': {
    2: stage('Rehearsal', [on('enter', summon('nearest', 1, 1))]),
    3: stage('The Whole Street Dances', [
      on('enter', summon('everyEmpty', 1, 1)),
    ]),
  },
  // Arc: a coat-hanger radar that finds hidden traps -> its feedback whine
  // rattles whoever stands in the alley -> it locks on to the biggest
  // threat on the field.
  // Trajectory: STEADY into a role shift (trap sweeper to sniper).
  // Counterplay: no big threat, no target worth locking; spread power out.
  'merc-jury-rigged-radar': {
    2: stage('Feedback Whine', [on('enter', damage(1, 'across'))]),
    3: stage('Locked On', [on('enter', damage(2, 'strongestFoe'))]),
  },
  // Arc: the whole city sneezes -> pollen drifts to the neighbors -> peak
  // pollen count: sometimes the entire rival crew is doubled over at once.
  // Trajectory: SITUATIONAL (a seeded gamble at L3, like its base roll).
  // Counterplay: the stun is a long shot and lasts one strike; never play
  // around it, play through it.
  'merc-allergy-season': {
    2: stage('Pollen Drift', [on('enter', damage(1, 'adjacentFoes'))]),
    3: stage('Peak Pollen Count', [
      on('enter', damage(1, 'adjacentFoes'), chance(30, stun('allFoes'))),
    ]),
  },
  // Arc: permits acquired -> hard hats on for the whole crew -> a
  // controlled implosion that drops the biggest buildings cleanest.
  // Trajectory: SITUATIONAL (anti-heavy), the careful twin of Unsupervised.
  // Counterplay: field 1-play fighters; the hard hats fade on your turn.
  'merc-supervised-demo': {
    2: stage('Hard Hats On', [on('enter', guard(1, 'allies'))]),
    3: stage('Controlled Implosion', [
      on('enter', guard(1, 'allies')),
      on('enter', when('targetHeavy', damage(3, 'target', true))),
    ]),
  },
  // Arc: permits shredded -> debris flies over the fence onto the boss ->
  // nobody read the manual: the whole block comes down, yours included.
  // Trajectory: PRICE (the biggest blast hurts your own crew too).
  // Counterplay: it chips your crew as well; keep fighters healthy and let
  // the rival's own fragile allies pay for the blast.
  'merc-unsupervised-demo': {
    2: stage('Flying Debris', [on('enter', boss(1))]),
    3: stage('Nobody Read the Manual', [
      on('enter', damage(2, 'allFoes'), damage(1, 'allies')),
    ]),
  },
  // Arc: a tempting payment deferral -> a grace period to catch your
  // breath -> the bill comes due: foreclose on the rival boss's house, or
  // refinance and walk away with cash in hand.
  // Trajectory: ROLE SHIFT with a choose-one L3 (boss pressure or cards).
  // Counterplay: Foreclosure is a flat 3, so keep the boss out of reach;
  // Refinance does nothing to the board this turn, so punish the slow turn.
  'merc-mortgage-holiday': {
    2: stage('Grace Period', [on('enter', mend(1))]),
    3: stage('Foreclosure', [on('enter', boss(3))]),
    // Choose one: or refinance and draw. The CPU forecloses when it already
    // has two allies on the field to press the advantage.
    choice: {
      stage: stage('Refinance', [on('enter', draw(2))]),
      cpu: 'crowd',
    },
  },
  // Arc: a used halo, still warm -> it remembers how to mend -> it finds
  // its previous owner and brings them back for one more shift.
  // Trajectory: EARNED (the L3 return needs someone to have fallen).
  // Counterplay: the echo is a fragile 2/3; with no fallen ally, it only
  // blesses the target.
  'merc-secondhand-halo': {
    2: stage('Still Warm', [on('enter', heal(2, 'target'))]),
    3: stage('Previous Owner', [on('enter', revive(2, 3))]),
  },
  // Arc: elevators are for the syndicate -> leg day pays off in lasting
  // stamina -> a stairwell sprint that bursts out the roof door.
  // Trajectory: ROLE SHIFT (burst, then endurance, then breakthrough).
  // Counterplay: bulldoze needs overkill; a big-life blocker absorbs the
  // sprint, and a stun stops it cold.
  'merc-take-stairs': {
    2: stage('Leg Day', [on('enter', life(2, 'target'))]),
    3: stage('Stairwell Sprint', [on('enter', grant('bulldoze', 'target'))]),
  },
  // Arc: a confession under a streetlight -> the neighbors overhear and
  // stand taller -> the truth hurts, and it hurts the foe across most.
  // Trajectory: ROLE SHIFT (a lasting buff that grows outward, then bites).
  // Counterplay: an empty alley across wastes the sting; the neighbors'
  // boost lasts only the round.
  'merc-streetlight-confession': {
    2: stage('Overheard', [on('enter', power(1, 'adjacentAllies'))]),
    3: stage('The Truth Hurts', [on('enter', damage(2, 'across', true))]),
  },
  // Arc: one recipe, three warning labels -> side effects, sometimes a
  // jolt -> a batch that works, or a bad batch you throw instead.
  // Trajectory: SITUATIONAL with a choose-one L3 (drink it or throw it).
  // Counterplay: the good batch's regen is slow, so burst the target; the
  // bad batch needs a foe across, so leave that alley empty.
  'merc-homebrew-antidote': {
    2: stage('Side Effects May Include', [
      on('enter', chance(50, power(2, 'target'))),
    ]),
    3: stage('Good Batch', [
      on('enter', grant('regen', 'target'), life(2, 'target')),
    ]),
    // Choose one: or it is a bad batch, thrown across the alley. The CPU
    // drinks it when no foe is across to throw at.
    choice: {
      stage: stage('Bad Batch', [on('enter', damage(3, 'across'))]),
      cpu: 'acrossEmpty',
    },
  },
  // Arc: a well-placed rumor -> it travels the grapevine to the neighbors
  // -> front page: everyone hears it, the rival boss included.
  // Trajectory: LATE BLOOMER (narrow, then wide).
  // Counterplay: the spread is only 1 damage; healthy, armored fighters
  // shrug off the gossip.
  'merc-whisper-network': {
    2: stage('Grapevine', [on('enter', damage(1, 'adjacentFoes'))]),
    3: stage('Front Page', [on('enter', damage(1, 'allFoes'), boss(1))]),
  },
}
