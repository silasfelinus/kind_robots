/** Player identity is role-play only; identities never alter the odds or gate endings. */
export const PLAYER_AVATARS = [
  { id: 'glitter', emoji: '🧑‍🎤', label: 'Glitter rebel' },
  { id: 'maker', emoji: '👩🏽‍🔧', label: 'Workshop wizard' },
  { id: 'wanderer', emoji: '🧔🏾', label: 'Roadside philosopher' },
  { id: 'elder', emoji: '👵🏽', label: 'Legendary elder' },
  { id: 'artist', emoji: '👨🏻‍🎨', label: 'Midnight artist' },
  { id: 'star', emoji: '🧑🏿‍🚀', label: 'Strange visitor' },
  { id: 'naturalist', emoji: '👩🏼‍🌾', label: 'Forest regular' },
  { id: 'punk', emoji: '🧑🏾‍🎤', label: 'Punk poet' },
  { id: 'scholar', emoji: '👩🏿‍💻', label: 'Curious scholar' },
  { id: 'traveler', emoji: '🧑🏼‍🦽', label: 'Unstoppable traveler' },
  { id: 'sage', emoji: '👴🏻', label: 'Old road sage' },
  { id: 'dreamer', emoji: '👩🏻‍🎨', label: 'Dream painter' },
] as const

export const PLAYER_PERSONALITIES = [
  { id: 'curious', label: 'Curious', detail: 'Every mystery deserves another question.' },
  { id: 'skeptical', label: 'Skeptical', detail: 'Evidence before epiphanies.' },
  { id: 'reckless', label: 'Reckless', detail: 'A splendid idea, provided you survive it.' },
  { id: 'gentle', label: 'Tenderhearted', detail: 'Other people are never just clues.' },
  { id: 'chaotic', label: 'Beautifully strange', detail: 'The oddest option is usually worth hearing.' },
  { id: 'pragmatic', label: 'Practical', detail: 'Bring a flashlight. And a spare.' },
] as const

export type PlayerIdentity = {
  playerName?: string
  avatarId?: string
  personalityId?: string
}

export function normalizePlayerIdentity(input: PlayerIdentity): Required<PlayerIdentity> {
  const name = typeof input.playerName === 'string'
    ? input.playerName.trim().replace(/\s+/g, ' ').slice(0, 32)
    : ''
  return {
    playerName: name || 'Wanderer',
    avatarId: PLAYER_AVATARS.some((avatar) => avatar.id === input.avatarId)
      ? input.avatarId!
      : 'glitter',
    personalityId: PLAYER_PERSONALITIES.some(
      (personality) => personality.id === input.personalityId,
    ) ? input.personalityId! : 'curious',
  }
}
