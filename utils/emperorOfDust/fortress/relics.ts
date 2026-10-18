import type { FortressRun } from './types'

// Items of Power belong to the player, not the run: owned relics survive
// new runs, rewinds and reloads. The stored vault shape is unchanged from
// v0.2, so relics a player already earned carry over.
export const RELICS = {
  'eye-of-elder-crow': {
    name: 'Eye of the Elder Crow',
    description: 'Marks the false report in Young Komodo’s morning briefing.',
    unlockFlag: 'relic-eye-earned',
  },
  'komodo-brass-hourglass': {
    name: 'Komodo’s Brass Hourglass',
    description: 'Once per act, one quest comes home a day early.',
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

export const isRelicId = (value: unknown): value is RelicId =>
  typeof value === 'string' && Object.hasOwn(RELICS, value)

export const validateRelicVault = (value: unknown): value is RelicVault => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const vault = value as Partial<RelicVault>
  return (
    vault.version === 1 &&
    (vault.slots === 1 || vault.slots === 2) &&
    Array.isArray(vault.owned) &&
    vault.owned.every(isRelicId) &&
    new Set(vault.owned).size === vault.owned.length &&
    Array.isArray(vault.nextLoadout) &&
    vault.nextLoadout.length <= vault.slots &&
    vault.nextLoadout.every((id) => vault.owned?.includes(id)) &&
    new Set(vault.nextLoadout).size === vault.nextLoadout.length
  )
}

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

/** Relics whose story flag this run has earned but the vault lacks. */
export const claimableRelics = (
  run: FortressRun,
  vault: RelicVault,
): RelicId[] =>
  (Object.keys(RELICS) as RelicId[]).filter(
    (id) =>
      run.flags.includes(RELICS[id].unlockFlag) && !vault.owned.includes(id),
  )

export const acquireRelic = (
  vault: RelicVault,
  run: FortressRun,
  id: RelicId,
): RelicVault => {
  if (!claimableRelics(run, vault).includes(id))
    throw new Error('Relics are earned through their story branch')
  return { ...vault, owned: [...vault.owned, id] }
}

export const chooseNextLoadout = (
  vault: RelicVault,
  ids: RelicId[],
): RelicVault => {
  const next = { ...vault, nextLoadout: [...ids] }
  if (!validateRelicVault(next))
    throw new Error('Only collected relics fit, within the available slots')
  return next
}

export const eyeReveals = (run: FortressRun, reportIsTrue: boolean): boolean =>
  run.equippedRelics.includes('eye-of-elder-crow') && !reportIsTrue
