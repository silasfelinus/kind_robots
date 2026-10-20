import type { EndingLine, Fate, LensId } from './content'
import { chosenRegionalCallbacks } from './regionalCallbacks'

// Each new opening/last-guide/fate intersection is handwritten. These describe
// the lens and the ending, never a particular fork the run may not have seen.
type Signature = { title: string; line: string }

export const NEW_SIGNATURES: Record<string, Record<Fate, Signature>> = {
  'juniper.cocaine': {
    hope: {
      title: 'The Necessary Pause',
      line: 'The weekend began with every minute feeling billable. Juniper taught you that a forest refuses the invoice. Years later your best contribution was making room for the people who count trees, drive trucks and argue over the same creek to stay at one table until they had a workable answer.',
    },
    dark: {
      title: 'Express Conservation',
      line: 'You remember how quickly a beautiful solution could be announced. The boundary signs went up before the neighbors could speak. Even Juniper, who wanted the forest safe more than anyone, would not call an empty path a thriving community.',
    },
  },
  'juniper.meth': {
    hope: {
      title: 'The Morning Shift',
      line: 'At the start of the journey there was a night that seemed unwilling to end. In the future you and Juniper helped build a stewardship rota nobody had to carry alone. The creek was watched by rested people who knew one another’s names, and its strangest witness was welcome to ask for help.',
    },
    dark: {
      title: 'The Unfinished Watch',
      line: 'Every warning seemed to need an immediate answer; the forest survived the first emergency and quietly suffered the second. Juniper still tended what she could, and someone still posted careful observations. Repair remained possible, but urgency had never learned to share responsibility.',
    },
  },
  'juniper.mdma': {
    hope: {
      title: 'Tender Boundaries',
      line: 'You began with a fleeting sense that strangers might care for one another. With Juniper, tenderness acquired uncomfortable practical details: public paths, real livelihoods, measured habitat and a table where dissent was expected. The affection faded; the work outlived it.',
    },
    dark: {
      title: 'A Beautiful Agreement',
      line: 'For one bright evening everyone said they wanted the same thing. Ten years later the agreement had no maintenance fund or named stewards. Juniper kept a smaller grove alive, and you learned that feeling connected was not the same as keeping a promise.',
    },
  },
  'kit.cocaine': {
    hope: {
      title: 'The Credit Roll',
      line: 'You arrived in a hurry, drawn to the biggest spectacle. Kit redirected that momentum toward the people who built it: riggers, welders, dancers and apprentices with names on the credits and money in their pockets. The applause remained loud; the contracts finally caught up.',
    },
    dark: {
      title: 'The Fastest Parade',
      line: 'The early night glittered with the promise of being first. Kit’s marvelous machine became a promotional logo before the people who made it got a say. Years later she was still making original work elsewhere, but the county had to learn how to invite its artists back.',
    },
  },
  'kit.meth': {
    hope: {
      title: 'A Light Left On',
      line: 'An unsettled beginning left you keenly aware of how many hours a town asks its makers to give away. Kit’s eventual workshop paid for those hours and kept its doors open on terms its crew chose. No one had to burn through the night to belong to the story.',
    },
    dark: {
      title: 'The Night Crew',
      line: 'The most dedicated builders kept arriving after everyone else went home. Their unpaid miracles made a splendid parade and a terrible business. Kit refused to confuse endurance with consent; her next project was smaller, paid, and very much alive.',
    },
  },
  'kit.mdma': {
    hope: {
      title: 'The Open Rehearsal',
      line: 'The first warm rush of connection could have ended as a private memory. Kit made an opening instead: a workshop in which the clumsiest newcomer could help build the impossible and still be credited as a maker. The audience learned to become collaborators.',
    },
    dark: {
      title: 'All Welcome, Terms Apply',
      line: 'Everybody felt included on the first night. Nobody read the sponsor’s exclusivity clause. Kit left with her friends and their ideas intact, but the stage she helped imagine spent years selling tickets to a community that could no longer afford them.',
    },
  },
  'mara.cocaine': {
    hope: {
      title: 'Signed in Her Own Hand',
      line: 'The first impulse was to get the deal done. Mara taught you that speed meant nothing if the artist could not keep her own name. The future studio prospered by making every license and apprenticeship deliberate, and by letting each new artist negotiate their own future.',
    },
    dark: {
      title: 'The Rush Job',
      line: 'The contract was a blur when the journey began, and the worst parts were written in very small type. Mara lost a room, not her talent. In the years after, she taught younger artists to read every line before allowing a smiling stranger to call their work a gift.',
    },
  },
  'mara.meth': {
    hope: {
      title: 'A Studio with Windows',
      line: 'The early nights were long and the signs difficult to trust. Mara’s independent studio made a virtue of witnesses, daylight, and paid time to check every design against its rightful creator. Its apprentices could leave work at work and come back proud.',
    },
    dark: {
      title: 'Carbon Copy Night',
      line: 'At the start everything demanded attention at once; Mara’s stolen imagery thrived in that noise. She never stopped drawing, and a small network of friends still defended her work, though the city took too long to notice whose hands had made its favorite pictures.',
    },
  },
  'mara.mdma': {
    hope: {
      title: 'Love in the Fine Print',
      line: 'You came out of the first gathering convinced that everyone deserved a place. Mara asked who got paid, who consented and who could say no. A decade later the open studio answered with clear agreements and work that belonged to its creators.',
    },
    dark: {
      title: 'The Gift Nobody Asked For',
      line: 'You wanted to share what had made the first night beautiful. Mara knew a client’s private design was not yours to give. The public eventually learned the distinction; until then she kept a smaller, fiercely trusted studio, making new work under her own terms.',
    },
  },
  'cedar.cocaine': {
    hope: {
      title: 'The Public Switch',
      line: 'The first day moved faster than anyone could sensibly promise. Cedar redirected the pressure toward a county-owned network with jobs that could be audited and water data that stayed public. His parents still disagreed across their Sunday table and still passed each other the bread.',
    },
    dark: {
      title: 'Same-Day Installation',
      line: 'The towers rose astonishingly quickly. The local repair crews were hired astonishingly briefly. Cedar built an independent radio relay out of salvaged parts, stubbornly offering the county a second chance, while his parents kept their door and dinner table open.',
    },
  },
  'cedar.meth': {
    hope: {
      title: 'The Network That Rests',
      line: 'You began amid signals that refused to sleep. Cedar’s best future built maintenance shifts, locally trained crews, and machines allowed to shut off when they were not needed. The creeks had human witnesses as well as sensors. His parents were together for every difficult budget meeting.',
    },
    dark: {
      title: 'Always On, Never Owned',
      line: 'A blinking dashboard promised safety while the people who understood it lost control of the data. Cedar kept repairing neighbors’ radios and teaching apprentices the missing skills. His logger father and activist mother still showed up together, arguing about what a county should own.',
    },
  },
  'cedar.mdma': {
    hope: {
      title: 'A Connection That Holds',
      line: 'At first community felt like an almost effortless embrace. Cedar took the harder route: shared fiber, public meetings, paid rural trades and practical watershed care. Every anniversary his parents still fought cheerfully over the old ribbon colors and made up before dessert.',
    },
    dark: {
      title: 'The Friendship Plan',
      line: 'Everybody loved the promise of universal connection; too few noticed whose name was on the infrastructure. Cedar fought the resulting monopoly in small local victories. His parents stayed married, his neighbors kept sharing tools, and the county was not beyond repair.',
    },
  },
  'alone.cocaine': {
    hope: {
      title: 'A Brief That People Read',
      line: 'The weekend began in a hurry. Going without a guide did not mean going without neighbors: you carried what could be verified to the people who could act on it, and eventually learned to let them finish the work without you.',
    },
    dark: {
      title: 'One More Urgent Thing',
      line: 'Every warning had seemed like the most important task in the county. You kept the evidence, but not the ordinary appointments where decisions were made. Much later someone found your notes; the map to a better future was still legible.',
    },
  },
  'alone.meth': {
    hope: {
      title: 'The Second Witness',
      line: 'A difficult, wakeful beginning did not become your permanent identity. You learned to pass a clue to another witness and accept rest when you needed it. In time the network of people who checked on one another outlasted every startling signal.',
    },
    dark: {
      title: 'Pages After Midnight',
      line: 'You wrote down a great deal and could not carry all of it alone. A small group finally helped sort what was true. It came late for some things, early enough for others; the future stayed imperfectly open.',
    },
  },
  'alone.mdma': {
    hope: {
      title: 'The Introduction',
      line: 'For a moment everyone seemed familiar. Later, traveling alone, you did the slower work of introducing people who disagreed and then stepping aside while they solved their own problems. Humboldt remembered the introductions more than your name.',
    },
    dark: {
      title: 'A Crowd in the Photograph',
      line: 'The first night had given you the memory of belonging. You kept the photograph long after the group scattered. Years later a stranger recognized someone in it and knocked on your door; even this small future had room for another beginning.',
    },
  },
  'ecotopia.cocaine': {
    hope: {
      title: 'An Urgent Green Future',
      line: 'You started in a rush and finished by consistently choosing the living world, even when there was no audience. The speed became useful only after you agreed to slow down for the marsh. The herons inherited more space; the towns learned how to leave it for them.',
    },
    dark: {
      title: 'The Shortcut Around the Marsh',
      line: 'The first day promised to make time feel infinite. You loved the animals but never made time for the unglamorous work. The marsh still held its old birds, and an unfinished restoration map waited in your drawer.',
    },
  },
  'ecotopia.meth': {
    hope: {
      title: 'The Herons’ Morning Shift',
      line: 'You began with too many hours awake and found a different rhythm on the animal path. By the time the county called its restored wetlands a miracle, nobody remembered the quiet, shared work. You remembered that someone always took the next shift.',
    },
    dark: {
      title: 'A Bird Count Without End',
      line: 'The birds had always been there when you needed quiet. Watching became a refuge and sometimes a wall. Thirty years later the counts were exquisite, and the decision to share them still waited for you.',
    },
  },
  'ecotopia.mdma': {
    hope: {
      title: 'The Kindness of the Wild',
      line: 'You began with a feeling of kinship and gave it an enduring shape by protecting the places where wild lives could continue without an audience. The future valley was hospitable to people precisely because the animals were not asked to perform for them.',
    },
    dark: {
      title: 'The Lovely Evening',
      line: 'The first warmth was real. So was the marsh, which asked more than an evening. You did not build the world you glimpsed, but you never stopped caring for the place where the herons still came to feed.',
    },
  },
}

// Bookends extend the existing ten-year epilogues to one / ten / thirty year arcs.
// The companion's core never pretends a specific optional card was drawn.
export const FUTURE_BOOKENDS: Record<
  EndingLine,
  Record<Fate, [string, string]>
> = {
  mara: {
    hope: [
      'One year on, Mara is still negotiating rent and teaching herself to delegate. She refuses a contract that would trade client consent for free publicity.',
      'Thirty years on, the younger artists once apprenticed to Mara run studios of their own. Her original work still belongs to her, and she still takes commissions when she feels like it.',
    ],
    dark: [
      'One year on, Mara saves her original drawings and contact list when a commercial landlord makes an impossible offer.',
      'Thirty years on, her small studio network has survived without the monument the city might have built to her. New artists still hear her rule: ask permission, pay for the work.',
    ],
  },
  kit: {
    hope: [
      'One year on, Kit is trying to convert a volunteer build into a workshop with wages and a roof that does not leak.',
      'Thirty years on, the annual sculpture parade looks different every year because nobody owns the idea of who gets to build it. Kit still keeps a battered tool belt by the door.',
    ],
    dark: [
      'One year on, Kit is choosing which projects deserve her name and which sponsors do not deserve her labor.',
      'Thirty years on, the corporate parade has changed logos half a dozen times. The independent builders who left still pass tools to the next generation, and a new free parade is gathering.',
    ],
  },
  juniper: {
    hope: [
      'One year on, Juniper discovers that inviting ordinary disagreement into forest planning is harder than making a magical barrier.',
      'Thirty years on, the forest is older, not untouched. Restoration crews and wild things share it without having to call the same place by the same name.',
    ],
    dark: [
      'One year on, Juniper protects a small crossing while access and labor arguments harden into fences.',
      'Thirty years on, green shoots appear outside the oldest fence. People begin restoring the shared trail without claiming its history can be undone.',
    ],
  },
  cedar: {
    hope: [
      'One year on, Cedar has a battered prototype, a stack of public meeting notes and an argument about how much electricity a network should use. His parents arrive at every meeting together.',
      'Thirty years on, the co-op replaces its first fiber line and hires the grandchildren of its original repair crew. Cedar’s parents are still together, quarreling affectionately over the old green and yellow ribbons.',
    ],
    dark: [
      'One year on, Cedar sees the first private contract succeed just enough to make its hidden costs easy to ignore. His parents confront the terms together.',
      'Thirty years on, a new generation asks who owns the poles, the data and the land. Cedar hands them the original papers, while his still-married parents make room at the table.',
    ],
  },
  alone: {
    hope: [
      'One year on, you have a notebook full of oddities and an address book full of ordinary people willing to listen.',
      'Thirty years on, the county has many keepers of its story, not one. The person who first carried those notes around can finally put the notebook down.',
    ],
    dark: [
      'One year on, you have collected enough evidence to worry yourself and too few allies to make use of it.',
      'Thirty years on, somebody asks about the boxes of notes you kept. It is late, but not too late to tell the truth about what you actually saw.',
    ],
  },
  ecotopia: {
    hope: [
      'One year on, the animal path is still quiet. Nobody calls its small repairs a county policy, and you do them anyway.',
      'Thirty years on, children learn the heron counts in the same classrooms where they learn the names of the people who maintained the wetlands. The animals belong to themselves.',
    ],
    dark: [
      'One year on, you watch the deer trail change with the seasons and choose not to involve anyone else.',
      'Thirty years on, the wild still visits your porch. A new volunteer asks to see your notebooks, and the choice of whether to share them remains yours.',
    ],
  },
}

export const NEW_LENS_CODAS: Partial<Record<LensId, string>> = {
  cocaine:
    'Haste was a feeling, not the county’s destiny. The decisions came afterward.',
  meth: 'You survived a difficult, sleepless stretch. What mattered was what you and others did next.',
  mdma: 'The affection was real; the future required patient agreements too.',
}

// Optional codas only mention recorded actions. Unseen cards cannot earn a callback.
export function earnedQuestCallbacks(
  flags: string[],
  played: string[],
): string[] {
  const has = (name: string) => flags.includes(name)
  const callbacks: string[] = []
  if (played.includes('WH-055')) {
    const charter = has('cedar_network_charter')
    const monitors = has('cedar_watershed_sensors')
    if (charter && monitors)
      callbacks.push(
        'Because you secured both the public network charter and the watershed sensor crew, the creek data now belongs to the communities maintaining its equipment.',
      )
    else if (charter)
      callbacks.push(
        'The public network charter you helped secure still guarantees an audit right; watershed monitoring must find its own funding.',
      )
    else if (monitors)
      callbacks.push(
        'The locally maintained creek sensors you helped fund still report openly, although the broader network’s ownership remains contested.',
      )
    else if (has('cedar_private_network'))
      callbacks.push(
        'You accepted the private network deal. Cedar still keeps a copy of that contract on his kitchen table, annotated in three different inks.',
      )
  }
  const branches: [string, string][] = [
    [
      'juniper_habitat_verified',
      'The creek survey you corroborated became evidence local stewards could use without asking Juniper to prove her nature.',
    ],
    [
      'kit_collaborator_credit_kept',
      'The artists whose credits you negotiated kept their names attached to the moving-shadow work.',
    ],
    [
      'mara_client_trust_kept',
      'No client’s private design was exposed in the evidence you helped Mara assemble.',
    ],
    [
      'cocaine_union_terms',
      'The stage crew’s revised wage terms, which you slowed down to read, outlasted the rushed festival contract.',
    ],
    [
      'meth_vigilant_witness',
      'The river warning you helped corroborate was independently signed by workers who were there.',
    ],
    [
      'mdma_mutual_aid',
      'The workshop’s written access agreement lasted longer than the evening when everyone first felt understood.',
    ],
  ]
  for (const [flag, line] of branches)
    if (has(flag) && callbacks.length < 2) callbacks.push(line)
  for (const callback of chosenRegionalCallbacks(flags))
    if (played.includes(callback.id) && callbacks.length < 2) callbacks.push(callback.text)
  return callbacks
}
