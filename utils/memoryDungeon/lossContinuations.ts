/**
 * Defeat is a continuation, not an erased run. Keep the destination and
 * remembered companion consequence identical for live timers and reloads.
 * No extra mutable flags are needed: the choices already live in Briar saves.
 */
export interface BriarLossContext {
  sceneChoices: Readonly<Record<string, string>>
  house?: { combatOrigin: string | null } | null
}

export type BriarLossKind = 'combat' | 'chamber'

function rememberedConsequence(
  choices: BriarLossContext['sceneChoices'],
): string {
  if (choices['4,3'] === 'plan')
    return "Oren's inked detour still marks a way forward; the unanswered danger waits."
  if (choices['4,3'] === 'load')
    return 'The parcels you sorted for Oren are safe; the room's bargain remains unanswered.'
  if (choices['2,4'] === 'lend')
    return 'The night courier still has your lantern; the letter remains undelivered.'
  if (choices['2,4'] === 'copy')
    return 'Your copied impossible address survives; its recipient still awaits the letter.'
  return 'Your map and discoveries survive; the room keeps its unanswered question.'
}

export function briarLossContinuation(
  progress: BriarLossContext,
  kind: BriarLossKind,
  lastHeart: boolean,
  enemyName = 'The challenger',
): string {
  const inHouse = Boolean(progress.house?.combatOrigin)
  let consequence: string
  if (inHouse) {
    consequence =
      kind === 'combat'
        ? `${enemyName} wins. One heart lost; you recover in the House's quiet bedchamber, keeping your discoveries.`
        : "The room overwhelms you. You recover in the House's quiet bedchamber, keeping your discoveries."
  } else if (lastHeart) {
    consequence =
      kind === 'combat'
        ? 'The fight overwhelms you. You retreat to Briar Camp, keeping your map and discoveries.'
        : 'The room overwhelms you. You retreat to Briar Camp, keeping your map and discoveries.'
  } else {
    consequence = `${enemyName} drives you back to the trail. One heart lost; the room waits for a rematch.`
  }
  return `${consequence} ${rememberedConsequence(progress.sceneChoices)}`
}
