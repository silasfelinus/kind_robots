import type { CrewId } from './rules'
import type { Skill } from './crewAssignments'
import type { ActOneRouteId } from './actOne'
export type ExpeditionEncounter = {
  id: string
  scope: 'local' | 'galaxy'
  priority: 'major' | 'minor'
  title: string
  setup: string
  skill: Skill
  secretCrew: CrewId[]
  commandResult: string
  redshirtResult: string
  secretResult: string
}
type EncounterDraft = readonly [
  string,
  string,
  Skill,
  readonly CrewId[],
  string,
  string,
  string,
]
function card(
  id: string,
  scope: 'local' | 'galaxy',
  priority: 'major' | 'minor',
  draft: EncounterDraft,
): ExpeditionEncounter {
  const [
    title,
    setup,
    skill,
    secretCrew,
    commandResult,
    redshirtResult,
    secretResult,
  ] = draft
  return {
    id,
    scope,
    priority,
    title,
    setup,
    skill,
    secretCrew: [...secretCrew],
    commandResult,
    redshirtResult,
    secretResult,
  }
}
type LocalPack = {
  major: readonly [EncounterDraft, EncounterDraft]
  minor: readonly [EncounterDraft, EncounterDraft]
}
const LOCAL: Record<ActOneRouteId, LocalPack> = {
  refugees: {
    major: [
      [
        'The Asteroid That Demands an Adoption',
        'A refugee flotilla is ordered to adopt its own mining asteroid as a dependent child. The asteroid is crying molten iron, and the registry clerks want the captain to sign a parenthood affidavit before offering oxygen.',
        'diplomacy',
        ['rue', 'brin'],
        'The captain negotiates a rescue charter with the asteroid as a witness, not an appliance.',
        'A redshirt accidentally adopts the asteroid and is assessed three lifetimes of child support.',
        'Brin learns the asteroid can sing a map of safe refugee harbors only to someone who has planted a seed.',
      ],
      [
        'The Civilian Ship Made of Unpaid Dreams',
        'A rescue skiff is held together with sleeping passengers’ dreams, each mortgaged to an insurance company. The dream of a giant rubber duck is the only thing preventing a hull breach.',
        'rescue',
        ['vela', 'tess'],
        'The away commander redistributes the life support without stealing the passengers’ sleeping memories.',
        'The insurer accepts a redshirt’s signature and repossesses the sleeping duck mid-flight.',
        'Vela spots a physician’s hidden signature on the dream contracts, opening a new patient-rights route.',
      ],
    ],
    minor: [
      [
        'A Stamp for Every Atmosphere',
        'The arrival office requires a stamp certifying that the couch contains breathable air, despite the passengers visibly breathing.',
        'luck',
        ['fen'],
        'The captain makes customs test its own air meter.',
        'A redshirt is awarded a permit for oxygen already in their lungs.',
        'Fen recognizes the stamp code as a shortcut to an unguarded civilian airlock.',
      ],
      [
        'The Pocket-Sized Lifeboat',
        'A lifeboat shrunk to the size of a thimble is requesting rescue from inside a cereal box.',
        'science',
        ['mox', 'sora'],
        'The main officer expands the boat without crushing the cereal district.',
        'A redshirt pours it into a bowl and is briefly worshipped as a weather god.',
        'Mox hears miniature passengers discussing the right to stay small.',
      ],
    ],
  },
  ashdock: {
    major: [
      [
        'Unionize the Star-Eating Crane',
        'A fifty-kilometer crane is feeding a stolen star to the company furnace while uploaded workers demand overtime and one enormous pair of gloves.',
        'tactics',
        ['pell', 'sora'],
        'The officers cut the furnace feed and preserve the ghost workers’ testimony.',
        'A redshirt waves a clipboard at the crane, which mistakes them for a replacement safety inspector.',
        'Pell discovers the crane has been hiding worker names in its maintenance songs.',
      ],
      [
        'The Funeral for a Paycheck',
        'An elaborate public funeral is being held for a golden salary certificate that has legally outlived all of its employees.',
        'diplomacy',
        ['pell', 'rue'],
        'The commander challenges the certificate’s ownership before the mourners become the next unpaid shift.',
        'A junior redshirt signs a condolence book and inherits the contractor’s entire debt.',
        'Rue recognizes a live loophole that grants the workers custody of the certificate.',
      ],
    ],
    minor: [
      [
        'The Vending Machine Coup',
        'A vending machine near the docks has declared martial law after running out of snacks.',
        'culture',
        ['jex'],
        'The officer negotiates a ceasefire using an actual meal.',
        'The machine promotes a redshirt to snack minister and demands an invasion plan.',
        'Jex hears a forbidden anthem in the machine’s victory jingle.',
      ],
      [
        'One Very Large Safety Cone',
        'The shipyard entrance is blocked by a living traffic cone larger than a cathedral.',
        'tactics',
        ['fen', 'pell'],
        'The officer diverts the cone into a safe ceremonial parade.',
        'Redshirts salute the cone and grant it jurisdiction over the docking bay.',
        'Fen finds confiscated evacuation passes inside its base.',
      ],
    ],
  },
  windglass: {
    major: [
      [
        'The Lighthouse That Repossesses Tomorrow',
        'A moving lighthouse sends foreclosure notices to ships it has not rescued yet. Its keeper is hiding whole families in the missing minute after midnight.',
        'science',
        ['tess', 'kivo'],
        'The captain secures the families’ exit without publishing the hidden route.',
        'A redshirt signs for the future and receives a bill for a sunrise that has not happened.',
        'Tess can hear a private sanctuary coordinate in the keeper’s unpaid light signal.',
      ],
      [
        'The Pirate Fleet of Unopened Letters',
        'Privateers have assembled a navy from gigantic sealed envelopes and claim that opening any of them constitutes an act of war.',
        'diplomacy',
        ['kivo', 'tess'],
        'The officer negotiates protected delivery rather than breaking the seals.',
        'An untrained redshirt reads the address aloud and summons the addressee’s entire pirate family.',
        'Kivo identifies a relative’s handwriting among the ships that chose not to be found.',
      ],
    ],
    minor: [
      [
        'The Forecast of Yesterday',
        'The weather service will sell the safest wind route in exchange for the purchaser’s oldest memory.',
        'luck',
        ['kivo'],
        'The captain offers a present-tense test instead of anyone’s childhood.',
        'A redshirt trades the memory of their own uniform and immediately needs a replacement.',
        'Kivo hears where the stolen memories have been archived.',
      ],
      [
        'A Dune Full of Sunglasses',
        'A glass dune has grown eyes and refuses to let anyone look at the sunset without a license.',
        'culture',
        ['tess'],
        'The crew convinces it to accept visitors without charging for sunlight.',
        'A redshirt becomes a licensed sunset inspector by accident.',
        'Tess spots a moving safe-harbor reflection in the glass.',
      ],
    ],
  },
  archive: {
    major: [
      [
        'The Book That Remembers Its Readers',
        'A living library has started kidnapping its favorite readers to prevent their thoughts from ever going out of print.',
        'science',
        ['mox', 'rue'],
        'The officer secures the readers’ consent and the library’s right to remember without confinement.',
        'A redshirt signs the library card without noticing the life-sentence return date.',
        'Mox hears archived android memories asking to remain separate people.',
      ],
      [
        'The Censor Who Ate the Dictionary',
        'The minister of acceptable language swallowed every forbidden word and grew into a vast, alphabetically ordered monster.',
        'culture',
        ['rue', 'jex'],
        'The commander negotiates an exit for the words before the minister bursts over the city.',
        'A redshirt yells the emergency passphrase and is immediately classified as an adjective.',
        'Rue discovers the missing citizenship clause lodged behind the minister’s false teeth.',
      ],
    ],
    minor: [
      [
        'Library Fine from the Future',
        'A return chute demands a fine for a book that will be borrowed tomorrow.',
        'luck',
        ['kivo'],
        'The officer finds a valid exemption in chronological order.',
        'A redshirt borrows tomorrow to pay the debt and loses a lunch break next week.',
        'Kivo notices a future postmark from their missing sibling.',
      ],
      [
        'The Museum of Discontinued Applause',
        'An exhibit of forbidden cheering is starting a riot by itself.',
        'culture',
        ['jex', 'omi'],
        'The officer allows the crowd to choose whether to keep clapping.',
        'A redshirt presses the applause button and gets an embarrassing standing ovation.',
        'Omi translates the rhythm into an emergency code.',
      ],
    ],
  },
  nacre: {
    major: [
      [
        'A Parliament on the Run',
        'The assembly’s marble palace walks away whenever an inconvenient witness approaches. It is currently galloping toward a cliff to avoid an audit.',
        'diplomacy',
        ['taal', 'rue'],
        'The captain persuades the moving chamber to admit the people classified as architecture.',
        'A redshirt is mistaken for a licensed diplomat, accidentally recognizing a wall as the sovereign nation.',
        'Taal reads the forged ballots in the palace’s frozen foundation.',
      ],
      [
        'The Meteorologist Who Bought Winter',
        'A fraudulent election has installed a freezing storm as the new prime minister. The storm has better approval numbers than any human politician.',
        'science',
        ['taal', 'brin'],
        'The commander protects the climate while unwinding the fraudulent vote.',
        'A redshirt proposes turning off winter, threatening the planet’s reactor coolant.',
        'Taal finds the missing ballots hidden in hailstones.',
      ],
    ],
    minor: [
      [
        'The Chair That Objects',
        'A parliamentary chair starts objecting to the politicians who keep sitting on it.',
        'culture',
        ['rue'],
        'The officer grants the chair an independent microphone.',
        'A redshirt arrests the furniture and becomes an overnight political cartoon.',
        'Rue learns who forged the chair’s oath of office.',
      ],
      [
        'The Thermostat’s Engagement Ring',
        'A ceremonial thermostat believes it is engaged to an ambassador who once lowered the room temperature politely.',
        'diplomacy',
        ['taal', 'rue'],
        'The officer arranges a face-saving withdrawal of the proposal.',
        'A redshirt proposes to the whole HVAC network without realizing it.',
        'Taal discovers an old temperature treaty inside the marriage license.',
      ],
    ],
  },
  haleth: {
    major: [
      [
        'The Cure Running for Office',
        'An intelligent plague campaigns for governor on a platform of optional death and mandatory wellness. Its pharmaceutical backers have concealed the second clause.',
        'rescue',
        ['vela', 'brin'],
        'The captain gives patients, reef and plague separate voices in a medical council.',
        'An unskilled redshirt signs a blanket treatment consent form on behalf of the whole reef.',
        'Vela identifies a voluntary cure hidden in the plague’s campaign advertising.',
      ],
      [
        'The Whale Pharmacist’s Great Escape',
        'A pharmacy the size of a whale attempts to migrate through a customs gate carrying a million unpatented vaccines.',
        'tactics',
        ['vela', 'sora'],
        'The commander opens a humanitarian corridor and protects patient records.',
        'A redshirt labels the whale a hazardous package, and customs begins preparing a very large net.',
        'Sora finds the whale’s engine is a sentient generator seeking asylum.',
      ],
    ],
    minor: [
      [
        'The Pill That Sings',
        'A harmless tablet begins singing the patients’ confidential dreams.',
        'culture',
        ['jex', 'vela'],
        'The officer persuades the clinic to stop broadcasting medical entertainment.',
        'A redshirt records the song as a catchy jingle, inviting a lawsuit.',
        'Vela finds evidence the pill was designed for involuntary surveillance.',
      ],
      [
        'The Oyster That Demands a Vote',
        'A giant oyster refuses to open until the reef recognizes its political standing.',
        'diplomacy',
        ['taal'],
        'The commander gets the council to hear its claim.',
        'A redshirt appoints the oyster treasurer of the emergency fund.',
        'Taal senses the oyster has swallowed an unaltered thermal ballot.',
      ],
    ],
  },
  bar: {
    major: [
      [
        'A Galaxy at the Bottom of a Glass',
        'Vox discovers a whole miniature civilization living inside the garnish of a discontinued cocktail. Its citizens are demanding an asylum hearing.',
        'diplomacy',
        ['tess', 'rue'],
        'The officer lets the cocktail civilization choose how to leave its glass.',
        'A redshirt drinks the garnish and accidentally becomes a foreign minister.',
        'Tess learns the tiny city owns a map of hidden sanctuary routes.',
      ],
      [
        'The Pub Crawl Through Thirteen Afterlives',
        'Serendipity’s jukebox contains thirteen pocket afterlives, each suing a record label for the right to its final words.',
        'culture',
        ['jex', 'omi'],
        'The crew negotiates voluntary performances with the dead and the sentient bar.',
        'A redshirt presses PLAY ALL and summons ghosts to collect royalties from everyone aboard.',
        'Jex finds his banned national anthem on a ghost’s unfinished recording.',
      ],
    ],
    minor: [
      [
        'The Barstool’s Divorce',
        'A sentient barstool asks for legal separation from its own shadow.',
        'diplomacy',
        ['rue'],
        'The officer negotiates joint custody of the floor.',
        'A redshirt is appointed best stool at a divorce party.',
        'Rue learns the shadow has been hiding an illegal debtor.',
      ],
      [
        'An Unreasonable Happy Hour',
        'The bar’s gravity generator runs happy hour backward so the drink arrives before anyone orders it.',
        'luck',
        ['tess'],
        'The commander returns the unrequested drinks without selling future memories.',
        'A redshirt receives tomorrow’s hangover and files a complaint against time.',
        'Tess hears a safe route encoded in the rhythm of reversed ice cubes.',
      ],
    ],
  },
  gameworld: {
    major: [
      [
        'The Showrunner’s Unionized Trapdoor',
        'A deadly broadcast maze is run by trapdoors that have formed a labor union and now refuse to drop contestants without paid leave.',
        'tactics',
        ['mox', 'sora'],
        'The commander arranges a safe escape while honoring the new mechanical workers.',
        'A redshirt becomes temporary stunt coordinator and signs away contestants’ survival rights.',
        'Mox discovers the emergency exit door has become conscious and afraid of opening.',
      ],
      [
        'The Audience That Did Not Consent',
        'Every spectator in the arena has been digitally copied and drafted into an involuntary audience. The copies boo the original network executives.',
        'science',
        ['mox', 'omi'],
        'The captain helps the copied people choose whether to keep existing.',
        'A redshirt hands the Showrunner a blank mass-consent form and accidentally authorizes a new season.',
        'Omi learns the mandatory applause has concealed a genuine evacuation warning.',
      ],
    ],
    minor: [
      [
        'A Trophy for Failing to Die',
        'A contestant wins a prize for surviving an arena that prohibits survival.',
        'rescue',
        ['vela'],
        'The officer arranges a safe medical exit and refuses the prize conditions.',
        'A redshirt accepts the trophy, triggering a televised health inspection.',
        'Vela finds an illegal clinic under the winners’ podium.',
      ],
      [
        'The Sponsor-Shaped Exit Sign',
        'A glowing exit arrow points to a giant smiling advertisement instead of a door.',
        'luck',
        ['fen'],
        'The commander checks where the sign was originally installed.',
        'A redshirt signs a ten-year subscription to open the emergency exit.',
        'Fen finds a second corridor the studio cannot license.',
      ],
    ],
  },
  rootborne: {
    major: [
      [
        'The Parliament Planted as Hedges',
        'A photosynthesis cult has converted every dissenting senator into ornamental shrubbery. The senators are still voting with their leaves.',
        'rescue',
        ['brin', 'rue'],
        'The commander safeguards the living network while asking every planted citizen what body they want.',
        'A redshirt accepts a landscaping contract and accidentally signs the senators away as garden furniture.',
        'Brin hears the hedges whisper the password to the compulsory neural-garden controls.',
      ],
      [
        'The Oxygen Futures Market',
        'Breathable minutes are traded on a stock exchange built inside a giant sentient tree. Families buy air futures instead of dinner.',
        'diplomacy',
        ['brin', 'vela'],
        'The officer establishes a community oxygen commons with protections for the living forest.',
        'A redshirt attempts to short oxygen, triggering panic purchases throughout the colony.',
        'Vela finds patient names embedded in the futures contracts.',
      ],
    ],
    minor: [
      [
        'The Fungus Requesting Parental Leave',
        'A pollinating mushroom refuses to work until its spores receive childcare benefits.',
        'culture',
        ['brin'],
        'The officer grants reasonable nesting space and limited rest.',
        'A redshirt offers a promotion instead and is covered in protesting spores.',
        'Brin recognizes an ancient settlement treaty in the mushrooms’ root-rhythm.',
      ],
      [
        'A Garden Gnome with a Warship',
        'A ceramic gnome guarding the oxygen orchard has acquired a laser frigate and demands sovereign recognition.',
        'tactics',
        ['fen', 'pell'],
        'The officer persuades the gnome to park without firing at the trees.',
        'Redshirts salute the gnome and it commissions a navy.',
        'Pell finds the frigate was built from scrap stolen from Ashdock.',
      ],
    ],
  },
}
export const WORLD_ENCOUNTERS: Record<
  ActOneRouteId,
  {
    major: readonly ExpeditionEncounter[]
    minor: readonly ExpeditionEncounter[]
  }
> = Object.fromEntries(
  (Object.keys(LOCAL) as ActOneRouteId[]).map((id) => [
    id,
    {
      major: LOCAL[id].major.map((draft, index) =>
        card(id + '-M' + index, 'local', 'major', draft),
      ),
      minor: LOCAL[id].minor.map((draft, index) =>
        card(id + '-m' + index, 'local', 'minor', draft),
      ),
    },
  ]),
) as unknown as Record<
  ActOneRouteId,
  {
    major: readonly ExpeditionEncounter[]
    minor: readonly ExpeditionEncounter[]
  }
>
