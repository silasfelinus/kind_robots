// /utils/arcade/sinkSuds/shop.ts
//
// Sink Suds' power-ups and the Soap Shop as data (conductor kr-arcade/t-044).
// Power-ups float up out of the drain now and then; soap bars, collected in
// play (never real money), buy upgrades and bubble skins between rooms.

export type PowerKind =
  'duck' | 'lemon' | 'supersuds' | 'squeegee' | 'bathbomb' | 'magnet'

export type PowerDef = {
  name: string
  /** How long it lasts once picked up (0: it acts at once). */
  ticks: number
  /** One line for the table guide. */
  does: string
}

export const POWERS: Record<PowerKind, PowerDef> = {
  duck: {
    name: 'RUBBER DUCK',
    ticks: 60 * 12,
    does: 'A BODYGUARD BUMPS PESTS AWAY',
  },
  lemon: {
    name: 'LEMON ZEST',
    ticks: 60 * 6,
    does: 'PESTS FLEE FOR 6 SECONDS',
  },
  supersuds: {
    name: 'SUPER SUDS',
    ticks: 60 * 8,
    does: 'FULL SIZE FOR 8 SECONDS',
  },
  squeegee: {
    name: 'SQUEEGEE',
    ticks: 0,
    does: 'WIPES A STRIPE OF GRIME CLEAN',
  },
  bathbomb: {
    name: 'BATH BOMB',
    ticks: 0,
    does: 'A FIZZ TRAPS EVERY PEST NEARBY',
  },
  magnet: {
    name: 'MAGNET SPONGE',
    ticks: 60 * 10,
    does: 'CRUMBS DRIFT TO YOU',
  },
}

export const POWER_KINDS = Object.keys(POWERS) as PowerKind[]

/** Ticks between things bubbling up out of the drain. */
export const FLOAT_EVERY = 60 * 16
/** A floating pickup lasts this long before it pops. */
export const FLOAT_LIFE = 60 * 11
/** Of the things that float up, this share are soap bars. */
export const SOAP_SHARE = 0.3
/** The Bath Bomb's reach. */
export const BOMB_REACH = 90
/** The Squeegee's stripe, in pixels tall. */
export const SQUEEGEE_BAND = 22

/** Soap bars for clearing a basin, and for the extras on top. */
export const BARS = { basin: 1, squeaky: 1, special: 2, boss: 5 } as const

export type ShopId =
  | 'spare'
  | 'puff'
  | 'stage2'
  | 'sturdy'
  | 'hint'
  | 'rainbow'
  | 'starry'
  | 'frosted'
  | 'done'

export type ShopItem = {
  id: ShopId
  name: string
  price: number
  /** What it does, under the list. */
  blurb: string
  /** Bought once and kept (an upgrade or a skin), or bought again each visit. */
  once: boolean
}

export const SHOP_ITEMS: readonly ShopItem[] = [
  {
    id: 'spare',
    name: 'SPARE BUBBLE',
    price: 6,
    blurb: 'ONE MORE LIFE',
    once: false,
  },
  {
    id: 'puff',
    name: 'LONGER PUFF',
    price: 5,
    blurb: 'PUFF FASTER, FARTHER, MORE OFTEN',
    once: true,
  },
  {
    id: 'stage2',
    name: 'HEAD START',
    price: 5,
    blurb: 'START EVERY BASIN AT SIZE 2',
    once: true,
  },
  {
    id: 'sturdy',
    name: 'STURDY FILM',
    price: 4,
    blurb: 'THE NEXT HIT IS FREE',
    once: false,
  },
  {
    id: 'hint',
    name: 'GOLDEN HINT',
    price: 2,
    blurb: 'WHERE THE NEXT GOLDEN SOAP HIDES',
    once: false,
  },
  {
    id: 'rainbow',
    name: 'RAINBOW SKIN',
    price: 3,
    blurb: 'A RAINBOW FILM (LOOKS ONLY)',
    once: true,
  },
  {
    id: 'starry',
    name: 'STARRY SKIN',
    price: 3,
    blurb: 'A NIGHT-SKY FILM (LOOKS ONLY)',
    once: true,
  },
  {
    id: 'frosted',
    name: 'FROSTED SKIN',
    price: 3,
    blurb: 'A FROSTY FILM (LOOKS ONLY)',
    once: true,
  },
  {
    id: 'done',
    name: 'BACK TO WORK',
    price: 0,
    blurb: 'ON TO THE NEXT ROOM',
    once: false,
  },
]

export type SkinId = 'plain' | 'rainbow' | 'starry' | 'frosted'

/** Film colours per skin (inner, middle, rim), for renderBubble's tint. */
export const SKIN_TINTS: Record<SkinId, readonly [string, string, string]> = {
  plain: [
    'rgba(165, 243, 252, 0.35)',
    'rgba(244, 114, 182, 0.4)',
    'rgba(167, 139, 250, 0.75)',
  ],
  rainbow: [
    'rgba(250, 204, 21, 0.4)',
    'rgba(74, 222, 128, 0.45)',
    'rgba(236, 72, 153, 0.8)',
  ],
  starry: [
    'rgba(129, 140, 248, 0.45)',
    'rgba(49, 46, 129, 0.55)',
    'rgba(30, 27, 75, 0.85)',
  ],
  frosted: [
    'rgba(255, 255, 255, 0.55)',
    'rgba(186, 230, 253, 0.55)',
    'rgba(125, 211, 252, 0.8)',
  ],
}

/** Puff tuning: base, and with the Longer Puff upgrade. */
export const PUFF = {
  base: { speed: 4.2, cooldown: 70 },
  long: { speed: 4.9, cooldown: 48 },
} as const
