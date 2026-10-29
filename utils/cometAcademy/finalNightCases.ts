import type { Incident, PowerId, Grade } from './rules'
import type { ExpandedMission } from './expandedNightCases'

// Each story is an original, city-scale escalation with a unique refusal,
// differentiated grades, and an evidence/power secret in its own district.
export const FINAL_NIGHT_MISSIONS: readonly ExpandedMission[] = [
  {
    incident: {
      id: 'detention-moon',
      title: 'The Moon in Detention',
      site: 'Academy Gymnasium',
      briefing:
        'A miniature moon hangs above the academy gym, dragging loose metal lockers into orbit. Seven students serving detention are suspended inside a ring of keys and trophies. The dean insists the moon is a harmless exhibit, but the gravity pulses whenever a student says their own name.',
      need: 'spatial' as PowerId,
      risk: 5,
      allegiance: 'villain' as Incident['allegiance'],
      art: 'Wide cinematic superhero illustration, Academy Gymnasium at midnight: the moon in detention. A miniature moon hangs above the academy gym, dragging loose metal lockers into orbit. Seven students serving detention are suspended inside a ring of keys and trophies. The dean insists the moon is a harmless exhibit, but the gravity pulses whenever a student says their own name. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.',
    },
    thread: 'academy' as ExpandedMission['thread'],
    briefing:
      'A miniature moon hangs above the academy gym, dragging loose metal lockers into orbit. Seven students serving detention are suspended inside a ring of keys and trophies. The dean insists the moon is a harmless exhibit, but the gravity pulses whenever a student says their own name.',
    refused:
      "Without a rescue, the gym is sealed and the students spend the night drifting against the ceiling. Their families receive disciplinary notices for an experiment nobody consented to, and one missing student appears in next week's enrollment records.",
    consequences: {
      honors:
        'You bring every student to the floor and stabilize the artificial moon without destroying its recordings. A trapped prefect identifies the science sponsor who ordered a clandestine gravity trial on detained students.',
      pass: 'The students return to the floor before the next gravity pulse. The moon is locked in a faculty vault, where its sponsor refuses to explain why it responds to student names.',
      partial:
        "Two students need treatment for pressure injuries, and the moon's memory core is wiped by a remote signal. The discipline board tries to blame the pupils for touching a restricted exhibit.",
      failed:
        "The gym's roof tears open under the changing gravity. Rescuers pull the students from twisted beams, but the sponsor removes the core during evacuation and the dean calls the incident a prank.",
    } as Record<Grade, string>,
    morning:
      'The disciplinary board has quietly removed the academy gym from its inspection tour. Detention students turn up anyway, carrying photographs of the fake moon and asking who authorized their gravity trial.',
    tactics: {
      rescue: "Anchor the students before the moon's next orbit",
      investigate:
        'Track the gravity pulse through the missing enrollment files',
    },
    secret:
      "Your spatial power isolates a hidden second orbit carrying the sponsor's records. You return both the students and their stolen attendance histories, forcing a public hearing instead of another detention.",
  },
  {
    incident: {
      id: 'promise-stairs',
      title: 'The Staircase of Unkept Promises',
      site: 'Academy Archive Stairwell',
      briefing:
        'The archive stairwell grows a new landing for every promise a student has broken. An exhausted scholarship student is trapped thirty floors above a building with only four floors. A voice on the intercom offers to shorten the stairs if somebody agrees to surrender their graduation place.',
      need: 'empathy' as PowerId,
      risk: 4,
      allegiance: 'shared' as Incident['allegiance'],
      art: 'Wide cinematic superhero illustration, Academy Archive Stairwell at midnight: the staircase of unkept promises. The archive stairwell grows a new landing for every promise a student has broken. An exhausted scholarship student is trapped thirty floors above a building with only four floors. A voice on the intercom offers to shorten the stairs if somebody agrees to surrender their graduation place. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.',
    },
    thread: 'academy' as ExpandedMission['thread'],
    briefing:
      'The archive stairwell grows a new landing for every promise a student has broken. An exhausted scholarship student is trapped thirty floors above a building with only four floors. A voice on the intercom offers to shorten the stairs if somebody agrees to surrender their graduation place.',
    refused:
      'The staircase remains locked until morning. The scholarship student is carried out exhausted, and a faculty adviser tells the entire class that promises are more important than student safety.',
    consequences: {
      honors:
        'You find the real person behind the intercom and persuade the trapped students to state the promises they were coerced into making. The stairwell shrinks, and the adviser loses control of the scholarship contracts.',
      pass: 'Every trapped student descends safely, but the voice on the intercom escapes into the records system. A graduating class signs a petition to inspect the agreements imposed on them.',
      partial:
        'The rescue team reaches the student with minutes to spare, but several confidential promises are broadcast across campus. Friendships fracture while the adviser denies responsibility.',
      failed:
        'The false stairwell folds across the archive, injuring two rescuers. Faculty orders the records sealed while the student spends the morning answering accusations about promises made under duress.',
    } as Record<Grade, string>,
    morning:
      'The scholarship office opens a public complaint desk. Every student who left the impossible staircase now wants to see the terms they signed and learn who enforced them.',
    tactics: {
      rescue: 'Bring the exhausted students down without bargaining',
      investigate: 'Ask who benefits each time a promise becomes a floor',
    },
    secret:
      "Your empathy distinguishes a sincere promise from one signed under pressure. The magic breaks only around consent, revealing the dean's secret ledger of coerced graduation deals.",
  },
  {
    incident: {
      id: 'mascot-uprising',
      title: 'The Mascot Who Would Not Die',
      site: 'Academy Costume Basement',
      briefing:
        'An abandoned school mascot has grown roots through its costume and begun talking in the voices of dozens of discarded performers. The costume department wants to burn it before prom, while students inside the basement hear it asking for a name and a place to sleep.',
      need: 'biotech' as PowerId,
      risk: 4,
      allegiance: 'rogue' as Incident['allegiance'],
      art: 'Wide cinematic superhero illustration, Academy Costume Basement at midnight: the mascot who would not die. An abandoned school mascot has grown roots through its costume and begun talking in the voices of dozens of discarded performers. The costume department wants to burn it before prom, while students inside the basement hear it asking for a name and a place to sleep. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.',
    },
    thread: 'academy' as ExpandedMission['thread'],
    briefing:
      'An abandoned school mascot has grown roots through its costume and begun talking in the voices of dozens of discarded performers. The costume department wants to burn it before prom, while students inside the basement hear it asking for a name and a place to sleep.',
    refused:
      "The mascot is incinerated and the costume department declares the problem solved. The former performers receive messages in their own voices from an unknown sender who still knows the building's fire exits.",
    consequences: {
      honors:
        'You establish that the mascot is a living community of organisms that remembers the performers who cared for it. The students negotiate a habitat, and the department must admit it destroyed earlier sentient props.',
      pass: 'The mascot moves into a safe greenhouse enclosure. The department postpones its disposal policy, but refuses to recognize that a costume might be a person.',
      partial:
        "You save the mascot's central roots, but the basement fills with spores and two performers spend the night in observation. The living costume refuses to speak to the faculty again.",
      failed:
        'An incinerator flare ignites the costume racks and injures a technician. The mascot escapes into the ventilation system, terrified and convinced the students invited it into a trap.',
    } as Record<Grade, string>,
    morning:
      'The costume shop finds tiny green shoots beneath the doors at dawn. Former performers demand to know whether their old mascot is alive and whether its future belongs to anyone else.',
    tactics: {
      rescue: 'Protect the performers and carry the mascot outside',
      investigate: 'Discover whose voices live inside the costume',
    },
    secret:
      'Your biotech skill recognizes a colony of cooperative beings rather than a mindless mutant. You stabilize its roots and help the mascot choose its own voice while preserving a record of the earlier specimens.',
  },
  {
    incident: {
      id: 'future-graduates',
      title: "The Train Full of Tomorrow's Graduates",
      site: 'Comet City Transit Gate',
      briefing:
        "An overnight express pulls into the transit gate carrying adults in torn graduation gowns. Every passenger claims to be a version of one of tomorrow's students, and the railway's timetable shows a crash that has not happened yet. A transit worker asks you to save the train without erasing its passengers.",
      need: 'spatial' as PowerId,
      risk: 5,
      allegiance: 'shared' as Incident['allegiance'],
      art: "Wide cinematic superhero illustration, Comet City Transit Gate at midnight: the train full of tomorrow's graduates. An overnight express pulls into the transit gate carrying adults in torn graduation gowns. Every passenger claims to be a version of one of tomorrow's students, and the railway's timetable shows a crash that has not happened yet. A transit worker asks you to save the train without erasing its passengers. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.",
    },
    thread: 'transit' as ExpandedMission['thread'],
    briefing:
      "An overnight express pulls into the transit gate carrying adults in torn graduation gowns. Every passenger claims to be a version of one of tomorrow's students, and the railway's timetable shows a crash that has not happened yet. A transit worker asks you to save the train without erasing its passengers.",
    refused:
      'The phantom train disappears before anyone can board. Its final transmission predicts a platform collapse, and the transit authority fires the worker for warning the morning shift.',
    consequences: {
      honors:
        'You divert the express into a safe temporal siding and bring its passengers to the present with informed consent. Their testimony exposes a coming platform failure and gives the workers time to reinforce it.',
      pass: 'The train is halted and the crash prevented. Most passengers return to their own hour, but one graduate remains to testify that tomorrow can still change.',
      partial:
        'You prevent the scheduled collision, yet the platform suffers a partial collapse. Some passengers forget their futures and the railway forbids the worker from speaking to reporters.',
      failed:
        'The impossible train tears into the switchyard, injuring passengers and maintenance crews. The transit authority calls the footage a hologram and conceals the failed signal.',
    } as Record<Grade, string>,
    morning:
      "At breakfast, a transit worker places tomorrow's ruined graduation ticket on the classroom table. The depot has reinforced the broken switch, but nobody knows who wrote the warning.",
    tactics: {
      rescue: 'Clear the platform and stabilize the coming collision',
      investigate: 'Question the future graduates about the missing timetable',
    },
    secret:
      "Your spatial senses uncover the loop's anchor at an unsent maintenance warning. You deliver the warning before it was written, creating a safe route the academy's predictive engine cannot control.",
  },
  {
    incident: {
      id: 'rail-orchestra',
      title: 'The Orchestra Beneath the Tracks',
      site: 'Transit Union Tunnel',
      briefing:
        'A hidden orchestra under the rails plays one note that makes commuters forget where they are going. The musicians are exhausted shift workers compelled to repeat their song by a promotional implant. The trains will stop at dawn unless somebody can release the players without silencing them permanently.',
      need: 'empathy' as PowerId,
      risk: 4,
      allegiance: 'hero' as Incident['allegiance'],
      art: 'Wide cinematic superhero illustration, Transit Union Tunnel at midnight: the orchestra beneath the tracks. A hidden orchestra under the rails plays one note that makes commuters forget where they are going. The musicians are exhausted shift workers compelled to repeat their song by a promotional implant. The trains will stop at dawn unless somebody can release the players without silencing them permanently. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.',
    },
    thread: 'transit' as ExpandedMission['thread'],
    briefing:
      'A hidden orchestra under the rails plays one note that makes commuters forget where they are going. The musicians are exhausted shift workers compelled to repeat their song by a promotional implant. The trains will stop at dawn unless somebody can release the players without silencing them permanently.',
    refused:
      'The orchestra keeps playing until rail crews cut power to the tunnel. Workers miss their shifts, and the musicians wake with their wages docked for every hour they were forced to perform.',
    consequences: {
      honors:
        "You break the implant's compulsory rhythm while preserving the musicians' hearing. They choose their own final chord, and the transit union gains evidence of an illegal advertising contract.",
      pass: 'The commuters recover their memories and the orchestra escapes the tunnel. The promoter blames a technical malfunction and offers the musicians an insulting settlement.',
      partial:
        'The melody stops, but two musicians suffer tinnitus and lost wages. A publicist releases edited footage claiming the performers started the panic for attention.',
      failed:
        'The amplification system overloads and a train brakes violently above the tunnel. Several passengers are injured, and the promoter destroys the implant invoices before investigators arrive.',
    } as Record<Grade, string>,
    morning:
      'The morning trains arrive in silence. Their musicians gather outside the station with blank pay slips and ask the heroes to testify about the enforced concert.',
    tactics: {
      rescue: 'Evacuate disoriented commuters and mute the loudspeakers',
      investigate: "Listen for the instruction hidden in the musicians' score",
    },
    secret:
      "Your empathy separates the musicians' true intentions from the implanted refrain. They can finally refuse the final note, and the station's lost travelers remember their own destinations.",
  },
  {
    incident: {
      id: 'shadow-inspector',
      title: "The Ticket Inspector's Shadow",
      site: 'Narrows Night Terminal',
      briefing:
        'A shadow dressed as a ticket inspector detaches from its owner and begins demanding memories as fare. Stranded passengers have forgotten their families, while the real inspector swears the turnstiles were replaced by an academy security contractor last week.',
      need: 'technopathy' as PowerId,
      risk: 4,
      allegiance: 'rogue' as Incident['allegiance'],
      art: "Wide cinematic superhero illustration, Narrows Night Terminal at midnight: the ticket inspector's shadow. A shadow dressed as a ticket inspector detaches from its owner and begins demanding memories as fare. Stranded passengers have forgotten their families, while the real inspector swears the turnstiles were replaced by an academy security contractor last week. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.",
    },
    thread: 'transit' as ExpandedMission['thread'],
    briefing:
      'A shadow dressed as a ticket inspector detaches from its owner and begins demanding memories as fare. Stranded passengers have forgotten their families, while the real inspector swears the turnstiles were replaced by an academy security contractor last week.',
    refused:
      'The terminal stays closed as commuters forget the route home. Security officers arrest the inspector for fraud, even after the machines produce tickets bearing memories instead of destinations.',
    consequences: {
      honors:
        "You isolate the turnstile firmware and return each stolen memory to its rightful passenger. The real inspector helps trace the contractor's secret testing agreement.",
      pass: "The shadow collapses and the passengers recognize their families again. The contractor deletes its cloud logs, leaving only the inspector's handwritten work orders.",
      partial:
        "Most memories return, but one passenger cannot remember a child's name. The terminal opens under strict supervision while families demand a witness-protection office.",
      failed:
        'The shadow multiplies through the ticket gates and several rescuers forget their assignments. The terminal is evacuated, and the contractor takes the machines before the city can examine them.',
    } as Record<Grade, string>,
    morning:
      'The ticket inspector begins returning lost passenger memories by hand. A family invites you to a recognition ceremony while the transit contractor quietly challenges the evidence.',
    tactics: {
      rescue: 'Guide the stranded passengers beyond the gates',
      investigate: 'Open the ticket machines and identify the stolen memories',
    },
    secret:
      "Your technopathy finds that the shadow is a deliberately duplicated passenger database. Returning every original memory also returns the inspector's suppressed whistleblower testimony.",
  },
  {
    incident: {
      id: 'double-lighthouse',
      title: 'The Lighthouse That Blinked Twice',
      site: 'Harbor Lighthouse',
      briefing:
        'The harbor lighthouse flashes two incompatible safe passages through a violent squall. One leads to a medical relief boat; the other leads to a ferry full of night workers. The keeper says the false beam is being projected from a luxury yacht anchored outside the breakwater.',
      need: 'elemental' as PowerId,
      risk: 5,
      allegiance: 'hero' as Incident['allegiance'],
      art: 'Wide cinematic superhero illustration, Harbor Lighthouse at midnight: the lighthouse that blinked twice. The harbor lighthouse flashes two incompatible safe passages through a violent squall. One leads to a medical relief boat; the other leads to a ferry full of night workers. The keeper says the false beam is being projected from a luxury yacht anchored outside the breakwater. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.',
    },
    thread: 'harbor' as ExpandedMission['thread'],
    briefing:
      'The harbor lighthouse flashes two incompatible safe passages through a violent squall. One leads to a medical relief boat; the other leads to a ferry full of night workers. The keeper says the false beam is being projected from a luxury yacht anchored outside the breakwater.',
    refused:
      "The medical boat runs aground while the workers' ferry turns back into the storm. Coastal families gather on the pier demanding to know why the yacht's private beacon outranked the lighthouse.",
    consequences: {
      honors:
        'You scatter the false beam without dimming the true lamp and guide both vessels into protected water. The lighthouse keeper identifies the yacht that tried to reroute relief supplies.',
      pass: 'Both vessels reach harbor after a difficult approach. The false beacon is shut down, but the yacht slips away before the keeper can record its registration.',
      partial:
        "The ferry docks safely, but medical crates are ruined in the surf. Harbor volunteers run a replacement drive while the yacht's owner accuses the keeper of negligence.",
      failed:
        'The projected beam leads both captains toward a submerged wall. Crews pull injured passengers from the water, and the lighthouse keeper is suspended while officials investigate the wrong signal.',
    } as Record<Grade, string>,
    morning:
      'The harbor lighthouse keeper holds a community meeting about the false beacon. Both crews bring charts from their rescue, and private yachts are no longer exempt from inspection.',
    tactics: {
      rescue: 'Shield the approaching boats from the squall',
      investigate: 'Trace the fake beam to its yacht-mounted projector',
    },
    secret:
      "Your elemental sense distinguishes waterborne lightning from the false beacon's artificial glow. The keeper recovers a trace of the yacht's transmitter and redirects both crews through clear water.",
  },
  {
    incident: {
      id: 'colossal-ring',
      title: 'The Wedding Ring That Blocked the Bay',
      site: 'Comet Harbor Channel',
      briefing:
        'A wedding ring the size of a cruise liner rises from the harbor floor and traps three rescue boats in its widening metal loop. A celebrity hero claims the ring proves a legendary romance, but dockworkers say it was welded from stolen seawall supports.',
      need: 'kinetic' as PowerId,
      risk: 5,
      allegiance: 'villain' as Incident['allegiance'],
      art: 'Wide cinematic superhero illustration, Comet Harbor Channel at midnight: the wedding ring that blocked the bay. A wedding ring the size of a cruise liner rises from the harbor floor and traps three rescue boats in its widening metal loop. A celebrity hero claims the ring proves a legendary romance, but dockworkers say it was welded from stolen seawall supports. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.',
    },
    thread: 'harbor' as ExpandedMission['thread'],
    briefing:
      'A wedding ring the size of a cruise liner rises from the harbor floor and traps three rescue boats in its widening metal loop. A celebrity hero claims the ring proves a legendary romance, but dockworkers say it was welded from stolen seawall supports.',
    refused:
      'The channel closes for the night and the trapped boats wait for divers. Workers discover missing seawall supports only when an incoming tide floods their homes.',
    consequences: {
      honors:
        "You stop the ring's expansion and return the stolen supports to the workers' seawall. Its engraved dedication names the private donor who planned to turn the disaster into a spectacular proposal.",
      pass: 'The boats escape and the ring is secured on a barge. The celebrity hero takes credit while dockworkers demand payment for the metal stolen from their defenses.',
      partial:
        'Two boats escape while the third takes damage against the metal loop. The seawall stays weakened and residents prepare sandbags instead of celebrating the supposed romantic miracle.',
      failed:
        'The ring snaps around a rescue launch and the channel fills with shattered steel. Crews retrieve injured passengers, and the donor offers charity money in exchange for silence about the missing seawall.',
    } as Record<Grade, string>,
    morning:
      "The city finds seawall bolts on the giant ring's wreckage. Dockworkers challenge the donor's charity gala with a demand for replacement barriers and back wages.",
    tactics: {
      rescue: 'Hold the widening ring while the launch crews escape',
      investigate: "Find the seam and the sponsor's inscription",
    },
    secret:
      "Your kinetic control detects that the ring contains dozens of bolts from the dockworkers' barrier. You unwind it at the weak seam and restore the seawall before the next tide.",
  },
  {
    incident: {
      id: 'cloud-zoo',
      title: 'The Cloud Zoo on Pier Thirteen',
      site: 'Pier Thirteen',
      briefing:
        'A cargo container breaks open and releases translucent animals that float through the harbor fog: a glass-antlered deer, a jellyfish-shaped fox, and a whale small enough to fit in a teacup. Their handlers demand immediate capture, but the animals are searching for a stolen nest.',
      need: 'biotech' as PowerId,
      risk: 4,
      allegiance: 'shared' as Incident['allegiance'],
      art: 'Wide cinematic superhero illustration, Pier Thirteen at midnight: the cloud zoo on pier thirteen. A cargo container breaks open and releases translucent animals that float through the harbor fog: a glass-antlered deer, a jellyfish-shaped fox, and a whale small enough to fit in a teacup. Their handlers demand immediate capture, but the animals are searching for a stolen nest. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.',
    },
    thread: 'harbor' as ExpandedMission['thread'],
    briefing:
      'A cargo container breaks open and releases translucent animals that float through the harbor fog: a glass-antlered deer, a jellyfish-shaped fox, and a whale small enough to fit in a teacup. Their handlers demand immediate capture, but the animals are searching for a stolen nest.',
    refused:
      'The creatures scatter across the docks as frightened guards deploy tranquilizers. Residents shelter the wounded animals in warehouses while the shipping company denies responsibility for its lost cargo.',
    consequences: {
      honors:
        "You reunite the creatures with their nest and negotiate an independent sanctuary under the harbor workers' protection. Their handlers reveal who ordered the animals transported without permits.",
      pass: 'The animals are gathered unharmed and the nest is recovered. The company grudgingly accepts outside veterinarians, but still claims to own every creature.',
      partial:
        'Most animals are safe, but the tiny whale disappears into a drain. The handlers accuse the dockworkers of theft and refuse to explain why the nest was sealed.',
      failed:
        'A panicked guard fires sedatives into the fog, injuring a dockworker and a creature. The rest flee into shipping lanes, and the company closes the pier to independent rescuers.',
    } as Record<Grade, string>,
    morning:
      'At dawn, fog-born creatures gather peacefully over Pier Thirteen. Residents ask to help maintain a sanctuary, while the shipping company threatens to reclaim the living cargo.',
    tactics: {
      rescue: 'Guide the floating animals away from heavy machinery',
      investigate: 'Examine the empty container for the missing nest',
    },
    secret:
      'Your biotech skills reveal that the animals communicate by sharing genetic memories through mist. The nest is not property but their collective nursery, and they guide you to the handler who hid it.',
  },
  {
    incident: {
      id: 'shadow-court',
      title: 'The Trial of Twelve Shadows',
      site: 'Civic Justice Annex',
      briefing:
        'A late-night courtroom fills with twelve shadow witnesses testifying about crimes scheduled for tomorrow. The judge wants to arrest everyone named in the prophecies, including a classmate who has not left campus. A court clerk asks whether you will rescue the accused or prove the predictions are fabricated.',
      need: 'empathy' as PowerId,
      risk: 5,
      allegiance: 'rogue' as Incident['allegiance'],
      art: 'Wide cinematic superhero illustration, Civic Justice Annex at midnight: the trial of twelve shadows. A late-night courtroom fills with twelve shadow witnesses testifying about crimes scheduled for tomorrow. The judge wants to arrest everyone named in the prophecies, including a classmate who has not left campus. A court clerk asks whether you will rescue the accused or prove the predictions are fabricated. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.',
    },
    thread: 'civic' as ExpandedMission['thread'],
    briefing:
      'A late-night courtroom fills with twelve shadow witnesses testifying about crimes scheduled for tomorrow. The judge wants to arrest everyone named in the prophecies, including a classmate who has not left campus. A court clerk asks whether you will rescue the accused or prove the predictions are fabricated.',
    refused:
      'The judge issues preemptive arrest warrants by morning. Families hide from warrants for acts that have not occurred, and an academy counselor is suspended for refusing to identify the named students.',
    consequences: {
      honors:
        'You protect the accused and establish that each shadow testimony was edited from a real but older hearing. The clerk releases the complete records, and the judge must withdraw the warrants.',
      pass: 'The accused are released and a public defender challenges the forecast evidence. The shadow projector is impounded, but the agency that supplied it remains unnamed.',
      partial:
        "Some warrants are stayed, but three accused people spend the night in custody. The clerk preserves copies of the recordings before the court's server is wiped.",
      failed:
        'A panicked crowd storms the annex after the first arrests. Several people are injured and the judge uses the disorder to justify the untested predictive system.',
    } as Record<Grade, string>,
    morning:
      "The justice annex withdraws some warrants and refuses to explain others. The public defender asks every rescued witness to help challenge the court's predictive contract.",
    tactics: {
      rescue: 'Protect the accused and keep the courtroom exits open',
      investigate: 'Cross-examine the shadows about their missing source dates',
    },
    secret:
      'Your empathy detects the same frightened witness behind all twelve voices. Restoring their original testimony exposes a contractor that sold edited futures to the court.',
  },
  {
    incident: {
      id: 'ambulance-detour',
      title: 'The Ambulance That Went to a Different City',
      site: 'Civic Hospital Route',
      briefing:
        "Three ambulances vanish from navigation screens while carrying emergency patients across Comet City. Their drivers insist a phantom dispatch office has redirected them to a private clinic where no one answers the door. A medic asks you to help without interrupting the patients' life support.",
      need: 'technopathy' as PowerId,
      risk: 4,
      allegiance: 'hero' as Incident['allegiance'],
      art: "Wide cinematic superhero illustration, Civic Hospital Route at midnight: the ambulance that went to a different city. Three ambulances vanish from navigation screens while carrying emergency patients across Comet City. Their drivers insist a phantom dispatch office has redirected them to a private clinic where no one answers the door. A medic asks you to help without interrupting the patients' life support. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.",
    },
    thread: 'civic' as ExpandedMission['thread'],
    briefing:
      "Three ambulances vanish from navigation screens while carrying emergency patients across Comet City. Their drivers insist a phantom dispatch office has redirected them to a private clinic where no one answers the door. A medic asks you to help without interrupting the patients' life support.",
    refused:
      'The ambulances are found hours later outside an empty clinic. Patients need additional care, and the private dispatcher invoices the city for services it never provided.',
    consequences: {
      honors:
        "You trace the forged dispatch commands and safely restore all three routes without interrupting care. The drivers keep authenticated copies of the messages that name the clinic's sponsor.",
      pass: 'Every patient reaches a real hospital and the phantom route is disabled. The dispatcher claims it was a harmless map test and refuses to provide its logs.',
      partial:
        'Two ambulances arrive quickly; the third takes an unnecessary detour and its patient needs emergency treatment. Medics demand that city dispatch retain control of routing.',
      failed:
        'The ambulances converge on a blocked bridge and crews must transfer patients in the dark. Injuries worsen while the private clinic scrubs its digital records.',
    } as Record<Grade, string>,
    morning:
      "Hospital medics carry the false ambulance routes into the morning briefing. Emergency dispatchers demand a public audit of the private clinic's billing and destination records.",
    tactics: {
      rescue: 'Escort the ambulances to real emergency entrances',
      investigate: 'Trace the phantom dispatch server and its billing keys',
    },
    secret:
      'Your technopathy uncovers a mirrored control room selling ambulance routes to bidders. You return the patients to public dispatch and preserve the ledger of every diverted call.',
  },
  {
    incident: {
      id: 'shield-auction',
      title: 'The Auction of Midnight Shields',
      site: 'Civic Media Spire',
      briefing:
        'A private auction sells protective city shields to the highest bidders while a prom-night meteor drill quietly becomes real. Housing blocks lose coverage one by one as wealthy spectators bid for glowing sections of skyline. An engineer pleads for time to restore the public grid.',
      need: 'kinetic' as PowerId,
      risk: 5,
      allegiance: 'villain' as Incident['allegiance'],
      art: 'Wide cinematic superhero illustration, Civic Media Spire at midnight: the auction of midnight shields. A private auction sells protective city shields to the highest bidders while a prom-night meteor drill quietly becomes real. Housing blocks lose coverage one by one as wealthy spectators bid for glowing sections of skyline. An engineer pleads for time to restore the public grid. Show identifiable civilians, a distinct focal emergency, layered foreground and city background. No lettering or logos.',
    },
    thread: 'civic' as ExpandedMission['thread'],
    briefing:
      'A private auction sells protective city shields to the highest bidders while a prom-night meteor drill quietly becomes real. Housing blocks lose coverage one by one as wealthy spectators bid for glowing sections of skyline. An engineer pleads for time to restore the public grid.',
    refused:
      'The auction closes with the harbor wards unshielded. Neighbors turn schools into shelters while bidders celebrate their exclusive protection at a televised gala.',
    consequences: {
      honors:
        'You stabilize the shield grid and return control to the public emergency team. The engineer reveals that the auctioneer deliberately manufactured the shortages to raise prices.',
      pass: 'The city shields remain active and the auction is halted. The auctioneer escapes with some contracts while neighborhood representatives demand permanent public oversight.',
      partial:
        'Several housing blocks regain cover, but the auction grid shorts out over the old market. Volunteers evacuate families and the bidders sue the city for violating their contracts.',
      failed:
        'The private shield grid fractures during the meteor drill, injuring rescue crews and exposing whole streets. The auctioneer blames public operators for refusing a profitable emergency partnership.',
    } as Record<Grade, string>,
    morning:
      "The shield grid's overnight failures are debated in every classroom. Residents of the exposed wards ask whether the school will help them challenge the auction contract before prom.",
    tactics: {
      rescue: 'Brace the failing shield emitters above the shelters',
      investigate: 'Identify who removed public shields before bidding began',
    },
    secret:
      "Your kinetic control senses each shield emitter pulling against its original public anchor. Reconnecting the anchors stops the bidding and exposes the auctioneer's deliberately manufactured scarcity.",
  },
]
