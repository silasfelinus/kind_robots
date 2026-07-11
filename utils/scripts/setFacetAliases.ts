// /utils/scripts/setFacetAliases.ts
import 'dotenv/config'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import {
  normalizeFacetLookupKey,
  prepareUniqueFacetAliases,
} from './../facetAliases'

const databaseUrl = process.env.DATABASE_URL
if (!databaseUrl) throw new Error('DATABASE_URL is missing')

const prisma = new PrismaClient({ adapter: new PrismaMariaDb(databaseUrl) })

async function main(): Promise<void> {
  const [facetReference, ...requestedAliases] = process.argv.slice(2)

  if (!facetReference || requestedAliases.length === 0) {
    throw new Error(
      'Usage: npm run facet:alias -- <facet-slug-or-alias> <alias> [additional aliases...]',
    )
  }

  const referenceKey = normalizeFacetLookupKey(facetReference)
  const referenceAlias = referenceKey
    ? await prisma.facetAlias.findUnique({ where: { lookupKey: referenceKey } })
    : null

  const facet = referenceAlias
    ? await prisma.facet.findUnique({ where: { id: referenceAlias.facetId } })
    : await prisma.facet.findFirst({
        where: {
          OR: [{ slug: facetReference }, { slug: facetReference.toLowerCase() }],
        },
      })

  if (!facet) {
    throw new Error(`Facet not found: ${facetReference}`)
  }

  if (!facet.slug) {
    throw new Error(`Facet ${facet.id} has no canonical slug.`)
  }

  const canonicalKey = normalizeFacetLookupKey(facet.slug)
  const aliases = prepareUniqueFacetAliases([facet.slug, ...requestedAliases])

  await prisma.$transaction(async (tx) => {
    for (const entry of aliases) {
      const existing = await tx.facetAlias.findUnique({
        where: { lookupKey: entry.lookupKey },
      })

      if (existing && existing.facetId !== facet.id) {
        throw new Error(
          `Alias "${entry.alias}" already belongs to Facet ${existing.facetId}; aliases must be globally unambiguous.`,
        )
      }

      await tx.facetAlias.upsert({
        where: { lookupKey: entry.lookupKey },
        create: {
          facetId: facet.id,
          alias: entry.alias,
          lookupKey: entry.lookupKey,
          isCanonical: entry.lookupKey === canonicalKey,
          isActive: true,
        },
        update: {
          alias: entry.lookupKey === canonicalKey ? facet.slug : entry.alias,
          isCanonical: entry.lookupKey === canonicalKey,
          isActive: true,
        },
      })
    }
  })

  const saved = await prisma.facetAlias.findMany({
    where: { facetId: facet.id, isActive: true },
    orderBy: [{ isCanonical: 'desc' }, { alias: 'asc' }],
    select: {
      alias: true,
      lookupKey: true,
      isCanonical: true,
    },
  })

  process.stdout.write(
    `${JSON.stringify(
      {
        facet: { id: facet.id, title: facet.title, slug: facet.slug },
        aliases: saved,
      },
      null,
      2,
    )}\n`,
  )
}

main()
  .catch((error: unknown) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
