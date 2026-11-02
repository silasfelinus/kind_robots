import type { CaptainId, CrewId, FinaleStrategy, VoyageRun } from './rules'

/**
 * Twelve galactic ending families beyond the four base logs (Open Horizon,
 * Last Ship Home, Galactic Bargain, Cost of Command), after the sixteen
 * families in conductor projects/game-of-captains/content/
 * GALAXY-AND-NEMESIS-BIBLE.md. The base logs still close any voyage that
 * earns none of these. The counter council keeps its own two logs.
 *
 * Each family is earned by what the voyage actually did: how its calls were
 * answered, which world flags it left behind, how the crew's own errands went
 * and what was left in the hold. The first family in this list whose gate a
 * voyage meets is the one it gets, so the career-shaped families (missed
 * calls, a watching couch, an interfering one, a crew that has had enough)
 * outrank the destination families, which outrank the quieter two.
 *
 * Every family carries one line for each of the six captains, read after the
 * family text, in the captain's own register: Fluke and time, Vale and
 * consent to invention, Solace and triage, Rex and the cameras, Quill and
 * who owns the evidence, Ro and borrowed trust.
 */
export type GalacticEnding = {
  title: string
  /** Which finale orders can earn it. */
  orders: readonly Exclude<FinaleStrategy, 'counter'>[]
  /** The gate in plain words, for the Playbook Studio and the log. */
  gate: string
  earned: (run: VoyageRun) => boolean
  text: string
  captains: Record<CaptainId, string>
}

const policies = (run: VoyageRun, policy: string) =>
  (run.missionHistory ?? []).filter((event) => event.policy === policy).length
const flagged = (run: VoyageRun, ...flags: string[]) =>
  flags.some((flag) => (run.worldFlags ?? []).includes(flag))
const finishedOdyssey = (run: VoyageRun, ...crew: CrewId[]) =>
  crew.some(
    (id) => run.crew.includes(id) && (run.journeyProgress?.[id] ?? 0) >= 3,
  )
const boldStops = (run: VoyageRun) =>
  (run.journeyHistory ?? []).filter((stop) => stop.approach === 'bold').length

const BOTH = ['protect', 'compromise'] as const
const PROTECT = ['protect'] as const
const BARGAIN = ['compromise'] as const

export const GALACTIC_ENDINGS: readonly GalacticEnding[] = [
  {
    title: 'RETURN TO SENDER',
    orders: BOTH,
    gate: 'Two or more calls left on the board until they expired',
    earned: (run) => policies(run, 'missed') >= 2,
    text: 'The calls the couch did not answer are returned to it at the jump gate, unopened, by the systems that sent them, each with a covering note confirming receipt of the non-reply. Behind the nemesis waits a queue of people who solved their own problems in the meantime and would like the captain to know how. Each is given fourteen minutes. The couch passes through the gate on schedule. The correspondence follows by slower post.',
    captains: {
      fluke:
        'Fluke notes that in his own timeline he answered every call, and that his own timeline has never once been the one that happened. He signs for the returned post in the present tense.',
      vale: 'Vale reads every reply and finds that most of the problems were fixed with tools she would have confiscated. She asks the senders for the schematics and for permission, in that order, and then in the other order.',
      solace:
        'Solace had a laminated plan for every call she missed. She reads each plan aloud to the person it was for. Several say it would have worked. One says it is glad she did not come.',
      rex: 'Rex had prepared a victory speech for each unanswered call. He delivers none of them. The silence is recorded and later rated the best thing he did all voyage.',
      quill:
        'Quill files each returned reply with its sender’s permission and none without. The archive of what he did not do is now larger than the archive of what he did, and he keeps both at the same temperature.',
      ro: 'Ro hosts a small memorial for the voyage’s missed appointments, with fog and an organ. The guests of honour attend in person, alive, and ask for chairs.',
    },
  },
  {
    title: 'THE COMPLETE RECORD',
    orders: BOTH,
    gate: 'Observed and recorded at six or more calls',
    earned: (run) => policies(run, 'observe') >= 6,
    text: 'The couch observed. It observed nine systems in difficulty and kept a meticulous record of each, which is now the most complete account of a galactic crisis ever compiled by a sofa. The record is admitted as evidence in forty-one proceedings. None of them concern the couch, which was, every witness agrees, present. At the jump gate the nemesis asks for a copy. Under the treaty the captain upheld throughout, it is entitled to one.',
    captains: {
      fluke:
        'Fluke compares the record with the version he remembers and finds them identical. This has never happened before, and it unsettles him more than any paradox.',
      vale: 'Vale built nothing all voyage, and the treaty is in perfect condition. She keeps it in a drawer next to the inventions she did not make.',
      solace:
        'Solace kept the couch out of every danger it was invited into, and everyone aboard survived. She keeps the other list as well, and reads it every morning.',
      rex: 'Rex is filmed observing nine crises in a cape. The footage is now used in training, for observers.',
      quill:
        'Quill owns the most complete record of the voyage. He gives it to the people in it, who would have preferred something else and say so, on the record.',
      ro: 'Ro narrates the record for its public release in a graveyard voice and adds no embellishment at all. It is the most frightening thing they have ever presented.',
    },
  },
  {
    title: 'THE PERMANENT HEARING',
    orders: BOTH,
    gate: 'Intervened without permission at five or more calls',
    earned: (run) => policies(run, 'intervene') >= 5,
    text: 'The worlds are safe, and none of them gave permission. A standing tribunal convenes at the jump gate to examine each intervention in turn, with witnesses, exhibits and a refreshment budget. It is projected to conclude after everyone in the room has retired. The couch is released on its own recognizance and must report to the tribunal on the first day of every month, which it does, punctually, by flying in through the window.',
    captains: {
      fluke:
        'Fluke attends the first session and, through a scheduling error he does not dispute, the last one. He reports that the verdict is fair and declines to say what it is.',
      vale: 'Vale’s interventions are entered as exhibits A to K. She asks whether she may improve exhibit F. The tribunal says no. She asks whether exhibit F may decide that for itself.',
      solace:
        'Solace testifies that every pattern she has ever seen ends badly if nobody intervenes. The tribunal asks to see the patterns. She brings three binders and a mop.',
      rex: 'Rex asks for the hearing to be televised. It is, on the parliamentary channel at four in the morning, to an audience of his mother and a legal department.',
      quill:
        'Quill submits a sample of his own recycled fluids as evidence of the personal cost of intervention. The tribunal declines it with thanks and a sealed bag.',
      ro: 'Ro appears before the tribunal in a crown they are not entitled to and surrenders it in the first five minutes. The tribunal finds it the only act of the voyage performed with consent.',
    },
  },
  {
    title: 'A MOTION OF NO CONFIDENCE',
    orders: BOTH,
    gate: 'Crew trust at minus two or lower, after at least one unanswered call',
    earned: (run) => run.trust <= -2 && policies(run, 'missed') >= 1,
    text: 'Before the final order can be carried out, the crew tables a motion of no confidence in the captain. It passes three to nothing, with the captain abstaining. The couch makes its last jump under a rotating chair, the order of rotation decided by the length of each officer’s grievance, read in full. The nemesis, who came to negotiate with a captain, is asked to wait while the minutes are approved. The minutes take longer than the jump.',
    captains: {
      fluke:
        'Fluke has seen the vote coming for several centuries. He votes for it anyway, by mistake, from a later seat.',
      vale: 'Vale asks whether the motion was drafted with informed consent. It was. She is unsettled to find she agrees with it.',
      solace:
        'Solace always expected to be overthrown. She is moved to find it done by quorum, politely, with tea.',
      rex: 'Rex is offered one final speech as captain. He declines and asks to go on the rotation like everyone else. He is scheduled for a Tuesday.',
      quill:
        'Quill accepts the motion and asks for the minutes to be kept in an airtight sleeve. They are. He seems more comfortable after that.',
      ro: 'Ro takes the vote with a bow and a modest amount of fog. They had, they admit, never been elected to anything before, including the throne.',
    },
  },
  {
    title: 'SANCTUARY WITHOUT A MAP',
    orders: PROTECT,
    gate: 'Protect the worlds after carrying the Windglass map sealed, having kept Windglass hidden or Hollow Lantern whole',
    earned: (run) =>
      flagged(run, 'exodus-sealed') &&
      flagged(run, 'windglass-hidden', 'lantern-both'),
    text: 'The Windglass families are somewhere, and the couch does not know where. That was the agreement. Their sealed map went through the jump gate unopened, zipped inside a cushion, and the nemesis searched every cushion but that one, because someone was sitting on it. Legitimate visitors now find the sanctuary very hard to reach and say so in writing. The replies arrive. Nobody knows how.',
    captains: {
      fluke:
        'Fluke knows where the sanctuary will be in two hundred years and has written it down. He burns the page in front of the crew and spends the evening trying not to remember it.',
      vale: 'Vale could have built a tracker small enough to fit in a seam. She did not. The unbuilt design is in a locked box, and the key is in somebody else’s pocket.',
      solace:
        'Solace has never let anyone she protects be somewhere she cannot check. She sits on the cushion with the map in it for the whole crossing and does not look.',
      rex: 'Rex may not tell anyone about his greatest rescue. He is visibly struggling. The crew have arranged for him to tell a potted fern, which listens.',
      quill:
        'Quill holds the only evidence of where the families went and declines to own it. He returns the cushion to the Windglass buoy unread, with a receipt.',
      ro: 'Ro was trusted with a secret by people with every reason to trust nobody. Keeping it is the hardest role they have played, and the only one without an audience.',
    },
  },
  {
    title: 'NAMES ON THE HULL THAT ISN’T',
    orders: PROTECT,
    gate: 'Protect the worlds after standing with the Ashdock dockworkers twice: in Act I, and against the recall',
    earned: (run) =>
      flagged(run, 'recall-union') &&
      flagged(run, 'ashdock-protected', 'ashdock-exposed'),
    text: 'The couch has no hull, so the Ashdock dockworkers stitch the names of the shipyard dead into the underside of its upholstery, one to a seam, in thread chosen by their families. The recall is withdrawn. The manufacturer pays the restitution fund out of its cargo budget, and three luxury freighters are delivered without cup holders as a result. At the jump gate the nemesis is asked to remove its shoes before stepping onto the cushions. It does.',
    captains: {
      fluke:
        'Fluke reads each name aloud in the present tense, the only tense in which he can promise to be there to say it.',
      vale: 'Vale offers to engineer a better memorial. A dockworker confiscates her soldering iron and gives her a receipt. She keeps the receipt.',
      solace:
        'Solace counts the names twice. She knows the length of every list she has ever been on, and this is the first one she has been asked to sit on.',
      rex: 'Rex asks whether his own name might go on the couch as well. He is told that is not how memorials work. He agrees, and quietly takes off a medal.',
      quill:
        'Quill seals the restitution ledger in a clear sleeve and hands it to the families. It is the first evidence he has ever surrendered without being asked twice.',
      ro: 'Ro conducts the memorial in full mourning dress and keeps their own part to four sentences, which the dockworkers say is the right length.',
    },
  },
  {
    title: 'THE UNLICENSED CURE',
    orders: PROTECT,
    gate: 'Protect the worlds with Vela or Brin’s odyssey finished, after honouring Haleth’s autonomy or Rootborne’s consent',
    earned: (run) =>
      finishedOdyssey(run, 'vela', 'brin') &&
      flagged(run, 'haleth-autonomy', 'rootborne-consent'),
    text: 'The cure is free, and nobody owns it. The creditors who held its patent are reminded in a public hearing that they also hold the bill for making it, and the hearing ends early because the patients have somewhere to be. Follow-up care is not free, because the people who give it would like to be paid. The couch carries the first shipment through the jump gate itself, packed between the cushions, with consent forms signed by everyone who asked for it and by nobody else.',
    captains: {
      fluke:
        'Fluke has seen the cure become ordinary, then old-fashioned, then forgotten. He tells the patients none of this and fills in his own consent form in the correct century.',
      vale: 'Vale wants to improve the formula. A nurse asks her whether she has asked. She has not. She asks.',
      solace:
        'Solace makes a laminated triage chart for the first shipment and hands it to the patients’ council, who change it. She laminates their version.',
      rex: 'Rex poses for no photographs with the cure. He says afterwards that it was the bravest thing he did, and the crew allow him that.',
      quill:
        'Quill offers himself as the first test subject. He is asked whether he consents as a patient or as a gesture. He considers this for a long time and withdraws the offer.',
      ro: 'Ro was crowned by accident and abdicated on purpose. They give the cure away in the same spirit, at a ceremony with fog and no speeches.',
    },
  },
  {
    title: 'THE RIGHT TO REFUSE',
    orders: BARGAIN,
    gate: 'Bargain for passage after recognizing the machine strike, having ferried the Sesh backups or opened the Archive with consent',
    earned: (run) =>
      flagged(run, 'strike-recognized') &&
      flagged(run, 'sesh-ferried', 'archive-consented'),
    text: 'The captain accepts the nemesis’s terms for passage. The bubble generator, an employee since the strike and entitled to refuse unsafe work, declines to carry the couch through the jump gate on those terms. Talks resume with the bubble present and represented. The revised bargain is worse for the captain and better for everyone breathing inside it. The couch passes the gate eleven hours late. On Thursday the bubble takes its contractual day off and stays switched on throughout, as promised.',
    captains: {
      fluke:
        'Fluke has already met the bubble’s union representative, some decades from now, and recognizes the tone. He concedes faster than anyone has seen him concede anything.',
      vale: 'Vale built half the machines in the sector to be cleverer than she is. She is now negotiating with one, and losing, and has never been prouder.',
      solace:
        'Solace had a plan for the bubble failing. She did not have one for it saying no. She writes one and asks the bubble to review it.',
      rex: 'Rex’s victory speech is interrupted by the bubble’s statutory rest break. Rex takes the break. Everyone agrees it was the best part of the speech.',
      quill:
        'Quill lives inside a sealed suit and knows better than anyone what it is to depend on whatever holds your air. He votes with the bubble.',
      ro: 'Ro signed the first bargain with a fountain pen and a flourish. They countersign the revision in plain ink, which they consider the more frightening gesture.',
    },
  },
  {
    title: 'A TABLE FOR EVERY GUEST',
    orders: BARGAIN,
    gate: 'Bargain for passage after keeping Serendipity neutral at last orders and once before',
    earned: (run) =>
      flagged(run, 'lastcall-neutral') &&
      flagged(run, 'serendipity-neutral', 'tab-sealed'),
    text: 'The bargain is signed at Serendipity, at a corner table, because the bar stayed neutral when it would have been far easier not to. Vox serves both parties, keeps both tabs and refuses both tips. The nemesis and the people it harmed drink in the same room on the same evening. Nobody is reconciled. Everybody is served. The lights hold a cautious amber all night, and the couch is parked outside in the space reserved for regulars.',
    captains: {
      fluke:
        'Fluke has a standing reservation at this table from a visit he has not made yet. Vox seats him without asking.',
      vale: 'Vale wanted to rewire the lighting so the bar could not take sides. The bar overheard. It has taken a side about Vale.',
      solace:
        'Solace sits with her back to the wall, as she always does, and finds that the nemesis has done the same. They nod to each other and agree on nothing.',
      rex: 'Rex tries to buy a round for the room. Vox explains that the bar is neutral about generosity as well. Rex pays for his own and leaves an anonymous note.',
      quill:
        'Quill drinks his usual, which is his own, from the flask at the counter. Vox charges him corkage, which he calls the first fair price of the voyage.',
      ro: 'Ro attends as a guest, very quietly. It is the first party of their life at which they are not the entertainment.',
    },
  },
  {
    title: 'THE COURTESY ACCORD',
    orders: BARGAIN,
    gate: 'Bargain for passage after the simultaneous reactor repair and a rotating summit chair',
    earned: (run) =>
      flagged(run, 'courtesy-simultaneous') && flagged(run, 'summit-rotated'),
    text: 'The bargain is negotiated on the Courtesy Twins’ medical rail under the rules of the reactor repair: both sides act at the same moment, so that nobody is seen to go first. The nemesis finds this impossible to manipulate and extremely slow. Both worlds vote on the result, separately and at the same time. Both accept the regulatory costs, which they explicitly approved and now complain about weekly, together.',
    captains: {
      fluke:
        'Fluke experiences time out of order and is the only negotiator able to go first and second at once. He is asked to sit very still.',
      vale: 'Vale proposes a device that lets both sides sign at once. Both parliaments forbid it, simultaneously, the first time they have agreed with each other on purpose.',
      solace:
        'Solace insists that the exits be marked before the session starts. There are two. Neither world will be the one nearer the door.',
      rex: 'Rex insists on a handshake for the cameras. It takes eleven minutes to arrange, because neither hand will go first.',
      quill:
        'Quill keeps the official record and timestamps both signatures to the microsecond. They are identical. Nobody believes it, and it is true.',
      ro: 'Ro opens the accord with the speech they gave at their own accidental coronation, word for word. It was a peace treaty then as well.',
    },
  },
  {
    title: 'THE CUSHIONS ARE DONATED',
    orders: PROTECT,
    gate: 'Protect the worlds with an empty hold after giving aid at six or more calls',
    earned: (run) => run.supplies <= 0 && policies(run, 'aid') >= 6,
    text: 'The couch reaches the jump gate with an empty hold. Everything it carried has been given away, with consent, to people who asked for it, so the protection it can offer the worlds is mostly procedural. It holds. The nemesis cannot bargain with a vessel that has nothing it wants. On the far side of the gate the crew donate the last spare cushion to a refugee nursery and finish the voyage sitting slightly closer together.',
    captains: {
      fluke:
        'Fluke gives away his spare pocket watch, which is the same watch. It is back in his pocket the next morning, and he gives it away again.',
      vale: 'Vale returns her confiscated gadgets to the people she took them from, with apologies and improvements. Most of them keep the apologies.',
      solace:
        'Solace donates the emergency rations she had hidden in six separate cushions. She had not told anyone. She tells everyone, and then she sleeps for nineteen hours.',
      rex: 'Rex donates his medals to a museum, which accepts four and returns the rest as unverifiable. He keeps those and stops wearing them.',
      quill:
        'Quill has nothing to donate that is not part of him. He donates his time, which he measures, and which he says is the most expensive thing he owns.',
      ro: 'Ro gives the counterfeit crown to a children’s theatre, which uses it in a play about a monarch who gives everything away. Ro attends opening night.',
    },
  },
  {
    title: 'THE MEMOIRS',
    orders: BOTH,
    gate: 'Resolved four or more crew errands in public, boldly',
    earned: (run) => boldStops(run) >= 4,
    text: 'The crew ran their personal errands in public, and the public has been paying attention. Three memoirs of the voyage are published in the same week. They disagree about the order of events, the colour of the couch and who was in charge. All three are accurate. At the jump gate the nemesis, who has read all of them, asks the crew to sign its copies. It is refused, politely, three times.',
    captains: {
      fluke:
        'Fluke writes a memoir too. It was published two centuries ago and is out of print, and he is relieved.',
      vale: 'The memoirs describe Vale as reckless, brilliant and right. She asks for a correction to the second word.',
      solace:
        'Solace is in all three memoirs as the person who kept everyone alive. She asks that the book tours include clearly marked exits.',
      rex: 'Rex appears in the memoirs only in the footnotes. He reads the footnotes many times.',
      quill:
        'Quill is the subject of a chapter in each memoir. He asks whether he may own his chapter. The publishers say no. The crew say yes.',
      ro: 'Ro always wanted to appear in somebody else’s horror story. They are in three, as the comic relief, and find it fair.',
    },
  },
]

/** The galactic ending family a finale order earns, or null for the base logs. */
export function galacticEndingFor(
  run: VoyageRun,
  strategy: FinaleStrategy,
): GalacticEnding | null {
  if (strategy === 'counter') return null
  return (
    GALACTIC_ENDINGS.find(
      (ending) => ending.orders.includes(strategy) && ending.earned(run),
    ) ?? null
  )
}
