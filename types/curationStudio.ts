export type CthulhuquariumFish = {
  slug: string
  name: string
  species: string
  rarity: string
  fieldNote: string
  artPrompt: string
  sourcePath: string
  sourceUrl: string
}

export type CurationInspiration = {
  id: string
  label: string
  url: string
}

export type CthulhuquariumCurationEntry = {
  promptOverride: string
  inspirations: CurationInspiration[]
  candidateImageIds: number[]
  selectedDesignImageId: number | null
  spriteImageIds: number[]
  updatedAt: string | null
}

export type CthulhuquariumCurationFish = CthulhuquariumFish & {
  curation: CthulhuquariumCurationEntry
}

export type CthulhuquariumCurationData = {
  fish: CthulhuquariumCurationFish[]
  sourceRepo: string
  sourceRef: string
  curationPath: string
  fetchedAt: string
}

export type CthulhuquariumCurationUpdate = {
  slug: string
  promptOverride?: string
  inspirations?: CurationInspiration[]
  candidateImageIds?: number[]
  selectedDesignImageId?: number | null
  spriteImageIds?: number[]
}
