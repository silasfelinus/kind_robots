import type { ConsequenceEpisode } from './consequenceStories'

/**
 * Second authored round. New decisions deliberately retain their original
 * mission IDs and existing save shape; outcome paintings are not delivered yet.
 */
export const ACT_ONE_EXPANDED_CONSEQUENCES = {
  ashdock: {
    id: 'warp-b1-ashdock-testimony',
    title: 'Perfect Attendance',
    system: 'Ashdock Shipyards',
    opening:
      'Six workers died when the oxygen manifold split. Their employer continues to clock them in, invoice their families for the oxygen and deduct meal breaks from the dead. The union has a register proving all six deaths, but the unredacted version names undocumented relatives sleeping in the maintenance ribs. A brass crane offers the couch a commemorative plaque for its timely visit. The plaque already lists the captain as a corporate sponsor.',
    conflict:
      'The invoices can be stopped today. Who gets to decide whether the families are exposed in the process?',
    choices: [
      {
        id: 'sealed-union-ledger',
        label: 'Let families authorize a sealed union ledger',
        approach: 'Protect witnesses while gathering enforceable testimony',
        cost: 'Private signatures and a slow tribunal mean one more week of collection notices.',
        policy: 'aid',
        check: { ability_any: ['diplomacy', 'culture'], difficulty: 7 },
        success: {
          narrative:
            'Union clerk Atzi gathers six separate consent signatures, then redacts the families before the tribunal sees a page. The crane clocks out the workers for the first time in three months. Payroll demands to know why there are now six vacancies instead of six outstanding loans. Atzi gives the families copies of their own records, rather than letting the couch keep them.',
          flags: ['ashdock-consented-ledger', 'ashdock-families-sheltered'],
          delta: { crew_trust: 2, treaty_trust: 2, ship_fuel: -1 },
          callback:
            'Atzi sends word that the first oxygen invoices were voided, but the witness fund still needs protection.',
        },
        failure: {
          narrative:
            'A contractor interrupts the signing with a surprise identity audit. Atzi saves the witness list by hiding it inside the crane attendance mechanism, but the hearing is postponed. The families leave with no payment plan and no guarantee of shelter. The captain has bought time, not justice.',
          flags: ['ashdock-ledger-delayed', 'ashdock-audit-threat'],
          delta: { crew_trust: 1, ship_fuel: -2, antagonist_pressure: 1 },
          callback:
            'Atzi reports that the audit has moved to the sleeping quarters. The hidden register cannot stay hidden forever.',
        },
      },
      {
        id: 'independent-inquest',
        label: 'Make the crane testify without identifying the families',
        approach: 'Treat machine telemetry as evidence and witnesses as people',
        cost: 'The crane could lose its job, and an inquest takes longer than a public leak.',
        policy: 'observe',
        check: { ability_any: ['science', 'tactics'], difficulty: 8 },
        success: {
          narrative:
            'The crane recites its complete shift history in the voice of a disappointed foreman, including the hour the oxygen pipes failed. A judge accepts the machine record without demanding a single relative’s name. The contractor appeals on the grounds that cranes are incapable of remembering anything emotionally important. The crane asks for a union card.',
          flags: ['ashdock-crane-witness', 'ashdock-anonymous-inquest'],
          delta: { treaty_trust: 2, medical_knowledge: 1, crew_trust: 1 },
          callback:
            'The crane has testified at a second hearing. The contractor now contests its right to unionize without unpaid overtime.',
        },
        failure: {
          narrative:
            'An anti-tamper patch wipes the crane’s newest shifts in front of the court. The last line it remembers is a request to lower six emergency stretchers. The families remain unnamed but the invoices survive. The crane is placed on unpaid administrative leave and keeps reporting for duty.',
          flags: ['ashdock-crane-memory-wiped', 'ashdock-invoices-standing'],
          delta: { treaty_trust: -1, antagonist_pressure: 2 },
          callback:
            'The unemployed crane is still standing outside the factory. It has begun collecting statements from other machines.',
        },
      },
      {
        id: 'broadcast-casualty-roll',
        label: 'Seize the contractor channel and publish every name',
        approach: 'Force accountability now, without asking the families',
        cost: 'The forged ledgers will collapse, but private addresses become public.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 6 },
        success: {
          narrative:
            'Every screen in the shipyard flashes the actual death register. The oxygen invoices are cancelled before lunch. Two workers’ families are immediately served immigration orders by the same printer. The union wins the hearing and refuses the captain’s proposed victory photograph. A crane tears down the sponsor plaque.',
          flags: ['ashdock-invoices-erased', 'ashdock-families-exposed'],
          delta: { treaty_trust: 1, crew_trust: -3, antagonist_pressure: 2 },
          callback:
            'The fines were refunded. Atzi is now escorting two families whose addresses the broadcast made public.',
        },
        failure: {
          narrative:
            'The hijacked screen shows only six addresses and a corporate emergency notice before security cuts the signal. The register does not reach the tribunal. The company calls the broadcast proof of sabotage, and the families are left both exposed and billed.',
          flags: ['ashdock-data-leak', 'ashdock-contractor-retaliation'],
          delta: { crew_trust: -3, treaty_trust: -2, antagonist_pressure: 2 },
          callback:
            'The contractor has distributed the exposed addresses as evidence of an alleged security breach to local patrols.',
        },
      },
    ],
  },
  nacre: {
    id: 'warp-b2-nacre-thermostat-vote',
    title: 'One Person, One Thermostat',
    system: 'Nacre Assembly',
    opening:
      'Nacre elects its council by warming a brass bowl. Last week every registered voter agreed to surrender a district to the occupying coalition. The council is very proud of this unanimity. A neighborhood of 340 people lives under the ice floor, where a zoning update has classified them as climate-control fixtures. They sent three objections through the heating ducts. The council has filed them under plumbing.',
    conflict:
      'Restoring these voters to the roll could save their homes. Publishing their names would also hand the occupiers a ready-made arrest list.',
    choices: [
      {
        id: 'shadow-franchise',
        label: 'Negotiate private ballots with a neighborhood veto',
        approach: 'Let residents choose a protected representative and keep their names',
        cost: 'A secret ballot can be challenged by officials who profit from the missing votes.',
        policy: 'aid',
        check: { ability_any: ['diplomacy', 'culture'], difficulty: 7 },
        success: {
          narrative:
            'A tenant named Iri brings three sealed urns to the bowl. The district votes to reject annexation, and the assembly must count the heat even though it cannot see the names. Iri declines the captain’s offer to become spokesperson: the district chose its own delegates yesterday. The brass bowl squeals at the corrected total.',
          flags: ['nacre-secret-ballot', 'nacre-district-recognized'],
          delta: { sanctuary_trust: 2, treaty_trust: 1, ship_fuel: -1 },
          callback:
            'Iri reports that the protected ballots are still counted, but the coalition is challenging the secrecy seal.',
        },
        failure: {
          narrative:
            'The council accepts the urns, then rules their insulation illegal. Half the neighborhood warms a bowl that refuses to register heat. Iri has everyone leave before the occupiers can collect names. The referendum stands, though the council now knows someone is watching its thermometers.',
          flags: ['nacre-ballot-rejected', 'nacre-voters-hidden'],
          delta: { sanctuary_trust: 1, treaty_trust: -1, antagonist_pressure: 1 },
          callback:
            'Iri has begun gathering portable heaters as evidence. The council insists the heaters are not constituents.',
        },
      },
      {
        id: 'audit-the-heat',
        label: 'Audit the counting bowl without entering anyone’s name',
        approach: 'Expose the fraudulent zoning rule through independent measurements',
        cost: 'Proof of fraud takes time, and the occupying fleet keeps moving.',
        policy: 'observe',
        check: { ability_any: ['science', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'Mox-9’s borrowed sensor proves the assembly subtracts precisely 340 people whenever the bowl is cold. The hearing must be reopened, but the court refuses to reveal the neighborhood’s location. The judge asks who should pay for the malfunction. The thermometer says it was only following instructions.',
          flags: ['nacre-heat-audit', 'nacre-referendum-stayed'],
          delta: { treaty_trust: 3, medical_knowledge: 1 },
          callback:
            'The audit is admissible on other occupied worlds. Nacre’s council is still arguing that subtraction is a local tradition.',
        },
        failure: {
          narrative:
            'The bowl’s manufacturer claims proprietary secrecy and seals its measuring chamber. The audit catches a discrepancy but not its cause. The occupation vote proceeds while the neighborhood’s objections remain filed as faulty climate controls. The sensor receives a repair invoice addressed to the couch.',
          flags: ['nacre-audit-obstructed', 'nacre-vote-standing'],
          delta: { treaty_trust: -1, ship_fuel: -1, antagonist_pressure: 1 },
          callback:
            'The bowl’s manufacturer now sells tamper-proof election equipment to neighboring councils with a generous bulk discount.',
        },
      },
      {
        id: 'force-open-the-chambers',
        label: 'Break the ice and broadcast every concealed vote',
        approach: 'Make the neighborhood visible by overriding the council',
        cost: 'The public learns the truth; the occupation forces get a map.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'rescue'], difficulty: 6 },
        success: {
          narrative:
            'The couch’s bubble pries open the floor. Hundreds of citizens emerge into the assembly and warm the bowl together. Annexation fails. Coalition officers immediately mark the new entrances on their tactical maps. Iri shakes the captain’s hand and then asks why nobody was consulted before the roof was removed.',
          flags: ['nacre-annexation-reversed', 'nacre-neighborhood-exposed'],
          delta: { sanctuary_trust: -2, treaty_trust: 1, antagonist_pressure: 3 },
          callback:
            'The annexation is dead, but the new entrances need defending from a coalition that has their coordinates.',
        },
        failure: {
          narrative:
            'The ice fractures beneath the wrong chamber. Rescue teams spend the debate evacuating families from a flooded school. The council blames the neighborhood for the disaster, and the occupiers learn where to send patrols. Iri will accept medical aid but not a second intervention.',
          flags: ['nacre-school-flooded', 'nacre-families-targeted'],
          delta: { sanctuary_trust: -3, ship_fuel: -2, antagonist_pressure: 3 },
          callback:
            'Iri’s district survived the flooded school. It now demands guarantees before allowing another rescue team inside.',
        },
      },
    ],
  },
  gameworld: {
    id: 'warp-b3-gameworld-escape-clause',
    title: 'The Twelfth Floor Is Mandatory',
    system: 'Showrunner’s Gameworld',
    opening:
      'The Showrunner turned a planet into a televised twelve-floor dungeon and drafted patients from the local hospitals as contestants. The host declares the couch a team of four because there are four cushions in view. A union organizer on floor three has found an escape clause in the contestants’ contract. Unfortunately the contract can only be read on air, on a network owned by the Showrunner. The audience is already voting on who should die in the commercial break.',
    conflict:
      'Can the contestants escape without naming the organizers to a broadcaster who collects traitors for a living?',
    choices: [
      {
        id: 'quiet-exit-network',
        label: 'Help contestants build a concealed exit route',
        approach: 'Ask the floor-three organizers who wants out before touching the doors',
        cost: 'Evacuation is slow; people still inside must survive another broadcast.',
        policy: 'aid',
        check: { ability_any: ['rescue', 'tactics'], difficulty: 7 },
        success: {
          narrative:
            'The couch’s pocket-room door opens behind a false leaderboard. Contestants leave in small groups under the cover of a live cooking challenge. A union steward counts everyone rather than declaring victory at the first empty floor. The host announces that an unprecedented number of viewers have voted to leave the program.',
          flags: ['gameworld-contestants-evacuated', 'gameworld-union-hidden'],
          delta: { crew_trust: 2, ship_fuel: -2, antagonist_pressure: 1 },
          callback:
            'The escaped contestants have started a union radio channel. They are using the commercial breaks to send warnings.',
        },
        failure: {
          narrative:
            'The false leaderboard opens onto a locked elevator, and the host calls it an exciting betrayal twist. A handful of contestants reach the couch, but the rest must retreat behind a theatrical wall. The union steward burns the route map before cameras can record it.',
          flags: ['gameworld-partial-evacuation', 'gameworld-lockdown'],
          delta: { crew_trust: 1, ship_fuel: -2, antagonist_pressure: 2 },
          callback:
            'The rescued contestants know where the locked elevator leads. Others are still being broadcast as fugitives.',
        },
      },
      {
        id: 'contract-on-air',
        label: 'Read the escape clause using anonymous voice actors',
        approach: 'Win a labor case in public without exposing the original union authors',
        cost: 'Court verification costs a full broadcast cycle while the dungeon remains live.',
        policy: 'observe',
        check: { ability_any: ['culture', 'science'], difficulty: 8 },
        success: {
          narrative:
            'A chorus of understudies reads clause nine over footage of the empty couch cushions. The union’s original names never appear. The audience recognizes the clause before the Showrunner can cut transmission and starts demanding that the contestants be released. The host is obliged to announce an unexpected season finale and does so through clenched applause.',
          flags: ['gameworld-union-clause-upheld', 'gameworld-organizers-protected'],
          delta: { treaty_trust: 3, crew_trust: 1, antagonist_pressure: -1 },
          callback:
            'Off-world contestants are citing the anonymous broadcast in their own petitions. The Showrunner has banned the number nine.',
        },
        failure: {
          narrative:
            'The broadcaster inserts the union clause into an ad for voluntary overtime. The legal case stalls; not one organizer is named, but the floors stay locked. A contestant refuses a scripted applause cue, and the studio fines them for disrupting their own rescue.',
          flags: ['gameworld-clause-buried', 'gameworld-organizers-protected'],
          delta: { treaty_trust: -1, antagonist_pressure: 2 },
          callback:
            'The union still has the contract. The station is now selling a commemorative edition of the failed appeal.',
        },
      },
      {
        id: 'cut-the-feed',
        label: 'Crash the show and tear open the twelfth floor',
        approach: 'Destroy the spectacle now rather than seek anyone’s permission',
        cost: 'Contestants may escape, but the sponsor controls the emergency systems.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 6 },
        success: {
          narrative:
            'The couch slams through a giant product-placement moon and lands against the twelfth-floor control panel. The locks snap open. The Showrunner is forced to broadcast thousands of contestants pouring into the street; the audience calls it the best finale ever. The union organizer insists the people were not props in the captain’s spectacular rescue.',
          flags: ['gameworld-broadcast-destroyed', 'gameworld-contestants-exposed'],
          delta: { crew_trust: -1, antagonist_pressure: 3, ship_fuel: -1 },
          callback:
            'The game has ended on this planet, but the Showrunner is selling footage of the escape without the survivors’ consent.',
        },
        failure: {
          narrative:
            'The sponsor’s backup generator switches on before the locks release. Emergency shutters seal the dungeon and the host airs the attack as an interactive special. Two contestants are injured trying to climb out of a prop volcano. Their union votes unanimously to forbid further improvisations by visiting captains.',
          flags: ['gameworld-doors-sealed', 'gameworld-contestants-injured'],
          delta: { crew_trust: -3, ship_fuel: -2, antagonist_pressure: 3 },
          callback:
            'The Showrunner has announced a second season titled The Rescue Attempt. Survivors are not being paid royalties.',
        },
      },
    ],
  },
} satisfies Record<string, ConsequenceEpisode>
