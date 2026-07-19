import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client.js'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig.ts'
import { slugify } from '../slugify.ts'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

// SSL-aware adapter (see server/utils/prisma.ts) — ProxySQL enforces TLS.
const prisma = new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })

const WRITE = process.argv.includes('--write')
const DEDUPE =
  process.argv.includes('--dedupe') || process.argv.includes('--delete-duplicates')
const maxSlugLength = 255
const transactionMaxWaitMs = 10000
const transactionTimeoutMs = 60000

const implicitCharacterTables = [
  '_CharacterToDream',
  '_CharacterToReward',
  '_CharacterToScenario',
]

function fitSlug(base, suffix = '') {
  return `${base.slice(0, maxSlugLength - suffix.length)}${suffix}`
}

function reserveUniqueSlug(baseValue, taken) {
  const base = slugify(baseValue)
  if (!base) return null

  let slug = fitSlug(base)
  let suffix = 2

  while (taken.has(slug)) {
    const nextSuffix = `-${suffix}`
    slug = fitSlug(base, nextSuffix)
    suffix += 1
  }

  taken.add(slug)
  return slug
}

function characterKey(row) {
  const nameKey = slugify(row.name)
  return nameKey ? `${row.userId}:${nameKey}` : null
}

function completenessScore(row) {
  const fields = [
    row.slug,
    row.title,
    row.role,
    row.class,
    row.species,
    row.backstory,
    row.drive,
    row.quirks,
    row.genre,
    row.artPrompt,
    row.imagePath,
    row.designer,
    row.personality,
    row.presentation,
  ]

  const filledFields = fields.filter((value) =>
    typeof value === 'string' ? Boolean(value.trim()) : Boolean(value),
  ).length

  return filledFields + (row.artImageId ? 2 : 0)
}

function chooseCanonical(rows) {
  const canonical = [...rows].sort((a, b) => {
    const scoreDelta = completenessScore(b) - completenessScore(a)
    if (scoreDelta) return scoreDelta
    return a.id - b.id
  })[0]

  if (!canonical) {
    throw new Error('Cannot choose a canonical character from an empty group.')
  }

  return canonical
}

async function loadCharacters() {
  return prisma.character.findMany({
    select: {
      id: true,
      userId: true,
      name: true,
      slug: true,
      title: true,
      role: true,
      class: true,
      species: true,
      backstory: true,
      drive: true,
      quirks: true,
      genre: true,
      artImageId: true,
      artPrompt: true,
      imagePath: true,
      designer: true,
      personality: true,
      presentation: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { id: 'asc' },
  })
}

function planSlugBackfill(rows) {
  const taken = new Set(rows.map((row) => row.slug).filter(Boolean))

  return rows.flatMap((row) => {
    if (row.slug) return []
    const slug = reserveUniqueSlug(row.name, taken)
    return slug ? [{ id: row.id, name: row.name, slug }] : []
  })
}

function planDuplicateMerges(rows) {
  const groups = new Map()

  for (const row of rows) {
    const key = characterKey(row)
    if (!key) continue
    groups.set(key, [...(groups.get(key) ?? []), row])
  }

  return [...groups.values()].flatMap((group) => {
    if (group.length < 2) return []

    const canonical = chooseCanonical(group)

    return group
      .filter((row) => row.id !== canonical.id)
      .map((row) => ({
        duplicateId: row.id,
        canonicalId: canonical.id,
        name: row.name,
        userId: row.userId,
      }))
  })
}

async function applySlugBackfill(tx, plans) {
  for (const plan of plans) {
    await tx.character.update({
      where: { id: plan.id },
      data: { slug: plan.slug },
    })
  }
}

async function copyImplicitLinks(tx, tableName, fromId, toId) {
  await tx.$executeRawUnsafe(
    `INSERT IGNORE INTO \`${tableName}\` (\`A\`, \`B\`) SELECT ?, \`B\` FROM \`${tableName}\` WHERE \`A\` = ?`,
    toId,
    fromId,
  )
  await tx.$executeRawUnsafe(
    `DELETE FROM \`${tableName}\` WHERE \`A\` = ?`,
    fromId,
  )
}

async function reassignExpressionMedia(tx, fromId, toId) {
  const rows = await tx.expressionMedia.findMany({
    where: { characterId: fromId },
    select: { id: true, expressionKey: true },
    orderBy: { id: 'asc' },
  })

  for (const row of rows) {
    const existing = await tx.expressionMedia.findFirst({
      where: { characterId: toId, expressionKey: row.expressionKey },
      select: { id: true },
    })

    if (existing) {
      await tx.expressionMedia.delete({ where: { id: row.id } })
    } else {
      await tx.expressionMedia.update({
        where: { id: row.id },
        data: { characterId: toId },
      })
    }
  }
}

async function reassignExpressionTransitions(tx, fromId, toId) {
  const rows = await tx.expressionTransition.findMany({
    where: { characterId: fromId },
    select: { id: true, fromKey: true, toKey: true },
    orderBy: { id: 'asc' },
  })

  for (const row of rows) {
    const existing = await tx.expressionTransition.findFirst({
      where: { characterId: toId, fromKey: row.fromKey, toKey: row.toKey },
      select: { id: true },
    })

    if (existing) {
      await tx.expressionTransition.delete({ where: { id: row.id } })
    } else {
      await tx.expressionTransition.update({
        where: { id: row.id },
        data: { characterId: toId },
      })
    }
  }
}

async function mergeCharacter(tx, plan) {
  for (const tableName of implicitCharacterTables) {
    await copyImplicitLinks(tx, tableName, plan.duplicateId, plan.canonicalId)
  }

  await Promise.all([
    tx.chat.updateMany({
      where: { characterId: plan.duplicateId },
      data: { characterId: plan.canonicalId },
    }),
    tx.reaction.updateMany({
      where: { characterId: plan.duplicateId },
      data: { characterId: plan.canonicalId },
    }),
    tx.challengeSubmission.updateMany({
      where: { characterId: plan.duplicateId },
      data: { characterId: plan.canonicalId },
    }),
    tx.lifeRun.updateMany({
      where: { characterId: plan.duplicateId },
      data: { characterId: plan.canonicalId },
    }),
  ])

  await reassignExpressionMedia(tx, plan.duplicateId, plan.canonicalId)
  await reassignExpressionTransitions(tx, plan.duplicateId, plan.canonicalId)
  await tx.character.delete({ where: { id: plan.duplicateId } })
}

async function applyDuplicateMerges(tx, plans) {
  for (const plan of plans) {
    await mergeCharacter(tx, plan)
  }
}

async function main() {
  const rows = await loadCharacters()
  const slugPlans = planSlugBackfill(rows)
  const mergePlans = planDuplicateMerges(rows)

  if (!slugPlans.length && !mergePlans.length) {
    console.log('Character table already has slugs and no same-user name duplicates.')
    return
  }

  for (const plan of slugPlans) {
    console.log(`Slug #${plan.id}: "${plan.name}" → ${plan.slug}`)
  }

  for (const plan of mergePlans) {
    console.log(
      `Duplicate #${plan.duplicateId}: "${plan.name}" user #${plan.userId} → keep #${plan.canonicalId}`,
    )
  }

  if (!WRITE) {
    console.log(
      `\nDry run: ${slugPlans.length} slug(s), ${mergePlans.length} duplicate delete(s) planned. Re-run with --write --dedupe to apply both.`,
    )
    return
  }

  await prisma.$transaction(
    async (tx) => {
      await applySlugBackfill(tx, slugPlans)
      if (DEDUPE) await applyDuplicateMerges(tx, mergePlans)
    },
    {
      maxWait: transactionMaxWaitMs,
      timeout: transactionTimeoutMs,
    },
  )

  console.log(
    `\nApplied ${slugPlans.length} slug(s)${
      DEDUPE ? ` and deleted ${mergePlans.length} duplicate(s)` : ''
    }.`,
  )

  if (!DEDUPE && mergePlans.length) {
    console.log('Duplicate deletes were skipped. Re-run with --dedupe to merge and delete them.')
  }
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
