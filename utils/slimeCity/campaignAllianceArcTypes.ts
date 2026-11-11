/** Authored consequences for chapters 2–5 of a directed two-crew Journey. */
export interface AllianceLaterBeat {
  crisis: string
  protect: readonly [label: string, consequence: string]
  gamble: readonly [label: string, consequence: string]
}
export interface AllianceLaterFinale {
  title: string
  protect: string
  gamble: string
}
export interface AllianceLaterArc {
  beats: readonly AllianceLaterBeat[]
  finale: AllianceLaterFinale
}
export const beat = (
  crisis: string,
  safeLabel: string,
  safeResult: string,
  riskLabel: string,
  riskResult: string,
): AllianceLaterBeat => ({
  crisis,
  protect: [safeLabel, safeResult],
  gamble: [riskLabel, riskResult],
})
export const end = (
  title: string,
  protect: string,
  gamble: string,
): AllianceLaterFinale => ({ title, protect, gamble })
export const arc = (
  beats: readonly AllianceLaterBeat[],
  finale: AllianceLaterFinale,
): AllianceLaterArc => ({ beats, finale })
