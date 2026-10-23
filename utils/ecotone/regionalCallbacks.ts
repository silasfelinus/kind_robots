/**
 * Optional editorial finale payoffs for actually recorded regional deeds.
 * These are short, falsifiable consequences, not alternate collectible endings.
 * The wider ending may be hopeful or bittersweet irrespective of whether one
 * of these smaller commitments was fulfilled.
 */
export type RegionalCallback = {
  id: string
  choice: string
  flag: string
  priority: number
  text: string
  artMoment: string
}

export const REGIONAL_CALLBACKS: RegionalCallback[] = [
  {
    id: 'QW-5',
    choice: 'monitor-success',
    flag: 'creek_monitoring_committed',
    priority: 9,
    text: 'The crew kept the dated rota you signed instead of making your commitment into a legend. What grew was a habit of showing up, checking the culvert, and sharing measurements with the people who lived downstream.',
    artMoment:
      'Volunteer creek-monitoring sign-in sheet with four dated shifts, wet field notebook and simple water gauge, no miraculous instant forest restoration',
  },
  {
    id: 'QW-5',
    choice: 'monitor-failure',
    flag: 'creek_monitoring_delayed',
    priority: 9,
    text: 'That first too-large promise never made it onto the crew rota. You kept the safety syllabus; even in a dark future, the people who did the fieldwork were not obliged to pretend your intention was their work.',
    artMoment:
      'Unsigned volunteer roster and rain-damp safety training booklet on a quiet porch, no falsely completed monitoring shifts',
  },
  {
    id: 'WH-014',
    choice: 'investigate-failure',
    flag: 'wh_014_partial',
    priority: 4,
    text: 'The drainage crew kept your failed dye test in its log, so its next survey began with measured water and the photograph the volunteer actually took. The mushrooms still demand a formal apology for your methodology.',
    artMoment:
      'Rainy forest inspection table with a crossed-out green dye sketch, volunteer seep photograph and tiny fungal complaint slips; no solved pipe diagram',
  },
  {
    id: 'WH-026',
    choice: 'investigate-failure',
    flag: 'wh_026_partial',
    priority: 4,
    text: 'Your interrupted lighthouse count stayed pinned in the harbor office with empty spaces. The chart was not magically corrected; pilots kept gathering sightings rather than steering boats toward a promise you could not prove.',
    artMoment:
      'Harbor pilot pinning an interrupted flash tally beside an unfinished safety notice, Trinidad Head lost in fog; no confirmed navigation line',
  },
  {
    id: 'WH-052',
    choice: 'investigate-failure',
    flag: 'wh_052_partial',
    priority: 4,
    text: 'The resurvey request recorded the fishing crews’ detour costs beside your provisional sounding. The buoy is still on strike. No clerk gets to call an unmeasured shortcut safe just to make the paperwork smaller.',
    artMoment:
      'Humboldt Bay harbor counter with incomplete sounding sketch, detour fuel receipt and stranded picketing buoy outside; no safe shortcut indicated',
  },
  {
    id: 'WH-074',
    choice: 'investigate-failure',
    flag: 'wh_074_partial',
    priority: 5,
    text: 'The river kept the driftwood, but the witness kept her own photograph and the correction request you helped write. Her name did not become a solved clue just because somebody else wanted a ghost story.',
    artMoment:
      'Willow Creek witness holding a river photograph beside a consent-first correction request, personal name obscured; missing driftwood and unverified measurements',
  },
  {
    id: 'WH-094',
    choice: 'investigate-failure',
    flag: 'wh_094_partial',
    priority: 4,
    text: 'The contractor called the conflicting tree-ring counts a prophecy. The sawyer posted both unfinished tallies for everyone to scrutinize. The county archive preserved the disagreement, not the certainty someone hoped to sell.',
    artMoment:
      'Public redwood volunteer board with two visibly conflicting hand-drawn ring counts, fallen tree beyond and no removed wood sample',
  },
  {
    id: 'WH-114',
    choice: 'investigate-failure',
    flag: 'wh_114_partial',
    priority: 5,
    text: 'The missing case never came back and nobody restored the stranger’s memory on command. The crew saved the current warning you drew; the stranger kept her own unfinished description of her brother.',
    artMoment:
      'Dockside current-warning chart next to a stranger’s incomplete memory sketch, empty wet mooring where a case sank; nothing recovered',
  },
  {
    id: 'FR-MARA-01',
    choice: 'transparent-lease',
    flag: 'mara_second_studio_agreement',
    priority: 6,
    text: 'Mara’s second studio stayed hers. Its apprenticeship budget survived the first rent increase because the people who worked there were given a say in its future.',
    artMoment:
      'Two independent studio rooms with artist-authored name cards, lease and paid apprenticeship agreement',
  },
  {
    id: 'FR-KIT-01',
    choice: 'maker-credits',
    flag: 'kit_parade_credits',
    priority: 6,
    text: 'Kit’s parade roster kept the names of makers who wanted them listed and protected those who did not. The annual event grew stranger without becoming anybody’s exclusive brand.',
    artMoment:
      'Kinetic sculpture parade board with verified artist credits and chosen pseudonyms',
  },
  {
    id: 'FR-JUNIPER-01',
    choice: 'accessible-crossing',
    flag: 'juniper_accessible_path',
    priority: 6,
    text: 'Juniper learned to measure stewardship in people who could actually use the trail, as well as in the roots beneath it. The accessible path remains in the public plan.',
    artMoment:
      'Accessible forest path curving around living roots with workers and a walker using mobility support',
  },
  {
    id: 'FR-CEDAR-01',
    choice: 'community-license',
    flag: 'cedar_repeater_coop',
    priority: 6,
    text: 'Cedar’s little repeater became a locally governed network. His parents still argue cheerfully at the maintenance meetings, which is not a problem the co-op intends to fix.',
    artMoment:
      'Community radio co-op repair crew beside a modest repeater and transparent privacy charter',
  },
  {
    id: 'FR-ASSEMBLY-01',
    choice: 'share-skills',
    flag: 'assembly_shared_skills',
    priority: 7,
    text: 'The potluck became a modest exchange of practical skills, not a government or a club anyone had to join. You helped start one conversation that others carried on without you.',
    artMoment:
      'Public repair-and-soup table with neighbors teaching one another a mechanical trick',
  },
  {
    id: 'FR-ASSEMBLY-01',
    choice: 'make-space',
    flag: 'assembly_access_without_pressure',
    priority: 7,
    text: 'The potluck kept a quiet table and an accessible schedule. Some people stayed all day; others came for food and left. The door worked both ways.',
    artMoment:
      'A quiet accessible seating area and written schedule beside an optional community gathering',
  },
  {
    id: 'WH-014',
    choice: 'fungus-hearing',
    flag: 'wh_014_fungus_hearing',
    priority: 5,
    text: 'The fungal neighborhood association still attends water board meetings. Its first petition helped people notice an unmarked pipe; the association has since become insufferable about meeting minutes.',
    artMoment:
      'Meeting table with human water workers and small mushroom seats, publicly posted drainage records',
  },
  {
    id: 'WH-052',
    choice: 'buoy-bargain',
    flag: 'wh_052_buoy_contract',
    priority: 5,
    text: 'The harbor kept the one-tide bargain. Years later its labor agreements still list navigational charts as things that workers, even buoy-shaped workers, can dispute.',
    artMoment:
      'Laminated signed harbor contract beside accurate navigation charts and a safely moored buoy',
  },
  {
    id: 'WH-074',
    choice: 'witness-consent',
    flag: 'wh_074_witness_consent',
    priority: 5,
    text: 'The bridge warning survived without the river witness becoming a public exhibit. Their name was not a prize someone could earn by solving a mystery.',
    artMoment:
      'Publicly displayed flood-stage note with the witness name visibly redacted at their request',
  },
  {
    id: 'WH-094',
    choice: 'open-ring-record',
    flag: 'wh_094_open_ring_record',
    priority: 6,
    text: 'The strange redwood measurements remained in an open archive, uncertainty notes included. Future students argued over the record instead of paying for admission to a prophecy.',
    artMoment:
      'Public research table displaying open tree-ring data, provenance notes and a corrected measurement',
  },
  {
    id: 'WH-110',
    choice: 'credited-anonymity',
    flag: 'wh_110_credited_anonymity',
    priority: 5,
    text: 'The anonymous rescue crew got credit under its own chosen name without surrendering a single face to the sponsor. Other workshops adopted the same simple agreement.',
    artMoment:
      'Racers thanking a pseudonymous repair crew with food and tools, no portraits or sponsor branding',
  },
  {
    id: 'WH-114',
    choice: 'future-waterline',
    flag: 'wh_114_waterline_warning',
    priority: 6,
    text: 'Another crew found your bright waterline warning and stayed on shore. Their letter mentions no heroic rescue, only the quiet relief of being warned in time.',
    artMoment:
      'New bay crew reading bright waterline tape at the safe bank while equipment remains underwater',
  },
  {
    id: 'WH-014',
    choice: 'verified',
    flag: 'wh_014_verified',
    priority: 3,
    text: 'Because you traced the fungal complaint to a buried drainage pipe, the forest dispute acquired a public piece of evidence instead of another accusation about who belonged there.',
    artMoment:
      'Trail crew studying the exposed drainage line beside the mushroom colony, pipe invoice in view',
  },
  {
    id: 'WH-014',
    choice: 'care',
    flag: 'wh_014_care',
    priority: 2,
    text: 'The trail crew you called restored water to the mushrooms without crushing the colony. It was a small fix, but a practical alliance survived an absurd beginning.',
    artMoment:
      'Neighbors and trail crew adjusting runoff beneath a log while the mushrooms remain undisturbed',
  },
  {
    id: 'WH-026',
    choice: 'verified',
    flag: 'wh_026_verified',
    priority: 4,
    text: 'Your logged observations of the second Trinidad light helped boat crews treat the uncharted obstruction as a real risk, whether or not the phantom keeper was ever explained.',
    artMoment:
      'Trinidad harbor pilot consulting a radio log beneath the ordinary and phantom lights',
  },
  {
    id: 'WH-026',
    choice: 'care',
    flag: 'wh_026_care',
    priority: 3,
    text: 'You passed the warning through the harbor crews instead of chasing a ghost across dangerous water. Someone else was able to act because the message arrived intact.',
    artMoment:
      'Harbor crews sharing a written obstruction warning at the dock in fog',
  },
  {
    id: 'WH-052',
    choice: 'verified',
    flag: 'wh_052_verified',
    priority: 4,
    text: 'Your independent bearing showed that the missing channel buoy had been telling the truth about a chart that no longer matched the water.',
    artMoment:
      'Skipper and player comparing mismatched bay chart and vacant buoy position',
  },
  {
    id: 'WH-052',
    choice: 'care',
    flag: 'wh_052_care',
    priority: 4,
    text: 'The temporary channel marker your group placed let people navigate safely while the impossible discrepancy remained under investigation.',
    artMoment:
      'Working boat crew positioning a temporary channel warning without erasing the absent buoy mystery',
  },
  {
    id: 'WH-074',
    choice: 'verified',
    flag: 'wh_074_verified',
    priority: 3,
    text: 'The driftwood warning you checked against the river bank became a useful note about a vulnerable bridge, not a rumor used to blame an absent witness.',
    artMoment:
      'Marked bridge support, river-carved message and field notes in the same documentary frame',
  },
  {
    id: 'WH-074',
    choice: 'care',
    flag: 'wh_074_care',
    priority: 3,
    text: 'People you invited to inspect the river began watching the dangerous crossing together. Whatever made the driftwood speak, the volunteers were real.',
    artMoment:
      'Neighbors clearing driftwood and observing river heights from a safe bank',
  },
  {
    id: 'WH-090',
    choice: 'verified',
    flag: 'wh_090_verified',
    priority: 4,
    text: "You checked the strange forecast against actual Eel River measurements, leaving the volunteer station with an actionable warning rather than a prophecy about people's feelings.",
    artMoment:
      'Volunteer river desk with rain gauges, public map and a clearly annotated dangerous crossing',
  },
  {
    id: 'WH-090',
    choice: 'care',
    flag: 'wh_090_care',
    priority: 4,
    text: "The plain-language high-water bulletin you helped send reached neighbors who would never have understood the station's surreal emotional forecast.",
    artMoment:
      'Residents reading a clear high-water notice outside the volunteer weather station',
  },
  {
    id: 'WH-094',
    choice: 'verified',
    flag: 'wh_094_verified',
    priority: 4,
    text: 'The impossible rings you compared with climate records gave the future restoration argument a puzzle that could be checked, rather than a miracle someone could sell outright.',
    artMoment:
      'Careful tree-ring comparison at the fallen redwood, field measurements alongside the extra rings',
  },
  {
    id: 'WH-094',
    choice: 'care',
    flag: 'wh_094_care',
    priority: 5,
    text: 'Because you asked the stewards to protect the fallen redwood first, its strange rings remained in public care instead of disappearing into a private collection.',
    artMoment:
      'Volunteers sheltering the fallen tree ring section with an agreed stewardship notice',
  },
  {
    id: 'WH-110',
    choice: 'verified',
    flag: 'wh_110_verified',
    priority: 3,
    text: 'You documented a real repair beneath the cryptid rumors. The race crew could repeat the fix even without a photograph of the rescuers.',
    artMoment:
      'Close view of repaired kinetic axle and maker mark, strange helpers just beyond identifiable view',
  },
  {
    id: 'WH-110',
    choice: 'care',
    flag: 'wh_110_care',
    priority: 5,
    text: "The mysterious rescue team you protected from intrusive cameras kept helping stranded racers without becoming a sponsor's exhibit.",
    artMoment:
      'Kinetic racers thanking anonymous roadside rescuers with food and tools, no invasive cameras',
  },
  {
    id: 'WH-114',
    choice: 'verified',
    flag: 'wh_114_verified',
    priority: 4,
    text: "Your effort to save the crew's equipment left them with the future flood inscription, a clue they could show the next person rather than demand belief.",
    artMoment:
      'Recovered bay equipment bearing the strange flood date, crew comparing it with the tide',
  },
  {
    id: 'WH-114',
    choice: 'care',
    flag: 'wh_114_care',
    priority: 5,
    text: "You chose the stranger's missing memory in the brief minute when time and water exchanged places. The crew lost equipment, but that person carried a loved one's face home.",
    artMoment:
      'Stranger holding a recovered personal photograph at the bay crossing while the tide changes',
  },
  {
    id: 'WH-115',
    choice: 'verified',
    flag: 'wh_115_verified',
    priority: 6,
    text: "When officials tried to count the county's futures, you checked which deeds were real. The final record could no longer award you credit for a kindness you had not done.",
    artMoment:
      'Race officials comparing a marked ballot ledger with verified journal entries before a vote',
  },
  {
    id: 'WH-115',
    choice: 'care',
    flag: 'wh_115_care',
    priority: 6,
    text: 'You demanded that the people affected by each possible county future have a voice. The meeting was less tidy afterward, and the account of its costs was more honest.',
    artMoment:
      'Open race-finish meeting with residents reviewing competing county proposals in daylight',
  },
  {
    id: 'WH-120',
    choice: 'verified',
    flag: 'wh_120_verified',
    priority: 7,
    text: "At the county's last strange accounting you corrected the ledger before it became legend. The future was still contested, but at least the votes began with deeds rather than boasts.",
    artMoment:
      'Corrected county ledger at Ferndale with one false credit crossed out and witnessed entries kept',
  },
  {
    id: 'WH-120',
    choice: 'care',
    flag: 'wh_120_care',
    priority: 7,
    text: 'You insisted on an open minute book and another chance for excluded neighbors to speak. Whatever future followed, the record showed who had been present for the choice.',
    artMoment:
      'Ferndale meeting table with open minutes and a crowd making room for late-arriving residents',
  },
]

export function chosenRegionalCallbacks(flags: string[]): RegionalCallback[] {
  return REGIONAL_CALLBACKS.filter((callback) =>
    flags.includes(callback.flag),
  ).sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id))
}
