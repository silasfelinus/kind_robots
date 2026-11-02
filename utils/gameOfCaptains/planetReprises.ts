import type { EpisodeChoice } from './episodeConsole'

type Reprise = Record<EpisodeChoice, string> & {
  setback: string
  encore: string
}

const REPRISES: Record<string, Reprise> = {
  'The Moon That Requested Custody': {
    ask: 'The custody calendar has reached alternate Thursdays. The moon has now requested alternating birthdays.',
    document: 'The deed settled ownership, but three rival tides have filed to be recognized as dependents.',
    override: 'The relocated tide keeps returning to its old address. The postal service requests assistance.',
    setback: 'The previous hearing was adjourned. The moon has brought its own folding chair this time.',
    encore: 'A third hearing is scheduled. The tides have retained separate counsel.',
  },
  'A Refugee Named Wednesday': {
    ask: 'Wednesday chose a safe date. Tuesday has arrived to contest the custody arrangement.',
    document: 'The testimony held up, but tomorrow has filed an appeal in yesterday.',
    override: 'The couch is still wanted in next week. The warrant arrived with a polite reminder.',
    setback: 'The temporal hearing failed. Wednesday is back, six days early and carrying a numbered ticket.',
    encore: 'The border office has opened a second queue for people who have already waited.',
  },
  'The Union of Unpaid Suns': {
    ask: 'The rotating daylight agreement works. Management has begun counting dusk as unpaid overtime.',
    document: 'The payroll fraud was exposed. The stars are now demanding back pay in hydrogen.',
    override: 'The restarted sun has joined the picket line. It has brought its own replacement bulb.',
    setback: 'Last time the labor board refused the filing. Three stars have turned off their out-of-office lights.',
    encore: 'The night shift has organized. No one can agree which shift that is.',
  },
  'The Garden That Refused Oxygen': {
    ask: 'The orchard got its retirement discussion. The settlement has submitted a request for weekend breathing.',
    document: 'The forged contract was struck down. A fertilizer supplier is claiming historical damages.',
    override: 'The trees have complied just enough to file a grievance with every exhalation.',
    setback: 'The old application stalled. The grove now sends all correspondence through its roots.',
    encore: 'A sapling has asked to testify. Everyone is checking whether saplings can swear an oath.',
  },
  'The Diplomatic Temperature Incident': {
    ask: 'The new interpreter was approved. The embassy has begun misreading the interpreter instead.',
    document: 'The frost recording clarified the vote. Delegates now dispute the meaning of a thaw.',
    override: 'The heated chamber remains on the agenda. The diplomats have requested individual thermostats.',
    setback: 'The last translation was rejected. An ambassador has arrived carrying an annotated snowflake.',
    encore: 'The committee has appointed a second interpreter for the first interpreter.',
  },
  'A Planet Requests an Exit Interview': {
    ask: 'The planet entered mediation. The mining company has asked for a severance interview with the crust.',
    document: 'The extraction ledgers were accepted. The lawyers are billing the planet for reading them.',
    override: 'The drill has stopped. Its owner is now suing the couch for interference with a future hole.',
    setback: 'The first hearing stalled. The planet has brought a geological character reference.',
    encore: 'The exit interview is now longer than the employment itself.',
  },
  'The Twelve-Hour Apology': {
    ask: 'Survivors set the terms. The colony has replied with an apology for the length of its apology.',
    document: 'The original testimony survives. The broadcaster has demanded the right to forget the tape.',
    override: 'The transmitter is silent. A backup station is now broadcasting a prerecorded regret.',
    setback: 'The first complaint was dismissed. The witnesses have returned with notes written on their sleeves.',
    encore: 'The committee has apologized for scheduling another apology committee.',
  },
  'The Missing Note Committee': {
    ask: 'The residents took charge of the alarm. The palace has requested a quieter emergency.',
    document: 'The lost waveform was recovered. Its composer is demanding royalties from the evacuation drill.',
    override: 'Every bell sounded. The broken windows have been entered as evidence of excessive volume.',
    setback: 'Last time the alarm stayed silent. The residents have brought a handbell and a legal observer.',
    encore: 'The palace has forbidden the sound of the word bell.',
  },
  'The Interstellar Costume Inspector': {
    ask: 'The passengers were recognized. The inspector now questions whether the cushions are legal persons.',
    document: 'The couch registration was found. Customs has discovered that it lacks a parking category.',
    override: 'The couch crossed the border. An invoice has caught up, addressed to an imaginary vehicle.',
    setback: 'The last petition was rejected. The crew has returned wearing official proof-of-existence badges.',
    encore: 'The inspector has classified the forms themselves as theatrical props.',
  },
  'The Gravity Refund Office': {
    ask: 'Tenants negotiated a fair rate. The company is charging for the meeting room floor.',
    document: 'The fraudulent meters were seized. The firm has introduced a fee for descending stairs.',
    override: 'The rearranged gravity is still settling. The council has voted to bolt down its desks.',
    setback: 'The first refund was refused. Residents have brought their own measuring plumb line.',
    encore: 'The appeals board has been moved upstairs. Gravity is not included in the lift fare.',
  },
}

export function planetReprise(
  title: string,
  previousChoice: EpisodeChoice,
  previousSuccess: boolean | undefined,
  previousCount: number,
): string {
  if (previousCount < 1) return ''
  const reprise = REPRISES[title]
  if (!reprise) return ''
  const callback =
    previousSuccess === true
      ? reprise[previousChoice]
      : reprise.setback
  return previousCount >= 2 ? callback + ' ' + reprise.encore : callback
}
