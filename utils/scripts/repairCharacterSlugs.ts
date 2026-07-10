import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { slugify } from '../slugify'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })

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

type CharacterRow = {
  id: number
  userId: number
  name: string
  slug: string | null
  title: string | null
  role: string | null
  class: string | null
  species: string | null
  backstory: string | null
  drive: string | null
  quirks: string | null
  genre: string | null
  artImageId: number | null
  artPrompt: string | null
  imagePath: string | null
  designer: string | null
  personality: string | null
  presentation: string | null
  createdAt: Date
  updatedAt: Date | null
}

type SlugPlan = {
  id: number
  name: string
  slug: string
}

type MergePlan = {
  duplicateId: number
  canonicalId: number
  name: string
  userId: number
}

function fitSlug(base: string, suffix = ''): string {
  return `${base.slice(0, maxSlugLength - suffix.length)}${suffix}`
}

function reserveUniqueSlug(baseValue: string, taken: Set<string>): string | null {
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

function characterKey(row: Pick<CharacterRow, 'userId' | 'name'>): string | null {
  const nameKey = slugify(row.name)
  return nameKey ? `${row.userId}:${nameKey}` : null
}

function completenessScore(row: CharacterRow): number {
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

function chooseCanonical(rows: CharacterRow[]): CharacterRow {
  return [...rows].sort((a, b) => {
    const scoreDelta = completenessScore(b) - completenessScore(a)
    if (scoreDelta) return scoreDelta
    return a.id - b.id
  })[0]
}

async function loadCharacters(): Promise<CharacterRow[]> {
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

function planSlugBackfill(rows: CharacterRow[]): SlugPlan[] {
  const taken = new Set(
    rows.map((row) => row.slug).filter((slug): slug is string => Boolean(slug)),
  )

  return rows.flatMap((row) => {
    if (row.slug) return []
    const slug = reserveUniqueSlug(row.name, taken)
    return slug ? [{ id: row.id, name: row.name, slug }] : []
  })
}

function planDuplicateMerges(rows: CharacterRow[]): MergePlan[] {
  const groups = new Map<string, CharacterRow[]>()

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

async function applySlugBackfill(tx: any, plans: SlugPlan[]) {
  for (const plan of plans) {
    await tx.character.update({
      where: { id: plan.id },
      data: { slug: plan.slug },
    })
  }
}

async function copyImplicitLinks(tx: any, tableName: string, fromId: number, toId: number) {
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

async function reassignExpressionMedia(tx: any, fromId: number, toId: number) {
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

async function reassignExpressionTransitions(tx: any, fromId: number, toId: number) {
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

async function mergeCharacter(tx: any, plan: MergePlan) {
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
    tx.composition.updateMany({
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

async function applyDuplicateMerges(tx: any, plans: MergePlan[]) {
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
