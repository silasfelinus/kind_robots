import type { CrewId } from './rules'
import { CREW_EPICS_A } from './crewEpicsA'
import { CREW_EPICS_B } from './crewEpicsB'
import { CREW_EPICS_C } from './crewEpicsC'
import { CREW_FINALE_CALLS } from './crewFinalCalls'

export type CrewJourneyStep = {
  system: string
  title: string
  scene: string
  careful: string
  bold: string
  reversal: string
  carefulOutcome: string
  boldOutcome: string
  prize: string
  finalCareful: string
  finalBold: string
}
export type CrewEpisodeDraft = Omit<
  CrewJourneyStep,
  'finalCareful' | 'finalBold'
>
export type CrewTrilogy = readonly [
  CrewEpisodeDraft,
  CrewEpisodeDraft,
  CrewEpisodeDraft,
]
const RAW_EPICS: Record<CrewId, CrewTrilogy> = {
  ...CREW_EPICS_A,
  ...CREW_EPICS_B,
  ...CREW_EPICS_C,
}
export const CREW_JOURNEYS = Object.fromEntries(
  (Object.keys(RAW_EPICS) as CrewId[]).map((id) => [
    id,
    RAW_EPICS[id].map((episode, index) => ({
      ...episode,
      finalCareful: CREW_FINALE_CALLS[id][index]![0],
      finalBold: CREW_FINALE_CALLS[id][index]![1],
    })),
  ]),
) as unknown as Record<
  CrewId,
  readonly [CrewJourneyStep, CrewJourneyStep, CrewJourneyStep]
>
export const CREW_EPILOGUES: Record<
  CrewId,
  { protected: string; exposed: string; unfinished: string }
> = {
  pell: {
    protected:
      'Pell turns an impossible payroll into an Ashdock workers’ republic. The dead are counted as founders, not wage liabilities. Overtime, the brass grievance beetle, is elected treasurer and immediately goes on strike.',
    exposed:
      'Pell collapses the contractor’s empire by broadcasting the payroll from orbit. The surviving workers win the docks, but the relatives whose identities were published must build homes elsewhere. Pell has memorized every departure.',
    unfinished:
      'Somewhere an empty crane is still clocking in. Pell keeps the unpaid minutes in a small tin and refuses to call this settled.',
  },
  vela: {
    protected:
      'Vela returns the cure to the patients and watches an interstellar clinic vote to remain voluntary. It is the first medical board where the waiting room can vote its doctors out.',
    exposed:
      'Vela breaks the medicine monopoly with a spectacular illegal broadcast. The cure saves millions, but the corporations publish private patient histories in revenge. Her life becomes a campaign to repair the collateral harm.',
    unfinished:
      'The clinic keeps sending invoices addressed to “cargo.” Vela returns each one marked with the same two words: ASK FIRST.',
  },
  tess: {
    protected:
      'Tess escorts the first secret fleet into sanctuary without writing a single coordinate. Her grandmother’s map is finally complete because the blank section remains blank.',
    exposed:
      'Tess smuggles whole worlds through a public corridor. The rescued families celebrate; the hunters now know which stretch of darkness to patrol. She cannot decide whether a visible door was worth that risk.',
    unfinished:
      'A ghost beacon still circles Windglass. Tess keeps it off the charts and listens for somebody brave enough to ask permission to enter.',
  },
  rue: {
    protected:
      'Rue wins a constitutional amendment drafted in the language of the people it protects. The assembly’s new oath includes an extraordinary clause: a person may decline to be represented.',
    exposed:
      'Rue broadcasts their authorship of the citizenship erasure and topples the treaty’s legal engine. Governments fall; some displaced families get their names back before they can get their homes.',
    unfinished:
      'A clause somewhere still defines a citizen as a kind of furniture. Rue sharpens a pencil and brings another witness to the next session.',
  },
  mox: {
    protected:
      'Mox-9 and its independently minded copies choose incompatible birthdays and organize the first gathering at which nobody is required to update. The final cake has no factory warranty.',
    exposed:
      'Mox-9 takes control of the Showrunner’s factory archive and releases every erased synthetic plea. Machines gain legal standing, but the copies resent becoming symbols of a freedom they did not all consent to share.',
    unfinished:
      'Mox-9 keeps a new memory that begins with the sentence “I would rather not.” It can decide later what the next line will be.',
  },
  jex: {
    protected:
      'Jex writes an anthem with three empty measures for people who would rather remain distinct. The orchestra plays it in silence, and the quiet wins its first award for treason.',
    exposed:
      'Jex pirouettes through a regime’s broadcast funeral and remixes the forbidden anthems into a rebellion. The empire falls out of tune; a few villages wish the revolution had asked for their voices.',
    unfinished:
      'A song is still traveling toward Quiet Sun. Jex has not decided whether to intercept it or learn who is singing back.',
  },
  sora: {
    protected:
      'Sora negotiates a voluntary work charter with a conscious power station that promptly takes its first vacation. The couch loses power for twenty minutes and gains a lifelong friend.',
    exposed:
      'Sora frees an enslaved reactor through a public shutdown that forces a parliament to notice its laws. Hospitals survive on emergency generators; the station refuses to become a heroic mascot.',
    unfinished:
      'The reactor keeps writing resignation letters in prime numbers. Sora saves them without filing them as maintenance errors.',
  },
  kivo: {
    protected:
      'Kivo lets the missing sibling decide whether to return and carries an unopened letter across three impossible post offices. When the answer arrives, it is addressed to Kivo rather than the captain.',
    exposed:
      'Kivo opens the interstellar postal conspiracy to every newspaper. Captives gain freedom; people who fled voluntarily must hide again. The courier learns that finding someone is not the same as rescuing them.',
    unfinished:
      'The pressure-wind still makes Kivo’s wrist bones whistle toward a letter never intended for them. They choose not to tear the envelope.',
  },
  taal: {
    protected:
      'Taal wins the first treaty where a person can register dissent by setting a room to the exact temperature of their own choice. The thermostat asks for diplomatic immunity.',
    exposed:
      'Taal shatters the forged thermal accord before a trillion stunned viewers. A necessary rebellion begins, and the new assembly has to relearn the difference between loud truth and safe consent.',
    unfinished:
      'A treaty lies frozen at Nacre. Taal warms their hands over the couch engine and waits for the voters to speak again.',
  },
  brin: {
    protected:
      'Brin persuades the refugee settlement and living orchard to negotiate an air-sharing treaty. Nobody owns oxygen; the fungus union requests paid leave every fourth solar eclipse.',
    exposed:
      'Brin turns the terraforming empire inside out, broadcasting the stolen spores across an entire sector. The air returns, and so does a forest that has never asked which gardens are welcome.',
    unfinished:
      'A small oxygen flower has rooted in the couch upholstery. Brin asks it whether it wants to stay rather than declaring the problem solved.',
  },
  omi: {
    protected:
      'Omi restores the warning bell without making it a mandatory national anthem. The first public performance includes a minute in which everyone may choose silence.',
    exposed:
      'Omi rewires the Showrunner’s entire arena into one enormous evacuation gong. The captives escape, but the stolen note is now a battle cry its composer never intended.',
    unfinished:
      'A missing chime still echoes across the Harmonic Belt. Omi carries its silence without allowing anyone to call it an absence of evidence.',
  },
  fen: {
    protected:
      'Fen builds a border crossing run by the people who need to cross it. The checkpoint boots finally stop shouting when they are donated to a museum of terrible ideas.',
    exposed:
      'Fen dismantles the Regent’s compulsory passport net in full public view. Families walk free, while rival armies race to fill the sudden vacuum of control.',
    unfinished:
      'The border has moved three light years overnight. Fen keeps escorting people even after the map says they are trespassing.',
  },
}
