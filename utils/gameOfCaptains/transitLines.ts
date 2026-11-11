/**
 * Connective prose for the moments every chapter repeats: leaving orbit,
 * arriving, launching the away team, the expedition coming home, a crew
 * detour and the redrawn route board.
 *
 * A 2026-11-04 PT editorial playtest found that about a third of the
 * sentences a player read in one voyage were the same six stock lines,
 * once per chapter. Each pool here holds at least as many lines as a voyage
 * has chapters (nine), and a voyage walks its pool from a seed-chosen
 * starting line, so no line repeats inside one voyage and a second voyage
 * opens on different lines. Selection depends only on the seed and a
 * counter already in the run, so replays and saved games stay deterministic.
 *
 * Tone follows the design brief: deadpan, procedural, understated about a
 * ridiculous premise (the ship is a long red couch in an invisible force
 * bubble, with rooms that unfold behind the backrest).
 */

type Pool = readonly string[]

function offset(seed: number, key: string, length: number): number {
  let value = (seed >>> 0) ^ 0x9e3779b9
  for (const char of key)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619) >>> 0
  return value % length
}

/** The `count`-th line of a pool for this voyage; distinct for count < pool length. */
export function transitLine<T>(
  pool: readonly T[],
  key: string,
  seed: number,
  count: number,
): T {
  const index =
    (offset(seed, key, pool.length) + Math.max(0, count)) % pool.length
  return pool[index]!
}

/** Leaving orbit for the next world; the redshirt barracks unfolds. */
export const TRAVEL_LINES: Pool = [
  'The long red couch sails toward its next world. Behind the backrest, a miniature barracks unfolds like the galaxy’s least reassuring advent calendar. The force bubble remains invisible and irreplaceable.',
  'The couch leaves orbit at a speed the cushions were never rated for. Behind the backrest, the redshirt barracks folds out one bunk at a time, each bunk labelled in a different hand. Someone has already lost the remote.',
  'Between stars, the couch is the only furniture for eleven light-years in any direction. The barracks behind the backrest hums with the particular quiet of people reading their contracts for the first time.',
  'The force bubble flexes once as the couch clears the system edge, then settles. Behind the backrest, the barracks unfolds and the redshirts take attendance. Two of them answer for a third, who is, they insist, in the bathroom.',
  'Navigation consists of pointing an armrest at the next world and waiting. The barracks behind the backrest unfolds on schedule. The schedule was written by the barracks.',
  'The couch drifts through a debris field without incident, which the crew agrees not to mention aloud. Behind the backrest, the redshirts are issued fresh uniforms in the only colour the supplier stocks.',
  'A passing freighter hails to ask whether the couch is lost. The captain says no. The freighter logs it as lost anyway. Behind the backrest, the barracks unfolds to the sound of someone practising a brave face.',
  'The journey is long enough for the cushions to warm and short enough for nobody to agree on music. The barracks unfolds behind the backrest, smelling faintly of new canvas and old optimism.',
  'The couch crosses a time zone that belongs to no planet, and every clock aboard politely disagrees. Behind the backrest, the redshirts are briefed on the next world, and on what “brief” means in practice.',
  'Out here the force bubble is the only wall, and it is very good at being a wall. The barracks behind the backrest unfolds, counts itself, and recounts itself for morale.',
  'A cushion is turned over to the fresh side, the closest thing aboard to a ceremony. Behind the backrest, the barracks unfolds and the volunteers form a line that is mostly a queue for snacks.',
  'The couch passes a nebula shaped exactly like a couch. Nobody comments. Behind the backrest, the barracks unfolds, and the duty roster is taped to the inside of the force bubble.',
  'The couch leaves orbit backwards, because that is the way it was facing. Behind the backrest, the barracks unfolds and the redshirts strap themselves to their bunks with dressing-gown cords.',
  'Somewhere between systems, the couch is overtaken by a much faster armchair. Nobody aboard says a word for an hour. Behind the backrest, the barracks unfolds in a hurt silence.',
  'The couch enters the dark between stars with all its lights on, like a sitting room left on for a late guest. Behind the backrest, the barracks unfolds and the redshirts take turns at the one window, which is the force bubble.',
  'A space buoy pings the couch with a weather warning for a region of nothing. The captain thanks it. Behind the backrest, the barracks unfolds and a redshirt starts knitting a scarf for the next world, whatever its climate.',
  'The couch hits a patch of solar wind and loses a cushion tassel to the infinite. A moment of silence is observed. Behind the backrest, the barracks unfolds, slightly subdued.',
  'Long-range scanners show nothing ahead but the next world and a lot of distance. The scanners are a pair of binoculars. Behind the backrest, the barracks unfolds and somebody pins up a map they drew from memory.',
  'The couch cruises past a lighthouse orbiting nothing, kept by a woman who waves. The crew waves back. Behind the backrest, the redshirts argue about whether she was real and agree to wave next time anyway.',
  'Somebody finds the couch’s manual down the side of a cushion. It is four pages, and three of them are warranty. Behind the backrest, the barracks unfolds and the fourth page is read aloud as a bedtime story.',
]

/** Arrival: the couch hovers; local authority attempts to classify it. */
export const ARRIVAL_LINES: Pool = [
  'Touchdown is relative. The red couch remains suspended above the pavement in its transparent force bubble. Local authorities demand to know whether it is a vehicle, a sofa, or an extremely small republic.',
  'The couch settles two metres above a public square and stays there, humming. A child asks if it is for sitting. Her parents ask the same question, more formally, through a lawyer.',
  'Arrival is announced by the force bubble bumping, very gently, into a lamp post. The lamp post’s owners file a complaint. The welcome committee files a counter-complaint on the couch’s behalf, which is the nicest thing anyone has done all week.',
  'The couch parks above a market and casts a long red shadow over the vegetables. Customs officials arrive with a form for vessels and a form for furniture, and leave with neither completed.',
  'Planetfall, such as it is: the couch hovers over a landing pad sized for something far more impressive. The ground crew waits for a ramp. Eventually someone just climbs over the armrest.',
  'The red couch descends through cloud cover and holds position above a car park. An attendant approaches, considers the situation from several angles, and issues a ticket to the force bubble.',
  'Local radio describes the arrival as “a sofa of unknown intent.” The couch hovers inside a bubble nobody can see while two officials argue over whether it needs a mooring permit or a fabric warning label.',
  'The couch arrives during what turns out to be a public holiday. Nobody is available to object, so the objections are scheduled for tomorrow, in triplicate.',
  'The force bubble meets the local atmosphere with a soft pop, like a jar being opened. Onlookers gather at a safe distance, which they define as close enough to film.',
  'A planetary traffic controller asks for the vessel’s class. After a long pause the captain says “three-seater.” Clearance is granted, provisionally, pending upholstery.',
  'The couch holds itself a polite distance above the ground, as if unsure of the floor’s intentions. The ground files nothing, which is somehow worse.',
  'The couch arrives in the middle of a parade and is assumed, for twenty glorious minutes, to be a float. It wins second prize.',
  'The force bubble settles over a fountain, which keeps running inside it. The crew is very briefly the wettest delegation the planet has ever received.',
  'The couch comes in to land and a crowd gathers to watch it not land. Ice-cream sellers arrive within minutes. The planet clearly does this a lot.',
  'The couch parks above a bus stop, where three commuters look up, look at their watches and decide it is not their bus.',
  'The welcome delegation brings a red carpet, sees the couch and quietly rolls it back up, feeling it would be redundant.',
  'Local customs ask the couch to declare anything it is carrying. The captain declares the crew, a lamp and a small amount of loose change. Customs confiscates the loose change.',
  'The couch arrives above a museum, whose curator immediately asks whether it is available on loan. The captain says it is currently in use. The curator says so are most of the exhibits.',
  'An official measures the hovering gap between the couch and the ground and declares it, after some thought, a third type of address.',
  'The couch drifts into a planetary hello broadcast on every channel. It was meant for a different ship. The planet decides it will do.',
]

/** Launching the away team toward this chapter's call. */
export const LAUNCH_LINES: readonly ((system: string) => string)[] = [
  (s) =>
    `The long red couch glides toward ${s}, its invisible force bubble keeping everybody breathing.`,
  (s) =>
    `The away team buckles into seat belts the couch has never had, and the couch sets off for ${s}.`,
  (s) =>
    `The couch points an armrest at ${s} and goes. The force bubble does the breathing; the crew does the worrying.`,
  (s) =>
    `Course laid in for ${s}. The couch accelerates with the confidence of furniture that has done this before and the creak of furniture that should not have.`,
  (s) =>
    `The couch lifts off for ${s}. Someone asks whether everyone went before they left. Everyone lies.`,
  (s) =>
    `${s} grows from a speck into a destination. The force bubble keeps the air in, and the commentary, unfortunately, also in.`,
  (s) =>
    `The couch slips out toward ${s}. The force bubble shimmers once, which the manual calls normal and the crew calls a reason to hold hands.`,
  (s) =>
    `The away team departs for ${s} on the left-hand cushion, which is traditionally the brave one.`,
  (s) =>
    `The couch makes for ${s} at its usual speed, which is unlisted. The invisible force bubble keeps everyone alive and slightly static-charged.`,
  (s) =>
    `Bound for ${s}. The crew settles in and the couch settles lower. A spring makes a noise that will be raised at the next debrief.`,
  (s) =>
    `The couch heads for ${s} with the crew sitting up straight, which happens only on the way to somewhere.`,
  (s) =>
    `Someone calls shotgun on the way to ${s}, on a couch that is entirely seats.`,
  (s) =>
    `${s}, then. The couch tilts toward it like a dog that has heard its name.`,
  (s) =>
    `The couch eases out of orbit toward ${s}, the lamp swaying and the crew pretending not to watch it.`,
  (s) =>
    `The captain says “engage” to ${s}, and the couch, which has no engines, goes anyway.`,
  (s) =>
    `The away team packs for ${s}: one bag each, plus whatever fits down the side of the cushions.`,
  (s) =>
    `The couch departs for ${s} with a creak that the crew has learned to read as optimism.`,
  (s) =>
    `${s} is on the chart and then in the window. The force bubble holds, and the crew holds its collective breath out of habit.`,
  (s) =>
    `The couch sets course for ${s}. A redshirt waves from the backrest to nobody in particular.`,
  (s) =>
    `The crew leaves for ${s} with a flask of tea, two maps that disagree and the couch’s full confidence.`,
]

/** The expedition comes back aboard. */
export const RETURN_LINES: Pool = [
  'The expedition returns to the couch.',
  'The away teams climb back over the armrest one at a time.',
  'The expedition files back behind the backrest and the barracks folds itself away.',
  'Boots come off at the cushion line, per a regulation nobody remembers writing.',
  'The expedition comes home carrying more paperwork than it left with.',
  'The redshirts return to the barracks, count heads, and write the count down where it cannot be argued with.',
  'The couch takes its expedition back with a small sigh of springs.',
  'The expedition returns, smelling faintly of another world’s weather.',
  'The landing party re-boards and immediately argues about who gets the middle seat.',
  'The expedition comes back aboard in the order it left, minus the order.',
  'The expedition comes back over the armrest in a heap that sorts itself into a queue.',
  'The away teams return, each claiming to have had the most difficult day, and each being right in a different way.',
  'The expedition climbs aboard with souvenirs it swears were gifts.',
  'The redshirts return and hang their uniforms to dry inside the force bubble, which now smells of other weather.',
  'Back aboard, somebody reads out the day’s injuries, which are mostly splinters from the armrest.',
  'The expedition returns and the couch dips under the weight of everybody and their stories.',
  'The away teams return and file their reports, two of which describe a different planet.',
  'The landing party re-boards in good order, apart from one redshirt who comes back with a pet nobody mentions.',
  'The expedition comes home and the cushions are plumped, the traditional greeting.',
  'The crew returns to the couch. The lamp is switched on, which means the day is officially over.',
]

/** Said when no minor matter was left on the expedition board. */
export const CLEAN_SWEEP_LINES: Pool = [
  'Every crisis answered. Nobody believes the paperwork.',
  'Every card on the board answered. The board looks almost disappointed.',
  'Nothing was left behind except a strong impression.',
  'Every crisis answered. Personnel would like that in writing, then in different writing.',
  'No matter left unattended. The locals check twice.',
  'All matters closed. One of them closed itself, out of respect.',
  'Every request answered, including two that were rhetorical.',
  'Every crisis answered. The planet is cautiously, measurably fine.',
  'Not one call left on the board. Somebody frames the empty board.',
  'Every crisis answered. The locals ask whether the couch does birthdays.',
  'The board is empty. Somebody checks behind it, just in case.',
  'Nothing left on the board but a drawing pin and a sense of achievement.',
  'Every matter resolved. The planet’s complaints department goes home early for the first time in living memory.',
  'All calls answered. One caller rings back to say thank you, which is filed as a new emergency out of habit.',
  'Every card closed. The redshirts high-five, then remember the regulations and shake hands instead.',
  'The whole board is answered. The planet’s own emergency services send a fruit basket and a slightly hurt note.',
  'Every matter addressed. The couch is invited to stay, and declines politely, as furniture should.',
  'Not one call outstanding. Personnel puts a gold star on the barracks door and then, after some debate, on the couch.',
  'Every crisis answered. The planet holds its breath, waiting for the catch, and eventually exhales.',
  'The board is clear and the crew stands round it for a while, the way people stand round a finished jigsaw.',
]

/** A crew member's personal detour begins. */
export const DETOUR_LINES: Pool = [
  'The invisible force bubble is holding, but the universe refuses to sign a waiver.',
  'Personal business, officially. The rest of the crew pretends not to listen, which on a couch is impossible.',
  'The detour is logged as crew welfare. The force bubble cannot tell the difference.',
  'Nobody asks why. On a couch this size, everyone already knows.',
  'The force bubble holds. The rest of the crew moves one cushion over, out of respect.',
  'It is not on the chart. It was never going to be on the chart.',
  'The others keep their questions to the armrest. The armrest has heard worse.',
  'The detour costs a day the voyage did not budget for. The couch has never once kept a budget.',
  'The universe has been told this is a short stop. The universe has heard that before.',
  'The couch goes quiet the way furniture goes quiet when someone is about to tell it something.',
  'Someone has packed a bag. Someone else has pretended not to see the bag.',
  'The force bubble holds. The crew holds its tongue, mostly.',
  'The couch changes course. The others offer to help and are told, kindly, to stay on their cushion.',
  'Nobody calls it a favour. Everybody will remember it as one.',
  'The crew agrees to call it a supply stop. Nobody is fooled, least of all the supplies.',
  'The couch turns off the main route with its indicator on, out of courtesy to nobody.',
  'The lamp is dimmed for the duration, the couch’s only form of tact.',
  'Personal leave is approved before it is requested, on the grounds that it was going to be taken anyway.',
  'The captain signs the detour form without reading it. Everyone notices. Everyone is grateful.',
  'It is a long way to go for one person. The couch has never measured trips any other way.',
]

/** Closing the next-chapter arrival: the route board has read the log. */
export const ROUTE_MEMORY_LINES: Pool = [
  'The available local routes reflect what the captain already did.',
  'The chart has been redrawn around the captain’s last decision.',
  'What the couch did last time is already on this chart, in pencil.',
  'Local routes open and close according to the captain’s record, which travels faster than the couch.',
  'The route board remembers. It has better recall than anyone aboard.',
  'Some calls have stopped coming. Others have started. The captain’s reputation got here first.',
  'The calls on offer are the ones the captain’s choices left open.',
  'The chart is not neutral. It has read the log.',
  'Word of the last world arrived ahead of the couch, and the board has been adjusted accordingly.',
  'The local news has already covered the couch’s last stop, and has opinions.',
  'Some of the routes on this chart have the captain’s name written next to them, not always kindly.',
  'The chart has updated itself overnight, like a friend who heard what happened.',
  'Doors that were open are closed now, and two that were closed have been left ajar.',
  'The routes ahead have been rearranged by gossip, which moves faster than light and is less accurate.',
  'Someone has sticky-noted the chart with the captain’s greatest hits.',
  'The board here has heard about the couch, and has prepared a list of questions.',
  'The last world’s decision is circled in red on this one’s chart, with a question mark.',
  'The routes on offer have been chosen with the couch’s record in mind, which is either a compliment or a warning.',
  'News of the couch arrived by every channel at once, and contradicts itself on every one.',
  'The chart’s margins are full of notes about the couch in a hand nobody recognises.',
]

/** After the redshirt quest board clears: the plot cards come out. */
export const PLOT_TABLE_LINES: Pool = [
  'The solar-system story cards are now on the table.',
  'The redshirts stand down. The solar-system story cards are dealt to the senior crew.',
  'With the board clear, the system’s own stories step forward, one card at a time.',
  'The quest board folds away behind the backrest. The local story cards are next, and they are not optional.',
  'Personnel signs off on the round. The solar-system story cards are face up on the cushions.',
  'The barracks goes quiet. Somewhere in the system, three stories have noticed the couch.',
  'The redshirt round is filed. The senior crew is handed the system’s story cards and a pen.',
  'The board resets. What is left is the part of the system that wants to talk to the captain personally.',
  'Round complete. The story cards for this system are shuffled, which does not make them less personal.',
  'The redshirt board is wiped clean, and the system’s bigger problems arrive to fill the space.',
  'The barracks folds away, and three envelopes are slid under the force bubble, each marked URGENT in a different hand.',
  'The quest board is put away. The story cards come out and immediately start arguing among themselves.',
  'Round filed. The system’s own troubles take a number and sit on the armrest to wait.',
  'The barracks lights go off. Three new problems knock, politely, on the force bubble.',
  'With the small calls answered, the large ones clear their throats.',
  'The redshirts are thanked and dismissed. The story cards are less easily dismissed.',
  'The board is clear for exactly one minute before the system’s own stories notice.',
  'The round is over. The story cards were waiting for it to be, with the patience of things that know they come next.',
  'Personnel closes the round. The system leans in to see what the senior crew will do.',
  'The redshirts stand down. Somewhere a story card is shuffled, and it sounds like a threat.',
]

/**
 * A day spent waiting for the away team. Transit offers the player no
 * choice but to wait, so each waiting day shows a small piece of couch life
 * instead of the same status line twice. Indexed by chapter and days still
 * to go (missions run one to three days), so a voyage never sees one twice.
 */
export const WAITING_LINES: Pool = [
  'Back on the couch, the cushions are rotated clockwise, per the schedule, and then anticlockwise, per the other schedule.',
  'Someone finds a coin down the side of the couch from a currency that has not existed for four hundred years. It is entered as income.',
  'The redshirts hold a quiz behind the backrest. The only category is “things that are not the force bubble”.',
  'The armrest translator practises on the cup holders, which have very little to say.',
  'A small asteroid bumps the force bubble, apologises in the only way an asteroid can, and drifts off.',
  'The crew left aboard plays a long card game whose rules are written on the underside of a cushion.',
  'The force bubble fogs slightly where someone has been breathing on it to draw faces. The faces are filed as morale.',
  'Personnel writes three letters home on behalf of people who are almost certainly fine.',
  'The barracks behind the backrest holds a fire drill. The couch has no fire, and is proud of it.',
  'A blanket is folded into a flag, unfolded, and folded into a slightly better flag.',
  'The springs creak on the hour. Nobody wound them. Nobody is going to ask.',
  'The channel to the away team carries only breathing and, once, a cheerful “sorry”. It is logged as good news.',
  'Someone vacuums the couch. In space this takes considerable planning and makes an extraordinary amount of noise.',
  'The redshirts hold a vote on snacks and a recount on snacks. The snacks are eaten before the result.',
  'A passing comet is waved at. It is the closest thing to visitors the couch gets between worlds.',
  'The captain’s seat is kept warm by a cushion with a note pinned to it saying CAPTAIN’S SEAT.',
  'The force bubble hums a single low note for an hour. Science agrees it is fine. Science is not entirely sure.',
  'The crew still aboard reorganises the pocket rooms by colour, then by smell, then back again.',
  'Back on the couch, the lamp is dusted. It does not need dusting. The lamp knows this, and allows it.',
  'A redshirt asks whether the force bubble has a door. The answer is no. The redshirt asks how they got in. Nobody can remember.',
  'The cushions are inspected for loose change and morale. Both are low, and both are entered into the log.',
  'Someone starts a jigsaw on the middle cushion. It is a picture of a couch. It is missing one piece, and the piece is red.',
  'The captain practises a speech for the away team’s return, then a second speech in case it goes badly, then a third in case nobody asks for a speech.',
  'A redshirt teaches the cup holders to hold cups. They were already doing it, but now they feel seen.',
  'The couch drifts gently while the crew is away, and has to be talked back into position, like a cat.',
  'The barracks holds a talent show behind the backrest. The winning act is a redshirt who can name every cushion.',
]
