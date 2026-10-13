import type { Campaign } from './types'
import { createCampaign, dayAt } from './engine'
import { starterFollowers } from './followers'

export const RELICS = {
  'eye-of-elder-crow': {
    name: 'Eye of the Elder Crow',
    unlockDay: 16,
    unlockFlag: 'relic-eye-earned',
  },
  'komodo-brass-hourglass': {
    name: "Komodo's Brass Hourglass",
    unlockDay: 11,
    unlockFlag: 'relic-hourglass-earned',
  },
} as const

export type RelicId = keyof typeof RELICS
export type RelicVault = {
  version: 1
  owned: RelicId[]
  nextLoadout: RelicId[]
  slots: 1 | 2
}

export const emptyRelicVault = (): RelicVault => ({
  version: 1,
  owned: [],
  nextLoadout: [],
  slots: 1,
})

export const relicId = (value: unknown): value is RelicId =>
  typeof value === 'string' && Object.prototype.hasOwnProperty.call(RELICS, value)

export const validateRelicVault = (value: unknown): value is RelicVault => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const vault = value as Partial<RelicVault>
  return vault.version === 1 &&
    (vault.slots === 1 || vault.slots === 2) &&
    Array.isArray(vault.owned) &&
    vault.owned.length <= Object.keys(RELICS).length &&
    vault.owned.every(relicId) &&
    new Set(vault.owned).size === vault.owned.length &&
    Array.isArray(vault.nextLoadout) &&
    vault.nextLoadout.length <= vault.slots &&
    vault.nextLoadout.every(relicId) &&
    new Set(vault.nextLoadout).size === vault.nextLoadout.length &&
    vault.nextLoadout.every((id) => vault.owned?.includes(id))
}

export const acquireRelic = (
  vault: RelicVault, campaign: Campaign, id: RelicId,
): RelicVault => {
  if (!validateRelicVault(vault) || !relicId(id))
    throw new Error('Invalid relic collection')
  const reward = RELICS[id]
  if (dayAt(campaign.hour) < reward.unlockDay ||
      !(campaign.flags ?? []).includes(reward.unlockFlag))
    throw new Error('Relic must be earned through its authored story branch')
  if (vault.owned.includes(id)) throw new Error('Already collected')
  return { ...vault, owned: [...vault.owned, id] }
}

export const chooseNextLoadout = (
  vault: RelicVault, ids: RelicId[],
): RelicVault => {
  const next = { ...vault, nextLoadout: [...ids] }
  if (!validateRelicVault(next))
    throw new Error('Only collected relics may be equipped within available slots')
  return next
}

export const earnSecondSlot = (vault: RelicVault, campaign: Campaign): RelicVault => {
  if (!validateRelicVault(vault)) throw new Error('Invalid relic collection')
  if (vault.slots === 2) return vault
  if (dayAt(campaign.hour) < 41 ||
      !(campaign.flags ?? []).includes('relic-second-slot-earned'))
    throw new Error('Second slot is a later authored reward')
  return { ...vault, slots: 2 }
}

export const equipped = (campaign: Campaign, id: RelicId): boolean =>
  (campaign.equippedRelics ?? []).includes(id)

export const decodeRelicVault = (raw: string | null): RelicVault | null => {
  if (!raw || raw.length > 10_000) return null
  try {
    const value: unknown = JSON.parse(raw)
    return validateRelicVault(value) ? value : null
  } catch {
    return null
  }
}

export const encodeRelicVault = (vault: RelicVault): string => {
  if (!validateRelicVault(vault)) throw new Error('Invalid relic vault')
  return JSON.stringify(vault)
}

export const revealFalseReport = (
  campaign: Campaign, reportIsTrue: boolean,
): boolean => equipped(campaign, 'eye-of-elder-crow') && !reportIsTrue

export const startWithRelics = (seed: number, vault: RelicVault): Campaign => {
  if (!validateRelicVault(vault)) throw new Error('Invalid relic collection')
  return {
    ...createCampaign(seed, starterFollowers()),
    equippedRelics: [...vault.nextLoadout],
    relicUses: {},
  }
}
