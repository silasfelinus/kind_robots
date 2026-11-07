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
}

export function clashTwistText(id: string, level: number): string {
  return CLASH_TWISTS[id]?.[Math.min(2, Math.max(0, Math.round(level) - 1))] ?? ''
}
