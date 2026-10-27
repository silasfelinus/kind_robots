import type { CaptainId, CrewId } from './rules'

export type CaptainDossier = {
  history: string
  liability: string
  opening: string
  voice: string
}

export const CAPTAIN_DOSSIERS: Record<CaptainId, CaptainDossier> = {
  fluke: {
    history:
      'Former commander of the separate Improbability Starcruiser. Fluke wrote heroic captain’s logs first, then attempted to make the universe conform to them.',
    liability:
      'A family has arrived to collect on a rescue promised in a report about a voyage that never happened.',
    opening: 'The next distress signal cites a victory you have not yet won.',
    voice: 'Technically, the report is accurate in the future tense.',
  },
  vale: {
    history:
      'A silver-haired treaty negotiator whose last ceasefire aged three years while she lived through eleven minutes. Her signature is on a document nobody remembers drafting.',
    liability:
      'A treaty can be legally valid without a living signatory having consented.',
    opening: 'The ratification arrives before the negotiations.',
    voice: 'The date is correct. The people are the problem.',
  },
  solace: {
    history:
      'A veteran evacuation medic who saved a thousand neighbors and carries the names of those left behind in a hand-maintained ledger.',
    liability:
      'The compulsion to rescue can itself override the people being rescued.',
    opening: 'Two lifeboats transmit the same emergency beacon.',
    voice: 'Please make the complaint after your pulse stabilizes.',
  },
  rex: {
    history:
      'A bombastic former fleet tactician who publicly celebrated a perfect victory while his civilian loss reports were classified.',
    liability:
      'Rex can still rally a terrified crew, but a witness has a subpoena that names him.',
    opening: 'An outpost welcomes its decorated hero with an inquiry.',
    voice: 'I would prefer we not call it retreat in the minutes.',
  },
  quill: {
    history:
      'An exacting robe-wearing archivist who protected evidence of a massacre in an impeccably indexed record that nobody was legally allowed to read.',
    liability: 'Preserving the truth and owning it are not the same duty.',
    opening:
      'A living library demands destruction of its only forbidden catalog.',
    voice: 'The footnote is not an endorsement.',
  },
  ro: {
    history:
      'A gifted cultural negotiator whose improvised credentials once ended a war. Both parties still believe Ro is a hereditary monarch.',
    liability:
      'A pleasant diplomatic fiction can turn into a compulsory national myth.',
    opening:
      'Diplomatic immunity is granted to the upholstery, not its passengers.',
    voice: 'I allowed an interpretation to mature.',
  },
}

export type CrewDossier = {
  history: string
  itinerary: readonly [string, string, string]
  crisis: string
  nemesisLink: string
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
  },
}
