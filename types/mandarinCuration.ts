export type MandarinCurationSnapshot = {
  cardKey: string
  simplified: string
  traditional: string
  pinyin: string
  meaning: string
  meanings: string[]
  usageNote: string
  categories: string[]
  hskLevel: number | null
  frequency: number | null
  sourceLabel: string
  sourceVersion: string
}

export type MandarinCurationChange = {
  id: number
  createdAt: string
  adminUserId: number
  note: string
  before: MandarinCurationSnapshot
  after: MandarinCurationSnapshot
}

export type MandarinCurationRow = {
  cardKey: string
  source: MandarinCurationSnapshot
  effective: MandarinCurationSnapshot
  hasOverride: boolean
  overrideUpdatedAt: string | null
  updatedByUserId: number | null
  overriddenFields: string[]
  audioReady: boolean
  changes: MandarinCurationChange[]
}

export type MandarinCurationPayload = {
  rows: MandarinCurationRow[]
  categories: string[]
  editableCategories: string[]
  stats: {
    cards: number
    overridden: number
    withAudio: number
    hsk1: number
    hsk2: number
  }
}

export type MandarinCurationUpdate = {
  cardKey: string
  traditional: string
  pinyin: string
  meaning: string
  meanings: string[]
  usageNote: string
  categories: string[]
  note?: string
}
