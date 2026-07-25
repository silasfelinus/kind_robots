// /server/utils/facetProfileInput.ts
import { createError } from 'h3'
import type { FacetKind } from '~/prisma/generated/prisma/client'
import {
  FACET_TAXONOMIES,
  type FacetTaxonomy,
} from '~/server/utils/facetCatalog'

export type FacetProfileInput = Record<string, unknown>

export type FacetProfileData = {
  taxonomy: FacetTaxonomy
  canonicalValue: string
  groupKey: string | null
  groupLabel: string | null
  sortOrder: number
  isRandomizable: boolean
  randomWeight: number
  artRequired: boolean
  sourceRank: number
  metadata: string | null
}

function optionalText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function finiteNumber(
  value: unknown,
  fallback: number,
  options: { min?: number; integer?: boolean } = {},
): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  const normalized = options.integer ? Math.trunc(parsed) : parsed
  return options.min != null && normalized < options.min
    ? options.min
    : normalized
}

function taxonomyFromKind(kind: FacetKind): FacetTaxonomy {
  return FACET_TAXONOMIES.includes(kind as FacetTaxonomy)
    ? (kind as FacetTaxonomy)
    : 'OTHER'
}

export function normalizeFacetTaxonomy(
  value: unknown,
  fallbackKind: FacetKind,
): FacetTaxonomy {
  if (value == null || value === '') return taxonomyFromKind(fallbackKind)

  const normalized = String(value).trim().toUpperCase()
  if (!FACET_TAXONOMIES.includes(normalized as FacetTaxonomy)) {
    throw createError({
      statusCode: 400,
      message: `Invalid Facet taxonomy. Expected one of: ${FACET_TAXONOMIES.join(', ')}.`,
    })
  }

  return normalized as FacetTaxonomy
}

function normalizeMetadata(value: unknown): string | null {
  if (value == null || value === '') return null

  if (typeof value === 'string') {
    try {
      const parsed: unknown = JSON.parse(value)
      if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        throw new Error('Metadata must be a JSON object.')
      }
      return JSON.stringify(parsed)
    } catch {
      throw createError({
        statusCode: 400,
        message: 'Facet metadata must be a valid JSON object.',
      })
    }
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return JSON.stringify(value)
  }

  throw createError({
    statusCode: 400,
    message: 'Facet metadata must be an object or JSON object string.',
  })
}

export function buildFacetProfileCreateData(
  body: FacetProfileInput,
  defaults: { title: string; kind: FacetKind },
): FacetProfileData {
  const taxonomy = normalizeFacetTaxonomy(body.taxonomy, defaults.kind)

  return {
    taxonomy,
    canonicalValue: optionalText(body.canonicalValue) ?? defaults.title,
    groupKey: optionalText(body.groupKey),
    groupLabel: optionalText(body.groupLabel),
    sortOrder: finiteNumber(body.sortOrder, 0, { integer: true }),
    isRandomizable:
      typeof body.isRandomizable === 'boolean' ? body.isRandomizable : true,
    randomWeight: finiteNumber(body.randomWeight, 1, { min: 0 }),
    artRequired:
      typeof body.artRequired === 'boolean'
        ? body.artRequired
        : taxonomy !== 'COLOR',
    sourceRank: finiteNumber(body.sourceRank, 5, {
      min: 0,
      integer: true,
    }),
    metadata: normalizeMetadata(body.metadata),
  }
}

export function buildFacetProfileUpdateData(
  body: FacetProfileInput,
  defaults: { title: string; kind: FacetKind },
): Partial<FacetProfileData> {
  const data: Partial<FacetProfileData> = {}

  if (body.taxonomy !== undefined || body.kind !== undefined) {
    data.taxonomy = normalizeFacetTaxonomy(body.taxonomy, defaults.kind)
  }
  if (body.canonicalValue !== undefined || body.title !== undefined) {
    data.canonicalValue = optionalText(body.canonicalValue) ?? defaults.title
  }
  if (body.groupKey !== undefined) data.groupKey = optionalText(body.groupKey)
  if (body.groupLabel !== undefined)
    data.groupLabel = optionalText(body.groupLabel)
  if (body.sortOrder !== undefined) {
    data.sortOrder = finiteNumber(body.sortOrder, 0, { integer: true })
  }
  if (typeof body.isRandomizable === 'boolean') {
    data.isRandomizable = body.isRandomizable
  }
  if (body.randomWeight !== undefined) {
    data.randomWeight = finiteNumber(body.randomWeight, 1, { min: 0 })
  }
  if (typeof body.artRequired === 'boolean') {
    data.artRequired = body.artRequired
  }
  if (body.sourceRank !== undefined) {
    data.sourceRank = finiteNumber(body.sourceRank, 5, {
      min: 0,
      integer: true,
    })
  }
  if (body.metadata !== undefined) data.metadata = normalizeMetadata(body.metadata)

  return data
}
