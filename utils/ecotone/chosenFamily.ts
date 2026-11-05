import type { CompanionId, Fate } from './content'
import { companionTimeSpent } from './companionTime'

/**
 * The chosen-family ending (weird-humboldt t-045, Silas 2026-10-20: "the
 * polyamorist utopia"). Earned, not awarded: the player must have chosen to
 * spend a free hour with at least three different guides AND finished the
 * weekend in a hopeful county. Declining every free hour, or a dark county,
 * never reaches it. It sits on top of the run's collectible ending (whose ID,
 * art and ledger entry are unchanged), so every existing ending stays exactly
 * as reachable as before.
 *
 * Tone: found family first. Romance is present only as one kind of love among
 * several, always consensual and spoken aloud, never described. Nobody is
 * ranked, nobody is jealous, and Cedar's parents are still together.
 */
export const CHOSEN_FAMILY_MIN_GUIDES = 3

export const CHOSEN_FAMILY_TITLE = 'The Long Table'

/** One future line per guide, chosen by how you spent your hour with them. */
const MEMBER_LINES: Record<string, string> = {
  bond_mara_time_line:
    'Mara keeps the studio downstairs and a photo of your first wobbly grapefruit line framed above the sink, labeled EVERYBODY STARTS HERE.',
  bond_mara_time_walkin:
    'Mara keeps the studio downstairs. The nervous kid from that first consult is her apprentice now, with their own lettering and their own clients.',
  bond_kit_time_cascade:
    'Kit has turned the garage into a rehearsal floor, and every warm-up still counts your forty-one drops so new jugglers know the number to beat.',
  bond_kit_time_roadie:
    'Kit has turned the garage into a rehearsal floor for the kids’ club, whose budget outgrew the napkin years ago and now fills an actual binder.',
  bond_juniper_time_listen:
    'Juniper sleeps out under the big redwood most summer nights and comes in for breakfast with needles in her hair, reporting what the tree is thinking now.',
  bond_juniper_time_trail:
    'Juniper leads the Sunday walk with the retired schoolteacher, her grandson and by now half the street. The raccoon still gets its cut.',
  bond_cedar_time_radio:
    'Cedar keeps the CB base station in the kitchen. Every Sunday his folks drive up the hill to argue about salt at your table, still married, still holding hands under it.',
  bond_cedar_time_stars:
    'Cedar bolted a telescope to the roof. Every Sunday his folks drive up for supper, still married and still arguing, and share one plate on the porch while he names the satellites.',
}

export type ChosenFamilyEnding = {
  title: string
  members: CompanionId[]
  paragraphs: string[]
}

function listNames(names: string[]): string {
  if (names.length <= 2) return names.join(' and ')
  return `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

export function chosenFamilyEnding(
  run: { flags: readonly string[]; meetingOrder: readonly CompanionId[] },
  fate: Fate,
  nameOf: (id: CompanionId) => string,
): ChosenFamilyEnding | null {
  if (fate !== 'hope') return null
  const members = companionTimeSpent(run.flags, run.meetingOrder)
  if (members.length < CHOSEN_FAMILY_MIN_GUIDES) return null
  const lines = members.flatMap((id) => {
    const flag = run.flags.find(
      (candidate) =>
        candidate.startsWith(`bond_${id}_time_`) && MEMBER_LINES[candidate],
    )
    return flag ? [MEMBER_LINES[flag]!] : []
  })
  return {
    title: CHOSEN_FAMILY_TITLE,
    members,
    paragraphs: [
      `The weekend ends the way the good ones do: nobody quite wants to leave. You and ${listNames(members.map(nameOf))} end up at the same long table at sunrise, too tired to be anything but honest, until somebody finally says what everyone has been thinking. What if this did not have to end on Monday?`,
      lines.join(' '),
      'Ten years later there is a house at the edge of the county with too many chairs and a chore wheel nobody follows. Some of the love under that roof is romantic and some of it is the kind that fixes your brakes, and all of it was asked for out loud. Nobody ranks it. Nobody keeps score. When someone new turns up at supper, there is a chair for them before anyone asks why.',
      'Thirty years on, Humboldt is still weird, still arguing and kinder than it was. Finding your people did not turn the county into a utopia. But your people built a small one, and you left the door open.',
    ],
  }
}
