// /utils/scripts/convertImagesToWebp.mjs

import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const inputDir = process.argv[2] || 'public/images'
const outputDir = process.argv[3] || 'public/images-optimized'

const allowedExtensions = new Set(['.png'])

const maxWidth = 1600
const webpQuality = 82

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true })
}

async function getFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })

  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        return getFiles(fullPath)
      }

      return fullPath
    }),
  )

  return files.flat()
}

async function convertFile(filePath) {
  const ext = path.extname(filePath).toLowerCase()

  if (!allowedExtensions.has(ext)) {
    return null
  }

  const relativePath = path.relative(inputDir, filePath)
  const parsed = path.parse(relativePath)
  const targetDir = path.join(outputDir, parsed.dir)
  const outputPath = path.join(targetDir, `${parsed.name}.webp`)

  await ensureDir(targetDir)

  const image = sharp(filePath)
  const metadata = await image.metadata()

  const shouldResize = metadata.width && metadata.width > maxWidth

  let pipeline = image.rotate().withMetadata(false)

  if (shouldResize) {
    pipeline = pipeline.resize({
      width: maxWidth,
      withoutEnlargement: true,
    })
  }

  await pipeline.webp({ quality: webpQuality }).toFile(outputPath)

  const originalStats = await fs.stat(filePath)
  const optimizedStats = await fs.stat(outputPath)

  return {
    input: filePath,
    output: outputPath,
    originalKB: Math.round(originalStats.size / 1024),
    optimizedKB: Math.round(optimizedStats.size / 1024),
    savedKB: Math.round((originalStats.size - optimizedStats.size) / 1024),
  }
}

async function main() {
  await ensureDir(outputDir)

  const files = await getFiles(inputDir)
  const results = []

  for (const file of files) {
    try {
      const result = await convertFile(file)

      if (result) {
        results.push(result)
        console.log(
          `✅ ${result.input} → ${result.output} | ${result.originalKB}KB → ${result.optimizedKB}KB`,
        )
      }
    } catch (error) {
      console.error(`❌ Failed: ${file}`)
      console.error(error)
    }
  }

  const totalOriginal = results.reduce((sum, item) => sum + item.originalKB, 0)
  const totalOptimized = results.reduce(
    (sum, item) => sum + item.optimizedKB,
    0,
  )
  const totalSaved = totalOriginal - totalOptimized

  console.log('\nDone.')
  console.log(`Converted: ${results.length}`)
  console.log(`Original total: ${totalOriginal}KB`)
  console.log(`Optimized total: ${totalOptimized}KB`)
  console.log(`Saved: ${totalSaved}KB`)
}

main()
