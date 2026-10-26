import type { CoreSiteId, SiteId } from './cityMap'

export type AdditionalSiteId = Exclude<SiteId, CoreSiteId>
export type CityEvent = {
  title: string
  location: string
  scene: string
  options: {
    id: string
    label: string
    text: string
    influence: number
    danger: number
    trust: number
  }[]
}

// Two authored routes per landmark, not a generic NPC name substitution.
// Trust is recorded by district and can influence real civilian patrols.
export const DISTRICT_ENCOUNTERS: Record<AdditionalSiteId, CityEvent> = {
  'student-commons': {
    title: 'The Meal Nobody Funded',
    location: 'Student Commons',
    scene:
      'The student meal shelves are empty, yet the donor hologram says they are full. Mina finds invoices rerouted to an exclusive prom balcony. A terrified kitchen volunteer asks you not to reveal their name.',
    options: [
      {
        id: 'student-commons-help',
        label: 'Restore the pantry with volunteers',
        text: 'You document the diversion without identifying the volunteer. The kitchen opens before lunch and Mina offers to trace the missing shipments.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'student-commons-exploit',
        label: 'Keep the invoice for leverage',
        text: 'The prom treasurer gives you a restricted dining pass. The food shelves stay empty and students learn that evidence has a price.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  infirmary: {
    title: 'A Name Erased in Ink',
    location: 'Campus Infirmary',
    scene:
      "Kit finds an injured volunteer removed from the clinic's digital logs. The student is still in the bed, but the academy insurer says no incident occurred.",
    options: [
      {
        id: 'infirmary-help',
        label: 'Demand independent treatment',
        text: "Kit records the volunteer's testimony and brings in another medic. The student receives care and the academy must acknowledge the missing report.",
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'infirmary-exploit',
        label: 'Accept a quiet settlement',
        text: 'The insurer supplies private medicine in exchange for silence. The defective rescue suit remains in circulation, and Kit cannot warn its next wearer.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'training-arena': {
    title: 'The Sponsored Duel',
    location: 'Training Arena',
    scene:
      "A network wants Sol to lose a match so a wealthy trainee keeps a scholarship. Sol could win, but a backstage technician's unpaid wages depend on the sponsor's broadcast.",
    options: [
      {
        id: 'training-arena-help',
        label: 'Expose the contract before the duel',
        text: 'The school voids the staged bracket and Sol trains openly with the rival. A labor mediator helps the technician recover the wages.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'training-arena-exploit',
        label: 'Stage the defeat for access',
        text: 'Sol kneels beneath the arena lights. Your team gains a sponsor credential, and the audience decides rescue rankings are for sale.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'engineering-workshop': {
    title: 'The Off Switch',
    location: 'Engineering Workshop',
    scene:
      "Ash discovers a remote command chip inside a classmate's heroic armor. Faculty call it a safety override, but it can lock the wearer inside during a rescue.",
    options: [
      {
        id: 'engineering-workshop-help',
        label: 'Let the wearer choose the repair',
        text: 'The classmate selects a manual release. Students publish the risk report, and the workshop begins an accessible safety redesign.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'engineering-workshop-exploit',
        label: 'Copy the faculty override code',
        text: 'You gain remote control over a prototype suit. The wearer remains unaware, and every future partnership now rests on an invisible threat.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'botanical-conservatory': {
    title: 'A Cure with Roots',
    location: 'Botanical Conservatory',
    scene:
      'A rare vine produces a pain medicine needed by flood survivors. The institute owns its patent and has locked out the gardener who raised the plant.',
    options: [
      {
        id: 'botanical-conservatory-help',
        label: 'Negotiate a shared harvest',
        text: 'The gardener and Kit establish a careful harvest. Waterfront patients receive medicine at cost, while the institute retains research credit.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'botanical-conservatory-exploit',
        label: 'Sell exclusive cuttings',
        text: 'You receive a valuable laboratory contact and a private research pass. The patients hear about the treatment but cannot afford its licensing fee.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'student-dormitory': {
    title: 'The Borrowed Curfew Pass',
    location: 'Student Dormitory',
    scene:
      "The curfew pass of a vanished student appears beneath Nix's door. It could unlock the dean's private corridor, but it is also the family's only lead.",
    options: [
      {
        id: 'student-dormitory-help',
        label: "Trace the missing student's route",
        text: 'Nix uncovers a transit stop and tells the family in person. You lose the shortcut, but real volunteers join the search.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'student-dormitory-exploit',
        label: 'Use the pass before returning it',
        text: 'You gain access to confidential faculty schedules. Nix realizes the route interested you more than the person who vanished.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'ethics-hall': {
    title: 'Who Watches the Rescuers?',
    location: 'Ethics Hall',
    scene:
      "A civilian review panel asks why student heroes patrol neighborhoods without residents' consent. The dean offers to cancel the hearing if you sign a waiver.",
    options: [
      {
        id: 'ethics-hall-help',
        label: 'Hold a public accountability hearing',
        text: 'Imani moderates a difficult forum. Residents win published patrol rules and the right to report reckless interventions.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'ethics-hall-exploit',
        label: 'Sign for unrestricted authority',
        text: 'The dean grants broad patrol access. Neighborhoods begin filming your arrivals because nobody else is allowed to inspect what you do.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'academy-docks': {
    title: "The Relief Boat's Second Manifest",
    location: 'Academy Docks',
    scene:
      'A barge of emergency generators has three unregistered robotic guards hidden below decks. Dockworkers refuse to unload it without an inspection.',
    options: [
      {
        id: 'academy-docks-help',
        label: 'Inspect alongside the dockworkers',
        text: 'The generators reach the clinic after the machines are isolated. The union provides a shipping trail that might expose the buyer.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'academy-docks-exploit',
        label: 'Break the work stoppage',
        text: 'The generators arrive early, but a robotic guard escapes into the canal. Dockworkers file a grievance and withdraw their trust.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'waterfront-market': {
    title: 'The Price of Dry Ground',
    location: 'Waterfront Market',
    scene:
      'A protection broker offers flood barriers at rents the market cannot afford. Vendors have a cheaper plan, but their permits were denied without explanation.',
    options: [
      {
        id: 'waterfront-market-help',
        label: 'Help the vendors repair public drains',
        text: 'Residents build a protective channel and secure a hearing. The broker loses its monopoly, even if there is no grand heroic unveiling.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'waterfront-market-exploit',
        label: 'Accept the private barrier contract',
        text: 'Your team gains insulated equipment. The poorest vendors are priced out of the protected stalls before the next tide.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'transit-union': {
    title: 'The Last Safe Route',
    location: 'Transit Union',
    scene:
      'Drivers strike after the city hides defective brakes. A hospital still needs medicine, and the mayor wants student heroes to drive the same unsafe trains past the picket line.',
    options: [
      {
        id: 'transit-union-help',
        label: 'Plan a safe route with the drivers',
        text: 'Union volunteers design an alternative shuttle and medicine reaches the ward. The mayor must answer for the hidden inspection report.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'transit-union-exploit',
        label: 'Cross the strike under emergency powers',
        text: 'The shipment arrives first, but another carriage nearly derails. Drivers stop trusting academy rescue teams with their lives.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'neon-arcade': {
    title: 'The Game That Knows Too Much',
    location: 'Neon Arcade',
    scene:
      'An augmented-reality tournament predicts the secret identities of its student players. The creator calls it a behavioral model; scholarships are paid from biometric data sales.',
    options: [
      {
        id: 'neon-arcade-help',
        label: 'Audit the game with its players',
        text: 'Sol reveals how private movement data was extracted. Students claim refunds and the developer agrees to build opt-in protections.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'neon-arcade-exploit',
        label: 'Keep the predictive data',
        text: "You gain an enemy's movement pattern. Every classmate who played must now wonder whether you will use their secrets too.",
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'civic-hospital': {
    title: 'The Triage Camera',
    location: 'Civic Hospital',
    scene:
      'A new triage camera ranks patients by projected hero potential. A powerless child waits at the bottom of the list while administrators call the algorithm impartial.',
    options: [
      {
        id: 'civic-hospital-help',
        label: "Support the nurses' patient-first triage",
        text: 'Kit joins an independent triage crew and the child receives care. The administrator suspends the camera pending a safety review.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'civic-hospital-exploit',
        label: 'Recruit from the high-potential queue',
        text: 'You find a gifted patrol prospect. The waiting room learns that ordinary lives are being counted as less valuable.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'industrial-foundry': {
    title: 'A Sword for Every Soldier',
    location: 'Industrial Foundry',
    scene:
      'Workers discover their high-strength alloy order will arm an unaccountable militia. Closing the furnace too quickly would cut power to nearby family homes.',
    options: [
      {
        id: 'industrial-foundry-help',
        label: 'Help workers shut it down safely',
        text: 'The furnace cools without a blackout. An emergency wage fund protects workers while the militia contract becomes public.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'industrial-foundry-exploit',
        label: 'Ship the alloy to follow its buyers',
        text: 'You gain a traceable invoice and a dangerous contact. The militia receives its first armored shipment tonight.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  skyport: {
    title: 'No Corridor for the Lost',
    location: 'Comet Skyport',
    scene:
      "A refugee shuttle from Tess Helio's trade route requests clearance. The skyport controller demands its passengers reveal a hidden sanctuary before allowing them to land.",
    options: [
      {
        id: 'skyport-help',
        label: 'Land the shuttle without copying the map',
        text: "Volunteer pilots open a temporary runway. Tess's harbor stays confidential, and the controller must explain the coercive demand.",
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'skyport-exploit',
        label: 'Trade sanctuary coordinates for clearance',
        text: 'The shuttle lands immediately. Its passengers learn that those who control the gates now know where their families are hiding.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'media-spire': {
    title: 'The Broadcast with Two Endings',
    location: 'Media Spire',
    scene:
      'Two verified camera feeds show incompatible versions of the same rescue. One depicts a heroic evacuation; the other shows that rescuer blocking the only exit.',
    options: [
      {
        id: 'media-spire-help',
        label: 'Preserve both recordings and find witnesses',
        text: 'A neighborhood editor proves the footage came from opposing sides of the bridge. Both networks publish a correction.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'media-spire-exploit',
        label: 'Sell the cut that favors your faction',
        text: 'Your narrative dominates the evening feed. An honest witness is branded a liar and refuses to help future academy investigations.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'labor-museum': {
    title: 'The Hero They Unnamed',
    location: 'Labor Museum',
    scene:
      "The museum claims one early superhero saved a factory. Workers' surviving notebooks say the rescue was designed by their crews and later stripped of their names.",
    options: [
      {
        id: 'labor-museum-help',
        label: 'Restore the workers to the exhibit',
        text: 'Retired engineers reopen the notebooks and offer to train recruits in overlooked rescue techniques. The museum publishes the full story.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'labor-museum-exploit',
        label: 'Buy the notebooks as leverage',
        text: 'You discover a hidden estate vault but silence the rescue crews again. The estate promises influence over scholarships.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
  'night-bazaar': {
    title: 'The Clinic Under the Lanterns',
    location: 'Night Bazaar',
    scene:
      'An underground medic treats neighbors who cannot safely visit the city hospital. An academy raid is scheduled tonight, and the clinic uses stolen medicines from a corrupt depot.',
    options: [
      {
        id: 'night-bazaar-help',
        label: 'Protect the patients and negotiate supplies',
        text: 'Kit arranges discreet delivery with volunteer pharmacists. The clinic accepts independent safety checks without revealing its patients.',
        influence: 2,
        danger: -1,
        trust: 2,
      },
      {
        id: 'night-bazaar-exploit',
        label: 'Seize the patient ledger during the raid',
        text: 'You earn an official commendation and an enforcement contact. Patients flee into the alleys, too afraid to return for treatment.',
        influence: -2,
        danger: 1,
        trust: -2,
      },
    ],
  },
}

export function districtEncounterFor(siteId: SiteId): CityEvent | undefined {
  return Object.prototype.hasOwnProperty.call(DISTRICT_ENCOUNTERS, siteId)
    ? DISTRICT_ENCOUNTERS[siteId as AdditionalSiteId]
    : undefined
}
