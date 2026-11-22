/**
 * Private October 29 cast ArtJob receipt snapshot from Conductor.
 * DONE is not approval or game delivery. Only admins can retrieve images.
 */
export type OctoberArtSlot = 'portrait' | 'splash' | 'encounter'
export type OctoberArtStatus = 'DONE' | 'RUNNING' | 'PENDING'
export type OctoberArtReceipt = {
  key: string
  memberKey: string
  asset: string
  slot: OctoberArtSlot
  artJobId: number
  artImageId: number | null
  status: OctoberArtStatus
}

export const OCTOBER_ART_RECEIPTS: readonly OctoberArtReceipt[] = [
  {
    key: 'pod-oct29-madame-afterparty-portrait',
    memberKey: 'pod-20261029-01',
    asset: 'cast/madame-afterparty/portrait',
    slot: 'portrait',
    artJobId: 74423,
    artImageId: 277798,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-madame-afterparty-splash',
    memberKey: 'pod-20261029-01',
    asset: 'cast/madame-afterparty/splash',
    slot: 'splash',
    artJobId: 74424,
    artImageId: 277799,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-madame-afterparty-encounter',
    memberKey: 'pod-20261029-01',
    asset: 'cast/madame-afterparty/encounter',
    slot: 'encounter',
    artJobId: 74425,
    artImageId: 277800,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-the-asterisk-portrait',
    memberKey: 'pod-20261029-02',
    asset: 'cast/the-asterisk/portrait',
    slot: 'portrait',
    artJobId: 74426,
    artImageId: 277801,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-the-asterisk-splash',
    memberKey: 'pod-20261029-02',
    asset: 'cast/the-asterisk/splash',
    slot: 'splash',
    artJobId: 74427,
    artImageId: 277802,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-the-asterisk-encounter',
    memberKey: 'pod-20261029-02',
    asset: 'cast/the-asterisk/encounter',
    slot: 'encounter',
    artJobId: 74428,
    artImageId: 277803,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-coach-event-horizon-portrait',
    memberKey: 'pod-20261029-03',
    asset: 'cast/coach-event-horizon/portrait',
    slot: 'portrait',
    artJobId: 74429,
    artImageId: 277804,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-coach-event-horizon-splash',
    memberKey: 'pod-20261029-03',
    asset: 'cast/coach-event-horizon/splash',
    slot: 'splash',
    artJobId: 74430,
    artImageId: 277805,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-coach-event-horizon-encounter',
    memberKey: 'pod-20261029-03',
    asset: 'cast/coach-event-horizon/encounter',
    slot: 'encounter',
    artJobId: 74431,
    artImageId: 277806,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-choir-of-one-portrait',
    memberKey: 'pod-20261029-04',
    asset: 'cast/choir-of-one/portrait',
    slot: 'portrait',
    artJobId: 74432,
    artImageId: 277807,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-choir-of-one-splash',
    memberKey: 'pod-20261029-04',
    asset: 'cast/choir-of-one/splash',
    slot: 'splash',
    artJobId: 74433,
    artImageId: 277808,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-choir-of-one-encounter',
    memberKey: 'pod-20261029-04',
    asset: 'cast/choir-of-one/encounter',
    slot: 'encounter',
    artJobId: 74434,
    artImageId: 277809,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-pledgebreaker-portrait',
    memberKey: 'pod-20261029-05',
    asset: 'cast/pledgebreaker/portrait',
    slot: 'portrait',
    artJobId: 74435,
    artImageId: 277810,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-pledgebreaker-splash',
    memberKey: 'pod-20261029-05',
    asset: 'cast/pledgebreaker/splash',
    slot: 'splash',
    artJobId: 74436,
    artImageId: 277811,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-pledgebreaker-encounter',
    memberKey: 'pod-20261029-05',
    asset: 'cast/pledgebreaker/encounter',
    slot: 'encounter',
    artJobId: 74437,
    artImageId: 277812,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-miss-reflection-portrait',
    memberKey: 'pod-20261029-06',
    asset: 'cast/miss-reflection/portrait',
    slot: 'portrait',
    artJobId: 74438,
    artImageId: 277813,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-miss-reflection-splash',
    memberKey: 'pod-20261029-06',
    asset: 'cast/miss-reflection/splash',
    slot: 'splash',
    artJobId: 74439,
    artImageId: 277814,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-miss-reflection-encounter',
    memberKey: 'pod-20261029-06',
    asset: 'cast/miss-reflection/encounter',
    slot: 'encounter',
    artJobId: 74440,
    artImageId: 277815,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-standing-ovation-portrait',
    memberKey: 'pod-20261029-07',
    asset: 'cast/standing-ovation/portrait',
    slot: 'portrait',
    artJobId: 74441,
    artImageId: 277816,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-standing-ovation-splash',
    memberKey: 'pod-20261029-07',
    asset: 'cast/standing-ovation/splash',
    slot: 'splash',
    artJobId: 74442,
    artImageId: 277817,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-standing-ovation-encounter',
    memberKey: 'pod-20261029-07',
    asset: 'cast/standing-ovation/encounter',
    slot: 'encounter',
    artJobId: 74443,
    artImageId: 277818,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-lady-hemline-portrait',
    memberKey: 'pod-20261029-08',
    asset: 'cast/lady-hemline/portrait',
    slot: 'portrait',
    artJobId: 74444,
    artImageId: 277819,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-lady-hemline-splash',
    memberKey: 'pod-20261029-08',
    asset: 'cast/lady-hemline/splash',
    slot: 'splash',
    artJobId: 74445,
    artImageId: 277820,
    status: 'DONE',
  },
  {
    key: 'pod-oct29-lady-hemline-encounter',
    memberKey: 'pod-20261029-08',
    asset: 'cast/lady-hemline/encounter',
    slot: 'encounter',
    artJobId: 74446,
    artImageId: 277821,
    status: 'DONE',
  },
]

export function octoberArtReceipt(
  memberKey: string,
  slot: OctoberArtSlot,
): OctoberArtReceipt | null {
  return (
    OCTOBER_ART_RECEIPTS.find(
      (receipt) => receipt.memberKey === memberKey && receipt.slot === slot,
    ) ?? null
  )
}
