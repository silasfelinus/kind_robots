/**
 * Crew trophies (slime-city/t-061).
 *
 * Silas, 2026-11-11 PT: "does it unlock rewards?" Story card rewards stay
 * inside the run by design, and story never grants Meat, wallet credit or
 * cards. A finished crew campaign instead unlocks a lasting cosmetic that
 * leaves the economy alone: a trophy, a title and a card-back frame.
 *
 * Nothing new is saved. A crew's trophy is unlocked once its gallery holds a
 * TRIUMPH or COMPROMISE plate. Every finished run earns exactly one of
 * those, and the endings list lives on the account story save and never
 * shrinks (the scrapbook is capped, the gallery is not).
 */
import { TEAMS, type TeamId } from './prototypes'

export interface CrewTrophy {
  team: TeamId
  /** The shelf object, e.g. "The Spliced Bell". */
  trophy: string
  /** One line of flavor shown under the trophy. */
  line: string
  /** A title the player may wear, e.g. "Gene-Riot Ringleader". */
  title: string
  /** The card-back frame's name and its CSS background. */
  frame: { name: string; background: string }
}

export const CREW_TROPHIES: Record<TeamId, Omit<CrewTrophy, 'team'>> = {
  catgirls: {
    trophy: 'The Spliced Bell',
    line: 'A lab collar bell, rung once for every door the riot opened.',
    title: 'Gene-Riot Ringleader',
    frame: {
      name: 'Helix Stitch',
      background:
        'repeating-linear-gradient(135deg, #1b4fd6 0 6px, #0b1d4d 6px 12px)',
    },
  },
  bloodfairies: {
    trophy: 'The Cracked Crown Pin',
    line: 'Queen Pin wore it to the last show. It still hums in E minor.',
    title: 'Moshpit Royalty',
    frame: {
      name: 'Velvet Encore',
      background:
        'radial-gradient(circle at 30% 30%, #b24bf3 0 18%, #3a0f57 19% 100%)',
    },
  },
  ironjaw: {
    trophy: 'The Chrome Jawbone',
    line: 'Polished by a thousand lunch-break arguments on the foundry floor.',
    title: 'Foundry Boss',
    frame: {
      name: 'Hex Plating',
      background:
        'repeating-linear-gradient(60deg, #1f8a4c 0 4px, #0c2f1b 4px 14px)',
    },
  },
  riot: {
    trophy: 'The Burnt Setlist',
    line: 'Half the songs are crossed out. The crowd sang them anyway.',
    title: 'Anarkiss Headliner',
    frame: {
      name: 'Riot Poster',
      background:
        'repeating-linear-gradient(45deg, #e23a3a 0 8px, #2b0909 8px 16px)',
    },
  },
  undertow: {
    trophy: 'The Drowned Switchboard',
    line: 'Every jack still leads somewhere. Most of them should not.',
    title: 'Undertow Handler',
    frame: {
      name: 'Deep Signal',
      background:
        'repeating-radial-gradient(circle at 50% 50%, #2a7fd4 0 3px, #061a33 3px 10px)',
    },
  },
  exchange: {
    trophy: 'The Gilded Ledger',
    line: 'Its last page is blank, for the debt nobody could price.',
    title: 'Exchange Floor Legend',
    frame: {
      name: 'Gold Margin',
      background:
        'linear-gradient(135deg, #f2c14e 0 12%, #3b2a06 12% 88%, #f2c14e 88%)',
    },
  },
}

/** True once any finished run for this crew is in the endings gallery. */
export function crewTrophyUnlocked(
  team: TeamId,
  endings: readonly string[],
): boolean {
  return (
    endings.includes(team + ':triumph') ||
    endings.includes(team + ':compromise')
  )
}

/** The trophy shelf in crew order, with unlocked flags and X/N. */
export function crewTrophyShelf(endings: readonly string[]): {
  trophies: (CrewTrophy & { unlocked: boolean })[]
  unlocked: number
  total: number
} {
  const trophies = TEAMS.map((crew) => ({
    team: crew.id,
    ...CREW_TROPHIES[crew.id],
    unlocked: crewTrophyUnlocked(crew.id, endings),
  }))
  return {
    trophies,
    unlocked: trophies.filter((t) => t.unlocked).length,
    total: trophies.length,
  }
}

/** Titles the player has earned, in crew order. */
export function earnedCrewTitles(endings: readonly string[]): string[] {
  return crewTrophyShelf(endings)
    .trophies.filter((t) => t.unlocked)
    .map((t) => t.title)
}
