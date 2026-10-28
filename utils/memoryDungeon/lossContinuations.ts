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
    return "Oren's inked detour still marks a way forward, but the unfinished danger keeps its place on the itinerary."
  if (choices['4,3'] === 'load')
    return 'The parcels you sorted for Oren remain accounted for. The room you abandoned has no such reassuring entry.'
  if (choices['2,4'] === 'lend')
    return 'The night courier still has your lantern; the route back is darker, and the letter is not yet delivered.'
  if (choices['2,4'] === 'copy')
    return 'Your copied impossible address survives the retreat. Whoever waits there is still waiting for the letter.'
  return 'Your map and discoveries survive; the unresolved room keeps its unanswered question.'
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
        ? `${enemyName} forces you from the chamber. One heart lost; you recover in the House's quiet bedchamber without losing your discoveries.`
        : "The room overwhelms you. You recover in the House's quiet bedchamber without losing your discoveries."
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
