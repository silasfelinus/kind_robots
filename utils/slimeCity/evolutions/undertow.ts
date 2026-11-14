// Crafted evolutions: undertow (CLASH-EVOLUTION-PLAN.md in conductor). Each card is
// designed one at a time, story first, following evolutions/catgirls.ts.
// Undertow Intelligence owns stuns, information (draw, scouting), patience
// payoffs and precision; it never grows big bodies or swarms. Cards drawn
// mid-strike would expire with the hand, so every draw here lands on arrival,
// on a cast, on install or at turn start.
import {
  boss,
  cleanse,
  damage,
  execute,
  draw,
  duel,
  grant,
  guard,
  mend,
  on,
  power,
  promote,
  rearm,
  sharpen,
  stage,
  stun,
  when,
  type CardEvolution,
} from './dsl'

export const UNDERTOW_EVOLUTIONS: Record<string, CardEvolution> = {
  // Arc: a listener who reads secrets in the drainpipe flow -> learns to read
  // the next move before it is made -> either becomes the oracle of the drains
  // or turns the knowledge into one perfect strike.
  // Trajectory: ROLE SHIFT, choose one at L3 (oracle that never fights, or a
  // sniper's pressure point). Counterplay: the oracle never strikes, so race
  // its alley; the pressure point hits once, so keep the biggest foe armored
  // or in reserve.
  'pipe-seer': {
    2: stage('Reading the Flow', [on('enter', draw(1))]),
    3: stage('Oracle of the Drains', [on('turnStart', draw(1))], {
      pacifist: true,
    }),
    // Choose one: or read the crack in the strongest foe and hit it. The CPU
    // retires into the oracle only when two allies can carry the fighting.
    choice: {
      stage: stage('Pressure Point', [
        on('enter', damage(3, 'strongestFoe', true)),
      ]),
      cpu: 'crowd',
    },
  },
  // Arc: a suspiciously polished drain cover -> it tips off the crew about
  // who just fell in -> the snitch network fingers the rival's top enforcer.
  // Trajectory: ROLE SHIFT (trap -> crew buff -> assassination tip).
  // Counterplay: scan it; at L3 lead with a cheap runner while your strongest
  // fighter is off the board.
  'snitch-grate': {
    2: stage('Tip-Off', [on('spring', sharpen(1, 'adjacentAllies'))]),
    3: stage('Snitch Network', [on('spring', damage(2, 'strongestFoe', true))]),
  },
  // Arc: a sniper in the sewer vents -> a cold spot that picks off the weak
  // -> the haunting: when it is finally caught, the whole alley freezes.
  // Trajectory: PRICE (the L3 payoff needs it to fall). Counterplay: stun it
  // or leave it alive; kill it on a turn when your own strikes are spent.
  's1-basement-ghost': {
    2: stage('Vent Shot', [on('enter', damage(1, 'weakestFoe', true))]),
    3: stage('The Haunting', [on('death', stun('laneFoes'))]),
  },
  // Arc: a lineman listening through the streetlights -> a quiet alley where
  // every call comes through -> the static storm that jams the whole block.
  // Trajectory: EARLY BLOOMER (a sharper L1 body; later levels trade the
  // fight for information and jamming). Counterplay: park a fighter across
  // it to cut the line; burst it down before the storm matters.
  's1-static-listener': {
    stats: { 1: { attack: 1 } },
    2: stage('Quiet Alley', [on('tap', when('acrossEmpty', draw(1)))]),
    3: stage('Static Storm', [on('enter', draw(1)), on('tap', draw(2))], {
      hex: { n: 1, to: 'laneFoes' },
    }),
  },
  // Arc: a floodlight sweeps for traps -> the glare blinds whoever stands in
  // the beam -> the spotlight marks targets for the whole crew.
  // Trajectory: ROLE SHIFT (trap clearing -> blinding -> offense call).
  // Counterplay: keep your alleys empty of prey; the crew's boost lasts one
  // round only.
  's1-floodlight-sweep': {
    2: stage('Blinding Glare', [on('enter', stun('target'))]),
    3: stage('Spotlight the Crew', [
      on('enter', stun('target'), power(1, 'allies')),
    ]),
  },
  // Arc: a restraining order nobody read -> the wiretap transcript pays out
  // -> a sealed warrant written for the big fish.
  // Trajectory: SITUATIONAL (anti-heavy at L3). Counterplay: field cheap
  // fighters; the warrant only bites a 2-play target.
  's1-wiretap-order': {
    2: stage('Transcript', [on('enter', draw(1))]),
    // A proper warrant cannot seize a healthy subject or a cheap decoy.
    // The chosen expensive rival must already be hurt and at 4 life or less.
    3: stage('Big-Fish Warrant', [
      on('enter', when('targetHeavy', execute(4))),
    ]),
  },
  // Arc: a deadfall loaded with blue ink -> the ink cloud hides the crew next
  // door -> blackwater blooms through the whole sewer and stings everyone.
  // Trajectory: ROLE SHIFT (single trap -> cover -> citywide sting).
  // Counterplay: scan it; the sting is only 1, so sturdy fighters shrug it.
  's1-blue-ink-deadfall': {
    2: stage('Ink Cloud', [on('spring', guard(2, 'adjacentAllies'))]),
    3: stage('Blackwater Bloom', [on('spring', damage(1, 'allFoes', true))]),
  },
  // Arc: an antenna of needle-wire -> it jams the fighter across on install
  // -> the threaded needle runs through every seam beside the target too.
  // Trajectory: ROLE SHIFT (piercing -> install-time stun -> splash).
  // Counterplay: spread out so the needle finds no neighbors; strike the
  // wearer before it lands a hit.
  's1-needle-wire': {
    2: stage('Relay Spike', [on('enter', stun('across'))]),
    3: stage('Threaded Needle', [on('hit', damage(1, 'adjacentFoes', true))]),
  },
  // Arc: a drainpipe detective whose questions stop you walking -> good cop
  // slows the suspect across -> the confession: the first knockout names
  // the rival's strongest fighter.
  // Trajectory: EARNED (the L3 confession needs a knockout). Counterplay:
  // armor up the suspect across; without a knockout nobody is named.
  's2-undertow-drainpipe-interrogator': {
    2: stage('Good Cop', [], { hex: { n: 1, to: 'across' } }),
    3: stage('The Confession', [
      on('enter', stun('across')),
      on('kill', stun('strongestFoe')),
    ]),
  },
  // Arc: a slow watchman deep under the city -> the night shift keeps his
  // neighbors covered -> the jailer of the deep stops fighting and locks the
  // cell across every night.
  // Trajectory: PRICE (the L3 jailer never strikes). Counterplay: leave the
  // alley across empty or feed it a cheap decoy, and race its lane: it no
  // longer hits back.
  's2-undertow-subsurface-warden': {
    2: stage('Night Shift', [on('turnStart', guard(1, 'adjacentAllies'))]),
    3: stage('Jailer of the Deep', [on('roundEnd', stun('across'))], {
      pacifist: true,
    }),
  },
  // Arc: the surveillance ledger left on the wrong desk -> an open alley
  // reads it aloud to the rival boss -> a burned informant's whistleblower
  // file goes public.
  // Trajectory: EARNED ONE-SHOT (L3 pays only once an ally has fallen).
  // Counterplay: keep its alley occupied at L2; at L3 avoid knockouts until
  // it is spent.
  's2-undertow-floodlight-leak': {
    2: stage('Wrong Desk', [on('enter', when('acrossEmpty', boss(2)))]),
    3: stage('Whistleblower', [on('enter', when('allyFell', boss(4)))]),
  },
  // Arc: a receipt kept underwater -> the paper trail feeds the files ->
  // the hush order freezes every witness in the neighboring alleys.
  // Trajectory: ROLE SHIFT (a heavy stun evolves into a three-lane lockdown).
  // Counterplay: spread threats apart and force this two-play spell early.
  's2-undertow-backwater-iou': {
    // A paper trail promotes one still-unseen card, so the upgrade arrives
    // naturally on the next shuffle instead of generating an extra card.
    2: stage('Paper Trail', [on('enter', promote('deck'), draw(1))]),
    3: stage('Witness Protection Racket', [
      on('enter', stun('adjacentFoes'), promote('hand')),
    ]),
  },
  // Arc: a checkpoint wire with literal fine print -> every toll feeds the
  // boss -> the toll plaza resets for the next car.
  // Trajectory: STEADY (sustain, then a second toll). Counterplay: scan it,
  // or spend it with a cheap runner twice.
  's2-undertow-culvert-tollwire': {
    2: stage('Toll Collected', [on('spring', mend(2))]),
    3: stage('Toll Plaza', [on('spring', mend(2), rearm())]),
  },
  // Arc: spikes with a microphone inside -> the live feed arrives with the
  // install -> the party line taps every fighter beside the wearer.
  // Trajectory: ROLE SHIFT (one snare -> information -> crew-wide snares).
  // Counterplay: armor blunts snare; kill the wearer's neighbors first.
  's2-undertow-wiretap-spikes': {
    2: stage('Live Feed', [on('enter', draw(1))]),
    3: stage('Party Line', [on('enter', grant('snare', 'adjacentAllies'))]),
  },
  // Arc: a patient drainpipe sniper -> a lone perch with nobody to give it
  // away -> overwatch: it stops trading blows and fires every morning.
  // Trajectory: EARLY BLOOMER (a sharper L1; at L3 it gives up striking for
  // a steady shot). Counterplay: rush its lane, it never hits back; armor
  // the strongest foe or keep it in hand.
  's3-undertow-drain-sniper': {
    stats: { 1: { attack: 1 } },
    2: stage('Lone Perch', [], { lone: 2 }),
    3: stage('Overwatch', [on('turnStart', damage(2, 'strongestFoe', true))], {
      pacifist: true,
    }),
  },
  // Arc: an eel that asks questions with electricity -> each answer arcs to
  // the neighbors -> it dumps its whole charge into the water at once and
  // is only a little eel afterwards.
  // Trajectory: EARLY BLOOMER, the faction's one weaker L3: a much smaller
  // body for a citywide shock. Counterplay: the shock is one burst; the eel
  // left behind dies to an ordinary strike.
  's3-undertow-interrogation-eel': {
    stats: { 3: { attack: -2, hp: -12 } },
    2: stage('Live Wire', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('Shock Net', [on('enter', damage(2, 'allFoes', true))]),
  },
  // Arc: a watcher in a hidden room -> soundproofed walls blunt each raid ->
  // the long game: every night it survives, it knows more.
  // Trajectory: LATE BLOOMER (patience payoff). Counterplay: raid early and
  // hard; regen and shields lose to burst.
  's3-undertow-quiet-listener': {
    2: stage('Soundproofed', [on('turnStart', guard(1, 'self'))]),
    3: stage('The Long Game', [on('turnStart', sharpen(1, 'self'))]),
  },
  // Arc: an operative who brings the rain -> a cloudburst of needles on
  // arrival -> the monsoon pins down everyone beside the target.
  // Trajectory: EARLY BLOOMER (a sturdier L1 body; later levels add area
  // chip, then lockdown, instead of more bulk). Counterplay: spread out;
  // pierce through its armor before it strikes.
  's3-undertow-needle-rain-agent': {
    stats: { 1: { hp: 2 } },
    2: stage('Cloudburst', [on('enter', damage(1, 'laneFoes', true))]),
    3: stage('Needle Monsoon', [on('hit', stun('adjacentFoes'))]),
  },
  // Arc: a basement guard dog -> its last bark holds the intruder in place
  // -> off the leash, it goes straight for the weakest trespasser.
  // Trajectory: EARLY BLOOMER (a sharp one-drop, then utility). Counterplay:
  // keep the weakest foe sturdy; flank wide of its alley.
  's3-undertow-basement-watchdog': {
    stats: { 1: { attack: 1 } },
    2: stage('Alarm Bark', [on('death', stun('across'))]),
    3: stage('Off the Leash', [on('enter', duel('weakestFoe'))]),
  },
  // Arc: something huge stirs below -> the undertow pulls its opposite under
  // -> it surfaces as a tidal surge, or sinks deep and waits.
  // Trajectory: LATE BLOOMER, choose one at L3. Counterplay: kite it (short
  // stride); the surge needs foes nearby, the deep dweller never reaches.
  's3-undertow-sewer-leviathan': {
    2: stage('Undertow Pull', [on('enter', stun('across'))]),
    3: stage('Tidal Surge', [on('enter', damage(2, 'laneFoes'))]),
    // Choose one: or stay down in the deep and shrug off every blow. The CPU
    // surfaces whenever there is anything to hit.
    choice: {
      stage: stage('Deep Dweller', [on('turnStart', guard(2, 'self'))]),
      cpu: 'foesPresent',
    },
  },
  // Arc: weep holes let water through the wall -> the seepage stings the
  // nearest foes -> the wall weeps open and floods the section.
  // Trajectory: LATE BLOOMER (a scan that becomes a mass stun).
  // Counterplay: spread fighters out; the flood holds one strike only.
  's3-undertow-weep-holes': {
    2: stage('Seepage', [on('enter', damage(1, 'laneFoes'))]),
    3: stage('The Wall Weeps Open', [on('enter', stun('laneFoes'))]),
  },
  // Arc: a sting on a very long line -> it reaches past the target to the
  // weakest -> a paralytic line that also catches the biggest fish.
  // Trajectory: LATE BLOOMER (one stun becomes two). Counterplay: the second
  // stun picks the strongest, so a lone heavy is stunned only once.
  's3-undertow-long-drain-sting': {
    2: stage('Long Reach', [on('enter', damage(1, 'weakestFoe', true))]),
    3: stage('Paralytic Line', [on('enter', stun('strongestFoe'))]),
  },
  // Arc: a second listening post sweeps the convoy route -> the convoy
  // shakes off its stuns -> the ledger opens: publish a hit list, or quietly
  // cook the books.
  // Trajectory: SITUATIONAL, choose one at L3. Counterplay: keep weak
  // fighters off the board; against the books, simply out-damage the heal.
  's3-undertow-reveal-the-ledger': {
    2: stage('Convoy Cleared', [on('enter', cleanse('allies'))]),
    3: stage('Hit List', [on('enter', damage(3, 'weakestFoe', true))]),
    // Choose one: or cook the books and patch the boss. The CPU publishes
    // the hit list whenever a foe is on the field.
    choice: {
      stage: stage('Cook the Books', [on('enter', mend(3))]),
      cpu: 'foesPresent',
    },
  },
  // Arc: a quiet word in a fighter's ear -> an armor-piercing warrant ->
  // the interdiction pins the foe across before it can move.
  // Trajectory: LATE BLOOMER (gear-like spell becomes control).
  // Counterplay: leave the alley across empty; the stun lasts one strike.
  's3-undertow-quiet-interdiction': {
    2: stage('Piercing Warrant', [on('enter', grant('pierce', 'target'))]),
    3: stage('Interdiction', [on('enter', stun('across'))]),
  },
  // Arc: one blackmail letter -> hush money flows back to the boss ->
  // everyone in the city has a file, yours included: nobody moves.
  // Trajectory: PRICE (L3 freezes your own crew too, for a full stall).
  // Counterplay: fighters played after it strike freely; hold them back.
  's3-undertow-citywide-blackmail': {
    2: stage('Hush Money', [on('enter', mend(2))]),
    3: stage('Everyone Has a File', [
      on('enter', stun('allFoes'), stun('allies'), mend(3)),
    ]),
  },
  // Arc: a pressure sensor wrapped in red tape -> it relays the alarm to
  // the neighbors -> everyone near the trespasser is held pending review.
  // Trajectory: ROLE SHIFT (damage -> splash alarm -> crowd control, paying
  // on a crowded line). Counterplay: scan it; walk a lone runner into an
  // empty stretch.
  's3-undertow-red-tape-sensor': {
    2: stage('Sensor Relay', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Pending Review', [on('spring', stun('adjacentFoes'))]),
  },
  // Arc: a hidden clamp on the floodgate -> it bites heavy traffic hardest
  // -> the floodgates open on the whole crossing.
  // Trajectory: SITUATIONAL (anti-heavy, then area). Counterplay: take the
  // wider route; send a cheap runner first.
  's3-undertow-floodgate-clamp': {
    2: stage('Clamp Down', [
      on('spring', when('targetHeavy', damage(2, 'target'))),
    ]),
    3: stage('Floodgates Open', [on('spring', damage(2, 'laneFoes'))]),
  },
  // Arc: an invisible invoice -> the late fee stops the runner cold -> the
  // bill is forwarded to the rival boss.
  // Trajectory: ROLE SHIFT (damage -> stall -> boss pressure). Counterplay:
  // scan it; at L3 the runner walks on unharmed.
  's3-undertow-anonymous-invoice': {
    2: stage('Late Fee', [on('spring', stun('target'))]),
    3: stage('Billed to the Boss', [on('spring', boss(3))]),
  },
  // Arc: a periscope lens spots the seams -> it spots for the fighters
  // beside the wearer -> a knockout hands it a firing solution on the
  // strongest foe.
  // Trajectory: EARNED (the L3 shot needs a knockout). Counterplay: armor
  // and big life deny the knockout; spread out to dodge the spotter.
  's3-undertow-periscope-lens': {
    2: stage('Spotter', [], { aura: { n: 1, to: 'adjacentAllies' } }),
    3: stage('Firing Solution', [on('kill', damage(3, 'strongestFoe', true))]),
  },
  // Arc: a tunnel harpoon on a barbed line -> it punishes a pinned foe ->
  // the whaler's gamble: fire at the biggest thing in the sewer.
  // Trajectory: PRICE (the L3 duel can cost the wearer). Counterplay: a
  // stronger foe wins the duel; stun-proof heavies shrug the barbs.
  's3-undertow-tunnel-harpoon': {
    2: stage('Barbed Line', [], { bully: 2 }),
    3: stage("Whaler's Gamble", [on('enter', duel('strongestFoe'))]),
  },
}
