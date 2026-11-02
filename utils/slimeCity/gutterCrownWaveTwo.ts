import type { Card } from './prototypes'

/**
 * Gutter Crown wave two: six tactical sub-archetypes, six cards per crew.
 * All effects and keywords resolve through the existing battle engine; no
 * artwork completion or browser-only account inventory is required.
 */
export const GUTTER_CROWN_WAVE_TWO: Card[] = [
  {
    "id": "s1-roof-phantom",
    "name": "Rooftop Phantom",
    "kind": "creature",
    "team": "catgirls",
    "cost": 3,
    "hp": 3,
    "attack": 2,
    "armor": 0,
    "ap": 3,
    "keywords": [
      "ambush"
    ],
    "text": "Skips across the lab roofs. AMBUSH strikes immediately on deployment and adds two damage to its first blow.",
    "symbol": "✦"
  },
  {
    "id": "s1-alley-vet",
    "name": "Alley Veterinarian",
    "kind": "creature",
    "team": "catgirls",
    "cost": 2,
    "hp": 4,
    "attack": 1,
    "armor": 0,
    "ap": 2,
    "keywords": [
      "regen"
    ],
    "text": "A street medic who stitched her own tail back on. REGEN heals one HP after quiet rounds.",
    "symbol": "✚"
  },
  {
    "id": "s1-clone-salvage",
    "name": "Secondhand Life",
    "kind": "spell",
    "team": "catgirls",
    "cost": 2,
    "effect": "heal",
    "text": "Recover four HP on a wounded ally; a miracle found in the medical dumpster.",
    "symbol": "♡",
    "power": 4
  },
  {
    "id": "s1-nine-lives",
    "name": "Nine Lives, No Refunds",
    "kind": "spell",
    "team": "catgirls",
    "cost": 2,
    "effect": "boost",
    "text": "A friendly fighter gains two AP now. Re-arm its first AMBUSH, if it has one.",
    "symbol": "⚡",
    "rearm": true
  },
  {
    "id": "s1-catnip-tripwire",
    "name": "Catnip Tripwire",
    "kind": "trap",
    "team": "catgirls",
    "cost": 1,
    "effect": "snare",
    "power": 1,
    "roots": true,
    "text": "A hidden lure: one damage and the victim loses its next move.",
    "symbol": "✺"
  },
  {
    "id": "s1-surgical-piercers",
    "name": "Surgical Piercers",
    "kind": "equipment",
    "team": "catgirls",
    "cost": 2,
    "effect": "grant",
    "text": "Grant PIERCE to a fighter: its attacks ignore one point of armor. The lab's patent lawyers are furious.",
    "symbol": "✂",
    "grants": [
      "pierce"
    ]
  },
  {
    "id": "s1-riot-choir",
    "name": "Glitter Riot Choir",
    "kind": "creature",
    "team": "bloodfairies",
    "cost": 3,
    "hp": 3,
    "attack": 2,
    "armor": 0,
    "ap": 2,
    "keywords": [
      "swarm",
      "leech"
    ],
    "text": "Screams in harmony: SWARM adds one attack beside an ally, LEECH heals on a damaging blow.",
    "symbol": "✺"
  },
  {
    "id": "s1-pocket-punk",
    "name": "Pocket-Sized Problem",
    "kind": "creature",
    "team": "bloodfairies",
    "cost": 1,
    "hp": 1,
    "attack": 1,
    "armor": 0,
    "ap": 3,
    "keywords": [
      "swarm"
    ],
    "text": "Tiny enough to hide inside a soda can, loud enough to start a riot. SWARM loves friends.",
    "symbol": "❋"
  },
  {
    "id": "s1-confetti-cannon",
    "name": "Confetti Shrapnel Cannon",
    "kind": "spell",
    "team": "bloodfairies",
    "cost": 3,
    "effect": "blast",
    "text": "Deal two damage to an enemy and one to each adjacent enemy, sparing your own mosh pit.",
    "symbol": "☄",
    "power": 2,
    "splash": "enemies"
  },
  {
    "id": "s1-stage-dive",
    "name": "Unlicensed Stage Dive",
    "kind": "spell",
    "team": "bloodfairies",
    "cost": 1,
    "effect": "boost",
    "text": "Give a friendly fairy two AP this round so the next stage dive reaches someone important.",
    "symbol": "↗"
  },
  {
    "id": "s1-feedback-wire",
    "name": "Feedback Wire",
    "kind": "trap",
    "team": "bloodfairies",
    "cost": 1,
    "effect": "snare",
    "power": 1,
    "roots": true,
    "text": "A hidden amplifier lead: one damage and the target loses its next move.",
    "symbol": "♫"
  },
  {
    "id": "s1-blood-mic",
    "name": "Blood Karaoke Microphone",
    "kind": "equipment",
    "team": "bloodfairies",
    "cost": 2,
    "effect": "grant",
    "text": "Grant LEECH permanently. Every damaging blow restores one HP to its singer.",
    "symbol": "♪",
    "grants": [
      "leech"
    ]
  },
  {
    "id": "s1-walking-foundry",
    "name": "Walking Foundry",
    "kind": "creature",
    "team": "ironjaw",
    "cost": 4,
    "hp": 6,
    "attack": 2,
    "armor": 2,
    "ap": 1,
    "keywords": [
      "bulldoze"
    ],
    "text": "An armored furnace with a union card. BULLDOZE pushes an enemy one square if there is room behind them.",
    "symbol": "⚒"
  },
  {
    "id": "s1-scrap-welder",
    "name": "Scrap Welder",
    "kind": "creature",
    "team": "ironjaw",
    "cost": 2,
    "hp": 3,
    "attack": 1,
    "armor": 1,
    "ap": 2,
    "keywords": [
      "bulldoze"
    ],
    "text": "Welds up barricades mid-charge. BULLDOZE makes a narrow corridor feel even narrower.",
    "symbol": "⌁"
  },
  {
    "id": "s1-hydraulic-shift",
    "name": "Emergency Overtime",
    "kind": "spell",
    "team": "ironjaw",
    "cost": 2,
    "effect": "boost",
    "text": "An ally gains two AP this round. The shift is overtime; management still won't pay.",
    "symbol": "➠"
  },
  {
    "id": "s1-forge-spark",
    "name": "Forge Lightning",
    "kind": "spell",
    "team": "ironjaw",
    "cost": 2,
    "effect": "zap",
    "text": "Two direct damage to one enemy, even behind an armored front line.",
    "symbol": "⚡",
    "power": 2
  },
  {
    "id": "s1-bolt-clamp",
    "name": "Union Bolt Clamp",
    "kind": "trap",
    "team": "ironjaw",
    "cost": 1,
    "effect": "snare",
    "power": 1,
    "roots": true,
    "text": "Hidden steel jaws: one damage and a rooted target cannot move next round.",
    "symbol": "⛓"
  },
  {
    "id": "s1-union-plate",
    "name": "Collective Bargaining Plate",
    "kind": "equipment",
    "team": "ironjaw",
    "cost": 2,
    "effect": "armor",
    "text": "An ally gains one permanent armor, forged from the boss's former office door.",
    "symbol": "⬡"
  },
  {
    "id": "s1-mime-fuse",
    "name": "Matchstick Mime",
    "kind": "creature",
    "team": "riot",
    "cost": 1,
    "hp": 1,
    "attack": 2,
    "armor": 0,
    "ap": 2,
    "keywords": [
      "volatile"
    ],
    "text": "Never speaks, only lights a fuse. On knockout explodes for one to every adjacent fighter, including allies.",
    "symbol": "✹",
    "burst": 1
  },
  {
    "id": "s1-blast-radius",
    "name": "Doctor Blast Radius",
    "kind": "creature",
    "team": "riot",
    "cost": 3,
    "hp": 3,
    "attack": 2,
    "armor": 0,
    "ap": 2,
    "keywords": [
      "volatile"
    ],
    "text": "Has a PhD in making plans explode. On knockout deals two to every adjacent fighter, friend or foe.",
    "symbol": "☢",
    "burst": 2
  },
  {
    "id": "s1-no-witnesses",
    "name": "No Witnesses, Especially Us",
    "kind": "spell",
    "team": "riot",
    "cost": 2,
    "effect": "blast",
    "text": "Deal two damage to a target and one to ALL adjacent fighters, including your own.",
    "symbol": "✷",
    "power": 2,
    "splash": "all"
  },
  {
    "id": "s1-chaos-firecracker",
    "name": "Mystery-Flavor Firecracker",
    "kind": "spell",
    "team": "riot",
    "cost": 1,
    "effect": "chaos",
    "text": "Deal one to three damage, determined by the match seed. Don't ask about the flavor.",
    "symbol": "❄"
  },
  {
    "id": "s1-fuse-alley",
    "name": "Bottled Thunder",
    "kind": "trap",
    "team": "riot",
    "cost": 2,
    "effect": "snare",
    "power": 2,
    "roots": false,
    "text": "Hidden trap: two damage to whoever arrives first. The label claims it's soda.",
    "symbol": "⌁"
  },
  {
    "id": "s1-volunteer-vest",
    "name": "Volunteer Safety Vest",
    "kind": "equipment",
    "team": "riot",
    "cost": 2,
    "effect": "grant",
    "text": "Grant VOLATILE permanently; if this fighter falls, adjacent allies and enemies take one damage.",
    "symbol": "⚠",
    "grants": [
      "volatile"
    ]
  },
  {
    "id": "s1-basement-ghost",
    "name": "Basement Ghost",
    "kind": "creature",
    "team": "undertow",
    "cost": 3,
    "hp": 2,
    "attack": 2,
    "armor": 0,
    "ap": 2,
    "keywords": [
      "pierce",
      "snare"
    ],
    "text": "A sniper in the sewer vents. Range two, PIERCE ignores one armor and SNARE roots anyone it hurts.",
    "symbol": "◈",
    "range": 2,
    "attackStyle": "arrow"
  },
  {
    "id": "s1-static-listener",
    "name": "Static Listener",
    "kind": "creature",
    "team": "undertow",
    "cost": 2,
    "hp": 2,
    "attack": 1,
    "armor": 0,
    "ap": 2,
    "keywords": [
      "snare"
    ],
    "text": "Listens through the streetlights. Range two and SNARE stops a damaged fighter's next move.",
    "symbol": "⌖",
    "range": 2,
    "attackStyle": "spell"
  },
  {
    "id": "s1-floodlight-sweep",
    "name": "Floodlight Sweep",
    "kind": "spell",
    "team": "undertow",
    "cost": 1,
    "effect": "scan",
    "text": "Scan around a friendly fighter: reveal concealed enemies and disarm enemy traps within two squares.",
    "symbol": "◎"
  },
  {
    "id": "s1-wiretap-order",
    "name": "Wiretap Restraining Order",
    "kind": "spell",
    "team": "undertow",
    "cost": 1,
    "effect": "root",
    "text": "Deal zero damage to an enemy and root it for the next move. Nobody read the warrant.",
    "symbol": "⌗",
    "power": 0
  },
  {
    "id": "s1-blue-ink-deadfall",
    "name": "Blue-Ink Deadfall",
    "kind": "trap",
    "team": "undertow",
    "cost": 2,
    "effect": "snare",
    "power": 1,
    "roots": true,
    "text": "One concealed damage and a lost move. Opponents can remove it with a scan.",
    "symbol": "♢"
  },
  {
    "id": "s1-needle-wire",
    "name": "Needle-Wire Antenna",
    "kind": "equipment",
    "team": "undertow",
    "cost": 2,
    "effect": "grant",
    "text": "Grant PIERCE. A single armor layer no longer protects the target from its attacks.",
    "symbol": "⟋",
    "grants": [
      "pierce"
    ]
  },
  {
    "id": "s1-executive-repo",
    "name": "Executive Repossessor",
    "kind": "creature",
    "team": "exchange",
    "cost": 3,
    "hp": 4,
    "attack": 2,
    "armor": 1,
    "ap": 1,
    "keywords": [
      "collect"
    ],
    "text": "Takes your furniture and charges interest. Every damaging attack adds one mana of enemy debt.",
    "symbol": "¤"
  },
  {
    "id": "s1-guild-clerk",
    "name": "Guild Clerk (Temporary)",
    "kind": "creature",
    "team": "exchange",
    "cost": 1,
    "hp": 2,
    "attack": 1,
    "armor": 0,
    "ap": 2,
    "keywords": [
      "collect"
    ],
    "text": "Works the graveyard ledger. Even a paper cut makes the other crew owe one mana.",
    "symbol": "▣"
  },
  {
    "id": "s1-margin-call",
    "name": "Emergency Margin Call",
    "kind": "spell",
    "team": "exchange",
    "cost": 3,
    "effect": "debt",
    "text": "Deal zero damage, but add two mana debt to an enemy crew (the debt cap still applies).",
    "symbol": "∑",
    "power": 0,
    "debt": 2
  },
  {
    "id": "s1-buy-silence",
    "name": "Buy Their Silence",
    "kind": "spell",
    "team": "exchange",
    "cost": 2,
    "effect": "root",
    "text": "Deal zero damage and root one enemy fighter. Nondisclosure is legally binding.",
    "symbol": "✋",
    "power": 0
  },
  {
    "id": "s1-debt-garnish",
    "name": "Garnishment Floor Tile",
    "kind": "trap",
    "team": "exchange",
    "cost": 2,
    "effect": "snare",
    "power": 1,
    "roots": true,
    "text": "A hidden tax trap: one damage, one mana debt, and one lost move.",
    "symbol": "⌗",
    "debt": 1
  },
  {
    "id": "s1-golden-handshake",
    "name": "Golden Handshake, Iron Grip",
    "kind": "equipment",
    "team": "exchange",
    "cost": 2,
    "effect": "grant",
    "text": "Grant COLLECT. Every damaging attack makes the other crew owe one mana next round.",
    "symbol": "✧",
    "grants": [
      "collect"
    ]
  }
]
