import type {
  ColoringBookPackageBook,
  ColoringBookPackageData,
  ColoringBookPackageRequirements,
  ColoringBookPackageStatus,
  ColoringBookSourceIssues,
} from '~/types/coloringBookPackage'

export const COLORING_BOOK_PRINT_PACKAGE_PATH =
  'projects/coloring-book/print-package.yaml'
export const COLORING_BOOK_PRINT_READINESS_PATH =
  'projects/coloring-book/print-readiness.yaml'

const LAYOUT_FIELDS = [
  'trim_width_inches',
  'trim_height_inches',
  'bleed_inches',
  'binding',
  'paper',
  'interior_color_mode',
  'cover_color_mode',
  'printer_template',
  'page_count_includes_blanks',
  'inside_cover_printing',
  'barcode_area_reserved',
] as const

const EXPORT_FIELDS = ['interior_pdf', 'cover_wrap_pdf', 'source_archive'] as const

function capture(text: string, pattern: RegExp, group = 1): string | undefined {
  return pattern.exec(text)?.[group]
}

function yamlValue(value: string | undefined): string | null {
  const clean = String(value ?? '').trim()
  if (!clean || clean === 'null' || clean === '~') return null
  if (clean.startsWith('"')) {
    try {
      return String(JSON.parse(clean))
    } catch {}
  }
  return clean.replace(/^['"]|['"]$/g, '')
}

function scalar(block: string, key: string, spaces: number): string | null {
  return yamlValue(
    capture(block, new RegExp(`^\\s{${spaces}}${key}:\\s*(.*?)\\s*$`, 'm')),
  )
}

function yamlNumber(value: string | null, fallback = 0): number {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : fallback
}

function yamlBoolean(value: string | null): boolean {
  return value === 'true' || value === 'yes' || value === '1'
}

function listValues(block: string, key: string, spaces: number): string[] {
  const inline = scalar(block, key, spaces)
  if (inline === '[]') return []
  if (inline?.startsWith('[') && inline.endsWith(']')) {
    return inline
      .slice(1, -1)
      .split(',')
      .map((value) => yamlValue(value) ?? '')
      .filter(Boolean)
  }
  const section = capture(
    block,
    new RegExp(
      `^\\s{${spaces}}${key}:\\s*$([\\s\\S]*?)(?=^\\s{0,${spaces}}[a-z_]+:|$(?![\\s\\S]))`,
      'm',
    ),
  )
  if (!section) return []
  return [...section.matchAll(/^\s*-\s*(.*?)\s*$/gm)]
    .map((match) => yamlValue(match?.[1]) ?? '')
    .filter(Boolean)
}

function numberList(block: string, key: string, spaces: number): number[] {
  return listValues(block, key, spaces)
    .map((value) => Number(value))
    .filter(Number.isFinite)
}

function nestedSection(block: string, key: string, spaces: number): string {
  return (
    capture(
      block,
      new RegExp(
        `^\\s{${spaces}}${key}:\\s*$([\\s\\S]*?)(?=^\\s{0,${spaces}}[a-z_]+:|$(?![\\s\\S]))`,
        'm',
      ),
    ) ?? ''
  )
}

function requirementData(content: string): ColoringBookPackageRequirements {
  const block = nestedSection(content, 'requirements', 0)
  return {
    interiorSlots: yamlNumber(scalar(block, 'interior_slots', 2), 36),
    sourceOrientation: scalar(block, 'source_orientation', 2) ?? 'portrait',
    sourceAspectRatio: scalar(block, 'source_aspect_ratio', 2) ?? '2:3',
    sourcePixelSize: scalar(block, 'source_pixel_size', 2) ?? '1024x1536',
    printInteriorVariant: scalar(block, 'print_interior_variant', 2) ?? 'bw',
    archiveColorMasters: yamlBoolean(scalar(block, 'archive_color_masters', 2)),
    finalCoverSourceRequired: yamlBoolean(
      scalar(block, 'final_cover_source_required', 2),
    ),
    sourceReadyDefinition:
      scalar(block, 'source_ready_definition', 2) ??
      'All final interior pairs and the final cover source exist.',
    packageReadyDefinition:
      scalar(block, 'package_ready_definition', 2) ??
      'Source assets, print layout, and export files are complete.',
  }
}

function emptySourceIssues(): ColoringBookSourceIssues {
  return {
    missingSlots: [],
    extraSlots: [],
    duplicateSlots: [],
    missingPrompts: [],
    missingFinalColor: [],
    missingFinalBw: [],
    missingColorFiles: [],
    missingBwFiles: [],
    coverNotFinal: true,
    coverFinalPath: null,
    coverFinalExists: false,
  }
}

function statusValue(value: string | null): ColoringBookPackageStatus {
  if (
    value === 'layout-needed' ||
    value === 'exports-needed' ||
    value === 'package-ready'
  ) {
    return value
  }
  return 'source-production'
}

function readinessBook(block: string): ColoringBookPackageBook {
  const sourceBlock = nestedSection(block, 'source_issues', 2)
  const exportBlock = nestedSection(block, 'export_exists', 2)
  return {
    order: yamlNumber(scalar(block, 'order', 0), 999),
    slug: scalar(block, 'slug', 2) ?? '',
    title: scalar(block, 'title', 2) ?? '',
    status: statusValue(scalar(block, 'status', 2)),
    nextAction: scalar(block, 'next_action', 2) ?? '',
    sourceReady: yamlBoolean(scalar(block, 'source_ready', 2)),
    layoutReady: yamlBoolean(scalar(block, 'layout_ready', 2)),
    exportsReady: yamlBoolean(scalar(block, 'exports_ready', 2)),
    packageReady: yamlBoolean(scalar(block, 'package_ready', 2)),
    interiorCount: yamlNumber(scalar(block, 'interior_count', 2)),
    expectedInteriorCount: yamlNumber(
      scalar(block, 'expected_interior_count', 2),
      36,
    ),
    finalPairCount: yamlNumber(scalar(block, 'final_pair_count', 2)),
    coverStatus: scalar(block, 'cover_status', 2) ?? 'missing',
    sourceIssues: {
      missingSlots: numberList(sourceBlock, 'missing_slots', 4),
      extraSlots: numberList(sourceBlock, 'extra_slots', 4),
      duplicateSlots: numberList(sourceBlock, 'duplicate_slots', 4),
      missingPrompts: listValues(sourceBlock, 'missing_prompts', 4),
      missingFinalColor: listValues(sourceBlock, 'missing_final_color', 4),
      missingFinalBw: listValues(sourceBlock, 'missing_final_bw', 4),
      missingColorFiles: listValues(sourceBlock, 'missing_color_files', 4),
      missingBwFiles: listValues(sourceBlock, 'missing_bw_files', 4),
      coverNotFinal: yamlBoolean(scalar(sourceBlock, 'cover_not_final', 4)),
      coverFinalPath: scalar(sourceBlock, 'cover_final_path', 4),
      coverFinalExists: yamlBoolean(
        scalar(sourceBlock, 'cover_final_exists', 4),
      ),
    },
    missingLayoutFields: listValues(block, 'missing_layout_fields', 2),
    missingExportFields: listValues(block, 'missing_export_fields', 2),
    exportExists: Object.fromEntries(
      EXPORT_FIELDS.map((field) => [
        field,
        yamlBoolean(scalar(exportBlock, field, 4)),
      ]),
    ),
    orderedInteriorManifest: scalar(block, 'ordered_interior_manifest', 2),
  }
}

function packageBook(block: string, expectedInteriors: number): ColoringBookPackageBook {
  const layoutBlock = nestedSection(block, 'layout', 2)
  const exportsBlock = nestedSection(block, 'exports', 2)
  const missingLayoutFields = LAYOUT_FIELDS.filter(
    (field) => scalar(layoutBlock, field, 4) === null,
  )
  const missingExportFields = EXPORT_FIELDS.filter(
    (field) => scalar(exportsBlock, field, 4) === null,
  )
  return {
    order: yamlNumber(scalar(block, 'order', 0), 999),
    slug: scalar(block, 'slug', 2) ?? '',
    title: scalar(block, 'title', 2) ?? '',
    status: 'source-production',
    nextAction: 'Finish and finalize missing interior pairs and cover source art.',
    sourceReady: false,
    layoutReady: missingLayoutFields.length === 0,
    exportsReady: missingExportFields.length === 0,
    packageReady: false,
    interiorCount: expectedInteriors,
    expectedInteriorCount: expectedInteriors,
    finalPairCount: 0,
    coverStatus: 'missing',
    sourceIssues: emptySourceIssues(),
    missingLayoutFields: [...missingLayoutFields],
    missingExportFields: [...missingExportFields],
    exportExists: Object.fromEntries(EXPORT_FIELDS.map((field) => [field, false])),
    orderedInteriorManifest: scalar(
      exportsBlock,
      'ordered_interior_manifest',
      4,
    ),
  }
}

function bookBlocks(content: string): string[] {
  const books = content.split(/^books:\s*$/m)[1] ?? ''
  return books
    .split(/(?=^- order:)/m)
    .filter((block) => block.startsWith('- order:'))
}

export function parseColoringBookPackageData(
  readinessContent: string | null,
  packageContent: string,
): ColoringBookPackageData {
  const requirements = requirementData(packageContent)
  const generated = Boolean(readinessContent?.trim())
  const content = generated ? String(readinessContent) : packageContent
  const books = bookBlocks(content)
    .map((block) =>
      generated
        ? readinessBook(block)
        : packageBook(block, requirements.interiorSlots),
    )
    .filter((book) => book.slug)
    .sort((left, right) => left.order - right.order)

  return {
    requirements,
    books,
    allSourceReady: generated
      ? yamlBoolean(scalar(content, 'all_source_ready', 0))
      : false,
    allPackageReady: generated
      ? yamlBoolean(scalar(content, 'all_package_ready', 0))
      : false,
    generated,
    fetchedAt: new Date().toISOString(),
  }
}
