// QUEEN PIN & THE BLOODFAIRIES: crafted evolutions (CLASH-EVOLUTION-PLAN.md in
// conductor). Cards designed one at a time, story first, following
// evolutions/catgirls.ts. The faction owns the crowd (echo tokens, SWARM),
// life-steal (LEECH, boss drains) and encores (replays, second springs);
// it borrows stuns and gambles only once or twice and never leans on armor.
// One weaker level three (Moshpit Firefly); three choose-one level threes
// (Glitter Riot Choir, Riot Karaoke Oracle, Encore or Die).
import {
  boss,
  damage,
  draw,
  duel,
  grant,
  heal,
  life,
  mend,
  on,
  power,
  rearm,
  retreat,
  revive,
  sharpen,
  stage,
  stun,
  summon,
  when,
  type CardEvolution,
} from './dsl'

export const BLOODFAIRY_EVOLUTIONS: Record<string, CardEvolution> = {
  // ------------------------------------------------------------ fighters
  // Arc: a tiny dancer in outrageous boots -> pogoes through the pit picking
  // pockets for the boss -> crowd-surfs out, and the whole pit drinks to it.
  // Trajectory: PRICE (the big payoff needs it to fall). Counterplay: stun
  // it and leave it standing; burst the crew before it drops.
  'pogo-punk': {
    2: stage('Pit Pickpocket', [on('hit', mend(1))]),
    3: stage('Crowd-Surf Exit', [on('death', heal(2, 'allies'), mend(2))]),
  },
  // Arc: a glitter choir screaming in harmony -> three-part harmony lifts the
  // singers beside it -> a wall of sound for the whole crew, or a stage
  // crowded with backup singers.
  // Trajectory: EARLY BLOOMER / ROLE SHIFT. The glass-cannon striker trades
  // its own hits for a band-wide amp. Counterplay: area blasts flatten the
  // backup singers; the wall never strikes, so ignore it and hit the band.
  's1-riot-choir': {
    2: stage('Three-Part Harmony', [], {
      aura: { n: 1, to: 'adjacentAllies' },
    }),
    3: stage('Wall of Sound', [], {
      pacifist: true,
      aura: { n: 1, to: 'otherAllies' },
    }),
    // Choose one: or bring the backup singers on stage. The CPU builds the
    // wall when it already has a crowd to amplify.
    choice: {
      stage: stage(
        'Backup Singers',
        [on('enter', summon('neighbors', 1, 1, ['swarm']))],
        { aura: { n: 1, to: 'adjacentAllies' } },
      ),
      cpu: 'crowd',
    },
  },
  // Arc: hides inside a soda can -> shaken up, it pops the tab dizzy but
  // strikes first -> a pocket-sized problem that picks a fight with the
  // weakest kid on the block.
  // Trajectory: LATE BLOOMER (the L2 ambush costs 2 life; a free ambush
  // pushed the crew past parity in CPU sweeps). Counterplay: a trap in its
  // alley finishes the dizzy punk; keep no fragile fighter on the board.
  's1-pocket-punk': {
    2: stage('Shaken Soda Can', [
      on('enter', grant('ambush', 'self'), damage(2, 'self')),
    ]),
    3: stage('Picks a Fight', [
      on('enter', grant('ambush', 'self'), duel('weakestFoe')),
    ]),
  },
  // Arc: a mosquito spinning records -> the request line passes the sip to
  // the dancers beside the booth -> the DJ stays behind the decks while the
  // whole floor learns to drink.
  // Trajectory: EARLY BLOOMER (gives up its own strikes at L3).
  // Counterplay: armor and big single hits outpace a 1-life sip; kill the
  // crew before the leech adds up.
  's2-bloodfairies-mosquito-disc-jockey': {
    2: stage('Request Line', [on('enter', grant('leech', 'adjacentAllies'))]),
    3: stage(
      'Behind the Decks',
      [on('enter', grant('leech', 'allies'), power(1, 'allies'))],
      { pacifist: true },
    ),
  },
  // Arc: a walking speaker stack -> its sub-bass rattles the fighters beside
  // its victim -> the bass drop, a shockwave that shakes three alleys and
  // the band standing next to it.
  // Trajectory: ROLE SHIFT (bruiser, then an arrival shockwave).
  // Counterplay: spread out of its three alleys; its own neighbors take the
  // drop too, so a crowded band pays for it.
  's2-bloodfairies-bassquake-colossus': {
    2: stage('Sub-Bass Rumble', [on('hit', damage(1, 'adjacentFoes'))]),
    3: stage('The Bass Drop', [
      on('enter', damage(2, 'laneFoes'), damage(1, 'adjacentAllies')),
    ]),
  },
  // Arc: a tiny scout that glows in the dark -> its light dazzles the rival
  // across -> it bursts into a firefly cloud that fills every empty alley.
  // Trajectory: EARLY BLOOMER, the faction's one weaker level three: a much
  // smaller body for a big arrival. Counterplay: one splash clears the 1/1
  // cloud; the firefly itself dies to almost anything.
  's3-bloodfairies-mosh-firefly': {
    stats: { 3: { attack: -2, hp: -7 } },
    2: stage('Dazzling Glow', [on('tap', power(1, 'adjacentAllies'))], {
      hex: { n: 1, to: 'across' },
    }),
    3: stage('Firefly Cloud', [
      on('enter', summon('everyEmpty', 1, 1, ['swarm'])),
      on('tap', power(1, 'allies')),
    ]),
  },
  // Arc: a punk queen dusting pollen -> the pollen drifts and mends the
  // dancers beside her -> the royal bloom: she stops fighting and the hive
  // grows around her every turn.
  // Trajectory: EARLY BLOOMER into an engine (never strikes at L3).
  // Counterplay: area blasts punish the chorus; fill her neighboring alleys
  // or kill her and the bloom stops.
  's3-bloodfairies-pollen-queen': {
    2: stage('Pollen Drift', [on('turnStart', heal(1, 'adjacentAllies'))]),
    3: stage('Royal Bloom', [on('turnStart', summon('neighbors', 1, 1))], {
      pacifist: true,
    }),
  },
  // Arc: a vamp lurking backstage -> every bite makes it a little bigger ->
  // its victims rise as new fans with fangs.
  // Trajectory: EARNED (each knockout pays). Counterplay: armor blocks the
  // bite entirely; a blocker it cannot kill never turns.
  's3-bloodfairies-backstage-vamp': {
    2: stage('Acquired Taste', [on('hit', life(1, 'self'))]),
    3: stage('Turned', [
      on('hit', life(1, 'self')),
      on('kill', summon('nearest', 2, 2, ['leech'])),
    ]),
  },
  // Arc: an oracle singing prophecies at karaoke -> an off-key omen freezes
  // the rival across before the ambush -> a stadium singalong, or a solo
  // prophecy that reads the next two songs.
  // Trajectory: SITUATIONAL (the crowd decides the level three).
  // Counterplay: a solo concert falls flat: thin the crew below two; scan or
  // spend the stun with a cheap fighter.
  's3-bloodfairies-karaoke-oracle': {
    2: stage('Off-Key Omen', [on('enter', stun('across'))]),
    3: stage('Stadium Singalong', [
      on('enter', when('crowd', sharpen(1, 'allies'))),
    ]),
    // Choose one: or sing alone and read the future. The CPU leads the
    // singalong only with two or more allies already on the field.
    choice: {
      stage: stage('Solo Prophecy', [on('enter', draw(2))]),
      cpu: 'crowd',
    },
  },
  // Arc: a bus full of noisy pixies -> drops one off at every stop -> when
  // the bus is wrecked, the whole tour spills out swinging.
  // Trajectory: ROLE SHIFT (one fighter becomes a crowd). Counterplay: kill
  // it where both neighboring alleys are already full; splash the 1/1s.
  's3-bloodfairies-tour-bus': {
    2: stage('Next Stop', [on('enter', summon('nearest', 1, 1))]),
    3: stage('Everybody Off the Bus', [
      on('enter', summon('nearest', 1, 1)),
      on('death', summon('neighbors', 2, 2, ['swarm'])),
    ]),
  },
  // Arc: the blood-moon headliner -> every boss hit feeds the crowd ->
  // the show does not end when it falls: it comes back for the encore.
  // Trajectory: PRICE (the encore needs it to fall). Counterplay: block its
  // alley so it never reaches the boss; save area damage for the encore.
  's3-bloodfairies-headliner': {
    2: stage('Blood Moon Rising', [on('boss', heal(1, 'allies'))]),
    3: stage('One More Song', [
      on('boss', heal(1, 'allies')),
      on('death', summon('nearest', 4, 6, ['swarm', 'leech'])),
    ]),
  },

  // ----------------------------------------------------------- gear
  // Arc: a karaoke mic that drinks -> it passes the sip down the line ->
  // the blood karaoke finale: a knockout and the whole bar sings along.
  // Trajectory: EARNED (the finale needs knockouts). Counterplay: armor
  // stops the bite; stun the singer or stay out of its alley.
  's1-blood-mic': {
    2: stage('Pass the Mic', [on('hit', heal(1, 'woundedAlly'))]),
    3: stage('Blood Karaoke Finale', [
      on('kill', sharpen(1, 'self'), heal(1, 'allies')),
    ]),
  },
  // Arc: a roadie with a megaphone -> each hit calls the neighbors in ->
  // the riot call, every turn, once the crew is big enough to answer.
  // Trajectory: SITUATIONAL (crowd payoff). Counterplay: keep the crew
  // under three; stun the wearer before it lands a hit.
  's2-bloodfairies-roadie-megaphone': {
    2: stage('Bullhorn', [on('hit', power(1, 'adjacentAllies'))]),
    3: stage('Riot Call', [on('turnStart', when('crowd', power(1, 'allies')))]),
  },
  // Arc: a tour van radio playing for one solo star -> the solo-star FM hour
  // -> a pirate broadcast that puts the whole crew on the same song.
  // Trajectory: ROLE SHIFT (solo star to crew-wide SWARM). Counterplay: a
  // lone star is easy to gang up on; spread the crew to break SWARM.
  's3-bloodfairies-van-radio': {
    2: stage('Solo Star FM', [], { lone: 2 }),
    3: stage('Pirate Broadcast', [on('enter', grant('swarm', 'allies'))], {
      lone: 2,
    }),
  },
  // Arc: enchanted boots that pinch (a price paid in blisters as they go
  // on) -> an awkward fast dancer that fights the moment it laces up -> the
  // last encore: after a knockout it takes a bow and returns for one more.
  // Trajectory: PRICE (the boots cost life). Counterplay: a strong foe across
  // wins the sprint; deny the knockout and the encore never comes.
  's3-bloodfairies-encore-boots': {
    2: stage('Blister Sprint', [on('enter', duel('across'))]),
    3: stage('The Last Encore', [
      on('enter', life(5, 'self')),
      on('kill', retreat()),
    ]),
  },

  // ----------------------------------------------------------- spells
  // Arc: a confetti cannon loaded with shrapnel -> a second barrel fires at
  // random -> the ticker-tape parade, where the pit gets a party instead.
  // Trajectory: ROLE SHIFT (damage to celebration). Counterplay: the parade
  // power lasts one round; strike back after it fades.
  's1-confetti-cannon': {
    2: stage('Second Barrel', [on('enter', damage(1, 'weakestFoe'))]),
    3: stage('Ticker-Tape Parade', [
      on('enter', power(1, 'allies'), heal(1, 'allies')),
    ]),
  },
  // Arc: an unlicensed stage dive -> it reaches the front row -> it lands on
  // royalty, and nothing in the alley can stop the momentum.
  // Trajectory: LATE BLOOMER (the boss dive). Counterplay: keep the alley
  // blocked; a big blocker eats the bulldoze.
  's1-stage-dive': {
    2: stage('Front Row', [on('enter', when('acrossEmpty', boss(2)))]),
    3: stage('Dives on Royalty', [
      on('enter', grant('bulldoze', 'target')),
      on('enter', when('acrossEmpty', boss(2))),
    ]),
  },
  // Arc: the chorus shatters a window -> shards whip the band into a frenzy
  // -> a glitter flood that cuts every rival and the band beside it.
  // Trajectory: PRICE (it always cuts your own). Counterplay: spread out;
  // hit back while the cut band is low.
  's2-bloodfairies-glitterglass-flood': {
    2: stage('Shard Frenzy', [
      on('enter', damage(1, 'adjacentAllies'), power(2, 'adjacentAllies')),
    ]),
    3: stage('Glitter Flood', [
      on('enter', damage(2, 'allFoes'), damage(1, 'adjacentAllies')),
    ]),
  },
  // Arc: flyer bandages -> the smallest fairy gets patched first -> nobody
  // goes home: every hurt fairy learns to drink.
  // Trajectory: SITUATIONAL (a hurt crew). Counterplay: kill outright rather
  // than chip; the leech only matters on a fighter that lands hits.
  's2-bloodfairies-afterparty-first-aid': {
    2: stage('Smallest Fairy First', [on('enter', heal(2, 'woundedAlly'))]),
    3: stage('Nobody Goes Home', [
      on('enter', grant('leech', 'woundedAllies'), heal(1, 'woundedAllies')),
    ]),
  },
  // Arc: a feedback note -> the mic squeal pumps up the band beside it ->
  // a howlround that rattles every rival once the crowd is loud enough.
  // Trajectory: SITUATIONAL (crowd payoff). Counterplay: scatter the band
  // under three; the howl needs the crowd.
  's3-bloodfairies-feedback-burst': {
    2: stage('Mic Squeal', [on('enter', power(1, 'adjacentAllies'))]),
    // The band's encore costs no play slot with two other performers
    // already on the field. It never chains more than once per turn.
    3: {
      ...stage('Howlround', [on('enter', when('crowd', damage(2, 'allFoes')))]),
      freeIf: 'crowd',
    },
  },
  // Signature: a singer shares a little borrowed life with the band.
  // L1 gives the chosen singer LEECH in one Clash play slot. Its fragility
  // is obvious: silence or kill that singer before the next damaging hit.
  // L2 keeps the lead singer and teaches both neighbors to drink too.
  // L3's real choice: the crowd revives a fallen singer and EVERYBODY
  // gets LEECH (Encore!), or the lead burns out while adjacent allies
  // steal life in a louder, riskier chorus (Die Trying).
  // Combo: Riot Choir's Backup Singers turn spare lanes into sources
  // of LEECH; a fragile SWARM pack needs to strike to cash it in.
  // Counterplay: focused removal, armor, stun, or kill the VOLATILE
  // lead away from neighboring allies.
  's3-bloodfairies-encore': {
    2: stage('Second Verse', [on('enter', grant('leech', 'adjacentAllies'))]),
    3: stage('Everybody Sings', [
      on('enter', revive(2, 3), grant('leech', 'allies')),
    ]),
    choice: {
      stage: stage('Die Trying', [
        on(
          'enter',
          grant('leech', 'adjacentAllies'),
          sharpen(2, 'target'),
          grant('volatile', 'target'),
        ),
      ]),
      cpu: 'allyFell',
    },
  },
  // Arc: a singer dives from the rafters -> lands in the pit and joins the
  // swarm -> brings the lighting rig down on three alleys, and on itself.
  // Trajectory: PRICE (the diver is hurt too). Counterplay: stay out of the
  // three alleys; finish the bruised diver.
  's3-bloodfairies-rafter-dive': {
    2: stage('Rejoin the Pit', [on('enter', grant('swarm', 'target'))]),
    3: stage('The Rig Comes Down', [
      on('enter', damage(2, 'laneFoes'), damage(1, 'target')),
    ]),
  },
  // Arc: a tour medic with one patient -> a field transfusion drawn from the
  // rival across -> the blood bank opens: every rival bleeds, every fairy
  // drinks.
  // Trajectory: ROLE SHIFT (healer to drain). Counterplay: armor shrugs the
  // 1-point drain; it heals only a little each.
  's3-bloodfairies-festival-triage': {
    2: stage('Field Transfusion', [on('enter', damage(2, 'across'))]),
    3: stage('Mass Transfusion', [
      on('enter', damage(1, 'allFoes'), heal(1, 'allies')),
    ]),
  },
  // Arc: noise rock in a cathedral -> the hymn is tuned for giants -> the
  // glorious encore: a second blast lands somewhere, and the fans get hurt.
  // Trajectory: LATE BLOOMER. Counterplay: the encore is random; keep the
  // crew thin so the friendly fire costs them more than you.
  's3-bloodfairies-cathedral-noise': {
    2: stage('Hymn for Giants', [
      on('enter', when('targetHeavy', damage(3, 'target'))),
    ]),
    3: stage('Glorious Encore', [
      on('enter', damage(4, 'strongestFoe'), damage(1, 'allies')),
    ]),
  },

  // ----------------------------------------------------------- traps
  // Arc: a tripwire that plays a terrible chord -> the chord is the band's
  // cue to swing -> a power-chord avalanche that hits every rival.
  // Trajectory: ROLE SHIFT (cue, then area chord). Counterplay: scan it or
  // send a cheap runner first.
  'amp-tripwire': {
    2: stage('Cue the Band', [on('spring', sharpen(1, 'adjacentAllies'))]),
    3: stage('Power Chord Avalanche', [on('spring', damage(1, 'allFoes'))]),
  },
  // Arc: a hidden amplifier lead -> it siphons current into your boss ->
  // a blood amplifier that patches the whole band.
  // Trajectory: ROLE SHIFT (boss drain to crew heal). Counterplay: scan it;
  // burst damage outruns a 2-point patch.
  's1-feedback-wire': {
    2: stage('Siphon Lead', [on('spring', mend(2))]),
    3: stage('Blood Amplifier', [on('spring', heal(2, 'allies'))]),
  },
  // Arc: the wrong chord -> a catchy hook nicks the neighbors -> the earworm
  // spreads and three alleys forget their next move.
  // Trajectory: LATE BLOOMER (an alley-wide freeze). Counterplay: the stun
  // lasts one strike; scan or bait it with a runner.
  's2-bloodfairies-earworm-feedback': {
    2: stage('Catchy Hook', [on('spring', damage(1, 'adjacentFoes'))]),
    3: stage('Earworm Epidemic', [on('spring', stun('laneFoes'))]),
  },
  // Arc: a bootlace across the dance floor -> pickpockets patch a friend
  // while the victim is down -> the whole pit piles on.
  // Trajectory: SITUATIONAL (pile-on needs a crowd). Counterplay: watch that
  // entryway: scan it, or strike when the crew is thin.
  's3-bloodfairies-tripcord': {
    2: stage('Pit Pickpockets', [on('spring', heal(2, 'woundedAlly'))]),
    3: stage('Pile-On', [on('spring', when('crowd', damage(3, 'target')))]),
  },
  // Arc: a hidden live amp -> it arcs to a random rival -> it stays live
  // and arms again for the next fool.
  // Trajectory: EARNED ONE-SHOT (a second spring). Counterplay: scan it, or
  // spend both springs with cheap runners.
  's3-bloodfairies-amp-socket': {
    2: stage('Arc Flash', [on('spring', damage(2, 'weakestFoe'))]),
    3: stage('Still Live', [on('spring', damage(2, 'weakestFoe'), rearm())]),
  },
  // Arc: the bouncer slips -> it owes the cover charge -> the whole pit
  // erupts, and a new dancer climbs onstage in the emptied alley.
  // Trajectory: ROLE SHIFT (boss chip, then a fresh crowd fighter).
  // Counterplay: scan it; fill their remaining alleys to deny the encore.
  's3-bloodfairies-banana-bouncer': {
    2: stage('Cover Charge', [on('spring', boss(2))]),
    3: stage('The Pit Wants an Encore', [
      on('spring', boss(2), summon('nearest', 2, 3, ['swarm'])),
    ]),
  },
}
