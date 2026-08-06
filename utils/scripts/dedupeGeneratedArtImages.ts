// /utils/scripts/dedupeGeneratedArtImages.ts
//
// Collapse byte-identical copies in the generated/ landing zone to one file each.
//
// WHY THERE ARE DUPLICATES. Silas, 2026-08-06: "bad generation prompts mixed
// with a queue rebuilder that wasn't deleting when reenqueing, I think
// eventually multiplying these generations… also because we weren't
// randomizing seeds." All three are fixed, so this is cleanup of a closed bug,
// not a recurring chore. Measured on the share afterwards:
//
//   106 duplicate groups, 894 redundant files
//
// HOW IDENTITY IS ESTABLISHED. Not by prompt, not by size — by the short
// content hash offloadArtImageBytes already wrote into every landing-zone
// filename (artimage-<id>-<hash>.webp). That hash was taken from the bytes
// actually written, so two files sharing it are genuinely identical and
// nothing has to re-read them to prove it.
//
// SCOPE IS DELIBERATELY NARROW. Only rows whose imagePath is under
// /images/generated/. Filed entity art lives elsewhere and is never considered,
// even if it happens to duplicate something.
//
//   npm run dedupe:generated-art               # dry run
//   npm run dedupe:generated-art -- --write
import 'dotenv/config'
import { unlink } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import prisma from './../../server/utils/prisma'

const WRITE = process.argv.includes('--write')

const LANDING_PREFIX = '/images/generated/'
const HASH_IN_NAME = /-([0-9a-f]{8})\.[a-z0-9]+$/i

type Row = { id: number; imagePath: string }

function hashOf(imagePath: string): string | null {
  return imagePath.match(HASH_IN_NAME)?.[1]?.toLowerCase() ?? null
}

async function main() {
  const root = process.env.IMAGES_PATH?.trim()
  if (!root) {
    console.error(
      '❌ IMAGES_PATH is not set, so the files cannot be removed.\n' +
        '   Run this on the host with the share mounted.',
    )
    process.exitCode = 1
    return
  }

  const rows = await prisma.$queryRawUnsafe<Row[]>(`
    SELECT id, imagePath
    FROM ArtImage
    WHERE imagePath LIKE '${LANDING_PREFIX}%'
    ORDER BY id ASC
  `)

  /*
   * Lowest id wins — the earliest render of the group, and the copy most
   * likely to already be referenced somewhere.
   */
  const groups = new Map<string, number[]>()
  const pathById = new Map<number, string>()
  for (const row of rows) {
    const hash = hashOf(row.imagePath)
    if (!hash) continue
    pathById.set(row.id, row.imagePath)
    const ids = groups.get(hash)
    if (ids) ids.push(row.id)
    else groups.set(hash, [row.id])
  }

  const duplicated = [...groups.entries()].filter(([, ids]) => ids.length > 1)
  const redundant = duplicated.reduce((sum, [, ids]) => sum + ids.length - 1, 0)

  console.log(`Landing-zone rows: ${rows.length}`)
  console.log(
    `Duplicate groups: ${duplicated.length}  —  ${redundant} redundant row(s) to remove\n`,
  )

  if (!duplicated.length) {
    console.log('Nothing duplicated. Every landing-zone image is unique.')
    return
  }

  if (!WRITE) {
    for (const [hash, ids] of duplicated.slice(0, 10)) {
      console.log(
        `  ${hash}  ${String(ids.length).padStart(3)} copies  keep #${ids[0]}, ` +
          `remove ${ids.length - 1}`,
      )
    }
    if (duplicated.length > 10) console.log(`  … and ${duplicated.length - 10} more groups`)
    console.log(
      `\nDry run only. Re-run with --write to remove ${redundant} row(s) and their files.`,
    )
    return
  }

  let removed = 0
  let droppedJobs = 0
  const skipped = new Map<string, number>()

  for (const [, ids] of duplicated) {
    // ids[0] is the survivor; everything after it goes.
    for (const victim of ids.slice(1)) {
      /*
       * The ArtImage row goes FIRST, before anything else is touched.
       *
       * It is the only step that can be refused — a foreign key would mean an
       * entity claimed this image after all — and every other deletion here is
       * irreversible. Doing it first means a refusal leaves the job history and
       * the file exactly as they were, instead of having already destroyed the
       * history of an image we then keep.
       */
      try {
        await prisma.artImage.delete({ where: { id: victim } })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        const reason = /[Ff]oreign key/.test(message)
          ? 'still referenced by another record'
          : message.slice(0, 80)
        skipped.set(reason, (skipped.get(reason) || 0) + 1)
        continue
      }

      /*
       * Silas, 2026-08-06: "We should just delete the art jobs when duplicated,
       * rather than repoint. I have no need for umpteen art jobs pointing to
       * the same image."
       *
       * ArtJob.artImageId is a plain Int with no foreign key, so these rows
       * would survive as dangling pointers if left alone. The jobs that
       * produced a duplicate are the record of a bug that has been fixed —
       * there is nothing to learn from forty copies of it. The surviving
       * image keeps its own job.
       */
      const dropped = await prisma.artJob.deleteMany({
        where: { artImageId: victim },
      })
      droppedJobs += dropped.count

      const relative = (pathById.get(victim) || '').replace(/^\/images\//, '')
      if (relative) {
        await unlink(join(resolve(root), relative)).catch(() => {
          // The row is already gone; a missing file is the desired end state.
        })
      }
      removed += 1
    }
  }

  console.log(`Removed ${removed} redundant row(s) and their files.`)
  if (droppedJobs) {
    console.log(`Deleted ${droppedJobs} ArtJob record(s) that produced the removed copies.`)
  }
  if (skipped.size) {
    console.log('\nKept despite being duplicates:')
    for (const [reason, count] of [...skipped].sort((a, b) => b[1] - a[1])) {
      console.log(`  ${String(count).padStart(5)}  ${reason}`)
    }
  }
  console.log(
    '\nRun OPTIMIZE TABLE ArtImage if you want the freed rows returned to disk.',
  )
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(() => prisma.$disconnect())
