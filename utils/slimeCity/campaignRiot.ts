// THE BEAUTIFUL CATASTROPHE: Anarkiss, the Anarkissed's glam midnight
// musical, told through a SAFETY / SPECTACLE meter. Safety keeps the audience
// (who are part of the show) out from under the explosions; spectacle makes
// the explosions bigger. Choices shape narrative callbacks, the real Solo
// Clash boss terms and two Story-only deck additions; nothing here pays Meat
// or grants cards. Follows the Ironjaw THE LAST SHIFT pattern.
import type { CampaignProgress, CampaignSave } from './campaign'
import type { BoutTerms } from './city'
import { CARDS } from './prototypes'
import { soloProblems } from './alliance'

export type RiotPick = 'left' | 'right'
export interface RiotChoice {
  id: RiotPick
  label: string
  outcome: string
}
export interface RiotBeat {
  id: string
  title: string
  speaker: string
  text: string
  choices: readonly [RiotChoice, RiotChoice]
}

export const RIOT_CHAPTERS: readonly (readonly RiotBeat[])[] = [
  // vs the Ironjaw Chrome Lizards: A SPARK IN THE SCRAP
  [
    {
      id: 'curfew-on-joy',
      title: 'CURFEW ON JOY',
      speaker: 'Saint Kaboom',
      text: 'The city has outlawed joy after ten in the evening. Worse, Ironjaw security has impounded the mobile stage, a flatbed with a pipe organ made of exhaust pipes, and parked it in the Foundry yard behind a fence of hot rivets.',
      choices: [
        {
          id: 'left',
          label: 'Ask the night shift to come watch rehearsal',
          outcome:
            'Saint Kaboom rehearses at the fence in fishnets and a hard hat. By midnight forty lizards are leaning on the rivets, humming along, and one of them has the gate key.',
        },
        {
          id: 'right',
          label: 'Fire a human cannonball over the fence',
          outcome:
            'Firebrand Dolly lands on the flatbed in a shower of glitter and drives it straight through the gate. Ironjaw security writes down the plate number of a stage.',
        },
      ],
    },
    {
      id: 'cold-audience',
      title: 'COLD AUDIENCE',
      speaker: 'Forewoman Rivet',
      text: 'Rivet likes the show, but her crew is cold-blooded and the Foundry yard freezes after dark. Lizards cannot dance when they are cold; half the front row has already gone stiff and sleepy in their seats.',
      choices: [
        {
          id: 'left',
          label: 'Spend the pyro budget on heat lamps for the crowd',
          outcome:
            'The fireworks shrink to sparklers, but every seat has a heat lamp. The lizards warm up, stand up and start stomping. Rivet says it is the best show she has ever been warm for.',
        },
        {
          id: 'right',
          label: 'Light the flame curtain ten feet from the front row',
          outcome:
            'A wall of fire roars up beside the stage and the lizards come alive all at once. Two of them get a little too close and their scales smell faintly of barbecue.',
        },
      ],
    },
    {
      id: 'welded-stage',
      title: 'A STAGE OF SCRAP',
      speaker: 'Forewoman Rivet',
      text: "Rivet's welders offer to build the parade a new stage from Foundry scrap, if the parade route passes the Foundry gate so the strikers can join. The scrap technically belongs to the Meat Exchange.",
      choices: [
        {
          id: 'left',
          label: 'Weld a stage that belongs to every block',
          outcome:
            'The new stage is wide, low and strong enough for anyone to climb onto. It has no owner stamped on it anywhere, and every neighborhood signs its name in the steel.',
        },
        {
          id: 'right',
          label: 'Weld rockets onto the stage itself',
          outcome:
            'The stage now has twelve rockets bolted under the deck. It is the most beautiful vehicle ever built in Slime City, and nobody is sure it is not a weapon.',
        },
      ],
    },
  ],
  // vs the Meat Exchange: FIREWORKS ON CREDIT
  [
    {
      id: 'interest-per-bang',
      title: 'INTEREST PER BANG',
      speaker: 'Auditor Prime Gilt',
      text: 'Auditor Prime Gilt arrives with a contract and a cart of fireworks. Unlimited powder for the festival, payable in Meat, with interest calculated per explosion. The fine print is very small and smells of smoked ham.',
      choices: [
        {
          id: 'left',
          label: 'Refuse the loan and make sparklers from kitchen grease',
          outcome:
            'The Anarkissed render a month of fryer grease into homemade sparklers. They sputter and stink, but nobody owes anybody a single cut of Meat for them.',
        },
        {
          id: 'right',
          label: 'Sign the contract and plan to blow up the ledger',
          outcome:
            'Saint Kaboom signs with a lit match. The powder is the best in the city, and somewhere in the Exchange a clerk starts counting every bang.',
        },
      ],
    },
    {
      id: 'meat-at-the-door',
      title: 'MEAT AT THE DOOR',
      speaker: 'Auditor Prime Gilt',
      text: 'The Exchange insists that admission be paid in Meat, one rib per seat, so the show stays respectable. The people who most need a night of joy are the ones queueing with empty hands and empty stomachs.',
      choices: [
        {
          id: 'left',
          label: 'Make the show free and feed the queue',
          outcome:
            'The doors come off their hinges and the Anarkissed serve soup in the lobby. The crowd is twice as big and three times as loud. Gilt notes the lost revenue in red ink.',
        },
        {
          id: 'right',
          label: 'Take the Meat and grill it in the pyrotechnics',
          outcome:
            'Every rib goes onto the flame curtain and comes back as dinner, served mid-song. It is a triumph of showmanship. The hungry are still outside, smelling it.',
        },
      ],
    },
    {
      id: 'confetti-vault',
      title: 'THE CONFETTI VAULT',
      speaker: 'Saint Kaboom',
      text: 'The Exchange vault on Crown Market holds every debt contract in the district. Saint Kaboom has a confetti cannon, a bad idea and the whole festival waiting in the square below.',
      choices: [
        {
          id: 'left',
          label: 'Invite the debtors on stage to tear up their own contracts',
          outcome:
            'One by one the debtors climb on stage and shred their own papers into the cannon. The confetti that falls over Crown Market is made of things nobody owes anymore.',
        },
        {
          id: 'right',
          label: 'Rig the vault to shower shredded ledgers over the market',
          outcome:
            'The vault door blows off with a perfect pop and a blizzard of ledgers buries the square. Some of those pages were the receipts proving people had already paid.',
        },
      ],
    },
  ],
  // vs Queen Pin & the Bloodfairies: MOSHPIT DIPLOMACY
  [
    {
      id: 'two-headliners',
      title: 'TWO HEADLINERS',
      speaker: 'Queen Safety Pin',
      text: 'Queen Pin and the Bloodfairies have arrived with their whole band and they want top billing. The Anarkissed already sold the closing slot to the Big Top Detonator, whose act is mostly a very large drum and a very large fuse.',
      choices: [
        {
          id: 'left',
          label: 'Share one stage and trade songs all night',
          outcome:
            'The two bands alternate song for song until neither remembers who closes. Queen Pin harmonizes with the drum. It works far better than anybody expected.',
        },
        {
          id: 'right',
          label: 'Build a second stage on top of the first',
          outcome:
            'A rickety second stage goes up on scaffolding above the first. Both bands play at once, very loudly, and the scaffolding sways in time.',
        },
      ],
    },
    {
      id: 'the-pit',
      title: 'THE PIT',
      speaker: 'Mx. Thimble Vex',
      text: 'The moshpit is crushing against the pyro rail, and bloodfairies are tiny. Thimble Vex reports three fairies pinned under boots already and a fourth singed on the rail. The crowd, of course, is part of the show.',
      choices: [
        {
          id: 'left',
          label: 'Pull the pyro rail back and lift the fairies onto shoulders',
          outcome:
            'The rail moves six feet back and every fairy rides on somebody bigger. The pit keeps moving, slower and kinder, with a canopy of tiny wings above it.',
        },
        {
          id: 'right',
          label: 'Turn the pit into a firewalk',
          outcome:
            'The floor is lined with glowing coals and the pit becomes a dare. The bravest dancers walk it barefoot. The fairies fly above it and hope nobody falls.',
        },
      ],
    },
    {
      id: 'amp-duel',
      title: 'BATTLE OF THE AMPLIFIERS',
      speaker: 'Mx. Thimble Vex',
      text: "Thimble Vex challenges Saint Kaboom to a battle of amplifiers: whoever's rig is louder at midnight takes the final song. The bloodfairy amps are stolen, cursed and hungry for current.",
      choices: [
        {
          id: 'left',
          label: 'Plug both bands into one shared rig',
          outcome:
            'Kaboom and Thimble wire their gear into one enormous shared stack. Nobody wins the duel. The final song is played by both bands and the audience at once.',
        },
        {
          id: 'right',
          label: 'Turn it up until a speaker catches fire',
          outcome:
            'The duel climbs past human hearing. A speaker cone bursts into flame and the crowd screams with joy. The windows on three streets will need replacing.',
        },
      ],
    },
  ],
  // vs Undertow Intelligence: THE PARADE IS A LIE
  [
    {
      id: 'false-map',
      title: 'THE FALSE MAP',
      speaker: 'The Drain Oracle',
      text: 'The Drain Oracle surfaces from a manhole wearing a sequined diving helmet. The parade map has been swapped: tonight the route leads straight into a police cordon waiting in silence at the end of Gutter Row.',
      choices: [
        {
          id: 'left',
          label: 'Walk the route ahead with lanterns and warn every crew',
          outcome:
            'Saint Kaboom walks the whole route with a lantern, knocking on every door. Each marching crew hears about the cordon in person and picks a safer street.',
        },
        {
          id: 'right',
          label: 'Print a thousand false maps of our own',
          outcome:
            'The Anarkissed flood the city with a thousand fake routes, all of them gorgeous. The police chase seven parades at once. So do several very lost marching bands.',
        },
      ],
    },
    {
      id: 'silent-sirens',
      title: 'SILENT SIRENS',
      speaker: 'Sister Sump',
      text: 'Sister Sump sells a warning: the cordon carries silent sirens, tuned below hearing, that make dancers lose the beat and wander off alone. A parade that loses its rhythm becomes a crowd that can be picked off.',
      choices: [
        {
          id: 'left',
          label: 'Teach the whole crowd to keep time with hand claps',
          outcome:
            "The parade practises clapping until it is one enormous heartbeat. The silent sirens hum, and nobody wanders. Sump admits she has never seen spies' tricks fail so politely.",
        },
        {
          id: 'right',
          label: "Drown the sirens with the Big Top Detonator's drum",
          outcome:
            'The Big Top Detonator beats the drum so hard the sirens shatter. The parade keeps the beat, and so does every window, chimney and loose tooth on Gutter Row.',
        },
      ],
    },
    {
      id: 'spies-in-sequins',
      title: 'SPIES IN SEQUINS',
      speaker: 'The Drain Oracle',
      text: 'Undertow agents have slipped into the costume line wearing corsets and glitter lipstick. The Drain Oracle can point them out, but some of them look like they are genuinely having a wonderful time.',
      choices: [
        {
          id: 'left',
          label: 'Invite the spies to march unmasked',
          outcome:
            'The spies take off their masks and keep their sequins. Two of them cry. The Undertow loses six agents and the parade gains six very good dancers.',
        },
        {
          id: 'right',
          label: 'Load the spies into the human cannonball act',
          outcome:
            'The spies are fired one by one into the harbor to thunderous applause. They swim home damp and humiliated, and the Undertow does not forget it.',
        },
      ],
    },
  ],
  // vs the Gene Riot Catgirls: GRAND FINALE, NO CASUALTIES
  [
    {
      id: 'clinic-under-the-launch',
      title: 'CLINIC UNDER THE LAUNCH',
      speaker: 'Dr. Calla Vane',
      text: 'Dr. Calla Vane runs up the stage stairs with a clipboard. The finale launch site sits directly over a basement clinic full of escaped catgirl clones, and the main rack of shells is pointed straight down through the roof.',
      choices: [
        {
          id: 'left',
          label: 'Move the whole show and carry the stage by hand',
          outcome:
            'Every performer and half the audience lift the stage and walk it four blocks east. It takes two hours. Vane and the clones watch the finale from their own roof.',
        },
        {
          id: 'right',
          label: 'Aim the finale over the corporate tower instead',
          outcome:
            'The rack swings round to point at the Exchange tower. The clinic is safe, the tower is about to be very bright, and Vane is not sure that was the lesson.',
        },
      ],
    },
    {
      id: 'the-last-cannonball',
      title: 'THE LAST CANNONBALL',
      speaker: 'Firebrand Dolly',
      text: 'Saint Kaboom wants to close the night as the human cannonball herself. Firebrand Dolly has packed the cannon with three times the usual powder, because a finale should be a finale. The net is very far away.',
      choices: [
        {
          id: 'left',
          label: 'Swap the powder for confetti and fly lower',
          outcome:
            'Kaboom launches in a soft pink cloud, lands in the net and bows. It is not the loudest moment of the night, but the whole crowd sees her get back up.',
        },
        {
          id: 'right',
          label: 'Light the full charge and trust the net',
          outcome:
            'Kaboom flies higher than any cannonball before her and overshoots the net into the canal. She surfaces waving. Dolly faints, then demands an encore.',
        },
      ],
    },
    {
      id: 'last-curtain',
      title: 'THE LAST CURTAIN',
      speaker: 'Saint Kaboom',
      text: 'At dawn the city council makes an offer: the festival becomes legal, official and ticketed, with a permanent stage in Crown Market and a very good insurance policy, if Anarkiss signs tonight. The whole audience is waiting.',
      choices: [
        {
          id: 'left',
          label: 'Let the audience vote to keep it free',
          outcome:
            'Saint Kaboom tears the council letter into confetti and lets the crowd decide. They vote to keep the festival free, unlicensed, and very carefully supervised.',
        },
        {
          id: 'right',
          label: 'Take the license and the biggest stage in the city',
          outcome:
            'Kaboom signs with a sparkler. Anarkiss gets a permanent stage, a budget and a lawyer. The first official show is the loudest Slime City has ever heard.',
        },
      ],
    },
  ],
] as const

/** SAFETY is an audience kept out from under the blast; SPECTACLE is a
 * bigger, wilder show. Neither is Meat or wallet money. */
export interface RiotShowLedger {
  safety: number
  spectacle: number
  stage: 'rehearsal' | 'opening-night' | 'grand-finale'
}
export function riotLedger(progress: CampaignProgress): RiotShowLedger {
  const picks = (progress.journey ?? []).flat()
  const safety = picks.filter((id) => id === 'left').length
  const spectacle = picks.filter((id) => id === 'right').length
  return {
    safety,
    spectacle,
    stage:
      picks.length >= 9
        ? 'grand-finale'
        : picks.length >= 3
          ? 'opening-night'
          : 'rehearsal',
  }
}
export function riotBeat(progress: CampaignProgress): RiotBeat | null {
  const beat = progress.journey?.[progress.wins]?.length ?? 0
  return RIOT_CHAPTERS[progress.wins]?.[beat] ?? null
}
export function riotSceneText(
  progress: CampaignProgress,
  beat: RiotBeat,
): string {
  const journal = progress.journey ?? []
  const lastChapter = progress.wins - 1
  const previous = journal[lastChapter]?.[2]
  const callback =
    lastChapter >= 0 && previous === 'left'
      ? [
          'The scrap stage rolls behind the parade with every neighborhood’s name welded into it. Lizards ride on the back, warm and waving.',
          'Confetti made of cancelled debts still drifts out of gutters on Crown Market. People keep a piece in their wallets for luck.',
          'Two bands now share one rig and one set list. Fairies ride on shoulders at the front of every crowd.',
          'Six former spies march in the sequin line, and the whole parade still claps one heartbeat together.',
        ][lastChapter]
      : lastChapter >= 0 && previous === 'right'
        ? [
            'The rocket stage idles at the head of the parade. Ironjaw security still has its plate number.',
            'Shredded ledgers blow down every street. Some people are free; some cannot prove they ever paid.',
            'Three streets of broken windows mark the route of the amp duel. The glaziers have never been happier.',
            'The Undertow agents who were fired into the harbor are still drying off, and still taking notes.',
          ][lastChapter]
        : null
  return (callback ? callback + ' ' : '') + beat.text
}
export function riotLastOutcome(progress: CampaignProgress): string | null {
  const beats = progress.journey?.[progress.wins] ?? []
  if (!beats.length) return null
  return (
    RIOT_CHAPTERS[progress.wins]?.[beats.length - 1]?.choices.find(
      (choice) => choice.id === beats[beats.length - 1],
    )?.outcome ?? null
  )
}
export function chooseRiotBeat(save: CampaignSave, id: RiotPick): CampaignSave {
  const progress = save.riot
  const beat = riotBeat(progress)
  if (!beat?.choices.some((choice) => choice.id === id)) return save
  const chapter = progress.wins
  const journey = Array.from({ length: chapter + 1 }, (_, i) =>
    i === chapter
      ? [...(progress.journey?.[i] ?? []), id]
      : [...(progress.journey?.[i] ?? [])],
  )
  return { ...save, riot: { ...progress, journey } }
}
/** Applied once a chapter's three beats are decided. Safety marshals keep
 * the crew's own line standing (player life, and an extra round once the
 * marshals are organised); spectacle fills the crew with mana but a show run
 * too wild burns some of its own performers. */
export function riotBattleTerms(
  progress: CampaignProgress,
  terms: BoutTerms,
): BoutTerms {
  if ((progress.journey?.[progress.wins]?.length ?? 0) !== 3) return terms
  const { safety, spectacle } = riotLedger(progress)
  const marshals = Math.min(3, Math.floor(safety / 3))
  const collateral = spectacle >= 9 ? 1 : 0
  return {
    ...terms,
    playerHp: (terms.playerHp ?? 0) + marshals - collateral,
    playerMana:
      (terms.playerMana ?? 0) + Math.min(3, Math.floor(spectacle / 3)),
    ...(safety >= 6 ? { rounds: (terms.rounds ?? 0) + 1 } : {}),
  }
}
export function riotEpilogue(progress: CampaignProgress): string {
  if (progress.wins !== 5) return ''
  const { safety, spectacle } = riotLedger(progress)
  const final = progress.journey?.[4]?.[2]
  if (safety >= 10 && final === 'left')
    return 'Every night after ten, somewhere in Slime City, Anarkiss throws a free festival nobody can charge admission to. Volunteer marshals in safety-orange fishnets count every head in and every head out. The emergency services come to dance.'
  if (spectacle >= 10 && final === 'right')
    return 'Anarkiss plays its licensed stage on Crown Market every night, louder each time. The insurance policy is forty pages long and Saint Kaboom has set fire to every copy. The city has never been brighter, or quite so singed.'
  return 'Some nights the festival is free and careful, some nights it is ticketed and enormous, and every night the Anarkissed argue about which. Nobody pays in Meat at the door anymore. The joy curfew is still on the books; nobody obeys it.'
}
export function validRiotJourney(progress: CampaignProgress): boolean {
  if (progress.journey === undefined) return true
  if (!Array.isArray(progress.journey) || progress.journey.length > 5)
    return false
  for (let i = 0; i < progress.journey.length; i++) {
    const picks = progress.journey[i]
    if (
      !Array.isArray(picks) ||
      picks.length > 3 ||
      picks.some((pick) => pick !== 'left' && pick !== 'right') ||
      (i > progress.wins && picks.length > 0) ||
      (i < progress.wins && picks.length !== 0 && picks.length !== 3)
    )
      return false
  }
  return true
}
/** The show's choices field real Anarkiss cards in the next STORY Clash:
 * a careful show brings the Audience Volunteer Sash, a wild one brings
 * Madame Blast Radius. Nothing is added to the player's collection. */
export function riotStoryDeck(
  progress: CampaignProgress,
  deck: string[],
): string[] {
  const { safety, spectacle } = riotLedger(progress)
  const additions = [
    ...(safety >= 3 ? ['s1-volunteer-vest'] : []),
    ...(spectacle >= 3 ? ['s1-blast-radius'] : []),
  ]
  const next = [...deck]
  for (const id of additions) {
    if (
      next.includes(id) ||
      !CARDS.some((card) => card.id === id && card.team === 'riot')
    )
      continue
    const protectedIds = new Set([...additions, ...(progress.rewards ?? [])])
    const slot = next.findLastIndex((cardId) => !protectedIds.has(cardId))
    if (slot >= 0) next[slot] = id
  }
  return soloProblems('riot', next).length ? deck : next
}
