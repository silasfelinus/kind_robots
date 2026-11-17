import type { EventDef } from './types'

// A vertical society, not a chain of monster closets. Each stratum contains
// workers, traders, families and disputes where a weapon is a poor answer.
export const UNDERCITY_EVENTS: EventDef[] = [
  {
    id: "bellmouth-free-lift",
    layer: 0,
    title: "Bellmouth Free Lift",
    text: "At the threshold between daylight and the first ossuary, a union of porters has chained a toll elevator. A clerk is charging double to carry medicine downward.",
    options: [
      {"id":"mediate","label":"Mediate with the porters","hint":"d20 + Wits vs 12","tag":"kind","effects":{},"check":{"stat":"wit","dc":12,"win":{"mercy":1,"gold":16},"lose":{"gold":-10},"winText":"The porters open the lift for medicine, and pay you in meal tickets.","loseText":"The clerk charges a processing fee for the hearing."},"result":""},
      {"id":"sneak","label":"Sneak the medicines down","hint":"d20 + Speed vs 14","tag":"bold","effects":{},"check":{"stat":"spd","dc":14,"win":{"heal":0.15,"mercy":1},"lose":{"hurt":0.05},"winText":"You slip through the ropes and deliver the medicine.","loseText":"The guards catch your boot on a hanging cable."},"result":""},
      {"id":"pay","label":"Pay the toll","hint":"A legal shortcut, 15 gold","tag":"pious","requires":{"gold":15},"effects":{"gold":-15},"result":"The cage descends. The clerk folds your coin into a private pocket."},
      {"id":"leave","label":"Walk to the lower stairs","hint":"No roll","effects":{},"result":"The porters shout after you to send help if you find any."},
    ],
  },
  {
    id: "ossuary-night-school",
    layer: 0,
    title: "The Night School of Bones",
    text: "In a crypt converted into a classroom, animal children of tunnel workers study by candle. The ceiling is about to fall, and the city denies the school exists.",
    options: [
      {"id":"reinforce","label":"Brace the classroom ceiling","hint":"d20 + Defence vs 13","tag":"kind","effects":{},"check":{"stat":"def","dc":13,"win":{"mercy":1,"boon":{"def":1}},"lose":{"hurt":0.08},"winText":"You raise the beams while the teacher evacuates every desk.","loseText":"The beam cracks and the dust stings your eyes."},"result":""},
      {"id":"petition","label":"File the school with the Registry","hint":"d20 + Wits vs 13","tag":"curious","effects":{},"check":{"stat":"wit","dc":13,"win":{"gold":20,"mercy":1},"lose":{"gold":-8},"winText":"The school is finally granted a floor number. A parent cries with relief.","loseText":"The clerk loses the documents and requests another filing fee."},"result":""},
      {"id":"rob","label":"Take the candle fund","hint":"Easy money, lasting shame","tag":"greedy","effects":{"gold":35},"result":"You leave with the coins. The class grows dark."},
      {"id":"go","label":"Keep descending","hint":"No roll","effects":{},"result":"The teacher counts students aloud as the roof groans."},
    ],
  },
  {
    id: "floodline-market",
    layer: 1,
    title: "Floodline Market",
    text: "A crowded market floats on chained barges. Fisherfolk, refugees and itinerant merchants refuse a monopoly on drinking water.",
    options: [
      {"id":"broker","label":"Broker a cooperative water charter","hint":"d20 + Wits vs 14","tag":"curious","effects":{},"check":{"stat":"wit","dc":14,"win":{"mercy":1,"gold":30},"lose":{"gold":-12},"winText":"Three rival stallkeepers sign a joint charter. They pay you in clean water and coin.","loseText":"An aristocratic lawyer writes a loophole larger than the market."},"result":""},
      {"id":"repair","label":"Repair the flood pump","hint":"d20 + Magic vs 14","tag":"kind","effects":{},"check":{"stat":"mag","dc":14,"win":{"heal":0.2,"boon":{"wit":1}},"lose":{"hurt":0.06},"winText":"The pump coughs clean water into every barrel in the street.","loseText":"A gasket bursts, and the market is flooded with brine."},"result":""},
      {"id":"buy","label":"Buy a private water permit","hint":"Costs 25 gold","requires":{"gold":25},"effects":{"gold":-25,"potion":1},"result":"You get a sealed flask. The queue behind you gets longer."},
      {"id":"leave","label":"Walk on","hint":"No roll","effects":{},"result":"The market barge recedes behind the rain."},
    ],
  },
  {
    id: "drowned-tenement",
    layer: 1,
    title: "Tenement Evacuation",
    text: "A landlord has closed the only dry stair. Families are trapped above rising water while his hired guards demand unpaid rent.",
    options: [
      {"id":"argue","label":"Challenge the landlord’s authority","hint":"d20 + Wits vs 15","tag":"bold","effects":{},"check":{"stat":"wit","dc":15,"win":{"mercy":2,"gold":25},"lose":{"hurt":0.09},"winText":"The guards read the eviction notice and turn on the landlord.","loseText":"The guards shove you from the landing and lock the gate."},"result":""},
      {"id":"lift","label":"Carry families through the water","hint":"d20 + Defence vs 13","tag":"kind","effects":{},"check":{"stat":"def","dc":13,"win":{"mercy":2,"heal":0.1},"lose":{"hurt":0.12},"winText":"The last child reaches dry ground on your shoulders.","loseText":"The current knocks the party against the railing."},"result":""},
      {"id":"bribe","label":"Pay the guard captain","hint":"Costs 35 gold","tag":"pious","requires":{"gold":35},"effects":{"gold":-35,"mercy":1},"result":"The door opens. Everyone sees whose pocket the coin entered."},
      {"id":"walk","label":"Find another passage","hint":"No roll","effects":{},"result":"You hear the tenants banging on the stair door long after you leave."},
    ],
  },
  {
    id: "heatworks-slowdown",
    layer: 2,
    title: "The Heatworks Slowdown",
    text: "The forge workers have stopped the great furnaces. The foreman claims the Deepheart belongs to the surface investors, and the machinery is starting to buckle.",
    options: [
      {"id":"organize","label":"Negotiate shift ownership","hint":"d20 + Wits vs 16","tag":"curious","effects":{},"check":{"stat":"wit","dc":16,"win":{"mercy":2,"boon":{"atk":1}},"lose":{"hurt":0.1},"winText":"Workers rewrite the furnace schedule and elect their own keeper.","loseText":"The foreman calls the guards while the boilers climb toward red."},"result":""},
      {"id":"vent","label":"Vent the runaway boiler","hint":"d20 + Magic vs 15","tag":"kind","effects":{},"check":{"stat":"mag","dc":15,"win":{"heal":0.2,"mercy":1},"lose":{"hurt":0.16},"winText":"A column of steam roars upward and the workers cheer from the floor.","loseText":"Superheated steam burns through the ruined insulation."},"result":""},
      {"id":"take","label":"Sell the foreman a new deed","hint":"A lucrative forgery","tag":"greedy","effects":{"gold":90},"result":"You leave richer. The workers will pay the difference for years."},
      {"id":"refuse","label":"Leave the machinery alone","hint":"No roll","effects":{},"result":"The forge bell rings without anyone answering."},
    ],
  },
  {
    id: "roots-common",
    layer: 2,
    title: "The Root Commons",
    text: "At the volcanic root line, a community of fungi-growers cultivates food around the beating stone. The crown calls their garden a trespass.",
    options: [
      {"id":"shield","label":"Defend the commons charter","hint":"d20 + Wits vs 15","tag":"kind","effects":{},"check":{"stat":"wit","dc":15,"win":{"mercy":2,"boon":{"mag":1}},"lose":{"gold":-15},"winText":"The charter is upheld. Children race to plant new stalks.","loseText":"A crown notary levies a fine for every root."},"result":""},
      {"id":"reroute","label":"Reroute heat to the gardens","hint":"d20 + Magic vs 15","tag":"curious","effects":{},"check":{"stat":"mag","dc":15,"win":{"heal":0.25,"potion":1},"lose":{"hurt":0.08},"winText":"Warmth spreads through the growing beds, and the growers offer you their best harvest.","loseText":"The stone vents ash over the most delicate crop."},"result":""},
      {"id":"steal","label":"Sell the rarest mushroom","hint":"A quick profit","tag":"greedy","effects":{"gold":70},"result":"You receive a fine purse. The gardeners notice the empty bed."},
      {"id":"decline","label":"Keep moving","hint":"No roll","effects":{},"result":"A grower hands you one plain mushroom for the road."},
    ],
  },
]
