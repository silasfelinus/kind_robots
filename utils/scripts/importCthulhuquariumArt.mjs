import fs from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const sourceDir = path.resolve(
  process.argv[2] || '../conductor/projects/cthulhuquarium/art',
)
const targetDir = path.resolve(
  process.argv[3] || 'assets/images/cthulhuquarium/generated',
)

const alreadyBundled = new Set([
  'cthulhuquarium-screen-finale.webp',
  'cthulhuquarium-set-last-aquarium.webp',
])

function targetWidth(filename) {
  if (filename.startsWith('cthulhuquarium-bg-')) return 1280
  if (filename.startsWith('cthulhuquarium-screen-')) return 960
  if (filename.startsWith('cthulhuquarium-char-')) return 640
  if (filename.includes('ichthyonomicon')) return 640
  return 512
}

async function main() {
  const entries = await fs.readdir(sourceDir, { withFileTypes: true })
  const files = entries
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.webp') &&
        !alreadyBundled.has(entry.name),
    )
    .map((entry) => entry.name)
    .sort()

  if (files.length !== 136) {
    throw new Error(
      `Expected 136 unbundled Cthulhuquarium plates, found ${files.length} in ${sourceDir}`,
    )
  }

  await fs.mkdir(targetDir, { recursive: true })

  let originalBytes = 0
  let outputBytes = 0

  for (const filename of files) {
    const source = path.join(sourceDir, filename)
    const target = path.join(targetDir, filename)
    const width = targetWidth(filename)
    const sourceStats = await fs.stat(source)

    await sharp(source)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(target)

    const targetStats = await fs.stat(target)
    originalBytes += sourceStats.size
    outputBytes += targetStats.size

    console.log(
      `${filename}: ${Math.round(sourceStats.size / 1024)}KB -> ${Math.round(targetStats.size / 1024)}KB (${width}px max)`,
    )
  }

  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'conductor/projects/cthulhuquarium/art',
    count: files.length,
    originalBytes,
    outputBytes,
    files,
  }

  await fs.writeFile(
    path.join(targetDir, 'manifest.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
  )

  console.log(
    `Imported ${files.length} plates: ${Math.round(originalBytes / 1024 / 1024)}MB -> ${Math.round(outputBytes / 1024 / 1024)}MB`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
