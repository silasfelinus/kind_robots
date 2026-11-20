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
  updatedAt: string
}

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
  updatedAt: string
  Cards: TarotCardRecord[]
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
>
