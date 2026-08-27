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
  conflictsWithEquippedIdleSet,
  deriveFishRarityTier,
  effectiveSizeCap,
  feedCoinRebate,
  feedCost,
  FEED_RESTORES_HUNGER_TO,
  HUNGER_STARTING_VALUE,
  isKnownSetPieceKind,
  justCompletedBestiary as computeJustCompletedBestiary,
  MAX_CLEAN_CLICKS_PER_REQUEST,
  mergeBestStats,
  SET_PIECE_CATALOG,
  settleTick,
  unlockCost,
} from './aquariumEconomy'
import type { StatBlock } from './aquariumEconomy'

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

// Per-species economy overrides (cthulhuquarium/t-047) -- null on any of
// these means "use the tier default"; aquariumEconomy.ts's
// incomePerTick/unlockCost/effectiveTickSeconds all implement that fallback,
// so every call site here just passes the raw (possibly-null) column
// through rather than resolving the default itself.
const monsterEconomyOverridesSelect = {
  yieldPerTick: true,
  tickIntervalSeconds: true,
  unlockCost: true,
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
  ...monsterEconomyOverridesSelect,
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

// cthulhuquarium/t-026: the tank's equipped set pieces. Ordered oldest-
// first so the UI can show "what you built up over time" rather than a
// re-shuffling list on every load.
const ownedSetSelect = {
  id: true,
  kind: true,
  equippedAt: true,
} satisfies Prisma.AquariumSetSelect

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
  Sets: { select: ownedSetSelect, orderBy: { equippedAt: 'asc' } },
} satisfies Prisma.AquariumSelect

export type OwnedAquarium = Prisma.AquariumGetPayload<{
  select: typeof ownedAquariumSelect
}>

// The wire shape every route actually returns: OwnedAquarium plus
// effectiveSizeCap, the sizeCap.raw + extra_species_slot bonuses derived
// number (aquariumEconomy.ts). Computed server-side rather than left for
// the client to re-derive from `Sets` + a hardcoded bonus value -- same
// "the server disposes, the client never invents an economy number"
// discipline as everywhere else in this file.
export interface ClientAquarium extends OwnedAquarium {
  effectiveSizeCap: number
}

function toClientAquarium(aquarium: OwnedAquarium): ClientAquarium {
  return {
    ...aquarium,
    effectiveSizeCap: effectiveSizeCap(
      aquarium.sizeCap,
      aquarium.Sets.map((set) => set.kind),
    ),
  }
}

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
): Promise<ClientAquarium> {
  const existing = await prisma.aquarium.findFirst({
    where: { userId },
    select: ownedAquariumSelect,
    orderBy: { id: 'asc' },
  })
  if (existing) return toClientAquarium(existing)

  const slug = await getUniqueAquariumSlugForUser(userId, username)

  const created = await prisma.aquarium.create({
    data: {
      userId,
      slug,
      title: `${username}'s Tank`,
      coins: DEFAULT_STARTING_COINS,
    },
    select: ownedAquariumSelect,
  })
  return toClientAquarium(created)
}

// ---------------------------------------------------------------------------
// Tick
// ---------------------------------------------------------------------------

export interface TickResult {
  aquarium: ClientAquarium
  elapsedTicks: number
  ticksProcessed: number
  coinsEarned: number
}

export async function settleTickForUser(
  userId: number,
  username: string,
): Promise<TickResult> {
  const tank = await getOrCreateTankForUser(userId, username)
  const equippedSetKinds = tank.Sets.map((set) => set.kind)

  const settlement = settleTick({
    lastTickAt: tank.lastTickAt,
    now: new Date(),
    debrisLevel: tank.debrisLevel,
    fish: tank.Stock.map((stock) => ({
      id: stock.id,
      rarity: deriveFishRarityTier(stock.Monster),
      hunger: stock.hunger,
      yieldPerTick: stock.Monster.yieldPerTick,
      tickIntervalSeconds: stock.Monster.tickIntervalSeconds,
    })),
    equippedSetKinds,
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
    aquarium: toClientAquarium(aquarium),
    elapsedTicks: settlement.elapsedTicks,
    ticksProcessed: settlement.ticksProcessed,
    coinsEarned: settlement.coinsEarned,
  }
}

// ---------------------------------------------------------------------------
// Feed
// ---------------------------------------------------------------------------

export interface FeedResult {
  aquarium: ClientAquarium
  aquariumStockId: number
  cost: number
  // feeding_bonus (cthulhuquarium/t-026): coins refunded from `cost` this
  // feed, 0 unless that set is equipped. `cost` above stays the sticker
  // price either way -- this is what actually left the tank's balance:
  // netCharged = cost - rebate.
  rebate: number
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
  const cost = feedCost(rarity, stock.Monster.unlockCost)

  if (tank.coins < cost) {
    throw apiError(
      402,
      `Feeding ${stock.Monster.name} costs ${cost} coins; your tank only has ${tank.coins}.`,
    )
  }

  const equippedSetKinds = tank.Sets.map((set) => set.kind)
  const rebate = feedCoinRebate(cost, equippedSetKinds)
  const netCharged = cost - rebate

  const aquarium = await prisma.$transaction(async (tx) => {
    await tx.aquariumStock.update({
      where: { id: stock.id },
      data: { hunger: FEED_RESTORES_HUNGER_TO },
    })

    const updated = await tx.aquarium.update({
      where: { id: tank.id },
      data: { coins: { decrement: netCharged } },
      select: ownedAquariumSelect,
    })

    await logEvent(tx, tank.id, 'feed', {
      aquariumStockId: stock.id,
      monsterId: stock.monsterId,
      cost,
      rebate,
    })

    return updated
  })

  return {
    aquarium: toClientAquarium(aquarium),
    aquariumStockId: stock.id,
    cost,
    rebate,
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
  aquarium: ClientAquarium
  debrisLevel: number
}

export async function cleanTankForUser(
  userId: number,
  username: string,
  // cthulhuquarium/t-013: the client debounces a click spree into one
  // batched call instead of one POST per click; `clicks` is how many landed
  // in that window. Defaults to 1 so every pre-t-013 call site (and a
  // client that omits the field entirely) keeps identical single-click
  // behavior. Clamped server-side -- never trust the request body for the
  // clamp itself (MAX_CLEAN_CLICKS_PER_REQUEST above documents why a large
  // value doesn't unlock anything, it just bounds one request's work).
  clicks = 1,
): Promise<CleanResult> {
  const safeClicks = Math.min(
    Math.max(1, Math.floor(Number.isFinite(clicks) ? clicks : 1)),
    MAX_CLEAN_CLICKS_PER_REQUEST,
  )
  const tank = await getOrCreateTankForUser(userId, username)
  const newDebrisLevel = cleanDebris(tank.debrisLevel, safeClicks)

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
      clicks: safeClicks,
    })

    return updated
  })

  return { aquarium: toClientAquarium(aquarium), debrisLevel: newDebrisLevel }
}

// ---------------------------------------------------------------------------
// The Ichthyonomicon -- the completionist codex, and the record that makes
// selling safe (cthulhuquarium/t-024, extended by t-031). AquariumCodexEntry
// is the permanent "you found this" record: unlike AquariumStock (what's
// CURRENTLY in the tank), a codex row is never deleted, so a species stays
// collected even if the fish is later removed from the tank or the species
// itself is retired from the bible (isActive: false) -- Silas's 2026-08-24
// "nothing here may ever decrease" rule. The bestiary view's denominator is
// therefore the UNION of the currently-active bible and every species this
// user has ever collected, never the active set alone: retiring an
// already-collected species must never shrink the count.
//
// t-031 adds two things on top of t-024's collected/fieldNote view: the
// book's own best-individual-stats record (AquariumCodexEntry.bestStat*,
// t-032's columns -- see mergeBestStats in aquariumEconomy.ts) and a
// currentlyOwned flag distinct from collected, so a species can be "in the
// book" without being "in the tank right now." Today those are always equal
// (there is no sell path yet -- t-030 is `waiting` on this task), but the
// distinction is what t-030's sell-back and re-order flow needs to exist
// safely, per this task's own note: "t-030's rotating stock and sell-back
// are only safe because this exists."
// ---------------------------------------------------------------------------

const BESTIARY_COMPLETE_EVENT_KIND = 'bestiary-complete'

const bestiaryMonsterSelect = {
  id: true,
  name: true,
  slug: true,
  species: true,
  // Selected at the DB level for every row (owned or not) -- stripped in
  // toBestiaryEntry for anything not yet in the user's codex, same "server
  // disposes, never sends the spoiler pre-unlock" discipline as
  // catalogMonsterSelect (cthulhuquarium/t-012).
  fieldNote: true,
  size: true,
  icon: true,
  iconPath: true,
  cardPath: true,
  tier: true,
  behavior: true,
  hue: true,
} satisfies Prisma.MonsterSelect

type BestiaryMonster = Prisma.MonsterGetPayload<{
  select: typeof bestiaryMonsterSelect
}>

export interface BestiaryEntry {
  id: number
  name: string
  slug: string
  species: string | null
  size: number
  icon: string | null
  iconPath: string | null
  cardPath: string | null
  tier: string
  behavior: string | null
  hue: number | null
  collected: boolean
  firstAcquiredAt: string | null
  fieldNote: string | null
  // t-031: distinct from `collected` -- true only while a live AquariumStock
  // row exists for this species. Always equal to `collected` until t-030
  // ships a sell path; drives the book's re-order affordance once it does.
  currentlyOwned: boolean
  // t-031: the book's best-individual-seen record (AquariumCodexEntry's
  // bestStat* columns). All null for any species until cthulhuquarium/t-029
  // (genetics) starts rolling individual stats -- see mergeBestStats.
  bestStats: StatBlock | null
}

export interface BestiaryResult {
  data: BestiaryEntry[]
  collectedCount: number
  totalCount: number
  completed: boolean
}

const cthulhuquariumBestiaryWhere = {
  isPublic: true,
  games: { contains: 'cthulhuquarium' },
} satisfies Prisma.MonsterWhereInput

function bestiaryUnionWhere(collectedIds: number[]): Prisma.MonsterWhereInput {
  return {
    OR: [
      { ...cthulhuquariumBestiaryWhere, isActive: true },
      // No monster has a negative id -- this arm simply drops out of the OR
      // when nothing has been collected yet, rather than needing a second
      // query shape for that case.
      { id: { in: collectedIds.length > 0 ? collectedIds : [-1] } },
    ],
  }
}

const codexBestStatSelect = {
  bestStatCharm: true,
  bestStatEmpathy: true,
  bestStatGrace: true,
  bestStatLuck: true,
  bestStatMight: true,
  bestStatWits: true,
} satisfies Prisma.AquariumCodexEntrySelect

type CodexBestStats = Prisma.AquariumCodexEntryGetPayload<{
  select: typeof codexBestStatSelect
}>

function toStatBlock(row: CodexBestStats): StatBlock {
  return {
    charm: row.bestStatCharm,
    empathy: row.bestStatEmpathy,
    grace: row.bestStatGrace,
    luck: row.bestStatLuck,
    might: row.bestStatMight,
    wits: row.bestStatWits,
  }
}

function isAllNull(stats: StatBlock): boolean {
  return Object.values(stats).every((value) => value == null)
}

// The observed side of every mergeBestStats call in this file today -- see
// the call site's own comment for why that's provably correct, not a stub.
const NULL_STAT_BLOCK: StatBlock = {
  charm: null,
  empathy: null,
  grace: null,
  luck: null,
  might: null,
  wits: null,
}

// Plain scalar shape, not a Prisma *Input type -- these six columns are
// identical between the checked/unchecked create and update input variants,
// so tying this to one of them would fight whichever call site spreads it
// alongside userId/monsterId (unchecked-style FK scalars).
interface CodexBestStatColumns {
  bestStatCharm: number | null
  bestStatEmpathy: number | null
  bestStatGrace: number | null
  bestStatLuck: number | null
  bestStatMight: number | null
  bestStatWits: number | null
}

function fromStatBlock(stats: StatBlock): CodexBestStatColumns {
  return {
    bestStatCharm: stats.charm,
    bestStatEmpathy: stats.empathy,
    bestStatGrace: stats.grace,
    bestStatLuck: stats.luck,
    bestStatMight: stats.might,
    bestStatWits: stats.wits,
  }
}

function toBestiaryEntry(
  monster: BestiaryMonster,
  firstAcquiredAt: Date | null,
  bestStats: StatBlock | null,
  currentlyOwned: boolean,
): BestiaryEntry {
  const collected = firstAcquiredAt !== null
  return {
    id: monster.id,
    name: monster.name,
    slug: monster.slug,
    species: monster.species,
    size: monster.size,
    icon: monster.icon,
    iconPath: monster.iconPath,
    cardPath: monster.cardPath,
    tier: monster.tier,
    behavior: monster.behavior,
    hue: monster.hue,
    collected,
    firstAcquiredAt: firstAcquiredAt ? firstAcquiredAt.toISOString() : null,
    fieldNote: collected ? monster.fieldNote : null,
    // Never owned means never bought a live fish either -- collected can
    // still be true here in the future via a non-purchase route (e.g. a
    // hatched offspring), so this doesn't just mirror `collected`.
    currentlyOwned: collected && currentlyOwned,
    bestStats:
      collected && bestStats && !isAllNull(bestStats) ? bestStats : null,
  }
}

export async function listBestiaryForUser(
  userId: number,
): Promise<BestiaryResult> {
  const [codexEntries, ownedStock] = await Promise.all([
    prisma.aquariumCodexEntry.findMany({
      where: { userId },
      select: {
        monsterId: true,
        firstAcquiredAt: true,
        ...codexBestStatSelect,
      },
    }),
    prisma.aquariumStock.findMany({
      where: { Aquarium: { userId } },
      select: { monsterId: true },
    }),
  ])
  const collectedAt = new Map(
    codexEntries.map((entry) => [entry.monsterId, entry.firstAcquiredAt]),
  )
  const bestStatsByMonster = new Map(
    codexEntries.map((entry) => [entry.monsterId, toStatBlock(entry)]),
  )
  const ownedMonsterIds = new Set(ownedStock.map((row) => row.monsterId))

  const monsters = await prisma.monster.findMany({
    where: bestiaryUnionWhere([...collectedAt.keys()]),
    select: bestiaryMonsterSelect,
    orderBy: [{ name: 'asc' }],
  })

  const data = monsters.map((monster) =>
    toBestiaryEntry(
      monster,
      collectedAt.get(monster.id) ?? null,
      bestStatsByMonster.get(monster.id) ?? null,
      ownedMonsterIds.has(monster.id),
    ),
  )
  const totalCount = data.length
  const collectedCount = data.filter((entry) => entry.collected).length

  return {
    data,
    collectedCount,
    totalCount,
    completed: totalCount > 0 && collectedCount >= totalCount,
  }
}

// Counts-only version of the same union rule, for use inside
// purchaseSpeciesForUser's transaction to detect a first-time full
// completion without pulling the whole display payload.
async function countBestiaryTotals(
  tx: TransactionClient,
  userId: number,
): Promise<{ totalCount: number; collectedCount: number }> {
  const collectedIds = (
    await tx.aquariumCodexEntry.findMany({
      where: { userId },
      select: { monsterId: true },
    })
  ).map((row) => row.monsterId)

  const totalCount = await tx.monster.count({
    where: bestiaryUnionWhere(collectedIds),
  })

  return { totalCount, collectedCount: collectedIds.length }
}

// ---------------------------------------------------------------------------
// Purchase -- species unlock only. See PR description for why `food` and
// `upgrade` purchase types (named in the task note) are intentionally not
// implemented: economy.yaml bundles buying+consuming food into a single
// action (POST /feed already IS that purchase) and states capacity growth
// is milestone-only, "never purchased with coins".
//
// cthulhuquarium/t-026's extra_species_slot set piece does NOT contradict
// that rule: it never raises the base `sizeCap` column milestones grow, it
// occupies one of the tank's scarce, counted setSlotsCap slots and only
// widens the derived `effectiveSizeCap` used below while equipped --
// unequip it (or lose the slot to a different set) and the bonus is gone.
// That is a build choice, not a purchased permanent upgrade.
// ---------------------------------------------------------------------------

export interface PurchaseSpeciesResult {
  aquarium: ClientAquarium
  stock: OwnedAquarium['Stock'][number]
  cost: number
  // True exactly once -- the settlement that brings collectedCount to
  // totalCount for the first time (cthulhuquarium/t-024's "a real beat when
  // the set closes"). Never true again afterward, even though completion
  // itself is never revoked -- see BESTIARY_COMPLETE_EVENT_KIND's guard in
  // the transaction below.
  justCompletedBestiary: boolean
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
  // tank.effectiveSizeCap (aquariumEconomy.ts's effectiveSizeCap) already
  // folds in any equipped extra_species_slot bonus -- see this section's
  // header comment for why that's not a "capacity purchased with coins".
  if (currentSize + newSize > tank.effectiveSizeCap) {
    throw apiError(
      409,
      `Adding ${monster.name} (size ${newSize}) would exceed your tank's capacity (${currentSize}/${tank.effectiveSizeCap} used).`,
    )
  }

  const rarity = deriveFishRarityTier(monster)
  const cost = unlockCost(rarity, monster.unlockCost)

  if (tank.coins < cost) {
    throw apiError(
      402,
      `Unlocking ${monster.name} costs ${cost} coins; your tank only has ${tank.coins}.`,
    )
  }

  const { aquarium, stock, justCompletedBestiary } = await prisma.$transaction(
    async (tx) => {
      const { totalCount, collectedCount: collectedCountBefore } =
        await countBestiaryTotals(tx, userId)

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

      // The permanent codex record -- upsert rather than create, so that if
      // a future feature ever lets a species leave the tank and be rebought,
      // firstAcquiredAt keeps the ORIGINAL discovery date (t-024's "cannot
      // be un-collected" applies to the record, not just the count) instead
      // of a unique-constraint error. Today `alreadyOwned` above already
      // guarantees this monster has no codex row yet -- there is no
      // release/sell path -- so this always takes the `create` branch, but
      // upsert keeps that an invariant of the data rather than of this one
      // call site.
      const existingEntry = await tx.aquariumCodexEntry.findUnique({
        where: { userId_monsterId: { userId, monsterId: monster.id } },
        select: { id: true, ...codexBestStatSelect },
      })
      // t-031: fold this individual's rolled stats into the book's
      // best-ever record. createdStock above always has null stat columns
      // today (t-029/genetics hasn't landed -- see mergeBestStats's own
      // comment), so NULL_STAT_BLOCK is not a shortcut, it's the actual
      // observed value; this still runs the real merge so the record is
      // wired correctly the moment t-029 starts rolling individuals rather
      // than needing a second pass through this call site later.
      const mergedStats = mergeBestStats(
        existingEntry ? toStatBlock(existingEntry) : NULL_STAT_BLOCK,
        NULL_STAT_BLOCK,
      )
      await tx.aquariumCodexEntry.upsert({
        where: { userId_monsterId: { userId, monsterId: monster.id } },
        create: {
          userId,
          monsterId: monster.id,
          ...fromStatBlock(mergedStats),
        },
        update: { ...fromStatBlock(mergedStats) },
      })
      const collectedCountAfter = collectedCountBefore + (existingEntry ? 0 : 1)

      let justCompletedBestiary = false
      if (
        computeJustCompletedBestiary(
          totalCount,
          collectedCountBefore,
          collectedCountAfter,
        )
      ) {
        const alreadyCelebrated = await tx.aquariumEvent.findFirst({
          where: { aquariumId: tank.id, kind: BESTIARY_COMPLETE_EVENT_KIND },
          select: { id: true },
        })
        if (!alreadyCelebrated) {
          justCompletedBestiary = true
          await logEvent(tx, tank.id, BESTIARY_COMPLETE_EVENT_KIND, {
            collectedCount: collectedCountAfter,
            totalCount,
          })
        }
      }

      await logEvent(tx, tank.id, 'purchase', {
        type: 'species',
        monsterId: monster.id,
        aquariumStockId: createdStock.id,
        cost,
      })

      return {
        aquarium: updatedAquarium,
        stock: createdStock,
        justCompletedBestiary,
      }
    },
  )

  return {
    aquarium: toClientAquarium(aquarium),
    stock,
    cost,
    justCompletedBestiary,
  }
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
  ...monsterEconomyOverridesSelect,
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
    cost: unlockCost(deriveFishRarityTier(monster), monster.unlockCost),
  }))

  return { data, take, skip, total }
}

// ---------------------------------------------------------------------------
// Set pieces (cthulhuquarium/t-026) -- "the build layer and its synergies".
// The catalog itself is static (aquariumEconomy.ts's SET_PIECE_CATALOG);
// this section is only the per-tank equip/unequip state around it. Sets
// draw from their own counted setSlotsCap pool, entirely separate from
// sizeCap's weighed fish pool (SYSTEMS.md "Capacity: two pools, two
// units") -- equipping a set never touches sizeCap/effectiveSizeCap
// checks, and unlocking a species never touches setSlotsCap.
// ---------------------------------------------------------------------------

export interface SetCatalogEntry {
  kind: string
  title: string
  description: string
  effect: string
  value: number | null
  cost: number
  equipped: boolean
}

export interface SetCatalogResult {
  catalog: SetCatalogEntry[]
  equipped: OwnedAquarium['Sets']
  setSlotsCap: number
}

export async function listSetsForUser(
  userId: number,
  username: string,
): Promise<SetCatalogResult> {
  const tank = await getOrCreateTankForUser(userId, username)
  const equippedKinds = new Set(tank.Sets.map((set) => set.kind))

  const catalog = Object.values(SET_PIECE_CATALOG).map((config) => ({
    ...config,
    equipped: equippedKinds.has(config.kind),
  }))

  return { catalog, equipped: tank.Sets, setSlotsCap: tank.setSlotsCap }
}

export interface EquipSetResult {
  aquarium: ClientAquarium
  set: OwnedAquarium['Sets'][number]
}

export async function equipSetForUser(
  userId: number,
  username: string,
  kind: string,
): Promise<EquipSetResult> {
  if (!isKnownSetPieceKind(kind)) {
    throw apiError(400, `'${kind}' is not a known set piece.`)
  }

  const tank = await getOrCreateTankForUser(userId, username)
  const equippedKinds = tank.Sets.map((set) => set.kind)
  const config = SET_PIECE_CATALOG[kind]

  if (equippedKinds.includes(kind)) {
    throw apiError(409, `${config.title} is already equipped in your tank.`)
  }
  if (tank.Sets.length >= tank.setSlotsCap) {
    throw apiError(
      409,
      `All ${tank.setSlotsCap} set slots are full -- unequip one first.`,
    )
  }
  if (conflictsWithEquippedIdleSet(kind, equippedKinds)) {
    throw apiError(
      409,
      `${config.title} does the same job as an already-equipped set (they don't stack) -- unequip that one first if you want to switch.`,
    )
  }
  if (tank.coins < config.cost) {
    throw apiError(
      402,
      `Equipping ${config.title} costs ${config.cost} coins; your tank only has ${tank.coins}.`,
    )
  }

  const { aquarium, createdSet } = await prisma.$transaction(async (tx) => {
    const createdSet = await tx.aquariumSet.create({
      data: { aquariumId: tank.id, kind },
      select: ownedSetSelect,
    })

    const updated = await tx.aquarium.update({
      where: { id: tank.id },
      data: { coins: { decrement: config.cost } },
      select: ownedAquariumSelect,
    })

    await logEvent(tx, tank.id, 'equip-set', { kind, cost: config.cost })

    return { aquarium: updated, createdSet }
  })

  return { aquarium: toClientAquarium(aquarium), set: createdSet }
}

export interface UnequipSetResult {
  aquarium: ClientAquarium
}

export async function unequipSetForUser(
  userId: number,
  username: string,
  aquariumSetId: number,
): Promise<UnequipSetResult> {
  const tank = await getOrCreateTankForUser(userId, username)
  const existing = tank.Sets.find((set) => set.id === aquariumSetId)
  if (!existing) {
    throw apiError(
      404,
      `Set piece ${aquariumSetId} is not equipped in your tank.`,
    )
  }

  // No coin refund on unequip -- equipping spent coins to occupy a scarce
  // slot with an active build choice, same "not a refundable purchase"
  // shape as a species unlock (SYSTEMS.md "The shop rotates; the book is
  // forever" section covers selling FISH back; set pieces were never
  // included in that discussion and get no analogous sell-back here).
  const aquarium = await prisma.$transaction(async (tx) => {
    await tx.aquariumSet.delete({ where: { id: aquariumSetId } })

    const updated = await tx.aquarium.findUniqueOrThrow({
      where: { id: tank.id },
      select: ownedAquariumSelect,
    })

    await logEvent(tx, tank.id, 'unequip-set', { kind: existing.kind })

    return updated
  })

  return { aquarium: toClientAquarium(aquarium) }
}
