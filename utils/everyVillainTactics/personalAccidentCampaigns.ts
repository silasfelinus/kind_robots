/** Authored personal Crossfire aftermath and earned finales. Shared tactical
 * objectives and save validation are unchanged. Fixed cast is a later pass. */
export type PersonalCampaign = {
  chapters: readonly (readonly [string, string, string, string])[]
  endings: readonly [string, string, string, string]
}

export const ACCIDENT_CAMPAIGNS: Record<string, PersonalCampaign> = {
  'accident-fire': {
    chapters: [
      [
        'The inspection stamp',
        'The rescued students remember a gas-company stamp on the shutter.',
        'The recorder preserves the serial number that links the shutter to the gas-main inspectors.',
        "The stamp disappears into the company's emergency repair order.",
      ],
      [
        'The safety laboratory',
        'A researcher carries out a prototype shutoff valve and offers its design to the neighborhood kitchens.',
        "The lab's invoices trace the supposedly independent safety tests back to the gas company.",
        'The locked-down lab keeps its prototype, and the company announces a proprietary solution.',
      ],
      [
        'The food-truck crossing',
        'The medics escort vendors back to their carts; one remembers the inspection crew leaving the rally early.',
        "Traffic logs place the gas company's service van at the rally minutes before the explosion.",
        'The trucks reopen under a new security contract with no witness hearing.',
      ],
      [
        'The kitchen broadcast',
        "The engineer broadcasts the names of kitchens that still have faulty shutoffs, with their owners' permission.",
        "The transmitter carries the falsified inspection reports to the city's independent newsrooms.",
        'A company-sponsored safety message replaces the testimony on the air.',
      ],
      [
        'Beneath the burners',
        'The tunnel crew shuts the original leaking supply line and escorts the workers to the surface.',
        'The buried maintenance book identifies the supervisor who ordered the bypass.',
        'The supply line is secured without a public accounting of who authorized it.',
      ],
      [
        'An apron at the ballroom',
        'The kitchen workers bring the evacuated students out through the catering doors.',
        'The recovered orders reach the guests before the sponsor can remove its name from the program.',
        "The emergency caterers are told to reopen under the squad's new safety rules.",
      ],
    ],
    endings: [
      'The vendors open a cooperative safety workshop, and Backdraft works the first shift beside the cooks he once frightened.',
      "The inspection records go to the public inquiry, including the signature of Backdraft's former boss.",
      'The kitchens reopen, but the missing inspection sheets leave the workers organizing for a second hearing.',
      "The company offers Backdraft its controlling shares; the city's kitchens wait to see whether their new protector will charge them.",
    ],
  },
  'accident-air': {
    chapters: [
      [
        'The airfield stamp',
        'The students identify the airfield sensor in the emergency shutters.',
        "The copied serial identifies the sensor recalled after Skyline's accident.",
        "The sensor is impounded before the airfield's role can be investigated.",
      ],
      [
        'The wind tunnel',
        'The technicians escape with a portable weather monitor that can warn the rescue teams.',
        'Calibration files show that the board concealed an unsafe lightning forecast.',
        'The board retains the wind tunnel and the right to classify its results.',
      ],
      [
        'The landing zone',
        'Medics establish a safe landing area on the crossing and teach volunteers the signal.',
        'The signal history reveals how the airfield routed its emergency alerts away from the public.',
        'The crossing reopens under a flight exclusion order nobody was invited to challenge.',
      ],
      [
        'The missing weather bulletin',
        'The rooftop engineer broadcasts a warning that reaches the gliders still over the city.',
        'The unedited forecast shows which alerts were withheld before the jump.',
        'The transmitter falls silent and the board claims there was never a warning.',
      ],
      [
        'Grounded for a reason',
        'Tunnel workers help Skyline practice standing still while they evacuate through the pressure doors.',
        'The pressure ledger ties the same contractor to the airfield and the underground locks.',
        "The pressure system is seized without the workers' account of its failure.",
      ],
      [
        'The last landing',
        'The ballroom crowd clears a landing space for the injured rather than cheering a stunt.',
        "The airfield board's withheld forecast reaches the prom's public screens.",
        'The crowd is ordered to stand clear while the squad controls the emergency skyway.',
      ],
    ],
    endings: [
      'Skyline lands at the public hearing, with the rescue volunteers waiting on the ground.',
      "The airfield's forecast archive becomes public evidence, and the board must answer for the silenced warnings.",
      'The airfield remains open, but the missing forecast leaves the families demanding a new inquiry.',
      "Skyline holds the city's emergency airspace; pilots and passengers have to ask whose silence is being purchased.",
    ],
  },
  'accident-earth': {
    chapters: [
      [
        'Nine days beneath the floor',
        'The students describe an old quarry support beam that buckled under the stage.',
        'The vault plans show the same omitted reinforcement as the Old Quarry collapse.',
        "The auditorium is braced, but the builder's identity is withheld.",
      ],
      [
        'The load test',
        'Researchers escape with a low-cost load sensor the tunnel crews can maintain themselves.',
        'The load reports reveal that the contractor certified rock samples it had never tested.',
        "The lab's structural model becomes another private construction asset.",
      ],
      [
        'The pavement remembers',
        'The crossing medics work alongside sandhogs to free passengers from the broken road.',
        'Transit plans expose the shortcut that routed the new line through unstable ground.',
        'The route reopens after the displaced workers are removed from the construction site.',
      ],
      [
        'The quarry hearing',
        "The engineer transmits the tunnel workers' testimony while rescuers hold the rooftop stair.",
        "The recovered feed preserves the foreman's report that the planning office refused to file.",
        "The feed is shut down before the workers can challenge the city's account.",
      ],
      [
        'The original tunnel',
        'The reactor crew escorts survivors through the old excavation and puts their names on the rescue board.',
        "The buried survey shows where the nine missing days were erased from the company's timeline.",
        'The excavation is secured as a private access route.',
      ],
      [
        'The foundation of the dance floor',
        'Students and sandhogs hold the ballroom passage together instead of relying on a single pillar.',
        "The original survey is displayed beside the academy's architectural plans.",
        'The floor stands, but the new owner of its foundations dictates the exit.',
      ],
    ],
    endings: [
      'Cornerstone joins a worker-led safety council and learns to leave a shift to another pair of hands.',
      'The Old Quarry report reaches the families with the names of the officials who signed it.',
      'The tunnel is reopened, but the workers must continue their fight for an independent inspection.',
      'Cornerstone claims the underground rights and the surface learns what its foundations cost.',
    ],
  },
  'accident-water': {
    chapters: [
      [
        'Eleven minutes in the pond',
        "The students identify the reactor fittings used in the stage's coolant system.",
        "The valve record matches the equipment from Tidewarden's school-tour accident.",
        'The coolant system is locked behind a new company access badge.',
      ],
      [
        'A specimen no longer',
        'The researchers carry out the medical records and agree to let Tidewarden decide how they are released.',
        'The lab files show the company approved the tour despite a failed barrier inspection.',
        'The company keeps the research files and calls the lockdown a containment success.',
      ],
      [
        'The dry route',
        'Medics guide stranded passengers out without assuming that Tidewarden can carry everybody.',
        "The crossing's drainage record shows the power company's unauthorized discharge route.",
        "The company receives a new drainage permit before the passengers' testimony is heard.",
      ],
      [
        "The water board's signal",
        'The engineer issues an evacuation warning to the riverfront neighborhoods.',
        'The broadcast records prove the contamination report was edited before publication.',
        'The official broadcast declares the water safe without releasing the measurements.',
      ],
      [
        'The old cooling channel',
        'The reactor workers open the bypass and bring the trapped crew up through the dry tunnel.',
        'The valve records establish what happened during the eleven-minute accident.',
        'The cooling channel is isolated and its original service logs remain classified.',
      ],
      [
        'A public settlement',
        'Lifeguards and students escort the prom guests through a dry service passage.',
        'The reactor safety records reach the ballroom guests and the independent inquiry.',
        'The water supply returns under an emergency authority controlled by the winning squad.',
      ],
    ],
    endings: [
      'Tidewarden signs a public settlement and shares the rescue credit with the ordinary lifeguards.',
      'The power company must release the cooling-pond records without turning Tidewarden into an exhibit.',
      'The survivors are safe, but the contamination inquiry remains unresolved.',
      'The water authority asks Tidewarden to set the terms of service, and the city must decide who owns its thirst.',
    ],
  },
  'accident-discipline': {
    chapters: [
      [
        'A fragment out of time',
        "The students identify a satellite component in the shutter's timing mechanism.",
        'The controller log ties the timing device to the satellite contractor.',
        'The component is returned to a classified contractor locker.',
      ],
      [
        'The timing laboratory',
        'A technician carries the injured out while the Second Hand holds the mechanism still long enough to open the door.',
        "The lab records reveal the satellite's intended timing experiment.",
        'The contractor retains the timing mechanism and offers to license its effects.',
      ],
      [
        'One second to cross',
        'Medics set up a crossing where passengers can move at their own pace.',
        "The traffic logs show which contractor purchased priority access to the city's timing network.",
        'The crossing operates on a schedule controlled by the squad.',
      ],
      [
        'The delayed transmission',
        'The engineer sends the warning at ordinary speed, with enough time for the neighborhoods to respond.',
        "The synchronized broadcast reveals the contractor's hidden test window.",
        'The transmitter is seized and its broadcast window is sold as an exclusive slot.',
      ],
      [
        "The fragment's return",
        'The reactor crew opens the manual release while the Second Hand helps carry a worker.',
        'The underground clock archive confirms where the satellite fragment was meant to land.',
        "The timing archive becomes the squad's proprietary resource.",
      ],
      [
        'A dance at ordinary speed',
        'Students escort the ballroom guests out without rushing the slowest person.',
        'The satellite test record reaches the families of the other people affected.',
        'The squad takes control of the ballroom clock and decides when the doors open.',
      ],
    ],
    endings: [
      "The Second Hand returns the fragment and teaches a class where progress isn't measured in stolen seconds.",
      "The contractor's timeline becomes public record, and the Second Hand chooses to testify without the fragment.",
      "The students leave safely, but the contractor's missing test records keep the dispute alive.",
      'The timing contractor offers exclusive rights to the Second Hand, and the city begins bargaining for its minutes.',
    ],
  },
  'accident-genius': {
    chapters: [
      [
        'The unlabeled beaker',
        "The rescued students recognize the lab's sample labels on the control cabinet.",
        "The recorder links the cabinet to the pharmaceutical company's missing trial batch.",
        'The cabinet is sealed under a research confidentiality order.',
      ],
      [
        'A result worth sharing',
        'The researchers carry out a working prototype and its repair instructions.',
        'The lab notebook proves the unlabeled batch bypassed the review process.',
        "The experimental designs remain in the company's patent vault.",
      ],
      [
        'A variable named neighbor',
        'The medics explain why the efficient-looking evacuation route fails passengers who need assistance.',
        'The transport data exposes a model that removed disabled passengers from its demand estimates.',
        'The crossing is optimized for throughput without hearing from the people excluded.',
      ],
      [
        'A peer review on the roof',
        'The engineer broadcasts the evacuation plan in a form the neighbors can correct.',
        "The raw dataset exposes the edits that made the company's results look convincing.",
        'The squad replaces the broadcast with its own unreviewed model.',
      ],
      [
        'The failed calculation',
        'The reactor team uses a manual fallback when the perfect-looking containment model fails.',
        'The archived trial record establishes how the pharmaceutical lab concealed its errors.',
        'The reactor model is secured without releasing its failed predictions.',
      ],
      [
        'A room full of exceptions',
        "Students use Eureka's shared instructions to adapt the ballroom rescue to different needs.",
        'The original trial results appear alongside the corrected calculations.',
        'The ballroom is evacuated under a mandatory optimization plan.',
      ],
    ],
    endings: [
      'Eureka releases her designs and invites the people who use them to correct the next version.',
      "The pharmaceutical company's trial records are published with every failed result intact.",
      'The rescue succeeds but the missing dataset leaves a second public review necessary.',
      "Eureka receives control of the city's optimization system; the neighbors demand the right to remain exceptions.",
    ],
  },
  'accident-birthright': {
    chapters: [
      [
        'The crest on the lock',
        "The students recognize the Valcourt crest on the academy's emergency hardware.",
        'The recorder traces the shutter purchase to the family trust.',
        'The crest is removed before anybody asks who approved the purchase.',
      ],
      [
        "The heir's laboratory",
        'Researchers escape with the equipment the trust funded and agree to independent oversight.',
        "The lab invoices expose a family grant used to cover an earlier hero's failure.",
        'The trust retains the patents and issues a statement praising the squad.',
      ],
      [
        'The family name at the crossing',
        'Medics rescue commuters without asking them to recognize the crest.',
        'The crossing records connect the family foundation to a privatized emergency service.',
        'The foundation advertises the reopened crossing as another Valcourt success.',
      ],
      [
        'The cape on camera',
        "The engineer broadcasts ordinary rescuers' names instead of the dynasty's slogan.",
        'The unedited footage establishes which family official suppressed the earlier incident.',
        "The family logo replaces the engineer's warning on the city screens.",
      ],
      [
        'The trophy room below',
        'The tunnel workers carry damaged family relics out beside the injured crew.',
        "The hidden archive identifies the disasters omitted from the dynasty's history.",
        'The trophy collection is recovered without the records that explain its provenance.',
      ],
      [
        'A mantle shared',
        'Students open the ballroom doors while Captain Valcourt holds the damaged frame.',
        "The family's full incident archive reaches the guests before the awards ceremony.",
        'The trust sponsors the evacuation and insists on its name above the exit.',
      ],
    ],
    endings: [
      "The mantle becomes a team emblem, and Captain Valcourt opens the family's records to the people who were omitted.",
      "The dynasty's missing incident reports reach an independent public inquiry.",
      "The prom guests are safe, but the incomplete archive leaves the family's reputation contested.",
      "The trust offers Captain Valcourt control of the city's hero sponsorships, and every hero must decide whether to sign.",
    ],
  },
  'accident-social': {
    chapters: [
      [
        'The borrowed amplifier',
        "The students identify the Comet Broadcasting amplifier in the shutter's alarm circuit.",
        "The recorder preserves the signal that triggered Chorus's transformation.",
        'The broadcaster repossesses the amplifier before the students can testify.',
      ],
      [
        'A silent rehearsal',
        'Researchers evacuate using hand signals and choose whether to join the calming song.',
        'The lab traces show how the broadcaster tested an involuntary emotional response.',
        'The broadcaster retains the amplifier design and calls the experiment a success.',
      ],
      [
        'The crowd sets the tempo',
        'Medics lead passengers through the crossing without making them share a single emotion.',
        'The traffic recording reveals the commercial signal hidden in the emergency messages.',
        "The crowd is instructed to follow the squad's broadcast rather than the medics' signals.",
      ],
      [
        'A microphone with a switch',
        'The engineer warns the neighborhoods through ordinary speech; listeners can turn the signal off.',
        'The recovered transmission identifies who bought access to the emotional amplifier.',
        'The rooftop station signs an exclusive signal contract with the winning squad.',
      ],
      [
        'The quiet frequency',
        'The tunnel crew uses a written evacuation plan while the amplifier is disconnected.',
        "The buried relay logs expose the sponsor's hidden broadcast trials.",
        'The relay is captured without a way for the workers to opt out of its signal.',
      ],
      [
        'A chorus by invitation',
        'Students guide the prom guests out and choose whether to join the final song.',
        "The sponsor's full broadcast contract appears on the ballroom screens.",
        'The winning squad controls the music and the emergency announcements.',
      ],
    ],
    endings: [
      "Chorus performs at a neighborhood concert with an opt-in signal, a quiet room and no sponsor deciding the audience's feelings.",
      'The broadcasting trials become public evidence and the station must disclose every unauthorized test.',
      "The ballroom empties safely, but the missing relay records leave the sponsor's influence unresolved.",
      'The broadcaster offers Chorus a citywide contract; listeners organize to keep a switch they can control.',
    ],
  },
}
