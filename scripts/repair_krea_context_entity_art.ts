// /scripts/repair_krea_context_entity_art.ts
//
// One-shot/probeable repair for entity-art Krea jobs created before semantic
// conditioning was enforced in the Krea workflow builder. It covers the main
// Kind Robots object families: Facet, Character, Bot, Dream, Scenario, Reward.
//
// Safety:
// - dry-run by default; --write is required to mutate anything
// - preserves completed ArtImages and uses NEW_OUTPUT replacement jobs
// - never replaces a slot when a different ArtImage now owns it
// - cancels only still-PENDING tainted jobs; RUNNING jobs are allowed to finish
//   but receive a semantic replacement
// - legacy Facet v2/v3 jobs are left to generate_facet_art.ts --repair-tainted,
//   whose provenance-aware catalog repair is more specific
//
// Usage:
//   npx tsx scripts/repair_krea_context_entity_art.ts
//   npx tsx scripts/repair_krea_context_entity_art.ts --write

import 'dotenv/config'
import {
  attemptFingerprintFromPayload,
  parseArtJobPayload,
} from '../server/utils/artJobPayload'
import {
  enrichArtJobPayload,
  extractWorkflowModels,
  readArtJobProvenance,
} from '../server/utils/artJobProvenance'
import { prepareArtJobRetryPayload } from '../server/utils/artJobRetry'
import { resolveEntityArtTarget } from '../server/utils/entityArt'
import {
  KREA2_CLIP,
  KREA2_MODEL,
} from '../server/api/comfy/krea2/utils/workflow'
import {
  buildKreaSemanticPrompt,
  kreaPromptHasContextNoise,
  rewriteKreaWorkflowPositivePrompt,
} from '../utils/kreaSemanticPrompt'
import {
  createScriptPrismaClient,
  withDatabaseRetry,
} from './lib/databaseRetry'

const WRITE = process.argv.includes('--write')
const MAIN_ENTITY_TYPES = new Set([
  'facet',
  'character',
  'bot',
  'dream',
  'scenario',
  'reward',
])
const LEGACY_FACET_VERSIONS = new Set([
  'facet-multi-art-krea2-v2',
  'facet-coverage-krea2-v3',
])
const ACTIVE_OR_DONE = new Set(['PENDING', 'RUNNING', 'DONE'])

type JsonRecord = Record<string, unknown>

type Candidate = {
  id: number
  status: string
  engine: string
  payload: string
  priority: number
  projectSlug: string | null
  projectId: number | null
  userId: number
  artImageId: number | null
}

type Target = {
  entityType: string
  entityId: number
  field: string
}

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as JsonRecord)
    : {}
}

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function entityTarget(payload: JsonRecord): Target | null {
  const raw = asRecord(payload.entityArt)
  const entityType = text(raw.entityType).toLowerCase()
  const entityId = Number(raw.entityId)
  const field = text(raw.field)
  if (!MAIN_ENTITY_TYPES.has(entityType)) return null
  if (!Number.isInteger(entityId) || entityId <= 0 || !field) return null
  return { entityType, entityId, field }
}

function targetKey(target: Target): string {
  return `${target.entityType}:${target.entityId}:${target.field}`
}

function isKreaWorkflow(payload: JsonRecord): boolean {
  const models = extractWorkflowModels(payload.workflow)
  return models.some(
    (model) => model === KREA2_MODEL || model === KREA2_CLIP || /krea-?2/i.test(model),
  )
}

function isLegacyFacetCatalogJob(payload: JsonRecord): boolean {
  return LEGACY_FACET_VERSIONS.has(text(payload.facetArtworkVersion))
}

function currentSlotArtImageId(record: JsonRecord, field: string): number | null {
  const idField =
    field === 'cardPath'
      ? 'cardArtImageId'
      : field === 'heroPath'
        ? 'heroArtImageId'
        : field === 'iconPath'
          ? 'iconArtImageId'
          : 'artImageId'
  const id = Number(record[idField])
  return Number.isInteger(id) && id > 0 ? id : null
}

function currentSlotPath(record: JsonRecord, field: string): string {
  return text(record[field])
}

function stillOwnsSlot(
  record: JsonRecord,
  field: string,
  sourceArtImageId: number | null,
): boolean {
  const currentId = currentSlotArtImageId(record, field)
  if (sourceArtImageId && currentId) return sourceArtImageId === currentId
  if (currentId && !sourceArtImageId) return false
  return Boolean(currentSlotPath(record, field)) || !currentId
}

function repairPayload(
  source: Candidate,
  parsed: JsonRecord,
): { payload: JsonRecord; semanticPrompt: string } | null {
  const rawPrompt = text(parsed.promptString || parsed.artPrompt || parsed.prompt)
  if (!rawPrompt) return null

  const prepared = prepareArtJobRetryPayload(
    source.payload,
    source.id,
    source.artImageId,
    'NEW_OUTPUT',
    true,
  ) as JsonRecord
  const rewritten = rewriteKreaWorkflowPositivePrompt(
    prepared.workflow,
    rawPrompt,
  )
  if (!rewritten.rewrittenNodes) return null

  prepared.workflow = rewritten.workflow
  prepared.promptString = rewritten.prompt
  if ('basePromptString' in prepared) prepared.basePromptString = rewritten.prompt
  prepared.entityArt = {
    ...asRecord(prepared.entityArt),
    preserveOriginal: true,
    mode: 'recreate',
  }
  prepared.kreaSemanticRepair = {
    version: 1,
    sourceJobId: source.id,
    repairedAt: new Date().toISOString(),
    reason: 'contextual-positive-conditioning',
  }
  delete prepared.provenance
  delete prepared.attemptFingerprint

  const prior = readArtJobProvenance(source.payload)
  const enriched = enrichArtJobPayload('COMFY', prepared, {
    projectSlug: source.projectSlug,
    idempotencyKey: `krea-semantic-entity-repair:${source.id}`,
    requireCompletionProof: prior?.requireCompletionProof ?? true,
  })

  return {
    payload: enriched.payload as JsonRecord,
    semanticPrompt: rewritten.prompt,
  }
}

export async function main(): Promise<void> {
  await withDatabaseRetry('Krea contextual entity-art repair', async () => {
    const prisma = createScriptPrismaClient()
    try {
      const rows = (await prisma.artJob.findMany({
        where: {
          engine: 'COMFY',
          payload: { contains: '"entityArt"' },
          status: { in: ['PENDING', 'RUNNING', 'DONE'] },
        },
        orderBy: { id: 'desc' },
        select: {
          id: true,
          status: true,
          engine: true,
          payload: true,
          priority: true,
          projectSlug: true,
          projectId: true,
          userId: true,
          artImageId: true,
        },
      })) as Candidate[]

      const parsedRows = rows.map((row) => ({
        row,
        payload: parseArtJobPayload(row.payload) as JsonRecord,
      }))
      const cleanOrRepairedTargets = new Map<string, number>()
      for (const item of parsedRows) {
        const target = entityTarget(item.payload)
        if (!target || !isKreaWorkflow(item.payload)) continue
        const rawPrompt = text(
          item.payload.promptString || item.payload.artPrompt || item.payload.prompt,
        )
        const repaired = asRecord(item.payload.kreaSemanticRepair).version === 1
        if (repaired || !kreaPromptHasContextNoise(rawPrompt)) {
          const key = targetKey(target)
          cleanOrRepairedTargets.set(
            key,
            Math.max(cleanOrRepairedTargets.get(key) ?? 0, item.row.id),
          )
        }
      }

      const cancelledPending: number[] = []
      const replacementIds: number[] = []
      const replacementSources: number[] = []
      const skippedSuperseded: number[] = []
      const skippedNewerClean: number[] = []
      const skippedLegacyFacet: number[] = []
      const skippedNoTarget: number[] = []
      const skippedNoRewrite: number[] = []
      const planned = new Set<string>()
      const samples: Array<{
        sourceJobId: number
        target: string
        before: string
        after: string
      }> = []

      for (const item of parsedRows) {
        const source = item.row
        const payload = item.payload
        const target = entityTarget(payload)
        if (!target || !isKreaWorkflow(payload)) continue
        if (!ACTIVE_OR_DONE.has(source.status)) continue
        if (target.entityType === 'facet' && isLegacyFacetCatalogJob(payload)) {
          skippedLegacyFacet.push(source.id)
          continue
        }

        const rawPrompt = text(payload.promptString || payload.artPrompt || payload.prompt)
        if (!kreaPromptHasContextNoise(rawPrompt)) continue

        const key = targetKey(target)
        if (planned.has(key)) continue
        const newerCleanId = cleanOrRepairedTargets.get(key) ?? 0
        if (newerCleanId > source.id) {
          skippedNewerClean.push(source.id)
          continue
        }

        let resolved: Awaited<ReturnType<typeof resolveEntityArtTarget>>
        try {
          resolved = await resolveEntityArtTarget(
            prisma,
            target.entityType,
            target.entityId,
            target.field,
          )
        } catch {
          skippedNoTarget.push(source.id)
          continue
        }
        const record = resolved.record as JsonRecord

        if (
          source.status === 'DONE' &&
          !stillOwnsSlot(record, target.field, source.artImageId)
        ) {
          skippedSuperseded.push(source.id)
          continue
        }

        const slotOccupied = Boolean(
          currentSlotArtImageId(record, target.field) ||
            currentSlotPath(record, target.field),
        )
        if (source.status === 'PENDING' && slotOccupied) {
          if (WRITE) {
            await prisma.artJob.update({
              where: { id: source.id },
              data: {
                status: 'CANCELLED',
                claimedAt: null,
                claimedBy: null,
                error:
                  'Cancelled by Krea semantic entity-art repair: contextual positive conditioning was superseded and the target slot is already populated.',
              },
            })
          }
          cancelledPending.push(source.id)
          planned.add(key)
          continue
        }

        const replacement = repairPayload(source, payload)
        if (!replacement) {
          skippedNoRewrite.push(source.id)
          continue
        }

        samples.push({
          sourceJobId: source.id,
          target: key,
          before: rawPrompt.slice(0, 220),
          after: replacement.semanticPrompt.slice(0, 220),
        })

        if (WRITE) {
          if (source.status === 'PENDING') {
            await prisma.artJob.update({
              where: { id: source.id },
              data: {
                status: 'CANCELLED',
                claimedAt: null,
                claimedBy: null,
                error:
                  'Cancelled by Krea semantic entity-art repair: contextual positive conditioning replaced by semantic-only conditioning.',
              },
            })
            cancelledPending.push(source.id)
          }

          const created = await prisma.artJob.create({
            data: {
              engine: 'COMFY',
              payload: JSON.stringify(replacement.payload),
              attemptFingerprint: attemptFingerprintFromPayload(replacement.payload),
              priority: Math.max(100, source.priority),
              projectSlug: source.projectSlug,
              projectId: source.projectId,
              userId: source.userId,
            },
          })
          replacementIds.push(created.id)
        }

        replacementSources.push(source.id)
        planned.add(key)
      }

      console.log(
        JSON.stringify(
          {
            mode: WRITE ? 'write' : 'dry-run',
            scanned: rows.length,
            mainEntityTypes: [...MAIN_ENTITY_TYPES],
            replacementsPlanned: replacementSources.length,
            replacementSourceJobIds: replacementSources,
            replacementArtJobIds: replacementIds,
            pendingCancelled: cancelledPending.length,
            pendingCancelledJobIds: cancelledPending,
            skipped: {
              supersededOutputs: skippedSuperseded.length,
              newerCleanJob: skippedNewerClean.length,
              legacyFacetHandledByFacetRepair: skippedLegacyFacet.length,
              missingEntityTarget: skippedNoTarget.length,
              workflowCouldNotBeRewritten: skippedNoRewrite.length,
            },
            samples: samples.slice(0, 24),
            policy:
              'Krea positive conditioning contains visual concepts only. Raw contextual request text is retained only in workflow _meta provenance and is not connected to CLIP conditioning.',
          },
          null,
          2,
        ),
      )
    } finally {
      await prisma.$disconnect()
    }
  })
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
