/**
 * Norb's contact jokes (conductor monstress-convention/t-019). Norb is a
 * living germophobe: he never takes, uses, photographs or combines anything,
 * and the jokes where something unclean comes near him make him recoil on
 * stage. Kept free of rig imports so the rig's gesture rules can use it.
 */
import type { CaseAction, CaseState } from '../monstressConvention/prologue'

/** What Norb refuses to do with his own hands. */
export const NORB_REFUSES = ['take', 'use', 'photograph', 'combine'] as const

/**
 * Lines where Iris brings something unclean near Norb: the ice machine
 * ("wash your hands", "Do NOT bring that arm anywhere near me"), the motel
 * bed, Marta's forty-year key, the unsterilized lamp and the neck plaster.
 */
export const CONTACT_JOKES = [
  'use:ice-machine',
  'use:bedspread',
  'use:marta',
  'talk:nico',
  'ask:nico:iris-neck',
] as const

export type ContactAction = Pick<CaseAction, 'verb'> &
  Partial<Pick<CaseAction, 'target' | 'item' | 'topic'>>

function jokeKey(action: ContactAction): string {
  if (action.verb === 'ask')
    return `ask:${action.target ?? ''}:${action.topic ?? ''}`
  return `${action.verb}:${action.target ?? ''}`
}

/**
 * True when the action is one of Norb's contact jokes: Norb asked to handle
 * anything (always refused), anything offered to Norb, or one of the
 * listed lines actually played.
 */
export function isContactJoke(
  action: ContactAction | null,
  previous: CaseState,
  next: CaseState,
): boolean {
  if (!action) return false
  if (previous.actor === 'nico')
    return (
      !!action.item || (NORB_REFUSES as readonly string[]).includes(action.verb)
    )
  if (action.item && action.target === 'nico') return true
  if (next === previous) return false
  return (CONTACT_JOKES as readonly string[]).includes(jokeKey(action))
}
