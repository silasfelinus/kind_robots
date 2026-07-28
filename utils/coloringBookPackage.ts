import type {
  ColoringBookPackageBook,
  ColoringBookPackageData,
  ColoringBookPackageStatus,
  ColoringBookSourceIssues,
} from '~/types/coloringBookPackage'
import type {
  ColoringBookCoverState,
  ColoringBookProductionState,
  ColoringBookStudioBook,
} from '~/types/coloringBookStudio'
import { summarizeBookReadiness } from '@/utils/coloringBookReadiness'

function statusFor(
  sourceReady: boolean,
  layoutReady: boolean,
  exportsReady: boolean,
): ColoringBookPackageStatus {
  if (sourceReady && layoutReady && exportsReady) return 'package-ready'
  if (sourceReady && layoutReady) return 'exports-needed'
  if (sourceReady) return 'layout-needed'
  return 'source-production'
}

function nextActionFor(status: ColoringBookPackageStatus): string {
  if (status === 'package-ready') {
    return 'Review and publish the validated print package.'
  }
  if (status === 'exports-needed') {
    return 'Generate the ordered interior PDF, cover-wrap PDF, and source archive.'
  }
  if (status === 'layout-needed') {
    return 'Choose the printer and complete trim, bleed, binding, color, and template fields.'
  }
  return 'Finish and finalize missing interior pairs and cover source art.'
}

function liveSourceIssues(
  book: ColoringBookStudioBook,
  cover: ColoringBookCoverState | null,
): ColoringBookSourceIssues {
  const slots = new Map<number, number>()
  for (const proposal of book.proposals) {
    slots.set(proposal.slot, (slots.get(proposal.slot) ?? 0) + 1)
  }
  const expected = new Set(
    Array.from({ length: book.targetProposals }, (_, index) => index + 1),
  )
  const actual = new Set(slots.keys())
  const finalCoverPath = cover?.finalPath ?? null
  return {
    missingSlots: [...expected].filter((slot) => !actual.has(slot)),
    extraSlots: [...actual].filter((slot) => !expected.has(slot)),
    duplicateSlots: [...slots.entries()]
      .filter(([, count]) => count > 1)
      .map(([slot]) => slot),
    missingPrompts: book.proposals
      .filter((proposal) => !proposal.prompt.trim() && !proposal.promptRef)
      .map((proposal) => proposal.id),
    missingFinalColor: book.proposals
      .filter((proposal) => !proposal.final.color)
      .map((proposal) => proposal.id),
    missingFinalBw: book.proposals
      .filter((proposal) => !proposal.final.bw)
      .map((proposal) => proposal.id),
    missingColorFiles: [],
    missingBwFiles: [],
    coverNotFinal: !finalCoverPath && cover?.status !== 'final',
    coverFinalPath: finalCoverPath,
    coverFinalExists: Boolean(finalCoverPath),
  }
}

function reconcileBook(
  record: ColoringBookPackageBook,
  book: ColoringBookStudioBook | null,
  cover: ColoringBookCoverState | null,
  productionStates: Record<string, ColoringBookProductionState>,
  generated: boolean,
): ColoringBookPackageBook {
  if (!book) return record
  const summary = summarizeBookReadiness(book, productionStates, cover)
  const currentSourceReady = summary.interiorReady && !summary.coverPending
  const sourceReady = currentSourceReady && (!generated || record.sourceReady)
  const layoutReady = record.missingLayoutFields.length === 0
  const exportsReady =
    record.missingExportFields.length === 0 &&
    Object.values(record.exportExists).every(Boolean)
  const status = statusFor(sourceReady, layoutReady, exportsReady)

  return {
    ...record,
    status,
    nextAction: nextActionFor(status),
    sourceReady,
    layoutReady,
    exportsReady,
    packageReady: status === 'package-ready',
    interiorCount: book.proposals.length,
    expectedInteriorCount: book.targetProposals,
    finalPairCount: summary.final,
    coverStatus: cover?.status ?? record.coverStatus,
    sourceIssues: generated ? record.sourceIssues : liveSourceIssues(book, cover),
  }
}

export function reconcileColoringBookPackageData(
  data: ColoringBookPackageData,
  books: ColoringBookStudioBook[],
  covers: Record<string, ColoringBookCoverState>,
  productionStates: Record<string, ColoringBookProductionState>,
): ColoringBookPackageData {
  const studioBooks = new Map(books.map((book) => [book.slug, book]))
  const reconciledBooks = data.books.map((record) =>
    reconcileBook(
      record,
      studioBooks.get(record.slug) ?? null,
      covers[record.slug] ?? null,
      productionStates,
      data.generated,
    ),
  )

  return {
    ...data,
    books: reconciledBooks,
    allSourceReady:
      reconciledBooks.length > 0 &&
      reconciledBooks.every((book) => book.sourceReady),
    allPackageReady:
      reconciledBooks.length > 0 &&
      reconciledBooks.every((book) => book.packageReady),
  }
}

export function packageStatusTone(status: ColoringBookPackageStatus): string {
  if (status === 'package-ready') return 'badge-success'
  if (status === 'exports-needed') return 'badge-primary'
  if (status === 'layout-needed') return 'badge-warning'
  return 'badge-info'
}
