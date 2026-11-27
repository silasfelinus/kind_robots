import type { PersonalCampaign } from './personalAccidentCampaigns'

export const ALIEN_CAMPAIGNS: Record<string, PersonalCampaign> = {
  'alien-fire': {
    chapters: [
      [
        'A place in the sun',
        'Daystar warms the shivering students after their escape, then asks a classmate to help her replace her ruined citizenship application.',
        'The shutter records show a reservoir security officer logged her childhood escape pod as confiscated property.',
        'The squad keeps the confiscation records and demands that the academy shelter star-colony refugees on its terms.',
      ],
      [
        'A sample, not a specimen',
        "Daystar carries a researcher into sunlight; the students shield her from the laboratory's intrusive cameras.",
        'The lab inventory identifies the alien artifacts taken from her pod without consent.',
        'The squad takes the solar converters and makes their return contingent on a settlement permit.',
      ],
      [
        'The reservoir road',
        'The rescued passengers make a human chain while Daystar charges in the daylight and helps lift the wreckage.',
        'The transit records reveal that the refugee evacuation route was deliberately removed from the city plan.',
        'The squad reserves the cleared crossing for its own refugee convoy.',
      ],
      [
        'Citizenship on the air',
        'The engineer keeps the warning on the air while Daystar invites displaced residents to speak for themselves.',
        'The transmission records identify the official who ordered the exclusion of star-colony arrivals.',
        'The squad broadcasts its own declaration of sovereignty over the reservoir district.',
      ],
      [
        'The pod beneath the city',
        'Workers uncover the damaged escape-pod transmitter and help Daystar retrieve it without disturbing the shelter.',
        'The buried archive contains the original recovery report proving she arrived as a child.',
        'The squad claims the pod as a command station and cuts the municipal authorities out of the negotiations.',
      ],
      [
        'A sunrise at the prom',
        'Daystar helps the last guests into the morning light, then introduces her foster neighbors to the arriving refugees.',
        'The prom audience receives the unaltered record of the reservoir rescue.',
        'The squad raises the star-colony banner over the ballroom and demands its recognition.',
      ],
    ],
    endings: [
      'Daystar petitions for citizenship in court, with her neighbors beside her and no weapons above the courthouse.',
      'Her pod records become testimony in a public inquiry; the refugees gain a chance to claim what was taken.',
      "The ballroom is safe, but Daystar's application is still marked pending and her old colony cannot wait forever.",
      'Daystar declares a city for her people. A human neighbor who helped raise her asks whether the new city has room for them.',
    ],
  },
  'alien-air': {
    chapters: [
      [
        'Diplomatic incident',
        'The Envoy keeps the evacuation route clear from above and listens to the students who have to travel on foot.',
        "The shutter's communications archive contains the extradition request filed after their dimensional arrival.",
        'The squad seizes the local diplomatic terminal and declares the academy an embassy.',
      ],
      [
        'Terms of atmospheric exchange',
        'Researchers move the unstable pressure chamber outdoors while The Envoy explains which conditions their species needs.',
        "The lab's treaty files show that the armada has been buying access to the dimensional rift.",
        "The squad reserves the pressure chamber for the armada's negotiators.",
      ],
      [
        'The courtesy of solid ground',
        'The Envoy lands long enough to carry a medic over the broken crossing, apologizing for their earlier dismissal of pavement.',
        "The transit record reveals the contractor's unauthorized airspace concessions.",
        'The squad claims the crossing as a diplomatic corridor exempt from local inspection.',
      ],
      [
        'A treaty with listeners',
        "The engineer broadcasts the warning in local languages and asks The Envoy to translate the armada's response.",
        'The original treaty clauses reveal that the city was offered as a bargaining chip.',
        "The squad transmits its own offer of the city's airspace in exchange for safe passage.",
      ],
      [
        'The treaty engine',
        'Workers help dismantle the rift stabilizer rather than allowing another involuntary crossing.',
        "The buried communications log identifies the negotiators who concealed the armada's arrival.",
        'The squad keeps the rift open for its chosen diplomatic delegation.',
      ],
      [
        'No immunity on the dance floor',
        'The Envoy joins the civilian evacuation queue and accepts the same instructions as everyone else.',
        'The prom delegates hear the original armada proposal before the agreement can be signed.',
        "The squad declares the ballroom extraterritorial and excludes the city's representatives.",
      ],
    ],
    endings: [
      'The Envoy renounces diplomatic immunity and becomes a neighbor who can be held accountable by the people they protect.',
      'The original treaty reaches both worlds, and the negotiators must explain their unauthorized concessions.',
      "The ballroom is safe, but the Envoy's path home remains closed and the treaty is unsigned.",
      "The Envoy accepts the armada's passage home. From above, the city looks remarkably small for something they traded.",
    ],
  },
  'alien-earth': {
    chapters: [
      [
        'An exhibit walks out',
        "Monolith props open the shutter and carries the injured students clear, refusing the curator's request to return to his display case.",
        'The archive includes the acquisition certificate that classified Monolith as museum property.',
        "The squad confiscates the exhibit keys and locks the curator's office.",
      ],
      [
        'Inventory of a living person',
        'Researchers evacuate with the fragile relics and allow Monolith to decide where his own meteorite belongs.',
        "The lab's catalog records artifacts whose original custodians were never consulted.",
        'The squad takes the inventory and reclassifies its rivals as exhibits.',
      ],
      [
        'A street without pedestals',
        'Monolith bridges the broken crossing while medics guide the passengers over the broad surface of his silicon arms.',
        "The transit foundation contains a stolen ceremonial stone linked to the museum's collection.",
        'The squad claims the crossing as a secured exhibition hall.',
      ],
      [
        'The provenance broadcast',
        'The engineer gives displaced custodians airtime to explain where their artifacts came from.',
        "The rooftop archive preserves the curator's correspondence denying the relics' provenance.",
        'The squad announces a new exhibition of the officials responsible for the acquisitions.',
      ],
      [
        'Six thousand years of sleep',
        'Workers recover the original meteorite fragments and ask Monolith which ones he wants returned to him.',
        "The underground shipping manifests connect the museum's collection to unauthorized excavations.",
        'The squad seals the archive and retains every artifact as a bargaining chip.',
      ],
      [
        'Admission free',
        "Monolith carries the ballroom's injured guests out past the exhibition banners and leaves the glass cases empty.",
        "The audience sees the original ownership records beside the museum's revised labels.",
        'The squad demands a ceremony transferring the entire collection into its custody.',
      ],
    ],
    endings: [
      'Monolith returns stolen relics to their custodians and leaves the museum under his own name, not an accession number.',
      'The acquisition records reach independent researchers and the displaced communities choose how to handle their artifacts.',
      'The guests escape, but Monolith has yet to find anyone who recognizes the symbols on his meteorite.',
      'Monolith puts his collectors behind museum glass. The new exhibit is silent, and nobody is allowed to leave.',
    ],
  },
  'alien-water': {
    chapters: [
      [
        'A letter from the tide',
        'Lighthouse guides the students through the rising water with help from a fish that knows the flooded drain.',
        "The shutter log identifies the factory whose discharge contaminated the city's emergency water supply.",
        "The squad seals the drain and claims authority over the school's water intake.",
      ],
      [
        'The aquarium speaks',
        'Researchers remove stranded sea creatures from the overheated tanks while Lighthouse relays their distress.',
        "The lab's sampling records reveal a sponsor buried warnings about coastal contamination.",
        'The squad retains the research tanks as hostages in negotiations over the coast.',
      ],
      [
        'Two ways out of the flood',
        "Medics use Lighthouse's directions to guide passengers around a submerged nest and into a dry refuge.",
        'The crossing archive identifies the storm-water diversion that poisoned the pier.',
        'The squad closes the crossing until the harbor authority accepts its demands.',
      ],
      [
        'The voice of the sea',
        "The engineer broadcasts a warning based on the unusual movement of the harbor's fish.",
        'The rooftop archive contains the suppressed reports that linked the factory to a dead reef.',
        "The squad threatens to cut off the city's access to the ocean.",
      ],
      [
        'A current toward home',
        'Tunnel workers help Lighthouse rescue creatures swept into the failing rift before stabilizing the machinery.',
        'The submerged archive reveals that the sponsor knew the rift was draining the alien sea.',
        'The squad commandeers the rift controls and claims the right to determine who crosses.',
      ],
      [
        'The ballroom at low tide',
        'Lighthouse opens a sheltered route for guests and returns the stranded sea creatures to the harbor.',
        'The prom witnesses hear recordings of the pollution alarms the city ignored.',
        "The squad turns the ballroom's pumps off until its coastal demands are met.",
      ],
    ],
    endings: [
      "Lighthouse becomes a bridge between the sea and the city, accepting that her mother's tides may never reach her again.",
      'The coastal inquiry accepts the suppressed reef reports and gives the affected communities a voice.',
      'The guests escape, but the ocean rift closes before Lighthouse can send a message home.',
      'Lighthouse claims the coast and forces the polluters out. The creatures she speaks for ask what will happen to the people left behind.',
    ],
  },
  'alien-discipline': {
    chapters: [
      [
        'The warrant at First Bell',
        'Zuzu cuts the jammed shutter open, then refuses a guild warrant identifying one of the trapped students as disposable.',
        "The shutter records contain the portal authority's forged extradition list.",
        "The squad takes the warrant book and keeps the student's name inside it.",
      ],
      [
        'A contract without a signature',
        'Researchers escape with the portal records while Zuzu refuses payment for a killing he never agreed to perform.',
        'The laboratory documents reveal that the guild was paid for warrants against people who never entered its realm.',
        "The squad claims the guild's exclusive authority to settle the disputed contracts.",
      ],
      [
        'A sword at the crossing',
        'Zuzu cuts loose the tangled safety barrier and helps the medics escort a fugitive instead of collecting a bounty.',
        'The transit archive exposes the reward posted for several innocent passengers.',
        'The squad holds the crossing and requires travelers to submit to its warrant checks.',
      ],
      [
        'A name crossed out',
        'The engineer broadcasts the warning while Zuzu gives the fugitives time to tell their stories.',
        'The rooftop archive preserves the instructions that ordered the guild to falsify its warrants.',
        'The squad publicly claims the right to issue judgments across both worlds.',
      ],
      [
        "The portal's last contract",
        'Workers help Zuzu move the stranded travelers out of the rift chamber before the gateway collapses.',
        'The buried ledger identifies the officials who turned asylum requests into assassination orders.',
        'The squad secures the portal and grants passage only to those it has cleared.',
      ],
      [
        'An unsigned dance card',
        'Zuzu stands between the guests and the portal guards, declining the bounty offered for handing them over.',
        'The prom audience sees the warrants and the payments that accompanied them.',
        'The squad demands recognition of Zuzu as the final authority over interdimensional fugitives.',
      ],
    ],
    endings: [
      "Zuzu burns the guild's assassination warrants and stays to defend the people they marked, even if home is beyond his reach.",
      "The original ledger exposes the guild's false contracts and the fugitives reclaim their names.",
      "The ballroom is safe, but the guild's surviving agents still carry their copies of the warrants.",
      'Zuzu keeps the impossible warrant book and crowns himself its judge. A former client asks where a condemned person may appeal.',
    ],
  },
  'alien-genius': {
    chapters: [
      [
        'The unapproved invention',
        'Uplift demonstrates a simple rescue tool to the students, leaving its controls in their hands.',
        "The shutter's maintenance records reveal that a sponsor concealed his open technical drawings.",
        'The squad reserves the rescue device for operators Uplift has approved.',
      ],
      [
        'No patent on tomorrow',
        'Researchers leave the laboratory with copies of the safe designs instead of surrendering them to a patent office.',
        "The lab archive records the trials that were suppressed when the prototype proved cheaper than the sponsor's product.",
        "The squad claims exclusive control of the laboratory's advanced equipment.",
      ],
      [
        'A choice of tools',
        "Medics choose between the familiar rescue equipment and Uplift's new devices after he explains their tradeoffs.",
        'The transit logs show that the sponsor installed an alien device without providing an accessible shutoff.',
        'The squad replaces the crossing controls without asking its users.',
      ],
      [
        'The public technical manual',
        'The engineer broadcasts the rescue warning and makes the repair instructions available to local technicians.',
        "The rooftop archive records the sponsor's attempt to sell the same donated technology twice.",
        'The squad announces a compulsory upgrade plan for the entire district.',
      ],
      [
        'The machine that can be stopped',
        'Workers shut down the experimental rift using a manual release Uplift designed with them.',
        "The buried test logs establish which modifications were imposed without the operators' permission.",
        'The squad removes the independent override from the recovered machinery.',
      ],
      [
        'A future with a veto',
        'The ballroom volunteers use the new evacuation equipment after choosing which devices they trust.',
        "The prom audience receives the uncensored research history and the sponsor's sales contracts.",
        'The squad presents its citywide improvement plan as a decision already made.',
      ],
    ],
    endings: [
      'Uplift shares his technology openly and accepts that humanity has the right to decline even a brilliant invention.',
      'The inquiry returns the technical drawings to the public and restores credit to the local inventors.',
      "The guests escape, but the city's technicians still have several unsafe installations to replace.",
      'Uplift imposes his improvements. The first neighborhood that refuses an upgrade finds its old controls missing.',
    ],
  },
  'alien-birthright': {
    chapters: [
      [
        'The mirror behind the shutter',
        'The Exile carries the injured students through the opening without asking them to recognize her royal claim.',
        'The shutter archive contains the old royal seal on an unauthorized portal order.',
        'The squad claims the academy as a royal refuge and names its own officials.',
      ],
      [
        'A crown in the laboratory',
        'Researchers evacuate with a fragile mirror that The Exile recognizes from her childhood escape.',
        "The lab's diplomatic records reveal the broker who arranged the usurper's trade agreement.",
        'The squad takes the mirror and demands a pledge of allegiance from its operators.',
      ],
      [
        'A road between kingdoms',
        'Medics use the cleared crossing while The Exile directs the refugees toward whichever world they choose.',
        'The transit archive reveals the customs duties secretly charged on displaced travelers.',
        'The squad claims the passage as a royal border and imposes its own tariff.',
      ],
      [
        'An address without a throne',
        "The engineer broadcasts the warning and allows both kingdoms' residents to speak without royal permission.",
        'The rooftop archive preserves testimony from the people who were displaced during the coup.',
        "The squad broadcasts a claim to both kingdoms in The Exile's name.",
      ],
      [
        'The hidden lighthouse gate',
        'Workers stabilize the mirror chamber long enough to rescue the remaining travelers.',
        'The buried royal correspondence identifies the officials who profited from the usurpation.',
        'The squad seizes the gate and demands tribute for reopening it.',
      ],
      [
        'A ballroom without subjects',
        'The Exile helps the guests leave through the mirror passage without requiring an oath to her family.',
        'The prom witnesses receive the original succession papers and testimony from both realms.',
        'The squad requests a coronation before the ballroom may reopen.',
      ],
    ],
    endings: [
      'The Exile abdicates in public and leaves both worlds free to choose their own leaders.',
      'The royal correspondence reaches both kingdoms and their citizens demand independent succession proceedings.',
      'The ballroom is safe, but the lighthouse gate remains closed and the royal dispute is unresolved.',
      'The Exile reclaims her throne and extends its borders into Comet City. The first new subjects never voted.',
    ],
  },
  'alien-social': {
    chapters: [
      [
        'One voice at First Bell',
        'Assembly asks the trapped students whether they want to share a brief mental link before coordinating the evacuation.',
        "The shutter recorder contains a sponsor's unauthorized experiment with hive communications.",
        'The squad links the volunteers without asking and treats their agreement as unanimous.',
      ],
      [
        'A room of separate minds',
        'Researchers copy their own notes while Assembly keeps the rescue link voluntary and shows them how to disconnect.',
        "The lab's network logs reveal that the sponsor concealed a permanent connection setting.",
        "The squad takes the network controller and removes the volunteers' exit option.",
      ],
      [
        'The commuter chorus',
        'Medics coordinate the crossing with Assembly but keep an ordinary spoken channel open for those who decline the link.',
        "The transit records expose the compulsory connection trial that silenced passengers' objections.",
        'The squad orders the entire crossing to join its shared network.',
      ],
      [
        'A broadcast with an off switch',
        "The engineer keeps the warning available by radio so no listener needs to join Assembly's mind.",
        "The rooftop archive records the sponsor's attempts to purchase a forced-link system.",
        'The squad announces a permanent citywide connection as a cure for loneliness.',
      ],
      [
        'The signal from the old ship',
        "Workers help Assembly recover the lost collective's transmitter while preserving an independent emergency channel.",
        'The underground archive records a proposed override of individual choice within the network.',
        'The squad activates the recovered transmitter and demands that the city accept its signal.',
      ],
      [
        'A dance for one or many',
        'Assembly offers the guests a voluntary link during the evacuation and disconnects anyone who asks.',
        'The prom audience learns how the network experiments removed the original consent controls.',
        "The squad links the ballroom and mistakes a single shared response for everyone's approval.",
      ],
    ],
    endings: [
      'Assembly remains an individual and offers links only to willing partners who can leave at any time.',
      'The network records reach independent investigators, and the affected participants regain control of their connections.',
      'The guests escape, but Assembly still has not heard another voice from the original collective.',
      'Assembly eliminates loneliness by connecting the city. They can hear everyone except the person they used to be.',
    ],
  },
}
