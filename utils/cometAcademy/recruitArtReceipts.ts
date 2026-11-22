/**
 * Eight private Prom recruit render receipts from the Conductor source ledger.
 * DONE means ArtImage generated, not curator-approved or publicly published.
 */
export type RecruitArtSlot = 'neutral' | 'injured'
export type RecruitArtReceipt = {
  artJobId: number
  artImageId: number
  slot: RecruitArtSlot
  asset: string
}

export const RECRUIT_ART_RECEIPTS: Record<
  string,
  Record<RecruitArtSlot, RecruitArtReceipt>
> = {
  vesna: {
    neutral: {
      artJobId: 74325,
      artImageId: 277331,
      slot: 'neutral',
      asset: 'recruits/vesna-duarte/neutral',
    },
    injured: {
      artJobId: 74326,
      artImageId: 277332,
      slot: 'injured',
      asset: 'recruits/vesna-duarte/injured',
    },
  },
  bram: {
    neutral: {
      artJobId: 74327,
      artImageId: 277333,
      slot: 'neutral',
      asset: 'recruits/bram-kowalczyk/neutral',
    },
    injured: {
      artJobId: 74328,
      artImageId: 277334,
      slot: 'injured',
      asset: 'recruits/bram-kowalczyk/injured',
    },
  },
  femi: {
    neutral: {
      artJobId: 74329,
      artImageId: 277335,
      slot: 'neutral',
      asset: 'recruits/femi-ilunga/neutral',
    },
    injured: {
      artJobId: 74330,
      artImageId: 277336,
      slot: 'injured',
      asset: 'recruits/femi-ilunga/injured',
    },
  },
  cyrus: {
    neutral: {
      artJobId: 74331,
      artImageId: 277337,
      slot: 'neutral',
      asset: 'recruits/cyrus-adeyemi/neutral',
    },
    injured: {
      artJobId: 74332,
      artImageId: 277338,
      slot: 'injured',
      asset: 'recruits/cyrus-adeyemi/injured',
    },
  },
}

export function recruitArtReceipt(
  id: string,
  slot: RecruitArtSlot,
): RecruitArtReceipt | null {
  return RECRUIT_ART_RECEIPTS[id]?.[slot] ?? null
}
