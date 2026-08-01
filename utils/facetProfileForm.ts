// /utils/facetProfileForm.ts
import type {
  FacetCreateInput,
  FacetWithAliases,
} from '@/stores/facetStore'
import type { FacetTaxonomy } from '@/stores/facetCatalogStore'

export type FacetProfileForm = {
  title: string
  canonicalValue: string
  taxonomy: FacetTaxonomy
  aliases: string
  description: string
  groupKey: string
  groupLabel: string
  sortOrder: number
  sourceRank: number
  metadata: string
  imagePath: string
  cardPath: string
  heroPath: string
  iconPath: string
  artPrompt: string
  randomWeight: number
  isRandomizable: boolean
  artRequired: boolean
  isPublic: boolean
  isMature: boolean
}

export function blankFacetProfileForm(): FacetProfileForm {
  return {
    title: '',
    canonicalValue: '',
    taxonomy: 'OTHER',
    aliases: '',
    description: '',
    groupKey: '',
    groupLabel: '',
    sortOrder: 0,
    sourceRank: 100,
    metadata: '',
    imagePath: '',
    cardPath: '',
    heroPath: '',
    iconPath: '',
    artPrompt: '',
    randomWeight: 1,
    isRandomizable: true,
    artRequired: true,
    isPublic: true,
    isMature: false,
  }
}

export function facetToProfileForm(facet: FacetWithAliases): FacetProfileForm {
  return {
    title: facet.title,
    canonicalValue: facet.canonicalValue,
    taxonomy: facet.taxonomy,
    aliases: facet.aliases.filter((alias) => alias !== facet.slug).join(', '),
    description: facet.description || '',
    groupKey: facet.groupKey || '',
    groupLabel: facet.groupLabel || '',
    sortOrder: facet.sortOrder,
    sourceRank: facet.sourceRank,
    metadata: facet.metadata ? JSON.stringify(facet.metadata, null, 2) : '',
    imagePath: facet.imagePath || '',
    cardPath: facet.cardPath || '',
    heroPath: facet.heroPath || '',
    iconPath: facet.iconPath || '',
    artPrompt: facet.artPrompt || '',
    randomWeight: facet.randomWeight,
    isRandomizable: facet.isRandomizable,
    artRequired: facet.artRequired,
    isPublic: facet.isPublic,
    isMature: facet.isMature,
  }
}

function optional(value: string): string | null {
  return value.trim() || null
}

function parseAliases(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(',')
        .map((alias) => alias.trim())
        .filter(Boolean),
    ),
  )
}

export function parseFacetMetadata(
  value: string,
): Record<string, unknown> | null {
  if (!value.trim()) return null
  const parsed = JSON.parse(value) as unknown
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Structured metadata must be a JSON object.')
  }
  return parsed as Record<string, unknown>
}

export function facetProfilePayload(form: FacetProfileForm): FacetCreateInput {
  const title = form.title.trim()
  if (!title) throw new Error('A canonical title is required.')

  return {
    title,
    taxonomy: form.taxonomy,
    canonicalValue: form.canonicalValue.trim() || title,
    aliases: parseAliases(form.aliases),
    description: optional(form.description),
    groupKey: optional(form.groupKey),
    groupLabel: optional(form.groupLabel),
    sortOrder: Math.trunc(Number(form.sortOrder) || 0),
    sourceRank: Math.max(0, Math.trunc(Number(form.sourceRank) || 0)),
    metadata: parseFacetMetadata(form.metadata),
    imagePath: optional(form.imagePath),
    cardPath: optional(form.cardPath),
    heroPath: optional(form.heroPath),
    iconPath: optional(form.iconPath),
    artPrompt: optional(form.artPrompt),
    randomWeight: Math.max(0, Number(form.randomWeight) || 0),
    isRandomizable: form.isRandomizable,
    artRequired: form.artRequired,
    isPublic: form.isPublic,
    isMature: form.isMature,
  }
}
