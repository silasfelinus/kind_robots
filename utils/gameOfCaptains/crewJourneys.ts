import type { CrewId } from './rules'
export { CREW_JOURNEYS, CREW_EPILOGUES } from './crewEpics'
export type { CrewJourneyStep } from './crewEpics'

export const NEMESIS_COUNTERPLAY: Record<string, readonly CrewId[]> = {
  auditor: ['pell', 'rue', 'taal'],
  moth: ['tess', 'kivo', 'rue'],
  curdle: ['vela', 'brin'],
  showrunner: ['mox', 'sora', 'omi'],
  regent: ['fen', 'taal'],
  'brass-choir': ['jex', 'omi'],
  chancellor: ['pell', 'kivo', 'taal'],
  'kindly-swarm': ['brin', 'vela'],
}
