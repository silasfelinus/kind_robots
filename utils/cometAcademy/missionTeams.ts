import type { StudentId } from './rules'

export type HeroMood = 'positive' | 'neutral' | 'negative'
export type HeroReaction = { mood: HeroMood; line: string }

const PERSONAL_RESPONSES: Record<StudentId, Record<string, HeroReaction>> = {
  mina: {
    ferris: {
      mood: 'positive',
      line: "Lower them by hand. I don't trust that motor.",
    },
    blackout: {
      mood: 'positive',
      line: 'Ventilators first. Everything else is paperwork.',
    },
    quarry: {
      mood: 'positive',
      line: 'Four people under rock. We dig until they are out.',
    },
    rally: { mood: 'neutral', line: 'Open more exits. The speeches can wait.' },
    refinery: {
      mood: 'positive',
      line: 'Get the families out of those stairwells.',
    },
    vault: {
      mood: 'neutral',
      line: 'Get the hostages out. The rest is a lawsuit.',
    },
    monorail: {
      mood: 'positive',
      line: "I'm not leaving passengers in that train.",
    },
    museum: {
      mood: 'neutral',
      line: 'I want the museum guests safe, whatever the sponsor wants.',
    },
    flood: {
      mood: 'positive',
      line: 'We can save the lower market if we move now.',
    },
    garden: {
      mood: 'positive',
      line: "The vine's fear matters as much as ours.",
    },
    broadcast: {
      mood: 'neutral',
      line: 'An accurate warning needs a safe route.',
    },
    skybridge: {
      mood: 'positive',
      line: 'The cleaners have names. I know them.',
    },
  },
  sol: {
    ferris: {
      mood: 'neutral',
      line: "The owner's control panel is lying about the wind.",
    },
    blackout: {
      mood: 'positive',
      line: 'A sold generator leaves a receipt. I will find it.',
    },
    quarry: {
      mood: 'neutral',
      line: 'Those tunnel sensors were switched off on purpose.',
    },
    rally: {
      mood: 'neutral',
      line: "The publicist's statement was written an hour ago.",
    },
    refinery: {
      mood: 'positive',
      line: 'Smothered sensors mean a device. Devices leave traces.',
    },
    vault: {
      mood: 'positive',
      line: 'Those are academy suits. I can shut them down.',
    },
    monorail: {
      mood: 'positive',
      line: 'That train was hacked. I want the logs.',
    },
    museum: { mood: 'negative', line: "A robbery isn't a graduation project." },
    flood: { mood: 'neutral', line: 'Give me the seawall control map.' },
    garden: { mood: 'neutral', line: "I'll isolate the spore sensors." },
    broadcast: {
      mood: 'positive',
      line: 'Someone is lying on those airwaves.',
    },
    skybridge: {
      mood: 'positive',
      line: "The bridge's maintenance records were altered.",
    },
  },
  imani: {
    ferris: {
      mood: 'positive',
      line: 'Someone has to talk to the wedding party before they climb out.',
    },
    blackout: {
      mood: 'neutral',
      line: 'Ask the nurses which floors can wait.',
    },
    quarry: {
      mood: 'neutral',
      line: 'Talk to the families before the authority does.',
    },
    rally: {
      mood: 'positive',
      line: 'A crowd is just a lot of frightened people. I will talk.',
    },
    refinery: {
      mood: 'neutral',
      line: 'Residents have reported that smell for months.',
    },
    vault: {
      mood: 'positive',
      line: 'They want files, not blood. Let me talk to them.',
    },
    monorail: {
      mood: 'positive',
      line: 'Talk to the people inside before cutting power.',
    },
    museum: {
      mood: 'negative',
      line: 'The gala guests did not consent to your theft.',
    },
    flood: {
      mood: 'positive',
      line: 'Ask the vendors what they need to carry.',
    },
    garden: {
      mood: 'positive',
      line: 'The greenhouse is a frightened living thing.',
    },
    broadcast: {
      mood: 'positive',
      line: 'Panic is not an excuse to hoard the truth.',
    },
    skybridge: {
      mood: 'positive',
      line: 'The cleaners must direct their own rescue.',
    },
  },
  ash: {
    ferris: {
      mood: 'positive',
      line: 'That squall has a gap in eleven minutes. I can widen it.',
    },
    blackout: {
      mood: 'positive',
      line: 'I can hold a storm over that substation for an hour.',
    },
    quarry: {
      mood: 'negative',
      line: 'Wind will not move rock, and rain will bring the ceiling down.',
    },
    rally: {
      mood: 'neutral',
      line: 'Confetti and a crosswind. This could get worse.',
    },
    refinery: {
      mood: 'positive',
      line: 'I can lift that cloud off the rooftops.',
    },
    vault: {
      mood: 'neutral',
      line: 'Glass roof over a marble lobby. Careful with weather.',
    },
    monorail: { mood: 'neutral', line: 'Check the real wind loads first.' },
    museum: { mood: 'neutral', line: 'That glass will shatter if we rush.' },
    flood: {
      mood: 'positive',
      line: 'Weather and tidal pressure are my specialty.',
    },
    garden: { mood: 'positive', line: 'Roots and rain share a language.' },
    broadcast: { mood: 'neutral', line: 'The forecast needs sources.' },
    skybridge: {
      mood: 'positive',
      line: 'Nobody listened when maintenance reported this.',
    },
  },
  nix: {
    ferris: {
      mood: 'neutral',
      line: 'I can reach the top car, not carry a wedding.',
    },
    blackout: {
      mood: 'neutral',
      line: 'I can shuttle batteries, not a power grid.',
    },
    quarry: {
      mood: 'positive',
      line: 'I can fold a door through the rubble if someone holds it.',
    },
    rally: { mood: 'positive', line: 'I will open the side streets.' },
    refinery: {
      mood: 'neutral',
      line: 'I can move people. I cannot move air.',
    },
    vault: {
      mood: 'neutral',
      line: 'I can pull hostages out, not through a vault door.',
    },
    monorail: {
      mood: 'positive',
      line: 'I can open a safe exit by the last carriage.',
    },
    museum: {
      mood: 'positive',
      line: "I've slipped through stricter security.",
    },
    flood: {
      mood: 'neutral',
      line: 'The portal current is wrong near the seawall.',
    },
    garden: {
      mood: 'negative',
      line: 'Trapping a living thing feels too familiar.',
    },
    broadcast: {
      mood: 'positive',
      line: 'Evacuation corridors are what I do.',
    },
    skybridge: {
      mood: 'positive',
      line: 'There is still an anchor point across the gap.',
    },
  },
  kit: {
    ferris: {
      mood: 'neutral',
      line: 'Bring blankets. Rescued people go into shock.',
    },
    blackout: {
      mood: 'positive',
      line: 'I know that ward. I will keep the patients steady.',
    },
    quarry: {
      mood: 'positive',
      line: 'Crush injuries need care the second they are free.',
    },
    rally: {
      mood: 'positive',
      line: 'More crush injuries. I will be at the barricades.',
    },
    refinery: {
      mood: 'positive',
      line: 'Burned lungs. Bring every oxygen kit we own.',
    },
    vault: {
      mood: 'neutral',
      line: 'Are the testers hurt inside those suits?',
    },
    monorail: { mood: 'positive', line: 'I can keep the injured stable.' },
    museum: { mood: 'negative', line: 'If this is a theft, count me out.' },
    flood: { mood: 'positive', line: 'The market pharmacy must be protected.' },
    garden: {
      mood: 'positive',
      line: 'Nobody burns an organism before we understand it.',
    },
    broadcast: { mood: 'neutral', line: 'I can staff the emergency clinic.' },
    skybridge: {
      mood: 'positive',
      line: 'Medical supplies to the bridge, now.',
    },
  },
  veda: {
    ferris: {
      mood: 'positive',
      line: 'A wheel rescue on live television? I will rig the lines.',
    },
    blackout: {
      mood: 'negative',
      line: 'Hospital wiring is not a stunt. Call the electricians.',
    },
    quarry: {
      mood: 'neutral',
      line: 'Tunnels are dark and nobody films them. Fine, I will come.',
    },
    rally: {
      mood: 'negative',
      line: 'That hero trained with me. I will not embarrass him.',
    },
    refinery: {
      mood: 'neutral',
      line: 'Chemical clouds are not heroic, but fine.',
    },
    vault: {
      mood: 'negative',
      line: 'I trained some of those testers. This is a mess.',
    },
    monorail: {
      mood: 'positive',
      line: "I've survived this kind of stunt without a harness.",
    },
    museum: {
      mood: 'positive',
      line: 'Finally a challenge worthy of the training hall.',
    },
    flood: {
      mood: 'neutral',
      line: 'Someone wants a celebrity rescue. Be careful.',
    },
    garden: {
      mood: 'negative',
      line: 'I will not perform for a corporate lab.',
    },
    broadcast: {
      mood: 'neutral',
      line: 'Give me a camera and a fact-checker.',
    },
    skybridge: {
      mood: 'positive',
      line: 'I know how to rig a safe crossing under pressure.',
    },
  },
  mara: {
    ferris: {
      mood: 'negative',
      line: 'The ride operators begged for that repair. Ask them first.',
    },
    blackout: {
      mood: 'positive',
      line: 'The electricians’ local will come if we ask properly.',
    },
    quarry: {
      mood: 'positive',
      line: 'Those are transit workers. The union is already there.',
    },
    rally: {
      mood: 'positive',
      line: 'The protest marshals know these streets. Use them.',
    },
    refinery: {
      mood: 'neutral',
      line: 'Refinery workers are scared to talk. Be careful.',
    },
    vault: {
      mood: 'positive',
      line: 'Laid-off workers out of options. Let me negotiate.',
    },
    monorail: {
      mood: 'positive',
      line: "The conductor is a union member. I'm going.",
    },
    museum: {
      mood: 'negative',
      line: "Don't make security guards your disposable extras.",
    },
    flood: { mood: 'positive', line: 'The vendors are my neighbors.' },
    garden: {
      mood: 'neutral',
      line: 'If the fire lane closes, shift workers get hurt.',
    },
    broadcast: {
      mood: 'positive',
      line: 'I know the neighborhoods the broadcast overlooks.',
    },
    skybridge: {
      mood: 'positive',
      line: 'Those cleaners deserve names and hazard pay.',
    },
  },
  drift: {
    ferris: {
      mood: 'neutral',
      line: 'Heights were not in my design specifications.',
    },
    blackout: {
      mood: 'negative',
      line: 'A stolen machine from criminals. They will take it.',
    },
    quarry: {
      mood: 'positive',
      line: 'I was buried in a laboratory once. I will go.',
    },
    rally: { mood: 'negative', line: 'Crowds frighten me more than fire.' },
    refinery: {
      mood: 'positive',
      line: 'My lungs filter better than yours. Send me in.',
    },
    vault: {
      mood: 'positive',
      line: 'They were used and thrown away. I know that feeling.',
    },
    monorail: { mood: 'neutral', line: 'The machines sound frightened.' },
    museum: {
      mood: 'negative',
      line: 'Another institution keeping property in cages.',
    },
    flood: {
      mood: 'positive',
      line: 'Contaminated water can hurt people like me.',
    },
    garden: {
      mood: 'positive',
      line: "I was grown in a lab too. Don't destroy it.",
    },
    broadcast: {
      mood: 'negative',
      line: 'A broadcaster wants to classify us as threats.',
    },
    skybridge: {
      mood: 'neutral',
      line: 'I can adapt tissue to keep people breathing.',
    },
  },
  tessel: {
    ferris: {
      mood: 'positive',
      line: 'The storm is listening. I can ask it to wait.',
    },
    blackout: {
      mood: 'neutral',
      line: 'There is thunder behind those clouds, and it is not friendly.',
    },
    quarry: {
      mood: 'neutral',
      line: 'The stone smells like a world I left. I will try.',
    },
    rally: { mood: 'neutral', line: 'So many voices at once. I will try.' },
    refinery: {
      mood: 'positive',
      line: 'That cloud is heavy. The wind can carry it out to sea.',
    },
    vault: { mood: 'neutral', line: 'Banks feel the same in every world.' },
    monorail: {
      mood: 'positive',
      line: 'I can fold the route outside the tracks.',
    },
    museum: {
      mood: 'neutral',
      line: "Museum security isn't designed for other dimensions.",
    },
    flood: {
      mood: 'positive',
      line: "I've crossed worse tides between worlds.",
    },
    garden: {
      mood: 'positive',
      line: 'That vine may have grown through the gate.',
    },
    broadcast: {
      mood: 'neutral',
      line: 'I hear two futures in the broadcast.',
    },
    skybridge: {
      mood: 'positive',
      line: 'A bridge is simply a promise between shores.',
    },
  },
  jo: {
    ferris: {
      mood: 'neutral',
      line: 'If the owner wants cameras, I want the repair logs.',
    },
    blackout: {
      mood: 'positive',
      line: 'That generator went for scrap with somebody’s signature on it.',
    },
    quarry: {
      mood: 'positive',
      line: 'Why does the authority want this sealed by sunrise?',
    },
    rally: {
      mood: 'positive',
      line: 'Somebody needs to record what actually happened.',
    },
    refinery: {
      mood: 'positive',
      line: 'A drill? Then I want the drill schedule.',
    },
    vault: {
      mood: 'positive',
      line: 'The bank wants one box retrieved quietly. That is the story.',
    },
    monorail: { mood: 'positive', line: "I'll put the dispatch logs on air." },
    museum: {
      mood: 'positive',
      line: 'This reeks of a donor laundering stolen goods.',
    },
    flood: {
      mood: 'positive',
      line: 'The city deserves to know who diverted the seawall.',
    },
    garden: { mood: 'neutral', line: 'Get the lab director on record first.' },
    broadcast: {
      mood: 'positive',
      line: 'This is my broadcast. I can correct it.',
    },
    skybridge: {
      mood: 'positive',
      line: 'My audience knows the workers inside.',
    },
  },
  lark: {
    ferris: {
      mood: 'positive',
      line: 'I will set up triage at the foot of the pier.',
    },
    blackout: { mood: 'positive', line: 'That is my hospital. I am going.' },
    quarry: {
      mood: 'neutral',
      line: 'I will take surface triage. Tunnels make me panic.',
    },
    rally: {
      mood: 'positive',
      line: 'Protesters get hurt too. I will treat everyone.',
    },
    refinery: {
      mood: 'positive',
      line: 'This is exactly who nobody else shows up for.',
    },
    vault: {
      mood: 'neutral',
      line: 'Hostages first. Then I want to read those injury files.',
    },
    monorail: { mood: 'positive', line: 'I have emergency beds ready.' },
    museum: {
      mood: 'negative',
      line: "I won't be hired to hurt museum staff.",
    },
    flood: {
      mood: 'positive',
      line: 'Bring the medicine first; money can be replaced.',
    },
    garden: {
      mood: 'positive',
      line: 'Treat the botanist and the roots with care.',
    },
    broadcast: {
      mood: 'positive',
      line: 'Let me check the evacuation instructions.',
    },
    skybridge: {
      mood: 'positive',
      line: 'Those cleaners need triage, not a photo opportunity.',
    },
  },
}

const NEW_CASE_REACTIONS: Record<
  string,
  { person: StudentId; response: HeroReaction }
> = {
  'frog-serum': {
    person: 'drift',
    response: {
      mood: 'positive',
      line: 'I am not a failed experiment. Neither is Dr. Frog. Let me speak to him.',
    },
  },
  'mirror-court': {
    person: 'imani',
    response: {
      mood: 'positive',
      line: 'Forty versions of a winner and not one vote from the missing stagehand?',
    },
  },
  'stolen-hour': {
    person: 'nix',
    response: {
      mood: 'negative',
      line: 'A lost hour means somebody sold time that belonged to patients.',
    },
  },
  'ghost-ticket': {
    person: 'mara',
    response: {
      mood: 'positive',
      line: 'The dead do not issue transit permits. Developers do.',
    },
  },
  'borrowed-faces': {
    person: 'lark',
    response: {
      mood: 'positive',
      line: 'A scan is not a person. We have to ask each rider what they need.',
    },
  },
  'rail-heart': {
    person: 'mina',
    response: {
      mood: 'positive',
      line: 'Brace the axle. Nobody gets to use a conductor as a test component.',
    },
  },
  'granny-shuttle': {
    person: 'veda',
    response: {
      mood: 'positive',
      line: 'That woman taught me every stunt I know. She has never learned to brake.',
    },
  },
  'tomorrow-tide': {
    person: 'tessel',
    response: {
      mood: 'positive',
      line: 'I know that wave. It traveled here from a forecast that has not happened.',
    },
  },
  'pearl-pact': {
    person: 'nix',
    response: {
      mood: 'positive',
      line: 'A pearl can hide a door, and a door can hide a witness.',
    },
  },
  'halo-contract': {
    person: 'sol',
    response: {
      mood: 'negative',
      line: 'Those halos have a command port. Nobody volunteered to wear consent.',
    },
  },
  'hospital-saint': {
    person: 'kit',
    response: {
      mood: 'positive',
      line: 'Healing someone does not mean owning their future.',
    },
  },
  'lightning-election': {
    person: 'ash',
    response: {
      mood: 'negative',
      line: 'That weather is a machine with an opinion about voting.',
    },
  },
  'detention-moon': {
    person: 'nix',
    response: {
      mood: 'positive',
      line: 'I can fold an orbit. What I cannot forgive is experimenting on students who cannot leave.',
    },
  },
  'promise-stairs': {
    person: 'imani',
    response: {
      mood: 'positive',
      line: 'A promise made under threat is not a staircase. It is a trap dressed in language.',
    },
  },
  'mascot-uprising': {
    person: 'drift',
    response: {
      mood: 'positive',
      line: 'Everybody called me an experiment too. Please ask the mascot its name before burning it.',
    },
  },
  'future-graduates': {
    person: 'mara',
    response: {
      mood: 'positive',
      line: "Tomorrow's passengers deserve a seat and today's workers deserve the whole timetable.",
    },
  },
  'rail-orchestra': {
    person: 'veda',
    response: {
      mood: 'negative',
      line: 'A boss who can force a song can force a confession. Get those performers out.',
    },
  },
  'shadow-inspector': {
    person: 'sol',
    response: {
      mood: 'positive',
      line: 'It is a database wearing a trench coat. The people who built it are the real monsters.',
    },
  },
  'double-lighthouse': {
    person: 'tessel',
    response: {
      mood: 'positive',
      line: 'Two beams and two sea winds. Someone is teaching the storm to lie.',
    },
  },
  'colossal-ring': {
    person: 'mina',
    response: {
      mood: 'positive',
      line: 'I can move the ring. First I want to know whose seawall they stole to make it.',
    },
  },
  'cloud-zoo': {
    person: 'kit',
    response: {
      mood: 'positive',
      line: 'Do not tranquilize the floating whale. It is smaller than my med kit and twice as frightened.',
    },
  },
  'shadow-court': {
    person: 'jo',
    response: {
      mood: 'negative',
      line: "Tomorrow's crimes should not become today's headlines without a witness to challenge them.",
    },
  },
  'ambulance-detour': {
    person: 'lark',
    response: {
      mood: 'positive',
      line: 'Those patients have no time for a turf war between public medics and private dispatch.',
    },
  },
  'shield-auction': {
    person: 'ash',
    response: {
      mood: 'negative',
      line: 'You cannot sell the sky back to the people standing under it.',
    },
  },
}

export function missionReaction(
  person: StudentId,
  mission: string,
): HeroReaction {
  const named = NEW_CASE_REACTIONS[mission]
  if (named?.person === person) return named.response
  return (
    PERSONAL_RESPONSES[person]?.[mission] ?? {
      mood: 'neutral',
      line: 'I need the briefing before I can commit.',
    }
  )
}

export type RouteUnlock = { label: string; result: string; boost: number }
const ROUTES: Record<string, { people: StudentId[]; route: RouteUnlock }[]> = {
  'promise-stairs': [
    {
      people: ['imani', 'jo'],
      route: {
        label: 'The Contract in Plain Sight',
        result:
          "Imani convinces the staircase's victims to compare their consent forms while Jo broadcasts the hidden scholarship clauses. The false stairs vanish when the contract loses its power over them.",
        boost: 2,
      },
    },
  ],
  'mascot-uprising': [
    {
      people: ['drift', 'kit'],
      route: {
        label: 'The Costume Finds a Voice',
        result:
          'DRIFT-9 speaks for the living mascot while Kit builds a safe nursery for its roots. The costume chooses its own name, and former performers volunteer to care for it.',
        boost: 2,
      },
    },
  ],
  'future-graduates': [
    {
      people: ['nix', 'mara'],
      route: {
        label: 'The Union of Two Tomorrows',
        result:
          "Nix anchors the arriving future train while Mara makes the transit workers' warning official. Both versions of the crew agree to rebuild the switch before the predicted collision.",
        boost: 2,
      },
    },
  ],
  'double-lighthouse': [
    {
      people: ['ash', 'tessel'],
      route: {
        label: "The Wind's True Lantern",
        result:
          "Ash clears the artificial rain curtain while Tessel listens for the harbor's genuine tide. Both threatened boats follow the keeper's restored light into safe water.",
        boost: 2,
      },
    },
  ],
  'cloud-zoo': [
    {
      people: ['drift', 'kit'],
      route: {
        label: 'Sanctuary, Not Shipment',
        result:
          "DRIFT-9 reads the animals' mist-memories while Kit prepares a living nursery on the pier. The handlers cannot claim the animals as cargo after the creatures choose their home.",
        boost: 2,
      },
    },
  ],
  'shield-auction': [
    {
      people: ['mina', 'sol'],
      route: {
        label: 'A City Without a Price Tag',
        result:
          "Mina steadies the failing shield anchors while Sol cancels the auction's private command keys. Families reclaim cover while the engineer publishes the records of manufactured scarcity.",
        boost: 2,
      },
    },
  ],
  'frog-serum': [
    {
      people: ['kit', 'drift'],
      route: {
        label: 'The Right to Be Changed',
        result:
          'Kit stabilizes the janitor while DRIFT-9 recognizes the professor as a fellow person whose body is changing without consent. Dr. Frog hands over the antidote voluntarily and names the saboteur.',
        boost: 2,
      },
    },
  ],
  'mirror-court': [
    {
      people: ['imani', 'jo'],
      route: {
        label: 'The Cast Takes the Vote',
        result:
          'Imani earns the missing stagehand’s trust and Jo exposes the rehearsal footage, letting the cast run a real count instead of accepting the mirror sponsor’s false victory.',
        boost: 2,
      },
    },
  ],
  'granny-shuttle': [
    {
      people: ['veda', 'mara'],
      route: {
        label: 'Granny’s Unpaid Stunt Team',
        result:
          'Veda steadies the bus while Mara gets the bridge crews to defy the private rescue company. Granny Mayhem applauds from the driver’s seat and demands that the workers lead the victory parade.',
        boost: 2,
      },
    },
  ],
  'halo-contract': [
    {
      people: ['sol', 'jo'],
      route: {
        label: 'No Halo, No Orders',
        result:
          'Sol finds the obedience switch and Jo broadcasts a live demonstration with informed volunteers, forcing the factory to recall the halos before they reach any school.',
        boost: 2,
      },
    },
  ],
  monorail: [
    {
      people: ['mara', 'sol'],
      route: {
        label: 'The Union Override',
        result:
          'Mara secures the transit workers’ trust while Sol patches the corrupt routing. A union-built emergency route opens beyond the academy network.',
        boost: 2,
      },
    },
    {
      people: ['nix'],
      route: {
        label: 'The Impossible Platform',
        result:
          'Nix opens a temporary platform in folded space and returns with the conductor’s handwritten manifest.',
        boost: 1,
      },
    },
  ],
  museum: [
    {
      people: ['jo', 'veda'],
      route: {
        label: 'The Live Exhibition',
        result:
          'Jo broadcasts the theft while Veda stages a decoy performance. The buyer exposes their financier in public.',
        boost: 2,
      },
    },
    {
      people: ['sol'],
      route: {
        label: 'A Copy Without a Theft',
        result:
          'Sol duplicates the access key without removing the original, preserving the conservator’s trust.',
        boost: 1,
      },
    },
  ],
  flood: [
    {
      people: ['mara', 'ash'],
      route: {
        label: 'The Workers’ Seawall',
        result:
          'Mara mobilizes dock crews while Ash redirects the surge. Residents control which buildings are protected.',
        boost: 2,
      },
    },
    {
      people: ['tessel'],
      route: {
        label: 'A Tide in Two Worlds',
        result:
          'Tessel diverts a fraction of the wave through a temporary dimensional estuary, revealing an abandoned city beyond.',
        boost: 1,
      },
    },
  ],
  garden: [
    {
      people: ['drift', 'kit'],
      route: {
        label: 'The Living Negotiation',
        result:
          'DRIFT-9 shares the research lab’s language with Kit, and the terrified vines release their captive without extermination.',
        boost: 2,
      },
    },
    {
      people: ['imani'],
      route: {
        label: 'An Unheard Witness',
        result:
          'Imani speaks for the frightened botanist and persuades the institute to pause its incinerators.',
        boost: 1,
      },
    },
  ],
  broadcast: [
    {
      people: ['jo', 'imani'],
      route: {
        label: 'The People’s Emergency Frequency',
        result:
          'Jo supplies uncensored evidence while Imani hosts a civilian-led response; the false alert loses its audience.',
        boost: 2,
      },
    },
    {
      people: ['sol'],
      route: {
        label: 'The Unedited Source',
        result:
          'Sol reconstructs the source transmission and tags the altered portions without suppressing the warning.',
        boost: 1,
      },
    },
  ],
  skybridge: [
    {
      people: ['veda', 'mara'],
      route: {
        label: 'The Stunt Crew Strike',
        result:
          'Veda rigs a temporary crossing as Mara recruits union riggers. The cleaners later demand and win a public inquiry.',
        boost: 2,
      },
    },
    {
      people: ['lark'],
      route: {
        label: 'The Night-Shift Corridor',
        result:
          'Lark opens the old hospital stairwell and creates a triage corridor the academy did not know existed.',
        boost: 1,
      },
    },
  ],
  ferris: [
    {
      people: ['tessel', 'ash'],
      route: {
        label: 'The Calm Above the Pier',
        result:
          'Tessel asks the squall to hold still while Ash opens a quiet gap in it, and every car comes down through still air.',
        boost: 2,
      },
    },
    {
      people: ['mara'],
      route: {
        label: 'The Operators’ Brake',
        result:
          'Mara brings the ride operators back, and they set the hand brake the owner never let them use.',
        boost: 1,
      },
    },
  ],
  blackout: [
    {
      people: ['lark', 'kit'],
      route: {
        label: 'The Ward That Stayed Lit',
        result:
          'Lark and Kit move the ventilated patients floor by floor and keep every one breathing on hand pumps until the power returns.',
        boost: 2,
      },
    },
    {
      people: ['jo'],
      route: {
        label: 'The Scrap Receipt',
        result:
          'Jo finds the receipt for the old generator and airs it live, and the villain crew withdraws its offer before dawn.',
        boost: 1,
      },
    },
  ],
  quarry: [
    {
      people: ['nix', 'mara'],
      route: {
        label: 'The Sandhogs’ Door',
        result:
          'Mara organizes the sandhog crew while Nix folds a door into the dark, and four workers walk out on their own feet.',
        boost: 2,
      },
    },
    {
      people: ['drift'],
      route: {
        label: 'Breathing in the Dust',
        result:
          'DRIFT-9 crawls through dust no human lungs could take and anchors a line to the trapped crew.',
        boost: 1,
      },
    },
  ],
  rally: [
    {
      people: ['imani', 'mara'],
      route: {
        label: 'The Marshals’ Corridor',
        result:
          'Imani speaks over the crowd while Mara’s protest marshals link arms into a corridor to the side streets.',
        boost: 2,
      },
    },
    {
      people: ['jo'],
      route: {
        label: 'The Live Correction',
        result:
          'Jo streams the landing from three angles before the publicist can blame anyone.',
        boost: 1,
      },
    },
  ],
  refinery: [
    {
      people: ['drift', 'ash'],
      route: {
        label: 'The Clean Wind',
        result:
          'DRIFT-9 walks into the cloud to close the valve while Ash pushes the smoke out over the harbor.',
        boost: 2,
      },
    },
    {
      people: ['sol'],
      route: {
        label: 'The Smothered Sensors',
        result:
          'Sol finds the devices on the sensor masts and wakes every alarm on the east side at once.',
        boost: 1,
      },
    },
  ],
  vault: [
    {
      people: ['sol', 'imani'],
      route: {
        label: 'The Peaceful Shutdown',
        result:
          'Sol powers the suits down gently while Imani walks the testers out with their files.',
        boost: 2,
      },
    },
    {
      people: ['veda'],
      route: {
        label: 'Old Instructor, Old Students',
        result:
          'Veda Cross walks into the lobby without armor, and her former testers lower their gauntlets for her.',
        boost: 1,
      },
    },
  ],
}

export function missionRoute(
  mission: string,
  team: readonly StudentId[],
): RouteUnlock | null {
  return (
    ROUTES[mission]?.find((entry) =>
      entry.people.every((id) => team.includes(id)),
    )?.route ?? null
  )
}

export const missionRouteRoster = (mission: string): readonly StudentId[][] =>
  ROUTES[mission]?.map((entry) => entry.people) ?? []

export function reactionSuitability(mood: HeroMood): number {
  return mood === 'positive' ? 1 : mood === 'negative' ? -1 : 0
}
