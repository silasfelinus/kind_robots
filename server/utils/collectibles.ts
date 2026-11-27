// /server/utils/collectibles.ts
//
// Server side of the shared collectible system. All currency math, rolls and
// unlocks happen here with crypto randomness; the browser only ever asks.
// Wallet writes are compare-and-swap on `revision`, so two tabs opening packs
// at once can never double-spend. There is no purchase route by design.
import { randomInt } from 'node:crypto'
import { createError, getRouterParam, type H3Event } from 'h3'
import prisma from '~/server/utils/prisma'
import { collectibleSetBySlug } from '~/utils/collectibles/registry'
import {
  collectibleDay,
  dailyClaimFor,
  earnedBacks,
  openPack,
  parseBonusState,
  previousDay,
  type PackCard,
} from '~/utils/collectibles/engine'
import type { CollectibleSet } from '~/utils/collectibles/types'

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export const secureRand = () => randomInt(0, 2 ** 32) / 2 ** 32

export function setFromEvent(event: H3Event): CollectibleSet {
  const set = collectibleSetBySlug(getRouterParam(event, 'set') ?? '')
  if (!set)
    throw createError({ statusCode: 404, message: 'Unknown collection.' })
  return set
}

export function collectibleArtUrl(setSlug: string, itemKey: string) {
  return `/api/collectibles/${setSlug}/art/${itemKey}`
}

async function ensureWallet(tx: Tx, userId: number, set: CollectibleSet) {
  const existing = await tx.collectibleWallet.findUnique({
    where: { userId_setSlug: { userId, setSlug: set.slug } },
  })
  if (existing) return existing
  await tx.collectibleWallet.createMany({
    data: [{ userId, setSlug: set.slug, bonusState: '{}' }],
    skipDuplicates: true,
  })
  return tx.collectibleWallet.findUniqueOrThrow({
    where: { userId_setSlug: { userId, setSlug: set.slug } },
  })
}

async function ownedKeys(tx: Tx, userId: number, set: CollectibleSet) {
  const rows = await tx.collectibleOwnership.findMany({
    where: { userId, setSlug: set.slug },
    select: { itemKey: true, count: true },
  })
  return rows
}

function conflict() {
  return createError({
    statusCode: 409,
    message: 'Your collection changed in another tab. Try again.',
  })
}

export async function playerState(userId: number, set: CollectibleSet) {
  const today = collectibleDay(new Date(), set.timeZone)
  const [wallet, owned, history] = await Promise.all([
    prisma.$transaction((tx) => ensureWallet(tx, userId, set)),
    prisma.collectibleOwnership.findMany({
      where: { userId, setSlug: set.slug },
      select: { itemKey: true, count: true, firstAt: true },
    }),
    prisma.collectiblePull.findMany({
      where: { userId, setSlug: set.slug },
      orderBy: { id: 'desc' },
      take: 60,
      select: {
        id: true,
        itemKey: true,
        rarity: true,
        source: true,
        duplicate: true,
        refund: true,
        createdAt: true,
      },
    }),
  ])
  const ownedSet = new Set(owned.map((row) => row.itemKey))
  const bonus = parseBonusState(wallet.bonusState)
  const backs = earnedBacks(set, {
    bestStreak: wallet.bestStreak,
    owned: ownedSet,
  })
  const claim = dailyClaimFor(set, wallet, today)
  return {
    today,
    balance: wallet.balance,
    packTickets: wallet.packTickets,
    streak:
      wallet.lastClaimDay === today ||
      wallet.lastClaimDay === previousDay(today)
        ? wallet.streak
        : 0,
    bestStreak: wallet.bestStreak,
    totalPulls: wallet.totalPulls,
    pullsSinceTop: wallet.pullsSinceTop,
    claimedToday: wallet.lastClaimDay === today,
    nextClaim: claim.allowed
      ? { reward: claim.reward, tickets: claim.tickets, streak: claim.streak }
      : null,
    tasksDone: bonus.day === today ? bonus.tasks : [],
    owned: Object.fromEntries(owned.map((row) => [row.itemKey, row.count])),
    backs,
    selectedBack:
      wallet.selectedBack && backs.includes(wallet.selectedBack)
        ? wallet.selectedBack
        : (backs[0] ?? null),
    history,
  }
}

async function recordNewBacks(
  tx: Tx,
  userId: number,
  set: CollectibleSet,
  before: string[],
  after: string[],
) {
  const fresh = after.filter((key) => !before.includes(key))
  if (fresh.length) {
    await tx.collectiblePull.createMany({
      data: fresh.map((itemKey) => ({
        userId,
        setSlug: set.slug,
        itemKey,
        rarity: 'back',
        source: 'unlock',
      })),
    })
  }
  return fresh
}

export async function claimDaily(userId: number, set: CollectibleSet) {
  const today = collectibleDay(new Date(), set.timeZone)
  return prisma.$transaction(async (tx) => {
    const wallet = await ensureWallet(tx, userId, set)
    const claim = dailyClaimFor(set, wallet, today)
    if (!claim.allowed) {
      throw createError({
        statusCode: 409,
        message: 'Today’s reward is already claimed. Come back tomorrow.',
      })
    }
    const owned = new Set(
      (await ownedKeys(tx, userId, set)).map((r) => r.itemKey),
    )
    const backsBefore = earnedBacks(set, {
      bestStreak: wallet.bestStreak,
      owned,
    })
    const bestStreak = Math.max(wallet.bestStreak, claim.streak)
    const updated = await tx.collectibleWallet.updateMany({
      where: { userId, setSlug: set.slug, revision: wallet.revision },
      data: {
        balance: wallet.balance + claim.reward,
        packTickets: wallet.packTickets + claim.tickets,
        streak: claim.streak,
        bestStreak,
        lastClaimDay: today,
        revision: wallet.revision + 1,
      },
    })
    if (updated.count !== 1) throw conflict()
    const backsAfter = earnedBacks(set, { bestStreak, owned })
    const newBacks = await recordNewBacks(
      tx,
      userId,
      set,
      backsBefore,
      backsAfter,
    )
    return { ...claim, newBacks }
  })
}

export async function completeTask(
  userId: number,
  set: CollectibleSet,
  taskKey: string,
) {
  const task = set.economy.tasks.find((entry) => entry.key === taskKey)
  if (!task) throw createError({ statusCode: 400, message: 'Unknown task.' })
  const today = collectibleDay(new Date(), set.timeZone)
  return prisma.$transaction(async (tx) => {
    const wallet = await ensureWallet(tx, userId, set)
    const bonus = parseBonusState(wallet.bonusState)
    const tasks = bonus.day === today ? bonus.tasks : []
    if (tasks.includes(task.key)) return { reward: 0, already: true }
    const updated = await tx.collectibleWallet.updateMany({
      where: { userId, setSlug: set.slug, revision: wallet.revision },
      data: {
        balance: wallet.balance + task.reward,
        bonusState: JSON.stringify({ day: today, tasks: [...tasks, task.key] }),
        revision: wallet.revision + 1,
      },
    })
    if (updated.count !== 1) throw conflict()
    return { reward: task.reward, already: false }
  })
}

export type OpenedCard = PackCard & { duplicate: boolean; refund: number }

export async function openCollectiblePack(userId: number, set: CollectibleSet) {
  const economy = set.economy
  return prisma.$transaction(async (tx) => {
    const wallet = await ensureWallet(tx, userId, set)
    const useTicket = wallet.packTickets > 0
    if (!useTicket && wallet.balance < economy.packCost) {
      throw createError({
        statusCode: 409,
        message: `A pack costs ${economy.packCost} ${economy.currencyName}. Claim your daily reward or finish today's tasks to earn more.`,
      })
    }
    const ownedRows = await ownedKeys(tx, userId, set)
    const owned = new Set(ownedRows.map((row) => row.itemKey))
    const backsBefore = earnedBacks(set, {
      bestStreak: wallet.bestStreak,
      owned,
    })
    const pack = openPack(
      set,
      { pullsSinceTop: wallet.pullsSinceTop, owned },
      secureRand,
    )

    const seen = new Set(owned)
    const cards: OpenedCard[] = pack.cards.map((card) => {
      const duplicate = seen.has(card.key)
      seen.add(card.key)
      return {
        ...card,
        duplicate,
        refund: duplicate ? economy.duplicateRefund[card.rarity] : 0,
      }
    })
    const refunds = cards.reduce((sum, card) => sum + card.refund, 0)

    const updated = await tx.collectibleWallet.updateMany({
      where: { userId, setSlug: set.slug, revision: wallet.revision },
      data: {
        balance: wallet.balance - (useTicket ? 0 : economy.packCost) + refunds,
        packTickets: wallet.packTickets - (useTicket ? 1 : 0),
        totalPulls: wallet.totalPulls + cards.length,
        pullsSinceTop: pack.pullsSinceTop,
        revision: wallet.revision + 1,
      },
    })
    if (updated.count !== 1) throw conflict()

    const counts = new Map<string, number>()
    for (const card of cards)
      counts.set(card.key, (counts.get(card.key) ?? 0) + 1)
    for (const [itemKey, count] of counts) {
      await tx.collectibleOwnership.upsert({
        where: {
          userId_setSlug_itemKey: { userId, setSlug: set.slug, itemKey },
        },
        create: { userId, setSlug: set.slug, itemKey, count },
        update: { count: { increment: count } },
      })
    }
    await tx.collectiblePull.createMany({
      data: cards.map((card) => ({
        userId,
        setSlug: set.slug,
        itemKey: card.key,
        rarity: card.rarity,
        source: useTicket ? 'ticket' : 'pack',
        duplicate: card.duplicate,
        refund: card.refund,
      })),
    })
    const backsAfter = earnedBacks(set, {
      bestStreak: wallet.bestStreak,
      owned: seen,
    })
    const newBacks = await recordNewBacks(
      tx,
      userId,
      set,
      backsBefore,
      backsAfter,
    )
    return { cards, usedTicket: useTicket, refunds, newBacks }
  })
}

export async function selectBack(
  userId: number,
  set: CollectibleSet,
  backKey: string,
) {
  const state = await playerState(userId, set)
  if (!state.backs.includes(backKey)) {
    throw createError({
      statusCode: 409,
      message: 'That back is still locked.',
    })
  }
  await prisma.collectibleWallet.update({
    where: { userId_setSlug: { userId, setSlug: set.slug } },
    data: { selectedBack: backKey },
  })
  return backKey
}

function readRequestKey(payload: string): string {
  try {
    return String(JSON.parse(payload)?.requestKey ?? '')
  } catch {
    return ''
  }
}

/**
 * Link rendered Conductor ledger cells to catalog items. Ledger jobs carry
 * the set's projectSlug and a request key
 * `conductor:ledger:<ledgerPath>#<itemKey>@<lane>=<hash>`.
 */
export async function syncCollectibleArt(set: CollectibleSet) {
  const keys = new Set([
    ...set.cards.map((card) => card.key),
    ...set.backs.map((back) => back.key),
  ])
  const marker = `conductor:ledger:${set.ledgerPath}#`
  const jobs = await prisma.artJob.findMany({
    where: {
      projectSlug: set.projectSlug,
      status: 'DONE',
      artImageId: { not: null },
      payload: { contains: marker },
    },
    select: { id: true, artImageId: true, payload: true },
    orderBy: { id: 'asc' },
  })
  let linked = 0
  for (const job of jobs) {
    const requestKey = readRequestKey(job.payload)
    if (!requestKey.startsWith(marker)) continue
    const itemKey = requestKey.slice(marker.length).split('@')[0] ?? ''
    if (!keys.has(itemKey) || !job.artImageId) continue
    await prisma.collectibleArt.upsert({
      where: { setSlug_itemKey: { setSlug: set.slug, itemKey } },
      create: {
        setSlug: set.slug,
        itemKey,
        artImageId: job.artImageId,
        artJobId: job.id,
      },
      update: { artImageId: job.artImageId, artJobId: job.id },
    })
    linked++
  }
  return { jobs: jobs.length, linked }
}
