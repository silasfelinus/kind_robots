// Cthulhuquarium's collectible design entity is Monster. The portable YAML
// bible remains the authoring canon until t-008 seeds/upserts those records into
// Prisma; the Fish aliases below are compatibility names for the first curation
// UI slice and should not be used as a separate domain model.
export type CthulhuquariumMonster = {
  slug: string
  name: string
  species: string
  rarity: string
  fieldNote: string
  artPrompt: string
  sourcePath: string
  sourceUrl: string
}

/** @deprecated Use CthulhuquariumMonster. */
export type CthulhuquariumFish = CthulhuquariumMonster

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

export type CthulhuquariumCurationMonster = CthulhuquariumMonster & {
  curation: CthulhuquariumCurationEntry
}

/** @deprecated Use CthulhuquariumCurationMonster. */
export type CthulhuquariumCurationFish = CthulhuquariumCurationMonster

export type CthulhuquariumCurationData = {
  // `fish` is the compatibility payload name used by this first UI slice.
  // `monsters` is reserved for the t-008-backed API once YAML rows are seeded
  // into Prisma Monster records; both represent the same domain entity.
  monsters?: CthulhuquariumCurationMonster[]
  fish: CthulhuquariumCurationMonster[]
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
