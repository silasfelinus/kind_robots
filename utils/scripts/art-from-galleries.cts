// DEPRECATED: Gallery model is legacy-only.
// This script converts gallery imagePaths into Art + ArtCollection entries.

// utils/scripts/art-from-galleries.cts
// @ts-nocheck

console.log('🟢 SCRIPT STARTED')

const { PrismaClient } = require('@prisma/client')
const readline = require('readline')

console.log('🟢 Script booted. Starting Prisma init...')

const prisma = new PrismaClient()
const yesToAll = process.argv.includes('--yes')

/**
 * @param {string} query
 * @returns {Promise<boolean>}
 */
function askQuestion(query) {
  if (yesToAll) return Promise.resolve(true)
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })
  return new Promise((resolve) => {
    rl.question(`${query} (y/n): `, (answer /** @type {string} */) => {
      rl.close()
      resolve(answer.trim().toLowerCase() === 'y')
    })
  })
}

async function run() {
  try {
    const galleries = await prisma.gallery.findMany()
    console.log(`📦 Found ${galleries.length} galleries.`)

    for (const gallery of galleries) {
      const label = gallery.name
      const imagePaths =
        gallery.imagePaths
          ?.split(',')
          .map((s) => s.trim())
          .filter(Boolean) ?? []

      console.log(
        `🔍 Checking gallery: "${label}" with ${imagePaths.length} image(s).`,
      )

      if (!label || imagePaths.length === 0) {
        console.warn(
          `⚠️ Skipping gallery "${label}" — missing name or image paths.`,
        )
        continue
      }

      let collectionId = null

      try {
        const existingCollection = await prisma.artCollection.findFirst({
          where: { label },
        })

        if (existingCollection) {
          console.log(
            `✅ ArtCollection already exists for "${label}" (id: ${existingCollection.id})`,
          )
          collectionId = existingCollection.id
        } else {
          const shouldCreate = await askQuestion(
            `🆕 Create new ArtCollection for "${label}"?`,
          )
          if (!shouldCreate) {
            console.log(`🚫 Skipping collection "${label}"`)
            continue
          }

          const newCollection = await prisma.artCollection.create({
            data: {
              label,
              description:
                gallery.description ?? `Auto-created for gallery ${label}`,
              userId: gallery.userId ?? 10,
              isPublic: gallery.isPublic,
              isMature: gallery.isMature,
            },
          })

          console.log(
            `🎉 Created ArtCollection "${label}" (id: ${newCollection.id})`,
          )
          collectionId = newCollection.id
        }
      } catch (collectionErr) {
        console.error(
          `❌ Failed to check/create ArtCollection for "${label}":`,
          collectionErr,
        )
        continue
      }

      for (let i = 0; i < imagePaths.length; i++) {
        const filename = imagePaths[i]
        const fullPath = `/images/${gallery.name}/${filename}`

        try {
          const art = await prisma.art.create({
            data: {
              checkpoint: 'acrocat ranch',
              designer: 'acrocats',
              promptString: gallery.name,
              path: fullPath,
              imagePath: filename,
              isPublic: gallery.isPublic,
              isMature: gallery.isMature,
              userId: gallery.userId ?? 10,
              galleryId: gallery.id,
              steps: 20,
              promptId: null,
              pitchId: null,
              ArtCollection: collectionId
                ? {
                    connect: {
                      id: collectionId,
                    },
                  }
                : undefined,
            },
          })

          console.log(
            `   ✅ Created Art #${art.id} for "${label}" → ${filename}`,
          )
        } catch (artErr) {
          console.error(
            `   ❌ Failed to create Art for "${label}" → ${filename}:`,
            artErr,
          )
        }
      }
    }

    console.log(`✅ All galleries processed.`)
  } catch (outerErr) {
    console.error(
      '💥 Fatal script error:',
      outerErr instanceof Error ? outerErr.stack : outerErr,
    )
  } finally {
    await prisma.$disconnect()
    console.log('🔌 Prisma disconnected.')
  }
}

run().catch((err) => {
  console.error(
    '💥 Uncaught script error:',
    err instanceof Error ? err.stack : err,
  )
  prisma.$disconnect()
  process.exit(1)
})
