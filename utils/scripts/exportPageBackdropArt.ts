// /utils/scripts/exportPageBackdropArt.ts
//
// Move finished backdrop art out of the database and onto the media share,
// where the frontmatter actually points.
//
// THE GAP THIS CLOSES. enqueuePageBackdropArt puts `imagePath:
// background/<page>-<variant>.webp` in each job payload, and the content
// frontmatter declares the same path — but nothing in the completion path acts
// on it. complete.post.ts stores finished art as an ArtImage row (imageData,
// imagePath null); per docs/self-hosted-media.md, "ephemeral serverless runtimes cannot write to the
// Unraid share. Production upload behavior remains database-backed." So all 60
// images would generate successfully and no page would show one.
//
// Usage (on the Windows/WSL host, where IMAGES_PATH reaches the share):
//   npm run export:page-backdrops              # dry run
//   npm run export:page-backdrops -- --write   # write files + set imagePath
//
// WHY IT ALSO SETS imagePath. Once the file is on the share, file.get.ts
// redirects to it instead of reading base64 (see its early `sendRedirect`), so
// the row stops costing a LongText read per view. That also makes the row
// eligible for pruneRedundantArtImageData.ts, which only prunes rows whose path
// it can verify actually serves an image. Export → link → prune, in that order;
// each step is safe on its own and none of them destroys the only copy.
//
// TRANSCODES TO WEBP, deliberately. The generator emits PNG, the declared path
// ends in .webp, and nginx serves content-type by file extension — a PNG
// written to a .webp name would be served as image/webp and is a bug waiting
// for a strict decoder. Converting makes name and bytes agree, and the file is
// far smaller (measured 8.3x on card art at q82 in file.get.ts).
import 'dotenv/config'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join, resolve } from 'node:path'
import sharp from 'sharp'
import prisma from './../../server/utils/prisma'

const WRITE = process.argv.includes('--write')
const PROJECT_SLUG = 'page-backdrops'
const WEBP_QUALITY = 82

// Same fallback the app uses when the share is not mounted, so a dry run on a
// machine without the share still reports something meaningful.
const IMAGES_ROOT = process.env.IMAGES_PATH || resolve(process.cwd(), 'public/images')

type JobRow = {
  id: number
  status: string
  artImageId: number | null
  payload: string
}

function payloadOf(raw: string): Record<string, unknown> {
  try {
    return JSON.parse(raw) as Record<string, unknown>
  } catch {
    return {}
  }
}

async function main() {
  const jobs = await prisma.artJob.findMany({
    where: { projectSlug: PROJECT_SLUG },
    select: { id: true, status: true, artImageId: true, payload: true },
    orderBy: { id: 'asc' },
  })

  if (!jobs.length) {
    console.log(
      `No ArtJob rows with projectSlug="${PROJECT_SLUG}". Queue them first with ` +
        `npm run seed:page-backdrops -- --write`,
    )
    return
  }

  const byStatus = new Map<string, number>()
  for (const job of jobs) {
    byStatus.set(job.status, (byStatus.get(job.status) || 0) + 1)
  }

  console.log(
    `Backdrop jobs: ${jobs.length} — ` +
      [...byStatus].map(([s, n]) => `${s} ${n}`).join(', '),
  )
  console.log(`Media root: ${IMAGES_ROOT}${process.env.IMAGES_PATH ? '' : '  (IMAGES_PATH unset — falling back to public/images)'}\n`)

  const ready = jobs.filter((job) => job.artImageId)
  if (!ready.length) {
    console.log('Nothing finished yet — no job has an artImageId. Re-run later.')
    return
  }

  let written = 0
  let skipped = 0

  for (const job of ready as JobRow[]) {
    const payload = payloadOf(job.payload)
    const relPath = typeof payload.imagePath === 'string' ? payload.imagePath : ''
    const label = `${payload.page || '?'}/${payload.variant || '?'}`

    if (!relPath) {
      console.log(`  SKIP  job ${job.id} ${label}: payload has no imagePath`)
      skipped += 1
      continue
    }

    const image = await prisma.artImage.findUnique({
      where: { id: job.artImageId as number },
      select: { id: true, imageData: true, imagePath: true },
    })

    if (!image?.imageData) {
      // Already exported and pruned, or never stored. Either way there are no
      // bytes here to write, and inventing a file would be worse than skipping.
      console.log(
        `  SKIP  job ${job.id} ${label}: ArtImage ${job.artImageId} has no imageData` +
          `${image?.imagePath ? ` (already at ${image.imagePath})` : ''}`,
      )
      skipped += 1
      continue
    }

    const target = join(IMAGES_ROOT, relPath)
    const servedPath = `/images/${relPath.replace(/^\/+/, '')}`

    if (!WRITE) {
      console.log(`  WOULD  ${label.padEnd(24)} -> ${target}`)
      written += 1
      continue
    }

    const original = Buffer.from(image.imageData, 'base64')
    const webp = await sharp(original).webp({ quality: WEBP_QUALITY }).toBuffer()

    await mkdir(dirname(target), { recursive: true })
    await writeFile(target, webp)

    // Link the row to the file so file.get.ts redirects instead of reading
    // base64, and so the pruner can later verify and reclaim the bytes.
    await prisma.artImage.update({
      where: { id: image.id },
      data: { imagePath: servedPath },
    })

    const kb = (n: number) => `${Math.round(n / 1024)}KB`
    console.log(
      `  WROTE  ${label.padEnd(24)} ${kb(original.length)} -> ${kb(webp.length)}  ${servedPath}`,
    )
    written += 1
  }

  console.log(
    `\n${WRITE ? 'Exported' : 'Would export'} ${written} file(s); skipped ${skipped}.`,
  )

  if (!WRITE) {
    console.log('\nDry run only. Re-run with --write to write files and set imagePath.')
    return
  }

  console.log(
    '\nNext: the pages already declare these paths, so they appear on the next\n' +
      'load. Once you are happy, npm run prune:art-image-data reclaims the\n' +
      'database copies — it re-verifies each path serves a real image first.',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
