import type { Grade } from './rules'
import { expandedMissionFor } from './expandedNightCases'

export type MorningGrade = Grade | 'refused'

/** One next-morning consequence for every possible result of each original
 * real-night call. This deliberately does not overwrite the dispatch report:
 * the original choice and injury ledger are still preserved. */
export const EARLY_NIGHT_MORNINGS: Record<
  string,
  Record<MorningGrade, string>
> = {
  monorail: {
    honors: 'The conductor brings sixty-seven thank-you notes to class, alongside the contractor signal trace.',
    pass: 'Transit workers invite the class to repair the supply tram before another patrol earns the keys.',
    partial: 'Four injured passengers testify at the transit hearing; no one calls the damaged bridge a victory.',
    failed: 'A contractor lawyer arrives with the vanished command logs and an accusation against your team.',
    refused: 'The conductor posts the unanswered academy dispatch on the station noticeboard.',
  },
  museum: {
    honors: 'The conservator lends your class a copy of the coded invoice, provided the archive stays public.',
    pass: 'A curator demands the academy return the key before its thank-you ceremony.',
    partial: 'The separated child recognizes a buyer in the morning paper, but refuses to speak to your team.',
    failed: 'The school finds its accreditation records falsified, and the museum cameras point to the class.',
    refused: 'The conservator asks the class why a buyer could steal the city archive without a student responding.',
  },
  flood: {
    honors: 'Market vendors organize a seawall inspection and ask the rescuers to attend as witnesses.',
    pass: 'The first ruined stall opens as an emergency food station, staffed by students who stayed to help.',
    partial: 'Displaced neighbors arrive at the academy with photographs of the block still underwater.',
    failed: 'The community kitchen closes; residents paste the seawall operator report over the academy doors.',
    refused: 'A dockworker reads the names of lost market businesses outside the morning assembly.',
  },
  garden: {
    honors: 'Residents and the botanist negotiate a community garden instead of accepting another secret trial.',
    pass: 'The institute wants its cuttings back; the botanist asks you to keep the consent records safe.',
    partial: 'Families displaced by the broken water main demand housing rather than a lab demonstration.',
    failed: 'Dangerous cuttings leave the city on a delivery truck while the institute blames students.',
    refused: 'The botanist sister pins the burned research log to the academy fence.',
  },
  broadcast: {
    honors: 'The city posts translated evacuation routes, and the pirate broadcaster loses their paywall.',
    pass: 'Volunteer interpreters ask the academy for emergency training before the next warning.',
    partial: 'Commuters queue for the missing forecast pages while the broadcaster auctions them again.',
    failed: 'A false all-clear plays on the school screens; families demand to know who handed over the transmitter.',
    refused: 'An emergency coordinator plays both halves of the warning and asks why the class stayed silent.',
  },
  skybridge: {
    honors: 'Eight cleaners walk into the council hearing and recognize the student who kept their names in the record.',
    pass: 'The cleaners supervisor arrives with medical bills instead of a ceremonial medal.',
    partial: 'The forewoman asks the academy to explain why the last evacuation route nearly collapsed.',
    failed: 'An administrator orders the incident roster destroyed, but the cleaners already have copies.',
    refused: 'The shift forewoman names each trapped worker before the morning roll call.',
  },
  ferris: {
    honors: 'A midnight wedding photograph arrives with the maintenance chief repair records tucked behind it.',
    pass: 'Pier operators ask whether the academy will help make the condemned wheel safe again.',
    partial: 'The injured ride operator sends the class a broken gearbox tooth and a demand for answers.',
    failed: 'Harbor patrol divers describe the crash at assembly while the owner calls it student negligence.',
    refused: 'The maintenance chief plays the unanswered rescue call for a room full of angry operators.',
  },
  blackout: {
    honors: 'Union electricians invite the team to identify who sold the hospital backup generator.',
    pass: 'Nurses request a permanent voice on the patrol board instead of another heroic thank-you.',
    partial: 'Two transferred patients return with a bill from the villain crew for its emergency generator.',
    failed: 'An orderly demands an audit of the missing generator while the ward still smells of overheated batteries.',
    refused: 'Nurses organize a candlelit vigil for the night they kept breathing machines running by hand.',
  },
  quarry: {
    honors: 'The sandhogs bring the hidden bank access map to class and ask who paid to bury it.',
    pass: 'The injured worker asks the students to testify before the authority seals the shaft.',
    partial: 'A fourth survivor emerges late and refuses the academy press photograph.',
    failed: 'Workers stage a silence outside the school, carrying the tunnel tools that finally opened the shaft.',
    refused: 'The labor hearing begins with the unanswered academy radio call, played at full volume.',
  },
  rally: {
    honors: 'Protest marshals invite the class to help reopen the side streets the publicist wanted barricaded.',
    pass: 'A medic corrects the celebrity hero version of the evacuation before morning announcements.',
    partial: 'Two arrested marshals send the academy the uncut crowd footage from their cells.',
    failed: 'Firefighters display the crushed barricade while the hero publicist blames protesters again.',
    refused: 'Street medics collect testimonies from the families who saw academy capes turn away.',
  },
  refinery: {
    honors: 'Residents mount the recovered sensor-blocking devices in a public evidence display.',
    pass: 'The refinery calls the leak sabotage; neighbors bring air monitor readings to contest its story.',
    partial: 'Forty residents wait at the school clinic for follow-up care and answers about the sealed sensors.',
    failed: 'The smothered sensors vanish before investigators arrive, leaving neighbors with only their recordings.',
    refused: 'Row-house residents bring their own air monitors to campus after the city calls the leak a drill.',
  },
  vault: {
    honors: 'The injured armor testers deliver the insurer denial memos to an open school hearing.',
    pass: 'The testers ask who stole the deposit box during the surrender that the academy celebrated.',
    partial: 'The insurer calls the jailed testers extremists; their families ask the class to testify.',
    failed: 'A teller describes the police breach while the bank displays the rival class reward plaque.',
    refused: 'The armor testers families arrive with injury files that the bank kept locked away.',
  },
}

/** Refusals cannot be disguised as ordinary failed assignments just because
 * the existing report grade is 'failed'. */
export function nightCaseMorning(
  id: string,
  grade: Grade,
  wasUnanswered: boolean,
): string | null {
  const original = EARLY_NIGHT_MORNINGS[id]
  if (original) return original[wasUnanswered ? 'refused' : grade]
  return expandedMissionFor(id)?.morning ?? null
}
