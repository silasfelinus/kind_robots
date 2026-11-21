import type { ConsequenceEpisode } from './consequenceStories'

/** Final destinations preserve the chart's mission IDs and inherited save contract. */
export const ACT_THREE_CLOSURE_CASES = {
  'windglass-exodus': {
    id: 'warp-e8-windglass-exodus',
    title: 'Moving Day, No Forwarding Address',
    system: 'Windglass Moons',
    opening:
      'The Windglass sanctuary buoy is moving before dawn. The families have packed food, children, and a collection of plants that the customs officer insists are an invasive orchestra. The red couch waits inside its invisible life-support bubble while a navigator offers the captain a sealed map. The sanctuary needs transport but must remain unfindable afterward. A pirate patrol is asking for the names of every passenger, ostensibly to send farewell cards.',
    conflict:
      'The families need a route they can trust without turning their refuge into a destination anybody with a captain’s log can discover.',
    choices: [
      {
        id: 'carry-unopened-map',
        label: 'Carry the unopened map and let the families steer the couch',
        approach:
          'Put the navigation controls in a refugee pilot’s hands while protecting the sealed destination',
        cost: 'The passengers retain control of the route, but the crew must spend fuel on blind course corrections.',
        policy: 'aid',
        check: { ability_any: ['rescue', 'culture'], difficulty: 7 },
        success: {
          narrative:
            'A Windglass pilot calls each turn from a paper chart folded inside an opaque envelope. The captain keeps both hands off it. The couch crosses three patrol lanes with its bubble dimmed, and the children finally hear something other than a warning alarm. At the last buoy, the pilot takes the navigation keys and destroys the temporary course cache. The crew receives a thank-you card addressed simply to the furniture. Nobody aboard can tell a pursuer where the sanctuary went.',
          flags: ['windglass-map-unopened', 'windglass-families-relocated'],
          delta: { sanctuary_trust: 3, crew_trust: 2, ship_fuel: -3 },
          callback:
            'Windglass relocated under its own navigation; the captain kept no map and can offer only testimony about the escape.',
        },
        failure: {
          narrative:
            'The sealed directions lead through an uncharted debris field, and the couch loses its outer fuel bladder. The Windglass pilot orders a halt rather than reveal the destination to a rescue beacon. Together, the passengers set a short-lived, anonymous rendezvous signal that carries no coordinates beyond the nearest safe rock. They survive, but one transport must be abandoned and the sanctuary disperses into smaller groups. The captain cannot call the journey a clean rescue simply because the map stayed closed.',
          flags: ['windglass-convoy-scattered', 'windglass-map-protected'],
          delta: { sanctuary_trust: 1, ship_fuel: -3, crew_trust: -1 },
          callback:
            'The Windglass map remained private, but scattered transports still need help reuniting without exposing their refuge.',
        },
      },
      {
        id: 'inspect-route-with-escrow',
        label: 'Check hazards with a refugee-controlled navigation escrow',
        approach:
          'Let an independent local navigator reveal only dangerous segments, never the full destination',
        cost: 'The safety audit consumes supplies and requires the crew to trust an outside navigator over its own sensors.',
        policy: 'observe',
        check: { ability_any: ['science', 'diplomacy'], difficulty: 8 },
        success: {
          narrative:
            'The navigator reads the sealed map inside a darkened pocket room behind the red couch. A one-use computer returns only two warnings: avoid the ion reef, and stop asking where everyone is going. The crew adjusts course and shares the hazard warning with other travelers without attaching the sanctuary’s destination. When the passage ends, the escrow device wipes itself in front of elected passengers. An archivist complains there is no copy for posterity. The passengers answer that staying alive is quite a good posterity.',
          flags: ['windglass-escrow-audited', 'windglass-route-anonymous'],
          delta: {
            medical_knowledge: 2,
            sanctuary_trust: 2,
            ship_fuel: -2,
          },
          callback:
            'The Windglass route passed a limited hazard audit, and its destination was never copied into the couch logs.',
        },
        failure: {
          narrative:
            'The escrow tool reports a safe corridor but leaves a trail of timing metadata on the patrol network. A pursuing ship begins reconstructing the convoy’s position without ever seeing its map. The captain shuts down the expensive navigation system and asks the refugees which decoy signal they are willing to authorize. Two families choose different routes, each taking responsibility for its own risks. The couch loses time and fuel buying their escape, and the crew has to admit that a supposedly private system exposed them.',
          flags: ['windglass-metadata-leak', 'windglass-decoy-routes'],
          delta: {
            sanctuary_trust: -2,
            antagonist_pressure: 2,
            ship_fuel: -2,
          },
          callback:
            'A Windglass navigation escrow leaked timing metadata; the relocated families are watching for patrols that learned too much.',
        },
      },
      {
        id: 'seize-public-passage-lane',
        label: 'Seize a public passage lane and escort every transport through',
        approach:
          'Force the patrol to stand aside long enough for the sanctuary convoy to cross together',
        cost: 'An open corridor saves time but creates witnesses, records and a precedent for military escorts.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 7 },
        success: {
          narrative:
            'The couch parks crosswise in the checkpoint aperture, its invisible bubble making the toll barrier look embarrassed. Patrol captains agree to a temporary open lane when they realize the upholstery is technically a breathable obstruction. The convoy crosses, and three stranded civilian ships follow it to safety. The authorities immediately announce new rules requiring every future sanctuary to register before using the lane. The captain wins the afternoon and leaves the families to contest an ugly rule tomorrow.',
          flags: ['windglass-open-corridor', 'windglass-registry-threat'],
          delta: { ship_fuel: 1, treaty_trust: -2, sanctuary_trust: 1 },
          callback:
            'The Windglass convoy crossed a forced-open public lane, but the patrol has proposed a compulsory sanctuary registry.',
        },
        failure: {
          narrative:
            'A patrol drone mistakes the couch bubble for a docking bay and attaches a customs chain to the armrest. The captain breaks the chain, which brings every scanner to attention. Several transports scatter before crossing; one is detained with medicine still aboard. The crew negotiates the detainees’ release in exchange for the last fuel reserve and a signed admission of unlawful interference. The sanctuary remains beyond the checkpoint, but its families now know the captain’s bold shortcut was neither private nor safe.',
          flags: ['windglass-patrol-detentions', 'windglass-escort-debt'],
          delta: {
            ship_fuel: -3,
            crew_trust: -2,
            antagonist_pressure: 2,
          },
          callback:
            'The Windglass corridor confrontation stranded one transport and cost the crew a release agreement it must honor.',
        },
      },
    ],
  },
  'deposit-copy': {
    id: 'warp-e9-tellurian-deposit',
    title: 'A Fairly Accurate Account of Absolutely Everything',
    system: 'Tellurian Archive',
    opening:
      'The Tellurian Archive has reserved one shelf for the couch’s voyage. Unfortunately the nemesis arrived first with a beautifully bound history, a donation for the leaking roof, and a forged captain’s signature. The authentic crew log includes bad decisions, contradictory witnesses, and a scorch mark where the ship’s life-support bubble briefly decided it deserved a lunch break. The librarians want a deposit they can preserve without allowing the most generous sponsor to own the story.',
    conflict:
      'Only one account can become the official deposit. Accuracy, privacy and the Archive’s physical survival all have a price.',
    choices: [
      {
        id: 'publish-crew-corrections',
        label:
          'Deposit a corrected crew log with local witnesses as co-authors',
        approach:
          'Credit the communities who changed the voyage and give vulnerable contributors control of their identifying details',
        cost: 'The cross-system consultation costs fuel and delays the repairs to the Archive’s leaking roof.',
        policy: 'aid',
        check: { ability_any: ['diplomacy', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'The crew sits around the red couch and invites witnesses to strike out its grandest descriptions of the captain. Several communities add chapters explaining what they accomplished after the ship departed. The librarians publish a corrected edition with removable identity keys and no exclusive owner. A student points out that the nemesis’s beautiful foreword contains a sentence the captain has never uttered without laughing. The Archive shelves the forged book as evidence and lets the witnesses keep their own editions.',
          flags: ['archive-community-authors', 'archive-corrected-deposit'],
          delta: { treaty_trust: 3, crew_trust: 2, ship_fuel: -2 },
          callback:
            'The Tellurian record now belongs to its witnesses as co-authors, rather than to the captain or the nemesis.',
        },
        failure: {
          narrative:
            'The consultation stalls when a volunteer types a protected witness’s former name into the public index. The captain pulls the book before it is distributed, and the Archive refuses to treat a hasty deletion as adequate protection. Local contributors form a review council with veto rights, leaving the official shelf empty for now. Rain leaks through the roof onto the nemesis’s lavishly bound manuscript. The librarian saves the wet pages as evidence of funding pressure, not as the truth.',
          flags: ['archive-identity-review', 'archive-deposit-delayed'],
          delta: { treaty_trust: -1, crew_trust: 1, ship_fuel: -3 },
          callback:
            'The Tellurian witnesses suspended the deposit after an identity leak and retained final editorial control.',
        },
      },
      {
        id: 'forensic-account-audit',
        label: 'Forensically compare the forged and authentic voyage records',
        approach:
          'Test timestamps, quoted speech and shield telemetry before accepting either account as authoritative',
        cost: 'The investigation consumes the Archive’s last working scanner and exposes private crew disputes to scrutiny.',
        policy: 'observe',
        check: { ability_any: ['science', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'The scanner finds the nemesis described a docking maneuver that happened while the couch was entirely inside a restaurant. The forgery’s timestamps also place the captain in two separate arguments at the same instant, a feat the crew says is possible but undocumented. The librarians retain both manuscripts, label the forged one a contested source, and publish the verification method for future visitors. The captain accepts a footnote stating that the authentic log is not necessarily flattering either.',
          flags: ['archive-forgery-exposed', 'archive-evidence-method'],
          delta: {
            medical_knowledge: 2,
            treaty_trust: 2,
            ship_fuel: -2,
          },
          callback:
            'The Archive exposed the forged account with public evidence, while retaining it as a clearly labeled historical source.',
        },
        failure: {
          narrative:
            'The last scanner burns out while testing an encrypted memory crystal. The nemesis accuses the captain of destroying inconvenient proof, then offers another roof donation if the forged copy is shelved immediately. The librarians decline the condition and quarantine both books. A junior archivist builds a manual cross-reference from passenger testimony and asks the captain to return with a functioning scanner. The ceiling continues to leak, and the true account remains contested rather than conveniently lost.',
          flags: ['archive-scanner-lost', 'archive-contested-shelf'],
          delta: {
            treaty_trust: -2,
            ship_fuel: -1,
            antagonist_pressure: 2,
          },
          callback:
            'Tellurian’s scanner failed during the forgery investigation; both accounts remain under independent review.',
        },
      },
      {
        id: 'repair-roof-for-deposit',
        label:
          'Repair the Archive roof immediately in exchange for a deposit vote',
        approach:
          'Use the couch’s spare shield projector to save the library before officials decide which history deserves its shelf',
        cost: 'A material rescue wins time but may pressure librarians to favor the captain’s manuscript over competing testimony.',
        policy: 'intervene',
        check: { ability_any: ['rescue', 'tactics'], difficulty: 7 },
        success: {
          narrative:
            'The captain unfolds a pocket-room workshop behind the couch and braces the leaking dome with the spare shield projector. Thousands of damp books survive. In return, the librarians insist on an open vote and accept neither the captain’s preferred chapter nor the nemesis’s expensive binding without annotation. The captain grudgingly agrees that fixing a roof does not buy a shelf. Outside, the rainwater runs down the bubble and the archivists use it to clean their public noticeboard.',
          flags: ['archive-roof-preserved', 'archive-independent-vote'],
          delta: { sanctuary_trust: 2, ship_fuel: -2, crew_trust: 1 },
          callback:
            'The couch saved the Archive roof, but the librarians kept their deposit vote independent of the rescue.',
        },
        failure: {
          narrative:
            'The improvised projector protects the rarest manuscripts but diverts power from the outer couch bubble. The passengers spend a cold hour in a leaking reading room while librarians ferry books to high shelves. The nemesis uses the chaos to announce that the captain offered the rescue as payment for authorship. The captain publicly withdraws the offer and leaves the surviving manuscripts under a neutral committee’s custody. The roof needs a real repair, and the crew has lost the part that could have carried it home.',
          flags: ['archive-shield-diverted', 'archive-neutral-custody'],
          delta: { ship_fuel: -3, crew_trust: -2, treaty_trust: -1 },
          callback:
            'Tellurian’s emergency roof rescue damaged the couch’s shield reserve; independent librarians hold the surviving records.',
        },
      },
    ],
  },
} satisfies Record<string, ConsequenceEpisode>
