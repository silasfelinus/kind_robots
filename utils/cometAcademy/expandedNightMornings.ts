import type { MorningGrade } from './earlyNightMornings'

/** Five next-morning consequences for each of the twenty-four expanded
 * night cases, so the school day never contradicts the night's result. */
export const EXPANDED_NIGHT_MORNINGS: Record<
  string,
  Record<MorningGrade, string>
> = {
  'frog-serum': {
    honors:
      'Dr. Frog leaves a sealed vial in your locker with a note in careful, webbed handwriting: the falsified signature, and a request that you choose who sees it first.',
    pass: "The supervised lab opens before first period. Dr. Frog insists the door sign read 'Professor', and asks your team to make sure nobody changes it.",
    partial:
      "The janitor returns to work with an inhaler and his medical record, asking which student will tell the dean that the 'prank' nearly killed him.",
    failed:
      "The janitor's bandaged hands are the first thing the class sees at assembly. Dr. Frog's lab is padlocked, and someone has scratched 'they wanted it destroyed' into the door.",
    refused:
      'The janitor is missing from the morning shift. His coworkers tape a hospital visiting schedule to the chemistry tower, beside a drain cover nobody has bolted shut.',
  },
  'mirror-court': {
    honors:
      "The student council posts every raw ballot in the hallway. The rescued stagehand runs the count projector, and the sponsor's name is taped over in black marker.",
    pass: "The mirrors are draped in black cloth for rehearsal. The stagehand thanks you quietly, then asks why the sponsor's banner still hangs over the stage.",
    partial:
      'The accused nominee eats lunch alone while half the drama club wears pins demanding proof. The wiped recordings have become a rumor that grows every period.',
    failed:
      "The theater wing is taped off and the stagehand's crutches lean against the cast board. The sponsor thanks campus security, not the students who tried.",
    refused:
      'Flowers pile up outside the locked theater wing. The cast list has one blank line, and nobody can agree whose name used to fill it.',
  },
  'stolen-hour': {
    honors:
      'The covert-trial recording plays at a closed faculty meeting, and three officials miss assembly. The nurse asks your team to stand with the patients when they speak.',
    pass: 'A civil-rights lawyer waits in the infirmary lobby with the consent forms. The nurse asks the class to write down exactly what they saw at 1:13 AM.',
    partial:
      'The patient who came back a day older sits in your first class, unsure which homework is due. The academy memo calls it drift; the nurse posts her own account beside it.',
    failed:
      'The infirmary reopens with exhausted staff and no records. Every campus clock has been reset, and the dean denies the experiment ever had a signature.',
    refused:
      "The nurse's locker is empty by first bell. Patients compare waivers they cannot remember signing, and every clock on campus runs exactly one hour slow.",
  },
  'ghost-ticket': {
    honors:
      'Transit workers carry the recovered sale documents to the memorial wall and read them aloud during the morning rush. Commuters stop to listen before they board.',
    pass: "The phantom tickets sit in an evidence binder at the station office. Workers thank the class, then ask who will challenge the developer's software contract.",
    partial:
      'Commuters with deleted passes queue outside the academy gates, late for work. Transit workers hand out protest flyers and ask the class to sign.',
    failed:
      "The station is chained shut with a developer's padlock. Injured passengers' families leave the ghost tickets at the gate, each printed with a name from the old fire.",
    refused:
      'The demolition notice now covers half the memorial wall. Passengers who waited all night outside the station walk past the academy on a longer commute.',
  },
  'borrowed-faces': {
    honors:
      'The riders send the academy one signed statement, released on their own terms. It names the brake defect first, and their identities only where they chose to.',
    pass: 'The night-bus drivers start work on temporary IDs and ask the class to help petition the insurer that froze their employment records.',
    partial:
      'A leaked face-scan photo spreads across student phones before lunch. Two riders ask the academy to get it taken down; nobody can say who sold the file.',
    failed:
      "The broadcast calling the riders impostors replays in the cafeteria. Two passengers are still in hospital, and the bus's brakes have never been inspected.",
    refused:
      "The detained riders are released at dawn without apology. The supervisor's report blames them for the crash; the faulty brake still sits on the depot floor.",
  },
  'rail-heart': {
    honors:
      'The conductor returns to the rail yard with a steady prosthetic heartbeat. The donation agreement is posted on the depot door, and workers now test every new engine themselves.',
    pass: 'Replacement buses crawl past the academy all morning. The conductor sends a thank-you card, and the mechanics ask the class to back an independent engine review.',
    partial:
      "The conductor's hospital team asks the academy for a statement about the damaged medical device. The yard crew has posted a sign: no more experimental repairs.",
    failed:
      "The injured rail workers are named at the depot gate before the first train. The sponsor's prewritten waiver is pinned beside the list, still unsigned.",
    refused:
      "The rail yard opens under a private sponsor's banner. The conductor's coworkers ask why the academy left a donated engine to wreck their old locomotive.",
  },
  'granny-shuttle': {
    honors:
      'Granny Mayhem bills the rescue company for two bridge crossings and posts the receipt on the boarding house door. The elders want the rescuers at their key-return ceremony.',
    pass: 'The ruined bus sits in the boarding house lot with flowers on the hood. Granny Mayhem asks the academy to testify about who refused to open the bridge.',
    partial:
      "Granny Mayhem visits the residents she gambled with at the clinic. She brings soup, an apology and a list of the corporation's bridge-closure orders.",
    failed:
      "Divers' photographs of the bus at the tide line run in the morning paper. The rescue company calls it reckless heroism, and the boarding house goes quiet.",
    refused:
      "Two elders are still in hospital. The rescue company's invoice is taped to the boarding house door, and Granny Mayhem has written 'paid in full by nobody' across it.",
  },
  'tomorrow-tide': {
    honors:
      'The neighborhood marshals run a practice evacuation before breakfast, and nobody waits for permission. The future warning hangs in the harbor co-op window.',
    pass: 'Shopkeepers mop out flooded stalls while the weather scientist books a hearing date. Families on the higher streets carry breakfast down to those who lost stock.',
    partial:
      'Far-pier residents arrive at the academy with soaked bedding and one question: why did their alert never come? The relief crew wants the forecast audit made public.',
    failed:
      'Injured neighbors sleep in the school gym as classes begin around their cots. Officials blame unlicensed weather equipment; the residents blame the delay.',
    refused:
      'Rooftop survivors learn the city sold its early warnings to an insurer. Their list of who knew, and when, passes hand to hand outside the academy gates.',
  },
  'pearl-pact': {
    honors:
      "The witnesses play the recording at a harbor meeting, the diver's face blurred as promised. The council's hidden meeting is now the only topic in civics class.",
    pass: "Neighbors host a listening session at the harbor co-op. The contractor's edited version circulates too, and students argue over which one is real.",
    partial:
      'The diver is still in a cell for trespass. The neighbors keep their vigil going and ask the academy to carry the recording to the council in person.',
    failed:
      "An injured witness's family brings the waterlogged recorder to the academy. The contractor's statement says the diver invented the meeting.",
    refused:
      "The sealed tunnel's concrete is still wet. The diver has vanished from public view, and the council has scheduled a vote on the contractor's next harbor permit.",
  },
  'halo-contract': {
    honors:
      'Factory workers testify at a morning press conference, holding the deactivated halos. The academy publishes the sponsor contract with its obedience clause highlighted.',
    pass: "The impounded halos sit in a city warehouse. The owner's lawyers send pay-docking notices to the workers, who ask the class to stand with them at the gate.",
    partial:
      'Private-school students arrive with red marks where the halos were pried loose. A labor inspector sets up in the academy library and starts taking statements.',
    failed:
      "The loading-dock injuries lead the morning news under a headline blaming a student intruder. The company's contract is renewed before lunch.",
    refused:
      'At assembly, students in halos endorse a policy nobody remembers debating. The worker who asked questions waits outside the factory holding a termination letter.',
  },
  'hospital-saint': {
    honors:
      'The patient-led oversight committee meets for the first time in the hospital chapel. The nurse invites one student from the rescue to sit as a witness.',
    pass: 'Frozen contracts mean nobody is billed this morning. Hospital workers post a review checklist on the ward door and ask who approved the miracle at all.',
    partial:
      'The ward runs short of supplies by breakfast. Patients who need extended care send their families to ask the academy who pays for the night it stopped.',
    failed:
      "Transferred patients wake in the corridors of a hospital across the city. The healer has posted a price list for treatments 'available elsewhere'.",
    refused:
      "Unexpected bills land in mailboxes across the ward's neighborhood. The nurse has started a public archive of patients' stories and wants your account too.",
  },
  'lightning-election': {
    honors:
      "The paper count is certified at dawn. Poll workers pin a photograph of the contractor's rooftop transmitter beside the real results on the school-board bulletin.",
    pass: 'The count stands, but the weather contractor is still missing. An independent observer asks the class for signed statements before the machine-log hearing.',
    partial:
      'Both campaigns stand at the academy gate blaming each other for the blackout. Poll workers carry in a box of preserved records and ask for help recounting.',
    failed:
      'Injured voters queue at the clinic while the private hero program runs ads promising safer elections. The candidate wants the academy replaced by spring.',
    refused:
      "The machine's winner is sworn in before the recount begins. Poll workers guard the paper ballots outside the board office while the candidate calls them saboteurs.",
  },
  'detention-moon': {
    honors:
      'The rescued prefect names the science sponsor at a student assembly. By noon, the detention record of every student caught in the gravity trial has been wiped clean.',
    pass: 'The disciplinary board has quietly removed the academy gym from its inspection tour. Detention students turn up anyway, carrying photographs of the fake moon and asking who authorized their gravity trial.',
    partial:
      'Two detention students limp into class with pressure bandages and disciplinary notices. The board wants an apology for touching a restricted exhibit; their parents want the wiped core.',
    failed:
      "A crane lifts twisted beams from the gym roof while the dean's 'prank' statement plays over the PA. The moon's memory core is gone, and so are the sponsor's visitor logs.",
    refused:
      "Families of the students left drifting overnight receive disciplinary notices at breakfast. Next week's enrollment list already includes one student nobody has seen since.",
  },
  'promise-stairs': {
    honors:
      "The adviser's office is empty by first period. The scholarship contracts sit on a library table, where any student can read the terms they were forced to promise.",
    pass: 'The scholarship office opens a public complaint desk. Every student who left the impossible staircase now wants to see the terms they signed and learn who enforced them.',
    partial:
      "Broadcast promises are all anyone talks about at lunch. Two old friends refuse to share a table, and the adviser's office posts a statement denying everything.",
    failed:
      'Two bandaged rescuers sit in the front row while faculty seals the archive. The scholarship student spends homeroom answering accusations about promises made under duress.',
    refused:
      "The exhausted scholarship student sleeps through first period in the infirmary. The adviser's lecture on keeping promises is printed in the morning bulletin.",
  },
  'mascot-uprising': {
    honors:
      'The student council votes to fund a habitat for the living mascot. The costume department posts a list of every sentient prop it destroyed, under protest.',
    pass: "The greenhouse enclosure hums with new growth. The disposal policy is postponed, but the department's memo still calls the mascot 'equipment'.",
    partial:
      'The costume shop finds tiny green shoots beneath the doors at dawn. Former performers demand to know whether their old mascot is alive and whether its future belongs to anyone else.',
    failed:
      'The costume racks are ash, the technician is bandaged, and something moves in the air vents. Former performers swear the mascot believes they set it up.',
    refused:
      "Each former performer gets a voice message in their own voice, asking why they let it burn. The fire marshal finds the building's exit plans missing.",
  },
  'future-graduates': {
    honors:
      "Workers reinforce the platform while tomorrow's passengers watch. The graduate who testified asks to sit in on today's class before going home to their own hour.",
    pass: "At breakfast, a transit worker places tomorrow's ruined graduation ticket on the classroom table. The depot has reinforced the broken switch, but nobody knows who wrote the warning.",
    partial:
      'The half-collapsed platform is fenced off. Passengers who forgot their futures wait on benches, and the worker who warned everyone is barred from speaking to the class.',
    failed:
      "The switchyard is still smoking. Injured maintenance crews are named at the depot, and the transit authority's statement calls the footage a hologram.",
    refused:
      "The worker who warned the morning shift has been fired. The phantom train's last transmission, a platform collapse, is copied onto lockers across campus.",
  },
  'rail-orchestra': {
    honors:
      'The freed musicians play their own final chord outside the station at dawn. A transit union steward hands the class a copy of the illegal advertising contract.',
    pass: 'The morning trains arrive in silence. Their musicians gather outside the station with blank pay slips and ask the heroes to testify about the enforced concert.',
    partial:
      "Two musicians with ringing ears hand out leaflets correcting the publicist's footage. Commuters stop the class at the gate to ask which version is true.",
    failed:
      "An emergency-brake scar runs the length of the platform. Injured passengers are named beside the promoter's statement, and the implant invoices are gone.",
    refused:
      'Rail workers who missed their shifts gather with the musicians, whose docked wages are written on cardboard, one line for every hour they were forced to play.',
  },
  'shadow-inspector': {
    honors:
      "The real inspector walks the class through the contractor's secret testing agreement. Passengers reunited with their memories line up to sign as witnesses.",
    pass: 'The ticket inspector begins returning lost passenger memories by hand. A family invites you to a recognition ceremony while the transit contractor quietly challenges the evidence.',
    partial:
      "A passenger who cannot remember a child's name waits at the new witness desk. Families ask the class to help reconstruct what the shadow took.",
    failed:
      "Rescuers who forgot their assignments are sent home to rest. The terminal is empty; the contractor's trucks hauled the turnstiles away before dawn.",
    refused:
      'The inspector is charged with fraud. Outside the courthouse, commuters who forgot the way home hold up tickets printed with memories instead of destinations.',
  },
  'double-lighthouse': {
    honors:
      'The harbor lighthouse keeper holds a community meeting about the false beacon. Both crews bring charts from their rescue, and private yachts are no longer exempt from inspection.',
    pass: "Both captains thank the class by radio, but the yacht's registration is still unknown. The keeper asks students to help sift the night's harbor logs for a name.",
    partial:
      "Harbor volunteers collect replacement medical supplies in the academy lobby. On the morning news, the yacht's owner accuses the lighthouse keeper of negligence.",
    failed:
      "The keeper is suspended and a temp runs the lamp. Injured passengers' families stand on the pier holding the chart that led them onto the wall.",
    refused:
      'Coastal families fill the pier with signs asking why a private beacon outranked the lighthouse. The medical boat still sits aground in the morning fog.',
  },
  'colossal-ring': {
    honors:
      "The workers' seawall is being rebuilt with its own stolen supports. The donor's engraved dedication is now the most photographed object in the harbor.",
    pass: "The city finds seawall bolts on the giant ring's wreckage. Dockworkers challenge the donor's charity gala with a demand for replacement barriers and back wages.",
    partial:
      "Residents stack sandbags along the weakened seawall before school. Two boat crews ask the class to explain how a 'romantic miracle' nearly sank them.",
    failed:
      'Shattered steel still clogs the channel. The donor sends charity money to the hospital along with a silence agreement no injured passenger has signed.',
    refused:
      'Harbor homes flood on the morning tide. The workers who found the missing seawall supports set up a table outside the academy to collect statements.',
  },
  'cloud-zoo': {
    honors:
      'Harbor workers name themselves guardians of the new sanctuary. The handlers bring the class the permit-free shipping orders, signed by a company director.',
    pass: 'At dawn, fog-born creatures gather peacefully over Pier Thirteen. Residents ask to help maintain a sanctuary, while the shipping company threatens to reclaim the living cargo.',
    partial:
      "Dockworkers search the drains for the tiny whale before their shift. The handlers have filed theft complaints against them and still won't say why the nest was sealed.",
    failed:
      'The sedated dockworker is recovering and the pier is closed to independent rescuers. Frightened fog creatures have been sighted alone in the shipping lanes.',
    refused:
      "Warehouses along the docks are full of wounded fog creatures sheltered by residents. The shipping company's statement says it has no idea what cargo was lost.",
  },
  'shadow-court': {
    honors:
      'The clerk releases the complete records at dawn. Families who hid from warrants come out to hear the judge withdraw them, and ask the class to stand beside them.',
    pass: "The justice annex withdraws some warrants and refuses to explain others. The public defender asks every rescued witness to help challenge the court's predictive contract.",
    partial:
      "Three people are still in custody. The clerk's saved recordings reach the public defender in a bakery box, and she asks the class for witness statements.",
    failed:
      'The annex is boarded up after the riot. The judge cites the disorder to defend the predictive system, and injured families wait outside for answers.',
    refused:
      'Preemptive warrants are served at breakfast. The counselor who refused to name students is suspended, and her office door is covered in thank-you notes.',
  },
  'ambulance-detour': {
    honors:
      "The drivers bring their authenticated dispatch messages to the hospital board, and the clinic's sponsor is named publicly before first period.",
    pass: "Hospital medics carry the false ambulance routes into the morning briefing. Emergency dispatchers demand a public audit of the private clinic's billing and destination records.",
    partial:
      'The patient from the third ambulance is out of emergency surgery. Medics petition for the city to keep control of routing and want students to sign.',
    failed:
      "Patients moved in the dark are still being treated. The clinic's servers are empty, and the dispatcher insists its maps worked as designed.",
    refused:
      "The city receives an invoice from the private dispatcher for ambulance services it never provided. Patients' families ask the class where their calls went.",
  },
  'shield-auction': {
    honors:
      "The public emergency team runs the shield grid again. The engineer's evidence of the manufactured shortage is printed in full in the morning edition.",
    pass: "The shields hold, but the auctioneer's surviving contracts are still in force. Neighborhood representatives ask the class to back permanent public oversight.",
    partial:
      "The shield grid's overnight failures are debated in every classroom. Residents of the exposed wards ask whether the school will help them challenge the auction contract before prom.",
    failed:
      'Rescue crews injured in the meteor drill are named on the morning broadcast. Whole streets slept unshielded, and the auctioneer blames public operators.',
    refused:
      "The harbor ward schools opened as shelters overnight. Families eat breakfast watching a replay of the bidders' televised gala on the cafeteria screen.",
  },
}
