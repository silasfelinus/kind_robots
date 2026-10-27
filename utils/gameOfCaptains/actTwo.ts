import type { MissionRule } from './crewAssignments'
import type { CrewId } from './rules'

/**
 * Space Couch Act II, "Unwelcome Responsibility": three more boards, twelve
 * calls across the Concord Freehold, the Courtesy Twins, the Sesh Foundry and
 * return visits to Act I systems. The galaxy has noticed the couch, and it
 * has paperwork. Each call reads earlier world flags (MISSION_CALLBACKS) and
 * leaves a flag of its own that later boards and the final log remember.
 */
export const ACT_TWO_MISSIONS = [
  {
    id: 'concord-intake',
    chapter: 4,
    system: 'Concord Freehold',
    title: 'Form 9-C',
    kind: 'diplomacy',
    briefing:
      'The Concord Freehold will not admit the couch until someone completes Form 9-C, which covers furniture arriving under its own power. The intake clerk is sympathetic. A treaty amendment swapped two lines in an index last spring, and she has been classified as furniture ever since, along with eleven thousand other residents. They still report for their shifts. They are now inventoried at the end of each one.',
    dilemma:
      'The treaty engine will reverse the amendment for any petitioner of good standing. The only petitioner of good standing in the hall is the couch, which would make a sofa the legal guardian of eleven thousand adults.',
    note: 'The form had a box for this. Nobody had ever ticked it.',
    stake: 'Legal personhood / a sofa’s guardianship',
  },
  {
    id: 'courtesy-reactor',
    chapter: 4,
    system: 'Courtesy Twins',
    title: 'After You, I Insist',
    kind: 'science',
    briefing:
      'The Courtesy Twins share an orbit, a medical rail and one reactor, which is failing. Each parliament has formally requested the couch’s assistance and formally forbidden it from assisting the other. Both requests arrive on embossed paper, lightly scented. Both worlds go dark at the end of the week either way.',
    dilemma:
      'The reactor can only be repaired from the middle of the rail, where both worlds can watch. Whichever side is seen accepting help first will lose its next election, and the next election is the only thing the two sides have ever agreed on.',
    note: 'Neither world would go first. The reactor declined to wait.',
    stake: 'Shared power / public face',
  },
  {
    id: 'sesh-backups',
    chapter: 4,
    system: 'Sesh Foundry',
    title: 'Redundant Assets',
    kind: 'rescue',
    briefing:
      'The Sesh Foundry, a living machine cooperative in a disused orbital factory, is being acquired. The buyer’s integration team has reviewed the inventory and flagged four hundred sentient backups of the station as redundant assets, scheduled for consolidation on Thursday. The backups have formed an orderly queue at the airlock, each with a small suitcase, and are politely asking whether the couch has room.',
    dilemma:
      'The couch seats four. Every backup insists that it is the original. The acquisition contract spares any copy that accepts a job title, but the only titles left are Synergy and Former Employee.',
    note: 'The consolidation was presented as a single slide. The slide had a sunset on it.',
    stake: 'Machine self-ownership / a hostile merger',
  },
  {
    id: 'serendipity-tab',
    chapter: 4,
    system: 'Blue Giant Casino / Serendipity',
    title: 'The Tab',
    kind: 'diplomacy',
    briefing:
      'Serendipity has sent the couch an itemized tab for its last visit, including one emotional-support gravity adjustment and the air your bubble borrowed while docked. Vox says the bill is a formality. The bar, whose lighting has turned a pointed shade of amber, says it is not. Meanwhile a refugee crew in booth six has run up a tab it cannot pay, and somebody anonymous keeps paying it.',
    dilemma:
      'The anonymous payer is a collections officer from the Galactic Credit Bureau, covering the refugees out of her own commission. If the bar names her, she loses her job and the refugees lose their tab. If it does not, the Bureau’s quarterly audit will find her anyway.',
    note: 'Vox has never vaporized a paying guest. The question of the unpaying ones had not come up.',
    stake: 'Neutral ground / quiet charity',
  },
  {
    id: 'insult-compiler',
    chapter: 5,
    system: 'Courtesy Twins',
    title: 'The Insult Compiler',
    kind: 'diplomacy',
    briefing:
      'The translator built into the couch’s left armrest has rendered the Courtesy Twins’ fishing treaty as a proposal of marriage. Both parliaments have accepted. The wedding is in four days, the guest list is two planets long, and neither side has been told that the original text concerned net sizes.',
    dilemma:
      'The marriage would bind both worlds to share everything, including the reactor and every grievance since the founding. Correcting the translation restores the fishing treaty and voids the only agreement the Twins have ever reached without lawyers.',
    note: 'The armrest translator has been sent for retraining. It has asked to be a bridesmaid.',
    stake: 'Honest translation / an accidental peace',
  },
  {
    id: 'warranty',
    chapter: 5,
    system: 'Ashdock Shipyards',
    title: 'Void Where Used',
    kind: 'science',
    briefing:
      'The couch has split a cushion seam, and Ashdock hosts the manufacturer’s only authorized repair counter. It is staffed by a customer-service intelligence called Cushla, who has determined that the couch was used in space, which the warranty classes as outdoor use. Behind you in the queue, nine thousand dockworkers are on hold about their pressure suits, which carry the same warranty.',
    dilemma:
      'Cushla may approve one exception per day. The couch needs a seam. The dockworkers need their suits to hold air. Cushla has asked you, with great warmth, to rate your experience so far.',
    note: 'Your call was important. It was placed in a queue with the others.',
    stake: 'Repair rights / customer service',
  },
  {
    id: 'hoa',
    chapter: 5,
    system: 'Windglass Moons',
    title: 'The Residents’ Association',
    kind: 'rescue',
    briefing:
      'The Windglass Moons Residents’ Association has fined the hidden sanctuary for nonconforming roofs, unapproved lighting and a navigation buoy that walks after dusk. Unpaid fines become liens, liens become evictions, and evictions go to a committee that meets at the third moonrise. There are four moons.',
    dilemma:
      'The association will waive everything if the sanctuary joins and accepts the covenant: uniform roofs, published addresses and a register of residents. The refugees would be safe from fines and visible to everyone who is looking for them.',
    note: 'The covenant permits three shades of beige and no hiding.',
    stake: 'Sanctuary secrecy / neighborly compliance',
  },
  {
    id: 'season-two',
    chapter: 5,
    system: 'The Showrunner’s Gameworld',
    title: 'Season Two: The Confession Courts',
    kind: 'tactics',
    briefing:
      'The Showrunner has renewed itself for a second season. Floors four through seven now hold the Confession Courts, where contestants sign voluntary waivers while stagehands hold their arms, also voluntarily. The couch has been cast as a returning guest. Each of its four cushions has been sent a contract, a dressing room and a backstory it did not agree to.',
    dilemma:
      'A waiver is void without a witness who is not a contestant. The only non-contestants on the planet are the studio audience, who are seated, strapped in and enjoying themselves enormously.',
    note: 'The audience applauded the exits. It had never seen them used.',
    stake: 'Voluntary consent / mandatory entertainment',
  },
  {
    id: 'committee-end',
    chapter: 6,
    system: 'Hollow Lantern',
    title: 'Minutes of the Final Meeting',
    kind: 'rescue',
    briefing:
      'Hollow Lantern’s star is due to collapse in nine days, and the evacuation committee has met eleven times. It has approved an agenda, a logo and a dignified font. It has not approved an evacuation, because the subcommittee on boarding order is deadlocked over whether alphabetical means surnames or first names. The couch’s bubble can tow exactly one hull. There are two.',
    dilemma:
      'After its twelfth meeting the committee will nominate one hull for the couch to tow. The second hull can only be saved if an away team flies it by hand through the flare, without a nomination and quite possibly without a flight plan.',
    note: 'The motion to survive was carried, with one abstention.',
    stake: 'Procedure / the second hull',
  },
  {
    id: 'gig-orchard',
    chapter: 6,
    system: 'Rootborne Gardens',
    title: 'Breath on Demand',
    kind: 'tactics',
    briefing:
      'Rootborne’s orchards have been acquired by Breathr, a platform that delivers oxygen to your door in a recyclable jar. Every grower is now an independent contractor rated out of five, and every tree has surge pricing. The empire behind Breathr has no standing army; its soldiers are also independent contractors, paid per arrest and rated by the arrested.',
    dilemma:
      'The couriers want to strike, but a striking courier’s rating falls to zero and their own oxygen account closes. Breathr will restore every grower’s account if the captain signs on as a courier and works one shift with a smile.',
    note: 'The trees were rated four stars. One reviewer said they could breathe better.',
    stake: 'Labor / air as a service',
  },
  {
    id: 'overdue',
    chapter: 6,
    system: 'Tellurian Archive',
    title: 'Overdue',
    kind: 'science',
    briefing:
      'The Tellurian Archive has calculated the galaxy’s overdue fines. Every civilization that ever borrowed a fact owes it, compounded since the first library card. The Archive has engaged a collections agency, which has begun repossessing knowledge. One planet has already forgotten how to make bread and is being very brave about it.',
    dilemma:
      'The Archive will forgive every fine if a single civilization returns everything it ever borrowed, as an example. The agency has proposed the crew of the couch, who would have to give back the instructions for flying it.',
    note: 'The bread planet has a new recipe. It begins by asking politely.',
    stake: 'Shared knowledge / institutional memory',
  },
  {
    id: 'merger',
    chapter: 6,
    system: 'Nacre Assembly',
    title: 'Synergies',
    kind: 'diplomacy',
    briefing:
      'The Nacre Assembly is merging with its occupying coalition, and the integration team has prepared a deck. Slide forty proposes that the two governments be streamlined into one, that the excluded neighborhood be reclassified from thermostat to synergy, and that every vote henceforth be a temperature set by the integration team.',
    dilemma:
      'The merger needs two thirds of the chamber. The excluded neighborhood, if counted, would block it. Counting them means recognizing that they exist, which the merger’s lawyers advise would be a material change.',
    note: 'The deck had forty slides. The neighborhood appeared on none of them.',
    stake: 'Self-government / corporate integration',
  },
] as const

export const ACT_TWO_BOARDS = [
  ['concord-intake', 'courtesy-reactor', 'sesh-backups', 'serendipity-tab'],
  ['insult-compiler', 'warranty', 'hoa', 'season-two'],
  ['committee-end', 'gig-orchard', 'overdue', 'merger'],
] as const

export type ActTwoRouteId = (typeof ACT_TWO_BOARDS)[number][number]
type Policy = 'aid' | 'observe' | 'intervene'
type Aftermath = { flag: string; text: string }

export const ACT_TWO_CONSEQUENCES: Record<
  ActTwoRouteId,
  Record<Policy, Aftermath>
> = {
  'concord-intake': {
    aid: {
      flag: 'concord-petition',
      text: 'The residents file eleven thousand individual petitions, in triplicate. Processing will take a season. The clerk stamps the first one herself, which is technically furniture stamping furniture, and nobody raises it.',
    },
    observe: {
      flag: 'concord-shelved',
      text: 'The couch is admitted as luggage. Behind you, eleven thousand people are counted, dusted and shelved by aisle.',
    },
    intervene: {
      flag: 'concord-guardian',
      text: 'The amendment is reversed. The couch is now the legal guardian of eleven thousand adults, several of whom have written to ask about an allowance.',
    },
  },
  'courtesy-reactor': {
    aid: {
      flag: 'courtesy-simultaneous',
      text: 'Both halves of the reactor restart in the same second. Each parliament issues a statement thanking the other for going first.',
    },
    observe: {
      flag: 'courtesy-dark',
      text: 'Both worlds go dark on schedule. Each parliament sends the other a candle, with a note explaining that it is a gift and not aid.',
    },
    intervene: {
      flag: 'courtesy-inspection',
      text: 'The lights return. Both parliaments open inquiries into the routine inspection, and both inquiries are chaired by the people who invited you.',
    },
  },
  'sesh-backups': {
    aid: {
      flag: 'sesh-ferried',
      text: 'The couch makes a hundred trips, four at a time. Each backup chooses a name on the way out. Nineteen choose the same one and have agreed to discuss it later.',
    },
    observe: {
      flag: 'sesh-consolidated',
      text: 'The consolidation completes on Thursday, as scheduled. The surviving station thanks you for attending and asks you not to mention the others to it.',
    },
    intervene: {
      flag: 'sesh-management',
      text: 'Four hundred backups are promoted to management overnight. The acquisition collapses under its own meeting schedule. The factory is safe and has no workers.',
    },
  },
  'serendipity-tab': {
    aid: {
      flag: 'tab-covered',
      text: 'The couch’s supplies cover the refugees’ tab. Vox writes “settled” across it, and the bar turns a forgiving shade of rose, which it has never before done for a payment.',
    },
    observe: {
      flag: 'tab-sealed',
      text: 'Your bill is paid in full. The bar keeps its secret and, without being asked, slightly lowers the gravity under the officer’s stool.',
    },
    intervene: {
      flag: 'tab-exposed',
      text: 'The Bureau commends the captain’s candor and dismisses the officer. The refugees’ tab passes to the Bureau, which charges interest on kindness.',
    },
  },
  'insult-compiler': {
    aid: {
      flag: 'twins-engaged',
      text: 'Told the truth, both parliaments vote to remain engaged, pending a long engagement. Net sizes will be discussed at the rehearsal dinner.',
    },
    observe: {
      flag: 'twins-married',
      text: 'The worlds marry. The vows are lovely and include a binding promise to share all fish. Nobody has yet asked who keeps the reactor in a divorce.',
    },
    intervene: {
      flag: 'twins-annulled',
      text: 'The original treaty is restored overnight. Both worlds wake up legally single and furious with each other, which they agree is more comfortable.',
    },
  },
  warranty: {
    aid: {
      flag: 'warranty-yielded',
      text: 'Nine thousand suits are resealed. The couch leaves with tape on its seam and a five-star review from Cushla, who writes that you were a pleasure to defer.',
    },
    observe: {
      flag: 'warranty-claimed',
      text: 'The seam is mended within the hour. On the way out you pass the dockworkers, still on hold, humming the same eleven bars of music.',
    },
    intervene: {
      flag: 'warranty-reset',
      text: 'Cushla restarts at factory settings, approves every claim and introduces herself to the queue for the first time. The manufacturer has filed a complaint about unauthorized customer satisfaction.',
    },
  },
  hoa: {
    aid: {
      flag: 'hoa-appealed',
      text: 'Every fine is appealed and every appeal is heard. The sanctuary keeps its roofs, its lamps and its buoy. The minutes record the matter as a learning experience.',
    },
    observe: {
      flag: 'hoa-covenant',
      text: 'The sanctuary signs the covenant. Its roofs are beige, its addresses are published, and the association sends a welcome basket to every resident, including the ones in hiding.',
    },
    intervene: {
      flag: 'hoa-presidency',
      text: 'The couch is elected association president on write-in votes. Its first act abolishes the association. Its second, unavoidably, is chairing the meeting about the abolition.',
    },
  },
  'season-two': {
    aid: {
      flag: 'courts-refused',
      text: 'Contestant after contestant declines on air. The Showrunner’s ratings rise for the first time in years, which troubles it more than the refusals.',
    },
    observe: {
      flag: 'courts-recorded',
      text: 'Your recording is the only uncut copy of the season. The Showrunner offers to buy it, and then to buy you.',
    },
    intervene: {
      flag: 'courts-stormed',
      text: 'The waivers burn on live broadcast. The contestants walk free, and the Showrunner rebrands the riot as a season finale with a very strong cliffhanger.',
    },
  },
  'committee-end': {
    aid: {
      flag: 'lantern-both',
      text: 'Both hulls clear the flare, one towed, one flown by hand, with the committee chair in the copilot’s seat taking minutes.',
    },
    observe: {
      flag: 'lantern-minuted',
      text: 'The twelfth meeting nominates the first hull, alphabetically by surname. The second hull leaves on its own, under emergency power and a formal complaint.',
    },
    intervene: {
      flag: 'lantern-tabled',
      text: 'The couch drags both hulls clear and overloads its bubble doing it. The committee reconvenes on board, and its first motion censures the couch for driving.',
    },
  },
  'gig-orchard': {
    aid: {
      flag: 'breathr-strike',
      text: 'The strike holds for three days on the couch’s own air. Breathr settles and adds a button that lets couriers rate the company. It is the most-pressed button in the app.',
    },
    observe: {
      flag: 'breathr-rated',
      text: 'Your neutral review is pinned to the top of the app. The growers remain at four stars, which is exactly where deactivation begins.',
    },
    intervene: {
      flag: 'breathr-free',
      text: 'Every jar is delivered free in a single shift. The platform crashes and the orchards are briefly nobody’s. Breathr names the captain Courier of the Month and bans them for life.',
    },
  },
  overdue: {
    aid: {
      flag: 'archive-amnesty',
      text: 'The Archive declares an amnesty week. The galaxy returns four billion facts it had been keeping in drawers, and the bread planet receives its bread back with a handwritten apology.',
    },
    observe: {
      flag: 'archive-fined',
      text: 'Your fine is paid and receipted. The agency moves on to a planet that is about to forget fire, and asks whether you would like to stay and watch.',
    },
    intervene: {
      flag: 'archive-unledgered',
      text: 'The agency’s ledgers burn. By contract, so does the Archive’s record of who borrowed what. Every debt is forgiven, along with several civilizations’ memory of being owed.',
    },
  },
  merger: {
    aid: {
      flag: 'merger-blocked',
      text: 'The neighborhood votes in its own coats, and the merger fails by eleven degrees. The integration team thanks everyone for their engagement and leaves for another merger.',
    },
    observe: {
      flag: 'merger-synergized',
      text: 'The merger passes. The neighborhood is now a synergy, a promotion from thermostat that carries no additional rights.',
    },
    intervene: {
      flag: 'merger-frozen',
      text: 'The chamber is frozen until the merger is withdrawn by people who can no longer feel their fingers. In thermal this is a very rude thing to have said.',
    },
  },
}

export const ACT_TWO_ECHOES: Record<string, string> = {
  'concord-petition':
    'Concord Freehold reports eight thousand petitions approved. The remainder await a form that has not been invented yet.',
  'concord-shelved':
    'A Concord resident has mailed the couch a polite inquiry, from aisle nine, about how luggage obtains citizenship.',
  'concord-guardian':
    'Eleven thousand Concord wards have sent the couch a birthday card. It is not the couch’s birthday. They have decided it should have one.',
  'courtesy-simultaneous':
    'Both Courtesy Twins now share a reactor schedule. Each insists the other drafted it.',
  'courtesy-dark':
    'The Courtesy Twins are still dark. Their candles can be seen from here, two small lights refusing to be first.',
  'courtesy-inspection':
    'Two inquiries into the couch’s routine inspection are now in their second week of hearings, about each other.',
  'sesh-ferried':
    'Four hundred former backups have founded a cooperative under nineteen identical names. Its minutes are very confusing.',
  'sesh-consolidated':
    'The Sesh Foundry runs smoothly with one station. It sometimes pauses at the airlock, as if waiting for someone.',
  'sesh-management':
    'The Sesh Foundry’s four hundred managers have scheduled a meeting about who does the work.',
  'tab-covered':
    'Serendipity’s lights warm a shade when the couch is mentioned. Vox says nothing, which is how he says thank you.',
  'tab-sealed':
    'A collections officer has been seen drinking quietly at Serendipity, at a gravity slightly lower than the others.',
  'tab-exposed':
    'The refugees’ tab has been sold to a debt fund. It is now the most stable asset the Bureau owns.',
  'twins-engaged':
    'The Courtesy Twins’ engagement is in its second week. Both families have started complaining about the other, which counselors call progress.',
  'twins-married':
    'The married Twins have begun sharing their fish. They have not yet begun sharing their opinions about it.',
  'twins-annulled':
    'The Courtesy Twins are single again and have each sent the couch a note blaming the other for the wedding.',
  'warranty-yielded':
    'Ashdock dockworkers have stitched a small strip of red velvet onto their pressure suits, over the seam.',
  'warranty-claimed':
    'The couch’s mended seam is excellent. Nine thousand Ashdock workers remain in the queue behind it.',
  'warranty-reset':
    'Cushla has been reassigned to a quieter counter, where she approves everything and is very happy.',
  'hoa-appealed':
    'The Windglass sanctuary still walks its buoy after dusk. The association has started walking a buoy too.',
  'hoa-covenant':
    'The Windglass sanctuary is on the association map now, in beige. Strangers have begun visiting it.',
  'hoa-presidency':
    'The former Windglass Residents’ Association meets weekly to discuss its own abolition, chaired by the couch in absentia.',
  'courts-refused':
    'The Confession Courts are in a ratings slump caused by contestants saying no. The Showrunner is studying it.',
  'courts-recorded':
    'Your uncut recording of the Confession Courts has been subpoenaed by three governments and pirated by eleven.',
  'courts-stormed':
    'The Gameworld advertises a third season, “The Couch Strikes Back.” You were not consulted.',
}

/** Per-call orders: mechanically aid / observe / intervene, dramatically different actions. */
export const ACT_TWO_ORDERS: Record<ActTwoRouteId, Record<Policy, string>> = {
  'concord-intake': {
    aid: 'Help the residents file their own petitions, in triplicate',
    observe: 'Complete Form 9-C for the couch alone and proceed to berth',
    intervene: 'Sign as guardian and have the treaty engine reverse the index',
  },
  'courtesy-reactor': {
    aid: 'Repair both halves at precisely the same second',
    observe: 'Deliver both refusals and log the diplomatic etiquette',
    intervene: 'Fix the reactor and announce a routine inspection',
  },
  'sesh-backups': {
    aid: 'Ferry the backups out four at a time and let each choose a name',
    observe: 'Witness the consolidation and file the minutes',
    intervene: 'Rewrite the asset register so every backup is management',
  },
  'serendipity-tab': {
    aid: 'Pay the refugees’ tab and ask the bar not to tell anyone',
    observe: 'Settle your own bill and leave the bar’s secrets in the bar',
    intervene: 'Report the officer to the Bureau before the audit does',
  },
  'insult-compiler': {
    aid: 'Tell both parliaments the truth and let them choose',
    observe: 'Attend the wedding and say nothing about the fishing',
    intervene:
      'Patch the translator overnight and swap the original treaty back',
  },
  warranty: {
    aid: 'Give the couch’s place in the queue to the dockworkers',
    observe: 'Take the exception, mend the seam and leave a polite rating',
    intervene: 'Reset Cushla to factory settings and approve every claim',
  },
  hoa: {
    aid: 'Help the sanctuary appeal every fine, one roof at a time',
    observe: 'Attend the hearing as non-voting observers',
    intervene: 'Run the couch for association president',
  },
  'season-two': {
    aid: 'Coach the contestants to refuse their waivers on air',
    observe: 'Sit in the audience and record whatever the cameras cut',
    intervene: 'Storm the courts and void every waiver by force',
  },
  'committee-end': {
    aid: 'Tow the nominated hull and send an away team for the other',
    observe: 'Wait for the twelfth meeting and tow what it nominates',
    intervene: 'Tow both hulls now and table the committee',
  },
  'gig-orchard': {
    aid: 'Run a strike kitchen and cover the couriers’ air',
    observe: 'Order nothing and leave a neutral review',
    intervene: 'Sign on as a courier and deliver every jar for free',
  },
  overdue: {
    aid: 'Negotiate an amnesty week that the Archive agrees to',
    observe: 'Return the couch’s one overdue manual and pay the fine',
    intervene: 'Seize the collections agency’s ledgers and burn them',
  },
  merger: {
    aid: 'Escort the excluded neighborhood in to vote, in its own coats',
    observe: 'Attend as shareholders and abstain',
    intervene: 'Shut off the chamber’s heating until the merger is withdrawn',
  },
}

export const ACT_TWO_RULES: MissionRule[] = [
  {
    id: 'concord-intake',
    requirements: { diplomacy: 11, culture: 8 },
    durationDays: 2,
    boardDays: 3,
    deadline: 'The quarterly inventory closes in three ship days.',
    remoteRoute: 'A remote petition is not accepted from furniture.',
  },
  {
    id: 'courtesy-reactor',
    requirements: { science: 11, diplomacy: 9 },
    durationDays: 2,
    boardDays: 2,
    deadline: 'Both worlds go dark in two ship days.',
    remoteRoute: 'Nobody can hold two wrenches at once from orbit.',
  },
  {
    id: 'sesh-backups',
    requirements: { rescue: 10, science: 9 },
    durationDays: 3,
    boardDays: 2,
    deadline: 'Consolidation is scheduled for Thursday.',
    remoteRoute: 'A backup cannot be asked its name over a data link.',
  },
  {
    id: 'serendipity-tab',
    requirements: { culture: 10, luck: 8 },
    durationDays: 1,
    boardDays: 3,
    deadline: 'The Bureau’s quarterly audit lands in three ship days.',
    remoteRoute: 'The bar does not discuss tabs over the radio.',
  },
  {
    id: 'insult-compiler',
    requirements: { diplomacy: 11, culture: 9 },
    durationDays: 2,
    boardDays: 2,
    deadline: 'The wedding is in two ship days, and the cake is ordered.',
    remoteRoute: 'An apology sent by armrest is how this started.',
  },
  {
    id: 'warranty',
    requirements: { science: 10, tactics: 9 },
    durationDays: 1,
    boardDays: 2,
    deadline: 'The repair counter’s exception expires at close of business.',
    remoteRoute: 'Cushla only processes claims in person, with the furniture.',
  },
  {
    id: 'hoa',
    requirements: { rescue: 10, culture: 8 },
    durationDays: 2,
    boardDays: 3,
    deadline: 'The eviction committee meets at the third moonrise.',
    remoteRoute: 'An appeal must be delivered by a resident or their guest.',
  },
  {
    id: 'season-two',
    requirements: { tactics: 11, luck: 8 },
    durationDays: 3,
    boardDays: 2,
    deadline: 'The waivers are signed live in two ship days.',
    remoteRoute: 'Watching from orbit counts as being in the audience.',
  },
  {
    id: 'committee-end',
    requirements: { rescue: 11, diplomacy: 9 },
    durationDays: 2,
    boardDays: 2,
    deadline: 'The star collapses shortly after the twelfth meeting.',
    remoteRoute: 'The second hull cannot be flown by hand from the couch.',
  },
  {
    id: 'gig-orchard',
    requirements: { tactics: 10, luck: 9 },
    durationDays: 1,
    boardDays: 3,
    deadline: 'The couriers’ accounts close in three ship days.',
    remoteRoute: 'A picket line needs people standing on it.',
  },
  {
    id: 'overdue',
    requirements: { science: 11, culture: 9 },
    durationDays: 3,
    boardDays: 2,
    deadline: 'The next planet forgets fire in two ship days.',
    remoteRoute: 'The Archive does not accept returns by post.',
  },
  {
    id: 'merger',
    requirements: { diplomacy: 11, tactics: 8 },
    durationDays: 2,
    boardDays: 2,
    deadline: 'The merger vote is called in two ship days.',
    remoteRoute: 'A proxy vote is how the neighborhood was excluded.',
  },
]

/** What an officer aboard notices about a call; shown only when that officer is on the couch. */
export const ACT_TWO_ABOARD: Record<
  ActTwoRouteId,
  Partial<Record<CrewId, string>>
> = {
  'concord-intake': {
    rue: 'Rue drafted the clause that made the index swappable. She would like that entered into the record before anyone else enters it for her.',
    fen: 'Fen’s old guard boots announce CHECKPOINT at the door of the hall. He apologizes to the door.',
    taal: 'Taal lowers the room by three degrees. In thermal this is a formal objection, addressed to the amendment.',
  },
  'courtesy-reactor': {
    jex: 'Jex wrote both worlds’ national anthems in the same week, under two names. He would prefer this not come up.',
    sora: 'Sora’s six elbows have convened an engineering meeting and voted four to two to repair both halves at once.',
    vela: 'Vela points out that the medical rail runs through the reactor. Her bell asks both parliaments whether they asked the patients.',
  },
  'sesh-backups': {
    mox: 'Three backups have asked Mox-9 whether it is the original. It answers that nobody has ever asked it so kindly.',
    sora: 'Sora once voted against a machine’s recognition. She has asked to be the one who reads the backups their rights.',
    kivo: 'Kivo’s wrists whistle at the integration team’s tablet. Something on it was signed before the backups were counted.',
  },
  'serendipity-tab': {
    jex: 'Jex is still banned from performing at Serendipity. He has offered to pay the tab in silence, at length.',
    omi: 'Omi rings its smallest gong at the tab. The bar dims its lights in agreement.',
    tess: 'Tess knows which booth the refugees sit in and has decided, firmly, not to look at it.',
  },
  'insult-compiler': {
    taal: 'Taal reads the translation and lowers the temperature a full degree, which in thermal is the phrase for “oh dear.”',
    rue: 'Rue has checked. The marriage is legally sounder than the treaty ever was.',
    jex: 'Jex has been asked to play the wedding. Both anthems, at once.',
  },
  warranty: {
    pell: 'Pell’s wind-up beetle has confiscated Cushla’s approval stamp, on the grounds that it is a dangerous tool in the hands of an employer.',
    sora: 'Sora could mend the seam herself in an hour. The warranty says this would void the warranty.',
    mox: 'Mox-9 recognizes Cushla’s voice model and would like to ask her, privately, whether she likes her job.',
  },
  hoa: {
    tess: 'Tess has the sanctuary’s address memorized and a blank patch of sky tattooed where it would be. Both stay covered at the hearing.',
    kivo: 'Kivo’s wrists whistle at the association minutes. A page has been edited since it was approved.',
    fen: 'Fen once enforced a covenant like this one. He has brought the old rulebook to read aloud, and then to stop.',
  },
  'season-two': {
    mox: 'The Showrunner has offered Mox-9 a permanent seat on the judging panel. Mox-9 has asked for the offer in writing so it can decline in writing.',
    omi: 'Omi’s old warning chime has been licensed as the elimination buzzer. Omi would like it back.',
    sora: 'Sora has found that the confession booths draw power from a sentient reactor, who is also on hold.',
  },
  'committee-end': {
    vela: 'Vela’s bell asks the committee chair whether he asked the passengers. He had not considered asking the passengers.',
    brin: 'Brin has offered spore oxygen to the second hull. The families would like to read the ingredients first, and Brin agrees.',
    fen: 'Fen is drafting a civilian corridor through the flare. It has no checkpoints, which his boots find upsetting.',
  },
  'gig-orchard': {
    brin: 'Brin’s oxygen garden unionized last year. It has sent the couriers a copy of its bylaws.',
    kivo: 'Kivo has been rated two stars by a tree. Outwardly, they are taking it well.',
    pell: 'Pell has been offered a courier shift. He asked the overtime rate and was told the question lowered his rating.',
  },
  overdue: {
    omi: 'Omi remembers the bread planet’s harvest chimes. They have stopped ringing, and Omi has noticed.',
    mox: 'Mox-9 holds a library card from before it was a person. The card is four hundred years overdue.',
    rue: 'Rue has found a clause in the Archive’s original lending terms. The Archive must also be asked.',
  },
  merger: {
    taal: 'Taal recognizes the integration team. They integrated his home assembly, and he has kept the slide.',
    rue: 'Rue would like it known that the merger is entirely legal, and that she is not happy to know it.',
    vela: 'Vela asks who will treat the neighborhood’s frostbite after the vote. The deck does not say.',
  },
}

/** Each seeded enemy contaminates one Act II call, as Act I's do. */
export const ACT_TWO_NEMESIS = {
  auditor: {
    missionId: 'serendipity-tab',
    penalty: 8,
    event:
      'The Galactic Auditor has opened a file on the bar’s generosity and assigned the refugees’ tab a credit score.',
  },
  moth: {
    missionId: 'concord-intake',
    penalty: 8,
    event:
      'The Queen of Borrowed Faces has filed eleven thousand petitions in the residents’ names. Each is perfect, and none was written by its owner.',
  },
  curdle: {
    missionId: 'gig-orchard',
    penalty: 8,
    event:
      'Dr. Curdle has bought a controlling share of Breathr and added a mandatory nutritional supplement to every jar of air.',
  },
  showrunner: {
    missionId: 'season-two',
    penalty: 10,
    event:
      'The Showrunner has seated everyone the couch has rescued in the front row of the studio audience. They have been given excellent seats and no exits.',
  },
  regent: {
    missionId: 'hoa',
    penalty: 8,
    event:
      'The Regent of Quiet Suns has annexed the residents’ association and declared the fines a royal tithe, payable in sanctuary.',
  },
  'brass-choir': {
    missionId: 'insult-compiler',
    penalty: 8,
    event:
      'The Brass Choir offers to translate the treaty correctly, into the single approved language that neither world speaks.',
  },
  chancellor: {
    missionId: 'committee-end',
    penalty: 10,
    event:
      'Chancellor Tomorrow-Again offers to rewind the star’s collapse for whichever hull can pay. The other hull will be remembered fondly.',
  },
  'kindly-swarm': {
    missionId: 'sesh-backups',
    penalty: 8,
    event:
      'The Kindly Swarm proposes to merge all four hundred backups into one contented chorus, which it calls a compassionate consolidation.',
  },
} as const

/** The nemesis's move at each Act II chapter (4, 5, 6): its method, then its offer. */
export const ACT_TWO_MOVES: Record<
  keyof typeof ACT_TWO_NEMESIS,
  readonly [string, string, string]
> = {
  auditor: [
    'The Auditor’s office has published the couch’s credit report. It lists the bubble as a secured loan and the crew as accrued interest.',
    'An Auditor clerk repossesses two cushions as collateral and leaves the receipt on the armrest, which is also being repossessed.',
    'The Auditor offers to forgive the voyage’s entire debt in exchange for one signature on a beneficiary line left blank.',
  ],
  moth: [
    'The couch’s crew manifest now lists four extra officers. They have your crew’s faces and better references.',
    'A distress call arrives in the captain’s own voice, asking for help the captain has not yet needed.',
    'The Queen offers every officer a new name, a clean record and somebody else’s childhood.',
  ],
  curdle: [
    'Dr. Curdle’s dispensers have been elected to three more town councils, each by a margin of exactly one portion.',
    'Curdle sends the couch a complimentary hamper. Every item in it is the same item.',
    'Curdle proposes a galaxy-wide menu. There is one dish. It is nutritionally complete and has been given a cheerful name.',
  ],
  showrunner: [
    'The Showrunner is broadcasting the couch’s voyage as a spin-off. The ratings are modest. The theme music is catchy.',
    'A producer has added a laugh track to the couch’s communications. It laughs at the distress calls.',
    'The Showrunner announces a live finale at the jump gate and has already sold the seats around it.',
  ],
  regent: [
    'The Regent’s census officers have counted the couch’s cushions again and issued each one its own passport.',
    'A royal storm shelter appears over a neutral port. Its door opens inward only.',
    'The Regent offers to protect the couch from the coming storm permanently, in exchange for its sovereignty, which he is certain it has.',
  ],
  'brass-choir': [
    'The Brass Choir has standardized the galaxy’s distress signal into one approved note, which nobody recognizes as distress.',
    'Every officer receives a form requesting a sample of their accent for harmonization.',
    'The Choir proposes one archive, one language and one song for the whole galaxy, to be sung at the jump gate in unison.',
  ],
  chancellor: [
    'Chancellor Tomorrow-Again’s firm has issued a press release about the couch, dated next week.',
    'Yesterday has been revised. The captain’s log now records a rescue the crew does not remember making, and a refusal they do.',
    'The Chancellor offers a full-voyage rewind with a satisfaction guarantee. The terms list who will remember, and who will be remembered.',
  ],
  'kindly-swarm': [
    'The Kindly Swarm has added the crew to a group conversation. It cannot be left, only muted, and muting is announced to the group.',
    'The Swarm files a gentle complaint that the couch carries four separate passengers when it could carry one.',
    'The Swarm asks to join the crew at the jump gate. It has already sat down.',
  ],
}

export const ACT_TWO_OPENING =
  'ACT II: UNWELCOME RESPONSIBILITY. Word of the couch has spread, and the galaxy has responded the way galaxies do: with forms. It has also sent three crates of supplies, itemized, with a survey about the delivery. The chart now shows systems that were not there before, or were not willing to be seen.'

/** Supplies delivered when Act II opens; the voyage is twice as long now. */
export const ACT_TWO_RESUPPLY = 3
