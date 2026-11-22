/**
 * Original private Prom recruit portraits plus eleven DONE emotion renders.
 * DONE means ArtImage generated, not curator-approved or publicly published.
 */
export type RecruitArtSlot =
  | 'neutral'
  | 'injured'
  | 'joyous'
  | 'angry'
  | 'afraid'
export type RecruitArtReceipt = {
  artJobId: number
  artImageId: number
  slot: RecruitArtSlot
  asset: string
}

export const RECRUIT_ART_RECEIPTS: Record<
  string,
  Record<'neutral' | 'injured', RecruitArtReceipt> &
    Partial<Record<'joyous' | 'angry' | 'afraid', RecruitArtReceipt>>
> = {
  vesna: {
    joyous: {
      artJobId: 76670,
      artImageId: 278835,
      slot: 'joyous',
      asset: 'recruits/vesna-duarte/joyous',
    },
    angry: {
      artJobId: 76671,
      artImageId: 278836,
      slot: 'angry',
      asset: 'recruits/vesna-duarte/angry',
    },
    afraid: {
      artJobId: 76672,
      artImageId: 278837,
      slot: 'afraid',
      asset: 'recruits/vesna-duarte/afraid',
    },
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
    joyous: {
      artJobId: 76673,
      artImageId: 278838,
      slot: 'joyous',
      asset: 'recruits/bram-kowalczyk/joyous',
    },
    angry: {
      artJobId: 76674,
      artImageId: 278839,
      slot: 'angry',
      asset: 'recruits/bram-kowalczyk/angry',
    },
    afraid: {
      artJobId: 76675,
      artImageId: 278840,
      slot: 'afraid',
      asset: 'recruits/bram-kowalczyk/afraid',
    },
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
    joyous: {
      artJobId: 76676,
      artImageId: 278841,
      slot: 'joyous',
      asset: 'recruits/femi-ilunga/joyous',
    },
    afraid: {
      artJobId: 76677,
      artImageId: 278842,
      slot: 'afraid',
      asset: 'recruits/femi-ilunga/afraid',
    },
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
    joyous: {
      artJobId: 76678,
      artImageId: 278843,
      slot: 'joyous',
      asset: 'recruits/cyrus-adeyemi/joyous',
    },
    angry: {
      artJobId: 76679,
      artImageId: 278844,
      slot: 'angry',
      asset: 'recruits/cyrus-adeyemi/angry',
    },
    afraid: {
      artJobId: 76680,
      artImageId: 278845,
      slot: 'afraid',
      asset: 'recruits/cyrus-adeyemi/afraid',
    },
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
