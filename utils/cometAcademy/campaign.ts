export type VillainPlan = {
  id: string
  name: string
  method: string
  clue: string
  accomplice: string
}

export const CAMPAIGN_VILLAINS: VillainPlan[] = [
  {
    id: 'the-architect',
    name: 'The Glass Architect',
    method:
      'redirects the municipal shield grid into a collapsing lens above the ballroom',
    clue: 'The same twelve-point prism appears in transit diagrams and the prom lights.',
    accomplice: 'a contract engineer from the shield authority',
  },
  {
    id: 'the-registrar',
    name: 'The Null Registrar',
    method:
      'turns the academy identity registry into a citywide power-suppression broadcast',
    clue: 'Rescue logs contain graduates who never existed.',
    accomplice: 'a forged accreditation officer',
  },
  {
    id: 'the-tidemaker',
    name: 'The Tidemaker',
    method:
      'opens the harbor floodgates to force a controlled evacuation and privatize the waterfront',
    clue: 'Flood markers have been replaced with brass dials.',
    accomplice: 'a waterfront insurance broker',
  },
  {
    id: 'the-eclipse',
    name: 'The Eclipse Choir',
    method:
      "uses the fourth dance and broadcast towers to hypnotize the city's shield operators",
    clue: 'Unscheduled music notes recur in emergency broadcasts.',
    accomplice: "a concert producer with a falsified conductor's license",
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

export function campaignVillain(seed: number): VillainPlan {
  return CAMPAIGN_VILLAINS[
    Math.abs(Math.trunc(seed)) % CAMPAIGN_VILLAINS.length
  ]!
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
