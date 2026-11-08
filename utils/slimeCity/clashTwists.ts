/** Clash-only hand text for real, tested L1/L2/L3 departures from stat scaling. */
export const CLASH_TWISTS: Record<string, [string, string, string]> = {
  calico: [
    'Guards the clinic lane.',
    'Mends adjacent allies for 1 life after each full round.',
    'Never attacks. Mends adjacent allies for 2 each full round.',
  ],
  chimera: [
    'Unstable prototype: weak now, terrifying later.',
    'Rebuilt for the next hunt.',
    'Apex: +2 attack and +3 life.',
  ],
  sprite: [
    'The first dancer in a potential crowd.',
    'On entry, adds a weak dancer to one empty neighboring alley.',
    'Adds dancers to both empty neighboring alleys.',
  ],
  queen: [
    'The crowd makes the queen stronger.',
    'While present, adjacent friends gain +1 strike power.',
    'All friendly fighters gain +1 power.',
  ],
  welder: [
    'A workhorse who can hold the line.',
    'Mends adjacent friends for 1 life after each full round.',
    'Mends adjacent friends for 2 life after each full round.',
  ],
  juggernaut: [
    'Rusty chassis: barely punches until rebuilt.',
    'The pistons wake up with a serious strike.',
    'Siege mode: extra attack and armor for adjacent friends on entry.',
  ],
  rat: [
    'Every knockout adds +1 attack to later copies, up to +3.',
    'Returns harder after each knockout; detonates when it falls.',
    'On defeat, blasts neighboring enemies for 2.',
  ],
  firebrand: [
    'Its fuse burns predictably. For now.',
    'On attack, 50% chance to miss; otherwise double the strike.',
    'On attack, 25% chance to miss; otherwise double the strike.',
  ],
  watcher: [
    'Low-profile lookout with a sharp eye.',
    'Reduces a rival strike in its own alley by 1.',
    'Never attacks. Reduces rival power across three alleys by 1.',
  ],
  frogtrooper: [
    'Tongue snare interrupts a rival.',
    'Gains +1 strike power versus a rooted defender.',
    'A damaging strike also roots nearby rival fighters.',
  ],
  broker: [
    'Makes a fair offer. Allegedly.',
    'Replace a friendly fighter to inherit +2 attack and 2 life.',
    'Replace a friendly fighter to inherit +3 attack and 4 life.',
  ],
  collector: [
    'Starts a ledger every time a fighter falls.',
    'Gains +1 attack whenever a rival fighter falls, up to 10.',
    'Gains +1 attack and heals 1 whenever a rival fighter falls.',
  ],
  'merc-roof-dentist': [
    'Sturdy medic with questionable certification.',
    'Mends adjacent friends for 1 life after each full round.',
    'Never attacks. Mends adjacent friends for 2 each full round.',
  ],
  'merc-smog-moth': [
    'Tiny flyer with a giant invitation list.',
    'On entry, adds a weak courier to an empty neighboring alley.',
    'On entry, adds weak couriers to both empty neighboring alleys.',
  ],
  'merc-union-owl': [
    'Organizes one lonely shift.',
    'Adjacent friendly fighters gain +1 strike power.',
    'Every friendly fighter gains +1 strike power.',
  ],
  // Second wave: earned level-three transformations, not merely stat budgets.
  lynx: [
    'An Ambush scout strikes first.',
    'When deployed opposite an empty alley, gains +1 attack permanently.',
    'Calls a weak decoy into a free neighboring alley on arrival.',
  ],
  pounce: [
    "Refresh the target fighter's Ambush strike.",
    'Also refresh and give +1 power this round to one adjacent friend.',
    'Both adjacent friends gain +2 power this round and refresh Ambush.',
  ],
  reknit: [
    'Heal a fighter.',
    'Heal the target and wounded neighboring friends for 2 extra life.',
    'Also revive a fallen friendly fighter as a frail echo in a free alley.',
  ],
  laser: [
    'Stun one rival fighter.',
    'Also stuns one adjacent rival.',
    'Stuns both adjacent rivals as the laser dances across three alleys.',
  ],
  pogo: [
    'An unpredictable crowd-surfer.',
    'On a strike, a seeded 50/50 roll makes it whiff or hit for double.',
    'Hits double without whiffing while an ally stands next door.',
  ],
  razor: [
    'A duelist who heals from a hit.',
    'Damaging a rival also heals neighboring friends for 1.',
    'Every friendly fighter heals 1 whenever Razorwing lands a hit.',
  ],
  mosh: [
    'Blast a rival and its neighbors.',
    'The mosh reaches two alleys away for 1 more damage.',
    'An entire enemy row takes 1 more; friendly fighters take 1 too.',
  ],
  scrapper: [
    'Reliable armored brawler.',
    'Adjacent friends gain 1 shield at the start of each friendly turn.',
    'Every friendly fighter starts its turn with 1 fresh shield.',
  ],
  bulldozer: [
    'Overkill smashes through to the rival boss.',
    'Ignores one extra armor on a blocked strike.',
    'A hit against a blocker also shakes 2 life from the rival boss.',
  ],
  plating: [
    'One fighter gains permanent armor.',
    'Adjacent fighters gain +1 armor too.',
    'Every friendly fighter gains +1 armor on installation.',
  ],
  bomber: [
    'Explodes when defeated.',
    'Also blasts neighboring rivals for 2 on defeat.',
    'On defeat, hits every rival fighter for 2 and nearby friends for 1.',
  ],
  kaboom: [
    'A heavy piercing fighter.',
    'Gains +1 attack when a friendly Volatile fighter dies.',
    'Gains +2 attack on allied Volatile death and strikes the rival boss for 1.',
  ],
  confetti: [
    'Blast a rival and its neighboring enemies.',
    'Also hits neighboring friends for 1, and rivals beside the target for 2.',
    'Fireworks across every alley: 2 to all other enemies, 1 to friends.',
  ],
  eel: [
    'Pierces the rival armor.',
    'Hitting a stunned rival shocks one adjacent enemy for 1.',
    'A hit also shocks rivals standing in armed trap alleys for 2.',
  ],
  oracle: [
    'A dangerous prophet with a piercing snare.',
    'Starts each friendly turn with 2 prophetic shield.',
    'Shields itself and both neighboring allies for 2 each turn.',
  ],
  tripwire: [
    'Lays a hidden stun trap.',
    'Also arms an empty neighboring alley.',
    'Arms both free neighboring alleys with separate traps.',
  ],
  sonar: [
    'Disarm a rival trap in one alley.',
    'Also scan neighboring alleys and draw one bonus card.',
    'Sweep all five trap alleys and draw two bonus cards.',
  ],
  repo: [
    'Cheap fighter looking for collateral.',
    'Gains +1 permanent attack whenever a friendly fighter falls.',
    'Gains +2 permanent attack and refunds 1 boss life on an allied death.',
  ],
  mogul: [
    'Collects a bounty when it defeats a rival.',
    'Nearby collectors get +1 attack while the Mogul stands.',
    'All collectors gain +1 attack; a collector knockout heals your boss 1.',
  ],
  handshake: [
    'Give one friend Collect.',
    'Adjacent friends also gain Collect.',
    'Every friendly fighter gains Collect while the ink is wet.',
  ],
  foreclosure: [
    'Hurt and stun a rival.',
    'A knockout reimburses 2 of your boss life.',
    'On knockout also hires a weak debtor in a vacant friendly alley.',
  ],
  'merc-debt-slug': [
    'A slow collector waiting for disaster.',
    'Gains +1 attack when an allied fighter falls.',
    'Gains attack and life whenever any fighter falls, either side.',
  ],
  'merc-fungal-bouncer': [
    'Guards its own door.',
    'Gives one neighboring ally 2 shield at the start of its turn.',
    'Gives both neighboring friends 2 shield each friendly turn.',
  ],
  'merc-discount-angel': [
    'An unstable helper with a clearance-bin halo.',
    'When an allied fighter dies, heals nearby friends for 2.',
    'Once per round, an allied loss summons a weak rescued echo.',
  ],
}

export function clashTwistText(id: string, level: number): string {
  return (
    CLASH_TWISTS[id]?.[Math.min(2, Math.max(0, Math.round(level) - 1))] ?? ''
  )
}
