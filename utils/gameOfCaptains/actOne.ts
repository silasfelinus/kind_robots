/**
 * Space Couch Act I, "First Voyage": three mission boards with nine calls.
 * The first three legacy mission IDs remain in rules.ts for saved voyages.
 * Tone (Silas, 2026-10-26): dry and procedural about ridiculous things,
 * with stakes that stay real. The choices are the same three everywhere:
 * help with consent, stand back and record, or act without permission.
 */
export const ACT_ONE_MISSIONS = [
  {
    id: 'ashdock',
    chapter: 1,
    system: 'Ashdock Shipyards',
    title: 'The Dockworkers Who Never Clocked Out',
    kind: 'tactics',
    briefing:
      'Ashdock’s shipyard contractor has invoiced six families for the oxygen their relatives used during a decompression the contractor has not disclosed. The yard’s automated crane still clocks all six workers in every morning, their empty suits hanging from its hooks, and payroll has written to praise their attendance.',
    dilemma:
      'The union holds an unredacted casualty register. Publishing it would end the invoices. It would also publish the names of relatives living in the yard without permits, who have so far been invoiced but not deported.',
    note: 'The crane’s attendance record was perfect. It was the only one that was.',
    stake: 'Worker testimony / institutional retaliation',
  },
  {
    id: 'windglass',
    chapter: 1,
    system: 'Windglass Moons',
    title: 'A Lighthouse That Follows You',
    kind: 'science',
    briefing:
      'A navigation buoy on four long legs has followed the couch across the glass dunes of the Windglass Moons for two days, at a respectful distance. When the couch stops, the buoy stops. The bubble’s receivers pick up three unregistered distress pings in its hiss, from somewhere the charts insist is empty.',
    dilemma:
      'Following the buoy may lead to the survivors. Broadcasting a rescue route would bring help faster, and would also bring everyone else, including the people the refuge was built to be hidden from.',
    note: 'The buoy waited politely at every dune. It had clearly done this before.',
    stake: 'Safe navigation / sanctuary exposure',
  },
  {
    id: 'nacre',
    chapter: 2,
    system: 'Nacre Assembly',
    title: 'The Temperature of a Vote',
    kind: 'diplomacy',
    briefing:
      'The Nacre Assembly votes by heat: each delegate warms a channel in the ice, and a brass bowl at the center adds them up. The peace referendum came out unanimous. Three objections have been found in the heating ducts, along with an entire neighborhood that a recent zoning update classified as a thermostat.',
    dilemma:
      'The neighborhood wants to be counted. A public hearing would win them the vote and would also publish their names to the occupying coalition, which keeps a list and is always looking to add to it.',
    note: 'Unanimity is easy when some of the voters are fixtures.',
    stake: 'Recognition / vulnerable witnesses',
  },
  {
    id: 'haleth',
    chapter: 2,
    system: 'Haleth Reef',
    title: 'The Clinic That Owns Its Patients',
    kind: 'rescue',
    briefing:
      'The Haleth Reef clinic has a cure for the fever the refugees carried with them, a patent on the cure and, under clause nine of the patent, a lien on every patient it saves. Survivors are entered on the clinic’s balance sheet as appreciating assets. Its oxygen plant, meanwhile, is slowly smothering the living reef it was bolted to.',
    dilemma:
      'The clinic will treat everyone free of charge if the captain allows their anonymized records to be sold to its creditors. The records are anonymized in the sense that the names are printed in a smaller font.',
    note: 'A medical miracle should not arrive with an invoice for being alive.',
    stake: 'Patient autonomy / ecosystem debt',
  },
  {
    id: 'gameworld',
    chapter: 3,
    system: 'The Showrunner’s Gameworld',
    title: 'The Twelfth Floor Is Mandatory',
    kind: 'tactics',
    briefing:
      'The Showrunner has rebuilt a planet into a twelve-floor televised dungeon and is casting this season from the local hospitals. Its host has registered the couch as a team of four, since four cushions are occupied, and explained that declining the audition counts as a forfeit, payable by the contestants already on floor three.',
    dilemma:
      'The contestants’ union has a labor charter with an escape clause. Reading it on air could shut the floors down. It would also identify the organizers on the planet’s only broadcast, which belongs to the Showrunner.',
    note: 'Participation is not voluntary just because the door has an applause light over it.',
    stake: 'Labor liberation / compulsory spectacle',
  },
  {
    id: 'rootborne',
    chapter: 3,
    system: 'Rootborne Gardens',
    title: 'The Orchard That Refused the Cure',
    kind: 'rescue',
    briefing:
      'Rootborne’s oxygen orchards are being replaced with state-approved filter towers, which make the air cleaner and, as a documented side effect, make everyone’s dreams available to the Ministry of Air. A sapling arrives at the couch in a clay pot, with a note from the village that installed the towers. They would like their dreams back, and to go on breathing.',
    dilemma:
      'Restoring the old orchard network would return the village’s privacy and cut the air to the new filter districts for a week, including the refugees the couch helped to settle there.',
    note: 'Breathing together is not the same as thinking the same thought.',
    stake: 'Shared air / collective autonomy',
  },
] as const

export const ACT_ONE_BOARDS = [
  ['refugees', 'ashdock', 'windglass'],
  ['archive', 'nacre', 'haleth'],
  ['bar', 'gameworld', 'rootborne'],
] as const

export type ActOneRouteId = (typeof ACT_ONE_BOARDS)[number][number]
export type ActOnePolicy = 'aid' | 'observe' | 'intervene'
type ChoiceAftermath = { flag: string; text: string }
export const ACT_ONE_CONSEQUENCES: Record<
  ActOneRouteId,
  Record<ActOnePolicy, ChoiceAftermath>
> = {
  refugees: {
    aid: {
      flag: 'convoy-invited',
      text: 'The rescued families vote on their own relocation. A sealed list of patients travels onward to Haleth Reef.',
    },
    observe: {
      flag: 'convoy-unanswered',
      text: 'The convoy waits for its stamp. Eventually it borrows one from a passing freighter and makes its own arrangements. Its last message to the couch is a copy of the request form, filled in.',
    },
    intervene: {
      flag: 'convoy-seized',
      text: 'The convoy survives the forced boarding. Its residents demand a civilian tribunal rather than the captain’s congratulations.',
    },
  },
  ashdock: {
    aid: {
      flag: 'ashdock-protected',
      text: 'The union sets up a protected testimony registry. The families, not the captain, decide when names become public, and the crane is finally allowed to clock everyone out.',
    },
    observe: {
      flag: 'ashdock-silenced',
      text: 'The empty crane clocks another shift. The contractor files a flawless injury report, with a commendation for attendance.',
    },
    intervene: {
      flag: 'ashdock-exposed',
      text: 'The contractor’s ledgers are public. Its security department now knows which relatives supplied the evidence.',
    },
  },
  windglass: {
    aid: {
      flag: 'windglass-hidden',
      text: 'The couch follows the buoy by unmarked corridors and escorts one convoy home. The harbor stays uncharted, and several families are still waiting for their turn.',
    },
    observe: {
      flag: 'windglass-lost',
      text: 'The buoy gives up on the couch and walks off toward the horizon. The crew keeps its last unexplained ping in the navigation log.',
    },
    intervene: {
      flag: 'windglass-broadcast',
      text: 'The distress route reaches the whole sector, including the pirates who had been looking for the sanctuary.',
    },
  },
  archive: {
    aid: {
      flag: 'archive-consented',
      text: 'The living library agrees to evacuate its readers. Its private catalogue stays locked, even for the captain.',
    },
    observe: {
      flag: 'archive-burned',
      text: 'The stellar flare claims the western reading room. The library records the captain’s silence with remarkable courtesy.',
    },
    intervene: {
      flag: 'archive-appropriated',
      text: 'The catalogue is saved without asking its keepers. Its memories of the rescued visitors become evidence in a planetary complaint.',
    },
  },
  nacre: {
    aid: {
      flag: 'nacre-hearing',
      text: 'A protected ballot gives the neighborhood a hearing. The Assembly must now learn to count people it previously maintained.',
    },
    observe: {
      flag: 'nacre-denied',
      text: 'The committee votes unanimously to continue considering whether the missing voters exist.',
    },
    intervene: {
      flag: 'nacre-leaked',
      text: 'The falsified votes become public. The exposed witnesses request protection before they will call this a victory.',
    },
  },
  haleth: {
    aid: {
      flag: 'haleth-autonomy',
      text: 'Local physicians take control of the cure and open its licensing terms. The reef is invited to the hearing as an affected community.',
    },
    observe: {
      flag: 'haleth-owned',
      text: 'The patented clinic registers its ten-thousandth surviving patient as an appreciating asset.',
    },
    intervene: {
      flag: 'haleth-raided',
      text: 'The patent server is broken open. Medicine spreads quickly, but the clinic releases identifying records in retaliation.',
    },
  },
  bar: {
    aid: {
      flag: 'serendipity-shelter',
      text: 'Vox welcomes the witness without asking for a public name. Serendipity quietly restores gravity to the hidden table.',
    },
    observe: {
      flag: 'serendipity-neutral',
      text: 'The bar keeps its promise, but the debtor’s creditors remain outside with a very long list of polite questions.',
    },
    intervene: {
      flag: 'serendipity-betrayed',
      text: 'The witness appears on every security feed. Serendipity cancels the captain’s tab and its hospitality.',
    },
  },
  gameworld: {
    aid: {
      flag: 'gameworld-charter',
      text: 'Performers negotiate an independent union exit charter. The Showrunner must broadcast the vote it tried to edit out.',
    },
    observe: {
      flag: 'gameworld-running',
      text: 'Another compulsory season begins. The audience cheers because the microphones are fixed to the seats.',
    },
    intervene: {
      flag: 'gameworld-broken',
      text: 'The arena’s broadcast goes dark. Contestants escape, but the workers’ charter has not survived the shutdown.',
    },
  },
  rootborne: {
    aid: {
      flag: 'rootborne-consent',
      text: 'The gardens and the newcomers negotiate separate oxygen corridors. The villagers keep their private dreams.',
    },
    observe: {
      flag: 'rootborne-silent',
      text: 'Another tower goes up. The Ministry of Air thanks the village for its dreams, which it describes as mostly about teeth.',
    },
    intervene: {
      flag: 'rootborne-severed',
      text: 'The towers come down overnight. The village’s dreams are private again, and for a week everybody in the filter districts is breathing through a damp cloth.',
    },
  },
}

export const ACT_ONE_ECHOES: Record<string, string> = {
  'convoy-invited':
    'Survivors from Hollow Lantern have asked for a say in what this new system decides. Their protected patient registry remains sealed.',
  'convoy-unanswered':
    'The Hollow Lantern convoy has filed a copy of its request form with every port ahead of you. The next port does not call the couch neutral.',
  'convoy-seized':
    'Civilians from the forcibly boarded convoy request independent arbitration. They will not testify as the captain’s property.',
  'ashdock-protected':
    'Ashdock unions offer protected witness testimony, but they insist no officer publish the names without permission.',
  'ashdock-silenced':
    'Ashdock’s contractor describes its missing workers as a successful budget adjustment.',
  'ashdock-exposed':
    'The contractor offers to settle if the captain will identify the workers who provided the unredacted register.',
  'windglass-hidden':
    'The Windglass harbor has sent an unmarked supply ship to the next port. Its coordinates remain undisclosed, as agreed.',
  'windglass-lost':
    'The final lost Windglass ping keeps appearing in the couch’s navigational static.',
  'windglass-broadcast':
    'Pirate traffic is shadowing the Windglass sanctuary route. The captain’s well-meant broadcast remains public.',
  'archive-consented':
    'The living archive offers its rescued visitors as witnesses, provided the captain respects its sealed catalogue.',
  'archive-burned':
    'Tellurian survivors remember the reading room the captain watched burn.',
  'archive-appropriated':
    'The archive has lodged a formal complaint about the unauthorised preservation of its own memory.',
  'nacre-hearing':
    'The new Nacre delegates arrive as recognized guests, not instruments for measuring temperature.',
  'nacre-denied':
    'The Nacre assembly has excluded the same neighborhood from yet another quorum.',
  'nacre-leaked':
    'The exposed Nacre witnesses are asking whether the captain can protect the privacy that public testimony removed.',
  'haleth-autonomy':
    'Haleth physicians share an independently reviewed cure without including patients on the invoice.',
  'haleth-owned':
    'The patented cure follows the survivors as a legal debt that none consented to.',
  'haleth-raided':
    'Patients liberated from the clinic still face the consequences of their records being made public.',
}

/** Per-location ethical orders: mechanically three policies, dramatically different actions. */
export const ACT_ONE_ORDERS: Record<
  ActOneRouteId,
  Record<ActOnePolicy, string>
> = {
  refugees: {
    aid: 'Transfer life support only with each ship’s consent',
    observe: 'Honor the treaty and record who was left behind',
    intervene: 'Board both lifeboats and seize the oxygen unit',
  },
  ashdock: {
    aid: 'Fund a protected union-led casualty hearing',
    observe: 'Document the contractor’s refusal and leave',
    intervene: 'Break into payroll and publish every hidden name',
  },
  windglass: {
    aid: 'Escort survivors through an unmarked safe corridor',
    observe: 'Keep the beacon secret, but do not follow it',
    intervene: 'Broadcast the distress coordinates to the sector',
  },
  archive: {
    aid: 'Negotiate evacuation with the living library itself',
    observe: 'Respect the library’s refusal and document the flare',
    intervene: 'Extract the catalogue and evacuate without permission',
  },
  nacre: {
    aid: 'Secure testimony with anonymous, protected ballot access',
    observe: 'Accept the current quorum and lodge a formal dissent',
    intervene: 'Leak the fraud ledger and demand an emergency vote',
  },
  haleth: {
    aid: 'Place the cure under independent physicians’ control',
    observe: 'Preserve the clinic contract while recording its abuses',
    intervene: 'Raid the patent vault and distribute the medicine',
  },
  bar: {
    aid: 'Offer the hidden witness voluntary safe passage',
    observe: 'Keep Serendipity neutral and preserve the secret',
    intervene: 'Broadcast the witness’s location to stop the creditor',
  },
  gameworld: {
    aid: 'Organize the contestants around the exit charter',
    observe: 'Refuse the contest and log its continuing victims',
    intervene: 'Sabotage the live dungeon and free the contestants',
  },
  rootborne: {
    aid: 'Negotiate two oxygen networks with local consent',
    observe: 'Let the government filters replace the orchard',
    intervene: 'Sever the compulsory network before an agreement',
  },
}

/** Each seeded enemy can directly contaminate an Act I destination. */
export const ACT_ONE_NEMESIS = {
  auditor: {
    missionId: 'ashdock',
    penalty: 8,
    event:
      'The Galactic Auditor arrives with an invoice for the workers’ posthumous oxygen. An appeals clerk asks whether the dead agreed to financing.',
  },
  moth: {
    missionId: 'nacre',
    penalty: 8,
    event:
      'The Queen of Borrowed Faces submits nine flawless signatures from citizens who insist the faces are not theirs.',
  },
  curdle: {
    missionId: 'haleth',
    penalty: 8,
    event:
      'Dr. Curdle offers free nutrition in exchange for converting every surviving patient into a shareholder.',
  },
  showrunner: {
    missionId: 'gameworld',
    penalty: 10,
    event:
      'The Showrunner edits the workers’ evacuation vote into a ratings poll. The lost ballots still exist on a union-owned tape.',
  },
  regent: {
    missionId: 'windglass',
    penalty: 8,
    event:
      'The Regent offers to protect the hidden haven by permanently leasing every undiscovered arrival to the crown.',
  },
  'brass-choir': {
    missionId: 'archive',
    penalty: 8,
    event:
      'The Brass Choir offers to preserve the library only after deleting every translation of the word “no.”',
  },
  chancellor: {
    missionId: 'ashdock',
    penalty: 8,
    event:
      'Chancellor Tomorrow-Again sells a revised timeline in which the workers died before the contractor hired them.',
  },
  'kindly-swarm': {
    missionId: 'rootborne',
    penalty: 10,
    event:
      'The Kindly Swarm mistakes the garden’s private root-memories for a disease and offers mandatory mental connection as a cure.',
  },
} as const
