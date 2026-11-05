// Prom of Doom mission offers (t-022, kind_robots#4402). Every board mission
// arrives as an authored offer: who is asking, how urgent it is, which
// faction is behind the trouble and who will try to interfere. Each district
// hides one secret that a player-led investigation can uncover; once known,
// it exposes that faction's interference on later calls in the district.
import { caseThread, type CaseThread } from './caseMemory'
import { EXPANDED_POWER_CALLBACKS } from './expandedPowerCallbacks'
import { EXPANDED_NIGHT_MORNINGS } from './expandedNightMornings'
import { EARLY_NIGHT_MORNINGS, type MorningGrade } from './earlyNightMornings'
import type { Grade } from './rules'

/** honors / pass / partial / failed for an attempted call, or refused when
 * nobody answered it. */
export type MissionResult = MorningGrade
export const MISSION_RESULTS: readonly MissionResult[] = [
  'honors',
  'pass',
  'partial',
  'failed',
  'refused',
]
/** The report label for a call nobody answered. */
export const UNANSWERED_NAMES = 'No team dispatched'

export function missionResult(report: {
  grade: Grade
  names: string
}): MissionResult {
  return report.names === UNANSWERED_NAMES ? 'refused' : report.grade
}

export type MissionFaction =
  | 'trustees'
  | 'transit-authority'
  | 'harbor-money'
  | 'city-hall'
  | 'underworld'
  | 'private-money'

export const FACTION_LABELS: Record<MissionFaction, string> = {
  trustees: 'Academy administration & sponsors',
  'transit-authority': 'Transit Authority & contractors',
  'harbor-money': 'Promenade insurers & operators',
  'city-hall': 'City Hall emergency contracts',
  underworld: 'Villain crews & black market',
  'private-money': 'Private sponsors & publicists',
}

/** 3: minutes count; 2: it has to be tonight; 1: it can hold until dawn. */
export type OfferUrgency = 1 | 2 | 3
export const URGENCY_LABELS: Record<OfferUrgency, string> = {
  3: 'MINUTES',
  2: 'TONIGHT',
  1: 'BY DAWN',
}

type AuthoredOffer = {
  /** Who is asking, by role, as the board shows it. */
  asker: string
  /** What they say when they call it in. */
  plea: string
  urgency: OfferUrgency
  deadline: string
  faction: MissionFaction
  interferer: string
  /** What the interferer will try, as a verb phrase. */
  interference: string
  /** Only for offers whose faction is the one the district secret exposes:
   * what changes on this call once the player knows that secret. */
  exposed?: string
}

export type MissionOffer = AuthoredOffer & {
  caseId: string
  thread: CaseThread
  /** Later consequences this call feeds, resolvable with offerCallback(). */
  callbacks: string[]
}

export type DistrictSecret = {
  thread: CaseThread
  title: string
  /** The faction whose interference this secret exposes. */
  faction: MissionFaction
  reveal: string
}

/** One secret per district. Uncovered when the player personally leads a
 * successful (pass or honors) investigation there while already holding an
 * earlier casebook clue from the same district. */
export const DISTRICT_SECRETS: Record<CaseThread, DistrictSecret> = {
  academy: {
    thread: 'academy',
    title: 'The Enrollment Waivers',
    faction: 'trustees',
    reveal:
      "Laid side by side, your academy casefiles carry one signature. Every experiment on campus this term was authorized under research waivers folded into enrollment paperwork. The trustees never read them; the sponsor wrote them, and the dean's office filed them.",
  },
  transit: {
    thread: 'transit',
    title: 'The Night-Closure Ledger',
    faction: 'transit-authority',
    reveal:
      "Your transit casefiles line up with one ledger: every night closure, sealed shaft and 'accident' on the lines falls on a parcel the authority has already sold. The breakdowns are the sales pitch.",
  },
  harbor: {
    thread: 'harbor',
    title: 'The Seawall Diversion',
    faction: 'harbor-money',
    reveal:
      'Your harbor casefiles follow the same money. The seawall budget, the repair funds and the storm warnings were diverted to protect the promenade and sold on to its insurers. The docks were scheduled to flood.',
  },
  civic: {
    thread: 'civic',
    title: 'The Emergency-Sale Signature',
    faction: 'city-hall',
    reveal:
      "Your civic casefiles carry the same deputy's signature on every emergency sale: scrapped generators, private dispatch contracts, a predictive court and an auctioned shield grid. In this city, each crisis becomes somebody's invoice.",
  },
}

const AUTHORED: Record<string, AuthoredOffer> = {
  // ------------------------------------------------------------ transit
  monorail: {
    asker: "The last monorail's conductor, on the emergency band",
    plea: 'Sixty-seven aboard and the brakes answer to somebody else. Get here before the hospital crossing.',
    urgency: 3,
    deadline: 'Before the train reaches the hospital crossing',
    faction: 'transit-authority',
    interferer: 'The contractor holding the remote signal',
    interference:
      'keep steering the train and wipe its command logs while you fight the brakes',
    exposed:
      "You know whose closures this line was sold for. The contractor's remote access is cut before the train leaves the depot, and its command logs stay where you can read them.",
  },
  quarry: {
    asker: 'The sandhog crew chief, digging by hand',
    plea: 'Four of ours are under that rock. The authority wants it sealed by morning. We want them out.',
    urgency: 2,
    deadline: 'Before the authority seals the shaft at dawn',
    faction: 'transit-authority',
    interferer: 'Transit authority engineers',
    interference:
      'pour the seal over the fourth shaft to keep a private vault entrance buried',
    exposed:
      'You know the authority sold the rights beneath this line. Its engineers hold the seal while the sandhogs dig, and the survey photographs stay public.',
  },
  'ghost-ticket': {
    asker: 'A veteran conductor at the Transit Exchange',
    plea: 'These tickets carry the names of our dead. Somebody is using them to take the station.',
    urgency: 2,
    deadline: 'Before the phantom platform starts boarding',
    faction: 'transit-authority',
    interferer: "The developer's survey crew",
    interference:
      'paste demolition notices over the memorial wall the moment the platform empties',
    exposed:
      'You know the station was sold in the night-closure ledger without a lawful vote. The survey crew has no notice worth posting, and the workers keep their memorial.',
  },
  'borrowed-faces': {
    asker: "The school shuttle's driver",
    plea: "They reported the brake fault and lost their faces for it. Please don't let security take them.",
    urgency: 2,
    deadline: 'Before depot security boards the bus',
    faction: 'transit-authority',
    interferer: "Depot security, on the transit company's orders",
    interference: 'detain the riders as impostors and bury the brake report',
    exposed:
      'You know who rewrote these IDs and why. Depot security stands down when you name the closure ledger, and the brake report stays on file.',
  },
  'rail-heart': {
    asker: 'A switchyard mechanic, shouting over the flywheel',
    plea: 'Our conductor is inside that engine and the flywheel is still climbing.',
    urgency: 3,
    deadline: 'Before the flywheel tears the carriage apart',
    faction: 'trustees',
    interferer: "The academy benefactor's lawyers",
    interference:
      'arrive with a prewritten waiver and a rail-yard transfer while the wreck is still smoking',
  },
  'future-graduates': {
    asker: 'A transit worker on the gate platform',
    plea: 'Those passengers are your classmates, years from now. Save the train without erasing them.',
    urgency: 2,
    deadline: "Before the timetable's predicted crash",
    faction: 'transit-authority',
    interferer: 'Transit authority supervisors',
    interference:
      'fire the worker who warned you and call the footage a hologram',
    exposed:
      'You know the authority has been closing platforms it never repaired. Its supervisors cannot call this warning a hoax, and the worker keeps her job.',
  },
  'rail-orchestra': {
    asker: 'A transit union steward',
    plea: 'Our people are playing themselves to exhaustion down there. Free them without taking their music.',
    urgency: 1,
    deadline: 'Before the trains stop at dawn',
    faction: 'private-money',
    interferer: 'The promoter who sold the implants',
    interference:
      'shred the implant invoices before investigators reach the tunnel',
  },
  'shadow-inspector': {
    asker: "The Narrows terminal's real ticket inspector",
    plea: 'My own shadow is charging people their memories. Those turnstiles are not ours.',
    urgency: 2,
    deadline: 'Before the stranded passengers forget the way home',
    faction: 'trustees',
    interferer: 'The academy security contractor',
    interference: 'haul the turnstiles away before the city can examine them',
  },
  // ------------------------------------------------------------ academy
  garden: {
    asker: "The missing botanist's sister",
    plea: 'The botanist is alive in those roots. The institute wants everything burned before sunrise.',
    urgency: 2,
    deadline: 'Before the institute burns the greenhouse',
    faction: 'trustees',
    interferer: "The institute's cleanup crew",
    interference: 'burn the specimens and the funding logs with them',
    exposed:
      'You know which sponsor financed this greenhouse under the waivers. The cleanup crew finds its burn order unsigned, and the funding logs come out with the botanist.',
  },
  'frog-serum': {
    asker: 'A night custodian at the pressure door',
    plea: "My partner on the night crew is coughing behind that door, and the professor won't leave his antidote.",
    urgency: 3,
    deadline: 'Before the pressure door gives',
    faction: 'trustees',
    interferer: "The dean's office",
    interference: 'call it a student prank and confiscate the formula',
    exposed:
      "You know the tower's safety signature was forged under the enrollment waivers. The dean's office cannot confiscate the formula, and the medical record stands.",
  },
  'mirror-court': {
    asker: 'A frightened drama-club student',
    plea: 'One mirror has our missing stagehand in it. Everyone else thinks it is a ghost story.',
    urgency: 2,
    deadline: 'Before the theater is boarded shut',
    faction: 'trustees',
    interferer: "The prom election's sponsor",
    interference: 'buy the security footage and wipe the mirror recordings',
    exposed:
      "You know the sponsor's name from the waivers. Its people cannot buy the footage tonight, and the recordings stay with the drama club.",
  },
  'stolen-hour': {
    asker: 'An astronomy student at the observatory',
    plea: 'The infirmary is gone. An hour gone, with three patients and a nurse inside.',
    urgency: 3,
    deadline: 'Before the gate resets at 2:13',
    faction: 'trustees',
    interferer: 'The academy officials who rented the hour',
    interference: 'deny the experiment and lose the operating records',
    exposed:
      'You know who signs the academy trial waivers. The officials cannot deny renting this hour, and the operating records come back with the clinic.',
  },
  'detention-moon': {
    asker: 'A coach locked out of the gymnasium',
    plea: 'Seven students in detention are orbiting the ceiling, and the dean says it is an exhibit.',
    urgency: 3,
    deadline: 'Before the gym roof tears open',
    faction: 'trustees',
    interferer: "The science sponsor's technicians",
    interference: "pull the moon's core out during the evacuation",
    exposed:
      "You know this gravity trial ran on the enrollment waivers. The sponsor's technicians are turned away at the door, and the core stays as evidence.",
  },
  'promise-stairs': {
    asker: 'A librarian at the foot of the archive stairs',
    plea: 'A scholarship student is thirty floors up a four-floor building. The intercom wants somebody to give up graduating.',
    urgency: 1,
    deadline: 'Before the stairwell locks until morning',
    faction: 'trustees',
    interferer: 'The faculty adviser who holds the scholarship contracts',
    interference:
      'seal the records and put the trapped student on trial for broken promises',
    exposed:
      'You know the scholarship contracts were folded into the same waivers. The adviser cannot seal the archive, and the coerced promises are read aloud as coerced.',
  },
  'mascot-uprising': {
    asker: 'Students hiding in the costume basement',
    plea: 'It is asking us for a name and a place to sleep. The costume department is lighting the incinerator.',
    urgency: 2,
    deadline: 'Before the incinerator is lit',
    faction: 'trustees',
    interferer: 'The costume department',
    interference: 'burn the mascot before anyone asks what it is',
    exposed:
      "You know the administration's disposal orders run through the same waivers. The incinerator stays cold while the students talk to the mascot.",
  },
  // ------------------------------------------------------------- harbor
  flood: {
    asker: 'A lower-market stall owner',
    plea: 'Our medicine and our papers are in those stalls, and the seawall is being saved for the promenade.',
    urgency: 3,
    deadline: 'Before the surge reaches the electrical cabinets',
    faction: 'harbor-money',
    interferer: 'The seawall operator',
    interference:
      'sandbag the promenade first and blame student rescuers for the breach',
    exposed:
      'You know the seawall budget was diverted to the promenade. The operator cannot hold the sandbags back, and the market gets its share.',
  },
  ferris: {
    asker: "The pier's maintenance chief",
    plea: 'The owner wants the motor restarted for the cameras. The gearbox will shear. Get them down by hand.',
    urgency: 3,
    deadline: 'Before the owner restarts the motor',
    faction: 'harbor-money',
    interferer: 'The pier owner',
    interference:
      'restart the motor for the news crews and shred the deferred-repair logs',
    exposed:
      "You know where the pier's repair budget went. The owner keeps his hand off the restart, and the repair logs survive the night.",
  },
  refinery: {
    asker: 'A row-house tenant, calling from a stairwell',
    plea: 'The sensors say the air is clean. We can see it. We can taste it.',
    urgency: 3,
    deadline: 'Before the cloud settles over the row houses',
    faction: 'private-money',
    interferer: "The refinery's security chief",
    interference:
      'call it a drill and pull the smothering devices off the masts by morning',
  },
  'granny-shuttle': {
    asker: 'Granny Mayhem, over the school bus PA',
    plea: 'I have a bus full of elders and a bridge that will not lift. Open it or get out of my way.',
    urgency: 3,
    deadline: 'Before the flood barrier swallows the bridge',
    faction: 'harbor-money',
    interferer: 'The private rescue company',
    interference: 'hold the bridge until somebody pays the invoice',
    exposed:
      'You know the rescue company is paid from the diverted seawall fund. Its crew lifts the bridge without an invoice.',
  },
  'tomorrow-tide': {
    asker: "A dockside parent holding tomorrow's evacuation order",
    plea: 'This was signed tomorrow by your own emergency director. The water did not wait.',
    urgency: 3,
    deadline: 'Before the surge tops the seawall',
    faction: 'harbor-money',
    interferer: "The insurer that bought tomorrow's warnings",
    interference: 'keep the evacuation order quiet until its policies close',
    exposed:
      'You know who bought the advance warnings. The insurer cannot keep the order quiet, and the marshals read it out on every pier.',
  },
  'pearl-pact': {
    asker: 'The salvage diver, still dripping',
    plea: 'Everyone who helped me pull this out of the tunnel is in danger. I will not sell their names.',
    urgency: 2,
    deadline: 'Before the contractor seals the tunnel',
    faction: 'city-hall',
    interferer: "The council's salvage contractor",
    interference: 'seal the tunnel and destroy the only copy of the recording',
  },
  'double-lighthouse': {
    asker: 'The harbor lighthouse keeper',
    plea: "There are two beams and only one is mine. A relief boat and a workers' ferry are steering by them.",
    urgency: 3,
    deadline: 'Before either boat reaches the breakwater',
    faction: 'harbor-money',
    interferer: 'The yacht anchored past the breakwater',
    interference:
      'keep projecting the false beam and let the keeper take the blame',
    exposed:
      "You know whose boats the diverted harbor money protects. The yacht's private beacon goes dark when you radio its owner by name.",
  },
  'colossal-ring': {
    asker: 'A dockworker on the channel wall',
    plea: 'That ring is our seawall. They welded it out of our supports.',
    urgency: 2,
    deadline: 'Before the ring closes around the rescue boats',
    faction: 'harbor-money',
    interferer: "The donor's celebrity hero",
    interference:
      'stage the rescue as a proposal and buy silence about the missing supports',
    exposed:
      "You know where the seawall supports went. The celebrity hero's proposal never airs, and the supports go back to the wall.",
  },
  'cloud-zoo': {
    asker: 'A harbor worker sheltering a glass-antlered deer',
    plea: 'Their handlers want them darted. They are only looking for their nest.',
    urgency: 2,
    deadline: 'Before the guards start firing tranquilizers',
    faction: 'underworld',
    interferer: "The shipping company's guards",
    interference:
      'dart anything that moves in the fog and close the pier to rescuers',
  },
  // -------------------------------------------------------------- civic
  museum: {
    asker: "The Civic Museum's conservator",
    plea: 'Schoolchildren are still in the gala hall, and a buyer is coming for the archive key.',
    urgency: 2,
    deadline: 'Before the midnight exchange',
    faction: 'underworld',
    interferer: 'The underworld buyer',
    interference: 'take the key and plant evidence against your class',
  },
  broadcast: {
    asker: 'A volunteer interpreter in the Media District',
    plea: 'The forecast is real. Released badly, it starts a stampede. Sat on, it leaves people behind.',
    urgency: 2,
    deadline: 'Before the forecast goes up for sale',
    faction: 'underworld',
    interferer: 'A villain faction with money for your crew',
    interference: 'swap the alert for a false all-clear',
  },
  skybridge: {
    asker: "The night cleaners' forewoman",
    plea: 'The academy says that bridge is empty. Eight of my crew are on it.',
    urgency: 3,
    deadline: "Before the skybridge's last supports go",
    faction: 'city-hall',
    interferer: 'A city administrator',
    interference: "scrub the cleaners' names from the incident record",
    exposed:
      'You know who signed off on the early demolition. The administrator leaves the names on the record, and the morning bulletin prints all eight.',
  },
  blackout: {
    asker: "The hospital's night charge nurse",
    plea: 'Ventilators on battery. Our backup generator was sold for scrap. We need power, not a deal.',
    urgency: 3,
    deadline: 'Before the ventilator batteries run down',
    faction: 'underworld',
    interferer: 'A villain crew with a stolen generator',
    interference: 'trade the generator for a week of academy patrol schedules',
  },
  rally: {
    asker: "A street medic in Founders' Square",
    plea: 'One exit, a cracked plaza, and a publicist writing the story before anyone has been counted.',
    urgency: 3,
    deadline: 'Before the crowd reaches the single exit',
    faction: 'private-money',
    interferer: "The celebrity hero's publicist",
    interference: 'blame the protesters before the injuries are counted',
  },
  vault: {
    asker: "The armor testers' union representative",
    plea: 'They are not bank robbers. They want the injury files the insurer buried.',
    urgency: 2,
    deadline: 'Before the police breach the lobby',
    faction: 'private-money',
    interferer: 'Harbor Trust Bank',
    interference: 'pay a rival class to grab its deposit box in the confusion',
  },
  'halo-contract': {
    asker: 'A factory worker who kept her halo off',
    plea: 'These halos make you agree with city hall. Tomorrow they ship to your school.',
    urgency: 1,
    deadline: 'Before the halos ship for morning assembly',
    faction: 'city-hall',
    interferer: "City hall's procurement office",
    interference: 'keep the contract and blame a student intrusion',
    exposed:
      "You know who signs city hall's emergency contracts. The procurement office cannot bury this one, and the halo shipment is held at the dock.",
  },
  'hospital-saint': {
    asker: 'A young night-ward nurse',
    plea: 'Patients are healed overnight and billed with their future wages. Help them without hurting anyone still waiting.',
    urgency: 1,
    deadline: 'Before the morning billing run',
    faction: 'private-money',
    interferer: 'The insurer that owns the repayment ledger',
    interference: 'lock the ward the moment anyone challenges the bills',
  },
  'lightning-election': {
    asker: 'A poll worker guarding the paper ballots',
    plea: 'Every machine is dark except his. We have the paper; we need the count to survive the storm.',
    urgency: 3,
    deadline: 'Before the surviving machine calls the election',
    faction: 'private-money',
    interferer: "The candidate's private weather contractor",
    interference:
      'keep the storm on the polling line until the machine announces a winner',
  },
  'shadow-court': {
    asker: 'A court clerk at the Justice Annex',
    plea: 'The judge is about to sign warrants for crimes nobody has committed yet. One of them names your classmate.',
    urgency: 2,
    deadline: 'Before the warrants are signed at dawn',
    faction: 'city-hall',
    interferer: 'The judge running the predictive trial',
    interference:
      'sign the preemptive warrants and use any disorder to justify the system',
    exposed:
      'You know the predictive system was bought on an emergency signature. The judge cannot sign a warrant until the purchase is explained.',
  },
  'ambulance-detour': {
    asker: 'A medic in the lead ambulance',
    plea: 'Our navigation is taking us to a clinic where nobody answers. Do not cut life support to fix it.',
    urgency: 3,
    deadline: 'Before the ambulances reach the empty clinic',
    faction: 'city-hall',
    interferer: "The private dispatch office on the city's contract",
    interference: 'scrub its records and invoice the city for the detour',
    exposed:
      "You know who signed the city's dispatch contract. The private office loses its routing keys before the ambulances turn, and its invoices are frozen.",
  },
  'shield-auction': {
    asker: 'An engineer for the public shield grid',
    plea: 'They are auctioning the skyline while the drill turns real. Give me time to bring the public grid back.',
    urgency: 3,
    deadline: 'Before the meteor reaches the housing blocks',
    faction: 'city-hall',
    interferer: 'The auctioneer',
    interference: "sell the harbor wards' coverage to the last bidder",
    exposed:
      'You know the auction rests on a city emergency-sale signature. The sale is void before the first bid, and the engineer keeps the grid public.',
  },
}

function callbacksFor(caseId: string, thread: CaseThread): string[] {
  return [
    `morning:${caseId}`,
    `district:${thread}`,
    `secret:${thread}`,
    ...(EXPANDED_POWER_CALLBACKS[caseId] ? [`power:${caseId}`] : []),
  ]
}

export const MISSION_OFFERS: Readonly<Record<string, MissionOffer>> =
  Object.fromEntries(
    Object.entries(AUTHORED).map(([caseId, offer]) => {
      const thread = caseThread(caseId)
      if (!thread) throw new Error(`mission offer ${caseId} has no district`)
      return [
        caseId,
        { ...offer, caseId, thread, callbacks: callbacksFor(caseId, thread) },
      ]
    }),
  )

export function missionOfferFor(caseId: string): MissionOffer | null {
  return MISSION_OFFERS[caseId] ?? null
}

/** Resolves a callback ID to the authored content it promises, so every
 * offer's callbacks can be checked rather than trusted. */
export function offerCallback(id: string): string | null {
  const [kind, key] = id.split(':') as [string, string | undefined]
  if (!key) return null
  if (kind === 'morning') {
    const mornings = EARLY_NIGHT_MORNINGS[key] ?? EXPANDED_NIGHT_MORNINGS[key]
    return mornings ? MISSION_RESULTS.map((r) => mornings[r]).join(' ') : null
  }
  if (kind === 'secret')
    return DISTRICT_SECRETS[key as CaseThread]?.reveal ?? null
  if (kind === 'district')
    return key in DISTRICT_SECRETS ? `district memory: ${key}` : null
  if (kind === 'power') {
    const lines = EXPANDED_POWER_CALLBACKS[key]
    return lines ? Object.values(lines).join(' ') : null
  }
  return null
}

export type DistrictSecretMemory = {
  thread: CaseThread
  day: number
  caseId: string
}

/** The secret this offer's interference falls under, when the player
 * uncovered it on an earlier night. */
export function exposedSecretFor(
  secrets: readonly DistrictSecretMemory[] | undefined,
  day: number,
  caseId: string,
): DistrictSecret | null {
  const offer = missionOfferFor(caseId)
  if (!offer?.exposed) return null
  const secret = DISTRICT_SECRETS[offer.thread]
  if (secret.faction !== offer.faction) return null
  return (secrets ?? []).some(
    (memory) => memory.thread === offer.thread && memory.day < day,
  )
    ? secret
    : null
}

export function validDistrictSecrets(
  value: unknown,
  currentDay: number,
  isMission: (caseId: string) => boolean,
): value is DistrictSecretMemory[] {
  if (!Array.isArray(value) || value.length > 4) return false
  const threads = new Set<string>()
  for (const entry of value) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry))
      return false
    const memory = entry as DistrictSecretMemory
    if (
      Object.keys(memory).sort().join(',') !== 'caseId,day,thread' ||
      !(memory.thread in DISTRICT_SECRETS) ||
      threads.has(memory.thread) ||
      !Number.isInteger(memory.day) ||
      memory.day < 1 ||
      memory.day > currentDay ||
      typeof memory.caseId !== 'string' ||
      !isMission(memory.caseId) ||
      caseThread(memory.caseId) !== memory.thread
    )
      return false
    threads.add(memory.thread)
  }
  return true
}
