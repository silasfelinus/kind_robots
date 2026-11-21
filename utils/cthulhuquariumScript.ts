// utils/cthulhuquariumScript.ts
//
// Walking one Cthulhuquarium scene (conductor cthulhuquarium/t-103). A scene is
// a list of beats; a floor-opening scene has one beat that offers the player a
// choice of reply, and each reply is a short run of beats of its own. The
// cursor says where we are: on a main beat, or inside the reply the player
// picked. After the reply the scene carries on from the next main beat.
//
// Pure: the story helper (stores/helpers/cthulhuquariumStory.ts) owns the
// cursor and the network; this file only answers "what is showing" and
// "where next".

import type {
  CanonBeat,
  CanonChoice,
  CanonScene,
} from './cthulhuquariumCanon.generated'

export interface ScriptCursor {
  // Index into scene.beats.
  beat: number
  // The reply the player picked on that beat, or null.
  choice: string | null
  // Index into the picked reply's beats.
  reply: number
}

export const START: ScriptCursor = { beat: 0, choice: null, reply: 0 }

export function choicesOf(beat: CanonBeat | null | undefined): CanonChoice[] {
  return beat?.choices ?? []
}

function pickedChoice(
  scene: CanonScene,
  cursor: ScriptCursor,
): CanonChoice | null {
  if (!cursor.choice) return null
  return (
    choicesOf(scene.beats[cursor.beat]).find(
      (choice) => choice.id === cursor.choice,
    ) ?? null
  )
}

/** The beat on screen: a main beat, or a beat of the picked reply. */
export function currentBeat(
  scene: CanonScene | null,
  cursor: ScriptCursor,
): CanonBeat | null {
  if (!scene) return null
  const choice = pickedChoice(scene, cursor)
  if (choice) return choice.reply[cursor.reply] ?? null
  return scene.beats[cursor.beat] ?? null
}

/** True while the player owes the scene a reply before it can go on. */
export function awaitingChoice(
  scene: CanonScene | null,
  cursor: ScriptCursor,
): boolean {
  if (!scene || cursor.choice) return false
  return choicesOf(scene.beats[cursor.beat]).length > 0
}

/** True when advancing from here ends the scene. */
export function isFinalBeat(
  scene: CanonScene | null,
  cursor: ScriptCursor,
): boolean {
  if (!scene) return true
  if (awaitingChoice(scene, cursor)) return false
  const choice = pickedChoice(scene, cursor)
  if (choice && cursor.reply < choice.reply.length - 1) return false
  return cursor.beat >= scene.beats.length - 1
}

/**
 * The next cursor, or 'done' when the scene is over. A beat that is waiting for
 * a reply does not move: the player has to choose first.
 */
export function step(
  scene: CanonScene,
  cursor: ScriptCursor,
): ScriptCursor | 'done' {
  if (awaitingChoice(scene, cursor)) return cursor
  const choice = pickedChoice(scene, cursor)
  if (choice && cursor.reply < choice.reply.length - 1) {
    return { ...cursor, reply: cursor.reply + 1 }
  }
  if (cursor.beat >= scene.beats.length - 1) return 'done'
  return { beat: cursor.beat + 1, choice: null, reply: 0 }
}

/** Pick a reply on the beat that offers one; anything else is ignored. */
export function choose(
  scene: CanonScene,
  cursor: ScriptCursor,
  choiceId: string,
): ScriptCursor {
  if (!awaitingChoice(scene, cursor)) return cursor
  const exists = choicesOf(scene.beats[cursor.beat]).some(
    (choice) => choice.id === choiceId,
  )
  return exists ? { ...cursor, choice: choiceId, reply: 0 } : cursor
}

/** Every beat a scene can show, replies included (for checks and lints). */
export function everyBeat(scene: CanonScene): CanonBeat[] {
  return scene.beats.flatMap((beat) => [
    beat,
    ...choicesOf(beat).flatMap((choice) => choice.reply),
  ])
}
