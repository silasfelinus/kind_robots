// THE LAST SHIFT: the Ironjaw Chrome Lizards' strike, told through a
// SOLIDARITY / HEAT meter. Cold-blooded workers warm up as the strike grows:
// solidarity keeps everyone on the same warm floor, heat burns hot and fast.
// Choices shape narrative callbacks, the real Solo Clash boss terms and two
// Story-only deck additions; nothing here pays Meat or grants cards.
// Silas, 2026-11-09 PT: "we should have lizard people instead of orcs ... we
// need to lean into the world. We exchange meat, for chrissakes."
import type { CampaignProgress, CampaignSave } from './campaign'
import type { BoutTerms } from './city'
import { CARDS } from './prototypes'
import { soloProblems } from './alliance'

export type IronjawPick = 'left' | 'right'
export interface IronjawChoice {
  id: IronjawPick
  label: string
  outcome: string
}
export interface IronjawBeat {
  id: string
  title: string
  speaker: string
  text: string
  choices: readonly [IronjawChoice, IronjawChoice]
}

export const IRONJAW_CHAPTERS: readonly (readonly IronjawBeat[])[] = [
  // vs the Meat Exchange: THE COMPANY STORE
  [
    {
      id: 'cold-start',
      title: 'COLD START',
      speaker: 'Forewoman Rivet',
      text: 'The Exchange has cut the furnaces to half to save Meat. Cold-blooded workers are slowing down on the night shift; two have fallen asleep standing at the press. Paymaster Gristle offers heat lamps, rented by the hour, payable in Meat.',
      choices: [
        {
          id: 'left',
          label: 'Everyone basks on the one working furnace',
          outcome:
            'The whole shift crowds onto the last warm furnace, tail to tail. Nobody works fast, but nobody freezes, and for the first time every worker is in the same room.',
        },
        {
          id: 'right',
          label: "Hot-wire the payroll office's heaters",
          outcome:
            "Rivet's crew strips the paymaster's office heaters and wires them into the line. The shift warms up fast. Gristle notes every missing coil in his ledger.",
        },
      ],
    },
    {
      id: 'paid-in-coupons',
      title: 'PAID IN COUPONS',
      speaker: 'Paymaster Gristle',
      text: "Wages arrive in Meat coupons that only work at the company store, where a single steak costs a week of shifts. Gristle smiles with every gold tooth: 'Nobody is forcing you to eat.'",
      choices: [
        {
          id: 'left',
          label: 'Pool the coupons into a free canteen',
          outcome:
            'The crew pools every coupon and opens a canteen on the loading dock. The portions are small, but the oldest workers eat first and nobody is shamed for an empty pocket.',
        },
        {
          id: 'right',
          label: 'Counterfeit Meat coupons on the foundry press',
          outcome:
            'The foundry press stamps out ten thousand perfect coupons overnight. The company store runs out of steak by noon, and the Exchange sends auditors with very sharp knives.',
        },
      ],
    },
    {
      id: 'the-company-store',
      title: 'THE COMPANY STORE',
      speaker: 'Old Basker',
      text: 'Old Basker has napped on the same furnace for forty years and remembers the last strike. He asks for the vote to happen on the store floor, under the price board, where the Exchange has to watch.',
      choices: [
        {
          id: 'left',
          label: 'Hold the vote where everyone can hear',
          outcome:
            'The vote is slow and loud, and it passes. The price board is turned to face the wall. Gristle walks out past five hundred raised claws.',
        },
        {
          id: 'right',
          label: 'Seize the meat lockers before the vote',
          outcome:
            'The lockers are taken in four minutes flat. The strike has food for a month, but half the shift heard about the vote only after it was over.',
        },
      ],
    },
  ],
  // vs Undertow Intelligence: GHOST IN THE SHIFT CLOCK
  [
    {
      id: 'six-lost-years',
      title: 'SIX LOST YEARS',
      speaker: 'Sister Sump',
      text: 'An Undertow informant surfaces in the cooling tank. Sister Sump has the real time records: the shift clock was rewritten, and every lizard on the line has worked six unpaid years. She will sell the records for the strike fund.',
      choices: [
        {
          id: 'left',
          label: 'Read every worker their own record aloud',
          outcome:
            'Rivet reads the stolen years name by name until her voice goes. Sump leaves without her payment, but takes one copy for herself.',
        },
        {
          id: 'right',
          label: 'Buy the records with the strike fund',
          outcome:
            'The records are in hand by morning. The strike fund is empty, and Sump now knows exactly how desperate the crew is.',
        },
      ],
    },
    {
      id: 'shed-skins',
      title: 'SHED SKINS',
      speaker: 'Forewoman Rivet',
      text: 'Lizards shed. The Exchange has been collecting every shed skin from the locker rooms and filing them as identity papers, so it can track any worker anywhere in the city by the pattern of their scales.',
      choices: [
        {
          id: 'left',
          label: 'Burn the skin archive together',
          outcome:
            'Every worker drops a match on the archive. The smoke smells terrible and wonderful. Nobody in the Foundry can be tracked by their own skin again.',
        },
        {
          id: 'right',
          label: 'Plant false skins to confuse the trackers',
          outcome:
            "The crew swaps a thousand skins between files. The Exchange's trackers chase ghosts across the city, and so do a few confused workers' mothers.",
        },
      ],
    },
    {
      id: 'the-clock-strikes-work',
      title: 'THE CLOCK STRIKES WORK',
      speaker: 'Old Basker',
      text: 'The shift clock tower still runs on the stolen time. Old Basker can climb it, slowly. Undertow divers are already in the drains, ready to erase the evidence.',
      choices: [
        {
          id: 'left',
          label: 'Stop the clock and send everyone home on time',
          outcome:
            'The hands freeze at quitting time. For one night the whole Foundry goes home together, and the stolen years become a public record.',
        },
        {
          id: 'right',
          label: 'Run the clock backwards to bill the Exchange',
          outcome:
            'The clock spins backwards and prints an invoice for six years of overtime. The Exchange refuses to pay it, but it is very large and very public.',
        },
      ],
    },
  ],
  // vs Anarkiss: SAFETY THIRD
  [
    {
      id: 'fire-drill',
      title: 'FIRE DRILL',
      speaker: 'Firebrand Dolly',
      text: "Anarkiss pyro-showgirl Firebrand Dolly offers to blow up the foreman's office for free. 'Safety third,' she says. The night shift is still asleep in the break room next door.",
      choices: [
        {
          id: 'left',
          label: 'Evacuate the night shift first',
          outcome:
            'Rivet wakes every sleeper and carries the slowest out on her back. The blast is late and smaller than Dolly wanted. Nobody is under it.',
        },
        {
          id: 'right',
          label: 'Let Dolly light the fuse now',
          outcome:
            "The office goes up in a beautiful orange cloud. The night shift wakes up very fast and very angry, and the bosses' locks are gone.",
        },
      ],
    },
    {
      id: 'warm-floor',
      title: 'WARM FLOOR, HOT TEMPERS',
      speaker: 'Forewoman Rivet',
      text: 'The explosions have heated the factory floor. For cold-blooded workers it feels like summer: everyone is fast, strong and ready to charge. It is also how lizards cook.',
      choices: [
        {
          id: 'left',
          label: 'Cool the floor so nobody cooks',
          outcome:
            'The crew floods the floor with coolant. Everyone slows back down, a little sulky. Nobody collapses from the heat.',
        },
        {
          id: 'right',
          label: 'Crank the heat and charge while it lasts',
          outcome:
            "The crew charges the Saints' line at full summer speed and breaks it. Three workers collapse afterwards and spend the night in the cold room.",
        },
      ],
    },
    {
      id: 'emergency-controls',
      title: 'EMERGENCY CONTROLS',
      speaker: 'Firebrand Dolly',
      text: 'The furnace emergency controls were in the office Dolly wants to blow up next. Without them the furnace cannot be stopped, by the strike or by the Exchange.',
      choices: [
        {
          id: 'left',
          label: 'Secure the emergency controls first',
          outcome:
            'The controls are carried out in a wheelbarrow before the second blast. Dolly calls it boring. The forge can still be turned off by the people who work it.',
        },
        {
          id: 'right',
          label: 'Blow through the locked blast doors',
          outcome:
            'The doors fly open and so does the furnace. It roars without a switch now, and the crew has to take shifts just watching it.',
        },
      ],
    },
  ],
  // vs the Gene Riot Catgirls: LIVING BLUEPRINT
  [
    {
      id: 'stolen-tails',
      title: 'STOLEN TAILS',
      speaker: 'Dr. Calla Vane',
      text: "Lizards regrow their tails. Gene Riot technician Dr. Calla Vane has found out where the Foundry's growth serum comes from: the Exchange has been harvesting every dropped tail and boiling it down in the lab that bred the crew.",
      choices: [
        {
          id: 'left',
          label: 'Share the harvest records with the clones',
          outcome:
            'Vane and Rivet publish the records together. Catgirl clones and lizard workers find their own tissue in the same catalogue, and start comparing notes.',
        },
        {
          id: 'right',
          label: 'Take the regeneration serum for the crew',
          outcome:
            'The crew drinks the serum and every lost tail grows back overnight, longer and stronger. Vane wanted it for the clones.',
        },
      ],
    },
    {
      id: 'two-unions',
      title: 'TWO UNIONS, ONE LAB',
      speaker: 'Dr. Calla Vane',
      text: "The clone engineers who brew the lizards' growth serum want to join the union. Some old workers say a union of lizards should stay lizards.",
      choices: [
        {
          id: 'left',
          label: 'Give the clone engineers a vote',
          outcome:
            'The union card gets a second paw print. The first joint meeting runs four hours over and ends with a shared lab notebook.',
        },
        {
          id: 'right',
          label: 'Promise them a vote after the strike',
          outcome:
            'The engineers keep working, for now. Vane writes the promise on the wall in very large letters so nobody can forget it.',
        },
      ],
    },
    {
      id: 'the-scanner',
      title: 'THE PROTOTYPE SCANNER',
      speaker: 'Forewoman Rivet',
      text: "The lab's prototype scanner can read the gene tag under any lizard's scales and show which lab still claims to own them. The Exchange wants it back before morning.",
      choices: [
        {
          id: 'left',
          label: 'Make the serum formulas common property',
          outcome:
            'Every serum formula is copied to every locker. The scanner stays in the lab, and the lab now belongs to everyone who works in it.',
        },
        {
          id: 'right',
          label: 'Steal the prototype scanner',
          outcome:
            "The scanner rides home in Rivet's lunch pail. The crew can read the Exchange's patents now, and the lab is very angry at both sides.",
        },
      ],
    },
  ],
  // vs Queen Pin & the Bloodfairies: THE FACTORY SINGS
  [
    {
      id: 'band-in-the-rafters',
      title: 'BAND IN THE RAFTERS',
      speaker: 'Queen Safety Pin',
      text: 'Queen Pin and the Bloodfairies have set up their whole band in the forge rafters. They will not let the line restart until every worker is counted, including the tiny fairy welders the Exchange never put on the payroll.',
      choices: [
        {
          id: 'left',
          label: 'Count every worker, even the smallest',
          outcome:
            'The roll call takes all night. Two hundred fairy welders sign the union book with very small pens. The band plays a slow song for the count.',
        },
        {
          id: 'right',
          label: "Cut the power to the band's amps",
          outcome:
            'The amps go dark and the line can restart. Queen Pin climbs down without a word, and half the rafters empty with her.',
        },
      ],
    },
    {
      id: 'the-shift-song',
      title: 'THE SHIFT SONG',
      speaker: 'Queen Safety Pin',
      text: 'Queen Pin offers to play the strike anthem live when the forge restarts. Old Basker wants the old whistle instead: one long note, the way it has always been.',
      choices: [
        {
          id: 'left',
          label: 'Restart the forge to the band',
          outcome:
            'The forge lights to a three-chord anthem. The lizards stomp in time on the warm floor. Old Basker pretends to hate it and taps his tail.',
        },
        {
          id: 'right',
          label: 'Restart to the whistle, on schedule',
          outcome:
            'One long note, exactly on time. The line starts perfectly. The band packs up and plays the anthem somewhere else.',
        },
      ],
    },
    {
      id: 'the-last-shift',
      title: 'THE LAST SHIFT',
      speaker: 'Forewoman Rivet',
      text: 'The Exchange has one offer left: Rivet can have the master switch and run the Foundry herself, if the strike ends tonight. The assembly is waiting on the warm floor.',
      choices: [
        {
          id: 'left',
          label: 'Let the assembly decide who runs the forge',
          outcome:
            'Rivet puts the switch on the floor in front of everyone. The vote is long, warm and loud. The Foundry decides to run itself.',
        },
        {
          id: 'right',
          label: 'Rivet takes the master switch',
          outcome:
            'Rivet takes the switch and ends the strike in one night. The Foundry is hers now, and every worker watches what she does with it.',
        },
      ],
    },
  ],
] as const

/** SOLIDARITY is every worker kept on the same warm floor; HEAT is quick
 * power that burns the crew. Neither is Meat or wallet money. */
export interface ShiftLedger {
  solidarity: number
  heat: number
  stage: 'cold' | 'basking' | 'molten'
}
export function ironjawLedger(progress: CampaignProgress): ShiftLedger {
  const picks = (progress.journey ?? []).flat()
  const solidarity = picks.filter((id) => id === 'left').length
  const heat = picks.filter((id) => id === 'right').length
  return {
    solidarity,
    heat,
    stage:
      picks.length >= 9 ? 'molten' : picks.length >= 3 ? 'basking' : 'cold',
  }
}
export function ironjawBeat(progress: CampaignProgress): IronjawBeat | null {
  const beat = progress.journey?.[progress.wins]?.length ?? 0
  return IRONJAW_CHAPTERS[progress.wins]?.[beat] ?? null
}
export function ironjawSceneText(
  progress: CampaignProgress,
  beat: IronjawBeat,
): string {
  const journal = progress.journey ?? []
  const lastChapter = progress.wins - 1
  const previous = journal[lastChapter]?.[2]
  const callback =
    lastChapter >= 0 && previous === 'left'
      ? [
          'Gristle is gone, but the canteen on the loading dock is still open. Old Basker saves the warmest spot for whoever arrives last.',
          'The stopped clock still reads quitting time. Workers set their lunches by it.',
          'The emergency controls sit in a wheelbarrow by the door, where anybody can reach them.',
          'The shared lab notebook has two kinds of paw prints on every page.',
        ][lastChapter]
      : lastChapter >= 0 && previous === 'right'
        ? [
            'The meat lockers are full and guarded. Some workers ask who holds the keys.',
            'The giant invoice is pinned to the clock tower. Nobody has paid it, and nobody has forgotten it.',
            'The furnace still roars without a switch. Someone is always awake to watch it.',
            "The scanner hums in Rivet's lunch pail. The lab has stopped answering the crew's messages.",
          ][lastChapter]
        : null
  return (callback ? callback + ' ' : '') + beat.text
}
export function ironjawLastOutcome(progress: CampaignProgress): string | null {
  const beats = progress.journey?.[progress.wins] ?? []
  if (!beats.length) return null
  return (
    IRONJAW_CHAPTERS[progress.wins]?.[beats.length - 1]?.choices.find(
      (choice) => choice.id === beats[beats.length - 1],
    )?.outcome ?? null
  )
}
export function chooseIronjawBeat(
  save: CampaignSave,
  id: IronjawPick,
): CampaignSave {
  const progress = save.ironjaw
  const beat = ironjawBeat(progress)
  if (!beat?.choices.some((choice) => choice.id === id)) return save
  const chapter = progress.wins
  const journey = Array.from({ length: chapter + 1 }, (_, i) =>
    i === chapter
      ? [...(progress.journey?.[i] ?? []), id]
      : [...(progress.journey?.[i] ?? [])],
  )
  return { ...save, ironjaw: { ...progress, journey } }
}
/** Applied once a chapter's three beats are decided. Solidarity keeps the
 * crew's own line alive (player life); heat melts the rival's plating
 * (enemy armor) but a crew run too hot loses some of its own life. */
export function ironjawBattleTerms(
  progress: CampaignProgress,
  terms: BoutTerms,
): BoutTerms {
  if ((progress.journey?.[progress.wins]?.length ?? 0) !== 3) return terms
  const { solidarity, heat } = ironjawLedger(progress)
  const self =
    Math.min(4, Math.floor(solidarity / 2)) - Math.min(2, Math.floor(heat / 5))
  const melt = -Math.min(4, Math.floor(heat / 2))
  return {
    ...terms,
    playerHp: (terms.playerHp ?? 0) + self,
    enemyArmor: (terms.enemyArmor ?? 0) + melt,
  }
}
export function ironjawEpilogue(progress: CampaignProgress): string {
  if (progress.wins !== 5) return ''
  const { solidarity, heat } = ironjawLedger(progress)
  const final = progress.journey?.[4]?.[2]
  if (solidarity >= 10 && final === 'left')
    return 'The Foundry runs itself. Every shift ends with the whole crew basking on the same warm floor, and the clock still stops at quitting time. The company store is a canteen now. Steak is free on Fridays.'
  if (heat >= 10 && final === 'right')
    return 'Rivet keeps the master switch on her belt. The Foundry is hotter and faster than it has ever been. Old Basker still naps on his furnace, one eye open, watching the switch.'
  return 'Some shifts vote, some shifts follow Rivet, and every shift argues about it over lunch. The Meat is fairly weighed now. Nobody is sure yet what else is.'
}
export function validIronjawJourney(progress: CampaignProgress): boolean {
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
/** The strike's choices field real Ironjaw cards in the next STORY Clash:
 * a solidarity crew brings the Union Bridgebearer, a hot crew brings the
 * Walking Foundry. Nothing is added to the player's collection. */
export function ironjawStoryDeck(
  progress: CampaignProgress,
  deck: string[],
): string[] {
  const { solidarity, heat } = ironjawLedger(progress)
  const additions = [
    ...(solidarity >= 3 ? ['s2-ironjaw-union-bridgebearer'] : []),
    ...(heat >= 3 ? ['s1-walking-foundry'] : []),
  ]
  const next = [...deck]
  for (const id of additions) {
    if (
      next.includes(id) ||
      !CARDS.some((card) => card.id === id && card.team === 'ironjaw')
    )
      continue
    const protectedIds = new Set([...additions, ...(progress.rewards ?? [])])
    const slot = next.findLastIndex((cardId) => !protectedIds.has(cardId))
    if (slot >= 0) next[slot] = id
  }
  return soloProblems('ironjaw', next).length ? deck : next
}
