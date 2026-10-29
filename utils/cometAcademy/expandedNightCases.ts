import type { Incident, PowerId, Grade } from './rules'
import { FINAL_NIGHT_MISSIONS } from './finalNightCases'

export type MissionApproach = 'rescue' | 'investigate'
export type ExpandedMission = {
  incident: Incident
  thread: 'academy' | 'transit' | 'harbor' | 'civic'
  briefing: string
  refused: string
  consequences: Record<Grade, string>
  tactics: Record<MissionApproach, string>
  secret: string
}

// Each case has a real site, stakes, an individual failure/refusal and a
// tangible mystery. Different tactics trade rescue certainty for evidence.
export const FIRST_WAVE_MISSIONS: readonly ExpandedMission[] = [
  {
    incident: {
      id: 'frog-serum',
      title: 'The Frog Beneath the Bell',
      site: 'Academy Chemistry Tower',
      briefing:
        'A midnight chemical alarm seals the academy tower. Inside, the brilliant inventor Dr. Frog has begun a dangerous amphibian transformation and refuses to abandon the unfinished antidote while a janitor coughs behind the pressure door.',
      need: 'biotech' as PowerId,
      risk: 4,
      allegiance: 'shared' as Incident['allegiance'],
      art: 'Cinematic night rescue at Academy Chemistry Tower: the frog beneath the bell, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.',
    },
    thread: 'academy' as ExpandedMission['thread'],
    briefing:
      'A midnight chemical alarm seals the academy tower. Inside, the brilliant inventor Dr. Frog has begun a dangerous amphibian transformation and refuses to abandon the unfinished antidote while a janitor coughs behind the pressure door.',
    refused:
      'The fire crew evacuates the janitor too late to preserve his lungs. Dr. Frog escapes through a drain with a broken formula and a new suspicion that the academy wanted the serum destroyed.',
    consequences: {
      honors:
        'The janitor breathes freely and Dr. Frog preserves a stable antidote sample. He shows you a falsified safety signature linking the bell tower to other disappearances.',
      pass: 'You get the janitor and the formula out, but the transformation continues. Dr. Frog agrees to a supervised lab only if nobody calls him a specimen.',
      partial:
        "You save the janitor, but the formula crystallizes in the cold and the professor's hands begin to web. The dean labels it a student prank despite the medical record.",
      failed:
        "The pressure door bursts, ruining the antidote while the janitor is injured. Dr. Frog blames the academy's silence and vows to make his next experiment impossible to confiscate.",
    },
    tactics: {
      rescue: 'Evacuate the janitor before testing the serum',
      investigate: 'Study the corrupted antidote under emergency lights',
    },
    secret:
      "Your familiarity with biotech identifies a reversible enzyme buried beneath the contamination. The professor tells you the antidote's proper name, but asks you not to publish it without his consent.",
  },
  {
    incident: {
      id: 'mirror-court',
      title: 'The Prom Queen in Forty Mirrors',
      site: 'Theater Wing',
      briefing:
        'Forty rehearsal mirrors show forty different winners of the prom election, but only one reflection includes a missing stagehand. The drama club thinks the mirrors are haunted; a frightened student says the reflections are rehearsal footage from tomorrow.',
      need: 'empathy' as PowerId,
      risk: 4,
      allegiance: 'rogue' as Incident['allegiance'],
      art: 'Cinematic night rescue at Theater Wing: the prom queen in forty mirrors, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.',
    },
    thread: 'academy' as ExpandedMission['thread'],
    briefing:
      'Forty rehearsal mirrors show forty different winners of the prom election, but only one reflection includes a missing stagehand. The drama club thinks the mirrors are haunted; a frightened student says the reflections are rehearsal footage from tomorrow.',
    refused:
      "The mirrored room is boarded shut. By morning the stagehand's name has vanished from the cast list, and the drama club starts leaving flowers outside a locked door.",
    consequences: {
      honors:
        'You find the stagehand alive behind the false proscenium and expose a voting algorithm that swapped real votes with projections. The students demand a transparent election.',
      pass: 'The stagehand comes out and the mirrors are switched off. The prom committee promises an inquiry but keeps the sponsor that paid for the algorithm.',
      partial:
        'You free the student, yet several mirror recordings are wiped. A nominee is publicly accused without enough evidence, deepening the rift between performers.',
      failed:
        'The projections break into the audience and a panicked crowd tramples the stage. The stagehand is evacuated injured while the election sponsor buys the security footage.',
    },
    tactics: {
      rescue: 'Lead the cast to a safe exit behind the mirrors',
      investigate: 'Ask each reflected voter what they remember',
    },
    secret:
      'Your empathy picks out the only reflection that feels fear rather than applause. It is the real stagehand signaling from the projection booth.',
  },
  {
    incident: {
      id: 'stolen-hour',
      title: 'The Hour That Never Happened',
      site: 'Academy Observatory',
      briefing:
        'Every clock on campus stops at 1:13 AM. An astronomy student reports that the campus infirmary has disappeared for exactly one hour, taking three patients and a nurse with it. An unmarked transit gate pulses below the observatory.',
      need: 'spatial' as PowerId,
      risk: 5,
      allegiance: 'villain' as Incident['allegiance'],
      art: 'Cinematic night rescue at Academy Observatory: the hour that never happened, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.',
    },
    thread: 'academy' as ExpandedMission['thread'],
    briefing:
      'Every clock on campus stops at 1:13 AM. An astronomy student reports that the campus infirmary has disappeared for exactly one hour, taking three patients and a nurse with it. An unmarked transit gate pulses below the observatory.',
    refused:
      'The infirmary returns at dawn with no record of its missing hour. Patients remember somebody asking them to sign waivers they cannot read, and the nurse quits without explanation.',
    consequences: {
      honors:
        'You anchor the infirmary to the present and rescue everyone before the gate resets. The missing hour contains a recording of academy officials arranging a covert clinical trial.',
      pass: 'The patients return with their consent forms intact, but the person running the gate escapes. The nurse gives the forms to a civil-rights lawyer.',
      partial:
        'One patient returns a day older and the others are frightened. The academy calls it harmless temporal drift, while the nurse insists somebody must be accountable.',
      failed:
        'The gate collapses and sends the clinic into another hour. Rescuers find it after dawn with exhausted staff and no operating records, and the academy denies authorizing the experiment.',
    },
    tactics: {
      rescue: 'Anchor the missing patients to the present',
      investigate: 'Trace who signed for the extra hour',
    },
    secret:
      'Your spatial intuition discovers the gate was folded around a single falsified timestamp. Recovering it exposes who rented the missing hour.',
  },
  {
    incident: {
      id: 'ghost-ticket',
      title: "Ticket to a Train That Wasn't Built",
      site: 'Transit Exchange',
      briefing:
        "Passengers queue for a midnight platform that does not appear on any city map. Their tickets print the names of people who died in the old tunnel fire. A conductor says the new route is a trick designed to seize the station's public land.",
      need: 'technopathy' as PowerId,
      risk: 4,
      allegiance: 'shared' as Incident['allegiance'],
      art: "Cinematic night rescue at Transit Exchange: ticket to a train that wasn't built, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.",
    },
    thread: 'transit' as ExpandedMission['thread'],
    briefing:
      "Passengers queue for a midnight platform that does not appear on any city map. Their tickets print the names of people who died in the old tunnel fire. A conductor says the new route is a trick designed to seize the station's public land.",
    refused:
      "You leave the platform closed. The passengers spend the night waiting outside as a private developer posts a demolition notice over the station's memorial wall.",
    consequences: {
      honors:
        "You redirect the phantom train into a safe siding and recover documents proving the station was sold without the workers' consent. The memorial remains standing.",
      pass: "The passengers reach a real platform and the phantom tickets are collected as evidence. The developer still controls the station's software contract.",
      partial:
        'The phantom train stops, but the ticketing system deletes dozens of legitimate passes. Commuters are stranded while transit workers organize a protest.',
      failed:
        'The ghost service runs through an occupied tunnel. Several passengers are hurt and the developer uses the confusion to close the station for good.',
    },
    tactics: {
      rescue: 'Get the passengers away from the nonexistent track',
      investigate: "Inspect the tickets' original routing instructions",
    },
    secret:
      "Your technopathy isolates the dead names as a checksum copied from the old fire victims. The false route was signed with the developer's private key.",
  },
  {
    incident: {
      id: 'borrowed-faces',
      title: 'The Night Bus of Borrowed Faces',
      site: 'Narrows Bus Depot',
      briefing:
        'A school shuttle rolls into the depot carrying seven adults who all appear to have the same face. A frightened driver says the transit system replaced their IDs after they reported a dangerous brake fault.',
      need: 'empathy' as PowerId,
      risk: 3,
      allegiance: 'rogue' as Incident['allegiance'],
      art: 'Cinematic night rescue at Narrows Bus Depot: the night bus of borrowed faces, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.',
    },
    thread: 'transit' as ExpandedMission['thread'],
    briefing:
      'A school shuttle rolls into the depot carrying seven adults who all appear to have the same face. A frightened driver says the transit system replaced their IDs after they reported a dangerous brake fault.',
    refused:
      'The passengers are detained for lacking valid identities. A supervisor blames them for the broken bus while the actual brake defect remains unreported.',
    consequences: {
      honors:
        "You restore the riders' original records and organize their testimony around the brake failure. They decide together how and when their identities may be released.",
      pass: "The bus is stopped safely and the drivers receive temporary IDs, but their old employment records remain frozen in an insurer's database.",
      partial:
        'You free the riders, but a leaked face-scan file puts them at risk of harassment. The depot apologizes without revealing who sold their data.',
      failed:
        'The passengers flee into traffic when security boards the bus. Two are injured and the transit company calls them impostors on its evening broadcast.',
    },
    tactics: {
      rescue: 'Stop the defective bus and protect its riders',
      investigate: 'Learn why their identities were overwritten',
    },
    secret:
      'Your empathy recognizes seven distinct memories beneath the identical facial projection. The system cannot explain why its supposedly identical riders all fear the same manager.',
  },
  {
    incident: {
      id: 'rail-heart',
      title: "The Conductor's Mechanical Heart",
      site: 'Old Switchyard',
      briefing:
        'A veteran conductor is trapped inside an experimental brake engine whose flywheel is spinning fast enough to tear the carriage apart. The engine was donated to the city as a graduation gift from a secret academy benefactor.',
      need: 'kinetic' as PowerId,
      risk: 5,
      allegiance: 'hero' as Incident['allegiance'],
      art: "Cinematic night rescue at Old Switchyard: the conductor's mechanical heart, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.",
    },
    thread: 'transit' as ExpandedMission['thread'],
    briefing:
      'A veteran conductor is trapped inside an experimental brake engine whose flywheel is spinning fast enough to tear the carriage apart. The engine was donated to the city as a graduation gift from a secret academy benefactor.',
    refused:
      "The flywheel destroys the old locomotive. The conductor survives with injuries, but the donor's contract quietly transfers control of the rail yard to a private sponsor.",
    consequences: {
      honors:
        "You stop the flywheel without breaking the conductor's prosthetic heart and expose the donation agreement. Transit workers insist on testing every new engine themselves.",
      pass: 'The conductor is rescued and the rail yard stays open. The engine is impounded, leaving hundreds of commuters on replacement buses. The overnight mechanics demand an independent review before any donated machine returns to their tracks.',
      partial:
        "The flywheel slows but damages the conductor's medical device. A hospital team stabilizes them, and the yard crew refuses future experimental repairs.",
      failed:
        'The flywheel shatters the carriage before crews can disconnect it. Several workers are hurt and the sponsor arrives with a prewritten waiver.',
    },
    tactics: {
      rescue: 'Brace the flywheel and free the conductor',
      investigate: 'Investigate why the engine cannot shut itself down',
    },
    secret:
      "Your kinetic control reveals that the wheel is drawing energy from the conductor's heartbeat. A tiny switch marked with the donor's initials feeds the dangerous loop.",
  },
  {
    incident: {
      id: 'granny-shuttle',
      title: "Granny Mayhem's Last School Bus",
      site: 'Harbor Flood Barrier',
      briefing:
        'Granny Mayhem has commandeered an ancient yellow school bus to evacuate elders from a flooded boarding house. A private rescue company demands payment before lifting the bridge. Granny answers by driving straight toward the rising barrier.',
      need: 'kinetic' as PowerId,
      risk: 4,
      allegiance: 'hero' as Incident['allegiance'],
      art: "Cinematic night rescue at Harbor Flood Barrier: granny mayhem's last school bus, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.",
    },
    thread: 'harbor' as ExpandedMission['thread'],
    briefing:
      'Granny Mayhem has commandeered an ancient yellow school bus to evacuate elders from a flooded boarding house. A private rescue company demands payment before lifting the bridge. Granny answers by driving straight toward the rising barrier.',
    refused:
      "The bus is trapped and Granny leads residents across the bridge on foot. Two elders are hospitalized, and the rescue company's invoice arrives before the ambulance.",
    consequences: {
      honors:
        'You keep the bridge stable long enough for Granny to ferry everyone across twice. The elders reclaim the boarding house keys and Granny mails the rescue company a bill for her labor.',
      pass: 'Everyone reaches dry ground, but the bus is ruined. Granny insists the city hear exactly who refused to open the bridge. At breakfast, the evacuated residents vote to keep the boarding house open and give her a standing ovation.',
      partial:
        'The bridge buckles under the bus and several residents need treatment. Granny blames the corporation, but admits she gambled with people who trusted her.',
      failed:
        'The bus slides toward the tide before rescue divers can secure it. Residents are pulled from the water and the rescue company calls the accident reckless heroism.',
    },
    tactics: {
      rescue: 'Brace the bridge and get the residents out',
      investigate: 'Investigate who ordered the bridge held shut',
    },
    secret:
      "Your kinetic strength holds the bridge while Granny retrieves the company's electronic lockbox. Its timestamps prove that officials watched the evacuation and withheld assistance.",
  },
  {
    incident: {
      id: 'tomorrow-tide',
      title: 'The Tide That Arrived Tomorrow',
      site: 'Harbor Weather Station',
      briefing:
        "A storm surge hits the harbor six hours before the weather agency predicts it. A child finds a bottle containing tomorrow's evacuation order, signed by the academy's own emergency director.",
      need: 'elemental' as PowerId,
      risk: 5,
      allegiance: 'shared' as Incident['allegiance'],
      art: 'Cinematic night rescue at Harbor Weather Station: the tide that arrived tomorrow, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.',
    },
    thread: 'harbor' as ExpandedMission['thread'],
    briefing:
      "A storm surge hits the harbor six hours before the weather agency predicts it. A child finds a bottle containing tomorrow's evacuation order, signed by the academy's own emergency director.",
    refused:
      'The harbor floods without a formal evacuation order. Residents are rescued from rooftops and discover the city had sold advance warnings to an insurer.',
    consequences: {
      honors:
        "You redirect the surge into a disused dry dock and show the future warning to the neighborhood's chosen marshals. Nobody has to wait for official permission to evacuate.",
      pass: 'Families reach higher streets while some shops take water damage. A weather scientist agrees to testify about the delay in issuing the warning.',
      partial:
        'The surge slows, but residents on the far pier never receive the alert. A relief crew arrives at sunrise and demands an audit of the forecasting system.',
      failed:
        'The seawall fails before the warnings spread. Injured neighbors spend the night in school gyms while officials blame unlicensed weather equipment.',
    },
    tactics: {
      rescue: 'Move the surge away from the occupied streets',
      investigate: "Find out who received tomorrow's warning first",
    },
    secret:
      'Your elemental sense finds two superimposed weather fronts. The impossible one originates from the private forecasting antenna, not the sea.',
  },
  {
    incident: {
      id: 'pearl-pact',
      title: "The Pearl Diver's Bargain",
      site: 'Old Harbor Tunnel',
      briefing:
        'A salvage diver emerges from a flooded tunnel holding a pearl containing a live recording of a council meeting. A contractor offers to pay for the pearl if the diver gives up the names of every witness who helped retrieve it.',
      need: 'spatial' as PowerId,
      risk: 4,
      allegiance: 'villain' as Incident['allegiance'],
      art: "Cinematic night rescue at Old Harbor Tunnel: the pearl diver's bargain, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.",
    },
    thread: 'harbor' as ExpandedMission['thread'],
    briefing:
      'A salvage diver emerges from a flooded tunnel holding a pearl containing a live recording of a council meeting. A contractor offers to pay for the pearl if the diver gives up the names of every witness who helped retrieve it.',
    refused:
      'The contractor takes the pearl and the tunnel is sealed. The diver disappears from public view, and the council denies the recorded meeting occurred.',
    consequences: {
      honors:
        "You return the pearl to the witnesses and build a safe route through the tunnel. They release the recording on their own terms with the diver's identity protected.",
      pass: 'The diver and pearl are recovered, but the contractor manages to discredit part of the recording. Neighbors organize an independent listening session.',
      partial:
        "You retrieve the pearl but the diver is arrested for trespass. The council cites the arrest to avoid discussing its hidden meeting. The diver's neighbors organize a dawn vigil outside the police station and refuse to surrender the recording.",
      failed:
        'The salvage equipment floods the tunnel and a witness is injured. The contractor destroys the only copy of the recording and claims the diver invented it.',
    },
    tactics: {
      rescue: 'Extract the diver without surrendering the pearl',
      investigate: 'Trace how the council meeting was trapped inside it',
    },
    secret:
      "Your spatial gift unfolds the pearl's chamber into a temporary hearing room. Every witness can now verify the recording without revealing the diver's name.",
  },
  {
    incident: {
      id: 'halo-contract',
      title: "The Halo Factory's Midnight Contract",
      site: 'Civic Towers',
      briefing:
        'A factory has produced hundreds of glowing hero halos that compel their wearers to agree with any instruction from city hall. Workers are preparing a school donation when one halo starts issuing its own commands.',
      need: 'technopathy' as PowerId,
      risk: 5,
      allegiance: 'rogue' as Incident['allegiance'],
      art: "Cinematic night rescue at Civic Towers: the halo factory's midnight contract, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.",
    },
    thread: 'civic' as ExpandedMission['thread'],
    briefing:
      'A factory has produced hundreds of glowing hero halos that compel their wearers to agree with any instruction from city hall. Workers are preparing a school donation when one halo starts issuing its own commands.',
    refused:
      'You ignore the shipment. At morning assembly, students wearing the halos loudly endorse a policy nobody remembers debating, and one worker loses their job for asking questions.',
    consequences: {
      honors:
        'You disable the obedience code without destroying the helmets and let factory workers testify about the sponsor. The academy cancels the distribution and demands contract transparency.',
      pass: 'The halos are impounded and no student is compelled, but the factory owner claims the seizure makes the workers responsible for the loss.',
      partial:
        'Some halos are shut down before shipping; others reach a private school. Volunteers help the students remove them, and a labor inspector begins investigating.',
      failed:
        'A prototype takes over the loading machinery. Several workers are hurt and the company blames a malicious student intrusion while keeping the contract.',
    },
    tactics: {
      rescue: 'Stop the factory shipment before morning assembly',
      investigate: 'Study the command embedded in the glowing halos',
    },
    secret:
      'Your technopathy recognizes a school attendance signature inside the obedience code. The donor is using student records as an encryption key.',
  },
  {
    incident: {
      id: 'hospital-saint',
      title: 'The Saint Who Charged for Miracles',
      site: 'Civic Hospital',
      briefing:
        "An anonymous healer has been curing patients in the night ward, then demanding repayment through an insurer that owns the patients' future wages. A young nurse asks you to help without harming the people still waiting for treatment.",
      need: 'biotech' as PowerId,
      risk: 4,
      allegiance: 'shared' as Incident['allegiance'],
      art: 'Cinematic night rescue at Civic Hospital: the saint who charged for miracles, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.',
    },
    thread: 'civic' as ExpandedMission['thread'],
    briefing:
      "An anonymous healer has been curing patients in the night ward, then demanding repayment through an insurer that owns the patients' future wages. A young nurse asks you to help without harming the people still waiting for treatment.",
    refused:
      'The healer vanishes with the repayment ledger. Patients receive bills they never agreed to and the nurse starts collecting their stories for a public inquiry.',
    consequences: {
      honors:
        'You preserve the treatments and destroy the coercive billing mechanism in front of independent witnesses. The nurse creates a patient-led oversight committee.',
      pass: 'The patients keep their treatments and the contracts are frozen pending investigation. Hospital workers insist on reviewing every new therapy before it is used.',
      partial:
        "The healer stops treating patients and the ward loses a night's supplies. Several people need extended care while administrators debate who may authorize a miracle.",
      failed:
        'The insurer locks the ward when challenged. Patients are transferred under emergency conditions and the healer threatens to take their medicines elsewhere.',
    },
    tactics: {
      rescue: 'Protect the existing patients and halt the billing',
      investigate: 'Test what the alleged miracle does to the body',
    },
    secret:
      "Your biotech knowledge proves the cure is ordinary medicine disguised with a luminous side effect. The insurer's secret formula is not a miracle, only a patent claim.",
  },
  {
    incident: {
      id: 'lightning-election',
      title: 'Election Night Under Artificial Lightning',
      site: 'Media Spire Plaza',
      briefing:
        'During a late school-board election, an artificial lightning storm knocks out every voting machine except one owned by the candidate promising to replace the academy with a private hero program.',
      need: 'elemental' as PowerId,
      risk: 5,
      allegiance: 'villain' as Incident['allegiance'],
      art: 'Cinematic night rescue at Media Spire Plaza: election night under artificial lightning, dramatic wide composition with identifiable civilians and the real stakes, no words, saturated superhero comic illustration.',
    },
    thread: 'civic' as ExpandedMission['thread'],
    briefing:
      'During a late school-board election, an artificial lightning storm knocks out every voting machine except one owned by the candidate promising to replace the academy with a private hero program.',
    refused:
      'The surviving machine announces a winner before the count is verified. Poll workers save the paper ballots and organize a recount while the candidate calls them saboteurs.',
    consequences: {
      honors:
        "You ground the false storm and help poll workers conduct a transparent paper count. The candidate's private weather contractor is caught with a transmitter on the roof.",
      pass: 'Voters complete the count safely, but the weather contractor escapes. An independent observer keeps the machine logs for a later hearing.',
      partial:
        'You stop the storm but the ballot room loses power. Poll workers preserve enough records to challenge the result, and both campaigns accuse each other.',
      failed:
        'The storm strikes the polling line and several residents are injured. The private program claims only its heroes can keep elections safe.',
    },
    tactics: {
      rescue: 'Protect voters and restore safe access to the ballots',
      investigate: 'Track the source of the impossible storm',
    },
    secret:
      "Your elemental affinity identifies the storm's artificial pulse pattern. A tower transmitter broadcasts each strike just before the private candidate requests a recount.",
  },
]

export const EXPANDED_MISSIONS: readonly ExpandedMission[] = [
  ...FIRST_WAVE_MISSIONS,
  ...FINAL_NIGHT_MISSIONS,
]

export const EXPANDED_INCIDENTS: Incident[] = EXPANDED_MISSIONS.map(
  (mission) => mission.incident,
)

export function expandedMissionFor(id: string): ExpandedMission | undefined {
  return EXPANDED_MISSIONS.find((mission) => mission.incident.id === id)
}
