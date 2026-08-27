// /server/utils/aquarium.ts
//
// Cthulhuquarium tank business logic (cthulhuquarium/t-009). Route handlers
// under server/api/aquarium/** stay thin (auth, param parsing, response
// shape) and delegate here, mirroring server/utils/davinci.ts's split with
// the davinci runs API.
//
// All economy math is delegated to server/utils/aquariumEconomy.ts (pure,
// no prisma) -- this file's job is loading/persisting Prisma state around
// that math and enforcing ownership/authorization. The client proposes
// (a monsterId to unlock, an aquariumStockId to feed); the server disposes
// (prices, caps, and elapsed-tick income all come from here, never from the
// request body).

import type { Prisma } from '~/prisma/generated/prisma/client'
import prisma from './prisma'
import { getUniqueAquariumSlugForUser } from './aquariumSlug'
import {
  cleanDebris,
  deriveFishRarityTier,
  feedCost,
  FEED_RESTORES_HUNGER_TO,
  HUNGER_STARTING_VALUE,
  settleTick,
  unlockCost,
} from './aquariumEconomy'

function apiError(statusCode: number, message: string): Error {
  const error = new Error(message) as Error & { statusCode: number }
  error.statusCode = statusCode
  return error
}

// prisma is $extends()-wrapped (see server/utils/prisma.ts), so its
// $transaction callback's tx param has extended InternalArgs that don't
// structurally match the plain Prisma.TransactionClient type. Derive the
// type from the actual instance instead of the generated default -- same
// workaround as server/utils/davinci.ts.
type TransactionClient = Parameters<
  Parameters<typeof prisma.$transaction>[0]
>[0]

// Six Rarity stat fields every Monster row carries -- see
// aquariumEconomy.ts's deriveFishRarityTier for why this stands in for a
// canonical per-species rarity/tier column that does not exist yet.
const monsterRaritySelect = {
  charm: true,
  empathy: true,
  grace: true,
  luck: true,
  might: true,
  wits: true,
} satisfies Prisma.MonsterSelect

const stockMonsterSelect = {
  id: true,
  name: true,
  slug: true,
  species: true,
  // fieldNote is safe to select here: this shape is only ever used for
  // fish ALREADY placed in a tank (ownedStockSelect below, and the public
  // browse selects have their own, separate, fieldNote-free shape) --
  // never for the pre-unlock catalog (cthulhuquarium/t-012). See that
  // task's note: "the field note reveals on first unlock, not before."
  fieldNote: true,
  size: true,
  icon: true,
  iconPath: true,
  cardPath: true,
  // tier/behavior/hue are the renderer's fields (cthulhuquarium/t-011): tier
  // for a rarity-readable cue, behavior for swim-pattern selection (the
  // bible's own drift/dart/lurk/school/anchor/surface/hover/tumble/cling
  // vocabulary), hue as the reserved palette-shift column schema.prisma
  // already carries for exactly this renderer, falling back to a
  // slug-derived hue client-side when null.
  tier: true,
  behavior: true,
  hue: true,
  ...monsterRaritySelect,
} satisfies Prisma.MonsterSelect

const ownedStockSelect = {
  id: true,
  monsterId: true,
  nickname: true,
  hunger: true,
  mood: true,
  placedAt: true,
  Monster: { select: stockMonsterSelect },
} satisfies Prisma.AquariumStockSelect

const ownedAquariumSelect = {
  id: true,
  slug: true,
  title: true,
  coins: true,
  backgroundKey: true,
  isPublic: true,
  lastTickAt: true,
  setSlotsCap: true,
  sizeCap: true,
  debrisLevel: true,
  lastCleanedAt: true,
  createdAt: true,
  updatedAt: true,
  Stock: { select: ownedStockSelect },
} satisfies Prisma.AquariumSelect

export type OwnedAquarium = Prisma.AquariumGetPayload<{
  select: typeof ownedAquariumSelect
}>

const DEFAULT_STARTING_COINS = 0

async function logEvent(
  tx: TransactionClient,
  aquariumId: number,
  kind: string,
  payload: unknown,
): Promise<void> {
  await tx.aquariumEvent.create({
    data: {
      aquariumId,
      kind,
      payload: payload === undefined ? null : JSON.stringify(payload),
    },
  })
}

// Loads the authenticated user's tank, creating one with default state on
// first visit rather than 404ing (t-009 task note).
export async function getOrCreateTankForUser(
  userId: number,
  username: string,
): Promise<OwnedAquarium> {
  const existing = await prisma.aquarium.findFirst({
    where: { userId },
    select: ownedAquariumSelect,
    orderBy: { id: 'asc' },
  })
  if (existing) return existing

  const slug = await getUniqueAquariumSlugForUser(userId, username)

  return prisma.aquarium.create({
    data: {
      userId,
      slug,
      title: `${username}'s Tank`,
      coins: DEFAULT_STARTING_COINS,
    },
    select: ownedAquariumSelect,
  })
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

export interface TickResult {
  aquarium: OwnedAquarium
  elapsedTicks: number
  ticksProcessed: number
  coinsEarned: number
}

export async function settleTickForUser(
  userId: number,
  username: string,
): Promise<TickResult> {
  const tank = await getOrCreateTankForUser(userId, username)

  const settlement = settleTick({
    lastTickAt: tank.lastTickAt,
    now: new Date(),
    debrisLevel: tank.debrisLevel,
    fish: tank.Stock.map((stock) => ({
      id: stock.id,
      rarity: deriveFishRarityTier(stock.Monster),
      hunger: stock.hunger,
    })),
  })

  if (settlement.ticksProcessed <= 0) {
    return {
      aquarium: tank,
      elapsedTicks: settlement.elapsedTicks,
      ticksProcessed: 0,
      coinsEarned: 0,
    }
  }

  const aquarium = await prisma.$transaction(async (tx) => {
    for (const stock of tank.Stock) {
      const newHunger = settlement.fishHunger.get(stock.id)
      if (newHunger !== undefined && newHunger !== stock.hunger) {
        await tx.aquariumStock.update({
          where: { id: stock.id },
          data: { hunger: newHunger },
        })
      }
    }

    const updated = await tx.aquarium.update({
      where: { id: tank.id },
      data: {
        coins: { increment: settlement.coinsEarned },
        debrisLevel: settlement.newDebrisLevel,
        lastTickAt: settlement.newLastTickAt,
      },
      select: ownedAquariumSelect,
    })

    await logEvent(tx, tank.id, 'tick', {
      elapsedTicks: settlement.elapsedTicks,
      ticksProcessed: settlement.ticksProcessed,
      coinsEarned: settlement.coinsEarned,
      newDebrisLevel: settlement.newDebrisLevel,
    })

    return updated
  })

  return {
    aquarium,
    elapsedTicks: settlement.elapsedTicks,
    ticksProcessed: settlement.ticksProcessed,
    coinsEarned: settlement.coinsEarned,
  }
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

export interface FeedResult {
  aquarium: OwnedAquarium
  aquariumStockId: number
  cost: number
  hunger: number
}

export async function feedFishForUser(
  userId: number,
  username: string,
  aquariumStockId: number,
): Promise<FeedResult> {
  const tank = await getOrCreateTankForUser(userId, username)

  const stock = tank.Stock.find((row) => row.id === aquariumStockId)
  if (!stock) {
    throw apiError(
      404,
      `AquariumStock ${aquariumStockId} was not found in your tank.`,
    )
  }

  const rarity = deriveFishRarityTier(stock.Monster)
  const cost = feedCost(rarity)

  if (tank.coins < cost) {
    throw apiError(
      402,
      `Feeding ${stock.Monster.name} costs ${cost} coins; your tank only has ${tank.coins}.`,
    )
  }

  const aquarium = await prisma.$transaction(async (tx) => {
    await tx.aquariumStock.update({
      where: { id: stock.id },
      data: { hunger: FEED_RESTORES_HUNGER_TO },
    })

    const updated = await tx.aquarium.update({
      where: { id: tank.id },
      data: { coins: { decrement: cost } },
      select: ownedAquariumSelect,
    })

    await logEvent(tx, tank.id, 'feed', {
      aquariumStockId: stock.id,
      monsterId: stock.monsterId,
      cost,
    })

    return updated
  })

  return {
    aquarium,
    aquariumStockId: stock.id,
    cost,
    hunger: FEED_RESTORES_HUNGER_TO,
  }
}

// ---------------------------------------------------------------------------
// Clean -- the manual-click active-play channel (cthulhuquarium/t-027).
// Instant, free, no cooldown: debris only ever throttles the production
// RATE (see aquariumEconomy.ts's own header comment on that section), so
// there is nothing here to gate -- clicking can never lose progress, only
// speed it back up. Idempotent at debrisLevel 0 rather than erroring, so a
// client racing its own disabled-button state never has to handle a 4xx.
// ---------------------------------------------------------------------------

export interface CleanResult {
  aquarium: OwnedAquarium
  debrisLevel: number
}

export async function cleanTankForUser(
  userId: number,
  username: string,
): Promise<CleanResult> {
  const tank = await getOrCreateTankForUser(userId, username)
  const newDebrisLevel = cleanDebris(tank.debrisLevel)

  if (newDebrisLevel === tank.debrisLevel) {
    return { aquarium: tank, debrisLevel: tank.debrisLevel }
  }

  const aquarium = await prisma.$transaction(async (tx) => {
    const now = new Date()
    const updated = await tx.aquarium.update({
      where: { id: tank.id },
      data: { debrisLevel: newDebrisLevel, lastCleanedAt: now },
      select: ownedAquariumSelect,
    })

    await logEvent(tx, tank.id, 'clean', {
      previousDebrisLevel: tank.debrisLevel,
      newDebrisLevel,
    })

    return updated
  })

  return { aquarium, debrisLevel: newDebrisLevel }
}

// ---------------------------------------------------------------------------
// Purchase -- species unlock only. See PR description for why `food` and
// `upgrade` purchase types (named in the task note) are intentionally not
// implemented: economy.yaml bundles buying+consuming food into a single
// action (POST /feed already IS that purchase) and states capacity growth
// is milestone-only, "never purchased with coins".
// ---------------------------------------------------------------------------

export interface PurchaseSpeciesResult {
  aquarium: OwnedAquarium
  stock: OwnedAquarium['Stock'][number]
  cost: number
}

export async function purchaseSpeciesForUser(
  userId: number,
  username: string,
  monsterId: number,
): Promise<PurchaseSpeciesResult> {
  const tank = await getOrCreateTankForUser(userId, username)

  const monster = await prisma.monster.findFirst({
    where: { id: monsterId, isActive: true, isPublic: true },
    select: stockMonsterSelect,
  })
  if (!monster) {
    throw apiError(
      404,
      `Monster ${monsterId} does not exist or is not available to unlock.`,
    )
  }

  const alreadyOwned = tank.Stock.some((row) => row.monsterId === monsterId)
  if (alreadyOwned) {
    throw apiError(
      409,
      `${monster.name} is already in your tank -- Cthulhuquarium is a collection, not copies of the same fish.`,
    )
  }

  const currentSize = tank.Stock.reduce(
    (sum, row) => sum + (row.Monster.size ?? 1),
    0,
  )
  const newSize = monster.size ?? 1
  if (currentSize + newSize > tank.sizeCap) {
    throw apiError(
      409,
      `Adding ${monster.name} (size ${newSize}) would exceed your tank's capacity (${currentSize}/${tank.sizeCap} used).`,
    )
  }

  const rarity = deriveFishRarityTier(monster)
  const cost = unlockCost(rarity)

  if (tank.coins < cost) {
    throw apiError(
      402,
      `Unlocking ${monster.name} costs ${cost} coins; your tank only has ${tank.coins}.`,
    )
  }

  const { aquarium, stock } = await prisma.$transaction(async (tx) => {
    const createdStock = await tx.aquariumStock.create({
      data: {
        aquariumId: tank.id,
        monsterId: monster.id,
        hunger: HUNGER_STARTING_VALUE,
      },
      select: ownedStockSelect,
    })

    const updatedAquarium = await tx.aquarium.update({
      where: { id: tank.id },
      data: { coins: { decrement: cost } },
      select: ownedAquariumSelect,
    })

    await logEvent(tx, tank.id, 'purchase', {
      type: 'species',
      monsterId: monster.id,
      aquariumStockId: createdStock.id,
      cost,
    })

    return { aquarium: updatedAquarium, stock: createdStock }
  })

  return { aquarium, stock, cost }
}

// ---------------------------------------------------------------------------
// Public browse -- display name + tank contents ONLY, never email or userId.
// ---------------------------------------------------------------------------

const publicOwnerSelect = {
  username: true,
  avatarImage: true,
} satisfies Prisma.UserSelect

const publicStockSelect = {
  id: true,
  nickname: true,
  hunger: true,
  mood: true,
  placedAt: true,
  Monster: {
    select: {
      id: true,
      name: true,
      slug: true,
      species: true,
      size: true,
      icon: true,
      iconPath: true,
      cardPath: true,
    },
  },
} satisfies Prisma.AquariumStockSelect

const publicAquariumDetailSelect = {
  slug: true,
  title: true,
  coins: true,
  backgroundKey: true,
  debrisLevel: true,
  sizeCap: true,
  setSlotsCap: true,
  updatedAt: true,
  User: { select: publicOwnerSelect },
  Stock: { select: publicStockSelect },
} satisfies Prisma.AquariumSelect

const publicAquariumSummarySelect = {
  slug: true,
  title: true,
  backgroundKey: true,
  updatedAt: true,
  User: { select: publicOwnerSelect },
  _count: { select: { Stock: true } },
} satisfies Prisma.AquariumSelect

export type PublicAquarium = Prisma.AquariumGetPayload<{
  select: typeof publicAquariumDetailSelect
}>
export type PublicAquariumSummary = Prisma.AquariumGetPayload<{
  select: typeof publicAquariumSummarySelect
}>

// Aquarium.slug is unique per (userId, slug), NOT globally (t-032 fixed a
// real collision bug caused by a global unique constraint) -- so a public
// tank is addressed by (username, slug) together, never slug alone.
export async function getPublicTankByUsernameAndSlug(
  username: string,
  slug: string,
): Promise<PublicAquarium> {
  const tank = await prisma.aquarium.findFirst({
    where: { slug, isPublic: true, User: { username } },
    select: publicAquariumDetailSelect,
  })
  if (!tank) {
    throw apiError(404, 'Public tank not found.')
  }
  return tank
}

export interface PublicTankListResult {
  data: PublicAquariumSummary[]
  take: number
  skip: number
  total: number
}

export async function listPublicTanks(
  take: number,
  skip: number,
): Promise<PublicTankListResult> {
  const [data, total] = await Promise.all([
    prisma.aquarium.findMany({
      where: { isPublic: true },
      select: publicAquariumSummarySelect,
      orderBy: { updatedAt: 'desc' },
      take,
      skip,
    }),
    prisma.aquarium.count({ where: { isPublic: true } }),
  ])

  return { data, take, skip, total }
}

// ---------------------------------------------------------------------------
// Catalog -- species the user's tank does not yet own, for the unlock panel
// (cthulhuquarium/t-011). `cost` is computed the exact same way
// purchaseSpeciesForUser charges (deriveFishRarityTier + unlockCost) so the
// displayed price never drifts from what unlocking actually costs.
//
// Deliberately no `fieldNote` here (cthulhuquarium/t-012): "unlocking a
// species the player has never seen should feel like the point of the
// game... the field note reveals on first unlock, not before." The
// museum-placard text only becomes selectable once a species is owned
// (see stockMonsterSelect) -- the server never sends the spoiler pre-sale,
// same "server disposes" discipline as pricing.
// ---------------------------------------------------------------------------

const catalogMonsterSelect = {
  id: true,
  name: true,
  slug: true,
  species: true,
  depth: true,
  size: true,
  icon: true,
  iconPath: true,
  cardPath: true,
  tier: true,
  behavior: true,
  hue: true,
  ...monsterRaritySelect,
} satisfies Prisma.MonsterSelect

export type CatalogMonster = Prisma.MonsterGetPayload<{
  select: typeof catalogMonsterSelect
}>

export interface CatalogEntry extends CatalogMonster {
  cost: number
}

export interface CatalogResult {
  data: CatalogEntry[]
  take: number
  skip: number
  total: number
}

export async function listCatalogForUser(
  userId: number,
  username: string,
  take: number,
  skip: number,
): Promise<CatalogResult> {
  const tank = await getOrCreateTankForUser(userId, username)
  const ownedIds = tank.Stock.map((row) => row.monsterId)

  // Monster is a shared bestiary table (cthulhuquarium/t-035's `games`
  // column) -- a ruler-hooked-only row should not show up here as
  // unlockable. cthulhuquarium/t-022 (shared bestiary handshake) owns
  // deciding cross-game unlock rules beyond this simple membership filter.
  const where: Prisma.MonsterWhereInput = {
    isActive: true,
    isPublic: true,
    games: { contains: 'cthulhuquarium' },
    ...(ownedIds.length > 0 ? { id: { notIn: ownedIds } } : {}),
  }

  const [rows, total] = await Promise.all([
    prisma.monster.findMany({
      where,
      select: catalogMonsterSelect,
      orderBy: [{ depth: 'asc' }, { name: 'asc' }],
      take,
      skip,
    }),
    prisma.monster.count({ where }),
  ])

  const data: CatalogEntry[] = rows.map((monster) => ({
    ...monster,
    cost: unlockCost(deriveFishRarityTier(monster)),
  }))

  return { data, take, skip, total }
}
