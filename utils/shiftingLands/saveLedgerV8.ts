import { sameReplay } from './saveLedger'
import {
  newJourneyLedgerV7,
  stepJourneyLedgerV7,
  type JourneyActionV7,
  type JourneyLedgerV7,
} from './saveLedgerV7'
import { TRIAL_RULES_V7 } from './trialRulesV7'
import { trialForLandV8, TRIAL_RULES_V8 } from './trialRulesV8'

export type JourneyLedgerV8 = Omit<
  JourneyLedgerV7,
  'version' | 'trialRulesVersion'
> & {
  version: 8
  trialRulesVersion: number
}

// V7's action history remains untouched. V8 is a distinct replay domain;
// its optional resolver only replaces the odds of newly attempted trials.
export function newJourneyLedgerV8(seed: number): JourneyLedgerV8 {
  return {
    ...newJourneyLedgerV7(seed),
    version: 8,
    trialRulesVersion: TRIAL_RULES_V8,
  }
}

export function stepJourneyLedgerV8(
  ledger: JourneyLedgerV8,
  action: JourneyActionV7,
): JourneyLedgerV8 {
  const legacy: JourneyLedgerV7 = {
    ...ledger,
    version: 7,
    trialRulesVersion: TRIAL_RULES_V7,
  }
  const next = stepJourneyLedgerV7(legacy, action, trialForLandV8)
  if (next === legacy) return ledger
  return {
    ...next,
    version: 8,
    trialRulesVersion: TRIAL_RULES_V8,
  }
}

export function restoreJourneyLedgerV8(value: unknown): JourneyLedgerV8 | null {
  if (!value || typeof value !== 'object') return null
  const saved = value as Partial<JourneyLedgerV8>
  if (
    typeof saved.seed !== 'number' ||
    !Number.isSafeInteger(saved.seed) ||
    (saved.seed ?? 0) < 1 ||
    (saved.seed ?? 0) > 0xffffffff
  )
    return null
  const fresh = newJourneyLedgerV8(saved.seed)
  if (
    saved.version !== 8 ||
    saved.trialRulesVersion !== TRIAL_RULES_V8 ||
    saved.worldSha !== fresh.worldSha ||
    saved.homesteadSha !== fresh.homesteadSha ||
    saved.trialSha !== fresh.trialSha ||
    saved.deckVersion !== fresh.deckVersion ||
    JSON.stringify(saved.laterSources) !== JSON.stringify(fresh.laterSources) ||
    !Array.isArray(saved.actions) ||
    saved.actions.length > 1200 ||
    !Array.isArray(saved.prepared) ||
    !Array.isArray(saved.usedRewards) ||
    !Array.isArray(saved.trialResults) ||
    !saved.current
  )
    return null
  try {
    if (JSON.stringify(value).length > 700_000) return null
    let rebuilt = fresh
    for (const action of saved.actions) {
      const next = stepJourneyLedgerV8(rebuilt, action)
      if (next === rebuilt) return null
      rebuilt = next
    }
    if (
      !sameReplay(rebuilt.current, saved.current) ||
      !sameReplay(rebuilt.trialResults, saved.trialResults) ||
      JSON.stringify(rebuilt.usedRewards) !==
        JSON.stringify(saved.usedRewards) ||
      JSON.stringify(rebuilt.prepared) !== JSON.stringify(saved.prepared)
    )
      return null
    return rebuilt
  } catch {
    return null
  }
}
