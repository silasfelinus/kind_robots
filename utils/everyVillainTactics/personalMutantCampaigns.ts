import type { PersonalCampaign } from './personalAccidentCampaigns'

export const MUTANT_CAMPAIGNS: Record<string, PersonalCampaign> = {
  'mutant-fire': {
    chapters: [
      [
        'The name on the attendance sheet',
        'Ashborn heals the students burned by the shutter and asks a classmate to write down the names she might forget.',
        "The shutter recorder contains the registration officer's photographs of Ashborn, taken without the students' permission.",
        'The squad confiscates the registration camera and keeps the pictures for its own records.',
      ],
      [
        'A flame with a price',
        'The researchers help Ashborn label the people she has healed before her memory of them fades.',
        "The lab's consent forms reveal that registration officials treated her healing flame as compulsory public property.",
        'The squad takes custody of the flame records and decides whose injuries merit treatment.',
      ],
      [
        "A stranger's name",
        'Medics introduce themselves twice as Ashborn heals the injured passengers and loses another familiar memory.',
        'The transit archive records officials denying emergency service to an unregistered mutant.',
        'The squad closes the crossing to registration officers and demands their files.',
      ],
      [
        'The photograph on the air',
        "The engineer broadcasts the rescue warning without displaying Ashborn's private medical images.",
        'The transmission preserves the registration orders and the names of the officials who authorized them.',
        "The squad announces that the city's registry now belongs to Ashborn alone.",
      ],
      [
        'A ledger in the furnace',
        'The tunnel crew helps retrieve the names of missing workers before Ashborn spends another flame healing them.',
        'The underground records establish where the authorities stored confiscated mutant medical histories.',
        'The squad destroys the public archive but retains a private list of its enemies.',
      ],
      [
        'A dance remembered by others',
        "The rescued students introduce themselves to Ashborn again as she helps heal the ballroom's injured guests.",
        'The prom witnesses hear testimony from the families whose private lives were catalogued by the registry.',
        'The squad orders the last registration terminal destroyed without asking the people whose evidence it contains.',
      ],
    ],
    endings: [
      'Ashborn keeps healing strangers. Her classmates keep a shared memory book that she may read or close whenever she chooses.',
      "The registry's abuses are established in public, and its subjects decide which records to preserve or remove.",
      'The ballroom is safe, but Ashborn has forgotten the name of a friend who promised to meet her again.',
      'Ashborn burns the registry and the memories that bound her to it. The next morning, someone she rescued introduces themself as a stranger.',
    ],
  },
  'mutant-air': {
    chapters: [
      [
        'The coat on the hook',
        'Kestrel removes his coat and flies a safety line to classmates trapped above the shutter.',
        "The shutter's surveillance feed shows the school confiscating records of winged students.",
        'The squad seizes the cameras and follows the officials who once monitored Kestrel.',
      ],
      [
        'A room with no ceiling',
        'Researchers clear the broken lab windows and let Kestrel guide them out in full view of the street.',
        "The lab's anatomical registry reveals a contract for monitoring winged residents.",
        'The squad retains the tracking equipment and turns it on the contractors.',
      ],
      [
        'Above the crossing',
        'Kestrel spots an open ground route for medics without asking passengers to risk the height.',
        'The traffic archive shows that the city used flight restrictions to exclude mutant commuters.',
        'The squad patrols above the crossing and records everyone who passes below.',
      ],
      [
        'The city looks up',
        "The engineer broadcasts Kestrel's public warning while the witnesses decide whether to show their faces.",
        'The rooftop footage documents the officers who pursued flying mutants without cause.',
        "The squad redirects the surveillance network toward the city's rooftops and private windows.",
      ],
      [
        'Below the flight path',
        'Tunnel workers open a vertical rescue shaft so Kestrel can carry supplies without having to hide his wings.',
        "The buried permits reveal why mutant shelters were removed from the city's evacuation plans.",
        'The squad keeps the shaft under aerial watch and restricts its use to its own contacts.',
      ],
      [
        'The open balcony',
        'Kestrel lands on the ballroom balcony in full view and helps the guests choose a safe exit.',
        "The prom screens display the original surveillance directives alongside the officials' denials.",
        'The squad watches the exits from above and requires everyone to identify themselves.',
      ],
    ],
    endings: [
      'Kestrel flies openly over the city and helps establish a public air-rescue team that welcomes winged residents.',
      'The city inquiry hears the testimony of people whose wings made them surveillance targets.',
      'The guests are safe, but Kestrel still finds old tracking cameras along his route home.',
      "Kestrel turns the city's surveillance network skyward and downward. Its residents begin closing the curtains before dusk.",
    ],
  },
  'mutant-earth': {
    chapters: [
      [
        'The missing class photo',
        'Groundswell holds the broken shutter in place while classmates pull their desks clear and stand beside her.',
        'The school archive records the orders excluding Groundswell from every class photograph.',
        'The squad seals the damaged auditorium behind a barrier only Groundswell can move.',
      ],
      [
        'Room for a larger body',
        'The researchers remove an undersized safety partition and let Groundswell lead the evacuation without stooping.',
        "The lab's equipment orders show that mutant accessibility requests were repeatedly rejected.",
        'The squad takes the heavy machinery and requires the researchers to use its access routes.',
      ],
      [
        'A street wide enough',
        'Medics work with Groundswell to brace a damaged crossing while passengers choose the pace of their escape.',
        'The transit plans reveal the accessible platforms omitted from the approved construction.',
        'The squad reshapes the crossing into a guarded passage that admits only its own people.',
      ],
      [
        'Her face on the broadcast',
        'The engineer offers Groundswell the camera so she can describe the rescue in her own words.',
        'The broadcast preserves the photographs and exclusions the academy refused to acknowledge.',
        'The squad uses the transmitter to threaten officials with another demonstration of its strength.',
      ],
      [
        'The weight of a school',
        'Groundswell braces the tunnel roof while the workers remove the last load of trapped equipment and people.',
        "The buried inspection record shows which officials disregarded the building's structural warnings.",
        'The squad takes control of the underground supports and demands authority over future construction.',
      ],
      [
        'The yearbook portrait',
        'Students gather beside Groundswell for a photograph only after every guest reaches safety.',
        'The ballroom receives the exclusion orders and the testimonies of the classmates she rescued.',
        'The squad demands a new yearbook portrait in which every official must stand behind Groundswell.',
      ],
    ],
    endings: [
      'Groundswell poses for the yearbook photo she was once denied, surrounded by classmates she rescued and people she chose to invite.',
      "The school publishes its exclusion records and accepts the students' demands for accessible facilities.",
      'The guests escape, but Groundswell is still waiting for the academy to make its ordinary classrooms accessible.',
      'Groundswell makes the city feel the ground move. The next reconstruction committee is told that only she may decide where the foundations go.',
    ],
  },
  'mutant-water': {
    chapters: [
      [
        'A breath at the shutter',
        'Harbormaster works from a flooded service basin while students carry water to his rescue station.',
        "The shutter's maintenance record shows that the academy removed its emergency hydration facilities.",
        'The squad takes control of the water supply and demands access in exchange for opening the exit.',
      ],
      [
        'The dry laboratory',
        'Researchers help move the injured into a wet recovery bay instead of forcing Harbormaster to remain in dry air.',
        "The lab's intake forms show that coastal mutants were denied ordinary medical accommodation.",
        'The squad locks the research tanks and puts their use under harbor authority.',
      ],
      [
        'Between the tide marks',
        "Medics open the flooded tram passage with Harbormaster's help while keeping a dry exit available for other passengers.",
        'The transit log identifies the council vote that cut the dock communities off from emergency transport.',
        "The squad closes the crossing to the council's vehicles until it accepts the harbor's demands.",
      ],
      [
        'A voice from the docks',
        "The engineer transmits the fishers' emergency call and gives them time to describe their own needs.",
        "The rooftop archive preserves the council's refusal to recognize the coastal residents' petitions.",
        "The squad broadcasts an ultimatum: no city traffic until the harbor's terms are met.",
      ],
      [
        'The submerged council records',
        'Tunnel workers open the water channel and use its current to help move their stranded colleagues to safety.',
        'The submerged archive records the licenses that displaced coastal mutant families from their fishing grounds.',
        'The squad takes custody of the harbor gates and blocks access to anyone without its approval.',
      ],
      [
        'The wet carpet',
        'The ballroom volunteers set up a hydrated refuge for Harbormaster while other guests use the dry exits.',
        "The prom audience hears the dock residents' testimony before the council can adjourn.",
        "The squad closes the ballroom's water controls and requires the council to negotiate.",
      ],
    ],
    endings: [
      'Harbormaster speaks at city council without apologizing for the water on the carpet. The dock residents elect their own representatives.',
      'The council records expose the exclusion of coastal citizens and the displaced fishers recover their right to be heard.',
      "The ballroom is safe, but the harbor's emergency accommodation plan remains unfunded.",
      'Harbormaster closes the harbor until his terms are accepted. The fishers ask whether their new representative still answers to them.',
    ],
  },
  'mutant-discipline': {
    chapters: [
      [
        'Four hands at First Bell',
        "Lotus Guard uses her grandmother's dance to brace the shutter and pass the injured into waiting arms.",
        "The shutter records contain a proposed licensing claim on her family's rescue movements.",
        'The squad confiscates the training film and declares the technique its own property.',
      ],
      [
        'The choreography patent',
        'The researchers carry the original dance recordings to safety and return them to the people who taught the steps.',
        "The lab's contract identifies the sponsor attempting to patent Lotus Guard's inherited practice.",
        'The squad takes the motion-capture archive to develop exclusive combat instruction.',
      ],
      [
        'A crossing in four counts',
        "Medics follow Lotus Guard's coordinated hand signals while passengers choose the safest route.",
        "The transit record shows a security company copied her grandmother's movements into its restraint program.",
        'The squad trains its own guards to control passage through the crossing.',
      ],
      [
        "The grandmother's lesson",
        "The broadcast gives Lotus Guard's family an opportunity to teach the rescue movements on their own terms.",
        "The engineer releases the original consent agreement and the sponsor's unauthorized training material.",
        'The squad sells its combat demonstration to a private security buyer.',
      ],
      [
        'The practice floor below',
        'Tunnel workers use coordinated lifts learned from Lotus Guard rather than leaving anyone behind.',
        'The underground archive contains the contracts for the stolen movement library.',
        'The squad takes the training archive and restricts access to licensed clients.',
      ],
      [
        'A dance nobody owns',
        'Lotus Guard invites the ballroom volunteers to learn a simple rescue formation without charging for the lesson.',
        'The guests see the original dance recording alongside the unauthorized weapons-training advertisements.',
        "The squad offers to train the academy's security forces for a permanent exclusive contract.",
      ],
    ],
    endings: [
      "Lotus Guard teaches her grandmother's style as a rescue art and returns control of the recordings to the family.",
      "The sponsor's patent claim fails when the family presents its original recordings and consent terms.",
      'The ballroom is safe, but the family must still reclaim copies of its stolen instruction.',
      'Lotus Guard becomes a celebrated arms instructor. Her grandmother asks whether the students still learn why the dance begins with an open hand.',
    ],
  },
  'mutant-genius': {
    chapters: [
      [
        'A plan somebody else can finish',
        'Contingency gives the trapped students a written evacuation sequence with permission to adapt it.',
        "The shutter recorder preserves the deleted warning in the sponsor's supposedly flawless emergency model.",
        'The squad retains the evacuation plan and keeps the alternatives hidden.',
      ],
      [
        'The second mind',
        "Researchers evacuate with copies of Theo's working notes so no calculation depends on one person remaining behind.",
        "The lab's records show that the sponsor withheld independent medical advice from Theo.",
        'The squad takes the predictive model and makes all research decisions depend on it.',
      ],
      [
        'An unexpected passenger',
        "Medics revise Contingency's crossing plan when a passenger needs a route the model did not anticipate.",
        'The traffic archive reveals which forecasts were deliberately altered to justify an unsafe decision.',
        'The squad closes the unmodeled routes and orders passengers to follow its predicted sequence.',
      ],
      [
        'A broadcast with room for doubt',
        "The engineer shares Theo's rescue plan alongside alternatives and invites listeners to report errors.",
        'The rooftop archive identifies the officials who suppressed contradictory forecasts.',
        'The squad announces its single approved forecast and removes the public correction channel.',
      ],
      [
        'The empty chair in the control room',
        'Workers complete the containment checklist themselves while Theo rests outside the failing chamber.',
        'The underground archive holds a risk assessment the sponsor concealed from the public.',
        "The squad makes the city's emergency infrastructure dependent on Contingency's private model.",
      ],
      [
        'The final contingency',
        'Students execute their own revised plan for evacuating the ballroom after Theo delegates the last decision.',
        'The prom audience hears the original risk assessment and the alternative the sponsor refused to consider.',
        'The squad claims the only safe plan and makes the city watch its demonstration.',
      ],
    ],
    endings: [
      'Contingency spends their remaining time teaching others how to plan, including how to disagree with the teacher.',
      "Theo's notes expose the suppressed forecasts and become a public resource maintained by many researchers.",
      "The guests escape, but Theo's friends still have an unfinished notebook of plans to discuss together.",
      "Contingency arranges the crisis that makes the city remember Theo. The people rebuilding it ask who gave them the right to write everyone else's ending.",
    ],
  },
  'mutant-birthright': {
    chapters: [
      [
        'The oath above the door',
        'The Guardian carries a rescue line across the auditorium and asks the students to choose their own exit.',
        "The shutter recorder contains an old family oath requiring the guardian to obey the academy's patrons.",
        'The squad declares the auditorium a protected family holding.',
      ],
      [
        'A family name on the contract',
        "Researchers evacuate with the family's old rescue records rather than surrendering them to its trustees.",
        "The lab's grant agreement reveals a patron who claimed authority over the next winged guardian.",
        "The squad invokes its inherited privilege to take the laboratory's emergency equipment.",
      ],
      [
        'No inherited right of way',
        'Medics guide passengers across the crossing while the Guardian keeps the public route open to everyone.',
        "The transit deed shows that a prior guardian's estate was granted control of the public passage.",
        "The squad restores the estate's authority over the crossing and sets its own entry conditions.",
      ],
      [
        'The oath spoken aloud',
        "The engineer broadcasts the Guardian's proposed new oath and asks the city's residents to respond.",
        'The rooftop recording exposes the private obligations that the family never disclosed to its heirs.',
        "The squad announces that the family's guardianship gives it the right to command the city.",
      ],
      [
        'The old family vault',
        'Tunnel workers retrieve the original oath and leave the vault open for independent inspection.',
        'The buried deeds show how two generations of patrons converted public protection into private property.',
        'The squad seals the vault and claims the inherited emergency controls.',
      ],
      [
        'A promise at graduation',
        'The Guardian helps students out of the ballroom without demanding allegiance to her family.',
        'The prom audience hears the old oath and the testimony of the people it excluded.',
        "The squad demands a public ceremony recognizing the family's permanent authority over the city.",
      ],
    ],
    endings: [
      'The Guardian rewrites the family oath in public and accepts a role the city may hold accountable.',
      "The original deeds and patron agreements are disclosed, ending the family's exclusive claim to public protection.",
      'The guests escape, but the Guardian and her relatives have not yet agreed on a new oath.',
      'The Guardian takes the city as her inheritance. A younger relative begins reading the oath she refused to rewrite.',
    ],
  },
  'mutant-social': {
    chapters: [
      [
        'A choice without a scent',
        'Common Ground puts on the patch before asking trapped students whether they want him to guide their escape.',
        "The shutter recorder contains an experiment measuring how his presence changed the students' answers.",
        'The squad removes the patch and obtains unanimous agreement to its rescue plan without asking why.',
      ],
      [
        'The consent register',
        'Researchers evacuate after Common Ground gives them room to decide independently whether to follow him.',
        "The lab's files show that a sponsor attempted to commercialize his pheromones without meaningful consent.",
        'The squad takes the research archive and offers a persuasive service to the academy.',
      ],
      [
        'The passengers decide',
        'Medics let commuters choose between two rescue routes while Common Ground keeps the patch on.',
        'The crossing recordings show a contractor using artificial trust to silence legitimate safety complaints.',
        'The squad secures immediate cooperation by making the frightened crowd trust its leader.',
      ],
      [
        'The unpersuaded broadcast',
        "The engineer transmits the rescue warning without using Common Ground's presence to influence the listeners.",
        "The rooftop archive names the buyers of the sponsor's unconsented persuasion trials.",
        "The squad broadcasts its own account and treats the audience's agreement as proof.",
      ],
      [
        'The foster-home file',
        'Workers recover the original research files and let their subjects decide which details can be released.',
        "The hidden archive contains the sponsor's unauthorized records of Common Ground's former foster homes.",
        'The squad retains the records and uses its influence to discourage objections.',
      ],
      [
        'An invitation that can be refused',
        'Common Ground wears the patch as he asks students whether they want him to stay for the last dance.',
        'The ballroom hears testimony from volunteers whose participation in the trials was never freely chosen.',
        'The squad removes the patch and receives a standing ovation that nobody was free to withhold.',
      ],
    ],
    endings: [
      'Common Ground keeps the patch on in public. A friend asks him to dinner, and for once he has no reason to doubt the invitation.',
      "The persuasion trial records reach independent investigators, with the foster families' private histories protected.",
      'The ballroom is safe, but Common Ground still has questions about several friendships he remembers from childhood.',
      "Common Ground removes the patch and becomes the city's beloved spokesperson. His closest friend cannot tell whether saying goodbye is possible.",
    ],
  },
}
