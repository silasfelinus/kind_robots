// /utils/scripts/backfillEntityCardHeroArt.ts
/*
 * Bulk-enqueue Card and Hero art for entities that gained those slots in
 * migration 20260801220000_entity_card_hero_icon_art (conductor
 * interface-vision/t-007).
 *
 * WHY: Bot, Character, Reward and Scenario each carried one image field until
 * that migration, so the galleries could only ever render one layout. The slots
 * now exist and the art UI exposes them per record -- this script is the bulk
 * path for the backlog.
 *
 * SAFETY -- read before running:
 *   - DRY RUN BY DEFAULT. It prints what it would enqueue and exits. Nothing is
 *     submitted without --apply.
 *   - Hard-capped by --limit (default 10). There is no "all" mode on purpose;
 *     re-run it until the candidate count reaches zero.
 *   - Skips any record that already has art in the target slot, so re-running is
 *     safe and idempotent.
 *   - Skips records with no usable prompt source rather than inventing one.
 *   - Each job costs mana. Start small, confirm the first batch looks right in
 *     the ArtJob queue, then raise --limit.
 *
 * USAGE
 *   export KR_API_BASE=https://kind-robots.vercel.app   # or your local/tailscale host
 *   export KR_API_TOKEN=<user apiKey or admin token>
 *
 *   # See what is missing, submit nothing:
 *   npx tsx utils/scripts/backfillEntityCardHeroArt.ts
 *   npx tsx utils/scripts/backfillEntityCardHeroArt.ts --type bot --field heroPath
 *
 *   # Actually enqueue a small first batch:
 *   npx tsx utils/scripts/backfillEntityCardHeroArt.ts --type bot --field cardPath --limit 5 --apply
 *
 * NOTE: this script has never been executed -- the sandbox it was written in has
 * no database and no relay. The dry run is the safe way to prove the payload and
 * auth before spending anything.
 */
import prisma from '../../server/utils/prisma'

type BackfillType = 'bot' | 'character' | 'reward' | 'scenario'
type SlotField = 'cardPath' | 'heroPath'

const SLOTS: Record<
  SlotField,
  { label: string; width: number; height: number }
> = {
  cardPath: { label: 'Card', width: 512, height: 768 },
  heroPath: { label: 'Hero', width: 1280, height: 720 },
}

const TYPES: BackfillType[] = ['bot', 'character', 'reward', 'scenario']

/*
 * The server enriches whatever base prompt it receives via buildEntityArtPrompt,
 * so this only needs to supply the record's own creative seed. Prefer the
 * explicit artPrompt; fall back to the human-readable fields rather than
 * inventing a prompt for a record that has nothing to say.
 */
function promptFor(record: Record<string, unknown>): string {
  const parts = [
    record.artPrompt,
    record.name ?? record.title,
    record.tagline ?? record.flavorText ?? record.description,
  ]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter(Boolean)

  const seen = new Set<string>()
  const prompt = parts.filter((p) => !seen.has(p) && seen.add(p)).join('. ')

  return prompt.length >= 3 ? prompt.slice(0, 900) : ''
}

function arg(name: string): string | undefined {
  const index = process.argv.indexOf(`--${name}`)
  return index === -1 ? undefined : process.argv[index + 1]
}

async function candidatesFor(
  type: BackfillType,
  field: SlotField,
  limit: number,
): Promise<Array<Record<string, unknown>>> {
  const where = {
    isActive: true,
    OR: [{ [field]: null }, { [field]: '' }],
  } as never

  const delegate = prisma[type] as unknown as {
    findMany: (args: unknown) => Promise<Array<Record<string, unknown>>>
  }

  return delegate.findMany({ where, take: limit, orderBy: { id: 'asc' } })
}

async function enqueue(
  base: string,
  token: string,
  type: BackfillType,
  field: SlotField,
  record: Record<string, unknown>,
  prompt: string,
): Promise<string> {
  const slot = SLOTS[field]

  const response = await fetch(`${base.replace(/\/$/, '')}/api/art/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      engine: 'krea2',
      promptString: prompt,
      width: slot.width,
      height: slot.height,
      isPublic: record.isPublic ?? true,
      isMature: record.isMature ?? false,
      designer: (record.designer as string) || null,
      entityArt: {
        entityType: type,
        entityId: record.id,
        field,
        preserveOriginal: true,
        mode: 'recreate',
      },
    }),
  })

  const body = (await response.json().catch(() => null)) as {
    success?: boolean
    message?: string
    data?: { jobId?: number }
  } | null

  if (!response.ok || !body?.success || !body.data?.jobId) {
    throw new Error(
      `HTTP ${response.status} ${body?.message || 'enqueue failed'}`,
    )
  }

  return String(body.data.jobId)
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply')
  const limit = Math.max(1, Math.min(Number(arg('limit') ?? 10), 200))
  const typeArg = arg('type') as BackfillType | undefined
  const fieldArg = arg('field') as SlotField | undefined

  const types = typeArg ? [typeArg] : TYPES
  const fields: SlotField[] = fieldArg ? [fieldArg] : ['cardPath', 'heroPath']

  for (const type of types) {
    if (!TYPES.includes(type)) throw new Error(`Unknown --type ${type}`)
  }
  for (const field of fields) {
    if (!SLOTS[field]) throw new Error(`Unknown --field ${field}`)
  }

  const base = process.env.KR_API_BASE || ''
  const token = process.env.KR_API_TOKEN || ''

  if (apply && (!base || !token)) {
    throw new Error('--apply requires KR_API_BASE and KR_API_TOKEN.')
  }

  console.log(
    `\n${apply ? '⚡ APPLY' : '🔍 DRY RUN'} — up to ${limit} per type/slot\n`,
  )

  let queued = 0
  let skipped = 0

  for (const type of types) {
    for (const field of fields) {
      const records = await candidatesFor(type, field, limit)
      console.log(
        `\n${type}.${field} (${SLOTS[field].label}) — ${records.length} candidate${records.length === 1 ? '' : 's'}`,
      )

      for (const record of records) {
        const prompt = promptFor(record)
        const name = String(record.name ?? record.title ?? record.id)

        if (!prompt) {
          skipped += 1
          console.log(`  ⏭  ${type} ${record.id} "${name}" — no prompt source`)
          continue
        }

        if (!apply) {
          console.log(
            `  · ${type} ${record.id} "${name}" ← ${prompt.slice(0, 70)}…`,
          )
          continue
        }

        try {
          const jobId = await enqueue(base, token, type, field, record, prompt)
          queued += 1
          console.log(`  ✅ ${type} ${record.id} "${name}" → ArtJob ${jobId}`)
        } catch (error) {
          skipped += 1
          console.error(
            `  ❌ ${type} ${record.id} "${name}" — ${error instanceof Error ? error.message : 'failed'}`,
          )
        }
      }
    }
  }

  console.log(
    `\n${apply ? `Queued ${queued}, skipped ${skipped}.` : 'Dry run — nothing submitted. Add --apply to enqueue.'}\n`,
  )

  await prisma.$disconnect()
}

main().catch(async (error) => {
  console.error(`❌ ${error instanceof Error ? error.message : error}`)
  await prisma.$disconnect().catch(() => undefined)
  process.exitCode = 1
})
