export type ColoringBookPackageStatus =
  | 'source-production'
  | 'layout-needed'
  | 'exports-needed'
  | 'package-ready'

export type ColoringBookSourceIssues = {
  missingSlots: number[]
  extraSlots: number[]
  duplicateSlots: number[]
  missingPrompts: string[]
  missingFinalColor: string[]
  missingFinalBw: string[]
  missingColorFiles: string[]
  missingBwFiles: string[]
  coverNotFinal: boolean
  coverFinalPath: string | null
  coverFinalExists: boolean
}

export type ColoringBookPackageBook = {
  order: number
  slug: string
  title: string
  status: ColoringBookPackageStatus
  nextAction: string
  sourceReady: boolean
  layoutReady: boolean
  exportsReady: boolean
  packageReady: boolean
  interiorCount: number
  expectedInteriorCount: number
  finalPairCount: number
  coverStatus: string
  sourceIssues: ColoringBookSourceIssues
  missingLayoutFields: string[]
  missingExportFields: string[]
  exportExists: Record<string, boolean>
  orderedInteriorManifest: string | null
}

export type ColoringBookPackageRequirements = {
  interiorSlots: number
  sourceOrientation: string
  sourceAspectRatio: string
  sourcePixelSize: string
  printInteriorVariant: string
  archiveColorMasters: boolean
  finalCoverSourceRequired: boolean
  sourceReadyDefinition: string
  packageReadyDefinition: string
}

export type ColoringBookPackageData = {
  requirements: ColoringBookPackageRequirements
  books: ColoringBookPackageBook[]
  allSourceReady: boolean
  allPackageReady: boolean
  generated: boolean
  fetchedAt: string
}
