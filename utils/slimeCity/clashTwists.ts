/** Clash-only hand text for real, tested L1/L2/L3 departures from stat scaling. */
export const CLASH_TWISTS: Record<string, [string, string, string]> = {
  calico: [
    '',
    'REGEN. At the end of every round, heal adjacent allies for 1 life.',
    'REGEN. Never attacks. At the end of every round, heal adjacent allies for 2 life.',
  ],
  chimera: [
    '',
    '',
    'Apex: +2 ATK, +3 LIFE; REGEN to weakest neighbor.',
  ],
  sprite: [
    '',
    'On arrival, summon a weak dancer into one empty adjacent alley.',
    'On arrival, summon SWARM dancers into both empty adjacent alleys.',
  ],
  queen: [
    '',
    'While present, adjacent friendly fighters gain +1 power.',
    'While present, every friendly fighter gains +1 power.',
  ],
  welder: [
    '',
    'Mends adjacent friends for 1 life after each full round.',
    'Mends adjacent friends for 2 life after each full round.',
  ],
  juggernaut: [
    '',
    '',
    'Arrive: adjacent allies gain +1 armor.',
  ],
  rat: [
    'Every knockout adds +1 attack to later copies, up to +3.',
    'Each prior Riot Rat death adds +1 attack (max +3). Explodes on defeat.',
    'Each prior Riot Rat death adds +1 attack (max +3); death blasts adjacent foes for 2.',
  ],
  firebrand: [
    '',
    'On attack, 50% chance to miss; otherwise double the strike.',
    'On attack, 25% chance to miss; otherwise double the strike.',
  ],
  watcher: [
    '',
    'While present, the rival across its alley loses 1 strike power.',
    'Never attacks. Rivals across its alley and both neighbors lose 1 strike power.',
  ],
  frogtrooper: [
    '',
    'Gains +1 strike power versus a stunned defender.',
    'On a damaging strike, stun rival fighters in adjacent alleys.',
  ],
  broker: [
    '',
    'When replacing an allied fighter, kill it and gain +2 attack and +2 life.',
    'When replacing an allied fighter, kill it and gain +3 attack and +4 life.',
  ],
  collector: [
    '',
    'Whenever a rival fighter dies, gain +1 attack (max 10).',
    'Whenever a rival fighter dies, gain +1 attack (max 10) and heal 1.',
  ],
  'merc-roof-dentist': [
    '',
    'Mends adjacent friends for 1 life after each full round.',
    'Never attacks. Mends adjacent friends for 2 each full round.',
  ],
  'merc-smog-moth': [
    '',
    'On entry, adds a weak courier to an empty neighboring alley.',
    'On arrival, summon a weak courier in each empty neighboring alley.',
  ],
  'merc-union-owl': [
    '',
    'Adjacent friendly fighters gain +1 strike power.',
    'Every friendly fighter gains +1 strike power.',
  ],
  // Second wave: earned level-three transformations, not merely stat budgets.
  lynx: [
    '',
    'AMBUSH. Arriving across an empty alley permanently adds +1 attack.',
    'AMBUSH. Arriving across an empty alley adds +1 attack; also summon a fragile decoy in a free neighboring alley.',
  ],
  pounce: [
    "Boost a fighter's power this round and refresh its AMBUSH strike.",
    'Boost the target and refresh AMBUSH; one adjacent ally gains +1 power this round and refreshes AMBUSH.',
    'Boost the target and refresh AMBUSH; both adjacent allies gain +2 power this round and refresh AMBUSH.',
  ],
  reknit: [
    'Heal one friendly fighter.',
    'Heal the chosen fighter and restore 2 life to its wounded neighbors.',
    'Heal the target and adjacent wounded allies for 2; revive your last fallen ally as a fragile echo in a free lane.',
  ],
  laser: [
    'Stun a rival fighter in the chosen alley.',
    'Stun the target and one neighboring rival; damage the target for 1.',
    'Stun the target and both neighboring rivals; damage the target for 2.',
  ],
  pogo: [
    '',
    'Strikes for double damage while a friend stands next door.',
    'Strikes for double damage, even without a friend beside it.',
  ],
  razor: [
    '',
    'When a strike damages a rival, heal adjacent allies 1 life.',
    'When a strike damages a rival, heal all friendly fighters 1 life.',
  ],
  mosh: [
    'Damage a rival and the fighters next to it.',
    'Blast target and neighbors; foes two alleys away take 1.',
    'Blast target and nearby foes; distant rivals and every ally take 1.',
  ],
  scrapper: [
    '',
    'Adjacent friends gain 1 shield at the start of each friendly turn.',
    'Every friendly fighter starts its turn with 1 fresh shield.',
  ],
  bulldozer: [
    '',
    'Ignores one extra armor on a blocked strike.',
    'A strike that damages a blocker also deals 2 to the rival boss.',
  ],
  plating: [
    'One fighter gains permanent armor.',
    'Adjacent fighters gain +1 armor too.',
    'Every friendly fighter gains +1 armor on installation.',
  ],
  bomber: [
    '',
    'On defeat, explode and deal 2 to rivals in adjacent alleys.',
    'On defeat, deal 2 to all rivals and 1 to adjacent allies.',
  ],
  kaboom: [
    '',
    'Gains +1 attack when a friendly Volatile fighter dies.',
    'Gains +2 attack on allied Volatile death and strikes the rival boss for 1.',
  ],
  confetti: [
    'Blast a rival and its neighboring enemies.',
    'Blast a rival and neighboring foes for 2; friendly neighbors take 1.',
    'Blast the whole rival row; distant foes take 2 and every friendly fighter takes 1.',
  ],
  eel: [
    '',
    'Hitting a stunned rival shocks one adjacent enemy for 1.',
    'On a damaging hit, shock rivals in trapped alleys for 2.',
  ],
  oracle: [
    '',
    'At each friendly turn start, gain 2 temporary shield.',
    'At each friendly turn start, give itself and adjacent allies 2 shield.',
  ],
  tripwire: [
    'Lays a hidden stun trap.',
    'Arm a trap here and in one empty neighboring alley.',
    'Arm a trap here and in each empty neighboring alley.',
  ],
  sonar: [
    'Disarm a rival trap in one alley.',
    'Disarm rival traps in this and adjacent alleys; draw one card.',
    'Disarm rival traps in all five alleys; draw two cards.',
  ],
  repo: [
    '',
    'Gains +1 permanent attack whenever a friendly fighter falls.',
    'Gains +2 permanent attack and refunds 1 boss life on an allied death.',
  ],
  mogul: [
    '',
    'Nearby collectors get +1 attack while the Mogul stands.',
    'All collectors gain +1 attack; a collector knockout heals your boss 1.',
  ],
  handshake: [
    'Give one friend Collect.',
    'Give the target fighter COLLECT and grant it to adjacent allies.',
    'Give every friendly fighter COLLECT.',
  ],
  foreclosure: [
    'Hurt and stun a rival.',
    'Damage and stun a rival; a knockout heals your boss for 2.',
    'Damage and stun a rival; a knockout heals your boss 2 and summons a weak debtor in a free alley.',
  ],
  'merc-debt-slug': [
    '',
    'Gains +1 attack when an allied fighter falls.',
    'Gains attack and life whenever any fighter falls, either side.',
  ],
  'merc-fungal-bouncer': [
    '',
    'Gives one neighboring ally 2 shield at the start of its turn.',
    'At each friendly turn start, give 2 shield to both adjacent allies.',
  ],
  // Wave three: every journey branches into a mechanic, not a larger number.
  mau: [
    '',
    'AMBUSH. Strike with +1 power against a wounded defender.',
    'AMBUSH. Strike with +2 power against wounded defenders; damaging hits splash 2 onto one adjacent rival.',
  ],
  scentmine: [
    'Hidden trap: damage and stun the first rival entering this alley.',
    'Spring: damage and stun the intruder; stun a neighboring rival too.',
    'Spring: damage and stun the intruder; stun both neighboring foes and deal 1 damage to each.',
  ],
  ninthlife: [
    'Arrive beside an ally: it gains REGEN.',
    'Arrive: one neighboring ally gains REGEN and survives its next lethal hit at 1 life.',
    'Arrive: both neighboring allies gain REGEN and survive their next lethal hit at 1 life.',
  ],
  bloodwire: [
    'Hidden razor floss punishes one intruder.',
    'Spring: damage intruder and one neighboring rival for 1.',
    'Spring: damage intruder and both neighboring rivals for 2.',
  ],
  pinprick: [
    'Damage one rival fighter.',
    'Double the hit if its victim was already wounded.',
    'Double the hit; a wounded victim splashes 2 to adjacent foes.',
  ],
  feedback: [
    'Damage one rival fighter.',
    'Blast the target; with a friendly neighbor, hit adjacent foes for 1.',
    'Blast the target; with 4 friendly fighters, hit all other rivals for 2.',
  ],
  overclock: [
    'Give the target fighter a temporary power boost.',
    'Grant extra temporary power to the target fighter; it takes 1 recoil damage.',
    'Grant the target fighter +4 temporary power; it takes 3 recoil and nearby foes take 2.',
  ],
  shocktrap: [
    'Hidden plate damages and stuns its visitor (no attack or counterattack).',
    'On trigger, arcs 1 damage to one adjacent rival.',
    'When sprung, stun its visitor and deal 2 damage and stun to both adjacent rivals.',
  ],
  ducttape: [
    'Repair one friendly fighter.',
    'Repair and permanently add 1 armor.',
    'Repair, add armor and rebuild a fallen ally as a weak armored scrap echo.',
  ],
  firestorm: [
    'Roll seeded damage against one rival fighter.',
    'Roll seeded damage against a rival; reroll a weak result and keep the higher roll.',
    'Roll seeded damage, reroll weak damage; deal 2 to neighboring rivals and 1 to friendly neighbors.',
  ],
  fusevest: [
    'Equip a fighter with VOLATILE: it explodes when defeated.',
    "Grant VOLATILE; on defeat, deal 1 to the wearer's adjacent foes.",
    'Grant VOLATILE; on defeat, deal 1 to all rivals and neighboring allies.',
  ],
  drink: [
    'Temporarily boost the power of a friendly fighter.',
    'Seeded 50% chance to gain +2 extra surge; otherwise 1 recoil.',
    'Seeded 75% chance to gain +6 extra surge; otherwise 2 recoil.',
  ],
  blackout: [
    'Stun a rival fighter.',
    'Stun target and one adjacent rival; deal 1 to the target.',
    'Stun target and both adjacent rivals; deal 2 to target and 1 to each neighbor.',
  ],
  grate: [
    'Hidden grate wounds one intruder.',
    'When sprung, damage and stun the intruder (no attack or counterattack).',
    'When sprung, stun and damage the intruder; deal 2 to both adjacent rivals.',
  ],
  drysuit: [
    'Add armor to a friendly fighter.',
    'Wearer ignores the next stun and sheds current stun.',
    'Wearer and adjacent friends each ignore their next stun.',
  ],
  collection: [
    'Damage one rival fighter.',
    'Damage a rival fighter; if damage lands, heal your boss for 1.',
    'Damage a rival; on a hit, heal your boss 2 and grant nearby COLLECT allies +1 attack.',
  ],
  debttrap: [
    'Set a hidden debt trap in one alley.',
    'Arm a debt trap here and a weak lien in one empty adjacent alley.',
    'Arm a debt trap here and weak liens in both empty adjacent alleys.',
  ],
  hushmoney: [
    'Heal a friendly fighter.',
    'Heal a friendly fighter and restore 1 life to your boss.',
    'Heal a friendly fighter, restore 2 life to your boss, and give the fighter 2 shield.',
  ],
  'merc-bus-driver': [
    '',
    'On arrival, move one adjacent ally into the nearest empty friendly alley.',
    'On arrival, move up to two adjacent allies into empty friendly alleys.',
  ],
  'merc-clock-grandma': [
    '',
    'At turn start, adjacent friends receive 1 temporary shield.',
    'Once per match, an adjacent ally survives a lethal blow at 1 life.',
  ],
  'merc-discount-angel': [
    '',
    'When an allied fighter dies, heals nearby friends for 2.',
    "Once per round, an allied fighter's death summons a fragile rescued echo.",
  ],
  // Final eleven from the first seventy-card evolution manifesto.
  shredders: [
    'Arrive beside an ally: give it +1 power this round.',
    'Arrive beside an ally: permanently sharpen that neighbor by +1 attack.',
    'Arrive: both neighboring allies gain +1 lasting attack and PIERCE.',
  ],
  spurs: [
    'Arrive beside an ally: it strikes +1 this round.',
    'Arrive: both neighboring allies strike +1 this round.',
    'Arrive: both neighboring allies gain +1 lasting attack.',
  ],
  choker: [
    'Arrive beside an ally: it gains SWARM.',
    'Arrive: both neighboring allies gain SWARM.',
    'Arrive: neighbors gain SWARM; while she stands, adjacent SWARM allies strike +1.',
  ],
  wreckingfist: [
    'Permanently sharpen a friendly fighter.',
    'Permanently sharpen a fighter and grant BULLDOZE (extra damage hits boss).',
    'Sharpen and grant BULLDOZE; damaging a blocker deals 2 to boss and 1 to an adjacent rival.',
  ],
  slap: [
    'Damage one selected rival fighter.',
    'Damage and stun one selected rival fighter.',
    'Damage and stun a rival and each adjacent rival for 2.',
  ],
  badluck: [
    'Arm an unpredictable grenade in one alley.',
    'When sprung, a seeded 50% chance blasts a neighboring rival for 2.',
    'Each neighboring rival independently has a 50% chance to take 3.',
  ],
  fuse: [
    "Permanently boost a friendly fighter's attack.",
    "Boost a friendly fighter's attack permanently; it takes 1 recoil damage.",
    'Boost a friendly fighter; sacrifice the weakest adjacent ally for +4 attack, or take 2 recoil.',
  ],
  visor: [
    'Grant a fighter PIERCE, which ignores 1 armor.',
    'Grant PIERCE and +1 attack; disarm one adjacent rival trap.',
    'Grant PIERCE; disarm both neighboring rival traps and share PIERCE with adjacent allies.',
  ],
  contract: [
    "Increase a friendly fighter's armor.",
    'Increase armor; if the wearer survives the full round, restore 1 boss life.',
    'Increase armor; at round end, heal boss 1, adjacent allies 1, and shield those allies for 1.',
  ],
  'merc-bribe-rat': [
    '',
    "On a blocked strike, 50% chance to prevent the rival's counterattack.",
    'Against a blocker, 75% chance to stop retaliation; a weak defeated foe joins as a fragile echo.',
  ],
  'merc-grease-oracle': [
    '',
    'Adjacent friendly fighters strike with +1 power.',
    'Adjacent friendly fighters strike with +2 power.',
  ],
}

export function clashTwistText(id: string, level: number): string {
  return (
    CLASH_TWISTS[id]?.[Math.min(2, Math.max(0, Math.round(level) - 1))] ?? ''
  )
}
