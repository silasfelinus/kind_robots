// /utils/scripts/verifyFacetCatalogAudit.ts
import { auditFacetCatalog, type FacetAuditInput } from './../facetCatalogAudit'

function fixture(
  overrides: Partial<FacetAuditInput> & Pick<FacetAuditInput, 'id' | 'title'>,
): FacetAuditInput {
  return {
    id: overrides.id,
    title: overrides.title,
    slug:
      overrides.slug ??
      overrides.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    taxonomy: overrides.taxonomy === undefined ? 'OTHER' : overrides.taxonomy,
    groupKey: overrides.groupKey ?? null,
    groupLabel: overrides.groupLabel ?? null,
    isRandomizable: overrides.isRandomizable ?? true,
    randomWeight: overrides.randomWeight ?? 1,
    sourceRank: overrides.sourceRank ?? 10,
    description: overrides.description ?? 'Curated description.',
    flavorText: overrides.flavorText ?? null,
    examples: overrides.examples ?? null,
    artPrompt: overrides.artPrompt ?? null,
    aliases: overrides.aliases ?? [],
    artBacked: overrides.artBacked ?? false,
  }
}

function candidateById(
  report: ReturnType<typeof auditFacetCatalog>,
  id: number,
) {
  return report.candidates.find((candidate) => candidate.id === id)
}

function requireCondition(
  condition: unknown,
  message: string,
): asserts condition {
  if (!condition) throw new Error(message)
}

function hasReason(
  candidate: NonNullable<ReturnType<typeof candidateById>>,
  code: string,
): boolean {
  return candidate.reasons.some((reason) => reason.code === code)
}

function main(): void {
  const report = auditFacetCatalog([
    fixture({
      id: 1,
      title: 'The Big Blue',
      taxonomy: 'SETTING',
      randomWeight: 1.5,
      sourceRank: 1,
      artBacked: true,
    }),
    fixture({
      id: 2,
      title: 'Noir (one detail wrong)',
      taxonomy: 'GENRE',
      sourceRank: 30,
    }),
    fixture({
      id: 3,
      title: 'Creative Writer',
      taxonomy: 'PERSONALITY',
      artBacked: true,
    }),
    fixture({
      id: 4,
      title: '4k render',
      taxonomy: 'PROMPT_ENHANCEMENT',
      description: null,
    }),
    fixture({
      id: 5,
      title: 'Optimistic',
      taxonomy: 'PERSONALITY',
    }),
    fixture({
      id: 6,
      title: 'Optimistic',
      taxonomy: 'PERSONALITY',
      artBacked: true,
    }),
    fixture({
      id: 7,
      title: 'Practical',
      taxonomy: 'PERSONALITY',
    }),
    fixture({
      id: 8,
      title: 'Pragmatic',
      taxonomy: 'PERSONALITY',
    }),
    fixture({
      id: 9,
      title: 'Can only sleep standing up, and only on moving trains.',
      taxonomy: 'BACKSTORY',
      sourceRank: 90,
      description: null,
    }),
    fixture({
      id: 10,
      title: 'Underwater Cathedral',
      taxonomy: 'GENRE',
      sourceRank: 30,
    }),
    fixture({
      id: 11,
      title: 'Profileless',
      taxonomy: null,
    }),
  ])

  requireCondition(
    !candidateById(report, 1),
    'A curated art-backed SETTING must not be flagged merely because its title names a place.',
  )

  const composite = candidateById(report, 2)
  requireCondition(composite, 'Composite GENRE must be audited.')
  requireCondition(
    hasReason(composite, 'parenthetical-genre'),
    'Composite GENRE must carry the parenthetical reason.',
  )
  requireCondition(
    composite.actionHint === 'decompose-recipe',
    'Composite GENRE must recommend recipe decomposition.',
  )

  const occupation = candidateById(report, 3)
  requireCondition(occupation, 'Occupation-shaped PERSONALITY must be audited.')
  requireCondition(
    occupation.actionHint === 'repair-taxonomy',
    'Occupation-shaped PERSONALITY must recommend taxonomy repair.',
  )
  requireCondition(
    occupation.preservationMode === 'preserve-row-and-art',
    'Art-backed taxonomy leak must preserve its row and art.',
  )

  const cargoCult = candidateById(report, 4)
  requireCondition(cargoCult, 'Prompt cargo cult must be audited.')
  requireCondition(
    hasReason(cargoCult, 'prompt-cargo-cult'),
    'Prompt cargo cult reason is required.',
  )
  requireCondition(
    cargoCult.actionHint === 'suppress-random',
    'Prompt cargo cult must recommend random suppression.',
  )

  const duplicateA = candidateById(report, 5)
  const duplicateB = candidateById(report, 6)
  requireCondition(
    duplicateA && duplicateB,
    'Exact duplicate titles must be audited.',
  )
  requireCondition(
    duplicateA.actionHint === 'merge-exact-synonym' &&
      duplicateB.actionHint === 'merge-exact-synonym',
    'Exact duplicate titles must recommend merge review.',
  )
  requireCondition(
    report.duplicateClusters.some(
      (cluster) =>
        cluster.normalizedTitle === 'optimistic' &&
        cluster.facetIds.includes(5) &&
        cluster.facetIds.includes(6),
    ),
    'Duplicate-title cluster must identify both Facets.',
  )

  requireCondition(
    !report.duplicateClusters.some((cluster) =>
      cluster.facetIds.some((id) => id === 7 || id === 8),
    ),
    'Near-neighbor traits must not be treated as exact aliases.',
  )

  const quirkBackstory = candidateById(report, 9)
  requireCondition(quirkBackstory, 'Quirk-shaped BACKSTORY must be audited.')
  requireCondition(
    hasReason(quirkBackstory, 'quirk-shaped-backstory'),
    'Quirk-shaped BACKSTORY must carry the taxonomy reason.',
  )

  const settingGenre = candidateById(report, 10)
  requireCondition(settingGenre, 'Setting-shaped GENRE must be audited.')
  requireCondition(
    hasReason(settingGenre, 'setting-shaped-genre'),
    'Setting-shaped GENRE must carry the taxonomy reason.',
  )

  const profileless = candidateById(report, 11)
  requireCondition(profileless, 'Profileless Facet must be audited.')
  requireCondition(
    profileless.score >= 6 && hasReason(profileless, 'missing-profile'),
    'Profileless Facet must be critical.',
  )

  process.stdout.write('Whole-catalog Facet audit behavior verified.\n')
}

main()
