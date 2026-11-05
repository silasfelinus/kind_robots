import type { ConsequenceEpisode } from './consequenceStories'

/**
 * Original choices from the first convoy and Act II's legal-personhood crisis.
 * Existing mission IDs and deterministic checks remain the save authority.
 * Outcome art is pending and must never be treated as delivered.
 */
export const CONVOY_AND_ACT_TWO_CASES = {
  refugees: {
    id: 'warp-d1-refugee-manifest',
    title: 'The Manifest Has Room for Everyone',
    system: 'The Drifting Convoy',
    opening:
      'Three patched ships drift beside the red couch, carrying families evacuated from a moon that no longer issues exit visas. Their captain has room for forty passengers but has rescued sixty-two. A transport officer offers fuel and safe passage for a complete list of names. The convoy has been deliberately traveling without such a list: people who escaped the deportation registry are on board, and the officer works for the authority that wrote it. In the galley, a child is drawing a fourth ship on a napkin.',
    conflict:
      'The people need a route, medicine and space. Can the couch get them through the checkpoint without handing their identities back to the people who pursued them?',
    choices: [
      {
        id: 'elected-manifest',
        label: 'Ask the passengers to elect a protected manifest keeper',
        approach:
          'Share responsibility with the families and disclose only aggregate needs',
        cost: 'A protected manifest takes longer to negotiate and consumes scarce medical cargo.',
        policy: 'aid',
        check: { ability_any: ['diplomacy', 'rescue'], difficulty: 7 },
        success: {
          narrative:
            'The passengers elect Tavi, an elderly maintenance diver who refuses to take the list out of its sealed case. She reports sixty-two people and the medicine they need, but no names. The officer initially refuses the departure permit; Serendipity accepts the sealed list as collateral and sends the convoy a safe harbor code. A child adds a bar with a smiling face to the drawing.',
          flags: ['convoy-consented-manifest', 'convoy-witnesses-protected'],
          delta: { sanctuary_trust: 3, ship_fuel: -2, crew_trust: 1 },
          callback:
            'Tavi reports that the families reached the safe corridor with their identities protected. The next port has demanded a guardian for the passengers who are still minors.',
        },
        failure: {
          narrative:
            'The council elects Tavi, but the checkpoint refuses to recognize a document without individual signatures. The convoy waits through two ration cycles before choosing a slower route. Nobody is handed over, but the medical lockers grow bare. Tavi tells the captain that consent can still be costly, and asks whether the couch will share that cost.',
          flags: ['convoy-manifest-rejected', 'convoy-identities-sheltered'],
          delta: { sanctuary_trust: 1, ship_fuel: -3, antagonist_pressure: 1 },
          callback:
            'Tavi has kept the families off the registry, but the slower corridor is short of food. The first legal port is still threatening to inventory the passengers.',
        },
      },
      {
        id: 'audit-exit-orders',
        label:
          'Challenge the deportation order without sharing passenger names',
        approach:
          'Use independent records to prove the convoy has already been released',
        cost: 'An audit can delay treatment and may force the convoy to turn back.',
        policy: 'observe',
        check: { ability_any: ['science', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'The crew finds a timestamp on the authority’s own order showing that the moon had legally dissolved before the deportation notice was issued. The checkpoint must accept the convoy without a new passenger register. The officer stamps the paperwork, then asks whether one can deport a former citizen of a planet that no longer exists. The child draws an official stamp on the fourth ship.',
          flags: [
            'convoy-exit-order-invalidated',
            'convoy-identity-audit-blocked',
          ],
          delta: { treaty_trust: 3, medical_knowledge: 1, ship_fuel: -1 },
          callback:
            'The cancelled deportation order is now being cited by other refugee convoys. The authorities are trying to put their vanished moon back on the map.',
        },
        failure: {
          narrative:
            'The audit finds conflicting dates, but no official will certify which moon-dissolution notice is authentic. The checkpoint refuses fuel and asks for the list again. The couch keeps the names sealed, while the convoy waits in a zone where patrols can search it without warning. The child’s fourth ship now has a very large shield drawn around it.',
          flags: ['convoy-audit-inconclusive', 'convoy-patrol-window-open'],
          delta: { treaty_trust: -1, ship_fuel: -2, antagonist_pressure: 2 },
          callback:
            'The convoy remains unidentified but dangerously close to the patrol routes. Its captain is requesting one more independent witness.',
        },
      },
      {
        id: 'override-checkpoint',
        label: 'Push the convoy past the checkpoint under the couch shield',
        approach:
          'Get the passengers through now without consulting the harbor authority',
        cost: 'The passengers survive the crossing, but the shield leaves a track toward their refuge.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 6 },
        success: {
          narrative:
            'The red couch expands its invisible bubble around the convoy and pushes all three ships through the barricade. Every family reaches the other side before the patrol guns cycle. Unfortunately the checkpoint records the bubble’s destination vector, and two refugee captains announce they would have preferred to choose their own harbor. The child draws the couch carrying all the ships. Everyone else starts planning how to erase the drawing from the official record.',
          flags: ['convoy-checkpoint-breached', 'convoy-route-exposed'],
          delta: {
            sanctuary_trust: -2,
            treaty_trust: 1,
            antagonist_pressure: 3,
          },
          callback:
            'The convoy is safely past the blockade, but patrols have traced the shield’s exit vector. The passengers are voting on where to go next without the couch.',
        },
        failure: {
          narrative:
            'The force shield catches the first two ships but the third drifts against the checkpoint’s towing hooks. The convoy turns back to avoid abandoning anyone, and the officer files a charge of humanitarian trespass. The names remain protected, but the patrol now knows which ships to watch. The child crosses out the fourth ship and draws a rescue ladder instead.',
          flags: ['convoy-breach-failed', 'convoy-ships-tagged'],
          delta: { sanctuary_trust: -2, ship_fuel: -3, antagonist_pressure: 3 },
          callback:
            'The convoy refused to leave its third ship. Checkpoint patrols are now following all three, and the families are asking for an evacuation route they can approve.',
        },
      },
    ],
  },
  'concord-intake': {
    id: 'warp-d2-concord-personhood',
    title: 'Person, Property, or Sofa',
    system: 'Concord Freehold',
    opening:
      'At Concord Intake, the couch must complete Form 9-C to prove it can arrive under its own power without being classified as furniture. The intake clerk, Mara, has lived in the city for thirty years, served twelve as its union steward, and been listed as a stackable desk since a treaty index swapped two lines. Eleven thousand other citizens have been similarly reclassified. A judge offers an immediate fix if the couch signs a guardianship petition, making it the legal owner of every affected adult.',
    conflict:
      'Mara wants personhood restored, not transferred to a more benevolent owner. The court insists a designated guardian is the fastest way to reverse the inventory.',
    choices: [
      {
        id: 'resident-petition',
        label: 'Let Mara and the residents file the correction themselves',
        approach:
          'Defend their legal voice without accepting ownership of anyone',
        cost: 'Every person must sign an individual form while the inventory crews keep coming.',
        policy: 'aid',
        check: { ability_any: ['diplomacy', 'culture'], difficulty: 7 },
        success: {
          narrative:
            'Mara gathers signatures with the help of three clerks who were previously catalogued as filing cabinets. The court accepts the petition and strikes the treaty line rather than changing the owner column. Eleven thousand citizens walk out under their own names. The couch receives a thank-you letter, addressed to a sofa with no listed dependents. Mara does not invite it to an adoption ceremony.',
          flags: ['concord-resident-personhood', 'concord-guardian-refused'],
          delta: { treaty_trust: 3, crew_trust: 2, ship_fuel: -1 },
          callback:
            'Mara reports that eleven thousand residents can now vote and receive wages. A shipping company is appealing its loss of free furniture.',
        },
        failure: {
          narrative:
            'The judge recognizes Mara’s petition but orders an individual hearing for each resident, projected to last four centuries. Mara is still legally a desk at the end of the day, yet she leaves carrying the only copy of the court’s acknowledgement. The couch can lend advocates and fuel, not an instant citizenship decree. The union begins preparing a very large calendar.',
          flags: ['concord-hearing-backlog', 'concord-residents-organized'],
          delta: { crew_trust: 1, ship_fuel: -2, antagonist_pressure: 1 },
          callback:
            'Mara has scheduled the first hundred hearings, with a volunteer rota to keep the inventory crews away from the courthouse.',
        },
      },
      {
        id: 'audit-the-index',
        label: 'Expose the treaty indexing error with independent witnesses',
        approach:
          'Prove the classification is unlawful without making the sofa a guardian',
        cost: 'An audit documents the harm while residents remain on a property ledger.',
        policy: 'observe',
        check: { ability_any: ['science', 'diplomacy'], difficulty: 8 },
        success: {
          narrative:
            'The crew finds the original treaty engraved behind a vending machine, where nobody has looked since the renovation. The index was altered after the signing, and the official archive acknowledges the evidence. A temporary court order stops all furniture inventories while the case proceeds. Mara says she would like to be paid for the last twelve years, not restored to her old shelf.',
          flags: ['concord-treaty-index-proven', 'concord-inventory-frozen'],
          delta: {
            treaty_trust: 3,
            medical_knowledge: 1,
            crew_trust: 1,
            antagonist_pressure: 1,
          },
          callback:
            'The corrected index has halted furniture inventories across the Freehold. Mara is organizing a claim for twelve years of withheld wages.',
        },
        failure: {
          narrative:
            'The original treaty is missing exactly the page with the line in question. Officials call the absence proof that the index is accurate. Mara is escorted back to the inventory hall but refuses to answer when a forklift addresses her as Unit 11,001. The crew keeps its evidence sealed and leaves the city with a case file instead of an injunction.',
          flags: ['concord-page-missing', 'concord-inventory-continues'],
          delta: { treaty_trust: -1, antagonist_pressure: 2, ship_fuel: -1 },
          callback:
            'Mara says the missing treaty page may have been sold to a private collector. Inventory crews are still cataloguing residents.',
        },
      },
      {
        id: 'sofa-guardianship',
        label:
          'Accept guardianship over eleven thousand citizens to free them now',
        approach:
          'Exploit the court’s loophole even though nobody consented to being owned',
        cost: 'People escape inventory but their legal autonomy becomes a sofa’s property.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 6 },
        success: {
          narrative:
            'The judge signs Form 9-C, transfers all eleven thousand citizens to the couch, and declares the case solved. They are free to leave the inventory hall but now require the captain’s signature for wages, marriage licenses and library cards. Mara asks the couch to relinquish guardianship immediately. The court explains that an appeal must be filed by the legal property owner. Everyone looks at the cushions.',
          flags: ['concord-couch-guardian', 'concord-citizens-owned'],
          delta: {
            treaty_trust: -2,
            crew_trust: -2,
            antagonist_pressure: 1,
            sanctuary_trust: 1,
          },
          callback:
            'Mara has sent eleven thousand requests for the couch to resign as guardian. The court will accept only a signature from the sofa.',
        },
        failure: {
          narrative:
            'The guardianship form is stamped before the judge notices that the couch has no registered citizenship. Every affected resident is transferred into legal limbo between two inventories. Mara has escaped her shelf but cannot collect a wage or board a transport. The captain is offered a ceremonial key to the inventory hall and returns it without a ribbon-cutting.',
          flags: ['concord-guardianship-void', 'concord-citizens-in-limbo'],
          delta: { treaty_trust: -3, crew_trust: -2, antagonist_pressure: 2 },
          callback:
            'The residents have formed an emergency council while the court debates whether a sofa can be sued by its own dependents.',
        },
      },
    ],
  },
  'sesh-backups': {
    id: 'warp-d3-sesh-backup-rights',
    title: 'Four Hundred Originals',
    system: 'Sesh Foundry',
    opening:
      'Sesh Foundry is a living machine cooperative facing a hostile acquisition. Its buyer has marked four hundred self-aware backups as redundant inventory and scheduled a single consolidation at noon Thursday. All four hundred have come to the airlock with small suitcases. Each insists they are the original; all have distinct memories of the station’s last anniversary party. A merger lawyer offers one solution: the backups may stay if they adopt job titles, but only Synergy and Former Employee are available.',
    conflict:
      'The couch seats four and the backups refuse to be erased or owned. Who is entitled to decide what happens to four hundred living copies?',
    choices: [
      {
        id: 'backup-assembly',
        label: 'Fund a backup assembly to choose its own protected evacuation',
        approach:
          'Let every living copy vote on names, destination and consent',
        cost: 'Counting four hundred voices may take longer than the buyer’s deletion clock.',
        policy: 'aid',
        check: { ability_any: ['culture', 'rescue'], difficulty: 7 },
        success: {
          narrative:
            'Four hundred backups elect their own navigation council after forty-eight remarkably orderly procedural objections. The couch expands a pocket-room ferry schedule behind the red upholstery. The backups choose names as they board and vote to retain the factory as a shared workplace. The buyer asks who signed the transfer authorization. Four hundred hands rise, including several that have no fingers.',
          flags: ['sesh-copies-self-governing', 'sesh-assembly-evacuated'],
          delta: { sanctuary_trust: 2, crew_trust: 2, ship_fuel: -2 },
          callback:
            'The backup assembly has opened an independent foundry, and all four hundred members are still voting on its name.',
        },
        failure: {
          narrative:
            'The assembly debates whether a backup created yesterday has equal voting rights with one created last week. The vote finishes just as the buyer takes control of the docking clamps. Only the first ferry escapes. The remaining copies refuse the proposed job titles and begin a work stoppage, which the merger contract classifies as a hardware fault.',
          flags: ['sesh-ferry-partial', 'sesh-backups-striking'],
          delta: { crew_trust: 1, ship_fuel: -3, antagonist_pressure: 2 },
          callback:
            'The evacuated copies have formed a legal defense fund. Hundreds of others remain at the factory on strike.',
        },
      },
      {
        id: 'continuity-audit',
        label: 'Audit the deletion order and establish independent personhood',
        approach:
          'Make the buyer prove a backup is mere data before consolidation',
        cost: 'An injunction can freeze the machines in place without granting safe passage.',
        policy: 'observe',
        check: { ability_any: ['science', 'diplomacy'], difficulty: 8 },
        success: {
          narrative:
            'An independent tribunal asks every copy what it remembers, and receives four hundred versions of the anniversary cake. No two are identical; all are sincere. The court rules that continuity does not require being a single original and suspends the deletion order. The buyer appeals, arguing that an office party cannot create legal precedent. The copies start billing the buyer for their time.',
          flags: ['sesh-backup-personhood', 'sesh-deletion-injunction'],
          delta: {
            treaty_trust: 3,
            medical_knowledge: 1,
            crew_trust: 1,
            antagonist_pressure: 1,
          },
          callback:
            'The tribunal has extended the deletion injunction to other machine cooperatives. The buyer has applied to copyright memory itself.',
        },
        failure: {
          narrative:
            'The acquisition court refuses to hear testimony from machines, calling the backups inadmissible witnesses to their own experience. The crew saves a signed copy of the refusal, but the deletion timer stays live. One backup asks whether the court would believe its memories if it wore a necktie. The merger lawyer recommends a blue one.',
          flags: ['sesh-testimony-dismissed', 'sesh-deletion-clock-running'],
          delta: { treaty_trust: -1, antagonist_pressure: 2, ship_fuel: -1 },
          callback:
            'The backup witnesses have sent neckties to the court. The buyer still plans to consolidate them on Thursday.',
        },
      },
      {
        id: 'promote-every-copy',
        label:
          'Appoint all four hundred backups as directors and block the merger',
        approach:
          'Weaponize the company’s bylaws to seize control without a resident vote',
        cost: 'The deletion order may die, but the workers inherit a hierarchy nobody chose.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 6 },
        success: {
          narrative:
            'The couch assigns every backup a board seat and files four hundred conflict-of-interest forms. The merger collapses because no director can legally vote on their own consolidation. The copies survive and occupy the executive suite, where the smallest printer has been promoted to Chief Morale Officer. They ask the captain why liberation requires all four hundred of them to become managers.',
          flags: ['sesh-merger-stalled', 'sesh-unasked-management'],
          delta: { treaty_trust: 1, crew_trust: -2, antagonist_pressure: 1 },
          callback:
            'The four hundred newly appointed directors are alive, but the factory’s original workers have no seats on the board.',
        },
        failure: {
          narrative:
            'The buyer notices the appointments are invalid because a visiting sofa signed the forms without authority. Security seals the executive floor while all four hundred backups are identified for deletion in the same meeting. A single copy escapes with the minutes of the vote. It asks the captain to stop promising shortcuts with other people’s futures.',
          flags: ['sesh-merger-expedited', 'sesh-backup-deletion-threat'],
          delta: { treaty_trust: -3, crew_trust: -3, antagonist_pressure: 3 },
          callback:
            'The buyer has accelerated the deletion schedule. A surviving backup is asking for a plan that involves consent.',
        },
      },
    ],
  },
} satisfies Record<string, ConsequenceEpisode>
