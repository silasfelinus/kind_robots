/**
 * Defeat is a continuation, not an erased run. Keep the destination and
 * remembered companion consequence identical for live timers and reloads.
 * No extra mutable flags are needed: the choices already live in Briar saves.
 */
export interface BriarLossContext {
  sceneChoices: Readonly<Record<string, string>>
  house?: {
    combatOrigin: string | null
    decisions?: Readonly<Record<string, string>>
  } | null
}

export type BriarLossKind = 'combat' | 'chamber'

function rememberedConsequence(
  choices: BriarLossContext['sceneChoices'],
): string {
  if (choices['3,5'] === 'light')
    return "Pip's freed moth is safe; the stump still holds the story it borrowed."
  if (choices['3,5'] === 'listen')
    return "Pip kept the stump's account; the Knight's apology still needs a witness."
  if (choices['4,4'] === 'escort')
    return "Scylla's escort order stands; the princesses cannot guard every road."
  if (choices['4,4'] === 'question')
    return "Char's lantern lights your retreat; the twins' riddle remains unsolved."
  if (choices['4,2'] === 'ledger')
    return "Mosswick's tomorrow-dated warning survives; its unnamed debtor is still unknown."
  if (choices['4,2'] === 'promise')
    return 'Mosswick still expects your true account; his advance cannot settle the debt.'
  if (choices['3,4'] === 'challenge')
    return 'The toll receipt names another payer; the missing bridge is still unbuilt.'
  if (choices['3,4'] === 'help')
    return 'The collector has your drawn bridge; travelers still need a real crossing.'
  if (choices['4,3'] === 'plan')
    return "Oren's inked detour still marks a way forward; the unanswered danger waits."
  if (choices['4,3'] === 'load')
    return "The parcels you sorted for Oren are safe; the room's bargain remains unanswered."
  if (choices['2,4'] === 'lend')
    return 'The night courier still has your lantern; the letter remains undelivered.'
  if (choices['2,4'] === 'copy')
    return 'Your copied impossible address survives; its recipient still awaits the letter.'
  return 'Your map and discoveries survive; the room keeps its unanswered question.'
}

/** A lost fight can change the route, but cannot erase the choices that made it
 * worth taking. Prefer the most recent earned House dilemma over older Briar
 * memories; invalid decision IDs never fabricate a companion's help. */
function houseLossConsequence(
  decisions: Readonly<Record<string, string>>,
): string | null {
  if (decisions['HD-26'] === 'testify')
    return "The Wolf-Mother's signed petition survives; the food you did not bring is still needed."
  if (decisions['HD-26'] === 'shelter')
    return "The Wolf-Mother's families have food; their unsigned petition still awaits a hearing."
  if (decisions['HD-10'] === 'manifest')
    return 'Scylla kept the route manifest; the stranded maid still needs help down the service stair.'
  if (decisions['HD-10'] === 'improvise')
    return 'Char and Scylla rescued the maid; their unmarked route still needs a reliable map.'
  if (decisions['HD-09'] === 'parley')
    return 'The Hearth-Guard remembers your promise to cool the coals; its warning rhythm remains unknown.'
  if (decisions['HD-09'] === 'study')
    return "You remember the Hearth-Guard's warning rhythm; the coals still need a safe keeper."
  return null
}

export function briarLossContinuation(
  progress: BriarLossContext,
  kind: BriarLossKind,
  lastHeart: boolean,
  enemyName = 'The challenger',
): string {
  const inHouse = Boolean(progress.house?.combatOrigin)
  const opponent = enemyName.length <= 32 ? enemyName : 'The challenger'
  let consequence: string
  if (inHouse) {
    consequence =
      kind === 'combat'
        ? `${opponent} wins. One heart lost; you recover in the House's quiet bedchamber, keeping your discoveries.`
        : "The room overwhelms you. You recover in the House's quiet bedchamber, keeping your discoveries."
  } else if (lastHeart) {
    consequence =
      kind === 'combat'
        ? 'The fight overwhelms you. You retreat to Briar Camp, keeping your map and discoveries.'
        : 'The room overwhelms you. You retreat to Briar Camp, keeping your map and discoveries.'
  } else {
    consequence = `${opponent} drives you back to the trail. One heart lost; the room waits for a rematch.`
  }
  const houseMemory =
    inHouse && progress.house?.decisions
      ? houseLossConsequence(progress.house.decisions)
      : null
  return `${consequence} ${houseMemory ?? rememberedConsequence(progress.sceneChoices)}`
}
