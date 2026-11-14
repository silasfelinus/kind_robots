/** Clash-only hand text for real, tested L1/L2/L3 departures from stat scaling. */
export const CLASH_TWISTS: Record<string, [string, string, string]> = {
  calico: [
    'Guards the clinic lane.',
    'Mends adjacent allies for 1 life after each full round.',
    'Never attacks. Mends adjacent allies for 2 each full round.',
  ],
  chimera: [
    'A fragile escaped prototype learning to fight.',
    'A resilient hunter with a sharper bite.',
    'Apex mutation: +2 attack and +3 life.',
  ],
  sprite: [
    'The first dancer in a potential crowd.',
    'On entry, adds a weak dancer to one empty neighboring alley.',
    'On arrival, summon a weak dancer in each empty neighboring alley.',
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
    'Starts at 1 attack; armor lets this siege lizard hold the alley.',
    'Rebuilt pistons give this armored fighter its full strike.',
    'Siege form: +2 attack; on arrival, adjacent allies gain +1 armor.',
  ],
  rat: [
    'Every knockout adds +1 attack to later copies, up to +3.',
    'Each prior Riot Rat death adds +1 attack (max +3). Explodes on defeat.',
    'Each prior Riot Rat death adds +1 attack (max +3); death blasts adjacent foes for 2.',
  ],
  firebrand: [
    'Strikes normally at this level; its dangerous double-fire comes later.',
    'On attack, 50% chance to miss; otherwise double the strike.',
    'On attack, 25% chance to miss; otherwise double the strike.',
  ],
  watcher: [
    'A lookout without its suppressing aura at this level.',
    'While present, the rival across its alley loses 1 strike power.',
    'Never attacks. Rivals across its alley and both neighbors lose 1 strike power.',
  ],
  frogtrooper: [
    'Tongue snare interrupts a rival.',
    'Gains +1 strike power versus a rooted defender.',
    'On a damaging strike, stun rival fighters in adjacent alleys.',
  ],
  broker: [
    'A collector with no buyout bonus at this level.',
    'When replacing an allied fighter, kill it and gain +2 attack and +2 life.',
    'When replacing an allied fighter, kill it and gain +3 attack and +4 life.',
  ],
  collector: [
    'An apprentice collector with no death-triggered bonus yet.',
    'Whenever a rival fighter dies, gain +1 attack (max 10).',
    'Whenever a rival fighter dies, gain +1 attack (max 10) and heal 1.',
  ],
  'merc-roof-dentist': [
    'Sturdy medic with questionable certification.',
    'Mends adjacent friends for 1 life after each full round.',
    'Never attacks. Mends adjacent friends for 2 each full round.',
  ],
  'merc-smog-moth': [
    'Tiny flyer with a giant invitation list.',
    'On entry, adds a weak courier to an empty neighboring alley.',
    'On arrival, summon a weak courier in each empty neighboring alley.',
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
    "Boost a fighter's power this round and refresh its AMBUSH strike.",
    'Boost target and refresh AMBUSH; one adjacent ally gains +1 power and refreshes AMBUSH.',
    'Boost target; both adjacent allies gain +2 power this round and refresh AMBUSH.',
  ],
  reknit: [
    'Heal one chosen friendly fighter.',
    'Heal a friendly fighter and restore 2 life to its wounded neighbors.',
    'Heal the target; heal adjacent wounded allies for 2; revive the last fallen ally as a fragile echo.',
  ],
  laser: [
    'Stun one rival fighter in the chosen alley.',
    'Stun a rival and one adjacent rival; deal 1 damage to the main target.',
    'Stun a rival and both adjacent rivals; deal 2 damage to the main target.',
  ],
  pogo: [
    'A crowd-surfer who lands harder with friends.',
    'Hits for double while an ally stands next door.',
    'Every strike deals double damage, with or without an adjacent ally.',
  ],
  razor: [
    'A duelist who heals from a hit.',
    'When Razorwing damages a rival, heal adjacent allies for 1 life.',
    'When Razorwing damages a rival, heal every friendly fighter for 1 life.',
  ],
  mosh: [
    'Damage one rival and the enemies in adjacent alleys.',
    'Damage target and adjacent rivals; deal 1 to foes two alleys away.',
    'Blast the target and nearby rivals; distant rivals and all your fighters take 1.',
  ],
  scrapper: [
    'Reliable armored brawler.',
    'Adjacent friends gain 1 shield at the start of each friendly turn.',
    'Every friendly fighter starts its turn with 1 fresh shield.',
  ],
  bulldozer: [
    'Overkill smashes through to the rival boss.',
    'Ignores one extra armor on a blocked strike.',
    'A strike that damages a blocker also deals 2 to the rival boss.',
  ],
  plating: [
    'One fighter gains permanent armor.',
    'Adjacent fighters gain +1 armor too.',
    'Every friendly fighter gains +1 armor on installation.',
  ],
  bomber: [
    'Explodes when defeated.',
    'On defeat, explode and deal 2 to rivals in adjacent alleys.',
    'On defeat, deal 2 to all rivals and 1 to adjacent allies.',
  ],
  kaboom: [
    'A heavy piercing fighter.',
    'Gains +1 attack when a friendly Volatile fighter dies.',
    'Gains +2 attack on allied Volatile death and strikes the rival boss for 1.',
  ],
  confetti: [
    'Blast a rival and its neighboring enemies.',
    'Blast a rival and neighboring foes for 2; friendly neighbors take 1.',
    'Blast the whole rival row; distant foes take 2 and every friendly fighter takes 1.',
  ],
  eel: [
    'Pierces the rival armor.',
    'Hitting a stunned rival shocks one adjacent enemy for 1.',
    'On a damaging hit, shock rivals in trapped alleys for 2.',
  ],
  oracle: [
    'A dangerous prophet with a piercing snare.',
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
    'Give the target fighter COLLECT and grant it to adjacent allies.',
    'Give every friendly fighter COLLECT.',
  ],
  foreclosure: [
    'Hurt and stun a rival.',
    'Damage and stun a rival; a knockout heals your boss for 2.',
    'Damage and stun a rival; a knockout heals your boss 2 and summons a weak debtor in a free alley.',
  ],
  'merc-debt-slug': [
    'A slow collector waiting for disaster.',
    'Gains +1 attack when an allied fighter falls.',
    'Gains attack and life whenever any fighter falls, either side.',
  ],
  'merc-fungal-bouncer': [
    'Guards its own door.',
    'Gives one neighboring ally 2 shield at the start of its turn.',
    'At each friendly turn start, give 2 shield to both adjacent allies.',
  ],
  // Wave three: every journey branches into a mechanic, not a larger number.
  mau: [
    'Ambush fighter: the first claw cuts deeper.',
    'Deals +1 against a wounded defender.',
    'Deal +2 to wounded defenders; on hit, scratch one adjacent rival for 2.',
  ],
  scentmine: [
    'Hidden mine damages and roots the intruder.',
    'The trap roots its victim and one adjacent rival.',
    'The trap roots its victim and both adjacent rivals; those neighbors also take 1.',
  ],
  ninthlife: [
    'A collar grants Regen to its wearer.',
    'The wearer survives one fatal hit with 1 life.',
    'The wearer survives one fatal hit at half life, returning with +2 attack.',
  ],
  bloodwire: [
    'Hidden razor floss punishes one intruder.',
    'When sprung, the trap damages its intruder and an adjacent rival for 1.',
    'When sprung, the trap damages its intruder and both adjacent rivals for 2.',
  ],
  pinprick: [
    'Reliable single-target damage.',
    'Doubles the stab against a rival who is already hurt.',
    'Double damage against any rival; hitting a wounded rival splashes 2 to adjacent foes.',
  ],
  feedback: [
    'Focused sonic blast in one alley.',
    'A friendly neighbor makes the amp blast hit adjacent enemies for 1.',
    'Blast the target; with four allies fielded, deal 2 to every other rival.',
  ],
  overclock: [
    'Give the target fighter a temporary power boost.',
    'Grant extra temporary power to the target fighter; it takes 1 recoil damage.',
    'Grant the target fighter +4 temporary power; it takes 3 recoil and nearby foes take 2.',
  ],
  shocktrap: [
    'Hidden plate damages and roots its visitor.',
    'On trigger, arcs 1 damage to one adjacent rival.',
    'When sprung, root its visitor and deal 2 damage and stun to both adjacent rivals.',
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
    'A reckless temporary power-up.',
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
    'When sprung, damage and root the intruder.',
    'When sprung, root and damage the intruder; deal 2 to both adjacent rivals.',
  ],
  drysuit: [
    'Add armor to a friendly fighter.',
    'Wearer blocks the next root or snare and sheds current stun.',
    'Wearer and adjacent friends each block their next root or snare.',
  ],
  collection: [
    'Damage one rival fighter; this is a collection spell.',
    'Damage a rival fighter; if damage lands, heal your boss for 1.',
    'Damage a rival; on a hit, heal your boss 2 and grant nearby COLLECT allies +1 attack.',
  ],
  debttrap: [
    'Set a hidden debt trap in one alley.',
    'Arm a debt trap here and a weak lien in one empty adjacent alley.',
    'Arm a debt trap here and weak liens in both empty adjacent alleys.',
  ],
  hushmoney: [
    'Heal a friendly asset.',
    'Heal a friendly fighter and restore 1 life to your boss.',
    'Heal a friendly fighter, restore 2 life to your boss, and give the fighter 2 shield.',
  ],
  'merc-bus-driver': [
    'A dependable driver holds one lane.',
    'On arrival, move one adjacent ally into the nearest empty friendly alley.',
    'On arrival, move up to two adjacent allies into empty friendly alleys.',
  ],
  'merc-clock-grandma': [
    'Old-school armored protector.',
    'At turn start, adjacent friends receive 1 temporary shield.',
    'Once per match, an adjacent ally survives a lethal blow at 1 life.',
  ],
  'merc-discount-angel': [
    'An unstable helper with a clearance-bin halo.',
    'When an allied fighter dies, heals nearby friends for 2.',
    "Once per round, an allied fighter's death summons a fragile rescued echo.",
  ],
  // Final eleven from the first seventy-card evolution manifesto.
  shredders: [
    'Sharpen a fighter permanently.',
    'Permanently sharpen a fighter and grant PIERCE.',
    'Sharpen and grant PIERCE; a damaging strike splashes half its damage to one adjacent rival.',
  ],
  spurs: [
    'Strengthen one dancer permanently.',
    'Sharpen the wearer permanently; one adjacent friend also gains +1 attack.',
    'Sharpen the wearer permanently; both adjacent friends gain +2 attack.',
  ],
  choker: [
    'Give one fighter Swarm.',
    'Share Swarm with its immediate neighbors.',
    'Wearer leads the show: all other Swarm allies gain +1 strike power.',
  ],
  wreckingfist: [
    'Permanently sharpen a friendly fighter.',
    'Permanently sharpen a fighter and grant BULLDOZE (overkill hits boss).',
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
    'Permanently boost a friendly fighter\'s attack.',
    'Boost a friendly fighter\'s attack permanently; it takes 1 recoil damage.',
    'Boost a friendly fighter; sacrifice the weakest adjacent ally for +4 attack, or take 2 recoil.',
  ],
  visor: [
    'Grant a fighter PIERCE, which ignores 1 armor.',
    'Grant PIERCE and +1 attack; disarm one adjacent rival trap.',
    'Grant PIERCE; disarm both neighboring rival traps and share PIERCE with adjacent allies.',
  ],
  contract: [
    'Increase a friendly fighter\'s armor.',
    'Increase armor; if the wearer survives the full round, restore 1 boss life.',
    'Increase armor; at round end, heal boss 1, adjacent allies 1, and shield those allies for 1.',
  ],
  'merc-bribe-rat': [
    'A quick Ambush rat takes the first strike.',
    'On a blocked strike, 50% chance to prevent the rival\'s counterattack.',
    'Against a blocker, 75% chance to stop retaliation; a weak defeated foe joins as a fragile echo.',
  ],
  'merc-grease-oracle': [
    'Snare rivals with a mysteriously accurate prophecy.',
    'Adjacent friendly fighters strike with +1 power.',
    'Adjacent friendly fighters strike with +2 power.',
  ],
}

export function clashTwistText(id: string, level: number): string {
  return (
    CLASH_TWISTS[id]?.[Math.min(2, Math.max(0, Math.round(level) - 1))] ?? ''
  )
}
