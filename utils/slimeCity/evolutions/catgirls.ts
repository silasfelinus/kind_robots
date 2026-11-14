// GENE RIOT CATGIRLS: evolution pilot (CLASH-EVOLUTION-PLAN.md, approved by
// Silas 2026-11-08 PT). Cards designed one at a time, story first:
// each entry carries its three-beat arc, its trajectory, and level stages
// that change what the card DOES, not just how big it is. Approved rules:
// weaker level threes are rare; situational payoffs are welcome; an earned
// level three appears only as an occasional one-shot gimmick.
import {
  armor,
  boss,
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
  pounce,
  power,
  rearm,
  rescue,
  revive,
  sharpen,
  shift,
  stage,
  stun,
  summon,
  when,
  type CardEvolution,
} from './dsl'

export const CATGIRL_EVOLUTIONS: Record<string, CardEvolution> = {
  // Arc: a rooftop courier smuggling bandages -> the crew's contraband
  // dealer -> the Midnight Ambulance that goes back for the fallen.
  // Trajectory: ROLE SHIFT. Brawler, then supplier, then a non-fighting
  // rescuer. Counterplay: the ambulance never strikes and its echo is
  // fragile; with no fallen ally its arrival brings no one back.
  'splice-runner': {
    stats: { 3: { hp: 4 } },
    2: stage('Contraband Courier', [on('enter', heal(3, 'woundedAlly'))]),
    3: stage('Midnight Ambulance', [on('enter', revive(2, 3))], {
      pacifist: true,
    }),
    // Choose one: or stay the dealer and run the black market for cards.
    // The CPU drives the ambulance only when someone has fallen.
    choice: {
      stage: stage('Black Market Run', [on('enter', draw(2))]),
      cpu: 'allyFell',
    },
  },
  // Arc: a phantom on the lab roofs -> leaps chimney to chimney -> a
  // skyline specter that escapes a crowded street for an open rooftop.
  // Trajectory: LATE BLOOMER (position). At L3 it chooses a vacant
  // adjacent lane opposite no enemy at the start of its own turn.
  // Counterplay: fill neighboring alleys, root it or lay a trap on the
  // escape route.
  's1-roof-phantom': {
    2: stage('Chimney Leap', [on('tap', when('acrossEmpty', boss(2)))]),
    3: stage('Skyline Specter', [on('tap', shift('self', 'safe'))]),
  },
  // Arc: a back-alley vet who stitched her own tail -> night shifts for
  // strays -> the saint who passes her needle on.
  // Trajectory: SITUATIONAL (pays off on a hurt crew). Counterplay: kill
  // the hurt allies first; regen is slow against focused damage.
  's1-alley-vet': {
    1: stage('Street Triage', [on('tap', heal(1, 'woundedAlly'))]),
    2: stage('Stray Stitches', [on('tap', heal(2, 'woundedAlly'))]),
    3: stage('Passes the Needle', [
      on('tap', heal(2, 'woundedAllies')),
      on('enter', grant('regen', 'woundedAllies')),
      on('death', heal(3, 'adjacentAllies')),
    ]),
  },
  // Arc: the parapet's cutest nightmare -> holds still as a gargoyle ->
  // a nightmare that freezes the whole alley, but is only a kitten.
  // Trajectory: EARLY BLOOMER, the pilot's one weaker level three: a much
  // smaller body for a big arrival. Counterplay: the stun lasts one strike
  // and the kitten dies to almost anything.
  's2-catgirls-parapet-ghost-kitten': {
    stats: { 3: { attack: -2, hp: -12 } },
    2: stage('Gargoyle Stillness', [on('turnStart', guard(2, 'self'))]),
    3: stage('Nightmare of the Parapets', [on('enter', stun('laneFoes'))]),
  },
  // Arc: an expensive lab tiger escapes -> loose in the lab, bolder with
  // every kill -> the apex predator that hunts the biggest threat.
  // Trajectory: LATE BLOOMER: a plain heavy until L3 makes it a hunter (a
  // weaker L1 cost Catgirls ~6 points in CPU sweeps, so it was cut). Counterplay:
  // a stronger foe wins the hunt; stun its prey to make the duel free, or
  // leave nothing big on the board.
  's3-catgirls-escaped-tiger': {
    stats: { 3: { hp: 3 } },
    2: stage('Loose in the Lab', [on('kill', sharpen(1, 'self'))]),
    3: stage('Apex Escapee', [on('enter', duel('strongestFoe'))]),
    // Choose one: or it slips the city entirely and grows fierce alone.
    // The CPU hunts while there is prey on the field.
    choice: {
      stage: stage('Back to the Wild', [on('enter', life(3, 'self'))], {
        lone: 2,
      }),
      cpu: 'foesPresent',
    },
  },
  // Arc: a glasswalker busking on broken bottles -> the crowd gathers as
  // shards fly -> the Glasswalk finale, where nothing can cut her.
  // Trajectory: ROLE SHIFT (scout to showstopper defender). Counterplay:
  // the shield ends on her next turn; with no crowd, there is no roar.
  's3-catgirls-glasswalker': {
    2: stage('Barefoot on Shards', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('The Glasswalk', [
      on('enter', guard(3, 'self'), when('crowd', power(1, 'allies'))),
    ]),
  },
  // Arc: three points of treatment, no invoice -> free clinic night ->
  // the People's Pharmacy, where the healthy get stronger.
  // Trajectory: SITUATIONAL. Counterplay: keep the crew hurt; chip damage
  // turns the pharmacy back into a plain heal.
  'mutual-aid': {
    2: stage('Free Clinic Night', [
      on('enter', cleanse('target'), guard(1, 'target')),
    ]),
    3: stage("People's Pharmacy", [on('enter', sharpen(1, 'healthyAllies'))]),
    // Choose one: or open the Emergency Ward and patch up the whole crew.
    // The CPU opens the ward once two or more allies are hurt.
    choice: {
      stage: stage('Emergency Ward', [on('enter', heal(2, 'allies'))]),
      cpu: 'crewWhole',
    },
  },
  // Arc: nine lives, no refunds -> the eighth life gets spent -> the whole
  // crew borrows against the last one.
  // Trajectory: EARNED ONE-SHOT. A spare life only matters if the rival
  // commits a lethal hit; L3 lends one to the whole crew. Counterplay: chip
  // twice instead of one big hit, or stun and wait.
  's1-nine-lives': {
    2: stage('Eighth Life', [on('enter', rescue('target'))]),
    3: stage('No Refunds', [on('enter', rescue('allies'))]),
  },
  // Arc: a wire across the catwalk -> it catches the heavy ones hardest ->
  // the hangman's line, which waits for a second victim.
  // Trajectory: SITUATIONAL (anti-heavy), then a second spring.
  // Counterplay: scan it; send a cheap runner first to spend each spring.
  's3-catgirls-garrote': {
    2: stage('Heavy Drop', [
      on('spring', when('targetHeavy', damage(2, 'target'))),
    ]),
    3: stage("Hangman's Line", [on('spring', rearm())]),
  },
  // Arc: a medic whose donor list has one name (her own) -> every hit she
  // lands buys a stitch for someone else -> the last donation: when she
  // falls, the most hurt ally walks away with her strength.
  // Trajectory: PRICE (her payoff needs her to fall). Counterplay: stun her
  // instead of killing her, or finish the hurt ally first.
  's2-catgirls-backstreet-organ-donor': {
    2: stage('Blood Drive', [on('hit', heal(1, 'woundedAlly'))]),
    3: stage('Last Donation', [
      on('death', life(4, 'woundedAlly'), sharpen(1, 'woundedAlly')),
    ]),
  },
  // Arc: a stolen spring-loaded rig -> tuned for pack hunting -> the
  // second pounce that carries straight through to the boss.
  // Trajectory: EARNED ONE-SHOT payoff on a knockout. Counterplay: armored
  // blockers deny the knockout; stun the wearer before it lands one.
  's3-catgirls-pounce-rig': {
    2: stage('Spring-Loaded', [], { pack: 1 }),
    3: stage('Second Pounce', [on('kill', pounce())]),
  },
  // Arc: a miracle in the medical dumpster -> a bin of spare parts -> the
  // clone vat that grows a new recruit from what was thrown away.
  // Trajectory: SITUATIONAL (the clone needs a fallen ally). Counterplay:
  // keep the crew alive and the vat stays empty; the clone is small.
  's1-clone-salvage': {
    2: stage('Spare Parts Bin', [on('enter', life(2, 'target'))]),
    3: stage('Clone Vat', [
      on('enter', when('allyFell', summon('nearest', 2, 3, ['regen']))),
    ]),
  },
  // Arc: a lure in the alley -> the line snaps across the block -> every
  // stray in the district comes running.
  // Trajectory: LATE BLOOMER. Counterplay: scan it, or send the trap's
  // victim down an alley with no empty neighbors for the strays.
  's1-catnip-tripwire': {
    2: stage('Long Lure', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Catnip Stampede', [
      on('spring', summon('neighbors', 1, 2, ['swarm'])),
    ]),
  },
  // Arc: piercing tools stolen from the lab -> clean incisions through any
  // plating -> the open-heart theft that feeds the wearer.
  // Trajectory: STEADY into SNOWBALL. Counterplay: unarmored blockers make
  // the incision moot; deny the knockout and the heart stays put.
  's1-surgical-piercers': {
    2: stage('Clean Incision', [on('hit', armor(-1, 'target'))]),
    3: stage('Open-Heart Theft', [
      on('hit', armor(-1, 'target')),
      on('kill', life(3, 'self')),
    ]),
  },
  // Arc: stolen skin heals -> a tougher hide grows back -> the shed husk
  // bursts onto whoever did the damage.
  // Trajectory: ROLE SHIFT (a heal that becomes a strike). Counterplay:
  // leave the alley across empty and the husk hits nothing.
  's2-catgirls-emergency-molt': {
    2: stage('Tougher Hide', [on('enter', armor(1, 'target'))]),
    3: stage('Husk Burst', [
      on('enter', armor(1, 'target'), damage(3, 'across')),
    ]),
  },
  // Arc: one stolen stealth trick -> the trick spreads down the line -> the
  // whole strike team moves as one needle.
  // Trajectory: LATE BLOOMER (a team play). Counterplay: a lone fighter
  // gets little from it; stun the crew before the strike phase.
  's2-catgirls-needle-thread-ambush': {
    2: stage('Threaded Team', [on('enter', grant('ambush', 'adjacentAllies'))]),
    3: stage('Needle Strike Team', [on('enter', power(1, 'allies'))]),
  },
  // Arc: one hospital suture across the alley -> a sterile field that
  // dresses our wounds -> the quarantine line that freezes the block.
  // Trajectory: STEADY. Counterplay: scan it; spread out so the quarantine
  // catches only one fighter.
  's2-catgirls-sterile-alley-wire': {
    2: stage('Sterile Field', [on('spring', heal(2, 'adjacentAllies'))]),
    3: stage('Quarantine Line', [on('spring', stun('laneFoes'))]),
  },
  // Arc: an atlas with every weakness in red -> the wearer exploits each one
  // -> when the runner falls, the atlas passes to the next.
  // Trajectory: SITUATIONAL (stunned prey), then a parting gift.
  // Counterplay: no stuns, no bonus; kill the wearer last.
  's2-catgirls-lab-escape-atlas': {
    2: stage('Red Ink', [], { bully: 2 }),
    3: stage('Every Exit Marked', [on('death', draw(2))], { bully: 2 }),
  },
  // Arc: a corporate saboteur -> a wrench in the rival's works -> the night
  // the patent office burns.
  // Trajectory: LATE BLOOMER (a 2-play finisher). Counterplay: spread thin
  // fighters can survive the fire; armor still blunts the arrival.
  's3-catgirls-patent-saboteur': {
    2: stage('Wrench in the Works', [on('enter', grant('snare', 'self'))]),
    3: stage('Burn the Patent Office', [
      on('enter', damage(1, 'allFoes'), boss(2)),
    ]),
  },
  // Arc: a vet who runs a noodle cart -> bone broth for the wounded -> the
  // midnight kitchen that feeds the whole crew, boss included.
  // Trajectory: STEADY SUPPORT. Counterplay: burst the hurt fighter before
  // the broth arrives; the kitchen cannot save the cart itself.
  's3-catgirls-alley-vet': {
    2: stage('Bone Broth', [on('turnStart', heal(2, 'woundedAlly'))]),
    3: stage('Midnight Noodle Kitchen', [
      on('enter', mend(4)),
      on('turnStart', heal(2, 'woundedAlly')),
    ]),
  },
  // Arc: a captain's brutal first cut -> hit and fade into the dark -> the
  // velvet coup that picks off the weakest guard first.
  // Trajectory: ROLE SHIFT (bruiser to assassin). Counterplay: keep no
  // weak fighter on the board; she has no armor once the shadows lift.
  's3-catgirls-scalpel-captain': {
    2: stage('Hit and Fade', [on('strike', guard(2, 'self'))]),
    3: stage('Velvet Coup', [
      on('enter', duel('weakestFoe')),
      on('kill', guard(2, 'self')),
    ]),
  },
  // Arc: a bicycle ambulance with stolen blood bags -> house calls between
  // fights -> a whole convoy of medic bikes.
  // Trajectory: LATE BLOOMER (wide). Counterplay: fill its neighboring
  // alleys first and the convoy has nowhere to park.
  's3-catgirls-bicycle-clinic': {
    2: stage('House Calls', [on('tap', heal(2, 'woundedAlly'))]),
    3: stage('Convoy', [
      on('enter', summon('neighbors', 1, 3, ['regen'])),
      on('tap', heal(3, 'woundedAlly')),
    ]),
  },
  // Arc: a street surgeon's two stitches -> a running stitch down the line
  // -> the field hospital that shields everyone she touched.
  // Trajectory: STEADY. Counterplay: the shield ends on her next turn; wait
  // it out and strike then.
  's3-catgirls-sidewalk-stitches': {
    2: stage('Running Stitch', [on('enter', heal(1, 'adjacentAllies'))]),
    3: stage('Field Hospital', [on('enter', guard(2, 'allies'))]),
  },
  // Arc: a black-market saw -> it cuts through the cage bars -> the hand
  // that strips a corporate guard of all its plating.
  // Trajectory: LATE BLOOMER (a weak 2-play that becomes a removal tool).
  // Counterplay: leave the alley across empty; armor only matters if worn.
  's3-catgirls-stolen-saw': {
    2: stage('Cut the Bars', [
      on('enter', damage(2, 'across'), sharpen(1, 'target')),
    ]),
    3: stage('Strip the Plating', [
      on(
        'enter',
        armor(-3, 'across'),
        damage(3, 'across'),
        sharpen(1, 'target'),
      ),
    ]),
  },
  // Arc: a climb up the fire escape -> a drop onto the foe below -> the
  // high ground: an open alley makes a sniper, a filled one a crash landing.
  // Trajectory: SITUATIONAL (rewards either board). Counterplay: the drop is
  // small; deny the open alley to deny the lasting power.
  's3-catgirls-fire-escape': {
    2: stage('Drop From Above', [on('enter', damage(1, 'across'))]),
    3: stage('King of the Fire Escape', [
      on(
        'enter',
        when('acrossEmpty', sharpen(2, 'target')),
        damage(2, 'across'),
      ),
    ]),
  },
  // Arc: an illegal transplant -> a black-market pump that beats harder ->
  // a counterfeit heart that refuses to stop.
  // Trajectory: EARNED ONE-SHOT at L3 (the rescue only matters if the rival
  // commits a lethal hit). Counterplay: chip it twice instead.
  's3-catgirls-counterfeit-heart': {
    2: stage('Black-Market Pump', [on('enter', sharpen(1, 'target'))]),
    3: stage('Beats On', [on('enter', life(3, 'target'), rescue('target'))]),
  },
  // Arc: a spare-life graft -> the graft is shared down the line -> spare
  // lives for the whole crew.
  // Trajectory: LATE BLOOMER (a slow 2-play that turns wide). Counterplay:
  // regen is slow; focused damage still kills.
  's3-catgirls-spare-lives': {
    2: stage('Shared Graft', [on('enter', grant('regen', 'adjacentAllies'))]),
    3: stage('Lives for Everyone', [on('enter', life(2, 'allies'))]),
  },
  // Arc: a surgical thread -> it stitches the victim to the street -> the
  // alley sewn shut with a barricade of sutures.
  // Trajectory: ROLE SHIFT (damage to a blocker). Counterplay: scan it; the
  // barricade never strikes and can be knocked down.
  's3-catgirls-suture-line': {
    2: stage('Stitched to the Street', [on('spring', sharpen(-1, 'target'))]),
    3: stage('Sew the Alley Shut', [on('spring', summon('nearest', 0, 6))]),
  },
  // Arc: a free-clinic sign that's a toll booth -> the victim pays a copay
  // to our boss -> collections come for the rival boss itself.
  // Trajectory: STEADY into REACH. Counterplay: scan the sign; a cheap
  // runner springs it for the smallest bill.
  's3-catgirls-false-clinic': {
    2: stage('Copay', [on('spring', mend(2))]),
    3: stage('Collections Department', [on('spring', mend(2), boss(3))]),
  },
  // Arc: a hollow blade -> a serum reservoir that feeds the wielder -> the
  // blade that mends the whole crew with every knockout.
  // Trajectory: STEADY into SNOWBALL. Counterplay: deny knockouts with
  // armored, high-life blockers.
  's3-catgirls-hollow-scalpel': {
    2: stage('Serum Reservoir', [on('enter', grant('leech', 'self'))]),
    3: stage('Blade That Mends', [
      on('enter', grant('leech', 'self')),
      on('kill', heal(2, 'allies')),
    ]),
  },
}
