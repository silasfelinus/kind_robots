import {
  DECKS,
  JOB_TITLES,
  MUTATIONS,
  SOCIETIES,
  stationArt,
} from './rules'
import {
  artUnlockKeysForReceipt,
  type RewardArchive,
} from './rewards'

export type ArtDiscoveryEntry = {
  key: string
  title: string
  category: string
  src: string
  prompt: string
  unlocked: boolean
  reviewed: boolean
}

const awaitingClassicArtReview = new Set([
  'mutations:four-second-precognition',
  'mutations:empathic-static',
  'mutations:eyes-in-the-back-of-your-head',
])

export function artDiscovery(archive: RewardArchive): ArtDiscoveryEntry[] {
  const unlocked = new Set([
    ...(archive.artUnlocked ?? []),
    ...archive.runs.flatMap(artUnlockKeysForReceipt),
  ])
  const jobs = JOB_TITLES.map((job) => ({
    key: `jobs:${job.id}`,
    title: job.title,
    category: 'Employee badge',
    src: stationArt('jobs', job.id),
    prompt:
      DECKS.jobTitles.find((entry) => entry.id === job.id)?.art_prompt ?? '',
    unlocked: unlocked.has(`jobs:${job.id}`),
    reviewed: true,
  }))
  const societies = SOCIETIES.map((society) => ({
    key: `societies:${society.id}`,
    title: society.title,
    category: 'Society file',
    src: stationArt('societies', society.id),
    prompt: society.art_prompt,
    unlocked: unlocked.has(`societies:${society.id}`),
    reviewed: true,
  }))
  const mutations = MUTATIONS.map((mutation) => ({
    key: `mutations:${mutation.id}`,
    title: mutation.title,
    category: 'Mutation record',
    src: stationArt('mutations', mutation.id),
    prompt: mutation.art_prompt,
    unlocked: unlocked.has(`mutations:${mutation.id}`),
    reviewed: !awaitingClassicArtReview.has(`mutations:${mutation.id}`),
  }))
  return [...jobs, ...societies, ...mutations]
}
