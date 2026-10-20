/**
 * Optional editorial finale payoffs for actually recorded regional deeds.
 * These are short, falsifiable consequences, not alternate collectible endings.
 * The wider ending may be hopeful or bittersweet irrespective of whether one
 * of these smaller commitments was fulfilled.
 */
export type RegionalCallback = {
  id: string
  choice: 'verified' | 'care'
  flag: string
  priority: number
  text: string
  artMoment: string
}

export const REGIONAL_CALLBACKS: RegionalCallback[] = [
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
