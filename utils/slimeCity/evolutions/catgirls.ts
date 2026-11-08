// GENE RIOT CATGIRLS: evolution pilot (CLASH-EVOLUTION-PLAN.md, approved by
// Silas 2026-11-08 PT). Cards designed one at a time, story first:
// each entry carries its three-beat arc, its trajectory, and level stages
// that change what the card DOES, not just how big it is. Approved rules:
// weaker level threes are rare; situational payoffs are welcome; an earned
// level three appears only as an occasional one-shot gimmick.
import {
  boss,
  cleanse,
  damage,
  draw,
  duel,
  grant,
  guard,
  heal,
  life,
  on,
  pounce,
  power,
  rearm,
  rescue,
  retreat,
  revive,
  sharpen,
  stage,
  stun,
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
  // skyline specter that strikes and is gone again.
  // Trajectory: LATE BLOOMER (tempo). Counterplay: a blocker it cannot
  // knock out keeps it on the board; an open alley at L3 gives no knockout.
  's1-roof-phantom': {
    2: stage('Chimney Leap', [on('enter', when('acrossEmpty', boss(2)))]),
    3: stage('Skyline Specter', [
      on('enter', when('acrossEmpty', boss(2))),
      on('kill', retreat()),
    ]),
  },
  // Arc: a back-alley vet who stitched her own tail -> night shifts for
  // strays -> the saint who passes her needle on.
  // Trajectory: SITUATIONAL (pays off on a hurt crew). Counterplay: kill
  // the hurt allies first; regen is slow against focused damage.
  's1-alley-vet': {
    2: stage('Stray Stitches', [on('roundEnd', heal(1, 'adjacentAllies'))]),
    3: stage('Passes the Needle', [
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
}
