// The Mole Revolutionaries (conductor emperor-of-dust t-016): the eighth
// kingdom faction, against the throne and against the Mire Mothers. Who speaks
// for the burrows, and the reconciliation track the crown earns with them one
// political concession at a time. Every concession and grievance is a story
// flag an audience, talk or quest leaves behind.
import type { FortressRun, Standing } from './types'

export type MoleLeader = {
  name: string
  role: string
  /** Major NPC slug, when the character has illustrated art. */
  npc?: string
  /** Follower id, when the character can join the barracks. */
  follower?: string
  stance: string
}

export const MOLE_LEADERS: readonly MoleLeader[] = [
  {
    name: 'Granny Umber',
    role: 'Founder of the cells',
    npc: 'granny-umber',
    stance: 'Wants the throne gone, not burned. She can be moved by deeds.',
  },
  {
    name: 'Keel Understone',
    role: 'Surveyor of the cells',
    follower: 'F009',
    stance: 'Water and tunnels. Will work for a crown that keeps its word.',
  },
  {
    name: 'Lumen Shale',
    role: 'Organizer of the assembly',
    follower: 'F010',
    stance: 'Reconciliation means reforms, in writing, read aloud.',
  },
  {
    name: 'Coal Harrow',
    role: 'Captain of the sappers',
    stance: 'Powder first. The fen first, then the tower.',
  },
  {
    name: 'Odo Umber',
    role: 'Courier, Granny Umber’s grandson',
    stance: 'Carries what he is given. Has her squint.',
  },
]

/** Political concessions the crown can earn from the burrows, in story order. */
export const MOLE_CONCESSIONS: readonly string[] = [
  'mole-talks-opened',
  'd17-names-recorded',
  'd17-race-closed',
  'd17-burrows-surveyed',
  'd21-umber-released',
  'd21-weir-ordered-open',
  'd21-pumps-paid',
  'd22-knife-shown',
  'd26-ford-reparations',
  'mole-truce',
  'keel-sluice-repealed',
  'sheltered-moles',
  'd32-reform-councils',
  'd32-reform-ledger',
  'd32-reform-sedition',
  'd33-sappers-freed',
  'route-tunnel',
  'prisoner-pardoned',
  'd38-boy-escorted',
  'congress-reseated',
  'd42-mole-charter-signed',
  'd44-fen-asked',
  'd46-fen-mole-truce',
]

/** What the burrows hold against the crown. */
export const MOLE_GRIEVANCES: readonly string[] = [
  'mole-messenger-arrested',
  'moles-blamed',
  'd21-weir-forbidden',
  'd32-reforms-refused',
  'd33-sappers-to-fen',
  'prisoner-kept',
  'congress-komodo-seating',
  'd34-ford-water-signed',
  'd44-powder-seized',
]

/** The burrows send Lumen Shale with their reform list after two deeds. */
export const MOLE_REFORMS_OPEN: Standing = { flags: MOLE_CONCESSIONS, min: 2 }
/** The whole assembly turns out on Day 50 for a crown that earned it. */
export const MOLE_ASSEMBLY_TURNS_OUT: Standing = {
  flags: MOLE_CONCESSIONS,
  min: 5,
}
/** Reconciled: the Moles keep a seat beside the throne after the war. */
export const MOLES_RECONCILED: Standing = { flags: MOLE_CONCESSIONS, min: 7 }

export type MoleStanding = 'enemies' | 'wary' | 'talking' | 'reconciled'

export type MoleAccord = {
  concessions: string[]
  grievances: string[]
  standing: MoleStanding
}

/** Where the crown stands with the burrows: deeds counted against wrongs. */
export const moleAccord = (run: Pick<FortressRun, 'flags'>): MoleAccord => {
  const concessions = MOLE_CONCESSIONS.filter((flag) =>
    run.flags.includes(flag),
  )
  const grievances = MOLE_GRIEVANCES.filter((flag) => run.flags.includes(flag))
  const score = concessions.length - grievances.length
  const standing: MoleStanding =
    concessions.length >= MOLES_RECONCILED.min && score >= 4
      ? 'reconciled'
      : score >= 2
        ? 'talking'
        : score >= 0
          ? 'wary'
          : 'enemies'
  return { concessions, grievances, standing }
}
