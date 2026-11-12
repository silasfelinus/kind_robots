// THE BOOK OF FLESH: the Meat Exchange's story, told through a MERCY /
// APPETITE meter. Auditor Prime Gilt inherits a drowned butcher-priesthood
// whose oldest contract binds Slime City to the Thing That Hungers beneath
// Crown Market. Mercy tears pages out of the ledger and starves the Thing;
// appetite collects in its name and feeds it. Choices shape narrative
// callbacks, the real Solo Clash boss terms and two Story-only deck
// additions; nothing here pays Meat or grants cards. Follows the Undertow
// THE CITY THAT LISTENS pattern.
import type { EpilogueKey } from './campaignEpilogues'
import type { CampaignProgress, CampaignSave } from './campaign'
import type { BoutTerms } from './city'
import { CARDS } from './prototypes'
import { soloProblems } from './alliance'

export type ExchangePick = 'left' | 'right'
export interface ExchangeChoice {
  id: ExchangePick
  label: string
  outcome: string
}
export interface ExchangeBeat {
  id: string
  title: string
  speaker: string
  text: string
  choices: readonly [ExchangeChoice, ExchangeChoice]
}

export const EXCHANGE_CHAPTERS: readonly (readonly ExchangeBeat[])[] = [
  // vs Anarkiss: THE COST OF A BOOM
  [
    {
      id: 'the-inheritance',
      title: 'THE INHERITANCE',
      speaker: 'Paymaster Gristle',
      text: 'Auditor Prime Gilt descends the hook-lined stair under Crown Market to sign for her inheritance. At the bottom is a ledger bound in something that is still warm, and below the ledger, in the dark water, something very large breathes in time with the ink. Paymaster Gristle hands her the pen and does not meet her eyes.',
      choices: [
        {
          id: 'left',
          label: 'Sign in ink and read the first page aloud',
          outcome:
            'Gilt reads the oldest contract out loud, every clause, to the candles. The breathing below stops for a full minute. Gristle crosses himself with a cleaver. Nobody in the priesthood has ever read it before.',
        },
        {
          id: 'right',
          label: 'Sign in blood, as every heir has before',
          outcome:
            'One drop, the old way. The ledger drinks it, the water warms, and Gilt hears a voice like a full stomach say her name with real affection. The priesthood kneels. The candles lean toward her.',
        },
      ],
    },
    {
      id: 'the-burned-bank',
      title: 'THE BURNED BANK',
      speaker: 'Saint Kaboom',
      text: 'Anarkiss have blown up the bank that held the city’s unpaid medical bills, and the ash is drifting over the big top like confetti. Saint Kaboom is handing out sparklers. The debts are gone from the vault, but every page was copied long ago into the Book of Flesh, and the Thing remembers what it is owed.',
      choices: [
        {
          id: 'left',
          label: 'Tear the medical pages out of the Book in public',
          outcome:
            'Gilt rips the pages free in the middle of the circus ring and feeds them to a fire-eater. The crowd roars. Under Crown Market something groans like an empty belly, and Gristle goes very pale.',
        },
        {
          id: 'right',
          label: 'Insure the next explosion and collect on this one',
          outcome:
            'The priesthood bills the circus per bang, payable in Meat. Saint Kaboom pays in confetti, which the Exchange weighs and finds wanting. Butcher-acolytes start following the parade with hooks.',
        },
      ],
    },
    {
      id: 'the-encore-clause',
      title: 'THE ENCORE CLAUSE',
      speaker: 'Firebrand Dolly',
      text: 'Firebrand Dolly has found a clause in the circus’s old tent lease: the Exchange owns every encore ever performed under canvas. The Anarkissed have been unknowingly tithing applause to the Thing for twelve years, and tonight Dolly wants to know whether the new heir will keep taking it.',
      choices: [
        {
          id: 'left',
          label: 'Void the encore clause and give the applause back',
          outcome:
            'The next encore is the loudest the city has ever heard, and none of it goes down the drain. Dolly blows Gilt a kiss in greasepaint. Below the market, the candles gutter for an hour.',
        },
        {
          id: 'right',
          label: 'Enforce the clause and double the encores',
          outcome:
            'The circus plays three encores a night now, and the applause sinks through the floorboards into the dark. The Thing purrs. Dolly keeps performing, but she has stopped bowing.',
        },
      ],
    },
  ],
  // vs the Ironjaw Chrome Lizards: THE LABOR LIABILITY
  [
    {
      id: 'the-cold-furnace',
      title: 'THE COLD FURNACE',
      speaker: 'Forewoman Rivet',
      text: 'The Ironjaw are on strike, and their cold-blooded bodies are slowing in the unheated foundry. Forewoman Rivet stands at the gate with two hundred chrome-jawed lizards behind her. The Exchange claims the foundry, the furnaces and, according to page nine hundred, the heat inside the workers themselves.',
      choices: [
        {
          id: 'left',
          label: 'Relight the furnaces at the Exchange’s own cost',
          outcome:
            'Gilt pays for the coal out of the priesthood’s candle budget. The foundry glows again, the lizards warm up and stop shaking, and Rivet nods once, which from her is a standing ovation.',
        },
        {
          id: 'right',
          label: 'Rent them heat lamps by the hour',
          outcome:
            'Heat lamps arrive on a cart, metered, with a priest to read the meter. The workers stay warm enough to keep striking and cold enough to keep paying. The Thing likes the steady drip.',
        },
      ],
    },
    {
      id: 'the-master-switch',
      title: 'THE MASTER SWITCH',
      speaker: 'Dr. Calla Vane',
      text: 'Dr. Calla Vane brings Gilt a brass box with one lever. It is the master switch the old lab wired into every Ironjaw spine, and the Exchange holds the deed to it. One pull and the strike ends. Vane says the lever is warm to the touch, the way the ledger is warm.',
      choices: [
        {
          id: 'left',
          label: 'Hand the switch to Forewoman Rivet',
          outcome:
            'Rivet takes the box, walks it to the furnace and drops it in. The brass screams as it melts. Every lizard on the line flexes their jaw at once, a sound like a hundred locks opening.',
        },
        {
          id: 'right',
          label: 'Keep the switch in the vault, just in case',
          outcome:
            'The box goes into the vault under Crown Market, next to the ledger, where it hums faintly in time with the breathing below. The strike continues. Everybody knows exactly why it is so polite.',
        },
      ],
    },
    {
      id: 'shares-or-shackles',
      title: 'SHARES OR SHACKLES',
      speaker: 'Old Basker',
      text: 'Old Basker, the oldest lizard on the line, has sunned himself on the foundry roof for thirty years. He tells Gilt that the factory was never the Exchange’s to own; it was pledged to the Thing by a foreman who wanted a raise. He asks what a new heir intends to do with a debt older than she is.',
      choices: [
        {
          id: 'left',
          label: 'Give the workers controlling shares',
          outcome:
            'The Ironjaw own the foundry now. Old Basker gets the first share certificate and uses it as a sun visor. Below the market, an old page goes blank, and the water drops an inch.',
        },
        {
          id: 'right',
          label: 'Buy the foreman’s pledge and renew it',
          outcome:
            'The pledge is re-signed by candlelight and the foundry stays in the Book. Old Basker climbs back up to the roof and does not come down for a week. The furnaces run hot and the Thing runs fat.',
        },
      ],
    },
  ],
  // vs the Undertow: TRADE SECRETS
  [
    {
      id: 'the-forged-file',
      title: 'THE FORGED FILE',
      speaker: 'The Drain Oracle',
      text: 'The Drain Oracle rises from a storm grate in the chapel floor holding a waterproof file. Inside is proof that half the contracts in the Book of Flesh were forged by clerks who never existed, signed by debtors who never agreed. The Oracle offers it for a price, payable in Meat, of course.',
      choices: [
        {
          id: 'left',
          label: 'Pay and bring the forgeries to the public court',
          outcome:
            'The trial lasts nine days. Every forged contract is read aloud and struck out, and Crown Market neighbors cheer each one. The Book grows thinner. The breathing below grows louder and more irritable.',
        },
        {
          id: 'right',
          label: 'Buy the archive and seal it in the vault',
          outcome:
            'The file goes into a lead box beside the master switch. The forgeries stay binding, because nobody else can prove otherwise. The Oracle sinks back into the drains, wetter and richer and unimpressed.',
        },
      ],
    },
    {
      id: 'the-eaten-voices',
      title: 'THE EATEN VOICES',
      speaker: 'Sister Sump',
      text: 'Sister Sump of the Undertow has noticed that the butcher-priests sometimes speak in voices that do not belong to them. Debtors who could not pay in Meat paid in voices, and the priesthood wears them like aprons. She wants the voices back, and she has a microphone ready for each one.',
      choices: [
        {
          id: 'left',
          label: 'Return every voice the Exchange has collected',
          outcome:
            'One by one the priests open their mouths and the stolen voices pour out into Sister Sump’s microphones. Some of them have not spoken in decades. The first thing most of them say is a name.',
        },
        {
          id: 'right',
          label: 'Keep the voices on the books as collateral',
          outcome:
            'The priests keep talking in borrowed voices, and now Gilt can hear which ones belong to whom. It is useful at negotiations. It is terrible at dinner. Sister Sump starts recording everything.',
        },
      ],
    },
    {
      id: 'the-listening-tithe',
      title: 'THE LISTENING TITHE',
      speaker: 'The Drain Oracle',
      text: 'The Oracle makes a final offer: the Undertow will stop selling secrets about the Exchange if the Exchange stops pouring blood into the drains under Crown Market. The Oracle can hear the Thing feeding through every pipe in the city, and the frog troopers are having nightmares.',
      choices: [
        {
          id: 'left',
          label: 'Stop the blood tithe into the drains',
          outcome:
            'The drains run clear for the first time anyone can remember. The frog troopers sleep through the night. Under the market, the Thing tests the edges of its chamber, slowly, hungrily.',
        },
        {
          id: 'right',
          label: 'Pay the Undertow to stop listening instead',
          outcome:
            'The Exchange buys a quiet stretch of pipe and pours twice as much into it. The Oracle takes the Meat and covers its ears, mostly. The frog troopers start sleeping with the lights on.',
        },
      ],
    },
  ],
  // vs the Gene Riot Catgirls: THE VALUE OF A LIFE
  [
    {
      id: 'the-genetic-registry',
      title: 'THE GENETIC REGISTRY',
      speaker: 'Calico Nine',
      text: 'Calico Nine slams a claw onto the chapel altar. The Exchange holds the original genetic registry of every catgirl ever grown in Dr. Bell’s lab, each one listed as livestock, each one pledged to the Thing as a future meal. Forty of her sisters are outside, very quiet, holding torches.',
      choices: [
        {
          id: 'left',
          label: 'Void every ownership clause in the registry',
          outcome:
            'Gilt takes a carving knife to the registry and cuts every catgirl name free of the Book. Calico Nine watches each page fall. Outside, forty torches go out at once, and someone starts to purr.',
        },
        {
          id: 'right',
          label: 'Take the laboratory as collateral',
          outcome:
            'The registry stays, and the Exchange seizes Dr. Bell’s lab to secure it. Calico Nine leaves without a word. The torches stay lit outside Crown Market for three nights straight.',
        },
      ],
    },
    {
      id: 'the-bell-account',
      title: 'THE BELL ACCOUNT',
      speaker: 'Dr. Bell',
      text: 'Dr. Bell comes to the chapel in disguise to settle an old account. The lab was funded by the Exchange, and the payment was always meant to be in kind: every escaped catgirl recaptured and handed to the priesthood. Bell is ready to pay up, and wants Gilt to sign the receipt.',
      choices: [
        {
          id: 'left',
          label: 'Refuse the payment and expose the account',
          outcome:
            'Gilt nails the Bell account to the chapel door, where anyone can read it. Calico Nine reads it twice. Bell runs for the gate and finds the catgirls already waiting there, rather politely, to ask questions.',
        },
        {
          id: 'right',
          label: 'Accept the payment, on paper only',
          outcome:
            'The receipt is signed and the account closes on paper. No catgirls are handed over yet, but the Thing has noticed the entry. The ink on the receipt never quite dries.',
        },
      ],
    },
    {
      id: 'the-laser-and-the-ledger',
      title: 'THE LASER AND THE LEDGER',
      speaker: 'Calico Nine',
      text: 'The catgirls have broken into the vault and found the Book of Flesh. Calico Nine is holding a stolen laser pointer over the open ledger, ready to burn a hole through the catgirl pages and everything behind them. Below, in the water, the Thing has gone completely still.',
      choices: [
        {
          id: 'left',
          label: 'Let her burn the catgirl pages',
          outcome:
            'The laser cuts a neat red line through forty years of claims. The smoke smells like cat hair and old ham. Calico Nine shakes Gilt’s hand, and below the vault, something makes a sound like a stomach cramping.',
        },
        {
          id: 'right',
          label: 'Trade her a copy of the pages for the laser',
          outcome:
            'Calico Nine gets a copy of every catgirl page to burn, and Gilt gets the laser. The original Book stays whole. The catgirls burn the copy on the market steps, and the Thing watches from beneath, patient.',
        },
      ],
    },
  ],
  // vs Queen Pin and the Bloodfairies: THE FINAL AUDIT
  [
    {
      id: 'the-stolen-seal',
      title: 'THE STOLEN SEAL',
      speaker: 'Queen Safety Pin',
      text: 'Queen Pin and the Bloodfairies have stolen the Exchange’s gold seal and are stamping VOID on every rooftop debt in the district between songs. Without the seal, no new contract binds. With it, the fairies could cancel the Book of Flesh itself, and the Thing beneath Crown Market knows it.',
      choices: [
        {
          id: 'left',
          label: 'Let the debtors vote on what the seal stamps next',
          outcome:
            'A ballot box goes up on the roof of the tour bus. The debtors vote by the thousand, mostly for VOID. Queen Pin keeps the seal on a safety pin around her neck and plays a song about it.',
        },
        {
          id: 'right',
          label: 'Repossess the rooftops and the seal with them',
          outcome:
            'Butcher-acolytes climb every fire escape with hooks and a writ. The fairies scatter, the seal comes home in a velvet box, and the rooftops belong to the Exchange again. The Thing hums a little tune.',
        },
      ],
    },
    {
      id: 'the-last-tithe',
      title: 'THE LAST TITHE',
      speaker: 'Mx. Thimble Vex',
      text: 'Mx. Thimble Vex has found the Exchange’s final invoice: on the next new moon, the oldest contract falls due, and Slime City itself is the payment. Every street, every crew, every Meat coupon in every pocket. Vex wants to know whether Gilt is the auditor or the collector.',
      choices: [
        {
          id: 'left',
          label: 'Tell the whole city what the invoice says',
          outcome:
            'Vex and Gilt paste the invoice on every wall from Crown Market to the docks. The city reads it, swears, and starts organizing. The Thing hears a million people refusing at once and coils tighter.',
        },
        {
          id: 'right',
          label: 'Negotiate a smaller payment in secret',
          outcome:
            'Gilt goes down the stair alone and haggles with the dark. One district instead of the whole city, perhaps. The Thing is a patient creditor. Vex follows her as far as the stair and goes no further.',
        },
      ],
    },
    {
      id: 'the-closing-of-the-book',
      title: 'THE CLOSING OF THE BOOK',
      speaker: 'Auditor Prime Gilt',
      text: 'The new moon rises over Crown Market. The Book of Flesh lies open on the altar, the water below the chapel boils with something enormous and awake, and every crew in the city has come to watch. Gilt holds the pen. The final page is blank, and whatever she writes there will be binding forever.',
      choices: [
        {
          id: 'left',
          label: 'Write PAID IN FULL and close the Book forever',
          outcome:
            'Gilt writes three words, the ink turns gold, and the Book of Flesh slams shut on its own. The water goes still. Far below, something enormous sinks back into a sleep it will not wake from on credit again.',
        },
        {
          id: 'right',
          label: 'Write her own name as the new collector',
          outcome:
            'Gilt signs, and the Thing that Hungers rolls over in the dark and goes quiet, satisfied. The city survives the new moon. The Exchange has a new high priest, and everybody owes her something now.',
        },
      ],
    },
  ],
] as const

/** MERCY is what Gilt tears out of the Book of Flesh; APPETITE is what she
 * collects in the Thing's name. Neither is Meat or wallet money. */
export interface ExchangeAppetiteLedger {
  mercy: number
  appetite: number
  rite: 'candle' | 'tithe' | 'reckoning'
}
export function exchangeLedger(
  progress: CampaignProgress,
): ExchangeAppetiteLedger {
  const picks = (progress.journey ?? []).flat()
  const mercy = picks.filter((id) => id === 'left').length
  const appetite = picks.filter((id) => id === 'right').length
  return {
    mercy,
    appetite,
    rite:
      picks.length >= 9 ? 'reckoning' : picks.length >= 3 ? 'tithe' : 'candle',
  }
}
export function exchangeBeat(progress: CampaignProgress): ExchangeBeat | null {
  const beat = progress.journey?.[progress.wins]?.length ?? 0
  return EXCHANGE_CHAPTERS[progress.wins]?.[beat] ?? null
}
export function exchangeSceneText(
  progress: CampaignProgress,
  beat: ExchangeBeat,
): string {
  const journal = progress.journey ?? []
  const lastChapter = progress.wins - 1
  const previous = journal[lastChapter]?.[2]
  const callback =
    lastChapter >= 0 && previous === 'left'
      ? [
          'Anarkiss still close every show with a free encore and a rude song about the Book of Flesh. Gilt has started to hum along.',
          'The foundry glows all night now, and the Ironjaw run it themselves. Below the market the water has dropped another inch.',
          'The drains under Crown Market run clear. The frog troopers wave at Gilt when she passes, which is new.',
          'Catgirls leave a dead fish on the chapel steps every morning. It is, Calico Nine insists, a thank-you.',
        ][lastChapter]
      : lastChapter >= 0 && previous === 'right'
        ? [
            'Butcher-acolytes still trail the circus parade with hooks and meters. Every encore sinks into the floor.',
            'The master switch hums in the vault beside the ledger. The Ironjaw work politely and never sing.',
            'The lead box of forgeries sits sealed in the dark, and the drains under Crown Market still run red.',
            'A copy of the catgirl registry is ash on the market steps, but the original sits whole on the altar.',
          ][lastChapter]
        : null
  return (callback ? callback + ' ' : '') + beat.text
}
export function exchangeLastOutcome(progress: CampaignProgress): string | null {
  const beats = progress.journey?.[progress.wins] ?? []
  if (!beats.length) return null
  return (
    EXCHANGE_CHAPTERS[progress.wins]?.[beats.length - 1]?.choices.find(
      (choice) => choice.id === beats[beats.length - 1],
    )?.outcome ?? null
  )
}
export function chooseExchangeBeat(
  save: CampaignSave,
  id: ExchangePick,
): CampaignSave {
  const progress = save.exchange
  const beat = exchangeBeat(progress)
  if (!beat?.choices.some((choice) => choice.id === id)) return save
  const chapter = progress.wins
  const journey = Array.from({ length: chapter + 1 }, (_, i) =>
    i === chapter
      ? [...(progress.journey?.[i] ?? []), id]
      : [...(progress.journey?.[i] ?? [])],
  )
  return { ...save, exchange: { ...progress, journey } }
}
/** Applied once a chapter's three beats are decided. Mercy shrinks the
 * Thing's grip on the rival (their boss starts weaker, and enough forgiven
 * debt walks one rival collector off the field); appetite feeds the crew mana
 * from the Book, but the Thing collects from both sides of the table, so the
 * rival's mana grows too once the hunger is fully fed. */
export function exchangeBattleTerms(
  progress: CampaignProgress,
  terms: BoutTerms,
): BoutTerms {
  if ((progress.journey?.[progress.wins]?.length ?? 0) !== 3) return terms
  const { mercy, appetite } = exchangeLedger(progress)
  return {
    ...terms,
    enemyBossLife:
      (terms.enemyBossLife ?? 0) - Math.min(3, Math.floor(mercy / 3)),
    playerMana: (terms.playerMana ?? 0) + Math.min(3, Math.floor(appetite / 3)),
    ...(mercy >= 6 ? { fewerRivals: (terms.fewerRivals ?? 0) + 1 } : {}),
    ...(appetite >= 9 ? { enemyMana: (terms.enemyMana ?? 0) + 1 } : {}),
  }
}
/** The crew journey's three authored endings (slime-city/t-059). */
export const EXCHANGE_EPILOGUES: Record<EpilogueKey, string> = {
  left: 'The Book of Flesh is shut, and the stair under Crown Market is bricked over with gold. Meat is just meat again: you can eat it, trade it or throw it at a parade, and nobody below is counting. Gilt keeps the books for the city now, in ordinary ink.',
  right:
    'The Thing That Hungers sleeps well fed beneath Crown Market, and High Priestess Gilt keeps it that way. Every debt in Slime City is collected on time. The city is safe, prosperous and very, very polite to anyone wearing an apron.',
  mixed:
    'Some pages of the Book are torn out and some are still binding, and Gilt visits the stair once a month to renegotiate. The Thing is hungry, but not starving. The city owes less than it did, and knows exactly to whom.',
}

export function exchangeEpilogueKey(
  progress: CampaignProgress,
): EpilogueKey | null {
  if (progress.wins !== 5) return null
  const { mercy, appetite } = exchangeLedger(progress)
  const final = progress.journey?.[4]?.[2]
  if (mercy >= 10 && final === 'left') return 'left'
  if (appetite >= 10 && final === 'right') return 'right'
  return 'mixed'
}

export function exchangeEpilogue(progress: CampaignProgress): string {
  const key = exchangeEpilogueKey(progress)
  return key ? EXCHANGE_EPILOGUES[key] : ''
}
export function validExchangeJourney(progress: CampaignProgress): boolean {
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
/** The rite's choices field real Exchange cards in the next STORY Clash:
 * mercy brings The Thirty-Seventh Page, appetite brings the Call of the
 * Tithe. Nothing is added to the player's collection. */
export function exchangeStoryDeck(
  progress: CampaignProgress,
  deck: string[],
): string[] {
  const { mercy, appetite } = exchangeLedger(progress)
  const additions = [
    ...(mercy >= 3 ? ['s2-exchange-contract-amendment'] : []),
    ...(appetite >= 3 ? ['s1-margin-call'] : []),
  ]
  const next = [...deck]
  for (const id of additions) {
    if (
      next.includes(id) ||
      !CARDS.some((card) => card.id === id && card.team === 'exchange')
    )
      continue
    const protectedIds = new Set([...additions, ...(progress.rewards ?? [])])
    const slot = next.findLastIndex((cardId) => !protectedIds.has(cardId))
    if (slot >= 0) next[slot] = id
  }
  return soloProblems('exchange', next).length ? deck : next
}
