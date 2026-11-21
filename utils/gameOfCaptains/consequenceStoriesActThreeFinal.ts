import type { ConsequenceEpisode } from './consequenceStories'

/** The last chart confronts the captain with the people left behind. */
export const ACT_THREE_FINAL_CASES = {
  inquiry: {
    id: 'warp-e7-lantern-inquiry',
    title: 'The Witnesses Have Questions',
    system: 'Hollow Lantern',
    opening:
      'Hollow Lantern has converted its abandoned observatory into a public inquiry. The red couch is parked in the middle of the hearing chamber, its invisible oxygen bubble serving as a witness enclosure. Delegates from rescued worlds and worlds the captain passed by have arrived with contradictory testimony. The clerk has provided four cushions for the witnesses and no seat for the captain. A small alien stenographer has spent three days translating the phrase reasonable intervention into languages that have no word for reasonable.',
    conflict:
      'The inquiry can publish a truthful record, protect vulnerable witnesses, or rush to a verdict. Each option leaves somebody exposed.',
    choices: [
      {
        id: 'publish-unedited-testimony',
        label: 'Publish the full testimony with witnesses controlling their names',
        approach:
          'Invite each community to correct the transcript and choose whether their identity becomes public',
        cost:
          'Verification takes fuel and time; anonymous testimony may make powerful delegates dispute the entire record.',
        policy: 'aid',
        check: { ability_any: ['diplomacy', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'The captain sits on the floor while the witnesses edit the record. The red couch bubble projects the corrected testimony across the observatory ceiling. Refugees remove identifying details without removing the facts. An angry admiral demands the right to cross-examine a child who has already left the system. The clerk refuses and records that refusal too. Nobody gets a unanimous verdict, but the communities receive copies they can keep without the captain controlling them.',
          flags: ['lantern-witness-consent', 'lantern-public-record'],
          delta: { treaty_trust: 3, crew_trust: 2, ship_fuel: -2 },
          callback:
            'Hollow Lantern published the testimony with witness-controlled identities; independent communities now hold the archive.',
        },
        failure: {
          narrative:
            'The observatory translator accidentally exposes three protected names. The captain stops the broadcast and helps the witnesses relocate rather than insisting the error is harmless. The transcript remains incomplete, and the admiral declares the hearing a failure. The stenographer gives every witness a sealed copy of their own words and a way to request corrections. The captain leaves knowing that transparency without consent can become another form of extraction.',
          flags: ['lantern-identity-leak', 'lantern-sealed-testimony'],
          delta: { treaty_trust: -2, ship_fuel: -3, crew_trust: 1 },
          callback:
            'The Lantern transcript is sealed while endangered witnesses relocate; the captain owes them a safer publication process.',
        },
      },
      {
        id: 'audit-captain-log',
        label: 'Commission an independent audit of the captain’s own log',
        approach:
          'Give investigators original voyage telemetry and let them compare the official narrative with local accounts',
        cost:
          'The log contains private crew arguments, mistakes and coordinates that could put former passengers at risk.',
        policy: 'observe',
        check: { ability_any: ['science', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'Investigators discover that the captain’s log consistently describes a successful rescue as a single heroic moment while omitting months of local repair work. The crew votes to correct it. The observatory prints a second edition crediting the people who rebuilt their own homes. The red couch receives a citation for unauthorized footnotes, which the clerk insists is a compliment. The captain signs the corrections without asking for a more flattering cover.',
          flags: ['lantern-log-audited', 'lantern-local-credit'],
          delta: { medical_knowledge: 2, treaty_trust: 2, crew_trust: 1 },
          callback:
            'The corrected voyage log credits local communities rather than treating them as supporting characters.',
        },
        failure: {
          narrative:
            'The audit terminal projects private passenger coordinates into the public gallery. The captain pulls its power before the crowd can copy them, losing the chance to verify several contested entries. Investigators preserve the hardware and open a restricted inquiry instead. A delegate complains that the captain is hiding the truth; a former passenger replies that being found by a hostile fleet would not make the truth more accurate.',
          flags: ['lantern-log-quarantined', 'lantern-private-coordinates'],
          delta: { treaty_trust: -1, antagonist_pressure: 2, crew_trust: -1 },
          callback:
            'The audit is unfinished because private passenger coordinates leaked; investigators need a safe review room.',
        },
      },
      {
        id: 'demand-immediate-verdict',
        label: 'Demand a verdict now and offer the couch as collateral',
        approach:
          'Force a decision before hostile delegates can delay the inquiry beyond the ship’s oxygen reserves',
        cost:
          'A rushed vote silences absent communities and risks making the ship itself payment for the captain’s mistakes.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 7 },
        success: {
          narrative:
            'The captain parks the red couch in the center aisle and invites the delegates to seize it if they believe that will repair their worlds. The room falls quiet. Instead, the witnesses demand a provisional finding and a later hearing with those who could not travel. The chair agrees to preserve the couch as a mobile evidence archive rather than confiscate it. The captain escapes with the upholstery intact but must return for the unfinished questions.',
          flags: ['lantern-provisional-finding', 'lantern-return-promise'],
          delta: { ship_fuel: 1, antagonist_pressure: 1, treaty_trust: -1 },
          callback:
            'Hollow Lantern issued only a provisional finding; the captain promised to return for absent witnesses.',
        },
        failure: {
          narrative:
            'The delegates accept the collateral. The couch is impounded, and its bubble politely informs the hearing that removing life support from its passengers violates the building code. Emergency engineers move the whole hearing chamber into the bubble until a temporary release is negotiated. The captain must surrender fuel and apologize to the witnesses who were pressured into voting early. The clerk lists the incident as the first recorded case of a sofa holding a government hostage.',
          flags: ['lantern-couch-impounded', 'lantern-rushed-hearing'],
          delta: { ship_fuel: -3, treaty_trust: -3, crew_trust: -2 },
          callback:
            'The couch escaped impoundment under a temporary agreement, but Hollow Lantern still owes absent witnesses a hearing.',
        },
      },
    ],
  },
} satisfies Record<string, ConsequenceEpisode>
