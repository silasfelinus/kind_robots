export type VillainPlan = {
  id: string
  name: string
  method: string
  clue: string
  accomplice: string
  countermeasure?: string
  fall?: string
  coup?: string
  accomplices?: { id: string; name: string; motive: string; sabotage: string }[]
}

export const CAMPAIGN_VILLAINS: VillainPlan[] = [
  {
    id: 'the-architect',
    name: 'The Glass Architect',
    method:
      'redirects the municipal shield grid into a collapsing lens above the ballroom',
    clue: 'The same twelve-point prism appears in transit diagrams and the prom lights.',
    accomplice: 'a contract engineer from the shield authority',
    countermeasure: 'shatter the prism without collapsing its supporting towers',
    fall: 'The prism splits into harmless reflections and the grid is returned to engineers.',
    coup: "The academy's tower becomes a private lens that bends rescue access toward paying districts.",
    accomplices: [
      { id: 'the-architect-a1', name: 'Maera Voss', motive: 'retain her engineering license', sabotage: 'forges load-bearing test data' },
      { id: 'the-architect-a2', name: 'Dr. Luce Perrow', motive: 'protect patients in the hospital beneath her tower', sabotage: 'redirects shielding away from the infirmary' },
      { id: 'the-architect-a3', name: 'Talin Vey', motive: 'win ownership of the Prism Hall', sabotage: 'plants a twelve-facet lens under the ballroom' },
    ],
  },
  {
    id: 'the-registrar',
    name: 'The Null Registrar',
    method:
      'turns the academy identity registry into a citywide power-suppression broadcast',
    clue: 'Rescue logs contain graduates who never existed.',
    accomplice: 'a forged accreditation officer',
    countermeasure: 'restore the discarded identities before shutting down the registry',
    fall: 'The lost class files return to their rightful owners and the null broadcast fails.',
    coup: 'Unpowered graduates become property of a registry that decides who may keep their powers.',
    accomplices: [
      { id: 'the-registrar-a1', name: 'Auditor Ell Kest', motive: 'avoid a public fraud inquiry', sabotage: 'erases scholarship applicants' },
      { id: 'the-registrar-a2', name: 'Evin Calder', motive: "recover a missing sibling's identity", sabotage: 'copies biometric signatures from enrollment cards' },
      { id: 'the-registrar-a3', name: 'Nora Sable', motive: 'win a private data-erasure contract', sabotage: 'sends a universal deletion order through the exam network' },
    ],
  },
  {
    id: 'the-tidemaker',
    name: 'The Tidemaker',
    method:
      'opens the harbor floodgates to force a controlled evacuation and privatize the waterfront',
    clue: 'Flood markers have been replaced with brass dials.',
    accomplice: 'a waterfront insurance broker',
    countermeasure: 'give the waterways to their residents rather than an owner',
    fall: 'Residents reopen the canals under shared stewardship and the floodgate bid collapses.',
    coup: 'The waterfront is emptied, priced, and leased back to the people who built it.',
    accomplices: [
      { id: 'the-tidemaker-a1', name: 'Broker Ilex Moor', motive: 'secure waterfront insurance claims', sabotage: 'bribes inspectors to ignore leaking valves' },
      { id: 'the-tidemaker-a2', name: 'Captain Dev Ash', motive: 'save a family-owned salvage boat', sabotage: 'opens the south harbor locks against the tide schedule' },
      { id: 'the-tidemaker-a3', name: 'Mara Dusk', motive: 'settle an inheritance dispute over the quays', sabotage: 'plants flood-depth sensors inside the shield grid' },
    ],
  },
  {
    id: 'the-eclipse',
    name: 'The Eclipse Choir',
    method:
      "uses the fourth dance and broadcast towers to hypnotize the city's shield operators",
    clue: 'Unscheduled music notes recur in emergency broadcasts.',
    accomplice: "a concert producer with a falsified conductor's license",
    countermeasure: 'interrupt the false note with a chorus the city chooses for itself',
    fall: 'The chorus breaks its own score; people remember how to say no.',
    coup: 'The city follows a single beat as its shields obey the stage.',
    accomplices: [
      { id: 'the-eclipse-a1', name: 'Producer Vesta Rune', motive: 'recover a cancelled broadcasting license', sabotage: 'bribes the quartet to change the fourth-dance score' },
      { id: 'the-eclipse-a2', name: 'Alto Kiran Moth', motive: 'hear a stolen composition performed', sabotage: 'hides a neural carrier tone in the ballroom strings' },
      { id: 'the-eclipse-a3', name: 'Jessa Solace', motive: 'free a partner from the emergency communications bureau', sabotage: 'switches tower antennas toward the hypnotic relay' },
    ],
  },
  {
    id: "the-mercy",
    name: "The Mercy Circuit",
    method: "releases medical nanites through the city shield field, rewriting citizens under the banner of compulsory treatment",
    clue: "Volunteer medkits contain tiny flower-shaped nanite reservoirs.",
    accomplice: "Surgeon Idris Bloom",
    countermeasure: "separate healing consent from the automated treatment grid",
    fall: "Consent returns to the clinics and the invasive healing network shuts down.",
    coup: "A benevolent nanite cure rewrites citizens without asking their permission.",
    accomplices: [
      { id: 'the-mercy-a1', name: "Surgeon Idris Bloom", motive: "prevent another rationing disaster", sabotage: "reroutes hospital oxygen to a clandestine synthesis plant" },
      { id: 'the-mercy-a2', name: "Engineer Pelle Ardin", motive: "restore a terminal patient's voice", sabotage: "grafts an adaptive nanite seed into the city ward scanners" },
      { id: 'the-mercy-a3', name: "Curator Sel Fenn", motive: "preserve a clinic that authorities plan to shutter", sabotage: "sends a compassionate-care override into municipal med-bots" },
    ],
  },
  {
    id: "the-mirror",
    name: "The Mirror Chancellor",
    method: "broadcasts counterfeit eyewitness memories through mirrored shield towers, replacing what citizens know happened",
    clue: "Security witnesses remember two incompatible rescue routes with identical timestamps.",
    accomplice: "Councillor Rei Marr",
    countermeasure: "find an original eyewitness and turn the mirrors outward",
    fall: "Real testimony survives the duplicates and the mirage loses its authority.",
    coup: "Comet City is governed by the false reflections it mistakes for memories.",
    accomplices: [
      { id: 'the-mirror-a1', name: "Councillor Rei Marr", motive: "save a sibling falsely accused of sabotage", sabotage: "copies eyewitness footage to produce a fabricated alibi" },
      { id: 'the-mirror-a2', name: "Technician Pax Vale", motive: "earn enough money to leave their debt contract", sabotage: "plants optical duplicates in transit mirrors" },
      { id: 'the-mirror-a3', name: "Archivist Della Ro", motive: "prove the city's history is counterfeit", sabotage: "substitutes forged security views during the fourth dance" },
    ],
  },
  {
    id: "the-orchard",
    name: "The Orchard Engine",
    method: "releases command spores through the academy greenhouse network and wraps the city in a living root lattice",
    clue: "Roots grow through concrete wherever shield signal repeaters stand.",
    accomplice: "Botanist Ciel Aster",
    countermeasure: "sever the spore emitters without burning the gardens",
    fall: "The wild gardens survive without chaining the streets to their roots.",
    coup: "Living vines take over the streets and decide who can come home.",
    accomplices: [
      { id: 'the-orchard-a1', name: "Botanist Ciel Aster", motive: "save a dying seed bank at any cost", sabotage: "steals compost reactors from the university" },
      { id: 'the-orchard-a2', name: "Caretaker Yara Moss", motive: "protect a hillside neighborhood from demolition", sabotage: "seeds the greenhouses with obedient root sensors" },
      { id: 'the-orchard-a3', name: "Merchant Dax Grove", motive: "buy the waterfront land beneath the market", sabotage: "connects spore release vents to academy air ducts" },
    ],
  },
  {
    id: "the-static",
    name: "The Static Commissioner",
    method: "hijacks every emergency frequency with a fake evacuation order, turning the shields against independent rescue crews",
    clue: "Every distress transmission carries the same missing quarter-second of silence.",
    accomplice: "Commissioner Ro Tann",
    countermeasure: "return emergency frequencies to independent operators",
    fall: "Independent rescuers regain their voices and the false alert is silenced.",
    coup: "All emergency calls funnel through the commissioner's one locked frequency.",
    accomplices: [
      { id: 'the-static-a1', name: "Commissioner Ro Tann", motive: "restore a city's failed emergency reputation", sabotage: "forces patrols onto obsolete radio codes" },
      { id: 'the-static-a2', name: "Technician Jori Flint", motive: "protect an apprentice blamed for a tower accident", sabotage: "jams independent rescue repeaters" },
      { id: 'the-static-a3', name: "Fixer Rena Vox", motive: "create a legal neighborhood broadcast cooperative", sabotage: "plants a false evacuation frequency in prom speakers" },
    ],
  },
]

export const CAMPAIGN_ANCHORS: readonly string[] = [
  "The dean releases a graduation ranking before anyone has taken the final exam. Imani finds a blank space where a student's name should be.",
  'A rehearsal evacuation leaves twenty volunteers off the emergency roster. Mina insists that a rescue drill is not the same as permission.',
  'The transit authority replaces the inspection team with a private contractor. Sol finds a duplicate access key in the academy workshop.',
  'A stranger carrying a dimensional gate warrant asks for a person, not contraband. The dean offers a finder’s fee.',
  'A refugee shuttle asks Comet City for a corridor without a passenger manifest. Tess says the missing names are deliberate.',
  'Emergency scholarship funds are moved to a fireworks account. Kit wants the injured students consulted before the prom committee votes.',
  'A false catastrophe simulation projects a broken chandelier above the dance floor. An unlisted operator briefly takes control of the projector.',
  'An underworld broker starts paying tuition for students who promise to miss certain night patrols. The arrangement has no obvious victim yet.',
  'The campus infirmary reports more injuries than the official training ledger. Mina asks which figures were deleted.',
  'A transport union prepares a citywide strike over expired safety inspections. The mayor asks the academy to cross the picket line.',
  "Floodwater reaches the market's lowest street while a developer controls the overflow valve. Families are forced to choose between electricity and shelter.",
  "The municipal shield towers receive a midnight calibration order signed by somebody using the dean's identity.",
  'An injured rescuer is offered an expensive private cure in return for signing away their testimony. Kit calls it a contract written under duress.',
  'The academy publishes grades for rescue missions that never took place. Imani recognizes the names of the people marked as casualties.',
  'A silver emergency key is found sealed inside a prom invitation. The invitation was addressed to a student missing since term began.',
  'The class receives a list of neighborhoods to avoid during patrol. Three of them contain the only independent clinics.',
  'The harbor rescue guild volunteers to house displaced families. The school tries to claim their work as a faculty initiative.',
  "An anonymous broadcaster releases a fragment of the city's evacuation map. Its missing legend could send people into danger.",
  "The academy's own drones begin recording every student who has openly questioned the dean. Sol can identify their command relay.",
  'A graduate from an earlier class returns without their powers and alleges that the shield network was built to collect them.',
  'The infirmary is ordered to close early for the prom rehearsal. Patients refuse to leave until every prescription is transferred.',
  "A council hearing pits market residents against the academy's emergency authority. The hearing is streamed to every city shelter.",
  "The city's skyport closes its southern approach while a refugee fleet is still in transit. Tess offers a route that risks exposing a sanctuary.",
  'The student council discovers that every prom ticket contains a tiny transmitter. The faculty calls it a harmless attendance device.',
  'A private militia offers to provide security for graduation in exchange for permanent access to city shield controls.',
  "An independent medic finds evidence of sabotage in rescue gauntlets, but the workshop's records have already been replaced.",
  'The fourth dance appears on a leaked rehearsal schedule. There are no music cues after the chandelier turns.',
  'Residents begin building alternative shelter routes because nobody trusts the official evacuation map. Some city blocks now have their own keys.',
  "The Guest List: academy security demands sole control of the ballroom doors while neighbors and injured rescuers ask for shelter. Choose who holds the keys before tomorrow's dance.",
  'The real Prom of Doom: the fourth dance begins under a twelve-sided crystal chandelier; the glass roof breaks and a transmission beam links the ballroom to the municipal shield towers.',
]

// One authored anchor per day. The chosen landmark supplies the other half of
// the daytime encounter; these anchors cannot be lost to a shuffled draw.
export function campaignAnchor(day: number): string {
  return CAMPAIGN_ANCHORS[day - 1] ?? CAMPAIGN_ANCHORS[29]!
}

export function campaignVillain(seed: number, savedId?: string): VillainPlan {
  // A midcampaign save keeps its original mastermind even as the roster grows.
  const previous = savedId ? CAMPAIGN_VILLAINS.find(v => v.id === savedId) : undefined
  return previous ?? CAMPAIGN_VILLAINS[Math.abs(Math.trunc(seed)) % CAMPAIGN_VILLAINS.length]!
}

export const BETRAYER_CANDIDATES = ['mina', 'sol', 'imani', 'ash', 'nix', 'kit'] as const

export function campaignBetrayer(seed: number) {
  return BETRAYER_CANDIDATES[Math.abs(Math.trunc(seed * 7 + 3)) % BETRAYER_CANDIDATES.length]!
}

export function campaignAccomplice(villain: VillainPlan, index: number) {
  return villain.accomplices?.[index % (villain.accomplices.length || 1)]
}



// Hand-authored story gates. The day-20 betrayal cannot be avoided by a random
// draw; day 24 allows reconciliation but never erases the original betrayal.
export function campaignPlotEvent(seed: number, savedId: string | undefined, day: number, betrayerName: string) {
  const villain = campaignVillain(seed, savedId)
  const index = day === 11 ? 0 : day === 17 ? 1 : day === 26 ? 2 : -1
  const accomplice = index < 0 ? undefined : campaignAccomplice(villain, index)
  if (accomplice) return {
    title: `The ${villain.name} Network: ${accomplice.name}`,
    location: 'Comet City / Civilian Investigation',
    scene: `${accomplice.name} ${accomplice.sabotage}, while insisting they must ${accomplice.motive}. This is an independent accomplice with a bargain and a motive, not a faceless minion. ${villain.clue}`,
    options: [
      { id: `plot-a${index + 1}-expose`, label: 'Protect witnesses and expose the operation', text: `You document how ${accomplice.name} ${accomplice.sabotage}. Residents obtain the evidence before the villain can confiscate it; the immediate threat recedes, though the accomplice may still appeal the accusation.`, influence: 2, danger: -1 },
      { id: `plot-a${index + 1}-bargain`, label: 'Hear the accomplice and negotiate privately', text: `You discover why ${accomplice.name} wants to ${accomplice.motive}. The meeting yields useful access, but the sabotage continues while the terms are debated.`, influence: -1, danger: 1 },
    ],
  }
  if (day === 8) return {
    title: 'The Unscheduled Message',
    location: 'Academy / Student Lockers',
    scene: `${betrayerName} receives an anonymous message that promises to settle an old grievance. When asked, they close the screen too quickly. Elsewhere the shield grid repeats a clue: ${villain.clue}`,
    options: [
      { id: 'plot-warning-question', label: 'Ask what the message is offering', text: `${betrayerName} admits someone knows their family's worst secret. You offer help, but they do not surrender the sender's name.`, influence: 1, danger: 0 },
      { id: 'plot-warning-leave', label: 'Respect their privacy and watch from afar', text: `You refuse to turn friendship into surveillance. ${betrayerName} thanks you, then deletes a reply before you can read it.`, influence: 0, danger: 1 },
    ],
  }
  if (day === 15) return {
    title: 'The Missing Relay Keys',
    location: 'Engineering Workshop',
    scene: `A duplicate emergency key appears in ${betrayerName}'s equipment case. The key was used to mute a neighborhood distress call. The evidence points toward ${villain.name}, but nobody has proved why ${betrayerName} kept it.`,
    options: [
      { id: 'plot-suspicion-open', label: 'Confront them with a witness present', text: `${betrayerName} admits the key was used to intercept a rescue. They refuse to explain who is holding them to the agreement.`, influence: 1, danger: -1 },
      { id: 'plot-suspicion-cover', label: 'Shield them from an immediate investigation', text: `The dean lets the incident vanish from the log. ${betrayerName} is relieved and ashamed, but the intercepted call is still missing.`, influence: -1, danger: 1 },
    ],
  }
  if (day === 20) return {
    title: 'The Hero Turns at the Gate',
    location: 'Academy / Shield Relay',
    scene: `${betrayerName} diverts the academy rescue team into a dead-end corridor and transfers its emergency access keys to ${villain.name}. Their betrayal is real. They say the villain threatened someone they love, but the abandoned civilians still had to wait for rescue. You cannot undo this night by choosing a softer accusation.`,
    options: [
      { id: 'plot-betrayal-expose', label: 'Expose the betrayal and secure the public exits', text: `The civilians reach safety and the missing rescue keys are named in a public report. ${betrayerName} flees rather than face the people they endangered.`, influence: 2, danger: 0 },
      { id: 'plot-betrayal-hear', label: 'Hear the threat while protecting civilians', text: `You listen without excusing the deception. ${betrayerName} tells you whom ${villain.name} threatened, then walks away from the team before the next call.`, influence: 0, danger: 1 },
    ],
  }
  if (day === 24) return {
    title: 'The Price of Coming Back',
    location: 'Academy / Student Council',
    scene: `${betrayerName} offers to return with a signed confession and the villain's relay codes. The people they abandoned deserve a hearing, not a convenient reset. Any reconciliation requires public accountability and cannot erase the day-20 betrayal.`,
    options: [
      { id: 'plot-return-accountable', label: 'Offer a supervised return and restitution', text: `${betrayerName} gives the neighborhood rescuers the relay codes, accepts community oversight, and rejoins the roster under clear conditions. Their betrayal remains in the chronicle.`, influence: 2, danger: -1 },
      { id: 'plot-return-separate', label: 'Protect the city without reinstating them', text: `The team retains independent control of its rescue keys. ${betrayerName} testifies about the plot and must build trust elsewhere; your roster remains one person smaller.`, influence: 1, danger: -1 },
    ],
  }
  return undefined
}

export const GUEST_LIST_EVENT = {
  title: 'The Guest List',
  location: 'Academy Ballroom / Day 29',
  scene: CAMPAIGN_ANCHORS[28]!,
  options: [
    {
      id: 'guest-open',
      label: 'Open the ballroom as a public shelter',
      text: 'Mina and the market volunteers mark wide evacuation corridors. The ballroom fills with strangers whose safety matters as much as the graduates.',
      influence: 2,
      danger: -1,
    },
    {
      id: 'guest-private',
      label: 'Let private security control entry',
      text: 'The guard captain seals the side entrances. The school gives you access to the shield controls, but families are left waiting outside.',
      influence: -2,
      danger: 2,
    },
    {
      id: 'guest-duplicate',
      label: 'Duplicate the emergency keys for independent rescuers',
      text: 'Imani and the dockworkers discreetly copy the keys. Nobody can claim a monopoly on the exits, but the dean considers the access unauthorized.',
      influence: 1,
      danger: 0,
    },
  ],
} as const

export const PROM_FINALE = {
  title: 'PROM OF DOOM',
  location: 'Academy Ballroom / Day 30',
  opening: CAMPAIGN_ANCHORS[29]!,
  choices: [
    {
      id: 'protect',
      title: 'Evacuate the guests',
      help: 'Prioritize immediate lives, even if the shield transmitter survives.',
    },
    {
      id: 'command',
      title: 'Seize the shield console',
      help: 'Control the grid yourself. Somebody will have to trust you with all its switches.',
    },
    {
      id: 'share',
      title: 'Distribute shield control to the neighborhoods',
      help: 'Lose centralized power so the market and hospitals can defend themselves.',
    },
    {
      id: 'evacuate',
      title: 'Break the transmitter at the cost of the ballroom',
      help: 'Cut the attack at its source; the injured guests must be carried through debris.',
    },
  ],
} as const
