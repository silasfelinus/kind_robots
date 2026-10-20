// Market catalog (conductor emperor-of-dust t-024, SYSTEMS-V03.md "Market —
// equipment"). Every item fits one of a follower's two slots: a tool or a
// charm. Staples come from the fortress stores; the rest arrive with the people
// who make them, and only while those people still trade with the court.
import type { ItemDef } from './types'

export const ITEMS: readonly ItemDef[] = [
  // --- fortress staples ------------------------------------------------------
  {
    id: 'old-road-crowbar',
    name: 'Old-road Crowbar',
    slot: 'tool',
    price: 20,
    text: 'Salvaged steel that does not bend.',
    stats: { might: 2 },
  },
  {
    id: 'lockpick-roll',
    name: 'Lockpick Roll',
    slot: 'tool',
    price: 20,
    text: 'Twelve picks and a patient hand.',
    stats: { guile: 2 },
  },
  {
    id: 'surveyors-glass',
    name: 'Surveyor’s Glass',
    slot: 'tool',
    price: 25,
    text: 'A lens that does not break.',
    stats: { wits: 2 },
  },
  {
    id: 'storm-glass-vial',
    name: 'Storm-glass Vial',
    slot: 'charm',
    price: 30,
    text: 'Clouds move inside it.',
    stats: { lore: 2 },
  },
  {
    id: 'field-kit',
    name: 'Field Kit',
    slot: 'charm',
    price: 25,
    text: 'Bandages, needle, a bitter tincture.',
    ability: { kind: 'field-surgery', amount: 1 },
  },
  {
    id: 'courier-spurs',
    name: 'Courier’s Spurs',
    slot: 'charm',
    price: 35,
    text: 'Every road is shorter in these.',
    ability: { kind: 'swift', amount: 1 },
  },
  {
    id: 'bell-clapper',
    name: 'Cracked Bell Clapper',
    slot: 'tool',
    price: 30,
    text: 'Iron from the old bell. Mara Reedbell wants it back.',
    stats: { might: 1 },
    edge: { tag: 'defense', amount: 2 },
    onBuy: { affinity: { 'hollow-bell': -3 } },
  },

  // --- Hollow Bell -----------------------------------------------------------
  {
    id: 'brass-bell-charm',
    name: 'Brass Bell Charm',
    slot: 'charm',
    price: 20,
    text: 'A little bell that opens doors.',
    stats: { heart: 2 },
    faction: 'hollow-bell',
    stock: { tier: 'wary' },
  },

  // --- Saltroad Caravans -----------------------------------------------------
  {
    id: 'saltroad-waybill',
    name: 'Saltroad Waybill',
    slot: 'tool',
    price: 25,
    text: 'A stamped pass. Toll-men wave it through.',
    stats: { heart: 1 },
    faction: 'saltroad',
    stock: { tier: 'neutral' },
    edge: { faction: 'saltroad', amount: 2 },
  },
  {
    id: 'caravan-salve',
    name: 'Caravan Salve',
    slot: 'charm',
    price: 35,
    text: 'Tallow and salt in a tin. It stings. It works.',
    faction: 'saltroad',
    stock: { tier: 'friendly' },
    ability: { kind: 'field-surgery', amount: 2 },
  },
  {
    id: 'road-lantern',
    name: 'Hooded Road Lantern',
    slot: 'tool',
    price: 30,
    text: 'It shows the road and not the one walking it.',
    stats: { wits: 1 },
    faction: 'saltroad',
    stock: { tier: 'neutral' },
    edge: { tag: 'tracking', amount: 2 },
  },

  // --- The Rustline ----------------------------------------------------------
  {
    id: 'rustline-cutters',
    name: 'Rustline Bolt-cutters',
    slot: 'tool',
    price: 40,
    text: 'Lost-human steel. The jaws still close true.',
    stats: { might: 3 },
    faction: 'rustline',
    stock: { tier: 'neutral' },
    onBuy: { local: { lamplight: -1 } },
  },
  {
    id: 'signal-coil',
    name: 'Dead Signal Coil',
    slot: 'charm',
    price: 40,
    text: 'Copper on a spool. It hums near what is hidden.',
    faction: 'rustline',
    stock: { tier: 'neutral' },
    ability: { kind: 'scout', amount: 1 },
    onBuy: { local: { lamplight: -1 } },
  },
  {
    id: 'magpie-scales',
    name: 'Magpie Scales',
    slot: 'tool',
    price: 35,
    text: 'Weighs brass to the grain. Nobody cheats the holder.',
    faction: 'rustline',
    stock: { tier: 'wary' },
    ability: { kind: 'bounty', amount: 10 },
  },
  {
    id: 'lost-human-gauntlet',
    name: 'Lost-human Gauntlet',
    slot: 'tool',
    price: 55,
    text: 'Plates and wire. Whoever wore it did not come back for it.',
    stats: { might: 2, wits: 2 },
    faction: 'rustline',
    stock: { tier: 'friendly' },
    onBuy: { local: { lamplight: -2 } },
  },

  // --- Storm Crow Conclave ---------------------------------------------------
  {
    id: 'crow-glass-eye',
    name: 'Crow-glass Eye',
    slot: 'charm',
    price: 40,
    text: 'Black glass ground thin. Look at weather through it, not people.',
    stats: { lore: 3 },
    faction: 'storm-crows',
    stock: { tier: 'friendly' },
  },
  {
    id: 'rain-feather',
    name: 'Rain Feather',
    slot: 'charm',
    price: 50,
    text: 'An oiled pinion. It goes cold before bad news.',
    faction: 'storm-crows',
    stock: { tier: 'friendly' },
    ability: { kind: 'omen', amount: 1 },
  },

  // --- Mire Mothers ----------------------------------------------------------
  {
    id: 'reed-poppet',
    name: 'Reed Poppet',
    slot: 'charm',
    price: 35,
    text: 'Reed and hair, tied wet. It takes the first blow.',
    faction: 'mire-mothers',
    stock: { tier: 'neutral' },
    ability: { kind: 'guardian', amount: 15 },
    onBuy: { affinity: { abbey: -3 } },
  },
  {
    id: 'witchwater-phial',
    name: 'Witchwater Phial',
    slot: 'charm',
    price: 60,
    text: 'Bog water that never settles. Shake it before you roll.',
    faction: 'mire-mothers',
    stock: { tier: 'friendly' },
    ability: { kind: 'lucky', amount: 1 },
    onBuy: { affinity: { abbey: -5 }, flags: ['bought:witchwater-phial'] },
  },

  // --- The Abbey -------------------------------------------------------------
  {
    id: 'abbey-candle',
    name: 'Abbey Candle Stub',
    slot: 'charm',
    price: 30,
    text: 'Half-burned. The sisters say it was lit for you.',
    faction: 'abbey',
    stock: { tier: 'neutral' },
    ability: { kind: 'apology', amount: 1 },
    onBuy: { affinity: { abbey: 2, 'mire-mothers': -2 } },
  },
  {
    id: 'silent-bell-rosary',
    name: 'Silent Bell Rosary',
    slot: 'charm',
    price: 45,
    text: 'Beads that do not click. People tell the wearer things.',
    stats: { heart: 1 },
    faction: 'abbey',
    stock: { tier: 'friendly' },
    ability: { kind: 'confessor', amount: 1 },
    onBuy: { affinity: { abbey: 2 }, flags: ['bought:silent-bell-rosary'] },
  },

  // --- Jackalwire Pack -------------------------------------------------------
  {
    id: 'snare-kit',
    name: 'Jackalwire Snare Kit',
    slot: 'tool',
    price: 35,
    text: 'Rail wire and a hook. The Freeholds know where it comes from.',
    stats: { guile: 3 },
    faction: 'jackalwire',
    stock: { tier: 'wary' },
    onBuy: { affinity: { freeholds: -3, jackalwire: 2 } },
  },
  {
    id: 'hyena-tooth',
    name: 'Hyena Tooth',
    slot: 'charm',
    price: 45,
    text: 'A tooth on a thong. Pack riders laugh when they wear it.',
    faction: 'jackalwire',
    stock: { tier: 'neutral' },
    ability: { kind: 'encore', amount: 1 },
    onBuy: { affinity: { freeholds: -2 } },
  },

  // --- Border Freeholds ------------------------------------------------------
  {
    id: 'freehold-spade',
    name: 'Freehold Spade',
    slot: 'tool',
    price: 25,
    text: 'Ash handle, mended twice. Better than new.',
    stats: { might: 1, wits: 1 },
    faction: 'freeholds',
    stock: { tier: 'neutral' },
    edge: { tag: 'repair', amount: 2 },
  },

  // --- Mole Revolutionaries --------------------------------------------------
  {
    id: 'carbide-lamp',
    name: 'Mole Carbide Lamp',
    slot: 'tool',
    price: 30,
    text: 'It burns blue where the air goes bad.',
    stats: { wits: 1 },
    faction: 'moles',
    stock: { tier: 'wary' },
    edge: { tag: 'tunnels', amount: 3 },
    onBuy: { affinity: { 'mire-mothers': -2 } },
  },

  // --- The Black Verge Court -------------------------------------------------
  {
    id: 'verge-signet',
    name: 'Black Verge Signet',
    slot: 'charm',
    price: 50,
    text: 'Heavy gold. Doors open. Some should stay shut.',
    stats: { heart: 3 },
    faction: 'black-verge',
    stock: { tier: 'wary' },
    edge: { faction: 'black-verge', amount: 2 },
    onBuy: { affinity: { 'hollow-bell': -3 } },
  },
  {
    id: 'night-draught',
    name: 'Night Draught',
    slot: 'charm',
    price: 70,
    text: 'A black cordial. Nobody who drinks it dies tonight. Something is owed.',
    faction: 'black-verge',
    stock: { tier: 'neutral' },
    ability: { kind: 'warden', amount: 1 },
    onBuy: { local: { yard: -2 }, flags: ['bought:night-draught'] },
  },

  // --- the fortress factions -------------------------------------------------
  {
    id: 'watch-buckler',
    name: 'Gate Watch Buckler',
    slot: 'tool',
    price: 35,
    text: 'Dented. The Watch tells every dent badly.',
    stats: { might: 1 },
    stock: { local: { 'gate-watch': 14 } },
    ability: { kind: 'guardian', amount: 10 },
  },
  {
    id: 'ledger-abacus',
    name: 'Ledger Abacus',
    slot: 'tool',
    price: 35,
    text: 'Brass beads on wire. The Ledger counts in its sleep.',
    stats: { wits: 1 },
    stock: { local: { ledger: 14 } },
    ability: { kind: 'bounty', amount: 5 },
  },
  {
    id: 'lamplight-folio',
    name: 'Lamplight Folio',
    slot: 'tool',
    price: 30,
    text: 'Ruled pages. The Archive wants them back full.',
    stats: { lore: 2 },
    stock: { local: { lamplight: 12 } },
    edge: { tag: 'records', amount: 2 },
  },
]

export const itemDef = (id: string): ItemDef | undefined =>
  ITEMS.find((entry) => entry.id === id)

/**
 * Item ids with a delivered icon at public/emperor-of-dust/items/<id>.webp.
 * Empty until market art lands; the market shows its medallion placeholder.
 */
export const ITEM_ART: ReadonlySet<string> = new Set<string>()

/** Placeholder glyphs (kind-icon names) shown in the medallion until art lands. */
export const ITEM_ICONS: Readonly<Record<string, string>> = {
  'old-road-crowbar': 'wrench',
  'lockpick-roll': 'key',
  'surveyors-glass': 'magnify',
  'storm-glass-vial': 'flask',
  'field-kit': 'health-potion',
  'courier-spurs': 'fast-forward',
  'bell-clapper': 'hammer',
  'brass-bell-charm': 'volume-high',
  'saltroad-waybill': 'document',
  'caravan-salve': 'heart-pulse',
  'road-lantern': 'lamp',
  'rustline-cutters': 'scissors',
  'signal-coil': 'resonance',
  'magpie-scales': 'scale',
  'lost-human-gauntlet': 'glove',
  'crow-glass-eye': 'eye',
  'rain-feather': 'feather',
  'reed-poppet': 'mask',
  'witchwater-phial': 'raindrop',
  'abbey-candle': 'flame',
  'silent-bell-rosary': 'gem',
  'snare-kit': 'link',
  'hyena-tooth': 'target',
  'freehold-spade': 'toolbox',
  'carbide-lamp': 'lightbulb',
  'verge-signet': 'ring',
  'night-draught': 'moon',
  'watch-buckler': 'shield',
  'ledger-abacus': 'money',
  'lamplight-folio': 'book',
}

export const itemIcon = (item: ItemDef): string =>
  `kind-icon:${ITEM_ICONS[item.id] ?? (item.slot === 'tool' ? 'wrench' : 'gem')}`
