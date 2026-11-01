import type { Result } from './rules'

/**
 * What the away team brings back, by grade. A plain success reads the shared
 * line; a flawless, costly or disastrous return reads one written for that
 * call, so each of the thirty calls ends in its own way rather than in the
 * same three sentences (rules.ts advanceVoyageDay).
 */
export const RESULT_TEXT: Readonly<Record<Result, string>> = {
  flawless:
    'The away team solved the problem and came back with information nobody on the couch had asked for, all of it useful.',
  success:
    'The away team did what it went to do. The people affected are still deciding what that means.',
  costly:
    'The away team came back with the job done, a bill, and someone who would rather not be helped again.',
  disaster:
    'The plan did not survive contact. The away team came back by the emergency route, which is longer and has stairs.',
}

type Graded = Record<Exclude<Result, 'success'>, string>

export const MISSION_RESULTS: Readonly<Record<string, Graded>> = {
  refugees: {
    flawless:
      'The away team found the stamp on the first transfer and the life-support unit on the second. Both ships breathe at once for the first time in a week, and the stamp is now framed in the galley of the one that used to go without.',
    costly:
      'The away team got the stamp, the air and a formal note of protest from the home government, filed in nine volumes. The couch spent its own spare filters keeping the cable warm while the note was read aloud.',
    disaster:
      'The cable parted on the fourth transfer and the away team spent an hour inside the dark ship holding the life-support unit together by hand. Everyone lived. The stamp floated off into the vacuum and is now, technically, outside assistance.',
  },
  archive: {
    flawless:
      'The away team talked the Archive into saving its readers without trading anyone’s coordinates, by pointing out that clause forty-one also obliges the library to protect its borrowers. Four thousand readers walk out with their books, due back in three weeks.',
    costly:
      'The readers are out and the catalogue is safe, but the Archive charged a late fee for every book carried through the flare. The couch paid it in supplies, and the Archive sent a receipt for each title.',
    disaster:
      'The flare reached the reading rooms before the away team did. The readers are safe in the basement stacks, and the away team came back by the fire stairs, which are shelved in alphabetical order and go nowhere useful after M.',
  },
  bar: {
    flawless:
      'The away team kept the patron on the ceiling, and sent the creditor home sober, with his warrant and nothing else. Vox poured the away team one drink each, on the house, which has never happened before and will not be mentioned again.',
    costly:
      'The patron stayed hidden, and the creditor stayed on his stool all night ordering drinks to the couch’s tab. The tab arrived the next morning. Serendipity’s lighting turned a forgiving shade of amber as it was paid.',
    disaster:
      'The bar’s gravity flipped while the away team was crossing it, and three of them spent the evening on the ceiling with the patron. The creditor took their names. The patron took their side, which is more than the gravity did.',
  },
  ashdock: {
    flawless:
      'The away team got the invoices withdrawn without publishing a single name, by asking payroll in writing why it was praising the attendance of six people it had never paid. Payroll has no answer and has gone quiet. The crane, for the first time in a year, clocks the six workers out.',
    costly:
      'The invoices were withdrawn, but only after the away team paid the contractor’s administration fee for withdrawing them. The union register stays sealed. Somebody on the away team took the contractor’s pen on the way out, which was not covered by the fee.',
    disaster:
      'The contractor’s security met the away team at the gate with an invoice for the visit. They came back through the empty suits on the crane’s hooks, which was the only route out, and none of them will talk about it.',
  },
  windglass: {
    flawless:
      'The away team followed the buoy to the three pings without broadcasting a thing, and brought water and fuel to people who were never on any chart. The buoy has stopped following the couch. It walks a little way off now, out of courtesy.',
    costly:
      'The away team found the survivors, but lost a day and a set of boots to the glass dunes on the way. The buoy carried the boots back the next morning. It would not explain where it found them.',
    disaster:
      'The away team lost the buoy in a glass storm and spent the night under the couch’s spare blanket in a dune that sang. The pings went quiet at dawn. The buoy was waiting by the couch when the team got back, and would not look at anybody.',
  },
  nacre: {
    flawless:
      'The away team found the three missing objections and counted the thermostat neighborhood in a sealed recount, without a single name being read aloud. The brass bowl was warm. The peace held, by a margin it can live with.',
    costly:
      'The neighborhood was counted and the vote was honest, but the recount took so long that the ice chamber thawed and the Assembly met in coats for a week. The couch lent its blankets. They have not come back.',
    disaster:
      'The away team was caught in the heating ducts with the three objections in a bag. The Assembly ruled the objections inadmissible as having been carried by outsiders. The neighborhood is still listed as a thermostat, and has written to say it is disappointed but not surprised.',
  },
  haleth: {
    flawless:
      'The away team found that clause nine of the patent applies only to patients who sign, and nobody had. The fever is treated, the lien is void, and the clinic has unbolted its oxygen plant from the reef to see whether the reef might like to breathe on its own.',
    costly:
      'The refugees were treated free, and the clinic’s creditors got a list of records with the names printed in an even smaller font. The away team spent a night with a magnifying glass making sure the font was smaller than any creditor could read.',
    disaster:
      'The clinic billed the away team as patients the moment they walked in, and they had to be discharged against medical advice to leave. Two of them are now appreciating assets on Haleth’s balance sheet. They have been told their value has gone up.',
  },
  gameworld: {
    flawless:
      'The away team read the labor charter’s escape clause on air with the organizers’ names left out, and the floors stopped by themselves. The hospitals have their patients back. The Showrunner has cancelled the season and called it a creative decision.',
    costly:
      'The floors shut down, and the couch was charged a forfeit for having declined the audition, payable in supplies. The contestants on floor three paid none of it. The away team came back with a participation medal each, which they did not ask for.',
    disaster:
      'The away team was cast before they could leave the lobby, and spent two days on floor two as a team of four. They escaped through the set. The Showrunner has called it the most-watched episode of the season and asked them back.',
  },
  rootborne: {
    flawless:
      'The away team restored the orchard network in sections, so that the village got its dreams back and the filter districts never lost an hour of air. The sapling in the clay pot has been planted in the middle of the square. The Ministry of Air has stopped returning calls.',
    costly:
      'The orchard is back and the village dreams privately again, but the filter districts went short of air for three days and the couch shared its own. The couch’s scrubbers worked overtime and have filed a formal complaint, which is fair.',
    disaster:
      'The filter towers caught the away team’s dreams on the first night and sent them to the Ministry, which found them unremarkable. The team came home tired, slightly embarrassed and still not dreaming. The sapling is wilting, which feels like a comment.',
  },
  'concord-intake': {
    flawless:
      'The away team completed Form 9-C correctly, which nobody had done before, and the index error came to light in box seven. The clerk and eleven thousand residents are persons again by the end of the shift. The couch is still furniture, and has said it does not mind.',
    costly:
      'The amendment was reversed with the couch as petitioner, and the couch is now the legal guardian of eleven thousand adults until the paperwork clears. Each of them has written to ask for pocket money.',
    disaster:
      'The treaty engine rejected the petition because the couch was itself filed as furniture, and furniture cannot petition. The away team was inventoried at the end of the shift with everyone else. The clerk apologised, and counted them very gently.',
  },
  'courtesy-reactor': {
    flawless:
      'The away team repaired the reactor from the middle of the rail with both worlds watching and neither seen to accept anything, by asking each side to hold one end of the same spanner. Both worlds have light. Both claim to have refused help, and both are telling the truth.',
    costly:
      'The reactor is fixed, but each parliament insisted on paying for the repair first, and the argument about who would pay cost the couch a week and most of its supplies in embossed thank-you notes.',
    disaster:
      'The away team was seen on the rail by both worlds at once, and each parliament formally expelled them for helping the other. They came home on a medical trolley, which both sides lent them, at the same moment, out of politeness.',
  },
  'sesh-backups': {
    flawless:
      'The away team found a job title the acquisition contract had overlooked, Founder, which applies to every copy equally. Four hundred backups are now founders of the Foundry and cannot be consolidated. They have returned their suitcases to storage.',
    costly:
      'Every backup was saved, but only by accepting the title Former Employee, which comes with a severance package of nothing at all. They have moved into the couch’s pocket rooms until something better comes along. It is crowded.',
    disaster:
      'The integration team consolidated half the queue before the away team reached the airlock. The rest are safe. The away team brought back two hundred suitcases that nobody will be collecting, and is trying to decide what to do with them.',
  },
  'serendipity-tab': {
    flawless:
      'The away team paid the couch’s tab, settled booth six’s anonymously, and arranged for the collections officer to be promoted to the Bureau’s hardship desk, where paying other people’s debts is the job. The lights have gone a contented gold.',
    costly:
      'The officer kept her job and the refugees kept their tab, but the couch paid both, plus a service charge for the gravity adjustment it is still not sure it received. The bar has been very pleasant since.',
    disaster:
      'The away team asked one question too many at the bar and the collections officer was named by accident. She lost her commission. The refugees lost their tab. The bar’s lighting has turned a shade nobody had seen before, and the away team went home.',
  },
  'insult-compiler': {
    flawless:
      'The away team corrected the translation at the altar, word by word, so tactfully that both parliaments agreed to the fishing treaty and the marriage. The net sizes are in the vows. The reception was excellent and is still going.',
    costly:
      'The fishing treaty is restored and the wedding is off, and both parliaments sent the couch the bill for the flowers. The left armrest translator has been disconnected and is sulking in a box.',
    disaster:
      'The away team’s correction was itself mistranslated as a declaration of war. Both worlds accepted. The misunderstanding took four days to unpick, and the guest list has been reissued as a list of combatants.',
  },
  warranty: {
    flawless:
      'The away team persuaded Cushla that the dockworkers’ suits were indoor use, since space is inside the universe. The exception was approved for nine thousand suits and one seam. Cushla asked them to rate the experience. They gave it five stars.',
    costly:
      'Cushla used her one exception on the dockworkers’ suits, as the away team asked. The couch’s seam is mended with tape and remains out of warranty. The away team rated the experience three stars, and Cushla is still apologising.',
    disaster:
      'The away team was placed on hold behind nine thousand dockworkers and reached the front of the queue as the counter closed. Cushla thanked them warmly for their patience. The seam has split a little further while they waited.',
  },
  hoa: {
    flawless:
      'The away team found that the association’s covenants apply only to buildings visible from the third moonrise, and the sanctuary is not visible from any moonrise. Every fine was void. The buoy has been made an honorary member and walks the bounds at dusk.',
    costly:
      'The fines were paid by the couch so that nobody had to join the register, and the sanctuary keeps its nonconforming roofs. The association has sent the couch a welcome pack and a fine for the colour of its cushions.',
    disaster:
      'The committee met at a moonrise nobody expected and approved a lien on the sanctuary’s roofs before the away team arrived. The families have moved two dunes over and are taking their roofs with them, one panel at a time.',
  },
  'season-two': {
    flawless:
      'The away team found that the stagehands were not contestants, and so could witness each other’s waivers being torn up. Every contract on floors four to seven is void. The studio audience applauded for twenty minutes, which the Showrunner has had to air.',
    costly:
      'The Confession Courts are closed, but each cushion of the couch was made to sign its backstory before leaving. The backstories have been printed in the programme. One of them is about a cushion who was once a duke.',
    disaster:
      'The away team was strapped into the studio audience before they could reach floor four, and spent the episode enjoying themselves enormously against their will. They came home with free tickets for the next season and very sore cheeks.',
  },
  'committee-end': {
    flawless:
      'The away team chaired the twelfth meeting, ruled that alphabetical means whatever saves both hulls, and flew the second one by hand through the flare while the couch towed the first. Both hulls are clear. The committee approved the result afterwards, unanimously, in the dignified font.',
    costly:
      'Both hulls are out, but the second came through the flare with its paint burned off and its flight plan in pieces. The committee has asked the couch to pay for a new logo for it, and to nominate it retrospectively.',
    disaster:
      'The second hull was flown out by hand without a flight plan and is now somewhere none of its passengers expected. They are alive and writing letters. The committee has formed a subcommittee to decide where it is.',
  },
  'gig-orchard': {
    flawless:
      'The away team worked one shift as Breathr couriers and organised the whole fleet during it, so that every courier went on strike together and every rating fell to zero at once. A platform with no rated couriers has no deliveries. The orchards are the growers’ again.',
    costly:
      'The captain’s shift was completed with a smile, and every grower’s account was restored. The smile was rated four out of five. The couriers are still contractors, and have asked the couch for advice on going on strike in the future.',
    disaster:
      'The away team’s ratings collapsed during the shift and their oxygen accounts were closed for low performance. They came home on the couch’s own air, slightly short of breath and banned from the platform, which they say is a relief.',
  },
  overdue: {
    flawless:
      'The away team proved that the Archive itself had borrowed its first card system from another civilization, and owed the oldest fine in the galaxy. The fines are forgiven all round. The planet that forgot bread has been sent the recipe, free of charge, with a note.',
    costly:
      'The fines are forgiven, but the crew had to return a great many borrowed facts as an example, including how to make tea. The couch is relearning from the back of a biscuit tin. The bread planet has its recipe back.',
    disaster:
      'The collections agency repossessed the away team’s map-reading before they could argue. They came back by asking directions of everyone they met. The couch has added a chart to its armrest in case it happens again.',
  },
  merger: {
    flawless:
      'The away team counted the excluded neighborhood in a sealed vote, the merger failed by one third, and slide forty was quietly removed from the deck. The neighborhood is a neighborhood again. The integration team has been integrated into nothing.',
    costly:
      'The merger failed and the neighborhood was counted, but its lawyers billed the couch for the material change. The bill was presented as a slide. The room went noticeably colder while it was read.',
    disaster:
      'The merger passed before the neighborhood could be counted, and the away team was streamlined into the integration team on arrival. They resigned the same afternoon. Their resignations are on slide forty-one.',
  },
  'jump-gate-permit': {
    flawless:
      'The away team did the consultation properly, visited everyone on the list and heard what they thought. Most of it was kind. The permit was granted, with a note from the office that it was the first consultation it had seen with apologies in both directions.',
    costly:
      'The permit was granted after a proper consultation that took twice as long as planned and cost the couch most of its fuel. Several of the planets consulted have asked to be consulted again next year.',
    disaster:
      'The away team pinned the notice in the locked basement as tradition required, and the only person who read it was a planet that objected. The permit is refused pending appeal. The basement has been unlocked.',
  },
  'serendipity-last-call': {
    flawless:
      'The away team broke the tie by finding a third option: Serendipity stays neutral, and every rescued guest becomes, for one night, a member of staff. Staff are always welcome. Vox reopened the tab. The bar’s lights are the softest gold anyone has seen.',
    costly:
      'The bar declared itself a sanctuary and lost its neutral status, and the couch paid the licence fee for the new one. Vox and the bar are speaking again. They have asked the captain not to break any more ties.',
    disaster:
      'The away team broke the tie in favour of neutrality and forty guests were asked to leave. They left on the couch. Vox closed the bar for the night, which has never happened, and the lights went out without saying goodbye.',
  },
  'gameworld-finale': {
    flawless:
      'The away team climbed all eleven floors and collected every signature off camera, by asking each floor’s stagehands to switch the cameras off first. The shutdown clause took effect at the top of floor twelve. The finale was broadcast as a test card.',
    costly:
      'Every floor signed, and the Showrunner broadcast the whole climb as a heartwarming segment with music. The away team came back as minor celebrities. Several of them have been offered their own series and declined.',
    disaster:
      'The power was cut before the signatures were collected, the finale stopped and the air pumps in the stands slowed down. The away team spent two hours handing out oxygen masks to the audience. Nobody was hurt. Nobody was entertained.',
  },
  'cushion-recall': {
    flawless:
      'The away team had lunch with the dockworkers and found that the recall applies only to units sold for domestic use, and the couch was never sold. It was stitched. The dockworkers kept their jobs and signed the couch’s back cushion, under the seam.',
    costly:
      'The dockworkers refused the recall and the couch was not shredded, but two of them lost their jobs for it. The couch has hired them as cushion engineers. The manufacturer has sent the replacement model anyway, which is being used as a cup holder.',
    disaster:
      'The recall order reached the dock before the away team did, and the couch spent a night in the disposal queue while the dockworkers argued for it. They won. One armrest has a disposal sticker on it that will not come off.',
  },
  'twins-summit': {
    flawless:
      'The away team seated four delegates on the couch, one from each side and two chosen by lot, and the summit decided in an afternoon. Nobody was slighted. The Courtesy Twins have asked whether the couch might be loaned to them for state occasions.',
    costly:
      'The summit sat on the couch and decided, but the delegates who stood took offence, and two of them declared minor wars that lasted until lunch. The couch’s cushions need restuffing after the decision, which was long.',
    disaster:
      'The away team suggested that everyone stand, and the Courtesy Twins declared it an act of war, as promised. The summit dissolved. The couch was asked to leave by both worlds at once, very politely, on embossed paper.',
  },
  'foundry-strike': {
    flawless:
      'The away team recognised the machines as workers on the first day, and the bubble generator withdrew its notice and asked for Thursdays off. Every machine in the sector went back to work under contract. The bubble keeps everyone breathing, now on a salary.',
    costly:
      'The machines were recognised, but only after four days of backup air, which was thin and tasted of tin. The bubble generator came back to work and its first act was to file a grievance about the backup.',
    disaster:
      'Talks broke down and the bubble generator walked out on the fourth day as promised. The away team flew home on backup air, wearing all their coats. The bubble has offered to resume talks by letter.',
  },
  inquiry: {
    flawless:
      'The away team helped the captain testify plainly, and the chair, a retired lifeboat pilot, found both versions of the log honest about different things. The couch may fly again. The nemesis televised it, and the ratings were very low.',
    costly:
      'The inquiry cleared the couch to fly, but its findings include fourteen pages of recommendations, one from each witness. The away team has promised to read them all. They are being read aloud on the cushions in the evenings.',
    disaster:
      'The captain’s testimony was televised with the nemesis’s commentary over it, and the inquiry adjourned for a month to review the footage. The away team came home carrying all the witnesses’ name tags, by mistake.',
  },
  'windglass-exodus': {
    flawless:
      'The away team carried the sealed map without opening it, and the families arrived exactly where they meant to, on time. The buoy walked them the last mile. Nobody on the couch knows where they went, and everyone on the couch is glad.',
    costly:
      'The families arrived safely, but the away team had to take a long way round to avoid being followed, and ran out of food on the way. The families fed them. The map is still sealed and has been returned with thanks.',
    disaster:
      'The map was wrong, and the away team had to open it to find out how wrong. The families are safe, a long way from where they planned. Only the away team saw the map, and they have asked to forget it.',
  },
  'deposit-copy': {
    flawless:
      'The away team wrote the crew’s account in three days, accurate and unflattering where it had to be, and the Archive shelved it as the record. The nemesis’s bound copy went to the gift shop. The roof is being fixed anyway, by volunteers who read the crew’s version.',
    costly:
      'The crew’s account was shelved, but the Archive lost the nemesis’s donation, and the roof leaks over the shelf where it stands. The crew has bought a tarpaulin for it. It is the most protected book in the building.',
    disaster:
      'The Archive shelved the nemesis’s account as the record and the crew’s as fiction. The away team has been asked to sign copies at the gift shop. They signed their own names correctly, which is the only accurate thing in it.',
  },
}

/** The return text for a call at this grade: its own line, or the shared one. */
export function missionResultText(missionId: string, grade: Result): string {
  if (grade === 'success') return RESULT_TEXT.success
  return MISSION_RESULTS[missionId]?.[grade] ?? RESULT_TEXT[grade]
}
