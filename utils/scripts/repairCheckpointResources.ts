// /utils/scripts/repairCheckpointResources.ts
//
// Repair the DB's CHECKPOINT Resource rows against the real files on disk,
// using the findings from `audit:checkpoints`. Reconciles by filename so it
// fixes:
//   - PATH MISMATCH  → set localPath to the real subfolder-qualified path
//                      (strips a stray `checkpoints/` prefix, corrects a wrong
//                      folder like `SDXL/` → `SD15/`, `ARCHIVE/…` → `Pony/`).
//   - DOUBLE-LISTED  → keep the lowest-id Resource per file, DELETE the rest.
//   - STALE          → deactivate (isActive = false) Resources whose file is
//                      gone (reversible; provenance on past art is preserved).
//
// DRY-RUN by default — prints the plan and writes nothing. Add --apply to write.
//   npm run repair:checkpoints -- --files=ckpts.txt           # preview
//   npm run repair:checkpoints -- --files=ckpts.txt --apply   # write
//
// Matching is space/underscore-insensitive on the basename, so a Resource still
// stored as `stable audio open.safetensors` re-points cleanly onto a renamed
// `stable_audio_open.safetensors` on disk — run this AFTER renaming the spaced
// files and regenerating the list, and the DB paths follow the clean names.
import 'dotenv/config'
import { readFile } from 'node:fs/promises'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'

const CHECKPOINT_EXTENSIONS = ['.safetensors', '.ckpt', '.pt', '.gguf', '.sft']

const args = process.argv.slice(2)
const apply = args.includes('--apply')
const filesArg = args
  .find((a) => a.startsWith('--files='))
  ?.slice('--files='.length)

if (!filesArg) {
  console.error('❌ --files=<list> is required (see audit:checkpoints --files).')
  process.exit(1)
}

function normalizePath(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replaceAll('\\', '/').replace(/^\/+/, '')
    : ''
}

function basenameOf(path: string): string {
  return normalizePath(path).split('/').pop() || ''
}

// Space/underscore-insensitive, lowercased basename — links a spaced DB name to
// its renamed (underscored) file on disk without over-merging distinct files.
function normKey(path: string): string {
  return basenameOf(path)
    .toLowerCase()
    .replace(/[\s_]+/g, '')
}

function hasCheckpointExt(name: string): boolean {
  const lower = name.toLowerCase()
  return CHECKPOINT_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

function toCheckpointRelPath(line: string): string {
  const normalized = line.trim().replaceAll('\\', '/')
  const marker = '/checkpoints/'
  const idx = normalized.toLowerCase().lastIndexOf(marker)
  const rel = idx >= 0 ? normalized.slice(idx + marker.length) : normalized
  return rel.replace(/^\/+/, '')
}

async function readCheckpointFileList(path: string): Promise<string[]> {
  const raw = await readFile(path, 'utf8')
  const seen = new Set<string>()
  for (const line of raw.split(/\r?\n/)) {
    const rel = toCheckpointRelPath(line)
    if (rel && hasCheckpointExt(rel)) seen.add(rel)
  }
  return [...seen]
}

type CheckpointResource = {
  id: number
  name: string
  localPath: string | null
  isActive: boolean
}

// Build lookup: exact-basename and normalized-basename → the real disk paths.
// Values are arrays so an ambiguous key (same name in two folders) is skipped
// rather than guessed.
function indexDisk(files: string[]): {
  byBase: Map<string, string[]>
  byNorm: Map<string, string[]>
} {
  const byBase = new Map<string, string[]>()
  const byNorm = new Map<string, string[]>()
  const push = (map: Map<string, string[]>, key: string, value: string) => {
    const list = map.get(key)
    if (list) {
      if (!list.includes(value)) list.push(value)
    } else {
      map.set(key, [value])
    }
  }
  for (const f of files) {
    push(byBase, basenameOf(f).toLowerCase(), f)
    push(byNorm, normKey(f), f)
  }
  return { byBase, byNorm }
}

// Resolve a Resource's real disk path (exact basename, then normalized), or null
// when nothing unambiguously matches (⇒ stale).
function resolveDiskPath(
  resource: CheckpointResource,
  byBase: Map<string, string[]>,
  byNorm: Map<string, string[]>,
): string | null {
  const base = basenameOf(resource.localPath || '').toLowerCase()
  const exact = base ? byBase.get(base) : undefined
  if (exact && exact.length === 1) return exact[0]!

  const norm = normKey(resource.localPath || '')
  const fuzzy = norm ? byNorm.get(norm) : undefined
  if (fuzzy && fuzzy.length === 1) return fuzzy[0]!

  return null
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set.')

  const files = await readCheckpointFileList(filesArg!)
  const { byBase, byNorm } = indexDisk(files)

  const prisma = new PrismaClient({
    adapter: createDatabaseAdapter(databaseUrl),
  })
  const resources = (await prisma.resource.findMany({
    where: { resourceType: 'CHECKPOINT' },
    select: { id: true, name: true, localPath: true, isActive: true },
    orderBy: { id: 'asc' },
  })) as CheckpointResource[]

  // Partition active resources into resolvable (→ real file) and stale.
  const staleDeactivate: CheckpointResource[] = []
  const resolvedByFile = new Map<string, CheckpointResource[]>()
  for (const r of resources) {
    if (!r.isActive) continue
    const disk = resolveDiskPath(r, byBase, byNorm)
    if (!disk) {
      staleDeactivate.push(r)
      continue
    }
    ;(resolvedByFile.get(disk) ?? resolvedByFile.set(disk, []).get(disk)!).push(r)
  }

  // Per real file: keep the lowest id, delete the rest, repath the survivor.
  const pathFixes: { id: number; from: string; to: string }[] = []
  const deleteDupes: { id: number; keptId: number; file: string }[] = []
  for (const [file, rows] of resolvedByFile) {
    const sorted = [...rows].sort((a, b) => a.id - b.id)
    const keep = sorted[0]!
    for (const dup of sorted.slice(1)) {
      deleteDupes.push({ id: dup.id, keptId: keep.id, file })
    }
    if (normalizePath(keep.localPath) !== file) {
      pathFixes.push({ id: keep.id, from: keep.localPath || '(null)', to: file })
    }
  }

  // ---- report ----
  const line = (s: string) => console.log(s)
  line(`\n🔧 Checkpoint repair — ${apply ? 'APPLY' : 'DRY-RUN (no writes)'}`)
  line(
    `   ${files.length} files listed · ${resources.length} resources · ` +
      `${pathFixes.length} path fixes · ${deleteDupes.length} dupes to delete · ` +
      `${staleDeactivate.length} stale to deactivate\n`,
  )

  line(`🧭 PATH FIXES (${pathFixes.length}):`)
  pathFixes.forEach((f) => line(`     #${f.id}  ${f.from}  →  ${f.to}`))

  line(`\n♊ DELETE DUPLICATES (${deleteDupes.length}) — keeping the lower id:`)
  deleteDupes.forEach((d) =>
    line(`     delete #${d.id}  (kept #${d.keptId} for ${d.file})`),
  )

  line(`\n👻 DEACTIVATE STALE (${staleDeactivate.length}) — file not on disk:`)
  staleDeactivate.forEach((r) => line(`     #${r.id}  ${r.localPath ?? '(null)'}`))

  if (!apply) {
    line(`\nℹ️  Dry-run only. Re-run with --apply to write these changes.\n`)
    await prisma.$disconnect()
    return
  }

  // ---- apply (order: delete dupes → repath survivors → deactivate stale) ----
  // A duplicate row referenced by past art (FK) can't be hard-deleted; fall
  // back to deactivating it so --apply completes instead of aborting mid-run.
  const softDeleted: number[] = []
  for (const d of deleteDupes) {
    try {
      await prisma.resource.delete({ where: { id: d.id } })
    } catch {
      await prisma.resource.update({
        where: { id: d.id },
        data: { isActive: false },
      })
      softDeleted.push(d.id)
    }
  }
  for (const f of pathFixes) {
    await prisma.resource.update({
      where: { id: f.id },
      data: { localPath: f.to },
    })
  }
  for (const r of staleDeactivate) {
    await prisma.resource.update({
      where: { id: r.id },
      data: { isActive: false },
    })
  }
  await prisma.$disconnect()

  const hardDeleted = deleteDupes.length - softDeleted.length
  line(
    `\n✅ Applied: ${hardDeleted} deleted · ${softDeleted.length} deactivated ` +
      `(FK-referenced dupes) · ${pathFixes.length} repathed · ` +
      `${staleDeactivate.length} stale deactivated.\n`,
  )
  if (softDeleted.length) {
    line(
      `   ⓘ Deactivated instead of deleted (still referenced): ${softDeleted
        .map((id) => `#${id}`)
        .join(', ')}\n`,
    )
  }
}

main().catch((error) => {
  console.error(`❌ Checkpoint repair failed: ${(error as Error).message}`)
  process.exit(1)
})
