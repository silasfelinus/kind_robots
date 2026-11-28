import { identityFor } from '../cometAcademy/identityArcs'
import type { SignaturePowerId } from '../cometAcademy/specialPowers'
import type { CrossfireJournal } from './crossfireCampaign'
import { CROSSFIRE_CHAPTERS, crossfireFinaleNetwork } from './crossfireCampaign'
import { ACCIDENT_CAMPAIGNS } from './personalAccidentCampaigns'
import { MAGIC_CAMPAIGNS } from './personalMagicCampaigns'
import { TECH_CAMPAIGNS } from './personalTechCampaigns'
import { MUTANT_CAMPAIGNS } from './personalMutantCampaigns'
import { ALIEN_CAMPAIGNS } from './personalAlienCampaigns'
import { PSYCHIC_CAMPAIGNS } from './personalPsychicCampaigns'
import { personalFoilEnding } from './personalFoilEndings'
import type { StoryRun } from './firstBellStory'
import type { TrainingState } from './training'

export const PERSONAL_CAMPAIGNS = {
  ...ACCIDENT_CAMPAIGNS,
  ...MAGIC_CAMPAIGNS,
  ...TECH_CAMPAIGNS,
  ...MUTANT_CAMPAIGNS,
  ...ALIEN_CAMPAIGNS,
  ...PSYCHIC_CAMPAIGNS,
}

type BattleEvidence = {
  state: Pick<TrainingState, 'phase' | 'flags' | 'crossfireCast'>
  story: Pick<StoryRun, 'mercy' | 'civilians' | 'evidence'>
}

export type CrossfireChapterBeat = {
  title: string
  text: string
  choice: 'rescue' | 'evidence' | 'command'
}

const CHOICES = [
  { rescue: null, evidence: null },
  { rescue: 'lab-rescued', evidence: 'lab-evidence' },
  { rescue: 'crosswalk-medics', evidence: 'crosswalk-jammed' },
  { rescue: 'roof-warning', evidence: 'roof-jammed' },
  { rescue: 'breach-vented', evidence: 'breach-evidence' },
  { rescue: 'prom-shelter', evidence: null },
] as const

const AFTERMATH: readonly {
  rescue: string
  evidence: string
  command: string
}[] = [
  {
    rescue:
      'The students you carried off the catwalk testify before anyone can bury their names. Even people who feared the squad now agree somebody came back for them.',
    evidence:
      'The First Bell records expose whose orders put civilians in the firing lane. The academy can deny the accusations, but it cannot erase the copies.',
    command:
      'The patrol ends with the alarm still echoing. The campus knows who gave the orders, and knows that nobody stayed to hear the frightened witnesses.',
  },
  {
    rescue:
      'The science-wing researchers come out alive. They refuse to name a hero, but they remember who opened the locked doors instead of protecting the experiment.',
    evidence:
      'The laboratory files survive the lockdown. By morning the company lawyers are calling the evidence stolen; by lunch the students have copies.',
    command:
      'The shutters are lifted, but the people trapped behind them do not join the victory photograph. A secured building is not the same as a safe one.',
  },
  {
    rescue:
      'The tram-stop medics get every stranded passenger out of traffic. Their radios carry your call sign to the next neighborhood that needs help.',
    evidence:
      'A hacked traffic signal exposes who arranged the crossing as a trap. The transport board demands silence; the commuters demand the entire recording.',
    command:
      'The crossing is clear. The people who stood behind the squad still have questions about the ones who were left on the wrong side of the barriers.',
  },
  {
    rescue:
      'The rooftop engineer warns the city before the transmitter can turn the next block into a target. The broadcast ends with a human voice, not a threat.',
    evidence:
      'The jamming trace leads back to a command room nobody was supposed to know about. Every radio in Comet City catches the same incriminating seconds.',
    command:
      'The antenna is yours, but the silence below sounds less like peace than a city waiting for its next set of instructions.',
  },
  {
    rescue:
      'The containment valves open and the people in the tunnels finally breathe without asking permission. The reactor crew refuses to lock them below again.',
    evidence:
      'The buried records prove the seal was built to protect a secret, not the city. Copies reach the ballroom before the last alarms begin.',
    command:
      'The seal-keeper is down, but the locked tunnels taught the city a cruel lesson: the people holding the keys can change their minds.',
  },
  {
    rescue:
      'The ballroom doors open. Students leave under their own power, carrying injured classmates and the names of people who refused to abandon them.',
    evidence:
      'The final orders are broadcast over the prom speakers. The room hears who tried to turn graduation into a siege, and who signed the orders.',
    command:
      'The emergency gates open at last. The floor belongs to the survivors, but the people who seized the microphone still want to write the official story.',
  },
]

function branchFor(
  index: number,
  battle: BattleEvidence,
): CrossfireChapterBeat['choice'] {
  const flags = battle.state.flags ?? []
  if (index === 0) {
    if (battle.story.mercy || battle.story.civilians > 0) return 'rescue'
    return battle.story.evidence > 0 ? 'evidence' : 'command'
  }
  if (index === 5) return flags.includes('prom-shelter') ? 'rescue' : 'command'
  const choice = CHOICES[index]
  if (choice?.rescue && flags.includes(choice.rescue)) return 'rescue'
  if (choice?.evidence && flags.includes(choice.evidence)) return 'evidence'
  return 'command'
}

/** The record is authored per battle and per earned decision, not generated
 * from player-entered metadata. Every foil keeps its one canonical name. */
export function crossfireChapterBeat(
  index: number,
  battle: BattleEvidence,
  lead: SignaturePowerId,
  foil: SignaturePowerId | null,
  perspective: CrossfireJournal['perspective'],
): CrossfireChapterBeat {
  const choice = branchFor(index, battle)
  const chapter = CROSSFIRE_CHAPTERS[index]
  const speaker = identityFor(lead).hero.alias
  const opponent = foil ? identityFor(foil).hero.alias : 'the rival patrol'
  const personal = PERSONAL_CAMPAIGNS[lead]?.chapters[index]
  const reported = personal
    ? personal[choice === 'rescue' ? 1 : choice === 'evidence' ? 2 : 3]
    : (AFTERMATH[index]?.[choice] ?? '')
  const account =
    perspective === 'villain'
      ? `${speaker} takes responsibility for what the squad ordered. ${opponent} will not let the story become a simple victory speech.`
      : `${speaker} stays until the last witnesses finish speaking. ${opponent} has a different account of the same night.`
  return {
    title: `${personal?.[0] ?? chapter?.title ?? 'Crossfire'} · ${choice === 'rescue' ? 'People First' : choice === 'evidence' ? 'The Record Survives' : 'Orders and Consequences'}`,
    text: `${reported} ${account}`,
    choice,
  }
}

export type CrossfireFinale = {
  title: string
  text: string
  path: 'open-doors' | 'black-box' | 'signed-order' | 'unfinished'
}

/** At Prom Night the ending depends on both the final decision and the
 * chain of previous completed chapters, not the HERO/VILLAIN menu choice. */
export function crossfireFinale(
  journal: CrossfireJournal,
  current: BattleEvidence = journal.active,
): CrossfireFinale | null {
  if (
    journal.chapter !== CROSSFIRE_CHAPTERS.length - 1 ||
    current.state.phase !== 'victory'
  )
    return null
  const network = crossfireFinaleNetwork(journal.completed.slice(0, 5))
  if (!network) return null
  const last = branchFor(5, current)
  const lead = identityFor(journal.lead).hero.alias
  const opponent = journal.foil
    ? identityFor(journal.foil).hero.alias
    : 'the rival leader'
  const personal = PERSONAL_CAMPAIGNS[journal.lead]?.endings
  const close = (index: number, text: string) => {
    const reply = personalFoilEnding(
      journal.lead,
      journal.foil,
      index,
      current.state.crossfireCast,
    )
    const response = reply ? ' ' + opponent + ': “' + reply + '”' : ''
    return text + response + (personal ? ' ' + personal[index] : '')
  }
  if (last === 'rescue' && network.squadGuarded)
    return {
      path: 'open-doors',
      title: 'The Doors Stayed Open',
      text: close(
        0,
        `${lead} wins something harder than a battle: the city keeps its evacuation routes open. The students, researchers and workers who were protected on earlier nights run the final rescue themselves. Even ${opponent} cannot claim those people were merely pieces on the board.`,
      ),
    }
  if (last === 'rescue' && network.enemiesExposed)
    return {
      path: 'black-box',
      title: 'The Evidence They Could Not Burn',
      text: close(
        1,
        `${lead} leaves the ballroom with testimony from every district. The files from earlier missions make the final broadcast impossible to discredit. ${opponent} faces a public reckoning rather than a convenient final duel, and the city gets to read its own history.`,
      ),
    }
  if (last === 'rescue')
    return {
      path: 'unfinished',
      title: 'No One Gets the Last Word',
      text: close(
        2,
        `${lead} opens the exits and gets the truth into the street, but the network behind ${opponent} survives. Some neighbors remember the rescues. Others remember the missing records. Graduation becomes the beginning of an argument the city intends to finish.`,
      ),
    }
  return {
    path: 'signed-order',
    title: 'The Signature on the Order',
    text: close(
      3,
      `${lead} gets the emergency gates open by controlling the floor and the microphone. ${opponent} is beaten, but the city has learned to fear whoever writes its orders. The prom ends safely enough; the question of who deserves authority is left burning above the dance floor.`,
    ),
  }
}

export function crossfirePreviousChapter(
  journal: CrossfireJournal,
): CrossfireChapterBeat | null {
  if (journal.chapter === 0) return null
  const previous = journal.completed[journal.chapter - 1]
  if (!previous) return null
  return crossfireChapterBeat(
    journal.chapter - 1,
    previous,
    journal.lead,
    journal.foil,
    journal.perspective,
  )
}

export function crossfireCurrentChapter(
  journal: CrossfireJournal,
  current: BattleEvidence,
): CrossfireChapterBeat | null {
  if (current.state.phase !== 'victory') return null
  return crossfireChapterBeat(
    journal.chapter,
    current,
    journal.lead,
    journal.foil,
    journal.perspective,
  )
}
