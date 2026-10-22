import type { CompanionId, Fate } from './content'
import type { RunState } from './engine'
import { travelParty } from './engine'

/**
 * A shared-future paragraph for an explicitly co-traveling pair.
 * It enriches the existing 56 collectible signatures without inventing new
 * illustrated ending slots while the art-standard task is separately owned.
 * Meeting someone, or once following someone, is not enough.
 */
const PAIR_FUTURES: Record<string, Record<Fate, string>> = {
  'kit|mara': {
    hope: 'Kit insists the workshop hold public performances. Mara insists the apprentices are paid before anyone books a stage. After three impassioned committee meetings, the two of them realize these are compatible demands. Ten years later, their cooperative keeps the books on an open shelf and the show lights on only when the crew agrees.',
    dark: 'The town sells Kit\'s parade and Mara\'s original designs to the same sponsor. Neither of them agrees to perform for it. They keep making small things for each other and their neighbors, but the bigger workshop never finds a door it can afford.',
  },
  'kit|juniper': {
    hope: 'Juniper wants the old trees left standing; Kit needs room for a workshop where nobody can afford a new building. They turn a disused loading shed into a training space, and the yearly forest pageant becomes a fundraiser the volunteers actually control. Juniper says the seedlings are the real audience. Kit counts them anyway.',
    dark: 'A spectacular one-time forest festival raises enough money for a bright banner and not enough to protect the grove. Kit stops promising spectacles will solve everything; Juniper learns that shutting out every visitor leaves the caretakers alone. They keep exchanging difficult letters.',
  },
  'cedar|kit': {
    hope: 'Cedar designs a repairable power system for Kit\'s impossible machines. Kit demands that every apprentice know how to mend it without him. They argue through the drawings and publish the plans anyway. In ten years the county has an annual race of machines whose inventors expect to be outgrown.',
    dark: 'The prototype wins an award and its sponsor patents the part everyone thought was communal. Cedar tries to reverse the contract; Kit teaches people to build a different machine. They remain allies, even after learning that not every brilliant idea should be pitched to a funder.',
  },
  'cedar|juniper': {
    hope: 'Cedar wants sensors on the creeks; Juniper demands that creek workers own their data. They build a small monitoring cooperative with an agreement anyone can read. The system is imperfect, the batteries occasionally fail, and for the first time the warnings belong to the people who need them.',
    dark: 'Cedar\'s early warning network predicts every flood, then a distant contractor starts selling the measurements back to the valley. Juniper refuses to call the forest a data set. Cedar refuses to abandon the people who still depend on his radios. Their argument becomes the last truly public meeting in town.',
  },
  'cedar|mara': {
    hope: 'Mara teaches Cedar that a symbol can belong to its maker even when a machine can copy it; Cedar makes the ownership records legible to artists who do not want to hire a lawyer. Their public workshop teaches people to protect both their work and one another. Neither of them calls this a revolution. They are too busy opening the doors.',
    dark: 'A platform offers Mara exposure and Cedar a contract. They read the fine print too late to save the first project, then publish a warning with their own names on it. Ten years on, the warning still circulates and the platform still advertises. Both facts matter.',
  },
  'juniper|mara': {
    hope: 'Mara insists that local artists be paid to tell the new grove\'s story. Juniper insists the grove must never become a private mural with a locked gate. They build an open trail with art the makers can choose to change, and they train the next caretakers before either woman gets sentimental.',
    dark: 'The forest charity loves Mara\'s paintings and uses Juniper\'s conservation work in its brochures, but locks the public out of its decisions. Mara signs her work elsewhere. Juniper stays to watch the trees, furious and still present. They meet for coffee when they can, and refuse to pretend they won.',
  },
}

export function ensembleFuture(state: RunState, fate: Fate): string | null {
  const party = travelParty(state)
  if (party.length < 2) return null
  const pair = [...party].sort() as CompanionId[]
  return PAIR_FUTURES[pair.join('|')]?.[fate] ?? null
}
