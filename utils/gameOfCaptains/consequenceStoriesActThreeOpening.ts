import type { ConsequenceEpisode } from './consequenceStories'

/** Chapter seven returns to earlier promises. These outcome art slots are pending. */
export const ACT_THREE_OPENING_CASES = {
  'jump-gate-permit': {
    id: 'warp-e1-permission-to-leave',
    title: 'Permission to Leave',
    system: 'Concord Freehold',
    opening:
      'At the edge of the last chart, the jump gate refuses passage without a consultation certificate. Its registry has generated a list of everyone affected by the red couch: residents, species, a few offended corporations, one self-governing library and three planets that have objected to being listed as property. Mara, the former Concord inventory clerk, offers to chair the hearing. The gate accountant warns that the hearing will outlast the couch’s oxygen reserves unless the bubble agrees to count as public transport. The bubble has not consented to being transport.',
    conflict:
      'The gate will open for a signature. Who gets a genuine hearing when a captain’s decisions have crossed whole systems, and whose silence counts as consent?',
    choices: [
      {
        id: 'consult-affected-worlds',
        label: 'Invite affected communities to negotiate a shorter hearing',
        approach: 'Let named witnesses decide how their objections will be heard',
        cost: 'A genuine hearing costs fuel and time, and the witnesses are free to refuse the route.',
        policy: 'aid',
        check: { ability_any: ['diplomacy', 'culture'], difficulty: 7 },
        success: {
          narrative:
            'Mara opens the meeting by returning the registry to the people it names. The convoy families send a representative instead of a passenger list; the living library objects through a single authorized page. The gate accepts a limited permit with conditions the couch can actually keep. Mara stamps the last page under her own name, not under the furniture category. Several parties withhold forgiveness. They are still allowed to travel.',
          flags: ['gate-hearing-consented', 'gate-conditional-permit'],
          delta: { treaty_trust: 3, crew_trust: 2, ship_fuel: -2 },
          callback:
            'The gate committee has published a limited permit with the objections attached. Mara says future captains will have to read the objections before treating an open gate as permission to do anything.',
        },
        failure: {
          narrative:
            'Half the witnesses arrive while the other half are still choosing their delegates. The accountant calls the meeting invalid because a planet submitted a geological formation as its signature. Mara refuses to sign on its behalf. The couch must divert to a slow service lane, carrying every unresolved petition. The crew loses fuel but keeps the names sealed, and the gate now owes those petitioners another hearing.',
          flags: ['gate-hearing-postponed', 'gate-service-detour'],
          delta: { treaty_trust: 1, ship_fuel: -3, antagonist_pressure: 1 },
          callback:
            'Mara has secured a second hearing, but the slow lane is being patrolled by officials who regard the red couch as a particularly noncompliant form of luggage.',
        },
      },
      {
        id: 'audit-the-register',
        label: 'Audit the registry before anyone signs a departure permit',
        approach: 'Separate genuine complainants from forged or duplicated objections',
        cost: 'An independent audit protects identities but cannot settle every real grievance.',
        policy: 'observe',
        check: { ability_any: ['science', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'Mox-9 notices that the same objection appears sixteen times under different moons. The nemesis has been filing complaints as a cooperative of unrelated chairs. The audit removes the forgeries while keeping the actual complainants and their right to object. A legal clerk issues a temporary passage order. Mara refuses to call this vindication: the route is open because the paperwork was honest, not because the captain was right.',
          flags: ['gate-fraud-audited', 'gate-temporary-passage'],
          delta: { treaty_trust: 2, medical_knowledge: 1, ship_fuel: -1 },
          callback:
            'The Freehold has traced the forged objections to a commercial fleet. Real petitioners are still waiting for answers, but their names can no longer be erased by duplicate complaints.',
        },
        failure: {
          narrative:
            'The registry has so many nested appeals that the audit cannot distinguish an invented witness from an inaccessible one. The gate marks every unresolved entry as a possible passenger. It will not process the couch until they are accounted for. Mox-9 refuses to purge the file just to make the screen green. The crew spends the night beside a gate whose sign says NOW BOARDING and means nothing.',
          flags: ['gate-registry-contested', 'gate-audit-delayed'],
          delta: { ship_fuel: -2, treaty_trust: -1, antagonist_pressure: 2 },
          callback:
            'Mox-9 has rebuilt the register with an explicit unknown category. The gate keeps insisting unknown is a species and would like to bill it for a seat.',
        },
      },
      {
        id: 'cross-without-permit',
        label: 'Push the couch through the gate using its shield',
        approach: 'Take immediate passage without binding unconsulted worlds to the captain’s choice',
        cost: 'The crew gets through, but the act teaches other captains that consent is optional.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 6 },
        success: {
          narrative:
            'Pell times the bubble around the last safety sweep and the couch slides through the gate like a sofa removed from a showroom without a receipt. Nobody is hurt. On the other side, the registry publishes the captain’s silhouette with the heading PRECEDENT. A merchant convoy follows and demands the same exemption. Mara calls to explain that the families they were protecting now face a gate that will not enforce anyone’s promises.',
          flags: ['gate-crossed-unpermitted', 'gate-bypass-precedent'],
          delta: { ship_fuel: 2, crew_trust: -2, antagonist_pressure: 2 },
          callback:
            'The Freehold has issued a retrospective invoice and a public ruling. The precedent opened the gate for people fleeing danger, but also for the ships pursuing them.',
        },
        failure: {
          narrative:
            'The bubble hits a perfectly legal toll barrier that nobody thought to make visible. It holds, and the passengers survive, but a trailing service pod loses its cargo in the collision. The crew stops to help while cameras broadcast the attempted shortcut. The gate reopens only after the captain accepts the cargo debt. Mara sends a note: an escape plan is not consultation simply because everyone gets to watch.',
          flags: ['gate-bypass-blocked', 'gate-toll-liability'],
          delta: { ship_fuel: -3, crew_trust: -2, antagonist_pressure: 3 },
          callback:
            'The toll authority is now charging the couch for the barrier it struck. Mara has persuaded the dockhands not to seize the rescue equipment while the appeal is heard.',
        },
      },
    ],
  },
  'serendipity-last-call': {
    id: 'warp-e2-last-orders',
    title: 'A Table for Everyone',
    system: 'Serendipity Space Bar',
    opening:
      'Serendipity has taken in every displaced traveler who followed the couch’s earlier calls for help. Its corridors are stacked four deep with sleeping bags, its small gravity wells are beginning to merge and its favorite jukebox now plays evacuation instructions. Barkeep Vox has counted the available air twice. Serendipity, which is sentient and not merely a building, wants to shelter everyone. Vox thinks the station will fail if it does. The creditors have offered to finance an expansion if the bar provides the names of the guests who are hiding.',
    conflict:
      'Keeping a promise of sanctuary requires space, air and consent from the place offering it. Whose safety may the captain promise, and who pays for the extra room?',
    choices: [
      {
        id: 'open-pocket-rooms',
        label: 'Lend the couch’s miniaturized rooms to consenting guests',
        approach: 'Share scarce breathing room while preserving the bar’s right to set its own limits',
        cost: 'The temporary rooms burn ship reserves and must be folded before the next jump.',
        policy: 'aid',
        check: { ability_any: ['rescue', 'science'], difficulty: 7 },
        success: {
          narrative:
            'The red couch opens three rooms behind its backrest and asks each household whether it wants temporary shelter. Serendipity routes its excess gravity through the empty dance floor; Vox makes an intake ledger with no surnames. The bar steadies. A tired guest offers to pay the whole tab, but Vox draws a line through the number and writes HOURS INSTEAD. The ship leaves with fewer supplies and a clear promise about when the rooms will close.',
          flags: ['lastcall-consented-rooms', 'lastcall-guests-sheltered'],
          delta: { sanctuary_trust: 3, ship_fuel: -3, crew_trust: 2 },
          callback:
            'Vox reports that the temporary rooms folded on schedule and every guest chose their next stop. Serendipity has kept the blank intake cards as proof it can offer shelter without owning anyone.',
        },
        failure: {
          narrative:
            'A pocket room unfolds into a storage closet that Serendipity had been using to support its gravity system. Guests move out before anyone is harmed, but the station must close two decks while it stabilizes. Vox admits the bar had already reached its limit. The captain cannot solve that limit by volunteering somebody else’s air, even with a very good couch.',
          flags: ['lastcall-room-overload', 'lastcall-decks-closed'],
          delta: { sanctuary_trust: 1, ship_fuel: -2, antagonist_pressure: 1 },
          callback:
            'The bar has reopened one of the sealed decks. Vox is refusing free expansion offers until Serendipity has a way to say no in writing.',
        },
      },
      {
        id: 'broker-neutral-exit',
        label: 'Ask Vox and Serendipity to agree on voluntary exits',
        approach: 'Let the two independent hosts negotiate what neutrality can still mean',
        cost: 'Some guests will choose to leave without guaranteed shelter elsewhere.',
        policy: 'observe',
        check: { ability_any: ['diplomacy', 'culture'], difficulty: 8 },
        success: {
          narrative:
            'Vox and the station hold a negotiation at separate ends of the bar, using the jukebox as interpreter. Serendipity agrees to a quiet departure corridor and Vox secures passage vouchers that never reveal a guest’s identity. Not everyone stays. Not everyone is happy. At dawn the gravity returns to normal and the first departing traveler leaves a handwritten review: SERVICE EXCELLENT, OUTCOME UNCERTAIN.',
          flags: ['lastcall-voluntary-exits', 'lastcall-neutrality-negotiated'],
          delta: { treaty_trust: 2, sanctuary_trust: 1, crew_trust: 1 },
          callback:
            'The departure corridor remains open to people who choose it. Serendipity insists that a neutral bar is still allowed to help a person find the door without pointing a pursuer toward it.',
        },
        failure: {
          narrative:
            'The first meeting ends when Serendipity locks the exit and Vox unlocks it. Neither has asked the guests. A long line forms at the desk while ships with empty cabins depart without knowing they are needed. The captain persuades the hosts to try again but must leave before an agreement. The air remains stable. Nobody in the queue thinks that counts as a completed rescue.',
          flags: ['lastcall-negotiations-stalled', 'lastcall-guests-waiting'],
          delta: { crew_trust: -1, ship_fuel: -1, antagonist_pressure: 2 },
          callback:
            'Vox has scheduled a second vote, this time with the guests present. The station has agreed not to lock any doors while the ballots are being counted.',
        },
      },
      {
        id: 'declare-open-sanctuary',
        label: 'Broadcast Serendipity as sanctuary to the entire sector',
        approach: 'Override the neutrality charter and demand immediate protection',
        cost: 'A public declaration attracts aid and the creditors who police it.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'luck'], difficulty: 6 },
        success: {
          narrative:
            'Every ship in range brings blankets, oxygen and unwelcome reporters. The crowd spills into the docking ring, where Serendipity uses its gravity to hold everyone safely together. The declaration keeps the creditors from boarding for one night, but their ships mark the station on every public chart. Vox pins a sanctuary sign beneath the NO SOLICITING notice. The bar has survived. It will not be neutral tomorrow.',
          flags: ['lastcall-public-sanctuary', 'lastcall-station-exposed'],
          delta: { sanctuary_trust: 2, antagonist_pressure: 3, treaty_trust: -2 },
          callback:
            'Serendipity’s public sanctuary is still full. More supplies arrived, along with patrols. Vox is trying to explain to every new visitor that a protected address is not a tourist attraction.',
        },
        failure: {
          narrative:
            'The public feed is copied by creditors before any aid ship reaches the station. Two docks close under emergency inspection and the crowd must retreat into a single trembling corridor. Vox cuts the broadcast. Serendipity uses its last stable gravity field to keep everyone breathing while the couch escorts a shuttle away. The captain wanted to make shelter visible; the danger was already listening.',
          flags: ['lastcall-broadcast-compromised', 'lastcall-docks-sealed'],
          delta: { sanctuary_trust: -2, ship_fuel: -2, antagonist_pressure: 3 },
          callback:
            'Vox confirms the evacuated shuttle is safe, but the credit patrol has published a list of suspected guests. Serendipity is refusing all open broadcasts for now.',
        },
      },
    ],
  },
  'gameworld-finale': {
    id: 'warp-e3-floor-twelve',
    title: 'The Exit Clause',
    system: 'The Showrunner’s Gameworld',
    opening:
      'On the twelfth floor of Gameworld, the grand prize is an exit door. The Showrunner insists contestants must compete for it before a paying audience. A performers’ union has found an obscure contract clause allowing the whole tower to close without a final episode if each floor votes to leave. Eleven floors are still running, and management has quietly disabled the elevators. The red couch can unfold a miniature lift behind its backrest, but the Showrunner offers to turn every rescue into a sponsored segment.',
    conflict:
      'The contestants can leave together, win a televised individual exit or be freed by force. Who gets to call a shutdown when an audience has paid to watch people stay?',
    choices: [
      {
        id: 'organize-floor-votes',
        label: 'Help the performers reach every floor and vote privately',
        approach: 'Give each floor its own choice rather than manufacturing a unanimous finale',
        cost: 'The climb consumes time and supplies, and a floor may vote to stay.',
        policy: 'aid',
        check: { ability_any: ['rescue', 'diplomacy'], difficulty: 7 },
        success: {
          narrative:
            'The couch’s miniature lift carries ballot boxes between floors while former rivals quietly count votes together. Eleven floors choose exit and one elects to remain until its contract expires. The Showrunner is forced to switch off the elimination lights and honor the difference. An audience member asks whether the refusal to leave is part of the finale. Rue tells them the show has ended, and the performers decide what the cameras may record.',
          flags: ['gameworld-consented-closure', 'gameworld-floor-dissent'],
          delta: { crew_trust: 3, treaty_trust: 2, ship_fuel: -2 },
          callback:
            'The performers have published the floor-by-floor votes without revealing individual ballots. The one floor that remained is negotiating work that does not require anyone to be trapped.',
        },
        failure: {
          narrative:
            'The lift reaches ten floors before an elevator inspector discovers the emergency exit has been licensed as a premium feature. The eleventh ballot arrives late and the union cannot invoke its closure clause. No contestant is forced to sign a false quorum, and the ten floors can now organize a legal strike. The finale is postponed, not defeated. The Showrunner sells commemorative postponement mugs.',
          flags: ['gameworld-quorum-short', 'gameworld-union-organized'],
          delta: { crew_trust: 1, ship_fuel: -3, antagonist_pressure: 1 },
          callback:
            'The union is still collecting signatures for the final floor. Its members have begun selling their own mugs, with a far more accurate picture of the emergency exit.',
        },
      },
      {
        id: 'challenge-contract',
        label: 'Challenge the sponsor contract in the contestants’ names',
        approach: 'Use the show’s own rules to expose the illegal exit conditions',
        cost: 'Legal review may delay relief while the cameras stay on.',
        policy: 'observe',
        check: { ability_any: ['culture', 'science'], difficulty: 8 },
        success: {
          narrative:
            'Mox-9 reads the entertainment contract aloud until it reaches the sentence that defines an exit as a consumable prize. The performers’ lawyer, who has been billed as an extra, points out that nobody signed away the right to stop being filmed. The broadcast switches to a blank slate. The tower can reopen as a voluntary venue, but the injured contestants still need medical care and nobody knows whether the audience will donate.',
          flags: ['gameworld-contract-voided', 'gameworld-cameras-silenced'],
          delta: { treaty_trust: 3, medical_knowledge: 1, ship_fuel: -1 },
          callback:
            'Gameworld’s producers have rewritten their contracts to allow quitting. The former contestants insist on checking every new clause before the first camera turns on.',
        },
        failure: {
          narrative:
            'The contract is valid in the jurisdiction of the studio, which was moved to a moon nobody has seen. The appeal cannot reach its registrar before the finale. Mox-9 preserves the evidence and publishes a guide to the hidden clause; the contestants decide to stop performing anyway. The Showrunner keeps broadcasting their silence, but ticket revenue begins to fall and its sponsors ask difficult questions.',
          flags: ['gameworld-contract-appealed', 'gameworld-contestants-strike'],
          delta: { treaty_trust: -1, crew_trust: 1, antagonist_pressure: 2 },
          callback:
            'The contestants’ silent strike has reached the studio’s financiers. A real court has offered to hear the case if the hidden moon will admit it exists.',
        },
      },
      {
        id: 'cut-broadcast-power',
        label: 'Cut the arena broadcast and escort everyone out by force',
        approach: 'Stop the spectacle immediately without awaiting the performers’ vote',
        cost: 'Power feeds life support as well as the stage, making evacuation hazardous.',
        policy: 'intervene',
        check: { ability_any: ['tactics', 'rescue'], difficulty: 6 },
        success: {
          narrative:
            'Pell severs the sponsor uplink but keeps emergency pumps alive with a cable run through the couch’s rear pocket room. The contestants reach the exit together, though the Showrunner now calls it an unauthorized season finale. Several performers thank the crew; others are furious that they never got a vote on staying. The spectators demand refunds, which the studio will deduct from wages unless somebody stops it.',
          flags: ['gameworld-forced-exit', 'gameworld-wages-threatened'],
          delta: { sanctuary_trust: 2, crew_trust: -2, antagonist_pressure: 2 },
          callback:
            'Every contestant made it out, but the Showrunner is billing them for the cancelled broadcast. The union wants the captain to testify about who ordered the power cut.',
        },
        failure: {
          narrative:
            'The cable snaps and one floor loses air while the broadcast stays live. The couch expands its invisible bubble around the trapped performers, who must cross the arena in silence as technicians restore power. Everyone survives, but a contestant points out that the captain never asked whether they wanted the risk. The Showrunner uses the rescue footage in a trailer entitled THE END YOU DESERVE.',
          flags: ['gameworld-emergency-evacuation', 'gameworld-public-rescue-footage'],
          delta: { ship_fuel: -3, crew_trust: -3, antagonist_pressure: 3 },
          callback:
            'The performers are safe, but the rescue video is being sold as an official finale. Their lawyer is requesting the original footage before the studio edits the testimony.',
        },
      },
    ],
  },
} satisfies Record<string, ConsequenceEpisode>
