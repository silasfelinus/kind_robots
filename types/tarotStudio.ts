import type { TarotCardStatus } from '~/utils/tarotStudio'

export type TarotCardRecord = {
  id: number
  deckId: number
  key: string
  title: string
  arcana: string
  suit: string | null
  rank: string
  ordinal: number
  oracleId: string
  prompt: string
  checkpoint: string | null
  loras: string
  status: TarotCardStatus
  upright: string
  reversed: string
  notes: string
  artJobId: number | null
  artImageId: number | null
  imageUrl: string | null
  selectedArtId: number | null
  updatedAt: string
}

export type TarotDesignStatus = 'EXPLORING' | 'APPROVED' | 'ARCHIVED'

export type TarotDesignRecord = {
  id: number
  deckId: number
  key: string
  title: string
  stylePrompt: string
  backPrompt: string
  engine: string
  checkpoint: string | null
  loras: string
  status: TarotDesignStatus
  notes: string
  updatedAt: string
}

export type TarotArtStatus =
  'PENDING' | 'QUEUED' | 'RENDERED' | 'FAILED' | 'REJECTED'

export type TarotArtRecord = {
  id: number
  deckId: number
  designId: number | null
  cardId: number | null
  side: 'FACE' | 'BACK'
  purpose: 'SAMPLE' | 'SET' | 'REVISION'
  prompt: string
  engine: string
  checkpoint: string | null
  loras: string
  width: number
  height: number
  status: TarotArtStatus
  error: string | null
  artJobId: number | null
  artImageId: number | null
  createdAt: string
  updatedAt: string
}

export type TarotArtEnqueueBody = Record<string, unknown> & {
  requestKey: string
}

export type TarotDesignEdit = Pick<
  TarotDesignRecord,
  | 'title'
  | 'stylePrompt'
  | 'backPrompt'
  | 'engine'
  | 'checkpoint'
  | 'loras'
  | 'notes'
>

export type TarotDeckRecord = {
  id: number
  slug: string
  title: string
  description: string
  styleBible: string
  defaultEngine: string
  defaultCheckpoint: string | null
  defaultLoras: string
  backPrompt: string
  printStatus: string
  isPublic: boolean
  approvedDesignId: number | null
  backArtId: number | null
  updatedAt: string
  Cards: TarotCardRecord[]
  Designs: TarotDesignRecord[]
  Art: TarotArtRecord[]
}

export type TarotCardEdit = Pick<
  TarotCardRecord,
  | 'title'
  | 'prompt'
  | 'checkpoint'
  | 'loras'
  | 'upright'
  | 'reversed'
  | 'notes'
  | 'status'
>

export type TarotDeckEdit = Pick<
  TarotDeckRecord,
  | 'title'
  | 'description'
  | 'styleBible'
  | 'defaultEngine'
  | 'defaultCheckpoint'
  | 'defaultLoras'
  | 'backPrompt'
> & { isPublic?: boolean }
