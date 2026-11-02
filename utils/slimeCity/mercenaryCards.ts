import type { Card } from './prototypes'

/** Shared Slime City mercenaries: playable effects only, no imaginary abilities. */
export const MERCENARY_RARE_IDS = new Set<string>([
  "merc-clock-grandma",
  "merc-grease-oracle",
  "merc-discount-angel",
  "merc-union-owl",
  "merc-auction-golem",
  "merc-invisible-mime",
  "merc-midnight-janitor",
  "merc-supervised-demo",
  "merc-unsupervised-demo",
  "merc-secondhand-halo",
  "merc-mothball-storm",
  "merc-festival-no-refunds",
  "merc-union-solidarity",
  "merc-boomerang-buffet",
  "merc-flooded-fusebox",
  "merc-dog-eared-mine",
  "merc-ghoul-et-lot",
  "merc-emergency-wings",
  "merc-rooftop-map",
  "merc-broken-halo"
])

export const MERCENARY_CARDS: Card[] = [
  {
    id: "merc-bus-driver",
    name: "Gutterbus Driver",
    kind: "creature",
    team: "mercenary",
    cost: 2,
    hp: 4,
    attack: 1,
    armor: 0,
    ap: 2,
    text: "The last bus leaves on a stolen schedule. A dependable runner who can contest the midline.",
    symbol: "🚌"
  },
  {
    id: "merc-bribe-rat",
    name: "Bribe-Licked Rat",
    kind: "creature",
    team: "mercenary",
    cost: 1,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 3,
    keywords: [
      "ambush"
    ],
    text: "Quick enough to deliver a bribe before the punch arrives. Its first strike gets the jump.",
    symbol: "🐀"
  },
  {
    id: "merc-roof-dentist",
    name: "Rooftop Dentist",
    kind: "creature",
    team: "mercenary",
    cost: 3,
    hp: 3,
    attack: 1,
    armor: 0,
    ap: 2,
    keywords: [
      "regen"
    ],
    text: "Rebuilds teeth on the roof of a pharmacy. Recovers health between scrapes.",
    symbol: "🦷"
  },
  {
    id: "merc-debt-slug",
    name: "Debt-Eating Slug",
    kind: "creature",
    team: "mercenary",
    cost: 3,
    hp: 4,
    attack: 1,
    armor: 0,
    ap: 1,
    keywords: [
      "collect"
    ],
    text: "Swallows overdue notices whole. Successful hits hand the rival a mana bill.",
    symbol: "🐌"
  },
  {
    id: "merc-clock-grandma",
    name: "Clockwork Grandmother",
    kind: "creature",
    team: "mercenary",
    cost: 4,
    hp: 5,
    attack: 2,
    armor: 1,
    ap: 1,
    keywords: [
      "bulldoze"
    ],
    text: "She made the clock and refuses to move for anyone. Shoves a rival out of her lane.",
    symbol: "🕰"
  },
  {
    id: "merc-smog-moth",
    name: "Smog Moth Courier",
    kind: "creature",
    team: "mercenary",
    cost: 2,
    hp: 2,
    attack: 1,
    armor: 0,
    ap: 3,
    keywords: [
      "swarm"
    ],
    text: "Delivers invitations to a riot before it exists. Moves best with a crowd.",
    symbol: "🦋"
  },
  {
    id: "merc-grease-oracle",
    name: "Grease Oracle",
    kind: "creature",
    team: "mercenary",
    cost: 4,
    hp: 4,
    attack: 1,
    armor: 0,
    ap: 2,
    keywords: [
      "snare"
    ],
    text: "Predicts your slip, then sells you the pavement. Hits interrupt the next move.",
    symbol: "🔮"
  },
  {
    id: "merc-fungal-bouncer",
    name: "Fungal Bouncer",
    kind: "creature",
    team: "mercenary",
    cost: 3,
    hp: 6,
    attack: 1,
    armor: 1,
    ap: 1,
    text: "A mushroom with a clipboard. Holds doors and narrow alleys long after the party ends.",
    symbol: "🍄"
  },
  {
    id: "merc-discount-angel",
    name: "Discount Archangel",
    kind: "creature",
    team: "mercenary",
    cost: 5,
    hp: 5,
    attack: 3,
    armor: 0,
    ap: 2,
    keywords: [
      "volatile"
    ],
    text: "A halo on clearance and wings with a recall notice. Explodes when defeated.",
    symbol: "😇"
  },
  {
    id: "merc-union-owl",
    name: "Owl of All Trades",
    kind: "creature",
    team: "mercenary",
    cost: 4,
    hp: 3,
    attack: 2,
    armor: 0,
    ap: 2,
    keywords: [
      "pierce"
    ],
    text: "Certified in six crafts and three acts of sabotage. Ignores defensive armor on its hits.",
    symbol: "🦉"
  },
  {
    id: "merc-sewer-sommelier",
    name: "Sewer Sommelier",
    kind: "creature",
    team: "mercenary",
    cost: 2,
    hp: 3,
    attack: 1,
    armor: 0,
    ap: 2,
    keywords: [
      "leech"
    ],
    text: "Pairs ancient drainwater with the tears of landlords. Successful strikes restore health.",
    symbol: "🍷"
  },
  {
    id: "merc-skate-taxidermist",
    name: "Skating Taxidermist",
    kind: "creature",
    team: "mercenary",
    cost: 3,
    hp: 3,
    attack: 2,
    armor: 0,
    ap: 3,
    keywords: [
      "swarm"
    ],
    text: "A museum escaped on roller skates. Gains more menace when friends crowd the rink.",
    symbol: "🛼"
  },
  {
    id: "merc-auction-golem",
    name: "Auction Golem",
    kind: "creature",
    team: "mercenary",
    cost: 6,
    hp: 7,
    attack: 3,
    armor: 2,
    ap: 1,
    keywords: [
      "bulldoze"
    ],
    text: "Sells the space you are standing in. A slow expensive wrecking wall with a shove.",
    symbol: "🏗"
  },
  {
    id: "merc-spark-midwife",
    name: "Midwife of Sparks",
    kind: "creature",
    team: "mercenary",
    cost: 4,
    hp: 4,
    attack: 2,
    armor: 0,
    ap: 2,
    keywords: [
      "volatile"
    ],
    text: "Keeps every dangerous new idea alive. Goes off in a final flash when brought down.",
    symbol: "⚡"
  },
  {
    id: "merc-traffic-witch",
    name: "Traffic Witch",
    kind: "creature",
    team: "mercenary",
    cost: 3,
    hp: 3,
    attack: 1,
    armor: 0,
    ap: 2,
    keywords: [
      "snare"
    ],
    text: "Casts one red light directly into your knees. Her blows stop an enemy move.",
    symbol: "🚦"
  },
  {
    id: "merc-picket-troll",
    name: "Picket Line Troll",
    kind: "creature",
    team: "mercenary",
    cost: 4,
    hp: 6,
    attack: 1,
    armor: 2,
    ap: 1,
    text: "Walks the strike line in permanent overtime. Hard to dislodge, slow to chase.",
    symbol: "✊"
  },
  {
    id: "merc-escape-crab",
    name: "Escape Artist Crab",
    kind: "creature",
    team: "mercenary",
    cost: 2,
    hp: 3,
    attack: 1,
    armor: 0,
    ap: 3,
    keywords: [
      "ambush"
    ],
    text: "Has escaped sixteen seafood restaurants. Opens with one nasty surprise.",
    symbol: "🦀"
  },
  {
    id: "merc-living-scaffold",
    name: "Living Scaffolding",
    kind: "creature",
    team: "mercenary",
    cost: 5,
    hp: 7,
    attack: 2,
    armor: 1,
    ap: 1,
    text: "An entire building learned to unionize. An expensive anchor with a very wide smile.",
    symbol: "🏢"
  },
  {
    id: "merc-invisible-mime",
    name: "Invisible Mime",
    kind: "creature",
    team: "mercenary",
    cost: 3,
    hp: 2,
    attack: 2,
    armor: 0,
    ap: 3,
    keywords: [
      "ambush"
    ],
    text: "Silent, obvious, and still somehow behind you. First attack hits harder.",
    symbol: "🎭"
  },
  {
    id: "merc-midnight-janitor",
    name: "Midnight Janitor",
    kind: "creature",
    team: "mercenary",
    cost: 5,
    hp: 5,
    attack: 3,
    armor: 1,
    ap: 2,
    keywords: [
      "pierce"
    ],
    text: "Mops up champions and takes no overtime. Hits ignore armor, but costs a saved turn.",
    symbol: "🧹"
  },
  {
    id: "merc-misaddressed-parcel",
    name: "Misaddressed Parcel",
    kind: "spell",
    team: "mercenary",
    cost: 1,
    effect: "heal",
    power: 1,
    text: "A package of emergency gauze. Restores 1 HP to a wounded ally.",
    symbol: "📦"
  },
  {
    id: "merc-crowd-lightning",
    name: "Crowd-Sourced Lightning",
    kind: "spell",
    team: "mercenary",
    cost: 2,
    effect: "zap",
    power: 2,
    text: "Hundreds of residents sign the petition; one enemy takes 2 damage.",
    symbol: "⚡"
  },
  {
    id: "merc-unofficial-detour",
    name: "Unofficial Detour",
    kind: "spell",
    team: "mercenary",
    cost: 3,
    effect: "root",
    power: 1,
    text: "A painted arrow leads directly into a dead end. Hit a foe for 1 and stop its movement.",
    symbol: "↩"
  },
  {
    id: "merc-reputation-laundry",
    name: "Reputation Laundering",
    kind: "spell",
    team: "mercenary",
    cost: 2,
    effect: "armor",
    text: "Someone writes a glowing reference. Give one friendly fighter +1 armor.",
    symbol: "🧼"
  },
  {
    id: "merc-flashmob-diversion",
    name: "Flashmob Diversion",
    kind: "spell",
    team: "mercenary",
    cost: 3,
    effect: "grant",
    grants: ["swarm"],
    text: "The crowd joins a fighter's cause. Grant SWARM so allies can amplify its strikes.",
    symbol: "🎶"
  },
  {
    id: "merc-jury-rigged-radar",
    name: "Jury-Rigged Radar",
    kind: "spell",
    team: "mercenary",
    cost: 2,
    effect: "scan",
    text: "One friendly fighter reports nearby hidden enemies and disarms traps within two squares.",
    symbol: "📡"
  },
  {
    id: "merc-allergy-season",
    name: "Allergy Season",
    kind: "spell",
    team: "mercenary",
    cost: 2,
    effect: "chaos",
    text: "The whole city sneezes; deal a seeded 1–3 damage to a rival.",
    symbol: "🌾"
  },
  {
    id: "merc-supervised-demo",
    name: "Supervised Demolition",
    kind: "spell",
    team: "mercenary",
    cost: 4,
    effect: "blast",
    power: 4,
    splash: "enemies",
    text: "Permits acquired. Deal 4 to a foe and 1 splash damage to adjacent enemies.",
    symbol: "🧨"
  },
  {
    id: "merc-unsupervised-demo",
    name: "Unsupervised Demolition",
    kind: "spell",
    team: "mercenary",
    cost: 4,
    effect: "blast",
    power: 4,
    splash: "all",
    text: "Permits shredded. Deal 4 to a foe and 1 to everyone adjacent, friends included.",
    symbol: "💥"
  },
  {
    id: "merc-mortgage-holiday",
    name: "Mortgage Holiday",
    kind: "spell",
    team: "mercenary",
    cost: 1,
    effect: "debt",
    power: 1,
    text: "A tempting payment deferral. Deal 1 damage and inflict 1 mana debt.",
    symbol: "🧾"
  },
  {
    id: "merc-secondhand-halo",
    name: "Secondhand Halo",
    kind: "spell",
    team: "mercenary",
    cost: 4,
    effect: "grant",
    grants: [
      "regen"
    ],
    text: "Give a friendly fighter regeneration; the halo may still be warm.",
    symbol: "😇"
  },
  {
    id: "merc-take-stairs",
    name: "Take the Stairs",
    kind: "spell",
    team: "mercenary",
    cost: 2,
    effect: "boost",
    text: "Elevators are for the syndicate. Give a friendly fighter 2 AP now.",
    symbol: "🪜"
  },
  {
    id: "merc-streetlight-confession",
    name: "Streetlight Confession",
    kind: "spell",
    team: "mercenary",
    cost: 1,
    effect: "sharpen",
    text: "The truth hurts. Give a friendly fighter +1 attack permanently.",
    symbol: "💡"
  },
  {
    id: "merc-homebrew-antidote",
    name: "Homebrew Antidote",
    kind: "spell",
    team: "mercenary",
    cost: 3,
    effect: "heal",
    power: 4,
    text: "One recipe, three warning labels. Heal a wounded ally for up to 4 HP.",
    symbol: "🧪"
  },
  {
    id: "merc-whisper-network",
    name: "Whisper Network",
    kind: "spell",
    team: "mercenary",
    cost: 3,
    effect: "debt",
    debt: 2,
    power: 2,
    text: "A well-placed rumor becomes an invoice. Deal 2 damage and add two mana debt.",
    symbol: "👂"
  },
  {
    id: "merc-mothball-storm",
    name: "Mothball Storm",
    kind: "spell",
    team: "mercenary",
    cost: 5,
    effect: "blast",
    power: 6,
    splash: "enemies",
    text: "A landlord fumigates the neighborhood. Hit a foe for 6 and adjacent enemies for 1.",
    symbol: "🫙"
  },
  {
    id: "merc-festival-no-refunds",
    name: "Festival of No Refunds",
    kind: "spell",
    team: "mercenary",
    cost: 3,
    effect: "blast",
    splash: "all",
    power: 2,
    text: "Refunds are forbidden. Hit one enemy for 2, and every adjacent fighter for 1, including friends.",
    symbol: "🎟"
  },
  {
    id: "merc-union-solidarity",
    name: "Union Solidarity",
    kind: "spell",
    team: "mercenary",
    cost: 3,
    effect: "grant",
    grants: [
      "bulldoze"
    ],
    text: "Collective bargaining gets physical. Give a fighter the Bulldoze shove.",
    symbol: "✊"
  },
  {
    id: "merc-glass-echo",
    name: "Glass Echo Plate",
    kind: "trap",
    team: "mercenary",
    cost: 1,
    effect: "snare",
    power: 1,
    roots: true,
    text: "The tiniest chime in the sewer. Deals 1 damage and costs a trespasser a move.",
    symbol: "🔔"
  },
  {
    id: "merc-tourist-trapdoor",
    name: "Tourist Trapdoor",
    kind: "trap",
    team: "mercenary",
    cost: 2,
    effect: "snare",
    power: 3,
    text: "Every postcard hides a hole. Deals 3 damage when a rival steps on it.",
    symbol: "🕳"
  },
  {
    id: "merc-concealed-tollbooth",
    name: "Concealed Tollbooth",
    kind: "trap",
    team: "mercenary",
    cost: 3,
    effect: "snare",
    power: 2,
    debt: 1,
    text: "A toll payable in your next mana grant. Deals 2 and one debt.",
    symbol: "🪙"
  },
  {
    id: "merc-boomerang-buffet",
    name: "Boomerang Buffet",
    kind: "trap",
    team: "mercenary",
    cost: 4,
    effect: "snare",
    power: 5,
    text: "An all-you-can-eat sign returns at head height. Deals 5 damage.",
    symbol: "🥘"
  },
  {
    id: "merc-invisible-bump",
    name: "Invisible Speed Bump",
    kind: "trap",
    team: "mercenary",
    cost: 2,
    effect: "snare",
    power: 2,
    roots: true,
    text: "The road works have become their own government. Deal 2 and stop a move.",
    symbol: "🚧"
  },
  {
    id: "merc-market-tripwire",
    name: "Night Market Tripwire",
    kind: "trap",
    team: "mercenary",
    cost: 3,
    effect: "snare",
    power: 3,
    roots: true,
    text: "Some bargains cost an ankle. Deal 3 damage and prevent the next move.",
    symbol: "🧵"
  },
  {
    id: "merc-flooded-fusebox",
    name: "Flooded Fusebox",
    kind: "trap",
    team: "mercenary",
    cost: 5,
    effect: "snare",
    power: 6,
    text: "One flooded socket, ten blocks without lights. Deal 6 damage on entry.",
    symbol: "🔌"
  },
  {
    id: "merc-parking-meter",
    name: "Hostile Parking Meter",
    kind: "trap",
    team: "mercenary",
    cost: 2,
    effect: "snare",
    power: 1,
    debt: 1,
    text: "Even monsters must pay to stand here. Deal 1 and add one mana debt.",
    symbol: "🅿"
  },
  {
    id: "merc-dog-eared-mine",
    name: "Dog-Eared Mine",
    kind: "trap",
    team: "mercenary",
    cost: 5,
    effect: "snare",
    power: 5,
    roots: true,
    text: "A discarded war manual still works. Deal 5 damage and pin the intruder.",
    symbol: "💣"
  },
  {
    id: "merc-cursed-sign",
    name: "Cursed Detour Sign",
    kind: "trap",
    team: "mercenary",
    cost: 1,
    effect: "snare",
    power: 2,
    text: "Route planning by vengeful committee. Deals 2 damage, but cannot stop movement.",
    symbol: "🪧"
  },
  {
    id: "merc-ghoul-et-lot",
    name: "Ghoul-Et-Lot",
    kind: "trap",
    team: "mercenary",
    cost: 5,
    effect: "snare",
    power: 3,
    debt: 2,
    text: "Foreclosed land bites back. Deal 3 and charge two mana debt.",
    symbol: "🏚"
  },
  {
    id: "merc-angry-bees",
    name: "Bag of Very Angry Bees",
    kind: "trap",
    team: "mercenary",
    cost: 4,
    effect: "snare",
    power: 4,
    roots: true,
    text: "Never ask where the bag came from. Deal 4 and deny the next move.",
    symbol: "🐝"
  },
  {
    id: "merc-borrowed-kneepads",
    name: "Borrowed Kneepads",
    kind: "equipment",
    team: "mercenary",
    cost: 1,
    effect: "armor",
    text: "A sensible hand-me-down. Give a fighter +1 permanent armor.",
    symbol: "🦵"
  },
  {
    id: "merc-squeaky-wheel",
    name: "Squeaky Wheel",
    kind: "equipment",
    team: "mercenary",
    cost: 2,
    text: "Gets the oil. Give one fighter +1 permanent maximum AP.",
    symbol: "⚙"
  },
  {
    id: "merc-edible-kevlar",
    name: "Edible Kevlar",
    kind: "equipment",
    team: "mercenary",
    cost: 3,
    effect: "grant",
    grants: ["snare"],
    text: "One bite of armor-jam gives a fighter SNARE: its hits prevent the next enemy move.",
    symbol: "🥪"
  },
  {
    id: "merc-emergency-wings",
    name: "Emergency Wings",
    kind: "equipment",
    team: "mercenary",
    cost: 4,
    effect: "grant",
    grants: [
      "swarm"
    ],
    text: "Cardboard wings and confidence. Grant SWARM to a fighter without it.",
    symbol: "🪽"
  },
  {
    id: "merc-red-tape-scissors",
    name: "Red Tape Scissors",
    kind: "equipment",
    team: "mercenary",
    cost: 3,
    effect: "grant",
    grants: ["pierce"],
    text: "Snip the forms and the armor. Grant PIERCE to a friendly fighter.",
    symbol: "✂"
  },
  {
    id: "merc-theftproof-toolkit",
    name: "Theftproof Toolkit",
    kind: "equipment",
    team: "mercenary",
    cost: 4,
    effect: "grant",
    grants: [
      "regen"
    ],
    text: "The entire clinic is in the case. Grant regeneration to a fighter.",
    symbol: "🧰"
  },
  {
    id: "merc-counterfeit-license",
    name: "Counterfeit License",
    kind: "equipment",
    team: "mercenary",
    cost: 2,
    effect: "sharpen",
    text: "Permission to cause damage. Give a friendly fighter +1 permanent attack.",
    symbol: "🪪"
  },
  {
    id: "merc-rooftop-map",
    name: "Rooftop Map",
    kind: "equipment",
    team: "mercenary",
    cost: 4,
    effect: "grant",
    grants: [
      "ambush"
    ],
    text: "Every ledge marked, no rooftop safe. Grant first-strike AMBUSH.",
    symbol: "🗺"
  },
  {
    id: "merc-broken-halo",
    name: "Broken Halo",
    kind: "equipment",
    team: "mercenary",
    cost: 5,
    effect: "grant",
    grants: [
      "leech"
    ],
    text: "An obsolete saint's halo. Grant life-stealing LEECH to a fighter.",
    symbol: "⭕"
  },
  {
    id: "merc-union-suit",
    name: "Union Suit",
    kind: "equipment",
    team: "mercenary",
    cost: 5,
    effect: "grant",
    grants: [
      "bulldoze"
    ],
    text: "Collective armor includes a shove. Grant BULLDOZE to a fighter.",
    symbol: "🦾"
  }
]
