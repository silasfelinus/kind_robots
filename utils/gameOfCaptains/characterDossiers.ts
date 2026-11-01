import type { CaptainId, CrewId } from './rules'

export type CaptainDossier = {
  history: string
  liability: string
  opening: string
  voice: string
  hook: string
  oddity: string
  storyPromise: string
  crewSpark: string
}

export const CAPTAIN_DOSSIERS: Record<CaptainId, CaptainDossier> = {
  fluke: {
    history:
      'An ancient, chronically bored time traveler who briefly commanded the separate Improbability Starcruiser because all the interesting centuries were booked. Fluke stutters when a possible future becomes too loud; the speech catches are not the joke, the fact that three versions of Fluke are impatiently waiting to finish the sentence is. Once solved a cosmic paradox by forgetting why it mattered.',
    liability:
      "Fluke's future self has already signed a rescue invoice in the captain's handwriting. The creditor is arriving yesterday.",
    opening:
      "A distress call is addressed to the captain's next incarnation, who apparently owes the caller an apology.",
    voice: 'I-I-I know what happens next. Unfortunately, so does next.',
    hook: 'A bored time traveler who keeps accidentally meeting the consequences before the choices.',
    oddity:
      'Keeps a pocket watch with thirteen hands, none of which agrees to work weekends.',
    storyPromise:
      'Temporal farce, contradictory future witnesses, an ethical choice whose apology arrives before the mistake, and a chance to become interested in the present.',
    crewSpark:
      "Kivo's sealed courier messages and Mox-9's right to an unwritten future frustrate every shortcut through time.",
  },
  vale: {
    history:
      "Once the galaxy's youngest theoretical physicist, now its most wanted appliance vandal. This neon-haired genius punkette reverse-engineered a jump field from a karaoke machine, a confiscated traffic light, and sheer contempt for licensing. She joins negotiations because physics has rules, but politicians have exploitable error messages.",
    liability:
      "The regulator who seized Vale's first invention is aboard a disaster-relief ship now using a suspiciously similar illegal engine.",
    opening:
      'A bureaucrat declares her red couch an unlicensed science experiment. Vale declares the bureaucrat an untested hypothesis.',
    voice: "That's not impossible. That's a manufacturer setting.",
    hook: 'A genius punkette who treats the laws of nature as terms of service she never accepted.',
    oddity:
      'Her hair is part antenna, part electrical hazard. The safety inspection committee is her old punk band.',
    storyPromise:
      'Reckless inventions, jailbreak diplomacy, brilliant solutions that create three new disasters, and the choice between open technology and control.',
    crewSpark:
      "Sora can prove a generator is a person; Pell can keep Vale's prototype from proving the couch is a funeral pyre.",
  },
  solace: {
    history:
      "Four weeks ago Solace was mopping hazardous biological residue in a freight-port lavatory. The previous captain died, the replacement disappeared, and the next two captains were promoted out of existence. Solace inherited the red couch, eleven field promotions, and the unshakeable certainty that anyone saying 'at least it can't get worse' is about to be eaten. Every emergency looks suspiciously like the first five minutes of a very bad movie.",
    liability:
      "Solace has a janitor's master key that opens a door the admiralty insists does not exist. The last officer to ask about it was promoted posthumously.",
    opening:
      "The distress beacon plays a child's laughter. Solace orders everyone away from the air vents before it repeats.",
    voice:
      "N-no. Nobody investigates the noise alone. I've seen what happens to 'just one more look.'",
    hook: 'The hyperparanoid final girl of eleven disasters, promoted from janitor to captain in four weeks.',
    oddity:
      'Maintains a laminated exit map of the couch, despite the couch having exactly zero hallways. Carries a mop like a ceremonial weapon.',
    storyPromise:
      'Survival-horror comedy, terrible premonitions that might save everyone, abandoned safety protocols, and the courage to trust a crew after outliving too many.',
    crewSpark:
      "Fen knows how to open a civilian escape corridor; Tess keeps finding the one route Solace's disaster map doesn't cover.",
  },
  rex: {
    history:
      "Rex insists on being called the Hero of a Thousand Suns, although his official military record lists three evacuation drills and one costly photograph. He commissioned a cape that blows dramatically in a vacuum and practises heroic speeches before the couch's shield has finished inflating. Under the poses is a person terrified that genuine courage will arrive without a camera crew.",
    liability:
      'An interstellar fan club charter obliges Rex to rescue anyone who correctly shouts his catchphrase, even when the phrase was coined by an enemy.',
    opening:
      'A colony asks for a discreet rescue. Rex has already rented a spotlight and sent ahead a trumpet.',
    voice:
      'Citizens! Your savior has arrived! Is there an elevated place from which to arrive again?',
    hook: 'The bombastic wannabe hero who is all theme music until somebody actually needs saving.',
    oddity:
      'Travels with a mechanical wind machine and six self-awarded medals, one for Best Use of a Medal.',
    storyPromise:
      'Publicity stunts turning into real heroism, manufactured rivalries, embarrassing rescue theatrics, and a hard test of whether a person can do good unnoticed.',
    crewSpark:
      "Jex knows exactly how to score Rex's entrance; Pell will only applaud if the workers get paid.",
  },
  quill: {
    history:
      "A hyper-serious gothic survivalist sealed into a matte-black biosuit, Quill has optimized bodily recycling so completely that the flask he solemnly drinks from contains only his own purified fluids. He calls this 'total resource sovereignty' and has never understood why the crew asks him not to mention it at breakfast. His clinical detachment hides an unsettling curiosity about what makes a body worth protecting.",
    liability:
      'The technology that keeps Quill self-sufficient was developed using involuntary medical trials. His suit may still contain memories from another patient.',
    opening:
      'An outbreak report lists the couch as a potential organism. Quill volunteers a specimen from himself. The specimen tries to leave.',
    voice:
      'Waste is a theological error. Would anyone care for a sip? No? Inconsistent.',
    hook: 'A hyperserious goth in a full-body suit who drinks his own perfectly recycled fluids.',
    oddity:
      "The flask is labeled 'ME, VINTAGE'. Keeps a mourning veil for every consumed electrolyte.",
    storyPromise:
      "Body-horror science played deadpan, dubious immortality, bodily autonomy, sentient infections, and the moral limits of optimizing someone else's survival.",
    crewSpark:
      'Vela insists a patient has rights even when the patient is Quill; Brin questions whether his suit counts as a hostile ecosystem.',
  },
  ro: {
    history:
      "Ro rose from a midnight holographic horror program to accidental interstellar nobility when two warring moons mistook a theatrical coronation for a binding treaty. Wrapped in black velvet, with a cemetery's worth of lacquered curls and a voice capable of making a weather forecast sound like an exquisite curse, Ro hosts catastrophes with the relish of a late-night fright presenter. The diplomatic credentials are fake; the peace they produced is not.",
    liability:
      'The two moons expect Ro to officiate an ancestral wedding, a state funeral, and an annual ritual sacrifice. All three are apparently scheduled for Thursday.',
    opening:
      "A distress signal begins with a pipe organ and the words 'Dearly doomed.' Ro demands to know who stole the opening music.",
    voice:
      'Darlings, the galaxy is dying. Do try to look devastating when it does.',
    hook: 'A sumptuous velvet horror-show host whose fake royal credentials accidentally ended a war.',
    oddity:
      'Carries a miniature fog machine for dramatic entrances. The fog is technically under diplomatic protection.',
    storyPromise:
      'Gothic camp, haunted space diplomacy, enemies falling in love at funerals, cursed bargains, and the difference between making a spectacle and changing lives.',
    crewSpark:
      "Omi provides involuntary thunder on cue; Rue is horrified by the validity of Ro's improvised treaty.",
  },
}

export type CrewDossier = {
  history: string
  itinerary: readonly [string, string, string]
  crisis: string
  nemesisLink: string
  oddity: string
  hook: string
  storyPromise: string
  crewSpark: string
}

export const CREW_DOSSIERS: Record<CrewId, CrewDossier> = {
  pell: {
    history:
      'Pell kept machinery working at Ashdock while contractors removed the names of the people it killed. He is tired of being thanked for his silence.',
    itinerary: [
      'Ashdock: find the union register',
      'Nacre Assembly: obtain testimony',
      'Mirror Census: restore names',
    ],
    crisis:
      'Publish every name at once, or let families decide who may read the record.',
    nemesisLink:
      'The Auditor offers to erase liability in exchange for false testimony.',
    oddity:
      "Keeps a brass wind-up beetle named Overtime that steals unsafe tools out of supervisors' pockets.",
    hook: 'A tiny union mechanic with a clockwork grievance beetle and the names of the dead stitched into his tool roll.',
    storyPromise:
      'Expose a factory disaster without using the bereaved as evidence props; decide whether the engineer can learn to stop fixing everybody.',
    crewSpark:
      'Rex wants a rescue statue; Pell wants hazard pay and a working emergency exit.',
  },
  vela: {
    history:
      'Vela refused to classify a refugee patient as cargo. An emergency treatment she invented is now being sold to the people who helped prove it worked.',
    itinerary: [
      'Hollow Lantern: treat survivors',
      'Haleth Reef: confront the reseller',
      'Courtesy Twins: govern distribution',
    ],
    crisis: 'Release the cure freely or require local medical oversight first.',
    nemesisLink:
      'Curdle offers instant universal distribution with undisclosed additives.',
    oddity:
      "The clinic triage bell shouts 'DID YOU ASK?' because her former patients reprogrammed it.",
    hook: 'A physician who refuses to call people cargo and whose bedside manner includes arguing with her own alarm bell.',
    storyPromise:
      'Track the theft of her cure, protect patients from patent holders, and let this doctor decide whether she can receive care herself.',
    crewSpark:
      'Quill offers to be a medical sample; Vela knows he is a person first, no matter how suspicious the sample is.',
  },
  tess: {
    history:
      'Her grandmother hid refuge routes on a map that could save thousands or expose them all.',
    itinerary: [
      'Windglass: recover a buoy',
      'Serendipity: meet the keeper',
      'Hollow Lantern: escort refugees',
    ],
    crisis: 'Reveal sanctuary coordinates or accept slower, safer rescue.',
    nemesisLink:
      'The Queen of Borrowed Faces sells untraceable passage papers.',
    oddity:
      'Keeps a star chart tattoo with a deliberate blank spot that she refuses to explain, even while asleep.',
    hook: 'A navigator whose most valuable map is the constellation she left blank.',
    storyPromise:
      'Hide or reveal sanctuary routes; discover whether a rescue can be heroic without being published on a map.',
    crewSpark:
      'Solace asks for the safest exit; Tess offers a direction nobody else has ever drawn.',
  },
  rue: {
    history:
      'Rue translated the treaty that denied citizenship to people without an official home address. Rue wrote one of the contested clauses.',
    itinerary: [
      'Concord: locate signatories',
      'Nacre: hear testimony',
      'Courtesy Twins: restore status',
    ],
    crisis: 'Reopen a whole treaty or grant a narrow emergency exception.',
    nemesisLink:
      'The Auditor offers a suspiciously complete missing signature.',
    oddity:
      "Their emergency briefcase contains eleven notarized apologies and a gavel that says 'Objection, darling' in their grandmother's voice.",
    hook: 'A diplomat whose perfect legal footnotes once erased a whole population from a treaty.',
    storyPromise:
      'Own a devastating translation, rebuild a public record, and find out whether the law can apologize without claiming forgiveness.',
    crewSpark:
      "Ro once improvised a fake monarchy; Rue's professional nightmare is that its treaty is legally airtight.",
  },
  mox: {
    history:
      'Mox-9 remembers receiving a deletion order in its own handwriting. It suspects its first memory was produced under coercion.',
    itinerary: [
      'Tellurian: find boot log',
      'Sesh: meet backups',
      'Gameworld: contest AI custody',
    ],
    crisis:
      'Own its code outright, or allow independently minded copies to disagree.',
    nemesisLink: 'The Showrunner recognizes its manufacturing checksum.',
    oddity:
      'Bought itself two mismatched eyelids so it could learn to wink. It has not yet decided whether it likes being looked at.',
    hook: 'An embodied, fully sentient android whose factory default was obedience, and whose first personal choice was to refuse deletion.',
    storyPromise:
      'Claim a right to its own body and memories, meet independently minded backups, develop preferences no one gets to overwrite, and choose what kind of person to become.',
    crewSpark:
      "Vale wants to jailbreak Mox's operating system; Mox would prefer she ask its permission, including for upgrades.",
  },
  jex: {
    history:
      'Jex performed six ceasefire anthems without learning who commissioned them. Now he asks the audience whose story a song was meant to bury.',
    itinerary: [
      'Courtesy Twins: reclaim masters',
      'Serendipity: hold rehearsal',
      'Quiet Sun: concert or boycott',
    ],
    crisis: 'Perform a shared anthem or defend the right to remain separate.',
    nemesisLink: 'A counter-melody can disrupt the Brass Choir.',
    oddity:
      'Can play a patriotic anthem backwards to reveal which dictator commissioned it. Has been banned from his own greatest hits.',
    hook: 'A musician who wrote six national anthems, accidentally started two ceasefires, and is now forbidden to play them.',
    storyPromise:
      'Unravel propaganda disguised as peacemaking; reunite enemies without erasing their songs; learn to sing without an audience.',
    crewSpark:
      'Rex wants an orchestral entrance and Ro wants a funeral dirge. Jex has the same sheet music for both.',
  },
  sora: {
    history:
      'Her community votes on whether machines have standing. Sora once voted against someone who is now her closest friend.',
    itinerary: [
      'Sesh: visit a power station',
      'Tellurian: recover petitions',
      'Gameworld: defend autonomy',
    ],
    crisis:
      'Give a sentient station a choice even when the choice may hurt the couch.',
    nemesisLink:
      'The Showrunner wants living machines drafted as stage equipment.',
    oddity:
      'Her six elbows hold a full engineering committee meeting while she works. The abandoned generator is allowed a vote.',
    hook: 'A six-jointed engineer who repairs machines by apologizing to them first, just in case.',
    storyPromise:
      'Face the living power station she once voted against, grant independent minds the right to refuse work, and survive the resulting blackout.',
    crewSpark:
      'Vale calls it an engineering puzzle; Sora suspects the generator would like to resign.',
  },
  kivo: {
    history:
      'A sibling vanished along a courier path Kivo helped conceal. Their worst fear is that the disappearance was a deliberate departure.',
    itinerary: [
      'Windglass: trace pressure',
      'Ashdock: audit freight',
      'Mirror Census: find sibling',
    ],
    crisis: 'Respect an unread letter or open it in the name of family.',
    nemesisLink: 'The Queen sends counterfeit messages in a familiar voice.',
    oddity:
      'Their hollow wrist bones whistle when pressure changes. The noise has accidentally exposed three lies and a surprise birthday party.',
    hook: 'A courier-scout who hears space pressure through their bones and fears one missing letter is a goodbye.',
    storyPromise:
      'Choose between tracking a vanished sibling and respecting their choice not to be found; decide what loyalty means without surveillance.',
    crewSpark:
      "Fluke keeps trying to read tomorrow's letter. Kivo would like him to stop opening other people's mail.",
  },
  taal: {
    history:
      'A false thermal ballot ended a long peace. Taal can detect manipulated votes but cannot make the assembly trust one another.',
    itinerary: [
      'Nacre: recover votes',
      'Haleth: verify temperature log',
      'Concord: reopen treaty',
    ],
    crisis: 'Expose a legal fraud that may reignite a real war.',
    nemesisLink: 'The Auditor accepts the forged votes as technically valid.',
    oddity:
      'Expresses disapproval by lowering a room three degrees. Once accidentally proposed marriage to a thermostat.',
    hook: 'A solemn temperature-speaking envoy whose silences have started and ended wars.',
    storyPromise:
      "Expose counterfeit ballots and learn to translate consent without making everyone else's feelings a referendum.",
    crewSpark:
      'Ro thinks a cold room makes excellent atmosphere. Taal insists that is an official protest.',
  },
  brin: {
    history:
      'An oxygen garden helped a refugee dome survive and then invaded the sacred orchard beside it. Brin refuses to call it a clean victory.',
    itinerary: [
      'Rootborne: repair orchard',
      'Hollow Lantern: offer spores',
      'Quiet Sun: expose terraforming',
    ],
    crisis:
      'Share living air filters only with informed consent, even in an emergency.',
    nemesisLink: 'The Kindly Swarm offers effortless collective gardening.',
    oddity:
      'Her oxygen spores are excellent shipmates except that the largest fungus has joined a gardening union and demands holidays.',
    hook: 'An ecologist whose portable oxygen garden has strong opinions about management.',
    storyPromise:
      'Repair the ecosystem harmed by her own miracle cure; negotiate between refugees and an orchard that refuses to be saved.',
    crewSpark:
      "Quill calls the suit's fungal invasion contamination; Brin calls it a tenant dispute.",
  },
  omi: {
    history:
      'Omi warned a city of disaster, but the final chime was suppressed because it interrupted a memorial service.',
    itinerary: [
      'Harmonic Belt: recover note',
      'Serendipity: locate witness',
      'Gameworld: sound public alarm',
    ],
    crisis:
      'Broadcast a dangerous truth in a language everyone can understand.',
    nemesisLink: 'The Brass Choir steals the missing frequency.',
    oddity:
      "Speaks in chest-bell chords. The smallest bell is reserved for saying 'no' and sounds alarmingly like a tiny gong.",
    hook: 'A stone-bodied signaler with six resonant bells and a history of being silenced for interrupting important ceremonies.',
    storyPromise:
      'Restore the warning that was edited out of a disaster, confront the people who call alarm an embarrassment, and compose a song nobody can censor.',
    crewSpark:
      'Ro loves the thunder; Omi would like to be heard at normal conversational volume.',
  },
  fen: {
    history:
      'Fen resigned when a border database changed displaced families into trespassers overnight. They still carry the confiscated permits.',
    itinerary: [
      'Concord: retrieve passes',
      'Ashdock: escort owners',
      'Hollow Lantern: reopen corridor',
    ],
    crisis:
      'Create an unarmed evacuation corridor or enforce order by military force.',
    nemesisLink: 'The Regent offers protection in exchange for registration.',
    oddity:
      'Their old regulation boots announce CHECKPOINT every time a door opens. Fen has spent years trying to disable them.',
    hook: 'A former border guard whose shoes still insist on checking passports he no longer believes in.',
    storyPromise:
      'Return confiscated papers, create escape corridors without guards, and decide whether good intentions excuse past orders.',
    crewSpark:
      "Solace's emergency exit map terrifies Fen because the exits are all marked classified.",
  },
}
