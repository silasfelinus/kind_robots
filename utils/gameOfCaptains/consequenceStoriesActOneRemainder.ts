import type { ConsequenceEpisode } from './consequenceStories'

/** Original follow-up cases, keyed by existing mission IDs. Art is not yet delivered. */
export const ACT_ONE_UNPAINTED_CASES = {
  windglass: {
    id: 'warp-c1-windglass-lighthouse',
    title: 'The Lighthouse That Follows You',
    system: 'Windglass Moons',
    opening:
      'A four-legged lighthouse has followed the red couch across Windglass’s glass dunes for two days. At every stop it kneels politely and flashes three distress signals toward a harbor omitted from every public chart. Inside that harbor, families who fled a border purge refuse to share their coordinates. Their food is almost gone. Rescue captains are broadcasting open invitations on the same frequencies used by the patrol ships.',
    conflict:
      'The refugees need a supply route but cannot afford to be found by the people searching for them. Who gets to choose how visible the rescue becomes?',
    choices: [
      {
        id: 'escort-in-silence',
        label: 'Let the harbor families guide a silent supply escort',
        approach:
          'Follow local directions and keep sanctuary coordinates off the air',
        cost: 'An unmarked rescue takes time and cannot reach everyone before nightfall.',
        policy: 'aid',
        check: { ability_any: ['rescue', 'culture'], difficulty: 7 },
        success: {
          narrative:
            'The lighthouse folds its legs and walks the couch through a field of glass that sings whenever the engines start. Families unload food behind a curtain of dunes and mark safe turns with stones only they can read. The captain asks for a route map; the harbor elder offers a sandwich instead. Several smaller shelters remain beyond tonight’s reach.',
          flags: ['windglass-consented-escort', 'windglass-harbor-hidden'],
          delta: { sanctuary_trust: 3, ship_fuel: -2, crew_trust: 1 },
          callback:
            'The harbor elder sends a coded thanks. Two smaller shelters are still waiting, and their route must remain uncharted.',
        },
        failure: {
          narrative:
            'The couch follows the beacon into a dust storm and loses contact with the last shelter. One convoy receives supplies; another turns back empty-handed, unwilling to risk its location. The elder accepts the apology but refuses the captain’s offer to broadcast a second attempt. The lighthouse stands outside the force bubble until the storm passes.',
          flags: ['windglass-convoy-partial', 'windglass-unreached-shelter'],
          delta: { sanctuary_trust: 1, ship_fuel: -2, antagonist_pressure: 1 },
          callback:
            'A coded message reports that the unreached shelter has only one night of food left. A public chart remains forbidden.',
        },
      },
      {
        id: 'audit-distress-beacons',
        label: 'Trace the distress pings without transmitting a route',
        approach: 'Separate authentic rescue signals from patrol decoys',
        cost: 'A listening-only mission may miss the supply window entirely.',
        policy: 'observe',
        check: { ability_any: ['science', 'tactics'], difficulty: 8 },
        success: {
          narrative:
            'Mox-9 discovers that two signals are refugee voices and the third is a patrol ship repeating an older recording. The lighthouse stops flashing at the forged tone. The crew sends the harbor an encrypted warning, but keeps its engines idle to avoid leaving a track. The next rescue ship has better information; tonight’s hungry families still need cargo.',
          flags: [
            'windglass-patrol-decoy-exposed',
            'windglass-route-protected',
          ],
          delta: { treaty_trust: 2, medical_knowledge: 1, ship_fuel: -1 },
          callback:
            'The lighthouse has learned to ignore forged distress calls. The patrol has begun imitating its footfalls instead.',
        },
        failure: {
          narrative:
            'A burst of static makes every beacon sound like a child calling for help. The crew records all three signals but cannot distinguish a shelter from a trap. A patrol vessel later quotes the couch’s listening frequency in an official notice. The harbor remains hidden, yet its people must silence even their emergency transmitters.',
          flags: [
            'windglass-frequency-compromised',
            'windglass-signals-silent',
          ],
          delta: { treaty_trust: -1, antagonist_pressure: 2, ship_fuel: -1 },
          callback:
            'No further distress pings have been heard. The harbor is safe from interception but frighteningly quiet.',
        },
      },
      {
        id: 'broadcast-open-corridor',
        label: 'Broadcast a rescue corridor to every ship nearby',
        approach:
          'Mobilize fast public assistance without the harbor’s consent',
        cost: 'The fastest rescue also hands the hunting patrol an accurate map.',
        policy: 'intervene',
        check: { ability_any: ['diplomacy', 'luck'], difficulty: 6 },
        success: {
          narrative:
            'Civilian ships arrive with more food than the harbor has plates. Rescue succeeds before the patrol can seal the corridor, and reporters declare the couch a humanitarian landmark. The elder interrupts the awards speech to ask why three hundred people now know where her family sleeps. Patrol searchlights arrive on the horizon as the last crates are unloaded.',
          flags: ['windglass-corridor-funded', 'windglass-harbor-exposed'],
          delta: {
            sanctuary_trust: -3,
            treaty_trust: 2,
            antagonist_pressure: 3,
          },
          callback:
            'The harbor is fed, but patrol searchlights now circle the dunes. Refugees have asked the couch to stop sharing their location.',
        },
        failure: {
          narrative:
            'The broadcast attracts a relief freighter and two armed patrol boats. Families hide while the ships argue about who controls the landing strip. The freighter departs without unloading, and the patrol logs the harbor’s position for future inspection. The lighthouse switches off its own lantern in what feels very much like a protest.',
          flags: ['windglass-patrols-alerted', 'windglass-relief-blocked'],
          delta: { sanctuary_trust: -3, ship_fuel: -2, antagonist_pressure: 3 },
          callback:
            'The corridor remains on official patrol charts. The relief freighter is appealing a fine for attempting to help.',
        },
      },
    ],
  },
  haleth: {
    id: 'warp-c2-haleth-patent',
    title: 'The Clinic That Owns Its Patients',
    system: 'Haleth Reef',
    opening:
      'The Haleth clinic can cure the refugee fever in a single afternoon. Its patent gives the creditors a lien on each person treated, who becomes an appreciating asset on the clinic’s balance sheet. The company offers free treatment if the couch signs away anonymous patient records; the anonymity consists of printing everyone’s names in a slightly smaller font. Beneath the clinic, a coral reef is losing oxygen to the patent owner’s filtration plant.',
    conflict:
      'Patients need care today, but a cure that creates permanent debt and damages the reef is not a gift. Who can authorize the trade?',
    choices: [
      {
        id: 'patient-owned-treatment',
        label: 'Organize treatment under a patient-owned consent charter',
        approach: 'Have patients direct treatment and refuse transferable debt',
        cost: 'The legal objection may delay care for those already burning with fever.',
        policy: 'aid',
        check: { ability_any: ['rescue', 'diplomacy'], difficulty: 7 },
        success: {
          narrative:
            'Dr. Vela reads clause nine aloud to the patients. They vote to accept the medicine but not the liens, then establish a temporary clinic in the couch’s pocket infirmary. A local nurse figures out how to compound one treatment without the patent holder’s printer. The fever breaks; the clinic files a complaint claiming its assets have walked away.',
          flags: ['haleth-patient-charter', 'haleth-liens-contested'],
          delta: { sanctuary_trust: 2, medical_knowledge: 2, ship_fuel: -2 },
          callback:
            'The patients’ clinic has treated another fever cluster. Patent lawyers insist that freedom from debt is a trademark infringement.',
        },
        failure: {
          narrative:
            'The patients approve their charter, but the portable compounder overheats midway through treatment. A dozen people receive medicine; the rest must return to the patent clinic with contracts attached. Vela stays to tend the sick and declines the captain’s suggestion to celebrate the legal victory early.',
          flags: ['haleth-charter-incomplete', 'haleth-patients-indebted'],
          delta: { sanctuary_trust: 1, ship_fuel: -3, antagonist_pressure: 1 },
          callback:
            'The charter survived, but some patients remain listed as collateral. The temporary clinic needs a replacement compounder.',
        },
      },
      {
        id: 'prove-reef-contamination',
        label: 'Audit the oxygen plant and challenge the patent in court',
        approach:
          'Document environmental damage while preserving private patient records',
        cost: 'Evidence gathering does not put medicine into the veins of today’s sick.',
        policy: 'observe',
        check: { ability_any: ['science', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'The reef’s oldest coral records every discharge as a ring of sickly yellow stone. Scientists submit that history alongside the patent, proving the filtration plant costs more lives than it saves. The court freezes the lien program and orders emergency treatment while it investigates. The reef politely requests a lawyer of its own.',
          flags: ['haleth-reef-evidence', 'haleth-liens-frozen'],
          delta: {
            treaty_trust: 3,
            medical_knowledge: 1,
            crew_trust: 1,
            antagonist_pressure: 1,
          },
          callback:
            'The reef has won standing to testify. The patent firm is appealing on the grounds that coral has no pockets.',
        },
        failure: {
          narrative:
            'The clinic invokes medical confidentiality to keep the discharge logs locked and patent confidentiality to keep the formula sealed. The investigation proves little before the next fever spike. The reef continues to pale, and patients are warned that accepting free treatment will count as a binding signature.',
          flags: ['haleth-audit-stalled', 'haleth-reef-declining'],
          delta: {
            treaty_trust: -1,
            medical_knowledge: 1,
            antagonist_pressure: 2,
          },
          callback:
            'The evidence hearing has been postponed. Reef biologists say the next oxygen bloom cannot wait for the court.',
        },
      },
      {
        id: 'seize-the-patent',
        label: 'Release the treatment formula and disable the clinic’s liens',
        approach:
          'Break the monopoly immediately, without waiting for a patient vote',
        cost: 'A public formula could save thousands while exposing private medical records.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'science'], difficulty: 6 },
        success: {
          narrative:
            'The couch punches through a filing cabinet and uploads the formula to every clinic in the system. Thousands gain access to affordable treatment. The same upload includes the first page of the patient ledger; creditors begin sending collection agents to the addresses on it. Vela asks the captain which part of the download was worth the patients’ consent.',
          flags: ['haleth-formula-public', 'haleth-patient-records-leaked'],
          delta: {
            medical_knowledge: 3,
            crew_trust: -2,
            antagonist_pressure: 2,
          },
          callback:
            'Independent clinics are using the free formula. The affected patients are still asking who published their addresses.',
        },
        failure: {
          narrative:
            'The patent terminal wipes the formula before the upload completes. The clinic’s billing system briefly goes dark, but the medical records spill into a public cache. Patients receive no new treatment and a fresh round of messages from creditors. Vela calls it a spectacularly efficient way to make the wrong people pay.',
          flags: ['haleth-formula-erased', 'haleth-records-exposed'],
          delta: {
            medical_knowledge: -1,
            crew_trust: -3,
            antagonist_pressure: 3,
          },
          callback:
            'The formula remains under lock, while leaked patient records circulate among debt collectors.',
        },
      },
    ],
  },
  rootborne: {
    id: 'warp-c3-rootborne-dream-air',
    title: 'The Orchard That Refused the Cure',
    system: 'Rootborne Gardens',
    opening:
      'Rootborne’s old oxygen orchards kept a village breathing without asking what anyone dreamed about. The government replaced them with cleaner filtration towers that quietly transmit every sleeper’s memories to the Ministry of Air. A sapling in a cracked clay pot arrives aboard the red couch carrying a request in three handwritings: restore the trees, return our dreams, and please do not suffocate the neighboring refugee district while you do it.',
    conflict:
      'Privacy and breathing are both essential. Rebuilding the orchard would cut the new filter districts’ oxygen for a week. Who carries that risk?',
    choices: [
      {
        id: 'shared-air-transition',
        label: 'Let both districts build a temporary shared air network',
        approach:
          'Seek a consent-based transition that protects refugees and village families',
        cost: 'The bridge needs scarce oxygen canisters and may not survive the first storm.',
        policy: 'aid',
        check: { ability_any: ['rescue', 'science'], difficulty: 7 },
        success: {
          narrative:
            'Village elders and refugee engineers build a mesh of flexible air pipes between the orchard roots and the new towers. Both districts vote on the ration schedule. The sapling insists on being stationed beside the manual shutoff and survives its first night of responsible adulthood. The Ministry loses access to the dreams without anyone losing air.',
          flags: ['rootborne-shared-oxygen', 'rootborne-dreams-private'],
          delta: { sanctuary_trust: 3, ship_fuel: -2, crew_trust: 1 },
          callback:
            'The shared air network is still running. Refugees have asked to become permanent partners rather than temporary guests.',
        },
        failure: {
          narrative:
            'The improvised pipes burst in an unexpected cold front. Both districts share emergency canisters while engineers rebuild, and the sapling refuses to leave its post at the shutoff valve. The Ministry’s towers remain active, recording dreams for one more week. No one has enough air to celebrate an almost-success.',
          flags: [
            'rootborne-air-bridge-failed',
            'rootborne-dreams-still-recorded',
          ],
          delta: { sanctuary_trust: 1, ship_fuel: -3, antagonist_pressure: 1 },
          callback:
            'Engineers have repaired half the network. The Ministry is charging the village for each unrecorded dream.',
        },
      },
      {
        id: 'audit-the-dream-towers',
        label: 'Expose the surveillance clauses before changing the air supply',
        approach:
          'Preserve oxygen continuity while proving that consent was never given',
        cost: 'The tower network keeps recording dreams during the legal challenge.',
        policy: 'observe',
        check: { ability_any: ['science', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'A government safety brochure contains the dream-collection clause in lettering smaller than a pollen grain. The crew projects it across the sky; both districts demand independent inspectors and an immediate stop to memory exports. The towers continue providing air, but the Ministry’s dreaming server goes silent for the first time in years.',
          flags: [
            'rootborne-surveillance-proven',
            'rootborne-breathing-preserved',
          ],
          delta: {
            treaty_trust: 3,
            medical_knowledge: 1,
            crew_trust: 1,
            antagonist_pressure: 1,
          },
          callback:
            'The Ministry has stopped shipping dreams off-world. Its lawyers now argue that nightmares are government property.',
        },
        failure: {
          narrative:
            'The audit catches one unauthorized transfer before an official calls it a mandatory software update. Residents receive an apology and a longer consent form; the air towers continue recording their nights. The sapling begins sleeping with its roots wrapped in foil, a technique the Ministry classifies as suspicious.',
          flags: ['rootborne-audit-dismissed', 'rootborne-ministry-alerted'],
          delta: { treaty_trust: -1, antagonist_pressure: 2, ship_fuel: -1 },
          callback:
            'The Ministry has introduced a new checkbox that counts silence as enthusiastic permission to record dreams.',
        },
      },
      {
        id: 'rip-out-the-towers',
        label: 'Destroy the recording towers and restart the old orchards',
        approach:
          'Restore privacy instantly, regardless of who loses filtered air',
        cost: 'The refugee districts lose breathing support while old roots recover.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 6 },
        success: {
          narrative:
            'The red couch drags three recording towers out of the ground with its force bubble. Villagers cheer when the Ministry’s antennas collapse. Across the valley, refugee families reach for oxygen masks as their clean air stops flowing. The sapling asks why its first taste of freedom sounds so much like people gasping.',
          flags: ['rootborne-towers-removed', 'rootborne-refugee-air-lost'],
          delta: {
            sanctuary_trust: -3,
            treaty_trust: 1,
            antagonist_pressure: 2,
          },
          callback:
            'The Ministry is gone from the village, but refugee clinics have begun rationing oxygen while the orchards regrow.',
        },
        failure: {
          narrative:
            'The first tower falls across the orchard irrigation pipes. The remaining towers activate emergency recording protocols, copying an entire week of dreams before the crew can unplug them. Refugee households lose air and the village loses its irrigation water. The sapling refuses to leave the broken pipe until someone starts the repairs.',
          flags: ['rootborne-orchard-damaged', 'rootborne-dreams-exported'],
          delta: { sanctuary_trust: -3, ship_fuel: -2, antagonist_pressure: 3 },
          callback:
            'Refugees are still on emergency oxygen. The Ministry has issued a glossy report thanking the captain for the data.',
        },
      },
    ],
  },
} satisfies Record<string, ConsequenceEpisode>
