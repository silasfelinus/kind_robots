import type { Fate } from './content'
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
    dark: "The town sells Kit's parade and Mara's original designs to the same sponsor. Neither of them agrees to perform for it. They keep making small things for each other and their neighbors, but the bigger workshop never finds a door it can afford.",
  },
  'juniper|kit': {
    hope: 'Juniper wants the old trees left standing; Kit needs room for a workshop where nobody can afford a new building. They turn a disused loading shed into a training space, and the yearly forest pageant becomes a fundraiser the volunteers actually control. Juniper says the seedlings are the real audience. Kit counts them anyway.',
    dark: 'A spectacular one-time forest festival raises enough money for a bright banner and not enough to protect the grove. Kit stops promising spectacles will solve everything; Juniper learns that shutting out every visitor leaves the caretakers alone. They keep exchanging difficult letters.',
  },
  'cedar|kit': {
    hope: "Cedar designs a repairable power system for Kit's impossible machines. Kit demands that every apprentice know how to mend it without him. They argue through the drawings and publish the plans anyway. In ten years the county has an annual race of machines whose inventors expect to be outgrown.",
    dark: 'The prototype wins an award and its sponsor patents the part everyone thought was communal. Cedar tries to reverse the contract; Kit teaches people to build a different machine. They remain allies, even after learning that not every brilliant idea should be pitched to a funder.',
  },
  'cedar|juniper': {
    hope: 'Cedar wants sensors on the creeks; Juniper demands that creek workers own their data. They build a small monitoring cooperative with an agreement anyone can read. The system is imperfect, the batteries occasionally fail, and for the first time the warnings belong to the people who need them.',
    dark: "Cedar's early warning network predicts every flood, then a distant contractor starts selling the measurements back to the valley. Juniper refuses to call the forest a data set. Cedar refuses to abandon the people who still depend on his radios. Their argument becomes the last truly public meeting in town.",
  },
  'cedar|mara': {
    hope: 'Mara teaches Cedar that a symbol can belong to its maker even when a machine can copy it; Cedar makes the ownership records legible to artists who do not want to hire a lawyer. Their public workshop teaches people to protect both their work and one another. Neither of them calls this a revolution. They are too busy opening the doors.',
    dark: 'A platform offers Mara exposure and Cedar a contract. They read the fine print too late to save the first project, then publish a warning with their own names on it. Ten years on, the warning still circulates and the platform still advertises. Both facts matter.',
  },
  'juniper|mara': {
    hope: "Mara insists that local artists be paid to tell the new grove's story. Juniper insists the grove must never become a private mural with a locked gate. They build an open trail with art the makers can choose to change, and they train the next caretakers before either woman gets sentimental.",
    dark: "The forest charity loves Mara's paintings and uses Juniper's conservation work in its brochures, but locks the public out of its decisions. Mara signs her work elsewhere. Juniper stays to watch the trees, furious and still present. They meet for coffee when they can, and refuse to pretend they won.",
  },
}

/**
 * Futures for larger traveling crews. A crew of three or four only exists when
 * the player explicitly invited each guide along at separate crossroads.
 */
const CREW_FUTURES: Record<string, Record<Fate, string>> = {
  'cedar|juniper|kit': {
    hope: "The three of them turn the old loading shed into a shared yard: Cedar's repairable sensors on the creek, Juniper's planting calendar on the wall, Kit's machines rolling out for the yearly pageant. Meetings run long because everyone is allowed to object. The warning radios work, the grove stays open, and the apprentices know how to fix all of it.",
    dark: 'A sponsor offers the yard a roof, a logo and a gag clause. They argue for three nights and turn it down, which costs them the season. The sensors go quiet, the grove stays closed to crowds, and the machines stay in the shed. Nobody calls it a win, and nobody leaves.',
  },
  'cedar|juniper|mara': {
    hope: 'Mara paints the creek-gauge stations so people actually read them. Juniper writes the data agreement in plain language and Cedar makes sure anyone can audit it. Visitors come for the murals and leave knowing who owns the warnings. The three of them keep a standing Thursday dinner and refuse to take minutes.',
    dark: "The valley's data is sold anyway, with Mara's murals as the friendly face. The three publish a joint statement with all their names and no sponsor logos. It reaches fewer people than the brochure did. They keep the dinner, and they keep the statement posted.",
  },
  'cedar|kit|mara': {
    hope: 'Kit builds, Cedar makes it repairable, Mara makes it unmistakably theirs. The workshop pays everyone on the same scale and publishes its plans beside its posters. Other towns copy the posters first, then the plans, then the pay scale. The three of them are mildly annoyed at how well this works.',
    dark: 'A platform signs the show and quietly files patents on the parts. The three build a second, smaller machine in a borrowed barn and give the drawings away. It never tours. It is mended and reused in a dozen places nobody advertises, and that is the whole point.',
  },
  'juniper|kit|mara': {
    hope: "The forest festival belongs to the people who set it up: Kit's parade floats, Mara's trail art, Juniper's promise that the grove never gets a locked gate. Ticket money pays the caretakers first. By the tenth year, the children who watched it from the fence are running the stage crew.",
    dark: 'The festival grows large enough to attract a promoter who wants exclusive rights to the grove. The three refuse and lose the permit. They hold a small unlicensed gathering anyway, on the public path, with paper lanterns. Eleven people come. It is the best night of the year.',
  },
  'cedar|juniper|kit|mara': {
    hope: "Four people who disagree about nearly everything open one shared house at the edge of the county: a workshop, a studio, a seed library and a repair bench with an honest ledger. Nobody is anybody's lead. People arrive for one reason and stay for three. The weekend you spent with them turned out to be the first of a long, loud, loving run of them.",
    dark: 'The county never makes room for them. The four of them hold together anyway, trading couches, tools and letters, meeting wherever the bus lets them off. The house they dreamed of stays a drawing on a napkin. The family does not. You are on the napkin, too.',
  },
}

export function ensembleFuture(state: RunState, fate: Fate): string | null {
  const party = travelParty(state)
  if (party.length < 2) return null
  const key = [...party].sort().join('|')
  return (PAIR_FUTURES[key] ?? CREW_FUTURES[key])?.[fate] ?? null
}
