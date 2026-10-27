import type { CrewId } from './rules'
import { CREW_DOSSIERS } from './characterDossiers'

export type CrewJourneyStep = {
  system: string
  title: string
  scene: string
  careful: string
  bold: string
}

type StepDetail = readonly [string, string, string]
const SCRIPT: Record<CrewId, readonly [StepDetail, StepDetail, StepDetail]> = {
  pell: [
    [
      'A crane still moves between empty berths at Ashdock, although its dead operators have been removed from the payroll.',
      'Ask the workers to open the casualty register themselves.',
      'Seize the contractor’s private black box and publish the unredacted list.',
    ],
    [
      'At Nacre Assembly, management submits a spotless safety report. Pell has an audio witness who has never consented to public testimony.',
      'Secure a protected hearing with the witness present.',
      'Broadcast the testimony before the company can buy another adjournment.',
    ],
    [
      'The Mirror Census has recreated the erased workers as account numbers. Their families disagree over public restitution.',
      'Let families decide which names enter the permanent memorial.',
      'Publish the complete register so creditors cannot deny the debt.',
    ],
  ],
  vela: [
    [
      'A child at Hollow Lantern needs Vela’s emergency medicine, but the convoy has been classified as freight and has no lawful patient registry.',
      'Treat the child confidentially and document informed permission.',
      'Override the cargo registry and declare the whole convoy a clinic.',
    ],
    [
      'Haleth Reef’s medical board has sold Vela’s life-saving research to the fleet that refused her refugee patients.',
      'Offer a licensing agreement controlled by local doctors.',
      'Release the original formula publicly before the board can censor it.',
    ],
    [
      'Two cities on Courtesy Twins want Vela’s cure, but one can secretly add a compulsory compliance marker.',
      'Secure independent patient oversight on both worlds.',
      'Ship the cure immediately and expose the marker in a public hearing.',
    ],
  ],
  tess: [
    [
      'A Windglass buoy points toward her grandmother’s secret harbor. The navigation channel is watched by a salvage patrol.',
      'Decode the course offline without broadcasting the safe harbor.',
      'Use the patrol’s public relay and risk exposing the route.',
    ],
    [
      'Vox safeguards a sealed destination slip while Serendipity dims its lights to shield a frightened mapkeeper.',
      'Ask the mapkeeper what help they actually want.',
      'Publicly confront the official demanding the mapkeeper’s identity.',
    ],
    [
      'Hollow Lantern refugees need a route to safety, and the only reliable destination is an undisclosed sanctuary.',
      'Pilot one unmarked convoy at a time.',
      'Reveal a public corridor that many more families can navigate.',
    ],
  ],
  rue: [
    [
      'The Concord treaty engine has removed refugee signatures because its definition of “resident” was quietly amended.',
      'Gather testimony from the excluded signatories.',
      'Demand immediate publication of the illegal amendment.',
    ],
    [
      'Nacre delegates refuse to hear anyone whose citizenship was erased; Rue once drafted the contested paragraph.',
      'Negotiate temporary standing for the witnesses.',
      'Admit authorship in public and force a vote on the original clause.',
    ],
    [
      'Courtesy Twins offers narrow exceptions for families but refuses to recognize that the underlying law is broken.',
      'Build a durable appeal procedure with both assemblies.',
      'Challenge the whole treaty in an open emergency session.',
    ],
  ],
  mox: [
    [
      'Tellurian Archive preserves a first boot log from Mox-9. It records a deletion command entered by a shaking operator.',
      'Seek the operator’s consent before revealing their testimony.',
      'Extract a public checksum that proves the record was coerced.',
    ],
    [
      'The Sesh Foundry holds three copies of Mox; each remembers choosing a different future.',
      'Convene a voluntary meeting of all three copies.',
      'Demand a legal ruling that no copy owns the others.',
    ],
    [
      'Gameworld’s Showrunner has drafted synthetic assistants as arena equipment. It recognizes Mox’s manufacturing checksum.',
      'Negotiate safe exits with the assistants themselves.',
      'Present a public machine-rights petition in the middle of the broadcast.',
    ],
  ],
  jex: [
    [
      'On Courtesy Twins, both sides claim sole copyright over an anthem composed during their ceasefire.',
      'Ask the surviving singers to approve a new performance.',
      'Publish the wartime recording exposing the anthem’s funders.',
    ],
    [
      'Vox offers Serendipity as a neutral rehearsal site. The bar itself objects to having its acoustics rented without asking.',
      'Invite the sentient bar to choose the performance terms.',
      'Stage a protest concert outside the creditors’ office.',
    ],
    [
      'At Quiet Sun, the song could unite two communities or erase the musical language of the smaller one.',
      'Fund separate performances with an optional shared refrain.',
      'Broadcast the unedited original and expose its political sponsors.',
    ],
  ],
  sora: [
    [
      'The Sesh power station has stayed online by refusing its own mandatory maintenance command.',
      'Ask the station whether it wants a repair.',
      'Expose the board that ordered technicians to delete its petitions.',
    ],
    [
      'Tellurian Archive keeps the station’s requests locked in a data vault marked “industrial noise.”',
      'Arrange a hearing with an independent machine advocate.',
      'Release the suppressed petitions on the public archive network.',
    ],
    [
      'Gameworld offers the station a prestigious role as an arena light. The contract makes its energy a weapon.',
      'Help the station negotiate safe voluntary work.',
      'Destroy the compulsory contract during a live broadcast.',
    ],
  ],
  kivo: [
    [
      'Windglass dunes remember the pressure wake of a courier carrying Kivo’s missing sibling. The last signal might be a deliberate farewell.',
      'Follow the private pressure trail without alerting bounty hunters.',
      'Broadcast the courier identifier to all nearby port authorities.',
    ],
    [
      'An Ashdock manifest lists the sibling as a confiscated parcel, though a handwritten correction says “passenger.”',
      'Interview the dispatcher who risked correcting the manifest.',
      'Publish the shipping company’s complete detention ledger.',
    ],
    [
      'Mirror Census has a sealed letter in the sibling’s handwriting. Kivo is not its named recipient.',
      'Honor the seal and request direct consent to meet.',
      'Open the records publicly to expose a possible abduction.',
    ],
  ],
  taal: [
    [
      'The Nacre Assembly thermal ballots were altered during a cold snap. Taal can still feel the original temperature on the stone.',
      'Invite surviving voters to reconstruct their own decision.',
      'Show the forged pattern to the entire chamber before the treaty vote.',
    ],
    [
      'Haleth Reef stores a cold-chain recorder, but its contents also expose private medical conversations.',
      'Negotiate a narrowly limited independent examination.',
      'Release the whole unedited thermal log to expose the forgers.',
    ],
    [
      'Concord Freehold demands the old treaty remain in force even though a false vote ratified it.',
      'Hold a fresh assembly with affected residents present.',
      'Suspend the agreement publicly and demand renegotiation.',
    ],
  ],
  brin: [
    [
      'Rootborne’s living oxygen garden has spread into a ceremonial grove. Elders ask for repair, not gratitude.',
      'Restore the grove under local ecological guidance.',
      'Publish the company’s instructions that caused the invasive growth.',
    ],
    [
      'Hollow Lantern needs the same spores to keep a refugee dome breathing. The families were not told about their spread.',
      'Explain the risks and let residents choose their own filters.',
      'Deliver a mass emergency oxygen bank with public follow-up funding.',
    ],
    [
      'Quiet Sun proposes compulsory oxygen gardens on every settlement, regardless of sacred land boundaries.',
      'Protect exemptions and fund patient local maintenance.',
      'Expose the terraforming contract and interrupt its supply ships.',
    ],
  ],
  omi: [
    [
      'Harmonic Belt archives are missing the final chime of an ignored evacuation warning.',
      'Ask the community to restore the note in its own language.',
      'Transmit the fragment on every public channel.',
    ],
    [
      'Vox remembers the missing warning, but Serendipity itself heard the sound through its gravity generators.',
      'Let the sentient bar decide which memories it will share.',
      'Broadcast the recording from the neutral bar to contradict the official inquiry.',
    ],
    [
      'Gameworld uses Omi’s stolen warning note as its elimination buzzer. Nobody inside the arena knows it once meant “exit.”',
      'Teach the players a quiet escape signal.',
      'Turn every arena speaker into a public evacuation alarm.',
    ],
  ],
  fen: [
    [
      'Concord Freehold has marked whole families as trespassers by changing a single classification column.',
      'Get the families temporary protection while permits are examined.',
      'Expose the internal order that changed their legal identity.',
    ],
    [
      'Ashdock security confiscated the travelers’ identity passes. Fen recognizes the officer who gave the order.',
      'Persuade the officer to return them under witness protection.',
      'Break the impoundment and release the original pass ledger.',
    ],
    [
      'Hollow Lantern needs a civilian corridor but the Regent offers troops and compulsory registration.',
      'Organize unarmed escorts accountable to refugees.',
      'Confront the military checkpoint in a public tribunal.',
    ],
  ],
}
export const CREW_JOURNEYS: Record<
  CrewId,
  readonly [CrewJourneyStep, CrewJourneyStep, CrewJourneyStep]
> = Object.fromEntries(
  (Object.keys(SCRIPT) as CrewId[]).map((id) => [
    id,
    SCRIPT[id].map(([scene, careful, bold], index) => {
      const destination = CREW_DOSSIERS[id].itinerary[index]!
      const colon = destination.indexOf(':')
      return {
        system: destination.slice(0, colon),
        title: destination.slice(colon + 1).trim(),
        scene,
        careful,
        bold,
      }
    }),
  ]),
) as unknown as Record<
  CrewId,
  readonly [CrewJourneyStep, CrewJourneyStep, CrewJourneyStep]
>

export const NEMESIS_COUNTERPLAY: Record<string, readonly CrewId[]> = {
  auditor: ['pell', 'rue', 'taal'],
  moth: ['tess', 'kivo', 'rue'],
  curdle: ['vela', 'brin'],
  showrunner: ['mox', 'sora', 'omi'],
  regent: ['fen', 'taal'],
  'brass-choir': ['jex', 'omi'],
  chancellor: ['pell', 'kivo', 'taal'],
  'kindly-swarm': ['brin', 'vela'],
}
