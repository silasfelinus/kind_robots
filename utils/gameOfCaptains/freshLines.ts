/**
 * Rotating comedy for the beats every voyage hits more than once: a deck
 * card that goes wrong, the way the crew walks into a personal errand and
 * what it leaves behind, the coda on a constellation quest, the act
 * openers and the last line before the jump gate.
 *
 * A 2026-11-11 PT seeded probe of 36 voyages found 236 sentences shown in at
 * least half of them. Most were single fixed lines here (one setback per
 * deck and order, one errand entrance per approach), so a returning player
 * reread the same joke on every run. Each beat now draws from a pool picked
 * by the voyage seed and a counter already in the run, so replays and saved
 * games stay deterministic. The original line stays first in every pool.
 *
 * Tone follows the design brief: deadpan, procedural, specific, never mean
 * about the people being helped. The joke is the couch, the forms and the
 * galaxy's commitment to process.
 */
import type { EpisodeChoice, EpisodeDeck } from './episodeConsole'
import { transitLine } from './transitLines'

type Pool = readonly string[]

/** A failed deck card: the objective stays open, and something specific went wrong. */
export const SETBACK_LINES: Record<EpisodeDeck, Record<EpisodeChoice, Pool>> = {
  planet: {
    ask: [
      'The municipal council adjourns before hearing the residents. Their objections remain on the docket.',
      'The consent office is open on Tuesdays. It is not Tuesday, and on this world it will not be Tuesday for nine years.',
      'The residents are asked and do answer, in a referendum whose result is sealed until the couch has left the system.',
      'Everyone agrees to be consulted. Nobody agrees on who is consulted first, and that question has a queue of its own.',
      'The elders grant permission, read the couch’s seating plan, and withdraw it.',
      'The request goes to a subcommittee, which forms a smaller subcommittee, which adjourns to go and look at the couch.',
    ],
    document: [
      'The archives return a receipt, not the missing evidence. Someone altered the filing dates.',
      'The only witness is a filing cabinet, and its lawyer has advised it not to open.',
      'The evidence exists. It is printed on the side of a bus that left this morning.',
      'The registry produces the file with every word redacted except the page numbers, which are wrong.',
      'The census lists the problem as resolved, in a year that has not happened yet.',
      'The archivist hands over the proof in a script nobody aboard can read, and then waits pointedly for a tip.',
    ],
    override: [
      'The immediate danger recedes, but the locals reject the couch as an unelected emergency service.',
      'The crisis stops, and so does the only bus route in town, for reasons the couch still cannot explain.',
      'The couch fixes the problem so thoroughly that three local jobs go with it. The former workers write a long letter.',
      'The rescue holds for exactly one afternoon. The plaque commemorating it is taken down the next morning.',
      'The force bubble is used as a battering ram, a use the manual does not cover. The problem bounces.',
      'The couch charges in, and the locals politely charge it back out, for parking.',
    ],
  },
  casino: {
    ask: [
      'Management sells tickets to the hearing but refuses to let the giant host testify.',
      'The host is ready to speak, but the house has scheduled the testimony for the same minute as the jackpot draw.',
      'Management agrees the host may answer, provided the host answers only in odds.',
      'The host’s answer is entered into the record and immediately bought by a high roller as a collectible.',
      'The pit boss says the host is on a break. The host has been on a break for eleven hundred years.',
      'The house supplies an interpreter for the host. The interpreter is a slot machine.',
    ],
    document: [
      'The house impounds the ledgers under a new confidentiality tariff.',
      'The ledgers turn up in lost property beside four hundred umbrellas and one confession, none of them claimed.',
      'The accountant agrees to produce the books, then performs a magic act in which the books disappear.',
      'Every receipt in the casino is printed in ink that fades as soon as it leaves the building.',
      'The audit trail ends at a door marked STAFF ONLY. Behind it is another door marked STAFF ONLY, and a bored croupier.',
      'The evidence is offered as a raffle prize. The couch buys forty tickets and wins a fruit basket.',
    ],
    override: [
      'The casino security contract identifies the intervention as an unauthorized jackpot.',
      'Security walks the crew out through the gift shop, which is the only exit and charges admission.',
      'The intervention trips every alarm on the floor. The players assume it is a bonus round and stay seated.',
      'The couch drives the house off the host’s surface. The house comps the couch a buffet, out of spite.',
      'The crew pulls the plug on the great wheel. The wheel, it turns out, was load-bearing.',
      'House security tackles the captain gently, the way one tackles a regular.',
    ],
  },
  serendipity: {
    ask: [
      'Vox arranges a table for mediation; the landlord sends a rent collector instead.',
      'Vox calls a meeting of the franchise. The franchise sends its apologies, and the apologies send a bill.',
      'The regulars are asked what they want. They want another round. It does not answer the question, and it does.',
      'The landlord agrees to listen for the length of one song, chooses the song, and the song is eleven seconds long.',
      'Vox pours a round for the negotiation. The negotiation drinks it and leaves.',
      'The owners will talk only through the jukebox, and the jukebox only takes sad requests.',
    ],
    document: [
      'The franchise’s receipts are suddenly listed as proprietary starlight.',
      'The only evidence is the bar tab, which is in Vox’s handwriting, which the bar’s insurer declines to read.',
      'The receipts are in a tardigrade-sized safe under the bar that only Vox can open, and Vox is serving.',
      'Every record in the bar was kept on coasters. Last night was a busy night.',
      'The franchise produces its books. They are novels, unrelated to the case, and not very good.',
      'The camera saw everything, from behind a potted plant that someone moved halfway through.',
    ],
    override: [
      'The bar’s repair drones restore the machinery before anyone can discuss consent.',
      'The crew fixes the bar by force and is barred from it by the same force.',
      'The lights come up for closing time in the middle of the intervention, and everyone has to look at everyone.',
      'The couch reroutes the bar’s power. The karaoke machine survives. Nothing else does.',
      'The intervention clears the room. Vox notes, quietly, that clearing the room is the barkeep’s job.',
      'The repairs go well until the franchise invoices the couch for improvements.',
    ],
  },
  constellation: {
    ask: [
      'The omens arrive at the wrong committee and the witnesses refuse a second hearing.',
      'The witnesses will talk only under the right stars, which set an hour ago.',
      'The omen grants permission in the form of a horoscope that applies equally to everyone.',
      'The people under the sign agree to speak, then remember the sign warned them about strangers on furniture.',
      'The star-readers grant an audience and spend it reading the captain’s palm.',
      'The keepers of the constellation accept the request and file it under next retrograde.',
    ],
    document: [
      'The star chart’s original ink goes dark before the final clue can be copied.',
      'The clue is copied perfectly onto the back of the captain’s hand and washed off before dinner.',
      'The ancient chart is found framed, upside down, in a gift shop that will not sell it.',
      'The crew photographs the stars. The stars move, as stars have every right to.',
      'The prophecy is transcribed in full and turns out to be the terms and conditions.',
      'The only copy of the star map is a tattoo, and its owner has gone swimming.',
    ],
    override: [
      'The shortcut reaches the gate but the constellation will not open it on command.',
      'The couch flies straight at the omen, which steps aside like a matador.',
      'The shortcut through the constellation comes out at its beginning, facing the wrong way.',
      'The crew forces the prophecy early. It arrives unfinished, like a cake taken out at half time.',
      'The force bubble pushes on the star gate. The star gate pushes back, harder, and with more tradition.',
      'The shortcut works, but it was the omen’s shortcut, and the omen wants it back.',
    ],
  },
  nemesis: {
    ask: [
      'The adversary sends a lawyer instead of agreeing to terms.',
      'The enemy agrees to talk and sends its answering machine, which has been briefed better than the crew.',
      'Terms are offered. The adversary replies with a counter-offer printed on the back of the couch’s own terms.',
      'The nemesis accepts a meeting, sits in the captain’s seat and will not move until the agenda changes.',
      'The adversary answers on the record. Unfortunately it is the adversary’s record.',
      'The villain answers the offer of terms with one word, “maybe,” and a gift basket that ticks.',
    ],
    document: [
      'The transmission is intercepted and returned stamped EVIDENCE DENIED.',
      'The evidence reaches the tribunal, which the nemesis quietly bought last week, along with its chairs.',
      'The proof is filed in triplicate. The adversary files a fourth copy, which says something else.',
      'The crew publishes everything. The nemesis publishes a review of it: two stars, would not be interfered with again.',
      'The dossier is complete except for the page that proves anything, which has been replaced with a menu.',
      'The tribunal accepts the evidence and loses it in the same breath, with what looks like real regret.',
    ],
    override: [
      'The villain anticipated the maneuver and filed the counterattack in triplicate.',
      'The couch charges. The adversary steps aside and lets it charge into a press conference.',
      'The nemesis lets the crew win the skirmish so it can photograph them winning it.',
      'The strike lands on a decoy, a very good one with the enemy’s face and none of the enemy’s plans.',
      'The couch breaks up the operation. The operation re-forms behind it, like a queue.',
      'The attack succeeds against everything except the actual plan.',
    ],
  },
}

/** How the crew walks into a crew member's personal errand. */
export const ERRAND_ENTRANCES: Record<'careful' | 'bold', Pool> = {
  careful: [
    'The crew acts quietly. For a moment it almost works.',
    'The crew goes in on tiptoe, which on a couch means everyone lifting their feet at the same time.',
    'The crew moves slowly enough to be mistaken for scenery. Somebody tries to sit on them.',
    'The crew asks nicely, asks again more nicely, and waits. The waiting is noticed.',
    'The crew slips in by the service entrance. It is a small entrance, and the couch is very red.',
    'The crew whispers the plan to one another and gets three different plans back.',
    'The crew takes the cautious route, which is longer and darker and full of other people who took the cautious route.',
    'The crew arrives in plain clothes. The couch, which has no plain clothes, waits round the corner and is spotted at once.',
    'The crew goes in one at a time, at polite intervals, like guests arriving at a party nobody wants to be first at.',
  ],
  bold: [
    'The crew makes an entrance that will be difficult to apologize for.',
    'The crew arrives at speed, armrest first, and the room rearranges itself around them.',
    'The crew announces itself by name and rank, including two ranks nobody has heard of.',
    'The couch comes in low and fast and parks on the problem.',
    'The crew kicks the door in. It is a revolving door, which complicates the moment.',
    'The crew charges, the force bubble humming like a kettle that is about to have opinions.',
    'The crew walks straight in at the front, on the theory that nobody guards the front against a sofa.',
    'The crew arrives with the cushions plumped, the lamp lit and every intention of being remembered.',
    'The couch reverses into the building, which is the only way it knows how to park.',
  ],
}

/** What a resolved errand leaves behind, by how the crew went in. */
export const ERRAND_AFTERMATH: Record<'switched' | 'bold' | 'careful', Pool> = {
  switched: [
    'The plan changes at the last second; the crew must live with the first gamble as well as the final order.',
    'Halfway through, the plan changes. Nobody tells the first plan, which has to find out from the second.',
    'The crew switches tactics mid-stride. Both tactics will appear on the invoice.',
    'The captain changes the order at the last moment, and the crew pretend they saw it coming.',
    'Plan A is abandoned for plan B, and spends the rest of the day sulking behind the backrest.',
    'The approach changes in the doorway, so the crew arrive one way and leave another, and are blamed for both.',
    'The crew start one plan and finish another. The paperwork is filed under both, to be safe.',
    'The order is reversed on the threshold. The couch, which was already reversing, is unbothered.',
    'Two plans were used, in sequence, by the same people. The witnesses are still arguing about the join.',
  ],
  bold: [
    'The first explosion is still visible from orbit.',
    'Nobody on that world will forget the couch, though several will try professionally.',
    'A local band has already written a song about the noise. It is in a minor key.',
    'The insurance claim is filed before the dust settles, partly by the dust.',
    'The crater is named after the couch, with an asterisk.',
    'The local news runs the footage in slow motion, twice, then with music.',
    'The force bubble has a new scorch mark, which the crew agree to call a pattern.',
    'Somewhere on that world, a souvenir stall is already selling small red couches.',
    'The shockwave is measured on four neighbouring worlds. One of them sends a polite note.',
  ],
  careful: [
    'The captain keeps the promise made before the trap appeared.',
    'The quiet approach holds to the end, which nobody aboard mentions in case it hears.',
    'Not one door was broken. One was held open, and thanked.',
    'The crew leave the place as they found it, minus the trouble, plus a thank-you note.',
    'It is all done so softly that the locals assume it was their idea, and in a sense it was.',
    'The only evidence the couch was there is a slight dent in a cushion and a much better afternoon.',
    'Nobody is hurt, nothing is broken, and the crew are faintly disappointed not to have a story.',
    'The crew tidy up before leaving, which the locals find more unsettling than any explosion.',
    'The quiet way takes three hours longer and saves a whole street. The crew take the three hours.',
  ],
}

/** The coda on a constellation quest, by the order given. */
export const CONSTELLATION_CODAS: Record<EpisodeChoice, Pool> = {
  ask: [
    'You listen to the people caught in the omen.',
    'The people under the sign are asked what they want from their own sky, and are surprised to be asked.',
    'The captain lets the witnesses tell the omen in their own order, which is not chronological.',
    'Everyone under the stars is heard, including a goat who has clearly been waiting for this.',
    'The omen is explained to the crew by the people it happened to, slowly, with diagrams.',
    'The crew sits under the constellation and lets the locals do the pointing.',
  ],
  document: [
    'The truth joins the official star chart.',
    'The crew pencils the truth onto the star chart, then inks it, then laminates it.',
    'The finding is filed with three observatories, so that at least one of them is looking.',
    'The star chart is corrected in public. Two astrologers resign; one takes it rather well.',
    'The evidence is written up and pinned to the inside of the force bubble, where the stars can read it too.',
    'The record goes into the sky’s own archive, which turns out to be a very old woman with a very good memory.',
  ],
  override: [
    'The captain takes the risky shortcut.',
    'The captain points the couch at the omen and does not slow down.',
    'The crew skips the prophecy’s middle chapters, which the prophecy takes personally.',
    'The captain cuts straight across the constellation, through two signs and part of a third.',
    'The couch takes the omen’s shortcut, the one with the warning sign that has been turned to face the wall.',
    'The captain declares the prophecy fulfilled early, and the stars have to hurry to catch up.',
  ],
}

/** Act openers: the act heading is fixed; what the galaxy sends varies by voyage. */
export const ACT_TWO_OPENINGS: Pool = [
  'ACT II: UNWELCOME RESPONSIBILITY. Word of the couch has spread, and the galaxy has responded the way galaxies do: with forms. It has also sent three crates of supplies, itemized, with a survey about the delivery. The chart now shows systems that were not there before, or were not willing to be seen.',
  'ACT II: UNWELCOME RESPONSIBILITY. The couch is famous now, in the way a pothole is famous. Three crates of supplies arrive from a fan club that would like a signed cushion. The chart unfolds to twice its size and is still somehow too small.',
  'ACT II: UNWELCOME RESPONSIBILITY. A galactic directory lists the couch under “Emergency Services (Upholstered).” The calls start at once. Three crates of supplies arrive, with a note asking that the couch please stop being so helpful, and some more systems appear on the chart to ask for help.',
  'ACT II: UNWELCOME RESPONSIBILITY. The first act is reviewed in a trade journal, which calls it “promising, if soft.” Three crates of supplies are delivered by a courier who wants a photograph with the armrest. The chart has grown new systems overnight, like mushrooms.',
  'ACT II: UNWELCOME RESPONSIBILITY. Somebody has made a fan map of the couch’s route, and it is more accurate than the official one. Three crates of supplies arrive, labelled FRAGILE, which they are not. The chart widens to systems that had been hoping not to be noticed.',
  'ACT II: UNWELCOME RESPONSIBILITY. The couch has been given a reputation without being consulted. It arrives as three crates of supplies, a formal commendation and a stack of complaints, all from the same office. The chart now shows the systems that heard.',
]

export const ACT_THREE_OPENINGS: Pool = [
  'ACT III: THE LAST COMMAND. The chart has run out of systems that have not heard of the couch. Every route now leads, eventually, to the jump gate, where something is waiting. Two crates of supplies arrive with a card that says, in full, “Good luck.”',
  'ACT III: THE LAST COMMAND. The couch’s fan map and the official chart finally agree, and both of them end at the jump gate. Two crates of supplies arrive with no sender, only the word “Sorry” written on the side of each.',
  'ACT III: THE LAST COMMAND. Every system left on the chart has an opinion about the couch, and every route bends toward the jump gate. Two crates of supplies arrive. One of them is mostly a farewell card, signed by a whole planet.',
  'ACT III: THE LAST COMMAND. The galaxy has stopped asking what the couch is and started asking what it will do. Two crates of supplies come with a printed itinerary, and the itinerary ends at the jump gate in very large letters.',
  'ACT III: THE LAST COMMAND. The cushions have taken the shape of the people sitting on them, which the crew decides to take as a compliment. Two crates of supplies arrive. The jump gate is now on every route, like a toll booth with a grudge.',
  'ACT III: THE LAST COMMAND. The chart closes in around the jump gate the way a story closes in around its ending. Two crates of supplies arrive with a receipt marked FINAL. The crew decide not to read too much into it, and do.',
]

/** The last line before the finale orders. */
export const FINALE_LINES: Pool = [
  'Your nemesis waits at the jump gate. The force bubble holds. On the cushions, the crew would like a word about what kind of captain you turned out to be.',
  'The jump gate opens onto your nemesis, who has been waiting long enough to bring a chair. The force bubble holds. The crew look at you, and then, pointedly, at each other.',
  'Your nemesis is at the jump gate, on time and better dressed. The couch hovers in its force bubble, and the crew wait to see which captain you decide to be at the last minute.',
  'The jump gate is the last stop, and your nemesis is standing in it. The force bubble holds. Someone on the cushions whispers, “Well, this is it,” and is shushed by everyone else.',
  'At the jump gate your nemesis has set out a table, two chairs and an agenda. The couch, which brought its own seating, hovers patiently. The crew would like to know the plan.',
  'Your nemesis waits at the jump gate with the patience of something that has read the whole log. The force bubble holds. On the cushions, nobody is pretending to be relaxed.',
]

/** Pick a line for this voyage; distinct for counts below the pool length. */
export function freshLine(
  pool: Pool,
  key: string,
  seed: number,
  count: number,
): string {
  return transitLine(pool, key, seed, count)
}

/** The captain's mission order, said back to them. Counted by earlier uses of the same order. */
export const POLICY_LINES: Record<
  'aid' | 'aidShort' | 'observe' | 'intervene' | 'interveneShort',
  Pool
> = {
  aid: [
    'You offer help and ask first. It costs supplies, and the people you helped get to decide what happens next.',
    'You offer the crates and wait to be told where they go. They go somewhere you would not have chosen, which is the point.',
    'You ask what is needed and bring that, rather than what the couch had in the back. It costs supplies and saves an argument.',
    'You hand over supplies and a pen. The locals write their own plan on the back of the delivery note.',
    'You help, after asking, and then stop helping when asked. The second part is harder and better received.',
    'You offer aid with no conditions except a receipt. The receipt is written in the locals’ own language and kept by them.',
  ],
  aidShort: [
    'You arrive without the promised crates. Locals welcome the volunteer effort, but the material aid they requested cannot be delivered.',
    'You turn up with good intentions and an empty hold. The locals are kind about it, the way people are kind about a cake that did not rise.',
    'You offer help, then discover the crates are imaginary. The crew volunteers its hands instead, which are welcome but not medicine.',
    'The aid is promised and the cupboard is bare. The locals thank the crew for coming and make a note of what is still owed.',
  ],
  observe: [
    'You keep your distance and keep a record. The treaty is intact, and so is the record of what you watched.',
    'You watch, take notes and do not interfere. The notes are excellent. The people in them will not read them.',
    'You hold position and let the planet sort it out. The couch has never been so still, or so uncomfortable.',
    'You observe from a respectful orbit. Somebody down there looks up and waves, which does not help.',
    'You stay out of it, as the treaty says. The crew sits on its hands, which on a couch means sitting on the cushions very hard.',
    'You watch and record. The record is honest, which is the least and, today, the most the couch can offer.',
  ],
  intervene: [
    'You act without permission. It works quickly, and the paperwork will take years.',
    'You step in uninvited. The problem stops at once, and the locals start a much longer conversation about who asked you.',
    'You override the locals and fix it yourself. It is fixed. It is also, now, your fault, permanently.',
    'You go in without asking. The rescue is quick and clean, and the apology will take three planetary sessions to draft.',
    'You decide for them. You are right, as it happens, which makes it no easier for anybody.',
    'You intervene. It works. A statue of the couch is proposed and then voted down as an insult.',
  ],
  interveneShort: [
    'You intervene without enough resources. The improvised operation succeeds in claiming authority, but the unfinished work earns additional outrage.',
    'You take charge with nothing in the hold. The couch is in charge of a mess it cannot pay for, and everyone can see that.',
    'You intervene on credit. The locals are left holding half a rescue and the other half of the bill.',
    'You storm in with empty crates. The authority is taken; the help it promised is not delivered.',
  ],
}

/** A crew errand returns to a world it has been to before. */
export const ERRAND_CALLBACKS: Record<'bold' | 'careful', Pool> = {
  bold: [
    'The public attention follows the couch here.',
    'The couch’s reputation arrived first and has already given interviews.',
    'A small crowd is waiting, holding signs. Some of the signs are friendly.',
    'Last time made the news, and the news has followed the couch here with a camera.',
    'Locals recognise the couch from the footage and step back a respectful distance, then a little further.',
    'A tour bus has added the couch’s last stop to its route and is parked there now, honking.',
    'The local paper runs an editorial titled “Must It Hover?” The answer, as ever, is yes.',
    'Somebody is selling T-shirts with the couch on them. The couch on the T-shirts is a different colour, and on fire.',
    'A queue has formed for autographs. The crew sign, and then so, at some length, does the couch’s lamp.',
  ],
  careful: [
    'People remember that you kept their confidence.',
    'Somebody leaves a thank-you note under the armrest without signing it.',
    'The locals do not mention the last visit, which is how they say thank you.',
    'A door that was locked last time is now left on the latch.',
    'Nobody here talks about the couch, which is exactly what was asked of them.',
    'A pot of tea is waiting, still warm, with no note and the right number of cups.',
    'The person the crew helped last time is here, pretending very hard not to know them.',
    'The couch is waved into a quiet side street that was not on any map last visit.',
    'Somebody has kept a cushion-shaped space free on the bench outside, just in case.',
  ],
}
