import 'dotenv/config'
import { cp, mkdir, readdir } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '../prisma/generated/prisma/client'
import { createDatabaseAdapter } from '../server/utils/databaseAdapterConfig'

const SOURCE_DIR = fileURLToPath(new URL('../assets/images/cthulhuquarium/', import.meta.url))
const PUBLIC_DIR = fileURLToPath(new URL('../public/images/cthulhuquarium/', import.meta.url))
const FISH_PREFIX = 'cthulhuquarium-fish-'
const PUBLIC_PREFIX = '/images/cthulhuquarium/'

export type FishPlate = {
  slug: string
  fileName: string
  imagePath: string
  sourcePath: string
  publicPath: string
}

export function plateFromFileName(fileName: string): FishPlate | null {
  if (!fileName.startsWith(FISH_PREFIX) || !fileName.endsWith('.webp')) return null
  const slug = fileName.slice(FISH_PREFIX.length, -'.webp'.length)
  if (!slug) return null
  return {
    slug,
    fileName,
    imagePath: `${PUBLIC_PREFIX}${fileName}`,
    sourcePath: join(SOURCE_DIR, fileName),
    publicPath: join(PUBLIC_DIR, fileName),
  }
}

export async function discoverFishPlates(): Promise<FishPlate[]> {
  const files = await readdir(SOURCE_DIR)
  return files
    .map(plateFromFileName)
    .filter((plate): plate is FishPlate => plate !== null)
    .sort((a, b) => a.slug.localeCompare(b.slug))
}

async function preparePublicFiles(plates: FishPlate[]) {
  await mkdir(PUBLIC_DIR, { recursive: true })
  await Promise.all(plates.map((plate) => cp(plate.sourcePath, plate.publicPath)))
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is missing')
  return new PrismaClient({ adapter: createDatabaseAdapter(databaseUrl) })
}

async function linkDatabaseRows(plates: FishPlate[]) {
  const prisma = createPrismaClient()
  try {
    const monsters = await prisma.monster.findMany({
      where: { slug: { in: plates.map((plate) => plate.slug) } },
      select: { id: true, slug: true },
    })
    const monsterBySlug = new Map(monsters.map((monster) => [monster.slug, monster]))
    const missing = plates.filter((plate) => !monsterBySlug.has(plate.slug))
    if (missing.length) {
      throw new Error(`Missing Monster rows for: ${missing.map((plate) => plate.slug).join(', ')}`)
    }

    let created = 0
    let updated = 0
    for (const plate of plates) {
      const monster = monsterBySlug.get(plate.slug)!
      const existing = await prisma.artImage.findFirst({
        where: { fileName: plate.fileName },
        select: { id: true },
      })
      const data = {
        userId: 10,
        fileName: plate.fileName,
        imagePath: plate.imagePath,
        path: plate.imagePath,
        isPublic: true,
        isMature: false,
        isActive: true,
        promptString: `Cthulhuquarium species plate: ${plate.slug}`,
      }
      const artImage = existing
        ? await prisma.artImage.update({ where: { id: existing.id }, data })
        : await prisma.artImage.create({ data })
      existing ? updated++ : created++

      await prisma.monster.update({
        where: { id: monster.id },
        data: {
          artImageId: artImage.id,
          iconPath: plate.imagePath,
          cardPath: plate.imagePath,
        },
      })
    }

    console.log(`Linked ${plates.length} Monster rows (${created} ArtImage rows created, ${updated} updated).`)
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  const write = process.argv.includes('--write')
  const preparePublic = process.argv.includes('--prepare-public') || write
  const plates = await discoverFishPlates()

  console.log(`Found ${plates.length} bundled Cthulhuquarium fish plates.`)
  console.log(`Stable URL root: ${PUBLIC_PREFIX}`)

  if (preparePublic) {
    await preparePublicFiles(plates)
    console.log(`Copied ${plates.length} plates into ${basename(PUBLIC_DIR)}/images/cthulhuquarium for stable public URLs.`)
  }

  if (!write) {
    console.log('[dry run] No database rows changed. Re-run with --write against the intended DATABASE_URL to link ArtImage and Monster rows.')
    return
  }

  await linkDatabaseRows(plates)
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
