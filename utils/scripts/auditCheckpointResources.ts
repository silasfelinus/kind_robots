// /utils/scripts/auditCheckpointResources.ts
//
// Reconcile the DB's CHECKPOINT Resource rows against the actual checkpoint
// files on disk, to answer "are our checkpoints double-listed or incomplete?".
// READ-ONLY — it never writes to the database.
//
// Run on the box that has the DB (Silas-PC/WSL); the files can live elsewhere.
//   npm run audit:checkpoints                       # scan default dir
//   npm run audit:checkpoints -- --dir=/path/to/checkpoints
//   npm run audit:checkpoints -- --files=list.txt   # use a pre-made file list
//   npm run audit:checkpoints -- --json             # machine-readable
//
// --files decouples "where the checkpoints live" from "where node + the DB
// run" — handy when the models sit on another box (e.g. alexandria) that the
// WSL box only sees as an unmounted network drive. Generate the list WHERE the
// files are, then feed it here:
//   # on the box that has the files:
//   find /mnt/user/pc/ai/models/checkpoints -type f \
//     \( -name '*.safetensors' -o -name '*.ckpt' -o -name '*.pt' \
//        -o -name '*.gguf' -o -name '*.sft' \) -printf '%P\n' > ckpts.txt
//   # then, on the DB box:
//   npm run audit:checkpoints -- --files=ckpts.txt
// Each line may be a bare `%P` relative path, a full absolute path, or a `ls`
// line — anything after the last `.../checkpoints/` is taken as the real path.
//
// Matching is by filename (basename), because a Resource's stored folder may
// differ from where the file actually lives — that mismatch is itself a finding
// (ComfyUI needs the subfolder-qualified path, e.g. `SDXL/foo.safetensors`).
import 'dotenv/config'
import { readdir, readFile } from 'node:fs/promises'
import { join, posix } from 'node:path'
import { PrismaClient } from './../../prisma/generated/prisma/client'
import { createDatabaseAdapter } from './../../server/utils/databaseAdapterConfig'

const CHECKPOINT_EXTENSIONS = ['.safetensors', '.ckpt', '.pt', '.gguf', '.sft']
const DEFAULT_DIR =
  process.env.COMFY_CHECKPOINTS_DIR || '/mnt/user/pc/ai/models/checkpoints'

const args = process.argv.slice(2)
const asJson = args.includes('--json')
const dirArg = args.find((a) => a.startsWith('--dir='))?.slice('--dir='.length)
const filesArg = args
  .find((a) => a.startsWith('--files='))
  ?.slice('--files='.length)
const rootDir = (dirArg || DEFAULT_DIR).replace(/\/+$/, '')

function normalizePath(value: unknown): string {
  return typeof value === 'string'
    ? value.trim().replaceAll('\\', '/').replace(/^\/+/, '')
    : ''
}

function basenameOf(path: string): string {
  return normalizePath(path).split('/').pop() || ''
}

function hasCheckpointExt(name: string): boolean {
  const lower = name.toLowerCase()
  return CHECKPOINT_EXTENSIONS.some((ext) => lower.endsWith(ext))
}

// Reduce an arbitrary path/line to the subfolder-qualified path ComfyUI would
// list: strip everything through the last `.../checkpoints/`, else keep the
// relative remainder. Handles bare `%P` output, absolute paths, and `ls` lines.
function toCheckpointRelPath(line: string): string {
  const normalized = line.trim().replaceAll('\\', '/')
  const marker = '/checkpoints/'
  const idx = normalized.toLowerCase().lastIndexOf(marker)
  const rel = idx >= 0 ? normalized.slice(idx + marker.length) : normalized
  return rel.replace(/^\/+/, '')
}

// Parse a newline-delimited file list (from `find … -printf '%P\n'`, `ls`, etc.)
// into subfolder-qualified checkpoint paths.
async function readCheckpointFileList(path: string): Promise<string[]> {
  const raw = await readFile(path, 'utf8')
  const seen = new Set<string>()
  for (const line of raw.split(/\r?\n/)) {
    const rel = toCheckpointRelPath(line)
    if (rel && hasCheckpointExt(rel)) seen.add(rel)
  }
  return [...seen]
}

// Recursively list checkpoint files as subfolder-qualified, posix-style paths
// relative to rootDir — exactly how ComfyUI's CheckpointLoaderSimple lists them.
async function listCheckpointFiles(dir: string, prefix = ''): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true })
  const files: string[] = []
  for (const entry of entries) {
    const rel = prefix ? posix.join(prefix, entry.name) : entry.name
    if (entry.isDirectory()) {
      files.push(...(await listCheckpointFiles(join(dir, entry.name), rel)))
    } else if (entry.isFile() && hasCheckpointExt(entry.name)) {
      files.push(rel)
    }
  }
  return files
}

type CheckpointResource = {
  id: number
  name: string
  customLabel: string | null
  localPath: string | null
  supportedServer: string | null
  isActive: boolean
}

async function main(): Promise<void> {
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) throw new Error('DATABASE_URL is not set.')

  let files: string[]
  if (filesArg) {
    try {
      files = await readCheckpointFileList(filesArg)
    } catch (error) {
      throw new Error(
        `Could not read file list "${filesArg}": ${(error as Error).message}.`,
      )
    }
  } else {
    try {
      files = await listCheckpointFiles(rootDir)
    } catch (error) {
      throw new Error(
        `Could not read checkpoints dir "${rootDir}": ${(error as Error).message}. ` +
          `Pass --dir=/actual/path, --files=list.txt, or set COMFY_CHECKPOINTS_DIR. ` +
          `(On WSL a mapped network drive like Z: often isn't under /mnt — use --files.)`,
      )
    }
  }

  const prisma = new PrismaClient({
    adapter: createDatabaseAdapter(databaseUrl),
  })
  const resources = (await prisma.resource.findMany({
    where: { resourceType: 'CHECKPOINT' },
    select: {
      id: true,
      name: true,
      customLabel: true,
      localPath: true,
      supportedServer: true,
      isActive: true,
    },
    orderBy: { id: 'asc' },
  })) as CheckpointResource[]
  await prisma.$disconnect()

  // Index resources by filename basename (lowercased) for cross-matching.
  const byBase = new Map<string, CheckpointResource[]>()
  for (const r of resources) {
    const base = basenameOf(r.localPath || '').toLowerCase()
    if (!base) continue
    ;(byBase.get(base) ?? byBase.set(base, []).get(base)!).push(r)
  }

  const fileByBase = new Map<string, string[]>()
  for (const f of files) {
    const base = basenameOf(f).toLowerCase()
    ;(fileByBase.get(base) ?? fileByBase.set(base, []).get(base)!).push(f)
  }

  // 1. INCOMPLETE — a file on disk with no CHECKPOINT resource.
  const missingFromDb = files
    .filter((f) => !byBase.has(basenameOf(f).toLowerCase()))
    .sort()

  // 2. STALE — an active resource whose file is not on disk.
  const staleInDb = resources
    .filter((r) => r.isActive)
    .filter((r) => {
      const base = basenameOf(r.localPath || '').toLowerCase()
      return !base || !fileByBase.has(base)
    })

  // 3. DOUBLE-LISTED — >1 active resource for the same filename.
  const duplicates = [...byBase.entries()]
    .map(([base, rs]) => ({ base, rows: rs.filter((r) => r.isActive) }))
    .filter((d) => d.rows.length > 1)

  // 4. PATH MISMATCH — resource matches a file by name, but its stored
  //    localPath differs from the real subfolder-qualified path (ComfyUI 400s).
  const pathMismatch: { resource: CheckpointResource; actual: string }[] = []
  for (const r of resources) {
    if (!r.isActive) continue
    const base = basenameOf(r.localPath || '').toLowerCase()
    const actualPaths = fileByBase.get(base)
    if (!actualPaths || actualPaths.length !== 1) continue
    const actual = actualPaths[0]!
    if (normalizePath(r.localPath) !== actual) {
      pathMismatch.push({ resource: r, actual })
    }
  }

  // 5. Filename hygiene — spaces / trailing whitespace break exact matching.
  const hygiene = files.filter(
    (f) => /\s/.test(basenameOf(f)) || basenameOf(f) !== basenameOf(f).trim(),
  )

  const source = filesArg ? `file list: ${filesArg}` : rootDir

  if (asJson) {
    console.log(
      JSON.stringify(
        {
          source,
          counts: {
            filesOnDisk: files.length,
            resourcesTotal: resources.length,
            resourcesActive: resources.filter((r) => r.isActive).length,
            missingFromDb: missingFromDb.length,
            staleInDb: staleInDb.length,
            duplicates: duplicates.length,
            pathMismatch: pathMismatch.length,
            hygiene: hygiene.length,
          },
          missingFromDb,
          staleInDb: staleInDb.map((r) => ({ id: r.id, localPath: r.localPath })),
          duplicates: duplicates.map((d) => ({
            base: d.base,
            ids: d.rows.map((r) => r.id),
          })),
          pathMismatch: pathMismatch.map((m) => ({
            id: m.resource.id,
            stored: m.resource.localPath,
            actual: m.actual,
          })),
          hygiene,
        },
        null,
        2,
      ),
    )
    return
  }

  const line = (s: string) => console.log(s)
  line(`\n📦 Checkpoint audit — ${source}`)
  line(
    `   ${files.length} files listed · ${resources.length} CHECKPOINT resources ` +
      `(${resources.filter((r) => r.isActive).length} active)\n`,
  )

  line(`🕳️  INCOMPLETE — on disk, no Resource (${missingFromDb.length}):`)
  missingFromDb.forEach((f) => line(`     + ${f}`))

  line(`\n👻 STALE — active Resource, file missing on disk (${staleInDb.length}):`)
  staleInDb.forEach((r) => line(`     #${r.id}  ${r.localPath ?? '(no localPath)'}`))

  line(`\n♊ DOUBLE-LISTED — same filename, multiple active Resources (${duplicates.length}):`)
  duplicates.forEach((d) =>
    line(`     ${d.base}  →  ids ${d.rows.map((r) => `#${r.id}`).join(', ')}`),
  )

  line(`\n🧭 PATH MISMATCH — Resource path ≠ real subfolder path (${pathMismatch.length}):`)
  pathMismatch.forEach((m) =>
    line(`     #${m.resource.id}  stored=${m.resource.localPath}  actual=${m.actual}`),
  )

  line(`\n⚠️  FILENAME HYGIENE — spaces / trailing whitespace (${hygiene.length}):`)
  hygiene.forEach((f) => line(`     ${JSON.stringify(f)}`))

  const clean =
    !missingFromDb.length &&
    !staleInDb.length &&
    !duplicates.length &&
    !pathMismatch.length
  line(
    clean
      ? '\n✅ DB checkpoints and disk are in sync.\n'
      : '\n❌ Drift found — see sections above.\n',
  )
}

main().catch((error) => {
  console.error(`❌ Checkpoint audit failed: ${(error as Error).message}`)
  process.exit(1)
})
